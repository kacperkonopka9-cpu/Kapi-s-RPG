# Context Caching Design
**Epic 5 Story 5.2: Context Caching Strategy**

## Overview

The context caching system provides high-performance in-memory caching for game context data with LRU eviction and file system watching for automatic cache invalidation. Achieves 5x+ speedup and >75% cache hit rates during gameplay sessions.

## Architecture

### Components

1. **ContextCache** (`src/context/context-cache.js`)
   - In-memory LRU cache with 100MB size limit
   - Automatic eviction of least recently used entries
   - Statistics tracking (hits, misses, evictions, memory usage, hit rate)
   - Cache key format: `{type}:{id}:{version}` (e.g., `location:village-of-barovia:v1`)

2. **FileWatcher** (`src/context/file-watcher.js`)
   - Cross-platform file system monitoring using chokidar
   - Debounced change events (500ms delay for batching)
   - Automatic cache invalidation on file modifications
   - Path-to-cache-key mapping for targeted invalidation

3. **ContextLoader Integration** (`src/context/context-loader.js`)
   - Cache-first strategy for all file loads
   - Transparent integration (zero API changes)
   - Cache population after successful loads
   - Cache hit rate tracking in metadata

## Cache Key Strategy

Cache keys follow the format `{type}:{id}:{version}`:

```javascript
// Location cache keys
location:village-of-barovia:v1
location:castle-ravenloft:v1

// NPC cache keys
npc:ireena_kolyana:v1
npc:strahd_von_zarovich:v1

// Calendar cache key
calendar:current:v1

// Character cache key
character:kapi:v1
```

### Versioning

- Current version: `v1` for all cache entries
- Increment version when data schema changes
- Pattern matching with wildcards: `location:*` invalidates all locations

## LRU Eviction Policy

Map insertion order maintains LRU tracking:
1. On `get()`: Entry moved to end of Map (most recently used)
2. On `set()`: New entry added to end
3. When memory > 100MB: First entry evicted (least recently used)
4. Eviction continues until new entry fits

## File System Watching

### Monitored Directories
- `game-data/locations/`
- `game-data/npcs/`
- `game-data/quests/`
- `game-data/items/`
- `game-data/monsters/`
- `game-data/calendar.yaml`

### Invalidation Strategy

File changes trigger cache invalidation:

```javascript
// File change detected
'game-data/locations/village-of-barovia/Description.md'

// Map to cache key pattern
FileWatcher.mapPathToCacheKey(filePath)
// Returns: 'location:village-of-barovia:*'

// Invalidate all matching entries
cache.invalidatePattern('location:village-of-barovia:*')
// Removes: location:village-of-barovia:v1 (and any other versions)
```

### Debouncing

Rapid file changes debounced to 500ms:
- Multiple writes within 500ms → Single invalidation event
- Reduces redundant cache invalidation
- Handles IDE auto-save and multi-file operations

## ContextLoader Integration

Cache-first strategy applied to all loads:

```javascript
// Character loading
async _loadCharacter(characterPath) {
  // 1. Check cache
  const cacheKey = ContextCache.generateKey('character', id, 'v1');
  const cached = this.cache.get(cacheKey);
  if (cached) return { success: true, data: cached };

  // 2. Cache miss - load from file
  const character = await loadFromFile(characterPath);

  // 3. Populate cache
  this.cache.set(cacheKey, character);

  return { success: true, data: character };
}
```

Same pattern for:
- Location loading (P1, P2, P3 contexts)
- Calendar loading
- Character parsing

## Performance Metrics

### Baseline (No Cache)
- Context load time: ~7ms (Village of Barovia)
- All data loaded from disk on every request

### With Cache
- First load (cache miss): ~7ms
- Subsequent loads (cache hit): ~1-2ms
- **Speedup: 5x+ for cached loads**

### Cache Hit Rate
- Target: >75% after initial load
- Typical session (10+ context loads, same location): 90%+ hit rate
- First load always misses (expected)

### Memory Usage
- Tracked automatically via ContextCache.getStats()
- 100MB limit with LRU eviction
- Typical usage: ~5-10MB for 5-10 locations

## Usage Examples

### Basic Cache Operations

