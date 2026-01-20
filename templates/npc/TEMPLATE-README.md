# NPC Profile Template - Usage Guide

**Version:** 1.0.0
**Compatible With:** Epic 3 CharacterManager (Story 3-2)
**Created:** 2025-11-10
**For:** Epic 4 (Curse of Strahd Content Implementation)

---

## Purpose

This template standardizes NPC creation for Epic 4, ensuring:
- ✅ **Compatibility** with Epic 3 CharacterManager (Story 3-2)
- ✅ **Combat System Integration** with Combat Manager (Story 3-5)
- ✅ **Spellcasting Support** for caster NPCs (Story 3-7)
- ✅ **Equipment Integration** with Equipment Manager (Story 3-14)
- ✅ **Schedule Tracking** via Epic 2 EventScheduler (Story 2-4)
- ✅ **AI Behavior Guidance** for LLM DM narrative generation

---

## File Structure

### NPCs vs Characters

| Aspect | Player Characters | NPCs |
|--------|------------------|------|
| **Location** | `characters/[name].yaml` | `game-data/npcs/[npc-id].yaml` |
| **Purpose** | Player-controlled | DM-controlled |
| **Additional Fields** | None | personality, dialogue, aiBehavior, relationships, schedule |
| **CharacterManager** | ✅ Compatible | ✅ Compatible (subset of fields) |

**Key Insight:** NPCs use the **same base structure** as player characters (abilities, hitPoints, inventory, etc.) but **add NPC-specific fields** (personality, dialogue, AI behavior).

---

## Required vs Optional Fields

### REQUIRED Fields (CharacterManager expects these):

```yaml
name: "NPC Name"
npcId: "unique_id"
race: "Human"
class: "Fighter"  # or null for commoners
level: 3

abilities: { ... }  # All 6 abilities required
hitPoints: { max, current, temporary, hitDice }
armorClass: 12
proficiencies: { ... }
proficiencyBonus: 2

inventory: { equipped, backpack, currency }
conditions: []
exhaustionLevel: 0
deathSaves: { successes, failures }
attunement: { items, max }

currentLocation: "location_id"
status: "alive"
```

### OPTIONAL Fields (NPC enhancements):

```yaml
personality: { ... }  # Personality traits, ideals, bonds, flaws
dialogue: { ... }  # Greeting, idle, farewell, quest dialogue
relationships: { ... }  # Allies, enemies, family, faction
aiBehavior: { ... }  # Combat tactics, goals, motivations, secrets
schedule: [ ... ]  # Daily routine (Epic 2 integration)
legendaryActions: { ... }  # For legendary creatures (e.g., Strahd)
lairActions: { ... }  # For creatures with lairs
specialAbilities: [ ... ]  # Unique abilities beyond class features
```

---

## NPC Types

### 1. Major NPCs (Quest-givers, Allies, Villains)

**Examples:** Ireena Kolyana, Strahd von Zarovich, Ismark Kolyanovich

**Required Fields:**
- Full stat block (all abilities, HP, AC, inventory)
- Complete personality (traits, ideals, bonds, flaws)
- Extensive dialogue (greeting, quest-giving, key quotes)
- AI behavior notes (goals, motivations, secrets, quest involvement)
- Relationships (allies, enemies, faction)
- Schedule (daily routine)

**File Location:** `game-data/npcs/major/[npc-id].yaml`

### 2. Minor NPCs (Shopkeepers, Townsfolk, Guards)

**Examples:** Bartender, Guard Captain, Blacksmith

**Required Fields:**
- Simplified stat block (basic abilities, HP, AC)
- Basic personality (1-2 traits)
- Limited dialogue (greeting, farewell, 1-2 key quotes)
- Minimal AI behavior (general attitude, basic goals)
- Location (tethered to one place)

**File Location:** `game-data/npcs/minor/[npc-id].yaml`

### 3. Monsters/Enemies (Combat Encounters)

**Examples:** Zombies, Wolves, Vampire Spawn

**Use Monster Stat Block Template instead** (`templates/monster/monster-statblock-template.yaml`)

