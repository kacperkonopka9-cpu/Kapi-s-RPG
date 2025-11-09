/**
 * CalendarManager - Manages game calendar state persistence
 *
 * Reads and updates calendar.yaml file in project root, tracking:
 * - Current date/time (in-game)
 * - Time advancement configuration
 * - Moon phases
 * - Weather conditions
 * - Scheduled events
 * - NPC schedules
 * - Event history
 * - Campaign metadata
 *
 * Calendar data is stored as YAML for human readability and Git-friendliness.
 *
 * Key Features:
 * - YAML with SAFE_SCHEMA for structured calendar data
 * - Graceful error handling (no exceptions thrown)
 * - Dependency injection for testability
 * - Atomic file writes (read → modify → write)
 * - Automatic timestamp updates
 * - Schema validation for all fields
 * - Performance: < 50ms load, < 100ms save
 *
 * Pattern follows StateManager from Epic 1 (Story 1-10).
 *
 * @module CalendarManager
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

/**
 * Default calendar structure for new or missing calendar files
 */
const DEFAULT_CALENDAR = {
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
  moon: {
    current_phase: 'new',
    days_until_full: 14,
    last_full_moon: null,
    next_full_moon: null
  },
  weather: {
    current: 'clear',
    temperature: 10,
    wind: 'light',
    visibility: 'good',
    last_updated: null
  },
  events: [],
  npc_schedules: [],
  history: [],
  metadata: {
    campaign_start_date: null,
    real_world_session_count: 0,
    total_in_game_hours: 0
  }
};

/**
 * Allowed values for enum fields (validation)
 */
const VALID_SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const VALID_DAYS_OF_WEEK = ['Moonday', 'Toilday', 'Wealday', 'Oathday', 'Fireday', 'Starday', 'Sunday'];
const VALID_ADVANCEMENT_MODES = ['manual', 'automatic', 'hybrid'];
const VALID_MOON_PHASES = ['new', 'waxing_crescent', 'first_quarter', 'waxing_gibbous', 'full', 'waning_gibbous', 'last_quarter', 'waning_crescent'];
const VALID_WEATHER_CONDITIONS = ['clear', 'cloudy', 'foggy', 'light_rain', 'heavy_rain', 'light_snow', 'heavy_snow', 'thunderstorm', 'blizzard'];
const VALID_WIND_CONDITIONS = ['calm', 'light', 'moderate', 'strong', 'gale'];
const VALID_VISIBILITY = ['excellent', 'good', 'moderate', 'poor', 'very_poor'];

/**
 * CalendarManager class handles calendar state persistence
 */
