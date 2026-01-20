/**
 * Test Suite 3: Navigation Commands
 *
 * Tests for /travel and /rest commands:
 * - Travel validation
 * - Destination validation
 * - Calendar advancement
 * - Event triggering during travel/rest
 * - Rest mechanics (HP/spell slot recovery)
 * - Context reloading after travel
 */

const fs = require('fs/promises');
const yaml = require('js-yaml');
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

describe('/travel', () => {
  let mockContext;

  beforeEach(() => {
    mockContext = { subscriptions: [] };
    jest.clearAllMocks();
  });

  test('should reject if no active session', async () => {
    jest.spyOn(fs, 'readFile').mockRejectedValueOnce(new Error('File not found'));

    const result = await travel(mockContext, 'vallaki');

    expect(result.success).toBe(false);
    expect(result.message).toContain('No active session');
  });

  test('should reject invalid destination', async () => {
    const sessionState = {
      location: { currentLocationId: 'village-of-barovia' },
      character: { filePath: '/mock/characters/kapi.yaml' }
    };

    const locationMetadata = {
      location_name: 'Village of Barovia',
      connections: ['death-house', 'tser-pool-encampment'] // vallaki not connected
    };

    jest.spyOn(fs, 'readFile')
      .mockResolvedValueOnce(yaml.dump(sessionState))
      .mockResolvedValueOnce(yaml.dump(locationMetadata));

    const result = await travel(mockContext, 'vallaki');

    expect(result.success).toBe(false);
    expect(result.message).toContain('not connected');
    expect(result.message).toContain('vallaki');
  });

  test('should successfully travel to valid destination', async () => {
    const sessionState = {
      location: {
        currentLocationId: 'village-of-barovia',
        visitedThisSession: ['village-of-barovia']
      },
      character: { filePath: '/mock/characters/kapi.yaml', name: 'Kapi', level: 3 },
      calendar: { timePassed: '2 hours' }
    };

    const locationMetadata = {
      location_name: 'Village of Barovia',
      connections: [
        { location_id: 'death-house', travel_time: 0.5 }
      ]
    };

    // Mock Epic systems
    const mockCalendarManager = {
      advanceTime: jest.fn().mockResolvedValue({ success: true })
    };

    const mockEventScheduler = {
      checkTriggers: jest.fn().mockResolvedValue({
        success: true,
        data: { triggeredEvents: [] }
      })
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

    const mockTemplateEngine = {
      renderTemplate: jest.fn().mockResolvedValue({
        success: true,
        data: { prompt: 'You arrive at Death House...' }
      })
    };

    jest.spyOn(fs, 'readFile')
      .mockResolvedValueOnce(yaml.dump(sessionState))
      .mockResolvedValueOnce(yaml.dump(locationMetadata));
    jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

    jest.mock('../../../src/calendar/calendar-manager', () => mockCalendarManager);
    jest.mock('../../../src/calendar/event-scheduler', () => mockEventScheduler);
    jest.mock('../../../src/context/context-loader', () => mockContextLoader);
    jest.mock('../../../src/prompts', () => ({ PromptTemplateEngine: mockTemplateEngine }));

    const result = await travel(mockContext, 'death-house');

    expect(result.success).toBe(true);
    expect(result.data.from).toBe('village-of-barovia');
    expect(result.data.to).toBe('death-house');
  });

  test('should handle encounter during travel', async () => {
    const sessionState = {
      location: {
        currentLocationId: 'village-of-barovia',
        visitedThisSession: ['village-of-barovia']
      },
      character: { filePath: '/mock/characters/kapi.yaml', name: 'Kapi', level: 3 },
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

    const result = await travel(mockContext, 'death-house');

    expect(result.data.encounterOccurred).toBe(true);
  });

  test('should update visitedThisSession list', async () => {
    const sessionState = {
      location: {
        currentLocationId: 'village-of-barovia',
        visitedThisSession: ['village-of-barovia']
      },
      character: { filePath: '/mock/characters/kapi.yaml', name: 'Kapi', level: 3 },
      calendar: { timePassed: '0 hours' }
    };

    const locationMetadata = {
      connections: ['death-house']
    };

    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile')
      .mockResolvedValueOnce(yaml.dump(sessionState))
      .mockResolvedValueOnce(yaml.dump(locationMetadata));

    await travel(mockContext, 'death-house');

    // Check that session state was written with updated location list
    const writtenSessionData = yaml.load(writeFileSpy.mock.calls[0][1]);
    expect(writtenSessionData.location.visitedThisSession).toContain('death-house');
  });
});

describe('/rest', () => {
  let mockContext;

  beforeEach(() => {
    mockContext = { subscriptions: [] };
    jest.clearAllMocks();
  });

  test('should reject invalid rest type', async () => {
    const result = await rest(mockContext, 'medium'); // Invalid: should be "short" or "long"

    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid rest type');
  });

  test('should reject if no active session', async () => {
    jest.spyOn(fs, 'readFile').mockRejectedValueOnce(new Error('File not found'));

    const result = await rest(mockContext, 'long');

    expect(result.success).toBe(false);
    expect(result.message).toContain('No active session');
  });

  test('should handle interrupted rest', async () => {
    const sessionState = {
      character: { filePath: '/mock/characters/kapi.yaml' },
      calendar: { timePassed: '0 hours' }
    };

    const characterData = {
      name: 'Kapi',
      level: 3,
      hp: { current: 10, max: 24 },
      spell_slots: { level_1: { current: 0, max: 2 } }
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

    expect(result.data.interrupted).toBe(true);
    expect(result.data.benefitsGained).toBe(false);
  });

  test('should recover HP on long rest', async () => {
    const sessionState = {
      character: { filePath: '/mock/characters/kapi.yaml' },
      calendar: { timePassed: '0 hours' }
    };

    const characterData = {
      name: 'Kapi',
      level: 3,
      hp: { current: 10, max: 24 },
      hit_dice: { current: 1, max: 3 },
      spell_slots: { level_1: { current: 0, max: 2 } }
    };

    const mockCalendarManager = {
      advanceTime: jest.fn().mockResolvedValue({ success: true })
    };

    const mockEventScheduler = {
      checkTriggers: jest.fn().mockResolvedValue({
        success: true,
        data: { triggeredEvents: [] } // No interruptions
      })
    };

    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile')
      .mockResolvedValueOnce(yaml.dump(sessionState))
      .mockResolvedValueOnce(yaml.dump(characterData));

    jest.mock('../../../src/calendar/calendar-manager', () => mockCalendarManager);
    jest.mock('../../../src/calendar/event-scheduler', () => mockEventScheduler);

    const result = await rest(mockContext, 'long');

    expect(result.success).toBe(true);
    expect(result.data.interrupted).toBe(false);

    // Check character file was updated
    const writtenCharacterData = yaml.load(writeFileSpy.mock.calls[0][1]);
    expect(writtenCharacterData.hp.current).toBe(24); // Full HP
  });

  test('should recover spell slots on long rest', async () => {
    const sessionState = {
      character: { filePath: '/mock/characters/kapi.yaml' },
      calendar: { timePassed: '0 hours' }
    };

    const characterData = {
      name: 'Kapi',
      level: 3,
      hp: { current: 24, max: 24 },
      hit_dice: { current: 3, max: 3 },
      spell_slots: {
        level_1: { current: 0, max: 2 },
        level_2: { current: 1, max: 2 }
      }
    };

    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile')
      .mockResolvedValueOnce(yaml.dump(sessionState))
      .mockResolvedValueOnce(yaml.dump(characterData));

    await rest(mockContext, 'long');

    const writtenCharacterData = yaml.load(writeFileSpy.mock.calls[0][1]);
    expect(writtenCharacterData.spell_slots.level_1.current).toBe(2);
    expect(writtenCharacterData.spell_slots.level_2.current).toBe(2);
  });

  test('should recover hit dice on long rest', async () => {
    const sessionState = {
      character: { filePath: '/mock/characters/kapi.yaml' },
      calendar: { timePassed: '0 hours' }
    };

    const characterData = {
      name: 'Kapi',
      level: 4,
      hp: { current: 24, max: 24 },
      hit_dice: { current: 0, max: 4 },
      spell_slots: {}
    };

    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile')
      .mockResolvedValueOnce(yaml.dump(sessionState))
      .mockResolvedValueOnce(yaml.dump(characterData));

    await rest(mockContext, 'long');

    const writtenCharacterData = yaml.load(writeFileSpy.mock.calls[0][1]);
    // Long rest recovers half max hit dice (rounded down)
    expect(writtenCharacterData.hit_dice.current).toBe(2); // 4 / 2 = 2
  });

  test('should NOT recover spell slots on short rest', async () => {
    const sessionState = {
      character: { filePath: '/mock/characters/kapi.yaml' },
      calendar: { timePassed: '0 hours' }
    };

    const characterData = {
      name: 'Kapi',
      level: 3,
      hp: { current: 15, max: 24 },
      hit_dice: { current: 2, max: 3 },
      spell_slots: { level_1: { current: 0, max: 2 } },
      abilities: { constitution: 14 } // +2 CON mod
    };

    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile')
      .mockResolvedValueOnce(yaml.dump(sessionState))
      .mockResolvedValueOnce(yaml.dump(characterData));

    await rest(mockContext, 'short');

    const writtenCharacterData = yaml.load(writeFileSpy.mock.calls[0][1]);
    // Spell slots should NOT recover on short rest
    expect(writtenCharacterData.spell_slots.level_1.current).toBe(0);
  });
});
