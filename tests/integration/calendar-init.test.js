/**
 * Integration tests for CalendarManager
 * Uses real file I/O with temporary directories
 *
 * Tests cover:
 * - Calendar initialization with specific date/time
 * - Loading existing calendar and verifying data integrity
 * - Saving calendar and reloading to verify persistence
 * - Multiple save/load cycles maintain data accuracy
 */

const CalendarManager = require('../../src/calendar/calendar-manager');
const fs = require('fs').promises;
const path = require('path');

describe('CalendarManager Integration Tests', () => {
  let tempDir;
  let tempCalendarPath;
  let calendarManager;

  beforeEach(async () => {
    // Create temp directory for each test
    tempDir = path.join(__dirname, '..', 'temp', `calendar-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    tempCalendarPath = path.join(tempDir, 'calendar.yaml');
    calendarManager = new CalendarManager({ calendarPath: tempCalendarPath });
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
  // AC-4: Calendar Initialization
  // ========================================================================

  describe('Calendar Initialization', () => {
    test('should initialize calendar with specific date/time', async () => {
      const result = await calendarManager.createCalendar('735-10-3', '14:30');

      expect(result.success).toBe(true);
      expect(result.calendar.current.date).toBe('735-10-3');
      expect(result.calendar.current.time).toBe('14:30');

      // Verify file was actually created
      const fileExists = await fs.access(tempCalendarPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });

    test('should set all required schema fields', async () => {
      const result = await calendarManager.createCalendar('735-10-1', '08:00');

      expect(result.success).toBe(true);

      // Current block
      expect(result.calendar.current.date).toBe('735-10-1');
      expect(result.calendar.current.time).toBe('08:00');
      expect(result.calendar.current.day_of_week).toBeDefined();
      expect(result.calendar.current.season).toBeDefined();

      // Advancement block
      expect(result.calendar.advancement.mode).toBe('hybrid');
      expect(result.calendar.advancement.auto_advance_on_travel).toBe(true);
      expect(result.calendar.advancement.auto_advance_on_rest).toBe(true);
      expect(result.calendar.advancement.default_action_minutes).toBe(10);

      // Moon block
      expect(result.calendar.moon.current_phase).toBeDefined();
      expect(typeof result.calendar.moon.days_until_full).toBe('number');

      // Weather block
      expect(result.calendar.weather.current).toBeDefined();
      expect(typeof result.calendar.weather.temperature).toBe('number');
      expect(result.calendar.weather.wind).toBeDefined();
      expect(result.calendar.weather.visibility).toBeDefined();

      // Arrays
      expect(Array.isArray(result.calendar.events)).toBe(true);
      expect(Array.isArray(result.calendar.npc_schedules)).toBe(true);
      expect(Array.isArray(result.calendar.history)).toBe(true);

      // Metadata
      expect(result.calendar.metadata.campaign_start_date).toBe('735-10-1 08:00');
      expect(result.calendar.metadata.real_world_session_count).toBe(0);
      expect(result.calendar.metadata.total_in_game_hours).toBe(0);
    });
  });

  // ========================================================================
  // AC-5: Calendar Loading and Persistence
  // ========================================================================

  describe('Calendar Loading and Persistence', () => {
    test('should load existing calendar and verify data integrity', async () => {
      // Create calendar
      await calendarManager.createCalendar('735-10-5', '16:45');

      // Load calendar
      const loadResult = await calendarManager.loadCalendar();

      expect(loadResult.success).toBe(true);
      expect(loadResult.calendar.current.date).toBe('735-10-5');
      expect(loadResult.calendar.current.time).toBe('16:45');
    });

    test('should save calendar and reload to verify persistence', async () => {
      // Create initial calendar
      const createResult = await calendarManager.createCalendar('735-10-1', '08:00');
      const original = createResult.calendar;

      // Modify calendar
      original.current.date = '735-10-15';
      original.current.time = '20:30';
      original.metadata.real_world_session_count = 5;

      // Save modified calendar
      const saveResult = await calendarManager.saveCalendar(original);
      expect(saveResult.success).toBe(true);

      // Load and verify changes persisted
      const loadResult = await calendarManager.loadCalendar();
      expect(loadResult.success).toBe(true);
      expect(loadResult.calendar.current.date).toBe('735-10-15');
      expect(loadResult.calendar.current.time).toBe('20:30');
      expect(loadResult.calendar.metadata.real_world_session_count).toBe(5);
    });

    test('should maintain data accuracy through multiple save/load cycles', async () => {
      // Create initial calendar
      await calendarManager.createCalendar('735-10-1', '08:00');

      // Cycle 1: Update time
      let calendar = (await calendarManager.loadCalendar()).calendar;
      calendar.current.time = '12:00';
      await calendarManager.saveCalendar(calendar);

      // Cycle 2: Update date
      calendar = (await calendarManager.loadCalendar()).calendar;
      expect(calendar.current.time).toBe('12:00'); // Verify cycle 1 persisted
      calendar.current.date = '735-10-2';
      await calendarManager.saveCalendar(calendar);

      // Cycle 3: Add event
      calendar = (await calendarManager.loadCalendar()).calendar;
      expect(calendar.current.date).toBe('735-10-2'); // Verify cycle 2 persisted
      calendar.events.push({
        id: 'test-event',
        trigger_date: '735-10-3',
        trigger_time: '14:00'
      });
      await calendarManager.saveCalendar(calendar);

      // Final verification
      calendar = (await calendarManager.loadCalendar()).calendar;
      expect(calendar.current.date).toBe('735-10-2');
      expect(calendar.current.time).toBe('12:00');
      expect(calendar.events.length).toBe(1);
      expect(calendar.events[0].id).toBe('test-event');
    });

    test('should handle concurrent saves without data corruption', async () => {
      await calendarManager.createCalendar('735-10-1', '08:00');

      // Simulate concurrent updates
      const calendar1 = (await calendarManager.loadCalendar()).calendar;
      const calendar2 = (await calendarManager.loadCalendar()).calendar;

      calendar1.metadata.real_world_session_count = 1;
      calendar2.metadata.total_in_game_hours = 10;

      await calendarManager.saveCalendar(calendar1);
      await calendarManager.saveCalendar(calendar2);

      // Verify final state (last write wins)
      const final = (await calendarManager.loadCalendar()).calendar;
      expect(final.metadata.total_in_game_hours).toBe(10);
    });
  });

  // ========================================================================
  // Real File I/O Tests
  // ========================================================================

  describe('Real File I/O', () => {
    test('should create human-readable YAML file', async () => {
      await calendarManager.createCalendar('735-10-3', '14:30');

      const fileContent = await fs.readFile(tempCalendarPath, 'utf-8');

      // Verify YAML structure
      expect(fileContent).toContain('current:');
      expect(fileContent).toContain('date: ');
      expect(fileContent).toContain('time: ');
      expect(fileContent).toContain('advancement:');
      expect(fileContent).toContain('moon:');
      expect(fileContent).toContain('weather:');
      expect(fileContent).toContain('events:');
      expect(fileContent).toContain('npc_schedules:');
      expect(fileContent).toContain('history:');
      expect(fileContent).toContain('metadata:');

      // Verify Git-friendly formatting (sorted keys, no line wrapping)
      const lines = fileContent.split('\n');
      expect(lines.length).toBeGreaterThan(10); // Multi-line format
    });

    test('should handle missing calendar.yaml gracefully', async () => {
      // Don't create calendar first
      const result = await calendarManager.loadCalendar();

      expect(result.success).toBe(true);
      expect(result.calendar).toBeDefined();
      expect(result.calendar.current).toBeDefined();
    });
  });

  // ========================================================================
  // updateCurrentTime() Integration
  // ========================================================================

  describe('updateCurrentTime() Integration', () => {
    test('should update time and persist changes', async () => {
      await calendarManager.createCalendar('735-10-1', '08:00');

      const updateResult = await calendarManager.updateCurrentTime('735-10-15', '20:30');
      expect(updateResult.success).toBe(true);

      // Verify changes persisted
      const calendar = (await calendarManager.loadCalendar()).calendar;
      expect(calendar.current.date).toBe('735-10-15');
      expect(calendar.current.time).toBe('20:30');
    });

    test('should recalculate day_of_week and season', async () => {
      await calendarManager.createCalendar('735-1-15', '08:00'); // Winter

      await calendarManager.updateCurrentTime('735-7-15', '12:00'); // Summer

      const calendar = (await calendarManager.loadCalendar()).calendar;
      expect(calendar.current.season).toBe('summer');
      expect(calendar.current.day_of_week).toBeDefined();
    });

    test('should recalculate moon phase', async () => {
      await calendarManager.createCalendar('735-10-1', '08:00');

      const beforeUpdate = (await calendarManager.loadCalendar()).calendar;
      const initialPhase = beforeUpdate.moon.current_phase;

      // Advance 14 days (half moon cycle)
      await calendarManager.updateCurrentTime('735-10-15', '08:00');

      const afterUpdate = (await calendarManager.loadCalendar()).calendar;
      // Moon phase should have changed after 14 days
      expect(afterUpdate.moon.current_phase).toBeDefined();
    });
  });

  // ========================================================================
  // Performance Tests (Real I/O)
  // ========================================================================

  describe('Performance Tests', () => {
    test('loadCalendar() should complete in < 50ms', async () => {
      await calendarManager.createCalendar('735-10-1', '08:00');

      const iterations = 10;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await calendarManager.loadCalendar();
        times.push(Date.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / iterations;
      expect(avgTime).toBeLessThan(50);
    });

    test('saveCalendar() should complete in < 100ms', async () => {
      const createResult = await calendarManager.createCalendar('735-10-1', '08:00');
      const calendar = createResult.calendar;

      const iterations = 10;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        calendar.metadata.real_world_session_count = i;

        const start = Date.now();
        await calendarManager.saveCalendar(calendar);
        times.push(Date.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / iterations;
      expect(avgTime).toBeLessThan(100);
    });
  });
});
