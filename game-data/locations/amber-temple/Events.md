# Amber Temple - Events

## Discovery Events

### Event: First Entry into the Temple
```yaml
eventId: amber_temple_entry
name: "Crossing the Threshold of Damnation"
trigger_type: conditional
trigger_conditions:
  - type: player_arrives_at_location
    locationId: amber-temple
  - type: first_visit
    value: true
effects:
  - type: atmosphere
    description: "The bronze doors groan open, releasing a wave of unnatural cold. Inside, amber light flickers across ice-coated walls. Whispers echo from nowhere and everywhere—promises of power, warnings of doom, pleas for release. The air itself feels thick with ancient malevolence."
  - type: state_update
    locationId: amber-temple
    stateChanges:
      entered: true
      doors_opened: true
      whispers_begun: true
  - type: skill_check_required
    skill: wisdom
    dc: 13
    failure_consequence: "1d6 psychic damage from overwhelming psychic pressure"
  - type: custom
    description: "All characters must make DC 13 Wisdom saving throws upon entry. Failure means the vestiges' whispers burrow into their minds, dealing 1d6 psychic damage and planting seeds of temptation."
```

**Consequences**:
- Temple officially discovered and explorable
- Whispers persist throughout temple stay (ambient psychological pressure)
- Characters forewarned about the nature of this place
- Sets tone for entire dungeon: danger, corruption, power

---

### Event: Meeting Exethanter
```yaml
eventId: exethanter_encounter
name: "The Forgotten Guardian"
trigger_type: conditional
trigger_conditions:
  - type: player_enters_area
    area: library
effects:
  - type: npc_encounter
    npcIds:
      - exethanter
    disposition: confused_neutral
  - type: atmosphere
    description: "A desiccated figure in tattered robes looks up from ancient books. Green light flickers in hollow eye sockets. His voice is hollow, uncertain: 'Have we met? You seem... familiar. Or perhaps not. I forget.'"
  - type: social_opportunity
    description: "Exethanter will converse if approached non-threateningly. He provides fragments of lore, warnings about vestiges, and may reveal hidden areas if treated kindly."
  - type: state_update
    locationId: amber-temple
    stateChanges:
      exethanter_encountered: true
      guardian_identity_known: true
```

**Consequences**:
- Access to Exethanter's knowledge (fragmented but valuable)
- Potential ally if party helps restore his memories
- Source of warnings about dark gifts
- Key to discovering hidden laboratory and reversal ritual

**Interaction Options**:
- **Combat**: Attacking triggers CR 14 lich fight (deadly)
- **Conversation**: Exethanter shares warnings, lore, and sadness
- **Magic**: *Greater Restoration* partially restores memories (10-minute intervals)
- **Compassion**: Treating him kindly makes him remember his noble purpose

---

## Combat Events

### Event: Flameskull Patrol
```yaml
eventId: flameskull_encounter
name: "The Temple's Eternal Guardians"
trigger_type: conditional
trigger_conditions:
  - type: player_moves_through_corridors
    value: true
  - type: random_chance
    probability: 0.6
effects:
  - type: combat_encounter
    locationId: amber-temple
    encounterDetails:
      name: "Flameskull Guardians"
      enemies:
        - type: flameskull
          cr: 4
          count: 1d3
      environment: frozen_corridors
      difficulty: medium
      special_mechanics:
        - rejuvenation_unless_holy_water
        - fire_vulnerability_in_ice_environment
        - spellcaster_undead
  - type: atmosphere
    description: "Floating skulls wreathed in green flame emerge from the ice. They chant spell incantations in dead languages, launching rays of fire and magical missiles."
```

**Consequences**:
- Regular encounters throughout temple exploration
- Flameskulls rejuvenate 1 hour after destruction unless killed with holy water
- Drop minimal treasure (arcane focuses, spell component pouches)
- Can be avoided with Stealth (DC 15) or *Invisibility*

**Tactical Notes**:
- Use Fire Ray (ranged attacks) and Magic Missile
- If reduced to 10 HP or fewer, cast Fireball as desperation move
- Intelligent enough to retreat and summon reinforcements if losing

---

