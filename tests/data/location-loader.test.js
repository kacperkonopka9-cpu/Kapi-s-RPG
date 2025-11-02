/**
 * Unit tests for LocationLoader
 * Tests all methods with Village of Barovia and edge cases
 * Target: 95% code coverage
 */

const fs = require('fs');
const path = require('path');
const { LocationLoader, LocationNotFoundError, LocationParseError } = require('../../src/data/location-loader');

describe('LocationLoader', () => {
  const testDataDir = path.join(__dirname, 'test-locations');
  const realLocationPath = path.join(process.cwd(), 'game-data', 'locations', 'village-of-barovia');
  let loader;

  beforeEach(() => {
    loader = new LocationLoader();

    // Clean up test locations
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDataDir, { recursive: true });
  });

  afterAll(() => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('Integration Tests - Village of Barovia', () => {
    test('should load Village of Barovia successfully', async () => {
      const locationData = await loader.loadLocation('village-of-barovia');

      // Verify structure
      expect(locationData).toBeDefined();
      expect(locationData.locationId).toBe('village-of-barovia');
      expect(locationData.locationName).toBe('Village of Barovia');

      // Verify description
      expect(locationData.description).toBeTruthy();
      expect(locationData.descriptionVariants).toBeDefined();
      expect(locationData.descriptionVariants.initial).toBeTruthy();
      expect(locationData.descriptionVariants.return).toBeTruthy();

      // Verify NPCs (should have 4: Ireena, Ismark, Mad Mary, Father Donavich)
      expect(Array.isArray(locationData.npcs)).toBe(true);
      expect(locationData.npcs.length).toBeGreaterThanOrEqual(4);

      const ireena = locationData.npcs.find(npc => npc.name.includes('Ireena'));
      expect(ireena).toBeDefined();
      expect(ireena.npcId).toBeTruthy();
      expect(ireena.type).toBeTruthy();
      expect(ireena.dialogue).toBeDefined();
      expect(ireena.stats).toBeDefined();

      // Verify items
      expect(Array.isArray(locationData.items)).toBe(true);

      // Verify events
      expect(Array.isArray(locationData.events)).toBe(true);
      expect(locationData.events.length).toBeGreaterThan(0);

      // Verify state
      expect(locationData.state).toBeDefined();
      expect(locationData.state.locationStatus).toBeTruthy();

      // Verify state.npcPositions is populated correctly
      expect(locationData.state.npcPositions).toBeDefined();
      expect(Object.keys(locationData.state.npcPositions).length).toBeGreaterThanOrEqual(7);
      // Verify at least one known NPC is in positions (Ireena Kolyana -> ireena-kolyana)
      expect(locationData.state.npcPositions).toHaveProperty('ireena-kolyana');

      // Verify state.changesSinceLastVisit is populated
      expect(Array.isArray(locationData.state.changesSinceLastVisit)).toBe(true);
      expect(locationData.state.changesSinceLastVisit.length).toBeGreaterThan(0);

      // Verify state.activeQuests is populated
      expect(Array.isArray(locationData.state.activeQuests)).toBe(true);
      expect(locationData.state.activeQuests.length).toBeGreaterThan(0);

      // Verify metadata with hierarchy
      expect(locationData.metadata).toBeDefined();
      expect(locationData.metadata.parent_location).toBe('barovia-region');
      expect(Array.isArray(locationData.metadata.sub_locations)).toBe(true);
      expect(locationData.metadata.location_level).toBe('settlement');

      // Verify file paths
      expect(locationData.filePaths).toBeDefined();
      expect(locationData.filePaths.description).toBeTruthy();
    });

    test('should load Village of Barovia in under 100ms', async () => {
      const startTime = Date.now();
      await loader.loadLocation('village-of-barovia');
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Error Handling', () => {
    test('should throw LocationNotFoundError for non-existent location', async () => {
      await expect(loader.loadLocation('non-existent-location'))
        .rejects
        .toThrow(LocationNotFoundError);
    });

    test('should throw LocationNotFoundError for file instead of directory', async () => {
      const filePath = path.join(testDataDir, 'not-a-directory.txt');
      fs.writeFileSync(filePath, 'test');

      const testLoader = new LocationLoader(testDataDir);
      await expect(testLoader.loadLocation('not-a-directory.txt'))
        .rejects
        .toThrow(LocationNotFoundError);
    });

    test('should throw LocationParseError for missing files', async () => {
      const locationPath = path.join(testDataDir, 'incomplete-location');
      fs.mkdirSync(locationPath);
      // Only create Description.md, missing others
      fs.writeFileSync(path.join(locationPath, 'Description.md'), '# Test');

      const testLoader = new LocationLoader(testDataDir);
      await expect(testLoader.loadLocation('incomplete-location'))
        .rejects
        .toThrow(LocationParseError);
    });

    test('should throw LocationParseError for malformed YAML in metadata', async () => {
      const locationPath = path.join(testDataDir, 'bad-yaml');
      fs.mkdirSync(locationPath);

      // Create all files
      fs.writeFileSync(path.join(locationPath, 'Description.md'), '# Test\n## Overview\nTest');
      fs.writeFileSync(path.join(locationPath, 'NPCs.md'), '# NPCs');
      fs.writeFileSync(path.join(locationPath, 'Items.md'), '# Items');
      fs.writeFileSync(path.join(locationPath, 'Events.md'), '# Events');
      fs.writeFileSync(path.join(locationPath, 'State.md'), '# State');
      fs.writeFileSync(path.join(locationPath, 'metadata.yaml'), 'invalid: yaml: content:\n  - this is broken');

      const testLoader = new LocationLoader(testDataDir);
      await expect(testLoader.loadLocation('bad-yaml'))
        .rejects
        .toThrow(LocationParseError);
    });

    test('should throw LocationParseError for invalid location_level', async () => {
      const locationPath = path.join(testDataDir, 'invalid-level');
      fs.mkdirSync(locationPath);

      fs.writeFileSync(path.join(locationPath, 'Description.md'), '# Test\n## Overview\nTest');
      fs.writeFileSync(path.join(locationPath, 'NPCs.md'), '# NPCs');
      fs.writeFileSync(path.join(locationPath, 'Items.md'), '# Items');
      fs.writeFileSync(path.join(locationPath, 'Events.md'), '# Events');
      fs.writeFileSync(path.join(locationPath, 'State.md'), '# State');
      fs.writeFileSync(path.join(locationPath, 'metadata.yaml'), 'location_name: "Test"\nlocation_level: "dungeon"');

      const testLoader = new LocationLoader(testDataDir);
      await expect(testLoader.loadLocation('invalid-level'))
        .rejects
        .toThrow(/Invalid location_level/);
    });
  });

  describe('Description Parser', () => {
    test('should parse all description sections', () => {
      const testContent = `# Village
## Overview
This is an overview.

## Initial Description
This is the initial description.

## Return Description
This is the return description.

## Time-Based Variants

### Morning
Morning description here.

### Night
Night description here.

## Points of Interest
- Point 1
- Point 2
`;

      const descPath = path.join(testDataDir, 'test-desc.md');
      fs.writeFileSync(descPath, testContent);

      const result = loader.parseDescriptionFile(descPath);

      expect(result.full).toBe(testContent);
      expect(result.variants.initial).toContain('initial description');
      expect(result.variants.return).toContain('return description');
      expect(result.variants.morning).toContain('Morning description');
      expect(result.variants.night).toContain('Night description');
    });
  });

  describe('NPC Parser', () => {
    test('should parse NPCs with all fields', () => {
      const testContent = `# NPCs

## Ireena Kolyana
- **Type:** Human Noble
- **Age:** 18
- **Gender:** Female
- **Location:** Burgomaster's Mansion
- **Status:** Alive
- **Relationship:** Neutral
- **Quest Connection:** Main Quest

### Description
A young woman with auburn hair.

### Dialogue
- **Initial Greeting:** Hello traveler.
- **Quest Hook:** Please help us.

### Stats
- **AC:** 12
- **HP:** 15
- **CR:** 1

### AI Behavior Notes
Cautious but kind.

## Ismark Kolyanovich
- **Type:** Human Fighter
- **Age:** 25
`;

      const npcPath = path.join(testDataDir, 'test-npcs.md');
      fs.writeFileSync(npcPath, testContent);

      const result = loader.parseNPCsFile(npcPath);

      expect(result.length).toBeGreaterThanOrEqual(2);

      const ireena = result.find(npc => npc.name === 'Ireena Kolyana');
      expect(ireena).toBeDefined();
      expect(ireena.npcId).toBe('ireena-kolyana');
      expect(ireena.type).toBe('Human Noble');
      expect(ireena.age).toBe(18);
      expect(ireena.gender).toBe('Female');
      expect(ireena.status).toBe('Alive');
      expect(ireena.dialogue.initialGreeting).toContain('Hello traveler');
      expect(ireena.stats.ac).toBe(12);
      expect(ireena.stats.hp).toBe(15);
    });
  });

  describe('Items Parser', () => {
    test('should parse available and hidden items', () => {
      const testContent = `# Items

## Available Items
- **Torch:** 1 gp - A basic torch
- **Rope (50 ft):** 1 gp

## Hidden Items (Requires Investigation)
- **Silver Dagger:** DC 15 - Hidden under the floorboards, 5 gp value
`;

      const itemsPath = path.join(testDataDir, 'test-items.md');
      fs.writeFileSync(itemsPath, testContent);

      const result = loader.parseItemsFile(itemsPath);

      expect(result.length).toBeGreaterThanOrEqual(3);

      const torch = result.find(item => item.name === 'Torch');
      expect(torch).toBeDefined();
      expect(torch.category).toBe('available');
      expect(torch.hidden).toBe(false);
      expect(torch.price).toContain('gp');

      const dagger = result.find(item => item.name === 'Silver Dagger');
      expect(dagger).toBeDefined();
      expect(dagger.category).toBe('hidden');
      expect(dagger.hidden).toBe(true);
      expect(dagger.dc).toBe(15);
    });
  });

  describe('Events Parser', () => {
    test('should parse scheduled, conditional, and recurring events', () => {
      const testContent = `# Events

## Scheduled Events

### Death of the Burgomaster
- **Trigger:** Day 1, Evening
- **Effect:** The burgomaster dies
- **Consequence:** Village in mourning

## Conditional Events

### Strahd Appears
- **Trigger:** If Ireena leaves the village
- **Effect:** Strahd confronts the party

## Recurring Events

### Morning Fog
- **Trigger:** Every morning
- **Effect:** Thick fog rolls in
`;

      const eventsPath = path.join(testDataDir, 'test-events.md');
      fs.writeFileSync(eventsPath, testContent);

      const result = loader.parseEventsFile(eventsPath);

      expect(result.length).toBeGreaterThanOrEqual(3);

      const death = result.find(e => e.name === 'Death of the Burgomaster');
      expect(death).toBeDefined();
      expect(death.type).toBe('scheduled');
      expect(death.trigger).toContain('Day 1');

      const strahd = result.find(e => e.name === 'Strahd Appears');
      expect(strahd).toBeDefined();
      expect(strahd.type).toBe('conditional');

      const fog = result.find(e => e.name === 'Morning Fog');
      expect(fog).toBeDefined();
      expect(fog.type).toBe('recurring');
    });
  });

  describe('State Parser', () => {
    test('should parse location state', () => {
      const testContent = `# State

## Last Updated
2024-03-10

## Current Date
Barovian Calendar: Day 3

## Current Time
Evening

## Weather
Overcast and gloomy

## Location Status
Normal

## Changes Since Last Visit
- The burgomaster has died
- Fog has thickened

## NPC Positions
- ireena: burgomaster-mansion
- ismark: burgomaster-mansion

## Active Quests
- protect-ireena
`;

      const statePath = path.join(testDataDir, 'test-state.md');
      fs.writeFileSync(statePath, testContent);

      const result = loader.parseStateFile(statePath);

      expect(result).toBeDefined();
      expect(result.weather).toContain('Overcast');
      expect(result.locationStatus).toContain('Normal');
      expect(result.changesSinceLastVisit.length).toBeGreaterThan(0);
      expect(result.npcPositions.ireena).toContain('mansion');
      expect(result.activeQuests.length).toBeGreaterThan(0);
    });
  });

  describe('Metadata Parser', () => {
    test('should parse metadata with hierarchy fields', () => {
      const testContent = `location_name: "Test Village"
location_type: "Settlement"
region: "Test Region"
population: 100
danger_level: 2
recommended_level: "1-3"
parent_location: "test-region"
sub_locations:
  - "test-tavern"
  - "test-inn"
location_level: "settlement"
connected_locations:
  - name: "Test City"
    direction: "North"
    travel_time: "2 hours"
`;

      const metadataPath = path.join(testDataDir, 'test-metadata.yaml');
      fs.writeFileSync(metadataPath, testContent);

      const result = loader.parseMetadataFile(metadataPath);

      expect(result).toBeDefined();
      expect(result.location_name).toBe('Test Village');
      expect(result.location_type).toBe('Settlement');
      expect(result.parent_location).toBe('test-region');
      expect(result.sub_locations).toEqual(['test-tavern', 'test-inn']);
      expect(result.location_level).toBe('settlement');
      expect(result.connected_locations.length).toBe(1);
      expect(result.connected_locations[0].name).toBe('Test City');
    });
  });

  describe('validateLocation()', () => {
    test('should validate Village of Barovia successfully', async () => {
      const result = await loader.validateLocation('village-of-barovia');

      expect(result.isValid()).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.success.length).toBeGreaterThan(10);
    });

    test('should detect missing location', async () => {
      const result = await loader.validateLocation('non-existent');

      expect(result.isValid()).toBe(false);
      expect(result.errors).toContain('Location folder not found: non-existent');
    });

    test('should detect missing files', async () => {
      const locationPath = path.join(testDataDir, 'incomplete');
      fs.mkdirSync(locationPath);
      fs.writeFileSync(path.join(locationPath, 'Description.md'), 'test');

      const testLoader = new LocationLoader(testDataDir);
      const result = await testLoader.validateLocation('incomplete');

      expect(result.isValid()).toBe(false);
      expect(result.errors.some(e => e.includes('Missing required file'))).toBe(true);
    });
  });

  describe('listLocations()', () => {
    test('should list Village of Barovia', async () => {
      const locations = await loader.listLocations();

      expect(Array.isArray(locations)).toBe(true);
      expect(locations).toContain('village-of-barovia');
    });

    test('should only list directories with all required files', async () => {
      const incompleteLocation = path.join(testDataDir, 'incomplete');
      fs.mkdirSync(incompleteLocation);
      fs.writeFileSync(path.join(incompleteLocation, 'Description.md'), 'test');

      const testLoader = new LocationLoader(testDataDir);
      const locations = await testLoader.listLocations();

      expect(locations).not.toContain('incomplete');
    });
  });

  describe('Cache Behavior', () => {
    test('should cache loaded locations', async () => {
      const firstLoad = await loader.loadLocation('village-of-barovia');
      const secondLoad = await loader.loadLocation('village-of-barovia');

      // Should be the same object reference (cached)
      expect(firstLoad).toBe(secondLoad);
    });

    test('should reload location when reloadLocation() is called', async () => {
      const firstLoad = await loader.loadLocation('village-of-barovia');
      const reloaded = await loader.reloadLocation('village-of-barovia');

      // Should be different object references (cache invalidated)
      expect(firstLoad).not.toBe(reloaded);

      // But content should be equivalent
      expect(reloaded.locationId).toBe(firstLoad.locationId);
      expect(reloaded.locationName).toBe(firstLoad.locationName);
    });
  });

  describe('Helper Methods', () => {
    test('generateId() should create kebab-case IDs', () => {
      expect(loader.generateId('Ireena Kolyana')).toBe('ireena-kolyana');
      expect(loader.generateId('Mad Mary')).toBe('mad-mary');
      expect(loader.generateId('Father Donavich')).toBe('father-donavich');
      expect(loader.generateId('Test Item #1')).toBe('test-item-1');
    });

    test('extractList() should parse bullet lists', () => {
      const content = `- Item 1\n- Item 2\n- Item 3`;
      const result = loader.extractList(content);

      expect(result).toEqual(['Item 1', 'Item 2', 'Item 3']);
    });
  });
});
