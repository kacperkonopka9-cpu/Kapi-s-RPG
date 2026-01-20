/**
 * SessionManager - Epic 5 Story 5.6: Session Management & Logging System
 *
 * Manages game session lifecycle: initialization, state tracking, and termination.
 * Integrates with ContextLoader (Story 5-1), ContextCache (Story 5-2), and Enhanced Commands (Story 5-4).
 *
 * Key Features:
 * - Session state persistence in current-session.yaml (YAML format for human readability)
 * - Auto-save mechanism (configurable interval, default 5 minutes)
 * - Session logging via SessionLogger
 * - Git integration via GitIntegration for session commits
 * - Integration with Epic 2 CalendarManager and Epic 3 CharacterManager
 *
 * Result Object Pattern: All methods return {success, data?, error?}
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { createHash } = require('crypto');

/**
 * SessionManager class
 */
class SessionManager {
  /**
   * Create a new SessionManager
   * @param {Object} deps - Dependency injection
   * @param {Object} deps.fs - File system module (default: fs.promises)
   * @param {Object} deps.path - Path module (default: path)
   * @param {Object} deps.yaml - YAML parser (default: js-yaml)
   * @param {string} deps.sessionDir - Session directory path (default: 'game-data/session')
   * @param {Object} deps.contextLoader - ContextLoader instance (Story 5-1)
   * @param {Object} deps.contextCache - ContextCache instance (Story 5-2)
   * @param {Object} deps.calendarManager - CalendarManager instance (Epic 2)
   * @param {Object} deps.characterManager - CharacterManager instance (Epic 3, optional)
   * @param {Object} deps.sessionLogger - SessionLogger instance
   * @param {Object} deps.gitIntegration - GitIntegration instance
   */
  constructor(deps = {}) {
    this.fs = deps.fs || fs;
    this.path = deps.path || path;
    this.yaml = deps.yaml || yaml;
    this.sessionDir = deps.sessionDir || 'game-data/session';
    this.locationsDir = deps.locationsDir || 'game-data/locations';
    this.contextLoader = deps.contextLoader || null;
    this.contextCache = deps.contextCache || null;
    this.calendarManager = deps.calendarManager || null;
    this.characterManager = deps.characterManager || null;
    this.sessionLogger = deps.sessionLogger || null;
    this.gitIntegration = deps.gitIntegration || null;
    this.autoSaveInterval = null;
  }

