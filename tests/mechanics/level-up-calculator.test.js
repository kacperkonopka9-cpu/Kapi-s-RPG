/**
 * Tests for LevelUpCalculator
 *
 * Test Coverage:
 * - XP threshold validation for all levels 1-20
 * - HP increase calculation for all 4 classes
 * - Level up workflow (3→4, 4→5 with proficiency change)
 * - Class feature grants
 * - ASI application (+2 to one, +1 to two)
 * - Derived stat recalculation (retroactive Con HP)
 * - Level 20 cap
 * - Multiclass error handling
 * - Edge cases and error conditions
 */

const LevelUpCalculator = require('../../src/mechanics/level-up-calculator');
const fs = require('fs').promises;

describe('LevelUpCalculator', () => {
  let calculator;
  let mockDiceRoller;
  let mockCharacterManager;
  let mockInventoryManager;

  beforeEach(() => {
    // Mock DiceRoller
    mockDiceRoller = {
      roll: jest.fn()
    };

    // Mock CharacterManager
    mockCharacterManager = {
      saveCharacter: jest.fn().mockResolvedValue({ success: true, data: null, error: null }),
      getAbilityModifier: jest.fn(score => Math.floor((score - 10) / 2)),
      getProficiencyBonus: jest.fn(level => Math.ceil(level / 4) + 1)
    };

    // Mock InventoryManager
    mockInventoryManager = {
      _recalculateAC: jest.fn(character => {
        // Simple AC calculation for testing
        const dexMod = Math.floor((character.abilities.dexterity - 10) / 2);
        return 10 + dexMod;
      })
    };

    calculator = new LevelUpCalculator({
      diceRoller: mockDiceRoller,
      characterManager: mockCharacterManager,
      inventoryManager: mockInventoryManager
    });
  });

  describe('canLevelUp', () => {
    test('should return true when character has enough XP for level 2', async () => {
      const character = { level: 1, experience: 300 };

      const result = await calculator.canLevelUp(character);

      expect(result.success).toBe(true);
      expect(result.data.canLevel).toBe(true);
      expect(result.data.currentLevel).toBe(1);
      expect(result.data.nextLevel).toBe(2);
      expect(result.data.xpNeeded).toBe(300);
    });

    test('should return false when character does not have enough XP', async () => {
      const character = { level: 1, experience: 299 };

      const result = await calculator.canLevelUp(character);

      expect(result.success).toBe(true);
      expect(result.data.canLevel).toBe(false);
      expect(result.data.xpNeeded).toBe(300);
    });

    test('should return false when character is at level 20', async () => {
      const character = { level: 20, experience: 400000 };

      const result = await calculator.canLevelUp(character);

      expect(result.success).toBe(true);
      expect(result.data.canLevel).toBe(false);
      expect(result.data.currentLevel).toBe(20);
      expect(result.data.nextLevel).toBe(null);
      expect(result.data.reason).toBe('Maximum level reached');
    });

    test('should validate XP thresholds for key levels', async () => {
      const testCases = [
        { level: 1, xp: 300, nextLevel: 2, canLevel: true },
        { level: 2, xp: 900, nextLevel: 3, canLevel: true },
        { level: 3, xp: 2700, nextLevel: 4, canLevel: true },
        { level: 4, xp: 6500, nextLevel: 5, canLevel: true },
        { level: 9, xp: 64000, nextLevel: 10, canLevel: true },
        { level: 19, xp: 355000, nextLevel: 20, canLevel: true }
      ];

      for (const testCase of testCases) {
        const character = { level: testCase.level, experience: testCase.xp };
        const result = await calculator.canLevelUp(character);

        expect(result.success).toBe(true);
        expect(result.data.canLevel).toBe(testCase.canLevel);
        expect(result.data.nextLevel).toBe(testCase.nextLevel);
      }
    });

    test('should return error for invalid character', async () => {
      const result = await calculator.canLevelUp({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid character');
    });
  });

  describe('_calculateHPIncrease', () => {
    test('should calculate HP increase for Fighter (d10)', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { total: 6 },
        error: null
      });

      const character = {
        class: 'Fighter',
        abilities: { constitution: 16 }  // +3 modifier
      };

      const result = await calculator._calculateHPIncrease(character);

      expect(result.success).toBe(true);
      expect(result.data.hpRoll).toBe(6);
      expect(result.data.conModifier).toBe(3);
      expect(result.data.hpIncrease).toBe(9);  // 6 + 3
    });

    test('should calculate HP increase for Wizard (d6)', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { total: 4 },
        error: null
      });

      const character = {
        class: 'Wizard',
        abilities: { constitution: 12 }  // +1 modifier
      };

      const result = await calculator._calculateHPIncrease(character);

      expect(result.success).toBe(true);
      expect(result.data.hpRoll).toBe(4);
      expect(result.data.conModifier).toBe(1);
      expect(result.data.hpIncrease).toBe(5);  // 4 + 1
    });

    test('should support manual HP entry', async () => {
      const character = {
        class: 'Fighter',
        abilities: { constitution: 14 }  // +2 modifier
      };

      const result = await calculator._calculateHPIncrease(character, { manualHP: 6 });

      expect(result.success).toBe(true);
      expect(result.data.hpRoll).toBe(6);
      expect(result.data.hpIncrease).toBe(8);  // 6 + 2
      expect(mockDiceRoller.roll).not.toHaveBeenCalled();
    });

    test('should ensure minimum 1 HP per level', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { total: 1 },
        error: null
      });

      const character = {
        class: 'Wizard',
        abilities: { constitution: 6 }  // -2 modifier
      };

      const result = await calculator._calculateHPIncrease(character);

      expect(result.success).toBe(true);
      expect(result.data.hpIncrease).toBe(1);  // Minimum 1, not -1
    });

    test('should return error for unknown class', async () => {
      const character = {
        class: 'Paladin',  // Not yet supported
        abilities: { constitution: 14 }
      };

      const result = await calculator._calculateHPIncrease(character);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown class');
    });
  });

  describe('_grantClassFeatures', () => {
    test('should grant Fighter features at level 1', async () => {
      const result = await calculator._grantClassFeatures('Fighter', 1);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Fighting Style');
      expect(result.data[1].name).toBe('Second Wind');
      expect(result.data[1].uses).toBe(1);
      expect(result.data[1].recharge).toBe('short_rest');
    });

    test('should grant Fighter Action Surge at level 2', async () => {
      const result = await calculator._grantClassFeatures('Fighter', 2);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Action Surge');
      expect(result.data[0].uses).toBe(1);
    });

    test('should grant ASI at level 4', async () => {
      const result = await calculator._grantClassFeatures('Fighter', 4);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Ability Score Improvement');
    });

    test('should grant Extra Attack at level 5', async () => {
      const result = await calculator._grantClassFeatures('Fighter', 5);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Extra Attack');
    });

    test('should return empty array when no features at level', async () => {
      const result = await calculator._grantClassFeatures('Cleric', 3);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    test('should return error for unknown class', async () => {
      const result = await calculator._grantClassFeatures('Paladin', 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Class not found');
    });
  });

  describe('applyAbilityScoreImprovement', () => {
    test('should apply +2 to one ability', async () => {
      const character = {
        level: 4,
        abilities: { strength: 16, dexterity: 14, constitution: 15, intelligence: 10, wisdom: 12, charisma: 8 },
        hitPoints: { max: 31, current: 31 },
        proficiencyBonus: 2
      };

      const result = await calculator.applyAbilityScoreImprovement(character, {
        option: '+2 to one',
        abilities: ['strength']
      });

      expect(result.success).toBe(true);
      expect(character.abilities.strength).toBe(18);
      expect(result.data.appliedIncreases).toEqual([{ ability: 'strength', increase: 2 }]);
    });

    test('should apply +1 to two abilities', async () => {
      const character = {
        level: 4,
        abilities: { strength: 16, dexterity: 14, constitution: 15, intelligence: 10, wisdom: 12, charisma: 8 },
        hitPoints: { max: 31, current: 31 },
        proficiencyBonus: 2
      };

      const result = await calculator.applyAbilityScoreImprovement(character, {
        option: '+1 to two',
        abilities: ['dexterity', 'constitution']
      });

      expect(result.success).toBe(true);
      expect(character.abilities.dexterity).toBe(15);
      expect(character.abilities.constitution).toBe(16);
      expect(result.data.appliedIncreases).toHaveLength(2);
    });

    test('should cap ability scores at 20', async () => {
      const character = {
        level: 4,
        abilities: { strength: 19, dexterity: 14, constitution: 15, intelligence: 10, wisdom: 12, charisma: 8 },
        hitPoints: { max: 31, current: 31 },
        proficiencyBonus: 2
      };

      const result = await calculator.applyAbilityScoreImprovement(character, {
        option: '+2 to one',
        abilities: ['strength']
      });

      expect(result.success).toBe(true);
      expect(character.abilities.strength).toBe(20);  // Capped at 20
      expect(result.data.warning).toContain('capped at 20');
    });

    test('should recalculate AC when Dex changes', async () => {
      const character = {
        level: 4,
        abilities: { strength: 16, dexterity: 14, constitution: 15, intelligence: 10, wisdom: 12, charisma: 8 },
        hitPoints: { max: 31, current: 31 },
        proficiencyBonus: 2,
        armorClass: 12
      };

      const result = await calculator.applyAbilityScoreImprovement(character, {
        option: '+2 to one',
        abilities: ['dexterity']
      });

      expect(result.success).toBe(true);
      expect(character.abilities.dexterity).toBe(16);
      expect(mockInventoryManager._recalculateAC).toHaveBeenCalled();
      expect(result.data.derivedStatsRecalculated).toContain('armorClass');
    });

    test('should apply retroactive HP when Con increases', async () => {
      const character = {
        level: 5,
        abilities: { strength: 16, dexterity: 14, constitution: 14, intelligence: 10, wisdom: 12, charisma: 8 },
        hitPoints: { max: 40, current: 40 },
        proficiencyBonus: 3
      };

      const result = await calculator.applyAbilityScoreImprovement(character, {
        option: '+2 to one',
        abilities: ['constitution']
      });

      expect(result.success).toBe(true);
      expect(character.abilities.constitution).toBe(16);
      // Con modifier: +2 → +3 (diff = +1), retroactive: +1 × 5 levels = +5 HP
      expect(character.hitPoints.max).toBe(45);  // 40 + 5
      expect(character.hitPoints.current).toBe(45);
      expect(result.data.derivedStatsRecalculated).toContain('hitPointsRetroactive(+5)');
    });

    test('should return error for invalid option', async () => {
      const character = {
        level: 4,
        abilities: { strength: 16, dexterity: 14, constitution: 15, intelligence: 10, wisdom: 12, charisma: 8 },
        hitPoints: { max: 31, current: 31 }
      };

      const result = await calculator.applyAbilityScoreImprovement(character, {
        option: '+3 to one',  // Invalid
        abilities: ['strength']
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid ASI option');
    });

    test('should return error for wrong number of abilities', async () => {
      const character = {
        level: 4,
        abilities: { strength: 16, dexterity: 14, constitution: 15, intelligence: 10, wisdom: 12, charisma: 8 },
        hitPoints: { max: 31, current: 31 }
      };

      const result = await calculator.applyAbilityScoreImprovement(character, {
        option: '+2 to one',
        abilities: ['strength', 'dexterity']  // Should be 1 for "+2 to one"
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('requires exactly 1 ability');
    });
  });

  describe('levelUp', () => {
    test('should successfully level up from 3 to 4', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { total: 6 },
        error: null
      });

      const character = {
        name: 'Test Fighter',
        class: 'Fighter',
        level: 3,
        experience: 2700,
        abilities: { strength: 16, dexterity: 14, constitution: 15, intelligence: 10, wisdom: 12, charisma: 8 },
        hitPoints: { max: 31, current: 31, hitDice: { total: 3, spent: 0 } },
        proficiencyBonus: 2,
        features: []
      };

      const result = await calculator.levelUp(character, { characterId: 'test-fighter' });

      expect(result.success).toBe(true);
      expect(result.data.newLevel).toBe(4);
      expect(result.data.oldLevel).toBe(3);
      expect(character.level).toBe(4);
      expect(character.hitPoints.max).toBe(39);  // 31 + 6 roll + 2 Con (15 = +2) = 39
      expect(character.hitPoints.current).toBe(39);
      expect(character.hitPoints.hitDice.total).toBe(4);
      expect(character.proficiencyBonus).toBe(2);  // No change until level 5
      expect(result.data.proficiencyBonusChanged).toBe(false);
      expect(result.data.asiAvailable).toBe(true);  // Level 4 is ASI level
      expect(character.features).toHaveLength(1);  // ASI feature
      expect(character.features[0].name).toBe('Ability Score Improvement');
    });

    test('should update proficiency bonus from level 4 to 5', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { total: 7 },
        error: null
      });

      const character = {
        name: 'Test Fighter',
        class: 'Fighter',
        level: 4,
        experience: 6500,
        abilities: { strength: 16, dexterity: 14, constitution: 15, intelligence: 10, wisdom: 12, charisma: 8 },
        hitPoints: { max: 40, current: 40, hitDice: { total: 4, spent: 0 } },
        proficiencyBonus: 2,
        features: []
      };

      const result = await calculator.levelUp(character);

      expect(result.success).toBe(true);
      expect(character.level).toBe(5);
      expect(character.proficiencyBonus).toBe(3);  // +2 → +3 at level 5
      expect(result.data.proficiencyBonusChanged).toBe(true);
      expect(character.features).toHaveLength(1);  // Extra Attack
      expect(character.features[0].name).toBe('Extra Attack');
    });

    test('should apply ASI when choices provided', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { total: 6 },
        error: null
      });

      const character = {
        name: 'Test Fighter',
        class: 'Fighter',
        level: 3,
        experience: 2700,
        abilities: { strength: 16, dexterity: 14, constitution: 15, intelligence: 10, wisdom: 12, charisma: 8 },
        hitPoints: { max: 31, current: 31, hitDice: { total: 3, spent: 0 } },
        proficiencyBonus: 2,
        features: []
      };

      const result = await calculator.levelUp(character, {
        asiChoices: {
          option: '+2 to one',
          abilities: ['strength']
        }
      });

      expect(result.success).toBe(true);
      expect(character.abilities.strength).toBe(18);  // 16 + 2
    });

    test('should return error when not eligible to level up', async () => {
      const character = {
        name: 'Test Fighter',
        class: 'Fighter',
        level: 3,
        experience: 2699,  // 1 XP short
        abilities: { strength: 16, dexterity: 14, constitution: 15, intelligence: 10, wisdom: 12, charisma: 8 },
        hitPoints: { max: 31, current: 31, hitDice: { total: 3, spent: 0 } },
        proficiencyBonus: 2
      };

      const result = await calculator.levelUp(character);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot level up');
    });

    test('should return error when at level 20', async () => {
      const character = {
        name: 'Test Fighter',
        class: 'Fighter',
        level: 20,
        experience: 400000,
        abilities: { strength: 20, dexterity: 20, constitution: 20, intelligence: 10, wisdom: 12, charisma: 8 },
        hitPoints: { max: 200, current: 200, hitDice: { total: 20, spent: 0 } },
        proficiencyBonus: 6
      };

      const result = await calculator.levelUp(character);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot level up');
    });

    test('should return error for multiclass characters', async () => {
      const character = {
        name: 'Multiclass',
        classes: ['Fighter', 'Rogue'],  // Array indicates multiclass
        level: 5,
        experience: 6500,
        abilities: { strength: 16, dexterity: 16, constitution: 14, intelligence: 10, wisdom: 12, charisma: 8 }
      };

      const result = await calculator.levelUp(character);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Multiclassing not yet supported');
    });

    test('should handle Wizard class (d6 hit die)', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { total: 4 },
        error: null
      });

      const character = {
        name: 'Test Wizard',
        class: 'Wizard',
        level: 3,
        experience: 2700,
        abilities: { strength: 8, dexterity: 14, constitution: 12, intelligence: 18, wisdom: 14, charisma: 10 },
        hitPoints: { max: 20, current: 20, hitDice: { total: 3, spent: 0 } },
        proficiencyBonus: 2,
        features: []
      };

      const result = await calculator.levelUp(character);

      expect(result.success).toBe(true);
      expect(result.data.hpIncrease).toBe(5);  // 4 (roll) + 1 (Con)
      expect(character.hitPoints.max).toBe(25);
    });

    test('should persist character and create Git commit', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { total: 6 },
        error: null
      });

      const character = {
        name: 'Kapi',
        class: 'Fighter',
        level: 3,
        experience: 2700,
        abilities: { strength: 16, dexterity: 14, constitution: 15, intelligence: 10, wisdom: 12, charisma: 8 },
        hitPoints: { max: 31, current: 31, hitDice: { total: 3, spent: 0 } },
        proficiencyBonus: 2,
        features: []
      };

      const result = await calculator.levelUp(character, { characterId: 'kapi' });

      expect(result.success).toBe(true);
      expect(mockCharacterManager.saveCharacter).toHaveBeenCalledWith('kapi', character);
    });
  });

  describe('Integration tests with real YAML files', () => {
    let realCalculator;

    beforeEach(() => {
      // Create calculator without mocks to use real YAML files
      realCalculator = new LevelUpCalculator({
        diceRoller: mockDiceRoller
      });
    });

    test('should load real XP thresholds from file', async () => {
      const character = { level: 1, experience: 300 };

      const result = await realCalculator.canLevelUp(character);

      expect(result.success).toBe(true);
      expect(result.data.xpNeeded).toBe(300);
    });

    test('should load real class features from file', async () => {
      const character = {
        name: 'Real Fighter',
        class: 'Fighter',
        level: 1,
        experience: 300,
        abilities: { strength: 16, dexterity: 14, constitution: 15, intelligence: 10, wisdom: 12, charisma: 8 },
        hitPoints: { max: 13, current: 13, hitDice: { total: 1, spent: 0 } },
        proficiencyBonus: 2,
        features: []
      };

      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { total: 8 },
        error: null
      });

      const result = await realCalculator.levelUp(character);

      expect(result.success).toBe(true);
      expect(character.features).toHaveLength(1);
      expect(character.features[0].name).toBe('Action Surge');
    });

    test('should verify all XP thresholds match D&D 5e SRD', async () => {
      const expectedThresholds = {
        2: 300, 3: 900, 4: 2700, 5: 6500, 6: 14000,
        7: 23000, 8: 34000, 9: 48000, 10: 64000, 11: 85000,
        12: 100000, 13: 120000, 14: 140000, 15: 165000, 16: 195000,
        17: 225000, 18: 265000, 19: 305000, 20: 355000
      };

      for (const [level, expectedXP] of Object.entries(expectedThresholds)) {
        const character = { level: parseInt(level) - 1, experience: expectedXP };
        const result = await realCalculator.canLevelUp(character);

        expect(result.success).toBe(true);
        expect(result.data.xpNeeded).toBe(expectedXP);
      }
    });
  });

  describe('Performance tests', () => {
    test('canLevelUp should complete in <50ms', async () => {
      const character = { level: 5, experience: 10000 };

      const start = Date.now();
      await calculator.canLevelUp(character);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });

    test('levelUp should complete in <200ms', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { total: 6 },
        error: null
      });

      const character = {
        name: 'Speed Test',
        class: 'Fighter',
        level: 3,
        experience: 2700,
        abilities: { strength: 16, dexterity: 14, constitution: 15, intelligence: 10, wisdom: 12, charisma: 8 },
        hitPoints: { max: 31, current: 31, hitDice: { total: 3, spent: 0 } },
        proficiencyBonus: 2,
        features: []
      };

      const start = Date.now();
      await calculator.levelUp(character);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
    });
  });
});
