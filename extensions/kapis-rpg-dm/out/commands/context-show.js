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
exports.contextShow = contextShow;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
// Import Epic 5 systems
const ContextLoader = require('../../../../src/context/context-loader');
/**
 * /context show - Display current context metadata
 *
 * Workflow:
 * 1. Load current session state from current-session.yaml
 * 2. Extract context metadata from session state
 * 3. Display token count, loaded priorities, cache hit rate, entity list
 * 4. Show context utilization percentage (tokens used / 3500 budget)
 *
 * Performance target: <1 second
 */
async function contextShow(context) {
    const startTime = Date.now();
    try {
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const sessionDir = path.join(workspaceRoot, 'game-data', 'session');
        // Step 1: Load current session state
        const currentSessionPath = path.join(sessionDir, 'current-session.yaml');
        let sessionState;
        try {
            const sessionYaml = await fs.readFile(currentSessionPath, 'utf-8');
            sessionState = yaml.load(sessionYaml);
        }
        catch (error) {
            return {
                success: false,
                message: 'No active session found. Start a session with /start-session',
                error: error
            };
        }
        // Step 2: Extract context metadata
        const contextMetadata = sessionState.context || {};
        const tokenCount = contextMetadata.tokensUsed || 0;
        const tokenBudget = 3500;
        const utilization = Math.round((tokenCount / tokenBudget) * 100);
        const lastLoadedAt = contextMetadata.lastLoadedAt || 'Never';
        const cacheKeys = contextMetadata.cacheKeys || [];
        // Load current location context to get entity counts
        const loader = new ContextLoader();
        const contextResult = await loader.loadContext(sessionState.character.filePath, sessionState.location.currentLocationId, sessionState, tokenBudget);
        let npcsLoaded = 0;
        let eventsLoaded = 0;
        let questsLoaded = 0;
        let itemsLoaded = 0;
        if (contextResult.success) {
            const gameContext = contextResult.data;
            npcsLoaded = gameContext.npcs?.length || 0;
            eventsLoaded = gameContext.events?.length || 0;
            questsLoaded = gameContext.quests?.length || 0;
            itemsLoaded = gameContext.items?.length || 0;
        }
        // Step 3: Display context metadata
        const elapsedTime = Date.now() - startTime;
        const elapsedSeconds = (elapsedTime / 1000).toFixed(1);
        const displayMessage = `**Current Context Metadata**\n\n` +
            `**Token Utilization:**\n` +
            `- Current: ${tokenCount} / ${tokenBudget} (${utilization}%)\n` +
            `- Status: ${utilization < 80 ? '✓ Healthy' : utilization < 95 ? '⚠ High' : '✗ Over Budget'}\n\n` +
            `**Loaded Entities:**\n` +
            `- NPCs: ${npcsLoaded}\n` +
            `- Events: ${eventsLoaded}\n` +
            `- Quests: ${questsLoaded}\n` +
            `- Items: ${itemsLoaded}\n\n` +
            `**Cache Status:**\n` +
            `- Last loaded: ${lastLoadedAt}\n` +
            `- Cache keys: ${cacheKeys.length} entries\n\n` +
            `**Current Location:** ${sessionState.location.currentLocationId}\n` +
            `**Character:** ${sessionState.character.name} (Level ${sessionState.character.level})\n\n` +
            `**Performance:** ${elapsedSeconds}s (target: <1s)\n\n` +
            `💡 **Tip:** Use \`/context reload\` to refresh context, \`/context reduce\` to free up tokens.`;
        vscode.window.showInformationMessage(`Context utilization: ${utilization}%`);
        const outputChannel = vscode.window.createOutputChannel('Kapi\'s RPG - Context');
        outputChannel.clear();
        outputChannel.appendLine(displayMessage);
        outputChannel.show();
        return {
            success: true,
            message: 'Context metadata displayed',
            data: {
                tokenCount,
                tokenBudget,
                utilization,
                npcsLoaded,
                eventsLoaded,
                questsLoaded,
                itemsLoaded,
                elapsedTime
            }
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Unexpected error displaying context: ${error.message}`,
            error: error
        };
    }
}
//# sourceMappingURL=context-show.js.map