/**
 * MoonPhaseCalculator - Calculates moon phases based on in-game date
 *
 * Provides deterministic moon phase calculations for the game calendar:
 * - 28-day lunar cycle (simplified from real 29.5 days)
 * - 8 distinct moon phases
 * - Calculate next full moon and new moon dates
 * - Werewolf encounter flag on full moon nights
 *
 * Key Features:
 * - Deterministic calculations (same date always gives same phase)
 * - Uses reference new moon date: 2000-01-06
 * - Dependency injection for testability
 * - Graceful error handling (no exceptions thrown)
 * - Performance: < 5ms for calculations
 *
 * Pattern follows Epic 2 architectural standards.
 *
 * @module MoonPhaseCalculator
 */

const { differenceInDays, addDays, parse, format } = require('date-fns');

/**
 * Moon phase enum - 8 phases in lunar cycle
 */
const MoonPhase = {
  NEW_MOON: 'new_moon',
  WAXING_CRESCENT: 'waxing_crescent',
  FIRST_QUARTER: 'first_quarter',
  WAXING_GIBBOUS: 'waxing_gibbous',
  FULL_MOON: 'full_moon',
  WANING_GIBBOUS: 'waning_gibbous',
  LAST_QUARTER: 'last_quarter',
  WANING_CRESCENT: 'waning_crescent'
};

/**
 * Lunar cycle configuration
 */
const LUNAR_CYCLE_DAYS = 28; // Simplified from real 29.5 days
const PHASE_DURATION_DAYS = LUNAR_CYCLE_DAYS / 8; // 3.5 days per phase
const REFERENCE_NEW_MOON = '2000-01-06'; // Epoch reference date

/**
 * MoonPhaseCalculator class handles moon phase calculations
 */
class MoonPhaseCalculator {
  /**
   * Creates a new MoonPhaseCalculator instance
   *
   * @param {Object} deps - Dependencies for injection (testing)
   * @param {Object} deps.dateFns - date-fns library (defaults to require('date-fns'))
   */
  constructor(deps = {}) {
    this.dateFns = deps.dateFns || { differenceInDays, addDays, parse, format };
  }

  /**
   * Validates date format (YYYY-MM-DD or YYYY-M-D)
   *
   * @param {string} date - Date string to validate
   * @returns {boolean} True if valid format
   * @private
   */
  _isValidDateFormat(date) {
    if (!date || typeof date !== 'string') {
      return false;
    }

    // Check format: YYYY-MM-DD or YYYY-M-D (digits only, dashes in right places)
    const datePattern = /^\d{1,4}-\d{1,2}-\d{1,2}$/;
    return datePattern.test(date);
  }

