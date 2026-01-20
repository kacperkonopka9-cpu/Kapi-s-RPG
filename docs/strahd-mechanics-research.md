# Strahd von Zarovich - Custom Mechanics Research

**Date:** 2025-11-10
**Purpose:** Identify custom mechanics needed for Strahd (Story 4-17)
**Challenge Rating:** 15 (13,000 XP)
**Epic 3 Compatibility:** Requires extensions to Combat Manager

---

## Executive Summary

Strahd von Zarovich is a **legendary creature** requiring custom mechanics beyond standard Epic 3 systems:

**Requires New Systems:**
1. **Legendary Actions** (3 per round)
2. **Lair Actions** (initiative count 20)
3. **Regional Effects** (permanent magic around Castle Ravenloft)
4. **Charm Mechanics** (vampiric charm, not standard condition)
5. **Children of the Night** (summon wolves/bats/rats)
6. **Shapechanger** (bat, wolf, mist forms)
7. **Spider Climb** (move on walls/ceilings)
8. **Vampire Weaknesses** (sunlight, running water, stake through heart)

**Epic 3 Systems That Work:**
- ✅ Spellcasting (9th level wizard spells) → Epic 3 SpellManager
- ✅ Regeneration → HP Manager with custom rule
- ✅ Legendary Resistance (3/day) → Track as special ability
- ✅ Multiattack → CombatManager can handle

---

## Strahd Stat Block (D&D 5e Official)

### Basic Stats

| Attribute | Value |
|-----------|-------|
| **Size** | Medium undead (shapechanger) |
| **Armor Class** | 16 (natural armor) |
| **Hit Points** | 144 (17d8 + 68) |
| **Speed** | 30 ft., climb 30 ft. |

### Ability Scores

| STR | DEX | CON | INT | WIS | CHA |
|-----|-----|-----|-----|-----|-----|
| 18 (+4) | 18 (+4) | 18 (+4) | 20 (+5) | 15 (+2) | 18 (+4) |

### Saves & Skills

- **Saving Throws:** Dex +9, Wis +7, Cha +9
- **Skills:** Arcana +15, Perception +12, Religion +10, Stealth +14
- **Damage Resistances:** Necrotic; Bludgeoning, Piercing, and Slashing from Nonmagical Attacks
- **Senses:** Darkvision 120 ft., passive Perception 22
- **Languages:** Abyssal, Common, Draconic, Elvish, Giant, Infernal
- **Challenge:** 15 (13,000 XP)

---

## Special Traits (Passive Abilities)

### 1. Shapechanger

**D&D 5e Rule:**
> If Strahd isn't in running water or sunlight, he can use his action to polymorph into a Tiny bat, a Medium wolf, or a Medium cloud of mist, or back into his true form. His statistics, other than his size and speed, are unchanged. He reverts to his true form if he dies.

**Implementation Notes:**
- Requires **transformation system** (not in Epic 3)
- Each form has different capabilities:
  - **Bat:** Fly 30 ft., Tiny size (stealth bonus), reduced threat
  - **Wolf:** Speed 50 ft., bite attack
  - **Mist:** Can't be damaged except by sunlight/running water, can pass through 1-inch cracks
- Transformation = bonus action or action (varies by form)
- Used for **escape** (mist form), **pursuit** (wolf form), or **spying** (bat form)

**Epic 4 Implementation:**
- Add `currentForm` field to Strahd's NPC profile
- Custom combat action: "Change Form"
- Mist form grants effective invulnerability + movement through barriers

---

### 2. Legendary Resistance (3/Day)

**D&D 5e Rule:**
> If Strahd fails a saving throw, he can choose to succeed instead.

**Implementation Notes:**
- Track uses per day (3 total, recharges at dusk)
- Can turn **any** failed save into success
- Critical for surviving high-DC spells (e.g., Banishment, Hold Monster)

**Epic 4 Implementation:**
- Add to `specialAbilities` in NPC profile:
```yaml
- name: "Legendary Resistance (3/Day)"
  uses: 3
  maxUses: 3
  recharge: "dusk"
```
- Combat Manager extension: Check after failed save, prompt if use

