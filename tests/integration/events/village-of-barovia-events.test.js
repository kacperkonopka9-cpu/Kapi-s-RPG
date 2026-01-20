/**
 * Integration Tests for Village of Barovia Events
 * Tests Epic 2 EventScheduler integration with Village of Barovia events
 *
 * Story: 4-1-village-of-barovia-location
 * AC-9: Epic 2 EventScheduler Integration
 */

const path = require('path');
const fs = require('fs').promises;
const yaml = require('js-yaml');

describe('Village of Barovia - Event Schema Integration', () => {
  let eventsData;
  const eventsPath = path.join(process.cwd(), 'game-data', 'locations', 'village-of-barovia', 'Events.md');

  beforeAll(async () => {
    const eventsContent = await fs.readFile(eventsPath, 'utf-8');
    // Parse YAML from Events.md
    const yamlMatch = eventsContent.match(/events:([\s\S]+)/);
    if (yamlMatch) {
      eventsData = yaml.load('events:' + yamlMatch[1]);
    }
  });

  describe('AC-9: Event Schema Validation', () => {
    test('should load Events.md successfully', () => {
      expect(eventsData).toBeDefined();
      expect(eventsData.events).toBeDefined();
      expect(Array.isArray(eventsData.events)).toBe(true);
    });

    test('should have at least 3 events defined', () => {
      expect(eventsData.events.length).toBeGreaterThanOrEqual(3);
    });

    test('all events should have required Epic 2 EventScheduler schema fields', () => {
      eventsData.events.forEach(event => {
        expect(event).toHaveProperty('eventId');
        expect(event).toHaveProperty('name');
        expect(event).toHaveProperty('trigger_type');
        expect(['date_time', 'conditional']).toContain(event.trigger_type);
        expect(event).toHaveProperty('effects');
        expect(Array.isArray(event.effects)).toBe(true);
      });
    });

    test('"Kolyan Death" event should have date_time trigger', () => {
      const kolyanEvent = eventsData.events.find(e => e.eventId === 'kolyan_indirovich_death');

      expect(kolyanEvent).toBeDefined();
      expect(kolyanEvent.trigger_type).toBe('date_time');
      expect(kolyanEvent.trigger_date).toBe('735-10-3T06:00:00Z');
      expect(kolyanEvent.effects).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'npc_status' }),
        expect.objectContaining({ type: 'state_update' })
      ]));
    });

    test('"Strahd Awareness" event should have conditional trigger', () => {
      const strahdEvent = eventsData.events.find(e => e.eventId === 'strahd_becomes_aware_of_ireena');

      expect(strahdEvent).toBeDefined();
      expect(strahdEvent.trigger_type).toBe('conditional');
      expect(strahdEvent.trigger_conditions).toBeDefined();
      expect(strahdEvent.trigger_conditions).toHaveProperty('ireena_in_party');
      expect(strahdEvent.effects).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'quest_trigger' }),
        expect.objectContaining({ type: 'state_update' })
      ]));
    });

    test('"Dire Wolf Attack" event should have combat_encounter effect', () => {
      const wolfEvent = eventsData.events.find(e => e.eventId === 'dire_wolf_night_attack');

      expect(wolfEvent).toBeDefined();
      expect(wolfEvent.trigger_type).toBe('conditional');
      expect(wolfEvent.effects).toEqual(expect.arrayContaining([
        expect.objectContaining({
          type: 'combat_encounter',
          encounterId: 'dire_wolves_pack'
        })
      ]));
    });

    test('all effects should have valid Epic 2 effect types', () => {
      const validEffectTypes = ['npc_status', 'state_update', 'quest_trigger', 'combat_encounter', 'custom'];

      eventsData.events.forEach(event => {
        event.effects.forEach(effect => {
          expect(effect).toHaveProperty('type');
          expect(validEffectTypes).toContain(effect.type);
        });
      });
    });

    test('date_time triggers should have valid ISO format dates', () => {
      const dateEvents = eventsData.events.filter(e => e.trigger_type === 'date_time');

      dateEvents.forEach(event => {
        expect(event.trigger_date).toBeDefined();
        // Validate ISO-ish date format (flexible for Barovian calendar years like 735)
        expect(event.trigger_date).toMatch(/^\d+-\d{2}-\d+T\d{2}:\d{2}:\d{2}Z$/);
      });
    });

    test('conditional triggers should have trigger_conditions object', () => {
      const conditionalEvents = eventsData.events.filter(e => e.trigger_type === 'conditional');

      conditionalEvents.forEach(event => {
        expect(event.trigger_conditions).toBeDefined();
        expect(typeof event.trigger_conditions).toBe('object');
      });
    });
  });
});
