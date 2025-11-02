/**
 * CommandRouter - Parse and route slash commands to appropriate handlers
 * Based on Epic 1 Technical Specification AC-8
 *
 * @module CommandRouter
 * @example
 * // Basic usage
 * const { CommandRouter } = require('./router');
 * const router = new CommandRouter();
 *
 * // Register handlers
 * router.registerHandler('start-session', startSessionHandler);
 * router.registerHandler('travel', travelHandler);
 *
 * // Route commands
 * await router.routeCommand('start-session', []);
 * await router.routeCommand('travel', ['village-of-barovia']);
 */

/**
 * @typedef {Object} ParsedCommand
 * @property {string} command - Command name (e.g., 'start-session', 'travel')
 * @property {string[]} args - Command arguments
 */

/**
 * CommandRouter class
 * Parses slash commands and routes them to registered handlers
 */
class CommandRouter {
  /**
   * Create a new CommandRouter
   * @param {Object} dependencies - Injected dependencies for handlers
   */
  constructor(dependencies = {}) {
    this.handlers = new Map();
    this.dependencies = dependencies;
  }

  /**
   * Parse a command string into command and arguments
   * @param {string} commandString - Raw command string (e.g., "/travel village-of-barovia")
   * @returns {ParsedCommand} Parsed command object
   *
   * @example
   * router.parseCommand('/start-session')
   * // Returns: { command: 'start-session', args: [] }
   *
   * router.parseCommand('/travel village-of-barovia')
   * // Returns: { command: 'travel', args: ['village-of-barovia'] }
   */
  parseCommand(commandString) {
    if (typeof commandString !== 'string') {
      throw new Error('Command must be a string');
    }

    // Remove leading slash if present
    let normalized = commandString.trim();
    if (normalized.startsWith('/')) {
      normalized = normalized.substring(1);
    }

    // Split into command and arguments
    const parts = normalized.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    return { command, args };
  }

  /**
   * Register a command handler
   * @param {string} commandName - Command name (without slash)
   * @param {Function} handler - Handler function
   *
   * @example
   * router.registerHandler('start-session', async (deps, args) => {
   *   // Handler implementation
   * });
   */
  registerHandler(commandName, handler) {
    if (typeof handler !== 'function') {
      throw new Error(`Handler for ${commandName} must be a function`);
    }

    this.handlers.set(commandName.toLowerCase(), handler);
  }

  /**
   * Route a command to its handler
   * @param {string} command - Command name
   * @param {string[]} args - Command arguments
   * @returns {Promise<any>} Handler result
   * @throws {Error} If command not found or handler fails
   *
   * @example
   * await router.routeCommand('start-session', []);
   * await router.routeCommand('travel', ['village-of-barovia']);
   */
  async routeCommand(command, args = []) {
    const handler = this.handlers.get(command.toLowerCase());

    if (!handler) {
      throw new Error(`Unknown command: ${command}`);
    }

    try {
      return await handler(this.dependencies, args);
    } catch (error) {
      // Re-throw with command context
      error.message = `Command '${command}' failed: ${error.message}`;
      throw error;
    }
  }

  /**
   * Get list of registered commands
   * @returns {string[]} Array of registered command names
   */
  getRegisteredCommands() {
    return Array.from(this.handlers.keys());
  }
}

module.exports = { CommandRouter };
