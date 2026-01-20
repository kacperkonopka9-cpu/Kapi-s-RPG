# Old Bonegrinder - Events

## Encounter Events

### Event: Morgantha's Pastry Round
```yaml
eventId: morgantha_pastry_delivery
name: "Morgantha Delivers Dream Pastries"
trigger_type: recurring
recurrence: every_3_days
times: ["08:00"]
effects:
  - type: npc_location_change
    npcId: morgantha
    from_location: old-bonegrinder
    to_location: village-of-barovia
    route: "Old Svalich Road"
    travel_time: "3 hours"
  - type: custom
    description: "Morgantha departs Old Bonegrinder in her human disguise, carrying a basket of dream pastries. She travels to Village of Barovia, Vallaki, or other settlements to sell her wares and potentially acquire new 'ingredients.' While she's gone, only Bella and Offalia remain at the windmill—making it slightly less dangerous to assault."
  - type: state_update
    locationId: old-bonegrinder
    stateChanges:
      morgantha_present: false
      hag_count: 2
      windows_of_opportunity: true
```

**Consequences**:
- Strategic opportunity for party to attack when only 2 hags present
- Coven is weakened without all three members (cannot cast high-level coven spells)
- Morgantha may encounter party on the road if they're traveling
- Road encounter allows party to follow her back to windmill if they're investigating
- If party kills her on the road, her daughters will sense her death and prepare defenses

**Timing Notes**:
- Morgantha leaves early morning, returns by evening
- She visits Village of Barovia most often, occasionally Vallaki
- She stops to sell to travelers on the road
- Party may encounter her as "innocent old pastry seller" before discovering the truth

---

### Event: Dream Pastry Addiction Crisis
```yaml
eventId: pastry_addiction_spread
name: "Dream Pastry Addiction Spreads"
trigger_type: conditional
trigger_conditions:
  - type: time_elapsed
    days_since_hags_active: 30
  - type: hags_not_defeated
    value: true
effects:
  - type: state_update
    locationId: village-of-barovia
    stateChanges:
      addicted_villagers: +5
      village_morale: -2
      economic_impact: worsening
  - type: state_update
    locationId: vallaki
    stateChanges:
      addicted_citizens: +3
      crime_increase: true
  - type: custom
    description: "As weeks pass without intervention, more Barovians become addicted to dream pastries. Families spend their savings on pastries, children go hungry, and desperate addicts begin committing crimes to afford more. The hags' operation expands, requiring more child victims to meet demand."
  - type: quest_trigger
    questId: dream_pastry_investigation
    questStatus: available
```

**Consequences**:
- Longer party waits, worse the addiction crisis becomes
- More families destroyed by addiction
- More children needed for pastry production (increasing kidnapping rate)
- Settlements become increasingly desperate and unstable
- Party may be approached by family members begging for help
- Creates time pressure to stop the operation

---

### Event: Child Kidnapping Attempt
```yaml
eventId: hag_kidnapping_attempt
name: "Night Hags Attempt to Kidnap Child"
trigger_type: conditional
trigger_conditions:
  - type: any_of
    conditions:
      - current_stock_low: true
      - new_addicts_created: true
      - opportunity_presents: true
  - type: time_of_day
    time: night
effects:
  - type: custom
    description: "One or more hags, in Ethereal form or using their disguises, attempt to kidnap a child from a settlement or isolated home. They target children of addicted parents (who are too drugged to notice) or orphans. If party is present and alert, they may witness or interrupt the kidnapping."
  - type: potential_combat
    condition: party_intervenes
    encounterDetails:
      name: "Interrupt Kidnapping"
      enemies:
        - count: 1-2
          type: night_hag
      escape_likely: true
  - type: state_update
    locationId: old-bonegrinder
    stateChanges:
      captive_children: +1
      operation_continuing: true
```

**Consequences**:
- If party witnesses kidnapping, creates immediate moral imperative to act
- Successfully stopping kidnapping reveals hags' operation
- Failed intervention results in traumatized child at Old Bonegrinder
- Hags may target specific NPCs the party cares about
- Creates personal stakes beyond general "stop evil" motivation

---

