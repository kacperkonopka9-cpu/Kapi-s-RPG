/**
 * Unit Tests for LLMNarrator
 * Story 1.5: LLM Narrator Integration - Task 10
 *
 * Requirements:
 * - AC-14: Test coverage ≥ 90% for LLMNarrator module
 * - Mock VS Code Extension API
 * - Test all critical paths and error scenarios
 */

const { LLMNarrator } = require('../../src/core/llm-narrator');

// Mock VS Code Extension API
global.vscode = {
  extensions: {
    getExtension: jest.fn()
  },
  commands: {
    executeCommand: jest.fn()
  }
};

describe('LLMNarrator', () => {
  let narrator;
  let mockExtension;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock extension
    mockExtension = {
      isActive: true,
      activate: jest.fn().mockResolvedValue(undefined)
    };

    // Mock extension detection
    vscode.extensions.getExtension.mockReturnValue(mockExtension);

    // Create narrator instance
    narrator = new LLMNarrator();
  });

  describe('Constructor and Extension Detection', () => {
    test('should detect Claude Code extension successfully', () => {
      expect(vscode.extensions.getExtension).toHaveBeenCalledWith('anthropic.claude-code');
      expect(narrator.claudeCodeExtension).toBe(mockExtension);
    });

    test('should throw error if extension not found', () => {
      vscode.extensions.getExtension.mockReturnValue(undefined);

      expect(() => new LLMNarrator()).toThrow('Claude Code extension not found');
      expect(() => new LLMNarrator()).toThrow('anthropic.claude-code');
    });

    test('should initialize retry configuration', () => {
      expect(narrator.retryConfig).toEqual({
        maxRetries: 3,
        backoffDelays: [1000, 2000, 4000]
      });
    });

    test('should initialize performance log', () => {
      expect(narrator.performanceLog).toEqual([]);
    });
  });

  describe('isClaudeCodeAvailable()', () => {
    test('should return true when extension is active', async () => {
      const available = await narrator.isClaudeCodeAvailable();
      expect(available).toBe(true);
    });

    test('should return false when extension is not active', async () => {
      narrator.claudeCodeExtension.isActive = false;
      const available = await narrator.isClaudeCodeAvailable();
      expect(available).toBe(false);
    });

    test('should return false when extension is null', async () => {
      narrator.claudeCodeExtension = null;
      const available = await narrator.isClaudeCodeAvailable();
      expect(available).toBe(false);
    });

    test('should handle errors gracefully', async () => {
      narrator.claudeCodeExtension = {
        get isActive() {
          throw new Error('Test error');
        }
      };

      const available = await narrator.isClaudeCodeAvailable();
      expect(available).toBe(false);
    });
  });

  describe('testConnection()', () => {
    test('should return true on successful connection', async () => {
      vscode.commands.executeCommand.mockResolvedValue({
        content: 'Connection successful',
        usage: { total_tokens: 10 }
      });

      const result = await narrator.testConnection();
      expect(result).toBe(true);
    });

    test('should return false on connection failure', async () => {
      vscode.commands.executeCommand.mockRejectedValue(new Error('Connection failed'));

      const result = await narrator.testConnection();
      expect(result).toBe(false);
    });
  });

  describe('generateNarrative()', () => {
    const mockPrompt = {
      systemPrompt: 'Test system prompt',
      contextDescription: 'Test location',
      contextCharacter: 'Test character',
      contextRecentActions: 'Test actions',
      contextNPCs: 'Test NPCs',
      contextItems: 'Test items',
      metadata: {
        estimatedTokens: 500,
        systemPromptTokens: 100,
        priority1Tokens: 300,
        priority2Tokens: 100,
        priority2Truncated: false,
        generatedAt: '2025-11-05T00:00:00.000Z'
      }
    };

    test('should generate narrative successfully', async () => {
      const mockResponse = {
        content: 'You enter a dark room...',
        usage: { total_tokens: 150 }
      };

      vscode.commands.executeCommand.mockResolvedValue(mockResponse);

      const result = await narrator.generateNarrative(mockPrompt);

      expect(result).toMatchObject({
        narrative: 'You enter a dark room...',
        tokensUsed: 150
      });
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeTruthy();
      expect(result.requestId).toBeTruthy();
    });

    test('should retry on failure with exponential backoff', async () => {
      vscode.commands.executeCommand
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValueOnce({
          content: 'Success on third attempt',
          usage: { total_tokens: 100 }
        });

      const result = await narrator.generateNarrative(mockPrompt);

      expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(3);
      expect(result.narrative).toBe('Success on third attempt');
    });

    test('should throw error after max retries', async () => {
      vscode.commands.executeCommand.mockRejectedValue(new Error('Always fails'));

      await expect(narrator.generateNarrative(mockPrompt)).rejects.toThrow(
        'Claude Code extension failed after 3 attempts'
      );

      expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(3);
    });

    test('should include request ID in error', async () => {
      vscode.commands.executeCommand.mockRejectedValue(new Error('Test error'));

      try {
        await narrator.generateNarrative(mockPrompt);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain('Request ID:');
        expect(error.requestId).toBeTruthy();
      }
    });

    test('should warn if prompt exceeds token budget', async () => {
      const largePrompt = {
        ...mockPrompt,
        metadata: {
          ...mockPrompt.metadata,
          estimatedTokens: 3500
        }
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      vscode.commands.executeCommand.mockResolvedValue({
        content: 'Response',
        usage: { total_tokens: 100 }
      });

      await narrator.generateNarrative(largePrompt);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('exceeds 3000 token budget')
      );

      consoleSpy.mockRestore();
    });

    test('should warn if response time exceeds 5 seconds', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock slow response (simulate 6 seconds)
      vscode.commands.executeCommand.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              content: 'Slow response',
              usage: { total_tokens: 100 }
            });
          }, 6000);
        });
      });

      await narrator.generateNarrative(mockPrompt);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('exceeded 5s target')
      );

      consoleSpy.mockRestore();
    }, 10000); // Increase test timeout to 10s

    test('should call Claude Code with correct parameters', async () => {
      vscode.commands.executeCommand.mockResolvedValue({
        content: 'Test response',
        usage: { total_tokens: 100 }
      });

      await narrator.generateNarrative(mockPrompt);

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'claude-code.sendMessage',
        expect.objectContaining({
          system: expect.stringContaining('Dungeon Master'),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Test location')
            })
          ]),
          max_tokens: 4096,
          temperature: 0.7
        })
      );
    });
  });

  describe('_buildSystemPrompt()', () => {
    test('should include DM persona', () => {
      const systemPrompt = narrator._buildSystemPrompt();

      expect(systemPrompt).toContain('Dungeon Master');
      expect(systemPrompt).toContain('Curse of Strahd');
      expect(systemPrompt).toContain('D&D 5e');
    });

    test('should include narrative instructions', () => {
      const systemPrompt = narrator._buildSystemPrompt();

      expect(systemPrompt).toContain('second-person perspective');
      expect(systemPrompt).toContain('immersive');
      expect(systemPrompt).toContain('atmospheric');
    });

    test('should include tone guidance', () => {
      const systemPrompt = narrator._buildSystemPrompt();

      expect(systemPrompt).toContain('gothic horror');
      expect(systemPrompt).toContain('Hope vs. Despair');
    });
  });

  describe('_formatPromptForClaude()', () => {
    test('should format location description', () => {
      const prompt = {
        contextDescription: 'A dark castle',
        contextCharacter: '',
        contextRecentActions: '',
        contextNPCs: '',
        contextItems: '',
        metadata: { priority2Truncated: false }
      };

      const formatted = narrator._formatPromptForClaude(prompt);

      expect(formatted).toContain('Current Location');
      expect(formatted).toContain('A dark castle');
    });

    test('should include all Priority 1 content', () => {
      const prompt = {
        contextDescription: 'Location',
        contextCharacter: 'Character',
        contextRecentActions: 'Actions',
        contextNPCs: 'NPCs',
        contextItems: 'Items',
        metadata: { priority2Truncated: false }
      };

      const formatted = narrator._formatPromptForClaude(prompt);

      expect(formatted).toContain('Location');
      expect(formatted).toContain('Character');
      expect(formatted).toContain('Actions');
    });

    test('should exclude Priority 2 content if truncated', () => {
      const prompt = {
        contextDescription: 'Location',
        contextCharacter: 'Character',
        contextRecentActions: 'Actions',
        contextNPCs: 'NPCs',
        contextItems: 'Items',
        metadata: { priority2Truncated: true }
      };

      const formatted = narrator._formatPromptForClaude(prompt);

      expect(formatted).toContain('Location');
      expect(formatted).not.toContain('NPCs');
      expect(formatted).not.toContain('Items');
    });
  });

  describe('Performance Logging', () => {
    test('should log performance metrics', async () => {
      vscode.commands.executeCommand.mockResolvedValue({
        content: 'Response',
        usage: { total_tokens: 100 }
      });

      const mockPrompt = {
        contextDescription: 'Test',
        contextCharacter: '',
        contextRecentActions: '',
        contextNPCs: '',
        contextItems: '',
        metadata: {
          estimatedTokens: 500,
          systemPromptTokens: 100,
          priority1Tokens: 300,
          priority2Tokens: 100,
          priority2Truncated: false,
          generatedAt: '2025-11-05T00:00:00.000Z'
        }
      };

      await narrator.generateNarrative(mockPrompt);

      expect(narrator.performanceLog.length).toBe(1);
      expect(narrator.performanceLog[0]).toMatchObject({
        responseTime: expect.any(Number),
        estimatedTokens: 500,
        actualTokens: 100,
        exceededTarget: expect.any(Boolean)
      });
    });

    test('should maintain max 100 log entries', async () => {
      vscode.commands.executeCommand.mockResolvedValue({
        content: 'Response',
        usage: { total_tokens: 100 }
      });

      const mockPrompt = {
        contextDescription: 'Test',
        contextCharacter: '',
        contextRecentActions: '',
        contextNPCs: '',
        contextItems: '',
        metadata: {
          estimatedTokens: 500,
          systemPromptTokens: 100,
          priority1Tokens: 300,
          priority2Tokens: 100,
          priority2Truncated: false,
          generatedAt: '2025-11-05T00:00:00.000Z'
        }
      };

      // Generate 150 requests
      for (let i = 0; i < 150; i++) {
        await narrator.generateNarrative(mockPrompt);
      }

      expect(narrator.performanceLog.length).toBe(100);
    });
  });

  describe('getPerformanceStats()', () => {
    test('should return stats with no requests', () => {
      const stats = narrator.getPerformanceStats();
      expect(stats).toEqual({ requestCount: 0 });
    });

    test('should calculate performance statistics', async () => {
      vscode.commands.executeCommand.mockResolvedValue({
        content: 'Response',
        usage: { total_tokens: 100 }
      });

      const mockPrompt = {
        contextDescription: 'Test',
        contextCharacter: '',
        contextRecentActions: '',
        contextNPCs: '',
        contextItems: '',
        metadata: {
          estimatedTokens: 500,
          systemPromptTokens: 100,
          priority1Tokens: 300,
          priority2Tokens: 100,
          priority2Truncated: false,
          generatedAt: '2025-11-05T00:00:00.000Z'
        }
      };

      // Make several requests
      for (let i = 0; i < 10; i++) {
        await narrator.generateNarrative(mockPrompt);
      }

      const stats = narrator.getPerformanceStats();

      expect(stats.requestCount).toBe(10);
      expect(stats.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(stats.percentile95).toBeGreaterThanOrEqual(0);
      expect(stats.exceedingTarget).toBeGreaterThanOrEqual(0);
      expect(stats.exceedingTargetPercent).toBeGreaterThanOrEqual(0);
    });
  });
});
