"use strict";
/**
 * FileWatcherManager - Manages file system watchers for game state files
 *
 * Provides debounced file change detection with event emission for reactive UI updates.
 * Enforces a maximum of 20 watched files to stay within VS Code's file watcher limits.
 *
 * @module file-watcher
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
exports.FileWatcherManager = void 0;
const vscode = __importStar(require("vscode"));
/**
 * FileWatcherManager - Manages file watching for session-critical files
 *
 * Features:
 * - Debounced file change events (300ms delay)
 * - Maximum 20 watched files (well under VS Code 100-file limit)
 * - Type-specific event emitters (character, location, calendar, session)
 * - Automatic cleanup on dispose
 */
class FileWatcherManager {
    constructor() {
        this.watchers = new Map();
        this.maxWatchers = 20;
        this.debounceDelay = 300; // milliseconds
        // Event emitters for different file types
        this._onCharacterUpdated = new vscode.EventEmitter();
        this._onLocationUpdated = new vscode.EventEmitter();
        this._onCalendarUpdated = new vscode.EventEmitter();
        this._onSessionUpdated = new vscode.EventEmitter();
        this._onFileUpdated = new vscode.EventEmitter();
        /** Event fired when character file changes */
        this.onCharacterUpdated = this._onCharacterUpdated.event;
        /** Event fired when location file changes */
        this.onLocationUpdated = this._onLocationUpdated.event;
        /** Event fired when calendar file changes */
        this.onCalendarUpdated = this._onCalendarUpdated.event;
        /** Event fired when session file changes */
        this.onSessionUpdated = this._onSessionUpdated.event;
        /** Event fired when any watched file changes */
        this.onFileUpdated = this._onFileUpdated.event;
    }
    /**
     * Watch a file for changes
     * @param filePath Absolute file path to watch
     * @param fileType File type: 'character', 'location', 'calendar', 'session', 'other'
     * @returns Result object indicating success/failure
     */
    watch(filePath, fileType = 'other') {
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
            const entry = {
                watcher,
                debounceTimer: null,
                lastChangeTime: 0
            };
            // Handle file changes with debouncing
            const handleChange = (uri, changeType) => {
                const now = Date.now();
                // Cancel existing debounce timer
                if (entry.debounceTimer) {
                    clearTimeout(entry.debounceTimer);
                }
                // Set new debounce timer
                entry.debounceTimer = setTimeout(() => {
                    entry.lastChangeTime = now;
                    entry.debounceTimer = null;
                    const event = {
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
        }
        catch (error) {
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
    unwatch(filePath) {
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
        }
        catch (error) {
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
    isWatching(filePath) {
        return this.watchers.has(filePath);
    }
    /**
     * Get list of all watched file paths
     * @returns Array of watched file paths
     */
    getWatchedFiles() {
        return Array.from(this.watchers.keys());
    }
    /**
     * Get count of currently watched files
     * @returns Number of watched files
     */
    getWatchedCount() {
        return this.watchers.size;
    }
    /**
     * Get maximum number of files that can be watched
     * @returns Maximum watcher limit
     */
    getMaxWatchers() {
        return this.maxWatchers;
    }
    /**
     * Dispose all watchers and clean up resources
     */
    disposeAll() {
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
exports.FileWatcherManager = FileWatcherManager;
//# sourceMappingURL=file-watcher.js.map