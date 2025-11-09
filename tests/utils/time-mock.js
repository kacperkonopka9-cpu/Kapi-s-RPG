/**
 * Time Mocking Utilities for Calendar Tests
 *
 * Provides deterministic time control for testing time-based features
 * - Calendar advancement
 * - Event triggering
 * - NPC schedules
 * - Moon phases
 * - Weather changes
 *
 * Usage:
 *   const timeMock = new TimeMock('735-10-3', '14:30');
 *   timeMock.advanceHours(2);
 *   expect(timeMock.getCurrentTime()).toBe('16:30');
 */

class TimeMock {
  /**
   * Create time mock with initial date/time
   * @param {string} initialDate - Format: "YYYY-MM-DD"
   * @param {string} initialTime - Format: "HH:MM"
   */
  constructor(initialDate = '735-10-1', initialTime = '08:00') {
    this.currentDate = initialDate;
    this.currentTime = initialTime;
    this.totalMinutesElapsed = 0;

    // Parse initial values
    const [year, month, day] = initialDate.split('-').map(Number);
    const [hours, minutes] = initialTime.split(':').map(Number);

    this.year = year;
    this.month = month;
    this.day = day;
    this.hours = hours;
    this.minutes = minutes;

    // Days in each month (Barovian calendar matches Gregorian)
    this.daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  }

  /**
   * Get current date
   * @returns {string} Format: "YYYY-MM-DD"
   */
  getCurrentDate() {
    return this.currentDate;
  }

  /**
   * Get current time
   * @returns {string} Format: "HH:MM"
   */
  getCurrentTime() {
    return this.currentTime;
  }

  /**
   * Get current timestamp
   * @returns {string} Format: "YYYY-MM-DD HH:MM"
   */
  getCurrentTimestamp() {
    return `${this.currentDate} ${this.currentTime}`;
  }

  /**
   * Advance time by minutes
   * @param {number} minutes - Minutes to advance
   */
  advanceMinutes(minutes) {
    this.totalMinutesElapsed += minutes;
    this.minutes += minutes;

    // Handle minute overflow
    while (this.minutes >= 60) {
      this.minutes -= 60;
      this.hours += 1;
    }

    // Handle hour overflow
    while (this.hours >= 24) {
      this.hours -= 24;
      this.day += 1;
    }

    // Handle day overflow
    while (this.day > this.daysInMonth[this.month]) {
      this.day -= this.daysInMonth[this.month];
      this.month += 1;

      if (this.month > 12) {
        this.month = 1;
        this.year += 1;
      }
    }

    // Update string representations
    this.updateStrings();
  }

  /**
   * Advance time by hours
   * @param {number} hours - Hours to advance
   */
  advanceHours(hours) {
    this.advanceMinutes(hours * 60);
  }

  /**
   * Advance time by days
   * @param {number} days - Days to advance
   */
  advanceDays(days) {
    this.advanceMinutes(days * 24 * 60);
  }

  /**
   * Set specific date/time (useful for jumping to test scenarios)
   * @param {string} date - Format: "YYYY-MM-DD"
   * @param {string} time - Format: "HH:MM"
   */
  setTime(date, time) {
    this.currentDate = date;
    this.currentTime = time;

    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    this.year = year;
    this.month = month;
    this.day = day;
    this.hours = hours;
    this.minutes = minutes;
  }

  /**
   * Get total elapsed time
   * @returns {number} Total minutes elapsed since initialization
   */
  getTotalElapsed() {
    return this.totalMinutesElapsed;
  }

  /**
   * Reset to initial time
   * @param {string} date - Format: "YYYY-MM-DD"
   * @param {string} time - Format: "HH:MM"
   */
  reset(date = '735-10-1', time = '08:00') {
    this.currentDate = date;
    this.currentTime = time;
    this.totalMinutesElapsed = 0;

    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    this.year = year;
    this.month = month;
    this.day = day;
    this.hours = hours;
    this.minutes = minutes;
  }

  /**
   * Get day of week
   * @returns {string} Moonday, Toilday, Wealday, Oathday, Fireday, Starday, Sunday
   */
  getDayOfWeek() {
    // Calculate day of week (simplified algorithm)
    const daysSinceEpoch = this.calculateDaysSinceEpoch();
    const dayIndex = daysSinceEpoch % 7;

    const daysOfWeek = ['Moonday', 'Toilday', 'Wealday', 'Oathday', 'Fireday', 'Starday', 'Sunday'];
    return daysOfWeek[dayIndex];
  }

  /**
   * Get season
   * @returns {string} spring, summer, autumn, winter
   */
  getSeason() {
    if (this.month >= 3 && this.month <= 5) return 'spring';
    if (this.month >= 6 && this.month <= 8) return 'summer';
    if (this.month >= 9 && this.month <= 11) return 'autumn';
    return 'winter';
  }

