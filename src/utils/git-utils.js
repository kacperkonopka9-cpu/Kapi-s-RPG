/**
 * GitIntegration - Automatic Git commit creation for session auto-save
 *
 * Creates Git commits at session end with descriptive messages containing
 * session metadata (location, duration, action count).
 *
 * Key Features:
 * - Git availability detection (graceful fallback if not installed)
 * - Multi-line commit message formatting
 * - Short hash extraction (7 chars)
 * - Graceful error handling (warns but doesn't block gameplay)
 * - Dependency injection for testability
 *
 * @module GitIntegration
 */

const { execSync } = require('child_process');
const path = require('path');

/**
 * GitIntegration class handles automatic Git commits at session end
 */
class GitIntegration {
  /**
   * Creates a new GitIntegration instance
   *
   * @param {Object} options - Configuration options
   * @param {string} options.cwd - Working directory for Git operations (defaults to process.cwd())
   * @param {Object} options.childProcess - Child process module for dependency injection (testing)
   * @param {Function} options.childProcess.execSync - execSync function
   */
  constructor(options = {}) {
    this.cwd = options.cwd || process.cwd();
    this.execSync = options.childProcess?.execSync || execSync;

    // Cache Git availability check result
    this._gitAvailable = null;
    this._gitChecked = false;
  }

  /**
   * Checks if Git is installed and available
   *
   * @returns {boolean} True if Git is available, false otherwise
   */
  isGitAvailable() {
    // Return cached result if already checked
    if (this._gitChecked) {
      return this._gitAvailable;
    }

    try {
      // Try to run git --version
      this.execSync('git --version', {
        cwd: this.cwd,
        stdio: 'pipe',
        encoding: 'utf-8'
      });

      this._gitAvailable = true;
      this._gitChecked = true;
      return true;
    } catch (error) {
      this._gitAvailable = false;
      this._gitChecked = true;
      return false;
    }
  }

  /**
   * Creates an auto-save Git commit with session metadata
   *
   * @param {Object} sessionState - Session state object
   * @param {string} sessionState.sessionId - Unique session identifier
   * @param {Date} sessionState.startTime - Session start time
   * @param {Date} sessionState.endTime - Session end time
   * @param {string} sessionState.currentLocationId - Current location ID
   * @param {number} sessionState.actionCount - Number of actions taken
   * @param {Array<string>} sessionState.visitedLocations - List of visited locations
   *
   * @returns {Object} GitCommitResult - { success, commitHash, error }
   */
  createAutoSave(sessionState) {
    // Check if Git is available
    if (!this.isGitAvailable()) {
      const error = 'Git is not installed or not available in PATH';
      console.warn(`[Git] Auto-save skipped: ${error}`);
      return {
        success: false,
        commitHash: null,
        error
      };
    }

    try {
      // Step 1: Stage all changes
      this.execSync('git add .', {
        cwd: this.cwd,
        stdio: 'pipe',
        encoding: 'utf-8'
      });

      // Step 2: Build commit message lines
      const messageLines = this._buildCommitMessageLines(sessionState);

      // Step 3: Create commit using multiple -m flags for multi-line message
      const commitArgs = messageLines
        .map(line => `-m "${this._escapeCommitMessage(line)}"`)
        .join(' ');

      this.execSync(`git commit ${commitArgs}`, {
        cwd: this.cwd,
        stdio: 'pipe',
        encoding: 'utf-8'
      });

      // Step 4: Extract commit hash (short format, 7 chars)
      const commitHash = this._getShortHash();

      return {
        success: true,
        commitHash,
        error: null
      };
    } catch (error) {
      // Handle various Git errors gracefully
      const errorMessage = this._parseGitError(error);
      console.warn(`[Git] Auto-save failed: ${errorMessage}`);

      return {
        success: false,
        commitHash: null,
        error: errorMessage
      };
    }
  }

  /**
   * Builds multi-line commit message from session state
   *
   * @private
   * @param {Object} sessionState - Session state object
   * @returns {string} Formatted commit message
   */
  _buildCommitMessage(sessionState) {
    // Build message lines and join with newlines
    const lines = this._buildCommitMessageLines(sessionState);
    return lines.join('\n');
  }

