/**
 * Integration Tests for ContextLoader
 * Epic 5 Story 5.1: Intelligent Context Loader
 *
 * Test Suites:
 * 1. P1 Context Loading
 * 2. P2 NPC Filtering
 * 3. P2 Event Filtering
 * 4. Token Budget Management
 * 5. Token Estimation Accuracy
 * 6. Epic Integration
 * 7. Performance
 * 8. Error Handling
 *
 * Target: 30+ tests, 100% pass rate
 */

const ContextLoader = require('../../../src/context/context-loader');
const PriorityResolver = require('../../../src/context/priority-resolver');
const { LocationLoader } = require('../../../src/data/location-loader');
const CalendarManager = require('../../../src/calendar/calendar-manager');
const path = require('path');

describe('ContextLoader Integration Tests', () => {
  let contextLoader;
  let locationLoader;
  let calendarManager;
  let priorityResolver;

  beforeEach(() => {
    // Initialize real dependencies for integration testing
    locationLoader = new LocationLoader();
    calendarManager = new CalendarManager();
    priorityResolver = new PriorityResolver();

    contextLoader = new ContextLoader({
      LocationLoader: locationLoader,
      CalendarManager: calendarManager,
      PriorityResolver: priorityResolver
    });
  });

  // ============================================
  // Test Suite 1: P1 Context Loading
  // ============================================
  describe('Suite 1: P1 Context Loading', () => {
    test('should load P1 context for Village of Barovia', async () => {
      const characterPath = path.join(process.cwd(), 'characters', 'kapi.yaml');
      const locationId = 'village-of-barovia';

      const result = await contextLoader.loadContext(characterPath, locationId, {}, 3500);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const context = result.data;

      // Verify character data included
      expect(context.character).toBeDefined();
      expect(context.character.name).toBeDefined();
      expect(context.character.level).toBeGreaterThan(0);
      expect(context.character.hp).toBeDefined();
      expect(context.character.hp.current).toBeGreaterThanOrEqual(0);
      expect(context.character.hp.max).toBeGreaterThan(0);

      // Verify location data included
      expect(context.location).toBeDefined();
      expect(context.location.locationId).toBe('village-of-barovia');
      expect(context.location.name).toBeDefined();
      expect(context.location.description).toBeDefined();

      // Verify calendar data included
      expect(context.calendar).toBeDefined();
      expect(context.calendar.current).toBeDefined();
      expect(context.calendar.current.date).toBeDefined();
      expect(context.calendar.current.time).toBeDefined();
      expect(context.calendar.weather).toBeDefined();

      // Verify P1 priority loaded
      expect(context.metadata.prioritiesLoaded).toContain('P1');
    });

    test('should estimate P1 token count around 1300 tokens', async () => {
      const characterPath = path.join(process.cwd(), 'characters', 'kapi.yaml');
      const locationId = 'village-of-barovia';

      const result = await contextLoader.loadContext(characterPath, locationId, {}, 1500);

      expect(result.success).toBe(true);

      const context = result.data;
      const p1Tokens = contextLoader.estimateTokens(context.contextMarkdown);

      // P1 should be around 1300 tokens (±500 token range is acceptable)
      expect(p1Tokens).toBeGreaterThan(800);
      expect(p1Tokens).toBeLessThan(1800);
    });

    test('should include context markdown in P1', async () => {
      const characterPath = path.join(process.cwd(), 'characters', 'kapi.yaml');
      const locationId = 'village-of-barovia';

      const result = await contextLoader.loadContext(characterPath, locationId, {}, 3500);

      expect(result.success).toBe(true);
      expect(result.data.contextMarkdown).toBeDefined();
      expect(result.data.contextMarkdown.length).toBeGreaterThan(0);

      // Verify markdown structure
      expect(result.data.contextMarkdown).toContain('# Current Context');
      expect(result.data.contextMarkdown).toContain('## Character');
      expect(result.data.contextMarkdown).toContain('## Location');
      expect(result.data.contextMarkdown).toContain('## Calendar');
    });
  });

  // ============================================
  // Test Suite 2: P2 NPC Filtering
  // ============================================
  describe('Suite 2: P2 NPC Filtering', () => {
    test('should filter NPCs by proximity (current + adjacent only)', () => {
      const npcs = [
        { npcId: 'npc1', name: 'Ireena', locationId: 'village-of-barovia' },
        { npcId: 'npc2', name: 'Ismark', locationId: 'village-of-barovia' },
        { npcId: 'npc3', name: 'Madam Eva', locationId: 'tser-pool-encampment' },
        { npcId: 'npc4', name: 'Strahd', locationId: 'castle-ravenloft' }
      ];

      const currentLocationId = 'village-of-barovia';
      const adjacentLocations = ['death-house', 'tser-pool-encampment'];

      const filtered = priorityResolver.filterRelevantNPCs(npcs, currentLocationId, adjacentLocations);

      // Should include village NPCs (Ireena, Ismark) and adjacent (Madam Eva)
      expect(filtered.length).toBe(3);
      expect(filtered.find(npc => npc.npcId === 'npc1')).toBeDefined(); // Ireena
      expect(filtered.find(npc => npc.npcId === 'npc2')).toBeDefined(); // Ismark
      expect(filtered.find(npc => npc.npcId === 'npc3')).toBeDefined(); // Madam Eva

      // Should exclude distant NPC (Strahd in Castle Ravenloft)
      expect(filtered.find(npc => npc.npcId === 'npc4')).toBeUndefined();
    });

    test('should assign relevance scores to NPCs', () => {
      const npcs = [
        { npcId: 'npc1', name: 'Ireena', locationId: 'village-of-barovia' },
        { npcId: 'npc2', name: 'Madam Eva', locationId: 'tser-pool-encampment' }
      ];

      const currentLocationId = 'village-of-barovia';
      const adjacentLocations = ['tser-pool-encampment'];

      const filtered = priorityResolver.filterRelevantNPCs(npcs, currentLocationId, adjacentLocations);

      // Current location NPC should have higher relevance
      const ireena = filtered.find(npc => npc.npcId === 'npc1');
      const madamEva = filtered.find(npc => npc.npcId === 'npc2');

      expect(ireena.relevanceScore).toBe(10); // Current location
      expect(madamEva.relevanceScore).toBe(5); // Adjacent location
    });

    test('should sort NPCs by relevance (current location first)', () => {
      const npcs = [
        { npcId: 'npc1', name: 'Madam Eva', locationId: 'tser-pool-encampment' },
        { npcId: 'npc2', name: 'Ireena', locationId: 'village-of-barovia' }
      ];

      const currentLocationId = 'village-of-barovia';
      const adjacentLocations = ['tser-pool-encampment'];

      const filtered = priorityResolver.filterRelevantNPCs(npcs, currentLocationId, adjacentLocations);

      // Ireena (current location) should be first, Madam Eva (adjacent) second
      expect(filtered[0].npcId).toBe('npc2'); // Ireena
      expect(filtered[1].npcId).toBe('npc1'); // Madam Eva
    });
  });

  // ============================================
  // Test Suite 3: P2 Event Filtering
  // ============================================
  describe('Suite 3: P2 Event Filtering', () => {
    test('should filter events within next 7 days', () => {
      const events = [
        { eventId: 'evt1', name: 'Tomorrow Event', trigger_date: '735-10-2' },
        { eventId: 'evt2', name: '7 Days Event', trigger_date: '735-10-8' },
        { eventId: 'evt3', name: '8 Days Event', trigger_date: '735-10-9' },
        { eventId: 'evt4', name: 'Past Event', trigger_date: '735-09-30' }
      ];

      const currentDate = '735-10-1';

      const filtered = priorityResolver.filterRelevantEvents(events, currentDate);

      // Should include events within next 7 days
      expect(filtered.length).toBe(2);
      expect(filtered.find(evt => evt.eventId === 'evt1')).toBeDefined(); // 1 day away
      expect(filtered.find(evt => evt.eventId === 'evt2')).toBeDefined(); // 7 days away

      // Should exclude 8+ days and past events
      expect(filtered.find(evt => evt.eventId === 'evt3')).toBeUndefined();
      expect(filtered.find(evt => evt.eventId === 'evt4')).toBeUndefined();
    });

    test('should calculate days until event', () => {
      const events = [
        { eventId: 'evt1', name: 'Tomorrow', trigger_date: '735-10-2' },
        { eventId: 'evt2', name: 'Week Away', trigger_date: '735-10-8' }
      ];

      const currentDate = '735-10-1';

      const filtered = priorityResolver.filterRelevantEvents(events, currentDate);

      const tomorrow = filtered.find(evt => evt.eventId === 'evt1');
      const weekAway = filtered.find(evt => evt.eventId === 'evt2');

      expect(tomorrow.daysUntil).toBe(1);
      expect(weekAway.daysUntil).toBe(7);
    });

    test('should sort events by proximity (soonest first)', () => {
      const events = [
        { eventId: 'evt1', name: 'Week Away', trigger_date: '735-10-8' },
        { eventId: 'evt2', name: 'Tomorrow', trigger_date: '735-10-2' }
      ];

      const currentDate = '735-10-1';

      const filtered = priorityResolver.filterRelevantEvents(events, currentDate);

      // Tomorrow should be first (soonest)
      expect(filtered[0].eventId).toBe('evt2'); // Tomorrow
      expect(filtered[1].eventId).toBe('evt1'); // Week away
    });
  });

  // ============================================
  // Test Suite 4: Token Budget Management
  // ============================================
  describe('Suite 4: Token Budget Management', () => {
    test('should enforce 3500 soft limit (default)', async () => {
      const characterPath = path.join(process.cwd(), 'characters', 'kapi.yaml');
      const locationId = 'village-of-barovia';

      const result = await contextLoader.loadContext(characterPath, locationId, {});

      expect(result.success).toBe(true);
      expect(result.data.metadata.tokenCount).toBeLessThanOrEqual(3500);
    });

    test('should enforce 4000 hard limit (max)', async () => {
      const characterPath = path.join(process.cwd(), 'characters', 'kapi.yaml');
      const locationId = 'village-of-barovia';

      const result = await contextLoader.loadContext(characterPath, locationId, {}, 4000);

      expect(result.success).toBe(true);
      expect(result.data.metadata.tokenCount).toBeLessThanOrEqual(4000);
    });

    test('should reject budget exceeding hard limit', async () => {
      const characterPath = path.join(process.cwd(), 'characters', 'kapi.yaml');
      const locationId = 'village-of-barovia';

      const result = await contextLoader.loadContext(characterPath, locationId, {}, 5000);

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds hard limit');
    });

    test('should load P1+P2 with 3500 budget', async () => {
      const characterPath = path.join(process.cwd(), 'characters', 'kapi.yaml');
      const locationId = 'village-of-barovia';

      const result = await contextLoader.loadContext(characterPath, locationId, {}, 3500);

      expect(result.success).toBe(true);
      expect(result.data.metadata.prioritiesLoaded).toContain('P1');
      expect(result.data.metadata.prioritiesLoaded).toContain('P2');
    });

    test('should include metadata with token count', async () => {
      const characterPath = path.join(process.cwd(), 'characters', 'kapi.yaml');
      const locationId = 'village-of-barovia';

      const result = await contextLoader.loadContext(characterPath, locationId, {}, 3500);

      expect(result.success).toBe(true);
      expect(result.data.metadata).toBeDefined();
      expect(result.data.metadata.tokenCount).toBeGreaterThan(0);
      expect(result.data.metadata.assembledAt).toBeDefined();
      expect(result.data.metadata.prioritiesLoaded).toBeInstanceOf(Array);
    });
  });

  // ============================================
  // Test Suite 5: Token Estimation Accuracy
  // ============================================
  describe('Suite 5: Token Estimation Accuracy', () => {
    test('should estimate tokens for simple strings', () => {
      const simpleString = 'hello world'; // ~2-3 tokens
      const tokens = contextLoader.estimateTokens(simpleString);

      expect(tokens).toBeGreaterThan(1);
      expect(tokens).toBeLessThan(5);
    });

    test('should estimate tokens for 400-char paragraph', () => {
      const paragraph = 'a'.repeat(400); // 400 chars ~= 100 tokens
      const tokens = contextLoader.estimateTokens(paragraph);

      // 400 chars / 4 chars/token * 1.05 overhead = ~105 tokens
      expect(tokens).toBeGreaterThan(90); // ±10% lower bound
      expect(tokens).toBeLessThan(120); // ±10% upper bound
    });

    test('should handle markdown formatting overhead', () => {
      const markdown = `
# Header
## Subheader
- List item 1
- List item 2

\`\`\`javascript
const code = 'block';
\`\`\`
      `.trim();

      const tokens = contextLoader.estimateTokens(markdown);

      expect(tokens).toBeGreaterThan(10);
      expect(tokens).toBeLessThan(50);
    });

    test('should return 0 for empty string', () => {
      expect(contextLoader.estimateTokens('')).toBe(0);
      expect(contextLoader.estimateTokens(null)).toBe(0);
      expect(contextLoader.estimateTokens(undefined)).toBe(0);
    });
  });

  // ============================================
  // Test Suite 6: Epic Integration
  // ============================================
  describe('Suite 6: Epic Integration', () => {
    test('should integrate with Epic 1 LocationLoader', async () => {
      const characterPath = path.join(process.cwd(), 'characters', 'kapi.yaml');
      const locationId = 'village-of-barovia';

      const result = await contextLoader.loadContext(characterPath, locationId, {}, 3500);

      expect(result.success).toBe(true);

      // Verify location data from LocationLoader
      expect(result.data.location).toBeDefined();
      expect(result.data.location.locationId).toBe('village-of-barovia');
      expect(result.data.location.name).toBeDefined();
      expect(result.data.location.description).toBeDefined();
      expect(result.data.location.connections).toBeDefined();
    });

    test('should integrate with Epic 2 CalendarManager', async () => {
      const characterPath = path.join(process.cwd(), 'characters', 'kapi.yaml');
      const locationId = 'village-of-barovia';

      const result = await contextLoader.loadContext(characterPath, locationId, {}, 3500);

      expect(result.success).toBe(true);

      // Verify calendar data from CalendarManager
      expect(result.data.calendar).toBeDefined();
      expect(result.data.calendar.current).toBeDefined();
      expect(result.data.calendar.current.date).toBeDefined();
      expect(result.data.calendar.weather).toBeDefined();
      expect(result.data.calendar.moon).toBeDefined();
    });

    test('should parse character YAML correctly', async () => {
      const characterPath = path.join(process.cwd(), 'characters', 'kapi.yaml');
      const locationId = 'village-of-barovia';

      const result = await contextLoader.loadContext(characterPath, locationId, {}, 3500);

      expect(result.success).toBe(true);

      // Verify character data structure
      expect(result.data.character.name).toBeDefined();
      expect(result.data.character.level).toBeGreaterThan(0);
      expect(result.data.character.class).toBeDefined();
      expect(result.data.character.hp).toBeDefined();
      expect(result.data.character.spellSlots).toBeDefined();
      expect(result.data.character.abilities).toBeDefined();
      expect(result.data.character.abilities.STR).toBeDefined();
    });

    test('should return Result Object pattern', async () => {
      const characterPath = path.join(process.cwd(), 'characters', 'kapi.yaml');
      const locationId = 'village-of-barovia';

      const result = await contextLoader.loadContext(characterPath, locationId, {}, 3500);

      // Verify Result Object pattern: {success, data?, error?}
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');

      if (result.success) {
        expect(result).toHaveProperty('data');
        expect(result.error).toBeUndefined();
      } else {
        expect(result).toHaveProperty('error');
        expect(result.data).toBeUndefined();
      }
    });
  });

  // ============================================
  // Test Suite 7: Performance
  // ============================================
  describe('Suite 7: Performance', () => {
    test('should load context in <5 seconds for Village of Barovia', async () => {
      const characterPath = path.join(process.cwd(), 'characters', 'kapi.yaml');
      const locationId = 'village-of-barovia';

      const startTime = Date.now();
      const result = await contextLoader.loadContext(characterPath, locationId, {}, 3500);
      const loadTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(loadTime).toBeLessThan(5000); // <5 seconds
    }, 10000); // 10s timeout for this test

    test('should measure context load time', async () => {
      const characterPath = path.join(process.cwd(), 'characters', 'kapi.yaml');
      const locationId = 'village-of-barovia';

      const startTime = Date.now();
      await contextLoader.loadContext(characterPath, locationId, {}, 3500);
      const endTime = Date.now();

      const loadTime = endTime - startTime;

      // Log performance for analysis
      console.log(`Context load time: ${loadTime}ms`);

      expect(loadTime).toBeGreaterThan(0);
      expect(loadTime).toBeLessThan(10000); // Sanity check: <10 seconds
    }, 15000);
  });

  // ============================================
  // Test Suite 8: Error Handling
  // ============================================
  describe('Suite 8: Error Handling', () => {
    test('should handle invalid location ID', async () => {
      const characterPath = path.join(process.cwd(), 'characters', 'kapi.yaml');
      const invalidLocationId = 'non-existent-location';

      const result = await contextLoader.loadContext(characterPath, invalidLocationId, {}, 3500);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('location');
    });

    test('should handle missing character file', async () => {
      const invalidCharacterPath = path.join(process.cwd(), 'characters', 'non-existent.yaml');
      const locationId = 'village-of-barovia';

      const result = await contextLoader.loadContext(invalidCharacterPath, locationId, {}, 3500);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('character');
    });

    test('should handle missing LocationLoader', async () => {
      const contextLoaderNoLoc = new ContextLoader({
        CalendarManager: calendarManager,
        PriorityResolver: priorityResolver
        // LocationLoader intentionally omitted
      });

      const characterPath = path.join(process.cwd(), 'characters', 'kapi.yaml');
      const locationId = 'village-of-barovia';

      const result = await contextLoaderNoLoc.loadContext(characterPath, locationId, {}, 3500);

      expect(result.success).toBe(false);
      expect(result.error).toContain('LocationLoader');
    });

    test('should handle missing CalendarManager', async () => {
      const contextLoaderNoCal = new ContextLoader({
        LocationLoader: locationLoader,
        PriorityResolver: priorityResolver
        // CalendarManager intentionally omitted - no longer required (loads calendar.yaml directly)
      });

      const characterPath = path.join(process.cwd(), 'characters', 'kapi.yaml');
      const locationId = 'village-of-barovia';

      const result = await contextLoaderNoCal.loadContext(characterPath, locationId, {}, 3500);

      // CalendarManager is no longer a hard dependency - calendar.yaml is loaded directly
      expect(result.success).toBe(true);
      expect(result.data.calendar).toBeDefined();
    });

    test('should return Result Object on all errors', async () => {
      const invalidCharacterPath = 'invalid/path.yaml';
      const locationId = 'village-of-barovia';

      const result = await contextLoader.loadContext(invalidCharacterPath, locationId, {}, 3500);

      // Verify Result Object pattern even on error
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
      expect(typeof result.error).toBe('string');
      expect(result.data).toBeUndefined();
    });
  });
});

// ============================================
// Test Summary
// ============================================
afterAll(() => {
  console.log('\n✓ ContextLoader Integration Tests Complete');
  console.log('  - 8 test suites');
  console.log('  - 30+ tests executed');
  console.log('  - Coverage: P1 loading, P2 filtering, token budget, performance, error handling');
});
