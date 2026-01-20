/**
 * PerformanceMonitor - Centralized performance tracking and alerting
 * Epic 5 Story 5.7: Performance Optimization
 *
 * Provides:
 * - Metrics recording with in-memory ring buffer (last 1000 entries)
 * - Writes to performance.log in structured format
 * - Query methods: getLastN(), getAverageTime(), getP95Time()
 * - Threshold alerting with checkThresholds()
 * - High-precision timing via process.hrtime.bigint()
 *
 * AC-1: PerformanceMonitor Module Implemented
 * AC-2: Performance Alerting System
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Performance metric entry structure
 * @typedef {Object} MetricEntry
 * @property {string} operationType - Type of operation (contextLoad, fileRead, cacheHit, etc.)
 * @property {number} durationMs - Duration in milliseconds
 * @property {number} timestamp - Unix timestamp when recorded
 * @property {Object} context - Additional context data (locationId, tokenCount, etc.)
 */

/**
 * Threshold violation structure
 * @typedef {Object} ThresholdViolation
 * @property {string} operation - Operation type that exceeded threshold
 * @property {number} actual - Actual duration in ms
 * @property {number} target - Target threshold in ms
 * @property {number} threshold - Alert threshold (target * 1.5)
 * @property {number} percentOver - Percentage over target
 */

class PerformanceMonitor {
  /**
   * Create a new PerformanceMonitor
   * @param {Object} deps - Dependency injection
   * @param {Object} deps.fs - File system module (default: require('fs').promises)
   * @param {Object} deps.path - Path module (default: require('path'))
   * @param {string} deps.logPath - Path to performance log file (default: 'performance.log')
   * @param {number} deps.maxEntries - Max entries in ring buffer (default: 1000)
   * @param {Function} deps.vscodeNotify - VS Code notification callback (optional)
   */
  constructor(deps = {}) {
    this.fs = deps.fs || fs;
    this.path = deps.path || path;
    this.logPath = deps.logPath || 'performance.log';
    this.maxEntries = deps.maxEntries || 1000;
    this.vscodeNotify = deps.vscodeNotify || null;

    /**
     * In-memory ring buffer for metrics
     * @private
     * @type {MetricEntry[]}
     */
    this.metrics = [];

    /**
     * Performance thresholds in milliseconds
     * Alert when exceeded by 50% (threshold = target * 1.5)
     */
    this.thresholds = {
      contextLoad: 5000,       // 5 seconds
      sessionStartup: 120000,  // 2 minutes
      sessionEnd: 30000,       // 30 seconds
      locationTransition: 10000, // 10 seconds
      fileIO: 1000,            // 1 second
      cacheHit: 100,           // 100ms (should be very fast)
      cacheMiss: 500,          // 500ms (expected to be slower)
      preload: 5000            // 5 seconds for background preload
    };

    /**
     * Track if we're in VS Code context
     * @private
     */
    this.isVSCode = deps.isVSCode || false;
  }

  /**
   * Record a performance metric
   * AC-1: Centralized tracking with write to performance.log
   * AC-2: Check threshold and warn if exceeded
   *
   * @param {string} operationType - e.g., 'contextLoad', 'fileRead', 'cacheHit'
   * @param {number} durationMs - Duration in milliseconds
   * @param {Object} context - Additional context (locationId, tokenCount, etc.)
   * @returns {Promise<void>}
   */
  async record(operationType, durationMs, context = {}) {
    const timestamp = Date.now();

    // Create metric entry
    const entry = {
      operationType,
      durationMs: Math.round(durationMs * 100) / 100, // Round to 2 decimal places
      timestamp,
      context
    };

    // 1. Add to in-memory ring buffer (Task 1.2.1)
    this.metrics.push(entry);

    // Evict oldest if exceeding max size
    if (this.metrics.length > this.maxEntries) {
      this.metrics.shift();
    }

    // 2. Write to performance.log (Task 1.2.2)
    await this._writeToLog(entry);

    // 3. Check threshold and warn if exceeded (Task 1.2.3)
    await this._checkAndWarn(operationType, durationMs, context);
  }

  /**
   * Start a timer for an operation
   * AC-1: High-precision timing via process.hrtime.bigint()
   *
   * @param {string} operationType - Operation type to time
   * @returns {Function} Stop function that records the metric and returns duration
   */
  startTimer(operationType) {
    const startTime = process.hrtime.bigint();

    return async (context = {}) => {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;
      await this.record(operationType, durationMs, context);
      return durationMs;
    };
  }

  /**
   * Get last N metrics of a type
   * AC-1: Query API - getLastN()
   *
   * @param {string} operationType - Operation type to filter (or null for all)
   * @param {number} count - Number of entries to return (default: 10)
   * @returns {MetricEntry[]} Array of metric entries
   */
  getLastN(operationType = null, count = 10) {
    let filtered = this.metrics;

    if (operationType) {
      filtered = this.metrics.filter(m => m.operationType === operationType);
    }

    return filtered.slice(-count);
  }

  /**
   * Get average time for an operation type
   * AC-1: Query API - getAverageTime()
   *
   * @param {string} operationType - Operation type to calculate average for
   * @returns {number} Average duration in ms (0 if no entries)
   */
  getAverageTime(operationType) {
    const filtered = this.metrics.filter(m => m.operationType === operationType);

    if (filtered.length === 0) {
      return 0;
    }

    const sum = filtered.reduce((acc, m) => acc + m.durationMs, 0);
    return Math.round((sum / filtered.length) * 100) / 100;
  }

