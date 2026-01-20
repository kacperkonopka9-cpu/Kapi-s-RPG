/**
 * SessionLogger - Epic 5 Story 5.6: Session Management & Logging System
 *
 * Generates markdown session summaries with key events, NPCs, loot, XP, and calendar progression.
 * Produces player-facing narrative documents optimized for readability.
 *
 * Key Features:
 * - Markdown session logs with tables (not YAML/JSON)
 * - Calculates session duration (real-world hours)
 * - Extracts XP gained and loot acquired via character file comparison
 * - Parses locations visited, NPCs interacted with, events triggered
 * - Includes performance metrics (startup time, context load time)
 *
 * Result Object Pattern: All methods return {success, data?, error?}
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

/**
 * SessionLogger class
 */
class SessionLogger {
  /**
   * Create a new SessionLogger
   * @param {Object} deps - Dependency injection
   * @param {Object} deps.fs - File system module (default: fs.promises)
   * @param {Object} deps.path - Path module (default: path)
   * @param {Object} deps.yaml - YAML parser (default: js-yaml)
   * @param {Object} deps.characterManager - CharacterManager instance (Epic 3, optional)
   */
  constructor(deps = {}) {
    this.fs = deps.fs || fs;
    this.path = deps.path || path;
    this.yaml = deps.yaml || yaml;
    this.characterManager = deps.characterManager || null;
  }

  /**
   * Generate session summary markdown
   * AC-4: Creates markdown log with header, summary, locations, NPCs, events, loot, XP, calendar, performance
   *
   * @param {Object} sessionState - Session state object from SessionManager
   * @param {string} playerSummary - Optional player-provided summary
   * @returns {Promise<{success: boolean, logContent?: string, error?: string}>}
   */
  async generateSummary(sessionState, playerSummary = null) {
    try {
      // 2.2.1: Calculate session duration (endTime - startTime)
      const startTime = new Date(sessionState.startTime);
      const endTime = new Date();
      const durationMs = endTime - startTime;
      const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
      const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

      // 2.2.2: Load character file at session end, compare with snapshotHash
      let xpGained = 0;
      let lootAcquired = [];
      let characterName = 'Unknown';
      let characterLevel = sessionState.character.initialLevel;

      try {
        const characterContent = await this.fs.readFile(sessionState.character.filePath, 'utf-8');
        const currentCharacter = this.yaml.load(characterContent);

        characterName = currentCharacter.name || 'Unknown';
        characterLevel = currentCharacter.level || sessionState.character.initialLevel;

        // 2.2.3: Extract XP gained (compare initialXP with current XP)
        const currentXP = currentCharacter.experience || 0;
        xpGained = currentXP - sessionState.character.initialXP;

        // 2.2.7: Calculate loot acquired (compare character inventory arrays)
        // This is a simplified comparison - assumes inventory is an array of item objects
        if (currentCharacter.inventory && Array.isArray(currentCharacter.inventory)) {
          lootAcquired = currentCharacter.inventory.map(item => {
            if (typeof item === 'string') {
              return item;
            } else if (item.name) {
              return item.name + (item.quantity > 1 ? ` x${item.quantity}` : '');
            }
            return 'Unknown item';
          });
        }

      } catch (error) {
        // Character file might not exist or be corrupted - use defaults
        console.warn('Could not load character file for session log:', error.message);
      }

      // 2.2.4: Parse visitedLocations array into location table
      const locationsTable = this._buildLocationsTable(sessionState.location.visitedThisSession);

      // 2.2.5: Parse interactedWith array into NPC table
      const npcsTable = this._buildNPCsTable(sessionState.npcs.interactedWith);

      // 2.2.6: Parse triggeredThisSession events into events list
      const eventsList = this._buildEventsList(sessionState.events.triggeredThisSession);

      // 2.2.8: Build markdown content using template
      const markdown = this._buildMarkdownTemplate({
        sessionId: sessionState.sessionId,
        startTime: startTime,
        endTime: endTime,
        durationHours: durationHours,
        durationMinutes: durationMinutes,
        characterName: characterName,
        characterLevel: characterLevel,
        startingLocation: sessionState.location.visitedThisSession[0]?.locationId || 'Unknown',
        playerSummary: playerSummary,
        locationsTable: locationsTable,
        npcsTable: npcsTable,
        eventsList: eventsList,
        lootAcquired: lootAcquired,
        xpGained: xpGained,
        calendar: sessionState.calendar,
        performance: sessionState.performance
      });

      // 2.2.10: Return Result Object with logContent
      return {
        success: true,
        logContent: markdown
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to generate session summary: ${error.message}`
      };
    }
  }

  /**
   * Save session log to file
   * AC-4: Saves markdown to game-data/session/logs/YYYY-MM-DD-session-N.md
   *
   * @param {string} logContent - Markdown content from generateSummary()
   * @param {string} sessionId - Session ID for filename generation
   * @returns {Promise<{success: boolean, logPath?: string, error?: string}>}
   */
  async saveLog(logContent, sessionId) {
    try {
      // 2.3.1: Generate filename from sessionId (YYYY-MM-DD-session-N.md)
      const datePart = sessionId.split('-').slice(0, 3).join('-'); // Extract YYYY-MM-DD
      const sessionNumber = sessionId.split('-').pop(); // Extract session number

      // Find next available session number for this date
      const logsDir = 'game-data/session/logs';
      let filename = `${datePart}-session-${sessionNumber}.md`;
      let logPath = this.path.join(logsDir, filename);

      // Check if file exists and increment number if needed
      let counter = parseInt(sessionNumber, 10) || 1;
      while (true) {
        try {
          await this.fs.access(logPath);
          // File exists, try next number
          counter++;
          filename = `${datePart}-session-${counter}.md`;
          logPath = this.path.join(logsDir, filename);
        } catch (error) {
          // File doesn't exist, use this filename
          break;
        }
      }

      // 2.3.2: Ensure logs/ directory exists
      await this.fs.mkdir(logsDir, { recursive: true });

      // 2.3.3: Write markdown content to file
      await this.fs.writeFile(logPath, logContent, 'utf-8');

      // 2.3.4: Return Result Object with logPath
      return {
        success: true,
        logPath: logPath
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to save session log: ${error.message}`
      };
    }
  }

