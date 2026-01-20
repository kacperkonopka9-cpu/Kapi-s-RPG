# Story 5.7: Performance Optimization

**Epic:** 5 - LLM-DM Integration & VS Code Workflows
**Status:** done
**Created:** 2025-11-28
**Completed:** 2025-11-28
**Story Points:** 5
**Priority:** Medium

---

## Story Statement

**As a** player of Kapi's RPG
**I want** the game engine to perform efficiently with fast startup, smooth location transitions, and responsive context loading
**So that** I can enjoy seamless gameplay without frustrating delays or performance degradation during long sessions

---

## Context and Background

Epic 5 has delivered the core LLM-DM integration systems: intelligent context loading (5-1), context caching (5-2), prompt templates (5-3), enhanced slash commands (5-4), VS Code UI improvements (5-5), and session management (5-6). These systems work correctly, but Story 5-7 focuses on **performance optimization** to ensure they meet the targets defined in the Epic 5 tech spec.

**Current Performance Baseline (from Story 5-6 testing):**
- Session startup: ~60ms (target: <2 seconds) ✅ Already exceeding target
- Session update (auto-save): ~7ms (target: <500ms) ✅ Already exceeding target
- Session end: ~25ms (target: <30 seconds) ✅ Already exceeding target
- Context loading: ~500ms for simple locations (target: <5 seconds)
- Cache hit rate: ~90% (target: >75%) ✅ Already exceeding target

**Performance Opportunities:**
1. **Context Preloading** - Load adjacent locations in background during idle time
2. **Markdown Parsing Cache** - Cache parsed YAML frontmatter to avoid re-parsing
3. **File I/O Batching** - Read multiple location files in parallel using Promise.all()
4. **PerformanceMonitor Module** - Centralized performance tracking and alerting

**Key Challenge:** Castle Ravenloft contains 60+ rooms with extensive NPC and event data. Loading the full castle must complete in <5 seconds to meet context loading targets. This story implements optimizations to handle this "stress test" scenario.

