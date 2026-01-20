# Abbey of St. Markovia - Events

## Abbey-Specific Events

### Event: First Meeting with the Abbot
```yaml
eventId: first_meeting_abbot
name: "Audience with the Abbot"
trigger_type: conditional
trigger_conditions:
  - type: player_enters_location
    locationId: krezk/abbey-of-st-markovia
    first_time: true
effects:
  - type: custom
    description: "The Abbot greets party warmly, offers healing services, asks about their needs. May request tasks in exchange for aid. Reveals nothing of his true nature initially—appears as benevolent divine healer."
  - type: quest_trigger
    questId: abbey_investigation
    questStatus: available
  - type: state_update
    locationId: krezk/abbey-of-st-markovia
    stateChanges:
      abbot_met: true
      abbot_disposition: welcoming
```

---

### Event: Vasilka Reveal
```yaml
eventId: vasilka_reveal
name: "Discovery of Vasilka"
trigger_type: conditional
trigger_conditions:
  - type: player_explores
    area: vasilka_room
    or: abbot_shows_creation
effects:
  - type: custom
    description: "Party encounters Vasilka—realizes she is flesh golem constructed from corpses. Abbot explains she is bride for Strahd to 'cure his loneliness.' Revelation of Abbot's madness."
  - type: state_update
    locationId: krezk/abbey-of-st-markovia
    stateChanges:
      vasilka_discovered: true
      abbot_true_nature_revealed: true
  - type: npc_status
    npcId: the_abbot
    abbot_insanity_known: true
```

---

### Event: Mongrelfolk Liberation
```yaml
eventId: mongrelfolk_liberation
name: "Freeing the Mongrelfolk"
trigger_type: conditional
trigger_conditions:
  - type: abbot_defeated
    with_mongrelfolk_alive: true
effects:
  - type: custom
    description: "With Abbot dead or incapacitated, mongrelfolk are freed from his control. They react with confusion, fear, some relief, some despair. Party must decide what to do with them."
  - type: state_update
    locationId: krezk/abbey-of-st-markovia
    stateChanges:
      mongrelfolk_freed: true
      abbey_controlled_by: none
      mongrelfolk_fate: pending_party_decision
  - type: quest_trigger
    questId: mongrelfolk_future
    stage: liberated_need_destination
```

**Potential Outcomes**:
- Bring to Krezk (requires high village trust, villagers are horrified)
- Leave at abbey (they remain there, leaderless)
- Mercy kill (grim but some mongrelfolk may request this)
- Cure attempts (Greater Restoration/Remove Curse may help some)

---

### Event: Abbot Requests Wedding Dress
```yaml
eventId: abbot_wedding_dress_quest
name: "The Perfect Wedding Dress"
trigger_type: conditional
trigger_conditions:
  - type: abbot_met
    vasilka_incomplete: true
    party_seems_capable: true
effects:
  - type: quest_trigger
    questId: fetch_wedding_dress
    stage: abbot_assigns_task
  - type: custom
    description: "Abbot asks party to retrieve wedding dress from Baroness Lydia Petrovna in Vallaki. Offers healing services or information in exchange."
  - type: state_update
    locationId: krezk/abbey-of-st-markovia
    stateChanges:
      wedding_dress_quest_active: true
      abbot_waiting_for_dress: true
```

---

### Event: Vasilka Destruction
```yaml
eventId: vasilka_destruction
name: "Destruction of the Bride"
trigger_type: conditional
trigger_conditions:
  - type: vasilka_hp_zero
    or: vasilka_body_destroyed
effects:
  - type: npc_status
    npcId: vasilka
    status: destroyed
  - type: npc_status
    npcId: the_abbot
    mood: enraged
    hostile: true
  - type: custom
    description: "Abbot's masterwork is destroyed. He flies into divine fury and attacks party immediately. No negotiation possible."
  - type: state_update
    locationId: krezk/abbey-of-st-markovia
    stateChanges:
      vasilka_status: destroyed
      abbot_hostile: true
      abbey_combat_initiated: true
```

---

