/**
 * Integration Tests for Village of Barovia Location
 * Tests Epic 1 LocationLoader integration with Village of Barovia content
 *
 * Story: 4-1-village-of-barovia-location
 * AC-8: Epic 1 LocationLoader Integration
 */

const path = require('path');
const { LocationLoader } = require('../../../src/data/location-loader');

describe('Village of Barovia - LocationLoader Integration', () => {
  let locationLoader;
  const locationId = 'village-of-barovia';

  beforeEach(() => {
    locationLoader = new LocationLoader();
  });

  describe('AC-8: Location Loading', () => {
    test('should successfully load village-of-barovia location', async () => {
      const location = await locationLoader.loadLocation(locationId);

      expect(location).toBeDefined();
      expect(location.locationId).toBe(locationId);
    });

    test('should return LocationData structure with all required fields', async () => {
      const location = await locationLoader.loadLocation(locationId);

      expect(location).toHaveProperty('locationId');
      expect(location).toHaveProperty('locationName');
      expect(location).toHaveProperty('description');
      expect(location).toHaveProperty('npcs');
      expect(location).toHaveProperty('items');
      expect(location).toHaveProperty('events');
      expect(location).toHaveProperty('state');
      expect(location).toHaveProperty('metadata');
    });

    test('should load description with all variants', async () => {
      const location = await locationLoader.loadLocation(locationId);

      expect(location.description).toBeTruthy();
      expect(location.description).toContain('Village of Barovia');

      expect(location.descriptionVariants).toBeDefined();
      expect(location.descriptionVariants.initial).toBeTruthy();
      expect(location.descriptionVariants.return).toBeTruthy();
      expect(location.descriptionVariants.morning).toBeTruthy();
      expect(location.descriptionVariants.night).toBeTruthy();
      expect(location.descriptionVariants.foggy).toBeTruthy();
    });

    test('should load all 6 NPCs (Ismark, Ireena, Mad Mary, Father Donavin, Bildrath, Parriwimple)', async () => {
      const location = await locationLoader.loadLocation(locationId);

      expect(Array.isArray(location.npcs)).toBe(true);
      expect(location.npcs.length).toBeGreaterThanOrEqual(6);

      const npcNames = location.npcs.map(npc => npc.name);
      expect(npcNames).toEqual(expect.arrayContaining([
        expect.stringMatching(/Ismark/i),
        expect.stringMatching(/Ireena/i),
        expect.stringMatching(/Mary/i),
        expect.stringMatching(/Donavin/i),
        expect.stringMatching(/Bildrath/i),
        expect.stringMatching(/Parriwimple/i)
      ]));
    });

    test('should load items array with quest items and merchant goods', async () => {
      const location = await locationLoader.loadLocation(locationId);

      expect(Array.isArray(location.items)).toBe(true);
      expect(location.items.length).toBeGreaterThan(0);
    });

    test('should load events array with at least 3 events', async () => {
      const location = await locationLoader.loadLocation(locationId);

      expect(Array.isArray(location.events)).toBe(true);
      expect(location.events.length).toBeGreaterThanOrEqual(3);
    });

    test('should load State object with YAML frontmatter parsed correctly', async () => {
      const location = await locationLoader.loadLocation(locationId);

      expect(location.state).toBeDefined();
      expect(location.state).toHaveProperty('visited');
      expect(location.state.visited).toBe(false);
      expect(location.state).toHaveProperty('discovered_items');
      expect(Array.isArray(location.state.discovered_items)).toBe(true);
      expect(location.state).toHaveProperty('completed_events');
      expect(Array.isArray(location.state.completed_events)).toBe(true);
      expect(location.state).toHaveProperty('npc_states');
      expect(location.state.npc_states).toHaveProperty('ismark_kolyanovich');
      expect(location.state.npc_states).toHaveProperty('ireena_kolyana');
      expect(location.state.npc_states).toHaveProperty('kolyan_indirovich');
      expect(location.state).toHaveProperty('burgomaster_dead');
      expect(location.state.burgomaster_dead).toBe(false);
    });

    test('should load metadata object with location name and connections', async () => {
      const location = await locationLoader.loadLocation(locationId);

      expect(location.metadata).toBeDefined();
      expect(location.metadata.location_name).toBe('Village of Barovia');
      expect(location.metadata.location_type).toBe('Settlement');
      expect(location.metadata).toHaveProperty('connected_locations');
      expect(Array.isArray(location.metadata.connected_locations)).toBe(true);
      expect(location.metadata.connected_locations.length).toBeGreaterThanOrEqual(3);
    });

    test('should not throw errors during location load process', async () => {
      await expect(locationLoader.loadLocation(locationId)).resolves.not.toThrow();
    });
  });

  describe('AC-2: Description Token Count Validation', () => {
    test('should have description token count under 2000 tokens', async () => {
      const location = await locationLoader.loadLocation(locationId);

      expect(location.metadata).toHaveProperty('description_token_count');
      expect(location.metadata.description_token_count).toBeLessThan(2000);
    });
  });
});
