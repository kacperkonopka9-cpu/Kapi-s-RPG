/**
 * WeatherGenerator - Generates atmospheric weather conditions for the game calendar
 *
 * Provides seasonal weather generation with LLM-friendly descriptions:
 * - Seasonal temperature ranges (Spring: 40-65°F, Summer: 60-85°F, Fall: 35-60°F, Winter: 15-45°F)
 * - Weather conditions influenced by season (snow in winter, rain in spring, etc.)
 * - Gradual weather transitions (no drastic changes)
 * - Full moon overrides weather to "Clear skies" for visibility
 * - LLM-friendly atmospheric descriptions for narrative enrichment
 *
 * Key Features:
 * - Seasonal pattern awareness
 * - Gradual transition support (cache previous weather)
 * - Dependency injection for testability (seeded random for deterministic tests)
 * - Graceful error handling (no exceptions thrown)
 * - Performance: < 10ms for generation
 *
 * Pattern follows Epic 2 architectural standards.
 *
 * @module WeatherGenerator
 */

/**
 * Weather condition types
 */
const WeatherCondition = {
  CLEAR: 'Clear',
  OVERCAST: 'Overcast',
  FOG: 'Fog',
  LIGHT_RAIN: 'Light Rain',
  HEAVY_RAIN: 'Heavy Rain',
  LIGHT_SNOW: 'Light Snow',
  HEAVY_SNOW: 'Heavy Snow',
  STORM: 'Storm'
};

/**
 * Visibility levels
 */
const Visibility = {
  CLEAR: 'Clear',
  REDUCED: 'Reduced',
  POOR: 'Poor'
};

/**
 * Season names (lowercase for matching)
 */
const VALID_SEASONS = ['spring', 'summer', 'autumn', 'fall', 'winter'];

/**
 * Seasonal weather configuration
 */
const SEASONAL_CONFIG = {
  spring: {
    tempMin: 40,
    tempMax: 65,
    conditions: {
      [WeatherCondition.CLEAR]: 0.25,
      [WeatherCondition.OVERCAST]: 0.20,
      [WeatherCondition.FOG]: 0.10,
      [WeatherCondition.LIGHT_RAIN]: 0.25,
      [WeatherCondition.HEAVY_RAIN]: 0.15,
      [WeatherCondition.STORM]: 0.05
    }
  },
  summer: {
    tempMin: 60,
    tempMax: 85,
    conditions: {
      [WeatherCondition.CLEAR]: 0.50,
      [WeatherCondition.OVERCAST]: 0.25,
      [WeatherCondition.FOG]: 0.05,
      [WeatherCondition.LIGHT_RAIN]: 0.10,
      [WeatherCondition.STORM]: 0.10
    }
  },
  autumn: {
    tempMin: 35,
    tempMax: 60,
    conditions: {
      [WeatherCondition.CLEAR]: 0.20,
      [WeatherCondition.OVERCAST]: 0.30,
      [WeatherCondition.FOG]: 0.25,
      [WeatherCondition.LIGHT_RAIN]: 0.15,
      [WeatherCondition.HEAVY_RAIN]: 0.08,
      [WeatherCondition.STORM]: 0.02
    }
  },
  fall: { // Alias for autumn
    tempMin: 35,
    tempMax: 60,
    conditions: {
      [WeatherCondition.CLEAR]: 0.20,
      [WeatherCondition.OVERCAST]: 0.30,
      [WeatherCondition.FOG]: 0.25,
      [WeatherCondition.LIGHT_RAIN]: 0.15,
      [WeatherCondition.HEAVY_RAIN]: 0.08,
      [WeatherCondition.STORM]: 0.02
    }
  },
  winter: {
    tempMin: 15,
    tempMax: 45,
    conditions: {
      [WeatherCondition.CLEAR]: 0.20,
      [WeatherCondition.OVERCAST]: 0.25,
      [WeatherCondition.FOG]: 0.10,
      [WeatherCondition.LIGHT_SNOW]: 0.25,
      [WeatherCondition.HEAVY_SNOW]: 0.15,
      [WeatherCondition.STORM]: 0.05
    }
  }
};

/**
 * WeatherGenerator class handles weather generation
 */
