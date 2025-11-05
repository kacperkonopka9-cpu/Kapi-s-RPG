/**
 * SessionLogger Module
 * Implements AC-1, AC-2, AC-3, AC-4: Session Logging System
 *
 * Logs all player actions during gameplay to markdown files in logs/ directory.
 * Provides immediate writes (no buffering) with graceful error handling.
 *
 * @module SessionLogger
 */

const fs = require('fs');
const path = require('path');

/**
 * SessionLogger class
 * Manages session logging to markdown files with immediate writes
 *
 * @class
 * @example
 * const logger = new SessionLogger();
 * logger.initializeLog('session-123');
 * logger.log({ type: 'start', locationId: 'village-of-barovia', narrative: '...', tokensUsed: 245 });
 * logger.finalize();
 */
class SessionLogger {
  /**
   * Create a SessionLogger instance
   *
   * @param {string} [basePath=null] - Base path for logs directory (for dependency injection/testing)
   * @param {Object} [deps={}] - Dependencies for testing (fs, path, performance)
   */
  constructor(basePath = null, deps = {}) {
    this.basePath = basePath || path.join(process.cwd(), 'logs');
    this.currentLogFile = null;
    this.sessionId = null;
    this.startTime = null;
    this.actionCount = 0;
    this.tokenCount = 0;

    // Dependency injection for testing
    this.fs = deps.fs || fs;
    this.path = deps.path || path;
    this.performance = deps.performance || (typeof performance !== 'undefined' ? performance : Date);
  }

  /**
   * Initialize a new session log
   * Creates or opens log file at logs/session-YYYY-MM-DD.md
   * If file exists (multiple sessions same day), appends with separator
   *
   * @param {string} sessionId - Unique session identifier
   * @returns {string} Path to log file
   *
   * Performance target: < 50ms
   *
   * @example
   * const logPath = logger.initializeLog('session-abc123');
   * console.log(`Log file: ${logPath}`);
   */
  initializeLog(sessionId) {
    const startTime = this.performance.now ? this.performance.now() : Date.now();

    try {
      // Validate sessionId
      if (!sessionId || typeof sessionId !== 'string') {
        console.warn('[SessionLogger] Invalid sessionId provided, generating default');
        sessionId = `session-${Date.now()}`;
      }

      this.sessionId = sessionId;
      this.startTime = new Date();
      this.actionCount = 0;
      this.tokenCount = 0;

      // Generate log filename: logs/session-YYYY-MM-DD.md
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const logFileName = `session-${date}.md`;
      this.currentLogFile = this.path.join(this.basePath, logFileName);

      // Create logs directory if it doesn't exist
      if (!this.fs.existsSync(this.basePath)) {
        this.fs.mkdirSync(this.basePath, { recursive: true });
      }

      // Check if file exists (multiple sessions same day)
      const fileExists = this.fs.existsSync(this.currentLogFile);

      if (fileExists) {
        // Append with separator
        const separator = '\n---\n\n';
        this.fs.appendFileSync(this.currentLogFile, separator, 'utf8');
      }

      // Write session header
      const header = fileExists
        ? this._formatSessionHeader(sessionId, this.startTime)
        : this._formatInitialHeader(sessionId, this.startTime, date);

      this.fs.appendFileSync(this.currentLogFile, header, 'utf8');

      const duration = this.performance.now ? this.performance.now() - startTime : Date.now() - startTime;
      if (duration > 50) {
        console.warn(`[SessionLogger] initializeLog() took ${duration.toFixed(2)}ms (target: <50ms)`);
      }

      return this.currentLogFile;
    } catch (error) {
      console.warn(`[SessionLogger] Failed to initialize log file: ${error.message}`);
      console.warn('[SessionLogger] Continuing without logging (graceful fallback)');
      this.currentLogFile = null;
      return null;
    }
  }

