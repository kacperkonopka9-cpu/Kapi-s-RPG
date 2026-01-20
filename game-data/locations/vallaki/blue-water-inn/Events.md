# Blue Water Inn - Events

```yaml
events:
  - eventId: rictavio_identity_reveal
    name: "Rictavio's True Identity Revealed"
    trigger_type: conditional
    trigger_conditions:
      party_trust: high
      strahd_confrontation_occurred: true
    effects:
      - type: narrative
        text: "Rictavio drops his theatrical facade. 'My real name is Rudolph van Richten. I am a vampire hunter, and I've come to destroy Strahd von Zarovich.'"
      - type: npc_status
        npcId: rictavio
        status: identity_revealed
      - type: state_update
        stateChanges:
          van_richten_ally: true

  - eventId: wine_shortage_crisis
    name: "Wine Shortage Crisis"
    trigger_type: conditional
    trigger_conditions:
      party_arrival_vallaki: true
      urwin_trust: ">= 2"
    effects:
      - type: narrative
        text: "Urwin confides that the Wizard of Wines winery has stopped delivering wine. 'Something terrible has happened there. The Martikov family - my kin - they need help.'"
      - type: quest_trigger
        questId: wizard_of_wines_delivery
        status: available
      - type: state_update
        locationId: vallaki/blue-water-inn
        stateChanges:
          wine_shortage_known: true

  - eventId: wereraven_allies_offer_help
    name: "Keepers of the Feather Contact"
    trigger_type: conditional
    trigger_conditions:
      urwin_trust: high
      party_fought_strahd: true
    effects:
      - type: narrative
        text: "Urwin reveals his wereraven nature and offers aid from the Keepers of the Feather"
      - type: state_update
        stateChanges:
          keeper_alliance: true

  - eventId: tiger_escapes_wagon
    name: "Sabertooth Tiger Escape"
    trigger_type: conditional
    trigger_conditions:
      wagon_opened_incorrectly: true
    effects:
      - type: combat_encounter
        monsters:
          - type: sabertooth_tiger
            count: 1
            cr: 2
      - type: state_update
        stateChanges:
          tiger_loose: true
          rictavio_secret_exposed: true
```
