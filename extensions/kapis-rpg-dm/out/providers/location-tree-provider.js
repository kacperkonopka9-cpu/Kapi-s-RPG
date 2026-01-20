"use strict";
/**
 * LocationTreeProvider - VS Code tree view provider for game locations
 *
 * Displays all game locations from game-data/locations/ in a hierarchical tree view
 * with navigation, icons, and session integration.
 *
 * @module location-tree-provider
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
exports.LocationTreeProvider = exports.LocationTreeItem = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
const fs = __importStar(require("fs/promises"));
/**
 * Location tree item data
 */
class LocationTreeItem extends vscode.TreeItem {
    constructor(locationId, locationName, locationType, connections, parentLocation, children, isCurrent, collapsibleState) {
        super(locationName, collapsibleState);
        this.locationId = locationId;
        this.locationName = locationName;
        this.locationType = locationType;
        this.connections = connections;
        this.parentLocation = parentLocation;
        this.children = children;
        this.isCurrent = isCurrent;
        this.collapsibleState = collapsibleState;
        this.id = locationId;
        this.tooltip = this.buildTooltip();
        this.description = this.buildDescription();
        this.iconPath = this.getIcon(locationType, isCurrent);
        this.contextValue = this.buildContextValue();
        // Set command to open Description.md when clicked
        this.command = {
            command: 'kapis-rpg.openLocationDescription',
            title: 'Open Location Description',
            arguments: [locationId]
        };
    }
    /**
     * Build tooltip text
     */
    buildTooltip() {
        const parts = [
            `Location: ${this.locationName}`,
            `Type: ${this.locationType || 'unknown'}`,
            `Connections: ${this.connections.length}`
        ];
        if (this.isCurrent) {
            parts.push('(Current Location)');
        }
        return parts.join('\n');
    }
    /**
     * Build description text (shown after label)
     */
    buildDescription() {
        if (this.isCurrent) {
            return '📍 Current';
        }
        if (this.connections.length > 0) {
            return `${this.connections.length} connections`;
        }
        return '';
    }
    /**
     * Get icon based on location type and current status
     */
    getIcon(locationType, isCurrent) {
        if (isCurrent) {
            return new vscode.ThemeIcon('location', new vscode.ThemeColor('charts.yellow'));
        }
        // Icon differentiation by location type
        switch (locationType) {
            case 'village':
            case 'town':
                return new vscode.ThemeIcon('home');
            case 'dungeon':
            case 'ruins':
                return new vscode.ThemeIcon('symbol-misc'); // Skull-like
            case 'castle':
            case 'fortress':
                return new vscode.ThemeIcon('symbol-structure');
            case 'wilderness':
            case 'forest':
            case 'mountain':
                return new vscode.ThemeIcon('tree');
            case 'building':
            case 'shop':
            case 'inn':
                return new vscode.ThemeIcon('symbol-event');
            default:
                return new vscode.ThemeIcon('circle-outline');
        }
    }
    /**
     * Build context value for context menu
     */
    buildContextValue() {
        const values = ['location'];
        if (this.isCurrent) {
            values.push('current');
        }
        if (this.connections.length > 0) {
            values.push('hasConnections');
        }
        return values.join('_');
    }
}
exports.LocationTreeItem = LocationTreeItem;
/**
 * LocationTreeProvider - Provides tree view of game locations
 */
