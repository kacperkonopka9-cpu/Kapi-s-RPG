"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.endSession = endSession;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
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
async function endSession(context, summary) {
    const startTime = Date.now();
    try {
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
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
        let sessionHistory = { sessions: [] };
        try {
            const historyYaml = await fs.readFile(sessionHistoryPath, 'utf-8');
            sessionHistory = yaml.load(historyYaml) || { sessions: [] };
        }
        catch (error) {
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
    }
    catch (error) {
        return {
            success: false,
            message: `Unexpected error ending session: ${error.message}`,
            error: error
        };
    }
}
//# sourceMappingURL=end-session.js.map