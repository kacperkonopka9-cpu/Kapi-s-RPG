/**
 * Tests for Mechanics Command Handler
 *
 * Tests all slash commands with mocked dependencies.
 * Target: ≥80% statement coverage, 100% function coverage
 */

const MechanicsCommandHandler = require('../../src/commands/mechanics-commands');
const fs = require('fs').promises;

// Mock dependencies
const mockDiceRoller = {
  roll: jest.fn()
};

const mockCharacterManager = {
  loadCharacter: jest.fn(),
  saveCharacter: jest.fn()
};

const mockAbilityCheckHandler = {
  performCheck: jest.fn()
};

const mockSkillCheckSystem = {
  performSkillCheck: jest.fn()
};

const mockCombatManager = {
  getCurrentCombat: jest.fn()
};

const mockAttackResolver = {
  resolveAttack: jest.fn()
};

const mockSpellDatabase = {
  getSpell: jest.fn()
};

const mockSpellManager = {
  castSpell: jest.fn()
};

const mockInventoryManager = {};

const mockLevelUpCalculator = {
  canLevelUp: jest.fn(),
  levelUp: jest.fn()
};

// Mock fs
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    appendFile: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn()
  }
}));

describe('MechanicsCommandHandler', () => {
  let handler;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create handler with mocked dependencies
    handler = new MechanicsCommandHandler({
      diceRoller: mockDiceRoller,
      characterManager: mockCharacterManager,
      abilityCheckHandler: mockAbilityCheckHandler,
      skillCheckSystem: mockSkillCheckSystem,
      combatManager: mockCombatManager,
      attackResolver: mockAttackResolver,
      spellDatabase: mockSpellDatabase,
      spellManager: mockSpellManager,
      inventoryManager: mockInventoryManager,
      levelUpCalculator: mockLevelUpCalculator
    });

    // Set up default active character
    handler.activeCharacter = {
      name: 'Test Fighter',
      level: 3,
      class: 'Fighter',
      abilities: {
        strength: 16,
        dexterity: 14,
        constitution: 15,
        intelligence: 10,
        wisdom: 12,
        charisma: 8
      },
      hitPoints: {
        max: 31,
        current: 31,
        hitDice: { total: 3, spent: 0 }
      },
      armorClass: 18,
      inventory: {
        equipped: {
          mainHand: {
            name: 'Longsword',
            damage: '1d8',
            damageType: 'slashing'
          }
        }
      }
    };
    handler.activeCharacterId = 'test-fighter';
  });

  describe('executeCommand', () => {
    test('should return error for unknown command', async () => {
      const result = await handler.executeCommand('invalid', []);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown command');
      expect(result.error).toContain('/mechanics-help');
    });

    test('should execute valid command', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { notation: '1d20', rolls: [15], modifier: 0, total: 15 },
        error: null
      });

      const result = await handler.executeCommand('roll', ['1d20']);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('total', 15);
    });

    test('should log command execution', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { notation: '1d20', rolls: [15], modifier: 0, total: 15 },
        error: null
      });

      await handler.executeCommand('roll', ['1d20']);

      expect(fs.appendFile).toHaveBeenCalled();
      const logEntry = fs.appendFile.mock.calls[0][1];
      expect(logEntry).toContain('[COMMAND]');
      expect(logEntry).toContain('/roll');
      expect(logEntry).toContain('SUCCESS');
    });

    test('should handle command errors gracefully', async () => {
      mockDiceRoller.roll.mockRejectedValue(new Error('Dice error'));

      const result = await handler.executeCommand('roll', ['invalid']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Command error');
      expect(result.error).toContain('Usage:');
    });
  });

  describe('/roll command', () => {
    test('should roll dice with valid notation', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { notation: '1d20+5', rolls: [15], modifier: 5, total: 20 },
        error: null
      });

      const result = await handler.handleRoll(['1d20+5']);

      expect(result.success).toBe(true);
      expect(result.data.notation).toBe('1d20+5');
      expect(result.data.total).toBe(20);
      expect(result.data.formatted).toContain('[15]');
      expect(result.data.formatted).toContain('+5');
      expect(result.data.formatted).toContain('= 20');
    });

    test('should support advantage', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { notation: '1d20', rolls: [18, 12], modifier: 0, total: 18 },
        error: null
      });

      const result = await handler.handleRoll(['1d20', 'advantage']);

      expect(result.success).toBe(true);
      expect(result.data.advantage).toBe(true);
      expect(result.data.formatted).toContain('(advantage)');
      expect(mockDiceRoller.roll).toHaveBeenCalledWith('1d20', { advantage: true, disadvantage: false });
    });

    test('should support disadvantage', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { notation: '1d20', rolls: [5, 14], modifier: 0, total: 5 },
        error: null
      });

      const result = await handler.handleRoll(['1d20', 'disadvantage']);

      expect(result.success).toBe(true);
      expect(result.data.disadvantage).toBe(true);
      expect(result.data.formatted).toContain('(disadvantage)');
    });

    test('should return error for missing dice notation', async () => {
      const result = await handler.handleRoll([]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing dice notation');
      expect(result.error).toContain('Usage:');
    });

    test('should return error for invalid dice notation', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: false,
        data: null,
        error: 'Invalid notation'
      });

      const result = await handler.handleRoll(['invalid']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid dice notation');
    });

    test('should complete in <100ms', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { notation: '1d20', rolls: [15], modifier: 0, total: 15 },
        error: null
      });

      const start = Date.now();
      await handler.handleRoll(['1d20']);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('/check command', () => {
    test('should perform ability check successfully', async () => {
      mockAbilityCheckHandler.performCheck.mockResolvedValue({
        success: true,
        data: { roll: 15, modifier: 3, total: 18, DC: 15, passed: true },
        error: null
      });

      const result = await handler.handleCheck(['strength', '15']);

      expect(result.success).toBe(true);
      expect(result.data.passed).toBe(true);
      expect(result.data.formatted).toContain('Strength Check');
      expect(result.data.formatted).toContain('1d20(15)');
      expect(result.data.formatted).toContain('+ 3');
      expect(result.data.formatted).toContain('= 18');
      expect(result.data.formatted).toContain('vs DC 15');
      expect(result.data.formatted).toContain('SUCCESS');
    });

    test('should handle failed ability check', async () => {
      mockAbilityCheckHandler.performCheck.mockResolvedValue({
        success: true,
        data: { roll: 8, modifier: 3, total: 11, DC: 15, passed: false },
        error: null
      });

      const result = await handler.handleCheck(['strength', '15']);

      expect(result.success).toBe(true);
      expect(result.data.passed).toBe(false);
      expect(result.data.formatted).toContain('FAIL');
    });

    test('should return error when no active character', async () => {
      handler.activeCharacter = null;

      const result = await handler.handleCheck(['strength', '15']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active character');
      expect(result.error).toContain('/set-character');
    });

    test('should return error for missing arguments', async () => {
      const result = await handler.handleCheck(['strength']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing arguments');
      expect(result.error).toContain('Usage:');
    });

    test('should return error for invalid DC', async () => {
      const result = await handler.handleCheck(['strength', 'invalid']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid DC');
    });

    test('should test all 6 abilities', async () => {
      const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

      for (const ability of abilities) {
        mockAbilityCheckHandler.performCheck.mockResolvedValue({
          success: true,
          data: { roll: 10, modifier: 2, total: 12, DC: 10, passed: true },
          error: null
        });

        const result = await handler.handleCheck([ability, '10']);

        expect(result.success).toBe(true);
        expect(mockAbilityCheckHandler.performCheck).toHaveBeenCalledWith(
          handler.activeCharacter,
          ability,
          10
        );
      }
    });

    test('should complete in <200ms', async () => {
      mockAbilityCheckHandler.performCheck.mockResolvedValue({
        success: true,
        data: { roll: 15, modifier: 3, total: 18, DC: 15, passed: true },
        error: null
      });

      const start = Date.now();
      await handler.handleCheck(['strength', '15']);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
    });
  });

  describe('/skill command', () => {
    test('should perform skill check with proficiency', async () => {
      mockSkillCheckSystem.performSkillCheck.mockResolvedValue({
        success: true,
        data: {
          roll: 12,
          abilityMod: 2,
          proficiencyBonus: 2,
          total: 16,
          DC: 12,
          passed: true,
          isProficient: true
        },
        error: null
      });

      const result = await handler.handleSkill(['perception', '12']);

      expect(result.success).toBe(true);
      expect(result.data.isProficient).toBe(true);
      expect(result.data.formatted).toContain('Perception Check');
      expect(result.data.formatted).toContain('+ 2 (proficient)');
      expect(result.data.formatted).toContain('SUCCESS');
    });

    test('should perform skill check without proficiency', async () => {
      mockSkillCheckSystem.performSkillCheck.mockResolvedValue({
        success: true,
        data: {
          roll: 14,
          abilityMod: 1,
          proficiencyBonus: 0,
          total: 15,
          DC: 12,
          passed: true,
          isProficient: false
        },
        error: null
      });

      const result = await handler.handleSkill(['stealth', '12']);

      expect(result.success).toBe(true);
      expect(result.data.isProficient).toBe(false);
      expect(result.data.formatted).toContain('(not proficient)');
    });

    test('should return error when no active character', async () => {
      handler.activeCharacter = null;

      const result = await handler.handleSkill(['perception', '12']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active character');
    });

    test('should return error for missing arguments', async () => {
      const result = await handler.handleSkill(['perception']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing arguments');
    });

    test('should complete in <200ms', async () => {
      mockSkillCheckSystem.performSkillCheck.mockResolvedValue({
        success: true,
        data: {
          roll: 12,
          abilityMod: 2,
          proficiencyBonus: 2,
          total: 16,
          DC: 12,
          passed: true,
          isProficient: true
        },
        error: null
      });

      const start = Date.now();
      await handler.handleSkill(['perception', '12']);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
    });
  });

  describe('/attack command', () => {
    beforeEach(() => {
      // Set up combat state
      mockCombatManager.getCurrentCombat.mockReturnValue({
        combatants: [
          handler.activeCharacter,
          {
            name: 'Zombie',
            armorClass: 8,
            hitPoints: { max: 15, current: 15 }
          }
        ]
      });
    });

    test('should execute successful attack', async () => {
      mockAttackResolver.resolveAttack.mockResolvedValue({
        success: true,
        data: {
          hit: true,
          attackRoll: 18,
          damage: 9,
          damageType: 'slashing',
          isCritical: false
        },
        error: null
      });

      const result = await handler.handleAttack(['zombie']);

      expect(result.success).toBe(true);
      expect(result.data.hit).toBe(true);
      expect(result.data.damage).toBe(9);
      expect(result.data.formatted).toContain('HIT');
      expect(result.data.formatted).toContain('9 slashing');
      expect(result.data.targetHP.old).toBe(15);
      expect(result.data.targetHP.new).toBe(6);
    });

    test('should handle missed attack', async () => {
      mockAttackResolver.resolveAttack.mockResolvedValue({
        success: true,
        data: {
          hit: false,
          attackRoll: 5,
          damage: 0,
          damageType: 'slashing',
          isCritical: false
        },
        error: null
      });

      const result = await handler.handleAttack(['zombie']);

      expect(result.success).toBe(true);
      expect(result.data.hit).toBe(false);
      expect(result.data.formatted).toContain('MISS');
    });

    test('should handle critical hit', async () => {
      mockAttackResolver.resolveAttack.mockResolvedValue({
        success: true,
        data: {
          hit: true,
          attackRoll: 20,
          damage: 16,
          damageType: 'slashing',
          isCritical: true
        },
        error: null
      });

      const result = await handler.handleAttack(['zombie']);

      expect(result.success).toBe(true);
      expect(result.data.isCritical).toBe(true);
      expect(result.data.formatted).toContain('CRITICAL!');
    });

    test('should return error when no active character', async () => {
      handler.activeCharacter = null;

      const result = await handler.handleAttack(['zombie']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active character');
    });

    test('should return error when no active combat', async () => {
      mockCombatManager.getCurrentCombat.mockReturnValue(null);

      const result = await handler.handleAttack(['zombie']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active combat');
    });

    test('should return error when target not found', async () => {
      const result = await handler.handleAttack(['dragon']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Target not found');
      expect(result.error).toContain('Available targets');
    });

    test('should return error when no weapon equipped', async () => {
      handler.activeCharacter.inventory.equipped.mainHand = null;

      const result = await handler.handleAttack(['zombie']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No weapon equipped');
    });

    test('should return error for missing target', async () => {
      const result = await handler.handleAttack([]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing target');
    });

    test('should complete in <300ms', async () => {
      mockAttackResolver.resolveAttack.mockResolvedValue({
        success: true,
        data: {
          hit: true,
          attackRoll: 18,
          damage: 9,
          damageType: 'slashing',
          isCritical: false
        },
        error: null
      });

      const start = Date.now();
      await handler.handleAttack(['zombie']);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(300);
    });
  });

  describe('/cast command', () => {
    test('should cast healing spell successfully', async () => {
      mockSpellDatabase.getSpell.mockResolvedValue({
        success: true,
        data: {
          id: 'cure_wounds',
          name: 'Cure Wounds',
          level: 1,
          school: 'evocation'
        },
        error: null
      });

      mockSpellManager.castSpell.mockResolvedValue({
        success: true,
        data: {
          slotConsumed: true,
          slotsRemaining: 2,
          effect: { description: 'Healed 7 HP' }
        },
        error: null
      });

      mockCombatManager.getCurrentCombat.mockReturnValue(null);

      const result = await handler.handleCast(['cure', 'wounds']);

      expect(result.success).toBe(true);
      expect(result.data.slotConsumed).toBe(true);
      expect(result.data.formatted).toContain('Cure Wounds');
      expect(result.data.formatted).toContain('1 level slot consumed');
      expect(result.data.formatted).toContain('2 remaining');
    });

    test('should cast cantrip without consuming slot', async () => {
      mockSpellDatabase.getSpell.mockResolvedValue({
        success: true,
        data: {
          id: 'fire_bolt',
          name: 'Fire Bolt',
          level: 0,
          school: 'evocation'
        },
        error: null
      });

      mockSpellManager.castSpell.mockResolvedValue({
        success: true,
        data: {
          slotConsumed: false,
          slotsRemaining: 3,
          effect: { description: 'Dealt 1d10 fire damage' }
        },
        error: null
      });

      mockCombatManager.getCurrentCombat.mockReturnValue(null);

      const result = await handler.handleCast(['fire', 'bolt']);

      expect(result.success).toBe(true);
      expect(result.data.slotConsumed).toBe(false);
      expect(result.data.formatted).toContain('cantrip, no slot consumed');
    });

    test('should return error when no active character', async () => {
      handler.activeCharacter = null;

      const result = await handler.handleCast(['cure', 'wounds']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active character');
    });

    test('should return error when spell not found', async () => {
      mockSpellDatabase.getSpell.mockResolvedValue({
        success: false,
        data: null,
        error: 'Spell not in database'
      });

      const result = await handler.handleCast(['invalid', 'spell']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Spell not found');
    });

    test('should return error when out of spell slots', async () => {
      mockSpellDatabase.getSpell.mockResolvedValue({
        success: true,
        data: {
          id: 'cure_wounds',
          name: 'Cure Wounds',
          level: 1,
          school: 'evocation'
        },
        error: null
      });

      mockSpellManager.castSpell.mockResolvedValue({
        success: false,
        data: null,
        error: 'No 1st level spell slots remaining'
      });

      mockCombatManager.getCurrentCombat.mockReturnValue(null);

      const result = await handler.handleCast(['cure', 'wounds']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No 1st level spell slots remaining');
    });

    test('should return error for missing spell name', async () => {
      const result = await handler.handleCast([]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing spell name');
    });

    test('should complete in <400ms', async () => {
      mockSpellDatabase.getSpell.mockResolvedValue({
        success: true,
        data: {
          id: 'cure_wounds',
          name: 'Cure Wounds',
          level: 1,
          school: 'evocation'
        },
        error: null
      });

      mockSpellManager.castSpell.mockResolvedValue({
        success: true,
        data: {
          slotConsumed: true,
          slotsRemaining: 2,
          effect: { description: 'Healed 7 HP' }
        },
        error: null
      });

      mockCombatManager.getCurrentCombat.mockReturnValue(null);

      const start = Date.now();
      await handler.handleCast(['cure', 'wounds']);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(400);
    });
  });

  describe('/rest command', () => {
    test('should take short rest', async () => {
      const result = await handler.handleRest(['short']);

      expect(result.success).toBe(true);
      expect(result.data.restType).toBe('short');
      expect(result.data.duration).toBe('1 hour');
      expect(result.data.formatted).toContain('Short Rest');
    });

    test('should take long rest and restore HP', async () => {
      handler.activeCharacter.hitPoints.current = 20;

      const result = await handler.handleRest(['long']);

      expect(result.success).toBe(true);
      expect(result.data.restType).toBe('long');
      expect(result.data.duration).toBe('8 hours');
      expect(result.data.hpRestored).toBe(11);
      expect(result.data.maxHP).toBe(31);
      expect(handler.activeCharacter.hitPoints.current).toBe(31);
    });

    test('should return error when no active character', async () => {
      handler.activeCharacter = null;

      const result = await handler.handleRest(['long']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active character');
    });

    test('should return error for missing rest type', async () => {
      const result = await handler.handleRest([]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing rest type');
    });

    test('should return error for invalid rest type', async () => {
      const result = await handler.handleRest(['invalid']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid rest type');
      expect(result.error).toContain('"short" or "long"');
    });

    test('should complete in <500ms', async () => {
      const start = Date.now();
      await handler.handleRest(['long']);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });
  });

  describe('/level-up command', () => {
    test('should level up eligible character', async () => {
      mockLevelUpCalculator.canLevelUp.mockResolvedValue({
        success: true,
        data: {
          canLevel: true,
          currentLevel: 3,
          nextLevel: 4,
          xpNeeded: 2700
        },
        error: null
      });

      mockLevelUpCalculator.levelUp.mockResolvedValue({
        success: true,
        data: {
          newLevel: 4,
          hpIncrease: 8,
          featuresGranted: [{ name: 'Ability Score Improvement' }],
          asiAvailable: true
        },
        error: null
      });

      const result = await handler.handleLevelUp([]);

      expect(result.success).toBe(true);
      expect(result.data.newLevel).toBe(4);
      expect(result.data.asiAvailable).toBe(true);
      expect(result.data.formatted).toContain('Level Up!');
      expect(result.data.formatted).toContain('level 4');
      expect(result.data.formatted).toContain('ASI available');
    });

    test('should return error when character not eligible', async () => {
      mockLevelUpCalculator.canLevelUp.mockResolvedValue({
        success: true,
        data: {
          canLevel: false,
          currentLevel: 3,
          xpNeeded: 2700,
          reason: 'Insufficient XP'
        },
        error: null
      });

      const result = await handler.handleLevelUp([]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot level up');
      expect(result.error).toContain('Insufficient XP');
    });

    test('should return error when no active character', async () => {
      handler.activeCharacter = null;

      const result = await handler.handleLevelUp([]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active character');
    });

    test('should complete in <1000ms', async () => {
      mockLevelUpCalculator.canLevelUp.mockResolvedValue({
        success: true,
        data: {
          canLevel: true,
          currentLevel: 3,
          nextLevel: 4,
          xpNeeded: 2700
        },
        error: null
      });

      mockLevelUpCalculator.levelUp.mockResolvedValue({
        success: true,
        data: {
          newLevel: 4,
          hpIncrease: 8,
          featuresGranted: [{ name: 'Ability Score Improvement' }],
          asiAvailable: true
        },
        error: null
      });

      const start = Date.now();
      await handler.handleLevelUp([]);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });
  });

  describe('/set-character command', () => {
    test('should set active character', async () => {
      const testCharacter = {
        name: 'Kapi',
        level: 5,
        class: 'Fighter'
      };

      mockCharacterManager.loadCharacter.mockResolvedValue({
        success: true,
        data: testCharacter,
        error: null
      });

      const result = await handler.handleSetCharacter(['kapi']);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Kapi');
      expect(result.data.level).toBe(5);
      expect(result.data.class).toBe('Fighter');
      expect(handler.activeCharacter).toBe(testCharacter);
      expect(handler.activeCharacterId).toBe('kapi');
      expect(result.data.formatted).toContain('Active character set to');
    });

    test('should return error when character not found', async () => {
      mockCharacterManager.loadCharacter.mockResolvedValue({
        success: false,
        data: null,
        error: 'Character file not found'
      });

      fs.readdir.mockResolvedValue(['test-fighter.yaml', 'kapi.yaml']);

      const result = await handler.handleSetCharacter(['invalid']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Character not found');
      expect(result.error).toContain('Available characters');
      expect(result.error).toContain('test-fighter');
      expect(result.error).toContain('kapi');
    });

    test('should return error for missing character ID', async () => {
      const result = await handler.handleSetCharacter([]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing character ID');
    });

    test('should complete in <100ms', async () => {
      mockCharacterManager.loadCharacter.mockResolvedValue({
        success: true,
        data: {
          name: 'Kapi',
          level: 5,
          class: 'Fighter'
        },
        error: null
      });

      const start = Date.now();
      await handler.handleSetCharacter(['kapi']);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('/mechanics-help command', () => {
    test('should return help text', async () => {
      const result = await handler.handleHelp([]);

      expect(result.success).toBe(true);
      expect(result.data.helpText).toContain('D&D 5e Mechanics Commands');
      expect(result.data.helpText).toContain('/roll');
      expect(result.data.helpText).toContain('/check');
      expect(result.data.helpText).toContain('/attack');
      expect(result.data.helpText).toContain('/cast');
      expect(result.data.helpText).toContain('/rest');
      expect(result.data.helpText).toContain('/level-up');
      expect(result.data.helpText).toContain('/set-character');
      expect(result.data.helpText).toContain('Active Character:');
    });

    test('should show no active character when none set', async () => {
      handler.activeCharacter = null;

      const result = await handler.handleHelp([]);

      expect(result.success).toBe(true);
      expect(result.data.helpText).toContain('Active Character: None');
    });

    test('should complete in <50ms', async () => {
      const start = Date.now();
      await handler.handleHelp([]);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('Command logging', () => {
    test('should log successful command', async () => {
      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { notation: '1d20', rolls: [15], modifier: 0, total: 15 },
        error: null
      });

      await handler.executeCommand('roll', ['1d20']);

      expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('logs'), { recursive: true });
      expect(fs.appendFile).toHaveBeenCalled();

      const logCall = fs.appendFile.mock.calls[0];
      const logPath = logCall[0];
      const logEntry = logCall[1];

      expect(logPath).toContain('mechanics-');
      expect(logPath).toContain('.log');
      expect(logEntry).toContain('[COMMAND]');
      expect(logEntry).toContain('/roll 1d20');
      expect(logEntry).toContain('SUCCESS');
    });

    test('should log failed command', async () => {
      const result = await handler.executeCommand('invalid', []);

      expect(fs.appendFile).toHaveBeenCalled();

      const logEntry = fs.appendFile.mock.calls[0][1];
      expect(logEntry).toContain('[COMMAND]');
      expect(logEntry).toContain('/invalid');
      expect(logEntry).toContain('ERROR');
    });
  });

  describe('Error handling', () => {
    test('should not crash on logging errors', async () => {
      fs.appendFile.mockRejectedValue(new Error('Log write failed'));

      mockDiceRoller.roll.mockResolvedValue({
        success: true,
        data: { notation: '1d20', rolls: [15], modifier: 0, total: 15 },
        error: null
      });

      const result = await handler.executeCommand('roll', ['1d20']);

      // Command should still succeed even if logging fails
      expect(result.success).toBe(true);
    });

    test('should provide usage information in errors', async () => {
      const result = await handler.handleRoll([]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Usage:');
      expect(result.error).toContain('/roll [dice]');
      expect(result.error).toContain('Example:');
    });

    test('should handle missing arguments gracefully', async () => {
      const commands = [
        { command: 'roll', args: [] },
        { command: 'check', args: [] },
        { command: 'skill', args: [] },
        { command: 'attack', args: [] },
        { command: 'cast', args: [] },
        { command: 'rest', args: [] },
        { command: 'set-character', args: [] }
      ];

      for (const { command, args } of commands) {
        const result = await handler.executeCommand(command, args);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Missing');
      }
    });
  });
});