### Event: Arcanaloth Confrontation
```yaml
eventId: arcanaloth_negotiation
name: "The Vault Keeper's Terms"
trigger_type: conditional
trigger_conditions:
  - type: player_approaches_location
    specificLocation: vault
effects:
  - type: npc_encounter
    npcIds:
      - amber_temple_arcanaloth
    disposition: lawful_evil
  - type: social_opportunity
    description: "The jackal-headed fiend regards you with cold intelligence. 'You wish access to the vault? Everything has a price. What are you willing to pay?'"
  - type: custom
    description: "The arcanaloth will negotiate access to treasure. It offers three bargain types: (1) Accept one dark gift in exchange for full vault access, (2) Retrieve an item from outside the temple in exchange for specific items, (3) Provide information about Strahd in exchange for arcane knowledge."
  - type: state_update
    locationId: amber-temple
    stateChanges:
      arcanaloth_negotiation_begun: true
      vault_terms_presented: true
```

**Consequences**:
- **Bargain Accepted**: Party gains vault access, but owes service
- **Bargain Refused**: Arcanaloth denies vault access (can attempt theft or combat)
- **Combat**: Fighting the CR 12 arcanaloth is very difficult encounter
- **Theft**: Requires exceptional Stealth checks (DC 22) and triggers ongoing pursuit

**Bargain Examples**:
1. "Accept Seriach's gift. Any of the twelve. Then the vault is yours."
2. "Retrieve the *Icon of Ravenloft* from Castle Ravenloft. Return it here. The vault is yours."
3. "Tell me Strahd's greatest fear. In exchange, I reveal the location of the Sunsword."

---

### Event: Vilnius Awakens
```yaml
eventId: vilnius_awakens
name: "The High Priest's Fury"
trigger_type: conditional
trigger_conditions:
  - type: player_enters_chamber
    chamber: vilnius_sarcophagus
  - type: sarcophagus_disturbed
    value: true
effects:
  - type: combat_encounter
    locationId: amber-temple
    encounterDetails:
      name: "Vilnius the Mummy Lord"
      enemies:
        - type: mummy_lord
          cr: 15
          count: 1
      environment: catacombs
      difficulty: deadly
      special_mechanics:
        - rejuvenation_via_canopic_jars
        - dreadful_glare_paralyze
        - rotting_fist_curse
        - lair_actions_animate_statues
  - type: atmosphere
    description: "The sarcophagus lid crashes to the floor. A mummified figure rises, its body twisted with dark gift mutations—extra eyes, misshapen limbs, mouths whispering in dead tongues. It speaks telepathically: 'DESECRATORS! The vestiges demand your souls!'"
  - type: state_update
    locationId: amber-temple
    stateChanges:
      vilnius_awakened: true
      catacombs_hostile: true
```

**Consequences**:
- CR 15 boss fight (deadly for even high-level parties)
- Vilnius rejuvenates 24 hours after death unless canopic jars destroyed
- Guards the Scroll of Tarrasque Summoning
- Animates catacombs undead as reinforcements
- Defeating him permanently requires destroying 4 hidden canopic jars (DC 18 Investigation each)

**Canopic Jar Locations**:
1. Hidden in crypt alcove (behind false wall)
2. Submerged in frozen pool
3. Sealed in amber block (requires shattering)
4. Guarded by wights in adjacent chamber

---

## Dark Gift Events

### Event: Vestige Temptation
```yaml
eventId: vestige_temptation
name: "The Whisper of Power"
trigger_type: conditional
trigger_conditions:
  - type: player_approaches_sarcophagus
    sarcophagus: any
effects:
  - type: atmosphere
    description: "As you approach the amber sarcophagus, it pulses with inner light. A voice fills your mind—not sound, but direct thought. It knows your desires, your fears, your weaknesses. It offers exactly what you need most. The price seems small compared to the power offered..."
  - type: skill_check_required
    skill: wisdom
    dc: 15
    failure_consequence: "Compulsion to touch sarcophagus and hear full offer"
  - type: custom
    description: "Each vestige makes a personalized offer based on the character's needs. A wizard might be offered supreme arcane power. A fighter might be offered invincibility in battle. A cleric might be offered the ability to truly save souls. The prices are always severe but often seem bearable in the moment."
  - type: state_update
    locationId: amber-temple
    stateChanges:
      vestige_contact_made: true
      temptation_level: increasing
```

**Consequences**:
- Player must choose: Accept gift (gain power, gain corruption) or refuse (stay pure but potentially weaker)
- Each gift has specific mechanical benefits and narrative/physical costs (see NPCs.md and Description.md)
- Accepting multiple gifts increases corruption exponentially
- Creates dramatic choice: Become powerful enough to defeat Strahd but lose yourself, or stay true but risk failure?

