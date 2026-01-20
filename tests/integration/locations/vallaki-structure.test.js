/**
 * Integration Tests: Vallaki Location Structure (Story 4-3)
 *
 * Tests Epic 1 LocationLoader compatibility with Vallaki's nested sub-location architecture
 */

const { LocationLoader } = require('../../../src/data/location-loader');
const path = require('path');
const fs = require('fs').promises;

describe('Vallaki Location Structure - LocationLoader Integration', () => {
  let locationLoader;
  const vallakiPath = path.join(process.cwd(), 'game-data', 'locations', 'vallaki');

  beforeAll(() => {
    locationLoader = new LocationLoader(path.join(process.cwd(), 'game-data', 'locations'));
  });

  describe('Parent Location Loading', () => {
    test('loads Vallaki parent location successfully', async () => {
      const result = await locationLoader.loadLocation('vallaki');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.locationId).toBe('vallaki');
      expect(result.data.locationName).toBe('Town of Vallaki');
    });

    test('parent location has all 6 required files', async () => {
      const files = ['Description.md', 'NPCs.md', 'Items.md', 'Events.md', 'State.md', 'metadata.yaml'];

      for (const file of files) {
        const filePath = path.join(vallakiPath, file);
        await expect(fs.access(filePath)).resolves.not.toThrow();
      }
    });

    test('parent metadata declares 7 sub-locations', async () => {
      const result = await locationLoader.loadLocation('vallaki');

      expect(result.success).toBe(true);
      expect(result.data.metadata.sub_locations).toBeDefined();
      expect(result.data.metadata.sub_locations).toHaveLength(7);
      expect(result.data.metadata.sub_locations).toEqual(
        expect.arrayContaining([
          'church-of-st-andral',
          'burgomaster-mansion',
          'blue-water-inn',
          'town-square',
          'reformation-center',
          'town-gates',
          'coffin-maker-shop'
        ])
      );
    });

    test('parent State.md has valid YAML frontmatter', async () => {
      const result = await locationLoader.loadLocation('vallaki');

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
      'church-of-st-andral',
      'burgomaster-mansion',
      'blue-water-inn',
      'town-square',
      'reformation-center',
      'town-gates',
      'coffin-maker-shop'
    ];

    test.each(subLocations)('loads sub-location: %s', async (subLocationId) => {
      const result = await locationLoader.loadLocation(`vallaki/${subLocationId}`);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.locationId).toBe(`vallaki/${subLocationId}`);
    });

    test.each(subLocations)('sub-location %s has all 6 required files', async (subLocationId) => {
      const files = ['Description.md', 'NPCs.md', 'Items.md', 'Events.md', 'State.md', 'metadata.yaml'];
      const subLocationPath = path.join(vallakiPath, subLocationId);

      for (const file of files) {
        const filePath = path.join(subLocationPath, file);
        await expect(fs.access(filePath)).resolves.not.toThrow();
      }
    });

    test.each(subLocations)('sub-location %s metadata declares vallaki as parent', async (subLocationId) => {
      const result = await locationLoader.loadLocation(`vallaki/${subLocationId}`);

      expect(result.success).toBe(true);
      expect(result.data.metadata.parent_location).toBe('vallaki');
    });

    test.each(subLocations)('sub-location %s State.md has valid YAML frontmatter', async (subLocationId) => {
      const result = await locationLoader.loadLocation(`vallaki/${subLocationId}`);

      expect(result.success).toBe(true);
      expect(result.data.state).toBeDefined();
      expect(result.data.state.visited).toBeDefined();
      expect(typeof result.data.state.visited).toBe('boolean');
    });
  });

  describe('Metadata Relationships', () => {
    test('parent location_type is "settlement"', async () => {
      const result = await locationLoader.loadLocation('vallaki');

      expect(result.success).toBe(true);
      expect(result.data.metadata.location_type).toBe('settlement');
    });

    test('sub-locations have appropriate location_type values', async () => {
      const buildingSubLocations = [
        'church-of-st-andral',
        'burgomaster-mansion',
        'blue-water-inn',
        'reformation-center',
        'coffin-maker-shop'
      ];

      for (const subLocationId of buildingSubLocations) {
        const result = await locationLoader.loadLocation(`vallaki/${subLocationId}`);
        expect(result.success).toBe(true);
        expect(result.data.metadata.location_type).toBe('building');
      }

      // Town square and gates are outdoor
      const outdoorResult1 = await locationLoader.loadLocation('vallaki/town-square');
      expect(outdoorResult1.data.metadata.location_type).toBe('outdoor');

      const outdoorResult2 = await locationLoader.loadLocation('vallaki/town-gates');
      expect(outdoorResult2.data.metadata.location_type).toBe('outdoor');
    });

    test('all sub-locations have danger_level defined', async () => {
      const subLocations = [
        'church-of-st-andral',
        'burgomaster-mansion',
        'blue-water-inn',
        'town-square',
        'reformation-center',
        'town-gates',
        'coffin-maker-shop'
      ];

      for (const subLocationId of subLocations) {
        const result = await locationLoader.loadLocation(`vallaki/${subLocationId}`);
        expect(result.success).toBe(true);
        expect(result.data.metadata.danger_level).toBeDefined();
        expect(typeof result.data.metadata.danger_level).toBe('number');
        expect(result.data.metadata.danger_level).toBeGreaterThanOrEqual(1);
        expect(result.data.metadata.danger_level).toBeLessThanOrEqual(5);
      }
    });

    test('quest-critical locations are marked correctly', async () => {
      // Church and coffin maker are quest-critical
      const churchResult = await locationLoader.loadLocation('vallaki/church-of-st-andral');
      expect(churchResult.data.metadata.quest_critical).toBe(true);

      const coffinResult = await locationLoader.loadLocation('vallaki/coffin-maker-shop');
      expect(coffinResult.data.metadata.quest_critical).toBe(true);
    });
  });

  describe('Content Validation', () => {
    test('parent location has major NPCs defined', async () => {
      const result = await locationLoader.loadLocation('vallaki');

      expect(result.success).toBe(true);
      expect(result.data.npcs).toBeDefined();
      expect(result.data.npcs.length).toBeGreaterThan(0);

      // Check for key NPCs
      const npcIds = result.data.npcs.map(npc => npc.npcId);
      expect(npcIds).toContain('baron_vargas_vallakovich');
      expect(npcIds).toContain('father_lucian_petrovich');
      expect(npcIds).toContain('urwin_martikov');
    });

    test('parent location has town-wide events', async () => {
      const result = await locationLoader.loadLocation('vallaki');

      expect(result.success).toBe(true);
      expect(result.data.events).toBeDefined();
      expect(result.data.events.length).toBeGreaterThan(0);
    });

    test('coffin maker shop has St. Andral\'s bones item', async () => {
      const result = await locationLoader.loadLocation('vallaki/coffin-maker-shop');

      expect(result.success).toBe(true);
      expect(result.data.items).toBeDefined();

      const bonesItem = result.data.items.find(item => item.itemId === 'st_andrals_bones');
      expect(bonesItem).toBeDefined();
      expect(bonesItem.category).toBe('quest_item');
      expect(bonesItem.hidden).toBe(true);
    });
  });

  describe('Token Count Compliance', () => {
    test('all Description.md files stay under 2000 tokens', async () => {
      const allLocations = [
        'vallaki',
        'vallaki/church-of-st-andral',
        'vallaki/burgomaster-mansion',
        'vallaki/blue-water-inn',
        'vallaki/town-square',
        'vallaki/reformation-center',
        'vallaki/town-gates',
        'vallaki/coffin-maker-shop'
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
