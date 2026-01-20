# VS Code Extension Development Guide

## Overview

The Kapi's RPG VS Code extension provides sidebar UI panels and tree views to enhance the solo RPG experience. This guide covers the architecture, APIs, and development patterns for building panels and integrating with the game systems.

**Extension Location:** `extensions/kapis-rpg-dm/`

**Key Components:**
- **BasePanel:** Abstract class providing panel lifecycle and webview management
- **LocationTreeProvider:** Tree view provider displaying game locations
- **FileWatcherManager:** File system watching with debouncing and event emission
- **Location Commands:** Context menu integration for location navigation

## Extension Architecture

### Directory Structure

```
extensions/kapis-rpg-dm/
├── package.json                        # Extension manifest
├── tsconfig.json                       # TypeScript configuration
├── src/
│   ├── extension.ts                    # Extension entry point
│   ├── panels/
│   │   └── base-panel.ts               # BasePanel abstract class
│   ├── providers/
│   │   └── location-tree-provider.ts   # LocationTreeProvider class
│   ├── commands/
│   │   ├── registry.ts                 # CommandRegistry from Story 5-4
│   │   ├── location-commands.ts        # Tree view context menu commands
│   │   ├── start-session.ts            # Session commands
│   │   ├── travel.ts                   # Navigation commands
│   │   └── ...                         # Other command handlers
│   └── utils/
│       └── file-watcher.ts             # FileWatcherManager class
└── media/
    ├── panels/
    │   └── base-template.html          # Base HTML template for webview panels
    ├── styles/
    │   └── panel-theme.css             # Gothic dark theme styling
    └── icons/
        └── ...                         # SVG icons (future)
```

### Activation Flow

1. **VS Code activates extension** when:
   - User opens workspace containing `game-data/calendar.yaml`
   - User invokes extension command (e.g., `/start-session`)
   - User opens location tree view

2. **Extension `activate()` function:**
   - Creates `FileWatcherManager` singleton
   - Creates `LocationTreeProvider` and registers tree view
   - Registers all commands via `CommandRegistry`
   - Sets up panel command stubs (full implementation in Stories 5-8/5-9/5-10)

3. **Extension `deactivate()` function:**
   - Disposes `FileWatcherManager` (unwatches all files)
   - Cleans up panels and subscriptions

## BasePanel API

### Overview

`BasePanel` is an abstract class providing common panel lifecycle methods, HTML template loading, message passing, and state persistence. All webview panels should extend `BasePanel`.

**File:** `extensions/kapis-rpg-dm/src/panels/base-panel.ts`

### Creating a Custom Panel

```typescript
import { BasePanel, PanelConfig, PanelResult, PanelMessage } from './base-panel';
import * as vscode from 'vscode';

export class CharacterSheetPanel extends BasePanel {
  constructor(context: vscode.ExtensionContext) {
    const config: PanelConfig = {
      viewType: 'kapis-rpg.characterSheet',
      title: 'Character Sheet',
      templatePath: 'panels/character-sheet.html'
    };

    super(context, config);
  }

  // Provide initial panel state (called when panel first shown)
  protected async getInitialState(): Promise<any> {
    // Load character data from file
    const characterPath = path.join(this.workspaceRoot, 'characters/kapi.yaml');
    const characterData = await this.loadCharacterData(characterPath);

    return {
      character: characterData,
      timestamp: new Date().toISOString()
    };
  }

  // Handle messages from webview
  protected async handleMessage(message: PanelMessage): Promise<void> {
    switch (message.type) {
      case 'updateHP':
        await this.updateCharacterHP(message.payload.newHP);
        await this.refresh(); // Re-render panel
        break;

      case 'levelUp':
        await this.handleLevelUp();
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  // Refresh panel data (called when refresh() is invoked)
  protected async refreshData(): Promise<any> {
    // Reload character data
    return await this.getInitialState();
  }

  // Custom helper methods
  private async loadCharacterData(filePath: string): Promise<any> {
    // Implementation...
  }

  private async updateCharacterHP(newHP: number): Promise<void> {
    // Implementation...
  }

  private async handleLevelUp(): Promise<void> {
    // Implementation...
  }
}
```

