/**
 * SpellManager Test Suite
 *
 * Tests for D&D 5e spell casting and management system
 * Target: ≥95% coverage with unit, integration, and performance tests
 */

const SpellManager = require('../../src/mechanics/spell-manager');
const SpellDatabase = require('../../src/mechanics/spell-database');
const DiceRoller = require('../../src/mechanics/dice-roller');
const path = require('path');

describe('SpellManager', () => {
  let manager;
  let mockSpellDatabase;
  let mockDiceRoller;

  beforeEach(() => {
    // Mock SpellDatabase
    mockSpellDatabase = {
      getSpell: jest.fn(),
      getSpellsByClass: jest.fn()
    };

    // Mock DiceRoller
    mockDiceRoller = {
      roll: jest.fn()
    };

    manager = new SpellManager({
      spellDatabase: mockSpellDatabase,
      diceRoller: mockDiceRoller
    });
  });

  describe('Constructor', () => {
    test('should create instance with default dependencies', () => {
      const mgr = new SpellManager();
      expect(mgr).toBeInstanceOf(SpellManager);
      expect(mgr.spellDatabase).toBeInstanceOf(SpellDatabase);
      expect(mgr.diceRoller).toBeInstanceOf(DiceRoller);
    });

    test('should accept custom dependencies via DI', () => {
      expect(manager.spellDatabase).toBe(mockSpellDatabase);
      expect(manager.diceRoller).toBe(mockDiceRoller);
    });
  });

  describe('castSpell()', () => {
    let character;
    let target;
    let healingSpell;
    let damageSpell;

    beforeEach(() => {
      character = {
        name: 'Test Cleric',
        class: 'Cleric',
        level: 3,
        abilityScores: {
          Wisdom: 14
        },
        spellcasting: {
          spellSlots: {1: 3, 2: 2, 3: 1},
          spellsPrepared: ['cure_wounds']
        }
      };

      target = {
        name: 'Target',
        hitPoints: {current: 10, max: 20}
      };

      healingSpell = {
        id: 'cure_wounds',
        name: 'Cure Wounds',
        level: 1,
        school: 'Evocation',
        concentration: false,
        effect: {
          type: 'healing',
          healing: '1d8'
        },
        upcastBonus: '+1d8 per slot level above 1st'
      };

      damageSpell = {
        id: 'fireball',
        name: 'Fireball',
        level: 3,
        school: 'Evocation',
        concentration: false,
        effect: {
          type: 'damage',
          damage: '8d6',
          damageType: 'fire',
          saveType: 'Dexterity',
          saveEffect: 'half'
        },
        upcastBonus: '+1d6 per slot level above 3rd'
      };
    });

    test('should cast healing spell successfully', async () => {
      mockSpellDatabase.getSpell.mockResolvedValue({
        success: true,
        data: healingSpell,
        error: null
      });

      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: {total: 7, rolls: [7]},
        error: null
      });

      const result = await manager.castSpell(character, 'cure_wounds', 1, target);

      expect(result.success).toBe(true);
      expect(result.data.effectType).toBe('healing');
      expect(result.data.amount).toBe(9); // 7 + 2 (Wis mod)
      expect(result.data.newHP).toBe(19); // 10 + 9
      expect(result.data.slotsRemaining[1]).toBe(2); // 3 - 1
      expect(character.spellcasting.spellSlots[1]).toBe(2);
    });

    test('should cast damage spell successfully', async () => {
      mockSpellDatabase.getSpell.mockResolvedValue({
        success: true,
        data: damageSpell,
        error: null
      });

      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: {total: 28, rolls: [3,4,5,2,6,3,4,1]},
        error: null
      });

      const result = await manager.castSpell(character, 'fireball', 3, target);

      expect(result.success).toBe(true);
      expect(result.data.effectType).toBe('damage');
      expect(result.data.damage).toBe(28);
      expect(result.data.damageType).toBe('fire');
      expect(result.data.saveDC).toBe(12); // 8 + 2 (prof) + 2 (Wis mod)
      expect(result.data.saveType).toBe('Dexterity');
      expect(character.spellcasting.spellSlots[3]).toBe(0); // 1 - 1
    });

    test('should return error if spell not found', async () => {
      mockSpellDatabase.getSpell.mockResolvedValue({
        success: false,
        data: null,
        error: 'Spell not found'
      });

      const result = await manager.castSpell(character, 'invalid_spell', 1, target);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Spell not found');
    });

    test('should return error if no spell slots available', async () => {
      character.spellcasting.spellSlots[1] = 0;

      mockSpellDatabase.getSpell.mockResolvedValue({
        success: true,
        data: healingSpell,
        error: null
      });

      const result = await manager.castSpell(character, 'cure_wounds', 1, target);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No spell slots available at level 1');
    });

    test('should return error if slot level too low for spell', async () => {
      mockSpellDatabase.getSpell.mockResolvedValue({
        success: true,
        data: damageSpell, // level 3 spell
        error: null
      });

      const result = await manager.castSpell(character, 'fireball', 1, target); // trying level 1 slot

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot cast level 3 spell with level 1 slot');
    });

    test('should support upcasting with bonus dice', async () => {
      mockSpellDatabase.getSpell.mockResolvedValue({
        success: true,
        data: healingSpell,
        error: null
      });

      // Should roll 3d8 (1d8 + 2d8 upcast bonus)
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: {total: 15, rolls: [5, 6, 4]},
        error: null
      });

      const result = await manager.castSpell(character, 'cure_wounds', 3, target);

      expect(result.success).toBe(true);
      expect(result.data.upcast).toBe(true);
      expect(mockDiceRoller.roll).toHaveBeenCalledWith('3d8');
      expect(result.data.amount).toBe(17); // 15 + 2 (Wis mod)
    });

    test('should validate character input', async () => {
      const result = await manager.castSpell(null, 'cure_wounds', 1, target);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Character must be a valid object');
    });

    test('should validate spell ID input', async () => {
      const result = await manager.castSpell(character, '', 1, target);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Spell ID must be a non-empty string');
    });

    test('should validate slot level input', async () => {
      const result = await manager.castSpell(character, 'cure_wounds', 10, target);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Slot level must be a number between 1 and 9');
    });
  });

  describe('prepareSpells()', () => {
    let character;

    beforeEach(() => {
      character = {
        name: 'Test Cleric',
        class: 'Cleric',
        level: 3,
        abilityScores: {
          Wisdom: 14 // +2 modifier
        },
        spellcasting: {
          spellSlots: {1: 4, 2: 2},
          spellsPrepared: []
        }
      };
    });

    test('should prepare spells within limit', async () => {
      const spellIds = ['cure_wounds', 'bless', 'shield_of_faith'];
      const classSpells = [
        {id: 'cure_wounds', name: 'Cure Wounds'},
        {id: 'bless', name: 'Bless'},
        {id: 'shield_of_faith', name: 'Shield of Faith'},
        {id: 'guiding_bolt', name: 'Guiding Bolt'}
      ];

      mockSpellDatabase.getSpellsByClass.mockResolvedValue({
        success: true,
        data: classSpells,
        error: null
      });

      const result = await manager.prepareSpells(character, spellIds);

      expect(result.success).toBe(true);
      expect(result.data.prepared).toEqual(spellIds);
      expect(result.data.maxPrepared).toBe(5); // Wis mod (2) + level (3)
      expect(character.spellcasting.spellsPrepared).toEqual(spellIds);
    });

    test('should return error if too many spells', async () => {
      const spellIds = ['spell1', 'spell2', 'spell3', 'spell4', 'spell5', 'spell6'];

      mockSpellDatabase.getSpellsByClass.mockResolvedValue({
        success: true,
        data: spellIds.map(id => ({id, name: id})),
        error: null
      });

      const result = await manager.prepareSpells(character, spellIds);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Too many spells to prepare');
      expect(result.error).toContain('Maximum: 5');
    });

    test('should return error if spell not in class list', async () => {
      const spellIds = ['cure_wounds', 'fireball']; // fireball not cleric spell
      const classSpells = [{id: 'cure_wounds', name: 'Cure Wounds'}];

      mockSpellDatabase.getSpellsByClass.mockResolvedValue({
        success: true,
        data: classSpells,
        error: null
      });

      const result = await manager.prepareSpells(character, spellIds);

      expect(result.success).toBe(false);
      expect(result.error).toContain('fireball');
      expect(result.error).toContain('not available to Cleric');
    });

    test('should validate character input', async () => {
      const result = await manager.prepareSpells(null, ['cure_wounds']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Character must be a valid object');
    });

    test('should validate spell IDs array', async () => {
      const result = await manager.prepareSpells(character, 'not_an_array');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Spell IDs must be an array');
    });

    test('should return error if character has no spellcasting', async () => {
      delete character.spellcasting;
      const result = await manager.prepareSpells(character, ['cure_wounds']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('does not have spellcasting ability');
    });
  });

  describe('_handleConcentration()', () => {
    let character;
    let concentrationSpell;
    let nonConcentrationSpell;

    beforeEach(() => {
      character = {
        name: 'Test',
        concentrating: null
      };

      concentrationSpell = {
        id: 'hold_person',
        concentration: true
      };

      nonConcentrationSpell = {
        id: 'cure_wounds',
        concentration: false
      };
    });

    test('should mark concentration spell as active', () => {
      const result = manager._handleConcentration(character, concentrationSpell);

      expect(result.concentrating).toBe(true);
      expect(result.brokePrevious).toBe(false);
      expect(character.concentrating).toBe('hold_person');
    });

    test('should not mark non-concentration spell', () => {
      const result = manager._handleConcentration(character, nonConcentrationSpell);

      expect(result.concentrating).toBe(false);
      expect(result.brokePrevious).toBe(false);
    });

    test('should break previous concentration', () => {
      character.concentrating = 'bless';

      const result = manager._handleConcentration(character, concentrationSpell);

      expect(result.concentrating).toBe(true);
      expect(result.brokePrevious).toBe(true);
      expect(character.concentrating).toBe('hold_person');
    });
  });

  describe('_calculateSpellSaveDC()', () => {
    test('should calculate save DC correctly', () => {
      const character = {
        level: 3,
        class: 'Cleric',
        abilityScores: {Wisdom: 14}
      };

      const saveDC = manager._calculateSpellSaveDC(character);

      // 8 + prof (2) + Wis mod (2) = 12
      expect(saveDC).toBe(12);
    });

    test('should calculate save DC for high level character', () => {
      const character = {
        level: 17,
        class: 'Wizard',
        abilityScores: {Intelligence: 20}
      };

      const saveDC = manager._calculateSpellSaveDC(character);

      // 8 + prof (6) + Int mod (5) = 19
      expect(saveDC).toBe(19);
    });
  });

  describe('_getProficiencyBonus()', () => {
    test('should calculate proficiency for level 1-4', () => {
      expect(manager._getProficiencyBonus(1)).toBe(2);
      expect(manager._getProficiencyBonus(4)).toBe(2);
    });

    test('should calculate proficiency for level 5-8', () => {
      expect(manager._getProficiencyBonus(5)).toBe(3);
      expect(manager._getProficiencyBonus(8)).toBe(3);
    });

    test('should calculate proficiency for level 9-12', () => {
      expect(manager._getProficiencyBonus(9)).toBe(4);
      expect(manager._getProficiencyBonus(12)).toBe(4);
    });

    test('should calculate proficiency for level 13-16', () => {
      expect(manager._getProficiencyBonus(13)).toBe(5);
      expect(manager._getProficiencyBonus(16)).toBe(5);
    });

    test('should calculate proficiency for level 17-20', () => {
      expect(manager._getProficiencyBonus(17)).toBe(6);
      expect(manager._getProficiencyBonus(20)).toBe(6);
    });
  });

  describe('_getSpellcastingAbility()', () => {
    test('should return Wisdom for divine casters', () => {
      expect(manager._getSpellcastingAbility('Cleric')).toBe('Wisdom');
      expect(manager._getSpellcastingAbility('Druid')).toBe('Wisdom');
      expect(manager._getSpellcastingAbility('Ranger')).toBe('Wisdom');
    });

    test('should return Intelligence for arcane casters', () => {
      expect(manager._getSpellcastingAbility('Wizard')).toBe('Intelligence');
    });

    test('should return Charisma for charisma casters', () => {
      expect(manager._getSpellcastingAbility('Bard')).toBe('Charisma');
      expect(manager._getSpellcastingAbility('Paladin')).toBe('Charisma');
      expect(manager._getSpellcastingAbility('Sorcerer')).toBe('Charisma');
      expect(manager._getSpellcastingAbility('Warlock')).toBe('Charisma');
    });
  });

  describe('_parseUpcastBonus()', () => {
    test('should parse upcast bonus correctly', () => {
      const bonus = manager._parseUpcastBonus('+1d8 per slot level above 1st', 2);
      expect(bonus).toBe('2d8');
    });

    test('should handle multiple dice', () => {
      const bonus = manager._parseUpcastBonus('+2d6 per slot level above 2nd', 3);
      expect(bonus).toBe('6d6');
    });

    test('should handle single level difference', () => {
      const bonus = manager._parseUpcastBonus('+1d6 per slot level above 3rd', 1);
      expect(bonus).toBe('1d6');
    });
  });

  describe('Integration Tests', () => {
    test('should cast Cure Wounds with real SpellDatabase', async () => {
      const realManager = new SpellManager();
      await realManager.spellDatabase.loadSpells(path.join(__dirname, '../../data/srd/spells.yaml'));

      const character = {
        class: 'Cleric',
        level: 3,
        abilityScores: {Wisdom: 14},
        spellcasting: {
          spellSlots: {1: 4},
          spellsPrepared: ['cure_wounds']
        }
      };

      const target = {
        hitPoints: {current: 10, max: 20}
      };

      const result = await realManager.castSpell(character, 'cure_wounds', 1, target);

      expect(result.success).toBe(true);
      expect(result.data.effectType).toBe('healing');
      expect(result.data.amount).toBeGreaterThanOrEqual(3); // 1d8 + 2 min
      expect(result.data.amount).toBeLessThanOrEqual(10); // 1d8 + 2 max
      expect(character.spellcasting.spellSlots[1]).toBe(3);
    }, 10000);
  });

  describe('Performance Tests', () => {
    test('castSpell() should complete in < 200ms', async () => {
      const character = {
        class: 'Cleric',
        level: 3,
        abilityScores: {Wisdom: 14},
        spellcasting: {
          spellSlots: {1: 4},
          spellsPrepared: ['cure_wounds']
        }
      };

      mockSpellDatabase.getSpell.mockResolvedValue({
        success: true,
        data: {
          id: 'cure_wounds',
          level: 1,
          concentration: false,
          effect: {type: 'healing', healing: '1d8'},
          upcastBonus: '+1d8 per slot level above 1st'
        },
        error: null
      });

      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: {total: 5},
        error: null
      });

      const start = Date.now();
      await manager.castSpell(character, 'cure_wounds', 1, null);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
    });
  });
});
