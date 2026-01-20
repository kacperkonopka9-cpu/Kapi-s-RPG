/**
 * FileWatcherManager - Manages file system watchers for game state files
 *
 * Provides debounced file change detection with event emission for reactive UI updates.
 * Enforces a maximum of 20 watched files to stay within VS Code's file watcher limits.
 *
 * @module file-watcher
 */

import * as vscode from 'vscode';

/**
 * File change event data
 */
export interface FileChangeEvent {
  /** File URI that changed */
  uri: vscode.Uri;

  /** File path (relative to workspace) */
  filePath: string;

  /** Change type: created, changed, deleted */
  changeType: 'created' | 'changed' | 'deleted';

  /** Timestamp of change */
  timestamp: number;
}

/**
 * Result object for file watcher operations
 */
export interface FileWatcherResult {
  /** Operation success status */
  success: boolean;

  /** Result message */
  message?: string;

  /** Error if operation failed */
  error?: Error;
}

/**
 * File watcher entry
 */
interface WatcherEntry {
  /** File system watcher */
  watcher: vscode.FileSystemWatcher;

  /** Debounce timer */
  debounceTimer: NodeJS.Timeout | null;

  /** Last change time (for debouncing) */
  lastChangeTime: number;
}

/**
 * FileWatcherManager - Manages file watching for session-critical files
 *
 * Features:
 * - Debounced file change events (300ms delay)
 * - Maximum 20 watched files (well under VS Code 100-file limit)
 * - Type-specific event emitters (character, location, calendar, session)
 * - Automatic cleanup on dispose
 */
export class FileWatcherManager {
  private watchers: Map<string, WatcherEntry> = new Map();
  private readonly maxWatchers: number = 20;
  private readonly debounceDelay: number = 300; // milliseconds

  // Event emitters for different file types
  private readonly _onCharacterUpdated = new vscode.EventEmitter<FileChangeEvent>();
  private readonly _onLocationUpdated = new vscode.EventEmitter<FileChangeEvent>();
  private readonly _onCalendarUpdated = new vscode.EventEmitter<FileChangeEvent>();
  private readonly _onSessionUpdated = new vscode.EventEmitter<FileChangeEvent>();
  private readonly _onFileUpdated = new vscode.EventEmitter<FileChangeEvent>();

  /** Event fired when character file changes */
  public readonly onCharacterUpdated: vscode.Event<FileChangeEvent> = this._onCharacterUpdated.event;

  /** Event fired when location file changes */
  public readonly onLocationUpdated: vscode.Event<FileChangeEvent> = this._onLocationUpdated.event;

  /** Event fired when calendar file changes */
  public readonly onCalendarUpdated: vscode.Event<FileChangeEvent> = this._onCalendarUpdated.event;

  /** Event fired when session file changes */
  public readonly onSessionUpdated: vscode.Event<FileChangeEvent> = this._onSessionUpdated.event;

  /** Event fired when any watched file changes */
  public readonly onFileUpdated: vscode.Event<FileChangeEvent> = this._onFileUpdated.event;

  /**
   * Watch a file for changes
   * @param filePath Absolute file path to watch
   * @param fileType File type: 'character', 'location', 'calendar', 'session', 'other'
   * @returns Result object indicating success/failure
   */
  public watch(filePath: string, fileType: 'character' | 'location' | 'calendar' | 'session' | 'other' = 'other'): FileWatcherResult {
    try {
      // Check if already watching
      if (this.watchers.has(filePath)) {
        return {
          success: true,
          message: `Already watching: ${filePath}`
        };
      }

      // Check file watcher limit
      if (this.watchers.size >= this.maxWatchers) {
        return {
          success: false,
          message: `File watcher limit reached (${this.maxWatchers} files). Cannot watch: ${filePath}`
        };
      }

      // Create file system watcher for this specific file
      const pattern = new vscode.RelativePattern(vscode.Uri.file(filePath).fsPath, '**');
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);

      const entry: WatcherEntry = {
        watcher,
        debounceTimer: null,
        lastChangeTime: 0
      };

      // Handle file changes with debouncing
      const handleChange = (uri: vscode.Uri, changeType: 'created' | 'changed' | 'deleted') => {
        const now = Date.now();

        // Cancel existing debounce timer
        if (entry.debounceTimer) {
          clearTimeout(entry.debounceTimer);
        }

        // Set new debounce timer
        entry.debounceTimer = setTimeout(() => {
          entry.lastChangeTime = now;
          entry.debounceTimer = null;

          const event: FileChangeEvent = {
            uri,
            filePath,
            changeType,
            timestamp: now
          };

          // Emit type-specific event
          switch (fileType) {
            case 'character':
              this._onCharacterUpdated.fire(event);
              break;
            case 'location':
              this._onLocationUpdated.fire(event);
              break;
            case 'calendar':
              this._onCalendarUpdated.fire(event);
              break;
            case 'session':
              this._onSessionUpdated.fire(event);
              break;
          }

          // Always emit general file update event
          this._onFileUpdated.fire(event);
        }, this.debounceDelay);
      };

      // Register event handlers
      watcher.onDidCreate(uri => handleChange(uri, 'created'));
      watcher.onDidChange(uri => handleChange(uri, 'changed'));
      watcher.onDidDelete(uri => handleChange(uri, 'deleted'));

      // Store watcher entry
      this.watchers.set(filePath, entry);

      return {
        success: true,
        message: `Now watching: ${filePath}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to watch file: ${filePath}`,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Stop watching a file
   * @param filePath File path to stop watching
   * @returns Result object indicating success/failure
   */
  public unwatch(filePath: string): FileWatcherResult {
    try {
      const entry = this.watchers.get(filePath);

      if (!entry) {
        return {
          success: true,
          message: `Not watching: ${filePath}`
        };
      }

      // Cancel debounce timer
      if (entry.debounceTimer) {
        clearTimeout(entry.debounceTimer);
      }

      // Dispose watcher
      entry.watcher.dispose();

      // Remove from map
      this.watchers.delete(filePath);

      return {
        success: true,
        message: `Stopped watching: ${filePath}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to unwatch file: ${filePath}`,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Check if a file is being watched
   * @param filePath File path to check
   * @returns True if file is being watched
   */
  public isWatching(filePath: string): boolean {
    return this.watchers.has(filePath);
  }

  /**
   * Get list of all watched file paths
   * @returns Array of watched file paths
   */
  public getWatchedFiles(): string[] {
    return Array.from(this.watchers.keys());
  }

  /**
   * Get count of currently watched files
   * @returns Number of watched files
   */
  public getWatchedCount(): number {
    return this.watchers.size;
  }

  /**
   * Get maximum number of files that can be watched
   * @returns Maximum watcher limit
   */
  public getMaxWatchers(): number {
    return this.maxWatchers;
  }

  /**
   * Dispose all watchers and clean up resources
   */
  public disposeAll(): void {
    // Cancel all debounce timers
    for (const entry of this.watchers.values()) {
      if (entry.debounceTimer) {
        clearTimeout(entry.debounceTimer);
      }
      entry.watcher.dispose();
    }

    // Clear watchers map
    this.watchers.clear();

    // Dispose event emitters
    this._onCharacterUpdated.dispose();
    this._onLocationUpdated.dispose();
    this._onCalendarUpdated.dispose();
    this._onSessionUpdated.dispose();
    this._onFileUpdated.dispose();
  }
}
