/**
 * Calendar Commands - Slash commands for calendar interaction
 *
 * Implements `/calendar` command to display current game state:
 * - Current date/time with Barovian calendar format
 * - Moon phase with emoji
 * - Weather conditions
 * - Upcoming events (next 5)
 * - Current season and effects
 *
 * Pattern follows Epic 1 command handlers (Story 1.4).
 *
 * @module CalendarCommands
 */

/**
 * Barovian/D&D calendar month names
 */
const MONTH_NAMES = [
  'Hammer',      // 1 - Winter
  'Alturiak',    // 2 - Winter
  'Ches',        // 3 - Spring
  'Tarsakh',     // 4 - Spring
  'Mirtul',      // 5 - Spring
  'Kythorn',     // 6 - Summer
  'Flamerule',   // 7 - Summer
  'Eleasis',     // 8 - Summer
  'Eleint',      // 9 - Fall
  'Marpenoth',   // 10 - Fall
  'Uktar',       // 11 - Fall
  'Nightal'      // 12 - Winter
];

/**
 * Season mappings for Barovian calendar
 */
const SEASON_DATA = {
  'Hammer': { season: 'Winter', effects: 'Harsh cold, frequent snow. Deep drifts block lesser roads. Travel dangerous. Strahd\'s power strongest in the long nights.' },
  'Alturiak': { season: 'Winter', effects: 'Harsh cold, frequent snow. Deep drifts block lesser roads. Travel dangerous. Strahd\'s power strongest in the long nights.' },
  'Ches': { season: 'Spring', effects: 'Mild temperatures, frequent rain, melting snow. Flowers blooming across Barovia\'s valleys. Travel conditions improving.' },
  'Tarsakh': { season: 'Spring', effects: 'Mild temperatures, frequent rain, melting snow. Flowers blooming across Barovia\'s valleys. Travel conditions improving.' },
  'Mirtul': { season: 'Spring', effects: 'Mild temperatures, frequent rain, melting snow. Flowers blooming across Barovia\'s valleys. Travel conditions improving.' },
  'Kythorn': { season: 'Summer', effects: 'Warm days, cool nights. Clear skies during day, occasional thunderstorms in evenings. Ideal travel weather, but beware the heat.' },
  'Flamerule': { season: 'Summer', effects: 'Warm days, cool nights. Clear skies during day, occasional thunderstorms in evenings. Ideal travel weather, but beware the heat.' },
  'Eleasis': { season: 'Summer', effects: 'Warm days, cool nights. Clear skies during day, occasional thunderstorms in evenings. Ideal travel weather, but beware the heat.' },
  'Eleint': { season: 'Fall', effects: 'Cooling temperatures, increasing fog. Leaves turning vibrant reds and oranges. Early darkness, longer nights. Travel becomes more difficult.' },
  'Marpenoth': { season: 'Fall', effects: 'Cooling temperatures, increasing fog. Leaves turning vibrant reds and oranges. Early darkness, longer nights. Travel becomes more difficult.' },
  'Uktar': { season: 'Fall', effects: 'Cooling temperatures, increasing fog. Leaves turning vibrant reds and oranges. Early darkness, longer nights. Travel becomes more difficult.' },
  'Nightal': { season: 'Winter', effects: 'Harsh cold, frequent snow. Deep drifts block lesser roads. Travel dangerous. Strahd\'s power strongest in the long nights.' }
};

/**
 * Moon phase emoji mapping (supports both old and new schema)
 */
const MOON_PHASE_EMOJI = {
  'new': '🌑',
  'new_moon': '🌑', // Story 2-8 new schema
  'waxing_crescent': '🌒',
  'first_quarter': '🌓',
  'waxing_gibbous': '🌔',
  'full': '🌕',
  'full_moon': '🌕', // Story 2-8 new schema
  'waning_gibbous': '🌖',
  'last_quarter': '🌗',
  'waning_crescent': '🌘'
};

/**
 * Moon phase display names (supports both old and new schema)
 */
const MOON_PHASE_NAMES = {
  'new': 'New Moon',
  'new_moon': 'New Moon', // Story 2-8 new schema
  'waxing_crescent': 'Waxing Crescent',
  'first_quarter': 'First Quarter',
  'waxing_gibbous': 'Waxing Gibbous',
  'full': 'Full Moon',
  'full_moon': 'Full Moon', // Story 2-8 new schema
  'waning_gibbous': 'Waning Gibbous',
  'last_quarter': 'Last Quarter',
  'waning_crescent': 'Waning Crescent'
};

/**
 * Weather condition emoji mapping
 */
