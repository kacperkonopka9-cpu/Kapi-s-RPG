/**
 * SpellDatabase - D&D 5e Spell Database Query System
 *
 * Features:
 * - Load spell definitions from YAML file (data/srd/spells.yaml)
 * - Query spells by ID, level, school, or class
 * - Memory-based caching for fast queries (O(1) lookups)
 * - Result Object pattern (no exceptions)
 * - Dependency injection for testability
 *
 * Implements D&D 5e spell system for querying spell definitions,
 * enabling SpellManager to access spell properties for casting
 * validation and effect resolution.
 *
 * @module src/mechanics/spell-database
 */

const fs = require('fs').promises;
const yaml = require('js-yaml');

class SpellDatabase {
  /**
   * Creates a new SpellDatabase instance
   *
   * @param {Object} deps - Dependencies (for testing)
   * @param {Object} deps.fileReader - File system reader (default: fs.promises)
   * @param {Object} deps.yamlParser - YAML parser (default: js-yaml)
   *
   * @example
   * // Default dependencies
   * const db = new SpellDatabase();
   *
   * // Custom dependencies for testing
   * const db = new SpellDatabase({
   *   fileReader: mockFileReader,
   *   yamlParser: mockYamlParser
   * });
   */
  constructor(deps = {}) {
    this.fileReader = deps.fileReader || fs;
    this.yamlParser = deps.yamlParser || yaml;

    // Map of spell ID -> spell object (for O(1) lookups)
    this.spells = new Map();

    // Track if database is loaded
    this.isLoaded = false;
  }

  /**
   * Load and parse spell data from YAML file
   *
   * Reads spell definitions from YAML file, validates schema,
   * and caches in memory for fast queries.
   *
   * @param {string} filePath - Path to spells YAML file
   * @returns {Promise<ResultObject>} Success/error
   *
   * @example
   * const result = await db.loadSpells('data/srd/spells.yaml');
   * // {success: true, data: null, error: null}
   */
  async loadSpells(filePath = 'data/srd/spells.yaml') {
    try {
      // Validate file path
      if (!filePath || typeof filePath !== 'string') {
        return {
          success: false,
          data: null,
          error: 'File path must be a non-empty string'
        };
      }

      // Read YAML file
      let fileContent;
      try {
        fileContent = await this.fileReader.readFile(filePath, 'utf8');
      } catch (err) {
        return {
          success: false,
          data: null,
          error: `Failed to read file: ${err.message}`
        };
      }

      // Parse YAML
      let parsedData;
      try {
        parsedData = this.yamlParser.load(fileContent);
      } catch (err) {
        return {
          success: false,
          data: null,
          error: `Failed to parse YAML: ${err.message}`
        };
      }

      // Validate structure
      if (!parsedData || !Array.isArray(parsedData.spells)) {
        return {
          success: false,
          data: null,
          error: 'Invalid spell data: expected {spells: []} structure'
        };
      }

      // Clear existing spells
      this.spells.clear();

      // Validate and cache each spell
      for (let i = 0; i < parsedData.spells.length; i++) {
        const spell = parsedData.spells[i];

        // Validate spell schema
        const validation = this._validateSpell(spell, i);
        if (!validation.success) {
          return validation;
        }

        // Cache spell by ID
        this.spells.set(spell.id, spell);
      }

      this.isLoaded = true;

      return {
        success: true,
        data: null,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Spell database load failed: ${error.message}`
      };
    }
  }

  /**
   * Validate spell data schema
   *
   * @private
   * @param {Object} spell - Spell object to validate
   * @param {number} index - Index in spells array (for error messages)
   * @returns {ResultObject} Validation result
   */
  _validateSpell(spell, index) {
    const requiredFields = [
      'id', 'name', 'level', 'school', 'castingTime',
      'range', 'components', 'duration', 'description', 'effect'
    ];

    // Check required fields
    for (const field of requiredFields) {
      if (!(field in spell)) {
        return {
          success: false,
          data: null,
          error: `Spell at index ${index} missing required field: ${field}`
        };
      }
    }

    // Validate level (0-9)
    if (typeof spell.level !== 'number' || spell.level < 0 || spell.level > 9) {
      return {
        success: false,
        data: null,
        error: `Spell at index ${index} has invalid level: ${spell.level} (must be 0-9)`
      };
    }

    // Validate school
    const validSchools = [
      'Abjuration', 'Conjuration', 'Divination', 'Enchantment',
      'Evocation', 'Illusion', 'Necromancy', 'Transmutation'
    ];
    if (!validSchools.includes(spell.school)) {
      return {
        success: false,
        data: null,
        error: `Spell at index ${index} has invalid school: ${spell.school}`
      };
    }

    // Validate components array
    if (!Array.isArray(spell.components)) {
      return {
        success: false,
        data: null,
        error: `Spell at index ${index} components must be an array`
      };
    }

    // If M component, require materials field
    if (spell.components.includes('M') && !spell.materials) {
      return {
        success: false,
        data: null,
        error: `Spell at index ${index} has M component but missing materials field`
      };
    }

    return {
      success: true,
      data: null,
      error: null
    };
  }

  /**
   * Query spell by unique ID
   *
   * @param {string} spellId - Spell identifier
   * @returns {Promise<ResultObject>} Spell object or error
   *
   * @example
   * const result = await db.getSpell('cure_wounds');
   * // {success: true, data: {id: 'cure_wounds', name: 'Cure Wounds', ...}, error: null}
   */
  async getSpell(spellId) {
    try {
      // Validate spell ID
      if (!spellId || typeof spellId !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Spell ID must be a non-empty string'
        };
      }

      // Check if database is loaded
      if (!this.isLoaded) {
        return {
          success: false,
          data: null,
          error: 'Spell database not loaded. Call loadSpells() first.'
        };
      }

      // Query spell cache
      const spell = this.spells.get(spellId);

      if (!spell) {
        return {
          success: false,
          data: null,
          error: `Spell not found: ${spellId}`
        };
      }

      return {
        success: true,
        data: spell,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Get spell failed: ${error.message}`
      };
    }
  }

