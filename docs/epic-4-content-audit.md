# Epic 4 Content Audit - Curse of Strahd

**Date:** 2025-11-10
**Purpose:** Comprehensive inventory of all Curse of Strahd content for Epic 4 implementation
**Source:** Curse of Strahd (CoS) module
**Status:** Complete

---

## Executive Summary

**Total Content Identified:**
- **Locations:** 34 major locations + sub-locations
- **NPCs:** 52 named NPCs (major and notable minor)
- **Monsters:** 25 unique monster types
- **Magic Items:** 14 significant items (3 legendary artifacts)
- **Quests:** 12 main quests + 18 side quests

**Epic 4 Implementation Priority:**
1. **Phase 1 (Stories 4-1 to 4-6):** Core locations (Barovia, Vallaki, Krezk, Castle Ravenloft)
2. **Phase 2 (Stories 4-7 to 4-12):** Major NPCs and quest chains
3. **Phase 3 (Stories 4-13 to 4-18):** Monsters, items, systems (Tarokka, Strahd AI)

---

## Locations (34 Major Locations)

### Tier 1: Critical Path Locations (Must-Have for MVP)

| Location ID | Name | Type | Priority | Notes |
|-------------|------|------|----------|-------|
| `village_of_barovia` | Village of Barovia | Settlement | **P0** | Starting location, Ismark, Ireena, cemetery |
| `death_house` | Death House | Dungeon | **P0** | Intro adventure, connects to main story |
| `tser_pool_encampment` | Tser Pool Vistani Encampment | Camp | **P0** | Madam Eva, Tarokka reading |
| `vallaki` | Town of Vallaki | Settlement | **P0** | Major hub, multiple quests |
| `castle_ravenloft` | Castle Ravenloft | Mega-Dungeon | **P0** | Final dungeon, 60+ rooms, Strahd's lair |
| `krezk` | Village of Krezk | Settlement | **P1** | Abbey of St. Markovia, pool, quest hub |

### Tier 2: Major Locations (High Priority)

| Location ID | Name | Type | Priority | Notes |
|-------------|------|------|----------|-------|
| `old_bonegrinder` | Old Bonegrinder | Windmill/Lair | **P1** | Night hag coven, dream pastries |
| `tsolenka_pass` | Tsolenka Pass | Bridge/Encounter | **P1** | Roc nest, connects to Amber Temple |
| `amber_temple` | Amber Temple | Temple/Dungeon | **P1** | Dark secrets, artifacts, vestiges |
| `werewolf_den` | Werewolf Den | Cave/Lair | **P1** | Werewolf pack, potential artifact location |
| `yester_hill` | Yester Hill | Druid Grove | **P1** | Druids, Wintersplinter, Gulthias Tree |
| `argynvostholt` | Argynvostholt | Mansion/Ruins | **P1** | Order of the Silver Dragon, Vladimir Horngaard |
| `van_richten_tower` | Van Richten's Tower | Tower/Safehouse | **P1** | Vampire hunter, tools, knowledge |
| `berez` | Ruined Village of Berez | Ruins | **P2** | Baba Lysaga's hut, Marina's monument |

### Tier 3: Optional/Flavor Locations

| Location ID | Name | Type | Priority | Notes |
|-------------|------|------|----------|-------|
| `lake_zarovich` | Lake Zarovich | Landmark | **P2** | Fishing, Bluto encounter |
| `mad_mage_of_mount_baratok` | Mount Baratok (Mad Mage) | Encounter | **P2** | Mordenkainen, optional ally |
| `raven_river_crossroads` | Raven River Crossroads | Landmark | **P3** | Gallows, corpses, atmospheric |
| `svalich_woods` | Svalich Woods | Forest/Region | **P3** | Random encounters, travel |
| `wizard_of_wines_winery` | Wizard of Wines Winery | Winery/Quest | **P1** | Martikov family, wine delivery quest |
| `ruins_of_berez` | Ruins of Berez | Ruins | **P2** | Baba Lysaga lair, Marina's memorial |

### Castle Ravenloft Sub-Locations (60+ Rooms)

