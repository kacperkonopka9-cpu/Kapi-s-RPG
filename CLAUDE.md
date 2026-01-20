# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kapi's RPG is a **folder-based, LLM-powered D&D 5e solo RPG engine** where each game location exists as a structured directory containing Markdown/YAML files. The system uses a file-first architecture with Git version control for save/load functionality, and integrates with the BMM (Build-Measure-Manage) development workflow.

## Essential Commands

### Development
```bash
npm test                          # Run all Jest tests
npm run validate-location         # Validate location folder structure
node scripts/validate-location.js # Direct validation script
```

### BMM Workflow Commands
```bash
/bmad:bmm:workflows:workflow-status    # Check current workflow status
/bmad:bmm:workflows:create-story       # Create next user story
/bmad:bmm:workflows:story-context      # Generate story context XML
/bmad:bmm:workflows:dev-story          # Execute story implementation
/bmad:bmm:workflows:code-review        # Perform code review
/bmad:bmm:workflows:tech-spec          # Generate technical specification
```

### Current Project State
- **Phase 4:** Implementation (Epic 2: Game Calendar & Dynamic World System)
- **Next Story:** 2.7 (State Auto-Update)
- Check `docs/bmm-workflow-status.md` for latest status

## Core Architecture Patterns

### 1. File-First Design
All game state persists in human-readable Markdown/YAML files. Git provides natural save/load functionality.

**Critical Pattern:** Each location is a folder with standardized files:
```
locations/village-of-barovia/
├── Description.md    # Environmental descriptions
├── NPCs.md          # NPC profiles with dialogue, stats, AI notes
├── Items.md         # Available/hidden items
├── Events.md        # Scheduled events and triggers
├── State.md         # Current state (YAML frontmatter + narrative)
└── metadata.yaml    # Location metadata and connections
```

### 2. YAML Frontmatter Pattern
State files combine structured data (YAML) with narrative (Markdown):

```yaml
---
visited: true
discovered_items: ['silver_dagger']
completed_events: ['death_of_burgomaster']
npc_states:
  ireena_kolyana:
    status: alive
    mood: grieving
last_updated: 2025-11-08T14:30:00Z
---
# Narrative content follows...
```

### 3. Result Object Pattern
All async operations return `{success, data, error}` objects instead of throwing exceptions:

```javascript
async loadState(locationId) {
  if (!this._isValidLocationId(locationId)) {
    return { success: false, error: 'Invalid location ID' };
  }

  try {
    const state = await this.fs.readFile(statePath, 'utf-8');
    return { success: true, data: state };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**Always check `success` before accessing `data`.**

### 4. Dependency Injection
All major classes accept dependencies via constructor for testability:

```javascript
class StateManager {
  constructor(deps = {}) {
    this.fs = deps.fs || fs;           // Injectable for testing
    this.path = deps.path || path;
    this.yaml = deps.yaml || yaml;
    this.locationsDir = deps.locationsDir || 'game-data/locations';
  }
}
```

**When writing tests, inject mocks. In production, use defaults.**

## Core Systems Overview

### Calendar System (`src/calendar/`)
- **calendar-manager.js**: Tracks in-game date/time, moon phases, weather, seasons
- **event-scheduler.js**: Triggers events at specified times
- **event-executor.js**: Applies event effects to world state

**Key Flow:** Calendar advances time → EventScheduler checks triggers → EventExecutor applies effects → StateManager updates State.md files

### State Management (`src/core/state-manager.js`)
- Loads/saves location State.md files
- Parses YAML frontmatter for structured state
- Tracks: visited status, discovered items, completed events, NPC states
- **Atomic operations:** Always read → modify → write in single operation

### Location Loading (`src/data/location-loader.js`)
- Loads complete location data from folders
- Parses all 6 required files (Description, NPCs, Items, Events, State, metadata)
- Caches loaded locations for performance
- **Important:** Returns consistent `LocationData` structure regardless of location

### Event Execution (`src/calendar/event-executor.js`)
- Effect types: `npc_status`, `state_update`, `quest_trigger`, `custom`
- Applies effects sequentially
- **Critical:** Batches state updates to same location (single State.md write)

## Important File Locations

### Core Engine
- `src/core/state-manager.js` - State persistence (YAML frontmatter pattern)
- `src/calendar/calendar-manager.js` - Calendar system (time, weather, moon phases)
- `src/data/location-loader.js` - Location data loading

### Templates & Validation
- `templates/location/` - Standard location folder structure
- `scripts/validate-location.js` - Location structure validation script

### Documentation
- `docs/technical-architecture.md` - Comprehensive system design
- `docs/GDD.md` - Game design document
- `docs/cascading-state-architecture.md` - State propagation design (planned)
- `docs/bmm-workflow-status.md` - Current workflow state
- `docs/stories/` - User stories with acceptance criteria

### Game Data
- `game-data/locations/` - Location folders
- `game-data/calendar.yaml` - Global calendar state

## Key Design Decisions

### Why File-First vs Database?
- Git provides natural version control (save/load via commits)
- Human-readable and editable in any text editor
- AI-friendly (LLMs can read Markdown/YAML directly)
- Full transparency of game state
- No database setup required

**Trade-off:** Slower than in-memory database for complex queries, but acceptable for single-player turn-based RPG.

### Why Folder-per-Location?
- Separation of concerns (NPCs in NPCs.md, events in Events.md)
- Easier to manage large locations (Castle Ravenloft has 60+ rooms)
- Parallel editing possible (different files)
- Consistent API for loading any location

### Why Result Objects vs Exceptions?
- Graceful error handling without try/catch boilerplate
- Consistent interface across all async operations
- Forces explicit error handling
- Better for chaining operations

## BMM Workflow Integration

This project uses the BMAD framework for development lifecycle management:

### Story Structure
Each story in `docs/stories/` contains:
- Story statement (As a... I want... so that...)
- Acceptance criteria (AC-1, AC-2, etc.)
- Implementation notes
- Testing strategy
- DoD (Definition of Done) checklist

**Naming:** `[epic].[number]-[kebab-case-title].md` (e.g., `2-6-event-execution-engine.md`)

### Workflow Phases
1. **Analysis:** Game brief, research, brainstorming
2. **Planning:** GDD, narrative design, PRD, tech specs
3. **Solutioning:** Architecture decisions, gate checks
4. **Implementation:** Story creation, development, code review (current phase)
5. **Retrospective:** Post-epic review

**Current Status:** Epic 2 (Game Calendar & Dynamic World System) - Story 2.7 pending

## Common Development Patterns

### Adding a New Location
1. Copy `templates/location/` to `game-data/locations/new-location/`
2. Fill in Description.md with atmospheric text
3. Add NPCs to NPCs.md (include dialogue, stats, AI behavior notes)
4. Define items in Items.md
5. Create events in Events.md
6. Update metadata.yaml with connections
7. State.md initializes automatically on first visit
8. Validate: `npm run validate-location`

### Modifying State
```javascript
// Load state
const stateResult = await stateManager.loadState('village-of-barovia');
if (!stateResult.success) {
  console.error(stateResult.error);
  return;
}

