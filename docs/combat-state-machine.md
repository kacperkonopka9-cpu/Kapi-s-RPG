# D&D 5e Combat State Machine

**Version:** 1.0
**Date:** 2025-11-09
**Epic:** 3 - D&D 5e Mechanics Integration
**Author:** Architect Agent

---

## Overview

This document defines the combat state machine for Kapi-s-RPG's D&D 5e combat system. The state machine manages combat flow from initiative rolls through turn-based actions to combat resolution, ensuring D&D 5e rules are followed accurately.

**Design Goals:**
- Strict adherence to D&D 5e combat rules (initiative, action economy, turn order)
- Clear state transitions that prevent invalid combat states
- Integration with Epic 2 CalendarManager (combat rounds advance time)
- Integration with Epic 1 StateManager (combat state persistence)
- Support for both player vs. monster and future player vs. player combat

---

## Combat Phases

D&D 5e combat follows a structured sequence of phases:

### Phase 1: Combat Initiation
**Trigger:** Player or DM initiates combat encounter
**Actions:**
- Identify all combatants (players, NPCs, monsters)
- Roll initiative for each combatant (d20 + Dexterity modifier)
- Sort combatants by initiative (descending order)
- Create combat state object
- Transition to Phase 2

**State:** `PRE_COMBAT` → `INITIATIVE_ROLLED`

### Phase 2: Combat Rounds
**Trigger:** Initiative order established
**Actions:**
- Set current turn to first combatant in initiative order
- Begin Round 1
- Transition to Phase 3

**State:** `INITIATIVE_ROLLED` → `IN_COMBAT`

### Phase 3: Turn Execution
**Trigger:** A combatant's turn begins
**Actions:**
- Combatant takes actions (see Action Economy below)
- Apply action effects (damage, healing, conditions)
- Check for combat end conditions
- Transition to Phase 4 or Phase 5

**State:** `IN_COMBAT` (turn active)

### Phase 4: Turn End
**Trigger:** Combatant ends turn or uses all actions
**Actions:**
- Mark turn as complete
- Check for end-of-turn effects (condition saves, concentration checks)
- Advance to next combatant in initiative order
- If end of round, increment round counter
- Return to Phase 3 for next turn OR transition to Phase 5 if combat ends

**State:** `IN_COMBAT` (turn complete, advance)

### Phase 5: Combat End
**Trigger:** All enemies defeated, all players defeated, or combat fled/negotiated
**Actions:**
- Calculate XP rewards (if applicable)
- Clear temporary effects and conditions
- Update character states (HP, spell slots, etc.)
- Persist final combat state
- Return to exploration mode

**State:** `IN_COMBAT` → `COMBAT_ENDED`

---

## State Diagram

```
┌─────────────┐
│ EXPLORATION │ (No combat active)
└──────┬──────┘
       │ Combat initiated
       ▼
┌─────────────────┐
│  PRE_COMBAT     │ Roll initiative for all combatants
└──────┬──────────┘
       │ Initiative rolled
       ▼
┌─────────────────┐
│ INITIATIVE_     │ Sort combatants by initiative
│ ROLLED          │
└──────┬──────────┘
       │ Set first turn
       ▼
┌─────────────────────────────────────────────────────────────┐
│                      IN_COMBAT                               │
│                                                              │
│   ┌─────────────┐                                           │
│   │ TURN_START  │◄──────────────────────┐                   │
│   └──────┬──────┘                       │                   │
│          │ Begin turn                   │                   │
│          ▼                               │                   │
│   ┌─────────────┐                       │                   │
│   │ ACTION_     │ Player chooses action │                   │
│   │ SELECTION   │                       │                   │
│   └──────┬──────┘                       │                   │
│          │                               │                   │
│          ├─> ATTACK ──> Roll attack ───>│                   │
│          ├─> CAST_SPELL ──> Resolve ───>│                   │
│          ├─> DASH ──> Move ───────────>│                   │
│          ├─> DODGE ──> Apply AC bonus ─>│                   │
│          ├─> HELP ──> Grant advantage ─>│                   │
│          └─> OTHER_ACTION ─────────────>│                   │
│                                          │                   │
│          ┌───────────────────────────────┘                   │
│          ▼                                                   │
│   ┌─────────────┐                                           │
│   │ TURN_END    │ Resolve end-of-turn effects              │
│   └──────┬──────┘                                           │
│          │                                                   │
│          ├─> Next combatant in initiative order             │
│          │   (loop back to TURN_START)                      │
│          │                                                   │
│          └─> If end of round: increment round               │
│              Check combat end conditions                     │
│                                                              │
└──────────────────────────┬───────────────────────────────────┘
                           │ All enemies defeated OR
                           │ All players defeated OR
                           │ Combat fled/negotiated
                           ▼
                   ┌─────────────────┐
                   │  COMBAT_ENDED   │ Award XP, clean up effects
                   └────────┬─────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │ EXPLORATION │ Return to normal gameplay
                   └─────────────┘
```

