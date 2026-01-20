# Slash Commands Guide

Comprehensive reference for Kapi's RPG DM Assistant slash commands.

## Table of Contents

1. [Session Commands](#session-commands)
2. [Navigation Commands](#navigation-commands)
3. [Context Management Commands](#context-management-commands)
4. [UI Panels and Tree Views](#ui-panels-and-tree-views)
5. [Error Messages](#error-messages)
6. [Troubleshooting](#troubleshooting)
7. [Performance Expectations](#performance-expectations)

## Session Commands

### /start-session

Initialize a new gameplay session.

**Syntax:**
```
/start-session [location] [character]
```

**Arguments:**
- `location` (required): Location ID from `game-data/locations/`
- `character` (required): Character file name (without `.yaml` extension)

**Examples:**
```
/start-session village-of-barovia kapi
/start-session death-house strahd-hunter
/start-session vallaki ireena
```

**What it does:**
1. Validates character file exists and has required fields (name, level, class, hp)
2. Validates location exists in game data
3. Loads context for the starting location (Story 5-1)
4. Renders initial narration using template engine (Story 5-3)
5. Creates `game-data/session/current-session.yaml` with session state
6. Displays session start confirmation with context metadata

**Output:**
- Character information (name, level, class)
- Location name
- Current date/time
- Context metadata (token count, NPCs loaded, events loaded, quests loaded)
- Performance metrics
- Initial location narration

**Performance:** <2 minutes (95th percentile)

**Error Messages:**
- `Character file not found: [character].yaml` - Character file doesn't exist
- `Character file missing required fields: [fields]` - Character YAML incomplete
- `Location not found: [location]` - Location directory doesn't exist
- `Failed to load context: [error]` - Context loading failed (Story 5-1 issue)
- `Failed to render narration: [error]` - Template engine failed (Story 5-3 issue)

---

### /end-session

End the current gameplay session and generate session summary.

**Syntax:**
```
/end-session [summary]
```

**Arguments:**
- `summary` (optional): Player-provided session summary text

**Examples:**
```
/end-session
/end-session "Great session! Defeated the vampire spawn and rescued Ireena."
```

**What it does:**
1. Loads current session state from `current-session.yaml`
2. Generates session summary using SessionLogger (stub in Story 5-4, full in Story 5-6)
3. Saves session log to `game-data/session/logs/YYYY-MM-DD-session-N.md`
4. Creates Git commit using GitIntegration (stub in Story 5-4, full in Story 5-6)
5. Updates `session-history.yaml` with session metadata
6. Deletes `current-session.yaml` to mark session as ended

**Output:**
- Session duration
- Character information
- Locations visited count
- NPCs encountered count
- NPCs interacted with count
- XP gained (not yet tracked - Epic 3 future enhancement)
- Session log file name
- Git commit hash
- Performance metrics

**Performance:** <30 seconds

**Error Messages:**
- `No active session found. Start a session first with /start-session` - No current-session.yaml exists

---

### /save

Create a named save point (Git tag) for the current game state.

**Syntax:**
```
/save [save-name]
```

**Arguments:**
- `save-name` (required): Name for the save point (will be sanitized to lowercase alphanumeric + hyphens/underscores)

**Examples:**
```
/save pre-strahd-confrontation
/save before-death-house
/save vallaki-festival
```

**What it does:**
1. Validates save name is provided
2. Sanitizes save name (removes special characters, converts to lowercase)
3. Creates annotated Git tag: `save/{save-name}`
4. Tag message includes: current location, character level, date/time
5. If Git is not available, gracefully fails with warning

**Output:**
- Save point name (`save/pre-strahd-confrontation`)
- Current location
- Character level
- Creation timestamp
- Git tag creation status

**Performance:** <2 seconds

**Error Messages:**
- `Save name is required` - No save name provided
- `Save point already exists: [name]` - Tag with that name already exists
- `Git not available: [error]` - Git is not installed or not a repository

**Notes:**
- Save names are automatically prefixed with `save/` in Git
- Special characters are replaced with hyphens
- Example: `"Pre-Strahd Fight!"` becomes `save/pre-strahd-fight-`
- Save points can be viewed with `git tag -l "save/*"`

---

### /load-save

Restore game state to a previous save point.

**Syntax:**
```
/load-save
```

**Arguments:**
- None (interactive selection via VS Code Quick Pick)

**Examples:**
```
/load-save
```

**What it does:**
1. Retrieves list of all save points (Git tags starting with `save/`)
2. Displays Quick Pick menu with save point names, dates, and descriptions
3. User selects save point from menu
4. Confirms destructive operation (current progress will be lost)
5. Checks out selected Git tag (`git checkout save/{name}`)
6. Restores all game files to that save point state

**Output:**
- List of available save points with metadata
- Confirmation prompt
- Rollback success/failure message

**Performance:** <5 seconds

**Error Messages:**
- `No save points found` - No Git tags starting with `save/`
- `Git not available: [error]` - Git is not installed or not a repository
- `Rollback cancelled by user` - User declined confirmation
- `Failed to checkout save point: [error]` - Git checkout failed

**⚠️ Warning:**
- This operation is **destructive**
- Any progress after the selected save point will be lost
- Unsaved changes will be overwritten
- Consider creating a backup save point before loading an old one

---

## Navigation Commands

### /travel

Travel to a connected location.

**Syntax:**
```
/travel [destination]
```

**Arguments:**
- `destination` (required): Location ID to travel to (must be in current location's connections)

**Examples:**
```
/travel death-house
/travel vallaki
/travel castle-ravenloft
```

**What it does:**
1. Loads current session state to get current location
2. Loads current location's metadata.yaml to validate destination in connections list
3. Retrieves travel time from metadata (default: 1 hour)
4. Advances calendar using CalendarManager (Epic 2 integration)
5. Checks for triggered events using EventScheduler (Epic 2 integration)
6. If encounter triggered: executes encounter (simplified in Story 5-4)
7. Updates session state with new location
8. Reloads context for new location (Story 5-1)
9. Renders arrival narration (Story 5-3)
10. Displays arrival with performance metrics

**Output:**
- Journey summary (from → to)
- Travel time
- New location name
- Current date/time
- Encounter status (yes/no)
- Context reload metadata (token count, NPCs loaded)
- Performance metrics
- Arrival narration

**Performance:** <10 seconds (no encounters), <30 seconds (with encounter)

**Error Messages:**
- `No active session found. Start a session with /start-session` - No active session
- `Invalid destination: [destination] is not connected to [current]. Valid destinations: [list]` - Destination not in connections
- `Failed to load location metadata for [location]` - Metadata.yaml missing or corrupted
- `Failed to advance calendar: [error]` - CalendarManager error (Epic 2)
- `Failed to load context for [destination]: [error]` - Context loading failed (Story 5-1)

---

### /rest

Take a rest to recover HP and spell slots.

**Syntax:**
```
/rest [short|long]
```

**Arguments:**
- `restType` (required): Either `"short"` (1 hour) or `"long"` (8 hours)

**Examples:**
```
/rest short
/rest long
```

**D&D 5e RAW Rest Mechanics:**
- **Short Rest (1 hour):**
  - Spend hit dice to recover HP (1d8 + CON modifier per die)
  - No spell slot recovery
  - No death save reset

- **Long Rest (8 hours):**
  - Recover all HP
  - Recover half max hit dice (rounded down)
  - Recover all spell slots
  - Reset death saves to 0/0

**What it does:**
1. Validates rest type ("short" or "long")
2. Loads current session state and character file
3. Advances calendar by rest duration (1 or 8 hours)
4. Checks for interrupting events during rest period
5. If interrupted: displays message, aborts rest, returns early (no benefits)
6. If completed: applies D&D 5e rest mechanics
7. Updates character sheet file with recovered HP and spell slots
8. Updates session state with time passed
9. Displays rest completion summary

**Output:**
- Rest type (Short/Long)
- Duration
- HP recovered
- Hit dice status
- Spell slots status (recovered/not recovered)
- Death saves status
- Interrupted status (yes/no)
- Performance metrics

**Performance:** <5 seconds (uninterrupted), <20 seconds (interrupted)

**Error Messages:**
- `Invalid rest type: "[type]". Must be "short" or "long".` - Invalid rest type argument
- `No active session found. Start a session with /start-session` - No active session
- `Failed to load character file: [path]` - Character file missing or corrupted
- `Failed to advance calendar: [error]` - CalendarManager error (Epic 2)

**Rest Interruption:**
If an event triggers during rest (e.g., random encounter, scheduled event), the rest is interrupted and no benefits are granted. The event is displayed but not fully executed (full execution in future enhancement).

---

## Context Management Commands

### /context show

Display current context metadata.

**Syntax:**
```
/context show
```

**Arguments:** None

**What it does:**
1. Loads current session state from current-session.yaml
2. Extracts context metadata from session state
3. Loads current location context to get entity counts
4. Displays token count, utilization percentage, entity list, cache status

**Output:**
- Token utilization (current / 3500 budget with percentage)
- Status indicator (✓ Healthy <80%, ⚠ High 80-95%, ✗ Over Budget >95%)
- Loaded entities (NPCs, events, quests, items counts)
- Cache status (last loaded time, cache keys count)
- Current location and character
- Performance metrics

**Performance:** <1 second

**Error Messages:**
- `No active session found. Start a session with /start-session` - No active session

---

### /context reload

Clear cache and reload context with fresh data.

**Syntax:**
```
/context reload
```

**Arguments:** None

**What it does:**
1. Loads current session state
2. Calls ContextCache.clear() to invalidate all cached context (Story 5-2)
3. Reloads context via ContextLoader.loadContext() with fresh data from disk (Story 5-1)
4. Updates session state with new context metadata
5. Displays new token count and utilization

**Use Cases:**
- After major world state changes (NPC death, quest completion)
- When cached context is stale or incorrect
- To refresh after /travel or /rest if context seems outdated

**Output:**
- Token utilization (previous vs current)
- Token change (+/- tokens)
- Reloaded entities (NPCs, events, quests, items counts)
- Location and calendar information
- Performance metrics

**Performance:** <5 seconds

**Error Messages:**
- `No active session found. Start a session with /start-session` - No active session
- `Failed to reload context: [error]` - Context loading failed (Story 5-1 issue)

---

### /context reduce

Drop low-priority content to reduce token usage.

**Syntax:**
```
/context reduce
```

**Arguments:** None

**Priority Levels (from Story 5-1):**
- **P1 (Critical):** Current location description, active NPCs, character sheet
- **P2 (Important):** Adjacent locations, active quests, scheduled events
- **P3 (Nice-to-have):** Distant locations, completed quests, flavor text

**What it does:**
1. Loads current session state and context metadata
2. Checks current token utilization against budget (3500 tokens)
3. If over budget or >95%: Drop P3 content and recalculate
4. If still over budget: Drop P2 content as well and recalculate
5. Updates session state with reduced context metadata
6. Displays new token count and what was dropped

**Use Cases:**
- When context exceeds 3500 token budget
- Before major narration (to reserve tokens for output)
- To optimize performance when context is bloated

**Output:**
- Token utilization (previous vs current)
- Tokens saved
- Priorities dropped (P3, or P2+P3)
- Remaining entities counts
- What was dropped (detailed list)
- What was retained (P1 critical content)
- Performance metrics

**Performance:** <3 seconds

**Error Messages:**
- `No active session found. Start a session with /start-session` - No active session
- `Failed to reduce context: [error]` - Context loading failed (Story 5-1 issue)

**Skip Condition:**
If utilization is below 95%, reduction is skipped with message: "Context reduction not needed. Current utilization: [X]%"

---

## Error Messages

### Common Error Types

**Missing Required Arguments:**
```
Missing required argument(s): [argument names].
Usage: [command] [args...]
```

**Invalid Argument Type:**
```
Invalid argument "[name]": expected [type], got [type]
```

**No Active Session:**
```
No active session. Run "/start-session" first.
```

**File I/O Errors:**
```
Character file not found: [character].yaml
Location not found: [location]
Failed to load location metadata for [location]
```

**Epic System Errors:**
```
Failed to load context: [error]
Failed to advance calendar: [error]
Failed to render narration: [error]
```

### Error Logging

All command errors are logged to `error.log` in the workspace root with:
- Timestamp
- Command ID
- Arguments provided
- Error message
- Stack trace

---

## Troubleshooting

### Session Won't Start

**Problem:** `/start-session` fails with "Character file not found"

**Solution:**
1. Verify character file exists in `characters/` directory
2. Check file name matches argument (without `.yaml` extension)
3. Ensure character file has required fields: `name`, `level`, `class`, `hp`

**Problem:** `/start-session` fails with "Location not found"

**Solution:**
1. Verify location directory exists in `game-data/locations/`
2. Check location ID matches directory name exactly (case-sensitive)
3. Ensure location has all required files: Description.md, NPCs.md, Items.md, Events.md, State.md, metadata.yaml

---

### Travel Not Working

**Problem:** `/travel` fails with "Invalid destination"

**Solution:**
1. Check current location's `metadata.yaml` file
2. Verify destination is listed in `connections:` array
3. Connections are one-way unless explicitly listed in both locations
4. Use exact location ID (case-sensitive, use hyphens not spaces)

**Problem:** `/travel` hangs or times out

**Solution:**
1. Check `game-data/calendar.yaml` is not corrupted
2. Verify EventScheduler is working (check Events.md in locations)
3. Try `/context reduce` to free up tokens before traveling
4. Restart VS Code extension if issue persists

---

### Context Issues

**Problem:** Context shows "Over Budget" (>100% utilization)

**Solution:**
1. Run `/context reduce` to drop P3 content
2. If still over budget, run `/context reduce` again to drop P2 content
3. Consider moving to a simpler location (fewer NPCs/events)
4. Check for large quest descriptions or flavor text

**Problem:** Context shows stale data (old NPC states, completed quests still showing)

**Solution:**
1. Run `/context reload` to clear cache and reload from disk
2. Verify State.md files in locations are up-to-date
3. Check that world state changes were saved properly

---

### Rest Interrupted

**Problem:** Long rest always interrupted, can't recover HP/spell slots

**Solution:**
1. Check `game-data/locations/[current-location]/Events.md`
2. Look for events with time-based triggers during rest period
3. Events trigger based on calendar time advanced during rest
4. Try resting in a safer location (fewer scheduled events)
5. This is working as intended if events are scheduled during rest hours

---

### Performance Issues

**Problem:** Commands taking longer than expected

**Solution:**
1. Run `/context reduce` to optimize token usage
2. Check that `game-data/session/logs/` doesn't have excessive log files
3. Verify disk I/O performance (antivirus may slow file operations)
4. Clear cache with `/context reload` if context is heavily cached
5. Restart VS Code if extension has been running for extended period

**Problem:** `/start-session` exceeds 2 minute target

**Solution:**
1. Check internet connection (if using cloud-based LLM for templates)
2. Verify ContextLoader (Story 5-1) is working correctly
3. Check location has reasonable amount of content (NPCs, events, items)
4. Large locations like Castle Ravenloft may take longer to load

---

## Performance Expectations

| Command | Target (Uninterrupted) | Target (Interrupted/Complex) |
|---------|------------------------|------------------------------|
| `/start-session` | <2 minutes (95th %ile) | N/A |
| `/travel` | <10 seconds | <30 seconds (with encounter) |
| `/rest` | <5 seconds | <20 seconds (interrupted) |
| `/end-session` | <30 seconds | N/A |
| `/context show` | <1 second | N/A |
| `/context reload` | <5 seconds | N/A |
| `/context reduce` | <3 seconds | N/A |

**Performance Factors:**
- Disk I/O speed (file read/write operations)
- Location complexity (number of NPCs, events, items)
- Context token count (larger contexts take longer to load)
- Epic system performance (CalendarManager, EventScheduler, ContextLoader)

---

## Command Categories

### Session Management
- `/start-session` - Initialize session
- `/end-session` - Terminate session

### Navigation
- `/travel` - Move between locations
- `/rest` - Rest and recover

### Context Management
- `/context show` - View context metadata
- `/context reload` - Refresh context from disk
- `/context reduce` - Drop low-priority content

---

## Integration with Epic Systems

### Story 5-1: Intelligent Context Loading
- `/start-session`, `/travel`, `/context reload`, `/context reduce` use ContextLoader
- Token budget: 3500 tokens (soft limit)
- Priority-based loading (P1-P3)

### Story 5-2: Context Caching Strategy
- `/context reload` clears ContextCache
- Cache stores loaded location/NPC/event data
- Cache invalidated on world state changes

### Story 5-3: Dynamic Prompt Templates
- `/start-session`, `/travel` use PromptTemplateEngine
- Templates: `location-initial-visit`, `location-return`
- Context-aware narration generation

### Epic 2: Game Calendar & Dynamic World System
- `/travel`, `/rest` use CalendarManager.advanceTime()
- `/travel`, `/rest` use EventScheduler.checkTriggers()
- Time-based event triggering during travel/rest

### Epic 3: D&D 5e Mechanics System (Rest Mechanics)
- `/rest` implements D&D 5e RAW rest mechanics
- Short rest: hit dice HP recovery
- Long rest: full HP, spell slots, hit dice recovery

---

## UI Panels and Tree Views

### Location Tree View (Story 5-5)

Visual navigation of game locations in VS Code sidebar.

**How to Access:**
1. Open VS Code Activity Bar (left sidebar)
2. Click "Explorer" icon
3. Find "Kapi's RPG - Locations" section

**Features:**
- **Hierarchical Structure:** Locations organized by parent location (from `metadata.yaml`)
- **Current Location Highlighting:** Yellow icon shows your current location
- **Icon Differentiation:**
  - Villages/Towns: House icon
  - Dungeons/Ruins: Skull icon
  - Castles/Fortresses: Tower icon
  - Wilderness/Forests: Tree icon
- **Click to Open:** Click location to open `Description.md` file

**Context Menu Actions:**

Right-click any location in the tree to access:

#### Travel Here
Navigate to the selected location (if connected to current location).

**Requirements:**
- Active session must be running (`/start-session`)
- Location must be connected to your current location

**What it does:**
1. Validates location is connected to current location
2. Executes `/travel` command to selected location
3. Advances time based on travel distance
4. Triggers random encounters (if applicable)
5. Updates current location in session state
6. Refreshes location tree (highlights new current location)

**Error Messages:**
- `Cannot travel to [location]: not connected` - Location not reachable from current position
- `No active session` - Must start session first

#### View Location Details
Opens all 6 location files in split editor view.

**Files Opened:**
1. `Description.md` - Environmental descriptions and atmosphere
2. `NPCs.md` - NPC profiles, dialogue, AI behavior notes
3. `Items.md` - Available and hidden items
4. `Events.md` - Scheduled events and triggers
5. `State.md` - Current location state (visited, discovered items, NPC states)
6. `metadata.yaml` - Location metadata (connections, type, parent)

**Layout:** Files open in split editor (side-by-side) for easy reference

#### Open in Explorer
Reveals location directory in VS Code file explorer.

**Use Case:** Browse location files, add custom content, view folder structure

### Refresh Location Tree

Reload tree structure from disk (picks up new locations or metadata changes).

**Command Palette:**
1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type "Kapi's RPG: Refresh Location Tree"
3. Press Enter

**When to Use:**
- Added new location directories
- Modified `metadata.yaml` files (connections, parent location)
- Location files edited outside VS Code

### Panel Commands (Story 5-5 Stubs)

The following panel commands are registered but show placeholder messages. Full implementations coming in Stories 5-8, 5-9, 5-10.

#### /character-sheet (Coming in Story 5-8)
Show character sheet panel with live HP, spell slots, inventory, and stats.

**Planned Features:**
- Real-time character stats display
- HP tracking with death saves
- Spell slot management
- Inventory management
- Condition tracking
- Auto-refresh when character file changes

#### /quest-tracker (Coming in Story 5-9)
Show quest tracker panel with active quests, objectives, and rewards.

**Planned Features:**
- Active quest list
- Quest objectives with completion status
- Quest rewards and XP tracking
- Quest progression timeline
- Auto-refresh when quest files change

#### /calendar (Coming in Story 5-10)
Show calendar widget with current date, moon phase, and weather.

**Planned Features:**
- Current in-game date and time
- Moon phase visualization
- Current weather conditions
- Season information
- Upcoming events
- Auto-refresh when calendar changes

### Auto-Refresh Behavior

**File Watching (Story 5-5):**
The extension automatically watches critical game files and refreshes panels when changes detected:

- **Character Files:** `characters/*.yaml`
- **Current Location Files:** `game-data/locations/[current]/*.md`
- **Calendar File:** `game-data/calendar.yaml`
- **Session File:** `game-data/session/current-session.yaml`

**Debouncing:** File changes debounced by 300ms to avoid rapid re-renders during multiple edits

**Limits:** Max 20 files watched simultaneously (well under VS Code 100-file limit)

**Manual Refresh:**
- Location Tree: "Kapi's RPG: Refresh Location Tree" command
- Panels: Close and reopen panel

### UI Theming

**Gothic Dark Theme (Story 5-5):**
All panels use dark theme matching Curse of Strahd aesthetic:
- Dark backgrounds (#1e1e1e)
- Warm text colors (#cccccc)
- Accent colors (#569cd6)
- Respects VS Code theme preferences

**Custom Styling:**
Panel CSS located in `extensions/kapis-rpg-dm/media/styles/panel-theme.css`

For detailed panel development guide, see [Extension Development Guide](./extension-development.md).

---

## Future Enhancements (Story 5-6)

### SessionLogger (Full Implementation)
- Comprehensive session summary generation
- Detailed XP tracking
- NPC interaction logs
- Quest progression tracking

### GitIntegration (Full Implementation)
- Real Git commits (not stubs)
- Automatic commit message generation
- Session checkpoints
- Rollback functionality

---

## See Also

- [Extension Development Guide](./extension-development.md) - Panel development and API reference
- [Technical Architecture](./technical-architecture.md)
- [Story 5-1: Intelligent Context Loading](./stories/5-1-intelligent-context-loader.md)
- [Story 5-3: Dynamic Prompt Templates](./stories/5-3-prompt-template-engine.md)
- [Story 5-4: Enhanced Slash Commands](./stories/5-4-enhanced-slash-commands.md)
- [Story 5-5: VS Code UI Improvements](./stories/5-5-vs-code-ui-improvements.md)
- [Epic 5 Tech Spec](./tech-spec-epic-5.md)

---

**Last Updated:** 2025-11-22
**Story:** 5-5 VS Code UI Improvements
**Version:** 1.1.0
