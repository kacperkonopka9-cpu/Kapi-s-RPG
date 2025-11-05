/**
 * Unit Tests for NavigationHandler
 * Story 1.6: Location Navigation - Task 9
 *
 * Tests the NavigationHandler implementation with mocked fs/yaml
 * Target: 90%+ code coverage
 */

const { NavigationHandler } = require('../../src/core/navigation-handler');
const fs = require('fs');
const yaml = require('js-yaml');

// Mock fs and yaml modules
jest.mock('fs');
jest.mock('js-yaml');

describe('NavigationHandler', () => {
  let navigationHandler;
  const mockBasePath = '/mock/game-data/locations';

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset console.warn mock
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create NavigationHandler with mock base path
    navigationHandler = new NavigationHandler(mockBasePath);
  });

  afterEach(() => {
    console.warn.mockRestore();
    console.error.mockRestore();
  });

  describe('Constructor', () => {
    test('should initialize with provided base path', () => {
      const handler = new NavigationHandler('/custom/path');
      expect(handler.basePath).toBe('/custom/path');
    });

    test('should use default base path if none provided', () => {
      const handler = new NavigationHandler();
      expect(handler.basePath).toContain('game-data');
      expect(handler.basePath).toContain('locations');
    });
  });

  describe('travel() - Success Cases', () => {
    test('should allow travel to connected location (string array format)', () => {
      // Mock target exists
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('tser-pool')) return true;
        if (path.includes('metadata.yaml')) return true;
        return false;
      });

      // Mock metadata with simple string array
      fs.readFileSync.mockReturnValue('connected_locations:\n  - tser-pool\n  - death-house');
      yaml.load.mockReturnValue({
        connected_locations: ['tser-pool', 'death-house']
      });

      const result = navigationHandler.travel('tser-pool', 'village-of-barovia');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.targetLocationId).toBe('tser-pool');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    test('should allow travel with object array format', () => {
      fs.existsSync.mockImplementation(() => true);

      fs.readFileSync.mockReturnValue('...');
      yaml.load.mockReturnValue({
        connected_locations: [
          { name: 'tser-pool', direction: 'West', travel_time: '2 hours' }
        ]
      });

      const result = navigationHandler.travel('tser-pool', 'village-of-barovia');

      expect(result.success).toBe(true);
      expect(result.targetLocationId).toBe('tser-pool');
    });

    test('should complete in < 100ms (performance target)', () => {
      fs.existsSync.mockImplementation(() => true);
      fs.readFileSync.mockReturnValue('...');
      yaml.load.mockReturnValue({
        connected_locations: ['tser-pool']
      });

      const result = navigationHandler.travel('tser-pool', 'village-of-barovia');

      expect(result.durationMs).toBeLessThan(100);
    });
  });

  describe('travel() - Error Cases', () => {
    test('should return error when target location does not exist', () => {
      // Mock: target doesn't exist, current metadata exists
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('invalid-location')) return false;
        if (path.includes('metadata.yaml')) return true;
        return false;
      });

      const result = navigationHandler.travel('invalid-location', 'village-of-barovia');

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not exist');
      expect(result.targetLocationId).toBeNull();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    test('should return error when target not in connected_locations', () => {
      fs.existsSync.mockImplementation(() => true);
      fs.readFileSync.mockReturnValue('...');
      yaml.load.mockReturnValue({
        connected_locations: ['tser-pool', 'death-house']
      });

      const result = navigationHandler.travel('castle-ravenloft', 'village-of-barovia');

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot travel');
      expect(result.error).toContain('Available exits');
      expect(result.targetLocationId).toBeNull();
      expect(result.availableExits).toBeDefined();
      expect(result.availableExits.length).toBe(2);
    });

    test('should list available exits in error message', () => {
      fs.existsSync.mockImplementation(() => true);
      fs.readFileSync.mockReturnValue('...');
      yaml.load.mockReturnValue({
        connected_locations: ['tser-pool', 'death-house']
      });

      const result = navigationHandler.travel('invalid', 'village-of-barovia');

      expect(result.error).toContain('tser-pool');
      expect(result.error).toContain('death-house');
    });
  });

  describe('travel() - Graceful Fallbacks (AC-22)', () => {
    test('should allow travel when metadata.yaml missing (graceful fallback)', () => {
      // Mock: target exists, metadata doesn't exist
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('metadata.yaml')) return false;
        return true; // target exists
      });

      const result = navigationHandler.travel('tser-pool', 'village-of-barovia');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.targetLocationId).toBe('tser-pool');
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('metadata.yaml missing'));
    });

    test('should allow travel when metadata.yaml is corrupted', () => {
      fs.existsSync.mockImplementation(() => true);
      fs.readFileSync.mockReturnValue('invalid: yaml: content:');
      yaml.load.mockImplementation(() => {
        throw new Error('YAML parse error');
      });

      const result = navigationHandler.travel('tser-pool', 'village-of-barovia');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to parse'));
    });

    test('should allow travel when connected_locations is empty array', () => {
      fs.existsSync.mockImplementation(() => true);
      fs.readFileSync.mockReturnValue('...');
      yaml.load.mockReturnValue({
        connected_locations: []
      });

      const result = navigationHandler.travel('tser-pool', 'village-of-barovia');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('No connected_locations'));
    });

    test('should allow travel when connected_locations field missing', () => {
      fs.existsSync.mockImplementation(() => true);
      fs.readFileSync.mockReturnValue('...');
      yaml.load.mockReturnValue({
        location_name: 'Test Location'
        // No connected_locations field
      });

      const result = navigationHandler.travel('tser-pool', 'village-of-barovia');

      expect(result.success).toBe(true);
    });
  });

  describe('travel() - Performance Monitoring (AC-23)', () => {
    test('should log warning if travel takes > 100ms', () => {
      // Mock slow operation
      fs.existsSync.mockImplementation(() => {
        // Simulate delay
        const start = Date.now();
        while (Date.now() - start < 110) { /* busy wait */ }
        return true;
      });

      fs.readFileSync.mockReturnValue('...');
      yaml.load.mockReturnValue({
        connected_locations: ['tser-pool']
      });

      const result = navigationHandler.travel('tser-pool', 'village-of-barovia');

      expect(result.durationMs).toBeGreaterThan(100);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[Performance]'));
    });
  });

  describe('travel() - Edge Cases', () => {
    test('should handle unexpected error gracefully', () => {
      fs.existsSync.mockImplementation(() => {
        throw new Error('Unexpected fs error');
      });

      const result = navigationHandler.travel('tser-pool', 'village-of-barovia');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Navigation error');
      expect(console.error).toHaveBeenCalled();
    });

    test('should handle non-array connected_locations', () => {
      fs.existsSync.mockImplementation(() => true);
      fs.readFileSync.mockReturnValue('...');
      yaml.load.mockReturnValue({
        connected_locations: 'invalid-not-an-array'
      });

      const result = navigationHandler.travel('tser-pool', 'village-of-barovia');

      expect(result.success).toBe(true); // Falls back to permissive
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('not an array'));
    });
  });

  describe('getConnectedLocations() - Success Cases', () => {
    test('should return array of ConnectedLocation objects', async () => {
      fs.existsSync.mockImplementation(() => true);

      // Mock current location metadata
      fs.readFileSync.mockImplementation((path) => {
        if (path.includes('village-of-barovia')) {
          return 'connected_locations:\n  - tser-pool\n  - death-house';
        } else if (path.includes('tser-pool')) {
          return 'location_name: Tser Pool Encampment\ndescription: A Vistani camp';
        } else if (path.includes('death-house')) {
          return 'location_name: Death House\ndescription: A haunted mansion';
        }
        return '';
      });

      yaml.load.mockImplementation((content) => {
        if (content.includes('tser-pool')) {
          return { connected_locations: ['tser-pool', 'death-house'] };
        } else if (content.includes('Tser Pool')) {
          return { location_name: 'Tser Pool Encampment', description: 'A Vistani camp' };
        } else if (content.includes('Death House')) {
          return { location_name: 'Death House', description: 'A haunted mansion' };
        }
        return {};
      });

      const results = await navigationHandler.getConnectedLocations('village-of-barovia');

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        locationId: expect.any(String),
        displayName: expect.any(String),
        description: expect.any(String)
      });
    });

    test('should sort results alphabetically by displayName', async () => {
      fs.existsSync.mockImplementation(() => true);

      fs.readFileSync.mockImplementation((path) => {
        if (path.includes('village')) {
          return '...';
        } else if (path.includes('zeta')) {
          return 'location_name: Zeta Location';
        } else if (path.includes('alpha')) {
          return 'location_name: Alpha Location';
        }
        return '';
      });

      yaml.load.mockImplementation((content) => {
        if (content.includes('Zeta')) {
          return { location_name: 'Zeta Location', description: '' };
        } else if (content.includes('Alpha')) {
          return { location_name: 'Alpha Location', description: '' };
        }
        return { connected_locations: ['zeta-location', 'alpha-location'] };
      });

      const results = await navigationHandler.getConnectedLocations('village-of-barovia');

      expect(results[0].displayName).toBe('Alpha Location');
      expect(results[1].displayName).toBe('Zeta Location');
    });

    test('should handle object array format with direction', async () => {
      fs.existsSync.mockImplementation(() => true);

      fs.readFileSync.mockReturnValue('...');
      yaml.load.mockImplementation(() => ({
        connected_locations: [
          { name: 'tser-pool', direction: 'West', travel_time: '2 hours' }
        ],
        location_name: 'Tser Pool',
        description: 'A camp'
      }));

      const results = await navigationHandler.getConnectedLocations('village-of-barovia');

      expect(results).toHaveLength(1);
      expect(results[0].direction).toBe('West');
      expect(results[0].exitDescription).toContain('2 hours');
    });

    test('should complete in < 50ms (performance target)', async () => {
      fs.existsSync.mockImplementation(() => true);
      fs.readFileSync.mockReturnValue('...');
      yaml.load.mockReturnValue({
        connected_locations: ['tser-pool'],
        location_name: 'Test',
        description: ''
      });

      const startTime = performance.now();
      await navigationHandler.getConnectedLocations('village-of-barovia');
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('getConnectedLocations() - Error Cases', () => {
    test('should return empty array when metadata missing', async () => {
      fs.existsSync.mockReturnValue(false);

      const results = await navigationHandler.getConnectedLocations('village-of-barovia');

      expect(results).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('metadata.yaml missing'));
    });

    test('should return empty array when connected_locations empty', async () => {
      fs.existsSync.mockImplementation(() => true);
      fs.readFileSync.mockReturnValue('...');
      yaml.load.mockReturnValue({
        connected_locations: []
      });

      const results = await navigationHandler.getConnectedLocations('village-of-barovia');

      expect(results).toEqual([]);
    });

    test('should skip locations with corrupted metadata', async () => {
      fs.existsSync.mockImplementation(() => true);

      let callCount = 0;
      yaml.load.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Current location metadata
          return { connected_locations: ['valid', 'invalid'] };
        } else if (callCount === 2) {
          // Valid location
          return { location_name: 'Valid Location', description: '' };
        } else {
          // Invalid location
          throw new Error('Corrupt YAML');
        }
      });

      fs.readFileSync.mockReturnValue('...');

      const results = await navigationHandler.getConnectedLocations('village-of-barovia');

      expect(results).toHaveLength(1);
      expect(results[0].locationId).toBe('valid');
      expect(console.warn).toHaveBeenCalled();
    });

    test('should use location ID as displayName if metadata missing', async () => {
      fs.existsSync.mockImplementation((path) => {
        // Current location has metadata, target doesn't
        if (path.includes('tser-pool/metadata')) return false;
        return true;
      });

      fs.readFileSync.mockReturnValue('...');
      yaml.load.mockReturnValue({
        connected_locations: ['tser-pool']
      });

      const results = await navigationHandler.getConnectedLocations('village-of-barovia');

      expect(results[0].displayName).toBe('tser-pool');
      expect(results[0].description).toBe('');
    });

    test('should handle error gracefully and return empty array', async () => {
      fs.existsSync.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const results = await navigationHandler.getConnectedLocations('village-of-barovia');

      expect(results).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('canTravel() - Helper Method', () => {
    test('should return true if travel is possible', async () => {
      fs.existsSync.mockImplementation(() => true);
      fs.readFileSync.mockReturnValue('...');
      yaml.load.mockReturnValue({
        connected_locations: ['tser-pool']
      });

      const allowed = await navigationHandler.canTravel('village-of-barovia', 'tser-pool');

      expect(allowed).toBe(true);
    });

    test('should return false if travel is not possible', async () => {
      fs.existsSync.mockImplementation(() => true);
      fs.readFileSync.mockReturnValue('...');
      yaml.load.mockReturnValue({
        connected_locations: ['other-location']
      });

      const allowed = await navigationHandler.canTravel('village-of-barovia', 'tser-pool');

      expect(allowed).toBe(false);
    });

    test('should return false on error', async () => {
      fs.existsSync.mockImplementation(() => {
        throw new Error('Error');
      });

      const allowed = await navigationHandler.canTravel('village-of-barovia', 'tser-pool');

      expect(allowed).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('_parseConnectedLocations() - Private Method', () => {
    test('should return empty array if metadata is null', () => {
      const result = navigationHandler._parseConnectedLocations(null);
      expect(result).toEqual([]);
    });

    test('should return empty array if connected_locations missing', () => {
      const result = navigationHandler._parseConnectedLocations({});
      expect(result).toEqual([]);
    });

    test('should return empty array if connected_locations not an array', () => {
      const result = navigationHandler._parseConnectedLocations({
        connected_locations: 'invalid'
      });
      expect(result).toEqual([]);
      expect(console.warn).toHaveBeenCalled();
    });

    test('should return array as-is if valid', () => {
      const result = navigationHandler._parseConnectedLocations({
        connected_locations: ['a', 'b']
      });
      expect(result).toEqual(['a', 'b']);
    });
  });

  describe('_formatAvailableExits() - Private Method', () => {
    test('should format string array', () => {
      const result = navigationHandler._formatAvailableExits(['loc1', 'loc2']);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        locationId: 'loc1',
        displayName: 'loc1',
        direction: null
      });
    });

    test('should format object array', () => {
      const result = navigationHandler._formatAvailableExits([
        { name: 'loc1', direction: 'North', travel_time: '1 hour' }
      ]);

      expect(result[0]).toMatchObject({
        locationId: 'loc1',
        displayName: 'loc1',
        direction: 'North',
        exitDescription: 'Travel time: 1 hour'
      });
    });
  });
});
