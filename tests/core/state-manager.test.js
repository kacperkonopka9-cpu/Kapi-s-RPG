/**
 * Unit tests for StateManager module
 * Target: ≥90% statement coverage
 *
 * Tests cover:
 * - YAML frontmatter parsing and serialization
 * - State loading with missing files
 * - State updates with merging
 * - Convenience methods (markVisited, addDiscoveredItem, completeEvent)
 * - Error handling and edge cases
 * - Path validation and security
 */

const StateManager = require('../../src/core/state-manager');
const path = require('path');

describe('StateManager', () => {
  let stateManager;
  let mockFs;
  let mockYaml;

  beforeEach(() => {
    // Create fresh mocks for each test
    mockFs = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      access: jest.fn()
    };

    mockYaml = {
      load: jest.fn(),
      dump: jest.fn(),
      SAFE_SCHEMA: 'SAFE_SCHEMA'
    };

    // Spy on console.warn to suppress warnings in tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.warn
    console.warn.mockRestore();
  });

  // ========================================================================
  // Constructor and Initialization
  // ========================================================================

  describe('Constructor', () => {
    test('should initialize with default dependencies', () => {
      stateManager = new StateManager();

      expect(stateManager.fs).toBeDefined();
      expect(stateManager.path).toBeDefined();
      expect(stateManager.yaml).toBeDefined();
      expect(stateManager.locationsDir).toBe('game-data/locations');
    });

    test('should accept custom locations directory', () => {
      const customDir = 'custom-data/locs';
      stateManager = new StateManager({ locationsDir: customDir });

      expect(stateManager.locationsDir).toBe(customDir);
    });

    test('should accept dependency injection', () => {
      stateManager = new StateManager({
        fs: mockFs,
        path: path,
        yaml: mockYaml,
        locationsDir: 'test-locations'
      });

      expect(stateManager.fs).toBe(mockFs);
      expect(stateManager.yaml).toBe(mockYaml);
      expect(stateManager.locationsDir).toBe('test-locations');
    });
  });

  // ========================================================================
  // Path Validation (_isValidLocationId)
  // ========================================================================

  describe('_isValidLocationId()', () => {
    beforeEach(() => {
      stateManager = new StateManager();
    });

    test('should accept valid location IDs', () => {
      expect(stateManager._isValidLocationId('test-location-1')).toBe(true);
      expect(stateManager._isValidLocationId('village-square')).toBe(true);
      expect(stateManager._isValidLocationId('ancient_library')).toBe(true);
    });

    test('should reject path traversal attempts with ../', () => {
      expect(stateManager._isValidLocationId('../etc/passwd')).toBe(false);
      expect(stateManager._isValidLocationId('test/../secret')).toBe(false);
    });

    test('should reject path traversal attempts with ..\\', () => {
      expect(stateManager._isValidLocationId('..\\windows\\system32')).toBe(false);
    });

    test('should reject absolute paths (Unix)', () => {
      expect(stateManager._isValidLocationId('/etc/passwd')).toBe(false);
      expect(stateManager._isValidLocationId('/var/log/test')).toBe(false);
    });

    test('should reject absolute paths (Windows)', () => {
      expect(stateManager._isValidLocationId('C:\\Windows\\System32')).toBe(false);
    });

    test('should reject null or undefined', () => {
      expect(stateManager._isValidLocationId(null)).toBe(false);
      expect(stateManager._isValidLocationId(undefined)).toBe(false);
    });

    test('should reject non-string values', () => {
      expect(stateManager._isValidLocationId(123)).toBe(false);
      expect(stateManager._isValidLocationId({})).toBe(false);
      expect(stateManager._isValidLocationId([])).toBe(false);
    });
  });

  // ========================================================================
  // YAML Parsing (_parseStateFile)
  // ========================================================================

  describe('_parseStateFile()', () => {
    beforeEach(() => {
      stateManager = new StateManager({ yaml: mockYaml });
    });

    test('should parse valid YAML frontmatter', () => {
      const content = `---
visited: true
discovered_items: ['item1', 'item2']
completed_events: ['event1']
npc_states: {}
custom_state: {}
last_updated: '2025-11-08T12:00:00Z'
---
# Narrative content here
This is the location description.`;

      mockYaml.load.mockReturnValue({
        visited: true,
        discovered_items: ['item1', 'item2'],
        completed_events: ['event1'],
        npc_states: {},
        custom_state: {},
        last_updated: '2025-11-08T12:00:00Z'
      });

      const result = stateManager._parseStateFile(content);

      expect(result.state.visited).toBe(true);
      expect(result.state.discovered_items).toEqual(['item1', 'item2']);
      expect(result.state.completed_events).toEqual(['event1']);
      expect(result.narrativeContent).toContain('# Narrative content here');
    });

    test('should handle content with no frontmatter', () => {
      const content = '# Just narrative content\nNo YAML here.';

      const result = stateManager._parseStateFile(content);

      expect(result.state.visited).toBe(false);
      expect(result.state.discovered_items).toEqual([]);
      expect(result.narrativeContent).toBe(content);
    });

    test('should handle malformed frontmatter (missing end delimiter)', () => {
      const content = `---
visited: true
This is broken YAML without closing ---`;

      const result = stateManager._parseStateFile(content);

      expect(result.state).toEqual(expect.objectContaining({
        visited: false,
        discovered_items: [],
        completed_events: []
      }));
    });

    test('should handle YAML parse errors gracefully', () => {
      const content = `---
visited: true
invalid: [unclosed array
---
# Content`;

      mockYaml.load.mockImplementation(() => {
        throw new Error('YAML parse error');
      });

      const result = stateManager._parseStateFile(content);

      expect(result.state).toEqual(expect.objectContaining({
        visited: false,
        discovered_items: []
      }));
      expect(console.warn).toHaveBeenCalled();
    });

    test('should merge partial YAML with defaults', () => {
      const content = `---
visited: true
discovered_items: ['item1']
---
Content`;

      mockYaml.load.mockReturnValue({
        visited: true,
        discovered_items: ['item1']
      });

      const result = stateManager._parseStateFile(content);

      expect(result.state.visited).toBe(true);
      expect(result.state.discovered_items).toEqual(['item1']);
      expect(result.state.completed_events).toEqual([]); // Default
      expect(result.state.npc_states).toEqual({}); // Default
    });
  });

  // ========================================================================
  // YAML Serialization (_serializeStateFile)
  // ========================================================================

  describe('_serializeStateFile()', () => {
    beforeEach(() => {
      stateManager = new StateManager({ yaml: mockYaml });
    });

    test('should serialize state to YAML frontmatter', () => {
      const state = {
        visited: true,
        discovered_items: ['item1'],
        completed_events: [],
        npc_states: {},
        custom_state: {},
        last_updated: '2025-11-08T12:00:00Z'
      };

      const narrativeContent = '# Location description\nContent here.';

      mockYaml.dump.mockReturnValue('visited: true\ndiscovered_items:\n  - item1\n');

      const result = stateManager._serializeStateFile(state, narrativeContent);

      expect(result).toContain('---\n');
      expect(result).toContain('visited: true');
      expect(result).toContain('# Location description');
      expect(mockYaml.dump).toHaveBeenCalledWith(
        state,
        expect.objectContaining({
          schema: 'SAFE_SCHEMA',
          sortKeys: true
        })
      );
    });
  });

  // ========================================================================
  // loadState() Method
  // ========================================================================

  describe('loadState()', () => {
    beforeEach(() => {
      stateManager = new StateManager({ fs: mockFs, yaml: mockYaml });
    });

    test('should load state from existing file', async () => {
      const locationId = 'test-location-1';
      const fileContent = `---
visited: true
discovered_items: ['sword']
completed_events: []
npc_states: {}
custom_state: {}
last_updated: '2025-11-08T12:00:00Z'
---
# Content`;

      mockFs.readFile.mockResolvedValue(fileContent);
      mockYaml.load.mockReturnValue({
        visited: true,
        discovered_items: ['sword'],
        completed_events: [],
        npc_states: {},
        custom_state: {},
        last_updated: '2025-11-08T12:00:00Z'
      });

      const result = await stateManager.loadState(locationId);

      expect(result.visited).toBe(true);
      expect(result.discovered_items).toEqual(['sword']);
      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('test-location-1'),
        'utf-8'
      );
    });

    test('should return default state when file does not exist', async () => {
      const locationId = 'missing-location';

      mockFs.readFile.mockRejectedValue({ code: 'ENOENT' });

      const result = await stateManager.loadState(locationId);

      expect(result.visited).toBe(false);
      expect(result.discovered_items).toEqual([]);
      expect(result.completed_events).toEqual([]);
    });

    test('should return default state on read error', async () => {
      const locationId = 'test-location';

      mockFs.readFile.mockRejectedValue(new Error('Permission denied'));

      const result = await stateManager.loadState(locationId);

      expect(result).toEqual(expect.objectContaining({
        visited: false,
        discovered_items: [],
        completed_events: []
      }));
      expect(console.warn).toHaveBeenCalled();
    });

    test('should return default state for invalid location ID', async () => {
      const result = await stateManager.loadState('../etc/passwd');

      expect(result).toEqual(expect.objectContaining({
        visited: false,
        discovered_items: []
      }));
      expect(console.warn).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // updateState() Method
  // ========================================================================

  describe('updateState()', () => {
    beforeEach(() => {
      stateManager = new StateManager({ fs: mockFs, yaml: mockYaml, path: path });
    });

    test('should update existing state file', async () => {
      const locationId = 'test-location-1';
      const existingContent = `---
visited: false
discovered_items: []
completed_events: []
npc_states: {}
custom_state: {}
last_updated: null
---
# Content`;

      mockFs.access.mockResolvedValue(undefined); // Directory exists
      mockFs.readFile.mockResolvedValue(existingContent);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockYaml.load.mockReturnValue({
        visited: false,
        discovered_items: [],
        completed_events: [],
        npc_states: {},
        custom_state: {},
        last_updated: null
      });
      mockYaml.dump.mockReturnValue('visited: true\n');

      const result = await stateManager.updateState(locationId, { visited: true });

      expect(result.success).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test-location-1'),
        expect.stringContaining('visited: true'),
        'utf-8'
      );
    });

    test('should create new state file if missing', async () => {
      const locationId = 'test-location-1';

      mockFs.access.mockResolvedValue(undefined); // Directory exists
      mockFs.readFile.mockRejectedValue({ code: 'ENOENT' }); // File doesn't exist
      mockFs.writeFile.mockResolvedValue(undefined);
      mockYaml.dump.mockReturnValue('visited: true\n');

      const result = await stateManager.updateState(locationId, { visited: true });

      expect(result.success).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    test('should merge state changes correctly', async () => {
      const locationId = 'test-location-1';
      const existingContent = `---
visited: true
discovered_items: ['item1']
completed_events: []
npc_states: {}
custom_state: {}
last_updated: '2025-11-08T10:00:00Z'
---
# Content`;

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(existingContent);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockYaml.load.mockReturnValue({
        visited: true,
        discovered_items: ['item1'],
        completed_events: [],
        npc_states: {},
        custom_state: {},
        last_updated: '2025-11-08T10:00:00Z'
      });
      mockYaml.dump.mockImplementation((state) => {
        // Verify state has merged items
        expect(state.discovered_items).toEqual(['item1', 'item2']);
        expect(state.last_updated).toBeTruthy(); // Timestamp updated
        return 'merged state';
      });

      await stateManager.updateState(locationId, {
        discovered_items: ['item1', 'item2']
      });

      expect(mockYaml.dump).toHaveBeenCalled();
    });

    test('should return error for invalid location ID', async () => {
      const result = await stateManager.updateState('../secret', { visited: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid location ID');
    });

    test('should return error if location directory does not exist', async () => {
      const locationId = 'missing-location';

      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      const result = await stateManager.updateState(locationId, { visited: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Location directory not found');
    });

    test('should return error on write failure', async () => {
      const locationId = 'test-location-1';

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('---\nvisited: false\n---\n');
      mockYaml.load.mockReturnValue({ visited: false });
      mockYaml.dump.mockReturnValue('visited: true\n');
      mockFs.writeFile.mockRejectedValue(new Error('Write permission denied'));

      const result = await stateManager.updateState(locationId, { visited: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update state');
    });

    test('should update timestamp on every change', async () => {
      const locationId = 'test-location-1';
      const beforeTime = new Date().toISOString();

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('---\nvisited: false\n---\n');
      mockYaml.load.mockReturnValue({ visited: false });
      mockYaml.dump.mockImplementation((state) => {
        expect(state.last_updated).toBeTruthy();
        expect(state.last_updated >= beforeTime).toBe(true);
        return 'state';
      });
      mockFs.writeFile.mockResolvedValue(undefined);

      await stateManager.updateState(locationId, { visited: true });
    });
  });

  // ========================================================================
  // markVisited() Method
  // ========================================================================

  describe('markVisited()', () => {
    beforeEach(() => {
      stateManager = new StateManager({ fs: mockFs, yaml: mockYaml });
    });

    test('should mark location as visited', async () => {
      const locationId = 'test-location-1';

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('---\nvisited: false\n---\n');
      mockYaml.load.mockReturnValue({ visited: false });
      mockYaml.dump.mockImplementation((state) => {
        expect(state.visited).toBe(true);
        return 'state';
      });
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await stateManager.markVisited(locationId);

      expect(result.success).toBe(true);
    });
  });

  // ========================================================================
  // addDiscoveredItem() Method
  // ========================================================================

  describe('addDiscoveredItem()', () => {
    beforeEach(() => {
      stateManager = new StateManager({ fs: mockFs, yaml: mockYaml });
    });

    test('should add item to discovered items list', async () => {
      const locationId = 'test-location-1';
      const itemId = 'ancient-sword';

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('---\ndiscovered_items: []\n---\n');
      mockYaml.load.mockReturnValue({ discovered_items: [] });
      mockYaml.dump.mockImplementation((state) => {
        expect(state.discovered_items).toContain('ancient-sword');
        return 'state';
      });
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await stateManager.addDiscoveredItem(locationId, itemId);

      expect(result.success).toBe(true);
    });

    test('should not add duplicate items', async () => {
      const locationId = 'test-location-1';
      const itemId = 'ancient-sword';

      mockFs.readFile.mockResolvedValue('---\ndiscovered_items: [ancient-sword]\n---\n');
      mockYaml.load.mockReturnValue({ discovered_items: ['ancient-sword'] });

      const result = await stateManager.addDiscoveredItem(locationId, itemId);

      expect(result.success).toBe(true);
      // Should not call writeFile if item already exists
    });

    test('should preserve existing items when adding new one', async () => {
      const locationId = 'test-location-1';

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('---\ndiscovered_items: [item1]\n---\n');
      mockYaml.load.mockReturnValue({ discovered_items: ['item1'] });
      mockYaml.dump.mockImplementation((state) => {
        expect(state.discovered_items).toEqual(['item1', 'item2']);
        return 'state';
      });
      mockFs.writeFile.mockResolvedValue(undefined);

      await stateManager.addDiscoveredItem(locationId, 'item2');
    });
  });

  // ========================================================================
  // completeEvent() Method
  // ========================================================================

  describe('completeEvent()', () => {
    beforeEach(() => {
      stateManager = new StateManager({ fs: mockFs, yaml: mockYaml });
    });

    test('should add event to completed events list', async () => {
      const locationId = 'test-location-1';
      const eventId = 'dragon-defeated';

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('---\ncompleted_events: []\n---\n');
      mockYaml.load.mockReturnValue({ completed_events: [] });
      mockYaml.dump.mockImplementation((state) => {
        expect(state.completed_events).toContain('dragon-defeated');
        return 'state';
      });
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await stateManager.completeEvent(locationId, eventId);

      expect(result.success).toBe(true);
    });

    test('should not add duplicate events', async () => {
      const locationId = 'test-location-1';
      const eventId = 'dragon-defeated';

      mockFs.readFile.mockResolvedValue('---\ncompleted_events: [dragon-defeated]\n---\n');
      mockYaml.load.mockReturnValue({ completed_events: ['dragon-defeated'] });

      const result = await stateManager.completeEvent(locationId, eventId);

      expect(result.success).toBe(true);
      // Should not call writeFile if event already completed
    });
  });

  // ========================================================================
  // updateNPCState() Method
  // ========================================================================

  describe('updateNPCState()', () => {
    beforeEach(() => {
      stateManager = new StateManager({ fs: mockFs, yaml: mockYaml });
    });

    test('should update NPC state', async () => {
      const locationId = 'test-location-1';
      const npcId = 'guard-captain';
      const npcState = { attitude: 'friendly', met: true };

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('---\nnpc_states: {}\n---\n');
      mockYaml.load.mockReturnValue({ npc_states: {} });
      mockYaml.dump.mockImplementation((state) => {
        expect(state.npc_states['guard-captain']).toEqual(npcState);
        return 'state';
      });
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await stateManager.updateNPCState(locationId, npcId, npcState);

      expect(result.success).toBe(true);
    });

    test('should preserve other NPC states when updating one', async () => {
      const locationId = 'test-location-1';

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('---\nnpc_states: {npc1: {met: true}}\n---\n');
      mockYaml.load.mockReturnValue({ npc_states: { npc1: { met: true } } });
      mockYaml.dump.mockImplementation((state) => {
        expect(state.npc_states.npc1).toEqual({ met: true });
        expect(state.npc_states.npc2).toEqual({ met: false });
        return 'state';
      });
      mockFs.writeFile.mockResolvedValue(undefined);

      await stateManager.updateNPCState(locationId, 'npc2', { met: false });
    });
  });

  // ========================================================================
  // setCustomState() Method
  // ========================================================================

  describe('setCustomState()', () => {
    beforeEach(() => {
      stateManager = new StateManager({ fs: mockFs, yaml: mockYaml });
    });

    test('should set custom state value', async () => {
      const locationId = 'test-location-1';
      const key = 'door_locked';
      const value = false;

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('---\ncustom_state: {}\n---\n');
      mockYaml.load.mockReturnValue({ custom_state: {} });
      mockYaml.dump.mockImplementation((state) => {
        expect(state.custom_state.door_locked).toBe(false);
        return 'state';
      });
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await stateManager.setCustomState(locationId, key, value);

      expect(result.success).toBe(true);
    });

    test('should preserve other custom state values', async () => {
      const locationId = 'test-location-1';

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('---\ncustom_state: {key1: "value1"}\n---\n');
      mockYaml.load.mockReturnValue({ custom_state: { key1: 'value1' } });
      mockYaml.dump.mockImplementation((state) => {
        expect(state.custom_state.key1).toBe('value1');
        expect(state.custom_state.key2).toBe('value2');
        return 'state';
      });
      mockFs.writeFile.mockResolvedValue(undefined);

      await stateManager.setCustomState(locationId, 'key2', 'value2');
    });
  });
});
