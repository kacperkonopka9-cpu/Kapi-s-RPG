# Epic Technical Specification: Core Engine & Location System (MVP Foundation)

Date: 2025-10-29
Author: Kapi
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 establishes the foundational architecture for Kapi-s-RPG, an LLM-powered D&D 5e solo RPG platform. This epic implements the core folder-based world system where each game location exists as a structured directory containing markdown files (Description.md, NPCs.md, Items.md, Events.md, State.md). The system loads location data into optimized LLM prompts, enabling Claude to act as Dungeon Master and generate immersive narrative responses. Basic VS Code slash commands provide the player interface for starting sessions, navigating locations, and persisting world state through Git version control. This MVP foundation enables a playable 2-hour session in the Village of Barovia with basic exploration and NPC interaction.

## Objectives and Scope

**In Scope:**
- ✅ Folder-based location architecture with standardized file structure (Description.md, NPCs.md, Items.md, Events.md, State.md, metadata.yaml)
- ✅ Location data parser that reads and validates location files
- ✅ Context loader module that builds optimized LLM prompts from location data with priority-based loading
- ✅ Basic VS Code slash commands: `/start-session`, `/look`, `/travel [location]`, `/end-session`
- ✅ LLM narrator integration with Claude API (system prompts, context injection, response handling)
- ✅ Simple navigation system allowing movement between connected locations
- ✅ Session logging to markdown files with timestamp and player actions
- ✅ Git auto-save creating commits at session end with descriptive messages
- ✅ 3-5 test locations: Village of Barovia, Death House, Tser Pool Encampment
- ✅ Basic NPC interaction (read NPC data, display to player, no dialogue system yet)
- ✅ Location state persistence (State.md updates saved between sessions)

**Out of Scope:**
- ❌ D&D 5e mechanics (dice rolling, combat, character sheets) → Epic 3
- ❌ Game calendar and time advancement → Epic 2
- ❌ Full Curse of Strahd content (30+ locations) → Epic 4
- ❌ Advanced LLM features (caching, optimization, prompt templates) → Epic 5
- ❌ NPC dialogue systems and conversation tracking
- ❌ Quest tracking and progression systems
- ❌ Combat encounters or initiative systems
- ❌ Inventory management
- ❌ Character creation or progression
- ❌ Advanced VS Code UI (sidebars, widgets, panels)

## System Architecture Alignment

**Architecture Document Reference:** `docs/technical-architecture.md` sections 2-7

**Core Components Implemented:**

1. **Folder-Based Location System** (Architecture §4)
   - Implements location folder structure exactly as specified in technical-architecture.md:564-602
   - Each location = directory with 6 required files (Description.md, NPCs.md, Items.md, Events.md, State.md, metadata.yaml)
   - Aligns with file specifications in Architecture §4.2 (Location File Specifications)

2. **Context Loading Strategy** (Architecture §6)
   - Implements priority-based context injection per Architecture §6.1
   - Priority 1: Description.md, State.md, character context (always loaded)
   - Priority 2: NPCs.md (active NPCs), Items.md (load if space)
   - Priority 3: Events.md (deferred to Epic 2)
   - Target: Keep context under 3000 tokens per Architecture §14.2

3. **VS Code Integration** (Architecture §7)
   - Implements basic slash commands from Architecture §7.1
   - File watchers for location file changes (Architecture §7.2)
   - Extension structure aligns with Architecture §12.2 (Project Structure)

4. **Git Version Control** (Architecture §10)
   - Implements auto-save commits per Architecture §10.1
   - Commit message format follows Architecture §10.1 specification
   - Save/load functionality uses Git branches per Architecture §10.2

**Architectural Constraints:**
- **File-First Design:** All game state stored in markdown/YAML files (no database)
- **Context Limits:** LLM prompts must stay under 4096 tokens (Claude API limit)
- **Separation of Concerns:** Location data separate from game logic
- **Human-Readable:** All data files must be editable in text editor
- **Git-Compatible:** File formats must work well with version control (plain text only)

**Technology Stack Alignment:**
- Node.js 18+ for game engine (Architecture §3.1)
- Claude API (Sonnet 4) for LLM-DM (Architecture §3.1)
- VS Code extension API for slash commands (Architecture §3.1)
- Markdown/YAML for data files (Architecture §3.1)
- Git for version control (Architecture §3.1)

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Owner/Location |
|--------|---------------|--------|---------|----------------|
| **LocationLoader** | Load and parse location files from disk | Location ID (string) | LocationData object | `src/data/location-loader.js` |
| **ContextBuilder** | Build LLM prompts from location data with priority-based loading | LocationData, CharacterData | LLMPrompt (string, <3000 tokens) | `src/core/context-loader.js` |
| **LLMNarrator** | Send prompts to Claude API and process responses | LLMPrompt, UserAction | NarrativeResponse (string) | `src/core/llm-narrator.js` |
| **SessionManager** | Manage game sessions (start, resume, end) | Session commands | Session state updates | `src/core/session-manager.js` |
| **NavigationHandler** | Handle location traversal and validation | Travel commands, current location | New location ID, validation errors | `src/core/navigation-handler.js` |
| **StateManager** | Update and persist State.md files | Location ID, state changes | Updated State.md file | `src/core/state-manager.js` |
| **GitIntegration** | Create auto-save commits | Session end trigger | Git commit hash | `src/utils/git-utils.js` |
| **FileWatcher** | Monitor location files for changes | File system events | Reload notifications | `src/utils/file-watcher.js` |
| **CommandRouter** | Route VS Code slash commands to handlers | Slash command string | Command execution | `.vscode/commands/router.js` |
| **SessionLogger** | Write session logs to markdown | Player actions, LLM responses | Log file (`logs/session-YYYY-MM-DD.md`) | `src/core/session-logger.js` |

**Module Dependencies:**
```
CommandRouter
  └─> SessionManager
      ├─> LocationLoader
      │   └─> FileWatcher
      ├─> ContextBuilder
      │   └─> LocationLoader
      ├─> LLMNarrator
      │   └─> ContextBuilder
      ├─> NavigationHandler
      │   └─> LocationLoader
      ├─> StateManager
      │   └─> FileWatcher
      └─> SessionLogger
          └─> GitIntegration
```

### Data Models and Contracts

**LocationData Schema:**
```javascript
{
  locationId: string,              // e.g., "village-of-barovia"
  locationName: string,            // e.g., "Village of Barovia"
  description: string,             // Full text from Description.md
  descriptionVariants: {
    initial: string,               // First visit
    return: string,                // Subsequent visits
    morning: string,               // Time-based (Epic 2)
    night: string                  // Time-based (Epic 2)
  },
  npcs: Array<NPCData>,           // Parsed from NPCs.md
  items: Array<ItemData>,         // Parsed from Items.md
  events: Array<EventData>,       // Parsed from Events.md (minimal in Epic 1)
  state: LocationState,           // Parsed from State.md
  metadata: LocationMetadata,     // Parsed from metadata.yaml
  filePaths: {
    description: string,
    npcs: string,
    items: string,
    events: string,
    state: string,
    metadata: string
  }
}
```

