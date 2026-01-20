# Epic Technical Specification: D&D 5e Mechanics Integration

Date: 2025-11-09
Author: Kapi
Epic ID: 3
Status: Draft

---

## Overview

Epic 3 implements the core D&D 5e rules engine for Kapi-s-RPG, transforming the platform from a narrative exploration system into a fully-functional D&D 5e solo RPG. This epic delivers authentic tabletop gameplay mechanics including dice rolling, character management, ability checks, combat, spellcasting, inventory, and character progression. Building on Epic 1's location system and Epic 2's calendar integration, Epic 3 provides the mechanical foundation for D&D 5e gameplay while maintaining the file-first architecture and LLM-powered narrative generation established in previous epics.

**Key Focus:** Implement D&D 5e Systems Reference Document (SRD) mechanics with Rules As Written (RAW) accuracy, enabling character creation, skill checks, tactical combat, spell management, inventory tracking, and level progression. All mechanics integrate with existing StateManager and CalendarManager systems, storing character data in human-readable YAML/Markdown files for transparency and Git-compatible version control.

## Objectives and Scope

**In Scope:**

✅ **Dice Rolling Engine**
- Dice notation parser (1d20, 2d6+3, advantage/disadvantage, modifiers)
- Support for all D&D dice types (d4, d6, d8, d10, d12, d20, d100)
- Result tracking and validation
- Integration with character modifiers

✅ **Character Sheet Management**
- Character data structure (class, level, abilities, HP, AC, proficiencies)
- YAML-based character sheet storage
- Ability score and modifier calculations
- Proficiency bonus scaling with level
- Character creation and editing

✅ **Ability Checks and Saving Throws**
- d20 + ability modifier + proficiency (if applicable)
- Advantage/disadvantage mechanics
- Difficulty Class (DC) validation
- Critical success/failure handling
- Skill proficiency and expertise support

✅ **Combat System**
- Initiative tracking and turn order
- Attack rolls (melee, ranged, spell attacks)
- Damage calculation and HP management
- Armor Class (AC) calculations
- Conditions (prone, poisoned, etc.) and status effects
- Death saving throws and unconsciousness

✅ **Spell System**
- Spell slot tracking by level (1st-9th level slots)
- Spell database (SRD spells)
- Spellcasting ability and spell save DC
- Spell preparation and known spells
- Cantrips and ritual casting
- Concentration tracking

✅ **Inventory and Equipment**
- Item database (weapons, armor, gear, magic items)
- Weight and encumbrance calculations
- Equipment slots (worn armor, wielded weapons)
- Attunement tracking (max 3 items)
- Currency management (GP, SP, CP)

✅ **Character Progression**
- Experience point (XP) tracking
- Level-up calculations and triggers
- Hit point increases on level up
- Class feature unlocks by level
- Proficiency bonus increases
- Multiclassing support (stretch goal)

✅ **Rest Mechanics**
- Short rest (1 hour, limited resource recovery)
- Long rest (8 hours, full recovery)
- Integration with CalendarManager for time tracking
- Hit Dice recovery rules
- Spell slot recovery

✅ **Condition Tracking**
- D&D 5e condition system (poisoned, stunned, frightened, etc.)
- Condition effects on mechanics (disadvantage, speed reduction)
- Condition duration tracking via EventScheduler
- Removal conditions (save ends, time expires)

✅ **HP and Death Saves**
- Current HP vs Max HP tracking
- Damage and healing application
- Unconsciousness at 0 HP
- Death saving throws (3 successes/failures)
- Instant death at negative max HP

✅ **Mechanics Slash Commands**
- `/roll [dice]` - Roll dice with notation
- `/check [ability] [DC]` - Make ability check
- `/attack [target]` - Make attack roll
- `/cast [spell]` - Cast spell (consume slot)
- `/rest [short/long]` - Take rest (advance time)
- `/level-up` - Level up character

✅ **Integration with Existing Systems**
- StateManager: Character sheet, HP, spell slots persist in State.md
- CalendarManager: Rest mechanics advance game time
- EventScheduler: Spell durations, condition expiration
- LLMNarrator: Mechanics results feed into narrative generation

**Out of Scope (Deferred to Later Epics):**

❌ **Advanced Rules:**
- Multiclassing (complex, defer to post-MVP)
- Feats (optional rule, Epic 5)
- Variant rules (flanking, grid combat, Epic 5)

❌ **Full Spell/Item Database:**
- Only SRD content (100 core spells, 50 items)
- Expansion content (Xanathar's, Tasha's) deferred to Epic 5

❌ **Monster AI:**
- Monster stat blocks exist but AI tactics in Epic 4
- Basic attack logic only

❌ **Character Classes:**
- Focus on 4 core classes: Fighter, Cleric, Rogue, Wizard
- Additional classes (Barbarian, Ranger, etc.) in Epic 5

❌ **Races:**
- Support 4 core races: Human, Elf, Dwarf, Halfling
- Exotic races deferred

❌ **Visual UI:**
- Character sheet GUI in Epic 5
- Relying on YAML editing for MVP

❌ **Automation:**
- Full auto-combat (Epic 5)
- AI spell selection (Epic 5)

## System Architecture Alignment

**Architecture Document Reference:** `docs/technical-architecture.md` sections 3, 7, 9

**Epic 3 aligns with established architectural patterns:**

### 1. File-First Design (Architecture §2)
- Character sheets stored as `characters/[character-name].yaml`
- Spell database in `data/srd/spells.yaml`
- Item database in `data/srd/items.yaml`
- All mechanics data human-readable and Git-friendly

### 2. Dependency Injection Pattern (Epic 1 & 2 Standard)
- All mechanics modules accept injected dependencies
- CharacterManager, CombatManager, SpellManager use DI
- Enables unit testing with mocked file system

### 3. Result Object Pattern (Epic 1 & 2 Standard)
- All async operations return `{success, data, error}` objects
- No exceptions thrown, graceful error handling
- Consistent interface across all mechanics modules

### 4. Integration with Epic 1 StateManager
- Character HP, spell slots, conditions persist in State.md YAML frontmatter
- Extends existing state schema with mechanics fields
- Maintains backward compatibility with Epic 1/2 state structure

### 5. Integration with Epic 2 CalendarManager
- Rest mechanics call `TimeManager.advanceTime(duration, reason)`
- Spell durations register events via EventScheduler
- Condition expiration uses EventExecutor

### 6. Technology Stack Consistency (Architecture §3.1)
- Node.js for mechanics calculations
- YAML for character data
- JavaScript/Jest for testing
- No new language/framework requirements

### Architectural Constraints

**Performance:**
- Dice rolls: <10ms per roll
- Ability checks: <50ms including modifiers
- Attack resolution: <100ms (roll + damage + apply HP)
- Character sheet load: <50ms
- Spell database query: <100ms

**Data Integrity:**
- Validate all character data against D&D 5e rules
- Prevent invalid states (negative HP below threshold, invalid spell slots)
- Atomic state updates (character never in inconsistent state)

**Compatibility:**
- Must work with Epic 1 LocationLoader and StateManager
- Must integrate with Epic 2 CalendarManager and EventScheduler
- Cannot break existing Epic 1/2 functionality

**Extensibility:**
- Design for future class/race additions
- Plugin pattern for custom spells/items
- Support homebrew content (future)

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Owner/Location |
|--------|---------------|--------|---------|----------------|
| **DiceRoller** | Parse dice notation and generate random results | Dice notation string (e.g., "2d6+3") | Roll result object | `src/mechanics/dice-roller.js` |
| **CharacterManager** | Load, validate, and persist character sheets | Character ID, character data | Character object | `src/mechanics/character-manager.js` |
| **AbilityCheckHandler** | Execute ability checks and saving throws | Ability, DC, character | Check result (success/fail, roll details) | `src/mechanics/ability-check-handler.js` |
| **SkillCheckSystem** | Handle skill checks with proficiency | Skill, DC, character | Skill check result | `src/mechanics/skill-check-system.js` |
| **CombatManager** | Manage combat state (initiative, turns, actions) | Combatants, actions | Combat state updates | `src/mechanics/combat-manager.js` |
| **AttackResolver** | Resolve attack rolls and damage | Attacker, target, weapon/spell | Attack result (hit/miss, damage) | `src/mechanics/attack-resolver.js` |
| **SpellManager** | Track spell slots, manage spellcasting | Character, spell, target | Spell effect, slot consumption | `src/mechanics/spell-manager.js` |
| **SpellDatabase** | Query spell definitions from SRD | Spell name/ID | Spell data | `src/mechanics/spell-database.js` |
| **InventoryManager** | Manage character inventory and equipment | Character, item actions | Inventory state | `src/mechanics/inventory-manager.js` |
| **ItemDatabase** | Query item definitions from SRD | Item name/ID | Item data | `src/mechanics/item-database.js` |
| **LevelUpCalculator** | Handle level progression and stat increases | Character, new level | Updated character with new features | `src/mechanics/level-up-calculator.js` |
| **ConditionTracker** | Apply and remove conditions, track effects | Character, condition | Condition state | `src/mechanics/condition-tracker.js` |
| **HPManager** | Track HP, damage, healing, death saves | Character, damage/healing | HP state, death status | `src/mechanics/hp-manager.js` |
| **RestHandler** | Execute short/long rest mechanics | Character, rest type | Recovered resources, time advanced | `src/mechanics/rest-handler.js` |
| **MechanicsCommandHandler** | Handle `/roll`, `/attack`, `/cast` commands | Command string, args | Display output | `src/commands/mechanics-commands.js` |

