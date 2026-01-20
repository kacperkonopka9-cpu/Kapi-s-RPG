/**
 * LevelUpCalculator - D&D 5e Level Progression System
 *
 * Features:
 * - Check level up eligibility (XP thresholds)
 * - Calculate HP increases (hit die + Con modifier)
 * - Grant class features at each level
 * - Handle Ability Score Improvements (ASI)
 * - Recalculate derived stats (modifiers, AC, HP)
 * - Persist level up changes with Git commit
 * - Result Object pattern (no exceptions)
 * - Dependency injection for testability
 *
 * Implements D&D 5e level progression system (levels 1-20) with automated
 * stat calculations, class feature grants, and retroactive Constitution HP bonuses.
 *
 * @module src/mechanics/level-up-calculator
 */

const fs = require('fs').promises;
const yaml = require('js-yaml');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class LevelUpCalculator {
  /**
   * Creates a new LevelUpCalculator instance
   *
   * @param {Object} deps - Dependencies (for testing)
   * @param {Object} deps.diceRoller - DiceRoller instance
   * @param {Object} deps.characterManager - CharacterManager instance
   * @param {Object} deps.inventoryManager - InventoryManager instance (for AC recalculation)
   * @param {Object} deps.fileReader - File system reader (default: fs.promises)
   * @param {Object} deps.yamlParser - YAML parser (default: js-yaml)
   *
   * @example
   * // Default dependencies
   * const calculator = new LevelUpCalculator();
   *
   * // Custom dependencies for testing
   * const calculator = new LevelUpCalculator({
   *   diceRoller: mockDiceRoller,
   *   characterManager: mockCharacterManager
   * });
   */
  constructor(deps = {}) {
    // Dependency injection for testability
    this.diceRoller = deps.diceRoller || null;  // Will be loaded lazily if needed
    this.characterManager = deps.characterManager || null;
    this.inventoryManager = deps.inventoryManager || null;
    this.fileReader = deps.fileReader || fs;
    this.yamlParser = deps.yamlParser || yaml;

    // Cache for XP thresholds and class features (loaded once per session)
    this.xpThresholds = null;
    this.classFeatures = null;
  }

  /**
   * Load XP thresholds from YAML file
   *
   * @private
   * @returns {Promise<ResultObject>} XP thresholds map or error
   */
  async _loadXPThresholds() {
    try {
      if (this.xpThresholds) {
        return { success: true, data: this.xpThresholds, error: null };
      }

      const filePath = 'data/srd/xp-thresholds.yaml';
      const fileContent = await this.fileReader.readFile(filePath, 'utf8');
      const parsed = this.yamlParser.load(fileContent);

      if (!parsed || !parsed.xp_thresholds) {
        return {
          success: false,
          data: null,
          error: 'Invalid XP thresholds file: expected {xp_thresholds: {...}}'
        };
      }

      this.xpThresholds = parsed.xp_thresholds;

      return { success: true, data: this.xpThresholds, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Failed to load XP thresholds: ${error.message}`
      };
    }
  }

  /**
   * Load class features from YAML file
   *
   * @private
   * @returns {Promise<ResultObject>} Class features map or error
   */
  async _loadClassFeatures() {
    try {
      if (this.classFeatures) {
        return { success: true, data: this.classFeatures, error: null };
      }

      const filePath = 'data/srd/classes.yaml';
      const fileContent = await this.fileReader.readFile(filePath, 'utf8');
      const parsed = this.yamlParser.load(fileContent);

      if (!parsed || !parsed.classes) {
        return {
          success: false,
          data: null,
          error: 'Invalid classes file: expected {classes: {...}}'
        };
      }

      this.classFeatures = parsed.classes;

      return { success: true, data: this.classFeatures, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Failed to load class features: ${error.message}`
      };
    }
  }

  /**
   * Check if character is eligible to level up
   *
   * @param {Object} character - Character object
   * @returns {Promise<ResultObject>} Eligibility result
   *
   * @example
   * const result = await calculator.canLevelUp(character);
   * // {success: true, data: {canLevel: true, currentLevel: 3, nextLevel: 4, xpNeeded: 2700}}
   */
  async canLevelUp(character) {
    try {
      // Validate character
      if (!character || typeof character.level !== 'number' || typeof character.experience !== 'number') {
        return {
          success: false,
          data: null,
          error: 'Invalid character: must have level and experience properties'
        };
      }

      const currentLevel = character.level;

      // Level 20 is max
      if (currentLevel >= 20) {
        return {
          success: true,
          data: {
            canLevel: false,
            currentLevel: 20,
            nextLevel: null,
            xpNeeded: null,
            reason: 'Maximum level reached'
          },
          error: null
        };
      }

      // Load XP thresholds
      const thresholdsResult = await this._loadXPThresholds();
      if (!thresholdsResult.success) {
        return thresholdsResult;
      }

      const nextLevel = currentLevel + 1;
      const xpNeeded = thresholdsResult.data[nextLevel];

      if (xpNeeded === undefined) {
        return {
          success: false,
          data: null,
          error: `No XP threshold found for level ${nextLevel}`
        };
      }

      const canLevel = character.experience >= xpNeeded;

      return {
        success: true,
        data: {
          canLevel,
          currentLevel,
          nextLevel,
          xpNeeded
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `canLevelUp failed: ${error.message}`
      };
    }
  }

  /**
   * Calculate HP increase for level up
   *
   * @private
   * @param {Object} character - Character object
   * @param {Object} options - Options (manualHP for fixed value)
   * @returns {Promise<ResultObject>} HP increase details
   */
  async _calculateHPIncrease(character, options = {}) {
    try {
      // Map class to hit die
      const hitDiceMap = {
        fighter: 'd10',
        cleric: 'd8',
        rogue: 'd8',
        wizard: 'd6',
        barbarian: 'd12'
      };

      const className = character.class?.toLowerCase();
      const hitDie = hitDiceMap[className];

      if (!hitDie) {
        return {
          success: false,
          data: null,
          error: `Unknown class: ${character.class}. Supported: Fighter, Cleric, Rogue, Wizard`
        };
      }

      // Calculate Constitution modifier
      const conScore = character.abilities?.constitution || 10;
      const conModifier = Math.floor((conScore - 10) / 2);

      let hpRoll;
      let hpIncrease;

      // Manual HP override (for taking average instead of rolling)
      if (options.manualHP !== undefined) {
        hpRoll = options.manualHP;
        hpIncrease = hpRoll + conModifier;
      } else {
        // Roll hit die
        if (!this.diceRoller) {
          // Lazy load DiceRoller if not injected
          const DiceRoller = require('./dice-roller');
          this.diceRoller = new DiceRoller();
        }

        const rollResult = await this.diceRoller.roll(`1${hitDie}`);
        if (!rollResult.success) {
          return rollResult;
        }

        hpRoll = rollResult.data.total;
        hpIncrease = hpRoll + conModifier;
      }

      // Minimum 1 HP per level
      if (hpIncrease < 1) {
        hpIncrease = 1;
      }

      return {
        success: true,
        data: {
          hpRoll,
          conModifier,
          hpIncrease
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `HP calculation failed: ${error.message}`
      };
    }
  }

  /**
   * Query class features for a specific level
   *
   * @private
   * @param {string} className - Class name
   * @param {number} level - Level to query
   * @returns {Promise<ResultObject>} Features for that level
   */
  async _grantClassFeatures(className, level) {
    try {
      // Load class features
      const featuresResult = await this._loadClassFeatures();
      if (!featuresResult.success) {
        return featuresResult;
      }

      const classData = featuresResult.data[className.toLowerCase()];
      if (!classData) {
        return {
          success: false,
          data: null,
          error: `Class not found: ${className}`
        };
      }

      const features = classData.features[level] || [];

      return {
        success: true,
        data: features,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Feature grant failed: ${error.message}`
      };
    }
  }

  /**
   * Recalculate derived stats after level up or ASI
   *
   * @private
   * @param {Object} character - Character object
   * @param {Object} oldAbilities - Previous ability scores (for retroactive HP)
   * @returns {Promise<ResultObject>} Recalculated stats
   */
  async _recalculateDerivedStats(character, oldAbilities) {
    try {
      const recalculated = [];

      // Recalculate ability modifiers
      for (const ability in character.abilities) {
        const score = character.abilities[ability];
        const modifier = Math.floor((score - 10) / 2);
        character.abilities[`${ability}Modifier`] = modifier;
      }
      recalculated.push('abilityModifiers');

      // Recalculate proficiency bonus
      const proficiencyBonus = Math.ceil(character.level / 4) + 1;
      character.proficiencyBonus = proficiencyBonus;
      recalculated.push('proficiencyBonus');

      // Recalculate AC if Dexterity changed
      if (oldAbilities && oldAbilities.dexterity !== character.abilities.dexterity) {
        if (this.inventoryManager) {
          const newAC = this.inventoryManager._recalculateAC(character);
          character.armorClass = newAC;
          recalculated.push('armorClass');
        }
      }

      // Retroactive Constitution HP bonus
      if (oldAbilities && oldAbilities.constitution !== character.abilities.constitution) {
        const oldConMod = Math.floor((oldAbilities.constitution - 10) / 2);
        const newConMod = Math.floor((character.abilities.constitution - 10) / 2);
        const conModDiff = newConMod - oldConMod;

        if (conModDiff !== 0) {
          const retroactiveHP = conModDiff * character.level;
          character.hitPoints.max += retroactiveHP;
          character.hitPoints.current += retroactiveHP;
          recalculated.push(`hitPointsRetroactive(+${retroactiveHP})`);
        }
      }

      return {
        success: true,
        data: recalculated,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Derived stat recalculation failed: ${error.message}`
      };
    }
  }

  /**
   * Apply Ability Score Improvement (ASI)
   *
   * @param {Object} character - Character object
   * @param {Object} choices - ASI choices
   * @param {string} choices.option - '+2 to one' or '+1 to two'
   * @param {string[]} choices.abilities - Array of ability names to improve
   * @returns {Promise<ResultObject>} Updated character
   *
   * @example
   * const result = await calculator.applyAbilityScoreImprovement(character, {
   *   option: '+2 to one',
   *   abilities: ['strength']
   * });
   */
  async applyAbilityScoreImprovement(character, choices) {
    try {
      // Validate choices
      if (!choices || !choices.option || !Array.isArray(choices.abilities)) {
        return {
          success: false,
          data: null,
          error: 'Invalid ASI choices: must provide {option, abilities}'
        };
      }

      // Store old abilities for retroactive calculations
      const oldAbilities = { ...character.abilities };

      let appliedIncreases = [];

      if (choices.option === '+2 to one') {
        if (choices.abilities.length !== 1) {
          return {
            success: false,
            data: null,
            error: 'Option "+2 to one" requires exactly 1 ability'
          };
        }

        const ability = choices.abilities[0];
        const currentScore = character.abilities[ability];

        if (currentScore === undefined) {
          return {
            success: false,
            data: null,
            error: `Unknown ability: ${ability}`
          };
        }

        // Apply increase (capped at 20)
        const increase = Math.min(2, 20 - currentScore);
        character.abilities[ability] += increase;

        appliedIncreases.push({ ability, increase });

        if (increase < 2) {
          return {
            success: true,
            data: {
              updatedAbilities: character.abilities,
              appliedIncreases,
              warning: `Ability ${ability} capped at 20 (only +${increase} applied)`
            },
            error: null
          };
        }
      } else if (choices.option === '+1 to two') {
        if (choices.abilities.length !== 2) {
          return {
            success: false,
            data: null,
            error: 'Option "+1 to two" requires exactly 2 abilities'
          };
        }

        for (const ability of choices.abilities) {
          const currentScore = character.abilities[ability];

          if (currentScore === undefined) {
            return {
              success: false,
              data: null,
              error: `Unknown ability: ${ability}`
            };
          }

          // Apply increase (capped at 20)
          const increase = Math.min(1, 20 - currentScore);
          character.abilities[ability] += increase;

          appliedIncreases.push({ ability, increase });
        }
      } else {
        return {
          success: false,
          data: null,
          error: 'Invalid ASI option: must be "+2 to one" or "+1 to two"'
        };
      }

      // Recalculate derived stats
      const recalcResult = await this._recalculateDerivedStats(character, oldAbilities);
      if (!recalcResult.success) {
        return recalcResult;
      }

      return {
        success: true,
        data: {
          updatedAbilities: character.abilities,
          appliedIncreases,
          derivedStatsRecalculated: recalcResult.data
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `ASI application failed: ${error.message}`
      };
    }
  }

  /**
   * Persist level up changes to character file and create Git commit
   *
   * @private
   * @param {Object} character - Character object
   * @param {string} characterId - Character ID
   * @returns {Promise<ResultObject>} Persistence result
   */
  async _persistLevelUp(character, characterId) {
    try {
      // Save character using CharacterManager if available
      if (this.characterManager) {
        const saveResult = await this.characterManager.saveCharacter(characterId, character);
        if (!saveResult.success) {
          return saveResult;
        }
      }

      // Create Git commit
      const commitMessage = `Level Up: ${character.name} reaches level ${character.level}

🎉 Generated with Claude Code
`;

      try {
        await execAsync(`git add characters/${characterId}.yaml`);
        await execAsync(`git commit -m "${commitMessage}"`);
      } catch (gitError) {
        // Git commit failure is non-fatal (might not be in a Git repo)
        console.warn(`Git commit failed: ${gitError.message}`);
      }

      return {
        success: true,
        data: null,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Persistence failed: ${error.message}`
      };
    }
  }

  /**
   * Execute level up for a character
   *
   * @param {Object} character - Character object
   * @param {Object} options - Level up options
   * @param {number} options.manualHP - Manual HP value (skip rolling)
   * @param {Object} options.asiChoices - ASI choices if this is an ASI level
   * @param {string} options.characterId - Character ID for persistence
   * @returns {Promise<ResultObject>} Level up result
   *
   * @example
   * const result = await calculator.levelUp(character, {
   *   characterId: 'kapi',
   *   asiChoices: {option: '+2 to one', abilities: ['strength']}
   * });
   */
  async levelUp(character, options = {}) {
    try {
      // Check multiclass (not supported)
      if (Array.isArray(character.classes) && character.classes.length > 1) {
        return {
          success: false,
          data: null,
          error: 'Multiclassing not yet supported (planned for Epic 5)'
        };
      }

      // Check eligibility
      const eligibilityResult = await this.canLevelUp(character);
      if (!eligibilityResult.success) {
        return eligibilityResult;
      }

      if (!eligibilityResult.data.canLevel) {
        return {
          success: false,
          data: null,
          error: `Cannot level up: ${eligibilityResult.data.reason || 'Not enough XP'}`
        };
      }

      const oldLevel = character.level;
      const newLevel = oldLevel + 1;

      // Store old abilities for retroactive calculations
      const oldAbilities = { ...character.abilities };

      // Calculate HP increase
      const hpResult = await this._calculateHPIncrease(character, options);
      if (!hpResult.success) {
        return hpResult;
      }

      // Increment level
      character.level = newLevel;

      // Add HP
      character.hitPoints.max += hpResult.data.hpIncrease;
      character.hitPoints.current += hpResult.data.hpIncrease;

      // Add hit die
      if (!character.hitPoints.hitDice) {
        character.hitPoints.hitDice = { total: newLevel, spent: 0 };
      } else {
        character.hitPoints.hitDice.total += 1;
      }

      // Update proficiency bonus if crossing threshold
      const oldProficiency = character.proficiencyBonus || Math.ceil(oldLevel / 4) + 1;
      const newProficiency = Math.ceil(newLevel / 4) + 1;
      character.proficiencyBonus = newProficiency;

      // Grant class features
      const featuresResult = await this._grantClassFeatures(character.class, newLevel);
      if (!featuresResult.success) {
        return featuresResult;
      }

      const featuresGranted = featuresResult.data;

      // Add features to character
      if (!character.features) {
        character.features = [];
      }

      for (const feature of featuresGranted) {
        character.features.push({
          name: feature.name,
          description: feature.description,
          uses: feature.uses,
          maxUses: feature.maxUses,
          recharge: feature.recharge
        });
      }

      // Check if this is an ASI level
      const asiLevels = [4, 6, 8, 12, 14, 16, 19];  // Fighter gets extra ASIs at 6 and 14
      const standardASILevels = [4, 8, 12, 16, 19];

      let asiAvailable = false;
      if (character.class?.toLowerCase() === 'fighter') {
        asiAvailable = asiLevels.includes(newLevel);
      } else {
        asiAvailable = standardASILevels.includes(newLevel);
      }

      // Apply ASI if choices provided
      if (asiAvailable && options.asiChoices) {
        const asiResult = await this.applyAbilityScoreImprovement(character, options.asiChoices);
        if (!asiResult.success) {
          return asiResult;
        }
      } else {
        // Recalculate derived stats even without ASI
        const recalcResult = await this._recalculateDerivedStats(character, oldAbilities);
        if (!recalcResult.success) {
          return recalcResult;
        }
      }

      // Persist character
      if (options.characterId) {
        const persistResult = await this._persistLevelUp(character, options.characterId);
        if (!persistResult.success) {
          // Non-fatal, continue
          console.warn(`Persistence warning: ${persistResult.error}`);
        }
      }

      return {
        success: true,
        data: {
          newLevel,
          oldLevel,
          hpIncrease: hpResult.data.hpIncrease,
          hpRoll: hpResult.data.hpRoll,
          conModifier: hpResult.data.conModifier,
          newMaxHP: character.hitPoints.max,
          proficiencyBonus: newProficiency,
          proficiencyBonusChanged: newProficiency !== oldProficiency,
          featuresGranted,
          asiAvailable
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Level up failed: ${error.message}`
      };
    }
  }
}

module.exports = LevelUpCalculator;
