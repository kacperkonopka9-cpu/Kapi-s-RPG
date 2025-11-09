/**
 * Integration Tests - State Persistence
 *
 * Story 1.10 - Location State Persistence
 * Verifies end-to-end state persistence flow:
 * 1. Traveling updates State.md with visited=true
 * 2. LocationLoader exposes YAML frontmatter state data
 * 3. Multi-session state restoration works correctly
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { LocationLoader } = require('../../src/data/location-loader');
const { SessionManager } = require('../../src/core/session-manager');
const StateManager = require('../../src/core/state-manager');
const { NavigationHandler } = require('../../src/core/navigation-handler');

// Test utilities
const TEST_LOCATIONS_DIR = path.join(__dirname, '..', 'fixtures', 'integration-test-locations');
const TEMP_STATE_DIR = path.join(__dirname, '..', 'temp', 'state-integration');

describe('State Persistence Integration Tests', () => {
  let locationLoader;
  let sessionManager;
  let stateManager;
  let navigationHandler;

  beforeEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(TEMP_STATE_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore if doesn't exist
    }
    await fs.mkdir(TEMP_STATE_DIR, { recursive: true });

    // Copy test locations to temp directory
    await copyTestLocations();

    // Initialize components with temp directory
    stateManager = new StateManager({ locationsDir: TEMP_STATE_DIR });
    locationLoader = new LocationLoader(TEMP_STATE_DIR);
    sessionManager = new SessionManager({ stateManager });
    navigationHandler = new NavigationHandler(TEMP_STATE_DIR);
  });

  afterEach(async () => {
    // Clean up
    try {
      await fs.rm(TEMP_STATE_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  /**
   * Copy test locations from fixtures to temp directory
   */
  async function copyTestLocations() {
    // Create test locations: location-a and location-b
    const locationA = path.join(TEMP_STATE_DIR, 'location-a');
    const locationB = path.join(TEMP_STATE_DIR, 'location-b');

    await fs.mkdir(locationA, { recursive: true });
    await fs.mkdir(locationB, { recursive: true });

    // Create minimal location files for location-a
    await fs.writeFile(
      path.join(locationA, 'Description.md'),
      '# Location A\n\nA test location for integration testing.'
    );
    await fs.writeFile(
      path.join(locationA, 'NPCs.md'),
      '# NPCs\n\nNo NPCs here.'
    );
    await fs.writeFile(
      path.join(locationA, 'Items.md'),
      '## Available Items\n\nNone.\n\n## Hidden Items\n\nNone.'
    );
    await fs.writeFile(
      path.join(locationA, 'Events.md'),
      '# Events\n\nNo events.'
    );
    await fs.writeFile(
      path.join(locationA, 'State.md'),
      '# Location State\n\nInitial state.'
    );
    await fs.writeFile(
      path.join(locationA, 'metadata.yaml'),
      yaml.dump({
        location_name: 'Location A',
        location_level: 'room',
        connected_locations: ['location-b']
      })
    );

    // Create minimal location files for location-b
    await fs.writeFile(
      path.join(locationB, 'Description.md'),
      '# Location B\n\nAnother test location.'
    );
    await fs.writeFile(
      path.join(locationB, 'NPCs.md'),
      '# NPCs\n\nNo NPCs here.'
    );
    await fs.writeFile(
      path.join(locationB, 'Items.md'),
      '## Available Items\n\nNone.\n\n## Hidden Items\n\nNone.'
    );
    await fs.writeFile(
      path.join(locationB, 'Events.md'),
      '# Events\n\nNo events.'
    );
    await fs.writeFile(
      path.join(locationB, 'State.md'),
      '# Location State\n\nInitial state.'
    );
    await fs.writeFile(
      path.join(locationB, 'metadata.yaml'),
      yaml.dump({
        location_name: 'Location B',
        location_level: 'room',
        connected_locations: ['location-a']
      })
    );
  }

  /**
   * Read and parse State.md file
   */
  async function readStateFile(locationId) {
    const statePath = path.join(TEMP_STATE_DIR, locationId, 'State.md');
    const content = await fs.readFile(statePath, 'utf-8');

    // Parse YAML frontmatter
    if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) {
      return null; // No frontmatter
    }

    const lines = content.split('\n');
    let endIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        endIndex = i;
        break;
      }
    }

    if (endIndex === -1) {
      return null; // Malformed
    }

    const yamlContent = lines.slice(1, endIndex).join('\n');
    return yaml.load(yamlContent, { schema: yaml.SAFE_SCHEMA });
  }

  // ============================================================
  // Test Suite 1: Basic State Persistence
  // ============================================================

  describe('Basic State Persistence', () => {
    test('should mark location as visited when traveling', async () => {
      // Start session at location-a
      sessionManager.startSession('location-a');

      // Travel to location-b
      const navResult = navigationHandler.travel('location-b', 'location-a');
      expect(navResult.success).toBe(true);

      // Update session location (triggers state persistence)
      await sessionManager.updateCurrentLocation('location-b');

      // Verify State.md was updated
      const stateData = await readStateFile('location-b');
      expect(stateData).not.toBeNull();
      expect(stateData.visited).toBe(true);
      expect(stateData.last_updated).toBeDefined();
    });

    test('should create State.md with YAML frontmatter if missing', async () => {
      // Delete State.md for location-a
      const statePath = path.join(TEMP_STATE_DIR, 'location-a', 'State.md');
      await fs.unlink(statePath);

      // Mark location as visited (should create file)
      const result = await stateManager.markVisited('location-a');
      expect(result.success).toBe(true);

      // Verify file was created with frontmatter
      const stateData = await readStateFile('location-a');
      expect(stateData).not.toBeNull();
      expect(stateData.visited).toBe(true);
    });

    test('should preserve existing narrative content when updating state', async () => {
      // Write State.md with custom narrative
      const statePath = path.join(TEMP_STATE_DIR, 'location-a', 'State.md');
      const originalContent = '# Custom State\n\nThis is custom narrative content.';
      await fs.writeFile(statePath, originalContent, 'utf-8');

      // Update state
      await stateManager.markVisited('location-a');

      // Read file and verify narrative is preserved
      const fileContent = await fs.readFile(statePath, 'utf-8');
      expect(fileContent).toContain('This is custom narrative content');
      expect(fileContent).toMatch(/^---\n/); // Has frontmatter
    });
  });

  // ============================================================
  // Test Suite 2: LocationLoader Integration
  // ============================================================

  describe('LocationLoader State Exposure', () => {
    test('should expose YAML frontmatter state data in LocationData', async () => {
      // Write State.md with YAML frontmatter
      const statePath = path.join(TEMP_STATE_DIR, 'location-a', 'State.md');
      const stateContent = yaml.dump({
        visited: true,
        discovered_items: ['item-1', 'item-2'],
        completed_events: ['event-1'],
        npc_states: { npc1: { mood: 'happy' } },
        custom_state: { flag1: true },
        last_updated: '2025-01-01T00:00:00.000Z'
      });
      await fs.writeFile(statePath, `---\n${stateContent}---\n# State\n\nNarrative.`, 'utf-8');

      // Load location
      const locationData = await locationLoader.loadLocation('location-a');

      // Verify state fields are exposed
      expect(locationData.state.visited).toBe(true);
      expect(locationData.state.discovered_items).toEqual(['item-1', 'item-2']);
      expect(locationData.state.completed_events).toEqual(['event-1']);
      expect(locationData.state.npc_states).toEqual({ npc1: { mood: 'happy' } });
      expect(locationData.state.custom_state).toEqual({ flag1: true });
    });

    test('should handle State.md without YAML frontmatter (backward compatibility)', async () => {
      // Write State.md without frontmatter (legacy format)
      const statePath = path.join(TEMP_STATE_DIR, 'location-a', 'State.md');
      await fs.writeFile(statePath, '# Location State\n\nLegacy format.', 'utf-8');

      // Load location (should not crash)
      const locationData = await locationLoader.loadLocation('location-a');

      // Verify default state values
      expect(locationData.state.visited).toBe(false);
      expect(locationData.state.discovered_items).toEqual([]);
      expect(locationData.state.completed_events).toEqual([]);
      expect(locationData.state.npc_states).toEqual({});
      expect(locationData.state.custom_state).toEqual({});
    });
  });

  // ============================================================
  // Test Suite 3: Multi-Session Persistence
  // ============================================================

  describe('Multi-Session State Persistence', () => {
    test('should persist state changes across sessions', async () => {
      // ===== Session 1: Visit locations and make changes =====
      const session1 = new SessionManager({ stateManager });
      session1.startSession('location-a');

      // Travel to location-b
      await session1.updateCurrentLocation('location-b');

      // Add discovered item
      await stateManager.addDiscoveredItem('location-b', 'treasure-chest');

      // Complete an event
      await stateManager.completeEvent('location-b', 'quest-complete');

      // Update NPC state
      await stateManager.updateNPCState('location-b', 'merchant', {
        relationship: 'friendly',
        questGiven: true
      });

      session1.endSession();

      // ===== Session 2: Load location and verify state persisted =====
      const session2 = new SessionManager({ stateManager });
      const locationLoader2 = new LocationLoader(TEMP_STATE_DIR);

      session2.startSession('location-a');

      // Load location-b
      const locationData = await locationLoader2.loadLocation('location-b');

      // Verify all state changes persisted
      expect(locationData.state.visited).toBe(true);
      expect(locationData.state.discovered_items).toContain('treasure-chest');
      expect(locationData.state.completed_events).toContain('quest-complete');
      expect(locationData.state.npc_states.merchant).toEqual({
        relationship: 'friendly',
        questGiven: true
      });
    });

    test('should prevent duplicate items and events', async () => {
      // Add item twice
      await stateManager.addDiscoveredItem('location-a', 'sword');
      await stateManager.addDiscoveredItem('location-a', 'sword');

      // Add event twice
      await stateManager.completeEvent('location-a', 'boss-defeated');
      await stateManager.completeEvent('location-a', 'boss-defeated');

      // Load state
      const state = await stateManager.loadState('location-a');

      // Verify no duplicates
      expect(state.discovered_items).toEqual(['sword']);
      expect(state.completed_events).toEqual(['boss-defeated']);
    });

    test('should merge custom state across updates', async () => {
      // Update 1: Set flag1
      await stateManager.setCustomState('location-a', 'flag1', true);

      // Update 2: Set flag2
      await stateManager.setCustomState('location-a', 'flag2', 'active');

      // Update 3: Set nested object
      await stateManager.setCustomState('location-a', 'counters', { visitCount: 5 });

      // Load state
      const state = await stateManager.loadState('location-a');

      // Verify all custom state merged
      expect(state.custom_state.flag1).toBe(true);
      expect(state.custom_state.flag2).toBe('active');
      expect(state.custom_state.counters).toEqual({ visitCount: 5 });
    });
  });

  // ============================================================
  // Test Suite 4: Error Handling
  // ============================================================

  describe('Error Handling', () => {
    test('should handle non-existent location gracefully', async () => {
      const result = await stateManager.markVisited('nonexistent-location');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('should handle invalid location ID gracefully', async () => {
      const result = await stateManager.markVisited('../../../etc/passwd');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid location ID');
    });

    test('should handle malformed YAML frontmatter gracefully', async () => {
      // Write State.md with malformed YAML
      const statePath = path.join(TEMP_STATE_DIR, 'location-a', 'State.md');
      await fs.writeFile(statePath, '---\n{ invalid yaml ]\n---\n# State', 'utf-8');

      // Load location (should not crash)
      const locationData = await locationLoader.loadLocation('location-a');

      // Should return default state
      expect(locationData.state.visited).toBe(false);
      expect(locationData.state.discovered_items).toEqual([]);
    });

    test('should continue session even if state persistence fails', async () => {
      // Make location directory read-only (simulate permission error)
      const locationDir = path.join(TEMP_STATE_DIR, 'location-a');

      // Start session and try to travel (should not crash)
      sessionManager.startSession('location-a');

      // Mock fs to simulate write failure
      const originalWriteFile = stateManager.fs.writeFile;
      stateManager.fs.writeFile = jest.fn().mockRejectedValue(new Error('Permission denied'));

      // Travel should succeed even if state persistence fails
      await expect(sessionManager.updateCurrentLocation('location-a')).resolves.not.toThrow();

      // Session should still be active
      const session = sessionManager.getCurrentSession();
      expect(session).not.toBeNull();
      expect(session.currentLocationId).toBe('location-a');

      // Restore original function
      stateManager.fs.writeFile = originalWriteFile;
    });
  });

  // ============================================================
  // Test Suite 5: Performance
  // ============================================================

  describe('Performance', () => {
    test('should persist state within acceptable time (<100ms)', async () => {
      const startTime = performance.now();

      await stateManager.markVisited('location-a');

      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(100); // Should be fast
    });

    test('should handle multiple state updates efficiently', async () => {
      const startTime = performance.now();

      // Perform 10 state updates
      for (let i = 0; i < 10; i++) {
        await stateManager.addDiscoveredItem('location-a', `item-${i}`);
      }

      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(500); // All updates < 500ms
    });
  });
});