---

### 3. Misty Escape

**D&D 5e Rule:**
> When Strahd drops to 0 hit points outside his coffin, he transforms into a cloud of mist (as in the Shapechanger trait) instead of falling unconscious, provided that he isn't in running water or sunlight. If he can't transform, he is destroyed.
>
> While he has 0 hit points in mist form, he can't revert to his vampire form, and he must reach his coffin within 2 hours or be destroyed. Once in his coffin, he reverts to his vampire form. He is then paralyzed until he regains at least 1 hit point. After 1 hour in his coffin with 0 hit points, he regains 1 hit point.

**Implementation Notes:**
- **Failsafe mechanic:** Strahd can't be killed outside his coffin
- When reduced to 0 HP:
  1. Transform to mist form
  2. Speed 30 ft. (can move through cracks)
  3. Must reach coffin in Castle Ravenloft within 2 hours
  4. Regenerates after 1 hour in coffin
- **Sunlight or running water** prevents this (kills Strahd instantly at 0 HP)

**Epic 4 Implementation:**
- HP Manager extension: Check location when reaching 0 HP
- If not in coffin + not in sunlight/water → mist escape
- EventScheduler: Register 2-hour deadline for coffin reach
- If reaches coffin: paralyzed, regenerate 1 HP after 1 hour

---

### 4. Regeneration

**D&D 5e Rule:**
> Strahd regains 20 hit points at the start of his turn if he has at least 1 hit point and isn't in running water or sunlight. If Strahd takes radiant damage or damage from holy water, this trait doesn't function at the start of his next turn.

**Implementation Notes:**
- **20 HP per turn** = extremely durable (720 HP over 36 turns!)
- Countered by:
  - Sunlight (Sunsword!)
  - Running water
  - Radiant damage (blocks regeneration for 1 turn)
  - Holy water (blocks regeneration for 1 turn)
- Makes Strahd nearly unkillable without radiant damage sources

**Epic 4 Implementation:**
- Combat Manager extension: At start of Strahd's turn, check conditions:
  - Has ≥ 1 HP?
  - Not in sunlight/running water?
  - Didn't take radiant damage last turn?
  - If all true → +20 HP (up to max 144)

---

### 5. Spider Climb

**D&D 5e Rule:**
> Strahd can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check.

**Implementation Notes:**
- Allows Strahd to use **3D combat space** in Castle Ravenloft
- Can attack from ceiling, walls, chandeliers
- No skill check needed
- Creates **tactical advantage** (surprise from above)

**Epic 4 Implementation:**
- Narrative description (no mechanical change needed)
- Combat Manager can note position: "Strahd attacks from the ceiling"

---

### 6. Vampire Weaknesses

**D&D 5e Rules:**

**Forbiddance:**
> Strahd can't enter a residence without an invitation from one of the occupants.

**Harmed by Running Water:**
> Strahd takes 20 acid damage if he ends his turn in running water.

**Stake to the Heart:**
> If a piercing weapon made of wood is driven into Strahd's heart while he is incapacitated in his coffin, he is paralyzed until the stake is removed.

**Sunlight Hypersensitivity:**
> Strahd takes 20 radiant damage when he starts his turn in sunlight. While in sunlight, he has disadvantage on attack rolls and ability checks.

**Implementation Notes:**
- **Forbiddance:** Roleplay only (players can use as protection)
- **Running water:** 20 acid damage/turn (bridges become tactical chokepoints)
- **Stake:** Must be incapacitated in coffin first (endgame mechanic)
- **Sunlight:** 20 damage/turn + disadvantage (Sunsword is critical!)

**Epic 4 Implementation:**
- Location metadata: `hasRunningWater: true` for river/stream locations
- Combat Manager: Check if Strahd in sunlight (Sunsword aura) → damage + disadvantage
- Special action: "Drive Stake" (only available when Strahd paralyzed in coffin)

---