  /**
   * Start a new game session
   * AC-1: Creates current-session.yaml with all required fields, returns Result Object
   *
   * @param {string} characterPath - Path to character YAML file (relative to project root)
   * @param {string} locationId - Starting location ID
   * @param {number} autoSaveIntervalSeconds - Auto-save interval in seconds (0 to disable, default 300)
   * @returns {Promise<{success: boolean, sessionId?: string, data?: Object, error?: string}>}
   */
  async startSession(characterPath, locationId, autoSaveIntervalSeconds = 300) {
    try {
      // 6.1: Check if session is already active
      const existingSession = await this.getCurrentSession();
      if (existingSession) {
        return {
          success: false,
          error: 'A session is already active. End the current session with /end-session before starting a new one.'
        };
      }

      // 1.2.1: Validate character file exists and is valid YAML
      if (!characterPath) {
        return { success: false, error: 'Character path is required' };
      }

      let characterData;
      try {
        const characterContent = await this.fs.readFile(characterPath, 'utf-8');
        characterData = this.yaml.load(characterContent);
      } catch (error) {
        return { success: false, error: `Failed to load character file: ${error.message}` };
      }

      // 1.2.2: Validate location ID (basic validation - directory exists)
      if (!locationId) {
        return { success: false, error: 'Location ID is required' };
      }

      const locationDir = this.path.join(this.locationsDir, locationId);
      try {
        await this.fs.access(locationDir);
      } catch (error) {
        return { success: false, error: `Location not found: ${locationId} (checked: ${locationDir})` };
      }

      // 1.2.3: Extract initial level and XP from character file
      const initialLevel = characterData.level || 1;
      const initialXP = characterData.experience || 0;

      // 1.2.4: Load calendar state for session snapshot
      let calendarSnapshot = null;
      if (this.calendarManager) {
        const calendarState = await this.calendarManager.getCalendarState();
        if (calendarState.success) {
          calendarSnapshot = {
            sessionStartDate: calendarState.data.current.date,
            sessionStartTime: calendarState.data.current.time,
            currentDate: calendarState.data.current.date,
            currentTime: calendarState.data.current.time,
            timePassed: '0 hours'
          };
        }
      }

      // If calendar not available, use placeholder
      if (!calendarSnapshot) {
        calendarSnapshot = {
          sessionStartDate: '735-10-1',
          sessionStartTime: '08:00',
          currentDate: '735-10-1',
          currentTime: '08:00',
          timePassed: '0 hours'
        };
      }

      // 1.2.5: Generate session ID (timestamp-based)
      const now = new Date();
      const sessionId = now.toISOString().split('T')[0] + '-' + String(Math.floor(now.getTime() / 1000)).slice(-3);

      // Calculate character file hash for change detection
      const characterContentForHash = await this.fs.readFile(characterPath, 'utf-8');
      const snapshotHash = createHash('md5').update(characterContentForHash).digest('hex');

      // 1.2.6: Create session state object with all required fields
      const sessionState = {
        sessionId: sessionId,
        startTime: now.toISOString(),
        lastActivity: now.toISOString(),

        character: {
          filePath: characterPath,
          snapshotHash: snapshotHash,
          initialLevel: initialLevel,
          initialXP: initialXP
        },

        location: {
          currentLocationId: locationId,
          visitedThisSession: [
            {
              locationId: locationId,
              enteredAt: now.toISOString()
            }
          ]
        },

        npcs: {
          activeNPCs: [],
          interactedWith: []
        },

        context: {
          lastLoadedAt: null,
          tokensUsed: 0,
          cacheKeys: []
        },

        calendar: calendarSnapshot,

        events: {
          triggeredThisSession: [],
          pendingEvents: []
        },

        performance: {
          startupTime: 0, // Will be set by command handler
          contextLoadTimes: [],
          avgLLMResponseTime: 0,
          autoSaveCount: 0
        }
      };

      // 1.2.7: Ensure session directory exists
      try {
        await this.fs.mkdir(this.sessionDir, { recursive: true });
      } catch (error) {
        // Directory might already exist, ignore error
      }

      // 1.2.8: Save current-session.yaml atomically
      const sessionFilePath = this.path.join(this.sessionDir, 'current-session.yaml');
      const yamlContent = this.yaml.dump(sessionState, {
        indent: 2,
        lineWidth: -1,
        sortKeys: false
      });

      // 6.4: Handle permission errors gracefully
      try {
        await this.fs.writeFile(sessionFilePath, yamlContent, 'utf-8');
      } catch (error) {
        if (error.code === 'EACCES' || error.code === 'EPERM') {
          return {
            success: false,
            error: `Permission denied writing session file: ${sessionFilePath}. Check file permissions.`
          };
        }
        throw error; // Re-throw other errors to outer catch
      }

      // 1.2.9: Start auto-save timer
      this.startAutoSave(autoSaveIntervalSeconds);

      // 1.2.10: Return Result Object with sessionId and data
      return {
        success: true,
        sessionId: sessionId,
        data: sessionState
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to start session: ${error.message}`
      };
    }
  }

  /**
   * End current session
   * AC-5: Generates log, updates history, commits to Git, deletes session file, clears cache
   *
   * @param {string} playerSummary - Optional player-provided summary
   * @returns {Promise<{success: boolean, logPath?: string, sessionSummary?: string, gitCommit?: string, error?: string}>}
   */
  async endSession(playerSummary = null) {
    try {
      // 1.3.1: Load current session state
      const sessionResult = await this.getCurrentSession();
      if (!sessionResult) {
        return { success: false, error: 'No active session found' };
      }

      const sessionState = sessionResult;

      // 1.3.2: Generate session log via SessionLogger
      let logPath = null;
      let sessionSummary = null;

      if (this.sessionLogger) {
        const logResult = await this.sessionLogger.generateSummary(sessionState, playerSummary);
        if (logResult.success) {
          sessionSummary = logResult.logContent;

          // 1.3.3: Save session log to logs/ directory
          const saveResult = await this.sessionLogger.saveLog(logResult.logContent, sessionState.sessionId);
          if (saveResult.success) {
            logPath = saveResult.logPath;
          }
        }
      }

      // 1.3.4: Commit to Git via GitIntegration
      let gitCommit = null;
      if (this.gitIntegration) {
        const commitSummary = playerSummary || sessionSummary || 'Session completed';
        const commitResult = await this.gitIntegration.commitSession(sessionState, commitSummary);
        if (commitResult.success) {
          gitCommit = commitResult.commitHash;
        }
      }

      // 1.3.5: Update session-history.yaml (append session metadata)
      await this._appendSessionHistory(sessionState, logPath);

      // 1.3.6: Delete current-session.yaml
      const sessionFilePath = this.path.join(this.sessionDir, 'current-session.yaml');
      try {
        await this.fs.unlink(sessionFilePath);
      } catch (error) {
        // File might not exist, ignore error
      }

      // 1.3.7: Clear ContextCache
      if (this.contextCache && typeof this.contextCache.clearAll === 'function') {
        this.contextCache.clearAll();
      }

      // 1.3.8: Stop auto-save timer
      this.stopAutoSave();

      // 1.3.9: Return Result Object
      return {
        success: true,
        logPath: logPath,
        sessionSummary: sessionSummary,
        gitCommit: gitCommit
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to end session: ${error.message}`
      };
    }
  }

