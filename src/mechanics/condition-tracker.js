/**
 * Condition Tracker
 *
 * Manages D&D 5e status conditions for characters, including application, removal,
 * duration tracking, and effect enforcement. Integrates with EventScheduler for
 * timed conditions and CharacterManager for persistence.
 *
 * Supports all 14 D&D 5e SRD conditions: Blinded, Charmed, Deafened, Frightened,
 * Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone,
 * Restrained, Stunned, Unconscious.
 *
 * Character Conditions Data Structure:
 * {
 *   conditions: [
 *     {
 *       name: string,           // Condition name (e.g., "poisoned")
 *       appliedAt: ISOString,   // When condition was applied
 *       expiresAt: ISOString?,  // When condition expires (null if permanent or save ends)
 *       effects: string[],      // Text descriptions of effects
 *       source?: string,        // Source of condition (e.g., "Strahd", "Poison Trap")
 *       eventId?: string,       // EventScheduler event ID for expiration
 *       saveEnds?: boolean,     // True if condition ends on successful save
 *       saveDC?: number,        // DC for save to remove condition
 *       saveAbility?: string    // Ability for save (e.g., "WIS", "CON")
 *     }
 *   ]
 * }
 *
 * @example
 * const conditionTracker = new ConditionTracker();
 *
 * // Apply poisoned condition with 1 hour duration
 * const result = await conditionTracker.applyCondition(character, "poisoned", {duration: "1 hour"});
 * // {success: true, data: {condition: "poisoned", duration: "1 hour", effects: [...], eventId: "evt_123"}}
 *
 * // Check if character has condition
 * const hasPoisoned = conditionTracker.hasCondition(character, "poisoned");
 * // true
 *
 * // Get active conditions
 * const conditions = conditionTracker.getActiveConditions(character);
 * // [{name: "poisoned", appliedAt: "...", expiresAt: "...", effects: [...]}]
 *
 * // Remove condition
 * await conditionTracker.removeCondition(character, "poisoned", {reason: "cured"});
 * // {success: true, data: {condition: "poisoned", removed: true, reason: "cured"}}
 */

class ConditionTracker {
  /**
   * Create a ConditionTracker instance
   * @param {Object} deps - Dependencies (for testing)
   * @param {Object} deps.eventScheduler - EventScheduler instance for expiration tracking
   * @param {Object} deps.characterManager - CharacterManager instance for persistence
   * @param {Object} deps.calendarManager - CalendarManager instance for time calculations
   * @param {Object} deps.conditionEffects - ConditionEffects module for condition definitions
   */
  constructor(deps = {}) {
    this._deps = deps;
    this._eventScheduler = deps.eventScheduler || null;
    this._characterManager = deps.characterManager || null;
    this._calendarManager = deps.calendarManager || null;
    this._conditionEffects = deps.conditionEffects || null;
  }

  /**
   * Get EventScheduler instance (lazy-loaded)
   * @returns {Object} EventScheduler instance
   */
  get eventScheduler() {
    if (!this._eventScheduler) {
      const EventScheduler = require('../calendar/event-scheduler');
      this._eventScheduler = new EventScheduler();
    }
    return this._eventScheduler;
  }

  /**
   * Get CharacterManager instance (lazy-loaded)
   * @returns {Object} CharacterManager instance
   */
  get characterManager() {
    if (!this._characterManager) {
      const CharacterManager = require('./character-manager');
      this._characterManager = new CharacterManager();
    }
    return this._characterManager;
  }

  /**
   * Get CalendarManager instance (lazy-loaded)
   * @returns {Object} CalendarManager instance
   */
  get calendarManager() {
    if (!this._calendarManager) {
      const CalendarManager = require('../calendar/calendar-manager');
      this._calendarManager = new CalendarManager();
    }
    return this._calendarManager;
  }

  /**
   * Get ConditionEffects module (lazy-loaded)
   * @returns {Object} ConditionEffects module
   */
  get conditionEffects() {
    if (!this._conditionEffects) {
      this._conditionEffects = require('./condition-effects');
    }
    return this._conditionEffects;
  }