  /**
   * Query spells by level
   *
   * @param {number} level - Spell level (0 = cantrip, 1-9 = spell levels)
   * @returns {Promise<ResultObject>} Array of spells at specified level
   *
   * @example
   * const result = await db.getSpellsByLevel(1);
   * // {success: true, data: [{spell1}, {spell2}], error: null}
   */
  async getSpellsByLevel(level) {
    try {
      // Validate level
      if (typeof level !== 'number') {
        return {
          success: false,
          data: null,
          error: 'Level must be a number'
        };
      }

      if (level < 0 || level > 9) {
        return {
          success: false,
          data: null,
          error: `Level must be 0-9, got: ${level}`
        };
      }

      // Check if database is loaded
      if (!this.isLoaded) {
        return {
          success: false,
          data: null,
          error: 'Spell database not loaded. Call loadSpells() first.'
        };
      }

      // Filter spells by level
      const matchingSpells = [];
      for (const spell of this.spells.values()) {
        if (spell.level === level) {
          matchingSpells.push(spell);
        }
      }

      return {
        success: true,
        data: matchingSpells,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Get spells by level failed: ${error.message}`
      };
    }
  }

  /**
   * Query spells by school of magic
   *
   * @param {string} school - School name (e.g., "Evocation")
   * @returns {Promise<ResultObject>} Array of spells in specified school
   *
   * @example
   * const result = await db.getSpellsBySchool('Evocation');
   * // {success: true, data: [{fireball}, {sacred_flame}], error: null}
   */
  async getSpellsBySchool(school) {
    try {
      // Validate school
      if (!school || typeof school !== 'string') {
        return {
          success: false,
          data: null,
          error: 'School must be a non-empty string'
        };
      }

      // Check if database is loaded
      if (!this.isLoaded) {
        return {
          success: false,
          data: null,
          error: 'Spell database not loaded. Call loadSpells() first.'
        };
      }

      // Filter spells by school
      const matchingSpells = [];
      for (const spell of this.spells.values()) {
        if (spell.school === school) {
          matchingSpells.push(spell);
        }
      }

      return {
        success: true,
        data: matchingSpells,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Get spells by school failed: ${error.message}`
      };
    }
  }

  /**
   * Query spells by class
   *
   * @param {string} className - Class name (e.g., "Cleric", "Wizard")
   * @returns {Promise<ResultObject>} Array of spells available to class
   *
   * @example
   * const result = await db.getSpellsByClass('Cleric');
   * // {success: true, data: [{cure_wounds}, {sacred_flame}], error: null}
   */
  async getSpellsByClass(className) {
    try {
      // Validate class name
      if (!className || typeof className !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Class name must be a non-empty string'
        };
      }

      // Check if database is loaded
      if (!this.isLoaded) {
        return {
          success: false,
          data: null,
          error: 'Spell database not loaded. Call loadSpells() first.'
        };
      }

      // Filter spells by class
      const matchingSpells = [];
      for (const spell of this.spells.values()) {
        if (spell.classes && Array.isArray(spell.classes) && spell.classes.includes(className)) {
          matchingSpells.push(spell);
        }
      }

      return {
        success: true,
        data: matchingSpells,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Get spells by class failed: ${error.message}`
      };
    }
  }

  /**
   * Get all loaded spells
   *
   * @returns {Promise<ResultObject>} Array of all spells
   *
   * @example
   * const result = await db.getAllSpells();
   * // {success: true, data: [all spells], error: null}
   */
  async getAllSpells() {
    try {
      // Check if database is loaded
      if (!this.isLoaded) {
        return {
          success: false,
          data: null,
          error: 'Spell database not loaded. Call loadSpells() first.'
        };
      }

      // Return all spells as array (defensive copy)
      const allSpells = Array.from(this.spells.values());

      return {
        success: true,
        data: allSpells,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Get all spells failed: ${error.message}`
      };
    }
  }
}

module.exports = SpellDatabase;