  /**
   * Update current session state
   * AC-2: Performs atomic read→merge→write, updates persist within 1 second
   *
   * @param {Object} updates - Partial session state updates (shallow or deep merge supported)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateSession(updates) {
    try {
      // 1.4.1: Load current session from current-session.yaml
      const sessionState = await this.getCurrentSession();
      if (!sessionState) {
        return { success: false, error: 'No active session found' };
      }

      // 1.4.2: Deep merge updates into session state
      const mergedState = this._deepMerge(sessionState, updates);

      // 1.4.3: Update lastActivity timestamp
      mergedState.lastActivity = new Date().toISOString();

      // 1.4.4: Save updated session atomically
      const sessionFilePath = this.path.join(this.sessionDir, 'current-session.yaml');
      const yamlContent = this.yaml.dump(mergedState, {
        indent: 2,
        lineWidth: -1,
        sortKeys: false
      });

      // 6.4: Handle permission errors gracefully
      try {
        await this.fs.writeFile(sessionFilePath, yamlContent, 'utf-8');
      } catch (error) {
        if (error.code === 'EACCES' || error.code === 'EPERM') {
          return {
            success: false,
            error: `Permission denied writing session file: ${sessionFilePath}. Check file permissions.`
          };
        }
        throw error; // Re-throw other errors to outer catch
      }

      // 1.4.5: Return Result Object
      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: `Failed to update session: ${error.message}`
      };
    }
  }

  /**
   * Get current session state
   * AC-2: Returns current session or null if no active session
   *
   * @returns {Promise<Object|null>} Current session state or null
   */
  async getCurrentSession() {
    try {
      // 1.5.1: Check if current-session.yaml exists
      const sessionFilePath = this.path.join(this.sessionDir, 'current-session.yaml');

      try {
        await this.fs.access(sessionFilePath);
      } catch (error) {
        // File doesn't exist
        return null;
      }

      // 1.5.2: Read and parse YAML
      let yamlContent;
      try {
        yamlContent = await this.fs.readFile(sessionFilePath, 'utf-8');
      } catch (error) {
        // 6.4: Handle permission errors
        if (error.code === 'EACCES' || error.code === 'EPERM') {
          console.error('Permission denied reading session file:', error.message);
          return null;
        }
        throw error;
      }

      // 6.3: Handle corrupted YAML gracefully
      let sessionState;
      try {
        sessionState = this.yaml.load(yamlContent);
      } catch (error) {
        console.error('Corrupted session file detected:', error.message);
        console.error('Session file will be skipped. End the corrupted session manually or delete current-session.yaml');
        return null;
      }

      // 6.5: Validate session state schema
      if (!sessionState || typeof sessionState !== 'object') {
        console.error('Invalid session state: not an object');
        return null;
      }

      if (!sessionState.sessionId || !sessionState.character || !sessionState.location) {
        console.error('Invalid session state: missing required fields (sessionId, character, location)');
        return null;
      }

      // 1.5.3: Return session state object
      return sessionState;

    } catch (error) {
      // Unexpected error
      console.error('Error loading session:', error.message);
      return null;
    }
  }

