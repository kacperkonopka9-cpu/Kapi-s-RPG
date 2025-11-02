/**
 * GitIntegration Stub
 * Temporary implementation until Story 1.8 (Git Auto-Save)
 * Provides basic Git commit functionality for session saves
 */

const { execSync } = require('child_process');

/**
 * @typedef {Object} GitCommitResult
 * @property {boolean} success - Whether commit was successful
 * @property {string|null} commitHash - Commit hash if successful
 * @property {string|null} error - Error message if failed
 */

/**
 * GitIntegration stub class
 * TODO: Replace with real implementation in Story 1.8
 */
class GitIntegration {
  /**
   * Create an auto-save commit for a game session
   * @param {Object} sessionState - Session state to save
   * @returns {GitCommitResult} Result of commit operation
   */
  createAutoSave(sessionState) {
    try {
      // Format date for commit message
      const date = sessionState.endTime
        ? new Date(sessionState.endTime).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      // Calculate duration
      const duration = sessionState.endTime && sessionState.startTime
        ? Math.round((new Date(sessionState.endTime) - new Date(sessionState.startTime)) / 60000)
        : 0;

      // Build commit message
      const commitMessage = `[AUTO-SAVE] Session ${date}\n` +
        `Location: ${sessionState.currentLocationId || 'Unknown'}\n` +
        `Duration: ${duration} minutes\n` +
        `Actions: ${sessionState.actionCount || 0}`;

      // Stage all changes
      execSync('git add .', { cwd: process.cwd(), stdio: 'pipe' });

      // Create commit
      execSync(`git commit -m "${commitMessage}"`, {
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      // Get commit hash
      const commitHash = execSync('git rev-parse HEAD', {
        cwd: process.cwd(),
        encoding: 'utf8'
      }).trim();

      return {
        success: true,
        commitHash,
        error: null
      };
    } catch (error) {
      // Git errors are non-blocking (as per AC-7)
      return {
        success: false,
        commitHash: null,
        error: error.message
      };
    }
  }
}

module.exports = { GitIntegration };
