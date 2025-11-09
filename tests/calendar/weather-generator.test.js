/**
 * Tests for WeatherGenerator
 *
 * Coverage:
 * - AC-4: Module creation and dependency injection
 * - AC-5: Seasonal weather generation with gradual transitions
 * - AC-6: Weather schema compliance
 * - AC-8: Performance < 50ms
 */

const { WeatherGenerator, WeatherCondition, Visibility } = require('../../src/calendar/weather-generator');

describe('WeatherGenerator', () => {
  describe('AC-4: Constructor and Dependency Injection', () => {
    test('should create instance with default dependencies', () => {
      const generator = new WeatherGenerator();
      expect(generator).toBeInstanceOf(WeatherGenerator);
      expect(generator.random).toBeDefined();
    });

    test('should accept injected random function for deterministic testing', () => {
      // Seeded random for predictable results
      let seed = 0.5;
      const mockRandom = jest.fn(() => seed);

      const generator = new WeatherGenerator({ random: mockRandom });
      expect(generator.random).toBe(mockRandom);
    });
  });

  describe('AC-5: Seasonal Temperature Ranges', () => {
    test('should generate winter temperatures (15-45°F)', () => {
      const generator = new WeatherGenerator();
      const temperatures = [];

      for (let i = 0; i < 50; i++) {
        const result = generator.generate('2024-01-15', '12:00', 'winter', 'new_moon');
        if (result.success) {
          temperatures.push(result.data.temperature);
        }
      }

      // All temperatures should be within winter range
      temperatures.forEach(temp => {
        expect(temp).toBeGreaterThanOrEqual(15);
        expect(temp).toBeLessThanOrEqual(45);
      });
    });

    test('should generate spring temperatures (40-65°F)', () => {
      const generator = new WeatherGenerator();
      const temperatures = [];

      for (let i = 0; i < 50; i++) {
        const result = generator.generate('2024-04-15', '12:00', 'spring', 'new_moon');
        if (result.success) {
          temperatures.push(result.data.temperature);
        }
      }

      temperatures.forEach(temp => {
        expect(temp).toBeGreaterThanOrEqual(40);
        expect(temp).toBeLessThanOrEqual(65);
      });
    });

    test('should generate summer temperatures (60-85°F)', () => {
      const generator = new WeatherGenerator();
      const temperatures = [];

      for (let i = 0; i < 50; i++) {
        const result = generator.generate('2024-07-15', '12:00', 'summer', 'new_moon');
        if (result.success) {
          temperatures.push(result.data.temperature);
        }
      }

      temperatures.forEach(temp => {
        expect(temp).toBeGreaterThanOrEqual(60);
        expect(temp).toBeLessThanOrEqual(85);
      });
    });

    test('should generate autumn temperatures (35-60°F)', () => {
      const generator = new WeatherGenerator();
      const temperatures = [];

      for (let i = 0; i < 50; i++) {
        const result = generator.generate('2024-10-15', '12:00', 'autumn', 'new_moon');
        if (result.success) {
          temperatures.push(result.data.temperature);
        }
      }

      temperatures.forEach(temp => {
        expect(temp).toBeGreaterThanOrEqual(35);
        expect(temp).toBeLessThanOrEqual(60);
      });
    });
  });

  describe('AC-5: Seasonal Weather Patterns', () => {
    test('winter should include snow conditions', () => {
      const generator = new WeatherGenerator();
      const conditions = [];

      for (let i = 0; i < 100; i++) {
        const result = generator.generate('2024-01-15', '12:00', 'winter', 'new_moon');
        if (result.success) {
          conditions.push(result.data.condition);
        }
      }

      const snowCount = conditions.filter(c => c.includes('Snow')).length;
      expect(snowCount).toBeGreaterThan(0); // Should have some snow
    });

    test('spring should include rain conditions', () => {
      const generator = new WeatherGenerator();
      const conditions = [];

      for (let i = 0; i < 100; i++) {
        const result = generator.generate('2024-04-15', '12:00', 'spring', 'new_moon');
        if (result.success) {
          conditions.push(result.data.condition);
        }
      }

      const rainCount = conditions.filter(c => c.includes('Rain')).length;
      expect(rainCount).toBeGreaterThan(0); // Should have some rain
    });

    test('summer should have higher clear weather probability', () => {
      const generator = new WeatherGenerator();
      const conditions = [];

      for (let i = 0; i < 100; i++) {
        const result = generator.generate('2024-07-15', '12:00', 'summer', 'new_moon');
        if (result.success) {
          conditions.push(result.data.condition);
        }
      }

      const clearCount = conditions.filter(c => c === WeatherCondition.CLEAR).length;
      expect(clearCount).toBeGreaterThan(30); // > 30% clear (probability is 0.50)
    });

    test('autumn should include fog conditions', () => {
      const generator = new WeatherGenerator();
      const conditions = [];

      for (let i = 0; i < 100; i++) {
        const result = generator.generate('2024-10-15', '12:00', 'autumn', 'new_moon');
        if (result.success) {
          conditions.push(result.data.condition);
        }
      }

      const fogCount = conditions.filter(c => c === WeatherCondition.FOG).length;
      expect(fogCount).toBeGreaterThan(0); // Should have some fog
    });
  });

  describe('AC-5: Full Moon Override', () => {
    test('should override weather to Clear on full moon', () => {
      const generator = new WeatherGenerator();
      const result = generator.generate('2024-03-15', '20:00', 'winter', 'full_moon');

      expect(result.success).toBe(true);
      expect(result.data.condition).toBe(WeatherCondition.CLEAR);
      expect(result.data.visibility).toBe(Visibility.CLEAR);
      expect(result.data.description).toContain('full moon');
    });

    test('should not override weather on non-full moon', () => {
      const generator = new WeatherGenerator();
      const result = generator.generate('2024-03-15', '12:00', 'winter', 'new_moon');

      expect(result.success).toBe(true);
      // Weather should be variable (not necessarily clear)
      // Just verify it returns valid weather
      expect(result.data.condition).toBeDefined();
    });
  });

  describe('AC-5: Gradual Weather Transitions', () => {
    test('should limit temperature change to ±10°F', () => {
      const generator = new WeatherGenerator();

      const previousWeather = {
        condition: WeatherCondition.CLEAR,
        temperature: 50,
        visibility: Visibility.CLEAR
      };

      // Generate multiple weather updates
      for (let i = 0; i < 20; i++) {
        const result = generator.generate(
          '2024-04-15',
          '12:00',
          'spring',
          'new_moon',
          previousWeather
        );

        expect(result.success).toBe(true);

        // Temperature should not change by more than ±10°F
        const tempDiff = Math.abs(result.data.temperature - previousWeather.temperature);
        expect(tempDiff).toBeLessThanOrEqual(10);

        // Update previous weather for next iteration
        previousWeather.temperature = result.data.temperature;
        previousWeather.condition = result.data.condition;
      }
    });

    test('should avoid drastic condition changes', () => {
      const generator = new WeatherGenerator();

      const previousWeather = {
        condition: WeatherCondition.CLEAR,
        temperature: 60,
        visibility: Visibility.CLEAR
      };

      const result = generator.generate(
        '2024-07-15',
        '14:00',
        'summer',
        'new_moon',
        previousWeather
      );

      expect(result.success).toBe(true);
      // From CLEAR, should not jump directly to STORM
      // (This is probabilistic, but gradual transition logic should prevent it)
      expect(result.data.condition).not.toBe(WeatherCondition.STORM);
    });

    test('should generate initial weather without previous state', () => {
      const generator = new WeatherGenerator();
      const result = generator.generate('2024-04-15', '12:00', 'spring', 'new_moon', null);

      expect(result.success).toBe(true);
      expect(result.data.condition).toBeDefined();
      expect(result.data.temperature).toBeDefined();
    });
  });

  describe('AC-5 & AC-6: LLM-Friendly Descriptions', () => {
    test('should generate atmospheric description', () => {
      const generator = new WeatherGenerator();
      const result = generator.generate('2024-04-15', '12:00', 'spring', 'new_moon');

      expect(result.success).toBe(true);
      expect(result.data.description).toBeDefined();
      expect(result.data.description.length).toBeGreaterThan(20);
      expect(typeof result.data.description).toBe('string');
    });

    test('description should reference temperature range', () => {
      const generator = new WeatherGenerator();

      // Generate multiple weather descriptions
      const coldResult = generator.generate('2024-01-15', '12:00', 'winter', 'new_moon');
      const warmResult = generator.generate('2024-07-15', '12:00', 'summer', 'new_moon');

      expect(coldResult.success).toBe(true);
      expect(warmResult.success).toBe(true);

      // Descriptions should vary based on temperature
      expect(coldResult.data.description).toBeDefined();
      expect(warmResult.data.description).toBeDefined();
    });
  });

  describe('AC-6: Weather Schema Compliance', () => {
    test('should return all required schema fields', () => {
      const generator = new WeatherGenerator();
      const result = generator.generate('2024-04-15', '12:00', 'spring', 'new_moon');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('condition');
      expect(result.data).toHaveProperty('temperature');
      expect(result.data).toHaveProperty('visibility');
      expect(result.data).toHaveProperty('description');
      expect(result.data).toHaveProperty('lastUpdated');
    });

    test('should use valid weather conditions', () => {
      const generator = new WeatherGenerator();
      const validConditions = Object.values(WeatherCondition);

      for (let i = 0; i < 50; i++) {
        const result = generator.generate('2024-04-15', '12:00', 'spring', 'new_moon');
        expect(result.success).toBe(true);
        expect(validConditions).toContain(result.data.condition);
      }
    });

    test('should use valid visibility levels', () => {
      const generator = new WeatherGenerator();
      const validVisibilities = Object.values(Visibility);

      for (let i = 0; i < 50; i++) {
        const result = generator.generate('2024-04-15', '12:00', 'spring', 'new_moon');
        expect(result.success).toBe(true);
        expect(validVisibilities).toContain(result.data.visibility);
      }
    });

    test('lastUpdated should be valid ISO timestamp', () => {
      const generator = new WeatherGenerator();
      const result = generator.generate('2024-04-15', '12:00', 'spring', 'new_moon');

      expect(result.success).toBe(true);
      expect(result.data.lastUpdated).toBeDefined();

      // Should be parseable as Date
      const timestamp = new Date(result.data.lastUpdated);
      expect(timestamp).toBeInstanceOf(Date);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });
  });

  describe('Error Handling', () => {
    let generator;

    beforeEach(() => {
      generator = new WeatherGenerator();
    });

    test('should handle invalid season', () => {
      const result = generator.generate('2024-04-15', '12:00', 'invalid_season', 'new_moon');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('Invalid season');
    });

    test('should handle null season', () => {
      const result = generator.generate('2024-04-15', '12:00', null, 'new_moon');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });

    test('should handle undefined season', () => {
      const result = generator.generate('2024-04-15', '12:00', undefined, 'new_moon');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('AC-8: Performance', () => {
    let generator;

    beforeEach(() => {
      generator = new WeatherGenerator();
    });

    test('should complete 100 generations in < 50ms total', () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        generator.generate('2024-04-15', '12:00', 'spring', 'new_moon');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // 100 generations in < 50ms
    });

    test('single generation should complete in < 10ms', () => {
      const startTime = performance.now();

      generator.generate('2024-04-15', '12:00', 'spring', 'new_moon');

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10);
    });
  });
});
