/**
 * Test Suite 4: Context Commands
 *
 * Tests for /context show|reload|reduce commands:
 * - Context metadata display
 * - Cache clearing
 * - Context reloading
 * - Priority-based reduction
 */

const fs = require('fs/promises');
const yaml = require('js-yaml');
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

describe('/context show', () => {
  let mockContext;

  beforeEach(() => {
    mockContext = { subscriptions: [] };
    jest.clearAllMocks();
  });

  test('should reject if no active session', async () => {
    jest.spyOn(fs, 'readFile').mockRejectedValueOnce(new Error('File not found'));

    const result = await contextShow(mockContext);

    expect(result.success).toBe(false);
    expect(result.message).toContain('No active session');
  });

  test('should display context metadata', async () => {
    const sessionState = {
      context: {
        tokensUsed: 2500,
        lastLoadedAt: '2025-01-01T10:00:00Z',
        cacheKeys: ['location:village-of-barovia', 'npc:ireena']
      },
      location: { currentLocationId: 'village-of-barovia' },
      character: { filePath: '/mock/characters/kapi.yaml', name: 'Kapi', level: 3 }
    };

    const mockContextLoader = {
      loadContext: jest.fn().mockResolvedValue({
        success: true,
        data: {
          npcs: [{}, {}], // 2 NPCs
          events: [{}], // 1 event
          quests: [],
          items: [{}, {}, {}], // 3 items
          metadata: { tokenCount: 2500 }
        }
      })
    };

    jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(sessionState));
    jest.mock('../../../src/context/context-loader', () => mockContextLoader);

    const result = await contextShow(mockContext);

    expect(result.success).toBe(true);
    expect(result.data.tokenCount).toBe(2500);
    expect(result.data.utilization).toBe(71); // 2500/3500 = 71%
    expect(result.data.npcsLoaded).toBe(2);
    expect(result.data.eventsLoaded).toBe(1);
    expect(result.data.itemsLoaded).toBe(3);
  });

  test('should calculate utilization percentage correctly', async () => {
    const sessionState = {
      context: { tokensUsed: 3325, lastLoadedAt: '2025-01-01T10:00:00Z', cacheKeys: [] },
      location: { currentLocationId: 'village-of-barovia' },
      character: { filePath: '/mock/characters/kapi.yaml', name: 'Kapi', level: 3 }
    };

    jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(sessionState));

    const result = await contextShow(mockContext);

    expect(result.data.utilization).toBe(95); // 3325/3500 = 95%
  });
});

describe('/context reload', () => {
  let mockContext;

  beforeEach(() => {
    mockContext = { subscriptions: [] };
    jest.clearAllMocks();
  });

  test('should reject if no active session', async () => {
    jest.spyOn(fs, 'readFile').mockRejectedValueOnce(new Error('File not found'));

    const result = await contextReload(mockContext);

    expect(result.success).toBe(false);
    expect(result.message).toContain('No active session');
  });

  test('should clear cache and reload context', async () => {
    const sessionState = {
      context: { tokensUsed: 2000, lastLoadedAt: '2025-01-01T10:00:00Z', cacheKeys: ['cached'] },
      location: { currentLocationId: 'village-of-barovia' },
      character: { filePath: '/mock/characters/kapi.yaml', name: 'Kapi', level: 3 }
    };

    const mockContextCache = {
      clear: jest.fn()
    };

    const mockContextLoader = {
      loadContext: jest.fn().mockResolvedValue({
        success: true,
        data: {
          npcs: [],
          events: [],
          quests: [],
          items: [],
          location: { name: 'Village of Barovia' },
          calendar: { currentDate: '735-10-1', currentTime: '08:00' },
          metadata: { tokenCount: 1800 } // Token count decreased after reload
        }
      })
    };

    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(sessionState));

    jest.mock('../../../src/context/context-cache', () => mockContextCache);
    jest.mock('../../../src/context/context-loader', () => mockContextLoader);

    const result = await contextReload(mockContext);

    expect(result.success).toBe(true);
    expect(result.data.oldTokenCount).toBe(2000);
    expect(result.data.newTokenCount).toBe(1800);
    expect(result.data.tokenDiff).toBe(-200);

    // Verify cache was cleared
    expect(mockContextCache.clear).toHaveBeenCalled();

    // Verify session state was updated
    const writtenSessionData = yaml.load(writeFileSpy.mock.calls[0][1]);
    expect(writtenSessionData.context.tokensUsed).toBe(1800);
    expect(writtenSessionData.context.cacheKeys).toEqual([]);
  });
});

describe('/context reduce', () => {
  let mockContext;

  beforeEach(() => {
    mockContext = { subscriptions: [] };
    jest.clearAllMocks();
  });

  test('should reject if no active session', async () => {
    jest.spyOn(fs, 'readFile').mockRejectedValueOnce(new Error('File not found'));

    const result = await contextReduce(mockContext);

    expect(result.success).toBe(false);
    expect(result.message).toContain('No active session');
  });

  test('should skip reduction if utilization below 95%', async () => {
    const sessionState = {
      context: { tokensUsed: 2000, lastLoadedAt: '2025-01-01T10:00:00Z', cacheKeys: [] },
      location: { currentLocationId: 'village-of-barovia' },
      character: { filePath: '/mock/characters/kapi.yaml', name: 'Kapi', level: 3 }
    };

    jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(sessionState));

    const result = await contextReduce(mockContext);

    expect(result.success).toBe(true);
    expect(result.message).toContain('not needed');
    expect(result.data.droppedPriorities).toEqual([]);
  });

  test('should drop P3 content when over budget', async () => {
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
          quests: [],
          items: [],
          metadata: { tokenCount: 2800 } // Reduced after dropping P3
        }
      })
    };

    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(sessionState));

    jest.mock('../../../src/context/context-loader', () => mockContextLoader);

    const result = await contextReduce(mockContext);

    expect(result.success).toBe(true);
    expect(result.data.droppedPriorities).toEqual([3]);
    expect(result.data.tokensSaved).toBe(600); // 3400 - 2800
    expect(result.data.newUtilization).toBe(80); // 2800/3500
  });

  test('should drop P2 and P3 if still over budget', async () => {
    const sessionState = {
      context: { tokensUsed: 3600, lastLoadedAt: '2025-01-01T10:00:00Z', cacheKeys: [] },
      location: { currentLocationId: 'village-of-barovia' },
      character: { filePath: '/mock/characters/kapi.yaml', name: 'Kapi', level: 3 }
    };

    const mockContextLoader = {
      loadContext: jest.fn()
        .mockResolvedValueOnce({
          success: true,
          data: { metadata: { tokenCount: 3550 } } // Still over after dropping P3
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            npcs: [],
            events: [],
            quests: [],
            items: [],
            metadata: { tokenCount: 2200 } // Under budget after dropping P2 and P3
          }
        })
    };

    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(sessionState));

    jest.mock('../../../src/context/context-loader', () => mockContextLoader);

    const result = await contextReduce(mockContext);

    expect(result.success).toBe(true);
    expect(result.data.droppedPriorities).toEqual([2, 3]);
    expect(result.data.tokensSaved).toBe(1400); // 3600 - 2200
  });

  test('should update session state with reduced token count', async () => {
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
          metadata: { tokenCount: 2500 }
        }
      })
    };

    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile').mockResolvedValue(yaml.dump(sessionState));

    jest.mock('../../../src/context/context-loader', () => mockContextLoader);

    await contextReduce(mockContext);

    const writtenSessionData = yaml.load(writeFileSpy.mock.calls[0][1]);
    expect(writtenSessionData.context.tokensUsed).toBe(2500);
  });
});
