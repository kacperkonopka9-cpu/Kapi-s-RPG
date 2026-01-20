# Tsolenka Pass - Events

## Combat Events

### Event: Roc Attack
```yaml
eventId: roc_attacks_party
name: "The Roc Descends"
trigger_type: conditional
trigger_conditions:
  - type: player_arrives_at_location
    locationId: tsolenka-pass
  - type: time_on_bridge
    minutes: 5
  - type: random_chance
    probability: 0.75
effects:
  - type: combat_encounter
    locationId: tsolenka-pass
    encounterDetails:
      name: "Roc Attack on the Bridge"
      enemies:
        - type: roc
          cr: 11
          count: 1
      environment: mountain_bridge
      difficulty: deadly
      special_mechanics:
        - high_winds_impose_disadvantage_ranged
        - grapple_and_drop_into_chasm
        - narrow_bridge_limits_movement
        - vertical_combat_flying_enemy
  - type: atmosphere
    description: "A massive shadow blocks out the sky. The Roc's piercing cry echoes across the mountains as it descends toward the party, talons extended and eyes fixed on its prey."
  - type: state_update
    locationId: tsolenka-pass
    stateChanges:
      roc_encountered: true
      bridge_combat_initiated: true
```

**Consequences**:
- Extremely dangerous combat encounter (CR 11)
- Risk of being grappled and dropped into chasm (10d6+ fall damage)
- High winds impose disadvantage on ranged attack rolls
- Narrow bridge limits tactical options (15-foot width)
- Victory grants access to Roc's nest treasure
- Defeating Roc makes future passage to Amber Temple safe

**Tactical Notes**:
- **Grapple Tactic**: Roc attempts to grapple Medium or smaller characters (DC 19 escape). On next turn, flies up and drops victim into chasm (automatic 10d6 damage minimum).
- **Aerial Superiority**: Roc uses 120 ft. fly speed to stay out of melee reach, forcing party to use ranged attacks (with disadvantage due to wind).
- **Target Priority**: Roc intelligently targets spell casters first, then ranged attackers, finally melee combatants.
- **Retreat Threshold**: If reduced below 50% HP and nest/eggs not directly threatened, Roc retreats to heal and return later.

---

### Event: Roc Defends Nest
```yaml
eventId: roc_nest_defense
name: "Guardian of the Nest"
trigger_type: conditional
trigger_conditions:
  - type: player_approaches_location
    specificLocation: northern_guard_tower_rooftop
  - type: roc_alive
    value: true
effects:
  - type: combat_encounter
    locationId: tsolenka-pass
    encounterDetails:
      name: "Roc Nest Defense"
      enemies:
        - type: roc
          cr: 11
          count: 1
      environment: guard_tower_rooftop
      difficulty: deadly
      special_mechanics:
        - roc_fights_to_death
        - nest_terrain_advantage
        - eggs_can_be_destroyed_to_enrage
  - type: custom
    description: "The Roc explodes from its nest with murderous fury. How DARE these tiny creatures approach its offspring! It attacks with relentless aggression, fighting to the death to protect its territory."
```

**Consequences**:
- Roc fights to the death (no retreat threshold)
- More aggressive tactics (multiattack every round)
- Breaking eggs during combat grants advantage on next attack against Roc (enraged, reckless)
- Defeating Roc grants access to substantial treasure hoard
- Dead Roc makes Tsolenka Pass permanently safe

---

## Environmental Events

### Event: Bridge Collapse Hazard
```yaml
eventId: bridge_section_collapse
name: "The Old Bridge Groans"
trigger_type: conditional
trigger_conditions:
  - type: heavy_weight_on_damaged_section
    weight_threshold: 800_lbs
  - type: combat_on_bridge
    value: true
effects:
  - type: skill_check_required
    skill: dexterity
    dc: 15
    failure_consequence: "Fall 1d6 × 10 feet into chasm (partial collapse)"
  - type: damage
    damageType: bludgeoning
    amount: "variable based on fall distance"
  - type: state_update
    locationId: tsolenka-pass
    stateChanges:
      bridge_partially_collapsed: true
      gap_widened: 15_feet
  - type: custom
    description: "With a sickening crack, the ancient bridge gives way. Stone crumbles into the abyss. Characters must make DC 15 Dexterity saving throws or fall partway into the chasm, catching themselves on broken stonework."
```

