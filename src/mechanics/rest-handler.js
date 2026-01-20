/**
 * D&D 5e Rest Handler
 *
 * Manages short rest and long rest mechanics per D&D 5e SRD rules.
 *
 * Long Rest (8 hours):
 * - Restore HP to maximum
 * - Restore all spell slots to maximum
 * - Recover half spent hit dice (rounded down, min 1)
 * - Reduce exhaustion by 1 level
 * - Advance game time 8 hours
 *
 * Short Rest (1 hour):
 * - Spend hit dice to regain HP (roll hit die + Con modifier)
 * - Restore short rest class features (Fighter Second Wind, Warlock Pact Magic, Monk Ki)
 * - Advance game time 1 hour
 *
 * @module rest-handler
 */

class RestHandler {
  /**
   * Create a RestHandler instance
   * @param {Object} deps - Dependencies
   * @param {Object} deps.characterManager - Character management service
   * @param {Object} deps.calendarManager - Calendar/time management service
   * @param {Object} deps.diceRoller - Dice rolling service
   * @param {Object} deps.conditionTracker - Condition tracking service
   * @param {Object} deps.eventScheduler - Event scheduling service (optional)
   */
  constructor(deps = {}) {
    this.deps = deps;
    this._characterManager = deps.characterManager || null;
    this._calendarManager = deps.calendarManager || null;
    this._diceRoller = deps.diceRoller || null;
    this._conditionTracker = deps.conditionTracker || null;
    this._eventScheduler = deps.eventScheduler || null;
  }

  /**
   * Lazy-loaded CharacterManager getter
   * @returns {Object} CharacterManager instance
   */
  get characterManager() {
    if (!this._characterManager) {
      const CharacterManager = require('./character-manager.js');
      this._characterManager = new CharacterManager();
    }
    return this._characterManager;
  }

  /**
   * Lazy-loaded CalendarManager getter
   * @returns {Object} CalendarManager instance
   */
  get calendarManager() {
    if (!this._calendarManager) {
      const CalendarManager = require('../calendar/calendar-manager.js');
      this._calendarManager = new CalendarManager();
    }
    return this._calendarManager;
  }

  /**
   * Lazy-loaded DiceRoller getter
   * @returns {Object} DiceRoller instance
   */
  get diceRoller() {
    if (!this._diceRoller) {
      const DiceRoller = require('./dice-roller.js');
      this._diceRoller = new DiceRoller();
    }
    return this._diceRoller;
  }

  /**
   * Lazy-loaded ConditionTracker getter
   * @returns {Object} ConditionTracker instance
   */
  get conditionTracker() {
    if (!this._conditionTracker) {
      const ConditionTracker = require('./condition-tracker.js');
      this._conditionTracker = new ConditionTracker();
    }
    return this._conditionTracker;
  }

