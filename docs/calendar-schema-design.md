# Calendar Schema Design - Epic 2

**Date:** 2025-11-08
**Author:** Architect
**Purpose:** Define calendar.yaml schema for Epic 2 Game Calendar & Dynamic World System
**Status:** Design Complete

---

## Overview

The calendar system tracks in-game date/time, manages scheduled events, controls NPC schedules, and drives world state evolution. This document defines the YAML schema for `calendar.yaml` stored in the game root directory.

---

## Schema Definition

### Complete Example

```yaml
# calendar.yaml - Game Calendar State
# Location: {project-root}/calendar.yaml

# Current game time
current:
  date: "735-10-3"           # Barovian Calendar: Year-Month-Day
  time: "14:30"              # 24-hour format HH:MM
  day_of_week: "Fireday"     # Monday through Sunday equivalents
  season: "autumn"           # spring, summer, autumn, winter

# Time advancement configuration
advancement:
  mode: "hybrid"             # manual, automatic, hybrid
  auto_advance_on_travel: true
  auto_advance_on_rest: true
  auto_advance_on_combat: false  # Handled by combat system in Epic 3
  default_action_minutes: 10     # Default time for unspecified actions

# Moon phase tracking (critical for werewolf encounters)
moon:
  current_phase: "waning_gibbous"  # new, waxing_crescent, first_quarter, waxing_gibbous,
                                    # full, waning_gibbous, last_quarter, waning_crescent
  days_until_full: 5
  last_full_moon: "735-10-1"
  next_full_moon: "735-10-8"

# Weather system
weather:
  current: "foggy"           # clear, cloudy, foggy, light_rain, heavy_rain,
                             # light_snow, heavy_snow, thunderstorm, blizzard
  temperature: 8             # Celsius
  wind: "light"              # calm, light, moderate, strong, gale
  visibility: "poor"         # excellent, good, moderate, poor, very_poor
  last_updated: "735-10-3 14:00"
  forecast_next_6h: "foggy"

# Scheduled events (sorted by trigger time)
events:
  - id: "strahd-visit-ireena-1"
    trigger_type: "datetime"
    trigger_date: "735-10-3"
    trigger_time: "20:00"
    location: "village-of-barovia"
    event_file: "Events.md#strahd-checks-on-ireena"
    priority: "high"
    status: "pending"           # pending, triggered, completed, cancelled
    repeating: false

  - id: "church-bell-morning"
    trigger_type: "recurring"
    recurrence: "daily"
    trigger_time: "08:00"
    location: "village-of-barovia"
    event_file: "Events.md#church-bells"
    priority: "low"
    status: "active"

  - id: "werewolf-attack"
    trigger_type: "conditional"
    condition: "moon_phase == full AND player_location == forest"
    location: "svalich-woods"
    event_file: "Events.md#werewolf-ambush"
    priority: "high"
    status: "pending"

  - id: "npc-death-cascade"
    trigger_type: "state_change"
    watch_location: "village-of-barovia"
    watch_state_key: "npc_states.ismark_kolyanovich.status"
    watch_condition: "status == dead"
    cascading_effects:
      - location: "village-of-barovia"
        update_npc: "ireena_kolyana"
        state_changes:
          relationship_ismark: "deceased"
          mood: "grieving"
      - location: "vallaki"
        update_npc: "father_lucian"
        state_changes:
          knows_ismark_dead: true
    priority: "high"
    status: "watching"

# NPC Schedules
npc_schedules:
  - npc_id: "ismark_kolyanovich"
    location: "village-of-barovia"
    schedule:
      - time_block: "08:00-12:00"
        location: "burgomaster-mansion"
        activity: "guarding_ireena"
        description: "Ismark watches over his sister at home"

      - time_block: "12:00-13:00"
        location: "blood-of-the-vine-tavern"
        activity: "lunch"
        description: "Ismark eats at the tavern"

      - time_block: "13:00-18:00"
        location: "burgomaster-mansion"
        activity: "guarding_ireena"
        description: "Continues watch over Ireena"

      - time_block: "18:00-08:00"
        location: "burgomaster-mansion"
        activity: "sleeping"
        description: "Resting at home"

  - npc_id: "bildrath_cantemir"
    location: "village-of-barovia"
    schedule:
      - time_block: "09:00-17:00"
        location: "bildrath-mercantile"
        activity: "shopkeeping"
        description: "Running his store"

      - time_block: "17:00-09:00"
        location: "bildrath-home"
        activity: "closed"
        description: "Store closed, at home"

# Event history (last 50 events)
history:
  - timestamp: "735-10-3 08:00"
    event_id: "church-bell-morning"
    location: "village-of-barovia"
    result: "triggered_successfully"

  - timestamp: "735-10-2 20:15"
    event_id: "strahd-visit-manor"
    location: "burgomaster-mansion"
    result: "completed"

# Time tracking metadata
metadata:
  campaign_start_date: "735-10-1 08:00"
  real_world_session_count: 5
  total_in_game_hours: 54
  last_rest: "735-10-2 22:00"
  time_advancement_log: "logs/time-log.md"
```