**Consequences**:
- Failed save: Fall 1d6 × 10 feet (stop at ledge, make Athletics check to climb back)
- If fall exceeds 60 feet: Likely fatal (6d6+ damage plus ongoing fall risk)
- Bridge gap increases from 10 feet to 15 feet (harder to cross)
- Creates ongoing hazard for rest of session
- Rope, magic, or extreme athleticism required to bypass

**Trigger Situations**:
- Roc combat on the bridge
- Heavy creatures (more than 800 lbs) on damaged section
- Siege weapons or large objects dropped on bridge
- Deliberate sabotage

---

### Event: Mountain Storm
```yaml
eventId: tsolenka_storm
name: "Mountain Fury Unleashed"
trigger_type: conditional
trigger_conditions:
  - type: weather_check
    severity: severe
  - type: time_of_day
    range: [afternoon, night]
effects:
  - type: atmosphere
    description: "Black clouds roll over the mountains. Wind screams across the pass with terrible force. Ice and sleet reduce visibility to mere feet. Thunder crashes off the cliff walls."
  - type: skill_check_required
    skill: dexterity_acrobatics
    dc: 14
    frequency: every_10_feet_traversed
    failure_consequence: "Blown off balance, risk of falling"
  - type: state_update
    locationId: tsolenka-pass
    stateChanges:
      storm_active: true
      visibility: heavily_obscured
      movement_speed: halved
  - type: damage
    damageType: cold
    amount: "1d4 per hour of exposure"
    condition: "without cold weather gear"
```

**Consequences**:
- Visibility reduced to heavily obscured (5-10 feet)
- Wind imposes disadvantage on all ranged attacks
- Movement speed halved (difficult terrain)
- DC 14 Acrobatics check every 10 feet or risk being blown off balance
- 1d4 cold damage per hour of exposure (negated by winter gear)
- Roc hunts more actively during storms (natural advantage)
- Southern guard tower offers shelter

**Storm Duration**: 2d4 hours, then gradually subsides

---

## Discovery Events

### Event: Frozen Guards Manifest
```yaml
eventId: frozen_guards_appear
name: "Spirits of the Last Sentinels"
trigger_type: conditional
trigger_conditions:
  - type: party_shelters_in_location
    specificLocation: southern_guard_tower
  - type: temperature
    threshold: below_freezing
  - type: time_of_day
    value: night
effects:
  - type: npc_encounter
    npcIds:
      - frozen_guards
    disposition: melancholic_neutral
  - type: atmosphere
    description: "Spectral flames flicker to life in the tower's cold hearth. Four ghostly soldiers materialize around the fire, speaking in hollow voices about duty, cold, and the bird that took their comrades."
  - type: social_opportunity
    description: "The guards will speak with the party if addressed respectfully. They share warnings about the Amber Temple and the Roc, and reveal the location of their hidden cache."
  - type: state_update
    locationId: tsolenka-pass
    stateChanges:
      guards_encountered: true
      warnings_received: true
```

**Consequences**:
- Party gains valuable information about Amber Temple dangers
- Warnings about dark gifts and corruption
- Location of hidden cache revealed (DC 14 Investigation otherwise)
- Quest opportunity: Give guards proper burial (grants blessing)
- Historical context about Tsolenka Pass defenses

**Guard Information**:
- *"The temple corrupts all who seek its knowledge"*
- *"The bird came twenty winters past, killed half our garrison"*
- *"Strahd stopped the supply caravans. He wanted us to die here."*
- *"Don't accept the amber gifts. We've seen what they do to people."*

---

### Event: Discovery of Warning Inscriptions
```yaml
eventId: tsolenka_gate_warnings
name: "Ancient Warnings Deciphered"
trigger_type: conditional
trigger_conditions:
  - type: player_examines_location
    specificLocation: tsolenka_gate
  - type: skill_check
    skill: intelligence_history
    dc: 15
effects:
  - type: custom
    description: "The inscriptions on Tsolenka Gate become readable to those with historical knowledge. Written in ancient Barovian, Draconic, and Celestial, they warn of forbidden knowledge, eternal damnation, and guardians that never sleep."
  - type: game_flag_set
    flag: tsolenka_warnings_understood
    value: true
  - type: state_update
    locationId: tsolenka-pass
    stateChanges:
      warnings_deciphered: true
      party_forewarned: true
```

