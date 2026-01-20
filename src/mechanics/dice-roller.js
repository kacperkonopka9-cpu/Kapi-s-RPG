/**
 * DiceRoller - Custom dice rolling implementation for D&D 5e
 *
 * Features:
 * - Parse standard D&D dice notation (1d20, 2d6+3, etc.)
 * - Support advantage/disadvantage for d20 rolls
 * - Cryptographically secure randomness via crypto.randomInt()
 * - Detailed breakdown strings for transparency
 * - Result object pattern (no exceptions)
 * - Dependency injection for testability
 *
 * @module src/mechanics/dice-roller
 */

const crypto = require('crypto');

class DiceRoller {
  /**
   * Creates a new DiceRoller instance
   *
   * @param {Object} deps - Dependencies (for testing)
   * @param {Function} deps.randomInt - Random number generator (default: crypto.randomInt)
   */
  constructor(deps = {}) {
    this.randomInt = deps.randomInt || crypto.randomInt;
  }

  /**
   * Roll dice from notation string
   *
   * @param {string} notation - Dice notation (e.g., "2d6+3", "1d20")
   * @param {Object} options - Roll options
   * @param {boolean} options.advantage - Roll 2d20, take higher (d20 only)
   * @param {boolean} options.disadvantage - Roll 2d20, take lower (d20 only)
   * @returns {Promise<ResultObject>} Roll result
   *
   * @example
   * const roller = new DiceRoller();
   * const result = await roller.roll("2d6+3");
   * // {success: true, data: {notation: "2d6+3", rolls: [4, 6], modifier: 3, total: 13, breakdown: "2d6(4+6) + 3 = 13"}}
   */
  async roll(notation, options = {}) {
    try {
      // Validate input
      if (!notation || typeof notation !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Invalid dice notation'
        };
      }

      // Trim and normalize
      notation = notation.trim();

      // Validate notation format
      if (!this.validateNotation(notation)) {
        return {
          success: false,
          data: null,
          error: 'Invalid dice notation'
        };
      }

      // Parse notation
      const parsed = this._parseNotation(notation);
      if (!parsed) {
        return {
          success: false,
          data: null,
          error: 'Invalid dice notation'
        };
      }

      const { count, sides, modifier } = parsed;
      const { advantage, disadvantage } = options;

      // Check advantage/disadvantage only applies to d20
      if ((advantage || disadvantage) && (count !== 1 || sides !== 20)) {
        return {
          success: false,
          data: null,
          error: 'Advantage/disadvantage only applies to 1d20 rolls'
        };
      }

      let rolls = [];
      let discarded = [];
      let hasAdvantage = false;
      let hasDisadvantage = false;

      // Handle advantage/disadvantage for d20
      if (count === 1 && sides === 20 && (advantage || disadvantage)) {
        const result = this._rollD20WithAdvantage(advantage, disadvantage);
        rolls = [result.roll];
        if (result.discarded !== undefined) {
          discarded = [result.discarded];
          hasAdvantage = advantage && !disadvantage;
          hasDisadvantage = disadvantage && !advantage;
        }
      } else {
        // Normal roll
        for (let i = 0; i < count; i++) {
          rolls.push(this._rollDie(sides));
        }
      }

      // Calculate total
      const rollSum = rolls.reduce((sum, roll) => sum + roll, 0);
      const total = rollSum + modifier;

      // Generate breakdown
      const breakdown = this._generateBreakdown({
        count,
        sides,
        rolls,
        discarded,
        modifier,
        total,
        advantage: hasAdvantage,
        disadvantage: hasDisadvantage
      });

      // Return result
      const resultData = {
        notation,
        rolls,
        modifier,
        total,
        breakdown
      };

      // Add optional fields
      if (discarded.length > 0) {
        resultData.discarded = discarded;
      }
      if (hasAdvantage) {
        resultData.advantage = true;
      }
      if (hasDisadvantage) {
        resultData.disadvantage = true;
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
        error: `Roll failed: ${error.message}`
      };
    }
  }

  /**
   * Validate dice notation format
   *
   * @param {string} notation - Notation to validate
   * @returns {boolean} True if valid, false otherwise
   *
   * @example
   * roller.validateNotation("2d6+3"); // true
   * roller.validateNotation("d20");   // false (missing count)
   */
  validateNotation(notation) {
    if (!notation || typeof notation !== 'string') {
      return false;
    }

    // Regex pattern: count(1-2 digits) + d + sides(1-3 digits) + optional modifier
    const pattern = /^(\d{1,2})d(\d{1,3})([+-]\d{1,3})?$/i;

    if (!pattern.test(notation)) {
      return false;
    }

    const [, countStr, sidesStr] = notation.match(pattern);
    const count = parseInt(countStr, 10);
    const sides = parseInt(sidesStr, 10);

    // Check limits
    if (count < 1 || count > 20) return false;
    if (sides < 1 || sides > 100) return false;

    return true;
  }

  /**
   * Parse dice notation into components
   *
   * @private
   * @param {string} notation - Notation to parse
   * @returns {Object|null} {count, sides, modifier} or null if invalid
   */
  _parseNotation(notation) {
    const pattern = /^(\d{1,2})d(\d{1,3})([+-]\d{1,3})?$/i;
    const match = notation.match(pattern);

    if (!match) {
      return null;
    }

    const count = parseInt(match[1], 10);
    const sides = parseInt(match[2], 10);
    const modifier = match[3] ? parseInt(match[3], 10) : 0;

    return { count, sides, modifier };
  }

  /**
   * Roll a single die
   *
   * @private
   * @param {number} sides - Number of sides (4, 6, 8, 10, 12, 20, 100)
   * @returns {number} Roll result (1 to sides)
   */
  _rollDie(sides) {
    return this.randomInt(1, sides + 1);
  }

  /**
   * Handle advantage/disadvantage for d20
   *
   * @private
   * @param {boolean} advantage - Roll with advantage
   * @param {boolean} disadvantage - Roll with disadvantage
   * @returns {Object} {roll, discarded} or {roll} if neither
   */
  _rollD20WithAdvantage(advantage, disadvantage) {
    // If both, they cancel out - normal roll
    if (advantage && disadvantage) {
      return { roll: this._rollDie(20) };
    }

    // Roll twice
    const roll1 = this._rollDie(20);
    const roll2 = this._rollDie(20);

    if (advantage) {
      return {
        roll: Math.max(roll1, roll2),
        discarded: Math.min(roll1, roll2)
      };
    }

    if (disadvantage) {
      return {
        roll: Math.min(roll1, roll2),
        discarded: Math.max(roll1, roll2)
      };
    }

    // Shouldn't reach here, but return first roll as fallback
    return { roll: roll1 };
  }

  /**
   * Generate breakdown string for display
   *
   * @private
   * @param {Object} rollData - Roll data (count, sides, rolls, modifier, etc.)
   * @returns {string} Human-readable breakdown
   *
   * @example
   * // "2d6(4+6) + 3 = 13"
   * // "1d20(14, 8 discarded) = 14 [ADVANTAGE]"
   */
  _generateBreakdown(rollData) {
    const { count, sides, rolls, discarded, modifier, total, advantage, disadvantage } = rollData;

    let breakdown = `${count}d${sides}`;

    // Add rolls
    if (discarded && discarded.length > 0) {
      // Advantage/disadvantage format
      breakdown += `(${rolls[0]}, ${discarded[0]} discarded)`;
    } else {
      // Normal format
      breakdown += `(${rolls.join('+')})`;
    }

    // Add modifier if non-zero
    if (modifier > 0) {
      breakdown += ` + ${modifier}`;
    } else if (modifier < 0) {
      breakdown += ` - ${Math.abs(modifier)}`;
    }

    // Add total
    breakdown += ` = ${total}`;

    // Add advantage/disadvantage tag
    if (advantage) {
      breakdown += ' [ADVANTAGE]';
    } else if (disadvantage) {
      breakdown += ' [DISADVANTAGE]';
    }

    return breakdown;
  }
}

module.exports = DiceRoller;
