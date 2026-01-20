# Yester Hill - Events

## Combat Events

### Event: Druid Ambush
```yaml
eventId: yester_hill_druid_attack
name: "The Druids Strike"
trigger_type: conditional
trigger_conditions:
  - type: player_arrives_at_location
    locationId: yester-hill
effects:
  - type: combat_encounter
    locationId: yester-hill
    encounterDetails:
      name: "Druid Cultists and Blight Swarm"
      enemies:
        - type: druid_cultist
          cr: 2
          count: 3
        - type: twig_blight
          cr: 0.125
          count: 12
        - type: needle_blight
          cr: 0.25
          count: 6
        - type: vine_blight
          cr: 0.5
          count: 1
      environment: hilltop_standing_stones
      difficulty: deadly
      special_mechanics:
        - druid_spellcasters
        - blight_swarm_tactics
        - environmental_hazards
        - wintersplinter_awakening_risk
  - type: atmosphere
    description: "Druids in skull masks emerge from behind standing stones, chanting dark prayers. Dozens of blights rise from the undergrowth—twig swarms, needle volleys, grasping vines. The Gulthias Tree pulses with malevolent energy."
  - type: state_update
    locationId: yester-hill
    stateChanges:
      combat_initiated: true
      druids_alerted: true
```

**Consequences**:
- Large-scale combat with multiple enemy types
- Druids use Entangle and Spike Growth to control terrain
- Blights vulnerable to fire (double damage)
- If druids losing badly, they attempt to awaken Wintersplinter

---

### Event: Wintersplinter Awakens
```yaml
eventId: wintersplinter_awakening
name: "The Mega-Blight Rises"
trigger_type: conditional
trigger_conditions:
  - type: druids_losing_battle
    threshold: 50_percent_casualties
  - type: druid_ritual_complete
    value: true
effects:
  - type: combat_encounter
    locationId: yester-hill
    encounterDetails:
      name: "Wintersplinter Awakened"
      enemies:
        - type: tree_blight_mega
          cr: 7
          count: 1
      environment: hillside
      difficulty: deadly
      special_mechanics:
        - massive_size
        - grasping_roots_aoe
        - fire_vulnerable
        - time_sensitive_chase
  - type: atmosphere
    description: "The ground trembles. A massive shape rises from the hillside recess—Wintersplinter, a 50-foot tree blight covered in frost. Its eyes glow green. It roars like splintering timber and begins its inexorable march toward the Wizard of Wines."
  - type: state_update
    locationId: yester-hill
    stateChanges:
      wintersplinter_awakened: true
      march_to_winery_begun: true
      time_limit_active: 2_hours
```

**Consequences**:
- CR 7 boss encounter begins
- If not stopped, Wintersplinter marches to winery (2-hour journey)
- Party can fight now or pursue and ambush en route
- If Wintersplinter reaches winery, it destroys buildings until stopped

**Tactical Notes**:
- Wintersplinter vulnerable to fire (double damage)
- Grasping Roots restrains multiple targets (DC 15 Strength save)
- Too large for subtle tactics—just crashes through terrain
- Defeating it saves winery, earns major gratitude from Martikovs

---

## Quest Events

### Event: Winery Gem Recovery
```yaml
eventId: recover_winery_gem_yester
name: "Reclaim the Red Dragon Gem"
trigger_type: conditional
trigger_conditions:
  - type: gulthias_tree_accessible
    value: true
  - type: druids_defeated_or_distracted
    value: true
effects:
  - type: quest_item_obtained
    itemId: winery_gem_red_dragon
  - type: quest_resolution
    questId: recover_yester_hill_gem
    outcome: success
    rewards:
      - xp: 800
      - gp_reward: 500
      - martikov_alliance_strengthened: true
  - type: custom
    description: "Digging into the Gulthias Tree's roots, you uncover a glowing amber gem radiating warmth. This is the stolen winery gem—the source of Red Dragon Crush production. Davian Martikov will be overjoyed at its return."
  - type: state_update
    locationId: yester-hill
    stateChanges:
      gem_recovered: true
      quest_completed: true
```

**Consequences**:
- Winery quest phase 2 completed
- Red Dragon Crush wine production can resume
- Davian Martikov offers 500 gp reward plus lifetime wine supply
- Martikov alliance strengthened
- One gem down, one to go (Berez has the third gem)

---

### Event: Destroy the Gulthias Tree
```yaml
eventId: destroy_gulthias_tree
name: "End the Corruption at Its Source"
trigger_type: conditional
trigger_conditions:
  - type: gulthias_tree_reduced_to_0_hp
    value: true
effects:
  - type: state_update
    locationId: yester-hill
    stateChanges:
      gulthias_tree_destroyed: true
      blight_spawning_ended: true
      corruption_cleansed: true
  - type: custom
    description: "The Gulthias Tree shudders and splits. Black sap pours from the wound like blood. The tree's malevolent consciousness screams silently as it dies. All blights spawned from it wither and collapse. The standing stones crack. The hilltop's oppressive aura fades."
  - type: quest_resolution
    questId: destroy_corruption_source
    outcome: success
    rewards:
      - xp: 600
      - environmental_improvement: barovia_region
```