---

## Combat State Data Structure

```javascript
{
  // Combat Metadata
  combatId: "combat_001",              // Unique combat identifier (UUID)
  active: true,                        // Is combat currently active?
  state: "IN_COMBAT",                  // Current state (PRE_COMBAT, INITIATIVE_ROLLED, IN_COMBAT, COMBAT_ENDED)

  // Round & Turn Tracking
  round: 1,                            // Current combat round (1-based)
  turnIndex: 0,                        // Index of current combatant in initiative array
  currentTurn: "kapi",                 // ID of combatant whose turn it is

  // Initiative Order
  initiative: [
    {
      combatantId: "kapi",
      initiative: 17,                  // d20 + Dex modifier
      acted: true,                     // Has this combatant acted this round?
      delaying: false                  // Is this combatant delaying their turn?
    },
    {
      combatantId: "zombie_1",
      initiative: 12,
      acted: false,
      delaying: false
    },
    {
      combatantId: "zombie_2",
      initiative: 8,
      acted: true,
      delaying: false
    }
  ],

  // Combatant Details
  combatants: [
    {
      id: "kapi",
      type: "player",                  // player, npc, monster
      characterId: "kapi",             // Reference to character file
      name: "Kapi the Brave",

      // Combat Stats
      hp: {
        current: 24,
        max: 31,
        temporary: 0
      },
      ac: 18,

      // Current Status
      conditions: ["prone"],           // Active conditions
      concentration: {                 // If concentrating on a spell
        spellId: "bless",
        duration: 10,                  // Rounds remaining
        dc: 10                         // Concentration DC for damage checks
      },

      // Action Economy (refreshes each turn)
      actions: {
        action: true,                  // Has action available?
        bonusAction: true,             // Has bonus action available?
        reaction: true,                // Has reaction available?
        movement: 30,                  // Movement remaining (feet)
        maxMovement: 30                // Total movement per turn
      },

      // Grid Position (optional, for tactical combat)
      position: {
        x: 0,
        y: 0
      }
    },
    {
      id: "zombie_1",
      type: "monster",
      monsterName: "Zombie",
      name: "Zombie #1",

      hp: {
        current: 15,
        max: 22,
        temporary: 0
      },
      ac: 8,

      conditions: [],
      concentration: null,

      actions: {
        action: true,
        bonusAction: true,
        reaction: true,
        movement: 20,
        maxMovement: 20
      },

      position: {
        x: 5,
        y: 0
      }
    }
  ],

  // Combat Log
  log: [
    {
      round: 1,
      turn: "kapi",
      action: "attack",
      target: "zombie_1",
      result: {hit: true, damage: 9, damageType: "slashing"},
      timestamp: "2025-11-09T14:30:00Z"
    }
  ],

  // Combat Metadata
  startTime: "2025-11-09T14:25:00Z",   // Real-world timestamp
  endTime: null,                       // Set when combat ends
  location: "village-of-barovia",      // Where combat is happening
  outcome: null                        // victory, defeat, fled, negotiated
}
```

---

## Action Economy

D&D 5e defines a strict action economy per turn. Each combatant gets:

### Standard Actions (1 per turn)

**Action:** The main action on your turn. Can be used for:
- **Attack:** Make one or more attacks (based on Extra Attack feature)
- **Cast a Spell:** Cast a spell with casting time of 1 action
- **Dash:** Double movement speed for this turn
- **Disengage:** Move without provoking opportunity attacks
- **Dodge:** Attacks against you have disadvantage until next turn
- **Help:** Give ally advantage on their next ability check or attack
- **Hide:** Make Stealth check to hide
- **Ready:** Prepare an action to trigger on a condition
- **Search:** Make Perception or Investigation check
- **Use Object:** Interact with an object (open door, drink potion)
- **Other:** Any other action the DM allows

### Bonus Action (1 per turn, if available)

- Only usable if a feature/spell explicitly grants a bonus action
- Examples: Fighter's Second Wind, Rogue's Cunning Action, casting a bonus action spell