```javascript
const ContextCache = require('./src/context/context-cache');

// Create cache instance
const cache = new ContextCache({ maxSize: 100 * 1024 * 1024 }); // 100MB

// Store data
const locationData = { name: 'Village of Barovia', description: '...' };
cache.set('location:village-of-barovia:v1', locationData, 5000);

// Retrieve data
const cached = cache.get('location:village-of-barovia:v1');
// Returns: locationData or null if not found

// Invalidate specific entry
cache.invalidate('location:village-of-barovia:v1');

// Invalidate all locations
cache.invalidatePattern('location:*');

// Get statistics
const stats = cache.getStats();
console.log(`Hit rate: ${stats.hitRate}%`);
// { hits: 10, misses: 2, evictions: 0, memoryUsage: 15000, totalRequests: 12, hitRate: 83.33, cacheSize: 3 }

// Clear all cache
cache.clear();
```

### File Watcher Setup

```javascript
const FileWatcher = require('./src/context/file-watcher');

// Create watcher
const watcher = new FileWatcher({ debounceDelay: 500 });

// Listen for file changes
watcher.on('change', (filePath, changeType) => {
  const cacheKey = FileWatcher.mapPathToCacheKey(filePath);
  if (cacheKey) {
    cache.invalidatePattern(cacheKey);
    console.log(`Cache invalidated: ${cacheKey}`);
  }
});

// Start watching
watcher.start(['game-data/locations', 'game-data/npcs']);

// Stop watching (on session end)
await watcher.stop();
```

### ContextLoader Integration

```javascript
const { ContextLoader, ContextCache } = require('./src/context');
const LocationLoader = require('./src/data/location-loader');

// Create cache
const cache = new ContextCache();

// Create ContextLoader with cache
const contextLoader = new ContextLoader({
  LocationLoader: new LocationLoader(),
  ContextCache: cache
});

// Load context (cache-first strategy applied automatically)
const result = await contextLoader.loadContext(
  'characters/kapi.yaml',
  'village-of-barovia',
  {},
  3500
);

if (result.success) {
  console.log(`Tokens: ${result.data.metadata.tokenCount}`);
  console.log(`Cache hit rate: ${result.data.metadata.cacheHitRate}%`);
}
```

## Session Lifecycle

### Session Start
```javascript
// Clear cache for fresh session
cache.clear();
cache.resetStats();

// Start file watcher
watcher.start(['game-data/locations', 'game-data/npcs']);
```

### During Session
```javascript
// Context loads automatically use cache
const context1 = await contextLoader.loadContext(...); // Cache miss
const context2 = await contextLoader.loadContext(...); // Cache hit!
```

### Session End
```javascript
// Get final statistics
const stats = cache.getStats();
console.log(`Final cache statistics:
  Hit rate: ${stats.hitRate}%
  Hits: ${stats.hits}
  Misses: ${stats.misses}
  Evictions: ${stats.evictions}
  Memory: ${(stats.memoryUsage / 1024).toFixed(2)}KB
`);

// Stop file watcher
await watcher.stop();
```

## Testing

### Test Coverage
- ContextCache: 30 tests
- FileWatcher: 15 tests
- ContextLoader integration: 29 tests (Story 5-1 regression suite)
- **Total: 74 tests, 100% pass rate**

### Key Test Scenarios
- Cache get/set/invalidate operations
- LRU eviction policy
- Pattern matching invalidation
- File watching and debouncing
- Path-to-cache-key mapping
- >75% hit rate validation
- 5x speedup validation
- Zero regressions in ContextLoader

## Limitations & Future Enhancements

### Current Limitations
- Cache does not persist between sessions (intentional - in-memory only)
- No cache warmup on session start (locations loaded on-demand)
- No background preloading (planned for future optimization)
- File watcher limited to 100 watchers (VS Code constraint)

### Future Enhancements (Not in Scope for Story 5.2)
- Session lifecycle hooks (clear cache on start, log stats on end)
- Background preloading of connected locations
- Performance logging to `performance.log`
- Cache warmup strategies
- Adaptive cache size based on memory pressure

## References

- **Story:** `docs/stories/5-2-context-caching-strategy.md`
- **Context:** `docs/stories/5-2-context-caching-strategy.context.xml`
- **Tech Spec:** `docs/tech-spec-epic-5.md` (AC-2)
- **Story 5-1:** `docs/context-loading-design.md`
- **Tests:** `tests/integration/context/`
