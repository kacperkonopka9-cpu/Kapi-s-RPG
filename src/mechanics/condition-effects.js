/**
 * D&D 5e Condition Effects Database
 *
 * Defines all 14 standard D&D 5e SRD conditions with their effects and mechanics impact.
 * Follows Rules As Written (RAW) from D&D 5e System Reference Document.
 *
 * Each condition includes:
 * - name: Condition name (lowercase)
 * - displayName: Capitalized display name
 * - description: Brief description of the condition
 * - effects: Array of text descriptions of condition effects
 * - mechanicsImpact: Object defining how condition affects game mechanics
 *   - attacks: Impact on attack rolls (advantage, disadvantage, prevented)
 *   - checks: Impact on ability checks
 *   - saves: Impact on saving throws
 *   - actions: Impact on actions/reactions
 *   - movement: Impact on movement
 *   - other: Other mechanical effects
 *
 * @module condition-effects
 */

const CONDITION_EFFECTS = {
  blinded: {
    name: 'blinded',
    displayName: 'Blinded',
    description: 'A blinded creature can\'t see and automatically fails ability checks that require sight.',
    effects: [
      'Automatically fails ability checks that require sight',
      'Attack rolls have disadvantage',
      'Attack rolls against this creature have advantage'
    ],
    mechanicsImpact: {
      attacks: { disadvantage: true },
      checks: { autoFailIfSightRequired: true },
      saves: {},
      actions: {},
      movement: {},
      attackedBy: { advantage: true }
    }
  },

  charmed: {
    name: 'charmed',
    displayName: 'Charmed',
    description: 'A charmed creature can\'t attack the charmer or target the charmer with harmful abilities or magical effects.',
    effects: [
      'Cannot attack the charmer',
      'Cannot target charmer with harmful abilities or magical effects',
      'Charmer has advantage on ability checks to interact socially with this creature'
    ],
    mechanicsImpact: {
      attacks: { cannotTargetCharmer: true },
      checks: {},
      saves: {},
      actions: { cannotHarmCharmer: true },
      movement: {},
      other: { charmerHasAdvantageOnSocialChecks: true }
    }
  },

  deafened: {
    name: 'deafened',
    displayName: 'Deafened',
    description: 'A deafened creature can\'t hear and automatically fails ability checks that require hearing.',
    effects: [
      'Cannot hear',
      'Automatically fails ability checks that require hearing'
    ],
    mechanicsImpact: {
      attacks: {},
      checks: { autoFailIfHearingRequired: true },
      saves: {},
      actions: {},
      movement: {}
    }
  },

  frightened: {
    name: 'frightened',
    displayName: 'Frightened',
    description: 'A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight.',
    effects: [
      'Disadvantage on ability checks while source of fear is within line of sight',
      'Disadvantage on attack rolls while source of fear is within line of sight',
      'Cannot willingly move closer to the source of fear'
    ],
    mechanicsImpact: {
      attacks: { disadvantageIfSourceVisible: true },
      checks: { disadvantageIfSourceVisible: true },
      saves: {},
      actions: {},
      movement: { cannotApproachSource: true }
    }
  },

  grappled: {
    name: 'grappled',
    displayName: 'Grappled',
    description: 'A grappled creature\'s speed becomes 0, and it can\'t benefit from any bonus to its speed.',
    effects: [
      'Speed becomes 0',
      'Cannot benefit from any bonus to speed',
      'Condition ends if the grappler is incapacitated',
      'Condition ends if an effect removes the grappled creature from the reach of the grappler'
    ],
    mechanicsImpact: {
      attacks: {},
      checks: {},
      saves: {},
      actions: {},
      movement: { speedZero: true, bonusesDisabled: true }
    }
  },

  incapacitated: {
    name: 'incapacitated',
    displayName: 'Incapacitated',
    description: 'An incapacitated creature can\'t take actions or reactions.',
    effects: [
      'Cannot take actions',
      'Cannot take reactions'
    ],
    mechanicsImpact: {
      attacks: { prevented: true },
      checks: {},
      saves: {},
      actions: { prevented: true },
      movement: {}
    }
  },

  invisible: {
    name: 'invisible',
    displayName: 'Invisible',
    description: 'An invisible creature is impossible to see without the aid of magic or a special sense.',
    effects: [
      'Impossible to see without magic or special sense',
      'Heavily obscured for purposes of hiding',
      'Attack rolls have advantage',
      'Attack rolls against this creature have disadvantage'
    ],
    mechanicsImpact: {
      attacks: { advantage: true },
      checks: { advantageOnStealth: true },
      saves: {},
      actions: {},
      movement: {},
      attackedBy: { disadvantage: true }
    }
  },

  paralyzed: {
    name: 'paralyzed',
    displayName: 'Paralyzed',
    description: 'A paralyzed creature is incapacitated and can\'t move or speak.',
    effects: [
      'Incapacitated (can\'t take actions or reactions)',
      'Cannot move or speak',
      'Automatically fails Strength and Dexterity saving throws',
      'Attack rolls against this creature have advantage',
      'Any attack that hits this creature is a critical hit if the attacker is within 5 feet'
    ],
    mechanicsImpact: {
      attacks: { prevented: true },
      checks: {},
      saves: { autoFailStrDex: true },
      actions: { prevented: true },
      movement: { prevented: true, cannotSpeak: true },
      attackedBy: { advantage: true, criticalIfWithin5ft: true }
    }
  },

  petrified: {
    name: 'petrified',
    displayName: 'Petrified',
    description: 'A petrified creature is transformed, along with any nonmagical object it is wearing or carrying, into a solid inanimate substance (usually stone).',
    effects: [
      'Transformed into solid inanimate substance (usually stone)',
      'Weight increases by a factor of ten',
      'Ceases aging',
      'Incapacitated (can\'t take actions or reactions)',
      'Cannot move or speak',
      'Unaware of surroundings',
      'Automatically fails Strength and Dexterity saving throws',
      'Attack rolls against this creature have advantage',
      'Resistant to all damage',
      'Immune to poison and disease (existing poison and disease are suspended)'
    ],
    mechanicsImpact: {
      attacks: { prevented: true },
      checks: {},
      saves: { autoFailStrDex: true },
      actions: { prevented: true },
      movement: { prevented: true, cannotSpeak: true },
      attackedBy: { advantage: true },
      other: { resistantToAllDamage: true, immuneToPoisonDisease: true, unaware: true }
    }
  },

  poisoned: {
    name: 'poisoned',
    displayName: 'Poisoned',
    description: 'A poisoned creature has disadvantage on attack rolls and ability checks.',
    effects: [
      'Disadvantage on attack rolls',
      'Disadvantage on ability checks'
    ],
    mechanicsImpact: {
      attacks: { disadvantage: true },
      checks: { disadvantage: true },
      saves: {},
      actions: {},
      movement: {}
    }
  },

  prone: {
    name: 'prone',
    displayName: 'Prone',
    description: 'A prone creature\'s only movement option is to crawl, unless it stands up and thereby ends the condition.',
    effects: [
      'Only movement option is to crawl (costs extra movement)',
      'Disadvantage on attack rolls',
      'Attack rolls against this creature have advantage if attacker is within 5 feet, otherwise disadvantage',
      'Standing up ends the condition and costs half movement speed'
    ],
    mechanicsImpact: {
      attacks: { disadvantage: true },
      checks: {},
      saves: {},
      actions: {},
      movement: { crawlOnly: true, standCostsHalfMovement: true },
      attackedBy: { advantageIfWithin5ft: true, disadvantageIfBeyond5ft: true }
    }
  },

  restrained: {
    name: 'restrained',
    displayName: 'Restrained',
    description: 'A restrained creature\'s speed becomes 0, and it can\'t benefit from any bonus to its speed.',
    effects: [
      'Speed becomes 0',
      'Cannot benefit from any bonus to speed',
      'Attack rolls have disadvantage',
      'Dexterity saving throws have disadvantage',
      'Attack rolls against this creature have advantage'
    ],
    mechanicsImpact: {
      attacks: { disadvantage: true },
      checks: {},
      saves: { disadvantageOnDex: true },
      actions: {},
      movement: { speedZero: true, bonusesDisabled: true },
      attackedBy: { advantage: true }
    }
  },

  stunned: {
    name: 'stunned',
    displayName: 'Stunned',
    description: 'A stunned creature is incapacitated, can\'t move, and can speak only falteringly.',
    effects: [
      'Incapacitated (can\'t take actions or reactions)',
      'Cannot move',
      'Can speak only falteringly',
      'Automatically fails Strength and Dexterity saving throws',
      'Attack rolls against this creature have advantage'
    ],
    mechanicsImpact: {
      attacks: { prevented: true },
      checks: {},
      saves: { autoFailStrDex: true },
      actions: { prevented: true },
      movement: { prevented: true, canSpeakFalteringly: true },
      attackedBy: { advantage: true }
    }
  },

  unconscious: {
    name: 'unconscious',
    displayName: 'Unconscious',
    description: 'An unconscious creature is incapacitated, can\'t move or speak, and is unaware of its surroundings.',
    effects: [
      'Incapacitated (can\'t take actions or reactions)',
      'Cannot move or speak',
      'Unaware of surroundings',
      'Drops whatever it\'s holding',
      'Falls prone',
      'Automatically fails Strength and Dexterity saving throws',
      'Attack rolls against this creature have advantage',
      'Any attack that hits this creature is a critical hit if the attacker is within 5 feet'
    ],
    mechanicsImpact: {
      attacks: { prevented: true },
      checks: {},
      saves: { autoFailStrDex: true },
      actions: { prevented: true },
      movement: { prevented: true, cannotSpeak: true },
      attackedBy: { advantage: true, criticalIfWithin5ft: true },
      other: { dropsHeldItems: true, fallsProne: true, unaware: true }
    }
  }
};

/**
 * Get condition effects by condition name
 * @param {string} conditionName - Condition name (case-insensitive)
 * @returns {Object|null} Condition effects object or null if not found
 */
function getConditionEffects(conditionName) {
  if (!conditionName || typeof conditionName !== 'string') {
    return null;
  }

  const normalized = conditionName.toLowerCase().trim();
  return CONDITION_EFFECTS[normalized] || null;
}

/**
 * Check if a condition name is valid
 * @param {string} conditionName - Condition name to validate
 * @returns {boolean} True if valid condition name
 */
function isValidCondition(conditionName) {
  if (!conditionName || typeof conditionName !== 'string') {
    return false;
  }

  const normalized = conditionName.toLowerCase().trim();
  return normalized in CONDITION_EFFECTS;
}

/**
 * Get all condition names
 * @returns {string[]} Array of all condition names
 */
function getAllConditionNames() {
  return Object.keys(CONDITION_EFFECTS);
}

module.exports = {
  CONDITION_EFFECTS,
  getConditionEffects,
  isValidCondition,
  getAllConditionNames
};
