/**
 * Integration tests for TimeManager
 * Uses real CalendarManager and date-fns
 *
 * Tests cover:
 * - Integration with CalendarManager (load/save cycles)
 * - Time advancement across midnight
 * - Hybrid mode behavior
 * - metadata.total_in_game_hours increments
 * - Travel time calculation (placeholder for Story 2-4)
 * - Real date-fns operations (leap years, month lengths)
 */

const TimeManager = require('../../src/calendar/time-manager');
const { ACTION_TYPES } = require('../../src/calendar/time-manager');
const CalendarManager = require('../../src/calendar/calendar-manager');
const fs = require('fs').promises;
const path = require('path');

describe('TimeManager Integration Tests', () => {
  let tempDir;
  let tempCalendarPath;
  let calendarManager;
  let timeManager;

  beforeEach(async () => {
    // Create temp directory for each test
    tempDir = path.join(__dirname, '..', 'temp', `time-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    tempCalendarPath = path.join(tempDir, 'calendar.yaml');
    calendarManager = new CalendarManager({ calendarPath: tempCalendarPath });
    timeManager = new TimeManager(); // Use real date-fns
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  // ========================================================================
  // CalendarManager Integration
  // ========================================================================

  describe('CalendarManager Integration', () => {
    test('should load calendar, advance time, and verify state updated', async () => {
      // Create calendar
      await calendarManager.createCalendar('735-10-1', '08:00');

      // Load calendar
      const loadResult = await calendarManager.loadCalendar();
      expect(loadResult.success).toBe(true);

      // Advance time
      const advanceResult = timeManager.advanceTime(loadResult.calendar, 120, 'manual command');
      expect(advanceResult.success).toBe(true);
      expect(advanceResult.calendar.current.time).toBe('10:00');

      // Verify calendar object updated
      expect(advanceResult.calendar.current.date).toBe('0735-10-01');
      expect(advanceResult.calendar.metadata.total_in_game_hours).toBe(2);
    });

    test('should verify calendar not mutated', async () => {
      await calendarManager.createCalendar('735-10-1', '08:00');
      const loadResult = await calendarManager.loadCalendar();

      const originalCalendar = JSON.parse(JSON.stringify(loadResult.calendar));

      // Advance time
      timeManager.advanceTime(loadResult.calendar, 120, 'test');

      // Verify original calendar unchanged
      expect(loadResult.calendar).toEqual(originalCalendar);
    });

    test('should save and reload updated calendar', async () => {
      await calendarManager.createCalendar('735-10-1', '08:00');
      const loadResult = await calendarManager.loadCalendar();

      // Advance time
      const advanceResult = timeManager.advanceTime(loadResult.calendar, 120, 'manual command');

      // Save updated calendar
      const saveResult = await calendarManager.saveCalendar(advanceResult.calendar);
      expect(saveResult.success).toBe(true);

      // Reload and verify
      const reloadResult = await calendarManager.loadCalendar();
      expect(reloadResult.calendar.current.time).toBe('10:00');
      expect(reloadResult.calendar.metadata.total_in_game_hours).toBe(2);
    });
  });

  // ========================================================================
  // Time Advancement Across Boundaries
  // ========================================================================

  describe('Time Advancement Across Boundaries', () => {
    test('should advance time across midnight and verify date increments', async () => {
      await calendarManager.createCalendar('735-10-1', '23:00');
      const loadResult = await calendarManager.loadCalendar();

      // Advance 2 hours (crosses midnight)
      const advanceResult = timeManager.advanceTime(loadResult.calendar, 120, 'late night activity');

      expect(advanceResult.success).toBe(true);
      expect(advanceResult.calendar.current.date).toBe('0735-10-02');
      expect(advanceResult.calendar.current.time).toBe('01:00');
    });

    test('should advance across month end', async () => {
      await calendarManager.createCalendar('735-10-31', '12:00');
      const loadResult = await calendarManager.loadCalendar();

      // Advance 1 day (crosses month boundary)
      const advanceResult = timeManager.advanceTime(loadResult.calendar, 1440, 'travel');

      expect(advanceResult.success).toBe(true);
      expect(advanceResult.calendar.current.date).toBe('0735-11-01');
      expect(advanceResult.calendar.current.time).toBe('12:00');
      expect(advanceResult.calendar.current.season).toBe('autumn'); // Nov is autumn
    });

    test('should advance across year end', async () => {
      await calendarManager.createCalendar('735-12-31', '12:00');
      const loadResult = await calendarManager.loadCalendar();

      // Advance 1 day (crosses year boundary)
      const advanceResult = timeManager.advanceTime(loadResult.calendar, 1440, 'new year celebration');

      expect(advanceResult.success).toBe(true);
      expect(advanceResult.calendar.current.date).toBe('0736-01-01');
      expect(advanceResult.calendar.current.time).toBe('12:00');
      expect(advanceResult.calendar.current.season).toBe('winter'); // Jan is winter
    });

    test('should handle leap year (Feb 29)', async () => {
      // Create calendar at Feb 28 in leap year 2024
      await calendarManager.createCalendar('2024-02-28', '12:00');
      const loadResult = await calendarManager.loadCalendar();

      // Advance 1 day
      const advanceResult = timeManager.advanceTime(loadResult.calendar, 1440, 'leap year test');

      expect(advanceResult.success).toBe(true);
      expect(advanceResult.calendar.current.date).toBe('2024-02-29');
      expect(advanceResult.calendar.current.time).toBe('12:00');
    });
  });

  // ========================================================================
  // metadata.total_in_game_hours Increment
  // ========================================================================

  describe('metadata.total_in_game_hours Increment', () => {
    test('should increment total_in_game_hours correctly', async () => {
      await calendarManager.createCalendar('735-10-1', '08:00');
      const loadResult = await calendarManager.loadCalendar();

      expect(loadResult.calendar.metadata.total_in_game_hours).toBe(0);

      // Advance 2 hours
      const advance1 = timeManager.advanceTime(loadResult.calendar, 120, 'first advance');
      expect(advance1.calendar.metadata.total_in_game_hours).toBe(2);

      // Advance 3 hours from new state
      const advance2 = timeManager.advanceTime(advance1.calendar, 180, 'second advance');
      expect(advance2.calendar.metadata.total_in_game_hours).toBe(5);

      // Advance 8 hours (long rest)
      const advance3 = timeManager.advanceTime(advance2.calendar, 480, 'long rest');
      expect(advance3.calendar.metadata.total_in_game_hours).toBe(13);
    });

    test('should handle fractional hours (30 minutes)', async () => {
      await calendarManager.createCalendar('735-10-1', '08:00');
      const loadResult = await calendarManager.loadCalendar();

      // Advance 30 minutes
      const advanceResult = timeManager.advanceTime(loadResult.calendar, 30, 'short activity');

      expect(advanceResult.calendar.metadata.total_in_game_hours).toBe(0.5);
    });
  });

  // ========================================================================
  // Hybrid Mode Behavior
  // ========================================================================

  describe('Hybrid Mode Behavior', () => {
    test('should use hybrid mode configuration from calendar', async () => {
      await calendarManager.createCalendar('735-10-1', '08:00');
      const loadResult = await calendarManager.loadCalendar();

      // Verify default hybrid mode
      expect(loadResult.calendar.advancement.mode).toBe('hybrid');
      expect(loadResult.calendar.advancement.auto_advance_on_travel).toBe(true);
      expect(loadResult.calendar.advancement.auto_advance_on_rest).toBe(true);
      expect(loadResult.calendar.advancement.default_action_minutes).toBe(10);
    });

    test('should get action durations using calendar context', async () => {
      await calendarManager.createCalendar('735-10-1', '08:00');
      const loadResult = await calendarManager.loadCalendar();

      const context = { calendar: loadResult.calendar };

      // Test short rest (should be 60 min regardless of default)
      const shortRest = timeManager.getActionDuration(ACTION_TYPES.SHORT_REST, context);
      expect(shortRest.minutes).toBe(60);

      // Test search (should be default × 3 = 30 min)
      const search = timeManager.getActionDuration(ACTION_TYPES.SEARCH, context);
      expect(search.minutes).toBe(30);

      // Test dialogue (should be default × 1 = 10 min)
      const dialogue = timeManager.getActionDuration(ACTION_TYPES.DIALOGUE, context);
      expect(dialogue.minutes).toBe(10);
    });
  });

  // ========================================================================
  // Travel Time Calculation (Placeholder)
  // ========================================================================

  describe('Travel Time Calculation', () => {
    test('should use travelMinutes from context', async () => {
      const context = {
        travelMinutes: 240, // 4 hours to destination
        calendar: (await calendarManager.createCalendar('735-10-1', '08:00')).calendar
      };

      const result = timeManager.getActionDuration(ACTION_TYPES.TRAVEL, context);

      expect(result.success).toBe(true);
      expect(result.minutes).toBe(240);
    });

    test('should use placeholder for travel without travelMinutes (Story 2-4)', async () => {
      const loadResult = await calendarManager.createCalendar('735-10-1', '08:00');
      const context = { calendar: loadResult.calendar };

      const result = timeManager.getActionDuration(ACTION_TYPES.TRAVEL, context);

      expect(result.success).toBe(true);
      // Placeholder: default × 10
      expect(result.minutes).toBe(100);
    });
  });

  // ========================================================================
  // calculateElapsed() with Real Dates
  // ========================================================================

  describe('calculateElapsed() with Real Dates', () => {
    test('should calculate elapsed time same day', () => {
      const result = timeManager.calculateElapsed('2024-03-10', '14:30', '2024-03-10', '16:30');

      expect(result.success).toBe(true);
      expect(result.minutes).toBe(120);
    });

    test('should calculate elapsed time across midnight', () => {
      const result = timeManager.calculateElapsed('2024-03-10', '23:00', '2024-03-11', '01:00');

      expect(result.success).toBe(true);
      expect(result.minutes).toBe(120);
    });

    test('should calculate elapsed time across multiple days', () => {
      const result = timeManager.calculateElapsed('2024-03-10', '14:00', '2024-03-12', '14:00');

      expect(result.success).toBe(true);
      expect(result.minutes).toBe(2880); // 48 hours
    });

    test('should handle leap year correctly', () => {
      // Feb 28 to Feb 29 in leap year 2024
      const result = timeManager.calculateElapsed('2024-02-28', '12:00', '2024-02-29', '12:00');

      expect(result.success).toBe(true);
      expect(result.minutes).toBe(1440); // 24 hours
    });

    test('should return negative if end < start', () => {
      const result = timeManager.calculateElapsed('2024-03-10', '16:30', '2024-03-10', '14:30');

      expect(result.success).toBe(true);
      expect(result.minutes).toBe(-120);
    });
  });

  // ========================================================================
  // parseDuration() Integration
  // ========================================================================

  describe('parseDuration() Integration', () => {
    test('should parse and advance by parsed duration', async () => {
      await calendarManager.createCalendar('735-10-1', '08:00');
      const loadResult = await calendarManager.loadCalendar();

      // Parse "2 hours"
      const parseResult = timeManager.parseDuration('2 hours');
      expect(parseResult.success).toBe(true);

      // Advance by parsed duration
      const advanceResult = timeManager.advanceTime(loadResult.calendar, parseResult.minutes, 'parsed duration');

      expect(advanceResult.success).toBe(true);
      expect(advanceResult.calendar.current.time).toBe('10:00');
    });

    test('should parse complex duration and advance', async () => {
      await calendarManager.createCalendar('735-10-1', '08:00');
      const loadResult = await calendarManager.loadCalendar();

      // Parse "1 day 2 hours 30 minutes"
      const parseResult = timeManager.parseDuration('1 day 2 hours 30 minutes');
      expect(parseResult.success).toBe(true);
      expect(parseResult.minutes).toBe(1590); // 1440 + 120 + 30

      // Advance
      const advanceResult = timeManager.advanceTime(loadResult.calendar, parseResult.minutes, 'long journey');

      expect(advanceResult.success).toBe(true);
      expect(advanceResult.calendar.current.date).toBe('0735-10-02');
      expect(advanceResult.calendar.current.time).toBe('10:30');
    });
  });

  // ========================================================================
  // Performance Tests (Real I/O)
  // ========================================================================

  describe('Performance Tests', () => {
    test('advanceTime() should complete in < 50ms', async () => {
      await calendarManager.createCalendar('735-10-1', '08:00');
      const loadResult = await calendarManager.loadCalendar();

      const iterations = 10;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        timeManager.advanceTime(loadResult.calendar, 60, 'performance test');
        times.push(Date.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / iterations;
      expect(avgTime).toBeLessThan(50);
    });

    test('calculateElapsed() should complete in < 10ms', () => {
      const iterations = 100;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        timeManager.calculateElapsed('2024-03-10', '14:30', '2024-03-12', '16:30');
        times.push(Date.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / iterations;
      expect(avgTime).toBeLessThan(10);
    });

    test('parseDuration() should complete in < 5ms', () => {
      const iterations = 100;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        timeManager.parseDuration('2 hours 30 minutes');
        times.push(Date.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / iterations;
      expect(avgTime).toBeLessThan(5);
    });
  });
});