class WeatherGenerator {
  /**
   * Creates a new WeatherGenerator instance
   *
   * @param {Object} deps - Dependencies for injection (testing)
   * @param {Function} deps.random - Random function (defaults to Math.random, can be seeded for testing)
   */
  constructor(deps = {}) {
    this.random = deps.random || Math.random;
  }

  /**
   * Select weather condition based on seasonal probabilities
   *
   * @param {Object} conditionProbabilities - Condition => probability map
   * @returns {string} Selected weather condition
   * @private
   */
  _selectCondition(conditionProbabilities) {
    const rand = this.random();
    let cumulative = 0;

    for (const [condition, probability] of Object.entries(conditionProbabilities)) {
      cumulative += probability;
      if (rand < cumulative) {
        return condition;
      }
    }

    // Fallback (should not reach here if probabilities sum to 1.0)
    return WeatherCondition.CLEAR;
  }

  /**
   * Apply gradual transition from previous weather
   *
   * @param {string} newCondition - Newly generated condition
   * @param {Object} previousWeather - Previous weather state
   * @returns {string} Adjusted condition (gradual transition)
   * @private
   */
  _applyGradualTransition(newCondition, previousWeather) {
    if (!previousWeather || !previousWeather.condition) {
      return newCondition;
    }

    const prevCondition = previousWeather.condition;

    // Define severity levels for transitions
    const severityLevels = [
      WeatherCondition.CLEAR,
      WeatherCondition.OVERCAST,
      WeatherCondition.FOG,
      WeatherCondition.LIGHT_RAIN,
      WeatherCondition.LIGHT_SNOW,
      WeatherCondition.HEAVY_RAIN,
      WeatherCondition.HEAVY_SNOW,
      WeatherCondition.STORM
    ];

    const prevIndex = severityLevels.indexOf(prevCondition);
    const newIndex = severityLevels.indexOf(newCondition);

    // Allow 1-2 step transitions only
    if (Math.abs(newIndex - prevIndex) > 2) {
      // Limit to 2-step transition
      const direction = newIndex > prevIndex ? 1 : -1;
      const adjustedIndex = prevIndex + (2 * direction);
      return severityLevels[Math.max(0, Math.min(severityLevels.length - 1, adjustedIndex))];
    }

    return newCondition;
  }

  /**
   * Calculate temperature with gradual changes
   *
   * @param {number} minTemp - Seasonal minimum temperature
   * @param {number} maxTemp - Seasonal maximum temperature
   * @param {Object} previousWeather - Previous weather state
   * @returns {number} Temperature in Fahrenheit
   * @private
   */
  _calculateTemperature(minTemp, maxTemp, previousWeather) {
    // Generate base temperature within seasonal range
    const baseTemp = minTemp + (this.random() * (maxTemp - minTemp));

    // Apply gradual change if previous weather exists
    if (previousWeather && typeof previousWeather.temperature === 'number') {
      const prevTemp = previousWeather.temperature;
      const maxChange = 10; // Limit to ±10°F change

      // Constrain new temperature to be within ±10°F of previous
      const constrainedTemp = Math.max(
        prevTemp - maxChange,
        Math.min(prevTemp + maxChange, baseTemp)
      );

      return Math.round(constrainedTemp);
    }

    return Math.round(baseTemp);
  }

  /**
   * Determine visibility based on condition
   *
   * @param {string} condition - Weather condition
   * @returns {string} Visibility level
   * @private
   */
  _determineVisibility(condition) {
    switch (condition) {
      case WeatherCondition.CLEAR:
      case WeatherCondition.OVERCAST:
        return Visibility.CLEAR;

      case WeatherCondition.LIGHT_RAIN:
      case WeatherCondition.LIGHT_SNOW:
        return Visibility.REDUCED;

      case WeatherCondition.FOG:
      case WeatherCondition.HEAVY_RAIN:
      case WeatherCondition.HEAVY_SNOW:
      case WeatherCondition.STORM:
        return Visibility.POOR;

      default:
        return Visibility.CLEAR;
    }
  }

