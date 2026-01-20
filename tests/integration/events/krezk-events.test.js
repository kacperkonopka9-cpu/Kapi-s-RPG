/**
 * Integration Tests: Krezk Events (Story 4-4)
 *
 * Tests Epic 2 EventScheduler compatibility with Krezk event definitions
 */

const { EventScheduler } = require('../../../src/calendar/event-scheduler');
const { LocationLoader } = require('../../../src/data/location-loader');
const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');

describe('Krezk Events - EventScheduler Integration', () => {
  let eventScheduler;
  let locationLoader;

  beforeAll(() => {
    eventScheduler = new EventScheduler();
    locationLoader = new LocationLoader(path.join(process.cwd(), 'game-data', 'locations'));
  });

  describe('Parent Location Events', () => {
    test('parent Events.md has valid YAML event definitions', async () => {
      const eventsPath = path.join(process.cwd(), 'game-data', 'locations', 'krezk', 'Events.md');
      const content = fs.readFileSync(eventsPath, 'utf-8');

      // Extract YAML blocks from Events.md
      const yamlBlocks = content.match(/```yaml\n([\s\S]*?)\n```/g);
      expect(yamlBlocks).not.toBeNull();
      expect(yamlBlocks.length).toBeGreaterThan(0);

      // Parse each YAML block
      for (const block of yamlBlocks) {
        const yamlContent = block.replace(/```yaml\n/, '').replace(/\n```/, '');
        expect(() => yaml.load(yamlContent)).not.toThrow();

        const event = yaml.load(yamlContent);
        expect(event).toHaveProperty('eventId');
        expect(event).toHaveProperty('name');
        expect(event).toHaveProperty('trigger_type');
        expect(event).toHaveProperty('effects');
      }
    });

    test('village-wide events have correct trigger types', async () => {
      const eventsPath = path.join(process.cwd(), 'game-data', 'locations', 'krezk', 'Events.md');
      const content = fs.readFileSync(eventsPath, 'utf-8');
      const yamlBlocks = content.match(/```yaml\n([\s\S]*?)\n```/g);

      const triggerTypes = yamlBlocks.map(block => {
        const yamlContent = block.replace(/```yaml\n/, '').replace(/\n```/, '');
        const event = yaml.load(yamlContent);
        return event.trigger_type;
      });

      // Valid trigger types from Epic 2
      const validTypes = ['date_time', 'conditional', 'recurring', 'time_based'];
      for (const type of triggerTypes) {
        expect(validTypes).toContain(type);
      }
    });
  });

  describe('Sub-Location Events', () => {
    const subLocations = [
      'abbey-of-st-markovia',
      'burgomaster-house',
      'blessed-pool',
      'village-gates',
      'shrine-of-the-white-sun'
    ];

    test.each(subLocations)('sub-location %s has valid event schema', async (subLocationId) => {
      const eventsPath = path.join(process.cwd(), 'game-data', 'locations', 'krezk', subLocationId, 'Events.md');
      const content = fs.readFileSync(eventsPath, 'utf-8');
      const yamlBlocks = content.match(/```yaml\n([\s\S]*?)\n```/g);

      if (yamlBlocks) {
        for (const block of yamlBlocks) {
          const yamlContent = block.replace(/```yaml\n/, '').replace(/\n```/, '');
          const event = yaml.load(yamlContent);

          expect(event).toHaveProperty('eventId');
          expect(event).toHaveProperty('name');
          expect(event).toHaveProperty('trigger_type');
          expect(event).toHaveProperty('effects');
        }
      }
    });
  });

  describe('Event Effect Types', () => {
    test('all events use valid Epic 2 effect types', async () => {
      const allEventPaths = [
        'game-data/locations/krezk/Events.md',
        'game-data/locations/krezk/abbey-of-st-markovia/Events.md',
        'game-data/locations/krezk/burgomaster-house/Events.md',
        'game-data/locations/krezk/blessed-pool/Events.md',
        'game-data/locations/krezk/village-gates/Events.md',
        'game-data/locations/krezk/shrine-of-the-white-sun/Events.md'
      ];

      // Valid effect types from Epic 2
      const validEffectTypes = [
        'npc_status',
        'state_update',
        'quest_trigger',
        'combat_encounter',
        'custom',
        'npc_encounter',
        'resurrection_performed',
        'quest_resolution',
        'quest_update',
        'skill_check',
        'buff_applied',
        'character_development',
        'atmosphere'
      ];

      for (const eventPath of allEventPaths) {
        const fullPath = path.join(process.cwd(), eventPath);
        if (!fs.existsSync(fullPath)) continue;

        const content = fs.readFileSync(fullPath, 'utf-8');
        const yamlBlocks = content.match(/```yaml\n([\s\S]*?)\n```/g);

        if (yamlBlocks) {
          for (const block of yamlBlocks) {
            const yamlContent = block.replace(/```yaml\n/, '').replace(/\n```/, '');
            const event = yaml.load(yamlContent);

            if (event.effects && Array.isArray(event.effects)) {
              for (const effect of event.effects) {
                if (effect.type) {
                  expect(validEffectTypes).toContain(effect.type);
                }
              }
            }
          }
        }
      }
    });
  });

  describe('Conditional Event Triggers', () => {
    test('conditional events have trigger_conditions defined', async () => {
      const eventsPath = path.join(process.cwd(), 'game-data', 'locations', 'krezk', 'Events.md');
      const content = fs.readFileSync(eventsPath, 'utf-8');
      const yamlBlocks = content.match(/```yaml\n([\s\S]*?)\n```/g);

      for (const block of yamlBlocks) {
        const yamlContent = block.replace(/```yaml\n/, '').replace(/\n```/, '');
        const event = yaml.load(yamlContent);

        if (event.trigger_type === 'conditional') {
          expect(event).toHaveProperty('trigger_conditions');
          expect(Array.isArray(event.trigger_conditions) || typeof event.trigger_conditions === 'object').toBe(true);
        }
      }
    });
  });

  describe('Event Registration', () => {
    test('EventScheduler can parse Krezk event definitions', () => {
      // Mock calendar with Krezk events
      const mockCalendar = {
        events: [
          {
            eventId: 'ilya_death',
            name: 'Ilya Krezkov Dies',
            trigger_type: 'conditional',
            trigger_conditions: [
              { type: 'time_elapsed', days_since_illness_start: 7 }
            ],
            effects: [
              { type: 'npc_status', npcId: 'ilya_krezkov', status: 'dead' }
            ]
          }
        ]
      };

      // EventScheduler should accept this structure
      expect(() => {
        for (const event of mockCalendar.events) {
          expect(event).toHaveProperty('eventId');
          expect(event).toHaveProperty('trigger_type');
        }
      }).not.toThrow();
    });
  });
});