**NPCData Schema:**
```javascript
{
  npcId: string,                  // e.g., "ireena_kolyana"
  name: string,                   // e.g., "Ireena Kolyana"
  type: string,                   // e.g., "Human Noble"
  age: number,
  gender: string,
  currentLocation: string,        // Location ID
  status: string,                 // e.g., "Alive", "Dead", "Missing"
  attitudeTowardPlayer: string,   // e.g., "Neutral", "Friendly"
  questConnection: string,        // e.g., "Main Quest - Strahd's Obsession"
  description: string,            // Physical and personality
  dialogue: {
    initialGreeting: string,
    questHook: string,
    // More dialogue in Epic 5
  },
  stats: {                        // Basic stats for display
    ac: number,
    hp: number,
    cr: number                    // Challenge Rating
  },
  aiBehaviorNotes: string        // Guidelines for LLM
}
```

**LocationState Schema:**
```javascript
{
  locationId: string,
  lastUpdated: string,            // ISO timestamp
  currentDate: string,            // In-game date (Epic 2)
  currentTime: string,            // In-game time (Epic 2)
  weather: string,
  locationStatus: string,         // e.g., "Normal", "Damaged"
  changesSinceLastVisit: Array<string>,
  npcPositions: Map<string, string>,  // NPC ID -> sub-location
  activeQuests: Array<string>,
  customFlags: Object             // Epic-specific state flags
}
```

**LLMPrompt Schema:**
```javascript
{
  systemPrompt: string,           // DM persona and instructions
  context: {
    currentLocation: string,      // Description.md content
    locationState: string,        // State.md content
    visibleNPCs: Array<string>,   // NPC descriptions
    availableItems: string,       // Items.md (Priority 2)
    recentEvents: string          // Last 5 actions from session log
  },
  userAction: string,             // Player's command/input
  estimatedTokens: number,        // For monitoring
  priority: {
    p1: number,                   // Tokens used by Priority 1 items
    p2: number,                   // Tokens used by Priority 2 items
    p3: number                    // Tokens used by Priority 3 items (Epic 2)
  }
}
```

**SessionState Schema:**
```javascript
{
  sessionId: string,              // UUID
  startTime: string,              // ISO timestamp
  endTime: string,                // ISO timestamp (when session ends)
  currentLocationId: string,
  previousLocationId: string,
  actionsThisSession: Array<PlayerAction>,
  llmResponseCount: number,
  totalTokensUsed: number,
  gitCommitHash: string          // Populated on session end
}
```

**PlayerAction Schema:**
```javascript
{
  timestamp: string,              // ISO timestamp
  actionType: string,             // "travel", "look", "custom"
  actionText: string,             // User's command/input
  locationId: string,             // Where action occurred
  llmResponse: string,            // Generated narrative
  tokensUsed: number,
  durationMs: number              // Response time
}
```

### APIs and Interfaces

**LocationLoader API:**
```javascript
class LocationLoader {
  /**
   * Load complete location data from disk
   * @param {string} locationId - Location identifier (folder name)
   * @returns {Promise<LocationData>} Parsed location data
   * @throws {LocationNotFoundError} If location doesn't exist
   * @throws {LocationParseError} If files are malformed
   */
  async loadLocation(locationId: string): Promise<LocationData>

  /**
   * Validate location folder structure
   * @param {string} locationId - Location to validate
   * @returns {Promise<ValidationResult>} List of missing/invalid files
   */
  async validateLocation(locationId: string): Promise<ValidationResult>

  /**
   * Get all available location IDs
   * @returns {Promise<Array<string>>} List of valid location IDs
   */
  async listLocations(): Promise<Array<string>>

  /**
   * Reload location from disk (invalidate cache)
   * @param {string} locationId - Location to reload
   */
  async reloadLocation(locationId: string): Promise<LocationData>
}
```

**ContextBuilder API:**
```javascript
class ContextBuilder {
  /**
   * Build optimized LLM prompt from location and character data
   * @param {LocationData} location - Current location
   * @param {CharacterData} character - Player character (stub in Epic 1)
   * @param {Array<PlayerAction>} recentActions - Last 5 actions for context
   * @returns {LLMPrompt} Formatted prompt under token limit
   */
  buildPrompt(location, character, recentActions): LLMPrompt

  /**
   * Estimate token count for text
   * @param {string} text - Text to estimate
   * @returns {number} Approximate token count
   */
  estimateTokens(text: string): number

  /**
   * Get system prompt for DM persona
   * @returns {string} System prompt with DM instructions
   */
  getSystemPrompt(): string
}
```

**LLMNarrator API:**
```javascript
class LLMNarrator {
  /**
   * Send prompt to Claude API and get narrative response
   * @param {LLMPrompt} prompt - Formatted prompt
   * @returns {Promise<NarrativeResponse>} LLM-generated narrative
   * @throws {APIError} If Claude API fails
   * @throws {TokenLimitError} If prompt exceeds limits
   */
  async generateNarrative(prompt: LLMPrompt): Promise<NarrativeResponse>

  /**
   * Configure API settings
   * @param {Object} config - API configuration
   */
  configure(config: { apiKey, model, maxTokens, temperature })

  /**
   * Test API connection
   * @returns {Promise<boolean>} True if API is accessible
   */
  async testConnection(): Promise<boolean>
}
```

**SessionManager API:**
```javascript
class SessionManager {
  /**
   * Start new game session
   * @param {string} startingLocationId - Initial location
   * @returns {Promise<SessionState>} New session state
   */
  async startSession(startingLocationId: string): Promise<SessionState>

  /**
   * Resume previous session
   * @returns {Promise<SessionState>} Restored session state
   * @throws {NoSessionError} If no session to resume
   */
  async resumeSession(): Promise<SessionState>

  /**
   * End current session and trigger save
   * @returns {Promise<string>} Git commit hash
   */
  async endSession(): Promise<string>

  /**
   * Get current session state
   * @returns {SessionState} Current state or null
   */
  getCurrentSession(): SessionState

  /**
   * Record player action in session
   * @param {PlayerAction} action - Action to record
   */
  recordAction(action: PlayerAction): void
}
```

**NavigationHandler API:**
```javascript
class NavigationHandler {
  /**
   * Handle travel command
   * @param {string} targetLocationId - Destination location
   * @param {string} currentLocationId - Current location
   * @returns {Promise<NavigationResult>} Success/failure with messages
   */
  async travel(targetLocationId, currentLocationId): Promise<NavigationResult>

  /**
   * Get connected locations from current position
   * @param {string} locationId - Current location
   * @returns {Promise<Array<ConnectedLocation>>} Available destinations
   */
  async getConnectedLocations(locationId: string): Promise<Array<ConnectedLocation>>

  /**
   * Validate if travel is possible
   * @param {string} from - Current location
   * @param {string} to - Target location
   * @returns {Promise<boolean>} True if travel allowed
   */
  async canTravel(from: string, to: string): Promise<boolean>
}
```

