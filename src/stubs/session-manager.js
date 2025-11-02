/**
 * SessionManager Stub
 * Temporary implementation until Story 1.5 (LLM Narrator Integration)
 * Provides minimal session state management for command testing
 */

const { randomUUID } = require('crypto');

/**
 * @typedef {Object} SessionState
 * @property {string} sessionId - Unique session identifier
 * @property {string} currentLocationId - Current location ID
 * @property {string} startTime - ISO timestamp when session started
 * @property {string|null} endTime - ISO timestamp when session ended (null if active)
 * @property {number} actionCount - Number of actions taken in this session
 * @property {string[]} visitedLocations - List of location IDs visited
 */

/**
 * SessionManager stub class
 * TODO: Replace with real implementation in Story 1.5
 */
class SessionManager {
  constructor() {
    this.currentSession = null;
  }

  /**
   * Start a new game session
   * @param {string} initialLocationId - Starting location
   * @returns {SessionState} New session state
   */
  startSession(initialLocationId) {
    if (this.currentSession) {
      throw new Error('Session already active. End current session before starting new one.');
    }

    this.currentSession = {
      sessionId: randomUUID(),
      currentLocationId: initialLocationId,
      startTime: new Date().toISOString(),
      endTime: null,
      actionCount: 0,
      visitedLocations: [initialLocationId]
    };

    return this.currentSession;
  }

  /**
   * Get current active session
   * @returns {SessionState|null} Current session or null if none active
   */
  getCurrentSession() {
    return this.currentSession;
  }

  /**
   * Update current location
   * @param {string} locationId - New location ID
   */
  updateCurrentLocation(locationId) {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.currentSession.currentLocationId = locationId;

    if (!this.currentSession.visitedLocations.includes(locationId)) {
      this.currentSession.visitedLocations.push(locationId);
    }
  }

  /**
   * Record an action in the current session
   * @param {Object} action - Action details
   */
  recordAction(action) {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.currentSession.actionCount++;
  }

  /**
   * End the current session
   * @returns {SessionState} Final session state
   */
  endSession() {
    if (!this.currentSession) {
      throw new Error('No active session to end');
    }

    this.currentSession.endTime = new Date().toISOString();
    const finalState = { ...this.currentSession };
    this.currentSession = null;

    return finalState;
  }
}

module.exports = { SessionManager };