### Event: Wereraven Surveillance Alert
```yaml
eventId: wereraven_warning
name: "Keepers of the Feather Observe Party"
trigger_type: conditional
trigger_conditions:
  - type: player_approaches_location
    locationId: old-bonegrinder
    distance: within_sight
effects:
  - type: npc_encounter
    npcId: wereraven_spy
    encounterType: observation
    dialogue: "As you approach the windmill, ravens circle overhead more actively than normal. One particularly large raven seems to watch you with unusual intelligence. If you're perceptive (DC 14 Perception), you notice it's tracking your movements and cawing warnings."
  - type: custom
    description: "The Keepers of the Feather have been monitoring the hag coven for months but lack strength to confront them directly. They observe party's approach with hope that these newcomers might finally end the threat. Wereravens will not initially reveal themselves but watch to see how party handles the situation."
```

**Consequences**:
- Subtle hint that ravens are more than they appear
- Wereravens will assist in combat if party attacks hags
- Connection to Wizard of Wines and broader Keepers of the Feather faction
- If party destroys coven, wereravens reveal themselves and offer alliance
- If party ignores or fails to stop hags, wereravens continue monitoring

---

## Combat Events

### Event: Hag Coven Confrontation
```yaml
eventId: hag_coven_battle
name: "Battle with the Night Hag Coven"
trigger_type: conditional
trigger_conditions:
  - type: any_of
    conditions:
      - party_attacks_hags: true
      - party_frees_children: true
      - party_discovered_snooping: true
effects:
  - type: combat_encounter
    locationId: old-bonegrinder
    encounterDetails:
      name: "The Night Hag Coven"
      enemies:
        - npcId: morgantha
          cr: 5
          type: night_hag
          role: coven_leader
        - npcId: bella_sunbane
          cr: 5
          type: night_hag
          role: frontline
        - npcId: offalia_wormwiggle
          cr: 5
          type: night_hag
          role: caster
      environment: three_story_windmill
      difficulty: deadly
      special_mechanics:
        - coven_magic_if_all_three_present
        - etherealness_escape_option
        - children_as_hostages
  - type: state_update
    locationId: old-bonegrinder
    stateChanges:
      combat_initiated: true
      hags_hostile: true
```

**Consequences**:
- Extremely difficult fight—CR 5 creatures × 3, plus coven magic
- If all three hags present, they can cast powerful coven spells (Lightning Bolt, Hold Person, etc.)
- Hags will use environment: narrow stairs, multiple floors, machinery hazards
- May take children hostage to force party surrender
- Hags will flee Ethereally if clearly losing (unless prevented by destroying Heartstones)
- Wereravens may assist party if combat appears hopeless

**Tactical Notes**:
- Fighting all three at once is nearly impossible for low-level parties
- Smart strategy: wait for Morgantha to leave (reducing to 2 hags)
- Hags coordinate: one frontline, one support, one crowd control
- Destroying their Heartstones prevents Ethereal escape
- Children on third floor are at risk during combat

---

### Event: Hag Coven Defeated
```yaml
eventId: hag_coven_destroyed
name: "The Night Hag Coven Falls"
trigger_type: conditional
trigger_conditions:
  - type: all_of
    conditions:
      - morgantha_status: dead
      - bella_sunbane_status: dead
      - offalia_wormwiggle_status: dead
effects:
  - type: quest_resolution
    questId: dream_pastry_investigation
    outcome: success
    rewards:
      - xp: 400
      - reputation: "Saviors of Barovia's Children"
  - type: state_update
    locationId: old-bonegrinder
    stateChanges:
      hags_defeated: true
      coven_destroyed: true
      windmill_safe: true
      children_freed: true
  - type: state_update
    locationId: village-of-barovia
    stateChanges:
      pastry_supply_ended: true
      addicts_begin_withdrawal: true
  - type: state_update
    locationId: vallaki
    stateChanges:
      pastry_supply_ended: true
      addicts_begin_withdrawal: true
  - type: npc_encounter
    npcId: wereraven_spy
    encounterType: revelation
    dialogue: "The ravens descend and one shifts into human form—a member of the Keepers of the Feather. 'Well done. The Martikov family has watched these monsters for too long. You've done what we could not. The Keepers will remember this.'"
```

