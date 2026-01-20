/**
 * Unit tests for CharacterManager module
 * Target: ≥95% statement coverage
 *
 * Tests cover:
 * - Constructor and dependency injection
 * - Character loading from YAML files
 * - Character saving with atomic writes
 * - Schema validation (all D&D 5e rules)
 * - Derived stat calculation
 * - Helper methods (ability modifier, proficiency bonus)
 * - Performance benchmarks
 * - Edge cases and error handling
 */

const CharacterManager = require('../../src/mechanics/character-manager');
const fs = require('fs').promises;
const path = require('path');

describe('CharacterManager', () => {
  // ========================================================================
  // Constructor and Initialization
  // ========================================================================

  describe('Constructor', () => {
    test('should initialize with default dependencies', () => {
      const manager = new CharacterManager();

      expect(manager.yamlParser).toBeDefined();
      expect(manager.fileReader).toBeDefined();
    });

    test('should accept custom dependencies via dependency injection', () => {
      const mockYamlParser = { load: jest.fn(), dump: jest.fn() };
      const mockFileReader = { readFile: jest.fn(), writeFile: jest.fn() };

      const manager = new CharacterManager({
        yamlParser: mockYamlParser,
        fileReader: mockFileReader
      });

      expect(manager.yamlParser).toBe(mockYamlParser);
      expect(manager.fileReader).toBe(mockFileReader);
    });
  });

  // ========================================================================
  // Static Helper Methods
  // ========================================================================

  describe('getAbilityModifier()', () => {
    test.each([
      [1, -5],
      [3, -4],
      [8, -1],
      [9, -1],
      [10, 0],
      [11, 0],
      [12, 1],
      [16, 3],
      [18, 4],
      [20, 5]
    ])('should calculate modifier for ability score %i as %i', (score, expectedModifier) => {
      expect(CharacterManager.getAbilityModifier(score)).toBe(expectedModifier);
    });
  });

  describe('getProficiencyBonus()', () => {
    test.each([
      [1, 2],
      [4, 2],
      [5, 3],
      [8, 3],
      [9, 4],
      [12, 4],
      [13, 5],
      [16, 5],
      [17, 6],
      [20, 6]
    ])('should calculate proficiency bonus for level %i as %i', (level, expectedBonus) => {
      expect(CharacterManager.getProficiencyBonus(level)).toBe(expectedBonus);
    });
  });

  // ========================================================================
  // Character Loading
  // ========================================================================

  describe('loadCharacter()', () => {
    test('should load valid character file successfully', async () => {
      const manager = new CharacterManager();
      const result = await manager.loadCharacter('kapi');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe('Kapi the Brave');
      expect(result.data.level).toBe(3);
      expect(result.error).toBeNull();
    });

    test('should return error for non-existent character file', async () => {
      const manager = new CharacterManager();
      const result = await manager.loadCharacter('nonexistent-character');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('Character file not found');
    });

    test('should return error for invalid character ID (empty string)', async () => {
      const manager = new CharacterManager();
      const result = await manager.loadCharacter('');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('Character ID must be a non-empty string');
    });

    test('should return error for invalid character ID (null)', async () => {
      const manager = new CharacterManager();
      const result = await manager.loadCharacter(null);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('Character ID must be a non-empty string');
    });

    test('should return error for invalid YAML content', async () => {
      const mockFileReader = {
        readFile: jest.fn().mockResolvedValue('invalid: yaml: content:\n  - unclosed: ['),
        writeFile: jest.fn(),
        mkdir: jest.fn(),
        rename: jest.fn(),
        unlink: jest.fn()
      };

      const manager = new CharacterManager({ fileReader: mockFileReader });
      const result = await manager.loadCharacter('test');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('Invalid YAML');
    });

    test('should complete loading in < 100ms', async () => {
      const manager = new CharacterManager();
      const start = performance.now();
      await manager.loadCharacter('kapi');
      const end = performance.now();

      expect(end - start).toBeLessThan(100);
    });
  });

  // ========================================================================
  // Character Validation
  // ========================================================================

  describe('_validateCharacter()', () => {
    let manager;
    let validCharacter;

    beforeEach(() => {
      manager = new CharacterManager();
      validCharacter = {
        name: 'Test Character',
        race: 'Human',
        class: 'Fighter',
        level: 3,
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
          current: 24,
          temporary: 0,
          hitDice: {
            total: 3,
            spent: 1
          }
        },
        armorClass: 18,
        proficiencies: {
          armor: ['light'],
          weapons: ['simple'],
          savingThrows: ['strength'],
          skills: ['athletics']
        }
      };
    });

    test('should validate correct character successfully', () => {
      const result = manager._validateCharacter(validCharacter);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    // Required field validations
    test('should reject character missing name', () => {
      delete validCharacter.name;
      const result = manager._validateCharacter(validCharacter);
      expect(result.success).toBe(false);
      expect(result.error).toContain('name');
    });

    test('should reject character missing abilities', () => {
      delete validCharacter.abilities;
      const result = manager._validateCharacter(validCharacter);
      expect(result.success).toBe(false);
      expect(result.error).toContain('abilities');
    });

    // Ability score validations
    test('should reject ability score below 1', () => {
      validCharacter.abilities.strength = 0;
      const result = manager._validateCharacter(validCharacter);
      expect(result.success).toBe(false);
      expect(result.error).toContain('strength');
      expect(result.error).toContain('1 and 20');
    });

    test('should reject ability score above 20', () => {
      validCharacter.abilities.dexterity = 21;
      const result = manager._validateCharacter(validCharacter);
      expect(result.success).toBe(false);
      expect(result.error).toContain('dexterity');
      expect(result.error).toContain('1 and 20');
    });

    test('should reject missing ability', () => {
      delete validCharacter.abilities.wisdom;
      const result = manager._validateCharacter(validCharacter);
      expect(result.success).toBe(false);
      expect(result.error).toContain('wisdom');
    });

    // Level validations
    test('should reject level below 1', () => {
      validCharacter.level = 0;
      const result = manager._validateCharacter(validCharacter);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Level must be between 1 and 20');
    });

    test('should reject level above 20', () => {
      validCharacter.level = 21;
      const result = manager._validateCharacter(validCharacter);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Level must be between 1 and 20');
    });

    // Hit point validations
    test('should reject current HP exceeding max HP', () => {
      validCharacter.hitPoints.current = 50;
      validCharacter.hitPoints.max = 31;
      const result = manager._validateCharacter(validCharacter);
      expect(result.success).toBe(false);
      expect(result.error).toContain('current');
      expect(result.error).toContain('cannot exceed max');
    });

    test('should reject negative temporary HP', () => {
      validCharacter.hitPoints.temporary = -5;
      const result = manager._validateCharacter(validCharacter);
      expect(result.success).toBe(false);
      expect(result.error).toContain('temporary');
      expect(result.error).toContain('non-negative');
    });

    test('should reject spent hit dice exceeding total', () => {
      validCharacter.hitPoints.hitDice.spent = 5;
      validCharacter.hitPoints.hitDice.total = 3;
      const result = manager._validateCharacter(validCharacter);
      expect(result.success).toBe(false);
      expect(result.error).toContain('hitDice.spent');
      expect(result.error).toContain('cannot exceed total');
    });

    // Proficiency bonus validation
    test('should reject incorrect proficiency bonus for level', () => {
      validCharacter.level = 3;
      validCharacter.proficiencyBonus = 5; // Should be 2
      const result = manager._validateCharacter(validCharacter);
      expect(result.success).toBe(false);
      expect(result.error).toContain('proficiencyBonus');
      expect(result.error).toContain('does not match level');
    });

    // Spell slot validation
    test('should reject negative spell slots for spellcaster', () => {
      validCharacter.spellcasting = {
        ability: 'intelligence',
        spellSlots: {
          1: -2,
          2: 1
        }
      };
      const result = manager._validateCharacter(validCharacter);
      expect(result.success).toBe(false);
      expect(result.error).toContain('spellSlots');
      expect(result.error).toContain('non-negative');
    });

    // Attunement validation
    test('should reject attunement exceeding max (3)', () => {
      validCharacter.attunement = {
        items: ['item1', 'item2', 'item3', 'item4'],
        max: 3
      };
      const result = manager._validateCharacter(validCharacter);
      expect(result.success).toBe(false);
      expect(result.error).toContain('attunement');
      expect(result.error).toContain('cannot exceed max');
    });

    // Death save validation
    test('should reject death save successes > 3', () => {
      validCharacter.deathSaves = {
        successes: 4,
        failures: 0
      };
      const result = manager._validateCharacter(validCharacter);
      expect(result.success).toBe(false);
      expect(result.error).toContain('deathSaves.successes');
      expect(result.error).toContain('between 0 and 3');
    });

    test('should reject death save failures > 3', () => {
      validCharacter.deathSaves = {
        successes: 0,
        failures: 5
      };
      const result = manager._validateCharacter(validCharacter);
      expect(result.success).toBe(false);
      expect(result.error).toContain('deathSaves.failures');
      expect(result.error).toContain('between 0 and 3');
    });

    // Exhaustion validation
    test('should reject exhaustion level > 6', () => {
      validCharacter.exhaustionLevel = 7;
      const result = manager._validateCharacter(validCharacter);
      expect(result.success).toBe(false);
      expect(result.error).toContain('exhaustionLevel');
      expect(result.error).toContain('between 0 and 6');
    });

    test('should reject negative exhaustion level', () => {
      validCharacter.exhaustionLevel = -1;
      const result = manager._validateCharacter(validCharacter);
      expect(result.success).toBe(false);
      expect(result.error).toContain('exhaustionLevel');
      expect(result.error).toContain('between 0 and 6');
    });
  });

  // ========================================================================
  // Derived Stat Calculation
  // ========================================================================

  describe('calculateDerivedStats()', () => {
    test('should calculate ability modifiers correctly', () => {
      const manager = new CharacterManager();
      const character = {
        level: 3,
        abilities: {
          strength: 16,
          dexterity: 14,
          constitution: 15,
          intelligence: 10,
          wisdom: 12,
          charisma: 8
        }
      };

      const stats = manager.calculateDerivedStats(character);

      expect(stats.abilityModifiers.strength).toBe(3);
      expect(stats.abilityModifiers.dexterity).toBe(2);
      expect(stats.abilityModifiers.constitution).toBe(2);
      expect(stats.abilityModifiers.intelligence).toBe(0);
      expect(stats.abilityModifiers.wisdom).toBe(1);
      expect(stats.abilityModifiers.charisma).toBe(-1);
    });

    test('should calculate proficiency bonus from level', () => {
      const manager = new CharacterManager();
      const character = { level: 3, abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 } };

      const stats = manager.calculateDerivedStats(character);

      expect(stats.proficiencyBonus).toBe(2);
    });

    test('should calculate spell save DC for spellcaster', () => {
      const manager = new CharacterManager();
      const character = {
        level: 3,
        abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 16, wisdom: 10, charisma: 10 },
        spellcasting: { ability: 'intelligence' }
      };

      const stats = manager.calculateDerivedStats(character);

      expect(stats.spellSaveDC).toBe(13); // 8 + 2 (prof) + 3 (int mod)
      expect(stats.spellAttackBonus).toBe(5); // 2 (prof) + 3 (int mod)
    });

    test('should set spell stats to null for non-spellcaster', () => {
      const manager = new CharacterManager();
      const character = {
        level: 3,
        abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 }
      };

      const stats = manager.calculateDerivedStats(character);

      expect(stats.spellSaveDC).toBeNull();
      expect(stats.spellAttackBonus).toBeNull();
    });

    test('should calculate carrying capacity', () => {
      const manager = new CharacterManager();
      const character = {
        level: 3,
        abilities: { strength: 16, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 }
      };

      const stats = manager.calculateDerivedStats(character);

      expect(stats.carryingCapacity).toBe(240); // 16 * 15
    });
  });

  // ========================================================================
  // Character Saving
  // ========================================================================

  describe('saveCharacter()', () => {
    test('should save valid character successfully', async () => {
      const manager = new CharacterManager();
      const character = {
        name: 'Test Save',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        hitPoints: { max: 10, current: 10, temporary: 0 },
        armorClass: 10,
        proficiencies: { armor: [], weapons: [], savingThrows: [], skills: [] }
      };

      const result = await manager.saveCharacter('test-save', character);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();

      // Verify file was created
      const filePath = path.join('characters', 'test-save.yaml');
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      // Clean up
      await fs.unlink(filePath);
    }, 10000);

    test('should reject invalid character before saving', async () => {
      const manager = new CharacterManager();
      const invalidCharacter = {
        name: 'Invalid',
        level: 25 // Invalid level
      };

      const result = await manager.saveCharacter('test-invalid', invalidCharacter);

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('Validation error');
    });

    test('should perform atomic write (temp file then rename)', async () => {
      const mockFileReader = {
        readFile: jest.fn(),
        writeFile: jest.fn().mockResolvedValue(undefined),
        mkdir: jest.fn().mockResolvedValue(undefined),
        rename: jest.fn().mockResolvedValue(undefined),
        unlink: jest.fn()
      };

      const manager = new CharacterManager({ fileReader: mockFileReader });
      const character = {
        name: 'Atomic Test',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        hitPoints: { max: 10, current: 10, temporary: 0 },
        armorClass: 10,
        proficiencies: { armor: [], weapons: [], savingThrows: [], skills: [] }
      };

      await manager.saveCharacter('atomic-test', character);

      // Verify temp file was written
      expect(mockFileReader.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        expect.any(String),
        'utf8'
      );

      // Verify rename was called (atomic operation)
      expect(mockFileReader.rename).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        expect.stringContaining('atomic-test.yaml')
      );
    });

    test('should complete saving in < 200ms', async () => {
      const manager = new CharacterManager();
      const character = {
        name: 'Performance Test',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        hitPoints: { max: 10, current: 10, temporary: 0 },
        armorClass: 10,
        proficiencies: { armor: [], weapons: [], savingThrows: [], skills: [] }
      };

      const start = performance.now();
      const result = await manager.saveCharacter('performance-test', character);
      const end = performance.now();

      expect(end - start).toBeLessThan(200);
      expect(result.success).toBe(true);

      // Clean up
      await fs.unlink(path.join('characters', 'performance-test.yaml'));
    }, 10000);

    test('should round-trip save and load correctly', async () => {
      const manager = new CharacterManager();
      const originalCharacter = {
        name: 'Round Trip Test',
        race: 'Elf',
        class: 'Wizard',
        level: 5,
        abilities: { strength: 8, dexterity: 14, constitution: 12, intelligence: 18, wisdom: 13, charisma: 10 },
        hitPoints: { max: 22, current: 18, temporary: 5, hitDice: { total: 5, spent: 2 } },
        armorClass: 12,
        proficiencies: { armor: ['light'], weapons: ['simple'], savingThrows: ['intelligence', 'wisdom'], skills: ['arcana'] },
        proficiencyBonus: 3
      };

      // Save
      const saveResult = await manager.saveCharacter('roundtrip', originalCharacter);
      expect(saveResult.success).toBe(true);

      // Load
      const loadResult = await manager.loadCharacter('roundtrip');
      expect(loadResult.success).toBe(true);

      // Verify data integrity
      expect(loadResult.data.name).toBe(originalCharacter.name);
      expect(loadResult.data.level).toBe(originalCharacter.level);
      expect(loadResult.data.abilities.intelligence).toBe(originalCharacter.abilities.intelligence);
      expect(loadResult.data.hitPoints.current).toBe(originalCharacter.hitPoints.current);

      // Clean up
      await fs.unlink(path.join('characters', 'roundtrip.yaml'));
    }, 10000);
  });

  // ========================================================================
  // Error Handling Edge Cases
  // ========================================================================

  describe('Error Handling Edge Cases', () => {
    test('should handle file read permission errors', async () => {
      const mockFileReader = {
        readFile: jest.fn().mockRejectedValue(new Error('Permission denied')),
        writeFile: jest.fn(),
        mkdir: jest.fn(),
        rename: jest.fn(),
        unlink: jest.fn()
      };

      const manager = new CharacterManager({ fileReader: mockFileReader });
      const result = await manager.loadCharacter('test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to read character file');
    });

    test('should handle mkdir errors during save', async () => {
      const mockFileReader = {
        readFile: jest.fn(),
        writeFile: jest.fn(),
        mkdir: jest.fn().mockRejectedValue(Object.assign(new Error('Permission denied'), { code: 'EACCES' })),
        rename: jest.fn(),
        unlink: jest.fn()
      };

      const manager = new CharacterManager({ fileReader: mockFileReader });
      const character = {
        name: 'Test',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        hitPoints: { max: 10, current: 10, temporary: 0 },
        armorClass: 10,
        proficiencies: { armor: [], weapons: [], savingThrows: [], skills: [] }
      };

      const result = await manager.saveCharacter('test', character);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create characters directory');
    });

    test('should handle writeFile errors during save', async () => {
      const mockFileReader = {
        readFile: jest.fn(),
        writeFile: jest.fn().mockRejectedValue(new Error('Disk full')),
        mkdir: jest.fn().mockResolvedValue(undefined),
        rename: jest.fn(),
        unlink: jest.fn()
      };

      const manager = new CharacterManager({ fileReader: mockFileReader });
      const character = {
        name: 'Test',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        hitPoints: { max: 10, current: 10, temporary: 0 },
        armorClass: 10,
        proficiencies: { armor: [], weapons: [], savingThrows: [], skills: [] }
      };

      const result = await manager.saveCharacter('test', character);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to write temp file');
    });

    test('should handle rename errors and clean up temp file', async () => {
      const mockFileReader = {
        readFile: jest.fn(),
        writeFile: jest.fn().mockResolvedValue(undefined),
        mkdir: jest.fn().mockResolvedValue(undefined),
        rename: jest.fn().mockRejectedValue(new Error('Rename failed')),
        unlink: jest.fn().mockResolvedValue(undefined)
      };

      const manager = new CharacterManager({ fileReader: mockFileReader });
      const character = {
        name: 'Test',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        hitPoints: { max: 10, current: 10, temporary: 0 },
        armorClass: 10,
        proficiencies: { armor: [], weapons: [], savingThrows: [], skills: [] }
      };

      const result = await manager.saveCharacter('test', character);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to save character');
      expect(mockFileReader.unlink).toHaveBeenCalled(); // Verify temp file cleanup
    });

    test('should handle YAML dump errors during save', async () => {
      const mockYamlParser = {
        load: jest.fn(),
        dump: jest.fn().mockImplementation(() => {
          throw new Error('Circular reference');
        })
      };

      const manager = new CharacterManager({ yamlParser: mockYamlParser });
      const character = {
        name: 'Test',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        hitPoints: { max: 10, current: 10, temporary: 0 },
        armorClass: 10,
        proficiencies: { armor: [], weapons: [], savingThrows: [], skills: [] }
      };

      const result = await manager.saveCharacter('test', character);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to serialize character');
    });

    test('should handle non-object character data in validation', () => {
      const manager = new CharacterManager();

      expect(manager._validateCharacter(null).success).toBe(false);
      expect(manager._validateCharacter(null).error).toContain('must be an object');

      expect(manager._validateCharacter('string').success).toBe(false);
      expect(manager._validateCharacter(123).success).toBe(false);
    });

    test('should handle non-object abilities in validation', () => {
      const manager = new CharacterManager();
      const character = {
        name: 'Test',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        abilities: 'not an object',
        hitPoints: { max: 10, current: 10, temporary: 0 },
        armorClass: 10,
        proficiencies: { armor: [], weapons: [], savingThrows: [], skills: [] }
      };

      const result = manager._validateCharacter(character);

      expect(result.success).toBe(false);
      expect(result.error).toContain('abilities must be an object');
    });

    test('should handle non-object hitPoints in validation', () => {
      const manager = new CharacterManager();
      const character = {
        name: 'Test',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        hitPoints: 'not an object',
        armorClass: 10,
        proficiencies: { armor: [], weapons: [], savingThrows: [], skills: [] }
      };

      const result = manager._validateCharacter(character);

      expect(result.success).toBe(false);
      expect(result.error).toContain('hitPoints must be an object');
    });

    test('should handle non-array attunement items in validation', () => {
      const manager = new CharacterManager();
      const character = {
        name: 'Test',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        hitPoints: { max: 10, current: 10, temporary: 0 },
        armorClass: 10,
        proficiencies: { armor: [], weapons: [], savingThrows: [], skills: [] },
        attunement: { items: 'not an array', max: 3 }
      };

      const result = manager._validateCharacter(character);

      expect(result.success).toBe(false);
      expect(result.error).toContain('attunement.items must be an array');
    });

    test('should handle invalid max HP in validation', () => {
      const manager = new CharacterManager();
      const character = {
        name: 'Test',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        hitPoints: { max: -5, current: 10, temporary: 0 },
        armorClass: 10,
        proficiencies: { armor: [], weapons: [], savingThrows: [], skills: [] }
      };

      const result = manager._validateCharacter(character);

      expect(result.success).toBe(false);
      expect(result.error).toContain('hitPoints.max must be a positive number');
    });

    test('should handle non-number current HP in validation', () => {
      const manager = new CharacterManager();
      const character = {
        name: 'Test',
        race: 'Human',
        class: 'Fighter',
        level: 1,
        abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        hitPoints: { max: 10, current: 'ten', temporary: 0 },
        armorClass: 10,
        proficiencies: { armor: [], weapons: [], savingThrows: [], skills: [] }
      };

      const result = manager._validateCharacter(character);

      expect(result.success).toBe(false);
      expect(result.error).toContain('hitPoints.current must be a number');
    });
  });

  // ========================================================================
  // Integration Tests
  // ========================================================================

  describe('Integration Tests', () => {
    test('should load Kapi example character and calculate derived stats', async () => {
      const manager = new CharacterManager();

      // Load character
      const loadResult = await manager.loadCharacter('kapi');
      expect(loadResult.success).toBe(true);

      const character = loadResult.data;

      // Calculate derived stats
      const stats = manager.calculateDerivedStats(character);

      // Verify derived stats
      expect(stats.abilityModifiers.strength).toBe(3);
      expect(stats.proficiencyBonus).toBe(2);
      expect(stats.carryingCapacity).toBe(240);
      expect(stats.spellSaveDC).toBeNull(); // Fighter is not a spellcaster
      expect(stats.spellAttackBonus).toBeNull();
    });

    test('should validate complete character schema', async () => {
      const manager = new CharacterManager();
      const loadResult = await manager.loadCharacter('kapi');

      expect(loadResult.success).toBe(true);

      const character = loadResult.data;

      // Verify all required fields exist
      expect(character.name).toBeDefined();
      expect(character.race).toBeDefined();
      expect(character.class).toBeDefined();
      expect(character.level).toBeDefined();
      expect(character.abilities).toBeDefined();
      expect(character.hitPoints).toBeDefined();
      expect(character.armorClass).toBeDefined();
      expect(character.proficiencies).toBeDefined();
    });
  });
});