  /**
   * Parse date string to Date object
   *
   * @param {string} dateStr - Date string in format YYYY-MM-DD
   * @returns {{success: boolean, data: Date|null, error: string|null}}
   * @private
   */
  _parseDate(dateStr) {
    try {
      if (!this._isValidDateFormat(dateStr)) {
        return {
          success: false,
          data: null,
          error: `Invalid date format: "${dateStr}". Expected YYYY-MM-DD`
        };
      }

      const parsed = this.dateFns.parse(dateStr, 'yyyy-M-d', new Date());

      if (isNaN(parsed.getTime())) {
        return {
          success: false,
          data: null,
          error: `Cannot parse date: "${dateStr}"`
        };
      }

      return {
        success: true,
        data: parsed,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Date parsing failed: ${error.message}`
      };
    }
  }

  /**
   * Calculate moon phase for given date
   *
   * Deterministic calculation based on 28-day lunar cycle with reference new moon at 2000-01-06.
   * Same date input always returns same result (no randomness).
   *
   * @param {string} currentDate - Current in-game date (format: "YYYY-MM-DD")
   * @returns {{success: boolean, data: Object|null, error: string|null}}
   *
   * @example
   * calculator.calculate("2024-03-15")
   * // Returns:
   * // {
   * //   success: true,
   * //   data: {
   * //     currentPhase: "waxing_gibbous",
   * //     nextFullMoon: "2024-03-17",
   * //     nextNewMoon: "2024-03-31",
   * //     isWerewolfNight: false,
   * //     daysUntilFullMoon: 2,
   * //     daysSinceNewMoon: 9
   * //   },
   * //   error: null
   * // }
   */
  calculate(currentDate) {
    try {
      // Validate and parse current date
      const parsedCurrent = this._parseDate(currentDate);
      if (!parsedCurrent.success) {
        return parsedCurrent;
      }

      // Parse reference new moon date
      const parsedReference = this._parseDate(REFERENCE_NEW_MOON);
      if (!parsedReference.success) {
        return {
          success: false,
          data: null,
          error: `Failed to parse reference date: ${parsedReference.error}`
        };
      }

      const currentDateObj = parsedCurrent.data;
      const referenceNewMoonObj = parsedReference.data;

      // Calculate days since reference new moon
      const daysSinceReference = this.dateFns.differenceInDays(currentDateObj, referenceNewMoonObj);

      // Calculate position in current lunar cycle (0-27)
      const dayInCycle = ((daysSinceReference % LUNAR_CYCLE_DAYS) + LUNAR_CYCLE_DAYS) % LUNAR_CYCLE_DAYS;

      // Determine current phase based on position in cycle
      // Each phase lasts 3.5 days (28 days / 8 phases)
      const phaseIndex = Math.floor(dayInCycle / PHASE_DURATION_DAYS);
      const phases = [
        MoonPhase.NEW_MOON,
        MoonPhase.WAXING_CRESCENT,
        MoonPhase.FIRST_QUARTER,
        MoonPhase.WAXING_GIBBOUS,
        MoonPhase.FULL_MOON,
        MoonPhase.WANING_GIBBOUS,
        MoonPhase.LAST_QUARTER,
        MoonPhase.WANING_CRESCENT
      ];
      const currentPhase = phases[phaseIndex];

      // Calculate days since new moon in this cycle
      const daysSinceNewMoon = dayInCycle;

      // Calculate next full moon (phase index 4)
      let daysUntilFullMoon;
      const fullMoonDay = 4 * PHASE_DURATION_DAYS; // Day 14 in cycle

      if (dayInCycle < fullMoonDay) {
        // Full moon is later in this cycle
        daysUntilFullMoon = fullMoonDay - dayInCycle;
      } else {
        // Full moon is in next cycle
        daysUntilFullMoon = (LUNAR_CYCLE_DAYS - dayInCycle) + fullMoonDay;
      }

      const nextFullMoonObj = this.dateFns.addDays(currentDateObj, Math.ceil(daysUntilFullMoon));
      const nextFullMoon = this.dateFns.format(nextFullMoonObj, 'yyyy-MM-dd');

      // Calculate next new moon (phase index 0)
      let daysUntilNewMoon;
      if (dayInCycle === 0) {
        // Currently new moon, next one is full cycle away
        daysUntilNewMoon = LUNAR_CYCLE_DAYS;
      } else {
        // Next new moon is at start of next cycle
        daysUntilNewMoon = LUNAR_CYCLE_DAYS - dayInCycle;
      }

      const nextNewMoonObj = this.dateFns.addDays(currentDateObj, Math.ceil(daysUntilNewMoon));
      const nextNewMoon = this.dateFns.format(nextNewMoonObj, 'yyyy-MM-dd');

      // Check if werewolf night (full moon)
      const isWerewolfNight = currentPhase === MoonPhase.FULL_MOON;

      return {
        success: true,
        data: {
          currentPhase,
          nextFullMoon,
          nextNewMoon,
          isWerewolfNight,
          daysUntilFullMoon: Math.ceil(daysUntilFullMoon),
          daysSinceNewMoon: Math.floor(daysSinceNewMoon)
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `MoonPhaseCalculator.calculate failed: ${error.message}`
      };
    }
  }

  /**
   * Get human-readable phase name
   *
   * @param {string} phaseEnum - Moon phase enum value
   * @returns {string} Human-readable phase name
   */
  getPhaseDisplayName(phaseEnum) {
    const displayNames = {
      [MoonPhase.NEW_MOON]: 'New Moon',
      [MoonPhase.WAXING_CRESCENT]: 'Waxing Crescent',
      [MoonPhase.FIRST_QUARTER]: 'First Quarter',
      [MoonPhase.WAXING_GIBBOUS]: 'Waxing Gibbous',
      [MoonPhase.FULL_MOON]: 'Full Moon',
      [MoonPhase.WANING_GIBBOUS]: 'Waning Gibbous',
      [MoonPhase.LAST_QUARTER]: 'Last Quarter',
      [MoonPhase.WANING_CRESCENT]: 'Waning Crescent'
    };

    return displayNames[phaseEnum] || phaseEnum;
  }
}

// Export class and enum
module.exports = { MoonPhaseCalculator, MoonPhase };
