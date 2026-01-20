/**
 * CombatManager Test Suite
 *
 * Tests for D&D 5e combat initiative and turn management system.
 * Covers constructor, startCombat, nextTurn, endCombat, getCombat methods.
 *
 * Target Coverage: ≥95% statement coverage
 */

const CombatManager = require('../../src/mechanics/combat-manager');
const DiceRoller = require('../../src/mechanics/dice-roller');

describe('CombatManager', () => {
  let manager;
  let mockDiceRoller;

  beforeEach(() => {
    // Create mock dice roller
    mockDiceRoller = {
      roll: jest.fn()
    };

    // Create manager with mock
    manager = new CombatManager({ diceRoller: mockDiceRoller });
  });

  // ===== Constructor Tests =====

  describe('Constructor', () => {
    test('should create instance with default dependencies', () => {
      const defaultManager = new CombatManager();
      expect(defaultManager.diceRoller).toBeInstanceOf(DiceRoller);
      expect(defaultManager.combats).toBeInstanceOf(Map);
      expect(defaultManager.combatIdCounter).toBe(0);
    });

    test('should accept custom dependencies via DI', () => {
      expect(manager.diceRoller).toBe(mockDiceRoller);
      expect(manager.combats).toBeInstanceOf(Map);
    });
  });

  // ===== startCombat() Tests =====

  describe('startCombat()', () => {
    const validCombatants = [
      { id: 'player1', name: 'Kapi', dexModifier: 2, type: 'player' },
      { id: 'monster1', name: 'Zombie', dexModifier: -2, type: 'monster' },
      { id: 'monster2', name: 'Skeleton', dexModifier: 1, type: 'monster' }
    ];

    test('should start combat with valid combatants', async () => {
      // Mock dice rolls
      mockDiceRoller.roll
        .mockResolvedValueOnce({ success: true, data: { rolls: [15], total: 15 }, error: null })
        .mockResolvedValueOnce({ success: true, data: { rolls: [8], total: 8 }, error: null })
        .mockResolvedValueOnce({ success: true, data: { rolls: [12], total: 12 }, error: null });

      const result = await manager.startCombat(validCombatants);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('combatId');
      expect(result.data.combatants).toHaveLength(3);
      expect(result.data.currentTurn).toBe(0);
      expect(result.data.currentRound).toBe(1);
      expect(result.data.status).toBe('active');
      expect(result.data.startTime).toBeDefined();
      expect(result.error).toBeNull();
    });

    test('should sort combatants by initiative (descending)', async () => {
      // Mock dice rolls: player=15, zombie=8, skeleton=12
      mockDiceRoller.roll
        .mockResolvedValueOnce({ success: true, data: { rolls: [15], total: 15 }, error: null })
        .mockResolvedValueOnce({ success: true, data: { rolls: [8], total: 8 }, error: null })
        .mockResolvedValueOnce({ success: true, data: { rolls: [12], total: 12 }, error: null });

      const result = await manager.startCombat(validCombatants);

      expect(result.success).toBe(true);
      // Initiative: Kapi=15+2=17, Zombie=8-2=6, Skeleton=12+1=13
      // Sorted: Kapi (17), Skeleton (13), Zombie (6)
      expect(result.data.combatants[0].name).toBe('Kapi');
      expect(result.data.combatants[0].initiative).toBe(17);
      expect(result.data.combatants[1].name).toBe('Skeleton');
      expect(result.data.combatants[1].initiative).toBe(13);
      expect(result.data.combatants[2].name).toBe('Zombie');
      expect(result.data.combatants[2].initiative).toBe(6);
    });

    test('should handle initiative ties by preserving original order', async () => {
      // Mock same roll for all (will have different totals due to modifiers,
      // but test with same initiative results)
      mockDiceRoller.roll
        .mockResolvedValueOnce({ success: true, data: { rolls: [10], total: 10 }, error: null })
        .mockResolvedValueOnce({ success: true, data: { rolls: [12], total: 12 }, error: null })
        .mockResolvedValueOnce({ success: true, data: { rolls: [9], total: 9 }, error: null });

      const result = await manager.startCombat(validCombatants);

      expect(result.success).toBe(true);
      // Initiative: Kapi=10+2=12, Zombie=12-2=10, Skeleton=9+1=10
      // Sorted: Kapi (12), Zombie (10), Skeleton (10) - ties preserve order
      expect(result.data.combatants[0].name).toBe('Kapi');
      expect(result.data.combatants[0].initiative).toBe(12);
      // Zombie and Skeleton both have 10, should preserve original order
      expect(result.data.combatants[1].name).toBe('Zombie');
      expect(result.data.combatants[2].name).toBe('Skeleton');
    });

    test('should generate unique combat IDs', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { rolls: [10], total: 10 },
        error: null
      });

      const result1 = await manager.startCombat([validCombatants[0]]);
      const result2 = await manager.startCombat([validCombatants[1]]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data.combatId).not.toBe(result2.data.combatId);
    });

    test('should store combat in manager state', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { rolls: [10], total: 10 },
        error: null
      });

      const result = await manager.startCombat([validCombatants[0]]);

      expect(result.success).toBe(true);
      expect(manager.combats.has(result.data.combatId)).toBe(true);
    });

    // Error handling tests

    test('should reject non-array combatants', async () => {
      const result = await manager.startCombat('not an array');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Combatants must be an array');
    });

    test('should reject empty combatants array', async () => {
      const result = await manager.startCombat([]);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Combatants array cannot be empty');
    });

    test('should reject combatant missing id', async () => {
      const invalidCombatants = [
        { name: 'Kapi', dexModifier: 2, type: 'player' }
      ];

      const result = await manager.startCombat(invalidCombatants);

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing required field: id');
    });

    test('should reject combatant missing name', async () => {
      const invalidCombatants = [
        { id: 'player1', dexModifier: 2, type: 'player' }
      ];

      const result = await manager.startCombat(invalidCombatants);

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing required field: name');
    });

    test('should reject combatant with invalid dexModifier', async () => {
      const invalidCombatants = [
        { id: 'player1', name: 'Kapi', dexModifier: 'not a number', type: 'player' }
      ];

      const result = await manager.startCombat(invalidCombatants);

      expect(result.success).toBe(false);
      expect(result.error).toContain('dexModifier (must be a number)');
    });

    test('should handle DiceRoller failure gracefully', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: false,
        data: null,
        error: 'Dice roll error'
      });

      const result = await manager.startCombat([validCombatants[0]]);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('Initiative roll failed');
    });
  });

  // ===== nextTurn() Tests =====

  describe('nextTurn()', () => {
    let combatId;

    beforeEach(async () => {
      // Setup: Start a combat
      mockDiceRoller.roll
        .mockResolvedValueOnce({ success: true, data: { rolls: [15], total: 15 }, error: null })
        .mockResolvedValueOnce({ success: true, data: { rolls: [8], total: 8 }, error: null })
        .mockResolvedValueOnce({ success: true, data: { rolls: [12], total: 12 }, error: null });

      const combatants = [
        { id: 'player1', name: 'Kapi', dexModifier: 2, type: 'player' },
        { id: 'monster1', name: 'Zombie', dexModifier: -2, type: 'monster' },
        { id: 'monster2', name: 'Skeleton', dexModifier: 1, type: 'monster' }
      ];

      const startResult = await manager.startCombat(combatants);
      combatId = startResult.data.combatId;
    });

    test('should advance to next turn', async () => {
      const result = await manager.nextTurn(combatId);

      expect(result.success).toBe(true);
      expect(result.data.currentTurn).toBe(1);
      expect(result.data.currentRound).toBe(1);
      expect(result.error).toBeNull();
    });

    test('should advance through multiple turns', async () => {
      await manager.nextTurn(combatId);
      const result = await manager.nextTurn(combatId);

      expect(result.success).toBe(true);
      expect(result.data.currentTurn).toBe(2);
      expect(result.data.currentRound).toBe(1);
    });

    test('should reset turn and increment round at end of round', async () => {
      // Advance through 3 turns (3 combatants)
      await manager.nextTurn(combatId); // Turn 1
      await manager.nextTurn(combatId); // Turn 2
      const result = await manager.nextTurn(combatId); // Turn 3 (end of round)

      expect(result.success).toBe(true);
      expect(result.data.currentTurn).toBe(0);
      expect(result.data.currentRound).toBe(2);
    });

    test('should handle multiple complete rounds', async () => {
      // Complete 2 full rounds (6 turns total)
      for (let i = 0; i < 6; i++) {
        await manager.nextTurn(combatId);
      }

      const result = await manager.getCombat(combatId);

      expect(result.success).toBe(true);
      expect(result.data.currentTurn).toBe(0);
      expect(result.data.currentRound).toBe(3);
    });

    // Error handling tests

    test('should reject invalid combat ID (non-string)', async () => {
      const result = await manager.nextTurn(null);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Combat ID must be a non-empty string');
    });

    test('should reject empty combat ID', async () => {
      const result = await manager.nextTurn('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Combat ID must be a non-empty string');
    });

    test('should reject non-existent combat ID', async () => {
      const result = await manager.nextTurn('invalid_combat_id');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('Combat not found');
    });

    test('should reject advancing inactive combat', async () => {
      // End combat first
      await manager.endCombat(combatId);

      const result = await manager.nextTurn(combatId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Combat is not active');
    });
  });

  // ===== endCombat() Tests =====

  describe('endCombat()', () => {
    let combatId;

    beforeEach(async () => {
      // Setup: Start a combat
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { rolls: [10], total: 10 },
        error: null
      });

      const combatants = [
        { id: 'player1', name: 'Kapi', dexModifier: 2, type: 'player' }
      ];

      const startResult = await manager.startCombat(combatants);
      combatId = startResult.data.combatId;
    });

    test('should end active combat', async () => {
      const result = await manager.endCombat(combatId);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('inactive');
      expect(result.data.endTime).toBeDefined();
      expect(result.error).toBeNull();
    });

    test('should preserve combat state after ending', async () => {
      await manager.endCombat(combatId);

      const result = await manager.getCombat(combatId);

      expect(result.success).toBe(true);
      expect(result.data.combatId).toBe(combatId);
      expect(result.data.status).toBe('inactive');
    });

    test('should allow ending already inactive combat', async () => {
      await manager.endCombat(combatId);
      const result = await manager.endCombat(combatId);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('inactive');
    });

    // Error handling tests

    test('should reject invalid combat ID (non-string)', async () => {
      const result = await manager.endCombat(123);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Combat ID must be a non-empty string');
    });

    test('should reject non-existent combat ID', async () => {
      const result = await manager.endCombat('invalid_combat_id');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('Combat not found');
    });
  });

  // ===== getCombat() Tests =====

  describe('getCombat()', () => {
    let combatId;

    beforeEach(async () => {
      // Setup: Start a combat
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { rolls: [10], total: 10 },
        error: null
      });

      const combatants = [
        { id: 'player1', name: 'Kapi', dexModifier: 2, type: 'player' }
      ];

      const startResult = await manager.startCombat(combatants);
      combatId = startResult.data.combatId;
    });

    test('should retrieve active combat state', async () => {
      const result = await manager.getCombat(combatId);

      expect(result.success).toBe(true);
      expect(result.data.combatId).toBe(combatId);
      expect(result.data.status).toBe('active');
      expect(result.data.combatants).toHaveLength(1);
      expect(result.error).toBeNull();
    });

    test('should retrieve inactive combat state', async () => {
      await manager.endCombat(combatId);

      const result = await manager.getCombat(combatId);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('inactive');
    });

    // Error handling tests

    test('should reject invalid combat ID (non-string)', async () => {
      const result = await manager.getCombat(null);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Combat ID must be a non-empty string');
    });

    test('should reject non-existent combat ID', async () => {
      const result = await manager.getCombat('invalid_combat_id');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('Combat not found');
    });
  });

  // ===== Integration Tests =====

  describe('Integration Tests', () => {
    test('should support full combat workflow (start -> turns -> end)', async () => {
      const realManager = new CombatManager();

      const combatants = [
        { id: 'player1', name: 'Kapi', dexModifier: 2, type: 'player' },
        { id: 'monster1', name: 'Zombie', dexModifier: -2, type: 'monster' }
      ];

      // Start combat
      const startResult = await realManager.startCombat(combatants);
      expect(startResult.success).toBe(true);

      const combatId = startResult.data.combatId;

      // Advance 2 turns
      const turn1 = await realManager.nextTurn(combatId);
      expect(turn1.success).toBe(true);
      expect(turn1.data.currentTurn).toBe(1);

      const turn2 = await realManager.nextTurn(combatId);
      expect(turn2.success).toBe(true);
      expect(turn2.data.currentTurn).toBe(0); // Back to start
      expect(turn2.data.currentRound).toBe(2);

      // End combat
      const endResult = await realManager.endCombat(combatId);
      expect(endResult.success).toBe(true);
      expect(endResult.data.status).toBe('inactive');

      // Verify state persisted
      const getResult = await realManager.getCombat(combatId);
      expect(getResult.success).toBe(true);
      expect(getResult.data.status).toBe('inactive');
    });

    test('should support multiple concurrent combats', async () => {
      const realManager = new CombatManager();

      const combatants1 = [
        { id: 'player1', name: 'Kapi', dexModifier: 2, type: 'player' },
        { id: 'player2', name: 'Ireena', dexModifier: 1, type: 'player' }
      ];

      const combatants2 = [
        { id: 'monster1', name: 'Strahd', dexModifier: 3, type: 'monster' }
      ];

      // Start two combats
      const combat1 = await realManager.startCombat(combatants1);
      const combat2 = await realManager.startCombat(combatants2);

      expect(combat1.success).toBe(true);
      expect(combat2.success).toBe(true);
      expect(combat1.data.combatId).not.toBe(combat2.data.combatId);

      // Advance first combat
      await realManager.nextTurn(combat1.data.combatId);

      // Verify both combats are independent
      const get1 = await realManager.getCombat(combat1.data.combatId);
      const get2 = await realManager.getCombat(combat2.data.combatId);

      expect(get1.data.currentTurn).toBe(1); // Combat1 advanced
      expect(get2.data.currentTurn).toBe(0); // Combat2 not affected
    });

    test('should integrate with DiceRoller correctly', async () => {
      const realManager = new CombatManager();

      const combatants = [
        { id: 'player1', name: 'Kapi', dexModifier: 2, type: 'player' }
      ];

      const result = await realManager.startCombat(combatants);

      expect(result.success).toBe(true);
      expect(result.data.combatants[0]).toHaveProperty('initiative');
      expect(result.data.combatants[0]).toHaveProperty('roll');
      expect(result.data.combatants[0].initiative).toBeGreaterThanOrEqual(3); // Min: 1 + 2
      expect(result.data.combatants[0].initiative).toBeLessThanOrEqual(22); // Max: 20 + 2
    });
  });

  // ===== Performance Tests =====

  describe('Performance Tests', () => {
    test('should complete startCombat in < 100ms with 5 combatants', async () => {
      const realManager = new CombatManager();

      const combatants = [
        { id: 'p1', name: 'Player1', dexModifier: 2, type: 'player' },
        { id: 'p2', name: 'Player2', dexModifier: 1, type: 'player' },
        { id: 'm1', name: 'Monster1', dexModifier: -1, type: 'monster' },
        { id: 'm2', name: 'Monster2', dexModifier: 0, type: 'monster' },
        { id: 'm3', name: 'Monster3', dexModifier: 1, type: 'monster' }
      ];

      const start = Date.now();
      const result = await realManager.startCombat(combatants);
      const duration = Date.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100);
    });

    test('should complete nextTurn in < 10ms', async () => {
      const realManager = new CombatManager();

      const combatants = [
        { id: 'p1', name: 'Player1', dexModifier: 2, type: 'player' }
      ];

      const startResult = await realManager.startCombat(combatants);
      const combatId = startResult.data.combatId;

      const start = Date.now();
      const result = await realManager.nextTurn(combatId);
      const duration = Date.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(10);
    });
  });
});
