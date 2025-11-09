/**
 * Travel Command Handler
 * Implements AC-5: Travel Between Locations
 *
 * @module travelHandler
 */

/**
 * Handle /travel command
 * Validates connectivity, updates location, generates arrival narrative
 *
 * @param {Object} deps - Injected dependencies
 * @param {Object} deps.sessionManager - SessionManager instance
 * @param {Object} deps.locationLoader - LocationLoader instance
 * @param {Object} deps.contextBuilder - ContextBuilder instance
 * @param {Object} deps.navigationHandler - NavigationHandler instance
 * @param {Object} deps.sessionLogger - SessionLogger instance
 * @param {Function} deps.outputChannel - Output function for displaying narrative
 * @param {string[]} args - Command arguments [targetLocationId]
 * @returns {Promise<Object>} Updated session state
 *
 * @example
 * await travelHandler(deps, ['tser-pool-encampment']);
 */
async function travelHandler(deps, args) {
  const {
    sessionManager,
    locationLoader,
    contextBuilder,
    navigationHandler,
    sessionLogger,
    outputChannel
  } = deps;

  // Validate dependencies
  if (!sessionManager || !locationLoader || !contextBuilder || !navigationHandler || !sessionLogger || !outputChannel) {
    throw new Error('Missing required dependencies');
  }

  // AC-12: Validate argument provided
  if (!args || args.length === 0) {
    const errorMessage = 'Travel command requires a location argument. Usage: /travel <location-id>';
    outputChannel(`ERROR: ${errorMessage}`);
    throw new Error(errorMessage);
  }

  const targetLocationId = args[0];

  // AC-12: Check for active session
  const session = sessionManager.getCurrentSession();
  if (!session) {
    const errorMessage = 'No active session. Start a new session with /start-session first.';
    outputChannel(`ERROR: ${errorMessage}`);
    throw new Error(errorMessage);
  }

  const startTime = performance.now();

  try {
    const currentLocationId = session.currentLocationId;

    // Step 1: Validate travel (checks existence and connectivity)
    const navigationResult = navigationHandler.travel(targetLocationId, currentLocationId);

    if (!navigationResult.success) {
      // AC-5: Display user-friendly error for invalid travel
      outputChannel(`ERROR: ${navigationResult.error}`);
      throw new Error(navigationResult.error);
    }

    // Step 2: Record travel action
    sessionManager.recordAction({
      actionType: 'travel',
      from: currentLocationId,
      to: targetLocationId
    });

    // Step 3: Update current location (async due to state persistence - Story 1.10)
    await sessionManager.updateCurrentLocation(targetLocationId);

    // Step 4: Load new location data
    const locationData = await locationLoader.loadLocation(targetLocationId);

    // Step 5: Build prompt with recent actions context
    const recentActions = [{
      description: `Traveled from ${currentLocationId}`,
      result: `Arrived at ${targetLocationId}`
    }];
    const prompt = contextBuilder.buildPrompt(locationData, null, recentActions);

    // Step 6: Generate arrival narrative (stub)
    // TODO: Replace with real LLM integration in Story 1.5
    const narrative = `## Traveling to ${locationData.locationName}\n\n` +
      `You leave ${currentLocationId} and make your way to ${targetLocationId}...\n\n` +
      `### ${locationData.locationName}\n\n` +
      `${locationData.description}`;

    // Step 7: Display narrative
    outputChannel(narrative);

    // Step 8: Log the action
    sessionLogger.log({
      description: `Traveled to ${targetLocationId}`,
      result: `Arrived at ${locationData.locationName}`
    });

    // Performance check (AC-5: must complete in < 1 second excluding LLM)
    const duration = performance.now() - startTime;
    if (duration > 1000) {
      console.warn(`[Performance] Travel took ${duration.toFixed(2)}ms (>1000ms target, excluding LLM)`);
    }

    return sessionManager.getCurrentSession();
  } catch (error) {
    // Graceful error handling (AC-11)
    if (!error.message.startsWith('ERROR:')) {
      const errorMessage = `Failed to travel: ${error.message}`;
      outputChannel(`ERROR: ${errorMessage}`);
    }
    throw error;
  }
}

module.exports = { travelHandler };