  /**
   * Execute a long rest (8 hours)
   * Restores HP to max, all spell slots, recovers half spent hit dice (min 1), reduces exhaustion by 1 level
   *
   * @param {Object} character - Character object
   * @param {Object} options - Rest options
   * @param {boolean} options.interrupted - Whether rest was interrupted
   * @param {number} options.timeElapsed - Time elapsed before interruption (hours)
   * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
   *
   * @example
   * const result = await restHandler.longRest(character);
   * // result.data: {restType: "long", duration: "8 hours", hpRestored: 7, slotsRestored: true, hitDiceRecovered: 1, exhaustionReduced: false, timeAdvanced: "8 hours", newTime: "735-10-16 06:00"}
   */
  async longRest(character, options = {}) {
    const { interrupted = false, timeElapsed = 0 } = options;

    // Initialize result data
    const resultData = {
      restType: 'long',
      duration: '8 hours',
      hpRestored: 0,
      slotsRestored: false,
      hitDiceRecovered: 0,
      exhaustionReduced: false,
      timeAdvanced: null,
      newTime: null,
      interrupted: interrupted
    };

    try {
      // Handle interruption
      if (interrupted) {
        // Advance time by elapsed amount (no benefits)
        const timeResult = this.calendarManager.advanceTime(timeElapsed, 'hours', 'Long rest (interrupted)');
        if (timeResult && timeResult.success) {
          resultData.timeAdvanced = `${timeElapsed} hours`;
          resultData.newTime = timeResult.data?.newTime || null;
        }

        return {
          success: false,
          data: resultData,
          error: 'Rest interrupted - no benefits gained'
        };
      }

      // Validate character has required fields
      if (!character.hitPoints) {
        return {
          success: false,
          data: null,
          error: 'Character missing hitPoints data'
        };
      }

      // Store original HP for calculating restoration
      const originalHp = character.hitPoints.current || 0;
      const maxHp = character.hitPoints.max || 0;

      // 1. Restore HP to maximum
      character.hitPoints.current = maxHp;
      resultData.hpRestored = maxHp - originalHp;

      // 2. Restore all spell slots to maximum
      if (character.spellcasting && character.spellcasting.spellSlots) {
        const slots = character.spellcasting.spellSlots;
        for (const level in slots) {
          if (slots[level] && typeof slots[level] === 'object') {
            slots[level].current = slots[level].max || 0;
          }
        }
        resultData.slotsRestored = true;
      }

      // 3. Recover half spent hit dice (rounded down, min 1)
      if (character.hitPoints.hitDice) {
        const hitDice = character.hitPoints.hitDice;
        const spent = hitDice.spent || 0;

        if (spent > 0) {
          const recovered = Math.max(1, Math.floor(spent / 2));
          hitDice.spent = Math.max(0, spent - recovered);
          resultData.hitDiceRecovered = recovered;
        }
      }

      // 4. Reduce exhaustion by 1 level (if character has exhaustion)
      if (character.conditions && Array.isArray(character.conditions)) {
        const exhaustionCondition = character.conditions.find(c => c.name === 'exhaustion');
        if (exhaustionCondition) {
          // Use ConditionTracker to remove exhaustion
          const removeResult = await this.conditionTracker.removeCondition(
            character,
            'exhaustion',
            { reason: 'long rest' }
          );

          if (removeResult && removeResult.success) {
            resultData.exhaustionReduced = true;
          }
        }
      }

      // 5. Advance game time 8 hours
      const timeResult = this.calendarManager.advanceTime(8, 'hours', 'Long rest');
      if (timeResult && timeResult.success) {
        resultData.timeAdvanced = '8 hours';
        resultData.newTime = timeResult.data?.newTime || null;
      }

      // 6. Persist character changes
      const saveResult = await this.characterManager.saveCharacter(character);
      if (!saveResult || !saveResult.success) {
        return {
          success: false,
          data: null,
          error: `Failed to save character: ${saveResult?.error || 'Unknown error'}`
        };
      }

      return {
        success: true,
        data: resultData,
        error: null
      };

    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Long rest failed: ${error.message}`
      };
    }
  }

  /**
   * Execute a short rest (1 hour)
   * Allows spending hit dice to regain HP, restores short rest class features
   *
   * @param {Object} character - Character object
   * @param {Object} options - Rest options
   * @param {number} options.hitDiceToSpend - Number of hit dice to spend for healing (default: 0)
   * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
   *
   * @example
   * const result = await restHandler.shortRest(character, {hitDiceToSpend: 2});
   * // result.data: {restType: "short", duration: "1 hour", hpRestored: 14, hitDiceRolls: [{die: "1d10", roll: 7, modifier: 2, healing: 9}, ...], hitDiceSpent: 2, classFeatures: ["Second Wind"], timeAdvanced: "1 hour"}
   */
  async shortRest(character, options = {}) {
    const { hitDiceToSpend = 0 } = options;

    // Initialize result data
    const resultData = {
      restType: 'short',
      duration: '1 hour',
      hpRestored: 0,
      hitDiceRolls: [],
      hitDiceSpent: 0,
      classFeatures: [],
      timeAdvanced: null,
      newTime: null
    };

    try {
      // Validate character has required fields
      if (!character.hitPoints) {
        return {
          success: false,
          data: null,
          error: 'Character missing hitPoints data'
        };
      }

      // Validate hit dice request
      const hitDice = character.hitPoints.hitDice || { total: 0, spent: 0 };
      const available = (hitDice.total || 0) - (hitDice.spent || 0);

      if (hitDiceToSpend > available) {
        return {
          success: false,
          data: null,
          error: `Insufficient hit dice: ${available} available, ${hitDiceToSpend} requested`
        };
      }

      if (hitDiceToSpend < 0) {
        return {
          success: false,
          data: null,
          error: 'Hit dice to spend cannot be negative'
        };
      }

      // Get Constitution modifier
      const conModifier = this._getAbilityModifier(character.abilities?.constitution || 10);

      // Store original HP
      const originalHp = character.hitPoints.current || 0;
      const maxHp = character.hitPoints.max || 0;
      let totalHealing = 0;

      // Spend hit dice for healing
      if (hitDiceToSpend > 0) {
        const hitDieType = this._getHitDieType(character.class);

        for (let i = 0; i < hitDiceToSpend; i++) {
          // Roll hit die
          const rollResult = this.diceRoller.roll(hitDieType);
          if (!rollResult || !rollResult.success) {
            return {
              success: false,
              data: null,
              error: `Failed to roll hit die: ${rollResult?.error || 'Unknown error'}`
            };
          }

          const roll = rollResult.data.total || 0;
          const healing = roll + conModifier;
          totalHealing += healing;

          resultData.hitDiceRolls.push({
            die: hitDieType,
            roll: roll,
            modifier: conModifier,
            healing: healing
          });
        }

        // Apply healing (capped at max HP)
        character.hitPoints.current = Math.min(originalHp + totalHealing, maxHp);
        resultData.hpRestored = character.hitPoints.current - originalHp;

        // Mark hit dice as spent
        if (!character.hitPoints.hitDice) {
          character.hitPoints.hitDice = { total: character.level || 1, spent: 0 };
        }
        character.hitPoints.hitDice.spent += hitDiceToSpend;
        resultData.hitDiceSpent = hitDiceToSpend;
      }

      // Restore short rest class features
      const restoredFeatures = this._restoreShortRestResources(character);
      resultData.classFeatures = restoredFeatures;

      // Advance game time 1 hour
      const timeResult = this.calendarManager.advanceTime(1, 'hour', 'Short rest');
      if (timeResult && timeResult.success) {
        resultData.timeAdvanced = '1 hour';
        resultData.newTime = timeResult.data?.newTime || null;
      }

      // Persist character changes
      const saveResult = await this.characterManager.saveCharacter(character);
      if (!saveResult || !saveResult.success) {
        return {
          success: false,
          data: null,
          error: `Failed to save character: ${saveResult?.error || 'Unknown error'}`
        };
      }

      return {
        success: true,
        data: resultData,
        error: null
      };

    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Short rest failed: ${error.message}`
      };
    }
  }

  /**
   * Get hit die type for character class
   * @private
   * @param {string} className - Character class name
   * @returns {string} Hit die notation (e.g., "1d10")
   */
  _getHitDieType(className) {
    if (!className) return '1d8'; // Default

    const classLower = className.toLowerCase();

    // D&D 5e hit die by class
    const hitDiceMap = {
      'barbarian': '1d12',
      'fighter': '1d10',
      'paladin': '1d10',
      'ranger': '1d10',
      'bard': '1d8',
      'cleric': '1d8',
      'druid': '1d8',
      'monk': '1d8',
      'rogue': '1d8',
      'warlock': '1d8',
      'sorcerer': '1d6',
      'wizard': '1d6'
    };

    return hitDiceMap[classLower] || '1d8'; // Default to d8 if class not found
  }

  /**
   * Calculate ability modifier from ability score
   * @private
   * @param {number} abilityScore - Ability score (e.g., 16)
   * @returns {number} Ability modifier (e.g., +3)
   */
  _getAbilityModifier(abilityScore) {
    return Math.floor((abilityScore - 10) / 2);
  }

  /**
   * Restore short rest class features
   * @private
   * @param {Object} character - Character object
   * @returns {string[]} Array of restored feature names
   */
  _restoreShortRestResources(character) {
    const restored = [];

    if (!character.classFeatures) {
      character.classFeatures = {};
    }

    const className = character.class?.toLowerCase() || '';

    // Fighter: Second Wind
    if (className === 'fighter') {
      if (character.classFeatures.secondWind) {
        character.classFeatures.secondWind.used = 0;
        restored.push('Second Wind');
      }
    }

    // Warlock: Pact Magic spell slots (short rest recovery)
    if (className === 'warlock' && character.spellcasting) {
      if (character.spellcasting.spellSlots) {
        const slots = character.spellcasting.spellSlots;
        for (const level in slots) {
          if (slots[level] && typeof slots[level] === 'object') {
            slots[level].current = slots[level].max || 0;
          }
        }
        restored.push('Pact Magic');
      }
    }

    // Monk: Ki points
    if (className === 'monk') {
      if (character.classFeatures.kiPoints) {
        character.classFeatures.kiPoints.current = character.classFeatures.kiPoints.max || 0;
        restored.push('Ki Points');
      }
    }

    return restored;
  }
}

module.exports = RestHandler;