class LocationTreeProvider {
    constructor(workspaceRoot) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.locations = new Map();
        this.rootLocations = [];
        this.workspaceRoot = workspaceRoot;
        this.locationsPath = path.join(workspaceRoot, 'game-data', 'locations');
    }
    /**
     * Get tree item for display in tree view
     */
    getTreeItem(element) {
        return element;
    }
    /**
     * Get children of a tree element (or root if element is undefined)
     */
    async getChildren(element) {
        if (!element) {
            // Return root locations
            if (this.rootLocations.length === 0) {
                await this.loadLocations();
            }
            return this.rootLocations;
        }
        // Return children of this element
        return element.children;
    }
    /**
     * Get parent of a tree element
     */
    getParent(element) {
        if (!element.parentLocation) {
            return undefined;
        }
        return this.locations.get(element.parentLocation);
    }
    /**
     * Refresh the tree view
     */
    async refresh() {
        this.locations.clear();
        this.rootLocations = [];
        await this.loadLocations();
        this._onDidChangeTreeData.fire();
    }
    /**
     * Update current location and refresh tree
     */
    async setCurrentLocation(locationId) {
        this.currentLocationId = locationId;
        await this.refresh();
    }
    /**
     * Load all locations from game-data/locations/
     */
    async loadLocations() {
        try {
            // Check if locations directory exists
            try {
                await fs.access(this.locationsPath);
            }
            catch {
                console.error(`Locations directory not found: ${this.locationsPath}`);
                return;
            }
            // Scan for location directories
            const locationDirs = await this.scanLocationDirectories(this.locationsPath);
            // Load metadata for each location
            const metadataPromises = locationDirs.map(async (dir) => {
                const locationId = path.basename(dir);
                const metadataPath = path.join(dir, 'metadata.yaml');
                try {
                    const content = await fs.readFile(metadataPath, 'utf-8');
                    const metadata = yaml.load(content);
                    return { locationId, metadata, dir };
                }
                catch (error) {
                    console.error(`Failed to load metadata for ${locationId}:`, error);
                    return null;
                }
            });
            const metadataResults = await Promise.all(metadataPromises);
            const validResults = metadataResults.filter((r) => r !== null);
            // Build tree structure
            this.buildTree(validResults);
        }
        catch (error) {
            console.error('Failed to load locations:', error);
            vscode.window.showErrorMessage(`Failed to load locations: ${error}`);
        }
    }
    /**
     * Scan for location directories recursively
     */
    async scanLocationDirectories(dir) {
        const results = [];
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    // Check if this is a location directory (has metadata.yaml)
                    const metadataPath = path.join(fullPath, 'metadata.yaml');
                    try {
                        await fs.access(metadataPath);
                        results.push(fullPath);
                    }
                    catch {
                        // Not a location directory, scan recursively
                        const subdirs = await this.scanLocationDirectories(fullPath);
                        results.push(...subdirs);
                    }
                }
            }
        }
        catch (error) {
            console.error(`Failed to scan directory ${dir}:`, error);
        }
        return results;
    }
    /**
     * Build tree structure from location metadata
     */
    buildTree(locations) {
        // Create tree items for all locations
        const items = locations.map(({ locationId, metadata }) => {
            const isCurrent = locationId === this.currentLocationId;
            const isAdjacent = this.isAdjacentToCurrentLocation(locationId, metadata.connections || []);
            // Determine collapsible state
            let collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            if (isCurrent || isAdjacent) {
                collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
            }
            const item = new LocationTreeItem(locationId, metadata.location_name, metadata.location_type || 'unknown', metadata.connections || [], metadata.parent_location, [], // children will be populated below
            isCurrent, collapsibleState);
            this.locations.set(locationId, item);
            return item;
        });
        // Build parent-child relationships
        for (const item of items) {
            if (item.parentLocation) {
                const parent = this.locations.get(item.parentLocation);
                if (parent) {
                    parent.children.push(item);
                }
                else {
                    // Parent not found, add to root
                    this.rootLocations.push(item);
                }
            }
            else {
                // No parent, add to root
                this.rootLocations.push(item);
            }
        }
        // Sort root locations alphabetically
        this.rootLocations.sort((a, b) => a.locationName.localeCompare(b.locationName));
        // Sort children of each location
        for (const item of items) {
            item.children.sort((a, b) => a.locationName.localeCompare(b.locationName));
        }
    }
    /**
     * Check if location is adjacent to current location
     */
    isAdjacentToCurrentLocation(locationId, connections) {
        if (!this.currentLocationId) {
            return false;
        }
        // Check if current location connects to this location
        const currentLocation = this.locations.get(this.currentLocationId);
        if (currentLocation && currentLocation.connections.includes(locationId)) {
            return true;
        }
        // Check if this location connects to current location
        if (connections.includes(this.currentLocationId)) {
            return true;
        }
        return false;
    }
    /**
     * Load current location from session state
     */
    async loadCurrentLocationFromSession() {
        const sessionPath = path.join(this.workspaceRoot, 'game-data', 'session', 'current-session.yaml');
        try {
            const content = await fs.readFile(sessionPath, 'utf-8');
            const session = yaml.load(content);
            if (session && session.location && session.location.currentLocationId) {
                this.currentLocationId = session.location.currentLocationId;
            }
        }
        catch {
            // No session file or error reading it, that's okay
            this.currentLocationId = undefined;
        }
    }
}
exports.LocationTreeProvider = LocationTreeProvider;
//# sourceMappingURL=location-tree-provider.js.map