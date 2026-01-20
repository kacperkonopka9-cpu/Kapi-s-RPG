# Town Square - Events

```yaml
events:
  - eventId: festival_celebration_town_square
    name: "Festival in Town Square"
    trigger_type: conditional
    trigger_conditions:
      festival_active: true
    effects:
      - type: narrative
        text: "The town square erupts with forced celebration. Music plays, dancers whirl, and the Baron surveys his 'triumph' with manic joy."
      - type: state_update
        stateChanges:
          festival_active: true
          crowd_size: large

  - eventId: stocks_punishment
    name: "Public Punishment in Stocks"
    trigger_type: conditional
    trigger_conditions:
      malcontents_captured: true
    effects:
      - type: narrative
        text: "Guards drag 'malcontents' to the stocks for public humiliation. Their crime? Failing to smile enthusiastically enough."
      - type: state_update
        stateChanges:
          prisoners_in_stocks: increased
```