**Module Dependencies:**

```
MechanicsCommandHandler
  ├─> DiceRoller
  ├─> AbilityCheckHandler
  │   ├─> CharacterManager
  │   └─> DiceRoller
  ├─> AttackResolver
  │   ├─> CharacterManager
  │   ├─> CombatManager
  │   └─> DiceRoller
  ├─> SpellManager
  │   ├─> CharacterManager
  │   ├─> SpellDatabase
  │   └─> HPManager
  ├─> RestHandler
  │   ├─> CharacterManager
  │   └─> CalendarManager (from Epic 2)
  └─> LevelUpCalculator
      └─> CharacterManager

All managers integrate with:
  - StateManager (from Epic 1) for persistence
  - EventScheduler (from Epic 2) for duration tracking
```

### Data Models and Contracts

**Character Schema (characters/[name].yaml):**

```yaml
name: Kapi
race: Human
class: Fighter
level: 3
experience: 1200

abilities:
  strength: 16
  dexterity: 14
  constitution: 15
  intelligence: 10
  wisdom: 12
  charisma: 8

hitPoints:
  max: 31
  current: 24
  temporary: 0
  hitDice:
    total: 3
    spent: 1

armorClass: 18  # 10 + Dex(+2) + Chain Mail(16)

proficiencies:
  armor: [light, medium, heavy, shields]
  weapons: [simple, martial]
  savingThrows: [strength, constitution]
  skills:
    - athletics
    - perception
    - survival
  tools: []
  languages: [Common, Dwarvish]

proficiencyBonus: 2  # Auto-calculated from level

spellcasting:  # null for non-casters
  ability: null
  spellSlots: {}
  spellsPrepared: []
  knownSpells: []

inventory:
  equipped:
    armor: chain_mail
    mainHand: longsword
    offHand: shield
  backpack:
    - item: rope_hemp_50ft
      quantity: 1
    - item: rations
      quantity: 10
  currency:
    gold: 150
    silver: 23
    copper: 8

weight:
  current: 85
  capacity: 240  # Str * 15

conditions: []  # Array of active conditions

attunement:
  - item: ring_of_protection
  max: 3

features:
  - name: Fighting Style (Defense)
    description: +1 AC while wearing armor
  - name: Second Wind
    uses: 1
    maxUses: 1
    recharge: short_rest

metadata:
  created: 2025-11-09
  lastPlayed: 2025-11-09
  campaign: curse-of-strahd
```

**Spell Data (data/srd/spells.yaml):**

```yaml
spells:
  - id: fireball
    name: Fireball
    level: 3
    school: Evocation
    castingTime: 1 action
    range: 150 feet
    components: [V, S, M]
    materials: "a tiny ball of bat guano and sulfur"
    duration: Instantaneous
    concentration: false
    description: "A bright streak flashes from your pointing finger..."
    effect:
      type: damage
      damage: 8d6
      damageType: fire
      saveType: Dexterity
      saveEffect: half
    upcastBonus: +1d6 per slot level above 3rd

  - id: cure_wounds
    name: Cure Wounds
    level: 1
    school: Evocation
    castingTime: 1 action
    range: Touch
    components: [V, S]
    duration: Instantaneous
    description: "A creature you touch regains hit points..."
    effect:
      type: healing
      healing: 1d8
      modifier: spellcastingAbility
    upcastBonus: +1d8 per slot level above 1st
```

**Item Data (data/srd/items.yaml):**

```yaml
items:
  - id: longsword
    name: Longsword
    type: weapon
    category: martial_melee
    damage: 1d8
    damageType: slashing
    versatile: 1d10
    properties: [versatile]
    weight: 3
    cost: 15gp

  - id: chain_mail
    name: Chain Mail
    type: armor
    category: heavy
    armorClass: 16
    stealthDisadvantage: true
    strengthRequirement: 13
    weight: 55
    cost: 75gp

  - id: ring_of_protection
    name: Ring of Protection
    type: magic_item
    rarity: rare
    attunement: true
    effects:
      - type: ac_bonus
        value: 1
      - type: saving_throw_bonus
        value: 1
    description: "You gain a +1 bonus to AC and saving throws..."
```

**Combat State:**

```javascript
{
  combatId: "combat_001",
  active: true,
  round: 3,
  initiative: [
    {combatantId: "kapi", initiative: 17, acted: true},
    {combatantId: "zombie_1", initiative: 12, acted: false},
    {combatantId: "zombie_2", initiative: 8, acted: true}
  ],
  currentTurn: "zombie_1",
  combatants: [
    {
      id: "kapi",
      type: "player",
      characterId: "kapi",
      hp: {current: 24, max: 31},
      ac: 18,
      conditions: [],
      position: {x: 0, y: 0}  # Optional grid coordinates
    },
    {
      id: "zombie_1",
      type: "monster",
      monsterName: "Zombie",
      hp: {current: 15, max: 22},
      ac: 8,
      conditions: ["prone"]
    }
  ]
}
```

**DiceRoll Result:**

```javascript
{
  notation: "2d6+3",
  rolls: [4, 6],
  modifier: 3,
  total: 13,
  breakdown: "2d6(4+6) + 3 = 13"
}
```

### APIs and Interfaces

**DiceRoller API:**

```javascript
class DiceRoller {
  /**
   * Roll dice from notation string
   * @param {string} notation - Dice notation (e.g., "2d6+3", "1d20")
   * @param {Object} options - Optional modifiers (advantage, disadvantage)
   * @returns {Promise<RollResult>} Roll result
   */
  async roll(notation, options = {}) {
    // Parse notation: "2d6+3" -> {count: 2, sides: 6, modifier: 3}
    // Roll dice: Math.floor(Math.random() * sides) + 1
    // Apply advantage/disadvantage if specified
    // Return {success, data: RollResult, error}
  }

  /**
   * Validate dice notation
   * @param {string} notation - Dice notation to validate
   * @returns {boolean} True if valid
   */
  validateNotation(notation) {
    // Check against regex: /^(\d+)d(\d+)([+-]\d+)?$/i
    // Support advantage/disadvantage suffixes
  }
}
```

**CharacterManager API:**

```javascript
class CharacterManager {
  /**
   * Load character from file
   * @param {string} characterId - Character filename
   * @returns {Promise<ResultObject>} Character data
   */
  async loadCharacter(characterId) {
    // Read characters/[characterId].yaml
    // Parse YAML
    // Validate schema
    // Calculate derived stats (AC, proficiency bonus, etc.)
    // Return {success, data: Character, error}
  }

  /**
   * Save character to file
   * @param {string} characterId - Character filename
   * @param {Object} characterData - Character to save
   * @returns {Promise<ResultObject>} Success/error
   */
  async saveCharacter(characterId, characterData) {
    // Validate character data
    // Write to characters/[characterId].yaml
    // Return {success, data: null, error}
  }

  /**
   * Calculate ability modifier
   * @param {number} abilityScore - Ability score (3-20)
   * @returns {number} Modifier
   */
  getAbilityModifier(abilityScore) {
    return Math.floor((abilityScore - 10) / 2);
  }

  /**
   * Get proficiency bonus for level
   * @param {number} level - Character level (1-20)
   * @returns {number} Proficiency bonus
   */
  getProficiencyBonus(level) {
    return Math.ceil(level / 4) + 1;
  }
}
```

**AbilityCheckHandler API:**

```javascript
class AbilityCheckHandler {
  /**
   * Make ability check
   * @param {Object} character - Character object
   * @param {string} ability - Ability name (strength, dexterity, etc.)
   * @param {number} dc - Difficulty Class
   * @param {Object} options - advantage, disadvantage, proficient
   * @returns {Promise<ResultObject>} Check result
   */
  async makeAbilityCheck(character, ability, dc, options = {}) {
    // Get ability modifier from character
    // Add proficiency bonus if proficient
    // Roll d20 with advantage/disadvantage
    // Compare to DC
    // Return {success, data: {passed, total, roll, modifier, dc}, error}
  }

  /**
   * Make saving throw
   * @param {Object} character - Character object
   * @param {string} ability - Ability for save
   * @param {number} dc - Difficulty Class
   * @returns {Promise<ResultObject>} Save result
   */
  async makeSavingThrow(character, ability, dc) {
    // Similar to ability check but uses saving throw proficiencies
    // Check character.proficiencies.savingThrows array
  }
}
```

