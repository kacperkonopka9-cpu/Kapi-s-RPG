/**
 * Unit tests for DiceRoller module
 * Target: ≥95% statement coverage
 *
 * Tests cover:
 * - Constructor and dependency injection
 * - Notation validation
 * - Notation parsing
 * - Basic dice rolling
 * - Advantage mechanic
 * - Disadvantage mechanic
 * - Result object format
 * - Randomness distribution
 * - Performance benchmarks
 * - Edge cases and error handling
 */

const DiceRoller = require('../../src/mechanics/dice-roller');

describe('DiceRoller', () => {
  // ========================================================================
  // Constructor and Initialization
  // ========================================================================

  describe('Constructor', () => {
    test('should initialize with default dependencies', () => {
      const roller = new DiceRoller();

      expect(roller.randomInt).toBeDefined();
      expect(typeof roller.randomInt).toBe('function');
    });

    test('should accept custom randomInt via dependency injection', () => {
      const mockRandomInt = jest.fn();
      const roller = new DiceRoller({ randomInt: mockRandomInt });

      expect(roller.randomInt).toBe(mockRandomInt);
    });
  });

  // ========================================================================
  // Notation Validation
  // ========================================================================

  describe('validateNotation()', () => {
    let roller;

    beforeEach(() => {
      roller = new DiceRoller();
    });

    // Valid notation tests
    test.each([
      ['1d20', true],
      ['2d6+3', true],
      ['3d8-2', true],
      ['4d10', true],
      ['1D20', true], // Case insensitive
      ['2D6+3', true],
      ['20d100', true], // Max limits
      ['1d4-999', true] // Max modifier
    ])('should validate "%s" as %s', (notation, expected) => {
      expect(roller.validateNotation(notation)).toBe(expected);
    });

    // Invalid notation tests
    test.each([
      ['d20', false], // Missing count
      ['2d', false], // Missing sides
      ['abc', false], // Not dice notation
      ['99d999', false], // Exceeds count limit
      ['21d6', false], // Exceeds count limit
      ['1d101', false], // Exceeds sides limit
      ['', false], // Empty string
      [null, false], // Null
      [undefined, false], // Undefined
      ['2d6 + 3', false] // Spaces in notation
    ])('should reject "%s"', (notation) => {
      expect(roller.validateNotation(notation)).toBe(false);
    });

    test('should handle whitespace by trimming (tested in roll method)', () => {
      // Validation happens after trim in roll(), so raw validation rejects spaces
      expect(roller.validateNotation('  2d6+3  ')).toBe(false);
    });
  });

  // ========================================================================
  // Basic Dice Rolling
  // ========================================================================

  describe('roll() - Basic Functionality', () => {
    test('should roll 1d20 and return result between 1-20', async () => {
      const roller = new DiceRoller();
      const result = await roller.roll('1d20');

      expect(result.success).toBe(true);
      expect(result.data.total).toBeGreaterThanOrEqual(1);
      expect(result.data.total).toBeLessThanOrEqual(20);
      expect(result.data.rolls).toHaveLength(1);
      expect(result.data.modifier).toBe(0);
      expect(result.data.notation).toBe('1d20');
      expect(result.data.breakdown).toContain('1d20');
      expect(result.error).toBeNull();
    });

    test('should roll 2d6+3 and return result between 5-15', async () => {
      const roller = new DiceRoller();
      const result = await roller.roll('2d6+3');

      expect(result.success).toBe(true);
      expect(result.data.total).toBeGreaterThanOrEqual(5); // 2×1+3
      expect(result.data.total).toBeLessThanOrEqual(15); // 2×6+3
      expect(result.data.rolls).toHaveLength(2);
      expect(result.data.modifier).toBe(3);
      expect(result.data.breakdown).toContain('2d6');
      expect(result.data.breakdown).toContain('+ 3');
    });

    test('should roll 3d8-2 and return result between 1-22', async () => {
      const roller = new DiceRoller();
      const result = await roller.roll('3d8-2');

      expect(result.success).toBe(true);
      expect(result.data.total).toBeGreaterThanOrEqual(1); // 3×1-2
      expect(result.data.total).toBeLessThanOrEqual(22); // 3×8-2
      expect(result.data.rolls).toHaveLength(3);
      expect(result.data.modifier).toBe(-2);
      expect(result.data.breakdown).toContain('3d8');
      expect(result.data.breakdown).toContain('- 2');
    });

    test('should handle negative results (1d4-10)', async () => {
      const roller = new DiceRoller();
      const result = await roller.roll('1d4-10');

      expect(result.success).toBe(true);
      expect(result.data.total).toBeGreaterThanOrEqual(-9); // 1-10
      expect(result.data.total).toBeLessThanOrEqual(-6); // 4-10
      expect(result.data.modifier).toBe(-10);
    });

    test('should handle zero modifier (omit from breakdown)', async () => {
      const mockRandomInt = jest.fn().mockReturnValue(5);
      const roller = new DiceRoller({ randomInt: mockRandomInt });
      const result = await roller.roll('2d6');

      expect(result.success).toBe(true);
      expect(result.data.modifier).toBe(0);
      expect(result.data.breakdown).toBe('2d6(5+5) = 10');
      // The + appears in rolls (5+5) but not as modifier (no "+ 0")
      expect(result.data.breakdown).not.toContain('+ 0');
      expect(result.data.breakdown).not.toContain('- 0');
    });

    test('should handle whitespace in notation', async () => {
      const roller = new DiceRoller();
      const result = await roller.roll('  2d6+3  ');

      expect(result.success).toBe(true);
      expect(result.data.notation).toBe('2d6+3'); // Trimmed
    });

    test('should handle case insensitivity', async () => {
      const roller = new DiceRoller();
      const result = await roller.roll('2D6+3');

      expect(result.success).toBe(true);
      expect(result.data.notation).toBe('2D6+3');
    });
  });

  // ========================================================================
  // Advantage Mechanic
  // ========================================================================

  describe('roll() - Advantage', () => {
    test('should roll 1d20 with advantage and take higher result', async () => {
      const mockRandomInt = jest.fn()
        .mockReturnValueOnce(8) // First roll
        .mockReturnValueOnce(14); // Second roll

      const roller = new DiceRoller({ randomInt: mockRandomInt });
      const result = await roller.roll('1d20', { advantage: true });

      expect(result.success).toBe(true);
      expect(result.data.total).toBe(14); // Higher of 8, 14
      expect(result.data.rolls).toEqual([14]);
      expect(result.data.discarded).toEqual([8]);
      expect(result.data.advantage).toBe(true);
      expect(result.data.breakdown).toContain('[ADVANTAGE]');
      expect(result.data.breakdown).toContain('14, 8 discarded');
    });

    test('should error when advantage used on non-d20', async () => {
      const roller = new DiceRoller();
      const result = await roller.roll('2d6', { advantage: true });

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('Advantage/disadvantage only applies to 1d20 rolls');
    });

    test('should error when advantage used on multiple d20s', async () => {
      const roller = new DiceRoller();
      const result = await roller.roll('2d20', { advantage: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Advantage/disadvantage only applies to 1d20 rolls');
    });
  });

  // ========================================================================
  // Disadvantage Mechanic
  // ========================================================================

  describe('roll() - Disadvantage', () => {
    test('should roll 1d20 with disadvantage and take lower result', async () => {
      const mockRandomInt = jest.fn()
        .mockReturnValueOnce(14) // First roll
        .mockReturnValueOnce(8); // Second roll

      const roller = new DiceRoller({ randomInt: mockRandomInt });
      const result = await roller.roll('1d20', { disadvantage: true });

      expect(result.success).toBe(true);
      expect(result.data.total).toBe(8); // Lower of 14, 8
      expect(result.data.rolls).toEqual([8]);
      expect(result.data.discarded).toEqual([14]);
      expect(result.data.disadvantage).toBe(true);
      expect(result.data.breakdown).toContain('[DISADVANTAGE]');
      expect(result.data.breakdown).toContain('8, 14 discarded');
    });

    test('should error when disadvantage used on non-d20', async () => {
      const roller = new DiceRoller();
      const result = await roller.roll('2d6', { disadvantage: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Advantage/disadvantage only applies to 1d20 rolls');
    });
  });

  // ========================================================================
  // Advantage + Disadvantage (Cancel Out)
  // ========================================================================

  describe('roll() - Advantage + Disadvantage', () => {
    test('should cancel out and perform normal roll', async () => {
      const mockRandomInt = jest.fn().mockReturnValue(12);
      const roller = new DiceRoller({ randomInt: mockRandomInt });
      const result = await roller.roll('1d20', { advantage: true, disadvantage: true });

      expect(result.success).toBe(true);
      expect(result.data.total).toBe(12);
      expect(result.data.rolls).toEqual([12]);
      expect(result.data.discarded).toBeUndefined();
      expect(result.data.advantage).toBeUndefined();
      expect(result.data.disadvantage).toBeUndefined();
      expect(result.data.breakdown).not.toContain('[ADVANTAGE]');
      expect(result.data.breakdown).not.toContain('[DISADVANTAGE]');
    });
  });

  // ========================================================================
  // Result Object Format
  // ========================================================================

  describe('roll() - Result Object Format', () => {
    test('success case should return {success: true, data, error: null}', async () => {
      const roller = new DiceRoller();
      const result = await roller.roll('2d6+3');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.error).toBeNull();
    });

    test('error case should return {success: false, data: null, error: message}', async () => {
      const roller = new DiceRoller();
      const result = await roller.roll('invalid');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(typeof result.error).toBe('string');
    });

    test('should never throw exceptions', async () => {
      const roller = new DiceRoller();

      await expect(roller.roll(null)).resolves.toMatchObject({
        success: false,
        data: null
      });

      await expect(roller.roll(undefined)).resolves.toMatchObject({
        success: false,
        data: null
      });

      await expect(roller.roll('')).resolves.toMatchObject({
        success: false,
        data: null
      });
    });
  });

  // ========================================================================
  // Edge Cases and Error Handling
  // ========================================================================

  describe('roll() - Edge Cases', () => {
    test('should reject empty notation', async () => {
      const roller = new DiceRoller();
      const result = await roller.roll('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid dice notation');
    });

    test('should reject null notation', async () => {
      const roller = new DiceRoller();
      const result = await roller.roll(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid dice notation');
    });

    test('should reject non-string notation', async () => {
      const roller = new DiceRoller();
      const result = await roller.roll(123);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid dice notation');
    });

    test('should reject notation exceeding limits', async () => {
      const roller = new DiceRoller();

      // Exceeds dice count
      let result = await roller.roll('99d6');
      expect(result.success).toBe(false);

      // Exceeds sides
      result = await roller.roll('1d999');
      expect(result.success).toBe(false);
    });
  });

  // ========================================================================
  // Randomness Distribution Test
  // ========================================================================

  describe('roll() - Randomness Distribution', () => {
    test('should produce uniform distribution over 1000 rolls of 1d20', async () => {
      const roller = new DiceRoller(); // Use real crypto.randomInt
      const rolls = [];
      const counts = Array(21).fill(0); // Index 0 unused, 1-20 for results

      // Roll 1000 times
      for (let i = 0; i < 1000; i++) {
        const result = await roller.roll('1d20');
        rolls.push(result.data.total);
        counts[result.data.total]++;
      }

      // Each number 1-20 should appear ~50 times (±25 for statistical variance)
      for (let num = 1; num <= 20; num++) {
        expect(counts[num]).toBeGreaterThan(25); // At least 25
        expect(counts[num]).toBeLessThan(75); // At most 75
      }

      // Verify all rolls are within range
      expect(Math.min(...rolls)).toBeGreaterThanOrEqual(1);
      expect(Math.max(...rolls)).toBeLessThanOrEqual(20);
    }, 15000); // 15 second timeout for 1000 rolls
  });

  // ========================================================================
  // Performance Benchmark
  // ========================================================================

  describe('roll() - Performance', () => {
    test('should complete 100 rolls in <1000ms (<10ms avg)', async () => {
      const roller = new DiceRoller();
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        await roller.roll('2d6+3');
      }

      const end = performance.now();
      const totalTime = end - start;
      const avgTime = totalTime / 100;

      expect(totalTime).toBeLessThan(1000); // Total < 1 second
      expect(avgTime).toBeLessThan(10); // Average < 10ms per roll
    });
  });

  // ========================================================================
  // Breakdown String Generation
  // ========================================================================

  describe('_generateBreakdown()', () => {
    test('should format basic roll correctly', async () => {
      const mockRandomInt = jest.fn()
        .mockReturnValueOnce(4)
        .mockReturnValueOnce(6);

      const roller = new DiceRoller({ randomInt: mockRandomInt });
      const result = await roller.roll('2d6+3');

      expect(result.data.breakdown).toBe('2d6(4+6) + 3 = 13');
    });

    test('should format negative modifier correctly', async () => {
      const mockRandomInt = jest.fn()
        .mockReturnValueOnce(5)
        .mockReturnValueOnce(3);

      const roller = new DiceRoller({ randomInt: mockRandomInt });
      const result = await roller.roll('2d6-2');

      expect(result.data.breakdown).toBe('2d6(5+3) - 2 = 6');
    });

    test('should omit modifier when zero', async () => {
      const mockRandomInt = jest.fn().mockReturnValue(5);
      const roller = new DiceRoller({ randomInt: mockRandomInt });
      const result = await roller.roll('2d6');

      expect(result.data.breakdown).toBe('2d6(5+5) = 10');
    });

    test('should format advantage correctly', async () => {
      const mockRandomInt = jest.fn()
        .mockReturnValueOnce(8)
        .mockReturnValueOnce(14);

      const roller = new DiceRoller({ randomInt: mockRandomInt });
      const result = await roller.roll('1d20', { advantage: true });

      expect(result.data.breakdown).toBe('1d20(14, 8 discarded) = 14 [ADVANTAGE]');
    });

    test('should format disadvantage correctly', async () => {
      const mockRandomInt = jest.fn()
        .mockReturnValueOnce(14)
        .mockReturnValueOnce(8);

      const roller = new DiceRoller({ randomInt: mockRandomInt });
      const result = await roller.roll('1d20', { disadvantage: true });

      expect(result.data.breakdown).toBe('1d20(8, 14 discarded) = 8 [DISADVANTAGE]');
    });
  });
});
