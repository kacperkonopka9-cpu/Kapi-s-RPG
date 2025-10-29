# Game Brief: Kapi-s-RPG

**Date:** 2025-10-29
**Author:** Kapi
**Status:** Draft for GDD Development

---

## Executive Summary

Kapi-s-RPG is an LLM-powered text-based D&D 5e campaign platform designed for solo tabletop RPG play when time is limited. The system uses a folder-based persistent world architecture where each location becomes a living, evolving entity that remembers every interaction, character, and event. Players experience story-driven campaigns through VS Code workflows, with an AI Dungeon Master that maintains a dynamic game calendar and world state. The first campaign implements Curse of Strahd, leveraging the complete official D&D 5e materials to create an immersive gothic horror experience in Barovia.

**Target Audience:** Solo TTRPG players seeking deep, story-driven experiences without traditional scheduling constraints.

**Core Pillars:** Persistent world memory, narrative exploration, dynamic world evolution, authentic D&D 5e gameplay.

**Key Differentiator:** First truly persistent LLM-based D&D campaign tool with location-based world memory and temporal event tracking.

---

## Game Vision

### Core Concept

A persistent, LLM-powered D&D 5e campaign platform that transforms text-based solo play into a living world experience through folder-based location memory and dynamic calendar systems.

### Elevator Pitch

For tabletop RPG enthusiasts with limited gaming time, Kapi-s-RPG delivers authentic D&D 5e campaign experiences through an AI Dungeon Master that remembers everything—every NPC met, every location visited, every choice made. Unlike traditional virtual tabletops or chat-based AI games, this system creates a truly persistent world where locations evolve over time, events cascade through a living calendar, and you can return to any place you've visited to see how your actions changed it.

### Vision Statement

To create the most immersive solo D&D 5e experience possible by leveraging LLM technology not just for conversation, but for building a genuinely living, breathing campaign world that exists between sessions, evolves according to in-game time, and responds dynamically to player choices. Every location becomes a persistent entity, every NPC has continuity, and every action ripples through a coherent world timeline—delivering the depth and richness of an expert human Dungeon Master's campaign without the scheduling constraints.

---

## Target Market

### Primary Audience

**Demographics:**
- Age: 25-45
- Primarily working professionals
- Experienced TTRPG players (3+ years D&D experience)
- Time-constrained hobbyists

**Psychographics:**
- Love deep, story-driven RPG experiences
- Frustrated by scheduling challenges of traditional tabletop gaming
- Appreciate narrative complexity and world consistency
- Comfortable with text-based interfaces
- Value continuity and persistent world consequences
- Prefer exploration and discovery over mechanical optimization

**Gaming Preferences:**
- Story-driven campaigns over combat-focused dungeon crawls
- Rich NPC interactions and world-building
- Meaningful choices with lasting consequences
- Immersive settings with internal consistency
- Classic D&D 5e modules (Curse of Strahd, Tomb of Annihilation, etc.)

### Secondary Audience

**Dungeon Masters:**
- DMs looking for campaign planning tools
- Solo DMs who want to experience their own content from a player perspective
- World-builders testing narrative structures

**D&D Content Creators:**
- Streamers/YouTubers creating solo actual-play content
- Writers developing campaign material
- Module reviewers experiencing content systematically

### Market Context

**Market Opportunity:**
- Growing solo TTRPG market (30%+ growth in solo RPG products)
- Widespread adoption of LLM tools for gaming (ChatGPT D&D campaigns)
- Adult D&D players with disposable income but limited gaming time
- Post-pandemic shift toward flexible, async gaming experiences

**Market Timing:**
- LLM technology maturity enabling complex narrative tracking
- Established D&D 5e player base seeking new ways to play
- VS Code and development tools increasingly used for non-coding workflows
- Rising acceptance of AI as creative collaboration partner

**Competitive Landscape:**
- AI Dungeon: Limited D&D 5e integration, no persistent world structure
- Foundry VTT/Roll20: Require groups, scheduling challenges
- Solo RPG journaling games: Lack D&D 5e mechanical depth
- ChatGPT campaigns: No persistent world memory or calendar systems

---

## Game Fundamentals

### Core Gameplay Pillars

1. **Persistent World Memory**
   - Every location exists as a structured data folder
   - NPCs, items, events, and states preserved across sessions
   - Return to any location anytime and find coherent continuity
   - World changes persist and compound over time

