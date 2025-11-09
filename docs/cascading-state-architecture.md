# Cascading State Architecture - Epic 2

**Date:** 2025-11-08
**Author:** Architect
**Purpose:** Define cascading state propagation system for Story 2-9
**Status:** Design Complete

---

## Problem Statement

The game world must react realistically to state changes through cascading effects:

**Examples:**
- **NPC Death:** Ismark dies → Ireena grieves → Father Lucian learns of it → Quest fails → Faction reputation changes
- **Quest Completion:** Sunsword found → Strahd becomes aware → Castle security increases → NPC dialogue changes
- **Location Destruction:** Church burns → Father Lucian relocates → Services unavailable → Quest chain blocks
- **Faction Shift:** Player betrays Vallakians → Guards hostile → Shops refuse service → Safe houses close

**Requirements:**
- Changes propagate across multiple locations
- Effects are ordered (dependencies respected)
- Updates are atomic (all or nothing)
- System is debuggable (trace cascade paths)
- Performance is acceptable (< 500ms for full cascade)

---

## Architecture Decision

### Chosen Approach: Event-Driven Cascade Manager

**Core Concepts:**
1. **Cascade Events** - Triggered when "watched" state changes
2. **Effect Chains** - Ordered list of state updates to apply
3. **Dependency Resolution** - Topological sort ensures correct order
4. **Transaction Pattern** - All updates succeed or all rollback
5. **Cascade Log** - Audit trail for debugging

**Rationale:**
- Event-driven allows immediate propagation (no polling)
- Dependency graph ensures correct ordering
- Transaction pattern prevents partial cascades
- Logging enables debugging and rollback

---

## Cascade Event Structure

### In calendar.yaml

```yaml
events:
  - id: "ismark-death-cascade"
    trigger_type: "state_change"
    watch_location: "village-of-barovia"
    watch_state_key: "npc_states.ismark_kolyanovich.status"
    watch_condition: "status == 'dead'"
    priority: "high"
    status: "watching"

    # Cascade effects - ordered execution
    cascading_effects:
      # Effect 1: Ireena grieves (same location)
      - effect_id: "ireena-grieves"
        location: "village-of-barovia"
        target_type: "npc_state"
        target_id: "ireena_kolyana"
        state_changes:
          mood: "grieving"
          relationship_ismark: "deceased_brother"
          dialogue_state: "mourning"
        dependencies: []  # No dependencies, execute first

      # Effect 2: Father Lucian learns (different location)
      - effect_id: "lucian-learns-death"
        location: "vallaki"
        target_type: "npc_state"
        target_id: "father_lucian"
        state_changes:
          knows_ismark_dead: true
          mood: "sorrowful"
          dialogue_options_add: ["discuss_ismark_death"]
        dependencies: []  # Independent, can run in parallel with Effect 1

      # Effect 3: Quest fails
      - effect_id: "protect-ismark-quest-fails"
        location: "village-of-barovia"
        target_type: "quest_state"
        target_id: "protect-ismark"
        state_changes:
          status: "failed"
          failure_reason: "ismark_died"
        dependencies: ["ireena-grieves"]  # Wait for Ireena update first

      # Effect 4: Faction reputation decreases
      - effect_id: "barovia-villagers-blame-player"
        location: "global"
        target_type: "faction_reputation"
        target_id: "barovia_villagers"
        state_changes:
          reputation: -10
          reason: "failed_to_protect_ismark"
        dependencies: ["protect-ismark-quest-fails"]  # After quest marked failed
```

---

## Cascade Manager Design

### Class Structure

