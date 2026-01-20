/**
 * AbilityCheckHandler - D&D 5e ability checks, skill checks, and saving throws
 *
 * Features:
 * - Execute ability checks (d20 + ability modifier vs DC)
 * - Execute skill checks (d20 + ability modifier + proficiency bonus vs DC)
 * - Execute saving throws (d20 + ability modifier + proficiency if applicable vs DC)
 * - Support advantage/disadvantage mechanics (roll 2d20, take higher/lower)
 * - Flag critical successes (natural 20) and failures (natural 1)
 * - Result Object pattern (no exceptions)
 * - Dependency injection for testability
 *
 * Skill-to-Ability Mapping (D&D 5e Standard):
 * - Strength: athletics
 * - Dexterity: acrobatics, sleight_of_hand, stealth
 * - Intelligence: arcana, history, investigation, nature, religion
 * - Wisdom: animal_handling, insight, medicine, perception, survival
 * - Charisma: deception, intimidation, performance, persuasion
 *
 * @module src/mechanics/ability-check-handler
 */

const CharacterManager = require('./character-manager');
const DiceRoller = require('./dice-roller');

/**
 * Skill-to-ability mapping for D&D 5e
 * @const {Object<string, string>}
 */
const SKILL_TO_ABILITY = {
  // Strength skills
  athletics: 'strength',

  // Dexterity skills
  acrobatics: 'dexterity',
  sleight_of_hand: 'dexterity',
  stealth: 'dexterity',

  // Intelligence skills
  arcana: 'intelligence',
  history: 'intelligence',
  investigation: 'intelligence',
  nature: 'intelligence',
  religion: 'intelligence',

  // Wisdom skills
  animal_handling: 'wisdom',
  insight: 'wisdom',
  medicine: 'wisdom',
  perception: 'wisdom',
  survival: 'wisdom',

  // Charisma skills
  deception: 'charisma',
  intimidation: 'charisma',
  performance: 'charisma',
  persuasion: 'charisma'
};

/**
 * Valid D&D 5e ability names
 * @const {string[]}
 */
const VALID_ABILITIES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

class AbilityCheckHandler {
  /**
   * Creates a new AbilityCheckHandler instance
   *
   * @param {Object} deps - Dependencies (for testing)
   * @param {CharacterManager} deps.characterManager - Character manager instance (optional, for future use)
   * @param {DiceRoller} deps.diceRoller - Dice roller instance
   *
   * @example
   * // Default dependencies
   * const handler = new AbilityCheckHandler();
   *
   * // Custom dependencies for testing
   * const handler = new AbilityCheckHandler({
   *   diceRoller: mockDiceRoller
   * });
   */
  constructor(deps = {}) {
    // CharacterManager is not instantiated here; we use its static methods directly
    this.diceRoller = deps.diceRoller || new DiceRoller();
  }

