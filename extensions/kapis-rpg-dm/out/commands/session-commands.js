"use strict";
/**
 * Session Commands - Epic 5 Story 5-6: Session Management
 *
 * /save [name] - Create Git tag save point
 * /load-save - List and rollback to previous save point
 */
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
exports.createSave = createSave;
exports.loadSave = loadSave;
const vscode = __importStar(require("vscode"));
// Import GitIntegration from Story 5-6
const GitIntegration = require('../../../../src/session/git-integration');
const SessionManager = require('../../../../src/session/session-manager');
/**
 * /save [name] - Create named save point using Git tags
 * AC-7: Creates annotated Git tag save/{name} with description
 *
 * @param context - VS Code extension context
 * @param saveName - Save point name (will be sanitized)
 * @returns CommandResult
 */
async function createSave(context, saveName) {
    try {
        // Validate save name provided
        if (!saveName || saveName.trim().length === 0) {
            return {
                success: false,
                message: 'Save name is required. Usage: /save [name]',
                error: new Error('Missing save name')
            };
        }
        // Get current session state for tag description
        const sessionManager = new SessionManager();
        const sessionState = await sessionManager.getCurrentSession();
        let description = 'Manual save point';
        if (sessionState) {
            const location = sessionState.location?.currentLocationId || 'Unknown';
            const characterLevel = sessionState.character?.initialLevel || 1;
            const date = sessionState.calendar?.currentDate || 'Unknown';
            description = `${location}, Level ${characterLevel}, ${date}`;
        }
        // Create Git save point
        const gitIntegration = new GitIntegration();
        const result = await gitIntegration.createSavePoint(saveName, description);
        if (!result.success) {
            return {
                success: false,
                message: `Failed to create save point: ${result.error}`,
                error: new Error(result.error || 'Unknown error')
            };
        }
        const confirmationMessage = `**Save Point Created!**\n\n` +
            `**Tag:** ${result.tag}\n` +
            `**Description:** ${description}\n\n` +
            `Your game progress has been saved. You can restore this save point later with /load-save.`;
        vscode.window.showInformationMessage(`Save point "${result.tag}" created!`);
        const outputChannel = vscode.window.createOutputChannel('Kapi\'s RPG - Session');
        outputChannel.clear();
        outputChannel.appendLine(confirmationMessage);
        outputChannel.show();
        return {
            success: true,
            message: 'Save point created successfully',
            data: {
                tag: result.tag,
                description: description
            }
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Unexpected error creating save: ${error.message}`,
            error: error
        };
    }
}
/**
 * /load-save - List save points and rollback to selected one
 * AC-8: Displays save points, prompts for selection, checks out Git tag
 *
 * @param context - VS Code extension context
 * @returns CommandResult
 */
async function loadSave(context) {
    try {
        // List available save points
        const gitIntegration = new GitIntegration();
        const listResult = await gitIntegration.listSavePoints();
        if (!listResult.success) {
            return {
                success: false,
                message: `Failed to list save points: ${listResult.error}`,
                error: new Error(listResult.error || 'Unknown error')
            };
        }
        const savePoints = listResult.savePoints || [];
        if (savePoints.length === 0) {
            vscode.window.showInformationMessage('No save points found. Create one with /save [name]');
            return {
                success: false,
                message: 'No save points available',
                error: new Error('No save points found')
            };
        }
        // Display save points in VS Code Quick Pick
        const quickPickItems = savePoints.map((sp) => ({
            label: sp.tag,
            description: sp.date,
            detail: sp.description,
            savePoint: sp
        }));
        const selected = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: 'Select a save point to restore',
            title: 'Load Save Point'
        });
        if (!selected) {
            // User cancelled
            return {
                success: false,
                message: 'Save load cancelled',
                error: new Error('User cancelled')
            };
        }
        // Confirm rollback with warning
        const confirmMessage = `⚠️ WARNING: This will discard all changes since "${selected.label}".\n\n` +
            `All uncommitted work will be lost. Continue?`;
        const confirmation = await vscode.window.showWarningMessage(confirmMessage, { modal: true }, 'Yes, Restore Save', 'Cancel');
        if (confirmation !== 'Yes, Restore Save') {
            return {
                success: false,
                message: 'Save load cancelled',
                error: new Error('User cancelled')
            };
        }
        // Rollback to save point
        const rollbackResult = await gitIntegration.rollbackToSave(selected.savePoint.tag);
        if (!rollbackResult.success) {
            return {
                success: false,
                message: `Failed to rollback: ${rollbackResult.error}`,
                error: new Error(rollbackResult.error || 'Unknown error')
            };
        }
        const successMessage = `**Save Point Restored!**\n\n` +
            `**Tag:** ${selected.label}\n` +
            `**Date:** ${selected.description}\n` +
            `**Description:** ${selected.detail}\n\n` +
            `Your game has been restored to this save point. Files changed: ${rollbackResult.restoredFiles?.length || 0}`;
        vscode.window.showInformationMessage(`Restored to save point "${selected.label}"`);
        const outputChannel = vscode.window.createOutputChannel('Kapi\'s RPG - Session');
        outputChannel.clear();
        outputChannel.appendLine(successMessage);
        outputChannel.show();
        return {
            success: true,
            message: 'Save point restored successfully',
            data: {
                tag: selected.label,
                restoredFiles: rollbackResult.restoredFiles || []
            }
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Unexpected error loading save: ${error.message}`,
            error: error
        };
    }
}
//# sourceMappingURL=session-commands.js.map