# Reformation Center - Events

```yaml
events:
  - eventId: mass_imprisonment
    name: "Mass Imprisonment After Failed Festival"
    trigger_type: conditional
    trigger_conditions:
      festival_disaster: true
      baron_vallakovich_alive: true
    effects:
      - type: narrative
        text: "In the wake of the festival disaster, Baron's guards sweep through town arresting anyone who looked insufficiently devastated. The reformation center overflows with 'malcontents.'"
      - type: state_update
        stateChanges:
          prisoner_count: increased_significantly
          town_morale: very_low

  - eventId: prison_break_opportunity
    name: "Skeleton Night Watch"
    trigger_type: time_based
    trigger_schedule:
      time_range: "22:00-06:00"
    effects:
      - type: narrative
        text: "Night watch is minimal—only two tired guards patrol the reformation center. Cell doors are old, locks worn. An opportunity for those seeking to free prisoners."
      - type: state_update
        stateChanges:
          guards_on_duty: 2
          prison_security: reduced
```
