/**
 * Test Suite 6: Epic Integration
 *
 * Tests for integration with Epic 1-5 systems:
 * - ContextLoader (Story 5-1)
 * - PromptTemplateEngine (Story 5-3)
 * - CalendarManager (Epic 2)
 * - EventScheduler (Epic 2)
 * - StateManager (Epic 1)
 */

const fs = require('fs/promises');
const yaml = require('js-yaml');
const { startSession } = require('../../extensions/kapis-rpg-dm/src/commands/start-session');
const { travel } = require('../../extensions/kapis-rpg-dm/src/commands/travel');
const { rest } = require('../../extensions/kapis-rpg-dm/src/commands/rest');

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

describe('Epic Integration', () => {
  let mockContext;

  beforeEach(() => {
    mockContext = { subscriptions: [] };
    jest.clearAllMocks();
  });

  describe('ContextLoader Integration (Story 5-1)', () => {
    test('/start-session should call ContextLoader.loadContext()', async () => {
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

      jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(validCharacter));
      jest.spyOn(fs, 'access').mockResolvedValue(undefined);
      jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      jest.mock('../../../src/context/context-loader', () => mockContextLoader);

      await startSession(mockContext, 'village-of-barovia', 'kapi');

      expect(mockContextLoader.loadContext).toHaveBeenCalledWith(
        expect.stringContaining('kapi.yaml'),
        'village-of-barovia',
        expect.any(Object),
        3500 // Token budget
      );
    });

    test('/travel should call ContextLoader.loadContext() for new location', async () => {
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

      const mockContextLoader = {
        loadContext: jest.fn().mockResolvedValue({
          success: true,
          data: {
            location: { name: 'Death House' },
            calendar: { currentDate: '735-10-1', currentTime: '08:30' },
            npcs: [],
            events: [],
            metadata: { tokenCount: 1500 }
          }
        })
      };

      jest.spyOn(fs, 'readFile')
        .mockResolvedValueOnce(yaml.dump(sessionState))
        .mockResolvedValueOnce(yaml.dump(locationMetadata));
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      jest.mock('../../../src/context/context-loader', () => mockContextLoader);

      await travel(mockContext, 'death-house');

      expect(mockContextLoader.loadContext).toHaveBeenCalledWith(
        expect.stringContaining('kapi.yaml'),
        'death-house',
        expect.any(Object),
        3500
      );
    });
  });

  describe('PromptTemplateEngine Integration (Story 5-3)', () => {
    test('/start-session should call PromptTemplateEngine.renderTemplate()', async () => {
      const validCharacter = {
        name: 'Kapi',
        level: 3,
        class: 'Warlock',
        hp: { current: 20, max: 24 }
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

      jest.mock('../../../src/prompts', () => ({ PromptTemplateEngine: mockTemplateEngine }));

      await startSession(mockContext, 'village-of-barovia', 'kapi');

      expect(mockTemplateEngine.renderTemplate).toHaveBeenCalledWith(
        'location-initial-visit',
        expect.any(Object)
      );
    });

    test('/travel should use correct template for return visits', async () => {
      const sessionState = {
        location: {
          currentLocationId: 'village-of-barovia',
          visitedThisSession: ['village-of-barovia', 'death-house', 'death-house'] // Visited death-house twice
        },
        character: { filePath: '/mock/characters/kapi.yaml', name: 'Kapi' },
        calendar: { timePassed: '0 hours' }
      };

      const locationMetadata = {
        connections: ['death-house']
      };

      const mockTemplateEngine = {
        renderTemplate: jest.fn().mockResolvedValue({
          success: true,
          data: { prompt: 'You return to Death House...' }
        })
      };

      jest.spyOn(fs, 'readFile')
        .mockResolvedValueOnce(yaml.dump(sessionState))
        .mockResolvedValueOnce(yaml.dump(locationMetadata));
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      jest.mock('../../../src/prompts', () => ({ PromptTemplateEngine: mockTemplateEngine }));

      await travel(mockContext, 'death-house');

      expect(mockTemplateEngine.renderTemplate).toHaveBeenCalledWith(
        'location-return', // Should use return template for second visit
        expect.any(Object)
      );
    });
  });

  describe('CalendarManager Integration (Epic 2)', () => {
    test('/travel should call CalendarManager.advanceTime()', async () => {
      const sessionState = {
        location: {
          currentLocationId: 'village-of-barovia',
          visitedThisSession: ['village-of-barovia']
        },
        character: { filePath: '/mock/characters/kapi.yaml', name: 'Kapi' },
        calendar: { timePassed: '0 hours' }
      };

      const locationMetadata = {
        connections: [
          { location_id: 'death-house', travel_time: 2 } // 2 hours travel time
        ]
      };

      const mockCalendarManager = {
        advanceTime: jest.fn().mockResolvedValue({ success: true })
      };

      jest.spyOn(fs, 'readFile')
        .mockResolvedValueOnce(yaml.dump(sessionState))
        .mockResolvedValueOnce(yaml.dump(locationMetadata));
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      jest.mock('../../../src/calendar/calendar-manager', () => mockCalendarManager);

      await travel(mockContext, 'death-house');

      expect(mockCalendarManager.advanceTime).toHaveBeenCalledWith(2); // 2 hours
    });

    test('/rest should call CalendarManager.advanceTime() with correct duration', async () => {
      const sessionState = {
        character: { filePath: '/mock/characters/kapi.yaml' },
        calendar: { timePassed: '0 hours' }
      };

      const characterData = {
        name: 'Kapi',
        level: 3,
        hp: { current: 20, max: 24 },
        hit_dice: { current: 2, max: 3 },
        spell_slots: {}
      };

      const mockCalendarManager = {
        advanceTime: jest.fn().mockResolvedValue({ success: true })
      };

      jest.spyOn(fs, 'readFile')
        .mockResolvedValueOnce(yaml.dump(sessionState))
        .mockResolvedValueOnce(yaml.dump(characterData));
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      jest.mock('../../../src/calendar/calendar-manager', () => mockCalendarManager);

      // Test long rest (8 hours)
      await rest(mockContext, 'long');

      expect(mockCalendarManager.advanceTime).toHaveBeenCalledWith(8);

      jest.clearAllMocks();

      // Test short rest (1 hour)
      await rest(mockContext, 'short');

      expect(mockCalendarManager.advanceTime).toHaveBeenCalledWith(1);
    });
  });

  describe('EventScheduler Integration (Epic 2)', () => {
    test('/travel should call EventScheduler.checkTriggers()', async () => {
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
          data: { triggeredEvents: [] }
        })
      };

      jest.spyOn(fs, 'readFile')
        .mockResolvedValueOnce(yaml.dump(sessionState))
        .mockResolvedValueOnce(yaml.dump(locationMetadata));
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      jest.mock('../../../src/calendar/event-scheduler', () => mockEventScheduler);

      await travel(mockContext, 'death-house');

      expect(mockEventScheduler.checkTriggers).toHaveBeenCalled();
    });

    test('/rest should check for interrupting events', async () => {
      const sessionState = {
        character: { filePath: '/mock/characters/kapi.yaml' },
        calendar: { timePassed: '0 hours' }
      };

      const characterData = {
        name: 'Kapi',
        level: 3,
        hp: { current: 20, max: 24 },
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

      const result = await rest(mockContext, 'long');

      expect(mockEventScheduler.checkTriggers).toHaveBeenCalled();
      expect(result.data.interrupted).toBe(true);
    });
  });

  describe('Epic System Error Propagation', () => {
    test('should propagate ContextLoader errors to user', async () => {
      const validCharacter = {
        name: 'Kapi',
        level: 3,
        class: 'Warlock',
        hp: { current: 20, max: 24 }
      };

      const mockContextLoader = {
        loadContext: jest.fn().mockResolvedValue({
          success: false,
          error: 'Location data corrupted'
        })
      };

      jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(validCharacter));
      jest.spyOn(fs, 'access').mockResolvedValue(undefined);
      jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);

      jest.mock('../../../src/context/context-loader', () => mockContextLoader);

      const result = await startSession(mockContext, 'village-of-barovia', 'kapi');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Location data corrupted');
    });

    test('should propagate EventScheduler errors gracefully', async () => {
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
          success: false,
          error: 'Events file corrupted'
        })
      };

      jest.spyOn(fs, 'readFile')
        .mockResolvedValueOnce(yaml.dump(sessionState))
        .mockResolvedValueOnce(yaml.dump(locationMetadata));

      jest.mock('../../../src/calendar/event-scheduler', () => mockEventScheduler);

      const result = await travel(mockContext, 'death-house');

      // Travel should continue even if event checking fails (graceful degradation)
      expect(result.data.encounterOccurred).toBe(false);
    });
  });
});