```javascript
/**
 * CascadeManager - Orchestrates cascading state changes
 *
 * Responsibilities:
 * - Detect watched state changes (via StateManager hooks)
 * - Resolve effect dependencies (topological sort)
 * - Execute effects in correct order
 * - Ensure atomic updates (transaction pattern)
 * - Log cascade execution for debugging
 */
class CascadeManager {
  constructor(calendar, stateManager) {
    this.calendar = calendar;
    this.stateManager = stateManager;
    this.cascadeLog = [];
  }

  /**
   * Trigger cascade when watched state changes
   * Called by StateManager hook
   */
  async triggerCascade(locationId, stateKey, newValue) {
    // Find matching cascade events
    const cascadeEvents = this.findMatchingCascades(locationId, stateKey, newValue);

    if (cascadeEvents.length === 0) return;

    // Execute each cascade
    for (const event of cascadeEvents) {
      await this.executeCascade(event);
    }
  }

  /**
   * Execute a single cascade event with all its effects
   */
  async executeCascade(cascadeEvent) {
    console.log(`🌊 Executing cascade: ${cascadeEvent.id}`);

    const cascadeId = `cascade-${Date.now()}-${cascadeEvent.id}`;
    const cascadeEntry = {
      cascade_id: cascadeId,
      event_id: cascadeEvent.id,
      trigger_time: new Date().toISOString(),
      effects: [],
      status: 'in_progress'
    };

    try {
      // 1. Resolve effect dependencies
      const executionOrder = this.resolveExecutionOrder(cascadeEvent.cascading_effects);

      // 2. Begin transaction
      const transaction = new CascadeTransaction();

      // 3. Execute effects in order
      for (const effect of executionOrder) {
        console.log(`  ├─ Executing effect: ${effect.effect_id}`);

        const result = await this.executeEffect(effect, transaction);

        cascadeEntry.effects.push({
          effect_id: effect.effect_id,
          status: result.success ? 'completed' : 'failed',
          error: result.error || null
        });

        if (!result.success) {
          throw new Error(`Effect ${effect.effect_id} failed: ${result.error}`);
        }
      }

      // 4. Commit transaction
      await transaction.commit();

      cascadeEntry.status = 'completed';
      console.log(`✅ Cascade completed: ${cascadeEvent.id}`);

    } catch (error) {
      // Rollback all changes
      await transaction.rollback();

      cascadeEntry.status = 'failed';
      cascadeEntry.error = error.message;

      console.error(`❌ Cascade failed: ${cascadeEvent.id}`, error);
    }

    // Log cascade execution
    this.cascadeLog.push(cascadeEntry);
  }

  /**
   * Resolve execution order using topological sort
   * Ensures dependencies execute before dependents
   */
  resolveExecutionOrder(effects) {
    // Build dependency graph
    const graph = new Map();
    const inDegree = new Map();

    for (const effect of effects) {
      graph.set(effect.effect_id, effect);
      inDegree.set(effect.effect_id, effect.dependencies.length);
    }

    // Topological sort (Kahn's algorithm)
    const queue = effects.filter(e => e.dependencies.length === 0);
    const executionOrder = [];

    while (queue.length > 0) {
      const current = queue.shift();
      executionOrder.push(current);

      // Find dependents
      for (const effect of effects) {
        if (effect.dependencies.includes(current.effect_id)) {
          inDegree.set(effect.effect_id, inDegree.get(effect.effect_id) - 1);

          if (inDegree.get(effect.effect_id) === 0) {
            queue.push(effect);
          }
        }
      }
    }

    // Detect cycles
    if (executionOrder.length !== effects.length) {
      throw new Error('Circular dependency detected in cascade effects');
    }

    return executionOrder;
  }

  /**
   * Execute a single effect within a transaction
   */
  async executeEffect(effect, transaction) {
    try {
      switch (effect.target_type) {
        case 'npc_state':
          await this.updateNPCState(effect, transaction);
          break;

        case 'quest_state':
          await this.updateQuestState(effect, transaction);
          break;

        case 'faction_reputation':
          await this.updateFactionReputation(effect, transaction);
          break;

        case 'location_state':
          await this.updateLocationState(effect, transaction);
          break;

        default:
          throw new Error(`Unknown target_type: ${effect.target_type}`);
      }

      return { success: true };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update NPC state (most common cascade type)
   */
  async updateNPCState(effect, transaction) {
    const { location, target_id, state_changes } = effect;

    // Record operation in transaction
    transaction.addOperation({
      type: 'npc_state_update',
      location,
      npc_id: target_id,
      changes: state_changes
    });

    // Apply changes via StateManager
    await this.stateManager.updateNPCState(location, target_id, state_changes);
  }

  /**
   * Find cascade events matching state change
   */
  findMatchingCascades(locationId, stateKey, newValue) {
    return this.calendar.events.filter(event => {
      if (event.trigger_type !== 'state_change') return false;
      if (event.status !== 'watching') return false;
      if (event.watch_location !== locationId) return false;
      if (event.watch_state_key !== stateKey) return false;

      // Evaluate watch condition
      return this.evaluateCondition(event.watch_condition, { [stateKey]: newValue });
    });
  }
}
```

