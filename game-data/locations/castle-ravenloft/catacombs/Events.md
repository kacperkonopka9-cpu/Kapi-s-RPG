# Events in Castle Ravenloft - Catacombs

events:
  - eventId: catacombs_strahd_final_battle
    name: "Final Battle with Strahd"
    trigger_type: conditional
    trigger_conditions:
      strahd_hp: 0
      strahd_retreating_to_coffin: true
    effects:
      - type: narrative
        text: "Strahd's form dissolves into mist, flowing through the corridors toward his coffin. You have 2 hours to stake him before he regenerates. The final confrontation is at hand."
      - type: combat_encounter
        encounterId: strahd_coffin_defense
        description: "Strahd defends coffin with all remaining power. Phase 5 combat—desperate, brutal, no mercy."

  - eventId: catacombs_strahd_staked
    name: "Strahd Destroyed Permanently"
    trigger_type: conditional
    trigger_conditions:
      strahd_in_coffin: true
      stake_driven_through_heart: true
    effects:
      - type: narrative
        text: "You drive the wooden stake through Strahd's heart. He screams—a sound of rage, pain, and relief. His body crumbles to ash. The curse of Barovia begins to lift. You have won."
      - type: quest_trigger
        questId: defeat_strahd
        status: completed

  - eventId: catacombs_undead_guardians
    name: "Wights and Wraiths Activate"
    trigger_type: conditional
    trigger_conditions:
      party_approaches_k86: true
    effects:
      - type: combat_encounter
        monsters:
          - type: wight
            count: "1d6+2"
            cr: 3
          - type: wraith
            count: "1d4"
            cr: 5

  - eventId: catacombs_sergeis_sanctuary
    name: "Sanctuary at Sergei's Tomb"
    trigger_type: conditional
    trigger_conditions:
      party_at_sergeis_tomb: true
    effects:
      - type: narrative
        text: "Sergei's tomb radiates peace. Undead cannot approach within 10 feet. You may rest here briefly—but Strahd will come if you linger too long."
      - type: custom
        description: "Short rest allowed. Long rest triggers Strahd arrival (arrives with full forces, no mercy)."

  - eventId: catacombs_teleportation_trap
    name: "Maze Teleportation Trap"
    trigger_type: conditional
    trigger_conditions:
      party_searching_catacombs: true
      random_chance: 30%
    effects:
      - type: custom
        description: "DC 15 Intelligence (Investigation) or party teleports to random catacomb location, separated. Must regroup."

  - eventId: catacombs_sunsword_discovered
    name: "Sunsword Found (If Tarokka Placed Here)"
    trigger_type: conditional
    trigger_conditions:
      sunsword_location: catacombs
      sergeis_tomb_opened: true
    effects:
      - type: item_found
        itemId: sunsword
        description: "In Sergei's tomb, you find a sword hilt. When wielded, a blade of pure sunlight manifests. This is the Sunsword—one of three legendary artifacts needed to destroy Strahd."
      - type: quest_trigger
        questId: legendary_artifacts
        status: updated