**CombatManager API:**

```javascript
class CombatManager {
  /**
   * Start combat encounter
   * @param {Array<Combatant>} combatants - All combatants
   * @returns {Promise<ResultObject>} Combat state
   */
  async startCombat(combatants) {
    // Roll initiative for all combatants
    // Sort by initiative (descending)
    // Create combat state object
    // Return {success, data: CombatState, error}
  }

  /**
   * Advance to next turn
   * @param {string} combatId - Combat ID
   * @returns {Promise<ResultObject>} Updated combat state
   */
  async nextTurn(combatId) {
    // Mark current combatant as acted
    // Move to next in initiative order
    // If end of round, increment round number
    // Check for combat end conditions
  }

  /**
   * End combat
   * @param {string} combatId - Combat ID
   * @returns {Promise<ResultObject>} Final combat state
   */
  async endCombat(combatId) {
    // Mark combat as inactive
    // Clean up temporary effects
    // Award XP if applicable
  }
}
```

**AttackResolver API:**

```javascript
class AttackResolver {
  /**
   * Resolve attack roll
   * @param {Object} attacker - Attacker character/monster
   * @param {Object} target - Target character/monster
   * @param {Object} weapon - Weapon or spell attack
   * @param {Object} options - advantage, disadvantage, etc.
   * @returns {Promise<ResultObject>} Attack result
   */
  async resolveAttack(attacker, target, weapon, options = {}) {
    // Calculate attack bonus (ability modifier + proficiency + weapon bonus)
    // Roll d20 + attack bonus
    // Check critical hit (natural 20) or miss (natural 1)
    // Compare to target AC
    // If hit, roll damage
    // Return {success, data: {hit, critical, damage, total}, error}
  }

  /**
   * Roll damage
   * @param {Object} weapon - Weapon/spell with damage dice
   * @param {Object} attacker - Attacker for ability modifier
   * @param {boolean} critical - Is this a critical hit?
   * @returns {Promise<ResultObject>} Damage result
   */
  async rollDamage(weapon, attacker, critical = false) {
    // Parse weapon damage dice
    // Add ability modifier
    // If critical, double dice (not modifier)
    // Return {success, data: {damage, type, breakdown}, error}
  }
}
```

**SpellManager API:**

```javascript
class SpellManager {
  /**
   * Cast spell
   * @param {Object} character - Caster
   * @param {string} spellId - Spell to cast
   * @param {number} slotLevel - Spell slot level used
   * @param {Object} target - Target (if applicable)
   * @returns {Promise<ResultObject>} Spell effect
   */
  async castSpell(character, spellId, slotLevel, target = null) {
    // Load spell from SpellDatabase
    // Validate character has spell slot at level
    // Consume spell slot
    // Apply spell effect (damage, healing, condition, etc.)
    // If concentration, track via ConditionTracker
    // Return {success, data: {effect, damage/healing, saveRequired}, error}
  }

  /**
   * Prepare spells
   * @param {Object} character - Character
   * @param {Array<string>} spellIds - Spells to prepare
   * @returns {Promise<ResultObject>} Updated character
   */
  async prepareSpells(character, spellIds) {
    // Validate spell count (Wis mod + level for Clerics, etc.)
    // Update character.spellcasting.spellsPrepared
    // Save character
  }
}
```

**RestHandler API:**

```javascript
class RestHandler {
  /**
   * Take short rest
   * @param {Object} character - Character
   * @param {number} hitDiceSpent - Hit dice to spend
   * @returns {Promise<ResultObject>} Rest result
   */
  async shortRest(character, hitDiceSpent = 0) {
    // Advance time 1 hour via CalendarManager
    // Recover short rest resources (fighter Second Wind, etc.)
    // Spend hit dice for healing (1d[class die] + Con mod per die)
    // Update character
    // Return {success, data: {healed, timeAdvanced}, error}
  }

  /**
   * Take long rest
   * @param {Object} character - Character
   * @returns {Promise<ResultObject>} Rest result
   */
  async longRest(character) {
    // Advance time 8 hours via CalendarManager
    // Restore all HP to max
    // Restore all spell slots
    // Restore half of spent hit dice (min 1)
    // Clear exhaustion level (if applicable)
    // Update character
    // Return {success, data: {healed, slotsRestored, timeAdvanced}, error}
  }
}
```

### Workflows and Sequencing

**Workflow 1: Make Ability Check**

```
User: /check perception 15
  │
  ├─> MechanicsCommandHandler.handleCheck("perception", 15)
  │   │
  │   ├─> CharacterManager.loadCharacter("kapi")
  │   │   └─> Read characters/kapi.yaml
  │   │       Character: {wisdom: 12, proficiencies: {skills: ["perception"]}}
  │   │
  │   ├─> AbilityCheckHandler.makeSkillCheck(character, "perception", 15)
  │   │   │
  │   │   ├─> Get ability for skill: perception = wisdom
  │   │   ├─> Get modifier: wisdom 12 → +1
  │   │   ├─> Check proficiency: "perception" in skills → add +2
  │   │   ├─> Total modifier: +3 (wisdom +1, proficiency +2)
  │   │   │
  │   │   ├─> DiceRoller.roll("1d20")
  │   │   │   └─> Roll: 14
  │   │   │
  │   │   ├─> Total: 14 + 3 = 17
  │   │   ├─> Compare to DC 15: 17 >= 15 → SUCCESS
  │   │   │
  │   │   └─> Return {success: true, data: {passed: true, total: 17, roll: 14, modifier: 3, dc: 15}}
  │   │
  │   ├─> SessionLogger.log(checkResult)
  │   │
  │   └─> Display: "Perception Check: d20(14) + 3 = 17 vs DC 15 → SUCCESS ✓"
```

**Workflow 2: Attack in Combat**

```
User: /attack zombie_1 longsword
  │
  ├─> MechanicsCommandHandler.handleAttack("zombie_1", "longsword")
  │   │
  │   ├─> CombatManager.getCurrentCombat()
  │   │   └─> Load active combat state
  │   │       Combat: {currentTurn: "kapi", targets: [zombie_1, zombie_2]}
  │   │
  │   ├─> CharacterManager.loadCharacter("kapi")
  │   │   Character: {strength: 16, proficiencyBonus: 2}
  │   │
  │   ├─> ItemDatabase.getItem("longsword")
  │   │   Weapon: {damage: "1d8", damageType: "slashing"}
  │   │
  │   ├─> AttackResolver.resolveAttack(kapi, zombie_1, longsword)
  │   │   │
  │   │   ├─> Calculate attack bonus:
  │   │   │   strength modifier (+3) + proficiency (+2) = +5
  │   │   │
  │   │   ├─> DiceRoller.roll("1d20")
  │   │   │   Roll: 18 (not critical)
  │   │   │   Total: 18 + 5 = 23
  │   │   │
  │   │   ├─> Compare to zombie AC 8: 23 >= 8 → HIT
  │   │   │
  │   │   ├─> AttackResolver.rollDamage(longsword, kapi, critical=false)
  │   │   │   │
  │   │   │   ├─> DiceRoller.roll("1d8")
  │   │   │   │   Roll: 6
  │   │   │   │
  │   │   │   ├─> Add strength modifier: 6 + 3 = 9
  │   │   │   └─> Damage: 9 slashing
  │   │   │
  │   │   └─> Return {hit: true, critical: false, damage: 9, damageType: "slashing"}
  │   │
  │   ├─> HPManager.applyDamage(zombie_1, 9)
  │   │   │
  │   │   ├─> zombie_1 HP: 15 → 6
  │   │   ├─> Check death: 6 > 0 → still alive
  │   │   └─> Update combat state
  │   │
  │   ├─> StateManager.saveState(locationId, combatState)
  │   │
  │   └─> Display: "Attack: d20(18) + 5 = 23 vs AC 8 → HIT! Damage: 1d8(6) + 3 = 9 slashing. Zombie HP: 15 → 6"
```

**Workflow 3: Cast Healing Spell**