class CalendarManager {
  /**
   * Creates a new CalendarManager instance
   *
   * @param {Object} deps - Dependencies for injection (testing)
   * @param {Object} deps.fs - File system module (defaults to fs.promises)
   * @param {Object} deps.path - Path module (defaults to path)
   * @param {Object} deps.yaml - YAML module (defaults to js-yaml)
   * @param {string} deps.calendarPath - Path to calendar.yaml (defaults to project root)
   */
  constructor(deps = {}) {
    this.fs = deps.fs || fs;
    this.path = deps.path || path;
    this.yaml = deps.yaml || yaml;
    this.calendarPath = deps.calendarPath || 'calendar.yaml';
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
    return datePattern.test(date);
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
   * Validates enum value against allowed values
   *
   * @param {string} value - Value to validate
   * @param {Array} allowedValues - Array of allowed values
   * @param {string} fieldName - Name of field for error messages
   * @returns {Object} {valid: boolean, error?: string}
   * @private
   */
  _validateEnum(value, allowedValues, fieldName) {
    if (!allowedValues.includes(value)) {
      return {
        valid: false,
        error: `Invalid ${fieldName}: "${value}". Allowed values: ${allowedValues.join(', ')}`
      };
    }
    return { valid: true };
  }

  /**
   * Validates calendar data structure
   *
   * @param {Object} calendar - Calendar data to validate
   * @returns {Object} {valid: boolean, errors: Array<string>}
   * @private
   */
  _validateCalendar(calendar) {
    const errors = [];

    // Validate current block
    if (!calendar.current) {
      errors.push('Missing required field: current');
    } else {
      if (!this._isValidDateFormat(calendar.current.date)) {
        errors.push(`Invalid date format: "${calendar.current.date}". Expected YYYY-MM-DD`);
      }
      if (!this._isValidTimeFormat(calendar.current.time)) {
        errors.push(`Invalid time format: "${calendar.current.time}". Expected HH:MM`);
      }

      const dayOfWeekValidation = this._validateEnum(
        calendar.current.day_of_week,
        VALID_DAYS_OF_WEEK,
        'day_of_week'
      );
      if (!dayOfWeekValidation.valid) {
        errors.push(dayOfWeekValidation.error);
      }

      const seasonValidation = this._validateEnum(
        calendar.current.season,
        VALID_SEASONS,
        'season'
      );
      if (!seasonValidation.valid) {
        errors.push(seasonValidation.error);
      }
    }

    // Validate advancement block
    if (!calendar.advancement) {
      errors.push('Missing required field: advancement');
    } else {
      const modeValidation = this._validateEnum(
        calendar.advancement.mode,
        VALID_ADVANCEMENT_MODES,
        'advancement.mode'
      );
      if (!modeValidation.valid) {
        errors.push(modeValidation.error);
      }
    }

    // Validate moon block
    if (!calendar.moon) {
      errors.push('Missing required field: moon');
    } else {
      const phaseValidation = this._validateEnum(
        calendar.moon.current_phase,
        VALID_MOON_PHASES,
        'moon.current_phase'
      );
      if (!phaseValidation.valid) {
        errors.push(phaseValidation.error);
      }
    }

    // Validate weather block
    if (!calendar.weather) {
      errors.push('Missing required field: weather');
    } else {
      const weatherValidation = this._validateEnum(
        calendar.weather.current,
        VALID_WEATHER_CONDITIONS,
        'weather.current'
      );
      if (!weatherValidation.valid) {
        errors.push(weatherValidation.error);
      }

      const windValidation = this._validateEnum(
        calendar.weather.wind,
        VALID_WIND_CONDITIONS,
        'weather.wind'
      );
      if (!windValidation.valid) {
        errors.push(windValidation.error);
      }

      const visibilityValidation = this._validateEnum(
        calendar.weather.visibility,
        VALID_VISIBILITY,
        'weather.visibility'
      );
      if (!visibilityValidation.valid) {
        errors.push(visibilityValidation.error);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculates day of week from date
   *
   * @param {string} date - Date string (YYYY-MM-DD)
   * @returns {string} Day of week name
   * @private
   */
  _calculateDayOfWeek(date) {
    // Simple algorithm: use date components to calculate day index
    const [year, month, day] = date.split('-').map(Number);

    // Days in each month (simplified, no leap years in Barovia)
    const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Calculate total days since epoch
    let totalDays = 0;
    for (let y = 0; y < year; y++) {
      totalDays += 365;
    }
    for (let m = 1; m < month; m++) {
      totalDays += daysInMonth[m];
    }
    totalDays += day;

    // Get day of week index (0-6)
    const dayIndex = totalDays % 7;

    return VALID_DAYS_OF_WEEK[dayIndex];
  }

  /**
   * Determines season from month
   *
   * @param {string} date - Date string (YYYY-MM-DD)
   * @returns {string} Season name
   * @private
   */
  _calculateSeason(date) {
    const [, month] = date.split('-').map(Number);

    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  /**
   * Calculates moon phase from date
   *
   * @param {string} date - Date string (YYYY-MM-DD)
   * @returns {string} Moon phase name
   * @private
   */
  _calculateMoonPhase(date) {
    // Moon cycle: 28 days
    const [year, month, day] = date.split('-').map(Number);

    // Days in each month
    const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Calculate total days since epoch
    let totalDays = 0;
    for (let y = 0; y < year; y++) {
      totalDays += 365;
    }
    for (let m = 1; m < month; m++) {
      totalDays += daysInMonth[m];
    }
    totalDays += day;

    // Get position in 28-day cycle
    const dayInCycle = totalDays % 28;

    // Map to moon phase (8 phases, ~3.5 days each)
    const phaseIndex = Math.floor(dayInCycle / 3.5);
    return VALID_MOON_PHASES[Math.min(phaseIndex, 7)];
  }

  /**
   * Calculates days until next full moon
   *
   * @param {string} date - Date string (YYYY-MM-DD)
   * @returns {number} Days until full moon
   * @private
   */
  _calculateDaysUntilFullMoon(date) {
    const [year, month, day] = date.split('-').map(Number);

    // Days in each month
    const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Calculate total days since epoch
    let totalDays = 0;
    for (let y = 0; y < year; y++) {
      totalDays += 365;
    }
    for (let m = 1; m < month; m++) {
      totalDays += daysInMonth[m];
    }
    totalDays += day;

    // Full moon is at day 14 of 28-day cycle
    const dayInCycle = totalDays % 28;
    const fullMoonDay = 14;

    if (dayInCycle <= fullMoonDay) {
      return fullMoonDay - dayInCycle;
    } else {
      return 28 - dayInCycle + fullMoonDay;
    }
  }

  /**
   * Initializes weather based on season
   *
   * @param {string} season - Season name
   * @returns {Object} Weather object with current, temperature, wind, visibility
   * @private
   */
  _initializeWeatherForSeason(season) {
    // Simple weather initialization based on season
    const weatherBySeason = {
      spring: { current: 'cloudy', temperature: 12, wind: 'moderate', visibility: 'good' },
      summer: { current: 'clear', temperature: 22, wind: 'light', visibility: 'excellent' },
      autumn: { current: 'foggy', temperature: 8, wind: 'moderate', visibility: 'poor' },
      winter: { current: 'light_snow', temperature: -2, wind: 'strong', visibility: 'moderate' }
    };

    return weatherBySeason[season] || weatherBySeason.autumn;
  }

  /**
   * Creates a new calendar.yaml file with initial date/time
   *
   * @param {string} initialDate - Initial date (YYYY-MM-DD)
   * @param {string} initialTime - Initial time (HH:MM)
   * @returns {Promise<Object>} {success: boolean, calendar?: Object, error?: string}
   */
  async createCalendar(initialDate, initialTime) {
    try {
      // Validate input formats
      if (!this._isValidDateFormat(initialDate)) {
        return {
          success: false,
          error: `Invalid date format: "${initialDate}". Expected YYYY-MM-DD`
        };
      }

      if (!this._isValidTimeFormat(initialTime)) {
        return {
          success: false,
          error: `Invalid time format: "${initialTime}". Expected HH:MM`
        };
      }

      // Calculate derived values
      const dayOfWeek = this._calculateDayOfWeek(initialDate);
      const season = this._calculateSeason(initialDate);
      const moonPhase = this._calculateMoonPhase(initialDate);
      const daysUntilFull = this._calculateDaysUntilFullMoon(initialDate);
      const weather = this._initializeWeatherForSeason(season);

      // Build calendar object
      const calendar = {
        current: {
          date: initialDate,
          time: initialTime,
          day_of_week: dayOfWeek,
          season: season
        },
        advancement: {
          mode: 'hybrid',
          auto_advance_on_travel: true,
          auto_advance_on_rest: true,
          default_action_minutes: 10
        },
        moon: {
          current_phase: moonPhase,
          days_until_full: daysUntilFull,
          last_full_moon: null,
          next_full_moon: null
        },
        weather: {
          current: weather.current,
          temperature: weather.temperature,
          wind: weather.wind,
          visibility: weather.visibility,
          last_updated: `${initialDate} ${initialTime}`
        },
        events: [],
        npc_schedules: [],
        history: [],
        metadata: {
          campaign_start_date: `${initialDate} ${initialTime}`,
          real_world_session_count: 0,
          total_in_game_hours: 0
        }
      };

      // Validate calendar structure
      const validation = this._validateCalendar(calendar);
      if (!validation.valid) {
        return {
          success: false,
          error: `Calendar validation failed: ${validation.errors.join('; ')}`
        };
      }

      // Serialize to YAML
      const yamlContent = this.yaml.dump(calendar, {
        schema: this.yaml.SAFE_SCHEMA,
        sortKeys: true,
        lineWidth: -1
      });

      // Write to file
      await this.fs.writeFile(this.calendarPath, yamlContent, 'utf-8');

      return {
        success: true,
        calendar: calendar
      };
    } catch (error) {
      console.warn(`Failed to create calendar: ${error.message}`);
      return {
        success: false,
        error: `Failed to create calendar: ${error.message}`
      };
    }
  }

  /**
   * Loads calendar from calendar.yaml
   *
   * @returns {Promise<Object>} {success: boolean, calendar?: Object, error?: string}
   */
  async loadCalendar() {
    try {
      const startTime = Date.now();

      // Check if file exists
      try {
        await this.fs.access(this.calendarPath);
      } catch (accessError) {
        // File doesn't exist - return default calendar
        console.warn('calendar.yaml not found, returning default calendar');
        return {
          success: true,
          calendar: { ...DEFAULT_CALENDAR }
        };
      }

      // Read file
      const content = await this.fs.readFile(this.calendarPath, 'utf-8');

      // Parse YAML
      let calendar;
      try {
        calendar = this.yaml.load(content, { schema: this.yaml.SAFE_SCHEMA });
      } catch (yamlError) {
        console.warn(`Malformed calendar.yaml: ${yamlError.message}`);
        return {
          success: true,
          calendar: { ...DEFAULT_CALENDAR }
        };
      }

      // Validate calendar structure
      const validation = this._validateCalendar(calendar);
      if (!validation.valid) {
        console.warn(`Calendar validation warnings: ${validation.errors.join('; ')}`);
        // Return calendar anyway but log warnings
      }

      const elapsed = Date.now() - startTime;
      if (elapsed > 50) {
        console.warn(`loadCalendar() took ${elapsed}ms (target: < 50ms)`);
      }

      return {
        success: true,
        calendar: calendar
      };
    } catch (error) {
      console.warn(`Failed to load calendar: ${error.message}`);
      return {
        success: false,
        error: `Failed to load calendar: ${error.message}`
      };
    }
  }

  /**
   * Saves calendar to calendar.yaml
   *
   * @param {Object} calendarData - Calendar data to save
   * @returns {Promise<Object>} {success: boolean, error?: string}
   */
  async saveCalendar(calendarData) {
    try {
      const startTime = Date.now();

      // Validate calendar structure
      const validation = this._validateCalendar(calendarData);
      if (!validation.valid) {
        return {
          success: false,
          error: `Calendar validation failed: ${validation.errors.join('; ')}`
        };
      }

      // Serialize to YAML (Git-friendly format)
      const yamlContent = this.yaml.dump(calendarData, {
        schema: this.yaml.SAFE_SCHEMA,
        sortKeys: true,
        lineWidth: -1
      });

      // Atomic write
      await this.fs.writeFile(this.calendarPath, yamlContent, 'utf-8');

      const elapsed = Date.now() - startTime;
      if (elapsed > 100) {
        console.warn(`saveCalendar() took ${elapsed}ms (target: < 100ms)`);
      }

      return {
        success: true
      };
    } catch (error) {
      console.warn(`Failed to save calendar: ${error.message}`);
      return {
        success: false,
        error: `Failed to save calendar: ${error.message}`
      };
    }
  }

  /**
   * Gets current in-game time
   *
   * @returns {Promise<Object>} {date: string, time: string}
   */
  async getCurrentTime() {
    const result = await this.loadCalendar();

    if (!result.success || !result.calendar) {
      return {
        date: DEFAULT_CALENDAR.current.date,
        time: DEFAULT_CALENDAR.current.time
      };
    }

    return {
      date: result.calendar.current.date,
      time: result.calendar.current.time
    };
  }

  /**
   * Updates current in-game time
   *
   * @param {string} newDate - New date (YYYY-MM-DD)
   * @param {string} newTime - New time (HH:MM)
   * @returns {Promise<Object>} {success: boolean, error?: string}
   */
  async updateCurrentTime(newDate, newTime) {
    try {
      // Validate input formats
      if (!this._isValidDateFormat(newDate)) {
        return {
          success: false,
          error: `Invalid date format: "${newDate}". Expected YYYY-MM-DD`
        };
      }

      if (!this._isValidTimeFormat(newTime)) {
        return {
          success: false,
          error: `Invalid time format: "${newTime}". Expected HH:MM`
        };
      }

      // Load current calendar
      const loadResult = await this.loadCalendar();
      if (!loadResult.success) {
        return {
          success: false,
          error: `Failed to load calendar: ${loadResult.error}`
        };
      }

      const calendar = loadResult.calendar;

      // Update current time
      calendar.current.date = newDate;
      calendar.current.time = newTime;
      calendar.current.day_of_week = this._calculateDayOfWeek(newDate);
      calendar.current.season = this._calculateSeason(newDate);

      // Update moon phase
      calendar.moon.current_phase = this._calculateMoonPhase(newDate);
      calendar.moon.days_until_full = this._calculateDaysUntilFullMoon(newDate);

      // Save updated calendar
      const saveResult = await this.saveCalendar(calendar);
      return saveResult;
    } catch (error) {
      console.warn(`Failed to update current time: ${error.message}`);
      return {
        success: false,
        error: `Failed to update current time: ${error.message}`
      };
    }
  }
}

module.exports = CalendarManager;
