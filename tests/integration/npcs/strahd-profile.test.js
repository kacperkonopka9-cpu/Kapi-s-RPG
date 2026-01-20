/**
 * Integration tests for Strahd von Zarovich NPC profile
 *
 * Story: 4-17 (Strahd AI Behavior System)
 * Epic: 4 (Curse of Strahd Content Implementation)
 *
 * Tests verify that Strahd's NPC profile YAML (from Story 4-7) is complete, well-formed,
 * and contains all data needed for AI behavior, legendary actions, lair actions,
 * vampire mechanics, and Epic 3 integration.
 *
 * Target: 30-40 tests across 8 suites, 100% pass rate
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

const STRAHD_PROFILE_PATH = path.join(__dirname, '../../../game-data/npcs/strahd_von_zarovich.yaml');

describe('Strahd NPC Profile Integration Tests', () => {
  let strahdProfile;

  beforeAll(async () => {
    const profileContent = await fs.readFile(STRAHD_PROFILE_PATH, 'utf-8');
    strahdProfile = yaml.load(profileContent);
  });

  // ============================================================
  // SUITE 1: Profile Loading & Structure (5 tests)
  // ============================================================
  describe('Suite 1: Profile Loading & Structure', () => {
    test('Strahd profile file exists and is readable', async () => {
      await expect(fs.access(STRAHD_PROFILE_PATH)).resolves.not.toThrow();
    });

    test('Strahd profile YAML is valid and parseable', () => {
      expect(strahdProfile).toBeDefined();
      expect(typeof strahdProfile).toBe('object');
    });

    test('Strahd profile has required top-level sections', () => {
      expect(strahdProfile).toHaveProperty('npcId');
      expect(strahdProfile).toHaveProperty('name');
      expect(strahdProfile).toHaveProperty('npcType');
      expect(strahdProfile).toHaveProperty('hitPoints');
      expect(strahdProfile).toHaveProperty('legendaryActions');
      expect(strahdProfile).toHaveProperty('lairActions');
      expect(strahdProfile).toHaveProperty('specialAbilities');
      expect(strahdProfile).toHaveProperty('spellcasting');
    });

    test('Strahd basic identifiers are correct', () => {
      expect(strahdProfile.npcId).toBe('strahd_von_zarovich');
      expect(strahdProfile.name).toContain('Strahd');
      expect(strahdProfile.npcType).toBe('legendary_villain');
    });

    test('Strahd profile file is at least 500 lines (comprehensive)', async () => {
      const profileContent = await fs.readFile(STRAHD_PROFILE_PATH, 'utf-8');
      const lineCount = profileContent.split('\n').length;
      expect(lineCount).toBeGreaterThanOrEqual(500); // Story 4-7 delivered 518 lines
    });
  });

  // ============================================================
  // SUITE 2: Legendary Actions (6 tests)
  // ============================================================
  describe('Suite 2: Legendary Actions', () => {
    test('Legendary actions section is present and structured', () => {
      expect(strahdProfile.legendaryActions).toBeDefined();
      expect(strahdProfile.legendaryActions).toHaveProperty('actionsPerRound');
      expect(strahdProfile.legendaryActions).toHaveProperty('actions');
    });

    test('Strahd has 3 legendary actions per round', () => {
      expect(strahdProfile.legendaryActions.actionsPerRound).toBe(3);
    });

    test('Legendary actions array contains exactly 3 actions', () => {
      expect(Array.isArray(strahdProfile.legendaryActions.actions)).toBe(true);
      expect(strahdProfile.legendaryActions.actions).toHaveLength(3);
    });

    test('Legendary Action: Move is correctly defined', () => {
      const moveAction = strahdProfile.legendaryActions.actions.find(a => a.name === 'Move');
      expect(moveAction).toBeDefined();
      expect(moveAction.cost).toBe(1);
      expect(moveAction.description).toContain('without provoking opportunity attacks');
    });

    test('Legendary Action: Unarmed Strike is correctly defined', () => {
      const unarmedAction = strahdProfile.legendaryActions.actions.find(a => a.name === 'Unarmed Strike');
      expect(unarmedAction).toBeDefined();
      expect(unarmedAction.cost).toBe(1);
      expect(unarmedAction.description).toContain('unarmed strike');
    });

    test('Legendary Action: Bite is correctly defined', () => {
      const biteAction = strahdProfile.legendaryActions.actions.find(a => a.name.includes('Bite'));
      expect(biteAction).toBeDefined();
      expect(biteAction.cost).toBe(2);
      expect(biteAction.description).toContain('bite');
    });
  });

  // ============================================================
  // SUITE 3: Lair Actions (5 tests)
  // ============================================================
  describe('Suite 3: Lair Actions', () => {
    test('Lair actions section is present and structured', () => {
      expect(strahdProfile.lairActions).toBeDefined();
      expect(strahdProfile.lairActions).toHaveProperty('initiative');
      expect(strahdProfile.lairActions).toHaveProperty('location');
      expect(strahdProfile.lairActions).toHaveProperty('actions');
    });

    test('Lair actions trigger at initiative count 20', () => {
      expect(strahdProfile.lairActions.initiative).toBe(20);
    });

    test('Lair actions restricted to Castle Ravenloft', () => {
      expect(strahdProfile.lairActions.location).toContain('castle_ravenloft');
    });

    test('Lair actions array contains exactly 3 actions', () => {
      expect(Array.isArray(strahdProfile.lairActions.actions)).toBe(true);
      expect(strahdProfile.lairActions.actions).toHaveLength(3);
    });

    test('Lair actions include Solid Fog, Pass Through Walls, and Control Doors', () => {
      const actionNames = strahdProfile.lairActions.actions.map(a => a.name);
      expect(actionNames.some(name => name.includes('Fog'))).toBe(true);
      expect(actionNames.some(name => name.includes('Wall'))).toBe(true);
      expect(actionNames.some(name => name.includes('Door'))).toBe(true);

      // Verify each has description
      strahdProfile.lairActions.actions.forEach(action => {
        expect(action).toHaveProperty('name');
        expect(action).toHaveProperty('description');
        expect(typeof action.description).toBe('string');
        expect(action.description.length).toBeGreaterThan(20);
      });
    });
  });

  // ============================================================
  // SUITE 4: Special Abilities (Vampire Mechanics) (7 tests)
  // ============================================================
  describe('Suite 4: Special Abilities (Vampire Mechanics)', () => {
    test('Special abilities array exists and is populated', () => {
      expect(strahdProfile.specialAbilities).toBeDefined();
      expect(Array.isArray(strahdProfile.specialAbilities)).toBe(true);
      expect(strahdProfile.specialAbilities.length).toBeGreaterThanOrEqual(5);
    });

    test('Regeneration ability is present', () => {
      const regen = strahdProfile.specialAbilities.find(a => a.name && a.name.toLowerCase().includes('regeneration'));
      expect(regen).toBeDefined();
      expect(regen.description).toBeDefined();
    });

    test('Charm ability is present', () => {
      const charm = strahdProfile.specialAbilities.find(a => a.name && a.name.toLowerCase().includes('charm'));
      expect(charm).toBeDefined();
      expect(charm.description).toBeDefined();
    });

    test('Shapechanger or mist form ability is present', () => {
      const shapechanger = strahdProfile.specialAbilities.find(a =>
        a.name && (a.name.toLowerCase().includes('shape') || a.name.toLowerCase().includes('mist'))
      );
      expect(shapechanger).toBeDefined();
    });

    test('Spider Climb ability is present', () => {
      const spiderClimb = strahdProfile.specialAbilities.find(a => a.name && a.name.toLowerCase().includes('spider'));
      expect(spiderClimb).toBeDefined();
    });

    test('Sunlight weakness is documented', () => {
      // Check if sunlight weakness is mentioned in special abilities or descriptions
      const sunlightAbility = strahdProfile.specialAbilities.find(a =>
        a.name && a.name.toLowerCase().includes('sunlight')
      );
      const sunlightInDescriptions = strahdProfile.specialAbilities.some(a =>
        a.description && a.description.toLowerCase().includes('sunlight')
      );
      expect(sunlightAbility || sunlightInDescriptions).toBeTruthy();
    });

    test('Special abilities include vampire resistances/immunities', () => {
      const resistances = strahdProfile.specialAbilities.find(a =>
        a.name && (a.name.toLowerCase().includes('resistance') || a.name.toLowerCase().includes('immune'))
      );
      expect(resistances).toBeDefined();
    });
  });

  // ============================================================
  // SUITE 5: Spellcasting (7 tests)
  // ============================================================
  describe('Suite 5: Spellcasting', () => {
    test('Spellcasting section is present and structured', () => {
      expect(strahdProfile.spellcasting).toBeDefined();
      expect(strahdProfile.spellcasting).toHaveProperty('ability');
      expect(strahdProfile.spellcasting).toHaveProperty('spellSaveDC');
      expect(strahdProfile.spellcasting).toHaveProperty('spellAttackBonus');
    });

    test('Strahd has Wizard spellcasting with correct stats', () => {
      expect(strahdProfile.spellcasting.ability).toBe('intelligence');
      expect(strahdProfile.spellcasting.spellSaveDC).toBe(18);
      expect(strahdProfile.spellcasting.spellAttackBonus).toBe(10);
    });

    test('Strahd has cantrips (at will)', () => {
      expect(Array.isArray(strahdProfile.spellcasting.cantrips)).toBe(true);
      expect(strahdProfile.spellcasting.cantrips.length).toBeGreaterThanOrEqual(3);
      expect(strahdProfile.spellcasting.cantrips).toContain('mage_hand');
      expect(strahdProfile.spellcasting.cantrips).toContain('prestidigitation');
      expect(strahdProfile.spellcasting.cantrips).toContain('ray_of_frost');
    });

    test('Strahd has spell slots for multiple levels', () => {
      expect(strahdProfile.spellcasting.spellSlots).toBeDefined();
      expect(strahdProfile.spellcasting.spellSlots[1]).toBeGreaterThanOrEqual(2); // At least 2x 1st-level slots
      expect(strahdProfile.spellcasting.spellSlots[4]).toBeGreaterThanOrEqual(2); // At least 2x 4th-level slots
    });

    test('Strahd has Greater Invisibility prepared (key tactical spell)', () => {
      const spells = strahdProfile.spellcasting.spellsPrepared;
      expect(Array.isArray(spells)).toBe(true);
      expect(spells).toContain('greater_invisibility');
    });

    test('Strahd has Scrying prepared (psychological warfare)', () => {
      const spells = strahdProfile.spellcasting.spellsPrepared;
      expect(spells).toContain('scrying');
    });

    test('Strahd has combat spells prepared (Fireball, Blight, etc.)', () => {
      const spells = strahdProfile.spellcasting.spellsPrepared;
      const hasCombatSpells = spells.some(spell =>
        spell.includes('fireball') || spell.includes('blight') || spell.includes('polymorph')
      );
      expect(hasCombatSpells).toBe(true);
    });
  });

  // ============================================================
  // SUITE 6: Combat Stats (5 tests)
  // ============================================================
  describe('Suite 6: Combat Stats', () => {
    test('Strahd has correct HP (144), AC (16)', () => {
      expect(strahdProfile.hitPoints.max).toBe(144);
      expect(strahdProfile.armorClass).toBe(16);
    });

    test('Strahd has correct ability scores (all 18+ except Wis)', () => {
      const abilities = strahdProfile.abilities;
      expect(abilities.strength).toBe(18);
      expect(abilities.dexterity).toBe(18);
      expect(abilities.constitution).toBe(18);
      expect(abilities.intelligence).toBe(20);
      expect(abilities.wisdom).toBe(15);
      expect(abilities.charisma).toBe(18);
    });

    test('Strahd has correct proficiency bonus (+6 for CR 15 legendary creature)', () => {
      expect(strahdProfile.proficiencyBonus).toBe(6);
    });

    test('Strahd has movement documented (speed or movement-related special abilities)', () => {
      // Speed may be in top-level or documented in special abilities/shapechanger
      const hasSpeed = strahdProfile.speed !== undefined;
      const hasMovementAbility = strahdProfile.specialAbilities.some(a =>
        a.description && (a.description.includes('30 ft') || a.description.toLowerCase().includes('speed'))
      );
      expect(hasSpeed || hasMovementAbility).toBe(true);
    });

    test('Strahd is 9th-level Wizard', () => {
      expect(strahdProfile.class).toBe('Wizard');
      expect(strahdProfile.level).toBe(9);
    });
  });

  // ============================================================
  // SUITE 7: AI Behavior Data (4 tests)
  // ============================================================
  describe('Suite 7: AI Behavior Data', () => {
    test('Strahd has aiBehavior section with combat tactics', () => {
      expect(strahdProfile.aiBehavior).toBeDefined();
      expect(strahdProfile.aiBehavior).toHaveProperty('combatTactics');
      expect(typeof strahdProfile.aiBehavior.combatTactics).toBe('string');
      expect(strahdProfile.aiBehavior.combatTactics.length).toBeGreaterThan(100);
    });

    test('AI behavior includes tactical phases or bloodied retreat threshold', () => {
      const tactics = strahdProfile.aiBehavior.combatTactics.toLowerCase();
      const hasPhases = strahdProfile.aiBehavior.tacticalPhases && Array.isArray(strahdProfile.aiBehavior.tacticalPhases);
      const hasBloodiedMention = tactics.includes('bloodied') || tactics.includes('<72') || tactics.includes('<30');
      expect(hasPhases || hasBloodiedMention).toBe(true);
    });

    test('AI behavior includes goals or motivations', () => {
      expect(strahdProfile.aiBehavior.goals || strahdProfile.aiBehavior.motivations).toBeDefined();
      const goals = strahdProfile.aiBehavior.goals || [];
      const motivations = strahdProfile.aiBehavior.motivations || [];
      expect(goals.length + motivations.length).toBeGreaterThan(0);
    });

    test('AI behavior mentions Ireena or Tatyana obsession', () => {
      const behaviorString = JSON.stringify(strahdProfile.aiBehavior).toLowerCase();
      expect(behaviorString.includes('ireena') || behaviorString.includes('tatyana')).toBe(true);
    });
  });

  // ============================================================
  // SUITE 8: Personality & Dialogue (4 tests)
  // ============================================================
  describe('Suite 8: Personality & Dialogue', () => {
    test('Strahd has personality section with traits and flaws', () => {
      expect(strahdProfile.personality).toBeDefined();
      expect(strahdProfile.personality).toHaveProperty('traits');
      expect(strahdProfile.personality).toHaveProperty('flaws');
      expect(Array.isArray(strahdProfile.personality.traits)).toBe(true);
      expect(Array.isArray(strahdProfile.personality.flaws)).toBe(true);
    });

    test('Strahd personality includes obsession with Ireena/Tatyana', () => {
      const personalityString = JSON.stringify(strahdProfile.personality).toLowerCase();
      expect(personalityString.includes('ireena') || personalityString.includes('tatyana')).toBe(true);
    });

    test('Strahd has dialogue samples', () => {
      expect(strahdProfile.dialogue).toBeDefined();
      expect(strahdProfile.dialogue.greeting || strahdProfile.dialogue.combat).toBeDefined();
      const greetings = strahdProfile.dialogue.greeting || [];
      const combat = strahdProfile.dialogue.combat || [];
      expect(greetings.length + combat.length).toBeGreaterThan(0);
    });

    test('Strahd has castle or coffin location references', () => {
      const profileString = JSON.stringify(strahdProfile).toLowerCase();
      expect(profileString.includes('castle') && profileString.includes('coffin')).toBe(true);
    });
  });

  // ============================================================
  // BONUS: Guide Integration Tests (2 tests)
  // ============================================================
  describe('Bonus: Guide Integration', () => {
    test('Strahd profile has comprehensive metadata notes', () => {
      expect(strahdProfile.metadata).toBeDefined();
      expect(strahdProfile.metadata.notes).toBeDefined();
      expect(typeof strahdProfile.metadata.notes).toBe('string');
      expect(strahdProfile.metadata.notes.length).toBeGreaterThan(200);
    });

    test('Strahd profile indicates Epic 3 compatibility', () => {
      const profileString = JSON.stringify(strahdProfile).toLowerCase();
      expect(profileString.includes('epic 3') || profileString.includes('epic3')).toBe(true);
    });
  });
});

// ============================================================
// TEST SUMMARY
// ============================================================
// Total Tests: 44 tests across 8 core suites + 2 bonus tests
//
// Suite 1: Profile Loading & Structure (5 tests)
// Suite 2: Legendary Actions (6 tests)
// Suite 3: Lair Actions (5 tests)
// Suite 4: Special Abilities/Vampire Mechanics (7 tests)
// Suite 5: Spellcasting (7 tests)
// Suite 6: Combat Stats (5 tests)
// Suite 7: AI Behavior Data (4 tests)
// Suite 8: Personality & Dialogue (4 tests)
// Bonus: Guide Integration (2 tests)
//
// Expected Pass Rate: 100% (all tests should pass with Story 4-7 Strahd YAML)
// ============================================================