### Lifecycle Methods

#### `show(): Promise<PanelResult>`

Creates and shows the webview panel. Loads HTML template, sends initial state to webview.

**Returns:** `{success: true}` on success, `{success: false, error: string}` on failure

```typescript
const result = await panel.show();
if (!result.success) {
  vscode.window.showErrorMessage(`Failed to show panel: ${result.error}`);
}
```

#### `hide(): Promise<PanelResult>`

Hides the panel (disposes webview, panel no longer visible).

**Returns:** `{success: true}` always (safe to call even if panel not shown)

```typescript
await panel.hide();
```

#### `refresh(): Promise<PanelResult>`

Refreshes panel data by calling `refreshData()` and sending updated state to webview.

**Returns:** `{success: true, data: any}` on success with refreshed data, `{success: false, error: string}` if panel not visible

```typescript
const result = await panel.refresh();
if (result.success) {
  console.log('Panel refreshed with data:', result.data);
}
```

#### `dispose(): void`

Disposes panel resources (webview, subscriptions, event listeners). Called automatically when panel closed by user.

```typescript
panel.dispose(); // Clean up resources
```

### Abstract Methods (Must Implement)

#### `getInitialState(): Promise<any>`

Returns initial data to send to webview when panel first shown.

**Example:**
```typescript
protected async getInitialState(): Promise<any> {
  return {
    location: await this.loadCurrentLocation(),
    calendar: await this.loadCalendarState(),
    character: await this.loadCharacterData()
  };
}
```

#### `handleMessage(message: PanelMessage): Promise<void>`

Handles messages from webview. Use this for user interactions (button clicks, form submissions).

**Message Format:**
```typescript
interface PanelMessage {
  type: string;
  payload: any;
}
```

**Example:**
```typescript
protected async handleMessage(message: PanelMessage): Promise<void> {
  switch (message.type) {
    case 'roll-dice':
      const result = await this.rollDice(message.payload.formula);
      await this.sendMessage('dice-result', { result });
      break;

    case 'save-changes':
      await this.saveData(message.payload);
      break;
  }
}
```

#### `refreshData(): Promise<any>`

Reloads panel data when `refresh()` is called. Return updated data to send to webview.

**Example:**
```typescript
protected async refreshData(): Promise<any> {
  return await this.getInitialState(); // Re-fetch all data
}
```

### Message Passing

#### Extension → Webview

Send messages from extension to webview:

```typescript
// In panel class
protected async sendMessage(type: string, payload: any): Promise<void> {
  if (this.panel) {
    await this.panel.webview.postMessage({ type, payload });
  }
}

// Usage
await this.sendMessage('character-updated', { hp: 50, maxHp: 100 });
```

#### Webview → Extension

Send messages from webview to extension:

```html
<!-- In HTML template -->
<script nonce="{{nonce}}">
  const vscode = acquireVsCodeApi();

  function rollDice(formula) {
    vscode.postMessage({
      type: 'roll-dice',
      payload: { formula }
    });
  }

  // Receive messages from extension
  window.addEventListener('message', event => {
    const message = event.data;

    switch (message.type) {
      case 'dice-result':
        displayResult(message.payload.result);
        break;
    }
  });
</script>
```

### State Persistence

BasePanel automatically saves panel state to VS Code workspace state. Override `getInitialState()` to restore state across VS Code restarts.

**Example:**
```typescript
protected async getInitialState(): Promise<any> {
  // Load persisted state
  const savedState = this.context.workspaceState.get('character-sheet-state');

  if (savedState) {
    return savedState; // Restore previous state
  }

  // First time, load from file
  return await this.loadCharacterData();
}

// Save state when user makes changes
private async saveState(newState: any): Promise<void> {
  await this.context.workspaceState.update('character-sheet-state', newState);
}
```

### Content Security Policy (CSP)

BasePanel automatically configures CSP for secure webviews. Default policy:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'none';
  img-src ${webview.cspSource} https:;
  script-src 'nonce-${nonce}';
  style-src ${webview.cspSource} 'unsafe-inline';
  font-src ${webview.cspSource};
