/**
 * Performance Tests for Session Management - Epic 5 Story 5.6
 *
 * Verifies session operations meet performance targets:
 * - Session startup: <2 seconds
 * - Session end: <30 seconds
 * - Auto-save (updateSession): <500ms
 *
 * Per AC-11: Performance tests with timing assertions
 */

const path = require('path');
const fs = require('fs').promises;
const os = require('os');

const SessionManager = require('../../../src/session/session-manager');
const SessionLogger = require('../../../src/session/session-logger');

describe('Session Performance', () => {
  let tempDir;
  let sessionManager;
  let sessionLogger;

  beforeAll(async () => {
    // Create a temp directory for testing
    tempDir = path.join(os.tmpdir(), `kapis-rpg-perf-test-${Date.now()}`);
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
  - potion
  - torch
  - rope
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

    sessionManager = new SessionManager({
      path: customPath,
      sessionDir: path.join(tempDir, 'game-data', 'session'),
      sessionLogger: sessionLogger,
      gitIntegration: null // Skip Git for performance tests
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

  describe('Session Startup Performance', () => {
    it('should start session in less than 2 seconds', async () => {
      const characterPath = path.join(tempDir, 'characters', 'test-hero.yaml');

      const startTime = process.hrtime.bigint();
      const result = await sessionManager.startSession(characterPath, 'test-location', 0);
      const endTime = process.hrtime.bigint();

      // Convert nanoseconds to milliseconds
      const durationMs = Number(endTime - startTime) / 1_000_000;

      expect(result.success).toBe(true);
      expect(durationMs).toBeLessThan(2000); // <2 seconds

      console.log(`Session startup time: ${durationMs.toFixed(2)}ms`);

      // Cleanup
      await sessionManager.endSession('Performance test cleanup');
    });

    it('should consistently start sessions within target time', async () => {
      const characterPath = path.join(tempDir, 'characters', 'test-hero.yaml');
      const iterations = 5;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = process.hrtime.bigint();
        const result = await sessionManager.startSession(characterPath, 'test-location', 0);
        const endTime = process.hrtime.bigint();

        expect(result.success).toBe(true);

        const durationMs = Number(endTime - startTime) / 1_000_000;
        times.push(durationMs);

        // Cleanup for next iteration
        await sessionManager.endSession('Iteration cleanup');
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(maxTime).toBeLessThan(2000); // All iterations <2 seconds
      console.log(`Session startup times: avg=${avgTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms`);
    });
  });

  describe('Session Update (Auto-Save) Performance', () => {
    it('should update session in less than 500ms', async () => {
      const characterPath = path.join(tempDir, 'characters', 'test-hero.yaml');

      // Start session first
      await sessionManager.startSession(characterPath, 'test-location', 0);

      // Measure update time
      const startTime = process.hrtime.bigint();
      const result = await sessionManager.updateSession({
        location: {
          currentLocationId: 'new-location',
          visitedThisSession: [
            { locationId: 'test-location', enteredAt: new Date().toISOString() },
            { locationId: 'new-location', enteredAt: new Date().toISOString() }
          ]
        },
        performance: {
          autoSaveCount: 1
        }
      });
      const endTime = process.hrtime.bigint();

      const durationMs = Number(endTime - startTime) / 1_000_000;

      expect(result.success).toBe(true);
      expect(durationMs).toBeLessThan(500); // <500ms

      console.log(`Session update (auto-save) time: ${durationMs.toFixed(2)}ms`);

      // Cleanup
      await sessionManager.endSession('Performance test cleanup');
    });

    it('should handle multiple rapid updates efficiently', async () => {
      const characterPath = path.join(tempDir, 'characters', 'test-hero.yaml');

      // Start session
      await sessionManager.startSession(characterPath, 'test-location', 0);

      const iterations = 10;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = process.hrtime.bigint();
        const result = await sessionManager.updateSession({
          performance: {
            autoSaveCount: i + 1
          }
        });
        const endTime = process.hrtime.bigint();

        expect(result.success).toBe(true);

        const durationMs = Number(endTime - startTime) / 1_000_000;
        times.push(durationMs);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(maxTime).toBeLessThan(500); // All iterations <500ms
      console.log(`Session update times: avg=${avgTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms`);

      // Cleanup
      await sessionManager.endSession('Performance test cleanup');
    });
  });

  describe('Session End Performance', () => {
    it('should end session in less than 30 seconds', async () => {
      const characterPath = path.join(tempDir, 'characters', 'test-hero.yaml');

      // Start session with data
      await sessionManager.startSession(characterPath, 'test-location', 0);

      // Add some session data
      await sessionManager.updateSession({
        npcs: {
          interactedWith: [
            { npcId: 'npc-1', timestamp: new Date().toISOString() },
            { npcId: 'npc-2', timestamp: new Date().toISOString() }
          ]
        },
        events: {
          triggeredThisSession: ['event-1', 'event-2', 'event-3']
        },
        performance: {
          startupTime: 1.5,
          contextLoadTimes: [0.5, 0.6, 0.7],
          avgLLMResponseTime: 2.0
        }
      });

      // Measure end time
      const startTime = process.hrtime.bigint();
      const result = await sessionManager.endSession('Performance test session');
      const endTime = process.hrtime.bigint();

      const durationMs = Number(endTime - startTime) / 1_000_000;

      expect(result.success).toBe(true);
      expect(durationMs).toBeLessThan(30000); // <30 seconds

      console.log(`Session end time: ${durationMs.toFixed(2)}ms`);
    });

    it('should generate session log efficiently', async () => {
      const characterPath = path.join(tempDir, 'characters', 'test-hero.yaml');

      // Start session with lots of data to stress test log generation
      await sessionManager.startSession(characterPath, 'test-location', 0);

      // Add extensive session data
      const npcs = [];
      for (let i = 0; i < 20; i++) {
        npcs.push({ npcId: `npc-${i}`, timestamp: new Date().toISOString() });
      }

      const events = [];
      for (let i = 0; i < 15; i++) {
        events.push(`event-${i}`);
      }

      const locations = [];
      for (let i = 0; i < 10; i++) {
        locations.push({ locationId: `location-${i}`, enteredAt: new Date().toISOString() });
      }

      await sessionManager.updateSession({
        location: {
          visitedThisSession: locations
        },
        npcs: {
          interactedWith: npcs
        },
        events: {
          triggeredThisSession: events
        },
        performance: {
          startupTime: 2.5,
          contextLoadTimes: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4],
          avgLLMResponseTime: 3.0,
          autoSaveCount: 5
        }
      });

      // Measure end time with extensive data
      const startTime = process.hrtime.bigint();
      const result = await sessionManager.endSession('Extensive performance test session');
      const endTime = process.hrtime.bigint();

      const durationMs = Number(endTime - startTime) / 1_000_000;

      expect(result.success).toBe(true);
      expect(durationMs).toBeLessThan(30000); // <30 seconds even with lots of data

      console.log(`Session end time (extensive data): ${durationMs.toFixed(2)}ms`);
    });
  });

  describe('Full Lifecycle Performance', () => {
    it('should complete full lifecycle within reasonable time', async () => {
      const characterPath = path.join(tempDir, 'characters', 'test-hero.yaml');
      const totalStartTime = process.hrtime.bigint();

      // Start
      const startResult = await sessionManager.startSession(characterPath, 'test-location', 0);
      expect(startResult.success).toBe(true);

      // Multiple updates
      for (let i = 0; i < 5; i++) {
        const updateResult = await sessionManager.updateSession({
          performance: { autoSaveCount: i + 1 }
        });
        expect(updateResult.success).toBe(true);
      }

      // End
      const endResult = await sessionManager.endSession('Full lifecycle test');
      expect(endResult.success).toBe(true);

      const totalEndTime = process.hrtime.bigint();
      const totalDurationMs = Number(totalEndTime - totalStartTime) / 1_000_000;

      // Total lifecycle should complete in reasonable time
      // (startup < 2s) + (5 updates < 2.5s) + (end < 30s) = <35s max theoretical
      expect(totalDurationMs).toBeLessThan(35000);

      console.log(`Full lifecycle time: ${totalDurationMs.toFixed(2)}ms`);
    });
  });
});