**Consequences**:
- Old Bonegrinder becomes safe to loot and investigate
- Children can be rescued and returned
- Dream pastry supply ends, causing withdrawal crisis for addicts
- Wereravens reveal themselves and offer alliance
- Connection to Wizard of Wines unlocked (Martikov family)
- Reputation boost in settlements once word spreads
- No more child kidnappings from this source
- Strahd may take note of party's growing power

**Long-term Effects**:
- Addict families face withdrawal—some grateful, some angry at loss of pastries
- Party must decide what to do with remaining pastries
- Windmill deed connects to Death House investigation
- Keepers of the Feather become potential allies

---

## Consequence Events

### Event: Partial Hag Victory
```yaml
eventId: hag_escapes
name: "Surviving Hag Escapes"
trigger_type: conditional
trigger_conditions:
  - type: any_of
    conditions:
      - morgantha_fled: true
      - bella_fled: true
      - offalia_fled: true
  - type: heartstone_not_destroyed
    for_escaped_hag: true
effects:
  - type: custom
    description: "One or more hags escape using Etherealness. They flee to distant parts of Barovia to recover and plan revenge. Escaped hags will use Nightmare Haunting to torment party members each night, preventing long rests and causing exhaustion. They may also rebuild their operation elsewhere or seek revenge."
  - type: affliction
    targets: party_members
    affliction_type: nightmare_haunting
    effects: "Target receives terrifying nightmares each night, preventing benefits of long rest. Continues until hag is killed or Heartstone destroyed."
  - type: state_update
    locationId: old-bonegrinder
    stateChanges:
      partial_victory: true
      hags_remaining: count
      revenge_pending: true
```

**Consequences**:
- Ongoing harassment via Nightmare Haunting (prevents long rests)
- Escaped hag may return with reinforcements
- Party must track down and finish the job
- Creates ongoing tension and consequences for incomplete victory

---

## Environmental Events

### Event: Windmill Blades Turning
```yaml
eventId: windmill_operation
name: "The Grinding Stones Turn"
trigger_type: recurring
recurrence: daily
times: ["10:00", "14:00", "18:00"]
effects:
  - type: atmosphere
    description: "The windmill's blades catch the wind and begin turning with tortured creaks. Inside, the grinding stones rotate, crushing whatever has been placed between them. The sound echoes across the hillside—a reminder of the windmill's grim purpose."
  - type: custom
    description: "If hags are processing a victim, the sounds are particularly disturbing. Those with high Wisdom (DC 12 Perception) can hear undertones that suggest bones being ground."
```

**Consequences**:
- Atmospheric horror reinforcement
- Audio cue that windmill is active
- May attract party's attention from distance
- Indicates hags are actively working

---

### Event: Ravens Circle Overhead
```yaml
eventId: ravens_watching
name: "Ravens Gather and Watch"
trigger_type: conditional
trigger_conditions:
  - type: location_in_sight
    locationId: old-bonegrinder
effects:
  - type: atmosphere
    description: "Dozens of ravens circle Old Bonegrinder continuously, more than natural. They caw warnings and watch with unusual intelligence. This is the Keepers of the Feather maintaining surveillance on the hag coven."
```

**Consequences**:
- Visual indicator that location is significant
- Hints at wereraven involvement
- Ravens become agitated when hags are active
- May provide warnings if party is being watched by hags

---

## Notes for Epic 2 Integration

All events conform to EventScheduler schema (Epic 2):
- `eventId`: Unique identifier
- `name`: Display name
- `trigger_type`: date_time, conditional, recurring, location
- `trigger_conditions`: Array of conditions
- `effects`: Array of effects (npc_status, state_update, combat_encounter, quest_trigger, custom)

The hag coven represents a major moral and combat challenge. Events are designed to:
1. Create time pressure (addiction spreading, children at risk)
2. Provide strategic options (wait for Morgantha to leave)
3. Connect to broader campaign (wereravens, Death House)
4. Have long-term consequences (addiction crisis, Nightmare Haunting)

EventExecutor applies these effects to appropriate State.md files via StateManager.
