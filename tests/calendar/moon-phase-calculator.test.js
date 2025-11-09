/**
 * Tests for MoonPhaseCalculator
 *
 * Coverage:
 * - AC-1: Module creation and dependency injection
 * - AC-2: Deterministic moon phase calculation
 * - AC-3: Full moon detection
 * - AC-8: Performance < 50ms
 */

const { MoonPhaseCalculator, MoonPhase } = require('../../src/calendar/moon-phase-calculator');

describe('MoonPhaseCalculator', () => {
  describe('AC-1: Constructor and Dependency Injection', () => {
    test('should create instance with default dependencies', () => {
      const calculator = new MoonPhaseCalculator();
      expect(calculator).toBeInstanceOf(MoonPhaseCalculator);
      expect(calculator.dateFns).toBeDefined();
    });

    test('should accept injected dependencies for testing', () => {
      const mockDateFns = {
        differenceInDays: jest.fn(),
        addDays: jest.fn(),
        parse: jest.fn(),
        format: jest.fn()
      };

      const calculator = new MoonPhaseCalculator({ dateFns: mockDateFns });
      expect(calculator.dateFns).toBe(mockDateFns);
    });
  });

  describe('AC-2: Deterministic Moon Phase Calculation', () => {
    let calculator;

    beforeEach(() => {
      calculator = new MoonPhaseCalculator();
    });

    test('should calculate new moon on reference date (2000-01-06)', () => {
      const result = calculator.calculate('2000-01-06');

      expect(result.success).toBe(true);
      expect(result.data.currentPhase).toBe(MoonPhase.NEW_MOON);
      expect(result.data.isWerewolfNight).toBe(false);
      expect(result.data.daysSinceNewMoon).toBe(0);
      expect(result.error).toBeNull();
    });

    test('should calculate full moon 14 days after new moon', () => {
      const result = calculator.calculate('2000-01-20');

      expect(result.success).toBe(true);
      expect(result.data.currentPhase).toBe(MoonPhase.FULL_MOON);
      expect(result.data.isWerewolfNight).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should calculate all 8 moon phases in 28-day cycle', () => {
      // 28-day cycle, 3.5 days per phase
      // Phase 0 (NEW_MOON): days 0-3 (2000-01-06 to 2000-01-09)
      // Phase 1 (WAXING_CRESCENT): days 3.5-7 (2000-01-10 to 2000-01-13)
      // Phase 2 (FIRST_QUARTER): days 7-10.5 (2000-01-13 to 2000-01-16)
      // Phase 3 (WAXING_GIBBOUS): days 10.5-14 (2000-01-17 to 2000-01-20)
      // Phase 4 (FULL_MOON): days 14-17.5 (2000-01-20 to 2000-01-23)
      // Phase 5 (WANING_GIBBOUS): days 17.5-21 (2000-01-24 to 2000-01-27)
      // Phase 6 (LAST_QUARTER): days 21-24.5 (2000-01-27 to 2000-01-30)
      // Phase 7 (WANING_CRESCENT): days 24.5-28 (2000-01-31 to 2000-02-03)
      const phases = [
        { date: '2000-01-06', expected: MoonPhase.NEW_MOON },
        { date: '2000-01-10', expected: MoonPhase.WAXING_CRESCENT },
        { date: '2000-01-13', expected: MoonPhase.FIRST_QUARTER },
        { date: '2000-01-17', expected: MoonPhase.WAXING_GIBBOUS },
        { date: '2000-01-20', expected: MoonPhase.FULL_MOON },
        { date: '2000-01-24', expected: MoonPhase.WANING_GIBBOUS },
        { date: '2000-01-27', expected: MoonPhase.LAST_QUARTER },
        { date: '2000-01-31', expected: MoonPhase.WANING_CRESCENT }
      ];

      phases.forEach(({ date, expected }) => {
        const result = calculator.calculate(date);
        expect(result.success).toBe(true);
        expect(result.data.currentPhase).toBe(expected);
      });
    });

    test('should return same phase for same date (deterministic)', () => {
      const date = '2024-03-15';
      const results = [];

      for (let i = 0; i < 10; i++) {
        results.push(calculator.calculate(date));
      }

      // All results should be identical
      const firstPhase = results[0].data.currentPhase;
      results.forEach(result => {
        expect(result.data.currentPhase).toBe(firstPhase);
        expect(result.data.nextFullMoon).toBe(results[0].data.nextFullMoon);
        expect(result.data.nextNewMoon).toBe(results[0].data.nextNewMoon);
      });
    });

    test('should cycle back to new moon after 28 days', () => {
      const startResult = calculator.calculate('2000-01-06');
      const endResult = calculator.calculate('2000-02-03'); // 28 days later

      expect(startResult.data.currentPhase).toBe(MoonPhase.NEW_MOON);
      expect(endResult.data.currentPhase).toBe(MoonPhase.NEW_MOON);
    });

    test('should calculate next full moon date', () => {
      const result = calculator.calculate('2000-01-06');

      expect(result.success).toBe(true);
      expect(result.data.nextFullMoon).toBe('2000-01-20');
    });

    test('should calculate next new moon date', () => {
      const result = calculator.calculate('2000-01-20');

      expect(result.success).toBe(true);
      expect(result.data.nextNewMoon).toBe('2000-02-03');
    });

    test('should handle dates far in the future', () => {
      const result = calculator.calculate('2100-12-25');

      expect(result.success).toBe(true);
      expect(result.data.currentPhase).toBeDefined();
      expect(result.data.nextFullMoon).toBeDefined();
      expect(result.data.nextNewMoon).toBeDefined();
    });
  });

  describe('AC-3: Full Moon Detection', () => {
    let calculator;

    beforeEach(() => {
      calculator = new MoonPhaseCalculator();
    });

    test('should set werewolf flag on full moon', () => {
      const result = calculator.calculate('2000-01-20'); // Full moon

      expect(result.success).toBe(true);
      expect(result.data.currentPhase).toBe(MoonPhase.FULL_MOON);
      expect(result.data.isWerewolfNight).toBe(true);
    });

    test('should not set werewolf flag on non-full moon', () => {
      const result = calculator.calculate('2000-01-06'); // New moon

      expect(result.success).toBe(true);
      expect(result.data.isWerewolfNight).toBe(false);
    });

    test('should recalculate next full moon after reaching it', () => {
      const result1 = calculator.calculate('2000-01-20'); // Full moon
      const result2 = calculator.calculate('2000-02-17'); // Next full moon (28 days later)

      expect(result1.data.currentPhase).toBe(MoonPhase.FULL_MOON);
      expect(result2.data.currentPhase).toBe(MoonPhase.FULL_MOON);
      expect(result1.data.nextFullMoon).toBe('2000-02-17');
      expect(result2.data.nextFullMoon).toBe('2000-03-16'); // 28 days after second full moon
    });
  });

  describe('Error Handling', () => {
    let calculator;

    beforeEach(() => {
      calculator = new MoonPhaseCalculator();
    });

    test('should handle invalid date format', () => {
      const result = calculator.calculate('invalid-date');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('Invalid date format');
    });

    test('should handle null date', () => {
      const result = calculator.calculate(null);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });

    test('should handle undefined date', () => {
      const result = calculator.calculate(undefined);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('AC-8: Performance', () => {
    let calculator;

    beforeEach(() => {
      calculator = new MoonPhaseCalculator();
    });

    test('should complete 100 calculations in < 50ms total', () => {
      const dates = [];
      for (let i = 0; i < 100; i++) {
        dates.push(`2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`);
      }

      const startTime = performance.now();

      dates.forEach(date => {
        calculator.calculate(date);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // 100 calculations in < 50ms
    });

    test('single calculation should complete in < 5ms', () => {
      const startTime = performance.now();

      calculator.calculate('2024-03-15');

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5);
    });
  });

  describe('Display Name Formatting', () => {
    let calculator;

    beforeEach(() => {
      calculator = new MoonPhaseCalculator();
    });

    test('should return human-readable phase names', () => {
      expect(calculator.getPhaseDisplayName(MoonPhase.NEW_MOON)).toBe('New Moon');
      expect(calculator.getPhaseDisplayName(MoonPhase.WAXING_CRESCENT)).toBe('Waxing Crescent');
      expect(calculator.getPhaseDisplayName(MoonPhase.FIRST_QUARTER)).toBe('First Quarter');
      expect(calculator.getPhaseDisplayName(MoonPhase.WAXING_GIBBOUS)).toBe('Waxing Gibbous');
      expect(calculator.getPhaseDisplayName(MoonPhase.FULL_MOON)).toBe('Full Moon');
      expect(calculator.getPhaseDisplayName(MoonPhase.WANING_GIBBOUS)).toBe('Waning Gibbous');
      expect(calculator.getPhaseDisplayName(MoonPhase.LAST_QUARTER)).toBe('Last Quarter');
      expect(calculator.getPhaseDisplayName(MoonPhase.WANING_CRESCENT)).toBe('Waning Crescent');
    });
  });
});
