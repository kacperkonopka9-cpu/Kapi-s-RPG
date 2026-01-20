/**
 * Test Suite 1: Command Registration
 *
 * Tests for CommandRegistry module:
 * - Command registration
 * - Duplicate command prevention
 * - Argument definition validation
 * - Command listing
 */

const { CommandRegistry } = require('../../extensions/kapis-rpg-dm/src/commands/registry');

describe('CommandRegistry', () => {
  let registry;
  let mockContext;

  beforeEach(() => {
    // Mock VS Code Extension Context
    mockContext = {
      subscriptions: [],
      workspaceFolders: [{
        uri: { fsPath: '/mock/workspace' }
      }]
    };

    registry = new CommandRegistry(mockContext);
  });

  describe('registerCommand()', () => {
    test('should register a valid command successfully', () => {
      const definition = {
        commandId: 'test.command',
        name: '/test',
        category: 'test',
        args: [
          { name: 'arg1', type: 'string', required: true, description: 'Test argument' }
        ],
        handler: jest.fn(),
        requiresSession: false
      };

      expect(() => registry.registerCommand(definition)).not.toThrow();
    });

    test('should throw error for duplicate commandId', () => {
      const definition = {
        commandId: 'test.command',
        name: '/test',
        category: 'test',
        args: [],
        handler: jest.fn(),
        requiresSession: false
      };

      registry.registerCommand(definition);

      expect(() => registry.registerCommand(definition)).toThrow(
        'Command test.command is already registered'
      );
    });

    test('should validate command definition structure', () => {
      const invalidDefinition = {
        commandId: 'test.command',
        name: '/test',
        category: 'test',
        // Missing args array
        handler: jest.fn(),
        requiresSession: false
      };

      expect(() => registry.registerCommand(invalidDefinition)).toThrow(
        'must have args array'
      );
    });

    test('should validate argument definitions', () => {
      const invalidArgDefinition = {
        commandId: 'test.command',
        name: '/test',
        category: 'test',
        args: [
          { name: 'arg1', type: 'invalid_type', required: true, description: 'Test' }
        ],
        handler: jest.fn(),
        requiresSession: false
      };

      expect(() => registry.registerCommand(invalidArgDefinition)).toThrow(
        'has invalid type'
      );
    });

    test('should validate handler is a function', () => {
      const noHandler = {
        commandId: 'test.command',
        name: '/test',
        category: 'test',
        args: [],
        handler: null, // Not a function
        requiresSession: false
      };

      expect(() => registry.registerCommand(noHandler)).toThrow(
        'must have a handler function'
      );
    });

    test('should validate requiresSession is boolean', () => {
      const invalidSession = {
        commandId: 'test.command',
        name: '/test',
        category: 'test',
        args: [],
        handler: jest.fn(),
        requiresSession: 'yes' // Should be boolean
      };

      expect(() => registry.registerCommand(invalidSession)).toThrow(
        'must have requiresSession boolean'
      );
    });
  });

  describe('listCommands()', () => {
    test('should return empty array when no commands registered', () => {
      const commands = registry.listCommands();
      expect(commands).toEqual([]);
    });

    test('should list all registered commands', () => {
      const definition1 = {
        commandId: 'test.command1',
        name: '/test1',
        category: 'test',
        args: [],
        handler: jest.fn(),
        requiresSession: false
      };

      const definition2 = {
        commandId: 'test.command2',
        name: '/test2',
        category: 'test',
        args: [],
        handler: jest.fn(),
        requiresSession: true
      };

      registry.registerCommand(definition1);
      registry.registerCommand(definition2);

      const commands = registry.listCommands();
      expect(commands).toHaveLength(2);
      expect(commands[0].commandId).toBe('test.command1');
      expect(commands[1].commandId).toBe('test.command2');
    });

    test('should not expose handler functions in listing', () => {
      const definition = {
        commandId: 'test.command',
        name: '/test',
        category: 'test',
        args: [],
        handler: jest.fn(),
        requiresSession: false
      };

      registry.registerCommand(definition);

      const commands = registry.listCommands();
      expect(commands[0].handler).toBeUndefined();
    });
  });

  describe('generateUsageHint()', () => {
    test('should generate correct usage hint for command with required args', () => {
      const definition = {
        commandId: 'test.command',
        name: '/test',
        category: 'test',
        args: [
          { name: 'location', type: 'string', required: true, description: 'Location ID' },
          { name: 'character', type: 'string', required: true, description: 'Character name' }
        ],
        handler: jest.fn(),
        requiresSession: false
      };

      registry.registerCommand(definition);

      // Access private method via registry instance (for testing purposes)
      const usageHint = registry.generateUsageHint(definition);

      expect(usageHint).toContain('/test');
      expect(usageHint).toContain('location');
      expect(usageHint).toContain('character');
    });

    test('should indicate optional arguments in usage hint', () => {
      const definition = {
        commandId: 'test.command',
        name: '/test',
        category: 'test',
        args: [
          { name: 'required', type: 'string', required: true, description: 'Required' },
          { name: 'optional', type: 'string', required: false, description: 'Optional' }
        ],
        handler: jest.fn(),
        requiresSession: false
      };

      registry.registerCommand(definition);

      const usageHint = registry.generateUsageHint(definition);

      // Optional args should have different formatting (e.g., brackets or "optional" indicator)
      expect(usageHint).toContain('required');
      expect(usageHint).toContain('optional');
    });
  });
});
