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
exports.contextReduce = contextReduce;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
// Import Epic 5 systems
const ContextLoader = require('../../../../src/context/context-loader');
/**
 * /context reduce - Drop low-priority content to reduce token usage
 *
 * Workflow:
 * 1. Load current session state and context metadata
 * 2. Check current token utilization against budget (3500 tokens)
 * 3. If over budget or >95%: Drop P3 (Priority 3) content and recalculate
 * 4. If still over budget: Drop P2 (Priority 2) content and recalculate
 * 5. Update session state with reduced context metadata
 * 6. Display new token count and what was dropped
 *
 * Priority levels (from Story 5-1):
 * - P1 (Critical): Current location description, active NPCs, character sheet
 * - P2 (Important): Adjacent locations, active quests, scheduled events
 * - P3 (Nice-to-have): Distant locations, completed quests, flavor text
 *
 * Use cases:
 * - When context exceeds 3500 token budget
 * - Before major narration (to reserve tokens for output)
 * - To optimize performance when context is bloated
 *
 * Performance target: <3 seconds
 */
async function contextReduce(context) {
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
        const tokenBudget = 3500;
        const oldUtilization = Math.round((oldTokenCount / tokenBudget) * 100);
        // Step 2: Check if reduction needed
        if (oldUtilization < 95) {
            const displayMessage = `**Context Reduction Not Needed**\n\n` +
                `**Current Utilization:** ${oldTokenCount} / ${tokenBudget} (${oldUtilization}%)\n\n` +
                `Context is healthy. Reduction only triggers when utilization exceeds 95%.\n\n` +
                `💡 **Tip:** Use \`/context show\` to view current context metadata.`;
            vscode.window.showInformationMessage(`Context healthy: ${oldUtilization}%`);
            const outputChannel = vscode.window.createOutputChannel('Kapi\'s RPG - Context');
            outputChannel.clear();
            outputChannel.appendLine(displayMessage);
            outputChannel.show();
            return {
                success: true,
                message: 'Context reduction not needed',
                data: {
                    oldTokenCount,
                    newTokenCount: oldTokenCount,
                    utilization: oldUtilization,
                    droppedPriorities: []
                }
            };
        }
        // Step 3: Drop P3 content and recalculate
        const loader = new ContextLoader();
        let contextResult = await loader.loadContext(sessionState.character.filePath, sessionState.location.currentLocationId, sessionState, tokenBudget, { excludePriority: 3 } // Drop P3 content
        );
        if (!contextResult.success) {
            return {
                success: false,
                message: `Failed to reduce context: ${contextResult.error}`,
                error: new Error(contextResult.error)
            };
        }
        let gameContext = contextResult.data;
        let newTokenCount = gameContext.metadata.tokenCount;
        let newUtilization = Math.round((newTokenCount / tokenBudget) * 100);
        let droppedPriorities = [3];
        // Step 4: If still over budget, drop P2 content as well
        if (newUtilization >= 100) {
            vscode.window.showWarningMessage('Still over budget after dropping P3. Dropping P2 content...');
            contextResult = await loader.loadContext(sessionState.character.filePath, sessionState.location.currentLocationId, sessionState, tokenBudget, { excludePriority: [2, 3] } // Drop both P2 and P3
            );
            if (!contextResult.success) {
                return {
                    success: false,
                    message: `Failed to reduce context further: ${contextResult.error}`,
                    error: new Error(contextResult.error)
                };
            }
            gameContext = contextResult.data;
            newTokenCount = gameContext.metadata.tokenCount;
            newUtilization = Math.round((newTokenCount / tokenBudget) * 100);
            droppedPriorities = [2, 3];
        }
        // Step 5: Update session state with reduced context
        sessionState.context.lastLoadedAt = new Date().toISOString();
        sessionState.context.tokensUsed = newTokenCount;
        const sessionYaml = yaml.dump(sessionState, {
            indent: 2,
            lineWidth: -1,
            sortKeys: true
        });
        await fs.writeFile(currentSessionPath, sessionYaml, 'utf-8');
        // Step 6: Display reduction results
        const elapsedTime = Date.now() - startTime;
        const elapsedSeconds = (elapsedTime / 1000).toFixed(1);
        const tokensSaved = oldTokenCount - newTokenCount;
        const prioritiesDropped = droppedPriorities.map(p => `P${p}`).join(', ');
        const displayMessage = `**Context Reduced Successfully!**\n\n` +
            `**Token Utilization:**\n` +
            `- Previous: ${oldTokenCount} / ${tokenBudget} (${oldUtilization}%)\n` +
            `- Current: ${newTokenCount} / ${tokenBudget} (${newUtilization}%)\n` +
            `- Saved: ${tokensSaved} tokens\n\n` +
            `**Priorities Dropped:** ${prioritiesDropped}\n\n` +
            `**Remaining Entities:**\n` +
            `- NPCs: ${gameContext.npcs?.length || 0}\n` +
            `- Events: ${gameContext.events?.length || 0}\n` +
            `- Quests: ${gameContext.quests?.length || 0}\n` +
            `- Items: ${gameContext.items?.length || 0}\n\n` +
            `**Performance:** ${elapsedSeconds}s (target: <3s)\n\n` +
            `✓ Context reduced by dropping ${prioritiesDropped} content.\n\n` +
            `💡 **What was dropped:**\n` +
            (droppedPriorities.includes(3) ? `- P3: Distant locations, completed quests, flavor text\n` : '') +
            (droppedPriorities.includes(2) ? `- P2: Adjacent locations, some active quests, scheduled events\n` : '') +
            `\n**Retained:**\n` +
            `- P1: Current location, active NPCs, character sheet, critical quests`;
        vscode.window.showInformationMessage(`Context reduced: ${tokensSaved} tokens saved (now ${newUtilization}%)`);
        const outputChannel = vscode.window.createOutputChannel('Kapi\'s RPG - Context');
        outputChannel.clear();
        outputChannel.appendLine(displayMessage);
        outputChannel.show();
        return {
            success: true,
            message: 'Context reduced successfully',
            data: {
                oldTokenCount,
                newTokenCount,
                tokensSaved,
                oldUtilization,
                newUtilization,
                droppedPriorities,
                elapsedTime
            }
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Unexpected error reducing context: ${error.message}`,
            error: error
        };
    }
}
//# sourceMappingURL=context-reduce.js.map