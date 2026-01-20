# Strahd Encounter Playtest Script

**Story:** 4-17 (Strahd AI Behavior System)
**Epic:** 4 (Curse of Strahd Content Implementation)
**Version:** 1.0
**Last Updated:** 2025-11-16

## Purpose

This playtest script provides **3 structured scenarios** for testing Strahd von Zarovich AI behavior across different phases, locations, and tactical situations. Use these scenarios to validate that:

1. Strahd's AI behavior guide provides clear, actionable guidance
2. Epic 3 systems (CombatManager, SpellManager, HPManager, etc.) support all Strahd mechanics
3. Legendary actions, lair actions, and vampire abilities work correctly with DM adjudication
4. Phase transitions are smooth and dramatic
5. Retreat conditions trigger appropriately

Each scenario includes:
- **Setup:** Party level, location, starting conditions
- **Scene Description:** Narrative hook for the encounter
- **Tactical Goals:** Strahd's objectives for this encounter
- **Turn-by-Turn Playtest:** Specific actions to test
- **Validation Checklist:** Criteria for successful playtest
- **Expected Outcome:** What should happen if guide/systems work correctly

---

## Scenario 1: Tser Pool Encampment (Phase 2: Testing)

### Setup

**Party Level:** 3-4 (early game)
**Location:** Tser Pool Encampment (outside Castle Ravenloft, no lair actions)
**Party Composition:** Kapi (Fighter 4), cleric (NPC ally)
**Strahd's HP:** 144/144 (full HP, not bloodied)
**Strahd's Spell Slots:** All available (fresh)
**Strahd's Phase:** Phase 2 (Testing)
**Time of Day:** Night (10:00 PM, full moon)
**Weather:** Clear

**Objective:** Test Phase 2 hit-and-run tactics, Charm ability, and retreat after 3 rounds.

### Scene Description

> You and the cleric rest beside the campfire at Tser Pool, the sounds of Vistani laughter echoing from nearby wagons. Madam Eva warned you: "The devil watches from the shadows. He will test you before he kills you."
>
> As the moon rises to its peak, the campfire dims. A figure emerges from the mist—tall, dressed in black nobleman's garb, his eyes burning with crimson light.
>
> "Welcome to Barovia," Strahd says, his voice like silk over iron. "I have heard tales of you. Let us see if they are true."

### Tactical Goals

1. **Scout Party:** Observe party tactics, note weaknesses (low Wisdom, no radiant damage, etc.)
2. **Charm Cleric:** Attempt to charm cleric ally (long-term sabotage)
3. **Hit-and-Run:** 1-2 attacks, then retreat (no death, just intimidation)
4. **Retreat After 3 Rounds:** Use Legendary Move to escape, phase through trees as mist

### Turn-by-Turn Playtest

**Round 1: Initiative**
- **DM Action:** Use CombatManager to initialize combat
  - Combatants: Strahd (initiative +4), Kapi (initiative roll), Cleric (initiative roll)
  - Roll initiative for Strahd: `1d20+4`
  - Result: Turn order established

**Strahd's Turn 1:**
1. **Action:** Cast **Charm** on cleric
   - Use SpellManager to check if Strahd can cast Charm (racial ability, not spell slot)
   - Cleric makes DC 17 Wisdom save (use DiceRoller)
   - If failed: Cleric charmed for 24 hours (add condition via ConditionTracker)
   - If succeeded: Strahd notes "high Wisdom save" in scouting notes
2. **Movement:** Move 30 ft to maintain distance from Kapi
3. **Narration:** "Your friend looks upon me with...new understanding."

