# Tser Pool Encampment - Events

## Quest-Critical Events

### Event: Madam Eva's Tarokka Reading
```yaml
eventId: madam_eva_tarokka_reading
name: "Madam Eva Performs the Tarokka Reading"
trigger_type: conditional
trigger_conditions:
  - type: player_enters_location
    locationId: tser-pool-encampment
    first_visit: true
  - type: player_speaks_to_npc
    npcId: madam_eva
    with_respect: true

effects:
  - type: quest_trigger
    questId: tarokka_prophecy
    questStatus: started

  - type: tarokka_reading
    module: "src/tarokka/tarokka-reader.js"
    method: "performFullReading"
    seed: null  # Random seed unless DM overrides
    saveResultsTo: "game-data/state/tarokka-reading.yaml"
    description: "Madam Eva performs the legendary Tarokka reading using TarokkaReader module (Story 4-16). Draws 5 cards: Tome location, Holy Symbol location, Sunsword location, destined ally, final battle location."
    narration: "Use Madam Eva's tarokkaReading dialogue from madam_eva.yaml"

  - type: artifact_location_update
    artifacts:
      - itemId: "tome_of_strahd"
        field: "currentLocationId"
        source: "tarokka_reading.cards.tome.location.locationId"
      - itemId: "holy_symbol_of_ravenkind"
        field: "currentLocationId"
        source: "tarokka_reading.cards.holySymbol.location.locationId"
      - itemId: "sunsword"
        field: "currentLocationId"
        source: "tarokka_reading.cards.sunsword.location.locationId"
    description: "Updates artifact items in game-data/items/ with revealed locations"

  - type: ally_designation
    npcIdField: "tarokka_reading.cards.ally.ally.allyId"
    flagToSet: "destinedAlly"
    description: "Marks the revealed NPC as the destined ally in their YAML profile"

  - type: state_update
    locationId: tser-pool-encampment
    stateChanges:
      tarokka_reading_complete: true
      prophecy_revealed: true
      madam_eva_met: true

  - type: npc_state_update
    npcId: madam_eva
    stateChanges:
      tarokka_reading_performed: true
      party_met: true
      prophecy_revealed: true

  - type: game_flag_set
    flags:
      - tarokka_reading_received: true
      - tarokka_reading_seed: "[from reading.seed]"

systemCommand: "/tarokka"
manualTrigger: "Use /tarokka slash command to perform reading when event conditions met"
```

**Consequences**:
- Campaign direction unlocked—party knows where to find critical items
- Three legendary artifacts (Tome, Holy Symbol, Sunsword) locations revealed and saved to item YAML files
- Destined ally revealed and marked with destinedAlly flag in their NPC profile
- Final battle location at Castle Ravenloft revealed
- Reading results saved to game-data/state/tarokka-reading.yaml for reference
- Madam Eva becomes recurring advisor who can provide clarification
- Strahd becomes aware that party received the reading (DM may trigger Strahd visit event)

**Reading System (Story 4-16)**:
- **54-Card Tarokka Deck**: High Deck (14 major cards) + Common Deck (4 suits × 10 cards)
- **5-Card Spread**: Tome, Holy Symbol, Sunsword, Ally, Enemy location
- **Deterministic Shuffle**: Uses seeded RNG for save/load compatibility
- **Official CoS Mappings**: All card-to-location/NPC mappings from Curse of Strahd Campaign Book p.11-16
- **Possible Locations per Artifact**: 10 possible locations per artifact (30 total combinations)
- **Possible Allies**: 14 possible NPCs (Ireena, Van Richten, Ezmerelda, Davian Martikov, etc.)
- **Possible Enemy Locations**: 13 Castle Ravenloft rooms for final battle
- **One-Time Event**: Reading cannot be redone—results are permanent for playthrough
- **DM Override**: DM can manually set seed for specific reading outcome if desired

**Technical Integration**:
- **Epic 2 EventScheduler**: Triggers event when conditions met
- **Epic 2 EventExecutor**: Executes TarokkaReader.performFullReading() and applies effects
- **Epic 3 ItemDatabase**: Updates artifact items with currentLocationId from reading
- **Epic 4 NPCs**: Marks ally NPC with destinedAlly flag
- **Result Persistence**: Full reading saved to game-data/state/tarokka-reading.yaml for LLM-DM reference

---

