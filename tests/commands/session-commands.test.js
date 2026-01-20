/**
 * Test Suite 2: Session Commands
 *
 * Tests for /start-session and /end-session commands:
 * - Session initialization
 * - Character validation
 * - Location validation
 * - Session state creation
 * - Session termination
 * - Session log generation
 */

const fs = require('fs/promises');
const path = require('path');
const yaml = require('js-yaml');
const { startSession } = require('../../extensions/kapis-rpg-dm/src/commands/start-session');
const { endSession } = require('../../extensions/kapis-rpg-dm/src/commands/end-session');

// Mock VS Code API
jest.mock('vscode', () => ({
  window: {
    showInformationMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showErrorMessage: jest.fn(),
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

describe('/start-session', () => {
  let mockContext;
  const workspaceRoot = '/mock/workspace';

  beforeEach(() => {
    mockContext = {
      subscriptions: []
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  test('should reject invalid character file', async () => {
    // Mock character file not found
    jest.spyOn(fs, 'readFile').mockRejectedValueOnce(new Error('File not found'));

    const result = await startSession(mockContext, 'village-of-barovia', 'nonexistent-character');

    expect(result.success).toBe(false);
    expect(result.message).toContain('Character file not found');
  });

  test('should reject character file missing required fields', async () => {
    // Mock incomplete character file
    const incompleteCharacter = {
      name: 'Kapi',
      level: 3
      // Missing: class, hp
    };

    jest.spyOn(fs, 'readFile').mockResolvedValueOnce(yaml.dump(incompleteCharacter));

    const result = await startSession(mockContext, 'village-of-barovia', 'incomplete-character');

    expect(result.success).toBe(false);
    expect(result.message).toContain('missing required fields');
  });

  test('should reject invalid location', async () => {
    // Mock valid character file
    const validCharacter = {
      name: 'Kapi',
      level: 3,
      class: 'Warlock',
      hp: { current: 20, max: 24 }
    };

    jest.spyOn(fs, 'readFile').mockResolvedValueOnce(yaml.dump(validCharacter));
    jest.spyOn(fs, 'access').mockRejectedValueOnce(new Error('Location not found'));

    const result = await startSession(mockContext, 'nonexistent-location', 'kapi');

    expect(result.success).toBe(false);
    expect(result.message).toContain('Location not found');
  });

  test('should successfully start session with valid inputs', async () => {
    // Mock valid character file
    const validCharacter = {
      name: 'Kapi',
      level: 3,
      class: 'Warlock',
      hp: { current: 20, max: 24 }
    };

    // Mock ContextLoader
    const mockContextLoader = {
      loadContext: jest.fn().mockResolvedValue({
        success: true,
        data: {
          location: { name: 'Village of Barovia' },
          calendar: { currentDate: '735-10-1', currentTime: '08:00' },
          npcs: [],
          events: [],
          quests: [],
          metadata: { tokenCount: 1200 }
        }
      })
    };

    // Mock PromptTemplateEngine
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

    // Mock Epic systems
    jest.mock('../../../src/context/context-loader', () => mockContextLoader);
    jest.mock('../../../src/prompts', () => ({ PromptTemplateEngine: mockTemplateEngine }));

    const result = await startSession(mockContext, 'village-of-barovia', 'kapi');

    expect(result.success).toBe(true);
    expect(result.data.characterName).toBe('Kapi');
    expect(result.data.location).toBe('village-of-barovia');
  });

  test('should create session directory if missing', async () => {
    const validCharacter = {
      name: 'Kapi',
      level: 3,
      class: 'Warlock',
      hp: { current: 20, max: 24 }
    };

    const mkdirSpy = jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(validCharacter));
    jest.spyOn(fs, 'access').mockResolvedValue(undefined);
    jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

    await startSession(mockContext, 'village-of-barovia', 'kapi');

    expect(mkdirSpy).toHaveBeenCalledWith(
      expect.stringContaining('game-data/session'),
      { recursive: true }
    );
  });

  test('should write current-session.yaml file', async () => {
    const validCharacter = {
      name: 'Kapi',
      level: 3,
      class: 'Warlock',
      hp: { current: 20, max: 24 }
    };

    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(validCharacter));
    jest.spyOn(fs, 'access').mockResolvedValue(undefined);
    jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);

    await startSession(mockContext, 'village-of-barovia', 'kapi');

    expect(writeFileSpy).toHaveBeenCalledWith(
      expect.stringContaining('current-session.yaml'),
      expect.any(String),
      'utf-8'
    );
  });
});

describe('/end-session', () => {
  let mockContext;

  beforeEach(() => {
    mockContext = {
      subscriptions: []
    };

    jest.clearAllMocks();
  });

  test('should reject if no active session found', async () => {
    jest.spyOn(fs, 'readFile').mockRejectedValueOnce(new Error('File not found'));

    const result = await endSession(mockContext);

    expect(result.success).toBe(false);
    expect(result.message).toContain('No active session found');
  });

  test('should generate session summary', async () => {
    const sessionState = {
      sessionId: 'session-123',
      startTime: new Date('2025-01-01T10:00:00Z').toISOString(),
      character: { name: 'Kapi', level: 3, class: 'Warlock' },
      location: {
        currentLocationId: 'village-of-barovia',
        visitedThisSession: ['village-of-barovia', 'death-house']
      },
      npcs: {
        activeNPCs: ['ireena_kolyana', 'ismark_kolyanovich'],
        interactedWith: ['ismark_kolyanovich']
      }
    };

    jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(sessionState));
    jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readdir').mockResolvedValue([]);
    jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);

    const result = await endSession(mockContext, 'Great session!');

    expect(result.success).toBe(true);
    expect(result.data.sessionId).toBe('session-123');
  });

  test('should save session log file', async () => {
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

    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(sessionState));
    jest.spyOn(fs, 'readdir').mockResolvedValue([]);
    jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);

    await endSession(mockContext, 'Test summary');

    expect(writeFileSpy).toHaveBeenCalledWith(
      expect.stringMatching(/session-\d+\.md$/),
      expect.stringContaining('# Session'),
      'utf-8'
    );
  });

  test('should update session-history.yaml', async () => {
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

    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile')
      .mockResolvedValueOnce(yaml.dump(sessionState)) // current-session.yaml
      .mockRejectedValueOnce(new Error('History file not found')); // session-history.yaml
    jest.spyOn(fs, 'readdir').mockResolvedValue([]);
    jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);

    await endSession(mockContext);

    expect(writeFileSpy).toHaveBeenCalledWith(
      expect.stringContaining('session-history.yaml'),
      expect.any(String),
      'utf-8'
    );
  });

  test('should delete current-session.yaml after ending', async () => {
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

    const unlinkSpy = jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(sessionState));
    jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readdir').mockResolvedValue([]);

    await endSession(mockContext);

    expect(unlinkSpy).toHaveBeenCalledWith(
      expect.stringContaining('current-session.yaml')
    );
  });
});