**Command Signatures (VS Code Extension):**
```typescript
// Slash command definitions
commands: [
  {
    command: 'kapi-rpg.startSession',
    title: 'Start New Game Session',
    handler: startSessionHandler
  },
  {
    command: 'kapi-rpg.look',
    title: 'Look Around Current Location',
    handler: lookHandler
  },
  {
    command: 'kapi-rpg.travel',
    title: 'Travel to Location',
    handler: travelHandler,
    args: ['locationId']
  },
  {
    command: 'kapi-rpg.endSession',
    title: 'End Game Session',
    handler: endSessionHandler
  }
]
```

### Workflows and Sequencing

**Workflow 1: Start Session**
```
User: /start-session
  │
  ├─> CommandRouter receives command
  │
  ├─> SessionManager.startSession("village-of-barovia")
  │   │
  │   ├─> Create new SessionState (UUID, timestamp)
  │   ├─> Set currentLocationId = "village-of-barovia"
  │   └─> Return SessionState
  │
  ├─> LocationLoader.loadLocation("village-of-barovia")
  │   │
  │   ├─> Read Description.md, NPCs.md, Items.md, State.md, metadata.yaml
  │   ├─> Parse markdown/YAML into LocationData
  │   └─> Return LocationData
  │
  ├─> ContextBuilder.buildPrompt(location, null, [])
  │   │
  │   ├─> Build system prompt (DM persona)
  │   ├─> Add Priority 1: Description.md + State.md
  │   ├─> Add Priority 2: NPCs.md (if space allows)
  │   ├─> Estimate total tokens (< 3000)
  │   └─> Return LLMPrompt
  │
  ├─> LLMNarrator.generateNarrative(prompt)
  │   │
  │   ├─> Send to Claude API
  │   ├─> Wait for response
  │   └─> Return narrative description
  │
  ├─> SessionLogger.log(action)
  │   │
  │   ├─> Write to logs/session-2025-10-29.md
  │   └─> Record: timestamp, action="start", location, narrative
  │
  └─> Display narrative to user in VS Code
```

**Workflow 2: Travel Between Locations**
```
User: /travel tser-pool-encampment
  │
  ├─> CommandRouter.parseCommand("/travel tser-pool-encampment")
  │   └─> command="travel", target="tser-pool-encampment"
  │
  ├─> NavigationHandler.travel("tser-pool-encampment", "village-of-barovia")
  │   │
  │   ├─> Load current location metadata.yaml
  │   ├─> Check connected_locations list
  │   ├─> Validate "tser-pool-encampment" is connected
  │   └─> Return NavigationResult (success=true)
  │
  ├─> SessionManager.recordAction({
  │   actionType: "travel",
  │   actionText: "/travel tser-pool-encampment",
  │   locationId: "village-of-barovia"
  │ })
  │
  ├─> SessionManager.updateCurrentLocation("tser-pool-encampment")
  │
  ├─> LocationLoader.loadLocation("tser-pool-encampment")
  │   └─> Return new LocationData
  │
  ├─> ContextBuilder.buildPrompt(newLocation, null, recentActions)
  │   │
  │   ├─> Include "traveled from Village of Barovia" in context
  │   └─> Return LLMPrompt
  │
  ├─> LLMNarrator.generateNarrative(prompt)
  │   └─> Return narrative describing arrival
  │
  ├─> SessionLogger.log(action + response)
  │
  └─> Display narrative to user
```

**Workflow 3: Look Around (Get Location Description)**
```
User: /look
  │
  ├─> CommandRouter receives command
  │
  ├─> SessionManager.getCurrentSession()
  │   └─> Get currentLocationId
  │
  ├─> LocationLoader.loadLocation(currentLocationId)
  │   │
  │   ├─> Check FileWatcher for changes since last load
  │   ├─> If changed: reload from disk
  │   ├─> If unchanged: return cached LocationData
  │   └─> Return LocationData
  │
  ├─> ContextBuilder.buildPrompt(location, null, recentActions)
  │   │
  │   ├─> Use "return" description variant (not "initial")
  │   ├─> Add recent actions for context continuity
  │   └─> Return LLMPrompt
  │
  ├─> LLMNarrator.generateNarrative(prompt)
  │   └─> Return refreshed location description
  │
  ├─> SessionLogger.log(action + response)
  │
  └─> Display to user
```

**Workflow 4: End Session (Auto-Save)**
```
User: /end-session
  │
  ├─> CommandRouter receives command
  │
  ├─> SessionManager.endSession()
  │   │
  │   ├─> Get current SessionState
  │   ├─> Set endTime = now
  │   ├─> Calculate session duration
  │   └─> Return SessionState
  │
  ├─> SessionLogger.finalize()
  │   │
  │   ├─> Write session summary to log
  │   ├─> Close log file
  │   └─> Return log file path
  │
  ├─> GitIntegration.createAutoSave(sessionState)
  │   │
  │   ├─> Run: git add .
  │   ├─> Build commit message:
  │   │   "[AUTO-SAVE] Session 2025-10-29
  │   │    Location: Village of Barovia
  │   │    Duration: 45 minutes
  │   │    Actions: 12"
  │   ├─> Run: git commit -m "message"
  │   └─> Return commit hash
  │
  ├─> Display session summary to user:
  │   │
  │   ├─> Duration: 45 minutes
  │   ├─> Actions taken: 12
  │   ├─> Locations visited: 2
  │   ├─> Git commit: abc123def
  │   └─> Log file: logs/session-2025-10-29.md
  │
  └─> Clear session state
```

**Workflow 5: File Change Detection**
```
FileWatcher detects change to State.md
  │
  ├─> FileWatcher emits event: {
  │   file: "game-data/locations/village-of-barovia/State.md",
  │   event: "change"
  │ }
  │
  ├─> LocationLoader receives event
  │   │
  │   ├─> Extract locationId from file path
  │   ├─> Invalidate cache for "village-of-barovia"
  │   └─> Set needsReload flag
  │
  └─> Next LocationLoader.loadLocation() will read fresh data
      (Automatic - no user action needed)
```

**Error Handling Sequences:**

**Error: Location Not Found**
```
User: /travel invalid-location
  │
  ├─> NavigationHandler.travel("invalid-location", current)
  │   │
  │   ├─> LocationLoader.loadLocation("invalid-location")
  │   ├─> Throws LocationNotFoundError
  │   └─> Catch error
  │
  ├─> NavigationHandler formats error message:
  │   "Location 'invalid-location' not found.
  │    Available locations: village-of-barovia, tser-pool-encampment"
  │
  ├─> SessionLogger.log(error action)
  │
  └─> Display error to user (don't crash)
```

**Error: Claude API Failure**
```
LLMNarrator attempts API call
  │
  ├─> Claude API returns 503 error
  │
  ├─> LLMNarrator catches APIError
  │   │
  │   ├─> Log error details
  │   ├─> Check retry policy (max 3 retries with exponential backoff)
  │   └─> If all retries fail: throw with user message
  │
  ├─> SessionManager catches error
  │   │
  │   ├─> Display fallback message:
  │   │   "Unable to reach Dungeon Master (API error).
  │   │    Your session state has been preserved.
  │   │    Please try again in a moment."
  │   └─> Do NOT lose session state
  │
  └─> Allow user to retry command
```

