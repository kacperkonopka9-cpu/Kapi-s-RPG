# Events in Castle Ravenloft - Overlook

events:
  - eventId: overlook_gargoyles_attack
    name: "Gargoyles Attack from Above"
    trigger_type: conditional
    trigger_conditions:
      party_on_overlook: true
      gargoyles_active: true
    effects:
      - type: combat_encounter
        monsters:
          - type: gargoyle
            count: "2d4"
            cr: 2
      - type: custom
        description: "Gargoyles use flight and attempt to push PCs off edges. DC 15 Strength (Athletics) contested by gargoyle's Strength check to resist push."

  - eventId: overlook_high_winds
    name: "High Winds Hazard"
    trigger_type: conditional
    trigger_conditions:
      party_on_high_parapets_or_peaks: true
    effects:
      - type: custom
        description: "Each round on exposed areas, DC 12 Strength save or pushed 5 feet by winds. If pushed off edge, fall 500+ feet (20d6 damage, likely fatal)."

  - eventId: overlook_strahd_surveys_domain
    name: "Strahd Surveys His Domain"
    trigger_type: conditional
    trigger_conditions:
      time: night
      strahd_on_overlook: true
    effects:
      - type: narrative
        text: "Strahd stands at the tower peak, gazing out over Barovia. The wind whips his cloak. He seems melancholic, surveying his prison-kingdom. He may engage in conversation or combat depending on his mood."

  - eventId: overlook_strahd_tactical_retreat
    name: "Strahd Retreats to Tower Peak (Wounded)"
    trigger_type: conditional
    trigger_conditions:
      strahd_hp_below: 50
      strahd_tactical: true
    effects:
      - type: custom
        description: "Strahd uses Misty Step to reach tower peaks. Fights from height advantage, forces party to deal with winds and drop hazards. Uses lair actions to make combat extremely difficult (animate shadows, lock doors below, summon minions)."

  - eventId: overlook_pushed_off_edge
    name: "Character Pushed Off Edge"
    trigger_type: conditional
    trigger_conditions:
      pushed_off_parapet: true
    effects:
      - type: damage
        damageType: bludgeoning
        damage: "20d6"
        description: "500+ foot fall. DC 15 Dexterity save to grab edge (hanging, requires DC 15 Strength (Athletics) to climb back up). On failed save or failed climb, fall to death."
