/**
 * Unit tests for travel command handler
 * Tests AC-5: Travel Between Locations
 */

const { travelHandler } = require('../../../src/commands/handlers/travel');

describe('travelHandler', () => {
  let deps;

  beforeEach(() => {
    deps = {
      sessionManager: {
        getCurrentSession: jest.fn().mockReturnValue({
          sessionId: 'test-123',
          currentLocationId: 'village-of-barovia',
          actionCount: 0
        }),
        recordAction: jest.fn(),
        updateCurrentLocation: jest.fn()
      },
      locationLoader: {
        loadLocation: jest.fn().mockResolvedValue({
          locationId: 'tser-pool',
          locationName: 'Tser Pool Encampment',
          description: 'A Vistani camp by a pool...'
        })
      },
      contextBuilder: {
        buildPrompt: jest.fn().mockReturnValue({
          systemPrompt: 'System',
          contextDescription: 'Description'
        })
      },
      navigationHandler: {
        travel: jest.fn().mockReturnValue({
          success: true,
          error: null,
          targetLocationId: 'tser-pool'
        })
      },
      sessionLogger: {
        log: jest.fn()
      },
      outputChannel: jest.fn()
    };
  });

  test('should travel successfully to connected location', async () => {
    const result = await travelHandler(deps, ['tser-pool']);

    expect(deps.navigationHandler.travel).toHaveBeenCalledWith('tser-pool', 'village-of-barovia');
    expect(deps.sessionManager.updateCurrentLocation).toHaveBeenCalledWith('tser-pool');
    expect(deps.locationLoader.loadLocation).toHaveBeenCalledWith('tser-pool');
    expect(deps.outputChannel).toHaveBeenCalled();
    expect(deps.sessionLogger.log).toHaveBeenCalled();
  });

  test('should throw error if no location argument provided', async () => {
    await expect(travelHandler(deps, [])).rejects.toThrow('requires a location argument');
    expect(deps.outputChannel).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
  });

  test('should throw error if no active session', async () => {
    deps.sessionManager.getCurrentSession.mockReturnValue(null);

    await expect(travelHandler(deps, ['tser-pool'])).rejects.toThrow('No active session');
    expect(deps.outputChannel).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
  });

  test('should handle invalid location (not connected)', async () => {
    deps.navigationHandler.travel.mockReturnValue({
      success: false,
      error: 'Cannot travel to invalid-location. Not connected.',
      targetLocationId: null
    });

    await expect(travelHandler(deps, ['invalid-location'])).rejects.toThrow('Not connected');
    expect(deps.outputChannel).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
  });

  test('should record travel action', async () => {
    await travelHandler(deps, ['tser-pool']);

    expect(deps.sessionManager.recordAction).toHaveBeenCalledWith(expect.objectContaining({
      actionType: 'travel',
      from: 'village-of-barovia',
      to: 'tser-pool'
    }));
  });

  test('should build prompt with recent actions context', async () => {
    await travelHandler(deps, ['tser-pool']);

    expect(deps.contextBuilder.buildPrompt).toHaveBeenCalled();
    const callArgs = deps.contextBuilder.buildPrompt.mock.calls[0];
    expect(callArgs[2]).toEqual(expect.arrayContaining([
      expect.objectContaining({ description: expect.stringContaining('Traveled from') })
    ]));
  });

  test('should throw error if missing required dependencies', async () => {
    delete deps.sessionManager;
    await expect(travelHandler(deps, ['tser-pool'])).rejects.toThrow('Missing required dependencies');
  });
});