2. **Narrative-Driven Exploration**
   - Story and discovery prioritized over combat mechanics
   - Rich location descriptions creating immersive environments
   - Meaningful NPC interactions with personality and memory
   - Environmental storytelling and hidden lore discovery

3. **Dynamic World Evolution**
   - Game calendar tracking in-world time passage
   - Scheduled events trigger automatically at specified times
   - Player actions cascade through the world (NPC deaths, building destruction)
   - Locations update dynamically based on world events

4. **Authentic D&D 5e Experience**
   - Full ruleset implementation from core books
   - Official campaign modules (starting with Curse of Strahd)
   - Character progression, inventory, spell management
   - Dice rolling, skill checks, and combat following RAW (Rules As Written)

### Primary Mechanics

**Location System:**
- Folder-based architecture: each location = one folder
- Structured data files: NPCs.md, Items.md, Events.md, State.md
- Location relationships (connections, travel times)
- Visit history and player memory notes

**Game Calendar:**
- Tracks in-game date/time
- Scheduled events with trigger conditions
- Time-sensitive quests and NPC schedules
- Seasonal/temporal world changes

**World State Management:**
- Dynamic entity updates (kill NPCs, destroy buildings)
- Consequence propagation across connected locations
- Event chains and cascading effects
- World state snapshots for major decisions

**Narrative Interaction:**
- Text-based dialogue with NPCs
- Environmental investigation and skill checks
- Choice-driven story branching
- Quest tracking and objective management

**D&D 5e Integration:**
- Character sheet management
- Spell slot and resource tracking
- Inventory and equipment systems
- Combat encounter resolution
- Level progression and advancement

### Player Experience Goals

**Immersion:**
- Feel transported into a colorful, living fantasy world
- Believe locations and NPCs exist beyond immediate interactions
- Experience authentic gothic horror atmosphere (Curse of Strahd)
- Discover environmental details that reward attention

**Discovery:**
- Uncover hidden lore and secrets through exploration
- Find meaningful connections between locations and events
- Experience "aha!" moments when patterns emerge
- Encounter surprising consequences of past actions

**Agency:**
- Make meaningful choices that shape the world
- See tangible results of decisions across time
- Feel empowered to explore at own pace
- Control narrative direction through roleplay

**Continuity:**
- Trust that world state remains consistent
- Return to locations and find logical evolution
- Build relationships with NPCs over time
- Experience coherent passage of in-game time

**Flexibility:**
- Play sessions of any length (15 minutes to 3 hours)
- Pause mid-scene and resume seamlessly
- No pressure from scheduling or other players
- Explore side content without derailing campaign

---

## Scope and Constraints

### Target Platforms

**Primary Platform:**
- VS Code (text-based workflow interface)
- Local file system (Windows/Mac/Linux)
- Command-line interaction via Claude Code

**Technical Environment:**
- Git repository for version control and world state tracking
- Markdown files for human-readable content
- YAML/JSON for structured data
- LLM integration (Claude via API or VS Code extension)

### Development Timeline

**Phase 1: Core Engine (MVP) - 6-8 weeks**
- Location folder architecture
- Basic game calendar system
- NPC and item data structures
- Simple world state updates
- Text-based interaction workflow

**Phase 2: Curse of Strahd Implementation - 8-12 weeks**
- Import Curse of Strahd content
- Build Barovia location folders
- Implement key NPCs and quests
- Create campaign-specific events
- Playtest and refine

**Phase 3: Advanced Features - 6-8 weeks**
- Dynamic event system
- Advanced world state propagation
- Combat encounter system
- Character progression tools
- DM toolkit for customization

**Phase 4: Polish & Expansion - Ongoing**
- Additional campaigns
- Quality of life features
- Community feedback integration
- Performance optimization

**Target Completion:**
- MVP: 2 months
- Playable Curse of Strahd: 4-5 months
- Feature-complete v1.0: 6 months

### Budget Considerations

**Development Costs:**
- Solo developer (personal project): $0 labor
- LLM API costs: ~$20-50/month (Claude API usage)
- Tools and software: Minimal (VS Code free, Git free)
- D&D materials: Already owned

**Ongoing Costs:**
- LLM API usage: Variable based on play frequency
- Storage: Negligible (text files)
- No hosting/server costs (local deployment)

**Total Budget:** <$500 annually (primarily API costs)

### Team Resources

**Team Size:** Solo developer/player (Kapi)

