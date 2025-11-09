/**
 * NPC Schedule Tracker
 *
 * Tracks NPC locations and activities based on time-of-day schedules.
 * Loads NPC schedules from game-data/locations/{locationId}/NPCs.md files.
 * Supports schedule overrides based on game state conditions.
 * Updates all NPC positions when time advances.
 *
 * Performance targets:
 * - updateAllNPCLocations: < 200ms for 50 NPCs
 * - getNPCLocation: < 10ms per NPC
 * - getNPCsAtLocation: < 50ms
 *
 * Related: Epic 2 Story 2.4
 */

const TimeManager = require('./time-manager');
const { LocationLoader } = require('../data/location-loader');
const { addDays, addMonths } = require('date-fns');
const yaml = require('js-yaml');
const path = require('path');

/**
 * Valid schedule entry time format: HH:MM (00:00 to 23:59)
 */
const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Valid recurring event intervals
 */
const RECUR_INTERVALS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
};

/**
 * NPCScheduleTracker - Manages NPC schedule tracking and location updates
 *
 * Dependency Injection Pattern:
 * - Accepts {timeManager, locationLoader} in constructor for testability
 * - Defaults to real instances if not provided
 *
 * Immutability Pattern:
 * - Never mutates input objects (calendar, schedules)
 * - Returns new objects with updates applied
 *
 * Error Handling Pattern:
 * - All methods return {success, data, error} objects
 * - Never throws exceptions
 * - Validates inputs early (fail fast)
 */
class NPCScheduleTracker {
  /**
   * Create NPC Schedule Tracker
   * @param {Object} deps - Dependencies for injection
   * @param {TimeManager} deps.timeManager - Time calculation service
   * @param {LocationLoader} deps.locationLoader - Location file loader
   */
  constructor(deps = {}) {
    this.timeManager = deps.timeManager || new TimeManager();
    this.locationLoader = deps.locationLoader || new LocationLoader();

    // Cache for loaded NPC schedules (in-memory only, not persisted)
    this.scheduleCache = new Map();
  }

  /**
   * Load NPC's schedule from NPCs.md file in their home location
   * @param {string} npcId - NPC identifier (e.g., "aldric-the-innkeeper")
   * @param {string} locationId - Home location ID (e.g., "test-location-1")
   * @returns {Object} {success, schedule: {npcId, locationId, routine[], overrides[]}, error}
   */
  loadNPCSchedule(npcId, locationId = null) {
    // Input validation
    if (!npcId || typeof npcId !== 'string') {
      return {
        success: false,
        error: 'Invalid npcId: must be non-empty string'
      };
    }

    // Check cache first
    if (this.scheduleCache.has(npcId)) {
      return {
        success: true,
        schedule: this.scheduleCache.get(npcId)
      };
    }

    // If no locationId provided, cannot load from file
    if (!locationId) {
      return {
        success: false,
        error: `Cannot load schedule for ${npcId}: locationId required`
      };
    }

    try {
      // Build path to NPCs.md file
      const npcsFilePath = path.join(
        this.locationLoader.basePath,
        locationId,
        'NPCs.md'
      );

      // Read file content using LocationLoader's file system access
      const fs = require('fs');
      if (!fs.existsSync(npcsFilePath)) {
        return {
          success: false,
          error: `NPCs.md not found in location: ${locationId}`
        };
      }

      const content = fs.readFileSync(npcsFilePath, 'utf-8');

      // Parse NPC schedule from content
      const scheduleResult = this._parseNPCScheduleFromContent(content, npcId, locationId);

      if (!scheduleResult.success) {
        return scheduleResult;
      }

      // Validate schedule structure
      const validateResult = this._validateSchedule(scheduleResult.schedule);
      if (!validateResult.success) {
        return {
          success: false,
          error: `Invalid schedule for ${npcId}: ${validateResult.error}`
        };
      }

      // Cache the schedule
      this.scheduleCache.set(npcId, scheduleResult.schedule);

      return {
        success: true,
        schedule: scheduleResult.schedule
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to load schedule for ${npcId}: ${error.message}`
      };
    }
  }

  /**
   * Parse NPC schedule from NPCs.md file content
   * @private
   * @param {string} content - NPCs.md file content
   * @param {string} npcId - NPC identifier to find
   * @param {string} locationId - Home location ID
   * @returns {Object} {success, schedule, error}
   */
  _parseNPCScheduleFromContent(content, npcId, locationId) {
    try {
      // Split content by ## headers to find NPC sections
      const npcSections = content.split(/^## /gm).filter(s => s.trim());

      let targetSection = null;

      // Find the NPC section matching the npcId
      for (const section of npcSections) {
        const lines = section.split('\n');
        const name = lines[0].trim();

        if (!name || name.startsWith('#')) continue;

        // Generate ID from name to match
        const generatedId = this._generateId(name);

        if (generatedId === npcId) {
          targetSection = section;
          break;
        }
      }

      if (!targetSection) {
        return {
          success: false,
          error: `NPC ${npcId} not found in NPCs.md`
        };
      }

      // Extract Daily Schedule YAML block
      const scheduleMatch = targetSection.match(/###\s+Daily Schedule\s*\n```yaml\s*\n([\s\S]*?)\n```/i);

      let routine = [];
      if (scheduleMatch) {
        try {
          routine = yaml.load(scheduleMatch[1]) || [];
        } catch (yamlError) {
          return {
            success: false,
            error: `Failed to parse Daily Schedule YAML: ${yamlError.message}`
          };
        }
      }

      // Extract Schedule Overrides YAML block
      const overridesMatch = targetSection.match(/###\s+Schedule Overrides\s*\n```yaml\s*\n([\s\S]*?)\n```/i);

      let overrides = [];
      if (overridesMatch) {
        try {
          overrides = yaml.load(overridesMatch[1]) || [];
        } catch (yamlError) {
          return {
            success: false,
            error: `Failed to parse Schedule Overrides YAML: ${yamlError.message}`
          };
        }
      }

      // Build schedule object
      const schedule = {
        npcId,
        locationId,
        routine,
        overrides
      };

      return {
        success: true,
        schedule
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to parse NPC schedule: ${error.message}`
      };
    }
  }