  /**
   * Builds commit message lines as array (for multiple -m flags)
   *
   * @private
   * @param {Object} sessionState - Session state object
   * @returns {string[]} Array of message lines
   */
  _buildCommitMessageLines(sessionState) {
    // Extract session date from sessionId or use current date
    const sessionDate = this._extractSessionDate(sessionState);

    // Get location display name (fallback to locationId if no display name)
    const locationName = this._getLocationDisplayName(sessionState.currentLocationId);

    // Calculate duration in minutes
    const durationMinutes = this._calculateDuration(sessionState.startTime, sessionState.endTime);

    // Build message lines
    return [
      `[AUTO-SAVE] Session ${sessionDate}`,
      `Location: ${locationName}`,
      `Duration: ${durationMinutes} minutes`,
      `Actions: ${sessionState.actionCount || 0}`
    ];
  }

  /**
   * Extracts session date in YYYY-MM-DD format
   *
   * @private
   * @param {Object} sessionState - Session state object
   * @returns {string} ISO date string (YYYY-MM-DD)
   */
  _extractSessionDate(sessionState) {
    // Try to parse from sessionId (format: session-YYYY-MM-DD-...)
    if (sessionState.sessionId && sessionState.sessionId.includes('session-')) {
      const parts = sessionState.sessionId.split('-');
      if (parts.length >= 4) {
        // Extract YYYY-MM-DD
        return `${parts[1]}-${parts[2]}-${parts[3]}`;
      }
    }

    // Fallback: use endTime or current date
    const date = sessionState.endTime || new Date();
    return date.toISOString().split('T')[0];
  }

  /**
   * Gets location display name (or falls back to locationId)
   *
   * @private
   * @param {string} locationId - Location identifier
   * @returns {string} Display name or locationId
   */
  _getLocationDisplayName(locationId) {
    // For now, just return the locationId
    // In the future, we could load location metadata to get display names
    return locationId || 'Unknown Location';
  }

  /**
   * Calculates session duration in minutes
   *
   * @private
   * @param {Date} startTime - Session start time
   * @param {Date} endTime - Session end time
   * @returns {number} Duration in minutes (rounded)
   */
  _calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) {
      return 0;
    }

    const durationMs = endTime - startTime;
    const durationMinutes = Math.round(durationMs / 1000 / 60);

    return durationMinutes;
  }

  /**
   * Escapes commit message for shell execution
   *
   * @private
   * @param {string} message - Commit message
   * @returns {string} Escaped message
   */
  _escapeCommitMessage(message) {
    // Escape double quotes and backslashes for shell
    return message.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  /**
   * Gets short commit hash (7 chars) from HEAD
   *
   * @private
   * @returns {string} Short commit hash
   */
  _getShortHash() {
    try {
      const hash = this.execSync('git rev-parse --short HEAD', {
        cwd: this.cwd,
        stdio: 'pipe',
        encoding: 'utf-8'
      });

      return hash.trim();
    } catch (error) {
      // If we can't get the hash, something went very wrong
      return 'unknown';
    }
  }

  /**
   * Parses Git error messages into user-friendly text
   *
   * @private
   * @param {Error} error - Error object from execSync
   * @returns {string} User-friendly error message
   */
  _parseGitError(error) {
    const errorMsg = error.message || error.toString();

    // Check for common Git error patterns
    if (errorMsg.includes('not a git repository')) {
      return 'Not a Git repository (.git folder not found)';
    }

    if (errorMsg.includes('nothing to commit') ||
        errorMsg.includes('no changes added') ||
        errorMsg.includes('nothing added to commit') ||
        errorMsg.includes('working tree clean')) {
      return 'No changes to commit (everything already saved)';
    }

    if (errorMsg.includes('EACCES') || errorMsg.includes('permission denied')) {
      return 'Permission error (cannot write to .git folder)';
    }

    if (errorMsg.includes('detached HEAD')) {
      return 'Detached HEAD state detected';
    }

    if (errorMsg.toLowerCase().includes('merge conflict')) {
      return 'Merge conflict in progress';
    }

    // Generic error
    return 'Git commit failed (see console for details)';
  }
}

module.exports = { GitIntegration };
