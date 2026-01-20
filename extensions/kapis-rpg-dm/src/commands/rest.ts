import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { CommandResult } from './registry';

// Import Epic systems
const CalendarManager = require('../../../../src/calendar/calendar-manager');
const EventScheduler = require('../../../../src/calendar/event-scheduler');
const SessionManager = require('../../../../src/session/session-manager');

/**
 * /rest [short|long] - Take a rest to recover HP and spell slots
 *
 * D&D 5e RAW Rest Mechanics:
 * - Short Rest (1 hour): Spend hit dice to recover HP, no spell slot recovery
 * - Long Rest (8 hours): Recover all HP, recover half max hit dice, recover all spell slots, reset death saves
 * - Interrupted rest: No benefits granted
 *
 * Workflow:
 * 1. Validate rest type ("short" or "long")
 * 2. Load current session state and character file
 * 3. Advance calendar by rest duration (CalendarManager)
 * 4. Check for interrupting events (EventScheduler)
 * 5. If interrupted: display message, abort rest, no benefits
 * 6. If completed: apply rest mechanics (HP recovery, spell slot recovery)
 * 7. Update character sheet file with recovered values
 * 8. Display rest completion summary
 *
 * Performance target: <5 seconds (uninterrupted), <20 seconds (interrupted)
 */