**Kapi's Turn 1:**
- Kapi attacks Strahd (player choice)
- If hits: Note damage dealt (will influence Strahd's retreat decision)

**Cleric's Turn 1:**
- If charmed: Cleric hesitates, skips turn (or attacks Kapi if DM chooses)
- If not charmed: Cleric attacks Strahd or casts Sacred Flame

**End of Cleric's Turn: Legendary Action Prompt**
- **DM Prompt:** "Strahd has 3 legendary actions remaining. Use any?"
- **Strahd's Choice:** Legendary Action: Move (cost 1)
  - Move 30 ft away from Kapi (kite melee character)
  - Update legendary action pool: 3 → 2

**Round 2:**

**Strahd's Turn 2:**
1. **Action:** Cast **Hold Person** on Kapi (DC 18 Wisdom save)
   - Use SpellManager to cast spell (2nd-level, requires slot)
   - Check spell slot availability: level_2 slots (3 available)
   - Kapi makes DC 18 Wisdom save (use DiceRoller)
   - If failed: Kapi paralyzed (add condition via ConditionTracker)
2. **Movement:** If Kapi paralyzed, move adjacent to Kapi
3. **Narration:** "You cannot resist me, child. None can."

**Kapi's Turn 2:**
- If paralyzed: Skip turn (paralyzed condition)
- If not paralyzed: Attack Strahd

**Cleric's Turn 2:**
- Cleric acts (charmed or not)

**End of Cleric's Turn: Legendary Action**
- **Strahd's Choice:** If Kapi is paralyzed, use Legendary Action: Unarmed Strike on Kapi
  - Attack roll: +9 to hit (use DiceRoller: `1d20+9`)
  - Damage: `1d8+4` slashing (average 8.5 damage)
  - Effect: Grapple Kapi (DC 18 to escape, but Kapi is paralyzed = auto-grapple)
  - Auto-crit on paralyzed target: double damage dice = `2d8+4`
  - Update legendary action pool: 2 → 1

**Round 3: Retreat Round**

**Strahd's Turn 3:**
1. **Action:** If Kapi grappled and paralyzed, use Legendary Action: Bite (cost 2, but on Strahd's turn = regular action)
   - Attack roll: +9 to hit, auto-crit on paralyzed target
   - Damage: `2d6+8` piercing + `6d6` necrotic (paralyzed = double damage dice)
   - Healing: Strahd regains HP equal to necrotic damage (~21 HP average)
   - Max HP Reduction: Kapi's max HP reduced by necrotic damage amount until long rest
2. **Movement:** After Bite, use bonus action to transform into **bat form** (Shapechanger)
3. **Narration:** "You have spirit, but you are not ready. We shall meet again." (transforms into bat, flies away)

**End of Round 3:**
- Strahd flees as bat (30 ft fly speed), disappears into mist
- Combat ends
- Hold Person spell ends (concentration broken when Strahd leaves)

### Validation Checklist

**Phase 2 Tactics:**
- [ ] Strahd used hit-and-run tactics (1-2 attacks, then retreat)
- [ ] Strahd attempted Charm on ally (psychological warfare)
- [ ] Strahd used control spell (Hold Person) to set up advantage
- [ ] Strahd retreated after 3 rounds (did not fight to death)

**Epic 3 Integration:**
- [ ] CombatManager handled initiative order correctly
- [ ] SpellManager tracked spell slot consumption (Hold Person used 1x level_2 slot)
- [ ] DiceRoller handled all attack/damage/save rolls
- [ ] ConditionTracker applied Charm and Hold Person conditions
- [ ] HPManager tracked damage to Kapi and healing to Strahd (from Bite)

**Legendary Actions:**
- [ ] DM prompted for legendary actions at end of each PC's turn
- [ ] Legendary action pool tracked correctly (3 → 2 → 0 → reset to 3 at Strahd's turn)
- [ ] Move legendary action allowed Strahd to kite melee characters
- [ ] Unarmed Strike legendary action grappled target successfully
- [ ] Bite prerequisite enforced (required grappled target)

**Narrative Impact:**
- [ ] Strahd felt threatening but not overwhelming (appropriate for Level 3-4 party)
- [ ] Charmed cleric created paranoia/moral dilemma for party
- [ ] Strahd's retreat established him as strategic (not mindless monster)
- [ ] Party survived but felt outmatched (sets up Phase 3: Psychological Warfare)

### Expected Outcome

**Successful Playtest Indicators:**
1. Kapi took ~30-40 damage (bloodied but not dead)
2. Cleric charmed (24-hour sabotage) OR party noted Strahd's charm attempt
3. Strahd escaped unharmed (transformed to bat, flew away)
4. Party feels tension: "Strahd could have killed us, but chose not to"
5. All Epic 3 systems functioned correctly (no missing data, no manual workarounds)

**Failed Playtest Indicators:**
1. Strahd stayed and fought until 0 HP (should retreat after 3 rounds in Phase 2)
2. Legendary actions not used or tracked incorrectly
3. Epic 3 systems missing data (e.g., Charm save DC not in YAML)
4. Kapi or cleric died (too deadly for Phase 2)
5. Strahd felt weak or easily defeated (undermines campaign threat)

---

## Scenario 2: Castle Ravenloft Dining Hall (Phase 4: Engagement)

### Setup

**Party Level:** 7-8 (mid-game)
**Location:** K10 Dining Hall, Castle Ravenloft (lair actions available)
**Party Composition:** Kapi (Fighter 7), Wizard (Level 7), Cleric (Level 7)
**Strahd's HP:** 144/144 (full HP, not bloodied)
**Strahd's Spell Slots:** All available (fresh)
**Strahd's Phase:** Phase 4 (Engagement)
**Artifacts Possessed:** Party has Holy Symbol of Ravenkind (no Sunsword yet)
**Time of Day:** Night (midnight)
**Weather:** Thunderstorm (atmospheric)

**Objective:** Test Phase 4 full combat tactics, lair actions, Greater Invisibility, and bloodied retreat threshold.

### Scene Description

> The dining hall stretches before you, a banquet laid out as if expecting guests for centuries. At the head of the table sits Strahd, wine glass in hand, though he does not drink.
>
> "I invited you to dine as my guests," Strahd says, his voice cold. "You chose to trespass as thieves instead. Very well. Let us see how you fare against the lord of Castle Ravenloft."
>
> Thunder crashes outside. The candles flicker and die. Strahd's eyes glow crimson in the darkness.

### Tactical Goals

1. **Establish Dominance:** Use Greater Invisibility + Spider Climb for advantage
2. **Use Lair Actions:** Solid Fog (separate party), Pass Through Walls (ambush), Control Doors (trap party)
3. **Target Priority:** Wizard (low AC, high damage), then Cleric (healer), then Kapi (tank)
4. **Retreat When Bloodied:** <72 HP, use Mirror Image + Pass Through Walls to escape

### Turn-by-Turn Playtest

**Pre-Combat:**
- **DM Action:** Add "Lair Actions" as pseudo-combatant at initiative 20 (fixed)
- **DM Action:** Initialize combat (CombatManager)
  - Combatants: Lair (20), Strahd (+4), Wizard (+3), Cleric (+2), Kapi (+0)

**Round 1:**

**Initiative 20: Lair Action**
- **Lair Action:** Solid Fog (20-ft cube centered on Wizard)
  - Effect: Wizard heavily obscured (attacks have disadvantage, can't see out of fog)
  - Add condition to Wizard via ConditionTracker: "Heavily Obscured"
  - Track last lair action: "Solid Fog" (cannot repeat next round)

**Strahd's Turn 1:**
1. **Action:** Cast **Greater Invisibility** (4th-level, concentration)
   - Use SpellManager to cast spell (requires 4th-level slot)
   - Effect: Strahd invisible for 10 rounds, attacks don't break invisibility
   - Add conditions via ConditionTracker: "Invisible" (10 rounds), "Concentrating on Greater Invisibility"
2. **Movement:** Use **Spider Climb** to climb to ceiling (60 ft up)
3. **Narration:** "Strahd's form shimmers and vanishes. You hear his mocking laughter from above."

**Wizard's Turn 1:**
- Wizard tries to cast spell but heavily obscured (disadvantage on spell attack rolls)
- Wizard moves out of Solid Fog (30 ft movement)

**Cleric's Turn 1:**
- Cleric casts *See Invisibility* (2nd-level) to counter Strahd's Greater Invisibility
- OR Cleric moves to defensive position

**End of Cleric's Turn: Legendary Action**
- **DM Prompt:** "Strahd has 3 legendary actions remaining. Use any?"
- **Strahd's Choice:** Legendary Action: Move (cost 1)
  - Move 30 ft along ceiling (Spider Climb, position above Wizard)
  - Update pool: 3 → 2

**Kapi's Turn 1:**
- Kapi moves toward Wizard (protect ally)
- Ready action to attack Strahd if he appears

**End of Kapi's Turn: Legendary Action**
- **Strahd's Choice:** Legendary Action: Move (cost 1)
  - Move 30 ft along ceiling (reposition to isolated Wizard)
  - Update pool: 2 → 1

**Round 2:**

**Initiative 20: Lair Action**
- **Lair Action:** Pass Through Walls (cannot repeat Solid Fog)
  - Strahd phases through ceiling, emerges directly behind Wizard
  - Movement: Up to 30 ft through walls
  - Track last lair action: "Pass Through Walls"

**Strahd's Turn 2:**
1. **Action:** Cast **Blight** on Wizard (4th-level, DC 18 Con save)
   - Use SpellManager to cast spell (requires 4th-level slot)
   - Wizard makes DC 18 Constitution save (use DiceRoller)
   - Damage: `8d8` necrotic (average 36 damage)
   - If Wizard fails save: Full damage, likely bloodied or unconscious
   - If Wizard succeeds: Half damage (18)
2. **Greater Invisibility Still Active:** Wizard has disadvantage on attacks against Strahd (can't see him, even if cleric has See Invisibility)
3. **Narration:** "Your life force withers at my touch, mage."

**Wizard's Turn 2:**
- If conscious: Wizard casts *Fireball* centered on Strahd's last known position
  - Strahd makes DC 15 Dex save (Strahd's save: +9, likely succeeds for half damage)
  - Damage: ~28 damage (half of 8d6)
  - Check concentration on Greater Invisibility: DC 14 Con save (damage/2 = 14, or minimum 10)
    - Strahd's Con save: +9 (use DiceRoller: `1d20+9`)
    - If succeeds: Greater Invisibility remains active
    - If fails: Greater Invisibility ends, Strahd becomes visible

**Cleric's Turn 2:**
- Cleric casts *Cure Wounds* on Wizard (heal ~15 HP)

**End of Cleric's Turn: Legendary Action**
- **Strahd's Choice:** Legendary Action: Unarmed Strike on Wizard (cost 1)
  - Attack roll: +9 to hit, advantage (Strahd invisible, Wizard blinded by fog earlier)
  - Damage: `1d8+4` slashing (average 8.5)
  - Effect: Grapple Wizard (DC 18 Strength or Dex to escape)
  - Update pool: 1 → 0

**Kapi's Turn 2:**
- Kapi moves to Wizard, attempts to break grapple (Help action)

**End of Kapi's Turn: Legendary Action**
- **No Actions Available:** Strahd has 0 legendary actions remaining (used all 3)

**Round 3:**

**Strahd's Turn 3 (Reset Legendary Actions):**
- **Legendary Action Pool Reset:** 0 → 3 (at start of Strahd's turn)
1. **Action:** Use regular action for Bite on grappled Wizard
   - Attack roll: +9 to hit (auto-hit if Wizard still grappled)
   - Damage: `1d6+4` piercing + `3d6` necrotic (average 10 + 10.5 = 20.5 total)
   - Healing: Strahd regains HP equal to necrotic damage (~10.5 HP)
   - Max HP Reduction: Wizard's max HP reduced by necrotic damage until long rest
2. **Movement:** If party focusing fire on Strahd, use Spider Climb to retreat to ceiling

**Party Focuses Fire:**
- Kapi, Wizard, Cleric all attack Strahd
- Total damage dealt: ~50-60 damage
- **Strahd's HP:** 144 → 84 HP (bloodied, <72 HP threshold)

**Initiative 20: Lair Action**
- **Lair Action:** Control Doors (cannot repeat Pass Through Walls)
  - All doors in dining hall slam shut and lock
  - Windows seal
  - Effect: Party trapped in room
  - Track last lair action: "Control Doors"

**Strahd's Turn 4 (Bloodied Retreat):**
1. **Action:** Cast **Mirror Image** (2nd-level, defensive)
   - Use SpellManager to cast spell (requires 2nd-level slot)
   - Effect: 3 duplicate images, attacks randomly target images first
2. **Movement:** Use Shapechanger (bonus action) to transform into **mist form**
   - Effect: Immune to all damage, fly speed 20 ft, cannot attack or cast
   - Add condition via ConditionTracker: "Mist Form"
3. **Lair Action (Initiative 20 Next Round):** Pass Through Walls → escape to K86 Coffin
4. **Narration:** "You have proven more capable than I expected. But this castle is mine. We shall meet again." (dissolves into mist, phases through wall)

### Validation Checklist

**Phase 4 Full Tactics:**
- [ ] Strahd used Greater Invisibility for advantage (pre-combat or Turn 1)
- [ ] Strahd used Spider Climb for 3D positioning (ceiling ambush)
- [ ] Strahd used all 3 lair actions (Solid Fog, Pass Through Walls, Control Doors)
- [ ] Strahd targeted Wizard (low AC, high threat) first
- [ ] Strahd retreated when bloodied (<72 HP)

**Lair Actions:**
- [ ] Lair actions triggered at initiative 20 (before most combatants)
- [ ] Lair actions restricted to Castle Ravenloft location
- [ ] Cannot-repeat rule enforced (tracked last action used)
- [ ] Lair actions had dramatic battlefield impact (separated party, trapped party, enabled ambush)

**Legendary Actions (Full Usage):**
- [ ] Legendary actions used at end of each PC's turn
- [ ] Pool tracked correctly (3 → 2 → 1 → 0 → reset to 3 at Strahd's turn)
- [ ] Move actions used to kite and reposition (3D movement on ceiling)
- [ ] Unarmed Strike used to set up grapple for Bite
- [ ] Bite used on grappled target (healing + max HP reduction)

**Bloodied Retreat:**
- [ ] Strahd retreated when HP dropped below 72 HP (~50% HP)
- [ ] Strahd used defensive spell before retreat (Mirror Image)
- [ ] Strahd used Shapechanger (mist form) for escape (immune to damage)
- [ ] Strahd used lair action or Spider Climb to reach hidden location (K86 Coffin)

**Epic 3 Integration:**
- [ ] CombatManager handled initiative including Lair Actions (initiative 20)
- [ ] SpellManager tracked spell slots (Greater Invisibility, Blight, Mirror Image)
- [ ] ConditionTracker applied all conditions (Invisible, Concentrating, Heavily Obscured, Grappled, Mist Form)
- [ ] HPManager tracked damage to all combatants and healing to Strahd
- [ ] DiceRoller handled all attack/damage/save rolls with correct modifiers

### Expected Outcome

**Successful Playtest Indicators:**
1. Party took ~60-80 total damage (significant threat, but survivable)
2. Wizard was primary target (followed guide's priority: spellcasters first)
3. Strahd retreated at ~72 HP or below (followed bloodied threshold)
4. Lair actions created dramatic moments (fog separated party, doors trapped them, Strahd ambushed through walls)
5. Legendary actions felt smooth and integrated (DM prompted after each PC turn)
6. All Epic 3 systems functioned correctly

**Failed Playtest Indicators:**
1. Strahd fought to 0 HP instead of retreating when bloodied (should retreat <72 HP)
2. Lair actions not used or felt underwhelming (critical for Castle Ravenloft advantage)
3. Legendary actions forgotten or not tracked (pool management failed)
4. Party easily defeated Strahd in 2-3 rounds (too weak for Phase 4)
5. Epic 3 systems missing data or required manual workarounds

---

## Scenario 3: Sunlight Escape (Phase 5: Misty Escape)

### Setup

**Party Level:** 9-10 (late game)
**Location:** K86 Strahd's Tomb, Castle Ravenloft (coffin location)
**Party Composition:** Kapi (Fighter 10), Wizard (Level 10), Cleric (Level 10), Paladin (Level 10)
**Strahd's HP:** 15/144 (critically wounded, near Misty Escape threshold)
**Strahd's Spell Slots:** Mostly depleted (used in previous encounter)
**Strahd's Phase:** Phase 5 (Retreat and Reset)
**Artifacts Possessed:** Party has Holy Symbol of Ravenkind AND Sunsword (activated)
**Time of Day:** Early morning (6:00 AM, sunrise in 30 minutes)
**Weather:** Clear (sunlight will enter castle soon)

**Objective:** Test Misty Escape trigger (0 HP), 2-hour coffin deadline, sunlight exception, and permanent death conditions.

### Scene Description

> You stand in Strahd's tomb (K86), the vampire lord's coffin before you. Strahd clings to the stone wall above, his wounds weeping black ichor. The Sunsword's radiant light fills the chamber, blocking his regeneration.
>
> "You have...bested me," Strahd rasps, his voice strained. "But I am eternal. Barovia is mine. You...cannot...kill me."
>
> Outside, the first rays of dawn break over the castle walls.

### Tactical Goals

1. **Trigger Misty Escape:** Party reduces Strahd to 0 HP
2. **Test 2-Hour Deadline:** Strahd must reach coffin within 2 hours or be destroyed
3. **Test Sunlight Exception:** If Strahd in sunlight when reduced to 0 HP, Misty Escape FAILS (permanent death)
4. **Test Stake in Coffin:** If party pursues Strahd to coffin and stakes him, permanent death

### Turn-by-Turn Playtest

**Round 1:**

**Strahd's Turn 1:**
1. **Regeneration Check (Start of Turn):**
   - Check HP: 15 HP (>0, regeneration would normally trigger)
   - Check for blockers:
     - Radiant damage this turn: YES (Sunsword dealt 20 radiant damage last round)
     - Sunlight: NO (not yet inside tomb)
     - Running water: NO
   - **Result:** Regeneration BLOCKED (radiant damage this turn)
   - Add condition via ConditionTracker: "Radiant Damage This Turn" (prevents regeneration)
2. **Action:** Cast **Fog Cloud** (1st-level) to obscure vision (escape attempt)
   - Use SpellManager to cast spell (requires 1st-level slot)
   - Effect: 20-ft radius fog, heavily obscured
3. **Movement:** Use Spider Climb to climb toward window (attempt to flee outside)

**Paladin's Turn 1:**
- Paladin readies attack with Sunsword (radiant damage, blocks regeneration)
- Paladin moves to intercept Strahd

**Wizard's Turn 1:**
- Wizard casts *Dispel Magic* to remove Fog Cloud (DC 11, auto-success for 3rd-level Dispel)

**Cleric's Turn 1:**
- Cleric casts *Daylight* spell (3rd-level) in tomb chamber
  - Effect: 60-ft radius bright light (counts as sunlight for vampire weaknesses)
  - Strahd takes 20 radiant damage at start of next turn (sunlight exposure)
  - Strahd has disadvantage on attacks and ability checks

**End of Cleric's Turn: Legendary Action**
- **Strahd's Choice:** Legendary Action: Move (cost 1)
  - Move 30 ft toward window (Spider Climb along wall)
  - Trying to escape Daylight radius
  - Update pool: 3 → 2

**Kapi's Turn 1:**
- Kapi attacks Strahd with greatsword
  - Attack roll: +11 to hit (vs AC 16, likely hits)
  - Damage: `2d6+6` slashing (average 13 damage)
  - **Strahd's HP:** 15 → 2 HP (critically wounded, on verge of Misty Escape)

**End of Kapi's Turn: Legendary Action**
- **Strahd's Choice:** Legendary Action: Move (cost 1)
  - Move 30 ft, reach window
  - Trying to escape before Misty Escape triggers
  - Update pool: 2 → 1

**Round 2:**

**Strahd's Turn 2:**
1. **Start of Turn:** Check if in Daylight radius
   - If YES: Take 20 radiant damage from sunlight
     - **Strahd's HP:** 2 → 0 HP (**Misty Escape Triggers!**)
   - If NO: Survived, continues trying to escape

**Misty Escape Trigger (0 HP):**
1. **Check Exceptions:**
   - **In Sunlight:** YES (*Daylight* spell is active)
   - **In Running Water:** NO
   - **Result:** Misty Escape FAILS (sunlight exception)
   - Strahd is **DESTROYED** (permanent death)
2. **Narration:**
   > "Strahd's eyes widen in terror as the holy light touches his flesh. 'No...not like this...I am eternal...' His form begins to dissolve into mist, but the sunlight burns it away. Strahd von Zarovich screams—a sound of four centuries of rage and despair—then crumbles to ash."
3. **Epic 2 Integration:** No coffin deadline needed (Strahd destroyed)

**ALTERNATE SCENARIO A: Strahd Escapes Sunlight**

**If Strahd escapes Daylight radius:**
1. **Kapi's Turn 2:** Kapi attacks with Sunsword
   - Attack roll: +11 to hit (vs AC 16, hits)
   - Damage: `2d6+6` slashing + `2d8` radiant (Sunsword) = ~21 total damage
   - **Strahd's HP:** 2 → 0 HP (**Misty Escape Triggers!**)

**Misty Escape Trigger (0 HP, No Sunlight):**
1. **Check Exceptions:**
   - In Sunlight: NO (escaped Daylight radius)
   - In Running Water: NO
   - **Result:** Misty Escape SUCCEEDS
2. **Transform to Mist Form:**
   - Strahd's body dissolves into crimson mist
   - HP remains at 0 HP
   - Add condition via ConditionTracker: "Mist Form (immune to all damage, fly 20 ft, cannot attack/cast)"
3. **Narration:**
   > "Strahd's body collapses, but instead of falling, it dissolves into crimson mist. The mist swirls and flees toward the coffin with supernatural speed."

**Epic 2 EventScheduler: Schedule Coffin Deadline**
```javascript
const eventScheduler = new EventScheduler();
const calendarManager = new CalendarManager();
const currentTime = calendarManager.getCurrentTime(); // "735-10-20, 06:00"
const deadline = calendarManager.addHours(currentTime, 2); // "735-10-20, 08:00"

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
// Output: "Strahd has until 735-10-20 08:00 to reach coffin"
```

**Chase Scene:**
- Mist Strahd flies at 20 ft/round toward coffin (already in K86, reaches coffin in 1 round)
- Party can pursue and attempt to reach coffin first

**ALTERNATE SCENARIO B: Party Pursues to Coffin**

**If party reaches coffin before Strahd regenerates:**
1. **Strahd in Coffin (Mist Form):**
   - Strahd's mist form enters coffin, begins 8-hour regeneration
   - HP: 0 HP → 1 HP (begins healing)
2. **Party Action:** Drive wooden stake through Strahd's heart
   - Requires: Wooden stake, melee attack against coffin (Strahd helpless)
   - Attack roll: Auto-hit (Strahd unconscious in coffin)
   - Effect: **Strahd DESTROYED (permanent death)**
3. **Narration:**
   > "You drive the wooden stake through Strahd's heart as he lies in his coffin. His eyes fly open, filled with rage and disbelief. 'You...dare...?' His body crumbles to dust, and the stake clatters to the bottom of the empty coffin. Barovia is free."

**Campaign Outcome:** Curse of Strahd DEFEATED (campaign ends)

### Validation Checklist

**Misty Escape Mechanics:**
- [ ] Misty Escape triggered automatically at 0 HP (not optional)
- [ ] Sunlight exception enforced (Misty Escape FAILS if in sunlight/Daylight spell)
- [ ] Running water exception enforced (if applicable)
- [ ] Mist form immune to all damage (party cannot damage mist)
- [ ] Mist form fly speed 20 ft (slow enough for party to pursue)

**Epic 2 Integration (Coffin Deadline):**
- [ ] EventScheduler scheduled 2-hour deadline event
- [ ] CalendarManager calculated deadline time correctly (current time + 2 hours)
- [ ] DM received alert when deadline approached
- [ ] If Strahd failed to reach coffin in 2 hours: Strahd destroyed (permanent death)

**Permanent Death Conditions:**
- [ ] Sunlight exception: Strahd destroyed if reduced to 0 HP in sunlight
- [ ] Running water exception: Strahd destroyed if reduced to 0 HP in running water
- [ ] Stake in coffin: Strahd destroyed if staked while regenerating in coffin
- [ ] 2-hour deadline missed: Strahd destroyed if mist form fails to reach coffin

**Regeneration Blockers:**
- [ ] Radiant damage blocked regeneration (Sunsword dealt radiant damage)
- [ ] Daylight spell blocked regeneration (counts as sunlight)
- [ ] Regeneration did NOT trigger at start of turn (blocker active)

**Epic 3 Integration:**
- [ ] HPManager correctly handled 0 HP trigger (Misty Escape)
- [ ] ConditionTracker applied "Mist Form" condition
- [ ] ConditionTracker tracked "Radiant Damage This Turn" blocker
- [ ] SpellManager tracked Fog Cloud and Daylight spells

### Expected Outcome

**Successful Playtest Indicators:**
1. Misty Escape triggered automatically when Strahd reached 0 HP
2. Sunlight exception worked correctly (Strahd destroyed if in Daylight spell)
3. If escaped sunlight: 2-hour deadline scheduled, mist form fled to coffin
4. Party had opportunity to pursue and stake Strahd in coffin (permanent death)
5. Campaign ending felt climactic and earned (party used all resources: artifacts, spells, tactics)

**Failed Playtest Indicators:**
1. Misty Escape did not trigger at 0 HP (should be automatic)
2. Sunlight exception not enforced (Strahd escaped even in Daylight spell)
3. Mist form vulnerable to damage (should be immune to all damage)
4. 2-hour deadline not scheduled (Epic 2 EventScheduler integration failed)
5. Party unable to stake Strahd in coffin (permanent death impossible)

---

## Debrief Questions for DM

After completing all 3 scenarios, answer these questions to evaluate guide effectiveness:

### General Questions

1. **Did the Strahd AI Behavior Guide provide clear, actionable guidance for each phase?**
   - [ ] Yes, guide was comprehensive and easy to follow
   - [ ] Partially, needed some improvisation
   - [ ] No, guide was unclear or incomplete

2. **Did Epic 3 systems support all Strahd mechanics without code modifications?**
   - [ ] Yes, all mechanics worked with DM adjudication
   - [ ] Partially, some mechanics required workarounds
   - [ ] No, code modifications would be required

3. **Were legendary actions easy to track and use during combat?**
   - [ ] Yes, pool tracking and prompts worked smoothly
   - [ ] Partially, easy to forget to prompt after each PC turn
   - [ ] No, legendary actions felt burdensome to manage

4. **Did lair actions have dramatic battlefield impact?**
   - [ ] Yes, lair actions created memorable tactical moments
   - [ ] Partially, lair actions used but impact was minor
   - [ ] No, lair actions felt underwhelming or were forgotten

5. **Did phase transitions feel natural and dramatic?**
   - [ ] Yes, each phase felt distinct with clear objectives
   - [ ] Partially, phases blurred together
   - [ ] No, phases were unclear or arbitrary

### Specific Scenario Questions

**Scenario 1 (Tser Pool - Phase 2):**
- Did Strahd feel threatening but not overwhelming for Level 3-4 party?
- Did hit-and-run tactics create tension without killing party?
- Did Charm ability create paranoia/moral dilemma?

**Scenario 2 (Castle Ravenloft - Phase 4):**
- Did full tactical arsenal (spells + legendary + lair) feel overwhelming for party?
- Did bloodied retreat (<72 HP) trigger at appropriate time?
- Did lair actions justify Castle Ravenloft as dangerous location?

**Scenario 3 (Misty Escape - Phase 5):**
- Did Misty Escape feel dramatic and climactic?
- Did sunlight exception create tactical opportunity for party?
- Did coffin deadline create time pressure for party?

---

## Playtest Results Template

Use this template to record playtest results:

```yaml
playtest_session:
  date: 2025-11-16
  scenario: "Scenario 1: Tser Pool (Phase 2: Testing)"
  dm: Kapi
  party_level: 4
  party_size: 2
  duration: 45 minutes

results:
  phase_2_tactics:
    hit_and_run: PASS
    charm_ability: PASS
    retreat_after_3_rounds: PASS
    notes: "Strahd felt appropriately threatening. Charm on cleric created paranoia."

  epic_3_integration:
    combat_manager: PASS
    spell_manager: PASS
    dice_roller: PASS
    condition_tracker: PASS
    hp_manager: PASS
    notes: "All systems worked correctly, no code modifications needed."

  legendary_actions:
    pool_tracking: PARTIAL
    dm_prompts: PARTIAL
    move_action: PASS
    unarmed_strike: PASS
    bite_prerequisite: PASS
    notes: "Forgot to prompt after 1st PC turn, but remembered thereafter. Need reminder system."

  narrative_impact:
    threat_level: APPROPRIATE
    party_survival: YES
    dramatic_moment: "Strahd transforming into bat and fleeing felt epic"
    notes: "Party felt outmatched but hopeful. Sets up Phase 3 well."

  issues_found:
    - "Legendary action prompts easy to forget (need DM reminder or UI indicator)"
    - "Charm save DC not immediately clear in YAML (needed to reference guide)"

  recommendations:
    - "Add legendary action pool tracking to combat tracker sheet"
    - "Create UI indicator for 'Strahd Legendary Actions Remaining' (Epic 5 feature)"
```

---

## Success Criteria Summary

**Story 4-17 is successful if:**

1. ✅ **All 3 scenarios playable** with guide alone (no external references needed)
2. ✅ **Epic 3 integration works** for all mechanics (DiceRoller, SpellManager, HPManager, ConditionTracker, CombatManager)
3. ✅ **Legendary actions manageable** with DM adjudication (pool tracking, turn-end prompts)
4. ✅ **Lair actions impactful** in Castle Ravenloft (Solid Fog, Pass Through Walls, Control Doors)
5. ✅ **Phase transitions clear** (Observation → Testing → Psychological → Engagement → Retreat)
6. ✅ **Retreat conditions trigger appropriately** (<30 HP or <72 HP if bloodied)
7. ✅ **Misty Escape dramatic** (0 HP auto-trigger, 2-hour deadline, sunlight exception)
8. ✅ **Permanent death achievable** (stake in coffin, sunlight, running water)
9. ✅ **No code modifications required** (content-first approach maintained)
10. ✅ **Campaign finale satisfying** (party can defeat Strahd with artifacts + tactics)

---

**END OF PLAYTEST SCRIPT**

**For Questions:** Reference `docs/strahd-ai-behavior-guide.md` (comprehensive DM guide)
**For Bug Reports:** File issue with playtest results YAML
**For Epic 5 Enhancements:** See guide Section 11 (Epic 5 Enhancement Recommendations)

---

*This playtest script is part of **Story 4-17: Strahd AI Behavior System**, designed to validate that Strahd's AI behavior documentation provides clear, actionable guidance for running Strahd encounters across all phases using the existing Epic 1-3 game engine.*

*Good luck, and may your players fear the night.*

**— Kapi, Dungeon Master**