---

## Field Definitions

### Current Time Block

**Purpose:** Track current in-game date and time

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | Yes | Format: "YYYY-MM-DD" using Barovian calendar |
| `time` | string | Yes | Format: "HH:MM" in 24-hour time |
| `day_of_week` | string | Yes | Moonday, Toilday, Wealday, Oathday, Fireday, Starday, Sunday |
| `season` | string | Yes | spring, summer, autumn, winter |

**Validation Rules:**
- Date must be valid Barovian calendar date
- Time must be 00:00 to 23:59
- Season auto-calculated from date

### Advancement Block

**Purpose:** Configure time advancement behavior

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | enum | "hybrid" | manual, automatic, hybrid |
| `auto_advance_on_travel` | boolean | true | Advance time when traveling |
| `auto_advance_on_rest` | boolean | true | Advance time during rests |
| `auto_advance_on_combat` | boolean | false | Advance time during combat (Epic 3) |
| `default_action_minutes` | integer | 10 | Default time for unspecified actions |

**Mode Behaviors:**
- **manual**: Time only advances via `/advance-time` command
- **automatic**: Time advances on all actions (travel, rest, exploration)
- **hybrid**: Automatic for major actions (travel, rest), manual for minor actions

### Moon Block

**Purpose:** Track moon phases for werewolf encounters and atmosphere

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `current_phase` | enum | Yes | new, waxing_crescent, first_quarter, waxing_gibbous, full, waning_gibbous, last_quarter, waning_crescent |
| `days_until_full` | integer | Yes | Days until next full moon |
| `last_full_moon` | string | Yes | Date of last full moon |
| `next_full_moon` | string | Yes | Date of next full moon |

**Calculation:**
- Moon cycle: 28 days
- Phases evenly distributed (3.5 days per phase)
- Full moon affects werewolf encounters and spellcasting

### Weather Block

**Purpose:** Track current weather conditions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `current` | enum | Yes | clear, cloudy, foggy, light_rain, heavy_rain, light_snow, heavy_snow, thunderstorm, blizzard |
| `temperature` | integer | Yes | Temperature in Celsius |
| `wind` | enum | Yes | calm, light, moderate, strong, gale |
| `visibility` | enum | Yes | excellent, good, moderate, poor, very_poor |
| `last_updated` | string | Yes | Timestamp of last weather update |
| `forecast_next_6h` | string | No | Predicted weather |

**Weather Effects:**
- Fog (common in Barovia) reduces visibility
- Heavy rain/snow affects travel time
- Temperature affects survival checks (Epic 3)

### Events Array

**Purpose:** Schedule triggered events

#### Event Object Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique event identifier (kebab-case) |
| `trigger_type` | enum | Yes | datetime, recurring, conditional, state_change, location_enter |
| `trigger_date` | string | Conditional | Required for datetime type |
| `trigger_time` | string | Conditional | Required for datetime/recurring |
| `recurrence` | enum | Conditional | daily, weekly, monthly (for recurring) |
| `condition` | string | Conditional | Boolean expression (for conditional) |
| `watch_location` | string | Conditional | Location to watch (for state_change) |
| `watch_state_key` | string | Conditional | State.md field to watch |
| `watch_condition` | string | Conditional | Trigger condition expression |
| `location` | string | Yes | Location ID where event occurs |
| `event_file` | string | Yes | Path to event definition (e.g., "Events.md#event-id") |
| `priority` | enum | Yes | low, medium, high, critical |
| `status` | enum | Yes | pending, triggered, completed, cancelled, active, watching |
| `repeating` | boolean | Yes | Whether event repeats |
| `cascading_effects` | array | No | State changes in other locations |

