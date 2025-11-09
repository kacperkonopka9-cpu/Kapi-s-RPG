/**
 * StateManager - Manages location state persistence across game sessions
 *
 * Reads and updates State.md files in location directories, tracking:
 * - Visited status (whether player has been to this location)
 * - Discovered items (items player has found/noticed)
 * - Completed events (events that have occurred)
 * - NPC states (NPC-specific state data)
 * - Custom state (arbitrary key-value state)
 *
 * State is stored as YAML frontmatter in State.md files:
 * ---
 * visited: false
 * discovered_items: []
 * completed_events: []
 * npc_states: {}
 * custom_state: {}
 * last_updated: null
 * ---
 * [Narrative content continues below...]
 *
 * Key Features:
 * - YAML frontmatter for structured state data
 * - Preserves existing narrative content in State.md
 * - Graceful error handling (no exceptions thrown)
 * - Dependency injection for testability
 * - Atomic file writes (read → modify → write)
 * - Automatic timestamp updates
 * - Duplicate prevention in arrays
 *
 * @module StateManager
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

/**
 * Default state structure for new or missing state files
 */
const DEFAULT_STATE = {
  visited: false,
  discovered_items: [],
  completed_events: [],
  npc_states: {},
  custom_state: {},
  last_updated: null
};

/**
 * StateManager class handles location state persistence
 */
class StateManager {
  /**
   * Creates a new StateManager instance
   *
   * @param {Object} deps - Dependencies for injection (testing)
   * @param {Object} deps.fs - File system module (defaults to fs.promises)
   * @param {Object} deps.path - Path module (defaults to path)
   * @param {Object} deps.yaml - YAML module (defaults to js-yaml)
   * @param {string} deps.locationsDir - Base directory for locations (defaults to 'game-data/locations')
   */
  constructor(deps = {}) {
    this.fs = deps.fs || fs;
    this.path = deps.path || path;
    this.yaml = deps.yaml || yaml;
    this.locationsDir = deps.locationsDir || 'game-data/locations';
  }

  /**
   * Validates that locationId doesn't contain path traversal attempts
   *
   * @param {string} locationId - Location identifier to validate
   * @returns {boolean} True if valid, false if contains suspicious patterns
   * @private
   */
  _isValidLocationId(locationId) {
    if (!locationId || typeof locationId !== 'string') {
      return false;
    }

    // Check for path traversal attempts
    if (locationId.includes('../') || locationId.includes('..\\')) {
      return false;
    }

    // Check for absolute paths
    if (this.path.isAbsolute(locationId)) {
      return false;
    }

    return true;
  }

  /**
   * Gets the full path to a location's State.md file
   *
   * @param {string} locationId - Location identifier
   * @returns {string} Full path to State.md file
   * @private
   */
  _getStatePath(locationId) {
    return this.path.join(this.locationsDir, locationId, 'State.md');
  }

  /**
   * Parses YAML frontmatter from State.md content
   *
   * @param {string} content - Raw file content
   * @returns {Object} Parsed state object and remaining content
   * @returns {Object} .state - Parsed state data
   * @returns {string} .narrativeContent - Content after frontmatter
   * @private
   */
  _parseStateFile(content) {
    // Check if content starts with YAML frontmatter delimiter
    if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) {
      // No frontmatter - return default state and preserve all content
      return {
        state: { ...DEFAULT_STATE },
        narrativeContent: content
      };
    }

