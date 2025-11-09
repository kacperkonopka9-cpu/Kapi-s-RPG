/**
 * EventScheduler - Detects when scheduled events should trigger
 *
 * Provides pure event detection functions that integrate with CalendarManager and TimeManager:
 * - Detect events triggered between two timestamps (date/time-based)
 * - Support conditional triggering (location, NPC status, game flags)
 * - Handle recurring events (daily, weekly, monthly)
 * - Manage event status transitions
 * - Query upcoming events within lookahead window
 *
 * Key Features:
 * - Pure logic (no I/O, no side effects - EventExecutor handles effects)
 * - Uses TimeManager for timestamp calculations
 * - Graceful error handling (no exceptions thrown)
 * - Dependency injection for testability
 * - Immutability (does not mutate input calendar)
 * - Performance: < 50ms for checkTriggers() with 100 events, < 20ms for getUpcomingEvents()
 *
 * Pattern follows TimeManager and CalendarManager from Stories 2-1 and 2-2.
 *
 * @module EventScheduler
 */

const TimeManager = require('./time-manager');

/**
 * Valid event status values
 */
const VALID_STATUS_VALUES = ['pending', 'triggered', 'completed', 'failed'];

/**
 * Supported trigger condition types
 */
const TRIGGER_CONDITIONS = {
  PLAYER_ENTERS_LOCATION: 'player_enters_location',
  NPC_STATUS_CHANGED: 'npc_status_changed',
  GAME_FLAG_SET: 'game_flag_set',
  TIME_ELAPSED_SINCE: 'time_elapsed_since'
};

/**
 * Supported recurring intervals
 */
const RECUR_INTERVALS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
};

/**
 * Maximum events per calendar (performance limit)
 */
const MAX_EVENTS_PER_CALENDAR = 100;

/**
 * EventScheduler class handles event trigger detection
 */
class EventScheduler {
  /**
   * Creates a new EventScheduler instance
   *
   * @param {Object} deps - Dependencies for injection (testing)
   * @param {Object} deps.timeManager - TimeManager instance (for mocking in tests)
   */
  constructor(deps = {}) {
    this.timeManager = deps.timeManager || new TimeManager();
  }

  /**
   * Checks if an event's trigger conditions are met
   *
   * @param {Object} event - Scheduled event
   * @param {string} oldDate - Previous date (YYYY-MM-DD)
   * @param {string} oldTime - Previous time (HH:MM)
   * @param {string} newDate - Current date (YYYY-MM-DD)
   * @param {string} newTime - Current time (HH:MM)
   * @param {Object} context - Game context (location, flags, etc.)
   * @returns {boolean} True if event should trigger
   * @private
   */
  _shouldTriggerEvent(event, oldDate, oldTime, newDate, newTime, context) {
    // Skip events that are already completed or failed (unless recurring)
    if ((event.status === 'completed' || event.status === 'failed') && !event.recurring) {
      return false;
    }

    // Check location-based filtering first (if event has locationId)
    if (event.locationId !== null && event.locationId !== undefined) {
      // Location-specific event
      if (!context || !context.currentLocation || context.currentLocation !== event.locationId) {
        return false; // Player not at required location
      }
    }
    // If locationId is null/undefined, event is global and triggers regardless of location

    // Check date/time-based trigger
    let dateTimeTriggered = false;
    const hasDateTimeTrigger = event.triggerDate && event.triggerTime;

    if (hasDateTimeTrigger) {
      // Calculate if event.triggerDate/triggerTime falls between oldTime and newTime
      const eventTimestamp = this.timeManager.calculateElapsed(
        oldDate,
        oldTime,
        event.triggerDate,
        event.triggerTime
      );

      const timeRange = this.timeManager.calculateElapsed(
        oldDate,
        oldTime,
        newDate,
        newTime
      );

      if (eventTimestamp.success && timeRange.success) {
        // Event triggers if its timestamp is between old and new (0 <= minutes <= range)
        dateTimeTriggered = eventTimestamp.minutes >= 0 && eventTimestamp.minutes <= timeRange.minutes;
      }
    }

    // Check conditional trigger
    let conditionalTriggered = false;
    const hasConditionalTrigger = event.triggerCondition;

    if (hasConditionalTrigger) {
      conditionalTriggered = this._evaluateCondition(event, context);
    }

    // Event triggers if either date/time OR conditional is true (OR logic)
    // If both are specified, either can trigger the event
    if (hasDateTimeTrigger && hasConditionalTrigger) {
      return dateTimeTriggered || conditionalTriggered;
    } else if (hasDateTimeTrigger) {
      return dateTimeTriggered;
    } else if (hasConditionalTrigger) {
      return conditionalTriggered;
    }

    return false;
  }

