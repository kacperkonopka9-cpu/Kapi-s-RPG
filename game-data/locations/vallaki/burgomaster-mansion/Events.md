# Burgomaster Mansion - Events

```yaml
events:
  - eventId: baron_festival_decree
    name: "Baron's New Festival Decree"
    trigger_type: conditional
    trigger_conditions:
      party_in_mansion: true
    effects:
      - type: narrative
        text: "Baron proclaims yet another festival to 'defeat the darkness through joy'"
      - type: state_update
        stateChanges:
          festival_announced: true

  - eventId: izek_searches_for_ireena
    name: "Izek's Obsessive Search"
    trigger_type: conditional
    trigger_conditions:
      ireena_in_vallaki: true
    effects:
      - type: narrative
        text: "Izek shows players a crude doll resembling Ireena, asking if they've seen this woman"
      - type: state_update
        stateChanges:
          izek_searching: true
```
