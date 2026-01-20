/**
 * Integration Tests for Castle Ravenloft Events
 * Tests Epic 2 EventScheduler integration with Castle Ravenloft events
 *
 * Story: 4-2-castle-ravenloft-structure
 * AC-11: Epic 2 EventScheduler Integration
 */

const path = require('path');
const fs = require('fs').promises;
const yaml = require('js-yaml');

describe('Castle Ravenloft - Event Schema Integration', () => {
  let parentEventsData;
  let entranceEventsData;
  let chapelEventsData;

  const parentEventsPath = path.join(process.cwd(), 'game-data', 'locations', 'castle-ravenloft', 'Events.md');
  const entranceEventsPath = path.join(process.cwd(), 'game-data', 'locations', 'castle-ravenloft', 'entrance', 'Events.md');
  const chapelEventsPath = path.join(process.cwd(), 'game-data', 'locations', 'castle-ravenloft', 'chapel', 'Events.md');

  beforeAll(async () => {
    // Load parent events
    const parentContent = await fs.readFile(parentEventsPath, 'utf-8');
    const parentYamlMatch = parentContent.match(/events:([\s\S]+)/);
    if (parentYamlMatch) {
      parentEventsData = yaml.load('events:' + parentYamlMatch[1]);
    }

    // Load entrance sub-location events
    const entranceContent = await fs.readFile(entranceEventsPath, 'utf-8');
    const entranceYamlMatch = entranceContent.match(/events:([\s\S]+)/);
    if (entranceYamlMatch) {
      entranceEventsData = yaml.load('events:' + entranceYamlMatch[1]);
    }

    // Load chapel sub-location events
    const chapelContent = await fs.readFile(chapelEventsPath, 'utf-8');
    const chapelYamlMatch = chapelContent.match(/events:([\s\S]+)/);
    if (chapelYamlMatch) {
      chapelEventsData = yaml.load('events:' + chapelYamlMatch[1]);
    }
  });

  describe('AC-11: Parent Location Events', () => {
    test('should load parent Events.md successfully', () => {
      expect(parentEventsData).toBeDefined();
      expect(parentEventsData.events).toBeDefined();
      expect(Array.isArray(parentEventsData.events)).toBe(true);
    });

    test('parent should have at least 5 castle-wide events', () => {
      expect(parentEventsData.events.length).toBeGreaterThanOrEqual(5);
    });

    test('all parent events should have required Epic 2 EventScheduler schema fields', () => {
      parentEventsData.events.forEach(event => {
        expect(event).toHaveProperty('eventId');
        expect(event).toHaveProperty('name');
        expect(event).toHaveProperty('trigger_type');
        expect(['date_time', 'conditional', 'location_entry']).toContain(event.trigger_type);
        expect(event).toHaveProperty('effects');
        expect(Array.isArray(event.effects)).toBe(true);
      });
    });

    test('"Strahd Arrives" event should have conditional trigger and state_update effect', () => {
      const strahdEvent = parentEventsData.events.find(e => e.eventId === 'strahd_arrives');

      expect(strahdEvent).toBeDefined();
      expect(strahdEvent.name).toContain('Strahd Arrives');
      expect(strahdEvent.trigger_type).toBe('conditional');
      expect(strahdEvent.trigger_conditions).toBeDefined();
      expect(strahdEvent.trigger_conditions).toHaveProperty('party_in_castle');
      expect(strahdEvent.effects).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'custom' }),
        expect.objectContaining({ type: 'state_update' })
      ]));
    });

    test('"Lair Actions" event should validate correctly', () => {
      const lairEvent = parentEventsData.events.find(e => e.eventId === 'lair_actions_activate');

      expect(lairEvent).toBeDefined();
      expect(lairEvent.name).toContain('Lair Actions');
      expect(lairEvent.trigger_type).toBe('conditional');
      expect(lairEvent.trigger_conditions).toBeDefined();
      expect(lairEvent.trigger_conditions).toHaveProperty('combat_active');
      expect(lairEvent.trigger_conditions).toHaveProperty('strahd_in_combat');
      expect(lairEvent.effects).toBeDefined();
    });

    test('"Heart of Sorrow" event should have damage absorption mechanics', () => {
      const heartEvent = parentEventsData.events.find(e => e.eventId === 'heart_of_sorrow_absorption');

      expect(heartEvent).toBeDefined();
      expect(heartEvent.trigger_type).toBe('conditional');
      expect(heartEvent.trigger_conditions).toHaveProperty('strahd_takes_damage');
      expect(heartEvent.trigger_conditions).toHaveProperty('heart_of_sorrow_destroyed', false);
      expect(heartEvent.effects).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'state_update' }),
        expect.objectContaining({ type: 'custom' })
      ]));
    });
  });

  describe('AC-11: Sub-Location Events (Entrance)', () => {
    test('should load entrance Events.md successfully', () => {
      expect(entranceEventsData).toBeDefined();
      expect(entranceEventsData.events).toBeDefined();
      expect(Array.isArray(entranceEventsData.events)).toBe(true);
    });

    test('entrance should have at least 3 location-specific events', () => {
      expect(entranceEventsData.events.length).toBeGreaterThanOrEqual(3);
    });

    test('entrance events should conform to Epic 2 schema', () => {
      entranceEventsData.events.forEach(event => {
        expect(event).toHaveProperty('eventId');
        expect(event).toHaveProperty('name');
        expect(event).toHaveProperty('trigger_type');
        expect(event).toHaveProperty('effects');
        expect(Array.isArray(event.effects)).toBe(true);
      });
    });

    test('"Gargoyles Activate" event should have combat_encounter effect', () => {
      const gargoyleEvent = entranceEventsData.events.find(e => e.eventId === 'entrance_gargoyles_activate');

      expect(gargoyleEvent).toBeDefined();
      expect(gargoyleEvent.trigger_type).toBe('conditional');
      expect(gargoyleEvent.effects).toEqual(expect.arrayContaining([
        expect.objectContaining({
          type: 'combat_encounter',
          monsters: expect.arrayContaining([
            expect.objectContaining({ type: 'gargoyle', cr: 2 })
          ])
        })
      ]));
    });

    test('"Nightmare Defense" event should alert Strahd', () => {
      const nightmareEvent = entranceEventsData.events.find(e => e.eventId === 'entrance_nightmare_defense');

      expect(nightmareEvent).toBeDefined();
      expect(nightmareEvent.trigger_conditions).toHaveProperty('strahd_carriage_touched');
      expect(nightmareEvent.effects).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'combat_encounter' }),
        expect.objectContaining({
          type: 'state_update',
          stateChanges: expect.objectContaining({ strahd_aware_of_party: true })
        })
      ]));
    });
  });

  describe('AC-11: Sub-Location Events (Chapel)', () => {
    test('should load chapel Events.md successfully', () => {
      expect(chapelEventsData).toBeDefined();
      expect(chapelEventsData.events).toBeDefined();
      expect(Array.isArray(chapelEventsData.events)).toBe(true);
    });

    test('chapel should have at least 5 location-specific events', () => {
      expect(chapelEventsData.events.length).toBeGreaterThanOrEqual(5);
    });

    test('"Wraith Guardians" event should activate when tombs disturbed', () => {
      const wraithEvent = chapelEventsData.events.find(e => e.eventId === 'chapel_tombs_disturbed');

      expect(wraithEvent).toBeDefined();
      expect(wraithEvent.trigger_type).toBe('conditional');
      expect(wraithEvent.trigger_conditions).toHaveProperty('tomb_touched_or_moved');
      expect(wraithEvent.effects).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'narrative' }),
        expect.objectContaining({
          type: 'combat_encounter',
          monsters: expect.arrayContaining([
            expect.objectContaining({ type: 'wraith', count: 2, cr: 5 })
          ])
        })
      ]));
    });

    test('"Consecration Ritual" event should have complex effects', () => {
      const consEvent = chapelEventsData.events.find(e => e.eventId === 'chapel_consecration_ritual');

      expect(consEvent).toBeDefined();
      expect(consEvent.trigger_type).toBe('conditional');
      expect(consEvent.trigger_conditions).toBeDefined();
      expect(consEvent.effects).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'custom' }),
        expect.objectContaining({ type: 'saving_throw' }),
        expect.objectContaining({ type: 'state_update' })
      ]));
    });

    test('"Holy Symbol Found" event should trigger quest update', () => {
      const symbolEvent = chapelEventsData.events.find(e => e.eventId === 'chapel_holy_symbol_discovered');

      expect(symbolEvent).toBeDefined();
      expect(symbolEvent.effects).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'item_found', itemId: 'holy_symbol_of_ravenkind' }),
        expect.objectContaining({ type: 'quest_trigger', questId: 'legendary_artifacts' })
      ]));
    });
  });

  describe('AC-11: Event Schema Compliance', () => {
    test('all events across all locations should use consistent effect types', () => {
      const allEvents = [
        ...parentEventsData.events,
        ...entranceEventsData.events,
        ...chapelEventsData.events
      ];

      const validEffectTypes = [
        'combat_encounter',
        'state_update',
        'quest_trigger',
        'npc_status',
        'item_found',
        'custom',
        'narrative',
        'saving_throw',
        'damage'
      ];

      allEvents.forEach(event => {
        event.effects.forEach(effect => {
          expect(validEffectTypes).toContain(effect.type);
        });
      });
    });

    test('conditional events should have trigger_conditions object', () => {
      const allEvents = [
        ...parentEventsData.events,
        ...entranceEventsData.events,
        ...chapelEventsData.events
      ];

      const conditionalEvents = allEvents.filter(e => e.trigger_type === 'conditional');

      conditionalEvents.forEach(event => {
        expect(event).toHaveProperty('trigger_conditions');
        expect(typeof event.trigger_conditions).toBe('object');
      });
    });

    test('combat_encounter effects should have required fields', () => {
      const allEvents = [
        ...parentEventsData.events,
        ...entranceEventsData.events,
        ...chapelEventsData.events
      ];

      allEvents.forEach(event => {
        const combatEffects = event.effects.filter(e => e.type === 'combat_encounter');

        combatEffects.forEach(effect => {
          // Combat encounters must have EITHER monsters array OR encounterId
          const hasMonsters = effect.monsters && Array.isArray(effect.monsters);
          const hasEncounterId = effect.encounterId;

          expect(hasMonsters || hasEncounterId).toBe(true);

          // If monsters array is present, validate structure
          if (hasMonsters && effect.monsters.length > 0) {
            effect.monsters.forEach(monster => {
              expect(monster).toHaveProperty('type');
              expect(monster).toHaveProperty('cr');
            });
          }
        });
      });
    });
  });
});
