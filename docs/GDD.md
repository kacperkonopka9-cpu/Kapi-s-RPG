# Kapi-s-RPG - Game Design Document

**Author:** Kapi
**Game Type:** Text-Based RPG / Interactive Fiction (LLM-Powered D&D 5e Platform)
**Target Platform(s):** VS Code (Local File System)

---

## Executive Summary

### Core Concept

Kapi-s-RPG is an LLM-powered text-based D&D 5e campaign platform that creates persistent, living game worlds for solo tabletop RPG play. Using a folder-based architecture, each location becomes a structured, evolving entity that remembers every interaction, character, and event. Players experience story-driven D&D campaigns through VS Code workflows with an AI Dungeon Master that maintains dynamic world state and game calendar, starting with the gothic horror of Curse of Strahd in Barovia.

### Target Audience

**Primary:** Solo TTRPG players (ages 25-45) who are experienced with D&D 5e but face scheduling constraints for traditional group play. Working professionals who value deep, story-driven experiences with narrative complexity and world consistency. Comfortable with text-based interfaces and prefer exploration/discovery over pure combat optimization.

**Secondary:** Dungeon Masters seeking campaign planning tools or wanting to experience their own content from a player perspective. D&D content creators developing solo actual-play content or module reviews.

**Player Profile:**
- 3+ years D&D 5e experience
- Values persistent world consequences and continuity
- Prefers flexible play sessions (15 minutes to 3 hours)
- Appreciates authentic D&D 5e rules and official campaign modules
- Comfortable with VS Code and file-based workflows

### Unique Selling Points (USPs)

1. **True Persistent World Memory** - First LLM-based D&D tool with structured location folders that maintain complete history across all sessions. Return to any location and find logical, coherent evolution based on your past actions.

2. **Dynamic Game Calendar System** - Time-based event engine where world events trigger automatically on specific dates, NPCs follow schedules, and consequences cascade through connected locations independent of player presence.

3. **Official D&D 5e Campaign Integration** - Complete implementation of Curse of Strahd with all supplemental materials, professionally balanced encounters, and rich gothic horror lore.

4. **Development Workflow Integration** - Built into VS Code leveraging Git version control, markdown editing, and developer tools for a unique gaming experience that combines technical power with narrative depth.

---

## Goals and Context

### Project Goals

1. **Create Immersive Solo D&D Experience** - Build a tool that delivers the depth and richness of an expert human DM's campaign without scheduling constraints, enabling flexible play sessions of any length.

2. **Implement Persistent Living World** - Develop folder-based location architecture where every location, NPC, item, and event persists across sessions with full continuity and logical evolution over time.

3. **Complete Curse of Strahd Campaign** - Successfully implement and play through the full Curse of Strahd module (30-50 hours) as proof of concept for the platform's capabilities.

4. **Build Expandable Framework** - Create a system architecture that supports multiple D&D 5e campaigns beyond Curse of Strahd, enabling future module implementations.

5. **Achieve MVP in 2 Months** - Develop playable core engine with basic location system, game calendar, and Death House dungeon within 8 weeks.

### Background and Rationale

**The Problem:** Passionate TTRPG players with limited gaming time face constant scheduling challenges for traditional group play. Existing solutions (AI Dungeon, ChatGPT campaigns) lack proper world persistence and D&D 5e integration, while virtual tabletops still require coordinating multiple schedules.

**The Opportunity:** Modern LLM technology enables sophisticated narrative generation and world simulation. Combined with structured data management through folder-based architecture, we can create a truly persistent campaign world that maintains continuity, remembers details, and evolves dynamically.

**Personal Motivation:** As someone who loves RPGs but lacks time for regular group sessions, this platform solves a genuine need for high-quality solo D&D experiences. Leveraging VS Code and development tools provides a familiar, powerful environment for both gameplay and system development.

**Why Now:** LLM capabilities have matured to handle complex narrative tracking and rule adjudication. D&D 5e has an established player base seeking new ways to experience official content. Developer tools are increasingly used for non-coding workflows, making VS Code a viable gaming platform.

---

## Core Gameplay

### Game Pillars

1. **Persistent World Memory**
   - Every location exists as a structured data folder (NPCs.md, Items.md, Events.md, State.md)
   - NPCs, items, events, and states preserved across all sessions
   - Return to any location anytime and find coherent continuity
   - World changes persist and compound over time

2. **Narrative-Driven Exploration**
   - Story and discovery prioritized over combat mechanics
   - Rich location descriptions creating immersive gothic horror environments
   - Meaningful NPC interactions with personality and memory
   - Environmental storytelling and hidden lore discovery

3. **Dynamic World Evolution**
   - Game calendar tracking in-world time passage
   - Scheduled events trigger automatically at specified times
   - Player actions cascade through the world (NPC deaths, building destruction, faction changes)
   - Locations update dynamically based on world events

4. **Authentic D&D 5e Experience**
   - Full ruleset implementation from core books
   - Official Curse of Strahd campaign module with all supplemental materials
   - Character progression, inventory, spell management
   - Dice rolling, skill checks, and combat following Rules As Written (RAW)