**Skills Required:**
- D&D 5e rules knowledge ✓
- VS Code proficiency ✓
- LLM prompt engineering (learning in progress)
- File system architecture design
- YAML/Markdown data structure design
- Basic scripting (optional for automation)

**Time Commitment:**
- Development: 10-15 hours/week
- Playtesting: 3-5 hours/week
- Documentation: 2-3 hours/week

**Skills Gaps:**
- Advanced prompt engineering for complex world state
- Automated event triggering systems
- Combat encounter balance algorithms

**Mitigation:**
- Learn through iteration and testing
- Leverage Claude Code for development assistance
- Start simple, add complexity gradually

### Technical Constraints

**Performance:**
- LLM response times (2-10 seconds typical)
- File I/O for large location databases
- Context window limits for long campaigns

**Storage:**
- Unlimited local storage (text files minimal size)
- Git repository size management (PDFs already in repo)

**LLM Limitations:**
- Context window size (must fit location data + conversation)
- Consistency across long sessions
- Hallucination risks for complex rule adjudication

**Platform Requirements:**
- VS Code compatible environment
- File system access
- LLM access (API or extension)

**Accessibility:**
- Text-only interface (no visual/audio output)
- Requires typing/reading proficiency
- Assumes D&D 5e rules familiarity

---

## Reference Framework

### Inspiration Games

1. **AI Dungeon (2019)**
   - Taking: LLM-powered narrative generation, freeform text interaction
   - NOT taking: Lack of structure, no persistent world state, poor D&D integration

2. **Baldur's Gate 3 (2023)**
   - Taking: Living world feel, consequence persistence, NPC memory and schedules
   - NOT taking: Visual/3D requirements, multiplayer complexity, real-time interaction

3. **Ironsworn (2018)**
   - Taking: Solo RPG design philosophy, oracle systems, journaling approach
   - NOT taking: Custom game system (using D&D 5e instead), abstract mechanics

4. **Dwarf Fortress (2006)**
   - Taking: Deep world simulation, emergent storytelling, history tracking
   - NOT taking: Visual complexity, fortress building mechanics, learning curve

5. **Curse of Strahd (2016 - TTRPG Module)**
   - Taking: Gothic horror atmosphere, location-based design, NPC-driven narrative
   - NOT taking: Need for human DM, group play assumptions

### Competitive Analysis

**Direct Competitors:**

| Product | Strengths | Weaknesses | Differentiation |
|---------|-----------|------------|-----------------|
| **ChatGPT D&D Sessions** | Free, accessible, conversational | No persistence, no world structure, forgets details | Kapi-s-RPG has structured persistence |
| **AI Dungeon** | Established user base, mobile apps | Paid tiers, limited D&D rules, generic fantasy | Official D&D 5e content, folder-based world |
| **Character.AI (DM bots)** | Free, easy to start | No world state, character limits, restarts | True campaign continuity |

**Indirect Competitors:**

| Product | Strengths | Weaknesses | Differentiation |
|---------|-----------|------------|-----------------|
| **Foundry VTT** | Full-featured VTT, modules | Requires group, scheduling, complexity | Solo-focused, async |
| **Solo RPG Journals** | No tech needed, creative | Manual tracking, no D&D integration | LLM automation, official content |
| **D&D Beyond** | Official tools, character builder | Not solo play, limited narrative tools | Full campaign management |

### Key Differentiators

1. **Persistent Location Architecture**
   - **Unique Value:** Only LLM-based D&D tool with true location memory
   - **Player Benefit:** Return to locations and find logical evolution, not regenerated content
   - **Technical Moat:** Folder-based design creates structured knowledge base for LLM

2. **Dynamic Game Calendar**
   - **Unique Value:** Time-based event system that runs independent of player actions
   - **Player Benefit:** World feels alive—NPCs have schedules, events trigger on dates
   - **Technical Moat:** Temporal event engine with cascading consequences

3. **Official D&D 5e Campaign Integration**
   - **Unique Value:** Complete Curse of Strahd implementation with all supplemental materials
   - **Player Benefit:** Professionally designed content, balanced encounters, rich lore
   - **Technical Moat:** Access to physical books and ability to structure data carefully

4. **Development Workflow Integration**
   - **Unique Value:** Built into VS Code for technical users
   - **Player Benefit:** Powerful text editing, Git version control, familiar interface
   - **Technical Moat:** Leverages developer tools for gaming—unique positioning