  /**
   * Evaluates a conditional trigger
   *
   * @param {Object} event - Scheduled event
   * @param {Object} context - Game context
   * @returns {boolean} True if condition is met
   * @private
   */
  _evaluateCondition(event, context) {
    if (!event.triggerCondition || !context) {
      return false;
    }

    const condition = event.triggerCondition.toLowerCase().trim();
    const params = event.conditionParams || {};

    try {
      switch (condition) {
        case TRIGGER_CONDITIONS.PLAYER_ENTERS_LOCATION:
          // Triggered when player enters specific location
          // Check if currentLocation matches AND previousLocation is different
          if (params.locationId && context.currentLocation === params.locationId) {
            // Only trigger if this is a NEW entry (previousLocation was different)
            if (context.previousLocation && context.previousLocation !== params.locationId) {
              return true;
            }
          }
          return false;

        case TRIGGER_CONDITIONS.NPC_STATUS_CHANGED:
          // Triggered when NPC status flag changes
          if (params.npcId && params.statusFlag && context.npcStatuses) {
            const npcStatus = context.npcStatuses[params.npcId];
            if (npcStatus && npcStatus[params.statusFlag] === params.expectedValue) {
              return true;
            }
          }
          return false;

        case TRIGGER_CONDITIONS.GAME_FLAG_SET:
          // Triggered when specific game flag becomes true
          if (params.flagName && context.gameFlags) {
            return context.gameFlags[params.flagName] === true;
          }
          return false;

        case TRIGGER_CONDITIONS.TIME_ELAPSED_SINCE:
          // Triggered after N hours since reference timestamp
          if (params.referenceDate && params.referenceTime && params.elapsedHours) {
            const elapsed = this.timeManager.calculateElapsed(
              params.referenceDate,
              params.referenceTime,
              context.currentDate || '',
              context.currentTime || ''
            );

            if (elapsed.success) {
              const requiredMinutes = params.elapsedHours * 60;
              return elapsed.minutes >= requiredMinutes;
            }
          }
          return false;

        default:
          // Unknown condition type - return false (graceful degradation)
          return false;
      }
    } catch (error) {
      // Gracefully handle missing context fields
      return false;
    }
  }

