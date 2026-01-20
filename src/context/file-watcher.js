/**
 * FileWatcher - Monitors game data files for changes and triggers cache invalidation
 *
 * Uses chokidar for cross-platform file system watching with debouncing to handle
 * rapid file changes efficiently.
 *
 * @class FileWatcher
 * @example
 * const watcher = new FileWatcher({ debounceDelay: 500 });
 * watcher.on('change', (filePath, changeType) => {
 *   console.log(`File ${changeType}: ${filePath}`);
 *   cache.invalidatePattern(mapPathToCacheKey(filePath));
 * });
 * watcher.start(['game-data/locations', 'game-data/npcs']);
 */

const chokidar = require('chokidar');
const path = require('path');
const { EventEmitter } = require('events');

class FileWatcher extends EventEmitter {
  /**
   * Creates a new FileWatcher instance
   *
   * @param {Object} options - Configuration options
   * @param {number} [options.debounceDelay=500] - Debounce delay in milliseconds
   * @param {Object} [options.logger=console] - Logger instance
   * @param {number} [options.maxWatchers=100] - Maximum number of watchers (VS Code limit)
   */
  constructor(options = {}) {
    super();

    this.debounceDelay = options.debounceDelay || 500;
    this.logger = options.logger || console;
    this.maxWatchers = options.maxWatchers || 100;

    this.watcher = null;
    this.debounceTimers = new Map(); // Map<filePath, timeoutId>
    this.isWatching = false;
  }

  /**
   * Start watching specified paths
   *
   * @param {string[]} paths - Array of paths to watch
   * @returns {void}
   * @example
   * watcher.start(['game-data/locations', 'game-data/npcs']);
   */
  start(paths) {
    if (this.isWatching) {
      this.logger.warn('FileWatcher already started');
      return;
    }

    try {
      // Chokidar configuration
      const watchOptions = {
        persistent: true,
        ignoreInitial: true, // Don't emit events for existing files
        awaitWriteFinish: {
          stabilityThreshold: 100, // Wait 100ms after file stops changing
          pollInterval: 50
        },
        // Use recursive watching on parent directories to stay within VS Code limits
        depth: undefined, // Watch recursively
        usePolling: false // Use native FS events when possible
      };

      this.watcher = chokidar.watch(paths, watchOptions);

      // Event handlers
      this.watcher
        .on('add', (filePath) => this._handleChange(filePath, 'add'))
        .on('change', (filePath) => this._handleChange(filePath, 'change'))
        .on('unlink', (filePath) => this._handleChange(filePath, 'unlink'))
        .on('error', (error) => this._handleError(error))
        .on('ready', () => {
          this.isWatching = true;
          this.logger.debug(`FileWatcher started, watching ${paths.length} paths`);
        });

    } catch (error) {
      this.logger.error('FileWatcher start error:', error.message);
      // Graceful degradation - don't crash, just log error
      this.isWatching = false;
    }
  }

  /**
   * Stop watching files
   *
   * @returns {Promise<void>}
   * @example
   * await watcher.stop(); // Stop on session end
   */
  async stop() {
    if (!this.isWatching) {
      return;
    }

    try {
      // Clear all pending debounce timers
      for (const timerId of this.debounceTimers.values()) {
        clearTimeout(timerId);
      }
      this.debounceTimers.clear();

      // Close watcher
      if (this.watcher) {
        await this.watcher.close();
        this.watcher = null;
      }

      this.isWatching = false;
      this.logger.debug('FileWatcher stopped');
    } catch (error) {
      this.logger.error('FileWatcher stop error:', error.message);
    }
  }

  /**
   * Handle file change with debouncing (private method)
   *
   * @private
   * @param {string} filePath - Path to changed file
   * @param {string} changeType - Type of change ('add'|'change'|'unlink')
   * @returns {void}
   */
  _handleChange(filePath, changeType) {
    // Clear existing debounce timer for this file
    if (this.debounceTimers.has(filePath)) {
      clearTimeout(this.debounceTimers.get(filePath));
    }

    // Set new debounce timer
    const timerId = setTimeout(() => {
      this.debounceTimers.delete(filePath);
      this._emitChange(filePath, changeType);
    }, this.debounceDelay);

    this.debounceTimers.set(filePath, timerId);
  }

  /**
   * Emit change event (private method)
   *
   * @private
   * @param {string} filePath - Path to changed file
   * @param {string} changeType - Type of change
   * @returns {void}
   */
  _emitChange(filePath, changeType) {
    try {
      // Normalize path separators for cross-platform compatibility
      const normalizedPath = filePath.replace(/\\/g, '/');

      this.logger.debug(`File ${changeType}: ${normalizedPath}`);
      this.emit('change', normalizedPath, changeType);
    } catch (error) {
      this.logger.error('FileWatcher emit error:', error.message);
    }
  }

  /**
   * Handle watcher errors (private method)
   *
   * @private
   * @param {Error} error - Error object
   * @returns {void}
   */
  _handleError(error) {
    this.logger.error('FileWatcher error:', error.message);
    this.emit('error', error);
    // Don't crash - continue watching
  }

  /**
   * Map file path to cache key pattern for invalidation
   *
   * @static
   * @param {string} filePath - File path (e.g., 'game-data/locations/village-of-barovia/Description.md')
   * @returns {string} Cache key pattern (e.g., 'location:village-of-barovia:*')
   * @example
   * const pattern = FileWatcher.mapPathToCacheKey('game-data/locations/village-of-barovia/State.md');
   * // Returns: 'location:village-of-barovia:*'
   */
  static mapPathToCacheKey(filePath) {
    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, '/');

    try {
      // Special case: calendar.yaml (at root of game-data)
      if (normalizedPath.includes('calendar.yaml')) {
        return 'calendar:*';
      }

      // Extract type and ID from path
      // Format: game-data/{type}/{id}/{file}.md
      const pathParts = normalizedPath.split('/');

      if (pathParts.length < 3 || pathParts[0] !== 'game-data') {
        return null; // Not a game data file
      }

      const type = pathParts[1]; // 'locations', 'npcs', 'quests', etc.
      const id = pathParts[2]; // 'village-of-barovia', 'ireena_kolyana', etc.

      // Map plural types to singular for cache keys
      const typeMap = {
        'locations': 'location',
        'npcs': 'npc',
        'quests': 'quest',
        'items': 'item',
        'monsters': 'monster',
        'events': 'event'
      };

      const cacheType = typeMap[type] || type;

      // Return cache key pattern with wildcard version
      return `${cacheType}:${id}:*`;

    } catch (error) {
      return null;
    }
  }
}

module.exports = FileWatcher;