### Event: Abbot Offers Healing
```yaml
eventId: abbot_healing_service
name: "The Abbot's Miraculous Healing"
trigger_type: conditional
trigger_conditions:
  - type: player_requests_healing
    target_npc_or_party_member: specified
    abbot_not_hostile: true
effects:
  - type: custom
    description: "Abbot performs healing miracle—can cure diseases, restore limbs, even raise recently dead. Healing is genuine (deva powers) but comes from fallen angel. Party must decide if accepting such aid is morally acceptable."
  - type: quest_update
    questId: save_ilya_krezkov
    if: target_is_ilya
    stage: ilya_healed_by_abbot
  - type: state_update
    locationId: krezk/abbey-of-st-markovia
    stateChanges:
      abbot_healing_performed: true
      party_indebted_to_abbot: true
```

**Cost**: Abbot may ask for payment in tasks, information, or simply expects party to leave him to his work.

---

### Event: Exploring the Catacombs
```yaml
eventId: explore_catacombs
name: "Descent into the Catacombs"
trigger_type: conditional
trigger_conditions:
  - type: player_enters
    area: abbey_catacombs
effects:
  - type: custom
    description: "Party discovers burial chambers of Order of St. Markovia. Some sarcophagi have been opened, bodies taken for Abbot's experiments. St. Markovia's bones still rest in main sarcophagus, radiating faint divine presence."
  - type: state_update
    locationId: krezk/abbey-of-st-markovia
    stateChanges:
      catacombs_explored: true
      st_markovia_bones_location_known: true
  - type: potential_encounter
    description: "Undead may inhabit catacombs if Abbot's desecration attracted them. Or restless spirits of the order, lamenting what their abbey has become."
```

---

### Event: Bell Tolling Omen
```yaml
eventId: abbey_bell_tolls
name: "The Bell Tolls"
trigger_type: recurring
recurrence: random
times: ["midnight", "dawn", "dusk"]
effects:
  - type: custom
    description: "Abbey bell tolls on its own—no visible ringer. Sound carries across Krezk, causing villagers to cross themselves in fear. May be divine warning, Abbot's madness made manifest, or simply wind."
  - type: atmosphere
    mood: ominous
    villagers_react: fear
```

---

### Event: Mongrelfolk Encounter
```yaml
eventId: mongrelfolk_encounter
name: "Meeting the Mongrelfolk"
trigger_type: conditional
trigger_conditions:
  - type: player_explores
    area: north_wing
    or: courtyard_at_night
effects:
  - type: custom
    description: "Party encounters mongrelfolk. Initial reaction is fear/horror, but mongrelfolk are pitiable rather than threatening. May beg for help, warn party about Abbot, or simply flee."
  - type: state_update
    locationId: krezk/abbey-of-st-markovia
    stateChanges:
      mongrelfolk_encountered: true
      party_knows_about_experiments: true
```

---

### Event: Strahd Visits Abbey
```yaml
eventId: strahd_visits_abbey
name: "Strahd's Inspection of His Bride"
trigger_type: conditional
trigger_conditions:
  - type: vasilka_complete
    strahd_informed: true
    party_at_abbey: true
effects:
  - type: custom
    description: "Strahd arrives at abbey to inspect Vasilka. He is... unimpressed. Sees through Abbot's delusion immediately. May mock Abbot cruelly, reject Vasilka, or simply observe party's reaction to the whole affair."
  - type: npc_encounter
    npcId: strahd_von_zarovich
    mood: amused_contemptuous
  - type: state_update
    locationId: krezk/abbey-of-st-markovia
    stateChanges:
      strahd_visited: true
      vasilka_fate: rejected_by_strahd
      abbot_devastated: true
```

**Note**: This is rare, high-level encounter. Strahd doesn't typically come here unless Abbot summons him or DM wants dramatic confrontation.

---

## Notes for Epic 2 Integration

All events follow EventScheduler schema:
- `eventId`: Unique identifier
- `name`: Display name
- `trigger_type`: conditional (most abbey events are player-action driven)
- `trigger_conditions`: What must happen for event to fire
- `effects`: State changes, NPC reactions, combat encounters, quest triggers

Events are checked when:
- Party enters abbey or specific rooms
- Party performs actions (attacks Vasilka, frees mongrelfolk, etc.)
- Time passes (bell tolling)
- NPCs make decisions (Abbot offers quests, Strahd visits)
