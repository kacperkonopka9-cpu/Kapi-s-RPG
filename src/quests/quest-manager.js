/**
 * QuestManager - Quest tracking and state management
 *
 * Manages quest lifecycle: loading, state tracking, prerequisites,
 * and integration with Epic 1-3 systems.
 *
 * @module quests/quest-manager
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

class QuestManager {
  /**
   * Initialize QuestManager with dependency injection
   * @param {Object} deps - Dependencies
   * @param {Object} deps.fs - File system module (default: fs.promises)
   * @param {Object} deps.path - Path module (default: path)
   * @param {Object} deps.yaml - YAML parser (default: js-yaml)
   * @param {string} deps.questsDir - Quests directory path
   * @param {Object} deps.stateManager - StateManager instance
   * @param {Object} deps.eventScheduler - EventScheduler instance
   */
  constructor(deps = {}) {
    this.fs = deps.fs || fs;
    this.path = deps.path || path;
    this.yaml = deps.yaml || yaml;
    this.questsDir = deps.questsDir || path.join(process.cwd(), 'game-data', 'quests');
    this.stateManager = deps.stateManager || null;
    this.eventScheduler = deps.eventScheduler || null;

    // In-memory quest cache for performance
    this.questCache = new Map();
  }

  /**
   * Load a quest by ID
   * @param {string} questId - Quest identifier
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async loadQuest(questId) {
    // Check cache first
    if (this.questCache.has(questId)) {
      return { success: true, data: this.questCache.get(questId) };
    }

    // Validate quest ID
    if (!this._isValidQuestId(questId)) {
      return { success: false, error: 'Invalid quest ID format' };
    }

    // Construct file path (kebab-case filename)
    const questFileName = questId.replace(/_/g, '-') + '.yaml';
    const questPath = this.path.join(this.questsDir, questFileName);

    try {
      const questData = await this.fs.readFile(questPath, 'utf-8');
      const quest = this.yaml.load(questData);

      // Validate schema
      const validation = this._validateQuestSchema(quest);
      if (!validation.success) {
        return { success: false, error: `Schema validation failed: ${validation.error}` };
      }

      // Cache the quest
      this.questCache.set(questId, quest);

      return { success: true, data: quest };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: false, error: `Quest file not found: ${questId}` };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all quests
   * @returns {Promise<{success: boolean, data?: Object[], error?: string}>}
   */
  async getAllQuests() {
    try {
      const files = await this.fs.readdir(this.questsDir);
      const questFiles = files.filter(f => f.endsWith('.yaml'));

      const quests = [];
      for (const file of questFiles) {
        const questId = file.replace(/-/g, '_').replace('.yaml', '');
        const result = await this.loadQuest(questId);
        if (result.success) {
          quests.push(result.data);
        }
      }

      return { success: true, data: quests };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get quests by type
   * @param {string} type - Quest type (main, side, personal, faction)
   * @returns {Promise<{success: boolean, data?: Object[], error?: string}>}
   */
  async getQuestsByType(type) {
    const allQuestsResult = await this.getAllQuests();
    if (!allQuestsResult.success) {
      return allQuestsResult;
    }

    const filtered = allQuestsResult.data.filter(q => q.type === type);
    return { success: true, data: filtered };
  }

  /**
   * Get active quests
   * @returns {Promise<{success: boolean, data?: Object[], error?: string}>}
   */
  async getActiveQuests() {
    if (!this.stateManager) {
      return { success: false, error: 'StateManager not initialized' };
    }

    const stateResult = await this._loadQuestState();
    if (!stateResult.success) {
      return stateResult;
    }

    const activeQuestIds = stateResult.data.activeQuests || [];
    const quests = [];

    for (const questId of activeQuestIds) {
      const result = await this.loadQuest(questId);
      if (result.success) {
        quests.push(result.data);
      }
    }

    return { success: true, data: quests };
  }

  /**
   * Get available quests (prerequisites met but not accepted)
   * @returns {Promise<{success: boolean, data?: Object[], error?: string}>}
   */
  async getAvailableQuests() {
    if (!this.stateManager) {
      return { success: false, error: 'StateManager not initialized' };
    }

    const allQuestsResult = await this.getAllQuests();
    if (!allQuestsResult.success) {
      return allQuestsResult;
    }

    const stateResult = await this._loadQuestState();
    if (!stateResult.success) {
      return stateResult;
    }

    const questState = stateResult.data;
    const available = [];

    for (const quest of allQuestsResult.data) {
      const status = questState.quests?.[quest.questId]?.status || 'not_started';

      if (status === 'not_started') {
        const prereqResult = await this.checkPrerequisites(quest);
        if (prereqResult.success && prereqResult.data === true) {
          available.push(quest);
        }
      }
    }

    return { success: true, data: available };
  }

  /**
   * Check if quest prerequisites are met
   * @param {Object} quest - Quest data
   * @returns {Promise<{success: boolean, data?: boolean, error?: string}>}
   */
  async checkPrerequisites(quest) {
    if (!this.stateManager) {
      return { success: false, error: 'StateManager not initialized' };
    }

    const stateResult = await this._loadQuestState();
    if (!stateResult.success) {
      return stateResult;
    }

    const questState = stateResult.data;
    const prereqs = quest.prerequisites || {};

    // Check level (requires character data - simplified for now)
    if (prereqs.level !== null && prereqs.level !== undefined) {
      // TODO: Check character level when CharacterManager is available
    }

    // Check required quests
    if (prereqs.requiredQuests?.completed) {
      for (const reqQuestId of prereqs.requiredQuests.completed) {
        const reqStatus = questState.quests?.[reqQuestId]?.status;
        if (reqStatus !== 'completed') {
          return { success: true, data: false };
        }
      }
    }

    // Check required NPCs (alive/dead)
    if (prereqs.requiredNPCs?.alive) {
      // TODO: Check NPC status when NPC tracking is available
    }

    if (prereqs.requiredNPCs?.dead) {
      // TODO: Check NPC status when NPC tracking is available
    }

    // Check required items
    if (prereqs.requiredItems && prereqs.requiredItems.length > 0) {
      // TODO: Check inventory when InventoryManager is available
    }

    // Check required locations
    if (prereqs.requiredLocations?.visited) {
      // TODO: Check location visited status when available
    }

    return { success: true, data: true };
  }

  /**
   * Update quest status
   * @param {string} questId - Quest identifier
   * @param {string} newStatus - New status value
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateQuestStatus(questId, newStatus) {
    if (!this.stateManager) {
      return { success: false, error: 'StateManager not initialized' };
    }

    const validStatuses = ['not_started', 'available', 'active', 'completed', 'failed', 'abandoned'];
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: `Invalid status: ${newStatus}` };
    }

    const stateResult = await this._loadQuestState();
    if (!stateResult.success) {
      return stateResult;
    }

    const questState = stateResult.data;

    // Initialize quest entry if not exists
    if (!questState.quests[questId]) {
      questState.quests[questId] = {};
    }

    const oldStatus = questState.quests[questId].status;
    questState.quests[questId].status = newStatus;

    // Update activeQuests array
    questState.activeQuests = questState.activeQuests || [];
    questState.completedQuests = questState.completedQuests || [];

    if (newStatus === 'active' && !questState.activeQuests.includes(questId)) {
      questState.activeQuests.push(questId);
    } else if (oldStatus === 'active' && newStatus !== 'active') {
      questState.activeQuests = questState.activeQuests.filter(id => id !== questId);
    }

    if (newStatus === 'completed' && !questState.completedQuests.includes(questId)) {
      questState.completedQuests.push(questId);
    }

    return await this._saveQuestState(questState);
  }

  /**
   * Update objective status
   * @param {string} questId - Quest identifier
   * @param {string} objectiveId - Objective identifier
   * @param {string} newStatus - New status value
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateObjectiveStatus(questId, objectiveId, newStatus) {
    if (!this.stateManager) {
      return { success: false, error: 'StateManager not initialized' };
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'failed'];
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: `Invalid objective status: ${newStatus}` };
    }

    const stateResult = await this._loadQuestState();
    if (!stateResult.success) {
      return stateResult;
    }

    const questState = stateResult.data;

    // Initialize quest entry if not exists
    if (!questState.quests[questId]) {
      questState.quests[questId] = { objectives: {} };
    }

    if (!questState.quests[questId].objectives) {
      questState.quests[questId].objectives = {};
    }

    questState.quests[questId].objectives[objectiveId] = {
      status: newStatus,
      completedDate: newStatus === 'completed' ? this._getCurrentDate() : null
    };

    // Check if all objectives are complete
    const questResult = await this.loadQuest(questId);
    if (questResult.success) {
      const quest = questResult.data;
      const allComplete = quest.objectives.every(obj => {
        if (obj.optional) return true;
        const objStatus = questState.quests[questId].objectives?.[obj.objectiveId]?.status;
        return objStatus === 'completed';
      });

      if (allComplete && questState.quests[questId].status === 'active') {
        // All objectives complete - mark quest as complete
        await this.updateQuestStatus(questId, 'completed');

        // Apply completion consequences
        await this._applyQuestConsequences(quest, 'completion');
      }
    }

    return await this._saveQuestState(questState);
  }

  /**
   * Validate quest schema
   * @private
   */
  _validateQuestSchema(quest) {
    const required = ['questId', 'name', 'type', 'objectives', 'rewards'];

    for (const field of required) {
      if (!quest[field]) {
        return { success: false, error: `Missing required field: ${field}` };
      }
    }

    // Validate objectives have unique IDs
    const objectiveIds = new Set();
    for (const obj of quest.objectives) {
      if (objectiveIds.has(obj.objectiveId)) {
        return { success: false, error: `Duplicate objective ID: ${obj.objectiveId}` };
      }
      objectiveIds.add(obj.objectiveId);
    }

    return { success: true };
  }

  /**
   * Validate quest ID format
   * @private
   */
  _isValidQuestId(questId) {
    return /^[a-z0-9_]+$/.test(questId);
  }

  /**
   * Load quest state from StateManager
   * @private
   */
  async _loadQuestState() {
    // Quest state stored in game-data/state/quest-state.yaml
    const stateFile = this.path.join(process.cwd(), 'game-data', 'state', 'quest-state.yaml');

    try {
      const stateData = await this.fs.readFile(stateFile, 'utf-8');
      const state = this.yaml.load(stateData);
      return { success: true, data: state };
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Initialize default state
        const defaultState = {
          quests: {},
          activeQuests: [],
          completedQuests: [],
          playerChoices: {}
        };
        return { success: true, data: defaultState };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Save quest state via StateManager
   * @private
   */
  async _saveQuestState(questState) {
    const stateFile = this.path.join(process.cwd(), 'game-data', 'state', 'quest-state.yaml');

    try {
      const yamlData = this.yaml.dump(questState, { lineWidth: -1, sortKeys: true });
      await this.fs.writeFile(stateFile, yamlData, 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply quest consequences (completion, failure, abandonment)
   * @private
   */
  async _applyQuestConsequences(quest, consequenceType) {
    const consequences = quest.consequences?.[`on${consequenceType.charAt(0).toUpperCase() + consequenceType.slice(1)}`];

    if (!consequences) return { success: true };

    // Unlock new quests
    if (consequences.unlockedQuests) {
      const stateResult = await this._loadQuestState();
      if (stateResult.success) {
        const questState = stateResult.data;

        for (const unlockedQuestId of consequences.unlockedQuests) {
          if (!questState.quests[unlockedQuestId]) {
            questState.quests[unlockedQuestId] = {};
          }
          questState.quests[unlockedQuestId].status = 'available';
        }

        await this._saveQuestState(questState);
      }
    }

    // TODO: Apply state changes via StateManager
    // TODO: Trigger events via EventScheduler
    // TODO: Apply NPC reactions

    return { success: true };
  }

  /**
   * Get current date (from CalendarManager if available, or system date)
   * @private
   */
  _getCurrentDate() {
    // TODO: Integrate with CalendarManager for Barovian calendar
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * Clear quest cache
   */
  clearCache() {
    this.questCache.clear();
  }
}

module.exports = QuestManager;