### Reaction (1 per round, not per turn)

- Usable on any combatant's turn (including your own)
- Resets at the start of your next turn
- Examples: Opportunity attack, Shield spell, Counterspell

### Movement (30 feet standard, varies by race/class)

- Can be split before and after actions
- Difficult terrain costs 2 feet per 1 foot moved
- Conditions can affect movement (prone = half speed to stand, restrained = 0 speed)

### Free Actions (Unlimited, but DM discretion)

- Drop an item
- Short verbal communication (5-6 words)
- Environmental interaction (pull a lever, open an unlocked door)

---

## State Transitions

### Transition Rules

**From PRE_COMBAT to INITIATIVE_ROLLED:**
```javascript
// Condition: All combatants have rolled initiative
if (allComba tantsHaveInitiative()) {
  sortCombatantsByInitiative(); // Descending order
  state = "INITIATIVE_ROLLED";
}
```

**From INITIATIVE_ROLLED to IN_COMBAT:**
```javascript
// Condition: Ready to start combat
state = "IN_COMBAT";
round = 1;
turnIndex = 0;
currentTurn = initiative[0].combatantId;
resetActionsForAllCombatants();
```

**Turn Advancement (within IN_COMBAT):**
```javascript
// End current turn
initiative[turnIndex].acted = true;
turnIndex++;

// Check if round is complete
if (turnIndex >= initiative.length) {
  round++;
  turnIndex = 0;
  resetActedFlagsForAllCombatants();
  resetReactionsForAllCombatants();
  checkEndOfRoundEffects(); // Condition durations, concentration checks
}

// Set next turn
currentTurn = initiative[turnIndex].combatantId;
resetActionsForCombatant(currentTurn);
```

**From IN_COMBAT to COMBAT_ENDED:**
```javascript
// Conditions for combat end:
if (allEnemiesDefeated() || allPlayersDefeated() || combatFled()) {
  state = "COMBAT_ENDED";
  active = false;
  endTime = getCurrentTimestamp();
  determineOutcome();
  awardXP();
  clearTemporaryEffects();
}
```

**From COMBAT_ENDED to EXPLORATION:**
```javascript
// Cleanup
persistCombatLog();
updateCharacterStates();
clearCombatState();
// Return to normal gameplay
```

---

## Integration with Epic 1 & 2

### Epic 1: StateManager Integration

**Combat State Persistence:**
- Combat state stored in **memory during combat** for performance
- Persisted to `State.md` on:
  - Combat end
  - Every 3 rounds (autosave)
  - Session end

**Character State Updates:**
- HP changes applied immediately to in-memory character
- Persisted to `State.md` on turn end
- Spell slots consumed → update character → persist

**Location State:**
```yaml
---
# State.md frontmatter
combat:
  active: true
  combatId: "combat_001"
  round: 3
  currentTurn: "kapi"
characters:
  kapi:
    hp: 24
    conditions: ["prone"]
    spellSlots: {1: 2, 2: 1}
---
```

### Epic 2: CalendarManager Integration

**Combat Time Tracking:**
- Each combat round = **6 seconds** of in-game time
- At end of each round, advance calendar by 6 seconds
- Spell durations track via EventScheduler

**Time Advancement:**
```javascript
// At end of each round
await calendarManager.advanceTime(calendar, 6, `combat round ${round}`);

// Check for spell expiration
await eventScheduler.checkTriggers(calendar, locationId);
```

**Example:**
- Combat starts at 14:30:00
- Round 1 ends → 14:30:06
- Round 2 ends → 14:30:12
- Round 10 ends → 14:31:00
- Concentration spell (1 minute) expires at Round 11

---

## Combat Workflows

### Workflow 1: Start Combat

```
User: "I attack the zombie"
  │
  ├─> CombatManager.checkActiveCombat()
  │   │
  │   └─> No active combat → initiate combat
  │
  ├─> CombatManager.startCombat([kapi, zombie_1, zombie_2])
  │   │
  │   ├─> Roll initiative for all combatants
  │   │   kapi: d20(15) + Dex(+2) = 17
  │   │   zombie_1: d20(10) + Dex(+0) = 10
  │   │   zombie_2: d20(6) + Dex(+0) = 6
  │   │
  │   ├─> Sort by initiative: [kapi:17, zombie_1:10, zombie_2:6]
  │   │
  │   ├─> Create combat state:
  │   │   {combatId, round:1, turnIndex:0, currentTurn:"kapi"}
  │   │
  │   └─> State: PRE_COMBAT → INITIATIVE_ROLLED → IN_COMBAT
  │
  ├─> Display: "Initiative: Kapi (17), Zombie #1 (10), Zombie #2 (6)"
  │
  └─> Display: "Round 1 - Kapi's turn"
```