**Example Vestige Offers**:
- **Vampyr**: "Become a true vampire. All of Strahd's power, none of his limitations. Rule by his side—or overthrow him."
- **Seriach**: "Command hellfire. Burn your enemies to ash. The smoke from your eyes is a small price for such power."
- **Tenebrous**: "Death cannot touch you. Accept my gift and you shall be immune to necrotic damage and aging."

---

### Event: Dark Gift Manifestation
```yaml
eventId: dark_gift_physical_change
name: "The Price Made Manifest"
trigger_type: conditional
trigger_conditions:
  - type: dark_gift_accepted
    value: true
  - type: time_elapsed
    hours: 1
effects:
  - type: affliction
    description: "The dark gift's physical price manifests. Seriach's gift causes smoke to pour from eyes and mouth. Savnok's gift causes facial features to vanish. Vampyr's gift triggers undead transformation."
  - type: state_update
    locationId: amber-temple
    stateChanges:
      corruption_visible: true
      party_member_transformed: true
  - type: custom
    description: "NPCs will react with horror, fear, or pity. The character's appearance has fundamentally changed. Mirrors show the corruption. There is no hiding what has been done."
```

**Consequences**:
- Permanent physical transformation
- Social penalties in settlements (villagers fear the corrupted)
- Psychological impact on character
- Can be reversed via ritual in Exethanter's hidden laboratory (see Items.md)

---

## Environmental Events

### Event: Extreme Cold Exposure
```yaml
eventId: temple_cold_damage
name: "The Killing Cold"
trigger_type: recurring
recurrence: hourly
effects:
  - type: damage
    damageType: cold
    amount: 2d6
    condition: "without magical cold protection"
  - type: skill_check_required
    skill: constitution
    dc: 15
    failure_consequence: "Gain one level of exhaustion"
  - type: custom
    description: "The temple's unnatural cold saps strength and vitality. Every hour, characters without magical protection (Ring of Warmth, Endure Elements, etc.) take 2d6 cold damage and must make DC 15 Constitution saves or gain exhaustion."
```

**Consequences**:
- Time pressure: Can't explore indefinitely without protection
- *Ring of Warmth* from Tsolenka Pass Roc's nest becomes extremely valuable
- Encourages efficient exploration rather than extended camping
- Exhaustion accumulation can force retreat

---

### Event: Psychic Pressure Intensifies
```yaml
eventId: vestige_psychic_assault
name: "The Whispers Grow Louder"
trigger_type: conditional
trigger_conditions:
  - type: time_in_temple
    hours: 4
  - type: multiple_vestiges_encountered
    count: 3
effects:
  - type: damage
    damageType: psychic
    amount: 1d6
    frequency: per_hour
  - type: custom
    description: "The longer you remain in the temple, the louder the vestiges' whispers become. They call by name, promise salvation, threaten damnation. Reality feels thin. Shadows move with minds of their own."
  - type: state_update
    locationId: amber-temple
    stateChanges:
      psychic_pressure: severe
      sanity_challenged: true
```

**Consequences**:
- Ongoing psychic damage (1d6 per hour after 4 hours in temple)
- Increased temptation to accept dark gifts ("Make the voices stop!")
- Can cause short-term madness (DM discretion, DC 16 Wisdom saves)
- Leaving temple and returning resets timer

---

## Quest Events

### Event: Discovery of Reversal Ritual
```yaml
eventId: find_reversal_ritual
name: "A Path to Redemption"
trigger_type: conditional
trigger_conditions:
  - type: find_hidden_laboratory
    dc: 20
  - type: exethanter_hints
    value: true
effects:
  - type: quest_item_obtained
    itemId: gift_reversal_ritual
  - type: custom
    description: "In Exethanter's hidden laboratory, you discover his true research: a ritual to reverse dark gifts. It's painful, expensive, and dangerous—but it works. There is a path back from corruption, if you're willing to walk it."
  - type: state_update
    locationId: amber-temple
    stateChanges:
      reversal_ritual_discovered: true
      redemption_possible: true
```

**Consequences**:
- Provides hope for corrupted characters
- Creates choice: Keep power or purge corruption?
- Ritual requires 1,000 gp in components, 8 hours, DC 18 Constitution save
- Success removes dark gift, failure causes permanent HP reduction

---

