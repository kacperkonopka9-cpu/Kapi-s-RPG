# Epic Technical Specification: Game Calendar & Dynamic World System

Date: 2025-11-02
Author: Kapi
Epic ID: 2
Status: Draft

---

## Overview

Epic 2 implements the game calendar and dynamic world system for Kapi-s-RPG, enabling time-aware gameplay where the world evolves independent of player presence. The calendar tracks in-game date/time with configurable advancement modes (manual, automatic, or hybrid) and triggers scheduled events at specific timestamps. NPCs follow daily routines stored as schedules, and world state changes propagate across connected locations (e.g., NPC death triggers reactions in related NPCs, faction reputation affects dialogue). Time-sensitive quests track deadlines and failure conditions. The system supports moon phases affecting gameplay (werewolf encounters), weather patterns, and seasonal effects. This transforms the static world from Epic 1 into a living, breathing Barovia where time matters and consequences cascade realistically.

## Objectives and Scope

**In Scope:**
- ✅ Calendar data structure stored in `calendar.yaml` (date, time, mode, events, NPC schedules, moon phases, weather)
- ✅ Time advancement module with three modes: manual (player command), automatic (action-based), hybrid (context-aware)
- ✅ Event scheduling system with multiple trigger types: date/time, conditional, location-based, recurring
- ✅ Event execution engine that loads Event.md definitions, applies effects, updates State.md
- ✅ NPC schedule tracking with time-of-day routines and location tracking
- ✅ World state propagation system (NPC death cascades to relationships, quests, faction standings)
- ✅ Time-sensitive quest tracking with deadline monitoring and failure conditions
- ✅ Moon phase calculation and werewolf encounter system
- ✅ Weather system with randomization and seasonal patterns
- ✅ Seasonal effects (temperature, wildlife behavior, travel difficulty)
- ✅ `/calendar` command to view current date/time and upcoming events
- ✅ `/advance-time [duration]` command for manual time progression
- ✅ Automatic time advancement during travel, combat, and rests
- ✅ Calendar event history logging (what events triggered when)
- ✅ Integration with Epic 1 location State.md files for time-based updates

**Out of Scope:**
- ❌ D&D 5e rest mechanics (short/long rest effects) → Epic 3
- ❌ Combat duration calculations → Epic 3
- ❌ Spell duration tracking → Epic 3
- ❌ Character-specific time effects (aging, exhaustion) → Epic 3
- ❌ Full Curse of Strahd event content → Epic 4
- ❌ Advanced calendar UI/widgets → Epic 5
- ❌ Historical calendar browsing (view past dates) → Epic 5
- ❌ Calendar export/import → Epic 5
- ❌ Multi-year campaigns → MVP focused on single campaign
- ❌ Real-time gameplay (all time is player-controlled)
- ❌ Multiplayer time synchronization

## System Architecture Alignment

**Architecture Document Reference:** `docs/technical-architecture.md` sections 5, 6, 8

**Core Components Implemented:**

1. **Calendar System Architecture** (Architecture §5)
   - Implements calendar.yaml structure per Architecture §5.1 (lines 332-414)
   - Three time advancement modes: manual, automatic, hybrid (Architecture §5.2)
   - Event trigger types and processing flow (Architecture §5.3)

2. **Time-Based Context Updates** (Architecture §6.1)
   - Integrates with Epic 1 ContextBuilder to add time-of-day variants
   - Loads morning/night Description.md variants based on current time
   - Includes recent events in LLM context for continuity

3. **World State Management** (Architecture §8.4)
   - Extends world-state.yaml with time-based flags
   - Tracks NPC vital status changes (deaths, disappearances)
   - Permanent world changes logged with timestamps

4. **Data Structure Integration** (Architecture §8)
   - LocationState schema extended with currentDate, currentTime
   - NPCData schema includes schedule routines
   - EventData schema defines trigger conditions and effects

**Architectural Constraints:**
- **File-First Design:** All calendar data in human-editable calendar.yaml
- **Non-Blocking:** Time advancement never blocks player actions (always interruptible)
- **Deterministic:** Event triggers are deterministic given same time progression
- **Reversible:** Time can be "rewound" via Git (load previous commit)
- **Performance:** Event checks must complete in < 50ms per time advancement

**Technology Stack Alignment:**
- Node.js for time calculations and event processing
- YAML for calendar data storage (human-readable)
- Existing LocationLoader/StateManager from Epic 1
- Integration with Epic 1 GitIntegration for calendar commits

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Owner/Location |
|--------|---------------|--------|---------|----------------|
| **CalendarManager** | Load, validate, and persist calendar data | calendar.yaml path | Calendar object | `src/calendar/calendar-manager.js` |
| **TimeManager** | Advance time and calculate new timestamps | Current time, duration, mode | New timestamp, elapsed time | `src/calendar/time-manager.js` |
| **EventScheduler** | Check for triggered events and execute them | Current time, old time | Array of triggered events | `src/calendar/event-scheduler.js` |
| **EventExecutor** | Load event definitions and apply effects | Event ID, location ID | StateUpdate object | `src/calendar/event-executor.js` |
| **NPCScheduleTracker** | Track NPC locations based on time-of-day | NPC ID, current time | NPC location, activity | `src/calendar/npc-schedule-tracker.js` |
| **WorldStatePropagator** | Propagate state changes across locations | State change event | Array of affected locations | `src/calendar/world-state-propagator.js` |
| **QuestDeadlineMonitor** | Check quest deadlines and trigger failures | Current time, active quests | Array of failed quests | `src/calendar/quest-deadline-monitor.js` |
| **MoonPhaseCalculator** | Calculate current moon phase | Current date | Moon phase enum, next phase date | `src/calendar/moon-phase-calculator.js` |
| **WeatherGenerator** | Generate weather based on season/randomness | Current date, season, location | Weather conditions | `src/calendar/weather-generator.js` |
| **CalendarCommandHandler** | Handle `/calendar` and `/advance-time` commands | Command string, args | Display output | `src/commands/calendar-commands.js` |

**Module Dependencies:**
```
CalendarCommandHandler
  └─> TimeManager
      ├─> CalendarManager (load/save calendar)
      ├─> EventScheduler
      │   └─> EventExecutor
      │       ├─> StateManager (from Epic 1)
      │       └─> WorldStatePropagator
      │           └─> LocationLoader (from Epic 1)
      ├─> NPCScheduleTracker
      ├─> QuestDeadlineMonitor
      ├─> MoonPhaseCalculator
      └─> WeatherGenerator
```

### Data Models and Contracts

**Calendar Schema:**
```javascript
{
  currentDate: string,              // "2024-03-10" (YYYY-MM-DD)
  currentTime: string,              // "14:30" (HH:MM 24-hour)
  currentDayName: string,           // "Terraday" (D&D calendar)
  currentMonth: string,             // "Ches" (D&D calendar)
  currentYear: number,              // 735 (Barovian Reckoning)
  timeAdvancementMode: string,      // "manual", "automatic", "hybrid"
  timePerAction: number,            // Minutes per standard action (auto mode)
  restDuration: {
    shortRest: number,              // Minutes (60)
    longRest: number                // Minutes (480 = 8 hours)
  },
  scheduledEvents: Array<ScheduledEvent>,
  npcSchedules: Map<npcId, NPCSchedule>,
  moonPhases: {
    currentPhase: string,           // "waxing_gibbous", "full", etc.
    nextFullMoon: string,           // Date of next full moon
    nextNewMoon: string             // Date of next new moon
  },
  currentSeason: string,            // "Early Spring", "Summer", etc.
  seasonalEffects: Array<string>,   // Descriptive effects
  eventHistory: Array<EventHistoryEntry>,
  lastUpdated: string               // ISO timestamp
}
```

