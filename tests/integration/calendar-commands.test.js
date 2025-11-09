/**
 * Integration tests for CalendarCommands
 * Tests with real CalendarManager and CommandRouter
 * AC-7: Performance requirement (< 100ms)
 */

const { registerCalendarCommands, displayCalendar } = require('../../src/commands/calendar-commands');
const CalendarManager = require('../../src/calendar/calendar-manager');
const { CommandRouter } = require('../../src/commands/router');
const fs = require('fs').promises;
const path = require('path');

describe('CalendarCommands Integration Tests', () => {
  let tempDir;
  let tempCalendarPath;
  let calendarManager;
  let commandRouter;

  beforeEach(async () => {
    // Create temp directory for each test
    tempDir = path.join(__dirname, '..', 'temp', `calendar-cmd-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    tempCalendarPath = path.join(tempDir, 'calendar.yaml');
    calendarManager = new CalendarManager({ calendarPath: tempCalendarPath });
    commandRouter = new CommandRouter();
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
  // Integration Test: Full /calendar Command
  // ========================================================================

  test('should display calendar with real CalendarManager', async () => {
    // Create calendar with test data
    await calendarManager.createCalendar('735-03-10', '14:30');

    // Load and modify calendar to add events
    const loadResult = await calendarManager.loadCalendar();
    loadResult.calendar.events = [
      {
        eventId: 'morning-bell',
        name: 'Morning Bell',
        triggerDate: '0735-03-11',
        triggerTime: '06:00',
        status: 'pending'
      },
      {
        eventId: 'market-day',
        name: 'Market Day',
        triggerDate: '0735-03-15',
        triggerTime: '08:00',
        status: 'pending',
        recurring: true,
        recurInterval: 'weekly'
      }
    ];
    await calendarManager.saveCalendar(loadResult.calendar);

    // Test displayCalendar
    const result = await displayCalendar({ calendarManager });

    // Verify all sections
    expect(result).toContain('## Current Date & Time');
    expect(result).toContain('10th of Ches, 735 DR');
    expect(result).toContain('14:30');

    expect(result).toContain('## Moon Phase');

    expect(result).toContain('## Current Weather');

    expect(result).toContain('## Upcoming Events');
    expect(result).toContain('Morning Bell');
    expect(result).toContain('Market Day');
    expect(result).toContain('(Recurring - weekly)');

    expect(result).toContain('## Season & Effects');
    expect(result).toContain('Spring');
  });

  // ========================================================================
  // Integration Test: Command Registration
  // ========================================================================

  test('should register and execute /calendar command through CommandRouter', async () => {
    // Create calendar
    await calendarManager.createCalendar('735-03-10', '14:30');

    // Register command
    registerCalendarCommands(commandRouter, { calendarManager });

    // Execute command through router
    const result = await commandRouter.routeCommand('calendar', []);

    expect(result).toContain('## Current Date & Time');
    expect(result).toContain('## Moon Phase');
    expect(result).toContain('## Current Weather');
    expect(result).toContain('## Upcoming Events');
    expect(result).toContain('## Season & Effects');
  });

  // ========================================================================
  // AC-7: Performance Test (< 100ms)
  // ========================================================================

  test('should complete in < 100ms even with 100+ events', async () => {
    // Create calendar with 100+ events
    await calendarManager.createCalendar('735-03-10', '14:30');

    const loadResult = await calendarManager.loadCalendar();

    // Generate 150 events
    loadResult.calendar.events = [];
    for (let i = 0; i < 150; i++) {
      const dayOffset = Math.floor(i / 5);
      const hour = (8 + (i % 12)).toString().padStart(2, '0');
      loadResult.calendar.events.push({
        eventId: `event-${i}`,
        name: `Test Event ${i}`,
        triggerDate: `0735-03-${(10 + dayOffset).toString().padStart(2, '0')}`,
        triggerTime: `${hour}:00`,
        status: 'pending'
      });
    }

    await calendarManager.saveCalendar(loadResult.calendar);

    // Measure execution time
    const iterations = 10;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await displayCalendar({ calendarManager });
      const elapsed = Date.now() - start;
      times.push(elapsed);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / iterations;
    const maxTime = Math.max(...times);

    // Performance targets
    expect(avgTime).toBeLessThan(100); // Average < 100ms
    expect(maxTime).toBeLessThan(150); // Even worst case should be reasonable

    console.log(`Performance (150 events): avg ${avgTime.toFixed(2)}ms, max ${maxTime}ms`);
  });

  // ========================================================================
  // Integration Test: Graceful Handling with Missing Calendar
  // ========================================================================

  test('should display default calendar when calendar file does not exist', async () => {
    // Don't create calendar file - CalendarManager returns default calendar
    const result = await displayCalendar({ calendarManager });

    // Should still display all sections with default values
    expect(result).toContain('## Current Date & Time');
    expect(result).toContain('## Moon Phase');
    expect(result).toContain('## Current Weather');
    expect(result).toContain('## Upcoming Events');
    expect(result).toContain('## Season & Effects');

    // Default calendar has Marpenoth (Fall) as initial date
    expect(result).toContain('Fall');
  });

  // ========================================================================
  // Integration Test: Seasonal Changes
  // ========================================================================

  test('should display correct season for all 12 months', async () => {
    const testCases = [
      { month: '01', season: 'Winter' },  // Hammer
      { month: '02', season: 'Winter' },  // Alturiak
      { month: '03', season: 'Spring' },  // Ches
      { month: '04', season: 'Spring' },  // Tarsakh
      { month: '05', season: 'Spring' },  // Mirtul
      { month: '06', season: 'Summer' },  // Kythorn
      { month: '07', season: 'Summer' },  // Flamerule
      { month: '08', season: 'Summer' },  // Eleasis
      { month: '09', season: 'Fall' },    // Eleint
      { month: '10', season: 'Fall' },    // Marpenoth
      { month: '11', season: 'Fall' },    // Uktar
      { month: '12', season: 'Winter' }   // Nightal
    ];

    for (const { month, season } of testCases) {
      // Create calendar for specific month
      await calendarManager.createCalendar(`735-${month}-15`, '12:00');

      const result = await displayCalendar({ calendarManager });

      expect(result).toContain(`**Season:** ${season}`);
    }
  });
});
