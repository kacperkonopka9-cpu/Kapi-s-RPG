/**
 * Tests for RestHandler
 * D&D 5e Short Rest and Long Rest Mechanics
 */

const RestHandler = require('../../src/mechanics/rest-handler.js');

describe('RestHandler', () => {
  let restHandler;
  let mockCharacterManager;
  let mockCalendarManager;
  let mockDiceRoller;
  let mockConditionTracker;
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

    // Mock CalendarManager
    mockCalendarManager = {
      advanceTime: jest.fn().mockReturnValue({
        success: true,
        data: { oldTime: '735-10-15 22:00', newTime: '735-10-16 06:00' },
        error: null
      })
    };

    // Mock DiceRoller
    mockDiceRoller = {
      roll: jest.fn().mockReturnValue({
        success: true,
        data: { total: 7, rolls: [7], breakdown: '1d10: 7' },
        error: null
      })
    };

    // Mock ConditionTracker
    mockConditionTracker = {
      removeCondition: jest.fn().mockResolvedValue({
        success: true,
        data: { condition: 'exhaustion', removed: true, reason: 'long rest' },
        error: null
      })
    };

    // Create RestHandler with mocked dependencies
    restHandler = new RestHandler({
      characterManager: mockCharacterManager,
      calendarManager: mockCalendarManager,
      diceRoller: mockDiceRoller,
      conditionTracker: mockConditionTracker
    });

    // Test character
    testCharacter = {
      name: 'Test Fighter',
      class: 'Fighter',
      level: 3,
      abilities: {
        strength: 16,
        dexterity: 14,
        constitution: 15,
        intelligence: 10,
        wisdom: 12,
        charisma: 8
      },
      hitPoints: {
        max: 31,
        current: 24,
        hitDice: {
          total: 3,
          spent: 2
        }
      },
      spellcasting: null,
      classFeatures: {},
      conditions: []
    };
  });

  // ============================================
  // Long Rest Tests
  // ============================================

  describe('longRest', () => {
    test('should restore HP to maximum during long rest', async () => {
      const result = await restHandler.longRest(testCharacter);

      expect(result.success).toBe(true);
      expect(testCharacter.hitPoints.current).toBe(31);
      expect(result.data.hpRestored).toBe(7); // 31 - 24 = 7
      expect(mockCharacterManager.saveCharacter).toHaveBeenCalledWith(testCharacter);
    });

    test('should restore all spell slots to maximum during long rest', async () => {
      testCharacter.spellcasting = {
        ability: 'intelligence',
        spellSlots: {
          1: { max: 3, current: 0 },
          2: { max: 2, current: 1 }
        }
      };

      const result = await restHandler.longRest(testCharacter);

      expect(result.success).toBe(true);
      expect(testCharacter.spellcasting.spellSlots[1].current).toBe(3);
      expect(testCharacter.spellcasting.spellSlots[2].current).toBe(2);
      expect(result.data.slotsRestored).toBe(true);
    });

    test('should recover half spent hit dice (rounded down, min 1) during long rest', async () => {
      testCharacter.hitPoints.hitDice.spent = 2;

      const result = await restHandler.longRest(testCharacter);

      expect(result.success).toBe(true);
      expect(testCharacter.hitPoints.hitDice.spent).toBe(1); // 2 spent -> recover 1, 1 remains spent
      expect(result.data.hitDiceRecovered).toBe(1);
    });

    test('should recover minimum 1 hit die even with 1 spent', async () => {
      testCharacter.hitPoints.hitDice.spent = 1;

      const result = await restHandler.longRest(testCharacter);

      expect(result.success).toBe(true);
      expect(testCharacter.hitPoints.hitDice.spent).toBe(0); // 1 spent -> recover 1
      expect(result.data.hitDiceRecovered).toBe(1);
    });

    test('should not recover hit dice if none spent', async () => {
      testCharacter.hitPoints.hitDice.spent = 0;

      const result = await restHandler.longRest(testCharacter);

      expect(result.success).toBe(true);
      expect(testCharacter.hitPoints.hitDice.spent).toBe(0);
      expect(result.data.hitDiceRecovered).toBe(0);
    });

    test('should recover half of 3 spent hit dice (1 recovered)', async () => {
      testCharacter.hitPoints.hitDice.spent = 3;

      const result = await restHandler.longRest(testCharacter);

      expect(result.success).toBe(true);
      expect(testCharacter.hitPoints.hitDice.spent).toBe(2); // 3 spent -> recover 1, 2 remain spent
      expect(result.data.hitDiceRecovered).toBe(1);
    });

    test('should reduce exhaustion by 1 level during long rest', async () => {
      testCharacter.conditions = [
        { name: 'exhaustion', level: 2, appliedAt: '735-10-15T22:00:00Z' }
      ];

      const result = await restHandler.longRest(testCharacter);

      expect(result.success).toBe(true);
      expect(result.data.exhaustionReduced).toBe(true);
      expect(mockConditionTracker.removeCondition).toHaveBeenCalledWith(
        testCharacter,
        'exhaustion',
        { reason: 'long rest' }
      );
    });

    test('should not reduce exhaustion if character has no exhaustion', async () => {
      testCharacter.conditions = [];

      const result = await restHandler.longRest(testCharacter);

      expect(result.success).toBe(true);
      expect(result.data.exhaustionReduced).toBe(false);
      expect(mockConditionTracker.removeCondition).not.toHaveBeenCalled();
    });

    test('should advance time 8 hours during long rest', async () => {
      const result = await restHandler.longRest(testCharacter);

      expect(result.success).toBe(true);
      expect(mockCalendarManager.advanceTime).toHaveBeenCalledWith(8, 'hours', 'Long rest');
      expect(result.data.timeAdvanced).toBe('8 hours');
      expect(result.data.newTime).toBe('735-10-16 06:00');
    });

    test('should complete long rest within performance target (<2s)', async () => {
      const startTime = Date.now();
      await restHandler.longRest(testCharacter);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000);
    });

    test('should return error if character missing hitPoints data', async () => {
      delete testCharacter.hitPoints;

      const result = await restHandler.longRest(testCharacter);

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing hitPoints data');
    });

    test('should handle interrupted long rest', async () => {
      const result = await restHandler.longRest(testCharacter, {
        interrupted: true,
        timeElapsed: 3
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('interrupted');
      expect(result.data.interrupted).toBe(true);
      expect(result.data.hpRestored).toBe(0); // No benefits on interruption
      expect(result.data.timeAdvanced).toBe('3 hours');
      expect(mockCalendarManager.advanceTime).toHaveBeenCalledWith(3, 'hours', 'Long rest (interrupted)');
    });

    test('should return error if CharacterManager save fails', async () => {
      mockCharacterManager.saveCharacter.mockResolvedValue({
        success: false,
        data: null,
        error: 'Save failed'
      });

      const result = await restHandler.longRest(testCharacter);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to save character');
    });
  });

  // ============================================
  // Short Rest Tests
  // ============================================

  describe('shortRest', () => {
    test('should spend 1 hit die and heal character during short rest', async () => {
      testCharacter.hitPoints.current = 20;
      testCharacter.hitPoints.hitDice.spent = 1; // 2 available (3 total - 1 spent)

      mockDiceRoller.roll.mockReturnValue({
        success: true,
        data: { total: 7, rolls: [7], breakdown: '1d10: 7' },
        error: null
      });

      const result = await restHandler.shortRest(testCharacter, { hitDiceToSpend: 1 });

      expect(result.success).toBe(true);
      expect(result.data.hitDiceRolls).toHaveLength(1);
      expect(result.data.hitDiceRolls[0].die).toBe('1d10'); // Fighter uses d10
      expect(result.data.hitDiceRolls[0].roll).toBe(7);
      expect(result.data.hitDiceRolls[0].modifier).toBe(2); // Con 15 = +2
      expect(result.data.hitDiceRolls[0].healing).toBe(9); // 7 + 2 = 9
      expect(testCharacter.hitPoints.current).toBe(29); // 20 + 9 = 29
      expect(result.data.hpRestored).toBe(9);
    });

    test('should spend multiple hit dice during short rest', async () => {
      testCharacter.hitPoints.current = 15;
      testCharacter.hitPoints.hitDice.spent = 0; // 3 available

      let rollCount = 0;
      mockDiceRoller.roll.mockImplementation(() => {
        const rolls = [7, 4]; // First roll: 7, second roll: 4
        const total = rolls[rollCount++];
        return {
          success: true,
          data: { total, rolls: [total], breakdown: `1d10: ${total}` },
          error: null
        };
      });

      const result = await restHandler.shortRest(testCharacter, { hitDiceToSpend: 2 });

      expect(result.success).toBe(true);
      expect(result.data.hitDiceRolls).toHaveLength(2);
      expect(result.data.hitDiceRolls[0].healing).toBe(9); // 7 + 2 = 9
      expect(result.data.hitDiceRolls[1].healing).toBe(6); // 4 + 2 = 6
      expect(testCharacter.hitPoints.current).toBe(30); // 15 + 9 + 6 = 30 (capped at 31)
      expect(result.data.hpRestored).toBe(15);
      expect(testCharacter.hitPoints.hitDice.spent).toBe(2);
    });

    test('should cap healing at max HP during short rest', async () => {
      testCharacter.hitPoints.current = 28;
      testCharacter.hitPoints.hitDice.spent = 0;

      mockDiceRoller.roll.mockReturnValue({
        success: true,
        data: { total: 10, rolls: [10], breakdown: '1d10: 10' },
        error: null
      });

      const result = await restHandler.shortRest(testCharacter, { hitDiceToSpend: 1 });

      expect(result.success).toBe(true);
      expect(testCharacter.hitPoints.current).toBe(31); // Capped at max (28 + 12 would be 40)
      expect(result.data.hpRestored).toBe(3); // Only 3 HP gained before cap
    });

    test('should return error if insufficient hit dice available', async () => {
      testCharacter.hitPoints.hitDice.spent = 2; // Only 1 available (3 total - 2 spent)

      const result = await restHandler.shortRest(testCharacter, { hitDiceToSpend: 2 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient hit dice');
      expect(result.error).toContain('1 available');
    });

    test('should return error if no hit dice available', async () => {
      testCharacter.hitPoints.hitDice.spent = 3; // All spent

      const result = await restHandler.shortRest(testCharacter, { hitDiceToSpend: 1 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient hit dice');
    });

    test('should return error for negative hit dice request', async () => {
      const result = await restHandler.shortRest(testCharacter, { hitDiceToSpend: -1 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot be negative');
    });

    test('should advance time 1 hour during short rest', async () => {
      const result = await restHandler.shortRest(testCharacter, { hitDiceToSpend: 0 });

      expect(result.success).toBe(true);
      expect(mockCalendarManager.advanceTime).toHaveBeenCalledWith(1, 'hour', 'Short rest');
      expect(result.data.timeAdvanced).toBe('1 hour');
    });

    test('should complete short rest within performance target (<1s)', async () => {
      const startTime = Date.now();
      await restHandler.shortRest(testCharacter, { hitDiceToSpend: 0 });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('should allow short rest with 0 hit dice spent (time advancement only)', async () => {
      const result = await restHandler.shortRest(testCharacter, { hitDiceToSpend: 0 });

      expect(result.success).toBe(true);
      expect(result.data.hitDiceSpent).toBe(0);
      expect(result.data.hpRestored).toBe(0);
      expect(result.data.timeAdvanced).toBe('1 hour');
    });

    test('should return error if character missing hitPoints data', async () => {
      delete testCharacter.hitPoints;

      const result = await restHandler.shortRest(testCharacter, { hitDiceToSpend: 1 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing hitPoints data');
    });

    test('should return error if dice roll fails', async () => {
      mockDiceRoller.roll.mockReturnValue({
        success: false,
        data: null,
        error: 'Roll failed'
      });

      const result = await restHandler.shortRest(testCharacter, { hitDiceToSpend: 1 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to roll hit die');
    });
  });

  // ============================================
  // Class Feature Recovery Tests
  // ============================================

  describe('Class Feature Recovery', () => {
    test('should restore Fighter Second Wind on short rest', async () => {
      testCharacter.class = 'Fighter';
      testCharacter.classFeatures = {
        secondWind: {
          usesPerShortRest: 1,
          used: 1
        }
      };

      const result = await restHandler.shortRest(testCharacter, { hitDiceToSpend: 0 });

      expect(result.success).toBe(true);
      expect(testCharacter.classFeatures.secondWind.used).toBe(0);
      expect(result.data.classFeatures).toContain('Second Wind');
    });

    test('should restore Warlock Pact Magic slots on short rest', async () => {
      testCharacter.class = 'Warlock';
      testCharacter.spellcasting = {
        ability: 'charisma',
        spellSlots: {
          1: { max: 2, current: 0 },
          2: { max: 2, current: 1 }
        }
      };

      const result = await restHandler.shortRest(testCharacter, { hitDiceToSpend: 0 });

      expect(result.success).toBe(true);
      expect(testCharacter.spellcasting.spellSlots[1].current).toBe(2);
      expect(testCharacter.spellcasting.spellSlots[2].current).toBe(2);
      expect(result.data.classFeatures).toContain('Pact Magic');
    });

    test('should restore Monk Ki points on short rest', async () => {
      testCharacter.class = 'Monk';
      testCharacter.classFeatures = {
        kiPoints: {
          max: 3,
          current: 0
        }
      };

      const result = await restHandler.shortRest(testCharacter, { hitDiceToSpend: 0 });

      expect(result.success).toBe(true);
      expect(testCharacter.classFeatures.kiPoints.current).toBe(3);
      expect(result.data.classFeatures).toContain('Ki Points');
    });

    test('should not restore class features for classes without short rest features', async () => {
      testCharacter.class = 'Wizard';
      testCharacter.classFeatures = {};

      const result = await restHandler.shortRest(testCharacter, { hitDiceToSpend: 0 });

      expect(result.success).toBe(true);
      expect(result.data.classFeatures).toHaveLength(0);
    });
  });

  // ============================================
  // Hit Die Type Detection Tests
  // ============================================

  describe('Hit Die Type Detection', () => {
    test('should use d12 for Barbarian', async () => {
      testCharacter.class = 'Barbarian';
      testCharacter.hitPoints.hitDice.spent = 0;

      await restHandler.shortRest(testCharacter, { hitDiceToSpend: 1 });

      expect(mockDiceRoller.roll).toHaveBeenCalledWith('1d12');
    });

    test('should use d10 for Fighter', async () => {
      testCharacter.class = 'Fighter';
      testCharacter.hitPoints.hitDice.spent = 0;

      await restHandler.shortRest(testCharacter, { hitDiceToSpend: 1 });

      expect(mockDiceRoller.roll).toHaveBeenCalledWith('1d10');
    });

    test('should use d10 for Paladin', async () => {
      testCharacter.class = 'Paladin';
      testCharacter.hitPoints.hitDice.spent = 0;

      await restHandler.shortRest(testCharacter, { hitDiceToSpend: 1 });

      expect(mockDiceRoller.roll).toHaveBeenCalledWith('1d10');
    });

    test('should use d8 for Cleric', async () => {
      testCharacter.class = 'Cleric';
      testCharacter.hitPoints.hitDice.spent = 0;

      await restHandler.shortRest(testCharacter, { hitDiceToSpend: 1 });

      expect(mockDiceRoller.roll).toHaveBeenCalledWith('1d8');
    });

    test('should use d8 for Rogue', async () => {
      testCharacter.class = 'Rogue';
      testCharacter.hitPoints.hitDice.spent = 0;

      await restHandler.shortRest(testCharacter, { hitDiceToSpend: 1 });

      expect(mockDiceRoller.roll).toHaveBeenCalledWith('1d8');
    });

    test('should use d6 for Wizard', async () => {
      testCharacter.class = 'Wizard';
      testCharacter.hitPoints.hitDice.spent = 0;

      await restHandler.shortRest(testCharacter, { hitDiceToSpend: 1 });

      expect(mockDiceRoller.roll).toHaveBeenCalledWith('1d6');
    });

    test('should use d6 for Sorcerer', async () => {
      testCharacter.class = 'Sorcerer';
      testCharacter.hitPoints.hitDice.spent = 0;

      await restHandler.shortRest(testCharacter, { hitDiceToSpend: 1 });

      expect(mockDiceRoller.roll).toHaveBeenCalledWith('1d6');
    });

    test('should default to d8 for unknown class', async () => {
      testCharacter.class = 'UnknownClass';
      testCharacter.hitPoints.hitDice.spent = 0;

      await restHandler.shortRest(testCharacter, { hitDiceToSpend: 1 });

      expect(mockDiceRoller.roll).toHaveBeenCalledWith('1d8');
    });
  });

  // ============================================
  // Integration Tests
  // ============================================

  describe('Integration Tests', () => {
    test('should handle full long rest workflow', async () => {
      testCharacter.hitPoints.current = 10;
      testCharacter.hitPoints.hitDice.spent = 2;
      testCharacter.spellcasting = {
        spellSlots: {
          1: { max: 3, current: 0 }
        }
      };
      testCharacter.conditions = [{ name: 'exhaustion', level: 1 }];

      const result = await restHandler.longRest(testCharacter);

      expect(result.success).toBe(true);
      expect(testCharacter.hitPoints.current).toBe(31);
      expect(testCharacter.hitPoints.hitDice.spent).toBe(1);
      expect(testCharacter.spellcasting.spellSlots[1].current).toBe(3);
      expect(result.data.hpRestored).toBe(21);
      expect(result.data.hitDiceRecovered).toBe(1);
      expect(result.data.slotsRestored).toBe(true);
      expect(result.data.exhaustionReduced).toBe(true);
      expect(mockCharacterManager.saveCharacter).toHaveBeenCalled();
      expect(mockCalendarManager.advanceTime).toHaveBeenCalledWith(8, 'hours', 'Long rest');
    });

    test('should handle full short rest workflow with healing', async () => {
      testCharacter.hitPoints.current = 20;
      testCharacter.hitPoints.hitDice.spent = 0;

      const result = await restHandler.shortRest(testCharacter, { hitDiceToSpend: 1 });

      expect(result.success).toBe(true);
      expect(result.data.hitDiceSpent).toBe(1);
      expect(testCharacter.hitPoints.hitDice.spent).toBe(1);
      expect(mockDiceRoller.roll).toHaveBeenCalled();
      expect(mockCharacterManager.saveCharacter).toHaveBeenCalled();
      expect(mockCalendarManager.advanceTime).toHaveBeenCalledWith(1, 'hour', 'Short rest');
    });

    test('should handle character with no spellcasting', async () => {
      testCharacter.spellcasting = null;

      const result = await restHandler.longRest(testCharacter);

      expect(result.success).toBe(true);
      expect(result.data.slotsRestored).toBe(false);
    });

    test('should handle character at max HP', async () => {
      testCharacter.hitPoints.current = 31;

      const result = await restHandler.longRest(testCharacter);

      expect(result.success).toBe(true);
      expect(result.data.hpRestored).toBe(0);
      expect(testCharacter.hitPoints.current).toBe(31);
    });

    test('should handle character at 0 HP', async () => {
      testCharacter.hitPoints.current = 0;

      const result = await restHandler.longRest(testCharacter);

      expect(result.success).toBe(true);
      expect(testCharacter.hitPoints.current).toBe(31);
      expect(result.data.hpRestored).toBe(31);
    });
  });
});