Monsters have different structure optimized for combat:
- Challenge Rating (CR) instead of level
- Monster-specific abilities
- No personality/dialogue (unless intelligent monster)

**File Location:** `game-data/monsters/[monster-id].yaml`

---

## Field Descriptions

### Personality

```yaml
personality:
  traits:
    - "I am always polite and respectful"
    - "I tend to speak in metaphors"
  ideals:
    - "Freedom: Everyone deserves to live free from tyranny (Chaotic Good)"
  bonds:
    - "My sister Ireena is everything to me"
  flaws:
    - "I am too trusting of strangers"
  mannerisms:
    - "Rubs hands together when nervous"
    - "Speaks quickly when excited"
  voiceDescription: "Deep, commanding voice with slight Barovian accent"
  appearanceNotes: "Tall, broad-shouldered, scarred face, missing left ear"
```

**Purpose:** Guides LLM DM in generating consistent dialogue and behavior.

### Dialogue

```yaml
dialogue:
  greeting:
    - "Welcome to Barovia, stranger. I wish I could say you came at a better time."
  questGiving:
    - "My sister is in grave danger. Strahd has taken an interest in her. Will you help?"
  keyQuotes:
    - "There is no escape from Barovia. The mists see to that."
```

**Purpose:** Provides sample dialogue for LLM DM to use or adapt.

### AI Behavior

```yaml
aiBehavior:
  combatTactics: "Defensive fighter. Prioritizes protecting Ireena above all else. Uses shield to interpose between threats and allies."

  goals:
    - "Protect Ireena from Strahd"
    - "Find a way to escape Barovia"

  motivations:
    - "Loyalty to family"
    - "Desire for freedom from Strahd's tyranny"

  knowledgeSecrets:
    - "Knows about the pool in Madam Eva's camp (but not its significance)"
    - "Aware of strange lights near Tser Falls"

  attitudeTowardPlayer: "friendly"  # friendly, neutral, hostile, suspicious, helpful
  trustLevel: 7  # 1-10 (starts at 7, can increase to 10)

  questInvolvement:
    - questId: "escort_ireena"
      role: "quest_giver"
      notes: "Asks player to escort Ireena to Vallaki"
```

**Purpose:** Tells LLM DM how this NPC should behave, what they know, and how they relate to quests.

### Schedule (Epic 2 Integration)

```yaml
schedule:
  - time: "06:00"
    location: "village_of_barovia"
    activity: "Wakes, patrols perimeter of house"

  - time: "08:00"
    location: "village_of_barovia"
    activity: "Breakfast with Ireena, discusses safety plans"

  - time: "10:00"
    location: "village_of_barovia"
    activity: "Repairs barricades, checks supplies"

  - time: "18:00"
    location: "village_of_barovia"
    activity: "Dinner, tells stories of better times"

  - time: "22:00"
    location: "village_of_barovia"
    activity: "Night watch, doesn't sleep much"
```

**Purpose:** Epic 2 EventScheduler can trigger NPC movement/activities based on time. Adds realism ("Where is Ismark right now? Let me check his schedule...").

### Relationships

```yaml
relationships:
  allies:
    - npcId: "ireena_kolyana"
      relationship: "sister"
      notes: "Protective older brother. Would die for her."

  enemies:
    - npcId: "strahd_von_zarovich"
      relationship: "mortal enemy"
      notes: "Hates Strahd for tormenting Ireena and cursing Barovia."

  family:
    - npcId: "ireena_kolyana"
      relationship: "sister"
      notes: "Biological sister, closest living relative."

    - npcId: "kolyan_indirovich"
      relationship: "father"
      notes: "Father, recently deceased (buried before campaign starts)."

  faction: "burgomaster_family"
```

**Purpose:** Defines NPC connections for LLM DM. If player mentions Ireena to Ismark, LLM knows they're siblings.

---

## Spellcasting NPCs

For NPCs with spellcasting (clerics, wizards, sorcerers):

