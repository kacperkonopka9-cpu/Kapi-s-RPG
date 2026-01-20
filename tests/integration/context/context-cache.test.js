/**
 * ContextCache Integration Tests
 * Epic 5 Story 5.2: Context Caching Strategy
 *
 * Tests cache operations, LRU eviction, statistics tracking, and integration with ContextLoader
 */

const ContextCache = require('../../../src/context/context-cache');

describe('ContextCache', () => {
  let cache;

  beforeEach(() => {
    // Create fresh cache instance for each test
    cache = new ContextCache({ maxSize: 10000 }); // 10KB for testing
  });

  afterEach(() => {
    if (cache) {
      cache.clear();
    }
  });

  describe('Basic Cache Operations (AC-1)', () => {
    test('set and get should store and retrieve values', () => {
      const testData = { name: 'Village of Barovia', description: 'A gloomy village...' };
      const key = 'location:village-of-barovia:v1';

      cache.set(key, testData, 100);
      const retrieved = cache.get(key);

      expect(retrieved).toEqual(testData);
    });

    test('get should return null for non-existent key', () => {
      const result = cache.get('non-existent-key');
      expect(result).toBeNull();
    });

    test('set should update existing entry', () => {
      const key = 'location:test:v1';
      cache.set(key, { version: 1 }, 50);
      cache.set(key, { version: 2 }, 50);

      const result = cache.get(key);
      expect(result).toEqual({ version: 2 });
    });

    test('invalidate should remove specific cache entry', () => {
      const key = 'location:village-of-barovia:v1';
      cache.set(key, { data: 'test' }, 50);

      const removed = cache.invalidate(key);
      expect(removed).toBe(true);

      const result = cache.get(key);
      expect(result).toBeNull();
    });

    test('invalidate should return false for non-existent key', () => {
      const removed = cache.invalidate('non-existent-key');
      expect(removed).toBe(false);
    });

    test('clear should remove all cache entries', () => {
      cache.set('key1', { data: 1 }, 50);
      cache.set('key2', { data: 2 }, 50);

      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();

      const stats = cache.getStats();
      expect(stats.memoryUsage).toBe(0);
      expect(stats.cacheSize).toBe(0);
    });
  });

  describe('Pattern Invalidation (AC-1)', () => {
    test('invalidatePattern should remove matching entries', () => {
      cache.set('location:village-of-barovia:v1', { data: 1 }, 50);
      cache.set('location:castle-ravenloft:v1', { data: 2 }, 50);
      cache.set('npc:ireena_kolyana:v1', { data: 3 }, 50);

      const count = cache.invalidatePattern('location:*');
      expect(count).toBe(2);

      expect(cache.get('location:village-of-barovia:v1')).toBeNull();
      expect(cache.get('location:castle-ravenloft:v1')).toBeNull();
      expect(cache.get('npc:ireena_kolyana:v1')).not.toBeNull();
    });

    test('invalidatePattern should handle complex patterns', () => {
      cache.set('location:village-of-barovia:v1', { data: 1 }, 50);
      cache.set('location:village-of-barovia:v2', { data: 2 }, 50);
      cache.set('location:castle-ravenloft:v1', { data: 3 }, 50);

      const count = cache.invalidatePattern('location:village-of-barovia:*');
      expect(count).toBe(2);

      expect(cache.get('location:village-of-barovia:v1')).toBeNull();
      expect(cache.get('location:village-of-barovia:v2')).toBeNull();
      expect(cache.get('location:castle-ravenloft:v1')).not.toBeNull();
    });

    test('invalidatePattern should handle wildcard-only pattern', () => {
      cache.set('key1', { data: 1 }, 50);
      cache.set('key2', { data: 2 }, 50);

      const count = cache.invalidatePattern('*');
      expect(count).toBe(2);

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('LRU Eviction Policy (AC-1, Task 3)', () => {
    test('should evict LRU entry when max size exceeded', () => {
      // Set max size to 300 bytes
      cache = new ContextCache({ maxSize: 300 });

      // Add entries (100 bytes each)
      cache.set('key1', { data: '1' }, 100);
      cache.set('key2', { data: '2' }, 100);
      cache.set('key3', { data: '3' }, 100);

      // All 3 should fit
      expect(cache.get('key1')).not.toBeNull();
      expect(cache.get('key2')).not.toBeNull();
      expect(cache.get('key3')).not.toBeNull();

      // Add 4th entry - should evict key1 (LRU)
      cache.set('key4', { data: '4' }, 100);

      expect(cache.get('key1')).toBeNull(); // Evicted
      expect(cache.get('key2')).not.toBeNull();
      expect(cache.get('key3')).not.toBeNull();
      expect(cache.get('key4')).not.toBeNull();

      const stats = cache.getStats();
      expect(stats.evictions).toBe(1);
    });

    test('should update LRU order on access', () => {
      cache = new ContextCache({ maxSize: 300 });

      cache.set('key1', { data: '1' }, 100);
      cache.set('key2', { data: '2' }, 100);
      cache.set('key3', { data: '3' }, 100);

      // Access key1 to make it most recently used
      cache.get('key1');

      // Add key4 - should evict key2 (now LRU after key1 was accessed)
      cache.set('key4', { data: '4' }, 100);

      expect(cache.get('key1')).not.toBeNull(); // Still in cache
      expect(cache.get('key2')).toBeNull(); // Evicted
      expect(cache.get('key3')).not.toBeNull();
      expect(cache.get('key4')).not.toBeNull();
    });

    test('should handle multiple evictions when adding large entry', () => {
      cache = new ContextCache({ maxSize: 300 });

      cache.set('key1', { data: '1' }, 50);
      cache.set('key2', { data: '2' }, 50);
      cache.set('key3', { data: '3' }, 50);

      // Add large entry that requires evicting multiple items
      cache.set('key4', { data: '4' }, 250);

      // At least 2 entries should be evicted to make room for 250-byte entry
      const stats = cache.getStats();
      expect(stats.evictions).toBeGreaterThanOrEqual(2);
      expect(stats.memoryUsage).toBeLessThanOrEqual(300);
      expect(cache.get('key4')).not.toBeNull();
    });
  });

  describe('Cache Statistics (AC-1, AC-4, Task 4)', () => {
    test('should track hits and misses', () => {
      cache.set('key1', { data: 'test' }, 50);

      cache.get('key1'); // Hit
      cache.get('key2'); // Miss
      cache.get('key1'); // Hit
      cache.get('key3'); // Miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.totalRequests).toBe(4);
      expect(stats.hitRate).toBe(50);
    });

    test('should calculate hit rate correctly', () => {
      cache.set('key1', { data: 'test' }, 50);

      cache.get('key1'); // Hit
      cache.get('key1'); // Hit
      cache.get('key1'); // Hit
      cache.get('key2'); // Miss

      const stats = cache.getStats();
      expect(stats.hitRate).toBe(75); // 3/4 = 75%
    });

    test('should handle zero requests without division by zero', () => {
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0);
      expect(stats.totalRequests).toBe(0);
    });

    test('should track memory usage', () => {
      cache.set('key1', { data: 'test' }, 100);
      cache.set('key2', { data: 'test' }, 150);

      const stats = cache.getStats();
      expect(stats.memoryUsage).toBe(250);
    });

    test('should track evictions', () => {
      cache = new ContextCache({ maxSize: 200 });

      cache.set('key1', { data: '1' }, 100);
      cache.set('key2', { data: '2' }, 100);
      cache.set('key3', { data: '3' }, 100); // Triggers eviction

      const stats = cache.getStats();
      expect(stats.evictions).toBe(1);
    });

    test('resetStats should reset counters but preserve memory usage', () => {
      cache.set('key1', { data: 'test' }, 100);
      cache.get('key1');
      cache.get('key2');

      cache.resetStats();

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.totalRequests).toBe(0);
      expect(stats.evictions).toBe(0);
      expect(stats.memoryUsage).toBe(100); // Memory usage preserved
    });
  });

  describe('Cache Key Generation (AC-1)', () => {
    test('generateKey should create properly formatted keys', () => {
      const key1 = ContextCache.generateKey('location', 'village-of-barovia', 'v1');
      expect(key1).toBe('location:village-of-barovia:v1');

      const key2 = ContextCache.generateKey('npc', 'ireena_kolyana', 'v1');
      expect(key2).toBe('npc:ireena_kolyana:v1');

      const key3 = ContextCache.generateKey('calendar', 'current', 'v1');
      expect(key3).toBe('calendar:current:v1');
    });

    test('generateKey should use v1 as default version', () => {
      const key = ContextCache.generateKey('location', 'test');
      expect(key).toBe('location:test:v1');
    });
  });

  describe('Error Handling and Graceful Degradation (AC-1)', () => {
    test('get should not throw on errors', () => {
      expect(() => cache.get(null)).not.toThrow();
      expect(cache.get(null)).toBeNull();
    });

    test('set should not throw on errors', () => {
      expect(() => cache.set(null, { data: 'test' }, 50)).not.toThrow();
    });

    test('invalidate should not throw on errors', () => {
      expect(() => cache.invalidate(null)).not.toThrow();
    });

    test('invalidatePattern should not throw on invalid patterns', () => {
      expect(() => cache.invalidatePattern('[invalid')).not.toThrow();
      expect(cache.invalidatePattern('[invalid')).toBe(0);
    });

    test('clear should not throw on errors', () => {
      expect(() => cache.clear()).not.toThrow();
    });
  });

  describe('Memory Size Estimation', () => {
    test('should auto-estimate size if not provided', () => {
      const testData = { name: 'Test Location', description: 'A test description for a location that is moderately sized' };
      cache.set('test-key', testData); // No size param

      const stats = cache.getStats();
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    test('should handle non-serializable objects gracefully', () => {
      const circular = {};
      circular.self = circular; // Circular reference

      expect(() => cache.set('circular', circular)).not.toThrow();
    });
  });

  describe('Performance Characteristics (AC-3)', () => {
    test('cache operations should be fast', () => {
      const iterations = 1000;
      const testData = { data: 'test data for performance measurement' };

      // Use logger that doesn't actually log to avoid console.log overhead
      const silentCache = new ContextCache({
        maxSize: 500000,
        logger: { debug: () => {}, error: () => {} }
      });

      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        silentCache.set(`key-${i}`, testData, 100);
      }

      for (let i = 0; i < iterations; i++) {
        silentCache.get(`key-${i}`);
      }

      const duration = Date.now() - startTime;

      // 1000 sets + 1000 gets should complete reasonably fast (< 1 second)
      expect(duration).toBeLessThan(1000);
    });

    test('should achieve >75% hit rate in typical usage', () => {
      const locationId = 'village-of-barovia';
      const locationData = { name: 'Village of Barovia', description: 'Test' };

      // Simulate typical session: 10 context loads, same location
      for (let i = 0; i < 10; i++) {
        const key = ContextCache.generateKey('location', locationId, 'v1');
        const cached = cache.get(key);

        if (!cached) {
          // Cache miss - load and populate
          cache.set(key, locationData, 500);
        }
      }

      const stats = cache.getStats();
      // First load is miss, remaining 9 are hits = 90% hit rate
      expect(stats.hitRate).toBeGreaterThanOrEqual(75);
    });
  });
});