**ScheduledEvent Schema:**
```javascript
{
  eventId: string,                  // "evt_001"
  name: string,                     // "Death of Burgomaster Kolyan"
  triggerDate: string,              // "2024-03-13" (null if not date-based)
  triggerTime: string,              // "06:00" (null if not time-based)
  triggerCondition: string,         // "player_enters_location", "npc_status_changed"
  conditionParams: Object,          // Parameters for condition check
  locationId: string,               // "village-of-barovia" (null if global)
  eventType: string,                // "story", "combat", "social", "environmental"
  status: string,                   // "pending", "triggered", "completed", "failed"
  recurring: boolean,               // True for daily/weekly/monthly events
  recurInterval: string,            // "daily", "weekly", "monthly" (if recurring)
  effectScript: string,             // Path to event effect definition or inline
  priority: number                  // Execution priority if multiple events trigger
}
```

**NPCSchedule Schema:**
```javascript
{
  npcId: string,                    // "ireena_kolyana"
  locationId: string,               // Home location
  routine: Array<ScheduleEntry>,    // Time-based daily routine
  overrides: Array<ScheduleOverride> // Special event overrides
}

// ScheduleEntry
{
  timeStart: string,                // "06:00"
  timeEnd: string,                  // "08:00"
  activity: string,                 // "Morning prayers"
  locationId: string,               // "burgomaster-mansion/chapel"
  activityDetails: string           // LLM-friendly description
}

// ScheduleOverride
{
  condition: string,                // "burgomaster_dead", "player_escort_active"
  newRoutine: Array<ScheduleEntry> // Replaces routine when condition met
}
```

**StateChange Schema:**
```javascript
{
  changeType: string,               // "npc_death", "location_destroyed", "faction_change"
  sourceLocationId: string,         // Where change originated
  primaryEntity: string,            // NPC ID, location ID, faction ID
  timestamp: string,                // When change occurred
  propagationRules: {
    affectRelationships: boolean,   // Update related NPCs
    affectQuests: boolean,          // Update quest status
    affectFactions: boolean,        // Update faction standings
    affectedLocations: Array<string> // Specific locations to update
  },
  stateUpdates: Array<StateUpdate>  // Actual changes to apply
}

// StateUpdate
{
  targetType: string,               // "npc", "location", "quest", "faction"
  targetId: string,                 // ID of thing to update
  fieldPath: string,                // "status", "relationship.player", etc.
  newValue: any,                    // New value to set
  reason: string                    // Human-readable explanation
}
```

**EventHistoryEntry Schema:**
```javascript
{
  eventId: string,
  eventName: string,
  triggeredAt: string,              // ISO timestamp
  gameDate: string,                 // In-game date when triggered
  gameTime: string,                 // In-game time when triggered
  locationId: string,               // Where it occurred (null if global)
  wasPlayerPresent: boolean,        // Did player witness it?
  effects: Array<string>,           // Human-readable list of effects
  narrative: string                 // LLM-generated description (if player witnessed)
}
```

**MoonPhase Enum:**
```javascript
enum MoonPhase {
  NEW_MOON = "new_moon",
  WAXING_CRESCENT = "waxing_crescent",
  FIRST_QUARTER = "first_quarter",
  WAXING_GIBBOUS = "waxing_gibbous",
  FULL_MOON = "full_moon",
  WANING_GIBBOUS = "waning_gibbous",
  LAST_QUARTER = "last_quarter",
  WANING_CRESCENT = "waning_crescent"
}
```

**Weather Schema:**
```javascript
{
  condition: string,                // "Heavy fog", "Light rain", "Overcast"
  temperature: number,              // Fahrenheit
  visibility: string,               // "Normal", "Reduced", "Severely reduced"
  travelDifficulty: string,         // "Normal", "Difficult", "Treacherous"
  atmosphericDescription: string,   // LLM-friendly prose
  gameplayEffects: Array<string>    // Mechanical impacts (Epic 3)
}
```

### APIs and Interfaces

**CalendarManager API:**
```javascript
class CalendarManager {
  /**
   * Load calendar from disk
   * @returns {Promise<Calendar>} Loaded calendar object
   * @throws {CalendarNotFoundError} If calendar.yaml missing
   */
  async loadCalendar(): Promise<Calendar>

  /**
   * Save calendar to disk
   * @param {Calendar} calendar - Calendar to save
   * @returns {Promise<void>}
   */
  async saveCalendar(calendar: Calendar): Promise<void>

  /**
   * Initialize new calendar (for new games)
   * @param {Object} config - Starting date, mode, etc.
   * @returns {Promise<Calendar>} New calendar
   */
  async initializeCalendar(config: Object): Promise<Calendar>

  /**
   * Validate calendar structure
   * @param {Calendar} calendar - Calendar to validate
   * @returns {ValidationResult} Validation result
   */
  validateCalendar(calendar: Calendar): ValidationResult
}
```

**TimeManager API:**
```javascript
class TimeManager {
  /**
   * Advance time by duration
   * @param {Calendar} calendar - Current calendar
   * @param {number} minutes - Minutes to advance
   * @param {string} reason - Why time advanced (for logging)
   * @returns {TimeAdvanceResult} New time and triggered events
   */
  async advanceTime(
    calendar: Calendar,
    minutes: number,
    reason: string
  ): Promise<TimeAdvanceResult>

  /**
   * Calculate time between two timestamps
   * @param {string} startDate - Start date
   * @param {string} startTime - Start time
   * @param {string} endDate - End date
   * @param {string} endTime - End time
   * @returns {number} Minutes elapsed
   */
  calculateElapsed(
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string
  ): number

  /**
   * Parse duration string (e.g., "2 hours", "30 minutes", "1 day")
   * @param {string} duration - Duration string
   * @returns {number} Minutes
   * @throws {InvalidDurationError} If unparseable
   */
  parseDuration(duration: string): number

  /**
   * Get time advancement for action type (automatic mode)
   * @param {string} actionType - "travel", "search", "dialogue", etc.
   * @param {Object} context - Additional context for calculation
   * @returns {number} Estimated minutes
   */
  getActionDuration(actionType: string, context: Object): number
}
```

**EventScheduler API:**
```javascript
class EventScheduler {
  /**
   * Check for triggered events between two times
   * @param {Calendar} calendar - Current calendar
   * @param {string} oldDate - Previous date
   * @param {string} oldTime - Previous time
   * @param {string} newDate - Current date
   * @param {string} newTime - Current time
   * @param {Object} context - Game context (location, flags, etc.)
   * @returns {Promise<Array<ScheduledEvent>>} Triggered events
   */
  async checkTriggers(
    calendar: Calendar,
    oldDate: string,
    oldTime: string,
    newDate: string,
    newTime: string,
    context: Object
  ): Promise<Array<ScheduledEvent>>

  /**
   * Execute triggered event
   * @param {ScheduledEvent} event - Event to execute
   * @param {Object} gameState - Current game state
   * @returns {Promise<EventExecutionResult>} Execution result
   */
  async executeEvent(
    event: ScheduledEvent,
    gameState: Object
  ): Promise<EventExecutionResult>

  /**
   * Add new event to calendar
   * @param {Calendar} calendar - Calendar to modify
   * @param {ScheduledEvent} event - Event to add
   */
  addEvent(calendar: Calendar, event: ScheduledEvent): void

  /**
   * Remove or mark event as completed
   * @param {Calendar} calendar - Calendar to modify
   * @param {string} eventId - Event to remove/complete
   * @param {string} status - "completed" or "failed"
   */
  updateEventStatus(
    calendar: Calendar,
    eventId: string,
    status: string
  ): void
}
```

