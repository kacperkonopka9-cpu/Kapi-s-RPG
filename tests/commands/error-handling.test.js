/**
 * Test Suite 5: Error Handling
 *
 * Tests for error scenarios:
 * - Missing required arguments
 * - Invalid argument types
 * - No active session (when required)
 * - File I/O errors
 * - Epic system failures
 */

const fs = require('fs/promises');
const yaml = require('js-yaml');
const { CommandRegistry } = require('../../extensions/kapis-rpg-dm/src/commands/registry');
const { startSession } = require('../../extensions/kapis-rpg-dm/src/commands/start-session');
const { travel } = require('../../extensions/kapis-rpg-dm/src/commands/travel');

// Mock VS Code API
jest.mock('vscode', () => ({
  window: {
    showInformationMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    createOutputChannel: jest.fn(() => ({
      clear: jest.fn(),
      appendLine: jest.fn(),
      show: jest.fn()
    }))
  },
  workspace: {
    workspaceFolders: [{
      uri: { fsPath: '/mock/workspace' }
    }]
  },
  commands: {
    registerCommand: jest.fn()
  }
}));

describe('Error Handling', () => {
  let mockContext;

  beforeEach(() => {
    mockContext = {
      subscriptions: [],
      workspaceFolders: [{
        uri: { fsPath: '/mock/workspace' }
      }]
    };

    jest.clearAllMocks();
  });

  describe('Missing Arguments', () => {
    test('should return error for missing required arguments', async () => {
      const registry = new CommandRegistry(mockContext);

      const definition = {
        commandId: 'test.command',
        name: '/test',
        category: 'test',
        args: [
          { name: 'required1', type: 'string', required: true, description: 'Required arg' },
          { name: 'required2', type: 'string', required: true, description: 'Required arg' }
        ],
        handler: jest.fn(),
        requiresSession: false
      };

      registry.registerCommand(definition);

      // Call with only 1 argument (need 2)
      const result = await registry.executeCommand('test.command', 'arg1');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing required argument');
      expect(result.message).toContain('required2');
    });

    test('should provide usage hint for missing arguments', async () => {
      const registry = new CommandRegistry(mockContext);

      const definition = {
        commandId: 'test.command',
        name: '/test',
        category: 'test',
        args: [
          { name: 'location', type: 'string', required: true, description: 'Location ID' }
        ],
        handler: jest.fn(),
        requiresSession: false
      };

      registry.registerCommand(definition);

      const result = await registry.executeCommand('test.command');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Usage:');
      expect(result.message).toContain('/test');
      expect(result.message).toContain('location');
    });
  });

  describe('Invalid Argument Types', () => {
    test('should reject invalid argument type', async () => {
      const registry = new CommandRegistry(mockContext);

      const definition = {
        commandId: 'test.command',
        name: '/test',
        category: 'test',
        args: [
          { name: 'count', type: 'number', required: true, description: 'Count' }
        ],
        handler: jest.fn(),
        requiresSession: false
      };

      registry.registerCommand(definition);

      // Provide string when number expected
      const result = await registry.executeCommand('test.command', 'not-a-number');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid argument');
      expect(result.message).toContain('expected number');
      expect(result.message).toContain('got string');
    });

    test('should accept correct argument types', async () => {
      const registry = new CommandRegistry(mockContext);

      const mockHandler = jest.fn().mockResolvedValue({ success: true });

      const definition = {
        commandId: 'test.command',
        name: '/test',
        category: 'test',
        args: [
          { name: 'text', type: 'string', required: true, description: 'Text' },
          { name: 'count', type: 'number', required: true, description: 'Count' },
          { name: 'flag', type: 'boolean', required: true, description: 'Flag' }
        ],
        handler: mockHandler,
        requiresSession: false
      };

      registry.registerCommand(definition);

      const result = await registry.executeCommand('test.command', 'hello', 42, true);

      expect(result.success).toBe(true);
      expect(mockHandler).toHaveBeenCalledWith(mockContext, 'hello', 42, true);
    });
  });

  describe('Session Requirement', () => {
    test('should reject command requiring session when no session exists', async () => {
      const registry = new CommandRegistry(mockContext);

      const definition = {
        commandId: 'test.requiresSession',
        name: '/test',
        category: 'test',
        args: [],
        handler: jest.fn(),
        requiresSession: true
      };

      registry.registerCommand(definition);

      // Mock session file not found
      jest.spyOn(fs, 'access').mockRejectedValueOnce(new Error('File not found'));

      const result = await registry.executeCommand('test.requiresSession');

      expect(result.success).toBe(false);
      expect(result.message).toContain('No active session');
      expect(result.message).toContain('/start-session');
    });

    test('should allow command not requiring session when no session exists', async () => {
      const registry = new CommandRegistry(mockContext);

      const mockHandler = jest.fn().mockResolvedValue({ success: true });

      const definition = {
        commandId: 'test.noSession',
        name: '/test',
        category: 'test',
        args: [],
        handler: mockHandler,
        requiresSession: false
      };

      registry.registerCommand(definition);

      const result = await registry.executeCommand('test.noSession');

      expect(result.success).toBe(true);
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('File I/O Errors', () => {
    test('should handle character file read error', async () => {
      jest.spyOn(fs, 'readFile').mockRejectedValueOnce(new Error('Permission denied'));

      const result = await startSession(mockContext, 'village-of-barovia', 'kapi');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Character file not found');
    });

    test('should handle location metadata read error', async () => {
      const sessionState = {
        location: { currentLocationId: 'village-of-barovia' },
        character: { filePath: '/mock/characters/kapi.yaml' }
      };

      jest.spyOn(fs, 'readFile')
        .mockResolvedValueOnce(yaml.dump(sessionState)) // Session state loads
        .mockRejectedValueOnce(new Error('Disk I/O error')); // Metadata fails

      const result = await travel(mockContext, 'death-house');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to load location metadata');
    });

    test('should handle session write error', async () => {
      const validCharacter = {
        name: 'Kapi',
        level: 3,
        class: 'Warlock',
        hp: { current: 20, max: 24 }
      };

      jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(validCharacter));
      jest.spyOn(fs, 'access').mockResolvedValue(undefined);
      jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(fs, 'writeFile').mockRejectedValueOnce(new Error('Disk full'));

      const result = await startSession(mockContext, 'village-of-barovia', 'kapi');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Epic System Failures', () => {
    test('should handle ContextLoader failure', async () => {
      const validCharacter = {
        name: 'Kapi',
        level: 3,
        class: 'Warlock',
        hp: { current: 20, max: 24 }
      };

      const mockContextLoader = {
        loadContext: jest.fn().mockResolvedValue({
          success: false,
          error: 'Failed to load location data'
        })
      };

      jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(validCharacter));
      jest.spyOn(fs, 'access').mockResolvedValue(undefined);
      jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);

      jest.mock('../../../src/context/context-loader', () => mockContextLoader);

      const result = await startSession(mockContext, 'village-of-barovia', 'kapi');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to load context');
    });

    test('should handle CalendarManager failure', async () => {
      const sessionState = {
        location: {
          currentLocationId: 'village-of-barovia',
          visitedThisSession: ['village-of-barovia']
        },
        character: { filePath: '/mock/characters/kapi.yaml', name: 'Kapi' },
        calendar: { timePassed: '0 hours' }
      };

      const locationMetadata = {
        connections: ['death-house']
      };

      const mockCalendarManager = {
        advanceTime: jest.fn().mockResolvedValue({
          success: false,
          error: 'Calendar file corrupted'
        })
      };

      jest.spyOn(fs, 'readFile')
        .mockResolvedValueOnce(yaml.dump(sessionState))
        .mockResolvedValueOnce(yaml.dump(locationMetadata));

      jest.mock('../../../src/calendar/calendar-manager', () => mockCalendarManager);

      const result = await travel(mockContext, 'death-house');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to advance calendar');
    });
  });

  describe('Error Logging', () => {
    test('should log errors to error.log', async () => {
      const registry = new CommandRegistry(mockContext);

      const failingHandler = jest.fn().mockRejectedValue(new Error('Test error'));

      const definition = {
        commandId: 'test.failing',
        name: '/test',
        category: 'test',
        args: [],
        handler: failingHandler,
        requiresSession: false
      };

      registry.registerCommand(definition);

      const appendFileSpy = jest.spyOn(fs, 'appendFile').mockResolvedValue(undefined);

      await registry.executeCommand('test.failing');

      expect(appendFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('error.log'),
        expect.stringContaining('Test error'),
        'utf-8'
      );
    });

    test('should include command context in error log', async () => {
      const registry = new CommandRegistry(mockContext);

      const failingHandler = jest.fn().mockRejectedValue(new Error('Test error'));

      const definition = {
        commandId: 'test.failing',
        name: '/test',
        category: 'test',
        args: [
          { name: 'arg1', type: 'string', required: true, description: 'Test arg' }
        ],
        handler: failingHandler,
        requiresSession: false
      };

      registry.registerCommand(definition);

      const appendFileSpy = jest.spyOn(fs, 'appendFile').mockResolvedValue(undefined);

      await registry.executeCommand('test.failing', 'test-value');

      const logEntry = appendFileSpy.mock.calls[0][1];

      expect(logEntry).toContain('test.failing');
      expect(logEntry).toContain('test-value');
      expect(logEntry).toContain('Error: Test error');
      expect(logEntry).toContain('Stack:');
    });
  });
});
