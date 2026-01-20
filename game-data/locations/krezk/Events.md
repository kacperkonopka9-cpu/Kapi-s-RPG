# Village of Krezk - Events

## Village-Wide Events

### Event: Ilya's Death
```yaml
eventId: ilya_death
name: "Ilya Krezkov Dies"
trigger_type: conditional
trigger_conditions:
  - type: time_elapsed
    description: "Ilya has been sick for specified duration without healing"
    days_since_illness_start: 7
    checked_flag: ilya_healed
    checked_flag_value: false
  - type: game_flag_not_set
    flag: ilya_healed
effects:
  - type: npc_status
    npcId: ilya_krezkov
    status: dead
    location: krezk/burgomaster-house
  - type: state_update
    locationId: krezk
    stateChanges:
      npc_states:
        ilya_krezkov:
          status: dead
          cause: unknown_illness
        dmitri_krezkov:
          mood: devastated
          mental_state: breaking
        anna_krezkova:
          mood: catatonic
          will_to_live: fading
  - type: state_update
    locationId: krezk/burgomaster-house
    stateChanges:
      ilya_status: dead
      funeral_preparations: true
  - type: custom
    description: "Village enters period of mourning. Dmitri's leadership becomes erratic. Anna may become target for Abbot's manipulation or may take drastic action (seeking resurrection at pool, bargaining with Strahd, etc.)"
```

**Consequences**:
- Dmitri becomes desperate and potentially dangerous—might make deals with dark powers
- Anna might bring Ilya's body to the blessed pool (triggering resurrection attempt)
- Village morale drops, trust in Burgomaster wavers
- Father Andrei must perform funeral rites
- If party was present and failed to help, village trust drops significantly

---

### Event: Blessed Pool Resurrection
```yaml
eventId: blessed_pool_resurrection
name: "Resurrection at the Blessed Pool"
trigger_type: conditional
trigger_conditions:
  - type: player_enters_location
    locationId: krezk/blessed-pool
    with_condition: carrying_corpse
  - type: custom_check
    description: "Party brings a corpse to the blessed pool seeking resurrection"
effects:
  - type: custom
    description: "Sergei's spirit manifests from the pool. He may offer resurrection for worthy souls, provide guidance about Ireena/Tatyana, or deliver prophecy about defeating Strahd."
  - type: state_update
    locationId: krezk/blessed-pool
    stateChanges:
      pool_activated: true
      sergei_manifestation: true
      resurrection_performed: true
  - type: quest_trigger
    questId: sergei_and_tatyana
    stage: sergei_revealed
  - type: state_update
    locationId: krezk
    stateChanges:
      blessed_pool_power_known: true
      village_faith_restored: true
```

**Consequences**:
- If Ilya is brought here and resurrected, Dmitri and Anna become devoted allies
- If Ireena comes here, Sergei's spirit offers her a choice (become one with him, escaping Strahd)
- Pool's power becomes widely known, attracting pilgrims (and Strahd's attention)
- Village trust increases significantly if pool helps Krezk residents

**Limitations**:
- Pool can only resurrect those who died recently (within days)
- Sergei's spirit only manifests for worthy causes
- Cannot resurrect those who died of old age or evil acts
- One-time use per individual soul

---

### Event: Abbot's Wrath
```yaml
eventId: abbot_wrath
name: "The Abbot's Divine Fury"
trigger_type: conditional
trigger_conditions:
  - type: any_of
    conditions:
      - vasilka_destroyed: true
      - abbey_sanctum_desecrated: true
      - mongrelfolk_freed: true
      - abbot_work_disrupted: true
effects:
  - type: combat_encounter
    locationId: krezk/abbey-of-st-markovia
    encounterDetails:
      name: "The Abbot's Judgment"
      enemies:
        - npcId: the_abbot
          cr: 15
          type: deva_fallen
          abilities:
            - angelic_weapons
            - healing_touch
            - flight
            - change_shape
      difficulty: deadly
      environment: abbey_grounds
  - type: state_update
    locationId: krezk/abbey-of-st-markovia
    stateChanges:
      abbot_hostile: true
      abbey_under_siege: true
  - type: state_update
    locationId: krezk
    stateChanges:
      abbey_conflict: true
      village_on_alert: true
```

**Consequences**:
- The Abbot attacks with full deva powers (CR 15 encounter)
- If party defeats Abbot, mongrelfolk are freed but confused
- Village reacts with fear—some view Abbot's death as liberation, others as doom
- Without Abbot, abbey becomes dangerous ruin inhabited by freed mongrelfolk
- Strahd may learn of Abbot's death and react (anger at losing "wedding gift" Vasilka)

**Combat Notes**:
- The Abbot fights to subdue, not kill (initially)
- If reduced below half HP, becomes lethal
- Uses Change Shape to confuse party
- Flies out of melee range and uses ranged attacks
- Will heal allies (mongrelfolk) if present

