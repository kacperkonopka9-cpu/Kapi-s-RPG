/**
 * ContextCache - In-memory cache with LRU eviction for game context data
 *
 * Provides high-performance caching for location data, NPC profiles, events, and calendar state
 * to achieve 5x+ speedup and >75% cache hit rates during gameplay sessions.
 *
 * @class ContextCache
 * @example
 * const cache = new ContextCache({ maxSize: 100 * 1024 * 1024 }); // 100MB
 * cache.set('location:village-of-barovia:v1', locationData, 5000);
 * const data = cache.get('location:village-of-barovia:v1');
 */
class ContextCache {
  /**
   * Creates a new ContextCache instance
   *
   * @param {Object} options - Configuration options
   * @param {number} [options.maxSize=104857600] - Maximum cache size in bytes (default: 100MB)
   * @param {Object} [options.logger=console] - Logger instance for debugging
   */
  constructor(options = {}) {
    // Configuration
    this.maxSize = options.maxSize || 100 * 1024 * 1024; // 100MB default
    this.logger = options.logger || console;

    /**
     * Cache storage - Map maintains insertion order for LRU tracking
     * Key: cache key string (e.g., "location:village-of-barovia:v1")
     * Value: {
     *   data: any,           // Cached data
     *   size: number,        // Size in bytes
     *   timestamp: number,   // Last access timestamp (ms since epoch)
     *   accessCount: number  // Number of times accessed
     * }
     * @private
     */
    this.cache = new Map();

    /**
     * Cache statistics
     * @private
     */
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      memoryUsage: 0,
      totalRequests: 0
    };
  }

  /**
   * Get value from cache
   *
   * @param {string} key - Cache key (format: {type}:{id}:{version})
   * @returns {any|null} Cached value or null if not found
   * @example
   * const location = cache.get('location:village-of-barovia:v1');
   */
  get(key) {
    try {
      this.stats.totalRequests++;

      if (!this.cache.has(key)) {
        this.stats.misses++;
        return null;
      }

      // Update LRU: move to end by deleting and re-adding
      const entry = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, {
        ...entry,
        timestamp: Date.now(),
        accessCount: entry.accessCount + 1
      });

      this.stats.hits++;
      return entry.data;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error.message);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set value in cache
   *
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} [size] - Size in bytes (auto-calculated if not provided)
   * @returns {void}
   * @example
   * cache.set('location:village-of-barovia:v1', locationData, 5000);
   */
  set(key, value, size = null) {
    try {
      // Calculate size if not provided
      const entrySize = size || this._estimateSize(value);

      // Remove existing entry if updating
      if (this.cache.has(key)) {
        const oldEntry = this.cache.get(key);
        this.stats.memoryUsage -= oldEntry.size;
        this.cache.delete(key);
      }

      // Evict LRU entries if necessary
      while (this.stats.memoryUsage + entrySize > this.maxSize && this.cache.size > 0) {
        this._evictLRU();
      }

      // Add new entry
      this.cache.set(key, {
        data: value,
        size: entrySize,
        timestamp: Date.now(),
        accessCount: 1
      });

      this.stats.memoryUsage += entrySize;
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error.message);
      // Graceful degradation - log error but don't throw
    }
  }

  /**
   * Invalidate specific cache entry
   *
   * @param {string} key - Cache key to invalidate
   * @returns {boolean} True if entry was found and removed
   * @example
   * cache.invalidate('location:village-of-barovia:v1');
   */
  invalidate(key) {
    try {
      if (!this.cache.has(key)) {
        return false;
      }

      const entry = this.cache.get(key);
      this.cache.delete(key);
      this.stats.memoryUsage -= entry.size;

      return true;
    } catch (error) {
      this.logger.error(`Cache invalidate error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Invalidate all cache entries matching pattern
   *
   * @param {string} pattern - Pattern to match (supports * wildcard)
   * @returns {number} Number of entries invalidated
   * @example
   * cache.invalidatePattern('location:*'); // Invalidates all locations
   */
  invalidatePattern(pattern) {
    try {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      let invalidatedCount = 0;

      // Collect keys to invalidate (can't delete during iteration)
      const keysToInvalidate = [];
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          keysToInvalidate.push(key);
        }
      }

      // Invalidate collected keys
      for (const key of keysToInvalidate) {
        if (this.invalidate(key)) {
          invalidatedCount++;
        }
      }

      return invalidatedCount;
    } catch (error) {
      this.logger.error(`Cache invalidatePattern error for pattern ${pattern}:`, error.message);
      return 0;
    }
  }

  /**
   * Clear all cache entries
   *
   * @returns {void}
   * @example
   * cache.clear(); // Clear all cache on session start
   */
  clear() {
    try {
      this.cache.clear();
      this.stats.memoryUsage = 0;
    } catch (error) {
      this.logger.error('Cache clear error:', error.message);
    }
  }

  /**
   * Get cache statistics
   *
   * @returns {Object} Statistics object with hits, misses, evictions, memory, hitRate
   * @example
   * const stats = cache.getStats();
   * console.log(`Hit rate: ${stats.hitRate}%`);
   */
  getStats() {
    const hitRate = this.stats.totalRequests > 0
      ? (this.stats.hits / this.stats.totalRequests) * 100
      : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      memoryUsage: this.stats.memoryUsage,
      totalRequests: this.stats.totalRequests,
      hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimals
      cacheSize: this.cache.size
    };
  }

  /**
   * Reset cache statistics
   *
   * @returns {void}
   * @example
   * cache.resetStats(); // Reset on session start
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      memoryUsage: this.stats.memoryUsage, // Keep memory usage
      totalRequests: 0
    };
  }

  /**
   * Get cache metadata for session tracking (Story 5-6: Task 5.2)
   *
   * @returns {Object} Metadata object with cache keys and hit rate
   * @example
   * const metadata = cache.getCacheMetadata();
   * // Returns: { cacheKeys: ['location:village:v1', ...], hitRate: 85.5 }
   */
  getCacheMetadata() {
    const hitRate = this.stats.totalRequests > 0
      ? (this.stats.hits / this.stats.totalRequests) * 100
      : 0;

    return {
      cacheKeys: Array.from(this.cache.keys()),
      hitRate: Math.round(hitRate * 100) / 100 // Round to 2 decimals
    };
  }

  /**
   * Evict least recently used cache entry (private method)
   *
   * @private
   * @returns {void}
   */
  _evictLRU() {
    // Map maintains insertion order, first entry is LRU
    const firstKey = this.cache.keys().next().value;

    if (firstKey) {
      const entry = this.cache.get(firstKey);
      this.cache.delete(firstKey);
      this.stats.memoryUsage -= entry.size;
      this.stats.evictions++;

      this.logger.debug(`Evicted cache entry ${firstKey}, size ${Math.round(entry.size / 1024)}KB`);
    }
  }

  /**
   * Estimate size of value in bytes (private method)
   *
   * @private
   * @param {any} value - Value to estimate
   * @returns {number} Estimated size in bytes
   */
  _estimateSize(value) {
    try {
      // Rough estimate: JSON.stringify length (UTF-8 encoding ~1 byte per char)
      return JSON.stringify(value).length;
    } catch (error) {
      // Fallback for non-serializable objects
      return 1000; // 1KB default estimate
    }
  }

  /**
   * Generate cache key from components
   *
   * @param {string} type - Entity type (e.g., 'location', 'npc', 'calendar')
   * @param {string} id - Entity ID
   * @param {string} [version='v1'] - Version string
   * @returns {string} Generated cache key
   * @example
   * const key = ContextCache.generateKey('location', 'village-of-barovia', 'v1');
   * // Returns: 'location:village-of-barovia:v1'
   */
  static generateKey(type, id, version = 'v1') {
    return `${type}:${id}:${version}`;
  }
}

module.exports = ContextCache;
