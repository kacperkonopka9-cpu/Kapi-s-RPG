# Tarokka Reading System - DM Guide
**Epic 4 Story 4-16: Tarokka Reading System**

## Overview

The Tarokka Reading is the centerpiece event of Curse of Strahd, determining the locations of three legendary artifacts, the identity of the party's destined ally, and where the final confrontation with Strahd will occur. This system implements the official Curse of Strahd Tarokka reading using a 54-card deck with deterministic shuffle for save/load compatibility.

### System Components

- **Tarokka Deck**: 54 cards (14 High Deck major arcana + 40 Common Deck minor arcana)
- **TarokkaReader Module**: Handles deck shuffling, card drawing, and reading execution (`src/tarokka/tarokka-reader.js`)
- **Reading Configuration**: Maps cards to locations, NPCs, and tactical information (`game-data/tarokka/reading-config.yaml`)
- **Event Integration**: Triggered via Madam Eva at Tser Pool Encampment (`game-data/locations/tser-pool-encampment/Events.md`)
- **State Persistence**: Reading results saved to `game-data/state/tarokka-reading.yaml`

---

## How to Perform a Reading

### For DM (Manual Trigger)

1. **Navigate to Tser Pool Encampment**: Ensure players have met Madam Eva
2. **Execute Tarokka Event**: Use slash command `/tarokka` (Epic 5 implementation)
3. **TarokkaReader Executes**:
   - Shuffles deck using seeded RNG (use specific seed for predetermined results, or leave null for random)
   - Draws 5 cards in order: Tome → Holy Symbol → Sunsword → Ally → Enemy
   - Maps each card to game elements using `reading-config.yaml`
4. **Results Saved**: Full reading saved to `game-data/state/tarokka-reading.yaml`
5. **Artifacts Updated**: Item files updated with `currentLocationId` from reading
6. **Ally Marked**: Destined ally NPC marked with `destinedAlly: true` flag
7. **Narrate Reading**: Use Madam Eva's dialogue from `madam_eva.yaml` to narrate each card

### For LLM-DM (Epic 5 Integration)

When players trigger the reading event naturally through conversation:

1. **Context Loaded**: LLM-DM loads Madam Eva's Tarokka dialogue and TarokkaReader module
2. **Reading Executed**: Calls `TarokkaReader.performFullReading(seed)` via event system
3. **Narration**: LLM-DM narrates each card using:
   - Card name, suit, and visual description
   - Fortune-telling meaning (general, light, dark, advice)
   - Cryptic hints about location/ally (not direct names)
4. **State Update**: Results persisted to game state automatically
5. **Follow-Up**: LLM-DM can reference `tarokka-reading.yaml` throughout campaign

---

## The 5-Card Spread

### Card 1: Tome of Strahd (History)
**Purpose**: Reveals location of the Tome of Strahd
**Madam Eva's Words**: "This card tells of history. Knowledge of the ancient will help you better understand your enemy."