### Core Gameplay Loop

1. **Session Start** - Load character sheet, world state, and current location context into LLM
2. **Location Exploration** - Read environmental descriptions, investigate surroundings, discover secrets
3. **NPC Interaction** - Engage in dialogue, build relationships, gather information and quests
4. **Action & Consequences** - Make choices (combat, skill checks, roleplay decisions) using D&D 5e mechanics
5. **World Update** - System updates location files, NPC states, calendar events based on player actions
6. **Session End** - Save world state, character progress, and session summary for continuity
7. **Time Passage** - Calendar advances, scheduled events may trigger, world evolves between sessions

**Repeat:** Player chooses next location/action and cycle continues with persistent consequences carrying forward.

### Win/Loss Conditions

**Primary Campaign Victory (Curse of Strahd):**
- Defeat Strahd von Zarovich and escape Barovia with allies
- Free the land from the curse of the Dread Domain
- Fulfill major quest objectives (protect Ireena, find artifacts, etc.)

**Alternative Success States:**
- Escape Barovia through other means (depending on DM interpretation and player choices)
- Achieve character goals and personal story arcs
- Complete significant percentage of side quests and exploration content

**Loss/Failure Conditions:**
- Character death (resurrection possible via D&D 5e rules, but permadeath is an option)
- Strahd achieves his goals (claims Ireena, destroys the party, etc.)
- Trapped in Barovia indefinitely with no hope of escape

**Ongoing Success Metrics:**
- Compelling narrative moments and character development
- Discovering secrets and solving mysteries
- Building meaningful NPC relationships
- Experiencing the full richness of the Curse of Strahd story

---

## Game Mechanics

### Primary Mechanics

**1. Location System (Folder-Based World Architecture)**
- Each game location = one folder on file system
- Structured data files per location:
  - `NPCs.md` - All non-player characters with stats, personalities, relationships, current status
  - `Items.md` - Available items, treasure, quest objects
  - `Events.md` - Scheduled events, triggers, quest stages
  - `State.md` - Current location state (time of day, weather, changes, destruction, etc.)
  - `Description.md` - Environmental descriptions and atmosphere
- Location connections/relationships tracked (travel times, adjacency)
- Visit history maintained (when visited, what happened, player notes)

**2. Game Calendar & Time System**
- Tracks in-game date and time (day, month, year, hour)
- Time advancement: manual by player or automatic based on actions
- Scheduled events with trigger conditions (date/time-based)
- NPC schedules and routines tied to calendar
- Time-sensitive quests with deadlines
- Seasonal/temporal world changes (weather, festivals, story milestones)

**3. World State Management**
- Dynamic entity updates: NPCs can die, buildings can burn, factions can change
- Consequence propagation across connected locations
- Event chains and cascading effects (kill NPC → related NPCs react → quests update)
- World state snapshots for major decision points (Git commits as save points)
- Undo/rewind capability via version control

**4. Narrative Interaction System**
- Text-based dialogue with NPCs (freeform input interpreted by LLM)
- Environmental investigation using D&D skill checks (Perception, Investigation, etc.)
- Choice-driven story branching with lasting consequences
- Quest tracking and objective management
- Player journal system for note-taking and tracking canonical events

**5. D&D 5e Core Mechanics**
- Character sheet management (class, level, HP, abilities, proficiencies)
- Ability checks and saving throws (d20 + modifiers)
- Combat system: initiative, attack rolls, damage, conditions
- Spell slot tracking and spell management
- Inventory and equipment with weight/encumbrance
- Experience points and level progression
- Long rest/short rest resource recovery

**6. LLM-DM Integration**
- System prompts load location context + character state + world rules
- LLM generates descriptions, NPC dialogue, and consequences
- Rule adjudication with D&D 5e reference
- Dice rolling for randomization (skill checks, combat, random encounters)
- Consistency validation against established world state

### Controls and Input

**Primary Input Method:** Text-based typing in VS Code

**Player Actions:**
- **Freeform Text Commands** - Natural language input describing actions ("I search the room for traps", "I ask the barkeep about Strahd", "I cast Fireball at the zombies")
- **Menu Selection** - Numbered choices when presented by DM for clarity
- **Dice Rolling** - Manual or automated dice commands for D&D mechanics
- **Character Management** - Direct editing of character sheet markdown file
- **World Exploration** - Commands to move between locations, investigate, interact

**System Commands:**
- `/start-session` - Initialize game session with character and location
- `/end-session` - Save progress and close session
- `/character` - View/edit character sheet
- `/inventory` - Check inventory and equipment
- `/calendar` - View current date/time and scheduled events
- `/location` - View current location details and available exits
- `/quest-log` - Review active and completed quests
- `/save` - Create manual save point (Git commit)
- `/load` - Restore to previous save point

**No Traditional Controls:** No keyboard shortcuts, no mouse/controller input - purely text-based interaction with the LLM-powered DM through VS Code interface.

---

