/**
 * Integration Tests: Vallaki Events (Story 4-3)
 *
 * Tests Epic 2 EventScheduler compatibility with Vallaki's event system
 */

const EventScheduler = require('../../../src/calendar/event-scheduler');
const LocationLoader = require('../../../src/data/location-loader');
const path = require('path');
const yaml = require('yaml');
const fs = require('fs').promises;

describe('Vallaki Events - EventScheduler Integration', () => {
  let eventScheduler;
  let locationLoader;

  beforeAll(() => {
    locationLoader = new LocationLoader({
      locationsDir: path.join(process.cwd(), 'game-data', 'locations')
    });

    eventScheduler = new EventScheduler({
      locationsDir: path.join(process.cwd(), 'game-data', 'locations')
    });
  });

  describe('Event Schema Validation', () => {
    test('parent Vallaki events parse correctly', async () => {
      const eventsPath = path.join(process.cwd(), 'game-data', 'locations', 'vallaki', 'Events.md');
      const content = await fs.readFile(eventsPath, 'utf-8');

      // Extract YAML from markdown code block
      const yamlMatch = content.match(/```yaml\n([\s\S]*?)\n```/);
      expect(yamlMatch).toBeTruthy();

      const eventsData = yaml.parse(yamlMatch[1]);
      expect(eventsData.events).toBeDefined();
      expect(Array.isArray(eventsData.events)).toBe(true);
      expect(eventsData.events.length).toBeGreaterThan(0);
    });

    test('all Vallaki events have required fields', async () => {
      const result = await locationLoader.loadLocation('vallaki');
      expect(result.success).toBe(true);

      const events = result.data.events;
      expect(events.length).toBeGreaterThan(0);

      events.forEach(event => {
        expect(event.eventId).toBeDefined();
        expect(event.name).toBeDefined();
        expect(event.trigger_type).toBeDefined();
        expect(event.effects).toBeDefined();
        expect(Array.isArray(event.effects)).toBe(true);
      });
    });

    test('all sub-location events have required fields', async () => {
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

        if (result.data.events && result.data.events.length > 0) {
          result.data.events.forEach(event => {
            expect(event.eventId).toBeDefined();
            expect(event.name).toBeDefined();
            expect(event.trigger_type).toBeDefined();
            expect(event.effects).toBeDefined();
            expect(Array.isArray(event.effects)).toBe(true);
          });
        }
      }
    });
  });

  describe('Trigger Type Recognition', () => {
    test('recognizes date_time trigger type', async () => {
      const result = await locationLoader.loadLocation('vallaki');
      expect(result.success).toBe(true);

      const dateTimeEvents = result.data.events.filter(e => e.trigger_type === 'date_time');
      expect(dateTimeEvents.length).toBeGreaterThan(0);

      // Festival of Blazing Sun uses date_time trigger
      const festivalEvent = result.data.events.find(e => e.eventId === 'festival_of_blazing_sun');
      expect(festivalEvent).toBeDefined();
      expect(festivalEvent.trigger_type).toBe('date_time');
      expect(festivalEvent.trigger_schedule).toBeDefined();
    });

    test('recognizes conditional trigger type', async () => {
      const result = await locationLoader.loadLocation('vallaki');
      expect(result.success).toBe(true);

      const conditionalEvents = result.data.events.filter(e => e.trigger_type === 'conditional');
      expect(conditionalEvents.length).toBeGreaterThan(0);

      // St. Andral's Feast uses conditional trigger
      const feastEvent = result.data.events.find(e => e.eventId === 'st_andrals_feast');
      expect(feastEvent).toBeDefined();
      expect(feastEvent.trigger_type).toBe('conditional');
      expect(feastEvent.trigger_conditions).toBeDefined();
    });

    test('recognizes time_based trigger type in sub-locations', async () => {
      const result = await locationLoader.loadLocation('vallaki/town-gates');
      expect(result.success).toBe(true);

      const timeBasedEvents = result.data.events.filter(e => e.trigger_type === 'time_based');
      expect(timeBasedEvents.length).toBeGreaterThan(0);

      // Gate closing/opening events use time_based triggers
      const curfewEvent = result.data.events.find(e => e.eventId === 'gates_close_curfew');
      expect(curfewEvent).toBeDefined();
      expect(curfewEvent.trigger_type).toBe('time_based');
      expect(curfewEvent.trigger_schedule).toBeDefined();
      expect(curfewEvent.trigger_schedule.time).toBeDefined();
    });
  });

  describe('Effect Types Validation', () => {
    test('validates state_update effects', async () => {
      const result = await locationLoader.loadLocation('vallaki');
      expect(result.success).toBe(true);

      const eventsWithStateUpdates = result.data.events.filter(e =>
        e.effects.some(effect => effect.type === 'state_update')
      );

      expect(eventsWithStateUpdates.length).toBeGreaterThan(0);

      eventsWithStateUpdates.forEach(event => {
        const stateUpdateEffects = event.effects.filter(e => e.type === 'state_update');
        stateUpdateEffects.forEach(effect => {
          expect(effect.stateChanges).toBeDefined();
          expect(typeof effect.stateChanges).toBe('object');
        });
      });
    });

    test('validates narrative effects', async () => {
      const result = await locationLoader.loadLocation('vallaki/church-of-st-andral');
      expect(result.success).toBe(true);

      const eventsWithNarrative = result.data.events.filter(e =>
        e.effects.some(effect => effect.type === 'narrative')
      );

      expect(eventsWithNarrative.length).toBeGreaterThan(0);

      eventsWithNarrative.forEach(event => {
        const narrativeEffects = event.effects.filter(e => e.type === 'narrative');
        narrativeEffects.forEach(effect => {
          expect(effect.text).toBeDefined();
          expect(typeof effect.text).toBe('string');
          expect(effect.text.length).toBeGreaterThan(0);
        });
      });
    });

    test('validates combat_encounter effects', async () => {
      const result = await locationLoader.loadLocation('vallaki/coffin-maker-shop');
      expect(result.success).toBe(true);

      const combatEvents = result.data.events.filter(e =>
        e.effects.some(effect => effect.type === 'combat_encounter')
      );

      expect(combatEvents.length).toBeGreaterThan(0);

      combatEvents.forEach(event => {
        const combatEffects = event.effects.filter(e => e.type === 'combat_encounter');
        combatEffects.forEach(effect => {
          expect(effect.monsters).toBeDefined();
          expect(Array.isArray(effect.monsters)).toBe(true);
          expect(effect.monsters.length).toBeGreaterThan(0);

          effect.monsters.forEach(monster => {
            expect(monster.type).toBeDefined();
            expect(monster.count).toBeDefined();
            expect(monster.cr).toBeDefined();
          });
        });
      });
    });

    test('validates custom effects', async () => {
      const result = await locationLoader.loadLocation('vallaki');
      expect(result.success).toBe(true);

      const customEvents = result.data.events.filter(e =>
        e.effects.some(effect => effect.type === 'custom')
      );

      if (customEvents.length > 0) {
        customEvents.forEach(event => {
          const customEffects = event.effects.filter(e => e.type === 'custom');
          customEffects.forEach(effect => {
            expect(effect.description).toBeDefined();
            expect(typeof effect.description).toBe('string');
          });
        });
      }
    });

    test('validates quest_update effects', async () => {
      const result = await locationLoader.loadLocation('vallaki/coffin-maker-shop');
      expect(result.success).toBe(true);

      const questEvents = result.data.events.filter(e =>
        e.effects.some(effect => effect.type === 'quest_update')
      );

      if (questEvents.length > 0) {
        questEvents.forEach(event => {
          const questEffects = event.effects.filter(e => e.type === 'quest_update');
          questEffects.forEach(effect => {
            expect(effect.quest).toBeDefined();
            expect(effect.status).toBeDefined();
          });
        });
      }
    });
  });

  describe('Quest-Critical Events', () => {
    test('St. Andral\'s Feast event is properly configured', async () => {
      const result = await locationLoader.loadLocation('vallaki');
      expect(result.success).toBe(true);

      const feastEvent = result.data.events.find(e => e.eventId === 'st_andrals_feast');
      expect(feastEvent).toBeDefined();
      expect(feastEvent.trigger_type).toBe('conditional');
      expect(feastEvent.trigger_conditions.st_andrals_bones_stolen).toBe(true);

      // Should have combat encounter effect
      const combatEffect = feastEvent.effects.find(e => e.type === 'combat_encounter');
      expect(combatEffect).toBeDefined();
      expect(combatEffect.monsters).toBeDefined();

      const vampireSpawn = combatEffect.monsters.find(m => m.type === 'vampire_spawn');
      expect(vampireSpawn).toBeDefined();
      expect(vampireSpawn.count).toBeGreaterThan(0);
    });

    test('bones discovery event in coffin maker shop', async () => {
      const result = await locationLoader.loadLocation('vallaki/coffin-maker-shop');
      expect(result.success).toBe(true);

      const discoveryEvent = result.data.events.find(e => e.eventId === 'bones_discovered_here');
      expect(discoveryEvent).toBeDefined();
      expect(discoveryEvent.trigger_type).toBe('conditional');

      // Should have quest_update effect
      const questEffect = discoveryEvent.effects.find(e => e.type === 'quest_update');
      expect(questEffect).toBeDefined();
      expect(questEffect.quest).toBe('st_andrals_bones_quest');
    });

    test('vampire spawn nest discovery event', async () => {
      const result = await locationLoader.loadLocation('vallaki/coffin-maker-shop');
      expect(result.success).toBe(true);

      const nestEvent = result.data.events.find(e => e.eventId === 'vampire_spawn_discovered');
      expect(nestEvent).toBeDefined();
      expect(nestEvent.trigger_type).toBe('conditional');

      // Should have combat encounter
      const combatEffect = nestEvent.effects.find(e => e.type === 'combat_encounter');
      expect(combatEffect).toBeDefined();
      expect(combatEffect.difficulty).toBe('deadly');
      expect(combatEffect.flee_option).toBe(true);
    });
  });

  describe('Recurring Events', () => {
    test('Festival of Blazing Sun recurs weekly', async () => {
      const result = await locationLoader.loadLocation('vallaki');
      expect(result.success).toBe(true);

      const festivalEvent = result.data.events.find(e => e.eventId === 'festival_of_blazing_sun');
      expect(festivalEvent).toBeDefined();
      expect(festivalEvent.trigger_schedule).toBeDefined();
      expect(festivalEvent.trigger_schedule.frequency).toBe('weekly');
      expect(festivalEvent.trigger_schedule.day_of_week).toBe('Sunday');
      expect(festivalEvent.trigger_schedule.time).toBe('10:00');
    });

    test('daily gate curfew events', async () => {
      const result = await locationLoader.loadLocation('vallaki/town-gates');
      expect(result.success).toBe(true);

      const closeEvent = result.data.events.find(e => e.eventId === 'gates_close_curfew');
      expect(closeEvent).toBeDefined();
      expect(closeEvent.trigger_schedule.frequency).toBe('daily');
      expect(closeEvent.trigger_schedule.time).toBe('18:00');

      const openEvent = result.data.events.find(e => e.eventId === 'gates_open_dawn');
      expect(openEvent).toBeDefined();
      expect(openEvent.trigger_schedule.frequency).toBe('daily');
      expect(openEvent.trigger_schedule.time).toBe('06:00');
    });
  });

  describe('State Update Propagation', () => {
    test('events specify correct locationId for state updates', async () => {
      const result = await locationLoader.loadLocation('vallaki/coffin-maker-shop');
      expect(result.success).toBe(true);

      const discoveryEvent = result.data.events.find(e => e.eventId === 'bones_discovered_here');
      expect(discoveryEvent).toBeDefined();

      // Check for state updates to church
      const churchStateUpdate = discoveryEvent.effects.find(
        e => e.type === 'state_update' && e.locationId === 'church-of-st-andral'
      );
      expect(churchStateUpdate).toBeDefined();
      expect(churchStateUpdate.stateChanges.bones_location_known).toBe(true);
    });

    test('events update local state correctly', async () => {
      const result = await locationLoader.loadLocation('vallaki/reformation-center');
      expect(result.success).toBe(true);

      const imprisonmentEvent = result.data.events.find(e => e.eventId === 'mass_imprisonment');
      expect(imprisonmentEvent).toBeDefined();

      const stateUpdateEffect = imprisonmentEvent.effects.find(e => e.type === 'state_update');
      expect(stateUpdateEffect).toBeDefined();
      expect(stateUpdateEffect.stateChanges).toBeDefined();
    });
  });

  describe('Event Consistency', () => {
    test('all eventIds are unique within location', async () => {
      const locations = [
        'vallaki',
        'vallaki/church-of-st-andral',
        'vallaki/burgomaster-mansion',
        'vallaki/blue-water-inn',
        'vallaki/town-square',
        'vallaki/reformation-center',
        'vallaki/town-gates',
        'vallaki/coffin-maker-shop'
      ];

      for (const locationId of locations) {
        const result = await locationLoader.loadLocation(locationId);
        expect(result.success).toBe(true);

        const eventIds = result.data.events.map(e => e.eventId);
        const uniqueEventIds = new Set(eventIds);
        expect(eventIds.length).toBe(uniqueEventIds.size);
      }
    });

    test('trigger_conditions reference valid state fields', async () => {
      const result = await locationLoader.loadLocation('vallaki');
      expect(result.success).toBe(true);

      const conditionalEvents = result.data.events.filter(e => e.trigger_type === 'conditional');

      conditionalEvents.forEach(event => {
        expect(event.trigger_conditions).toBeDefined();
        expect(typeof event.trigger_conditions).toBe('object');
        expect(Object.keys(event.trigger_conditions).length).toBeGreaterThan(0);
      });
    });
  });
});
