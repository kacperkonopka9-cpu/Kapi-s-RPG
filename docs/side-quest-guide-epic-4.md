# Side Quest Guide - Epic 4: Curse of Strahd

**Version:** 1.0
**Created:** 2025-11-16
**Story:** 4-13 (Side Quests Batch 1)
**Coverage:** 7 side quests (5 major + 2 minor)

---

## Overview

This guide provides Game Masters with a recommended approach to integrating the 7 side quests from Story 4-13 into the Curse of Strahd campaign. These quests provide optional content that enriches the world of Barovia, develops NPCs, and offers meaningful player choices with lasting consequences.

**Total Side Quests:** 7 (Batch 1 of 18 planned side quests)
**Level Range:** 4-8
**Total XP Available:** 4,000 XP (average 571 XP per quest)
**Estimated Playtime:** 12-20 hours (full completion)

---

## Quest Categories

### Major Side Quests (5 quests)
Complex narratives with significant consequences affecting multiple locations and NPCs.
**Average Length:** 2-4 sessions each
**XP Range:** 400-1000 XP
**File Size:** 300-470 lines

### Minor Side Quests (2 quests)
Focused objectives with localized impact, quicker resolution.
**Average Length:** 1-2 sessions each
**XP Range:** 300-400 XP
**File Size:** 300-410 lines

---

## Quest List Summary

| Quest ID | Name | Type | Level | XP | Time Constraint | Prerequisites |
|----------|------|------|-------|-----|-----------------|---------------|
| st_andrals_feast | St. Andral's Feast | Investigation | 4-5 | 500 | 5 days (hard deadline) | Arrive in Vallaki |
| wizard_of_wines_delivery | Wizard of Wines Delivery | Combat | 5-6 | 700 | None | Meet Urwin Martikov |
| werewolf_den_hunt | Werewolf Den Hunt | Combat | 5-7 | 600 | None | Learn about werewolves |
| abbey_investigation | Abbey Investigation | Investigation | 6-8 | 400 | None | Arrive in Krezk |
| return_berez_gem | Return the Berez Gem | Combat | 7-8 | 1000 | None | Complete Wizard of Wines |
| dream_pastry_investigation | Dream Pastry Investigation | Investigation | 4-6 | 400 | None | Encounter Morgantha |
| missing_vistana | Missing Vistana | Investigation | 4-5 | 300 | Immediate (drowning) | Tser Pool visit |

---

## Recommended Quest Order

### Early Game (Levels 4-5)

#### 1. Missing Vistana (Level 4)
**Trigger:** Arrival at Tser Pool Encampment for Tarokka reading
**Why First:** Quick resolution (1 session), establishes Vistani alliance, rewards party with valuable treasure (ring of warmth + 250gp)
**DM Note:** Time pressure creates urgency but quest is completable. Success yields Vistani safe haven; failure makes Vistani hostile (significant consequences for isolated group).

#### 2. Dream Pastry Investigation (Level 4-5)
**Trigger:** Encounter Morgantha selling pastries in Village of Barovia or on road
**Why Second:** Introduces moral complexity early. Party may encounter addicted villagers and kidnapped children. Hag coven (CR 9 total) is dangerous but avoidable via stealth/bargaining.
**DM Note:** This quest has no "right answer" - pastries are villagers' only happiness, but children die. Powerful moral dilemma. Can be delayed but creates dramatic tension.

#### 3. St. Andral's Feast (Level 4-5)
**Trigger:** 3 days after arriving in Vallaki
**Why Third:** Time constraint (5 days) creates urgency. Vallaki is major hub location, so establishing Father Lucian relationship is valuable. Investigation with clear stakes.
**DM Note:** **CRITICAL - HARD DEADLINE.** If bones not recovered before Baron's festival, 6 vampire spawn attack during church service. Father Lucian dies, church desecrated, Vallaki morale plummets. This event is canonical in Curse of Strahd - don't pull punches if party ignores quest.

### Mid Game (Levels 5-7)

