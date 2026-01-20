import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { CommandResult } from './registry';

// Import Epic systems
const ContextLoader = require('../../../../src/context/context-loader');
const { PromptTemplateEngine } = require('../../../../src/prompts');
const CalendarManager = require('../../../../src/calendar/calendar-manager');
const EventScheduler = require('../../../../src/calendar/event-scheduler');
const StateManager = require('../../../../src/core/state-manager');
const SessionManager = require('../../../../src/session/session-manager');

/**
 * /travel [destination] - Travel to a connected location
 *
 * Workflow:
 * 1. Load current session state to get current location
 * 2. Load current location's metadata.yaml to validate destination in connections
 * 3. Retrieve travel time from metadata (default: 1 hour)
 * 4. Advance calendar using CalendarManager (Epic 2)
 * 5. Check for triggered events using EventScheduler (Epic 2)
 * 6. If encounter triggered: execute encounter, resume travel
 * 7. Update session state with new location
 * 8. Reload context for new location (Story 5-1)
 * 9. Render arrival narration (Story 5-3)
 * 10. Display arrival with performance metrics
 *
 * Performance target: <10 seconds (no encounters), <30 seconds (with encounter)
 */
export async function travel(
  context: vscode.ExtensionContext,
  destination: string
): Promise<CommandResult> {
  const startTime = Date.now();

  try {
    const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const sessionDir = path.join(workspaceRoot, 'game-data', 'session');

    // Step 1: Load current session state using SessionManager (Story 5-6)
    const sessionManager = new SessionManager();
    const sessionState = await sessionManager.getCurrentSession();

    if (!sessionState) {
      return {
        success: false,
        message: 'No active session found. Start a session with /start-session',
        error: new Error('No active session')
      };
    }

    const currentLocation = sessionState.location.currentLocationId;

    // Step 2: Load current location metadata to validate destination
    const locationMetadataPath = path.join(
      workspaceRoot,
      'game-data',
      'locations',
      currentLocation,
      'metadata.yaml'
    );

    let metadata: any;
    try {
      const metadataYaml = await fs.readFile(locationMetadataPath, 'utf-8');
      metadata = yaml.load(metadataYaml);
    } catch (error) {
      return {
        success: false,
        message: `Failed to load location metadata for ${currentLocation}`,
        error: error as Error
      };
    }

    // Validate destination is in connections
    const connections = metadata.connections || [];
    const connectionEntry = connections.find((conn: any) =>
      (typeof conn === 'string' && conn === destination) ||
      (typeof conn === 'object' && conn.location_id === destination)
    );

    if (!connectionEntry) {
      const validDestinations = connections.map((conn: any) =>
        typeof conn === 'string' ? conn : conn.location_id
      ).join(', ');

      return {
        success: false,
        message: `Invalid destination: ${destination} is not connected to ${currentLocation}. Valid destinations: ${validDestinations}`,
        error: new Error('Invalid destination')
      };
    }

    // Step 3: Retrieve travel time (default: 1 hour)
    let travelTimeHours = 1;
    if (typeof connectionEntry === 'object' && connectionEntry.travel_time) {
      travelTimeHours = connectionEntry.travel_time;
    }

    // Step 4: Advance calendar (Epic 2 integration)
    const calendarPath = path.join(workspaceRoot, 'game-data', 'calendar.yaml');
    const calendarManager = new CalendarManager({ calendarPath });

    const advanceResult = await calendarManager.advanceTime(travelTimeHours);
    if (!advanceResult.success) {
      return {
        success: false,
        message: `Failed to advance calendar: ${advanceResult.error}`,
        error: new Error(advanceResult.error)
      };
    }

    // Get calendar state for session update
    const calendarState = advanceResult.data || { current: { date: '', time: '' } };

    // Step 5: Check for triggered events (Epic 2 integration)
    const eventScheduler = new EventScheduler({
      calendarPath,
      eventsDir: path.join(workspaceRoot, 'game-data', 'locations')
    });

    const triggerResult = await eventScheduler.checkTriggers();
    let encounterOccurred = false;

    if (triggerResult.success && triggerResult.data.triggeredEvents?.length > 0) {
      encounterOccurred = true;

      // Step 6: Execute encounter (simplified for now)
      const encounter = triggerResult.data.triggeredEvents[0];
      vscode.window.showWarningMessage(
        `Travel interrupted by event: ${encounter.name}. (Event execution not yet fully implemented)`
      );

      // TODO: Full encounter execution in future enhancement
      // For now, just note the encounter and continue travel
    }

    // Step 7: Update session state with new location using SessionManager (Story 5-6)
    const visitedList = [...sessionState.location.visitedThisSession];
    if (!visitedList.some((v: any) => v.locationId === destination)) {
      visitedList.push({
        locationId: destination,
        enteredAt: new Date().toISOString()
      });
    }

    const currentTimePassed = sessionState.calendar.timePassed || '0 hours';
    const hours = parseInt(currentTimePassed) + travelTimeHours;

    await sessionManager.updateSession({
      location: {
        currentLocationId: destination,
        visitedThisSession: visitedList
      },
      calendar: {
        ...sessionState.calendar,
        timePassed: `${hours} hours`,
        currentDate: calendarState.current.date,
        currentTime: calendarState.current.time
      }
    });

    // Step 8: Reload context for new location (Story 5-1 integration)
    const loader = new ContextLoader();
    const contextResult = await loader.loadContext(
      sessionState.character.filePath,
      destination,
      sessionState,
      3500
    );

    if (!contextResult.success) {
      return {
        success: false,
        message: `Failed to load context for ${destination}: ${contextResult.error}`,
        error: new Error(contextResult.error)
      };
    }

    const gameContext = contextResult.data;

    // Update session context metadata using SessionManager
    await sessionManager.updateSession({
      context: {
        lastLoadedAt: new Date().toISOString(),
        tokensUsed: gameContext.metadata.tokenCount,
        cacheKeys: sessionState.context.cacheKeys || []
      }
    });

    // Step 9: Render arrival narration (Story 5-3 integration)
    const templateEngine = new PromptTemplateEngine();

    // Use location-return template if returning to previous visit, otherwise location-initial-visit
    const hasVisited = sessionState.location.visitedThisSession.filter(
      (loc: string) => loc === destination
    ).length > 1;

    const templateId = hasVisited ? 'location-return' : 'location-initial-visit';

    const templateResult = await templateEngine.renderTemplate(templateId, gameContext);

    let arrivalNarration = '';
    if (templateResult.success) {
      arrivalNarration = templateResult.data.prompt;
    } else {
      arrivalNarration = `You arrive at ${gameContext.location?.name || destination}.`;
    }

    // Step 10: Display arrival
    const elapsedTime = Date.now() - startTime;
    const elapsedSeconds = (elapsedTime / 1000).toFixed(1);

    const confirmationMessage = `**Travel Complete!**\n\n` +
      `**Journey:** ${currentLocation} → ${destination}\n` +
      `**Travel Time:** ${travelTimeHours} hour(s)\n` +
      `**New Location:** ${gameContext.location?.name || destination}\n` +
      `**Date/Time:** ${gameContext.calendar?.currentDate} ${gameContext.calendar?.currentTime}\n` +
      `**Encounter During Travel:** ${encounterOccurred ? 'Yes' : 'No'}\n\n` +
      `**Context Reloaded:**\n` +
      `- Token count: ${gameContext.metadata.tokenCount} / 3500\n` +
      `- NPCs loaded: ${gameContext.npcs?.length || 0}\n\n` +
      `**Performance:** ${elapsedSeconds}s (target: <${encounterOccurred ? 30 : 10}s)\n\n` +
      `---\n\n${arrivalNarration}`;

    vscode.window.showInformationMessage(`Arrived at ${destination}!`);

    const outputChannel = vscode.window.createOutputChannel('Kapi\'s RPG - Travel');
    outputChannel.clear();
    outputChannel.appendLine(confirmationMessage);
    outputChannel.show();

    return {
      success: true,
      message: `Arrived at ${destination}`,
      data: {
        from: currentLocation,
        to: destination,
        travelTime: travelTimeHours,
        encounterOccurred,
        elapsedTime
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Unexpected error during travel: ${(error as Error).message}`,
      error: error as Error
    };
  }
}
