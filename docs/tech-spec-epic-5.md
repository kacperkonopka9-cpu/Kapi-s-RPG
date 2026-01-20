# Epic Technical Specification: LLM-DM Integration & VS Code Workflows

Date: 2025-11-17
Author: Kapi
Epic ID: 5
Status: Draft

---

## Overview

Epic 5 delivers the LLM-DM (Dungeon Master) integration layer and VS Code workflow optimizations that transform Kapi-s-RPG from a file-based D&D mechanics engine into a seamless, immersive solo gameplay experience. Building on Epic 1's location system, Epic 2's dynamic calendar, Epic 3's D&D 5e mechanics, and Epic 4's complete Curse of Strahd content, this epic focuses on the human-computer interaction layer: intelligent context loading, prompt engineering for consistent narrative generation, enhanced slash commands, VS Code UI extensions, and session management workflows.

Unlike previous epics that delivered game systems (locations, calendar, combat) or content (NPCs, monsters, quests), Epic 5 optimizes the **player experience** by minimizing context token usage, maximizing LLM response quality, and streamlining session workflows. The core challenge is loading the right game state at the right time to Claude Code while staying within token limits (~4000 tokens for context) and maintaining narrative consistency across multi-hour sessions spanning weeks or months of real-world time.

**Key Challenge:** The complete Curse of Strahd campaign now contains 34+ locations with hundreds of NPCs, items, and events. Without intelligent context loading, every session would exceed Claude's token limits. Epic 5 implements priority-based context caching, selective loading strategies, and session state management to enable smooth 1-2 hour play sessions with fast startup (<2 minutes) and consistent narrative quality.

## Objectives and Scope

**In Scope:**

✅ **Intelligent Context Loading (Stories 5-1, 5-2)**
- Priority-based context system (Priority 1: always load, Priority 2: conditional, Priority 3: deferred)
- Smart NPC filtering (load only NPCs in current location or adjacent areas)
- Event relevance detection (load only upcoming/active events within 7 days)
- Session-based context caching (avoid re-loading unchanged data mid-session)
- Token budget management (<4000 tokens total context per prompt)

✅ **LLM Prompt Templates & System Prompts (Story 5-3)**
- DM persona prompt defining tone, style, and RAW D&D 5e adherence
- Location narration templates (initial visit vs return, time-of-day variants)
- NPC dialogue templates (personality-driven responses, relationship awareness)
- Combat narration templates (attack descriptions, spell effects, environmental reactions)
- Consistency validation prompts (check actions against world state, RAW rules)

✅ **Enhanced Slash Commands (Story 5-4)**
- `/start-session [location] [character]` - Initialize session with context loading
- `/end-session [summary]` - Save state, generate session log, Git commit
- `/travel [destination]` - Handle location transitions with travel time calculation
- `/rest [short|long]` - Execute rest mechanics, advance calendar, trigger events
- `/calendar [advance] [query]` - Calendar operations and event scheduling
- `/context [reload|show|reduce]` - Manual context management tools

✅ **VS Code UI Improvements (Story 5-5)**
- Character sheet sidebar panel (live HP, spell slots, conditions, quick reference)
- Quest tracker panel (active quests, objectives, deadlines from calendar)
- Calendar widget (current date/time, upcoming events, moon phase, weather)
- Location map navigator (clickable connections between locations)
- Session log viewer (historical narrative playback)

✅ **Session Management & Logging (Stories 5-6, 5-7)**
- Session initialization workflow (load character → load location → inject context → ready prompt)
- Session state tracking (current location, active NPCs, pending events, time elapsed)
- Auto-save mechanism (periodic state snapshots during long sessions)
- Session summary generation (AI-generated recap with key events, NPC interactions, loot, XP)
- Git integration (auto-commit on session end with descriptive messages)

✅ **Performance Optimization (Story 5-7)**
- Context preloading strategy (load next likely locations in background)
- Markdown parsing optimization (cache parsed YAML frontmatter)
- File I/O batching (reduce disk reads during context assembly)
- Target: Session startup <2 minutes, location transitions <10 seconds, LLM responses <10 seconds (95th percentile)

✅ **Markdown Preview Styling (Story 5-11)**
- Custom CSS for narrative display (gothic horror theme matching Curse of Strahd aesthetic)
- Typography optimized for readability (Garamond-style serif for narrative, monospace for mechanics)
- Color scheme (dark background, warm text, muted accent colors for UI elements)
- Interactive elements (clickable NPC names, item links, location references)

**Out of Scope:**

❌ **Multiplayer Support** → Solo play only, no DM + players mode
❌ **Voice/Audio Integration** → Text-based only, no TTS or voice commands
❌ **Graphics/Illustrations** → Pure text experience, no image generation
❌ **Mobile/Web Versions** → VS Code desktop only
❌ **Third-Party LLM Support** → Claude Code extension only (no OpenAI, Anthropic API, or other providers)
❌ **Advanced AI Features** → No vector embeddings, no RAG (retrieval-augmented generation) beyond file context
❌ **Automated Playtesting** → Manual QA only, no AI-driven scenario testing
❌ **Content Authoring Tools** → No location/NPC generators, manual creation only
❌ **Real-Time Collaboration** → No shared sessions, screen sharing, or co-op editing

## System Architecture Alignment

**Architecture Document Reference:** `docs/technical-architecture.md` sections 6-7, 10

**Core Alignment:**

Epic 5 enhances the **LLM Integration Layer** (Architecture §7) and **User Interface Layer** (Architecture §2.2 Layer 1) without modifying core game systems from Epics 1-4. This epic operates at the boundaries between VS Code, Claude Code extension, and the file system, optimizing data flow and user workflows.

**1. Context Loading Strategy (Architecture §6 - Enhanced)**

Architecture §6 defines a 3-priority context loading system. Epic 5 **implements** this system with intelligent caching:

- **Priority 1 (Always Load):** Character sheet, current location Description.md + State.md, calendar state, active conditions
- **Priority 2 (Conditional Load):** NPCs in current location + adjacent locations (within 1 connection), upcoming events (next 7 days), current quests
- **Priority 3 (Deferred/On-Demand):** Full location Events.md, distant NPCs, completed quests, lore documents

**Implementation Details:**
- `src/context/context-loader.js` - Central context assembly module
- `src/context/context-cache.js` - Session-scoped in-memory cache
- `src/context/priority-resolver.js` - Priority classification logic
- Token budget: 4000 tokens max (3500 soft limit with 500 reserve for long responses)
- Cache invalidation: When files modified on disk, clear affected cache entries

**2. LLM-DM Integration (Architecture §7 - Expanded)**

Architecture §7 describes Claude Code as the narrative engine. Epic 5 adds structured system prompts and validation:

- **System Prompt Components:**
  - **DM Persona** (`prompts/dm-persona.md`) - Tone, style, rules adherence philosophy
  - **Current Context** (assembled by context-loader) - Location, NPCs, character state
  - **RAW Reference** (on-demand) - D&D 5e rule excerpts when mechanics questioned
  - **Consistency Guidelines** (`prompts/consistency-validation.md`) - Check actions against state

