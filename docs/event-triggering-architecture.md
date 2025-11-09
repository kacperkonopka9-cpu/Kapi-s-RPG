# Event Triggering Architecture - Epic 2

**Date:** 2025-11-08
**Author:** Architect
**Purpose:** Define event triggering mechanism for Story 2-3 Event Scheduler
**Status:** Research Complete

---

## Problem Statement

The game calendar needs to efficiently check and trigger events based on:
- **Time-based triggers** (datetime, recurring)
- **Condition-based triggers** (moon phase, weather, location)
- **State-based triggers** (NPC death, quest completion)
- **Location-based triggers** (player enters specific location)

**Requirements:**
- Must be performant (< 50ms check time)
- Must not miss events
- Must handle multiple simultaneous events
- Must support priority ordering
- Must prevent duplicate triggers

---

## Architecture Decision

### Chosen Approach: Hybrid Event System

**Combination of:**
1. **Time-based polling** for datetime/recurring events
2. **Hook-based triggering** for state changes
3. **Lazy evaluation** for conditional events

**Rationale:**
- Polling is simple for time-based events (check on time advancement)
- Hooks prevent missing state changes (trigger on StateManager updates)
- Lazy evaluation reduces unnecessary checks (evaluate conditions only when relevant)

---

## Trigger Type Implementations

### 1. DateTime Events (Polling)

**Trigger:** Specific date and time

**Implementation:**
```javascript
// Check on time advancement
function checkDateTimeEvents(currentDate, currentTime) {
  const triggerable = calendar.events.filter(event =>
    event.trigger_type === 'datetime' &&
    event.status === 'pending' &&
    event.trigger_date === currentDate &&
    event.trigger_time <= currentTime
  );

  return triggerable.sort((a, b) => comparePriority(a, b));
}
```

**When to Check:**
- After `CalendarManager.advanceTime()` is called
- Frequency: Only on time advancement (manual or automatic)

**Performance:** O(n) where n = pending datetime events (~10-20 typically)

---

### 2. Recurring Events (Polling with Caching)

**Trigger:** Daily, weekly, or monthly recurrence

**Implementation:**
```javascript
// Cache recurring events by time for fast lookup
class RecurringEventCache {
  constructor(events) {
    // Index: "08:00" => [church-bells, market-opening, ...]
    this.eventsByTime = this.buildTimeIndex(events);
  }

  checkRecurring(currentTime, dayOfWeek, dayOfMonth) {
    const events = this.eventsByTime[currentTime] || [];

    return events.filter(event => {
      if (event.recurrence === 'daily') return true;
      if (event.recurrence === 'weekly') return event.day_of_week === dayOfWeek;
      if (event.recurrence === 'monthly') return event.day_of_month === dayOfMonth;
      return false;
    });
  }
}
```

**When to Check:**
- After time advancement (same as datetime)
- Use cached index for O(1) lookup by time

**Performance:** O(1) lookup + O(m) filter where m = events at that time (~1-3 typically)

**Optimization:** Pre-build time index at calendar load, rebuild only when events added/removed

---

### 3. Conditional Events (Lazy Evaluation)

**Trigger:** Boolean expression (e.g., "moon_phase == full AND player_location == forest")

**Implementation:**
```javascript
// Only check when relevant context changes
function checkConditionalEvents(changedContext) {
  // changedContext: { moon_phase: "full", player_location: "forest" }

  const relevantEvents = calendar.events.filter(event =>
    event.trigger_type === 'conditional' &&
    event.status === 'pending' &&
    eventReferencesContext(event.condition, changedContext)
  );

  // Evaluate conditions
  return relevantEvents.filter(event =>
    evaluateCondition(event.condition, getCurrentGameState())
  );
}

function eventReferencesContext(condition, changedContext) {
  // Parse condition to see if it references changed variables
  // e.g., "moon_phase == full" references moon_phase
  const variables = extractVariables(condition);
  return variables.some(v => v in changedContext);
}
```