export async function rest(
  context: vscode.ExtensionContext,
  restType: string
): Promise<CommandResult> {
  const startTime = Date.now();

  try {
    const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;

    // Step 1: Validate rest type
    if (restType !== 'short' && restType !== 'long') {
      return {
        success: false,
        message: `Invalid rest type: "${restType}". Must be "short" or "long".`,
        error: new Error('Invalid rest type')
      };
    }

    const restDuration = restType === 'short' ? 1 : 8; // hours

    // Step 2: Load current session state via SessionManager
    const sessionManager = new SessionManager();
    const sessionState = await sessionManager.getCurrentSession();

    if (!sessionState) {
      return {
        success: false,
        message: 'No active session found. Start a session with /start-session',
        error: new Error('No active session')
      };
    }

    // Load character file
    const characterPath = sessionState.character.filePath;

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

    // Step 3: Advance calendar (Epic 2 integration)
    const calendarPath = path.join(workspaceRoot, 'game-data', 'calendar.yaml');
    const calendarManager = new CalendarManager({ calendarPath });

    const advanceResult = await calendarManager.advanceTime(restDuration);
    if (!advanceResult.success) {
      return {
        success: false,
        message: `Failed to advance calendar: ${advanceResult.error}`,
        error: new Error(advanceResult.error)
      };
    }

    // Step 4: Check for interrupting events (Epic 2 integration)
    const eventScheduler = new EventScheduler({
      calendarPath,
      eventsDir: path.join(workspaceRoot, 'game-data', 'locations')
    });

    const triggerResult = await eventScheduler.checkTriggers();

    if (triggerResult.success && triggerResult.data.triggeredEvents?.length > 0) {
      // Step 5: Rest interrupted - no benefits
      const interruptingEvent = triggerResult.data.triggeredEvents[0];

      const interruptionMessage = `**Rest Interrupted!**\n\n` +
        `You began a ${restType} rest, but ${restDuration} hour(s) into it, you were interrupted by:\n\n` +
        `**${interruptingEvent.name}**\n\n` +
        `Your rest was aborted and you gained no benefits.\n\n` +
        `(Event execution not yet fully implemented - this would trigger the event)`;

      vscode.window.showWarningMessage(`Rest interrupted by: ${interruptingEvent.name}`);

      const outputChannel = vscode.window.createOutputChannel('Kapi\'s RPG - Rest');
      outputChannel.clear();
      outputChannel.appendLine(interruptionMessage);
      outputChannel.show();

      return {
        success: true, // Command succeeded, but rest was interrupted
        message: 'Rest interrupted by event',
        data: {
          restType,
          interrupted: true,
          interruptingEvent: interruptingEvent.name,
          benefitsGained: false
        }
      };
    }

    // Step 6: Rest completed - apply D&D 5e rest mechanics
    const currentHP = characterData.hp?.current || characterData.hp;
    const maxHP = characterData.hp?.max || characterData.hp;
    const currentLevel = characterData.level || 1;
    const hitDice = characterData.hit_dice || { current: currentLevel, max: currentLevel };

    let hpRecovered = 0;
    let spellSlotsRecovered = false;
    let hitDiceRecovered = 0;

    if (restType === 'short') {
      // Short rest: Spend hit dice to recover HP
      // For simplicity, assume player spends all available hit dice
      // In full implementation, this would be player choice

      const diceToSpend = Math.min(hitDice.current, Math.floor((maxHP - currentHP) / 5)); // Rough estimate

      if (diceToSpend > 0) {
        // Assuming d8 hit dice for simplicity (should be based on class)
        // Formula: 1d8 + CON modifier per hit die
        const constitutionMod = Math.floor((characterData.abilities?.constitution || 10) - 10) / 2;

        for (let i = 0; i < diceToSpend; i++) {
          const roll = Math.floor(Math.random() * 8) + 1; // 1d8
          hpRecovered += roll + constitutionMod;
        }

        characterData.hp.current = Math.min(currentHP + hpRecovered, maxHP);
        characterData.hit_dice.current -= diceToSpend;
      }

    } else {
      // Long rest: Recover all HP, half max hit dice, all spell slots, reset death saves
      hpRecovered = maxHP - currentHP;
      characterData.hp.current = maxHP;

      // Recover half max hit dice (rounded down)
      hitDiceRecovered = Math.floor(hitDice.max / 2);
      characterData.hit_dice.current = Math.min(
        (hitDice.current || 0) + hitDiceRecovered,
        hitDice.max
      );

      // Recover all spell slots
      if (characterData.spell_slots) {
        for (const level in characterData.spell_slots) {
          if (characterData.spell_slots[level].max !== undefined) {
            characterData.spell_slots[level].current = characterData.spell_slots[level].max;
          }
        }
        spellSlotsRecovered = true;
      }

      // Reset death saves
      if (characterData.death_saves) {
        characterData.death_saves.successes = 0;
        characterData.death_saves.failures = 0;
      }
    }

    // Step 7: Update character sheet file
    const characterYaml = yaml.dump(characterData, {
      indent: 2,
      lineWidth: -1,
      sortKeys: true
    });

    await fs.writeFile(characterPath, characterYaml, 'utf-8');

    // Update session state via SessionManager
    const currentTimePassed = sessionState.calendar.timePassed || '0 hours';
    const hours = parseInt(currentTimePassed) + restDuration;

    const updateResult = await sessionManager.updateSession({
      calendar: {
        ...sessionState.calendar,
        timePassed: `${hours} hours`,
        currentDate: advanceResult.data.current.date,
        currentTime: advanceResult.data.current.time
      }
    });

    if (!updateResult.success) {
      vscode.window.showWarningMessage(`Session update failed: ${updateResult.error}`);
    }

    // Step 8: Display rest completion
    const elapsedTime = Date.now() - startTime;
    const elapsedSeconds = (elapsedTime / 1000).toFixed(1);

    const completionMessage = `**${restType === 'short' ? 'Short' : 'Long'} Rest Completed!**\n\n` +
      `**Duration:** ${restDuration} hour(s)\n` +
      `**HP Recovered:** +${hpRecovered} (now ${characterData.hp.current}/${maxHP})\n` +
      `**Hit Dice:** ${characterData.hit_dice.current}/${hitDice.max} available` +
      (hitDiceRecovered > 0 ? ` (+${hitDiceRecovered} recovered)` : '') + `\n` +
      `**Spell Slots:** ${spellSlotsRecovered ? 'All recovered' : 'Not recovered (short rest)'}\n` +
      `**Death Saves:** ${restType === 'long' ? 'Reset to 0/0' : 'Unchanged'}\n` +
      `**Interrupted:** No\n\n` +
      `**Performance:** ${elapsedSeconds}s (target: <5s)\n\n` +
      `You feel refreshed and ready to continue your adventure.`;

    vscode.window.showInformationMessage(`${restType === 'short' ? 'Short' : 'Long'} rest completed!`);

    const outputChannel = vscode.window.createOutputChannel('Kapi\'s RPG - Rest');
    outputChannel.clear();
    outputChannel.appendLine(completionMessage);
    outputChannel.show();

    return {
      success: true,
      message: `${restType} rest completed`,
      data: {
        restType,
        interrupted: false,
        hpRecovered,
        currentHP: characterData.hp.current,
        maxHP,
        spellSlotsRecovered,
        hitDiceRecovered,
        elapsedTime
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Unexpected error during rest: ${(error as Error).message}`,
      error: error as Error
    };
  }
}