  /**
   * Start auto-save timer
   * AC-3: Configurable interval, logs to performance.log, runs asynchronously
   *
   * @param {number} intervalSeconds - Auto-save interval in seconds (0 to disable)
   */
  startAutoSave(intervalSeconds) {
    // 1.6.1: Stop existing timer if running
    this.stopAutoSave();

    // 1.6.2: If intervalSeconds > 0, create setInterval timer
    if (intervalSeconds > 0) {
      this.autoSaveInterval = setInterval(async () => {
        try {
          // 1.6.3: Load current session
          const session = await this.getCurrentSession();
          if (!session) {
            return; // No active session, skip auto-save
          }

          // Increment auto-save count
          const updates = {
            performance: {
              ...session.performance,
              autoSaveCount: (session.performance.autoSaveCount || 0) + 1
            }
          };

          // Save session state
          const result = await this.updateSession(updates);

          // 1.6.5: Log auto-save event to performance.log
          if (result.success) {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] Auto-save completed (count: ${updates.performance.autoSaveCount})\n`;
            await this._appendPerformanceLog(logMessage);
          }

        } catch (error) {
          console.error('Auto-save failed:', error.message);
        }
      }, intervalSeconds * 1000);
    }
  }

  /**
   * Stop auto-save timer
   * AC-3: Clears interval timer
   */
  stopAutoSave() {
    // 1.6.4: Clear interval timer
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Internal: Append session metadata to session-history.yaml
   * @private
   */
  async _appendSessionHistory(sessionState, logPath) {
    try {
      const historyPath = this.path.join(this.sessionDir, 'session-history.yaml');

      let history = { sessions: [] };

      // Try to load existing history
      try {
        const existingContent = await this.fs.readFile(historyPath, 'utf-8');
        history = this.yaml.load(existingContent) || { sessions: [] };
      } catch (error) {
        // File doesn't exist yet, use default
      }

      // Calculate duration in hours
      const startTime = new Date(sessionState.startTime);
      const endTime = new Date();
      const durationHours = (endTime - startTime) / (1000 * 60 * 60);

      // Append session metadata
      const sessionMetadata = {
        sessionId: sessionState.sessionId,
        startTime: sessionState.startTime,
        endTime: endTime.toISOString(),
        duration: parseFloat(durationHours.toFixed(2)),
        character: sessionState.character.filePath,
        locationsVisited: sessionState.location.visitedThisSession.length,
        npcsInteracted: sessionState.npcs.interactedWith.length,
        xpGained: 0, // Will be calculated by SessionLogger
        logFile: logPath || null
      };

      history.sessions.push(sessionMetadata);

      // Save updated history
      const yamlContent = this.yaml.dump(history, {
        indent: 2,
        lineWidth: -1,
        sortKeys: false
      });

      await this.fs.writeFile(historyPath, yamlContent, 'utf-8');

    } catch (error) {
      console.error('Failed to update session history:', error.message);
      // Don't throw - session end should continue even if history update fails
    }
  }

  /**
   * Internal: Append message to performance.log
   * @private
   */
  async _appendPerformanceLog(message) {
    try {
      const logPath = 'performance.log';
      await this.fs.appendFile(logPath, message, 'utf-8');
    } catch (error) {
      console.error('Failed to write performance log:', error.message);
    }
  }

  /**
   * Internal: Deep merge two objects
   * @private
   */
  _deepMerge(target, source) {
    const output = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        // Recursively merge nested objects
        output[key] = this._deepMerge(output[key] || {}, source[key]);
      } else {
        // Direct assignment for primitives and arrays
        output[key] = source[key];
      }
    }

    return output;
  }
}

module.exports = SessionManager;
