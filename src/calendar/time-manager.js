/**
 * TimeManager - Handles time advancement calculations for game calendar
 *
 * Provides pure time calculation functions that integrate with CalendarManager:
 * - Advance time by minutes (handle date/time rollover)
 * - Calculate elapsed time between timestamps
 * - Parse duration strings ("2 hours", "30 minutes", "1 day")
 * - Get action durations for automatic time advancement
 * - Format timestamps for display
 *
 * Key Features:
 * - Pure functions (no I/O, no side effects)
 * - Uses date-fns for date arithmetic (handles leap years, month lengths)
 * - Graceful error handling (no exceptions thrown)
 * - Dependency injection for testability
 * - Immutability (does not mutate input objects)
 * - Performance: < 50ms for advanceTime(), < 10ms for calculateElapsed()
 *
 * Pattern follows CalendarManager from Story 2-1.
 *
 * @module TimeManager
 */

const {
  add,
  differenceInMinutes,
  parse,
  format,
  isValid
} = require('date-fns');

/**
 * Allowed values for enum fields (same as CalendarManager)
 */
const VALID_SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const VALID_DAYS_OF_WEEK = ['Moonday', 'Toilday', 'Wealday', 'Oathday', 'Fireday', 'Starday', 'Sunday'];

/**
 * Action type constants for automatic time advancement
 */
const ACTION_TYPES = {
  TRAVEL: 'travel',
  SEARCH: 'search',
  DIALOGUE: 'dialogue',
  SHORT_REST: 'short_rest',
  LONG_REST: 'long_rest',
  COMBAT: 'combat' // Epic 3, returns 0 for now
};

/**
 * Maximum duration for single time advancement (1 week in minutes)
 */
const MAX_DURATION_MINUTES = 10080; // 7 days * 24 hours * 60 minutes

/**
 * TimeManager class handles time calculations
 */
class TimeManager {
  /**
   * Creates a new TimeManager instance
   *
   * @param {Object} deps - Dependencies for injection (testing)
   * @param {Object} deps.dateFns - date-fns library (for mocking in tests)
   * @param {Object} deps.moonPhaseCalculator - MoonPhaseCalculator instance (optional, for Story 2-8)
   * @param {Object} deps.weatherGenerator - WeatherGenerator instance (optional, for Story 2-8)
   */
  constructor(deps = {}) {
    this.dateFns = deps.dateFns || { add, differenceInMinutes, parse, format, isValid };
    this.moonPhaseCalculator = deps.moonPhaseCalculator || null;
    this.weatherGenerator = deps.weatherGenerator || null;
  }

  /**
   * Validates date format (YYYY-MM-DD)
   *
   * @param {string} date - Date string to validate
   * @returns {boolean} True if valid format
   * @private
   */
  _isValidDateFormat(date) {
    if (!date || typeof date !== 'string') {
      return false;
    }

    // Check format: YYYY-MM-DD (digits only, dashes in right places)
    const datePattern = /^\d{1,4}-\d{1,2}-\d{1,2}$/;
    if (!datePattern.test(date)) {
      return false;
    }

    // Extract year, month, day
    const [year, month, day] = date.split('-').map(Number);

    // Validate ranges
    if (year < 1 || year > 9999) {
      return false;
    }
    if (month < 1 || month > 12) {
      return false;
    }
    if (day < 1 || day > 31) {
      return false;
    }

    return true;
  }

  /**
   * Validates time format (HH:MM)
   *
   * @param {string} time - Time string to validate
   * @returns {boolean} True if valid format
   * @private
   */
  _isValidTimeFormat(time) {
    if (!time || typeof time !== 'string') {
      return false;
    }

    // Check format: HH:MM (24-hour format)
    const timePattern = /^\d{1,2}:\d{2}$/;
    if (!timePattern.test(time)) {
      return false;
    }

    // Validate range: hours 0-23, minutes 0-59
    const [hours, minutes] = time.split(':').map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  }

  /**
   * Calculates season from month (1-12)
   *
   * @param {number} month - Month number (1-12)
   * @returns {string} Season name
   * @private
   */
  _calculateSeason(month) {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter'; // 12, 1, 2
  }

