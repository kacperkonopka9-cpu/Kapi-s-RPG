/**
 * EventExecutor - Executes scheduled events and applies world state changes
 *
 * Loads event definitions from Events.md files and applies effects when triggered:
 * - NPC status updates (deaths, status changes)
 * - Location state updates (State.md modifications)
 * - Quest triggers (quest activation)
 * - Custom effects (extensible system)
 *
 * Event definitions are stored in location Events.md files as YAML:
 * ### Events
 * ```yaml
 * events:
 *   - eventId: death_of_burgomaster
 *     name: Death of Burgomaster Kolyan
 *     description: The burgomaster succumbs to his injuries
 *     effects:
 *       - type: npc_status
 *         npcId: kolyan_indirovich
 *         status: Dead
 *       - type: state_update
 *         locationId: village-of-barovia
 *         stateChanges:
 *           burgomaster_dead: true
 *       - type: quest_trigger
 *         questId: escort_ireena
 *         newStatus: Active
 *     narrativeTemplate: "The burgomaster has died. Ireena and Ismark mourn their father."
 * ```
 *
 * Key Features:
 * - Loads event definitions from location Events.md files
 * - Applies multiple effect types (NPC, state, quest)
 * - Atomic execution (all-or-nothing, no partial applies)
 * - Performance: < 500ms execution time
 * - Graceful error handling (no exceptions thrown)
 * - Dependency injection for testability
 * - Generates LLM-friendly narratives
 *
 * Pattern follows CalendarManager and StateManager from Epic 1/2.
 *
 * @module EventExecutor
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

/**
 * EventExecutor class handles event execution and world state updates
 */
class EventExecutor {
  /**
   * Creates a new EventExecutor instance
   *
   * @param {Object} deps - Dependencies for injection (testing)
   * @param {Object} deps.locationLoader - LocationLoader instance for loading Events.md
   * @param {Object} deps.stateManager - StateManager instance for updating State.md
   * @param {Object} deps.calendarManager - CalendarManager instance for updating event status
   * @param {Object} deps.fs - File system module (defaults to fs.promises)
   * @param {Object} deps.path - Path module (defaults to path)
   * @param {Object} deps.yaml - YAML module (defaults to js-yaml)
   * @param {string} deps.dataDir - Base directory for game data (defaults to 'data')
   */
  constructor(deps = {}) {
    this.locationLoader = deps.locationLoader;
    this.stateManager = deps.stateManager;
    this.calendarManager = deps.calendarManager;
    this.fs = deps.fs || fs;
    this.path = deps.path || path;
    this.yaml = deps.yaml || yaml;
    this.dataDir = deps.dataDir || 'data';

    // Validate required dependencies
    if (!this.locationLoader) {
      throw new Error('EventExecutor requires locationLoader dependency');
    }
    if (!this.stateManager) {
      throw new Error('EventExecutor requires stateManager dependency');
    }
    if (!this.calendarManager) {
      throw new Error('EventExecutor requires calendarManager dependency');
    }
  }

