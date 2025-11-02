# Kapi-s-RPG - Technical Architecture Document

**Project:** Kapi-s-RPG
**Author:** Architect Agent
**Date:** 2025-10-29
**Version:** 1.0
**Target Platform:** VS Code (Local File System)
**Technology Type:** LLM-Powered Text-Based RPG Platform

---

## 1. Executive Summary

This Technical Architecture Document defines the implementation design for Kapi-s-RPG, an LLM-powered D&D 5e solo RPG platform. The system uses a folder-based persistent world architecture where each game location exists as a structured directory containing markdown files for NPCs, items, events, and state. A dynamic game calendar system tracks in-world time and triggers scheduled events. Claude Code extension serves as the Dungeon Master, generating narrative responses by loading location context from files.

**Key Architectural Principles:**
- **File-First Design**: All game state persisted in human-readable markdown/YAML files
- **Git as Save System**: Version control provides undo, save states, and world snapshots
- **Context Injection**: LLM loads only relevant location data to maintain context efficiency
- **Separation of Concerns**: Game mechanics (rules engine) separate from narrative generation (LLM-DM)
- **Extensibility**: Modular design allows adding new campaigns/locations without core changes

---

## 2. System Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     VS Code Environment                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          User Interface Layer (VS Code)                 │ │
│  │  - Slash Commands (/start-session, /character, etc.)   │ │
│  │  - Markdown Preview for Narrative Display              │ │
│  │  - File Explorer for World Navigation                  │ │
│  └──────────────────┬─────────────────────────────────────┘ │
│                     │                                         │
│  ┌──────────────────▼─────────────────────────────────────┐ │
│  │        Game Engine Layer (Claude Commands)             │ │
│  │  - Session Manager                                     │ │
│  │  - Context Loader                                      │ │
│  │  - Calendar System                                     │ │
│  │  - Event Scheduler                                     │ │
│  │  - Rules Engine (D&D 5e)                               │ │
│  └──────┬────────────────────────────┬───────────────────┘ │
│         │                            │                       │
│  ┌──────▼───────────┐        ┌──────▼─────────────────────┐│
│  │  File System     │        │ Claude Code Ext (LLM-DM)   ││
│  │  (World Data)    │        │   - Narrative Generation   ││
│  │  - Locations/    │        │   - NPC Dialogue           ││
│  │  - Characters/   │        │   - Event Descriptions     ││
│  │  - Calendar.yaml │        │   - World Reactions        ││
│  └──────────────────┘        └────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Architecture Layers

**Layer 1: User Interface (VS Code)**
- Markdown files displayed in preview for narrative immersion
- File explorer for manual world navigation
- Slash commands for game actions
- Terminal for command-line interactions

**Layer 2: Game Engine (Claude Commands)**
- Session manager tracks current game state
- Context loader retrieves relevant location/NPC data
- Calendar system manages in-game time
- Event scheduler triggers time-based events
- Rules engine handles D&D 5e mechanics

**Layer 3: Data Storage (File System)**
- Location folders with structured markdown files
- Character sheets in YAML/Markdown format
- Calendar data in YAML
- Git repository for version control

