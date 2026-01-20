/**
 * Integration Tests: Batch 1 Events (Story 4-5)
 *
 * Tests event definitions in Batch 1 locations for Epic 2 compatibility
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

describe('Batch 1 Events - Epic 2 Schema Compliance', () => {
  const batch1Locations = [
    'death-house',
    'tser-pool-encampment',
    'old-bonegrinder',
    'wizard-of-wines',
    'van-richtens-tower',
    'werewolf-den'
  ];

  describe('Event File Structure', () => {
    test.each(batch1Locations)('%s Events.md exists and is readable', async (locationId) => {
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
    test.each(batch1Locations)('%s events contain required fields', async (locationId) => {
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

    test.each(batch1Locations)('%s events have valid effect types', async (locationId) => {
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
    test('Tser Pool has Tarokka Reading event', async () => {
      const eventsPath = path.join(
        process.cwd(),
        'game-data',
        'locations',
        'tser-pool-encampment',
        'Events.md'
      );
      const content = await fs.readFile(eventsPath, 'utf-8');

      expect(content).toMatch(/madam_eva_tarokka_reading/);
      expect(content).toMatch(/Tarokka Reading/);
    });

    test('Old Bonegrinder has Hag Coven events', async () => {
      const eventsPath = path.join(
        process.cwd(),
        'game-data',
        'locations',
        'old-bonegrinder',
        'Events.md'
      );
      const content = await fs.readFile(eventsPath, 'utf-8');

      expect(content).toMatch(/hag_coven_battle/);
      expect(content).toMatch(/morgantha/);
    });

    test('Wizard of Wines has siege and gem recovery events', async () => {
      const eventsPath = path.join(
        process.cwd(),
        'game-data',
        'locations',
        'wizard-of-wines',
        'Events.md'
      );
      const content = await fs.readFile(eventsPath, 'utf-8');

      expect(content).toMatch(/winery_siege/);
      expect(content).toMatch(/gem.*recovery/i);
      expect(content).toMatch(/keepers.*feather/i);
    });

    test('Werewolf Den has Emil/Kiril leadership challenge', async () => {
      const eventsPath = path.join(
        process.cwd(),
        'game-data',
        'locations',
        'werewolf-den',
        'Events.md'
      );
      const content = await fs.readFile(eventsPath, 'utf-8');

      expect(content).toMatch(/leadership_challenge/);
      expect(content).toMatch(/emil.*toranescu/i);
      expect(content).toMatch(/kiril/i);
    });
  });

  describe('Event Consequences Documentation', () => {
    test.each(batch1Locations)('%s events document consequences', async (locationId) => {
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
    test.each(batch1Locations)('%s has Epic 2 integration notes section', async (locationId) => {
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
      expect(content).toMatch(/StateManager/);
    });
  });
});
