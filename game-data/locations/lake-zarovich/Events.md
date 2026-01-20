# Lake Zarovich - Events

## Quest Events

### Event: Arabelle's Rescue
```yaml
eventId: rescue_arabelle
name: "Save the Vistana Child"
trigger_type: conditional
trigger_conditions:
  - type: player_arrives_at_location
    locationId: lake-zarovich
  - type: arabelle_quest_active
    value: true
effects:
  - type: atmosphere
    description: "100 feet offshore, you see a rowboat. A wild-eyed man holds a bound child over the water. 'The lake god demands tribute!' he screams. The girl struggles—it's Arabelle, the missing Vistana!"
  - type: npc_encounter
    npcIds:
      - bluto_krogarov
      - arabelle_rescue
    disposition: hostage_situation
  - type: skill_check_required
    skill: persuasion_or_combat
    dc: 13
    success: "Bluto releases Arabelle (must catch her before she drowns)"
    failure: "Bluto panics, drops Arabelle (she sinks—immediate rescue required)"
  - type: state_update
    locationId: lake-zarovich
    stateChanges:
      arabelle_rescue_initiated: true
      bluto_encountered: true
```

**Consequences**:
- **Success (Persuasion DC 13)**: Bluto releases Arabelle. Party must catch her (Athletics DC 10) or she sinks.
- **Failure or Combat**: Bluto drops her in panic. She sinks immediately (drowning in 1d4 rounds). Rescue requires swimming (Athletics DC 12) and carrying her to shore.
- **Arabelle Saved**: Return her to Luvash at Tser Pool for reward and Vistani gratitude
- **Arabelle Drowned**: Vistani curse the party, Luvash becomes enemy

**Tactical Notes**:
- Time pressure: Arabelle sinks fast
- Swimming in armor: Disadvantage on Athletics, may need to remove armor
- Bluto is CR 0—easily subdued but hostage complicates things
- *Fly*, *Levitate*, or ranged grappling (rope) bypasses swimming

---

### Event: Return Arabelle to Luvash
```yaml
eventId: arabelle_returned
name: "The Missing Daughter Returns"
trigger_type: conditional
trigger_conditions:
  - type: return_arabelle_to_luvash
    locationId: tser-pool-encampment
effects:
  - type: quest_resolution
    questId: find_missing_vistana
    outcome: success
    rewards:
      - xp: 400
      - treasure: vistani_reward
      - reputation: vistani_eternal_gratitude
  - type: custom
    description: "Luvash weeps with joy upon seeing his daughter alive. 'You have done what I could not! The Vistani are in your debt. Forever.' Arabelle runs to her father, embracing him. The camp celebrates your heroism."
  - type: state_update
    locationId: tser-pool-encampment
    stateChanges:
      arabelle_safe: true
      luvash_alliance: true
      vistani_reputation: exalted
```

**Consequences**:
- Vistani become permanent allies
- Luvash offers treasure (300 gp, *Potion of Healing* ×3, *Wand of Secrets*)
- Vistani provide information network (track Strahd's movements, rumors, etc.)
- Future Vistani encounters start friendly
- Madam Eva may offer additional Tarokka insights

---

## Optional Events

### Event: Lake Monster Encounter
```yaml
eventId: lake_monster_attack
name: "Something Lurks Below"
trigger_type: conditional
trigger_conditions:
  - type: boat_on_deep_water
    value: true
  - type: dm_includes_monster
    value: true
effects:
  - type: combat_encounter
    locationId: lake-zarovich
    encounterDetails:
      name: "The Lake Lurker"
      enemies:
        - type: giant_catfish_or_undead
          cr: 3-5
          count: 1
      environment: deep_water
      difficulty: medium
      special_mechanics:
        - water_combat
        - boat_capsizing_risk
  - type: atmosphere
    description: "The boat rocks violently. Something massive moves beneath the surface. Suddenly, a huge shape erupts from the water—tentacles, teeth, eyes reflecting unnatural light. The lake monster is real!"
```

**Consequences**: Optional encounter for DM who wants combat challenge. Adds danger to otherwise peaceful location. Monster might be giant fish, aquatic undead, or other water-dwelling threat.

---

## Recurring Events

### Event: Fishing Attempts
```yaml
eventId: lake_fishing
name: "Casting Nets and Lines"
trigger_type: conditional
trigger_conditions:
  - type: character_attempts_fishing
    value: true
effects:
  - type: skill_check_required
    skill: survival
    dc: 12
    success: "Catch 1d4 fish (food, minimal sale value)"
    failure: "No catches, wasted time"
  - type: custom
    description: "The lake's waters are dark and deep. Fishing requires patience and skill. Catches have been poor lately—Bluto wasn't entirely wrong about that."
```

**Consequences**: Provides food source. Minimal treasure. Mostly atmospheric.

---

## Notes for Epic 2 Integration

All events follow EventScheduler schema. Lake Zarovich is low-combat, high-drama location focused on Arabelle's rescue. Time pressure and hostage situation create tension despite CR 0 opponent. Quest completion strengthens Vistani alliance from Tser Pool (Story 4-5).
