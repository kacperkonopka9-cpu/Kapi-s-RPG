/**
 * Integration Tests: Krezk Location Structure (Story 4-4)
 *
 * Tests Epic 1 LocationLoader compatibility with Krezk's nested sub-location architecture
 */

const { LocationLoader } = require('../../../src/data/location-loader');
const path = require('path');
const fs = require('fs').promises;

describe('Krezk Location Structure - LocationLoader Integration', () => {
  let locationLoader;
  const krezkPath = path.join(process.cwd(), 'game-data', 'locations', 'krezk');

  beforeAll(() => {
    locationLoader = new LocationLoader(path.join(process.cwd(), 'game-data', 'locations'));
  });

  describe('Parent Location Loading', () => {
    test('loads Krezk parent location successfully', async () => {
      const result = await locationLoader.loadLocation('krezk');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.locationId).toBe('krezk');
      expect(result.data.locationName).toBe('Village of Krezk');
    });

    test('parent location has all 6 required files', async () => {
      const files = ['Description.md', 'NPCs.md', 'Items.md', 'Events.md', 'State.md', 'metadata.yaml'];

      for (const file of files) {
        const filePath = path.join(krezkPath, file);
        await expect(fs.access(filePath)).resolves.not.toThrow();
      }
    });

    test('parent metadata declares 5 sub-locations', async () => {
      const result = await locationLoader.loadLocation('krezk');

      expect(result.success).toBe(true);
      expect(result.data.metadata.sub_locations).toBeDefined();
      expect(result.data.metadata.sub_locations).toHaveLength(5);
      expect(result.data.metadata.sub_locations).toEqual(
        expect.arrayContaining([
          'abbey-of-st-markovia',
          'burgomaster-house',
          'blessed-pool',
          'village-gates',
          'shrine-of-the-white-sun'
        ])
      );
    });

    test('parent State.md has valid YAML frontmatter', async () => {
      const result = await locationLoader.loadLocation('krezk');

      expect(result.success).toBe(true);
      expect(result.data.state).toBeDefined();
      expect(result.data.state.visited).toBeDefined();
      expect(typeof result.data.state.visited).toBe('boolean');
      expect(result.data.state.npc_states).toBeDefined();
      expect(typeof result.data.state.npc_states).toBe('object');
    });
  });

  describe('Sub-Location Loading', () => {
    const subLocations = [
      'abbey-of-st-markovia',
      'burgomaster-house',
      'blessed-pool',
      'village-gates',
      'shrine-of-the-white-sun'
    ];

    test.each(subLocations)('loads sub-location: %s', async (subLocationId) => {
      const result = await locationLoader.loadLocation(`krezk/${subLocationId}`);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.locationId).toBe(`krezk/${subLocationId}`);
    });

    test.each(subLocations)('sub-location %s has all 6 required files', async (subLocationId) => {
      const files = ['Description.md', 'NPCs.md', 'Items.md', 'Events.md', 'State.md', 'metadata.yaml'];
      const subLocationPath = path.join(krezkPath, subLocationId);

      for (const file of files) {
        const filePath = path.join(subLocationPath, file);
        await expect(fs.access(filePath)).resolves.not.toThrow();
      }
    });

    test.each(subLocations)('sub-location %s metadata declares krezk as parent', async (subLocationId) => {
      const result = await locationLoader.loadLocation(`krezk/${subLocationId}`);

      expect(result.success).toBe(true);
      expect(result.data.metadata.parent_location).toBe('krezk');
    });

    test.each(subLocations)('sub-location %s State.md has valid YAML frontmatter', async (subLocationId) => {
      const result = await locationLoader.loadLocation(`krezk/${subLocationId}`);

      expect(result.success).toBe(true);
      expect(result.data.state).toBeDefined();
      expect(result.data.state.visited).toBeDefined();
      expect(typeof result.data.state.visited).toBe('boolean');
    });
  });

  describe('Metadata Relationships', () => {
    test('parent location_type is "settlement"', async () => {
      const result = await locationLoader.loadLocation('krezk');

      expect(result.success).toBe(true);
      expect(result.data.metadata.location_type).toBe('settlement');
    });

    test('sub-locations have appropriate location_type values', async () => {
      const buildingSubLocations = [
        'abbey-of-st-markovia',
        'burgomaster-house',
        'shrine-of-the-white-sun'
      ];

      for (const subLocationId of buildingSubLocations) {
        const result = await locationLoader.loadLocation(`krezk/${subLocationId}`);
        expect(result.success).toBe(true);
        expect(result.data.metadata.location_type).toBe('building');
      }

      // Pool and gates are outdoor
      const outdoorResult1 = await locationLoader.loadLocation('krezk/blessed-pool');
      expect(outdoorResult1.data.metadata.location_type).toBe('outdoor');

      const outdoorResult2 = await locationLoader.loadLocation('krezk/village-gates');
      expect(outdoorResult2.data.metadata.location_type).toBe('outdoor');
    });

    test('all sub-locations have danger_level defined', async () => {
      const subLocations = [
        'abbey-of-st-markovia',
        'burgomaster-house',
        'blessed-pool',
        'village-gates',
        'shrine-of-the-white-sun'
      ];

      for (const subLocationId of subLocations) {
        const result = await locationLoader.loadLocation(`krezk/${subLocationId}`);
        expect(result.success).toBe(true);
        expect(result.data.metadata.danger_level).toBeDefined();
        expect(typeof result.data.metadata.danger_level).toBe('number');
        expect(result.data.metadata.danger_level).toBeGreaterThanOrEqual(1);
        expect(result.data.metadata.danger_level).toBeLessThanOrEqual(5);
      }
    });

    test('quest-critical locations are marked correctly', async () => {
      // Abbey and burgomaster-house are quest-critical
      const abbeyResult = await locationLoader.loadLocation('krezk/abbey-of-st-markovia');
      expect(abbeyResult.data.metadata.quest_critical).toBe(true);

      const houseResult = await locationLoader.loadLocation('krezk/burgomaster-house');
      expect(houseResult.data.metadata.quest_critical).toBe(true);

      const poolResult = await locationLoader.loadLocation('krezk/blessed-pool');
      expect(poolResult.data.metadata.quest_critical).toBe(true);
    });
  });

  describe('Content Validation', () => {
    test('parent location has major NPCs defined', async () => {
      const result = await locationLoader.loadLocation('krezk');

      expect(result.success).toBe(true);
      expect(result.data.npcs).toBeDefined();
      expect(result.data.npcs.length).toBeGreaterThan(0);

      // Check for key NPCs
      const npcIds = result.data.npcs.map(npc => npc.npcId);
      expect(npcIds).toContain('dmitri_krezkov');
      expect(npcIds).toContain('the_abbot');
      expect(npcIds).toContain('father_andrei');
    });

    test('parent location has village-wide events', async () => {
      const result = await locationLoader.loadLocation('krezk');

      expect(result.success).toBe(true);
      expect(result.data.events).toBeDefined();
      expect(result.data.events.length).toBeGreaterThan(0);
    });

    test('blessed pool has enhanced holy water', async () => {
      const result = await locationLoader.loadLocation('krezk/blessed-pool');

      expect(result.success).toBe(true);
      expect(result.data.items).toBeDefined();

      const holyWater = result.data.items.find(item => item.itemId === 'blessed_pool_holy_water');
      expect(holyWater).toBeDefined();
      expect(holyWater.category).toBe('consumable');
    });
  });

  describe('Token Count Compliance', () => {
    test('all Description.md files stay under 2000 tokens', async () => {
      const allLocations = [
        'krezk',
        'krezk/abbey-of-st-markovia',
        'krezk/burgomaster-house',
        'krezk/blessed-pool',
        'krezk/village-gates',
        'krezk/shrine-of-the-white-sun'
      ];

      for (const locationId of allLocations) {
        const result = await locationLoader.loadLocation(locationId);
        expect(result.success).toBe(true);

        // Rough token estimation: ~4 chars per token
        const descriptionText = result.data.description.full;
        const estimatedTokens = Math.ceil(descriptionText.length / 4);

        expect(estimatedTokens).toBeLessThan(2000);
      }
    });
  });
});
