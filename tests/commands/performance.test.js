/**
 * Test Suite 7: Performance
 *
 * Performance benchmarks for slash commands:
 * - /start-session: <2 minutes (95th percentile)
 * - /travel: <10 seconds (no encounters), <30 seconds (with encounters)
 * - /rest: <5 seconds (uninterrupted), <20 seconds (interrupted)
 * - /end-session: <30 seconds
 * - /context commands: <5 seconds
 */

const fs = require('fs/promises');
const yaml = require('js-yaml');
const { startSession } = require('../../extensions/kapis-rpg-dm/src/commands/start-session');
const { endSession } = require('../../extensions/kapis-rpg-dm/src/commands/end-session');
const { travel } = require('../../extensions/kapis-rpg-dm/src/commands/travel');
const { rest } = require('../../extensions/kapis-rpg-dm/src/commands/rest');
const { contextShow } = require('../../extensions/kapis-rpg-dm/src/commands/context-show');
const { contextReload } = require('../../extensions/kapis-rpg-dm/src/commands/context-reload');
const { contextReduce } = require('../../extensions/kapis-rpg-dm/src/commands/context-reduce');

// Mock VS Code API
jest.mock('vscode', () => ({
  window: {
    showInformationMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    createOutputChannel: jest.fn(() => ({
      clear: jest.fn(),
      appendLine: jest.fn(),
      show: jest.fn()
    }))
  },
  workspace: {
    workspaceFolders: [{
      uri: { fsPath: '/mock/workspace' }
    }]
  }
}));

