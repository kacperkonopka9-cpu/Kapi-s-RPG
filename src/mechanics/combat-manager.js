/**
 * CombatManager - D&D 5e Combat Initiative and Turn Management
 *
 * Features:
 * - Initiative rolling and sorting (1d20 + Dex modifier)
 * - Turn sequence and round tracking
 * - Multiple concurrent combat support
 * - Memory-based state management
 * - Result Object pattern (no exceptions)
 * - Dependency injection for testability
 *
 * Implements D&D 5e combat rules for initiative order, turn sequence,
 * and combat state lifecycle.
 *
 * @module src/mechanics/combat-manager
 */

const DiceRoller = require('./dice-roller');

class CombatManager {
  /**
   * Creates a new CombatManager instance
   *
   * @param {Object} deps - Dependencies (for testing)
   * @param {DiceRoller} deps.diceRoller - Dice roller instance
   *
   * @example
   * // Default dependencies
   * const manager = new CombatManager();
   *
   * // Custom dependencies for testing
   * const manager = new CombatManager({
   *   diceRoller: mockDiceRoller
   * });
   */
  constructor(deps = {}) {
    this.diceRoller = deps.diceRoller || new DiceRoller();
    // Map of combat ID -> combat state
    this.combats = new Map();
    // Counter for generating unique combat IDs
    this.combatIdCounter = 0;
  }

  /**
   * Generate a unique combat ID
   *
   * @private
   * @returns {string} Unique combat ID
   */
  _generateCombatId() {
    this.combatIdCounter++;
    return `combat_${Date.now()}_${this.combatIdCounter}`;
  }

  /**
   * Start a new combat encounter
   *
   * Rolls initiative for all combatants (1d20 + Dex modifier), sorts by
   * initiative descending (highest first), and creates combat state object.
   *
   * @param {Array<Object>} combatants - Array of combatants
   * @param {string} combatants[].id - Unique combatant identifier
   * @param {string} combatants[].name - Combatant name
   * @param {number} combatants[].dexModifier - Dexterity modifier
   * @param {string} combatants[].type - Type (player/monster)
   * @returns {Promise<ResultObject>} Combat state with initiative order
   *
   * @example
   * const combatants = [
   *   {id: 'player1', name: 'Kapi', dexModifier: 2, type: 'player'},
   *   {id: 'monster1', name: 'Zombie', dexModifier: -2, type: 'monster'}
   * ];
   * const result = await manager.startCombat(combatants);
   * // {success: true, data: {combatId, combatants (with initiative), currentTurn: 0, currentRound: 1, status: 'active', startTime}, error: null}
   */
  async startCombat(combatants) {
    try {
      // Validate combatants array
      if (!Array.isArray(combatants)) {
        return {
          success: false,
          data: null,
          error: 'Combatants must be an array'
        };
      }

      if (combatants.length === 0) {
        return {
          success: false,
          data: null,
          error: 'Combatants array cannot be empty'
        };
      }

      // Validate each combatant has required fields
      for (let i = 0; i < combatants.length; i++) {
        const combatant = combatants[i];
        if (!combatant.id) {
          return {
            success: false,
            data: null,
            error: `Combatant at index ${i} missing required field: id`
          };
        }
        if (!combatant.name) {
          return {
            success: false,
            data: null,
            error: `Combatant at index ${i} missing required field: name`
          };
        }
        if (typeof combatant.dexModifier !== 'number') {
          return {
            success: false,
            data: null,
            error: `Combatant at index ${i} missing or invalid field: dexModifier (must be a number)`
          };
        }
      }

      // Roll initiative for each combatant
      const combatantsWithInitiative = [];

      for (const combatant of combatants) {
        const rollResult = await this.diceRoller.roll('1d20');

        if (!rollResult.success) {
          return {
            success: false,
            data: null,
            error: `Initiative roll failed for ${combatant.name}: ${rollResult.error}`
          };
        }

        const roll = rollResult.data.rolls[0];
        const initiative = roll + combatant.dexModifier;

        combatantsWithInitiative.push({
          ...combatant,
          initiative,
          roll
        });
      }

      // Sort by initiative (descending, highest first)
      // Preserve original order for ties
      combatantsWithInitiative.sort((a, b) => {
        if (b.initiative !== a.initiative) {
          return b.initiative - a.initiative;
        }
        // Tie: preserve original order (stable sort)
        return 0;
      });

      // Generate combat ID
      const combatId = this._generateCombatId();

      // Create combat state
      const combatState = {
        combatId,
        combatants: combatantsWithInitiative,
        currentTurn: 0,
        currentRound: 1,
        status: 'active',
        startTime: new Date().toISOString()
      };

      // Store combat state
      this.combats.set(combatId, combatState);

      return {
        success: true,
        data: combatState,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Combat start failed: ${error.message}`
      };
    }
  }

  /**
   * Advance to next turn in initiative order
   *
   * Increments currentTurn. If end of round (currentTurn >= combatants.length),
   * resets currentTurn to 0 and increments currentRound.
   *
   * @param {string} combatId - Combat identifier
   * @returns {Promise<ResultObject>} Updated combat state
   *
   * @example
   * const result = await manager.nextTurn('combat_123');
   * // {success: true, data: {combatId, combatants, currentTurn: 1, currentRound: 1, ...}, error: null}
   */
  async nextTurn(combatId) {
    try {
      // Validate combat ID
      if (!combatId || typeof combatId !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Combat ID must be a non-empty string'
        };
      }

      // Get combat state
      const combat = this.combats.get(combatId);

      if (!combat) {
        return {
          success: false,
          data: null,
          error: `Combat not found: ${combatId}`
        };
      }

      // Check if combat is active
      if (combat.status !== 'active') {
        return {
          success: false,
          data: null,
          error: `Combat is not active (status: ${combat.status})`
        };
      }

      // Increment turn
      combat.currentTurn++;

      // Check if end of round
      if (combat.currentTurn >= combat.combatants.length) {
        combat.currentTurn = 0;
        combat.currentRound++;
      }

      // Update stored state
      this.combats.set(combatId, combat);

      return {
        success: true,
        data: combat,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Turn advancement failed: ${error.message}`
      };
    }
  }