// Modify state
const state = stateResult.data;
state.visited = true;
state.discovered_items.push('silver_dagger');

// Save state
const saveResult = await stateManager.saveState('village-of-barovia', state);
if (!saveResult.success) {
  console.error(saveResult.error);
}
```

### Writing Tests
- Use Jest for all tests
- Inject mocks via dependency injection
- Follow Arrange-Act-Assert pattern
- Test edge cases (empty locations, missing files, invalid data)
- Target: 80%+ coverage for core systems

```javascript
// Example unit test
const stateManager = new StateManager({
  fs: mockFs,
  path: mockPath,
  yaml: mockYaml
});

const result = await stateManager.loadState('test-location');
expect(result.success).toBe(true);
expect(result.data.visited).toBe(true);
```

## Performance Targets

- **Session startup:** <3 seconds
- **Location navigation:** <1 second
- **Context loading:** <5 seconds
- **Calendar load:** <50ms
- **Calendar save:** <100ms
- **Event execution:** <500ms

**Optimization Strategies:**
- LocationLoader caches loaded locations in memory
- Lazy loading (load location only when visited)
- Atomic file operations (minimize disk I/O)
- YAML performance: use `SAFE_SCHEMA`, `lineWidth: -1`, `sortKeys: true`

### Epic 5 Performance System (`src/performance/`)

Story 5.7 introduces centralized performance monitoring and optimization:

- **PerformanceMonitor** (`performance-monitor.js`): Centralized metrics tracking
  - Records operation timings (contextLoad, fileRead, cacheHit, etc.)
  - Threshold-based alerting (warns when operations exceed targets)
  - P95 latency calculation, average times, summary statistics
  - Writes to `performance.log` for analysis

- **ParsingCache** (`parsing-cache.js`): YAML/Markdown parsing cache
  - Caches parsed objects keyed by path + modification time
  - Automatic invalidation when files change
  - 5x+ speedup for repeated parses (verified by stress tests)
  - LRU eviction when exceeding max size (default 50MB)

- **Preloader** (`preloader.js`): Background context preloading
  - Monitors for idle time (default 10 seconds of inactivity)
  - Preloads adjacent location data in background
  - Cancellation support via AbortController
  - Stores preloaded data with "preload-" prefix in cache

- **File I/O Batching**: Parallel file reads
  - LocationLoader uses `Promise.all()` for 6 location files
  - ~65% improvement over sequential reads (verified by stress tests)

### Debug Commands

Use `/debug` command to inspect performance:
```
/debug performance [--recent]  # Show performance metrics
/debug session                  # Show session and preloader state
/debug cache [--clear|--reset] # Show/manage parsing cache
/debug preload [--trigger]     # Show/control preloader
```

### Using Performance Monitoring

```javascript
const PerformanceMonitor = require('./performance/performance-monitor');

// Get singleton instance
const monitor = PerformanceMonitor.getInstance();

// Record a timed operation
const stopTimer = monitor.startTimer('myOperation');
await doExpensiveWork();
await stopTimer({ context: 'info' });

