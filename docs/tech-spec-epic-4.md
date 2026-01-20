# Epic Technical Specification: Curse of Strahd Content Implementation

Date: 2025-11-10
Author: Kapi
Epic ID: 4
Status: Draft

---

## Overview

Epic 4 implements the complete Curse of Strahd campaign content for Kapi-s-RPG, transforming the platform from a mechanics-enabled D&D 5e engine into a fully playable gothic horror adventure in the dread realm of Barovia. This epic delivers all official Curse of Strahd locations, NPCs, monsters, quests, and magic items, enabling players to experience the complete 30-50 hour campaign from arriving in the Village of Barovia through the final confrontation with Strahd von Zarovich in Castle Ravenloft.

Building on Epic 1's folder-based location system, Epic 2's dynamic calendar and event scheduling, and Epic 3's complete D&D 5e mechanics integration, Epic 4 focuses exclusively on content implementation using standardized templates. This epic imports and structures 34 major locations (including Castle Ravenloft's 60+ rooms), 52 named NPCs with complete stat blocks and AI behavior, 25 monster types, 14 significant magic items including three legendary artifacts (Sunsword, Holy Symbol of Ravenkind, Tome of Strahd), and 30 interconnected quests spanning main story arcs and optional side content.

**Key Deliverables:** Complete Curse of Strahd campaign data in location folders, NPC profiles compatible with Epic 3 CharacterManager, monster stat blocks integrated with CombatManager, quest system using Epic 2 EventScheduler for time-based triggers, Tarokka reading system for artifact randomization, and sophisticated Strahd AI behavior system implementing legendary creature mechanics including legendary actions, lair actions, and tactical combat intelligence.

## Objectives and Scope

**In Scope:**