**Possible Locations** (10):
- Castle Ravenloft - Strahd's Study (K37)
- Castle Ravenloft - Crypt 4 (Strahd's Ancestors)
- Van Richten's Tower - Library
- Abbey of Saint Markovia - Library
- Amber Temple - Lich's Chamber
- Argynvostholt - Ruined Library
- Vallaki - Burgomaster's Mansion (Hidden Room)
- Village of Barovia - Mad Mary's House (Hidden)
- Wizard of Wines - Secret Cellar
- Berez - Baba Lysaga's Hut (Trophy)

### Card 2: Holy Symbol of Ravenkind (Protection)
**Purpose**: Reveals location of the Holy Symbol of Ravenkind
**Madam Eva's Words**: "This card tells of a powerful force for good and protection, a holy symbol of great hope."

**Possible Locations** (10):
- Krezk - Blessed Pool of St. Markovia
- Abbey of Saint Markovia - Main Hall
- Vallaki - Church of St. Andral (Hidden)
- Castle Ravenloft - Desecrated Chapel (K15)
- Argynvostholt - Tomb of Argynvost
- Village of Barovia - Church Altar
- Amber Temple - Amber Sarcophagus
- Van Richten's Tower - Hidden Reliquary
- Tser Pool - Madam Eva's Tent (Ironic twist)
- Werewolf Den - Desecrated Shrine

### Card 3: Sunsword (Power)
**Purpose**: Reveals location of the Sunsword
**Madam Eva's Words**: "This is a card of power and strength. It tells of a weapon of vengeance: a sword of sunlight."

**Possible Locations** (10):
- Castle Ravenloft - Treasury (K41) - Strahd's Trophy Room
- Castle Ravenloft - Tomb of Sergei (Crypt 21)
- Abbey of Saint Markovia - Main Hall
- Argynvostholt - Tomb of Argynvost
- Van Richten's Tower - Top Floor
- Amber Temple - Vault of Sorcery
- Wizard of Wines Winery - Wine Cellar
- Yester Hill - Gulthias Tree Summit
- Berez - Baba Lysaga's Hut
- Lake Zarovich - Sunken Treasure

### Card 4: The Destined Ally (Hope)
**Purpose**: Identifies the NPC who will aid the party
**Madam Eva's Words**: "This card sheds light on one who will help you greatly in the battle against darkness."

**Possible Allies** (14):
1. **Ireena Kolyana** - Tatyana reincarnated, angers Strahd (-2 to his attacks when threatened)
2. **Rudolph van Richten** - Legendary vampire hunter (+2 to attacks vs undead when fighting alongside party)
3. **Ezmerelda d'Avenir** - Van Richten's protégé, skilled monster hunter
4. **Davian Martikov** - Wereraven patriarch, intelligence network
5. **Sir Godfrey Gwilym** - Revenant knight seeking redemption
6. **Madam Eva** - Vistani seer (ironic - she helps but won't fight)
7. **Kasimir Velikov** - Dusk elf seeking to resurrect sister
8. **Mordenkainen** - Weakened archmage with memory loss
9. **Ismark Kolyanovich** - Ireena's brother, brave warrior
10. **Emil Toranescu** - Werewolf seeking to overthrow Kiril
11. **Pidlwick II** - Sentient toy, knows Castle Ravenloft
12. **Father Lucian Petrovich** - Village priest
13. **Clovin Belview** - Mongrelfolk seeking redemption
14. **Arrigal** - Vistani assassin (dubious ally, may betray)

### Card 5: The Enemy's Lair (Doom)
**Purpose**: Reveals where final battle with Strahd occurs
**Madam Eva's Words**: "Your enemy is a creature of darkness, whose powers are beyond mortality. This card will lead you to him."

**Possible Locations** (13 Castle Ravenloft rooms):
1. **Throne Room (K25)** - Strahd on his throne, command of entire castle
2. **Great Hall (K10)** - Grand confrontation, many tactical options
3. **Strahd's Study (K37)** - Surrounded by his knowledge and power
4. **Crypt 4 (K84)** - Among his ancestors' tombs
5. **Tower of Strahd (K20)** - Spiral staircase battle
6. **Dungeon (K73)** - Trapped and surrounded by prisoners
7. **Chapel (K15)** - Desecrated holy ground
8. **Audience Hall (K25)** - Formal setting for final judgment
9. **Larder (K67)** - Among his victims
10. **Halls of Bones (K67)** - Surrounded by death
11. **Tower Summit (K59)** - Exposed, dramatic height
12. **Overlook (K6)** - Precarious ledge above chasm
13. **Heart of Sorrow (K20)** - Near the crystal heart powering castle

---

## The Tarokka Deck

### High Deck (14 Major Arcana Cards)

#### 1. The Master
**Suit**: High Deck | **Rank**: 1 | **Category**: Major

**Visual**: A dark figure stands atop a mountain, commanding the forces below. Vampire lord in black robes on castle parapet.

**Fortune-Telling**:
- **General**: One who seeks to rule over all
- **Light**: Leadership, responsibility, taking charge of destiny
- **Dark**: Tyranny, oppression, desire for absolute control
- **Advice**: Recognize true power lies in wisdom, not domination

**Significance**: Often indicates Strahd's influence or a powerful authority figure. Card of ultimate power and dominance.

---

#### 2. The Marionette
**Suit**: High Deck | **Rank**: 2 | **Category**: Major

**Visual**: A puppet dangling from strings, dancing to an unseen master's will.

**Fortune-Telling**:
- **General**: One controlled by forces beyond their understanding
- **Light**: Recognizing manipulation allows you to break free
- **Dark**: Helplessness, being a pawn in another's game
- **Advice**: Cut the strings and reclaim your agency

**Significance**: Represents manipulation, control, and loss of free will. May indicate NPCs under Strahd's influence.

---

#### 3. The Mists
**Suit**: High Deck | **Rank**: 3 | **Category**: Major

**Visual**: Swirling fog obscuring the path ahead, shapes moving within.

**Fortune-Telling**:
- **General**: Mystery, the unknown, hidden truths
- **Light**: Trust your instincts through uncertainty
- **Dark**: Lost in confusion, unable to see clearly
- **Advice**: Not all that is hidden is dangerous; some things are meant to remain unknown

**Significance**: The barrier around Barovia. Represents mystery, entrapment, and the Dark Powers.

---

#### 4. The Executioner
**Suit**: High Deck | **Rank**: 4 | **Category**: Major

**Visual**: Hooded figure with an axe, ready to deliver final judgment.

**Fortune-Telling**:
- **General**: Justice, finality, the end of a cycle
- **Light**: Necessary endings make way for new beginnings
- **Dark**: Harsh judgment, merciless consequences
- **Advice**: Some debts must be paid, some fates cannot be avoided

**Significance**: Represents death, judgment, and the consequences of actions.

---

#### 5. The Broken One
**Suit**: High Deck | **Rank**: 5 | **Category**: Major

**Visual**: A shattered mirror reflecting fragmented images of a person.

**Fortune-Telling**:
- **General**: Trauma, brokenness, loss of self
- **Light**: Healing is possible, even from deep wounds
- **Dark**: Despair, inability to recover from tragedy
- **Advice**: You are more than your pain

**Significance**: Represents characters broken by Barovia's horrors. Often points to tragic NPCs.

---

#### 6. The Tempter
**Suit**: High Deck | **Rank**: 6 | **Category**: Major

**Visual**: Charismatic figure offering a golden chalice, shadows behind them.

**Fortune-Telling**:
- **General**: Temptation, false promises, dangerous bargains
- **Light**: Resist temptation and maintain integrity
- **Dark**: Corruption, selling your soul for power
- **Advice**: Not all gifts are blessings; some come with hidden costs

**Significance**: The Dark Powers offering forbidden knowledge. Represents moral tests.

---

#### 7. The Beast
**Suit**: High Deck | **Rank**: 7 | **Category**: Major

**Visual**: Snarling wolf-like creature, eyes glowing with hunger.

**Fortune-Telling**:
- **General**: Primal rage, loss of humanity, savage instinct
- **Light**: Channel your inner strength and ferocity
- **Dark**: Giving in to base instincts, becoming monstrous
- **Advice**: Control the beast within, or it will control you

**Significance**: Lycanthropy, loss of control. May indicate werewolves or berserker rage.

---

#### 8. The Darklord
**Suit**: High Deck | **Rank**: 8 | **Category**: Major

**Visual**: Strahd himself, seated on throne, eyes burning with unholy fire.

**Fortune-Telling**:
- **General**: The ultimate villain, absolute evil, dark royalty
- **Light**: Even tyrants have weaknesses
- **Dark**: Overwhelming power, hopeless odds
- **Advice**: To defeat darkness, you must first understand it

**Significance**: Strahd von Zarovich himself. The central antagonist.

---

#### 9. The Donjon
**Suit**: High Deck | **Rank**: 9 | **Category**: Major

**Visual**: Iron cage suspended in darkness, a prisoner within.

**Fortune-Telling**:
- **General**: Imprisonment, isolation, confinement
- **Light**: Even in darkest captivity, hope remains
- **Dark**: Trapped with no escape, forgotten by the world
- **Advice**: Sometimes the greatest prison is the one we build for ourselves

**Significance**: Barovia itself as a prison. May indicate trapped souls or literal dungeons.

---

#### 10. The Raven
**Suit**: High Deck | **Rank**: 10 | **Category**: Major

**Visual**: Black raven perched on gravestone, eyes intelligent and watchful.

**Fortune-Telling**:
- **General**: Guidance, wisdom, messengers of fate
- **Light**: Unexpected allies in dark places
- **Dark**: Omens of death, harbingers of doom
- **Advice**: Pay attention to signs and messengers

**Significance**: The Keepers of the Feather (wereravens). Represents hidden allies.

---

#### 11. The Innocent
**Suit**: High Deck | **Rank**: 11 | **Category**: Major

**Visual**: Young child holding flower, surrounded by darkness but untouched.

**Fortune-Telling**:
- **General**: Purity, hope, vulnerability
- **Light**: Innocence preserved despite corruption
- **Dark**: Innocence lost, childhood stolen
- **Advice**: Protect what is pure in this world

**Significance**: Ireena/Tatyana. Represents the innocent victims of Barovia.

---

#### 12. The Seer
**Suit**: High Deck | **Rank**: 12 | **Category**: Major

**Visual**: Veiled figure gazing into crystal ball, seeing all timelines.

**Fortune-Telling**:
- **General**: Prophecy, knowledge of future, hidden truths revealed
- **Light**: Foresight allows preparation
- **Dark**: Knowing the future but being powerless to change it
- **Advice**: Not all futures are fixed; choice still matters

**Significance**: Madam Eva herself. Represents divination and prophecy.

---

#### 13. The Ghost
**Suit**: High Deck | **Rank**: 13 | **Category**: Major

**Visual**: Translucent specter reaching out, chained to mortal plane.

**Fortune-Telling**:
- **General**: The past haunting the present, unfinished business
- **Light**: Remember the past to avoid repeating it
- **Dark**: Unable to move forward, trapped by history
- **Advice**: Let go of what cannot be changed

**Significance**: Barovia's tragic history. May indicate restless dead or haunted locations.

---

#### 14. The Horseman
**Suit**: High Deck | **Rank**: 14 | **Category**: Major

**Visual**: Headless rider on black steed, flames trailing behind.

**Fortune-Telling**:
- **General**: Relentless pursuit, unstoppable force
- **Light**: Determination and persistence will see you through
- **Dark**: Being hunted, no escape from fate
- **Advice**: Some things cannot be outrun, only faced

**Significance**: Death itself. The inevitability of mortality.

---

### Common Deck - Swords (10 Minor Arcana)

#### One of Swords through Ten of Swords
**Suit Theme**: Conflict, struggle, pain, combat

- **One**: Beginning of conflict
- **Two**: Difficult choice, painful decision
- **Three**: Betrayal, heartbreak
- **Four**: Rest after struggle, temporary peace
- **Five**: Defeat, loss, humiliation
- **Six**: Moving on, leaving pain behind
- **Seven**: Deception, trickery
- **Eight**: Restriction, feeling trapped
- **Nine**: Anxiety, worry, nightmares
- **Ten**: Ruin, ending, rock bottom

---

### Common Deck - Coins (10 Minor Arcana)

#### One of Coins through Ten of Coins
**Suit Theme**: Material wealth, practicality, the physical world

- **One**: New opportunity, financial beginning
- **Two**: Balance, adaptability, juggling priorities
- **Three**: Collaboration, teamwork, skill
- **Four**: Hoarding, greed, control
- **Five**: Poverty, hardship, loss
- **Six**: Generosity, charity, sharing
- **Seven**: Investment, patience, slow progress
- **Eight**: Craftsmanship, skill development
- **Nine**: Luxury, self-sufficiency, reward
- **Ten**: Wealth, family legacy, inheritance

---

### Common Deck - Glyphs (10 Minor Arcana)

#### One of Glyphs through Ten of Glyphs
**Suit Theme**: Magic, intellect, elemental forces

- **One**: Raw magical power, potential
- **Two**: Duality, balance of forces
- **Three**: Creative collaboration, group ritual
- **Four**: Stagnation, reluctance to change
- **Five**: Conflict, destructive magic
- **Six**: Victory through knowledge
- **Seven**: Strategic planning, magical preparation
- **Eight**: Rapid action, swift magic
- **Nine**: Defensive magic, protection
- **Ten**: Overwhelming magical force

---

### Common Deck - Stars (10 Minor Arcana)

#### One of Stars through Ten of Stars
**Suit Theme**: Emotion, relationships, intuition, love

- **One**: New love, emotional beginning
- **Two**: Partnership, unity, connection
- **Three**: Celebration, friendship, joy
- **Four**: Apathy, boredom, contemplation
- **Five**: Loss, grief, sorrow
- **Six**: Nostalgia, memories, past happiness
- **Seven**: Fantasy, illusion, wishful thinking
- **Eight**: Walking away, abandonment
- **Nine**: Emotional fulfillment, contentment
- **Ten**: Happy ending, family, emotional completion

---

## Example Readings

### Example 1: The Doomed Hero

**Seed**: 42001
**Cards Drawn**:
1. **Tome**: High Deck - The Darklord → Castle Ravenloft Study (K37)
2. **Holy Symbol**: Three of Glyphs → Abbey of Saint Markovia Main Hall
3. **Sunsword**: Swords - Ten → Lake Zarovich Underwater (Sunken Treasure)
4. **Ally**: High Deck - The Broken One → Mordenkainen (weakened archmage)
5. **Enemy**: High Deck - The Master → Throne Room (K25)

**Interpretation**:
*A challenging reading. The Tome lies in Strahd's own study - bold heroes must steal his own words from under his nose. The Holy Symbol rests in the Abbey, where madness and good intentions have become twisted. The Sunsword, weapon of light, ironically lies beneath dark waters - heroes must dive deep to claim it. The ally is broken, a once-mighty wizard now shattered by Barovia - they must rebuild him. The final battle occurs on Strahd's throne, where his power is greatest. This is a reading of extreme difficulty, testing the heroes' courage at every turn.*

**DM Notes**: This is a hard-mode reading. Strahd's Study requires infiltrating the castle early. The Abbey involves dealing with the Abbot's madness. Lake Zarovich underwater retrieval is dangerous (water zombies, drowning). Mordenkainen needs rehabilitation before being useful. Final battle in Throne Room gives Strahd maximum tactical advantage.

---

### Example 2: The Merciful Path

**Seed**: 88888
**Cards Drawn**:
1. **Tome**: Stars - Six → Village of Barovia - Mad Mary's House
2. **Holy Symbol**: High Deck - The Innocent → Krezk - Blessed Pool
3. **Sunsword**: High Deck - The Raven → Argynvostholt - Tomb of Argynvost
4. **Ally**: Stars - Ten → Ireena Kolyana (Tatyana reborn)
5. **Enemy**: Glyphs - Seven → Castle Ravenloft - Chapel (K15)

**Interpretation**:
*A reading of hope and redemption. The Tome hides in Mad Mary's house - grief guards knowledge. The Holy Symbol lies in blessed waters, pure and untainted. The Sunsword rests with a fallen dragon, waiting for worthy heroes. Your ally is innocence itself, the object of Strahd's obsession - her presence will provoke him. The final battle occurs in a desecrated chapel - a fitting place to reclaim what was corrupted.*

**DM Notes**: This is a story-rich reading. Mad Mary's house ties to Gertruda's disappearance. Blessed Pool is accessible early. Argynvostholt requires helping Sir Godfrey and the revenants. Ireena as ally creates dramatic tension (Strahd won't kill her). Chapel battle is thematically appropriate (reclaiming holy ground).

---

### Example 3: The Tactical Reading

**Seed**: 12345
**Cards Drawn**:
1. **Tome**: Coins - Eight → Van Richten's Tower - Library
2. **Holy Symbol**: Swords - Four → Vallaki - Church of St. Andral
3. **Sunsword**: High Deck - The Ghost → Castle Ravenloft - Tomb of Sergei (Crypt 21)
4. **Ally**: Coins - Six → Rudolph van Richten (legendary vampire hunter)
5. **Enemy**: Coins - Two → Castle Ravenloft - Overlook (K6)

**Interpretation**:
*A reading favoring preparation and skill. The Tome lies in the tower of a legendary hunter - knowledge awaits the clever. The Holy Symbol hides in Vallaki's church, waiting to be reclaimed. The Sunsword rests with the ghost of Sergei, Strahd's murdered brother - poetic justice. Your ally is the greatest vampire hunter alive, a master of his craft. Face Strahd on the castle overlook, where terrain can be used tactically.*

**DM Notes**: This is an optimal reading for strategic players. Van Richten's Tower is mid-campaign content. Vallaki church ties to St. Andral's Feast quest. Sergei's tomb requires accessing Castle Ravenloft crypts. Van Richten is the strongest ally mechanically. Overlook battle allows environmental tactics (ledges, falling damage).

---

## DM Tools & Guidance

### Predetermined Readings (Seeded RNG)

If you want a specific reading outcome:

1. **Test Seeds First**: Run `TarokkaReader.performFullReading(seed)` with different seeds offline
2. **Find Desired Outcome**: Identify seed that produces your preferred artifact/ally/location combo
3. **Use Seed in Game**: When triggering reading event, specify that seed
4. **Record Seed**: Save seed in `tarokka-reading.yaml` for reproducibility

**Example Seeds for Common Scenarios**:
- **Hard Mode** (all artifacts in dangerous locations): Try seeds 10000-20000
- **Story Rich** (ally is Ireena, final battle in meaningful location): Try seeds 50000-60000
- **Balanced** (mix of easy and hard artifact locations): Try seeds 30000-40000

### Adjusting Reading Results

If the random reading produces an undesirable combination:

**Option 1**: Use fallback mappings (predetermined defaults in `reading-config.yaml`)

**Option 2**: Manually edit `tarokka-reading.yaml` after generation:
```yaml
cards:
  sunsword:
    location:
      locationId: "your-preferred-location"
      locationName: "Your Preferred Location Name"
      description: "Custom description"
```

**Option 3**: Re-run reading with new seed until satisfied

### Madam Eva Roleplay Tips

**Voice & Mannerisms**:
- Speak slowly with dramatic pauses
- Use heavy accent and archaic language
- Constantly touch/shuffle Tarokka deck
- Gaze into distance as if seeing beyond present

**Card Reveal Technique**:
1. **Build Tension**: Shuffle deck slowly, let players watch
2. **Draw Card**: Dramatic pause before revealing
3. **Describe Visual**: Paint vivid picture of card imagery
4. **Recite Fortune**: Use card's fortune-telling text (general, light, dark, advice)
5. **Hint at Meaning**: Cryptic clues, never direct location names
6. **Gauge Reaction**: Watch players' faces, adjust narration

**Example Narration**:
> *Madam Eva's weathered hands shuffle the ancient Tarokka deck, cards worn smooth by centuries of readings. She closes her eyes, murmuring in a language you don't recognize. Then, with a sharp motion, she draws the first card and places it face-up on the table.*
>
> *"Ah," she breathes, "The Darklord. This card tells of history... but see how he sits upon his throne of lies? Your enemy guards his secrets jealously, child. Seek the Tome where the devil himself dwells, surrounded by his stolen knowledge. In the room where he plots and schemes, there you will find his confessions written in blood."*
>
> *She does not tell you it's his study. She lets the card speak in riddles. That is the Vistani way.*

### Integration with Campaign Pacing

**When to Perform Reading**:
- **Session 2-3**: After players explore Village of Barovia and meet Ireena
- **Too Early**: Players won't understand significance
- **Too Late**: Players may stumble on artifacts randomly, diminishing prophecy

**Post-Reading Campaign Structure**:
1. **Immediate Goals**: Pursue nearest artifact based on reading
2. **Mid-Campaign**: Seek ally, explore locations, gather strength
3. **Late Campaign**: Obtain all three artifacts, prepare for final battle
4. **Climax**: Confront Strahd at prophesied location

**Adjusting for Party Level**:
- **Levels 3-5**: Reveal easier artifacts first (Tome in Van Richten's Tower, Holy Symbol in Vallaki)
- **Levels 6-8**: Mid-difficulty (Sunsword in Argynvostholt, ally joining)
- **Levels 9-10**: Final battle preparation, assault on Castle Ravenloft

### Strahd's Reaction to Reading

Strahd becomes aware when Tarokka reading is performed (via spies, scrying, or Arrigal's report):

**Immediate Response** (within 1-2 days):
- Visit party's location for social encounter
- Comment cryptically on reading: *"So, the old woman has shown you the cards. Do you truly believe you can defy fate?"*
- Assess party's capabilities and personalities

**Short-Term Tactics** (next week):
- Move artifacts if possible (Tome from study to more secure location)
- Set traps at artifact locations
- Send minions to guard revealed locations
- Target revealed ally (kill or capture)

**Long-Term Strategy**:
- Use knowledge of prophesied final battle location to prepare (traps, minions, lair actions)
- Attempt to corrupt or kill destined ally
- Psychological warfare: *"The cards have spoken, yes... but they speak of your doom, not mine."*

---

## Epic 5 LLM-DM Integration Notes

### Context Loading for Reading

When LLM-DM performs Tarokka reading:

**Required Context**:
1. `game-data/tarokka/tarokka-deck.yaml` - Full deck for card descriptions
2. `game-data/tarokka/reading-config.yaml` - Mappings for interpreting cards
3. `game-data/npcs/madam_eva.yaml` - Dialogue and narration text
4. `game-data/locations/tser-pool-encampment/Events.md` - Event trigger conditions

**Execution Flow**:
1. Player meets Madam Eva and accepts reading
2. LLM-DM loads Tarokka context
3. Calls `TarokkaReader.performFullReading()` (seed = null for random)
4. Receives 5-card reading result
5. Narrates each card using Madam Eva's voice:
   - Visual description of card
   - Fortune-telling meaning (light, dark, advice)
   - Cryptic hint about location/ally (NOT direct name)
6. Saves reading to `game-data/state/tarokka-reading.yaml`
7. Updates artifact items and ally NPC

**Narration Guidelines for LLM-DM**:
- **Never say direct location names**: "Castle Ravenloft Study" becomes "Where the devil plots his schemes"
- **Use card imagery**: Connect fortune-telling to Barovia context
- **Maintain mystery**: Players should deduce locations from clues
- **Roleplay Madam Eva**: Cryptic, dramatic, wise but unhelpful with specifics

### Referencing Reading Throughout Campaign

Once reading is performed, LLM-DM can reference `tarokka-reading.yaml`:

**When to Reference**:
- Player asks Madam Eva for clarification: Repeat card meanings, don't give new info
- Player arrives at revealed location: Check if artifact is here, narrate discovery
- Ally appears: Trigger "destined ally" recognition moment
- Final battle: Set scene at prophesied Castle Ravenloft location

**Dynamic Storytelling**:
- LLM-DM adjusts narration based on which artifact is where
- Example: If Sunsword is in Lake Zarovich, emphasize water themes when players visit
- Example: If ally is Ezmerelda, plant foreshadowing when she's mentioned

### Future Enhancements (Epic 5+)

**Planned Features**:
- `/tarokka-clarify` command: Madam Eva provides cryptic hint if players stuck
- `/tarokka-override` command: DM manually sets reading results
- `/tarokka-reveal` command: Show players actual locations (breaks mystery, use sparingly)
- LLM-DM auto-hints: If players spend 3+ sessions without pursuing reading, subtle guidance
- Visual card display: Render card images in chat (requires asset creation)

---

## Troubleshooting

### Reading Produces Duplicate Locations

**Issue**: Same location revealed for multiple artifacts
**Cause**: Random chance (e.g., both Tome and Holy Symbol in Abbey)
**Solution**: Re-run reading with new seed, or manually adjust one location in `tarokka-reading.yaml`

### Ally Isn't Available Yet

**Issue**: Reading reveals Ezmerelda, but she doesn't appear until Van Richten's Tower
**Cause**: Expected behavior - ally joins when players reach their location
**Solution**: Use `whenTheyAppear` field in reading result to know when ally joins

### Players Bypass Tarokka Reading

**Issue**: Players go straight to Castle Ravenloft without visiting Tser Pool
**Cause**: Sandbox nature of campaign
**Solution**:
- Strahd sends invitation forcing Tser Pool visit
- Vistani intercept party on road, bring to Madam Eva
- Emphasize reading is necessary (artifacts are hidden, reading reveals)

### Artifact Location Too Difficult

**Issue**: Tome revealed in Strahd's Study, party is level 3
**Cause**: Random draw placed artifact in high-level location
**Solution**:
- Adjust other revealed locations to compensate (easier Sunsword location)
- Foreshadow artifact location, let players attempt early (they'll retreat and return later)
- Use fallback location for that artifact (edit reading or re-roll)

---

## Frequently Asked Questions

**Q: Can players redo the Tarokka reading if they don't like results?**
A: No. Reading is one-time event. Madam Eva will refuse: *"The cards have spoken. To draw again would be to spit in the face of fate itself."*

**Q: What if players lose the reading results (paper notes destroyed)?**
A: Madam Eva can repeat the card names and meanings, but won't do another full reading. Players must remember from first telling (check `tarokka-reading.yaml` out of character).

**Q: Can Strahd know what the reading revealed?**
A: Yes, via spies (Arrigal, bat familiars) or scrying. He won't move artifacts if they're already in Castle Ravenloft, but may trap them or move others.

**Q: What if reading reveals ally is already dead?**
A: This shouldn't happen if you follow story order. If Van Richten dies before reading, re-roll or use fallback ally. Reading assumes all NPCs are alive at time of reading.

**Q: How cryptic should Madam Eva be?**
A: Cryptic enough players must think, but not so obscure they're lost. Example: "In the place where saints once prayed" = chapel/church (deducible), NOT "Where the seventh star fell" = ???

**Q: Can players attack Madam Eva during/after reading?**
A: They can try. She uses Portent to ensure attacks miss, then Dimension Doors away. Vistani become hostile. Strahd punishes party for harming "his" Vistani. Bad idea.

---

## Appendix: Quick Reference Tables

### Artifact Location Summary

| Artifact | Possible Locations (10 each) | Difficulty Range |
|----------|----------------------------|------------------|
| **Tome** | Study, Crypts, Libraries, Hidden Rooms | Easy-Hard |
| **Holy Symbol** | Churches, Pools, Abbeys, Shrines | Easy-Hard |
| **Sunsword** | Tombs, Towers, Vaults, Trees | Medium-Hard |

### Ally Power Ranking

| Ally | Combat Power | Utility | Availability | Overall |
|------|-------------|---------|--------------|---------|
| Van Richten | High | High | Mid-Late | Best |
| Ezmerelda | High | Medium | Mid-Late | Excellent |
| Mordenkainen | Very High* | Very High* | Late | Excellent* |
| Ireena | Low | High (Bait) | Early | Good |
| Kasimir | Medium | High | Mid | Good |
| Others | Low-Medium | Low-Medium | Varies | Situational |

*If rehabilitated; otherwise useless

### Final Battle Location Tactics

| Location | Difficulty | Strahd Advantage | Party Advantage |
|----------|-----------|------------------|-----------------|
| Throne Room (K25) | Very Hard | All minions nearby, commanding position | None - worst location |
| Chapel (K15) | Medium | Desecrated ground | Thematic (reclaim holy ground) |
| Overlook (K6) | Medium | Height, familiar terrain | Environmental hazards can hurt Strahd |
| Crypt (K84) | Hard | Ancestor spirits, coffin nearby | Limited minion support |
| Study (K37) | Medium | Teleportation circle, traps | Can destroy his notes/research |

---

**Last Updated**: 2025-11-16
**Version**: 1.0.0
**Compatible With**: Epic 4 Tarokka Reading System (Story 4-16), Epic 5 LLM-DM Integration

*"The cards reveal much, but understanding comes only to those who dare to look."* - Madam Eva
