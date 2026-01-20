/**
 * ParsingCache - Cache for parsed YAML/Markdown content with mtime-based invalidation
 * Epic 5 Story 5.7: Performance Optimization
 *
 * Provides:
 * - Caches parsed objects keyed by file path + modification timestamp
 * - Automatic invalidation when file modification time changes
 * - 5x+ speedup for repeated parses (verified by performance tests)
 * - Hit/miss tracking for statistics
 *
 * AC-4: Markdown/YAML Parsing Cache
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {any} data - Parsed data
 * @property {number} mtime - File modification time (ms since epoch)
 * @property {number} accessCount - Number of times accessed
 * @property {number} cachedAt - When entry was cached (ms since epoch)
 */

class ParsingCache {
  /**
   * Create a new ParsingCache
   * @param {Object} deps - Dependency injection
   * @param {Object} deps.fs - File system module (default: require('fs').promises)
   * @param {Object} deps.yaml - YAML parser (default: require('js-yaml'))
   * @param {number} deps.maxSize - Maximum cache size in bytes (default: 50MB)
   */
  constructor(deps = {}) {
    this.fs = deps.fs || fs;
    this.yaml = deps.yaml || yaml;
    this.maxSize = deps.maxSize || 50 * 1024 * 1024; // 50MB default

    /**
     * Cache storage
     * Key: file path
     * Value: CacheEntry
     * @private
     */
    this.cache = new Map();

    /**
     * Cache statistics
     * @private
     */
    this.hitCount = 0;
    this.missCount = 0;
    this.estimatedSize = 0;
  }

  /**
   * Get cached parse result or parse fresh
   * AC-4: Cache parsed objects keyed by path+mtime
   *
   * @param {string} filePath - Path to file
   * @param {Function} parser - Parse function (receives file content string, returns parsed data)
   * @returns {Promise<{data: any, cached: boolean}>} Parsed data with cache status
   */
  async getOrParse(filePath, parser) {
    try {
      // 1. Get file modification time
      const stat = await this.fs.stat(filePath);
      const mtime = stat.mtimeMs;

      // 2. Check cache for existing entry with matching mtime
      const existing = this.cache.get(filePath);

      if (existing && existing.mtime === mtime) {
        // Cache hit - increment stats and return cached data
        this.hitCount++;
        existing.accessCount++;

        return {
          data: existing.data,
          cached: true
        };
      }

      // 3. Cache miss - read file and parse
      this.missCount++;

      const content = await this.fs.readFile(filePath, 'utf-8');
      const data = parser(content);

      // 4. Store in cache
      const entry = {
        data,
        mtime,
        accessCount: 1,
        cachedAt: Date.now()
      };

      // Estimate size and manage cache size
      const entrySize = this._estimateSize(data);
      this._ensureSpace(entrySize);

      this.cache.set(filePath, entry);
      this.estimatedSize += entrySize;

      return {
        data,
        cached: false
      };

    } catch (error) {
      // If file doesn't exist or can't be read, throw
      throw error;
    }
  }

  /**
   * Parse YAML file with caching
   * Convenience method for YAML files
   *
   * @param {string} filePath - Path to YAML file
   * @returns {Promise<{data: any, cached: boolean}>} Parsed YAML data
   */
  async parseYaml(filePath) {
    return this.getOrParse(filePath, (content) => this.yaml.load(content));
  }

  /**
   * Parse YAML frontmatter from Markdown file with caching
   * Extracts content between --- delimiters
   *
   * @param {string} filePath - Path to Markdown file
   * @returns {Promise<{data: {frontmatter: Object, content: string}, cached: boolean}>}
   */
  async parseFrontmatter(filePath) {
    return this.getOrParse(filePath, (content) => {
      const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

      if (frontmatterMatch) {
        return {
          frontmatter: this.yaml.load(frontmatterMatch[1]),
          content: frontmatterMatch[2]
        };
      }

      // No frontmatter found
      return {
        frontmatter: {},
        content
      };
    });
  }