✅ **Locations (34 major + sub-locations)**
- Village of Barovia (starting location with burgomaster mansion, church, tavern)
- Castle Ravenloft mega-dungeon (60+ rooms across multiple floors and towers)
- Town of Vallaki (major hub with church, burgomaster mansion, inn, shops)
- Village of Krezk (Abbey of St. Markovia, blessed pool)
- Death House (introductory dungeon)
- Tser Pool Vistani Encampment (Madam Eva, Tarokka reading)
- Old Bonegrinder (night hag coven windmill)
- Amber Temple (high-level dungeon with dark vestiges)
- Wizard of Wines Winery (Martikov family, druids)
- Argynvostholt (Order of the Silver Dragon ruins)
- Van Richten's Tower (vampire hunter safehouse)
- Berez Ruins (Baba Lysaga's hut)
- Werewolf Den, Yester Hill, and 22 additional locations
- All locations use Epic 1 folder structure (Description.md, NPCs.md, Items.md, Events.md, State.md, metadata.yaml)

✅ **NPCs (52 named characters)**
- Strahd von Zarovich (CR 15 legendary vampire, main villain)
- Ireena Kolyana (Tatyana reincarnation, central quest NPC)
- Ismark Kolyanovich, Madam Eva, Rudolph van Richten, Ezmerelda d'Avenir
- Father Lucian Petrovich, Baron Vargas Vallakovich, Burgomaster Dmitri Krezkov
- Rictavio (Van Richten's disguise), Vasili von Holtz (Strahd's disguise)
- Baba Lysaga, Morgantha (night hag), Mad Mage Mordenkainen
- Rahadin (chamberlain), Escher (vampire spawn consort)
- 42 additional named NPCs with profiles, dialogue, schedules, AI behavior

✅ **Monsters (25 types with stat blocks)**
- Vampires: Vampire spawn, Strahd zombies
- Undead: Zombies, skeletons, ghouls, ghasts, wights, wraiths
- Lycanthropes: Werewolves, wereravens
- Fiends: Night hags, nightmare, hell hounds
- Constructs: Animated armor, animated objects
- Aberrations: Brain in a jar, Amber Golems
- Beasts: Dire wolves, giant spiders, ravens, bats, rats
- Special: Strahd's nightmare steed, flesh golem
- All stat blocks compatible with Epic 3 CombatManager format

✅ **Magic Items (14 significant items + treasure)**
- Legendary Artifacts: Sunsword (radiant longsword), Holy Symbol of Ravenkind (sentient amulet), Tome of Strahd (lore book)
- Unique Magic Items: Icon of Ravenloft, Gulthias Staff, Luck Blade, Blood Spear of Kavan
- Spell Scrolls: Various spell levels for loot and treasure
- Standard Equipment: +1/+2 weapons and armor, potions, wondrous items
- All items use Epic 3 ItemDatabase and EquipmentManager formats

✅ **Quest System (30 quests: 12 main + 18 side)**
- Main Quests: Escape from Death House, Bury the Burgomaster, Escort Ireena to Vallaki, Find the Three Artifacts, Destroy Strahd
- Major Side Quests: St. Andral's Feast, Wizard of Wines Delivery, Werewolf Den Hunt, Abbey Investigation, Return Berez Gem
- Minor Side Quests: Dream Pastry Investigation, Missing Vistana, Vallaki Festivals, Krezk Winery Problems
- All quests use quest-template.yaml format with objectives, triggers, branching, Epic 2 EventScheduler integration

✅ **Custom Systems**
- Tarokka Reading System: Card-based randomization for artifact locations, ally identification, enemy weakness
- Strahd AI Behavior: Tactical combat engine with 5 phases (observation, testing, psychological warfare, engagement, retreat)
- Legendary Creature Mechanics: Legendary actions (3 per round), lair actions (initiative 20), regeneration, shapeshifting
- Vampire Mechanics: Charm, children of the night summons, misty escape, sunlight sensitivity, max HP reduction bite

✅ **Content Validation**
- All location folders validate against Epic 1 location-folder-structure spec
- All NPC profiles validate against npc-profile-template.yaml schema
- All monster stat blocks validate against monster-statblock-template.yaml
- All items validate against magic-item-template.yaml
- All quests validate against quest-template.yaml

**Out of Scope:**

❌ **Content from Other D&D Modules** → Future epics (Tomb of Annihilation, Waterdeep, etc.)
❌ **Homebrew Content** → Only official Curse of Strahd materials
❌ **Engine Improvements** → Epic 3 already complete; no new mechanics systems
❌ **LLM-DM Enhancements** → Epic 5 (prompt optimization, caching, context strategies)
❌ **VS Code UI Improvements** → Epic 5 (sidebars, widgets, character sheet panel)
❌ **Multiplayer Support** → Solo play only
❌ **Random Encounter Generation** → Only pre-defined encounters from module
❌ **Dynamic NPC Generation** → All NPCs hand-crafted from official source
❌ **Procedural Content** → All locations and quests from Curse of Strahd book

## System Architecture Alignment

**Architecture Document Reference:** `docs/technical-architecture.md` sections 4-9

**Core Alignment:**

Epic 4 is a **pure content implementation** epic with zero changes to system architecture. All content imports leverage existing systems from Epics 1-3:

1. **Folder-Based Location System** (Architecture §4, Epic 1)
   - All 34 locations follow standardized folder structure from `templates/location/`
   - Each location directory contains 6 required files exactly as specified in Epic 1
   - Castle Ravenloft uses nested sub-location pattern for 60+ rooms
   - Validates against `scripts/validate-location.js` from Epic 1

2. **Game Calendar Integration** (Architecture §5, Epic 2)
   - Quest deadlines integrate with Epic 2 EventScheduler
   - NPC schedules use Epic 2 time advancement system
   - Scheduled events (Strahd attacks, festivals, etc.) registered with CalendarManager
   - Time-based quest triggers (e.g., "7 days to escort Ireena") use Epic 2 event system

3. **D&D 5e Mechanics** (Architecture §8-9, Epic 3)
   - NPC stat blocks use Epic 3 CharacterManager format (abilities, HP, AC, proficiencies)
   - Monster stat blocks compatible with Epic 3 CombatManager (initiative, attacks, damage)
   - Spell database references Epic 3 SpellcastingModule for NPC spellcasters
   - Magic items integrate with Epic 3 ItemDatabase and EquipmentManager
   - Quest rewards use Epic 3 LevelUpCalculator (XP) and InventoryManager (items)

4. **Context Loading Strategy** (Architecture §6)
   - Location content fits within existing Priority 1-3 system
   - Description.md and State.md remain Priority 1 (always loaded)
   - NPCs.md filtered to active NPCs only (Priority 2)
   - Events.md deferred loading for large locations (Priority 3)
   - Target: <3000 tokens per location context (unchanged from Epic 1)

5. **LLM-DM Integration** (Architecture §7)
   - All content uses existing system prompts and context injection
   - No changes to Claude Code integration
   - NPC dialogue and AI behavior notes guide LLM responses
   - Strahd AI behavior provides tactical guidelines without modifying narrator engine

**Architectural Constraints (Inherited):**

- **File-First Design:** All content stored in markdown/YAML files (no database)
- **Git-Compatible:** Plain text files for version control compatibility
- **Human-Readable:** All location files editable in text editor
- **Separation of Concerns:** Content separate from game logic (no code in content files)
- **Context Limits:** Location context must stay under 4096 tokens (Claude model limit)
- **Template Compliance:** All content validates against Epic 4 preparation templates

**No Architecture Changes:**

Epic 4 introduces **zero new systems**. All deliverables are data files conforming to existing interfaces:
- `game-data/locations/` - Location folders
- `game-data/npcs/` - NPC profile files (references from location NPCs.md)
- `game-data/monsters/` - Monster stat block definitions
- `game-data/items/` - Magic item and artifact definitions
- `game-data/quests/` - Quest definition files

**Integration Points:**

| Epic 4 Content | Integrates With | Interface |
|----------------|-----------------|-----------|
| Location folders | Epic 1 LocationLoader | Folder structure (6 required files) |
| NPC profiles | Epic 3 CharacterManager | Character sheet YAML schema |
| Monster stat blocks | Epic 3 CombatManager | Combat stat schema (HP, AC, actions) |
| Quest definitions | Epic 2 EventScheduler | Event trigger schema (date, conditions) |
| Magic items | Epic 3 ItemDatabase + EquipmentManager | Item schema (id, type, effects) |
| Strahd AI behavior | Epic 3 CombatManager | AI behavior notes (tactics, goals) |

## Detailed Design

### Services and Modules

**Epic 4 introduces NO new code modules.** All implementation is content creation using existing systems. This section documents which Epic 1-3 modules will consume Epic 4 content.

| Existing Module | Location | Epic | Responsibility | Epic 4 Content Consumed |
|-----------------|----------|------|----------------|-------------------------|
| **LocationLoader** | `src/data/location-loader.js` | Epic 1 | Load and parse location folders | All 34 location folders (Village of Barovia, Castle Ravenloft, etc.) |
| **StateManager** | `src/core/state-manager.js` | Epic 1 | Persist location state (State.md) | NPC states, quest progress, discovered items, completed events |
| **CalendarManager** | `src/calendar/calendar-manager.js` | Epic 2 | Track in-game time, moon phases, weather | Quest deadlines, NPC schedules, seasonal events |
| **EventScheduler** | `src/calendar/event-scheduler.js` | Epic 2 | Trigger time-based events | Strahd attacks, festivals, quest deadlines, NPC schedule changes |
| **EventExecutor** | `src/calendar/event-executor.js` | Epic 2 | Apply event effects to world state | State changes from quest events (NPC deaths, location changes) |
| **CharacterManager** | `src/mechanics/character-manager.js` | Epic 3 | Parse and manage character sheets | NPC profiles (52 characters including Strahd, Ireena, Van Richten) |
| **CombatManager** | `src/mechanics/combat-manager.js` | Epic 3 | Handle combat encounters | Monster stat blocks (25 types), NPC combat stats, Strahd legendary actions |
| **DiceRoller** | `src/mechanics/dice-roller.js` | Epic 3 | Roll dice for checks and attacks | All ability checks, attack rolls, damage rolls in content |
| **ItemDatabase** | `src/mechanics/item-database.js` | Epic 3 | Manage item definitions | 14 magic items (Sunsword, Holy Symbol, Tome, etc.) |
| **EquipmentManager** | `src/mechanics/equipment-manager.js` | Epic 3 | Track equipped items and attunement | Artifact attunement, NPC equipment |
| **SpellcastingModule** | `src/mechanics/spellcasting-module.js` | Epic 3 | Handle spell casting | NPC spellcasters (Strahd, clerics, wizards) |

**Content Creation Workflow:**

Epic 4 stories follow a **content authoring workflow**, not a code development workflow:

1. **Story 4-1 to 4-6 (Locations):**
   - Create location folder: `game-data/locations/{location-id}/`
   - Author Description.md with atmospheric descriptions
   - Author NPCs.md listing all NPCs present
   - Author Items.md with available loot/treasure
   - Author Events.md with scheduled events
   - Initialize State.md with default state
   - Create metadata.yaml with connections
   - Validate: `npm run validate-location game-data/locations/{location-id}`

2. **Story 4-7 to 4-10 (NPCs):**
   - Create NPC profile: `game-data/npcs/{npc-id}.yaml`
   - Fill npc-profile-template.yaml with stats, abilities, personality
   - Add dialogue snippets and quest involvement
   - Document AI behavior notes for LLM-DM
   - Reference NPC in appropriate location NPCs.md files

3. **Story 4-11 to 4-13 (Quests):**
   - Create quest file: `game-data/quests/{quest-id}.yaml`
   - Fill quest-template.yaml with objectives, triggers, consequences
   - Register time-based triggers with EventScheduler
   - Link quest to relevant location Events.md files

4. **Story 4-14 to 4-15 (Monsters & Items):**
   - Create monster stat block: `game-data/monsters/{monster-id}.yaml`
   - Create item definition: `game-data/items/{item-id}.yaml`
   - Validate against Epic 3 schemas

5. **Story 4-16 to 4-17 (Custom Systems):**
   - Implement Tarokka reading system (data file + logic)
   - Document Strahd AI behavior patterns (tactics, goals, phases)

**No Module Dependencies:**

Since Epic 4 creates only content files, there are no module-to-module dependencies. All existing Epic 1-3 modules remain unchanged.

### Data Models and Contracts

Epic 4 content conforms to data models defined in Epic 4 preparation templates. All schemas documented in `templates/` directory.

**Location Folder Schema** (from Epic 1, validated in Epic 4):
```yaml
# metadata.yaml
location_name: "Village of Barovia"
location_type: "settlement"  # settlement, dungeon, wilderness, special
region: "Barovia Valley"
parent_location: null
connected_locations:
  - id: "death_house"
    direction: "west"
    travel_time: "10 minutes"
  - id: "tser_pool_encampment"
    direction: "east"
    travel_time: "2 hours"
danger_level: 2  # 1-5 scale
recommended_level: 1-3
tags: ["starting_location", "quest_hub", "safe"]
```

**NPC Profile Schema** (from `templates/npc/npc-profile-template.yaml`):
```yaml
npcId: "strahd_von_zarovich"
name: "Count Strahd von Zarovich"
type: "legendary_creature"  # humanoid, legendary_creature, monster

# D&D 5e Stats (Epic 3 CharacterManager format)
abilities:
  strength: 18
  dexterity: 18
  constitution: 18
  intelligence: 20
  wisdom: 15
  charisma: 18

hitPoints:
  max: 144
  current: 144
  hitDice:
    count: 17
    type: "d8"
    modifier: 68

armorClass: 16
speed: 30
proficiencyBonus: 6

# Combat Actions (Epic 3 CombatManager format)
actions:
  - name: "Unarmed Strike"
    type: "melee_weapon_attack"
    attackBonus: 9
    reach: 5
    damage: "1d8+4"
    damageType: "bludgeoning"
    additionalEffect: "grapple (escape DC 18), necrotic damage 3d6, max HP reduction"

# Legendary Creature Mechanics
legendaryActions:
  actionsPerRound: 3
  actions:
    - name: "Move"
      cost: 1
      description: "Strahd moves up to his speed without provoking opportunity attacks"
    - name: "Unarmed Strike"
      cost: 1
      description: "Strahd makes one unarmed strike"
    - name: "Bite"
      cost: 2
      description: "Strahd makes one bite attack"

# AI Behavior (LLM-DM guidance)
aiBehavior:
  combatTactics: "Strahd employs 5-phase tactical approach: observe, test, psychological warfare, engage, retreat. Uses legendary actions to reposition and control battlefield."
  goals:
    - "Possess Ireena (Tatyana reincarnation)"
    - "Break the party's will through psychological torment"
    - "Eliminate threats to his rule over Barovia"
  motivations:
    - "Obsessive love for Tatyana"
    - "Boredom and desire for worthy challengers"
    - "Maintain absolute control over Barovia"

# Personality & Dialogue
personality:
  traits:
    - "Aristocratic and cultured"
    - "Craves Tatyana's love but cannot understand why she rejects him"
  ideals: ["Power", "Control", "Tragic Romance"]
  bonds: ["Tatyana/Ireena", "Castle Ravenloft", "Barovia realm"]
  flaws: ["Obsessive", "Arrogant", "Cannot comprehend genuine love"]

dialogue:
  greeting:
    - "Welcome to my domain. I have been expecting you."
    - "You are a long way from home, little ones. But fear not - you are my guests."
  combat:
    - "Impressive. But futile."
    - "I have walked this land for centuries. What hope do you have?"
  retreat:
    - "We shall meet again. I promise you that."

# Schedule (Epic 2 CalendarManager integration)
schedule:
  - time: "20:00"
    location: "castle_ravenloft_throne_room"
    activity: "Hold court, receive Rahadin's reports"
  - time: "midnight"
    location: "various"
    activity: "Patrol Barovia, hunt for Ireena, torment enemies"
  - time: "04:00"
    location: "castle_ravenloft_crypt"
    activity: "Rest in coffin (regenerate)"
```

**Monster Stat Block Schema** (from `templates/monster/monster-statblock-template.yaml`):
```yaml
monsterId: "zombie"
name: "Zombie"
type: "undead"
challengeRating: 0.25
experiencePoints: 50

# Epic 3 CombatManager format
abilities:
  strength: 13
  dexterity: 6
  constitution: 16
  intelligence: 3
  wisdom: 6
  charisma: 5

hitPoints:
  max: 22
  hitDice:
    count: 3
    type: "d8"
    modifier: 9

armorClass: 8
speed: 20

# Combat Stats (Epic 3 CombatManager interface)
combatStats:
  id: "zombie_1"
  dexModifier: -2
  type: "monster"

actions:
  - name: "Slam"
    type: "melee_weapon_attack"
    attackBonus: 3
    reach: 5
    damage: "1d6+1"
    damageType: "bludgeoning"

specialTraits:
  - name: "Undead Fortitude"
    description: "If damage reduces zombie to 0 HP, DC 5+damage Con save. On success, drops to 1 HP instead (unless radiant or crit)."
```

**Magic Item Schema** (from `templates/items/magic-item-template.yaml`):
```yaml
id: "sunsword"
name: "Sunsword"
type: "magic_item"
rarity: "legendary"
requiresAttunement: true

# Weapon Properties (Epic 3 EquipmentManager format)
weaponProperties:
  baseWeapon: "longsword"
  category: "martial_melee"
  damage: "1d8"
  damageType: "radiant"
  properties: ["versatile", "finesse"]
  versatileDamage: "1d10"

# Magic Effects (Epic 3 ItemDatabase format)
effects:
  - type: "attack_bonus"
    value: 2
  - type: "damage_bonus"
    value: 2
    damageType: "radiant"
  - type: "extra_damage_vs_type"
    targetType: "undead"
    dice: "1d8"
    damageType: "radiant"

specialAbilities:
  - name: "Sunlight Blade"
    description: "Emits bright light 15ft, dim light 15ft. Light is sunlight."
    activation: "bonus_action"
  - name: "Anti-Vampire Weapon"
    description: "Deals maximum damage (not rolled) against vampires and vampire spawn."
    mechanics:
      type: "max_damage"
      targetType: ["vampire", "vampire_spawn"]
```

**Quest Schema** (from `templates/quest/quest-template.yaml`):
```yaml
questId: "escort_ireena_to_vallaki"
name: "Escort Ireena to Vallaki"
type: "main"
category: "story"

status: "not_started"  # not_started → available → active → completed/failed

# Quest Objectives
objectives:
  - objectiveId: "travel_to_vallaki"
    description: "Safely escort Ireena along the road from Barovia to Vallaki"
    type: "escort"
    target:
      type: "npc"
      id: "ireena_kolyana"
      destination: "vallaki"
    completionTrigger:
      type: "npc_reaches_location"
      npcId: "ireena_kolyana"
      locationId: "vallaki"

# Time Constraints (Epic 2 EventScheduler integration)
timeConstraints:
  hasDeadline: true
  deadline:
    date: "735-10-10"
    time: "23:59"
  failOnMissedDeadline: false
  warningThreshold: 2  # days

# Consequences (Epic 1 StateManager + Epic 2 EventScheduler)
consequences:
  onCompletion:
    stateChanges:
      - type: "npc_status"
        npcId: "ireena_kolyana"
        status: "safe_in_vallaki"
    triggeredEvents:
      - eventId: "strahd_learns_ireenas_location"
        delay: "1d3"
    unlockedQuests:
      - "st_andrals_feast"

rewards:
  experience: 500
  reputation:
    - faction: "vallaki"
      change: +5
```

**Data Validation:**

All Epic 4 content validates against these schemas:
- Location folders: `npm run validate-location {location-path}`
- NPC profiles: Schema validation against npc-profile-template.yaml
- Monster stat blocks: Schema validation against monster-statblock-template.yaml
- Items: Schema validation against magic-item-template.yaml
- Quests: Schema validation against quest-template.yaml

### APIs and Interfaces

Epic 4 content consumes existing APIs from Epics 1-3. **No new APIs created.**

**Epic 1 LocationLoader API** (Location Content Interface):
```javascript
// Consumed by all Epic 4 location folders
interface LocationData {
  locationId: string;
  locationName: string;
  description: string;
  descriptionVariants: {
    initial?: string;
    return?: string;
    morning?: string;
    night?: string;
  };
  npcs: NPCData[];
  items: ItemData[];
  events: EventData[];
  state: LocationState;
  metadata: LocationMetadata;
}

// Epic 4 locations provide data via:
// - game-data/locations/{location-id}/Description.md
// - game-data/locations/{location-id}/NPCs.md
// - game-data/locations/{location-id}/Items.md
// - game-data/locations/{location-id}/Events.md
// - game-data/locations/{location-id}/State.md
// - game-data/locations/{location-id}/metadata.yaml
```

**Epic 3 CharacterManager API** (NPC Profile Interface):
```javascript
// Consumed by Epic 4 NPC profiles
interface CharacterSheet {
  characterId: string;
  name: string;
  level: number;
  class: string;
  race: string;
  abilities: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  hitPoints: {
    max: number;
    current: number;
    temporary: number;
    hitDice: { count: number; type: string; modifier: number; };
  };
  armorClass: number;
  proficiencyBonus: number;
  // ... (full schema in templates/npc/npc-profile-template.yaml)
}

// Epic 4 NPCs provide data via:
// - game-data/npcs/{npc-id}.yaml
// - Referenced from location NPCs.md files
```

**Epic 3 CombatManager API** (Monster Stat Block Interface):
```javascript
// Consumed by Epic 4 monster stat blocks
interface CombatantStats {
  id: string;
  name: string;
  type: 'player' | 'monster' | 'npc';
  maxHP: number;
  currentHP: number;
  armorClass: number;
  initiative: number;
  dexModifier: number;
  conditions: string[];
  actions: Action[];
  legendaryActions?: LegendaryAction[];
  lairActions?: LairAction[];
}

// Epic 4 monsters provide data via:
// - game-data/monsters/{monster-id}.yaml
```

**Epic 3 ItemDatabase API** (Magic Item Interface):
```javascript
// Consumed by Epic 4 magic items
interface ItemDefinition {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'magic_item' | 'consumable';
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'artifact';
  requiresAttunement: boolean;
  effects: ItemEffect[];
  specialAbilities: SpecialAbility[];
  charges?: { max: number; current: number; recharge: string; };
}

// Epic 4 items provide data via:
// - game-data/items/{item-id}.yaml
```

**Epic 2 EventScheduler API** (Quest Time Trigger Interface):
```javascript
// Consumed by Epic 4 quest definitions
interface ScheduledEvent {
  eventId: string;
  eventType: 'date_time' | 'conditional' | 'location_enter' | 'recurring';
  trigger: {
    type: string;
    date?: string;  // "735-10-10"
    time?: string;  // "18:00"
    condition?: string;
    locationId?: string;
  };
  effect: {
    type: 'state_update' | 'npc_status' | 'quest_trigger' | 'notification';
    // ... effect-specific fields
  };
}

// Epic 4 quests register events via:
// - game-data/quests/{quest-id}.yaml (timeConstraints, consequences.triggeredEvents)
// - location Events.md files
```

**File System Contract:**

All Epic 4 content follows strict file system conventions:

```
game-data/
├── locations/
│   ├── village-of-barovia/
│   │   ├── Description.md
│   │   ├── NPCs.md
│   │   ├── Items.md
│   │   ├── Events.md
│   │   ├── State.md
│   │   └── metadata.yaml
│   ├── castle-ravenloft/
│   │   ├── Description.md
│   │   ├── ... (6 required files)
│   │   └── rooms/
│   │       ├── entrance-hall/ (nested sub-locations)
│   │       └── throne-room/
│   └── ... (32 more locations)
│
├── npcs/
│   ├── strahd_von_zarovich.yaml
│   ├── ireena_kolyana.yaml
│   └── ... (50 more NPCs)
│
├── monsters/
│   ├── zombie.yaml
│   ├── vampire_spawn.yaml
│   └── ... (23 more monsters)
│
├── items/
│   ├── sunsword.yaml
│   ├── holy_symbol_of_ravenkind.yaml
│   └── ... (12 more items)
│
└── quests/
    ├── escort_ireena_to_vallaki.yaml
    ├── st_andrals_feast.yaml
    └── ... (28 more quests)
```

**No Breaking Changes:**

Epic 4 introduces **zero breaking changes** to any Epic 1-3 API. All content is additive and conforms to existing interfaces.

### Workflows and Sequencing

**Epic 4 Story Implementation Workflow:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Story Creation Workflow (BMM create-story workflow)             │
├─────────────────────────────────────────────────────────────────┤
│  1. SM drafts story from Epic 4 tech-spec                       │
│  2. SM generates story context XML (relevant Epic 1-3 code +    │
│     templates + existing Epic 4 content)                          │
│  3. Dev implements content using templates                       │
│  4. Dev validates content against schemas                        │
│  5. Dev updates sprint-status.yaml (review → done)              │
│  6. SM performs code review                                      │
└─────────────────────────────────────────────────────────────────┘
```

**Content Creation Sequence (per Story):**

**Phase 1: Location Implementation** (Stories 4-1 to 4-6)

```
1. Create Location Folder
   ├─ mkdir game-data/locations/{location-id}
   ├─ Create Description.md (copy from Curse of Strahd book, adapt for game)
   ├─ Create NPCs.md (list all NPCs present at location)
   ├─ Create Items.md (list available items, loot, treasure)
   ├─ Create Events.md (scheduled events, triggers)
   ├─ Create State.md (initial state YAML frontmatter + narrative)
   └─ Create metadata.yaml (connections, level range, tags)

2. Validate Location Structure
   └─ npm run validate-location game-data/locations/{location-id}

3. Integration Test
   ├─ Start session: /start-session
   ├─ Travel to location: /travel {location-id}
   ├─ Verify LocationLoader successfully loads all files
   ├─ Verify Description.md renders correctly
   ├─ Verify NPCs.md parsed and displayed
   └─ Verify /look command works
```

**Phase 2: NPC Implementation** (Stories 4-7 to 4-10)

```
1. Create NPC Profile
   ├─ Copy templates/npc/npc-profile-template.yaml
   ├─ Fill in D&D 5e stats from Curse of Strahd book
   ├─ Add personality traits, dialogue, motivations
   ├─ Document AI behavior notes for LLM-DM
   ├─ Add schedule (Epic 2 CalendarManager integration)
   └─ Save to game-data/npcs/{npc-id}.yaml

2. Link NPC to Locations
   ├─ Add NPC entry to relevant location NPCs.md files
   └─ Reference npc-id for profile lookup

3. Integration Test
   ├─ Verify CharacterManager can load NPC profile
   ├─ Test ability checks with NPC stats
   ├─ Test combat encounter (if hostile NPC)
   └─ Verify dialogue system references NPC data
```

**Phase 3: Quest Implementation** (Stories 4-11 to 4-13)

```
1. Create Quest Definition
   ├─ Copy templates/quest/quest-template.yaml
   ├─ Define objectives with completion triggers
   ├─ Set time constraints (deadlines, warnings)
   ├─ Document consequences (state changes, triggered events)
   ├─ Add branching choices if applicable
   └─ Save to game-data/quests/{quest-id}.yaml

2. Register Quest Events
   ├─ Add quest-start event to location Events.md
   ├─ Register time-based triggers with EventScheduler
   └─ Link quest to NPC quest-giving dialogue

3. Integration Test
   ├─ Verify quest becomes available when prerequisites met
   ├─ Test objective completion triggers
   ├─ Test deadline warnings (Epic 2 EventScheduler)
   └─ Verify quest consequences apply correctly
```

**Runtime Content Loading Sequence:**

```
Player Action: /travel village-of-barovia

1. NavigationHandler validates travel
   └─ Check location exists, is connected, no blockers

2. LocationLoader loads location data
   ├─ Read Description.md → location.description
   ├─ Parse NPCs.md → location.npcs[]
   ├─ Parse Items.md → location.items[]
   ├─ Parse Events.md → location.events[]
   ├─ Read State.md (YAML frontmatter + narrative) → location.state
   └─ Parse metadata.yaml → location.metadata

3. StateManager updates current location state
   ├─ Mark location as visited
   ├─ Update last_visit_date
   └─ Persist to State.md

4. EventScheduler checks for triggered events
   ├─ location_enter triggers fire
   ├─ Scheduled events at current time fire
   └─ EventExecutor applies event effects

5. ContextBuilder assembles LLM prompt
   ├─ Priority 1: Description.md, State.md, character sheet
   ├─ Priority 2: NPCs.md (active NPCs only)
   ├─ Priority 3: Items.md (if space), Events.md
   └─ Keep total context < 3000 tokens

6. LLMNarrator generates response
   ├─ Load system prompt (DM persona)
   ├─ Inject location context
   ├─ Reference NPC profiles for dialogue
   ├─ Use AI behavior notes for NPC tactics
   └─ Generate narrative response

7. Display to player
   └─ Render markdown response in VS Code preview
```

**Content Dependency Graph:**

```
Locations (Stories 4-1 to 4-6)
    ↓ (locations reference NPCs)
NPCs (Stories 4-7 to 4-10)
    ↓ (NPCs give quests)
Quests (Stories 4-11 to 4-13)
    ↓ (quests reward items, trigger monster encounters)
Monsters + Items (Stories 4-14 to 4-15)
    ↓ (Strahd AI requires all above content)
Custom Systems (Stories 4-16 to 4-17)

Note: Stories 4-1 to 4-6 can be worked in parallel (independent locations)
      Stories 4-7 to 4-10 can be worked in parallel (independent NPCs)
      Story 4-1 (Village of Barovia) is critical path validation checkpoint
```

**Validation Workflow:**

```
After each content file creation:

1. Schema Validation
   ├─ YAML syntax check (js-yaml parser)
   ├─ Required fields present
   ├─ Field types match schema
   └─ References valid (location IDs, NPC IDs, etc.)

2. Integration Validation
   ├─ LocationLoader can parse location
   ├─ CharacterManager can parse NPC profile
   ├─ CombatManager can parse monster stat block
   ├─ ItemDatabase can parse item definition
   └─ EventScheduler can parse quest events

3. Content Validation
   ├─ Description.md < 2000 tokens (context limit)
   ├─ NPCs.md lists only NPCs with profiles
   ├─ Items.md lists only items in item database
   ├─ Events.md uses valid trigger types
   └─ All cross-references resolve (no broken links)

4. Acceptance Criteria Check
   └─ Story AC verification before marking "done"
```

## Non-Functional Requirements

### Performance

**Performance Targets (inherited from Epics 1-3, unchanged):**

| Metric | Target | Epic 4 Impact | Mitigation |
|--------|--------|---------------|------------|
| **Location Load Time** | < 1 second | Castle Ravenloft (60+ rooms) may exceed target | Use nested sub-locations, lazy load rooms |
| **Context Assembly** | < 500ms | Large NPCs.md files (10+ NPCs) may slow parsing | Filter to active NPCs only (Priority 2 loading) |
| **State Persistence** | < 100ms | Complex quest state updates may increase write time | Batch state updates in single write operation |
| **Session Startup** | < 3 seconds | Additional content increases initial scan time | Acceptable; one-time cost per session |
| **LLM Response Time** | 2-5 seconds | No change (Claude Code latency) | N/A - external dependency |

**Content-Specific Performance Considerations:**

1. **Castle Ravenloft Optimization**
   - **Challenge:** 60+ room mega-dungeon exceeds single-location context budget
   - **Solution:** Nested sub-location architecture
     ```
     game-data/locations/castle-ravenloft/
       ├── Description.md (castle overview, exterior)
       ├── metadata.yaml (lists all sub-locations)
       └── rooms/
           ├── entrance-hall/ (full location folder)
           ├── throne-room/ (full location folder)
           └── ... (58 more room folders)
     ```
   - **Benefit:** LocationLoader only loads current room, not entire castle
   - **Target:** Each room < 3000 tokens (same as any location)

2. **NPC Profile Caching**
   - **Challenge:** 52 NPC profiles, frequent lookups during gameplay
   - **Solution:** CharacterManager already caches loaded profiles (Epic 3)
   - **Epic 4 Action:** No changes needed

3. **Quest State Updates**
   - **Challenge:** Complex quests trigger multiple state changes across locations
   - **Solution:** EventExecutor batches state updates (Epic 2)
   - **Epic 4 Action:** Quest definitions use batch-friendly state change format

4. **Description.md Token Budget**
   - **Target:** Each Description.md < 2000 tokens
   - **Validation:** Content audit during each location story
   - **Fallback:** Split long descriptions into variants (initial/return/time-of-day)

**Performance Testing:**

Each Epic 4 story includes performance acceptance criteria:
- Location load time measured and documented
- Context assembly time < 500ms verified
- Large location stress test (Castle Ravenloft) validates nested approach
- No regressions from Epic 1-3 performance baselines

### Security

**Security Posture (inherited from Epics 1-3, unchanged):**

Epic 4 is a **content-only** epic with no code changes. All security considerations from Epics 1-3 remain in effect.

**Content Security Considerations:**

1. **No Executable Code in Content Files**
   - All Epic 4 content is YAML/Markdown data files
   - No JavaScript, shell commands, or executable content
   - LocationLoader, CharacterManager, and ItemDatabase parse data only (no eval, no code execution)

2. **Path Traversal Protection**
   - All location IDs sanitized by Epic 1 StateManager
   - NPC/item/quest IDs validated against whitelist patterns (alphanumeric + hyphens only)
   - No user-provided paths in Epic 4 content

3. **Injection Prevention**
   - YAML parsing uses js-yaml safe mode (Epic 1 pattern)
   - No SQL (file-based system)
   - No command injection risk (content is data, not commands)

4. **Content Validation**
   - All Epic 4 content validates against schemas before commit
   - Prevents malformed data from entering system
   - Git version control provides audit trail for all content changes

5. **LLM Prompt Injection Mitigation**
   - Epic 4 content may contain narrative text loaded into LLM prompts
   - Risk: Malicious instructions in Description.md or NPCs.md dialogue
   - **Mitigation:** All content hand-authored from official Curse of Strahd source (trusted)
   - **Additional Protection:** LLM system prompts (Epic 1) include instructions to ignore meta-instructions in content

**Epic 4 Security Review:**

Since Epic 4 introduces no new code paths, no security code review required. Content review focuses on:
- Data file format compliance
- No unexpected file types (only .md, .yaml)
- All content sourced from official D&D materials

### Reliability/Availability

**Reliability Targets (inherited from Epics 1-3):**

| Requirement | Target | Epic 4 Impact |
|-------------|--------|---------------|
| **Data Integrity** | 100% (no data loss) | Git version control protects all Epic 4 content |
| **Graceful Degradation** | Continue on missing content | LocationLoader handles missing optional files |
| **Error Recovery** | User-friendly error messages | Content validation prevents malformed data |
| **Save System Reliability** | Git commit success rate 99.9%+ | No changes to Git integration |

**Content-Specific Reliability:**

1. **Missing NPC Profile Handling**
   ```javascript
   // Epic 1 LocationLoader already handles this gracefully
   // If NPC profile not found:
   //   - Log warning
   //   - Display NPC name from NPCs.md
   //   - Disable detailed stat lookup (no combat stats shown)
   //   - LLM-DM can still roleplay NPC (uses dialogue from NPCs.md)
   ```

2. **Broken Quest References**
   - Quest definition references invalid location/NPC IDs
   - **Prevention:** Schema validation catches invalid references before commit
   - **Runtime:** EventScheduler logs warning, skips broken event trigger
   - **Recovery:** User can edit quest file, system re-validates on next session

3. **Corrupted Location Folder**
   - Missing required files (Description.md, metadata.yaml)
   - **Detection:** LocationLoader validation on load
   - **Response:** Display error message, prevent travel to location
   - **Recovery:** Git revert to last known good state

4. **State File Conflicts**
   - Rare: Manual edits during active session
   - **Prevention:** Documentation warns against manual edits during sessions
   - **Detection:** YAML parse error on State.md load
   - **Recovery:** Git diff shows conflict, user resolves or reverts

**Epic 4 Reliability Testing:**

Each story includes reliability acceptance criteria:
- Content validates successfully with all tools
- Missing optional content degrades gracefully
- Invalid references caught by schema validation
- Integration tests verify error handling

### Observability

**Observability Strategy (inherited from Epics 1-3):**

Epic 4 content consumes existing logging and debugging infrastructure. No new observability systems required.

**Content-Specific Logging:**

1. **Location Loading**
   ```javascript
   // Epic 1 LocationLoader already logs:
   LOG: Loading location: village-of-barovia
   LOG: ├─ Description.md loaded (1,234 tokens)
   LOG: ├─ NPCs.md parsed (3 NPCs found)
   LOG: ├─ Items.md parsed (5 items found)
   LOG: ├─ Events.md parsed (2 events registered)
   LOG: ├─ State.md loaded (visited: true)
   LOG: └─ metadata.yaml parsed (2 connections)
   LOG: Location load complete (832ms)
   ```

2. **NPC Profile Loading**
   ```javascript
   // Epic 3 CharacterManager logs:
   LOG: Loading NPC profile: strahd_von_zarovich
   LOG: ├─ Abilities parsed: STR 18, DEX 18, ...
   LOG: ├─ Hit Points: 144/144
   LOG: ├─ Legendary Actions: 3 per round
   LOG: └─ Profile load complete (45ms)
   ```

3. **Quest Event Triggers**
   ```javascript
   // Epic 2 EventScheduler logs:
   LOG: Event triggered: strahd_learns_ireenas_location
   LOG: ├─ Trigger type: date_time (735-10-12 00:00)
   LOG: ├─ Effect: npc_status change (strahd awareness: high)
   LOG: └─ State update applied to: village-of-barovia
   ```

4. **Content Validation**
   ```javascript
   // Schema validation logging:
   LOG: Validating location: castle-ravenloft
   LOG: ├─ Required files: ✓ (6/6 present)
   LOG: ├─ Description.md: ✓ (1,856 tokens, under 2000 limit)
   LOG: ├─ metadata.yaml: ✓ (valid YAML, 4 connections)
   LOG: └─ Validation: PASSED
   ```

**Debugging Epic 4 Content:**

1. **Content Issues:**
   - Run `npm run validate-location {path}` to check structure
   - Check `logs/session-{date}.md` for LocationLoader errors
   - Use `git diff` to see what changed in location files

2. **Quest Not Triggering:**
   - Check EventScheduler logs for event registration
   - Verify quest prerequisites met (check State.md files)
   - Confirm date/time trigger matches CalendarManager current time

3. **NPC Missing Stats:**
   - Verify NPC profile exists in `game-data/npcs/{npc-id}.yaml`
   - Check CharacterManager logs for profile load errors
   - Validate YAML syntax with `js-yaml` parser

4. **Performance Issues:**
   - Check Location load time in logs
   - Count tokens in Description.md (use tokenizer tool)
   - Verify context assembly time < 500ms target

**Metrics Tracked:**

All Epic 1-3 metrics continue to be tracked with Epic 4 content:
- Location load times (per location)
- Context assembly times
- State persistence times
- Session duration and locations visited
- Quest completion rates (player metrics)

## Dependencies and Integrations

**Epic 4 has ZERO code dependencies.** All dependencies are inherited from Epics 1-3 (already satisfied).

**Runtime Dependencies (from package.json):**

```json
{
  "dependencies": {
    "js-yaml": "^4.1.0",      // YAML parsing (Epic 1) - used for all Epic 4 .yaml files
    "date-fns": "^2.30.0"      // Date manipulation (Epic 2) - used for quest deadlines
  },
  "devDependencies": {
    "jest": "^29.7.0"          // Testing framework (Epic 1) - used for content validation tests
  }
}
```

**No new dependencies added in Epic 4.**

**Epic Integration Matrix:**

| Epic 4 Content Type | Depends On Epic | Integration Point | Data Format |
|---------------------|-----------------|-------------------|-------------|
| **Location Folders** | Epic 1 | LocationLoader | 6 files (Description.md, NPCs.md, Items.md, Events.md, State.md, metadata.yaml) |
| **Location State** | Epic 1 | StateManager | State.md with YAML frontmatter |
| **NPC Schedules** | Epic 2 | CalendarManager | schedule array in NPC profile |
| **Quest Deadlines** | Epic 2 | EventScheduler | timeConstraints in quest definition |
| **Scheduled Events** | Epic 2 | EventScheduler + EventExecutor | Events.md files, quest triggeredEvents |
| **NPC Combat Stats** | Epic 3 | CharacterManager + CombatManager | NPC profile abilities, HP, AC, actions |
| **Monster Stat Blocks** | Epic 3 | CombatManager | Monster YAML files |
| **Spell References** | Epic 3 | SpellcastingModule | NPC spells[], spellSlots{} |
| **Magic Items** | Epic 3 | ItemDatabase + EquipmentManager | Item YAML files |
| **Quest XP Rewards** | Epic 3 | LevelUpCalculator | rewards.experience in quest definition |
| **Quest Item Rewards** | Epic 3 | InventoryManager | rewards.items[] in quest definition |

**External Content Source:**

| Dependency | Type | Version | Purpose |
|------------|------|---------|---------|
| **Curse of Strahd Module** | D&D 5e Campaign Book | Official Print Edition | Source material for all Epic 4 content |
| **D&D 5e SRD** | Rules Reference | 5.1 | Monster stats, spell references, item properties |
| **Claude Code Extension** | LLM Provider | Latest | Narrative generation (no changes in Epic 4) |

**No External API Dependencies:**

Epic 4 content is entirely local:
- All locations stored in `game-data/locations/`
- All NPCs stored in `game-data/npcs/`
- All monsters stored in `game-data/monsters/`
- All items stored in `game-data/items/`
- All quests stored in `game-data/quests/`
- No network calls, no cloud services, no external APIs

**Template Dependencies:**

Epic 4 stories reference preparation templates (created in Epic 4 prep sprint):
- `templates/npc/npc-profile-template.yaml` - NPC authoring guide
- `templates/monster/monster-statblock-template.yaml` - Monster authoring guide
- `templates/items/magic-item-template.yaml` - Item authoring guide
- `templates/quest/quest-template.yaml` - Quest authoring guide
- `templates/location/` - Location folder structure (Epic 1)

**Integration Testing:**

Each Epic 4 story validates integration with dependent systems:

1. **Story 4-1 (Village of Barovia) - Integration Validation Checkpoint**
   - ✅ LocationLoader can load location folder
   - ✅ StateManager can persist location state
   - ✅ CalendarManager integrates with NPC schedules
   - ✅ EventScheduler registers location events
   - ✅ All Epic 1-3 systems work with Epic 4 content

2. **Story 4-7 (Strahd NPC) - Combat Integration Checkpoint**
   - ✅ CharacterManager loads NPC profile
   - ✅ CombatManager handles legendary actions
   - ✅ SpellcastingModule handles NPC spells
   - ✅ Legendary creature mechanics work correctly

3. **Story 4-11 (Main Quest System) - Quest Integration Checkpoint**
   - ✅ EventScheduler registers quest time triggers
   - ✅ EventExecutor applies quest state changes
   - ✅ Quest rewards integrate with InventoryManager and LevelUpCalculator
   - ✅ Quest branching works correctly

**Dependency Versioning:**

All Epic 1-3 code is locked at versions delivered in their respective retrospectives:
- Epic 1: Completed 2025-11-08 (commit hash in git log)
- Epic 2: Completed 2025-11-08 (commit hash in git log)
- Epic 3: Completed 2025-11-10 (commit hash in git log)

Epic 4 content references these stable APIs. No breaking changes expected or permitted during Epic 4 implementation.

## Acceptance Criteria (Authoritative)

**Epic 4 is considered complete when all 17 stories are done and all acceptance criteria below are met.**

### AC-1: Core Locations Implemented (Stories 4-1 to 4-6)

**Criteria:**
- ✅ 34 major locations created in `game-data/locations/` with valid folder structure
- ✅ Village of Barovia location complete with all 6 required files (Description, NPCs, Items, Events, State, metadata)
- ✅ Castle Ravenloft implemented as nested sub-location structure with 60+ rooms organized into sub-folders
- ✅ Town of Vallaki location complete with multiple sub-areas (church, burgomaster mansion, inn)
- ✅ Village of Krezk location complete with Abbey of St. Markovia sub-location
- ✅ All location folders pass `npm run validate-location` validation
- ✅ All Description.md files < 2000 tokens (measured and documented)
- ✅ All location metadata.yaml files specify valid connections to other locations
- ✅ All locations accessible via `/travel {location-id}` command in-game

**Validation:**
```bash
# All locations validate successfully
npm run validate-location game-data/locations/village-of-barovia
npm run validate-location game-data/locations/castle-ravenloft
npm run validate-location game-data/locations/vallaki
npm run validate-location game-data/locations/krezk
# ... (30 more locations)

# Integration test: Travel to each location successfully
/start-session
/travel village-of-barovia  # ✅ Loads successfully
/travel death-house         # ✅ Loads successfully
/travel tser-pool-encampment # ✅ Loads successfully
# ... (verify all 34 locations)
```

### AC-2: NPC Profiles Implemented (Stories 4-7 to 4-10)

**Criteria:**
- ✅ 52 named NPC profiles created in `game-data/npcs/` with complete YAML definitions
- ✅ Strahd von Zarovich NPC profile complete with CR 15 stats, legendary actions (3 per round), lair actions, vampire mechanics
- ✅ Ireena Kolyana NPC profile complete with personality, dialogue, quest involvement
- ✅ All NPC profiles conform to `templates/npc/npc-profile-template.yaml` schema
- ✅ All NPC profiles include: abilities, hitPoints, armorClass, actions, personality, dialogue, aiBehavior
- ✅ All NPC profiles validate against Epic 3 CharacterManager schema
- ✅ All NPCs referenced in location NPCs.md files have corresponding profile files
- ✅ NPC schedules integrate with Epic 2 CalendarManager (schedule array populated for major NPCs)

**Validation:**
```javascript
// CharacterManager can load all NPC profiles
const characterManager = new CharacterManager();
const strahd = characterManager.loadNPC('strahd_von_zarovich');
expect(strahd.legendaryActions.actionsPerRound).toBe(3);
expect(strahd.hitPoints.max).toBe(144);

const ireena = characterManager.loadNPC('ireena_kolyana');
expect(ireena.personality.traits).toContain('Brave');
expect(ireena.dialogue.greeting).toBeDefined();

// All 52 NPCs load without errors
const allNPCs = [/* 52 NPC IDs */];
allNPCs.forEach(npcId => {
  const npc = characterManager.loadNPC(npcId);
  expect(npc).toBeDefined();
  expect(npc.abilities.strength).toBeGreaterThan(0);
});
```

### AC-3: Monster Stat Blocks Implemented (Story 4-14)

**Criteria:**
- ✅ 25 unique monster types created in `game-data/monsters/` with complete stat blocks
- ✅ All monster stat blocks conform to `templates/monster/monster-statblock-template.yaml` schema
- ✅ All monster stat blocks validate against Epic 3 CombatManager schema
- ✅ All monster stat blocks include: abilities, hitPoints, armorClass, speed, actions, challengeRating, experiencePoints
- ✅ Special monster traits implemented (Undead Fortitude, Pack Tactics, Regeneration, etc.)
- ✅ Vampire spawn and Strahd zombies have correct undead mechanics
- ✅ All monsters can be spawned in combat encounters without errors

**Validation:**
```javascript
// CombatManager can load all monster stat blocks
const combatManager = new CombatManager();
const zombie = combatManager.loadMonster('zombie');
expect(zombie.challengeRating).toBe(0.25);
expect(zombie.specialTraits.find(t => t.name === 'Undead Fortitude')).toBeDefined();

const vampireSpawn = combatManager.loadMonster('vampire_spawn');
expect(vampireSpawn.challengeRating).toBe(5);
expect(vampireSpawn.actions.find(a => a.name === 'Bite')).toBeDefined();

// All 25 monsters load without errors
const allMonsters = [/* 25 monster IDs */];
allMonsters.forEach(monsterId => {
  const monster = combatManager.loadMonster(monsterId);
  expect(monster).toBeDefined();
  expect(monster.challengeRating).toBeGreaterThanOrEqual(0);
});
```

### AC-4: Magic Items and Artifacts Implemented (Story 4-15)

**Criteria:**
- ✅ 14 significant magic items created in `game-data/items/` with complete definitions
- ✅ Three legendary artifacts implemented: Sunsword, Holy Symbol of Ravenkind, Tome of Strahd
- ✅ All item definitions conform to `templates/items/magic-item-template.yaml` schema
- ✅ All item definitions validate against Epic 3 ItemDatabase + EquipmentManager schemas
- ✅ All magic items include: id, name, type, rarity, requiresAttunement, effects, specialAbilities
- ✅ Sunsword implements: radiant damage, sunlight emission, max damage vs vampires, attunement requirement
- ✅ Holy Symbol of Ravenkind implements: sentience, turn undead enhancement, paralysis ability, charges (10, recharge at dawn)
- ✅ Tome of Strahd implements: lore content, no mechanical benefits, key story item

**Validation:**
```javascript
// ItemDatabase can load all magic items
const itemDatabase = new ItemDatabase();
const sunsword = itemDatabase.loadItem('sunsword');
expect(sunsword.rarity).toBe('legendary');
expect(sunsword.requiresAttunement).toBe(true);
expect(sunsword.weaponProperties.damageType).toBe('radiant');
expect(sunsword.specialAbilities.find(a => a.name === 'Anti-Vampire Weapon')).toBeDefined();

const holySymbol = itemDatabase.loadItem('holy_symbol_of_ravenkind');
expect(holySymbol.sentience).toBeDefined();
expect(holySymbol.charges.max).toBe(10);

// All 14 items load without errors
const allItems = [/* 14 item IDs */];
allItems.forEach(itemId => {
  const item = itemDatabase.loadItem(itemId);
  expect(item).toBeDefined();
  expect(item.rarity).toBeDefined();
});
```

### AC-5: Quest System Implemented (Stories 4-11 to 4-13)

**Criteria:**
- ✅ 30 quests created in `game-data/quests/` (12 main quests + 18 side quests)
- ✅ All quest definitions conform to `templates/quest/quest-template.yaml` schema
- ✅ All quests include: questId, name, type, objectives, consequences, rewards
- ✅ Main quest chain implemented: Escape Death House → Bury Burgomaster → Escort Ireena → Find Artifacts → Destroy Strahd
- ✅ Major side quests implemented: St. Andral's Feast, Wizard of Wines Delivery, Werewolf Den Hunt
- ✅ Quest time constraints integrate with Epic 2 EventScheduler (deadlines, warnings)
- ✅ Quest consequences correctly trigger state changes via EventExecutor
- ✅ Quest branching choices implemented where applicable
- ✅ Quest rewards integrate with Epic 3 systems (XP, items, reputation)

**Validation:**
```javascript
// Quest system can load all quests
const questManager = new QuestManager();
const escortIreena = questManager.loadQuest('escort_ireena_to_vallaki');
expect(escortIreena.type).toBe('main');
expect(escortIreena.objectives.length).toBeGreaterThan(0);
expect(escortIreena.timeConstraints.hasDeadline).toBe(true);
expect(escortIreena.consequences.onCompletion.unlockedQuests).toContain('st_andrals_feast');

// Quest objectives have valid completion triggers
escortIreena.objectives.forEach(obj => {
  expect(obj.objectiveId).toBeDefined();
  expect(obj.completionTrigger.type).toBeDefined();
});

// All 30 quests load without errors
const allQuests = [/* 30 quest IDs */];
allQuests.forEach(questId => {
  const quest = questManager.loadQuest(questId);
  expect(quest).toBeDefined();
  expect(quest.objectives.length).toBeGreaterThan(0);
});
```

### AC-6: Tarokka Reading System Implemented (Story 4-16)

**Criteria:**
- ✅ Tarokka deck definition created (54 cards: 14 per suit × 4 suits - 2 jokers)
- ✅ Card reading system randomizes artifact locations (Sunsword, Holy Symbol, Tome)
- ✅ Card reading identifies ally (Van Richten, Ezmerelda, or other)
- ✅ Card reading reveals Strahd's location for final battle
- ✅ Tarokka reading integrates with Madam Eva NPC at Tser Pool location
- ✅ Reading results stored in game state (prevents re-rolls)
- ✅ Artifact locations update based on reading results

**Validation:**
```javascript
// Tarokka system generates valid reading
const tarokkaSystem = new TarokkaSystem();
const reading = tarokkaSystem.performReading();
expect(reading.sunsworldLocation).toBeDefined();
expect(reading.holySymbolLocation).toBeDefined();
expect(reading.tomeLocation).toBeDefined();
expect(reading.ally).toBeDefined();
expect(reading.strahdsLocation).toBeDefined();

// Reading results are deterministic (same seed = same result)
const reading2 = tarokkaSystem.performReading(reading.seed);
expect(reading2).toEqual(reading);
```

### AC-7: Strahd AI Behavior System Implemented (Story 4-17)

**Criteria:**
- ✅ Strahd AI behavior documented with 5-phase tactical approach: observation, testing, psychological warfare, engagement, retreat
- ✅ Legendary actions implementation guidelines provided for CombatManager
- ✅ Lair actions for Castle Ravenloft documented (initiative count 20)
- ✅ Vampire mechanics documented: charm (DC 17), children of the night, misty escape (0 HP → mist form), sunlight sensitivity, regeneration (20 HP/turn)
- ✅ Combat tactics documented: positioning, spell selection, legendary action usage, retreat conditions
- ✅ AI behavior notes integrated into Strahd NPC profile for LLM-DM reference
- ✅ Strahd encounter playtest validates AI behavior guidelines

**Validation:**
```javascript
// Strahd NPC has complete AI behavior documentation
const strahd = characterManager.loadNPC('strahd_von_zarovich');
expect(strahd.aiBehavior.combatTactics).toContain('5-phase');
expect(strahd.aiBehavior.goals).toContain('Possess Ireena');
expect(strahd.legendaryActions.actionsPerRound).toBe(3);
expect(strahd.specialAbilities.find(a => a.name === 'Misty Escape')).toBeDefined();

// Legendary actions defined
expect(strahd.legendaryActions.actions.length).toBeGreaterThan(0);
strahd.legendaryActions.actions.forEach(action => {
  expect(action.name).toBeDefined();
  expect(action.cost).toBeGreaterThan(0);
  expect(action.cost).toBeLessThanOrEqual(3);
});
```

### AC-8: Content Validation and Quality

**Criteria:**
- ✅ All 34 locations pass structure validation (`npm run validate-location`)
- ✅ All 52 NPC profiles pass schema validation
- ✅ All 25 monster stat blocks pass schema validation
- ✅ All 14 magic items pass schema validation
- ✅ All 30 quests pass schema validation
- ✅ No broken cross-references (all NPC IDs, location IDs, item IDs, quest IDs resolve)
- ✅ All Description.md files under 2000 token limit
- ✅ All YAML files have valid syntax (no parse errors)
- ✅ Content audit confirms all Curse of Strahd materials covered

**Validation:**
```bash
# Automated validation suite
npm run validate-all-locations
npm run validate-all-npcs
npm run validate-all-monsters
npm run validate-all-items
npm run validate-all-quests

# All validations pass with zero errors
```

### AC-9: Integration Testing

**Criteria:**
- ✅ Story 4-1 integration test: Village of Barovia loads and all Epic 1-3 systems work
- ✅ Story 4-7 integration test: Strahd NPC profile loads in combat, legendary actions work
- ✅ Story 4-11 integration test: Quest time triggers fire, state changes apply, rewards granted
- ✅ Full campaign playthrough: Start in Death House → Escort Ireena → Find artifacts → Confront Strahd (smoke test)
- ✅ Performance benchmarks: All location load times < 1 second, context assembly < 500ms
- ✅ No regressions from Epic 1-3 functionality

**Validation:**
```javascript
// Epic 1-3 regression test suite passes with Epic 4 content
npm test

// Epic 4 content integration tests pass
npm test -- tests/epic4-integration.test.js
```

### AC-10: Documentation and Metadata

**Criteria:**
- ✅ Epic 4 tech-spec complete and approved
- ✅ All 17 stories drafted, implemented, code-reviewed, and marked "done" in sprint-status.yaml
- ✅ Epic 4 retrospective completed
- ✅ Content audit verified against delivered content (all items accounted for)
- ✅ Template usage documented (NPC, monster, item, quest templates validated)

**Validation:**
```yaml
# sprint-status.yaml shows all Epic 4 stories "done"
epic-4: contexted
4-1-village-of-barovia-location: done
4-2-castle-ravenloft-structure: done
# ... (15 more stories)
4-17-strahd-ai-behavior: done
epic-4-retrospective: completed
```

## Traceability Mapping

**Maps Acceptance Criteria → Tech Spec Sections → Components → Test Strategy**

| AC | Requirement | Spec Section | Components/APIs | Story | Test Approach |
|----|-------------|--------------|-----------------|-------|---------------|
| **AC-1** | Core Locations Implemented (34 locations) | §4.1 Detailed Design - Services and Modules<br>§4.3 APIs and Interfaces - LocationLoader API<br>§4.4 Workflows - Phase 1 Location Implementation | Epic 1: LocationLoader<br>Epic 1: StateManager<br>File system: game-data/locations/ | Stories 4-1 to 4-6 | Integration test: Load each location via `/travel`<br>Validation: `npm run validate-location`<br>Token count: Verify Description.md < 2000 tokens |
| **AC-2** | NPC Profiles Implemented (52 NPCs) | §4.1 Detailed Design - Services and Modules<br>§4.2 Data Models - NPC Profile Schema<br>§4.4 Workflows - Phase 2 NPC Implementation | Epic 3: CharacterManager<br>Epic 3: CombatManager<br>File system: game-data/npcs/ | Stories 4-7 to 4-10 | Unit test: Load each NPC profile<br>Integration test: Strahd combat encounter<br>Schema validation: Against npc-profile-template.yaml |
| **AC-3** | Monster Stat Blocks Implemented (25 types) | §4.2 Data Models - Monster Stat Block Schema<br>§4.3 APIs - CombatManager API | Epic 3: CombatManager<br>File system: game-data/monsters/ | Story 4-14 | Unit test: Load each monster stat block<br>Combat test: Spawn monster in encounter<br>Schema validation: Against monster-statblock-template.yaml |
| **AC-4** | Magic Items and Artifacts Implemented (14 items) | §4.2 Data Models - Magic Item Schema<br>§4.3 APIs - ItemDatabase API | Epic 3: ItemDatabase<br>Epic 3: EquipmentManager<br>File system: game-data/items/ | Story 4-15 | Unit test: Load each item definition<br>Integration test: Equip Sunsword, test attunement<br>Schema validation: Against magic-item-template.yaml |
| **AC-5** | Quest System Implemented (30 quests) | §4.2 Data Models - Quest Schema<br>§4.3 APIs - EventScheduler API<br>§4.4 Workflows - Phase 3 Quest Implementation | Epic 2: EventScheduler<br>Epic 2: EventExecutor<br>Epic 3: LevelUpCalculator<br>Epic 3: InventoryManager<br>File system: game-data/quests/ | Stories 4-11 to 4-13 | Integration test: Trigger quest event<br>State change test: Verify consequences apply<br>Time trigger test: Deadline warnings fire<br>Schema validation: Against quest-template.yaml |
| **AC-6** | Tarokka Reading System Implemented | §2 Objectives and Scope - Custom Systems<br>§4.1 Services - Story 4-16 Custom Systems | New system: TarokkaSystem<br>Integration: Madam Eva NPC<br>Storage: game state | Story 4-16 | Unit test: Perform reading, verify valid results<br>Determinism test: Same seed = same reading<br>Integration test: Reading at Tser Pool location |
| **AC-7** | Strahd AI Behavior System Implemented | §2 Objectives and Scope - Custom Systems<br>§4.2 Data Models - NPC Profile (Strahd example)<br>Research: docs/strahd-mechanics-research.md | Epic 3: CombatManager (legendary actions)<br>Strahd NPC profile aiBehavior field | Story 4-17 | Playtest: Strahd encounter<br>Validation: Legendary actions work correctly<br>Documentation: AI behavior notes complete |
| **AC-8** | Content Validation and Quality | §5.1 Performance - Description.md Token Budget<br>§5.3 Reliability - Content Validation<br>§4.4 Workflows - Validation Workflow | All Epic 1-3 parsers<br>Validation scripts | All stories (4-1 to 4-17) | Automated: `npm run validate-all-*`<br>Token counting: Automated script<br>Cross-reference check: All IDs resolve |
| **AC-9** | Integration Testing | §6 Dependencies and Integrations - Integration Testing<br>§5.1 Performance - Performance Testing | All Epic 1-3 systems<br>Epic 4 content | Stories 4-1, 4-7, 4-11 (checkpoints)<br>All stories (smoke tests) | Story 4-1: Full Epic 1-3 integration test<br>Story 4-7: Legendary creature test<br>Story 4-11: Quest system test<br>Full playthrough: Death House → Strahd |
| **AC-10** | Documentation and Metadata | §1 Overview<br>§8 Risks and Test Strategy<br>All sections | N/A - Documentation deliverables | All stories (metadata)<br>Epic 4 retrospective | Review: Tech-spec complete<br>Audit: Content audit vs delivered content<br>Sprint status: All stories "done" |

**Story-to-AC Mapping:**

| Story | Title | Primary AC | Secondary AC | Validation Method |
|-------|-------|------------|--------------|-------------------|
| **4-1** | Village of Barovia Location | AC-1 | AC-8, AC-9 | validate-location, integration test (checkpoint) |
| **4-2** | Castle Ravenloft Structure | AC-1 | AC-8 | validate-location, nested sub-location test |
| **4-3** | Vallaki Location | AC-1 | AC-8 | validate-location |
| **4-4** | Krezk Location | AC-1 | AC-8 | validate-location |
| **4-5** | Major Locations Batch 1 | AC-1 | AC-8 | validate-location (batch) |
| **4-6** | Major Locations Batch 2 | AC-1 | AC-8 | validate-location (batch) |
| **4-7** | Strahd NPC Profile | AC-2 | AC-8, AC-9 | NPC profile load, combat test (checkpoint) |
| **4-8** | Ireena NPC Profile | AC-2 | AC-8 | NPC profile load, dialogue test |
| **4-9** | Major NPCs Batch 1 | AC-2 | AC-8 | NPC profile load (batch) |
| **4-10** | Major NPCs Batch 2 | AC-2 | AC-8 | NPC profile load (batch) |
| **4-11** | Main Quest System | AC-5 | AC-8, AC-9 | Quest load, event trigger test (checkpoint) |
| **4-12** | Artifact Quests | AC-5 | AC-8 | Quest load, branching test |
| **4-13** | Side Quests Batch 1 | AC-5 | AC-8 | Quest load (batch) |
| **4-14** | Monster Statblocks | AC-3 | AC-8 | Monster load, combat spawn test |
| **4-15** | Item Database | AC-4 | AC-8 | Item load, equip test, attunement test |
| **4-16** | Tarokka Reading System | AC-6 | AC-8 | Tarokka reading test, determinism test |
| **4-17** | Strahd AI Behavior | AC-7 | AC-8 | Strahd AI documentation, playtest |

**Component-to-AC Coverage:**

| Component (Epic) | Used By AC | Integration Point | Test Coverage |
|------------------|------------|-------------------|---------------|
| LocationLoader (Epic 1) | AC-1, AC-9 | All 34 locations | Load test for each location |
| StateManager (Epic 1) | AC-1, AC-5, AC-9 | Location state, quest state | State persistence tests |
| CalendarManager (Epic 2) | AC-2, AC-5 | NPC schedules, quest deadlines | Time-based trigger tests |
| EventScheduler (Epic 2) | AC-5, AC-9 | Quest events | Event registration and firing tests |
| EventExecutor (Epic 2) | AC-5 | Quest consequences | State change application tests |
| CharacterManager (Epic 3) | AC-2, AC-9 | NPC profiles | Profile load and stat tests |
| CombatManager (Epic 3) | AC-2, AC-3, AC-7, AC-9 | NPCs, monsters, Strahd | Combat encounter tests |
| ItemDatabase (Epic 3) | AC-4 | Magic items | Item definition load tests |
| EquipmentManager (Epic 3) | AC-4 | Artifact attunement | Equip and attunement tests |
| SpellcastingModule (Epic 3) | AC-2 | NPC spellcasters | Spell casting tests |
| LevelUpCalculator (Epic 3) | AC-5 | Quest XP rewards | XP application tests |
| InventoryManager (Epic 3) | AC-5 | Quest item rewards | Item reward tests |
| TarokkaSystem (New) | AC-6 | Artifact randomization | Reading generation tests |

**Test Strategy Summary:**

- **Unit Tests:** Each content type (location, NPC, monster, item, quest) has schema validation tests
- **Integration Tests:** Stories 4-1, 4-7, and 4-11 serve as integration checkpoints validating Epic 1-3 systems work with Epic 4 content
- **Validation Tests:** Automated scripts validate all content against schemas (`npm run validate-all-*`)
- **Smoke Tests:** Full campaign playthrough validates end-to-end functionality
- **Performance Tests:** Location load times and context assembly measured against targets
- **Regression Tests:** Epic 1-3 test suites run with Epic 4 content to ensure no breaking changes

## Risks, Assumptions, Open Questions

### Risks

| Risk ID | Risk Description | Severity | Likelihood | Mitigation Strategy | Owner |
|---------|------------------|----------|------------|---------------------|-------|
| **R-1** | **Content Volume Overwhelming** - 34 locations + 52 NPCs + 25 monsters + 14 items + 30 quests = massive authoring workload | High | High | Batch stories (4-5, 4-6, 4-9, 4-10, 4-13) group similar content. Use templates to accelerate authoring. Story 4-1 validates workflow before scaling. | Dev Team |
| **R-2** | **Castle Ravenloft Complexity** - 60+ rooms may be difficult to organize and navigate | Medium | Medium | Use nested sub-location architecture. Create castle map documentation. Test navigation early (Story 4-2). | Story 4-2 |
| **R-3** | **Strahd Mechanics Too Complex** - Legendary actions, lair actions, vampire mechanics, shapeshifting, charm, etc. may not integrate cleanly with Epic 3 CombatManager | High | Medium | Story 4-7 serves as validation checkpoint. If CombatManager insufficient, defer complex mechanics or extend system in mini-story. Research spike completed (docs/strahd-mechanics-research.md). | Story 4-7 |
| **R-4** | **Description.md Token Budget Exceeded** - Some locations (Castle Ravenloft, Vallaki) have rich descriptions that may exceed 2000 token limit | Medium | Medium | Split long descriptions into variants (initial/return/time-of-day). Use nested sub-locations for large areas. Monitor token count during authoring. | All location stories |
| **R-5** | **Quest Complexity Explosion** - 30 quests with branching, time constraints, and state changes may create difficult-to-maintain dependencies | Medium | Low | Use quest-template.yaml strictly. Document quest dependencies in content audit. Test quest system early (Story 4-11). Keep quest definitions atomic. | Stories 4-11 to 4-13 |
| **R-6** | **Tarokka System Implementation** - Card-based randomization system not prototyped; unclear if simple or complex | Low | Medium | Story 4-16 is isolated system. If complex, can be simplified (fixed reading instead of random) or deferred to Epic 5. Not critical path for playability. | Story 4-16 |
| **R-7** | **Content Quality Inconsistency** - Large content volume across 17 stories may result in inconsistent writing quality, tone, or detail level | Medium | High | Use templates strictly. Code review process includes content review. Establish style guide for descriptions, dialogue, AI notes. Story 4-1 sets quality bar. | SM (code review) |
| **R-8** | **Broken Cross-References** - With 34 locations, 52 NPCs, 30 quests, many IDs to reference; easy to create broken links | Medium | High | Automated validation scripts check all cross-references. Schema validation catches missing IDs before commit. Story acceptance criteria include reference validation. | All stories |
| **R-9** | **Performance Degradation** - Large content volume may slow LocationLoader, CharacterManager, or context assembly | Low | Low | Performance benchmarks in Story 4-1, 4-7, 4-11 checkpoints. Castle Ravenloft stress test (Story 4-2). Mitigation: caching (already implemented in Epic 3). | Checkpoint stories |
| **R-10** | **Scope Creep from Official Source** - Curse of Strahd book has many optional encounters, random tables, and variants; temptation to include everything | Medium | Medium | Follow content audit strictly (docs/epic-4-content-audit.md). Defer optional content to post-Epic 4 backlog. Focus on critical path: main locations, major NPCs, main quests. | SM + Dev |

### Assumptions

| Assumption ID | Assumption | Validation Method | Risk If Wrong |
|---------------|------------|-------------------|---------------|
| **A-1** | Epic 1-3 systems are stable and complete; no breaking changes needed during Epic 4 | Regression tests in Story 4-1, 4-7, 4-11 checkpoints | HIGH - Would require Epic 1-3 reopening, major delays |
| **A-2** | Templates created in Epic 4 prep sprint are sufficient for all content types | Story 4-1 (location), 4-7 (NPC), 4-14 (monster), 4-15 (item), 4-11 (quest) validate templates | MEDIUM - Would require template revisions, potential rework |
| **A-3** | Description.md files can fit within 2000 token limit with variants or sub-locations | Token counting during Story 4-1, 4-2, 4-3 | LOW - Mitigation available (split into variants) |
| **A-4** | Epic 3 CombatManager can handle legendary creature mechanics (Strahd) without code changes | Story 4-7 Strahd NPC integration test | HIGH - Would require Epic 3 reopening or workarounds |
| **A-5** | LLM-DM (Claude Code) can generate quality narrative from Epic 4 content without prompt engineering | Story 4-1 integration test, full playthrough smoke test | MEDIUM - Would require Epic 5 prompt optimization earlier than planned |
| **A-6** | 17 stories is achievable workload for Epic 4; not underestimated | Track velocity after Stories 4-1, 4-2, 4-3 | MEDIUM - May need to batch more aggressively or defer optional content |
| **A-7** | Curse of Strahd content from official book is legally usable (personal use, no distribution) | Legal review (personal project, no commercial use) | LOW - Project is personal, non-commercial |
| **A-8** | Single developer (Kapi) can maintain content quality and consistency across large volume | Quality review in retrospectives, code review process | MEDIUM - May need stricter templates or automated quality checks |
| **A-9** | Git-based save system works well with large content volume (no performance issues) | Monitor Git repository size, commit/checkout performance | LOW - Git handles large text repositories well |
| **A-10** | Player (Kapi) will find Epic 4 content engaging and playable (goal validation) | Playtest after Story 4-6, full playthrough after Story 4-17 | LOW - Content from official popular module, known quality |

### Open Questions

| Question ID | Question | Priority | Needs Answer By | Resolution Strategy |
|-------------|----------|----------|-----------------|---------------------|
| **Q-1** | Should Castle Ravenloft be 1 mega-location or 60+ individual location folders? | HIGH | Story 4-2 start | **Answer:** Nested sub-locations (decided in tech-spec §4.4). Validate in Story 4-2. |
| **Q-2** | How detailed should NPC AI behavior notes be for LLM-DM? | MEDIUM | Story 4-7 start | Experiment in Story 4-7. Establish guideline based on what produces good LLM responses. Likely: 2-3 sentences per behavior category. |
| **Q-3** | Should Tarokka reading be truly random or use fixed seed for reproducibility? | LOW | Story 4-16 start | **Proposal:** Seeded random (deterministic given seed) stored in game state. Allows replayability with different readings. |
| **Q-4** | How many locations should be in each batch story (4-5, 4-6)? | MEDIUM | Story 4-4 completion | Evaluate velocity after Stories 4-1 to 4-4. Likely: 5-8 locations per batch story depending on complexity. |
| **Q-5** | Should all 30 quests be fully detailed or can some be "stub" quests for post-Epic 4 fleshing out? | MEDIUM | Story 4-11 start | **Proposal:** 12 main quests fully detailed. 8-10 major side quests fully detailed. 8-10 minor side quests as stubs (basic structure only). |
| **Q-6** | Do all 52 NPCs need full profiles or can minor NPCs have simplified profiles? | MEDIUM | Story 4-7 start | **Proposal:** Major NPCs (20-25) get full profiles. Minor NPCs (30) get simplified profiles (stats + basic personality, no detailed AI notes). |
| **Q-7** | Should Epic 4 include Death House dungeon or defer to later? | HIGH | Story 4-1 completion | **Answer:** Include Death House (Story 4-1 or early batch). It's intro adventure, small scope, good for testing workflow. |
| **Q-8** | How should lair actions for Castle Ravenloft be implemented? | LOW | Story 4-17 start | **Proposal:** Document lair actions in Strahd NPC profile. CombatManager triggers on initiative count 20. If CombatManager insufficient, document as AI notes for LLM-DM. |
| **Q-9** | Should quest branching be fully implemented or simplified? | MEDIUM | Story 4-11 start | **Proposal:** Implement branching for major decision points (3-5 quests). Simplify to linear paths for most quests. Complexity vs. effort trade-off. |
| **Q-10** | Should content validation be automated or manual review? | HIGH | Story 4-1 completion | **Answer:** Both. Automated schema validation (scripts). Manual content review in code review process. |

## Test Strategy Summary

**Epic 4 Test Strategy: Content Validation + Integration Testing**

Epic 4 is a content-only epic, so testing focuses on **content validation** (schema compliance, cross-references, token limits) and **integration testing** (Epic 1-3 systems consume Epic 4 content correctly).

### Test Levels

**1. Schema Validation Tests (Automated)**

Every content file validates against its template schema before commit.

```bash
# Location validation
npm run validate-location game-data/locations/village-of-barovia
# Output: ✅ All 6 required files present
#         ✅ metadata.yaml valid YAML
#         ✅ Description.md under 2000 tokens
#         ✅ All cross-references resolve

# NPC profile validation
npm run validate-npc game-data/npcs/strahd_von_zarovich.yaml
# Output: ✅ Required fields present (abilities, hitPoints, etc.)
#         ✅ Ability scores in valid range (1-30)
#         ✅ Hit points consistent with hit dice
#         ✅ Actions have valid format

# Monster stat block validation
npm run validate-monster game-data/monsters/zombie.yaml
# Output: ✅ Challenge rating valid (0-30)
#         ✅ Experience points match CR
#         ✅ Combat stats complete

# Magic item validation
npm run validate-item game-data/items/sunsword.yaml
# Output: ✅ Rarity is valid D&D tier
#         ✅ Effects have valid types
#         ✅ Weapon properties valid

# Quest validation
npm run validate-quest game-data/quests/escort_ireena_to_vallaki.yaml
# Output: ✅ All objectives have completion triggers
#         ✅ All location/NPC/item IDs resolve
#         ✅ Time constraints valid dates
#         ✅ Consequences reference valid events
```

**Coverage:** 100% of Epic 4 content files

**When:** After each file creation, before git commit

**2. Integration Tests (Automated + Manual)**

Validate Epic 1-3 systems can load and use Epic 4 content.

```javascript
// Story 4-1 Integration Checkpoint
describe('Epic 4 Integration - Story 4-1', () => {
  test('LocationLoader loads Village of Barovia', () => {
    const loader = new LocationLoader();
    const location = loader.loadLocation('village-of-barovia');
    expect(location.locationId).toBe('village-of-barovia');
    expect(location.npcs.length).toBeGreaterThan(0);
    expect(location.description).toBeDefined();
  });

  test('StateManager persists location state', async () => {
    const stateManager = new StateManager();
    await stateManager.updateState('village-of-barovia', {
      visited: true,
      discovered_items: ['silver_dagger']
    });
    const state = await stateManager.loadState('village-of-barovia');
    expect(state.visited).toBe(true);
  });

  test('CalendarManager registers location events', () => {
    const calendar = new CalendarManager();
    const scheduler = new EventScheduler(calendar);
    scheduler.loadLocationEvents('village-of-barovia');
    expect(scheduler.getEventCount()).toBeGreaterThan(0);
  });
});

// Story 4-7 Integration Checkpoint
describe('Epic 4 Integration - Story 4-7 (Strahd)', () => {
  test('CharacterManager loads Strahd NPC profile', () => {
    const charManager = new CharacterManager();
    const strahd = charManager.loadNPC('strahd_von_zarovich');
    expect(strahd.legendaryActions.actionsPerRound).toBe(3);
    expect(strahd.hitPoints.max).toBe(144);
  });

  test('CombatManager handles legendary actions', () => {
    const combat = new CombatManager();
    combat.addCombatant('strahd_von_zarovich', 'enemy');
    combat.startCombat();
    expect(combat.getLegendaryActionsRemaining('strahd_von_zarovich')).toBe(3);
  });

  test('SpellcastingModule handles Strahd spells', () => {
    const spellcasting = new SpellcastingModule();
    const strahd = new CharacterManager().loadNPC('strahd_von_zarovich');
    expect(spellcasting.canCastSpell(strahd, 'fireball')).toBe(true);
  });
});

// Story 4-11 Integration Checkpoint
describe('Epic 4 Integration - Story 4-11 (Quests)', () => {
  test('EventScheduler registers quest time triggers', () => {
    const scheduler = new EventScheduler();
    scheduler.loadQuest('escort_ireena_to_vallaki');
    const triggers = scheduler.getTriggers();
    expect(triggers.find(t => t.type === 'date_time')).toBeDefined();
  });

  test('EventExecutor applies quest consequences', async () => {
    const executor = new EventExecutor();
    const result = await executor.executeEvent({
      eventId: 'quest_escort_complete',
      effect: {
        type: 'npc_status',
        npcId: 'ireena_kolyana',
        status: 'safe_in_vallaki'
      }
    });
    expect(result.success).toBe(true);
  });

  test('Quest rewards integrate with systems', () => {
    const questManager = new QuestManager();
    const quest = questManager.loadQuest('escort_ireena_to_vallaki');
    expect(quest.rewards.experience).toBe(500);
    expect(quest.rewards.reputation).toBeDefined();
  });
});
```

**Coverage:** Critical integration points (Stories 4-1, 4-7, 4-11)

**When:** Story completion acceptance criteria

**3. Performance Tests (Automated)**

Measure performance against targets established in Epics 1-3.

```javascript
describe('Epic 4 Performance Tests', () => {
  test('Location load time < 1 second', async () => {
    const start = Date.now();
    const location = loader.loadLocation('village-of-barovia');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000);
  });

  test('Castle Ravenloft nested location load < 1 second', async () => {
    const start = Date.now();
    const room = loader.loadLocation('castle-ravenloft/rooms/throne-room');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000);
  });

  test('Context assembly time < 500ms', async () => {
    const start = Date.now();
    const context = contextBuilder.buildContext('village-of-barovia');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });

  test('Description.md token count < 2000', () => {
    const allLocations = getAllLocationIds();
    allLocations.forEach(locId => {
      const description = fs.readFileSync(`game-data/locations/${locId}/Description.md`, 'utf-8');
      const tokenCount = estimateTokens(description);
      expect(tokenCount).toBeLessThan(2000);
    });
  });
});
```

**Coverage:** All locations, focus on large/complex content

**When:** Story 4-1, 4-2 (Castle Ravenloft), ongoing monitoring

**4. Smoke Tests (Manual Playthrough)**

End-to-end campaign playthrough validates overall experience.

```
Smoke Test Script:

1. Start new game
   /start-session
   ✅ Session starts successfully

2. Death House (intro dungeon)
   /travel death-house
   ✅ Location loads, description renders
   ✅ NPCs present, combat encounters work
   ✅ Quest "Escape Death House" available

3. Village of Barovia
   /travel village-of-barovia
   ✅ Meet Ismark, Ireena
   ✅ Quest "Bury the Burgomaster" triggers
   ✅ Quest "Escort Ireena" offered

4. Tser Pool Encampment
   /travel tser-pool-encampment
   ✅ Meet Madam Eva
   ✅ Tarokka reading performs
   ✅ Artifact locations randomized

5. Vallaki
   /travel vallaki
   ✅ Complete Ireena escort quest
   ✅ Quest "St. Andral's Feast" unlocks
   ✅ Town explores, NPCs interact

6. Collect Artifacts
   ✅ Find Sunsword (location from Tarokka)
   ✅ Find Holy Symbol (location from Tarokka)
   ✅ Find Tome of Strahd (location from Tarokka)
   ✅ Artifacts equip correctly, attunement works

7. Castle Ravenloft
   /travel castle-ravenloft
   ✅ Navigate nested rooms
   ✅ Encounter vampire spawn
   ✅ Reach throne room

8. Final Confrontation
   ✅ Strahd encounter initiates
   ✅ Legendary actions work
   ✅ Lair actions trigger
   ✅ Combat mechanics function
   ✅ Quest "Destroy Strahd" completes