## Non-Functional Requirements

### Performance

**Target Metrics (from Architecture §14.1):**

| Metric | Target | Measurement Method | Priority |
|--------|--------|-------------------|----------|
| **Session Start Time** | < 3 seconds | Time from `/start-session` to first LLM response | P0 - Critical |
| **Location Navigation** | < 1 second | Time from `/travel` command to location data loaded | P0 - Critical |
| **LLM Response Time** | < 5 seconds (95th percentile) | Claude API round-trip time | P1 - High |
| **File Read Operations** | < 100ms per location | Time to read and parse all 6 location files | P1 - High |
| **Memory Usage** | < 512 MB during session | Process memory consumption (Node.js) | P2 - Medium |
| **Context Token Budget** | < 3000 tokens | Token count for LLM prompts | P0 - Critical |

**Performance Requirements:**

1. **File I/O Optimization**
   - Use `Promise.all()` for parallel file reads (Architecture §14.2)
   - Implement 5-minute cache for location data (Architecture §14.2)
   - Lazy load Events.md (deferred to Epic 2)
   - Target: Load 3 location files simultaneously in < 300ms total

2. **Context Loading Efficiency**
   - Priority-based loading ensures critical data fits in budget
   - Token estimation using rough heuristic: 1 token ≈ 4 characters
   - Graceful degradation: If Priority 2 data exceeds budget, truncate or omit
   - Target: 95% of prompts stay under 3000 tokens

3. **LLM API Performance**
   - Use Claude Sonnet 4 (faster than Opus, cheaper than Haiku)
   - Set `max_tokens: 4096` for responses
   - Set `temperature: 0.7` for balanced creativity/consistency
   - Implement 3-retry policy with exponential backoff (1s, 2s, 4s)

4. **Caching Strategy**
   - Location data cached for 5 minutes (invalidated by FileWatcher)
   - No caching for LLM responses (each response unique to context)
   - Session state held in memory (no disk reads during session)

**Performance Monitoring:**
- Log all operations > 1 second to `logs/performance.log`
- Track token usage per prompt for cost optimization
- Measure session duration and action count for UX insights

**Related Architecture Sections:**
- Architecture §14.1: Performance Targets
- Architecture §14.2: Optimization Strategies
- Architecture §14.3: Monitoring and Profiling

### Security

**Authentication & Authorization:**
- **No user authentication required** - Single-player local game
- **File system permissions** - Rely on OS-level file access controls
- **No network exposure** - Only outbound HTTPS to Claude API

**API Key Protection (Architecture §15.1):**

1. **Storage:**
   - Store Claude API key in `.env` file (never committed to Git)
   - Add `.env` to `.gitignore` on project initialization
   - Use `dotenv` package to load environment variables

2. **Validation:**
   ```javascript
   const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
   if (!CLAUDE_API_KEY) {
     throw new Error('CLAUDE_API_KEY not found. Create .env file with API key.');
   }
   ```

3. **Key Rotation:**
   - Document API key rotation procedure in README
   - Support for multiple environment files (`.env.development`, `.env.production`)

**Data Handling:**
- **Local-First Design** - All game data stored locally, never transmitted except:
  - Location descriptions sent to Claude API as prompt context
  - LLM-generated narratives received from Claude API
- **No telemetry or analytics** - Zero data collection
- **No cloud backups** - Player controls all data (Architecture §15.3)

**Input Validation (Architecture §15.2):**

1. **Location ID Sanitization:**
   ```javascript
   // Prevent directory traversal attacks
   locationId = locationId.replace(/[^a-z0-9-_]/gi, '');
   if (locationId.includes('..') || locationId.includes('/')) {
     throw new Error('Invalid location ID');
   }
   ```

2. **File Path Validation:**
   ```javascript
   // Ensure paths stay within game-data directory
   const fullPath = path.join(GAME_DATA_DIR, 'locations', locationId);
   if (!fullPath.startsWith(GAME_DATA_DIR)) {
     throw new Error('Path traversal detected');
   }
   ```

3. **Command Input Sanitization:**
   - Validate slash command arguments match expected patterns
   - Limit input length to 1000 characters
   - No executable code injection (markdown/YAML parsing only)

**Threat Model:**
- **Low Risk** - Local single-player game with no network exposure
- **Primary Threat** - API key leakage (mitigated by .gitignore)
- **Secondary Threat** - Malicious location files (user controls all data)

**Related Architecture Sections:**
- Architecture §15.1: API Key Protection
- Architecture §15.2: Input Validation
- Architecture §15.3: Data Privacy

### Reliability/Availability

**Availability Target:**
- **99% uptime during development** - Occasional API outages acceptable
- **No SLA requirements** - Local single-player game
- **Graceful degradation** - Session state preserved across errors

**Failure Modes & Recovery:**

1. **Claude API Unavailable (503, timeout)**
   - **Detection:** HTTP error codes, request timeout (30s)
   - **Recovery:** 3 retries with exponential backoff (1s, 2s, 4s)
   - **Fallback:** Display error message, preserve session state, allow retry
   - **Impact:** Session paused until API returns

2. **Location File Missing/Corrupted**
   - **Detection:** File read error, YAML parse error
   - **Recovery:** Log error, display user-friendly message with file path
   - **Fallback:** Return to previous location if navigation fails
   - **Impact:** Cannot enter location until file fixed

3. **Git Commit Failure**
   - **Detection:** Git command returns non-zero exit code
   - **Recovery:** Retry once, then warn user but allow session to end
   - **Fallback:** Session log saved, but no Git commit created
   - **Impact:** Manual commit required, but no data loss

4. **Out of Memory**
   - **Detection:** Node.js heap limit exceeded
   - **Recovery:** Crash unavoidable, but session log on disk
   - **Fallback:** Resume previous session on restart
   - **Impact:** Current action lost, but world state preserved

5. **File System Full**
   - **Detection:** ENOSPC error on write operations
   - **Recovery:** Warn user to free disk space
   - **Fallback:** Read-only mode (can play, but no saves)
   - **Impact:** Cannot save state until space available

**Data Persistence Strategy:**
- **Continuous logging** - Every action written to session log immediately
- **Automatic saves** - Git commits on session end (not mid-session)
- **Manual saves** - Player can use `/save-game [name]` command (Epic 5)
- **No checkpoints** - Session state only in memory during play

**Error Handling Philosophy:**
- **Never crash silently** - Always display error to user
- **Never lose data** - Session state preserved in logs
- **Always allow retry** - Transient errors can be retried
- **Fail gracefully** - Degrade functionality rather than crash

**Related Architecture Sections:**
- Architecture §10: Git Version Control Strategy
- Architecture §14.3: Monitoring and Profiling

### Observability

**Logging Requirements:**