**Integration Points:**
- Claude Code extension API (no modifications, only system prompt injection)
- Markdown context files passed via MCP (Model Context Protocol)
- No separate Anthropic API calls (use Claude Code's existing authentication)

**3. VS Code Extension Architecture (NEW - Epic 5)**

Epic 5 introduces a custom VS Code extension (`extensions/kapis-rpg-dm/`) to provide UI panels and enhanced commands:

```
extensions/kapis-rpg-dm/
├── package.json                 # Extension manifest
├── src/
│   ├── extension.ts            # Extension entry point
│   ├── commands/               # Slash command implementations
│   │   ├── start-session.ts
│   │   ├── end-session.ts
│   │   ├── travel.ts
│   │   └── ...
│   ├── panels/                 # Webview panels
│   │   ├── character-sheet-panel.ts
│   │   ├── quest-tracker-panel.ts
│   │   └── calendar-widget.ts
│   └── providers/              # VS Code providers
│       ├── location-tree-provider.ts
│       └── session-log-provider.ts
└── media/                      # CSS, icons
    └── styles/
        └── narrative-theme.css
```

**4. Session Management Architecture (NEW - Epic 5)**

Session state persists in `game-data/session/` (new directory):

```
game-data/session/
├── current-session.yaml        # Active session state
├── session-history.yaml        # Past session metadata
└── logs/
    ├── 2025-11-17-session-1.md
    └── ...
```

**current-session.yaml Structure:**
```yaml
sessionId: "2025-11-17-001"
startTime: "2025-11-17T14:30:00Z"
character: "characters/kapi.yaml"
currentLocation: "village-of-barovia"
visitedLocations: [...]
activeNPCs: [...]
contextCache:
  lastLoaded: "2025-11-17T14:31:00Z"
  tokensUsed: 3200
  priorities: {...}
```

**5. Git Integration (Architecture §3.2 - Enhanced)**

Epic 5 automates Git operations for session management:

- **Auto-Commit on Session End:**
  - Commit message format: `[SESSION] 2025-11-17 | Village of Barovia | Rescued Ireena`
  - Includes: Character sheet changes, location State.md updates, calendar.yaml, session log
- **Save Points:** Player can trigger manual Git tags (`/save checkpoint-name`)
- **Rollback:** `/load-save` lists Git tags, allows checkout

**Architectural Constraints (Maintained):**

- ✅ **File-First Design:** Session state also stored in files, not memory-only
- ✅ **Claude Code Only:** No separate LLM API dependencies
- ✅ **Human-Readable:** Session logs are markdown, session state is YAML
- ✅ **VS Code Native:** Extension uses standard VS Code APIs only

**No Changes to Epics 1-4 Systems:**

- Location folder structure unchanged (Epic 1)
- Calendar/Event system unchanged (Epic 2)
- D&D mechanics modules unchanged (Epic 3)
- Curse of Strahd content unchanged (Epic 4)

Epic 5 is a **pure integration and UX enhancement** layer.

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Owner |
|--------|---------------|--------|---------|-------|
| **ContextLoader** (`src/context/context-loader.js`) | Assemble game context for LLM prompts based on priority system | Character file path, location ID, session state | Context object (markdown string, token count, loaded entities) | Story 5-1 |
| **ContextCache** (`src/context/context-cache.js`) | In-memory cache for parsed location/NPC data, invalidate on file changes | File paths, cache keys | Cached objects or cache miss | Story 5-2 |
| **PriorityResolver** (`src/context/priority-resolver.js`) | Classify context elements by priority (P1/P2/P3), filter based on relevance | Entity list, current location, character state | Priority-sorted entity list | Story 5-1 |
| **PromptTemplateEngine** (`src/prompts/template-engine.js`) | Load and populate prompt templates with context variables | Template name, context object | Populated system prompt string | Story 5-3 |
| **ConsistencyValidator** (`src/prompts/consistency-validator.js`) | Validate player actions against world state and D&D 5e rules | Player action, world state, rules reference | Validation result (valid/invalid, reason) | Story 5-3 |
| **SessionManager** (`src/session/session-manager.js`) | Initialize, track, and terminate game sessions | Start/end session commands, character/location | Session state object, session logs | Story 5-6 |
| **SessionLogger** (`src/session/session-logger.js`) | Generate session summaries and save narrative logs | Session events, LLM responses | Session log markdown file | Story 5-6 |
| **GitIntegration** (`src/session/git-integration.js`) | Auto-commit session changes, create save points, rollback | Session end trigger, save command | Git commit/tag, success/failure | Story 5-6 |
| **CommandRegistry** (`extensions/kapis-rpg-dm/src/commands/registry.ts`) | Register and route VS Code slash commands | Command name, arguments | Command execution result | Story 5-4 |
| **CharacterSheetPanel** (`extensions/.../panels/character-sheet-panel.ts`) | Display live character stats in VS Code sidebar webview | Character file path, update events | Rendered HTML panel | Story 5-8 |
| **QuestTrackerPanel** (`extensions/.../panels/quest-tracker-panel.ts`) | Display active quests with objectives and deadlines | Quest files, calendar state | Rendered HTML panel | Story 5-9 |
| **CalendarWidget** (`extensions/.../panels/calendar-widget.ts`) | Show current in-game date, upcoming events, moon phase | Calendar YAML, event list | Rendered HTML widget | Story 5-10 |
| **LocationTreeProvider** (`extensions/.../providers/location-tree-provider.ts`) | Provide tree view of locations with navigation | Location metadata files | VS Code TreeView | Story 5-5 |
| **PerformanceMonitor** (`src/performance/monitor.js`) | Track context loading time, file I/O, token usage | Performance events | Metrics log, alerts if thresholds exceeded | Story 5-7 |

### Data Models and Contracts

**1. ContextObject (assembled by ContextLoader)**

```javascript
{
  metadata: {
    assembledAt: "2025-11-17T14:30:00Z",
    tokenCount: 3200,
    prioritiesLoaded: ["P1", "P2"],
    cacheHitRate: 0.75
  },
  character: {
    name: "Kapi",
    level: 5,
    class: "Wizard",
    hp: { current: 28, max: 35 },
    spellSlots: { level1: 2, level2: 1, level3: 0 },
    conditions: ["exhausted-1"],
    equipment: [...],
    abilitiesSnapshot: { STR: 8, DEX: 14, ... }
  },
  location: {
    locationId: "village-of-barovia",
    name: "Village of Barovia",
    description: "...", // from Description.md
    state: {...}, // parsed State.md YAML
    connections: ["tser-pool-encampment", "death-house"],
    timeOfDay: "night",
    weather: "foggy"
  },
  npcs: [
    {
      npcId: "ireena_kolyana",
      name: "Ireena Kolyana",
      locationId: "village-of-barovia",
      status: "alive",
      relationship: "ally",
      lastInteraction: "2025-11-15",
      relevanceScore: 10, // P1
      statsSummary: "...", // truncated for token efficiency
      dialogueContext: "Grateful for rescue from Strahd..."
    },
    // Only NPCs with relevanceScore >= 5 included (P1/P2)
  ],
  events: [
    {
      eventId: "strahd-attacks-church",
      triggerDate: "735-10-3",
      daysUntil: 2,
      priority: "P2",
      summary: "Strahd will attack the church at midnight..."
    }
  ],
  calendar: {
    currentDate: "735-10-1",
    currentTime: "20:00",
    dayOfWeek: "Moonday",
    moonPhase: "waxing_gibbous",
    season: "autumn"
  },
  quests: [
    {
      questId: "escort-ireena",
      title: "Escort Ireena to Vallaki",
      status: "active",
      objectives: [...],
      deadline: "735-10-8",
      priority: "main"
    }
  ],
  contextMarkdown: "# Current Context\n\n..." // Full formatted context for LLM
}
```

**2. SessionState (persisted in game-data/session/current-session.yaml)**

```yaml
sessionId: "2025-11-17-001"
startTime: "2025-11-17T14:30:00Z"
lastActivity: "2025-11-17T15:45:00Z"
character:
  filePath: "characters/kapi.yaml"
  snapshotHash: "a3f2b9..." # MD5 of character file at session start
location:
  currentLocationId: "village-of-barovia"
  visitedThisSession: ["village-of-barovia", "church-of-st-andral"]
  enteredAt: "2025-11-17T14:35:00Z"
npcs:
  activeNPCs:
    - ireena_kolyana
    - ismark_kolyanovich
  interactedWith: ["father_lucian", "ireena_kolyana"]
context:
  lastLoadedAt: "2025-11-17T14:31:00Z"
  tokensUsed: 3200
  cacheKeys: ["village-of-barovia-desc", "ireena-profile", ...]
calendar:
  sessionStartDate: "735-10-1"
  sessionStartTime: "20:00"
  timePassed: "2 hours" # in-game time
events:
  triggeredThisSession: ["burgomaster-funeral"]
  pendingEvents: ["strahd-attacks-church"]
performance:
  startupTime: 105 # seconds
  contextLoadTime: 8.3 # seconds
  avgLLMResponseTime: 6.5 # seconds
```

**3. PromptTemplate (stored in prompts/templates/*.md)**

```markdown
---
templateId: location-initial-visit
priority: P1
tokenBudget: 800
---

# Location: {{location.name}}

You are the Dungeon Master for a D&D 5e Curse of Strahd campaign. The player has just arrived at {{location.name}} for the first time.

**Current Date/Time:** {{calendar.currentDate}}, {{calendar.currentTime}} ({{location.timeOfDay}})
**Weather:** {{location.weather}}

**Location Description:**
{{location.description}}

**NPCs Present:**
{{#each npcs}}
- {{this.name}} ({{this.status}}) - {{this.dialogueContext}}
{{/each}}

**Player Character:** {{character.name}} (Level {{character.level}} {{character.class}}, {{character.hp.current}}/{{character.hp.max}} HP)

**Instructions:**
1. Describe the scene in vivid, atmospheric detail (2-3 paragraphs)
2. Highlight sensory details (sight, sound, smell) appropriate to gothic horror
3. Introduce any NPCs naturally within the scene
4. End with a prompt for player action
5. Adhere strictly to D&D 5e RAW rules

**Tone:** Dark, foreboding, immersive. Channel classic gothic horror literature.
```

**4. CommandDefinition (for VS Code extension commands)**

```typescript
interface CommandDefinition {
  commandId: string; // "kapis-rpg.start-session"
  name: string; // "Start Session"
  category: string; // "Session Management"
  args: CommandArg[];
  handler: (context: vscode.ExtensionContext, ...args: any[]) => Promise<CommandResult>;
  requiresSession: boolean; // true = can only run during active session
}

interface CommandArg {
  name: string;
  type: "string" | "location" | "character" | "number";
  required: boolean;
  default?: any;
  description: string;
}

interface CommandResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: Error;
}
```

**5. PanelState (for VS Code webview panels)**

```typescript
interface CharacterSheetPanelState {
  character: {
    name: string;
    level: number;
    class: string;
    hp: { current: number; max: number };
    ac: number;
    spellSlots: Record<string, { used: number; total: number }>;
    conditions: string[];
    abilities: Record<string, number>; // STR, DEX, CON, INT, WIS, CHA
  };
  lastUpdated: string; // ISO timestamp
  autoRefresh: boolean;
}

interface QuestTrackerPanelState {
  quests: Array<{
    questId: string;
    title: string;
    status: "active" | "completed" | "failed";
    objectives: Array<{ text: string; completed: boolean }>;
    deadline?: string;
    priority: "main" | "side";
  }>;
  filter: "all" | "active" | "completed";
  sortBy: "priority" | "deadline" | "alphabetical";
}
```

### APIs and Interfaces

**1. ContextLoader API**

```javascript
class ContextLoader {
  /**
   * Assemble game context for LLM prompt
   * @param {string} characterPath - Path to character YAML file
   * @param {string} locationId - Current location ID
   * @param {SessionState} sessionState - Current session state
   * @param {number} tokenBudget - Max tokens for context (default: 3500)
   * @returns {Promise<ContextObject>} Assembled context
   */
  async loadContext(characterPath, locationId, sessionState, tokenBudget = 3500);

  /**
   * Calculate token count for markdown string
   * @param {string} markdown - Markdown content
   * @returns {number} Estimated token count
   */
  estimateTokens(markdown);

  /**
   * Filter NPCs by relevance to current location
   * @param {Array<NPC>} npcs - All NPCs
   * @param {string} locationId - Current location
   * @param {Array<string>} adjacentLocations - Connected locations
   * @returns {Array<NPC>} Filtered NPCs with relevance scores
   */
  filterRelevantNPCs(npcs, locationId, adjacentLocations);
}
```

**2. SessionManager API**

```javascript
class SessionManager {
  /**
   * Start new game session
   * @param {string} characterPath - Path to character file
   * @param {string} locationId - Starting location
   * @returns {Promise<{success: boolean, sessionId: string, error?: string}>}
   */
  async startSession(characterPath, locationId);

  /**
   * End current session with summary
   * @param {string} summary - Player-provided session summary (optional)
   * @returns {Promise<{success: boolean, logPath: string, gitCommit: string}>}
   */
  async endSession(summary = null);

  /**
   * Get current session state
   * @returns {SessionState|null} Current session or null if no active session
   */
  getCurrentSession();

  /**
   * Update session state (location change, NPC interaction, etc.)
   * @param {Partial<SessionState>} updates - Fields to update
   * @returns {Promise<{success: boolean}>}
   */
  async updateSession(updates);
}
```

**3. VS Code Extension Commands (registered in package.json)**

```json
{
  "contributes": {
    "commands": [
      {
        "command": "kapis-rpg.start-session",
        "title": "Start Session",
        "category": "Kapi's RPG"
      },
      {
        "command": "kapis-rpg.end-session",
        "title": "End Session",
        "category": "Kapi's RPG"
      },
      {
        "command": "kapis-rpg.travel",
        "title": "Travel to Location",
        "category": "Kapi's RPG"
      },
      {
        "command": "kapis-rpg.rest",
        "title": "Take Rest (Short/Long)",
        "category": "Kapi's RPG"
      },
      {
        "command": "kapis-rpg.show-character-sheet",
        "title": "Show Character Sheet",
        "category": "Kapi's RPG"
      },
      {
        "command": "kapis-rpg.show-quest-tracker",
        "title": "Show Quest Tracker",
        "category": "Kapi's RPG"
      },
      {
        "command": "kapis-rpg.show-calendar",
        "title": "Show Calendar",
        "category": "Kapi's RPG"
      }
    ]
  }
}
```

**4. PromptTemplateEngine API**

```javascript
class PromptTemplateEngine {
  /**
   * Load and populate prompt template
   * @param {string} templateId - Template identifier (e.g., "location-initial-visit")
   * @param {ContextObject} context - Game context to inject
   * @returns {Promise<{prompt: string, tokenCount: number}>}
   */
  async renderTemplate(templateId, context);

  /**
   * Register custom template
   * @param {string} templateId - Unique template ID
   * @param {string} templateContent - Markdown template with {{variables}}
   * @returns {void}
   */
  registerTemplate(templateId, templateContent);

  /**
   * List available templates
   * @returns {Array<{id: string, description: string, tokenBudget: number}>}
   */
  listTemplates();
}
```

**5. GitIntegration API**

```javascript
class GitIntegration {
  /**
   * Create auto-commit for session end
   * @param {SessionState} session - Session to commit
   * @param {string} summary - Commit message summary
   * @returns {Promise<{success: boolean, commitHash: string, error?: string}>}
   */
  async commitSession(session, summary);

  /**
   * Create named save point (Git tag)
   * @param {string} saveName - Save point name
   * @param {string} description - Optional description
   * @returns {Promise<{success: boolean, tag: string}>}
   */
  async createSavePoint(saveName, description);

  /**
   * List available save points
   * @returns {Promise<Array<{tag: string, date: string, description: string}>>}
   */
  async listSavePoints();

  /**
   * Rollback to save point
   * @param {string} tag - Git tag to checkout
   * @returns {Promise<{success: boolean, restoredFiles: string[]}>}
   */
  async rollbackToSave(tag);
}
```

### Workflows and Sequencing

**Workflow 1: Session Initialization (`/start-session`)**

```
Player: /start-session village-of-barovia kapi
    ↓
1. SessionManager.startSession()
    ↓
2. Load character file (characters/kapi.yaml)
    ↓
3. Validate character file (check required fields)
    ↓
4. Load location metadata (game-data/locations/village-of-barovia/metadata.yaml)
    ↓
5. ContextLoader.loadContext(characterPath, locationId, newSessionState)
    ├→ Load P1 context (character, location description, calendar)
    ├→ Load P2 context (relevant NPCs, upcoming events)
    ├→ Estimate token count (~3200 tokens)
    └→ Generate contextMarkdown
    ↓
6. PromptTemplateEngine.renderTemplate("location-initial-visit", context)
    ↓
7. Create session state file (game-data/session/current-session.yaml)
    ↓
8. Display to player: "Session started. You are in Village of Barovia..."
    ↓
9. Inject context + system prompt to Claude Code
    ↓
10. Claude Code generates initial narration
    ↓
11. Session active, awaiting player input

Performance Target: Steps 1-8 complete in <2 minutes
```

**Workflow 2: Location Travel (`/travel destination`)**

```
Player: /travel vallaki
    ↓
1. Validate destination exists in location connections
    ↓
2. Calculate travel time (metadata.yaml: travel_time field)
    ↓
3. Advance calendar by travel time (Epic 2 CalendarManager)
    ↓
4. Check for random encounters (Epic 2 EventScheduler)
    ↓
5. [If encounter] → Execute encounter, update session state
    ↓
6. Update session state (currentLocation: "vallaki")
    ↓
7. ContextLoader.loadContext() with new location
    ├→ Clear cache for old location
    ├→ Load new location P1/P2 context
    └→ Recalculate NPCs (filter for vallaki + adjacent)
    ↓
8. PromptTemplateEngine.renderTemplate("location-arrival", context)
    ↓
9. Inject updated context to Claude Code
    ↓
10. Claude Code narrates arrival at Vallaki

Performance Target: Steps 1-9 complete in <10 seconds
```

**Workflow 3: Session End (`/end-session [summary]`)**

```
Player: /end-session "Rescued Ireena, agreed to escort her to Vallaki"
    ↓
1. SessionLogger.generateSummary(sessionState, playerSummary)
    ├→ Extract key events from session
    ├→ List NPCs interacted with
    ├→ Calculate XP gained
    ├→ List items acquired
    └→ Generate markdown log
    ↓
2. Save session log (game-data/session/logs/2025-11-17-session-1.md)
    ↓
3. Update session history (game-data/session/session-history.yaml)
    ↓
4. GitIntegration.commitSession(sessionState, playerSummary)
    ├→ Stage changed files: character sheet, location State.md, calendar.yaml, session log
    ├→ Generate commit message: "[SESSION] 2025-11-17 | Village of Barovia | Rescued Ireena"
    └→ Create commit
    ↓
5. Clear session state (delete current-session.yaml)
    ↓
6. Display summary to player:
    - Session duration: 1.5 hours
    - Locations visited: 2
    - NPCs met: 3
    - XP gained: 150
    - Git commit: a3f2b9c
    ↓
7. Session ended, ready for next session

Performance Target: Steps 1-6 complete in <30 seconds
```

**Workflow 4: Context Caching (Background Process)**

```
During active session:
    ↓
Every player action:
    ↓
1. ContextCache.get(cacheKey)
    ├→ [Cache hit] Return cached object (skip file I/O)
    └→ [Cache miss] Load from file, parse, cache, return
    ↓
2. Watch file system for changes (fs.watch)
    ↓
3. [If file modified] → ContextCache.invalidate(cacheKey)
    ↓
4. Next access will re-load from disk

Cache Eviction Policy:
- Session end → Clear all cache
- Memory limit (100MB) → Evict LRU (Least Recently Used)
- File modification → Invalidate specific cache entry
```

**Workflow 5: Token Budget Management**

```
ContextLoader.loadContext():
    ↓
1. Initialize token budget: 3500 tokens (soft limit)
    ↓
2. Load P1 context (always):
    ├→ Character sheet: ~400 tokens
    ├→ Location Description.md: ~600 tokens
    ├→ Location State.md: ~200 tokens
    ├→ Calendar state: ~100 tokens
    └→ Subtotal: ~1300 tokens, Remaining: 2200 tokens
    ↓
3. Load P2 context (conditional):
    ├→ Filter NPCs (relevance >= 5): 3 NPCs × 150 tokens = ~450 tokens
    ├→ Upcoming events (next 7 days): 2 events × 100 tokens = ~200 tokens
    ├→ Active quests: 2 quests × 200 tokens = ~400 tokens
    └→ Subtotal: ~1050 tokens, Remaining: 1150 tokens
    ↓
4. Load P3 context (if budget allows):
    ├→ Remaining budget: 1150 tokens
    ├→ Additional context available: 800 tokens (lore, full Events.md)
    ├→ Load P3 content up to budget
    └→ Final token count: 3200 tokens
    ↓
5. [If over budget] → Remove lowest priority P3 items
    ↓
6. Return ContextObject with tokenCount metadata
```

**Sequence Diagram: Claude Code Integration**

```
Player → VS Code Extension → Context Loader → Claude Code → Player

1. Player: "I search the room"
2. Extension: Capture input, check session active
3. Context Loader: Assemble current context (3200 tokens)
4. Extension: Inject context + system prompt + player action to Claude Code
5. Claude Code: Process prompt (6.5s avg response time)
6. Claude Code: Generate narrative response + update state
7. Extension: Parse response, extract state changes
8. Extension: Update session state file
9. Extension: Display narrative to player
10. Player: Reads response, decides next action
```

## Non-Functional Requirements

### Performance

**Target Metrics (from GDD §Success Metrics):**

| Metric | Target | Measurement Method | Priority |
|--------|--------|-------------------|----------|
| **Session Startup Time** | <2 minutes (95th percentile) | Time from `/start-session` command to ready prompt | P0 - Critical |
| **Location Transition Time** | <10 seconds | Time from `/travel` command to new location narration | P0 - Critical |
| **LLM Response Time** | <10 seconds (95th percentile) | Time from player input to Claude Code response | P1 - High |
| **Context Load Time** | <5 seconds | Time for ContextLoader.loadContext() to complete | P1 - High |
| **File I/O Performance** | <1 second per location | Time to read all location files (Description, NPCs, Items, Events, State, metadata) | P1 - High |
| **Token Count Estimation** | <100ms | Time to estimate token count for markdown string | P2 - Medium |
| **Cache Hit Rate** | >75% | Percentage of context requests served from cache | P2 - Medium |
| **Session End Commit** | <30 seconds | Time from `/end-session` to Git commit complete | P2 - Medium |

**Performance Constraints:**

- **Token Budget Hard Limit:** 4000 tokens max for context (Claude Code API limit)
- **Token Budget Soft Limit:** 3500 tokens (reserve 500 for long LLM responses)
- **Memory Limit:** ContextCache max 100MB (evict LRU if exceeded)
- **File Watch Limit:** Max 100 file watchers (VS Code limitation)
- **Concurrent Requests:** Single-threaded LLM requests (no parallel Claude Code calls)

**Optimization Strategies:**

1. **Context Caching:** In-memory cache for parsed location/NPC data (75%+ hit rate target)
2. **Lazy Loading:** Load P3 context only if token budget allows
3. **Smart NPC Filtering:** Only load NPCs in current + adjacent locations (reduces 50+ NPCs to ~5)
4. **Event Filtering:** Only load events within next 7 days (reduces 100+ events to ~5)
5. **Markdown Parsing Cache:** Cache parsed YAML frontmatter to avoid re-parsing unchanged files
6. **Background Preloading:** Preload likely next locations (connected locations) during idle time
7. **File I/O Batching:** Read multiple location files in parallel using Promise.all()

**Performance Monitoring:**

- `src/performance/monitor.js` logs all performance metrics to `performance.log`
- Alert if any metric exceeds target by 50% (e.g., session startup >3 minutes)
- Weekly performance report generated from logs (automated script)

### Security

**Threat Model:**

Kapi-s-RPG is a **local-only, single-player application** with no network communication (except Claude Code extension's LLM API calls). Primary security concerns are:

1. **File System Access:** Extension has full access to project files (necessary for game functionality)
2. **Git Operations:** Extension performs Git commits/checkouts (requires user Git credentials)
3. **LLM Context Injection:** Game state loaded into Claude Code prompts (no PII, but game state is sent to Anthropic servers)
4. **VS Code Extension Permissions:** Extension requires file system, Git, and webview permissions

**Security Requirements:**

| Requirement | Implementation | Validation |
|-------------|---------------|------------|
| **No User Credentials Storage** | Never store passwords, API keys, or tokens in files or extension state | Code review: No credential variables |
| **Path Traversal Protection** | Validate all file paths stay within project root before file operations | Unit tests: Reject `../` paths |
| **Git Credential Delegation** | Use system Git (inherits user's credential manager), never handle credentials directly | Manual verification |
| **Input Sanitization** | Sanitize player input before file writes (prevent command injection in session logs) | Unit tests: Reject shell metacharacters |
| **File Permission Checks** | Verify file writability before modifications, handle permission errors gracefully | Integration tests |
| **Claude Code API Security** | Use Claude Code extension's existing authentication, no separate API key required | Architectural constraint |
| **No Remote Code Execution** | No `eval()`, no dynamic code generation, no script execution from files | ESLint rules: `no-eval` |

**Data Privacy:**

- **Game State Transmitted to Anthropic:** Character sheets, location descriptions, NPC data sent to Claude via Claude Code extension
- **No Analytics/Telemetry:** Extension does not phone home, no usage tracking, no crash reports sent externally
- **Local Storage Only:** All data stays on user's local file system
- **User Consent:** Installation of Claude Code extension constitutes consent for LLM data transmission (Anthropic's privacy policy applies)

**Security Non-Goals (Out of Scope):**

- ❌ Encryption at rest (files stored as plaintext markdown/YAML)
- ❌ Multi-user access control (single-player only)
- ❌ Network security (no network-facing components)
- ❌ Content filtering (no NSFW detection in LLM responses)
- ❌ Anti-cheat mechanisms (player can edit files directly, this is expected)

### Reliability/Availability

**Reliability Target:** 100% data integrity (zero file corruption incidents)

**Failure Modes and Mitigation:**

| Failure Mode | Impact | Mitigation Strategy | Recovery Procedure |
|--------------|--------|---------------------|-------------------|
| **File Corruption** | Loss of location/character data | Git version control (every session auto-commits) | `/load-save` to rollback to last good commit |
| **Session Crash** | Loss of unsaved session progress | Auto-save current-session.yaml every 5 minutes | Resume from last auto-save on next `/start-session` |
| **Context Load Failure** | Cannot start session | Graceful error messages, validate file integrity | Fix corrupted file or restore from Git |
| **Claude Code API Timeout** | LLM response hangs | 30-second timeout, retry once, then fail gracefully | Display error, allow player to retry or end session |
| **Git Operation Failure** | Cannot commit session | Detect Git errors, save session log to file anyway | Manual Git commit by player, or skip commit |
| **Cache Corruption** | Stale data loaded | Cache invalidation on file changes, clear cache on session start | Clear cache via `/context reload` command |
| **Token Budget Exceeded** | LLM refuses to process prompt | Detect and reduce context (remove P3 items) | Automatic: Drop lowest priority content until under budget |

**Error Handling Philosophy:**

- **Fail-Safe Design:** Errors should never corrupt game files or lose player progress
- **Graceful Degradation:** If context loading fails, load minimal context and continue
- **User-Facing Errors:** All error messages should be actionable (tell player what to do next)
- **Result Object Pattern:** All async operations return `{success, data, error}` instead of throwing exceptions

**Availability:**

- **Local Application:** No server dependencies, 100% availability (assuming VS Code and Claude Code extension installed)
- **Claude Code Dependency:** LLM API outages will block gameplay (no offline mode)
- **Git Dependency:** Git must be installed and configured (pre-requisite documented)

**Data Backup Strategy:**

- **Primary Backup:** Git version control (every session auto-commits)
- **Manual Save Points:** Player can create named Git tags via `/save [name]` command
- **Recommended:** Players should push to remote Git repository periodically for off-machine backup

**Testing for Reliability:**

- Unit tests for error handling (invalid files, missing fields, corrupted YAML)
- Integration tests for failure scenarios (Git failures, file permission errors)
- Stress tests for large locations (Castle Ravenloft with 60+ rooms)

### Observability

**Logging Strategy:**

| Log Type | File Path | Content | Retention |
|----------|-----------|---------|-----------|
| **Session Logs** | `game-data/session/logs/*.md` | Narrative session summaries (player actions, NPC interactions, events) | Permanent (Git-committed) |
| **Performance Logs** | `performance.log` | Timing metrics (startup, context load, LLM response times) | 30 days |
| **Error Logs** | `error.log` | Stack traces, file I/O errors, validation failures | 30 days |
| **Debug Logs** | `debug.log` (development only) | Context assembly details, cache hits/misses, token counts | 7 days |
| **Git Commit History** | `.git/` | Session commits with descriptive messages | Permanent |

**Metrics Collected:**

1. **Performance Metrics** (logged to `performance.log`):
   - Session startup time (ms)
   - Context load time (ms)
   - LLM response time (ms)
   - Location transition time (ms)
   - File I/O time per operation (ms)
   - Cache hit rate (%)
   - Token count per context load

2. **Usage Metrics** (logged to `session-history.yaml`):
   - Sessions per week
   - Average session duration (hours)
   - Locations visited
   - NPCs interacted with
   - Quests completed
   - Player level progression

3. **Error Metrics** (logged to `error.log`):
   - Error type (file I/O, Git, validation, LLM API)
   - Error frequency
   - Context when error occurred
   - User impact (session blocked, data lost, etc.)

**Monitoring Tools:**

- **Real-Time Monitoring:** VS Code output channel displays warnings/errors during session
- **Session Summary:** `/end-session` displays performance stats (duration, locations visited, XP gained)
- **Performance Dashboard:** `scripts/analyze-performance.js` generates weekly report from `performance.log`
- **Debug Mode:** `VS Code setting: kapis-rpg.debug = true` enables verbose debug.log

**Alerting:**

- **Performance Degradation:** Alert in VS Code if session startup >3 minutes (50% over target)
- **Cache Efficiency:** Warn if cache hit rate <50% (significantly below 75% target)
- **Token Budget:** Warn if context consistently exceeds 3800 tokens (approaching hard limit)
- **File System Errors:** Display actionable error message immediately (e.g., "Cannot write to character file - check permissions")

**Diagnostic Commands:**

- `/context show` - Display current context token count and loaded entities
- `/context reload` - Force cache clear and reload all context
- `/debug performance` - Show last 10 performance metrics
- `/debug session` - Show current session state details

**Metrics Visualization:**

No real-time dashboards (out of scope). Manual analysis via scripts:
- `scripts/analyze-performance.js` - Parse performance.log, generate statistics
- `scripts/session-report.js` - Parse session-history.yaml, generate campaign progress report

## Dependencies and Integrations

**External Dependencies:**

| Dependency | Version | Purpose | Installation | License |
|------------|---------|---------|--------------|---------|
| **VS Code** | 1.80+ | Development environment and game platform | User pre-requisite | MIT |
| **Claude Code Extension** | Latest | LLM integration for narrative generation | VS Code Marketplace | Proprietary (Anthropic) |
| **Node.js** | 18+ | JavaScript runtime for scripts and modules | User pre-requisite | MIT |
| **Git** | 2.x | Version control and save system | User pre-requisite | GPL-2.0 |
| **js-yaml** | 4.1.0 | YAML parsing for location/character files | `npm install` | MIT |
| **date-fns** | 2.30.0 | Date manipulation for calendar system | `npm install` | MIT |
| **Jest** | 29.7.0 | Testing framework | `npm install --dev` | MIT |

**Internal System Dependencies (Epics 1-4):**

| System | Epic | Purpose | Integration Point |
|--------|------|---------|-------------------|
| **LocationLoader** | Epic 1 | Load location folder structure | `ContextLoader` calls `LocationLoader.loadLocation()` |
| **StateManager** | Epic 1 | Load/save State.md files | `SessionManager` updates state on location changes |
| **CalendarManager** | Epic 2 | Track in-game date/time | `ContextLoader` includes calendar state in context |
| **EventScheduler** | Epic 2 | Schedule time-based events | `SessionManager` checks events during `/rest` and `/travel` |
| **CharacterManager** | Epic 3 | Parse character sheets | `ContextLoader` loads character data |
| **DiceRoller** | Epic 3 | D&D 5e dice mechanics | `PromptTemplateEngine` includes dice results in prompts |
| **CombatManager** | Epic 3 | Combat encounter resolution | `SessionManager` triggers combat when events fire |
| **NPCDatabase** | Epic 4 | NPC profile data | `ContextLoader` filters and loads relevant NPCs |
| **QuestSystem** | Epic 4 | Quest tracking | `ContextLoader` includes active quests in context |

**VS Code Extension API Dependencies:**

```json
{
  "engines": {
    "vscode": "^1.80.0"
  },
  "activationEvents": [
    "onCommand:kapis-rpg.start-session",
    "workspaceContains:**/game-data/calendar.yaml"
  ],
  "contributes": {
    "commands": [...],
    "viewsContainers": {
      "activitybar": [
        {
          "id": "kapis-rpg-sidebar",
          "title": "Kapi's RPG",
          "icon": "media/dice-icon.svg"
        }
      ]
    },
    "views": {
      "kapis-rpg-sidebar": [
        {
          "id": "character-sheet-view",
          "name": "Character Sheet"
        },
        {
          "id": "quest-tracker-view",
          "name": "Quest Tracker"
        },
        {
          "id": "calendar-view",
          "name": "Calendar"
        }
      ]
    },
    "configuration": {
      "title": "Kapi's RPG",
      "properties": {
        "kapis-rpg.debug": {
          "type": "boolean",
          "default": false,
          "description": "Enable debug logging"
        },
        "kapis-rpg.autoSaveInterval": {
          "type": "number",
          "default": 300,
          "description": "Auto-save interval in seconds (0 to disable)"
        },
        "kapis-rpg.contextTokenBudget": {
          "type": "number",
          "default": 3500,
          "description": "Soft token limit for context loading"
        }
      }
    }
  }
}
```

**Claude Code Extension Integration:**

- **Method:** MCP (Model Context Protocol) for file context injection
- **Authentication:** Uses Claude Code's existing authentication (no separate API key required)
- **Context Injection:** Pass assembled markdown context as system prompt + user message
- **No Code Modifications:** Epic 5 does not modify Claude Code extension, only uses its API

**Git Integration:**

- **Method:** Spawn `git` CLI commands via Node.js `child_process`
- **Operations:** `git add`, `git commit`, `git tag`, `git checkout`, `git log`
- **Credential Handling:** Inherit from system Git (uses user's configured credential manager)
- **Repository Assumption:** Project directory must be a Git repository (initialized in Epic 1)

**File System Integration:**

- **Read Operations:** `fs.readFile()` for location files, character sheets, calendar.yaml
- **Write Operations:** `fs.writeFile()` for session state, session logs, updated State.md files
- **Watch Operations:** `fs.watch()` for cache invalidation on file changes
- **Path Resolution:** All paths relative to VS Code workspace root

**Cross-Epic Data Flow:**

```
Player Action (Epic 5)
    ↓
