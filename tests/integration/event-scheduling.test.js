/**
 * Integration tests for EventScheduler
 * Uses real TimeManager and CalendarManager
 *
 * Tests cover:
 * - Integration with CalendarManager (load/save cycles)
 * - Integration with TimeManager (real timestamp calculations)
 * - Time advance triggers multiple events
 * - Recurring events over multiple days
 * - Immutability verification
 * - Performance targets
 */

const EventScheduler = require('../../src/calendar/event-scheduler');
const TimeManager = require('../../src/calendar/time-manager');
const CalendarManager = require('../../src/calendar/calendar-manager');
const fs = require('fs').promises;
const path = require('path');

describe('EventScheduler Integration Tests', () => {
  let tempDir;
  let tempCalendarPath;
  let calendarManager;
  let eventScheduler;
  let timeManager;

  beforeEach(async () => {
    // Create temp directory for each test
    tempDir = path.join(__dirname, '..', 'temp', `event-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    tempCalendarPath = path.join(tempDir, 'calendar.yaml');
    calendarManager = new CalendarManager({ calendarPath: tempCalendarPath });
    timeManager = new TimeManager(); // Real date-fns
    eventScheduler = new EventScheduler({ timeManager }); // Real TimeManager
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
    test('should load calendar, check triggers, and save updated calendar', async () => {
      // Create calendar
      await calendarManager.createCalendar('735-10-12', '14:00');

      // Load calendar
      const loadResult = await calendarManager.loadCalendar();
      expect(loadResult.success).toBe(true);

      // Add events manually to calendar
      loadResult.calendar.events = [
        {
          eventId: 'evt_001',
          name: 'Morning event',
          triggerDate: '0735-10-13',
          triggerTime: '06:00',
          status: 'pending',
          priority: 5
        },
        {
          eventId: 'evt_002',
          name: 'Evening event',
          triggerDate: '0735-10-13',
          triggerTime: '18:00',
          status: 'pending',
          priority: 3
        }
      ];

      // Save calendar with events
      await calendarManager.saveCalendar(loadResult.calendar);

      // Reload
      const reloadResult = await calendarManager.loadCalendar();

      // Check triggers (time advances from 14:00 to 08:00 next day - should trigger evt_001)
      const triggerResult = eventScheduler.checkTriggers(
        reloadResult.calendar,
        '0735-10-12', '14:00',
        '0735-10-13', '08:00',
        {}
      );

      expect(triggerResult.success).toBe(true);
      expect(triggerResult.triggeredEvents).toHaveLength(1);
      expect(triggerResult.triggeredEvents[0].eventId).toBe('evt_001');

      // Save updated calendar with triggered status
      await calendarManager.saveCalendar(triggerResult.calendar);

      // Reload and verify status change
      const finalResult = await calendarManager.loadCalendar();
      expect(finalResult.calendar.events[0].status).toBe('triggered');
    });

    test('should verify calendar not mutated', async () => {
      await calendarManager.createCalendar('735-10-12', '14:00');
      const loadResult = await calendarManager.loadCalendar();

      loadResult.calendar.events = [
        {
          eventId: 'evt_001',
          name: 'Test event',
          triggerDate: '0735-10-13',
          triggerTime: '06:00',
          status: 'pending'
        }
      ];

      const originalCalendar = JSON.parse(JSON.stringify(loadResult.calendar));

      // Check triggers
      eventScheduler.checkTriggers(
        loadResult.calendar,
        '0735-10-12', '14:00',
        '0735-10-13', '08:00',
        {}
      );

      // Verify original calendar unchanged
      expect(loadResult.calendar).toEqual(originalCalendar);
    });
  });

  // ========================================================================
  // Time Advancement Triggers Multiple Events
  // ========================================================================

  describe('Time Advancement Triggers Multiple Events', () => {
    test('should trigger multiple events in correct priority order', async () => {
      await calendarManager.createCalendar('735-10-12', '14:00');
      const loadResult = await calendarManager.loadCalendar();

      loadResult.calendar.events = [
        {
          eventId: 'evt_001',
          name: 'Low priority',
          triggerDate: '0735-10-13',
          triggerTime: '06:00',
          status: 'pending',
          priority: 1
        },
        {
          eventId: 'evt_002',
          name: 'High priority',
          triggerDate: '0735-10-13',
          triggerTime: '08:00',
          status: 'pending',
          priority: 10
        },
        {
          eventId: 'evt_003',
          name: 'Med priority',
          triggerDate: '0735-10-13',
          triggerTime: '07:00',
          status: 'pending',
          priority: 5
        }
      ];

      // Advance time to trigger all 3 events
      const triggerResult = eventScheduler.checkTriggers(
        loadResult.calendar,
        '0735-10-12', '14:00',
        '0735-10-13', '10:00',
        {}
      );

      expect(triggerResult.success).toBe(true);
      expect(triggerResult.triggeredEvents).toHaveLength(3);

      // Verify priority ordering (high → med → low)
      expect(triggerResult.triggeredEvents[0].eventId).toBe('evt_002'); // priority 10
      expect(triggerResult.triggeredEvents[1].eventId).toBe('evt_003'); // priority 5
      expect(triggerResult.triggeredEvents[2].eventId).toBe('evt_001'); // priority 1
    });
  });

  // ========================================================================
  // Recurring Events Over Multiple Days
  // ========================================================================

  describe('Recurring Events Over Multiple Days', () => {
    test('should maintain pending status for recurring events', async () => {
      await calendarManager.createCalendar('735-10-12', '14:00');
      const loadResult = await calendarManager.loadCalendar();

      loadResult.calendar.events = [
        {
          eventId: 'evt_daily',
          name: 'Daily morning',
          triggerDate: '0735-10-13',
          triggerTime: '06:00',
          status: 'pending',
          recurring: true,
          recurInterval: 'daily'
        }
      ];

      // Advance to 08:00 (should trigger)
      const result = eventScheduler.checkTriggers(
        loadResult.calendar,
        '0735-10-12', '14:00',
        '0735-10-13', '08:00',
        {}
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toHaveLength(1);
      expect(result.calendar.events[0].status).toBe('pending'); // Recurring maintains pending
      expect(result.calendar.events[0].recurring).toBe(true);

      // Note: Auto-advancing trigger dates for next occurrence is Story 2-4 (NPC Schedule Tracking)
    });
  });

  // ========================================================================
  // TimeManager Integration
  // ========================================================================

  describe('TimeManager Integration', () => {
    test('should use TimeManager.calculateElapsed() correctly', async () => {
      await calendarManager.createCalendar('735-10-12', '23:00');
      const loadResult = await calendarManager.loadCalendar();

      loadResult.calendar.events = [
        {
          eventId: 'evt_001',
          name: 'Midnight event',
          triggerDate: '0735-10-13',
          triggerTime: '01:00',
          status: 'pending'
        }
      ];

      // Advance across midnight
      const triggerResult = eventScheduler.checkTriggers(
        loadResult.calendar,
        '0735-10-12', '23:00',
        '0735-10-13', '03:00',
        {}
      );

      expect(triggerResult.success).toBe(true);
      expect(triggerResult.triggeredEvents).toHaveLength(1);
    });

    test('should use TimeManager.addMinutes() in getUpcomingEvents', async () => {
      await calendarManager.createCalendar('735-10-12', '14:00');
      const loadResult = await calendarManager.loadCalendar();

      loadResult.calendar.events = [
        {
          eventId: 'evt_001',
          name: 'Future event',
          triggerDate: '0735-10-12',
          triggerTime: '16:00',
          status: 'pending'
        },
        {
          eventId: 'evt_002',
          name: 'Far future',
          triggerDate: '0735-10-13',
          triggerTime: '14:00',
          status: 'pending'
        }
      ];

      // Get events within next 4 hours (240 min)
      const upcomingResult = eventScheduler.getUpcomingEvents(loadResult.calendar, 240);

      expect(upcomingResult.success).toBe(true);
      expect(upcomingResult.events).toHaveLength(1);
      expect(upcomingResult.events[0].eventId).toBe('evt_001');
    });
  });

  // ========================================================================
  // Conditional and Location-Based Integration
  // ========================================================================

  describe('Conditional and Location-Based Triggers', () => {
    test('should trigger event when player enters location', async () => {
      await calendarManager.createCalendar('735-10-12', '14:00');
      const loadResult = await calendarManager.loadCalendar();

      loadResult.calendar.events = [
        {
          eventId: 'evt_enter_vallaki',
          name: 'Enter Vallaki',
          triggerCondition: 'player_enters_location',
          conditionParams: { locationId: 'vallaki' },
          status: 'pending'
        }
      ];

      const context = {
        currentLocation: 'vallaki',
        previousLocation: 'village-of-barovia'
      };

      const triggerResult = eventScheduler.checkTriggers(
        loadResult.calendar,
        '0735-10-12', '14:00',
        '0735-10-12', '15:00',
        context
      );

      expect(triggerResult.success).toBe(true);
      expect(triggerResult.triggeredEvents).toHaveLength(1);
    });

    test('should NOT trigger location-specific event when player elsewhere', async () => {
      await calendarManager.createCalendar('735-10-12', '14:00');
      const loadResult = await calendarManager.loadCalendar();

      loadResult.calendar.events = [
        {
          eventId: 'evt_001',
          name: 'Vallaki only',
          triggerDate: '0735-10-13',
          triggerTime: '06:00',
          status: 'pending',
          locationId: 'vallaki'
        }
      ];

      const context = { currentLocation: 'village-of-barovia' };

      const triggerResult = eventScheduler.checkTriggers(
        loadResult.calendar,
        '0735-10-12', '14:00',
        '0735-10-13', '08:00',
        context
      );

      expect(triggerResult.success).toBe(true);
      expect(triggerResult.triggeredEvents).toHaveLength(0); // Wrong location
    });
  });

  // ========================================================================
  // Performance Tests (Real I/O and calculations)
  // ========================================================================

  describe('Performance Tests', () => {
    test('checkTriggers() should complete in < 100ms for 100 events', async () => {
      await calendarManager.createCalendar('735-10-12', '14:00');
      const loadResult = await calendarManager.loadCalendar();

      // Create 100 events
      loadResult.calendar.events = [];
      for (let i = 0; i < 100; i++) {
        loadResult.calendar.events.push({
          eventId: `evt_${i}`,
          name: `Event ${i}`,
          triggerDate: '0735-10-13',
          triggerTime: `${String(i % 24).padStart(2, '0')}:00`,
          status: 'pending',
          priority: i % 10
        });
      }

      const iterations = 10;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        eventScheduler.checkTriggers(
          loadResult.calendar,
          '0735-10-12', '14:00',
          '0735-10-14', '14:00',
          {}
        );
        times.push(Date.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / iterations;
      expect(avgTime).toBeLessThan(100); // Adjusted target (real date-fns operations)
    });

    test('getUpcomingEvents() should complete in < 30ms', async () => {
      await calendarManager.createCalendar('735-10-12', '14:00');
      const loadResult = await calendarManager.loadCalendar();

      // Create 50 events
      loadResult.calendar.events = [];
      for (let i = 0; i < 50; i++) {
        loadResult.calendar.events.push({
          eventId: `evt_${i}`,
          name: `Event ${i}`,
          triggerDate: '0735-10-13',
          triggerTime: `${String(i % 24).padStart(2, '0')}:00`,
          status: 'pending'
        });
      }

      const iterations = 10;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        eventScheduler.getUpcomingEvents(loadResult.calendar, 1440);
        times.push(Date.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / iterations;
      expect(avgTime).toBeLessThan(30); // Adjusted target (real date-fns operations)
    });
  });

  // ========================================================================
  // addEvent/updateEventStatus/removeEvent Integration
  // ========================================================================

  describe('Event Management Integration', () => {
    test('should add, update status, and remove event with calendar persistence', async () => {
      await calendarManager.createCalendar('735-10-12', '14:00');
      const loadResult = await calendarManager.loadCalendar();

      // Add event
      const newEvent = {
        eventId: 'evt_new',
        name: 'New event',
        triggerDate: '0735-10-13',
        triggerTime: '12:00',
        status: 'pending'
      };

      const addResult = eventScheduler.addEvent(loadResult.calendar, newEvent);
      expect(addResult.success).toBe(true);
      expect(addResult.calendar.events).toHaveLength(1);

      // Save
      await calendarManager.saveCalendar(addResult.calendar);

      // Reload and update status
      const reloadResult = await calendarManager.loadCalendar();
      const updateResult = eventScheduler.updateEventStatus(reloadResult.calendar, 'evt_new', 'completed');
      expect(updateResult.success).toBe(true);
      expect(updateResult.calendar.events[0].status).toBe('completed');

      // Save
      await calendarManager.saveCalendar(updateResult.calendar);

      // Reload and remove
      const reload2Result = await calendarManager.loadCalendar();
      const removeResult = eventScheduler.removeEvent(reload2Result.calendar, 'evt_new');
      expect(removeResult.success).toBe(true);
      expect(removeResult.calendar.events).toHaveLength(0);

      // Save and verify final state
      await calendarManager.saveCalendar(removeResult.calendar);
      const finalResult = await calendarManager.loadCalendar();
      expect(finalResult.calendar.events).toHaveLength(0);
    });
  });
});