  /**
   * Initialize conditions array if missing
   * @param {Object} character - Character object
   * @returns {Object} Character with initialized conditions
   * @private
   */
  _initializeConditions(character) {
    if (!character.conditions) {
      character.conditions = [];
    }

    // Initialize condition immunities if not present
    if (!character.conditionImmunities) {
      character.conditionImmunities = [];
    }

    return character;
  }

  /**
   * Validate condition name
   * @param {string} conditionName - Condition name to validate
   * @returns {Object} Result object
   * @private
   */
  _validateConditionName(conditionName) {
    if (!conditionName || typeof conditionName !== 'string') {
      return {
        success: false,
        data: null,
        error: 'Condition name must be a non-empty string'
      };
    }

    const normalized = conditionName.toLowerCase().trim();
    if (!this.conditionEffects.isValidCondition(normalized)) {
      return {
        success: false,
        data: null,
        error: `Unknown condition: ${conditionName}. Valid conditions: ${this.conditionEffects.getAllConditionNames().join(', ')}`
      };
    }

    return {
      success: true,
      data: { normalized },
      error: null
    };
  }

  /**
   * Check if character is immune to condition
   * @param {Object} character - Character object
   * @param {string} conditionName - Condition name (normalized)
   * @returns {boolean} True if immune
   * @private
   */
  _checkImmunity(character, conditionName) {
    this._initializeConditions(character);
    return character.conditionImmunities.includes(conditionName);
  }

  /**
   * Check if character already has condition
   * @param {Object} character - Character object
   * @param {string} conditionName - Condition name (normalized)
   * @returns {Object|null} Existing condition object or null
   * @private
   */
  _findExistingCondition(character, conditionName) {
    this._initializeConditions(character);
    return character.conditions.find(c => c.name === conditionName) || null;
  }

  /**
   * Clean up expired conditions on character load
   * @param {Object} character - Character object
   * @returns {number} Number of conditions removed
   * @private
   */
  _cleanupExpiredConditions(character) {
    this._initializeConditions(character);
    const now = new Date().toISOString();
    const before = character.conditions.length;

    character.conditions = character.conditions.filter(condition => {
      if (!condition.expiresAt) {
        return true; // Keep conditions without expiration
      }
      return condition.expiresAt > now; // Keep if not yet expired
    });

    return before - character.conditions.length;
  }