**Trigger Types:**
- **datetime**: Fires at specific date/time
- **recurring**: Fires repeatedly (daily bells, weekly market)
- **conditional**: Fires when condition met (moon phase + location)
- **state_change**: Fires when State.md value changes
- **location_enter**: Fires when player enters location

### NPC Schedules Array

**Purpose:** Define NPC daily routines

#### NPC Schedule Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `npc_id` | string | Yes | NPC identifier from NPCs.md |
| `location` | string | Yes | Home location of NPC |
| `schedule` | array | Yes | Array of time blocks |

#### Time Block Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `time_block` | string | Yes | Format: "HH:MM-HH:MM" (start-end) |
| `location` | string | Yes | Location ID during this time |
| `activity` | string | Yes | What NPC is doing |
| `description` | string | Yes | Narrative description for LLM |

**Usage:**
- LLM narrator uses schedules to describe NPC locations
- "You find Ismark at the tavern, eating lunch" vs "Ismark is at home guarding Ireena"

### History Array

**Purpose:** Log past events for debugging and narrative continuity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `timestamp` | string | Yes | When event occurred |
| `event_id` | string | Yes | Event identifier |
| `location` | string | Yes | Where event occurred |
| `result` | enum | Yes | triggered_successfully, completed, failed, skipped |

**Retention:** Keep last 50 events, archive older to logs/

### Metadata Block

**Purpose:** Campaign-wide time tracking

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `campaign_start_date` | string | Yes | When campaign began |
| `real_world_session_count` | integer | Yes | Number of play sessions |
| `total_in_game_hours` | integer | Yes | Total in-game time elapsed |
| `last_rest` | string | No | When player last rested |
| `time_advancement_log` | string | Yes | Path to time log file |

---

## Validation Rules

### Required Validations

1. **Date Format:** Must match "YYYY-MM-DD" pattern
2. **Time Format:** Must match "HH:MM" pattern (00:00 to 23:59)
3. **Unique Event IDs:** No duplicate event IDs
4. **Valid Enums:** All enum fields must use allowed values
5. **Time Block Ranges:** Start time < end time, no overlaps for same NPC
6. **Event References:** event_file must reference existing Events.md sections

### Optional Validations

1. **Location Existence:** Warn if location not in game-data/locations/
2. **NPC Existence:** Warn if npc_id not in location's NPCs.md
3. **Future Events:** Warn if datetime events are in the past

---

## File Operations

### Loading Calendar

```javascript
// CalendarManager.loadCalendar()
const yaml = require('js-yaml');
const fs = require('fs').promises;

const content = await fs.readFile('calendar.yaml', 'utf-8');
const calendar = yaml.load(content, { schema: yaml.SAFE_SCHEMA });
```

### Updating Current Time

```javascript
// Update time atomically (read → modify → write)
calendar.current.date = "735-10-4";
calendar.current.time = "08:00";
calendar.metadata.total_in_game_hours += 18;

await fs.writeFile('calendar.yaml', yaml.dump(calendar), 'utf-8');
```

### Adding Event

```javascript
calendar.events.push({
  id: "new-event",
  trigger_type: "datetime",
  trigger_date: "735-10-5",
  trigger_time: "12:00",
  location: "vallaki",
  event_file: "Events.md#festival",
  priority: "medium",
  status: "pending",
  repeating: false
});
```

---

## Integration Points

### Story 2-1: Calendar Data Structure
- Creates calendar.yaml with this schema
- Initializes with campaign start date
- Sets default advancement mode

### Story 2-2: Time Advancement Module
- Reads advancement block
- Updates current time
- Increments metadata.total_in_game_hours

### Story 2-3: Event Scheduler
- Checks events array against current time
- Triggers events whose conditions are met
- Updates event status

