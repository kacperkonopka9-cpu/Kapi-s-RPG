/**
 * Mechanics Command Handler
 *
 * Provides VS Code slash command interface for D&D 5e mechanics operations.
 * Integrates all Epic 3 mechanics modules into unified command interface.
 *
 * Available Commands:
 * - /roll [dice] - Roll dice with notation (1d20+5, 2d6, advantage/disadvantage)
 * - /check [ability] [DC] - Make ability check (strength, dexterity, etc.)
 * - /skill [skill] [DC] - Make skill check with proficiency
 * - /attack [target] - Attack target in combat
 * - /cast [spell] - Cast spell (consumes spell slot)
 * - /rest [short|long] - Take short or long rest
 * - /level-up - Level up character (if eligible)
 * - /award-xp [amount] [reason] - Award XP to character (checks level-up eligibility)
 * - /equip [item] [slot] - Equip item to equipment slot
 * - /unequip [slot] - Unequip item from slot
 * - /attune [item] - Attune to magic item (max 3)
 * - /unattune [item] - Unattune from magic item
 * - /equipment - Show all equipped items and attunement
 * - /set-character [id] - Set active character for session
 * - /mechanics-help - Display command help
 *
 * Architecture:
 * - Command Registry Pattern: Maps command names to handler methods
 * - Result Object Pattern: All methods return {success, data, error}
 * - Dependency Injection: All modules injected via constructor for testability
 * - Active Character State: Stores active character in memory for command reuse
 *
 * @module MechanicsCommandHandler
 */

const fs = require('fs').promises;
const path = require('path');

class MechanicsCommandHandler {
  /**
   * Create mechanics command handler
   *
   * @param {Object} deps - Injected dependencies
   * @param {Object} deps.diceRoller - DiceRoller instance (from Story 3-1)
   * @param {Object} deps.characterManager - CharacterManager instance (from Story 3-2)
   * @param {Object} deps.abilityCheckHandler - AbilityCheckHandler instance (from Story 3-3)
   * @param {Object} deps.skillCheckSystem - SkillCheckSystem instance (from Story 3-4)
   * @param {Object} deps.combatManager - CombatManager instance (from Story 3-5)
   * @param {Object} deps.attackResolver - AttackResolver instance (from Story 3-5)
   * @param {Object} deps.spellDatabase - SpellDatabase instance (from Story 3-6)
   * @param {Object} deps.spellManager - SpellManager instance (from Story 3-7)
   * @param {Object} deps.inventoryManager - InventoryManager instance (from Story 3-8)
   * @param {Object} deps.levelUpCalculator - LevelUpCalculator instance (from Story 3-9)
   * @param {Object} deps.restHandler - RestHandler instance (from Story 3-13)
   * @param {Object} deps.equipmentManager - EquipmentManager instance (from Story 3-14)
   * @param {Object} deps.sessionLogger - SessionLogger instance (from Epic 1)
   * @param {Object} deps.timeManager - TimeManager instance (from Epic 2)
   * @param {Object} deps.eventScheduler - EventScheduler instance (from Epic 2)
   */
  constructor(deps = {}) {
    // Lazy-load dependencies (loaded on first use if not injected)
    this._deps = deps;
    this._diceRoller = deps.diceRoller || null;
    this._characterManager = deps.characterManager || null;
    this._abilityCheckHandler = deps.abilityCheckHandler || null;
    this._skillCheckSystem = deps.skillCheckSystem || null;
    this._combatManager = deps.combatManager || null;
    this._attackResolver = deps.attackResolver || null;
    this._spellDatabase = deps.spellDatabase || null;
    this._spellManager = deps.spellManager || null;
    this._inventoryManager = deps.inventoryManager || null;
    this._levelUpCalculator = deps.levelUpCalculator || null;
    this._restHandler = deps.restHandler || null;
    this._equipmentManager = deps.equipmentManager || null;
    this._sessionLogger = deps.sessionLogger || null;
    this._timeManager = deps.timeManager || null;
    this._eventScheduler = deps.eventScheduler || null;

    // Active character state
    this.activeCharacter = null;
    this.activeCharacterId = null;

    // Command registry
    this.commands = {
      'roll': this.handleRoll.bind(this),
      'check': this.handleCheck.bind(this),
      'skill': this.handleSkill.bind(this),
      'attack': this.handleAttack.bind(this),
      'cast': this.handleCast.bind(this),
      'rest': this.handleRest.bind(this),
      'level-up': this.handleLevelUp.bind(this),
      'award-xp': this.handleAwardXP.bind(this),
      'equip': this.handleEquip.bind(this),
      'unequip': this.handleUnequip.bind(this),
      'attune': this.handleAttune.bind(this),
      'unattune': this.handleUnattune.bind(this),
      'equipment': this.handleEquipment.bind(this),
      'set-character': this.handleSetCharacter.bind(this),
      'mechanics-help': this.handleHelp.bind(this)
    };
  }

