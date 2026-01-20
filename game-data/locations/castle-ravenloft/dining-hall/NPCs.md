# NPCs in Castle Ravenloft - Dining Hall

## Overview
The dining hall is Strahd's preferred location for "entertaining" guests. He appears here frequently to engage in psychological warfare disguised as dinner conversation. Hidden archers (vampire spawn or animated armor) occupy the posts above, ready to fire on his command.

## Count Strahd von Zarovich (Primary Encounter Location)
- **Type:** Vampire (Legendary Creature)
- **CR:** 15
- **Status:** Frequently appears here to dine with "guests" (60% chance if party enters during evening)
- **Location:** Sits in throne at head of banquet table
- **Behavior:** Charming host, engaging conversationalist, secretly assessing party for weaknesses
- **Dialogue:** See parent castle-ravenloft/NPCs.md for full profile

### Dining Hall Specific Dialogue
- **Invitation:** "Please, sit. Dine with me. I have prepared a feast in your honor. It has been so long since I had guests worthy of conversation." [Gestures to chairs]
- **After Feast Revealed as Illusion:** "Ah, you've discovered my little joke. Forgive me—I forget that mortals require... actual sustenance. I myself dine on rarer fare. But please, remain. Your company is feast enough." [Cold smile]
- **During Dinner Conversation:** "Tell me of the outside world. Does the sun still rise in the mornings? Are there still those who believe in heroes? How quaint. Here in Barovia, we know the truth: there are only predators and prey, and I am the apex."
- **Testing Party's Resolve:** "You carry weapons to my table. How... impolite. But I shall allow it, as you are clearly afraid. Tell me, do you believe those blades will save you if I decide you have outlived your welcome?" [Lair action: all doors slam shut]
- **Psychological Warfare:** "That one there—" [Points to party member] "—you love her, don't you? I can see it in how you position yourself between her and danger. Love is weakness. Let me demonstrate." [Uses Charm Person on loved one]
- **Dismissal:** "You have been adequate company, but I tire of this. You may leave. For now. We shall dine again when you have become more... interesting." [Doors unlock]

### AI Behavior Notes for Dining Hall Encounter
- **Phase 2 (Testing):** Strahd uses dining encounter to test party's unity, moral limits, and emotional bonds
- **Charm Tactics:** May Charm strongest or weakest party member, command them to attack allies briefly, then release ("A test. You failed/passed.")
- **Archer Threat:** If party becomes hostile, Strahd signals archers who fire warning shots, demonstrating party is surrounded
- **Lair Actions:** Uses lair action to lock doors, demonstrating party cannot escape until he permits it
- **No Death Battle (Usually):** Unless party attacks first, Strahd does NOT intend to kill them here—he wants them to explore castle, struggle, hope, and eventually despair
- **Exception:** If party shows immunity to Charm, has legendary artifacts, or mentions they know how to defeat him permanently, he may attack preemptively
- **Departure:** After gathering intelligence and establishing dominance, Strahd dismisses party: "You bore me. Leave." If they don't leave promptly, archers fire for real.

---

## Vampire Spawn Archers (K11 - Archers' Post)
- **Type:** Vampire Spawn (Undead)
- **CR:** 5
- **Count:** 1d3 in archer post during evening hours
- **Status:** On duty when Strahd expects guests or when castle is alerted
- **Location:** Hidden gallery above dining hall (K11)
- **Behavior:** Fire on Strahd's command, focus on spellcasters and clerics
- **Dialogue:** None during archery—after combat: "The master sends his regards."

### Combat Stats
- **AC:** 15 (natural armor)
- **HP:** 82 (11d8 + 33)
- **Speed:** 30 ft., climb 30 ft. (Spider Climb)
- **Attacks:** Ranged - Light Crossbow (+6, 1d8+3 piercing + 2d6 necrotic)
- **Regeneration:** 10 HP per turn unless in sunlight or running water