describe('Performance Benchmarks', () => {
  let mockContext;

  beforeEach(() => {
    mockContext = { subscriptions: [] };
    jest.clearAllMocks();
  });

  describe('/start-session Performance', () => {
    test('should complete in under 2 minutes', async () => {
      const validCharacter = {
        name: 'Kapi',
        level: 3,
        class: 'Warlock',
        hp: { current: 20, max: 24 }
      };

      const mockContextLoader = {
        loadContext: jest.fn().mockResolvedValue({
          success: true,
          data: {
            location: { name: 'Village of Barovia' },
            calendar: { currentDate: '735-10-1', currentTime: '08:00' },
            npcs: [],
            events: [],
            metadata: { tokenCount: 1200 }
          }
        })
      };

      const mockTemplateEngine = {
        renderTemplate: jest.fn().mockResolvedValue({
          success: true,
          data: {
            prompt: 'You arrive in the Village of Barovia...',
            tokenCount: 150
          }
        })
      };

      jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(validCharacter));
      jest.spyOn(fs, 'access').mockResolvedValue(undefined);
      jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      jest.mock('../../../src/context/context-loader', () => mockContextLoader);
      jest.mock('../../../src/prompts', () => ({ PromptTemplateEngine: mockTemplateEngine }));

      const startTime = Date.now();
      const result = await startSession(mockContext, 'village-of-barovia', 'kapi');
      const elapsedTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(elapsedTime).toBeLessThan(120000); // 2 minutes = 120,000ms
    }, 125000); // Test timeout: 125 seconds

    test('should return elapsed time in result data', async () => {
      const validCharacter = {
        name: 'Kapi',
        level: 3,
        class: 'Warlock',
        hp: { current: 20, max: 24 }
      };

      jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(validCharacter));
      jest.spyOn(fs, 'access').mockResolvedValue(undefined);
      jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      const result = await startSession(mockContext, 'village-of-barovia', 'kapi');

      expect(result.data.elapsedTime).toBeDefined();
      expect(typeof result.data.elapsedTime).toBe('number');
    }, 125000);
  });

  describe('/travel Performance', () => {
    test('should complete in under 10 seconds (no encounters)', async () => {
      const sessionState = {
        location: {
          currentLocationId: 'village-of-barovia',
          visitedThisSession: ['village-of-barovia']
        },
        character: { filePath: '/mock/characters/kapi.yaml', name: 'Kapi' },
        calendar: { timePassed: '0 hours' }
      };

      const locationMetadata = {
        connections: ['death-house']
      };

      const mockEventScheduler = {
        checkTriggers: jest.fn().mockResolvedValue({
          success: true,
          data: { triggeredEvents: [] } // No encounters
        })
      };

      jest.spyOn(fs, 'readFile')
        .mockResolvedValueOnce(yaml.dump(sessionState))
        .mockResolvedValueOnce(yaml.dump(locationMetadata));
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      jest.mock('../../../src/calendar/event-scheduler', () => mockEventScheduler);

      const startTime = Date.now();
      const result = await travel(mockContext, 'death-house');
      const elapsedTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.data.encounterOccurred).toBe(false);
      expect(elapsedTime).toBeLessThan(10000); // 10 seconds
    }, 15000);

    test('should complete in under 30 seconds (with encounters)', async () => {
      const sessionState = {
        location: {
          currentLocationId: 'village-of-barovia',
          visitedThisSession: ['village-of-barovia']
        },
        character: { filePath: '/mock/characters/kapi.yaml', name: 'Kapi' },
        calendar: { timePassed: '0 hours' }
      };

      const locationMetadata = {
        connections: ['death-house']
      };

      const mockEventScheduler = {
        checkTriggers: jest.fn().mockResolvedValue({
          success: true,
          data: {
            triggeredEvents: [
              { name: 'Wolf Ambush', eventId: 'random_encounter_wolves' }
            ]
          }
        })
      };

      jest.spyOn(fs, 'readFile')
        .mockResolvedValueOnce(yaml.dump(sessionState))
        .mockResolvedValueOnce(yaml.dump(locationMetadata));
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      jest.mock('../../../src/calendar/event-scheduler', () => mockEventScheduler);

      const startTime = Date.now();
      const result = await travel(mockContext, 'death-house');
      const elapsedTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.data.encounterOccurred).toBe(true);
      expect(elapsedTime).toBeLessThan(30000); // 30 seconds
    }, 35000);
  });

  describe('/rest Performance', () => {
    test('should complete in under 5 seconds (uninterrupted)', async () => {
      const sessionState = {
        character: { filePath: '/mock/characters/kapi.yaml' },
        calendar: { timePassed: '0 hours' }
      };

      const characterData = {
        name: 'Kapi',
        level: 3,
        hp: { current: 10, max: 24 },
        hit_dice: { current: 2, max: 3 },
        spell_slots: {}
      };

      const mockEventScheduler = {
        checkTriggers: jest.fn().mockResolvedValue({
          success: true,
          data: { triggeredEvents: [] } // No interruptions
        })
      };

      jest.spyOn(fs, 'readFile')
        .mockResolvedValueOnce(yaml.dump(sessionState))
        .mockResolvedValueOnce(yaml.dump(characterData));
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      jest.mock('../../../src/calendar/event-scheduler', () => mockEventScheduler);

      const startTime = Date.now();
      const result = await rest(mockContext, 'long');
      const elapsedTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.data.interrupted).toBe(false);
      expect(elapsedTime).toBeLessThan(5000); // 5 seconds
    }, 10000);

    test('should complete in under 20 seconds (interrupted)', async () => {
      const sessionState = {
        character: { filePath: '/mock/characters/kapi.yaml' },
        calendar: { timePassed: '0 hours' }
      };

      const characterData = {
        name: 'Kapi',
        level: 3,
        hp: { current: 10, max: 24 },
        hit_dice: { current: 2, max: 3 }
      };

      const mockEventScheduler = {
        checkTriggers: jest.fn().mockResolvedValue({
          success: true,
          data: {
            triggeredEvents: [
              { name: 'Night Attack', eventId: 'vampire_spawn_ambush' }
            ]
          }
        })
      };

      jest.spyOn(fs, 'readFile')
        .mockResolvedValueOnce(yaml.dump(sessionState))
        .mockResolvedValueOnce(yaml.dump(characterData));

      jest.mock('../../../src/calendar/event-scheduler', () => mockEventScheduler);

      const startTime = Date.now();
      const result = await rest(mockContext, 'long');
      const elapsedTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.data.interrupted).toBe(true);
      expect(elapsedTime).toBeLessThan(20000); // 20 seconds
    }, 25000);
  });

  describe('/end-session Performance', () => {
    test('should complete in under 30 seconds', async () => {
      const sessionState = {
        sessionId: 'session-123',
        startTime: new Date().toISOString(),
        character: { name: 'Kapi', level: 3, class: 'Warlock' },
        location: {
          currentLocationId: 'village-of-barovia',
          visitedThisSession: ['village-of-barovia']
        },
        npcs: { activeNPCs: [], interactedWith: [] }
      };

      jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(sessionState));
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      jest.spyOn(fs, 'readdir').mockResolvedValue([]);
      jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);

      const startTime = Date.now();
      const result = await endSession(mockContext);
      const elapsedTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(elapsedTime).toBeLessThan(30000); // 30 seconds
    }, 35000);
  });

  describe('/context Commands Performance', () => {
    test('/context show should complete in under 1 second', async () => {
      const sessionState = {
        context: { tokensUsed: 2000, lastLoadedAt: '2025-01-01T10:00:00Z', cacheKeys: [] },
        location: { currentLocationId: 'village-of-barovia' },
        character: { filePath: '/mock/characters/kapi.yaml', name: 'Kapi', level: 3 }
      };

      jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(sessionState));

      const startTime = Date.now();
      const result = await contextShow(mockContext);
      const elapsedTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(elapsedTime).toBeLessThan(1000); // 1 second
    }, 5000);

    test('/context reload should complete in under 5 seconds', async () => {
      const sessionState = {
        context: { tokensUsed: 2000, lastLoadedAt: '2025-01-01T10:00:00Z', cacheKeys: [] },
        location: { currentLocationId: 'village-of-barovia' },
        character: { filePath: '/mock/characters/kapi.yaml', name: 'Kapi', level: 3 }
      };

      const mockContextLoader = {
        loadContext: jest.fn().mockResolvedValue({
          success: true,
          data: {
            npcs: [],
            events: [],
            metadata: { tokenCount: 1800 }
          }
        })
      };

      jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(sessionState));
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      jest.mock('../../../src/context/context-loader', () => mockContextLoader);

      const startTime = Date.now();
      const result = await contextReload(mockContext);
      const elapsedTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(elapsedTime).toBeLessThan(5000); // 5 seconds
    }, 10000);

    test('/context reduce should complete in under 3 seconds', async () => {
      const sessionState = {
        context: { tokensUsed: 3400, lastLoadedAt: '2025-01-01T10:00:00Z', cacheKeys: [] },
        location: { currentLocationId: 'village-of-barovia' },
        character: { filePath: '/mock/characters/kapi.yaml', name: 'Kapi', level: 3 }
      };

      const mockContextLoader = {
        loadContext: jest.fn().mockResolvedValue({
          success: true,
          data: {
            npcs: [],
            events: [],
            metadata: { tokenCount: 2800 }
          }
        })
      };

      jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(sessionState));
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      jest.mock('../../../src/context/context-loader', () => mockContextLoader);

      const startTime = Date.now();
      const result = await contextReduce(mockContext);
      const elapsedTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(elapsedTime).toBeLessThan(3000); // 3 seconds
    }, 8000);
  });

  describe('Performance Degradation Prevention', () => {
    test('should maintain performance with large session history', async () => {
      const sessionState = {
        sessionId: 'session-123',
        startTime: new Date().toISOString(),
        character: { name: 'Kapi', level: 3, class: 'Warlock' },
        location: {
          currentLocationId: 'village-of-barovia',
          visitedThisSession: Array(50).fill('location') // 50 locations visited
        },
        npcs: {
          activeNPCs: Array(20).fill('npc'), // 20 NPCs
          interactedWith: Array(15).fill('npc') // 15 interactions
        }
      };

      const existingLogs = Array(100).fill('log-file.md'); // 100 previous sessions

      jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(sessionState));
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
      jest.spyOn(fs, 'readdir').mockResolvedValue(existingLogs);
      jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);

      const startTime = Date.now();
      const result = await endSession(mockContext);
      const elapsedTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(elapsedTime).toBeLessThan(30000); // Still under 30 seconds
    }, 35000);

    test('should handle high token count contexts efficiently', async () => {
      const sessionState = {
        context: { tokensUsed: 3300, lastLoadedAt: '2025-01-01T10:00:00Z', cacheKeys: [] },
        location: { currentLocationId: 'castle-ravenloft' }, // Large location
        character: { filePath: '/mock/characters/kapi.yaml', name: 'Kapi', level: 3 }
      };

      const mockContextLoader = {
        loadContext: jest.fn().mockResolvedValue({
          success: true,
          data: {
            npcs: Array(30).fill({}), // 30 NPCs
            events: Array(20).fill({}), // 20 events
            quests: Array(10).fill({}), // 10 quests
            items: Array(50).fill({}), // 50 items
            metadata: { tokenCount: 3300 }
          }
        })
      };

      jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(sessionState));

      jest.mock('../../../src/context/context-loader', () => mockContextLoader);

      const startTime = Date.now();
      const result = await contextShow(mockContext);
      const elapsedTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(elapsedTime).toBeLessThan(2000); // Under 2 seconds even with large context
    }, 5000);
  });
});
