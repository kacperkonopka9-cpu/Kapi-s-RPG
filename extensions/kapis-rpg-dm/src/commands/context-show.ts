import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { CommandResult } from './registry';

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
export async function contextShow(
  context: vscode.ExtensionContext
): Promise<CommandResult> {
  const startTime = Date.now();

  try {
    const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const sessionDir = path.join(workspaceRoot, 'game-data', 'session');

    // Step 1: Load current session state
    const currentSessionPath = path.join(sessionDir, 'current-session.yaml');

    let sessionState: any;
    try {
      const sessionYaml = await fs.readFile(currentSessionPath, 'utf-8');
      sessionState = yaml.load(sessionYaml);
    } catch (error) {
      return {
        success: false,
        message: 'No active session found. Start a session with /start-session',
        error: error as Error
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
    const contextResult = await loader.loadContext(
      sessionState.character.filePath,
      sessionState.location.currentLocationId,
      sessionState,
      tokenBudget
    );

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

  } catch (error) {
    return {
      success: false,
      message: `Unexpected error displaying context: ${(error as Error).message}`,
      error: error as Error
    };
  }
}
