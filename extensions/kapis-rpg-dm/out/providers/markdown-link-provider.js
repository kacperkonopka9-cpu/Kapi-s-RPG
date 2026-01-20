"use strict";
/**
 * Markdown Link Provider for Entity Navigation
 *
 * Story 5-11: Markdown Preview Styling (AC-3)
 *
 * Provides clickable links for NPC names, item names, and location names
 * in markdown documents, allowing navigation to their definition files.
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
exports.MarkdownLinkProvider = void 0;
exports.openEntityDefinition = openEntityDefinition;
exports.registerMarkdownLinkProvider = registerMarkdownLinkProvider;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
/**
 * Entity definition paths in the game-data folder
 */
const ENTITY_PATHS = {
    npc: 'game-data/npcs',
    item: 'game-data/items',
    location: 'game-data/locations'
};
/**
 * File extensions to look for per entity type
 */
const ENTITY_EXTENSIONS = {
    npc: ['.yaml', '.yml', '.md'],
    item: ['.yaml', '.yml', '.md'],
    location: [''] // Locations are folders, not files
};
/**
 * MarkdownLinkProvider - Provides document links for entity references in markdown
 *
 * Implements VS Code's DocumentLinkProvider to enable clickable links
 * for NPC, item, and location references in markdown files.
 */
class MarkdownLinkProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }
    /**
     * Provide document links for a markdown document
     */
    provideDocumentLinks(document, _token) {
        const links = [];
        const text = document.getText();
        // Find NPC references: **Name** pattern (bold text)
        const npcLinks = this.findEntityLinks(document, text, 'npc');
        links.push(...npcLinks);
        // Find item references: _ItemName_ or *ItemName* pattern (italic text)
        const itemLinks = this.findEntityLinks(document, text, 'item');
        links.push(...itemLinks);
        // Find location references: [Location Name] pattern (bracket notation)
        const locationLinks = this.findEntityLinks(document, text, 'location');
        links.push(...locationLinks);
        return links;
    }
    /**
     * Find entity links of a specific type in the document text
     */
    findEntityLinks(document, text, entityType) {
        const links = [];
        const patterns = this.getEntityPatterns(entityType);
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const displayName = match[1];
                const entityId = this.toEntityId(displayName);
                // Check if entity file/folder exists
                const entityPath = this.resolveEntityPath(entityType, entityId);
                if (entityPath) {
                    const startPos = document.positionAt(match.index);
                    const endPos = document.positionAt(match.index + match[0].length);
                    const range = new vscode.Range(startPos, endPos);
                    const uri = vscode.Uri.parse(`command:kapis-rpg.openEntityDefinition?${encodeURIComponent(JSON.stringify({ entityType, entityId, displayName }))}`);
                    const link = new vscode.DocumentLink(range, uri);
                    link.tooltip = `Open ${entityType}: ${displayName}`;
                    links.push(link);
                }
            }
        }
        return links;
    }
    /**
     * Get regex patterns for entity type
     */
    getEntityPatterns(entityType) {
        switch (entityType) {
            case 'npc':
                // Match **Name** (bold) - common for NPC names
                // Capture names with spaces, apostrophes, and hyphens
                return [/\*\*([A-Z][a-zA-Z\s'-]+)\*\*/g];
            case 'item':
                // Match _ItemName_ or *ItemName* (italic) - common for item names
                // Also match Sunsword, Holy Symbol, etc.
                return [
                    /_([A-Z][a-zA-Z\s'-]+)_/g,
                    /(?<!\*)\*([A-Z][a-zA-Z\s'-]+)\*(?!\*)/g
                ];
            case 'location':
                // Match [Location Name] - explicit location references
                // Exclude markdown links [text](url)
                return [/\[([A-Z][a-zA-Z\s'-]+)\](?!\()/g];
            default:
                return [];
        }
    }
    /**
     * Convert display name to entity ID (kebab-case)
     */
    toEntityId(displayName) {
        return displayName
            .toLowerCase()
            .replace(/['']/g, '') // Remove apostrophes
            .replace(/\s+/g, '-') // Spaces to hyphens
            .replace(/[^a-z0-9-]/g, ''); // Remove other special chars
    }
    /**
     * Resolve the file path for an entity
     * Returns undefined if entity doesn't exist
     */
    resolveEntityPath(entityType, entityId) {
        const basePath = path.join(this.workspaceRoot, ENTITY_PATHS[entityType]);
        if (entityType === 'location') {
            // Locations are folders
            const locationPath = path.join(basePath, entityId);
            if (fs.existsSync(locationPath) && fs.statSync(locationPath).isDirectory()) {
                return locationPath;
            }
            // Try subdirectories (e.g., game-data/locations/vallaki/blue-water-inn)
            const dirs = this.findLocationRecursively(basePath, entityId);
            if (dirs) {
                return dirs;
            }
        }
        else {
            // NPCs and items are files
            for (const ext of ENTITY_EXTENSIONS[entityType]) {
                const filePath = path.join(basePath, `${entityId}${ext}`);
                if (fs.existsSync(filePath)) {
                    return filePath;
                }
            }
        }
        return undefined;
    }
    /**
     * Recursively search for a location folder by entityId
     */
    findLocationRecursively(basePath, entityId) {
        if (!fs.existsSync(basePath)) {
            return undefined;
        }
        const entries = fs.readdirSync(basePath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const entryPath = path.join(basePath, entry.name);
                // Check if this directory matches
                if (entry.name === entityId) {
                    return entryPath;
                }
                // Recursively search subdirectories
                const found = this.findLocationRecursively(entryPath, entityId);
                if (found) {
                    return found;
                }
            }
        }
        return undefined;
    }
}
exports.MarkdownLinkProvider = MarkdownLinkProvider;
/**
 * Open an entity definition file or folder
 *
 * @param entityType - Type of entity (npc, item, location)
 * @param entityId - Entity ID (kebab-case)
 */
async function openEntityDefinition(entityType, entityId) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
    }
    const basePath = path.join(workspaceRoot, ENTITY_PATHS[entityType]);
    if (entityType === 'location') {
        // Open the location folder in explorer
        let locationPath = path.join(basePath, entityId);
        // If not found directly, search recursively
        if (!fs.existsSync(locationPath)) {
            const provider = new MarkdownLinkProvider(workspaceRoot);
            const found = provider.findLocationRecursively(basePath, entityId);
            if (found) {
                locationPath = found;
            }
        }
        if (fs.existsSync(locationPath)) {
            // Try to open Description.md if it exists
            const descPath = path.join(locationPath, 'Description.md');
            if (fs.existsSync(descPath)) {
                const doc = await vscode.workspace.openTextDocument(descPath);
                await vscode.window.showTextDocument(doc);
            }
            else {
                // Otherwise, reveal the folder in explorer
                const uri = vscode.Uri.file(locationPath);
                await vscode.commands.executeCommand('revealInExplorer', uri);
            }
        }
        else {
            vscode.window.showWarningMessage(`Location not found: ${entityId}`);
        }
    }
    else {
        // Open NPC or item file
        for (const ext of ENTITY_EXTENSIONS[entityType]) {
            const filePath = path.join(basePath, `${entityId}${ext}`);
            if (fs.existsSync(filePath)) {
                const doc = await vscode.workspace.openTextDocument(filePath);
                await vscode.window.showTextDocument(doc);
                return;
            }
        }
        vscode.window.showWarningMessage(`${entityType.toUpperCase()} not found: ${entityId}`);
    }
}
/**
 * Register the markdown link provider and related commands
 */
function registerMarkdownLinkProvider(context) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
        console.warn('MarkdownLinkProvider: No workspace folder found');
        return;
    }
    // Register document link provider for markdown files
    const provider = new MarkdownLinkProvider(workspaceRoot);
    const selector = { language: 'markdown', scheme: 'file' };
    context.subscriptions.push(vscode.languages.registerDocumentLinkProvider(selector, provider));
    // Register the openEntityDefinition command
    context.subscriptions.push(vscode.commands.registerCommand('kapis-rpg.openEntityDefinition', async (args) => {
        await openEntityDefinition(args.entityType, args.entityId);
    }));
    console.log('MarkdownLinkProvider registered successfully');
}
//# sourceMappingURL=markdown-link-provider.js.map