/**
 * SpellDatabase Test Suite
 *
 * Tests for D&D 5e spell database query system.
 * Covers constructor, loadSpells, getSpell, getSpellsByLevel,
 * getSpellsBySchool, getSpellsByClass, getAllSpells methods.
 *
 * Target Coverage: ≥95% statement coverage
 */

const SpellDatabase = require('../../src/mechanics/spell-database');
const path = require('path');

describe('SpellDatabase', () => {
  let db;
  let mockFileReader;
  let mockYamlParser;

  beforeEach(() => {
    // Create mock file reader
    mockFileReader = {
      readFile: jest.fn()
    };

    // Create mock YAML parser
    mockYamlParser = {
      load: jest.fn()
    };

    // Create database with mocks
    db = new SpellDatabase({
      fileReader: mockFileReader,
      yamlParser: mockYamlParser
    });
  });

  // ===== Constructor Tests =====

  describe('Constructor', () => {
    test('should create instance with default dependencies', () => {
      const defaultDb = new SpellDatabase();
      expect(defaultDb.fileReader).toBeDefined();
      expect(defaultDb.yamlParser).toBeDefined();
      expect(defaultDb.spells).toBeInstanceOf(Map);
      expect(defaultDb.isLoaded).toBe(false);
    });

    test('should accept custom dependencies via DI', () => {
      expect(db.fileReader).toBe(mockFileReader);
      expect(db.yamlParser).toBe(mockYamlParser);
      expect(db.spells).toBeInstanceOf(Map);
    });
  });

  // ===== loadSpells() Tests =====

  describe('loadSpells()', () => {
    const validSpellData = {
      spells: [
        {
          id: 'cure_wounds',
          name: 'Cure Wounds',
          level: 1,
          school: 'Evocation',
          castingTime: '1 action',
          range: 'Touch',
          components: ['V', 'S'],
          duration: 'Instantaneous',
          concentration: false,
          description: 'Healing spell',
          effect: { type: 'healing', healing: '1d8' }
        },
        {
          id: 'fireball',
          name: 'Fireball',
          level: 3,
          school: 'Evocation',
          castingTime: '1 action',
          range: '150 feet',
          components: ['V', 'S', 'M'],
          materials: 'bat guano and sulfur',
          duration: 'Instantaneous',
          concentration: false,
          description: 'Explosive spell',
          effect: { type: 'damage', damage: '8d6', damageType: 'fire' }
        }
      ]
    };

    test('should load valid YAML file successfully', async () => {
      mockFileReader.readFile.mockResolvedValue('yaml content');
      mockYamlParser.load.mockReturnValue(validSpellData);

      const result = await db.loadSpells('data/srd/spells.yaml');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
      expect(db.isLoaded).toBe(true);
      expect(db.spells.size).toBe(2);
      expect(db.spells.has('cure_wounds')).toBe(true);
      expect(db.spells.has('fireball')).toBe(true);
    });

    test('should return error if file path is empty', async () => {
      const result = await db.loadSpells('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('File path must be a non-empty string');
      expect(db.isLoaded).toBe(false);
    });

    test('should return error if file not found', async () => {
      mockFileReader.readFile.mockRejectedValue(new Error('ENOENT: no such file'));

      const result = await db.loadSpells('missing.yaml');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to read file');
      expect(db.isLoaded).toBe(false);
    });

    test('should return error if YAML syntax is invalid', async () => {
      mockFileReader.readFile.mockResolvedValue('invalid: yaml: content:');
      mockYamlParser.load.mockImplementation(() => {
        throw new Error('YAMLException: bad indentation');
      });

      const result = await db.loadSpells('data/srd/spells.yaml');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse YAML');
      expect(db.isLoaded).toBe(false);
    });

    test('should return error if spell data structure is invalid', async () => {
      mockFileReader.readFile.mockResolvedValue('yaml content');
      mockYamlParser.load.mockReturnValue({ invalid: 'structure' });

      const result = await db.loadSpells('data/srd/spells.yaml');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid spell data: expected {spells: []} structure');
      expect(db.isLoaded).toBe(false);
    });

    test('should return error if spell missing required field (id)', async () => {
      const invalidData = {
        spells: [
          {
            name: 'Fireball',
            level: 3,
            school: 'Evocation',
            castingTime: '1 action',
            range: '150 feet',
            components: ['V'],
            duration: 'Instantaneous',
            description: 'Test',
            effect: { type: 'damage' }
          }
        ]
      };

      mockFileReader.readFile.mockResolvedValue('yaml');
      mockYamlParser.load.mockReturnValue(invalidData);

      const result = await db.loadSpells('data/srd/spells.yaml');

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing required field: id');
    });

    test('should return error if spell has invalid level', async () => {
      const invalidData = {
        spells: [
          {
            id: 'test',
            name: 'Test',
            level: 10, // Invalid: must be 0-9
            school: 'Evocation',
            castingTime: '1 action',
            range: '150 feet',
            components: ['V'],
            duration: 'Instantaneous',
            description: 'Test',
            effect: { type: 'damage' }
          }
        ]
      };

      mockFileReader.readFile.mockResolvedValue('yaml');
      mockYamlParser.load.mockReturnValue(invalidData);

      const result = await db.loadSpells('data/srd/spells.yaml');

      expect(result.success).toBe(false);
      expect(result.error).toContain('has invalid level');
    });

    test('should return error if spell has invalid school', async () => {
      const invalidData = {
        spells: [
          {
            id: 'test',
            name: 'Test',
            level: 1,
            school: 'InvalidSchool',
            castingTime: '1 action',
            range: '150 feet',
            components: ['V'],
            duration: 'Instantaneous',
            description: 'Test',
            effect: { type: 'damage' }
          }
        ]
      };

      mockFileReader.readFile.mockResolvedValue('yaml');
      mockYamlParser.load.mockReturnValue(invalidData);

      const result = await db.loadSpells('data/srd/spells.yaml');

      expect(result.success).toBe(false);
      expect(result.error).toContain('has invalid school');
    });

    test('should return error if spell has M component without materials', async () => {
      const invalidData = {
        spells: [
          {
            id: 'test',
            name: 'Test',
            level: 1,
            school: 'Evocation',
            castingTime: '1 action',
            range: '150 feet',
            components: ['V', 'S', 'M'], // Has M but no materials field
            duration: 'Instantaneous',
            description: 'Test',
            effect: { type: 'damage' }
          }
        ]
      };

      mockFileReader.readFile.mockResolvedValue('yaml');
      mockYamlParser.load.mockReturnValue(invalidData);

      const result = await db.loadSpells('data/srd/spells.yaml');

      expect(result.success).toBe(false);
      expect(result.error).toContain('has M component but missing materials field');
    });

    test('should clear existing spells when loading new data', async () => {
      // Load first set of spells
      mockFileReader.readFile.mockResolvedValue('yaml');
      mockYamlParser.load.mockReturnValue(validSpellData);
      await db.loadSpells('data/srd/spells.yaml');
      expect(db.spells.size).toBe(2);

      // Load different set
      const newData = {
        spells: [validSpellData.spells[0]] // Only one spell
      };
      mockYamlParser.load.mockReturnValue(newData);
      await db.loadSpells('data/srd/spells.yaml');
      expect(db.spells.size).toBe(1);
      expect(db.spells.has('cure_wounds')).toBe(true);
      expect(db.spells.has('fireball')).toBe(false);
    });
  });

  // ===== getSpell() Tests =====

  describe('getSpell()', () => {
    const testSpells = {
      spells: [
        {
          id: 'cure_wounds',
          name: 'Cure Wounds',
          level: 1,
          school: 'Evocation',
          castingTime: '1 action',
          range: 'Touch',
          components: ['V', 'S'],
          duration: 'Instantaneous',
          description: 'Healing',
          effect: { type: 'healing' }
        }
      ]
    };

    beforeEach(async () => {
      mockFileReader.readFile.mockResolvedValue('yaml');
      mockYamlParser.load.mockReturnValue(testSpells);
      await db.loadSpells('data/srd/spells.yaml');
    });

    test('should return spell object for valid ID', async () => {
      const result = await db.getSpell('cure_wounds');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe('cure_wounds');
      expect(result.data.name).toBe('Cure Wounds');
      expect(result.data.level).toBe(1);
      expect(result.error).toBeNull();
    });

    test('should return error for invalid spell ID', async () => {
      const result = await db.getSpell('nonexistent_spell');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Spell not found: nonexistent_spell');
    });

    test('should return error for empty spell ID', async () => {
      const result = await db.getSpell('');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Spell ID must be a non-empty string');
    });

    test('should return error if database not loaded', async () => {
      const freshDb = new SpellDatabase();

      const result = await freshDb.getSpell('cure_wounds');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not loaded');
    });
  });

  // ===== getSpellsByLevel() Tests =====

  describe('getSpellsByLevel()', () => {
    const levelTestSpells = {
      spells: [
        {
          id: 'fire_bolt',
          name: 'Fire Bolt',
          level: 0,
          school: 'Evocation',
          castingTime: '1 action',
          range: '120 feet',
          components: ['V', 'S'],
          duration: 'Instantaneous',
          description: 'Cantrip',
          effect: { type: 'damage' }
        },
        {
          id: 'cure_wounds',
          name: 'Cure Wounds',
          level: 1,
          school: 'Evocation',
          castingTime: '1 action',
          range: 'Touch',
          components: ['V', 'S'],
          duration: 'Instantaneous',
          description: 'Level 1',
          effect: { type: 'healing' }
        },
        {
          id: 'magic_missile',
          name: 'Magic Missile',
          level: 1,
          school: 'Evocation',
          castingTime: '1 action',
          range: '120 feet',
          components: ['V', 'S'],
          duration: 'Instantaneous',
          description: 'Level 1',
          effect: { type: 'damage' }
        }
      ]
    };

    beforeEach(async () => {
      mockFileReader.readFile.mockResolvedValue('yaml');
      mockYamlParser.load.mockReturnValue(levelTestSpells);
      await db.loadSpells('data/srd/spells.yaml');
    });

    test('should return cantrips for level 0', async () => {
      const result = await db.getSpellsByLevel(0);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Fire Bolt');
      expect(result.error).toBeNull();
    });

    test('should return level 1 spells', async () => {
      const result = await db.getSpellsByLevel(1);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data.map(s => s.name)).toContain('Cure Wounds');
      expect(result.data.map(s => s.name)).toContain('Magic Missile');
    });

    test('should return empty array if no spells at level', async () => {
      const result = await db.getSpellsByLevel(5);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.error).toBeNull();
    });

    test('should return error for invalid level (negative)', async () => {
      const result = await db.getSpellsByLevel(-1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('must be 0-9');
    });

    test('should return error for invalid level (too high)', async () => {
      const result = await db.getSpellsByLevel(10);

      expect(result.success).toBe(false);
      expect(result.error).toContain('must be 0-9');
    });

    test('should return error if level is not a number', async () => {
      const result = await db.getSpellsByLevel('1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Level must be a number');
    });

    test('should return error if database not loaded', async () => {
      const freshDb = new SpellDatabase();

      const result = await freshDb.getSpellsByLevel(1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not loaded');
    });
  });

  // ===== getSpellsBySchool() Tests =====

  describe('getSpellsBySchool()', () => {
    const schoolTestSpells = {
      spells: [
        {
          id: 'fire_bolt',
          name: 'Fire Bolt',
          level: 0,
          school: 'Evocation',
          castingTime: '1 action',
          range: '120 feet',
          components: ['V', 'S'],
          duration: 'Instantaneous',
          description: 'Test',
          effect: { type: 'damage' }
        },
        {
          id: 'shield',
          name: 'Shield',
          level: 1,
          school: 'Abjuration',
          castingTime: '1 reaction',
          range: 'Self',
          components: ['V', 'S'],
          duration: '1 round',
          description: 'Test',
          effect: { type: 'buff' }
        },
        {
          id: 'fireball',
          name: 'Fireball',
          level: 3,
          school: 'Evocation',
          castingTime: '1 action',
          range: '150 feet',
          components: ['V', 'S', 'M'],
          materials: 'sulfur',
          duration: 'Instantaneous',
          description: 'Test',
          effect: { type: 'damage' }
        }
      ]
    };

    beforeEach(async () => {
      mockFileReader.readFile.mockResolvedValue('yaml');
      mockYamlParser.load.mockReturnValue(schoolTestSpells);
      await db.loadSpells('data/srd/spells.yaml');
    });

    test('should return spells for Evocation school', async () => {
      const result = await db.getSpellsBySchool('Evocation');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data.map(s => s.name)).toContain('Fire Bolt');
      expect(result.data.map(s => s.name)).toContain('Fireball');
    });

    test('should return spells for Abjuration school', async () => {
      const result = await db.getSpellsBySchool('Abjuration');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Shield');
    });

    test('should return empty array for school with no spells', async () => {
      const result = await db.getSpellsBySchool('Necromancy');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    test('should return empty array for invalid school', async () => {
      const result = await db.getSpellsBySchool('InvalidSchool');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    test('should return error for empty school name', async () => {
      const result = await db.getSpellsBySchool('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('School must be a non-empty string');
    });

    test('should return error if database not loaded', async () => {
      const freshDb = new SpellDatabase();

      const result = await freshDb.getSpellsBySchool('Evocation');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not loaded');
    });
  });

  // ===== getSpellsByClass() Tests =====

  describe('getSpellsByClass()', () => {
    const classTestSpells = {
      spells: [
        {
          id: 'cure_wounds',
          name: 'Cure Wounds',
          level: 1,
          school: 'Evocation',
          castingTime: '1 action',
          range: 'Touch',
          components: ['V', 'S'],
          duration: 'Instantaneous',
          description: 'Test',
          effect: { type: 'healing' },
          classes: ['Cleric', 'Bard']
        },
        {
          id: 'fireball',
          name: 'Fireball',
          level: 3,
          school: 'Evocation',
          castingTime: '1 action',
          range: '150 feet',
          components: ['V', 'S', 'M'],
          materials: 'sulfur',
          duration: 'Instantaneous',
          description: 'Test',
          effect: { type: 'damage' },
          classes: ['Wizard', 'Sorcerer']
        }
      ]
    };

    beforeEach(async () => {
      mockFileReader.readFile.mockResolvedValue('yaml');
      mockYamlParser.load.mockReturnValue(classTestSpells);
      await db.loadSpells('data/srd/spells.yaml');
    });

    test('should return Cleric spells', async () => {
      const result = await db.getSpellsByClass('Cleric');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Cure Wounds');
    });

    test('should return Wizard spells', async () => {
      const result = await db.getSpellsByClass('Wizard');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Fireball');
    });

    test('should return empty array for class with no spells', async () => {
      const result = await db.getSpellsByClass('Paladin');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    test('should return empty array for invalid class', async () => {
      const result = await db.getSpellsByClass('InvalidClass');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    test('should return error for empty class name', async () => {
      const result = await db.getSpellsByClass('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Class name must be a non-empty string');
    });

    test('should return error if database not loaded', async () => {
      const freshDb = new SpellDatabase();

      const result = await freshDb.getSpellsByClass('Cleric');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not loaded');
    });
  });

  // ===== getAllSpells() Tests =====

  describe('getAllSpells()', () => {
    const allSpellsTestData = {
      spells: [
        {
          id: 'spell1',
          name: 'Spell 1',
          level: 0,
          school: 'Evocation',
          castingTime: '1 action',
          range: '60 feet',
          components: ['V'],
          duration: 'Instantaneous',
          description: 'Test',
          effect: { type: 'damage' }
        },
        {
          id: 'spell2',
          name: 'Spell 2',
          level: 1,
          school: 'Abjuration',
          castingTime: '1 action',
          range: 'Self',
          components: ['S'],
          duration: '1 minute',
          description: 'Test',
          effect: { type: 'buff' }
        }
      ]
    };

    beforeEach(async () => {
      mockFileReader.readFile.mockResolvedValue('yaml');
      mockYamlParser.load.mockReturnValue(allSpellsTestData);
      await db.loadSpells('data/srd/spells.yaml');
    });

    test('should return all loaded spells', async () => {
      const result = await db.getAllSpells();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data.map(s => s.id)).toContain('spell1');
      expect(result.data.map(s => s.id)).toContain('spell2');
      expect(result.error).toBeNull();
    });

    test('should return defensive copy of spells array', async () => {
      const result1 = await db.getAllSpells();
      const result2 = await db.getAllSpells();

      expect(result1.data).not.toBe(result2.data); // Different array instances
      expect(result1.data).toEqual(result2.data); // Same content
    });

    test('should return error if database not loaded', async () => {
      const freshDb = new SpellDatabase();

      const result = await freshDb.getAllSpells();

      expect(result.success).toBe(false);
      expect(result.error).toContain('not loaded');
    });
  });

  // ===== Integration Tests =====

  describe('Integration Tests', () => {
    test('should load real spells.yaml file', async () => {
      const realDb = new SpellDatabase();
      const spellsPath = path.join(__dirname, '../../data/srd/spells.yaml');

      const result = await realDb.loadSpells(spellsPath);

      expect(result.success).toBe(true);
      expect(realDb.isLoaded).toBe(true);
      expect(realDb.spells.size).toBeGreaterThan(0);
    });

    test('should query known spells from real file', async () => {
      const realDb = new SpellDatabase();
      const spellsPath = path.join(__dirname, '../../data/srd/spells.yaml');

      await realDb.loadSpells(spellsPath);

      // Query known spells (these should exist in the real file)
      const fireResult = await realDb.getSpell('fire_bolt');
      expect(fireResult.success).toBe(true);
      expect(fireResult.data.name).toBe('Fire Bolt');

      const cureResult = await realDb.getSpell('cure_wounds');
      expect(cureResult.success).toBe(true);
      expect(cureResult.data.name).toBe('Cure Wounds');
    });

    test('should complete full workflow (load -> query)', async () => {
      const realDb = new SpellDatabase();
      const spellsPath = path.join(__dirname, '../../data/srd/spells.yaml');

      // Load database
      const loadResult = await realDb.loadSpells(spellsPath);
      expect(loadResult.success).toBe(true);

      // Query by ID
      const spell = await realDb.getSpell('fire_bolt');
      expect(spell.success).toBe(true);

      // Query by level
      const cantrips = await realDb.getSpellsByLevel(0);
      expect(cantrips.success).toBe(true);
      expect(cantrips.data.length).toBeGreaterThan(0);

      // Query by school
      const evocations = await realDb.getSpellsBySchool('Evocation');
      expect(evocations.success).toBe(true);
      expect(evocations.data.length).toBeGreaterThan(0);

      // Get all spells
      const all = await realDb.getAllSpells();
      expect(all.success).toBe(true);
      expect(all.data.length).toBeGreaterThan(0);
    });
  });

  // ===== Performance Tests =====

  describe('Performance Tests', () => {
    const performanceTestData = {
      spells: []
    };

    // Generate 100 test spells
    for (let i = 0; i < 100; i++) {
      performanceTestData.spells.push({
        id: `spell_${i}`,
        name: `Spell ${i}`,
        level: i % 10,
        school: ['Evocation', 'Abjuration', 'Conjuration'][i % 3],
        castingTime: '1 action',
        range: '60 feet',
        components: ['V'],
        duration: 'Instantaneous',
        description: 'Test',
        effect: { type: 'damage' }
      });
    }

    beforeEach(async () => {
      mockFileReader.readFile.mockResolvedValue('yaml');
      mockYamlParser.load.mockReturnValue(performanceTestData);
      await db.loadSpells('data/srd/spells.yaml');
    });

    test('getSpell() should complete in < 10ms', async () => {
      const start = Date.now();
      await db.getSpell('spell_50');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10);
    });

    test('getSpellsByLevel() should complete in < 50ms', async () => {
      const start = Date.now();
      await db.getSpellsByLevel(5);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });

    test('getAllSpells() should complete in < 100ms', async () => {
      const start = Date.now();
      await db.getAllSpells();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