## Actions (Standard + Legendary)

### Standard Actions

#### Unarmed Strike (Multiattack)

**D&D 5e:**
> Strahd makes two attacks, only one of which can be a bite attack.
>
> **Unarmed Strike:** Melee Weapon Attack: +9 to hit, reach 5 ft., one creature. Hit: 8 (1d8 + 4) bludgeoning damage. Instead of dealing damage, Strahd can grapple the target (escape DC 18).

#### Bite

**D&D 5e:**
> Melee Weapon Attack: +9 to hit, reach 5 ft., one willing creature, or a creature that is grappled by Strahd, incapacitated, or restrained. Hit: 7 (1d6 + 4) piercing damage plus 10 (3d6) necrotic damage. The target's hit point maximum is reduced by an amount equal to the necrotic damage taken, and Strahd regains hit points equal to that amount. The reduction lasts until the target finishes a long rest. The target dies if this effect reduces its hit point maximum to 0.

**Implementation Notes:**
- **Multiattack:** 2 attacks (max 1 bite)
- **Bite requires:** Grapple, incapacitated, or willing target
- **Bite drains max HP** (persistent until long rest)
- **Strahd heals** equal to necrotic damage dealt
- **Instant death** if max HP reduced to 0

**Epic 4 Implementation:**
- Combat Manager: Track grappled status
- Bite attack: Roll damage, reduce target max HP, heal Strahd
- HP Manager: Track max HP reduction (restore on long rest)

### Charm

**D&D 5e:**
> Strahd targets one humanoid he can see within 30 feet of him. If the target can see Strahd, the target must succeed on a DC 17 Wisdom saving throw against this magic or be charmed by Strahd. The charmed target regards Strahd as a trusted friend to be heeded and protected. Although the target isn't under Strahd's control, it takes Strahd's requests or actions in the most favorable way it can, and it is a willing target for Strahd's bite attack.
>
> Each time Strahd or his companions do anything harmful to the target, it can repeat the saving throw, ending the effect on itself on a success. Otherwise, the effect lasts 24 hours or until Strahd is destroyed, is on a different plane of existence than the target, or takes a bonus action to end the effect.

**Implementation Notes:**
- **DC 17 Wisdom save** (high for low-level parties)
- **Lasts 24 hours** (or until harmed)
- Charmed target becomes **willing bite victim**
- Can protect Strahd, give information, betray party
- **Powerful roleplay tool** for Strahd

**Epic 4 Implementation:**
- New condition: "Charmed by Strahd" (different from standard charmed)
- Save every time Strahd/allies harm target
- Duration: 24 hours (Epic 2 EventScheduler)
- AI Guidance: Charmed NPCs act as Strahd's agents

### Children of the Night (1/Day)

**D&D 5e:**
> Strahd magically calls 2d4 swarms of bats or swarms of rats, provided that the sun isn't up. While outdoors, Strahd can call 3d6 wolves instead. The called creatures arrive in 1d4 rounds, acting as allies of Strahd and obeying his spoken commands. The beasts remain for 1 hour, until Strahd dies, or until he dismisses them as a bonus action.

**Implementation Notes:**
- **Summons minions:** Bats/rats (indoors), wolves (outdoors)
- Arrive in 1-4 rounds (not instant)
- Obey commands, last 1 hour
- **1/day limit** (powerful but finite)
- Used for **swarm tactics** or **escape cover**

**Epic 4 Implementation:**
- Combat action: "Children of the Night"
- Roll summons: 2d4 swarms or 3d6 wolves
- EventScheduler: Register arrival in 1d4 rounds
- CombatManager: Add minions to initiative when they arrive

---

## Legendary Actions (3 Per Round)

**D&D 5e:**
> Strahd can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. Strahd regains spent legendary actions at the start of his turn.

### Move (Cost: 1)

> Strahd moves up to his speed without provoking opportunity attacks.

**Tactical Use:** Reposition, escape melee, reach cover

### Unarmed Strike (Cost: 1)

> Strahd makes one unarmed strike.

