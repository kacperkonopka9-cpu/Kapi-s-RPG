/**
 * Unit Tests for Debug Commands - Epic 5 Story 5.7
 *
 * Tests AC-6: Debug Commands for Performance Monitoring
 */

const {
  handleDebugCommand,
  handleDebugPerformance,
  handleDebugSession,
  handleDebugCache,
  handleDebugPreload
} = require('../../src/commands/debug-commands');

const PerformanceMonitor = require('../../src/performance/performance-monitor');
const ParsingCache = require('../../src/performance/parsing-cache');

describe('Debug Commands', () => {
  beforeEach(() => {
    // Reset singletons between tests
    PerformanceMonitor.resetInstance();
    ParsingCache.resetInstance();
  });

  afterEach(() => {
    PerformanceMonitor.resetInstance();
    ParsingCache.resetInstance();
  });

  describe('handleDebugCommand()', () => {
    it('should show help for unknown subcommand', async () => {
      const result = await handleDebugCommand({}, []);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Debug Commands');
      expect(result.output).toContain('performance');
      expect(result.output).toContain('session');
      expect(result.output).toContain('cache');
      expect(result.output).toContain('preload');
    });

    it('should route to performance subcommand', async () => {
      const result = await handleDebugCommand({}, ['performance']);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Performance Metrics');
    });

    it('should support short aliases', async () => {
      const perfResult = await handleDebugCommand({}, ['p']);
      expect(perfResult.output).toContain('Performance Metrics');

      const cacheResult = await handleDebugCommand({}, ['c']);
      expect(cacheResult.output).toContain('Parsing Cache');

      const sessionResult = await handleDebugCommand({}, ['s']);
      expect(sessionResult.output).toContain('Session Debug');
    });
  });

  describe('handleDebugPerformance()', () => {
    it('should show empty state message when no metrics', async () => {
      const result = await handleDebugPerformance({}, []);

      expect(result.success).toBe(true);
      expect(result.output).toContain('No performance metrics');
    });

    it('should show operation statistics (AC-6)', async () => {
      const monitor = PerformanceMonitor.getInstance();
      await monitor.record('contextLoad', 500, {});
      await monitor.record('contextLoad', 600, {});
      await monitor.record('fileRead', 10, {});

      const result = await handleDebugPerformance({}, []);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Operation Statistics');
      expect(result.output).toContain('contextLoad');
      expect(result.output).toContain('fileRead');
      expect(result.data.summary.contextLoad.count).toBe(2);
    });

    it('should show recent operations with --recent flag', async () => {
      const monitor = PerformanceMonitor.getInstance();
      await monitor.record('test', 100, {});

      const result = await handleDebugPerformance({}, ['--recent']);

      expect(result.output).toContain('Recent Operations');
    });

    it('should show violations when thresholds exceeded', async () => {
      const monitor = PerformanceMonitor.getInstance();
      await monitor.record('contextLoad', 8000, {}); // Over 5000ms target

      const result = await handleDebugPerformance({}, []);

      expect(result.output).toContain('Active Violations');
      expect(result.output).toContain('contextLoad');
      expect(result.data.violations.length).toBeGreaterThan(0);
    });
  });

  describe('handleDebugSession()', () => {
    it('should show message when no session manager', async () => {
      const result = await handleDebugSession({}, []);

      expect(result.success).toBe(true);
      expect(result.output).toContain('SessionManager not available');
    });

    it('should show session info when active (AC-6)', async () => {
      const mockSession = {
        sessionId: 'test-123',
        startedAt: new Date().toISOString(),
        characterName: 'Kapi',
        currentLocation: 'village-of-barovia'
      };

      const mockSessionManager = {
        getCurrentSession: () => mockSession
      };

      const result = await handleDebugSession({ sessionManager: mockSessionManager }, []);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Active Session');
      expect(result.output).toContain('test-123');
      expect(result.output).toContain('Kapi');
      expect(result.output).toContain('village-of-barovia');
    });

    it('should show preloader status', async () => {
      const mockPreloader = {
        getStats: () => ({
          isPreloading: false,
          currentLocation: 'castle-ravenloft',
          preloadedCount: 2,
          preloadedLocations: ['village-of-barovia', 'tser-pool']
        })
      };

      const result = await handleDebugSession({ preloader: mockPreloader }, []);

      expect(result.output).toContain('Preloader Status');
      expect(result.output).toContain('castle-ravenloft');
      expect(result.output).toContain('2');
    });
  });

  describe('handleDebugCache()', () => {
    it('should show cache statistics (AC-6)', async () => {
      const result = await handleDebugCache({}, []);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Parsing Cache Statistics');
      expect(result.output).toContain('Entries');
      expect(result.output).toContain('Hit Rate');
      expect(result.data.entries).toBeDefined();
    });

    it('should clear cache with --clear flag', async () => {
      const cache = ParsingCache.getInstance();
      // Add mock entry manually
      cache.cache.set('test', { data: 'test' });

      const result = await handleDebugCache({}, ['--clear']);

      expect(result.output).toContain('Cache cleared');
      expect(cache.cache.size).toBe(0);
    });

    it('should reset stats with --reset flag', async () => {
      const cache = ParsingCache.getInstance();
      cache.hitCount = 10;
      cache.missCount = 5;

      const result = await handleDebugCache({}, ['--reset']);

      expect(result.output).toContain('Statistics reset');
      expect(cache.hitCount).toBe(0);
      expect(cache.missCount).toBe(0);
    });
  });

  describe('handleDebugPreload()', () => {
    it('should return error when preloader not available', async () => {
      const result = await handleDebugPreload({}, []);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });

    it('should show preloader status (AC-6)', async () => {
      const mockPreloader = {
        getStats: () => ({
          isPreloading: true,
          currentLocation: 'village-of-barovia',
          idleTimeout: 10000,
          maxPreloadLocations: 3,
          preloadedCount: 1,
          preloadedLocations: ['castle-ravenloft']
        })
      };

      const result = await handleDebugPreload({ preloader: mockPreloader }, []);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Preloader Status');
      expect(result.output).toContain('village-of-barovia');
      expect(result.output).toContain('castle-ravenloft');
      expect(result.output).toContain('10.00s'); // Idle timeout
    });

    it('should trigger preload with --trigger flag', async () => {
      const mockPreloader = {
        getStats: () => ({
          isPreloading: false,
          currentLocation: 'village-of-barovia',
          idleTimeout: 10000,
          maxPreloadLocations: 3,
          preloadedCount: 0,
          preloadedLocations: []
        }),
        preloadAdjacent: jest.fn().mockResolvedValue({
          success: true,
          preloaded: ['castle-ravenloft']
        })
      };

      const result = await handleDebugPreload({ preloader: mockPreloader }, ['--trigger']);

      expect(mockPreloader.preloadAdjacent).toHaveBeenCalledWith('village-of-barovia');
      expect(result.output).toContain('Triggering preload');
      expect(result.output).toContain('castle-ravenloft');
    });

    it('should cancel preload with --cancel flag', async () => {
      const mockPreloader = {
        getStats: () => ({
          isPreloading: true,
          currentLocation: 'test',
          idleTimeout: 10000,
          maxPreloadLocations: 3,
          preloadedCount: 0,
          preloadedLocations: []
        }),
        cancelPreload: jest.fn()
      };

      const result = await handleDebugPreload({ preloader: mockPreloader }, ['--cancel']);

      expect(mockPreloader.cancelPreload).toHaveBeenCalled();
      expect(result.output).toContain('cancelled');
    });
  });

  describe('Output Formatting', () => {
    it('should format durations correctly', async () => {
      const monitor = PerformanceMonitor.getInstance();
      await monitor.record('fast', 0.5, {});
      await monitor.record('medium', 500, {});
      await monitor.record('slow', 5000, {});

      const result = await handleDebugPerformance({}, []);

      // Check that durations are formatted as ms or s
      expect(result.output).toMatch(/\d+\.\d+ms|\d+\.\d+s/);
    });

    it('should format bytes correctly', async () => {
      const result = await handleDebugCache({}, []);

      // Check that sizes are formatted as B, KB, or MB
      expect(result.output).toMatch(/\d+B|\d+\.\d+KB|\d+\.\d+MB/);
    });
  });
});
