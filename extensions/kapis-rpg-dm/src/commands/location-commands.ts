/**
 * Location commands - Context menu commands for location tree view
 *
 * Implements "Travel Here", "View Location Details", and "Open in Explorer" commands
 * for the location tree view.
 *
 * @module location-commands
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';

/**
 * Open location Description.md file
 * @param locationId Location ID to open
 */
export async function openLocationDescription(locationId: string): Promise<void> {
  try {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    const descriptionPath = path.join(
      workspaceRoot,
      'game-data',
      'locations',
      locationId,
      'Description.md'
    );

    // Check if file exists
    try {
      await fs.access(descriptionPath);
    } catch {
      vscode.window.showErrorMessage(`Description.md not found for location: ${locationId}`);
      return;
    }

    // Open file
    const doc = await vscode.workspace.openTextDocument(descriptionPath);
    await vscode.window.showTextDocument(doc);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to open location description: ${error}`);
  }
}

/**
 * Travel to selected location
 * @param locationId Location ID to travel to
 */
export async function travelToLocation(locationId: string): Promise<void> {
  try {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    // Load current session to check if location is connected
    const sessionPath = path.join(workspaceRoot, 'game-data', 'session', 'current-session.yaml');

    let currentLocationId: string | undefined;
    try {
      const sessionContent = await fs.readFile(sessionPath, 'utf-8');
      const session = yaml.load(sessionContent) as any;
      currentLocationId = session?.location?.currentLocationId;
    } catch {
      vscode.window.showErrorMessage('No active session. Start a session with /start-session first.');
      return;
    }

    if (!currentLocationId) {
      vscode.window.showErrorMessage('No current location found in session.');
      return;
    }

    // Load current location metadata to check connections
    const currentMetadataPath = path.join(
      workspaceRoot,
      'game-data',
      'locations',
      currentLocationId,
      'metadata.yaml'
    );

    try {
      const metadataContent = await fs.readFile(currentMetadataPath, 'utf-8');
      const metadata = yaml.load(metadataContent) as any;
      const connections = metadata?.connections || [];

      // Check if destination is connected
      if (!connections.includes(locationId)) {
        vscode.window.showErrorMessage(
          `Cannot travel to ${locationId}: not connected to current location (${currentLocationId}).\nValid destinations: ${connections.join(', ')}`
        );
        return;
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load location metadata: ${error}`);
      return;
    }

    // Execute /travel command via travel command handler
    const travelCommand = require('./travel');
    if (travelCommand && travelCommand.travel) {
      await travelCommand.travel({ subscriptions: [] }, locationId);
    } else {
      vscode.window.showErrorMessage('Travel command handler not found. Ensure /travel command is implemented.');
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to travel to location: ${error}`);
  }
}

/**
 * View all location details (open all 6 files in split editor)
 * @param locationId Location ID to view
 */
export async function viewLocationDetails(locationId: string): Promise<void> {
  try {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    const locationDir = path.join(workspaceRoot, 'game-data', 'locations', locationId);

    // List of files to open
    const files = [
      'Description.md',
      'NPCs.md',
      'Items.md',
      'Events.md',
      'State.md',
      'metadata.yaml'
    ];

    const filePaths: string[] = [];

    // Check which files exist
    for (const file of files) {
      const filePath = path.join(locationDir, file);
      try {
        await fs.access(filePath);
        filePaths.push(filePath);
      } catch {
        console.warn(`File not found: ${filePath}`);
      }
    }

    if (filePaths.length === 0) {
      vscode.window.showErrorMessage(`No location files found for: ${locationId}`);
      return;
    }

    // Open files in split editor
    for (let i = 0; i < filePaths.length; i++) {
      const doc = await vscode.workspace.openTextDocument(filePaths[i]);

      // First file in current column, rest in split columns
      const viewColumn = i === 0 ? vscode.ViewColumn.One : vscode.ViewColumn.Beside;

      await vscode.window.showTextDocument(doc, {
        viewColumn,
        preview: false
      });
    }

    vscode.window.showInformationMessage(`Opened ${filePaths.length} files for location: ${locationId}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to view location details: ${error}`);
  }
}

/**
 * Open location directory in VS Code Explorer
 * @param locationId Location ID to reveal
 */
export async function openLocationInExplorer(locationId: string): Promise<void> {
  try {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    const locationDir = path.join(workspaceRoot, 'game-data', 'locations', locationId);

    // Check if directory exists
    try {
      await fs.access(locationDir);
    } catch {
      vscode.window.showErrorMessage(`Location directory not found: ${locationId}`);
      return;
    }

    // Reveal in file explorer
    const uri = vscode.Uri.file(locationDir);
    await vscode.commands.executeCommand('revealInExplorer', uri);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to open location in explorer: ${error}`);
  }
}
