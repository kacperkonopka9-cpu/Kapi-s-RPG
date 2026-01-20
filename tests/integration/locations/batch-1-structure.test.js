/**
 * Integration Tests: Batch 1 Locations Structure (Story 4-5)
 *
 * Tests Epic 1 LocationLoader compatibility with Batch 1 locations:
 * - Death House
 * - Tser Pool Encampment
 * - Old Bonegrinder
 * - Wizard of Wines Winery
 * - Van Richten's Tower
 * - Werewolf Den
 */

const { LocationLoader } = require('../../../src/data/location-loader');
const path = require('path');
const fs = require('fs').promises;

describe('Batch 1 Locations Structure - LocationLoader Integration', () => {
  let locationLoader;
  const locationsBasePath = path.join(process.cwd(), 'game-data', 'locations');

  beforeAll(() => {
    locationLoader = new LocationLoader(locationsBasePath);
  });

  const batch1Locations = [
    { id: 'death-house', name: 'Death House' },
    { id: 'tser-pool-encampment', name: 'Tser Pool Encampment' },
    { id: 'old-bonegrinder', name: 'Old Bonegrinder' },
    { id: 'wizard-of-wines', name: 'Wizard of Wines Winery' },
    { id: 'van-richtens-tower', name: "Van Richten's Tower" },
    { id: 'werewolf-den', name: 'Werewolf Den' }
  ];

  describe('Location Loading', () => {
    test.each(batch1Locations)('loads location: $name', async ({ id, name }) => {
      const result = await locationLoader.loadLocation(id);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.locationId).toBe(id);
      expect(result.data.locationName).toBe(name);
    });
  });

  describe('Required Files Structure', () => {
    test.each(batch1Locations)('location $name has all 6 required files', async ({ id }) => {
      const files = ['Description.md', 'NPCs.md', 'Items.md', 'Events.md', 'State.md', 'metadata.yaml'];
      const locationPath = path.join(locationsBasePath, id);

      for (const file of files) {
        const filePath = path.join(locationPath, file);
        await expect(fs.access(filePath)).resolves.not.toThrow();
      }
    });
  });

  describe('Metadata Validation', () => {
    test.each(batch1Locations)('$name metadata has required fields', async ({ id }) => {
      const result = await locationLoader.loadLocation(id);

      expect(result.success).toBe(true);
      expect(result.data.metadata.location_name).toBeDefined();
      expect(result.data.metadata.location_type).toBeDefined();
      expect(result.data.metadata.region).toBeDefined();
      expect(result.data.metadata.danger_level).toBeDefined();
      expect(typeof result.data.metadata.danger_level).toBe('number');
      expect(result.data.metadata.danger_level).toBeGreaterThanOrEqual(1);
      expect(result.data.metadata.danger_level).toBeLessThanOrEqual(5);
    });

    test.each(batch1Locations)('$name has location_level field', async ({ id }) => {
      const result = await locationLoader.loadLocation(id);

      expect(result.success).toBe(true);
      expect(result.data.metadata.location_level).toBeDefined();
      expect(['region', 'settlement', 'building', 'room', 'outdoor']).toContain(
        result.data.metadata.location_level
      );
    });

    test.each(batch1Locations)('$name has connected_locations with name fields', async ({ id }) => {
      const result = await locationLoader.loadLocation(id);

      expect(result.success).toBe(true);
      expect(result.data.metadata.connected_locations).toBeDefined();
      expect(Array.isArray(result.data.metadata.connected_locations)).toBe(true);

      result.data.metadata.connected_locations.forEach(connection => {
        expect(connection.name).toBeDefined();
        expect(typeof connection.name).toBe('string');
        expect(connection.direction).toBeDefined();
        expect(connection.travel_time).toBeDefined();
      });
    });
  });

  describe('State File YAML Frontmatter', () => {
    test.each(batch1Locations)('$name State.md has valid YAML frontmatter', async ({ id }) => {
      const result = await locationLoader.loadLocation(id);

      expect(result.success).toBe(true);
      expect(result.data.state).toBeDefined();
      expect(result.data.state.visited).toBeDefined();
      expect(typeof result.data.state.visited).toBe('boolean');
      expect(result.data.state.discovered).toBeDefined();
      expect(typeof result.data.state.discovered).toBe('boolean');
    });
  });

  describe('Content Validation', () => {
    test.each(batch1Locations)('$name has NPCs defined', async ({ id }) => {
      const result = await locationLoader.loadLocation(id);

      expect(result.success).toBe(true);
      expect(result.data.npcs).toBeDefined();
      expect(Array.isArray(result.data.npcs)).toBe(true);
      expect(result.data.npcs.length).toBeGreaterThan(0);
    });

    test.each(batch1Locations)('$name has items defined', async ({ id }) => {
      const result = await locationLoader.loadLocation(id);

      expect(result.success).toBe(true);
      expect(result.data.items).toBeDefined();
      expect(Array.isArray(result.data.items)).toBe(true);
    });

    test.each(batch1Locations)('$name has events defined', async ({ id }) => {
      const result = await locationLoader.loadLocation(id);

      expect(result.success).toBe(true);
      expect(result.data.events).toBeDefined();
      expect(Array.isArray(result.data.events)).toBe(true);
    });
  });

  describe('Description Structure', () => {
    test.each(batch1Locations)('$name Description.md follows standard format', async ({ id }) => {
      const result = await locationLoader.loadLocation(id);

      expect(result.success).toBe(true);
      expect(result.data.description).toBeDefined();
      expect(result.data.description.full).toBeDefined();
      expect(typeof result.data.description.full).toBe('string');
      expect(result.data.description.full.length).toBeGreaterThan(100);
    });

    test.each(batch1Locations)('$name Description.md stays under 2000 tokens (estimated)', async ({ id }) => {
      const result = await locationLoader.loadLocation(id);

      expect(result.success).toBe(true);

      // Rough token estimation: ~4 chars per token
      const descriptionText = result.data.description.full;
      const estimatedTokens = Math.ceil(descriptionText.length / 4);

      expect(estimatedTokens).toBeLessThan(2000);
    });
  });

  describe('Quest Critical Locations', () => {
    const questCriticalLocations = [
      'tser-pool-encampment',  // Tarokka reading
      'old-bonegrinder',        // Hag coven
      'wizard-of-wines',        // Wine supply, Keepers alliance
      'werewolf-den'            // Krezk threat
    ];

    test.each(questCriticalLocations)('quest-critical location %s is marked correctly', async (id) => {
      const result = await locationLoader.loadLocation(id);

      expect(result.success).toBe(true);
      expect(result.data.metadata.quest_critical).toBe(true);
    });
  });

  describe('Network Connections', () => {
    test('Village of Barovia connects to Death House', async () => {
      const result = await locationLoader.loadLocation('village-of-barovia');
      expect(result.success).toBe(true);

      const connections = result.data.metadata.connected_locations.map(c => c.name);
      expect(connections).toContain('Death House');
    });

    test('Village of Barovia connects to Old Bonegrinder', async () => {
      const result = await locationLoader.loadLocation('village-of-barovia');
      expect(result.success).toBe(true);

      const connections = result.data.metadata.connected_locations.map(c => c.name);
      expect(connections).toContain('Old Bonegrinder');
    });

    test('Vallaki connects to Tser Pool, Old Bonegrinder, Wizard of Wines, Van Richten\'s Tower', async () => {
      const result = await locationLoader.loadLocation('vallaki');
      expect(result.success).toBe(true);

      const connections = result.data.metadata.connected_locations.map(c => c.name);
      expect(connections).toContain('Tser Pool Encampment');
      expect(connections).toContain('Old Bonegrinder');
      expect(connections).toContain('Wizard of Wines Winery');
      expect(connections).toContain("Van Richten's Tower");
    });

    test('Krezk connects to Wizard of Wines and Werewolf Den', async () => {
      const result = await locationLoader.loadLocation('krezk');
      expect(result.success).toBe(true);

      const connections = result.data.metadata.connected_locations.map(c => c.name);
      expect(connections).toContain('Wizard of Wines Winery');
      expect(connections).toContain('Werewolf Den');
    });
  });

  describe('Epic 2 Event Schema Compliance', () => {
    test.each(batch1Locations)('$name Events follow Epic 2 schema', async ({ id }) => {
      const eventsPath = path.join(locationsBasePath, id, 'Events.md');
      const eventsContent = await fs.readFile(eventsPath, 'utf-8');

      // Check for Epic 2 event structure indicators
      expect(eventsContent).toMatch(/eventId:/);
      expect(eventsContent).toMatch(/name:/);
      expect(eventsContent).toMatch(/trigger_type:/);
      expect(eventsContent).toMatch(/effects:/);
    });
  });
});