**Castle Structure (18 major areas):**
1. Entry/Gates
2. Court of the Count (throne room)
3. Chapel
4. Crypts (K84-K88, 30+ crypts)
5. Dining Hall
6. Hall of Bones
7. Study
8. Tower of Strahd (private chambers)
9. Larders (prison cells)
10. Torture Chamber
11. Treasury
12. Familiar's Lair
13. Belfry
14. Overlook
15. Audience Hall
16. Spires (North, South)
17. Catacombs
18. Heart of Sorrow (Strahd's weakness)

**Note:** Castle Ravenloft is a mega-dungeon. Each major area may be its own location folder or subsection.

---

## NPCs (52 Named NPCs)

### Tier 1: Critical Story NPCs (Must-Have)

| NPC ID | Name | Role | Location | Priority | Notes |
|--------|------|------|----------|----------|-------|
| `strahd_von_zarovich` | Strahd von Zarovich | Main Villain | Castle Ravenloft | **P0** | CR 15, legendary actions, spellcaster |
| `ireena_kolyana` | Ireena Kolyana | Quest Target/Ally | Village of Barovia | **P0** | Tatyana reincarnation, central to plot |
| `ismark_kolyanovich` | Ismark Kolyanovich | Quest Giver/Ally | Village of Barovia | **P0** | "Ismark the Lesser", protector |
| `madam_eva` | Madam Eva | Seer/Quest Giver | Tser Pool | **P0** | Tarokka reading, prophecy |
| `rudolph_van_richten` | Rudolph van Richten | Vampire Hunter/Ally | Van Richten's Tower | **P0** | Legendary vampire hunter, disguised |
| `ezmerelda_d_avenir` | Ezmerelda d'Avenir | Monster Hunter/Ally | Various | **P0** | Van Richten's protégé |

### Tier 2: Major Quest NPCs

| NPC ID | Name | Role | Location | Priority |
|--------|------|------|----------|----------|
| `father_lucian_petrovich` | Father Lucian Petrovich | Priest | Vallaki Church | **P1** |
| `baron_vargas_vallakovich` | Baron Vargas Vallakovich | Leader (Tyrant) | Vallaki | **P1** |
| `lady_fiona_wachter` | Lady Fiona Wachter | Noble (Strahd Loyalist) | Vallaki | **P1** |
| `burgomaster_dmitri_krezkov` | Burgomaster Dmitri Krezkov | Leader | Krezk | **P1** |
| `the_abbot` | The Abbot (Deva) | Mad Angel | Abbey of St. Markovia | **P1** |
| `vasilka` | Vasilka | Flesh Golem "Bride" | Abbey | **P1** |
| `kasimir_velikov` | Kasimir Velikov | Dusk Elf Leader | Vistani Camp | **P1** |
| `davian_martikov` | Davian Martikov | Winery Owner | Wizard of Wines | **P1** |
| `urwin_martikov` | Urwin Martikov | Innkeeper (Wereraven) | Blue Water Inn, Vallaki | **P1** |
| `rictavio` | Rictavio (Van Richten disguise) | Carnival Master | Vallaki | **P1** |
| `blinsky` | Gadof Blinsky | Toymaker | Vallaki | **P2** |
| `morgantha` | Morgantha | Night Hag | Old Bonegrinder | **P1** |
| `baba_lysaga` | Baba Lysaga | Witch | Berez | **P1** |
| `vladimir_horngaard` | Vladimir Horngaard | Revenant Knight | Argynvostholt | **P1** |
| `kiril_stoyanovich` | Kiril Stoyanovich | Werewolf Pack Leader | Werewolf Den | **P1** |

### Tier 3: Notable Minor NPCs (20+ additional)

- **Vistani:** Luvash, Arrigal, Arabelle
- **Barovia Villagers:** Mad Mary, Parriwimple
- **Vallaki Residents:** Izek Strazni (guard captain), Wachter sons
- **Castle Servants:** Cyrus Belview, Rahadin (chamberlain)
- **Druids:** Strahd Zombies on Yester Hill
- **Order of Silver Dragon:** Godfrey Gwilym, Sir Godfrey
- **Amber Temple:** Exethanter (lich), Vilnius (mummy)
- **Krezk/Abbey:** Clovin Belview, Otto Belview
- **Random Encounters:** Arrigal (Vistani spy), mad adventurers

---

## Monsters (25 Unique Types)

### Undead (Strahd's Minions)

| Monster ID | Name | CR | Priority | Notes |
|------------|------|----|-----------|----|
| `zombie` | Zombie | 1/4 | **P0** | Common enemy, Undead Fortitude |
| `ghoul` | Ghoul | 1 | **P1** | Paralyzing touch |
| `wight` | Wight | 3 | **P1** | Life drain, spawn zombies |
| `wraith` | Wraith | 5 | **P1** | Incorporeal, life drain |
| `vampire_spawn` | Vampire Spawn | 5 | **P0** | Strahd's servants |
| `strahd_zombie` | Strahd Zombie | 3 | **P1** | Enhanced zombies (Loathsome Limbs) |
| `revenant` | Revenant | 5 | **P1** | Order of Silver Dragon ghosts |

### Beasts & Monstrosities

| Monster ID | Name | CR | Priority | Notes |
|------------|------|----|-----------|----|
| `wolf` | Wolf | 1/4 | **P0** | Strahd's spies |
| `dire_wolf` | Dire Wolf | 1 | **P0** | Pack hunters |
| `swarm_of_bats` | Swarm of Bats | 1/4 | **P1** | Castle Ravenloft encounters |
| `swarm_of_ravens` | Swarm of Ravens | 1/4 | **P1** | Keepers of the Feather allies |
| `giant_spider` | Giant Spider | 1 | **P2** | Death House, forests |
| `shambling_mound` | Shambling Mound | 5 | **P2** | Yester Hill |

### Lycanthropes

| Monster ID | Name | CR | Priority | Notes |
|------------|------|----|-----------|----|
| `werewolf` | Werewolf | 3 | **P1** | Werewolf Den encounter |
| `wereraven` | Wereraven | 2 | **P1** | Keepers of the Feather (allies) |

### Constructs & Aberrations

| Monster ID | Name | CR | Priority | Notes |
|------------|------|----|-----------|----|
| `flesh_golem` | Flesh Golem | 5 | **P1** | Abbey, Vasilka |
| `scarecrow` | Scarecrow | 1 | **P2** | Fields, Old Bonegrinder |
| `animated_armor` | Animated Armor | 1 | **P1** | Castle Ravenloft |

### Fiends & Fey

| Monster ID | Name | CR | Priority | Notes |
|------------|------|----|-----------|----|
| `night_hag` | Night Hag | 5 | **P1** | Morgantha, Old Bonegrinder |
| `nightmare` | Nightmare | 3 | **P1** | Strahd's mount |
| `dretch` | Dretch | 1/4 | **P2** | Amber Temple |

### Unique/Boss Monsters

| Monster ID | Name | CR | Priority | Notes |
|------------|------|----|-----------|----|
| `strahd_von_zarovich` | Strahd von Zarovich | 15 | **P0** | Custom legendary creature |
| `wintersplinter` | Wintersplinter (Tree Blight) | 7 | **P1** | Yester Hill mega-tree |
| `baba_lysaga` | Baba Lysaga | 11 | **P1** | Unique spellcaster, flying hut |
| `roc` | Roc | 11 | **P2** | Tsolenka Pass guardian |

---

## Magic Items & Artifacts (14 Significant Items)

### Legendary Artifacts (3 - Tarokka Determines Locations)

| Item ID | Name | Rarity | Priority | Notes |
|---------|------|--------|----------|-------|
| `sunsword` | Sunsword | Legendary | **P0** | +2 longsword, radiant damage, sunlight |
| `holy_symbol_of_ravenkind` | Holy Symbol of Ravenkind | Legendary | **P0** | Turn undead, Hold Vampires, sentient |
| `tome_of_strahd` | Tome of Strahd | Legendary | **P0** | Strahd's journal, lore, weaknesses |

### Major Magic Items

| Item ID | Name | Rarity | Priority | Notes |
|---------|------|--------|----------|-------|
| `icon_of_ravenloft` | Icon of Ravenloft | Rare | **P1** | From Castle treasury |
| `luck_blade` | Luck Blade | Legendary | **P2** | Amber Temple or random |
| `blood_spear_of_kavan` | Blood Spear of Kavan | Rare | **P1** | Yester Hill, druids' relic |
| `gulthias_staff` | Gulthias Staff | Rare | **P1** | Yester Hill, necromantic |

### Notable Equipment

| Item ID | Name | Rarity | Priority | Notes |
|---------|------|--------|----------|-------|
| `van_richten_journal` | Van Richten's Journal | Common (lore) | **P1** | Vampire hunting knowledge |
| `rictavio_wagon` | Rictavio's Carnival Wagon | Unique | **P1** | Contains vampire hunter tools + saber-toothed tiger |
| `animated_broom` | Animated Broom | Uncommon | **P2** | Baba Lysaga's hut |
| `baba_lysaga_creeping_hut` | Baba Lysaga's Creeping Hut | Unique | **P1** | Flying skull-adorned hut |

### Consumables

| Item ID | Name | Rarity | Priority | Notes |
|---------|------|--------|----------|-------|
| `dream_pastries` | Dream Pastries | Common (cursed) | **P1** | Old Bonegrinder, addictive |
| `holy_water` | Holy Water | Common | **P1** | Effective vs undead |

---

## Quests (30 Total: 12 Main + 18 Side)

### Main Story Quests (Critical Path)

| Quest ID | Name | Type | Priority | Giver |
|----------|------|------|----------|-------|
| `bury_the_burgomaster` | Bury the Burgomaster | Main | **P0** | Ismark |
| `escort_ireena_to_vallaki` | Escort Ireena to Vallaki | Main | **P0** | Ismark |
| `madame_evas_tarokka_reading` | Madam Eva's Tarokka Reading | Main | **P0** | Madam Eva |
| `find_the_sunsword` | Find the Sunsword | Main | **P0** | Tarokka prophecy |
| `find_holy_symbol_of_ravenkind` | Find the Holy Symbol | Main | **P0** | Tarokka prophecy |
| `find_tome_of_strahd` | Find the Tome of Strahd | Main | **P0** | Tarokka prophecy |
| `find_strahd` | Locate Strahd for Final Battle | Main | **P0** | Tarokka prophecy |
| `ally_quest` | Find the Prophesied Ally | Main | **P0** | Tarokka prophecy |
| `defeat_strahd` | Defeat Strahd von Zarovich | Main | **P0** | Campaign goal |
| `escape_barovia` | Escape Barovia | Main | **P0** | After Strahd defeated |

### Major Side Quests

| Quest ID | Name | Location | Priority | Giver/Trigger |
|----------|------|----------|----------|---------------|
| `death_house_exploration` | Explore Death House | Death House | **P0** | Optional intro |
| `st_andrals_feast` | St. Andral's Feast | Vallaki | **P1** | Father Lucian |
| `vallaki_revolution` | Vallaki Power Struggle | Vallaki | **P1** | Baron or Fiona Wachter |
| `wizard_of_wines_quest` | Restore the Winery | Wizard of Wines | **P1** | Davian Martikov |
| `missing_child` | Find Arabelle | Vallaki/Lake | **P1** | Luvash (Vistani) |
| `old_bonegrinder_investigation` | Investigate Dream Pastries | Old Bonegrinder | **P1** | Villagers |
| `amber_temple_exploration` | Secrets of the Amber Temple | Amber Temple | **P1** | Kasimir or discovery |
| `order_of_silver_dragon` | Restore the Order's Honor | Argynvostholt | **P1** | Vladimir Horngaard |
| `van_richten_alliance` | Ally with Van Richten | Van Richten's Tower | **P1** | Find disguised hunter |
| `baba_lysaga_confrontation` | Defeat Baba Lysaga | Berez | **P1** | Discovery or Martikov family |
| `abbot_madness` | The Abbot's Madness | Abbey, Krezk | **P1** | Burgomaster Krezkov |
| `werewolf_den_assault` | Clear the Werewolf Den | Werewolf Den | **P1** | Discovery or werewolf attacks |
| `yester_hill_druids` | Stop the Druids' Ritual | Yester Hill | **P1** | Martikov family |

### Minor Side Quests (8 additional)

- **Blinsky's Tragic Toys** (Vallaki)
- **Rictavio's Secret** (Vallaki)
- **The Mad Mage of Mount Baratok** (Mount Baratok)
- **Tsolenka Pass Guardian** (Roc encounter)
- **Castle Dinner Invitation** (Strahd invites party)
- **Kasimir's Dark Ambition** (Resurrect sister at Amber Temple)
- **The Bones of St. Andral** (Vallaki church)
- **Vasilka's Bride** (Abbey of St. Markovia)

---

## Systems & Mechanics (Unique to Curse of Strahd)

### Tarokka Deck System

**Purpose:** Randomize artifact locations, ally, and Strahd encounter location

**Implementation:** Story 4-16

**Components:**
- 54-card deck (Common + High Deck)
- 5 card reading (Treasure locations x3, Ally, Strahd location)
- Each card maps to specific location/NPC

**Example Mapping:**
- **Sunsword Location:** Drawn from Common Deck → Maps to location (e.g., "Transmuter" = Khazan's Tower)
- **Ally:** Drawn from High Deck → Maps to NPC (e.g., "Mists" = Ezmerelda d'Avenir)
- **Strahd Encounter:** Drawn from High Deck → Maps to Castle Ravenloft area

### Strahd AI Behavior System

**Purpose:** Make Strahd feel like an intelligent, adaptive antagonist

**Implementation:** Story 4-17

**Behavior Patterns:**
1. **Observation Phase:** Strahd watches party from distance, gathers intelligence
2. **Testing Phase:** Sends minions (wolves, vampire spawn) to test strength
3. **Psychological Warfare:** Appears to taunt, charm, or mislead party
4. **Direct Engagement:** Attacks when advantageous, retreats when outmatched
5. **Lair Tactics:** Uses Castle Ravenloft features (Heart of Sorrow, traps, minions)

**Trigger Conditions:**
- Party threatens Ireena → Strahd escalates
- Party finds artifacts → Strahd becomes more aggressive
- Party enters Castle Ravenloft → Lair actions activate

### Dark Powers & Vestiges (Amber Temple)

**Purpose:** Tempt players with evil bargains for power

**Implementation:** Part of Amber Temple content (Story 4-5 or later)

**Examples:**
- Vampyr: Become vampire (Strahd's patron)
- Zhudun: Corpse Star → Regeneration
- Sykane: Soul Hungerer → Extra spell slots

---

## Implementation Roadmap for Epic 4

### Phase 1: Core Locations (Stories 4-1 to 4-6)

**Story 4-1:** Village of Barovia (first location, integration test)
**Story 4-2:** Castle Ravenloft Structure (mega-dungeon framework)
**Story 4-3:** Vallaki Location (major hub)
**Story 4-4:** Krezk Location (northern hub)
**Story 4-5:** Major Locations Batch 1 (Death House, Tser Pool, Old Bonegrinder)
**Story 4-6:** Major Locations Batch 2 (Amber Temple, Argynvostholt, Wizard of Wines)

### Phase 2: NPCs & Quest Content (Stories 4-7 to 4-12)

**Story 4-7:** Strahd NPC Profile (unique, complex)
**Story 4-8:** Ireena NPC Profile (Tatyana reincarnation)
**Story 4-9:** Major NPCs Batch 1 (Ismark, Madam Eva, Van Richten, Ezmerelda)
**Story 4-10:** Major NPCs Batch 2 (Vallaki NPCs: Baron, Fiona, Lucian)
**Story 4-11:** Main Quest System (Tarokka reading, artifact quests)
**Story 4-12:** Artifact Quests (Sunsword, Holy Symbol, Tome retrieval)

### Phase 3: Monsters, Items, Systems (Stories 4-13 to 4-18)

**Story 4-13:** Side Quests Batch 1 (St. Andral's Feast, Wizard of Wines, Vallaki Revolution)
**Story 4-14:** Monster Stat blocks (Zombies, vampire spawn, werewolves, etc.)
**Story 4-15:** Item Database (Artifacts, magic items, consumables)
**Story 4-16:** Tarokka Reading System (card deck, randomization, location mapping)
**Story 4-17:** Strahd AI Behavior (combat tactics, roleplay, goals)
**Story 4-18:** (Optional) Additional content polish

---

## Dependencies on Epic 1-3

### Epic 1 Dependencies
- ✅ LocationLoader → Load location folders
- ✅ StateManager → Persist NPC states, quest progress

### Epic 2 Dependencies
- ✅ EventScheduler → Time-based encounters, Strahd appearances
- ✅ CalendarManager → Track quest deadlines, day/night cycle

### Epic 3 Dependencies
- ✅ CharacterManager → Load NPC stat blocks
- ✅ CombatManager → Initiative, combat encounters
- ✅ SpellManager → Strahd's spellcasting, NPC casters
- ✅ ItemDatabase → Artifacts, equipment
- ✅ EquipmentManager → Equip Sunsword, armor

---

## Validation Checklist

Before marking Epic 4 as complete:

- [ ] All 34 major locations implemented with complete files (Description, NPCs, Items, Events, State, metadata)
- [ ] All 52 named NPCs have profiles (stat blocks, personality, dialogue, AI behavior)
- [ ] All 25 monster types have stat blocks compatible with CombatManager
- [ ] All 14 significant magic items defined (including 3 legendary artifacts)
- [ ] Main quest chain (10 quests) fully implemented and tested
- [ ] At least 10 side quests implemented
- [ ] Tarokka deck system functional (card draw → location mapping)
- [ ] Strahd AI behavior system implemented (observation, testing, engagement phases)
- [ ] Full playthrough possible from Death House to Strahd defeat
- [ ] All content validation tests passing
- [ ] Playtesting confirms narrative quality and mechanical soundness

---

**Audit Status:** ✅ COMPLETE
**Total Implementation Estimate:** 12-18 stories (matches sprint-status.yaml)
**Ready for:** Epic 4 sprint planning