```
User: /cast cure_wounds kapi
  │
  ├─> MechanicsCommandHandler.handleCast("cure_wounds", "kapi")
  │   │
  │   ├─> CharacterManager.loadCharacter("cleric_npc")
  │   │   Caster: {class: "Cleric", spellcasting: {ability: "wisdom", spellSlots: {1: 3}}}
  │   │
  │   ├─> SpellDatabase.getSpell("cure_wounds")
  │   │   Spell: {level: 1, effect: {type: "healing", healing: "1d8", modifier: "spellcastingAbility"}}
  │   │
  │   ├─> SpellManager.castSpell(caster, "cure_wounds", slotLevel=1, target="kapi")
  │   │   │
  │   │   ├─> Validate spell slot available: 1st level slots = 3 → OK
  │   │   │
  │   │   ├─> Consume spell slot: 3 → 2
  │   │   │
  │   │   ├─> DiceRoller.roll("1d8")
  │   │   │   Roll: 5
  │   │   │
  │   │   ├─> Add spellcasting modifier (wisdom +2): 5 + 2 = 7
  │   │   │
  │   │   ├─> HPManager.applyHealing(kapi, 7)
  │   │   │   kapi HP: 24 → 31 (capped at max)
  │   │   │
  │   │   └─> Return {success: true, data: {healed: 7, newHP: 31}}
  │   │
  │   ├─> CharacterManager.saveCharacter(caster)
  │   │   └─> Persist consumed spell slot
  │   │
  │   ├─> CharacterManager.saveCharacter("kapi")
  │   │   └─> Persist new HP
  │   │
  │   └─> Display: "Cure Wounds: 1d8(5) + 2 = 7 HP healed. Kapi HP: 24 → 31. Spell slot used (2/3 remaining)"
```

**Workflow 4: Long Rest**

```
User: /rest long
  │
  ├─> MechanicsCommandHandler.handleRest("long")
  │   │
  │   ├─> CharacterManager.loadCharacter("kapi")
  │   │   Character: {hp: {current: 24, max: 31}, spellcasting: {spellSlots: {1: 0, 2: 1}}, hitDice: {spent: 2}}
  │   │
  │   ├─> RestHandler.longRest(character)
  │   │   │
  │   │   ├─> CalendarManager.loadCalendar()
  │   │   │   Current time: 2024-03-10 22:00
  │   │   │
  │   │   ├─> TimeManager.advanceTime(calendar, 480, "long rest")
  │   │   │   │ (480 minutes = 8 hours)
  │   │   │   │
  │   │   │   ├─> New time: 2024-03-11 06:00
  │   │   │   ├─> EventScheduler.checkTriggers(...)
  │   │   │   │   └─> No events triggered during rest
  │   │   │   └─> Save calendar
  │   │   │
  │   │   ├─> Restore HP: 24 → 31 (full)
  │   │   │
  │   │   ├─> Restore spell slots: all slots refilled
  │   │   │   {1: 0 → 3, 2: 1 → 2}
  │   │   │
  │   │   ├─> Restore hit dice: spent 2 → spent 1 (recover half, min 1)
  │   │   │
  │   │   └─> Return {healed: 7, slotsRestored: true, timeAdvanced: "8 hours"}
  │   │
  │   ├─> CharacterManager.saveCharacter("kapi")
  │   │
  │   └─> Display: "Long Rest Complete (8 hours). HP fully restored (31/31). All spell slots recovered. 1 hit die recovered. Time: 2024-03-11 06:00"
```

**Workflow 5: Level Up**

```
User: /level-up
  │
  ├─> MechanicsCommandHandler.handleLevelUp()
  │   │
  │   ├─> CharacterManager.loadCharacter("kapi")
  │   │   Character: {level: 3, experience: 2700, class: "Fighter"}
  │   │
  │   ├─> LevelUpCalculator.canLevelUp(character)
  │   │   │
  │   │   ├─> Check XP threshold: 2700 >= 2700 (level 4 threshold) → YES
  │   │   └─> Return {canLevel: true, newLevel: 4}
  │   │
  │   ├─> LevelUpCalculator.levelUp(character)
  │   │   │
  │   │   ├─> Increment level: 3 → 4
  │   │   │
  │   │   ├─> Increase HP:
  │   │   │   DiceRoller.roll("1d10") → 7 (Fighter hit die)
  │   │   │   Add Constitution modifier (+2): 7 + 2 = 9
  │   │   │   Max HP: 31 → 40
  │   │   │   Current HP: 31 → 40
  │   │   │
  │   │   ├─> Increase proficiency bonus: 2 → 2 (no change until level 5)
  │   │   │
  │   │   ├─> Add hit die: total 3 → 4
  │   │   │
  │   │   ├─> Unlock class features:
  │   │   │   Fighter level 4: Ability Score Improvement
  │   │   │   Prompt user to choose: +2 to one stat or +1 to two stats
  │   │   │
  │   │   └─> Return {newLevel: 4, hpIncrease: 9, features: ["Ability Score Improvement"]}
  │   │
  │   ├─> CharacterManager.saveCharacter("kapi")
  │   │
  │   └─> Display: "Level Up! Kapi is now level 4. HP increased by 9 (40 max). Gained feature: Ability Score Improvement. Choose stat increase."
```

## Non-Functional Requirements

### Performance

**Target Metrics:**

| Metric | Target | Measurement Method | Priority |
|--------|--------|-------------------|----------|
| **Dice Roll** | < 10ms | Time from roll() call to result return | P0 - Critical |
| **Ability Check** | < 50ms | Including character load + roll + modifier calculation | P1 - High |
| **Attack Resolution** | < 100ms | Attack roll + damage roll + HP update | P1 - High |
| **Character Load** | < 50ms | Read and parse character YAML file | P1 - High |
| **Spell Database Query** | < 100ms | Find spell by ID or name | P2 - Medium |
| **Combat Turn Advance** | < 200ms | Update combat state + persistence | P2 - Medium |
| **Long Rest** | < 2 seconds | Time advance + resource recovery + persistence | P2 - Medium |

**Performance Requirements:**

1. **Dice Rolling Efficiency**
   - Use crypto.randomInt() or Math.random() (both <1ms)
   - Pre-compile dice notation regex
   - Cache parsed notation for repeated rolls
   - Target: 95% of rolls complete in < 5ms

2. **Character Data Caching**
   - Cache loaded characters in memory during session
   - Invalidate cache on character save
   - Avoid repeated file reads for same character
   - Target: Character lookup <10ms after first load

3. **Spell/Item Database Indexing**
   - Load SRD data into memory on first access
   - Build lookup index by ID and name
   - Keep in memory for session duration
   - Target: Query time <50ms

4. **Combat State Optimization**
   - Store combat state in memory (not file) during combat
   - Persist to StateManager only on turn end or combat end
   - Batch HP updates for area effects
   - Target: Handle 10+ combatants without lag

**Performance Monitoring:**
- Log all operations >100ms
- Track dice roll statistics (average time)
- Monitor character file size growth
- Alert if combat turn advance >200ms

**Related Architecture Sections:**
- Epic 1 Performance Targets (100ms location load)
- Epic 2 Performance Targets (200ms time advance)

### Security

**Input Validation:**

```javascript
// Validate dice notation
function validateDiceNotation(notation) {
  const pattern = /^(\d{1,2})d(\d{1,3})([+-]\d{1,3})?$/i;
  if (!pattern.test(notation)) {
    throw new ValidationError('Invalid dice notation');
  }

  // Prevent abuse (max 20d100)
  const [count, sides] = notation.match(/(\d+)d(\d+)/).slice(1).map(Number);
  if (count > 20 || sides > 100) {
    throw new ValidationError('Dice roll too large');
  }

  return {count, sides};
}

// Validate character data
function validateCharacter(data) {
  // Ability scores: 1-20
  for (const [ability, score] of Object.entries(data.abilities)) {
    if (score < 1 || score > 20) {
      throw new ValidationError(`Invalid ${ability} score: ${score}`);
    }
  }

  // Level: 1-20
  if (data.level < 1 || data.level > 20) {
    throw new ValidationError(`Invalid level: ${data.level}`);
  }

  // HP: 0 to max
  if (data.hitPoints.current < 0 || data.hitPoints.current > data.hitPoints.max) {
    throw new ValidationError('Invalid HP');
  }

  return true;
}
```

**Data Integrity:**