**Tactical Use:** Extra attack between turns

### Bite (Cost: 2)

> Strahd makes one bite attack.

**Tactical Use:** Drain HP maximum, heal self

**Implementation Notes:**
- Strahd gets **3 legendary actions per round**
- Can act on **other creatures' turns** (major advantage!)
- Regains at start of his turn
- **Bite costs 2 actions** (worth it for healing + HP drain)

**Epic 4 Implementation:**
- Combat Manager extension: Track legendary action pool (3/round)
- After each creature's turn (not Strahd's), prompt: "Use legendary action?"
- Reset pool at Strahd's turn start

---

## Lair Actions (Initiative Count 20)

**D&D 5e:**
> On initiative count 20 (losing initiative ties), Strahd can take a lair action to cause one of the following effects; Strahd can't use the same effect two rounds in a row:

### 1. Solid Fog

> Until initiative count 20 on the next round, Strahd creates an area of fog (as in the *fog cloud* spell) that fills a 20-foot cube within 120 feet of him. The fog spreads around corners and is heavily obscured.

### 2. Pass Through Walls

> Until initiative count 20 on the next round, Strahd can pass through solid walls, doors, ceilings, and floors as if they weren't there.

### 3. Control Doors/Portcullis

> Strahd causes one door or window he can see to either open or close or causes a portcullis to either lower or rise. If someone or something is in the path of a descending portcullis, it deals 10 (3d6) bludgeoning damage and stops descending.

