# Events in Castle Ravenloft - Dining Hall

events:
  - eventId: dining_hall_strahd_invitation
    name: "Strahd Invites Party to Dine"
    trigger_type: conditional
    trigger_conditions:
      party_enters_dining_hall: true
      time_of_day: evening  # 6pm-midnight
      strahd_decides_to_dine: true  # 60% chance
    effects:
      - type: narrative
        text: "Count Strahd von Zarovich sits at the head of the banquet table, a goblet of dark red wine in hand. He gestures graciously to the empty chairs. 'Please, sit. Dine with me. I have prepared a feast in your honor. It has been so long since I had guests worthy of conversation.'"
      - type: custom
        description: "Strahd engages in dinner conversation—roleplay encounter. He assesses party, tests limits, uses Charm, demonstrates lair actions. See NPCs.md for full behavior. This is Phase 2 (Testing) encounter—NOT immediate combat unless party attacks."
      - type: state_update
        locationId: castle-ravenloft
        stateChanges:
          strahd_dined_with_party: true
          strahd_intelligence_gathered: increased
          encounters_with_party: incremented

  - eventId: dining_hall_feast_revealed
    name: "Illusory Feast Transforms to Ash"
    trigger_type: conditional
    trigger_conditions:
      party_touches_food: true
      illusion_not_dispelled: true
    effects:
      - type: narrative
        text: "As your fingers touch the glistening roast, it instantly transforms. The meat becomes ash that crumbles to dust. The bread turns to moldy scraps. The wine in the goblets becomes stagnant water filled with squirming things. The entire feast was illusion—you've been staring at decay and ruin all along."
      - type: state_update
        locationId: castle-ravenloft/dining-hall
        stateChanges:
          feast_illusion_dispelled: true
      - type: custom
        description: "DC 12 Wisdom save or suffer disadvantage on next ability check (demoralized by realization). If Strahd present, he finds this amusing: 'Ah, you've discovered my little joke.'"

  - eventId: dining_hall_archer_ambush
    name: "Archers Fire from Hidden Posts"
    trigger_type: conditional
    trigger_conditions:
      party_hostile_in_dining_hall: true
      strahd_signals_attack: true
    effects:
      - type: combat_encounter
        encounterId: archer_ambush
        monsters:
          - type: vampire_spawn  # or animated_armor depending on castle state
            count: "1d3"
            cr: 5
        description: "Arrows/bolts rain from hidden slits high above. Vampire spawn archers fire from the gallery (K11), targeting spellcasters. They have three-quarters cover (+5 AC)."
      - type: state_update
        locationId: castle-ravenloft/dining-hall
        stateChanges:
          archers_engaged: true

  - eventId: dining_hall_doors_lock
    name: "Strahd's Lair Action - Doors Seal"
    trigger_type: conditional
    trigger_conditions:
      strahd_in_dining_hall: true
      combat_active_or_demonstrates_power: true
      initiative_count: 20
    effects:
      - type: custom
        description: "On initiative count 20, Strahd uses lair action. All doors slam shut and lock magically (DC 20 to force, DC 18 to pick). 'You may leave when I permit it—or when you are carried out.'"
      - type: state_update
        locationId: castle-ravenloft/dining-hall
        stateChanges:
          doors_locked: true
          escape_blocked: true

  - eventId: dining_hall_poisoned_wine
    name: "Strahd Offers Poisoned Wine"
    trigger_type: conditional
    trigger_conditions:
      party_dining_with_strahd: true
      strahd_decides_to_poison: true  # If he wants to weaken or test party
    effects:
      - type: custom
        description: "Strahd offers 'real' wine (not illusion) to honor guests. Wine is poisoned (Midnight Tears or similar). Drinker makes DC 15 Constitution save or takes 4d6 poison damage + poisoned for 1 hour. Strahd drinks from safe goblet, watching reactions carefully."
      - type: state_update
        locationId: castle-ravenloft/dining-hall
        stateChanges:
          poisoned_wine_served: true

  - eventId: dining_hall_charm_demonstration
    name: "Strahd Uses Charm on Party Member"
    trigger_type: conditional
    trigger_conditions:
      strahd_dining_with_party: true
      strahd_testing_party: true
    effects:
      - type: custom
        description: "Strahd uses Charm Person on party member (usually strongest or weakest). If successful, commands minor action ('Stand,' 'Kneel,' 'Disarm yourself,' or 'Attack your ally briefly'). After 1 round, releases charm. 'A test. You failed/passed.' Demonstrates his power and party's vulnerability."
      - type: state_update
        locationId: castle-ravenloft
        stateChanges:
          strahd_used_charm: true
          party_vulnerability_demonstrated: true

  - eventId: dining_hall_phantom_servants
    name: "Phantom Servants Attend Guests"
    trigger_type: conditional
    trigger_conditions:
      party_sits_at_table: true
    effects:
      - type: narrative
        text: "Invisible hands pull out your chairs. Napkins unfold onto laps of their own accord. Goblets fill with illusory wine poured by unseen servants. The experience is courteous, efficient, and deeply unnerving."
      - type: custom
        description: "DC 10 Wisdom save or be startled when first touched (disadvantage on next ability check)."
      - type: state_update
        locationId: castle-ravenloft/dining-hall
        stateChanges:
          phantom_servants_encountered: true

  - eventId: dining_hall_rahadin_appears
    name: "Rahadin Serves as Majordomo"
    trigger_type: conditional
    trigger_conditions:
      strahd_dining_formally: true
      rahadin_available: true  # 30% chance during dinner
    effects:
      - type: custom
        description: "Rahadin appears to serve Strahd during dinner. Stands near throne, utterly formal and loyal. His Deathly Choir aura (screaming sounds) requires DC 15 Wisdom save or frightened. If combat erupts and Strahd retreats, Rahadin (CR 10) may hold party."
      - type: state_update
        locationId: castle-ravenloft/dining-hall
        stateChanges:
          rahadin_present: true