---

## Content Framework

### World and Setting

**Primary Setting:** Barovia (Curse of Strahd campaign)
- Gothic horror-fantasy realm trapped in mists
- Eastern European medieval aesthetic
- Isolated villages and wilderness locations
- Castle Ravenloft as central landmark
- Domain of Dread ruled by vampire lord Strahd von Zarovich

**Setting Characteristics:**
- Colorful yet oppressive (vibrant in contrast to darkness)
- Living world feel—NPCs have routines, villages evolve
- Exploration-focused with dense location design
- Mystery and horror atmosphere with tragic beauty

**World Scope:**
- 30+ distinct locations (villages, ruins, wilderness, castle)
- 50+ named NPCs with personalities and goals
- Multiple factions with conflicting interests
- Layered history spanning centuries

**Expandability:**
- Folder architecture supports additional campaigns
- Can run multiple campaigns in parallel
- Future modules: Tomb of Annihilation, Waterdeep Dragon Heist, etc.

### Narrative Approach

**Story Structure:**
- **Primary:** Story-driven with strong central narrative (defeat Strahd)
- **Secondary:** Player-directed exploration and side quests
- **Emergent:** Dynamic consequences creating unique story moments

**Narrative Delivery:**
- Environmental descriptions (location atmosphere, sensory details)
- NPC dialogue and personality-driven interactions
- Item descriptions and lore documents (letters, books, journals)
- Event narration for key moments and revelations

**Branching:**
- Location order highly flexible (open-world exploration)
- Multiple solutions to major challenges
- Faction relationships influence available paths
- Player choices create divergent campaign states

**Writing Scope:**
- Curse of Strahd base content: ~256 pages adapted
- Location descriptions: 30+ detailed writeups
- NPC dialogues: 50+ character personalities
- Quest text: 20+ major quests with variants
- Random encounters and flavor text

**Tone:**
- Gothic horror with moments of dark humor
- Tragic beauty and melancholic atmosphere
- Tension between hope and despair
- Respectful adaptation of classic horror tropes

### Content Volume

**Campaign Length:**
- Curse of Strahd: 30-50 gameplay hours (official estimate)
- Session flexibility: 15-minute to 3-hour sessions
- Replayability: High (different character builds, choices, exploration paths)

**Location Count:**
- Major locations: 15-20 (villages, castle, major dungeons)
- Minor locations: 15-25 (ruins, campsites, encounter areas)
- Random encounter areas: Variable

**NPC Count:**
- Major NPCs: 15-20 (quest givers, allies, antagonists)
- Minor NPCs: 30-40 (shopkeepers, villagers, flavor characters)
- Generic NPCs: Procedurally generated as needed

**Quest Content:**
- Main storyline quests: 8-12
- Side quests: 15-25
- Mini-quests and errands: 20+

**Asset Volume (Text-Based):**
- Location descriptions: ~30,000 words
- NPC dialogues: ~20,000 words
- Item descriptions: ~5,000 words
- Quest text: ~15,000 words
- Environmental flavor: ~10,000 words

**Total Content:** ~80,000-100,000 words structured content (equivalent to a novel)

---

## Art and Audio Direction

### Visual Style

**Text-Based Visual Language:**
- Rich, evocative prose descriptions
- Color-focused imagery ("vibrant crimson curtains against gray stone")
- Sensory details (sounds, smells, textures)
- Atmospheric mood-setting language

**Gothic Horror Aesthetic:**
- Contrasts: beauty and decay, light and shadow
- Eastern European medieval imagery
- Nature reclaiming civilization
- Ornate details amid crumbling grandeur

**Color Palette (Descriptive):**
- Primary: Deep reds, shadowy blacks, foggy grays
- Accent: Sickly greens, pale moonlight, golden candlelight
- Contrast: Vibrant nature colors against oppressive atmosphere

**Reference Imagery (for description inspiration):**
- Bram Stoker's Dracula (1992 film)
- Castlevania series
- Official Curse of Strahd artwork
- Victorian gothic architecture

### Audio Style

**Text-Based Audio Cues:**
- Sound descriptions integrated into location text
- "The distant howl of wolves echoes through the mist"
- "Creaking floorboards announce your presence"
- "Thunder rumbles ominously overhead"

**Atmospheric Sound Design (Descriptive):**
- Natural ambience: wind, rain, thunder, wildlife
- Environmental: creaking wood, dripping water, crackling fire
- Musical: organ music, violin strains, funeral dirges
- Horror: screams, growls, whispers, footsteps