**Consequences**:
- Blight spawning in region ends permanently
- All active blights in area wither (twig, needle, vine)
- Wintersplinter weakens significantly if still alive
- Environmental improvement: Forests begin slow recovery
- Symbolic victory against Strahd's corruption

**Destruction Method**:
- Reduce tree to 0 HP (HP = 200, AC 15, vulnerable to fire)
- Standing stone destruction weakens it (10% HP reduction per stone)
- Extracting gem first prevents gem destruction during fight

---

## Discovery Events

### Event: Strahd's Correspondence Found
```yaml
eventId: find_strahd_letters
name: "The Dark Lord's Commands Revealed"
trigger_type: conditional
trigger_conditions:
  - type: search_druid_leader_tent
    value: true
effects:
  - type: custom
    description: "Among the druid leader's possessions, you find letters bearing Strahd's seal. They detail his orders: disrupt wine production, steal the magic gems, create Wintersplinter, and crush the Martikovs' resistance. The letters reveal calculated cruelty—Strahd orchestrated everything to demoralize Barovia's population."
  - type: state_update
    locationId: yester-hill
    stateChanges:
      strahd_involvement_confirmed: true
      lore_discovered: true
  - type: game_flag_set
    flag: understand_strahd_tactics
    value: true
```

**Consequences**:
- Confirms Strahd orchestrated winery attack
- Reveals his strategic thinking (wine shortage demoralizes populace)
- Provides insight into how he controls Barovia
- May reference other schemes in motion

---

### Event: Rescue Prisoners
```yaml
eventId: free_sacrificial_victims
name: "Liberation of the Condemned"
trigger_type: conditional
trigger_conditions:
  - type: reach_druid_camp_cages
    value: true
  - type: druids_defeated_or_distracted
    value: true
effects:
  - type: npc_encounter
    npcIds:
      - sacrificial_victims
    disposition: terrified_grateful
  - type: custom
    description: "The caged prisoners weep with relief. 'The druids were going to feed us to the tree! You saved our lives!' If escorted to safety, they provide information about druid rituals and recent activities."
  - type: state_update
    locationId: yester-hill
    stateChanges:
      prisoners_freed: true
      reputation_boost: true
```

**Consequences**:
- Rescued NPCs flee to nearest settlement (Wizard of Wines or Vallaki)
- Reputation gain in settlements
- Prisoners may provide information about druid numbers, rituals, Wintersplinter timeline
- One prisoner might be relative of important NPC (DM discretion)

---

## Environmental Events

### Event: Blight Reinforcements
```yaml
eventId: blights_spawn_from_tree
name: "The Tree Births More Horrors"
trigger_type: conditional
trigger_conditions:
  - type: combat_duration
    rounds: 5
  - type: gulthias_tree_alive
    value: true
effects:
  - type: reinforcements
    encounterDetails:
      enemies:
        - type: twig_blight
          count: 1d4
      description: "The Gulthias Tree shudders. Its roots crack open and disgorge more twig blights. As long as the tree lives, reinforcements will keep coming."
```

**Consequences**:
- Blight reinforcements arrive every 5 rounds
- Encourages focusing fire on tree to stop spawning
- Creates time pressure during prolonged fights

---

## Recurring Events

### Event: Daily Ritual Sacrifice
```yaml
eventId: daily_druid_ritual
name: "Feeding the Gulthias Tree"
trigger_type: recurring
recurrence: daily
times: ["06:00", "18:00"]
effects:
  - type: atmosphere
    description: "The druids gather at dawn and dusk to feed the Gulthias Tree. They sacrifice animals (or prisoners if available), pouring blood on the roots while chanting prayers to Strahd."
  - type: state_update
    locationId: yester-hill
    stateChanges:
      ritual_performed: true
      tree_fed: true
```

**Consequences**:
- Establishes druid routine (predictable times to attack)
- If party observes ritual, provides intel on druid numbers and tactics
- Witnessing sacrifice may motivate party to act immediately

---

## Notes for Epic 2 Integration

All events conform to EventScheduler schema with proper trigger_type, trigger_conditions, and effects arrays.

**Yester Hill Event Design**:
1. **Druid Combat**: Multi-enemy encounter with spellcasters and minion swarms
2. **Wintersplinter**: Optional CR 7 boss with time-sensitive chase mechanic
3. **Gem Recovery**: Direct continuation of Wizard of Wines quest chain
4. **Environmental**: Blight spawning creates ongoing pressure during combat

**Quest Chain Integration**:
- This location connects directly to Story 4-5 Wizard of Wines
- Gem recovery phase 2 of 3 (Berez has final gem)
- Wintersplinter threat creates urgency (must stop before it destroys winery)

EventExecutor applies effects to State.md, tracking gem recovery, Wintersplinter status, and tree destruction.
