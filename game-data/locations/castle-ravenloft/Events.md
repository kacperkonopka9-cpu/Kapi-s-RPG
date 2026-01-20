# Events in Castle Ravenloft

events:
  - eventId: strahd_arrives
    name: "Strahd Arrives to Greet Visitors"
    trigger_type: conditional
    trigger_conditions:
      party_in_castle: true
      party_makes_noise: true  # Combat, loud actions, or entering key areas
      strahd_aware_of_party: true
    effects:
      - type: custom
        description: "Strahd personally appears to greet the party. He may engage in conversation, psychological warfare, charm attempts, or combat depending on party strength and his current phase. Uses his tactical intelligence to assess threats."
      - type: state_update
        locationId: castle-ravenloft
        stateChanges:
          strahd_encountered: true
          strahd_mood: testing  # Changes based on party actions: observant -> testing -> engaged -> wounded -> desperate
      - type: quest_trigger
        questId: strahd_confrontation
        status: active

  - eventId: lair_actions_activate
    name: "Castle Lair Actions (During Strahd Combat)"
    trigger_type: conditional
    trigger_conditions:
      combat_active: true
      strahd_in_combat: true
      location_id: castle-ravenloft  # Or any sub-location within castle
    effects:
      - type: custom
        description: "On initiative count 20 (losing initiative ties), Strahd can take a lair action to cause one of the following effects: (1) Until initiative count 20 on the next round, Strahd can pass through solid walls, doors, ceilings, and floors as if they weren't there. (2) Strahd targets any number of doors and windows that he can see, causing each one to either open or close as he wishes. Closed doors can be magically locked (DC 20 to break). (3) Strahd summons the angry spirit of one who has died in the castle. The apparition appears next to a hostile creature within 60 feet, uses frightful presence, then disappears."
      - type: combat_encounter
        encounterId: lair_action_manifestation
        description: "Environmental hazard or summoned entity based on Strahd's chosen action"

  - eventId: heart_of_sorrow_absorption
    name: "Heart of Sorrow Protects Strahd"
    trigger_type: conditional
    trigger_conditions:
      strahd_takes_damage: true
      heart_of_sorrow_destroyed: false
      crystal_heart_intact: true
    effects:
      - type: state_update
        locationId: castle-ravenloft
        stateChanges:
          heart_absorbed_damage: 50  # Heart absorbs up to 50 damage per round
      - type: custom
        description: "The Heart of Sorrow (K20) absorbs the first 50 points of damage dealt to Strahd this round. A red beam connects Strahd to the tower briefly. If more than 50 damage is dealt, Strahd takes the overflow. If the Heart is destroyed (50 HP, AC 17), this protection ends permanently."

  - eventId: strahd_retreat_to_coffin
    name: "Strahd Tactical Retreat (Misty Escape)"
    trigger_type: conditional
    trigger_conditions:
      strahd_hp_below: 25
      strahd_not_in_coffin: true
    effects:
      - type: custom
        description: "When reduced to 0 HP while outside his coffin, Strahd transforms into mist (if able) and must reach his coffin in K86 within 2 hours or be destroyed. In mist form, he has speed 20 ft., can slip through cracks, can't take actions or speak, and has resistance to all damage. He must rest in his coffin for 8 hours to regain form."
      - type: state_update
        locationId: castle-ravenloft
        stateChanges:
          strahd_in_mist_form: true
          strahd_retreating: true
          strahd_location: crypts  # Moving toward K86

  - eventId: strahd_phases_of_combat
    name: "Strahd Combat Phase Escalation"
    trigger_type: conditional
    trigger_conditions:
      strahd_combat_encounters: varies  # Increments each combat
    effects:
      - type: state_update
        locationId: castle-ravenloft
        stateChanges:
          strahd_combat_phase: increments  # 1-5 escalation
      - type: custom
        description: "Strahd's tactics evolve across 5 phases: (1) Observation - watches from shadows, assesses party; (2) Testing - probing attacks, charm attempts, summons minions; (3) Psychological Warfare - taunts, targets loved ones, uses environment; (4) Full Engagement - legendary actions, lair actions, all abilities; (5) Desperate Retreat - uses Misty Escape if losing."

  - eventId: animated_armor_patrol
    name: "Animated Armor Guardian Activation"
    trigger_type: conditional
    trigger_conditions:
      party_enters_hallway: true
      armor_not_destroyed: true
    effects:
      - type: combat_encounter
        encounterId: animated_armor_patrol
        monsters:
          - type: animated_armor
            count: "1d4+1"
            cr: 1

  - eventId: vampire_spawn_alert
    name: "Vampire Spawn Alerted to Intruders"
    trigger_type: conditional
    trigger_conditions:
      combat_in_castle: true
      noise_level: high
    effects:
      - type: custom
        description: "Nearby vampire spawn hear combat and move to investigate. Reinforcements arrive in 1d4 rounds."
      - type: combat_encounter
        encounterId: vampire_spawn_reinforcements
        monsters:
          - type: vampire_spawn
            count: "1d3"
            cr: 5

  - eventId: strahd_scrying
    name: "Strahd Observes via Scrying"
    trigger_type: conditional
    trigger_conditions:
      party_in_castle: true
      strahd_not_present: true
    effects:
      - type: custom
        description: "Strahd uses scrying to observe the party's actions throughout the castle. He watches from his study, learning their tactics, identifying threats, and planning his response. Players may notice a faint magical sensor or feel they are being watched."

  - eventId: castle_doors_lock
    name: "Castle Seals to Trap Intruders"
    trigger_type: conditional
    trigger_conditions:
      strahd_decides_to_trap_party: true
    effects:
      - type: state_update
        locationId: castle-ravenloft
        stateChanges:
          main_gate_locked: true
          escape_routes_blocked: true
      - type: custom
        description: "Strahd uses his control over the castle to seal exits. Main gates lock magically (DC 25 to force), windows seal with iron bars, secret passages close. The party is trapped until they defeat Strahd or find a way to break his hold on the castle."