  /**
   * Calculate days since epoch (for day of week calculation)
   * @private
   */
  calculateDaysSinceEpoch() {
    let days = 0;

    // Add days for complete years
    for (let y = 0; y < this.year; y++) {
      days += 365;
    }

    // Add days for complete months in current year
    for (let m = 1; m < this.month; m++) {
      days += this.daysInMonth[m];
    }

    // Add days in current month
    days += this.day;

    return days;
  }

  /**
   * Update string representations after time advancement
   * @private
   */
  updateStrings() {
    this.currentDate = `${this.year}-${String(this.month).padStart(2, '0')}-${String(this.day).padStart(2, '0')}`;
    this.currentTime = `${String(this.hours).padStart(2, '0')}:${String(this.minutes).padStart(2, '0')}`;
  }

  /**
   * Check if time falls within time block
   * @param {string} timeBlock - Format: "HH:MM-HH:MM"
   * @returns {boolean} True if current time is within block
   */
  isWithinTimeBlock(timeBlock) {
    const [start, end] = timeBlock.split('-');
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    const currentMinutes = this.hours * 60 + this.minutes;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}

/**
 * Mock calendar for testing
 * Wraps TimeMock with calendar-specific functionality
 */
class CalendarMock {
  constructor(timeMock) {
    this.time = timeMock || new TimeMock();
    this.moonCycle = 28; // days per cycle
  }

  /**
   * Get current moon phase
   * @returns {string} Moon phase name
   */
  getMoonPhase() {
    const daysSinceNewMoon = this.time.calculateDaysSinceEpoch() % this.moonCycle;
    const phaseIndex = Math.floor(daysSinceNewMoon / (this.moonCycle / 8));

    const phases = [
      'new',
      'waxing_crescent',
      'first_quarter',
      'waxing_gibbous',
      'full',
      'waning_gibbous',
      'last_quarter',
      'waning_crescent'
    ];

    return phases[phaseIndex];
  }

  /**
   * Check if current moon phase is full
   * @returns {boolean}
   */
  isFullMoon() {
    return this.getMoonPhase() === 'full';
  }

  /**
   * Get days until next full moon
   * @returns {number}
   */
  getDaysUntilFullMoon() {
    const daysSinceNewMoon = this.time.calculateDaysSinceEpoch() % this.moonCycle;
    const fullMoonDay = 14; // Middle of 28-day cycle

    if (daysSinceNewMoon <= fullMoonDay) {
      return fullMoonDay - daysSinceNewMoon;
    } else {
      return this.moonCycle - daysSinceNewMoon + fullMoonDay;
    }
  }

  /**
   * Advance to next full moon
   */
  advanceToFullMoon() {
    const days = this.getDaysUntilFullMoon();
    this.time.advanceDays(days);
  }

  /**
   * Generate mock calendar.yaml object
   * @returns {Object} Calendar state object
   */
  toCalendarObject() {
    return {
      current: {
        date: this.time.getCurrentDate(),
        time: this.time.getCurrentTime(),
        day_of_week: this.time.getDayOfWeek(),
        season: this.time.getSeason()
      },
      moon: {
        current_phase: this.getMoonPhase(),
        days_until_full: this.getDaysUntilFullMoon()
      },
      metadata: {
        total_in_game_hours: Math.floor(this.time.getTotalElapsed() / 60)
      }
    };
  }
}

/**
 * Jest matchers for time assertions
 */
const timeMatchers = {
  /**
   * Assert time is specific value
   */
  toBeTime(received, expected) {
    const pass = received === expected;

    return {
      pass,
      message: () =>
        pass
          ? `Expected time not to be ${expected}`
          : `Expected time to be ${expected}, got ${received}`
    };
  },

  /**
   * Assert time is after another time
   */
  toBeAfter(received, expected) {
    const [rHour, rMin] = received.split(':').map(Number);
    const [eHour, eMin] = expected.split(':').map(Number);

    const rMinutes = rHour * 60 + rMin;
    const eMinutes = eHour * 60 + eMin;

    const pass = rMinutes > eMinutes;

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be after ${expected}`
          : `Expected ${received} to be after ${expected}`
    };
  },

  /**
   * Assert moon phase
   */
  toBeMoonPhase(received, expected) {
    const pass = received === expected;

    return {
      pass,
      message: () =>
        pass
          ? `Expected moon phase not to be ${expected}`
          : `Expected moon phase to be ${expected}, got ${received}`
    };
  }
};

module.exports = {
  TimeMock,
  CalendarMock,
  timeMatchers
};