**Music Direction (Described in Text):**
- Gothic orchestral themes
- Melancholic string arrangements
- Ominous pipe organ
- Silence as a tool for tension

### Production Approach

**Content Creation:**
- Adapt official Curse of Strahd text
- Enhance with original descriptive writing
- LLM-assisted description generation
- Manual curation and editing for quality

**Style Consistency:**
- Maintain gothic horror tone throughout
- Use consistent vocabulary for recurring elements
- Template-based location descriptions for efficiency
- Style guide for NPC voice and personality

**Asset Management:**
- Markdown files for all text content
- Structured templates for consistency
- Version control via Git
- Modular design for easy updates

**Tools:**
- VS Code for content editing
- LLM for description generation and variation
- Git for version control and content history
- Manual review for quality assurance

---

## Risk Assessment

### Key Risks

1. **LLM Consistency Over Long Campaigns**
   - **Risk:** LLM forgets details, contradicts established lore, loses narrative thread
   - **Impact:** Breaks immersion, frustrates player, ruins world continuity
   - **Likelihood:** High without mitigation

2. **Complexity Overwhelming Development**
   - **Risk:** Feature scope expands beyond solo developer capacity
   - **Impact:** Project never reaches playable state, burnout
   - **Likelihood:** Medium

3. **Engagement Sustainability**
   - **Risk:** Solo play loses engagement without social interaction
   - **Impact:** Player loses interest, project abandoned
   - **Likelihood:** Medium

4. **D&D 5e Rule Adjudication Accuracy**
   - **Risk:** LLM makes incorrect rule calls, unbalanced encounters
   - **Impact:** Frustration, unfair outcomes, loss of trust in system
   - **Likelihood:** Medium

### Technical Challenges

1. **Context Window Management**
   - **Challenge:** Fitting location data + conversation history in LLM context
   - **Complexity:** High
   - **Mitigation:** Summarization techniques, hierarchical context loading, chunking

2. **World State Synchronization**
   - **Challenge:** Keeping LLM aware of current world state across sessions
   - **Complexity:** High
   - **Mitigation:** Structured data formats, state loading protocols, validation checks

3. **Event Triggering System**
   - **Challenge:** Automatically detecting and triggering calendar-based events
   - **Complexity:** Medium-High
   - **Mitigation:** Start with manual triggers, automate incrementally, simple scheduling system

4. **File System Performance**
   - **Challenge:** Reading/writing many files during gameplay
   - **Complexity:** Low-Medium
   - **Mitigation:** Lazy loading, caching, optimized folder structures

5. **Combat Encounter Resolution**
   - **Challenge:** Balancing LLM narrative with D&D mechanics (initiative, attacks, damage)
   - **Complexity:** Medium
   - **Mitigation:** Structured combat templates, dice rolling integration, turn-by-turn tracking

### Market Risks

1. **Limited Audience Size**
   - **Risk:** Niche product (solo D&D + technical users + LLM comfort)
   - **Impact:** Low adoption beyond personal use
   - **Likelihood:** High
   - **Mitigation:** Personal project first, community sharing secondary

2. **LLM API Cost Escalation**
   - **Risk:** API pricing increases make play expensive
   - **Impact:** Financial barrier to sustained play
   - **Likelihood:** Low-Medium
   - **Mitigation:** Local model support, cost monitoring, efficient prompting

3. **D&D License Changes**
   - **Risk:** WotC restricts use of official content with AI tools
   - **Impact:** Cannot use official modules, must pivot to original content
   - **Likelihood:** Low
   - **Mitigation:** Personal use fair use, monitor policy changes, have homebrew backup

### Mitigation Strategies

**For LLM Consistency:**
1. Implement structured location data loading into every conversation
2. Use explicit state validation prompts ("Does this match established lore?")
3. Maintain campaign summary document updated regularly
4. Version control for reverting contradictions
5. Player journal system for tracking canonical events

**For Development Complexity:**
1. Start with absolute MVP (basic location folders + text interaction)
2. Incremental feature addition with playtest validation
3. Time-box development efforts (avoid perfectionism)
4. Accept "good enough" for v1.0
5. Leverage Claude Code for development assistance

