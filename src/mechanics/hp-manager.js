/**
 * HP Manager
 *
 * Manages character hit points, damage application, healing, and death saving throws
 * following D&D 5e rules. Handles unconsciousness at 0 HP, instant death, and death
 * save mechanics.
 *
 * D&D 5e Death Save Rules (RAW):
 * - Character at 0 HP falls unconscious
 * - Death saves: d20 roll (no modifiers)
 * - 10+: success, <10: failure
 * - Natural 20: regain 1 HP, become conscious
 * - Natural 1: 2 failures
 * - 3 successes: stabilized (unconscious, 0 HP, death saves cleared)
 * - 3 failures: character dies
 * - Damage at 0 HP: 1 death save failure (2 if critical hit or melee)
 * - Instant death: damage ≥ (current HP + max HP)
 * - Healing from 0 HP: restores consciousness, clears death saves
 *
 * Character HP Data Structure:
 * {
 *   hitPoints: {
 *     current: number,        // Current HP (0 to max)
 *     max: number,           // Maximum HP (positive integer)
 *     unconscious: boolean,  // Unconscious at 0 HP
 *     dead: boolean,         // Dead (instant death or 3 death save failures)
 *     stabilized: boolean,   // Stabilized at 0 HP (3 death save successes)
 *     deathSaves: {
 *       successes: number,   // Death save successes (0-3)
 *       failures: number     // Death save failures (0-3)
 *     }
 *   }
 * }
 *
 * @example
 * const hpManager = new HPManager();
 *
 * // Apply damage
 * const damageResult = await hpManager.applyDamage(character, 10);
 * // {success: true, data: {oldHP: 20, newHP: 10, unconscious: false, dead: false}}
 *
 * // Apply healing
 * const healResult = await hpManager.applyHealing(character, 5);
 * // {success: true, data: {oldHP: 10, newHP: 15, maxHP: 31, restoredConsciousness: false}}
 *
 * // Make death save
 * const deathSaveResult = await hpManager.makeDeathSave(character);
 * // {success: true, data: {roll: 15, result: 'success', successes: 1, failures: 0, ...}}
 */

class HPManager {
  /**
   * Create an HPManager instance
   * @param {Object} deps - Dependencies (for testing)
   * @param {Object} deps.diceRoller - DiceRoller instance for death saves
   * @param {Object} deps.characterManager - CharacterManager instance for persistence
   */
  constructor(deps = {}) {
    // Lazy-load dependencies (loaded on first use if not injected)
    this._deps = deps;
    this._diceRoller = deps.diceRoller || null;
    this._characterManager = deps.characterManager || null;
  }