**EventExecutor API:**
```javascript
class EventExecutor {
  /**
   * Execute event and apply world state changes
   * @param {ScheduledEvent} event - Event to execute
   * @param {Object} gameState - Current game state
   * @returns {Promise<EventExecutionResult>} Result with state updates
   */
  async execute(
    event: ScheduledEvent,
    gameState: Object
  ): Promise<EventExecutionResult>

  /**
   * Load event definition from location Events.md
   * @param {string} eventId - Event ID
   * @param {string} locationId - Location containing event
   * @returns {Promise<EventDefinition>} Event definition
   */
  async loadEventDefinition(
    eventId: string,
    locationId: string
  ): Promise<EventDefinition>

  /**
   * Generate narrative description of event
   * @param {ScheduledEvent} event - Executed event
   * @param {boolean} playerPresent - Is player at location?
   * @returns {Promise<string>} LLM-generated narrative
   */
  async generateEventNarrative(
    event: ScheduledEvent,
    playerPresent: boolean
  ): Promise<string>
}
```

**NPCScheduleTracker API:**
```javascript
class NPCScheduleTracker {
  /**
   * Get NPC's current location and activity based on time
   * @param {string} npcId - NPC to check
   * @param {string} currentDate - Current date
   * @param {string} currentTime - Current time
   * @returns {Promise<NPCLocation>} NPC's location and activity
   */
  async getNPCLocation(
    npcId: string,
    currentDate: string,
    currentTime: string
  ): Promise<NPCLocation>

  /**
   * Update all NPC locations for new time
   * @param {Calendar} calendar - Current calendar
   * @returns {Promise<Array<NPCLocationUpdate>>} All NPC updates
   */
  async updateAllNPCLocations(
    calendar: Calendar
  ): Promise<Array<NPCLocationUpdate>>

  /**
   * Get NPCs present at location at specific time
   * @param {string} locationId - Location to check
   * @param {string} date - Date
   * @param {string} time - Time
   * @returns {Promise<Array<string>>} Array of NPC IDs
   */
  async getNPCsAtLocation(
    locationId: string,
    date: string,
    time: string
  ): Promise<Array<string>>
}
```

**WorldStatePropagator API:**
```javascript
class WorldStatePropagator {
  /**
   * Propagate state change across world
   * @param {StateChange} change - State change to propagate
   * @returns {Promise<Array<StateUpdate>>} All resulting updates
   */
  async propagateChange(
    change: StateChange
  ): Promise<Array<StateUpdate>>

  /**
   * Find all entities affected by change
   * @param {StateChange} change - Change to analyze
   * @returns {Promise<Array<AffectedEntity>>} Affected entities
   */
  async findAffectedEntities(
    change: StateChange
  ): Promise<Array<AffectedEntity>>

  /**
   * Apply state updates to world
   * @param {Array<StateUpdate>} updates - Updates to apply
   * @returns {Promise<ApplyResult>} Result of application
   */
  async applyUpdates(
    updates: Array<StateUpdate>
  ): Promise<ApplyResult>
}
```

**Command Signatures:**
```typescript
// Calendar command - view current date/time and events
{
  command: 'kapi-rpg.calendar',
  title: 'View Game Calendar',
  handler: calendarHandler
}

// Advance time command
{
  command: 'kapi-rpg.advanceTime',
  title: 'Advance Time',
  handler: advanceTimeHandler,
  args: ['duration'] // e.g., "2 hours", "30 minutes", "1 day"
}
```

### Workflows and Sequencing

**Workflow 1: Manual Time Advancement**
```
User: /advance-time 2 hours
  │
  ├─> CommandRouter parses command
  │   └─> duration = "2 hours" → 120 minutes
  │
  ├─> CalendarManager.loadCalendar()
  │   └─> Load calendar.yaml → Calendar object
  │
  ├─> TimeManager.advanceTime(calendar, 120, "manual command")
  │   │
  │   ├─> Calculate new timestamp
  │   │   old: 2024-03-10 14:30
  │   │   +120 minutes
  │   │   new: 2024-03-10 16:30
  │   │
  │   ├─> EventScheduler.checkTriggers(old, new)
  │   │   │
  │   │   ├─> Scan scheduledEvents for triggers between old and new
  │   │   ├─> Check date/time triggers
  │   │   ├─> Check conditional triggers
  │   │   └─> Return triggered events: [evt_042]
  │   │
  │   ├─> For each triggered event:
  │   │   │
  │   │   ├─> EventExecutor.execute(evt_042)
  │   │   │   │
  │   │   │   ├─> Load event definition from Events.md
  │   │   │   ├─> Apply effects (update State.md, NPC status)
  │   │   │   ├─> WorldStatePropagator.propagateChange(...)
  │   │   │   └─> Generate narrative (if player present)
  │   │   │
  │   │   └─> Mark event as "completed"
  │   │
  │   ├─> NPCScheduleTracker.updateAllNPCLocations(newTime)
  │   │   └─> Update all NPC positions based on schedules
  │   │
  │   ├─> MoonPhaseCalculator.calculate(newDate)
  │   │   └─> Update moon phase
  │   │
  │   ├─> WeatherGenerator.generate(newDate, newTime)
  │   │   └─> Update weather conditions
  │   │
  │   └─> Return TimeAdvanceResult
  │
  ├─> Update calendar object with new time
  │
  ├─> CalendarManager.saveCalendar(calendar)
  │   └─> Write updated calendar.yaml
  │
  ├─> SessionLogger.log(timeAdvance, events)
  │
  └─> Display results to user:
      "Time advanced to 2024-03-10 16:30
       Event triggered: Zombie Siege at Village of Barovia
       Moon phase: Waxing Gibbous (Full moon in 5 days)
       Weather: Heavy fog, temperature 45°F"
```

**Workflow 2: Automatic Time Advancement (Travel)**
```
User: /travel vallaki
  │
  ├─> NavigationHandler.travel("vallaki", "village-of-barovia")
  │   │
  │   ├─> Validate travel possible
  │   └─> Calculate travel time from metadata.yaml
  │       connected_locations:
  │         vallaki: 4 hours
  │
  ├─> TimeManager.advanceTime(calendar, 240, "travel to vallaki")
  │   │ (240 minutes = 4 hours)
  │   │
  │   ├─> old: 2024-03-10 14:30
  │   │   new: 2024-03-10 18:30
  │   │
  │   ├─> EventScheduler.checkTriggers(...)
  │   │   └─> No events triggered during travel
  │   │
  │   ├─> NPCScheduleTracker.updateAllNPCLocations(18:30)
  │   │   └─> NPCs moved to evening locations
  │   │
  │   └─> Return TimeAdvanceResult
  │
  ├─> Update calendar and save
  │
  ├─> LocationLoader.loadLocation("vallaki")
  │
  ├─> ContextBuilder includes time info:
  │   "You arrive in Vallaki as evening falls (18:30)"
  │
  ├─> LLMNarrator generates arrival with time context
  │
  └─> Display: "After 4 hours of travel through fog-shrouded
               roads, you arrive in Vallaki as the sun sets..."
```

**Workflow 3: Event Execution and Propagation**
```
Event Triggered: "Death of Burgomaster Kolyan"
  │
  ├─> EventExecutor.execute(evt_001)
  │   │
  │   ├─> Load event definition from village-of-barovia/Events.md
  │   │   Event: Death of Burgomaster Kolyan
  │   │   Effect: Set NPC status = "Dead"
  │   │   Cascade: Update Ireena, Ismark, unlock quest
  │   │
  │   ├─> Create StateChange object:
  │   │   changeType: "npc_death"
  │   │   primaryEntity: "kolyan_indirovich"
  │   │   propagationRules: {
  │   │     affectRelationships: true,
  │   │     affectQuests: true
  │   │   }
  │   │
  │   └─> WorldStatePropagator.propagateChange(stateChange)
  │       │
  │       ├─> Find affected entities:
  │       │   - ireena_kolyana (daughter)
  │       │   - ismark_kolyanovich (son)
  │       │   - quest_escort_ireena (now active)
  │       │   - village-of-barovia location (state update)
  │       │
  │       ├─> Generate state updates:
  │       │   Update 1: ireena_kolyana.status = "Orphaned"
  │       │   Update 2: ismark_kolyanovich.attitude = "Desperate"
  │       │   Update 3: quest_escort_ireena.status = "Active"
  │       │   Update 4: village-of-barovia/State.md:
  │       │              "Burgomaster dead, funeral needed"
  │       │
  │       └─> Apply all updates:
  │           - Write to NPCs.md files
  │           - Write to State.md files
  │           - Update quest files
  │
  ├─> Generate event narrative (if player present):
  │   LLMNarrator: "You hear wailing from the Burgomaster's
  │   mansion. Ismark emerges, face drawn with grief..."
  │
  ├─> Add to event history in calendar
  │
  └─> Return EventExecutionResult (success, 4 updates applied)
```

