# Session Management Guide

**Epic 5 Story 5-6**: Session Management & Logging System

This guide explains how Kapi's RPG tracks game sessions, generates session logs, and integrates with Git for save points.

---

## Table of Contents

1. [Overview](#overview)
2. [Starting a Session](#starting-a-session)
3. [During a Session](#during-a-session)
4. [Ending a Session](#ending-a-session)
5. [Save Points](#save-points)
6. [Session Logs](#session-logs)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The Session Management System tracks your gameplay from start to finish, recording:

- **Locations visited** with timestamps
- **NPCs interacted with** and interaction counts
- **Events triggered** during the session
- **XP and loot gained** by comparing character files
- **Calendar progression** (in-game time passed)
- **Performance metrics** (load times, response times)

All session data is stored in `game-data/session/` as human-readable YAML files.

---

## Starting a Session

### Using /start-session Command

```bash
/start-session <character> <location>
```

**Example:**
```bash
/start-session kapi village-of-barovia
```

**What Happens:**
1. Validates character file exists (`characters/kapi.yaml`)
2. Validates starting location exists
3. Creates `game-data/session/current-session.yaml` with session state
4. Loads initial context (character, location, calendar)
5. Starts auto-save timer (default: every 5 minutes)
6. Displays initial narration

**Session State Includes:**
- Session ID (format: `YYYY-MM-DD-N`)
- Character snapshot (name, level, XP)
- Starting location
- Calendar snapshot (date, time, moon phase, weather)
- Empty tracking arrays (locations, NPCs, events)

### Auto-Save Configuration

Auto-save runs periodically in the background to prevent data loss.

**Configure interval in VS Code settings:**
- Open Settings (Ctrl+,)
- Search for `kapis-rpg.autoSaveInterval`
- Set interval in seconds (default: 300 = 5 minutes)
- Set to 0 to disable auto-save

---

## During a Session

### Session Updates

The session state automatically updates when you:

**Travel to a new location** (`/travel <location>`):
- Updates `location.currentLocationId`
- Adds location to `location.visitedThisSession` with timestamp
- Updates `calendar.timePassed` based on travel time

**Take a rest** (`/rest [short|long]`):
- Updates `calendar.timePassed` based on rest duration
- Updates `calendar.currentDate` and `calendar.currentTime`

**Interact with NPCs** (via narration):
- Adds NPC to `npcs.interactedWith` with interaction count

**Trigger events** (automatic):
- Adds event to `events.triggeredThisSession` with timestamp

### Viewing Current Session

The current session is always available at:
```
game-data/session/current-session.yaml
```

You can inspect this file at any time to see your session state.

---

## Ending a Session

### Using /end-session Command

```bash
/end-session [summary]
```

**Example:**
```bash
/end-session "Explored Village of Barovia and Death House"
```

**What Happens:**
1. Generates session log markdown (see [Session Logs](#session-logs))
2. Saves log to `game-data/session/logs/YYYY-MM-DD-session-N.md`
3. Creates Git commit with formatted message
4. Updates `game-data/session/session-history.yaml`
5. Deletes `current-session.yaml`
6. Stops auto-save timer
7. Clears context cache

**Git Commit Format:**
```
[SESSION] YYYY-MM-DD | {Location} | {Summary}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Example:**
```
[SESSION] 2025-11-23 | village-of-barovia | Explored Village of Barovia and Death House

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Session Summary Tips

Provide a brief summary when ending your session:

✅ **Good summaries:**
- "Reached Vallaki and met Baron Vallakovich"
- "Defeated vampire spawn in Death House catacombs"
- "Escorted Ireena to Vallaki safely"

❌ **Avoid:**
- Empty summaries (no context for future reference)
- Too verbose (commit messages should be concise)

---

## Save Points

### Creating Save Points

Use the `/save` command to create a named Git tag save point:

```bash
/save <save-name>
```

**Example:**
```bash
/save pre-strahd-confrontation
```

**What Happens:**
1. Creates annotated Git tag: `save/pre-strahd-confrontation`
2. Tag message includes: current location, character level, date/time
3. Tag points to current commit (all session progress saved)

**Save Point Naming:**
- Use descriptive names: `pre-castle-ravenloft`, `before-tarokka-reading`
- Names are sanitized (lowercase, alphanumeric + hyphens/underscores only)
- Example: `"Before Strahd!"` → `save/before-strahd-`

### Loading Save Points

Use the `/load-save` command to restore a previous save:

```bash
/load-save
```

**What Happens:**
1. Displays list of all save points with dates and descriptions
2. Select save point from Quick Pick menu
3. Confirms rollback (destructive operation!)
4. Checks out Git tag (`git checkout save/{name}`)
5. Restores all game files to that save point

**⚠️ Warning:** Loading a save point is **destructive**. Any progress after that save point will be lost unless committed to a branch.

---

## Session Logs

### Log Format

Session logs are saved as Markdown files in `game-data/session/logs/`:

```
game-data/session/logs/2025-11-23-session-1.md
```

**Log Sections:**

1. **Header**
   - Session ID, date, duration
   - Character name and level

2. **Player Summary**
   - Your provided summary text

3. **Locations Visited**
   - Table with location names and entry timestamps

4. **NPCs Interacted With**
   - Table with NPC names and interaction counts

5. **Events Triggered**
   - List of triggered events with timestamps

6. **Loot & XP**
   - Items acquired during session
   - XP gained (calculated from character file diff)

7. **Calendar**
   - In-game time passed
   - Start and end dates/times

8. **Performance**
   - Session startup time
   - Average context load times
   - Average LLM response times

### Example Log

```markdown
# Session Log: 2025-11-23-1

**Date:** 2025-11-23
**Duration:** 2h 15m
**Character:** Kapi (Level 3)
**Starting Location:** village-of-barovia

## Player Summary

Explored the Village of Barovia and investigated Death House. Met Ireena Kolyana and learned about the death of her father, Burgomaster Kolyan Indirovich.

## Locations Visited

| Location | Entered At |
|----------|------------|
| village-of-barovia | 2025-11-23T10:00:00Z |
| death-house | 2025-11-23T11:30:00Z |

## NPCs Interacted With

| NPC | Interactions |
|-----|--------------|
| ireena-kolyana | 3 |
| ismark-kolyanovich | 2 |

## Events Triggered

- **death-of-burgomaster** (2025-11-23T10:15:00Z)

## Loot & XP

**Items Acquired:**
- silver_dagger
- holy_water

**XP Gained:** 300 (Level 3 → 3, 900 XP → 1200 XP)

## Calendar

**In-Game Time Passed:** 6 hours
**Start:** 735-10-1, 08:00
**End:** 735-10-1, 14:00

## Performance

**Startup Time:** 2.5s
**Avg Context Load Time:** 1.0s
**Avg LLM Response Time:** 1.5s
```

---

## Troubleshooting

### "A session is already active"

**Problem:** You tried to start a session while one is already running.

**Solution:**
1. End the current session: `/end-session`
2. Or delete `game-data/session/current-session.yaml` manually

### "No active session found"

**Problem:** You tried to use a command that requires an active session.

**Solution:**
- Start a session: `/start-session <character> <location>`

### "Permission denied writing session file"

**Problem:** The session directory or file has incorrect permissions.

**Solution:**
1. Check file permissions on `game-data/session/`
2. Ensure the directory is writable
3. On Windows: remove read-only attribute
4. On Unix: `chmod -R u+w game-data/session/`

### "Corrupted session file detected"

**Problem:** The `current-session.yaml` file contains invalid YAML.

**Solution:**
1. Delete `game-data/session/current-session.yaml`
2. Start a new session
3. If you need to recover session data, restore from Git history

### "Git commit failed"

**Problem:** Git is not installed or the project is not a Git repository.

**Solution:**
1. Install Git: https://git-scm.com/downloads
2. Initialize Git repo: `git init`
3. Configure Git user:
   ```bash
   git config user.name "Your Name"
   git config user.email "you@example.com"
   ```
4. Session will still end successfully, but won't create a commit

### Auto-Save Not Working

**Problem:** Session state isn't being saved periodically.

**Solution:**
1. Check VS Code settings: `kapis-rpg.autoSaveInterval`
2. Ensure interval > 0 (0 = disabled)
3. Default is 300 seconds (5 minutes)
4. Check VS Code Output panel for errors

---

## Advanced Topics

### Session State Schema

The `current-session.yaml` file structure:

```yaml
sessionId: "2025-11-23-1"
startTime: "2025-11-23T10:00:00.000Z"
lastActivity: "2025-11-23T12:00:00.000Z"

character:
  filePath: "characters/kapi.yaml"
  initialLevel: 3
  initialXP: 900
  snapshotHash: "abc123..."

location:
  currentLocationId: "village-of-barovia"
  visitedThisSession:
    - locationId: "village-of-barovia"
      enteredAt: "2025-11-23T10:00:00Z"

npcs:
  activeNPCs: []
  interactedWith:
    - npcId: "ireena-kolyana"
      interactionCount: 3

context:
  lastLoadedAt: "2025-11-23T10:00:00.000Z"
  tokensUsed: 3500
  cacheKeys: ["char-kapi", "loc-village-of-barovia"]

calendar:
  sessionStartDate: "735-10-1"
  sessionStartTime: "08:00"
  currentDate: "735-10-1"
  currentTime: "14:00"
  timePassed: "6 hours"

events:
  triggeredThisSession:
    - eventId: "death-of-burgomaster"
      timestamp: "2025-11-23T10:15:00Z"
  pendingEvents: []

performance:
  startupTime: 2.5
  contextLoadTimes: [1.2, 0.8]
  avgLLMResponseTime: 1.5
  autoSaveCount: 12
```

### Manual Session Recovery

If session management breaks, you can manually recover:

**Restore from Git:**
```bash
git log --grep="\[SESSION\]" -10  # Find recent session commits
git checkout <commit-hash>         # Restore to that commit
```

**Inspect session history:**
```bash
cat game-data/session/session-history.yaml
```

**Delete corrupted session:**
```bash
rm game-data/session/current-session.yaml
```

---

## Related Documentation

- [Slash Commands Guide](slash-commands-guide.md) - All available commands
- [Extension Development](extension-development.md) - Technical implementation
- [Context Loading Design](context-loading-design.md) - How context is loaded
- [Git Workflow](../CLAUDE.md#git-workflow) - Save/load via Git

---

**Last Updated:** 2025-11-23
**Story:** Epic 5 Story 5-6 (Session Management & Logging System)
**Version:** 1.0