## Text-Based Game Specific Elements

### Input System

**Core Interface:** Hybrid System (Natural Language + Commands)

- **Parser-Based Natural Language** - Primary input method using LLM interpretation of freeform text commands
- **Flexible Command Recognition** - LLM understands varied phrasings ("search the room", "look around", "investigate the area")
- **No Fixed Vocabulary Limitations** - Unlike traditional parsers, LLM can interpret creative or unusual actions
- **Context-Aware Interpretation** - System understands references to previously mentioned objects/NPCs
- **Command Shortcuts** - System commands with `/` prefix for meta-actions (save, load, character sheet)
- **Error Handling** - LLM provides clarifying questions when input is ambiguous ("Did you mean the wooden chest or the stone altar?")
- **Help System** - Players can ask "what can I do here?" for contextual action suggestions

### Room/Location Structure

**World Design:** Folder-Based Persistent Locations

- **Location Count** - 30+ distinct locations in Curse of Strahd (villages, wilderness, dungeons, Castle Ravenloft)
- **Room Descriptions** - Rich, atmospheric prose (150-300 words) with sensory details for immersion
- **Connection Types:**
  - Geographic paths (roads, trails, mountain passes)
  - Building entrances/exits (doors, windows, secret passages)
  - Conditional access (locked doors, magical barriers, faction requirements)
- **Map Structure** - Open-world exploration with hub-and-spoke design (villages as hubs, dungeons/locations as spokes)
- **Navigation Aids:**
  - Location folder structure mirrors in-game geography
  - Travel time tracking via calendar system
  - NPC directions and map items
- **Fast Travel** - Not implemented for immersion; must physically traverse locations

### Item and Inventory System

**Object Interaction:** D&D 5e Item System

- **Examinable Objects** - All items and environmental features can be examined for detailed descriptions
- **Takeable vs. Scenery** - Items.md defines portable objects; scenery described in location state
- **Item Use** - D&D mechanics (weapons, armor, magic items, consumables, quest items)
- **Item Combinations** - Crafting limited to D&D rules (e.g., component pouches for spells)
- **Inventory Management:**
  - Weight/encumbrance based on Strength score
  - Equipment slots (armor, weapons, accessories)
  - Inventory stored in character sheet markdown file
- **Object Descriptions** - Each item has lore description, mechanical stats, and potential uses
- **Hidden Objects** - Perception/Investigation checks reveal secret items and clues

### Puzzle Design

**Challenge Structure:** D&D Investigation & Problem-Solving

- **Puzzle Types:**
  - **Logic Puzzles** - Riddles, pattern recognition, deduction (e.g., Ravenloft crypts)
  - **Inventory Puzzles** - Using items to overcome obstacles (keys, tools, magic items)
  - **Knowledge Puzzles** - Lore-based challenges requiring information gathering
  - **Exploration Puzzles** - Finding hidden paths, mapping complex dungeons
  - **Social Puzzles** - NPC persuasion, deception, gathering allies
- **Difficulty Curve** - Scales with D&D level (easier early game, complex late game)
- **Hint System:**
  - NPC clues and rumors
  - In-world documents (books, letters, journals)
  - Skill checks (Arcana, History, Religion) provide hints
  - Player can ask LLM-DM for hints without breaking immersion
- **Puzzle Integration** - All puzzles tied to Curse of Strahd narrative and world lore
- **Non-Linear Solving** - Multiple approaches to most challenges (combat, stealth, magic, persuasion)

### Narrative and Writing

**Story Delivery:** Gothic Horror Narrative

- **Writing Tone** - Gothic horror with dark beauty; atmospheric and immersive
- **Descriptive Density** - Rich environmental descriptions (colorful yet oppressive aesthetic)
- **Character Voice:**
  - NPCs have distinct personalities from Curse of Strahd source material
  - Dialogue reflects character backgrounds, motivations, and relationships
  - Strahd and major NPCs have complex, nuanced portrayals
- **Dialogue Systems** - Freeform conversation with NPCs; LLM generates responses based on personality
- **Branching Narrative** - High branching based on player choices; major story beats flexible
- **Multiple Endings** - Various outcomes for Curse of Strahd (defeat Strahd, escape, tragic endings, etc.)

**Note:** Full narrative content will be developed in Narrative Design Document workflow.

### Game Flow and Pacing

**Structure:** Flexible Session-Based Play

- **Game Length** - 30-50 hours for complete Curse of Strahd campaign
- **Session Length** - Flexible (15 minutes to 3 hours per session)
- **Acts/Chapters:**
  - Act 1: Arrival and Village of Barovia
  - Act 2: Exploring the Domains and gathering allies/artifacts
  - Act 3: Confronting Strahd in Castle Ravenloft
- **Save System:**
  - Auto-save after each player action (file updates)
  - Manual save points via Git commits
  - Session summaries stored for continuity
- **Undo/Rewind Mechanics** - Git version control allows reverting to previous states
- **Walkthrough Accessibility** - Player can consult original Curse of Strahd book or ask LLM for hints
- **Replayability:**
  - Different character classes/builds
  - Alternative story paths and choices
  - Unexplored locations and side quests
  - Different campaign modules after Curse of Strahd

