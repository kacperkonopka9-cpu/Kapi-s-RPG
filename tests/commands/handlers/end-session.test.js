/**
 * Unit tests for end-session command handler
 * Tests AC-7: End Session with Auto-Save
 */

const { endSessionHandler } = require('../../../src/commands/handlers/end-session');

describe('endSessionHandler', () => {
  let deps;

  beforeEach(() => {
    deps = {
      sessionManager: {
        getCurrentSession: jest.fn().mockReturnValue({
          sessionId: 'test-123',
          currentLocationId: 'village-of-barovia',
          startTime: new Date(Date.now() - 45 * 60000).toISOString(),
          actionCount: 12,
          visitedLocations: ['village-of-barovia', 'tser-pool']
        }),
        endSession: jest.fn().mockReturnValue({
          sessionId: 'test-123',
          currentLocationId: 'village-of-barovia',
          startTime: new Date(Date.now() - 45 * 60000).toISOString(),
          endTime: new Date().toISOString(),
          actionCount: 12,
          visitedLocations: ['village-of-barovia', 'tser-pool']
        })
      },
      sessionLogger: {
        finalize: jest.fn().mockReturnValue('logs/session-2025-11-02.md')
      },
      gitIntegration: {
        createAutoSave: jest.fn().mockReturnValue({
          success: true,
          commitHash: 'abc123def456',
          error: null
        })
      },
      outputChannel: jest.fn()
    };
  });

  test('should end session successfully', async () => {
    const result = await endSessionHandler(deps, []);

    expect(result).toBeDefined();
    expect(result.sessionId).toBe('test-123');
    expect(result.logPath).toBe('logs/session-2025-11-02.md');
    expect(result.gitCommit).toBe('abc123def456');
    expect(result.gitSuccess).toBe(true);
  });

  test('should call sessionManager.endSession', async () => {
    await endSessionHandler(deps, []);

    expect(deps.sessionManager.endSession).toHaveBeenCalled();
  });

  test('should finalize session log with session state', async () => {
    await endSessionHandler(deps, []);

    expect(deps.sessionLogger.finalize).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: 'test-123',
      endTime: expect.any(String)
    }));
  });

  test('should create Git auto-save commit', async () => {
    await endSessionHandler(deps, []);

    expect(deps.gitIntegration.createAutoSave).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: 'test-123'
    }));
  });

  test('should display summary with all details', async () => {
    await endSessionHandler(deps, []);

    const summary = deps.outputChannel.mock.calls[0][0];
    expect(summary).toContain('Session Ended');
    expect(summary).toContain('Duration:');
    expect(summary).toContain('**Actions Taken:** 12');
    expect(summary).toContain('**Locations Visited:** 2');
    expect(summary).toContain('abc123def456');
  });

  test('should throw error if no active session', async () => {
    deps.sessionManager.getCurrentSession.mockReturnValue(null);

    await expect(endSessionHandler(deps, [])).rejects.toThrow('No active session to end');
    expect(deps.outputChannel).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
  });

  test('should handle Git failures gracefully (warn but don\'t block)', async () => {
    deps.gitIntegration.createAutoSave.mockReturnValue({
      success: false,
      commitHash: null,
      error: 'Git not available'
    });

    const result = await endSessionHandler(deps, []);

    // Should still succeed even if Git fails
    expect(result.gitSuccess).toBe(false);
    expect(result.logPath).toBe('logs/session-2025-11-02.md');

    const summary = deps.outputChannel.mock.calls[0][0];
    expect(summary).toContain('Git Auto-Save Failed');
    expect(summary).toContain('Git not available');
  });

  test('should throw error if missing required dependencies', async () => {
    delete deps.gitIntegration;
    await expect(endSessionHandler(deps, [])).rejects.toThrow('Missing required dependencies');
  });

  test('should calculate session duration correctly', async () => {
    await endSessionHandler(deps, []);

    const summary = deps.outputChannel.mock.calls[0][0];
    // Duration should be ~45 minutes
    expect(summary).toMatch(/\*\*Duration:\*\* 4[45] minutes/);
  });
});