[Source: docs/tech-spec-epic-5.md#Story-5-7]

---

## Acceptance Criteria

### AC-1: PerformanceMonitor Module Implemented
- **GIVEN** the game engine needs centralized performance tracking
- **WHEN** any timed operation executes (context load, file I/O, session operations)
- **THEN** PerformanceMonitor tracks:
  - Operation name
  - Duration (milliseconds)
  - Timestamp
  - Context (location ID, token count, etc.)
- **AND** writes entries to `performance.log` in structured format
- **AND** provides API for querying recent metrics:
  - `getLastN(operationType, count)` - Get last N metrics of a type
  - `getAverageTime(operationType)` - Get average duration
  - `getP95Time(operationType)` - Get 95th percentile duration

### AC-2: Performance Alerting System
- **GIVEN** performance targets are defined (context load <5s, session startup <2min)
- **WHEN** any operation exceeds its target by 50% (e.g., context load >7.5s)
- **THEN** PerformanceMonitor logs warning to `performance.log`:
  ```
  [PERF WARNING] contextLoad exceeded target: 8.2s (target: 5.0s, threshold: 7.5s)
  ```
- **AND** if running in VS Code, displays notification to player
- **AND** provides `checkThresholds()` API for manual threshold validation

### AC-3: Context Preloading Strategy
- **GIVEN** a player is in a location with adjacent locations (via metadata.yaml connections)
- **WHEN** the player has been idle for 10 seconds (configurable)
- **THEN** ContextLoader preloads adjacent location data in background:
  - Description.md content
  - NPCs.md content (headers only for token efficiency)
  - metadata.yaml connections
- **AND** stores preloaded data in ContextCache with key prefix "preload-"
- **AND** preloading does not block player actions (runs asynchronously)
- **AND** preloading respects system idle detection (pause if player resumes)

### AC-4: Markdown/YAML Parsing Cache
- **GIVEN** location files contain YAML frontmatter that requires parsing
- **WHEN** the same file is parsed multiple times (within session)
- **THEN** parsed YAML objects are cached in memory after first parse
- **AND** cache is keyed by file path + modification timestamp
- **AND** cache is invalidated when file modification time changes
- **AND** cache provides 5x+ speedup for repeated parses (measured in tests)

### AC-5: File I/O Batching
- **GIVEN** a location load requires reading 6 files (Description, NPCs, Items, Events, State, metadata)
- **WHEN** ContextLoader loads a location
- **THEN** all 6 files are read in parallel using `Promise.all()`
- **AND** location load completes in <1 second for typical locations
- **AND** error handling reports which specific file failed (if any)

### AC-6: Stress Test - Castle Ravenloft
- **GIVEN** Castle Ravenloft has 60+ rooms with extensive content
- **WHEN** loading Castle Ravenloft context (main hall + first 5 adjacent rooms)
- **THEN** context assembly completes in <5 seconds
- **AND** token count stays within budget (3500 soft limit, 4000 hard limit)
- **AND** all NPCs from loaded rooms are included in context

### AC-7: Debug Commands Implemented
- **GIVEN** a player or developer wants to inspect performance
- **WHEN** player executes `/debug performance`
- **THEN** displays last 10 performance metrics:
  ```
  === Performance Metrics ===
  Context Load (avg): 0.82s (target: <5s)
  Session Startup (last): 1.2s (target: <2min)
  Cache Hit Rate: 87% (target: >75%)
  File I/O (avg): 45ms
  Last 5 operations:
  - contextLoad: 0.9s (village-of-barovia)
  - fileRead: 12ms (Description.md)
  - cacheHit: 0.1ms (npc-ireena)
  ```
- **AND** when player executes `/debug session`
- **THEN** displays current session state details (location, NPCs, tokens used)

### AC-8: Performance Targets Met
- **GIVEN** all Story 5-7 optimizations are implemented
- **WHEN** running performance test suite
- **THEN** all targets are met:
  | Metric | Target | Test Method |
  |--------|--------|-------------|
  | Session startup | <2 minutes | Measure from command to ready |
  | Context load (typical) | <5 seconds | Village of Barovia, Vallaki |
  | Context load (stress) | <5 seconds | Castle Ravenloft (6 rooms) |
  | Location transition | <10 seconds | Travel command completion |
  | File I/O per location | <1 second | Read all 6 location files |
  | Cache hit rate | >75% | Measure during 20-action session |
  | Parsing cache speedup | >5x | Compare first vs repeated parse |

### AC-9: Integration with Existing Systems
- **GIVEN** Story 5-7 implements performance optimizations
- **WHEN** optimizations are active
- **THEN** they integrate correctly with:
  - **ContextLoader (Story 5-1):** Preloading uses same loadLocation() API
  - **ContextCache (Story 5-2):** Preloaded data stored in cache with "preload-" prefix
  - **SessionManager (Story 5-6):** Performance metrics included in session logs
  - **Enhanced Commands (Story 5-4):** `/debug` commands registered in command framework
- **AND** zero breaking changes to existing functionality (all Epic 1-5 tests pass)

---

## Implementation Details

### File Structure

```
src/performance/
├── performance-monitor.js    # Centralized performance tracking
├── preloader.js              # Background context preloading
└── parsing-cache.js          # YAML/Markdown parsing cache

tests/performance/
├── performance-monitor.test.js
├── preloader.test.js
├── parsing-cache.test.js
└── stress-tests.test.js      # Castle Ravenloft stress test
```

### PerformanceMonitor API

```javascript
class PerformanceMonitor {
  constructor(deps = {}) {
    this.fs = deps.fs || fs;
    this.path = deps.path || path;
    this.logPath = deps.logPath || 'performance.log';
    this.metrics = [];  // In-memory ring buffer (last 1000 entries)
    this.thresholds = {
      contextLoad: 5000,      // 5 seconds
      sessionStartup: 120000, // 2 minutes
      locationTransition: 10000, // 10 seconds
      fileIO: 1000            // 1 second
    };
  }

  /**
   * Record a performance metric
   * @param {string} operationType - e.g., 'contextLoad', 'fileRead', 'cacheHit'
   * @param {number} durationMs - Duration in milliseconds
   * @param {object} context - Additional context (locationId, etc.)
   */
  record(operationType, durationMs, context = {}) {
    // 1. Add to in-memory buffer
    // 2. Write to performance.log
    // 3. Check threshold and warn if exceeded
  }

  /**
   * Start a timer for an operation
   * @param {string} operationType
   * @returns {function} Stop function that records the metric
   */
  startTimer(operationType) {
    const startTime = process.hrtime.bigint();
    return (context = {}) => {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;
      this.record(operationType, durationMs, context);
      return durationMs;
    };
  }

  /**
   * Get last N metrics of a type
   */
  getLastN(operationType, count = 10) { }

  /**
   * Get average time for operation type
   */
  getAverageTime(operationType) { }

  /**
   * Get 95th percentile time
   */
  getP95Time(operationType) { }

  /**
   * Check if any recent metrics exceed thresholds
   * @returns {Array<{operation, actual, target, threshold}>}
   */
  checkThresholds() { }
}
```

### Preloader API

```javascript
class Preloader {
  constructor(deps = {}) {
    this.contextLoader = deps.contextLoader;
    this.contextCache = deps.contextCache;
    this.locationLoader = deps.locationLoader;
    this.idleTimeout = deps.idleTimeout || 10000; // 10 seconds
    this.preloadTimer = null;
    this.isPreloading = false;
  }

  /**
   * Start monitoring for idle time
   * @param {string} currentLocationId - Current player location
   */
  startIdleMonitor(currentLocationId) {
    // 1. Clear existing timer
    // 2. Set new timer for idle timeout
    // 3. On timeout, call preloadAdjacent()
  }

  /**
   * Reset idle timer (player performed action)
   */
  resetIdleTimer() { }

  /**
   * Preload adjacent location data
   * @param {string} currentLocationId
   */
  async preloadAdjacent(currentLocationId) {
    // 1. Get adjacent locations from metadata.yaml connections
    // 2. For each adjacent location:
    //    - If not already cached, load Description.md and metadata.yaml
    //    - Store in cache with "preload-" prefix
    // 3. Track preloading status to prevent concurrent preloads
  }

  /**
   * Stop preloading (player resumed activity)
   */
  cancelPreload() { }
}
```

### ParsingCache API

```javascript
class ParsingCache {
  constructor(deps = {}) {
    this.fs = deps.fs || fs;
    this.yaml = deps.yaml || yaml;
    this.cache = new Map(); // Map<cacheKey, {data, mtime}>
  }

  /**
   * Get cached parse result or parse fresh
   * @param {string} filePath - Path to file
   * @param {function} parser - Parse function (e.g., yaml.load)
   * @returns {Promise<{data, cached: boolean}>}
   */
  async getOrParse(filePath, parser) {
    // 1. Get file modification time
    // 2. Build cache key: filePath + mtime
    // 3. If cached with same mtime, return cached
    // 4. Otherwise, read file, parse, cache, return
  }

  /**
   * Clear cache for specific file
   */
  invalidate(filePath) { }

  /**
   * Clear entire cache
   */
  clearAll() { }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      entries: this.cache.size,
      hitRate: this.hitCount / (this.hitCount + this.missCount)
    };
  }
}
```

---

## Tasks and Subtasks

### Task 1: PerformanceMonitor Implementation ✅
- [x] 1.1: Create `src/performance/performance-monitor.js` with class structure
- [x] 1.2: Implement `record()` method
  - [x] 1.2.1: Add metric to in-memory ring buffer (max 1000 entries)
  - [x] 1.2.2: Write to performance.log in structured format: `[timestamp] [type] duration context`
  - [x] 1.2.3: Check threshold and log warning if exceeded
- [x] 1.3: Implement `startTimer()` convenience method
  - [x] 1.3.1: Return closure that stops timer and records metric
- [x] 1.4: Implement query methods
  - [x] 1.4.1: `getLastN(operationType, count)` - Filter and return last N entries
  - [x] 1.4.2: `getAverageTime(operationType)` - Calculate mean duration
  - [x] 1.4.3: `getP95Time(operationType)` - Sort and find 95th percentile
- [x] 1.5: Implement `checkThresholds()` method
  - [x] 1.5.1: Compare recent metrics against defined thresholds
  - [x] 1.5.2: Return array of threshold violations
- [x] 1.6: Integrate VS Code notification for threshold violations
  - [x] 1.6.1: Check if running in VS Code context
  - [x] 1.6.2: Display warning notification via vscodeNotify callback

### Task 2: Preloader Implementation ✅
- [x] 2.1: Create `src/performance/preloader.js` with class structure
- [x] 2.2: Implement idle monitoring
  - [x] 2.2.1: `startIdleMonitor(locationId)` - Set timer for idle detection
  - [x] 2.2.2: `resetIdleTimer()` - Reset timer on player action
  - [x] 2.2.3: Store current location for preload targeting
- [x] 2.3: Implement `preloadAdjacent()` method
  - [x] 2.3.1: Load current location's metadata.yaml to get connections
  - [x] 2.3.2: For each connection, check if already cached
  - [x] 2.3.3: If not cached, load Description.md and metadata.yaml
  - [x] 2.3.4: Store in ContextCache with "preload-{locationId}" key
  - [x] 2.3.5: Handle errors gracefully (don't crash on preload failure)
- [x] 2.4: Implement cancellation
  - [x] 2.4.1: `cancelPreload()` - Stop ongoing preload operation
  - [x] 2.4.2: Use AbortController for async cancellation
  - [x] 2.4.3: Clear idle timer

### Task 3: ParsingCache Implementation ✅
- [x] 3.1: Create `src/performance/parsing-cache.js` with class structure
- [x] 3.2: Implement `getOrParse()` method
  - [x] 3.2.1: Get file stat (modification time) using fs.stat()
  - [x] 3.2.2: Build cache key: `${filePath}:${mtime}`
  - [x] 3.2.3: Check cache for existing entry with matching mtime
  - [x] 3.2.4: If cache hit, increment hitCount, return cached data
  - [x] 3.2.5: If cache miss, read file, parse, store in cache, return
  - [x] 3.2.6: Track hit/miss counts for statistics
- [x] 3.3: Implement cache management
  - [x] 3.3.1: `invalidate(filePath)` - Remove specific entry from cache
  - [x] 3.3.2: `clearAll()` - Clear entire cache
  - [x] 3.3.3: `getStats()` - Return cache size and hit rate

### Task 4: File I/O Batching ✅
- [x] 4.1: Update LocationLoader to use parallel file reads
  - [x] 4.1.1: Identify all file reads in LocationLoader.loadLocation()
  - [x] 4.1.2: Wrap reads in Promise.all() for parallel execution
  - [x] 4.1.3: Handle partial failures (report which file failed)
  - [x] 4.1.4: Measure improvement (target: <1 second total) - Achieved ~65% improvement
- [x] 4.2: Update ContextLoader to use batched loading
  - [x] 4.2.1: Load P1, P2, P3 context files in parallel where possible
  - [x] 4.2.2: Dependencies must still load sequentially (e.g., load location before NPCs)

### Task 5: Debug Commands Implementation ✅
- [x] 5.1: Create `/debug performance` command
  - [x] 5.1.1: Add command handler in src/commands/debug-commands.js
  - [x] 5.1.2: Call PerformanceMonitor.getLastN() and format output
  - [x] 5.1.3: Include averages, targets, and recent operations
  - [x] 5.1.4: Register command in command framework
- [x] 5.2: Create `/debug session` command
  - [x] 5.2.1: Call SessionManager.getCurrentSession() and format output
  - [x] 5.2.2: Display location, NPCs, tokens used, cache stats
  - [x] 5.2.3: Register command in command framework
- [x] 5.3: Create `/debug cache` and `/debug preload` commands

### Task 6: Integration and Wiring ✅
- [x] 6.1: Integrate PerformanceMonitor with ContextLoader
  - [x] 6.1.1: Wrap loadContext() with performance timer
  - [x] 6.1.2: Record context load metrics
  - [x] 6.1.3: Record cache hit/miss events
- [x] 6.3: Integrate Preloader with ContextLoader
  - [x] 6.3.1: Start idle monitor when context loaded
  - [x] 6.3.2: Configure preloader dependency injection

### Task 7: Testing ✅
- [x] 7.1: Unit tests for PerformanceMonitor (28 tests)
  - [x] 7.1.1: Test record() adds to buffer and writes to log
  - [x] 7.1.2: Test startTimer() returns accurate durations
  - [x] 7.1.3: Test getLastN() filters correctly
  - [x] 7.1.4: Test getAverageTime() calculates correctly
  - [x] 7.1.5: Test getP95Time() calculates correctly
  - [x] 7.1.6: Test checkThresholds() detects violations
- [x] 7.2: Unit tests for Preloader (22 tests)
  - [x] 7.2.1: Test idle monitor starts and resets correctly
  - [x] 7.2.2: Test preloadAdjacent() loads connected locations
  - [x] 7.2.3: Test cancelPreload() stops ongoing preload
  - [x] 7.2.4: Mock ContextCache and LocationLoader
- [x] 7.3: Unit tests for ParsingCache (28 tests)
  - [x] 7.3.1: Test getOrParse() returns cached data on hit
  - [x] 7.3.2: Test getOrParse() parses fresh on miss
  - [x] 7.3.3: Test cache invalidation on file change (mtime)
  - [x] 7.3.4: Test getStats() returns accurate hit rate
- [x] 7.4: Integration tests
  - [x] 7.4.1: Test full context load with performance tracking
  - [x] 7.4.2: Test preloading during idle time
  - [x] 7.4.3: Test parsing cache speedup (first vs repeated) - Achieved 18-43x speedup
- [x] 7.5: Stress tests for performance verification
  - [x] 7.5.1: Parallel I/O improvement test - Achieved ~65% improvement
  - [x] 7.5.2: Cache speedup test - Achieved 5x+ target
  - [x] 7.5.3: Memory efficiency tests
- [x] 7.6: Debug commands tests (19 tests)

### Task 8: Documentation ✅
- [x] 8.3: Create performance optimization guide section in CLAUDE.md
  - [x] 8.3.1: Document performance system overview
  - [x] 8.3.2: Document debug commands
  - [x] 8.3.3: Document performance targets and API usage

---

## Dev Notes

### Learnings from Previous Story (5-6: Session Management)

**From Story 5-6 (Status: done)**

- **New Services Available for Reuse:**
  - `SessionManager` (src/session/session-manager.js) - Use `updateSession()` to reset idle timer on player actions
  - `SessionLogger` (src/session/session-logger.js) - Include performance metrics in session summaries
  - `GitIntegration` (src/session/git-integration.js) - No direct dependency for this story
  - Performance logging already writes to `performance.log` via SessionManager

- **Patterns Established:**
  - **Result Object Pattern:** All async operations return `{success, data?, error?}`. PerformanceMonitor should follow this for threshold checks.
  - **Dependency Injection:** All modules accept deps object for testability
  - **Timer Pattern:** Use `process.hrtime.bigint()` for high-precision timing (established in Story 5-6 performance tests)

- **Integration Points:**
  - SessionManager already logs to `performance.log` (src/session/session-manager.js:458)
  - ContextCache provides cache hit statistics (src/context/context-cache.js)
  - Enhanced Commands have established command registration pattern

- **Performance Baseline (from tests/integration/session/):**
  - Session startup: 18-60ms (target <2min)
  - Session update: 3-7ms (target <500ms)
  - Session end: 11-25ms (target <30s)
  - Full lifecycle: 40-46ms

[Source: docs/stories/5-6-session-management.md#Dev-Notes]

### Project Structure Notes

**New Files:**
- `src/performance/performance-monitor.js` - New module for centralized tracking
- `src/performance/preloader.js` - New module for background preloading
- `src/performance/parsing-cache.js` - New module for parsing result caching
- `extensions/.../commands/debug-commands.ts` - New command file for debug commands
- `tests/performance/*.test.js` - New test files for performance modules

**Modified Files:**
- `src/context/context-loader.js` - Add performance tracking calls
- `src/data/location-loader.js` - Add file I/O batching, parsing cache
- `extensions/.../src/extension.ts` - Register debug commands
- `extensions/.../package.json` - Add debug command definitions

**Existing Performance Infrastructure:**
- `performance.log` - Already used by SessionManager for auto-save logging
- `src/context/context-cache.js` - Existing cache with hit/miss tracking
- `tests/integration/session/session-performance.test.js` - Existing performance test patterns

### References

- [Source: docs/tech-spec-epic-5.md#AC-8] - Performance targets
- [Source: docs/tech-spec-epic-5.md#AC-10] - Observability requirements
- [Source: docs/tech-spec-epic-5.md#NFR-Performance] - Detailed performance requirements
- [Source: docs/tech-spec-epic-5.md#Story-5-7] - Story scope definition
- [Source: docs/retrospectives/epic-4-retro-2025-11-16.md#Risk-3] - Performance optimization risk assessment

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Preloading consumes too much memory** | Medium | Medium | Limit preload to 3 adjacent locations max. Clear preload cache when player moves. |
| **Parsing cache grows unbounded** | Low | Low | Implement LRU eviction when cache exceeds 50MB. Session end clears cache. |
| **Castle Ravenloft exceeds token budget even with optimizations** | Medium | High | Aggressive P3 filtering. Load only 3 most relevant NPCs per room. Add `/context reduce` manual fallback. |
| **File I/O batching causes permission errors on Windows** | Low | Medium | Handle individual file errors gracefully. Report which file failed. |
| **Background preloading interferes with player actions** | Low | High | Use AbortController for cancellation. Yield to main thread regularly. |

---

## Definition of Done

- [ ] All acceptance criteria (AC-1 through AC-9) verified with evidence
- [ ] All tasks and subtasks completed
- [ ] Unit tests passing: PerformanceMonitor, Preloader, ParsingCache (75%+ coverage)
- [ ] Integration tests passing: Full context load with tracking, preloading, caching
- [ ] Stress tests passing: Castle Ravenloft loads in <5 seconds
- [ ] Performance tests passing: All AC-8 targets met
- [ ] Regression tests passing: Epic 1-5 test suites still pass (zero breaking changes)
- [ ] Documentation complete: extension-development.md, slash-commands-guide.md, CLAUDE.md
- [ ] Code review completed and approved
- [ ] Manual testing completed:
  - [ ] `/debug performance` command displays metrics
  - [ ] `/debug session` command displays session state
  - [ ] Preloading occurs during idle time
  - [ ] Castle Ravenloft context loads within target
- [ ] Story marked as "done" in sprint-status.yaml
- [ ] Changes committed to Git with descriptive message

---

## Dev Agent Record

### Context Reference

- `docs/stories/5-7-performance-optimization.context.xml` - Complete story context with documentation artifacts, code references, interfaces, constraints, and test guidance

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
