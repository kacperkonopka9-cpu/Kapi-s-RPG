# Events in Castle Ravenloft - Guest Quarters

events:
  - eventId: guest_quarters_vampire_spawn_ambush
    name: "Vampire Spawn Brides Attack"
    trigger_type: conditional
    trigger_conditions:
      party_in_guest_quarters: true
      time: night
    effects:
      - type: combat_encounter
        monsters:
          - type: vampire_spawn
            count: "2d3"
            cr: 5

  - eventId: guest_quarters_strahd_at_portrait
    name: "Strahd Gazes at Tatyana's Portrait"
    trigger_type: conditional
    trigger_conditions:
      time: night
      random_chance: 20%
    effects:
      - type: narrative
        text: "Strahd stands before Tatyana's portrait, lost in melancholic contemplation. He doesn't acknowledge your presence immediately."

  - eventId: guest_quarters_portrait_damaged
    name: "Portrait Damaged (Strahd Enraged)"
    trigger_type: conditional
    trigger_conditions:
      portrait_attacked: true
    effects:
      - type: custom
        description: "Strahd arrives in 1 round, enraged. Phase 4-5 combat, no mercy."

  - eventId: guest_quarters_secret_passage
    name: "Secret Passage Discovered"
    trigger_type: conditional
    trigger_conditions:
      portrait_investigated: true
      dc_15_check_passed: true
    effects:
      - type: narrative
        text: "Behind the portrait, a narrow passage leads to tower areas—escape route or shortcut."
