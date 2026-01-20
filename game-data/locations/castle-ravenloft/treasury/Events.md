# Events in Castle Ravenloft - Treasury

events:
  - eventId: treasury_wraith_guardian
    name: "Wraith Defends Vault"
    trigger_type: conditional
    trigger_conditions:
      party_enters_treasury: true
      wraith_present: true
    effects:
      - type: combat_encounter
        monsters:
          - type: wraith
            cr: 5

  - eventId: treasury_strahd_catches_looters
    name: "Strahd Catches Party Looting"
    trigger_type: conditional
    trigger_conditions:
      party_opening_chests: true
      strahd_visits: true
    effects:
      - type: narrative
        text: "Strahd materializes in the doorway, eyes blazing. 'Thieves. In MY treasury. You will regret this.' He attacks without warning."
      - type: combat_encounter
        monsters:
          - type: strahd
            cr: 15

  - eventId: treasury_poisoned_lock
    name: "Poisoned Needle Trap"
    trigger_type: conditional
    trigger_conditions:
      chest_opened_without_disabling_trap: true
    effects:
      - type: damage
        damageType: poison
        damage: "2d6"
        savingThrow:
          ability: dexterity
          dc: 15
      - type: custom
        description: "On failed save, also poisoned condition for 1 hour."

  - eventId: treasury_sunsword_found
    name: "Sunsword Discovered"
    trigger_type: conditional
    trigger_conditions:
      central_vault_opened: true
      sunsword_location: treasury
    effects:
      - type: item_found
        itemId: sunsword
        description: "A sword hilt that, when wielded, produces a blade of pure sunlight. One of three legendary artifacts needed to defeat Strahd."
      - type: quest_trigger
        questId: legendary_artifacts
        status: updated

  - eventId: treasury_alarm_glyph
    name: "Alarm Glyph Triggered"
    trigger_type: conditional
    trigger_conditions:
      central_vault_opened_without_disable: true
    effects:
      - type: custom
        description: "Loud alarm sounds throughout castle. Strahd and all guardians alerted. Reinforcements arrive in 1d4 rounds."