  /**
   * Log an action to the current session
   * Writes immediately to log file (no buffering)
   *
   * @param {Object} action - Action entry to log
   * @param {string} action.type - Action type: 'start', 'travel', 'look', 'end'
   * @param {string} action.locationId - Current location ID
   * @param {string} action.narrative - LLM-generated narrative text
   * @param {number} [action.tokensUsed] - Optional token count
   * @returns {Object} Result object with success status
   *
   * Performance target: < 20ms
   *
   * @example
   * logger.log({
   *   type: 'travel',
   *   locationId: 'village-of-barovia',
   *   narrative: 'You arrive at the misty village...',
   *   tokensUsed: 189
   * });
   */
  log(action) {
    const startTime = this.performance.now ? this.performance.now() : Date.now();

    try {
      // Validate log is initialized
      if (!this.currentLogFile) {
        console.warn('[SessionLogger] No active log file. Call initializeLog() first.');
        return { success: false, error: 'No active log file' };
      }

      // Validate action object
      if (!action || typeof action !== 'object') {
        console.warn('[SessionLogger] Invalid action object provided');
        return { success: false, error: 'Invalid action object' };
      }

      const { type, locationId, narrative, tokensUsed } = action;

      // Format log entry
      const timestamp = new Date().toISOString();
      const timeOnly = timestamp.substring(11, 19); // HH:MM:SS

      // Sanitize narrative to prevent markdown injection
      const sanitizedNarrative = this._sanitizeMarkdown(narrative || 'No narrative provided');

      const logEntry = this._formatLogEntry(timeOnly, type, locationId, sanitizedNarrative, tokensUsed);

      // Write immediately (no buffering)
      this.fs.appendFileSync(this.currentLogFile, logEntry, 'utf8');

      // Update counters
      this.actionCount++;
      if (tokensUsed && typeof tokensUsed === 'number') {
        this.tokenCount += tokensUsed;
      }

      const duration = this.performance.now ? this.performance.now() - startTime : Date.now() - startTime;
      if (duration > 20) {
        console.warn(`[SessionLogger] log() took ${duration.toFixed(2)}ms (target: <20ms)`);
      }

      return { success: true };
    } catch (error) {
      console.warn(`[SessionLogger] Failed to write log entry: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Finalize the session log
   * Writes session summary and clears internal state
   *
   * @returns {string|null} Path to finalized log file, or null if error
   *
   * Performance target: < 50ms
   *
   * @example
   * const logPath = logger.finalize();
   * console.log(`Session log saved: ${logPath}`);
   */
  finalize() {
    const startTime = this.performance.now ? this.performance.now() : Date.now();

    try {
      if (!this.currentLogFile) {
        console.warn('[SessionLogger] No active log file to finalize');
        return null;
      }

      // Calculate session duration
      const endTime = new Date();
      const durationMs = endTime - this.startTime;
      const durationMinutes = Math.round(durationMs / 60000);

      // Format session summary
      const summary = this._formatSessionSummary(
        this.actionCount,
        this.tokenCount,
        durationMinutes,
        endTime
      );

      // Write summary
      this.fs.appendFileSync(this.currentLogFile, summary, 'utf8');

      const finalPath = this.currentLogFile;

      // Clear internal state
      this.currentLogFile = null;
      this.sessionId = null;
      this.startTime = null;
      this.actionCount = 0;
      this.tokenCount = 0;

      const duration = this.performance.now ? this.performance.now() - startTime : Date.now() - startTime;
      if (duration > 50) {
        console.warn(`[SessionLogger] finalize() took ${duration.toFixed(2)}ms (target: <50ms)`);
      }

      return finalPath;
    } catch (error) {
      console.warn(`[SessionLogger] Failed to finalize log: ${error.message}`);
      return null;
    }
  }

  // Private helper methods

  /**
   * Format initial file header (first session of the day)
   * @private
   */
  _formatInitialHeader(sessionId, startTime, date) {
    return `# Game Session Log - ${date}\n\n` +
           `## Actions\n\n` +
           this._formatSessionHeader(sessionId, startTime);
  }

  /**
   * Format session header (for each session)
   * @private
   */
  _formatSessionHeader(sessionId, startTime) {
    return `### Session: ${sessionId}\n` +
           `**Start Time**: ${startTime.toISOString()}\n\n`;
  }

  /**
   * Format log entry for an action
   * @private
   */
  _formatLogEntry(timeOnly, type, locationId, narrative, tokensUsed) {
    let entry = `## [${timeOnly}] Action: ${type}\n`;
    entry += `**Location**: ${locationId}\n`;
    entry += `**Narrative**: ${narrative}\n`;

    if (tokensUsed !== undefined && tokensUsed !== null) {
      entry += `**Tokens**: ${tokensUsed}\n`;
    }

    entry += '\n';
    return entry;
  }

  /**
   * Format session summary
   * @private
   */
  _formatSessionSummary(actionCount, tokenCount, durationMinutes, endTime) {
    return `\n## Session Summary\n` +
           `- **Total Actions**: ${actionCount}\n` +
           `- **Total Tokens**: ${tokenCount}\n` +
           `- **Duration**: ${durationMinutes} minutes\n` +
           `- **End Time**: ${endTime.toISOString()}\n\n`;
  }

  /**
   * Sanitize text to prevent markdown injection
   * Escapes special markdown characters
   * @private
   */
  _sanitizeMarkdown(text) {
    if (typeof text !== 'string') {
      return String(text || '');
    }

    // Escape markdown special characters but allow basic formatting
    return text
      .replace(/\\/g, '\\\\')  // Escape backslash first
      .replace(/`/g, '\\`')    // Escape backticks
      .replace(/\*/g, '\\*')   // Escape asterisks (but narrative may legitimately use these)
      .replace(/_/g, '\\_')    // Escape underscores
      .replace(/\[/g, '\\[')   // Escape brackets
      .replace(/\]/g, '\\]')   // Escape brackets
      .replace(/</g, '&lt;')   // Escape HTML
      .replace(/>/g, '&gt;');  // Escape HTML
  }
}

module.exports = { SessionLogger };