  /**
   * End combat encounter
   *
   * Marks combat as inactive and preserves final state for review.
   *
   * @param {string} combatId - Combat identifier
   * @returns {Promise<ResultObject>} Final combat state
   *
   * @example
   * const result = await manager.endCombat('combat_123');
   * // {success: true, data: {combatId, status: 'inactive', ...}, error: null}
   */
  async endCombat(combatId) {
    try {
      // Validate combat ID
      if (!combatId || typeof combatId !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Combat ID must be a non-empty string'
        };
      }

      // Get combat state
      const combat = this.combats.get(combatId);

      if (!combat) {
        return {
          success: false,
          data: null,
          error: `Combat not found: ${combatId}`
        };
      }

      // Mark as inactive
      combat.status = 'inactive';
      combat.endTime = new Date().toISOString();

      // Update stored state (preserve for review)
      this.combats.set(combatId, combat);

      return {
        success: true,
        data: combat,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Combat end failed: ${error.message}`
      };
    }
  }

  /**
   * Get current combat state
   *
   * Retrieves combat state by ID.
   *
   * @param {string} combatId - Combat identifier
   * @returns {Promise<ResultObject>} Current combat state
   *
   * @example
   * const result = await manager.getCombat('combat_123');
   * // {success: true, data: {combatId, combatants, currentTurn, ...}, error: null}
   */
  async getCombat(combatId) {
    try {
      // Validate combat ID
      if (!combatId || typeof combatId !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Combat ID must be a non-empty string'
        };
      }

      // Get combat state
      const combat = this.combats.get(combatId);

      if (!combat) {
        return {
          success: false,
          data: null,
          error: `Combat not found: ${combatId}`
        };
      }

      return {
        success: true,
        data: combat,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Get combat failed: ${error.message}`
      };
    }
  }
}

module.exports = CombatManager;
