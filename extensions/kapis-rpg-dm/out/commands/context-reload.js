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
exports.contextReload = contextReload;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
// Import Epic 5 systems
const ContextLoader = require('../../../../src/context/context-loader');
const ContextCache = require('../../../../src/context/context-cache');
/**
 * /context reload - Clear cache and reload context
 *
 * Workflow:
 * 1. Load current session state from current-session.yaml
 * 2. Call ContextCache.clear() to invalidate all cached context
 * 3. Reload context via ContextLoader.loadContext() with fresh data
 * 4. Update session state with new context metadata
 * 5. Display new token count and utilization
 *
 * Use cases:
 * - After major world state changes (NPC death, quest completion)
 * - When cached context is stale or incorrect
 * - To refresh after /travel or /rest if context seems outdated
 *
 * Performance target: <5 seconds
 */
async function contextReload(context) {
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
        const oldTokenCount = sessionState.context?.tokensUsed || 0;
        // Step 2: Clear context cache (Story 5-2 integration)
        const cache = new ContextCache();
        cache.clear();
        vscode.window.showInformationMessage('Context cache cleared. Reloading...');
        // Step 3: Reload context with fresh data
        const loader = new ContextLoader();
        const contextResult = await loader.loadContext(sessionState.character.filePath, sessionState.location.currentLocationId, sessionState, 3500 // Token budget
        );
        if (!contextResult.success) {
            return {
                success: false,
                message: `Failed to reload context: ${contextResult.error}`,
                error: new Error(contextResult.error)
            };
        }
        const gameContext = contextResult.data;
        const newTokenCount = gameContext.metadata.tokenCount;
        const tokenBudget = 3500;
        const utilization = Math.round((newTokenCount / tokenBudget) * 100);
        // Step 4: Update session state with new context metadata
        sessionState.context.lastLoadedAt = new Date().toISOString();
        sessionState.context.tokensUsed = newTokenCount;
        sessionState.context.cacheKeys = []; // Fresh load, no cache hits
        const sessionYaml = yaml.dump(sessionState, {
            indent: 2,
            lineWidth: -1,
            sortKeys: true
        });
        await fs.writeFile(currentSessionPath, sessionYaml, 'utf-8');
        // Step 5: Display reload results
        const elapsedTime = Date.now() - startTime;
        const elapsedSeconds = (elapsedTime / 1000).toFixed(1);
        const tokenDiff = newTokenCount - oldTokenCount;
        const tokenDiffStr = tokenDiff > 0 ? `+${tokenDiff}` : `${tokenDiff}`;
        const displayMessage = `**Context Reloaded Successfully!**\n\n` +
            `**Token Utilization:**\n` +
            `- Previous: ${oldTokenCount} / ${tokenBudget}\n` +
            `- Current: ${newTokenCount} / ${tokenBudget} (${utilization}%)\n` +
            `- Change: ${tokenDiffStr} tokens\n\n` +
            `**Reloaded Entities:**\n` +
            `- NPCs: ${gameContext.npcs?.length || 0}\n` +
            `- Events: ${gameContext.events?.length || 0}\n` +
            `- Quests: ${gameContext.quests?.length || 0}\n` +
            `- Items: ${gameContext.items?.length || 0}\n\n` +
            `**Location:** ${gameContext.location?.name || sessionState.location.currentLocationId}\n` +
            `**Calendar:** ${gameContext.calendar?.currentDate} ${gameContext.calendar?.currentTime}\n\n` +
            `**Performance:** ${elapsedSeconds}s (target: <5s)\n\n` +
            `✓ Cache cleared and context refreshed from disk.`;
        vscode.window.showInformationMessage(`Context reloaded: ${newTokenCount} tokens (${utilization}%)`);
        const outputChannel = vscode.window.createOutputChannel('Kapi\'s RPG - Context');
        outputChannel.clear();
        outputChannel.appendLine(displayMessage);
        outputChannel.show();
        return {
            success: true,
            message: 'Context reloaded successfully',
            data: {
                oldTokenCount,
                newTokenCount,
                tokenDiff,
                utilization,
                npcsLoaded: gameContext.npcs?.length || 0,
                eventsLoaded: gameContext.events?.length || 0,
                elapsedTime
            }
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Unexpected error reloading context: ${error.message}`,
            error: error
        };
    }
}
//# sourceMappingURL=context-reload.js.map