1. **Session Logs (Primary):**
   - **Location:** `logs/session-YYYY-MM-DD.md`
   - **Format:** Markdown with timestamps
   - **Content:**
     - Session start/end timestamps
     - Player actions (commands, inputs)
     - LLM responses (full narrative)
     - Location transitions
     - Errors and warnings
   - **Retention:** Indefinite (player's responsibility to archive)

2. **Performance Logs (Secondary):**
   - **Location:** `logs/performance.log`
   - **Format:** Plain text, one line per event
   - **Content:**
     - Operations exceeding 1 second threshold
     - Token usage per LLM prompt
     - File I/O timings
     - API response times
   - **Retention:** Last 1000 lines (rolling)

3. **Error Logs (Tertiary):**
   - **Location:** `logs/error.log`
   - **Format:** Plain text with stack traces
   - **Content:**
     - Exception type and message
     - Stack trace
     - Context (location, session ID, timestamp)
     - Recovery action taken
   - **Retention:** Last 500 errors (rolling)

**Logging Levels:**
- **DEBUG:** Verbose details (only in development mode)
- **INFO:** Normal operations (session start/end, location loads)
- **WARN:** Recoverable errors (API retries, missing optional files)
- **ERROR:** Unrecoverable errors (API failures, corrupt files)

**Metrics Collection:**

| Metric | Source | Purpose | Storage |
|--------|--------|---------|---------|
| **Session Duration** | SessionManager | Track play time | session-YYYY-MM-DD.md |
| **Actions Per Session** | SessionLogger | Engagement metric | session-YYYY-MM-DD.md |
| **Locations Visited** | SessionLogger | Content coverage | session-YYYY-MM-DD.md |
| **Token Usage** | LLMNarrator | Cost tracking | performance.log |
| **LLM Response Time** | LLMNarrator | Performance monitoring | performance.log |
| **File Load Time** | LocationLoader | I/O performance | performance.log |
| **Error Count** | All modules | Stability tracking | error.log |

**Tracing:**
- **No distributed tracing** - Single-process application
- **Request IDs** - Each player action gets unique ID for log correlation
- **Session IDs** - UUID for each session links all related logs

**Monitoring Dashboard:**
- **No real-time dashboard in Epic 1** - Manual log review only
- **Future Enhancement (Epic 5):** VS Code panel showing session stats

**Debug Mode:**
- Enable via environment variable: `DEBUG=true`
- Activates verbose logging (all operations logged)
- Displays token counts and API timings in console
- Shows file paths and data structures

**Log Format Example:**
```markdown
# Session Log: 2025-10-29

**Session ID:** 550e8400-e29b-41d4-a716-446655440000
**Start Time:** 2025-10-29T14:30:00Z
**End Time:** 2025-10-29T15:15:00Z
**Duration:** 45 minutes

## Actions

### 14:30:00 - Start Session
- **Action:** /start-session
- **Location:** village-of-barovia
- **Tokens Used:** 2847
- **Response Time:** 3.2s
- **Narrative:** [Full LLM response]

### 14:35:12 - Travel
- **Action:** /travel tser-pool-encampment
- **From:** village-of-barovia
- **To:** tser-pool-encampment
- **Tokens Used:** 2901
- **Response Time:** 2.8s
- **Narrative:** [Full LLM response]

### 14:42:33 - Look Around
- **Action:** /look
- **Location:** tser-pool-encampment
- **Tokens Used:** 2654
- **Response Time:** 2.5s
- **Narrative:** [Full LLM response]

## Session Summary
- **Total Actions:** 12
- **Locations Visited:** 2
- **Total Tokens Used:** 34,582
- **Git Commit:** abc123def456789
```

**Related Architecture Sections:**
- Architecture §14.3: Monitoring and Profiling
- Architecture §10.1: Git Commit Message Format

## Dependencies and Integrations

**External Dependencies:**

| Dependency | Version | Purpose | Source | License |
|------------|---------|---------|--------|---------|
| **Node.js** | 18+ | Runtime environment | https://nodejs.org | MIT |
| **@anthropic-ai/sdk** | ^0.30.0 | Claude API client | npm | MIT |
| **yaml** | ^2.3.4 | YAML parsing | npm | ISC |
| **dotenv** | ^16.3.1 | Environment variable loading | npm | BSD-2-Clause |
| **marked** | ^11.0.0 | Markdown parsing (optional) | npm | MIT |
| **chokidar** | ^3.5.3 | File watching | npm | MIT |

**Development Dependencies:**

| Dependency | Version | Purpose | Source |
|------------|---------|---------|--------|
| **jest** | ^29.7.0 | Testing framework | npm |
| **nodemon** | ^3.0.2 | Development server | npm |
| **eslint** | ^8.56.0 | Code linting | npm |
| **prettier** | ^3.1.1 | Code formatting | npm |

**System Dependencies:**

| Dependency | Version | Purpose | Availability |
|------------|---------|---------|--------------|
| **Git** | 2.x+ | Version control and save system | Pre-installed (assumed) |
| **VS Code** | Latest stable | Game interface | Required (user must install) |

**API Integrations:**

**Claude API (Anthropic):**
- **Purpose:** LLM-powered Dungeon Master narrative generation
- **Endpoint:** `https://api.anthropic.com/v1/messages`
- **Authentication:** Bearer token (API key in .env)
- **Model:** `claude-sonnet-4-20250514`
- **Rate Limits:**
  - 50 requests per minute (Tier 1)
  - 10,000 tokens per minute input
  - 40,000 tokens per minute output
- **Cost:** ~$3 per million input tokens, ~$15 per million output tokens
- **Documentation:** https://docs.anthropic.com/claude/reference
- **Error Handling:** 3 retries with exponential backoff

**Internal Integrations:**

1. **VS Code Extension API:**
   - Purpose: Slash command handling
   - Integration Point: `.vscode/extension.js`
   - Communication: VS Code commands API
   - Documentation: https://code.visualstudio.com/api

2. **Node.js File System API:**
   - Purpose: Read/write location files
   - Integration Point: `src/data/location-loader.js`
   - Communication: `fs.promises` (async file operations)

3. **Node.js Child Process API:**
   - Purpose: Execute Git commands
   - Integration Point: `src/utils/git-utils.js`
   - Communication: `child_process.exec()` for Git CLI

**File System Structure (Integration Points):**

```
kapi-s-rpg/
├── game-data/              # Location data (READ by Epic 1)
│   └── locations/
│       ├── village-of-barovia/
│       ├── tser-pool-encampment/
│       └── death-house/
├── logs/                   # Session logs (WRITE by Epic 1)
│   ├── session-2025-10-29.md
│   ├── performance.log
│   └── error.log
├── .env                    # API keys (READ by Epic 1)
└── .git/                   # Version control (READ/WRITE by Epic 1)
```

**Configuration Files:**

1. **`.env` (Required):**
   ```
   CLAUDE_API_KEY=sk-ant-xxxxx
   CLAUDE_MODEL=claude-sonnet-4-20250514
   MAX_TOKENS=4096
   TEMPERATURE=0.7
   ```

2. **`package.json` (Generated):**
   - Defines all npm dependencies
   - Defines npm scripts (`start`, `dev`, `test`)
   - See Architecture §12.4 for complete example

3. **`.gitignore` (Required):**
   ```
   node_modules/
   .env
   .env.local
   logs/performance.log
   logs/error.log
   .DS_Store
   ```

**Dependency Installation:**
```bash
# Install production dependencies
npm install @anthropic-ai/sdk yaml dotenv marked chokidar

# Install development dependencies
npm install --save-dev jest nodemon eslint prettier
```

**Version Pinning Strategy:**
- **Exact versions** for critical dependencies (@anthropic-ai/sdk)
- **Caret (^) versions** for stable libraries (yaml, dotenv)
- **No wildcards** - Reproducible builds required

**Security Scanning:**
- Run `npm audit` before each release
- Update dependencies quarterly
- No known vulnerabilities in chosen packages (as of 2025-10-29)

**Related Architecture Sections:**
- Architecture §3.1: Technology Stack
- Architecture §12.4: Configuration Files

## Acceptance Criteria (Authoritative)

**Source:** GDD Epic 1, Architecture §11.1

These are the authoritative acceptance criteria that must be met for Epic 1 to be considered complete:

### AC-1: Location Folder Structure
**Given** the game-data/locations directory exists
**When** I create a new location
**Then** the location folder must contain exactly 6 files: Description.md, NPCs.md, Items.md, Events.md, State.md, metadata.yaml
**And** each file must be parseable (valid markdown/YAML)
**And** files must follow the specifications in Architecture §4.2

**Verification Method:** Automated validation script checks all location folders

### AC-2: Location Data Loading
**Given** a valid location folder exists (e.g., "village-of-barovia")
**When** LocationLoader.loadLocation("village-of-barovia") is called
**Then** all 6 files must be read from disk
**And** content must be parsed into LocationData object
**And** operation must complete in < 100ms
**And** LocationData object must match schema defined in this spec

**Verification Method:** Unit tests + integration tests with real location files

### AC-3: Context Builder Token Budget
**Given** a loaded LocationData object
**When** ContextBuilder.buildPrompt() is called
**Then** the resulting LLMPrompt must contain < 3000 tokens
**And** Priority 1 items (Description.md, State.md) must always be included
**And** Priority 2 items (NPCs.md, Items.md) must be included if space allows
**And** token estimation must be within ±10% of actual token count

**Verification Method:** Unit tests with various location sizes, manual testing with Claude API

### AC-4: Start Session Command
**Given** the game is not currently in a session
**When** user executes `/start-session`
**Then** a new SessionState must be created with unique UUID
**And** currentLocationId must be set to "village-of-barovia"
**And** location data must be loaded
**And** LLM must generate initial narrative description
**And** narrative must be displayed to user in VS Code
**And** entire operation must complete in < 3 seconds
**And** session log must be created at logs/session-YYYY-MM-DD.md

**Verification Method:** Manual testing + integration tests

### AC-5: Travel Between Locations
**Given** an active session at location A
**When** user executes `/travel location-b`
**Then** system must validate location-b exists
**And** system must validate location-b is connected to location A (check metadata.yaml)
**And** if valid: currentLocationId must update to location-b
**And** if valid: location-b data must be loaded
**And** if valid: LLM must generate arrival narrative
**And** if invalid: user-friendly error message must display
**And** travel action must be logged to session log
**And** entire operation must complete in < 1 second (excluding LLM call)

**Verification Method:** Manual testing with valid/invalid locations + unit tests

### AC-6: Look Command
**Given** an active session at any location
**When** user executes `/look`
**Then** current location data must be reloaded from disk
**And** LLM must generate refreshed location description
**And** narrative must be displayed to user
**And** action must be logged to session log
**And** operation must complete in < 5 seconds total

**Verification Method:** Manual testing + integration tests

### AC-7: End Session with Auto-Save
**Given** an active session with N actions taken
**When** user executes `/end-session`
**Then** session endTime must be recorded
**And** session summary must be written to log file
**And** Git auto-save must create commit with format:
```
[AUTO-SAVE] Session YYYY-MM-DD
Location: [current location]
Duration: [X minutes]
Actions: [N]
```
**And** commit hash must be displayed to user
**And** session state must be cleared from memory
**And** entire operation must complete in < 5 seconds

**Verification Method:** Manual testing + verify Git commit created with correct message

### AC-8: LLM Narrator Integration
**Given** a valid LLMPrompt with < 3000 tokens
**When** LLMNarrator.generateNarrative() is called
**Then** prompt must be sent to Claude API (claude-sonnet-4-20250514)
**And** system prompt must include DM persona from Architecture §6.2
**And** context must include current location description and state
**And** API response must be returned as NarrativeResponse
**And** 95% of responses must complete in < 5 seconds
**And** if API fails: 3 retries with exponential backoff (1s, 2s, 4s)
**And** if all retries fail: user-friendly error message without losing session state

**Verification Method:** Integration tests with Claude API + error injection tests

### AC-9: File Watcher Reload
**Given** an active session with location data loaded and cached
**When** any location file (Description.md, NPCs.md, etc.) is modified externally
**Then** FileWatcher must detect the change
**And** LocationLoader cache must be invalidated for that location
**And** next loadLocation() call must read fresh data from disk
**And** no manual intervention required from user

**Verification Method:** Integration test with manual file edit during session

### AC-10: Test Locations Playable
**Given** 3-5 test locations created (Village of Barovia, Death House, Tser Pool)
**When** player starts session and navigates between locations
**Then** all locations must have complete, valid data files
**And** locations must be connected via metadata.yaml
**And** LLM must generate coherent, immersive narratives for each
**And** player can complete 2-hour play session navigating all test locations
**And** world state persists correctly across session end/resume

**Verification Method:** End-to-end playtest session

### AC-11: Session Logging Complete
**Given** any player action during a session
**When** action is executed (start, travel, look, end)
**Then** action must be logged to logs/session-YYYY-MM-DD.md
**And** log entry must include: timestamp, action type, location, LLM response, tokens used
**And** log file must be valid markdown
**And** log must be written immediately (not buffered until session end)

**Verification Method:** Inspect log file after session

### AC-12: State Persistence Across Sessions
**Given** a completed session with world state changes
**When** session ends and Git commit is created
**And** new session starts later
**Then** all location State.md files must reflect previous session changes
**And** session log must be preserved
**And** player can resume from exact world state where they left off

**Verification Method:** Multi-session playtest with state verification

## Traceability Mapping

| AC ID | Requirement Source | Spec Section | Components | Test Approach |
|-------|-------------------|--------------|------------|---------------|
| **AC-1** | Architecture §4.2 | Detailed Design → Services and Modules | LocationLoader | Unit test: validate-location.test.js |
| **AC-2** | Architecture §4.2 | Detailed Design → APIs (LocationLoader) | LocationLoader, FileWatcher | Integration test: location-loader.test.js |
| **AC-3** | Architecture §6.1, §14.2 | NFR Performance, Detailed Design → APIs (ContextBuilder) | ContextBuilder | Unit test: context-builder.test.js |
| **AC-4** | GDD Epic 1, Architecture §11.1 | Detailed Design → Workflows (Start Session) | SessionManager, LocationLoader, ContextBuilder, LLMNarrator, SessionLogger | Integration test: start-session.test.js |
| **AC-5** | GDD Epic 1, Architecture §11.1 | Detailed Design → Workflows (Travel) | NavigationHandler, LocationLoader, SessionManager, LLMNarrator | Integration test: navigation.test.js |
| **AC-6** | GDD Epic 1 | Detailed Design → Workflows (Look) | LocationLoader, ContextBuilder, LLMNarrator, FileWatcher | Integration test: look-command.test.js |
| **AC-7** | Architecture §10.1, §11.1 | Detailed Design → Workflows (End Session), NFR Reliability | SessionManager, SessionLogger, GitIntegration | Integration test: end-session.test.js |
| **AC-8** | Architecture §6.2, §14.2 | NFR Performance, Detailed Design → APIs (LLMNarrator) | LLMNarrator, ContextBuilder | Integration test: llm-narrator.test.js + manual API testing |
| **AC-9** | Architecture §7.2 | Detailed Design → Workflows (File Change), Detailed Design → APIs (FileWatcher) | FileWatcher, LocationLoader | Integration test: file-watcher.test.js |
| **AC-10** | GDD Epic 1, Architecture §11.1 | In Scope (Test Locations) | All components | End-to-end test: playthrough.test.js + manual playtest |
| **AC-11** | Architecture §15.4 (Observability) | NFR Observability, Detailed Design → Services (SessionLogger) | SessionLogger | Integration test: session-logger.test.js |
| **AC-12** | Architecture §10.1 | NFR Reliability, In Scope (State Persistence) | StateManager, GitIntegration, SessionManager | End-to-end test: state-persistence.test.js |

**Coverage Analysis:**
- **10 modules** defined → All covered by acceptance criteria
- **6 workflows** defined → All covered (Start, Travel, Look, End, File Change, Error Handling)
- **4 NFR categories** → All covered (Performance: AC-2,3,4,6,8; Security: implicitly covered; Reliability: AC-7,12; Observability: AC-11)
- **GDD Epic 1 goals** → Complete coverage (location system, navigation, LLM integration, persistence)

## Risks, Assumptions, Open Questions

### Risks

**R-1: Claude API Rate Limiting (HIGH)**
- **Description:** Epic 1 testing may hit Claude API rate limits (50 req/min, 10K tokens/min input)
- **Impact:** Test suite failures, development delays, increased API costs during testing
- **Mitigation:**
  - Implement API call throttling in tests
  - Use mock LLM responses for unit tests (only integration tests hit real API)
  - Monitor token usage during development
  - Consider Claude API tier upgrade if needed
- **Owner:** Developer

**R-2: Token Budget Exceeded for Large Locations (MEDIUM)**
- **Description:** Some locations may have very long descriptions or many NPCs, exceeding 3000 token budget
- **Impact:** Context truncation, important data excluded from LLM prompt, degraded narrative quality
- **Mitigation:**
  - Test with largest expected location (Castle Ravenloft)
  - Implement smart truncation (summarize instead of omit)
  - Add warning in logs when truncation occurs
  - Consider splitting mega-locations into sub-locations
- **Owner:** Architect + Developer

**R-3: VS Code Extension API Learning Curve (MEDIUM)**
- **Description:** Developer may lack experience with VS Code extension development
- **Impact:** Delays in implementing slash commands, potential bugs in command routing
- **Mitigation:**
  - Start with minimal extension (4 commands only)
  - Use VS Code extension samples as reference
  - Timebox extension work to 1 week max
  - Fall back to CLI commands if extension proves too complex
- **Owner:** Developer

**R-4: File I/O Performance on Slow Disks (LOW)**
- **Description:** 100ms per location target may not be achievable on HDD or network drives
- **Impact:** Session start >3s, poor user experience
- **Mitigation:**
  - Test on target hardware (SSD assumed)
  - Implement caching to minimize disk reads
  - Document minimum system requirements (SSD recommended)
- **Owner:** Developer

**R-5: Git Command Availability (LOW)**
- **Description:** Git may not be installed or not in PATH on user's system
- **Impact:** Auto-save fails, session ends without commit
- **Mitigation:**
  - Validate Git presence on first session start
  - Display clear error message with installation instructions
  - Fall back to file-only saves without Git
  - Document Git as required dependency
- **Owner:** Developer

### Assumptions

**A-1: D&D 5e Knowledge**
- Player has 3+ years D&D 5e experience (per GDD §Assumptions)
- Player familiar with Curse of Strahd campaign
- No in-game rules tutorials needed in Epic 1

**A-2: Development Environment**
- Developer has Windows/macOS/Linux with Node.js 18+ installed
- Developer has VS Code installed and configured
- Developer has Claude API access (API key available)
- Developer has Git installed and configured

**A-3: API Costs Acceptable**
- ~$20-50/month API costs acceptable for development and playtesting
- Epic 1 testing will consume ~10K-20K tokens (~$0.30-$0.60)
- Production gameplay ~$3-5 per 10-hour campaign

**A-4: LLM Consistency**
- Claude Sonnet 4 generates sufficiently consistent narratives
- No fine-tuning or custom models required
- System prompt alone provides adequate DM persona
- Quality validation by manual playtesting

**A-5: Single-Player Only**
- No multiplayer features in Epic 1 (confirmed in GDD §Out of Scope)
- No concurrency issues with file access
- Session state can be held in memory without shared state concerns

**A-6: Test Location Content Available**
- Developer has access to Curse of Strahd book (confirmed in GDD §Dependencies)
- Sufficient detail in book to create 3-5 test locations
- Location content can be manually authored in Epic 1 (automation in Epic 4)

### Open Questions

**Q-1: LLM Prompt Template Standardization**
- **Question:** Should we define strict prompt templates in Epic 1 or defer to Epic 5?
- **Options:**
  - A) Basic system prompt in Epic 1, advanced templates in Epic 5
  - B) Comprehensive prompt engineering in Epic 1
