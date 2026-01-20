# Argynvostholt - Events

## Quest Events

### Event: Vladimir's Opposition
```yaml
eventId: vladimir_opposes_beacon
name: "The Revenant's Hatred"
trigger_type: conditional
trigger_conditions:
  - type: attempt_to_move_skull
    value: true
effects:
  - type: npc_encounter
    npcIds:
      - vladimir_horngaard
    disposition: hostile
  - type: combat_encounter
    locationId: argynvostholt
    encounterDetails:
      name: "Vladimir Horngaard's Wrath"
      enemies:
        - type: revenant
          cr: 5
          count: 1
      difficulty: medium
  - type: custom
    description: "Vladimir materializes, fury radiating from him. 'You would light the beacon? Give Strahd hope? NEVER!' He attacks to prevent the skull's removal."
```

**Consequences**: CR 5 boss fight. Vladimir rejuvenates unless permanently put to rest. Can be negotiated with (DC 18 Persuasion).

---

### Event: Godfrey's Aid
```yaml
eventId: godfrey_assists
name: "The Knight's Honor"
trigger_type: conditional
trigger_conditions:
  - type: party_proves_worthy
    value: true
effects:
  - type: npc_encounter
    npcIds:
      - godfrey_gwilym
    disposition: friendly
  - type: custom
    description: "Sir Godfrey approaches quietly. 'Vladimir is wrong. Our purpose was to protect, not to torture. I will help you light the beacon. Argynvost deserves to guide you where we failed.'"
  - type: social_opportunity
    description: "Godfrey provides ritual instructions and will distract Vladimir during the ceremony."
```

**Consequences**: Godfrey becomes ally, provides beacon ritual knowledge, may oppose Vladimir to help party.

---

### Event: Light the Beacon
```yaml
eventId: light_dragon_beacon
name: "The Beacon of Argynvostholt"
trigger_type: conditional
trigger_conditions:
  - type: skull_returned_to_mausoleum
    value: true
  - type: ritual_performed
    value: true
effects:
  - type: custom
    description: "The beacon tower erupts with brilliant silver light, visible across all Barovia. Argynvost's spirit manifests—a spectral silver dragon wreathed in holy radiance. 'You have honored my order and restored hope. Take my blessing, champions. May it shield you against the darkness.'"
  - type: quest_resolution
    questId: light_argynvost_beacon
    outcome: success
    rewards:
      - xp: 1000
      - blessing: argynvost_protection
  - type: state_update
    locationId: argynvostholt
    stateChanges:
      beacon_lit: true
      argynvost_spirit_summoned: true
```

**Consequences**: Party gains Argynvost's Blessing (+1 AC and saves vs. Strahd). Beacon visible across Barovia, symbolically opposing Strahd's tyranny. Revenant spirits may finally find peace.

---

## Combat Events

### Event: Revenant Patrol
```yaml
eventId: revenant_encounter
name: "The Undying Knights"
trigger_type: conditional
trigger_conditions:
  - type: explore_mansion
    value: true
  - type: random_chance
    probability: 0.5
effects:
  - type: combat_encounter
    locationId: argynvostholt
    encounterDetails:
      name: "Revenant Patrol"
      enemies:
        - type: revenant
          cr: 5
          count: 1d3
      difficulty: deadly
```

**Consequences**: Revenant encounters are CR 5 each. Rejuvenate unless put to rest. Can be negotiated with (respect for Order earns passage).

---

## Notes for Epic 2 Integration

All events follow EventScheduler schema. Argynvostholt focuses on moral choice: help Vladimir torment Strahd eternally, or light beacon and give party (and Strahd) hope.
