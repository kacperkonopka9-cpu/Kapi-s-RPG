/**
 * Unit tests for start-session command handler
 * Tests AC-4: Start Session Command (Primary)
 */

const { startSessionHandler } = require('../../../src/commands/handlers/start-session');

describe('startSessionHandler', () => {
  let deps;
  let mockSessionManager;
  let mockLocationLoader;
  let mockContextBuilder;
  let mockSessionLogger;
  let mockOutputChannel;

  beforeEach(() => {
    // Create mocks
    mockSessionManager = {
      startSession: jest.fn().mockReturnValue({
        sessionId: 'test-session-123',
        currentLocationId: 'village-of-barovia',
        startTime: new Date().toISOString(),
        endTime: null,
        actionCount: 0,
        visitedLocations: ['village-of-barovia']
      })
    };

    mockLocationLoader = {
      loadLocation: jest.fn().mockResolvedValue({
        locationId: 'village-of-barovia',
        locationName: 'Village of Barovia',
        description: 'A grim village shrouded in mist...',
        npcs: [],
        items: []
      })
    };

    mockContextBuilder = {
      buildPrompt: jest.fn().mockReturnValue({
        systemPrompt: 'System prompt',
        contextDescription: 'Location description',
        metadata: { estimatedTokens: 500 }
      })
    };

    mockSessionLogger = {
      initializeLog: jest.fn().mockReturnValue('logs/session-2025-11-02.md'),
      log: jest.fn()
    };

    mockOutputChannel = jest.fn();

    deps = {
      sessionManager: mockSessionManager,
      locationLoader: mockLocationLoader,
      contextBuilder: mockContextBuilder,
      sessionLogger: mockSessionLogger,
      outputChannel: mockOutputChannel
    };
  });

  // ========================================================================
  // Success Cases
  // ========================================================================

  test('should start new session successfully', async () => {
    const result = await startSessionHandler(deps, []);

    expect(result).toBeDefined();
    expect(result.sessionId).toBe('test-session-123');
    expect(result.currentLocationId).toBe('village-of-barovia');
  });

  test('should call sessionManager.startSession with village-of-barovia', async () => {
    await startSessionHandler(deps, []);

    expect(mockSessionManager.startSession).toHaveBeenCalledWith('village-of-barovia');
  });

  test('should initialize session log', async () => {
    await startSessionHandler(deps, []);

    expect(mockSessionLogger.initializeLog).toHaveBeenCalledWith('test-session-123');
  });

  test('should load initial location data', async () => {
    await startSessionHandler(deps, []);

    expect(mockLocationLoader.loadLocation).toHaveBeenCalledWith('village-of-barovia');
  });

  test('should build LLM prompt with location data', async () => {
    await startSessionHandler(deps, []);

    expect(mockContextBuilder.buildPrompt).toHaveBeenCalled();
    const callArgs = mockContextBuilder.buildPrompt.mock.calls[0];
    expect(callArgs[0].locationId).toBe('village-of-barovia');
    expect(callArgs[1]).toBeNull(); // No character data yet
    expect(callArgs[2]).toEqual([]); // No recent actions yet
  });

  test('should display narrative to user', async () => {
    await startSessionHandler(deps, []);

    expect(mockOutputChannel).toHaveBeenCalled();
    const narrative = mockOutputChannel.mock.calls[0][0];
    expect(narrative).toContain('Game Session Started');
    expect(narrative).toContain('test-session-123');
    expect(narrative).toContain('Village of Barovia');
  });

  test('should log start action', async () => {
    await startSessionHandler(deps, []);

    expect(mockSessionLogger.log).toHaveBeenCalledWith({
      description: 'Started new game session',
      result: expect.stringContaining('Village of Barovia')
    });
  });

  // ========================================================================
  // Error Handling
  // ========================================================================

  test('should throw error if sessionManager is missing', async () => {
    delete deps.sessionManager;

    await expect(startSessionHandler(deps, [])).rejects.toThrow('Missing required dependencies');
  });

  test('should throw error if locationLoader is missing', async () => {
    delete deps.locationLoader;

    await expect(startSessionHandler(deps, [])).rejects.toThrow('Missing required dependencies');
  });

  test('should throw error if contextBuilder is missing', async () => {
    delete deps.contextBuilder;

    await expect(startSessionHandler(deps, [])).rejects.toThrow('Missing required dependencies');
  });

  test('should throw error if sessionLogger is missing', async () => {
    delete deps.sessionLogger;

    await expect(startSessionHandler(deps, [])).rejects.toThrow('Missing required dependencies');
  });

  test('should throw error if outputChannel is missing', async () => {
    delete deps.outputChannel;

    await expect(startSessionHandler(deps, [])).rejects.toThrow('Missing required dependencies');
  });

  test('should handle sessionManager.startSession error', async () => {
    mockSessionManager.startSession.mockImplementation(() => {
      throw new Error('Session already active');
    });

    await expect(startSessionHandler(deps, [])).rejects.toThrow('Failed to start session');
    expect(mockOutputChannel).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
  });

  test('should handle locationLoader.loadLocation error', async () => {
    mockLocationLoader.loadLocation.mockRejectedValue(new Error('Location not found'));

    await expect(startSessionHandler(deps, [])).rejects.toThrow('Failed to start session');
    expect(mockOutputChannel).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
  });

  // ========================================================================
  // Performance
  // ========================================================================

  test('should complete in reasonable time', async () => {
    const start = performance.now();
    await startSessionHandler(deps, []);
    const duration = performance.now() - start;

    // Should complete very quickly with mocked dependencies
    expect(duration).toBeLessThan(100);
  });
});