---

## Transaction Pattern

### CascadeTransaction Class

```javascript
/**
 * Transaction for atomic cascade execution
 * All effects succeed together or all rollback
 */
class CascadeTransaction {
  constructor() {
    this.operations = [];
    this.snapshots = new Map(); // location => state snapshot
  }

  /**
   * Add operation to transaction
   */
  addOperation(operation) {
    const { location } = operation;

    // Take snapshot before first operation on this location
    if (!this.snapshots.has(location)) {
      this.snapshots.set(location, this.takeSnapshot(location));
    }

    this.operations.push(operation);
  }

  /**
   * Take snapshot of location state for rollback
   */
  async takeSnapshot(locationId) {
    // Read current State.md
    const state = await stateManager.loadState(locationId);

    return {
      locationId,
      state: JSON.parse(JSON.stringify(state)), // Deep copy
      timestamp: Date.now()
    };
  }

  /**
   * Commit transaction - all changes are already applied
   * Just mark as committed
   */
  async commit() {
    console.log(`✅ Transaction committed: ${this.operations.length} operations`);
    this.operations = [];
    this.snapshots.clear();
  }

  /**
   * Rollback transaction - restore snapshots
   */
  async rollback() {
    console.log(`🔄 Rolling back transaction: ${this.operations.length} operations`);

    // Restore each location to snapshot state
    for (const [locationId, snapshot] of this.snapshots) {
      await this.stateManager.updateState(locationId, snapshot.state);
    }

    this.operations = [];
    this.snapshots.clear();
  }
}
```

---

## Integration with StateManager

### Hook Registration

```javascript
// In StateManager.constructor()
class StateManager {
  constructor(deps = {}) {
    // ... existing code ...

    this.cascadeManager = deps.cascadeManager || null;
  }

  /**
   * Update state with cascade triggering
   */
  async updateState(locationId, stateChanges) {
    // ... existing update logic ...

    // Trigger cascades for changed keys
    if (this.cascadeManager) {
      for (const [key, value] of Object.entries(stateChanges)) {
        await this.cascadeManager.triggerCascade(locationId, key, value);
      }
    }

    return { success: true };
  }
}
```

---

## Cascade Logging

### Log Format

```javascript
// logs/cascade-log.json
{
  "cascades": [
    {
      "cascade_id": "cascade-1699564800000-ismark-death-cascade",
      "event_id": "ismark-death-cascade",
      "trigger_time": "2025-11-08T14:30:00Z",
      "trigger_location": "village-of-barovia",
      "trigger_key": "npc_states.ismark_kolyanovich.status",
      "trigger_value": "dead",
      "status": "completed",
      "effects": [
        {
          "effect_id": "ireena-grieves",
          "execution_order": 1,
          "status": "completed",
          "duration_ms": 45
        },
        {
          "effect_id": "lucian-learns-death",
          "execution_order": 1,
          "status": "completed",
          "duration_ms": 42
        },
        {
          "effect_id": "protect-ismark-quest-fails",
          "execution_order": 2,
          "status": "completed",
          "duration_ms": 38
        },
        {
          "effect_id": "barovia-villagers-blame-player",
          "execution_order": 3,
          "status": "completed",
          "duration_ms": 35
        }
      ],
      "total_duration_ms": 160
    }
  ]
}
```

---

## Performance Optimization

### Batch Updates

