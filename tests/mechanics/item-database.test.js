/**
 * ItemDatabase Tests
 *
 * Test coverage for D&D 5e Item Database query system
 * - Load items from YAML
 * - Query items by ID, type
 * - Input validation
 * - Error handling
 * - Performance (<100ms)
 */

const ItemDatabase = require('../../src/mechanics/item-database');
const path = require('path');

describe('ItemDatabase', () => {
  let db;
  let mockFileReader;
  let mockYamlParser;

  beforeEach(() => {
    mockFileReader = {
      readFile: jest.fn()
    };
    mockYamlParser = {
      load: jest.fn()
    };

    db = new ItemDatabase({
      fileReader: mockFileReader,
      yamlParser: mockYamlParser
    });
  });

  describe('Constructor', () => {
    test('should create instance with default dependencies', () => {
      const realDb = new ItemDatabase();
      expect(realDb).toBeInstanceOf(ItemDatabase);
      expect(realDb.items).toBeInstanceOf(Map);
      expect(realDb.isLoaded).toBe(false);
    });

    test('should accept custom dependencies via DI', () => {
      expect(db.fileReader).toBe(mockFileReader);
      expect(db.yamlParser).toBe(mockYamlParser);
    });
  });

  describe('loadItems()', () => {
    test('should load and cache items from YAML file', async () => {
      const mockYaml = `
items:
  - id: longsword
    name: Longsword
    type: weapon
    weight: 3
`;

      mockFileReader.readFile.mockResolvedValue(mockYaml);
      mockYamlParser.load.mockReturnValue({
        items: [
          { id: 'longsword', name: 'Longsword', type: 'weapon', weight: 3 }
        ]
      });

      const result = await db.loadItems('test.yaml');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(db.isLoaded).toBe(true);
      expect(db.items.size).toBe(1);
      expect(db.items.get('longsword')).toEqual({
        id: 'longsword',
        name: 'Longsword',
        type: 'weapon',
        weight: 3
      });
    });

    test('should validate required fields', async () => {
      mockFileReader.readFile.mockResolvedValue('items: []');
      mockYamlParser.load.mockReturnValue({
        items: [
          { id: 'incomplete', name: 'Incomplete Item' } // Missing type, weight
        ]
      });

      const result = await db.loadItems('test.yaml');

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing required field: type');
    });

    test('should validate item type', async () => {
      mockFileReader.readFile.mockResolvedValue('items: []');
      mockYamlParser.load.mockReturnValue({
        items: [
          { id: 'bad', name: 'Bad Item', type: 'invalid_type', weight: 1 }
        ]
      });

      const result = await db.loadItems('test.yaml');

      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid type');
    });

    test('should validate weight is non-negative', async () => {
      mockFileReader.readFile.mockResolvedValue('items: []');
      mockYamlParser.load.mockReturnValue({
        items: [
          { id: 'bad', name: 'Bad Item', type: 'weapon', weight: -5 }
        ]
      });

      const result = await db.loadItems('test.yaml');

      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid weight');
    });

    test('should return error if file read fails', async () => {
      mockFileReader.readFile.mockRejectedValue(new Error('File not found'));

      const result = await db.loadItems('missing.yaml');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to read file');
    });

    test('should return error if YAML parse fails', async () => {
      mockFileReader.readFile.mockResolvedValue('invalid yaml: [');
      mockYamlParser.load.mockImplementation(() => {
        throw new Error('YAML parse error');
      });

      const result = await db.loadItems('bad.yaml');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse YAML');
    });

    test('should return error if invalid structure', async () => {
      mockFileReader.readFile.mockResolvedValue('foo: bar');
      mockYamlParser.load.mockReturnValue({ foo: 'bar' });

      const result = await db.loadItems('bad.yaml');

      expect(result.success).toBe(false);
      expect(result.error).toContain('expected {items: []} structure');
    });
  });

  describe('getItem()', () => {
    beforeEach(async () => {
      mockFileReader.readFile.mockResolvedValue('items: []');
      mockYamlParser.load.mockReturnValue({
        items: [
          { id: 'longsword', name: 'Longsword', type: 'weapon', weight: 3 },
          { id: 'shield', name: 'Shield', type: 'shield', weight: 6 }
        ]
      });

      await db.loadItems('test.yaml');
    });

    test('should return item by ID', async () => {
      const result = await db.getItem('longsword');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: 'longsword',
        name: 'Longsword',
        type: 'weapon',
        weight: 3
      });
      expect(result.error).toBeNull();
    });

    test('should return error if item not found', async () => {
      const result = await db.getItem('nonexistent');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('Item not found: nonexistent');
    });

    test('should validate item ID is string', async () => {
      const result = await db.getItem(null);

      expect(result.success).toBe(false);
      expect(result.error).toContain('must be a non-empty string');
    });

    test('should return error if database not loaded', async () => {
      const newDb = new ItemDatabase({
        fileReader: mockFileReader,
        yamlParser: mockYamlParser
      });

      const result = await newDb.getItem('longsword');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not loaded');
    });
  });

  describe('getItemsByType()', () => {
    beforeEach(async () => {
      mockFileReader.readFile.mockResolvedValue('items: []');
      mockYamlParser.load.mockReturnValue({
        items: [
          { id: 'longsword', name: 'Longsword', type: 'weapon', weight: 3 },
          { id: 'dagger', name: 'Dagger', type: 'weapon', weight: 1 },
          { id: 'shield', name: 'Shield', type: 'shield', weight: 6 }
        ]
      });

      await db.loadItems('test.yaml');
    });

    test('should return items matching type', async () => {
      const result = await db.getItemsByType('weapon');

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.data[0].id).toBe('longsword');
      expect(result.data[1].id).toBe('dagger');
    });

    test('should return empty array if no matches', async () => {
      const result = await db.getItemsByType('armor');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    test('should validate type is string', async () => {
      const result = await db.getItemsByType(123);

      expect(result.success).toBe(false);
      expect(result.error).toContain('must be a non-empty string');
    });
  });

  describe('getAllItems()', () => {
    beforeEach(async () => {
      mockFileReader.readFile.mockResolvedValue('items: []');
      mockYamlParser.load.mockReturnValue({
        items: [
          { id: 'longsword', name: 'Longsword', type: 'weapon', weight: 3 },
          { id: 'shield', name: 'Shield', type: 'shield', weight: 6 }
        ]
      });

      await db.loadItems('test.yaml');
    });

    test('should return all items', async () => {
      const result = await db.getAllItems();

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
    });

    test('should return error if database not loaded', async () => {
      const newDb = new ItemDatabase({
        fileReader: mockFileReader,
        yamlParser: mockYamlParser
      });

      const result = await newDb.getAllItems();

      expect(result.success).toBe(false);
      expect(result.error).toContain('not loaded');
    });
  });

  describe('Integration Tests with Real Data', () => {
    test('should load real items.yaml file', async () => {
      const realDb = new ItemDatabase();
      const itemsPath = path.join(__dirname, '../../data/srd/items.yaml');

      const result = await realDb.loadItems(itemsPath);

      expect(result.success).toBe(true);
      expect(realDb.isLoaded).toBe(true);
      expect(realDb.items.size).toBeGreaterThan(0);
    });

    test('should query longsword from real data', async () => {
      const realDb = new ItemDatabase();
      const itemsPath = path.join(__dirname, '../../data/srd/items.yaml');

      await realDb.loadItems(itemsPath);
      const result = await realDb.getItem('longsword');

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Longsword');
      expect(result.data.type).toBe('weapon');
      expect(result.data.weight).toBe(3);
    });

    test('should query all weapons from real data', async () => {
      const realDb = new ItemDatabase();
      const itemsPath = path.join(__dirname, '../../data/srd/items.yaml');

      await realDb.loadItems(itemsPath);
      const result = await realDb.getItemsByType('weapon');

      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.every(item => item.type === 'weapon')).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    test('getItem() should complete in < 100ms', async () => {
      const realDb = new ItemDatabase();
      const itemsPath = path.join(__dirname, '../../data/srd/items.yaml');

      await realDb.loadItems(itemsPath);

      const start = Date.now();
      await realDb.getItem('longsword');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
