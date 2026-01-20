/**
 * EquipmentManager - D&D 5e Equipment System with Full Slot Management
 *
 * Features:
 * - 11 equipment slots (armor, mainHand, offHand, head, hands, feet, neck, ring1, ring2, cloak, belt)
 * - Equip/unequip items with proficiency checking and restrictions
 * - AC calculation with armor type rules (unarmored, light, medium, heavy)
 * - Attunement tracking (max 3 magic items)
 * - Equipment effects system (magic item bonuses)
 * - Strength requirement validation for heavy armor
 * - Two-weapon fighting rules enforcement
 * - Integration with ItemDatabase, CharacterManager, AttackResolver
 * - Result Object pattern (no exceptions)
 * - Dependency injection for testability
 *
 * Implements D&D 5e equipment system for managing character equipment slots,
 * calculating AC, tracking attunement, and applying equipment bonuses.
 *
 * @module src/mechanics/equipment-manager
 */

const CharacterManager = require('./character-manager');
const ItemDatabase = require('./item-database');

class EquipmentManager {
  /**
   * Creates a new EquipmentManager instance
   *
   * @param {Object} deps - Dependencies (for testing)
   * @param {Object} deps.characterManager - CharacterManager instance
   * @param {Object} deps.itemDatabase - ItemDatabase instance
   *
   * @example
   * // Default dependencies
   * const manager = new EquipmentManager();
   *
   * // Custom dependencies for testing
   * const manager = new EquipmentManager({
   *   characterManager: mockCharacterManager,
   *   itemDatabase: mockItemDatabase
   * });
   */
  constructor(deps = {}) {
    this._characterManager = deps.characterManager || null;
    this._itemDatabase = deps.itemDatabase || null;
  }

  /**
   * Lazy-loaded CharacterManager getter
   * @returns {CharacterManager}
   */
  get characterManager() {
    if (!this._characterManager) {
      this._characterManager = new CharacterManager();
    }
    return this._characterManager;
  }

  /**
   * Lazy-loaded ItemDatabase getter
   * @returns {ItemDatabase}
   */
  get itemDatabase() {
    if (!this._itemDatabase) {
      this._itemDatabase = new ItemDatabase();
    }
    return this._itemDatabase;
  }

  /**
   * Valid equipment slot names
   * @private
   */
  static VALID_SLOTS = [
    'armor', 'mainHand', 'offHand', 'head', 'hands', 'feet',
    'neck', 'ring1', 'ring2', 'cloak', 'belt'
  ];