// Check for violations
const violations = monitor.checkThresholds();

// Get statistics
const summary = monitor.getSummary();
const p95 = monitor.getP95Time('contextLoad');
```

## Critical Implementation Notes

### YAML Frontmatter Parsing
When parsing State.md files:
1. Split on `---` delimiter
2. Parse YAML between first two `---`
3. Everything after second `---` is narrative Markdown
4. Preserve both sections when saving

### Location Validation
All locations MUST have:
- Description.md, NPCs.md, Items.md, Events.md, State.md, metadata.yaml
- Valid YAML frontmatter in State.md
- At least `location_name` in metadata.yaml

**Run `npm run validate-location` before committing new locations.**

### Event Triggers
Events can trigger on:
- **Date/Time:** Specific calendar date/time
- **Conditional:** When conditions met (quest completed, NPC status changed)
- **Location:** When player enters location
- **Recurring:** Daily, weekly, monthly

**Important:** EventScheduler checks for triggers whenever time advances.

### State Update Batching
When multiple events affect same location, batch state updates:
```javascript
// Good: Single write
const updates = [event1Updates, event2Updates, event3Updates];
const mergedUpdates = mergeStateUpdates(updates);
await stateManager.saveState(locationId, mergedUpdates);

// Bad: Multiple writes
await stateManager.saveState(locationId, event1Updates);
await stateManager.saveState(locationId, event2Updates);
await stateManager.saveState(locationId, event3Updates);
```

## Git Workflow

### Save/Load via Git
- **Auto-save:** After each session end
- **Manual save:** Create named Git branch (`save/pre-castle-ravenloft`)
- **Checkpoint:** Before major decisions or dangerous encounters

### Commit Message Format
```
[AUTO-SAVE] Session 5 - Arrived in Vallaki

Location: Vallaki
Date: 2024-03-15, 18:30
Level: 5
Quest: Escort Ireena (In Progress)

Major events:
- Traveled from Tser Pool to Vallaki
- Met Baron Vargas Vallakovich
```

## Security & Validation

### Path Traversal Protection
Always validate location IDs:
```javascript
const sanitized = locationId.replace(/[^a-z0-9-_]/gi, '');
if (sanitized !== locationId) {
  throw new Error('Invalid location ID');
}
```

### Input Sanitization
Remove dangerous characters from user input:
```javascript
function sanitizeInput(input) {
  return input
    .replace(/[<>]/g, '')           // Remove HTML tags
    .replace(/[\r\n]+/g, ' ')       // Normalize whitespace
    .trim()
    .slice(0, 1000);                // Limit length
}
```

## Common Pitfalls

1. **Don't forget to check `success` on Result Objects** - Always check before accessing `data`
2. **Don't modify State.md directly** - Use StateManager for atomic updates
3. **Don't skip location validation** - Run `npm run validate-location` before commits
4. **Don't batch incompatible state updates** - Merge updates to same location first
5. **Don't forget YAML frontmatter** - State.md requires YAML between `---` delimiters
6. **Don't ignore test coverage** - Maintain 80%+ coverage for core systems

## Testing Strategy

- **Unit Tests (70%):** Individual modules in isolation, focus on rules engine
- **Integration Tests (20%):** Module interactions, file I/O, Git operations
- **E2E Tests (10%):** Complete user workflows (start → navigate → combat → end)

**Run tests before committing:** `npm test`

## Additional Resources

- **D&D 5e Reference:** `.claude/RPG-engine/D&D 5e collection/`
- **Curse of Strahd Materials:** `.claude/RPG-engine/D&D 5e collection/4 Curse of Strahd/`
- **BMM Framework:** `bmad/` directory contains all workflow definitions

## Quick Reference: Data Structures

### Calendar.yaml Structure
```yaml
current:
  date: '735-10-1'
  time: '08:00'
  day_of_week: Moonday
  season: autumn

advancement:
  mode: hybrid  # manual, automatic, hybrid
  auto_advance_on_travel: true

moon:
  current_phase: waxing_gibbous
  days_until_full: 7

weather:
  current: foggy
  temperature: 8
```

### LocationData Structure
```javascript
{
  locationId: 'village-of-barovia',
  locationName: 'Village of Barovia',
  description: { full, variants: { initial, return, morning, night }},
  npcs: [{ npcId, name, type, dialogue, stats, aiBehaviorNotes }],
  items: [{ itemId, name, description, category, hidden, dc }],
  events: [{ eventId, name, type, trigger, effect }],
  state: { visited, discovered_items, npc_states, etc. },
  metadata: { location_name, parent_location, connections }
}
```

### Event Definition
```yaml
events:
  - eventId: death_of_burgomaster
    name: Death of Burgomaster Kolyan
    trigger_date: '735-10-3'
    trigger_time: '06:00'
    effects:
      - type: npc_status
        npcId: kolyan_indirovich
        status: Dead
      - type: state_update
        locationId: village-of-barovia
        stateChanges:
          burgomaster_dead: true
```

---

**Last Updated:** 2025-11-09
**Project Phase:** 4 (Implementation)
**Current Epic:** 2 (Game Calendar & Dynamic World System)