const WEATHER_EMOJI = {
  'clear': '☀️',
  'partly_cloudy': '⛅',
  'cloudy': '☁️',
  'light_rain': '🌦️',
  'rain': '🌧️',
  'heavy_rain': '🌧️',
  'thunderstorm': '⛈️',
  'light_snow': '🌨️',
  'snow': '🌨️',
  'heavy_snow': '🌨️',
  'blizzard': '🌨️',
  'fog': '🌫️',
  'foggy': '🌫️'
};

/**
 * Ordinal suffix for day of month (1st, 2nd, 3rd, 4th, etc.)
 * @param {number} day - Day of month (1-30)
 * @returns {string} Ordinal suffix (st, nd, rd, th)
 */
function getOrdinalSuffix(day) {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Format date in Barovian calendar format
 * @param {string} date - Date in YYYY-MM-DD or 0YYYY-MM-DD format
 * @param {string} dayOfWeek - Day of week name
 * @returns {string} Formatted date like "Terraday, 10th of Ches, 735 DR"
 */
function formatBarovianDate(date, dayOfWeek) {
  // Parse date (handle both YYYY-MM-DD and 0YYYY-MM-DD)
  const parts = date.split('-');
  const year = parts[0].replace(/^0+/, ''); // Remove leading zeros
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const monthName = MONTH_NAMES[month - 1] || 'Unknown';
  const ordinalSuffix = getOrdinalSuffix(day);

  return `${dayOfWeek}, ${day}${ordinalSuffix} of ${monthName}, ${year} DR`;
}

/**
 * Register calendar-related slash commands
 * @param {Object} commandRouter - CommandRouter instance
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.calendarManager - CalendarManager instance
 * @param {Object} dependencies.moonPhaseCalculator - MoonPhaseCalculator instance (optional, stubbed if not provided)
 * @param {Object} dependencies.weatherGenerator - WeatherGenerator instance (optional, stubbed if not provided)
 */
function registerCalendarCommands(commandRouter, dependencies = {}) {
  const { calendarManager, moonPhaseCalculator, weatherGenerator } = dependencies;

  if (!commandRouter) {
    throw new Error('CommandRouter is required');
  }

  if (!calendarManager) {
    throw new Error('CalendarManager is required in dependencies');
  }

  // Register /calendar command
  commandRouter.registerHandler('calendar', async (deps, args) => {
    return displayCalendar({
      calendarManager: calendarManager || deps.calendarManager,
      moonPhaseCalculator: moonPhaseCalculator || deps.moonPhaseCalculator,
      weatherGenerator: weatherGenerator || deps.weatherGenerator
    });
  });
}

/**
 * Display calendar information
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.calendarManager - CalendarManager instance
 * @param {Object} dependencies.moonPhaseCalculator - MoonPhaseCalculator instance (optional)
 * @param {Object} dependencies.weatherGenerator - WeatherGenerator instance (optional)
 * @returns {Promise<string>} Formatted markdown output
 */
async function displayCalendar(dependencies) {
  const { calendarManager, moonPhaseCalculator, weatherGenerator } = dependencies;

  try {
    // Load calendar
    const calendarResult = await calendarManager.loadCalendar();

    if (!calendarResult.success) {
      return formatError(calendarResult.error || 'Failed to load calendar');
    }

    const calendar = calendarResult.calendar;

    // Build output sections
    const sections = [];

    // 1. Current Date & Time
    sections.push(formatDateTimeSection(calendar));

    // 2. Moon Phase
    sections.push(formatMoonPhaseSection(calendar, moonPhaseCalculator));

    // 3. Current Weather
    sections.push(formatWeatherSection(calendar, weatherGenerator));

    // 4. Upcoming Events
    sections.push(formatUpcomingEventsSection(calendar));

    // 5. Season & Effects
    sections.push(formatSeasonSection(calendar));

    return sections.join('\n\n');

  } catch (error) {
    console.error('Calendar display error:', error);
    return formatError('An unexpected error occurred while displaying the calendar');
  }
}

/**
 * Format error message for user
 * @param {string} errorMessage - Error description
 * @returns {string} User-friendly error message
 */
function formatError(errorMessage) {
  let suggestion = '';

  if (errorMessage.includes('not found') || errorMessage.includes('ENOENT')) {
    suggestion = '\n\n**Suggestion:** Calendar not found. Run `/initialize-calendar` to create one.';
  } else if (errorMessage.includes('parse') || errorMessage.includes('YAML')) {
    suggestion = '\n\n**Suggestion:** Calendar file is corrupted. Check calendar.yaml syntax or recreate it.';
  }

  return `❌ **Calendar Error**\n\n${errorMessage}${suggestion}`;
}

/**
 * Format current date & time section
 * @param {Object} calendar - Calendar object
 * @returns {string} Formatted section
 */
function formatDateTimeSection(calendar) {
  const date = calendar.current?.date || 'Unknown';
  const time = calendar.current?.time || 'Unknown';
  const dayOfWeek = calendar.current?.day_of_week || 'Unknown';

  const formattedDate = formatBarovianDate(date, dayOfWeek);

  return `## Current Date & Time\n\n**Date:** ${formattedDate}\n**Time:** ${time}`;
}

/**
 * Format moon phase section
 * @param {Object} calendar - Calendar object
 * @param {Object} moonPhaseCalculator - MoonPhaseCalculator instance (optional)
 * @returns {string} Formatted section
 */
function formatMoonPhaseSection(calendar, moonPhaseCalculator) {
  let phaseData;

  // Story 2-8: Check for new moonPhases schema first
  if (calendar.moonPhases && calendar.moonPhases.currentPhase) {
    const currentPhase = calendar.moonPhases.currentPhase;
    const nextFullMoon = calendar.moonPhases.nextFullMoon;
    const isWerewolfNight = calendar.moonPhases.isWerewolfNight;

    // Calculate days until full moon
    let daysUntilFull = 0;
    if (nextFullMoon && calendar.current?.date) {
      try {
        const currentDate = new Date(calendar.current.date);
        const fullMoonDate = new Date(nextFullMoon);
        const diff = fullMoonDate.getTime() - currentDate.getTime();
        daysUntilFull = Math.ceil(diff / (1000 * 60 * 60 * 24));
      } catch (e) {
        daysUntilFull = 0;
      }
    }

    phaseData = {
      phase: currentPhase,
      emoji: MOON_PHASE_EMOJI[currentPhase] || '🌑',
      phaseName: MOON_PHASE_NAMES[currentPhase] || 'Unknown Phase',
      daysUntilFull,
      isWerewolfNight
    };
  } else if (moonPhaseCalculator && typeof moonPhaseCalculator.getCurrentPhase === 'function') {
    // Use real calculator
    phaseData = moonPhaseCalculator.getCurrentPhase(calendar.current?.date);
  } else if (calendar.moon) {
    // Fallback to old moon data schema
    const currentPhase = calendar.moon.current_phase || 'new';
    const daysUntilFull = calendar.moon.days_until_full || 14;

    phaseData = {
      phase: currentPhase,
      emoji: MOON_PHASE_EMOJI[currentPhase] || '🌑',
      phaseName: MOON_PHASE_NAMES[currentPhase] || 'New Moon',
      daysUntilFull
    };
  } else {
    // Default stub if no moon data exists
    phaseData = {
      phase: 'new',
      emoji: '🌑',
      phaseName: 'New Moon',
      daysUntilFull: 14
    };
  }

  const emoji = phaseData.emoji || MOON_PHASE_EMOJI[phaseData.phase] || '🌑';
  const phaseName = phaseData.phaseName || MOON_PHASE_NAMES[phaseData.phase] || 'Unknown Phase';

  let output = `## Moon Phase\n\n**Current Phase:** ${phaseName} ${emoji}`;

  if (phaseData.daysUntilFull !== undefined && phaseData.daysUntilFull >= 0) {
    if (phaseData.daysUntilFull === 0) {
      output += `\n**Tonight is the Full Moon!**`;
    } else {
      output += `\n**Days until Full Moon:** ${phaseData.daysUntilFull}`;
    }
  }

  if (phaseData.isWerewolfNight) {
    output += `\n**⚠️ Werewolf Activity:** High (Full Moon)`;
  }

  return output;
}

/**
 * Format weather section
 * @param {Object} calendar - Calendar object
 * @param {Object} weatherGenerator - WeatherGenerator instance (optional)
 * @returns {string} Formatted section
 */
function formatWeatherSection(calendar, weatherGenerator) {
  let weatherData;

  // Story 2-8: Check for new weather schema with description field
  if (calendar.weather && calendar.weather.condition) {
    const condition = calendar.weather.condition;
    const temperature = calendar.weather.temperature !== undefined ? calendar.weather.temperature : 50;
    const visibility = calendar.weather.visibility || 'Clear';
    const description = calendar.weather.description || '';

    weatherData = {
      condition: condition,
      emoji: WEATHER_EMOJI[condition.toLowerCase().replace(/\s/g, '_')] || '☀️',
      temperature,
      visibility,
      description
    };
  } else if (weatherGenerator && typeof weatherGenerator.getCurrentWeather === 'function') {
    // Use real generator
    const season = determineSeason(calendar.current?.date).season;
    const moonPhase = calendar.moon?.current_phase || calendar.moonPhases?.currentPhase || 'new';
    weatherData = weatherGenerator.getCurrentWeather(calendar.current?.date, season, moonPhase);
  } else if (calendar.weather) {
    // Fallback to old weather schema
    const condition = calendar.weather.current || 'clear';
    const temperature = calendar.weather.temperature !== undefined ? calendar.weather.temperature : 50;
    const visibility = calendar.weather.visibility || 'good';

    weatherData = {
      condition: condition,
      emoji: WEATHER_EMOJI[condition] || '☀️',
      temperature,
      visibility
    };
  } else {
    // Default stub if no weather data exists
    weatherData = {
      condition: 'Clear',
      emoji: '☀️',
      temperature: 50,
      visibility: 'Clear'
    };
  }

  const emoji = weatherData.emoji || WEATHER_EMOJI[weatherData.condition.toLowerCase().replace(/\s/g, '_')] || '☀️';
  // Normalize condition name: convert underscores to spaces and title case
  const conditionName = weatherData.condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  // Normalize visibility: title case
  const visibilityDisplay = weatherData.visibility.charAt(0).toUpperCase() + weatherData.visibility.slice(1);

  let output = `## Current Weather\n\n**Condition:** ${conditionName} ${emoji}\n**Temperature:** ${weatherData.temperature}°F\n**Visibility:** ${visibilityDisplay}`;

  // Story 2-8: Add atmospheric description if available
  if (weatherData.description) {
    output += `\n\n${weatherData.description}`;
  }

  return output;
}

/**
 * Format upcoming events section
 * @param {Object} calendar - Calendar object
 * @returns {string} Formatted section
 */
function formatUpcomingEventsSection(calendar) {
  const events = calendar.events || [];

  // Filter for upcoming events (status: pending or scheduled)
  const upcomingEvents = events.filter(event => {
    return event.status === 'pending' || event.status === 'scheduled';
  });

  if (upcomingEvents.length === 0) {
    return `## Upcoming Events\n\nNo events scheduled in the next 10 days`;
  }

  // Sort chronologically by triggerDate, then triggerTime
  const sortedEvents = upcomingEvents.sort((a, b) => {
    const dateCompare = (a.triggerDate || '').localeCompare(b.triggerDate || '');
    if (dateCompare !== 0) return dateCompare;
    return (a.triggerTime || '00:00').localeCompare(b.triggerTime || '00:00');
  });

  // Take first 5
  const next5 = sortedEvents.slice(0, 5);

  const eventLines = next5.map(event => {
    const name = event.name || event.eventId || 'Unnamed Event';
    const date = event.triggerDate || 'Unknown';
    const time = event.triggerTime || 'Unknown';
    const recurring = event.recurring ? ` (Recurring - ${event.recurInterval || 'unknown'})` : '';

    return `- **${name}** on ${date} at ${time}${recurring}`;
  });

  return `## Upcoming Events\n\n${eventLines.join('\n')}`;
}

/**
 * Format season & effects section
 * @param {Object} calendar - Calendar object
 * @returns {string} Formatted section
 */
function formatSeasonSection(calendar) {
  const seasonInfo = determineSeason(calendar.current?.date);

  return `## Season & Effects\n\n**Season:** ${seasonInfo.season}\n**Effects:** ${seasonInfo.effects}`;
}

/**
 * Determine current season from date
 * @param {string} date - Date in YYYY-MM-DD or 0YYYY-MM-DD format
 * @returns {Object} {season: string, effects: string}
 */
function determineSeason(date) {
  if (!date) {
    return { season: 'Unknown', effects: 'Season information unavailable' };
  }

  // Parse month
  const parts = date.split('-');
  const month = parseInt(parts[1], 10);

  const monthName = MONTH_NAMES[month - 1];

  if (!monthName) {
    return { season: 'Unknown', effects: 'Season information unavailable' };
  }

  return SEASON_DATA[monthName] || { season: 'Unknown', effects: 'Season information unavailable' };
}

module.exports = {
  registerCalendarCommands,
  displayCalendar,
  determineSeason,
  formatBarovianDate,
  // Exported for testing
  formatDateTimeSection,
  formatMoonPhaseSection,
  formatWeatherSection,
  formatUpcomingEventsSection,
  formatSeasonSection,
  formatError
};