  /**
   * Equip item to equipment slot
   *
   * Validates item type, checks proficiency, validates strength requirements,
   * moves item from backpack to equipped slot, recalculates AC, applies effects,
   * persists changes via CharacterManager.
   *
   * @param {Object} character - Character object
   * @param {string} itemId - Item ID to equip
   * @param {string} slot - Equipment slot name
   * @returns {Promise<ResultObject>} Result with equipped item, slot, new AC, effects
   *
   * @example
   * const result = await manager.equipItem(character, 'chain_mail', 'armor');
   * // {success: true, data: {equipped: 'chain_mail', slot: 'armor', newAC: 18, effects: [], proficient: true}, error: null}
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

      if (!EquipmentManager.VALID_SLOTS.includes(slot)) {
        return {
          success: false,
          data: null,
          error: `Invalid slot: ${slot}. Must be one of: ${EquipmentManager.VALID_SLOTS.join(', ')}`
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

      // Check if slot is already occupied
      if (character.inventory.equipped[slot]) {
        return {
          success: false,
          data: null,
          error: `Slot ${slot} already occupied by ${character.inventory.equipped[slot]}. Unequip first or use replaceEquipment()`
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

      // Validate item type matches slot
      const slotValidation = this._validateItemForSlot(item, slot);
      if (!slotValidation.valid) {
        return {
          success: false,
          data: null,
          error: slotValidation.error
        };
      }

      // Check proficiency
      const proficient = this.isProficient(character, itemId);

      // Heavy armor without proficiency = cannot equip
      if (item.type === 'armor' && item.category === 'heavy' && !proficient) {
        return {
          success: false,
          data: null,
          error: `Not proficient with heavy armor. Cannot equip ${item.name}.`
        };
      }

      // Check Strength requirements for armor
      let strengthPenalty = null;
      if (item.type === 'armor' && item.strengthRequirement) {
        const strCheck = this._checkStrengthRequirement(character, item);
        if (!strCheck.met) {
          strengthPenalty = strCheck.penalty;
          // Allow equipping but note the penalty
        }
      }

      // Validate two-weapon fighting if equipping to offHand
      if (slot === 'offHand' && character.inventory.equipped.mainHand) {
        const twoWeaponCheck = this._validateTwoWeaponFighting(
          character,
          character.inventory.equipped.mainHand,
          itemId
        );
        if (!twoWeaponCheck.valid) {
          return {
            success: false,
            data: null,
            error: twoWeaponCheck.error
          };
        }
      }

      // Remove item from backpack (if it exists there)
      if (Array.isArray(character.inventory.backpack)) {
        const backpackIndex = character.inventory.backpack.findIndex(
          entry => entry.item === itemId
        );
        if (backpackIndex >= 0) {
          const backpackItem = character.inventory.backpack[backpackIndex];
          if (backpackItem.quantity > 1) {
            backpackItem.quantity -= 1;
          } else {
            character.inventory.backpack.splice(backpackIndex, 1);
          }
        }
      }

      // Equip item to slot
      character.inventory.equipped[slot] = itemId;

      // Recalculate AC if armor or shield
      let newAC = character.armorClass || 10;
      if (item.type === 'armor' || item.type === 'shield') {
        newAC = this.calculateAC(character);
        character.armorClass = newAC;
      }

      // Apply equipment effects (magic items)
      const effects = this._applyEquipmentEffects(character, item);

      // Persist changes
      await this.characterManager.saveCharacter(character);

      // Build result data
      const resultData = {
        equipped: itemId,
        slot: slot,
        newAC: newAC,
        effects: effects,
        proficient: proficient
      };

      if (strengthPenalty) {
        resultData.restrictions = [strengthPenalty];
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
        error: `Equip item failed: ${error.message}`
      };
    }
  }

  /**
   * Unequip item from equipment slot
   *
   * Moves item from equipped slot to backpack, recalculates AC if armor/shield,
   * removes equipment effects, removes from attunement if applicable, persists changes.
   *
   * @param {Object} character - Character object
   * @param {string} slot - Equipment slot to clear
   * @returns {Promise<ResultObject>} Result with unequipped item, slot, new AC
   *
   * @example
   * const result = await manager.unequipItem(character, 'armor');
   * // {success: true, data: {unequipped: 'chain_mail', slot: 'armor', newAC: 12}, error: null}
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

      if (!EquipmentManager.VALID_SLOTS.includes(slot)) {
        return {
          success: false,
          data: null,
          error: `Invalid slot: ${slot}. Must be one of: ${EquipmentManager.VALID_SLOTS.join(', ')}`
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

      // Load item to get details
      const itemResult = await this.itemDatabase.getItem(itemId);
      const item = itemResult.success ? itemResult.data : null;

      // Remove equipment effects
      if (item) {
        this._removeEquipmentEffects(character, item);
      }

      // Remove from attunement if attuned
      if (character.attunement && Array.isArray(character.attunement)) {
        const attunementIndex = character.attunement.indexOf(itemId);
        if (attunementIndex >= 0) {
          character.attunement.splice(attunementIndex, 1);
        }
      }

      // Move item to backpack
      if (!Array.isArray(character.inventory.backpack)) {
        character.inventory.backpack = [];
      }

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
      let newAC = character.armorClass || 10;
      if (item && (item.type === 'armor' || item.type === 'shield')) {
        newAC = this.calculateAC(character);
        character.armorClass = newAC;
      }

      // Persist changes
      await this.characterManager.saveCharacter(character);

      return {
        success: true,
        data: {
          unequipped: itemId,
          slot: slot,
          newAC: newAC
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
   * Attune character to magic item
   *
   * Validates item requires attunement, checks attunement limit (max 3),
   * adds item to attunement array, applies magic item effects, persists changes.
   *
   * @param {Object} character - Character object
   * @param {string} itemId - Item ID to attune
   * @returns {Promise<ResultObject>} Result with attuned item, count, effects
   *
   * @example
   * const result = await manager.attuneItem(character, 'ring_of_protection');
   * // {success: true, data: {attuned: 'ring_of_protection', attunedCount: 1, effects: ['+1 AC', '+1 saves']}, error: null}
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
          error: `Maximum 3 attuned items. Unattune an item first.`
        };
      }

      // Add to attunement array
      character.attunement.push(itemId);

      // Apply item effects
      const effects = this._applyEquipmentEffects(character, item);

      // Recalculate AC if item provides AC bonus
      if (item.effects && item.effects.some(e => e.includes('AC'))) {
        const newAC = this.calculateAC(character);
        character.armorClass = newAC;
      }

      // Persist changes
      await this.characterManager.saveCharacter(character);

      return {
        success: true,
        data: {
          attuned: itemId,
          attunedCount: character.attunement.length,
          effects: effects
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
   * Unattune character from magic item
   *
   * Removes item from attunement array, removes magic item effects,
   * persists changes. Item remains in inventory/equipped.
   *
   * @param {Object} character - Character object
   * @param {string} itemId - Item ID to unattune
   * @returns {Promise<ResultObject>} Result with unattuned item, count
   *
   * @example
   * const result = await manager.unattuneItem(character, 'ring_of_protection');
   * // {success: true, data: {unattuned: 'ring_of_protection', attunedCount: 0}, error: null}
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

      // Load item to remove effects
      const itemResult = await this.itemDatabase.getItem(itemId);
      const item = itemResult.success ? itemResult.data : null;

      // Remove from attunement array
      character.attunement.splice(itemIndex, 1);

      // Remove item effects
      if (item) {
        this._removeEquipmentEffects(character, item);
      }

      // Recalculate AC if item provided AC bonus
      if (item && item.effects && item.effects.some(e => e.includes('AC'))) {
        const newAC = this.calculateAC(character);
        character.armorClass = newAC;
      }

      // Persist changes
      await this.characterManager.saveCharacter(character);

      return {
        success: true,
        data: {
          unattuned: itemId,
          attunedCount: character.attunement.length
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Unattune item failed: ${error.message}`
      };
    }
  }

  /**
   * Calculate character AC based on equipped armor, shield, and magic items
   *
   * AC Calculation Rules (D&D 5e RAW):
   * - Unarmored: 10 + Dex modifier
   * - Light Armor: armor AC + Dex modifier
   * - Medium Armor: armor AC + min(Dex modifier, 2)
   * - Heavy Armor: armor AC (no Dex)
   * - Shield: +2 to any armor type
   * - Magic Items: variable bonuses (e.g., Ring of Protection +1)
   *
   * @param {Object} character - Character object with equipped items
   * @returns {number} Calculated AC value
   *
   * @example
   * const ac = manager.calculateAC(character);
   * // 18 (Chain Mail 16 + Shield +2)
   */
  calculateAC(character) {
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
          } else {
            // Unknown armor type, default to light
            baseAC = armor.armorClass + dexModifier;
          }
        }
      } else {
        // No armor: 10 + Dex
        baseAC = 10 + dexModifier;
      }

      // Check equipped shield (in offHand or mainHand)
      if (character.inventory && character.inventory.equipped) {
        ['mainHand', 'offHand'].forEach(hand => {
          if (character.inventory.equipped[hand]) {
            const handItem = this.itemDatabase.items.get(character.inventory.equipped[hand]);
            if (handItem && handItem.type === 'shield') {
              baseAC += (handItem.armorClassBonus || 2);
            }
          }
        });
      }

      // Add magic item bonuses (attuned items with AC effects)
      if (character.attunement && Array.isArray(character.attunement)) {
        for (const itemId of character.attunement) {
          const item = this.itemDatabase.items.get(itemId);
          if (item && item.effects) {
            // Parse effects for AC bonuses (e.g., "+1 AC")
            for (const effect of item.effects) {
              const acMatch = effect.match(/\+(\d+)\s+AC/i);
              if (acMatch) {
                baseAC += parseInt(acMatch[1], 10);
              }
            }
          }
        }
      }

      return baseAC;
    } catch (error) {
      // Fallback to character's current AC or default
      return character.armorClass || 10;
    }
  }

  /**
   * Check if character is proficient with item
   *
   * Checks armor proficiency (light, medium, heavy, shields) and
   * weapon proficiency (simple, martial) against character proficiencies.
   *
   * @param {Object} character - Character object with proficiencies
   * @param {string} itemId - Item ID to check
   * @returns {boolean} True if proficient, false otherwise
   *
   * @example
   * const proficient = manager.isProficient(character, 'longsword');
   * // true (if character has martial weapon proficiency)
   */
  isProficient(character, itemId) {
    try {
      // Load item
      const item = this.itemDatabase.items.get(itemId);
      if (!item) {
        return false;
      }

      // Check proficiencies exist
      if (!character.proficiencies) {
        return false;
      }

      // Armor proficiency check
      if (item.type === 'armor') {
        if (!character.proficiencies.armor || !Array.isArray(character.proficiencies.armor)) {
          return false;
        }
        const armorCategory = item.category; // light, medium, heavy
        return character.proficiencies.armor.includes(armorCategory);
      }

      // Shield proficiency check
      if (item.type === 'shield') {
        if (!character.proficiencies.armor || !Array.isArray(character.proficiencies.armor)) {
          return false;
        }
        return character.proficiencies.armor.includes('shields');
      }

      // Weapon proficiency check
      if (item.type === 'weapon') {
        if (!character.proficiencies.weapons || !Array.isArray(character.proficiencies.weapons)) {
          return false;
        }
        const weaponCategory = item.category; // simple_melee, martial_melee, simple_ranged, martial_ranged
        const profList = character.proficiencies.weapons;

        // Extract category prefix (simple, martial)
        const categoryPrefix = weaponCategory.split('_')[0]; // "simple" or "martial"

        // Check for exact match or category match
        return profList.includes(categoryPrefix) ||
               profList.includes(weaponCategory) ||
               profList.includes(item.name.toLowerCase()); // Specific weapon proficiency
      }

      // Unknown type, assume not proficient
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get equipped weapon stats for attack resolution
   *
   * Returns weapon details including damage dice, damage type, properties,
   * and magical bonuses for integration with AttackResolver.
   *
   * @param {Object} character - Character object
   * @param {string} hand - Hand to check ('mainHand' or 'offHand')
   * @returns {Object|null} Weapon stats or null if no weapon equipped
   *
   * @example
   * const weapon = manager.getEquippedWeapon(character, 'mainHand');
   * // {itemId: 'longsword', damage: '1d8', damageType: 'slashing', properties: ['versatile'], bonuses: {attack: 0, damage: 0}}
   */
  getEquippedWeapon(character, hand) {
    try {
      // Validate hand
      if (hand !== 'mainHand' && hand !== 'offHand') {
        return null;
      }

      // Check if weapon equipped
      if (!character.inventory || !character.inventory.equipped || !character.inventory.equipped[hand]) {
        return null;
      }

      const itemId = character.inventory.equipped[hand];
      const item = this.itemDatabase.items.get(itemId);

      // Check if item is a weapon
      if (!item || item.type !== 'weapon') {
        return null;
      }

      // Build weapon stats
      const weaponStats = {
        itemId: itemId,
        name: item.name,
        damage: item.damage || '1d4',
        damageType: item.damageType || 'bludgeoning',
        properties: item.properties || [],
        bonuses: {
          attack: 0,
          damage: 0
        }
      };

      // Check for magical bonuses (e.g., +1 Longsword)
      if (item.magical && item.effects) {
        for (const effect of item.effects) {
          // Parse attack bonuses (e.g., "+1 attack rolls")
          const attackMatch = effect.match(/\+(\d+)\s+attack/i);
          if (attackMatch) {
            weaponStats.bonuses.attack = parseInt(attackMatch[1], 10);
          }

          // Parse damage bonuses (e.g., "+1 damage")
          const damageMatch = effect.match(/\+(\d+)\s+damage/i);
          if (damageMatch) {
            weaponStats.bonuses.damage = parseInt(damageMatch[1], 10);
          }
        }
      }

      return weaponStats;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate if item type matches slot
   * @private
   */
  _validateItemForSlot(item, slot) {
    if (slot === 'armor') {
      if (item.type !== 'armor') {
        return { valid: false, error: `Cannot equip ${item.type} in armor slot` };
      }
    } else if (slot === 'mainHand' || slot === 'offHand') {
      if (item.type !== 'weapon' && item.type !== 'shield') {
        return { valid: false, error: `Cannot equip ${item.type} in ${slot} slot` };
      }
    } else {
      // Accessory slots (head, hands, feet, neck, ring, cloak, belt)
      // Accept any wearable item (armor type 'accessory' or specific slot type)
      if (item.slotType && item.slotType !== slot) {
        return { valid: false, error: `Item ${item.name} is for ${item.slotType} slot, not ${slot}` };
      }
    }

    return { valid: true };
  }

  /**
   * Check if character meets Strength requirement for armor
   * @private
   */
  _checkStrengthRequirement(character, item) {
    if (!item.strengthRequirement) {
      return { met: true, penalty: null };
    }

    const strength = character.abilities?.strength || 10;

    if (strength < item.strengthRequirement) {
      return {
        met: false,
        penalty: `Speed reduced by 10 feet (Strength ${strength} < ${item.strengthRequirement} required)`
      };
    }

    return { met: true, penalty: null };
  }

  /**
   * Validate two-weapon fighting rules
   * @private
   */
  _validateTwoWeaponFighting(character, mainHandItemId, offHandItemId) {
    try {
      const mainHandItem = this.itemDatabase.items.get(mainHandItemId);
      const offHandItem = this.itemDatabase.items.get(offHandItemId);

      // If offHand item is a shield, allow (not two-weapon fighting)
      if (offHandItem && offHandItem.type === 'shield') {
        return { valid: true };
      }

      // If offHand item is a weapon, validate two-weapon fighting
      if (mainHandItem && offHandItem && mainHandItem.type === 'weapon' && offHandItem.type === 'weapon') {
        // Check if both weapons are light (or character has Dual Wielder feat)
        const mainHandLight = mainHandItem.properties?.includes('light');
        const offHandLight = offHandItem.properties?.includes('light');
        const hasDualWielder = character.feats?.includes('Dual Wielder') || false;

        if (!hasDualWielder && (!mainHandLight || !offHandLight)) {
          return {
            valid: false,
            error: 'Two-weapon fighting requires both weapons to be light (or Dual Wielder feat)'
          };
        }

        return { valid: true };
      }

      return { valid: true };
    } catch (error) {
      return { valid: true }; // Default to allowing if check fails
    }
  }

  /**
   * Apply equipment effects to character
   * @private
   */
  _applyEquipmentEffects(character, item) {
    if (!item.effects || !Array.isArray(item.effects)) {
      return [];
    }

    // Initialize active effects array if missing
    if (!character.activeEffects) {
      character.activeEffects = [];
    }

    // Add equipment effects to active effects
    for (const effect of item.effects) {
      const effectEntry = {
        source: item.id || item.name,
        type: 'equipment',
        description: effect
      };

      // Avoid duplicates
      const exists = character.activeEffects.some(
        e => e.source === effectEntry.source && e.description === effectEntry.description
      );

      if (!exists) {
        character.activeEffects.push(effectEntry);
      }
    }

    return item.effects;
  }

  /**
   * Remove equipment effects from character
   * @private
   */
  _removeEquipmentEffects(character, item) {
    if (!character.activeEffects || !Array.isArray(character.activeEffects)) {
      return;
    }

    const itemSource = item.id || item.name;

    // Remove effects with matching source
    character.activeEffects = character.activeEffects.filter(
      effect => effect.type !== 'equipment' || effect.source !== itemSource
    );
  }
}

module.exports = EquipmentManager;