**Workflow 4: NPC Schedule Tracking**
```
Time advanced to 08:00 (morning)
  │
  ├─> NPCScheduleTracker.updateAllNPCLocations(08:00)
  │   │
  │   ├─> Load calendar.npcSchedules
  │   │
  │   ├─> For each NPC with schedule:
  │   │   │
  │   │   ├─> ireena_kolyana schedule:
  │   │   │   08:00-12:00: "Tending to father"
  │   │   │   Location: burgomaster-mansion/bedroom
  │   │   │
  │   │   │   Check overrides:
  │   │   │   Condition: "burgomaster_dead" = true
  │   │   │   Override routine:
  │   │   │     08:00-12:00: "Grieving, preparing funeral"
  │   │   │     Location: burgomaster-mansion/father-room
  │   │   │
  │   │   ├─> Update NPCs.md in burgomaster-mansion:
  │   │   │   currentLocation: "burgomaster-mansion/father-room"
  │   │   │   activity: "Grieving, preparing funeral"
  │   │   │
  │   │   └─> ismark_kolyanovich schedule:
  │   │       08:00-10:00: "At Blood of Vine tavern"
  │   │       Location: blood-of-vine-tavern
  │   │
  │   │       Update village-of-barovia/NPCs.md:
  │   │       ismark.currentLocation: "blood-of-vine-tavern"
  │   │
  │   └─> Return NPCLocationUpdate[] (2 NPCs moved)
  │
  ├─> If player at any affected location:
  │   Generate narrative describing NPC movements
  │   "You see Ismark leaving the mansion, heading
  │    toward the tavern with heavy steps."
  │
  └─> Log NPC movements to session log
```

**Workflow 5: Quest Deadline Monitoring**
```
Time advanced to 2024-03-15 23:59
  │
  ├─> QuestDeadlineMonitor.checkDeadlines(newDate)
  │   │
  │   ├─> Load active-quests.yaml
  │   │
  │   ├─> Check each active quest for deadline:
  │   │
  │   │   Quest: "Defend Village from Zombie Siege"
  │   │   Deadline: 2024-03-15 23:00
  │   │   Current time: 2024-03-15 23:59
  │   │   Status: Past deadline
  │   │
  │   ├─> Quest failed! Apply failure effects:
  │   │   │
  │   │   ├─> State change: "zombie_siege_undefended"
  │   │   │
  │   │   ├─> WorldStatePropagator.propagateChange:
  │   │   │   Effect 1: Roll 1d4 villagers die
  │   │   │   Result: 2 villagers die
  │   │   │
  │   │   │   Effect 2: Update village-of-barovia/State.md:
  │   │   │   population: 47 → 45
  │   │   │
  │   │   │   Effect 3: Villagers' attitudes worsen
  │   │   │   Reputation: -20
  │   │   │
  │   │   └─> Update quest status: "failed"
  │   │
  │   └─> Return FailedQuest[]
  │
  ├─> Generate narrative (if player present):
  │   "As midnight passes, you hear distant screams.
  │    The zombie attack you ignored has claimed victims..."
  │
  └─> Log quest failure to session log and event history
```

**Workflow 6: Moon Phase and Werewolf Encounters**
```
Time advanced to 2024-03-15 20:00
  │
  ├─> MoonPhaseCalculator.calculate("2024-03-15")
  │   │
  │   ├─> Check calendar.moonPhases.nextFullMoon
  │   │   nextFullMoon: "2024-03-15"
  │   │   currentPhase: "full_moon"
  │   │
  │   └─> Update calendar.moonPhases.currentPhase = "full_moon"
  │
  ├─> Check for moon-dependent events:
  │   │
  │   ├─> Load special event: "Werewolf Activity (Full Moon)"
  │   │   Condition: currentPhase == "full_moon"
  │   │   Effect: Increase werewolf encounter chance
  │   │
  │   └─> If player in wilderness location:
  │       Trigger random encounter check (Epic 3)
  │       Chance: 50% (normal: 20%)
  │
  ├─> Update weather (full moon affects):
  │   WeatherGenerator:
  │   Override: Clear skies (full moon visible)
  │   atmosphericDescription: "The full moon illuminates
  │   the fog-shrouded landscape with eerie silver light..."
  │
  └─> Display moon phase notification:
      "The full moon rises, casting pale light across Barovia.
       Wolves howl in the distance..."
```

## Non-Functional Requirements

### Performance

**Target Metrics:**

| Metric | Target | Measurement Method | Priority |
|--------|--------|-------------------|----------|
| **Time Advance Operation** | < 200ms | Time from command to calendar saved | P0 - Critical |
| **Event Check** | < 50ms | Single event trigger evaluation | P0 - Critical |
| **Event Execution** | < 500ms | Load definition, apply effects, propagate | P1 - High |
| **NPC Schedule Update** | < 100ms | Update all NPC positions | P1 - High |
| **Calendar Load** | < 50ms | Read and parse calendar.yaml | P1 - High |
| **Propagation Cascade** | < 1 second | Complete state propagation across all locations | P2 - Medium |
| **Memory Overhead** | < 50 MB | Calendar data in memory | P2 - Medium |

**Performance Requirements:**

1. **Time Advancement Efficiency**
   - Batch event checks (check all events in single pass)
   - Lazy load event definitions (only when triggered)
   - Cache NPC schedules during session
   - Target: 95% of time advances complete in < 200ms

2. **Event Processing Optimization**
   - Prioritize events by importance (execute high-priority first)
   - Parallel execution of independent events
   - Skip expensive operations if player not present (generate narrative later)
   - Target: Handle 10+ simultaneous events without lag

3. **Calendar File I/O**
   - Debounce saves (write once per minute max, or on session end)
   - Write calendar.yaml atomically (temp file + rename)
   - Validate before write to prevent corruption
   - Target: Zero data loss, < 50ms write time

4. **World State Propagation**
   - Build dependency graph before propagation
   - Update only affected entities (not full world scan)
   - Batch file writes (update multiple NPCs.md in one operation)
   - Target: Propagate state change to 10+ locations in < 1 second

**Performance Monitoring:**
- Log all time advance operations > 200ms
- Track event execution times
- Monitor calendar file size growth
- Alert if propagation takes > 1 second

**Related Architecture Sections:**
- Architecture §14.1: Performance Targets
- Architecture §14.2: Optimization Strategies

### Security

**Data Integrity:**
- Validate all time calculations (prevent negative time, overflow)
- Validate event definitions before execution (prevent malicious scripts)
- Backup calendar.yaml before destructive operations
- Atomic file writes (prevent corruption during crashes)

**Input Validation:**
```javascript
function validateTimeAdvance(minutes) {
  if (typeof minutes !== 'number') throw new TypeError('Duration must be number');
  if (minutes < 0) throw new RangeError('Cannot advance negative time');
  if (minutes > 10080) throw new RangeError('Cannot advance more than 1 week (10080 min)');
  if (!Number.isFinite(minutes)) throw new RangeError('Duration must be finite');
  return minutes;
}
```