- **Impact:** Affects narrative quality and Epic 1 scope
- **Decision Needed By:** Start of Story 1-5 (LLM Narrator Integration)
- **Recommendation:** Option A (minimal viable prompts in Epic 1)

**Q-2: FileWatcher Polling vs Native**
- **Question:** Use filesystem events (native) or polling for file watching?
- **Options:**
  - A) Native fs.watch() - fast but platform-specific behavior
  - B) Polling with chokidar library - slower but consistent cross-platform
- **Impact:** Performance vs reliability tradeoff
- **Decision Needed By:** Start of Story 1-2 (Location Data Parser)
- **Recommendation:** Option B (chokidar for consistency, acceptable 200ms latency)

**Q-3: Session Resume Strategy**
- **Question:** How should session resume work if player exits without `/end-session`?
- **Options:**
  - A) Auto-save on crash/exit, always resumable
  - B) Only manual saves via `/end-session`, no auto-recovery
  - C) Periodic auto-save every N actions
- **Impact:** Data loss risk vs complexity
- **Decision Needed By:** Start of Story 1-4 (Basic Slash Commands)
- **Recommendation:** Option B for Epic 1 (simplicity), Option C in Epic 5

**Q-4: Error Message Verbosity**
- **Question:** How detailed should error messages be for end users?
- **Options:**
  - A) Technical errors with stack traces (developer-friendly)
  - B) User-friendly messages with troubleshooting hints
  - C) Both: user message + link to detailed log