**For Engagement:**
1. Play regularly (schedule personal sessions)
2. Set campaign milestones and celebrate progress
3. Share experiences in D&D/AI communities for motivation
4. Vary content (exploration, combat, roleplay) for diversity
5. Use streamer/content creator mindset (play for potential audience)

**For Rule Accuracy:**
1. Reference official rulebooks during play
2. Create rule summaries for common mechanics
3. Implement dice rolling for critical decisions
4. Accept "rule of cool" over perfect RAW
5. Post-session rule review for learning

---

## Success Criteria

### MVP Definition

**Minimum Playable Version Includes:**

1. **Core Location System**
   - Create and navigate between 3+ location folders
   - Persistent NPC data (name, personality, status)
   - Basic item tracking
   - Location state updates (visited, changed)

2. **Text Interaction Workflow**
   - Initiate game session via VS Code
   - LLM responds as DM with location descriptions
   - Player inputs actions and dialogue
   - System updates files based on outcomes

3. **Basic Calendar**
   - Track in-game date
   - Manual time advancement
   - Display current date/time

4. **Character Management**
   - Basic character sheet (class, level, HP, abilities)
   - Inventory tracking
   - Skill check resolution

5. **First Campaign Slice**
   - Village of Barovia (starting location)
   - 3-5 key NPCs (Ismark, Ireena, Bildrath, etc.)
   - Death House introductory dungeon
   - Basic quest tracking (escort Ireena)

**Success Criteria for MVP:**
- Complete 2-hour play session without breaking
- World state persists across 3+ sessions
- Return to location and find consistent state
- NPC interactions feel coherent and memorable

### Success Metrics

**Development Milestones:**
- ✓ MVP playable: 8 weeks from start
- ✓ Death House completable: 12 weeks
- ✓ Full Barovia map: 16 weeks
- ✓ Curse of Strahd completable: 24 weeks

**Quality Metrics:**
- LLM consistency: <5% contradictions per session
- Session startup time: <2 minutes
- Average response time: <10 seconds
- File corruption incidents: 0

**Engagement Metrics:**
- Sessions per week: 2+ (sustainable engagement)
- Average session length: 1-2 hours
- Campaign completion rate: 80%+ (finish Curse of Strahd)
- Replay interest: Create 2nd character within 6 months

**Learning Metrics:**
- D&D 5e rule mastery: Confident adjudication of 80% of situations
- LLM prompt engineering: Consistently generate quality responses
- World-building skills: Create original locations matching professional quality

### Launch Goals

**Personal Goals (Primary):**
- Play and complete Curse of Strahd campaign
- Develop functional tool for ongoing solo D&D play
- Build foundation for additional campaigns

**Community Goals (Secondary):**
- Share system in Claude/LLM gaming communities
- Receive positive feedback from 3-5 beta testers
- Inspire others to build similar tools

**Long-Term Vision (Aspirational):**
- Support 5+ official D&D campaigns
- Build community of solo D&D LLM players
- Contribute to "LLM as DM" best practices
- Potentially release as open-source framework

**Tangible Launch Targets:**
- Complete MVP: Month 2
- First full session: Month 3
- Curse of Strahd completion: Month 6-9
- Second campaign start: Month 12

---

## Next Steps

### Immediate Actions

1. **Design Location Folder Architecture**
   - Define folder structure (NPCs.md, Items.md, State.md, Events.md)
   - Create template files for consistency
   - Build first location (Village of Barovia) as proof of concept
   - Test with manual LLM interaction

2. **Create Game Calendar System**
   - Design calendar data structure (YAML or JSON)
   - Implement date/time tracking
   - Build simple event scheduling format
   - Test with manual time advancement

3. **Build Workflow Integration**
   - Create VS Code workflow for game sessions
   - Design session start/stop procedures
   - Implement file loading/saving automation
   - Test basic gameplay loop

4. **Import Curse of Strahd Content**
   - Extract location data from campaign book
   - Create NPC database
   - Map quest structure
   - Build item/treasure lists

5. **Develop LLM Prompting System**
   - Write DM system prompt
   - Create location context injection templates
   - Design state-update prompts
   - Test consistency across sessions

### Research Needs

1. **LLM Context Management**
   - Research best practices for long-form LLM conversations
   - Investigate summarization techniques
   - Study context window optimization
   - Test different prompt structures for consistency

2. **Existing Solo RPG Tools**
   - Analyze AI Dungeon architecture
   - Study Ironsworn oracle systems
   - Review RPG journaling best practices
   - Examine VTT data structures