**Event Definition Safety:**
- Whitelist allowed event effect types
- Sandbox event execution (no arbitrary code execution)
- Validate state update paths (prevent modifying protected fields)
- Log all state changes for audit trail

**Calendar Corruption Prevention:**
- Schema validation on load (reject invalid calendar.yaml)
- Automatic backup before major changes
- Recovery mode if calendar corrupted (load from Git history)
- Checksum validation for critical fields

**Related Architecture Sections:**
- Architecture §15.2: Input Validation
- Architecture §10: Git Version Control Strategy

### Reliability/Availability

**Availability Target:**
- **99% uptime during sessions** - Calendar always accessible
- **Graceful degradation** - If calendar corrupt, fall back to manual time tracking

**Failure Modes & Recovery:**

1. **Calendar File Missing**
   - **Detection:** File read error on loadCalendar()
   - **Recovery:** Initialize new calendar from template
   - **Fallback:** Prompt user for starting date or use default
   - **Impact:** Loss of time tracking until new calendar created

2. **Calendar File Corrupted**
   - **Detection:** YAML parse error or schema validation failure
   - **Recovery:** Load from Git history (previous commit)
   - **Fallback:** Offer manual repair (open file in editor)
   - **Impact:** May lose recent time changes, but world state preserved

3. **Event Execution Failure**
   - **Detection:** Exception thrown during event execution
   - **Recovery:** Log error, mark event as "failed", continue
   - **Fallback:** Display error to user, allow manual intervention
   - **Impact:** One event skipped, but time continues advancing

4. **Infinite Event Loop**
   - **Detection:** Same event triggers repeatedly, or > 100 events in one advance
   - **Recovery:** Break loop, log warning, stop processing further events
   - **Fallback:** Alert user of suspicious event behavior
   - **Impact:** Some events not executed, manual fix required

5. **Time Calculation Overflow**
   - **Detection:** Date calculation results in invalid date
   - **Recovery:** Cap to maximum date (year 9999)
   - **Fallback:** Warn user and refuse further advancement
   - **Impact:** Cannot advance time beyond reasonable limits

**Data Persistence Strategy:**
- Continuous updates to calendar.yaml (debounced)
- Git commit on major events (NPC deaths, quest failures)
- Session end always saves calendar
- Event history preserved for audit trail

**Rollback Strategy:**
- Load previous Git commit to rewind time
- Edit calendar.yaml directly to fix corruption
- Delete problematic events from scheduledEvents array
- Reset calendar to known-good state

**Related Architecture Sections:**
- Architecture §10.1: Git as Save System
- Architecture §10.2: Branch Strategy

### Observability

**Logging Requirements:**

1. **Calendar Activity Log (Primary):**
   - **Location:** `logs/calendar-YYYY-MM-DD.log`
   - **Format:** Plain text, one line per event
   - **Content:**
     - Time advance operations (old → new time)
     - Events triggered and executed
     - NPC schedule updates
     - Quest deadline failures
     - Moon phase changes
     - Weather changes
   - **Retention:** 30 days rolling

2. **Event Execution Log (Secondary):**
   - **Location:** `logs/events-YYYY-MM-DD.log`
   - **Format:** JSON lines (one event per line)
   - **Content:**
     - Event ID, name, trigger time
     - Execution duration
     - State updates applied
     - Success/failure status
     - Error messages if failed
   - **Retention:** 90 days rolling

3. **Time Anomaly Log (Tertiary):**
   - **Location:** `logs/time-anomalies.log`
   - **Format:** Plain text with timestamps
   - **Content:**
     - Time advances > 200ms
     - Event execution > 500ms
     - Invalid time calculations
     - Calendar validation failures
   - **Retention:** Indefinite (investigate anomalies)

**Metrics Collection:**

| Metric | Source | Purpose | Storage |
|--------|--------|---------|---------|
| **Time Advances Per Session** | TimeManager | Track gameplay pace | session-YYYY-MM-DD.md |
| **Events Triggered Per Session** | EventScheduler | Monitor event frequency | calendar-YYYY-MM-DD.log |
| **Average Time Advance Duration** | TimeManager | Performance tracking | performance.log |
| **NPC Schedule Misses** | NPCScheduleTracker | Data quality monitoring | time-anomalies.log |
| **Quest Deadline Failures** | QuestDeadlineMonitor | Track player engagement | session-YYYY-MM-DD.md |
| **Calendar Save Frequency** | CalendarManager | I/O load monitoring | performance.log |

**Tracing:**
- Each time advance operation gets unique ID
- Event execution traces include parent time advance ID
- State propagation traces link to triggering event
- All logs include session ID for correlation

**Debug Mode:**
- Enable via environment variable: `DEBUG_CALENDAR=true`
- Logs every event check (even non-triggered)
- Displays full event definitions before execution
- Shows NPC schedule calculations in detail
- Traces state propagation step-by-step

**Calendar Health Dashboard (Future - Epic 5):**
- Current in-game date/time
- Events pending in next 24 hours
- NPC schedule overview
- Moon phase calendar
- Recent event history (last 10 events)

**Log Format Example:**
```
# Calendar Activity Log: 2025-10-29

[2025-10-29T14:30:00Z] [INFO] Time advance: 2024-03-10 14:30 → 2024-03-10 16:30 (120 min, reason: "manual command")
[2025-10-29T14:30:02Z] [INFO] Event triggered: evt_042 "Zombie Siege" at village-of-barovia
[2025-10-29T14:30:03Z] [INFO] Event executed: evt_042 (duration: 487ms, status: completed, updates: 5)
[2025-10-29T14:30:03Z] [INFO] NPC schedule update: ireena_kolyana moved to burgomaster-mansion/chapel
[2025-10-29T14:30:03Z] [INFO] NPC schedule update: ismark_kolyanovich moved to blood-of-vine-tavern
[2025-10-29T14:30:03Z] [INFO] Moon phase: waxing_gibbous (next full moon: 2024-03-15)
[2025-10-29T14:30:03Z] [INFO] Weather: Heavy fog, 45°F, reduced visibility
[2025-10-29T14:30:04Z] [INFO] Calendar saved to disk
[2025-10-29T14:30:04Z] [INFO] Time advance completed (total duration: 187ms)
```

**Related Architecture Sections:**
- Architecture §14.3: Monitoring and Profiling
- Architecture §15.4: Observability

## Dependencies and Integrations

**External Dependencies:**

| Dependency | Version | Purpose | Source | License |
|------------|---------|---------|--------|---------|
| **date-fns** | ^2.30.0 | Date/time calculations and parsing | npm | MIT |
| **yaml** | ^2.3.4 | YAML parsing (from Epic 1) | npm | ISC |
| **lodash** | ^4.17.21 | Utility functions (deep clone, merge) | npm | MIT |

**Internal Dependencies (from Epic 1):**

| Dependency | Epic | Purpose | Location |
|------------|------|---------|----------|
| **LocationLoader** | 1 | Load location files | src/data/location-loader.js |
| **StateManager** | 1 | Update State.md files | src/core/state-manager.js |
| **SessionManager** | 1 | Get current session context | src/core/session-manager.js |
| **SessionLogger** | 1 | Log time advances and events | src/core/session-logger.js |
| **LLMNarrator** | 1 | Generate event narratives | src/core/llm-narrator.js |
| **GitIntegration** | 1 | Commit calendar changes | src/utils/git-utils.js |
| **FileWatcher** | 1 | Detect calendar.yaml changes | src/utils/file-watcher.js |

**System Dependencies:**

| Dependency | Version | Purpose | Availability |
|------------|---------|---------|--------------|
| **Node.js date APIs** | Built-in | Date calculations | Standard library |
| **File System APIs** | Built-in | Read/write calendar.yaml | Standard library |

**API Integrations:**

**None** - Epic 2 has no external API dependencies