">
```

**Key Points:**
- Scripts must use `nonce` attribute: `<script nonce="{{nonce}}">`
- Images/fonts loaded from `media/` directory only (via `${webview.cspSource}`)
- Inline styles allowed via `'unsafe-inline'` (for dynamic styling)

**Override CSP in subclass:**
```typescript
protected getContentSecurityPolicy(nonce: string): string {
  // Custom CSP policy
  return `default-src 'none'; script-src 'nonce-${nonce}';`;
}
```

## FileWatcherManager API

### Overview

`FileWatcherManager` provides file system watching with debouncing and type-specific event emission. Panels subscribe to file change events to auto-refresh when game state files are modified.

**File:** `extensions/kapis-rpg-dm/src/utils/file-watcher.ts`

### Usage

#### Watch a File

```typescript
import { getFileWatcherManager } from '../extension';

const fileWatcher = getFileWatcherManager();

// Watch character file
const result = fileWatcher.watch(
  '/path/to/characters/kapi.yaml',
  'character'
);

if (!result.success) {
  console.error('Failed to watch file:', result.message);
}
```

#### Unwatch a File

```typescript
const result = fileWatcher.unwatch('/path/to/characters/kapi.yaml');

if (result.success) {
  console.log('File unwatched successfully');
}
```

#### Subscribe to File Change Events

```typescript
// Subscribe to character file changes
fileWatcher.onCharacterUpdated(event => {
  console.log('Character file updated:', event.filePath);
  console.log('Change type:', event.changeType); // 'created' | 'changed' | 'deleted'

  // Refresh character sheet panel
  await characterSheetPanel.refresh();
});

// Subscribe to location file changes
fileWatcher.onLocationUpdated(event => {
  console.log('Location file updated:', event.filePath);
  await locationPanels.refreshAll();
});

// Subscribe to calendar file changes
fileWatcher.onCalendarUpdated(event => {
  console.log('Calendar updated:', event.filePath);
  await calendarWidget.refresh();
});

// Subscribe to session file changes
fileWatcher.onSessionUpdated(event => {
  console.log('Session updated:', event.filePath);
  await sessionPanel.refresh();
});

// Subscribe to any file change
fileWatcher.onFileUpdated(event => {
  console.log('File updated:', event.filePath, event.fileType);
});
```

### API Reference

#### `watch(filePath: string, fileType: string): FileWatcherResult`

Starts watching a file for changes.

**Parameters:**
- `filePath`: Absolute path to file to watch
- `fileType`: File type for event categorization: `'character' | 'location' | 'calendar' | 'session' | 'other'`

**Returns:** `{success: true}` on success, `{success: false, message: string}` on failure

**Failure Conditions:**
- Max watchers limit reached (20 files)
- Invalid file path

**Debouncing:** File changes are debounced by 300ms to avoid rapid re-renders

#### `unwatch(filePath: string): FileWatcherResult`

Stops watching a file.

**Parameters:**
- `filePath`: Absolute path to file to unwatch

**Returns:** `{success: true}` on success, `{success: false, message: string}` if file not being watched

#### `disposeAll(): void`

Unwatches all files and releases resources. Called automatically in `deactivate()`.

```typescript
fileWatcher.disposeAll();
```

#### `isWatching(filePath: string): boolean`

Checks if a file is currently being watched.

```typescript
if (fileWatcher.isWatching('/path/to/file.yaml')) {
  console.log('File is being watched');
}
```

#### `getWatchedFiles(): string[]`

Returns list of all watched file paths.

```typescript
const watchedFiles = fileWatcher.getWatchedFiles();
console.log('Watching', watchedFiles.length, 'files');
```

#### `getWatchedCount(): number`

Returns count of watched files.

```typescript
const count = fileWatcher.getWatchedCount();
console.log(`Watching ${count} of ${fileWatcher.getMaxWatchers()} max files`);
```

#### `getMaxWatchers(): number`

Returns maximum allowed watched files (20).

```typescript
const max = fileWatcher.getMaxWatchers(); // 20
```

### Event Emitters

#### `onCharacterUpdated: vscode.Event<FileChangeEvent>`

Emitted when a character file changes (files watched with `fileType: 'character'`).

#### `onLocationUpdated: vscode.Event<FileChangeEvent>`

Emitted when a location file changes (files watched with `fileType: 'location'`).

#### `onCalendarUpdated: vscode.Event<FileChangeEvent>`

Emitted when the calendar file changes (files watched with `fileType: 'calendar'`).

#### `onSessionUpdated: vscode.Event<FileChangeEvent>`

Emitted when session state file changes (files watched with `fileType: 'session'`).

#### `onFileUpdated: vscode.Event<FileChangeEvent>`

Emitted when any watched file changes (catch-all event).

### FileChangeEvent Interface

```typescript
interface FileChangeEvent {
  filePath: string;                        // Absolute path to changed file
  fileType: string;                        // File type: 'character' | 'location' | 'calendar' | 'session' | 'other'
  changeType: 'created' | 'changed' | 'deleted';  // Type of change
  timestamp: number;                       // Timestamp of change (ms since epoch)
}
```

### Example: Auto-Refreshing Panel

```typescript
export class CharacterSheetPanel extends BasePanel {
  private fileWatcherDisposable: vscode.Disposable | undefined;