  /**
   * Generate LLM-friendly atmospheric description
   *
   * @param {string} condition - Weather condition
   * @param {number} temperature - Temperature in Fahrenheit
   * @param {string} visibility - Visibility level
   * @returns {string} Atmospheric prose description
   * @private
   */
  _generateDescription(condition, temperature, visibility) {
    const descriptions = {
      [WeatherCondition.CLEAR]: [
        `The sky is clear and ${temperature < 40 ? 'crisp' : temperature > 70 ? 'warm' : 'mild'}, with excellent visibility across the mist-shrouded landscape.`,
        `Crystal-clear skies stretch overhead, the ${temperature < 40 ? 'cold' : temperature > 70 ? 'warm' : 'temperate'} air allowing you to see for miles.`,
        `A cloudless sky presides over the land, the ${temperature < 40 ? 'chill' : temperature > 70 ? 'heat' : 'pleasant'} air refreshing against your skin.`
      ],
      [WeatherCondition.OVERCAST]: [
        `Heavy clouds blanket the sky, casting a dull gray pall over everything. The air is ${temperature < 40 ? 'cold' : temperature > 70 ? 'muggy' : 'cool'} and oppressive.`,
        `An overcast sky looms above, thick clouds blocking any hint of sun. The ${temperature < 40 ? 'bitter' : temperature > 70 ? 'humid' : 'somber'} atmosphere weighs on your spirits.`,
        `Gray clouds stretch from horizon to horizon, creating a monotonous ceiling. The ${temperature < 40 ? 'chilly' : temperature > 70 ? 'stifling' : 'dreary'} weather dampens your mood.`
      ],
      [WeatherCondition.FOG]: [
        `Thick fog rolls across the valley, reducing visibility to mere feet. The ${temperature < 40 ? 'cold' : temperature > 70 ? 'warm' : 'damp'} mist clings to everything, muffling sounds.`,
        `Dense fog shrouds the landscape in an eerie veil, making it difficult to see more than a few yards ahead. The air is ${temperature < 40 ? 'freezing and damp' : temperature > 70 ? 'humid and oppressive' : 'cool and clammy'}.`,
        `A blanket of fog obscures the world around you, swirling in ${temperature < 40 ? 'icy' : temperature > 70 ? 'warm' : 'cool'} tendrils that make navigation treacherous.`
      ],
      [WeatherCondition.LIGHT_RAIN]: [
        `A light drizzle falls steadily, creating a rhythmic patter on leaves and stone. The ${temperature < 40 ? 'cold' : temperature > 70 ? 'warm' : 'cool'} rain is persistent but not unpleasant.`,
        `Gentle rain descends from leaden skies, soaking the ground with a ${temperature < 40 ? 'frigid' : temperature > 70 ? 'tepid' : 'cool'} persistence.`,
        `A steady sprinkle of rain dampens the air, the ${temperature < 40 ? 'icy' : temperature > 70 ? 'muggy' : 'damp'} droplets clinging to cloaks and hair.`
      ],
      [WeatherCondition.HEAVY_RAIN]: [
        `Torrential rain pounds down relentlessly, creating rivers in the streets and reducing visibility significantly. The ${temperature < 40 ? 'freezing' : temperature > 70 ? 'warm' : 'cold'} deluge soaks through all but the best protection.`,
        `Heavy sheets of rain hammer the ground, making it nearly impossible to see or hear anything beyond a few yards. The ${temperature < 40 ? 'bitter' : temperature > 70 ? 'stifling' : 'miserable'} downpour shows no sign of letting up.`,
        `Rain falls in massive curtains, transforming the world into a ${temperature < 40 ? 'freezing' : temperature > 70 ? 'humid' : 'dreary'} waterscape where every step risks slipping.`
      ],
      [WeatherCondition.LIGHT_SNOW]: [
        `Delicate snowflakes drift down from gray skies, dusting the ground in a thin layer of white. The cold air bites at exposed skin.`,
        `Gentle snow falls in a mesmerizing dance, slowly covering the landscape in pristine white. The frigid air is sharp and clean.`,
        `Light snow descends peacefully, each flake distinct and beautiful against the cold backdrop. The temperature hovers just below freezing.`
      ],
      [WeatherCondition.HEAVY_SNOW]: [
        `Thick snow falls in heavy flurries, accumulating rapidly and making travel difficult. The bitter cold cuts through even the heaviest cloaks. Visibility is severely reduced.`,
        `A blizzard of snow swirls around you, driven by icy winds that howl through the trees. The world disappears into a white void mere feet away.`,
        `Heavy snowfall blankets everything in white, the frigid air making each breath painful. The accumulation threatens to trap the unwary.`
      ],
      [WeatherCondition.STORM]: [
        `A violent storm rages overhead, lightning flashing and thunder booming across the tortured sky. ${temperature < 35 ? 'Icy wind and sleet' : 'Driving rain'} lash at anything exposed. Travel is treacherous.`,
        `Furious winds howl as the storm unleashes its fury, ${temperature < 35 ? 'hail and snow' : 'torrential rain'} pounding down with brutal force. Visibility is nearly zero.`,
        `The storm's wrath is terrible to behold - ${temperature < 35 ? 'freezing precipitation' : 'sheets of rain'} and howling gales make every step a battle against the elements.`
      ]
    };

    const options = descriptions[condition] || descriptions[WeatherCondition.CLEAR];
    const index = Math.floor(this.random() * options.length);
    return options[index];
  }

