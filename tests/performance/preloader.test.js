/**
 * Unit Tests for Preloader - Epic 5 Story 5.7
 *
 * Tests AC-3: Context Preloading Strategy
 */

const Preloader = require('../../src/performance/preloader');

describe('Preloader', () => {
  let preloader;
  let mockContextCache;
  let mockFs;
  let mockPerformanceMonitor;

  beforeEach(() => {
    jest.useFakeTimers();

    mockContextCache = {
      get: jest.fn().mockReturnValue(null),
      set: jest.fn()
    };

    mockFs = {
      readFile: jest.fn()
    };

    mockPerformanceMonitor = {
      startTimer: jest.fn().mockReturnValue(jest.fn().mockResolvedValue(100))
    };

    preloader = new Preloader({
      contextCache: mockContextCache,
      fs: mockFs,
      idleTimeout: 1000, // 1 second for tests
      maxPreloadLocations: 3,
      locationsDir: 'game-data/locations'
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    preloader.cancelPreload();
  });

  describe('startIdleMonitor()', () => {
    it('should set up idle timer for current location (AC-3, Task 2.1)', () => {
      preloader.startIdleMonitor('village-of-barovia');

      expect(preloader.currentLocationId).toBe('village-of-barovia');
      expect(preloader.idleTimer).not.toBeNull();
    });

    it('should clear existing timer when starting new monitor', () => {
      preloader.startIdleMonitor('village-of-barovia');
      const firstTimer = preloader.idleTimer;

      preloader.startIdleMonitor('castle-ravenloft');

      expect(preloader.idleTimer).not.toBe(firstTimer);
      expect(preloader.currentLocationId).toBe('castle-ravenloft');
    });

    it('should trigger preloadAdjacent after idle timeout', async () => {
      // Setup mock for adjacent locations
      mockFs.readFile.mockImplementation((path) => {
        if (path.includes('metadata.yaml')) {
          return Promise.resolve('connections:\n  - castle-ravenloft');
        }
        if (path.includes('Description.md')) {
          return Promise.resolve('# Castle Ravenloft\nDark castle...');
        }
        return Promise.resolve('');
      });

      const preloadSpy = jest.spyOn(preloader, 'preloadAdjacent');

      preloader.startIdleMonitor('village-of-barovia');

      // Advance timer past idle timeout
      jest.advanceTimersByTime(1100);

      // Need to wait for promises to resolve
      await Promise.resolve();

      expect(preloadSpy).toHaveBeenCalledWith('village-of-barovia');
    });
  });

  describe('resetIdleTimer()', () => {
    it('should clear idle timer (AC-3, Task 2.2)', () => {
      preloader.startIdleMonitor('village-of-barovia');
      expect(preloader.idleTimer).not.toBeNull();

      preloader.resetIdleTimer();

      expect(preloader.idleTimer).toBeNull();
    });

    it('should abort ongoing preload when reset', async () => {
      preloader.isPreloading = true;
      preloader.abortController = new AbortController();

      const abortSpy = jest.spyOn(preloader.abortController, 'abort');

      preloader.resetIdleTimer();

      expect(abortSpy).toHaveBeenCalled();
      expect(preloader.isPreloading).toBe(false);
    });
  });

  describe('preloadAdjacent()', () => {
    beforeEach(() => {
      mockFs.readFile.mockImplementation((path) => {
        if (path.includes('village-of-barovia') && path.includes('metadata.yaml')) {
          return Promise.resolve(`
connections:
  - castle-ravenloft
  - tser-pool-encampment
  - old-bonegrinder
  - death-house
`);
        }
        if (path.includes('Description.md')) {
          return Promise.resolve('# Location\nDescription text...');
        }
        if (path.includes('metadata.yaml')) {
          return Promise.resolve('location_name: Test Location');
        }
        if (path.includes('NPCs.md')) {
          return Promise.resolve('## NPC One\nSome NPC');
        }
        return Promise.resolve('');
      });
    });

    it('should preload adjacent locations (AC-3, Task 2.3)', async () => {
      const result = await preloader.preloadAdjacent('village-of-barovia');

      expect(result.success).toBe(true);
      expect(result.preloaded).toBeDefined();
      expect(result.preloaded.length).toBeLessThanOrEqual(3); // maxPreloadLocations
    });

    it('should store preloaded data with "preload-" prefix (AC-3, Task 2.4)', async () => {
      await preloader.preloadAdjacent('village-of-barovia');

      // Check that cache.set was called with preload- prefix
      const setCalls = mockContextCache.set.mock.calls;
      const preloadCalls = setCalls.filter(call => call[0].startsWith('preload-'));

      expect(preloadCalls.length).toBeGreaterThan(0);
    });

    it('should limit preloads to maxPreloadLocations', async () => {
      preloader.maxPreloadLocations = 2;

      await preloader.preloadAdjacent('village-of-barovia');

      const setCalls = mockContextCache.set.mock.calls;
      expect(setCalls.length).toBeLessThanOrEqual(2);
    });

    it('should skip already cached locations', async () => {
      // Mark one location as already cached
      mockContextCache.get.mockImplementation((key) => {
        if (key === 'preload-castle-ravenloft') {
          return { data: 'cached' };
        }
        return null;
      });

      await preloader.preloadAdjacent('village-of-barovia');

      // castle-ravenloft should not be set again
      const setCalls = mockContextCache.set.mock.calls;
      const castleCall = setCalls.find(call => call[0] === 'preload-castle-ravenloft');
      expect(castleCall).toBeUndefined();
    });

    it('should skip locations in main cache', async () => {
      mockContextCache.get.mockImplementation((key) => {
        if (key === 'location:castle-ravenloft:v1') {
          return { data: 'in main cache' };
        }
        return null;
      });

      await preloader.preloadAdjacent('village-of-barovia');

      const setCalls = mockContextCache.set.mock.calls;
      const castleCall = setCalls.find(call => call[0] === 'preload-castle-ravenloft');
      expect(castleCall).toBeUndefined();
    });

    it('should prevent concurrent preloads', async () => {
      const firstPreload = preloader.preloadAdjacent('village-of-barovia');

      // Try to start another preload while first is running
      const secondResult = await preloader.preloadAdjacent('castle-ravenloft');

      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toContain('already in progress');

      await firstPreload;
    });

    it('should return empty array when no connections', async () => {
      mockFs.readFile.mockImplementation((path) => {
        if (path.includes('metadata.yaml')) {
          return Promise.resolve('location_name: Isolated Place');
        }
        return Promise.resolve('');
      });

      const result = await preloader.preloadAdjacent('isolated-location');

      expect(result.success).toBe(true);
      expect(result.preloaded).toEqual([]);
    });

    it('should handle connection format variations', async () => {
      mockFs.readFile.mockImplementation((path) => {
        if (path.includes('test-location') && path.includes('metadata.yaml')) {
          return Promise.resolve(`
connections:
  - locationId: place-one
  - location_id: place-two
  - place-three
`);
        }
        if (path.includes('Description.md')) {
          return Promise.resolve('# Place\nDescription...');
        }
        if (path.includes('metadata.yaml')) {
          return Promise.resolve('location_name: Place');
        }
        return Promise.resolve('');
      });

      const result = await preloader.preloadAdjacent('test-location');

      expect(result.success).toBe(true);
    });
  });

  describe('cancelPreload()', () => {
    it('should clear idle timer and abort controller (AC-3, Task 2.5)', () => {
      preloader.startIdleMonitor('village-of-barovia');
      preloader.abortController = new AbortController();
      preloader.isPreloading = true;

      preloader.cancelPreload();

      expect(preloader.idleTimer).toBeNull();
      expect(preloader.isPreloading).toBe(false);
    });
  });

  describe('isPreloaded()', () => {
    it('should check if location is preloaded', () => {
      mockContextCache.get.mockImplementation((key) => {
        if (key === 'preload-castle-ravenloft') {
          return { data: 'preloaded' };
        }
        return null;
      });

      expect(preloader.isPreloaded('castle-ravenloft')).toBe(true);
      expect(preloader.isPreloaded('village-of-barovia')).toBe(false);
    });

    it('should return false when no context cache', () => {
      preloader.contextCache = null;

      expect(preloader.isPreloaded('any-location')).toBe(false);
    });
  });

  describe('getPreloadedData()', () => {
    it('should retrieve preloaded data and promote to main cache', () => {
      const preloadedData = { locationId: 'castle-ravenloft', description: 'Dark castle' };
      mockContextCache.get.mockImplementation((key) => {
        if (key === 'preload-castle-ravenloft') {
          return preloadedData;
        }
        return null;
      });

      const data = preloader.getPreloadedData('castle-ravenloft', true);

      expect(data).toEqual(preloadedData);
      expect(mockContextCache.set).toHaveBeenCalledWith(
        'location:castle-ravenloft:v1',
        preloadedData
      );
    });

    it('should not promote when promote=false', () => {
      mockContextCache.get.mockReturnValue({ data: 'test' });

      preloader.getPreloadedData('castle-ravenloft', false);

      expect(mockContextCache.set).not.toHaveBeenCalled();
    });
  });

  describe('getStats()', () => {
    it('should return preload statistics', async () => {
      mockFs.readFile.mockImplementation((path) => {
        if (path.includes('metadata.yaml')) {
          return Promise.resolve('connections:\n  - place-one');
        }
        if (path.includes('Description.md')) {
          return Promise.resolve('# Place\nDescription');
        }
        return Promise.resolve('');
      });

      await preloader.preloadAdjacent('test-location');

      const stats = preloader.getStats();

      expect(stats.isPreloading).toBe(false);
      expect(stats.idleTimeout).toBe(1000);
      expect(stats.maxPreloadLocations).toBe(3);
      expect(stats.preloadedCount).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(stats.preloadedLocations)).toBe(true);
    });
  });

  describe('clearStats()', () => {
    it('should clear preloaded locations tracking', async () => {
      preloader.preloadedLocations.add('test-location');

      preloader.clearStats();

      expect(preloader.preloadedLocations.size).toBe(0);
    });
  });

  describe('Performance Integration', () => {
    it('should use PerformanceMonitor when available', async () => {
      preloader.performanceMonitor = mockPerformanceMonitor;

      mockFs.readFile.mockImplementation((path) => {
        if (path.includes('metadata.yaml')) {
          return Promise.resolve('connections:\n  - place-one');
        }
        if (path.includes('Description.md')) {
          return Promise.resolve('# Place');
        }
        return Promise.resolve('');
      });

      await preloader.preloadAdjacent('test-location');

      expect(mockPerformanceMonitor.startTimer).toHaveBeenCalledWith('preload');
    });
  });

  describe('Error Handling', () => {
    it('should handle individual preload failures gracefully', async () => {
      mockFs.readFile.mockImplementation((path) => {
        if (path.includes('test-location') && path.includes('metadata.yaml')) {
          return Promise.resolve('connections:\n  - good-place\n  - bad-place');
        }
        if (path.includes('bad-place')) {
          return Promise.reject(new Error('File not found'));
        }
        if (path.includes('Description.md')) {
          return Promise.resolve('# Good Place');
        }
        if (path.includes('metadata.yaml')) {
          return Promise.resolve('location_name: Good Place');
        }
        return Promise.resolve('');
      });

      // Should not throw despite bad-place failing
      const result = await preloader.preloadAdjacent('test-location');

      expect(result.success).toBe(true);
    });

    it('should handle missing metadata gracefully', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await preloader.preloadAdjacent('nonexistent-location');

      expect(result.success).toBe(true);
      expect(result.preloaded).toEqual([]);
    });
  });
});
