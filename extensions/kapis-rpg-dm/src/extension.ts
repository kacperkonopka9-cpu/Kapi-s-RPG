import * as vscode from 'vscode';
import { CommandRegistry } from './commands/registry';
import { startSession } from './commands/start-session';
import { endSession } from './commands/end-session';
import { createSave, loadSave } from './commands/session-commands';
import { travel } from './commands/travel';
import { rest } from './commands/rest';
import { awardXP } from './commands/award-xp';
import { contextShow } from './commands/context-show';
import { contextReload } from './commands/context-reload';
import { contextReduce } from './commands/context-reduce';
import { LocationTreeProvider } from './providers/location-tree-provider';
import { FileWatcherManager } from './utils/file-watcher';
import * as locationCommands from './commands/location-commands';
import { CharacterSheetPanel, registerCharacterSheetCommands } from './panels/character-sheet-panel';
import { QuestTrackerPanel, registerQuestTrackerCommands } from './panels/quest-tracker-panel';
import { CalendarWidget, registerCalendarWidgetCommands } from './panels/calendar-widget';
import { registerMarkdownLinkProvider } from './providers/markdown-link-provider';

// Global singletons
let fileWatcherManager: FileWatcherManager | undefined;
let locationTreeProvider: LocationTreeProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('Kapi\'s RPG DM Assistant extension is now active');

  // Initialize command registry
  const registry = new CommandRegistry(context);

  // Initialize FileWatcherManager singleton
  fileWatcherManager = new FileWatcherManager();

  // Initialize and register LocationTreeProvider
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (workspaceRoot) {
    locationTreeProvider = new LocationTreeProvider(workspaceRoot);

    // Load current location from session (if exists)
    locationTreeProvider.loadCurrentLocationFromSession().catch(err => {
      console.error('Failed to load current location from session:', err);
    });

    // Register tree view
    const treeView = vscode.window.createTreeView('kapis-rpg-locations', {
      treeDataProvider: locationTreeProvider,
      showCollapseAll: true
    });

    context.subscriptions.push(treeView);
  } else {
    vscode.window.showWarningMessage('Kapi\'s RPG: No workspace folder found. Location tree view disabled.');
  }

  // Register all commands
  // Session commands
  registry.registerCommand({
    commandId: 'kapis-rpg-dm.startSession',
    name: '/start-session',
    category: 'session',
    args: [
      { name: 'location', type: 'string', required: false, description: 'Starting location ID (prompts if not provided)' },
      { name: 'character', type: 'string', required: false, description: 'Character file name without .yaml (prompts if not provided)' }
    ],
    handler: startSession,
    requiresSession: false
  });

  registry.registerCommand({
    commandId: 'kapis-rpg-dm.endSession',
    name: '/end-session',
    category: 'session',
    args: [
      { name: 'summary', type: 'string', required: false, description: 'Optional session summary' }
    ],
    handler: endSession,
    requiresSession: true
  });

  registry.registerCommand({
    commandId: 'kapis-rpg-dm.save',
    name: '/save',
    category: 'session',
    args: [
      { name: 'saveName', type: 'string', required: true, description: 'Save point name' }
    ],
    handler: createSave,
    requiresSession: false
  });

  registry.registerCommand({
    commandId: 'kapis-rpg-dm.loadSave',
    name: '/load-save',
    category: 'session',
    args: [],
    handler: loadSave,
    requiresSession: false
  });

  // Navigation commands
  registry.registerCommand({
    commandId: 'kapis-rpg-dm.travel',
    name: '/travel',
    category: 'navigation',
    args: [
      { name: 'destination', type: 'string', required: true, description: 'Destination location ID' }
    ],
    handler: travel,
    requiresSession: true
  });

  registry.registerCommand({
    commandId: 'kapis-rpg-dm.rest',
    name: '/rest',
    category: 'mechanics',
    args: [
      { name: 'restType', type: 'string', required: true, description: 'Rest type: "short" or "long"' }
    ],
    handler: rest,
    requiresSession: true
  });

  registry.registerCommand({
    commandId: 'kapis-rpg-dm.awardXP',
    name: '/award-xp',
    category: 'mechanics',
    args: [
      { name: 'amount', type: 'number', required: true, description: 'XP amount to award' },
      { name: 'reason', type: 'string', required: false, description: 'Reason for XP award (e.g., "defeated wolves")' }
    ],
    handler: awardXP,
    requiresSession: true
  });

  // Context management commands
  registry.registerCommand({
    commandId: 'kapis-rpg-dm.contextShow',
    name: '/context show',
    category: 'context',
    args: [],
    handler: contextShow,
    requiresSession: true
  });

  registry.registerCommand({
    commandId: 'kapis-rpg-dm.contextReload',
    name: '/context reload',
    category: 'context',
    args: [],
    handler: contextReload,
    requiresSession: true
  });

  registry.registerCommand({
    commandId: 'kapis-rpg-dm.contextReduce',
    name: '/context reduce',
    category: 'context',
    args: [],
    handler: contextReduce,
    requiresSession: true
  });

  // Location tree commands
  context.subscriptions.push(
    vscode.commands.registerCommand('kapis-rpg.openLocationDescription', locationCommands.openLocationDescription)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kapis-rpg.travelToLocation', locationCommands.travelToLocation)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kapis-rpg.viewLocationDetails', locationCommands.viewLocationDetails)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kapis-rpg.openLocationInExplorer', locationCommands.openLocationInExplorer)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('kapis-rpg.refreshLocationTree', async () => {
      if (locationTreeProvider) {
        await locationTreeProvider.refresh();
        vscode.window.showInformationMessage('Location tree refreshed');
      }
    })
  );

  // Character Sheet Panel (Story 5-8)
  registerCharacterSheetCommands(context, fileWatcherManager);

  // Quest Tracker Panel (Story 5-9)
  registerQuestTrackerCommands(context, fileWatcherManager);

  // Calendar Widget (Story 5-10)
  registerCalendarWidgetCommands(context, fileWatcherManager);

  // Markdown Link Provider (Story 5-11)
  registerMarkdownLinkProvider(context);

  console.log('All Kapi\'s RPG commands registered successfully');
}

export function deactivate() {
  console.log('Kapi\'s RPG DM Assistant extension is now deactivated');

  // Dispose FileWatcherManager
  if (fileWatcherManager) {
    fileWatcherManager.disposeAll();
    fileWatcherManager = undefined;
  }

  // LocationTreeProvider is disposed automatically via context subscriptions
  locationTreeProvider = undefined;
}

/**
 * Get FileWatcherManager singleton
 * @returns FileWatcherManager instance or undefined if not initialized
 */
export function getFileWatcherManager(): FileWatcherManager | undefined {
  return fileWatcherManager;
}

/**
 * Get LocationTreeProvider singleton
 * @returns LocationTreeProvider instance or undefined if not initialized
 */
export function getLocationTreeProvider(): LocationTreeProvider | undefined {
  return locationTreeProvider;
}
