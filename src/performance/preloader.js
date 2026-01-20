/**
 * Preloader - Background context preloading for adjacent locations
 * Epic 5 Story 5.7: Performance Optimization
 *
 * Provides:
 * - Idle detection (configurable timeout, default 10 seconds)
 * - Background preloading of adjacent location data
 * - Cancellation support via AbortController
 * - Integration with ContextCache (stores with "preload-" prefix)
 *
 * AC-3: Context Preloading Strategy
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

class Preloader {
  /**
   * Create a new Preloader
   * @param {Object} deps - Dependency injection
   * @param {Object} deps.contextCache - ContextCache instance (Story 5-2)
   * @param {Object} deps.locationLoader - LocationLoader instance (Epic 1)
   * @param {Object} deps.performanceMonitor - PerformanceMonitor instance (optional)
   * @param {number} deps.idleTimeout - Idle timeout in ms (default: 10000)
   * @param {number} deps.maxPreloadLocations - Max locations to preload (default: 3)
   * @param {Object} deps.fs - File system module
   * @param {Object} deps.path - Path module
   * @param {Object} deps.yaml - YAML parser
   * @param {string} deps.locationsDir - Base path for locations (default: 'game-data/locations')
   */
  constructor(deps = {}) {
    this.contextCache = deps.contextCache || null;
    this.locationLoader = deps.locationLoader || null;
    this.performanceMonitor = deps.performanceMonitor || null;
    this.idleTimeout = deps.idleTimeout || 10000; // 10 seconds default
    this.maxPreloadLocations = deps.maxPreloadLocations || 3;
    this.fs = deps.fs || fs;
    this.path = deps.path || path;
    this.yaml = deps.yaml || yaml;
    this.locationsDir = deps.locationsDir || 'game-data/locations';

    /**
     * Current idle timer reference
     * @private
     */
    this.idleTimer = null;

    /**
     * Current location ID for preload targeting
     * @private
     */
    this.currentLocationId = null;

    /**
     * Preloading status to prevent concurrent preloads
     * @private
     */
    this.isPreloading = false;

    /**
     * AbortController for async cancellation
     * @private
     */
    this.abortController = null;

    /**
     * Preloaded locations this session (for tracking)
     * @private
     */
    this.preloadedLocations = new Set();
  }

  /**
   * Start monitoring for idle time
   * AC-3: Start preloading after idle timeout
   *
   * @param {string} currentLocationId - Current player location
   */
  startIdleMonitor(currentLocationId) {
    // Clear any existing timer
    this.resetIdleTimer();

    // Store current location for preload targeting
    this.currentLocationId = currentLocationId;

    // Set new timer for idle timeout
    this.idleTimer = setTimeout(async () => {
      await this.preloadAdjacent(currentLocationId);
    }, this.idleTimeout);
  }

  /**
   * Reset idle timer (player performed action)
   * AC-3: Preloading respects idle detection
   */
  resetIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    // Cancel any ongoing preload
    if (this.isPreloading && this.abortController) {
      this.abortController.abort();
      this.isPreloading = false;
    }
  }

  /**
   * Preload adjacent location data
   * AC-3: Load adjacent locations in background, store with "preload-" prefix
   *
   * @param {string} currentLocationId - Current player location
   * @returns {Promise<{success: boolean, preloaded?: string[], error?: string}>}
   */
  async preloadAdjacent(currentLocationId) {
    // Prevent concurrent preloads
    if (this.isPreloading) {
      return { success: false, error: 'Preload already in progress' };
    }

    this.isPreloading = true;
    this.abortController = new AbortController();
    const preloadedLocations = [];

    try {
      // Start performance timing if monitor available
      const stopTimer = this.performanceMonitor
        ? this.performanceMonitor.startTimer('preload')
        : null;

      // 1. Get adjacent locations from metadata.yaml connections
      const connections = await this._getAdjacentLocations(currentLocationId);

      if (!connections || connections.length === 0) {
        this.isPreloading = false;
        return { success: true, preloaded: [], message: 'No adjacent locations found' };
      }

      // Limit to max preload locations
      const toPreload = connections.slice(0, this.maxPreloadLocations);

      // 2. For each adjacent location, preload if not already cached
      for (const locationId of toPreload) {
        // Check if aborted
        if (this.abortController.signal.aborted) {
          break;
        }

        // Check if already cached (with any prefix)
        const cacheKey = `preload-${locationId}`;
        if (this.contextCache && this.contextCache.get(cacheKey)) {
          continue; // Already preloaded
        }

        // Also check if location is already in main cache
        const mainCacheKey = `location:${locationId}:v1`;
        if (this.contextCache && this.contextCache.get(mainCacheKey)) {
          continue; // Already in main cache
        }

        try {
          // Load Description.md and metadata.yaml (lightweight preload)
          const preloadData = await this._loadPreloadData(locationId);

          if (preloadData && this.contextCache) {
            // Store in cache with "preload-" prefix
            this.contextCache.set(cacheKey, preloadData);
            preloadedLocations.push(locationId);
            this.preloadedLocations.add(locationId);
          }
        } catch (error) {
          // Don't crash on individual preload failure (AC-3 requirement)
          console.warn(`Preload failed for ${locationId}:`, error.message);
        }
      }

      // Record performance if available
      if (stopTimer) {
        await stopTimer({ locationId: currentLocationId, preloaded: preloadedLocations.length });
      }

      this.isPreloading = false;
      return {
        success: true,
        preloaded: preloadedLocations
      };

    } catch (error) {
      this.isPreloading = false;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Stop preloading (player resumed activity or navigation)
   * AC-3: Cancellation support
   */
  cancelPreload() {
    // Clear idle timer
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    // Abort ongoing preload
    if (this.abortController) {
      this.abortController.abort();
    }

    this.isPreloading = false;
  }

  /**
   * Check if a location has been preloaded
   * @param {string} locationId - Location ID to check
   * @returns {boolean} True if preloaded
   */
  isPreloaded(locationId) {
    if (!this.contextCache) {
      return false;
    }

    const cacheKey = `preload-${locationId}`;
    return this.contextCache.get(cacheKey) !== null;
  }

  /**
   * Get preload data from cache (and optionally promote to main cache)
   * @param {string} locationId - Location ID
   * @param {boolean} promote - Whether to copy to main cache (default: true)
   * @returns {Object|null} Preloaded data or null
   */
  getPreloadedData(locationId, promote = true) {
    if (!this.contextCache) {
      return null;
    }

    const preloadKey = `preload-${locationId}`;
    const data = this.contextCache.get(preloadKey);

    if (data && promote) {
      // Copy to main cache with standard key
      const mainKey = `location:${locationId}:v1`;
      this.contextCache.set(mainKey, data);
    }

    return data;
  }

  /**
   * Get preload statistics
   * @returns {Object} Preload stats
   */
  getStats() {
    return {
      isPreloading: this.isPreloading,
      currentLocation: this.currentLocationId,
      preloadedCount: this.preloadedLocations.size,
      preloadedLocations: [...this.preloadedLocations],
      idleTimeout: this.idleTimeout,
      maxPreloadLocations: this.maxPreloadLocations
    };
  }

  /**
   * Clear preload statistics (e.g., on session end)
   */
  clearStats() {
    this.preloadedLocations.clear();
    this.cancelPreload();
  }

  /**
   * Get adjacent locations from metadata.yaml connections
   * @private
   * @param {string} locationId - Current location ID
   * @returns {Promise<string[]>} Array of adjacent location IDs
   */
  async _getAdjacentLocations(locationId) {
    try {
      const metadataPath = this.path.join(this.locationsDir, locationId, 'metadata.yaml');
      const content = await this.fs.readFile(metadataPath, 'utf-8');
      const metadata = this.yaml.load(content);

      if (!metadata || !metadata.connections) {
        return [];
      }

      // Extract location IDs from connections
      // Connections can be array of strings or objects with locationId
      const connections = metadata.connections;

      if (Array.isArray(connections)) {
        return connections.map(c => {
          if (typeof c === 'string') {
            return c;
          }
          if (typeof c === 'object' && c.locationId) {
            return c.locationId;
          }
          if (typeof c === 'object' && c.location_id) {
            return c.location_id;
          }
          return null;
        }).filter(Boolean);
      }

      return [];
    } catch (error) {
      // Return empty array if metadata can't be read
      return [];
    }
  }

  /**
   * Load lightweight preload data (Description.md + metadata.yaml only)
   * @private
   * @param {string} locationId - Location ID to preload
   * @returns {Promise<Object>} Preload data object
   */
  async _loadPreloadData(locationId) {
    const locationPath = this.path.join(this.locationsDir, locationId);

    // Read Description.md and metadata.yaml in parallel
    const [descriptionContent, metadataContent] = await Promise.all([
      this.fs.readFile(this.path.join(locationPath, 'Description.md'), 'utf-8'),
      this.fs.readFile(this.path.join(locationPath, 'metadata.yaml'), 'utf-8')
    ]);

    // Parse metadata
    const metadata = this.yaml.load(metadataContent);

    // Extract NPC headers from NPCs.md (for token efficiency)
    let npcHeaders = [];
    try {
      const npcsContent = await this.fs.readFile(this.path.join(locationPath, 'NPCs.md'), 'utf-8');
      // Extract just the headers (lines starting with ## or ###)
      npcHeaders = npcsContent
        .split('\n')
        .filter(line => line.startsWith('## ') || line.startsWith('### '))
        .map(line => line.replace(/^#+\s+/, '').trim());
    } catch {
      // NPCs.md might not exist
    }

    return {
      locationId,
      description: descriptionContent,
      metadata,
      npcHeaders,
      preloadedAt: Date.now()
    };
  }
}

module.exports = Preloader;
