/**
 * Start Session Command Handler
 * Implements AC-4: Start Session Command (Primary)
 *
 * @module startSessionHandler
 */

/**
 * Handle /start-session command
 * Creates new session, loads initial location, generates narrative
 *
 * @param {Object} deps - Injected dependencies
 * @param {Object} deps.sessionManager - SessionManager instance
 * @param {Object} deps.locationLoader - LocationLoader instance
 * @param {Object} deps.contextBuilder - ContextBuilder instance
 * @param {Object} deps.sessionLogger - SessionLogger instance
 * @param {Function} deps.outputChannel - Output function for displaying narrative
 * @param {string[]} args - Command arguments (none for start-session)
 * @returns {Promise<Object>} Session state
 *
 * @example
 * await startSessionHandler(deps, []);
 */
async function startSessionHandler(deps, args) {
  const {
    sessionManager,
    locationLoader,
    contextBuilder,
    sessionLogger,
    outputChannel
  } = deps;

  // Validate dependencies
  if (!sessionManager || !locationLoader || !contextBuilder || !sessionLogger || !outputChannel) {
    throw new Error('Missing required dependencies');
  }

  const startTime = performance.now();

  try {
    // Step 1: Create new session with initial location
    const sessionState = sessionManager.startSession('village-of-barovia');

    // Step 2: Initialize session log
    const logFile = sessionLogger.initializeLog(sessionState.sessionId);

    // Step 3: Load initial location data
    const locationData = await locationLoader.loadLocation('village-of-barovia');

    // Step 4: Build LLM prompt with context
    const prompt = contextBuilder.buildPrompt(locationData, null, []);

    // Step 5: Generate narrative (stub - just use description for now)
    // TODO: Replace with real LLM integration in Story 1.5
    const narrative = `# Game Session Started\n\n` +
      `Session ID: ${sessionState.sessionId}\n` +
      `Location: ${locationData.locationName}\n\n` +
      `## ${locationData.locationName}\n\n` +
      `${locationData.description}\n\n` +
      `_Session log: ${logFile}_`;

    // Step 6: Display narrative to user
    outputChannel(narrative);

    // Step 7: Log the start action
    sessionLogger.log({
      description: 'Started new game session',
      result: `Session started at ${locationData.locationName}`
    });

    // Performance check (AC-4: must complete in < 3 seconds)
    const duration = performance.now() - startTime;
    if (duration > 3000) {
      console.warn(`[Performance] Start session took ${duration.toFixed(2)}ms (>3000ms target)`);
    }

    return sessionState;
  } catch (error) {
    // Graceful error handling (AC-11)
    const errorMessage = `Failed to start session: ${error.message}`;
    outputChannel(`ERROR: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

module.exports = { startSessionHandler };