  /**
   * Generate lowercase-kebab-case ID from name
   * @private
   * @param {string} name - Name to convert
   * @returns {string} Generated ID
   */
  _generateId(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Get NPC's current location and activity based on time
   * @param {string} npcId - NPC identifier
   * @param {string} currentDate - Current date (YYYY-MM-DD or 0YYYY-MM-DD)
   * @param {string} currentTime - Current time (HH:MM)
   * @param {Object} gameState - Current game state flags for schedule overrides
   * @returns {Object} {success, location, activity, activityDetails, error}
   */
  getNPCLocation(npcId, currentDate, currentTime, gameState = {}) {
    // Input validation
    if (!npcId || typeof npcId !== 'string') {
      return {
        success: false,
        error: 'Invalid npcId: must be non-empty string'
      };
    }

    if (!currentDate || typeof currentDate !== 'string') {
      return {
        success: false,
        error: 'Invalid currentDate: must be non-empty string'
      };
    }

    if (!currentTime || !TIME_FORMAT_REGEX.test(currentTime)) {
      return {
        success: false,
        error: 'Invalid currentTime: must be HH:MM format (00:00 to 23:59)'
      };
    }

    // Load NPC schedule
    const scheduleResult = this.loadNPCSchedule(npcId);
    if (!scheduleResult.success) {
      return {
        success: false,
        error: `Cannot get NPC location: ${scheduleResult.error}`
      };
    }

    const schedule = scheduleResult.schedule;

    // Get effective routine (base or override)
    const routineResult = this.evaluateScheduleOverrides(schedule, gameState);
    if (!routineResult.success) {
      return {
        success: false,
        error: `Failed to evaluate schedule overrides: ${routineResult.error}`
      };
    }

    const routine = routineResult.routine;

    // Find matching schedule entry for current time
    const matchingEntry = this._findMatchingScheduleEntry(routine, currentTime);

    if (matchingEntry) {
      return {
        success: true,
        location: matchingEntry.locationId,
        activity: matchingEntry.activity,
        activityDetails: matchingEntry.activityDetails || matchingEntry.activity
      };
    }

    // Handle edge cases: time before first entry, after last entry, or in gaps
    if (routine.length === 0) {
      // No routine entries - NPC at home location
      return {
        success: true,
        location: schedule.locationId,
        activity: 'At home',
        activityDetails: 'NPC has no scheduled activities'
      };
    }

    // Sort routine by time to find first and last entries
    const sortedRoutine = [...routine].sort((a, b) => {
      return a.timeStart.localeCompare(b.timeStart);
    });

    // If before first entry, NPC at home location
    if (currentTime < sortedRoutine[0].timeStart) {
      return {
        success: true,
        location: schedule.locationId,
        activity: 'At home',
        activityDetails: `Before scheduled activities (first entry at ${sortedRoutine[0].timeStart})`
      };
    }

    // Check if after last entry's timeEnd
    const lastEntry = sortedRoutine[sortedRoutine.length - 1];
    if (currentTime >= lastEntry.timeEnd) {
      // After all scheduled activities - NPC remains at last location
      return {
        success: true,
        location: lastEntry.locationId,
        activity: lastEntry.activity,
        activityDetails: lastEntry.activityDetails || `${lastEntry.activity} (schedule ended at ${lastEntry.timeEnd})`
      };
    }

    // If we're here, time is between schedule entries (in a gap)
    // Return home location for gap periods
    return {
      success: true,
      location: schedule.locationId,
      activity: 'At home',
      activityDetails: 'Between scheduled activities'
    };
  }

  /**
   * Find schedule entry matching current time
   * @private
   * @param {Array} routine - Array of ScheduleEntry objects
   * @param {string} currentTime - Current time (HH:MM)
   * @returns {Object|null} Matching ScheduleEntry or null
   */
  _findMatchingScheduleEntry(routine, currentTime) {
    for (const entry of routine) {
      // Check if currentTime falls within timeStart <= current < timeEnd
      if (currentTime >= entry.timeStart && currentTime < entry.timeEnd) {
        return entry;
      }
    }
    return null;
  }

  /**
   * Apply conditional overrides to NPC routine
   * @param {Object} npcSchedule - NPC schedule with routine and overrides
   * @param {Object} gameState - Current game state flags
   * @returns {Object} {success, routine: Array<ScheduleEntry>, error}
   */
  evaluateScheduleOverrides(npcSchedule, gameState = {}) {
    // Input validation
    if (!npcSchedule || typeof npcSchedule !== 'object') {
      return {
        success: false,
        error: 'Invalid npcSchedule: must be object'
      };
    }

    if (!npcSchedule.routine || !Array.isArray(npcSchedule.routine)) {
      return {
        success: false,
        error: 'Invalid npcSchedule: routine must be array'
      };
    }

    // If no overrides, return base routine
    if (!npcSchedule.overrides || npcSchedule.overrides.length === 0) {
      return {
        success: true,
        routine: npcSchedule.routine
      };
    }

    // Evaluate overrides in order (first match wins)
    for (const override of npcSchedule.overrides) {
      try {
        // Evaluate condition against game state
        const conditionMet = this._evaluateCondition(override.condition, gameState);

        if (conditionMet) {
          // Override condition met - replace routine completely
          return {
            success: true,
            routine: override.newRoutine || []
          };
        }
      } catch (error) {
        // Gracefully handle condition evaluation errors
        // Continue to next override
        continue;
      }
    }

    // No override conditions met - return base routine
    return {
      success: true,
      routine: npcSchedule.routine
    };
  }

  /**
   * Evaluate override condition against game state
   * @private
   * @param {string} condition - Condition flag name (e.g., "burgomaster_dead")
   * @param {Object} gameState - Game state flags
   * @returns {boolean} True if condition met
   */
  _evaluateCondition(condition, gameState) {
    // Simple boolean condition only (check single game state flag)
    // Complex boolean logic (AND/OR) deferred to future story

    if (!condition || typeof condition !== 'string') {
      return false;
    }

    if (!gameState || typeof gameState !== 'object') {
      return false;
    }

    // Check if flag exists and is true
    return gameState[condition] === true;
  }

  /**
   * Update all NPC locations for current calendar time
   * @param {Object} calendar - Calendar object with current date/time
   * @returns {Object} {success, updates: Array<NPCLocationUpdate>, calendar, error}
   */
  updateAllNPCLocations(calendar) {
    // Input validation
    if (!calendar || typeof calendar !== 'object') {
      return {
        success: false,
        error: 'Invalid calendar: must be object'
      };
    }

    if (!calendar.current || !calendar.current.date || !calendar.current.time) {
      return {
        success: false,
        error: 'Invalid calendar: must have current.date and current.time'
      };
    }

    // Deep clone calendar for immutability
    const newCalendar = JSON.parse(JSON.stringify(calendar));

    // Initialize npcSchedules if not present
    if (!newCalendar.npcSchedules) {
      newCalendar.npcSchedules = {};
    }

    const updates = [];
    const currentDate = calendar.current.date;
    const currentTime = calendar.current.time;
    const gameState = calendar.gameState || {};

    // Get list of NPCs to update
    // For now, update NPCs already in calendar.npcSchedules
    // In future, could load all NPCs from location files
    const npcIds = Object.keys(newCalendar.npcSchedules);

    for (const npcId of npcIds) {
      const oldLocation = newCalendar.npcSchedules[npcId].currentLocation || null;

      // Get current location for this NPC
      const locationResult = this.getNPCLocation(npcId, currentDate, currentTime, gameState);

      if (locationResult.success) {
        const newLocation = locationResult.location;
        const activity = locationResult.activity;

        // Update NPC location in calendar
        newCalendar.npcSchedules[npcId].currentLocation = newLocation;
        newCalendar.npcSchedules[npcId].currentActivity = activity;

        // Record update
        updates.push({
          npcId,
          oldLocation,
          newLocation,
          activity
        });
      }
    }

    return {
      success: true,
      updates,
      calendar: newCalendar
    };
  }

  /**
   * Get all NPCs present at location at specific time
   * @param {string} locationId - Location identifier
   * @param {string} date - Date (YYYY-MM-DD or 0YYYY-MM-DD)
   * @param {string} time - Time (HH:MM)
   * @param {Object} gameState - Current game state flags for schedule overrides
   * @returns {Object} {success, npcIds: Array<string>, error}
   */
  getNPCsAtLocation(locationId, date, time, gameState = {}) {
    // Input validation
    if (!locationId || typeof locationId !== 'string') {
      return {
        success: false,
        error: 'Invalid locationId: must be non-empty string'
      };
    }

    if (!date || typeof date !== 'string') {
      return {
        success: false,
        error: 'Invalid date: must be non-empty string'
      };
    }

    if (!time || !TIME_FORMAT_REGEX.test(time)) {
      return {
        success: false,
        error: 'Invalid time: must be HH:MM format (00:00 to 23:59)'
      };
    }

    const npcIds = [];

    // Get all loaded NPCs from cache
    // In future, could load all NPCs from location files
    for (const [npcId, schedule] of this.scheduleCache.entries()) {
      const locationResult = this.getNPCLocation(npcId, date, time, gameState);

      if (locationResult.success && locationResult.location === locationId) {
        npcIds.push(npcId);
      }
    }

    return {
      success: true,
      npcIds
    };
  }

  /**
   * Calculate next occurrence date for recurring event
   * @param {Object} event - Event object with recurInterval
   * @param {Object} calendar - Calendar object (for current date context)
   * @returns {Object} {success, event (with updated triggerDate), error}
   */
  advanceRecurringEventDate(event, calendar) {
    // Input validation
    if (!event || typeof event !== 'object') {
      return {
        success: false,
        error: 'Invalid event: must be object'
      };
    }

    if (!event.eventId || !event.triggerDate || !event.triggerTime) {
      return {
        success: false,
        error: 'Invalid event: must have eventId, triggerDate, and triggerTime'
      };
    }

    if (!event.recurInterval) {
      return {
        success: false,
        error: 'Invalid event: must have recurInterval for recurring events'
      };
    }

    // Deep clone event for immutability
    const newEvent = JSON.parse(JSON.stringify(event));

    // Parse trigger date
    const triggerDateParts = newEvent.triggerDate.match(/^0?(\d{1,4})-(\d{2})-(\d{2})$/);
    if (!triggerDateParts) {
      return {
        success: false,
        error: `Invalid triggerDate format: ${newEvent.triggerDate}`
      };
    }

    const year = parseInt(triggerDateParts[1], 10);
    const month = parseInt(triggerDateParts[2], 10) - 1; // JavaScript months are 0-indexed
    const day = parseInt(triggerDateParts[3], 10);

    // Create Date object
    let currentDate = new Date(year, month, day);

    // Calculate next occurrence based on interval
    switch (event.recurInterval.toLowerCase()) {
      case RECUR_INTERVALS.DAILY:
        // Add 1 day
        currentDate = addDays(currentDate, 1);
        break;

      case RECUR_INTERVALS.WEEKLY:
        // Add 7 days
        currentDate = addDays(currentDate, 7);
        break;

      case RECUR_INTERVALS.MONTHLY:
        // Add 1 month (date-fns handles month-end edge cases)
        currentDate = addMonths(currentDate, 1);
        break;

      default:
        return {
          success: false,
          error: `Unsupported recurInterval: ${event.recurInterval}. Must be daily, weekly, or monthly.`
        };
    }

    // Format new date back to YYYY-MM-DD (with leading zero if year < 1000)
    const newYear = currentDate.getFullYear();
    const newMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    const newDay = String(currentDate.getDate()).padStart(2, '0');

    // Maintain leading zero format if original had it
    const hasLeadingZero = newEvent.triggerDate.startsWith('0');
    newEvent.triggerDate = hasLeadingZero
      ? `0${newYear}-${newMonth}-${newDay}`
      : `${newYear}-${newMonth}-${newDay}`;

    // triggerTime remains unchanged
    // status remains "pending" (ready for next trigger)

    return {
      success: true,
      event: newEvent
    };
  }

  /**
   * Validate schedule structure
   * @private
   * @param {Object} schedule - NPC schedule to validate
   * @returns {Object} {success, error}
   */
  _validateSchedule(schedule) {
    if (!schedule || typeof schedule !== 'object') {
      return {
        success: false,
        error: 'Schedule must be object'
      };
    }

    if (!schedule.npcId || typeof schedule.npcId !== 'string') {
      return {
        success: false,
        error: 'Schedule must have npcId (string)'
      };
    }

    if (!schedule.locationId || typeof schedule.locationId !== 'string') {
      return {
        success: false,
        error: 'Schedule must have locationId (string)'
      };
    }

    if (!schedule.routine || !Array.isArray(schedule.routine)) {
      return {
        success: false,
        error: 'Schedule must have routine (array)'
      };
    }

    // Validate each routine entry
    for (let i = 0; i < schedule.routine.length; i++) {
      const entry = schedule.routine[i];

      if (!entry.timeStart || !TIME_FORMAT_REGEX.test(entry.timeStart)) {
        return {
          success: false,
          error: `Routine entry ${i}: timeStart must be HH:MM format`
        };
      }

      if (!entry.timeEnd || !TIME_FORMAT_REGEX.test(entry.timeEnd)) {
        return {
          success: false,
          error: `Routine entry ${i}: timeEnd must be HH:MM format`
        };
      }

      // timeStart must be < timeEnd (no overnight entries)
      if (entry.timeStart >= entry.timeEnd) {
        return {
          success: false,
          error: `Routine entry ${i}: timeStart (${entry.timeStart}) must be < timeEnd (${entry.timeEnd})`
        };
      }

      if (!entry.activity || typeof entry.activity !== 'string') {
        return {
          success: false,
          error: `Routine entry ${i}: activity must be string`
        };
      }

      if (!entry.locationId || typeof entry.locationId !== 'string') {
        return {
          success: false,
          error: `Routine entry ${i}: locationId must be string`
        };
      }
    }

    // Validate overrides if present
    if (schedule.overrides) {
      if (!Array.isArray(schedule.overrides)) {
        return {
          success: false,
          error: 'Overrides must be array if present'
        };
      }

      for (let i = 0; i < schedule.overrides.length; i++) {
        const override = schedule.overrides[i];

        if (!override.condition || typeof override.condition !== 'string') {
          return {
            success: false,
            error: `Override ${i}: condition must be string`
          };
        }

        if (!override.newRoutine || !Array.isArray(override.newRoutine)) {
          return {
            success: false,
            error: `Override ${i}: newRoutine must be array`
          };
        }
      }
    }

    return {
      success: true
    };
  }
}

module.exports = NPCScheduleTracker;