- **Impact:** User experience vs debuggability
- **Decision Needed By:** Throughout Epic 1 implementation
- **Recommendation:** Option C (best of both worlds)

**Q-5: Test Location Scope**
- **Question:** How complete should 3-5 test locations be?
- **Options:**
  - A) Minimal stubs (Description.md only)
  - B) Partial content (Description + NPCs, minimal Items/Events)
  - C) Full content (all 6 files completely populated)
- **Impact:** Epic 1 effort vs Epic 4 rework
- **Decision Needed By:** Start of Story 1-9 (Test Locations Setup)
- **Recommendation:** Option B (sufficient for testing, avoids premature Epic 4 work)

## Test Strategy Summary

### Test Levels

**Unit Tests (70% coverage goal):**
- **Scope:** Individual modules in isolation
- **Framework:** Jest
- **Mocking:** Mock file system, Claude API, Git commands
- **Files:**
  - `tests/data/location-loader.test.js` - LocationLoader with mock filesystem
  - `tests/core/context-builder.test.js` - ContextBuilder with sample data
  - `tests/core/session-manager.test.js` - SessionManager with mocked dependencies
  - `tests/utils/git-utils.test.js` - GitIntegration with mocked child_process
- **Focus:**
  - Data parsing correctness
  - Token estimation accuracy
  - Error handling for invalid inputs
  - Edge cases (empty files, malformed YAML)