  constructor(context: vscode.ExtensionContext) {
    super(context, { /* config */ });

    // Subscribe to character file changes
    const fileWatcher = getFileWatcherManager();
    this.fileWatcherDisposable = fileWatcher.onCharacterUpdated(async event => {
      console.log('Character file changed, refreshing panel');
      await this.refresh();
    });
  }

  public override dispose(): void {
    // Unsubscribe from file watcher events
    if (this.fileWatcherDisposable) {
      this.fileWatcherDisposable.dispose();
      this.fileWatcherDisposable = undefined;
    }

    super.dispose();
  }

  protected async getInitialState(): Promise<any> {
    const characterPath = path.join(this.workspaceRoot, 'characters/kapi.yaml');

    // Watch character file for changes
    const fileWatcher = getFileWatcherManager();
    fileWatcher.watch(characterPath, 'character');

    // Load and return character data
    return await this.loadCharacterData(characterPath);
  }
}
```

## LocationTreeProvider API

### Overview

`LocationTreeProvider` implements VS Code's `TreeDataProvider` interface to display game locations in a hierarchical tree view in the sidebar.

**File:** `extensions/kapis-rpg-dm/src/providers/location-tree-provider.ts`

### Features

- **Hierarchical Structure:** Locations organized by parent location (from `metadata.yaml`)
- **Current Location Highlighting:** Shows current location based on `current-session.yaml`
- **Icon Differentiation:** Different icons for villages, dungeons, castles, wilderness
- **Context Menus:** Right-click menus for navigation and file operations
- **Session Integration:** Loads current location from session state on activation

### Tree View Registration

Tree view registered in `extension.ts`:

```typescript
const locationTreeProvider = new LocationTreeProvider(workspaceRoot);

const treeView = vscode.window.createTreeView('kapis-rpg-locations', {
  treeDataProvider: locationTreeProvider,
  showCollapseAll: true
});