  // Lazy-load modules on first use
  get diceRoller() {
    if (!this._diceRoller) {
      const DiceRoller = require('../mechanics/dice-roller');
      this._diceRoller = new DiceRoller();
    }
    return this._diceRoller;
  }

  get characterManager() {
    if (!this._characterManager) {
      const CharacterManager = require('../mechanics/character-manager');
      this._characterManager = new CharacterManager();
    }
    return this._characterManager;
  }

  get abilityCheckHandler() {
    if (!this._abilityCheckHandler) {
      const AbilityCheckHandler = require('../mechanics/ability-check-handler');
      this._abilityCheckHandler = new AbilityCheckHandler({ diceRoller: this.diceRoller });
    }
    return this._abilityCheckHandler;
  }

  get skillCheckSystem() {
    if (!this._skillCheckSystem) {
      const SkillCheckSystem = require('../mechanics/skill-check-system');
      this._skillCheckSystem = new SkillCheckSystem({ diceRoller: this.diceRoller });
    }
    return this._skillCheckSystem;
  }

  get combatManager() {
    if (!this._combatManager) {
      const CombatManager = require('../mechanics/combat-manager');
      this._combatManager = new CombatManager();
    }
    return this._combatManager;
  }

  get attackResolver() {
    if (!this._attackResolver) {
      const AttackResolver = require('../mechanics/attack-resolver');
      this._attackResolver = new AttackResolver({ diceRoller: this.diceRoller });
    }
    return this._attackResolver;
  }

  get spellDatabase() {
    if (!this._spellDatabase) {
      const SpellDatabase = require('../mechanics/spell-database');
      this._spellDatabase = new SpellDatabase();
    }
    return this._spellDatabase;
  }

  get spellManager() {
    if (!this._spellManager) {
      const SpellManager = require('../mechanics/spell-manager');
      this._spellManager = new SpellManager({
        spellDatabase: this.spellDatabase,
        diceRoller: this.diceRoller
      });
    }
    return this._spellManager;
  }

  get inventoryManager() {
    if (!this._inventoryManager) {
      const InventoryManager = require('../mechanics/inventory-manager');
      this._inventoryManager = new InventoryManager();
    }
    return this._inventoryManager;
  }

  get equipmentManager() {
    if (!this._equipmentManager) {
      const EquipmentManager = require('../mechanics/equipment-manager');
      const ItemDatabase = require('../mechanics/item-database');
      this._equipmentManager = new EquipmentManager({
        characterManager: this.characterManager,
        itemDatabase: new ItemDatabase()
      });
    }
    return this._equipmentManager;
  }

  get levelUpCalculator() {
    if (!this._levelUpCalculator) {
      const LevelUpCalculator = require('../mechanics/level-up-calculator');
      this._levelUpCalculator = new LevelUpCalculator({
        diceRoller: this.diceRoller,
        characterManager: this.characterManager,
        inventoryManager: this.inventoryManager
      });
    }
    return this._levelUpCalculator;
  }

