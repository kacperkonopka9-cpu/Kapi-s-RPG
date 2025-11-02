/**
 * Unit tests for ContextBuilder module
 * Tests token budget enforcement, priority-based loading, and helper methods
 */

const { ContextBuilder } = require('../../src/core/context-builder');

describe('ContextBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = new ContextBuilder();
  });

  // ========================================================================
  // Constructor and Configuration Tests
  // ========================================================================

  describe('Constructor', () => {
    test('should initialize with default configuration', () => {
      expect(builder.maxTokens).toBe(3000);
      expect(builder.charsPerToken).toBe(4);
      expect(builder.config.maxTokens).toBe(3000);
    });

    test('should accept custom configuration', () => {
      const customBuilder = new ContextBuilder({ maxTokens: 2000, charsPerToken: 3 });
      expect(customBuilder.maxTokens).toBe(2000);
      expect(customBuilder.charsPerToken).toBe(3);
    });
  });

  // ========================================================================
  // estimateTokens() Tests
  // ========================================================================

  describe('estimateTokens()', () => {
    test('should return 0 for empty string', () => {
      expect(builder.estimateTokens('')).toBe(0);
    });

    test('should return 0 for non-string input', () => {
      expect(builder.estimateTokens(null)).toBe(0);
      expect(builder.estimateTokens(undefined)).toBe(0);
      expect(builder.estimateTokens(123)).toBe(0);
    });

    test('should estimate tokens for short text', () => {
      // "Hello" = 5 chars / 4 chars_per_token * 1.05 overhead = 1.3125 → 2 tokens (rounded up)
      const tokens = builder.estimateTokens('Hello');
      expect(tokens).toBe(2);
    });

    test('should estimate tokens for medium text (100 chars)', () => {
      const text = 'A'.repeat(100);
      // 100 / 4 * 1.05 = 26.25 → 27 tokens
      const tokens = builder.estimateTokens(text);
      expect(tokens).toBe(27);
    });

    test('should estimate tokens for large text (1000 chars)', () => {
      const text = 'A'.repeat(1000);
      // 1000 / 4 * 1.05 = 262.5 → 263 tokens
      const tokens = builder.estimateTokens(text);
      expect(tokens).toBe(263);
    });

    test('should be conservative (round up)', () => {
      // 3 chars / 4 * 1.05 = 0.7875 → 1 token
      expect(builder.estimateTokens('ABC')).toBe(1);
    });
  });

  // ========================================================================
  // getSystemPrompt() Tests
  // ========================================================================

  describe('getSystemPrompt()', () => {
    test('should return a non-empty system prompt', () => {
      const prompt = builder.getSystemPrompt();
      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(100);
    });

    test('should include DM persona instructions', () => {
      const prompt = builder.getSystemPrompt();
      expect(prompt.toLowerCase()).toContain('dungeon master');
      expect(prompt.toLowerCase()).toContain('narrat');
    });

    test('should include Curse of Strahd setting', () => {
      const prompt = builder.getSystemPrompt();
      expect(prompt).toContain('Curse of Strahd');
      expect(prompt).toContain('Barovia');
      expect(prompt).toContain('Strahd');
    });

    test('should include D&D 5e rules', () => {
      const prompt = builder.getSystemPrompt();
      expect(prompt).toContain('D&D 5e');
    });

    test('should be under 500 tokens', () => {
      const prompt = builder.getSystemPrompt();
      const tokens = builder.estimateTokens(prompt);
      expect(tokens).toBeLessThanOrEqual(500);
    });
  });

  // ========================================================================
  // Helper Methods Tests
  // ========================================================================

  describe('formatRecentActions()', () => {
    test('should handle empty actions array', () => {
      const result = builder.formatRecentActions([]);
      expect(result).toBe('No recent actions.');
    });

    test('should format single action', () => {
      const actions = [
        { description: 'Entered tavern', result: 'Door opened' }
      ];
      const result = builder.formatRecentActions(actions);
      expect(result).toContain('1. Entered tavern');
      expect(result).toContain('Door opened');
    });

    test('should format multiple actions', () => {
      const actions = [
        { description: 'Action 1', result: 'Result 1' },
        { description: 'Action 2', result: 'Result 2' },
        { description: 'Action 3' }
      ];
      const result = builder.formatRecentActions(actions);
      expect(result).toContain('1. Action 1');
      expect(result).toContain('2. Action 2');
      expect(result).toContain('3. Action 3');
    });

    test('should limit to last 5 actions', () => {
      const actions = Array.from({ length: 10 }, (_, i) => ({
        description: `Action ${i + 1}`
      }));
      const result = builder.formatRecentActions(actions);
      // Should show numbered 1-5, but with descriptions from Actions 6-10
      expect(result).toContain('1. Action 6');
      expect(result).toContain('5. Action 10');
      // Should NOT contain early actions
      expect(result).not.toContain('Action 1\n');
      expect(result).not.toContain('Action 5\n');
    });
  });

  describe('selectDescriptionVariant()', () => {
    const mockLocation = {
      description: 'Full description',
      descriptionVariants: {
        initial: 'Initial variant',
        return: 'Return variant',
        morning: 'Morning variant',
        night: 'Night variant'
      }
    };

    test('should select initial variant for first visit', () => {
      const result = builder.selectDescriptionVariant(mockLocation, true);
      expect(result).toBe('Initial variant');
    });

    test('should select return variant for repeat visit', () => {
      const result = builder.selectDescriptionVariant(mockLocation, false);
      expect(result).toBe('Return variant');
    });

    test('should fallback to full description if variants missing', () => {
      const locationNoVariants = {
        description: 'Full description',
        descriptionVariants: {}
      };
      const result = builder.selectDescriptionVariant(locationNoVariants, true);
      expect(result).toBe('Full description');
    });

    test('should handle missing descriptionVariants gracefully', () => {
      const locationMissing = { description: 'Full description' };
      const result = builder.selectDescriptionVariant(locationMissing, true);
      expect(result).toBe('Full description');
    });

    test('should throw error if no description available', () => {
      const locationNoDesc = { descriptionVariants: {} };
      expect(() => builder.selectDescriptionVariant(locationNoDesc, true)).toThrow();
    });
  });

  describe('formatNPCs()', () => {
    test('should handle empty NPC array', () => {
      const result = builder.formatNPCs([], 100);
      expect(result.content).toBe('');
      expect(result.truncated).toBe(false);
    });

    test('should format single NPC', () => {
      const npcs = [{
        name: 'Ireena Kolyana',
        type: 'Human Noble',
        status: 'Alive',
        attitudeTowardPlayer: 'Friendly',
        description: 'A beautiful young woman with auburn hair.'
      }];
      const result = builder.formatNPCs(npcs, 1000);
      expect(result.content).toContain('Ireena Kolyana');
      expect(result.content).toContain('Human Noble');
      expect(result.content).toContain('Alive');
      expect(result.content).toContain('Friendly');
      expect(result.truncated).toBe(false);
    });

    test('should truncate NPCs when exceeding token budget', () => {
      const npcs = Array.from({ length: 10 }, (_, i) => ({
        name: `NPC ${i + 1}`,
        type: 'Human',
        status: 'Alive',
        attitudeTowardPlayer: 'Neutral',
        description: 'A'.repeat(200) // Long description
      }));
      const result = builder.formatNPCs(npcs, 100);
      expect(result.truncated).toBe(true);
    });

    test('should truncate long NPC descriptions to 200 chars', () => {
      const npcs = [{
        name: 'Test NPC',
        type: 'Human',
        status: 'Alive',
        attitudeTowardPlayer: 'Neutral',
        description: 'A'.repeat(300)
      }];
      const result = builder.formatNPCs(npcs, 1000);
      expect(result.content).toContain('...');
      expect(result.content.length).toBeLessThan(400);
    });
  });

  describe('formatItems()', () => {
    test('should handle empty items array', () => {
      const result = builder.formatItems([], 100);
      expect(result.content).toBe('');
      expect(result.truncated).toBe(false);
    });

    test('should format visible items', () => {
      const items = [
        { name: 'Sword', description: 'A rusty sword', hidden: false },
        { name: 'Shield', description: 'A wooden shield', hidden: false }
      ];
      const result = builder.formatItems(items, 1000);
      expect(result.content).toContain('Sword');
      expect(result.content).toContain('Shield');
      expect(result.content).toContain('Available Items');
      expect(result.truncated).toBe(false);
    });

    test('should format hidden items separately', () => {
      const items = [
        { name: 'Sword', description: 'A rusty sword', hidden: false },
        { name: 'Gem', description: 'A hidden gem', hidden: true, dc: 15 }
      ];
      const result = builder.formatItems(items, 1000);
      expect(result.content).toContain('Sword');
      expect(result.content).toContain('Gem');
      expect(result.content).toContain('DC 15');
      expect(result.content).toContain('Hidden Items');
    });

    test('should prioritize visible items over hidden when budget limited', () => {
      const items = [
        { name: 'Visible1', description: 'A'.repeat(50), hidden: false },
        { name: 'Visible2', description: 'A'.repeat(50), hidden: false },
        { name: 'Hidden1', description: 'A'.repeat(50), hidden: true, dc: 15 }
      ];
      const result = builder.formatItems(items, 50);
      expect(result.content).toContain('Visible1');
      expect(result.truncated).toBe(true);
    });
  });

  describe('truncateToTokenLimit()', () => {
    test('should not truncate if within limit', () => {
      const text = 'Short text';
      const result = builder.truncateToTokenLimit(text, 100);
      expect(result).toBe(text);
    });

    test('should truncate if exceeding limit', () => {
      const text = 'A'.repeat(1000);
      const result = builder.truncateToTokenLimit(text, 50);
      expect(result.length).toBeLessThan(text.length);
      expect(result).toContain('...');
    });
  });

  // ========================================================================
  // buildPrompt() Integration Tests
  // ========================================================================

  describe('buildPrompt()', () => {
    // Create minimal valid location data
    const createMockLocation = (options = {}) => ({
      locationId: 'test-location',
      locationName: 'Test Location',
      description: 'A test location for unit testing.',
      descriptionVariants: {
        initial: 'First time seeing this location.',
        return: 'You return to this familiar place.'
      },
      npcs: options.npcs || [],
      items: options.items || [],
      state: {
        weather: 'Overcast',
        locationStatus: 'Normal',
        changesSinceLastVisit: []
      },
      metadata: {
        discovered: options.discovered !== undefined ? options.discovered : false,
        first_visit_date: options.first_visit_date || null
      }
    });

    const mockCharacter = {
      characterId: 'char-1',
      name: 'Test Character',
      level: 5,
      class: 'Fighter',
      race: 'Human',
      hp: { current: 45, max: 50 }
    };

    test('should build prompt with minimal location (Priority 1 only)', () => {
      const location = createMockLocation();
      const prompt = builder.buildPrompt(location);

      expect(prompt).toBeDefined();
      expect(prompt.systemPrompt).toBeTruthy();
      expect(prompt.contextDescription).toBeTruthy();
      expect(prompt.metadata.estimatedTokens).toBeLessThan(3000);
    });

    test('should build prompt with character data', () => {
      const location = createMockLocation();
      const prompt = builder.buildPrompt(location, mockCharacter);

      expect(prompt.contextCharacter).toContain('Test Character');
    });

    test('should build prompt with recent actions', () => {
      const location = createMockLocation();
      const actions = [
        { actionId: '1', timestamp: '2025-01-01', locationId: 'test', description: 'Entered location' }
      ];
      const prompt = builder.buildPrompt(location, null, actions);

      expect(prompt.contextRecentActions).toContain('Entered location');
    });

    test('should include NPCs in Priority 2 content', () => {
      const location = createMockLocation({
        npcs: [
          { name: 'NPC 1', type: 'Human', status: 'Alive', attitudeTowardPlayer: 'Friendly', description: 'Test NPC' }
        ]
      });
      const prompt = builder.buildPrompt(location);

      expect(prompt.contextNPCs).toContain('NPC 1');
    });

    test('should include Items in Priority 2 content', () => {
      const location = createMockLocation({
        items: [
          { name: 'Test Item', description: 'A test item', hidden: false }
        ]
      });
      const prompt = builder.buildPrompt(location);

      expect(prompt.contextItems).toContain('Test Item');
    });

    test('should enforce token budget < 3000', () => {
      const location = createMockLocation();
      const prompt = builder.buildPrompt(location);

      expect(prompt.metadata.estimatedTokens).toBeLessThan(3000);
    });

    test('should handle large location with graceful degradation', () => {
      // Create location with many NPCs and items
      const manyNPCs = Array.from({ length: 20 }, (_, i) => ({
        name: `NPC ${i}`,
        type: 'Human',
        status: 'Alive',
        attitudeTowardPlayer: 'Neutral',
        description: 'A'.repeat(200)
      }));

      const manyItems = Array.from({ length: 50 }, (_, i) => ({
        name: `Item ${i}`,
        description: 'A'.repeat(100),
        hidden: false
      }));

      const location = createMockLocation({
        npcs: manyNPCs,
        items: manyItems
      });

      const prompt = builder.buildPrompt(location);

      // Should still be under budget
      expect(prompt.metadata.estimatedTokens).toBeLessThan(3000);

      // Should mark as truncated
      expect(prompt.metadata.priority2Truncated).toBe(true);
    });

    test('should limit recent actions to last 5', () => {
      const location = createMockLocation();
      const actions = Array.from({ length: 10 }, (_, i) => ({
        actionId: `${i}`,
        timestamp: '2025-01-01',
        locationId: 'test',
        description: `Action ${i + 1}`
      }));

      const prompt = builder.buildPrompt(location, null, actions);

      // Should only include last 5 (Actions 6-10)
      expect(prompt.contextRecentActions).toContain('1. Action 6');
      expect(prompt.contextRecentActions).toContain('5. Action 10');
      // Should NOT contain early actions
      expect(prompt.contextRecentActions).not.toContain('Action 1\n');
      expect(prompt.contextRecentActions).not.toContain('Action 2\n');
    });

    test('should select initial description variant for first visit', () => {
      const location = createMockLocation({ discovered: false });
      const prompt = builder.buildPrompt(location);

      expect(prompt.contextDescription).toContain('First time seeing');
    });

    test('should select return description variant for repeat visit', () => {
      const location = createMockLocation({
        discovered: true,
        first_visit_date: '2025-01-01'
      });
      const prompt = builder.buildPrompt(location);

      expect(prompt.contextDescription).toContain('familiar place');
    });

    test('should throw error if locationData is null', () => {
      expect(() => builder.buildPrompt(null)).toThrow('locationData is required');
    });

    test('should throw error if locationData missing required fields', () => {
      const invalidLocation = { locationId: 'test' };
      expect(() => builder.buildPrompt(invalidLocation)).toThrow();
    });

    test('should include metadata with token breakdown', () => {
      const location = createMockLocation();
      const prompt = builder.buildPrompt(location);

      expect(prompt.metadata.systemPromptTokens).toBeGreaterThan(0);
      expect(prompt.metadata.priority1Tokens).toBeGreaterThan(0);
      expect(prompt.metadata.generatedAt).toBeTruthy();
    });
  });
});
