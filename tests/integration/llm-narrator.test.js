/**
 * Integration Tests for LLM Narrator
 * Story 1.5: LLM Narrator Integration - Task 11
 *
 * Tests complete workflow: LocationLoader → ContextBuilder → LLMNarrator
 * Uses real ContextBuilder and LocationLoader, mocks Claude Code responses
 *
 * Requirements:
 * - AC-8: Complete workflow testing
 * - AC-15: ContextBuilder integration
 * - Performance targets (< 5s for 95% of responses)
 * - Session state preservation through errors
 */

const { LLMNarrator } = require('../../src/core/llm-narrator');
const { SessionManager } = require('../../src/core/session-manager');
const { ContextBuilder } = require('../../src/core/context-builder');
const { LocationLoader } = require('../../src/data/location-loader');

// Mock VS Code Extension API
global.vscode = {
  extensions: {
    getExtension: jest.fn()
  },
  commands: {
    executeCommand: jest.fn()
  }
};

describe('LLM Narrator Integration Tests', () => {
  let narrator;
  let sessionManager;
  let contextBuilder;
  let locationLoader;
  let mockExtension;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock extension
    mockExtension = {
      isActive: true,
      activate: jest.fn().mockResolvedValue(undefined)
    };

    vscode.extensions.getExtension.mockReturnValue(mockExtension);

    // Initialize components
    narrator = new LLMNarrator();
    sessionManager = new SessionManager();
    contextBuilder = new ContextBuilder();
    locationLoader = new LocationLoader();

    // Mock Claude Code responses
    vscode.commands.executeCommand.mockResolvedValue({
      content: 'You find yourself in a dimly lit room, shadows dancing across ancient stone walls...',
      usage: { total_tokens: 120 }
    });
  });

  describe('Complete Workflow: ContextBuilder → LLMNarrator', () => {
    test('should generate narrative from location data', async () => {
      // Load test location
      const location = await locationLoader.loadLocation('test-location-1');

      // Build prompt using ContextBuilder
      const prompt = contextBuilder.buildPrompt(location, null, []);

      // Verify prompt structure
      expect(prompt).toMatchObject({
        systemPrompt: expect.any(String),
        contextDescription: expect.any(String),
        metadata: expect.objectContaining({
          estimatedTokens: expect.any(Number)
        })
      });

      // Generate narrative
      const response = await narrator.generateNarrative(prompt);

      // Verify response
      expect(response).toMatchObject({
        narrative: expect.any(String),
        tokensUsed: expect.any(Number),
        responseTime: expect.any(Number),
        timestamp: expect.any(String),
        requestId: expect.any(String)
      });

      expect(response.narrative.length).toBeGreaterThan(0);
    });

    test('should respect token budget from ContextBuilder', async () => {
      const location = await locationLoader.loadLocation('test-location-1');
      const prompt = contextBuilder.buildPrompt(location, null, []);

      // Verify token budget constraint (AC-8)
      expect(prompt.metadata.estimatedTokens).toBeLessThan(3000);

      const response = await narrator.generateNarrative(prompt);

      expect(response.tokensUsed).toBeGreaterThan(0);
    });

    test('should handle various location sizes', async () => {
      const locations = ['test-location-1', 'test-location-2'];

      for (const locationId of locations) {
        const location = await locationLoader.loadLocation(locationId);
        const prompt = contextBuilder.buildPrompt(location, null, []);
        const response = await narrator.generateNarrative(prompt);

        expect(response.narrative).toBeTruthy();
        expect(prompt.metadata.estimatedTokens).toBeLessThan(3000);
      }
    });
  });

  describe('Session Integration', () => {
    test('should integrate with SessionManager for action tracking', async () => {
      // Start session
      sessionManager.startSession('test-location-1');

      // Load location
      const location = await locationLoader.loadLocation('test-location-1');

      // Record first action
      sessionManager.recordAction({
        description: 'Look around the room'
      });

      // Get recent actions for context
      const recentActions = sessionManager.getRecentActions();

      // Build prompt with actions
      const prompt = contextBuilder.buildPrompt(location, null, recentActions);

      // Generate narrative
      const response = await narrator.generateNarrative(prompt);

      // Store narrative with action
      const actions = sessionManager.getRecentActions();
      expect(actions.length).toBe(1);
      expect(actions[0].description).toBe('Look around the room');

      // Session should still be active
      expect(sessionManager.hasActiveSession()).toBe(true);
    });

    test('should preserve session state through LLM errors', async () => {
      // Start session with actions
      sessionManager.startSession('test-location-1');
      sessionManager.recordAction({ description: 'Action 1' });
      sessionManager.recordAction({ description: 'Action 2' });

      const sessionBefore = sessionManager.getCurrentSession();

      // Mock LLM failure
      vscode.commands.executeCommand.mockRejectedValue(
        new Error('Claude Code connection failed')
      );

      // Attempt to generate narrative
      const location = await locationLoader.loadLocation('test-location-1');
      const prompt = contextBuilder.buildPrompt(location, null, []);

      try {
        await narrator.generateNarrative(prompt);
        fail('Should have thrown error');
      } catch (error) {
        // Session state should be preserved (AC-12)
        const sessionAfter = sessionManager.getCurrentSession();

        expect(sessionAfter).toEqual(sessionBefore);
        expect(sessionAfter.actionCount).toBe(2);
        expect(sessionManager.hasActiveSession()).toBe(true);
      }
    });
  });

  describe('Performance Testing (AC-13)', () => {
    test('should complete 95% of responses under 5 seconds', async () => {
      const location = await locationLoader.loadLocation('test-location-1');
      const responseTimes = [];

      // Generate 20 narratives
      for (let i = 0; i < 20; i++) {
        const prompt = contextBuilder.buildPrompt(location, null, []);
        const response = await narrator.generateNarrative(prompt);
        responseTimes.push(response.responseTime);
      }

      // Calculate 95th percentile
      responseTimes.sort((a, b) => a - b);
      const percentile95 = responseTimes[Math.floor(responseTimes.length * 0.95)];

      // 95% should be under 5000ms (AC-8)
      expect(percentile95).toBeLessThan(5000);
    });

    test('should track performance metrics', async () => {
      const location = await locationLoader.loadLocation('test-location-1');

      // Generate several narratives
      for (let i = 0; i < 5; i++) {
        const prompt = contextBuilder.buildPrompt(location, null, []);
        await narrator.generateNarrative(prompt);
      }

      const stats = narrator.getPerformanceStats();

      expect(stats.requestCount).toBe(5);
      expect(stats.averageResponseTime).toBeGreaterThan(0);
      expect(stats.percentile95).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery (AC-8, AC-12)', () => {
    test('should retry on transient failures', async () => {
      const location = await locationLoader.loadLocation('test-location-1');
      const prompt = contextBuilder.buildPrompt(location, null, []);

      // Mock: fail twice, succeed on third attempt
      vscode.commands.executeCommand
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Rate limit'))
        .mockResolvedValueOnce({
          content: 'Success after retries',
          usage: { total_tokens: 100 }
        });

      const response = await narrator.generateNarrative(prompt);

      expect(response.narrative).toBe('Success after retries');
      expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(3);
    });

    test('should provide clear error messages after max retries', async () => {
      const location = await locationLoader.loadLocation('test-location-1');
      const prompt = contextBuilder.buildPrompt(location, null, []);

      // Mock: always fail
      vscode.commands.executeCommand.mockRejectedValue(
        new Error('Extension not responding')
      );

      try {
        await narrator.generateNarrative(prompt);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain('Claude Code extension failed after 3 attempts');
        expect(error.message).toContain('Request ID:');
        expect(error.requestId).toBeTruthy();
      }
    });

    test('should handle malformed responses', async () => {
      const location = await locationLoader.loadLocation('test-location-1');
      const prompt = contextBuilder.buildPrompt(location, null, []);

      // Mock: return malformed response then valid one
      vscode.commands.executeCommand
        .mockResolvedValueOnce({
          // Missing content field
          usage: { total_tokens: 100 }
        })
        .mockResolvedValueOnce({
          content: 'Valid response after error',
          usage: { total_tokens: 100 }
        });

      const response = await narrator.generateNarrative(prompt);

      // Should recover and return valid response
      expect(response.narrative).toBeTruthy();
    });
  });

  describe('System Prompt Integration (AC-11)', () => {
    test('should include DM persona in prompts', async () => {
      const location = await locationLoader.loadLocation('test-location-1');
      const prompt = contextBuilder.buildPrompt(location, null, []);

      await narrator.generateNarrative(prompt);

      // Verify Claude Code was called with correct system prompt
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'claude-code.sendMessage',
        expect.objectContaining({
          system: expect.stringContaining('Dungeon Master'),
          max_tokens: 4096,
          temperature: 0.7
        })
      );

      const callArgs = vscode.commands.executeCommand.mock.calls[0][1];
      expect(callArgs.system).toContain('Curse of Strahd');
      expect(callArgs.system).toContain('gothic horror');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty recent actions', async () => {
      const location = await locationLoader.loadLocation('test-location-1');
      const prompt = contextBuilder.buildPrompt(location, null, []);

      const response = await narrator.generateNarrative(prompt);

      expect(response.narrative).toBeTruthy();
    });

    test('should handle null character data', async () => {
      const location = await locationLoader.loadLocation('test-location-1');
      const prompt = contextBuilder.buildPrompt(location, null, []);

      const response = await narrator.generateNarrative(prompt);

      expect(response.narrative).toBeTruthy();
    });

    test('should handle location with minimal content', async () => {
      // Create minimal location
      const minimalLocation = {
        locationId: 'minimal-loc',
        locationName: 'Empty Room',
        description: 'An empty room.',
        descriptionVariants: {},
        npcs: [],
        items: [],
        events: [],
        state: {},
        metadata: {}
      };

      const prompt = contextBuilder.buildPrompt(minimalLocation, null, []);
      const response = await narrator.generateNarrative(prompt);

      expect(response.narrative).toBeTruthy();
      expect(prompt.metadata.estimatedTokens).toBeLessThan(3000);
    });
  });

  describe('Concurrent Requests', () => {
    test('should handle multiple concurrent narrative generations', async () => {
      const location = await locationLoader.loadLocation('test-location-1');

      // Generate 5 narratives concurrently
      const promises = [];
      for (let i = 0; i < 5; i++) {
        const prompt = contextBuilder.buildPrompt(location, null, []);
        promises.push(narrator.generateNarrative(prompt));
      }

      const responses = await Promise.all(promises);

      expect(responses.length).toBe(5);
      responses.forEach(response => {
        expect(response.narrative).toBeTruthy();
        expect(response.requestId).toBeTruthy();
      });

      // All request IDs should be unique
      const requestIds = responses.map(r => r.requestId);
      const uniqueIds = new Set(requestIds);
      expect(uniqueIds.size).toBe(5);
    });
  });
});
