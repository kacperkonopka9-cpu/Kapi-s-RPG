/**
 * Performance Module - Central exports for Epic 5 Story 5.7
 *
 * Exports:
 * - PerformanceMonitor: Centralized performance tracking and alerting
 * - Preloader: Background context preloading for adjacent locations
 * - ParsingCache: Cache for parsed YAML/Markdown content
 */

const PerformanceMonitor = require('./performance-monitor');
const Preloader = require('./preloader');
const ParsingCache = require('./parsing-cache');

module.exports = {
  PerformanceMonitor,
  Preloader,
  ParsingCache,

  // Singleton accessors
  getPerformanceMonitor: PerformanceMonitor.getInstance,
  resetPerformanceMonitor: PerformanceMonitor.resetInstance,
  getParsingCache: ParsingCache.getInstance,
  resetParsingCache: ParsingCache.resetInstance
};