  /**
   * Generate weather conditions for given parameters
   *
   * Respects seasonal patterns and applies gradual transitions if previous weather provided.
   * Full moon overrides weather to "Clear skies" for visibility (werewolf encounters).
   *
   * @param {string} currentDate - Current in-game date (format: "YYYY-MM-DD")
   * @param {string} currentTime - Current in-game time (format: "HH:MM")
   * @param {string} season - Current season (spring, summer, autumn/fall, winter)
   * @param {string} moonPhase - Current moon phase (from MoonPhaseCalculator)
   * @param {Object} previousWeather - Previous weather state for gradual transitions (optional)
   * @returns {{success: boolean, data: Object|null, error: string|null}}
   *
   * @example
   * generator.generate("2024-03-15", "14:00", "spring", "waxing_gibbous", null)
   * // Returns:
   * // {
   * //   success: true,
   * //   data: {
   * //     condition: "Light Rain",
   * //     temperature: 52,
   * //     visibility: "Reduced",
   * //     description: "A light drizzle falls steadily...",
   * //     lastUpdated: "2024-03-15T14:00:00.000Z"
   * //   },
   * //   error: null
   * // }
   */
  generate(currentDate, currentTime, season, moonPhase, previousWeather = null) {
    try {
      // Validate season
      const seasonLower = season?.toLowerCase();
      if (!seasonLower || !VALID_SEASONS.includes(seasonLower)) {
        return {
          success: false,
          data: null,
          error: `Invalid season: "${season}". Expected one of: ${VALID_SEASONS.join(', ')}`
        };
      }

      // Check for full moon override (clear skies for visibility)
      if (moonPhase === 'full_moon') {
        const config = SEASONAL_CONFIG[seasonLower];
        const temperature = this._calculateTemperature(config.tempMin, config.tempMax, previousWeather);

        return {
          success: true,
          data: {
            condition: WeatherCondition.CLEAR,
            temperature,
            visibility: Visibility.CLEAR,
            description: `The full moon illuminates the fog-shrouded landscape with eerie silver light. The sky is clear, allowing the moon's pale glow to cast long shadows. The ${temperature < 40 ? 'cold' : temperature > 70 ? 'warm' : 'cool'} night air carries a sense of foreboding.`,
            lastUpdated: new Date().toISOString()
          },
          error: null
        };
      }

      // Get seasonal configuration
      const config = SEASONAL_CONFIG[seasonLower];

      // Select weather condition based on seasonal probabilities
      let condition = this._selectCondition(config.conditions);

      // Apply gradual transition if previous weather exists
      if (previousWeather) {
        condition = this._applyGradualTransition(condition, previousWeather);
      }

      // Calculate temperature within seasonal range
      const temperature = this._calculateTemperature(config.tempMin, config.tempMax, previousWeather);

      // Determine visibility based on condition
      const visibility = this._determineVisibility(condition);

      // Generate LLM-friendly description
      const description = this._generateDescription(condition, temperature, visibility);

      // Return weather data
      return {
        success: true,
        data: {
          condition,
          temperature,
          visibility,
          description,
          lastUpdated: new Date().toISOString()
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `WeatherGenerator.generate failed: ${error.message}`
      };
    }
  }
}

// Export class and enums
module.exports = { WeatherGenerator, WeatherCondition, Visibility };