context.subscriptions.push(treeView);
```

### API Reference

#### `refresh(): Promise<void>`

Reloads tree structure from disk (scans `game-data/locations/` directory).

```typescript
await locationTreeProvider.refresh();
```

#### `setCurrentLocation(locationId: string): Promise<void>`

Sets the current location (updates highlighting in tree).

```typescript
await locationTreeProvider.setCurrentLocation('village-of-barovia');
```

#### `loadCurrentLocationFromSession(): Promise<void>`

Loads current location from `current-session.yaml` and updates tree highlighting.

```typescript
await locationTreeProvider.loadCurrentLocationFromSession();
```

### LocationTreeItem Interface

```typescript
class LocationTreeItem extends vscode.TreeItem {
  locationId: string;               // Unique location ID (e.g., 'village-of-barovia')
  locationName: string;             // Display name (e.g., 'Village of Barovia')
  locationType: string;             // Type: 'village' | 'dungeon' | 'castle' | 'wilderness'
  connections: string[];            // Connected location IDs
  parentLocation: string | undefined; // Parent location ID
  children: LocationTreeItem[];     // Child locations
  isCurrent: boolean;               // Is this the current location?
}
```

### Icon Mapping

| Location Type | Icon |
|---------------|------|
| `village`, `town` | `home` (house icon) |
| `dungeon`, `ruins` | `symbol-misc` (skull-like) |
| `castle`, `fortress` | `symbol-structure` (tower) |
| `wilderness`, `forest`, `mountain` | `tree` |
| `building`, `shop`, `inn` | `symbol-event` |
| Current location | Yellow color overlay |

## Location Commands API

### Overview

Location commands provide context menu actions for location tree items.

**File:** `extensions/kapis-rpg-dm/src/commands/location-commands.ts`

### Commands

#### `kapis-rpg.openLocationDescription`

Opens the location's `Description.md` file in editor.

**Usage:** Click on location tree item

**Implementation:**
```typescript
export async function openLocationDescription(locationId: string): Promise<void> {
  const filePath = path.join(workspaceRoot, 'game-data/locations', locationId, 'Description.md');
  const doc = await vscode.workspace.openTextDocument(filePath);
  await vscode.window.showTextDocument(doc);
}
```

#### `kapis-rpg.travelToLocation`

Travels to selected location (if connected to current location).

**Usage:** Right-click location → "Travel Here"

**Validation:**
- Checks if location is connected to current location
- Shows error if not connected or no active session

**Implementation:**
```typescript
export async function travelToLocation(locationId: string): Promise<void> {
  // Load current session
  const session = await loadSession();
  const currentLocationId = session?.location?.currentLocationId;

  // Load current location metadata
  const metadata = await loadLocationMetadata(currentLocationId);
  const connections = metadata?.connections || [];

  if (!connections.includes(locationId)) {
    vscode.window.showErrorMessage(`Cannot travel to ${locationId}: not connected`);
    return;
  }

  // Execute /travel command
  const travelCommand = require('./travel');
  await travelCommand.travel(context, locationId);
}
```

#### `kapis-rpg.viewLocationDetails`

Opens all 6 location files in split editor.

**Usage:** Right-click location → "View Location Details"

**Files Opened:**
1. `Description.md`
2. `NPCs.md`
3. `Items.md`
4. `Events.md`
5. `State.md`
6. `metadata.yaml`

#### `kapis-rpg.openLocationInExplorer`

Reveals location directory in VS Code file explorer.

**Usage:** Right-click location → "Open in Explorer"

### Context Menu Configuration

Defined in `package.json`:

```json
{
  "menus": {
    "view/item/context": [
      {
        "command": "kapis-rpg.travelToLocation",
        "when": "view == kapis-rpg-locations && viewItem =~ /location_hasConnections/",
        "group": "navigation@1"
      },
      {
        "command": "kapis-rpg.viewLocationDetails",
        "when": "view == kapis-rpg-locations",
        "group": "navigation@2"
      },
      {
        "command": "kapis-rpg.openLocationInExplorer",
        "when": "view == kapis-rpg-locations",
        "group": "navigation@3"
      }
    ]
  }
}
```

## Integrating with Epic Systems

### Epic 1 Integration (LocationLoader)

Load location metadata for tree view:

```typescript
const LocationLoader = require('../../src/data/location-loader.js');

const locationLoader = new LocationLoader();
const result = await locationLoader.loadLocation('village-of-barovia');

if (result.success) {
  const locationData = result.data;
  console.log('Location name:', locationData.metadata.location_name);
  console.log('Connections:', locationData.metadata.connections);
}
```

### Epic 2 Integration (CalendarManager)

Watch calendar file for changes:

```typescript
const calendarPath = path.join(workspaceRoot, 'game-data/calendar.yaml');
fileWatcher.watch(calendarPath, 'calendar');

