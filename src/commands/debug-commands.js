/**
 * Debug Commands - Performance monitoring and debugging slash commands
 * Epic 5 Story 5.7: Performance Optimization
 *
 * Provides:
 * - /debug performance - Show performance metrics and statistics
 * - /debug session - Show session state and cache info
 * - /debug cache - Show parsing cache statistics
 * - /debug preload - Show preloader status
 *
 * AC-6: Debug Commands for Performance Monitoring
 */

const PerformanceMonitor = require('../performance/performance-monitor');
const ParsingCache = require('../performance/parsing-cache');

/**
 * Format milliseconds to human-readable string
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted string (e.g., "1.5s", "250ms")
 */
function formatDuration(ms) {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${ms.toFixed(2)}ms`;
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Bytes
 * @returns {string} Formatted string (e.g., "1.5MB", "500KB")
 */
function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)}KB`;
  }
  return `${bytes}B`;
}

/**
 * Handle /debug performance command
 * Shows performance metrics summary
 *
 * @param {Object} deps - Dependencies
 * @param {string[]} args - Command arguments
 * @returns {Object} Result with performance data
 */
async function handleDebugPerformance(deps, args = []) {
  const monitor = PerformanceMonitor.getInstance();
  const summary = monitor.getSummary();
  const thresholds = monitor.getThresholds();
  const violations = monitor.checkThresholds();

  // Build output
  const lines = [
    '## Performance Metrics',
    ''
  ];

  // Summary by operation type
  if (Object.keys(summary).length === 0) {
    lines.push('No performance metrics recorded yet.');
  } else {
    lines.push('### Operation Statistics');
    lines.push('| Operation | Count | Average | P95 | Target |');
    lines.push('|-----------|-------|---------|-----|--------|');

    for (const [operation, stats] of Object.entries(summary)) {
      const p95 = monitor.getP95Time(operation);
      const target = thresholds[operation] || 'N/A';
      const targetStr = typeof target === 'number' ? formatDuration(target) : target;

      lines.push(`| ${operation} | ${stats.count} | ${formatDuration(stats.average)} | ${formatDuration(p95)} | ${targetStr} |`);
    }
  }

  // Recent violations
  if (violations.length > 0) {
    lines.push('');
    lines.push('### Active Violations');
    for (const v of violations) {
      lines.push(`- **${v.operation}**: ${formatDuration(v.actual)} (${v.percentOver}% over ${formatDuration(v.target)} target)`);
    }
  }

  // Optional: Show recent entries if --recent flag
  if (args.includes('--recent') || args.includes('-r')) {
    lines.push('');
    lines.push('### Recent Operations (last 10)');
    const recent = monitor.getLastN(null, 10);

    if (recent.length === 0) {
      lines.push('No recent operations.');
    } else {
      for (const entry of recent) {
        const timestamp = new Date(entry.timestamp).toLocaleTimeString();
        lines.push(`- [${timestamp}] ${entry.operationType}: ${formatDuration(entry.durationMs)}`);
      }
    }
  }

  return {
    success: true,
    data: {
      summary,
      violations,
      thresholds
    },
    output: lines.join('\n')
  };
}

/**
 * Handle /debug session command
 * Shows session state information
 *
 * @param {Object} deps - Dependencies
 * @param {string[]} args - Command arguments
 * @returns {Object} Result with session data
 */
async function handleDebugSession(deps, args = []) {
  const { sessionManager, preloader } = deps;

  const lines = [
    '## Session Debug Info',
    ''
  ];

  // Session state
  if (sessionManager) {
    const session = sessionManager.getCurrentSession();

    if (session) {
      lines.push('### Active Session');
      lines.push(`- **Session ID:** ${session.sessionId || 'N/A'}`);
      lines.push(`- **Started:** ${session.startedAt ? new Date(session.startedAt).toLocaleString() : 'N/A'}`);
      lines.push(`- **Character:** ${session.characterName || 'N/A'}`);
      lines.push(`- **Location:** ${session.currentLocation || 'N/A'}`);

      if (session.startedAt) {
        const duration = Date.now() - new Date(session.startedAt).getTime();
        lines.push(`- **Duration:** ${formatDuration(duration)}`);
      }
    } else {
      lines.push('No active session.');
    }
  } else {
    lines.push('SessionManager not available.');
  }

  // Preloader status
  lines.push('');
  lines.push('### Preloader Status');

  if (preloader) {
    const stats = preloader.getStats();
    lines.push(`- **Status:** ${stats.isPreloading ? 'Preloading...' : 'Idle'}`);
    lines.push(`- **Current Location:** ${stats.currentLocation || 'None'}`);
    lines.push(`- **Preloaded Locations:** ${stats.preloadedCount}`);

    if (stats.preloadedLocations.length > 0) {
      lines.push(`- **Locations:** ${stats.preloadedLocations.join(', ')}`);
    }
  } else {
    lines.push('Preloader not available.');
  }

  return {
    success: true,
    data: {
      hasSession: sessionManager?.getCurrentSession() !== null
    },
    output: lines.join('\n')
  };
}

