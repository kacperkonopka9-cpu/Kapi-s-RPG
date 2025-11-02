/**
 * Unit tests for look command handler
 * Tests AC-6: Look Command
 */

const { lookHandler } = require('../../../src/commands/handlers/look');

describe('lookHandler', () => {
  let deps;

  beforeEach(() => {
    deps = {
      sessionManager: {
        getCurrentSession: jest.fn().mockReturnValue({
          sessionId: 'test-123',
          currentLocationId: 'village-of-barovia',
          actionCount: 5
        }),
        recordAction: jest.fn()
      },
      locationLoader: {
        loadLocation: jest.fn().mockResolvedValue({
          locationId: 'village-of-barovia',
          locationName: 'Village of Barovia',
          description: 'A grim village...',
          npcs: [{ name: 'Ismark' }],
          items: [{ name: 'Sword', hidden: false }]
        }),
        cache: new Map()
      },
      contextBuilder: {
        buildPrompt: jest.fn().mockReturnValue({
          systemPrompt: 'System',
          contextDescription: 'Description'
        })
      },
      sessionLogger: {
        log: jest.fn()
      },
      outputChannel: jest.fn()
    };
  });

  test('should look around successfully', async () => {
    const result = await lookHandler(deps, []);

    expect(deps.sessionManager.getCurrentSession).toHaveBeenCalled();
    expect(deps.locationLoader.loadLocation).toHaveBeenCalledWith('village-of-barovia');
    expect(deps.outputChannel).toHaveBeenCalled();
    expect(deps.sessionLogger.log).toHaveBeenCalled();
    expect(result.sessionId).toBe('test-123');
  });

  test('should throw error if no active session', async () => {
    deps.sessionManager.getCurrentSession.mockReturnValue(null);

    await expect(lookHandler(deps, [])).rejects.toThrow('No active session');
    expect(deps.outputChannel).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
  });

  test('should clear cache to force location reload', async () => {
    deps.locationLoader.cache.set('village-of-barovia', { cached: 'data' });

    await lookHandler(deps, []);

    // Cache should be cleared for current location
    expect(deps.locationLoader.cache.has('village-of-barovia')).toBe(false);
  });

  test('should display NPC and item counts', async () => {
    await lookHandler(deps, []);

    const narrative = deps.outputChannel.mock.calls[0][0];
    expect(narrative).toContain('**NPCs present:** 1');
    expect(narrative).toContain('**Items visible:** 1');
  });

  test('should record look action in session', async () => {
    await lookHandler(deps, []);

    expect(deps.sessionManager.recordAction).toHaveBeenCalledWith(expect.objectContaining({
      actionType: 'look',
      location: 'village-of-barovia'
    }));
  });

  test('should throw error if missing required dependencies', async () => {
    delete deps.contextBuilder;
    await expect(lookHandler(deps, [])).rejects.toThrow('Missing required dependencies');
  });
});