```yaml
class: "Cleric"
level: 5

spellcasting:
  ability: "wisdom"
  spellSaveDC: 13  # 8 + proficiency(+3) + wisdom modifier(+2)
  spellAttackBonus: 5  # proficiency(+3) + wisdom modifier(+2)

  spellSlots:
    1: 4
    2: 3
    3: 2

  spellsPrepared:
    - "cure_wounds"
    - "bless"
    - "spiritual_weapon"
    - "lesser_restoration"
    - "beacon_of_hope"

  cantrips:
    - "sacred_flame"
    - "light"
    - "thaumaturgy"

  concentration: null  # Current concentration spell or null
```

**Integration:** Epic 3 SpellManager (Story 3-7) can cast spells using this NPC's slots and prepared spells.

---

## Legendary Creatures (e.g., Strahd)

```yaml
legendaryActions:
  actionsPerRound: 3
  actions:
    - name: "Move"
      cost: 1
      description: "Strahd moves up to his speed without provoking opportunity attacks."

    - name: "Unarmed Strike"
      cost: 1
      description: "Strahd makes one unarmed strike."

    - name: "Bite (Costs 2 Actions)"
      cost: 2
      description: "Strahd makes one bite attack."

lairActions:
  initiative: 20  # Lair acts on initiative count 20
  actions:
    - name: "Fog Walls"
      description: "Strahd creates walls of fog that heavily obscure areas."

    - name: "Passing Through Walls"
      description: "Strahd can walk through walls until his next turn."
```

**Purpose:** Epic 3 Combat Manager (Story 3-5) can handle legendary actions if extended in Epic 4.

---

## Validation Checklist

Before marking an NPC as "final":

- [ ] **npcId** is unique and lowercase_with_underscores
- [ ] **All 6 abilities** have valid values (3-20 for most NPCs, up to 30 for gods)
- [ ] **hitPoints.max** matches expected HP for class/level (or official stat block)
- [ ] **armorClass** is calculated correctly based on armor + Dex
- [ ] **proficiencyBonus** matches level: +2 (1-4), +3 (5-8), +4 (9-12), etc.
- [ ] **Spellcasting** (if present) has valid spell IDs from Epic 3 spell database
- [ ] **inventory.equipped** items exist in Epic 3 item database
- [ ] **currentLocation** is a valid location ID from Epic 4
- [ ] **Personality** has at least 2 traits, 1 ideal, 1 bond, 1 flaw
- [ ] **Dialogue** has greeting and farewell lines minimum
- [ ] **AI Behavior** has goals, motivations, and attitudeTowardPlayer
- [ ] **Schedule** (if present) has valid times (HH:MM format) and location IDs
- [ ] **Relationships** use valid npcIds (other NPCs must exist)
- [ ] **metadata.source** and **metadata.pageReference** are filled in

---

## Examples

See `templates/npc/examples/` for filled-out examples:
- `ismark_kolyanovich.yaml` - Major NPC (quest-giver, ally)
- `morgantha.yaml` - Major NPC (enemy, night hag)
- `arik_the_barkeep.yaml` - Minor NPC (shopkeeper)

---

## Usage in Epic 4 Stories

### Story 4-1: First Location Import

When creating the first location (Village of Barovia):
1. Create NPCs from template
2. Save to `game-data/npcs/major/[npc-id].yaml`
3. Reference NPCs in location's `NPCs.md` file
4. Test integration with Epic 3 CharacterManager

### Story 4-9 & 4-10: Major NPCs Batch Implementation

For batch NPC creation:
1. Use template for consistency
2. Validate all required fields
3. Run content validation tests (Story task 8)
4. Playtest NPC interactions

---

## Related Systems

| System | Epic | Story | Integration Point |
|--------|------|-------|------------------|
| CharacterManager | 3 | 3-2 | Loads NPC files, validates structure |
| Combat Manager | 3 | 3-5 | Uses NPC stats for initiative, attacks, HP |
| Spellcasting Module | 3 | 3-7 | Casts spells using NPC's prepared spells/slots |
| Equipment Manager | 3 | 3-14 | Manages NPC equipped items |
| EventScheduler | 2 | 2-3 | Triggers NPC schedule activities |

---

## Template Version History

- **v1.0.0** (2025-11-10): Initial template for Epic 4 prep sprint
