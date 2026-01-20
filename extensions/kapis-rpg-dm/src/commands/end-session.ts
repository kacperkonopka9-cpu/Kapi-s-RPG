import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { formatDistanceStrict } from 'date-fns';
import { CommandResult } from './registry';

// Import Epic 5 Story 5-6 systems
const SessionManager = require('../../../../src/session/session-manager');
const SessionLogger = require('../../../../src/session/session-logger');
const GitIntegration = require('../../../../src/session/git-integration');

/**
 * /end-session [summary] - End current gameplay session
 *
 * Workflow:
 * 1. Load current session state from current-session.yaml
 * 2. Generate session summary using SessionLogger (stub)
 * 3. Save session log to game-data/session/logs/YYYY-MM-DD-session-N.md
 * 4. Create Git commit using GitIntegration (stub)
 * 5. Update session-history.yaml with session metadata
 * 6. Delete current-session.yaml to mark session as ended
 * 7. Display session summary with duration, locations, NPCs, XP, commit hash
 *
 * Performance target: <30 seconds
 */
export async function endSession(
  context: vscode.ExtensionContext,
  summary?: string
): Promise<CommandResult> {
  const startTime = Date.now();

  try {
    const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;

    // End session using SessionManager (Story 5-6)
    // Pass absolute paths since extension runs from different directory
    const sessionDir = path.join(workspaceRoot, 'game-data', 'session');
    const sessionManager = new SessionManager({ sessionDir: sessionDir });
    const sessionLogger = new SessionLogger({ logsDir: path.join(sessionDir, 'logs') });
    const gitIntegration = new GitIntegration({ workspaceRoot: workspaceRoot });

    // Inject dependencies
    sessionManager.sessionLogger = sessionLogger;
    sessionManager.gitIntegration = gitIntegration;

    const endResult = await sessionManager.endSession(summary);

    if (!endResult.success) {
      return {
        success: false,
        message: `Failed to end session: ${endResult.error}`,
        error: new Error(endResult.error || 'Unknown error')
      };
    }

    const sessionSummary = endResult.sessionSummary || 'Session ended';
    const logFilePath = endResult.logPath || 'No log file';
    const commitHash = endResult.gitCommit || 'No commit';

    // Load session-history to get final session metadata
    const sessionHistoryPath = path.join(workspaceRoot, 'game-data', 'session', 'session-history.yaml');
    let sessionHistory: any = { sessions: [] };

    try {
      const historyYaml = await fs.readFile(sessionHistoryPath, 'utf-8');
      sessionHistory = yaml.load(historyYaml) || { sessions: [] };
    } catch (error) {
      // History file doesn't exist
    }

    const lastSession = sessionHistory.sessions[sessionHistory.sessions.length - 1];
    const duration = lastSession ? lastSession.duration : 0;

    // Display session summary
    const elapsedTime = Date.now() - startTime;
    const elapsedSeconds = (elapsedTime / 1000).toFixed(1);

    const confirmationMessage = `**Session Ended Successfully!**\n\n` +
      `**Duration:** ${duration}h\n` +
      `**Locations Visited:** ${lastSession?.locationsVisited || 0}\n` +
      `**NPCs Interacted With:** ${lastSession?.npcsInteracted || 0}\n` +
      `**XP Gained:** ${lastSession?.xpGained || 0}\n\n` +
      `**Session Log:** ${path.basename(logFilePath)}\n` +
      `**Git Commit:** ${commitHash}\n\n` +
      `**Performance:** ${elapsedSeconds}s (target: <30s)\n\n` +
      `Thank you for playing!`;

    vscode.window.showInformationMessage('Session ended! Session log saved.');

    const outputChannel = vscode.window.createOutputChannel('Kapi\'s RPG - Session');
    outputChannel.clear();
    outputChannel.appendLine(confirmationMessage);
    outputChannel.show();

    return {
      success: true,
      message: 'Session ended successfully',
      data: {
        sessionId: lastSession?.sessionId || 'unknown',
        duration: duration,
        logFile: logFilePath,
        gitCommit: commitHash,
        elapsedTime: elapsedTime
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Unexpected error ending session: ${(error as Error).message}`,
      error: error as Error
    };
  }
}