```javascript
/**
 * Batch multiple state updates to same location
 */
function batchEffectsByLocation(effects) {
  const batches = new Map(); // location => effects[]

  for (const effect of effects) {
    if (!batches.has(effect.location)) {
      batches.set(effect.location, []);
    }
    batches.get(effect.location).push(effect);
  }

  return batches;
}

async function executeEffectBatch(location, effects) {
  // Combine all state_changes for this location
  const combinedChanges = {};

  for (const effect of effects) {
    Object.assign(combinedChanges, effect.state_changes);
  }

  // Single StateManager call instead of N calls
  await stateManager.updateState(location, combinedChanges);
}
```

**Performance Gain:** N separate State.md writes → 1 write per location

---

## Cascade Detection Prevention

### Problem: Infinite Loops

Cascade A triggers Cascade B which triggers Cascade A

### Solution: Max Depth Limit

```javascript
async function triggerCascade(locationId, stateKey, newValue, depth = 0) {
  const MAX_CASCADE_DEPTH = 5;

  if (depth >= MAX_CASCADE_DEPTH) {
    console.warn(`Max cascade depth ${MAX_CASCADE_DEPTH} reached - stopping to prevent infinite loop`);
    return;
  }

  // ... cascade execution ...

  // Recursive cascades increment depth
  for (const effect of effects) {
    await triggerCascade(effect.location, effect.key, effect.value, depth + 1);
  }
}
```

---

## Debugging Tools

### Cascade Visualizer

```javascript
/**
 * Generate cascade graph for debugging
 */
function visualizeCascade(cascadeEvent) {
  console.log(`Cascade: ${cascadeEvent.id}`);
  console.log(`Trigger: ${cascadeEvent.watch_state_key} == ${cascadeEvent.watch_condition}`);
  console.log('');
  console.log('Effects:');

  const executionOrder = resolveExecutionOrder(cascadeEvent.cascading_effects);

  executionOrder.forEach((effect, index) => {
    const indent = '  '.repeat(effect.dependencies.length);
    console.log(`${indent}${index + 1}. ${effect.effect_id}`);
    console.log(`${indent}   → ${effect.location}/${effect.target_id}`);
    console.log(`${indent}   → ${Object.keys(effect.state_changes).join(', ')}`);

    if (effect.dependencies.length > 0) {
      console.log(`${indent}   (depends on: ${effect.dependencies.join(', ')})`);
    }
  });
}
```

**Output:**
```
Cascade: ismark-death-cascade
Trigger: npc_states.ismark_kolyanovich.status == dead

Effects:
  1. ireena-grieves
     → village-of-barovia/ireena_kolyana
     → mood, relationship_ismark, dialogue_state

  2. lucian-learns-death
     → vallaki/father_lucian
     → knows_ismark_dead, mood, dialogue_options_add

    3. protect-ismark-quest-fails
       → village-of-barovia/protect-ismark
       → status, failure_reason
       (depends on: ireena-grieves)

      4. barovia-villagers-blame-player
         → global/barovia_villagers
         → reputation, reason
         (depends on: protect-ismark-quest-fails)
```

---

## Testing Strategy

### Unit Tests

```javascript
describe('CascadeManager', () => {
  test('resolves dependencies correctly', () => {
    const effects = [
      { effect_id: 'C', dependencies: ['B'] },
      { effect_id: 'B', dependencies: ['A'] },
      { effect_id: 'A', dependencies: [] }
    ];

    const order = cascadeManager.resolveExecutionOrder(effects);

    expect(order.map(e => e.effect_id)).toEqual(['A', 'B', 'C']);
  });

  test('detects circular dependencies', () => {
    const effects = [
      { effect_id: 'A', dependencies: ['B'] },
      { effect_id: 'B', dependencies: ['A'] }
    ];

    expect(() => cascadeManager.resolveExecutionOrder(effects))
      .toThrow('Circular dependency');
  });

  test('executes effects in parallel when no dependencies', async () => {
    const effects = [
      { effect_id: 'A', dependencies: [] },
      { effect_id: 'B', dependencies: [] }
    ];

    const startTime = Date.now();
    await cascadeManager.executeCascade({ cascading_effects: effects });
    const duration = Date.now() - startTime;

    // Should execute in parallel, not sequential
    expect(duration).toBeLessThan(100); // Both finish ~50ms
  });
});
```

