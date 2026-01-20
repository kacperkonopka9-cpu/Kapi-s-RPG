# Events in Castle Ravenloft - Tower of Strahd

events:
  - eventId: tower_strahd_present
    name: "Strahd Defends His Sanctum"
    trigger_type: conditional
    trigger_conditions:
      party_in_tower: true
      time: night  # 80% chance
    effects:
      - type: narrative
        text: "Count Strahd von Zarovich stands before his desk, eyes blazing with cold fury. 'You DARE enter my personal chambers? Your audacity is remarkable. Your deaths will be exquisite.' He draws his sword, legendary actions activating immediately."
      - type: combat_encounter
        encounterId: strahd_full_power
        monsters:
          - type: strahd_von_zarovich
            cr: 15
          - type: escher_vampire_spawn
            cr: 5
      - type: state_update
        locationId: castle-ravenloft
        stateChanges:
          strahd_combat_phase: 4  # Full engagement
          strahd_mood: enraged

  - eventId: heart_of_sorrow_attacked
    name: "Heart of Sorrow Defended"
    trigger_type: conditional
    trigger_conditions:
      heart_attacked: true
      heart_not_destroyed: true
    effects:
      - type: combat_encounter
        encounterId: spectral_guardian
        monsters:
          - type: spectral_guardian
            cr: 7
      - type: custom
        description: "Strahd becomes aware Heart is under attack. Arrives in 1d4 rounds if not already present. Fights with desperate fury to protect it."
      - type: state_update
        locationId: castle-ravenloft/tower-of-strahd
        stateChanges:
          heart_under_attack: true
          strahd_alerted: true

  - eventId: heart_of_sorrow_destroyed
    name: "Heart of Sorrow Destroyed"
    trigger_type: conditional
    trigger_conditions:
      heart_hp: 0
    effects:
      - type: narrative
        text: "The crystal heart shatters with a sound like screaming souls. Crimson light explodes outward, then fades. Strahd staggers, clutching his chest, roaring in pain and rage. 'NO! What have you DONE?!' His protection is gone. He is vulnerable."
      - type: state_update
        locationId: castle-ravenloft
        stateChanges:
          heart_of_sorrow_destroyed: true
          strahd_vulnerable: true
          strahd_combat_phase: 5  # Desperate
      - type: custom
        description: "Strahd loses 50 damage absorption per round. Becomes enraged—advantage on attacks, disadvantage on ability checks. May retreat to coffin to recover."

  - eventId: tower_spellbooks_taken
    name: "Animated Bookshelves Attack"
    trigger_type: conditional
    trigger_conditions:
      spellbooks_touched_without_permission: true
    effects:
      - type: combat_encounter
        encounterId: animated_bookshelves
        monsters:
          - type: animated_object
            count: "1d4"
            cr: 2
      - type: custom
        description: "Bookshelves animate and attack, attempting to crush intruders. Strahd alerted to intrusion."

  - eventId: tower_crystal_ball_explodes
    name: "Crystal Ball Trap Triggered"
    trigger_type: conditional
    trigger_conditions:
      crystal_ball_touched: true
      trap_not_disabled: true
    effects:
      - type: damage
        area: 10-foot radius
        damageType: force
        damage: "6d6"
        savingThrow:
          ability: dexterity
          dc: 15
          half_on_success: true
      - type: narrative
        text: "The crystal ball explodes in a blast of arcane force, shredding papers and blasting furniture. The explosion alerts everyone in the castle."

  - eventId: tower_secret_safe_discovered
    name: "Secret Safe Behind Portrait Found"
    trigger_type: conditional
    trigger_conditions:
      portrait_examined: true
      investigation_check: 16
    effects:
      - type: item_found
        description: "Behind Tatyana's portrait, a hidden safe contains 200 platinum, a 1,000 gp diamond, love letters to Tatyana, and possibly the Tome of Strahd (if Tarokka places it here)."
      - type: state_update
        locationId: castle-ravenloft/tower-of-strahd
        stateChanges:
          secret_safe_found: true
