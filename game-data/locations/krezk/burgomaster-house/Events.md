# Burgomaster's House - Events

### Event: Ilya's Condition Worsens
```yaml
eventId: ilya_worsens
name: "Ilya's Health Deteriorates"
trigger_type: time_based
recurrence: daily
effects:
  - type: state_update
    locationId: krezk/burgomaster-house
    stateChanges:
      ilya_days_remaining: decrement
      parents_desperation: increase
  - type: npc_status
    npcId: ilya_krezkov
    health: declining
```

### Event: Ilya Healed
```yaml
eventId: ilya_healed
name: "Ilya Krezkov Restored to Health"
trigger_type: conditional
trigger_conditions:
  - type: healing_performed
    target: ilya_krezkov
    level: greater_restoration_or_higher
effects:
  - type: npc_status
    npcId: ilya_krezkov
    status: alive
    health: restored
  - type: npc_status
    npcId: dmitri_krezkov
    mood: grateful_joyful
  - type: npc_status
    npcId: anna_krezkova
    mood: relieved_grateful
  - type: state_update
    locationId: krezk
    stateChanges:
      village_trust: +3
      dmitri_disposition: devoted_ally
```

### Event: Parents' Grief (if Ilya dies)
```yaml
eventId: parents_grief_ilya_death
name: "Krezkov Family Mourning"
trigger_type: conditional
trigger_conditions:
  - type: npc_status
    npcId: ilya_krezkov
    status: dead
effects:
  - type: custom
    description: "Dmitri and Anna are devastated. House enters period of mourning. Father Andrei performs funeral rites."
  - type: state_update
    locationId: krezk/burgomaster-house
    stateChanges:
      mourning_active: true
      dmitri_mental_state: breaking
      anna_catatonic: true
```
