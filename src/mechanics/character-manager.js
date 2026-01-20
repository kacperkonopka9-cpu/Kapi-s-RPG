/**
 * CharacterManager - Character sheet loading, validation, and persistence for D&D 5e
 *
 * Features:
 * - Load character sheets from YAML files (characters/[name].yaml)
 * - Validate character data against D&D 5e schema
 * - Calculate derived stats (ability modifiers, proficiency bonus, spell save DC, etc.)
 * - Save character sheets atomically to prevent data corruption
 * - Result Object pattern (no exceptions)
 * - Dependency injection for testability
 *
 * @module src/mechanics/character-manager
 */

const yaml = require('js-yaml');
const fs = require('fs').promises;
const path = require('path');

class CharacterManager {
  /**
   * Creates a new CharacterManager instance
   *
   * @param {Object} deps - Dependencies (for testing)
   * @param {Object} deps.yamlParser - YAML parser (default: js-yaml)
   * @param {Object} deps.fileReader - File system module (default: fs.promises)
   */
  constructor(deps = {}) {
    this.yamlParser = deps.yamlParser || yaml;
    this.fileReader = deps.fileReader || fs;
  }

  /**
   * Load character from YAML file
   *
   * @param {string} characterId - Character filename (without extension)
   * @returns {Promise<ResultObject>} Character data
   *
   * @example
   * const manager = new CharacterManager();
   * const result = await manager.loadCharacter("kapi");
   * // {success: true, data: {name: "Kapi", race: "Human", ...}, error: null}
   */
  async loadCharacter(characterId) {
    try {
      // Validate input
      if (!characterId || typeof characterId !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Character ID must be a non-empty string'
        };
      }

      // Build file path
      const filePath = path.join('characters', `${characterId}.yaml`);

      // Read file
      let fileContent;
      try {
        fileContent = await this.fileReader.readFile(filePath, 'utf8');
      } catch (error) {
        if (error.code === 'ENOENT') {
          return {
            success: false,
            data: null,
            error: `Character file not found: ${characterId}`
          };
        }
        return {
          success: false,
          data: null,
          error: `Failed to read character file: ${error.message}`
        };
      }

      // Parse YAML
      let character;
      try {
        character = this.yamlParser.load(fileContent);
      } catch (error) {
        return {
          success: false,
          data: null,
          error: `Invalid YAML: ${error.message}`
        };
      }

      // Validate character schema
      const validationResult = this._validateCharacter(character);
      if (!validationResult.success) {
        return validationResult;
      }

      // Return success
      return {
        success: true,
        data: character,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Load failed: ${error.message}`
      };
    }
  }

  /**
   * Save character to YAML file (atomic operation)
   *
   * @param {string} characterId - Character filename (without extension)
   * @param {Object} characterData - Character object to save
   * @returns {Promise<ResultObject>} Success/error
   *
   * @example
   * const manager = new CharacterManager();
   * const result = await manager.saveCharacter("kapi", characterData);
   * // {success: true, data: null, error: null}
   */
  async saveCharacter(characterId, characterData) {
    try {
      // Validate input
      if (!characterId || typeof characterId !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Character ID must be a non-empty string'
        };
      }

      if (!characterData || typeof characterData !== 'object') {
        return {
          success: false,
          data: null,
          error: 'Character data must be an object'
        };
      }

      // Validate character schema
      const validationResult = this._validateCharacter(characterData);
      if (!validationResult.success) {
        return validationResult;
      }

      // Serialize to YAML
      let yamlContent;
      try {
        yamlContent = this.yamlParser.dump(characterData);
      } catch (error) {
        return {
          success: false,
          data: null,
          error: `Failed to serialize character: ${error.message}`
        };
      }

      // Build file paths
      const filePath = path.join('characters', `${characterId}.yaml`);
      const tempPath = path.join('characters', `${characterId}.yaml.tmp`);

      // Ensure characters directory exists
      try {
        await this.fileReader.mkdir('characters', { recursive: true });
      } catch (error) {
        // Ignore if directory already exists
        if (error.code !== 'EEXIST') {
          return {
            success: false,
            data: null,
            error: `Failed to create characters directory: ${error.message}`
          };
        }
      }

      // Write to temp file
      try {
        await this.fileReader.writeFile(tempPath, yamlContent, 'utf8');
      } catch (error) {
        return {
          success: false,
          data: null,
          error: `Failed to write temp file: ${error.message}`
        };
      }

      // Rename temp file to final file (atomic operation)
      try {
        await this.fileReader.rename(tempPath, filePath);
      } catch (error) {
        // Clean up temp file on failure
        try {
          await this.fileReader.unlink(tempPath);
        } catch (unlinkError) {
          // Ignore cleanup errors
        }
        return {
          success: false,
          data: null,
          error: `Failed to save character: ${error.message}`
        };
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
        error: `Save failed: ${error.message}`
      };
    }
  }

  /**
   * Validate character data against D&D 5e schema
   *
   * @private
   * @param {Object} character - Character data to validate
   * @returns {ResultObject} Validation result
   */
  _validateCharacter(character) {
    // Check if character is an object
    if (!character || typeof character !== 'object') {
      return {
        success: false,
        data: null,
        error: 'Validation error: Character must be an object'
      };
    }

    // Validate required fields
    const requiredFields = ['name', 'race', 'class', 'level', 'abilities', 'hitPoints', 'armorClass', 'proficiencies'];
    for (const field of requiredFields) {
      if (!(field in character)) {
        return {
          success: false,
          data: null,
          error: `Validation error: Missing required field '${field}'`
        };
      }
    }

    // Validate abilities
    if (typeof character.abilities !== 'object') {
      return {
        success: false,
        data: null,
        error: 'Validation error: abilities must be an object'
      };
    }

    const requiredAbilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    for (const ability of requiredAbilities) {
      if (!(ability in character.abilities)) {
        return {
          success: false,
          data: null,
          error: `Validation error: Missing ability '${ability}'`
        };
      }

      const score = character.abilities[ability];
      if (typeof score !== 'number' || score < 1 || score > 20) {
        return {
          success: false,
          data: null,
          error: `Validation error: Ability '${ability}' must be between 1 and 20 (got ${score})`
        };
      }
    }

    // Validate level
    if (typeof character.level !== 'number' || character.level < 1 || character.level > 20) {
      return {
        success: false,
        data: null,
        error: `Validation error: Level must be between 1 and 20 (got ${character.level})`
      };
    }

    // Validate hit points
    if (typeof character.hitPoints !== 'object') {
      return {
        success: false,
        data: null,
        error: 'Validation error: hitPoints must be an object'
      };
    }

    if (typeof character.hitPoints.max !== 'number' || character.hitPoints.max < 1) {
      return {
        success: false,
        data: null,
        error: 'Validation error: hitPoints.max must be a positive number'
      };
    }

    if (typeof character.hitPoints.current !== 'number') {
      return {
        success: false,
        data: null,
        error: 'Validation error: hitPoints.current must be a number'
      };
    }

    if (character.hitPoints.current > character.hitPoints.max) {
      return {
        success: false,
        data: null,
        error: `Validation error: hitPoints.current (${character.hitPoints.current}) cannot exceed max (${character.hitPoints.max})`
      };
    }

    if (typeof character.hitPoints.temporary !== 'number' || character.hitPoints.temporary < 0) {
      return {
        success: false,
        data: null,
        error: 'Validation error: hitPoints.temporary must be a non-negative number'
      };
    }

    // Validate hit dice
    if (character.hitPoints.hitDice) {
      if (typeof character.hitPoints.hitDice.spent !== 'number' || character.hitPoints.hitDice.spent < 0) {
        return {
          success: false,
          data: null,
          error: 'Validation error: hitDice.spent must be a non-negative number'
        };
      }

      if (typeof character.hitPoints.hitDice.total !== 'number' || character.hitPoints.hitDice.total < 0) {
        return {
          success: false,
          data: null,
          error: 'Validation error: hitDice.total must be a non-negative number'
        };
      }

      if (character.hitPoints.hitDice.spent > character.hitPoints.hitDice.total) {
        return {
          success: false,
          data: null,
          error: `Validation error: hitDice.spent (${character.hitPoints.hitDice.spent}) cannot exceed total (${character.hitPoints.hitDice.total})`
        };
      }
    }

    // Validate proficiency bonus matches level
    if ('proficiencyBonus' in character) {
      const expectedBonus = CharacterManager.getProficiencyBonus(character.level);
      if (character.proficiencyBonus !== expectedBonus) {
        return {
          success: false,
          data: null,
          error: `Validation error: proficiencyBonus (${character.proficiencyBonus}) does not match level ${character.level} (expected ${expectedBonus})`
        };
      }
    }

    // Validate spell slots (if spellcaster)
    if (character.spellcasting && character.spellcasting.spellSlots) {
      for (const [level, slots] of Object.entries(character.spellcasting.spellSlots)) {
        if (typeof slots !== 'number' || slots < 0) {
          return {
            success: false,
            data: null,
            error: `Validation error: spellSlots level ${level} must be a non-negative number (got ${slots})`
          };
        }
      }
    }

    // Validate attunement
    if (character.attunement) {
      if (!Array.isArray(character.attunement.items)) {
        return {
          success: false,
          data: null,
          error: 'Validation error: attunement.items must be an array'
        };
      }

      const maxAttunement = character.attunement.max || 3;
      if (character.attunement.items.length > maxAttunement) {
        return {
          success: false,
          data: null,
          error: `Validation error: attunement items (${character.attunement.items.length}) cannot exceed max (${maxAttunement})`
        };
      }
    }

    // Validate death saves
    if (character.deathSaves) {
      if (typeof character.deathSaves.successes !== 'number' || character.deathSaves.successes < 0 || character.deathSaves.successes > 3) {
        return {
          success: false,
          data: null,
          error: `Validation error: deathSaves.successes must be between 0 and 3 (got ${character.deathSaves.successes})`
        };
      }

      if (typeof character.deathSaves.failures !== 'number' || character.deathSaves.failures < 0 || character.deathSaves.failures > 3) {
        return {
          success: false,
          data: null,
          error: `Validation error: deathSaves.failures must be between 0 and 3 (got ${character.deathSaves.failures})`
        };
      }
    }

    // Validate exhaustion
    if ('exhaustionLevel' in character) {
      if (typeof character.exhaustionLevel !== 'number' || character.exhaustionLevel < 0 || character.exhaustionLevel > 6) {
        return {
          success: false,
          data: null,
          error: `Validation error: exhaustionLevel must be between 0 and 6 (got ${character.exhaustionLevel})`
        };
      }
    }

    // All validations passed
    return {
      success: true,
      data: null,
      error: null
    };
  }

  /**
   * Calculate derived stats from character data
   *
   * @param {Object} character - Character object
   * @returns {Object} Derived stats
   *
   * @example
   * const stats = manager.calculateDerivedStats(character);
   * // {abilityModifiers: {...}, proficiencyBonus: 2, spellSaveDC: 13, ...}
   */
  calculateDerivedStats(character) {
    const stats = {};

    // Calculate ability modifiers
    stats.abilityModifiers = {};
    for (const [ability, score] of Object.entries(character.abilities)) {
      stats.abilityModifiers[ability] = CharacterManager.getAbilityModifier(score);
    }

    // Calculate proficiency bonus
    stats.proficiencyBonus = CharacterManager.getProficiencyBonus(character.level);

    // Calculate spell save DC and attack bonus (if spellcaster)
    if (character.spellcasting && character.spellcasting.ability) {
      const spellAbility = character.spellcasting.ability;
      const spellMod = stats.abilityModifiers[spellAbility];

      stats.spellSaveDC = 8 + stats.proficiencyBonus + spellMod;
      stats.spellAttackBonus = stats.proficiencyBonus + spellMod;
    } else {
      stats.spellSaveDC = null;
      stats.spellAttackBonus = null;
    }

    // Calculate carrying capacity
    stats.carryingCapacity = character.abilities.strength * 15;

    return stats;
  }

  /**
   * Calculate ability modifier from ability score
   *
   * @static
   * @param {number} abilityScore - Ability score (1-20)
   * @returns {number} Ability modifier
   *
   * @example
   * CharacterManager.getAbilityModifier(16); // returns 3
   * CharacterManager.getAbilityModifier(10); // returns 0
   */
  static getAbilityModifier(abilityScore) {
    return Math.floor((abilityScore - 10) / 2);
  }

  /**
   * Get proficiency bonus for character level
   *
   * @static
   * @param {number} level - Character level (1-20)
   * @returns {number} Proficiency bonus
   *
   * @example
   * CharacterManager.getProficiencyBonus(3); // returns 2
   * CharacterManager.getProficiencyBonus(5); // returns 3
   */
  static getProficiencyBonus(level) {
    return Math.ceil(level / 4) + 1;
  }
}

module.exports = CharacterManager;