3. **D&D 5e Digital Implementation**
   - Review D&D Beyond data models
   - Study Foundry VTT module structure
   - Research automated encounter balancing
   - Investigate dice rolling libraries

4. **Event System Design**
   - Research calendar-based game systems
   - Study dynamic world simulation architectures
   - Investigate graph database approaches for relationships
   - Examine quest dependency tracking systems

### Open Questions

**Technical Design:**
- What data format for location files? (Markdown frontmatter, YAML, JSON, hybrid?)
- How to handle combat encounters? (Full simulation vs. narrative resolution)
- Should calendar auto-advance or require player input?
- How to version control campaign state? (Git branches, snapshots, manual saves?)

**Gameplay Experience:**
- How much mechanical detail vs. narrative abstraction?
- Should there be random encounters or only scripted events?
- How to handle character death and resurrection?
- Multi-character campaigns or single character focus?

**Content Adaptation:**
- How closely to follow Curse of Strahd as written?
- How much original content to add?
- Should locations be pre-built or generated on first visit?
- How to handle random tables and DM improvisation?

**Scope Management:**
- Which features are truly MVP vs. nice-to-have?
- Should combat be included in MVP or added later?
- How much automation vs. manual tracking?
- When to start second campaign vs. polish first?

**Quality Standards:**
- What level of LLM consistency is "good enough"?
- How much manual editing of LLM responses?
- Should there be validation/error checking systems?
- How to balance development time vs. playing time?

---

## Appendices

### A. Research Summary

**Existing D&D 5e Materials Available:**
- Player's Handbook (core rules, character creation, spells)
- Dungeon Master's Guide (worldbuilding, magic items, rules)
- Monster Manual (creature stats and lore)
- Curse of Strahd campaign book (256 pages)
- Curse of Strahd supplemental materials (maps, handouts, backgrounds)
- Additional resources (Darker Gifts expansion, DM guides)

**LLM Technology Context:**
- Claude (Anthropic) provides strong narrative generation and consistency
- Context windows support extended conversations with world state
- Markdown/structured data can be injected for context
- Version control integration enables world state management

**Solo RPG Landscape:**
- Growing market for solo TTRPG tools and content
- Successful precedents: Ironsworn, Thousand Year Old Vampire, Mythic GME
- LLM adoption in gaming increasing rapidly
- Gap exists for structured, persistent LLM-based D&D campaigns

### B. Stakeholder Input

**Primary Stakeholder:** Kapi (developer and player)

**Motivation:**
- Love tabletop RPGs but limited time for traditional group play
- Want immersive, story-driven campaign experiences
- Interested in leveraging LLM technology for gaming
- Desire persistent world with lasting consequences

**Requirements:**
- VS Code workflow integration
- Folder-based location system with full persistence
- Dynamic game calendar with event tracking
- Authentic D&D 5e rules and content
- Colorful, immersive world descriptions
- Curse of Strahd as first campaign

**Constraints:**
- Solo development (time and skills)
- Personal use (no commercial goals)
- Text-based interface only
- Must work within LLM API budgets

### C. References

**D&D 5e Core Materials:**
- Wizards of the Coast. (2014). *Player's Handbook*. 5th Edition.
- Wizards of the Coast. (2014). *Dungeon Master's Guide*. 5th Edition.
- Wizards of the Coast. (2014). *Monster Manual*. 5th Edition.
- Wizards of the Coast. (2016). *Curse of Strahd*. Campaign Module.
- Wizards of the Coast. (2015). *Sword Coast Adventurer's Guide*.

**Solo RPG Design:**
- Shawn Tomkin. (2018). *Ironsworn*. Solo/Co-op RPG System.
- Tim Harford. (2018). *Thousand Year Old Vampire*. Solo Journaling RPG.
- Tomas Gimenez Rioja. (2020). *Mythic GME 2e*. GM Emulator System.

**LLM Gaming:**
- AI Dungeon (Latitude.io) - AI-powered text adventure platform
- ChatGPT D&D communities (Reddit r/AIDungeon, r/ChatGPT)
- LLM prompt engineering best practices for narrative consistency

**Technical References:**
- VS Code extension development documentation
- Git version control for game state management
- Markdown/YAML data structure best practices

---

_This Game Brief serves as the foundational input for Game Design Document (GDD) creation._

_Next Steps: Use the `gdd` workflow to create detailed game design documentation._