### Integration Tests

```javascript
describe('Cascade Integration', () => {
  test('full cascade: NPC death triggers multi-location updates', async () => {
    // Setup: Cascade event watching Ismark status
    calendar.events.push(ismarkDeathCascade);

    // Action: Kill Ismark
    await stateManager.updateNPCState('village-of-barovia', 'ismark_kolyanovich', {
      status: 'dead'
    });

    // Assert: Cascading effects applied
    const ireenaState = await stateManager.loadState('village-of-barovia');
    expect(ireenaState.npc_states.ireena_kolyana.mood).toBe('grieving');

    const vallakiState = await stateManager.loadState('vallaki');
    expect(vallakiState.npc_states.father_lucian.knows_ismark_dead).toBe(true);

    // Assert: Cascade logged
    const lastCascade = cascadeManager.cascadeLog[cascadeManager.cascadeLog.length - 1];
    expect(lastCascade.status).toBe('completed');
    expect(lastCascade.effects).toHaveLength(4);
  });

  test('rollback on cascade failure', async () => {
    // Setup: Take snapshot of initial state
    const initialState = await stateManager.loadState('village-of-barovia');

    // Mock: Make one effect fail
    jest.spyOn(stateManager, 'updateNPCState').mockImplementationOnce(() => {
      throw new Error('Simulated failure');
    });

    // Action: Trigger cascade (should fail and rollback)
    await expect(cascadeManager.triggerCascade('village-of-barovia', 'npc_states.ismark.status', 'dead'))
      .rejects.toThrow();

    // Assert: State rolled back to initial
    const currentState = await stateManager.loadState('village-of-barovia');
    expect(currentState).toEqual(initialState);
  });
});
```

---

## Advanced Cascade Patterns

### Conditional Effects

```yaml
# Effect only applies if condition met
- effect_id: "ireena-flees-village"
  condition: "player_reputation < -20"  # Only if player hated
  location: "village-of-barovia"
  target_type: "npc_state"
  target_id: "ireena_kolyana"
  state_changes:
    current_location: "vallaki"
    fleeing: true
```

### Delayed Cascades

```yaml
# Effect triggers after delay
- effect_id: "villagers-discover-death"
  delay_hours: 24  # Discover body 24 hours later
  location: "village-of-barovia"
  target_type: "location_state"
  state_changes:
    public_knowledge: "ismark_dead"
    mood: "mourning"
```

### Probability-Based Effects

```yaml
# Effect has chance to trigger
- effect_id: "strahd-learns-death"
  probability: 0.7  # 70% chance
  location: "castle-ravenloft"
  target_type: "npc_state"
  target_id: "strahd"
  state_changes:
    knows_ismark_dead: true
    attitude_player: "curious"
```

---

## Architecture Decisions Summary

| Decision | Rationale |
|----------|-----------|
| **Event-driven cascades** | Immediate propagation, no polling lag |
| **Dependency graph** | Ensures correct execution order |
| **Transaction pattern** | All effects succeed or all rollback - no partial cascades |
| **Snapshot-based rollback** | Simple, reliable recovery from failures |
| **Max depth limit** | Prevents infinite loops from circular dependencies |
| **Cascade logging** | Full audit trail for debugging |
| **Batch updates** | Multiple effects to same location = single file write |
| **Hook in StateManager** | All state changes trigger cascade checks automatically |

---

## Next Steps for Story 2-9

1. **Implement CascadeManager class** with dependency resolution
2. **Implement CascadeTransaction** with snapshot/rollback
3. **Register hooks in StateManager** to trigger cascades
4. **Add cascade logging** to JSON file
5. **Implement batching optimization** for same-location effects
6. **Add max depth limit** to prevent infinite loops
7. **Create cascade visualizer** for debugging
8. **Write comprehensive tests** (unit + integration)
9. **Test rollback scenarios** thoroughly

**Design Status:** ✅ Complete - Ready for Story 2-9 Implementation