- Prevent negative HP below threshold (-max HP = instant death)
- Validate spell slots (can't cast with 0 slots)
- Prevent invalid conditions (can't be unconscious and prone simultaneously)
- Atomic character updates (never save partial state)

**File System Security:**

- Sanitize character IDs (prevent path traversal: `../../../etc/passwd`)
- Validate YAML structure before parsing
- Limit file size (character sheets max 100KB)
- Backup before destructive operations (level up, rest)

**Game Rule Enforcement:**

- Spell slot consumption is mandatory (can't cast without slots)
- Death saves follow D&D 5e rules (3 failures = death, no override)
- Attunement limit (max 3 items, no exceptions)
- Equipment restrictions (heavy armor requires proficiency)

**Related Architecture Sections:**
- Epic 1 Security (path traversal prevention)
- Epic 2 Security (event validation)

### Reliability/Availability

**Availability Target:**
- **99% uptime during sessions** - Mechanics always functional
- **Graceful degradation** - If SRD data missing, manual entry allowed

**Failure Modes & Recovery:**

1. **Character File Corrupted**
   - **Detection:** YAML parse error on loadCharacter()
   - **Recovery:** Load from Git history (previous commit)
   - **Fallback:** Prompt user to manually fix or recreate
   - **Impact:** Character unavailable until restored

2. **SRD Data Missing**
   - **Detection:** Spell/item database query returns null
   - **Recovery:** Prompt user to manually enter spell/item details
   - **Fallback:** Skip spell database, rely on LLM description
   - **Impact:** Manual work required for missing data

3. **Combat State Lost**
   - **Detection:** Combat state not found in memory/file
   - **Recovery:** Reconstruct from last known turn (StateManager)
   - **Fallback:** Ask user for initiative order and HP values
   - **Impact:** May lose 1 turn of combat state

4. **Dice Roller Failure**
   - **Detection:** Exception thrown during roll()
   - **Recovery:** Retry with basic Math.random()
   - **Fallback:** Prompt user to roll physical dice
   - **Impact:** Manual dice rolling until fixed

5. **Level Up Calculation Error**
   - **Detection:** Invalid HP increase or feature assignment
   - **Recovery:** Revert to previous level (Git)
   - **Fallback:** Manual stat adjustment by user
   - **Impact:** Level up must be redone

**Data Persistence Strategy:**
- Save character after every significant change (HP, spell slots, level)
- Git commit after level up (major milestone)
- Session end saves all characters
- Combat end saves final state

**Rollback Strategy:**
- Load previous Git commit to restore character
- Edit character YAML directly to fix corruption
- Delete combat state file to reset combat
- Reset to known-good state

**Related Architecture Sections:**
- Epic 1 Reliability (StateManager recovery)
- Epic 2 Reliability (Calendar corruption handling)

### Observability

**Logging Requirements:**

1. **Mechanics Activity Log:**
   - **Location:** `logs/mechanics-YYYY-MM-DD.log`
   - **Format:** Plain text, one line per action
   - **Content:**
     - Dice rolls (notation, result, context)
     - Ability checks (skill, DC, result)
     - Attack rolls (attacker, target, hit/miss, damage)
     - Spell casts (spell, caster, slot level, effect)
     - Level ups (character, old level, new level, HP increase)
     - Rests (type, character, resources recovered)
   - **Retention:** 30 days rolling

2. **Combat Log:**
   - **Location:** `logs/combat-YYYY-MM-DD.log`
   - **Format:** JSON lines (one combat per line)
   - **Content:**
     - Combat ID, participants, initiative order
     - Turn-by-turn actions (attack, spell, movement)
     - Damage dealt, healing applied, conditions added
     - Combat end state (victory, defeat, fled)
   - **Retention:** 90 days rolling

3. **Character Audit Log:**
   - **Location:** `logs/character-audit.log`
   - **Format:** Plain text with timestamps
   - **Content:**
     - Character creation/deletion
     - Ability score changes
     - Level ups and XP gains
     - Major item acquisitions/losses
   - **Retention:** Indefinite (valuable for debugging)

**Metrics Collection:**

| Metric | Source | Purpose | Storage |
|--------|--------|---------|---------|
| **Dice Rolls Per Session** | DiceRoller | Track game activity level | session-YYYY-MM-DD.md |
| **Combat Encounters Per Session** | CombatManager | Monitor combat frequency | mechanics-YYYY-MM-DD.log |
| **Average Attack Roll Time** | AttackResolver | Performance tracking | performance.log |
| **Spell Cast Count** | SpellManager | Resource usage monitoring | mechanics-YYYY-MM-DD.log |
| **Level Up Events** | LevelUpCalculator | Character progression tracking | character-audit.log |
| **Character Deaths** | HPManager | Track game difficulty | character-audit.log |

**Tracing:**
- Each mechanics operation gets unique ID
- Attack resolution traces link to combat turn
- Spell effects trace back to caster and spell ID
- All logs include session ID for correlation

**Debug Mode:**
- Enable via environment variable: `DEBUG_MECHANICS=true`
- Logs every dice roll (including LLM-internal rolls)
- Displays character stat calculations in detail
- Shows spell effect resolution step-by-step
- Traces combat state transitions

**Mechanics Dashboard (Future - Epic 5):**
- Current character stats (HP, AC, spell slots)
- Active conditions
- Initiative tracker (if in combat)
- Dice roll history (last 10 rolls)
- Recent mechanics actions

**Log Format Example:**

```
# Mechanics Activity Log: 2025-11-09

[2025-11-09T14:30:00Z] [DICE] Roll: 1d20+5 → [18]+5 = 23 (context: attack roll)
[2025-11-09T14:30:01Z] [ATTACK] Kapi attacks Zombie → Hit! AC 8 vs 23
[2025-11-09T14:30:01Z] [DICE] Roll: 1d8+3 → [6]+3 = 9 (context: longsword damage)
[2025-11-09T14:30:02Z] [DAMAGE] Zombie takes 9 slashing damage (HP: 15 → 6)
[2025-11-09T14:35:12Z] [SPELL] Cleric casts Cure Wounds (1st level) on Kapi
[2025-11-09T14:35:12Z] [DICE] Roll: 1d8+2 → [5]+2 = 7 (context: healing)
[2025-11-09T14:35:13Z] [HEALING] Kapi healed 7 HP (HP: 24 → 31)
[2025-11-09T14:40:00Z] [REST] Kapi takes long rest (8 hours)
[2025-11-09T14:40:01Z] [RECOVERY] HP restored to max (31), spell slots refilled, 1 hit die recovered
[2025-11-09T14:40:02Z] [TIME] Calendar advanced: 2024-03-10 22:00 → 2024-03-11 06:00
```

**Related Architecture Sections:**
- Epic 1 Observability (session logging)
- Epic 2 Observability (calendar activity log)

## Dependencies and Integrations

**External Dependencies:**

| Dependency | Version | Purpose | Source | License |
|------------|---------|---------|--------|---------|
| **js-yaml** | ^4.1.0 | YAML parsing for character sheets | npm | MIT |
| **lodash** | ^4.17.21 | Utility functions (Epic 2 dependency) | npm | MIT |

**Internal Dependencies (from Epic 1 & 2):**

| Dependency | Epic | Purpose | Location |
|------------|------|---------|----------|
| **StateManager** | 1 | Persist character HP, spell slots in State.md | src/core/state-manager.js |
| **CalendarManager** | 2 | Rest mechanics time advancement | src/calendar/calendar-manager.js |
| **TimeManager** | 2 | Calculate rest duration | src/calendar/time-manager.js |
| **EventScheduler** | 2 | Track spell durations, condition expiration | src/calendar/event-scheduler.js |
| **SessionLogger** | 1 | Log mechanics actions | src/core/session-logger.js |
| **LLMNarrator** | 1 | Generate narrative for mechanics results | src/core/llm-narrator.js |

**System Dependencies:**

| Dependency | Version | Purpose | Availability |
|------------|---------|---------|--------------|
| **Node.js crypto** | Built-in | Secure random number generation for dice | Standard library |
| **File System APIs** | Built-in | Read/write character sheets, SRD data | Standard library |

**API Integrations:**

**None** - Epic 3 has no external API dependencies. All D&D 5e data stored locally in `data/srd/`.

**Internal Integrations:**

1. **StateManager Integration:**
   - **Purpose:** Persist character state (HP, spell slots, conditions) in location State.md
   - **Integration Point:** CharacterManager.saveCharacter() → StateManager.saveState()
   - **Data Flow:** Character object → State YAML frontmatter → State.md write

2. **CalendarManager Integration:**
   - **Purpose:** Advance game time during rests
   - **Integration Point:** RestHandler.longRest() → TimeManager.advanceTime(480 minutes)
   - **Data Flow:** Rest triggered → Time advance → Events check → Calendar save

3. **EventScheduler Integration:**
   - **Purpose:** Track spell durations and condition expiration
   - **Integration Point:** SpellManager.castSpell() → EventScheduler.addEvent(spellDuration)
   - **Data Flow:** Spell cast with duration → Event created → Triggers when duration expires

4. **SessionLogger Integration:**
   - **Purpose:** Log mechanics actions to session log
   - **Integration Point:** After each mechanics operation (dice roll, attack, spell)
   - **Data Flow:** Mechanics result → SessionLogger.log() → session-YYYY-MM-DD.md

5. **LLMNarrator Integration:**
   - **Purpose:** Convert mechanics results into narrative descriptions
   - **Integration Point:** After attack/spell resolution
   - **Data Flow:** Mechanics result → LLMNarrator.generate() → Narrative text

**File System Structure Integration:**

```
kapi-s-rpg/
├── characters/
│   ├── kapi.yaml                    (READ/WRITE by CharacterManager)
│   ├── ireena.yaml
│   └── ...
├── data/
│   └── srd/
│       ├── spells.yaml              (READ by SpellDatabase)
│       ├── items.yaml               (READ by ItemDatabase)
│       ├── monsters.yaml            (READ by CombatManager)
│       └── rules.yaml               (READ by mechanics modules)
├── game-data/
│   └── locations/
│       └── village-of-barovia/
│           └── State.md             (WRITE by StateManager for character state)
├── logs/
│   ├── mechanics-YYYY-MM-DD.log     (WRITE by mechanics modules)
│   ├── combat-YYYY-MM-DD.log        (WRITE by CombatManager)
│   └── character-audit.log          (WRITE by CharacterManager)
└── src/
    └── mechanics/                   (Epic 3 modules)
        ├── dice-roller.js
        ├── character-manager.js
        ├── combat-manager.js
        └── ...
```

**Configuration Files:**

1. **characters/[name].yaml (Primary):**
   - Character data for each player/NPC
   - Created by CharacterManager.createCharacter()
   - See Data Models section for schema

2. **data/srd/spells.yaml:**
   - D&D 5e SRD spell database
   - ~100 core spells
   - Loaded once per session, cached in memory

3. **data/srd/items.yaml:**
   - D&D 5e SRD item database
   - Weapons, armor, magic items
   - Loaded once per session, cached in memory

4. **data/srd/rules.yaml (Optional):**
   - D&D 5e rule references
   - Ability check DCs, XP thresholds, etc.
   - Used for quick lookups

**Dependency Installation:**

```bash
# No new dependencies required
# js-yaml and lodash already installed in Epic 1 & 2
npm install  # Verify existing dependencies
```

**Version Compatibility:**
- **js-yaml 4.x:** Stable YAML parser, same as Epic 1/2
- **lodash 4.x:** Same version as Epic 2
- **Backward compatible:** Epic 3 does not break Epic 1/2 functionality

**Related Architecture Sections:**
- Architecture §3.1: Technology Stack
- Epic 1 StateManager (file persistence)
- Epic 2 CalendarManager (time integration)

## Acceptance Criteria (Authoritative)

**Source:** GDD Epic 3, Architecture (implied mechanics requirements)

### AC-1: Dice Rolling Engine
**Given** a dice notation string (e.g., "2d6+3", "1d20")
**When** DiceRoller.roll() is called
**Then** random dice must be rolled according to notation
**And** result must include individual rolls, modifier, and total
**And** operation must complete in < 10ms
**And** support for advantage/disadvantage (roll twice, take higher/lower)
**And** validate notation format (reject invalid input)

**Verification Method:** Unit test with 1000+ rolls, verify distribution

---

### AC-2: Character Sheet Creation
**Given** new character data (name, class, race, abilities)
**When** CharacterManager.createCharacter() is called
**Then** character YAML file must be created at characters/[name].yaml
**And** all required fields must be populated (abilities, HP, AC, proficiencies)
**And** derived stats must be calculated (proficiency bonus, ability modifiers, AC)
**And** file must be valid YAML parseable by js-yaml
**And** character must validate against schema

**Verification Method:** Integration test with sample character creation

---

### AC-3: Ability Check Execution
**Given** character with wisdom 12 (+1) and proficiency in perception (+2)
**When** AbilityCheckHandler.makeSkillCheck(character, "perception", DC=15) is called
**Then** roll d20 + wisdom modifier (+1) + proficiency (+2)
**And** total compared to DC 15
**And** return result object: {passed: boolean, total: number, roll: number, modifier: number, dc: number}
**And** operation completes in < 50ms
**And** log result to session log

**Verification Method:** Integration test with known character stats

---

### AC-4: Combat Initiative
**Given** multiple combatants (player + 2 monsters)
**When** CombatManager.startCombat(combatants) is called
**Then** roll initiative for each combatant (d20 + Dex modifier)
**And** sort combatants by initiative (descending)
**And** create combat state object with initiative order
**And** set currentTurn to first combatant in order
**And** persist combat state to memory (not file yet)

**Verification Method:** Integration test with 3 combatants

---

### AC-5: Attack Resolution
**Given** character with longsword (1d8 + Str modifier) attacking zombie (AC 8)
**When** AttackResolver.resolveAttack(character, zombie, longsword) is called
**Then** roll attack: d20 + Str modifier + proficiency
**And** compare to target AC 8
**And** if hit, roll damage: 1d8 + Str modifier
**And** apply damage to zombie HP
**And** detect critical hit (natural 20) → double damage dice
**And** detect critical miss (natural 1) → automatic miss
**And** operation completes in < 100ms

**Verification Method:** Integration test with known attack scenario

---

### AC-6: Spell Casting
**Given** cleric with Cure Wounds spell and 3 1st-level slots
**When** SpellManager.castSpell(cleric, "cure_wounds", slotLevel=1, target=character) is called
**Then** validate spell slot available (3 > 0)
**And** consume spell slot (3 → 2)
**And** roll healing: 1d8 + spellcasting ability modifier
**And** apply healing to target HP (capped at max)
**And** persist updated spell slots to character file
**And** persist updated HP to State.md
**And** operation completes in < 200ms

**Verification Method:** Integration test with spell cast workflow

---

### AC-7: Spell Slot Tracking
**Given** wizard with spell slots: {1: 2, 2: 1, 3: 0}
**When** spell slots are queried or consumed
**Then** SpellManager must accurately track slots by level
**And** prevent casting with 0 slots (return error)
**And** validate slot level matches spell level requirement
**And** restore slots on long rest (all refilled)
**And** persist slot changes to character file

**Verification Method:** Unit test with slot manipulation

---

### AC-8: Inventory Management
**Given** character with 50 GP and longsword in inventory
**When** InventoryManager.addItem(character, "chain_mail", quantity=1) is called
**Then** item must be added to character.inventory.backpack
**And** weight must be recalculated (current + item weight)
**And** validate weight does not exceed capacity (Str × 15)
**And** if over capacity, return error (encumbered)
**And** persist inventory changes to character file

**Verification Method:** Integration test with item addition

---

### AC-9: Experience and Level Up
**Given** character level 3 with 2700 XP (level 4 threshold)
**When** LevelUpCalculator.levelUp(character) is called
**Then** increment level (3 → 4)
**And** roll hit die + Con modifier for HP increase
**And** increase max HP and current HP by rolled amount
**And** add 1 hit die to total
**And** update proficiency bonus if needed (2 → 2 at level 4, no change)
**And** unlock class features for new level (Ability Score Improvement at level 4)
**And** persist updated character to file
**And** Git commit character file (major milestone)

**Verification Method:** Integration test with level 3 → 4 progression

---

### AC-10: Long Rest Mechanics
**Given** character with 24/31 HP, 0/3 1st-level spell slots, 2 spent hit dice
**When** RestHandler.longRest(character) is called
**Then** advance time 8 hours via CalendarManager
**And** restore HP to max (24 → 31)
**And** restore all spell slots to max (0 → 3 for 1st level)
**And** recover half of spent hit dice, rounded down, minimum 1 (2 spent → 1 spent)
**And** clear one level of exhaustion (if applicable)
**And** persist character changes
**And** operation completes in < 2 seconds
**And** log rest to session log

**Verification Method:** Integration test with rest workflow

---

### AC-11: Short Rest Mechanics
**Given** character with 20/31 HP and 1 available hit die (1d10)
**When** RestHandler.shortRest(character, hitDiceSpent=1) is called
**Then** advance time 1 hour via CalendarManager
**And** roll hit die: 1d10 + Con modifier
**And** heal character by rolled amount (max HP)
**And** mark hit die as spent (available 1 → 0)
**And** restore short rest resources (fighter Second Wind, etc.)
**And** persist character changes
**And** operation completes in < 1 second

**Verification Method:** Integration test with short rest

---

### AC-12: Condition Tracking
**Given** character is hit by poison (poisoned condition)
**When** ConditionTracker.applyCondition(character, "poisoned", duration="1 hour") is called
**Then** add "poisoned" to character.conditions array
**And** apply condition effects (disadvantage on attack rolls and ability checks)
**And** if duration specified, register event with EventScheduler to remove at expiration
**And** persist condition to State.md
**And** enforce condition effects in subsequent mechanics (attacks, checks)

**Verification Method:** Integration test with poisoned condition

---

### AC-13: Death Saving Throws
**Given** character at 0 HP (unconscious)
**When** turn starts, HPManager.makeDeathSave(character) is called
**Then** roll d20 (no modifiers)
**And** 10+ = success, < 10 = failure
**And** track successes and failures (3 of either ends death saves)
**And** natural 20 = regain 1 HP (conscious)
**And** natural 1 = 2 failures
**And** 3 successes = stabilized (still unconscious, 0 HP)
**And** 3 failures = character dies
**And** persist death save state

**Verification Method:** Unit test with multiple death saves

---

### AC-14: Mechanics Commands
**Given** active game session with character loaded
**When** user executes `/roll 2d6+3`
**Then** dice must be rolled
**And** result displayed: "2d6+3: [4, 6] + 3 = 13"
**And** logged to session log
**And** similar for `/check`, `/attack`, `/cast`, `/rest` commands
**And** all commands execute in < 1 second
**And** invalid input returns user-friendly error

**Verification Method:** Manual test + integration test for each command

---

### AC-15: Integration with StateManager
**Given** character HP changes during combat
**When** combat ends and state is saved
**Then** character HP must persist in location State.md YAML frontmatter
**And** spell slots must persist in State.md
**And** conditions must persist in State.md
**And** next session load restores exact character state
**And** State.md remains human-readable and editable

**Verification Method:** Integration test with state persistence

---

### AC-16: Integration with CalendarManager
**Given** character takes long rest (8 hours)
**When** RestHandler.longRest() executes
**Then** TimeManager.advanceTime(480 minutes) must be called
**And** calendar must advance from 22:00 to 06:00 next day
**And** EventScheduler must check for triggered events during rest
**And** rest completes even if events occur (user notified after)
**And** calendar changes persist to calendar.yaml

**Verification Method:** Integration test with rest + calendar

## Traceability Mapping

| AC ID | Requirement Source | Spec Section | Components | Test Approach |
|-------|-------------------|--------------|------------|---------------|
| **AC-1** | GDD Epic 3: Dice rolling | Data Models (DiceRoll), APIs (DiceRoller) | DiceRoller | Unit test: 1000+ rolls, distribution analysis |
| **AC-2** | GDD Epic 3: Character sheet structure | Data Models (Character), APIs (CharacterManager) | CharacterManager | Integration test: create character, validate YAML |
| **AC-3** | GDD Epic 3: Ability checks and saving throws | APIs (AbilityCheckHandler), Workflows (Ability Check) | AbilityCheckHandler, DiceRoller | Integration test: skill check with known stats |
| **AC-4** | GDD Epic 3: Combat system (initiative) | Data Models (Combat State), APIs (CombatManager) | CombatManager | Integration test: 3 combatants, initiative order |
| **AC-5** | GDD Epic 3: Combat system (attacks, damage) | APIs (AttackResolver), Workflows (Attack in Combat) | AttackResolver, DiceRoller, HPManager | Integration test: attack workflow, critical hits |
| **AC-6** | GDD Epic 3: Spell management | APIs (SpellManager), Workflows (Cast Spell) | SpellManager, SpellDatabase, HPManager | Integration test: spell cast, slot consumption |
| **AC-7** | GDD Epic 3: Spell slot tracking | Data Models (Character.spellcasting), APIs (SpellManager) | SpellManager, CharacterManager | Unit test: slot manipulation, validation |
| **AC-8** | GDD Epic 3: Inventory and equipment | APIs (InventoryManager), Data Models (Inventory) | InventoryManager, ItemDatabase | Integration test: add item, weight check |
| **AC-9** | GDD Epic 3: Experience and level progression | APIs (LevelUpCalculator), Workflows (Level Up) | LevelUpCalculator, CharacterManager | Integration test: level 3 → 4, HP increase |
| **AC-10** | GDD Epic 3: Long rest mechanics | APIs (RestHandler), Workflows (Long Rest) | RestHandler, CalendarManager, CharacterManager | Integration test: long rest, resource recovery |
| **AC-11** | GDD Epic 3: Short rest mechanics | APIs (RestHandler) | RestHandler, CalendarManager, CharacterManager | Integration test: short rest, hit dice |
| **AC-12** | Architecture (implied): Condition tracking | APIs (ConditionTracker), Data Models (Conditions) | ConditionTracker, EventScheduler | Integration test: apply condition, expiration |
| **AC-13** | D&D 5e SRD: Death saving throws | APIs (HPManager) | HPManager, DiceRoller | Unit test: multiple death saves, edge cases |
| **AC-14** | GDD Epic 3: VS Code slash commands | Commands (MechanicsCommandHandler) | MechanicsCommandHandler, all mechanics modules | Manual test + integration tests per command |
| **AC-15** | Architecture §2: File-First Design | Integration (StateManager) | CharacterManager, StateManager | Integration test: save/load character state |
| **AC-16** | Architecture: Calendar Integration | Integration (CalendarManager) | RestHandler, TimeManager, EventScheduler | Integration test: rest + time advance |

**Coverage Analysis:**
- **15 modules** defined → All covered by acceptance criteria
- **5 workflows** defined (ability check, attack, spell cast, rest, level up) → All covered
- **4 NFR categories** → All covered (Performance: AC-1,3,5,6,10,11; Security: implicit; Reliability: AC-2,7,13; Observability: AC-14)
- **GDD Epic 3 goals** → Complete coverage (dice, character, checks, combat, spells, inventory, progression, rests)

## Risks, Assumptions, Open Questions

### Risks

**R-1: D&D 5e Rules Complexity (HIGH)**
- **Description:** D&D 5e has hundreds of edge cases, spell interactions, and condition combinations that are difficult to implement accurately
- **Impact:** Incorrect mechanics break player immersion and trust
- **Mitigation:**
  - Reference official D&D 5e SRD for all mechanics
  - Cite specific rule sections in code comments
  - Test against known scenarios from official modules
  - Community playtesting for rule accuracy
  - Defer complex edge cases to Epic 5
- **Owner:** Developer + Architect

**R-2: Spell Database Completeness (MEDIUM)**
- **Description:** SRD has ~100 spells, full PHB has 300+. Missing spells create gaps
- **Impact:** Players can't cast spells they expect, breaks immersion
- **Mitigation:**
  - Start with 50 most common spells (Fireball, Cure Wounds, Shield, etc.)
  - Add spells incrementally based on player needs
  - Allow manual spell entry for missing spells
  - Defer non-SRD spells to Epic 5
- **Owner:** Developer

**R-3: Combat System Performance (MEDIUM)**
- **Description:** Complex combat with 10+ combatants, multiple conditions, and area effects could be slow
- **Impact:** Combat feels sluggish, poor user experience
- **Mitigation:**
  - Set performance targets (<100ms attack resolution)
  - Cache combat state in memory during combat
  - Batch HP updates for area effects
  - Profile combat system early in development
  - Limit combatants to 10 max for MVP
- **Owner:** Developer

**R-4: Character Sheet Synchronization (LOW)**
- **Description:** Character state split between characters/[name].yaml and State.md could desync
- **Impact:** HP/spell slots don't match, inconsistent state
- **Mitigation:**
  - Use State.md as single source of truth for volatile data (HP, spell slots, conditions)
  - Use characters/[name].yaml for permanent data (abilities, class, level, features)
  - Clear documentation on which data lives where
  - Validation checks on character load
- **Owner:** Architect

**R-5: Dice Roller Randomness Quality (LOW)**
- **Description:** Math.random() is not cryptographically secure, could have bias
- **Impact:** Dice rolls feel unfair or predictable
- **Mitigation:**
  - Use crypto.randomInt() instead of Math.random()
  - Test distribution over 10,000+ rolls
  - Allow manual dice rolling as fallback
  - Accept that perfect randomness not critical for solo play
- **Owner:** Developer

### Assumptions

**A-1: Single Player Focus**
- Epic 3 assumes single-player gameplay (one character)
- Multiplayer mechanics (party initiative, shared resources) deferred to Epic 5
- Acceptable for MVP: Solo D&D experience is core use case

**A-2: SRD Content Only**
- Only D&D 5e SRD content (free, open license) included in Epic 3
- Expansion content (Xanathar's, Tasha's) requires additional licensing
- Acceptable for MVP: SRD provides core gameplay

**A-3: Core Classes Only**
- Focus on 4 classes: Fighter, Cleric, Rogue, Wizard
- Additional classes (Barbarian, Ranger, Paladin, etc.) deferred to Epic 5
- Acceptable for MVP: Covers core archetypes (warrior, healer, skill, magic)

**A-4: Grid Combat Not Required**
- Combat uses theater-of-the-mind (no tactical grid)
- Grid-based combat (5ft squares, movement, opportunity attacks) deferred to Epic 5
- Acceptable for MVP: Theater-of-mind is valid D&D playstyle

**A-5: Manual Spell Selection**
- Player manually chooses which spell to cast (no AI recommendation)
- AI spell selection for NPCs deferred to Epic 4
- Acceptable for MVP: Player agency preferred over automation

**A-6: Physical Dice Fallback**
- If dice roller fails, player can roll physical dice and enter result
- Not every roll needs to be automated
- Acceptable for MVP: Hybrid digital/analog acceptable for solo play

### Open Questions

**Q-1: Character State Storage Location**
- **Question:** Should HP, spell slots, and conditions live in characters/[name].yaml or State.md?
- **Options:**
  - A) characters/[name].yaml - All character data in one place
  - B) State.md - Volatile data with location state (current approach)
  - C) Hybrid - Permanent in characters/, volatile in State.md