#### 4. Wizard of Wines Delivery (Level 5-6)
**Trigger:** Urwin Martikov mentions wine shortage at Blue Water Inn
**Why Fourth:** Opens up Martikov family alliance (Keepers of the Feather/wereravens). Combat-focused quest good for leveling. Recovering gems provides tangible benefit (wine restored → morale improves).
**DM Note:** Optional objectives (find all 3 gems, discover wereraven secret) reward thorough exploration. Sets up Return Berez Gem quest (prerequisite). Wintersplinter encounter (CR 7 tree blight) is memorable setpiece.

#### 5. Werewolf Den Hunt (Level 5-7)
**Trigger:** Learn about werewolf attacks from Szoldar/Yevgeni hunters or rumors
**Why Fifth:** Moral choice quest (kill Emil vs save Emil) with lasting consequences. Silvered weapons essential. Pack tactics make combat challenging.
**DM Note:** Emil's fate affects werewolf behavior for rest of campaign. Saving Emil creates werewolf allies against Strahd (valuable late-game). Killing him eliminates some random encounters but loses ally. Kiril Stoyanovich is brutal pack leader - make him intimidating.

#### 6. Abbey Investigation (Level 6-8)
**Trigger:** Dmitri Krezkov or Krezk villagers mention strange Abbot
**Why Sixth:** Complex moral dilemma with no clear "right" answer. Abbot is CR 10 deva - combat should be avoided unless party is prepared. Blessing reward (+1d4 to fear saves) is valuable against Strahd.
**DM Note:** Abbot genuinely believes creating Vasilka as Strahd's bride will end curse. He's not evil, just deluded. Moral complexity is the point - help him (get blessing), oppose him (very hard fight), or ignore (no consequences but unsettling). Vasilka encounter is tragic and memorable.

### Late Game (Levels 7-8)

#### 7. Return the Berez Gem (Level 7-8)
**Trigger:** After completing Wizard of Wines, Davian reveals gem location
**Why Last:** Hardest combat encounter (Baba Lysaga CR 11 + creeping hut + scarecrows). Prerequisite quest required. Best saved for high-level party.
**DM Note:** **VERY HARD ENCOUNTER.** Baba Lysaga has legendary actions, lair actions, and her creeping hut (CR 4) fights alongside her. Scarecrow guardians add to difficulty. This is endgame-tier content. Stealth/bargaining approaches possible but risky. Reward (1000 XP + gemstone + magic item) justifies difficulty.

---

## Quest Dependencies

```
Wizard of Wines Delivery
    └─> Return the Berez Gem (requires Wizard of Wines completion)

Main Quest: Escort Ireena to Vallaki
    └─> St. Andral's Feast (requires arriving in Vallaki)
    └─> Abbey Investigation (requires arriving in Krezk)
```

**No other dependencies.** Quests can be tackled in flexible order based on party choices and location exploration.

---

## Quest Unlock Conditions

### St. Andral's Feast
- **Location:** Vallaki (Story 4-3)
- **Trigger:** 3 days after party arrives in Vallaki
- **Quest Giver:** Father Lucian Petrovich
- **Unlock Mechanism:** EventScheduler registers quest availability 3 days post-arrival

### Wizard of Wines Delivery
- **Location:** Blue Water Inn, Vallaki
- **Trigger:** Urwin Martikov mentions wine shortage
- **Quest Giver:** Urwin Martikov
- **Unlock Mechanism:** Conditional event when party's trust with Urwin ≥ 2

### Werewolf Den Hunt
- **Location:** Vallaki or wilderness
- **Trigger:** Learn about werewolf lair from Szoldar/Yevgeni hunters or rumors
- **Quest Giver:** Hunters or village rumors
- **Unlock Mechanism:** Conditional event when party interacts with hunters or hears werewolf attack reports

### Abbey Investigation
- **Location:** Krezk (Story 4-4)
- **Trigger:** Burgomaster Dmitri or villagers mention Abbot
- **Quest Giver:** Burgomaster Dmitri Krezkov
- **Unlock Mechanism:** Conditional event when party arrives in Krezk and speaks to Dmitri

### Return the Berez Gem
- **Location:** Wizard of Wines winery
- **Trigger:** After completing Wizard of Wines Delivery
- **Quest Giver:** Davian Martikov
- **Unlock Mechanism:** Quest completion trigger (wizard_of_wines_delivery status: completed)
- **Prerequisite:** Must complete Wizard of Wines Delivery first