### AI Behavior Notes
- Occupy archer post during dinner encounters (Strahd's "insurance")
- Have three-quarters cover (+5 AC) from arrow slits
- Fire warning shots first (intentional misses): "Leave now or face consequences"
- If party attacks Strahd or refuses to leave when dismissed, fire for real
- Prioritize: (1) Clerics/Paladins, (2) Spellcasters, (3) Ranged attackers, (4) Melee fighters
- If reduced below 20 HP, retreat via hidden stairs to report party capabilities

---

## Animated Armor Archers (Alternate - If Vampire Spawn Unavailable)
- **Type:** Animated Armor (Construct)
- **CR:** 1
- **Count:** 1d4+1 in archer post
- **Status:** Activate when vampire spawn are deployed elsewhere or if castle highly alerted
- **Location:** Archer post (K11)
- **Behavior:** Fire crossbows mechanically, no morale or retreat
- **Dialogue:** None (mindless constructs)

### Combat Stats
- **AC:** 18 (plate armor)
- **HP:** 33 (6d8 + 6)
- **Speed:** 25 ft.
- **Attacks:** Light Crossbow (+4, 1d8+2 piercing)
- **Immunities:** Poison, psychic, multiple conditions

### AI Behavior Notes
- Less tactically sophisticated than vampire spawn
- Fire in volleys (all shoot simultaneously each round)
- Cannot leave archer post (bound to defend that location only)
- Fight until destroyed (no morale, no retreat)
- If destroyed, Strahd is notified but not concerned (easily replaced)

---

## Phantom Servants (Atmospheric)
- **Type:** Unseen servants (permanent spells)
- **CR:** N/A (non-combat)
- **Status:** Always present, serving "guests"
- **Location:** Throughout dining hall, moving invisibly
- **Behavior:** Pour wine (illusory), arrange plates, light candles, pull out chairs
- **Dialogue:** None (invisible, intangible)

### Description
If party sits at the table, invisible hands pull out their chairs, unfold napkins onto laps, and pour wine (illusory) into goblets. The servants are courteous and efficient, making the experience feel like dining at a noble's estate—except the servants are invisible, the food is illusion, and the host is a vampire. This juxtaposition of civilized service and underlying horror is deeply unsettling.

**Effect:** DC 10 Wisdom save when phantom servants first touch you (pulling chair, arranging napkin) or be startled (disadvantage on next ability check).

---

## Rahadin (Possible Appearance)
- **Type:** Dusk Elf Chamberlain
- **CR:** 10
- **Status:** May appear here if Strahd requests formal dinner service (30% chance during dining encounters)
- **Location:** Stands near throne, attending to Strahd's needs
- **Behavior:** Formal, efficient, utterly loyal to Strahd
- **Dialogue:** "The master has requested your presence at dinner. You will conduct yourselves with proper decorum." "More wine, my lord?" [To Strahd]

### AI Behavior Notes
- Rahadin serves as majordomo during formal dinners
- Does NOT attack unless party attacks Strahd or behaves egregiously
- If combat erupts, Rahadin defends Strahd with deadly efficiency (CR 10 encounter)
- After combat (if Strahd retreats), Rahadin may hold party while master escapes
- Deathly Choir aura: Screaming sounds surround him (DC 15 Wisdom save or frightened)

---

## Encounter Notes
**Dinner Invitation (Evening):** 60% chance Strahd appears if party enters during evening (6pm-midnight). He invites them to dine, engages in conversation, tests their limits.

**Daytime Entry:** Dining hall typically empty during day. Illusory feast is present but less convincing in daylight.

**Combat Scenario:** If dinner turns hostile, party faces:
- Strahd (CR 15) at table
- 1d3 Vampire Spawn (CR 5 each) in archer post
- Possibly Rahadin (CR 10) if he was serving
- Lair actions (doors lock, shadows animate)
- Total CR: Deadly encounter for level 8-10 party

**Escape Difficulty:** High. Doors lock via lair action. Archer post controls exit. Strahd can Misty Step or turn to mist. Party is at severe tactical disadvantage if combat erupts here.

**Recommended Strategy:** Accept invitation, play along, gather intelligence, leave when dismissed. Do NOT initiate combat in dining hall—fight Strahd elsewhere where you have better positioning.