### Story 2-4: NPC Schedule Tracking
- Reads npc_schedules array
- Returns NPC current location based on time
- Provides activity description for LLM context

### Story 2-6: Event Execution Engine
- Loads event_file from Events.md
- Applies state changes to State.md
- Logs to history array

### Story 2-8: Moon Phase & Weather
- Updates moon block every day
- Randomizes weather block based on season
- Provides atmospheric context for LLM

### Story 2-9: World State Propagation
- Handles state_change event types
- Applies cascading_effects to multiple locations
- Updates State.md files via StateManager

---

## Performance Considerations

### Event Checking
- **Frequency:** Check events on:
  - Time advancement (manual or automatic)
  - Player location change
  - State.md file updates
- **Optimization:** Index events by trigger_date for fast lookup
- **Max Events:** Limit to 100 active events, archive completed

### NPC Schedule Lookup
- **Frequency:** On location load, when building LLM context
- **Optimization:** Cache schedule for current time block
- **Max Schedules:** ~50 NPCs with schedules (major NPCs only)

### File I/O
- **Read:** Load calendar.yaml once at session start
- **Write:** Update on time advancement, event trigger, state change
- **Atomicity:** Use atomic writes (read → modify → write)
- **Backup:** Git version control provides rollback

---

## Example Use Cases

### Use Case 1: Player Travels

```javascript
// Player uses /travel command
// Time advances automatically (advancement.auto_advance_on_travel = true)

// 1. Calculate travel time (2 hours)
const travelMinutes = 120;

// 2. Advance time
calendarManager.advanceTime(travelMinutes);
// current.time: "14:30" → "16:30"

// 3. Check for events during travel
const triggeredEvents = calendarManager.checkEvents();
// Returns: [werewolf-attack] (full moon + forest location)

// 4. Execute event
await eventExecutor.execute(triggeredEvents[0]);
```

### Use Case 2: NPC Location Query

```javascript
// Player looks around at 14:30
const currentTime = "14:30";
const npc = "ismark_kolyanovich";

const npcLocation = calendarManager.getNPCLocation(npc, currentTime);
// Returns: { location: "burgomaster-mansion", activity: "guarding_ireena" }

// LLM context includes: "Ismark is at home, vigilantly watching over his sister"
```

### Use Case 3: Recurring Event

```javascript
// Church bells at 08:00 every day
// Event type: recurring, recurrence: daily

// On time advancement to 08:00:
const event = {
  id: "church-bell-morning",
  trigger_type: "recurring",
  recurrence: "daily",
  trigger_time: "08:00"
};

// Check triggers daily at 08:00
if (currentTime === "08:00") {
  await eventExecutor.execute(event);
  // Adds atmospheric detail to location description
}
```

### Use Case 4: State Change Cascade

```javascript
// Ismark dies in combat
await stateManager.updateNPCState("village-of-barovia", "ismark_kolyanovich", {
  status: "dead"
});

// Triggers state_change event
const cascadeEvent = findEventByType("state_change");
// watch_state_key: "npc_states.ismark_kolyanovich.status"
// watch_condition: "status == dead"

// Apply cascading effects
for (const effect of cascadeEvent.cascading_effects) {
  await stateManager.updateNPCState(effect.location, effect.update_npc, effect.state_changes);
}
// Ireena's mood becomes "grieving"
// Father Lucian in Vallaki learns of death
```

---

## Schema Version

**Version:** 1.0
**Epic:** 2
**Last Updated:** 2025-11-08
**Stability:** Design Complete, Ready for Implementation

---

## Next Steps

1. **Story 2-1:** Implement CalendarManager.createCalendar() to generate this schema
2. **Story 2-2:** Implement CalendarManager.advanceTime()
3. **Story 2-3:** Implement EventScheduler to check events array
4. **Story 2-4:** Implement NPCScheduler.getNPCLocation()
5. **Story 2-6:** Implement EventExecutor to process triggered events
6. **Story 2-8:** Implement MoonPhaseCalculator and WeatherGenerator
7. **Story 2-9:** Implement CascadeManager for state propagation

**Design Status:** ✅ Complete - Ready for Implementation
