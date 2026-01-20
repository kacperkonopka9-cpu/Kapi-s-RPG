# Death House - Events

## House Awakening Events

### Event: The House Awakens
```yaml
eventId: death_house_awakens
name: "Death House Comes Alive"
trigger_type: location
trigger_conditions:
  - type: location_entered
    locationId: death-house
    first_visit: true
effects:
  - type: state_update
    locationId: death-house
    stateChanges:
      house_active: true
      doors_locked: false
      escape_available: true
  - type: atmosphere
    description: "The house seems to shift around you. Floorboards creak, shadows lengthen, and you hear faint children's laughter from upstairs."
```

### Event: Doors Lock
```yaml
eventId: death_house_doors_lock
name: "The Doors Lock"
trigger_type: conditional
trigger_conditions:
  - type: location_flag
    locationId: death-house
    flag: basement_discovered
    value: true
effects:
  - type: state_update
    locationId: death-house
    stateChanges:
      doors_locked: true
      escape_available: false
      windows_blocked: true
  - type: custom
    description: "All doors and windows slam shut and lock. The house will not release you until the shambling mound in the basement is destroyed."
```

### Event: Fog Trap
```yaml
eventId: death_house_fog
name: "Choking Fog Fills the House"
trigger_type: conditional
trigger_conditions:
  - type: all_of
    conditions:
      - doors_locked: true
      - shambling_mound_alive: true
      - party_not_in_basement: true
effects:
  - type: custom
    description: "Thick fog pours up from the basement, filling the house. Each minute outside the basement, party members take 1d10 poison damage (DC 12 Constitution save for half). Fog forces party toward the basement."
  - type: state_update
    locationId: death-house
    stateChanges:
      fog_active: true
```

---

## NPC Encounter Events

### Event: Rose and Thorn Appear
```yaml
eventId: durst_children_encounter
name: "The Durst Children"
trigger_type: location
trigger_conditions:
  - type: location_approach
    locationId: death-house
    distance: outside
effects:
  - type: npc_encounter
    npcIds:
      - rose_durst
      - thorn_durst
    encounterType: friendly
    dialogue: "Two children approach, looking cold and frightened. They beg for help finding their baby brother."
  - type: state_update
    locationId: death-house
    stateChanges:
      npc_states:
        rose_durst:
          met: true
          offered_quest: true
        thorn_durst:
          met: true
```

### Event: Parents' Ghosts Attack
```yaml
eventId: durst_parents_attack
name: "The Durst Parents Manifest"
trigger_type: conditional
trigger_conditions:
  - type: any_of
    conditions:
      - master_bedroom_disturbed: true
      - corpses_discovered: true
      - letters_read: true
effects:
  - type: combat_encounter
    encounterDetails:
      name: "Ghostly Parents"
      enemies:
        - npcId: gustav_durst
          cr: 4
          type: ghost
        - npcId: elisabeth_durst
          cr: 4
          type: ghost
      location: third_floor
  - type: state_update
    locationId: death-house
    stateChanges:
      npc_states:
        gustav_durst:
          hostile: true
        elisabeth_durst:
          hostile: true
```

---

## Boss Encounter Event

### Event: Shambling Mound Encounter
```yaml
eventId: shambling_mound_encounter
name: "Face the Monster in the Basement"
trigger_type: location
trigger_conditions:
  - type: location_entered
    subLocationId: ritual_chamber
    first_visit: true
effects:
  - type: combat_encounter
    encounterDetails:
      name: "Walter's Abomination"
      enemies:
        - npcId: walter_shambling_mound
          cr: 5
          type: plant
      description: "A massive mound of rotting flesh and vegetation rises from the sacrificial pit. This is what remains of baby Walter and all the cult's victims."
      bossEncounter: true
```

### Event: Shambling Mound Defeated
```yaml
eventId: shambling_mound_defeated
name: "The House Begins to Collapse"
trigger_type: conditional
trigger_conditions:
  - type: npc_status
    npcId: walter_shambling_mound
    status: dead
effects:
  - type: quest_trigger
    questId: durst_children_quest
    questStatus: resolved
  - type: state_update
    locationId: death-house
    stateChanges:
      house_collapsing: true
      escape_timer_started: true
      doors_unlocked: true
  - type: custom
    description: "The house shudders violently. Walls crack, ceiling beams splinter, and debris falls. You have minutes to escape before the entire structure collapses."
  - type: npc_encounter
    npcIds:
      - rose_durst
      - thorn_durst
    encounterType: grateful
    dialogue: "The children's ghosts appear one final time, smiling peacefully. 'Thank you,' Rose whispers. They fade into light and are gone."
```

---

## Quest Resolution Event

### Event: Children's Quest Completed
```yaml
eventId: durst_children_freed
name: "The Durst Children Find Peace"
trigger_type: conditional
trigger_conditions:
  - type: all_of
    conditions:
      - walter_shambling_mound: dead
      - parents_defeated: true
effects:
  - type: quest_resolution
    questId: durst_children_quest
    outcome: success
    rewards:
      - xp: 200
      - reputation: "Freed the Durst children's spirits"
  - type: state_update
    locationId: death-house
    stateChanges:
      npc_states:
        rose_durst:
          status: at_peace
        thorn_durst:
          status: at_peace
```

---

## Escape Sequence Event

### Event: Timed Escape
```yaml
eventId: death_house_escape
name: "Escape the Collapsing House"
trigger_type: conditional
trigger_conditions:
  - type: game_flag
    flag: escape_timer_started
    value: true
effects:
  - type: skill_check
    checkType: initiative
    description: "Roll initiative for escape sequence. Each round, make DC 15 Dexterity saving throws to avoid falling debris (3d6 bludgeoning damage on fail). Reach the exit in 5 rounds or be buried alive."
  - type: custom
    description: "Skill challenges: Athletics to climb over rubble, Acrobatics to dodge debris, Perception to find safe path, Strength to force jammed doors."
```