**Implementation Notes:**
- **Initiative count 20:** Lair acts before most creatures
- Different effect each round (can't repeat)
- Only works **inside Castle Ravenloft** (his lair)
- **Fog:** Blocks vision, advantage/disadvantage mechanics
- **Pass through walls:** Makes Strahd nearly impossible to corner
- **Control terrain:** Trap players, separate party, block escape

**Epic 4 Implementation:**
- Combat Manager extension: Add "Lair" pseudo-combatant at initiative 20
- Track which lair action used (can't repeat)
- Only trigger if `location.isInCastleRavenloft === true`

---

## Spellcasting

**D&D 5e:**
> Strahd is a 9th-level spellcaster. His spellcasting ability is Intelligence (spell save DC 18, +10 to hit with spell attacks). Strahd has the following wizard spells prepared:

**Prepared Spells:**
- **Cantrips (at will):** *mage hand*, *prestidigitation*, *ray of frost*
- **1st level (4 slots):** *comprehend languages*, *fog cloud*, *sleep*
- **2nd level (3 slots):** *detect thoughts*, *gust of wind*, *mirror image*
- **3rd level (3 slots):** *animate dead*, *fireball*, *nondetection*
- **4th level (3 slots):** *blight*, *greater invisibility*, *polymorph*
- **5th level (1 slot):** *animate objects*, *scrying*

**Implementation Notes:**
- **9th-level wizard** (Epic 3 SpellManager compatible!)
- **Spell save DC 18** (very high, hard for low-level parties)
- **+10 to hit** with spell attacks
- Key spells:
  - **Greater Invisibility:** Advantage on attacks, can't be seen
  - **Polymorph:** Turn ally into beast
  - **Animate Dead:** Create zombie/skeleton minions
  - **Fireball:** 8d6 damage, area effect
  - **Scrying:** Spy on players from anywhere

**Epic 4 Implementation:**
- ✅ **Compatible with Epic 3 SpellManager (Story 3-7)**
- Load Strahd's prepared spells from spell database
- Track spell slots (restore on long rest)
- Use existing spellcasting mechanics

---

## Regional Effects (Permanent Magic)

**D&D 5e:**
> The region containing Strahd's lair is warped by his magic, creating the following effects:

1. **Fog:** The land within 6 miles of the castle is heavily obscured by fog.
2. **Vermin:** Rodents and bats serve as Strahd's eyes and ears.
3. **Zombies:** Dead creatures have a chance to rise as undead.

**Implementation Notes:**
- **Passive effects** (not combat mechanics)
- Fog = atmosphere, random encounters
- Vermin = Strahd always knows party location (roughly)
- Zombies = justifies random undead encounters

**Epic 4 Implementation:**
- Location metadata: `regionalEffects: ["fog", "undead_rising"]`
- AI DM guidance: "Strahd is always vaguely aware of party movements"
- Random encounter tables include zombies near Castle Ravenloft

---

## Combat Tactics (AI Behavior)

### Phase 1: Observation (Strahd watches from distance)

- Appear in bat form or mist
- Use Scrying spell to monitor party
- Send wolves/vampire spawn to test strength
- **Goal:** Assess threat level, identify weaknesses

### Phase 2: Psychological Warfare

- Appear to charm party members
- Make cryptic threats about Ireena
- Invite party to dinner at Castle Ravenloft
- **Goal:** Instill fear, gather information, sow distrust

### Phase 3: Direct Engagement (When threatened)

**Opening Round:**
- Use Greater Invisibility (advantage on all attacks)
- Spider Climb to ceiling for surprise
- Bite attack on isolated target

**Mid-Combat:**
- Use legendary actions to move and attack
- Charm strongest fighter (turn against party)
- Summon Children of the Night if outnumbered
- Use lair actions (fog, pass through walls)

**When Bloodied (<72 HP):**
- Cast Mirror Image (make hard to hit)
- Use regeneration (heal 20 HP/turn if no radiant damage)
- Retreat through walls if in lair

**Escape Threshold (<30 HP):**
- Transform to mist form
- Flee to coffin in Castle Ravenloft
- Use Misty Escape if reduced to 0 HP

### Castle Ravenloft Tactics (Lair Advantage)

- Use lair actions every round
- Pass through walls to ambush from behind
- Control doors to separate party
- Fog clouds to block vision
- Regenerate between encounters (20 HP/turn)

---

## Epic 4 Implementation Checklist

**Story 4-17: Strahd AI Behavior**

### Required New Systems:

- [ ] **Legendary Actions** (3/round, end of other creatures' turns)
- [ ] **Lair Actions** (initiative count 20, Castle only)
- [ ] **Shapechanger** (bat/wolf/mist forms with different stats)
- [ ] **Charm Mechanic** (DC 17 Wis save, 24-hour duration, willing bite victim)
- [ ] **Children of the Night** (summon bats/rats/wolves, 1/day)
- [ ] **Misty Escape** (0 HP → mist form, 2 hours to reach coffin)
- [ ] **Max HP Reduction** (bite attack drains max HP until long rest)
- [ ] **Sunlight Sensitivity** (20 radiant damage/turn + disadvantage)
- [ ] **Running Water Damage** (20 acid damage/turn)
- [ ] **Regeneration** (20 HP/turn, blocked by radiant damage)

### Compatible with Epic 3:

- [x] **Spellcasting** (9th-level wizard, use SpellManager)
- [x] **Multiattack** (2 attacks, CombatManager can handle)
- [x] **Legendary Resistance** (track as special ability with uses)
- [x] **Spider Climb** (narrative description, no mechanical change)

### AI Behavior Patterns:

- [ ] **Observation Phase** (watch from distance, spy with Scrying)
- [ ] **Testing Phase** (send minions to gauge strength)
- [ ] **Psychological Warfare** (charm, taunt, threaten Ireena)
- [ ] **Direct Engagement** (tactical combat with legendary/lair actions)
- [ ] **Retreat Logic** (mist escape <30 HP, coffin regeneration)

---

**Complexity Assessment:** **HIGH**
**Estimated Effort:** 8-12 hours for full Strahd implementation
**Dependencies:** Combat Manager extensions, new condition types, shapechanger system

**Recommendation:** Implement Strahd in phases:
1. **Basic Version:** Standard combat, spellcasting (use Epic 3 systems)
2. **Legendary Creature:** Add legendary actions, lair actions
3. **Full Strahd:** Shapechanger, charm, Children of the Night, AI behavior

This allows early testing while building complexity incrementally.