**Internal Integrations:**

1. **LocationLoader Integration:**
   - **Purpose:** Load Events.md files for event definitions
   - **Integration Point:** EventExecutor.loadEventDefinition()
   - **Data Flow:** EventExecutor → LocationLoader → Events.md

2. **StateManager Integration:**
   - **Purpose:** Update State.md files with time-based changes
   - **Integration Point:** WorldStatePropagator.applyUpdates()
   - **Data Flow:** StateChange → StateManager → State.md write

3. **SessionLogger Integration:**
   - **Purpose:** Log time advances and events to session logs
   - **Integration Point:** TimeManager.advanceTime() callback
   - **Data Flow:** TimeAdvanceResult → SessionLogger → session-YYYY-MM-DD.md

4. **LLMNarrator Integration:**
   - **Purpose:** Generate narrative descriptions of events
   - **Integration Point:** EventExecutor.generateEventNarrative()
   - **Data Flow:** Event + Context → LLMNarrator → Narrative text

**File System Structure Integration:**

```
kapi-s-rpg/
├── game-data/
│   ├── locations/
│   │   ├── village-of-barovia/
│   │   │   ├── Events.md          (READ by EventExecutor)
│   │   │   ├── State.md           (READ/WRITE by StateManager)
│   │   │   └── NPCs.md            (READ/WRITE by NPCScheduleTracker)
│   │   └── ...
│   ├── quests/
│   │   └── active-quests.yaml     (READ/WRITE by QuestDeadlineMonitor)
│   └── calendar.yaml              (READ/WRITE by CalendarManager)
├── logs/
│   ├── calendar-YYYY-MM-DD.log    (WRITE by TimeManager)
│   └── events-YYYY-MM-DD.log      (WRITE by EventExecutor)
```

**Configuration Files:**

1. **calendar.yaml (Primary):**
   - All calendar data and state
   - Created by CalendarManager.initializeCalendar()
   - See Data Models section for schema

2. **No additional config files required**

**Dependency Installation:**
```bash
# Install new dependencies for Epic 2
npm install date-fns lodash

# No changes to Epic 1 dependencies
```

**Version Compatibility:**
- **date-fns 2.x:** Stable, well-tested date library
- **lodash 4.x:** Industry standard utility library
- **Backward compatible:** Epic 2 does not break Epic 1 functionality

**Related Architecture Sections:**
- Architecture §3.1: Technology Stack
- Architecture §8: Data Structure Specifications

## Acceptance Criteria (Authoritative)

**Source:** GDD Epic 2, Architecture §5

### AC-1: Calendar Data Structure
**Given** a new game is initialized
**When** CalendarManager.initializeCalendar() is called
**Then** calendar.yaml must be created with valid structure per schema
**And** all required fields must be present (currentDate, currentTime, mode, events, npcSchedules, moonPhases)
**And** file must be valid YAML parseable by yaml library
**And** calendar must validate against schema

**Verification Method:** Unit test + manual file inspection

### AC-2: Manual Time Advancement
**Given** an active session with calendar loaded
**When** user executes `/advance-time 2 hours`
**Then** currentDate and currentTime must advance by exactly 2 hours
**And** if time crosses midnight, date must increment correctly
**And** calendar.yaml must be updated and saved
**And** operation must complete in < 200ms (excluding events)
**And** time advance logged to session log

**Verification Method:** Integration test + performance test

### AC-3: Event Triggering (Date/Time)
**Given** calendar contains scheduled event with triggerDate "2024-03-13" and triggerTime "06:00"
**When** time advances from "2024-03-12 23:00" to "2024-03-13 08:00"
**Then** event must be detected as triggered
**And** EventExecutor.execute() must be called
**And** event status must change to "completed"
**And** event must appear in eventHistory

**Verification Method:** Integration test with mock events

### AC-4: Event Execution and State Update
**Given** event "Death of Burgomaster Kolyan" is triggered
**When** EventExecutor.execute() runs
**Then** event definition must be loaded from Events.md
**And** NPC status "kolyan_indirovich" must be updated to "Dead"
**And** State.md in village-of-barovia must be updated
**And** event must complete in < 500ms
**And** execution result must indicate success

**Verification Method:** Integration test with real location files

### AC-5: World State Propagation
**Given** NPC "kolyan_indirovich" dies
**When** WorldStatePropagator.propagateChange() is called
**Then** related NPCs (ireena_kolyana, ismark_kolyanovich) must be updated
**And** quest "escort_ireena" must change status to "Active"
**And** all affected NPCs.md files must be written
**And** propagation must complete in < 1 second
**And** at least 3 state updates must be applied

**Verification Method:** Integration test with relationship graph

### AC-6: NPC Schedule Tracking
**Given** calendar contains NPC schedule for "ireena_kolyana"
**When** time advances to "08:00"
**Then** NPCScheduleTracker must update ireena's location to match schedule
**And** location must be "burgomaster-mansion/chapel" (per schedule)
**And** activity must be "Morning prayers"
**And** update must complete in < 100ms
**And** NPCs.md must be updated with new location

**Verification Method:** Integration test with sample schedules

### AC-7: NPC Schedule Overrides
**Given** calendar contains schedule override for "ireena_kolyana" when "burgomaster_dead" condition is true
**When** time advances and burgomaster_dead flag is set
**Then** override routine must be used instead of default routine
**And** ireena's location must match override schedule
**And** activity must reflect override (e.g., "Grieving")

**Verification Method:** Integration test with conditional schedules

### AC-8: Quest Deadline Monitoring
**Given** active quest with deadline "2024-03-15 23:00"
**When** time advances past "2024-03-15 23:00" without quest completion
**Then** QuestDeadlineMonitor must detect failed deadline
**And** quest status must change to "failed"
**And** quest failure effects must be applied (e.g., NPC deaths)
**And** quest must be moved to failed-quests.yaml
**And** failure logged to session log

**Verification Method:** Integration test with time-sensitive quests

### AC-9: Moon Phase Calculation
**Given** calendar tracks moon phases
**When** time advances to date matching nextFullMoon
**Then** currentPhase must update to "full_moon"
**And** nextNewMoon must be calculated (14 days later)
**And** moon phase must be included in calendar display
**And** calculation must be deterministic (same date always gives same phase)

**Verification Method:** Unit test with known moon phase dates

### AC-10: Weather Generation
**Given** time advances to new date/time
**When** WeatherGenerator.generate() is called
**Then** weather conditions must be returned (condition, temperature, visibility)
**And** weather must respect seasonal patterns (cold in winter, warm in summer)
**And** weather must include atmospheric description (LLM-friendly)
**And** full moon must override weather to "Clear skies"

**Verification Method:** Unit test + integration test with seasons

### AC-11: Calendar Command Display
**Given** an active session with calendar loaded
**When** user executes `/calendar`
**Then** display must show: current date, current time, day name, moon phase
**And** display must list next 5 upcoming events with dates/times
**And** display must show current weather conditions
**And** display must show current season and seasonal effects
**And** command must execute in < 100ms

**Verification Method:** Manual test + integration test

### AC-12: Automatic Time Advancement (Travel)
**Given** player travels from "village-of-barovia" to "vallaki"
**When** NavigationHandler.travel() is called
**Then** travel time (4 hours) must be automatically calculated from metadata.yaml
**And** TimeManager.advanceTime(240, "travel") must be called
**And** time must advance by 4 hours
**And** any events during travel must be triggered
**And** arrival narrative must include time context ("as evening falls")

**Verification Method:** Integration test with travel workflow

## Traceability Mapping

