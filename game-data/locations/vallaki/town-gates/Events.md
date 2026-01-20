# Town Gates - Events

```yaml
events:
  - eventId: gates_close_curfew
    name: "Evening Curfew - Gates Close"
    trigger_type: time_based
    trigger_schedule:
      frequency: daily
      time: "18:00"
    effects:
      - type: narrative
        text: "Horns sound from the guard towers. The massive timber gates grind closed with booming finality. Vallaki seals itself against the night."
      - type: state_update
        stateChanges:
          gates_open: false
          guards_on_duty: 6
          curfew_active: true

  - eventId: gates_open_dawn
    name: "Morning - Gates Open"
    trigger_type: time_based
    trigger_schedule:
      frequency: daily
      time: "06:00"
    effects:
      - type: narrative
        text: "Dawn breaks over Vallaki. Guards unbolt the massive gate bars, and the doors swing open to admit the day's travelers—and whatever else the mists might bring."
      - type: state_update
        stateChanges:
          gates_open: true
          guards_on_duty: 4
          curfew_active: false

  - eventId: wolf_attack_gates
    name: "Wolf Pack at the Gates"
    trigger_type: conditional
    trigger_conditions:
      time_of_day: night
      moon_phase: "full"
    effects:
      - type: combat_encounter
        monsters:
          - type: dire_wolf
            count: 2d4
            cr: 1
      - type: narrative
        text: "Wolf howls echo from beyond the walls. Shadows move in the mist. The guards raise crossbows, shouting warnings. Strahd's wolves have come to test Vallaki's defenses."
      - type: state_update
        stateChanges:
          last_wolf_attack: current_date
          town_panic_level: increased
```
