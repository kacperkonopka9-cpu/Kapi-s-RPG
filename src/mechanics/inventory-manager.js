/**
 * InventoryManager - D&D 5e Character Inventory and Equipment Management System
 *
 * Features:
 * - Add/remove items from character inventory with weight tracking
 * - Equip/unequip items to equipment slots (armor, mainHand, offHand)
 * - Automatic AC recalculation when armor/shield equipped
 * - Encumbrance validation (carrying capacity = Strength × 15 lbs)
 * - Currency management (gold, silver, copper)
 * - Attunement tracking (max 3 magic items)
 * - Result Object pattern (no exceptions)
 * - Dependency injection for testability
 *
 * Implements D&D 5e inventory system for managing character equipment,
 * enabling weight-based encumbrance, automatic AC calculations, and
 * integration with ItemDatabase for item properties.
 *
 * @module src/mechanics/inventory-manager
 */

const ItemDatabase = require('./item-database');

class InventoryManager {
  /**
   * Creates a new InventoryManager instance
   *
   * @param {Object} deps - Dependencies (for testing)
   * @param {Object} deps.itemDatabase - Item database instance (default: new ItemDatabase())
   *
   * @example
   * // Default dependencies
   * const manager = new InventoryManager();
   *
   * // Custom dependencies for testing
   * const manager = new InventoryManager({
   *   itemDatabase: mockItemDatabase
   * });
   */
  constructor(deps = {}) {
    this.itemDatabase = deps.itemDatabase || new ItemDatabase();
  }

  /**
   * Add item to character inventory
   *
   * Loads item from ItemDatabase, adds to backpack array (or increments
   * quantity if already present), recalculates weight, validates against
   * carrying capacity.
   *
   * @param {Object} character - Character object with inventory and abilities
   * @param {string} itemId - Item ID from ItemDatabase
   * @param {number} quantity - Number of items to add (default: 1)
   * @returns {Promise<ResultObject>} Updated inventory and weight status
   *
   * @example
   * const result = await manager.addItem(character, 'longsword', 1);
   * // {success: true, data: {inventory: [...], weight: {current: 3, capacity: 240, encumbered: false}}, error: null}
   */
  async addItem(character, itemId, quantity = 1) {
    try {
      // Validate inputs
      if (!character || typeof character !== 'object') {
        return {
          success: false,
          data: null,
          error: 'Character must be a valid object'
        };
      }

      if (!itemId || typeof itemId !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Item ID must be a non-empty string'
        };
      }

      if (typeof quantity !== 'number' || quantity < 1) {
        return {
          success: false,
          data: null,
          error: 'Quantity must be a positive number'
        };
      }

      // Initialize inventory if missing
      if (!character.inventory) {
        character.inventory = {
          equipped: {},
          backpack: [],
          currency: { gold: 0, silver: 0, copper: 0 }
        };
      }

      if (!Array.isArray(character.inventory.backpack)) {
        character.inventory.backpack = [];
      }

      // Load item from database
      const itemResult = await this.itemDatabase.getItem(itemId);
      if (!itemResult.success) {
        return {
          success: false,
          data: null,
          error: `Item not found: ${itemId}`
        };
      }

      const item = itemResult.data;

      // Calculate new weight
      const weightToAdd = item.weight * quantity;
      const currentWeight = this.calculateWeight(character);
      const newWeight = currentWeight.current + weightToAdd;
      const capacity = currentWeight.capacity;

      // Validate encumbrance
      if (newWeight > capacity) {
        return {
          success: false,
          data: null,
          error: `Cannot add item: would exceed carrying capacity (${newWeight} lbs > ${capacity} lbs capacity)`
        };
      }

      // Add item to backpack (or increment quantity if exists)
      const existingItemIndex = character.inventory.backpack.findIndex(
        entry => entry.item === itemId
      );

      if (existingItemIndex >= 0) {
        // Item already in backpack - increment quantity
        character.inventory.backpack[existingItemIndex].quantity += quantity;
      } else {
        // Add new item entry
        character.inventory.backpack.push({
          item: itemId,
          quantity: quantity
        });
      }

      // Recalculate weight
      const updatedWeight = this.calculateWeight(character);

      return {
        success: true,
        data: {
          inventory: character.inventory.backpack,
          weight: updatedWeight
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Add item failed: ${error.message}`
      };
    }
  }

  /**
   * Remove item from character inventory
   *
   * Finds item in backpack, decrements quantity or removes entirely if
   * quantity reaches zero, recalculates weight.
   *
   * @param {Object} character - Character object with inventory
   * @param {string} itemId - Item ID to remove
   * @param {number} quantity - Number of items to remove (default: 1)
   * @returns {Promise<ResultObject>} Updated inventory and weight status
   *
   * @example
   * const result = await manager.removeItem(character, 'longsword', 1);
   * // {success: true, data: {inventory: [...], weight: {current: 0, capacity: 240, encumbered: false}}, error: null}
   */
  async removeItem(character, itemId, quantity = 1) {
    try {
      // Validate inputs
      if (!character || typeof character !== 'object') {
        return {
          success: false,
          data: null,
          error: 'Character must be a valid object'
        };
      }

      if (!itemId || typeof itemId !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Item ID must be a non-empty string'
        };
      }

      if (typeof quantity !== 'number' || quantity < 1) {
        return {
          success: false,
          data: null,
          error: 'Quantity must be a positive number'
        };
      }

      // Check inventory exists
      if (!character.inventory || !Array.isArray(character.inventory.backpack)) {
        return {
          success: false,
          data: null,
          error: 'Character has no inventory'
        };
      }

      // Find item in backpack
      const existingItemIndex = character.inventory.backpack.findIndex(
        entry => entry.item === itemId
      );

      if (existingItemIndex < 0) {
        return {
          success: false,
          data: null,
          error: `Item not found in inventory: ${itemId}`
        };
      }

      const existingItem = character.inventory.backpack[existingItemIndex];

      // Determine quantity to remove (cap at available)
      const quantityToRemove = Math.min(quantity, existingItem.quantity);

      // Update or remove item
      if (quantityToRemove >= existingItem.quantity) {
        // Remove item entirely
        character.inventory.backpack.splice(existingItemIndex, 1);
      } else {
        // Decrement quantity
        existingItem.quantity -= quantityToRemove;
      }

      // Recalculate weight
      const updatedWeight = this.calculateWeight(character);

      return {
        success: true,
        data: {
          inventory: character.inventory.backpack,
          weight: updatedWeight,
          removedQuantity: quantityToRemove
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Remove item failed: ${error.message}`
      };
    }
  }

