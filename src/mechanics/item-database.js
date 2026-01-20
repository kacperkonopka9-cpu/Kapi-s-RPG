/**
 * ItemDatabase - D&D 5e Item Database Query System
 *
 * Features:
 * - Load item definitions from YAML file (data/srd/items.yaml)
 * - Query items by ID, type, or category
 * - Memory-based caching for fast queries (O(1) lookups)
 * - Result Object pattern (no exceptions)
 * - Dependency injection for testability
 *
 * Implements D&D 5e item system for querying item definitions,
 * enabling InventoryManager to access item properties for weight
 * calculations, AC values, and equipment validation.
 *
 * @module src/mechanics/item-database
 */

const fs = require('fs').promises;
const yaml = require('js-yaml');

class ItemDatabase {
  /**
   * Creates a new ItemDatabase instance
   *
   * @param {Object} deps - Dependencies (for testing)
   * @param {Object} deps.fileReader - File system reader (default: fs.promises)
   * @param {Object} deps.yamlParser - YAML parser (default: js-yaml)
   *
   * @example
   * // Default dependencies
   * const db = new ItemDatabase();
   *
   * // Custom dependencies for testing
   * const db = new ItemDatabase({
   *   fileReader: mockFileReader,
   *   yamlParser: mockYamlParser
   * });
   */
  constructor(deps = {}) {
    this.fileReader = deps.fileReader || fs;
    this.yamlParser = deps.yamlParser || yaml;

    // Map of item ID -> item object (for O(1) lookups)
    this.items = new Map();

    // Track if database is loaded
    this.isLoaded = false;
  }

  /**
   * Load and parse item data from YAML file
   *
   * Reads item definitions from YAML file, validates schema,
   * and caches in memory for fast queries.
   *
   * @param {string} filePath - Path to items YAML file
   * @returns {Promise<ResultObject>} Success/error
   *
   * @example
   * const result = await db.loadItems('data/srd/items.yaml');
   * // {success: true, data: null, error: null}
   */
  async loadItems(filePath = 'data/srd/items.yaml') {
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
      if (!parsedData || !Array.isArray(parsedData.items)) {
        return {
          success: false,
          data: null,
          error: 'Invalid item data: expected {items: []} structure'
        };
      }

      // Clear existing items
      this.items.clear();

      // Validate and cache each item
      for (let i = 0; i < parsedData.items.length; i++) {
        const item = parsedData.items[i];

        // Validate item schema
        const validation = this._validateItem(item, i);
        if (!validation.success) {
          return validation;
        }

        // Cache item by ID
        this.items.set(item.id, item);
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
        error: `Item database load failed: ${error.message}`
      };
    }
  }

  /**
   * Validate item data schema
   *
   * @private
   * @param {Object} item - Item object to validate
   * @param {number} index - Index in items array (for error messages)
   * @returns {ResultObject} Validation result
   */
  _validateItem(item, index) {
    const requiredFields = ['id', 'name', 'type', 'weight'];

    // Check required fields
    for (const field of requiredFields) {
      if (!(field in item)) {
        return {
          success: false,
          data: null,
          error: `Item at index ${index} missing required field: ${field}`
        };
      }
    }

    // Validate type
    const validTypes = ['weapon', 'armor', 'shield', 'gear', 'magic_item', 'consumable'];
    if (!validTypes.includes(item.type)) {
      return {
        success: false,
        data: null,
        error: `Item at index ${index} has invalid type: ${item.type}`
      };
    }

    // Validate weight (must be non-negative number)
    if (typeof item.weight !== 'number' || item.weight < 0) {
      return {
        success: false,
        data: null,
        error: `Item at index ${index} has invalid weight: ${item.weight} (must be non-negative number)`
      };
    }

    return {
      success: true,
      data: null,
      error: null
    };
  }

  /**
   * Query item by unique ID
   *
   * @param {string} itemId - Item identifier
   * @returns {Promise<ResultObject>} Item object or error
   *
   * @example
   * const result = await db.getItem('longsword');
   * // {success: true, data: {id: 'longsword', name: 'Longsword', ...}, error: null}
   */
  async getItem(itemId) {
    try {
      // Validate item ID
      if (!itemId || typeof itemId !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Item ID must be a non-empty string'
        };
      }

      // Check if database is loaded
      if (!this.isLoaded) {
        return {
          success: false,
          data: null,
          error: 'Item database not loaded. Call loadItems() first.'
        };
      }

      // Query item cache
      const item = this.items.get(itemId);

      if (!item) {
        return {
          success: false,
          data: null,
          error: `Item not found: ${itemId}`
        };
      }

      return {
        success: true,
        data: item,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Get item failed: ${error.message}`
      };
    }
  }

  /**
   * Query items by type
   *
   * @param {string} type - Item type (weapon, armor, shield, gear, magic_item, consumable)
   * @returns {Promise<ResultObject>} Array of items matching type
   *
   * @example
   * const result = await db.getItemsByType('weapon');
   * // {success: true, data: [{longsword}, {dagger}], error: null}
   */
  async getItemsByType(type) {
    try {
      // Validate type
      if (!type || typeof type !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Type must be a non-empty string'
        };
      }

      // Check if database is loaded
      if (!this.isLoaded) {
        return {
          success: false,
          data: null,
          error: 'Item database not loaded. Call loadItems() first.'
        };
      }

      // Filter items by type
      const matchingItems = [];
      for (const item of this.items.values()) {
        if (item.type === type) {
          matchingItems.push(item);
        }
      }

      return {
        success: true,
        data: matchingItems,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Get items by type failed: ${error.message}`
      };
    }
  }

  /**
   * Get all loaded items
   *
   * @returns {Promise<ResultObject>} Array of all items
   *
   * @example
   * const result = await db.getAllItems();
   * // {success: true, data: [all items], error: null}
   */
  async getAllItems() {
    try {
      // Check if database is loaded
      if (!this.isLoaded) {
        return {
          success: false,
          data: null,
          error: 'Item database not loaded. Call loadItems() first.'
        };
      }

      // Return all items as array (defensive copy)
      const allItems = Array.from(this.items.values());

      return {
        success: true,
        data: allItems,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Get all items failed: ${error.message}`
      };
    }
  }
}

module.exports = ItemDatabase;
