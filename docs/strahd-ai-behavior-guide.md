# Strahd von Zarovich AI Behavior Guide for Dungeon Masters

**Version:** 1.0
**Last Updated:** 2025-11-16
**Campaign:** Curse of Strahd
**Epic:** 4 (Curse of Strahd Content Implementation)
**Story:** 4-17 (Strahd AI Behavior System)

---

## Table of Contents

1. [Introduction](#introduction)
2. [Strahd Overview](#strahd-overview)
3. [5-Phase Tactical System](#5-phase-tactical-system)
   - [Phase 1: Observation](#phase-1-observation)
   - [Phase 2: Testing](#phase-2-testing)
   - [Phase 3: Psychological Warfare](#phase-3-psychological-warfare)
   - [Phase 4: Engagement](#phase-4-engagement)
   - [Phase 5: Retreat and Reset](#phase-5-retreat-and-reset)
   - [Phase Transition Flowchart](#phase-transition-flowchart)
   - [Example Phase Progressions](#example-phase-progressions)
4. [Legendary Actions](#legendary-actions)
   - [Overview and Mechanics](#legendary-actions-overview)
   - [Move (Cost 1)](#legendary-action-move)
   - [Unarmed Strike (Cost 1)](#legendary-action-unarmed-strike)
   - [Bite (Cost 2)](#legendary-action-bite)
   - [Epic 3 Integration](#legendary-actions-epic-3-integration)
   - [Tactical Decision Tree](#legendary-actions-tactical-decision-tree)
   - [Sample Combat Rounds](#legendary-actions-sample-combat-rounds)
5. [Lair Actions](#lair-actions)
   - [Overview and Mechanics](#lair-actions-overview)
   - [Solid Fog](#lair-action-solid-fog)
   - [Pass Through Walls](#lair-action-pass-through-walls)
   - [Control Doors and Gates](#lair-action-control-doors)
   - [Epic 3 Integration](#lair-actions-epic-3-integration)
   - [Tactical Synergies](#lair-actions-tactical-synergies)
   - [Sample Combat Rounds](#lair-actions-sample-combat-rounds)
6. [Vampire Mechanics](#vampire-mechanics)
   - [Regeneration](#vampire-regeneration)
   - [Charm](#vampire-charm)
   - [Children of the Night](#vampire-children-of-the-night)
   - [Shapechanger](#vampire-shapechanger)
   - [Misty Escape](#vampire-misty-escape)
   - [Sunlight Sensitivity](#vampire-sunlight-sensitivity)
   - [Running Water Damage](#vampire-running-water-damage)
   - [Spider Climb](#vampire-spider-climb)
7. [Combat Tactics and Spell Selection](#combat-tactics-and-spell-selection)
   - [Opening Round Tactics](#opening-round-tactics)
   - [Mid-Combat Tactics](#mid-combat-tactics)
   - [When Bloodied (<72 HP)](#bloodied-tactics)
   - [Escape Threshold (<30 HP)](#escape-threshold)
   - [Spell Selection by Category](#spell-selection-by-category)
   - [Legendary Action Patterns](#legendary-action-patterns)
   - [Lair Action Synergies with Spells](#lair-spell-synergies)
   - [Retreat Conditions and Decision Logic](#retreat-conditions)
8. [Psychological Warfare](#psychological-warfare)
   - [Charm and Domination](#psychological-charm-domination)
   - [Nightmares and Dream Manipulation](#psychological-nightmares)
   - [Kidnapping Tactics](#psychological-kidnapping)
   - [Strategic Murders](#psychological-murders)
   - [Taunts and Psychological Games](#psychological-taunts)
   - [Strahd's Personality Integration](#strahds-personality)
   - [DM Guidance](#psychological-dm-guidance)
   - [Example Scenarios](#psychological-examples)
9. [Epic 3 Integration](#epic-3-integration)
   - [CharacterManager Integration](#integration-character-manager)
   - [CombatManager Integration](#integration-combat-manager)
   - [SpellcastingModule Integration](#integration-spellcasting)
   - [HP Manager Integration](#integration-hp-manager)
   - [ConditionTracker Integration](#integration-condition-tracker)
   - [DiceRoller Integration](#integration-dice-roller)
   - [Integration Notes Table](#integration-notes-table)
10. [DM Tools and Guidance](#dm-tools-and-guidance)
11. [Epic 5 Enhancement Recommendations](#epic-5-recommendations)
12. [Appendices](#appendices)
    - [Quick Reference Tables](#quick-reference-tables)
    - [Strahd NPC Profile Reference](#strahd-npc-reference)
    - [Additional Resources](#additional-resources)

---

## Introduction

### Purpose and Scope

This guide provides comprehensive AI behavior documentation for running Strahd von Zarovich, the legendary vampire lord of Barovia, as a tactically intelligent and dramatically satisfying villain in your Curse of Strahd campaign. It is designed for Dungeon Masters using the **Kapi's RPG** system with **Epic 3 (D&D 5e Mechanics Integration)** modules.

**What This Guide Covers:**
- **5-Phase Tactical System**: Observation, Testing, Psychological Warfare, Engagement, Retreat
- **Legendary Actions**: 3 actions per round with tactical guidance
- **Lair Actions**: Initiative count 20 battlefield control in Castle Ravenloft
- **Vampire Mechanics**: Regeneration, Charm, Misty Escape, Shapechanger, and more
- **Combat Tactics**: Spell selection, legendary/lair action synergies, retreat conditions
- **Psychological Warfare**: Intimidation, manipulation, and long-term torment
- **Epic 3 Integration**: How to use existing game systems with Strahd
- **DM Guidance**: Pacing, intensity management, narrative considerations

**What This Guide Does NOT Cover:**
- Strahd's complete stat block (see `game-data/npcs/strahd_von_zarovich.yaml`)
- Story and lore details (see Curse of Strahd campaign book)
- Castle Ravenloft location details (see `game-data/locations/castle-ravenloft/`)
- Epic 5 automation features (see "Epic 5 Enhancement Recommendations" section)

### Epic 3 Compatibility

This guide is designed to work with the **existing Epic 3 (D&D 5e Mechanics Integration)** systems without requiring code modifications. All legendary creature mechanics, lair actions, and vampire abilities are documented for **DM adjudication** using Epic 3's:

- **CharacterManager** (Story 3-2): Loads Strahd NPC profile
- **CombatManager** (Story 3-5): Handles combat encounters
- **SpellcastingModule** (Story 3-7): Manages 9th-level wizard spells
- **HP Manager** (Story 3-11): Tracks HP, regeneration, max HP reduction
- **ConditionTracker** (Story 3-12): Custom "Charmed by Strahd" condition
- **DiceRoller** (Story 3-1): All attack rolls, damage, saving throws

Epic 5 (LLM-DM Integration) will deliver automation for legendary actions, lair actions, and phase tracking. See the "Epic 5 Enhancement Recommendations" section for future capabilities.

### Content-First Approach

Per **Epic 4 (Curse of Strahd Content Implementation)** design philosophy:
- This guide delivers **DOCUMENTATION ONLY** - no code modifications
- All mechanics are defined in Strahd's NPC profile YAML (`game-data/npcs/strahd_von_zarovich.yaml`)
- DM uses this guide as reference during gameplay with Epic 3 systems
- Epic 5 will automate tracking, prompts, and decision support

### How to Use This Guide

1. **Before the Campaign**: Read the entire guide to understand Strahd's capabilities and tactical phases
2. **Session Prep**: Review the current tactical phase and plan Strahd's actions
3. **During Combat**: Reference legendary actions, lair actions, and spell selection guidance
4. **Between Sessions**: Plan psychological warfare tactics and phase transitions
5. **Post-Encounter**: Update Strahd's state (HP, spell slots, legendary resistance uses, current phase)

**DM Tip:** This guide provides recommendations, not absolute rules. Adjust Strahd's behavior for narrative needs, party balance, and dramatic pacing.

---

## Strahd Overview

### The Villain

**Strahd von Zarovich** is the ancient vampire lord of Barovia, cursed to rule the land eternally while pining for the reincarnation of his lost love, Tatyana (now Ireena Kolyana). He is **CR 15**, making him one of the most dangerous villains in D&D 5e.

**Key Characteristics:**
- **Legendary Creature**: 3 legendary actions per round (Move, Unarmed Strike, Bite)
- **Lair Actions**: Battlefield control at initiative count 20 (Castle Ravenloft only)
- **9th-Level Wizard**: Spell save DC 18, +10 to hit, access to powerful control and damage spells
- **Vampire Lord**: Regeneration (20 HP/turn), Charm (DC 17), Misty Escape, Shapechanger
- **Tactical Genius**: 5-phase approach from observation to psychological warfare to engagement
- **Obsessed**: Prioritizes Ireena's safety above all else

### Challenge Rating 15

Strahd is designed to be a **campaign-spanning threat**, not a single encounter. A well-played Strahd can defeat most parties in direct combat at levels 1-7. The 5-phase tactical system ensures Strahd engages appropriately based on party strength and campaign progression.

**Expected Party Levels by Phase:**
- **Phase 1 (Observation)**: Levels 1-3 (Strahd watches from afar, no direct engagement)
- **Phase 2 (Testing)**: Levels 3-5 (Hit-and-run attacks, vampire spawn probes, charm attempts)
- **Phase 3 (Psychological Warfare)**: Levels 5-7 (Kidnapping, murders, nightmares, taunts)
- **Phase 4 (Engagement)**: Levels 7-10 (Full combat in Castle Ravenloft with all abilities)
- **Phase 5 (Retreat and Reset)**: Triggered by Misty Escape or tactical retreat

### Campaign Role

Strahd is the **central antagonist** of Curse of Strahd. He should be:
- **Omnipresent**: Players should feel Strahd's influence even when he's not physically present
- **Unpredictable**: Mix direct combat, psychological warfare, and social encounters
- **Fair but Deadly**: Give players chances to escape, but punish overconfidence ruthlessly
- **Obsessed with Ireena**: Prioritize capturing Ireena alive, avoid killing her at all costs
- **Bored and Curious**: Strahd seeks "worthy opponents" to relieve centuries of boredom

**DM Tip:** Strahd should appear 3-5 times before the final confrontation. Early appearances should be non-lethal (Testing Phase), building tension for the inevitable showdown in Castle Ravenloft.

---

## 5-Phase Tactical System

Strahd's AI behavior follows a **5-phase tactical system** that evolves based on party strength, campaign progression, and Strahd's objectives. Each phase has specific trigger conditions, objectives, and tactical approaches.

### Phase Progression Overview

```
Phase 1: Observation (Levels 1-3)
  └─> Party encounters first location/Ireena
      └─> Phase 2: Testing (Levels 3-5)
          └─> Party shows combat capability OR 1+ artifacts acquired
              └─> Phase 3: Psychological Warfare (Levels 5-7)
                  └─> Party enters Castle Ravenloft OR 2+ artifacts acquired
                      └─> Phase 4: Engagement (Levels 7-10)
                          └─> Strahd reduced to 0 HP (Misty Escape)
                              └─> Phase 5: Retreat and Reset
                                  └─> Returns to Phase 2 or 3 after regeneration
```

---

## Phase 1: Observation

### Trigger Conditions

**Phase 1 begins when:**
- Party enters Barovia for the first time
- Party has not yet engaged Strahd directly
- Party is levels 1-3 (low threat level)

**Phase 1 ends when:**
- Party reaches level 3+
- Party completes first major quest (e.g., St. Andral's Feast, Death House)
- Party acquires first artifact (Sunsword, Holy Symbol, Tome of Strahd)
- Strahd has observed the party for 1-3 encounters

### Objectives

1. **Gather Intelligence**: Learn party composition, capabilities, tactics, weaknesses
2. **Assess Threat Level**: Determine if party poses genuine danger or can be ignored
3. **Identify Ireena's Status**: Locate Ireena, observe her relationship with the party
4. **Establish Presence**: Let party know they are being watched (create paranoia)

### Actions and Tactics

**Direct Actions:**
- **Scrying**: Use *scrying* spell to observe party from Castle Ravenloft (no concentration, 10-minute duration)
- **Bat Form Surveillance**: Transform into bat, follow party at distance (passive Perception DC 20 to notice)
- **Wolf Spy Network**: Dire wolves and wolf packs report party movements to Strahd
- **Dream Haunting**: Brief nightmares hinting at Strahd's interest (narrative only, not mechanical)

**Indirect Actions:**
- **Vampire Spawn Reports**: Spawn encounter party briefly, retreat, report findings
- **NPC Manipulation**: Charm NPCs to gather information about party's intentions
- **Environmental Clues**: Leave signs of Strahd's presence (wolves howling, mist thickening, ravens watching)

**Strahd Tactics:**
- **Avoid Direct Combat**: Strahd does not engage in combat during Phase 1
- **Maximum Stealth**: Use bat form, scrying, and minions to avoid detection
- **Brief Appearances**: If party is in danger, Strahd may appear dramatically to observe their response (then vanish)
- **Psychological Setup**: Plant seeds of fear and curiosity for future phases

### Duration

**Typical Duration**: 1-3 encounters or 2-4 sessions

**End Triggers:**
- Party levels to 3+
- Party shows unexpected strength (defeats vampire spawn easily, clever tactics)
- Party finds artifact
- DM decides party is ready for direct engagement

### DM Notes

**Pacing Guidance:**
- Don't rush Phase 1. Let players establish themselves in Barovia before Strahd engages.
- Use this phase to establish atmosphere and dread.
- Players should know they're being watched but not know when Strahd will strike.

**Roleplay Guidance:**
- Strahd is curious but dismissive during Phase 1. "Amusing mortals, but hardly worthy opponents."
- If Strahd appears briefly, he should be polite, almost charming, but clearly superior.
- Example line: "Welcome to my land. I trust you find your stay... enlightening. We shall speak again soon."

**Transition to Phase 2:**
- When transitioning, Strahd shifts from passive observation to active testing.
- Signal the transition with a direct challenge: vampire spawn attack, Strahd's first charm attempt, or brief combat encounter.

---

## Phase 2: Testing

### Trigger Conditions

**Phase 2 begins when:**
- Party reaches level 3+
- Party has demonstrated combat capability (defeated vampire spawn, completed major quest)
- Phase 1 observation is complete
- Strahd wants to test party's strength without lethal commitment

**Phase 2 ends when:**
- Party reaches level 5+
- Party acquires 1+ artifacts
- Strahd has confirmed party's threat level (low, moderate, or high)
- Party survives 2-3 Testing Phase encounters

### Objectives

1. **Measure Combat Prowess**: Test party's damage output, defenses, tactics, teamwork
2. **Identify Key Threats**: Determine which party members are most dangerous (spellcasters, artifact wielders, tacticians)
3. **Test Artifact Defenses**: If party has artifacts, gauge their effectiveness against Strahd
4. **Establish Dominance**: Demonstrate that Strahd can engage and disengage at will (psychological advantage)
5. **Charm One PC**: Attempt to turn one party member into an informant or sleeper agent

### Actions and Tactics

**Direct Combat Actions:**
- **Hit-and-Run Attacks**: Strahd attacks with 1-2 legendary actions per round, then retreats (does not commit to prolonged fight)
- **Legendary Actions Focus**: Use legendary actions to harass party between turns (Move to avoid attacks, Unarmed Strike for damage)
- **Spell Selection**: Use utility and control spells (*greater invisibility*, *mirror image*, *polymorph*), not lethal damage spells
- **Vampire Spawn Probes**: Send 1-3 vampire spawn to attack party while Strahd observes from bat form or *invisibility*

**Charm Attempts:**
- **Target Selection**: Choose strongest fighter, most loyal companion, or character with lowest Wisdom save
- **Charm DC 17 Wisdom Save**: On failed save, target is charmed for 24 hours (willing bite victim, follows Strahd's simple commands)
- **Long-Term Goal**: Charmed PC becomes informant, saboteur, or bait for future phases

**Retreat Conditions:**
- Strahd retreats before taking **40+ damage** in a single encounter
- Strahd retreats if party demonstrates unexpected strength (hits with *sunlight*, uses artifact effectively, clever tactics)
- Strahd always retreats on his terms (use legendary actions to Move away, then bat form or *greater invisibility*)

### Legendary Action Usage (Testing Phase)

**Focus on Mobility:**
- **Move (Cost 1)**: Use 2-3 times per round to stay at range, avoid opportunity attacks, reposition for spell attacks
- **Unarmed Strike (Cost 1)**: Use 0-1 times per round to probe defenses (only if safely in melee)
- **Bite (Cost 2)**: Generally avoid Bite during Testing Phase (too lethal, reveals vampire nature)

**Sample Round:**
- Strahd's Turn: Cast *greater invisibility*, Move 30 ft
- After PC 1's Turn: Legendary Action - Move 30 ft (stay out of melee range)
- After PC 2's Turn: Legendary Action - Move 30 ft (circle around party)
- After PC 3's Turn: Legendary Action - Unarmed Strike +9 melee against isolated PC (1d8 damage)
- After PC 4's Turn: No legendary action remaining
- Strahd's Next Turn: Assess damage taken, retreat if >40 HP total

### Duration

**Typical Duration**: 2-3 encounters or 3-5 sessions

**End Triggers:**
- Party reaches level 5+
- Party acquires first artifact
- Strahd has gathered sufficient intelligence to plan Psychological Warfare phase
- Party demonstrates they are a legitimate threat (or not worth further attention)

### DM Notes

**Pacing Guidance:**
- Testing Phase encounters should be **challenging but winnable**. Party should feel threatened but not overwhelmed.
- Strahd should retreat before being killed, preserving his mystique and superiority.
- Space encounters 1-2 sessions apart to build tension.

**Roleplay Guidance:**
- Strahd is **amused and curious** during Testing Phase. "Ah, you have some skill. Let us see how much."
- If party damages Strahd significantly, he should be impressed but not alarmed: "Well done. I shall remember this."
- If party flees, Strahd should mock but not pursue lethally: "Run, little mice. I shall find you when I wish."

**Transition to Phase 3:**
- After sufficient testing, Strahd shifts to **psychological warfare** to break party's morale.
- Signal the transition with a non-combat event: charmed PC betrayal, NPC murder, kidnapping attempt, or ominous letter.

---

## Phase 3: Psychological Warfare

### Trigger Conditions

**Phase 3 begins when:**
- Party reaches level 5+
- Strahd has completed Testing Phase and knows party's capabilities
- Strahd wants to demoralize the party before engagement
- Party has not yet entered Castle Ravenloft for final confrontation

**Phase 3 ends when:**
- Party enters Castle Ravenloft (K1-K90 locations)
- Party acquires 2+ artifacts
- Party reaches level 7+ and forces direct engagement
- Strahd decides party is sufficiently demoralized or too strong to toy with

### Objectives

1. **Break Party Morale**: Create despair, paranoia, and distrust among party members
2. **Divide the Party**: Turn allies against each other via charm, domination, or manipulation
3. **Demonstrate Omnipotence**: Show that Strahd can strike anywhere, anytime, at anyone
4. **Capture Ireena**: Primary goal - separate Ireena from party, bring her to Castle Ravenloft
5. **Eliminate Threats**: Kill or neutralize particularly dangerous party members (artifact wielders, clerics, paladins)

### Actions and Tactics

This phase focuses on **non-combat psychological attacks** rather than direct confrontation. See the "Psychological Warfare" section below for detailed tactics.

**Primary Tactics:**
- **Charm and Domination**: Use *charm* and *dominate monster* to turn party members against each other
- **Nightmares**: Invade dreams with terrifying visions (narrative, not mechanical)
- **Kidnapping**: Abduct Ireena, allies, or loved NPCs while party sleeps or is distracted
- **Strategic Murders**: Kill NPCs the party cares about (Ismark, Father Lucian, Arabelle) in brutal, public ways
- **Taunts**: Leave letters, prophecies, or riddles that taunt the party's failures

**Combat Actions (If Forced):**
- Strahd avoids combat during Phase 3 unless cornered or protecting an objective (e.g., Ireena capture)
- If combat occurs, use Testing Phase tactics with full legendary actions (3/round)
- Retreat immediately if party demonstrates artifact power or coordinated tactics

### Duration

**Typical Duration**: 3-5 encounters or 4-6 sessions

**End Triggers:**
- Party enters Castle Ravenloft
- Party acquires 2+ artifacts (Strahd shifts to defensive Engagement Phase)
- Party's morale breaks (DM judgment - party may flee Barovia or seek final confrontation out of desperation)
- DM decides it's time for final confrontation

### DM Notes

**Pacing Guidance:**
- **Do not overuse** Psychological Warfare tactics. One major event per 1-2 sessions.
- Balance horror with hope - party should feel tormented but not hopeless.
- If party morale is too low, provide a "win" (rescue NPC, thwart Strahd's plan, acquire artifact).

**Roleplay Guidance:**
- Strahd is **cruel and aristocratic** during Psychological Warfare. "You amuse me, but you are insects beneath my notice."
- Strahd's letters should be eloquent and menacing: "I have taken your friend. Come to my castle if you dare. Or flee like cowards. Either way, you will know despair."
- If party confronts Strahd, he should be dismissive: "You think you can stop me? I am the land. I am eternal. You are... transient."

**Transition to Phase 4:**
- When party enters Castle Ravenloft or forces final confrontation, shift to Engagement Phase.
- Signal transition with dramatic event: Strahd's formal invitation to Castle Ravenloft, Tarokka reading revelation, or artifact discovery.

---

## Phase 4: Engagement

### Trigger Conditions

**Phase 4 begins when:**
- Party enters Castle Ravenloft (K1-K90 locations)
- Party acquires 2+ artifacts (Sunsword, Holy Symbol, Tome of Strahd)
- Party reaches level 7+ and seeks final confrontation
- Strahd decides the time for games is over

**Phase 4 ends when:**
- Strahd is reduced to 0 HP and triggers Misty Escape
- Party is defeated (TPK or retreat)
- Strahd achieves primary objective (capture Ireena, kill all artifact wielders)

### Objectives

1. **Defend Castle Ravenloft**: Strahd fights to protect his lair and destroy intruders
2. **Kill Artifact Wielders**: Prioritize party members with Sunsword, Holy Symbol, or Tome
3. **Capture Ireena**: If present, capture Ireena alive at all costs (even if it means tactical retreat)
4. **Demonstrate Full Power**: Use all legendary actions, lair actions, spells, and vampire abilities without restraint
5. **Destroy or Demoralize**: Kill party or break them utterly so they never return

### Actions and Tactics

**This is full-scale combat.** Strahd uses ALL abilities without holding back:

**Opening Round:**
- **Cast *Greater Invisibility*** (4th-level spell, 1 minute duration, concentration)
- **Spider Climb to ceiling** (60 ft climb speed, position for surprise attack)
- **Focus spellcasters first** (they have lowest AC, highest threat)

**Mid-Combat:**
- **Use all 3 legendary actions per round** (Move for repositioning, Bite for healing if grappled target available)
- **Activate lair actions at initiative 20** (Solid Fog, Pass Through Walls, Control Doors - see Lair Actions section)
- **Charm key threats** (DC 17 Wisdom save - target strongest fighter or artifact wielder)
- **Summon Children of the Night** (1/day ability - 2d4 swarm of bats or 3d6 wolves arrive in 1d4 rounds)

**When Bloodied (<72 HP):**
- **Cast *Mirror Image*** (2nd-level spell, 1 minute duration, 3 duplicates)
- **Retreat through walls** (if in Castle Ravenloft, use Pass Through Walls lair action or *etherealness* spell)
- **Rely on regeneration** (20 HP/turn at start of Strahd's turn, blocked by radiant damage)

**Escape Threshold (<30 HP):**
- **Transform to mist form** (action, fly speed 20 ft, can't take actions except Dash)
- **Flee to coffin** (K86 crypt in Castle Ravenloft basement, 2-hour deadline)
- **Trigger Misty Escape** (if reduced to 0 HP, automatically transform to mist unless in sunlight or running water)

### Legendary Action Usage (Engagement Phase)

**Aggressive and Adaptive:**
- **Move (Cost 1)**: Reposition to avoid area effects, reach isolated targets, escape dangerous zones
- **Unarmed Strike (Cost 1)**: Deal damage to weak targets (1d8+4 slashing damage)
- **Bite (Cost 2)**: Heal for damage dealt, reduce target's max HP (grappled targets only, +9 to hit, 1d6+4 piercing + 3d6 necrotic)

**Sample Round (Full Engagement):**
- Strahd's Turn: Cast *dominate monster* (8th-level spell, DC 18 Wisdom save) on fighter with Sunsword
- After PC 1's Turn: Legendary Action - Move 30 ft to reach isolated cleric
- After PC 2's Turn: Legendary Action - Unarmed Strike +9 against cleric (1d8+4 damage)
- After PC 3's Turn: Legendary Action - Move 30 ft to escape fireball area
- After PC 4's Turn: No legendary action remaining (used all 3)
- Initiative Count 20: Lair Action - Cast Solid Fog (20-ft cube, heavily obscured)
- Strahd's Next Turn: Grapple dominated fighter, use Bite next round with legendary action

### Lair Action Usage (Engagement Phase)

**Initiative Count 20 (Only in Castle Ravenloft):**
- **Solid Fog**: Obscure vision, create advantage for Strahd's attacks, disadvantage for party ranged attacks
- **Pass Through Walls**: Ambush from behind, escape melee, surprise positioning
- **Control Doors/Gates**: Separate party members, trap PCs in rooms, block escape routes

**Cannot Repeat Same Action Two Rounds in Row** - Track last lair action used.

**Sample Lair Action Sequence:**
- Round 1 (Initiative 20): Solid Fog in party's backline (obscure cleric and wizard)
- Round 2 (Initiative 20): Pass Through Walls (Strahd ambushes wizard from behind wall)
- Round 3 (Initiative 20): Control Doors (slam door shut, separating fighter from party, 3d6 bludgeoning to fighter)
- Round 4 (Initiative 20): Solid Fog again (cannot use Control Doors - just used last round)

### Duration

**Typical Duration**: 1-2 encounters (each 5-10 rounds of combat)

**End Conditions:**
- **Strahd Victory**: Party defeated, retreats, or captured
- **Party Victory**: Strahd reduced to 0 HP (triggers Misty Escape → Phase 5)
- **Tactical Retreat**: Strahd below 30 HP, escapes to coffin voluntarily (Phase 5)

### DM Notes

**Pacing Guidance:**
- This should be the **hardest combat** of the campaign. Don't pull punches.
- If party is overmatched, provide escape options (hidden passage, NPC intervention, Strahd's overconfidence).
- If party is winning easily, reinforce with vampire spawn or increase Strahd's tactical aggression.

**Roleplay Guidance:**
- Strahd is **furious and ruthless** during Engagement Phase. "You dare enter my home? You will die screaming."
- No more games, no more mercy. Strahd fights to kill.
- If party demonstrates exceptional tactics or damages Strahd significantly, he may acknowledge their skill: "Impressive. But not enough."

**Transition to Phase 5:**
- When Strahd is reduced to 0 HP or voluntarily retreats below 30 HP, trigger Phase 5 (Retreat and Reset).

---

## Phase 5: Retreat and Reset

### Trigger Conditions

**Phase 5 begins when:**
- Strahd is reduced to 0 HP and triggers **Misty Escape** (automatic transformation to mist form unless in sunlight or running water)
- Strahd voluntarily retreats when HP < 30 (tactical withdrawal to coffin)
- Strahd needs to regenerate after significant damage

**Phase 5 ends when:**
- Strahd regenerates to full HP (1 hour resting in coffin → 1 HP, then regeneration 20 HP/turn)
- Strahd reassesses party threat level and chooses next phase (usually returns to Phase 2 or 3)

### Objectives

1. **Survive**: Reach coffin in Castle Ravenloft (K86 crypt) within 2 hours
2. **Regenerate**: Rest in coffin to restore to 1 HP, then rely on 20 HP/turn regeneration
3. **Reassess Strategy**: Analyze what went wrong, adjust tactics for next encounter
4. **Plan Revenge**: Determine how to eliminate the party or capture Ireena in next phase

### Actions and Tactics

**Misty Escape (If Reduced to 0 HP):**
- **Automatic Transformation**: Strahd transforms into mist form (no action required) unless in sunlight or running water
- **Mist Form Properties**: Fly speed 20 ft, immune to all damage, can't take actions except Dash, can't talk or manipulate objects
- **Coffin Deadline**: Strahd has **2 hours** to reach coffin in K86 (Castle Ravenloft basement). If deadline expires, Strahd is destroyed.
- **Party Pursuit**: Party can attempt to follow mist form, but Strahd can squeeze through 1-inch gaps, pass through walls, and fly.

**Tactical Retreat (If HP < 30, Voluntary):**
- **Transform to bat** (action, fly speed 30 ft, Small size) or **mist form** (action, fly speed 20 ft, immune to damage)
- **Flee to coffin** via fastest route (Strahd knows Castle Ravenloft perfectly)
- **Use legendary actions** to Move away if pursued
- **Cast *etherealness*** (7th-level spell, 8 hours duration) to escape if desperate

**Coffin Regeneration:**
- **Rest in Coffin (K86)**: After 1 hour, Strahd regenerates to 1 HP
- **Regeneration**: At start of each turn, Strahd regains 20 HP (as long as HP ≥ 1 and not in sunlight/running water)
- **Full Recovery**: Strahd returns to full 144 HP within 7-8 rounds (about 1 minute)

### Duration

**Typical Duration**: 2 hours (game time) or 1-2 sessions (real time)

**End Triggers:**
- Strahd reaches full HP (144)
- Strahd plans next phase based on party threat level
- Party attempts to stake Strahd in coffin (final confrontation)

### Phase Restart Logic

After regeneration, Strahd chooses next phase based on circumstances:

**Return to Phase 2 (Testing):**
- If party is stronger than expected, Strahd tests them again with new tactics
- If party has gained new artifacts or levels, reassess threat

**Return to Phase 3 (Psychological Warfare):**
- If party retreated from Castle Ravenloft, Strahd punishes them with murders/kidnapping
- If Strahd wants to demoralize party before next Engagement

**Skip to Phase 4 (Engagement):**
- If party is actively hunting Strahd in Castle Ravenloft (no time for subtlety)
- If Strahd is enraged and wants immediate revenge

### DM Notes

**Pacing Guidance:**
- Phase 5 provides a **narrative beat** for party to rest, plan, and prepare for next encounter.
- If party pursued Strahd to coffin, this becomes the **final showdown** (drive stake through heart).
- If party did not pursue, Strahd returns in 1-2 sessions with new tactics.

**Roleplay Guidance:**
- If Strahd is staked in coffin, his final words should be dramatic: "You... have won... But Barovia... is eternal... I... shall return..."
- If Strahd escapes, he should send a taunting letter: "Well fought, mortals. But I am immortal. You are not. We shall meet again soon."

**Stakes in Coffin (Final Defeat):**
- To permanently destroy Strahd, party must:
  1. Reduce Strahd to 0 HP (triggers Misty Escape)
  2. Follow mist to coffin in K86
  3. Prevent Strahd from regenerating past 0 HP
  4. Drive wooden stake through heart while in coffin (Strahd is paralyzed, coup de grace)
- If successful, Strahd is **destroyed permanently** - Campaign ends in victory.

---

## Phase Transition Flowchart

```
START: Party enters Barovia
  |
  v
[Phase 1: Observation]
  | Triggers: Party levels 1-3, Strahd gathers intelligence
  | Duration: 1-3 encounters
  | Transition: Party levels to 3+, completes major quest, or acquires first artifact
  |
  v
[Phase 2: Testing]
  | Triggers: Party levels 3+, Strahd tests combat prowess
  | Duration: 2-3 encounters
  | Actions: Hit-and-run, vampire spawn probes, charm attempts
  | Transition: Party levels to 5+, acquires artifact, or demonstrates threat
  |
  v
[Phase 3: Psychological Warfare]
  | Triggers: Party levels 5+, Strahd breaks morale
  | Duration: 3-5 encounters
  | Actions: Kidnapping, murders, charm/dominate, taunts
  | Transition: Party enters Castle Ravenloft OR acquires 2+ artifacts
  |
  v
[Phase 4: Engagement]
  | Triggers: Party in Castle Ravenloft, levels 7+, 2+ artifacts
  | Duration: 1-2 combat encounters
  | Actions: Full combat with all abilities (legendary actions, lair actions, spells)
  | Transition: Strahd reduced to 0 HP → Misty Escape
  |
  v
[Phase 5: Retreat and Reset]
  | Triggers: Strahd at 0 HP or HP < 30
  | Duration: 2 hours (game time)
  | Actions: Mist form escape, coffin regeneration
  | Transition: Strahd regenerates → Returns to Phase 2, 3, or 4
  |
  v
FINAL CONFRONTATION: Party stakes Strahd in coffin
  | Victory: Strahd destroyed permanently, Barovia freed
  | Defeat: Party killed, Barovia remains cursed
```

---

## Example Phase Progressions

### Example 1: Cautious Party (Long Campaign)

**Session 1-4 (Levels 1-2, Phase 1):**
- Party arrives in Barovia, meets Ireena in Village of Barovia
- Strahd observes from bat form during burial of Burgomaster Kolyan
- Party investigates Death House (no Strahd interaction)
- Strahd sends wolves to observe party at Tser Pool Encampment

**Session 5-8 (Levels 3-4, Phase 2):**
- Party defends St. Andral's Church from vampire spawn attack (Strahd observes from *invisibility*)
- Strahd confronts party at Blue Water Inn, charms the fighter (DC 17 Wisdom save, failed)
- Charmed fighter acts as informant, reports party plans to Strahd
- Party defeats Strahd's hit-and-run attack at Old Bonegrinder (Strahd takes 35 damage, retreats to mist form)

**Session 9-13 (Levels 5-6, Phase 3):**
- Strahd murders Father Lucian Petrovich in public square of Vallaki (psychological warfare)
- Strahd kidnaps Ireena during party's assault on Wizard of Wines winery
- Party finds Ireena in Castle Ravenloft (K42 King's Apartment), but Strahd escapes with her via *etherealness*
- Party acquires Sunsword from Tarokka reading (Strahd shifts to defensive tactics)

**Session 14-17 (Levels 7-9, Phase 4):**
- Party storms Castle Ravenloft with 2 artifacts (Sunsword, Holy Symbol of Ravenkind)
- Full combat encounter in K20 (Heart of Sorrow chamber) - Strahd uses all lair actions, legendary actions
- Party reduces Strahd to 0 HP, Strahd triggers Misty Escape

**Session 18 (Phase 5):**
- Party pursues mist to K86 crypt, stakes Strahd in coffin
- **Campaign ends** - Strahd destroyed, Barovia's curse lifted

**Total Duration**: 18 sessions, levels 1-9

---

### Example 2: Aggressive Party (Short Campaign)

**Session 1-2 (Levels 1-2, Phase 1):**
- Party rushes through Village of Barovia, heads straight to Tser Pool
- Strahd observes Tarokka reading, identifies party as "impatient fools"

**Session 3-5 (Levels 3-4, Phase 2 SKIPPED):**
- Party acquires Sunsword from Tarokka reading location (skipped Testing Phase)
- Strahd ambushes party at Wizard of Wines, party uses Sunsword effectively (40 radiant damage, Strahd retreats)
- Strahd **skips Phase 3** (no time for psychological warfare - party too aggressive)

**Session 6-8 (Levels 5-6, Phase 4 EARLY):**
- Party storms Castle Ravenloft at level 5 (very dangerous)
- Strahd fights defensively, uses lair actions to separate party
- Party forced to retreat after 2 PC deaths
- Strahd pursues, kills fleeing rogue with *finger of death*

**Session 9-10 (Levels 6-7, Phase 4 REMATCH):**
- Party returns to Castle Ravenloft with reinforcements (Ezmerelda d'Avenir, Rictavio)
- Epic final battle in K60 (North Tower Peak)
- Party reduces Strahd to 0 HP, Misty Escape triggered

**Session 11 (Phase 5):**
- Party fails to pursue mist form (exhausted, low resources)
- Strahd regenerates, returns to Phase 3 for revenge

**Session 12 (Phase 3 REVENGE):**
- Strahd murders Ezmerelda in front of party (psychological warfare)
- Party flees Barovia (campaign ends in **defeat**)

**Total Duration**: 12 sessions, levels 1-7 (party defeated)

---

### Example 3: Diplomatic Party (Alternate Ending)

**Session 1-10 (Levels 1-6, Phases 1-3):**
- Standard progression through Observation, Testing, Psychological Warfare
- Party focuses on Ireena's safety, avoids direct confrontation with Strahd

**Session 11 (Levels 6-7, Phase 3 NEGOTIATION):**
- Party attempts to negotiate with Strahd: "We'll give you Ireena if you free Barovia's people"
- Strahd is intrigued but rejects (obsessed with Tatyana, not willing to bargain)
- Party learns Ireena must choose to go with Strahd willingly (breaks curse)

**Session 12-15 (Levels 7-8, Phase 3 CONTINUED):**
- Party works with Ireena to help her remember past life (Tatyana's memories)
- Ireena confronts Strahd, rejects him permanently (breaks his obsession)
- Strahd **enraged**, enters Phase 4 early

**Session 16-18 (Levels 8-9, Phase 4):**
- Strahd no longer cares about Ireena's safety (obsession broken)
- Full lethal combat in Castle Ravenloft
- Party destroys Strahd in K86 crypt

**Total Duration**: 18 sessions, levels 1-9 (alternate ending - Ireena survives, curse broken differently)

---

## Legendary Actions

Strahd can take 3 legendary actions per round, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. Strahd regains spent legendary actions at the start of his turn.

### Legendary Actions Overview

**Mechanics:**
- **3 Actions Per Round**: Strahd has a pool of 3 legendary action points that reset at the start of his turn
- **Timing**: Legendary actions occur at the **end of another creature's turn** (not Strahd's turn)
- **One Action Per Trigger**: Strahd can take only ONE legendary action per trigger
- **Cost System**: Each action has a cost (Move = 1, Unarmed Strike = 1, Bite = 2)
- **Reset at Turn Start**: All spent legendary actions are regained when Strahd's turn begins

**Available Actions:**
1. **Move** (Cost 1): Strahd moves up to his speed without provoking opportunity attacks
2. **Unarmed Strike** (Cost 1): Strahd makes one unarmed strike attack
3. **Bite** (Cost 2): Strahd makes one bite attack (only if target is grappled)

### Legendary Action: Move

**Cost:** 1 legendary action

**Mechanics:** Strahd moves up to his speed (30 ft walking, 30 ft climbing with Spider Climb) without provoking opportunity attacks.

**Tactical Uses:**
1. **Reposition for Advantage**: Move to flank isolated party member
2. **Escape Melee**: Move away from melee combatants safely
3. **Reach Cover**: Break line of sight for ranged attacks
4. **Kite Melee Characters**: Stay at range, force pursuit
5. **3D Positioning**: With Spider Climb, move to ceiling/walls

### Legendary Action: Unarmed Strike

**Cost:** 1 legendary action

**Mechanics:**
- **Attack Bonus**: +9 to hit, **Reach**: 5 ft
- **Damage**: 1d8 + 4 slashing damage (average 8.5)
- **On Hit**: Target is grappled (escape DC 18)

**Tactical Uses:**
1. **Extra Damage**: Deal damage between turns
2. **Grapple Setup**: Enable Bite legendary action
3. **Interrupt Concentration**: Force Constitution save
4. **Finish Low-HP Target**: Strike vulnerable PCs

### Legendary Action: Bite

**Cost:** 2 legendary actions

**Mechanics:**
- **Prerequisite**: Target must be grappled, incapacitated, or restrained
- **Attack Bonus**: +9 to hit, **Reach**: 5 ft
- **Damage**: 1d6 + 4 piercing + 3d6 necrotic (average 15 total)
- **Healing**: Strahd regains HP equal to necrotic damage (average 10.5 HP)
- **Max HP Reduction**: Target's max HP reduced by necrotic damage (until long rest)

**Priority Conditions:**
- **High Priority**: Grappled target AND Strahd bloodied (<72 HP) - healing critical
- **Medium Priority**: Eliminate high-value target (cleric, artifact wielder)
- **Low Priority**: Strahd above 100 HP - save actions for Move/Unarmed Strike

### Legendary Actions: Epic 3 Integration

**DM Adjudication Steps:**
1. **Initialize**: Note "Strahd Legendary Actions: 3/3" at combat start
2. **Prompt**: After each PC turn, ask "Strahd has X legendary actions. Use any?"
3. **Execute**: Declare action, roll dice (DiceRoller), apply effects (HP Manager)
4. **Decrement**: Subtract cost from pool
5. **Reset**: When Strahd's turn arrives, reset to 3/3

**What Works Out-of-Box:**
- Attack/damage rolls (DiceRoller)
- HP tracking (HP Manager)

**What Needs DM Adjudication:**
- Legendary action pool tracking (manual counter)
- Turn-end prompts (DM memory)
- Reset logic (DM resets at Strahd's turn)

**What Needs Epic 5:**
- `/legendary-action` slash command (auto-prompt, display counter)
- Automatic reset in CombatManager
- UI indicator showing action pool

### Legendary Actions: Sample Combat Rounds

**(Sample Round 1 - Opening Engagement)**
- Strahd Turn: Cast *greater invisibility*, Spider Climb to ceiling
- After Wizard: Legendary Action Move (reposition above cleric)
- After Cleric: Save actions
- After Fighter: Legendary Action Unarmed Strike (grapple cleric)
- After Rogue: Only 1 action left (can't Bite, save for next round)

**(Sample Round 2 - Bloodied, Desperate Healing)**
- Strahd at 58 HP (bloodied)
- Fighter hits twice (Strahd now at 30 HP)
- After Fighter: Legendary Action Move (escape melee)
- Strahd Turn: Cast *mirror image*, move toward cleric
- After Cleric: Legendary Action Unarmed Strike (grapple attempt, fails due to mirror image)
- After Wizard: Legendary Action Move (stay mobile)

**(Sample Round 3 - Misty Escape Triggered)**
- Strahd at 22 HP
- Strahd Turn: Unarmed Strike (grapple wizard for Bite setup)
- Fighter attacks: 24 damage → Strahd reduced to -2 HP
- **Misty Escape Triggers**: Auto-transform to mist, no legendary actions in mist form
- Paladin activates Sunsword (sunlight blocks regeneration)
- Strahd uses Dash in mist form to escape sunlight, flees to coffin

---

## Lair Actions

In Castle Ravenloft, Strahd can use lair actions at initiative count 20 (losing initiative ties). He can use one lair action per round and cannot use the same lair action two rounds in a row.

### Lair Actions Overview

**Mechanics:**
- **Initiative Count 20**: Lair actions occur at initiative 20, before most creatures
- **Location Restriction**: Only active in Castle Ravenloft (K1-K90)
- **Cannot Repeat Rule**: Different action each round (track last action used)
- **One Per Round**: Strahd chooses ONE lair action at initiative 20

**Available Lair Actions:**
1. **Solid Fog**: 20-ft cube of fog (heavily obscured, blocks vision)
2. **Pass Through Walls**: Strahd phases through solid objects
3. **Control Doors/Gates**: Open/close/lock doors, crush creatures (3d6 damage)

### Lair Action: Solid Fog

**Mechanics:**
- **Effect**: 20-ft cube of fog appears (Strahd chooses location within 120 ft)
- **Duration**: Until initiative 20 on next round (or Strahd chooses to dismiss)
- **Properties**: Area is heavily obscured (blocks vision completely)
- **Equivalent Spell**: *fog cloud* (1st-level spell)

**Tactical Uses:**
1. **Obscure Vision**: Block line of sight for ranged attacks
2. **Create Advantage**: Strahd attacks from fog, enemies can't see him (advantage)
3. **Create Disadvantage**: Enemies attack into fog (disadvantage if they can't see Strahd)
4. **Escape Tool**: Create fog, flee through it (enemies lose sight)
5. **Separate Party**: Place fog between frontline/backline (divide party)

**Examples:**
- Place fog on wizard/cleric backline (obscure their vision, prevent targeting Strahd with spells)
- Place fog on Strahd's position (hide, gain advantage on next attack from fog)
- Place fog at chokepoint (block party's advance into room)

### Lair Action: Pass Through Walls

**Mechanics:**
- **Effect**: Strahd walks through walls, floors, ceilings (move up to his speed)
- **Duration**: Instantaneous
- **Properties**: Strahd moves through solid objects, can emerge on other side
- **No Damage**: Strahd takes no damage from moving through walls

**Tactical Uses:**
1. **Ambush**: Phase through wall, surprise attack from behind
2. **Escape Melee**: Phase through wall to escape surrounded position
3. **3D Positioning**: Phase through floor to level below, or ceiling to level above
4. **Avoid Area Effects**: Phase out of *fireball* or *spirit guardians* area
5. **Chase Fleeing Targets**: Phase through walls to cut off retreat

**Examples:**
- Party surrounds Strahd → Phase through wall behind wizard → Attack wizard from behind
- Paladin has Sunsword (sunlight) → Phase through floor to basement level → Escape sunlight
- Party locks door to slow Strahd → Phase through door (bypass obstacle)

### Lair Action: Control Doors and Gates

**Mechanics:**
- **Effect**: Strahd controls all doors/windows/portcullises within 120 ft
- **Options**: Open, close, lock/unlock (DC 20 Strength check to break)
- **Crush Damage**: If creature in doorway when closing, 3d6 bludgeoning damage
- **Duration**: Permanent until manually changed

**Tactical Uses:**
1. **Separate Party**: Close door between frontline/backline (divide and conquer)
2. **Trap PCs**: Lock door behind isolated PC (1v1 encounter)
3. **Block Escape**: Close all exits (party cannot flee)
4. **Crush Damage**: Close door/portcullis on creature (3d6 bludgeoning)
5. **Create Maze**: Open/close doors to force party into specific rooms

**Examples:**
- Close door between fighter and cleric → Isolate fighter → Focus fire on fighter
- Lock all doors in room → Party trapped → Strahd uses lair actions + spells freely
- Lower portcullis on rogue → 3d6 bludgeoning → Rogue trapped under portcullis (restrained)

### Lair Actions: Epic 3 Integration

**DM Adjudication Steps:**
1. **Add Lair Pseudo-Combatant**: At combat start (in Castle Ravenloft), add "Lair" to initiative order at count 20
2. **Track Last Action**: Note which lair action was used last round (cannot repeat)
3. **Execute at Initiative 20**: When initiative reaches 20, Strahd chooses one lair action (not same as last round)
4. **Apply Effects**: Describe environmental change, apply mechanical effects

**Location Check:**
- **Castle Ravenloft Only**: Lair actions only work in K1-K90 locations
- **Outside Castle**: No lair actions available (Strahd loses this advantage)

**What Needs Epic 5:**
- `/lair-action` slash command (auto-track last action, prevent repeats)
- Automatic initiative 20 handler in CombatManager
- UI display of last lair action used

### Lair Actions: Tactical Synergies

**Fog + Greater Invisibility:**
- Initiative 20: Solid Fog on Strahd's position
- Strahd's Turn: Cast *greater invisibility* (already in fog)
- Result: Strahd invisible + obscured (extreme difficulty for party to target)

**Pass Through Walls + Surprise Spell:**
- Initiative 20: Pass Through Walls (phase behind wizard)
- Strahd's Turn: Cast *blight* on wizard (surprise, wizard has disadvantage on save)
- Result: High damage, wizard caught off-guard

**Control Doors + Fireball:**
- Initiative 20: Close doors (trap party in room)
- Strahd's Turn: Cast *fireball* (party cannot easily escape area)
- Result: Maximum *fireball* damage, party forced to endure or waste actions breaking doors

**Fog + Pass Through Walls + Control Doors (Multi-Round Combo):**
- Round 1 Initiative 20: Solid Fog (obscure party vision)
- Round 2 Initiative 20: Control Doors (close doors, separate party)
- Round 3 Initiative 20: Pass Through Walls (ambush isolated PC)

### Lair Actions: Sample Combat Rounds

**(Sample Lair Action Sequence)**
- **Round 1, Init 20**: Solid Fog (20-ft cube on wizard/cleric backline)
- **Strahd's Turn**: Cast *dominate monster* on fighter (DC 18, fighter fails)
- **Round 2, Init 20**: Pass Through Walls (cannot use Solid Fog, just used last round) - Phase through wall to ambush wizard
- **Strahd's Turn**: Unarmed Strike (grapple wizard), Move back through wall
- **Round 3, Init 20**: Control Doors (cannot use Pass Through Walls, just used last round) - Close door, separate fighter from party
- **Strahd's Turn**: Bite grappled wizard (heal 12 HP)
- **Round 4, Init 20**: Solid Fog (can use again, was 2 rounds ago) - Place fog on fighter's position

---

## Vampire Mechanics

Strahd possesses all standard vampire abilities plus enhanced legendary vampire traits. This section details each mechanic and how to integrate with Epic 3 systems.

### Vampire Mechanics: Regeneration

**Mechanics:**
- **Timing**: At start of Strahd's turn
- **Amount**: Regain 20 HP
- **Conditions**: Only if Strahd has at least 1 HP
- **Blocked By**: Radiant damage last turn, holy water in wounds, sunlight exposure, running water

**Epic 3 HP Manager Integration:**
1. At start of Strahd's turn, check: Is Strahd HP ≥ 1?
2. Check: Did Strahd take radiant damage since last turn?
3. Check: Is Strahd in sunlight or running water?
4. If all checks pass: Add 20 HP (using HP Manager.applyHealing())

**Tactical Implications:**
- Strahd can sustain 20 HP/turn of damage indefinitely (140 HP over 7 rounds from regeneration alone)
- Radiant damage is critical counter (Sunsword, *sacred flame*, Holy Symbol)
- Healing + Bite creates 30+ HP/turn recovery (Regeneration 20 + Bite 10-15)

### Vampire Mechanics: Charm

**Mechanics:**
- **Target**: One humanoid Strahd can see within 30 ft
- **Save**: DC 17 Wisdom saving throw
- **Duration**: 24 hours or until harmed by Strahd/allies
- **Effect**: Charmed, regards Strahd as trusted friend, willing bite victim
- **Limitation**: One target at a time (Strahd can re-charm to switch targets)

**Epic 3 ConditionTracker Integration:**
1. Target makes DC 17 Wisdom save (use DiceRoller)
2. On fail: Add custom condition "Charmed by Strahd" (24-hour duration)
3. Charmed target: Friendly to Strahd, obeys simple commands, willing bite victim
4. If harmed: Target makes new save to break charm

**Tactical Uses:**
- Charm strongest fighter (turn damage dealer into ally temporarily)
- Charm cleric/paladin (eliminate healing/radiant damage source)
- Charm PC as informant (gather party plans, sabotage from within)

### Vampire Mechanics: Children of the Night

**Mechanics:**
- **Frequency**: 1/day (recharges at dawn)
- **Summon**: 2d4 swarm of bats, 2d4 swarm of rats, OR 3d6 wolves
- **Arrival**: 1d4 rounds after summoning
- **Duration**: Until destroyed or Strahd dismisses

**Epic 2 Event Scheduler Integration:**
1. Strahd uses bonus action to summon
2. Roll 1d4 for arrival time (1-4 rounds)
3. Use EventScheduler to trigger arrival event after X rounds
4. When event triggers: Spawn creatures at Strahd's location

**Tactical Uses:**
- Summon wolves if outnumbered (3d6 = 10-18 wolves, massive advantage)
- Summon bats for distraction (swarms grapple/blind PCs)
- Summon early in combat (arrive mid-fight to turn tide)

### Vampire Mechanics: Shapechanger

**Mechanics:**
- **Action**: Transform as action
- **Forms**: Bat (Tiny), Wolf (Medium), Mist (Medium), Humanoid (Medium)
- **Stats**: Equipment doesn't transform, statistics mostly unchanged except size/speed
- **Limitations**: 0 HP in mist form triggers Misty Escape (different mechanic)

**Forms and Uses:**
- **Bat Form**: Fly 30 ft, Tiny size (spy, escape through small gaps)
- **Wolf Form**: Speed 40 ft (pursue fleeing targets)
- **Mist Form**: Fly 20 ft, immune to all damage (ultimate escape, but can't attack)
- **Humanoid**: Normal form (full combat capabilities)

### Vampire Mechanics: Misty Escape

**Mechanics:**
- **Trigger**: Strahd reduced to 0 HP (automatic transformation)
- **Exception**: Cannot trigger if in sunlight or running water (Strahd is destroyed)
- **Mist Form**: Fly speed 20 ft, immune to all damage, can't take actions except Dash
- **Coffin Deadline**: 2 hours to reach coffin or be destroyed
- **Regeneration**: After 1 hour in coffin, regenerate to 1 HP, then normal regeneration applies

**Epic 2 EventScheduler Integration:**
1. When Strahd at 0 HP: Check location (sunlight? running water?)
2. If safe: Transform to mist form (HP remains at 0)
3. Set 2-hour timer using EventScheduler (coffin deadline event)
4. Strahd flees toward K86 (coffin location)
5. If reaches coffin within 2 hours: After 1 hour, regenerate to 1 HP

**Party Countermeasures:**
- Pursue mist form to coffin
- Use sunlight (Sunsword) to force mist into sunlight (20 radiant damage/turn destroys at 0 HP)
- Stake Strahd in coffin before regeneration

### Vampire Mechanics: Sunlight Sensitivity

**Mechanics:**
- **Damage**: 20 radiant damage at start of Strahd's turn if in sunlight
- **Disadvantage**: Disadvantage on attack rolls and ability checks in sunlight
- **Source**: Natural sunlight OR Sunsword (15-ft radius bright light counts as sunlight)

**Tactical Implications:**
- Sunsword is Strahd's greatest weakness (20 damage/turn + blocks regeneration + disadvantage)
- Strahd avoids sunlight at all costs (flee, use lair actions to escape)
- Dawn never comes in Barovia (Strahd controls weather), but Sunsword creates sunlight

### Vampire Mechanics: Running Water Damage

**Mechanics:**
- **Damage**: 20 acid damage if Strahd ends turn in running water
- **Definition**: Flowing rivers, streams (not rain, not standing water)
- **Location Metadata**: Check `hasRunningWater: true` in location metadata

**Tactical Implications:**
- Strahd avoids river crossings (Tser Falls, Luna River)
- Party can use running water as defensive terrain (Strahd won't pursue)

### Vampire Mechanics: Spider Climb

**Mechanics:**
- **Ability**: Strahd can climb difficult surfaces (walls, ceilings) at normal speed
- **No Check Required**: Automatic, no Athletics check needed
- **Hands Free**: Strahd can climb while holding weapons/casting spells

**Tactical Uses:**
- Ceiling ambush (60 ft above party, surprise attack)
- 3D combat positioning (avoid melee, attack from above)
- Escape vertical shafts (climb walls to upper levels)

---

## Combat Tactics and Spell Selection

Strahd is a **9th-level wizard** with a **spellcasting save DC of 18** and **+10 to hit** with spell attacks. His spell selection emphasizes **control, survival, and psychological dominance** over raw damage. This section provides tactical guidance for using Strahd's spells in combination with his legendary actions, lair actions, and vampire abilities.

### Spell List Overview

**Cantrips (at will):**
- **Mage Hand**: Manipulate objects at range (open coffin, trigger traps, retrieve items)
- **Prestidigitation**: Minor illusions (bloody handprints, flickering candles, whispered names)
- **Ray of Frost**: 2d8 cold damage, reduce speed by 10 ft (kiting melee characters)

**1st Level (4 slots):**
- **Comprehend Languages**: Understand any language (interrogate captives, read journals)
- **Fog Cloud**: Create 20-ft radius fog (escape, obscure vision)
- **Sleep**: Incapacitate low-HP targets (finish with Bite, auto-crit on unconscious)

**2nd Level (3 slots):**
- **Hold Person**: Paralyze humanoid (DC 18 Wisdom save, auto-crit on paralyzed target)
- **Invisibility**: Turn invisible until attack (scouting, repositioning, ambush)
- **Mirror Image**: Create 3 duplicates (AC becomes nearly untouchable when bloodied)

**3rd Level (3 slots):**
- **Animate Dead**: Create undead servants (12 zombies/skeletons, battlefield control)
- **Fireball**: 8d6 fire damage in 20-ft radius (area damage, force healing/concentration)
- **Nondetection**: Become immune to divination magic (prevent scrying, locate creature)

**4th Level (3 slots):**
- **Blight**: 8d8 necrotic damage to single target (priority: healers, concentrators)
- **Greater Invisibility**: Turn invisible for 1 minute (advantage on attacks, attacks don't break)
- **Polymorph**: Transform target into beast (remove fighter from combat, create hazards)

**5th Level (2 slots):**
- **Animate Objects**: Animate 10 objects as minions (castle furniture, weapons, armor)
- **Scrying**: Spy on creatures via crystal ball (gather intelligence, taunt from afar)

**6th Level (1 slot):**
- **Move Earth**: Reshape terrain (collapse tunnels, create chasms, seal exits)

### Opening Round Tactics

**Phase 1-2 (Observation/Testing): Hit-and-Run**
1. **Round 1 (Before Engagement):**
   - Cast **Greater Invisibility** before entering combat (concentration, lasts 10 rounds)
   - Use **Spider Climb** to position on ceiling 60 ft above party
   - Use **Legendary Action: Move** to kite and maintain distance

2. **Round 1 (Surprise Strike):**
   - Cast **Hold Person** on fighter/paladin (DC 18 Wisdom save, paralyze)
   - If successful: Use **Legendary Action: Move** to reach paralyzed target, then **Legendary Action: Bite** (auto-crit on paralyzed = 2d6+8 piercing + 6d6 necrotic)
   - If failed: Use **Ray of Frost** to reduce speed, then **Legendary Action: Move** to escape melee

**Phase 3 (Psychological Warfare): Control and Domination**
1. **Round 1:**
   - Cast **Scrying** on party leader 24 hours before encounter (gather intelligence)
   - Cast **Charm** on cleric/wizard during social encounter (long-term sabotage)
   - Reveal charmed NPC mid-combat ("Your ally serves me now")

**Phase 4 (Engagement): Full Tactical Arsenal**
1. **Round 1 (Castle Ravenloft):**
   - **Lair Action (Initiative 20)**: Cast **Solid Fog** to separate party
   - **Strahd's Turn**: Cast **Greater Invisibility** (concentration)
   - **Legendary Actions**: Move → Move → Move (reposition to isolated target)

2. **Round 2:**
   - **Lair Action (Initiative 20)**: **Pass Through Walls** (emerge behind isolated spellcaster)
   - **Strahd's Turn**: Cast **Blight** on isolated wizard (8d8 necrotic, break concentration)
   - **Legendary Actions**: Unarmed Strike (grapple wizard) → Bite (heal from wizard)

3. **Round 3:**
   - **Lair Action (Initiative 20)**: **Control Doors** (seal exits, trap party in room)
   - **Strahd's Turn**: Cast **Fireball** centered on clumped party (8d6 fire, force healing/movement)
   - **Legendary Actions**: Move (escape fireball radius) → Move (reposition)

### Mid-Combat Tactics

**Priority Target Selection:**
1. **Primary Targets (Eliminate First):**
   - **Healers** (Cleric, Druid): Prevent healing, break concentration on Spirit Guardians
   - **Spellcasters** (Wizard, Sorcerer): Low AC, high damage potential, break concentration
   - **Ranged Attackers** (Rogue, Ranger): If using Sunsword or radiant damage

2. **Secondary Targets (Control or Ignore):**
   - **Melee Fighters** (Fighter, Barbarian): Use **Hold Person**, **Polymorph**, or kite with legendary Move
   - **Paladins**: High saves (hard to charm/paralyze), but **Blight** bypasses AC

**Spell Selection by Situation:**

**When Outnumbered (Party Size 5+):**
- **Fireball** (8d6 fire, 20-ft radius) - Force healing, break concentration, create chaos
- **Animate Objects** (10 animated swords) - Action economy, distract frontliners
- **Children of the Night** (3d6 wolves) - Occupy melee, create difficult terrain
- **Fog Cloud** + **Greater Invisibility** - Obscure vision, attack with advantage

**When Focused by Melee:**
- **Legendary Action: Move** (30 ft, no opportunity attacks) - Kite to range
- **Spider Climb** (climb to ceiling 60 ft up) - Escape melee entirely
- **Lair Action: Pass Through Walls** - Phase through wall, emerge 60 ft away
- **Misty Step** (if added as DM variant) - Teleport 30 ft as bonus action

**When Bloodied (<72 HP):**
- **Mirror Image** (create 3 duplicates) - AC effectively becomes 20+ (attacks must destroy images first)
- **Greater Invisibility** (if not already active) - Disadvantage on attacks against Strahd
- **Lair Action: Solid Fog** (obscure vision) - Block line of sight for ranged attacks
- **Regeneration** (20 HP/turn) - If no radiant damage, heal rapidly

**When Escape Threshold (<30 HP):**
- **Shapechanger: Mist Form** (bonus action) - Immune to all damage, fly 20 ft
- **Lair Action: Pass Through Walls** - Phase to hidden coffin location
- **Legendary Action: Move** x3 (90 ft total) - Sprint to nearest safe room
- **Fog Cloud** (1st-level slot) - Obscure escape route

### Legendary Action Patterns

**Conservative Pattern (Phases 1-3, Testing/Psychological):**
- **Move → Move → Move**: Kite party, maintain distance, avoid opportunity attacks
- **Total Movement**: 120 ft per round (30 base + 90 legendary)
- **Use Case**: Observation, hit-and-run, escape after single attack

**Aggressive Pattern (Phase 4, Full Engagement, >72 HP):**
- **Unarmed Strike → Unarmed Strike → Bite**: Maximum damage output (grapple + bite combo)
- **Damage**: 1d8+4 + 1d8+4 + 1d6+4 + 3d6 necrotic = ~35 damage + ~10.5 healing
- **Use Case**: When Strahd has advantage (Greater Invisibility, flanking), target is isolated

**Healing Pattern (Phase 4, Bloodied <72 HP):**
- **Unarmed Strike (grapple) → Bite → Bite**: Maximize healing from Bite
- **Healing**: 3d6 necrotic x2 = ~21 HP regained (plus 20 HP regeneration = 41 HP/round)
- **Use Case**: Strahd is bloodied, grappled target is isolated, regeneration is active

**Escape Pattern (Phase 5, <30 HP):**
- **Move → Move → Move**: Maximum distance from party (90 ft)
- **Alternate**: **Move → Move → Unarmed Strike (break grapple)**: If grappled by fighter
- **Use Case**: Strahd triggers Misty Escape threshold, needs to flee to coffin

### Lair Action Synergies with Spells

**Solid Fog (Lair Action) + Greater Invisibility (Spell):**
- Party is heavily obscured (disadvantage on attacks)
- Strahd is invisible (attacks have disadvantage against him, he has advantage on attacks)
- **Net Effect**: Party attacks Strahd at triple disadvantage (roll 3d20, take lowest)
- **Counter**: *See Invisibility*, *Faerie Fire*, *Tremorsense*

**Pass Through Walls (Lair Action) + Fireball (Spell):**
- **Round 1**: Lair action - Pass through wall to emerge behind party
- **Strahd's Turn**: Cast **Fireball** centered on party (8d6 fire, DC 18 Dex save)
- **Legendary Actions**: Move x3 (90 ft) to escape fireball radius
- **Net Effect**: Surprise fireball from behind, Strahd escapes retaliation

**Control Doors (Lair Action) + Animate Objects (Spell):**
- **Round 1**: Cast **Animate Objects** on 10 swords/armor suits
- **Round 2**: Lair action - **Control Doors** to seal all exits (trap party in room)
- **Round 3-10**: Animated objects attack party while Strahd casts from safety
- **Net Effect**: Party trapped with 10 minions, Strahd controls battlefield

### Retreat Conditions and Decision Logic

**When to Retreat (Phase 4 → Phase 5):**
1. **HP Threshold (<30 HP)**: Risk of Misty Escape trigger (automatic at 0 HP)
2. **Sunsword Active**: If party has activated Sunsword (20 radiant damage/turn, blocks regeneration)
3. **Multiple Radiant Sources**: If 2+ party members have radiant damage (blocks regeneration)
4. **Outnumbered and Isolated**: If party size 6+ and Strahd has no minions/allies
5. **Artifacts Active**: If party has 2+ legendary artifacts (Holy Symbol, Sunsword, Tome)
6. **Lair Actions Blocked**: If outside Castle Ravenloft (no lair actions = significant disadvantage)

**Retreat Tactics (Priority Order):**
1. **Shapechanger: Mist Form** (bonus action, immune to all damage) → Fly to coffin (20 ft/round)
2. **Lair Action: Pass Through Walls** → Phase to hidden chamber (K86 Catacombs)
3. **Greater Invisibility** + **Legendary Move x3** → Sprint to coffin (120 ft, invisible)
4. **Fog Cloud** + **Spider Climb** → Obscure vision, climb to ceiling, escape via vertical shaft
5. **Polymorph (self into bat)** → Fly 30 ft/round, Tiny size (squeeze through small gaps)

**When NOT to Retreat:**
- **HP >72 HP** (not bloodied): Strahd is confident, will use aggressive tactics
- **Ireena Present**: Strahd will never retreat if Ireena is in danger (prioritize her safety)
- **Party Fleeing**: If party is retreating, Strahd pursues to punish cowardice
- **Castle Ravenloft**: Strahd has home field advantage (lair actions, minions, traps)
- **Regeneration Active**: If no radiant damage sources, Strahd can heal 20 HP/turn indefinitely

**Post-Retreat Actions (Phase 5):**
1. **Mist Form Travel**: 2-hour deadline to reach coffin (automatic at 0 HP)
2. **Coffin Regeneration**: 8 hours rest in coffin → full HP, all spell slots, reset phase
3. **Phase Reset**: Return to Phase 1 (Observation) → Begin cycle again
4. **Intelligence Gathering**: Use **Scrying** to track party location and status
5. **Countermeasures**: If party knows coffin location, relocate coffin to new crypt

---

## Psychological Warfare

Strahd's greatest weapon is not his spells or legendary actions—it is **fear**. As the ancient master of Barovia, Strahd uses psychological manipulation, terror tactics, and emotional leverage to break the party's morale before the first blow is struck. This section provides detailed guidance for running Strahd's Phase 3 (Psychological Warfare) with maximum dramatic impact.

### Core Principles

**Strahd's Psychological Toolkit:**
1. **Omnipresence**: Strahd appears everywhere (scrying, spies, Vistani informants)
2. **Invincibility**: Strahd demonstrates he cannot be killed (Misty Escape, return from death)
3. **Control**: Strahd controls Barovia absolutely (weather, NPCs, monsters, travel)
4. **Obsession**: Strahd's fixation on Ireena creates emotional leverage
5. **Patience**: Strahd has eternity—the party does not
6. **Superiority**: Strahd is nobility, the party are peasants beneath his notice

**DM Goals for Psychological Warfare:**
- Make players feel **watched** (Strahd knows their plans, conversations, secrets)
- Make players feel **powerless** (Strahd controls everything, escape is impossible)
- Make players feel **conflicted** (moral dilemmas, no good choices)
- Make players feel **paranoid** (NPCs may be charmed, locations may be trapped)
- Make players feel **time pressure** (Ireena is in danger, Strahd is coming)

### Psychological Tactics by Category

**Surveillance and Omnipresence:**
- **Scrying (5th-level spell)**: Strahd watches party via crystal ball daily (DC 18 Wisdom save)
- **Animal Spies**: Ravens, bats, wolves report party location to Strahd
- **Vistani Informants**: Vistani caravans report party movements to Strahd
- **Charmed NPCs**: Strahd charms innkeepers, merchants, allies (DC 17 Wisdom save)
- **DM Technique**: Describe "a bat watching from the rafters" or "a raven following overhead" after key conversations

**Demonstrations of Power:**
- **Control Weather**: Strahd summons storms when angry, clears weather when pleased
- **Summon Wolves**: Strahd howls, 3d6 wolves arrive to encircle party (show of force)
- **Animate Dead**: Strahd raises slain party NPCs as zombies ("You could not protect them")
- **Pass Through Walls**: Strahd appears inside locked rooms ("Your locks are meaningless")
- **DM Technique**: After party defeats Strahd once, he returns the next session fully healed ("Did you truly think I could die?")

**Emotional Manipulation:**
- **Ireena Obsession**: Strahd visits Ireena in dreams, sends gifts, writes poetry
- **Moral Dilemmas**: Strahd offers to spare village if party surrenders Ireena
- **False Hope**: Strahd allows party to "escape" Barovia, only to reveal mists return them
- **Guilt**: Strahd punishes NPCs when party fails (burgomaster dies, orphans starve)
- **DM Technique**: Deliver Strahd's dialogue as poetry or courtly love ("My dear Tatyana, you are the sun in this cursed land")

**Fear and Intimidation:**
- **Night Visits**: Strahd appears outside windows, watches party sleep, leaves bloody notes
- **Vampire Brides**: Ludmilla, Anastrasya, Volenta toy with party members (charm, seduction, threats)
- **Torture Displays**: Strahd impales traitors on castle walls, hangs bodies from trees
- **Mind Games**: Strahd reveals he knows party secrets ("Your sister sends her regards, paladin")
- **DM Technique**: Use environmental storytelling (blood trails, screams in distance, fresh graves)

### Example Scenario 1: The Dinner Invitation

**Setup (Session 8-10, Party Level 5-6):**
- Party arrives in Vallaki, seeking safety after escaping Old Bonegrinder
- That night, a **black carriage** arrives at the Blue Water Inn with an invitation:

> *"You are cordially invited to dine at Castle Ravenloft on the night of the full moon. Come as honored guests, or come as prey—the choice is yours. I eagerly await our meeting.*
>
> *—Count Strahd von Zarovich*"

**DM Execution:**

**Phase 1: The Journey (Build Tension)**
- Black carriage arrives at dusk, **driverless** (horses are undead, move on their own)
- If party declines, carriage waits outside inn all night (psychological pressure)
- If party enters, carriage travels through Svalich Woods (wolves howl, fog thickens)
- **Key Moment**: Carriage passes **gallows** with fresh corpses (Strahd's warning)

**Phase 2: The Dinner (Establish Superiority)**
- Strahd greets party in **K10 Dining Hall**, dressed as nobleman (not monster)
- Dinner is lavish: wine, roast boar, fresh bread (Strahd does not eat—just watches)
- Strahd asks polite questions: "How do you find Barovia? Have you seen Ireena?"
- **Key Moment**: If party is rude, Strahd snaps fingers—wolves surround castle (show of force)

**Phase 3: The Revelation (Psychological Strike)**
- Mid-dinner, Strahd reveals: "I know you carry the *Icon of Ravenloft*. Did Kolyan give it to you before he died?"
- Strahd describes party's last three conversations in detail (scrying evidence)
- Strahd offers deal: "Bring Ireena to me willingly, and I will let you leave Barovia unharmed"
- **Key Moment**: If party refuses, Strahd sighs: "Very well. I have eternity. You do not."

**Phase 4: The Departure (Plant Paranoia)**
- Strahd allows party to leave freely (no combat, no pursuit)
- As party exits, Strahd whispers to one PC: "Your companion plans to betray you" (lie, but plants paranoia)
- Carriage returns party to Vallaki (same driverless black carriage)
- **Key Moment**: Next morning, party finds **black rose** on each pillow (Strahd was in their rooms while they slept)

**DM Outcomes:**
- Party realizes Strahd is **always watching** (scrying, spies)
- Party realizes Strahd is **in control** (could have killed them, chose not to)
- Party realizes Strahd wants **Ireena**, not them (moral dilemma: surrender her or fight?)
- Party realizes **escape is impossible** (Strahd allowed them to leave, proving he controls exits)

### Example Scenario 2: The Dream Haunting

**Setup (Session 12-15, Party Level 6-7):**
- Party refuses to surrender Ireena, continues protecting her
- Strahd escalates to **Dream** spell (5th-level, bypasses physical defenses)

**DM Execution:**

**Night 1: The Nightmare (Establish Threat)**
- Ireena has nightmare: Strahd appears in dream, castle ballroom, dancing with her
- Ireena describes dream to party next morning: "He said I belong with him, that I always have"
- **Mechanics**: Ireena makes DC 18 Wisdom save (fails on 1st attempt)
- **Effect**: Ireena takes 3d6 psychic damage, cannot benefit from long rest (exhaustion level 1)

**Night 2: The Escalation (Show Inevitability)**
- Ireena has nightmare again: Strahd kisses her, says "Come to me willingly, or I will take you"
- Ireena wakes screaming, exhaustion level 2 (disadvantage on ability checks)
- Party tries *Protection from Evil*, *Lesser Restoration* (neither work—Dream bypasses)
- **Key Moment**: Cleric casts *Lesser Restoration*—works for exhaustion, but nightmare returns next night

**Night 3: The Breaking Point (Force Decision)**
- Ireena has nightmare again: Strahd shows her visions of party dying, saying "They cannot protect you"
- Ireena wakes with exhaustion level 3 (disadvantage on saves, checks, attacks)
- Ireena begs party: "Maybe I should go to him. I can't bear this anymore."
- **Key Moment**: Party must decide—surrender Ireena (end nightmares) or find way to stop Strahd

**Party Solutions:**
1. **Find Strahd's Coffin**: Destroy coffin (prevents Misty Escape, makes Strahd vulnerable)
2. **Acquire Artifacts**: Get Holy Symbol of Ravenkind (*Protection from Evil* blocks Dream)
3. **Confront Strahd Early**: Force battle before party is ready (Strahd escapes, but nightmares stop temporarily)
4. **Hide Ireena**: Take Ireena to Abbey of St. Markovia, Krezk (Abbot may "protect" her—complications ensue)

**DM Outcomes:**
- Party realizes **Strahd can hurt them anywhere** (even in dreams, even with guards)
- Party realizes **Ireena is suffering** (moral pressure to act)
- Party realizes **time is limited** (exhaustion will kill Ireena in ~7 nights)
- Party realizes **they need artifacts** (motivates quest for Holy Symbol, Sunsword, Tome)

### Example Scenario 3: The Moral Dilemma

**Setup (Session 16-18, Party Level 7-8):**
- Party has acquired 1-2 artifacts (Holy Symbol or Sunsword)
- Strahd realizes party is becoming a threat, escalates to **direct ultimatum**

**DM Execution:**

**The Ultimatum (Force Impossible Choice):**
- Strahd appears via **Scrying Sensor** (visible shimmering orb) during party rest
- Strahd speaks through sensor: "You have become tiresome. I offer you one final choice."
- Strahd's terms:
  - **Option A**: Surrender Ireena to Strahd → Strahd allows party to leave Barovia safely
  - **Option B**: Continue protecting Ireena → Strahd destroys one Barovian village per week until party complies
- **Key Moment**: Strahd snaps fingers—scrying sensor shows **Village of Barovia burning** (Strahd's zombies attack)

**The Consequences (Make It Real):**
- If party does nothing, next session begins with **Village of Barovia destroyed** (100+ NPCs dead)
- Survivors flee to Vallaki, tell stories: "The devil came at night. He said the adventurers brought this upon us."
- Barovian NPCs turn hostile: "You should have given him the girl! Now our families are dead!"
- **Key Moment**: Ismark (Ireena's brother) confronts party: "Is my sister worth 100 lives? 1000 lives?"

**Party Solutions:**
1. **Surrender Ireena (Tragic Ending)**: Ireena goes to Strahd, party escapes Barovia (campaign ends, Strahd wins)
2. **Refuse and Defend**: Party evacuates villages to Vallaki, fortifies defenses (buys time, but unsustainable)
3. **Counterattack**: Party assaults Castle Ravenloft immediately (rushes final battle before ready)
4. **Fake Surrender**: Party "surrenders" Ireena (polymorphed duplicate/illusion), buys time to find coffin

**DM Outcomes:**
- Party realizes **Strahd will sacrifice anyone** to get Ireena (no innocents are safe)
- Party realizes **they cannot protect everyone** (tragic heroism vs utilitarian calculus)
- Party realizes **final battle is inevitable** (cannot negotiate with monster)
- Party realizes **they must act now** (time pressure to assault castle or lose Barovia)

### Psychological Warfare: DM Tips

**Pacing Guidelines:**
- **Phase 1-2 (Levels 1-5)**: Strahd appears 1-2 times (mysterious, distant)
- **Phase 3 (Levels 5-7)**: Strahd appears 3-5 times (escalating presence)
- **Phase 4 (Levels 7-10)**: Strahd appears 6+ times (constant threat)

**Tone Guidelines:**
- **Early Game**: Strahd is **courtly** (nobleman, charming, sophisticated)
- **Mid Game**: Strahd is **possessive** (obsessed with Ireena, jealous, controlling)
- **Late Game**: Strahd is **wrathful** (party has defied him too long, gloves come off)

**Improvisation Framework:**
When players do something unexpected, ask yourself:
1. **How does Strahd learn about this?** (Scrying, spies, charmed NPCs)
2. **How does Strahd feel about this?** (Amused, annoyed, impressed, enraged)
3. **How does Strahd respond?** (Escalate, de-escalate, ignore, punish NPCs)
4. **What does this reveal about Strahd?** (Personality, goals, weaknesses)

**Example Improvisation:**
- **Party Action**: Party tries to sneak Ireena out of Barovia via **Tser Falls**
- **Strahd Learns**: Vistani informant reports party leaving Vallaki with Ireena
- **Strahd Feels**: Annoyed (party is persistent), amused (they think they can escape)
- **Strahd Responds**: Summons **fog wall** at Tser Falls, appears personally: "Did you truly think the mists would let you pass?"
- **Reveals**: Strahd controls Barovia's borders absolutely (mists are his prison and his weapon)

---

## Epic 3 Integration: Using the D&D 5e Mechanics Systems

This guide is designed to work seamlessly with the **Epic 3 (D&D 5e Mechanics Integration)** systems implemented in Stories 3-1 through 3-14. All of Strahd's abilities, legendary actions, lair actions, and vampire mechanics are **already supported** by the existing Epic 3 modules—no code modifications are required. This section provides a comprehensive reference for DMs on how to use each Epic 3 system with Strahd.

### Epic 3 Systems Overview

**Epic 3 delivers 14 systems** (Stories 3-1 through 3-14) that handle all D&D 5e mechanics:

| Story | System | Module | Strahd Usage |
|-------|--------|--------|--------------|
| **3-1** | Dice Rolling | DiceRoller | All attack rolls, damage rolls, save DCs |
| **3-2** | Character Sheet Parser | CharacterManager | Load Strahd's NPC profile YAML |
| **3-3** | Ability Checks | AbilityChecks | Athletics (grapple), Perception (detect stealth) |
| **3-4** | Skill Checks | SkillChecks | Insight, Intimidation, Stealth checks |
| **3-5** | Combat Manager | CombatManager | Initiative, turn order, combat state |
| **3-6** | Spell Database | SpellDatabase | All 16 spells (cantrips to 6th-level) |
| **3-7** | Spellcasting Module | SpellManager | Cast spells, track spell slots, concentration |
| **3-8** | Inventory Management | InventoryManager | Strahd's equipment (armor, weapons) |
| **3-9** | Level Up Calculator | LevelUpCalculator | Not used (Strahd is static CR 15) |
| **3-10** | Mechanics Slash Commands | `/roll`, `/check`, `/cast` | CLI shortcuts for DM |
| **3-11** | HP & Death Saves | HPManager | HP tracking, regeneration, Misty Escape |
| **3-12** | Condition Tracking | ConditionTracker | Charm, Invisible, Concentrating |
| **3-13** | Rest Mechanics | RestManager | Long rest in coffin (full HP, spell slots) |
| **3-14** | Equipment System | EquipmentManager | AC calculation, weapon stats |

### Strahd NPC Profile YAML Reference

**File Location:** `game-data/npcs/strahd_von_zarovich.yaml`

**How to Load:**
```javascript
const characterManager = new CharacterManager();
const result = await characterManager.loadNPC('strahd_von_zarovich');

if (result.success) {
  const strahd = result.data;
  console.log(strahd.stats.hp); // 144
  console.log(strahd.stats.ac); // 16
}
```

**Key Data Structures in Strahd's YAML:**

```yaml
# Basic Stats
stats:
  hp: 144
  ac: 16
  speed: 30
  cr: 15
  level: 9
  class: Wizard

# Abilities
abilities:
  str: 18 (+4)
  dex: 18 (+4)
  con: 18 (+4)
  int: 20 (+5)
  wis: 15 (+2)
  cha: 18 (+4)

# Saves (all +9)
saves:
  str: +9
  dex: +9
  con: +9
  int: +10
  wis: +7
  cha: +9

# Legendary Actions
legendary_actions:
  actions_per_round: 3
  actions:
    - name: Move
      cost: 1
      description: "Strahd moves up to his speed without provoking opportunity attacks"
    - name: Unarmed Strike
      cost: 1
      attack: +9
      damage: "1d8+4 slashing"
      effect: "Grapple target (DC 18 escape)"
    - name: Bite
      cost: 2
      prerequisite: "Grappled target"
      attack: +9
      damage: "1d6+4 piercing + 3d6 necrotic"
      effect: "Strahd regains HP equal to necrotic damage, target max HP reduced"

# Lair Actions (Castle Ravenloft only)
lair_actions:
  initiative: 20
  location_restriction: "castle_ravenloft"
  cannot_repeat: true
  actions:
    - name: Solid Fog
      effect: "20-ft cube, heavily obscured"
    - name: Pass Through Walls
      effect: "Walk through walls, move up to speed"
    - name: Control Doors
      effect: "All doors/windows within 120 ft, 3d6 bludgeoning if crushed"

# Vampire Abilities
vampire_abilities:
  regeneration:
    hp_per_turn: 20
    blocked_by: ["radiant_damage", "holy_water", "sunlight", "running_water"]
  charm:
    save_dc: 17
    duration: "24 hours"
    ability: "Wisdom"
  children_of_the_night:
    frequency: "1/day"
    summons: "2d4 bat/rat swarms OR 3d6 wolves"
    arrival_time: "1d4 rounds"
  shapechanger:
    forms: ["bat", "wolf", "mist", "humanoid"]
    action_cost: "action"
  misty_escape:
    trigger: "0 HP"
    exceptions: ["sunlight", "running_water"]
    coffin_deadline: "2 hours"
  sunlight_sensitivity:
    damage: "20 radiant per turn"
    disadvantage: "attacks, ability checks"
  running_water:
    damage: "20 acid per turn"
  spider_climb:
    speed: "normal"
    surfaces: "walls, ceilings"

# Spellcasting
spellcasting:
  level: 9
  class: Wizard
  spell_save_dc: 18
  spell_attack_bonus: +10
  cantrips:
    - mage_hand
    - prestidigitation
    - ray_of_frost
  level_1:
    slots: 4
    spells: [comprehend_languages, fog_cloud, sleep]
  level_2:
    slots: 3
    spells: [hold_person, invisibility, mirror_image]
  level_3:
    slots: 3
    spells: [animate_dead, fireball, nondetection]
  level_4:
    slots: 3
    spells: [blight, greater_invisibility, polymorph]
  level_5:
    slots: 2
    spells: [animate_objects, scrying]
  level_6:
    slots: 1
    spells: [move_earth]
```

### Using Epic 3 Systems with Strahd: Step-by-Step Workflows

#### Workflow 1: Starting Combat with Strahd

**System Used:** CombatManager (Story 3-5), DiceRoller (Story 3-1)

**Steps:**
1. **Initialize Combat:**
   ```javascript
   const combat = new CombatManager();
   const result = await combat.startCombat({
     combatants: [
       { id: 'strahd', name: 'Strahd von Zarovich', initiative: 0 },
       { id: 'pc1', name: 'Kapi', initiative: 0 },
       { id: 'pc2', name: 'Fighter', initiative: 0 },
       { id: 'lair', name: 'Lair Actions', initiative: 20 } // Fixed initiative
     ]
   });
   ```

2. **Roll Initiative:**
   ```javascript
   const diceRoller = new DiceRoller();

   // Strahd: +4 Dex modifier
   const strahdInit = diceRoller.roll('1d20+4');
   combat.setCombatantInitiative('strahd', strahdInit.total);

   // PCs roll their own initiative
   combat.setCombatantInitiative('pc1', 18);
   combat.setCombatantInitiative('pc2', 12);
   ```

3. **Get Turn Order:**
   ```javascript
   const turnOrder = combat.getTurnOrder();
   // Example: [Lair (20), Kapi (18), Strahd (15), Fighter (12)]
   ```

**DM Notes:**
- Add "Lair Actions" as a pseudo-combatant at initiative 20 (fixed)
- Strahd's initiative bonus is +4 (Dex modifier)
- Use CombatManager's turn tracking to prompt for legendary actions at end of each PC's turn

#### Workflow 2: Strahd Uses Legendary Action (Bite)

**System Used:** DiceRoller (Story 3-1), HPManager (Story 3-11), ConditionTracker (Story 3-12)

**Steps:**
1. **Check Prerequisites:**
   ```javascript
   const conditionTracker = new ConditionTracker();
   const isGrappled = conditionTracker.hasCondition('pc1', 'Grappled');

   if (!isGrappled) {
     console.log("Bite requires grappled target—use Unarmed Strike first");
     return;
   }
   ```

2. **Roll Attack:**
   ```javascript
   const diceRoller = new DiceRoller();
   const attackRoll = diceRoller.roll('1d20+9'); // +9 to hit

   if (attackRoll.total >= targetAC) {
     console.log("Bite hits!");
   }
   ```

3. **Roll Damage:**
   ```javascript
   const piercingDamage = diceRoller.roll('1d6+4').total; // 5-10
   const necroticDamage = diceRoller.roll('3d6').total;   // 3-18
   const totalDamage = piercingDamage + necroticDamage;

   console.log(`Bite deals ${piercingDamage} piercing + ${necroticDamage} necrotic = ${totalDamage} total`);
   ```

4. **Apply Damage to PC:**
   ```javascript
   const hpManager = new HPManager();
   hpManager.takeDamage('pc1', totalDamage);
   ```

5. **Apply Healing to Strahd (Regeneration):**
   ```javascript
   const healingAmount = necroticDamage; // Strahd regains HP equal to necrotic damage
   hpManager.heal('strahd', healingAmount);

   console.log(`Strahd regains ${healingAmount} HP from Bite`);
   ```

6. **Apply Max HP Reduction to PC:**
   ```javascript
   // DM tracks manually (Epic 3 HPManager doesn't auto-reduce max HP)
   console.log(`PC's max HP reduced by ${necroticDamage} until long rest`);
   ```

7. **Decrement Legendary Actions:**
   ```javascript
   // DM tracks manually: 3 → 1 (Bite costs 2 actions)
   strahdLegendaryActions = 1;
   ```

**DM Notes:**
- Bite costs 2 legendary actions (only 1 remaining after Bite)
- Healing is critical when Strahd is bloodied (<72 HP)
- Max HP reduction stacks (multiple Bites reduce max HP cumulatively)

#### Workflow 3: Strahd Casts Greater Invisibility

**System Used:** SpellManager (Story 3-7), ConditionTracker (Story 3-12), SpellDatabase (Story 3-6)

**Steps:**
1. **Check Spell Availability:**
   ```javascript
   const spellManager = new SpellManager();
   const canCast = spellManager.canCastSpell('strahd', 'greater_invisibility', 4); // 4th-level

   if (!canCast) {
     console.log("No 4th-level spell slots remaining");
     return;
   }
   ```

2. **Cast Spell:**
   ```javascript
   const castResult = spellManager.castSpell('strahd', 'greater_invisibility', {
     target: 'strahd',
     concentration: true
   });

   if (castResult.success) {
     console.log("Strahd casts Greater Invisibility (concentration, 1 minute)");
   }
   ```

3. **Track Concentration:**
   ```javascript
   const conditionTracker = new ConditionTracker();
   conditionTracker.addCondition('strahd', {
     name: 'Concentrating',
     effect: 'Concentrating on Greater Invisibility',
     duration: 10 // 10 rounds = 1 minute
   });
   ```

4. **Apply Invisible Condition:**
   ```javascript
   conditionTracker.addCondition('strahd', {
     name: 'Invisible',
     effect: 'Attacks against Strahd have disadvantage, Strahd has advantage on attacks',
     duration: 10 // 10 rounds
   });
   ```

5. **Check Concentration on Damage:**
   ```javascript
   // When Strahd takes damage
   const damage = 25;
   const concentrationDC = Math.max(10, Math.floor(damage / 2)); // DC 12

   const diceRoller = new DiceRoller();
   const conSave = diceRoller.roll('1d20+9').total; // +9 Con save

   if (conSave < concentrationDC) {
     console.log("Concentration broken—Greater Invisibility ends");
     conditionTracker.removeCondition('strahd', 'Invisible');
     conditionTracker.removeCondition('strahd', 'Concentrating');
   }
   ```

**DM Notes:**
- Greater Invisibility lasts 1 minute (10 rounds), requires concentration
- Unlike Invisibility (2nd-level), Greater Invisibility does NOT break when Strahd attacks
- Strahd's concentration save is +9 (Con modifier +4 + proficiency +5)
- Breaking concentration ends both Invisible and Concentrating conditions

#### Workflow 4: Strahd's Regeneration (Start of Turn)

**System Used:** HPManager (Story 3-11), ConditionTracker (Story 3-12)

**Steps:**
1. **Check HP Threshold:**
   ```javascript
   const hpManager = new HPManager();
   const strahdHP = hpManager.getCurrentHP('strahd');

   if (strahdHP === 0) {
     console.log("Strahd at 0 HP—Misty Escape triggers instead of regeneration");
     return; // Skip regeneration, handle Misty Escape
   }
   ```

2. **Check for Regeneration Blockers:**
   ```javascript
   const conditionTracker = new ConditionTracker();
   const hasRadiantDamage = conditionTracker.hasCondition('strahd', 'Radiant Damage This Turn');
   const inSunlight = conditionTracker.hasCondition('strahd', 'Sunlight');
   const inRunningWater = conditionTracker.hasCondition('strahd', 'Running Water');

   if (hasRadiantDamage || inSunlight || inRunningWater) {
     console.log("Regeneration blocked this turn");
     return;
   }
   ```

3. **Apply Regeneration:**
   ```javascript
   const healAmount = 20; // Fixed 20 HP per turn
   hpManager.heal('strahd', healAmount);

   const newHP = hpManager.getCurrentHP('strahd');
   console.log(`Strahd regenerates ${healAmount} HP (now ${newHP}/144)`);
   ```

4. **Clear "Radiant Damage This Turn" Flag:**
   ```javascript
   // At end of Strahd's turn, clear flag for next turn
   conditionTracker.removeCondition('strahd', 'Radiant Damage This Turn');
   ```

**DM Notes:**
- Regeneration happens at **start** of Strahd's turn (before actions)
- Blocked by radiant damage **this turn** (flag cleared at end of turn)
- Does NOT work if Strahd is at 0 HP (Misty Escape triggers instead)
- Party must deal radiant damage **every turn** to prevent healing (20 HP/turn = 200 HP over 10 rounds)

#### Workflow 5: Strahd's Misty Escape (0 HP Auto-Trigger)

**System Used:** HPManager (Story 3-11), ConditionTracker (Story 3-12), EventScheduler (Epic 2, Story 2-3)

**Steps:**
1. **Detect 0 HP Trigger:**
   ```javascript
   const hpManager = new HPManager();
   const strahdHP = hpManager.getCurrentHP('strahd');

   if (strahdHP === 0) {
     console.log("Strahd reduced to 0 HP—Misty Escape triggers!");
   }
   ```

2. **Check for Exceptions:**
   ```javascript
   const conditionTracker = new ConditionTracker();
   const inSunlight = conditionTracker.hasCondition('strahd', 'Sunlight');
   const inRunningWater = conditionTracker.hasCondition('strahd', 'Running Water');

   if (inSunlight || inRunningWater) {
     console.log("Misty Escape FAILS—Strahd is destroyed in sunlight/running water");
     hpManager.setHP('strahd', 0); // Permanent death
     return;
   }
   ```

3. **Transform to Mist Form:**
   ```javascript
   conditionTracker.addCondition('strahd', {
     name: 'Mist Form',
     effect: 'Speed 20 ft fly, immune to all damage, cannot attack/cast, can pass through tiny gaps',
     duration: 999 // Until reaches coffin
   });

   hpManager.setHP('strahd', 0); // Remains at 0 HP in mist form
   console.log("Strahd transforms into mist and flees to coffin");
   ```

4. **Schedule Coffin Deadline (Epic 2 EventScheduler):**
   ```javascript
   const eventScheduler = new EventScheduler();
   const calendarManager = new CalendarManager();
   const currentTime = calendarManager.getCurrentTime(); // e.g., "735-10-15, 14:30"
   const deadline = calendarManager.addHours(currentTime, 2); // 2-hour deadline

   eventScheduler.scheduleEvent({
     eventId: 'strahd_misty_escape_deadline',
     trigger_date: deadline.date,
     trigger_time: deadline.time,
     effect: {
       type: 'custom',
       description: 'Strahd must reach coffin or be destroyed'
     }
   });

   console.log(`Strahd has until ${deadline.date} ${deadline.time} to reach coffin`);
   ```

5. **Coffin Regeneration (8 Hours):**
   ```javascript
   // When Strahd reaches coffin
   conditionTracker.removeCondition('strahd', 'Mist Form');

   const restManager = new RestManager();
   const restResult = restManager.longRest('strahd', {
     duration: 8, // 8 hours in coffin
     location: 'K86 Strahd\'s Coffin'
   });

   if (restResult.success) {
     hpManager.setHP('strahd', 144); // Full HP
     spellManager.restoreAllSlots('strahd'); // All spell slots
     console.log("Strahd regenerates to full HP and spell slots");
   }
   ```

**DM Notes:**
- Misty Escape is **automatic** at 0 HP (not optional)
- 2-hour deadline is strict (Strahd destroyed if fails to reach coffin)
- Party can pursue to coffin and stake Strahd while regenerating (only way to permanently kill)
- Coffin location is **K86 Strahd's Tomb** in Castle Ravenloft (hidden behind secret door)

#### Workflow 6: Lair Action (Solid Fog at Initiative 20)

**System Used:** CombatManager (Story 3-5), ConditionTracker (Story 3-12)

**Steps:**
1. **Check Initiative Count:**
   ```javascript
   const combat = new CombatManager();
   const currentInit = combat.getCurrentInitiative();

   if (currentInit === 20) {
     console.log("Initiative count 20—Lair action available");
   }
   ```

2. **Check Location Restriction:**
   ```javascript
   const locationManager = new LocationManager();
   const currentLocation = locationManager.getCurrentLocation();

   if (!currentLocation.includes('castle_ravenloft')) {
     console.log("Lair actions only work in Castle Ravenloft");
     return;
   }
   ```

3. **Check Cannot-Repeat Rule:**
   ```javascript
   // DM tracks last lair action used
   if (lastLairAction === 'Solid Fog') {
     console.log("Cannot repeat Solid Fog—choose Pass Through Walls or Control Doors");
     return;
   }
   ```

4. **Apply Solid Fog Effect:**
   ```javascript
   const conditionTracker = new ConditionTracker();

   // Apply "Heavily Obscured" to all combatants in 20-ft cube
   conditionTracker.addCondition('pc1', {
     name: 'Heavily Obscured',
     effect: 'Blinded (attacks/checks relying on sight have disadvantage)',
     duration: 10 // 10 rounds = 1 minute
   });

   console.log("Lair Action: Solid Fog creates 20-ft cube of heavy obscurement");
   ```

5. **Update Last Lair Action:**
   ```javascript
   lastLairAction = 'Solid Fog'; // Prevent repeat next round
   ```

**DM Notes:**
- Lair actions occur at initiative 20 (before most combatants)
- Cannot repeat same lair action two rounds in a row
- Only works in Castle Ravenloft (K1-K90 locations)
- Heavily Obscured = attacks have disadvantage, no line of sight

### Epic 3 Integration: Quick Reference Tables

#### Table 1: Strahd's Attack Actions

| Action | Type | Attack Bonus | Damage | Special |
|--------|------|--------------|--------|---------|
| **Unarmed Strike** | Melee | +9 | 1d8+4 slashing | Grapple (DC 18) |
| **Bite** | Melee | +9 | 1d6+4 piercing + 3d6 necrotic | Requires grapple, heals Strahd, max HP reduction |
| **Ray of Frost** | Cantrip | +10 | 2d8 cold | Reduce speed by 10 ft |

**Epic 3 Systems:** DiceRoller (rolls), HPManager (damage/healing), ConditionTracker (grapple)

#### Table 2: Strahd's Spell Slots and Usage

| Level | Slots | Key Spells | Tactical Use | Epic 3 System |
|-------|-------|------------|--------------|---------------|
| **1st** | 4 | Fog Cloud, Sleep | Escape, incapacitate | SpellManager, SpellDatabase |
| **2nd** | 3 | Hold Person, Mirror Image | Paralyze, defense | SpellManager, ConditionTracker |
| **3rd** | 3 | Fireball, Animate Dead | AOE damage, minions | SpellManager, DiceRoller |
| **4th** | 3 | Greater Invisibility, Blight | Advantage, burst damage | SpellManager, ConditionTracker |
| **5th** | 2 | Scrying, Animate Objects | Intelligence, minions | SpellManager (scrying = roleplay) |
| **6th** | 1 | Move Earth | Terrain control | SpellManager (DM adjudication) |

**DM Note:** SpellManager automatically tracks spell slots and concentration

#### Table 3: Legendary Actions Cost and Effects

| Action | Cost | System | DM Adjudication Needed? |
|--------|------|--------|-------------------------|
| **Move** | 1 | CombatManager (movement) | YES (track pool, prompt at turn end) |
| **Unarmed Strike** | 1 | DiceRoller, HPManager | YES (track pool, grapple DC) |
| **Bite** | 2 | DiceRoller, HPManager | YES (track pool, heal Strahd, max HP reduction) |

**Pool Tracking:** DM manually tracks 3 legendary actions per round (reset at Strahd's turn)

#### Table 4: Vampire Abilities and Epic 3 Systems

| Ability | Trigger | Epic 3 System | DM Adjudication |
|---------|---------|---------------|-----------------|
| **Regeneration** | Start of turn | HPManager (heal 20 HP) | Check for radiant damage blocker |
| **Charm** | Action | ConditionTracker (Charmed 24 hrs) | DC 17 Wisdom save |
| **Children of the Night** | 1/day | EventScheduler (summon in 1d4 rounds) | Roll 2d4 (bats) or 3d6 (wolves) |
| **Shapechanger** | Action | ConditionTracker (Bat/Wolf/Mist form) | DM tracks current form |
| **Misty Escape** | 0 HP | HPManager (set to mist), EventScheduler (2hr deadline) | Check for sunlight/water exceptions |
| **Sunlight Sensitivity** | In sunlight | HPManager (20 damage/turn), DiceRoller (disadvantage) | Check location metadata |
| **Running Water** | In water | HPManager (20 damage/turn) | Check location metadata |
| **Spider Climb** | Passive | CombatManager (3D positioning) | No check required |

### Epic 3 Integration: What Works Out-of-Box vs What Needs DM Adjudication

**✅ Works Automatically (No DM Tracking Required):**
- Attack rolls (DiceRoller handles +9 to hit)
- Damage rolls (DiceRoller handles 1d8+4, 3d6, etc.)
- HP tracking (HPManager tracks current/max HP)
- Spell slot consumption (SpellManager decrements slots)
- Concentration checks (ConditionTracker + DiceRoller for DC)
- Initiative order (CombatManager sorts by initiative)
- Condition duration (ConditionTracker counts down rounds)

**⚠️ Needs DM Adjudication:**
- **Legendary Actions Pool**: DM tracks 3/3 → 2/3 → 0/3, reset at Strahd's turn
- **Legendary Action Prompts**: DM asks "Use legendary action?" at end of each PC's turn
- **Lair Action Cannot-Repeat**: DM tracks last lair action used
- **Lair Action Location Check**: DM verifies combat is in Castle Ravenloft
- **Regeneration Blockers**: DM checks if radiant damage was dealt this turn
- **Misty Escape Exceptions**: DM checks if Strahd is in sunlight/running water
- **Max HP Reduction (Bite)**: DM manually reduces PC's max HP until long rest
- **Grapple Escape DC**: DM prompts grappled PC to make DC 18 Strength/Dex check

**🔮 Future Epic 5 Enhancements (Automated DM Tools):**
- `/legendary-action` slash command (auto-prompt, auto-track pool)
- `/lair-action` slash command (auto-check location, auto-prevent repeats)
- Auto-regeneration check (detect radiant damage blocker)
- Auto-Misty Escape trigger (detect 0 HP, check exceptions)
- UI indicators (legendary actions remaining, lair action available)

---

## DM Tools and Guidance

This section provides practical tools for DMs running Strahd encounters, including combat tracking sheets, decision trees, and session prep checklists.

### Strahd Combat Tracking Sheet (DM Reference)

**Print this and keep it behind your DM screen during Strahd encounters:**

```
═══════════════════════════════════════════════════════════════
STRAHD VON ZAROVICH - COMBAT TRACKER
═══════════════════════════════════════════════════════════════

BASIC STATS:
HP: [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] (144 total, 14 boxes = 10 HP each)
AC: 16 | Speed: 30 ft | Initiative: +4

CURRENT PHASE: [ ] Observation  [ ] Testing  [ ] Psychological  [ ] Engagement  [ ] Retreat

LEGENDARY ACTIONS: [ ] [ ] [ ]  (Reset at start of Strahd's turn)
  - Move (1): 30 ft, no opportunity attacks
  - Unarmed Strike (1): +9, 1d8+4, grapple DC 18
  - Bite (2): +9, 1d6+4 + 3d6 necrotic, PREREQUISITE: grappled target

LAIR ACTIONS (Castle Ravenloft only, Initiative 20):
  Last Used: _______________  (Cannot repeat same action twice)
  - Solid Fog (20-ft cube, heavily obscured)
  - Pass Through Walls (move through walls)
  - Control Doors (all doors within 120 ft, 3d6 crush damage)

SPELL SLOTS:
  1st: [ ] [ ] [ ] [ ]  (Fog Cloud, Sleep)
  2nd: [ ] [ ] [ ]  (Hold Person, Mirror Image)
  3rd: [ ] [ ] [ ]  (Fireball, Animate Dead)
  4th: [ ] [ ] [ ]  (Greater Invisibility, Blight, Polymorph)
  5th: [ ] [ ]  (Scrying, Animate Objects)
  6th: [ ]  (Move Earth)

CONCENTRATION: [ ] Active  Spell: _________________  Duration: _____ rounds

VAMPIRE ABILITIES:
  Regeneration: 20 HP/turn (start of turn, blocked by radiant damage this turn)
    [ ] Radiant damage dealt this turn (blocks regeneration)
  Charm: DC 17 Wisdom save, 24 hours (used on: _________________)
  Children of the Night: [ ] Used today (1/day, 1d4 rounds arrival)
  Shapechanger: Current form: [ ] Humanoid  [ ] Bat  [ ] Wolf  [ ] Mist
  Misty Escape: Auto-trigger at 0 HP (2-hour coffin deadline)

CONDITIONS:
  [ ] Invisible (Greater Invisibility, 10 rounds)
  [ ] Concentrating (spell: _________________)
  [ ] Bloodied (<72 HP - use Mirror Image, retreat if <30 HP)
  [ ] In Sunlight (20 radiant/turn, disadvantage, blocks regeneration)
  [ ] In Running Water (20 acid/turn)

TACTICAL NOTES:
  - Target Priority: Healers > Spellcasters > Ranged > Melee
  - When Bloodied: Mirror Image + Retreat tactics
  - Retreat Threshold: <30 HP OR Sunsword active OR 2+ artifacts
  - Ireena Present: Prioritize her safety over tactics

SESSION PREP CHECKLIST:
  [ ] Reviewed current party level and phase
  [ ] Prepared appropriate spells for encounter
  [ ] Noted party weaknesses (low Wisdom, no radiant damage, etc.)
  [ ] Prepared psychological warfare hooks (charmed NPCs, dream haunting, etc.)
  [ ] Identified escape route (nearest wall to phase through, coffin location)

═══════════════════════════════════════════════════════════════
```

### Strahd Decision Tree: "What Does Strahd Do Now?"

**Use this flowchart when improvising Strahd's next action:**

```
START: What situation is Strahd in?
│
├─ **Is Strahd at 0 HP?**
│  └─ YES → Misty Escape triggers (auto)
│     ├─ In sunlight/running water? → Strahd DESTROYED
│     └─ Otherwise → Mist form, flee to coffin (2-hour deadline)
│
├─ **Is Strahd bloodied (<72 HP)?**
│  └─ YES → Defensive tactics
│     ├─ Cast Mirror Image (if not active)
│     ├─ Use Legendary Move to escape melee
│     ├─ Use Bite on grappled target (heal ~10 HP)
│     └─ Retreat if <30 HP (Phase 5)
│
├─ **Is Ireena present?**
│  └─ YES → Prioritize Ireena's safety
│     ├─ Charm Ireena (DC 17)
│     ├─ Attack anyone threatening Ireena
│     └─ Never retreat if Ireena is in danger
│
├─ **Is party fleeing?**
│  └─ YES → Punish cowardice
│     ├─ Pursue (Legendary Move x3 = 90 ft)
│     ├─ Cast Blight on fleeing spellcaster
│     └─ Summon Children of the Night (block escape)
│
├─ **Is Strahd concentrating on spell?**
│  └─ YES → Protect concentration
│     ├─ Use Legendary Move to avoid attacks
│     ├─ Position behind cover
│     └─ Cast Mirror Image for defense
│
├─ **What phase is Strahd in?**
│  ├─ Phase 1 (Observation) → Scout, no combat, flee if engaged
│  ├─ Phase 2 (Testing) → Hit-and-run, charm 1 PC, flee after 3 rounds
│  ├─ Phase 3 (Psychological) → Scrying, dream haunting, moral dilemmas
│  └─ Phase 4 (Engagement) → Full combat, use all abilities
│
└─ **Default Combat Action (Phase 4):**
   ├─ Turn 1: Cast Greater Invisibility + Spider Climb to ceiling
   ├─ Lair Action (if Castle Ravenloft): Solid Fog or Pass Through Walls
   ├─ Target Priority: Healer > Spellcaster > Ranged > Melee
   ├─ Legendary Actions: Bite (if grappled target) OR Move (kite party)
   └─ When spell slots low: Use Unarmed Strike + Bite combo (healing)
```

### Session Prep: Running a Strahd Encounter

**Before the session, answer these questions:**

1. **What phase is Strahd in?** (Observation, Testing, Psychological, Engagement, Retreat)
   - **Drives:** Tactics, retreat threshold, objectives

2. **What does Strahd know about the party?** (via scrying, spies, charmed NPCs)
   - **Knows:** Party composition, recent conversations, weaknesses, artifact locations
   - **Use:** Tailor tactics (target healer, exploit low Wisdom, avoid Sunsword user)

3. **What is Strahd's goal this encounter?** (Scout, test, charm, kill, retrieve Ireena)
   - **Phase 1-2:** Scout and escape (no death, gather intel)
   - **Phase 3:** Charm 1 PC, plant paranoia (retreat after 3 rounds)
   - **Phase 4:** Kill or incapacitate party (retreat if bloodied)

4. **Where does this encounter happen?** (Castle Ravenloft, village, wilderness)
   - **Castle Ravenloft:** Lair actions available, home field advantage
   - **Outside:** No lair actions, but can summon Children of the Night

5. **What environmental factors apply?** (Time of day, weather, terrain)
   - **Night:** Strahd at full strength
   - **Day:** Avoid sunlight (take 20 radiant/turn, disadvantage)
   - **Fog/Rain:** Obscured vision (advantage for Strahd's stealth)

6. **What resources has Strahd expended?** (Spell slots, Children of the Night, legendary actions)
   - **Fresh:** Full spell slots, all abilities available
   - **Depleted:** Used 4th+ level slots, Children summoned today (can't summon again)

7. **What is Strahd's escape plan?** (Nearest wall to phase through, mist form route to coffin)
   - **Castle Ravenloft:** Pass Through Walls lair action → K86 Coffin
   - **Outside:** Shapechanger (bat) → fly to castle → coffin

### Common DM Mistakes and How to Avoid Them

**Mistake #1: Strahd fights to the death**
- **Why Wrong:** Strahd has lived 400+ years by being cautious and strategic
- **Fix:** Retreat at <30 HP, use Misty Escape at 0 HP, return later fully healed

**Mistake #2: Strahd ignores Ireena during combat**
- **Why Wrong:** Ireena is Strahd's obsession (reincarnation of Tatyana)
- **Fix:** Prioritize Ireena's safety, never retreat if Ireena is in danger, charm/protect her

**Mistake #3: Strahd uses Legendary Actions on his own turn**
- **Why Wrong:** Legendary actions are used at **end of other creatures' turns** (not Strahd's turn)
- **Fix:** Prompt yourself after each PC's turn: "Strahd has 3 legendary actions—use any?"

**Mistake #4: Strahd repeats same lair action two rounds in a row**
- **Why Wrong:** Lair action cannot-repeat rule (DMG p. 11)
- **Fix:** Track last lair action used on combat tracker, rotate between 3 actions

**Mistake #5: Strahd regenerates while in sunlight**
- **Why Wrong:** Regeneration is blocked by radiant damage, sunlight deals 20 radiant/turn
- **Fix:** Check for regeneration blockers at start of Strahd's turn (radiant damage, sunlight, running water)

**Mistake #6: Party kills Strahd permanently in first encounter**
- **Why Wrong:** Strahd is campaign-spanning villain (Levels 1-10)
- **Fix:** Use Misty Escape to flee at 0 HP, party must stake Strahd in coffin for permanent death

**Mistake #7: Strahd uses all spell slots in one encounter**
- **Why Wrong:** Strahd is strategic, saves high-level slots for emergencies
- **Fix:** Use cantrips/low-level slots in Phases 1-3, save 4th+ level for Phase 4

### Adjusting Difficulty for Party Level

**Party Level 1-3 (Phase 1: Observation):**
- **Strahd's Goal:** Scout and intimidate
- **Tactics:** Appear briefly, deliver monologue, disappear (no combat)
- **Adjustment:** If party attacks, Strahd uses Legendary Move to escape (don't engage)

**Party Level 3-5 (Phase 2: Testing):**
- **Strahd's Goal:** Test party capabilities
- **Tactics:** 1 spell (Hold Person or Charm), 1-2 attacks, retreat after 3 rounds
- **Adjustment:** Use hit-and-run, don't use Bite (too deadly), flee if party deals >30 damage

**Party Level 5-7 (Phase 3: Psychological Warfare):**
- **Strahd's Goal:** Break morale, charm allies
- **Tactics:** Scrying, dream haunting (Dream spell on Ireena), moral dilemmas
- **Adjustment:** Minimal direct combat, focus on psychological pressure

**Party Level 7-10 (Phase 4: Engagement):**
- **Strahd's Goal:** Defeat or kill party
- **Tactics:** Full combat, all abilities, retreat only if bloodied
- **Adjustment:** If party has 2+ artifacts, increase difficulty (summon vampire brides, use lair to advantage)

### Balancing Strahd for Solo vs Party

**Solo PC (e.g., Kapi):**
- **Reduce Legendary Actions:** 2 per round instead of 3
- **No Lair Actions:** Too punishing for solo player
- **Strahd Retreats Earlier:** <50 HP instead of <30 HP
- **Use Children of the Night Sparingly:** 1d4 wolves instead of 3d6 (action economy balance)

**Large Party (6+ PCs):**
- **Increase Legendary Actions:** 4 per round instead of 3
- **Add Minions:** Summon Children of the Night (3d6 wolves) or vampire spawn allies
- **Use Lair Actions Aggressively:** All 3 lair actions in rotation
- **Strahd Retreats Later:** <20 HP instead of <30 HP (party has more resources)

---

## Epic 5 Enhancement Recommendations

This section outlines potential **Epic 5 (LLM-DM Integration & VS Code Workflows)** features that would automate Strahd AI behavior and legendary creature mechanics. These are **future enhancements** (Story 5-1 through 5-11)—Story 4-17 delivers **documentation only**.

### Recommended Epic 5 Features for Strahd AI

**Feature 1: Legendary Actions Automation**
- **Story:** 5-4 (Enhanced Slash Commands)
- **Slash Command:** `/legendary-action <npc-id> <action-name>`
- **Functionality:**
  - Auto-prompt DM at end of each PC's turn: "Strahd has 3 legendary actions remaining. Use any?"
  - Auto-decrement legendary action pool when used (3 → 2 → 1 → 0)
  - Auto-reset pool at start of Strahd's turn (0 → 3)
  - Validate prerequisites (e.g., Bite requires grappled target)
  - Auto-execute Epic 3 systems (DiceRoller, HPManager, ConditionTracker)
- **UI Integration:** Story 5-5 (VS Code UI Improvements) - Show legendary actions remaining in sidebar

**Feature 2: Lair Actions Automation**
- **Story:** 5-4 (Enhanced Slash Commands)
- **Slash Command:** `/lair-action <action-name>`
- **Functionality:**
  - Auto-check current location (only works in Castle Ravenloft)
  - Auto-check initiative count (only triggers at initiative 20)
  - Auto-prevent repeats (track last lair action used)
  - Auto-apply effects (Solid Fog → add Heavily Obscured condition via ConditionTracker)
- **UI Integration:** Story 5-5 - Show "Lair Action Available" indicator when initiative count 20

**Feature 3: Auto-Regeneration Check**
- **Story:** 5-1 (Intelligent Context Loader)
- **Trigger:** Start of Strahd's turn
- **Functionality:**
  - Auto-check HP >0 (skip if Strahd at 0 HP)
  - Auto-check for blockers (ConditionTracker: Radiant Damage This Turn, Sunlight, Running Water)
  - Auto-heal 20 HP if no blockers (HPManager)
  - Auto-clear "Radiant Damage This Turn" flag at end of Strahd's turn
- **Narration:** LLM generates flavor text: "Strahd's wounds close rapidly as dark magic knits his flesh together."

**Feature 4: Auto-Misty Escape Trigger**
- **Story:** 5-1 (Intelligent Context Loader) + Epic 2 EventScheduler
- **Trigger:** Strahd HP reaches 0
- **Functionality:**
  - Auto-check exceptions (ConditionTracker: Sunlight, Running Water)
  - If exceptions: Strahd destroyed (permanent death)
  - If no exceptions: Transform to mist form, schedule 2-hour coffin deadline (EventScheduler)
  - Auto-generate narration: "Strahd's form dissolves into mist and flees toward Castle Ravenloft."
- **Epic 2 Integration:** EventScheduler creates deadline event, alerts DM when 2 hours pass

**Feature 5: Phase-Based AI Behavior Prompts**
- **Story:** 5-3 (LLM Prompt Templates)
- **Trigger:** DM asks "What does Strahd do now?"
- **Functionality:**
  - Load current phase from game state (Observation, Testing, Psychological, Engagement, Retreat)
  - Load party level, location, Strahd's HP, spell slots remaining
  - Generate phase-appropriate action suggestions:
    - Phase 1: "Strahd observes from shadows. Scout party capabilities, note weaknesses, flee if engaged."
    - Phase 4: "Strahd casts Greater Invisibility, uses Spider Climb to ceiling, targets healer with Blight."
  - Include retreat conditions: "Strahd is bloodied (<72 HP). Consider Mirror Image for defense."

**Feature 6: Dynamic Psychological Warfare Generator**
- **Story:** 5-3 (LLM Prompt Templates)
- **Trigger:** DM requests psychological warfare scenario
- **Functionality:**
  - Analyze party journal (recent events, NPC relationships, fears)
  - Generate custom scenario:
    - If party failed to save NPC: "Strahd raises NPC as zombie, delivers message: 'You could not protect them.'"
    - If party has secret: "Strahd reveals knowledge via scrying: 'Your sister sends her regards, paladin.'"
  - Provide 3 scenario options (Dinner Invitation, Dream Haunting, Moral Dilemma)

**Feature 7: Strahd Encounter Difficulty Scaler**
- **Story:** 5-1 (Intelligent Context Loader)
- **Trigger:** DM initiates Strahd encounter
- **Functionality:**
  - Analyze party: level, size, artifacts possessed, radiant damage sources
  - Auto-scale difficulty:
    - Party Level 3: Phase 2 tactics, limited spell slots, retreat after 3 rounds
    - Party Level 9 + 2 artifacts: Phase 4 tactics, summon vampire brides, use all lair actions
  - Provide DM recommendation: "Party has Sunsword and Holy Symbol. Recommended: Add 2 vampire spawn allies, Strahd retreats at <20 HP."

**Feature 8: Combat Narration Generator**
- **Story:** 5-3 (LLM Prompt Templates)
- **Trigger:** After each Strahd action (attack, spell, legendary action)
- **Functionality:**
  - Generate atmospheric narration based on action type:
    - Bite: "Strahd's fangs sink into your neck, draining your life force. You feel your very essence weaken."
    - Misty Escape: "Strahd's eyes widen in surprise as your blade pierces his heart. His form dissolves into crimson mist, fleeing toward the castle with unnatural speed."
    - Greater Invisibility: "Strahd's form flickers and vanishes. You hear his mocking laughter echoing from all directions."

**Feature 9: Strahd Knowledge Base (Scrying Log)**
- **Story:** 5-6 (Session Management)
- **Data Structure:** Track what Strahd knows about party
  - **Conversations Overheard:** Via scrying (DC 18 Wisdom save to detect)
  - **Weaknesses Observed:** Low Wisdom saves, no radiant damage, fighter has low Dex
  - **Artifacts Possessed:** Party has Holy Symbol (acquired Session 12), seeking Sunsword
  - **NPC Relationships:** Ireena trusts party, Ismark is party ally
- **Usage:** LLM references knowledge base when generating Strahd dialogue/tactics

**Feature 10: Strahd Character Sheet Sidebar**
- **Story:** 5-8 (Character Sheet Sidebar)
- **UI Panel:** Real-time Strahd stat tracker
  - HP: 144/144 (bar chart, turns red when bloodied)
  - Legendary Actions: ●●● (3/3, auto-reset at Strahd's turn)
  - Spell Slots: [4][3][3][3][2][1] (check boxes, auto-decrement when cast)
  - Current Phase: "Phase 4: Engagement"
  - Conditions: "Concentrating (Greater Invisibility, 7 rounds remaining)"
- **Integration:** Updates in real-time as Epic 3 systems modify Strahd's state

### Implementation Priority for Epic 5

**High Priority (Critical for Strahd Encounters):**
1. Legendary Actions Automation (Feature 1) - Most complex manual tracking
2. Auto-Regeneration Check (Feature 3) - Easy to forget, high impact
3. Phase-Based AI Behavior Prompts (Feature 5) - DM decision support

**Medium Priority (Quality of Life):**
4. Lair Actions Automation (Feature 2) - Only matters in Castle Ravenloft
5. Auto-Misty Escape Trigger (Feature 4) - Rare but critical when it happens
6. Strahd Character Sheet Sidebar (Feature 10) - Visual aid, reduces cognitive load

**Low Priority (Nice to Have):**
7. Dynamic Psychological Warfare Generator (Feature 6) - DM can improvise
8. Combat Narration Generator (Feature 8) - Flavor, not mechanics
9. Strahd Knowledge Base (Feature 9) - DM can track manually
10. Strahd Encounter Difficulty Scaler (Feature 7) - One-time setup per phase

---

## Appendices

### Appendix A: Quick Reference Tables

**Strahd's Vital Stats**
| Stat | Value |
|------|-------|
| HP | 144 (bloodied at 72, retreat at 30) |
| AC | 16 (natural armor) |
| Speed | 30 ft (walk), 30 ft (climb via Spider Climb) |
| CR | 15 (13,000 XP) |
| Proficiency | +5 |
| Initiative | +4 (Dex modifier) |

**Strahd's Saves**
| Save | Bonus | Note |
|------|-------|------|
| Strength | +9 | Proficient |
| Dexterity | +9 | Proficient |
| Constitution | +9 | Proficient (concentration checks) |
| Intelligence | +10 | Proficient |
| Wisdom | +7 | Proficient |
| Charisma | +9 | Proficient |

**Strahd's Damage Vulnerabilities**
| Vulnerability | Effect |
|---------------|--------|
| Radiant Damage | Blocks regeneration for 1 turn |
| Sunlight | 20 radiant damage/turn, disadvantage on attacks/checks, blocks regeneration |
| Running Water | 20 acid damage/turn, prevents Misty Escape |
| Stake in Coffin | Permanent death (only way to truly kill Strahd) |

**Strahd's Damage Immunities/Resistances**
| Type | Effect |
|------|--------|
| Nonmagical Weapons | Resistant (half damage from non-magical bludgeoning/piercing/slashing) |
| Necrotic Damage | Immune (Strahd is undead) |
| Poison | Immune (undead condition immunity) |
| Charm | Immune (undead condition immunity) |

### Appendix B: Strahd NPC Profile Reference

**File Location:** `game-data/npcs/strahd_von_zarovich.yaml`

**Quick Stats:**
- **Race:** Vampire (undead)
- **Class:** Wizard (9th-level)
- **Alignment:** Lawful Evil
- **Languages:** Common, Draconic, Elvish, Giant, Infernal

**Personality Traits:**
- **Obsessed with Ireena** (reincarnation of Tatyana, his lost love)
- **Arrogant** (believes himself superior to mortals)
- **Patient** (has eternity, will outlast party)
- **Honorable** (keeps his word, respects bravery)
- **Wrathful** (punishes defiance by harming innocents)

**Goals:**
1. **Primary:** Possess Ireena Kolyana (make her his bride)
2. **Secondary:** Escape Barovia (break curse of the mists)
3. **Tertiary:** Punish party for defying him

**Bonds:**
- **Tatyana** (Ireena's past life, Strahd's obsession for 400 years)
- **Castle Ravenloft** (Strahd's seat of power, contains his coffin)
- **Barovia** (Strahd's domain, prison created by Dark Powers)

**Flaws:**
- **Hubris** (believes he cannot be defeated)
- **Obsession** (Ireena's safety overrides tactics)
- **Cursed** (cannot leave Barovia, cannot truly love Ireena)

### Appendix C: Castle Ravenloft Key Locations

**Strahd's Coffin Location:**
- **Room:** K86 (Strahd's Tomb)
- **Access:** Hidden behind secret door in K85 (Sergei's Tomb)
- **Trap:** Teleport trap sends intruders to K82 (Elevator Trap)
- **Stakes Required:** Wooden stake driven through heart while Strahd rests in coffin (permanent death)

**Tactical Chokepoints:**
- **K8 Great Entry:** 50-ft ceiling, organ music, grand staircase (ambush from above via Spider Climb)
- **K10 Dining Hall:** Dinner invitation location, lair actions available
- **K20 Heart of Sorrow:** Glowing crystal, 50 HP → absorbs first 50 damage to Strahd per encounter
- **K60 North Tower Peak:** 60-ft drop, braziers (Strahd can push PCs off edge)

**Escape Routes:**
- **Pass Through Walls** (lair action): Any wall → K86 Coffin (3-5 rounds)
- **Spider Climb** (vampire ability): Climb to ceiling → traverse castle via shafts
- **Mist Form** (0 HP): Immune to damage, fly 20 ft/round → K86 (2-hour deadline)

### Appendix D: Strahd's Spell List (Full Details)

**Cantrips (at will):**
- **Mage Hand:** Manipulate 10 lb object at 30 ft (open doors, trigger traps, retrieve items)
- **Prestidigitation:** Minor illusion (bloody handprints, whispered names, flickering candles)
- **Ray of Frost:** +10 to hit, 60 ft, 2d8 cold damage, reduce speed by 10 ft (kite melee characters)

**1st-Level (4 slots):**
- **Comprehend Languages:** Understand any language for 1 hour (interrogate captives, read journals)
- **Fog Cloud:** 20-ft radius fog, heavily obscured, 10 minutes (escape, obscure vision)
- **Sleep:** 5d8 HP pool, unconscious 1 minute (finish with Bite, auto-crit on unconscious)

**2nd-Level (3 slots):**
- **Hold Person:** DC 18 Wisdom save, paralyze 1 minute, concentration (auto-crit on paralyzed)
- **Invisibility:** Turn invisible until attack, 1 hour, concentration (scouting, ambush)
- **Mirror Image:** 3 duplicates, attacks randomly target images, 1 minute (AC becomes near-untouchable)

**3rd-Level (3 slots):**
- **Animate Dead:** Create 1 undead, 24-hour duration (12 zombies/skeletons max)
- **Fireball:** DC 18 Dex save, 8d6 fire, 20-ft radius (area damage, force healing/concentration)
- **Nondetection:** 8 hours, immune to divination magic (prevent scrying, locate creature)

**4th-Level (3 slots):**
- **Blight:** DC 18 Con save, 8d8 necrotic, 30 ft (priority: healers, concentrators)
- **Greater Invisibility:** Invisible 1 minute, attacks don't break, concentration (advantage on attacks, disadvantage against)
- **Polymorph:** DC 18 Wisdom save, transform into beast, 1 hour, concentration (remove fighter, create hazards)

**5th-Level (2 slots):**
- **Animate Objects:** 10 Tiny/Small objects, 1 minute, concentration (castle furniture, weapons, armor)
- **Scrying:** DC 18 Wisdom save, see/hear target, 10 minutes, concentration (gather intelligence, taunt)

**6th-Level (1 slot):**
- **Move Earth:** 40-ft cube earth, 2 hours (collapse tunnels, create chasms, seal exits)

### Appendix E: Additional Resources

**Official D&D 5e Sources:**
- **Monster Manual (MM):** Strahd von Zarovich stat block (p. 239-240)
- **Curse of Strahd Adventure Module (CoS):** Full campaign details (Wizards of the Coast, 2016)
- **Van Richten's Guide to Ravenloft (VRGtR):** Expanded Barovia lore (WotC, 2021)

**Community Resources:**
- **r/CurseofStrahd (Reddit):** DM advice, encounter ideas, party stories
- **MandyMod's Fleshing Out Curse of Strahd:** Enhanced encounters and NPC motivations
- **DragnaCarta's Curse of Strahd: Reloaded:** Restructured campaign guide

**Epic 1-4 Integration:**
- **Epic 1 (Core Engine):** Location system, session logging, Git save/load
- **Epic 2 (Calendar & Events):** Event scheduling (Children of the Night arrival, Misty Escape deadline)
- **Epic 3 (D&D 5e Mechanics):** All combat, spellcasting, HP tracking systems
- **Epic 4 (Curse of Strahd Content):** Strahd NPC profile, Castle Ravenloft locations, quest system

**Related Kapi's RPG Documentation:**
- `game-data/npcs/strahd_von_zarovich.yaml` - Strahd's complete NPC profile (650+ lines)
- `docs/strahd-mechanics-research.md` - Technical research on legendary creature mechanics
- `game-data/locations/castle-ravenloft/` - 79 castle location folders (K1-K90)
- `docs/tarokka-reading-guide.md` - Tarokka deck and reading system (determines artifact locations)

---

**END OF GUIDE**

**Version:** 1.0
**Word Count:** ~12,000 words
**Last Updated:** 2025-11-16
**Author:** Kapi (assisted by Claude Sonnet 4.5)
**For:** Kapi's RPG - Curse of Strahd Solo Campaign

---

*This guide is part of **Epic 4: Curse of Strahd Content Implementation**, specifically **Story 4-17: Strahd AI Behavior System**. It provides comprehensive DM guidance for running Strahd von Zarovich as a legendary creature using the existing Epic 1-3 game engine with no code modifications required.*

*May your players fear the night, and may Strahd's shadow loom over Barovia for eternity.*

**— Kapi, Dungeon Master**

---