SessionManager updates state
    ↓
CalendarManager advances time (Epic 2)
    ↓
EventScheduler checks triggers (Epic 2)
    ↓
EventExecutor applies effects (Epic 2)
    ↓
StateManager saves location state (Epic 1)
    ↓
ContextLoader reloads context (Epic 5)
    ↓
Claude Code generates narrative (Epic 5)
    ↓
Display to player (Epic 5)
```

## Acceptance Criteria (Authoritative)

**AC-1: Intelligent Context Loading System Implemented**
- ContextLoader module loads character, location, NPCs, events, quests based on 3-priority system (P1/P2/P3)
- Token budget management enforced: context stays under 3500 tokens soft limit, 4000 hard limit
- Smart NPC filtering: only loads NPCs in current location + 1 connection distance (adjacent locations)
- Event filtering: only loads events within next 7 days of in-game time
- Context assembly completes in <5 seconds for typical location (Village of Barovia)
- Token count estimation accurate within ±10% of actual Claude Code token usage

**AC-2: Context Caching Strategy Implemented**
- ContextCache module provides in-memory cache with LRU eviction policy (100MB limit)
- Cache hit rate >75% during normal gameplay session (after initial context load)
- File system watcher invalidates cache when files modified on disk
- Cache cleared automatically on session start (fresh context for new session)
- Cache provides 5x+ speedup for repeated context loads (measured via performance.log)

**AC-3: LLM Prompt Templates Implemented**
- PromptTemplateEngine renders templates with {{variable}} substitution
- Minimum 5 templates implemented: location-initial-visit, location-return, npc-dialogue, combat-narration, consistency-validation
- DM persona prompt loaded from `prompts/dm-persona.md` (gothic horror tone, RAW D&D 5e adherence)
- Template token budgets enforced (P1 templates stay within allocated token ranges)
- Templates generate grammatically correct markdown output (verified by manual review)

**AC-4: Enhanced Slash Commands Implemented**
- `/start-session [location] [character]` initializes session in <2 minutes
- `/end-session [summary]` saves state, generates log, creates Git commit in <30 seconds
- `/travel [destination]` transitions to new location in <10 seconds, advances calendar, checks events
- `/rest [short|long]` executes rest mechanics (HP/spell recovery), advances calendar appropriately
- `/context [reload|show|reduce]` provides manual context management tools
- All commands return Result Objects with `{success, data, error}` format

**AC-5: VS Code UI Panels Implemented**
- Character Sheet Panel displays HP, AC, spell slots, conditions, abilities (live updates)
- Quest Tracker Panel shows active quests with objectives, deadlines, completion status
- Calendar Widget displays current in-game date/time, upcoming events, moon phase, weather
- Location Tree Provider shows clickable location map in VS Code sidebar
- All panels refresh automatically when underlying files change

**AC-6: Session Management System Implemented**
- SessionManager creates `game-data/session/current-session.yaml` on `/start-session`
- Session state tracks: current location, visited locations, active NPCs, context cache metadata
- Auto-save mechanism saves session state every 5 minutes (configurable)
- SessionLogger generates markdown session summaries with key events, NPCs, loot, XP
- Session end clears current-session.yaml, appends to session-history.yaml

**AC-7: Git Integration Implemented**
- GitIntegration module auto-commits on `/end-session` with format: `[SESSION] YYYY-MM-DD | Location | Summary`
- `/save [name]` creates Git tag for manual save points
- `/load-save` lists Git tags, allows rollback to previous save
- Git operations use system Git CLI (no credential storage in extension)
- Git errors handled gracefully (save session log even if commit fails)

**AC-8: Performance Targets Met**
- Session startup <2 minutes (95th percentile) from `/start-session` to ready prompt
- Location transitions <10 seconds from `/travel` command to new narration
- LLM response time <10 seconds (95th percentile) for typical player actions
- Context load time <5 seconds for typical location with 5 NPCs, 3 quests, 2 events
- Cache hit rate >75% after first context load in session

**AC-9: Markdown Preview Styling Implemented**
- Custom CSS provides gothic horror theme (dark background, warm text, Garamond-style serif)
- Narrative text uses serif font, mechanics/stats use monospace font
- NPC names, item names, location names rendered as clickable links (navigate to definitions)
- Markdown preview optimized for readability (appropriate line height, margins, contrast)

**AC-10: Observability and Logging Implemented**
- Performance metrics logged to `performance.log` (startup, context load, LLM response times)
- Error logging to `error.log` with stack traces, context, user impact
- Session logs saved to `game-data/session/logs/*.md` with narrative summaries
- `/debug performance` command shows last 10 performance metrics
- `/debug session` command shows current session state details

**AC-11: Integration with Epics 1-4 Verified**
- ContextLoader successfully calls LocationLoader (Epic 1), CharacterManager (Epic 3), QuestSystem (Epic 4)
- SessionManager successfully calls CalendarManager (Epic 2), EventScheduler (Epic 2), StateManager (Epic 1)
- `/rest` command successfully triggers Epic 2 calendar advancement and Epic 3 rest mechanics
- `/travel` command successfully checks Epic 2 random encounters and updates Epic 1 location state
- All Epic 1-4 systems work unchanged (no regressions, zero breaking changes)

## Traceability Mapping

| AC# | Spec Section(s) | Component(s)/API(s) | Story | Test Idea |
|-----|----------------|---------------------|-------|-----------|
| **AC-1** | Detailed Design > Services > ContextLoader, PriorityResolver; System Arch > Context Loading Strategy | `ContextLoader.loadContext()`, `PriorityResolver.filterRelevantNPCs()`, `PriorityResolver.filterRelevantEvents()` | 5-1 | Unit test: Load Village of Barovia context, verify token count <3500. Integration test: Verify only adjacent NPCs loaded (exclude distant NPCs like Strahd in Castle Ravenloft). |
| **AC-2** | Detailed Design > Services > ContextCache; Workflows > Context Caching | `ContextCache.get()`, `ContextCache.set()`, `ContextCache.invalidate()` | 5-2 | Unit test: Cache hit/miss scenarios. Integration test: Measure cache hit rate over 10-action session, verify >75%. Performance test: Load same location 10x, verify 5x+ speedup. |
| **AC-3** | Detailed Design > Services > PromptTemplateEngine; Data Models > PromptTemplate; System Arch > LLM-DM Integration | `PromptTemplateEngine.renderTemplate()`, `prompts/dm-persona.md`, `prompts/templates/*.md` | 5-3 | Unit test: Render location-initial-visit template, verify all {{variables}} replaced. Integration test: Load 5 template types, verify token budgets met. Manual: Review rendered prompts for grammatical correctness. |
| **AC-4** | Detailed Design > APIs > VS Code Extension Commands; Workflows > Session Init, Location Travel, Session End | `kapis-rpg.start-session`, `kapis-rpg.end-session`, `kapis-rpg.travel`, `kapis-rpg.rest`, `kapis-rpg.context` | 5-4 | Integration test: Execute each command, measure execution time, verify <target. E2E test: Full session workflow (start → travel → rest → end), verify all steps succeed. |
| **AC-5** | System Arch > VS Code Extension Architecture; Detailed Design > Services > CharacterSheetPanel, QuestTrackerPanel, CalendarWidget | `CharacterSheetPanel`, `QuestTrackerPanel`, `CalendarWidget`, `LocationTreeProvider` | 5-5, 5-8, 5-9, 5-10 | Integration test: Open each panel, verify data displays correctly. UI test: Modify character HP in file, verify panel auto-refreshes. |
| **AC-6** | System Arch > Session Management Architecture; Detailed Design > Services > SessionManager, SessionLogger; Data Models > SessionState | `SessionManager.startSession()`, `SessionManager.endSession()`, `SessionLogger.generateSummary()` | 5-6 | Integration test: Start session, verify current-session.yaml created with correct fields. Test auto-save (wait 5 min, verify state saved). Test session end (verify session-history.yaml updated). |
| **AC-7** | System Arch > Git Integration; Detailed Design > APIs > GitIntegration; Workflows > Session End | `GitIntegration.commitSession()`, `GitIntegration.createSavePoint()`, `GitIntegration.rollbackToSave()` | 5-6 | Integration test: End session, verify Git commit created with correct message format. Test save point creation and rollback. Test Git failure handling (simulate no Git installed). |
| **AC-8** | NFR > Performance (all metrics); Workflows > Session Init, Location Travel | All ContextLoader, SessionManager, PromptTemplateEngine APIs | 5-1, 5-2, 5-7 | Performance test: Measure session startup time over 10 sessions, calculate 95th percentile. Stress test: Load Castle Ravenloft (60+ rooms), verify <5s context load. Monitor performance.log during gameplay. |
| **AC-9** | Objectives > Markdown Preview Styling; System Arch > VS Code Extension (media/styles) | `media/styles/narrative-theme.css` | 5-11 | Manual UI test: View narrative in markdown preview, verify gothic theme applied. Test clickable links (NPC names, items, locations). Verify font choices (serif for narrative, monospace for mechanics). |
| **AC-10** | NFR > Observability; Detailed Design > Services > PerformanceMonitor | `PerformanceMonitor`, `performance.log`, `error.log`, `game-data/session/logs/*.md` | 5-7 | Integration test: Execute session, verify performance.log entries created. Test `/debug performance` command output. Trigger error (invalid file), verify error.log entry. |
| **AC-11** | Dependencies > Internal System Dependencies; Cross-Epic Data Flow | All Epic 1-4 system integrations: LocationLoader, StateManager, CalendarManager, EventScheduler, CharacterManager, CombatManager, QuestSystem | All stories | Regression test: Run Epic 1-4 test suites, verify 100% pass rate (no breaking changes). Integration test: Execute `/rest`, verify Epic 2 calendar advances and Epic 3 spell slots recover. |

## Risks, Assumptions, Open Questions

**RISKS:**

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| **R1** | Claude Code API changes break integration | Medium | Critical | Use stable MCP APIs only, avoid undocumented features. Monitor Claude Code extension changelog. |
| **R2** | Token budget insufficient for large locations (Castle Ravenloft) | High | High | Implement aggressive P3 filtering. Test with Castle Ravenloft early. Add `/context reduce` command for manual reduction. |
| **R3** | Performance targets missed (session startup >2 min) | Medium | High | Optimize context caching early (Story 5-2). Profile and identify bottlenecks. Consider preloading strategies. |
| **R4** | VS Code extension development learning curve | Medium | Medium | Leverage VS Code extension samples and documentation. Allocate buffer time for Story 5-5 (UI panels). |
| **R5** | LLM response quality degradation with reduced context | Medium | High | Prioritize P1 context carefully (character, location, active NPCs). Test narrative quality with minimal context. Add `/context show` to debug issues. |
| **R6** | Git operations fail on Windows (path issues, permissions) | Low | Medium | Test Git integration on Windows early. Use cross-platform path handling (Node.js `path` module). |
| **R7** | File system watch limit exceeded (VS Code 100-file limit) | Low | Low | Watch only critical files (current location, character, calendar). Avoid watching all 34+ locations simultaneously. |
| **R8** | Cache invalidation bugs cause stale data in prompts | Medium | High | Implement comprehensive cache invalidation tests. Add cache version numbers. Provide `/context reload` escape hatch. |

**ASSUMPTIONS:**

| ID | Assumption | Validation | Impact if False |
|----|------------|------------|-----------------|
| **A1** | Claude Code extension supports MCP for context injection | Review Claude Code documentation | Epic 5 cannot proceed without alternative LLM integration method |
| **A2** | 3500-token context sufficient for typical gameplay | Test with Epic 4 content loaded | Need to reduce content or increase token budget |
| **A3** | Claude Code response times average <10 seconds | Monitor during Epic 4 gameplay | Players experience frustration, need loading indicators |
| **A4** | Players have Git installed and configured | Document as pre-requisite | Manual session save/load fallback required |
| **A5** | VS Code workspace root = project directory | Document expected folder structure | Path resolution breaks, need configurable root |
| **A6** | Cache hit rate >75% achievable with LRU policy | Test during development | Need alternative caching strategy (e.g., frequency-based) |
| **A7** | File I/O on local SSD fast enough (<1s per location) | Test on target hardware | Need async loading, show progress indicators |
| **A8** | Single-threaded LLM requests acceptable (no parallel calls) | User experience testing | Need request queuing or concurrent request handling |

**OPEN QUESTIONS:**

| ID | Question | Owner | Target Resolution Date |
|----|----------|-------|----------------------|
| **Q1** | Should context preloading be aggressive (all adjacent locations) or conservative (next likely location only)? | Story 5-7 | Before Story 5-7 implementation |
| **Q2** | How to handle context overflow (>4000 tokens)? Drop P3 entirely or truncate each priority level proportionally? | Story 5-1 | Before Story 5-1 implementation |
| **Q3** | Should session logs be plain text markdown or structured YAML with narrative sections? | Story 5-6 | Before Story 5-6 implementation |
| **Q4** | How granular should auto-save be? Every action, every 5 minutes, or manual only? | Story 5-6 | Before Story 5-6 implementation |
| **Q5** | Should VS Code panels be always-visible or collapsible/hideable? | Story 5-5 | Before Story 5-5 implementation |
| **Q6** | How to handle Claude Code API timeouts? Retry automatically or prompt user? | Story 5-4 | Before Story 5-4 implementation |
| **Q7** | Should prompt templates support conditionals (if/else) or just variable substitution? | Story 5-3 | Before Story 5-3 implementation |
| **Q8** | How to measure LLM response quality (narrative coherence, RAW adherence)? Manual review or automated metrics? | Story 5-3 | Before Story 5-3 testing |

## Test Strategy Summary

**Testing Philosophy:** Epic 5 focuses on integration testing and performance testing due to heavy reliance on external systems (VS Code, Claude Code, Git, file system). Unit tests cover core logic (context filtering, token estimation), while integration tests verify system boundaries work correctly.

**Test Pyramid Distribution:**

- **Unit Tests:** 40% - Core algorithms (context filtering, token estimation, cache LRU, path sanitization)
- **Integration Tests:** 45% - System integrations (file I/O, Git operations, Epic 1-4 APIs, VS Code extension APIs)
- **E2E Tests:** 10% - Full session workflows (start → play → end)
- **Performance Tests:** 5% - Timing measurements, stress tests (Castle Ravenloft), cache efficiency

**Test Coverage Targets:**

| Component | Coverage Target | Rationale |
|-----------|----------------|-----------|
| **ContextLoader** | 85% | Critical path, complex logic (priority filtering, token budget) |
| **ContextCache** | 80% | Complex cache invalidation logic |
| **SessionManager** | 75% | Many integration points, harder to unit test |
| **GitIntegration** | 60% | External dependency (Git CLI), focus on error handling |
| **PromptTemplateEngine** | 85% | Template parsing logic critical for LLM quality |
| **VS Code Extension** | 50% | UI components difficult to test, focus on command handlers |
| **Overall Epic 5** | 70% | Balanced coverage with emphasis on critical paths |

**Test Framework:**

- **Unit/Integration Tests:** Jest (v29.7.0) - existing Epic 1-4 framework
- **E2E Tests:** Jest with VS Code extension test harness
- **Performance Tests:** Custom timing scripts + `performance.log` analysis
- **Manual Tests:** Checklist-based UI testing, narrative quality review

**Test Environments:**

| Environment | Purpose | Configuration |
|-------------|---------|---------------|
| **Local Development** | Unit and integration tests during development | Mocked file system, mocked Git, real Epic 1-4 systems |
| **CI Environment** | Automated test runs (if CI added) | Real file system (temp directory), real Git, real Epic 1-4 systems |
| **Staging (Playtest)** | E2E tests with real Claude Code extension | Real project directory, real Git repo, real Claude Code API |
| **Production (Self)** | Dogfooding, real gameplay sessions | Complete Curse of Strahd campaign, monitor performance.log |

**Test Scenarios by AC:**

**AC-1 (Context Loading):**
- Unit: Test priority resolver filters NPCs by location adjacency
- Unit: Test event filter includes only events within 7 days
- Integration: Load Village of Barovia, verify token count <3500
- Integration: Load Castle Ravenloft, verify token count <4000 (stress test)
- Performance: Measure context load time, verify <5 seconds

**AC-2 (Caching):**
- Unit: Test cache get/set/invalidate operations
- Unit: Test LRU eviction when memory limit exceeded
- Integration: Load same location 10x, verify cache hits
- Performance: Measure cache hit rate over 20-action session, verify >75%
- Integration: Modify file on disk, verify cache invalidated

**AC-3 (Prompt Templates):**
- Unit: Test {{variable}} substitution with various data types
- Unit: Test template token budget enforcement
- Integration: Render all 5 templates, verify valid markdown output
- Manual: Review rendered prompts for grammatical correctness, tone

**AC-4 (Slash Commands):**
- Integration: Execute `/start-session`, verify session state created
- Integration: Execute `/travel`, verify calendar advanced, events checked
- Integration: Execute `/end-session`, verify Git commit created
- E2E: Full session workflow (start → travel → rest → end), verify all steps
- Performance: Measure command execution times, verify <targets

**AC-5 (VS Code UI):**
- Integration: Open Character Sheet Panel, verify data displays
- Integration: Modify character HP in file, verify panel auto-refreshes
- Manual: Visual inspection of all panels (layout, styling, functionality)
- Integration: Click location in tree view, verify navigation works

**AC-6 (Session Management):**
- Integration: Start session, verify current-session.yaml created
- Integration: Wait 5 minutes, verify auto-save triggered
- Integration: End session, verify session-history.yaml updated
- Unit: Test SessionLogger.generateSummary() output format

**AC-7 (Git Integration):**
- Integration: End session, verify Git commit with correct message format
- Integration: Create save point, verify Git tag created
- Integration: Rollback to save, verify files restored
- Integration: Simulate Git failure (no Git installed), verify graceful error

**AC-8 (Performance):**
- Performance: 10 session startups, calculate 95th percentile, verify <2 minutes
- Performance: 10 location transitions, verify <10 seconds average
- Stress: Load Castle Ravenloft (60+ rooms), verify context load <5 seconds
- Monitor: Analyze performance.log after 5-hour playtest, verify no degradation

**AC-9 (Markdown Styling):**
- Manual: View narrative in markdown preview, verify gothic theme
- Manual: Test clickable links (NPC names, items, locations)
- Manual: Verify fonts (serif for narrative, monospace for mechanics)

**AC-10 (Observability):**
- Integration: Execute session, verify performance.log entries
- Integration: Trigger error (corrupt file), verify error.log entry
- Integration: Execute `/debug performance`, verify output format
- Manual: Review session logs for completeness (NPCs, events, XP)

**AC-11 (Epic 1-4 Integration):**
- Regression: Run all Epic 1-4 test suites, verify 100% pass rate
- Integration: Execute `/rest`, verify Epic 2 calendar + Epic 3 spell recovery
- Integration: Execute `/travel`, verify Epic 2 event checks + Epic 1 state updates
- E2E: Play through full Death House dungeon, verify all systems work together

**Test Execution Schedule:**

| Phase | Tests Run | Frequency |
|-------|-----------|-----------|
| **Story Development** | Unit tests for current story | On every file save (Jest watch mode) |
| **Story Completion** | Unit + integration tests for story | Before marking story "ready-for-review" |
| **Story Review** | All Epic 5 tests | Before marking story "done" |
| **Epic Completion** | All tests (Epic 1-5) + E2E + Performance | Before marking Epic 5 "contexted → done" |
| **Pre-Release** | Full test suite + 10-hour playtest | Before publishing Epic 5 |

**Test Automation:**

- Unit and integration tests automated via Jest
- Performance tests semi-automated (run script, analyze performance.log)
- E2E tests manual (requires real VS Code + Claude Code)
- UI tests manual (visual inspection required)

**Definition of Done (Testing):**

- ✅ All unit tests passing (100%)
- ✅ All integration tests passing (100%)
- ✅ Coverage targets met (70%+ overall, 85%+ for ContextLoader/PromptTemplateEngine)
- ✅ Performance targets met (<2 min startup, <10s transitions, >75% cache hit)
- ✅ No regressions in Epic 1-4 test suites
- ✅ Manual UI review completed (all panels functional, styling correct)
- ✅ 5-hour playtest completed with no critical bugs (errors logged, not session-blocking)