| AC ID | Requirement Source | Spec Section | Components | Test Approach |
|-------|-------------------|--------------|------------|---------------|
| **AC-1** | Architecture §5.1 | Data Models (Calendar Schema) | CalendarManager | Unit test: calendar-manager.test.js |
| **AC-2** | GDD Epic 2, Architecture §5.2 | APIs (TimeManager), Workflows (Manual Time Advance) | TimeManager, CalendarManager | Integration test: time-advance.test.js |
| **AC-3** | Architecture §5.3 | APIs (EventScheduler), Workflows (Event Triggering) | EventScheduler | Integration test: event-scheduler.test.js |
| **AC-4** | GDD Epic 2, Architecture §5.3 | APIs (EventExecutor), Workflows (Event Execution) | EventExecutor, StateManager | Integration test: event-execution.test.js |
| **AC-5** | GDD Epic 2, Architecture §5 | APIs (WorldStatePropagator), Workflows (State Propagation) | WorldStatePropagator, StateManager | Integration test: state-propagation.test.js |
| **AC-6** | Architecture §5.1 | APIs (NPCScheduleTracker), Workflows (NPC Schedule Tracking) | NPCScheduleTracker | Integration test: npc-schedules.test.js |
| **AC-7** | Architecture §5.1 | Data Models (NPCSchedule with overrides) | NPCScheduleTracker | Integration test: npc-schedule-overrides.test.js |
| **AC-8** | GDD Epic 2 | APIs (QuestDeadlineMonitor), Workflows (Quest Deadline) | QuestDeadlineMonitor | Integration test: quest-deadlines.test.js |
| **AC-9** | GDD Epic 2, Narrative Doc | APIs (MoonPhaseCalculator), Workflows (Moon Phase) | MoonPhaseCalculator | Unit test: moon-phase.test.js |
| **AC-10** | GDD Epic 2, Narrative Doc | APIs (WeatherGenerator) | WeatherGenerator | Unit test: weather-generator.test.js |
| **AC-11** | GDD Epic 2 | Commands (calendar-commands) | CalendarCommandHandler | Manual test + integration test: calendar-command.test.js |
| **AC-12** | GDD Epic 2, Architecture §5.2 | Workflows (Automatic Time Advancement) | TimeManager, NavigationHandler | Integration test: auto-time-advance.test.js |

**Coverage Analysis:**
- **10 modules** defined → All covered by acceptance criteria
- **6 workflows** defined → All covered (Manual time, Automatic time, Event execution, NPC schedules, Quest deadlines, Moon phase)
- **4 NFR categories** → All covered (Performance: AC-2,4,6,11; Security: implicitly covered; Reliability: AC-3,4; Observability: AC-11)
- **GDD Epic 2 goals** → Complete coverage (calendar tracking, event scheduling, NPC schedules, world state propagation, time-sensitive quests)

## Risks, Assumptions, Open Questions

### Risks

**R-1: Complex Event Dependencies (HIGH)**
- **Description:** Events may have complex dependency chains (Event A triggers Event B which triggers Event C), causing cascading failures or infinite loops
- **Impact:** System instability, unpredictable world state, performance degradation
- **Mitigation:**
  - Implement maximum event chain depth (10 levels)
  - Detect circular dependencies during event execution
  - Log warning if event chain exceeds 5 levels
  - Allow manual event disabling if problematic
- **Owner:** Developer

**R-2: Time Calculation Edge Cases (MEDIUM)**
- **Description:** Date/time calculations may have edge cases (leap years, month boundaries, timezone issues)
- **Impact:** Incorrect time advancement, events triggering at wrong times, calendar corruption
- **Mitigation:**
  - Use battle-tested date-fns library (handles edge cases)
  - Comprehensive unit tests for edge cases
  - ISO 8601 date format (unambiguous)
  - Store dates as UTC internally
  - Test leap year behavior (2024 is leap year)
- **Owner:** Developer

**R-3: NPC Schedule Conflicts (MEDIUM)**
- **Description:** NPCs may have conflicting schedule requirements (scheduled to be in two places at once due to overrides)
- **Impact:** Logic errors, NPCs appearing in wrong locations, immersion broken
- **Mitigation:**
  - Validate schedules on load (detect conflicts)
  - Override resolution priority (most specific wins)
  - Log warnings for schedule conflicts
  - Document best practices for schedule design
- **Owner:** Developer + Content Author (Epic 4)

**R-4: Performance Degradation with Many Events (MEDIUM)**
- **Description:** Checking hundreds of events on every time advance may become slow
- **Impact:** Time advance operations exceed 200ms target, poor user experience
- **Mitigation:**
  - Index events by trigger date (don't scan all events)
  - Lazy load event definitions (only load when triggered)
  - Benchmark with 500+ events in calendar
  - Implement event pruning (remove old completed events)
- **Owner:** Developer

**R-5: Calendar File Corruption (LOW)**
- **Description:** Manual editing or crashes during save may corrupt calendar.yaml
- **Impact:** Loss of time tracking, inability to continue game
- **Mitigation:**
  - Atomic file writes (write to temp, rename)
  - Schema validation on load (reject invalid calendars)
  - Automatic backup before major changes
  - Git history as recovery mechanism
- **Owner:** Developer

### Assumptions

**A-1: D&D Calendar System**
- Using simplified D&D calendar (Faerunian calendar with months like "Ches", "Tarsakh", etc.)
- Days of week: Terraday, Waterday, Earthday, etc.
- Player familiar with D&D calendar or doesn't care (real-world dates work too)
- Barovia-specific calendar differences handled narratively

**A-2: Time Advancement Frequency**
- Player advances time 10-30 times per session (not hundreds)
- Most time advances are small (< 8 hours)
- Long time skips (days/weeks) are rare
- Reasonable to check all events on each advance

**A-3: Event Complexity**
- Most events have simple effects (update 1-5 state values)
- Complex multi-location propagation is uncommon (< 20% of events)
- Event definitions fit in Events.md files (< 1KB per event)
- LLM can generate adequate event narratives without custom templates

**A-4: NPC Schedule Granularity**
- Hourly granularity sufficient (not minute-by-minute)
- NPCs can be "chunked" into time blocks (morning, afternoon, evening, night)
- Most NPCs have predictable routines (not chaotic movement)
- Player won't notice small schedule inconsistencies

**A-5: Moon Phase Realism**
- Simplified lunar cycle (28 days exactly, not 29.5)
- Moon phase affects gameplay but not astronomically accurate
- Player prioritizes gameplay over realism
- Full moon = werewolves is sufficient fantasy logic

**A-6: Weather Consistency**
- Weather changes gradually (not random every hour)
- Seasonal patterns are approximations (not meteorologically accurate)
- Weather primarily atmospheric (not complex gameplay effects until Epic 3)
- Barovia's cursed nature means unusual weather is acceptable

### Open Questions

**Q-1: Time Advancement Mode Default**
- **Question:** Should default mode be manual, automatic, or hybrid?
- **Options:**
  - A) Manual - Player explicitly controls time (full control, may forget)
  - B) Automatic - System advances time based on actions (realistic, may feel rushed)
  - C) Hybrid - Automatic for travel/combat, manual for exploration (best of both?)
- **Impact:** Affects player experience and pacing
- **Decision Needed By:** Start of Story 2-1 (Calendar Data Structure)
- **Recommendation:** Option C (Hybrid) - manual by default, automatic for travel (matches Architecture §5.2)

**Q-2: Event Execution Order**
- **Question:** How should simultaneous events be ordered?
- **Options:**
  - A) Priority-based (events have explicit priority field)
  - B) Chronological (order defined in calendar.yaml)
  - C) Dependency-based (analyze dependencies, execute in correct order)
- **Impact:** Affects event consistency and predictability
- **Decision Needed By:** Start of Story 2-3 (Event Scheduling System)
- **Recommendation:** Option A (Priority-based) - simple and explicit

**Q-3: NPC Schedule Persistence**
- **Question:** Should NPC positions persist in NPCs.md files or only in memory?
- **Options:**
  - A) Persist to NPCs.md - Survives session restarts, but frequent file writes
  - B) Memory only - Fast, but lost on session end (recalculate on next load)
  - C) Hybrid - Persist on session end only