    // Find the end of frontmatter
    const lines = content.split('\n');
    let endIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        endIndex = i;
        break;
      }
    }

    if (endIndex === -1) {
      // Malformed frontmatter - return default state
      return {
        state: { ...DEFAULT_STATE },
        narrativeContent: content
      };
    }

    // Extract YAML content (lines between first and second ---)
    const yamlContent = lines.slice(1, endIndex).join('\n');
    const narrativeContent = lines.slice(endIndex + 1).join('\n');

    try {
      // Parse YAML with safe load (no code execution)
      const parsed = this.yaml.load(yamlContent, { schema: this.yaml.SAFE_SCHEMA }) || {};

      // Merge with defaults to ensure all fields exist
      const state = {
        visited: parsed.visited !== undefined ? parsed.visited : DEFAULT_STATE.visited,
        discovered_items: Array.isArray(parsed.discovered_items) ? parsed.discovered_items : [],
        completed_events: Array.isArray(parsed.completed_events) ? parsed.completed_events : [],
        npc_states: typeof parsed.npc_states === 'object' ? parsed.npc_states : {},
        custom_state: typeof parsed.custom_state === 'object' ? parsed.custom_state : {},
        last_updated: parsed.last_updated || null
      };

      return { state, narrativeContent };
    } catch (error) {
      // YAML parsing failed - log error and return default state
      console.warn(`Failed to parse YAML frontmatter in State.md: ${error.message}`);
      return {
        state: { ...DEFAULT_STATE },
        narrativeContent: content
      };
    }
  }

  /**
   * Serializes state object to YAML frontmatter format
   *
   * @param {Object} state - State object to serialize
   * @param {string} narrativeContent - Narrative content to append
   * @returns {string} Complete file content with frontmatter and narrative
   * @private
   */
  _serializeStateFile(state, narrativeContent) {
    // Serialize state to YAML with safe dump (no code)
    const yamlContent = this.yaml.dump(state, {
      schema: this.yaml.SAFE_SCHEMA,
      sortKeys: true, // Consistent key order
      lineWidth: -1 // Don't wrap lines
    });

    // Construct complete file content
    return `---\n${yamlContent}---\n${narrativeContent}`;
  }

  /**
   * Loads state for a location from its State.md file
   *
   * @param {string} locationId - Location identifier
   * @returns {Promise<Object>} State object (or default if file missing/malformed)
   */
  async loadState(locationId) {
    // Validate location ID
    if (!this._isValidLocationId(locationId)) {
      console.warn(`Invalid location ID: ${locationId}`);
      return { ...DEFAULT_STATE };
    }

    const statePath = this._getStatePath(locationId);

    try {
      // Try to read the State.md file
      const content = await this.fs.readFile(statePath, 'utf-8');
      const { state } = this._parseStateFile(content);
      return state;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist - return default state
        // (Don't create file yet - only on updateState)
        return { ...DEFAULT_STATE };
      }

      // Other error (permissions, etc.) - log and return default
      console.warn(`Error reading State.md for ${locationId}: ${error.message}`);
      return { ...DEFAULT_STATE };
    }
  }

  /**
   * Updates state for a location and writes to State.md file
   *
   * @param {string} locationId - Location identifier
   * @param {Object} stateChanges - State changes to merge (partial state object)
   * @returns {Promise<Object>} Result object with success status
   * @returns {boolean} .success - True if update succeeded
   * @returns {string} [.error] - Error message if update failed
   */
  async updateState(locationId, stateChanges) {
    // Validate location ID
    if (!this._isValidLocationId(locationId)) {
      return {
        success: false,
        error: `Invalid location ID: ${locationId}`
      };
    }

    const statePath = this._getStatePath(locationId);

    try {
      // Check if location directory exists
      const locationDir = this.path.dirname(statePath);
      try {
        await this.fs.access(locationDir);
      } catch {
        return {
          success: false,
          error: `Location directory not found: ${locationId}`
        };
      }

      // Load existing state and narrative content
      let currentState = { ...DEFAULT_STATE };
      let narrativeContent = '';

      try {
        const content = await this.fs.readFile(statePath, 'utf-8');
        const parsed = this._parseStateFile(content);
        currentState = parsed.state;
        narrativeContent = parsed.narrativeContent;
      } catch (error) {
        if (error.code !== 'ENOENT') {
          // Error other than file not found
          console.warn(`Error reading existing State.md for ${locationId}: ${error.message}`);
        }
        // If file doesn't exist, we'll create it with default narrative
        narrativeContent = '# Location State\n\nThis location has been visited.\n';
      }

      // Merge state changes (deep merge for objects, replace for primitives/arrays)
      const updatedState = {
        ...currentState,
        ...stateChanges,
        // Merge nested objects if both exist
        npc_states: {
          ...currentState.npc_states,
          ...(stateChanges.npc_states || {})
        },
        custom_state: {
          ...currentState.custom_state,
          ...(stateChanges.custom_state || {})
        },
        // Always update timestamp
        last_updated: new Date().toISOString()
      };

      // Serialize and write file
      const fileContent = this._serializeStateFile(updatedState, narrativeContent);
      await this.fs.writeFile(statePath, fileContent, 'utf-8');

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update state for ${locationId}: ${error.message}`
      };
    }
  }

  /**
   * Marks a location as visited
   *
   * @param {string} locationId - Location identifier
   * @returns {Promise<Object>} Result object with success status
   */
  async markVisited(locationId) {
    return this.updateState(locationId, { visited: true });
  }

  /**
   * Adds an item to the discovered items list (no duplicates)
   *
   * @param {string} locationId - Location identifier
   * @param {string} itemId - Item identifier to add
   * @returns {Promise<Object>} Result object with success status
   */
  async addDiscoveredItem(locationId, itemId) {
    // Load current state
    const state = await this.loadState(locationId);

    // Check if item already discovered
    if (state.discovered_items.includes(itemId)) {
      // Already discovered - no change needed, but return success
      return { success: true };
    }

    // Add item to array
    const updatedItems = [...state.discovered_items, itemId];

    return this.updateState(locationId, { discovered_items: updatedItems });
  }

  /**
   * Marks an event as completed (no duplicates)
   *
   * @param {string} locationId - Location identifier
   * @param {string} eventId - Event identifier to mark complete
   * @returns {Promise<Object>} Result object with success status
   */
  async completeEvent(locationId, eventId) {
    // Load current state
    const state = await this.loadState(locationId);

    // Check if event already completed
    if (state.completed_events.includes(eventId)) {
      // Already completed - no change needed, but return success
      return { success: true };
    }

    // Add event to array
    const updatedEvents = [...state.completed_events, eventId];

    return this.updateState(locationId, { completed_events: updatedEvents });
  }

  /**
   * Updates NPC-specific state data
   *
   * @param {string} locationId - Location identifier
   * @param {string} npcId - NPC identifier
   * @param {Object} stateData - State data to set for this NPC
   * @returns {Promise<Object>} Result object with success status
   */
  async updateNPCState(locationId, npcId, stateData) {
    // Load current state
    const state = await this.loadState(locationId);

    // Update NPC state
    const updatedNPCStates = {
      ...state.npc_states,
      [npcId]: stateData
    };

    return this.updateState(locationId, { npc_states: updatedNPCStates });
  }

  /**
   * Sets a custom state value
   *
   * @param {string} locationId - Location identifier
   * @param {string} key - State key
   * @param {*} value - State value (any JSON-serializable value)
   * @returns {Promise<Object>} Result object with success status
   */
  async setCustomState(locationId, key, value) {
    // Load current state
    const state = await this.loadState(locationId);

    // Update custom state
    const updatedCustomState = {
      ...state.custom_state,
      [key]: value
    };

    return this.updateState(locationId, { custom_state: updatedCustomState });
  }
}

module.exports = StateManager;
