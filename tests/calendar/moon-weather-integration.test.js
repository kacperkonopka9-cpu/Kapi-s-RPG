/**
 * Integration Tests for Moon Phase & Weather System
 *
 * Coverage:
 * - AC-7: Calendar integration with TimeManager
 * - Moon phase updates on date change
 * - Weather updates at 12-hour intervals
 * - Calendar.yaml schema compliance
 * - /calendar command display
 */

const TimeManager = require('../../src/calendar/time-manager');
const { MoonPhaseCalculator, MoonPhase } = require('../../src/calendar/moon-phase-calculator');
const { WeatherGenerator, WeatherCondition } = require('../../src/calendar/weather-generator');

describe('Moon Phase & Weather Integration', () => {
  describe('AC-7: TimeManager Integration', () => {
    test('should update moon phase when date changes', () => {
      const moonCalculator = new MoonPhaseCalculator();
      const timeManager = new TimeManager({ moonPhaseCalculator: moonCalculator });

      const calendar = {
        current: {
          date: '2000-01-06',
          time: '08:00',
          day_of_week: 'Moonday',
          season: 'winter'
        },
        metadata: {
          total_in_game_hours: 0
        }
      };

      // Advance time by 24 hours (date changes)
      const result = timeManager.advanceTime(calendar, 24 * 60, 'test');

      expect(result.success).toBe(true);
      expect(result.calendar.moonPhases).toBeDefined();
      expect(result.calendar.moonPhases.currentPhase).toBe(MoonPhase.NEW_MOON);
      expect(result.calendar.moonPhases.nextFullMoon).toBeDefined();
      expect(result.calendar.moonPhases.nextNewMoon).toBeDefined();
      expect(result.calendar.moonPhases.isWerewolfNight).toBe(false);
    });

    test('should NOT update moon phase when date does not change', () => {
      const moonCalculator = new MoonPhaseCalculator();
      const timeManager = new TimeManager({ moonPhaseCalculator: moonCalculator });

      const calendar = {
        current: {
          date: '2000-01-06',
          time: '08:00',
          day_of_week: 'Moonday',
          season: 'winter'
        },
        moonPhases: {
          currentPhase: MoonPhase.NEW_MOON,
          nextFullMoon: '2000-01-20',
          nextNewMoon: '2000-02-03',
          isWerewolfNight: false
        },
        metadata: {
          total_in_game_hours: 0
        }
      };

      // Advance time by 2 hours (date stays same)
      const result = timeManager.advanceTime(calendar, 2 * 60, 'test');

      expect(result.success).toBe(true);
      // Moon phase should remain unchanged
      expect(result.calendar.moonPhases.currentPhase).toBe(MoonPhase.NEW_MOON);
    });

    test('should update weather every 12 hours', () => {
      const weatherGenerator = new WeatherGenerator();
      const timeManager = new TimeManager({ weatherGenerator });

      const calendar = {
        current: {
          date: '2024-04-15',
          time: '08:00',
          day_of_week: 'Moonday',
          season: 'spring'
        },
        metadata: {
          total_in_game_hours: 0
        }
      };

      // Advance time by 13 hours (trigger weather update)
      const result = timeManager.advanceTime(calendar, 13 * 60, 'test');

      expect(result.success).toBe(true);
      expect(result.calendar.weather).toBeDefined();
      expect(result.calendar.weather.condition).toBeDefined();
      expect(result.calendar.weather.temperature).toBeDefined();
      expect(result.calendar.weather.visibility).toBeDefined();
      expect(result.calendar.weather.description).toBeDefined();
      expect(result.calendar.weather.lastUpdated).toBeDefined();
    });

    test('should NOT update weather before 12 hours', () => {
      const weatherGenerator = new WeatherGenerator();
      const timeManager = new TimeManager({ weatherGenerator });

      const calendar = {
        current: {
          date: '2024-04-15',
          time: '08:00',
          day_of_week: 'Moonday',
          season: 'spring'
        },
        weather: {
          condition: WeatherCondition.CLEAR,
          temperature: 55,
          visibility: 'Clear',
          description: 'Test weather',
          lastUpdated: new Date('2024-04-15T08:00:00Z').toISOString()
        },
        metadata: {
          total_in_game_hours: 0
        }
      };

      // Advance time by 6 hours (less than 12-hour interval)
      const result = timeManager.advanceTime(calendar, 6 * 60, 'test');

      expect(result.success).toBe(true);
      // Weather should remain unchanged
      expect(result.calendar.weather.condition).toBe(WeatherCondition.CLEAR);
      expect(result.calendar.weather.temperature).toBe(55);
    });
  });

  describe('AC-7: Full Moon Weather Override', () => {
    test('should override weather to Clear on full moon', () => {
      const moonCalculator = new MoonPhaseCalculator();
      const weatherGenerator = new WeatherGenerator();
      const timeManager = new TimeManager({
        moonPhaseCalculator: moonCalculator,
        weatherGenerator
      });

      const calendar = {
        current: {
          date: '2000-01-19',
          time: '20:00',
          day_of_week: 'Moonday',
          season: 'winter'
        },
        metadata: {
          total_in_game_hours: 0
        }
      };

      // Advance to full moon date (2000-01-20)
      const result = timeManager.advanceTime(calendar, 5 * 60, 'test');

      expect(result.success).toBe(true);
      expect(result.calendar.moonPhases.currentPhase).toBe(MoonPhase.FULL_MOON);
      expect(result.calendar.moonPhases.isWerewolfNight).toBe(true);
      expect(result.calendar.weather.condition).toBe(WeatherCondition.CLEAR);
      expect(result.calendar.weather.visibility).toBe('Clear');
      expect(result.calendar.weather.description).toContain('full moon');
    });
  });

  describe('AC-7: Calendar Schema Migration', () => {
    test('should migrate old moon schema to new moonPhases schema', () => {
      const moonCalculator = new MoonPhaseCalculator();
      const timeManager = new TimeManager({ moonPhaseCalculator: moonCalculator });

      const calendar = {
        current: {
          date: '2000-01-06',
          time: '08:00',
          day_of_week: 'Moonday',
          season: 'winter'
        },
        moon: {
          current_phase: 'new',
          days_until_full: 14,
          last_full_moon: null,
          next_full_moon: null
        },
        metadata: {
          total_in_game_hours: 0
        }
      };

      // Advance time by 24 hours (triggers migration)
      const result = timeManager.advanceTime(calendar, 24 * 60, 'test');

      expect(result.success).toBe(true);
      // New schema should exist
      expect(result.calendar.moonPhases).toBeDefined();
      expect(result.calendar.moonPhases.currentPhase).toBe(MoonPhase.NEW_MOON);
      // Old schema should be removed
      expect(result.calendar.moon).toBeUndefined();
    });
  });

  describe('AC-7: Weather Gradual Transitions', () => {
    test('should apply gradual weather transitions over multiple updates', () => {
      const weatherGenerator = new WeatherGenerator();
      const timeManager = new TimeManager({ weatherGenerator });

      let calendar = {
        current: {
          date: '2024-04-15',
          time: '00:00',
          day_of_week: 'Moonday',
          season: 'spring'
        },
        metadata: {
          total_in_game_hours: 0
        }
      };

      const temperatures = [];

      // Advance time in 12-hour intervals, tracking temperature changes
      for (let i = 0; i < 5; i++) {
        const result = timeManager.advanceTime(calendar, 12 * 60, 'test');
        expect(result.success).toBe(true);
        calendar = result.calendar;

        if (calendar.weather) {
          temperatures.push(calendar.weather.temperature);

          // Check gradual change if we have previous temperature
          if (temperatures.length > 1) {
            const tempChange = Math.abs(
              temperatures[temperatures.length - 1] - temperatures[temperatures.length - 2]
            );
            expect(tempChange).toBeLessThanOrEqual(10); // ±10°F limit
          }
        }
      }

      expect(temperatures.length).toBeGreaterThan(0);
    });
  });

  describe('AC-8: Performance', () => {
    test('time advancement with moon/weather updates should complete in < 200ms', () => {
      const moonCalculator = new MoonPhaseCalculator();
      const weatherGenerator = new WeatherGenerator();
      const timeManager = new TimeManager({
        moonPhaseCalculator: moonCalculator,
        weatherGenerator
      });

      const calendar = {
        current: {
          date: '2000-01-06',
          time: '08:00',
          day_of_week: 'Moonday',
          season: 'winter'
        },
        metadata: {
          total_in_game_hours: 0
        }
      };

      const startTime = performance.now();

      // Advance time by 24 hours (triggers both moon and weather updates)
      timeManager.advanceTime(calendar, 24 * 60, 'test');

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200);
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle multi-day advancement with multiple weather updates', () => {
      const moonCalculator = new MoonPhaseCalculator();
      const weatherGenerator = new WeatherGenerator();
      const timeManager = new TimeManager({
        moonPhaseCalculator: moonCalculator,
        weatherGenerator
      });

      let calendar = {
        current: {
          date: '2000-01-06',
          time: '08:00',
          day_of_week: 'Moonday',
          season: 'winter'
        },
        metadata: {
          total_in_game_hours: 0
        }
      };

      // Advance 3 days (72 hours)
      const result = timeManager.advanceTime(calendar, 72 * 60, 'test');

      expect(result.success).toBe(true);
      expect(result.calendar.current.date).toBe('2000-01-09');
      expect(result.calendar.moonPhases).toBeDefined();
      expect(result.calendar.weather).toBeDefined();
    });

    test('should handle progression through full lunar cycle', () => {
      const moonCalculator = new MoonPhaseCalculator();
      const timeManager = new TimeManager({ moonPhaseCalculator: moonCalculator });

      let calendar = {
        current: {
          date: '2000-01-06',
          time: '08:00',
          day_of_week: 'Moonday',
          season: 'winter'
        },
        metadata: {
          total_in_game_hours: 0
        }
      };

      const phases = [];

      // Advance 28 days in 7-day increments
      for (let i = 0; i < 4; i++) {
        const result = timeManager.advanceTime(calendar, 7 * 24 * 60, 'test');
        expect(result.success).toBe(true);
        calendar = result.calendar;
        phases.push(calendar.moonPhases.currentPhase);
      }

      // Should cycle through different phases
      const uniquePhases = [...new Set(phases)];
      expect(uniquePhases.length).toBeGreaterThan(1);
    });
  });
});