**Integration Tests (20% coverage goal):**
- **Scope:** Module interactions with real dependencies
- **Framework:** Jest with real file I/O, mocked Claude API
- **Setup:** Create temporary test directories with sample locations
- **Files:**
  - `tests/integration/start-session.test.js` - Full session start workflow
  - `tests/integration/navigation.test.js` - Travel command end-to-end
  - `tests/integration/file-watcher.test.js` - File change detection
  - `tests/integration/llm-narrator.test.js` - Real Claude API calls (rate-limited)
- **Focus:**
  - Workflow correctness (Start → Travel → Look → End)
  - File I/O performance (meet <100ms targets)
  - Cache invalidation
  - Git commit creation

**End-to-End Tests (10% coverage goal):**
- **Scope:** Complete user workflows via VS Code extension
- **Framework:** Manual testing + automated playthrough script
- **Files:**
  - `tests/e2e/playthrough.test.js` - Automated multi-action session
  - `tests/e2e/state-persistence.test.js` - Multi-session continuity
- **Focus:**
  - User experience (command responsiveness)
  - Narrative quality (manual review)
  - State persistence across sessions
  - Error recovery scenarios

### Test Data

**Sample Locations (for testing):**
```
tests/fixtures/locations/
├── test-village/          # Small location (minimal content)
│   ├── Description.md     # 500 characters
│   ├── NPCs.md           # 2 NPCs
│   ├── Items.md          # 3 items
│   ├── Events.md         # 1 event
│   ├── State.md          # Basic state
│   └── metadata.yaml     # Connected to test-forest
├── test-forest/          # Medium location
│   └── [similar structure]
└── test-mega-dungeon/    # Large location (stress test)
    ├── Description.md    # 2000 characters
    ├── NPCs.md          # 10 NPCs
    └── [etc.]
```

**Mock LLM Responses:**
- Predefined narrative responses for unit tests
- Avoid hitting Claude API during unit tests (cost + speed)
- Integration tests use real API (rate-limited, run nightly)

### Test Execution

**Local Development:**
```bash
npm test              # Run all tests
npm run test:unit     # Unit tests only (fast)
npm run test:int      # Integration tests (slower)
npm run test:e2e      # End-to-end tests (manual + automated)
npm run test:watch    # Watch mode for TDD
```

**CI Pipeline (Future):**
- Run unit tests on every commit
- Run integration tests on PR merge
- Run E2E tests nightly (due to API costs)

### Coverage Targets

| Test Type | Target | Rationale |
|-----------|--------|-----------|
| **Unit Tests** | 95% for rules/data modules | High confidence in parsing and logic |
| **Integration Tests** | 80% for workflows | Validate module interactions |
| **End-to-End Tests** | Manual playtest of all ACs | Validate user experience |

### Test Scenarios by AC

- **AC-1, AC-2:** Unit + Integration tests for LocationLoader
- **AC-3:** Unit tests for ContextBuilder with various location sizes
- **AC-4, AC-5, AC-6, AC-7:** Integration tests for each workflow
- **AC-8:** Integration tests with real Claude API + error injection
- **AC-9:** Integration tests with FileWatcher
- **AC-10:** End-to-end manual playtest
- **AC-11:** Integration tests for SessionLogger
- **AC-12:** End-to-end multi-session test

### Edge Cases to Test

1. **Empty location files** - Should handle gracefully
2. **Malformed YAML** - Should display clear error message
3. **Missing location folder** - Should return user-friendly error
4. **Token budget exceeded** - Should truncate Priority 2 data
5. **Claude API timeout** - Should retry 3 times then fail gracefully
6. **Git not installed** - Should detect and warn user
7. **Disk full** - Should warn and enter read-only mode
8. **Very long session (100+ actions)** - Should not crash or slow down
9. **Rapid location changes** - Should not cache stale data
10. **Concurrent file edits** - Should detect and reload

### Performance Testing

**Load Testing:**
- Session with 50 location loads - measure memory usage
- LLM prompt with 2900 tokens - verify <3000 limit
- 100 consecutive actions - verify no memory leaks

**Benchmark Targets:**
- Session start: < 3 seconds (AC-4)
- Location load: < 100ms (AC-2)
- Travel command: < 1 second excluding LLM (AC-5)

### Manual Testing Checklist

Before Epic 1 sign-off:
- [ ] Install on fresh system (validate setup instructions)
- [ ] Complete 2-hour playthrough session
- [ ] Test all 4 slash commands (/start-session, /travel, /look, /end-session)
- [ ] Verify Git commits created correctly
- [ ] Edit location file during session, verify reload
- [ ] Kill process mid-session, verify recovery
- [ ] Test with slow network (Claude API latency)
- [ ] Test error scenarios (missing files, invalid data)
- [ ] Verify session logs readable and complete
- [ ] Review LLM narrative quality (immersive? consistent?)

### Definition of Done

Epic 1 is complete when:
✅ All 12 acceptance criteria verified passing
✅ Unit test coverage ≥ 95% for core modules
✅ Integration tests passing for all workflows
✅ Manual playtest completed successfully
✅ All P0/P1 performance targets met
✅ No critical bugs remaining
✅ Documentation complete (README, API docs)
✅ Code reviewed and merged
