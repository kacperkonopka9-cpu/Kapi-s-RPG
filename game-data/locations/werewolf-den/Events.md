# Werewolf Den - Events

## Discovery Events

### Event: Werewolf Pack Raids Krezk
```yaml
eventId: werewolf_raid_krezk
name: "Werewolves Attack Krezk Outskirts"
trigger_type: recurring
recurrence: weekly
times: ["23:00"]
effects:
  - type: state_update
    locationId: krezk
    stateChanges:
      werewolf_threat: high
      villagers_killed: +1d4
      livestock_stolen: +2d6
      fear_level: increasing
  - type: quest_trigger
    questId: werewolf_den_hunt
    questStatus: available
  - type: custom
    description: "Under cover of darkness, werewolves from the mountain den raid Krezk's outskirts. They kill livestock, terrorize villagers, and occasionally kidnap children. The raids create growing fear and desperation in the isolated mountain village."
```

**Consequences**:
- Krezk morale decreases with each raid
- Dmitri Krezkov becomes desperate for help
- Quest hook for party to investigate and stop raids
- If not stopped, Krezk becomes uninhabitable

---

## Combat Events

### Event: Assault the Werewolf Den
```yaml
eventId: den_assault
name: "Attack on the Werewolf Pack"
trigger_type: conditional
trigger_conditions:
  - type: player_enters_den
    with_hostile_intent: true
effects:
  - type: combat_encounter
    locationId: werewolf-den
    encounterDetails:
      name: "Werewolf Pack Battle"
      enemies:
        - npcId: kiril_stoyanovich
          cr: 5
          type: werewolf_alpha
        - type: werewolf
          cr: 3
          count: 6-8
      environment: cave_system
      difficulty: deadly
      special_mechanics:
        - immunity_to_non_silvered_weapons
        - pack_tactics_advantage
        - reinforcements_from_patrols
```

**Consequences**:
- Major combat with multiple CR 3 werewolves plus CR 5 alpha
- Silvered weapons or magic required to harm them
- Pack uses tactics: flanking, surrounding, coordinated attacks
- Children prisoners at risk during combat
- If party retreats, werewolves pursue with pack hunt

---

### Event: Leadership Challenge (Emil vs Kiril)
```yaml
eventId: pack_leadership_challenge
name: "Challenge for Pack Alpha"
trigger_type: conditional
trigger_conditions:
  - type: emil_freed
    value: true
  - type: party_supports_emil
    value: true
effects:
  - type: custom
    description: "Emil Toranescu challenges Kiril for leadership of the pack. By werewolf law, Kiril must accept. The two alphas face each other in hybrid form for a brutal duel to the death or submission. The pack watches, ready to follow whoever wins."
  - type: combat_encounter_special
    combatants:
      - emil_toranescu_vs_kiril_stoyanovich
    party_role: support_emil_or_remain_neutral
  - type: state_update
    locationId: werewolf-den
    stateChanges:
      leadership_challenge: active
      pack_morale: divided
```

**Consequences**:
- Emil is weakened from imprisonment—needs party support
- Party can aid Emil without breaking challenge rules
- Some pack members may support Emil, others Kiril
- If Emil wins: pack reforms, stops raids
- If Kiril wins: Emil dies, party must fight entire pack
- Zuleika joins Emil's side

---

## Resolution Events

### Event: Pack Reformed Under Emil
```yaml
eventId: pack_reformed
name: "Emil Restores Balance to the Pack"
trigger_type: conditional
trigger_conditions:
  - type: kiril_defeated
    value: true
  - type: emil_victorious
    value: true
effects:
  - type: quest_resolution
    questId: werewolf_threat
    outcome: success
    rewards:
      - xp: 1500
      - reputation: "Pack Reformers"
  - type: state_update
    locationId: werewolf-den
    stateChanges:
      pack_leader: emil_toranescu
      pack_alignment: neutral
      raids_on_krezk: ceased
      children_freed: true
  - type: state_update
    locationId: krezk
    stateChanges:
      werewolf_threat: eliminated
      village_morale: +3
      dmitri_grateful: true
  - type: custom
    description: "Emil assumes pack leadership and immediately enacts reforms. Kidnapped children are released. The pack will hunt only animals for survival and stay away from human settlements. Emil pledges the pack's neutrality in the conflict with Strahd, though they won't actively aid either side."
```

**Consequences**:
- Krezk saved from further raids
- Children returned to families
- Pack becomes neutral faction
- Emil provides mountain knowledge if asked
- Major reputation boost with Krezk
- Non-violent resolution option (mostly)

---