- **Impact:** Affects StateManager integration and data consistency
- **Decision Needed By:** Start of Story 3-2 (Character Manager)
- **Recommendation:** Option C (Hybrid) - Permanent data in characters/, volatile in State.md (aligns with Epic 1/2 patterns)

**Q-2: Spell Database Format**
- **Question:** Should spells be stored in YAML, JSON, or Markdown?
- **Options:**
  - A) YAML - Consistent with character sheets
  - B) JSON - Easier to query/index
  - C) Markdown - Human-readable but harder to parse
- **Impact:** Affects SpellDatabase query performance
- **Decision Needed By:** Start of Story 3-6 (Spell Database)
- **Recommendation:** Option A (YAML) - Consistency with existing architecture

**Q-3: Dice Rolling Library**
- **Question:** Use custom dice roller or npm package?
- **Options:**
  - A) Custom - Full control, no dependencies
  - B) `dice-roller` package - Feature-rich, maintained
  - C) `d20` package - Lightweight, minimal
- **Impact:** Affects development time and feature completeness
- **Decision Needed By:** Start of Story 3-1 (Dice Rolling Module)
- **Recommendation:** Option A (Custom) - Simple regex parser, no external dependencies, <100 lines of code

**Q-4: Combat State Persistence**
- **Question:** Save combat state to file or keep in memory?
- **Options:**
  - A) File - Persist every turn (survives crashes)
  - B) Memory - Fast, save only on combat end
  - C) Hybrid - Autosave every 3 turns