### Workflow 2: Execute Turn (Attack)

```
Current: IN_COMBAT, round:1, currentTurn:"kapi"
User: "/attack zombie_1 longsword"
  │
  ├─> CombatManager.executeTurn("kapi", {action: "attack", target: "zombie_1", weapon: "longsword"})
  │   │
  │   ├─> Validate turn ownership (is it kapi's turn?) → YES
  │   │
  │   ├─> Validate action available → YES (action: true)
  │   │
  │   ├─> AttackResolver.resolveAttack(kapi, zombie_1, longsword)
  │   │   │
  │   │   ├─> Roll: d20(18) + 5 = 23 vs AC 8 → HIT
  │   │   ├─> Damage: 1d8(6) + 3 = 9 slashing
  │   │   └─> Return {hit: true, damage: 9}
  │   │
  │   ├─> HPManager.applyDamage(zombie_1, 9)
  │   │   zombie_1 HP: 15 → 6
  │   │
  │   ├─> Update combat log
  │   │
  │   ├─> Mark action used: combatant.actions.action = false
  │   │
  │   └─> Return attack result
  │
  ├─> Display: "Kapi attacks Zombie #1: d20(18)+5=23 vs AC 8 → HIT! Damage: 9 slashing. Zombie HP: 15 → 6"
  │
  └─> Prompt: "Kapi still has: bonus action, reaction, 30ft movement. End turn? (y/n)"
```

### Workflow 3: End Turn & Advance

```
User: "End turn" OR "/end-turn"
  │
  ├─> CombatManager.endTurn("kapi")
  │   │
  │   ├─> Check end-of-turn effects:
  │   │   - Concentration checks (if took damage)
  │   │   - Condition saves (if applicable)
  │   │   - Duration decrements
  │   │
  │   ├─> Mark turn as acted: initiative[0].acted = true
  │   │
  │   ├─> Advance turn: turnIndex 0 → 1
  │   │
  │   ├─> Set next turn: currentTurn = "zombie_1"
  │   │
  │   ├─> Reset actions for zombie_1:
  │   │   {action: true, bonusAction: true, reaction: true, movement: 20}
  │   │
  │   ├─> CalendarManager.advanceTime(6 seconds) [only if round ends]
  │   │
  │   └─> Check combat end conditions → Still active
  │
  └─> Display: "Zombie #1's turn"
```

### Workflow 4: End Combat

```
Zombie #2 HP reaches 0 (last enemy)
  │
  ├─> CombatManager.checkCombatEnd()
  │   │
  │   ├─> All enemies at 0 HP → Combat won
  │   │
  │   └─> State: IN_COMBAT → COMBAT_ENDED
  │
  ├─> CombatManager.endCombat(outcome: "victory")
  │   │
  │   ├─> Calculate XP: 2 zombies × 50 XP = 100 XP
  │   │
  │   ├─> Award XP to kapi: 1200 → 1300 XP
  │   │
  │   ├─> Clear temporary effects:
  │   │   - Remove concentration spells
  │   │   - Clear "until end of next turn" conditions
  │   │
  │   ├─> Persist final character states:
  │   │   kapi HP: 24/31 → save to State.md
  │   │
  │   ├─> Persist combat log to logs/combat-YYYY-MM-DD.log
  │   │
  │   ├─> Clear combat state from memory
  │   │
  │   └─> active = false, endTime = "2025-11-09T14:32:30Z"
  │
  ├─> Display: "Combat ended! Victory! XP Earned: 100 (total: 1300)"
  │
  └─> Return to exploration mode
```

---

## Special Cases

### Unconsciousness (0 HP)

**When a combatant reaches 0 HP:**
```javascript
if (combatant.hp.current <= 0 && combatant.type === "player") {
  combatant.hp.current = 0;
  combatant.conditions.push("unconscious");
  combatant.deathSaves = {successes: 0, failures: 0};

  // On their turn: make death saving throw instead of normal action
  // d20 (no modifiers): 10+ = success, <10 = failure
  // Natural 20 = regain 1 HP
  // Natural 1 = 2 failures
}

if (combatant.hp.current <= 0 && combatant.type === "monster") {
  // Monsters die instantly at 0 HP (unless special ability)
  removeCombatant(combatant.id);
}
```

