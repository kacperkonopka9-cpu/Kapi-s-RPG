/**
 * Unit tests for NPCScheduleTracker
 * Mocks TimeManager and LocationLoader for deterministic behavior
 *
 * Tests cover:
 * - Constructor and dependency injection
 * - Loading NPC schedules with validation
 * - Time-based location tracking (edge cases: before/during/after schedule)
 * - Schedule overrides with game state conditions
 * - Bulk NPC location updates
 * - NPCs-at-location queries
 * - Recurring event date advancement (daily/weekly/monthly)
 * - Error handling and input validation
 * - Immutability verification
 */

const NPCScheduleTracker = require('../../src/calendar/npc-schedule-tracker');

describe('NPCScheduleTracker', () => {
  let npcScheduleTracker;
  let mockTimeManager;
  let mockLocationLoader;

  beforeEach(() => {
    // Mock TimeManager
    mockTimeManager = {
      calculateElapsed: jest.fn(),
      addMinutes: jest.fn()
    };

    // Mock LocationLoader
    const path = require('path');
    mockLocationLoader = {
      loadLocationFile: jest.fn(),
      basePath: path.join(process.cwd(), 'game-data', 'locations')
    };

    // Create tracker with mocked dependencies
    npcScheduleTracker = new NPCScheduleTracker({
      timeManager: mockTimeManager,
      locationLoader: mockLocationLoader
    });
  });

  // ========================================================================
  // Constructor and Dependency Injection
  // ========================================================================

  describe('Constructor', () => {
    test('should initialize with default dependencies', () => {
      const tracker = new NPCScheduleTracker();
      expect(tracker.timeManager).toBeDefined();
      expect(tracker.locationLoader).toBeDefined();
      expect(tracker.scheduleCache).toBeInstanceOf(Map);
    });

    test('should accept dependency injection', () => {
      const tracker = new NPCScheduleTracker({
        timeManager: mockTimeManager,
        locationLoader: mockLocationLoader
      });
      expect(tracker.timeManager).toBe(mockTimeManager);
      expect(tracker.locationLoader).toBe(mockLocationLoader);
    });
  });

  // ========================================================================
  // getNPCLocation() - Time-Based Location Tracking
  // ========================================================================

  describe('getNPCLocation()', () => {
    beforeEach(() => {
      // Pre-populate cache with test NPC schedule
      npcScheduleTracker.scheduleCache.set('test_npc', {
        npcId: 'test_npc',
        locationId: 'home',
        routine: [
          {
            timeStart: '06:00',
            timeEnd: '08:00',
            activity: 'Morning prayers',
            locationId: 'chapel',
            activityDetails: 'Praying at the chapel'
          },
          {
            timeStart: '12:00',
            timeEnd: '14:00',
            activity: 'Lunch',
            locationId: 'tavern',
            activityDetails: 'Eating at the tavern'
          },
          {
            timeStart: '18:00',
            timeEnd: '20:00',
            activity: 'Evening duties',
            locationId: 'mansion',
            activityDetails: 'Working at the mansion'
          }
        ],
        overrides: []
      });
    });

    test('should return location when time falls within schedule entry', () => {
      const result = npcScheduleTracker.getNPCLocation('test_npc', '0735-10-12', '07:00');

      expect(result.success).toBe(true);
      expect(result.location).toBe('chapel');
      expect(result.activity).toBe('Morning prayers');
      expect(result.activityDetails).toBe('Praying at the chapel');
    });

    test('should return home location when time before first entry', () => {
      const result = npcScheduleTracker.getNPCLocation('test_npc', '0735-10-12', '05:00');

      expect(result.success).toBe(true);
      expect(result.location).toBe('home');
      expect(result.activity).toBe('At home');
    });

    test('should return last location when time after last entry', () => {
      const result = npcScheduleTracker.getNPCLocation('test_npc', '0735-10-12', '23:00');

      expect(result.success).toBe(true);
      expect(result.location).toBe('mansion');
      expect(result.activity).toBe('Evening duties');
    });

    test('should return last location when time in gap between entries', () => {
      const result = npcScheduleTracker.getNPCLocation('test_npc', '0735-10-12', '09:00');

      expect(result.success).toBe(true);
      // Between 08:00 (chapel end) and 12:00 (tavern start)
      // Should return home since no entry matches
      expect(result.location).toBe('home');
    });

    test('should reject invalid npcId', () => {
      const result = npcScheduleTracker.getNPCLocation('', '0735-10-12', '07:00');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid npcId');
    });

    test('should reject invalid time format', () => {
      const result = npcScheduleTracker.getNPCLocation('test_npc', '0735-10-12', '25:00');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid currentTime');
    });

    test('should handle NPC with no schedule (not in cache)', () => {
      const result = npcScheduleTracker.getNPCLocation('unknown_npc', '0735-10-12', '07:00');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot get NPC location');
    });
  });

  // ========================================================================
  // evaluateScheduleOverrides() - Schedule Override System
  // ========================================================================

  describe('evaluateScheduleOverrides()', () => {
    test('should return base routine when no overrides exist', () => {
      const schedule = {
        npcId: 'test_npc',
        locationId: 'home',
        routine: [
          { timeStart: '06:00', timeEnd: '08:00', activity: 'Morning', locationId: 'chapel' }
        ],
        overrides: []
      };

      const result = npcScheduleTracker.evaluateScheduleOverrides(schedule, {});

      expect(result.success).toBe(true);
      expect(result.routine).toEqual(schedule.routine);
    });

    test('should apply override when condition is true', () => {
      const schedule = {
        npcId: 'test_npc',
        locationId: 'home',
        routine: [
          { timeStart: '06:00', timeEnd: '08:00', activity: 'Morning', locationId: 'chapel' }
        ],
        overrides: [
          {
            condition: 'burgomaster_dead',
            newRoutine: [
              { timeStart: '06:00', timeEnd: '12:00', activity: 'Grieving', locationId: 'mansion' }
            ]
          }
        ]
      };

      const gameState = { burgomaster_dead: true };
      const result = npcScheduleTracker.evaluateScheduleOverrides(schedule, gameState);

      expect(result.success).toBe(true);
      expect(result.routine).toEqual(schedule.overrides[0].newRoutine);
    });

    test('should not apply override when condition is false', () => {
      const schedule = {
        npcId: 'test_npc',
        locationId: 'home',
        routine: [
          { timeStart: '06:00', timeEnd: '08:00', activity: 'Morning', locationId: 'chapel' }
        ],
        overrides: [
          {
            condition: 'burgomaster_dead',
            newRoutine: [
              { timeStart: '06:00', timeEnd: '12:00', activity: 'Grieving', locationId: 'mansion' }
            ]
          }
        ]
      };

      const gameState = { burgomaster_dead: false };
      const result = npcScheduleTracker.evaluateScheduleOverrides(schedule, gameState);

      expect(result.success).toBe(true);
      expect(result.routine).toEqual(schedule.routine);
    });

    test('should not apply override when condition undefined in game state', () => {
      const schedule = {
        npcId: 'test_npc',
        locationId: 'home',
        routine: [
          { timeStart: '06:00', timeEnd: '08:00', activity: 'Morning', locationId: 'chapel' }
        ],
        overrides: [
          {
            condition: 'burgomaster_dead',
            newRoutine: [
              { timeStart: '06:00', timeEnd: '12:00', activity: 'Grieving', locationId: 'mansion' }
            ]
          }
        ]
      };

      const gameState = {};
      const result = npcScheduleTracker.evaluateScheduleOverrides(schedule, gameState);

      expect(result.success).toBe(true);
      expect(result.routine).toEqual(schedule.routine);
    });

    test('should use first matching override when multiple exist', () => {
      const schedule = {
        npcId: 'test_npc',
        locationId: 'home',
        routine: [
          { timeStart: '06:00', timeEnd: '08:00', activity: 'Morning', locationId: 'chapel' }
        ],
        overrides: [
          {
            condition: 'burgomaster_dead',
            newRoutine: [
              { timeStart: '06:00', timeEnd: '12:00', activity: 'Grieving', locationId: 'mansion' }
            ]
          },
          {
            condition: 'player_escort_active',
            newRoutine: [
              { timeStart: '00:00', timeEnd: '23:59', activity: 'Following player', locationId: 'player_location' }
            ]
          }
        ]
      };

      const gameState = { burgomaster_dead: true, player_escort_active: true };
      const result = npcScheduleTracker.evaluateScheduleOverrides(schedule, gameState);

      expect(result.success).toBe(true);
      // First override should win
      expect(result.routine).toEqual(schedule.overrides[0].newRoutine);
    });
  });

  // ========================================================================
  // updateAllNPCLocations() - Bulk NPC Location Updates
  // ========================================================================

  describe('updateAllNPCLocations()', () => {
    beforeEach(() => {
      // Pre-populate cache with multiple NPCs
      npcScheduleTracker.scheduleCache.set('npc1', {
        npcId: 'npc1',
        locationId: 'home1',
        routine: [
          { timeStart: '06:00', timeEnd: '08:00', activity: 'Morning', locationId: 'chapel' }
        ],
        overrides: []
      });

      npcScheduleTracker.scheduleCache.set('npc2', {
        npcId: 'npc2',
        locationId: 'home2',
        routine: [
          { timeStart: '06:00', timeEnd: '08:00', activity: 'Morning', locationId: 'tavern' }
        ],
        overrides: []
      });
    });

    test('should update all NPC locations', () => {
      const calendar = {
        current: { date: '0735-10-12', time: '07:00' },
        npcSchedules: {
          npc1: { currentLocation: null },
          npc2: { currentLocation: null }
        }
      };

      const result = npcScheduleTracker.updateAllNPCLocations(calendar);

      expect(result.success).toBe(true);
      expect(result.updates).toHaveLength(2);
      expect(result.calendar.npcSchedules.npc1.currentLocation).toBe('chapel');
      expect(result.calendar.npcSchedules.npc2.currentLocation).toBe('tavern');
    });

    test('should return updates array with old and new locations', () => {
      const calendar = {
        current: { date: '0735-10-12', time: '07:00' },
        npcSchedules: {
          npc1: { currentLocation: 'home1' }
        }
      };

      const result = npcScheduleTracker.updateAllNPCLocations(calendar);

      expect(result.success).toBe(true);
      expect(result.updates[0]).toMatchObject({
        npcId: 'npc1',
        oldLocation: 'home1',
        newLocation: 'chapel',
        activity: 'Morning'
      });
    });

    test('should not mutate input calendar', () => {
      const calendar = {
        current: { date: '0735-10-12', time: '07:00' },
        npcSchedules: {
          npc1: { currentLocation: null }
        }
      };

      const originalCalendar = JSON.parse(JSON.stringify(calendar));
      npcScheduleTracker.updateAllNPCLocations(calendar);

      expect(calendar).toEqual(originalCalendar);
    });

    test('should initialize npcSchedules if not present', () => {
      const calendar = {
        current: { date: '0735-10-12', time: '07:00' }
      };

      const result = npcScheduleTracker.updateAllNPCLocations(calendar);

      expect(result.success).toBe(true);
      expect(result.calendar.npcSchedules).toBeDefined();
    });

    test('should reject invalid calendar', () => {
      const result = npcScheduleTracker.updateAllNPCLocations(null);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid calendar');
    });

    test('should reject calendar without current date/time', () => {
      const result = npcScheduleTracker.updateAllNPCLocations({ current: {} });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid calendar');
    });
  });

  // ========================================================================
  // getNPCsAtLocation() - NPCs-at-Location Query
  // ========================================================================

  describe('getNPCsAtLocation()', () => {
    beforeEach(() => {
      // Pre-populate cache
      npcScheduleTracker.scheduleCache.set('npc1', {
        npcId: 'npc1',
        locationId: 'home1',
        routine: [
          { timeStart: '06:00', timeEnd: '08:00', activity: 'Morning', locationId: 'chapel' }
        ],
        overrides: []
      });

      npcScheduleTracker.scheduleCache.set('npc2', {
        npcId: 'npc2',
        locationId: 'home2',
        routine: [
          { timeStart: '06:00', timeEnd: '08:00', activity: 'Morning', locationId: 'chapel' }
        ],
        overrides: []
      });

      npcScheduleTracker.scheduleCache.set('npc3', {
        npcId: 'npc3',
        locationId: 'home3',
        routine: [
          { timeStart: '06:00', timeEnd: '08:00', activity: 'Morning', locationId: 'tavern' }
        ],
        overrides: []
      });
    });

    test('should return NPCs at location at specified time', () => {
      const result = npcScheduleTracker.getNPCsAtLocation('chapel', '0735-10-12', '07:00');

      expect(result.success).toBe(true);
      expect(result.npcIds).toContain('npc1');
      expect(result.npcIds).toContain('npc2');
      expect(result.npcIds).not.toContain('npc3');
    });

    test('should return empty array when no NPCs at location', () => {
      const result = npcScheduleTracker.getNPCsAtLocation('empty_location', '0735-10-12', '07:00');

      expect(result.success).toBe(true);
      expect(result.npcIds).toHaveLength(0);
    });

    test('should include NPCs who remain at location after schedule', () => {
      const result = npcScheduleTracker.getNPCsAtLocation('chapel', '0735-10-12', '09:00');

      expect(result.success).toBe(true);
      // At 09:00, NPCs remain at chapel (last location after schedule ended at 08:00)
      // Per AC-3: "if no later entry exists, NPC remains at last known location"
      expect(result.npcIds).toHaveLength(2);
      expect(result.npcIds).toContain('npc1');
      expect(result.npcIds).toContain('npc2');
    });

    test('should reject invalid locationId', () => {
      const result = npcScheduleTracker.getNPCsAtLocation('', '0735-10-12', '07:00');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid locationId');
    });

    test('should reject invalid time format', () => {
      const result = npcScheduleTracker.getNPCsAtLocation('chapel', '0735-10-12', '25:00');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid time');
    });
  });

  // ========================================================================
  // advanceRecurringEventDate() - Recurring Event Date Advancement
  // ========================================================================

  describe('advanceRecurringEventDate()', () => {
    test('should advance daily recurring event by 1 day', () => {
      const event = {
        eventId: 'daily_event',
        triggerDate: '0735-10-12',
        triggerTime: '06:00',
        recurInterval: 'daily',
        status: 'pending'
      };

      const result = npcScheduleTracker.advanceRecurringEventDate(event, {});

      expect(result.success).toBe(true);
      expect(result.event.triggerDate).toBe('0735-10-13');
      expect(result.event.triggerTime).toBe('06:00'); // Time unchanged
    });

    test('should advance weekly recurring event by 7 days', () => {
      const event = {
        eventId: 'weekly_event',
        triggerDate: '0735-10-12',
        triggerTime: '06:00',
        recurInterval: 'weekly',
        status: 'pending'
      };

      const result = npcScheduleTracker.advanceRecurringEventDate(event, {});

      expect(result.success).toBe(true);
      expect(result.event.triggerDate).toBe('0735-10-19');
      expect(result.event.triggerTime).toBe('06:00');
    });

    test('should advance monthly recurring event by 1 month', () => {
      const event = {
        eventId: 'monthly_event',
        triggerDate: '0735-10-12',
        triggerTime: '06:00',
        recurInterval: 'monthly',
        status: 'pending'
      };

      const result = npcScheduleTracker.advanceRecurringEventDate(event, {});

      expect(result.success).toBe(true);
      expect(result.event.triggerDate).toBe('0735-11-12');
      expect(result.event.triggerTime).toBe('06:00');
    });

    test('should handle month-end edge case (Jan 31 -> Feb 28)', () => {
      const event = {
        eventId: 'monthly_event',
        triggerDate: '0735-01-31',
        triggerTime: '06:00',
        recurInterval: 'monthly',
        status: 'pending'
      };

      const result = npcScheduleTracker.advanceRecurringEventDate(event, {});

      expect(result.success).toBe(true);
      // date-fns handles month-end: Jan 31 + 1 month = Feb 28 (or 29 in leap year)
      // Year 735 is not a leap year, so Feb has 28 days
      expect(result.event.triggerDate).toBe('0735-02-28');
    });

    test('should handle year rollover', () => {
      const event = {
        eventId: 'daily_event',
        triggerDate: '0735-12-31',
        triggerTime: '23:59',
        recurInterval: 'daily',
        status: 'pending'
      };

      const result = npcScheduleTracker.advanceRecurringEventDate(event, {});

      expect(result.success).toBe(true);
      expect(result.event.triggerDate).toBe('0736-01-01');
    });

    test('should not mutate input event', () => {
      const event = {
        eventId: 'daily_event',
        triggerDate: '0735-10-12',
        triggerTime: '06:00',
        recurInterval: 'daily',
        status: 'pending'
      };

      const originalEvent = JSON.parse(JSON.stringify(event));
      npcScheduleTracker.advanceRecurringEventDate(event, {});

      expect(event).toEqual(originalEvent);
    });

    test('should reject invalid event', () => {
      const result = npcScheduleTracker.advanceRecurringEventDate(null, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid event');
    });

    test('should reject event without recurInterval', () => {
      const event = {
        eventId: 'event',
        triggerDate: '0735-10-12',
        triggerTime: '06:00'
      };

      const result = npcScheduleTracker.advanceRecurringEventDate(event, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('recurInterval');
    });

    test('should reject unsupported recurInterval', () => {
      const event = {
        eventId: 'event',
        triggerDate: '0735-10-12',
        triggerTime: '06:00',
        recurInterval: 'yearly'
      };

      const result = npcScheduleTracker.advanceRecurringEventDate(event, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported recurInterval');
    });
  });

  // ========================================================================
  // loadNPCSchedule() - Schedule Loading and Validation
  // ========================================================================

  describe('loadNPCSchedule()', () => {
    test('should return cached schedule if available', () => {
      const cachedSchedule = {
        npcId: 'cached_npc',
        locationId: 'home',
        routine: [],
        overrides: []
      };

      npcScheduleTracker.scheduleCache.set('cached_npc', cachedSchedule);

      const result = npcScheduleTracker.loadNPCSchedule('cached_npc');

      expect(result.success).toBe(true);
      expect(result.schedule).toEqual(cachedSchedule);
    });

    test('should return error if schedule not found (no locationId)', () => {
      const result = npcScheduleTracker.loadNPCSchedule('unknown_npc');

      expect(result.success).toBe(false);
      expect(result.error).toContain('locationId required');
    });

    test('should return error if NPC not found in NPCs.md', () => {
      const result = npcScheduleTracker.loadNPCSchedule('unknown_npc', 'test-location-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found in NPCs.md');
    });

    test('should reject invalid npcId', () => {
      const result = npcScheduleTracker.loadNPCSchedule('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid npcId');
    });

    test('should load schedule from real NPCs.md file', () => {
      // Create tracker with real LocationLoader (default basePath)
      const realTracker = new NPCScheduleTracker();

      const result = realTracker.loadNPCSchedule('aldric-the-innkeeper', 'test-location-1');

      expect(result.success).toBe(true);
      expect(result.schedule.npcId).toBe('aldric-the-innkeeper');
      expect(result.schedule.locationId).toBe('test-location-1');
      expect(result.schedule.routine).toBeInstanceOf(Array);
      expect(result.schedule.routine.length).toBeGreaterThan(0);

      // Verify schedule structure
      const firstEntry = result.schedule.routine[0];
      expect(firstEntry).toHaveProperty('timeStart');
      expect(firstEntry).toHaveProperty('timeEnd');
      expect(firstEntry).toHaveProperty('activity');
      expect(firstEntry).toHaveProperty('locationId');
      expect(firstEntry).toHaveProperty('activityDetails');
    });
  });
});
