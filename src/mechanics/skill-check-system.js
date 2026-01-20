/**
 * SkillCheckSystem - Comprehensive D&D 5e skill check system
 *
 * Features:
 * - All 18 D&D 5e skills with proper ability mapping
 * - Proficiency and expertise support (double proficiency)
 * - Passive skill scores (10 + modifiers)
 * - Group skill checks (majority wins)
 * - Skill check contests (opposed rolls)
 * - Advantage/disadvantage mechanics
 * - Result Object pattern (no exceptions)
 * - Dependency injection for testability
 *
 * Extends AbilityCheckHandler functionality with expertise, passive scores,
 * group checks, and contests while maintaining backward compatibility.
 *
 * @module src/mechanics/skill-check-system
 */

const AbilityCheckHandler = require('./ability-check-handler');
const CharacterManager = require('./character-manager');

// Import SKILL_TO_ABILITY from AbilityCheckHandler to ensure consistency
// We'll extract it from the module since it's not exported directly
// For now, we'll define it locally (alternative: modify AbilityCheckHandler to export it)
const SKILL_TO_ABILITY = {
  // Strength skills
  athletics: 'strength',

  // Dexterity skills
  acrobatics: 'dexterity',
  sleight_of_hand: 'dexterity',
  stealth: 'dexterity',

  // Intelligence skills
  arcana: 'intelligence',
  history: 'intelligence',
  investigation: 'intelligence',
  nature: 'intelligence',
  religion: 'intelligence',

  // Wisdom skills
  animal_handling: 'wisdom',
  insight: 'wisdom',
  medicine: 'wisdom',
  perception: 'wisdom',
  survival: 'wisdom',

  // Charisma skills
  deception: 'charisma',
  intimidation: 'charisma',
  performance: 'charisma',
  persuasion: 'charisma'
};

class SkillCheckSystem {
  /**
   * Creates a new SkillCheckSystem instance
   *
   * @param {Object} deps - Dependencies (for testing)
   * @param {AbilityCheckHandler} deps.abilityCheckHandler - Ability check handler instance
   *
   * @example
   * // Default dependencies
   * const system = new SkillCheckSystem();
   *
   * // Custom dependencies for testing
   * const system = new SkillCheckSystem({
   *   abilityCheckHandler: mockAbilityCheckHandler
   * });
   */
  constructor(deps = {}) {
    this.abilityCheckHandler = deps.abilityCheckHandler || new AbilityCheckHandler(deps);
  }

