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
exports.activate = activate;
exports.deactivate = deactivate;
exports.getFileWatcherManager = getFileWatcherManager;
exports.getLocationTreeProvider = getLocationTreeProvider;
const vscode = __importStar(require("vscode"));
const registry_1 = require("./commands/registry");
const start_session_1 = require("./commands/start-session");
const end_session_1 = require("./commands/end-session");
const session_commands_1 = require("./commands/session-commands");
const travel_1 = require("./commands/travel");
const rest_1 = require("./commands/rest");
const award_xp_1 = require("./commands/award-xp");
const context_show_1 = require("./commands/context-show");
const context_reload_1 = require("./commands/context-reload");
const context_reduce_1 = require("./commands/context-reduce");
const location_tree_provider_1 = require("./providers/location-tree-provider");
const file_watcher_1 = require("./utils/file-watcher");
const locationCommands = __importStar(require("./commands/location-commands"));
const character_sheet_panel_1 = require("./panels/character-sheet-panel");
const quest_tracker_panel_1 = require("./panels/quest-tracker-panel");
const calendar_widget_1 = require("./panels/calendar-widget");
const markdown_link_provider_1 = require("./providers/markdown-link-provider");
// Global singletons
let fileWatcherManager;
let locationTreeProvider;
function activate(context) {
    console.log('Kapi\'s RPG DM Assistant extension is now active');
    // Initialize command registry
    const registry = new registry_1.CommandRegistry(context);
    // Initialize FileWatcherManager singleton
    fileWatcherManager = new file_watcher_1.FileWatcherManager();
    // Initialize and register LocationTreeProvider
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceRoot) {
        locationTreeProvider = new location_tree_provider_1.LocationTreeProvider(workspaceRoot);
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
    }
    else {
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
        handler: start_session_1.startSession,
        requiresSession: false
    });
    registry.registerCommand({
        commandId: 'kapis-rpg-dm.endSession',
        name: '/end-session',
        category: 'session',
        args: [
            { name: 'summary', type: 'string', required: false, description: 'Optional session summary' }
        ],
        handler: end_session_1.endSession,
        requiresSession: true
    });
    registry.registerCommand({
        commandId: 'kapis-rpg-dm.save',
        name: '/save',
        category: 'session',
        args: [
            { name: 'saveName', type: 'string', required: true, description: 'Save point name' }
        ],
        handler: session_commands_1.createSave,
        requiresSession: false
    });
    registry.registerCommand({
        commandId: 'kapis-rpg-dm.loadSave',
        name: '/load-save',
        category: 'session',
        args: [],
        handler: session_commands_1.loadSave,
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
        handler: travel_1.travel,
        requiresSession: true
    });
    registry.registerCommand({
        commandId: 'kapis-rpg-dm.rest',
        name: '/rest',
        category: 'mechanics',
        args: [
            { name: 'restType', type: 'string', required: true, description: 'Rest type: "short" or "long"' }
        ],
        handler: rest_1.rest,
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
        handler: award_xp_1.awardXP,
        requiresSession: true
    });
    // Context management commands
    registry.registerCommand({
        commandId: 'kapis-rpg-dm.contextShow',
        name: '/context show',
        category: 'context',
        args: [],
        handler: context_show_1.contextShow,
        requiresSession: true
    });
    registry.registerCommand({
        commandId: 'kapis-rpg-dm.contextReload',
        name: '/context reload',
        category: 'context',
        args: [],
        handler: context_reload_1.contextReload,
        requiresSession: true
    });
    registry.registerCommand({
        commandId: 'kapis-rpg-dm.contextReduce',
        name: '/context reduce',
        category: 'context',
        args: [],
        handler: context_reduce_1.contextReduce,
        requiresSession: true
    });
    // Location tree commands
    context.subscriptions.push(vscode.commands.registerCommand('kapis-rpg.openLocationDescription', locationCommands.openLocationDescription));
    context.subscriptions.push(vscode.commands.registerCommand('kapis-rpg.travelToLocation', locationCommands.travelToLocation));
    context.subscriptions.push(vscode.commands.registerCommand('kapis-rpg.viewLocationDetails', locationCommands.viewLocationDetails));
    context.subscriptions.push(vscode.commands.registerCommand('kapis-rpg.openLocationInExplorer', locationCommands.openLocationInExplorer));
    context.subscriptions.push(vscode.commands.registerCommand('kapis-rpg.refreshLocationTree', async () => {
        if (locationTreeProvider) {
            await locationTreeProvider.refresh();
            vscode.window.showInformationMessage('Location tree refreshed');
        }
    }));
    // Character Sheet Panel (Story 5-8)
    (0, character_sheet_panel_1.registerCharacterSheetCommands)(context, fileWatcherManager);
    // Quest Tracker Panel (Story 5-9)
    (0, quest_tracker_panel_1.registerQuestTrackerCommands)(context, fileWatcherManager);
    // Calendar Widget (Story 5-10)
    (0, calendar_widget_1.registerCalendarWidgetCommands)(context, fileWatcherManager);
    // Markdown Link Provider (Story 5-11)
    (0, markdown_link_provider_1.registerMarkdownLinkProvider)(context);
    console.log('All Kapi\'s RPG commands registered successfully');
}
function deactivate() {
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
function getFileWatcherManager() {
    return fileWatcherManager;
}
/**
 * Get LocationTreeProvider singleton
 * @returns LocationTreeProvider instance or undefined if not initialized
 */
function getLocationTreeProvider() {
    return locationTreeProvider;
}
//# sourceMappingURL=extension.js.map