  /**
   * Clear cache for specific file
   * AC-4: Cache invalidation
   *
   * @param {string} filePath - Path to invalidate
   * @returns {boolean} True if entry was removed
   */
  invalidate(filePath) {
    const existing = this.cache.get(filePath);

    if (existing) {
      this.estimatedSize -= this._estimateSize(existing.data);
      this.cache.delete(filePath);
      return true;
    }

    return false;
  }

  /**
   * Invalidate entries matching a pattern
   * @param {string|RegExp} pattern - Pattern to match against file paths
   * @returns {number} Number of entries invalidated
   */
  invalidateByPattern(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let count = 0;

    for (const filePath of this.cache.keys()) {
      if (regex.test(filePath)) {
        this.invalidate(filePath);
        count++;
      }
    }

    return count;
  }

  /**
   * Clear entire cache
   * AC-4: Cache management
   */
  clearAll() {
    this.cache.clear();
    this.estimatedSize = 0;
  }

  /**
   * Get cache statistics
   * AC-4: Statistics tracking
   *
   * @returns {{entries: number, hitRate: number, hitCount: number, missCount: number, estimatedSize: number}}
   */
  getStats() {
    const totalRequests = this.hitCount + this.missCount;

    return {
      entries: this.cache.size,
      hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0,
      hitCount: this.hitCount,
      missCount: this.missCount,
      estimatedSize: this.estimatedSize,
      maxSize: this.maxSize
    };
  }

  /**
   * Reset statistics (but keep cache)
   */
  resetStats() {
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Check if a file is cached (and still valid)
   * @param {string} filePath - Path to check
   * @returns {Promise<boolean>} True if cached and valid
   */
  async isCached(filePath) {
    const existing = this.cache.get(filePath);

    if (!existing) {
      return false;
    }

    try {
      const stat = await this.fs.stat(filePath);
      return existing.mtime === stat.mtimeMs;
    } catch {
      return false;
    }
  }

  /**
   * Get cache entry info (without counting as access)
   * @param {string} filePath - Path to check
   * @returns {Object|null} Entry info or null
   */
  getEntryInfo(filePath) {
    const entry = this.cache.get(filePath);

    if (!entry) {
      return null;
    }

    return {
      mtime: entry.mtime,
      accessCount: entry.accessCount,
      cachedAt: entry.cachedAt,
      age: Date.now() - entry.cachedAt
    };
  }

  /**
   * Estimate size of data object
   * @private
   * @param {any} data - Data to estimate
   * @returns {number} Estimated size in bytes
   */
  _estimateSize(data) {
    try {
      // Rough estimate using JSON serialization
      const json = JSON.stringify(data);
      return json.length * 2; // UTF-16 encoding
    } catch {
      return 1000; // Default estimate if can't serialize
    }
  }

  /**
   * Ensure space for new entry by evicting LRU entries if needed
   * @private
   * @param {number} neededSize - Size needed for new entry
   */
  _ensureSpace(neededSize) {
    while (this.estimatedSize + neededSize > this.maxSize && this.cache.size > 0) {
      // Find LRU entry (oldest cachedAt with lowest accessCount)
      let lruPath = null;
      let lruScore = Infinity;

      for (const [path, entry] of this.cache.entries()) {
        // Score based on access count and age
        const age = Date.now() - entry.cachedAt;
        const score = entry.accessCount / (age / 1000); // accesses per second

        if (score < lruScore) {
          lruScore = score;
          lruPath = path;
        }
      }

      if (lruPath) {
        this.invalidate(lruPath);
      } else {
        break;
      }
    }
  }
}

// Singleton instance for global use
let instance = null;

/**
 * Get singleton ParsingCache instance
 * @param {Object} deps - Dependencies (only used on first call)
 * @returns {ParsingCache}
 */
function getInstance(deps = {}) {
  if (!instance) {
    instance = new ParsingCache(deps);
  }
  return instance;
}

/**
 * Reset singleton instance (for testing)
 */
function resetInstance() {
  instance = null;
}

module.exports = ParsingCache;
module.exports.getInstance = getInstance;
module.exports.resetInstance = resetInstance;
