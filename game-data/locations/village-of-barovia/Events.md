# Events in Village of Barovia

events:
  - eventId: kolyan_indirovich_death
    name: "Death of Burgomaster Kolyan Indirovich"
    trigger_type: date_time
    trigger_date: "735-10-3T06:00:00Z"
    effects:
      - type: npc_status
        npcId: kolyan_indirovich
        status: Dead
      - type: state_update
        locationId: village-of-barovia
        stateChanges:
          burgomaster_dead: true
          quest_active_bury_burgomaster: true
      - type: custom
        description: "Ireena's status updates to 'Orphaned', Ismark's status updates to 'Desperate'. Unlocks 'Bury the Burgomaster' quest."

  - eventId: strahd_becomes_aware_of_ireena
    name: "Strahd Becomes Aware of Ireena's Movement"
    trigger_type: conditional
    trigger_conditions:
      ireena_in_party: true
      ireena_left_village: true
    effects:
      - type: quest_trigger
        questId: strahd_pursuit_begins
        status: active
      - type: state_update
        locationId: village-of-barovia
        stateChanges:
          strahd_aware_of_party: true
          strahd_interest_level: high
      - type: custom
        description: "Strahd begins actively pursuing the party. Frequency of Strahd encounters increases. Night attacks become more common."

  - eventId: dire_wolf_night_attack
    name: "Dire Wolf Attack"
    trigger_type: conditional
    trigger_conditions:
      time_of_day: night
      party_traveling: true
      location_id: village-of-barovia
    effects:
      - type: combat_encounter
        encounterId: dire_wolves_pack
        monsters:
          - type: dire_wolf
            count: 3
            cr: 1
      - type: custom
        description: "Pack of 3 dire wolves attacks party during night travel. Wolves are hunting under Strahd's influence but not directly controlled."
