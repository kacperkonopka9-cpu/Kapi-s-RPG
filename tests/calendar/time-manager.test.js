/**
 * Unit tests for TimeManager
 * Uses mocked date-fns for deterministic tests
 *
 * Tests cover:
 * - Constructor and dependency injection
 * - addMinutes() with date/time rollover
 * - advanceTime() with calendar updates
 * - calculateElapsed() across days, months
 * - parseDuration() with various formats
 * - getActionDuration() for all action types
 * - Date/time validation
 * - Error handling
 * - Performance tests
 */

const TimeManager = require('../../src/calendar/time-manager');
const { ACTION_TYPES } = require('../../src/calendar/time-manager');

describe('TimeManager', () => {
  let timeManager;
  let mockDateFns;

  beforeEach(() => {
    // Mock date-fns functions for deterministic tests
    mockDateFns = {
      add: jest.fn(),
      differenceInMinutes: jest.fn(),
      parse: jest.fn(),
      format: jest.fn(),
      isValid: jest.fn()
    };

    timeManager = new TimeManager({ dateFns: mockDateFns });
  });

  // ========================================================================
  // Constructor Tests
  // ========================================================================

  describe('Constructor', () => {
    test('should initialize with default date-fns', () => {
      const tm = new TimeManager();
      expect(tm.dateFns).toBeDefined();
      expect(tm.dateFns.add).toBeDefined();
      expect(tm.dateFns.differenceInMinutes).toBeDefined();
    });

    test('should accept dependency injection', () => {
      const tm = new TimeManager({ dateFns: mockDateFns });
      expect(tm.dateFns).toBe(mockDateFns);
    });
  });

  // ========================================================================
  // addMinutes() Tests
  // ========================================================================

  describe('addMinutes()', () => {
    test('should add minutes to same day', () => {
      const mockDate = new Date('2024-03-10T14:30:00');
      const mockNewDate = new Date('2024-03-10T16:30:00');

      mockDateFns.parse.mockReturnValue(mockDate);
      mockDateFns.isValid.mockReturnValue(true);
      mockDateFns.add.mockReturnValue(mockNewDate);
      mockDateFns.format.mockImplementation((date, formatStr) => {
        if (formatStr === 'yyyy-MM-dd') return '2024-03-10';
        if (formatStr === 'HH:mm') return '16:30';
      });

      const result = timeManager.addMinutes('2024-03-10', '14:30', 120);

      expect(result.success).toBe(true);
      expect(result.date).toBe('2024-03-10');
      expect(result.time).toBe('16:30');
      expect(mockDateFns.add).toHaveBeenCalledWith(mockDate, { minutes: 120 });
    });

    test('should handle midnight rollover', () => {
      const mockDate = new Date('2024-03-10T23:00:00');
      const mockNewDate = new Date('2024-03-11T01:00:00');

      mockDateFns.parse.mockReturnValue(mockDate);
      mockDateFns.isValid.mockReturnValue(true);
      mockDateFns.add.mockReturnValue(mockNewDate);
      mockDateFns.format.mockImplementation((date, formatStr) => {
        if (formatStr === 'yyyy-MM-dd') return '2024-03-11';
        if (formatStr === 'HH:mm') return '01:00';
      });

      const result = timeManager.addMinutes('2024-03-10', '23:00', 120);

      expect(result.success).toBe(true);
      expect(result.date).toBe('2024-03-11');
      expect(result.time).toBe('01:00');
    });

    test('should handle month-end rollover', () => {
      const mockDate = new Date('2024-03-31T12:00:00');
      const mockNewDate = new Date('2024-04-01T12:00:00');

      mockDateFns.parse.mockReturnValue(mockDate);
      mockDateFns.isValid.mockReturnValue(true);
      mockDateFns.add.mockReturnValue(mockNewDate);
      mockDateFns.format.mockImplementation((date, formatStr) => {
        if (formatStr === 'yyyy-MM-dd') return '2024-04-01';
        if (formatStr === 'HH:mm') return '12:00';
      });

      const result = timeManager.addMinutes('2024-03-31', '12:00', 1440);

      expect(result.success).toBe(true);
      expect(result.date).toBe('2024-04-01');
      expect(result.time).toBe('12:00');
    });

    test('should handle year-end rollover', () => {
      const mockDate = new Date('2024-12-31T12:00:00');
      const mockNewDate = new Date('2025-01-01T12:00:00');

      mockDateFns.parse.mockReturnValue(mockDate);
      mockDateFns.isValid.mockReturnValue(true);
      mockDateFns.add.mockReturnValue(mockNewDate);
      mockDateFns.format.mockImplementation((date, formatStr) => {
        if (formatStr === 'yyyy-MM-dd') return '2025-01-01';
        if (formatStr === 'HH:mm') return '12:00';
      });

      const result = timeManager.addMinutes('2024-12-31', '12:00', 1440);

      expect(result.success).toBe(true);
      expect(result.date).toBe('2025-01-01');
      expect(result.time).toBe('12:00');
    });

    test('should reject invalid date format', () => {
      const result = timeManager.addMinutes('invalid-date', '14:30', 120);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid date format');
    });

    test('should reject invalid time format', () => {
      const result = timeManager.addMinutes('2024-03-10', '25:00', 120);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid time format');
    });

    test('should reject invalid minutes', () => {
      const result = timeManager.addMinutes('2024-03-10', '14:30', 'invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid minutes');
    });
  });

  // ========================================================================
  // formatTimestamp() Tests
  // ========================================================================

  describe('formatTimestamp()', () => {
    test('should format date and time with space separator', () => {
      const result = timeManager.formatTimestamp('735-10-1', '14:30');
      expect(result).toBe('735-10-1 14:30');
    });

    test('should format with leading zeros', () => {
      const result = timeManager.formatTimestamp('735-10-01', '08:05');
      expect(result).toBe('735-10-01 08:05');
    });
  });

  // ========================================================================
  // advanceTime() Tests
  // ========================================================================

  describe('advanceTime()', () => {
    const mockCalendar = {
      current: {
        date: '735-10-1',
        time: '08:00',
        day_of_week: 'Moonday',
        season: 'autumn'
      },
      advancement: {
        mode: 'hybrid',
        auto_advance_on_travel: true,
        auto_advance_on_rest: true,
        default_action_minutes: 10
      },
      metadata: {
        total_in_game_hours: 0
      }
    };

    test('should advance time and update calendar', () => {
      const mockDate = new Date('735-10-01T08:00:00');
      const mockNewDate = new Date('735-10-01T10:00:00');

      mockDateFns.parse.mockReturnValue(mockDate);
      mockDateFns.isValid.mockReturnValue(true);
      mockDateFns.add.mockReturnValue(mockNewDate);
      mockDateFns.format.mockImplementation((date, formatStr) => {
        if (formatStr === 'yyyy-MM-dd') return '735-10-01';
        if (formatStr === 'HH:mm') return '10:00';
      });

      const result = timeManager.advanceTime(mockCalendar, 120, 'manual command');

      expect(result.success).toBe(true);
      expect(result.calendar.current.date).toBe('735-10-01');
      expect(result.calendar.current.time).toBe('10:00');
      expect(result.calendar.metadata.total_in_game_hours).toBe(2);
      expect(result.reason).toBe('manual command');
    });

    test('should not mutate input calendar', () => {
      const mockDate = new Date('735-10-01T08:00:00');
      const mockNewDate = new Date('735-10-01T10:00:00');

      mockDateFns.parse.mockReturnValue(mockDate);
      mockDateFns.isValid.mockReturnValue(true);
      mockDateFns.add.mockReturnValue(mockNewDate);
      mockDateFns.format.mockImplementation((date, formatStr) => {
        if (formatStr === 'yyyy-MM-dd') return '735-10-01';
        if (formatStr === 'HH:mm') return '10:00';
      });

      const originalCalendar = JSON.parse(JSON.stringify(mockCalendar));
      timeManager.advanceTime(mockCalendar, 120, 'test');

      expect(mockCalendar).toEqual(originalCalendar);
    });

    test('should update day_of_week when date changes', () => {
      const mockDate = new Date('735-10-01T08:00:00');
      const mockNewDate = new Date('735-10-02T08:00:00');

      mockDateFns.parse.mockReturnValue(mockDate);
      mockDateFns.isValid.mockReturnValue(true);
      mockDateFns.add.mockReturnValue(mockNewDate);
      mockDateFns.format.mockImplementation((date, formatStr) => {
        if (formatStr === 'yyyy-MM-dd') return '735-10-02';
        if (formatStr === 'HH:mm') return '08:00';
      });

      const result = timeManager.advanceTime(mockCalendar, 1440, 'travel');

      expect(result.success).toBe(true);
      expect(result.calendar.current.day_of_week).toBeDefined();
    });

    test('should update season when month changes', () => {
      // Use smaller duration that doesn't exceed max (10080 min = 1 week)
      const mockDate = new Date('735-09-24T08:00:00');
      const mockNewDate = new Date('735-10-01T08:00:00');

      mockDateFns.parse.mockReturnValue(mockDate);
      mockDateFns.isValid.mockReturnValue(true);
      mockDateFns.add.mockReturnValue(mockNewDate);
      mockDateFns.format.mockImplementation((date, formatStr) => {
        if (formatStr === 'yyyy-MM-dd') return '735-10-01';
        if (formatStr === 'HH:mm') return '08:00';
      });

      const result = timeManager.advanceTime(mockCalendar, 10080, 'long journey'); // 7 days

      expect(result.success).toBe(true);
      expect(result.calendar.current.season).toBe('autumn'); // Oct is autumn
    });

    test('should reject invalid calendar', () => {
      const result = timeManager.advanceTime(null, 120, 'test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid calendar object');
    });

    test('should reject non-positive minutes', () => {
      const result = timeManager.advanceTime(mockCalendar, 0, 'test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('positive number');
    });

    test('should reject minutes > 1 week', () => {
      const result = timeManager.advanceTime(mockCalendar, 10081, 'test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });
  });

  // ========================================================================
  // calculateElapsed() Tests
  // ========================================================================

  describe('calculateElapsed()', () => {
    test('should calculate same day elapsed time', () => {
      const startDate = new Date('2024-03-10T14:30:00');
      const endDate = new Date('2024-03-10T16:30:00');

      mockDateFns.parse.mockImplementation((str) => {
        if (str.includes('14:30')) return startDate;
        if (str.includes('16:30')) return endDate;
      });
      mockDateFns.isValid.mockReturnValue(true);
      mockDateFns.differenceInMinutes.mockReturnValue(120);

      const result = timeManager.calculateElapsed('2024-03-10', '14:30', '2024-03-10', '16:30');

      expect(result.success).toBe(true);
      expect(result.minutes).toBe(120);
    });

    test('should calculate across midnight', () => {
      const startDate = new Date('2024-03-10T23:00:00');
      const endDate = new Date('2024-03-11T01:00:00');

      mockDateFns.parse.mockImplementation((str) => {
        if (str.includes('2024-03-10')) return startDate;
        if (str.includes('2024-03-11')) return endDate;
      });
      mockDateFns.isValid.mockReturnValue(true);
      mockDateFns.differenceInMinutes.mockReturnValue(120);

      const result = timeManager.calculateElapsed('2024-03-10', '23:00', '2024-03-11', '01:00');

      expect(result.success).toBe(true);
      expect(result.minutes).toBe(120);
    });

    test('should calculate across multiple days', () => {
      const startDate = new Date('2024-03-10T14:00:00');
      const endDate = new Date('2024-03-12T14:00:00');

      mockDateFns.parse.mockImplementation((str) => {
        if (str.includes('2024-03-10')) return startDate;
        if (str.includes('2024-03-12')) return endDate;
      });
      mockDateFns.isValid.mockReturnValue(true);
      mockDateFns.differenceInMinutes.mockReturnValue(2880);

      const result = timeManager.calculateElapsed('2024-03-10', '14:00', '2024-03-12', '14:00');

      expect(result.success).toBe(true);
      expect(result.minutes).toBe(2880); // 48 hours
    });

    test('should return negative if end < start', () => {
      const startDate = new Date('2024-03-10T16:30:00');
      const endDate = new Date('2024-03-10T14:30:00');

      mockDateFns.parse.mockImplementation((str) => {
        if (str.includes('16:30')) return startDate;
        if (str.includes('14:30')) return endDate;
      });
      mockDateFns.isValid.mockReturnValue(true);
      mockDateFns.differenceInMinutes.mockReturnValue(-120);

      const result = timeManager.calculateElapsed('2024-03-10', '16:30', '2024-03-10', '14:30');

      expect(result.success).toBe(true);
      expect(result.minutes).toBe(-120);
    });

    test('should reject invalid start date', () => {
      const result = timeManager.calculateElapsed('invalid', '14:30', '2024-03-10', '16:30');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid start date format');
    });

    test('should reject invalid end time', () => {
      const result = timeManager.calculateElapsed('2024-03-10', '14:30', '2024-03-10', '25:00');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid end time format');
    });
  });

  // ========================================================================
  // parseDuration() Tests
  // ========================================================================

  describe('parseDuration()', () => {
    test('should parse "2 hours"', () => {
      const result = timeManager.parseDuration('2 hours');
      expect(result.success).toBe(true);
      expect(result.minutes).toBe(120);
    });

    test('should parse "30 minutes"', () => {
      const result = timeManager.parseDuration('30 minutes');
      expect(result.success).toBe(true);
      expect(result.minutes).toBe(30);
    });

    test('should parse "1 day"', () => {
      const result = timeManager.parseDuration('1 day');
      expect(result.success).toBe(true);
      expect(result.minutes).toBe(1440);
    });

    test('should parse "2 days"', () => {
      const result = timeManager.parseDuration('2 days');
      expect(result.success).toBe(true);
      expect(result.minutes).toBe(2880);
    });

    test('should parse "1 hour 30 minutes"', () => {
      const result = timeManager.parseDuration('1 hour 30 minutes');
      expect(result.success).toBe(true);
      expect(result.minutes).toBe(90);
    });

    test('should parse "8 hours" (long rest)', () => {
      const result = timeManager.parseDuration('8 hours');
      expect(result.success).toBe(true);
      expect(result.minutes).toBe(480);
    });

    test('should handle singular "minute"', () => {
      const result = timeManager.parseDuration('1 minute');
      expect(result.success).toBe(true);
      expect(result.minutes).toBe(1);
    });

    test('should handle "min" abbreviation', () => {
      const result = timeManager.parseDuration('45 min');
      expect(result.success).toBe(true);
      expect(result.minutes).toBe(45);
    });

    test('should reject invalid format', () => {
      const result = timeManager.parseDuration('invalid duration');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid duration format');
    });

    test('should reject empty string', () => {
      const result = timeManager.parseDuration('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty string');
    });

    test('should reject durations > 1 week', () => {
      const result = timeManager.parseDuration('8 days');
      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });
  });

  // ========================================================================
  // getActionDuration() Tests
  // ========================================================================

  describe('getActionDuration()', () => {
    const mockContext = {
      calendar: {
        advancement: {
          default_action_minutes: 10
        }
      }
    };

    test('should return travel duration from context.travelMinutes', () => {
      const context = { ...mockContext, travelMinutes: 240 };
      const result = timeManager.getActionDuration(ACTION_TYPES.TRAVEL, context);

      expect(result.success).toBe(true);
      expect(result.minutes).toBe(240);
    });

    test('should return search duration (default × 3)', () => {
      const result = timeManager.getActionDuration(ACTION_TYPES.SEARCH, mockContext);

      expect(result.success).toBe(true);
      expect(result.minutes).toBe(30); // 10 × 3
    });

    test('should return dialogue duration (default × 1)', () => {
      const result = timeManager.getActionDuration(ACTION_TYPES.DIALOGUE, mockContext);

      expect(result.success).toBe(true);
      expect(result.minutes).toBe(10);
    });

    test('should return short rest duration (60 min)', () => {
      const result = timeManager.getActionDuration(ACTION_TYPES.SHORT_REST, mockContext);

      expect(result.success).toBe(true);
      expect(result.minutes).toBe(60);
    });

    test('should return long rest duration (480 min)', () => {
      const result = timeManager.getActionDuration(ACTION_TYPES.LONG_REST, mockContext);

      expect(result.success).toBe(true);
      expect(result.minutes).toBe(480);
    });

    test('should return 0 for combat (Epic 3)', () => {
      const result = timeManager.getActionDuration(ACTION_TYPES.COMBAT, mockContext);

      expect(result.success).toBe(true);
      expect(result.minutes).toBe(0);
    });

    test('should return default for unknown action type', () => {
      const result = timeManager.getActionDuration('unknown_action', mockContext);

      expect(result.success).toBe(true);
      expect(result.minutes).toBe(10);
    });

    test('should use default 10 if no calendar context', () => {
      const result = timeManager.getActionDuration(ACTION_TYPES.DIALOGUE, {});

      expect(result.success).toBe(true);
      expect(result.minutes).toBe(10);
    });

    test('should reject invalid action type', () => {
      const result = timeManager.getActionDuration(null, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid action type');
    });
  });

  // ========================================================================
  // Performance Tests
  // ========================================================================

  describe('Performance Tests', () => {
    test('addMinutes() should complete in < 50ms', () => {
      const mockDate = new Date('2024-03-10T14:30:00');
      const mockNewDate = new Date('2024-03-10T16:30:00');

      mockDateFns.parse.mockReturnValue(mockDate);
      mockDateFns.isValid.mockReturnValue(true);
      mockDateFns.add.mockReturnValue(mockNewDate);
      mockDateFns.format.mockImplementation((date, formatStr) => {
        if (formatStr === 'yyyy-MM-dd') return '2024-03-10';
        if (formatStr === 'HH:mm') return '16:30';
      });

      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        timeManager.addMinutes('2024-03-10', '14:30', 120);
      }
      const elapsed = (Date.now() - startTime) / 10;

      expect(elapsed).toBeLessThan(50);
    });

    test('parseDuration() should complete in < 5ms', () => {
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        timeManager.parseDuration('2 hours');
      }
      const elapsed = (Date.now() - startTime) / 100;

      expect(elapsed).toBeLessThan(5);
    });
  });
});