### Dream Pastry Investigation
- **Location:** Village of Barovia, roads, Old Bonegrinder
- **Trigger:** Encounter Morgantha selling pastries
- **Quest Giver:** Observation/investigation (no explicit quest giver)
- **Unlock Mechanism:** Random encounter or visiting Old Bonegrinder windmill

### Missing Vistana
- **Location:** Tser Pool Encampment
- **Trigger:** Luvash asks party to find Arabelle
- **Quest Giver:** Luvash (Vistani leader)
- **Unlock Mechanism:** Conditional event when party visits Tser Pool after Tarokka reading

---

## XP and Reward Breakdown

### Total XP Available
- **Major Quests:** 3,200 XP (St. Andral's 500 + Wizard of Wines 700 + Werewolf Den 600 + Abbey 400 + Return Berez 1000)
- **Minor Quests:** 700 XP (Dream Pastry 400 + Missing Vistana 300)
- **Grand Total:** 4,000 XP

**Party XP:** Assuming 4-player party, each player gains 1,000 XP for completing all 7 quests (approximately 1 level advancement from level 5 to 6).

### Notable Rewards

**Currency:**
- Missing Vistana: 250 gp
- Total: 250 gp + various loot from combat encounters

**Magic Items:**
- Ring of Warmth (Missing Vistana reward)
- Silvered weapons (Werewolf Den treasure)
- Winery Gem (Return Berez Gem - for Wizard of Wines)
- Purple Grapemash Wine bottles (Wizard of Wines - valuable trade goods)
- Abbey blessing: +1d4 to saves vs fear (Abbey Investigation reward if help Abbot)

**Alliances:**
- Vistani alliance (Missing Vistana success)
- Martikov family/Keepers of the Feather (Wizard of Wines)
- Werewolf allies (Werewolf Den if save Emil)
- Father Lucian's blessing (St. Andral's Feast success)

**Reputation Changes:**
- St. Andral's Feast: +15 Vallaki reputation
- Wizard of Wines: +20 Martikov/Keepers reputation
- Missing Vistana: +25 Vistani reputation

---

## DM Guidance by Quest

