const ConditionTracker = require('../../src/mechanics/condition-tracker');
const conditionEffects = require('../../src/mechanics/condition-effects');

describe('ConditionTracker', () => {
  let conditionTracker;
  let mockEventScheduler;
  let mockCharacterManager;
  let mockCalendarManager;
  let testCharacter;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Event Scheduler
    mockEventScheduler = {
      scheduleEvent: jest.fn().mockResolvedValue({
        success: true,
        data: { eventId: 'evt_test_123' },
        error: null
      }),
      cancelEvent: jest.fn().mockResolvedValue({
        success: true,
        data: { cancelled: true },
        error: null
      })
    };

    // Mock Character Manager
    mockCharacterManager = {
      saveCharacter: jest.fn().mockResolvedValue({
        success: true,
        data: { saved: true },
        error: null
      })
    };

    // Mock Calendar Manager
    mockCalendarManager = {
      getCurrentTime: jest.fn().mockReturnValue('735-10-13T14:30:00Z')
    };

    // Create ConditionTracker with mocked dependencies
    conditionTracker = new ConditionTracker({
      eventScheduler: mockEventScheduler,
      characterManager: mockCharacterManager,
      calendarManager: mockCalendarManager,
      conditionEffects: conditionEffects
    });

    // Test character
    testCharacter = {
      name: 'Test Fighter',
      characterId: 'char_test_001',
      level: 5,
      class: 'Fighter',
      conditions: [],
      conditionImmunities: []
    };
  });

  describe('applyCondition', () => {
    test('should apply poisoned condition successfully', async () => {
      const result = await conditionTracker.applyCondition(testCharacter, 'poisoned');

      expect(result.success).toBe(true);
      expect(result.data.condition).toBe('poisoned');
      expect(result.data.effects).toContain('Disadvantage on attack rolls');
      expect(testCharacter.conditions).toHaveLength(1);
      expect(testCharacter.conditions[0].name).toBe('poisoned');
      expect(mockCharacterManager.saveCharacter).toHaveBeenCalledWith(testCharacter);
    });

    test('should apply condition with duration and register expiration event', async () => {
      const result = await conditionTracker.applyCondition(testCharacter, 'poisoned', { duration: '1 hour' });

      expect(result.success).toBe(true);
      expect(result.data.condition).toBe('poisoned');
      expect(result.data.duration).toBe('1 hour');
      expect(result.data.eventId).toBe('evt_test_123');
      expect(testCharacter.conditions[0].expiresAt).toBeTruthy();
      expect(testCharacter.conditions[0].eventId).toBe('evt_test_123');
      expect(mockEventScheduler.scheduleEvent).toHaveBeenCalled();
    });

    test('should reject invalid condition name', async () => {
      const result = await conditionTracker.applyCondition(testCharacter, 'invalid_condition');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown condition');
      expect(testCharacter.conditions).toHaveLength(0);
      expect(mockCharacterManager.saveCharacter).not.toHaveBeenCalled();
    });

    test('should reject condition if character is immune', async () => {
      testCharacter.conditionImmunities = ['poisoned'];

      const result = await conditionTracker.applyCondition(testCharacter, 'poisoned');

      expect(result.success).toBe(false);
      expect(result.error).toContain('immune to poisoned');
      expect(testCharacter.conditions).toHaveLength(0);
    });

    test('should not stack duplicate conditions', async () => {
      await conditionTracker.applyCondition(testCharacter, 'poisoned');
      const result2 = await conditionTracker.applyCondition(testCharacter, 'poisoned');

      expect(result2.success).toBe(true);
      expect(result2.data.alreadyActive).toBe(true);
      expect(testCharacter.conditions).toHaveLength(1);
    });

    test('should apply multiple different conditions', async () => {
      await conditionTracker.applyCondition(testCharacter, 'poisoned');
      await conditionTracker.applyCondition(testCharacter, 'frightened', { source: 'Strahd' });

      expect(testCharacter.conditions).toHaveLength(2);
      expect(testCharacter.conditions[0].name).toBe('poisoned');
      expect(testCharacter.conditions[1].name).toBe('frightened');
      expect(testCharacter.conditions[1].source).toBe('Strahd');
    });

    test('should apply condition with saveEnds options', async () => {
      const result = await conditionTracker.applyCondition(testCharacter, 'frightened', {
        saveEnds: true,
        saveDC: 15,
        saveAbility: 'WIS'
      });

      expect(result.success).toBe(true);
      expect(testCharacter.conditions[0].saveEnds).toBe(true);
      expect(testCharacter.conditions[0].saveDC).toBe(15);
      expect(testCharacter.conditions[0].saveAbility).toBe('WIS');
    });

    test('should complete in <50ms', async () => {
      const start = Date.now();
      await conditionTracker.applyCondition(testCharacter, 'poisoned');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('removeCondition', () => {
    beforeEach(async () => {
      await conditionTracker.applyCondition(testCharacter, 'poisoned', { duration: '1 hour' });
    });

    test('should remove condition successfully', async () => {
      const result = await conditionTracker.removeCondition(testCharacter, 'poisoned', { reason: 'cured' });

      expect(result.success).toBe(true);
      expect(result.data.condition).toBe('poisoned');
      expect(result.data.removed).toBe(true);
      expect(result.data.reason).toBe('cured');
      expect(testCharacter.conditions).toHaveLength(0);
      expect(mockCharacterManager.saveCharacter).toHaveBeenCalled();
    });

    test('should cancel expiration event when removing condition', async () => {
      await conditionTracker.removeCondition(testCharacter, 'poisoned');

      expect(mockEventScheduler.cancelEvent).toHaveBeenCalledWith('evt_test_123');
    });

    test('should return error if condition not present', async () => {
      const result = await conditionTracker.removeCondition(testCharacter, 'stunned');

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not have stunned condition');
    });

    test('should complete in <50ms', async () => {
      const start = Date.now();
      await conditionTracker.removeCondition(testCharacter, 'poisoned');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('getActiveConditions', () => {
    test('should return empty array for character with no conditions', () => {
      const conditions = conditionTracker.getActiveConditions(testCharacter);

      expect(conditions).toEqual([]);
    });

    test('should return all active conditions with details', async () => {
      await conditionTracker.applyCondition(testCharacter, 'poisoned', { duration: '1 hour' });
      await conditionTracker.applyCondition(testCharacter, 'frightened', { source: 'Strahd' });

      const conditions = conditionTracker.getActiveConditions(testCharacter);

      expect(conditions).toHaveLength(2);
      expect(conditions[0]).toHaveProperty('name');
      expect(conditions[0]).toHaveProperty('appliedAt');
      expect(conditions[0]).toHaveProperty('effects');
      expect(conditions[1].source).toBe('Strahd');
    });

    test('should complete in <20ms', async () => {
      await conditionTracker.applyCondition(testCharacter, 'poisoned');

      const start = Date.now();
      conditionTracker.getActiveConditions(testCharacter);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(20);
    });
  });

  describe('hasCondition', () => {
    test('should return false for character without condition', () => {
      expect(conditionTracker.hasCondition(testCharacter, 'poisoned')).toBe(false);
    });

    test('should return true for character with condition', async () => {
      await conditionTracker.applyCondition(testCharacter, 'poisoned');

      expect(conditionTracker.hasCondition(testCharacter, 'poisoned')).toBe(true);
    });

    test('should be case-insensitive', async () => {
      await conditionTracker.applyCondition(testCharacter, 'poisoned');

      expect(conditionTracker.hasCondition(testCharacter, 'POISONED')).toBe(true);
      expect(conditionTracker.hasCondition(testCharacter, 'Poisoned')).toBe(true);
    });

    test('should complete in <5ms', async () => {
      await conditionTracker.applyCondition(testCharacter, 'poisoned');

      const start = Date.now();
      conditionTracker.hasCondition(testCharacter, 'poisoned');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(5);
    });
  });

  describe('getConditionEffects', () => {
    test('should return effects for valid condition', () => {
      const effects = conditionTracker.getConditionEffects('poisoned');

      expect(effects).toBeTruthy();
      expect(effects.name).toBe('poisoned');
      expect(effects.effects).toContain('Disadvantage on attack rolls');
      expect(effects.mechanicsImpact.attacks.disadvantage).toBe(true);
    });

    test('should return null for invalid condition', () => {
      const effects = conditionTracker.getConditionEffects('invalid');

      expect(effects).toBeNull();
    });

    test('should have correct effects for all 14 D&D 5e conditions', () => {
      const conditions = [
        'blinded', 'charmed', 'deafened', 'frightened', 'grappled',
        'incapacitated', 'invisible', 'paralyzed', 'petrified', 'poisoned',
        'prone', 'restrained', 'stunned', 'unconscious'
      ];

      conditions.forEach(condition => {
        const effects = conditionTracker.getConditionEffects(condition);
        expect(effects).toBeTruthy();
        expect(effects.name).toBe(condition);
        expect(effects.effects).toBeTruthy();
        expect(effects.effects.length).toBeGreaterThan(0);
      });
    });
  });

  describe('applyEffectsToRoll - Attacks', () => {
    test('should apply disadvantage to attacks when poisoned', async () => {
      await conditionTracker.applyCondition(testCharacter, 'poisoned');

      const rollData = {};
      const result = conditionTracker.applyEffectsToRoll(testCharacter, 'attack', rollData);

      expect(result.disadvantage).toBe(true);
      expect(result.appliedConditionEffects).toContain('Disadvantage on attacks (poisoned)');
    });

    test('should prevent attacks when incapacitated', async () => {
      await conditionTracker.applyCondition(testCharacter, 'incapacitated');

      const rollData = {};
      const result = conditionTracker.applyEffectsToRoll(testCharacter, 'attack', rollData);

      expect(result.prevented).toBe(true);
      expect(result.preventReason).toContain('incapacitated');
    });

    test('should apply advantage to attacks when invisible', async () => {
      await conditionTracker.applyCondition(testCharacter, 'invisible');

      const rollData = {};
      const result = conditionTracker.applyEffectsToRoll(testCharacter, 'attack', rollData);

      expect(result.advantage).toBe(true);
    });

    test('should apply disadvantage when frightened and source visible', async () => {
      await conditionTracker.applyCondition(testCharacter, 'frightened', { source: 'Strahd' });

      const rollData = { sourceVisible: true };
      const result = conditionTracker.applyEffectsToRoll(testCharacter, 'attack', rollData);

      expect(result.disadvantage).toBe(true);
    });
  });

  describe('applyEffectsToRoll - Ability Checks', () => {
    test('should apply disadvantage to ability checks when poisoned', async () => {
      await conditionTracker.applyCondition(testCharacter, 'poisoned');

      const rollData = {};
      const result = conditionTracker.applyEffectsToRoll(testCharacter, 'ability_check', rollData);

      expect(result.disadvantage).toBe(true);
    });

    test('should auto-fail sight-based checks when blinded', async () => {
      await conditionTracker.applyCondition(testCharacter, 'blinded');

      const rollData = { requiresSight: true };
      const result = conditionTracker.applyEffectsToRoll(testCharacter, 'ability_check', rollData);

      expect(result.autoFail).toBe(true);
    });

    test('should auto-fail hearing-based checks when deafened', async () => {
      await conditionTracker.applyCondition(testCharacter, 'deafened');

      const rollData = { requiresHearing: true };
      const result = conditionTracker.applyEffectsToRoll(testCharacter, 'ability_check', rollData);

      expect(result.autoFail).toBe(true);
    });
  });

  describe('applyEffectsToRoll - Saving Throws', () => {
    test('should auto-fail STR saves when paralyzed', async () => {
      await conditionTracker.applyCondition(testCharacter, 'paralyzed');

      const rollData = { ability: 'STR' };
      const result = conditionTracker.applyEffectsToRoll(testCharacter, 'saving_throw', rollData);

      expect(result.autoFail).toBe(true);
    });

    test('should auto-fail DEX saves when paralyzed', async () => {
      await conditionTracker.applyCondition(testCharacter, 'paralyzed');

      const rollData = { ability: 'DEX' };
      const result = conditionTracker.applyEffectsToRoll(testCharacter, 'saving_throw', rollData);

      expect(result.autoFail).toBe(true);
    });

    test('should not auto-fail WIS saves when paralyzed', async () => {
      await conditionTracker.applyCondition(testCharacter, 'paralyzed');

      const rollData = { ability: 'WIS' };
      const result = conditionTracker.applyEffectsToRoll(testCharacter, 'saving_throw', rollData);

      expect(result.autoFail).toBeUndefined();
    });

    test('should apply disadvantage to DEX saves when restrained', async () => {
      await conditionTracker.applyCondition(testCharacter, 'restrained');

      const rollData = { ability: 'DEX' };
      const result = conditionTracker.applyEffectsToRoll(testCharacter, 'saving_throw', rollData);

      expect(result.disadvantage).toBe(true);
    });
  });

  describe('Integration - Multiple Conditions', () => {
    test('should apply effects from multiple conditions', async () => {
      await conditionTracker.applyCondition(testCharacter, 'poisoned');
      await conditionTracker.applyCondition(testCharacter, 'prone');

      const rollData = {};
      const result = conditionTracker.applyEffectsToRoll(testCharacter, 'attack', rollData);

      expect(result.disadvantage).toBe(true);
      expect(result.appliedConditionEffects.length).toBeGreaterThan(1);
    });

    test('should handle condition removal and reapplication', async () => {
      await conditionTracker.applyCondition(testCharacter, 'poisoned');
      expect(conditionTracker.hasCondition(testCharacter, 'poisoned')).toBe(true);

      await conditionTracker.removeCondition(testCharacter, 'poisoned');
      expect(conditionTracker.hasCondition(testCharacter, 'poisoned')).toBe(false);

      await conditionTracker.applyCondition(testCharacter, 'poisoned');
      expect(conditionTracker.hasCondition(testCharacter, 'poisoned')).toBe(true);
    });
  });

  describe('Integration - CharacterManager Persistence', () => {
    test('should persist conditions when applied', async () => {
      await conditionTracker.applyCondition(testCharacter, 'poisoned');

      expect(mockCharacterManager.saveCharacter).toHaveBeenCalledWith(testCharacter);
      expect(mockCharacterManager.saveCharacter).toHaveBeenCalledTimes(1);
    });

    test('should persist conditions when removed', async () => {
      await conditionTracker.applyCondition(testCharacter, 'poisoned');
      jest.clearAllMocks();

      await conditionTracker.removeCondition(testCharacter, 'poisoned');

      expect(mockCharacterManager.saveCharacter).toHaveBeenCalledWith(testCharacter);
      expect(mockCharacterManager.saveCharacter).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration - EventScheduler', () => {
    test('should register expiration event with EventScheduler', async () => {
      await conditionTracker.applyCondition(testCharacter, 'poisoned', { duration: '1 hour' });

      expect(mockEventScheduler.scheduleEvent).toHaveBeenCalled();
      const call = mockEventScheduler.scheduleEvent.mock.calls[0][0];
      expect(call.type).toBe('condition_expiration');
      expect(call.payload.conditionName).toBe('poisoned');
    });

    test('should cancel event when condition removed', async () => {
      await conditionTracker.applyCondition(testCharacter, 'poisoned', { duration: '1 hour' });
      await conditionTracker.removeCondition(testCharacter, 'poisoned');

      expect(mockEventScheduler.cancelEvent).toHaveBeenCalledWith('evt_test_123');
    });
  });
});
