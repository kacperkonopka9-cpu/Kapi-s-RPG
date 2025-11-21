/**
 * PromptTemplateEngine Integration Tests
 * Epic 5 Story 5.3: LLM Prompt Templates
 *
 * Test Suites:
 * 1. Template Rendering (all 5 templates)
 * 2. Variable Substitution (simple, nested, arrays, defaults)
 * 3. Token Budget Validation (±10% tolerance)
 * 4. Missing Variable Handling (error messages)
 * 5. Epic Integration (ContextObject from Story 5-1)
 * 6. DM Persona Integration (prepended to all prompts)
 * 7. Template Caching (verify cache hits)
 * 8. Custom Templates (register and render)
 *
 * Target: 40+ tests, 100% pass rate
 */

const PromptTemplateEngine = require('../../../src/prompts/template-engine');
const fs = require('fs');
const path = require('path');

describe('PromptTemplateEngine', () => {
  let engine;
  let mockEstimateTokens;

  beforeEach(() => {
    // Create engine with default dependencies
    mockEstimateTokens = jest.fn((text) => Math.ceil(text.length / 4 * 1.05));
    engine = new PromptTemplateEngine({
      estimateTokens: mockEstimateTokens
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Test Suite 1 - Template Rendering (AC-1, AC-2)', () => {
    test('should render location-initial-visit template with valid context', async () => {
      const context = {
        location: {
          name: 'Village of Barovia',
          description: 'A gloomy village shrouded in mist.',
          timeOfDay: 'dusk',
          weather: 'foggy'
        },
        calendar: {
          currentDate: '735-10-1',
          currentTime: '18:00',
          weather: 'foggy',
          moonPhase: 'waxing crescent'
        },
        character: {
          name: 'Kapi',
          level: 4,
          class: 'Cleric',
          hp: { current: 28, max: 32 },
          ac: 16
        },
        npcs: [
          { name: 'Ismark', status: 'worried', dialogueContext: 'needs help protecting sister' }
        ]
      };

      const result = await engine.renderTemplate('location-initial-visit', context);

      expect(result.success).toBe(true);
      expect(result.data.prompt).toContain('Village of Barovia');
      expect(result.data.prompt).toContain('Kapi');
      expect(result.data.prompt).toContain('Ismark');
      expect(result.data.prompt).toContain('You are the Dungeon Master'); // DM persona prepended
      expect(result.data.tokenCount).toBeGreaterThan(0);
      expect(result.data.templateId).toBe('location-initial-visit');
      expect(result.data.priority).toBe('P1');
    });

    test('should render location-return template with state changes', async () => {
      const context = {
        location: {
          name: 'Village of Barovia',
          timeOfDay: 'morning',
          stateChanges: 'The tavern now stands empty, its windows shattered.'
        },
        calendar: { currentDate: '735-10-2', currentTime: '08:00', weather: 'overcast' },
        character: { name: 'Kapi', level: 4, class: 'Cleric', hp: { current: 30, max: 32 } },
        npcs: [
          { name: 'Ismark', status: 'grateful', relationship: 'ally' }
        ]
      };

      const result = await engine.renderTemplate('location-return', context);

      if (!result.success) {
        console.error('location-return error:', result.error);
      }

      expect(result.success).toBe(true);
      expect(result.data.prompt).toContain('Returning to: Village of Barovia');
      expect(result.data.prompt).toContain('The tavern now stands empty');
      expect(result.data.prompt).toContain('Relationship: ally');
      expect(result.data.tokenCount).toBeGreaterThan(0);
    });

    test('should render npc-dialogue template with personality', async () => {
      const context = {
        npc: {
          name: 'Ireena Kolyana',
          personality: 'Courageous but haunted, fiercely protective of others',
          status: 'desperate',
          relationship: 'trusting',
          dialogueContext: 'Asking for help escaping Strahd',
          mood: 'fearful yet determined'
        },
        character: { name: 'Kapi' },
        location: { name: 'Burgomaster Mansion' },
        calendar: { currentDate: '735-10-1', currentTime: '20:00' }
      };

      const result = await engine.renderTemplate('npc-dialogue', context);

      expect(result.success).toBe(true);
      expect(result.data.prompt).toContain('Ireena Kolyana');
      expect(result.data.prompt).toContain('Courageous but haunted');
      expect(result.data.prompt).toContain('fearful yet determined');
      expect(result.data.tokenCount).toBeGreaterThan(0);
    });

    test('should render combat-narration template with damage', async () => {
      const context = {
        attacker: { name: 'Kapi' },
        target: { name: 'Zombie', hp: { current: 22, max: 22 } },
        action: { type: 'melee attack', description: 'swings mace at zombie' },
        diceResult: { rolls: '[12]', total: 17, targetNumber: 8, outcome: 'hit' },
        damage: { amount: 8, type: 'bludgeoning' },
        environment: { description: 'the crumbling graveyard, tombstones providing partial cover' }
      };

      const result = await engine.renderTemplate('combat-narration', context);

      expect(result.success).toBe(true);
      expect(result.data.prompt).toContain('Kapi');
      expect(result.data.prompt).toContain('Zombie');
      expect(result.data.prompt).toContain('8');
      expect(result.data.prompt).toContain('bludgeoning');
      expect(result.data.tokenCount).toBeGreaterThan(0);
    });

    test('should render consistency-validation template with rules', async () => {
      const context = {
        playerAction: 'Cast Misty Step to teleport 30 feet away',
        worldState: {
          location: { name: 'Death House Attic', state: 'combat' },
          npcs: [{ name: 'Animated Armor', status: 'hostile' }],
          calendar: { currentDate: '735-10-1', currentTime: '14:00' },
          character: {
            hp: { current: 12, max: 32 },
            spellSlots: '2nd: 0/3 remaining',
            conditions: 'none'
          }
        },
        rules: 'PHB p. 201: You must have an available spell slot to cast a spell.'
      };

      const result = await engine.renderTemplate('consistency-validation', context);

      if (!result.success) {
        console.error('consistency-validation error:', result.error);
      }

      expect(result.success).toBe(true);
      expect(result.data.prompt).toContain('Cast Misty Step');
      expect(result.data.prompt).toContain('0/3 remaining');
      expect(result.data.prompt).toContain('PHB p. 201');
      expect(result.data.tokenCount).toBeGreaterThan(0);
    });
  });

  describe('Test Suite 2 - Variable Substitution (AC-1, AC-5)', () => {
    test('should substitute simple variables', async () => {
      const context = {
        location: { name: 'Test Location' },
        calendar: { currentDate: '735-10-1', currentTime: '12:00', weather: 'sunny', moonPhase: 'full' },
        character: { name: 'TestChar', level: 5, class: 'Fighter', hp: { current: 40, max: 40 }, ac: 18 },
        npcs: []
      };

      const result = await engine.renderTemplate('location-initial-visit', context);

      expect(result.success).toBe(true);
      expect(result.data.prompt).toContain('Test Location');
      expect(result.data.prompt).toContain('735-10-1');
      expect(result.data.prompt).toContain('TestChar');
    });

    test('should substitute nested object properties', async () => {
      const context = {
        character: {
          name: 'Kapi',
          hp: { current: 25, max: 32 }
        },
        location: { name: 'Test' },
        calendar: { currentDate: '735-10-1', currentTime: '12:00', weather: 'clear', moonPhase: 'new' },
        npcs: []
      };

      const result = await engine.renderTemplate('location-initial-visit', context);

      expect(result.success).toBe(true);
      expect(result.data.prompt).toContain('25/32'); // {{character.hp.current}}/{{character.hp.max}}
    });

    test('should substitute array iterations with {{#each}}', async () => {
      const context = {
        location: { name: 'Tavern' },
        calendar: { currentDate: '735-10-1', currentTime: '20:00', weather: 'rainy', moonPhase: 'waning' },
        character: { name: 'Kapi', level: 4, class: 'Cleric', hp: { current: 30, max: 32 }, ac: 16 },
        npcs: [
          { name: 'Ismark', status: 'worried' },
          { name: 'Ireena', status: 'fearful' }
        ]
      };

      const result = await engine.renderTemplate('location-initial-visit', context);

      expect(result.success).toBe(true);
      expect(result.data.prompt).toContain('Ismark');
      expect(result.data.prompt).toContain('Ireena');
      expect(result.data.prompt).toContain('worried');
      expect(result.data.prompt).toContain('fearful');
    });

    test('should handle optional variables with defaults', async () => {
      const context = {
        location: { name: 'Test Location' }, // No timeOfDay property
        calendar: { currentDate: '735-10-1', currentTime: '12:00', weather: 'clear', moonPhase: 'full' },
        character: { name: 'Kapi', level: 4, class: 'Cleric', hp: { current: 30, max: 32 }, ac: 16 },
        npcs: []
      };

      const result = await engine.renderTemplate('location-initial-visit', context);

      expect(result.success).toBe(true);
      // Template has {{location.timeOfDay || "unknown time"}}, should use default
      expect(result.data.prompt).toContain('unknown time');
    });

    test('should handle empty arrays gracefully', async () => {
      const context = {
        location: { name: 'Empty Room' },
        calendar: { currentDate: '735-10-1', currentTime: '12:00', weather: 'foggy', moonPhase: 'new' },
        character: { name: 'Kapi', level: 4, class: 'Cleric', hp: { current: 30, max: 32 }, ac: 16 },
        npcs: [] // Empty array
      };

      const result = await engine.renderTemplate('location-initial-visit', context);

      expect(result.success).toBe(true);
      expect(result.data.prompt).not.toContain('undefined');
      // NPCs section should be empty but not broken
    });
  });

  describe('Test Suite 3 - Token Budget Validation (AC-4)', () => {
    test('should include tokenCount in result metadata', async () => {
      const context = {
        location: { name: 'Test' },
        calendar: { currentDate: '735-10-1', currentTime: '12:00', weather: 'clear', moonPhase: 'full' },
        character: { name: 'Kapi', level: 4, class: 'Cleric', hp: { current: 30, max: 32 }, ac: 16 },
        npcs: []
      };

      const result = await engine.renderTemplate('location-initial-visit', context);

      expect(result.success).toBe(true);
      expect(result.data.tokenCount).toBeDefined();
      expect(typeof result.data.tokenCount).toBe('number');
      expect(result.data.tokenCount).toBeGreaterThan(0);
    });

    test('should include tokenBudget in result metadata', async () => {
      const context = {
        location: { name: 'Test' },
        calendar: { currentDate: '735-10-1', currentTime: '12:00', weather: 'clear', moonPhase: 'full' },
        character: { name: 'Kapi', level: 4, class: 'Cleric', hp: { current: 30, max: 32 }, ac: 16 },
        npcs: []
      };

      const result = await engine.renderTemplate('location-initial-visit', context);

      expect(result.success).toBe(true);
      expect(result.data.tokenBudget).toBe(800); // location-initial-visit has 800 token budget
    });

    test('should warn if token count exceeds budget by >10% but not block rendering', async () => {
      // Use console spy to check for warnings
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

      // Create very large context to exceed budget
      const longDescription = 'A'.repeat(5000); // Very long description

      const context = {
        location: { name: 'Test Location', description: longDescription },
        calendar: { currentDate: '735-10-1', currentTime: '12:00', weather: 'clear', moonPhase: 'full' },
        character: { name: 'Kapi', level: 4, class: 'Cleric', hp: { current: 30, max: 32 }, ac: 16 },
        npcs: []
      };

      const result = await engine.renderTemplate('location-initial-visit', context);

      // Should still succeed (soft limit)
      expect(result.success).toBe(true);

      // Should have logged warning if over budget
      if (result.data.tokenCount > result.data.tokenBudget * 1.1) {
        expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('exceeds token budget'));
      }

      debugSpy.mockRestore();
    });
  });

  describe('Test Suite 4 - Missing Variable Handling (AC-5)', () => {
    test('should return error if required variable missing', async () => {
      const context = {
        // Missing location, calendar, character
        npcs: []
      };

      const result = await engine.renderTemplate('location-initial-visit', context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing template variables');
      expect(result.error).toMatch(/location|calendar|character/);
    });

    test('should identify all missing variables in error message', async () => {
      const context = {
        location: { name: 'Test' },
        // Missing calendar and character
        npcs: []
      };

      const result = await engine.renderTemplate('location-initial-visit', context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('calendar');
      expect(result.error).toContain('character');
    });

    test('should succeed if all required variables present (even if some optional missing)', async () => {
      const context = {
        location: { name: 'Test' }, // No description or timeOfDay (optional)
        calendar: { currentDate: '735-10-1', currentTime: '12:00', weather: 'clear', moonPhase: 'full' },
        character: { name: 'Kapi', level: 4, class: 'Cleric', hp: { current: 30, max: 32 }, ac: 16 },
        npcs: []
      };

      const result = await engine.renderTemplate('location-initial-visit', context);

      expect(result.success).toBe(true);
    });
  });

  describe('Test Suite 5 - Epic Integration (AC-6)', () => {
    test('should work with Story 5-1 ContextObject structure', async () => {
      // Simulated ContextObject from Story 5-1
      const contextObject = {
        metadata: {
          tokenCount: 3200,
          prioritiesLoaded: ['P1', 'P2'],
          cacheHitRate: 85
        },
        character: {
          name: 'Kapi',
          level: 4,
          class: 'Cleric',
          race: 'Human',
          background: 'Acolyte',
          hp: { current: 28, max: 32 },
          ac: 16,
          abilities: {
            strength: 14,
            dexterity: 10,
            constitution: 14,
            intelligence: 10,
            wisdom: 16,
            charisma: 12
          }
        },
        location: {
          locationId: 'village-of-barovia',
          name: 'Village of Barovia',
          description: 'A gloomy village shrouded in perpetual mist and fog.',
          state: { visited: true, discovered_items: [], npc_states: {} },
          connections: ['tser-pool-encampment', 'death-house']
        },
        npcs: [
          {
            npcId: 'ismark_indirovich',
            name: 'Ismark Indirovich',
            personality: 'Brave but burdened by responsibility',
            status: 'worried',
            dialogueContext: 'Seeking help to protect his sister Ireena from Strahd'
          }
        ],
        events: [],
        calendar: {
          currentDate: '735-10-1',
          currentTime: '18:00',
          dayOfWeek: 'Moonday',
          season: 'autumn',
          moonPhase: 'waxing crescent',
          weather: 'foggy'
        },
        quests: [],
        contextMarkdown: '# Full context markdown...'
      };

      const result = await engine.renderTemplate('location-initial-visit', contextObject);

      expect(result.success).toBe(true);
      expect(result.data.prompt).toContain('Village of Barovia');
      expect(result.data.prompt).toContain('Kapi');
      expect(result.data.prompt).toContain('Ismark Indirovich');
      expect(result.data.prompt).toContain('735-10-1');
      expect(result.data.prompt).toContain('waxing crescent');
    });

    test('should access nested Epic 1-4 data correctly', async () => {
      const context = {
        location: { name: 'Vallaki', locationId: 'vallaki' },
        calendar: { currentDate: '735-10-5', currentTime: '14:00', weather: 'overcast', moonPhase: 'full' },
        character: {
          name: 'Kapi',
          level: 5,
          class: 'Cleric',
          hp: { current: 35, max: 40 },
          ac: 17,
          abilities: { wisdom: 16, charisma: 12 }
        },
        npcs: [
          {
            npcId: 'father_lucian',
            name: 'Father Lucian Petrovich',
            personality: 'Dutiful but secretly despairing',
            status: 'anxious',
            dialogueContext: 'Warning about missing bones from church'
          }
        ]
      };

      const result = await engine.renderTemplate('location-initial-visit', context);

      expect(result.success).toBe(true);
      expect(result.data.prompt).toContain('Father Lucian Petrovich');
      expect(result.data.prompt).toContain('Level 5 Cleric');
      expect(result.data.prompt).toContain('35/40');
    });
  });

  describe('Test Suite 6 - DM Persona Integration (AC-3)', () => {
    test('should prepend DM persona to all rendered templates', async () => {
      const context = {
        location: { name: 'Test' },
        calendar: { currentDate: '735-10-1', currentTime: '12:00', weather: 'clear', moonPhase: 'full' },
        character: { name: 'Kapi', level: 4, class: 'Cleric', hp: { current: 30, max: 32 }, ac: 16 },
        npcs: []
      };

      const result = await engine.renderTemplate('location-initial-visit', context);

      expect(result.success).toBe(true);
      // Check for DM persona content
      expect(result.data.prompt).toContain('You are the Dungeon Master');
      expect(result.data.prompt).toContain('Curse of Strahd');
      expect(result.data.prompt).toContain('gothic horror');
      expect(result.data.prompt).toContain('D&D 5e RAW');
    });

    test('DM persona should appear before template content', async () => {
      const context = {
        location: { name: 'Village of Barovia' },
        calendar: { currentDate: '735-10-1', currentTime: '12:00', weather: 'foggy', moonPhase: 'new' },
        character: { name: 'Kapi', level: 4, class: 'Cleric', hp: { current: 30, max: 32 }, ac: 16 },
        npcs: []
      };

      const result = await engine.renderTemplate('location-initial-visit', context);

      expect(result.success).toBe(true);

      const dmPersonaIndex = result.data.prompt.indexOf('You are the Dungeon Master');
      const locationIndex = result.data.prompt.indexOf('Village of Barovia');

      // DM persona should appear before location content
      expect(dmPersonaIndex).toBeGreaterThan(-1);
      expect(locationIndex).toBeGreaterThan(-1);
      expect(dmPersonaIndex).toBeLessThan(locationIndex);
    });

    test('DM persona should be cached after first load', async () => {
      const context = {
        location: { name: 'Test' },
        calendar: { currentDate: '735-10-1', currentTime: '12:00', weather: 'clear', moonPhase: 'full' },
        character: { name: 'Kapi', level: 4, class: 'Cleric', hp: { current: 30, max: 32 }, ac: 16 },
        npcs: []
      };

      // First render - loads DM persona
      await engine.renderTemplate('location-initial-visit', context);

      // Check that DM persona is cached
      expect(engine.dmPersonaCache).not.toBeNull();
      expect(engine.dmPersonaCache).toContain('You are the Dungeon Master');

      // Second render - should use cached DM persona
      const result2 = await engine.renderTemplate('location-return', context);
      expect(result2.success).toBe(true);
    });
  });

  describe('Test Suite 7 - Template Caching (AC-1)', () => {
    test('should cache template after first load', async () => {
      const context = {
        location: { name: 'Test' },
        calendar: { currentDate: '735-10-1', currentTime: '12:00', weather: 'clear', moonPhase: 'full' },
        character: { name: 'Kapi', level: 4, class: 'Cleric', hp: { current: 30, max: 32 }, ac: 16 },
        npcs: []
      };

      // First render - loads template from file
      const result1 = await engine.renderTemplate('location-initial-visit', context);
      expect(result1.success).toBe(true);

      // Check cache
      expect(engine.templateCache.has('location-initial-visit')).toBe(true);

      // Second render - should use cached template
      const result2 = await engine.renderTemplate('location-initial-visit', context);
      expect(result2.success).toBe(true);
    });

    test('should cache multiple templates independently', async () => {
      const context1 = {
        location: { name: 'Test' },
        calendar: { currentDate: '735-10-1', currentTime: '12:00', weather: 'clear', moonPhase: 'full' },
        character: { name: 'Kapi', level: 4, class: 'Cleric', hp: { current: 30, max: 32 }, ac: 16 },
        npcs: []
      };

      const context2 = {
        npc: { name: 'Ireena', personality: 'Brave', status: 'fearful', relationship: 'ally', dialogueContext: 'Asking for help', mood: 'desperate' },
        character: { name: 'Kapi' },
        location: { name: 'Test' },
        calendar: { currentDate: '735-10-1', currentTime: '12:00' }
      };

      await engine.renderTemplate('location-initial-visit', context1);
      await engine.renderTemplate('npc-dialogue', context2);

      expect(engine.templateCache.has('location-initial-visit')).toBe(true);
      expect(engine.templateCache.has('npc-dialogue')).toBe(true);
      expect(engine.templateCache.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Test Suite 8 - Custom Templates (AC-1)', () => {
    test('should register custom template successfully', () => {
      const customTemplate = `---
templateId: custom-test
priority: P2
tokenBudget: 400
---

# Custom Template

Test content: {{testVar}}`;

      expect(() => {
        engine.registerTemplate('custom-test', customTemplate);
      }).not.toThrow();

      expect(engine.registeredTemplates.has('custom-test')).toBe(true);
    });

    test('should render registered custom template', async () => {
      const customTemplate = `---
templateId: custom-test
priority: P2
tokenBudget: 400
description: Custom test template
---

# Custom Template

Hello {{name}}, you are in {{location}}.`;

      engine.registerTemplate('custom-test', customTemplate);

      const context = {
        name: 'Kapi',
        location: 'Test Area'
      };

      const result = await engine.renderTemplate('custom-test', context);

      expect(result.success).toBe(true);
      expect(result.data.prompt).toContain('Hello Kapi');
      expect(result.data.prompt).toContain('Test Area');
    });

    test('should list all available templates including registered ones', () => {
      const customTemplate = `---
templateId: custom-list-test
priority: P3
tokenBudget: 300
description: Test listing
---

Content here.`;

      engine.registerTemplate('custom-list-test', customTemplate);

      const templates = engine.listTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);

      // Should include file-based templates
      const locationTemplate = templates.find(t => t.id === 'location-initial-visit');
      expect(locationTemplate).toBeDefined();
      expect(locationTemplate.tokenBudget).toBe(800);
      expect(locationTemplate.priority).toBe('P1');

      // Should include registered custom template
      const customEntry = templates.find(t => t.id === 'custom-list-test');
      expect(customEntry).toBeDefined();
      expect(customEntry.description).toBe('Test listing');
    });

    test('should throw error if registering duplicate template', () => {
      const template = `---
templateId: duplicate-test
priority: P2
tokenBudget: 400
---

Content.`;

      engine.registerTemplate('duplicate-test', template);

      expect(() => {
        engine.registerTemplate('duplicate-test', template);
      }).toThrow('already registered');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle null or undefined context gracefully', async () => {
      const result1 = await engine.renderTemplate('location-initial-visit', null);
      expect(result1.success).toBe(false);
      expect(result1.error).toContain('Context must be');

      const result2 = await engine.renderTemplate('location-initial-visit', undefined);
      expect(result2.success).toBe(false);
    });

    test('should handle invalid template ID', async () => {
      const context = {
        location: { name: 'Test' },
        calendar: { currentDate: '735-10-1', currentTime: '12:00', weather: 'clear', moonPhase: 'full' },
        character: { name: 'Kapi', level: 4, class: 'Cleric', hp: { current: 30, max: 32 }, ac: 16 },
        npcs: []
      };

      const result = await engine.renderTemplate('non-existent-template', context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('should handle empty template ID', async () => {
      const context = { test: 'data' };

      const result = await engine.renderTemplate('', context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('must be a non-empty string');
    });

    test('should handle circular references in context gracefully', async () => {
      const context = {
        location: { name: 'Test' },
        calendar: { currentDate: '735-10-1', currentTime: '12:00', weather: 'clear', moonPhase: 'full' },
        character: { name: 'Kapi', level: 4, class: 'Cleric', hp: { current: 30, max: 32 }, ac: 16 },
        npcs: []
      };

      // Add circular reference
      context.self = context;

      // Should not crash
      const result = await engine.renderTemplate('location-initial-visit', context);

      // May succeed or fail depending on substitution, but shouldn't crash
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });
});