fileWatcher.onCalendarUpdated(async event => {
  console.log('Calendar updated, refreshing UI');
  await calendarWidget.refresh();
});
```

### Story 5-1 Integration (ContextLoader)

Load context for panel data:

```typescript
const ContextLoader = require('../../src/context/context-loader.js');

const contextLoader = new ContextLoader();
const result = await contextLoader.loadContext({
  loadCharacter: true,
  loadLocation: true,
  loadCalendar: true
});

if (result.success) {
  // Use context.character, context.location, context.calendar in panel
  return result.data;
}
```

### Story 5-4 Integration (CommandRegistry)

Register panel commands:

```typescript
registry.registerCommand({
  commandId: 'kapis-rpg.showCharacterSheet',
  name: '/character-sheet',
  category: 'ui',
  args: [],
  handler: async (context) => {
    const panel = new CharacterSheetPanel(context);
    await panel.show();
    return { success: true };
  },
  requiresSession: false
});
```

### Story 5-6 Integration (Session Management)

**Epic 5 Story 5-6** provides comprehensive session lifecycle management through `SessionManager`, `SessionLogger`, and `GitIntegration`.

#### Using SessionManager

```typescript
const SessionManager = require('../../../src/session/session-manager');

const sessionManager = new SessionManager();

// Start session
const result = await sessionManager.startSession('characters/kapi.yaml', 'village-of-barovia', 300);

// Get current session
const session = await sessionManager.getCurrentSession();

// Update session state (deep merge)
await sessionManager.updateSession({
  location: { currentLocationId: 'vallaki' },
  calendar: { timePassed: '6 hours' }
});

// End session
sessionManager.sessionLogger = new SessionLogger();
sessionManager.gitIntegration = new GitIntegration();
await sessionManager.endSession('Session summary');
```

#### Using SessionLogger

```typescript
const SessionLogger = require('../../../src/session/session-logger');

const logger = new SessionLogger();
const summary = await logger.generateSummary(sessionState, 'Player summary');
const saveResult = await logger.saveLog(summary.logContent, sessionState.sessionId);
```

#### Using GitIntegration

```typescript
const GitIntegration = require('../../../src/session/git-integration');

const git = new GitIntegration();
await git.commitSession(sessionState, 'Explored the village');
await git.createSavePoint('pre-castle', 'Before Castle Ravenloft');
const saves = await git.listSavePoints();
await git.rollbackToSave('save/pre-castle');
```

See [Session Management Guide](session-management-guide.md) for complete usage documentation.

## Troubleshooting

### Common Issues

#### Panel Not Rendering

**Symptom:** Webview panel shows blank screen

**Causes:**
1. CSP blocking scripts/styles
2. Template path incorrect
3. HTML template has errors

**Solutions:**
1. Check CSP allows scripts with nonce: `<script nonce="{{nonce}}">`
2. Verify `templatePath` in `PanelConfig` is correct
3. Check browser console (Help → Toggle Developer Tools → Console)

#### File Watcher Limit Reached

**Symptom:** `watch()` returns `{success: false, message: "File watcher limit reached"}`

**Cause:** Watching more than 20 files

**Solution:**
- Unwatch less critical files: `fileWatcher.unwatch(filePath)`
- Use `fileWatcher.getWatchedFiles()` to see what's being watched
- Prioritize character/location/calendar files over other files

#### Tree View Empty

**Symptom:** Location tree view shows no items

**Causes:**
1. No locations in `game-data/locations/` directory
2. Missing `metadata.yaml` files
3. Locations not in hierarchy (all have `parent_location` pointing to non-existent parents)

**Solutions:**
1. Ensure at least one location exists with valid `metadata.yaml`
2. Validate locations: `npm run validate-location`
3. Check at least one location has `parent_location: null` (root location)

#### Context Menu Not Appearing

**Symptom:** Right-click on tree item doesn't show context menu

**Causes:**
1. Command not registered in `package.json`
2. `when` clause in menu item doesn't match tree item context
3. Command handler not registered in `extension.ts`

**Solutions:**
1. Check `package.json` → `contributes.menus.view/item/context`
2. Verify tree item has correct `contextValue` (e.g., `location_hasConnections`)
3. Ensure command registered: `vscode.commands.registerCommand('kapis-rpg.commandId', handler)`

#### Panel Not Auto-Refreshing

**Symptom:** Panel doesn't update when file changes

**Causes:**
1. File not being watched
2. Event listener not registered
3. Event listener disposed prematurely

**Solutions:**
1. Check file is watched: `fileWatcher.isWatching(filePath)`
2. Subscribe to appropriate event: `fileWatcher.onCharacterUpdated(handler)`
3. Store event disposable and dispose in panel's `dispose()` method

### CSP Errors

#### Script Blocked

**Error:** `Refused to execute inline script because it violates CSP directive`

**Cause:** Script tag missing `nonce` attribute

**Solution:** Add nonce to script tag: `<script nonce="{{nonce}}">`

#### Stylesheet Blocked

**Error:** `Refused to load stylesheet because it violates CSP directive`

**Cause:** Stylesheet not from allowed source

**Solution:**
- Use `{{stylesUri}}` placeholder: `<link rel="stylesheet" href="{{stylesUri}}/panel-theme.css">`
- Or use inline styles (allowed via `'unsafe-inline'`)

#### Image Blocked

**Error:** `Refused to load image because it violates CSP directive`

**Cause:** Image URL not from allowed source

**Solution:** Use `webview.asWebviewUri()` to convert file path to webview URI

```typescript
const imageUri = this.panel.webview.asWebviewUri(
  vscode.Uri.joinPath(this.extensionUri, 'media', 'icons', 'village.svg')
);