### Instant Death

**Massive Damage Rule:**
```javascript
if (combatant.hp.current <= -combatant.hp.max) {
  // Instant death (damage exceeds max HP)
  combatant.dead = true;
  removeCombatant(combatant.id);
}
```

### Concentration Checks

**When a concentrating caster takes damage:**
```javascript
if (combatant.concentration && damageTaken > 0) {
  const dc = Math.max(10, Math.floor(damageTaken / 2));
  const saveResult = await makeSavingThrow(combatant, "constitution", dc);

  if (!saveResult.passed) {
    // Concentration broken
    removeSpellEffect(combatant.concentration.spellId);
    combatant.concentration = null;
    display("Concentration broken!");
  }
}
```

### Surprise Round

**If combatants are surprised (not in MVP):**
```javascript
// Surprised combatants:
// - Cannot move or take actions on first turn
// - Cannot take reactions until end of first turn
// - Determined by DM before combat starts

combatant.surprised = true;  // Deferred to Epic 5
```

### Opportunity Attacks

**When a combatant moves out of enemy reach:**
```javascript
// Provokes opportunity attack unless Disengage action used
if (movingOutOfReach && !disengaged && enemy.actions.reaction) {
  // Enemy makes melee attack as reaction
  await resolveOpportunityAttack(enemy, movingCombatant);
  enemy.actions.reaction = false;
}
```

---

## Performance Considerations

**Combat State Storage:**
- Store in memory during combat (not file system)
- Autosave every 3 rounds to State.md (prevent loss on crash)
- Final save on combat end

**Combat Log:**
- Write to memory array during combat
- Flush to logs/combat-YYYY-MM-DD.log on combat end
- Limit: 1000 log entries per combat (prevent memory bloat)

**Initiative Sorting:**
- Sort once at combat start
- Maintain sorted order (no re-sort each round)
- O(n log n) complexity acceptable for <20 combatants

**Turn Advancement:**
- O(1) operation (increment turnIndex, modulo for wraparound)
- No searching required

**Combat End Check:**
- Check after each HP change (not every action)
- O(n) scan of combatants
- Early exit on first alive enemy found

---

## Testing Strategy

**Unit Tests:**
- `CombatManager.startCombat()` - Initiative rolling and sorting
- `CombatManager.advanceTurn()` - Turn progression and round increment
- `CombatManager.endCombat()` - Cleanup and XP award
- Action economy tracking (action, bonus action, reaction)
- Combat end conditions (all enemies dead, all players dead)

**Integration Tests:**
- Full combat workflow (start → turns → end)
- Integration with AttackResolver and HPManager
- Integration with CalendarManager (time advancement)
- Integration with StateManager (HP persistence)

**Edge Cases:**
- Initiative ties (use Dexterity as tiebreaker)
- Combatant death mid-round (skip their remaining turns)
- All combatants die simultaneously (TPK handling)
- Combat fled (partial XP? resource consumption?)
- Concentration broken by damage
- Death saving throws (3 successes/failures)

---

## Future Enhancements (Epic 5+)

Not in MVP, deferred to later epics:

- **Grid-based combat:** Tactical positioning, movement grid, range calculations
- **Opportunity attacks:** Movement provokes attacks
- **Surprise round:** Some combatants surprised
- **Delay/Ready action:** Hold action for specific trigger
- **Area of effect:** Spells affecting multiple targets
- **Cover mechanics:** Half cover, three-quarters cover
- **Mounted combat:** Riding horses/creatures
- **Underwater combat:** Special rules for aquatic combat
- **Flying combat:** Aerial positioning and movement
- **Conditions with numeric values:** Exhaustion levels, slowed speed
- **Legendary actions:** Boss monsters with extra actions
- **Lair actions:** Environmental hazards on initiative count 20

---

## Summary

The combat state machine provides:
- ✅ Strict D&D 5e combat flow (initiative → rounds → turns → resolution)
- ✅ Clear action economy (action, bonus action, reaction, movement)
- ✅ State persistence via Epic 1 StateManager
- ✅ Time tracking via Epic 2 CalendarManager (6 seconds per round)
- ✅ Performance-optimized (memory-based state, autosave every 3 rounds)
- ✅ Extensible for future features (grid combat, opportunity attacks, etc.)

This design ensures combat is fun, fair, and follows D&D 5e rules while maintaining the file-first architecture and LLM integration that defines Kapi-s-RPG.