Total Duration: 3-5 hours
```

**Coverage:** Critical path through campaign

**When:** After Story 4-6 (partial), after Story 4-17 (full)

**5. Regression Tests (Automated)**

Ensure Epic 1-3 functionality not broken by Epic 4 content.

```bash
# Run existing Epic 1-3 test suites
npm test tests/epic1/
npm test tests/epic2/
npm test tests/epic3/

# All tests pass = no regressions
```

**Coverage:** All Epic 1-3 tests (unchanged)

**When:** After each Epic 4 story completion

### Test Coverage Targets

| Test Type | Target Coverage | Measurement |
|-----------|----------------|-------------|
| **Schema Validation** | 100% of content files | All files pass validation scripts |
| **Integration Tests** | 3 checkpoints (Stories 4-1, 4-7, 4-11) | All checkpoint tests pass |
| **Performance Tests** | All locations + token counts | All meet performance targets |
| **Smoke Tests** | Critical path (8 steps) | Full playthrough successful |
| **Regression Tests** | All Epic 1-3 tests | Zero test failures |

### Test Automation

```json
// package.json test scripts
{
  "scripts": {
    "validate-location": "node scripts/validate-location.js",
    "validate-all-locations": "node scripts/validate-all-locations.js",
    "validate-npc": "node scripts/validate-npc.js",
    "validate-all-npcs": "node scripts/validate-all-npcs.js",
    "validate-monster": "node scripts/validate-monster.js",
    "validate-all-monsters": "node scripts/validate-all-monsters.js",
    "validate-item": "node scripts/validate-item.js",
    "validate-all-items": "node scripts/validate-all-items.js",
    "validate-quest": "node scripts/validate-quest.js",
    "validate-all-quests": "node scripts/validate-all-quests.js",
    "test": "jest",
    "test:epic4": "jest tests/epic4-integration.test.js",
    "test:performance": "jest tests/performance.test.js"
  }
}
```

### Definition of Done (DoD) - Test Requirements

Each Epic 4 story is "done" when:

1. ✅ All content files created and committed
2. ✅ Schema validation passes (`npm run validate-*`)
3. ✅ Story-specific acceptance criteria met
4. ✅ Integration tests pass (if checkpoint story)
5. ✅ Code review completed (includes content review)
6. ✅ No regressions in Epic 1-3 tests
7. ✅ Performance benchmarks met (if applicable)
8. ✅ sprint-status.yaml updated: story marked "done"

**Epic 4 is complete when all 17 stories meet DoD + smoke test passes + retrospective completed.**
