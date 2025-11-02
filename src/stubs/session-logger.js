/**
 * SessionLogger Stub
 * Temporary implementation until Story 1.7 (Session Logging System)
 * Provides basic session logging to markdown files
 */

const fs = require('fs');
const path = require('path');

/**
 * SessionLogger stub class
 * TODO: Replace with real implementation in Story 1.7
 */
class SessionLogger {
  constructor(logsBasePath = null) {
    this.basePath = logsBasePath || path.join(process.cwd(), 'logs');
    this.currentLogFile = null;
  }

  /**
   * Initialize a new session log
   * @param {string} sessionId - Session identifier
   * @returns {string} Path to log file
   */
  initializeLog(sessionId) {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logFileName = `session-${date}.md`;
    this.currentLogFile = path.join(this.basePath, logFileName);

    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }

    // Create log file if it doesn't exist
    if (!fs.existsSync(this.currentLogFile)) {
      const header = `# Game Session Log - ${date}\n\nSession ID: ${sessionId}\n\n## Actions\n\n`;
      fs.writeFileSync(this.currentLogFile, header, 'utf8');
    }

    return this.currentLogFile;
  }

  /**
   * Log an action to the current session
   * @param {Object} action - Action details
   */
  log(action) {
    if (!this.currentLogFile) {
      throw new Error('No active log file. Call initializeLog() first.');
    }

    const timestamp = new Date().toISOString();
    const logEntry = `### ${timestamp}\n**Action:** ${action.description || 'Unknown action'}\n${action.result ? `**Result:** ${action.result}\n` : ''}\n---\n\n`;

    fs.appendFileSync(this.currentLogFile, logEntry, 'utf8');
  }

  /**
   * Finalize the session log with summary
   * @param {Object} sessionState - Final session state
   * @returns {string} Path to finalized log file
   */
  finalize(sessionState) {
    if (!this.currentLogFile) {
      throw new Error('No active log file');
    }

    const duration = sessionState.endTime && sessionState.startTime
      ? Math.round((new Date(sessionState.endTime) - new Date(sessionState.startTime)) / 60000)
      : 0;

    const summary = `\n## Session Summary\n\n` +
      `- **Duration:** ${duration} minutes\n` +
      `- **Actions Taken:** ${sessionState.actionCount || 0}\n` +
      `- **Locations Visited:** ${sessionState.visitedLocations ? sessionState.visitedLocations.length : 0}\n` +
      `- **Final Location:** ${sessionState.currentLocationId}\n\n` +
      `Session ended at ${sessionState.endTime}\n`;

    fs.appendFileSync(this.currentLogFile, summary, 'utf8');

    const finalPath = this.currentLogFile;
    this.currentLogFile = null;
    return finalPath;
  }
}

module.exports = { SessionLogger };