- **Impact:** Performance vs. persistence tradeoff
- **Decision Needed By:** Start of Story 2-4 (NPC Schedule Tracking)
- **Recommendation:** Option C (Hybrid) - best balance (matches Architecture)

**Q-4: Event Narrative Generation Timing**
- **Question:** When should event narratives be generated?
- **Options:**
  - A) Immediately when event triggers (always)
  - B) Only if player present at location (lazy generation)
  - C) Generate on next location visit (deferred)
- **Impact:** Performance vs. immediacy tradeoff
- **Decision Needed By:** Start of Story 2-3 (Event Execution)
- **Recommendation:** Option B (Player present only) - avoid expensive LLM calls for off-screen events

**Q-5: Quest Deadline Granularity**
- **Question:** Should quest deadlines be date-only or date+time?
- **Options:**
  - A) Date only (midnight deadline) - Simple, but less flexible
  - B) Date + time - More precise, matches event system
  - C) Both (optional time) - Flexible but complex
- **Impact:** Quest design flexibility vs. implementation complexity
- **Decision Needed By:** Start of Story 2-7 (Quest Deadline Monitoring)
- **Recommendation:** Option B (Date + time) - consistency with event system

## Test Strategy Summary

### Test Levels

**Unit Tests (70% coverage goal):**
- **Scope:** Individual modules in isolation
- **Framework:** Jest
- **Mocking:** Mock file system, date library for determinism
- **Files:**
  - `tests/calendar/time-manager.test.js` - Time calculations
  - `tests/calendar/moon-phase-calculator.test.js` - Moon phase logic
  - `tests/calendar/weather-generator.test.js` - Weather randomization
  - `tests/calendar/event-scheduler.test.js` - Event trigger detection
- **Focus:**
  - Time calculation correctness (leap years, month boundaries)
  - Moon phase determinism
  - Event trigger matching (date ranges, conditions)
  - Edge cases (midnight, month end, year end)

**Integration Tests (20% coverage goal):**
- **Scope:** Module interactions with real Epic 1 dependencies
- **Framework:** Jest with real file I/O
- **Setup:** Create test calendar.yaml and location files
- **Files:**
  - `tests/integration/time-advance.test.js` - Full time advance workflow
  - `tests/integration/event-execution.test.js` - Event execution with state updates
  - `tests/integration/state-propagation.test.js` - Cascading state changes
  - `tests/integration/npc-schedules.test.js` - NPC schedule tracking
  - `tests/integration/quest-deadlines.test.js` - Quest failure on deadline
- **Focus:**
  - Workflow correctness (time advance → events → state updates)
  - File I/O correctness (calendar.yaml, State.md updates)
  - Integration with Epic 1 modules (StateManager, LocationLoader)
  - Performance (meet < 200ms targets)

**End-to-End Tests (10% coverage goal):**
- **Scope:** Complete workflows via commands
- **Framework:** Manual testing + automated scripts
- **Files:**
  - `tests/e2e/calendar-workflow.test.js` - Full session with time advances
  - `tests/e2e/multi-day-progression.test.js` - Advance through multiple days
- **Focus:**
  - User experience (commands work as expected)
  - Data persistence across session end/resume
  - Event history accumulation
  - Calendar display readability

### Test Data

**Sample Calendar:**
```yaml
# tests/fixtures/test-calendar.yaml
currentDate: "2024-03-10"
currentTime: "14:30"
currentDayName: "Terraday"
currentMonth: "Ches"
currentYear: 735
timeAdvancementMode: "manual"
scheduledEvents:
  - eventId: "test_event_001"
    name: "Test Event"
    triggerDate: "2024-03-11"
    triggerTime: "10:00"
    locationId: "test-location"
    eventType: "story"
    status: "pending"
npcSchedules:
  test_npc:
    locationId: "test-location"
    routine:
      - timeStart: "08:00"
        timeEnd: "12:00"
        activity: "Morning work"
        locationId: "test-location/workshop"
moonPhases:
  currentPhase: "waxing_gibbous"
  nextFullMoon: "2024-03-15"
  nextNewMoon: "2024-03-29"
currentSeason: "Early Spring"
eventHistory: []
```

**Mock Event Definitions:**
- Simple event (update single field)
- Complex event (propagate to multiple locations)
- Recurring event (daily, weekly)
- Conditional event (trigger on flag)

### Test Execution

**Local Development:**
```bash
npm run test:calendar       # Calendar-specific tests
npm run test:epic2          # All Epic 2 tests
npm run test:integration    # Integration tests (slower)
npm run test:watch          # Watch mode for TDD
```

**CI Pipeline:**
- Run unit tests on every commit
- Run integration tests on PR merge
- Run E2E tests nightly

### Coverage Targets

| Test Type | Target | Rationale |
|-----------|--------|-----------|
| **Unit Tests** | 95% for time/event logic | High confidence in calculations |
| **Integration Tests** | 80% for workflows | Validate module interactions |
| **End-to-End Tests** | Manual playtest of all ACs | Validate user experience |

### Test Scenarios by AC

- **AC-1:** Unit test for calendar schema validation
- **AC-2:** Integration test for time advance command
- **AC-3, AC-4:** Integration tests for event triggering and execution
- **AC-5:** Integration test for state propagation with mock locations
- **AC-6, AC-7:** Integration tests for NPC schedules with overrides
- **AC-8:** Integration test for quest deadline monitoring
- **AC-9:** Unit test for moon phase calculation with known dates
- **AC-10:** Unit test for weather generation (mock randomness)
- **AC-11:** Manual test for calendar display
- **AC-12:** Integration test for automatic time advance during travel

### Edge Cases to Test

1. **Time advances past midnight** - Date increments correctly
2. **Time advances past month end** - Month and date update correctly
3. **Time advances past year end** - Year increments correctly
4. **Leap year handling** - February 29th handled correctly (2024 is leap year)
5. **Multiple events at same time** - Priority ordering works
6. **Event triggers during event execution** - No infinite loops
7. **NPC schedule at midnight** - Transitions to next day's schedule
8. **Quest deadline exactly at current time** - Fails vs. passes logic
9. **Moon phase on exact full moon date** - Phase updates correctly
10. **Weather generation with seed** - Deterministic with same seed

### Performance Testing

**Load Testing:**
- Calendar with 500 scheduled events - measure trigger check time
- Time advance of 1 week - measure total processing time
- 100 consecutive small time advances - verify no memory leaks

**Benchmark Targets:**
- Time advance: < 200ms (AC-2)
- Event execution: < 500ms (AC-4)
- NPC schedule update: < 100ms (AC-6)
- State propagation: < 1 second (AC-5)

### Manual Testing Checklist

Before Epic 2 sign-off:
- [ ] Create calendar via `/calendar` command
- [ ] Advance time manually multiple times
- [ ] Verify events trigger at correct times
- [ ] Observe NPC schedule updates in NPCs.md
- [ ] Let quest deadline expire, verify failure
- [ ] Advance to full moon, verify moon phase display
- [ ] Travel between locations, verify automatic time advance
- [ ] Edit calendar.yaml manually, verify reload works
- [ ] Advance time past midnight, month end, year end
- [ ] Verify calendar persists across session end/resume
- [ ] Check all log files created correctly
- [ ] Review event history accumulation

### Definition of Done

Epic 2 is complete when:
✅ All 12 acceptance criteria verified passing
✅ Unit test coverage ≥ 95% for calendar modules
✅ Integration tests passing for all workflows
✅ Manual playtest completed successfully
✅ All P0/P1 performance targets met
✅ No critical bugs remaining
✅ Documentation complete (README, API docs)
✅ Code reviewed and merged
✅ sprint-status.yaml updated (epic-2 status = "contexted")
