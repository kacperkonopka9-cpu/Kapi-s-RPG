# Events in Castle Ravenloft - Great Entry Hall

events:
  - eventId: great_entry_organ_begins
    name: "Organ Begins Playing (First Entry)"
    trigger_type: conditional
    trigger_conditions:
      party_enters_great_entry: true
      first_visit: true
      organ_not_playing: true
    effects:
      - type: narrative
        text: "As you step into the Great Entry Hall, the massive pipe organ at the far end begins to play. No one sits at the bench, yet the keys press down of their own accord, and haunting music fills the vast chamber. The melody speaks of loss, longing, and eternal hunger. You feel its vibrations in your chest—a funeral dirge for the living."
      - type: state_update
        locationId: castle-ravenloft/great-entry
        stateChanges:
          organ_playing: true
          first_entry_complete: true
      - type: custom
        description: "All creatures in room must make DC 13 Wisdom saving throw or suffer disadvantage on next Charisma check (unsettled by oppressive atmosphere). Effect lasts until they leave the room."

  - eventId: great_entry_strahd_appears
    name: "Strahd's Grand Entrance"
    trigger_type: conditional
    trigger_conditions:
      party_in_great_entry: true
      strahd_phase: 1  # Observation/Testing phase
      strahd_decides_to_greet: true  # 50% first visit, 30% subsequent
    effects:
      - type: narrative
        text: "A figure appears at the top of the grand staircase—a tall man in elegant black noble's attire, his cloak flowing behind him like wings. He descends the stairs with inhuman grace, his boots making no sound on the marble steps. His pale face is aristocratic and coldly handsome, his eyes dark and penetrating. He smiles, revealing the slightest hint of fangs. 'Ah, visitors. How delightful. Welcome to my home. I am Count Strahd von Zarovich, and you are my guests.'"
      - type: custom
        description: "Strahd engages in roleplay encounter. He assesses party, makes veiled threats, demonstrates power (Charm Person, lair action), and departs after establishing dominance. See NPCs.md for full dialogue options and AI behavior. This is NOT a combat encounter unless party attacks first."
      - type: state_update
        locationId: castle-ravenloft
        stateChanges:
          strahd_encountered_party: true
          encounters_with_party: 1
          strahd_combat_phase: 2  # Advances to Testing phase
          strahd_location: great-entry
      - type: quest_trigger
        questId: strahd_confrontation
        status: active

  - eventId: great_entry_animated_armor_activate
    name: "Animated Armor Guardians Activate"
    trigger_type: conditional
    trigger_conditions:
      party_attempts_staircase_ascent: true
      castle_alerted: true
      armor_not_destroyed: true
    effects:
      - type: combat_encounter
        encounterId: animated_armor_guardians
        monsters:
          - type: animated_armor
            count: "2d4"
            cr: 1
        description: "The suits of armor in the alcoves suddenly animate, stepping forward with metallic clanks. They form a defensive line at the base of the grand staircase, weapons raised, blocking your ascent. More suits activate every 2 rounds (2 additional suits per wave) until all are active or destroyed."
      - type: state_update
        locationId: castle-ravenloft/great-entry
        stateChanges:
          animated_armor_encountered: true
          staircase_blocked: true

  - eventId: great_entry_vampire_spawn_reinforcements
    name: "Vampire Spawn Respond to Combat"
    trigger_type: conditional
    trigger_conditions:
      combat_in_great_entry: true
      combat_duration_rounds: 3
      castle_alerted: true
    effects:
      - type: combat_encounter
        encounterId: vampire_spawn_reinforcements_great_entry
        monsters:
          - type: vampire_spawn
            count: "2d3"
            cr: 5
        description: "Alerted by the sounds of combat, vampire spawn emerge from the upper galleries and descend the grand staircase with supernatural speed. Their eyes glow red, fangs bared, ready to overwhelm intruders."
      - type: state_update
        locationId: castle-ravenloft
        stateChanges:
          vampire_spawn_reinforcements_arrived: true

  - eventId: great_entry_secret_passage_discovered
    name: "Secret Passage Opened"
    trigger_type: conditional
    trigger_conditions:
      secret_switch_activated: true  # Either portrait switch or candelabra ritual
    effects:
      - type: narrative
        text: "With a grinding of stone on stone, a section of the wall swings inward, revealing a narrow passage beyond. The passage is dark and dusty, clearly not used in years. It leads upward at a steep angle, bypassing the grand staircase and providing access to the upper galleries."
      - type: state_update
        locationId: castle-ravenloft/great-entry
        stateChanges:
          secret_passage_discovered: true
          alternate_route_available: true

  - eventId: great_entry_lair_action_door_slam
    name: "Strahd's Lair Action - Doors Slam"
    trigger_type: conditional
    trigger_conditions:
      strahd_in_great_entry: true
      combat_active: true
      initiative_count: 20
    effects:
      - type: custom
        description: "On initiative count 20 (losing initiative ties), Strahd uses a lair action. All doors in the Great Entry Hall slam shut and magically lock (DC 20 to force open, DC 18 to pick locks). This traps intruders in the room with Strahd and his minions."
      - type: state_update
        locationId: castle-ravenloft/great-entry
        stateChanges:
          doors_locked: true
          escape_blocked: true

  - eventId: great_entry_lair_action_organ_terror
    name: "Strahd's Lair Action - Organ of Terror"
    trigger_type: conditional
    trigger_conditions:
      strahd_in_great_entry: true
      combat_active: true
      initiative_count: 20
    effects:
      - type: custom
        description: "On initiative count 20, Strahd commands the pipe organ to play a discordant, shrieking melody. All creatures Strahd chooses within 60 feet must make DC 17 Wisdom saving throw or become frightened for 1 round. Frightened creatures cannot willingly move closer to Strahd and have disadvantage on attack rolls while he is in line of sight."
      - type: saving_throw
        targetType: area
        area: 60-foot radius
        savingThrow:
          ability: wisdom
          dc: 17
        effect_on_fail: frightened
        duration_rounds: 1

  - eventId: great_entry_phantom_servants_noticed
    name: "Phantom Servants Disturb Party"
    trigger_type: conditional
    trigger_conditions:
      party_resting_in_great_entry: true  # Bad idea, but possible
      time_passed_minutes: 10
    effects:
      - type: narrative
        text: "As you rest in the hall, you notice unsettling movements: a candelabra floating through the air as invisible hands polish it, dust being swept from the grand staircase by an unseen broom, a door closing gently on its own. These are Strahd's phantom servants—permanent Unseen Servant spells that maintain the castle. They are harmless but deeply unnerving."
      - type: custom
        description: "DC 10 Wisdom saving throw or suffer disadvantage on next ability check (startled). Party cannot complete short or long rest here (too disturbing)."
      - type: state_update
        locationId: castle-ravenloft/great-entry
        stateChanges:
          phantom_servants_noticed: true

  - eventId: great_entry_scrying_detected
    name: "Strahd Scrying via Portrait"
    trigger_type: conditional
    trigger_conditions:
      party_in_great_entry_k9: true
      strahd_not_present: true
      strahd_decides_to_scry: true  # 40% chance when party in K9
    effects:
      - type: custom
        description: "A character with passive Perception 15 or higher notices that the eyes in Strahd's portrait are glowing faintly red. Strahd is using the portrait as a scrying sensor, watching and listening to the party's conversation. He may appear shortly if he learns something interesting, or he may simply gather intelligence for later use."
      - type: state_update
        locationId: castle-ravenloft
        stateChanges:
          strahd_scrying_active: true
          strahd_location: remote  # Scrying from elsewhere
          strahd_intelligence_gathered: true

  - eventId: great_entry_invisible_stalker_deployed
    name: "Invisible Stalker Begins Surveillance"
    trigger_type: conditional
    trigger_conditions:
      party_proves_dangerous: true  # Defeats multiple encounters easily
      strahd_phase: 2  # Testing phase or higher
      invisible_stalker_not_deployed: true
    effects:
      - type: custom
        description: "Strahd casts Summon Elemental (8th level) and an invisible stalker materializes in the Great Entry Hall. The stalker does not attack—instead, it follows the party throughout the castle at 30-foot distance, observing and reporting back to Strahd via telepathic bond every 10 minutes. Provides real-time intelligence on party tactics, spells, and resources."
      - type: state_update
        locationId: castle-ravenloft
        stateChanges:
          invisible_stalker_deployed: true
          strahd_has_real_time_intelligence: true
      - type: custom
        description: "DC 20 Perception check to detect stalker (invisibility). If detected, stalker withdraws and reports detection to Strahd."

  - eventId: great_entry_tome_discovered
    name: "Tome of Strahd Found (if Tarokka places it here)"
    trigger_type: conditional
    trigger_conditions:
      organ_compartment_opened: true
      tome_location: great_entry  # Based on Tarokka reading
    effects:
      - type: item_found
        itemId: tome_of_strahd
        description: "Hidden in the organ bench's secret compartment, beneath Strahd's music compositions, you find a thick tome bound in black leather with iron clasps. This is the Tome of Strahd—his autobiography, chronicling his rise to power, his pact with death, and his eternal curse. One of three legendary artifacts needed to defeat him."
      - type: quest_trigger
        questId: legendary_artifacts
        status: updated
        description: "Tome of Strahd acquired. 1 of 3 artifacts found."
      - type: state_update
        locationId: castle-ravenloft
        stateChanges:
          tome_of_strahd_found: true
          legendary_artifacts_claimed: ["tome_of_strahd"]
      - type: custom
        description: "Strahd becomes aware the Tome has been taken (via castle awareness). His mood shifts to 'angered' and he accelerates his timeline to confront the party."
