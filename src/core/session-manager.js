/**
 * SessionManager - Real Implementation
 * Manages game session state including location, actions, and history
 *
 * Story 1.5: LLM Narrator Integration - Task 7
 * Replaces stub from src/stubs/session-manager.js
 * Maintains interface compatibility with command handlers from Story 1.4
 *
 * Story 1.10: Location State Persistence - Task 3
 * Integrated with StateManager to persist location visits across sessions
 */

const { randomUUID } = require('crypto');
const StateManager = require('./state-manager');

/**
 * @typedef {import('../data/schemas').SessionState} SessionState
 * @typedef {import('../data/schemas').PlayerAction} PlayerAction
 */

/**
 * SessionManager - Real implementation for game session management
 *
 * Requirements:
 * - AC-12: Preserve session state through LLM failures
 * - Maintain interface from stub for command handler compatibility
 * - Store comprehensive action history for context building
 * - Support session persistence (future: Epic 5)
 * - Persist location state across sessions (Story 1.10)
 */
class SessionManager {
  /**
   * Creates a new SessionManager instance
   * @param {Object} [deps] - Dependencies for injection (testing)
   * @param {StateManager} [deps.stateManager] - StateManager instance
   */
  constructor(deps = {}) {
    this.currentSession = null;
    this.actionHistory = []; // Store recent actions for context
    this.maxActionHistory = 10; // Keep last 10 actions for context
    this.stateManager = deps.stateManager || new StateManager();
  }

  /**
   * Start a new game session
   * @param {string} initialLocationId - Starting location
   * @returns {SessionState} New session state
   * @throws {Error} If session already active
   */
  startSession(initialLocationId) {
    if (this.currentSession) {
      throw new Error('Session already active. End current session before starting new one.');
    }

    const now = new Date().toISOString();

    this.currentSession = {
      sessionId: randomUUID(),
      currentLocationId: initialLocationId,
      startTime: now,
      endTime: null,
      actionCount: 0,
      visitedLocations: [initialLocationId]
    };

    // Reset action history for new session
    this.actionHistory = [];

    console.log(`✅ Session started: ${this.currentSession.sessionId}`);
    console.log(`📍 Initial location: ${initialLocationId}`);

    return { ...this.currentSession };
  }

  /**
   * Get current active session
   * @returns {SessionState|null} Current session or null if none active
   */
  getCurrentSession() {
    if (!this.currentSession) {
      return null;
    }

    // Return copy to prevent external modification
    return { ...this.currentSession };
  }

  /**
   * Update current location
   * @param {string} locationId - New location ID
   * @throws {Error} If no active session
   */
  async updateCurrentLocation(locationId) {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const previousLocation = this.currentSession.currentLocationId;
    this.currentSession.currentLocationId = locationId;

    // Add to visited locations if first visit
    if (!this.currentSession.visitedLocations.includes(locationId)) {
      this.currentSession.visitedLocations.push(locationId);
    }

    // Persist state: Mark location as visited (Story 1.10)
    try {
      const result = await this.stateManager.markVisited(locationId);
      if (!result.success) {
        console.warn(`Warning: Failed to persist visited state for ${locationId}: ${result.error}`);
      }
    } catch (error) {
      // Don't fail session on state persistence error (graceful degradation)
      console.warn(`Warning: State persistence error for ${locationId}: ${error.message}`);
    }

    console.log(`📍 Location changed: ${previousLocation} → ${locationId}`);
  }

  /**
   * Record an action in the current session
   * Stores action details for context building and history tracking
   *
   * @param {Object} action - Action details
   * @param {string} action.description - What the player did
   * @param {string} [action.result] - Outcome of the action
   * @param {string} [action.narration] - LLM-generated narration
   * @throws {Error} If no active session
   */
  recordAction(action) {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.currentSession.actionCount++;

    // Create PlayerAction object with metadata
    const playerAction = {
      actionId: randomUUID(),
      timestamp: new Date().toISOString(),
      locationId: this.currentSession.currentLocationId,
      description: action.description || 'Unknown action',
      result: action.result || null,
      narration: action.narration || null
    };

    // Add to action history
    this.actionHistory.push(playerAction);

    // Trim history to max length (keep most recent actions)
    if (this.actionHistory.length > this.maxActionHistory) {
      this.actionHistory = this.actionHistory.slice(-this.maxActionHistory);
    }

    console.log(`📝 Action recorded (#${this.currentSession.actionCount}): ${playerAction.description}`);
  }

  /**
   * Get recent actions for context building
   * @param {number} [count=5] - Number of recent actions to retrieve
   * @returns {PlayerAction[]} Array of recent actions
   */
  getRecentActions(count = 5) {
    if (this.actionHistory.length === 0) {
      return [];
    }

    // Return last N actions
    const startIndex = Math.max(0, this.actionHistory.length - count);
    return this.actionHistory.slice(startIndex);
  }

  /**
   * End the current session
   * @returns {SessionState} Final session state
   * @throws {Error} If no active session to end
   */
  endSession() {
    if (!this.currentSession) {
      throw new Error('No active session to end');
    }

    this.currentSession.endTime = new Date().toISOString();

    const finalState = { ...this.currentSession };

    // Calculate session duration
    const durationMs = new Date(finalState.endTime) - new Date(finalState.startTime);
    const durationMinutes = Math.round(durationMs / 60000);

    console.log(`✅ Session ended: ${finalState.sessionId}`);
    console.log(`⏱️  Duration: ${durationMinutes} minutes`);
    console.log(`📊 Actions taken: ${finalState.actionCount}`);
    console.log(`🗺️  Locations visited: ${finalState.visitedLocations.length}`);

    // Clear current session
    this.currentSession = null;
    this.actionHistory = [];

    return finalState;
  }

  /**
   * Get session statistics
   * @returns {Object|null} Session stats or null if no active session
   */
  getSessionStats() {
    if (!this.currentSession) {
      return null;
    }

    const now = new Date();
    const startTime = new Date(this.currentSession.startTime);
    const durationMs = now - startTime;
    const durationMinutes = Math.round(durationMs / 60000);

    return {
      sessionId: this.currentSession.sessionId,
      durationMinutes,
      actionCount: this.currentSession.actionCount,
      locationsVisited: this.currentSession.visitedLocations.length,
      currentLocation: this.currentSession.currentLocationId,
      actionHistory: this.actionHistory.length
    };
  }

  /**
   * Check if a session is currently active
   * @returns {boolean} True if session is active
   */
  hasActiveSession() {
    return this.currentSession !== null;
  }
}

module.exports = { SessionManager };