  /**
   * Equip item to equipment slot
   *
   * Validates item type matches slot, checks proficiency, unequips existing
   * item if slot occupied, moves item from backpack to equipped slot,
   * recalculates AC if armor/shield.
   *
   * @param {Object} character - Character object
   * @param {string} itemId - Item ID to equip
   * @param {string} slot - Equipment slot ('armor', 'mainHand', 'offHand')
   * @returns {Promise<ResultObject>} Equipped items, AC, proficiency warning
   *
   * @example
   * const result = await manager.equipItem(character, 'longsword', 'mainHand');
   * // {success: true, data: {equipped: {...}, ac: 10, proficiencyWarning: false}, error: null}
   */
  async equipItem(character, itemId, slot) {
    try {
      // Validate inputs
      if (!character || typeof character !== 'object') {
        return {
          success: false,
          data: null,
          error: 'Character must be a valid object'
        };
      }

      if (!itemId || typeof itemId !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Item ID must be a non-empty string'
        };
      }

      const validSlots = ['armor', 'mainHand', 'offHand'];
      if (!validSlots.includes(slot)) {
        return {
          success: false,
          data: null,
          error: `Invalid slot: ${slot}. Must be one of: ${validSlots.join(', ')}`
        };
      }

      // Initialize inventory/equipped if missing
      if (!character.inventory) {
        character.inventory = {
          equipped: {},
          backpack: [],
          currency: { gold: 0, silver: 0, copper: 0 }
        };
      }

      if (!character.inventory.equipped) {
        character.inventory.equipped = {};
      }

      // Load item from database
      const itemResult = await this.itemDatabase.getItem(itemId);
      if (!itemResult.success) {
        return {
          success: false,
          data: null,
          error: `Item not found: ${itemId}`
        };
      }

      const item = itemResult.data;

      // Validate item type matches slot
      if (slot === 'armor' && item.type !== 'armor') {
        return {
          success: false,
          data: null,
          error: `Cannot equip ${item.type} in armor slot`
        };
      }

      if ((slot === 'mainHand' || slot === 'offHand') &&
          item.type !== 'weapon' && item.type !== 'shield') {
        return {
          success: false,
          data: null,
          error: `Cannot equip ${item.type} in ${slot} slot`
        };
      }

      // Check proficiency (warn but allow)
      let proficiencyWarning = false;
      if (item.type === 'armor' && character.proficiencies && character.proficiencies.armor) {
        const armorCategory = item.category; // light, medium, heavy
        if (!character.proficiencies.armor.includes(armorCategory)) {
          proficiencyWarning = true;
        }
      }

      if (item.type === 'weapon' && character.proficiencies && character.proficiencies.weapons) {
        const weaponCategory = item.category; // simple_melee, martial_melee, etc.
        const profList = character.proficiencies.weapons;
        // Check for category proficiency (e.g., "martial", "simple")
        const categoryPrefix = weaponCategory.split('_')[0]; // "simple" or "martial"
        if (!profList.includes(categoryPrefix) && !profList.includes(weaponCategory)) {
          proficiencyWarning = true;
        }
      }

      // If slot occupied, unequip existing item (move to backpack)
      if (character.inventory.equipped[slot]) {
        const existingItemId = character.inventory.equipped[slot];

        // Add existing item back to backpack
        const existingItemIndex = character.inventory.backpack.findIndex(
          entry => entry.item === existingItemId
        );

        if (existingItemIndex >= 0) {
          character.inventory.backpack[existingItemIndex].quantity += 1;
        } else {
          character.inventory.backpack.push({
            item: existingItemId,
            quantity: 1
          });
        }
      }

      // Remove item from backpack
      const backpackItemIndex = character.inventory.backpack.findIndex(
        entry => entry.item === itemId
      );

      if (backpackItemIndex >= 0) {
        const backpackItem = character.inventory.backpack[backpackItemIndex];
        if (backpackItem.quantity > 1) {
          backpackItem.quantity -= 1;
        } else {
          character.inventory.backpack.splice(backpackItemIndex, 1);
        }
      }
      // If item not in backpack, allow equipping anyway (might be starting equipment)

      // Equip item to slot
      character.inventory.equipped[slot] = itemId;

      // Recalculate AC if armor or shield
      let newAC = character.armorClass;
      if (item.type === 'armor' || item.type === 'shield') {
        newAC = this._recalculateAC(character);
        character.armorClass = newAC;
      }

      return {
        success: true,
        data: {
          equipped: character.inventory.equipped,
          ac: newAC,
          proficiencyWarning: proficiencyWarning
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Equip item failed: ${error.message}`
      };
    }
  }

  /**
   * Unequip item from equipment slot
   *
   * Moves item from equipped slot to backpack, recalculates AC if
   * armor/shield, validates weight after adding to backpack.
   *
   * @param {Object} character - Character object
   * @param {string} slot - Equipment slot to clear
   * @returns {Promise<ResultObject>} Equipped items, backpack, AC, weight
   *
   * @example
   * const result = await manager.unequipItem(character, 'armor');
   * // {success: true, data: {equipped: {...}, backpack: [...], ac: 10, weight: {...}}, error: null}
   */
  async unequipItem(character, slot) {
    try {
      // Validate inputs
      if (!character || typeof character !== 'object') {
        return {
          success: false,
          data: null,
          error: 'Character must be a valid object'
        };
      }

      const validSlots = ['armor', 'mainHand', 'offHand'];
      if (!validSlots.includes(slot)) {
        return {
          success: false,
          data: null,
          error: `Invalid slot: ${slot}. Must be one of: ${validSlots.join(', ')}`
        };
      }

      // Check inventory exists
      if (!character.inventory || !character.inventory.equipped) {
        return {
          success: false,
          data: null,
          error: 'Character has no equipped items'
        };
      }

      // Check if slot has item
      if (!character.inventory.equipped[slot]) {
        return {
          success: false,
          data: null,
          error: `No item equipped in ${slot} slot`
        };
      }

      const itemId = character.inventory.equipped[slot];

      // Load item to check weight
      const itemResult = await this.itemDatabase.getItem(itemId);
      if (!itemResult.success) {
        // Item not found in database, but still remove from slot
        delete character.inventory.equipped[slot];
        return {
          success: false,
          data: null,
          error: `Item ${itemId} not found in database, but removed from slot`
        };
      }

      const item = itemResult.data;

      // Check weight before adding to backpack
      const currentWeight = this.calculateWeight(character);
      const newWeight = currentWeight.current + item.weight;

      if (newWeight > currentWeight.capacity) {
        return {
          success: false,
          data: null,
          error: `Cannot unequip: would exceed carrying capacity (${newWeight} lbs > ${currentWeight.capacity} lbs)`
        };
      }

      // Move item to backpack
      const existingItemIndex = character.inventory.backpack.findIndex(
        entry => entry.item === itemId
      );

      if (existingItemIndex >= 0) {
        character.inventory.backpack[existingItemIndex].quantity += 1;
      } else {
        character.inventory.backpack.push({
          item: itemId,
          quantity: 1
        });
      }

      // Clear equipped slot
      delete character.inventory.equipped[slot];

      // Recalculate AC if armor or shield
      let newAC = character.armorClass;
      if (item.type === 'armor' || item.type === 'shield') {
        newAC = this._recalculateAC(character);
        character.armorClass = newAC;
      }

      // Recalculate weight
      const updatedWeight = this.calculateWeight(character);

      return {
        success: true,
        data: {
          equipped: character.inventory.equipped,
          backpack: character.inventory.backpack,
          ac: newAC,
          weight: updatedWeight
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Unequip item failed: ${error.message}`
      };
    }
  }