  /**
   * Get DiceRoller instance (lazy-loaded)
   * @returns {Object} DiceRoller instance
   */
  get diceRoller() {
    if (!this._diceRoller) {
      const DiceRoller = require('./dice-roller');
      this._diceRoller = new DiceRoller();
    }
    return this._diceRoller;
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
   * Initialize HP structure if missing
   * @param {Object} character - Character object
   * @returns {Object} Character with initialized hitPoints
   */
  _initializeHP(character) {
    if (!character.hitPoints) {
      character.hitPoints = {
        current: 0,
        max: 0,
        unconscious: false,
        dead: false,
        stabilized: false,
        deathSaves: {
          successes: 0,
          failures: 0
        }
      };
    }

    if (!character.hitPoints.deathSaves) {
      character.hitPoints.deathSaves = {
        successes: 0,
        failures: 0
      };
    }

    // Ensure all flags exist
    if (character.hitPoints.unconscious === undefined) {
      character.hitPoints.unconscious = false;
    }
    if (character.hitPoints.dead === undefined) {
      character.hitPoints.dead = false;
    }
    if (character.hitPoints.stabilized === undefined) {
      character.hitPoints.stabilized = false;
    }

    return character;
  }

  /**
   * Validate HP values and correct if needed
   * @param {Object} character - Character object
   * @returns {Object} Result object with validation details
   */
  validateHP(character) {
    this._initializeHP(character);

    const hp = character.hitPoints;
    let corrected = false;

    // Validate max HP exists and is positive integer
    if (typeof hp.max !== 'number' || hp.max <= 0 || !Number.isInteger(hp.max)) {
      return {
        success: false,
        data: null,
        error: 'Max HP must be a positive integer'
      };
    }

    // Validate current HP is a number
    if (typeof hp.current !== 'number') {
      hp.current = 0;
      corrected = true;
      console.warn('HP validation: Current HP was not a number, set to 0');
    }

    // Ensure current HP is an integer
    if (!Number.isInteger(hp.current)) {
      hp.current = Math.floor(hp.current);
      corrected = true;
      console.warn(`HP validation: Current HP was not an integer, floored to ${hp.current}`);
    }

    // Cap HP at max HP
    if (hp.current > hp.max) {
      hp.current = hp.max;
      corrected = true;
      console.warn(`HP validation: Current HP exceeded max HP, capped at ${hp.max}`);
    }

    // Clamp HP to 0 minimum
    if (hp.current < 0) {
      hp.current = 0;
      corrected = true;
      console.warn('HP validation: Current HP was negative, set to 0');
    }

    return {
      success: true,
      data: {
        currentHP: hp.current,
        maxHP: hp.max,
        valid: true,
        corrected
      },
      error: null
    };
  }

  /**
   * Apply damage to a character
   * @param {Object} character - Character object
   * @param {number} damage - Damage amount (non-negative integer)
   * @param {Object} options - Damage options
   * @param {boolean} options.critical - Critical hit (2 death save failures if unconscious)
   * @param {boolean} options.melee - Melee attack (2 death save failures if unconscious)
   * @returns {Promise<Object>} Result object with damage details
   */
  async applyDamage(character, damage, options = {}) {
    const { critical = false, melee = false } = options;

    // Validate damage input
    if (typeof damage !== 'number' || damage < 0 || !Number.isInteger(damage)) {
      return {
        success: false,
        data: null,
        error: 'Damage must be a non-negative integer'
      };
    }

    // Initialize and validate HP
    this._initializeHP(character);
    const validationResult = this.validateHP(character);
    if (!validationResult.success) {
      return validationResult;
    }

    const hp = character.hitPoints;
    const oldHP = hp.current;
    const wasUnconscious = hp.unconscious;

    // Check for instant death: damage >= (current HP + max HP)
    if (damage >= (hp.current + hp.max)) {
      hp.current = 0;
      hp.dead = true;
      hp.unconscious = false;
      hp.stabilized = false;
      // Do not initialize death saves for instant death

      // Persist changes
      await this.characterManager.saveCharacter(character);

      return {
        success: true,
        data: {
          oldHP,
          newHP: 0,
          unconscious: false,
          dead: true,
          instantDeath: true
        },
        error: null
      };
    }

    // Handle damage to unconscious character (add death save failures)
    if (wasUnconscious && hp.current === 0 && !hp.dead) {
      const failuresToAdd = (critical || melee) ? 2 : 1;
      hp.deathSaves.failures += failuresToAdd;

      // Check if character dies from failures
      if (hp.deathSaves.failures >= 3) {
        hp.dead = true;
        hp.unconscious = true; // Remains unconscious when dying from failures

        await this.characterManager.saveCharacter(character);

        return {
          success: true,
          data: {
            oldHP: 0,
            newHP: 0,
            unconscious: true,
            dead: true,
            deathSaveFailure: true,
            failures: hp.deathSaves.failures
          },
          error: null
        };
      }

      // Character still alive but with more failures
      await this.characterManager.saveCharacter(character);

      return {
        success: true,
        data: {
          oldHP: 0,
          newHP: 0,
          unconscious: true,
          dead: false,
          deathSaveFailure: true,
          failures: hp.deathSaves.failures
        },
        error: null
      };
    }

    // Apply damage normally
    hp.current = Math.max(0, hp.current - damage);

    // Check for unconsciousness at 0 HP
    if (hp.current === 0 && !hp.dead) {
      hp.unconscious = true;
      hp.stabilized = false;
      // Initialize death saves
      hp.deathSaves.successes = 0;
      hp.deathSaves.failures = 0;
    }

    // Persist changes
    await this.characterManager.saveCharacter(character);

    return {
      success: true,
      data: {
        oldHP,
        newHP: hp.current,
        unconscious: hp.unconscious,
        dead: hp.dead
      },
      error: null
    };
  }

  /**
   * Apply healing to a character
   * @param {Object} character - Character object
   * @param {number} healing - Healing amount (non-negative integer)
   * @returns {Promise<Object>} Result object with healing details
   */
  async applyHealing(character, healing) {
    // Validate healing input
    if (typeof healing !== 'number' || healing < 0 || !Number.isInteger(healing)) {
      return {
        success: false,
        data: null,
        error: 'Healing must be a non-negative integer'
      };
    }

    // Initialize and validate HP
    this._initializeHP(character);
    const validationResult = this.validateHP(character);
    if (!validationResult.success) {
      return validationResult;
    }

    const hp = character.hitPoints;
    const oldHP = hp.current;
    const wasUnconscious = hp.unconscious && hp.current === 0;

    // Cannot heal dead characters
    if (hp.dead) {
      return {
        success: false,
        data: null,
        error: 'Cannot heal dead characters (resurrection required)'
      };
    }

    // Apply healing
    hp.current = Math.min(hp.max, hp.current + healing);

    // Restore consciousness if healing from 0 HP
    let restoredConsciousness = false;
    if (wasUnconscious && hp.current > 0) {
      hp.unconscious = false;
      hp.stabilized = false;
      hp.deathSaves.successes = 0;
      hp.deathSaves.failures = 0;
      restoredConsciousness = true;
    }

    // Persist changes
    await this.characterManager.saveCharacter(character);

    return {
      success: true,
      data: {
        oldHP,
        newHP: hp.current,
        maxHP: hp.max,
        restoredConsciousness
      },
      error: null
    };
  }

  /**
   * Make a death saving throw
   * @param {Object} character - Character object
   * @returns {Promise<Object>} Result object with death save details
   */
  async makeDeathSave(character) {
    // Initialize and validate HP
    this._initializeHP(character);
    const validationResult = this.validateHP(character);
    if (!validationResult.success) {
      return validationResult;
    }

    const hp = character.hitPoints;

    // Validate character is eligible for death saves
    if (hp.current > 0) {
      return {
        success: false,
        data: null,
        error: 'Character must be at 0 HP to make death saves'
      };
    }

    if (hp.dead) {
      return {
        success: false,
        data: null,
        error: 'Character is dead (cannot make death saves)'
      };
    }

    if (!hp.unconscious) {
      return {
        success: false,
        data: null,
        error: 'Character must be unconscious to make death saves'
      };
    }

    if (hp.stabilized) {
      return {
        success: false,
        data: null,
        error: 'Character is stabilized (death saves not required)'
      };
    }

    // Roll d20 using DiceRoller
    const rollResult = await this.diceRoller.roll('1d20');
    if (!rollResult.success) {
      return {
        success: false,
        data: null,
        error: `Death save roll failed: ${rollResult.error}`
      };
    }

    const roll = rollResult.data.total;
    let result;
    let stabilized = false;
    let dead = false;
    let regainedConsciousness = false;
    let newHP = undefined;

    // Natural 20: regain 1 HP and consciousness
    if (roll === 20) {
      hp.current = 1;
      hp.unconscious = false;
      hp.deathSaves.successes = 0;
      hp.deathSaves.failures = 0;
      result = 'critical_success';
      regainedConsciousness = true;
      newHP = 1;
    }
    // Natural 1: 2 failures
    else if (roll === 1) {
      hp.deathSaves.failures += 2;
      result = 'critical_failure';

      // Check for death
      if (hp.deathSaves.failures >= 3) {
        hp.dead = true;
        dead = true;
      }
    }
    // Roll >= 10: success
    else if (roll >= 10) {
      hp.deathSaves.successes += 1;
      result = 'success';

      // Check for stabilization
      if (hp.deathSaves.successes >= 3) {
        hp.stabilized = true;
        hp.deathSaves.successes = 0;
        hp.deathSaves.failures = 0;
        stabilized = true;
      }
    }
    // Roll < 10: failure
    else {
      hp.deathSaves.failures += 1;
      result = 'failure';

      // Check for death
      if (hp.deathSaves.failures >= 3) {
        hp.dead = true;
        dead = true;
      }
    }

    // Persist changes
    await this.characterManager.saveCharacter(character);

    return {
      success: true,
      data: {
        roll,
        result,
        successes: hp.deathSaves.successes,
        failures: hp.deathSaves.failures,
        stabilized,
        dead,
        regainedConsciousness,
        ...(newHP !== undefined && { newHP })
      },
      error: null
    };
  }
}

module.exports = HPManager;