- **Impact:** Affects performance and crash recovery
- **Decision Needed By:** Start of Story 3-5 (Combat Manager)
- **Recommendation:** Option B (Memory) - Save on combat end, acceptable risk for MVP

**Q-5: Level Up Automation**
- **Question:** Should level up be fully automated or require user input?
- **Options:**
  - A) Fully automated - HP roll, stat increases applied automatically
  - B) Guided wizard - User prompted for choices (stat increases, spells)
  - C) Manual edit - User edits character YAML directly
- **Impact:** Affects user experience and error potential
- **Decision Needed By:** Start of Story 3-9 (Level Up Calculator)
- **Recommendation:** Option B (Guided wizard) - Automated with user choices for customization

## Test Strategy Summary

### Test Levels

**Unit Tests (70% coverage goal):**
- **Scope:** Individual modules in isolation
- **Framework:** Jest
- **Mocking:** Mock file system, DiceRoller for determinism
- **Files:**
  - `tests/mechanics/dice-roller.test.js` - Dice rolling logic
  - `tests/mechanics/character-manager.test.js` - Character CRUD operations
  - `tests/mechanics/ability-check-handler.test.js` - Check calculations
  - `tests/mechanics/attack-resolver.test.js` - Attack resolution
  - `tests/mechanics/spell-manager.test.js` - Spell logic
  - `tests/mechanics/hp-manager.test.js` - HP and death saves
