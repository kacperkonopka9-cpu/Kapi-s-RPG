# Van Richten's Tower - Events

## Discovery Events

### Event: Finding Van Richten's Tower
```yaml
eventId: discover_van_richtens_tower
name: "Discovery of the Vampire Hunter's Sanctum"
trigger_type: location
trigger_conditions:
  - type: player_approaches_location
    locationId: van-richtens-tower
    first_visit: true
effects:
  - type: custom
    description: "Through mist over Lake Baratok, you spot a five-story stone tower on a small island. Ravens circle overhead, and a colorful wagon sits near the shore. This isolated fortress holds secrets about Barovia's greatest vampire hunter."
  - type: state_update
    locationId: van-richtens-tower
    stateChanges:
      discovered: true
      first_visit_date: current_date
```

**Consequences**:
- Strategic location for party—potential ally and information source
- Traps pose immediate danger to unprepared party
- Ezmerelda may be present or tower may be empty
- Contains critical information about Van Richten/Rictavio

---

## Trap Events

### Event: Clay Golem Activation
```yaml
eventId: golem_trap_triggered
name: "The Clay Golem Awakens"
trigger_type: conditional
trigger_conditions:
  - type: player_speaks_in_tower
    without_command_word: true
  - type: command_word_not_said
    correct_word: "Khazan"
effects:
  - type: combat_encounter
    locationId: van-richtens-tower
    encounterDetails:
      name: "Clay Golem Guardian"
      enemies:
        - type: clay_golem
          cr: 9
          count: 1
      difficulty: deadly
      environment: confined_tower_ground_floor
  - type: custom
    description: "What appeared to be a stone statue suddenly moves. A massive clay golem animates, its eyes glowing with arcane energy. It advances with relentless purpose, programmed to destroy all intruders."
```

**Consequences**:
- CR 9 encounter, deadly for low-mid level parties
- Golem immune to most magic, resistant to physical damage
- Confined space makes combat difficult
- Party must flee, destroy golem, or use command word
- Ezmerelda (if present) will assist but is also endangered

**Avoidance**:
- DC 18 Investigation finds carved command word hint
- Speaking "Khazan" deactivates golem permanently
- Silence spell prevents accidental activation
- Clever players may discover command word from Van Richten's notes

---

### Event: Wagon Explosion
```yaml
eventId: wagon_trap_triggered
name: "The Trapped Wagon Explodes"
trigger_type: conditional
trigger_conditions:
  - type: player_opens_wagon
    without_disarming: true
effects:
  - type: damage
    damage_type: fire
    damage_amount: 5d8
    area: 20_foot_radius
    save: DC 16 Dexterity
  - type: custom
    description: "The wagon's door triggers an explosive rune. Fire erupts in a massive blast, consuming the wagon and everything inside. The explosion echoes across Lake Baratok, alerting everyone in the region to your presence."
  - type: state_update
    locationId: van-richtens-tower
    stateChanges:
      wagon_destroyed: true
      wagon_contents_lost: true
      loud_noise_made: true
```

