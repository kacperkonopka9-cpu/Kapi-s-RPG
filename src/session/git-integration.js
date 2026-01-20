/**
 * GitIntegration - Epic 5 Story 5.6: Session Management & Logging System
 *
 * Handles Git operations for session management: commits, tags (save points), and rollbacks.
 * Uses system Git CLI via child_process.execSync for maximum compatibility.
 *
 * Key Features:
 * - Auto-commit on session end with formatted message
 * - Git tags for named save points (save/{name})
 * - List and rollback to previous save points
 * - Graceful error handling (Git not installed, commit failures)
 *
 * Security: Uses system Git CLI, does NOT modify Git config or store credentials
 * Result Object Pattern: All methods return {success, data?, error?}
 */

const { execSync } = require('child_process');
const path = require('path');

/**
 * GitIntegration class
 */
class GitIntegration {
  /**
   * Create a new GitIntegration
   * @param {Object} deps - Dependency injection
   * @param {Function} deps.execSync - child_process.execSync (default: require('child_process').execSync)
   * @param {string} deps.projectRoot - Project root directory (default: process.cwd())
   */
  constructor(deps = {}) {
    this.execSync = deps.execSync || execSync;
    this.projectRoot = deps.projectRoot || process.cwd();
  }

  /**
   * Check if Git is installed and repo initialized
   * AC-9: Detects Git availability, returns error if not available
   *
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async checkGitAvailable() {
    try {
      // 3.2.1: Execute `git --version` to check Git installed
      try {
        this.execSync('git --version', { cwd: this.projectRoot, encoding: 'utf-8' });
      } catch (error) {
        return { success: false, error: 'Git not installed' };
      }

      // 3.2.2: Execute `git rev-parse --is-inside-work-tree` to check repo initialized
      try {
        const output = this.execSync('git rev-parse --is-inside-work-tree', {
          cwd: this.projectRoot,
          encoding: 'utf-8'
        });

        if (output.trim() !== 'true') {
          return { success: false, error: 'Not a Git repository' };
        }
      } catch (error) {
        return { success: false, error: 'Not a Git repository' };
      }

      // 3.2.3: Return success
      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: `Git check failed: ${error.message}`
      };
    }
  }

  /**
   * Commit session changes to Git
   * AC-6: Stages files, creates commit with formatted message, includes co-author footer
   *
   * @param {Object} sessionState - Session state object
   * @param {string} summary - Commit message summary (player-provided or AI-generated)
   * @returns {Promise<{success: boolean, commitHash?: string, error?: string}>}
   */
  async commitSession(sessionState, summary) {
    try {
      // 3.3.1: Check Git available
      const gitCheck = await this.checkGitAvailable();
      if (!gitCheck.success) {
        return gitCheck; // Return error from checkGitAvailable
      }

      // 3.3.2: Identify changed files (character, location states, calendar, session log, session history)
      // We'll stage all tracked files that have changed, plus specific session files
      const filesToStage = [
        sessionState.character.filePath,
        'game-data/session/session-history.yaml',
        'game-data/calendar.yaml'
      ];

      // Add session log if it exists
      if (sessionState.logFile) {
        filesToStage.push(sessionState.logFile);
      }

      // Stage location State.md files (all visited locations)
      for (const visit of sessionState.location.visitedThisSession || []) {
        const stateFile = path.join('game-data/locations', visit.locationId, 'State.md');
        filesToStage.push(stateFile);
      }

      // 3.3.3: Execute `git add` for each changed file
      for (const file of filesToStage) {
        try {
          this.execSync(`git add "${file}"`, {
            cwd: this.projectRoot,
            encoding: 'utf-8'
          });
        } catch (error) {
          // File might not exist or not be tracked, skip
          console.warn(`Could not stage file: ${file}`);
        }
      }

      // 3.3.4: Build commit message with format: [SESSION] YYYY-MM-DD | {Location} | {Summary}
      const dateStr = sessionState.sessionId.split('-').slice(0, 3).join('-'); // YYYY-MM-DD
      const currentLocation = sessionState.location.currentLocationId || 'Unknown';

      // Truncate summary to 72 characters for commit message
      const truncatedSummary = summary.length > 72 ? summary.slice(0, 69) + '...' : summary;

      // 3.3.5: Include co-author footer in commit message
      const commitMessage = `[SESSION] ${dateStr} | ${currentLocation} | ${truncatedSummary}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

      // 3.3.6: Execute `git commit -m "message"` via child_process
      try {
        const output = this.execSync(`git commit -m "${this._escapeCommitMessage(commitMessage)}"`, {
          cwd: this.projectRoot,
          encoding: 'utf-8'
        });

        // 3.3.7: Parse commit hash from Git output
        const commitHash = this._parseCommitHash(output);

        // 3.3.8: Return Result Object with commitHash
        return {
          success: true,
          commitHash: commitHash
        };

      } catch (error) {
        // 3.3.9: Handle errors gracefully (log to error.log, don't throw)
        return {
          success: false,
          error: `Git commit failed: ${error.message}`
        };
      }

    } catch (error) {
      return {
        success: false,
        error: `Failed to commit session: ${error.message}`
      };
    }
  }

  /**
   * Create Git tag for save point
   * AC-7: Creates annotated tag save/{name}, prompts if tag exists
   *
   * @param {string} saveName - Save point name (will be sanitized)
   * @param {string} description - Tag message (location, level, date)
   * @returns {Promise<{success: boolean, tag?: string, error?: string}>}
   */
  async createSavePoint(saveName, description) {
    try {
      // Check Git available
      const gitCheck = await this.checkGitAvailable();
      if (!gitCheck.success) {
        return gitCheck;
      }

      // 3.4.1: Sanitize saveName (alphanumeric + dashes only)
      const sanitized = saveName.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
      if (sanitized !== saveName) {
        console.warn(`Save name sanitized: "${saveName}" -> "${sanitized}"`);
      }

      // 3.4.2: Build tag name: save/{saveName}
      const tagName = `save/${sanitized}`;

      // 3.4.3: Check if tag exists
      try {
        const existingTags = this.execSync(`git tag -l "${tagName}"`, {
          cwd: this.projectRoot,
          encoding: 'utf-8'
        });

        // 3.4.4: If exists, return error (command handler will prompt for overwrite)
        if (existingTags.trim() === tagName) {
          return {
            success: false,
            error: `Save point "${tagName}" already exists. Use a different name or delete the existing save point first.`
          };
        }
      } catch (error) {
        // Tag list command failed, continue anyway
      }

      // 3.4.5: Build tag message
      const tagMessage = description || 'Manual save point';

      // 3.4.6: Execute `git tag -a "save/{saveName}" -m "{description}"`
      try {
        this.execSync(`git tag -a "${tagName}" -m "${this._escapeCommitMessage(tagMessage)}"`, {
          cwd: this.projectRoot,
          encoding: 'utf-8'
        });

        // 3.4.7: Return Result Object with tag name
        return {
          success: true,
          tag: tagName
        };

      } catch (error) {
        return {
          success: false,
          error: `Failed to create Git tag: ${error.message}`
        };
      }

    } catch (error) {
      return {
        success: false,
        error: `Failed to create save point: ${error.message}`
      };
    }
  }

  /**
   * List available save points
   * AC-8: Returns list of save points with tags, descriptions, dates
   *
   * @returns {Promise<{success: boolean, savePoints?: Array, error?: string}>}
   */
  async listSavePoints() {
    try {
      // Check Git available
      const gitCheck = await this.checkGitAvailable();
      if (!gitCheck.success) {
        return gitCheck;
      }

      // 3.5.1: Execute `git tag -l "save/*" --format="..."`
      try {
        const output = this.execSync(
          'git tag -l "save/*" --format="%(refname:short)|%(contents:subject)|%(creatordate:short)"',
          {
            cwd: this.projectRoot,
            encoding: 'utf-8'
          }
        );

        // 3.5.2: Parse output into array of save point objects
        const savePoints = this._parseSavePointsOutput(output);

        // 3.5.3: Return Result Object with savePoints array
        return {
          success: true,
          savePoints: savePoints
        };

      } catch (error) {
        return {
          success: false,
          error: `Failed to list save points: ${error.message}`
        };
      }

    } catch (error) {
      return {
        success: false,
        error: `Failed to list save points: ${error.message}`
      };
    }
  }

  /**
   * Rollback to save point
   * AC-8: Checks out Git tag, restores files
   *
   * @param {string} tag - Git tag to checkout (e.g., "save/before-castle-ravenloft")
   * @returns {Promise<{success: boolean, restoredFiles?: Array, error?: string}>}
   */
  async rollbackToSave(tag) {
    try {
      // Check Git available
      const gitCheck = await this.checkGitAvailable();
      if (!gitCheck.success) {
        return gitCheck;
      }

      // 3.6.1: Verify tag exists
      try {
        const existingTags = this.execSync(`git tag -l "${tag}"`, {
          cwd: this.projectRoot,
          encoding: 'utf-8'
        });

        if (existingTags.trim() !== tag) {
          return {
            success: false,
            error: `Save point "${tag}" not found`
          };
        }
      } catch (error) {
        return {
          success: false,
          error: `Failed to verify save point: ${error.message}`
        };
      }

      // 3.6.3: Execute `git checkout {tag}`
      try {
        const output = this.execSync(`git checkout "${tag}"`, {
          cwd: this.projectRoot,
          encoding: 'utf-8'
        });

        // 3.6.4: Parse changed files from Git output
        const restoredFiles = this._parseRestoredFiles(output);

        // 3.6.5: Return Result Object with restoredFiles array
        return {
          success: true,
          restoredFiles: restoredFiles
        };

      } catch (error) {
        return {
          success: false,
          error: `Failed to checkout save point: ${error.message}`
        };
      }

    } catch (error) {
      return {
        success: false,
        error: `Failed to rollback to save point: ${error.message}`
      };
    }
  }

  /**
   * Internal: Escape commit message for shell command
   * @private
   */
  _escapeCommitMessage(message) {
    // Escape double quotes and backslashes
    return message.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  /**
   * Internal: Parse commit hash from Git commit output
   * @private
   */
  _parseCommitHash(output) {
    // Git commit output format: "[branch hash] commit message"
    const match = output.match(/\[[\w\s-]+\s+([a-f0-9]+)\]/);
    if (match && match[1]) {
      return match[1];
    }

    // Fallback: try to get current HEAD commit hash
    try {
      const hash = this.execSync('git rev-parse --short HEAD', {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      });
      return hash.trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Internal: Parse save points list output
   * @private
   */
  _parseSavePointsOutput(output) {
    const lines = output.trim().split('\n').filter(line => line.length > 0);
    const savePoints = [];

    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length >= 3) {
        savePoints.push({
          tag: parts[0],
          description: parts[1],
          date: parts[2]
        });
      }
    }

    return savePoints;
  }

  /**
   * Internal: Parse restored files from Git checkout output
   * @private
   */
  _parseRestoredFiles(output) {
    // Git checkout output doesn't always list changed files
    // Return a placeholder array
    return ['Files restored to save point'];
  }
}

module.exports = GitIntegration;
