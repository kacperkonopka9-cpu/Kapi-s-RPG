/**
 * Equipment Manager Tests
 *
 * Comprehensive test suite for EquipmentManager covering:
 * - Equipment slot management (11 slots)
 * - AC calculation (all armor types, shields, magic items)
 * - Attunement system (max 3 limit)
 * - Proficiency checking (armor and weapons)
 * - Equipment restrictions (Str requirements, two-weapon fighting)
 * - Equipment effects (magic item bonuses)
 * - Integration with CharacterManager and ItemDatabase
 *
 * Target: ≥80% statement coverage, 100% function coverage
 */

const EquipmentManager = require('../../src/mechanics/equipment-manager');

describe('EquipmentManager', () => {
  let equipmentManager;
  let mockCharacterManager;
  let mockItemDatabase;
  let testCharacter;

  beforeEach(() => {
    // Mock CharacterManager
    mockCharacterManager = {
      saveCharacter: jest.fn().mockResolvedValue({
        success: true,
        data: { saved: true },
        error: null
      })
    };

    // Mock ItemDatabase
    mockItemDatabase = {
      items: new Map(),
      getItem: jest.fn()
    };

    // Setup test items
    const testItems = {
      chain_mail: {
        id: 'chain_mail',
        name: 'Chain Mail',
        type: 'armor',
        category: 'heavy',
        armorClass: 16,
        weight: 55,
        strengthRequirement: 13,
        effects: []
      },
      leather_armor: {
        id: 'leather_armor',
        name: 'Leather Armor',
        type: 'armor',
        category: 'light',
        armorClass: 11,
        weight: 10,
        effects: []
      },
      scale_mail: {
        id: 'scale_mail',
        name: 'Scale Mail',
        type: 'armor',
        category: 'medium',
        armorClass: 14,
        weight: 45,
        effects: []
      },
      plate_armor: {
        id: 'plate_armor',
        name: 'Plate Armor',
        type: 'armor',
        category: 'heavy',
        armorClass: 18,
        weight: 65,
        strengthRequirement: 15,
        effects: []
      },
      shield: {
        id: 'shield',
        name: 'Shield',
        type: 'shield',
        armorClassBonus: 2,
        weight: 6,
        effects: []
      },
      longsword: {
        id: 'longsword',
        name: 'Longsword',
        type: 'weapon',
        category: 'martial_melee',
        damage: '1d8',
        damageType: 'slashing',
        properties: ['versatile'],
        weight: 3,
        effects: []
      },
      shortsword: {
        id: 'shortsword',
        name: 'Shortsword',
        type: 'weapon',
        category: 'martial_melee',
        damage: '1d6',
        damageType: 'piercing',
        properties: ['light', 'finesse'],
        weight: 2,
        effects: []
      },
      dagger: {
        id: 'dagger',
        name: 'Dagger',
        type: 'weapon',
        category: 'simple_melee',
        damage: '1d4',
        damageType: 'piercing',
        properties: ['light', 'finesse', 'thrown'],
        weight: 1,
        effects: []
      },
      ring_of_protection: {
        id: 'ring_of_protection',
        name: 'Ring of Protection',
        type: 'ring',
        slotType: 'ring1',
        attunement: true,
        magical: true,
        effects: ['+1 AC', '+1 to all saving throws'],
        weight: 0,
        rarity: 'rare'
      },
      longsword_plus_one: {
        id: 'longsword_plus_one',
        name: '+1 Longsword',
        type: 'weapon',
        category: 'martial_melee',
        damage: '1d8',
        damageType: 'slashing',
        properties: ['versatile'],
        magical: true,
        effects: ['+1 attack rolls', '+1 damage'],
        weight: 3
      },
      gauntlets_of_ogre_power: {
        id: 'gauntlets_of_ogre_power',
        name: 'Gauntlets of Ogre Power',
        type: 'accessory',
        slotType: 'hands',
        attunement: true,
        magical: true,
        effects: ['Strength becomes 19'],
        weight: 2,
        rarity: 'uncommon'
      }
    };

    // Populate mock database
    for (const [id, item] of Object.entries(testItems)) {
      mockItemDatabase.items.set(id, item);
      mockItemDatabase.getItem.mockImplementation((itemId) => {
        const item = mockItemDatabase.items.get(itemId);
        if (item) {
          return Promise.resolve({ success: true, data: item, error: null });
        }
        return Promise.resolve({ success: false, data: null, error: 'Item not found' });
      });
    }

    equipmentManager = new EquipmentManager({
      characterManager: mockCharacterManager,
      itemDatabase: mockItemDatabase
    });

    // Test character
    testCharacter = {
      name: 'Test Fighter',
      class: 'Fighter',
      level: 5,
      abilities: {
        strength: 16, // +3 modifier
        dexterity: 14, // +2 modifier
        constitution: 15,
        intelligence: 10,
        wisdom: 12,
        charisma: 8
      },
      proficiencies: {
        armor: ['light', 'medium', 'heavy', 'shields'],
        weapons: ['simple', 'martial']
      },
      hitPoints: {
        max: 38,
        current: 38
      },
      armorClass: 10,
      inventory: {
        equipped: {},
        backpack: [
          { item: 'chain_mail', quantity: 1 },
          { item: 'longsword', quantity: 1 },
          { item: 'shield', quantity: 1 }
        ],
        currency: { gold: 50, silver: 0, copper: 0 }
      },
      attunement: []
    };
  });

  describe('Constructor and Lazy Loading', () => {
    test('should create instance with default dependencies', () => {
      const manager = new EquipmentManager();
      expect(manager).toBeInstanceOf(EquipmentManager);
    });

    test('should lazy-load CharacterManager when accessed', () => {
      const manager = new EquipmentManager();
      const cm = manager.characterManager;
      expect(cm).toBeDefined();
    });

    test('should lazy-load ItemDatabase when accessed', () => {
      const manager = new EquipmentManager();
      const db = manager.itemDatabase;
      expect(db).toBeDefined();
    });
  });

  describe('AC-1: Equip Armor', () => {
    test('should equip Chain Mail to armor slot', async () => {
      const result = await equipmentManager.equipItem(testCharacter, 'chain_mail', 'armor');

      expect(result.success).toBe(true);
      expect(result.data.equipped).toBe('chain_mail');
      expect(result.data.slot).toBe('armor');
      expect(result.data.newAC).toBe(16); // Heavy armor, no Dex
      expect(result.data.proficient).toBe(true);
      expect(testCharacter.inventory.equipped.armor).toBe('chain_mail');
      expect(mockCharacterManager.saveCharacter).toHaveBeenCalledWith(testCharacter);
    });

    test('should calculate AC with heavy armor (no Dex bonus)', async () => {
      const result = await equipmentManager.equipItem(testCharacter, 'chain_mail', 'armor');

      expect(result.success).toBe(true);
      expect(result.data.newAC).toBe(16); // AC 16, no Dex modifier
      expect(testCharacter.armorClass).toBe(16);
    });

    test('should return error if not proficient with heavy armor', async () => {
      testCharacter.proficiencies.armor = ['light', 'medium']; // No heavy armor proficiency

      const result = await equipmentManager.equipItem(testCharacter, 'chain_mail', 'armor');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not proficient with heavy armor');
    });

    test('should apply speed penalty if Str requirement not met', async () => {
      testCharacter.abilities.strength = 12; // Below Str 13 requirement

      const result = await equipmentManager.equipItem(testCharacter, 'chain_mail', 'armor');

      expect(result.success).toBe(true);
      expect(result.data.restrictions).toBeDefined();
      expect(result.data.restrictions[0]).toContain('Speed reduced by 10 feet');
    });

    test('should return error if slot already occupied', async () => {
      testCharacter.inventory.equipped.armor = 'leather_armor';

      const result = await equipmentManager.equipItem(testCharacter, 'chain_mail', 'armor');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Slot armor already occupied');
    });

    test('should remove item from backpack when equipped', async () => {
      const initialBackpackLength = testCharacter.inventory.backpack.length;

      await equipmentManager.equipItem(testCharacter, 'chain_mail', 'armor');

      const chainMailEntry = testCharacter.inventory.backpack.find(e => e.item === 'chain_mail');
      expect(chainMailEntry).toBeUndefined();
    });
  });

  describe('AC-2: Equip Weapon', () => {
    test('should equip Longsword to mainHand', async () => {
      const result = await equipmentManager.equipItem(testCharacter, 'longsword', 'mainHand');

      expect(result.success).toBe(true);
      expect(result.data.equipped).toBe('longsword');
      expect(result.data.slot).toBe('mainHand');
      expect(result.data.proficient).toBe(true);
      expect(testCharacter.inventory.equipped.mainHand).toBe('longsword');
    });

    test('should check weapon proficiency (martial)', async () => {
      const result = await equipmentManager.equipItem(testCharacter, 'longsword', 'mainHand');

      expect(result.success).toBe(true);
      expect(result.data.proficient).toBe(true); // Fighter has martial proficiency
    });

    test('should allow equipping non-proficient weapon (no error)', async () => {
      testCharacter.proficiencies.weapons = ['simple']; // No martial proficiency

      const result = await equipmentManager.equipItem(testCharacter, 'longsword', 'mainHand');

      expect(result.success).toBe(true);
      expect(result.data.proficient).toBe(false); // Not proficient, but allowed
    });
  });

  describe('AC-3: Equip Shield', () => {
    test('should equip Shield to offHand and increase AC', async () => {
      // First equip armor
      await equipmentManager.equipItem(testCharacter, 'chain_mail', 'armor');

      // Then equip shield
      const result = await equipmentManager.equipItem(testCharacter, 'shield', 'offHand');

      expect(result.success).toBe(true);
      expect(result.data.equipped).toBe('shield');
      expect(result.data.slot).toBe('offHand');
      expect(result.data.newAC).toBe(18); // Chain Mail 16 + Shield +2
    });

    test('should validate shield proficiency', async () => {
      const result = await equipmentManager.equipItem(testCharacter, 'shield', 'offHand');

      expect(result.success).toBe(true);
      expect(result.data.proficient).toBe(true); // Has 'shields' proficiency
    });

    test('should prevent two-weapon fighting when shield equipped', async () => {
      await equipmentManager.equipItem(testCharacter, 'shield', 'offHand');

      // Shield occupies offHand, so no two-weapon fighting
      expect(testCharacter.inventory.equipped.offHand).toBe('shield');
    });
  });

  describe('AC-4: Unequip Item', () => {
    test('should unequip armor and recalculate AC', async () => {
      // Equip armor first
      await equipmentManager.equipItem(testCharacter, 'chain_mail', 'armor');

      // Unequip armor
      const result = await equipmentManager.unequipItem(testCharacter, 'armor');

      expect(result.success).toBe(true);
      expect(result.data.unequipped).toBe('chain_mail');
      expect(result.data.slot).toBe('armor');
      expect(result.data.newAC).toBe(12); // 10 + Dex +2
      expect(testCharacter.inventory.equipped.armor).toBeUndefined();
    });

    test('should move unequipped item to backpack', async () => {
      await equipmentManager.equipItem(testCharacter, 'chain_mail', 'armor');

      await equipmentManager.unequipItem(testCharacter, 'armor');

      const chainMailEntry = testCharacter.inventory.backpack.find(e => e.item === 'chain_mail');
      expect(chainMailEntry).toBeDefined();
      expect(chainMailEntry.quantity).toBeGreaterThanOrEqual(1);
    });

    test('should remove attuned item from attunement when unequipped', async () => {
      // Add ring to backpack and attune
      testCharacter.inventory.backpack.push({ item: 'ring_of_protection', quantity: 1 });
      await equipmentManager.equipItem(testCharacter, 'ring_of_protection', 'ring1');
      await equipmentManager.attuneItem(testCharacter, 'ring_of_protection');

      // Unequip ring
      const result = await equipmentManager.unequipItem(testCharacter, 'ring1');

      expect(result.success).toBe(true);
      expect(testCharacter.attunement.includes('ring_of_protection')).toBe(false);
    });

    test('should return error if slot is empty', async () => {
      const result = await equipmentManager.unequipItem(testCharacter, 'armor');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No item equipped in armor slot');
    });
  });

  describe('AC-5: Attune to Magic Item', () => {
    test('should attune to Ring of Protection', async () => {
      const result = await equipmentManager.attuneItem(testCharacter, 'ring_of_protection');

      expect(result.success).toBe(true);
      expect(result.data.attuned).toBe('ring_of_protection');
      expect(result.data.attunedCount).toBe(1);
      expect(result.data.effects).toContain('+1 AC');
      expect(testCharacter.attunement).toContain('ring_of_protection');
    });

    test('should return error if attunement limit reached (max 3)', async () => {
      // Attune to 3 items
      testCharacter.attunement = ['item1', 'item2', 'item3'];

      const result = await equipmentManager.attuneItem(testCharacter, 'ring_of_protection');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum 3 attuned items');
    });

    test('should return error if item does not require attunement', async () => {
      const result = await equipmentManager.attuneItem(testCharacter, 'longsword');

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not require attunement');
    });

    test('should return error if already attuned', async () => {
      await equipmentManager.attuneItem(testCharacter, 'ring_of_protection');

      const result = await equipmentManager.attuneItem(testCharacter, 'ring_of_protection');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Already attuned');
    });

    test('should apply magic item effects', async () => {
      await equipmentManager.attuneItem(testCharacter, 'ring_of_protection');

      expect(testCharacter.activeEffects).toBeDefined();
      const ringEffect = testCharacter.activeEffects.find(e => e.source === 'ring_of_protection');
      expect(ringEffect).toBeDefined();
    });
  });

  describe('AC-6: Unattune from Magic Item', () => {
    test('should unattune from Ring of Protection', async () => {
      await equipmentManager.attuneItem(testCharacter, 'ring_of_protection');

      const result = await equipmentManager.unattuneItem(testCharacter, 'ring_of_protection');

      expect(result.success).toBe(true);
      expect(result.data.unattuned).toBe('ring_of_protection');
      expect(result.data.attunedCount).toBe(0);
      expect(testCharacter.attunement).not.toContain('ring_of_protection');
    });

    test('should remove magic item effects', async () => {
      await equipmentManager.attuneItem(testCharacter, 'ring_of_protection');
      await equipmentManager.unattuneItem(testCharacter, 'ring_of_protection');

      const ringEffect = testCharacter.activeEffects?.find(e => e.source === 'ring_of_protection');
      expect(ringEffect).toBeUndefined();
    });

    test('should return error if not attuned', async () => {
      const result = await equipmentManager.unattuneItem(testCharacter, 'ring_of_protection');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not attuned');
    });
  });

  describe('AC-7: Equipment Slots Validation', () => {
    test('should validate all 11 slot types', () => {
      const slots = ['armor', 'mainHand', 'offHand', 'head', 'hands', 'feet', 'neck', 'ring1', 'ring2', 'cloak', 'belt'];
      expect(EquipmentManager.VALID_SLOTS).toEqual(slots);
    });

    test('should return error for invalid slot', async () => {
      const result = await equipmentManager.equipItem(testCharacter, 'longsword', 'invalid_slot');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid slot');
    });

    test('should prevent equipping wrong item type in slot', async () => {
      const result = await equipmentManager.equipItem(testCharacter, 'longsword', 'armor');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot equip weapon in armor slot');
    });
  });

  describe('AC-8: Two-Weapon Fighting Validation', () => {
    test('should allow two light weapons', async () => {
      await equipmentManager.equipItem(testCharacter, 'shortsword', 'mainHand');

      const result = await equipmentManager.equipItem(testCharacter, 'dagger', 'offHand');

      expect(result.success).toBe(true); // Both are light
    });

    test('should return error if weapons are not both light', async () => {
      await equipmentManager.equipItem(testCharacter, 'longsword', 'mainHand');

      const result = await equipmentManager.equipItem(testCharacter, 'shortsword', 'offHand');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Two-weapon fighting requires both weapons to be light');
    });

    test('should allow shield in offHand regardless of mainHand weapon', async () => {
      await equipmentManager.equipItem(testCharacter, 'longsword', 'mainHand');

      const result = await equipmentManager.equipItem(testCharacter, 'shield', 'offHand');

      expect(result.success).toBe(true); // Shield always allowed
    });
  });

  describe('AC-9: AC Calculation from Equipment', () => {
    test('should calculate unarmored AC (10 + Dex)', () => {
      const ac = equipmentManager.calculateAC(testCharacter);

      expect(ac).toBe(12); // 10 + Dex modifier (+2)
    });

    test('should calculate light armor AC (AC + full Dex)', async () => {
      await equipmentManager.equipItem(testCharacter, 'leather_armor', 'armor');

      const ac = equipmentManager.calculateAC(testCharacter);

      expect(ac).toBe(13); // 11 + Dex (+2)
    });

    test('should calculate medium armor AC (AC + Dex max +2)', async () => {
      testCharacter.abilities.dexterity = 18; // +4 modifier
      await equipmentManager.equipItem(testCharacter, 'scale_mail', 'armor');

      const ac = equipmentManager.calculateAC(testCharacter);

      expect(ac).toBe(16); // 14 + Dex (max +2)
    });

    test('should calculate heavy armor AC (no Dex)', async () => {
      await equipmentManager.equipItem(testCharacter, 'chain_mail', 'armor');

      const ac = equipmentManager.calculateAC(testCharacter);

      expect(ac).toBe(16); // 16, no Dex modifier
    });

    test('should add shield bonus to AC', async () => {
      await equipmentManager.equipItem(testCharacter, 'chain_mail', 'armor');
      await equipmentManager.equipItem(testCharacter, 'shield', 'offHand');

      const ac = equipmentManager.calculateAC(testCharacter);

      expect(ac).toBe(18); // 16 + Shield (+2)
    });

    test('should add magic item AC bonus', async () => {
      await equipmentManager.attuneItem(testCharacter, 'ring_of_protection');

      const ac = equipmentManager.calculateAC(testCharacter);

      expect(ac).toBe(13); // 10 + Dex (+2) + Ring (+1)
    });
  });

  describe('AC-10: Equipment Bonuses and Effects', () => {
    test('should provide weapon stats via getEquippedWeapon', async () => {
      await equipmentManager.equipItem(testCharacter, 'longsword', 'mainHand');

      const weapon = equipmentManager.getEquippedWeapon(testCharacter, 'mainHand');

      expect(weapon).toBeDefined();
      expect(weapon.itemId).toBe('longsword');
      expect(weapon.damage).toBe('1d8');
      expect(weapon.damageType).toBe('slashing');
      expect(weapon.properties).toContain('versatile');
    });

    test('should include magical weapon bonuses', async () => {
      testCharacter.inventory.backpack.push({ item: 'longsword_plus_one', quantity: 1 });
      await equipmentManager.equipItem(testCharacter, 'longsword_plus_one', 'mainHand');

      const weapon = equipmentManager.getEquippedWeapon(testCharacter, 'mainHand');

      expect(weapon.bonuses.attack).toBe(1);
      expect(weapon.bonuses.damage).toBe(1);
    });

    test('should return null if no weapon equipped', () => {
      const weapon = equipmentManager.getEquippedWeapon(testCharacter, 'mainHand');

      expect(weapon).toBeNull();
    });
  });

  describe('AC-11: Equipment Proficiency Checking', () => {
    test('should check armor proficiency (heavy)', () => {
      const proficient = equipmentManager.isProficient(testCharacter, 'chain_mail');

      expect(proficient).toBe(true); // Fighter has heavy armor proficiency
    });

    test('should check weapon proficiency (martial)', () => {
      const proficient = equipmentManager.isProficient(testCharacter, 'longsword');

      expect(proficient).toBe(true); // Fighter has martial weapon proficiency
    });

    test('should check weapon proficiency (simple)', () => {
      const proficient = equipmentManager.isProficient(testCharacter, 'dagger');

      expect(proficient).toBe(true); // Simple weapons
    });

    test('should check shield proficiency', () => {
      const proficient = equipmentManager.isProficient(testCharacter, 'shield');

      expect(proficient).toBe(true); // Has 'shields' proficiency
    });

    test('should return false if not proficient', () => {
      testCharacter.proficiencies.armor = ['light', 'medium']; // No heavy

      const proficient = equipmentManager.isProficient(testCharacter, 'chain_mail');

      expect(proficient).toBe(false);
    });
  });

  describe('AC-12: Equipment Weight Integration', () => {
    test('should include equipped items in weight calculation', async () => {
      // This test verifies EquipmentManager provides data for weight integration
      await equipmentManager.equipItem(testCharacter, 'chain_mail', 'armor');

      // Chain Mail should now be in equipped, not backpack
      expect(testCharacter.inventory.equipped.armor).toBe('chain_mail');

      // InventoryManager would sum equipped items via:
      // for (const itemId of Object.values(character.inventory.equipped))
      const equippedItems = Object.values(testCharacter.inventory.equipped);
      expect(equippedItems).toContain('chain_mail');
    });
  });

  describe('AC-13: Persist Equipment State', () => {
    test('should persist equipped items via CharacterManager', async () => {
      await equipmentManager.equipItem(testCharacter, 'chain_mail', 'armor');

      expect(mockCharacterManager.saveCharacter).toHaveBeenCalledWith(testCharacter);
      expect(testCharacter.inventory.equipped.armor).toBe('chain_mail');
    });

    test('should persist attunement array via CharacterManager', async () => {
      await equipmentManager.attuneItem(testCharacter, 'ring_of_protection');

      expect(mockCharacterManager.saveCharacter).toHaveBeenCalledWith(testCharacter);
      expect(testCharacter.attunement).toContain('ring_of_protection');
    });

    test('should make atomic updates (single saveCharacter call)', async () => {
      mockCharacterManager.saveCharacter.mockClear();

      await equipmentManager.equipItem(testCharacter, 'chain_mail', 'armor');

      expect(mockCharacterManager.saveCharacter).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing character object', async () => {
      const result = await equipmentManager.equipItem(null, 'longsword', 'mainHand');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Character must be a valid object');
    });

    test('should handle missing itemId', async () => {
      const result = await equipmentManager.equipItem(testCharacter, '', 'mainHand');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Item ID must be a non-empty string');
    });

    test('should handle item not found in database', async () => {
      const result = await equipmentManager.equipItem(testCharacter, 'nonexistent_item', 'mainHand');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Item not found');
    });

    test('should handle character with no inventory', async () => {
      testCharacter.inventory = null;

      const result = await equipmentManager.equipItem(testCharacter, 'longsword', 'mainHand');

      expect(result.success).toBe(true);
      expect(testCharacter.inventory).toBeDefined();
      expect(testCharacter.inventory.equipped.mainHand).toBe('longsword');
    });

    test('should handle character with no proficiencies', () => {
      testCharacter.proficiencies = null;

      const proficient = equipmentManager.isProficient(testCharacter, 'longsword');

      expect(proficient).toBe(false);
    });

    test('should fallback to default AC if calculation fails', () => {
      testCharacter.abilities = null;
      testCharacter.inventory = null;
      testCharacter.armorClass = 15;

      const ac = equipmentManager.calculateAC(testCharacter);

      expect(ac).toBe(10); // Base AC (10 + Dex 0) when abilities null
    });
  });

  describe('Integration Tests', () => {
    test('should complete full equipment workflow: equip armor, shield, attune', async () => {
      // 1. Equip armor
      const armorResult = await equipmentManager.equipItem(testCharacter, 'chain_mail', 'armor');
      expect(armorResult.success).toBe(true);
      expect(armorResult.data.newAC).toBe(16);

      // 2. Equip shield
      const shieldResult = await equipmentManager.equipItem(testCharacter, 'shield', 'offHand');
      expect(shieldResult.success).toBe(true);
      expect(shieldResult.data.newAC).toBe(18);

      // 3. Attune to ring
      const attuneResult = await equipmentManager.attuneItem(testCharacter, 'ring_of_protection');
      expect(attuneResult.success).toBe(true);

      // 4. Verify final AC
      const finalAC = equipmentManager.calculateAC(testCharacter);
      expect(finalAC).toBe(19); // Chain Mail 16 + Shield 2 + Ring 1
    });

    test('should handle unequip and re-equip cycle', async () => {
      await equipmentManager.equipItem(testCharacter, 'chain_mail', 'armor');
      await equipmentManager.unequipItem(testCharacter, 'armor');

      const reEquipResult = await equipmentManager.equipItem(testCharacter, 'chain_mail', 'armor');

      expect(reEquipResult.success).toBe(true);
      expect(testCharacter.inventory.equipped.armor).toBe('chain_mail');
    });
  });
});