  /**
   * Calculate character weight and encumbrance
   *
   * Sums weights from backpack and equipped items, calculates carrying
   * capacity (Strength × 15), determines if encumbered.
   *
   * @param {Object} character - Character object with inventory and abilities
   * @returns {Object} Weight status {current, capacity, encumbered}
   *
   * @example
   * const weight = manager.calculateWeight(character);
   * // {current: 85, capacity: 240, encumbered: false}
   */
  calculateWeight(character) {
    try {
      let totalWeight = 0;

      // Sum backpack weights
      if (character.inventory && Array.isArray(character.inventory.backpack)) {
        for (const entry of character.inventory.backpack) {
          // Load item synchronously from cache (assumes database loaded)
          const item = this.itemDatabase.items.get(entry.item);
          if (item) {
            totalWeight += item.weight * entry.quantity;
          }
        }
      }

      // Sum equipped item weights
      if (character.inventory && character.inventory.equipped) {
        for (const itemId of Object.values(character.inventory.equipped)) {
          const item = this.itemDatabase.items.get(itemId);
          if (item) {
            totalWeight += item.weight;
          }
        }
      }

      // Calculate capacity (Strength × 15)
      const strength = character.abilities ? character.abilities.strength || 10 : 10;
      const capacity = strength * 15;

      // Determine encumbrance
      const encumbered = totalWeight > capacity;

      return {
        current: totalWeight,
        capacity: capacity,
        encumbered: encumbered
      };
    } catch (error) {
      // Fallback to safe defaults
      return {
        current: 0,
        capacity: 150, // Default for Str 10
        encumbered: false
      };
    }
  }

