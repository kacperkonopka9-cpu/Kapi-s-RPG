/**
 * Unit tests for EventScheduler
 * Uses mocked TimeManager for deterministic behavior
 *
 * Tests cover:
 * - Module creation with dependency injection
 * - Date/time-based event triggering
 * - Recurring event handling
 * - Conditional triggering (all 4 types)
 * - Location-based filtering
 * - Event priority sorting
 * - Status management (add, update, remove)
 * - Upcoming events query
 * - Immutability verification
 * - Error handling
 */

const EventScheduler = require('../../src/calendar/event-scheduler');
const { TRIGGER_CONDITIONS, VALID_STATUS_VALUES } = require('../../src/calendar/event-scheduler');

describe('EventScheduler', () => {
  let eventScheduler;
  let mockTimeManager;
  let mockCalendar;

  beforeEach(() => {
    // Mock TimeManager
    mockTimeManager = {
      calculateElapsed: jest.fn(),
      addMinutes: jest.fn()
    };

    eventScheduler = new EventScheduler({ timeManager: mockTimeManager });

    // Mock calendar with events
    mockCalendar = {
      current: {
        date: '0735-10-12',
        time: '14:00'
      },
      events: [
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
      ]
    };
  });

  // ========================================================================
  // Constructor and Dependency Injection
  // ========================================================================

  describe('Constructor', () => {
    test('should initialize with default TimeManager', () => {
      const scheduler = new EventScheduler();
      expect(scheduler.timeManager).toBeDefined();
    });

    test('should accept dependency injection', () => {
      const customTimeManager = { custom: true };
      const scheduler = new EventScheduler({ timeManager: customTimeManager });
      expect(scheduler.timeManager).toBe(customTimeManager);
    });
  });

  // ========================================================================
  // checkTriggers() - Date/Time-Based Triggering
  // ========================================================================

  describe('checkTriggers() - Date/Time-Based', () => {
    test('should detect event triggered within time range', () => {
      // For each event, calculateElapsed is called TWICE:
      // 1. oldDate/Time → event.triggerDate/Time (event timestamp)
      // 2. oldDate/Time → newDate/Time (time range)
      // evt_001: 960 min after old time, range is 1080 min → triggers
      // evt_002: 1680 min after old time, range is 1080 min → doesn't trigger
      mockTimeManager.calculateElapsed
        .mockReturnValueOnce({ success: true, minutes: 960 })  // evt_001 timestamp
        .mockReturnValueOnce({ success: true, minutes: 1080 }) // time range
        .mockReturnValueOnce({ success: true, minutes: 1680 }) // evt_002 timestamp
        .mockReturnValueOnce({ success: true, minutes: 1080 }); // time range

      const result = eventScheduler.checkTriggers(
        mockCalendar,
        '0735-10-12', '14:00',
        '0735-10-13', '08:00',
        {}
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toHaveLength(1);
      expect(result.triggeredEvents[0].eventId).toBe('evt_001');
    });

    test('should NOT trigger event outside time range', () => {
      // Event at 18:00 is 28 hours away, but range is only 2 hours
      // Both events are outside the 2-hour window
      mockTimeManager.calculateElapsed
        .mockReturnValueOnce({ success: true, minutes: 960 })  // evt_001 timestamp
        .mockReturnValueOnce({ success: true, minutes: 120 })  // time range
        .mockReturnValueOnce({ success: true, minutes: 1680 }) // evt_002 timestamp
        .mockReturnValueOnce({ success: true, minutes: 120 }); // time range

      const result = eventScheduler.checkTriggers(
        mockCalendar,
        '0735-10-12', '14:00',
        '0735-10-12', '16:00',
        {}
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toHaveLength(0);
    });

    test('should trigger multiple events and sort by priority', () => {
      // Both events trigger
      mockTimeManager.calculateElapsed
        .mockReturnValueOnce({ success: true, minutes: 960 }) // evt_001: 16 hours
        .mockReturnValueOnce({ success: true, minutes: 1440 }) // Range: 24 hours
        .mockReturnValueOnce({ success: true, minutes: 1680 }) // evt_002: 28 hours
        .mockReturnValueOnce({ success: true, minutes: 1440 }); // Range: 24 hours

      const result = eventScheduler.checkTriggers(
        mockCalendar,
        '0735-10-12', '14:00',
        '0735-10-13', '14:00',
        {}
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toHaveLength(2);
      // Higher priority first (evt_001 has priority 5, evt_002 has priority 3)
      expect(result.triggeredEvents[0].eventId).toBe('evt_001');
      expect(result.triggeredEvents[1].eventId).toBe('evt_002');
    });

    test('should update triggered event status to "triggered"', () => {
      mockTimeManager.calculateElapsed
        .mockReturnValueOnce({ success: true, minutes: 960 })
        .mockReturnValueOnce({ success: true, minutes: 1080 });

      const result = eventScheduler.checkTriggers(
        mockCalendar,
        '0735-10-12', '14:00',
        '0735-10-13', '08:00',
        {}
      );

      expect(result.success).toBe(true);
      expect(result.calendar.events[0].status).toBe('triggered');
    });

    test('should not mutate input calendar', () => {
      mockTimeManager.calculateElapsed
        .mockReturnValueOnce({ success: true, minutes: 960 })
        .mockReturnValueOnce({ success: true, minutes: 1080 });

      const originalCalendar = JSON.parse(JSON.stringify(mockCalendar));

      eventScheduler.checkTriggers(
        mockCalendar,
        '0735-10-12', '14:00',
        '0735-10-13', '08:00',
        {}
      );

      expect(mockCalendar).toEqual(originalCalendar);
    });
  });

  // ========================================================================
  // checkTriggers() - Recurring Events
  // ========================================================================

  describe('checkTriggers() - Recurring Events', () => {
    test('should trigger recurring event and keep status pending', () => {
      mockCalendar.events[0].recurring = true;
      mockCalendar.events[0].recurInterval = 'daily';

      mockTimeManager.calculateElapsed
        .mockReturnValueOnce({ success: true, minutes: 960 })  // evt_001 timestamp
        .mockReturnValueOnce({ success: true, minutes: 1080 }) // time range
        .mockReturnValueOnce({ success: true, minutes: 1680 }) // evt_002 timestamp (won't trigger)
        .mockReturnValueOnce({ success: true, minutes: 1080 }); // time range

      const result = eventScheduler.checkTriggers(
        mockCalendar,
        '0735-10-12', '14:00',
        '0735-10-13', '08:00',
        {}
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toHaveLength(1);
      // Recurring events maintain pending status after triggering (status NOT updated to "triggered")
      expect(result.calendar.events[0].status).toBe('pending'); // Stays pending for next occurrence
    });

    test('should NOT trigger completed non-recurring event', () => {
      mockCalendar.events[0].status = 'completed';

      mockTimeManager.calculateElapsed
        .mockReturnValueOnce({ success: true, minutes: 960 })
        .mockReturnValueOnce({ success: true, minutes: 1080 });

      const result = eventScheduler.checkTriggers(
        mockCalendar,
        '0735-10-12', '14:00',
        '0735-10-13', '08:00',
        {}
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toHaveLength(0);
    });

    test('should trigger completed recurring event', () => {
      mockCalendar.events[0].status = 'completed';
      mockCalendar.events[0].recurring = true;
      mockCalendar.events[0].recurInterval = 'weekly';

      mockTimeManager.calculateElapsed
        .mockReturnValueOnce({ success: true, minutes: 960 })
        .mockReturnValueOnce({ success: true, minutes: 1080 });

      const result = eventScheduler.checkTriggers(
        mockCalendar,
        '0735-10-12', '14:00',
        '0735-10-13', '08:00',
        {}
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toHaveLength(1);
    });
  });

  // ========================================================================
  // checkTriggers() - Conditional Triggering
  // ========================================================================

  describe('checkTriggers() - Conditional Triggers', () => {
    test('should trigger player_enters_location condition', () => {
      mockCalendar.events.push({
        eventId: 'evt_003',
        name: 'Enter Vallaki',
        triggerCondition: 'player_enters_location',
        conditionParams: { locationId: 'vallaki' },
        status: 'pending'
      });

      const context = {
        currentLocation: 'vallaki',
        previousLocation: 'village-of-barovia'
      };

      const result = eventScheduler.checkTriggers(
        mockCalendar,
        '0735-10-12', '14:00',
        '0735-10-12', '15:00',
        context
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents.some(e => e.eventId === 'evt_003')).toBe(true);
    });

    test('should NOT trigger player_enters_location if already at location', () => {
      mockCalendar.events.push({
        eventId: 'evt_003',
        name: 'Enter Vallaki',
        triggerCondition: 'player_enters_location',
        conditionParams: { locationId: 'vallaki' },
        status: 'pending'
      });

      const context = {
        currentLocation: 'vallaki',
        previousLocation: 'vallaki' // Already here
      };

      const result = eventScheduler.checkTriggers(
        mockCalendar,
        '0735-10-12', '14:00',
        '0735-10-12', '15:00',
        context
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents.some(e => e.eventId === 'evt_003')).toBe(false);
    });

    test('should trigger game_flag_set condition', () => {
      mockCalendar.events.push({
        eventId: 'evt_004',
        name: 'Quest completed',
        triggerCondition: 'game_flag_set',
        conditionParams: { flagName: 'quest_complete' },
        status: 'pending'
      });

      const context = {
        gameFlags: { quest_complete: true }
      };

      const result = eventScheduler.checkTriggers(
        mockCalendar,
        '0735-10-12', '14:00',
        '0735-10-12', '15:00',
        context
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents.some(e => e.eventId === 'evt_004')).toBe(true);
    });

    test('should NOT trigger game_flag_set if flag is false', () => {
      mockCalendar.events.push({
        eventId: 'evt_004',
        name: 'Quest completed',
        triggerCondition: 'game_flag_set',
        conditionParams: { flagName: 'quest_complete' },
        status: 'pending'
      });

      const context = {
        gameFlags: { quest_complete: false }
      };

      const result = eventScheduler.checkTriggers(
        mockCalendar,
        '0735-10-12', '14:00',
        '0735-10-12', '15:00',
        context
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents.some(e => e.eventId === 'evt_004')).toBe(false);
    });

    test('should trigger npc_status_changed condition', () => {
      mockCalendar.events.push({
        eventId: 'evt_005',
        name: 'NPC defeated',
        triggerCondition: 'npc_status_changed',
        conditionParams: { npcId: 'ireena', statusFlag: 'defeated', expectedValue: true },
        status: 'pending'
      });

      const context = {
        npcStatuses: {
          ireena: { defeated: true }
        }
      };

      const result = eventScheduler.checkTriggers(
        mockCalendar,
        '0735-10-12', '14:00',
        '0735-10-12', '15:00',
        context
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents.some(e => e.eventId === 'evt_005')).toBe(true);
    });

    test('should trigger time_elapsed_since condition', () => {
      mockCalendar.events.push({
        eventId: 'evt_006',
        name: 'Time passed',
        triggerCondition: 'time_elapsed_since',
        conditionParams: {
          referenceDate: '0735-10-10',
          referenceTime: '14:00',
          elapsedHours: 48
        },
        status: 'pending'
      });

      const context = {
        currentDate: '0735-10-12',
        currentTime: '15:00'
      };

      // 48 hours = 2880 minutes
      mockTimeManager.calculateElapsed.mockReturnValue({ success: true, minutes: 2940 }); // 49 hours

      const result = eventScheduler.checkTriggers(
        mockCalendar,
        '0735-10-12', '14:00',
        '0735-10-12', '15:00',
        context
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents.some(e => e.eventId === 'evt_006')).toBe(true);
    });
  });

  // ========================================================================
  // checkTriggers() - Location-Based Filtering
  // ========================================================================

  describe('checkTriggers() - Location Filtering', () => {
    test('should NOT trigger location-specific event when player elsewhere', () => {
      mockCalendar.events[0].locationId = 'vallaki';

      mockTimeManager.calculateElapsed
        .mockReturnValueOnce({ success: true, minutes: 960 })
        .mockReturnValueOnce({ success: true, minutes: 1080 });

      const context = { currentLocation: 'village-of-barovia' };

      const result = eventScheduler.checkTriggers(
        mockCalendar,
        '0735-10-12', '14:00',
        '0735-10-13', '08:00',
        context
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toHaveLength(0);
    });

    test('should trigger location-specific event when player at location', () => {
      mockCalendar.events[0].locationId = 'vallaki';

      mockTimeManager.calculateElapsed
        .mockReturnValueOnce({ success: true, minutes: 960 })
        .mockReturnValueOnce({ success: true, minutes: 1080 });

      const context = { currentLocation: 'vallaki' };

      const result = eventScheduler.checkTriggers(
        mockCalendar,
        '0735-10-12', '14:00',
        '0735-10-13', '08:00',
        context
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toHaveLength(1);
    });

    test('should trigger global event (locationId null) regardless of location', () => {
      mockCalendar.events[0].locationId = null;

      mockTimeManager.calculateElapsed
        .mockReturnValueOnce({ success: true, minutes: 960 })
        .mockReturnValueOnce({ success: true, minutes: 1080 });

      const context = { currentLocation: 'anywhere' };

      const result = eventScheduler.checkTriggers(
        mockCalendar,
        '0735-10-12', '14:00',
        '0735-10-13', '08:00',
        context
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toHaveLength(1);
    });
  });

  // ========================================================================
  // checkTriggers() - Priority Ordering
  // ========================================================================

  describe('checkTriggers() - Priority Ordering', () => {
    test('should sort by priority descending (high first)', () => {
      // Add more events with different priorities
      mockCalendar.events = [
        { eventId: 'evt_1', name: 'Low', triggerDate: '0735-10-13', triggerTime: '06:00', status: 'pending', priority: 1 },
        { eventId: 'evt_2', name: 'High', triggerDate: '0735-10-13', triggerTime: '06:00', status: 'pending', priority: 10 },
        { eventId: 'evt_3', name: 'Med', triggerDate: '0735-10-13', triggerTime: '06:00', status: 'pending', priority: 5 }
      ];

      // Mock all events triggered
      mockTimeManager.calculateElapsed.mockReturnValue({ success: true, minutes: 960 });

      const result = eventScheduler.checkTriggers(
        mockCalendar,
        '0735-10-12', '14:00',
        '0735-10-13', '14:00',
        {}
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toHaveLength(3);
      expect(result.triggeredEvents[0].priority).toBe(10); // High first
      expect(result.triggeredEvents[1].priority).toBe(5);  // Med second
      expect(result.triggeredEvents[2].priority).toBe(1);  // Low last
    });

    test('should sort chronologically when same priority', () => {
      mockCalendar.events = [
        { eventId: 'evt_1', name: 'Later', triggerDate: '0735-10-13', triggerTime: '18:00', status: 'pending', priority: 5 },
        { eventId: 'evt_2', name: 'Earlier', triggerDate: '0735-10-13', triggerTime: '06:00', status: 'pending', priority: 5 }
      ];

      mockTimeManager.calculateElapsed.mockReturnValue({ success: true, minutes: 960 });

      const result = eventScheduler.checkTriggers(
        mockCalendar,
        '0735-10-12', '14:00',
        '0735-10-14', '14:00',
        {}
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toHaveLength(2);
      expect(result.triggeredEvents[0].eventId).toBe('evt_2'); // Earlier time first
      expect(result.triggeredEvents[1].eventId).toBe('evt_1');
    });
  });

  // ========================================================================
  // checkTriggers() - Error Handling
  // ========================================================================

  describe('checkTriggers() - Error Handling', () => {
    test('should reject invalid calendar', () => {
      const result = eventScheduler.checkTriggers(
        null,
        '0735-10-12', '14:00',
        '0735-10-13', '08:00',
        {}
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid calendar');
    });

    test('should reject calendar missing events array', () => {
      const result = eventScheduler.checkTriggers(
        { current: {} },
        '0735-10-12', '14:00',
        '0735-10-13', '08:00',
        {}
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('events array');
    });

    test('should reject invalid date/time parameters', () => {
      const result = eventScheduler.checkTriggers(
        mockCalendar,
        null, '14:00',
        '0735-10-13', '08:00',
        {}
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid date/time');
    });
  });

  // ========================================================================
  // addEvent()
  // ========================================================================

  describe('addEvent()', () => {
    test('should add event to calendar', () => {
      const newEvent = {
        eventId: 'evt_003',
        name: 'New event',
        status: 'pending',
        triggerDate: '0735-10-14',
        triggerTime: '12:00'
      };

      const result = eventScheduler.addEvent(mockCalendar, newEvent);

      expect(result.success).toBe(true);
      expect(result.calendar.events).toHaveLength(3);
      expect(result.calendar.events[2]).toEqual(newEvent);
    });

    test('should not mutate input calendar', () => {
      const originalCalendar = JSON.parse(JSON.stringify(mockCalendar));
      const newEvent = {
        eventId: 'evt_003',
        name: 'New event',
        status: 'pending'
      };

      eventScheduler.addEvent(mockCalendar, newEvent);

      expect(mockCalendar).toEqual(originalCalendar);
    });

    test('should reject event with missing eventId', () => {
      const newEvent = {
        name: 'New event',
        status: 'pending'
      };

      const result = eventScheduler.addEvent(mockCalendar, newEvent);

      expect(result.success).toBe(false);
      expect(result.error).toContain('eventId');
    });

    test('should reject event with missing name', () => {
      const newEvent = {
        eventId: 'evt_003',
        status: 'pending'
      };

      const result = eventScheduler.addEvent(mockCalendar, newEvent);

      expect(result.success).toBe(false);
      expect(result.error).toContain('name');
    });

    test('should reject event with invalid status', () => {
      const newEvent = {
        eventId: 'evt_003',
        name: 'New event',
        status: 'invalid_status'
      };

      const result = eventScheduler.addEvent(mockCalendar, newEvent);

      expect(result.success).toBe(false);
      expect(result.error).toContain('status');
    });

    test('should reject duplicate eventId', () => {
      const newEvent = {
        eventId: 'evt_001', // Already exists
        name: 'Duplicate',
        status: 'pending'
      };

      const result = eventScheduler.addEvent(mockCalendar, newEvent);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  // ========================================================================
  // updateEventStatus()
  // ========================================================================

  describe('updateEventStatus()', () => {
    test('should update event status', () => {
      const result = eventScheduler.updateEventStatus(mockCalendar, 'evt_001', 'completed');

      expect(result.success).toBe(true);
      expect(result.calendar.events[0].status).toBe('completed');
    });

    test('should not mutate input calendar', () => {
      const originalCalendar = JSON.parse(JSON.stringify(mockCalendar));

      eventScheduler.updateEventStatus(mockCalendar, 'evt_001', 'completed');

      expect(mockCalendar).toEqual(originalCalendar);
    });

    test('should reject invalid status value', () => {
      const result = eventScheduler.updateEventStatus(mockCalendar, 'evt_001', 'invalid');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid status');
    });

    test('should reject non-existent eventId', () => {
      const result = eventScheduler.updateEventStatus(mockCalendar, 'evt_999', 'completed');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  // ========================================================================
  // removeEvent()
  // ========================================================================

  describe('removeEvent()', () => {
    test('should remove event from calendar', () => {
      const result = eventScheduler.removeEvent(mockCalendar, 'evt_001');

      expect(result.success).toBe(true);
      expect(result.calendar.events).toHaveLength(1);
      expect(result.calendar.events[0].eventId).toBe('evt_002');
    });

    test('should not mutate input calendar', () => {
      const originalCalendar = JSON.parse(JSON.stringify(mockCalendar));

      eventScheduler.removeEvent(mockCalendar, 'evt_001');

      expect(mockCalendar).toEqual(originalCalendar);
    });

    test('should reject non-existent eventId', () => {
      const result = eventScheduler.removeEvent(mockCalendar, 'evt_999');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  // ========================================================================
  // getUpcomingEvents()
  // ========================================================================

  describe('getUpcomingEvents()', () => {
    test('should return events within lookahead window', () => {
      // Event 1 is 16 hours away (960 min), Event 2 is 28 hours away (1680 min)
      mockTimeManager.addMinutes.mockReturnValue({
        success: true,
        date: '0735-10-13',
        time: '14:00' // 24 hours ahead
      });

      mockTimeManager.calculateElapsed
        .mockReturnValueOnce({ success: true, minutes: 960 })  // evt_001: within range
        .mockReturnValueOnce({ success: true, minutes: 1680 }); // evt_002: outside range

      const result = eventScheduler.getUpcomingEvents(mockCalendar, 1440); // 24 hours

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].eventId).toBe('evt_001');
    });

    test('should only return pending events', () => {
      mockCalendar.events[0].status = 'completed';

      mockTimeManager.addMinutes.mockReturnValue({
        success: true,
        date: '0735-10-14',
        time: '14:00'
      });

      mockTimeManager.calculateElapsed.mockReturnValue({ success: true, minutes: 960 });

      const result = eventScheduler.getUpcomingEvents(mockCalendar, 2880);

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(0); // evt_001 is completed
    });

    test('should sort events chronologically', () => {
      mockCalendar.events = [
        { eventId: 'evt_1', triggerDate: '0735-10-13', triggerTime: '18:00', status: 'pending' },
        { eventId: 'evt_2', triggerDate: '0735-10-13', triggerTime: '06:00', status: 'pending' }
      ];

      mockTimeManager.addMinutes.mockReturnValue({
        success: true,
        date: '0735-10-14',
        time: '14:00'
      });

      mockTimeManager.calculateElapsed.mockReturnValue({ success: true, minutes: 960 });

      const result = eventScheduler.getUpcomingEvents(mockCalendar, 2880);

      expect(result.success).toBe(true);
      expect(result.events[0].eventId).toBe('evt_2'); // Earlier time first
      expect(result.events[1].eventId).toBe('evt_1');
    });

    test('should reject invalid lookaheadMinutes', () => {
      const result = eventScheduler.getUpcomingEvents(mockCalendar, -10);

      expect(result.success).toBe(false);
      expect(result.error).toContain('lookaheadMinutes');
    });
  });
});
