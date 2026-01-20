/**
 * Integration Tests for Session Lifecycle - Epic 5 Story 5.6
 *
 * Tests full session lifecycle: start → update → auto-save → end
 * Uses real file system with temp directory for isolation.
 *
 * Per AC-11: Full session lifecycle (start → update → auto-save → end → commit)
 */

const path = require('path');
const fs = require('fs').promises;
const os = require('os');

const SessionManager = require('../../../src/session/session-manager');
const SessionLogger = require('../../../src/session/session-logger');
const GitIntegration = require('../../../src/session/git-integration');

describe('Session Lifecycle Integration', () => {
  let tempDir;
  let sessionManager;
  let sessionLogger;
  let gitIntegration;

  beforeAll(async () => {
    // Create a temp directory for testing
    tempDir = path.join(os.tmpdir(), `kapis-rpg-session-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Create necessary subdirectories
    await fs.mkdir(path.join(tempDir, 'game-data', 'session', 'logs'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'game-data', 'locations', 'test-location'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'characters'), { recursive: true });

    // Create a test character file
    const characterContent = `name: Test Hero
level: 5
class: Fighter
experience: 6500
inventory:
  - sword
  - shield
`;
    await fs.writeFile(path.join(tempDir, 'characters', 'test-hero.yaml'), characterContent);

    // Create a test location
    const locationMetadata = `location_name: Test Location
parent_location: null
`;
    await fs.writeFile(
      path.join(tempDir, 'game-data', 'locations', 'test-location', 'metadata.yaml'),
      locationMetadata
    );
  });

  afterAll(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    // Create instances with real file system but custom paths
    const customPath = {
      join: (...args) => {
        // Replace game-data with temp directory paths
        const result = path.join(...args);
        if (result.startsWith('game-data')) {
          return path.join(tempDir, result);
        }
        if (result.startsWith('characters')) {
          return path.join(tempDir, result);
        }
        return result;
      }
    };

    sessionLogger = new SessionLogger({
      path: customPath
    });

    gitIntegration = new GitIntegration({
      projectRoot: tempDir
    });

    sessionManager = new SessionManager({
      path: customPath,
      sessionDir: path.join(tempDir, 'game-data', 'session'),
      sessionLogger: sessionLogger,
      gitIntegration: null // Skip Git for lifecycle tests
    });
  });

  afterEach(async () => {
    // Stop auto-save timer
    if (sessionManager) {
      sessionManager.stopAutoSave();
    }

    // Clean up session files
    try {
      await fs.unlink(path.join(tempDir, 'game-data', 'session', 'current-session.yaml'));
    } catch (error) {
      // File might not exist
    }
  });

  describe('Full Session Lifecycle', () => {
    it('should complete start → update → end lifecycle', async () => {
      // 1. Start session
      const characterPath = path.join(tempDir, 'characters', 'test-hero.yaml');
      const locationId = 'test-location';

      const startResult = await sessionManager.startSession(characterPath, locationId, 0);

      expect(startResult.success).toBe(true);
      expect(startResult.sessionId).toBeDefined();
      expect(startResult.data.character.initialLevel).toBe(5);
      expect(startResult.data.location.currentLocationId).toBe(locationId);

      // Verify session file created
      const sessionFilePath = path.join(tempDir, 'game-data', 'session', 'current-session.yaml');
      const sessionExists = await fs.access(sessionFilePath).then(() => true).catch(() => false);
      expect(sessionExists).toBe(true);

      // 2. Update session
      const updateResult = await sessionManager.updateSession({
        location: {
          currentLocationId: 'new-location',
          visitedThisSession: [
            { locationId: 'test-location', enteredAt: new Date().toISOString() },
            { locationId: 'new-location', enteredAt: new Date().toISOString() }
          ]
        },
        npcs: {
          interactedWith: [
            { npcId: 'test-npc', timestamp: new Date().toISOString() }
          ]
        }
      });

      expect(updateResult.success).toBe(true);

      // Verify update persisted
      const updatedSession = await sessionManager.getCurrentSession();
      expect(updatedSession.location.currentLocationId).toBe('new-location');
      expect(updatedSession.npcs.interactedWith.length).toBe(1);

      // 3. End session
      const endResult = await sessionManager.endSession('Test session completed');

      expect(endResult.success).toBe(true);
      expect(endResult.sessionSummary).toContain('Test session completed');
      expect(endResult.logPath).toContain('session-');

      // Verify session file deleted
      const sessionDeleted = await fs.access(sessionFilePath).then(() => false).catch(() => true);
      expect(sessionDeleted).toBe(true);

      // Verify session log created
      const logExists = await fs.access(endResult.logPath).then(() => true).catch(() => false);
      expect(logExists).toBe(true);

      // Verify session history updated
      const historyPath = path.join(tempDir, 'game-data', 'session', 'session-history.yaml');
      const historyExists = await fs.access(historyPath).then(() => true).catch(() => false);
      expect(historyExists).toBe(true);
    });

    it('should prevent starting a second session while one is active', async () => {
      const characterPath = path.join(tempDir, 'characters', 'test-hero.yaml');

      // Start first session
      const firstResult = await sessionManager.startSession(characterPath, 'test-location', 0);
      expect(firstResult.success).toBe(true);

      // Try to start second session
      const secondResult = await sessionManager.startSession(characterPath, 'test-location', 0);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toContain('already active');

      // Clean up
      await sessionManager.endSession('Cleanup');
    });

    it('should return null when no session is active', async () => {
      const session = await sessionManager.getCurrentSession();
      expect(session).toBeNull();
    });

    it('should fail endSession when no session exists', async () => {
      const result = await sessionManager.endSession('Test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('No active session');
    });

    it('should fail updateSession when no session exists', async () => {
      const result = await sessionManager.updateSession({ test: 'value' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('No active session');
    });
  });

  describe('Session State Deep Merge', () => {
    it('should preserve nested objects during update', async () => {
      const characterPath = path.join(tempDir, 'characters', 'test-hero.yaml');

      // Start session
      await sessionManager.startSession(characterPath, 'test-location', 0);

      // Update with partial nested object
      await sessionManager.updateSession({
        calendar: {
          timePassed: '2 hours'
        }
      });

      const session = await sessionManager.getCurrentSession();

      // Original calendar fields should be preserved
      expect(session.calendar.sessionStartDate).toBeDefined();
      // Updated field should be present
      expect(session.calendar.timePassed).toBe('2 hours');

      // Clean up
      await sessionManager.endSession('Cleanup');
    });
  });

  describe('Session Logger Integration', () => {
    it('should generate markdown log with all sections', async () => {
      const characterPath = path.join(tempDir, 'characters', 'test-hero.yaml');

      // Start and update session with data
      await sessionManager.startSession(characterPath, 'test-location', 0);

      await sessionManager.updateSession({
        npcs: {
          interactedWith: [
            { npcId: 'test-npc-1', timestamp: new Date().toISOString() },
            { npcId: 'test-npc-2', timestamp: new Date().toISOString() }
          ]
        },
        events: {
          triggeredThisSession: ['event-1', 'event-2']
        },
        performance: {
          startupTime: 1.5,
          contextLoadTimes: [0.5, 0.6],
          avgLLMResponseTime: 2.0,
          autoSaveCount: 1
        }
      });

      // End session
      const result = await sessionManager.endSession('Explored the test location');

      expect(result.success).toBe(true);
      expect(result.sessionSummary).toContain('# Session Log');
      expect(result.sessionSummary).toContain('## Summary');
      expect(result.sessionSummary).toContain('Explored the test location');
      expect(result.sessionSummary).toContain('## Locations Visited');
      expect(result.sessionSummary).toContain('## NPCs Interacted With');
      expect(result.sessionSummary).toContain('## Events Triggered');
      expect(result.sessionSummary).toContain('## Performance Metrics');
    });
  });
});