  /**
   * Execute a skill check with expertise support
   *
   * Extends AbilityCheckHandler.makeSkillCheck() to add expertise (double proficiency).
   * Maintains backward compatibility with existing API.
   *
   * @param {Object} character - Character object with abilities, level, and proficiencies
   * @param {string} skill - Skill name (e.g., 'perception', 'stealth', 'athletics')
   * @param {number} dc - Difficulty Class
   * @param {Object} options - Check options
   * @param {boolean} options.advantage - Roll with advantage
   * @param {boolean} options.disadvantage - Roll with disadvantage
   * @returns {Promise<ResultObject>} Skill check result with expertise flag
   *
   * @example
   * const result = await system.makeSkillCheck(character, 'stealth', 15);
   * // {success: true, data: {passed: true, total: 18, roll: 14, abilityModifier: 2, proficiencyBonus: 2, expertise: false, dc: 15}, error: null}
   *
   * @example
   * // With expertise (double proficiency)
   * const result = await system.makeSkillCheck(expertCharacter, 'investigation', 15);
   * // {success: true, data: {passed: true, total: 20, roll: 12, abilityModifier: 2, proficiencyBonus: 4, expertise: true, dc: 15}, error: null}
   */
  async makeSkillCheck(character, skill, dc, options = {}) {
    try {
      // Validate skill name
      if (!skill || typeof skill !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Skill must be a non-empty string'
        };
      }

      const normalizedSkill = skill.toLowerCase();
      if (!(normalizedSkill in SKILL_TO_ABILITY)) {
        return {
          success: false,
          data: null,
          error: `Invalid skill: ${skill}`
        };
      }

      // Check for expertise
      const isExpert = character?.proficiencies?.expertise?.includes(normalizedSkill) || false;

      // If no expertise, delegate directly to AbilityCheckHandler
      if (!isExpert) {
        const result = await this.abilityCheckHandler.makeSkillCheck(character, skill, dc, options);

        // Add expertise flag, skill name, and ability to result data
        if (result.success && result.data) {
          result.data.expertise = false;
          result.data.skill = normalizedSkill;
          result.data.ability = SKILL_TO_ABILITY[normalizedSkill];
        }

        return result;
      }

      // Expertise handling: we need to modify the proficiency calculation
      // Since AbilityCheckHandler doesn't support expertise, we'll implement the check ourselves

      // Validate DC
      if (typeof dc !== 'number' || dc < 0) {
        return {
          success: false,
          data: null,
          error: 'DC must be a positive number'
        };
      }

      // Get ability for this skill
      const ability = SKILL_TO_ABILITY[normalizedSkill];

      // Get ability score and modifier
      if (!character || !character.abilities || !(ability in character.abilities)) {
        return {
          success: false,
          data: null,
          error: `Character missing ability: ${ability}`
        };
      }

      const abilityScore = character.abilities[ability];
      const abilityModifier = CharacterManager.getAbilityModifier(abilityScore);

      // Calculate proficiency bonus (doubled for expertise)
      let proficiencyBonus = 0;
      const isProficient = character.proficiencies?.skills?.includes(normalizedSkill) || false;

      if (isProficient && character.level) {
        const baseProficiency = CharacterManager.getProficiencyBonus(character.level);
        // Expertise doubles proficiency bonus
        proficiencyBonus = isExpert ? baseProficiency * 2 : baseProficiency;
      } else if (isExpert && !isProficient) {
        // Expertise requires proficiency - treat as proficient
        if (character.level) {
          const baseProficiency = CharacterManager.getProficiencyBonus(character.level);
          proficiencyBonus = baseProficiency * 2;
        }
      }

      // Handle advantage/disadvantage
      const { advantage, disadvantage } = options;
      const hasAdvantage = advantage && !disadvantage;
      const hasDisadvantage = disadvantage && !advantage;

      // Roll d20 using the abilityCheckHandler's diceRoller
      const rollOptions = {};
      if (hasAdvantage) rollOptions.advantage = true;
      if (hasDisadvantage) rollOptions.disadvantage = true;

      const rollResult = await this.abilityCheckHandler.diceRoller.roll('1d20', rollOptions);
      if (!rollResult.success) {
        return {
          success: false,
          data: null,
          error: `Dice roll failed: ${rollResult.error}`
        };
      }

      // Extract roll value
      let roll = rollResult.data.rolls[0];

      // Build result data
      const resultData = {
        passed: false,
        total: 0,
        roll,
        abilityModifier,
        proficiencyBonus,
        expertise: isExpert,
        skill: normalizedSkill,
        ability,
        dc
      };

      // Handle advantage/disadvantage to show both rolls
      if (hasAdvantage || hasDisadvantage) {
        const secondRoll = await this.abilityCheckHandler.diceRoller.roll('1d20');
        if (secondRoll.success) {
          const roll2 = secondRoll.data.rolls[0];
          const allRolls = hasAdvantage
            ? [Math.min(roll, roll2), Math.max(roll, roll2)]
            : [Math.max(roll, roll2), Math.min(roll, roll2)];
          resultData.rolls = allRolls;
          const selectedRoll = hasAdvantage ? Math.max(roll, roll2) : Math.min(roll, roll2);
          resultData.selectedRoll = selectedRoll;
          resultData.roll = selectedRoll;
          roll = selectedRoll;
        }
      }

      // Calculate total and check against DC
      const total = roll + abilityModifier + proficiencyBonus;
      resultData.total = total;
      resultData.passed = total >= dc;

      // Flag critical successes and failures
      if (roll === 20) {
        resultData.critical = 'success';
      } else if (roll === 1) {
        resultData.critical = 'failure';
      }

      return {
        success: true,
        data: resultData,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Skill check failed: ${error.message}`
      };
    }
  }

  /**
   * Calculate passive skill score
   *
   * Passive scores are used for automatic checks (e.g., Passive Perception).
   * Formula: 10 + ability modifier + proficiency bonus (if proficient)
   * If expertise, proficiency bonus is doubled.
   *
   * @param {Object} character - Character object with abilities, level, and proficiencies
   * @param {string} skill - Skill name (e.g., 'perception', 'insight')
   * @returns {Promise<ResultObject>} Passive score result
   *
   * @example
   * const result = await system.getPassiveScore(character, 'perception');
   * // {success: true, data: {passiveScore: 14, skill: 'perception', breakdown: '10 + 2 (wis) + 2 (prof)'}, error: null}
   */
  async getPassiveScore(character, skill) {
    try {
      // Validate skill name
      if (!skill || typeof skill !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Skill must be a non-empty string'
        };
      }

      const normalizedSkill = skill.toLowerCase();
      if (!(normalizedSkill in SKILL_TO_ABILITY)) {
        return {
          success: false,
          data: null,
          error: `Invalid skill: ${skill}`
        };
      }

      // Get ability for this skill
      const ability = SKILL_TO_ABILITY[normalizedSkill];

      // Get ability score and modifier
      if (!character || !character.abilities || !(ability in character.abilities)) {
        return {
          success: false,
          data: null,
          error: `Character missing ability: ${ability}`
        };
      }

      const abilityScore = character.abilities[ability];
      const abilityModifier = CharacterManager.getAbilityModifier(abilityScore);

      // Check proficiency and expertise
      const isProficient = character.proficiencies?.skills?.includes(normalizedSkill) || false;
      const isExpert = character.proficiencies?.expertise?.includes(normalizedSkill) || false;

      let proficiencyBonus = 0;
      if ((isProficient || isExpert) && character.level) {
        const baseProficiency = CharacterManager.getProficiencyBonus(character.level);
        proficiencyBonus = isExpert ? baseProficiency * 2 : baseProficiency;
      }

      // Calculate passive score: 10 + ability modifier + proficiency bonus
      const passiveScore = 10 + abilityModifier + proficiencyBonus;

      // Build breakdown string
      let breakdown = `10 + ${abilityModifier} (${ability.substring(0, 3)})`;
      if (proficiencyBonus > 0) {
        breakdown += ` + ${proficiencyBonus} (${isExpert ? 'expertise' : 'prof'})`;
      }

      return {
        success: true,
        data: {
          passiveScore,
          skill: normalizedSkill,
          breakdown
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Passive score calculation failed: ${error.message}`
      };
    }
  }

  /**
   * Execute a group skill check
   *
   * Each character rolls individually. Group passes if majority (>50%) passes.
   *
   * @param {Array<Object>} characters - Array of character objects
   * @param {string} skill - Skill name for all characters
   * @param {number} dc - Difficulty Class
   * @param {Object} options - Check options (applied to all characters)
   * @returns {Promise<ResultObject>} Group check result
   *
   * @example
   * const result = await system.makeGroupCheck([char1, char2, char3], 'stealth', 15);
   * // {success: true, data: {groupPassed: true, individualResults: [...], passCount: 2, failCount: 1, dc: 15}, error: null}
   */
  async makeGroupCheck(characters, skill, dc, options = {}) {
    try {
      // Validate characters array
      if (!Array.isArray(characters) || characters.length === 0) {
        return {
          success: false,
          data: null,
          error: 'Characters must be a non-empty array'
        };
      }

      // Roll skill check for each character
      const individualResults = [];
      let passCount = 0;
      let failCount = 0;

      for (const character of characters) {
        const result = await this.makeSkillCheck(character, skill, dc, options);

        if (!result.success) {
          // If individual check fails (validation error), propagate error
          return result;
        }

        const passed = result.data.passed;
        if (passed) {
          passCount++;
        } else {
          failCount++;
        }

        individualResults.push({
          character: character.name || 'Unknown',
          passed,
          total: result.data.total,
          roll: result.data.roll,
          proficiencyBonus: result.data.proficiencyBonus
        });
      }

      // Determine group success: majority passed (> 50%)
      const groupPassed = passCount > failCount;

      return {
        success: true,
        data: {
          groupPassed,
          individualResults,
          passCount,
          failCount,
          dc
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Group check failed: ${error.message}`
      };
    }
  }

  /**
   * Execute a skill check contest
   *
   * Both characters roll their respective skill checks. Higher total wins.
   * Ties go to the character with higher modifier.
   *
   * @param {Object} character1 - First character
   * @param {string} skill1 - First character's skill
   * @param {Object} character2 - Second character
   * @param {string} skill2 - Second character's skill
   * @param {Object} options - Options for each character
   * @param {boolean} options.advantage1 - Advantage for character1
   * @param {boolean} options.disadvantage1 - Disadvantage for character1
   * @param {boolean} options.advantage2 - Advantage for character2
   * @param {boolean} options.disadvantage2 - Disadvantage for character2
   * @returns {Promise<ResultObject>} Contest result
   *
   * @example
   * const result = await system.makeContest(rogue, 'stealth', guard, 'perception');
   * // {success: true, data: {winner: "character1", character1Result: {...}, character2Result: {...}, margin: 3}, error: null}
   */
  async makeContest(character1, skill1, character2, skill2, options = {}) {
    try {
      // Prepare options for each character
      const options1 = {
        advantage: options.advantage1,
        disadvantage: options.disadvantage1
      };

      const options2 = {
        advantage: options.advantage2,
        disadvantage: options.disadvantage2
      };

      // Roll skill checks for both characters (DC is irrelevant for contests, use 0)
      const result1 = await this.makeSkillCheck(character1, skill1, 0, options1);
      const result2 = await this.makeSkillCheck(character2, skill2, 0, options2);

      // Check for errors
      if (!result1.success) {
        return {
          success: false,
          data: null,
          error: `Character 1 skill check failed: ${result1.error}`
        };
      }

      if (!result2.success) {
        return {
          success: false,
          data: null,
          error: `Character 2 skill check failed: ${result2.error}`
        };
      }

      const total1 = result1.data.total;
      const total2 = result2.data.total;

      // Determine winner
      let winner;
      if (total1 > total2) {
        winner = 'character1';
      } else if (total2 > total1) {
        winner = 'character2';
      } else {
        // Tie: compare modifiers (ability modifier + proficiency bonus)
        const modifier1 = result1.data.abilityModifier + result1.data.proficiencyBonus;
        const modifier2 = result2.data.abilityModifier + result2.data.proficiencyBonus;

        if (modifier1 > modifier2) {
          winner = 'character1';
        } else if (modifier2 > modifier1) {
          winner = 'character2';
        } else {
          winner = 'tie';
        }
      }

      const margin = Math.abs(total1 - total2);

      return {
        success: true,
        data: {
          winner,
          character1Result: result1.data,
          character2Result: result2.data,
          margin
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Contest failed: ${error.message}`
      };
    }
  }
}

// Export the class and SKILL_TO_ABILITY constant
module.exports = SkillCheckSystem;
module.exports.SKILL_TO_ABILITY = SKILL_TO_ABILITY;