/**
 * Handle /debug cache command
 * Shows parsing cache statistics
 *
 * @param {Object} deps - Dependencies
 * @param {string[]} args - Command arguments
 * @returns {Object} Result with cache data
 */
async function handleDebugCache(deps, args = []) {
  const cache = ParsingCache.getInstance();
  const stats = cache.getStats();

  const lines = [
    '## Parsing Cache Statistics',
    '',
    `- **Entries:** ${stats.entries}`,
    `- **Hit Rate:** ${(stats.hitRate * 100).toFixed(1)}%`,
    `- **Hits:** ${stats.hitCount}`,
    `- **Misses:** ${stats.missCount}`,
    `- **Size:** ${formatBytes(stats.estimatedSize)} / ${formatBytes(stats.maxSize)}`,
    ''
  ];

  // Optional: Clear cache if --clear flag
  if (args.includes('--clear') || args.includes('-c')) {
    cache.clearAll();
    lines.push('**Cache cleared.**');
  }

  // Optional: Reset stats if --reset flag
  if (args.includes('--reset') || args.includes('-r')) {
    cache.resetStats();
    lines.push('**Statistics reset.**');
  }

  return {
    success: true,
    data: stats,
    output: lines.join('\n')
  };
}

/**
 * Handle /debug preload command
 * Shows and controls preloader
 *
 * @param {Object} deps - Dependencies
 * @param {string[]} args - Command arguments
 * @returns {Object} Result with preloader data
 */
async function handleDebugPreload(deps, args = []) {
  const { preloader } = deps;

  if (!preloader) {
    return {
      success: false,
      error: 'Preloader not available',
      output: 'Preloader not available.'
    };
  }

  const stats = preloader.getStats();

  const lines = [
    '## Preloader Status',
    '',
    `- **Active:** ${stats.isPreloading ? 'Yes (preloading...)' : 'No'}`,
    `- **Current Location:** ${stats.currentLocation || 'None'}`,
    `- **Idle Timeout:** ${formatDuration(stats.idleTimeout)}`,
    `- **Max Preload:** ${stats.maxPreloadLocations} locations`,
    `- **Preloaded This Session:** ${stats.preloadedCount}`,
    ''
  ];

  if (stats.preloadedLocations.length > 0) {
    lines.push('### Preloaded Locations');
    for (const loc of stats.preloadedLocations) {
      lines.push(`- ${loc}`);
    }
  }

  // Optional: Trigger preload if --trigger flag
  if (args.includes('--trigger') || args.includes('-t')) {
    if (stats.currentLocation) {
      lines.push('');
      lines.push('**Triggering preload...**');
      const result = await preloader.preloadAdjacent(stats.currentLocation);
      if (result.success) {
        lines.push(`Preloaded: ${result.preloaded?.join(', ') || 'none'}`);
      } else {
        lines.push(`Failed: ${result.error || 'unknown error'}`);
      }
    } else {
      lines.push('');
      lines.push('Cannot trigger preload: no current location set.');
    }
  }

  // Optional: Cancel preload if --cancel flag
  if (args.includes('--cancel') || args.includes('-x')) {
    preloader.cancelPreload();
    lines.push('');
    lines.push('**Preload cancelled.**');
  }

  return {
    success: true,
    data: stats,
    output: lines.join('\n')
  };
}

/**
 * Main debug command router
 * Routes /debug <subcommand> to appropriate handler
 *
 * @param {Object} deps - Dependencies
 * @param {string[]} args - Command arguments [subcommand, ...options]
 * @returns {Object} Result from subcommand handler
 */
async function handleDebugCommand(deps, args = []) {
  const subcommand = args[0]?.toLowerCase() || 'help';
  const subArgs = args.slice(1);

  switch (subcommand) {
    case 'performance':
    case 'perf':
    case 'p':
      return handleDebugPerformance(deps, subArgs);

    case 'session':
    case 's':
      return handleDebugSession(deps, subArgs);

    case 'cache':
    case 'c':
      return handleDebugCache(deps, subArgs);

    case 'preload':
    case 'pre':
      return handleDebugPreload(deps, subArgs);

    case 'help':
    case 'h':
    default:
      return {
        success: true,
        output: `## Debug Commands

Usage: /debug <subcommand> [options]

### Subcommands:
- **performance** (perf, p) - Show performance metrics
  - \`--recent\` - Include recent operations
- **session** (s) - Show session and preloader state
- **cache** (c) - Show parsing cache statistics
  - \`--clear\` - Clear the cache
  - \`--reset\` - Reset statistics
- **preload** (pre) - Show preloader status
  - \`--trigger\` - Trigger preload now
  - \`--cancel\` - Cancel ongoing preload

Examples:
  /debug perf --recent
  /debug cache --clear
  /debug preload --trigger`
      };
  }
}

/**
 * Register debug commands with a CommandRouter
 * @param {CommandRouter} router - Router instance
 */
function registerDebugCommands(router) {
  router.registerHandler('debug', handleDebugCommand);
}

module.exports = {
  handleDebugCommand,
  handleDebugPerformance,
  handleDebugSession,
  handleDebugCache,
  handleDebugPreload,
  registerDebugCommands
};
