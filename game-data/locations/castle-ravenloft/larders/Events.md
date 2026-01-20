# Events in Castle Ravenloft - Larders

events:
  - eventId: larders_rahadin_encounter
    name: "Confrontation with Rahadin"
    trigger_type: conditional
    trigger_conditions:
      party_in_rahadins_office: true
      rahadin_present: true
    effects:
      - type: combat_encounter
        monsters:
          - type: rahadin
            cr: 10
      - type: custom
        description: "Deathly Choir aura: DC 15 Wisdom save or frightened. Rahadin fights to defend office and alert Strahd."

  - eventId: larders_prisoner_rescue
    name: "Rescue Living Prisoners"
    trigger_type: conditional
    trigger_conditions:
      cells_opened: true
      living_prisoners_present: true
    effects:
      - type: quest_trigger
        questId: rescue_prisoners
      - type: custom
        description: "Prisoners provide information: castle layout, Strahd's habits, guard schedules. May join party if escorted to safety."

  - eventId: larders_vampire_spawn_feeding
    name: "Vampire Spawn Feed on Prisoners"
    trigger_type: conditional
    trigger_conditions:
      time: night
      party_in_dungeons: true
    effects:
      - type: combat_encounter
        monsters:
          - type: vampire_spawn
            count: "1d3"
            cr: 5

  - eventId: larders_elevator_trap
    name: "Elevator Trap Activates"
    trigger_type: conditional
    trigger_conditions:
      platform_weight_exceeded: 200_lbs
      trap_not_disabled: true
    effects:
      - type: custom
        description: "Platform descends rapidly to catacombs. DC 15 Dex save or 3d6 falling damage + arrive surprised (undead waiting below)."

  - eventId: larders_cyrus_information
    name: "Cyrus Provides Castle Map"
    trigger_type: conditional
    trigger_conditions:
      cyrus_befriended: true
    effects:
      - type: item_found
        description: "Cyrus gives hand-drawn map showing secret passages throughout castle. Tactical advantage for navigation."