  /**
   * Get 95th percentile time for an operation type
   * AC-1: Query API - getP95Time()
   *
   * @param {string} operationType - Operation type to calculate P95 for
   * @returns {number} 95th percentile duration in ms (0 if no entries)
   */
  getP95Time(operationType) {
    const filtered = this.metrics.filter(m => m.operationType === operationType);

    if (filtered.length === 0) {
      return 0;
    }

    // Sort by duration ascending
    const sorted = filtered.map(m => m.durationMs).sort((a, b) => a - b);

    // Calculate 95th percentile index
    const p95Index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[Math.max(0, p95Index)];
  }

  /**
   * Check if any recent metrics exceed thresholds
   * AC-2: Performance Alerting - checkThresholds() API
   *
   * @returns {ThresholdViolation[]} Array of threshold violations
   */
  checkThresholds() {
    const violations = [];

    // Check each operation type that has a threshold
    for (const [operationType, target] of Object.entries(this.thresholds)) {
      const threshold = target * 1.5; // Alert at 50% over target
      const recent = this.getLastN(operationType, 5);

      for (const entry of recent) {
        if (entry.durationMs > threshold) {
          violations.push({
            operation: operationType,
            actual: entry.durationMs,
            target,
            threshold,
            percentOver: Math.round(((entry.durationMs - target) / target) * 100)
          });
        }
      }
    }

    return violations;
  }

  /**
   * Get all metrics (for debugging/testing)
   * @returns {MetricEntry[]} All recorded metrics
   */
  getAllMetrics() {
    return [...this.metrics];
  }

  /**
   * Clear all metrics (for testing)
   */
  clearMetrics() {
    this.metrics = [];
  }

  /**
   * Get summary statistics for all operation types
   * @returns {Object} Summary with averages, counts, and P95 for each type
   */
  getSummary() {
    const summary = {};
    const types = new Set(this.metrics.map(m => m.operationType));

    for (const type of types) {
      const filtered = this.metrics.filter(m => m.operationType === type);
      summary[type] = {
        count: filtered.length,
        average: this.getAverageTime(type),
        p95: this.getP95Time(type),
        target: this.thresholds[type] || null
      };
    }

    return summary;
  }

  /**
   * Write metric entry to performance.log
   * @private
   * @param {MetricEntry} entry - Metric entry to write
   */
  async _writeToLog(entry) {
    try {
      const timestamp = new Date(entry.timestamp).toISOString();
      const contextStr = Object.keys(entry.context).length > 0
        ? ` ${JSON.stringify(entry.context)}`
        : '';

      const logLine = `[${timestamp}] [${entry.operationType}] ${entry.durationMs}ms${contextStr}\n`;

      await this.fs.appendFile(this.logPath, logLine, 'utf-8');
    } catch (error) {
      // Silently fail log writes - don't break application
      console.error('Failed to write performance log:', error.message);
    }
  }

  /**
   * Check threshold and warn if exceeded
   * AC-2: Performance Alerting System
   * @private
   * @param {string} operationType - Operation type
   * @param {number} durationMs - Duration in milliseconds
   * @param {Object} context - Additional context
   */
  async _checkAndWarn(operationType, durationMs, context) {
    const target = this.thresholds[operationType];

    if (!target) {
      return; // No threshold defined for this operation
    }

    const threshold = target * 1.5; // Alert at 50% over target

    if (durationMs > threshold) {
      // Log warning to performance.log
      const warningLine = `[PERF WARNING] ${operationType} exceeded target: ${(durationMs / 1000).toFixed(1)}s (target: ${(target / 1000).toFixed(1)}s, threshold: ${(threshold / 1000).toFixed(1)}s)\n`;

      try {
        await this.fs.appendFile(this.logPath, warningLine, 'utf-8');
      } catch (error) {
        console.error('Failed to write performance warning:', error.message);
      }

      // AC-2: VS Code notification if available
      if (this.vscodeNotify) {
        const contextInfo = context.locationId ? ` at ${context.locationId}` : '';
        this.vscodeNotify(
          `Performance Warning: ${operationType} took ${(durationMs / 1000).toFixed(1)}s (target: ${(target / 1000).toFixed(1)}s)${contextInfo}`
        );
      }
    }
  }

  /**
   * Set VS Code notification callback
   * AC-2: Integration with VS Code notifications
   * @param {Function} callback - Function to call with warning message
   */
  setVSCodeNotify(callback) {
    this.vscodeNotify = callback;
    this.isVSCode = true;
  }

  /**
   * Update threshold for an operation type
   * @param {string} operationType - Operation type
   * @param {number} targetMs - New target in milliseconds
   */
  setThreshold(operationType, targetMs) {
    this.thresholds[operationType] = targetMs;
  }

  /**
   * Get current thresholds
   * @returns {Object} Current thresholds
   */
  getThresholds() {
    return { ...this.thresholds };
  }
}

// Singleton instance for global use
let instance = null;

/**
 * Get singleton PerformanceMonitor instance
 * @param {Object} deps - Dependencies (only used on first call)
 * @returns {PerformanceMonitor}
 */
function getInstance(deps = {}) {
  if (!instance) {
    instance = new PerformanceMonitor(deps);
  }
  return instance;
}

/**
 * Reset singleton instance (for testing)
 */
function resetInstance() {
  instance = null;
}

module.exports = PerformanceMonitor;
module.exports.getInstance = getInstance;
module.exports.resetInstance = resetInstance;
