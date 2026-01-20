# Events in Castle Ravenloft - Chapel

events:
  - eventId: chapel_restless_whispers
    name: "Restless Whispers of the Past"
    trigger_type: conditional
    trigger_conditions:
      party_enters_chapel: true
      first_visit: true
    effects:
      - type: narrative
        text: "As you enter the chapel, you hear whispers echoing from the walls—fragments of voices long dead. 'The bride... she fell...' 'Blood on the altar...' 'He killed his own brother...' 'Why? Why did he do it?' The chapel remembers the wedding massacre, and these sounds are its eternal lament."
      - type: custom
        description: "All creatures must make DC 12 Wisdom saving throw or suffer disadvantage on next ability check (unsettled by trauma echoes). Characters proficient in Religion have advantage on this save."
      - type: state_update
        locationId: castle-ravenloft/chapel
        stateChanges:
          restless_whispers_heard: true
          first_visit_complete: true

  - eventId: chapel_divine_magic_suppression
    name: "Divine Magic Weakened by Desecration"
    trigger_type: conditional
    trigger_conditions:
      divine_spell_cast_in_chapel: true
      chapel_not_consecrated: true
    effects:
      - type: custom
        description: "The desecration of this chapel suppresses divine magic. All divine spells cast here require DC 15 spellcasting ability check (DC 17 at night). On failure, spell fails and slot is expended. The caster feels their connection to their deity strained, as if their god struggles to reach them through the corruption saturating this place."
      - type: saving_throw
        targetType: caster
        savingThrow:
          ability: varies  # Uses spellcasting ability
          dc: 15  # or 17 at night
        effect_on_fail: spell_fails

  - eventId: chapel_strahd_melancholic_visit
    name: "Strahd's Melancholic Reflection"
    trigger_type: conditional
    trigger_conditions:
      party_in_chapel: true
      strahd_decides_to_appear: true  # 20% chance
      strahd_phase: 1-2  # Observation or Testing phase
    effects:
      - type: narrative
        text: "A figure materializes near the altar—Count Strahd von Zarovich, standing motionless before the bloodstained marble. He does not acknowledge your presence immediately. 'This is where it happened,' he says quietly. 'My brother's wedding day. I gave him everything—immortality, partnership in my eternal reign. He refused. He chose her over me. So I chose eternity without him.' He finally turns to face you, his expression unreadable. 'Do you judge me? Everyone does. Even I do, sometimes.'"
      - type: custom
        description: "Strahd engages in roleplay encounter. He shares his tragic backstory, becomes melancholic and potentially dangerous if provoked. See NPCs.md for full dialogue and AI behavior. WARNING: Mentioning Sergei positively or suggesting Strahd was wrong triggers immediate combat (Phase 4, no testing)."
      - type: state_update
        locationId: castle-ravenloft
        stateChanges:
          strahd_encountered_in_chapel: true
          strahd_shared_backstory: true
          strahd_mood: melancholic_unstable

  - eventId: chapel_tombs_disturbed
    name: "Wraith Guardians Awaken"
    trigger_type: conditional
    trigger_conditions:
      tomb_touched_or_moved: true
      wraiths_not_destroyed: true
    effects:
      - type: narrative
        text: "As you touch the tomb, the temperature plummets. Frost forms on the stone, and a keening wail fills the chapel. Two spectral forms rise from within the tombs—wraiths bound to protect the resting places of King Barov and Queen Ravenovia. Their hollow eyes fix on you with ancient rage, and they drift forward with outstretched claws that trail darkness."
      - type: combat_encounter
        encounterId: wraith_guardians
        monsters:
          - type: wraith
            count: 2
            cr: 5
        description: "Two wraiths attack anyone who disturbed the tombs. They use Incorporeal Movement to phase through walls and attack from unexpected angles. Priority target: whoever touched the tombs."
      - type: state_update
        locationId: castle-ravenloft/chapel
        stateChanges:
          tombs_disturbed: true
          wraiths_awakened: true

  - eventId: chapel_vampire_spawn_reinforcements
    name: "Vampire Spawn Respond to Chapel Combat"
    trigger_type: conditional
    trigger_conditions:
      combat_in_chapel: true
      combat_duration_rounds: 3
      castle_alerted: true
    effects:
      - type: combat_encounter
        encounterId: vampire_spawn_chapel_reinforcements
        monsters:
          - type: vampire_spawn
            count: "1d3"
            cr: 5
        description: "Alerted by combat in the chapel, vampire spawn emerge from the north corridor (K16) with supernatural speed. They hiss in anger—'Desecrators!' 'You dare defile the master's chapel!' They use Spider Climb to attack from walls and ceiling."
      - type: state_update
        locationId: castle-ravenloft/chapel
        stateChanges:
          vampire_spawn_arrived: true

  - eventId: chapel_secret_passage_discovered
    name: "Secret Passage to Catacombs Revealed"
    trigger_type: conditional
    trigger_conditions:
      false_niche_back_found: true
      passage_opened: true
    effects:
      - type: narrative
        text: "The false back of the statue niche swings inward with a grinding of stone, revealing a narrow stairway descending into darkness. Cold air flows up from below, carrying the scent of earth and decay. This is a secret route to the catacombs—bypassing the normal approach but descending into one of the castle's most dangerous areas."
      - type: state_update
        locationId: castle-ravenloft/chapel
        stateChanges:
          secret_catacombs_passage_found: true
          alternate_route_available: true
      - type: custom
        description: "First three steps are trapped (DC 14 Perception to notice pressure plate, DC 13 Dex save or 2d10 piercing from ceiling spikes)."

  - eventId: chapel_consecration_ritual
    name: "Attempt to Reconsecrate Chapel"
    trigger_type: conditional
    trigger_conditions:
      consecration_materials_gathered: true
      cleric_or_paladin_level_9_plus: true
      ritual_begun: true
    effects:
      - type: custom
        description: "The party attempts an 8-hour ritual to reconsecrate the chapel. Cleric/paladin leads, must make DC 18 Religion check. Success lifts divine magic suppression, grants party blessing (advantage on one save vs Strahd), makes undead have disadvantage in chapel. Failure alerts Strahd immediately—he appears and attacks (took it as personal insult)."
      - type: saving_throw
        targetType: ritual_leader
        savingThrow:
          ability: religion
          dc: 18
        effect_on_success: chapel_consecrated
        effect_on_fail: strahd_appears_enraged
      - type: state_update
        locationId: castle-ravenloft/chapel
        stateChanges:
          consecration_attempted: true
          strahd_aware_of_consecration: true

  - eventId: chapel_consecration_success
    name: "Chapel Reconsecrated (Major Victory)"
    trigger_type: conditional
    trigger_conditions:
      consecration_ritual_succeeded: true
    effects:
      - type: narrative
        text: "As the final words of the prayer are spoken, brilliant golden light floods the chapel. The oppressive spiritual weight lifts. The bloodstains on the altar fade (though never fully disappear). The broken holy symbols glow faintly. For the first time in three centuries, this chapel remembers what it was meant to be. The corruption is pushed back—not defeated, but diminished. This is a sanctuary again, if only temporarily."
      - type: state_update
        locationId: castle-ravenloft/chapel
        stateChanges:
          chapel_consecrated: true
          divine_magic_suppression_lifted: true
          undead_have_disadvantage_here: true
      - type: quest_trigger
        questId: weaken_strahd_power
        status: updated
        description: "Chapel reconsecrated. Strahd's domain weakened slightly."
      - type: custom
        description: "Party receives Divine Blessing: Each party member gains advantage on one saving throw vs Strahd or his minions (use lasts until used). Strahd becomes enraged—chapel is now his priority target. He will attempt to desecrate it again within 1d4 days."

  - eventId: chapel_holy_symbol_discovered
    name: "Holy Symbol of Ravenkind Found"
    trigger_type: conditional
    trigger_conditions:
      holy_symbol_location: chapel  # Based on Tarokka reading
      altar_compartment_opened: true
      spectral_guardian_test_passed: true  # Or DC 20 Investigation
    effects:
      - type: item_found
        itemId: holy_symbol_of_ravenkind
        description: "Hidden in the altar's secret compartment, you find a platinum amulet shaped as a sun with a large crystal embedded in its center. The crystal glows with inner light—pure, radiant, and utterly opposed to the darkness that saturates this castle. This is the Holy Symbol of Ravenkind, one of three legendary artifacts needed to defeat Strahd permanently."
      - type: quest_trigger
        questId: legendary_artifacts
        status: updated
        description: "Holy Symbol of Ravenkind acquired. 1 of 3 artifacts found."
      - type: state_update
        locationId: castle-ravenloft
        stateChanges:
          holy_symbol_found: true
          legendary_artifacts_claimed: ["holy_symbol_of_ravenkind"]
      - type: custom
        description: "Strahd becomes aware the Holy Symbol has been taken (via castle awareness). His mood shifts to 'angered' and he accelerates timeline to confront party. From this point forward, Strahd actively hunts the party rather than merely observing."

  - eventId: chapel_sergeis_dagger_found
    name: "Murder Weapon Discovered"
    trigger_type: conditional
    trigger_conditions:
      altar_compartment_opened: true
      dagger_not_taken: true
    effects:
      - type: item_found
        itemId: sergeis_dagger
        description: "Beneath the bloodstained altar, you find an ornate dagger with jeweled handle. The silver blade is still stained with dried blood that will not wash off—blood spilled three centuries ago when Strahd murdered his own brother on Sergei's wedding day. This is the murder weapon, preserved as grim evidence of Strahd's defining sin."
      - type: state_update
        locationId: castle-ravenloft/chapel
        stateChanges:
          sergeis_dagger_found: true
      - type: custom
        description: "Wielder must make DC 13 Wisdom save each day or become obsessed with thoughts of betrayal (cursed item). If used against Strahd, deals +1d6 psychic damage (his guilt manifests as pain). Can be used to confront Strahd about his crime for dramatic effect."

  - eventId: chapel_turn_undead_empowered
    name: "Turn Undead Unexpectedly Effective (If Consecrated)"
    trigger_type: conditional
    trigger_conditions:
      turn_undead_used_in_chapel: true
      chapel_consecrated: true
    effects:
      - type: custom
        description: "Because the chapel has been reconsecrated, Turn Undead is significantly more effective here. All undead (including vampire spawn and even Strahd if present) have disadvantage on the saving throw. If Strahd is turned in his own desecrated-then-reconsecrated chapel, he takes it as profound insult and will become enraged (Phase 5, desperate measures)."
      - type: state_update
        locationId: castle-ravenloft/chapel
        stateChanges:
          turn_undead_empowered: true