**When to Check:**
- Moon phase changes (once per day)
- Weather changes (every 6 hours)
- Player location changes (on /travel)
- Time of day changes (hourly boundaries)

**Performance:** O(n) where n = conditional events, but only checked when context changes (~5-10 checks per session)

**Optimization:** Index events by variables they reference (moon_phase events, location events, etc.)

---

### 4. State Change Events (Hook-Based)

**Trigger:** State.md value changes (e.g., NPC status becomes "dead")

**Implementation:**
```javascript
// Register hooks in StateManager
class StateManager {
  async updateState(locationId, stateChanges) {
    // ... existing update logic ...

    // After state written, trigger state-change events
    await this.notifyStateChangeHooks(locationId, stateChanges);
  }

  async notifyStateChangeHooks(locationId, changes) {
    const stateChangeEvents = calendar.events.filter(event =>
      event.trigger_type === 'state_change' &&
      event.watch_location === locationId &&
      event.status === 'watching'
    );

    for (const event of stateChangeEvents) {
      const watchedKey = event.watch_state_key; // "npc_states.ismark.status"
      const newValue = getNestedValue(changes, watchedKey);

      if (newValue && evaluateCondition(event.watch_condition, { [watchedKey]: newValue })) {
        await eventExecutor.execute(event);
      }
    }
  }
}
```

**When to Check:**
- Immediately after StateManager.updateState() writes to file
- Hook-based, no polling required

**Performance:** O(n) where n = state-change events watching that location (~1-3 typically)

**Advantage:** Never misses state changes, triggers immediately

---

### 5. Location Enter Events (Hook-Based)

**Trigger:** Player enters specific location

**Implementation:**
```javascript
// In NavigationHandler.travel()
async function travel(targetLocationId) {
  // ... existing travel logic ...

  await sessionManager.updateCurrentLocation(targetLocationId);

  // Trigger location-enter events
  await checkLocationEnterEvents(targetLocationId);
}

function checkLocationEnterEvents(locationId) {
  return calendar.events.filter(event =>
    event.trigger_type === 'location_enter' &&
    event.location === locationId &&
    event.status === 'pending'
  );
}
```

**When to Check:**
- After successful /travel command
- Hook-based, triggered by navigation

**Performance:** O(n) where n = location-enter events (~5-10 typically)

---

## Event Scheduler Design

### EventScheduler Class

```javascript
class EventScheduler {
  constructor(calendar, stateManager) {
    this.calendar = calendar;
    this.stateManager = stateManager;

    // Build indexes for fast lookup
    this.recurringCache = new RecurringEventCache(calendar.events);
    this.conditionalIndex = this.buildConditionalIndex(calendar.events);

    // Register state change hooks
    this.registerStateChangeHooks();
  }

  /**
   * Main entry point: check for triggerable events
   * Called after time advancement or context changes
   */
  async checkEvents(changedContext = {}) {
    const triggerable = [];

    // 1. Check datetime events (if time advanced)
    if ('current_time' in changedContext) {
      triggerable.push(...this.checkDateTimeEvents());
    }

    // 2. Check recurring events (if time advanced)
    if ('current_time' in changedContext) {
      triggerable.push(...this.recurringCache.checkRecurring(
        this.calendar.current.time,
        this.calendar.current.day_of_week,
        this.calendar.current.day_of_month
      ));
    }

    // 3. Check conditional events (if relevant context changed)
    triggerable.push(...this.checkConditionalEvents(changedContext));

    // Sort by priority
    triggerable.sort((a, b) => this.comparePriority(a.priority, b.priority));

    return triggerable;
  }

  /**
   * Execute triggered events
   */
  async executeTriggers(events) {
    for (const event of events) {
      try {
        await this.executeEvent(event);

        // Update event status
        event.status = event.repeating ? 'pending' : 'completed';

        // Log to history
        this.calendar.history.push({
          timestamp: this.calendar.current.date + ' ' + this.calendar.current.time,
          event_id: event.id,
          location: event.location,
          result: 'triggered_successfully'
        });

      } catch (error) {
        console.error(`Event ${event.id} failed:`, error);
        this.calendar.history.push({
          timestamp: this.calendar.current.date + ' ' + this.calendar.current.time,
          event_id: event.id,
          location: event.location,
          result: 'failed'
        });
      }
    }

    // Save calendar with updated statuses
    await this.calendar.save();
  }
}
```

