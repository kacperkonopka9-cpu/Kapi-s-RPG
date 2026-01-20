import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { CommandResult } from './registry';

// Import Epic 5 systems (Story 5-1, 5-3, 5-6)
// Note: These are JavaScript modules, imported in TypeScript with require()
const ContextLoader = require('../../../../src/context/context-loader');
const { PromptTemplateEngine } = require('../../../../src/prompts');
const SessionManager = require('../../../../src/session/session-manager');
const { LocationLoader } = require('../../../../src/data/location-loader');

/**
 * /start-session [location] [character] - Initialize gameplay session
 *
 * Workflow:
 * 1. Validate character file exists and has required fields
 * 2. Validate location exists in game-data/locations/
 * 3. Load context using ContextLoader (Story 5-1)
 * 4. Render initial narration using PromptTemplateEngine (Story 5-3)
 * 5. Create game-data/session/current-session.yaml with session state
 * 6. Display session start confirmation with context metadata
 *
 * Performance target: <2 minutes (95th percentile)
 */
export async function startSession(
  context: vscode.ExtensionContext,
  location?: string,
  character?: string
): Promise<CommandResult> {
  const startTime = Date.now();

  try {
    const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;

    // Prompt for location if not provided
    if (!location) {
      // Get available locations
      const locationsDir = path.join(workspaceRoot, 'game-data', 'locations');
      let locationFolders: string[] = [];
      try {
        const entries = await fs.readdir(locationsDir, { withFileTypes: true });
        locationFolders = entries
          .filter(entry => entry.isDirectory())
          .map(entry => entry.name);
      } catch (error) {
        return {
          success: false,
          message: 'Could not read locations directory',
          error: error as Error
        };
      }

      if (locationFolders.length === 0) {
        return {
          success: false,
          message: 'No locations found in game-data/locations/',
          error: new Error('No locations available')
        };
      }

      const selectedLocation = await vscode.window.showQuickPick(locationFolders, {
        placeHolder: 'Select starting location',
        title: 'Start Session - Choose Location'
      });

      if (!selectedLocation) {
        return {
          success: false,
          message: 'Session start cancelled - no location selected',
          error: new Error('User cancelled')
        };
      }
      location = selectedLocation;
    }

    // Prompt for character if not provided
    if (!character) {
      // Get available characters
      const charactersDir = path.join(workspaceRoot, 'characters');
      let characterFiles: string[] = [];
      try {
        const entries = await fs.readdir(charactersDir);
        characterFiles = entries
          .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
          .map(file => file.replace(/\.ya?ml$/, ''));
      } catch (error) {
        return {
          success: false,
          message: 'Could not read characters directory',
          error: error as Error
        };
      }

      if (characterFiles.length === 0) {
        return {
          success: false,
          message: 'No character files found in characters/',
          error: new Error('No characters available')
        };
      }

      const selectedCharacter = await vscode.window.showQuickPick(characterFiles, {
        placeHolder: 'Select your character',
        title: 'Start Session - Choose Character'
      });

      if (!selectedCharacter) {
        return {
          success: false,
          message: 'Session start cancelled - no character selected',
          error: new Error('User cancelled')
        };
      }
      character = selectedCharacter;
    }

    // Step 1: Validate and load character file
    const characterPath = path.join(workspaceRoot, 'characters', `${character}.yaml`);

    let characterData: any;
    try {
      const characterYaml = await fs.readFile(characterPath, 'utf-8');
      characterData = yaml.load(characterYaml);
    } catch (error) {
      return {
        success: false,
        message: `Character file not found: ${character}.yaml`,
        error: error as Error
      };
    }

    // Validate required character fields (hitPoints is the schema-compliant field name)
    const requiredFields = ['name', 'level', 'class'];
    const missingFields = requiredFields.filter(field => !characterData[field]);

    // Check for HP field (supports both 'hitPoints' and legacy 'hp')
    const hasHp = characterData.hitPoints || characterData.hp;
    if (!hasHp) {
      missingFields.push('hitPoints');
    }

    if (missingFields.length > 0) {
      return {
        success: false,
        message: `Character file missing required fields: ${missingFields.join(', ')}`,
        error: new Error('Invalid character file')
      };
    }

    // Step 2: Validate location exists
    const locationPath = path.join(workspaceRoot, 'game-data', 'locations', location);

    try {
      await fs.access(locationPath);
    } catch (error) {
      return {
        success: false,
        message: `Location not found: ${location}`,
        error: error as Error
      };
    }

    // Step 3: Start session using SessionManager (Story 5-6)
    // Pass absolute paths since extension runs from different directory
    const sessionDir = path.join(workspaceRoot, 'game-data', 'session');
    const locationsDir = path.join(workspaceRoot, 'game-data', 'locations');
    const sessionManager = new SessionManager({
      sessionDir: sessionDir,
      locationsDir: locationsDir
    });

    // Auto-save interval from VS Code settings (default 300 seconds = 5 minutes)
    const config = vscode.workspace.getConfiguration('kapis-rpg');
    const autoSaveInterval = config.get<number>('autoSaveInterval', 300);

    const sessionResult = await sessionManager.startSession(
      characterPath,  // Use absolute path
      location,
      autoSaveInterval
    );

    if (!sessionResult.success) {
      return {
        success: false,
        message: `Failed to start session: ${sessionResult.error}`,
        error: new Error(sessionResult.error || 'Unknown error')
      };
    }

    const sessionState = sessionResult.data;

    // Step 4: Load context using ContextLoader (Story 5-1)
    // Pass baseDir and LocationLoader since extension runs from different directory
    const locationLoader = new LocationLoader(locationsDir);
    const loader = new ContextLoader({
      baseDir: workspaceRoot,
      LocationLoader: locationLoader
    });
    const contextResult = await loader.loadContext(
      characterPath,  // Use absolute path
      location,
      sessionState,
      3500 // Token budget (3500 soft limit)
    );

    if (!contextResult.success) {
      return {
        success: false,
        message: `Failed to load context: ${contextResult.error}`,
        error: new Error(contextResult.error)
      };
    }

    const gameContext = contextResult.data;

    // Step 5: Render initial narration using PromptTemplateEngine (Story 5-3)
    const templateEngine = new PromptTemplateEngine();
    const templateResult = await templateEngine.renderTemplate(
      'location-initial-visit',
      gameContext
    );

    if (!templateResult.success) {
      return {
        success: false,
        message: `Failed to render narration: ${templateResult.error}`,
        error: new Error(templateResult.error)
      };
    }

    const initialNarration = templateResult.data.prompt;
    const tokenCount = templateResult.data.tokenCount;

    // Step 6: Update session state with context metadata
    await sessionManager.updateSession({
      npcs: {
        ...sessionState!.npcs,
        activeNPCs: gameContext.npcs?.map((npc: any) => npc.npcId) || []
      },
      context: {
        lastLoadedAt: new Date().toISOString(),
        tokensUsed: tokenCount,
        cacheKeys: []
      },
      performance: {
        ...sessionState!.performance,
        startupTime: Math.round((Date.now() - startTime) / 1000),
        contextLoadTimes: []
      }
    });

    // Step 7: Display session start confirmation
    const elapsedTime = Date.now() - startTime;
    const elapsedSeconds = (elapsedTime / 1000).toFixed(1);

    const confirmationMessage = `**Session Started Successfully!**\n\n` +
      `**Character:** ${characterData.name} (Level ${characterData.level} ${characterData.class})\n` +
      `**Location:** ${gameContext.location?.name || location}\n` +
      `**Date/Time:** ${gameContext.calendar?.current?.date || 'Unknown'} ${gameContext.calendar?.current?.time || ''}\n\n` +
      `**Context Loaded:**\n` +
      `- Token count: ${tokenCount} / 3500 (${Math.round(tokenCount / 3500 * 100)}% of budget)\n` +
      `- NPCs loaded: ${gameContext.npcs?.length || 0}\n` +
      `- Events loaded: ${gameContext.events?.length || 0}\n` +
      `- Quests loaded: ${gameContext.quests?.length || 0}\n\n` +
      `**Performance:** ${elapsedSeconds}s (target: <120s)\n\n` +
      `---\n\n${initialNarration}`;

    // Show in VS Code output panel
    vscode.window.showInformationMessage('Session started! Check output panel for details.');

    const outputChannel = vscode.window.createOutputChannel('Kapi\'s RPG - Session');
    outputChannel.clear();
    outputChannel.appendLine(confirmationMessage);
    outputChannel.show();

    return {
      success: true,
      message: 'Session started successfully',
      data: {
        sessionId: sessionResult.sessionId,
        characterName: characterData.name,
        location: location,
        tokenCount: tokenCount,
        elapsedTime: elapsedTime
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Unexpected error starting session: ${(error as Error).message}`,
      error: error as Error
    };
  }
}