  /**
   * Sorts events by priority (descending) and then chronologically
   *
   * @param {Array} events - Events to sort
   * @returns {Array} Sorted events
   * @private
   */
  _sortEventsByPriority(events) {
    return events.sort((a, b) => {
      // First sort by priority (higher priority first)
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;

      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Descending priority
      }

      // If same priority, sort by trigger date/time (earlier first)
      if (a.triggerDate && b.triggerDate) {
        if (a.triggerDate !== b.triggerDate) {
          return a.triggerDate.localeCompare(b.triggerDate);
        }
        // Same date, compare times
        if (a.triggerTime && b.triggerTime) {
          return a.triggerTime.localeCompare(b.triggerTime);
        }
      }

      // If no date/time or same timestamp, maintain original array order
      return 0;
    });
  }

  /**
   * Checks for events triggered between two timestamps
   *
   * @param {Object} calendar - Calendar object from CalendarManager
   * @param {string} oldDate - Previous date (YYYY-MM-DD)
   * @param {string} oldTime - Previous time (HH:MM)
   * @param {string} newDate - Current date (YYYY-MM-DD)
   * @param {string} newTime - Current time (HH:MM)
   * @param {Object} context - Game context (location, flags, etc.)
   * @returns {Object} {success: boolean, triggeredEvents?: Array, calendar?: Object, error?: string}
   */
  checkTriggers(calendar, oldDate, oldTime, newDate, newTime, context = {}) {
    // Validate inputs
    if (!calendar || typeof calendar !== 'object') {
      return {
        success: false,
        error: 'Invalid calendar object'
      };
    }

    if (!calendar.events || !Array.isArray(calendar.events)) {
      return {
        success: false,
        error: 'Calendar missing events array'
      };
    }

    if (typeof oldDate !== 'string' || typeof oldTime !== 'string' ||
        typeof newDate !== 'string' || typeof newTime !== 'string') {
      return {
        success: false,
        error: 'Invalid date/time parameters - must be strings'
      };
    }

    // Warn if too many events (performance concern)
    if (calendar.events.length > MAX_EVENTS_PER_CALENDAR) {
      console.warn(`Calendar has ${calendar.events.length} events (max recommended: ${MAX_EVENTS_PER_CALENDAR}). Performance may degrade.`);
    }

    try {
      // Filter events that should trigger
      const triggeredEvents = [];

      for (const event of calendar.events) {
        if (this._shouldTriggerEvent(event, oldDate, oldTime, newDate, newTime, context)) {
          triggeredEvents.push(event);
        }
      }

      // Sort triggered events by priority and chronological order
      const sortedEvents = this._sortEventsByPriority(triggeredEvents);

      // Create new calendar with updated event statuses (immutability)
      const newCalendar = JSON.parse(JSON.stringify(calendar)); // Deep clone

      // Update status of triggered events to "triggered" (if they were pending)
      // BUT: Recurring events maintain "pending" status for next occurrence
      for (const triggeredEvent of sortedEvents) {
        const eventIndex = newCalendar.events.findIndex(e => e.eventId === triggeredEvent.eventId);
        if (eventIndex !== -1) {
          const currentStatus = newCalendar.events[eventIndex].status;
          const isRecurring = newCalendar.events[eventIndex].recurring;

          // Only update status if currently pending (don't change completed/failed)
          // AND not recurring (recurring events stay pending for next occurrence)
          if (currentStatus === 'pending' && !isRecurring) {
            newCalendar.events[eventIndex].status = 'triggered';
          }
          // Recurring events remain "pending" for next trigger
        }
      }

      return {
        success: true,
        triggeredEvents: sortedEvents,
        calendar: newCalendar
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to check triggers: ${error.message}`
      };
    }
  }

  /**
   * Adds a new event to calendar
   *
   * @param {Object} calendar - Calendar object
   * @param {Object} event - Scheduled event to add
   * @returns {Object} {success: boolean, calendar?: Object, error?: string}
   */
  addEvent(calendar, event) {
    // Validate inputs
    if (!calendar || typeof calendar !== 'object') {
      return {
        success: false,
        error: 'Invalid calendar object'
      };
    }

    if (!calendar.events || !Array.isArray(calendar.events)) {
      return {
        success: false,
        error: 'Calendar missing events array'
      };
    }

    if (!event || typeof event !== 'object') {
      return {
        success: false,
        error: 'Invalid event object'
      };
    }

    // Validate required fields
    if (!event.eventId || typeof event.eventId !== 'string') {
      return {
        success: false,
        error: 'Event missing required field: eventId (must be string)'
      };
    }

    if (!event.name || typeof event.name !== 'string') {
      return {
        success: false,
        error: 'Event missing required field: name (must be string)'
      };
    }

    if (!event.status || !VALID_STATUS_VALUES.includes(event.status)) {
      return {
        success: false,
        error: `Event missing or invalid status. Must be one of: ${VALID_STATUS_VALUES.join(', ')}`
      };
    }

    // Check for duplicate eventId
    if (calendar.events.find(e => e.eventId === event.eventId)) {
      return {
        success: false,
        error: `Event with eventId "${event.eventId}" already exists`
      };
    }

    try {
      // Create new calendar with event added (immutability)
      const newCalendar = JSON.parse(JSON.stringify(calendar)); // Deep clone
      newCalendar.events.push(event);

      return {
        success: true,
        calendar: newCalendar
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add event: ${error.message}`
      };
    }
  }

  /**
   * Updates event status
   *
   * @param {Object} calendar - Calendar object
   * @param {string} eventId - Event ID to update
   * @param {string} status - New status value
   * @returns {Object} {success: boolean, calendar?: Object, error?: string}
   */
  updateEventStatus(calendar, eventId, status) {
    // Validate inputs
    if (!calendar || typeof calendar !== 'object') {
      return {
        success: false,
        error: 'Invalid calendar object'
      };
    }

    if (!calendar.events || !Array.isArray(calendar.events)) {
      return {
        success: false,
        error: 'Calendar missing events array'
      };
    }

    if (!eventId || typeof eventId !== 'string') {
      return {
        success: false,
        error: 'Invalid eventId - must be non-empty string'
      };
    }

    if (!status || !VALID_STATUS_VALUES.includes(status)) {
      return {
        success: false,
        error: `Invalid status. Must be one of: ${VALID_STATUS_VALUES.join(', ')}`
      };
    }

    // Find event
    const eventIndex = calendar.events.findIndex(e => e.eventId === eventId);
    if (eventIndex === -1) {
      return {
        success: false,
        error: `Event with eventId "${eventId}" not found`
      };
    }

    try {
      // Create new calendar with updated status (immutability)
      const newCalendar = JSON.parse(JSON.stringify(calendar)); // Deep clone
      newCalendar.events[eventIndex].status = status;

      return {
        success: true,
        calendar: newCalendar
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update event status: ${error.message}`
      };
    }
  }

  /**
   * Removes an event from calendar
   *
   * @param {Object} calendar - Calendar object
   * @param {string} eventId - Event ID to remove
   * @returns {Object} {success: boolean, calendar?: Object, error?: string}
   */
  removeEvent(calendar, eventId) {
    // Validate inputs
    if (!calendar || typeof calendar !== 'object') {
      return {
        success: false,
        error: 'Invalid calendar object'
      };
    }

    if (!calendar.events || !Array.isArray(calendar.events)) {
      return {
        success: false,
        error: 'Calendar missing events array'
      };
    }

    if (!eventId || typeof eventId !== 'string') {
      return {
        success: false,
        error: 'Invalid eventId - must be non-empty string'
      };
    }

    // Find event
    const eventIndex = calendar.events.findIndex(e => e.eventId === eventId);
    if (eventIndex === -1) {
      return {
        success: false,
        error: `Event with eventId "${eventId}" not found`
      };
    }

    try {
      // Create new calendar with event removed (immutability)
      const newCalendar = JSON.parse(JSON.stringify(calendar)); // Deep clone
      newCalendar.events.splice(eventIndex, 1);

      return {
        success: true,
        calendar: newCalendar
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to remove event: ${error.message}`
      };
    }
  }

  /**
   * Gets events scheduled within lookahead window
   *
   * @param {Object} calendar - Calendar object
   * @param {number} lookaheadMinutes - Minutes to look ahead
   * @returns {Object} {success: boolean, events?: Array, error?: string}
   */
  getUpcomingEvents(calendar, lookaheadMinutes) {
    // Validate inputs
    if (!calendar || typeof calendar !== 'object') {
      return {
        success: false,
        error: 'Invalid calendar object'
      };
    }

    if (!calendar.events || !Array.isArray(calendar.events)) {
      return {
        success: false,
        error: 'Calendar missing events array'
      };
    }

    if (!calendar.current || !calendar.current.date || !calendar.current.time) {
      return {
        success: false,
        error: 'Calendar missing current.date or current.time'
      };
    }

    if (typeof lookaheadMinutes !== 'number' || lookaheadMinutes <= 0) {
      return {
        success: false,
        error: 'Invalid lookaheadMinutes - must be positive number'
      };
    }

    try {
      // Calculate future timestamp
      const futureResult = this.timeManager.addMinutes(
        calendar.current.date,
        calendar.current.time,
        lookaheadMinutes
      );

      if (!futureResult.success) {
        return {
          success: false,
          error: `Failed to calculate lookahead timestamp: ${futureResult.error}`
        };
      }

      const futureDate = futureResult.date;
      const futureTime = futureResult.time;

      // Filter events that:
      // 1. Have triggerDate and triggerTime
      // 2. Are scheduled before futureDate/futureTime
      // 3. Have status "pending"
      const upcomingEvents = calendar.events.filter(event => {
        // Must have date/time trigger
        if (!event.triggerDate || !event.triggerTime) {
          return false;
        }

        // Must be pending
        if (event.status !== 'pending') {
          return false;
        }

        // Check if event is before future timestamp
        const elapsed = this.timeManager.calculateElapsed(
          calendar.current.date,
          calendar.current.time,
          event.triggerDate,
          event.triggerTime
        );

        if (elapsed.success) {
          // Event is upcoming if it's in the future (elapsed > 0) and within lookahead window
          return elapsed.minutes > 0 && elapsed.minutes <= lookaheadMinutes;
        }

        return false;
      });

      // Sort chronologically (earliest first)
      upcomingEvents.sort((a, b) => {
        if (a.triggerDate !== b.triggerDate) {
          return a.triggerDate.localeCompare(b.triggerDate);
        }
        return a.triggerTime.localeCompare(b.triggerTime);
      });

      return {
        success: true,
        events: upcomingEvents
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get upcoming events: ${error.message}`
      };
    }
  }
}

module.exports = EventScheduler;
module.exports.TRIGGER_CONDITIONS = TRIGGER_CONDITIONS;
module.exports.RECUR_INTERVALS = RECUR_INTERVALS;
module.exports.VALID_STATUS_VALUES = VALID_STATUS_VALUES;