  /**
   * Add currency to character
   *
   * Adds specified amount of currency (gold, silver, copper) to character
   * inventory, validates non-negative amount.
   *
   * @param {Object} character - Character object
   * @param {number} amount - Amount to add (must be non-negative)
   * @param {string} type - Currency type ('gold', 'silver', 'copper')
   * @returns {ResultObject} Updated currency object
   *
   * @example
   * const result = manager.addCurrency(character, 50, 'gold');
   * // {success: true, data: {currency: {gold: 50, silver: 0, copper: 0}}, error: null}
   */
  addCurrency(character, amount, type) {
    try {
      // Validate inputs
      if (!character || typeof character !== 'object') {
        return {
          success: false,
          data: null,
          error: 'Character must be a valid object'
        };
      }

      if (typeof amount !== 'number' || amount < 0) {
        return {
          success: false,
          data: null,
          error: 'Amount must be a non-negative number'
        };
      }

      const validTypes = ['gold', 'silver', 'copper'];
      if (!validTypes.includes(type)) {
        return {
          success: false,
          data: null,
          error: `Invalid currency type: ${type}. Must be one of: ${validTypes.join(', ')}`
        };
      }

      // Initialize inventory/currency if missing
      if (!character.inventory) {
        character.inventory = {
          equipped: {},
          backpack: [],
          currency: { gold: 0, silver: 0, copper: 0 }
        };
      }

      if (!character.inventory.currency) {
        character.inventory.currency = { gold: 0, silver: 0, copper: 0 };
      }

      // Add currency
      character.inventory.currency[type] = (character.inventory.currency[type] || 0) + amount;

      return {
        success: true,
        data: {
          currency: character.inventory.currency
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Add currency failed: ${error.message}`
      };
    }
  }

  /**
   * Remove currency from character
   *
   * Subtracts specified amount of currency, validates sufficient funds.
   *
   * @param {Object} character - Character object
   * @param {number} amount - Amount to remove (must be non-negative)
   * @param {string} type - Currency type ('gold', 'silver', 'copper')
   * @returns {ResultObject} Updated currency object
   *
   * @example
   * const result = manager.removeCurrency(character, 10, 'gold');
   * // {success: true, data: {currency: {gold: 40, silver: 0, copper: 0}}, error: null}
   */
  removeCurrency(character, amount, type) {
    try {
      // Validate inputs
      if (!character || typeof character !== 'object') {
        return {
          success: false,
          data: null,
          error: 'Character must be a valid object'
        };
      }

      if (typeof amount !== 'number' || amount < 0) {
        return {
          success: false,
          data: null,
          error: 'Amount must be a non-negative number'
        };
      }

      const validTypes = ['gold', 'silver', 'copper'];
      if (!validTypes.includes(type)) {
        return {
          success: false,
          data: null,
          error: `Invalid currency type: ${type}. Must be one of: ${validTypes.join(', ')}`
        };
      }

      // Check inventory/currency exists
      if (!character.inventory || !character.inventory.currency) {
        return {
          success: false,
          data: null,
          error: 'Character has no currency'
        };
      }

      const currentAmount = character.inventory.currency[type] || 0;

      // Check sufficient funds
      if (currentAmount < amount) {
        return {
          success: false,
          data: null,
          error: `Insufficient ${type}: has ${currentAmount}, needs ${amount}`
        };
      }

      // Remove currency
      character.inventory.currency[type] = currentAmount - amount;

      return {
        success: true,
        data: {
          currency: character.inventory.currency
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Remove currency failed: ${error.message}`
      };
    }
  }

  /**
   * Attune character to magic item
   *
   * Validates item requires attunement, checks attunement slot availability
   * (max 3), adds item to attunement array, applies item effects.
   *
   * @param {Object} character - Character object
   * @param {string} itemId - Item ID to attune
   * @returns {Promise<ResultObject>} Attunement array and item effects
   *
   * @example
   * const result = await manager.attuneItem(character, 'ring_of_protection');
   * // {success: true, data: {attunement: ['ring_of_protection'], itemEffects: [...]}, error: null}
   */
  async attuneItem(character, itemId) {
    try {
      // Validate inputs
      if (!character || typeof character !== 'object') {
        return {
          success: false,
          data: null,
          error: 'Character must be a valid object'
        };
      }

      if (!itemId || typeof itemId !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Item ID must be a non-empty string'
        };
      }

      // Load item from database
      const itemResult = await this.itemDatabase.getItem(itemId);
      if (!itemResult.success) {
        return {
          success: false,
          data: null,
          error: `Item not found: ${itemId}`
        };
      }

      const item = itemResult.data;

      // Validate item requires attunement
      if (!item.attunement) {
        return {
          success: false,
          data: null,
          error: `Item ${item.name} does not require attunement`
        };
      }

      // Initialize attunement if missing
      if (!character.attunement) {
        character.attunement = [];
      }

      // Check if already attuned
      if (character.attunement.includes(itemId)) {
        return {
          success: false,
          data: null,
          error: `Already attuned to ${item.name}`
        };
      }

      // Check attunement limit (max 3)
      const maxAttunement = 3;
      if (character.attunement.length >= maxAttunement) {
        return {
          success: false,
          data: null,
          error: `Attunement limit reached (${maxAttunement} items maximum)`
        };
      }

      // Add to attunement array
      character.attunement.push(itemId);

      // Apply item effects (placeholder - full implementation in future stories)
      const itemEffects = item.effects || [];

      return {
        success: true,
        data: {
          attunement: character.attunement,
          itemEffects: itemEffects
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Attune item failed: ${error.message}`
      };
    }
  }

  /**
   * Un-attune character from magic item
   *
   * Removes item from attunement array, removes item effects.
   *
   * @param {Object} character - Character object
   * @param {string} itemId - Item ID to un-attune
   * @returns {Promise<ResultObject>} Updated attunement array
   *
   * @example
   * const result = await manager.unattuneItem(character, 'ring_of_protection');
   * // {success: true, data: {attunement: []}, error: null}
   */
  async unattuneItem(character, itemId) {
    try {
      // Validate inputs
      if (!character || typeof character !== 'object') {
        return {
          success: false,
          data: null,
          error: 'Character must be a valid object'
        };
      }

      if (!itemId || typeof itemId !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Item ID must be a non-empty string'
        };
      }

      // Check attunement exists
      if (!character.attunement || !Array.isArray(character.attunement)) {
        return {
          success: false,
          data: null,
          error: 'Character has no attuned items'
        };
      }

      // Find item in attunement array
      const itemIndex = character.attunement.indexOf(itemId);
      if (itemIndex < 0) {
        return {
          success: false,
          data: null,
          error: `Not attuned to ${itemId}`
        };
      }

      // Remove from attunement array
      character.attunement.splice(itemIndex, 1);

      // Remove item effects (placeholder)

      return {
        success: true,
        data: {
          attunement: character.attunement
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Un-attune item failed: ${error.message}`
      };
    }
  }

  /**
   * Recalculate character AC based on equipped armor and shield
   *
   * @private
   * @param {Object} character - Character object with equipped items
   * @returns {number} New AC value
   *
   * AC Calculation Rules:
   * - Unarmored: 10 + Dex modifier
   * - Light Armor: AC + Dex modifier
   * - Medium Armor: AC + min(Dex modifier, 2)
   * - Heavy Armor: AC (no Dex)
   * - Shield: +2 to any armor type
   */
  _recalculateAC(character) {
    try {
      let baseAC = 10;
      let dexModifier = 0;

      // Calculate Dex modifier
      if (character.abilities && character.abilities.dexterity) {
        dexModifier = Math.floor((character.abilities.dexterity - 10) / 2);
      }

      // Check equipped armor
      if (character.inventory && character.inventory.equipped && character.inventory.equipped.armor) {
        const armorId = character.inventory.equipped.armor;
        const armor = this.itemDatabase.items.get(armorId);

        if (armor && armor.type === 'armor') {
          const armorCategory = armor.category;

          if (armorCategory === 'light') {
            // Light armor: AC + full Dex
            baseAC = armor.armorClass + dexModifier;
          } else if (armorCategory === 'medium') {
            // Medium armor: AC + Dex (max +2)
            baseAC = armor.armorClass + Math.min(dexModifier, 2);
          } else if (armorCategory === 'heavy') {
            // Heavy armor: AC only (no Dex)
            baseAC = armor.armorClass;
          }
        }
      } else {
        // No armor: 10 + Dex
        baseAC = 10 + dexModifier;
      }

      // Check equipped shield
      if (character.inventory && character.inventory.equipped) {
        // Check mainHand for shield
        if (character.inventory.equipped.mainHand) {
          const mainHandItem = this.itemDatabase.items.get(character.inventory.equipped.mainHand);
          if (mainHandItem && mainHandItem.type === 'shield') {
            baseAC += (mainHandItem.armorClassBonus || 2);
          }
        }

        // Check offHand for shield
        if (character.inventory.equipped.offHand) {
          const offHandItem = this.itemDatabase.items.get(character.inventory.equipped.offHand);
          if (offHandItem && offHandItem.type === 'shield') {
            baseAC += (offHandItem.armorClassBonus || 2);
          }
        }
      }

      return baseAC;
    } catch (error) {
      // Fallback to base AC
      return character.armorClass || 10;
    }
  }
}

module.exports = InventoryManager;
