/**
 * Unit tests for CalendarCommands
 * Tests AC-1 through AC-8 for Story 2.5
 */

const {
  registerCalendarCommands,
  displayCalendar,
  determineSeason,
  formatBarovianDate,
  formatDateTimeSection,
  formatMoonPhaseSection,
  formatWeatherSection,
  formatUpcomingEventsSection,
  formatSeasonSection,
  formatError
} = require('../../src/commands/calendar-commands');

describe('CalendarCommands', () => {
  let mockCommandRouter;
  let mockCalendarManager;
  let mockMoonPhaseCalculator;
  let mockWeatherGenerator;

  beforeEach(() => {
    // Mock CommandRouter
    mockCommandRouter = {
      registerHandler: jest.fn()
    };

    // Mock CalendarManager
    mockCalendarManager = {
      loadCalendar: jest.fn()
    };

    // Mock MoonPhaseCalculator
    mockMoonPhaseCalculator = {
      getCurrentPhase: jest.fn()
    };

    // Mock WeatherGenerator
    mockWeatherGenerator = {
      getCurrentWeather: jest.fn()
    };
  });

  // ========================================================================
  // AC-1: Calendar Command Handler Module
  // ========================================================================

  describe('registerCalendarCommands (AC-1)', () => {
    test('should throw if CommandRouter not provided', () => {
      expect(() => {
        registerCalendarCommands(null, { calendarManager: mockCalendarManager });
      }).toThrow('CommandRouter is required');
    });

    test('should throw if CalendarManager not provided', () => {
      expect(() => {
        registerCalendarCommands(mockCommandRouter, {});
      }).toThrow('CalendarManager is required');
    });

    test('should register /calendar command', () => {
      registerCalendarCommands(mockCommandRouter, {
        calendarManager: mockCalendarManager
      });

      expect(mockCommandRouter.registerHandler).toHaveBeenCalledWith(
        'calendar',
        expect.any(Function)
      );
    });

    test('should accept optional moonPhaseCalculator and weatherGenerator', () => {
      expect(() => {
        registerCalendarCommands(mockCommandRouter, {
          calendarManager: mockCalendarManager,
          moonPhaseCalculator: mockMoonPhaseCalculator,
          weatherGenerator: mockWeatherGenerator
        });
      }).not.toThrow();
    });
  });

  // ========================================================================
  // AC-2: Calendar Display - Current Date/Time
  // ========================================================================

  describe('formatBarovianDate', () => {
    test('should format date with ordinal suffix (1st, 2nd, 3rd, 4th)', () => {
      expect(formatBarovianDate('0735-03-01', 'Moonday')).toBe('Moonday, 1st of Ches, 735 DR');
      expect(formatBarovianDate('0735-03-02', 'Toilday')).toBe('Toilday, 2nd of Ches, 735 DR');
      expect(formatBarovianDate('0735-03-03', 'Wealday')).toBe('Wealday, 3rd of Ches, 735 DR');
      expect(formatBarovianDate('0735-03-04', 'Oathday')).toBe('Oathday, 4th of Ches, 735 DR');
    });

    test('should handle teen ordinals correctly (11th, 12th, 13th)', () => {
      expect(formatBarovianDate('0735-03-11', 'Moonday')).toBe('Moonday, 11th of Ches, 735 DR');
      expect(formatBarovianDate('0735-03-12', 'Toilday')).toBe('Toilday, 12th of Ches, 735 DR');
      expect(formatBarovianDate('0735-03-13', 'Wealday')).toBe('Wealday, 13th of Ches, 735 DR');
    });

    test('should handle dates without leading zero', () => {
      expect(formatBarovianDate('735-03-10', 'Terraday')).toBe('Terraday, 10th of Ches, 735 DR');
    });

    test('should format all 12 months correctly', () => {
      expect(formatBarovianDate('0735-01-15', 'Moonday')).toContain('Hammer');
      expect(formatBarovianDate('0735-02-15', 'Moonday')).toContain('Alturiak');
      expect(formatBarovianDate('0735-03-15', 'Moonday')).toContain('Ches');
      expect(formatBarovianDate('0735-04-15', 'Moonday')).toContain('Tarsakh');
      expect(formatBarovianDate('0735-05-15', 'Moonday')).toContain('Mirtul');
      expect(formatBarovianDate('0735-06-15', 'Moonday')).toContain('Kythorn');
      expect(formatBarovianDate('0735-07-15', 'Moonday')).toContain('Flamerule');
      expect(formatBarovianDate('0735-08-15', 'Moonday')).toContain('Eleasis');
      expect(formatBarovianDate('0735-09-15', 'Moonday')).toContain('Eleint');
      expect(formatBarovianDate('0735-10-15', 'Moonday')).toContain('Marpenoth');
      expect(formatBarovianDate('0735-11-15', 'Moonday')).toContain('Uktar');
      expect(formatBarovianDate('0735-12-15', 'Moonday')).toContain('Nightal');
    });
  });

  describe('formatDateTimeSection (AC-2)', () => {
    test('should format current date and time', () => {
      const calendar = {
        current: {
          date: '0735-03-10',
          time: '14:30',
          day_of_week: 'Terraday'
        }
      };

      const result = formatDateTimeSection(calendar);

      expect(result).toContain('## Current Date & Time');
      expect(result).toContain('Terraday, 10th of Ches, 735 DR');
      expect(result).toContain('14:30');
    });

    test('should handle missing date/time gracefully', () => {
      const calendar = { current: {} };

      const result = formatDateTimeSection(calendar);

      expect(result).toContain('## Current Date & Time');
      expect(result).toContain('Unknown');
    });
  });

  // ========================================================================
  // AC-3: Calendar Display - Moon Phase
  // ========================================================================

  describe('formatMoonPhaseSection (AC-3)', () => {
    test('should display all 8 moon phases with correct emoji', () => {
      const phases = [
        { phase: 'new', emoji: '🌑', name: 'New Moon' },
        { phase: 'waxing_crescent', emoji: '🌒', name: 'Waxing Crescent' },
        { phase: 'first_quarter', emoji: '🌓', name: 'First Quarter' },
        { phase: 'waxing_gibbous', emoji: '🌔', name: 'Waxing Gibbous' },
        { phase: 'full', emoji: '🌕', name: 'Full Moon' },
        { phase: 'waning_gibbous', emoji: '🌖', name: 'Waning Gibbous' },
        { phase: 'last_quarter', emoji: '🌗', name: 'Last Quarter' },
        { phase: 'waning_crescent', emoji: '🌘', name: 'Waning Crescent' }
      ];

      phases.forEach(({ phase, emoji, name }) => {
        const calendar = {
          current: { date: '0735-03-10' },
          moon: { current_phase: phase }
        };

        const result = formatMoonPhaseSection(calendar);

        expect(result).toContain('## Moon Phase');
        expect(result).toContain(name);
        expect(result).toContain(emoji);
      });
    });

    test('should use MoonPhaseCalculator if provided', () => {
      mockMoonPhaseCalculator.getCurrentPhase.mockReturnValue({
        phase: 'full',
        emoji: '🌕',
        phaseName: 'Full Moon',
        nextPhase: 'waning_gibbous',
        nextPhaseName: 'Waning Gibbous',
        nextPhaseDate: '17th of Ches'
      });

      const calendar = {
        current: { date: '0735-03-10' },
        moon: {}
      };

      const result = formatMoonPhaseSection(calendar, mockMoonPhaseCalculator);

      expect(mockMoonPhaseCalculator.getCurrentPhase).toHaveBeenCalledWith('0735-03-10');
      expect(result).toContain('Full Moon 🌕');
      expect(result).toContain('Waning Gibbous on 17th of Ches');
    });

    test('should use calendar data if MoonPhaseCalculator not provided', () => {
      const calendar = {
        current: { date: '0735-03-10' },
        moon: {
          current_phase: 'full',
          days_until_full: 0
        }
      };

      const result = formatMoonPhaseSection(calendar);

      expect(result).toContain('Full Moon 🌕');
      expect(result).toContain('Days until Full Moon');
    });
  });

  // ========================================================================
  // AC-4: Calendar Display - Weather Conditions
  // ========================================================================

  describe('formatWeatherSection (AC-4)', () => {
    test('should display weather with emoji', () => {
      const weatherConditions = [
        { condition: 'clear', emoji: '☀️' },
        { condition: 'cloudy', emoji: '☁️' },
        { condition: 'light_rain', emoji: '🌦️' },
        { condition: 'rain', emoji: '🌧️' },
        { condition: 'thunderstorm', emoji: '⛈️' },
        { condition: 'light_snow', emoji: '🌨️' },
        { condition: 'fog', emoji: '🌫️' }
      ];

      weatherConditions.forEach(({ condition, emoji }) => {
        const calendar = {
          current: { date: '0735-03-10' },
          weather: {
            current: condition,
            temperature: 45,
            visibility: 'moderate'
          }
        };

        const result = formatWeatherSection(calendar);

        expect(result).toContain('## Current Weather');
        expect(result).toContain(emoji);
        expect(result).toContain('45°F');
        expect(result).toContain('Moderate');
      });
    });

    test('should use WeatherGenerator if provided', () => {
      mockWeatherGenerator.getCurrentWeather.mockReturnValue({
        condition: 'light_rain',
        emoji: '🌦️',
        temperature: 45,
        visibility: 'moderate'
      });

      const calendar = {
        current: { date: '0735-03-10' },
        weather: {}
      };

      const result = formatWeatherSection(calendar, mockWeatherGenerator);

      expect(mockWeatherGenerator.getCurrentWeather).toHaveBeenCalled();
      expect(result).toContain('Light Rain 🌦️');
      expect(result).toContain('45°F');
    });
  });

  // ========================================================================
  // AC-5: Calendar Display - Upcoming Events
  // ========================================================================

  describe('formatUpcomingEventsSection (AC-5)', () => {
    test('should show "no events" message when calendar has no events', () => {
      const calendar = { events: [] };

      const result = formatUpcomingEventsSection(calendar);

      expect(result).toContain('## Upcoming Events');
      expect(result).toContain('No events scheduled in the next 10 days');
    });

    test('should list upcoming events chronologically', () => {
      const calendar = {
        events: [
          { name: 'Event C', triggerDate: '0735-03-15', triggerTime: '10:00', status: 'pending' },
          { name: 'Event A', triggerDate: '0735-03-12', triggerTime: '08:00', status: 'pending' },
          { name: 'Event B', triggerDate: '0735-03-12', triggerTime: '14:00', status: 'pending' }
        ]
      };

      const result = formatUpcomingEventsSection(calendar);

      expect(result).toContain('## Upcoming Events');
      expect(result).toContain('**Event A** on 0735-03-12 at 08:00');
      expect(result).toContain('**Event B** on 0735-03-12 at 14:00');
      expect(result).toContain('**Event C** on 0735-03-15 at 10:00');

      // Verify chronological order
      const eventAIndex = result.indexOf('Event A');
      const eventBIndex = result.indexOf('Event B');
      const eventCIndex = result.indexOf('Event C');
      expect(eventAIndex).toBeLessThan(eventBIndex);
      expect(eventBIndex).toBeLessThan(eventCIndex);
    });

    test('should show only next 5 events when more than 5 exist', () => {
      const calendar = {
        events: [
          { name: 'Event 1', triggerDate: '0735-03-11', triggerTime: '08:00', status: 'pending' },
          { name: 'Event 2', triggerDate: '0735-03-12', triggerTime: '08:00', status: 'pending' },
          { name: 'Event 3', triggerDate: '0735-03-13', triggerTime: '08:00', status: 'pending' },
          { name: 'Event 4', triggerDate: '0735-03-14', triggerTime: '08:00', status: 'pending' },
          { name: 'Event 5', triggerDate: '0735-03-15', triggerTime: '08:00', status: 'pending' },
          { name: 'Event 6', triggerDate: '0735-03-16', triggerTime: '08:00', status: 'pending' },
          { name: 'Event 7', triggerDate: '0735-03-17', triggerTime: '08:00', status: 'pending' }
        ]
      };

      const result = formatUpcomingEventsSection(calendar);

      expect(result).toContain('Event 1');
      expect(result).toContain('Event 2');
      expect(result).toContain('Event 3');
      expect(result).toContain('Event 4');
      expect(result).toContain('Event 5');
      expect(result).not.toContain('Event 6');
      expect(result).not.toContain('Event 7');
    });

    test('should show recurring indicator for recurring events', () => {
      const calendar = {
        events: [
          { name: 'Daily Bell', triggerDate: '0735-03-12', triggerTime: '06:00', status: 'pending', recurring: true, recurInterval: 'daily' },
          { name: 'Weekly Market', triggerDate: '0735-03-15', triggerTime: '08:00', status: 'pending', recurring: true, recurInterval: 'weekly' }
        ]
      };

      const result = formatUpcomingEventsSection(calendar);

      expect(result).toContain('**Daily Bell** on 0735-03-12 at 06:00 (Recurring - daily)');
      expect(result).toContain('**Weekly Market** on 0735-03-15 at 08:00 (Recurring - weekly)');
    });

    test('should filter out triggered/completed events', () => {
      const calendar = {
        events: [
          { name: 'Future Event', triggerDate: '0735-03-15', triggerTime: '10:00', status: 'pending' },
          { name: 'Past Event', triggerDate: '0735-03-01', triggerTime: '10:00', status: 'triggered' },
          { name: 'Completed Event', triggerDate: '0735-03-02', triggerTime: '10:00', status: 'completed' }
        ]
      };

      const result = formatUpcomingEventsSection(calendar);

      expect(result).toContain('Future Event');
      expect(result).not.toContain('Past Event');
      expect(result).not.toContain('Completed Event');
    });
  });

  // ========================================================================
  // AC-6: Calendar Display - Seasonal Information
  // ========================================================================

  describe('determineSeason (AC-6)', () => {
    test('should determine Spring season (Ches, Tarsakh, Mirtul)', () => {
      expect(determineSeason('0735-03-15').season).toBe('Spring');
      expect(determineSeason('0735-04-15').season).toBe('Spring');
      expect(determineSeason('0735-05-15').season).toBe('Spring');
    });

    test('should determine Summer season (Kythorn, Flamerule, Eleasis)', () => {
      expect(determineSeason('0735-06-15').season).toBe('Summer');
      expect(determineSeason('0735-07-15').season).toBe('Summer');
      expect(determineSeason('0735-08-15').season).toBe('Summer');
    });

    test('should determine Fall season (Eleint, Marpenoth, Uktar)', () => {
      expect(determineSeason('0735-09-15').season).toBe('Fall');
      expect(determineSeason('0735-10-15').season).toBe('Fall');
      expect(determineSeason('0735-11-15').season).toBe('Fall');
    });

    test('should determine Winter season (Nightal, Hammer, Alturiak)', () => {
      expect(determineSeason('0735-12-15').season).toBe('Winter');
      expect(determineSeason('0735-01-15').season).toBe('Winter');
      expect(determineSeason('0735-02-15').season).toBe('Winter');
    });

    test('should include seasonal effects descriptions', () => {
      expect(determineSeason('0735-03-15').effects).toContain('Mild temperatures');
      expect(determineSeason('0735-06-15').effects).toContain('Warm days');
      expect(determineSeason('0735-09-15').effects).toContain('Cooling temperatures');
      expect(determineSeason('0735-12-15').effects).toContain('Harsh cold');
    });

    test('should handle invalid date gracefully', () => {
      expect(determineSeason(null).season).toBe('Unknown');
      expect(determineSeason('').season).toBe('Unknown');
    });
  });

  describe('formatSeasonSection (AC-6)', () => {
    test('should format season information', () => {
      const calendar = {
        current: { date: '0735-03-10' }
      };

      const result = formatSeasonSection(calendar);

      expect(result).toContain('## Season & Effects');
      expect(result).toContain('**Season:** Spring');
      expect(result).toContain('**Effects:**');
      expect(result).toContain('Mild temperatures');
    });
  });

  // ========================================================================
  // AC-8: Error Handling
  // ========================================================================

  describe('displayCalendar error handling (AC-8)', () => {
    test('should return user-friendly error when calendar not found', async () => {
      mockCalendarManager.loadCalendar.mockResolvedValue({
        success: false,
        error: 'ENOENT: no such file or directory'
      });

      const result = await displayCalendar({ calendarManager: mockCalendarManager });

      expect(result).toContain('❌ **Calendar Error**');
      expect(result).toContain('ENOENT');
      expect(result).toContain('/initialize-calendar');
    });

    test('should return user-friendly error when calendar is corrupted', async () => {
      mockCalendarManager.loadCalendar.mockResolvedValue({
        success: false,
        error: 'Failed to parse YAML'
      });

      const result = await displayCalendar({ calendarManager: mockCalendarManager });

      expect(result).toContain('❌ **Calendar Error**');
      expect(result).toContain('parse');
      expect(result).toContain('calendar.yaml syntax');
    });

    test('should handle unexpected errors gracefully', async () => {
      mockCalendarManager.loadCalendar.mockRejectedValue(new Error('Unexpected error'));

      const result = await displayCalendar({ calendarManager: mockCalendarManager });

      expect(result).toContain('❌ **Calendar Error**');
      expect(result).toContain('unexpected error');
    });

    test('should not throw exceptions', async () => {
      mockCalendarManager.loadCalendar.mockRejectedValue(new Error('Test error'));

      await expect(displayCalendar({ calendarManager: mockCalendarManager })).resolves.toBeDefined();
    });
  });

  describe('formatError', () => {
    test('should suggest /initialize-calendar for missing calendar', () => {
      const result = formatError('Calendar not found');

      expect(result).toContain('/initialize-calendar');
    });

    test('should suggest checking syntax for parse errors', () => {
      const result = formatError('Failed to parse YAML content');

      expect(result).toContain('calendar.yaml syntax');
    });
  });

  // ========================================================================
  // Integration Test
  // ========================================================================

  describe('displayCalendar integration (AC-1 through AC-6)', () => {
    test('should display all sections with valid calendar data', async () => {
      mockCalendarManager.loadCalendar.mockResolvedValue({
        success: true,
        calendar: {
          current: {
            date: '0735-03-10',
            time: '14:30',
            day_of_week: 'Terraday'
          },
          moon: {
            current_phase: 'full',
            days_until_full: 0
          },
          weather: {
            current: 'light_rain',
            temperature: 45,
            visibility: 'moderate'
          },
          events: [
            { name: 'Morning Bell', triggerDate: '0735-03-11', triggerTime: '06:00', status: 'pending' },
            { name: 'Market Day', triggerDate: '0735-03-15', triggerTime: '08:00', status: 'pending', recurring: true, recurInterval: 'weekly' }
          ]
        }
      });

      const result = await displayCalendar({ calendarManager: mockCalendarManager });

      // Verify all sections present
      expect(result).toContain('## Current Date & Time');
      expect(result).toContain('Terraday, 10th of Ches, 735 DR');
      expect(result).toContain('14:30');

      expect(result).toContain('## Moon Phase');
      expect(result).toContain('Full Moon 🌕');

      expect(result).toContain('## Current Weather');
      expect(result).toContain('Light Rain');
      expect(result).toContain('45°F');

      expect(result).toContain('## Upcoming Events');
      expect(result).toContain('Morning Bell');
      expect(result).toContain('Market Day');
      expect(result).toContain('(Recurring - weekly)');

      expect(result).toContain('## Season & Effects');
      expect(result).toContain('Spring');
    });
  });
});