### Event: Pack Destroyed
```yaml
eventId: pack_eliminated
name: "The Werewolf Pack is Destroyed"
trigger_type: conditional
trigger_conditions:
  - type: all_of
    conditions:
      - kiril_defeated: true
      - emil_not_restored: true
      - pack_scattered_or_dead: true
effects:
  - type: quest_resolution
    questId: werewolf_threat
    outcome: success_violent
    rewards:
      - xp: 1200
  - type: state_update
    locationId: werewolf-den
    stateChanges:
      pack_eliminated: true
      den_abandoned: true
      children_freed: true
  - type: state_update
    locationId: krezk
    stateChanges:
      werewolf_threat: eliminated
      village_morale: +2
```

**Consequences**:
- Krezk saved but through violence
- Children rescued (if alive)
- Den becomes abandoned
- Potential for survivor werewolves seeking revenge
- Less elegant solution than reforming pack
- Keepers of the Feather note party's approach (violence vs. diplomacy)

---

## Prison Events

### Event: Free Emil
```yaml
eventId: emil_liberation
name: "Emil Toranescu is Freed"
trigger_type: conditional
trigger_conditions:
  - type: player_reaches_prison
    locationId: werewolf-den
  - type: bypasses_or_defeats_zuleika
    value: true
effects:
  - type: npc_status
    npcId: emil_toranescu
    status: freed
    disposition: grateful
  - type: quest_trigger
    questId: restore_emil_leadership
    questStatus: active
  - type: custom
    description: "Emil is freed from his prison. Weakened but determined, he offers to challenge Kiril for pack leadership if the party helps him. He swears to reform the pack and end the raids on Krezk if victorious."
```

**Consequences**:
- Opens path to non-violent resolution
- Emil needs party support in leadership challenge
- Zuleika likely joins Emil's side
- Pack becomes divided between Kiril and Emil loyalists
- Alternative to fighting entire pack

---

### Event: Rescue the Children
```yaml
eventId: children_liberation
name: "Kidnapped Children Rescued"
trigger_type: conditional
trigger_conditions:
  - type: player_reaches_children_prison
    locationId: werewolf-den
effects:
  - type: quest_progress
    questId: rescue_children
    progress: children_found
  - type: custom
    description: "You find three terrified children imprisoned in a cave chamber. They're malnourished and traumatized but alive. They beg for rescue and protection from the werewolves."
  - type: state_update
    locationId: werewolf-den
    stateChanges:
      children_located: true
```

**Consequences**:
- Children must be protected during escape
- Slow party movement
- If combat occurs, children at risk
- Successfully returning them earns Krezk gratitude
- Represents innocent stakes of mission

---

## Patrol Events

### Event: Werewolf Hunting Party Returns
```yaml
eventId: hunting_party_returns
name: "Pack Hunters Return to Den"
trigger_type: conditional
trigger_conditions:
  - type: time_of_day
    time: night
  - type: party_in_den
    value: true
effects:
  - type: reinforcements
    location: werewolf-den
    enemies:
      - type: werewolf
        count: 2-4
  - type: custom
    description: "Howls echo from outside the cave. A hunting party returns from their nightly prowl, carrying fresh kill. They discover intruders in their den and attack immediately."
```

**Consequences**:
- Reinforcements arrive mid-combat
- Makes den assault more dangerous at night
- Timing assault for when patrols are out is strategic
- Can be avoided by timing or stealth

---

## Environmental Events

### Event: Mountain Wolf Howls
```yaml
eventId: werewolf_howls
name: "Pack Communication Through Howls"
trigger_type: recurring
recurrence: nightly
times: ["21:00", "00:00", "03:00"]
effects:
  - type: atmosphere
    description: "Eerie howls echo across the mountains as the werewolf pack communicates. The sounds carry for miles, coordinating hunts and marking territory. Other predators fall silent when the werewolves howl."
```

**Consequences**:
- Atmospheric horror
- Indicates pack locations
- Warns party of werewolf activity
- Creates tension

---

## Notes for Epic 2 Integration

All events conform to EventScheduler schema (Epic 2):
- `eventId`: Unique identifier
- `name`: Display name
- `trigger_type`: date_time, conditional, recurring
- `trigger_conditions`: Array of conditions
- `effects`: Array of effects (npc_status, state_update, combat_encounter, quest_trigger, custom)

Werewolf Den events focus on:
1. Moral choice (reform vs. destroy pack)
2. Leadership challenge mechanics (Emil vs. Kiril)
3. Child rescue mission
4. Impact on Krezk settlement
5. Tactical combat (silvered weapons required)

Multiple resolution paths:
- Violent: Kill entire pack
- Diplomatic: Free Emil, support in challenge, reform pack
- Hybrid: Kill Kiril, negotiate with survivors
