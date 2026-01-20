/**
 * Integration Tests: Batch 2 Events (Story 4-6)
 *
 * Tests event definitions in Batch 2 locations for Epic 2 compatibility
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

describe('Batch 2 Events - Epic 2 Schema Compliance', () => {
  const batch2Locations = [
    'tsolenka-pass',
    'amber-temple',
    'yester-hill',
    'argynvostholt',
    'berez',
    'lake-zarovich'
  ];

  describe('Event File Structure', () => {
    test.each(batch2Locations)('%s Events.md exists and is readable', async (locationId) => {
      const eventsPath = path.join(
        process.cwd(),
        'game-data',
        'locations',
        locationId,
        'Events.md'
      );

      await expect(fs.access(eventsPath)).resolves.not.toThrow();
      const content = await fs.readFile(eventsPath, 'utf-8');
      expect(content.length).toBeGreaterThan(100);
    });
  });

  describe('Event Schema Validation', () => {
    test.each(batch2Locations)('%s events contain required fields', async (locationId) => {
      const eventsPath = path.join(
        process.cwd(),
        'game-data',
        'locations',
        locationId,
        'Events.md'
      );
      const content = await fs.readFile(eventsPath, 'utf-8');

      // Extract YAML blocks from markdown
      const yamlBlocks = content.match(/```yaml\n([\s\S]*?)\n```/g) || [];
      expect(yamlBlocks.length).toBeGreaterThan(0);

      // Parse and validate each YAML block
      yamlBlocks.forEach(block => {
        const yamlContent = block.replace(/```yaml\n/, '').replace(/\n```/, '');
        const event = yaml.load(yamlContent);

        // Required fields
        expect(event.eventId).toBeDefined();
        expect(typeof event.eventId).toBe('string');

        expect(event.name).toBeDefined();
        expect(typeof event.name).toBe('string');

        expect(event.trigger_type).toBeDefined();
        expect(['date_time', 'conditional', 'recurring', 'location']).toContain(event.trigger_type);

        expect(event.effects).toBeDefined();
        expect(Array.isArray(event.effects)).toBe(true);
      });
    });

    test.each(batch2Locations)('%s events have valid effect types', async (locationId) => {
      const eventsPath = path.join(
        process.cwd(),
        'game-data',
        'locations',
        locationId,
        'Events.md'
      );
      const content = await fs.readFile(eventsPath, 'utf-8');

      const yamlBlocks = content.match(/```yaml\n([\s\S]*?)\n```/g) || [];

      const validEffectTypes = [
        'npc_status',
        'state_update',
        'combat_encounter',
        'quest_trigger',
        'custom',
        'atmosphere',
        'npc_encounter',
        'quest_resolution',
        'npc_location_change',
        'social_opportunity',
        'game_flag_set',
        'faction_alliance',
        'damage',
        'skill_check_required',
        'quest_item_obtained',
        'affliction',
        'reinforcements',
        'items_available',
        'potential_combat'
      ];

      yamlBlocks.forEach(block => {
        const yamlContent = block.replace(/```yaml\n/, '').replace(/\n```/, '');
        const event = yaml.load(yamlContent);

        if (event.effects) {
          event.effects.forEach(effect => {
            expect(effect.type).toBeDefined();
            expect(validEffectTypes).toContain(effect.type);
          });
        }
      });
    });
  });

  describe('Quest-Critical Events', () => {
    test('Tsolenka Pass has Roc attack event', async () => {
      const eventsPath = path.join(
        process.cwd(),
        'game-data',
        'locations',
        'tsolenka-pass',
        'Events.md'
      );
      const content = await fs.readFile(eventsPath, 'utf-8');

      expect(content).toMatch(/roc_attacks_party/);
      expect(content).toMatch(/Roc Attack/);
    });

    test('Amber Temple has dark gift temptation events', async () => {
      const eventsPath = path.join(
        process.cwd(),
        'game-data',
        'locations',
        'amber-temple',
        'Events.md'
      );
      const content = await fs.readFile(eventsPath, 'utf-8');

      expect(content).toMatch(/vestige_temptation/);
      expect(content).toMatch(/dark.*gift/i);
      expect(content).toMatch(/exethanter/i);
    });

    test('Yester Hill has Wintersplinter awakening event', async () => {
      const eventsPath = path.join(
        process.cwd(),
        'game-data',
        'locations',
        'yester-hill',
        'Events.md'
      );
      const content = await fs.readFile(eventsPath, 'utf-8');

      expect(content).toMatch(/wintersplinter_awakening/);
      expect(content).toMatch(/winery_gem/i);
    });

    test('Argynvostholt has beacon lighting event', async () => {
      const eventsPath = path.join(
        process.cwd(),
        'game-data',
        'locations',
        'argynvostholt',
        'Events.md'
      );
      const content = await fs.readFile(eventsPath, 'utf-8');

      expect(content).toMatch(/light.*beacon/i);
      expect(content).toMatch(/vladimir.*horngaard/i);
    });

    test('Berez has Baba Lysaga boss fight', async () => {
      const eventsPath = path.join(
        process.cwd(),
        'game-data',
        'locations',
        'berez',
        'Events.md'
      );
      const content = await fs.readFile(eventsPath, 'utf-8');

      expect(content).toMatch(/baba_lysaga_battle/);
      expect(content).toMatch(/winery.*gem/i);
    });

    test('Lake Zarovich has Arabelle rescue event', async () => {
      const eventsPath = path.join(
        process.cwd(),
        'game-data',
        'locations',
        'lake-zarovich',
        'Events.md'
      );
      const content = await fs.readFile(eventsPath, 'utf-8');

      expect(content).toMatch(/rescue_arabelle/);
      expect(content).toMatch(/bluto/i);
    });
  });

  describe('Event Consequences Documentation', () => {
    test.each(batch2Locations)('%s events document consequences', async (locationId) => {
      const eventsPath = path.join(
        process.cwd(),
        'game-data',
        'locations',
        locationId,
        'Events.md'
      );
      const content = await fs.readFile(eventsPath, 'utf-8');

      // Check that events have consequence sections
      const consequenceMatches = content.match(/\*\*Consequences\*\*:/g) || [];
      expect(consequenceMatches.length).toBeGreaterThan(0);
    });
  });

  describe('Epic 2 Integration Notes', () => {
    test.each(batch2Locations)('%s has Epic 2 integration notes section', async (locationId) => {
      const eventsPath = path.join(
        process.cwd(),
        'game-data',
        'locations',
        locationId,
        'Events.md'
      );
      const content = await fs.readFile(eventsPath, 'utf-8');

      expect(content).toMatch(/Notes for Epic 2 Integration/);
      expect(content).toMatch(/EventScheduler/);
    });
  });
});
