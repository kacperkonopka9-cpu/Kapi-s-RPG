"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRegistry = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * CommandRegistry - manages registration and execution of all RPG commands
 *
 * Responsibilities:
 * - Register command definitions with metadata
 * - Validate command arguments before execution
 * - Check session requirements (current-session.yaml must exist)
 * - Route commands to appropriate handlers
 * - Return consistent Result Objects
 */
class CommandRegistry {
    constructor(context) {
        this.commands = new Map();
        this.context = context;
        // Get workspace root (project directory)
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder open. Please open the Kapi-s-RPG project folder.');
        }
        this.workspaceRoot = workspaceFolders[0].uri.fsPath;
    }
    /**
     * Register a command definition
     *
     * @param definition - Complete command definition with metadata
     * @throws Error if command validation fails or duplicate commandId
     */
    registerCommand(definition) {
        // Validate command definition
        if (!definition.commandId || typeof definition.commandId !== 'string') {
            throw new Error('CommandDefinition must have a valid commandId (string)');
        }
        if (!definition.name || typeof definition.name !== 'string') {
            throw new Error(`Command ${definition.commandId} must have a valid name (string)`);
        }
        if (!definition.category || typeof definition.category !== 'string') {
            throw new Error(`Command ${definition.commandId} must have a valid category (string)`);
        }
        if (!Array.isArray(definition.args)) {
            throw new Error(`Command ${definition.commandId} must have args array (can be empty)`);
        }
        if (typeof definition.handler !== 'function') {
            throw new Error(`Command ${definition.commandId} must have a handler function`);
        }
        if (typeof definition.requiresSession !== 'boolean') {
            throw new Error(`Command ${definition.commandId} must have requiresSession boolean`);
        }
        // Check for duplicate commandId
        if (this.commands.has(definition.commandId)) {
            throw new Error(`Command ${definition.commandId} is already registered`);
        }
        // Validate each argument definition
        for (const arg of definition.args) {
            if (!arg.name || typeof arg.name !== 'string') {
                throw new Error(`Command ${definition.commandId} has invalid argument: missing name`);
            }
            if (!['string', 'number', 'boolean'].includes(arg.type)) {
                throw new Error(`Command ${definition.commandId} argument ${arg.name} has invalid type: ${arg.type}`);
            }
            if (typeof arg.required !== 'boolean') {
                throw new Error(`Command ${definition.commandId} argument ${arg.name} must have required boolean`);
            }
        }
        // Register the command
        this.commands.set(definition.commandId, definition);
        // Register with VS Code command palette
        const disposable = vscode.commands.registerCommand(definition.commandId, async (...args) => {
            return await this.executeCommand(definition.commandId, ...args);
        });
        this.context.subscriptions.push(disposable);
    }
    /**
     * Execute a registered command
     *
     * @param commandId - The command to execute
     * @param args - Arguments to pass to the command handler
     * @returns CommandResult with success/error information
     */
    async executeCommand(commandId, ...args) {
        // Check if command exists
        const definition = this.commands.get(commandId);
        if (!definition) {
            return {
                success: false,
                error: new Error(`Unknown command: ${commandId}`)
            };
        }
        try {
            // Validate arguments
            const argValidation = this.validateArguments(definition, args);
            if (!argValidation.success) {
                return argValidation;
            }
            // Check session requirement
            if (definition.requiresSession) {
                const sessionCheck = await this.checkSessionExists();
                if (!sessionCheck.success) {
                    return {
                        success: false,
                        message: `No active session. Run "/start-session" first.`,
                        error: new Error('Session required but not found')
                    };
                }
            }
            // Execute the command handler
            const result = await definition.handler(this.context, ...args);
            // Show error message if command failed
            if (!result.success && result.message) {
                vscode.window.showErrorMessage(`${definition.name}: ${result.message}`);
            }
            return result;
        }
        catch (error) {
            // Log error to error.log
            await this.logError(commandId, args, error);
            // Show error to user
            const errorMessage = `${definition.name} failed: ${error.message}`;
            vscode.window.showErrorMessage(errorMessage);
            // Return user-friendly error
            return {
                success: false,
                message: errorMessage,
                error: error
            };
        }
    }
    /**
     * List all registered commands with metadata
     *
     * @returns Array of command metadata (excludes handler function)
     */
    listCommands() {
        const commandList = [];
        for (const [commandId, definition] of this.commands) {
            commandList.push({
                commandId: definition.commandId,
                name: definition.name,
                category: definition.category,
                args: definition.args,
                requiresSession: definition.requiresSession
            });
        }
        return commandList;
    }
    /**
     * Validate command arguments against definition
     *
     * @param definition - Command definition
     * @param args - Provided arguments
     * @returns CommandResult indicating validation success/failure
     */
    validateArguments(definition, args) {
        const requiredArgs = definition.args.filter(arg => arg.required);
        // Check for missing required arguments
        if (args.length < requiredArgs.length) {
            const missingArgs = requiredArgs.slice(args.length).map(arg => arg.name);
            const usage = this.generateUsageHint(definition);
            return {
                success: false,
                message: `Missing required argument(s): ${missingArgs.join(', ')}. ${usage}`,
                error: new Error('Missing required arguments')
            };
        }
        // Validate argument types
        for (let i = 0; i < args.length; i++) {
            const argDef = definition.args[i];
            if (!argDef)
                continue; // Extra args allowed (spread operator)
            const providedValue = args[i];
            const expectedType = argDef.type;
            let actualType;
            if (typeof providedValue === 'string') {
                actualType = 'string';
            }
            else if (typeof providedValue === 'number') {
                actualType = 'number';
            }
            else if (typeof providedValue === 'boolean') {
                actualType = 'boolean';
            }
            else {
                actualType = typeof providedValue;
            }
            if (actualType !== expectedType) {
                return {
                    success: false,
                    message: `Invalid argument "${argDef.name}": expected ${expectedType}, got ${actualType}`,
                    error: new Error('Invalid argument type')
                };
            }
        }
        return { success: true };
    }
    /**
     * Check if an active session exists (current-session.yaml file present)
     *
     * @returns CommandResult indicating session existence
     */
    async checkSessionExists() {
        const sessionPath = path.join(this.workspaceRoot, 'game-data', 'session', 'current-session.yaml');
        try {
            await fs.access(sessionPath);
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                message: 'No active session found',
                error: error
            };
        }
    }
    /**
     * Log error to error.log file
     *
     * @param commandId - Command that failed
     * @param args - Arguments provided
     * @param error - Error that occurred
     */
    async logError(commandId, args, error) {
        const errorLogPath = path.join(this.workspaceRoot, 'error.log');
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] Command: ${commandId}\n` +
            `Arguments: ${JSON.stringify(args)}\n` +
            `Error: ${error.message}\n` +
            `Stack: ${error.stack}\n` +
            `---\n\n`;
        try {
            await fs.appendFile(errorLogPath, logEntry, 'utf-8');
        }
        catch (logError) {
            // Failed to log error - output to console as fallback
            console.error('Failed to write to error.log:', logError);
            console.error('Original error:', error);
        }
    }
    /**
     * Generate usage hint for a command
     *
     * @param definition - Command definition
     * @returns Usage string
     */
    generateUsageHint(definition) {
        const argList = definition.args
            .map(arg => arg.required ? `<${arg.name}>` : `[${arg.name}]`)
            .join(' ');
        return `Usage: ${definition.name} ${argList}`;
    }
}
exports.CommandRegistry = CommandRegistry;
//# sourceMappingURL=registry.js.map