/**
 * End Session Command Handler
 * Implements AC-7: End Session with Auto-Save
 *
 * @module endSessionHandler
 */

/**
 * Handle /end-session command
 * Records end time, finalizes log, creates Git commit, displays summary
 *
 * @param {Object} deps - Injected dependencies
 * @param {Object} deps.sessionManager - SessionManager instance
 * @param {Object} deps.sessionLogger - SessionLogger instance
 * @param {Object} deps.gitIntegration - GitIntegration instance
 * @param {Function} deps.outputChannel - Output function for displaying summary
 * @param {string[]} args - Command arguments (none for end-session)
 * @returns {Promise<Object>} Final session state with summary
 *
 * @example
 * await endSessionHandler(deps, []);
 */
async function endSessionHandler(deps, args) {
  const {
    sessionManager,
    sessionLogger,
    gitIntegration,
    outputChannel
  } = deps;

  // Validate dependencies
  if (!sessionManager || !sessionLogger || !gitIntegration || !outputChannel) {
    throw new Error('Missing required dependencies');
  }

  // AC-12: Check for active session
  const session = sessionManager.getCurrentSession();
  if (!session) {
    const errorMessage = 'No active session to end. Start a session with /start-session first.';
    outputChannel(`ERROR: ${errorMessage}`);
    throw new Error(errorMessage);
  }

  const startTime = performance.now();

  try {
    // Step 1: End session and record end time
    const finalSessionState = sessionManager.endSession();

    // Step 2: Finalize session log with summary
    const logPath = sessionLogger.finalize(finalSessionState);

    // Step 3: Create Git auto-save commit
    const gitResult = gitIntegration.createAutoSave(finalSessionState);

    // Step 4: Build session summary
    const duration = finalSessionState.endTime && finalSessionState.startTime
      ? Math.round((new Date(finalSessionState.endTime) - new Date(finalSessionState.startTime)) / 60000)
      : 0;

    let summary = `# Session Ended\n\n` +
      `## Session Summary\n\n` +
      `- **Duration:** ${duration} minutes\n` +
      `- **Actions Taken:** ${finalSessionState.actionCount || 0}\n` +
      `- **Locations Visited:** ${finalSessionState.visitedLocations ? finalSessionState.visitedLocations.length : 0}\n` +
      `- **Final Location:** ${finalSessionState.currentLocationId}\n` +
      `- **Session Log:** ${logPath}\n`;

    // Step 5: Add Git commit info or warning
    if (gitResult.success) {
      summary += `- **Git Commit:** ${gitResult.commitHash}\n\n` +
        `✅ Session automatically saved to Git.`;
    } else {
      // AC-7: Handle Git errors gracefully (warn but don't block)
      summary += `\n⚠️ **Git Auto-Save Failed:** ${gitResult.error}\n` +
        `Session log was saved, but Git commit failed. You may need to commit manually.`;
      console.warn(`[Git] Auto-save failed: ${gitResult.error}`);
    }

    // Step 6: Display summary to user
    outputChannel(summary);

    // Step 7: Session state is already cleared by sessionManager.endSession()

    // Performance check (AC-7: must complete in < 5 seconds)
    const execDuration = performance.now() - startTime;
    if (execDuration > 5000) {
      console.warn(`[Performance] End session took ${execDuration.toFixed(2)}ms (>5000ms target)`);
    }

    return {
      ...finalSessionState,
      logPath,
      gitCommit: gitResult.commitHash,
      gitSuccess: gitResult.success
    };
  } catch (error) {
    // Graceful error handling (AC-11)
    const errorMessage = `Failed to end session: ${error.message}`;
    outputChannel(`ERROR: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

module.exports = { endSessionHandler };