---

## Progression and Balance

### Player Progression

**D&D 5e Character Advancement:**

- **Experience Points (XP)** - Earned from combat encounters, quest completion, roleplay achievements, and exploration milestones
- **Level Progression** - Start at level 1-3, progress to level 10+ by end of Curse of Strahd
- **Milestone Leveling Option** - Alternative to XP: level up at key story moments
- **Class Features** - Unlock new abilities, spells, and class features per D&D 5e rules
- **Ability Score Improvements** - Every 4 levels, increase ability scores or take feats
- **Proficiency Bonus** - Increases with level, improving skill checks and attack rolls

**Narrative Progression:**

- **Story Arcs** - Personal character development tied to background and motivations
- **Relationship Building** - NPCs remember interactions; alliances and rivalries develop
- **World Knowledge** - Uncover lore, secrets, and mysteries about Barovia and Strahd
- **Location Mastery** - Unlock shortcuts, gain access to restricted areas, discover hidden content

**Power Progression:**

- **Magic Items** - Acquire legendary items (Sunsword, Holy Symbol of Ravenkind, Tome of Strahd)
- **Equipment Upgrades** - Find better weapons, armor, and tools throughout campaign
- **Spell Library** - Wizards/spellcasters learn new spells from scrolls and spellbooks
- **Faction Influence** - Gain standing with various Barovian factions for unique benefits

### Difficulty Curve

**Scaling Challenge:**

- **Early Game (Levels 1-3)** - Tutorial-level challenges; Village of Barovia and Death House
  - Focus on investigation and roleplay
  - Combat encounters balanced for survival (not easy wins)
  - Learn core mechanics and world rules

- **Mid Game (Levels 4-7)** - Exploration phase; discover locations, gather allies and artifacts
  - Moderate combat difficulty with occasional deadly encounters
  - Complex puzzles and multi-step quests
  - Multiple simultaneous objectives

- **Late Game (Levels 8-10+)** - Confrontation phase; Castle Ravenloft and final showdown
  - High-difficulty combat encounters (Strahd is CR 15)
  - Strategic planning required for success
  - Consequences of earlier choices impact difficulty

**Difficulty Pacing:**

- **Non-Linear Scaling** - Players can stumble into deadly encounters if exploring recklessly
- **Warning Signs** - NPCs provide warnings about dangerous areas; environmental clues
- **Retreat Option** - Players can flee difficult encounters and return better prepared
- **Dynamic Difficulty** - Strahd's tactics and resources adapt based on player strength and choices

**Accessibility Options:**

- **Adjustable Lethality** - Option for death to be less permanent (unconscious vs. permadeath)
- **Hint Availability** - Players can request hints from LLM-DM without penalty
- **Session Pacing** - No time pressure; players control exploration and engagement pace
- **Save Scumming** - Git version control allows reverting failed encounters (player choice)

### Economy and Resources

**Gold and Treasure:**

- **Currency** - Gold pieces (gp) as per D&D 5e standard
- **Treasure Sources** - Dungeon loot, quest rewards, selling items, NPC gifts
- **Purchasing** - Limited shops in villages (weapons, armor, supplies, spell components)
- **Economic Scarcity** - Barovia is resource-poor; items are expensive and rare

**Resource Management:**

- **Spell Slots** - Limited spell casting resources; recover on long rest
- **Hit Points** - Health resource; recover via healing, potions, rests
- **Consumables** - Potions, scrolls, ammunition, rations must be tracked and managed
- **Long Rest Restrictions** - Cannot rest in dangerous areas; requires safe locations
- **Time as Resource** - Resting advances calendar; may trigger events or miss opportunities

**Inventory Economy:**

