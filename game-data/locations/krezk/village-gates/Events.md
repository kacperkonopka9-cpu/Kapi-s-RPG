# Village Gates - Events

### Event: Entry Inspection
```yaml
eventId: gate_inspection
name: "Boris Interrogates Visitors"
trigger_type: conditional
trigger_conditions:
  - type: party_approaches_gates
    first_time: true
effects:
  - type: custom
    description: "Boris questions party from above: state business, show credentials, prove worthiness to enter. Outcome depends on party's answers and items brought."
  - type: skill_check
    skill: persuasion_or_deception
    dc: 15
    success: gates_open
    failure: entry_denied
```

### Event: Wine Delivery Entry
```yaml
eventId: wine_delivery_entry
name: "Wine Grants Entry"
trigger_type: conditional
trigger_conditions:
  - type: party_has_wine
    from: wizard_of_wines
effects:
  - type: custom
    description: "Boris sees wine crates. Immediately sends word to Dmitri. Gates open. Village trust +2."
  - type: state_update
    locationId: krezk
    stateChanges:
      gates_open: true
      village_trust: +2
```

### Event: Gate Defense (Siege)
```yaml
eventId: gate_defense
name: "Defense of Krezk's Gates"
trigger_type: conditional
trigger_conditions:
  - type: village_under_attack
    attackers: strahd_forces
effects:
  - type: combat_encounter
    locationId: krezk/village-gates
    encounterDetails:
      name: "Siege of the Gates"
      enemies:
        - count: 20
          type: zombie
        - count: 6
          type: dire_wolf
      allies:
        - count: 8
          type: krezk_guards
  - type: custom
    description: "Waves of undead assault gates. Guards fight alongside party. If gates fall, village is breached."
```
