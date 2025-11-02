/**
 * Look Command Handler
 * Implements AC-6: Look Command
 *
 * @module lookHandler
 */

/**
 * Handle /look command
 * Reloads location data and generates refreshed description
 *
 * @param {Object} deps - Injected dependencies
 * @param {Object} deps.sessionManager - SessionManager instance
 * @param {Object} deps.locationLoader - LocationLoader instance
 * @param {Object} deps.contextBuilder - ContextBuilder instance
 * @param {Object} deps.sessionLogger - SessionLogger instance
 * @param {Function} deps.outputChannel - Output function for displaying narrative
 * @param {string[]} args - Command arguments (none for look)
 * @returns {Promise<Object>} Current session state
 *
 * @example
 * await lookHandler(deps, []);
 */
async function lookHandler(deps, args) {
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

    // Step 1: Get current location ID from session
    // (Already have it from session check above)

    // Step 2: Reload location data from disk (AC-6: triggers file reload)
    // Note: LocationLoader caches data, but we need fresh data
    // Clear cache for this location to force reload
    if (locationLoader.cache && locationLoader.cache.has) {
      locationLoader.cache.delete(currentLocationId);
    }

    const locationData = await locationLoader.loadLocation(currentLocationId);

    // Step 3: Build prompt with recent actions (use "return" variant)
    const recentActions = [{
      description: 'Looking around',
      result: 'Observing current surroundings'
    }];
    const prompt = contextBuilder.buildPrompt(locationData, null, recentActions);

    // Step 4: Generate refreshed narrative (stub)
    // TODO: Replace with real LLM integration in Story 1.5
    const narrative = `## ${locationData.locationName}\n\n` +
      `${locationData.description}\n\n` +
      `${locationData.npcs && locationData.npcs.length > 0 ? `**NPCs present:** ${locationData.npcs.length}\n` : ''}` +
      `${locationData.items && locationData.items.length > 0 ? `**Items visible:** ${locationData.items.filter(i => !i.hidden).length}\n` : ''}`;

    // Step 5: Display narrative
    outputChannel(narrative);

    // Step 6: Log the action
    sessionLogger.log({
      description: 'Looked around current location',
      result: `Refreshed view of ${locationData.locationName}`
    });

    // Record action in session
    sessionManager.recordAction({
      actionType: 'look',
      location: currentLocationId
    });

    // Performance check (AC-6: must complete in < 5 seconds)
    const duration = performance.now() - startTime;
    if (duration > 5000) {
      console.warn(`[Performance] Look took ${duration.toFixed(2)}ms (>5000ms target)`);
    }

    return session;
  } catch (error) {
    // Graceful error handling (AC-11)
    const errorMessage = `Failed to look around: ${error.message}`;
    outputChannel(`ERROR: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

module.exports = { lookHandler };