### Event: Arabelle Goes Missing
```yaml
eventId: arabelle_disappears
name: "Arabelle Vanishes from Camp"
trigger_type: date_time
trigger_conditions:
  - type: calendar_date
    date: "735-10-5"
    time: "14:00"
  - type: player_not_in_location
    locationId: tser-pool-encampment
effects:
  - type: quest_trigger
    questId: missing_vistana
    questStatus: available
  - type: npc_status
    npcId: arabelle
    status: missing
    last_seen: tser_pool_shore
  - type: state_update
    locationId: tser-pool-encampment
    stateChanges:
      npc_states:
        arabelle:
          status: missing
          days_missing: 0
        luvash:
          mood: frantic
          drinking: excessive
          judgment: impaired
      camp_status: high_alert
      mood: tense
  - type: custom
    description: "Seven-year-old Arabelle, Luvash's daughter, vanishes from camp. Search reveals her doll near the Tser Pool shore. Luvash becomes increasingly drunk and desperate. The Vistani organize search parties but find no trace."
```

**Consequences**:
- Luvash becomes increasingly unstable, making poor decisions
- Camp atmosphere shifts from welcoming to tense and suspicious
- Vistani may suspect outsiders if party is nearby
- Actually, Arabelle fell into the Tser Pool and was captured by Bluto (fisherman) near Vallaki
- Quest can be resolved by finding her in Lake Zarovich near Vallaki (different location)
- If not resolved within 7 days, Arabelle drowns (tragic outcome)

**Quest Resolution Path**:
- Arabelle was swept downstream to Lake Zarovich
- Fisherman Bluto captures her, planning to sacrifice her to lake monster
- Party must travel to Lake Zarovich and rescue her from Bluto
- Returning her alive earns eternal Vistani gratitude and alliance

---

## Encounter Events

### Event: Strahd Visits the Camp
```yaml
eventId: strahd_visits_vistani
name: "Strahd von Zarovich Visits the Encampment"
trigger_type: conditional
trigger_conditions:
  - type: any_of
    conditions:
      - tarokka_reading_complete: true
      - player_in_location_at_night: true
      - strahd_tracking_party: true
effects:
  - type: npc_encounter
    npcId: strahd_von_zarovich
    encounterType: social
    dialogue: "Strahd arrives in his black carriage, greeted respectfully by the Vistani. He may observe the party from a distance, speak with Madam Eva, or even approach party for cryptic conversation. He will not attack—the Vistani camp is neutral ground."
  - type: state_update
    locationId: tser-pool-encampment
    stateChanges:
      strahd_visited: true
      strahd_encounter_count: +1
      vistani_witnessed_interaction: true
  - type: custom
    description: "Strahd respects the Vistani's neutrality. He may comment on the Tarokka reading, express curiosity about the party, or deliver veiled threats. He views this as a social call to maintain his alliance with Madam Eva's people."
```

**Consequences**:
- Strahd assesses party's capabilities and personalities
- May provide cryptic warnings or philosophical conversation
- Establishes that Strahd and Vistani have an arrangement
- Party learns Strahd can appear anywhere, anytime
- Combat here is unlikely but possible if party attacks first (Vistani would not intervene)

---

### Event: Arrigal's Subtle Betrayal
```yaml
eventId: arrigal_betrayal
name: "Arrigal Reports to Strahd"
trigger_type: conditional
trigger_conditions:
  - type: player_confides_in_npc
    npcId: arrigal
    trust_threshold: true
effects:
  - type: custom
    description: "Arrigal secretly reports party information to Strahd: their capabilities, goals, weaknesses, and travel plans. This information will be used to set up ambushes or counter party strategies."
  - type: state_update
    locationId: tser-pool-encampment
    stateChanges:
      arrigal_trust_gained: true
      information_leaked_to_strahd: true
  - type: game_flag_set
    flags:
      - strahd_knows_party_plans: true
      - ambush_prepared: conditional
```

**Consequences**:
- Future random encounters may be more specifically tailored to counter party
- If party discovers Arrigal's betrayal, Vistani trust may be damaged
- Luvash doesn't know about his brother's treachery
- Reveals not all Vistani are neutral—some serve Strahd for personal gain

**Discovery Path**:
- Party may notice Arrigal sending messages (DC 18 Perception)
- Intercepting messages reveals coded information about party
- Confronting Arrigal causes him to flee camp
- Luvash is devastated if he learns his brother betrayed camp neutrality

---

## Social Events