- **Weight Limits** - Carrying capacity based on Strength score
- **Storage** - Can store items at safe locations (village inn, ally's house)
- **Item Durability** - Not tracked (D&D 5e standard); equipment doesn't degrade
- **Crafting** - Limited to potion-making, spell scroll creation (if proficient)

**Strategic Resources:**

- **Allies** - NPCs can be recruited to help in specific encounters
- **Information** - Knowledge gathered through exploration has strategic value
- **Faction Favors** - Limited-use benefits from helping factions
- **Sacred Artifacts** - Unique campaign items critical for defeating Strahd

---

## Level Design Framework

### Level Types

**Location Categories (Curse of Strahd):**

1. **Villages and Settlements**
   - Village of Barovia (starting location)
   - Vallaki (major hub town)
   - Krezk (mountain village)
   - Vistani camps (mobile settlements)
   - Safe havens with NPCs, shops, and quest givers

2. **Wilderness Locations**
   - Roads and paths connecting settlements
   - Tser Pool and Vistani encampment
   - Old Bonegrinder (windmill)
   - Ruins and abandoned structures
   - Random encounter areas

3. **Dungeons and Interior Locations**
   - Death House (introductory dungeon)
   - Abbey of Saint Markovia
   - Wizard of Wines winery
   - Amber Temple (high-level dungeon)
   - Various crypts and tombs

4. **Castle Ravenloft**
   - Massive multi-level dungeon (60+ rooms)
   - Home of Strahd von Zarovich
   - Final confrontation location
   - Multiple approaches and entry points

5. **Special Locations**
   - Vistana treasure reading location (divination scene)
   - Sacred artifact locations
   - Boss encounter arenas

**Design Characteristics:**

- **Handcrafted Content** - All locations from official Curse of Strahd module
- **Varied Scale** - Small rooms to massive castle complex
- **Environmental Storytelling** - Each location has history, secrets, and narrative purpose
- **Multiple Solutions** - Most locations offer combat, stealth, social, or magical approaches

### Level Progression

**Structure: Open-World Hub Design**

- **Non-Linear Exploration** - Players can visit most locations in any order after leaving Village of Barovia
- **Recommended Path** - NPCs provide guidance on suggested progression (Death House → Vallaki → gather artifacts → Castle Ravenloft)
- **Gating Mechanisms:**
  - **Level-Based** - Deadly encounters warn off low-level characters
  - **Quest-Based** - Some areas require information or items to access
  - **Social** - Faction relationships unlock certain locations
  - **Geographic** - Physical barriers (mountains, rivers) limit early access

**Progression Flow:**

1. **Prologue** - Mists pull character into Barovia
2. **Act 1: Discovery** - Village of Barovia, Death House, meet Ismark and Ireena
3. **Act 2: Exploration** - Open-world phase; visit towns, gather allies, find artifacts
4. **Act 3: Preparation** - Assemble resources and information for final confrontation
5. **Act 4: Climax** - Castle Ravenloft assault and battle with Strahd
6. **Epilogue** - Escape from Barovia or alternate ending

**Unlocking System:**

- **Story Unlocks** - Major locations revealed through NPC dialogue and quest information
- **Discovery Unlocks** - Finding hidden paths and secret locations through exploration
- **Artifact Quests** - Three legendary items (Sunsword, Holy Symbol, Tome) hidden across Barovia
- **Faction Access** - Gaining trust opens restricted areas

---

## Art and Audio Direction

### Art Style

**Visual Language: Text-Based Gothic Horror Descriptions**

Since this is a text-based game, "art style" refers to the descriptive language and imagery evoked through prose.

**Color Palette (Descriptive):**
- **Primary Colors** - Deep crimsons, shadowy blacks, foggy grays, sickly greens
- **Accent Colors** - Pale moonlight silver, golden candlelight, vibrant autumnal colors (contrast)
- **Mood** - Oppressive yet beautiful; colorful world drained of hope

**Aesthetic References:**
- Bram Stoker's Dracula (1992 film) - Gothic romanticism
- Castlevania series - Dark fantasy with ornate detail
- Official Curse of Strahd artwork - Eastern European medieval gothic
- Victorian gothic architecture and literature

**Descriptive Style:**
- **Sensory Rich** - Engage all senses (sight, sound, smell, touch, taste)
- **Atmospheric** - Focus on mood and emotion over mechanical detail
- **Contrasting** - Beauty amid decay, light against darkness, hope vs. despair
- **Detailed** - 150-300 word location descriptions with specific, evocative imagery
- **Consistent Tone** - Gothic horror throughout, varying intensity by location

**Key Visual Themes:**
- Crumbling grandeur (ornate but decaying)
- Nature reclaiming civilization
- Mist and fog obscuring vision
- Candlelight and shadow
- Eastern European medieval architecture
- Gothic religious imagery (corrupted)

### Audio and Music

**Audio Language: Text-Based Sound Descriptions**

Audio is conveyed through descriptive text integrated into narration.

**Sound Design (Descriptive):**

**Ambient Sounds:**
- Distant wolf howls echoing through mist
- Wind whistling through broken windows
- Creaking floorboards and groaning wood
- Dripping water in dungeons
- Thunder rumbling overhead
- Rustling leaves and snapping twigs

**Environmental Audio:**
- Crackling fireplaces
- Organ music drifting from Castle Ravenloft
- Village sounds (muffled conversations, closing shutters)
- Graveyard silence broken by distant bells
- Forest sounds (birds, insects, predators)

**Music Direction (Described in Text):**
- **Gothic Orchestral** - Sweeping strings and ominous brass
- **Melancholic Themes** - Sorrowful violin and piano
- **Horror Stings** - Sudden discordant notes for scares
- **Ambient Drones** - Low, unsettling background tones
- **Pipe Organ** - Associated with Strahd and Castle Ravenloft
- **Silence** - Strategic absence of sound for tension

**Audio Importance:**
- Medium-High importance to atmosphere
- Sound cues integrated into environmental descriptions
- Key moments emphasized with audio details
- Player can "hear" important events through descriptive text

**Implementation:**
- Audio descriptions embedded in location State.md files
- Dynamic sound based on time of day, weather, events
- NPC dialogue includes vocal descriptors (whispered, booming, trembling)

---

## Technical Specifications

### Performance Requirements

**Target Performance Metrics:**

- **Response Time** - LLM response within 2-10 seconds for narrative generation
- **File I/O Performance** - Location data loading < 1 second
- **Session Startup** - Full session initialization < 2 minutes
- **Memory Usage** - Minimal (text files only, no graphics rendering)
- **Storage Requirements** - ~100MB for complete Curse of Strahd implementation (text + PDFs)

**Optimization Priorities:**

- **Context Loading Efficiency** - Load only relevant location data to minimize LLM context size
- **File Structure** - Organized folder hierarchy for quick navigation
- **Caching** - Keep frequently accessed data (character sheet, current location) in memory
- **Lazy Loading** - Load location details only when visited or needed

**Acceptable Limits:**

- **LLM Latency** - Up to 10 seconds acceptable for complex narrative decisions
- **File Operations** - Batch updates to reduce I/O overhead
- **Session Length** - No technical limits; player can play as long as desired
- **Save/Load Times** - Git operations may take 5-10 seconds for large commits

### Platform-Specific Details

**Primary Platform: VS Code on Local File System**

**Windows:**
- File paths use backslashes (handled by cross-platform libraries)
- Git for Windows required for version control features
- PowerShell or Command Prompt for terminal commands
- Path length limits (260 characters) - mitigated by shallow folder structures

**macOS:**
- File paths use forward slashes
- Native Git support
- Terminal for command execution
- Case-sensitive file systems may cause issues (standardize file naming)

**Linux:**
- Full POSIX compatibility
- Native Git support
- Terminal-first workflow
- Ideal platform for text-based file operations

**VS Code Requirements:**

- **Version** - Latest stable VS Code (1.80+)
- **Extensions** - Claude Code extension for LLM integration
- **Settings** - Markdown preview, Git integration, terminal access
- **Workspace** - Project folder as VS Code workspace root

**LLM Integration:**

- **Primary** - Claude via Anthropic API or Claude Code extension
- **API Requirements** - API key, internet connection for cloud LLM
- **Local Model Support** - Future consideration for offline play
- **Context Window** - Requires models with 100k+ token context (Claude 3.5 Sonnet recommended)

**Git Version Control:**

- **Purpose** - Save states, world state snapshots, undo functionality
- **Repository Structure** - Campaign data in `.claude/RPG-engine/` directory
- **Commit Strategy** - Auto-commits after major events, manual commits for save points
- **Branch Usage** - Main branch for primary playthrough, branches for alternate timelines

### Asset Requirements

**Text Assets:**

**Location Content (~80,000-100,000 words total):**
- 30+ location Description.md files (150-300 words each)
- 50+ NPC personality/dialogue profiles (200-500 words each)
- Quest descriptions and objectives (15,000 words)
- Environmental flavor text (10,000 words)
- Lore documents (books, letters, journals - 15,000 words)

**D&D 5e Reference Materials (Already Owned):**
- Player's Handbook PDF (~300MB)
- Dungeon Master's Guide PDF (~90MB)
- Monster Manual PDF (~29MB)
- Curse of Strahd campaign book PDF (~multiple files, ~100MB total)
- Supplemental materials (maps, handouts, backgrounds)

**Structured Data Files:**

**Per-Location Data (30+ locations):**
- NPCs.md - NPC roster with stats and status (average 2-10 NPCs per location)
- Items.md - Available items and treasure (variable by location)
- Events.md - Scheduled events and triggers (0-5 events per location)
- State.md - Current location state (weather, time, changes)
- Connections.md - Travel connections and distances

**Global Data:**
- Character sheet template (markdown)
- Game calendar data structure (YAML/JSON)
- Quest log template
- World state tracking file
- Campaign timeline

**System Assets:**

- **Workflow Files** - VS Code slash commands for game sessions
- **Prompt Templates** - LLM system prompts for DM behavior
- **Dice Rolling Scripts** - Randomization utilities (optional automation)
- **Session Log Templates** - Structured session summary format

**Asset Pipeline:**

- **Content Creation** - Manual writing + LLM-assisted generation
- **Source Control** - All assets in Git repository
- **Editing** - Direct markdown editing in VS Code
- **Validation** - Manual review for consistency with D&D lore
- **Version Management** - Git branches for content iteration

**No Traditional Game Assets:**
- No graphics (sprites, textures, models)
- No audio files (music, SFX)
- No video/cutscenes
- No compiled binaries or executables

---

## Development Epics

### Epic Structure

The development is organized into 5 major epics, appropriate for a Level 3 game project:

**Epic 1: Core Engine & Location System (MVP Foundation)**
- **Goal:** Build the foundational folder-based world architecture and basic gameplay loop
- **Key Deliverables:**
  - Location folder structure with NPCs.md, Items.md, Events.md, State.md files
  - Location data loading and context injection for LLM
  - Basic location traversal and navigation
  - File I/O operations for world state persistence
  - 3-5 test locations (Village of Barovia, Death House, Tser Pool)
- **Success Criteria:** Can navigate between locations, interact with NPCs, and see world state persist across sessions
- **Estimated Stories:** 8-12

**Epic 2: Game Calendar & Dynamic World System**
- **Goal:** Implement time tracking, scheduled events, and world state evolution
- **Key Deliverables:**
  - Calendar data structure (YAML/JSON)
  - Time advancement mechanics (manual and automatic)
  - Event scheduling system with triggers
  - World state propagation (NPC deaths cascade to other locations)
  - Time-sensitive quest tracking
- **Success Criteria:** Calendar advances correctly, scheduled events trigger, NPC deaths affect related NPCs/quests
- **Estimated Stories:** 6-10

**Epic 3: D&D 5e Mechanics Integration**
- **Goal:** Implement core D&D 5e rules for character management and gameplay
- **Key Deliverables:**
  - Character sheet structure (markdown format)
  - Ability checks and saving throws
  - Combat system (initiative, attacks, damage, conditions)
  - Spell slot tracking and spell management
  - Inventory and equipment system
  - Experience and level progression
  - Long/short rest mechanics
- **Success Criteria:** Can create character, make skill checks, engage in combat, track resources, level up following D&D 5e RAW
- **Estimated Stories:** 10-15

**Epic 4: Curse of Strahd Content Implementation**
- **Goal:** Import and structure all Curse of Strahd campaign content
- **Key Deliverables:**
  - 30+ location folders populated with data
  - 50+ NPC profiles with stats, personalities, relationships
  - Quest database (main story + side quests)
  - Sacred artifact locations and mechanics (Sunsword, Holy Symbol, Tome)
  - Castle Ravenloft (60+ room mega-dungeon)
  - Strahd AI behavior and tactics
  - Campaign-specific events and encounters
- **Success Criteria:** Complete playthrough of Curse of Strahd possible from start to finish
- **Estimated Stories:** 12-18

**Epic 5: LLM-DM Integration & VS Code Workflows**
- **Goal:** Create seamless LLM-powered DM experience with VS Code workflows
- **Key Deliverables:**
  - VS Code slash commands for game sessions (/start-session, /end-session, etc.)
  - LLM system prompts for DM persona and behavior
  - Context loading optimization (minimize token usage)
  - Dice rolling integration (manual or automated)
  - Session logging and summary generation
  - Git integration for save/load functionality
  - Consistency validation prompts
  - Error handling and clarification systems
- **Success Criteria:** Smooth session flow, LLM generates consistent narrative, commands work reliably
- **Estimated Stories:** 8-12

**Total Estimated Stories:** 44-67 (within Level 3 range of 12-40+ stories)

**Epic Dependencies:**
- Epic 1 (Core Engine) must complete first - foundation for all others
- Epic 2 (Calendar) and Epic 3 (D&D Mechanics) can be developed in parallel
- Epic 4 (Content) depends on Epics 1-3 being mostly complete
- Epic 5 (LLM Integration) runs parallel to all epics, incrementally improving UX

**Development Phases:**
- **Phase 1 (Months 1-2):** Epic 1 MVP - Core engine and basic location system
- **Phase 2 (Months 2-4):** Epics 2 & 3 - Calendar and D&D mechanics
- **Phase 3 (Months 4-5):** Epic 4 - Curse of Strahd content import
- **Phase 4 (Ongoing):** Epic 5 - LLM integration polish and optimization

---

## Success Metrics

### Technical Metrics

**Performance Targets:**
- **LLM Response Time:** 95% of responses < 10 seconds
- **Session Startup Time:** < 2 minutes from command to playable
- **File I/O Performance:** Location loading < 1 second per location
- **System Stability:** Zero file corruption incidents
- **Save/Load Reliability:** 100% successful Git operations

**Development Milestones:**
- ✓ **Week 8:** MVP playable (Core Engine Epic complete)
- ✓ **Week 12:** Death House dungeon completable
- ✓ **Week 16:** Full Barovia map accessible
- ✓ **Week 20-24:** Curse of Strahd completable end-to-end

**Code Quality:**
- **Data Consistency:** < 5% contradictions per session (LLM consistency)
- **File Structure:** Standardized format across all locations
- **Documentation:** All major systems documented for future development
- **Version Control:** Clean Git history with meaningful commits

### Gameplay Metrics

**Engagement Metrics:**
- **Session Frequency:** 2+ sessions per week (sustainable engagement)
- **Session Duration:** Average 1-2 hours (target sweet spot)
- **Campaign Completion Rate:** 80%+ complete Curse of Strahd
- **Return Rate:** Resume gameplay within 7 days of last session

**Player Experience:**
- **Immersion Quality:** Player reports feeling "present" in Barovia
- **World Believability:** NPCs and locations feel consistent and alive
- **Narrative Satisfaction:** Story moments create emotional impact
- **Mechanical Clarity:** D&D 5e rules feel accurate and fair

**Content Coverage:**
- **Location Discovery:** Visit 25+ of 30+ available locations
- **NPC Interactions:** Meaningful dialogue with 30+ unique NPCs
- **Quest Completion:** Complete main storyline + 50% of side quests
- **Secret Discovery:** Find 60%+ of hidden lore and secrets

**Learning & Mastery:**
- **D&D Rules Proficiency:** Confident adjudication of 80% of situations without looking up rules
- **System Understanding:** Comfortable using all core mechanics (calendar, location system, etc.)
- **World Knowledge:** Deep understanding of Barovia lore and geography

**Replayability Indicators:**
- **Interest in Second Playthrough:** Desire to replay with different character/choices
- **Content Unexplored:** Recognition of missed locations/quests creating replay motivation
- **Campaign Expansion:** Interest in implementing additional D&D modules

**Quality of Life:**
- **Workflow Smoothness:** Minimal friction in session start/end/save processes
- **Error Recovery:** Ability to handle mistakes without breaking immersion
- **Flexibility:** Easy to pause mid-scene and resume later
- **Player Agency:** Feeling that choices matter and shape the story

---

## Out of Scope

**Explicitly NOT Included in This Version:**

**Multiplayer Features:**
- No co-op or multiplayer support
- No shared campaign worlds
- No DM + players mode (only solo play)
- No online connectivity beyond LLM API

**Visual/Audio Production:**
- No graphical interface or UI
- No artwork, sprites, or visual assets
- No audio files (music, SFX, voice acting)
- No animations or visual effects

**Alternative Campaigns (v1.0):**
- Curse of Strahd ONLY for initial release
- Other D&D modules (Tomb of Annihilation, etc.) deferred to future versions
- No homebrew campaign creation tools (yet)

**Advanced Automation:**
- No fully automated combat resolution (requires player input)
- No AI-driven NPC scheduling (events are pre-scripted)
- No procedural content generation (handcrafted locations only)
- No automatic encounter balancing beyond D&D 5e CR system

**Mobile/Web Platforms:**
- Desktop only (no mobile apps)
- No web browser version
- No cloud-based gameplay (local files only)

**Monetization:**
- No commercial release plans
- No in-app purchases or DLC
- Personal project only (not open-source initially)

**Complex Game Features:**
- No crafting system beyond basic D&D rules
- No base building or settlement management
- No companions with complex AI (NPCs are DM-controlled)
- No romance/relationship simulation mechanics

**Accessibility Features:**
- No screen reader optimization (text-only is inherently accessible, but no specific tooling)
- No multiple language support (English only)
- No colorblind modes (text-based, minimal issue)

---

## Assumptions and Dependencies

**Technical Assumptions:**

- **LLM Availability:** Assumes continued access to Claude API or equivalent LLM service
- **API Costs:** Assumes ~$20-50/month is acceptable for API usage
- **Internet Connectivity:** Requires internet for cloud LLM (local models not yet supported)
- **VS Code Compatibility:** Assumes VS Code remains stable and supports required extensions
- **Git Functionality:** Assumes Git works reliably for version control and save states

**Development Assumptions:**

- **Solo Developer Capacity:** Assumes 10-15 hours/week available for development
- **Learning Curve:** Assumes ability to learn prompt engineering and system design
- **Time to MVP:** Assumes 8 weeks is realistic for MVP completion
- **Content Import:** Assumes Curse of Strahd content can be efficiently structured into folder format

**Gameplay Assumptions:**

- **D&D 5e Knowledge:** Player has 3+ years experience with D&D 5e rules
- **Text Preference:** Player enjoys text-based gameplay over graphical games
- **Solo Play Satisfaction:** Player finds solo play engaging without social interaction
- **Session Flexibility:** Player benefits from flexible session lengths (15 min - 3 hours)

**External Dependencies:**

**Required:**
- Claude API or similar LLM service (Anthropic, OpenAI, etc.)
- VS Code (latest stable version)
- Git (for version control)
- Operating system (Windows, macOS, or Linux)

**Owned Assets:**
- D&D 5e Player's Handbook (PDF)
- D&D 5e Dungeon Master's Guide (PDF)
- D&D 5e Monster Manual (PDF)
- Curse of Strahd campaign book and materials (PDF)

**Optional but Helpful:**
- Claude Code extension for VS Code
- Markdown preview extensions
- Git GUI client (GitKraken, SourceTree, etc.)

**Risk Dependencies:**

- **LLM Consistency:** Depends on LLM maintaining narrative coherence across long sessions
- **API Pricing Stability:** Vulnerable to API price increases
- **License Compliance:** Assumes personal use of D&D materials is acceptable (fair use)
- **Technology Longevity:** Assumes VS Code and Git remain viable tools long-term

**Success Dependencies:**

- **Sustained Motivation:** Project success depends on maintaining personal interest over 6+ months
- **Quality Content:** Depends on ability to create/adapt engaging location descriptions and NPC personalities
- **Technical Execution:** Depends on successfully implementing complex file-based world state system
- **Playtesting Feedback:** Depends on personal playtesting to refine mechanics and UX