### Event: Exethanter's Memory Restoration
```yaml
eventId: exethanter_restored
name: "The Guardian Remembers"
trigger_type: conditional
trigger_conditions:
  - type: cast_greater_restoration
    target: exethanter
    count: 3
effects:
  - type: npc_status
    npcId: exethanter
    status: memory_partially_restored
  - type: custom
    description: "Exethanter's eyes blaze with green light. For the first time in millennia, he remembers. His voice steadies: 'I was... I AM the Guardian of the Amber Temple. I remember now. The vestiges must never be freed. And I remember... I remember you. Not you specifically, but those like you. Seekers. Ambitious. Doomed.' He weeps frozen tears. 'I tried to warn so many. So few listened.'"
  - type: social_opportunity
    description: "Restored Exethanter becomes invaluable ally. He provides complete vestige lore, warns about specific dark gifts, reveals hidden areas, and can assist with the reversal ritual."
  - type: state_update
    locationId: amber-temple
    stateChanges:
      exethanter_memory_restored: true
      guardian_alliance: true
```

**Consequences**:
- Exethanter provides crucial information
- Reveals hidden laboratory location
- Grants blessing: advantage on saves to resist dark gifts
- Will assist with reversal ritual (grants advantage on Constitution saves)
- May reveal his phylactery location and ask for permanent death

---

### Event: Confronting Strahd's Origin
```yaml
eventId: vampyr_revelation
name: "The Source of Strahd's Curse"
trigger_type: conditional
trigger_conditions:
  - type: approach_vampyr_sarcophagus
    value: true
effects:
  - type: atmosphere
    description: "The largest sarcophagus pulses with malevolent power. The voice that emanates is not a whisper but a command: 'I am Vampyr. I created the first vampire. I cursed Strahd von Zarovich. I can make you greater than he ever was. Accept my gift. Become eternal.'"
  - type: custom
    description: "Examining Vampyr's sarcophagus reveals crucial lore: This vestige is the source of vampirism itself. Strahd accepted this dark gift centuries ago, becoming the land's first vampire. The party now understands Strahd's origin—and faces the same choice he did."
  - type: state_update
    locationId: amber-temple
    stateChanges:
      strahd_origin_discovered: true
      vampyr_encountered: true
```

**Consequences**:
- Reveals Strahd's backstory
- Offers same gift Strahd accepted (become a vampire)
- Creates dramatic parallel: Will party make Strahd's mistake?
- If accepted: Character becomes vampire, potentially rivals Strahd
- Ultimate temptation for desperate parties

---

## Recurring Events

### Event: Undead Patrols
```yaml
eventId: catacombs_undead_patrol
name: "The Dead Still Guard"
trigger_type: recurring
recurrence: hourly
location: catacombs
effects:
  - type: potential_combat
    encounterDetails:
      enemies:
        - type: wight
          cr: 3
          count: 1d3
        - type: mummy
          cr: 3
          count: 1d2
      probability: 0.4
  - type: atmosphere
    description: "Shambling footsteps echo through the catacombs. The risen dead patrol their ancient duties, attacking all living intruders."
```

**Consequences**:
- Regular encounters in catacombs
- Encourages avoiding prolonged exploration of lower levels
- Undead drop minimal treasure but guard access to Vilnius's chamber

---

## Notes for Epic 2 Integration

All events conform to EventScheduler schema:
- `eventId`: Unique identifier
- `name`: Display name
- `trigger_type`: date_time, conditional, recurring, location
- `trigger_conditions`: Array of conditions
- `effects`: Array of effects (combat_encounter, state_update, atmosphere, damage, affliction, etc.)

**Amber Temple Event Design**:
1. **Moral Challenges**: Dark gifts create meaningful player choices
2. **Environmental Pressure**: Cold and psychic damage encourage efficient exploration
3. **Boss Encounters**: Multiple CR 12-15 encounters (arcanaloth, Vilnius, optional Exethanter)
4. **Redemption Path**: Reversal ritual provides hope for corrupted characters
5. **Lore Revelation**: Strahd's origin story, vestige nature, temple purpose

**Integration with Campaign**:
- Dark gifts tempt desperate parties (those feeling under-powered for Strahd)
- Exethanter provides crucial ally if treated with compassion
- Vault treasure and Tarokka artifacts provide power-ups for final confrontation
- Accepting dark gifts creates dramatic consequences (corruption, mutations, potential transformation into monsters)

EventExecutor applies effects to State.md via StateManager, tracking corruption levels, dark gifts accepted, and temple exploration progress.
