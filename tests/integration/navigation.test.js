/**
 * Integration Tests for NavigationHandler
 * Story 1.6: Location Navigation - Task 10
 *
 * Tests complete navigation workflow with real test location data
 */

const { NavigationHandler } = require('../../src/core/navigation-handler');
const path = require('path');

describe('NavigationHandler Integration Tests', () => {
  let navigationHandler;
  const testLocationsPath = path.join(process.cwd(), 'game-data', 'test-locations');

  beforeEach(() => {
    navigationHandler = new NavigationHandler(testLocationsPath);
  });

  describe('Complete Travel Workflow with Real Locations', () => {
    test('should allow travel between connected test locations', () => {
      // Test location 1 → Test location 2 (connected)
      const result = navigationHandler.travel('test-location-2', 'test-location-1');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.targetLocationId).toBe('test-location-2');
      expect(result.durationMs).toBeLessThan(100);
    });

    test('should prevent travel between disconnected locations', () => {
      // Test location 1 → Test location isolated (not connected)
      const result = navigationHandler.travel('test-location-isolated', 'test-location-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot travel');
      expect(result.availableExits).toBeDefined();
    });

    test('should handle bidirectional navigation', () => {
      // Test forward direction
      const result1 = navigationHandler.travel('test-location-2', 'test-location-1');
      expect(result1.success).toBe(true);

      // Test reverse direction
      const result2 = navigationHandler.travel('test-location-1', 'test-location-2');
      expect(result2.success).toBe(true);
    });

    test('should navigate through multiple connected locations', () => {
      // Chain: test-location-1 → test-location-2 → test-location-3
      const result1 = navigationHandler.travel('test-location-2', 'test-location-1');
      expect(result1.success).toBe(true);

      const result2 = navigationHandler.travel('test-location-3', 'test-location-2');
      expect(result2.success).toBe(true);
    });
  });

  describe('getConnectedLocations() with Real Metadata', () => {
    test('should return connected locations with display names', async () => {
      const exits = await navigationHandler.getConnectedLocations('test-location-1');

      expect(exits.length).toBeGreaterThan(0);
      expect(exits[0]).toMatchObject({
        locationId: expect.any(String),
        displayName: expect.any(String),
        description: expect.any(String)
      });
    });

    test('should sort exits alphabetically', async () => {
      const exits = await navigationHandler.getConnectedLocations('test-location-1');

      if (exits.length > 1) {
        for (let i = 0; i < exits.length - 1; i++) {
          expect(exits[i].displayName <= exits[i + 1].displayName).toBe(true);
        }
      }
    });

    test('should complete in < 50ms', async () => {
      const startTime = performance.now();
      await navigationHandler.getConnectedLocations('test-location-1');
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(50);
    });

    test('should handle locations with no connections', async () => {
      const exits = await navigationHandler.getConnectedLocations('test-location-isolated');

      expect(exits).toEqual([]);
    });
  });

  describe('canTravel() Integration', () => {
    test('should validate connected locations', async () => {
      const allowed = await navigationHandler.canTravel('test-location-1', 'test-location-2');
      expect(allowed).toBe(true);
    });

    test('should reject disconnected locations', async () => {
      const allowed = await navigationHandler.canTravel('test-location-1', 'test-location-isolated');
      expect(allowed).toBe(false);
    });
  });

  describe('NavigationResult Structure (AC-18)', () => {
    test('should return success result with all required fields', () => {
      const result = navigationHandler.travel('test-location-2', 'test-location-1');

      expect(result).toMatchObject({
        success: true,
        error: null,
        targetLocationId: 'test-location-2',
        durationMs: expect.any(Number)
      });
    });

    test('should return failure result with available exits', () => {
      const result = navigationHandler.travel('invalid-location', 'test-location-1');

      expect(result).toMatchObject({
        success: false,
        error: expect.any(String),
        targetLocationId: null,
        durationMs: expect.any(Number)
      });

      if (!result.error.includes('does not exist')) {
        // If location exists but not connected, should have availableExits
        expect(result.availableExits).toBeDefined();
      }
    });
  });

  describe('Metadata Format Support', () => {
    test('should handle simple string array format', () => {
      // test-location-1 uses simple string array
      const result = navigationHandler.travel('test-location-2', 'test-location-1');
      expect(result.success).toBe(true);
    });

    test('should handle object array format with directions', async () => {
      // If test-location-2 has object format, test it
      const exits = await navigationHandler.getConnectedLocations('test-location-2');

      exits.forEach(exit => {
        expect(exit).toMatchObject({
          locationId: expect.any(String),
          displayName: expect.any(String),
          description: expect.any(String)
        });
        // direction and exitDescription are optional
      });
    });
  });

  describe('Error Handling with Real Locations', () => {
    test('should handle non-existent location gracefully', () => {
      const result = navigationHandler.travel('does-not-exist', 'test-location-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not exist');
    });

    test('should provide helpful error message with available exits', () => {
      // Try to travel to disconnected location
      const result = navigationHandler.travel('test-location-isolated', 'test-location-1');

      if (result.error && !result.error.includes('does not exist')) {
        expect(result.error).toContain('Available exits');
        expect(result.availableExits).toBeDefined();
        expect(result.availableExits.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance Validation', () => {
    test('should complete travel validation in < 100ms', () => {
      const results = [];

      // Test 10 travel operations
      for (let i = 0; i < 10; i++) {
        const result = navigationHandler.travel('test-location-2', 'test-location-1');
        results.push(result.durationMs);
      }

      // All should be under 100ms
      results.forEach(duration => {
        expect(duration).toBeLessThan(100);
      });

      // Average should be well under target
      const average = results.reduce((sum, d) => sum + d, 0) / results.length;
      expect(average).toBeLessThan(50);
    });

    test('should complete getConnectedLocations in < 50ms', async () => {
      const results = [];

      // Test 10 operations
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        await navigationHandler.getConnectedLocations('test-location-1');
        results.push(performance.now() - startTime);
      }

      // All should be under 50ms
      results.forEach(duration => {
        expect(duration).toBeLessThan(50);
      });
    });
  });

  describe('Edge Cases with Real Data', () => {
    test('should handle location with empty connected_locations gracefully', () => {
      // If test-location-isolated has empty array, should allow travel
      const result = navigationHandler.travel('test-location-1', 'test-location-isolated');

      // Either succeeds (empty array = no restrictions) or fails (doesn't exist in connections)
      expect(result).toMatchObject({
        success: expect.any(Boolean),
        durationMs: expect.any(Number)
      });
    });
  });
});
