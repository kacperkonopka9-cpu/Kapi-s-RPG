import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { CommandResult } from './registry';

// Import Epic 3 mechanics
const LevelUpCalculator = require('../../../../src/mechanics/level-up-calculator');
const SessionManager = require('../../../../src/session/session-manager');

/**
 * /award-xp [amount] [reason] - Award experience points to active character
 *
 * D&D 5e XP Thresholds (PHB p.15):
 * - Level 2: 300 XP
 * - Level 3: 900 XP
 * - Level 4: 2,700 XP
 * - Level 5: 6,500 XP
 *
 * Workflow:
 * 1. Validate XP amount (positive integer)
 * 2. Load current session state and character file
 * 3. Add XP to character's experience total
 * 4. Check for level-up eligibility
 * 5. Save updated character file
 * 6. Display XP award summary with level-up notification if applicable
 *
 * Performance target: <2 seconds
 */
export async function awardXP(
  context: vscode.ExtensionContext,
  amount: number,
  reason?: string
): Promise<CommandResult> {
  const startTime = Date.now();

  try {
    const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;

    // Step 1: Validate XP amount
    if (isNaN(amount) || amount < 0) {
      return {
        success: false,
        message: `Invalid XP amount: ${amount}. Must be a positive number.`,
        error: new Error('Invalid XP amount')
      };
    }

    // Step 2: Load current session state via SessionManager
    const sessionDir = path.join(workspaceRoot, 'game-data', 'session');
    const sessionManager = new SessionManager({ sessionDir });
    const sessionState = await sessionManager.getCurrentSession();

    if (!sessionState) {
      return {
        success: false,
        message: 'No active session found. Start a session with /start-session',
        error: new Error('No active session')
      };
    }

    // Load character file
    let characterPath = sessionState.character.filePath;

    // Handle both absolute and relative paths
    if (!path.isAbsolute(characterPath)) {
      characterPath = path.join(workspaceRoot, characterPath);
    }

    let characterData: any;
    try {
      const characterYaml = await fs.readFile(characterPath, 'utf-8');
      characterData = yaml.load(characterYaml);
    } catch (error) {
      return {
        success: false,
        message: `Failed to load character file: ${characterPath}`,
        error: error as Error
      };
    }

    // Step 3: Add XP to character
    const currentXP = characterData.experience || 0;
    const newXP = currentXP + amount;
    characterData.experience = newXP;

    // Step 4: Check for level-up eligibility
    const levelUpCalculator = new LevelUpCalculator();
    const eligibilityResult = await levelUpCalculator.canLevelUp(characterData);

    let levelUpNotice = '';
    let canLevelUp = false;

    if (eligibilityResult.success && eligibilityResult.data.canLevel) {
      canLevelUp = true;
      const nextLevel = eligibilityResult.data.nextLevel;
      levelUpNotice = `\n\n**LEVEL UP AVAILABLE!** ${characterData.name} can advance to level ${nextLevel}!\nUse "Kapi's RPG: Level Up" command to level up.`;
    } else if (eligibilityResult.success) {
      const xpNeeded = eligibilityResult.data.xpNeeded;
      const xpRemaining = xpNeeded - newXP;
      levelUpNotice = `\n\n**Progress:** ${xpRemaining} XP until level ${characterData.level + 1} (need ${xpNeeded} total)`;
    }

    // Step 5: Save updated character file
    const characterYaml = yaml.dump(characterData, {
      indent: 2,
      lineWidth: -1,
      sortKeys: false  // Preserve field order
    });

    await fs.writeFile(characterPath, characterYaml, 'utf-8');

    // Update session state
    await sessionManager.updateSession({
      lastActivity: new Date().toISOString()
    });

    // Step 6: Display XP award summary
    const elapsedTime = Date.now() - startTime;
    const elapsedMs = elapsedTime;
    const reasonText = reason || 'adventure reward';

    const completionMessage = `**XP Awarded!**\n\n` +
      `**Character:** ${characterData.name} (Level ${characterData.level} ${characterData.class})\n` +
      `**XP Gained:** +${amount} (${reasonText})\n` +
      `**Total XP:** ${currentXP} -> ${newXP}` +
      levelUpNotice +
      `\n\n**Performance:** ${elapsedMs}ms`;

    if (canLevelUp) {
      vscode.window.showInformationMessage(`+${amount} XP! ${characterData.name} can level up!`, 'Level Up').then(selection => {
        if (selection === 'Level Up') {
          vscode.commands.executeCommand('kapis-rpg-dm.levelUp');
        }
      });
    } else {
      vscode.window.showInformationMessage(`+${amount} XP awarded to ${characterData.name}!`);
    }

    const outputChannel = vscode.window.createOutputChannel('Kapi\'s RPG - XP');
    outputChannel.clear();
    outputChannel.appendLine(completionMessage);
    outputChannel.show();

    return {
      success: true,
      message: `Awarded ${amount} XP to ${characterData.name}`,
      data: {
        characterName: characterData.name,
        xpAwarded: amount,
        reason: reasonText,
        previousXP: currentXP,
        newXP: newXP,
        canLevelUp: canLevelUp,
        elapsedTime
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Unexpected error awarding XP: ${(error as Error).message}`,
      error: error as Error
    };
  }
}
