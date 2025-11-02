/**
 * Unit tests for CommandRouter
 * Tests command parsing and routing logic
 */

const { CommandRouter } = require('../../src/commands/router');

describe('CommandRouter', () => {
  let router;

  beforeEach(() => {
    router = new CommandRouter();
  });

  // ========================================================================
  // Constructor Tests
  // ========================================================================

  describe('Constructor', () => {
    test('should initialize with empty handlers', () => {
      expect(router.handlers.size).toBe(0);
    });

    test('should store dependencies', () => {
      const deps = { test: 'value' };
      const routerWithDeps = new CommandRouter(deps);
      expect(routerWithDeps.dependencies).toEqual(deps);
    });
  });

  // ========================================================================
  // parseCommand() Tests
  // ========================================================================

  describe('parseCommand()', () => {
    test('should parse command without slash', () => {
      const result = router.parseCommand('start-session');
      expect(result).toEqual({ command: 'start-session', args: [] });
    });

    test('should parse command with slash', () => {
      const result = router.parseCommand('/start-session');
      expect(result).toEqual({ command: 'start-session', args: [] });
    });

    test('should parse command with single argument', () => {
      const result = router.parseCommand('/travel village-of-barovia');
      expect(result).toEqual({
        command: 'travel',
        args: ['village-of-barovia']
      });
    });

    test('should parse command with multiple arguments', () => {
      const result = router.parseCommand('/test arg1 arg2 arg3');
      expect(result).toEqual({
        command: 'test',
        args: ['arg1', 'arg2', 'arg3']
      });
    });

    test('should handle extra whitespace', () => {
      const result = router.parseCommand('  /travel   village-of-barovia  ');
      expect(result).toEqual({
        command: 'travel',
        args: ['village-of-barovia']
      });
    });

    test('should convert command to lowercase', () => {
      const result = router.parseCommand('/START-SESSION');
      expect(result.command).toBe('start-session');
    });

    test('should throw error for non-string input', () => {
      expect(() => router.parseCommand(null)).toThrow('Command must be a string');
      expect(() => router.parseCommand(undefined)).toThrow('Command must be a string');
      expect(() => router.parseCommand(123)).toThrow('Command must be a string');
    });

    test('should handle empty string', () => {
      const result = router.parseCommand('');
      expect(result).toEqual({ command: '', args: [] });
    });
  });

  // ========================================================================
  // registerHandler() Tests
  // ========================================================================

  describe('registerHandler()', () => {
    test('should register a handler function', () => {
      const handler = jest.fn();
      router.registerHandler('test', handler);
      expect(router.handlers.has('test')).toBe(true);
      expect(router.handlers.get('test')).toBe(handler);
    });

    test('should normalize command name to lowercase', () => {
      const handler = jest.fn();
      router.registerHandler('TEST-COMMAND', handler);
      expect(router.handlers.has('test-command')).toBe(true);
    });

    test('should throw error for non-function handler', () => {
      expect(() => router.registerHandler('test', 'not a function')).toThrow(
        'Handler for test must be a function'
      );
      expect(() => router.registerHandler('test', null)).toThrow();
      expect(() => router.registerHandler('test', {})).toThrow();
    });

    test('should allow overwriting existing handler', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      router.registerHandler('test', handler1);
      router.registerHandler('test', handler2);
      expect(router.handlers.get('test')).toBe(handler2);
    });
  });

  // ========================================================================
  // routeCommand() Tests
  // ========================================================================

  describe('routeCommand()', () => {
    test('should call handler with dependencies and args', async () => {
      const handler = jest.fn().mockResolvedValue('result');
      const deps = { test: 'value' };
      router = new CommandRouter(deps);
      router.registerHandler('test', handler);

      const result = await router.routeCommand('test', ['arg1', 'arg2']);

      expect(handler).toHaveBeenCalledWith(deps, ['arg1', 'arg2']);
      expect(result).toBe('result');
    });

    test('should normalize command name to lowercase', async () => {
      const handler = jest.fn().mockResolvedValue('result');
      router.registerHandler('test', handler);

      await router.routeCommand('TEST', []);
      expect(handler).toHaveBeenCalled();
    });

    test('should throw error for unknown command', async () => {
      await expect(router.routeCommand('unknown', [])).rejects.toThrow('Unknown command: unknown');
    });

    test('should use empty array as default args', async () => {
      const handler = jest.fn().mockResolvedValue('result');
      router.registerHandler('test', handler);

      await router.routeCommand('test');
      expect(handler).toHaveBeenCalledWith({}, []);
    });

    test('should propagate handler errors with context', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Handler error'));
      router.registerHandler('test', handler);

      await expect(router.routeCommand('test', [])).rejects.toThrow(
        "Command 'test' failed: Handler error"
      );
    });

    test('should handle async handlers', async () => {
      const handler = async (deps, args) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return `processed ${args[0]}`;
      };
      router.registerHandler('test', handler);

      const result = await router.routeCommand('test', ['data']);
      expect(result).toBe('processed data');
    });
  });

  // ========================================================================
  // getRegisteredCommands() Tests
  // ========================================================================

  describe('getRegisteredCommands()', () => {
    test('should return empty array when no commands registered', () => {
      expect(router.getRegisteredCommands()).toEqual([]);
    });

    test('should return all registered command names', () => {
      router.registerHandler('start-session', jest.fn());
      router.registerHandler('travel', jest.fn());
      router.registerHandler('look', jest.fn());

      const commands = router.getRegisteredCommands();
      expect(commands).toHaveLength(3);
      expect(commands).toContain('start-session');
      expect(commands).toContain('travel');
      expect(commands).toContain('look');
    });
  });
});