  /**
   * Execute command by name with arguments
   *
   * @param {string} commandName - Command name (e.g., "roll", "check")
   * @param {string[]} args - Command arguments
   * @returns {Promise<{success: boolean, data: any | null, error: string | null}>}
   */
  async executeCommand(commandName, args) {
    const handler = this.commands[commandName];

    if (!handler) {
      const errorResult = {
        success: false,
        data: null,
        error: `Unknown command: ${commandName}. Use /mechanics-help for available commands.`
      };

      // Log unknown command
      await this._logCommand(commandName, args, errorResult);

      return errorResult;
    }

    try {
      const result = await handler(args);

      // Log command execution
      await this._logCommand(commandName, args, result);

      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        data: null,
        error: `Command error: ${error.message}. Usage: ${this._getUsage(commandName)}`
      };

      await this._logCommand(commandName, args, errorResult);

      return errorResult;
    }
  }

  /**
   * Handle /roll command - Roll dice with notation
   *
   * @param {string[]} args - [dice_notation] e.g., ["1d20+5"], ["2d6"], ["1d20", "advantage"]
   * @returns {Promise<{success: boolean, data: object, error: string | null}>}
   */
  async handleRoll(args) {
    if (args.length === 0) {
      return {
        success: false,
        data: null,
        error: 'Missing dice notation. Usage: /roll [dice] - Example: /roll 1d20+5'
      };
    }

    // Parse notation and modifiers (advantage/disadvantage)
    const notation = args[0];
    const modifiers = args.slice(1).join(' ').toLowerCase();
    const hasAdvantage = modifiers.includes('advantage') && !modifiers.includes('disadvantage');
    const hasDisadvantage = modifiers.includes('disadvantage');

    // Roll dice
    const rollResult = await this.diceRoller.roll(notation, { advantage: hasAdvantage, disadvantage: hasDisadvantage });

    if (!rollResult.success) {
      return {
        success: false,
        data: null,
        error: `Invalid dice notation: ${notation}. ${rollResult.error}`
      };
    }

    const { rolls, modifier, total } = rollResult.data;

    // Format output
    const rollsStr = Array.isArray(rolls) ? `[${rolls.join(', ')}]` : `[${rolls}]`;
    const modifierStr = modifier !== 0 ? ` ${modifier >= 0 ? '+' : ''}${modifier}` : '';
    const advantageStr = hasAdvantage ? ' (advantage)' : hasDisadvantage ? ' (disadvantage)' : '';

    return {
      success: true,
      data: {
        notation,
        rolls,
        modifier,
        total,
        advantage: hasAdvantage,
        disadvantage: hasDisadvantage,
        formatted: `${notation}: ${rollsStr}${modifierStr} = ${total}${advantageStr}`
      },
      error: null
    };
  }

  /**
   * Handle /check command - Make ability check
   *
   * @param {string[]} args - [ability, DC] e.g., ["strength", "15"]
   * @returns {Promise<{success: boolean, data: object, error: string | null}>}
   */
  async handleCheck(args) {
    if (args.length < 2) {
      return {
        success: false,
        data: null,
        error: 'Missing arguments. Usage: /check [ability] [DC] - Example: /check strength 15'
      };
    }

    // Check for active character
    if (!this.activeCharacter) {
      return {
        success: false,
        data: null,
        error: 'No active character set. Use /set-character [id] first.'
      };
    }

    const ability = args[0].toLowerCase();
    const DC = parseInt(args[1], 10);

    if (isNaN(DC)) {
      return {
        success: false,
        data: null,
        error: `Invalid DC: ${args[1]}. DC must be a number.`
      };
    }

    // Perform ability check
    const checkResult = await this.abilityCheckHandler.performCheck(this.activeCharacter, ability, DC);

    if (!checkResult.success) {
      return {
        success: false,
        data: null,
        error: checkResult.error
      };
    }

    const { roll, modifier, total, passed } = checkResult.data;
    const abilityName = ability.charAt(0).toUpperCase() + ability.slice(1);
    const result = passed ? 'SUCCESS' : 'FAIL';

    return {
      success: true,
      data: {
        ability,
        roll,
        modifier,
        total,
        DC,
        passed,
        formatted: `${abilityName} Check: 1d20(${roll}) + ${modifier} = ${total} vs DC ${DC} → ${result}`
      },
      error: null
    };
  }

  /**
   * Handle /skill command - Make skill check with proficiency
   *
   * @param {string[]} args - [skill, DC] e.g., ["perception", "12"]
   * @returns {Promise<{success: boolean, data: object, error: string | null}>}
   */
  async handleSkill(args) {
    if (args.length < 2) {
      return {
        success: false,
        data: null,
        error: 'Missing arguments. Usage: /skill [skill_name] [DC] - Example: /skill perception 12'
      };
    }

    // Check for active character
    if (!this.activeCharacter) {
      return {
        success: false,
        data: null,
        error: 'No active character set. Use /set-character [id] first.'
      };
    }

    const skill = args[0].toLowerCase();
    const DC = parseInt(args[1], 10);

    if (isNaN(DC)) {
      return {
        success: false,
        data: null,
        error: `Invalid DC: ${args[1]}. DC must be a number.`
      };
    }

    // Perform skill check
    const checkResult = await this.skillCheckSystem.performSkillCheck(this.activeCharacter, skill, DC);

    if (!checkResult.success) {
      return {
        success: false,
        data: null,
        error: checkResult.error
      };
    }

    const { roll, abilityMod, proficiencyBonus, total, passed, isProficient } = checkResult.data;
    const skillName = skill.charAt(0).toUpperCase() + skill.slice(1);
    const result = passed ? 'SUCCESS' : 'FAIL';
    const profStr = isProficient ? ` + ${proficiencyBonus} (proficient)` : ' (not proficient)';

    return {
      success: true,
      data: {
        skill,
        roll,
        abilityMod,
        proficiencyBonus,
        total,
        DC,
        passed,
        isProficient,
        formatted: `${skillName} Check: 1d20(${roll}) + ${abilityMod}${profStr} = ${total} vs DC ${DC} → ${result}`
      },
      error: null
    };
  }

  /**
   * Handle /attack command - Attack target in combat
   *
   * @param {string[]} args - [target_name] e.g., ["zombie"]
   * @returns {Promise<{success: boolean, data: object, error: string | null}>}
   */
  async handleAttack(args) {
    if (args.length === 0) {
      return {
        success: false,
        data: null,
        error: 'Missing target. Usage: /attack [target] - Example: /attack zombie'
      };
    }

    // Check for active character
    if (!this.activeCharacter) {
      return {
        success: false,
        data: null,
        error: 'No active character set. Use /set-character [id] first.'
      };
    }

    const targetName = args.join(' ');

    // Get combat state (required for attack)
    const combatState = this.combatManager.getCurrentCombat();
    if (!combatState) {
      return {
        success: false,
        data: null,
        error: 'No active combat. Use CombatManager to start combat first.'
      };
    }

    // Find target in combat
    const target = combatState.combatants.find(c =>
      c.name.toLowerCase() === targetName.toLowerCase()
    );

    if (!target) {
      return {
        success: false,
        data: null,
        error: `Target not found: ${targetName}. Available targets: ${combatState.combatants.map(c => c.name).join(', ')}`
      };
    }

    // Get equipped weapon
    const weapon = this.activeCharacter.inventory?.equipped?.mainHand;
    if (!weapon) {
      return {
        success: false,
        data: null,
        error: 'No weapon equipped. Equip a weapon first.'
      };
    }

    // Resolve attack
    const attackResult = await this.attackResolver.resolveAttack(this.activeCharacter, target, weapon);

    if (!attackResult.success) {
      return {
        success: false,
        data: null,
        error: attackResult.error
      };
    }

    const { hit, attackRoll, damage, damageType, isCritical } = attackResult.data;
    const hitStr = hit ? 'HIT' : 'MISS';
    const critStr = isCritical ? ' (CRITICAL!)' : '';
    const oldHP = target.hitPoints.current;
    const newHP = oldHP - (hit ? damage : 0);

    // Update target HP if hit
    if (hit) {
      target.hitPoints.current = Math.max(0, newHP);
    }

    return {
      success: true,
      data: {
        attacker: this.activeCharacter.name,
        target: target.name,
        hit,
        attackRoll,
        damage: hit ? damage : 0,
        damageType,
        isCritical,
        targetHP: { old: oldHP, new: target.hitPoints.current },
        formatted: `Attack: ${this.activeCharacter.name} attacks ${target.name} → ${hitStr}${critStr} (AC ${target.armorClass} vs ${attackRoll}). ${hit ? `Damage: ${damage} ${damageType}. ${target.name} HP: ${oldHP} → ${target.hitPoints.current}` : ''}`
      },
      error: null
    };
  }

  /**
   * Handle /cast command - Cast spell
   *
   * @param {string[]} args - [spell_name, target_name?] e.g., ["cure wounds"], ["fireball", "goblin"]
   * @returns {Promise<{success: boolean, data: object, error: string | null}>}
   */
  async handleCast(args) {
    if (args.length === 0) {
      return {
        success: false,
        data: null,
        error: 'Missing spell name. Usage: /cast [spell] - Example: /cast cure wounds'
      };
    }

    // Check for active character
    if (!this.activeCharacter) {
      return {
        success: false,
        data: null,
        error: 'No active character set. Use /set-character [id] first.'
      };
    }

    const spellName = args[0];
    const targetName = args.slice(1).join(' ');

    // Query spell from database
    const spellResult = await this.spellDatabase.getSpell(spellName);

    if (!spellResult.success) {
      return {
        success: false,
        data: null,
        error: `Spell not found: ${spellName}. ${spellResult.error}`
      };
    }

    const spell = spellResult.data;

    // Find target if specified
    let target = null;
    if (targetName) {
      const combatState = this.combatManager.getCurrentCombat();
      if (combatState) {
        target = combatState.combatants.find(c =>
          c.name.toLowerCase() === targetName.toLowerCase()
        );
      }

      if (!target && targetName !== 'self') {
        target = this.activeCharacter; // Default to self if no target found
      } else if (targetName === 'self') {
        target = this.activeCharacter;
      }
    }

    // Cast spell
    const castResult = await this.spellManager.castSpell(this.activeCharacter, spell, target);

    if (!castResult.success) {
      return {
        success: false,
        data: null,
        error: castResult.error
      };
    }

    const { slotConsumed, slotsRemaining, effect } = castResult.data;
    const slotStr = slotConsumed ? ` (${spell.level} level slot consumed, ${slotsRemaining} remaining)` : ' (cantrip, no slot consumed)';

    return {
      success: true,
      data: {
        spell: spell.name,
        level: spell.level,
        slotConsumed,
        slotsRemaining,
        effect,
        target: target ? target.name : 'none',
        formatted: `Cast ${spell.name}${slotStr}. Effect: ${effect.description || effect}`
      },
      error: null
    };
  }

  /**
   * Handle /rest command - Take short or long rest
   *
   * @param {string[]} args - [rest_type] e.g., ["short"], ["long"]
   * @returns {Promise<{success: boolean, data: object, error: string | null}>}
   */
  async handleRest(args) {
    if (args.length === 0) {
      return {
        success: false,
        data: null,
        error: 'Missing rest type. Usage: /rest [short|long] - Example: /rest long'
      };
    }

    // Check for active character
    if (!this.activeCharacter) {
      return {
        success: false,
        data: null,
        error: 'No active character set. Use /set-character [id] first.'
      };
    }

    const restType = args[0].toLowerCase();

    if (restType !== 'short' && restType !== 'long') {
      return {
        success: false,
        data: null,
        error: `Invalid rest type: ${restType}. Use "short" or "long".`
      };
    }

    // Note: RestHandler is from Story 3-13 (Rest Mechanics) which is not yet implemented
    // This is a placeholder implementation that will be replaced when RestHandler is available

    if (restType === 'short') {
      // Short rest: 1 hour, can spend hit dice, recover short rest abilities
      const hpHealed = 0; // Placeholder - will use RestHandler.shortRest()

      return {
        success: true,
        data: {
          restType: 'short',
          duration: '1 hour',
          hpHealed,
          hitDiceSpent: 0,
          resourcesRecovered: ['short rest abilities'],
          formatted: `Short Rest (1 hour). HP healed: ${hpHealed}. Short rest abilities recharged.`
        },
        error: null
      };
    } else {
      // Long rest: 8 hours, restore HP/slots/hit dice
      const oldHP = this.activeCharacter.hitPoints.current;
      const maxHP = this.activeCharacter.hitPoints.max;

      // Restore HP to max
      this.activeCharacter.hitPoints.current = maxHP;

      // Restore spell slots (if spellcaster)
      // Placeholder - will use RestHandler.longRest()

      return {
        success: true,
        data: {
          restType: 'long',
          duration: '8 hours',
          hpRestored: maxHP - oldHP,
          maxHP,
          slotsRestored: 'all',
          hitDiceRecovered: Math.floor(this.activeCharacter.hitPoints.hitDice.total / 2) || 1,
          formatted: `Long Rest (8 hours). HP restored to max (${maxHP}). All spell slots restored. Hit dice recovered.`
        },
        error: null
      };
    }
  }

  /**
   * Handle /level-up command - Level up character
   *
   * @param {string[]} args - [asi_choices?] optional ASI choices
   * @returns {Promise<{success: boolean, data: object, error: string | null}>}
   */
  async handleLevelUp(args) {
    // Check for active character
    if (!this.activeCharacter) {
      return {
        success: false,
        data: null,
        error: 'No active character set. Use /set-character [id] first.'
      };
    }

    // Check eligibility
    const eligibilityResult = await this.levelUpCalculator.canLevelUp(this.activeCharacter);

    if (!eligibilityResult.success) {
      return {
        success: false,
        data: null,
        error: eligibilityResult.error
      };
    }

    if (!eligibilityResult.data.canLevel) {
      const { currentLevel, xpNeeded, reason } = eligibilityResult.data;
      return {
        success: false,
        data: null,
        error: `Cannot level up. ${reason || `Current level: ${currentLevel}, XP needed: ${xpNeeded}`}`
      };
    }

    // Level up character
    const levelUpResult = await this.levelUpCalculator.levelUp(this.activeCharacter, {
      characterId: this.activeCharacterId
      // TODO: Parse ASI choices from args if provided
    });

    if (!levelUpResult.success) {
      return {
        success: false,
        data: null,
        error: levelUpResult.error
      };
    }

    const { newLevel, hpIncrease, featuresGranted, asiAvailable } = levelUpResult.data;
    const featuresStr = featuresGranted.map(f => f.name).join(', ');
    const asiStr = asiAvailable ? ' ASI available - choose ability score increases.' : '';

    return {
      success: true,
      data: {
        newLevel,
        hpIncrease,
        featuresGranted,
        asiAvailable,
        formatted: `Level Up! ${this.activeCharacter.name} advances to level ${newLevel}. HP: +${hpIncrease}. New features: ${featuresStr}.${asiStr}`
      },
      error: null
    };
  }

  /**
   * Handle /award-xp command - Award experience points to active character
   *
   * Awards XP for combat encounters, quest completion, roleplay achievements,
   * or exploration milestones. Checks for level-up eligibility after award.
   *
   * @param {string[]} args - [amount] [reason?] e.g., ["50", "defeated", "wolves"]
   * @returns {Promise<{success: boolean, data: object, error: string | null}>}
   */
  async handleAwardXP(args) {
    if (args.length === 0) {
      return {
        success: false,
        data: null,
        error: 'Missing XP amount. Usage: /award-xp [amount] [reason] - Example: /award-xp 50 defeated wolves'
      };
    }

    // Check for active character
    if (!this.activeCharacter) {
      return {
        success: false,
        data: null,
        error: 'No active character set. Use /set-character [id] first.'
      };
    }

    // Parse XP amount
    const xpAmount = parseInt(args[0], 10);
    if (isNaN(xpAmount) || xpAmount < 0) {
      return {
        success: false,
        data: null,
        error: `Invalid XP amount: ${args[0]}. Must be a positive number.`
      };
    }

    // Get reason (remaining args joined)
    const reason = args.slice(1).join(' ') || 'unspecified';

    // Get current XP
    const currentXP = this.activeCharacter.experience || 0;
    const newXP = currentXP + xpAmount;

    // Update character's XP
    this.activeCharacter.experience = newXP;

    // Save to character file
    const characterId = this.activeCharacterId;
    const saveResult = await this.characterManager.saveCharacter(characterId, this.activeCharacter);

    if (!saveResult.success) {
      // Revert in-memory change
      this.activeCharacter.experience = currentXP;
      return {
        success: false,
        data: null,
        error: `Failed to save XP: ${saveResult.error}`
      };
    }

    // Check for level-up eligibility
    const eligibilityResult = await this.levelUpCalculator.canLevelUp(this.activeCharacter);
    let levelUpNotice = '';
    let canLevelUp = false;

    if (eligibilityResult.success && eligibilityResult.data.canLevel) {
      canLevelUp = true;
      const nextLevel = eligibilityResult.data.nextLevel;
      levelUpNotice = `\n🎉 LEVEL UP AVAILABLE! ${this.activeCharacter.name} can advance to level ${nextLevel}! Use /level-up to level up.`;
    } else if (eligibilityResult.success) {
      const xpNeeded = eligibilityResult.data.xpNeeded;
      const xpRemaining = xpNeeded - newXP;
      levelUpNotice = `\n📊 ${xpRemaining} XP until level ${this.activeCharacter.level + 1} (need ${xpNeeded} total)`;
    }

    return {
      success: true,
      data: {
        characterName: this.activeCharacter.name,
        xpAwarded: xpAmount,
        reason: reason,
        previousXP: currentXP,
        newXP: newXP,
        canLevelUp: canLevelUp,
        formatted: `✨ **XP Awarded:** +${xpAmount} XP to ${this.activeCharacter.name} (${reason})\n**Total XP:** ${currentXP} → ${newXP}${levelUpNotice}`
      },
      error: null
    };
  }

  /**
   * Handle /set-character command - Set active character for session
   *
   * @param {string[]} args - [character_id] e.g., ["kapi"]
   * @returns {Promise<{success: boolean, data: object, error: string | null}>}
   */
  async handleSetCharacter(args) {
    if (args.length === 0) {
      return {
        success: false,
        data: null,
        error: 'Missing character ID. Usage: /set-character [id] - Example: /set-character kapi'
      };
    }

    const characterId = args[0];

    // Load character
    const loadResult = await this.characterManager.loadCharacter(characterId);

    if (!loadResult.success) {
      // Try to list available characters
      const charactersDir = path.join(process.cwd(), 'characters');
      try {
        const files = await fs.readdir(charactersDir);
        const yamlFiles = files.filter(f => f.endsWith('.yaml'));
        const characterIds = yamlFiles.map(f => f.replace('.yaml', ''));

        return {
          success: false,
          data: null,
          error: `Character not found: ${characterId}. Available characters: ${characterIds.join(', ')}`
        };
      } catch (err) {
        return {
          success: false,
          data: null,
          error: `Character not found: ${characterId}. ${loadResult.error}`
        };
      }
    }

    // Set as active character
    this.activeCharacter = loadResult.data;
    this.activeCharacterId = characterId;

    return {
      success: true,
      data: {
        characterId,
        name: this.activeCharacter.name,
        level: this.activeCharacter.level,
        class: this.activeCharacter.class,
        formatted: `Active character set to: ${this.activeCharacter.name} (Level ${this.activeCharacter.level} ${this.activeCharacter.class})`
      },
      error: null
    };
  }

  /**
   * Handle /mechanics-help command - Display command help
   *
   * @param {string[]} args - No arguments
   * @returns {Promise<{success: boolean, data: object, error: null}>}
   */
  async handleHelp(args) {
    const helpText = `
# D&D 5e Mechanics Commands

| Command | Syntax | Example | Description |
|---------|--------|---------|-------------|
| /roll | /roll [dice] | /roll 1d20+5 | Roll dice with notation. Supports advantage/disadvantage. |
| /check | /check [ability] [DC] | /check strength 15 | Make ability check against DC. |
| /skill | /skill [skill] [DC] | /skill perception 12 | Make skill check with proficiency. |
| /attack | /attack [target] | /attack zombie | Attack target in combat. |
| /cast | /cast [spell] [target?] | /cast cure wounds | Cast spell (consumes spell slot). |
| /rest | /rest [short\\|long] | /rest long | Take short or long rest. |
| /level-up | /level-up | /level-up | Level up character (if eligible). |
| /award-xp | /award-xp [amount] [reason] | /award-xp 50 defeated wolves | Award XP to active character. |
| /set-character | /set-character [id] | /set-character kapi | Set active character for session. |
| /mechanics-help | /mechanics-help | /mechanics-help | Display this help message. |

Active Character: ${this.activeCharacter ? `${this.activeCharacter.name} (Level ${this.activeCharacter.level} ${this.activeCharacter.class})` : 'None (use /set-character first)'}
`;

    return {
      success: true,
      data: {
        helpText,
        formatted: helpText
      },
      error: null
    };
  }

  /**
   * Handle /equip command - Equip item to equipment slot
   *
   * @param {string[]} args - [item_id, slot] e.g., ["longsword", "mainHand"]
   * @returns {Promise<{success: boolean, data: object, error: string | null}>}
   */
  async handleEquip(args) {
    if (args.length < 2) {
      return {
        success: false,
        data: null,
        error: 'Missing arguments. Usage: /equip [item] [slot] - Example: /equip longsword mainHand'
      };
    }

    // Check for active character
    if (!this.activeCharacter) {
      return {
        success: false,
        data: null,
        error: 'No active character. Use /set-character [id] first'
      };
    }

    const [itemId, slot] = args;

    // Equip item
    const result = await this.equipmentManager.equipItem(this.activeCharacter, itemId, slot);

    if (!result.success) {
      return result;
    }

    // Build narrative output
    const itemName = itemId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const formattedSlot = slot.replace(/([A-Z])/g, ' $1').toLowerCase();

    let narrative = `You equip the ${itemName} to your ${formattedSlot}.`;

    if (result.data.newAC) {
      narrative += `\n\nYour AC is now ${result.data.newAC}.`;
    }

    if (!result.data.proficient) {
      narrative += `\n\n⚠️  You are not proficient with this equipment. Attack rolls and AC may be affected.`;
    }

    if (result.data.restrictions && result.data.restrictions.length > 0) {
      narrative += `\n\n⚠️  ${result.data.restrictions.join(', ')}`;
    }

    if (result.data.effects && result.data.effects.length > 0) {
      narrative += `\n\nEffects: ${result.data.effects.join(', ')}`;
    }

    return {
      success: true,
      data: {
        ...result.data,
        formatted: narrative
      },
      error: null
    };
  }

  /**
   * Handle /unequip command - Unequip item from slot
   *
   * @param {string[]} args - [slot] e.g., ["armor"]
   * @returns {Promise<{success: boolean, data: object, error: string | null}>}
   */
  async handleUnequip(args) {
    if (args.length === 0) {
      return {
        success: false,
        data: null,
        error: 'Missing slot. Usage: /unequip [slot] - Example: /unequip armor'
      };
    }

    // Check for active character
    if (!this.activeCharacter) {
      return {
        success: false,
        data: null,
        error: 'No active character. Use /set-character [id] first'
      };
    }

    const slot = args[0];

    // Unequip item
    const result = await this.equipmentManager.unequipItem(this.activeCharacter, slot);

    if (!result.success) {
      return result;
    }

    // Build narrative output
    const itemName = result.data.unequipped.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const formattedSlot = slot.replace(/([A-Z])/g, ' $1').toLowerCase();

    let narrative = `You unequip the ${itemName} from your ${formattedSlot} and store it in your backpack.`;

    if (result.data.newAC) {
      narrative += `\n\nYour AC is now ${result.data.newAC}.`;
    }

    return {
      success: true,
      data: {
        ...result.data,
        formatted: narrative
      },
      error: null
    };
  }

  /**
   * Handle /attune command - Attune to magic item
   *
   * @param {string[]} args - [item_id] e.g., ["ring_of_protection"]
   * @returns {Promise<{success: boolean, data: object, error: string | null}>}
   */
  async handleAttune(args) {
    if (args.length === 0) {
      return {
        success: false,
        data: null,
        error: 'Missing item. Usage: /attune [item] - Example: /attune ring_of_protection'
      };
    }

    // Check for active character
    if (!this.activeCharacter) {
      return {
        success: false,
        data: null,
        error: 'No active character. Use /set-character [id] first'
      };
    }

    const itemId = args[0];

    // Attune to item
    const result = await this.equipmentManager.attuneItem(this.activeCharacter, itemId);

    if (!result.success) {
      return result;
    }

    // Build narrative output
    const itemName = itemId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    let narrative = `You spend a short rest attuning to the ${itemName}.`;
    narrative += `\n\nYou are now attuned to ${result.data.attunedCount} item${result.data.attunedCount !== 1 ? 's' : ''} (max 3).`;

    if (result.data.effects && result.data.effects.length > 0) {
      narrative += `\n\nEffects: ${result.data.effects.join(', ')}`;
    }

    return {
      success: true,
      data: {
        ...result.data,
        formatted: narrative
      },
      error: null
    };
  }

  /**
   * Handle /unattune command - Unattune from magic item
   *
   * @param {string[]} args - [item_id] e.g., ["ring_of_protection"]
   * @returns {Promise<{success: boolean, data: object, error: string | null}>}
   */
  async handleUnattune(args) {
    if (args.length === 0) {
      return {
        success: false,
        data: null,
        error: 'Missing item. Usage: /unattune [item] - Example: /unattune ring_of_protection'
      };
    }

    // Check for active character
    if (!this.activeCharacter) {
      return {
        success: false,
        data: null,
        error: 'No active character. Use /set-character [id] first'
      };
    }

    const itemId = args[0];

    // Unattune from item
    const result = await this.equipmentManager.unattuneItem(this.activeCharacter, itemId);

    if (!result.success) {
      return result;
    }

    // Build narrative output
    const itemName = itemId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    let narrative = `You end your attunement to the ${itemName}.`;
    narrative += `\n\nYou are now attuned to ${result.data.attunedCount} item${result.data.attunedCount !== 1 ? 's' : ''} (max 3).`;

    return {
      success: true,
      data: {
        ...result.data,
        formatted: narrative
      },
      error: null
    };
  }

  /**
   * Handle /equipment command - Show all equipped items and attunement
   *
   * @param {string[]} args - No arguments
   * @returns {Promise<{success: boolean, data: object, error: string | null}>}
   */
  async handleEquipment(args) {
    // Check for active character
    if (!this.activeCharacter) {
      return {
        success: false,
        data: null,
        error: 'No active character. Use /set-character [id] first'
      };
    }

    const character = this.activeCharacter;
    const equipped = character.inventory?.equipped || {};
    const attunement = character.attunement || [];

    // Build narrative output
    let narrative = `**${character.name}'s Equipment**\n\n`;

    // Show AC
    const ac = this.equipmentManager.calculateAC(character);
    narrative += `**Armor Class:** ${ac}\n\n`;

    // Show equipped items
    narrative += `**Equipped Items:**\n`;
    const slots = ['armor', 'mainHand', 'offHand', 'head', 'hands', 'feet', 'neck', 'ring1', 'ring2', 'cloak', 'belt'];

    let hasEquipped = false;
    for (const slot of slots) {
      if (equipped[slot]) {
        const formattedSlot = slot.replace(/([A-Z])/g, ' $1').replace(/\b\w/g, l => l.toUpperCase());
        const itemName = equipped[slot].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        narrative += `- ${formattedSlot}: ${itemName}`;

        // Check if attuned
        if (attunement.includes(equipped[slot])) {
          narrative += ` (attuned)`;
        }

        narrative += `\n`;
        hasEquipped = true;
      }
    }

    if (!hasEquipped) {
      narrative += `- None\n`;
    }

    // Show attunement
    narrative += `\n**Attunement:** ${attunement.length} / 3 items\n`;
    if (attunement.length > 0) {
      for (const itemId of attunement) {
        const itemName = itemId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        narrative += `- ${itemName}\n`;
      }
    }

    return {
      success: true,
      data: {
        equipped: equipped,
        attunement: attunement,
        ac: ac,
        formatted: narrative
      },
      error: null
    };
  }

  /**
   * Log command execution to mechanics activity log
   *
   * @private
   * @param {string} commandName - Command name
   * @param {string[]} args - Command arguments
   * @param {Object} result - Command result
   */
  async _logCommand(commandName, args, result) {
    try {
      const timestamp = new Date().toISOString();
      const argsStr = args.join(' ');
      const status = result.success ? 'SUCCESS' : 'ERROR';
      const summary = result.data?.formatted || result.error || 'No output';

      const logEntry = `[${timestamp}] [COMMAND] /${commandName} ${argsStr} → ${status}: ${summary}\n`;

      // Write to logs/mechanics-YYYY-MM-DD.log
      const logsDir = path.join(process.cwd(), 'logs');
      const date = timestamp.split('T')[0];
      const logFile = path.join(logsDir, `mechanics-${date}.log`);

      // Create logs directory if doesn't exist
      try {
        await fs.mkdir(logsDir, { recursive: true });
      } catch (err) {
        // Directory already exists
      }

      // Append to log file
      await fs.appendFile(logFile, logEntry);
    } catch (error) {
      // Log errors should not break command execution
      console.error('Failed to log command:', error.message);
    }
  }

  /**
   * Get usage string for command
   *
   * @private
   * @param {string} commandName - Command name
   * @returns {string} Usage string
   */
  _getUsage(commandName) {
    const usages = {
      'roll': '/roll [dice] - Example: /roll 1d20+5',
      'check': '/check [ability] [DC] - Example: /check strength 15',
      'skill': '/skill [skill] [DC] - Example: /skill perception 12',
      'attack': '/attack [target] - Example: /attack zombie',
      'cast': '/cast [spell] [target?] - Example: /cast cure wounds',
      'rest': '/rest [short|long] - Example: /rest long',
      'level-up': '/level-up',
      'equip': '/equip [item] [slot] - Example: /equip longsword mainHand',
      'unequip': '/unequip [slot] - Example: /unequip armor',
      'attune': '/attune [item] - Example: /attune ring_of_protection',
      'unattune': '/unattune [item] - Example: /unattune ring_of_protection',
      'equipment': '/equipment - Show equipped items and attunement',
      'set-character': '/set-character [id] - Example: /set-character kapi',
      'mechanics-help': '/mechanics-help'
    };

    return usages[commandName] || '/mechanics-help for available commands';
  }
}

module.exports = MechanicsCommandHandler;
