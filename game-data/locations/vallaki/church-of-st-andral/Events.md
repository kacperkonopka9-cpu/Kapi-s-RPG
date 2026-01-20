# Church of St. Andral - Events

```yaml
events:
  - eventId: bones_theft_discovery
    name: "Discovery of Stolen Bones"
    trigger_type: conditional
    trigger_conditions:
      players_investigate_church: true
      father_lucian_trust: ">= 3"
    effects:
      - type: narrative
        text: "Father Lucian's composure breaks. 'The bones... St. Andral's bones are gone. Without them, the church's protection is gone. Vallaki is vulnerable.'"
      - type: quest_trigger
        questId: st_andrals_feast
        status: active
      - type: state_update
        locationId: vallaki/church-of-st-andral
        stateChanges:
          bones_theft_known: true

  - eventId: vampire_spawn_attack
    name: "Vampire Spawn Attack Church"
    trigger_type: conditional
    trigger_conditions:
      st_andrals_feast_triggered: true
    effects:
      - type: combat_encounter
        monsters:
          - type: vampire_spawn
            count: 6
            cr: 5
      - type: state_update
        stateChanges:
          church_desecrated: true
          father_lucian_fate: combat_dependent
```