### St. Andral's Feast
**Key NPCs:** Father Lucian Petrovich, Henrik van der Voort (coffin maker), Milivoj (orphan thief)
**Investigation DCs:** DC 15 Insight (Father Lucian hiding something), DC 12 Investigation (coffin shop clues)
**Combat:** 6 vampire spawn (CR 5 each) if quest fails - TPK risk for level 4 party
**Moral Complexity:** Milivoj stole bones to feed orphanage. Henrik was coerced by vampire spawn. Forgiveness vs justice theme.
**DM Tip:** Don't telegraph the 5-day deadline overtly. Track time carefully. If party ignores quest, massacre happens during Baron's festival (Session 5N: St. Andral's Feast from module).

### Wizard of Wines Delivery
**Key NPCs:** Urwin Martikov, Davian Martikov, Elvir & Adrian Martikov
**Combat Encounters:** 30-40 needle/vine blights, 12-15 druids, Wintersplinter (CR 7 tree blight)
**Gem Locations:** 1 at winery (recoverable), 1 at Yester Hill (requires side trip), 1 at Berez (Return Berez Gem quest)
**Wereraven Secret:** Martikovs are wereravens (Keepers of the Feather). Reveal when trust is high enough.
**DM Tip:** Winery assault can be overwhelming. Allow creative solutions (fire, luring blights away, negotiating with druids). Wintersplinter is memorable setpiece - describe its size and power. Recovering 1 gem completes quest; finding all 3 unlocks special benefits.

### Werewolf Den Hunt
**Key NPCs:** Kiril Stoyanovich (alpha, CR 5), Emil Toranescu (captive, CR 5 when freed), Zuleika Toranescu
**Combat:** 6-8 werewolves with pack tactics. Silvered weapons essential (resistance to non-magical/non-silver damage).
**Moral Choice:** Kill Emil (end threat) vs Save Emil (gain ally, Emil challenges Kiril for pack leadership)
**Consequences:** Saving Emil creates werewolf faction that opposes Strahd. Killing Emil eliminates some werewolf encounters but loses valuable ally for final battle.
**DM Tip:** Make Emil sympathetic - he was imprisoned for defying Kiril's cruelty. Kiril is brutal leader who serves Strahd. If Emil freed, he fights Kiril (dramatic duel). Zuleika loves Emil - her pleas can influence party.

### Abbey Investigation
**Key NPCs:** The Abbot (deva, CR 10), Vasilka (flesh golem bride, CR 5), Clovin Belview (mongrelfolk servant)
**Combat Avoidance:** Abbot is CR 10 - far above party level. Should only fight if party provokes him.
**Moral Complexity:** Abbot genuinely believes Vasilka as Strahd's bride will end curse. He's deluded, not evil. Mongrelfolk are tragic creations, not threats.
**Outcomes:**
- **Help Abbot:** Provide wedding dress, get Abbey blessing (+1d4 saves vs fear, valuable against Strahd)
- **Oppose Abbot:** CR 10 fight (very hard), Abbot becomes enemy, mongrelfolk scatter
- **Ignore:** No mechanical consequences, but morally unsettling
**DM Tip:** Vasilka is tragic figure - flesh golem made from parts, unaware of her nature. Abbot's sincere belief in his plan makes this disturbing. No "right answer" - moral ambiguity is the point.

### Return the Berez Gem
**Key NPCs:** Baba Lysaga (night hag boss, CR 11), giant skull guardian
**Combat:** CR 11 encounter with legendary actions, lair actions, creeping hut (CR 4), scarecrow guardians
**Difficulty:** Very hard for level 7-8 party. Baba Lysaga is Strahd's "mother figure" and powerful spellcaster.
**Lair Hazards:** Creeping hut on chicken legs attacks alongside Baba Lysaga. Scarecrows ambush approach. Swamp terrain (difficult terrain, obscurement).
**Alternative Approaches:**
- **Stealth:** Infiltrate hut while Baba Lysaga away (risky - she returns quickly)
- **Bargain:** Offer something valuable in exchange for gem (what does night hag want?)
- **Distraction:** Lure Baba Lysaga away from hut, steal gem
**DM Tip:** This is endgame-tier encounter. Baba Lysaga has legendary actions (3/round), lair actions (initiative 20), and potent spells. She regenerates unless killed with radiant damage or in sunlight. Describe her bathtub (Strahd as child) for maximum creepiness. Reward (1000 XP + gem + magic item) justifies difficulty.

### Dream Pastry Investigation
**Key NPCs:** Morgantha (night hag, CR 5), Bella & Offalia Wormwiggle (daughters, night hags)
**Combat:** CR 9 total (3 night hags with coven magic). If 1 hag reduced below half HP, she flees. If 2 defeated, coven breaks.
**Moral Dilemma:** Pastries are made from children's bones but provide only happiness in miserable Barovia. Villagers are addicted. Stopping hags saves children but removes villagers' only comfort.
**Coven Tactics:** 1 hag engages party while 2 use coven spells (Lightning Bolt, Hold Person). If losing, hags flee via Etherealness.
**DM Tip:** Emphasize moral complexity. Villagers will be angry if pastries stop. Addicts may attack party. Children imprisoned in cages upstairs - tragic scene. Morgantha is manipulative, not overtly evil. No clean resolution exists.

### Missing Vistana
**Key NPCs:** Luvash (Vistani leader), Arabelle (7-year-old prophetic Vistana), Bluto (mad fisherman)
**Time Pressure:** Arabelle drowning in weighted sack - 10 rounds (1 minute) once party finds Bluto
**Investigation:** DC 12 Investigation to track Arabelle to Lake Zarovich, DC 10 Perception to spot Bluto's boat
**Consequences:**
- **Save Arabelle:** Luvash grateful, gives treasure (250 gp + ring of warmth), Vistani alliance, future sanctuary at camp
- **Fail to Save:** Luvash devastated and hostile, Vistani become enemies, camp closed to party
**Arabelle's Gift:** She has prophetic visions (like Madam Eva). Can provide plot hints if saved. Valuable ally.
**DM Tip:** Create urgency when party finds Bluto. Bluto is not evil, just mad - believes sacrificing child will improve fishing. Luvash's grief is palpable if Arabelle dies. If saved, Arabelle's visions can guide party toward artifacts or Strahd's weaknesses (DM discretion).

---

## Integration with Main Quest

### Main Quest Synergy

**Quest 5: Escort Ireena to Vallaki**
- Unlocks Vallaki content, including St. Andral's Feast
- Father Lucian offers sanctuary to Ireena at church (if bones recovered)
- St. Andral's Feast failure endangers Ireena if she's at church

**Quest 8: Seek the Vistani (Tarokka Reading)**
- Unlocks Tser Pool Encampment, triggering Missing Vistana
- Vistani alliance from Missing Vistana provides safe haven and information network

**Quest 12: Destroy Strahd von Zarovich**
- Werewolf allies (from Werewolf Den Hunt) can assist in final battle
- Martikov/Keepers alliance (from Wizard of Wines) provides intelligence and wereraven scouts
- Abbey blessing (from Abbey Investigation) grants +1d4 to fear saves vs Strahd

### Optional Quest Completion Bonuses

Side quests enhance main quest experience but are not required. Players who complete side quests gain:
- **Additional allies for final battle** (werewolves, wereravens, Vistani)
- **Better equipment** (silvered weapons, magic items, Abbey blessing)
- **Higher level** (4,000 XP = approximately 1 level for 4-player party)
- **Deeper world understanding** (Barovia's suffering, moral complexities, NPC relationships)

---

## Session Planning

### Expected Session Count per Quest

| Quest | Sessions | Notes |
|-------|----------|-------|
| Missing Vistana | 1 session | Quick rescue mission with time pressure |
| Dream Pastry Investigation | 1-2 sessions | Investigation + moral dilemma + potential combat |
| St. Andral's Feast | 2-3 sessions | Investigation spread over 5 in-game days |
| Wizard of Wines | 2-3 sessions | Travel + winery assault + optional Yester Hill |
| Werewolf Den Hunt | 2-3 sessions | Tracking + infiltration + moral choice |
| Abbey Investigation | 1-2 sessions | Roleplay-heavy, combat optional |
| Return Berez Gem | 2-3 sessions | Dangerous approach + very hard boss fight |

**Total:** 12-20 sessions for all 7 quests (3-5 months of weekly play)

### Parallel Quest Management

**Simultaneous Active Quests:**
- St. Andral's Feast (5-day timer running in background)
- Wizard of Wines (wine shortage affects Vallaki morale)
- Dream Pastry Investigation (hags continue kidnapping children)

**DM Tip:** Track quest timers in your notes. EventScheduler handles deadlines automatically, but you should narrate consequences of time passing. Example: "Day 3 of St. Andral's Feast deadline - Father Lucian becomes increasingly anxious."

---

## Combat Difficulty Reference

### Easy Encounters (CR 1-3)
- None (all side quests are challenging)

### Medium Encounters (CR 4-6)
- Missing Vistana: No combat required (investigation/rescue)
- St. Andral's Feast: Investigation-focused (combat only if failed)
- Dream Pastry Investigation: CR 5 night hags individually

### Hard Encounters (CR 7-9)
- Wizard of Wines: CR 7 Wintersplinter + blight swarms
- Werewolf Den Hunt: 6-8 werewolves with pack tactics
- Dream Pastry Investigation: CR 9 hag coven (3 hags together)
- Abbey Investigation: Mongrelfolk encounters (avoidable)

### Deadly Encounters (CR 10-11)
- Abbey Investigation: CR 10 Abbot (deva) if provoked
- Return Berez Gem: CR 11 Baba Lysaga + CR 4 hut + scarecrows

**Party Level Recommendations:**
- Level 4-5: Missing Vistana, Dream Pastry, St. Andral's Feast
- Level 5-6: Wizard of Wines, Werewolf Den Hunt
- Level 6-8: Abbey Investigation
- Level 7-8: Return Berez Gem

---

## Common Pitfalls

### St. Andral's Feast
**Pitfall:** Party ignores time constraint, assumes quest can wait.
**Solution:** Track days explicitly. On Day 4, Father Lucian becomes frantic. On Day 5, vampire spawn attack happens (canonical event).

### Wizard of Wines
**Pitfall:** Party tries to fight all 40 blights + druids simultaneously.
**Solution:** Encourage tactical thinking - fire, divide enemies, use terrain. Davian can provide combat assistance if asked.

### Werewolf Den Hunt
**Pitfall:** Party attacks without silvered weapons.
**Solution:** Werewolves have resistance to non-magical/non-silvered damage. Make this clear in combat descriptions. Hunters can sell silvered weapons beforehand.

### Abbey Investigation
**Pitfall:** Party attacks Abbot immediately.
**Solution:** Abbot is CR 10 - make his power obvious (angelic appearance, healing word demonstrates divine magic). Clovin warns party not to anger the Abbot.

### Return Berez Gem
**Pitfall:** Party underestimates Baba Lysaga difficulty.
**Solution:** Davian warns this is extremely dangerous. Baba Lysaga is Strahd's "mother figure" and ancient. Describe scarecrows and creeping hut to build tension.

### Dream Pastry Investigation
**Pitfall:** Party expects simple good vs evil resolution.
**Solution:** Emphasize moral complexity. Villagers plead for pastries. Addicts threaten party. No clean solution exists.

### Missing Vistana
**Pitfall:** Party takes too long to reach Bluto, Arabelle drowns.
**Solution:** Create urgency in narration. Bluto is visible on lake. Make drowning time limit clear (10 rounds once sack in water).

---

## Future Side Quests (Stories 4-14+)

**Story 4-13 delivered 7 of 18 planned side quests.** Remaining 11 quests will be implemented in future stories:

- Vallaki Festivals (Baron's weekly festivals)
- Death House Expansion (extended haunted house)
- Amber Temple Dark Gifts (vestiges corruption)
- Van Richten's Monster Hunts (vampire hunter missions)
- Mad Mage Encounter (Mordenkainen subplot)
- Argynvostholt Silver Dragon Quest (Order of the Silver Dragon)
- Berez Ruins Exploration (Baba Lysaga's lair extended)
- Lake Zarovich Mysteries (underwater discoveries)
- Tsolenka Pass Guardians (Roc and vrocks)
- Vistani Fortune Telling (Madam Eva's cards)
- Castle Ravenloft Infiltration (stealth mission)

**Implementation:** Stories 4-14 to 4-18 will create remaining side quests in batches similar to Story 4-13 approach.

---

## Appendix: Quick Reference

### Quest Trigger Checklist

- [ ] **St. Andral's Feast:** Party arrives in Vallaki (wait 3 days)
- [ ] **Wizard of Wines:** Party meets Urwin at Blue Water Inn, gains trust ≥ 2
- [ ] **Werewolf Den Hunt:** Party encounters hunters or hears werewolf attack rumors
- [ ] **Abbey Investigation:** Party arrives in Krezk, speaks to Dmitri
- [ ] **Return Berez Gem:** Complete Wizard of Wines, Davian reveals location
- [ ] **Dream Pastry Investigation:** Encounter Morgantha or visit Old Bonegrinder
- [ ] **Missing Vistana:** Visit Tser Pool, speak to Luvash

### DM Prep Checklist per Quest

**Before Session:**
- [ ] Review quest YAML file in `game-data/quests/{quest_id}.yaml`
- [ ] Note NPC stat blocks and motivations
- [ ] Prepare battlemap if combat expected
- [ ] Set up EventScheduler timers for deadlines (St. Andral's Feast, Missing Vistana)
- [ ] Review moral dilemma aspects (Abbey, Dream Pastry, Werewolf Den)

**During Session:**
- [ ] Track quest timer if applicable
- [ ] Narrate consequences of player choices
- [ ] Update location State.md files with quest progress
- [ ] Update quest-state.yaml with status changes

**After Session:**
- [ ] Update quest status (active, completed, failed)
- [ ] Apply quest rewards (XP, items, reputation)
- [ ] Trigger next quest events if prerequisites met
- [ ] Note player choices for future consequence callbacks

---

**Document Status:** Final
**Maintainer:** Kapi
**Last Updated:** 2025-11-16
**Related Stories:** 4-13 (Side Quests Batch 1)