**Consequences**:
- Party understands the severity of what lies ahead
- Foreshadowing of Amber Temple's dark gifts
- DC 15 Intelligence (History) reveals the gate was built to warn mortals, immortals, AND divine beings
- Multiple languages suggest the temple's danger transcends normal cosmic boundaries

**Full Translation**:
*"Turn back, ye seekers of forbidden knowledge. The guardians do not sleep. The Amber corrupts. The price of wisdom is eternal damnation. What lies beyond belongs to gods and demons, not to mortals. Choose life. Choose ignorance. Choose to return home."*

---

## Quest Events

### Event: Safe Passage Secured
```yaml
eventId: roc_defeated_passage_safe
name: "Tsolenka Pass is Secure"
trigger_type: conditional
trigger_conditions:
  - type: roc_status
    value: defeated
effects:
  - type: quest_resolution
    questId: secure_mountain_pass
    outcome: success
  - type: state_update
    locationId: tsolenka-pass
    stateChanges:
      roc_threat_eliminated: true
      passage_safe: true
      amber_temple_accessible: true
  - type: custom
    description: "With the Roc defeated, Tsolenka Pass is now safe for travel. The route to the Amber Temple lies open, though the guards' warnings echo in memory. What lies ahead may be worse than any giant bird."
```

**Consequences**:
- Travel between Vallaki region and Amber Temple becomes safe
- Future visits to Tsolenka Pass are peaceful
- Access to Roc's nest treasure
- Reputation gain: "Slayers of the Tsolenka Roc"
- Party can escort other travelers (potential escort quests)

---

### Event: Amber Temple Path Revealed
```yaml
eventId: temple_path_discovered
name: "The Road to Forbidden Knowledge"
trigger_type: conditional
trigger_conditions:
  - type: cross_tsolenka_bridge
    value: complete
effects:
  - type: custom
    description: "Beyond the bridge and guard towers, a narrow mountain path winds higher into the Balinoks. Snow covers ancient stone steps carved into the mountainside. In the distance, partially hidden by fog, a massive structure of dark stone and amber looms—the Amber Temple."
  - type: state_update
    locationId: tsolenka-pass
    stateChanges:
      amber_temple_visible: true
      path_discovered: true
  - type: quest_trigger
    questId: explore_amber_temple
    questStatus: available
```

**Consequences**:
- Amber Temple location unlocked
- Final warning opportunity before entering temple
- Party can choose to turn back one last time
- Visual confirmation of temple's forbidding appearance

---

## Recurring Events

### Event: Roc Hunting Pattern
```yaml
eventId: roc_daily_hunt
name: "The Roc's Hunt"
trigger_type: recurring
recurrence: daily
times: ["09:00", "15:00"]
effects:
  - type: atmosphere
    description: "The Roc circles high above the pass, scanning for prey. Mountain goats scatter. Travelers freeze in place, hoping to avoid notice."
  - type: custom
    description: "The Roc hunts twice daily—morning and afternoon. Characters on the bridge during these times have 75% chance of encounter unless they take shelter in guard towers."
```

**Consequences**:
- Creates windows of danger (09:00, 15:00)
- Encourages strategic timing of bridge crossing
- Guard towers provide reliable shelter
- Night crossing slightly safer (Roc less active in darkness, though visibility worse)

---

## Notes for Epic 2 Integration

All events conform to EventScheduler schema:
- `eventId`: Unique identifier
- `name`: Display name
- `trigger_type`: date_time, conditional, recurring, location
- `trigger_conditions`: Array of conditions
- `effects`: Array of effects (combat_encounter, state_update, atmosphere, skill_check_required, damage, etc.)

**Tsolenka Pass Event Design**:
1. **Major Combat**: Roc encounter (CR 11 deadly encounter)
2. **Environmental Hazards**: Bridge collapse, mountain storms
3. **Lore/Discovery**: Frozen guards, warning inscriptions
4. **Gateway Function**: Opens access to Amber Temple (next major location)
5. **Risk vs. Reward**: Dangerous encounter guards substantial treasure

**Integration Points**:
- EventExecutor applies effects to State.md via StateManager
- Combat encounters track Roc status, bridge integrity
- Environmental events modify travel conditions dynamically
- Quest events unlock Amber Temple access

**Difficulty Scaling**:
- CR 11 Roc is intended for parties level 8+
- Lower-level parties should use stealth/avoidance tactics
- Environmental hazards provide alternate dangers beyond combat
- Multiple tactical approaches: combat, negotiation (impossible with Roc), stealth, or magical bypass
