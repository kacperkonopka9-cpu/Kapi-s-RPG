/**
 * Markdown Link Provider for Entity Navigation
 *
 * Story 5-11: Markdown Preview Styling (AC-3)
 *
 * Provides clickable links for NPC names, item names, and location names
 * in markdown documents, allowing navigation to their definition files.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Entity types supported for navigation
 */
export type EntityType = 'npc' | 'item' | 'location';

/**
 * Entity link information
 */
export interface EntityLink {
  entityType: EntityType;
  entityId: string;
  displayName: string;
  range: vscode.Range;
}

/**
 * Entity definition paths in the game-data folder
 */
const ENTITY_PATHS: Record<EntityType, string> = {
  npc: 'game-data/npcs',
  item: 'game-data/items',
  location: 'game-data/locations'
};

/**
 * File extensions to look for per entity type
 */
const ENTITY_EXTENSIONS: Record<EntityType, string[]> = {
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
export class MarkdownLinkProvider implements vscode.DocumentLinkProvider {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Provide document links for a markdown document
   */
  public provideDocumentLinks(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DocumentLink[]> {
    const links: vscode.DocumentLink[] = [];
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
  private findEntityLinks(
    document: vscode.TextDocument,
    text: string,
    entityType: EntityType
  ): vscode.DocumentLink[] {
    const links: vscode.DocumentLink[] = [];
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

          const uri = vscode.Uri.parse(
            `command:kapis-rpg.openEntityDefinition?${encodeURIComponent(
              JSON.stringify({ entityType, entityId, displayName })
            )}`
          );

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
  private getEntityPatterns(entityType: EntityType): RegExp[] {
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
  private toEntityId(displayName: string): string {
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
  private resolveEntityPath(entityType: EntityType, entityId: string): string | undefined {
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
    } else {
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
  private findLocationRecursively(basePath: string, entityId: string): string | undefined {
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

/**
 * Open an entity definition file or folder
 *
 * @param entityType - Type of entity (npc, item, location)
 * @param entityId - Entity ID (kebab-case)
 */
export async function openEntityDefinition(
  entityType: EntityType,
  entityId: string
): Promise<void> {
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
      const found = (provider as any).findLocationRecursively(basePath, entityId);
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
      } else {
        // Otherwise, reveal the folder in explorer
        const uri = vscode.Uri.file(locationPath);
        await vscode.commands.executeCommand('revealInExplorer', uri);
      }
    } else {
      vscode.window.showWarningMessage(`Location not found: ${entityId}`);
    }
  } else {
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
export function registerMarkdownLinkProvider(
  context: vscode.ExtensionContext
): void {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!workspaceRoot) {
    console.warn('MarkdownLinkProvider: No workspace folder found');
    return;
  }

  // Register document link provider for markdown files
  const provider = new MarkdownLinkProvider(workspaceRoot);
  const selector: vscode.DocumentSelector = { language: 'markdown', scheme: 'file' };

  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(selector, provider)
  );

  // Register the openEntityDefinition command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'kapis-rpg.openEntityDefinition',
      async (args: { entityType: EntityType; entityId: string; displayName: string }) => {
        await openEntityDefinition(args.entityType, args.entityId);
      }
    )
  );

  console.log('MarkdownLinkProvider registered successfully');
}
