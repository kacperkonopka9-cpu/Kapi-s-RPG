# Events in Castle Ravenloft - Entrance

events:
  - eventId: entrance_gargoyles_activate
    name: "Gargoyle Guardians Awaken"
    trigger_type: conditional
    trigger_conditions:
      party_enters_courtyard: true
      strahd_aware_of_party: false  # First time entering
      gargoyles_not_destroyed: true
    effects:
      - type: combat_encounter
        encounterId: gargoyle_ambush
        monsters:
          - type: gargoyle
            count: 4
            cr: 2
        description: "Four gargoyles animate simultaneously, dropping from their perches with stone wings spreading. They attack with coordinated tactics: 2 engage melee fighters, 2 focus on spellcasters with dive attacks."
      - type: state_update
        locationId: castle-ravenloft/entrance
        stateChanges:
          gargoyles_encountered: true
          castle_alerted: true
      - type: custom
        description: "Combat noise alerts nearby vampire spawn. Roll 1d6: on 5-6, 1d3 vampire spawn arrive in 1d4+1 rounds to investigate."

  - eventId: entrance_animated_armor_patrol
    name: "Animated Armor Patrol Activates"
    trigger_type: conditional
    trigger_conditions:
      party_in_courtyard: true
      loud_action_taken: true  # Forcing gates, combat, etc.
      animated_armor_active: true
    effects:
      - type: combat_encounter
        encounterId: animated_armor_patrol
        monsters:
          - type: animated_armor
            count: "1d4+1"
            cr: 1
        description: "Suits of animated armor step out of alcoves in the guard towers and form a defensive line blocking access to the entry door (K7). They attack in coordinated formation."
      - type: state_update
        locationId: castle-ravenloft/entrance
        stateChanges:
          animated_armor_encountered: true

  - eventId: entrance_nightmare_defense
    name: "Nightmare Steeds Defend Strahd's Carriage"
    trigger_type: conditional
    trigger_conditions:
      strahd_carriage_touched: true
      nightmares_alive: true
    effects:
      - type: combat_encounter
        encounterId: nightmare_steeds
        monsters:
          - type: nightmare
            count: 2
            cr: 3
        description: "The two nightmare steeds harnessed to Strahd's carriage rear up, eyes blazing red, hooves trailing flame. They attack anyone who dared touch their master's property with savage fury."
      - type: state_update
        locationId: castle-ravenloft
        stateChanges:
          strahd_aware_of_party: true
          strahd_mood: angered
      - type: custom
        description: "If nightmares are defeated, Strahd learns of intrusion via telepathic link (immediate). If nightmares reduced below 20 HP combined, they shift to Ethereal Plane and flee to warn Strahd."

  - eventId: entrance_strahd_greeting
    name: "Strahd Personally Greets Visitors"
    trigger_type: conditional
    trigger_conditions:
      party_in_courtyard: true
      strahd_phase: 1  # Observation phase
      strahd_location: castle-ravenloft
      party_makes_noise: true
    effects:
      - type: custom
        description: "Count Strahd von Zarovich appears in the courtyard (K1) or at the entry door (K7) to greet his 'guests.' He is charming, welcoming, but with underlying menace. This is a roleplay encounter—Strahd assesses party strength, uses Charm to test willpower, makes ominous comments. He does NOT initiate combat (too early). If attacked, he laughs, turns to mist, and vanishes through walls."
      - type: state_update
        locationId: castle-ravenloft
        stateChanges:
          strahd_encountered_party: true
          strahd_combat_phase: 2  # Advances to Testing phase
          encounters_with_party: 1
      - type: quest_trigger
        questId: strahd_confrontation
        status: active
        description: "The final confrontation with Strahd begins. He now knows the party's capabilities and will plan accordingly."

  - eventId: entrance_gates_seal
    name: "Castle Gates Seal Behind Party"
    trigger_type: conditional
    trigger_conditions:
      party_passes_through_gates: true
      strahd_decides_to_trap: true
    effects:
      - type: state_update
        locationId: castle-ravenloft/entrance
        stateChanges:
          main_gate_locked: true
          escape_blocked: true
      - type: custom
        description: "With a deep, resonant clang, the main gates (K2) slam shut behind the party and lock magically. The sound echoes through the courtyard like a death knell. To escape now, the party must defeat Strahd, find another exit, or force the gates (DC 25 Strength check, alerts entire castle on success)."
      - type: narrative
        text: "The gates slam shut with finality. You are trapped in Castle Ravenloft. Strahd's voice echoes from nowhere: 'Welcome, my guests. You may leave when I permit it—or when you are carried out.'"

  - eventId: entrance_vampire_spawn_reinforcements
    name: "Vampire Spawn Reinforcements Arrive"
    trigger_type: conditional
    trigger_conditions:
      combat_in_entrance: true
      combat_duration_rounds: 3  # Combat lasts 3+ rounds
      vampire_spawn_alerted: true
    effects:
      - type: combat_encounter
        encounterId: vampire_spawn_reinforcements
        monsters:
          - type: vampire_spawn
            count: "1d3"
            cr: 5
        description: "Alerted by the sounds of combat, vampire spawn arrive from deeper in the castle (guest-quarters or larders). They emerge from shadows with inhuman speed, fangs bared, ready to overwhelm intruders with superior numbers."
      - type: state_update
        locationId: castle-ravenloft
        stateChanges:
          castle_alerted: true
          vampire_spawn_reinforcements_arrived: true

  - eventId: entrance_trap_poison_gas
    name: "Poison Gas Trap (Strahd's Carriage Compartment)"
    trigger_type: conditional
    trigger_conditions:
      travel_compartment_opened: true
      passphrase_not_spoken: true
    effects:
      - type: custom
        description: "Opening the hidden compartment in Strahd's carriage without speaking the passphrase ('By von Zarovich blood') triggers a poison gas trap. All creatures within 10 feet must make DC 15 Constitution save or take 4d6 poison damage (half on success). The gas disperses after 1 round."
      - type: damage
        targetType: area
        area: 10-foot radius
        damageType: poison
        damage: "4d6"
        savingThrow:
          ability: constitution
          dc: 15
          half_on_success: true

  - eventId: entrance_gargoyle_topple_trap
    name: "Decorative Gargoyle Topples"
    trigger_type: conditional
    trigger_conditions:
      gargoyle_ruby_eyes_removed: true
      trap_not_disabled: true
    effects:
      - type: custom
        description: "Removing the ruby eyes from the decorative gargoyle (K1) causes it to topple. Anyone standing beneath must make DC 13 Dexterity save or take 3d6 bludgeoning damage from falling stone. The crash alerts nearby enemies."
      - type: damage
        targetType: area
        area: 5-foot square beneath gargoyle
        damageType: bludgeoning
        damage: "3d6"
        savingThrow:
          ability: dexterity
          dc: 13
          negate_on_success: true
      - type: state_update
        locationId: castle-ravenloft/entrance
        stateChanges:
          gargoyle_trap_triggered: true
          noise_level: high

  - eventId: entrance_organ_music_begins
    name: "Ominous Organ Music from Great Hall"
    trigger_type: conditional
    trigger_conditions:
      party_approaches_entry_door: true
      first_visit: true
    effects:
      - type: narrative
        text: "As you approach the entry door (K7), you hear the haunting sound of organ music from within. The melody is beautiful yet profoundly unsettling—a funeral dirge played with virtuoso skill. The music grows louder as you reach for the door handle, and the screaming faces carved into the wood seem to open their mouths wider in silent warning. This is your last chance to turn back. Beyond this door, you enter Strahd's domain in truth."
      - type: state_update
        locationId: castle-ravenloft/entrance
        stateChanges:
          organ_music_heard: true
          party_at_threshold: true
      - type: custom
        description: "DC 12 Wisdom saving throw or suffer disadvantage on next ability check (unnerved by oppressive atmosphere)."