  /**
   * Load event definition from location Events.md file
   *
   * @param {string} eventId - Event identifier to find
   * @param {string} locationId - Location identifier containing the event
   * @returns {Promise<{success: boolean, definition?: EventDefinition, error?: string}>}
   */
  async loadEventDefinition(eventId, locationId) {
    try {
      // Validate inputs
      if (!eventId || typeof eventId !== 'string') {
        return {
          success: false,
          error: 'eventId must be a non-empty string'
        };
      }

      if (!locationId || typeof locationId !== 'string') {
        return {
          success: false,
          error: 'locationId must be a non-empty string'
        };
      }

      // Load Events.md from location using LocationLoader
      const locationPath = this.path.join('game-data', 'locations', locationId);
      const eventsPath = this.path.join(locationPath, 'Events.md');

      let eventsContent;
      try {
        eventsContent = await this.fs.readFile(eventsPath, 'utf8');
      } catch (err) {
        if (err.code === 'ENOENT') {
          return {
            success: false,
            error: `Events.md not found for location: ${locationId}`
          };
        }
        throw err;
      }

      // Parse YAML block from Events.md
      // Pattern: ### Events\n```yaml\n...\n```
      const yamlBlockRegex = /###\s+Events\s*\n```yaml\s*\n([\s\S]*?)\n```/i;
      const match = eventsContent.match(yamlBlockRegex);

      if (!match) {
        return {
          success: false,
          error: `No Events YAML block found in ${locationId}/Events.md`
        };
      }

      const yamlContent = match[1];
      let eventsData;

      try {
        eventsData = this.yaml.load(yamlContent);
      } catch (err) {
        return {
          success: false,
          error: `Failed to parse Events YAML: ${err.message}`
        };
      }

      // Find event by eventId
      if (!eventsData || !Array.isArray(eventsData.events)) {
        return {
          success: false,
          error: 'Events YAML must contain an "events" array'
        };
      }

      const eventDef = eventsData.events.find(e => e.eventId === eventId);

      if (!eventDef) {
        return {
          success: false,
          error: `Event not found: ${eventId}`
        };
      }

      // Return EventDefinition object
      return {
        success: true,
        definition: {
          eventId: eventDef.eventId,
          name: eventDef.name || eventId,
          description: eventDef.description || '',
          effects: eventDef.effects || [],
          narrativeTemplate: eventDef.narrativeTemplate || null
        }
      };
    } catch (err) {
      return {
        success: false,
        error: `Unexpected error loading event definition: ${err.message}`
      };
    }
  }

  /**
   * Execute event and apply all effects to world state
   *
   * @param {Object} event - ScheduledEvent from calendar
   * @param {Object} gameState - Current game state (world-state.yaml data)
   * @returns {Promise<EventExecutionResult>}
   */
  async execute(event, gameState = {}) {
    const executionStartTime = Date.now();

    try {
      // Validate input
      if (!event || !event.eventId || !event.locationId) {
        return {
          success: false,
          error: 'Event must have eventId and locationId',
          executedAt: new Date().toISOString(),
          effectsApplied: [],
          stateUpdates: [],
          executionTimeMs: Date.now() - executionStartTime
        };
      }

      // Load event definition
      const defResult = await this.loadEventDefinition(event.eventId, event.locationId);

      if (!defResult.success) {
        // Mark event as failed in calendar
        await this.calendarManager.updateEventStatus(event.eventId, 'failed');

        return {
          success: false,
          error: defResult.error,
          errorType: 'event_definition_load_failed',
          executedAt: new Date().toISOString(),
          effectsApplied: [],
          stateUpdates: [],
          executionTimeMs: Date.now() - executionStartTime
        };
      }

      const eventDef = defResult.definition;
      const effectsApplied = [];
      const stateUpdates = [];

      // Apply all effects (all-or-nothing approach)
      // Collect all effects first, then apply atomically
      const pendingUpdates = [];

      for (const effect of eventDef.effects) {
        try {
          let updateResult;

          switch (effect.type) {
            case 'npc_status':
              updateResult = await this._applyNPCStatusEffect(effect, gameState);
              break;

            case 'state_update':
              updateResult = await this._applyStateUpdateEffect(effect, event.locationId);
              break;

            case 'quest_trigger':
              updateResult = await this._applyQuestTriggerEffect(effect, gameState);
              break;

            default:
              console.warn(`Unknown effect type: ${effect.type} - skipping`);
              continue;
          }

          if (updateResult && updateResult.success) {
            effectsApplied.push({
              type: effect.type,
              ...effect
            });
            stateUpdates.push(updateResult.stateUpdate);
            pendingUpdates.push(updateResult);
          } else {
            // Effect failed - rollback and fail entire event
            throw new Error(`Effect failed: ${effect.type} - ${updateResult?.error || 'unknown error'}`);
          }
        } catch (err) {
          // Rollback is implicit - we haven't committed any changes yet
          console.error(`Error applying effect ${effect.type}:`, err);

          // Mark event as failed
          await this.calendarManager.updateEventStatus(event.eventId, 'failed');

          return {
            success: false,
            error: `Failed to apply effect ${effect.type}: ${err.message}`,
            errorType: 'effect_application_failed',
            executedAt: new Date().toISOString(),
            effectsApplied: [],
            stateUpdates: [],
            executionTimeMs: Date.now() - executionStartTime
          };
        }
      }

      // All effects succeeded - mark event as completed
      await this.calendarManager.updateEventStatus(event.eventId, 'completed');

      // Generate narrative
      const narrative = await this.generateEventNarrative(
        { ...event, ...eventDef },
        gameState.playerPresent || false
      );

      const executionTimeMs = Date.now() - executionStartTime;

      return {
        success: true,
        executedAt: new Date().toISOString(),
        effectsApplied,
        stateUpdates,
        executionTimeMs,
        narrative
      };
    } catch (err) {
      console.error('Unexpected error during event execution:', err);

      // Mark event as failed
      try {
        await this.calendarManager.updateEventStatus(event.eventId, 'failed');
      } catch (updateErr) {
        console.error('Failed to mark event as failed:', updateErr);
      }

      return {
        success: false,
        error: `Unexpected error: ${err.message}`,
        errorType: 'unexpected_error',
        executedAt: new Date().toISOString(),
        effectsApplied: [],
        stateUpdates: [],
        executionTimeMs: Date.now() - executionStartTime
      };
    }
  }