  /**
   * Calculates day of week from date
   * Uses modulo arithmetic (7-day week cycle)
   *
   * @param {string} date - Date string (YYYY-MM-DD)
   * @returns {string} Day of week name
   * @private
   */
  _calculateDayOfWeek(date) {
    const [year, month, day] = date.split('-').map(Number);

    // Calculate total days since epoch (year 1, month 1, day 1 = Moonday)
    const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    let totalDays = 0;

    // Add days for complete years
    for (let y = 1; y < year; y++) {
      totalDays += 365;
      // Add leap year day
      if (this._isLeapYear(y)) {
        totalDays += 1;
      }
    }

    // Add days for complete months in current year
    for (let m = 1; m < month; m++) {
      totalDays += daysInMonth[m];
      // Add Feb 29 if leap year
      if (m === 2 && this._isLeapYear(year)) {
        totalDays += 1;
      }
    }

    // Add days in current month
    totalDays += day;

    // Calculate day of week (0 = Moonday, 6 = Sunday)
    const dayIndex = (totalDays - 1) % 7;
    return VALID_DAYS_OF_WEEK[dayIndex];
  }

  /**
   * Checks if year is leap year
   *
   * @param {number} year - Year number
   * @returns {boolean} True if leap year
   * @private
   */
  _isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  /**
   * Adds minutes to a timestamp, handling date/time rollover
   *
   * @param {string} date - Date string (YYYY-MM-DD)
   * @param {string} time - Time string (HH:MM)
   * @param {number} minutes - Minutes to add
   * @returns {Object} {success: boolean, date?: string, time?: string, error?: string}
   */
  addMinutes(date, time, minutes) {
    // Validate inputs
    if (!this._isValidDateFormat(date)) {
      return {
        success: false,
        error: `Invalid date format: "${date}". Expected YYYY-MM-DD`
      };
    }

    if (!this._isValidTimeFormat(time)) {
      return {
        success: false,
        error: `Invalid time format: "${time}". Expected HH:MM`
      };
    }

    if (typeof minutes !== 'number' || isNaN(minutes)) {
      return {
        success: false,
        error: `Invalid minutes: "${minutes}". Must be a number`
      };
    }

    try {
      // Parse date and time into Date object
      const dateTimeString = `${date} ${time}`;
      const parsedDate = this.dateFns.parse(dateTimeString, 'yyyy-M-d HH:mm', new Date());

      // Check if parsing succeeded
      if (!this.dateFns.isValid(parsedDate)) {
        return {
          success: false,
          error: `Invalid date/time combination: "${dateTimeString}"`
        };
      }

      // Add minutes using date-fns
      const newDate = this.dateFns.add(parsedDate, { minutes });

      // Format result with leading zeros
      const newDateStr = this.dateFns.format(newDate, 'yyyy-MM-dd');
      const newTimeStr = this.dateFns.format(newDate, 'HH:mm');

      return {
        success: true,
        date: newDateStr,
        time: newTimeStr
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add minutes: ${error.message}`
      };
    }
  }

  /**
   * Formats date and time for display
   *
   * @param {string} date - Date string (YYYY-MM-DD)
   * @param {string} time - Time string (HH:MM)
   * @returns {string} Formatted timestamp (e.g., "735-10-1 14:30")
   */
  formatTimestamp(date, time) {
    return `${date} ${time}`;
  }

  /**
   * Advances time by specified minutes and returns updated calendar
   *
   * @param {Object} calendar - Calendar object from CalendarManager
   * @param {number} minutes - Minutes to advance
   * @param {string} reason - Reason for advancement (for logging)
   * @returns {Object} {success: boolean, calendar?: Object, reason?: string, error?: string}
   */
  advanceTime(calendar, minutes, reason) {
    // Validate inputs
    if (!calendar || typeof calendar !== 'object') {
      return {
        success: false,
        error: 'Invalid calendar object'
      };
    }

    if (!calendar.current || !calendar.current.date || !calendar.current.time) {
      return {
        success: false,
        error: 'Calendar missing current.date or current.time'
      };
    }

    if (typeof minutes !== 'number' || isNaN(minutes) || minutes <= 0) {
      return {
        success: false,
        error: `Invalid minutes: "${minutes}". Must be a positive number`
      };
    }

    if (minutes > MAX_DURATION_MINUTES) {
      return {
        success: false,
        error: `Duration ${minutes} minutes exceeds maximum (${MAX_DURATION_MINUTES} minutes / 1 week). Use multiple advances for larger skips.`
      };
    }

    // Calculate new timestamp
    const addResult = this.addMinutes(
      calendar.current.date,
      calendar.current.time,
      minutes
    );

    if (!addResult.success) {
      return {
        success: false,
        error: `Failed to calculate new timestamp: ${addResult.error}`
      };
    }

    // Extract month from new date for season calculation
    const [year, month, day] = addResult.date.split('-').map(Number);

    // Create new calendar object (immutability - do not mutate input)
    const newCalendar = JSON.parse(JSON.stringify(calendar)); // Deep clone

    // Update current block
    newCalendar.current.date = addResult.date;
    newCalendar.current.time = addResult.time;
    newCalendar.current.day_of_week = this._calculateDayOfWeek(addResult.date);
    newCalendar.current.season = this._calculateSeason(month);

    // Update metadata
    const hoursElapsed = minutes / 60;
    newCalendar.metadata.total_in_game_hours += hoursElapsed;

    // Story 2-8: Moon phase and weather updates
    // Check if date changed (moon phase recalculation trigger)
    const dateChanged = calendar.current.date !== addResult.date;

    if (this.moonPhaseCalculator && dateChanged) {
      const moonResult = this.moonPhaseCalculator.calculate(addResult.date);
      if (moonResult.success) {
        // Initialize moonPhases section if not exists (schema migration)
        if (!newCalendar.moonPhases) {
          newCalendar.moonPhases = {};
        }

        newCalendar.moonPhases.currentPhase = moonResult.data.currentPhase;
        newCalendar.moonPhases.nextFullMoon = moonResult.data.nextFullMoon;
        newCalendar.moonPhases.nextNewMoon = moonResult.data.nextNewMoon;
        newCalendar.moonPhases.isWerewolfNight = moonResult.data.isWerewolfNight;

        // Remove old moon.* schema fields (migration cleanup)
        if (newCalendar.moon) {
          delete newCalendar.moon;
        }
      }
    }

    // Story 2-8: Weather regeneration (every 12 hours)
    if (this.weatherGenerator) {
      const shouldUpdateWeather = this._shouldUpdateWeather(calendar, newCalendar);

      if (shouldUpdateWeather) {
        const currentMoonPhase = newCalendar.moonPhases?.currentPhase || 'new_moon';
        const previousWeather = calendar.weather || null;

        const weatherResult = this.weatherGenerator.generate(
          addResult.date,
          addResult.time,
          newCalendar.current.season,
          currentMoonPhase,
          previousWeather
        );

        if (weatherResult.success) {
          newCalendar.weather = weatherResult.data;
        }
      }
    }

    return {
      success: true,
      calendar: newCalendar,
      reason: reason || 'time advancement'
    };
  }

  /**
   * Checks if weather should be updated (every 12 hours)
   *
   * @param {Object} oldCalendar - Calendar before advancement
   * @param {Object} newCalendar - Calendar after advancement
   * @returns {boolean} True if weather should be updated
   * @private
   */
  _shouldUpdateWeather(oldCalendar, newCalendar) {
    // Update weather if no lastUpdated timestamp exists
    if (!oldCalendar.weather || !oldCalendar.weather.lastUpdated) {
      return true;
    }

    // Parse last updated timestamp
    try {
      const lastUpdated = new Date(oldCalendar.weather.lastUpdated);
      const currentDateTime = this.dateFns.parse(
        `${newCalendar.current.date} ${newCalendar.current.time}`,
        'yyyy-M-d HH:mm',
        new Date()
      );

      // Calculate hours since last update
      const minutesSinceUpdate = this.dateFns.differenceInMinutes(currentDateTime, lastUpdated);
      const hoursSinceUpdate = minutesSinceUpdate / 60;

      // Update if 12+ hours have passed
      return hoursSinceUpdate >= 12;
    } catch (error) {
      // If parsing fails, update weather to be safe
      return true;
    }
  }

  /**
   * Calculates minutes elapsed between two timestamps
   *
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} startTime - Start time (HH:MM)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {string} endTime - End time (HH:MM)
   * @returns {Object} {success: boolean, minutes?: number, error?: string}
   */
  calculateElapsed(startDate, startTime, endDate, endTime) {
    // Validate inputs
    if (!this._isValidDateFormat(startDate)) {
      return {
        success: false,
        error: `Invalid start date format: "${startDate}". Expected YYYY-MM-DD`
      };
    }

    if (!this._isValidTimeFormat(startTime)) {
      return {
        success: false,
        error: `Invalid start time format: "${startTime}". Expected HH:MM`
      };
    }

    if (!this._isValidDateFormat(endDate)) {
      return {
        success: false,
        error: `Invalid end date format: "${endDate}". Expected YYYY-MM-DD`
      };
    }

    if (!this._isValidTimeFormat(endTime)) {
      return {
        success: false,
        error: `Invalid end time format: "${endTime}". Expected HH:MM`
      };
    }

    try {
      // Parse timestamps
      const startDateTimeString = `${startDate} ${startTime}`;
      const endDateTimeString = `${endDate} ${endTime}`;

      const startParsed = this.dateFns.parse(startDateTimeString, 'yyyy-M-d HH:mm', new Date());
      const endParsed = this.dateFns.parse(endDateTimeString, 'yyyy-M-d HH:mm', new Date());

      // Validate parsed dates
      if (!this.dateFns.isValid(startParsed)) {
        return {
          success: false,
          error: `Invalid start timestamp: "${startDateTimeString}"`
        };
      }

      if (!this.dateFns.isValid(endParsed)) {
        return {
          success: false,
          error: `Invalid end timestamp: "${endDateTimeString}"`
        };
      }

      // Calculate difference in minutes (can be negative if end < start)
      const minutesElapsed = this.dateFns.differenceInMinutes(endParsed, startParsed);

      return {
        success: true,
        minutes: minutesElapsed
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to calculate elapsed time: ${error.message}`
      };
    }
  }