---

## Check Frequency Strategy

### When to Run Event Checks

| Trigger Point | Events Checked | Frequency | Performance Cost |
|---------------|----------------|-----------|------------------|
| Time advancement | datetime, recurring | 5-10 times/session | ~5ms |
| Location change | location_enter, some conditional | 3-5 times/session | ~2ms |
| State update | state_change (hook) | 1-2 times/session | ~1ms |
| Moon phase change | conditional (moon-related) | 1 time/day | ~3ms |
| Weather change | conditional (weather-related) | 4 times/day | ~3ms |

**Total Overhead:** ~20ms per session (well under 50ms target)

---

## Priority System

**Priority Levels:**
- `critical`: Interrupt gameplay immediately (Strahd appears)
- `high`: Execute before player action resolves (werewolf ambush during travel)
- `medium`: Execute after player action (NPC reacts to player's presence)
- `low`: Execute at end of turn (atmospheric events, background sounds)

**Execution Order:**
1. Sort events by priority (critical → high → medium → low)
2. Within same priority, sort by trigger_time (earlier first)
3. Execute in order, allowing player choice to interrupt

---

## Preventing Duplicate Triggers

### Problem
Event could trigger multiple times if checked repeatedly without status update

### Solution
```javascript
// Mark event as 'triggered' immediately
async function executeEvent(event) {
  // 1. Atomically mark as triggered
  event.status = 'triggered';
  await calendar.save();

  // 2. Execute event logic
  try {
    await eventExecutor.execute(event);
    event.status = event.repeating ? 'pending' : 'completed';
  } catch (error) {
    event.status = 'failed';
    throw error;
  }

  // 3. Save final status
  await calendar.save();
}
```

**Race Condition Protection:**
- Status changed to 'triggered' before execution
- Filter excludes 'triggered' events from future checks
- Only 'pending' or 'active' events can trigger

---

## Performance Benchmarks

### Target Performance
- Event check: < 50ms
- Event execution: < 200ms (excluding LLM calls)
- Total overhead: < 5% of session time

### Optimization Strategies

**1. Indexing:**
```javascript
// Pre-build indexes at calendar load
recurringEventsByTime: Map<string, Event[]>
conditionalEventsByVariable: Map<string, Event[]>
stateChangeEventsByLocation: Map<string, Event[]>
```

**2. Lazy Loading:**
```javascript
// Don't load event_file content until event triggers
// Store only reference: "Events.md#strahd-visit"
```

**3. Caching:**
```javascript
// Cache current NPC locations (expensive schedule lookups)
npcLocationCache: Map<string, LocationInfo>
invalidateCache() // on time advancement
```

**4. Batch Processing:**
```javascript
// Execute multiple low-priority events in batch
const lowPriorityEvents = triggerable.filter(e => e.priority === 'low');
await executeBatch(lowPriorityEvents);
```

---

## Integration with Calendar Manager

### CalendarManager.advanceTime()

```javascript
async advanceTime(minutes) {
  // 1. Update current time
  this.updateCurrentTime(minutes);

  // 2. Check for triggered events
  const changedContext = { current_time: this.current.time };
  const triggerable = await this.eventScheduler.checkEvents(changedContext);

  // 3. Execute events
  if (triggerable.length > 0) {
    await this.eventScheduler.executeTriggers(triggerable);
  }

  // 4. Save calendar
  await this.save();
}
```

### SessionManager Integration

```javascript
// In SessionManager.recordAction()
async recordAction(action) {
  // ... existing action recording ...

  // Check for conditional events if action changes game state
  if (action.changesState) {
    const changedContext = { player_action: action.type };
    await calendar.eventScheduler.checkEvents(changedContext);
  }
}
```

---

## Error Handling

### Event Execution Failures

**Strategy:** Log failure, continue with other events

```javascript
try {
  await executeEvent(event);
} catch (error) {
  console.error(`Event ${event.id} failed:`, error.message);

  // Log failure
  calendar.history.push({
    timestamp: getCurrentTimestamp(),
    event_id: event.id,
    result: 'failed',
    error: error.message
  });

  // Mark event as failed (can be retried manually)
  event.status = 'failed';
}
```

### Missing Event Files

**Strategy:** Warn but don't crash

```javascript
if (!fs.existsSync(event.event_file)) {
  console.warn(`Event file not found: ${event.event_file}`);
  event.status = 'cancelled';
  return;
}
```

### Circular Dependencies

**Problem:** Event A triggers Event B which triggers Event A

**Solution:** Max recursion depth

```javascript
const MAX_CASCADE_DEPTH = 3;

async function executeWithDepth(event, depth = 0) {
  if (depth >= MAX_CASCADE_DEPTH) {
    console.warn(`Max cascade depth reached for ${event.id}`);
    return;
  }

  await execute(event);

  // Check for cascading events
  const cascaded = findCascadingEvents(event);
  for (const child of cascaded) {
    await executeWithDepth(child, depth + 1);
  }
}
```

---

## Testing Strategy

### Unit Tests

```javascript
describe('EventScheduler', () => {
  test('triggers datetime events at correct time', () => {
    calendar.current.time = "20:00";
    const events = scheduler.checkDateTimeEvents();
    expect(events).toContain(stradVisitEvent);
  });

  test('recurring events trigger daily', () => {
    calendar.current.time = "08:00";
    const events = scheduler.checkRecurringEvents();
    expect(events).toContain(churchBellEvent);
  });

  test('conditional events evaluate correctly', () => {
    calendar.moon.current_phase = "full";
    playerLocation = "svalich-woods";
    const events = scheduler.checkConditionalEvents({ moon_phase: "full" });
    expect(events).toContain(werewolfAttackEvent);
  });

  test('state change hooks trigger on NPC death', async () => {
    await stateManager.updateNPCState("village", "ismark", { status: "dead" });
    expect(eventExecutor.execute).toHaveBeenCalledWith(irenaGrievingEvent);
  });
});
```

### Integration Tests

```javascript
describe('Event System Integration', () => {
  test('full workflow: time advance triggers event', async () => {
    // Setup: Event at 20:00
    calendar.events.push(stradVisitEvent);

    // Action: Advance time to 20:00
    await calendarManager.advanceTime(60); // 19:00 → 20:00

    // Assert: Event triggered and logged
    expect(stradVisitEvent.status).toBe('completed');
    expect(calendar.history).toContainEqual(expect.objectContaining({
      event_id: 'strahd-visit-ireena-1',
      result: 'triggered_successfully'
    }));
  });
});
```

---

## Architecture Decisions Summary

| Decision | Rationale |
|----------|-----------|
| **Hybrid polling + hooks** | Polling for time-based, hooks for state changes - best of both worlds |
| **Lazy conditional evaluation** | Only check conditionals when relevant context changes - performance |
| **Priority-based execution** | Critical events interrupt gameplay, low-priority are background |
| **Status-based duplicate prevention** | 'triggered' status prevents race conditions |
| **Indexed lookups** | Pre-build indexes for O(1) recurring event lookup |
| **Hook registration in StateManager** | State changes trigger immediately, no polling lag |
| **Max cascade depth limit** | Prevents infinite loops from circular dependencies |

---

## Next Steps for Story 2-3

1. **Implement EventScheduler class** with all trigger type methods
2. **Build event indexes** at calendar load (recurring cache, conditional index)
3. **Register StateManager hooks** for state-change events
4. **Integrate with CalendarManager.advanceTime()**
5. **Add priority sorting** and execution order
6. **Implement duplicate prevention** with status transitions
7. **Add error handling** for missing files, failed executions
8. **Write comprehensive tests** (unit + integration)

**Design Status:** ✅ Complete - Ready for Story 2-3 Implementation