- **Focus:**
  - Dice distribution (1000+ rolls, verify randomness)
  - Ability modifier calculations
  - Attack hit/miss logic
  - Spell slot consumption
  - Death save tracking
  - Edge cases (0 HP, negative HP, critical hits)

**Integration Tests (20% coverage goal):**
- **Scope:** Module interactions with Epic 1/2 dependencies
- **Framework:** Jest with real file I/O
- **Setup:** Create test characters, SRD data, State.md files
- **Files:**
  - `tests/integration/ability-check-workflow.test.js` - Full check workflow
  - `tests/integration/combat-workflow.test.js` - Initiative → attack → damage → HP
  - `tests/integration/spell-cast-workflow.test.js` - Spell cast + slot consumption + healing
  - `tests/integration/rest-workflow.test.js` - Rest + time advance + recovery
  - `tests/integration/level-up-workflow.test.js` - Level up + HP increase + features
  - `tests/integration/state-persistence.test.js` - Character state save/load
- **Focus:**
  - Workflow correctness (ability check, attack, spell cast)
  - File I/O correctness (character.yaml, State.md updates)
  - Integration with StateManager, CalendarManager
  - Performance (meet <100ms targets)

**End-to-End Tests (10% coverage goal):**
- **Scope:** Complete gameplay scenarios via commands
- **Framework:** Manual testing + automated scripts
- **Files:**
  - `tests/e2e/character-creation.test.js` - Create character, make checks, level up
  - `tests/e2e/combat-encounter.test.js` - Full combat from start to end
  - `tests/e2e/spell-casting.test.js` - Cast spells, manage slots, rest
- **Focus:**
  - User experience (commands work as expected)
  - Data persistence across session end/resume
  - Integration with LLMNarrator (mechanics feed narrative)

### Test Data

**Sample Character (tests/fixtures/test-character.yaml):**

```yaml
name: Test Fighter
race: Human
class: Fighter
level: 3
abilities:
  strength: 16
  dexterity: 14
  constitution: 15
  intelligence: 10
  wisdom: 12
  charisma: 8
hitPoints:
  max: 31
  current: 31
  hitDice:
    total: 3
    spent: 0
proficiencies:
  savingThrows: [strength, constitution]
  skills: [athletics, perception]
```

**Sample Spells (tests/fixtures/test-spells.yaml):**

```yaml
spells:
  - id: test_heal
    name: Test Healing
    level: 1
    effect:
      type: healing
      healing: 1d8
  - id: test_damage
    name: Test Damage
    level: 1
    effect:
      type: damage
      damage: 2d6
      damageType: fire
      saveType: Dexterity
```

### Test Execution

**Local Development:**

```bash
npm run test:mechanics       # Mechanics-specific tests
npm run test:epic3           # All Epic 3 tests
npm run test:integration     # Integration tests (slower)
npm run test:watch           # Watch mode for TDD
```

**CI Pipeline:**
- Run unit tests on every commit
- Run integration tests on PR merge
- Run E2E tests nightly

### Coverage Targets

| Test Type | Target | Rationale |
|-----------|--------|-----------|
| **Unit Tests** | 95% for mechanics logic | High confidence in calculations |
| **Integration Tests** | 80% for workflows | Validate module interactions |
| **End-to-End Tests** | Manual playtest of all ACs | Validate user experience |

### Test Scenarios by AC

- **AC-1:** Unit test for dice rolling (1000+ rolls, distribution check)
- **AC-2:** Integration test for character creation
- **AC-3:** Integration test for ability check workflow
- **AC-4:** Integration test for combat initiative
- **AC-5:** Integration test for attack resolution
- **AC-6:** Integration test for spell casting
- **AC-7:** Unit test for spell slot tracking
- **AC-8:** Integration test for inventory management
- **AC-9:** Integration test for level up
- **AC-10, AC-11:** Integration tests for rests
- **AC-12:** Integration test for condition tracking
- **AC-13:** Unit test for death saves
- **AC-14:** Manual test for all mechanics commands
- **AC-15, AC-16:** Integration tests for Epic 1/2 integration

### Edge Cases to Test

1. **Dice rolls at extremes** - Natural 1, natural 20, all max/min rolls
2. **Ability scores at boundaries** - Score 1 (mod -5), score 20 (mod +5)
3. **HP at 0** - Unconscious, death saves, stabilization
4. **Negative HP** - Instant death at -max HP
5. **Spell slots exhausted** - Prevent casting with 0 slots
6. **Weight over capacity** - Encumbrance, movement penalty
7. **Conditions stacking** - Poisoned + frightened + prone
8. **Critical hits** - Double dice, not modifier
9. **Advantage/disadvantage** - Roll twice, take higher/lower
10. **Level 20 cap** - Prevent level 21+

### Performance Testing

**Load Testing:**
- 1000 consecutive dice rolls - measure total time
- 100 ability checks - measure average time
- 10-combatant combat - measure turn advance time
- Large spell database (300 spells) - measure query time

**Benchmark Targets:**
- Dice roll: < 10ms (AC-1)
- Ability check: < 50ms (AC-3)
- Attack resolution: < 100ms (AC-5)
- Spell cast: < 200ms (AC-6)
- Long rest: < 2 seconds (AC-10)

### Manual Testing Checklist

Before Epic 3 sign-off:
- [ ] Create character with all 4 classes (Fighter, Cleric, Rogue, Wizard)
- [ ] Make ability checks with advantage, disadvantage, normal
- [ ] Engage in combat (initiative, attacks, damage, HP)
- [ ] Cast spells (damage, healing, spell slot consumption)
- [ ] Take short rest (spend hit dice, recover resources)
- [ ] Take long rest (restore HP, spell slots, advance time)
- [ ] Level up character (HP increase, feature unlock)
- [ ] Apply conditions (poisoned, frightened, check effects)
- [ ] Death saves (fail 3 times, succeed 3 times, stabilize)
- [ ] All `/roll`, `/check`, `/attack`, `/cast`, `/rest` commands
- [ ] Verify character state persists across session end/resume
- [ ] Check all log files created correctly (mechanics, combat, audit)

### Definition of Done

Epic 3 is complete when:
✅ All 16 acceptance criteria verified passing
✅ Unit test coverage ≥ 95% for mechanics modules
✅ Integration tests passing for all workflows
✅ Manual playtest completed successfully
✅ All P0/P1 performance targets met
✅ No critical bugs remaining
✅ Documentation complete (character schema, SRD data format)
✅ Code reviewed and merged
✅ sprint-status.yaml updated (epic-3 status = "contexted")