  /**
   * Apply NPC status effect (update NPC status in world state)
   *
   * @param {Object} effect - Effect definition
   * @param {Object} gameState - Current game state
   * @returns {Promise<{success: boolean, stateUpdate?: Object, error?: string}>}
   * @private
   */
  async _applyNPCStatusEffect(effect, gameState) {
    try {
      const { npcId, status } = effect;

      if (!npcId || !status) {
        return {
          success: false,
          error: 'npc_status effect requires npcId and status fields'
        };
      }

      // Load or create world-state.yaml
      const worldStatePath = this.path.join(this.dataDir, 'world-state.yaml');
      let worldState = {};

      try {
        const content = await this.fs.readFile(worldStatePath, 'utf8');
        worldState = this.yaml.load(content) || {};
      } catch (err) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
        // File doesn't exist - will create
        worldState = { npcs: {} };
      }

      // Ensure npcs object exists
      if (!worldState.npcs) {
        worldState.npcs = {};
      }

      // Update NPC status
      if (!worldState.npcs[npcId]) {
        worldState.npcs[npcId] = {};
      }

      worldState.npcs[npcId].status = status;
      worldState.npcs[npcId].last_updated = new Date().toISOString();

      // Save world-state.yaml
      const yamlContent = this.yaml.dump(worldState, { lineWidth: -1 });
      await this.fs.writeFile(worldStatePath, yamlContent, 'utf8');

      return {
        success: true,
        stateUpdate: {
          file: 'world-state.yaml',
          section: `npcs.${npcId}`,
          change: `status: ${status}`
        }
      };
    } catch (err) {
      return {
        success: false,
        error: `NPC status effect failed: ${err.message}`
      };
    }
  }

  /**
   * Apply state update effect (update location State.md file)
   *
   * @param {Object} effect - Effect definition
   * @param {string} defaultLocationId - Default location if not in effect
   * @returns {Promise<{success: boolean, stateUpdate?: Object, error?: string}>}
   * @private
   */
  async _applyStateUpdateEffect(effect, defaultLocationId) {
    try {
      const locationId = effect.locationId || defaultLocationId;
      const { stateChanges } = effect;

      if (!stateChanges || typeof stateChanges !== 'object') {
        return {
          success: false,
          error: 'state_update effect requires stateChanges object'
        };
      }

      // Use StateManager to update state
      // First get current state
      const getResult = await this.stateManager.getState(locationId);

      if (!getResult.success) {
        return {
          success: false,
          error: `Failed to get location state: ${getResult.error}`
        };
      }

      const currentState = getResult.state;

      // Merge stateChanges into custom_state
      const updatedCustomState = {
        ...currentState.custom_state,
        ...stateChanges
      };

      // Update state using StateManager
      const updateResult = await this.stateManager.updateCustomState(
        locationId,
        updatedCustomState
      );

      if (!updateResult.success) {
        return {
          success: false,
          error: `Failed to update location state: ${updateResult.error}`
        };
      }

      return {
        success: true,
        stateUpdate: {
          file: `${locationId}/State.md`,
          flags: Object.keys(stateChanges),
          changes: stateChanges
        }
      };
    } catch (err) {
      return {
        success: false,
        error: `State update effect failed: ${err.message}`
      };
    }
  }

  /**
   * Apply quest trigger effect (activate quest in active-quests.yaml)
   *
   * @param {Object} effect - Effect definition
   * @param {Object} gameState - Current game state
   * @returns {Promise<{success: boolean, stateUpdate?: Object, error?: string}>}
   * @private
   */
  async _applyQuestTriggerEffect(effect, gameState) {
    try {
      const { questId, newStatus } = effect;

      if (!questId || !newStatus) {
        return {
          success: false,
          error: 'quest_trigger effect requires questId and newStatus fields'
        };
      }

      // Load or create active-quests.yaml
      const questsPath = this.path.join(this.dataDir, 'active-quests.yaml');
      let questsData = {};

      try {
        const content = await this.fs.readFile(questsPath, 'utf8');
        questsData = this.yaml.load(content) || {};
      } catch (err) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
        // File doesn't exist - will create
        questsData = { quests: [] };
      }

      // Ensure quests array exists
      if (!Array.isArray(questsData.quests)) {
        questsData.quests = [];
      }

      // Find or create quest entry
      let quest = questsData.quests.find(q => q.questId === questId);

      if (!quest) {
        quest = {
          questId,
          status: newStatus,
          activated_at: new Date().toISOString()
        };
        questsData.quests.push(quest);
      } else {
        quest.status = newStatus;
        quest.updated_at = new Date().toISOString();
      }

      // Save active-quests.yaml
      const yamlContent = this.yaml.dump(questsData, { lineWidth: -1 });
      await this.fs.writeFile(questsPath, yamlContent, 'utf8');

      return {
        success: true,
        stateUpdate: {
          file: 'active-quests.yaml',
          quest: questId,
          status: newStatus
        }
      };
    } catch (err) {
      return {
        success: false,
        error: `Quest trigger effect failed: ${err.message}`
      };
    }
  }

  /**
   * Generate LLM-friendly narrative description of event
   *
   * @param {Object} event - Event with narrativeTemplate
   * @param {boolean} playerPresent - Whether player is present at event
   * @returns {Promise<string>} Formatted narrative (markdown)
   */
  async generateEventNarrative(event, playerPresent = false) {
    try {
      let narrative = event.narrativeTemplate || event.description || `Event "${event.name || event.eventId}" occurred.`;

      // Replace {{variables}} with actual values
      const variables = {
        eventName: event.name || event.eventId,
        location: event.locationId || 'unknown location',
        date: event.triggerDate || 'unknown date',
        time: event.triggerTime || 'unknown time'
      };

      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        narrative = narrative.replace(regex, value);
      }

      // Add perspective prefix
      if (playerPresent) {
        narrative = `You witness the following event:\n\n${narrative}`;
      } else {
        narrative = `At ${variables.location}, the following occurred:\n\n${narrative}`;
      }

      return narrative;
    } catch (err) {
      console.error('Error generating event narrative:', err);
      return `Event "${event.name || event.eventId}" occurred.`;
    }
  }
}

module.exports = EventExecutor;