**Consequences**:
- All wagon contents destroyed
- 5d8 fire damage to anyone nearby
- Loud explosion attracts attention (Strahd's spies, local predators)
- Ezmerelda or Van Richten will know tower was breached

**Avoidance**:
- DC 16 Investigation to spot explosive rune
- DC 18 Arcana or Thieves' Tools to disarm
- Ezmerelda's notes (if found) warn about trap
- Clever players might trigger remotely or use water

---

## NPC Encounter Events

### Event: Ezmerelda's Confrontation
```yaml
eventId: ezmerelda_encounter
name: "The Vampire Hunter Challenges Intruders"
trigger_type: conditional
trigger_conditions:
  - type: ezmerelda_present_in_tower
    value: true
  - type: player_enters_tower
    without_invitation: true
effects:
  - type: npc_encounter
    npcId: ezmerelda_davenir
    encounterType: hostile_initially
    dialogue: "You've got ten seconds to explain who you are and why you're in my mentor's tower. Choose your words carefully—I don't miss with this crossbow."
  - type: skill_check_required
    skill: persuasion_or_insight
    dc: 15
    success: ezmerelda_listens
    failure: combat_begins
```

**Consequences**:
- Tense confrontation with skilled vampire hunter
- Success: Ezmerelda becomes potential ally
- Failure: Combat with CR 8 NPC hunter
- Opportunity to learn about Van Richten/Rictavio
- She may join party if convinced they oppose Strahd

---

## Discovery Events

### Event: Van Richten's Identity Revealed
```yaml
eventId: rictavio_identity_discovered
name: "The Hunter's Secret Identity"
trigger_type: conditional
trigger_conditions:
  - type: player_reads_journal
    item: van_richtens_journal
effects:
  - type: custom
    description: "Van Richten's journal reveals shocking information: the flamboyant bard 'Rictavio' currently staying at Vallaki's Blue Water Inn is actually Rudolph van Richten, the legendary vampire hunter, in disguise. He's been operating under cover to investigate Strahd without drawing attention."
  - type: quest_trigger
    questId: find_van_richten
    questStatus: updated
    new_information: "Van Richten is disguised as Rictavio in Vallaki"
  - type: state_update
    locationId: van-richtens-tower
    stateChanges:
      rictavio_identity_known: true
      journal_read: true
```

**Consequences**:
- Major revelation connects tower to Vallaki
- Party knows where to find Van Richten
- Approaching "Rictavio" with knowledge of his identity requires discretion
- Van Richten may be impressed or alarmed party discovered his secret
- Creates opportunity for vampire hunter alliance

---

### Event: Tome of Strahd Discovery
```yaml
eventId: tome_of_strahd_found
name: "Strahd's Personal Journal Discovered"
trigger_type: conditional
trigger_conditions:
  - type: tarokka_reading_indicated
    artifact: tome_of_strahd
    location: van-richtens-tower
  - type: player_searches_observatory
    investigation_dc: 18
effects:
  - type: quest_item_obtained
    item: tome_of_strahd
    campaign_artifact: true
  - type: custom
    description: "Hidden in a secret compartment, you find a leather-bound book written in elegant script. This is Strahd's personal journal—his transformation story, his obsession with Tatyana, and insights into his psychology. This is one of the three artifacts needed to face him."
  - type: game_flag_set
    flags:
      - tome_of_strahd_obtained: true
      - artifacts_collected: +1
```

**Consequences**:
- Major campaign artifact obtained (1 of 3)
- Grants insight into Strahd's weaknesses and motivations
- Reading provides tactical advantages in final confrontation
- Strahd will sense when party possesses his journal
- Van Richten may have already read it—explains his knowledge

---

## Environmental Events

### Event: Lake Baratok Mists
```yaml
eventId: lake_mists_thicken
name: "Mists Rise from Lake Baratok"
trigger_type: recurring
recurrence: daily
times: ["06:00", "18:00"]
effects:
  - type: atmosphere
    description: "Thick mist rises from the cold waters of Lake Baratok, obscuring the tower and causeway. Visibility drops to 20 feet. The isolation becomes complete."
```

**Consequences**:
- Atmospheric effect
- Makes causeway more dangerous (can't see where stepping)
- Provides cover for stealthy approach
- Increases difficulty of observing tower from distance

---

## Surveillance Events

### Event: Keepers of the Feather Observation
```yaml
eventId: wereravens_observe_tower
name: "Ravens Watch the Tower"
trigger_type: conditional
trigger_conditions:
  - type: player_at_location
    locationId: van-richtens-tower
effects:
  - type: custom
    description: "Ravens circle overhead in unusual numbers, watching with obvious intelligence. The Keepers of the Feather monitor this location, interested in anyone seeking Van Richten. How the party behaves here will be reported to the Martikov family."
```

**Consequences**:
- Party's actions observed and reported
- Respectful treatment of tower earns Keepers' approval
- Looting or destroying property damages reputation
- May lead to Keepers revealing themselves if party proves worthy

---

## Connection Events

### Event: Strahd Learns of Tower Breach
```yaml
eventId: strahd_tower_alert
name: "Strahd Becomes Aware of Tower Activity"
trigger_type: conditional
trigger_conditions:
  - type: any_of
    conditions:
      - wagon_explosion_occurred: true
      - tome_of_strahd_taken: true
      - loud_combat_at_tower: true
effects:
  - type: custom
    description: "Strahd's spy network reports unusual activity at Van Richten's tower. The vampire lord takes note—if Van Richten's sanctum is compromised, the hunter may be forced from hiding. Strahd begins investigating."
  - type: game_flag_set
    flags:
      - strahd_aware_tower_breached: true
      - strahd_interest_level: increased
```

**Consequences**:
- Strahd's attention drawn to party
- May send spies or minions to investigate
- Van Richten's cover potentially compromised
- Increases encounter probability with Strahd

---

## Notes for Epic 2 Integration

All events conform to EventScheduler schema (Epic 2):
- `eventId`: Unique identifier
- `name`: Display name
- `trigger_type`: date_time, conditional, recurring, location
- `trigger_conditions`: Array of conditions
- `effects`: Array of effects (npc_status, state_update, combat_encounter, quest_trigger, custom)

Van Richten's Tower events focus on:
1. Trap challenges (golem, wagon explosion)
2. NPC encounters (Ezmerelda)
3. Information discovery (Van Richten's identity, Tome of Strahd)
4. Strategic implications (Keepers observing, Strahd alerted)

Tower represents knowledge hub and potential ally connection point rather than major combat location.