  /**
   * Parses duration string into total minutes
   *
   * @param {string} durationString - Duration like "2 hours", "30 minutes", "1 day", "1 hour 30 minutes"
   * @returns {Object} {success: boolean, minutes?: number, error?: string}
   */
  parseDuration(durationString) {
    if (typeof durationString !== 'string') {
      return {
        success: false,
        error: 'Invalid duration format: must be a string'
      };
    }

    const trimmed = durationString.trim().toLowerCase();

    if (!trimmed || trimmed.length === 0) {
      return {
        success: false,
        error: 'Invalid duration format: empty string'
      };
    }

    let totalMinutes = 0;

    // Match patterns: "X day(s)", "X hour(s)", "X minute(s)"
    const dayMatch = trimmed.match(/(\d+)\s*(day|days)/);
    const hourMatch = trimmed.match(/(\d+)\s*(hour|hours)/);
    const minuteMatch = trimmed.match(/(\d+)\s*(minute|minutes|min|mins)/);

    if (dayMatch) {
      totalMinutes += parseInt(dayMatch[1], 10) * 24 * 60;
    }

    if (hourMatch) {
      totalMinutes += parseInt(hourMatch[1], 10) * 60;
    }

    if (minuteMatch) {
      totalMinutes += parseInt(minuteMatch[1], 10);
    }

    // Check if we found any valid duration components
    if (totalMinutes === 0) {
      return {
        success: false,
        error: `Invalid duration format: "${durationString}". Expected formats like "2 hours", "30 minutes", "1 day", "1 hour 30 minutes"`
      };
    }

    // Reject negative durations
    if (totalMinutes < 0) {
      return {
        success: false,
        error: 'Invalid duration: negative durations are not allowed'
      };
    }

    // Reject durations > 1 week
    if (totalMinutes > MAX_DURATION_MINUTES) {
      return {
        success: false,
        error: `Duration ${totalMinutes} minutes exceeds maximum (${MAX_DURATION_MINUTES} minutes / 1 week)`
      };
    }

    return {
      success: true,
      minutes: totalMinutes
    };
  }

