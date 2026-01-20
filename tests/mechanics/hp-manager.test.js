const HPManager = require('../../src/mechanics/hp-manager');

// Mock dependencies
const mockDiceRoller = {
  roll: jest.fn()
};

const mockCharacterManager = {
  saveCharacter: jest.fn()
};

describe('HPManager', () => {
  let hpManager;
  let testCharacter;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock implementations
    mockCharacterManager.saveCharacter.mockResolvedValue({
      success: true,
      data: { saved: true },
      error: null
    });

    hpManager = new HPManager({
      diceRoller: mockDiceRoller,
      characterManager: mockCharacterManager
    });

    // Create test character
    testCharacter = {
      name: 'Test Fighter',
      level: 5,
      class: 'Fighter',
      hitPoints: {
        current: 20,
        max: 31,
        unconscious: false,
        dead: false,
        stabilized: false,
        deathSaves: {
          successes: 0,
          failures: 0
        }
      }
    };
  });

  describe('validateHP', () => {
    test('should validate valid HP data', () => {
      const result = hpManager.validateHP(testCharacter);

      expect(result.success).toBe(true);
      expect(result.data.currentHP).toBe(20);
      expect(result.data.maxHP).toBe(31);
      expect(result.data.valid).toBe(true);
      expect(result.data.corrected).toBe(false);
    });

    test('should cap current HP at max HP', () => {
      testCharacter.hitPoints.current = 50;

      const result = hpManager.validateHP(testCharacter);

      expect(result.success).toBe(true);
      expect(result.data.currentHP).toBe(31);
      expect(result.data.corrected).toBe(true);
    });

    test('should clamp negative HP to 0', () => {
      testCharacter.hitPoints.current = -10;

      const result = hpManager.validateHP(testCharacter);

      expect(result.success).toBe(true);
      expect(result.data.currentHP).toBe(0);
      expect(result.data.corrected).toBe(true);
    });

    test('should reject missing max HP', () => {
      testCharacter.hitPoints.max = 0;

      const result = hpManager.validateHP(testCharacter);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Max HP must be a positive integer');
    });

    test('should floor non-integer current HP', () => {
      testCharacter.hitPoints.current = 20.7;

      const result = hpManager.validateHP(testCharacter);

      expect(result.success).toBe(true);
      expect(result.data.currentHP).toBe(20);
      expect(result.data.corrected).toBe(true);
    });

    test('should complete in <10ms', () => {
      const start = Date.now();
      hpManager.validateHP(testCharacter);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10);
    });
  });

  describe('applyDamage', () => {
    test('should apply normal damage', async () => {
      const result = await hpManager.applyDamage(testCharacter, 9);

      expect(result.success).toBe(true);
      expect(result.data.oldHP).toBe(20);
      expect(result.data.newHP).toBe(11);
      expect(result.data.unconscious).toBe(false);
      expect(result.data.dead).toBe(false);
      expect(testCharacter.hitPoints.current).toBe(11);
      expect(mockCharacterManager.saveCharacter).toHaveBeenCalledWith(testCharacter);
    });

    test('should mark character unconscious at 0 HP', async () => {
      const result = await hpManager.applyDamage(testCharacter, 20);

      expect(result.success).toBe(true);
      expect(result.data.oldHP).toBe(20);
      expect(result.data.newHP).toBe(0);
      expect(result.data.unconscious).toBe(true);
      expect(result.data.dead).toBe(false);
      expect(testCharacter.hitPoints.unconscious).toBe(true);
      expect(testCharacter.hitPoints.deathSaves.successes).toBe(0);
      expect(testCharacter.hitPoints.deathSaves.failures).toBe(0);
    });

    test('should handle instant death (damage >= current HP + max HP)', async () => {
      const result = await hpManager.applyDamage(testCharacter, 51); // 20 + 31 = 51

      expect(result.success).toBe(true);
      expect(result.data.oldHP).toBe(20);
      expect(result.data.newHP).toBe(0);
      expect(result.data.unconscious).toBe(false);
      expect(result.data.dead).toBe(true);
      expect(result.data.instantDeath).toBe(true);
      expect(testCharacter.hitPoints.dead).toBe(true);
      expect(testCharacter.hitPoints.unconscious).toBe(false);
    });

    test('should handle instant death at exact threshold', async () => {
      testCharacter.hitPoints.current = 20;
      const result = await hpManager.applyDamage(testCharacter, 51); // exactly current + max

      expect(result.success).toBe(true);
      expect(result.data.instantDeath).toBe(true);
      expect(result.data.dead).toBe(true);
    });

    test('should not trigger instant death just below threshold', async () => {
      testCharacter.hitPoints.current = 20;
      const result = await hpManager.applyDamage(testCharacter, 50); // just below threshold

      expect(result.success).toBe(true);
      expect(result.data.unconscious).toBe(true);
      expect(result.data.dead).toBe(false);
      expect(result.data.instantDeath).toBeUndefined();
    });

    test('should clamp HP to 0 (not negative)', async () => {
      const result = await hpManager.applyDamage(testCharacter, 30);

      expect(result.success).toBe(true);
      expect(result.data.newHP).toBe(0);
      expect(testCharacter.hitPoints.current).toBe(0);
    });

    test('should reject negative damage', async () => {
      const result = await hpManager.applyDamage(testCharacter, -5);

      expect(result.success).toBe(false);
      expect(result.error).toContain('non-negative integer');
    });

    test('should reject non-integer damage', async () => {
      const result = await hpManager.applyDamage(testCharacter, 5.5);

      expect(result.success).toBe(false);
      expect(result.error).toContain('non-negative integer');
    });

    test('should add 1 death save failure when damaging unconscious character', async () => {
      testCharacter.hitPoints.current = 0;
      testCharacter.hitPoints.unconscious = true;
      testCharacter.hitPoints.deathSaves.failures = 0;

      const result = await hpManager.applyDamage(testCharacter, 5);

      expect(result.success).toBe(true);
      expect(result.data.deathSaveFailure).toBe(true);
      expect(result.data.failures).toBe(1);
      expect(testCharacter.hitPoints.deathSaves.failures).toBe(1);
    });

    test('should add 2 death save failures for critical hit on unconscious character', async () => {
      testCharacter.hitPoints.current = 0;
      testCharacter.hitPoints.unconscious = true;
      testCharacter.hitPoints.deathSaves.failures = 0;

      const result = await hpManager.applyDamage(testCharacter, 5, { critical: true });

      expect(result.success).toBe(true);
      expect(result.data.deathSaveFailure).toBe(true);
      expect(result.data.failures).toBe(2);
      expect(testCharacter.hitPoints.deathSaves.failures).toBe(2);
    });

    test('should add 2 death save failures for melee attack on unconscious character', async () => {
      testCharacter.hitPoints.current = 0;
      testCharacter.hitPoints.unconscious = true;
      testCharacter.hitPoints.deathSaves.failures = 0;

      const result = await hpManager.applyDamage(testCharacter, 5, { melee: true });

      expect(result.success).toBe(true);
      expect(result.data.deathSaveFailure).toBe(true);
      expect(result.data.failures).toBe(2);
    });

    test('should kill character if damage while unconscious causes 3rd failure', async () => {
      testCharacter.hitPoints.current = 0;
      testCharacter.hitPoints.unconscious = true;
      testCharacter.hitPoints.deathSaves.failures = 2;

      const result = await hpManager.applyDamage(testCharacter, 5);

      expect(result.success).toBe(true);
      expect(result.data.dead).toBe(true);
      expect(testCharacter.hitPoints.dead).toBe(true);
      expect(testCharacter.hitPoints.deathSaves.failures).toBe(3);
    });

    test('should complete in <50ms', async () => {
      const start = Date.now();
      await hpManager.applyDamage(testCharacter, 5);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('applyHealing', () => {
    test('should apply normal healing', async () => {
      testCharacter.hitPoints.current = 15;

      const result = await hpManager.applyHealing(testCharacter, 10);

      expect(result.success).toBe(true);
      expect(result.data.oldHP).toBe(15);
      expect(result.data.newHP).toBe(25);
      expect(result.data.maxHP).toBe(31);
      expect(result.data.restoredConsciousness).toBe(false);
      expect(testCharacter.hitPoints.current).toBe(25);
    });

    test('should cap healing at max HP', async () => {
      testCharacter.hitPoints.current = 25;

      const result = await hpManager.applyHealing(testCharacter, 10);

      expect(result.success).toBe(true);
      expect(result.data.oldHP).toBe(25);
      expect(result.data.newHP).toBe(31);
      expect(testCharacter.hitPoints.current).toBe(31);
    });

    test('should restore consciousness when healing from 0 HP', async () => {
      testCharacter.hitPoints.current = 0;
      testCharacter.hitPoints.unconscious = true;
      testCharacter.hitPoints.deathSaves.successes = 2;
      testCharacter.hitPoints.deathSaves.failures = 1;

      const result = await hpManager.applyHealing(testCharacter, 5);

      expect(result.success).toBe(true);
      expect(result.data.oldHP).toBe(0);
      expect(result.data.newHP).toBe(5);
      expect(result.data.restoredConsciousness).toBe(true);
      expect(testCharacter.hitPoints.unconscious).toBe(false);
      expect(testCharacter.hitPoints.deathSaves.successes).toBe(0);
      expect(testCharacter.hitPoints.deathSaves.failures).toBe(0);
    });

    test('should clear stabilized flag when healing from 0 HP', async () => {
      testCharacter.hitPoints.current = 0;
      testCharacter.hitPoints.unconscious = true;
      testCharacter.hitPoints.stabilized = true;

      const result = await hpManager.applyHealing(testCharacter, 5);

      expect(result.success).toBe(true);
      expect(result.data.restoredConsciousness).toBe(true);
      expect(testCharacter.hitPoints.stabilized).toBe(false);
    });

    test('should not heal dead characters', async () => {
      testCharacter.hitPoints.dead = true;

      const result = await hpManager.applyHealing(testCharacter, 10);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot heal dead characters');
    });

    test('should reject negative healing', async () => {
      const result = await hpManager.applyHealing(testCharacter, -5);

      expect(result.success).toBe(false);
      expect(result.error).toContain('non-negative integer');
    });

    test('should reject non-integer healing', async () => {
      const result = await hpManager.applyHealing(testCharacter, 5.5);

      expect(result.success).toBe(false);
      expect(result.error).toContain('non-negative integer');
    });

    test('should complete in <50ms', async () => {
      const start = Date.now();
      await hpManager.applyHealing(testCharacter, 5);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('makeDeathSave', () => {
    beforeEach(() => {
      testCharacter.hitPoints.current = 0;
      testCharacter.hitPoints.unconscious = true;
    });

    test('should record success on roll >= 10', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { total: 15, rolls: [15], modifier: 0, notation: '1d20' },
        error: null
      });

      const result = await hpManager.makeDeathSave(testCharacter);

      expect(result.success).toBe(true);
      expect(result.data.roll).toBe(15);
      expect(result.data.result).toBe('success');
      expect(result.data.successes).toBe(1);
      expect(result.data.failures).toBe(0);
      expect(result.data.stabilized).toBe(false);
      expect(result.data.dead).toBe(false);
      expect(mockDiceRoller.roll).toHaveBeenCalledWith('1d20');
    });

    test('should record failure on roll < 10', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { total: 5, rolls: [5], modifier: 0, notation: '1d20' },
        error: null
      });

      const result = await hpManager.makeDeathSave(testCharacter);

      expect(result.success).toBe(true);
      expect(result.data.roll).toBe(5);
      expect(result.data.result).toBe('failure');
      expect(result.data.successes).toBe(0);
      expect(result.data.failures).toBe(1);
      expect(result.data.stabilized).toBe(false);
      expect(result.data.dead).toBe(false);
    });

    test('should regain 1 HP and consciousness on natural 20', async () => {
      testCharacter.hitPoints.deathSaves.successes = 1;
      testCharacter.hitPoints.deathSaves.failures = 1;

      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { total: 20, rolls: [20], modifier: 0, notation: '1d20' },
        error: null
      });

      const result = await hpManager.makeDeathSave(testCharacter);

      expect(result.success).toBe(true);
      expect(result.data.roll).toBe(20);
      expect(result.data.result).toBe('critical_success');
      expect(result.data.successes).toBe(0);
      expect(result.data.failures).toBe(0);
      expect(result.data.stabilized).toBe(false);
      expect(result.data.dead).toBe(false);
      expect(result.data.regainedConsciousness).toBe(true);
      expect(result.data.newHP).toBe(1);
      expect(testCharacter.hitPoints.current).toBe(1);
      expect(testCharacter.hitPoints.unconscious).toBe(false);
    });

    test('should add 2 failures on natural 1', async () => {
      testCharacter.hitPoints.deathSaves.successes = 1;
      testCharacter.hitPoints.deathSaves.failures = 0;

      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { total: 1, rolls: [1], modifier: 0, notation: '1d20' },
        error: null
      });

      const result = await hpManager.makeDeathSave(testCharacter);

      expect(result.success).toBe(true);
      expect(result.data.roll).toBe(1);
      expect(result.data.result).toBe('critical_failure');
      expect(result.data.successes).toBe(1);
      expect(result.data.failures).toBe(2);
      expect(result.data.dead).toBe(false);
    });

    test('should kill character on natural 1 with 2 existing failures', async () => {
      testCharacter.hitPoints.deathSaves.failures = 2;

      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { total: 1, rolls: [1], modifier: 0, notation: '1d20' },
        error: null
      });

      const result = await hpManager.makeDeathSave(testCharacter);

      expect(result.success).toBe(true);
      expect(result.data.dead).toBe(true);
      expect(result.data.failures).toBe(4); // 2 + 2 from natural 1
      expect(testCharacter.hitPoints.dead).toBe(true);
    });

    test('should stabilize on 3rd success', async () => {
      testCharacter.hitPoints.deathSaves.successes = 2;
      testCharacter.hitPoints.deathSaves.failures = 1;

      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { total: 15, rolls: [15], modifier: 0, notation: '1d20' },
        error: null
      });

      const result = await hpManager.makeDeathSave(testCharacter);

      expect(result.success).toBe(true);
      expect(result.data.successes).toBe(0); // Cleared after stabilization
      expect(result.data.failures).toBe(0); // Cleared after stabilization
      expect(result.data.stabilized).toBe(true);
      expect(result.data.dead).toBe(false);
      expect(testCharacter.hitPoints.stabilized).toBe(true);
      expect(testCharacter.hitPoints.unconscious).toBe(true); // Still unconscious
      expect(testCharacter.hitPoints.current).toBe(0); // Still at 0 HP
    });

    test('should kill character on 3rd failure', async () => {
      testCharacter.hitPoints.deathSaves.successes = 1;
      testCharacter.hitPoints.deathSaves.failures = 2;

      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { total: 5, rolls: [5], modifier: 0, notation: '1d20' },
        error: null
      });

      const result = await hpManager.makeDeathSave(testCharacter);

      expect(result.success).toBe(true);
      expect(result.data.dead).toBe(true);
      expect(result.data.failures).toBe(3);
      expect(testCharacter.hitPoints.dead).toBe(true);
    });

    test('should reject death save if character has HP', async () => {
      testCharacter.hitPoints.current = 10;

      const result = await hpManager.makeDeathSave(testCharacter);

      expect(result.success).toBe(false);
      expect(result.error).toContain('must be at 0 HP');
    });

    test('should reject death save if character is dead', async () => {
      testCharacter.hitPoints.dead = true;

      const result = await hpManager.makeDeathSave(testCharacter);

      expect(result.success).toBe(false);
      expect(result.error).toContain('is dead');
    });

    test('should reject death save if character is not unconscious', async () => {
      testCharacter.hitPoints.unconscious = false;

      const result = await hpManager.makeDeathSave(testCharacter);

      expect(result.success).toBe(false);
      expect(result.error).toContain('must be unconscious');
    });

    test('should reject death save if character is stabilized', async () => {
      testCharacter.hitPoints.stabilized = true;

      const result = await hpManager.makeDeathSave(testCharacter);

      expect(result.success).toBe(false);
      expect(result.error).toContain('is stabilized');
    });

    test('should complete in <100ms', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { total: 15, rolls: [15], modifier: 0, notation: '1d20' },
        error: null
      });

      const start = Date.now();
      await hpManager.makeDeathSave(testCharacter);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Integration tests', () => {
    test('full damage workflow: normal damage → 0 HP → unconscious → death save → stabilize', async () => {
      mockDiceRoller.roll.mockResolvedValueOnce({
        success: true,
        data: { total: 12, rolls: [12], modifier: 0, notation: '1d20' },
        error: null
      }).mockResolvedValueOnce({
        success: true,
        data: { total: 14, rolls: [14], modifier: 0, notation: '1d20' },
        error: null
      }).mockResolvedValueOnce({
        success: true,
        data: { total: 16, rolls: [16], modifier: 0, notation: '1d20' },
        error: null
      });

      // Apply damage to reach 0 HP
      const damageResult = await hpManager.applyDamage(testCharacter, 20);
      expect(damageResult.data.newHP).toBe(0);
      expect(damageResult.data.unconscious).toBe(true);

      // Make 3 successful death saves
      const save1 = await hpManager.makeDeathSave(testCharacter);
      expect(save1.data.successes).toBe(1);

      const save2 = await hpManager.makeDeathSave(testCharacter);
      expect(save2.data.successes).toBe(2);

      const save3 = await hpManager.makeDeathSave(testCharacter);
      expect(save3.data.stabilized).toBe(true);
      expect(testCharacter.hitPoints.stabilized).toBe(true);
    });

    test('full healing workflow: unconscious → healing → conscious', async () => {
      testCharacter.hitPoints.current = 0;
      testCharacter.hitPoints.unconscious = true;
      testCharacter.hitPoints.deathSaves.successes = 2;
      testCharacter.hitPoints.deathSaves.failures = 1;

      const healResult = await hpManager.applyHealing(testCharacter, 10);

      expect(healResult.data.newHP).toBe(10);
      expect(healResult.data.restoredConsciousness).toBe(true);
      expect(testCharacter.hitPoints.unconscious).toBe(false);
      expect(testCharacter.hitPoints.deathSaves.successes).toBe(0);
      expect(testCharacter.hitPoints.deathSaves.failures).toBe(0);
    });

    test('character persistence called for all operations', async () => {
      await hpManager.applyDamage(testCharacter, 5);
      expect(mockCharacterManager.saveCharacter).toHaveBeenCalledTimes(1);

      await hpManager.applyHealing(testCharacter, 3);
      expect(mockCharacterManager.saveCharacter).toHaveBeenCalledTimes(2);

      testCharacter.hitPoints.current = 0;
      testCharacter.hitPoints.unconscious = true;
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { total: 15, rolls: [15], modifier: 0, notation: '1d20' },
        error: null
      });

      await hpManager.makeDeathSave(testCharacter);
      expect(mockCharacterManager.saveCharacter).toHaveBeenCalledTimes(3);
    });
  });
});