  /**
   * Execute an ability check
   *
   * @param {Object} character - Character object with abilities
   * @param {string} ability - Ability name (strength, dexterity, constitution, intelligence, wisdom, charisma)
   * @param {number} dc - Difficulty Class
   * @param {Object} options - Check options
   * @param {boolean} options.advantage - Roll with advantage (2d20, take higher)
   * @param {boolean} options.disadvantage - Roll with disadvantage (2d20, take lower)
   * @returns {Promise<ResultObject>} Check result
   *
   * @example
   * const result = await handler.makeAbilityCheck(character, 'wisdom', 15);
   * // {success: true, data: {passed: false, total: 13, roll: 12, modifier: 1, dc: 15}, error: null}
   *
   * @example
   * // With advantage
   * const result = await handler.makeAbilityCheck(character, 'wisdom', 15, {advantage: true});
   * // {success: true, data: {passed: true, total: 16, roll: 15, modifier: 1, rolls: [8, 15], selectedRoll: 15, dc: 15}, error: null}
   */
  async makeAbilityCheck(character, ability, dc, options = {}) {
    try {
      // Validate ability name
      if (!ability || typeof ability !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Ability must be a non-empty string'
        };
      }

      const normalizedAbility = ability.toLowerCase();
      if (!VALID_ABILITIES.includes(normalizedAbility)) {
        return {
          success: false,
          data: null,
          error: `Invalid ability: ${ability}`
        };
      }

      // Validate DC
      if (typeof dc !== 'number' || dc < 0) {
        return {
          success: false,
          data: null,
          error: 'DC must be a positive number'
        };
      }

      // Get ability score
      if (!character || !character.abilities || !(normalizedAbility in character.abilities)) {
        return {
          success: false,
          data: null,
          error: `Character missing ability: ${normalizedAbility}`
        };
      }

      const abilityScore = character.abilities[normalizedAbility];
      const modifier = CharacterManager.getAbilityModifier(abilityScore);

      // Handle advantage/disadvantage
      const { advantage, disadvantage } = options;
      const hasAdvantage = advantage && !disadvantage;
      const hasDisadvantage = disadvantage && !advantage;

      // Roll d20
      const rollOptions = {};
      if (hasAdvantage) rollOptions.advantage = true;
      if (hasDisadvantage) rollOptions.disadvantage = true;

      const rollResult = await this.diceRoller.roll('1d20', rollOptions);
      if (!rollResult.success) {
        return {
          success: false,
          data: null,
          error: `Dice roll failed: ${rollResult.error}`
        };
      }

      // Extract roll value
      const roll = rollResult.data.rolls[0];
      const total = roll + modifier;
      const passed = total >= dc;

      // Build result data
      const resultData = {
        passed,
        total,
        roll,
        modifier,
        dc
      };

      // Include advantage/disadvantage details if applicable
      if (hasAdvantage || hasDisadvantage) {
        // DiceRoller returns both rolls in the breakdown when using advantage/disadvantage
        // We need to extract both rolls from the dice result
        // Looking at DiceRoller implementation, it rolls twice and selects one
        // We'll include the selected roll info
        resultData.rolls = rollResult.data.rolls; // This might be a single roll; we'll track this properly
        resultData.selectedRoll = roll;

        // Note: DiceRoller's current implementation with advantage/disadvantage only returns
        // the selected roll in rolls array. For full transparency, we should roll twice ourselves.
        // Let me handle this properly:
        if (hasAdvantage || hasDisadvantage) {
          // Roll a second d20 to get both values
          const secondRoll = await this.diceRoller.roll('1d20');
          if (secondRoll.success) {
            const roll2 = secondRoll.data.rolls[0];
            const allRolls = hasAdvantage
              ? [Math.min(roll, roll2), Math.max(roll, roll2)]
              : [Math.max(roll, roll2), Math.min(roll, roll2)];
            resultData.rolls = allRolls;
            resultData.selectedRoll = hasAdvantage ? Math.max(roll, roll2) : Math.min(roll, roll2);

            // Recalculate with correct roll
            resultData.roll = resultData.selectedRoll;
            resultData.total = resultData.selectedRoll + modifier;
            resultData.passed = resultData.total >= dc;
          }
        }
      }

      // Flag critical successes and failures
      if (roll === 20) {
        resultData.critical = 'success';
      } else if (roll === 1) {
        resultData.critical = 'failure';
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
        error: `Ability check failed: ${error.message}`
      };
    }
  }

  /**
   * Execute a skill check
   *
   * @param {Object} character - Character object with abilities, level, and proficiencies
   * @param {string} skill - Skill name (e.g., 'perception', 'stealth', 'athletics')
   * @param {number} dc - Difficulty Class
   * @param {Object} options - Check options
   * @param {boolean} options.advantage - Roll with advantage
   * @param {boolean} options.disadvantage - Roll with disadvantage
   * @returns {Promise<ResultObject>} Skill check result
   *
   * @example
   * const result = await handler.makeSkillCheck(character, 'perception', 15);
   * // {success: true, data: {passed: true, total: 16, roll: 13, abilityModifier: 1, proficiencyBonus: 2, dc: 15}, error: null}
   */
  async makeSkillCheck(character, skill, dc, options = {}) {
    try {
      // Validate skill name
      if (!skill || typeof skill !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Skill must be a non-empty string'
        };
      }

      const normalizedSkill = skill.toLowerCase();
      if (!(normalizedSkill in SKILL_TO_ABILITY)) {
        return {
          success: false,
          data: null,
          error: `Invalid skill: ${skill}`
        };
      }

      // Determine ability for this skill
      const ability = SKILL_TO_ABILITY[normalizedSkill];

      // Get ability score and modifier
      if (!character || !character.abilities || !(ability in character.abilities)) {
        return {
          success: false,
          data: null,
          error: `Character missing ability: ${ability}`
        };
      }

      const abilityScore = character.abilities[ability];
      const abilityModifier = CharacterManager.getAbilityModifier(abilityScore);

      // Check proficiency
      let proficiencyBonus = 0;
      if (character.proficiencies && Array.isArray(character.proficiencies.skills)) {
        const isProficient = character.proficiencies.skills.includes(normalizedSkill);
        if (isProficient && character.level) {
          proficiencyBonus = CharacterManager.getProficiencyBonus(character.level);
        }
      }

      // Calculate total modifier
      const totalModifier = abilityModifier + proficiencyBonus;

      // Handle advantage/disadvantage
      const { advantage, disadvantage } = options;
      const hasAdvantage = advantage && !disadvantage;
      const hasDisadvantage = disadvantage && !advantage;

      // Roll d20
      const rollOptions = {};
      if (hasAdvantage) rollOptions.advantage = true;
      if (hasDisadvantage) rollOptions.disadvantage = true;

      const rollResult = await this.diceRoller.roll('1d20', rollOptions);
      if (!rollResult.success) {
        return {
          success: false,
          data: null,
          error: `Dice roll failed: ${rollResult.error}`
        };
      }

      // Extract roll value
      let roll = rollResult.data.rolls[0];

      // Handle advantage/disadvantage to show both rolls
      const resultData = {
        passed: false, // Will calculate below
        total: 0,
        roll,
        abilityModifier,
        proficiencyBonus,
        dc
      };

      if (hasAdvantage || hasDisadvantage) {
        // Roll second d20
        const secondRoll = await this.diceRoller.roll('1d20');
        if (secondRoll.success) {
          const roll2 = secondRoll.data.rolls[0];
          const allRolls = hasAdvantage
            ? [Math.min(roll, roll2), Math.max(roll, roll2)]
            : [Math.max(roll, roll2), Math.min(roll, roll2)];
          resultData.rolls = allRolls;
          const selectedRoll = hasAdvantage ? Math.max(roll, roll2) : Math.min(roll, roll2);
          resultData.selectedRoll = selectedRoll;
          resultData.roll = selectedRoll;
          roll = selectedRoll;
        }
      }

      // Calculate total and check against DC
      const total = roll + totalModifier;
      resultData.total = total;
      resultData.passed = total >= dc;

      // Flag critical successes and failures
      if (roll === 20) {
        resultData.critical = 'success';
      } else if (roll === 1) {
        resultData.critical = 'failure';
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
        error: `Skill check failed: ${error.message}`
      };
    }
  }

  /**
   * Execute a saving throw
   *
   * @param {Object} character - Character object with abilities, level, and proficiencies
   * @param {string} ability - Ability name for the save (e.g., 'constitution', 'dexterity')
   * @param {number} dc - Difficulty Class
   * @param {Object} options - Check options
   * @param {boolean} options.advantage - Roll with advantage
   * @param {boolean} options.disadvantage - Roll with disadvantage
   * @returns {Promise<ResultObject>} Saving throw result
   *
   * @example
   * const result = await handler.makeSavingThrow(character, 'constitution', 15);
   * // {success: true, data: {passed: true, total: 16, roll: 12, modifier: 2, proficiency: true, dc: 15}, error: null}
   */
  async makeSavingThrow(character, ability, dc, options = {}) {
    try {
      // Validate ability name
      if (!ability || typeof ability !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Ability must be a non-empty string'
        };
      }

      const normalizedAbility = ability.toLowerCase();
      if (!VALID_ABILITIES.includes(normalizedAbility)) {
        return {
          success: false,
          data: null,
          error: `Invalid ability: ${ability}`
        };
      }

      // Validate DC
      if (typeof dc !== 'number' || dc < 0) {
        return {
          success: false,
          data: null,
          error: 'DC must be a positive number'
        };
      }

      // Get ability score
      if (!character || !character.abilities || !(normalizedAbility in character.abilities)) {
        return {
          success: false,
          data: null,
          error: `Character missing ability: ${normalizedAbility}`
        };
      }

      const abilityScore = character.abilities[normalizedAbility];
      const abilityModifier = CharacterManager.getAbilityModifier(abilityScore);

      // Check saving throw proficiency
      let proficiency = false;
      let proficiencyBonus = 0;
      if (character.proficiencies && Array.isArray(character.proficiencies.savingThrows)) {
        proficiency = character.proficiencies.savingThrows.includes(normalizedAbility);
        if (proficiency && character.level) {
          proficiencyBonus = CharacterManager.getProficiencyBonus(character.level);
        }
      }

      // Calculate total modifier
      const totalModifier = abilityModifier + proficiencyBonus;

      // Handle advantage/disadvantage
      const { advantage, disadvantage } = options;
      const hasAdvantage = advantage && !disadvantage;
      const hasDisadvantage = disadvantage && !advantage;

      // Roll d20
      const rollOptions = {};
      if (hasAdvantage) rollOptions.advantage = true;
      if (hasDisadvantage) rollOptions.disadvantage = true;

      const rollResult = await this.diceRoller.roll('1d20', rollOptions);
      if (!rollResult.success) {
        return {
          success: false,
          data: null,
          error: `Dice roll failed: ${rollResult.error}`
        };
      }

      // Extract roll value
      let roll = rollResult.data.rolls[0];

      // Build result data
      const resultData = {
        passed: false,
        total: 0,
        roll,
        modifier: totalModifier,
        proficiency,
        dc
      };

      // Handle advantage/disadvantage to show both rolls
      if (hasAdvantage || hasDisadvantage) {
        const secondRoll = await this.diceRoller.roll('1d20');
        if (secondRoll.success) {
          const roll2 = secondRoll.data.rolls[0];
          const allRolls = hasAdvantage
            ? [Math.min(roll, roll2), Math.max(roll, roll2)]
            : [Math.max(roll, roll2), Math.min(roll, roll2)];
          resultData.rolls = allRolls;
          const selectedRoll = hasAdvantage ? Math.max(roll, roll2) : Math.min(roll, roll2);
          resultData.selectedRoll = selectedRoll;
          resultData.roll = selectedRoll;
          roll = selectedRoll;
        }
      }

      // Calculate total and check against DC
      const total = roll + totalModifier;
      resultData.total = total;
      resultData.passed = total >= dc;

      // Flag critical successes and failures
      if (roll === 20) {
        resultData.critical = 'success';
      } else if (roll === 1) {
        resultData.critical = 'failure';
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
        error: `Saving throw failed: ${error.message}`
      };
    }
  }
}

module.exports = AbilityCheckHandler;