  /**
   * Gets estimated duration for action type (automatic/hybrid mode)
   *
   * @param {string} actionType - Action type constant (TRAVEL, SEARCH, DIALOGUE, etc.)
   * @param {Object} context - Additional context (travelMinutes, metadata, calendar)
   * @returns {Object} {success: boolean, minutes?: number, error?: string}
   */
  getActionDuration(actionType, context = {}) {
    if (!actionType || typeof actionType !== 'string') {
      return {
        success: false,
        error: 'Invalid action type: must be a string'
      };
    }

    const normalizedType = actionType.toLowerCase().trim();

    // Get default_action_minutes from context (calendar.advancement block)
    const defaultMinutes = context.calendar?.advancement?.default_action_minutes || 10;

    switch (normalizedType) {
      case ACTION_TYPES.TRAVEL:
        // Read from context.travelMinutes or context.metadata.connected_locations
        if (context.travelMinutes) {
          return {
            success: true,
            minutes: context.travelMinutes
          };
        }
        // TODO: Epic 2 Story 2-4 will implement reading from location metadata
        // For now, return default
        return {
          success: true,
          minutes: defaultMinutes * 10 // Placeholder: travel takes longer
        };

      case ACTION_TYPES.SEARCH:
        return {
          success: true,
          minutes: defaultMinutes * 3 // 30 minutes if default is 10
        };

      case ACTION_TYPES.DIALOGUE:
        return {
          success: true,
          minutes: defaultMinutes // 10 minutes
        };

      case ACTION_TYPES.SHORT_REST:
        return {
          success: true,
          minutes: 60 // 1 hour (D&D 5e standard)
        };

      case ACTION_TYPES.LONG_REST:
        return {
          success: true,
          minutes: 480 // 8 hours (D&D 5e standard)
        };

      case ACTION_TYPES.COMBAT:
        // Combat duration will be implemented in Epic 3
        return {
          success: true,
          minutes: 0
        };

      default:
        // Unknown action type - use default
        return {
          success: true,
          minutes: defaultMinutes
        };
    }
  }
}

module.exports = TimeManager;
module.exports.ACTION_TYPES = ACTION_TYPES;