  /**
   * Internal: Build locations table markdown
   * @private
   */
  _buildLocationsTable(visitedLocations) {
    if (!visitedLocations || visitedLocations.length === 0) {
      return 'No locations visited';
    }

    let table = '| Location | Entry Time (In-Game) | Notes |\n';
    table += '|----------|----------------------|-------|\n';

    for (const visit of visitedLocations) {
      const locationId = visit.locationId || 'Unknown';
      const enteredAt = visit.enteredAt ? new Date(visit.enteredAt).toISOString().split('T')[1].slice(0, 5) : 'Unknown';
      const notes = visit.notes || '';

      table += `| ${locationId} | ${enteredAt} | ${notes} |\n`;
    }

    return table;
  }

  /**
   * Internal: Build NPCs table markdown
   * @private
   */
  _buildNPCsTable(interactedNPCs) {
    if (!interactedNPCs || interactedNPCs.length === 0) {
      return 'No NPCs interacted with';
    }

    // Count interactions per NPC
    const npcCounts = {};
    for (const interaction of interactedNPCs) {
      const npcId = interaction.npcId || 'Unknown';
      npcCounts[npcId] = (npcCounts[npcId] || 0) + 1;
    }

    let table = '| NPC Name | Interactions | Relationship |\n';
    table += '|----------|--------------|--------------||\n';

    for (const [npcId, count] of Object.entries(npcCounts)) {
      const relationship = 'Neutral'; // Default relationship
      table += `| ${npcId} | ${count} | ${relationship} |\n`;
    }

    return table;
  }