---

### Event: Wine Delivery Arrival
```yaml
eventId: wine_delivery_arrival
name: "Wine from the Wizard of Wines"
trigger_type: conditional
trigger_conditions:
  - type: player_action
    action: deliver_wine
    locationId: krezk
    target_npc: dmitri_krezkov
effects:
  - type: state_update
    locationId: krezk
    stateChanges:
      wine_delivered: true
      village_trust: +2
      gates_open: true
  - type: npc_status
    npcId: dmitri_krezkov
    mood: grateful
    disposition_to_party: friendly
  - type: custom
    description: "Dmitri grants party entry to Krezk and offers them lodging. Villagers become more welcoming. Religious ceremonies can resume with wine for sacraments."
```

**Consequences**:
- Village trust increased by +2 (major positive action)
- Gates open to party freely
- Dmitri offers quest to help with Ilya
- Father Andrei offers blessings and minor healing services
- Villagers sell goods at fair prices

---

### Event: Ireena Seeks Sanctuary
```yaml
eventId: ireena_sanctuary_krezk
name: "Ireena Requests Sanctuary in Krezk"
trigger_type: conditional
trigger_conditions:
  - type: player_enters_location
    locationId: krezk
    with_npc: ireena_kolyana
  - type: village_trust
    minimum: 3
effects:
  - type: state_update
    locationId: krezk
    stateChanges:
      npc_states:
        ireena_kolyana:
          status: present
          sanctuary_granted: true
          location: krezk/burgomaster-house
  - type: quest_trigger
    questId: escort_ireena
    stage: krezk_sanctuary
  - type: custom
    description: "If trust is sufficient and Ilya situation is resolved, Dmitri offers Ireena shelter. She is safer here than Vallaki due to isolation and blessed pool's protection. However, Strahd will eventually find her."
```

**Consequences**:
- Ireena stays with Burgomaster's family or at Shrine
- Village becomes potential target for Strahd's forces
- If Ilya is healed, Dmitri grateful and protective
- Ireena feels safer but knows it's temporary
- Sets up potential blessed pool/Sergei encounter

---

### Event: Strahd Assaults Krezk
```yaml
eventId: strahd_assaults_krezk
name: "Strahd's Siege of Krezk"
trigger_type: conditional
trigger_conditions:
  - type: game_flag_set
    flag: ireena_in_krezk
    duration_days: 7
  - type: strahd_patience_exhausted
    threshold: true
effects:
  - type: combat_encounter
    locationId: krezk/village-gates
    encounterDetails:
      name: "Siege of Krezk"
      enemies:
        - count: 20
          type: zombie
        - count: 6
          type: dire_wolf
        - count: 2
          type: vampire_spawn
        - optional:
            npcId: strahd_von_zarovich
            appears_if: party_level >= 8
      difficulty: deadly
      duration: multiple_waves
  - type: state_update
    locationId: krezk
    stateChanges:
      under_siege: true
      walls_breached: conditional
      casualties: high
  - type: custom
    description: "Strahd leads an assault on Krezk to claim Ireena. Village guards and party must defend. If walls fall, Strahd enters and confronts party at Ireena's location."
```

**Consequences**:
- Major combat encounter with waves of undead
- Village guards fight alongside party
- If Ireena at blessed pool, Sergei's spirit may manifest
- Strahd may offer terms (surrender Ireena, spare village)
- Village fate depends on party's success

---

## Recurring Events

### Daily Prayer Services
```yaml
eventId: daily_prayers_krezk
name: "Morning and Evening Prayers"
trigger_type: recurring
recurrence: daily
times: ["06:00", "18:00"]
effects:
  - type: custom
    description: "Villagers gather at Shrine of the White Sun for prayers led by Father Andrei. Party can attend for morale boost and village integration."
```

---

### Gate Watch Changes
```yaml
eventId: gate_watch_change
name: "Guard Shift Rotation"
trigger_type: recurring
recurrence: daily
times: ["06:00", "14:00", "22:00"]
effects:
  - type: custom
    description: "Gate guards rotate shifts. Brief window of distraction during changeover if party needs to sneak past."
```

---

## Notes for Epic 2 Integration

All events conform to EventScheduler schema (Epic 2):
- `eventId`: Unique identifier
- `name`: Display name for event
- `trigger_type`: date_time, conditional, recurring
- `trigger_conditions`: Array of conditions that must be met
- `effects`: Array of effects to apply (npc_status, state_update, combat_encounter, quest_trigger, custom)

Events are checked by EventScheduler when:
- Time advances (for time-based triggers)
- Location changes (for location-based triggers)
- Game state changes (for conditional triggers)

EventExecutor loads these definitions and applies effects to appropriate State.md files via Epic 1 StateManager.