### Event: Evening Entertainment
```yaml
eventId: vistani_evening_entertainment
name: "Vistani Music and Stories"
trigger_type: recurring
recurrence: daily
times: ["19:00"]
effects:
  - type: custom
    description: "As evening falls, Vistani gather around the bonfire for music, dancing, and storytelling. Violin music fills the air, dancers perform traditional Vistani dances, and elders tell ancient stories. Visitors are welcome to join, share their own tales, or simply enjoy the atmosphere."
  - type: state_update
    locationId: tser-pool-encampment
    stateChanges:
      entertainment_active: true
      camp_morale: high
  - type: social_opportunity
    description: "Party can interact with Vistani, learn lore, build relationships, or gather rumors. Participating in festivities earns respect (potential Persuasion checks to gain information or favors)."
```

**Consequences**:
- Party learns Vistani culture and history
- Stories contain hints about Barovia's past and Strahd's history
- Building rapport may unlock better trades or assistance
- Relaxing atmosphere provides brief respite from Barovia's horror
- Strahd may arrive during these gatherings to observe

---

## Environmental Events

### Event: Mysterious Lights Over Tser Pool
```yaml
eventId: tser_pool_lights
name: "Strange Lights Dance Over the Water"
trigger_type: conditional
trigger_conditions:
  - type: time_of_day
    time: night
  - type: weather
    condition: fog
effects:
  - type: custom
    description: "Eerie lights flicker and dance across the surface of the Tser Pool. Vistani superstition warns not to approach—these lights lead travelers to watery graves. Investigation reveals they're will-o'-wisps or possibly spirits of those who drowned in the pool."
  - type: atmosphere
    description: "Unsettling phenomenon that reinforces Barovia's supernatural danger"
```

**Consequences**:
- Atmospheric event that builds tension
- If party investigates, potential will-o'-wisp encounter (CR 2)
- Vistani warn against following lights
- May be connected to Arabelle's disappearance if that quest is active

---

### Event: Morning Mist Rising
```yaml
eventId: morning_mist_tser_pool
name: "Dawn Mist Rises from Tser Pool"
trigger_type: recurring
recurrence: daily
times: ["06:00"]
effects:
  - type: atmosphere
    description: "Thick mist rises from the cold waters of the Tser Pool each morning, wreathing the camp in fog until mid-morning. Vistani emerge from tents, rekindle fires, and begin daily routines. The mist creates an ethereal, otherworldly atmosphere."
```

**Consequences**:
- Atmospheric recurring event
- Provides cover if party needs to approach camp stealthily
- Creates mystical mood appropriate for fortune-telling location

---

## Trading Events

### Event: Traveling Merchant Arrives
```yaml
eventId: merchant_caravan_arrival
name: "Outside Merchant Visits Camp"
trigger_type: conditional
trigger_conditions:
  - type: calendar_date_range
    dates: ["735-10-8", "735-10-15", "735-10-22"]
    time: "12:00"
effects:
  - type: custom
    description: "A non-Vistani merchant arrives at camp, seeking trade and the safety of numbers. They bring goods from other parts of Barovia: Vallaki crafts, Krezk wool, or even rare items from outside travelers. Temporary expansion of available inventory."
  - type: state_update
    locationId: tser-pool-encampment
    stateChanges:
      visiting_merchant: true
      expanded_inventory: true
  - type: items_available
    temporary_items:
      - "Healing Potions (additional stock)"
      - "Vallaki Wine (premium)"
      - "Warm winter clothing"
      - "Rare spell components"
      - "Information about other settlements"
```

**Consequences**:
- Temporary access to items not usually available
- Merchant shares news and rumors from other locations
- Merchant may become victim of Strahd's forces if encounter occurs
- Opportunity to trade excess equipment or quest items

---

## Notes for Epic 2 Integration

All events conform to EventScheduler schema (Epic 2):
- `eventId`: Unique identifier
- `name`: Display name for event
- `trigger_type`: date_time, conditional, recurring, location
- `trigger_conditions`: Array of conditions that must be met
- `effects`: Array of effects to apply (npc_status, state_update, combat_encounter, quest_trigger, custom)

The Tarokka reading event is campaign-critical and should be triggered early. Other events provide atmosphere, quests, and character development opportunities. Strahd's visit reinforces that he is always watching, while Arabelle's quest creates urgency and potential for Vistani alliance.

EventExecutor loads these definitions and applies effects to State.md files via Epic 1 StateManager.