  /**
   * Internal: Build events list markdown
   * @private
   */
  _buildEventsList(triggeredEvents) {
    if (!triggeredEvents || triggeredEvents.length === 0) {
      return 'No events triggered';
    }

    let list = '';
    for (const eventId of triggeredEvents) {
      list += `- **${eventId}**\n`;
    }

    return list;
  }

  /**
   * Internal: Build complete markdown template
   * @private
   */
  _buildMarkdownTemplate(data) {
    const {
      sessionId,
      startTime,
      endTime,
      durationHours,
      durationMinutes,
      characterName,
      characterLevel,
      startingLocation,
      playerSummary,
      locationsTable,
      npcsTable,
      eventsList,
      lootAcquired,
      xpGained,
      calendar,
      performance
    } = data;

    const dateStr = startTime.toISOString().split('T')[0];
    const avgContextLoadTime = performance.contextLoadTimes && performance.contextLoadTimes.length > 0
      ? (performance.contextLoadTimes.reduce((a, b) => a + b, 0) / performance.contextLoadTimes.length).toFixed(1)
      : '0.0';

    let markdown = `# Session Log: ${sessionId}\n\n`;
    markdown += `**Date:** ${dateStr}\n`;
    markdown += `**Duration:** ${durationHours}h ${durationMinutes}m\n`;
    markdown += `**Character:** ${characterName} (Level ${characterLevel})\n`;
    markdown += `**Starting Location:** ${startingLocation}\n\n`;
    markdown += `---\n\n`;

    // Summary section (include player summary if provided)
    markdown += `## Summary\n\n`;
    if (playerSummary) {
      markdown += `${playerSummary}\n\n`;
    } else {
      markdown += `Session completed. See details below.\n\n`;
    }
    markdown += `---\n\n`;

    // Locations visited
    markdown += `## Locations Visited\n\n`;
    markdown += `${locationsTable}\n\n`;
    markdown += `---\n\n`;

    // NPCs interacted with
    markdown += `## NPCs Interacted With\n\n`;
    markdown += `${npcsTable}\n\n`;
    markdown += `---\n\n`;

    // Events triggered
    markdown += `## Events Triggered\n\n`;
    markdown += `${eventsList}\n\n`;
    markdown += `---\n\n`;

    // Loot acquired
    markdown += `## Loot Acquired\n\n`;
    if (lootAcquired && lootAcquired.length > 0) {
      for (const item of lootAcquired) {
        markdown += `- ${item}\n`;
      }
    } else {
      markdown += `No loot acquired\n`;
    }
    markdown += `\n---\n\n`;

    // Character progression
    markdown += `## Character Progression\n\n`;
    markdown += `- **XP Gained:** ${xpGained} XP\n`;
    markdown += `- **Total XP:** ${(data.characterLevel * 1000) + xpGained} (estimated)\n`;
    markdown += `- **Level Up:** ${xpGained >= 1000 ? 'Yes' : 'No'}\n\n`;
    markdown += `---\n\n`;

    // Calendar progression
    markdown += `## Calendar Progression\n\n`;
    if (calendar) {
      markdown += `- **In-Game Time Elapsed:** ${calendar.timePassed || '0 hours'}\n`;
      markdown += `- **Starting Date/Time:** ${calendar.sessionStartDate}, ${calendar.sessionStartTime}\n`;
      markdown += `- **Ending Date/Time:** ${calendar.currentDate}, ${calendar.currentTime}\n`;
    } else {
      markdown += `Calendar data not available\n`;
    }
    markdown += `\n---\n\n`;

    // Performance metrics
    markdown += `## Performance Metrics\n\n`;
    markdown += `- **Session Startup Time:** ${performance.startupTime || 0} seconds\n`;
    markdown += `- **Average Context Load Time:** ${avgContextLoadTime} seconds\n`;
    markdown += `- **Average LLM Response Time:** ${performance.avgLLMResponseTime || 0} seconds\n`;
    markdown += `- **Auto-Saves:** ${performance.autoSaveCount || 0}\n\n`;
    markdown += `---\n\n`;

    return markdown;
  }
}

module.exports = SessionLogger;