// In HTML template
html = html.replace('{{imageUri}}', imageUri.toString());
```

## Best Practices

### Performance

1. **Lazy Loading:** Only create panels when user opens them (don't create on activation)
2. **Debouncing:** FileWatcherManager debounces file changes by 300ms (avoid manual debouncing)
3. **Caching:** Cache loaded location data in memory (LocationTreeProvider pattern)
4. **Batch Updates:** If updating multiple files, batch state updates to minimize refreshes

### Error Handling

1. **Result Objects:** All async operations return `{success, data?, error?}` - always check `success`
2. **Graceful Degradation:** Panel should handle missing files gracefully (show error state, not crash)
3. **User Feedback:** Show error messages to user via `vscode.window.showErrorMessage()`

### State Management

1. **Persistence:** Use `context.workspaceState` for panel state across sessions
2. **Session Integration:** Always load current location from `current-session.yaml`
3. **File Watching:** Watch critical files (character, location, calendar) for auto-refresh

### Code Organization

1. **Separation of Concerns:** Panel logic in `panels/`, commands in `commands/`, providers in `providers/`
2. **TypeScript-JavaScript Interop:** Use `require()` to import Epic modules (CommonJS)
3. **Result Object Pattern:** Maintain consistency with Epic systems (no exceptions for control flow)

## Next Steps

### Implementing Character Sheet Panel (Story 5-8)

1. Extend `BasePanel` class
2. Create `media/panels/character-sheet.html` template
3. Implement `getInitialState()` to load character data
4. Implement `handleMessage()` for HP updates, level up, etc.
5. Subscribe to character file changes for auto-refresh

### Implementing Quest Tracker Panel (Story 5-9)

1. Extend `BasePanel` class
2. Load quest data from `game-data/quests/` directory
3. Display quest progress, objectives, rewards
4. Subscribe to quest file changes

### Implementing Calendar Widget (Story 5-10)

1. Extend `BasePanel` class (or create simpler widget)
2. Load calendar state from `game-data/calendar.yaml`
3. Display current date, moon phase, weather
4. Subscribe to calendar file changes

## References

- **VS Code Extension API:** https://code.visualstudio.com/api
- **TreeDataProvider Guide:** https://code.visualstudio.com/api/extension-guides/tree-view
- **Webview Guide:** https://code.visualstudio.com/api/extension-guides/webview
- **Content Security Policy:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

---

**Last Updated:** 2025-11-22
**Story:** 5-5 (VS Code UI Improvements)
**Version:** 0.1.0
