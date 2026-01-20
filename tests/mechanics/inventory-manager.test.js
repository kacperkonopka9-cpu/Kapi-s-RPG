/**
 * InventoryManager Tests
 *
 * Test coverage for D&D 5e Inventory Management system
 * - Add/remove items with weight validation
 * - Equip/unequip items with AC recalculation
 * - Currency management
 * - Attunement tracking
 * - Integration with ItemDatabase
 */

const InventoryManager = require('../../src/mechanics/inventory-manager');
const ItemDatabase = require('../../src/mechanics/item-database');
const path = require('path');

describe('InventoryManager', () => {
  let manager;
  let mockItemDatabase;
  let character;

  // Test items
  const longsword = {
    id: 'longsword',
    name: 'Longsword',
    type: 'weapon',
    category: 'martial_melee',
    damage: '1d8',
    weight: 3,
    cost: '15gp'
  };

  const chainMail = {
    id: 'chain_mail',
    name: 'Chain Mail',
    type: 'armor',
    category: 'heavy',
    armorClass: 16,
    weight: 55,
    cost: '75gp'
  };

  const shield = {
    id: 'shield',
    name: 'Shield',
    type: 'shield',
    armorClassBonus: 2,
    weight: 6,
    cost: '10gp'
  };

  const ringOfProtection = {
    id: 'ring_of_protection',
    name: 'Ring of Protection',
    type: 'magic_item',
    attunement: true,
    weight: 0,
    effects: [
      { type: 'ac_bonus', value: 1 },
      { type: 'saving_throw_bonus', value: 1 }
    ]
  };

  beforeEach(() => {
    // Mock ItemDatabase
    mockItemDatabase = {
      items: new Map([
        ['longsword', longsword],
        ['chain_mail', chainMail],
        ['shield', shield],
        ['ring_of_protection', ringOfProtection]
      ]),
      getItem: jest.fn((itemId) => {
        const item = mockItemDatabase.items.get(itemId);
        if (item) {
          return Promise.resolve({ success: true, data: item, error: null });
        } else {
          return Promise.resolve({ success: false, data: null, error: `Item not found: ${itemId}` });
        }
      })
    };

    manager = new InventoryManager({
      itemDatabase: mockItemDatabase
    });

    // Test character
    character = {
      name: 'Test Character',
      class: 'Fighter',
      level: 3,
      abilities: {
        strength: 16,  // +3 modifier, 240 lbs capacity
        dexterity: 14  // +2 modifier
      },
      proficiencies: {
        armor: ['light', 'medium', 'heavy'],
        weapons: ['simple', 'martial']
      },
      inventory: {
        equipped: {},
        backpack: [],
        currency: {
          gold: 0,
          silver: 0,
          copper: 0
        }
      },
      armorClass: 10,
      attunement: []
    };
  });

  describe('Constructor', () => {
    test('should create instance with default dependencies', () => {
      const realManager = new InventoryManager();
      expect(realManager).toBeInstanceOf(InventoryManager);
      expect(realManager.itemDatabase).toBeInstanceOf(ItemDatabase);
    });

    test('should accept custom dependencies via DI', () => {
      expect(manager.itemDatabase).toBe(mockItemDatabase);
    });
  });

  describe('addItem() - AC-1', () => {
    test('should add item to backpack and update weight', async () => {
      const result = await manager.addItem(character, 'longsword', 1);

      expect(result.success).toBe(true);
      expect(result.data.inventory.length).toBe(1);
      expect(result.data.inventory[0]).toEqual({ item: 'longsword', quantity: 1 });
      expect(result.data.weight.current).toBe(3);
      expect(result.data.weight.capacity).toBe(240);
      expect(result.data.weight.encumbered).toBe(false);
    });

    test('should increment quantity if item already in backpack', async () => {
      await manager.addItem(character, 'longsword', 1);
      const result = await manager.addItem(character, 'longsword', 2);

      expect(result.success).toBe(true);
      expect(result.data.inventory.length).toBe(1);
      expect(result.data.inventory[0].quantity).toBe(3);
      expect(result.data.weight.current).toBe(9); // 3 longswords × 3 lbs
    });

    test('should return error if over encumbrance limit', async () => {
      // Add 240 lbs (at capacity)
      character.inventory.backpack.push({ item: 'chain_mail', quantity: 4 }); // 4 × 55 = 220 lbs

      const result = await manager.addItem(character, 'chain_mail', 1); // Would be 275 lbs

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceed carrying capacity');
    });

    test('should validate item ID is string', async () => {
      const result = await manager.addItem(character, null, 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('must be a non-empty string');
    });

    test('should validate quantity is positive number', async () => {
      const result = await manager.addItem(character, 'longsword', -1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('must be a positive number');
    });

    test('should return error if item not found', async () => {
      const result = await manager.addItem(character, 'nonexistent', 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Item not found');
    });
  });

  describe('removeItem() - AC-2', () => {
    beforeEach(async () => {
      await manager.addItem(character, 'longsword', 3);
    });

    test('should remove item and update weight', async () => {
      const result = await manager.removeItem(character, 'longsword', 1);

      expect(result.success).toBe(true);
      expect(result.data.inventory[0].quantity).toBe(2);
      expect(result.data.weight.current).toBe(6); // 2 × 3 lbs
      expect(result.data.removedQuantity).toBe(1);
    });

    test('should remove item entirely if quantity reaches zero', async () => {
      const result = await manager.removeItem(character, 'longsword', 3);

      expect(result.success).toBe(true);
      expect(result.data.inventory.length).toBe(0);
      expect(result.data.weight.current).toBe(0);
    });

    test('should handle quantity exceeding available (remove all)', async () => {
      const result = await manager.removeItem(character, 'longsword', 10);

      expect(result.success).toBe(true);
      expect(result.data.removedQuantity).toBe(3); // Only had 3
      expect(result.data.inventory.length).toBe(0);
    });

    test('should return error if item not found', async () => {
      const result = await manager.removeItem(character, 'nonexistent', 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found in inventory');
    });

    test('should validate character has inventory', async () => {
      const emptyChar = { name: 'Empty' };
      const result = await manager.removeItem(emptyChar, 'longsword', 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('has no inventory');
    });
  });

  describe('equipItem() - AC-3', () => {
    beforeEach(async () => {
      await manager.addItem(character, 'longsword', 1);
      await manager.addItem(character, 'chain_mail', 1);
      await manager.addItem(character, 'shield', 1);
    });

    test('should equip weapon to mainHand', async () => {
      const result = await manager.equipItem(character, 'longsword', 'mainHand');

      expect(result.success).toBe(true);
      expect(result.data.equipped.mainHand).toBe('longsword');
      expect(result.data.proficiencyWarning).toBe(false);
      expect(character.inventory.backpack.length).toBe(2); // chain_mail, shield
    });

    test('should equip armor and recalculate AC', async () => {
      const result = await manager.equipItem(character, 'chain_mail', 'armor');

      expect(result.success).toBe(true);
      expect(result.data.equipped.armor).toBe('chain_mail');
      expect(result.data.ac).toBe(16); // Heavy armor: AC only (no Dex)
      expect(character.armorClass).toBe(16);
    });

    test('should equip shield and add +2 AC', async () => {
      await manager.equipItem(character, 'chain_mail', 'armor');
      const result = await manager.equipItem(character, 'shield', 'offHand');

      expect(result.success).toBe(true);
      expect(result.data.equipped.offHand).toBe('shield');
      expect(result.data.ac).toBe(18); // 16 (chain mail) + 2 (shield)
    });

    test('should unequip existing item when slot occupied', async () => {
      await manager.equipItem(character, 'longsword', 'mainHand');

      // Add dagger to test replacement
      mockItemDatabase.items.set('dagger', { id: 'dagger', type: 'weapon', category: 'simple_melee', weight: 1 });
      await manager.addItem(character, 'dagger', 1);

      const result = await manager.equipItem(character, 'dagger', 'mainHand');

      expect(result.success).toBe(true);
      expect(result.data.equipped.mainHand).toBe('dagger');

      // Longsword should be back in backpack
      const longswordEntry = character.inventory.backpack.find(e => e.item === 'longsword');
      expect(longswordEntry.quantity).toBe(1);
    });

    test('should warn if proficiency missing but allow equip', async () => {
      character.proficiencies.armor = ['light']; // Remove heavy proficiency

      const result = await manager.equipItem(character, 'chain_mail', 'armor');

      expect(result.success).toBe(true);
      expect(result.data.proficiencyWarning).toBe(true);
    });

    test('should return error if invalid slot', async () => {
      const result = await manager.equipItem(character, 'longsword', 'invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid slot');
    });

    test('should return error if item type does not match slot', async () => {
      const result = await manager.equipItem(character, 'longsword', 'armor');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot equip weapon in armor slot');
    });
  });

  describe('unequipItem() - AC-4', () => {
    beforeEach(async () => {
      await manager.addItem(character, 'chain_mail', 1);
      await manager.addItem(character, 'shield', 1);
      await manager.equipItem(character, 'chain_mail', 'armor');
      await manager.equipItem(character, 'shield', 'offHand');
    });

    test('should unequip armor and recalculate AC', async () => {
      const result = await manager.unequipItem(character, 'armor');

      expect(result.success).toBe(true);
      expect(result.data.equipped.armor).toBeUndefined();
      expect(result.data.ac).toBe(14); // Unarmored (10 + 2 Dex) + shield (+2) = 14

      // Chain mail back in backpack
      const chainMailEntry = result.data.backpack.find(e => e.item === 'chain_mail');
      expect(chainMailEntry.quantity).toBe(1);
    });

    test('should unequip shield and recalculate AC', async () => {
      const result = await manager.unequipItem(character, 'offHand');

      expect(result.success).toBe(true);
      expect(result.data.equipped.offHand).toBeUndefined();
      expect(result.data.ac).toBe(16); // Chain mail only (no Dex)
    });

    test('should check weight after unequipping', async () => {
      const result = await manager.unequipItem(character, 'armor');

      expect(result.success).toBe(true);
      expect(result.data.weight.current).toBeGreaterThan(0);
      expect(result.data.weight.encumbered).toBe(false);
    });

    test('should return error if slot empty', async () => {
      const result = await manager.unequipItem(character, 'mainHand');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No item equipped');
    });

    test('should return error if invalid slot', async () => {
      const result = await manager.unequipItem(character, 'invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid slot');
    });
  });

  describe('calculateWeight() - AC-5', () => {
    test('should calculate weight from backpack and equipped items', () => {
      character.inventory.backpack = [
        { item: 'longsword', quantity: 2 }, // 2 × 3 = 6 lbs
        { item: 'shield', quantity: 1 }      // 1 × 6 = 6 lbs
      ];
      character.inventory.equipped = {
        armor: 'chain_mail' // 55 lbs
      };

      const weight = manager.calculateWeight(character);

      expect(weight.current).toBe(67); // 6 + 6 + 55
      expect(weight.capacity).toBe(240); // Str 16 × 15
      expect(weight.encumbered).toBe(false);
    });

    test('should detect encumbrance when over capacity', () => {
      character.inventory.backpack = [
        { item: 'chain_mail', quantity: 5 } // 5 × 55 = 275 lbs
      ];

      const weight = manager.calculateWeight(character);

      expect(weight.current).toBe(275);
      expect(weight.capacity).toBe(240);
      expect(weight.encumbered).toBe(true);
    });

    test('should handle weight exactly at capacity', () => {
      character.inventory.backpack = [
        { item: 'chain_mail', quantity: 4 }, // 4 × 55 = 220 lbs
        { item: 'longsword', quantity: 1 }   // 1 × 3 = 3 lbs (total 223)
      ];

      const weight = manager.calculateWeight(character);

      expect(weight.current).toBe(223);
      expect(weight.encumbered).toBe(false);
    });

    test('should handle weight one pound over capacity', () => {
      character.inventory.backpack = [
        { item: 'chain_mail', quantity: 4 }, // 220 lbs
        { item: 'longsword', quantity: 7 }   // 21 lbs (total 241)
      ];

      const weight = manager.calculateWeight(character);

      expect(weight.current).toBe(241);
      expect(weight.encumbered).toBe(true);
    });

    test('should complete in < 50ms', () => {
      // Add many items
      for (let i = 0; i < 50; i++) {
        character.inventory.backpack.push({ item: 'longsword', quantity: 1 });
      }

      const start = Date.now();
      manager.calculateWeight(character);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('addCurrency() / removeCurrency() - AC-6', () => {
    test('should add gold to character', () => {
      const result = manager.addCurrency(character, 50, 'gold');

      expect(result.success).toBe(true);
      expect(result.data.currency.gold).toBe(50);
    });

    test('should add silver and copper', () => {
      manager.addCurrency(character, 100, 'silver');
      manager.addCurrency(character, 25, 'copper');

      expect(character.inventory.currency.silver).toBe(100);
      expect(character.inventory.currency.copper).toBe(25);
    });

    test('should validate currency type', () => {
      const result = manager.addCurrency(character, 10, 'platinum');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid currency type');
    });

    test('should validate amount is non-negative', () => {
      const result = manager.addCurrency(character, -10, 'gold');

      expect(result.success).toBe(false);
      expect(result.error).toContain('non-negative number');
    });

    test('should remove currency', () => {
      manager.addCurrency(character, 50, 'gold');
      const result = manager.removeCurrency(character, 20, 'gold');

      expect(result.success).toBe(true);
      expect(result.data.currency.gold).toBe(30);
    });

    test('should return error if insufficient currency', () => {
      manager.addCurrency(character, 10, 'gold');
      const result = manager.removeCurrency(character, 50, 'gold');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient gold');
    });
  });

  describe('attuneItem() / unattuneItem() - AC-9', () => {
    test('should attune to magic item', async () => {
      const result = await manager.attuneItem(character, 'ring_of_protection');

      expect(result.success).toBe(true);
      expect(result.data.attunement).toContain('ring_of_protection');
      expect(result.data.itemEffects.length).toBe(2);
      expect(character.attunement).toContain('ring_of_protection');
    });

    test('should allow up to 3 attuned items', async () => {
      // Add more attunement items
      mockItemDatabase.items.set('cloak_of_protection', {
        id: 'cloak_of_protection',
        type: 'magic_item',
        attunement: true,
        weight: 1
      });
      mockItemDatabase.items.set('boots_of_speed', {
        id: 'boots_of_speed',
        type: 'magic_item',
        attunement: true,
        weight: 1
      });

      await manager.attuneItem(character, 'ring_of_protection');
      await manager.attuneItem(character, 'cloak_of_protection');
      const result = await manager.attuneItem(character, 'boots_of_speed');

      expect(result.success).toBe(true);
      expect(character.attunement.length).toBe(3);
    });

    test('should return error if attunement limit exceeded', async () => {
      mockItemDatabase.items.set('item1', { id: 'item1', type: 'magic_item', attunement: true, weight: 0 });
      mockItemDatabase.items.set('item2', { id: 'item2', type: 'magic_item', attunement: true, weight: 0 });
      mockItemDatabase.items.set('item3', { id: 'item3', type: 'magic_item', attunement: true, weight: 0 });
      mockItemDatabase.items.set('item4', { id: 'item4', type: 'magic_item', attunement: true, weight: 0 });

      await manager.attuneItem(character, 'item1');
      await manager.attuneItem(character, 'item2');
      await manager.attuneItem(character, 'item3');
      const result = await manager.attuneItem(character, 'item4');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Attunement limit reached');
    });

    test('should return error if item does not require attunement', async () => {
      mockItemDatabase.items.set('bag_of_holding', {
        id: 'bag_of_holding',
        type: 'magic_item',
        attunement: false,
        weight: 15
      });

      const result = await manager.attuneItem(character, 'bag_of_holding');

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not require attunement');
    });

    test('should un-attune item', async () => {
      await manager.attuneItem(character, 'ring_of_protection');
      const result = await manager.unattuneItem(character, 'ring_of_protection');

      expect(result.success).toBe(true);
      expect(result.data.attunement).not.toContain('ring_of_protection');
    });

    test('should return error if not attuned to item', async () => {
      const result = await manager.unattuneItem(character, 'ring_of_protection');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not attuned');
    });
  });

  describe('_recalculateAC() - AC-8', () => {
    test('should calculate unarmored AC (10 + Dex)', () => {
      const ac = manager._recalculateAC(character);

      expect(ac).toBe(12); // 10 + 2 (Dex modifier)
    });

    test('should calculate light armor AC (AC + Dex)', () => {
      mockItemDatabase.items.set('leather', {
        id: 'leather',
        type: 'armor',
        category: 'light',
        armorClass: 11,
        weight: 10
      });
      character.inventory.equipped.armor = 'leather';

      const ac = manager._recalculateAC(character);

      expect(ac).toBe(13); // 11 + 2 (Dex)
    });

    test('should calculate medium armor AC (AC + min(Dex, 2))', () => {
      mockItemDatabase.items.set('chain_shirt', {
        id: 'chain_shirt',
        type: 'armor',
        category: 'medium',
        armorClass: 13,
        weight: 20
      });
      character.inventory.equipped.armor = 'chain_shirt';

      const ac = manager._recalculateAC(character);

      expect(ac).toBe(15); // 13 + 2 (Dex, max +2)
    });

    test('should calculate heavy armor AC (AC only, no Dex)', () => {
      character.inventory.equipped.armor = 'chain_mail';

      const ac = manager._recalculateAC(character);

      expect(ac).toBe(16); // 16 (no Dex bonus)
    });

    test('should add shield bonus (+2)', () => {
      character.inventory.equipped.armor = 'chain_mail';
      character.inventory.equipped.offHand = 'shield';

      const ac = manager._recalculateAC(character);

      expect(ac).toBe(18); // 16 + 2 (shield)
    });

    test('should handle shield in mainHand', () => {
      character.inventory.equipped.mainHand = 'shield';

      const ac = manager._recalculateAC(character);

      expect(ac).toBe(14); // Unarmored (10 + 2 Dex) + shield (+2)
    });
  });

  describe('Integration Tests - AC-10', () => {
    test('should complete full inventory workflow', async () => {
      // Add items
      await manager.addItem(character, 'longsword', 1);
      await manager.addItem(character, 'chain_mail', 1);
      await manager.addItem(character, 'shield', 1);

      // Equip items
      await manager.equipItem(character, 'longsword', 'mainHand');
      await manager.equipItem(character, 'chain_mail', 'armor');
      await manager.equipItem(character, 'shield', 'offHand');

      // Verify AC
      expect(character.armorClass).toBe(18);

      // Verify weight
      const weight = manager.calculateWeight(character);
      expect(weight.current).toBe(64); // 3 + 55 + 6

      // Add currency
      manager.addCurrency(character, 100, 'gold');
      expect(character.inventory.currency.gold).toBe(100);

      // Attune to item
      await manager.attuneItem(character, 'ring_of_protection');
      expect(character.attunement.length).toBe(1);
    });
  });

  describe('Integration Tests with Real ItemDatabase', () => {
    test('should work with real ItemDatabase', async () => {
      const realDb = new ItemDatabase();
      await realDb.loadItems(path.join(__dirname, '../../data/srd/items.yaml'));

      const realManager = new InventoryManager({ itemDatabase: realDb });

      const result = await realManager.addItem(character, 'longsword', 1);

      expect(result.success).toBe(true);
      expect(result.data.weight.current).toBe(3);
    });

    test('should equip real chain mail and calculate AC', async () => {
      const realDb = new ItemDatabase();
      await realDb.loadItems(path.join(__dirname, '../../data/srd/items.yaml'));

      const realManager = new InventoryManager({ itemDatabase: realDb });

      await realManager.addItem(character, 'chain_mail', 1);
      const result = await realManager.equipItem(character, 'chain_mail', 'armor');

      expect(result.success).toBe(true);
      expect(result.data.ac).toBe(16);
    });
  });

  describe('Performance Tests', () => {
    test('addItem() should complete in < 100ms', async () => {
      const start = Date.now();
      await manager.addItem(character, 'longsword', 1);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
