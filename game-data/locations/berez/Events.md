# Berez - Events

## Combat Events

### Event: Baba Lysaga Boss Fight
```yaml
eventId: baba_lysaga_battle
name: "The Hag's Fury"
trigger_type: conditional
trigger_conditions:
  - type: approach_walking_hut
    value: true
effects:
  - type: combat_encounter
    locationId: berez
    encounterDetails:
      name: "Baba Lysaga and Her Creeping Hut"
      enemies:
        - type: night_hag_boss
          cr: 11
          count: 1
        - type: animated_hut
          cr: 4
          count: 1
      environment: swamp
      difficulty: deadly
      special_mechanics:
        - flying_skull_mobility
        - hut_trampling
        - scarecrow_reinforcements
        - legendary_actions
  - type: atmosphere
    description: "Baba Lysaga emerges from her hut, riding a massive floating skull. 'You dare threaten my sweet Strahd's mother?! I'll feed your bones to my scarecrows!' The hut rises on chicken legs, ready to stomp attackers."
  - type: state_update
    locationId: berez
    stateChanges:
      baba_lysaga_battle_begun: true
```

**Consequences**: CR 11 + CR 4 encounter (deadly for even level 9-10 parties). Baba Lysaga uses area spells and legendary actions. Hut tramples and kicks. Scarecrows join as reinforcements. Victory grants third winery gem.

---

### Event: Scarecrow Ambush
```yaml
eventId: scarecrow_swarm
name: "The Guardians Animate"
trigger_type: conditional
trigger_conditions:
  - type: enter_berez_swamp
    value: true
effects:
  - type: combat_encounter
    locationId: berez
    encounterDetails:
      name: "Scarecrow Swarm"
      enemies:
        - type: scarecrow
          cr: 1
          count: 2d6
      difficulty: medium
```

**Consequences**: Initial encounter with scarecrow guardians. Alerts Baba Lysaga to intruders. Scarecrows vulnerable to fire.

---

## Quest Events

### Event: Berez Quest Unlocked
```yaml
eventId: berez_gem_quest_available
name: "Final Winery Gem Location Revealed"
trigger_type: conditional
trigger_conditions:
  - type: quest_completed
    questId: wizard_of_wines_delivery
    value: true
effects:
  - type: quest_trigger
    questId: return_berez_gem
    questStatus: available
  - type: custom
    description: "With the Wizard of Wines winery secured, Davian Martikov reveals the location of the third and final gem: Berez, the ruined village in the swamp. Baba Lysaga, Strahd's ancient guardian, has embedded it in her creeping hut. This will be the most dangerous retrieval yet."
```

**Consequences**: Quest becomes available only after completing Wizard of Wines. Represents final escalation of winery quest chain.

---

### Event: Winery Gem Recovery Complete
```yaml
eventId: final_winery_gem_recovered
name: "The Last Gem Returns Home"
trigger_type: conditional
trigger_conditions:
  - type: baba_lysaga_defeated
    value: true
  - type: gem_extracted_from_hut
    value: true
effects:
  - type: quest_item_obtained
    itemId: winery_gem_champagne
  - type: quest_resolution
    questId: return_berez_gem
    outcome: success
    rewards:
      - xp: 1000
      - item: winery_gem_champagne
      - martikov_eternal_alliance: true
  - type: custom
    description: "With Baba Lysaga defeated and her hut destroyed, you extract the final winery gem. All three gems recovered. Davian Martikov will be overjoyed—full wine production can resume."
```

**Consequences**: Completes 3-phase winery quest chain (Winery siege → Yester Hill gem → Berez gem). Martikovs become eternal allies. Full wine production resumes. Major reputation boost across Barovia.

---

## Notes for Epic 2 Integration

All events follow EventScheduler schema. Berez is end-game location with CR 11 boss. Primary purpose is winery gem quest completion.