  /**
   * Parse duration string to milliseconds
   * @param {string} durationStr - Duration string (e.g., "1 hour", "10 minutes")
   * @returns {number|null} Duration in milliseconds or null if invalid
   * @private
   */
  _parseDuration(durationStr) {
    if (!durationStr || typeof durationStr !== 'string') {
      return null;
    }

    const match = durationStr.match(/^(\d+)\s*(minute|minutes|hour|hours|day|days|turn|turns)$/i);
    if (!match) {
      return null;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    const multipliers = {
      minute: 60 * 1000,
      minutes: 60 * 1000,
      hour: 60 * 60 * 1000,
      hours: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      turn: 6 * 1000, // D&D 5e turn is ~6 seconds
      turns: 6 * 1000
    };

    return value * (multipliers[unit] || 0);
  }

  /**
   * Apply a condition to a character
   * @param {Object} character - Character object
   * @param {string} conditionName - Name of condition to apply
   * @param {Object} options - Condition options
   * @param {string} options.duration - Duration (e.g., "1 hour", "10 minutes")
   * @param {string} options.source - Source of condition (e.g., "Strahd", "Poison Trap")
   * @param {boolean} options.saveEnds - True if condition ends on successful save
   * @param {number} options.saveDC - DC for save to remove condition
   * @param {string} options.saveAbility - Ability for save (e.g., "WIS", "CON")
   * @returns {Promise<Object>} Result object
   */
  async applyCondition(character, conditionName, options = {}) {
    const startTime = Date.now();
    const { duration, source, saveEnds = false, saveDC, saveAbility } = options;

    // Validate condition name
    const validation = this._validateConditionName(conditionName);
    if (!validation.success) {
      return validation;
    }

    const normalized = validation.data.normalized;

    // Initialize conditions
    this._initializeConditions(character);

    // Check immunity
    if (this._checkImmunity(character, normalized)) {
      return {
        success: false,
        data: null,
        error: `Character is immune to ${normalized} condition`
      };
    }

    // Check for duplicate condition
    const existing = this._findExistingCondition(character, normalized);
    if (existing) {
      // D&D 5e rule: conditions don't stack
      // Optionally extend duration if new duration is longer
      if (duration && existing.expiresAt) {
        const durationMs = this._parseDuration(duration);
        if (durationMs) {
          const newExpiresAt = new Date(Date.now() + durationMs).toISOString();
          if (newExpiresAt > existing.expiresAt) {
            existing.expiresAt = newExpiresAt;
            // Note: Would need to update EventScheduler event here
          }
        }
      }

      return {
        success: true,
        data: {
          condition: normalized,
          alreadyActive: true,
          message: 'Condition already active (conditions do not stack in D&D 5e)'
        },
        error: null
      };
    }

    // Get condition effects
    const effectsData = this.conditionEffects.getConditionEffects(normalized);
    if (!effectsData) {
      return {
        success: false,
        data: null,
        error: `Failed to load effects for condition: ${normalized}`
      };
    }

    // Build condition object
    const condition = {
      name: normalized,
      appliedAt: new Date().toISOString(),
      expiresAt: null,
      effects: effectsData.effects,
      source: source || null,
      eventId: null,
      saveEnds: saveEnds || false,
      saveDC: saveDC || null,
      saveAbility: saveAbility || null
    };

    // Register expiration event if duration specified
    if (duration) {
      const durationMs = this._parseDuration(duration);
      if (durationMs) {
        condition.expiresAt = new Date(Date.now() + durationMs).toISOString();

        // Schedule expiration event
        const eventResult = await this.eventScheduler.scheduleEvent({
          type: 'condition_expiration',
          trigger: condition.expiresAt,
          payload: {
            characterId: character.characterId || character.name,
            conditionName: normalized
          }
        });

        if (eventResult.success) {
          condition.eventId = eventResult.data.eventId;
        }
      }
    }

    // Add condition to character
    character.conditions.push(condition);

    // Persist changes
    await this.characterManager.saveCharacter(character);

    const elapsed = Date.now() - startTime;

    return {
      success: true,
      data: {
        condition: normalized,
        duration: duration || 'permanent',
        effects: condition.effects,
        eventId: condition.eventId,
        appliedAt: condition.appliedAt,
        expiresAt: condition.expiresAt,
        elapsed: `${elapsed}ms`
      },
      error: null
    };
  }

  /**
   * Remove a condition from a character
   * @param {Object} character - Character object
   * @param {string} conditionName - Name of condition to remove
   * @param {Object} options - Removal options
   * @param {string} options.reason - Reason for removal (e.g., "cured", "expired", "save succeeded")
   * @returns {Promise<Object>} Result object
   */
  async removeCondition(character, conditionName, options = {}) {
    const startTime = Date.now();
    const { reason = 'removed' } = options;

    // Validate condition name
    const validation = this._validateConditionName(conditionName);
    if (!validation.success) {
      return validation;
    }

    const normalized = validation.data.normalized;

    // Initialize conditions
    this._initializeConditions(character);

    // Find condition
    const index = character.conditions.findIndex(c => c.name === normalized);
    if (index === -1) {
      return {
        success: false,
        data: null,
        error: `Character does not have ${normalized} condition`
      };
    }

    const condition = character.conditions[index];

    // Cancel expiration event if exists
    if (condition.eventId) {
      await this.eventScheduler.cancelEvent(condition.eventId);
    }

    // Remove condition
    character.conditions.splice(index, 1);

    // Persist changes
    await this.characterManager.saveCharacter(character);

    const elapsed = Date.now() - startTime;

    return {
      success: true,
      data: {
        condition: normalized,
        removed: true,
        reason: reason,
        elapsed: `${elapsed}ms`
      },
      error: null
    };
  }

  /**
   * Get all active conditions for a character
   * @param {Object} character - Character object
   * @returns {Array<Object>} Array of active condition objects
   */
  getActiveConditions(character) {
    this._initializeConditions(character);
    this._cleanupExpiredConditions(character);
    return [...character.conditions]; // Return copy to prevent external mutation
  }

  /**
   * Check if character has a specific condition
   * @param {Object} character - Character object
   * @param {string} conditionName - Condition name to check
   * @returns {boolean} True if character has the condition
   */
  hasCondition(character, conditionName) {
    if (!conditionName || typeof conditionName !== 'string') {
      return false;
    }

    const normalized = conditionName.toLowerCase().trim();
    this._initializeConditions(character);

    return character.conditions.some(c => c.name === normalized);
  }

  /**
   * Get condition effects from the database
   * @param {string} conditionName - Condition name
   * @returns {Object|null} Condition effects object or null
   */
  getConditionEffects(conditionName) {
    return this.conditionEffects.getConditionEffects(conditionName);
  }

  /**
   * Apply condition effects to a roll or action
   * @param {Object} character - Character object
   * @param {string} rollType - Type of roll ("attack", "ability_check", "saving_throw")
   * @param {Object} rollData - Roll data object to modify
   * @returns {Object} Modified roll data with condition effects applied
   */
  applyEffectsToRoll(character, rollType, rollData) {
    const conditions = this.getActiveConditions(character);
    const appliedEffects = [];

    for (const condition of conditions) {
      const effects = this.conditionEffects.getConditionEffects(condition.name);
      if (!effects) continue;

      const impact = effects.mechanicsImpact;

      // Apply effects based on roll type
      if (rollType === 'attack') {
        if (impact.attacks.prevented) {
          rollData.prevented = true;
          rollData.preventReason = `incapacitated by ${condition.name}`;
          appliedEffects.push(`Cannot attack (${condition.name})`);
        } else if (impact.attacks.disadvantage) {
          rollData.disadvantage = true;
          appliedEffects.push(`Disadvantage on attacks (${condition.name})`);
        } else if (impact.attacks.advantage) {
          rollData.advantage = true;
          appliedEffects.push(`Advantage on attacks (${condition.name})`);
        } else if (impact.attacks.disadvantageIfSourceVisible && rollData.sourceVisible) {
          rollData.disadvantage = true;
          appliedEffects.push(`Disadvantage on attacks while source visible (${condition.name})`);
        }
      } else if (rollType === 'ability_check') {
        if (impact.checks.disadvantage) {
          rollData.disadvantage = true;
          appliedEffects.push(`Disadvantage on ability checks (${condition.name})`);
        } else if (impact.checks.disadvantageIfSourceVisible && rollData.sourceVisible) {
          rollData.disadvantage = true;
          appliedEffects.push(`Disadvantage on checks while source visible (${condition.name})`);
        } else if (impact.checks.autoFailIfSightRequired && rollData.requiresSight) {
          rollData.autoFail = true;
          appliedEffects.push(`Auto-fail on sight-based checks (${condition.name})`);
        } else if (impact.checks.autoFailIfHearingRequired && rollData.requiresHearing) {
          rollData.autoFail = true;
          appliedEffects.push(`Auto-fail on hearing-based checks (${condition.name})`);
        }
      } else if (rollType === 'saving_throw') {
        if (impact.saves.autoFailStrDex && (rollData.ability === 'STR' || rollData.ability === 'DEX')) {
          rollData.autoFail = true;
          appliedEffects.push(`Auto-fail STR/DEX saves (${condition.name})`);
        } else if (impact.saves.disadvantageOnDex && rollData.ability === 'DEX') {
          rollData.disadvantage = true;
          appliedEffects.push(`Disadvantage on DEX saves (${condition.name})`);
        }
      }
    }

    rollData.appliedConditionEffects = appliedEffects;
    return rollData;
  }
}

module.exports = ConditionTracker;