**Layer 4: LLM Integration (Claude Code Extension)**
- System prompts define DM persona
- Context injection from location files via VS Code Extension API
- Dynamic narrative generation through Claude Code
- NPC dialogue and reactions
- No separate API key required (uses Claude Code's authentication)

---

## 3. Technology Stack

### 3.1 Core Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Platform** | VS Code | Latest | Development environment and game interface |
| **LLM Provider** | Claude Code Extension | Latest | Dungeon Master AI (narrative generation) |
| **Version Control** | Git | 2.x | Save system and world state management |
| **Data Format** | Markdown | CommonMark | Human-readable content files |
| **Configuration** | YAML | 1.2 | Structured data (calendar, NPCs, stats) |
| **Scripting** | JavaScript/Node.js | 18+ | Custom slash commands and automation |
| **Rules Engine** | Custom (D&D 5e) | 5e SRD | Character mechanics and combat |

### 3.2 Development Tools

- **VS Code Extensions**: Custom extension for game commands
- **MCP Servers**: Model Context Protocol for Claude integration
- **Testing**: Jest for rules engine unit tests
- **Documentation**: Markdown for all documentation
- **Linting**: ESLint for code quality

### 3.3 External Dependencies

**D&D 5e Reference Materials:**
- Player's Handbook (`.claude/RPG-engine/D&D 5e collection/0 Core books/`)
- Monster Manual
- Dungeon Master's Guide
- Curse of Strahd campaign materials (`.claude/RPG-engine/D&D 5e collection/4 Curse of Strahd/`)

**Claude Code Extension:**
- Claude Code extension required for LLM integration (no separate API key)
- Must be installed and authenticated in VS Code
- Available from VS Code marketplace

---

## 4. Folder-Based Location System

### 4.1 Location Architecture

Each game location is represented as a directory containing structured files:

```
locations/
├── village-of-barovia/
│   ├── Description.md          # Environmental descriptions
│   ├── NPCs.md                 # All NPCs in this location
│   ├── Items.md                # Available items and treasure
│   ├── Events.md               # Scheduled events and triggers
│   ├── State.md                # Current location state
│   └── metadata.yaml           # Location metadata
├── castle-ravenloft/
│   ├── Description.md
│   ├── NPCs.md
│   ├── ...
│   └── rooms/                  # Sub-locations for large areas
│       ├── entrance-hall/
│       ├── great-hall/
│       └── ...
└── vallaki/
    ├── Description.md
    ├── ...
    └── buildings/
        ├── blue-water-inn/
        ├── church-of-st-andral/
        └── ...
```

### 4.2 Location File Specifications

**Description.md:**
```markdown
# Village of Barovia

## Overview
A grim, fog-shrouded village clinging to survival in Strahd's shadow.

## Initial Description
[150-300 word immersive description for first visit]

## Return Description
[50-100 word description for subsequent visits]

## Time-Based Variants
### Morning
[Description variant for morning visits]

### Night
[Description variant for night visits]

## Points of Interest
- Old Svalich Road (leads west to Tser Pool)
- Blood of the Vine Tavern (center of village)
- Church (east side, dilapidated)
- Burgomaster's Mansion (north edge)
```

**NPCs.md:**
```yaml
# NPCs in Village of Barovia

## Ireena Kolyana
- **Type:** Human Noble
- **Age:** 26
- **Location:** Burgomaster's Mansion
- **Status:** Alive, Fearful
- **Relationship to Player:** Neutral (will become Ally)
- **Quest Connection:** Main Quest - Strahd's Obsession

### Description
[Physical description and personality]

### Dialogue
- **Initial Greeting:** "You're not from Barovia, are you? I can see it in your eyes - you still have hope."
- **Quest Hook:** "Please, my father is dying. He fears what will happen to me when he's gone."
- **If Rescued:** [Different dialogue tree]

### Stats
- **AC:** 14 (leather armor)
- **HP:** 22
- **Abilities:** STR 10, DEX 14, CON 12, INT 13, WIS 11, CHA 16

### AI Behavior Notes
- Protective of younger brother Ismark
- Haunted by nightmares of Strahd
- Seeks escape from Barovia but duty-bound to father
```

**Items.md:**
```yaml
# Items in Village of Barovia

## Available Items

### Blood of the Vine Tavern
- **Wine, Poor Quality:** 5 cp per tankard
- **Bread, Stale:** 2 cp per loaf
- **Room for the Night:** 5 sp

### Burgomaster's Mansion (After Quest)
- **Letter from Kolyan Indirovich:** Quest item
- **Silver Necklace:** 50 gp value, belongs to Ireena

## Hidden Items (Requires Investigation)
- **Holy Symbol of Ravenkind:** DC 20 Investigation in Church ruins
```

**Events.md:**
```yaml
# Events in Village of Barovia

## Scheduled Events

### Death of the Burgomaster
- **Trigger:** 3 days after player arrival OR player enters mansion
- **Type:** Story Event
- **Effect:** Updates Ireena's status to "Orphaned", unlocks escort quest

### Zombie Siege
- **Trigger:** Calendar date 2024-03-15, 23:00 (night of full moon)
- **Type:** Combat Event
- **Effect:** 2d6 zombies attack from Svalich Wood
- **Consequence:** If not defended, 1d4 villagers die

## Conditional Events

### Strahd's Visit
- **Trigger:** Player escorts Ireena out of village
- **Type:** Story Event
- **Effect:** Strahd appears on horseback, delivers warning

## Recurring Events
- **Daily Gloom:** Every morning, fog thickens (atmosphere)
```

**State.md:**
```yaml
# Village of Barovia - Current State

## Last Updated
2024-03-10 14:30

## Current Date (In-Game)
2024-03-10

## Current Time
Afternoon (14:30)

## Weather
Heavy fog, light rain, temperature 45°F

## Location Status
- **Burgomaster:** Dying (bedridden)
- **Tavern:** Open, 3 villagers inside
- **Church:** Abandoned, Father Donavich inside (mad with grief)

## Changes Since Last Visit
- Burgomaster's health declined further
- Fresh grave in cemetery (Doru's grave)
- Zombie attack damaged 2 houses on north edge

## NPC Positions
- **Ireena:** Burgomaster's Mansion (tending to father)
- **Ismark:** Blood of the Vine Tavern (recruiting help)
- **Mad Mary:** Weeping in her cottage

## Active Quests
- Find allies to help move Burgomaster's body
- Escort Ireena to safety
```

**metadata.yaml:**
```yaml
# Location Metadata

location_name: "Village of Barovia"
location_type: "Settlement"
region: "Barovia"
size: "Small Village"
population: 47
danger_level: 2
recommended_level: 1-3

connected_locations:
  - name: "Tser Pool Encampment"
    direction: "West"
    travel_time: "2 hours"
  - name: "Castle Ravenloft"
    direction: "North"
    travel_time: "4 hours"
  - name: "Svalich Wood"
    direction: "South"
    travel_time: "30 minutes"

fast_travel_available: true
discovered: true
first_visit_date: "2024-03-10"
```

---

## 5. Game Calendar System

### 5.1 Calendar Architecture

The game calendar tracks in-game time and triggers scheduled events. Calendar data stored in `calendar.yaml` at project root.

**calendar.yaml Structure:**
```yaml
# Kapi-s-RPG Game Calendar

## Current Time
current_date: "2024-03-10"
current_time: "14:30"
current_day_name: "Terraday"  # D&D calendar
current_month: "Ches"
current_year: 735  # Barovian Reckoning

## Time Advancement Settings
time_advancement_mode: "manual"  # manual, automatic, hybrid
time_per_action: 10  # minutes per standard action
rest_duration:
  short_rest: 60  # minutes
  long_rest: 480  # minutes (8 hours)

## Calendar Events
scheduled_events:
  - id: "evt_001"
    name: "Death of Burgomaster Kolyan"
    trigger_date: "2024-03-13"
    trigger_time: "06:00"
    location: "village-of-barovia"
    type: "story"
    status: "pending"

  - id: "evt_002"
    name: "Zombie Siege"
    trigger_date: "2024-03-15"
    trigger_time: "23:00"
    location: "village-of-barovia"
    type: "combat"
    status: "pending"

  - id: "evt_003"
    name: "Festival of the Blazing Sun"
    trigger_date: "2024-03-18"
    trigger_time: "12:00"
    location: "vallaki"
    type: "social"
    status: "pending"

## NPC Schedules
npc_schedules:
  ireena_kolyana:
    location: "village-of-barovia"
    routine:
      - time: "06:00-08:00"
        activity: "Morning prayers"
        location: "burgomaster-mansion/chapel"
      - time: "08:00-12:00"
        activity: "Tending to father"
        location: "burgomaster-mansion/bedroom"
      - time: "12:00-13:00"
        activity: "Lunch"
        location: "burgomaster-mansion/kitchen"
      - time: "13:00-18:00"
        activity: "Household duties"
        location: "burgomaster-mansion"
      - time: "18:00-22:00"
        activity: "Evening with father"
        location: "burgomaster-mansion/bedroom"
      - time: "22:00-06:00"
        activity: "Sleep (nightmares)"
        location: "burgomaster-mansion/ireena-room"

## Moon Phases (Affects werewolves, atmosphere)
moon_phases:
  current_phase: "waxing_gibbous"
  next_full_moon: "2024-03-15"
  next_new_moon: "2024-03-29"

## Seasonal Effects
current_season: "Early Spring"
effects:
  - "Cold nights, warmer days"
  - "Frequent fog and rain"
  - "Wolves more active"
```

### 5.2 Time Advancement Logic

**Manual Mode** (Default):
- Player explicitly advances time using commands
- `/advance-time 1 hour` or `/long-rest`
- System checks for triggered events after each advancement

**Automatic Mode**:
- Time advances based on player actions
- Travel: Calculate based on distance and terrain
- Combat: 6 seconds per round
- Social interactions: Estimate based on conversation length

**Hybrid Mode**:
- Automatic for travel and combat
- Manual for exploration and social scenes

### 5.3 Event Scheduling System

**Event Trigger Types:**
1. **Date/Time Triggers**: Fire at specific calendar date/time
2. **Conditional Triggers**: Fire when conditions met (quest completed, NPC status changed)
3. **Location Triggers**: Fire when player enters location
4. **Recurring Triggers**: Fire repeatedly (daily, weekly, monthly)

**Event Processing Flow:**
```
1. Player action advances time
2. System checks calendar.yaml for events between old_time and new_time
3. For each triggered event:
   a. Load event definition from Events.md in location folder
   b. Execute event effects (update State.md, spawn NPCs, etc.)
   c. Generate narrative description via LLM
   d. Mark event as "completed" or reschedule if recurring
4. Update calendar.yaml with new current time
5. Save changes (Git commit recommended for major events)
```

---

## 6. Context Loading & LLM Integration

### 6.1 Context Injection Strategy

**Challenge**: Claude API has context limits. Cannot load entire world at once.

**Solution**: Dynamic context loading based on current player location and active quests.

**Context Loading Priority:**
```
Priority 1 (Always Loaded):
- Current location Description.md
- Current location NPCs.md (active NPCs only)
- Current location State.md
- Player character sheet
- Active quest context

Priority 2 (Load if Space):
- Current location Items.md
- Current location Events.md (upcoming only)
- Connected locations (brief summaries)
- Important NPCs in other locations (if quest-relevant)

Priority 3 (Load on Demand):
- D&D 5e rules (specific sections as needed)
- Campaign lore and history
- Distant locations
```

### 6.2 System Prompt Structure

**Base System Prompt:**
```
You are the Dungeon Master for Kapi-s-RPG, running the Curse of Strahd campaign.

ROLE:
- Generate immersive narrative descriptions (150-300 words for new locations)
- Roleplay NPCs with distinct personalities and voices
- Adjudicate D&D 5e rules fairly but favor narrative flow
- Create atmospheric gothic horror ambiance
- Track consequences of player actions

TONE:
- Dark, gothic, melancholic
- Moments of hope amidst despair
- Descriptive and literary (not mechanical)
- Second-person perspective ("You see..." not "The player sees...")

CONSTRAINTS:
- Stay consistent with loaded location files
- Respect NPC personalities defined in NPCs.md
- Follow D&D 5e rules for mechanics
- Update State.md after significant changes
- Do not break the "fourth wall" or reference meta-game concepts
```

**Context Injection Format:**
```
CURRENT LOCATION:
{Description.md content}

NPCS PRESENT:
{NPCs.md content - filtered to NPCs at current location}

LOCATION STATE:
{State.md content}

PLAYER CHARACTER:
{character-sheet.yaml content}

ACTIVE QUESTS:
{relevant quest descriptions}

RECENT EVENTS:
{last 5 significant events from session log}
```

### 6.3 LLM Response Processing

**Player Input** → **Context Loader** → **LLM Request** → **Response Parser** → **State Updater** → **Display to Player**

**Response Parser Responsibilities:**
- Extract narrative text for display
- Identify state changes (NPC moved, item acquired, time advanced)
- Detect dice roll requirements
- Extract dialogue for session log
- Flag events that require State.md updates

---

## 7. VS Code Integration

### 7.1 Slash Commands

Custom VS Code extension provides game-specific commands:

**Session Management:**
- `/start-session` - Begin new game session, load character and world
- `/end-session` - Save current state, generate session log
- `/save-game [name]` - Create named Git commit as save point
- `/load-game [name]` - Restore from Git commit

**Character Management:**
- `/character` - View character sheet
- `/level-up` - Initiate level-up process
- `/inventory` - View inventory and equipment
- `/rest [short|long]` - Take rest, advance time, restore resources

**World Interaction:**
- `/travel [location]` - Fast travel to discovered location
- `/look` - Get detailed description of current location
- `/calendar` - View current date/time and upcoming events
- `/map` - Display discovered locations and connections

**Game Actions:**
- `/roll [check]` - Roll ability check, saving throw, or attack
- `/cast [spell]` - Cast a spell from character sheet
- `/talk [npc]` - Initiate conversation with NPC
- `/search` - Search current location for hidden items/secrets

**DM Tools:**
- `/spawn-event [event_id]` - Manually trigger event
- `/advance-time [duration]` - Advance calendar
- `/edit-location` - Open current location files for manual editing

### 7.2 File Watchers

VS Code extension monitors file changes:
- **Location files changed**: Reload context if in that location
- **Calendar.yaml changed**: Check for newly triggered events
- **Character sheet changed**: Validate changes, update UI
- **State.md changed**: Trigger narrative update if needed

---

## Phase 1 Complete

Phase 1 covers: Executive Summary, System Architecture, Technology Stack, Location System, Calendar System, Context Loading, and VS Code Integration.

**Phase 2 will cover:**
- Data structure specifications (character sheets, NPC profiles)
- D&D 5e rules engine implementation
- Git version control strategy

**Phase 3 will cover:**
- Implementation roadmap
- Development environment setup
- Testing strategy
- Deployment and future enhancements

---

## 8. Data Structure Specifications

### 8.1 Character Sheet Format

Player character data stored in `characters/[character-name].yaml`

**character-sheet.yaml:**
```yaml
# Player Character Sheet

## Basic Information
character_name: "Elara Nightshade"
player_name: "Kapi"
class: "Rogue"
subclass: "Arcane Trickster"
level: 5
race: "Half-Elf"
background: "Criminal"
alignment: "Chaotic Good"
experience_points: 6500

## Ability Scores
abilities:
  strength: 10
  dexterity: 18
  constitution: 14
  intelligence: 14
  wisdom: 12
  charisma: 13

ability_modifiers:
  strength: 0
  dexterity: 4
  constitution: 2
  intelligence: 2
  wisdom: 1
  charisma: 1

saving_throws:
  strength: 0
  dexterity: 7  # Proficient
  constitution: 2
  intelligence: 5  # Proficient
  wisdom: 1
  charisma: 1

## Combat Stats
armor_class: 16
initiative: 4
speed: 30
hit_points:
  max: 38
  current: 38
  temporary: 0
hit_dice:
  total: "5d8"
  remaining: 5

death_saves:
  successes: 0
  failures: 0

## Proficiencies
proficiency_bonus: 3

skill_proficiencies:
  acrobatics: 7        # DEX + Proficiency
  animal_handling: 1   # WIS
  arcana: 2            # INT
  athletics: 0         # STR
  deception: 4         # CHA + Proficiency
  history: 2           # INT
  insight: 1           # WIS
  intimidation: 1      # CHA
  investigation: 5     # INT + Proficiency
  medicine: 1          # WIS
  nature: 2            # INT
  perception: 4        # WIS + Proficiency
  performance: 1       # CHA
  persuasion: 4        # CHA + Proficiency
  religion: 2          # INT
  sleight_of_hand: 7   # DEX + Proficiency (Expertise)
  stealth: 10          # DEX + Proficiency (Expertise)
  survival: 1          # WIS

weapon_proficiencies:
  - "Simple weapons"
  - "Hand crossbows"
  - "Longswords"
  - "Rapiers"
  - "Shortswords"

armor_proficiencies:
  - "Light armor"

tool_proficiencies:
  - "Thieves' tools"
  - "Disguise kit"
  - "Poisoner's kit"

languages:
  - "Common"
  - "Elvish"
  - "Thieves' Cant"
  - "Abyssal"

## Features and Traits
racial_traits:
  - name: "Darkvision"
    description: "60 feet darkvision"
  - name: "Fey Ancestry"
    description: "Advantage on saves against being charmed, magic can't put you to sleep"
  - name: "Skill Versatility"
    description: "Proficiency in two additional skills (Perception, Persuasion)"

class_features:
  - name: "Expertise"
    description: "Double proficiency bonus for Sleight of Hand and Stealth"
  - name: "Sneak Attack"
    description: "3d6 extra damage once per turn when you have advantage"
  - name: "Thieves' Cant"
    description: "Secret language and coded messages"
  - name: "Cunning Action"
    description: "Bonus action: Dash, Disengage, or Hide"
  - name: "Uncanny Dodge"
    description: "Reaction: Halve damage from an attack you can see"
  - name: "Evasion"
    description: "Take no damage on successful DEX save (half on failure)"
  - name: "Spellcasting (Arcane Trickster)"
    description: "Intelligence-based spellcasting"

background_feature:
  name: "Criminal Contact"
  description: "You have a reliable contact who acts as your liaison to a network of other criminals"

## Spellcasting (Arcane Trickster)
spellcasting_ability: "Intelligence"
spell_save_dc: 13
spell_attack_bonus: 5

cantrips_known:
  - "Mage Hand" # Invisible via Arcane Trickster
  - "Minor Illusion"
  - "Prestidigitation"

spells_known:
  level_1:
    - "Disguise Self"
    - "Charm Person"
    - "Silent Image"
    - "Tasha's Hideous Laughter"

spell_slots:
  level_1:
    max: 4
    remaining: 4
  level_2:
    max: 2
    remaining: 2

## Inventory
equipment:
  worn:
    - name: "Studded Leather Armor"
      ac_bonus: 12
      type: "armor"
    - name: "Cloak of Elvenkind"
      description: "Advantage on Stealth checks, DC 15 Perception to spot you"
      type: "wondrous"
      attunement: true

  weapons:
    - name: "Rapier +1"
      attack_bonus: 8  # DEX + Proficiency + 1
      damage: "1d8+5"  # DEX + 1
      damage_type: "piercing"
      properties: ["Finesse"]

    - name: "Shortbow"
      attack_bonus: 7
      damage: "1d6+4"
      damage_type: "piercing"
      properties: ["Ammunition (80/320)", "Two-handed"]
      ammunition: 20

    - name: "Dagger"
      attack_bonus: 7
      damage: "1d4+4"
      damage_type: "piercing"
      properties: ["Finesse", "Light", "Thrown (20/60)"]
      quantity: 2

  backpack:
    - "Thieves' tools"
    - "Bedroll"
    - "Tinderbox"
    - "Torches (5)"
    - "Rations (5 days)"
    - "Waterskin"
    - "Rope, hempen (50 feet)"
    - "Grappling hook"
    - "Crowbar"
    - "Disguise kit"

  pouch:
    - "Gold pieces: 127"
    - "Silver pieces: 43"
    - "Copper pieces: 18"

  quest_items:
    - name: "Mysterious Letter"
      description: "Found in Village of Barovia, mentions 'the tome'"
      location_found: "village-of-barovia"
      date_acquired: "2024-03-10"

## Current Status
current_location: "village-of-barovia"
conditions: []  # exhaustion, poisoned, etc.
inspiration: false

## Backstory Summary
backstory: |
  Elara grew up on the streets of Waterdeep, learning to survive through wit and
  stealth. She discovered a talent for magic while studying under a mysterious
  mentor who vanished without explanation. Now she seeks answers about her past
  while using her skills to help those who cannot help themselves.

personality_traits:
  - "I always have a plan for what to do when things go wrong"
  - "I am incredibly slow to trust. Those who seem the fairest often have the most to hide"

ideals:
  - "Freedom: Chains are meant to be broken, as are those who would forge them"

bonds:
  - "I'm trying to find my lost mentor who taught me magic"

flaws:
  - "When I see something valuable, I can't think about anything but how to steal it"

## Session Tracking
sessions_played: 3
last_session_date: "2025-10-29"
total_play_time_hours: 8
notable_achievements:
  - "Arrived in Barovia"
  - "Met Ireena Kolyana"
  - "Discovered the Burgomaster is dying"
```

### 8.2 NPC Profile Format

NPCs use simplified character sheets in location `NPCs.md` files:

**NPC Profile Template:**
```yaml
## [NPC Name]

### Core Information
- **Type:** [Race] [Class/Role]
- **Age:** [Age]
- **Gender:** [Gender]
- **Faction:** [Faction if applicable]
- **Current Location:** [location-id]
- **Status:** [Alive/Dead/Missing/etc.]
- **Attitude Toward Player:** [Hostile/Unfriendly/Neutral/Friendly/Helpful]
- **Quest Connection:** [None/Quest Name]

### Description
[2-3 paragraphs: physical appearance, mannerisms, personality, motivations]

### Dialogue Examples
- **Initial Greeting:** "[Quote]"
- **If Asked About [Topic]:** "[Response]"
- **If Threatened:** "[Response]"
- **If Befriended:** "[Response]"
- **Catchphrase:** "[Memorable phrase they repeat]"

### Game Statistics (If Combat Possible)
- **CR:** [Challenge Rating]
- **AC:** [Armor Class]
- **HP:** [Hit Points]
- **Speed:** [Speed]
- **Abilities:** STR X, DEX X, CON X, INT X, WIS X, CHA X
- **Special Abilities:** [List key abilities]
- **Attacks:** [Attack name +X, damage XdX+X type]

### AI Behavior Guidelines
[Instructions for LLM on how to roleplay this NPC]
- Personality traits to emphasize
- Topics they will/won't discuss
- How they react to player actions
- Hidden motivations or secrets

### Relationships
- **[Other NPC Name]:** [Relationship description]
- **Player Character:** [Relationship progression notes]

### Quest Information
[If NPC gives quests, detail quest hooks and progression]

### State Changes
[Track how NPC changes based on player actions or events]
- **Initial State:** [Description]
- **If Quest Completed:** [How NPC changes]
- **If NPC Dies:** [Consequences]
```

### 8.3 Quest Data Format

Quests tracked in `quests/active-quests.yaml` and `quests/completed-quests.yaml`:

**Quest Definition:**
```yaml
quest_id: "main_001"
quest_name: "Escape from Barovia"
quest_type: "Main Quest"
quest_giver: "Ireena Kolyana"
status: "active"  # active, completed, failed, abandoned

description: |
  Ireena Kolyana has asked for your help escorting her to safety. Her father,
  the Burgomaster, has died, and she fears Strahd will come for her. She wishes
  to seek sanctuary in Vallaki.

objectives:
  - id: "obj_001"
    description: "Help bury the Burgomaster"
    status: "completed"
    completion_date: "2024-03-11"

  - id: "obj_002"
    description: "Escort Ireena to Vallaki"
    status: "in_progress"

  - id: "obj_003"
    description: "Find sanctuary for Ireena"
    status: "not_started"

rewards:
  experience: 500
  items:
    - "Ireena's Silver Necklace (50 gp value)"
  story: "Ireena becomes a permanent ally"

acceptance_criteria:
  - "Ireena arrives safely in Vallaki"
  - "Sanctuary arranged (Church of St. Andral or Burgomaster's Mansion)"
  - "Strahd's pursuit survived"

locations_involved:
  - "village-of-barovia"
  - "tser-pool-encampment"
  - "vallaki"

npcs_involved:
  - "ireena_kolyana"
  - "ismark_kolyanovich"
  - "father_lucian" # Vallaki priest
  - "strahd_von_zarovich" # Antagonist

quest_stages:
  stage_1:
    name: "Gaining Trust"
    description: "Meet Ireena and agree to help"
    completed: true

  stage_2:
    name: "The Journey"
    description: "Travel to Vallaki via Tser Pool"
    completed: false

  stage_3:
    name: "Sanctuary"
    description: "Secure safe haven for Ireena"
    completed: false

failure_conditions:
  - "Ireena dies during escort"
  - "Ireena is captured by Strahd"
  - "Player abandons Ireena for 7+ days"

notes: |
  This quest introduces Strahd as the primary antagonist. Strahd will observe
  from a distance but not directly interfere (yet). Use this to build tension.

started_date: "2024-03-10"
```

### 8.4 World State Tracking

Global world state in `world-state.yaml`:

```yaml
# Kapi-s-RPG World State

## Campaign Information
campaign_name: "Curse of Strahd"
campaign_start_date: "2024-03-10"
current_date: "2024-03-13"
days_elapsed: 3

## Major Story Flags
story_flags:
  strahd_met: false
  ireena_rescued: false
  holy_symbol_found: false
  sunsword_located: false
  tome_of_strahd_found: false
  tarokka_reading_complete: true
  castle_ravenloft_entered: false
  strahd_defeated: false

## Artifact Locations (From Tarokka Reading)
artifacts:
  holy_symbol_of_ravenkind:
    location: "krezk" # Revealed by reading
    found: false

  sunsword:
    location: "argynvostholt"
    found: false

  tome_of_strahd:
    location: "castle-ravenloft/library"
    found: false

## Faction Reputation
factions:
  vistani:
    reputation: 0  # -100 to +100
    attitude: "neutral"

  keepers_of_the_feather:
    reputation: 15
    attitude: "friendly"

  order_of_the_silver_dragon:
    reputation: 0
    attitude: "unknown"

## World Changes
permanent_changes:
  - date: "2024-03-11"
    description: "Burgomaster Kolyan Indirovich died"
    location: "village-of-barovia"
    impact: "Ireena orphaned, village leadership uncertain"

  - date: "2024-03-12"
    description: "Zombie siege repelled at Village of Barovia"
    location: "village-of-barovia"
    impact: "2 villagers died, north gate damaged"

## NPC Vital Status
npc_deaths:
  - npc_id: "kolyan_indirovich"
    death_date: "2024-03-11"
    location: "village-of-barovia"
    cause: "Heart failure (Strahd's curse)"

## Locations Discovered
discovered_locations:
  - "village-of-barovia"
  - "death-house"
  - "tser-pool-encampment"
  - "old-svalich-road"

## Active Curses/Conditions
active_effects:
  - name: "Mists of Barovia"
    description: "Cannot leave Barovia, mists turn travelers around"
    global: true
    removable: false # Until Strahd defeated

## Weather Patterns
weather_system:
  current_weather: "Heavy fog, light rain"
  forecast:
    - date: "2024-03-14"
      weather: "Overcast, occasional sun breaks"
    - date: "2024-03-15"
      weather: "Full moon, clear skies (werewolf night)"
```

---

## 9. D&D 5e Rules Engine

### 9.1 Rules Engine Architecture

The rules engine handles D&D 5e mechanics separately from narrative generation:

```
Player Action → Rules Engine → Result → LLM Narrator → Output
```

**Rules Engine Responsibilities:**
- Dice rolling with modifiers
- Ability checks and saving throws
- Attack rolls and damage calculation
- Spell slot tracking and spell effects
- Hit point management
- Condition tracking
- Level-up calculations
- Inventory weight and encumbrance

**LLM Narrator Responsibilities:**
- Describe results narratively
- Roleplay NPC reactions
- Set scenes and atmosphere
- Handle dialogue and social interactions

### 9.2 Core Mechanics Implementation

**Dice Rolling Module (dice-roller.js):**
```javascript
class DiceRoller {
  /**
   * Roll dice with standard notation: 2d6+3, 1d20, etc.
   */
  roll(notation) {
    const match = notation.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) throw new Error(`Invalid dice notation: ${notation}`);

    const [, numDice, dieSize, modifier] = match;
    const rolls = [];
    let total = 0;

    for (let i = 0; i < parseInt(numDice); i++) {
      const roll = Math.floor(Math.random() * parseInt(dieSize)) + 1;
      rolls.push(roll);
      total += roll;
    }

    if (modifier) {
      total += parseInt(modifier);
    }

    return {
      notation,
      rolls,
      modifier: modifier ? parseInt(modifier) : 0,
      total,
      natural20: rolls.length === 1 && dieSize === '20' && rolls[0] === 20,
      natural1: rolls.length === 1 && dieSize === '20' && rolls[0] === 1
    };
  }

  /**
   * Roll with advantage (roll twice, take higher)
   */
  rollAdvantage(notation) {
    const roll1 = this.roll(notation);
    const roll2 = this.roll(notation);

    return {
      notation: `${notation} (Advantage)`,
      roll1: roll1.total,
      roll2: roll2.total,
      chosen: Math.max(roll1.total, roll2.total),
      discarded: Math.min(roll1.total, roll2.total),
      natural20: roll1.natural20 || roll2.natural20
    };
  }

  /**
   * Roll with disadvantage (roll twice, take lower)
   */
  rollDisadvantage(notation) {
    const roll1 = this.roll(notation);
    const roll2 = this.roll(notation);

    return {
      notation: `${notation} (Disadvantage)`,
      roll1: roll1.total,
      roll2: roll2.total,
      chosen: Math.min(roll1.total, roll2.total),
      discarded: Math.max(roll1.total, roll2.total),
      natural1: roll1.natural1 || roll2.natural1
    };
  }
}
```

**Ability Check Module (ability-checks.js):**
```javascript
class AbilityCheckHandler {
  /**
   * Perform ability check
   * @param {Object} character - Character data
   * @param {string} ability - 'strength', 'dexterity', etc.
   * @param {number} dc - Difficulty Class
   * @param {string} advantage - 'advantage', 'disadvantage', or 'normal'
   */
  makeAbilityCheck(character, ability, dc, advantage = 'normal') {
    const modifier = character.ability_modifiers[ability];
    const roller = new DiceRoller();

    let rollResult;
    if (advantage === 'advantage') {
      rollResult = roller.rollAdvantage(`1d20+${modifier}`);
      rollResult.total = rollResult.chosen;
    } else if (advantage === 'disadvantage') {
      rollResult = roller.rollDisadvantage(`1d20+${modifier}`);
      rollResult.total = rollResult.chosen;
    } else {
      rollResult = roller.roll(`1d20+${modifier}`);
    }

    const success = rollResult.total >= dc;

    return {
      ability,
      dc,
      modifier,
      roll: rollResult,
      total: rollResult.total,
      success,
      naturalCrit: rollResult.natural20,
      naturalFail: rollResult.natural1
    };
  }

  /**
   * Perform skill check (ability check with proficiency)
   */
  makeSkillCheck(character, skill, dc, advantage = 'normal') {
    const skillBonus = character.skill_proficiencies[skill];
    const roller = new DiceRoller();

    let rollResult;
    if (advantage === 'advantage') {
      rollResult = roller.rollAdvantage(`1d20+${skillBonus}`);
      rollResult.total = rollResult.chosen;
    } else if (advantage === 'disadvantage') {
      rollResult = roller.rollDisadvantage(`1d20+${skillBonus}`);
      rollResult.total = rollResult.chosen;
    } else {
      rollResult = roller.roll(`1d20+${skillBonus}`);
    }

    const success = rollResult.total >= dc;

    return {
      skill,
      dc,
      bonus: skillBonus,
      roll: rollResult,
      total: rollResult.total,
      success,
      naturalCrit: rollResult.natural20,
      naturalFail: rollResult.natural1
    };
  }

  /**
   * Saving throw
   */
  makeSavingThrow(character, ability, dc, advantage = 'normal') {
    const saveBonus = character.saving_throws[ability];
    const roller = new DiceRoller();

    let rollResult;
    if (advantage === 'advantage') {
      rollResult = roller.rollAdvantage(`1d20+${saveBonus}`);
      rollResult.total = rollResult.chosen;
    } else if (advantage === 'disadvantage') {
      rollResult = roller.rollDisadvantage(`1d20+${saveBonus}`);
      rollResult.total = rollResult.chosen;
    } else {
      rollResult = roller.roll(`1d20+${saveBonus}`);
    }

    const success = rollResult.total >= dc;

    return {
      save: ability,
      dc,
      bonus: saveBonus,
      roll: rollResult,
      total: rollResult.total,
      success,
      naturalCrit: rollResult.natural20,
      naturalFail: rollResult.natural1
    };
  }
}
```

**Combat Module (combat.js):**
```javascript
class CombatHandler {
  /**
   * Make attack roll
   */
  makeAttackRoll(attacker, weapon, target, advantage = 'normal') {
    const attackBonus = weapon.attack_bonus;
    const roller = new DiceRoller();

    let rollResult;
    if (advantage === 'advantage') {
      rollResult = roller.rollAdvantage(`1d20+${attackBonus}`);
      rollResult.total = rollResult.chosen;
    } else if (advantage === 'disadvantage') {
      rollResult = roller.rollDisadvantage(`1d20+${attackBonus}`);
      rollResult.total = rollResult.chosen;
    } else {
      rollResult = roller.roll(`1d20+${attackBonus}`);
    }

    const targetAC = target.armor_class || target.ac;
    const hit = rollResult.total >= targetAC;
    const criticalHit = rollResult.natural20;
    const criticalMiss = rollResult.natural1;

    let damageRoll = null;
    if (hit && !criticalMiss) {
      if (criticalHit) {
        // Critical hit: double dice
        const [dice, modifier] = weapon.damage.split('+');
        const [num, size] = dice.split('d');
        const critDamage = `${num * 2}d${size}+${modifier}`;
        damageRoll = roller.roll(critDamage);
      } else {
        damageRoll = roller.roll(weapon.damage);
      }
    }

    return {
      weapon: weapon.name,
      attackRoll: rollResult,
      targetAC,
      hit,
      criticalHit,
      criticalMiss,
      damage: damageRoll,
      damageType: weapon.damage_type
    };
  }

  /**
   * Apply damage to target
   */
  applyDamage(target, damage, damageType) {
    // Check resistances/immunities
    let finalDamage = damage;

    if (target.resistances && target.resistances.includes(damageType)) {
      finalDamage = Math.floor(damage / 2);
    }

    if (target.immunities && target.immunities.includes(damageType)) {
      finalDamage = 0;
    }

    if (target.vulnerabilities && target.vulnerabilities.includes(damageType)) {
      finalDamage = damage * 2;
    }

    // Apply to HP
    const newHP = Math.max(0, target.hit_points.current - finalDamage);
    const previousHP = target.hit_points.current;
    target.hit_points.current = newHP;

    return {
      previousHP,
      damageDealt: finalDamage,
      newHP,
      unconscious: newHP === 0,
      overkill: newHP === 0 && finalDamage >= target.hit_points.max
    };
  }

  /**
   * Initiative roll for combat order
   */
  rollInitiative(character) {
    const roller = new DiceRoller();
    const initiativeBonus = character.initiative || character.ability_modifiers.dexterity;
    const rollResult = roller.roll(`1d20+${initiativeBonus}`);

    return {
      character: character.character_name || character.name,
      initiative: rollResult.total,
      roll: rollResult
    };
  }
}
```

### 9.3 Spell System

**Spell Data Format (spells/[spell-name].yaml):**
```yaml
spell_name: "Cure Wounds"
level: 1
school: "Evocation"
casting_time: "1 action"
range: "Touch"
components: ["V", "S"]
duration: "Instantaneous"
concentration: false

description: |
  A creature you touch regains a number of hit points equal to 1d8 + your
  spellcasting ability modifier. This spell has no effect on undead or constructs.

at_higher_levels: |
  When you cast this spell using a spell slot of 2nd level or higher, the healing
  increases by 1d8 for each slot level above 1st.

classes:
  - "Bard"
  - "Cleric"
  - "Druid"
  - "Paladin"
  - "Ranger"

implementation:
  type: "healing"
  base_healing: "1d8"
  modifier_ability: "spellcasting"
  scaling: "+1d8 per level"
```

**Spellcasting Module (spellcasting.js):**
```javascript
class SpellcastingHandler {
  /**
   * Cast spell and apply effects
   */
  castSpell(caster, spellName, spellLevel, targets = []) {
    const spell = this.loadSpell(spellName);

    // Check spell slot availability
    if (!this.hasSpellSlot(caster, spellLevel)) {
      return { error: "No spell slots available at this level" };
    }

    // Consume spell slot
    caster.spell_slots[`level_${spellLevel}`].remaining -= 1;

    // Handle spell effects based on type
    let results = {};

    if (spell.implementation.type === 'healing') {
      results = this.handleHealingSpell(caster, spell, spellLevel, targets);
    } else if (spell.implementation.type === 'damage') {
      results = this.handleDamageSpell(caster, spell, spellLevel, targets);
    } else if (spell.implementation.type === 'buff') {
      results = this.handleBuffSpell(caster, spell, targets);
    } else if (spell.implementation.type === 'save') {
      results = this.handleSaveSpell(caster, spell, targets);
    }

    return {
      spell: spellName,
      level: spellLevel,
      caster: caster.character_name,
      results,
      slotsRemaining: caster.spell_slots[`level_${spellLevel}`].remaining
    };
  }

  handleHealingSpell(caster, spell, level, targets) {
    const roller = new DiceRoller();
    const modifier = caster.ability_modifiers[caster.spellcasting_ability.toLowerCase()];

    // Calculate healing dice based on level
    let healingDice = spell.implementation.base_healing;
    if (level > spell.level) {
      const extraDice = level - spell.level;
      const [num, size] = spell.implementation.base_healing.split('d');
      healingDice = `${parseInt(num) + extraDice}d${size}`;
    }

    const healingRoll = roller.roll(`${healingDice}+${modifier}`);

    const results = targets.map(target => {
      const previousHP = target.hit_points.current;
      const newHP = Math.min(
        target.hit_points.max,
        previousHP + healingRoll.total
      );
      target.hit_points.current = newHP;

      return {
        target: target.character_name || target.name,
        previousHP,
        healingAmount: healingRoll.total,
        newHP
      };
    });

    return { healing: healingRoll.total, targets: results };
  }
}
```

---

## 10. Git Version Control Strategy

### 10.1 Git as Save System

Git provides natural save/load functionality for the game:

**Save Points:**
- **Auto-save commits**: After each session end
- **Manual saves**: Player uses `/save-game [name]` command
- **Checkpoint commits**: Before major decisions or dangerous encounters
- **Event commits**: After significant world changes

**Commit Message Format:**
```
[AUTO-SAVE] Session 5 - Arrived in Vallaki

Location: Vallaki
Date: 2024-03-15, 18:30
Level: 5
Quest: Escort Ireena (In Progress)

Major events:
- Traveled from Tser Pool to Vallaki
- Met Baron Vargas Vallakovich
- Witnessed Festival of the Blazing Sun preparation
```

### 10.2 Branch Strategy

**Main Branch:**
- Primary playthrough timeline
- All official game progress

**Save Branches:**
- Named saves for different decision points
- Example: `save/before-strahd-fight`, `save/level-5-vallaki`

**Experimental Branches:**
- Test different choices without affecting main timeline
- Can be merged back or discarded

**Git Commands for Game:**
```bash
# Create save point
git checkout -b save/pre-castle-ravenloft
git add .
git commit -m "[SAVE] Before entering Castle Ravenloft"

# Load save point
git checkout save/pre-castle-ravenloft
git checkout -b main-timeline-alternative

# List all saves
git branch --list "save/*"

# View save details
git show save/pre-castle-ravenloft

# Undo last session (soft reset)
git reset --soft HEAD~1

# Completely revert world state
git reset --hard HEAD~1  # WARNING: Destructive
```

### 10.3 .gitignore Configuration

```.gitignore
# Node modules and dependencies
node_modules/
npm-debug.log

# VS Code workspace settings (personal preferences)
.vscode/settings.json

# Environment variables and secrets
.env
.env.local
api-keys.txt

# Temporary game files
temp/
*.tmp

# Session logs (optional - can commit if desired)
# logs/

# Build artifacts
dist/
build/

# OS files
.DS_Store
Thumbs.db
```

### 10.4 File Change Tracking

**What to Commit:**
- Location State.md changes (world state updates)
- Character sheet updates (level-ups, inventory changes)
- Quest progress (active-quests.yaml, completed-quests.yaml)
- Calendar updates (calendar.yaml)
- World state changes (world-state.yaml)
- Session logs

**What NOT to Commit:**
- Temporary files
- API keys
- Personal VS Code settings
- Cache files

### 10.5 Backup Strategy

**Local Backups:**
```bash
# Automated backup script
#!/bin/bash
# backup-game.sh

BACKUP_DIR="$HOME/kapi-rpg-backups"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_NAME="kapi-rpg-backup-$TIMESTAMP"

# Create backup
git bundle create "$BACKUP_DIR/$BACKUP_NAME.bundle" --all

# Keep only last 10 backups
cd "$BACKUP_DIR"
ls -t *.bundle | tail -n +11 | xargs rm -f

echo "Backup created: $BACKUP_NAME.bundle"
```

**Remote Backups (Optional):**
- GitHub private repository
- GitLab private repository
- Self-hosted Git server

**WARNING**: Do not commit API keys or sensitive data to remote repositories.

---

## Phase 2 Complete

Phase 2 covers: Data Structures (character sheets, NPCs, quests), D&D 5e Rules Engine Implementation, and Git Version Control Strategy.

**Phase 3 will cover:**
- Implementation roadmap (development phases and priorities)
- Development environment setup
- Testing strategy
- Performance optimization
- Security considerations
- Future enhancements

---

## 11. Implementation Roadmap

### 11.1 Development Phases

The implementation follows a 5-epic structure aligned with the GDD:

#### **Epic 1: Core Engine & Location System (MVP Foundation)**
**Priority:** Critical | **Duration:** 3-4 weeks | **Stories:** 8-12

**Objectives:**
- Establish folder-based location architecture
- Implement basic location data loading
- Create minimal VS Code extension
- Basic LLM integration for narrative

**Key Deliverables:**
1. Location folder structure with template files
2. Location data parser (reads Description.md, NPCs.md, etc.)
3. Context loader module (builds LLM prompts from location files)
4. Basic slash commands (`/start-session`, `/look`, `/end-session`)
5. LLM narrator integration with Claude API
6. Simple navigation between locations
7. Session logging system
8. Git auto-save on session end

**Acceptance Criteria:**
- Player can start session, navigate between 3 test locations, and receive LLM-generated descriptions
- Location state persists between sessions
- Git commits created automatically

**Technical Risks:**
- Context window management for large locations
- File I/O performance with many location files
- VS Code extension API learning curve

---

#### **Epic 2: Game Calendar & Dynamic World System**
**Priority:** High | **Duration:** 2-3 weeks | **Stories:** 6-10

**Objectives:**
- Implement game calendar tracking
- Create event scheduling system
- Time advancement mechanics
- World state updates based on calendar events

**Key Deliverables:**
1. Calendar data structure (calendar.yaml)
2. Time advancement module (manual and automatic modes)
3. Event scheduler with trigger system
4. NPC schedule tracking
5. `/calendar` and `/advance-time` commands
6. Event execution engine
7. State.md auto-update on events
8. Moon phase and weather system

**Acceptance Criteria:**
- Calendar tracks in-game date/time accurately
- Events trigger automatically when time advances
- NPCs follow daily schedules
- Location state updates reflect time passage

**Technical Risks:**
- Event timing conflicts and race conditions
- Performance with hundreds of scheduled events
- Time zone handling for date/time calculations

---

#### **Epic 3: D&D 5e Mechanics Integration**
**Priority:** High | **Duration:** 3-5 weeks | **Stories:** 10-15

**Objectives:**
- Implement complete D&D 5e rules engine
- Character sheet management
- Combat system
- Spellcasting mechanics

**Key Deliverables:**
1. Dice rolling module with advantage/disadvantage
2. Character sheet parser and editor
3. Ability check and saving throw handlers
4. Skill check system with proficiency
5. Combat manager (initiative, attacks, damage)
6. Spell database and spellcasting module
7. Inventory management with weight/encumbrance
8. Level-up calculator
9. `/roll`, `/character`, `/inventory`, `/cast` commands
10. HP tracking and death saves
11. Condition tracking (poisoned, exhausted, etc.)
12. Rest mechanics (short/long rest)

**Acceptance Criteria:**
- All core D&D 5e mechanics functional
- Dice rolls produce correct results with proper modifiers
- Combat flows smoothly from initiative to resolution
- Spells consume slots and apply effects correctly
- Character sheet updates persist

**Technical Risks:**
- Rules complexity and edge cases
- D&D 5e SRD licensing compliance
- Balance between automation and player agency

---

#### **Epic 4: Curse of Strahd Content Implementation**
**Priority:** Medium | **Duration:** 6-8 weeks | **Stories:** 12-18

**Objectives:**
- Populate Barovia with all Curse of Strahd content
- Create 30+ location folders with complete data
- Implement 50+ NPC profiles
- Build quest database

**Key Deliverables:**
1. All Curse of Strahd locations created:
   - Village of Barovia
   - Castle Ravenloft (60+ rooms)
   - Vallaki
   - Krezk
   - Argynvostholt
   - Amber Temple
   - Tser Pool Encampment
   - Wizard of Wines Winery
   - Yester Hill
   - (+ 20 more locations)

2. Complete NPC database:
   - Strahd von Zarovich (with AI behavior rules)
   - Ireena Kolyana
   - Rudolph van Richten
   - Ezmerelda d'Avenir
   - Madam Eva
   - (+ 45 more NPCs)

3. Quest system:
   - Main quest: Defeat Strahd
   - Artifact quests (Holy Symbol, Sunsword, Tome)
   - Side quests (Wine shortage, St. Andral's bones, etc.)
   - Quest progression tracking

4. Monster statblocks for common encounters
5. Item database (magic items, weapons, treasure)
6. Tarokka reading system (artifact location randomization)

**Acceptance Criteria:**
- All major Curse of Strahd locations playable
- NPCs behave according to campaign lore
- Quests progress logically based on player actions
- Tarokka reading produces valid artifact locations

**Technical Risks:**
- Content volume (196 sections in narrative doc)
- Consistency across interconnected locations
- Balancing LLM freedom vs. canon adherence
- Spoiler protection in data files

---

#### **Epic 5: LLM-DM Integration & VS Code Workflows**
**Priority:** Medium | **Duration:** 2-3 weeks | **Stories:** 8-12

**Objectives:**
- Optimize LLM context loading
- Refine DM system prompts
- Polish VS Code user experience
- Add quality-of-life features

**Key Deliverables:**
1. Intelligent context loader (priority-based file loading)
2. Context caching strategy
3. LLM prompt templates for different scenarios:
   - Location descriptions
   - NPC dialogue
   - Combat narration
   - Quest updates
   - Event descriptions

4. Enhanced slash commands:
   - `/talk [npc]` - Conversation mode
   - `/search` - Location investigation
   - `/map` - World map view
   - `/save-game [name]` - Named save points
   - `/load-game [name]` - Load from save

5. VS Code UI improvements:
   - Markdown preview styling for immersive text
   - Sidebar for quick character sheet access
   - Quest tracker panel
   - Calendar widget

6. Session management:
   - Resume previous session
   - Session summary generation
   - Play time tracking

7. Performance optimization:
   - File read caching
   - Lazy loading of location data
   - Async/await for API calls

**Acceptance Criteria:**
- Context loading stays under token limits
- LLM responses feel natural and DM-like
- VS Code interface intuitive and polished
- Game sessions start/resume quickly

**Technical Risks:**
- Claude API rate limits
- Token costs for long sessions
- Context optimization vs. quality tradeoff

---

### 11.2 Minimum Viable Product (MVP)

**MVP Scope:**
- Epic 1: Core Engine (complete)
- Epic 2: Calendar System (basic time advancement only)
- Epic 3: D&D 5e Mechanics (dice rolling, character sheets, basic combat)
- Epic 4: Limited Content (Village of Barovia + 2 other locations)
- Epic 5: Basic LLM Integration

**MVP Goal:** Playable 2-hour session in Village of Barovia with basic exploration, NPC interaction, and one combat encounter.

**MVP Timeline:** 6-8 weeks

---

### 11.3 Post-MVP Enhancements

**Phase 2 Features (After MVP):**
- Complete Curse of Strahd campaign content
- Advanced combat features (conditions, area effects)
- Multiplayer support (multiple characters)
- Voice narration (text-to-speech)
- Custom campaign creator tools

**Phase 3 Features (Long-term):**
- Additional D&D 5e campaigns
- Homebrew campaign support
- Web-based interface (beyond VS Code)
- Mobile companion app
- DM mode (manual control override)

---

## 12. Development Environment Setup

### 12.1 Prerequisites

**Required Software:**
- **Node.js:** v18 or higher
- **npm:** v9 or higher
- **Git:** v2.x
- **VS Code:** Latest stable version
- **Claude Code Extension:** Must be installed and authenticated

**Recommended VS Code Extensions:**
- ESLint
- Prettier
- YAML
- Markdown All in One
- GitLens

### 12.2 Project Structure

```
kapi-s-rpg/
├── .claude/                    # Claude context and knowledge
│   └── RPG-engine/
│       └── D&D 5e collection/
├── .vscode/                    # VS Code extension
│   ├── extension.js
│   ├── package.json
│   └── commands/
├── docs/                       # Planning documents
│   ├── game-brief-Kapi-s-RPG-2025-10-29.md
│   ├── GDD.md
│   ├── narrative-design.md
│   └── technical-architecture.md
├── src/                        # Game engine source code
│   ├── core/
│   │   ├── session-manager.js
│   │   ├── context-loader.js
│   │   └── llm-narrator.js
│   ├── calendar/
│   │   ├── calendar-manager.js
│   │   ├── event-scheduler.js
│   │   └── time-manager.js
│   ├── rules/
│   │   ├── dice-roller.js
│   │   ├── ability-checks.js
│   │   ├── combat.js
│   │   ├── spellcasting.js
│   │   └── character-manager.js
│   ├── data/
│   │   ├── location-loader.js
│   │   ├── npc-loader.js
│   │   └── quest-manager.js
│   └── utils/
│       ├── file-utils.js
│       ├── yaml-parser.js
│       └── git-utils.js
├── game-data/                  # Game world data
│   ├── locations/
│   │   ├── village-of-barovia/
│   │   ├── castle-ravenloft/
│   │   └── ...
│   ├── characters/
│   │   └── [character-name].yaml
│   ├── quests/
│   │   ├── active-quests.yaml
│   │   └── completed-quests.yaml
│   ├── spells/
│   │   └── [spell-name].yaml
│   ├── calendar.yaml
│   └── world-state.yaml
├── logs/                       # Session logs
│   └── session-[date].md
├── tests/                      # Unit tests
│   ├── rules/
│   ├── calendar/
│   └── core/
├── .env                        # Environment variables (API keys)
├── .gitignore
├── package.json
└── README.md
```

### 12.3 Installation Steps

**1. Clone Repository:**
```bash
git clone https://github.com/kapi/kapi-s-rpg.git
cd kapi-s-rpg
```

**2. Install Dependencies:**
```bash
npm install
```

**3. Configure Environment:**
```bash
# Create .env file
cat > .env << EOF
CLAUDE_API_KEY=your_api_key_here
CLAUDE_MODEL=claude-sonnet-4-20250514
MAX_TOKENS=4096
TEMPERATURE=0.7
EOF
```

**4. Install VS Code Extension:**
```bash
# Link extension to VS Code
cd .vscode
npm install
npm run build
code --install-extension kapi-rpg-extension-0.0.1.vsix
```

**5. Initialize Game Data:**
```bash
# Create initial game structure
npm run init-game-data
```

**6. Run Tests:**
```bash
npm test
```

**7. Start Development Server:**
```bash
npm run dev
```

### 12.4 Configuration Files

**package.json:**
```json
{
  "name": "kapi-s-rpg",
  "version": "0.1.0",
  "description": "LLM-powered D&D 5e solo RPG platform",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "init-game-data": "node scripts/init-game-data.js",
    "lint": "eslint src/**/*.js",
    "format": "prettier --write src/**/*.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "yaml": "^2.3.4",
    "dotenv": "^16.3.1",
    "marked": "^11.0.0",
    "chalk": "^5.3.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.0.2",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1"
  }
}
```

**jest.config.js:**
```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  verbose: true
};
```

**.eslintrc.js:**
```javascript
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
  }
};
```

---

## 13. Testing Strategy

### 13.1 Testing Pyramid

```
                    /\
                   /  \
                  / E2E \ (End-to-End: 10%)
                 /______\
                /        \
               /Integration\ (20%)
              /____________\
             /              \
            /  Unit Tests    \ (70%)
           /__________________\
```

**Unit Tests (70%):**
- Test individual modules in isolation
- Focus on rules engine, dice rolling, calculations
- Fast execution, high coverage

**Integration Tests (20%):**
- Test module interactions
- Context loading → LLM → State updates
- File I/O operations
- Git operations

**End-to-End Tests (10%):**
- Complete user workflows
- Start session → Navigate → Combat → End session
- Save/load functionality

### 13.2 Unit Test Examples

**tests/rules/dice-roller.test.js:**
```javascript
const DiceRoller = require('../../src/rules/dice-roller');

describe('DiceRoller', () => {
  let roller;

  beforeEach(() => {
    roller = new DiceRoller();
  });

  test('roll 1d20 returns value between 1 and 20', () => {
    const result = roller.roll('1d20');
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeLessThanOrEqual(20);
  });

  test('roll 2d6+3 includes modifier', () => {
    const result = roller.roll('2d6+3');
    expect(result.modifier).toBe(3);
    expect(result.total).toBeGreaterThanOrEqual(5); // Min: 2 + 3
    expect(result.total).toBeLessThanOrEqual(15); // Max: 12 + 3
  });

  test('roll with advantage takes higher value', () => {
    // Mock Math.random to control dice results
    jest.spyOn(Math, 'random')
      .mockReturnValueOnce(0.5)  // First roll: 11
      .mockReturnValueOnce(0.9); // Second roll: 19

    const result = roller.rollAdvantage('1d20');
    expect(result.chosen).toBe(19);
    expect(result.discarded).toBe(11);

    Math.random.mockRestore();
  });

  test('natural 20 detected correctly', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.99);

    const result = roller.roll('1d20');
    expect(result.natural20).toBe(true);

    Math.random.mockRestore();
  });
});
```

**tests/rules/ability-checks.test.js:**
```javascript
const AbilityCheckHandler = require('../../src/rules/ability-checks');

describe('AbilityCheckHandler', () => {
  let handler;
  let mockCharacter;

  beforeEach(() => {
    handler = new AbilityCheckHandler();
    mockCharacter = {
      ability_modifiers: {
        strength: 3,
        dexterity: 4,
        constitution: 2,
        intelligence: 1,
        wisdom: 0,
        charisma: 2
      },
      skill_proficiencies: {
        stealth: 10, // DEX 4 + Proficiency 3 + Expertise 3
        perception: 3 // WIS 0 + Proficiency 3
      }
    };
  });

  test('ability check uses correct modifier', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Roll 11

    const result = handler.makeAbilityCheck(mockCharacter, 'strength', 15);
    expect(result.modifier).toBe(3);
    expect(result.total).toBe(14); // 11 + 3
    expect(result.success).toBe(false); // 14 < 15

    Math.random.mockRestore();
  });

  test('skill check uses skill proficiency bonus', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Roll 11

    const result = handler.makeSkillCheck(mockCharacter, 'stealth', 20);
    expect(result.bonus).toBe(10);
    expect(result.total).toBe(21); // 11 + 10
    expect(result.success).toBe(true); // 21 >= 20

    Math.random.mockRestore();
  });
});
```

### 13.3 Integration Test Examples

**tests/integration/context-loading.test.js:**
```javascript
const ContextLoader = require('../../src/core/context-loader');
const fs = require('fs').promises;

describe('Context Loading Integration', () => {
  let loader;
  let testLocationPath;

  beforeAll(async () => {
    // Create test location
    testLocationPath = './test-data/test-location';
    await fs.mkdir(testLocationPath, { recursive: true });
    await fs.writeFile(
      `${testLocationPath}/Description.md`,
      '# Test Location\nA test location for integration tests.'
    );
    await fs.writeFile(
      `${testLocationPath}/NPCs.md`,
      '## Test NPC\n- **Type:** Human\n- **Status:** Alive'
    );
  });

  afterAll(async () => {
    // Cleanup
    await fs.rm(testLocationPath, { recursive: true });
  });

  test('loads location data correctly', async () => {
    loader = new ContextLoader();
    const context = await loader.loadLocationContext('test-location');

    expect(context.description).toContain('A test location');
    expect(context.npcs).toContain('Test NPC');
  });

  test('respects priority when loading context', async () => {
    loader = new ContextLoader({ maxTokens: 1000 });
    const context = await loader.loadLocationContext('test-location');

    // Priority 1 items should always load
    expect(context.description).toBeDefined();
    expect(context.state).toBeDefined();
  });
});
```

### 13.4 Testing Best Practices

**General Principles:**
1. **Arrange-Act-Assert Pattern:** Structure all tests clearly
2. **Mock External Dependencies:** Mock LLM API calls, file I/O in unit tests
3. **Test Edge Cases:** Empty locations, missing files, invalid data
4. **Test Error Handling:** Verify proper error messages and recovery
5. **Maintain Test Data:** Keep test fixtures separate from production data

**Test Coverage Goals:**
- Rules Engine: 95%+ coverage
- Core Systems: 85%+ coverage
- Data Loaders: 80%+ coverage
- UI/Commands: 60%+ coverage (harder to test)

**Continuous Integration:**
```yaml
# .github/workflows/test.yml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run lint
```

---

## 14. Performance Optimization

### 14.1 Performance Targets

**Target Metrics:**
- Session start time: < 3 seconds
- Location navigation: < 1 second
- LLM response time: < 5 seconds (depends on API)
- File read operations: < 100ms per location
- Memory usage: < 512 MB during normal gameplay

### 14.2 Optimization Strategies

**1. Context Caching:**
```javascript
class ContextLoader {
  constructor() {
    this.cache = new Map();
    this.cacheMaxAge = 5 * 60 * 1000; // 5 minutes
  }

  async loadLocationContext(locationId) {
    const cached = this.cache.get(locationId);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.cacheMaxAge) {
      return cached.data;
    }

    const data = await this._loadFromDisk(locationId);
    this.cache.set(locationId, { data, timestamp: now });
    return data;
  }
}
```

**2. Lazy Loading:**
- Load only current location on session start
- Load adjacent locations in background
- Load NPCs only when interacted with

**3. File Batching:**
```javascript
async function loadLocationFiles(locationPath) {
  // Read all files in parallel
  const [description, npcs, items, events, state] = await Promise.all([
    fs.readFile(`${locationPath}/Description.md`, 'utf-8'),
    fs.readFile(`${locationPath}/NPCs.md`, 'utf-8'),
    fs.readFile(`${locationPath}/Items.md`, 'utf-8'),
    fs.readFile(`${locationPath}/Events.md`, 'utf-8'),
    fs.readFile(`${locationPath}/State.md`, 'utf-8')
  ]);

  return { description, npcs, items, events, state };
}
```

**4. Token Budget Management:**
```javascript
function optimizeContextForTokens(context, maxTokens = 3000) {
  const priority = [
    { key: 'description', weight: 1.0 },
    { key: 'activeNPCs', weight: 0.9 },
    { key: 'state', weight: 0.8 },
    { key: 'items', weight: 0.5 },
    { key: 'events', weight: 0.4 }
  ];

  let totalTokens = 0;
  const optimized = {};

  for (const item of priority) {
    const tokens = estimateTokens(context[item.key]);
    if (totalTokens + tokens <= maxTokens) {
      optimized[item.key] = context[item.key];
      totalTokens += tokens;
    } else {
      // Truncate if needed
      const remainingTokens = maxTokens - totalTokens;
      optimized[item.key] = truncateToTokens(context[item.key], remainingTokens);
      break;
    }
  }

  return optimized;
}
```

### 14.3 Monitoring and Profiling

**Performance Logging:**
```javascript
class PerformanceMonitor {
  static logOperation(name, duration) {
    if (duration > 1000) {
      console.warn(`Slow operation: ${name} took ${duration}ms`);
    }

    // Optional: Write to performance log
    fs.appendFile('logs/performance.log',
      `${new Date().toISOString()} - ${name}: ${duration}ms\n`
    );
  }

  static async measure(name, fn) {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      const duration = Date.now() - start;
      this.logOperation(name, duration);
    }
  }
}

// Usage
const context = await PerformanceMonitor.measure(
  'loadLocationContext',
  () => contextLoader.loadLocationContext('village-of-barovia')
);
```

---

## 15. Security Considerations

### 15.1 Claude Code Extension Integration

**No API Keys Required:**
- Game uses Claude Code extension's existing authentication
- No separate API key management needed
- Users authenticate once with Claude Code extension

**Extension Detection and Validation:**
```javascript
// Check if Claude Code extension is available
const vscode = require('vscode');

function validateClaudeCodeExtension() {
  const claudeCodeExt = vscode.extensions.getExtension('anthropic.claude-code');

  if (!claudeCodeExt) {
    throw new Error('Claude Code extension not found. Please install it from VS Code marketplace.');
  }

  if (!claudeCodeExt.isActive) {
    throw new Error('Claude Code extension is not active. Please ensure it is enabled.');
  }

  return claudeCodeExt;
}
```

**Extension Dependency Management:**
- Clearly document Claude Code as required dependency
- Check extension availability at game startup
- Provide helpful error messages if extension not found
- No security concerns around API key storage or rotation

### 15.2 Input Validation

**Sanitize user input:**
```javascript
function sanitizeInput(input) {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[\r\n]+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, 1000); // Limit length
}
```

**Validate file paths:**
```javascript
function validateLocationPath(locationId) {
  // Prevent directory traversal
  const sanitized = locationId.replace(/[^a-z0-9-_]/gi, '');

  if (sanitized !== locationId) {
    throw new Error('Invalid location ID');
  }

  const fullPath = path.join(GAME_DATA_DIR, 'locations', sanitized);

  // Ensure path stays within game data directory
  if (!fullPath.startsWith(GAME_DATA_DIR)) {
    throw new Error('Path traversal attempt detected');
  }

  return fullPath;
}
```

### 15.3 Data Privacy

**Local-first design:**
- All game data stored locally
- No telemetry or analytics collection
- Player data never leaves local machine (unless explicit backup)

**Optional cloud backup:**
- If user chooses cloud backup, encrypt data first
- Use player-controlled encryption keys
- Clear privacy policy

---

## 16. Future Enhancements

### 16.1 Short-term (3-6 months)

**1. Enhanced AI Features:**
- GPT-4 Vision for image-based character portraits
- Voice input/output for hands-free play
- AI-generated location images

**2. Content Expansion:**
- Additional D&D 5e campaigns (Waterdeep: Dragon Heist, Tomb of Annihilation)
- Custom campaign import tools
- Community content sharing (with privacy controls)

**3. Quality of Life:**
- Mobile companion app for character sheet viewing
- Web dashboard for campaign tracking
- Automated session summaries

### 16.2 Mid-term (6-12 months)

**1. Multiplayer Support:**
- Multiple player characters in same world
- Shared session mode
- Turn-based multiplayer

**2. Advanced DM Tools:**
- Manual event triggering
- Custom NPC creation wizard
- Location builder with templates
- Quest designer

**3. Homebrew Support:**
- Custom class/race creator
- Homebrew spell importer
- Variant rule toggles

### 16.3 Long-term (12+ months)

**1. Cross-Platform:**
- Standalone desktop application (Electron)
- Web-based version (browser playable)
- Mobile apps (iOS/Android)

**2. Live DM Mode:**
- Human DM can take control
- Hybrid AI/human DMing
- DM screen interface

**3. VTT Integration:**
- Roll20 integration
- Foundry VTT plugin
- Import maps and tokens

**4. Advanced AI:**
- Persistent NPC memory across sessions
- Dynamic quest generation
- Procedural dungeon generation
- AI-driven story branching

---

## 17. Glossary

**Technical Terms:**

- **Context Injection:** Loading relevant game data into LLM prompts
- **Context Window:** Maximum tokens the LLM can process at once
- **Event Scheduler:** System that triggers time-based events
- **Location Folder:** Directory containing all data for a game location
- **LLM-DM:** Large Language Model acting as Dungeon Master
- **Rules Engine:** Code that handles D&D 5e game mechanics
- **Save Point:** Git commit representing a game state snapshot
- **Session:** Single play session from start to end
- **Slash Command:** VS Code command starting with / for game actions
- **State.md:** File tracking current location status
- **Token Budget:** Allocation of tokens across different context elements

**D&D Terms:**

- **Ability Check:** Roll to determine success of an action
- **AC (Armor Class):** Difficulty to hit a creature in combat
- **Advantage:** Roll 2d20, take higher result
- **CR (Challenge Rating):** Monster difficulty level
- **DC (Difficulty Class):** Target number for checks/saves
- **HP (Hit Points):** Measure of health
- **Initiative:** Combat turn order
- **Saving Throw:** Roll to resist effects
- **Spell Slot:** Resource consumed to cast spells
- **SRD (System Reference Document):** Free D&D 5e rules

---

## 18. Conclusion

This Technical Architecture Document provides a comprehensive blueprint for implementing Kapi-s-RPG, an LLM-powered D&D 5e solo RPG platform. The architecture leverages:

**Key Innovations:**
1. **Folder-based Persistent World:** Each location = folder with structured files
2. **Git as Save System:** Version control provides natural save/load functionality
3. **Dynamic Game Calendar:** Time-based events that evolve the world
4. **Separation of Concerns:** Rules engine handles mechanics, LLM handles narrative
5. **Context Optimization:** Priority-based loading keeps within token limits

**Development Approach:**
- 5 epic phased implementation
- MVP in 6-8 weeks (playable Village of Barovia)
- Test-driven development with 80%+ coverage
- Iterative enhancement based on playtesting

**Technical Foundation:**
- Node.js + VS Code for platform
- Claude API for LLM-DM
- Git for version control
- Markdown/YAML for human-readable data
- Modular, extensible architecture

**Success Criteria:**
- Immersive solo D&D 5e experience
- Seamless narrative generation
- Accurate rules implementation
- Persistent, evolving world
- Fast, responsive gameplay

The roadmap provides clear milestones from MVP to full Curse of Strahd campaign, with extensibility for future campaigns and features.

**Next Steps:**
1. Review and approve architecture document
2. Set up development environment
3. Begin Epic 1: Core Engine implementation
4. Regular playtesting and iteration

---

**Document Status:** Complete
**Version:** 1.0
**Date:** 2025-10-29
**Author:** Architect Agent (BMAD Workflow)

---

_This architecture document is a living document and will be updated as the project evolves._
