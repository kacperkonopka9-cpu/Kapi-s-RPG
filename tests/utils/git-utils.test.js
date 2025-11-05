/**
 * Unit tests for GitIntegration module
 * Target: ≥90% statement coverage
 */

const { GitIntegration } = require('../../src/utils/git-utils');

describe('GitIntegration', () => {
  let gitIntegration;
  let mockExecSync;
  let mockChildProcess;

  beforeEach(() => {
    // Create fresh mock for each test
    mockExecSync = jest.fn();
    mockChildProcess = { execSync: mockExecSync };
  });

  // ========================================================================
  // Constructor and Initialization
  // ========================================================================

  describe('Constructor', () => {
    test('should initialize with default cwd', () => {
      gitIntegration = new GitIntegration();

      expect(gitIntegration.cwd).toBe(process.cwd());
      expect(gitIntegration.execSync).toBeDefined();
    });

    test('should accept custom cwd', () => {
      const customCwd = 'C:\\custom\\path';
      gitIntegration = new GitIntegration({ cwd: customCwd });

      expect(gitIntegration.cwd).toBe(customCwd);
    });

    test('should accept dependency injection for childProcess', () => {
      gitIntegration = new GitIntegration({ childProcess: mockChildProcess });

      expect(gitIntegration.execSync).toBe(mockExecSync);
    });

    test('should initialize cache state', () => {
      gitIntegration = new GitIntegration();

      expect(gitIntegration._gitAvailable).toBeNull();
      expect(gitIntegration._gitChecked).toBe(false);
    });
  });

  // ========================================================================
  // isGitAvailable() Method
  // ========================================================================

  describe('isGitAvailable()', () => {
    test('should return true when Git is available', () => {
      mockExecSync.mockReturnValue('git version 2.40.0');
      gitIntegration = new GitIntegration({ childProcess: mockChildProcess });

      const result = gitIntegration.isGitAvailable();

      expect(result).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith(
        'git --version',
        expect.objectContaining({
          cwd: process.cwd(),
          stdio: 'pipe',
          encoding: 'utf-8'
        })
      );
    });

    test('should return false when Git is not available', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('git command not found');
      });
      gitIntegration = new GitIntegration({ childProcess: mockChildProcess });

      const result = gitIntegration.isGitAvailable();

      expect(result).toBe(false);
    });

    test('should cache result after first check (success case)', () => {
      mockExecSync.mockReturnValue('git version 2.40.0');
      gitIntegration = new GitIntegration({ childProcess: mockChildProcess });

      // First call
      const result1 = gitIntegration.isGitAvailable();
      expect(result1).toBe(true);
      expect(mockExecSync).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = gitIntegration.isGitAvailable();
      expect(result2).toBe(true);
      expect(mockExecSync).toHaveBeenCalledTimes(1); // No additional call
    });

    test('should cache result after first check (failure case)', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('git command not found');
      });
      gitIntegration = new GitIntegration({ childProcess: mockChildProcess });

      // First call
      const result1 = gitIntegration.isGitAvailable();
      expect(result1).toBe(false);
      expect(mockExecSync).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = gitIntegration.isGitAvailable();
      expect(result2).toBe(false);
      expect(mockExecSync).toHaveBeenCalledTimes(1); // No additional call
    });
  });

  // ========================================================================
  // createAutoSave() Method - Success Cases
  // ========================================================================

  describe('createAutoSave() - Success Cases', () => {
    const validSessionState = {
      sessionId: 'session-2025-11-05-abc123',
      startTime: new Date('2025-11-05T14:00:00.000Z'),
      endTime: new Date('2025-11-05T14:45:00.000Z'),
      currentLocationId: 'village-of-barovia',
      actionCount: 12,
      visitedLocations: ['village-of-barovia', 'blood-of-the-vine-tavern']
    };

    beforeEach(() => {
      // Mock Git available
      mockExecSync.mockReturnValueOnce('git version 2.40.0');
      gitIntegration = new GitIntegration({ childProcess: mockChildProcess });
    });

    test('should create Git commit successfully', () => {
      // Mock git add, git commit, git rev-parse
      // Note: git --version already mocked in beforeEach
      mockExecSync
        .mockReturnValueOnce('') // git add .
        .mockReturnValueOnce('[main abc1234] AUTO-SAVE') // git commit
        .mockReturnValueOnce('abc1234\n'); // git rev-parse --short HEAD

      const result = gitIntegration.createAutoSave(validSessionState);

      expect(result.success).toBe(true);
      expect(result.commitHash).toBe('abc1234');
      expect(result.error).toBeNull();
    });

    test('should call git add with correct arguments', () => {
      mockExecSync
        .mockReturnValueOnce('git version 2.40.0')
        .mockReturnValueOnce('') // git add
        .mockReturnValueOnce('')
        .mockReturnValueOnce('abc1234\n');

      gitIntegration.createAutoSave(validSessionState);

      expect(mockExecSync).toHaveBeenCalledWith(
        'git add .',
        expect.objectContaining({
          cwd: process.cwd(),
          stdio: 'pipe',
          encoding: 'utf-8'
        })
      );
    });

    test('should create commit with properly formatted message', () => {
      mockExecSync
        .mockReturnValueOnce('git version 2.40.0')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('abc1234\n');

      gitIntegration.createAutoSave(validSessionState);

      // Check commit message format
      const commitCall = mockExecSync.mock.calls.find(call =>
        call[0].startsWith('git commit')
      );
      expect(commitCall).toBeDefined();
      expect(commitCall[0]).toContain('[AUTO-SAVE] Session 2025-11-05');
      expect(commitCall[0]).toContain('Location: village-of-barovia');
      expect(commitCall[0]).toContain('Duration: 45 minutes');
      expect(commitCall[0]).toContain('Actions: 12');
    });

    test('should extract short commit hash', () => {
      // Note: git --version already mocked in beforeEach
      mockExecSync
        .mockReturnValueOnce('') // git add
        .mockReturnValueOnce('') // git commit
        .mockReturnValueOnce('abc1234\n'); // git rev-parse (Hash with newline)

      const result = gitIntegration.createAutoSave(validSessionState);

      expect(result.commitHash).toBe('abc1234'); // Trimmed
      expect(mockExecSync).toHaveBeenCalledWith(
        'git rev-parse --short HEAD',
        expect.any(Object)
      );
    });
  });

  // ========================================================================
  // createAutoSave() Method - Error Cases
  // ========================================================================

  describe('createAutoSave() - Error Cases', () => {
    const validSessionState = {
      sessionId: 'session-2025-11-05-abc123',
      startTime: new Date('2025-11-05T14:00:00.000Z'),
      endTime: new Date('2025-11-05T14:45:00.000Z'),
      currentLocationId: 'village-of-barovia',
      actionCount: 12,
      visitedLocations: []
    };

    test('should handle Git not available', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('git command not found');
      });
      gitIntegration = new GitIntegration({ childProcess: mockChildProcess });

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = gitIntegration.createAutoSave(validSessionState);

      expect(result.success).toBe(false);
      expect(result.commitHash).toBeNull();
      expect(result.error).toBe('Git is not installed or not available in PATH');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Auto-save skipped')
      );

      consoleWarnSpy.mockRestore();
    });

    test('should handle not a git repository error', () => {
      mockExecSync
        .mockReturnValueOnce('git version 2.40.0') // isGitAvailable
        .mockImplementation(() => {
          const error = new Error('fatal: not a git repository');
          throw error;
        });

      gitIntegration = new GitIntegration({ childProcess: mockChildProcess });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = gitIntegration.createAutoSave(validSessionState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not a Git repository (.git folder not found)');
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    test('should handle nothing to commit error', () => {
      mockExecSync
        .mockReturnValueOnce('git version 2.40.0')
        .mockReturnValueOnce('') // git add succeeds
        .mockImplementation(() => {
          throw new Error('nothing to commit, working tree clean');
        });

      gitIntegration = new GitIntegration({ childProcess: mockChildProcess });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = gitIntegration.createAutoSave(validSessionState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No changes to commit (everything already saved)');

      consoleWarnSpy.mockRestore();
    });

    test('should handle permission errors', () => {
      mockExecSync
        .mockReturnValueOnce('git version 2.40.0')
        .mockImplementation(() => {
          throw new Error('EACCES: permission denied');
        });

      gitIntegration = new GitIntegration({ childProcess: mockChildProcess });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = gitIntegration.createAutoSave(validSessionState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission error (cannot write to .git folder)');

      consoleWarnSpy.mockRestore();
    });

    test('should handle detached HEAD state', () => {
      mockExecSync
        .mockReturnValueOnce('git version 2.40.0')
        .mockImplementation(() => {
          throw new Error('You are in detached HEAD state');
        });

      gitIntegration = new GitIntegration({ childProcess: mockChildProcess });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = gitIntegration.createAutoSave(validSessionState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Detached HEAD state detected');

      consoleWarnSpy.mockRestore();
    });

    test('should handle merge conflict', () => {
      mockExecSync
        .mockReturnValueOnce('git version 2.40.0')
        .mockImplementation(() => {
          throw new Error('error: you have a merge conflict in progress');
        });

      gitIntegration = new GitIntegration({ childProcess: mockChildProcess });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = gitIntegration.createAutoSave(validSessionState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Merge conflict in progress');

      consoleWarnSpy.mockRestore();
    });

    test('should handle generic Git errors', () => {
      mockExecSync
        .mockReturnValueOnce('git version 2.40.0')
        .mockImplementation(() => {
          throw new Error('Some unexpected Git error');
        });

      gitIntegration = new GitIntegration({ childProcess: mockChildProcess });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = gitIntegration.createAutoSave(validSessionState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Git commit failed (see console for details)');

      consoleWarnSpy.mockRestore();
    });

    test('should handle hash extraction failure gracefully', () => {
      mockExecSync
        .mockReturnValueOnce('git version 2.40.0')
        .mockReturnValueOnce('') // git add
        .mockReturnValueOnce('') // git commit
        .mockImplementation(() => {
          throw new Error('Cannot get hash');
        });

      gitIntegration = new GitIntegration({ childProcess: mockChildProcess });

      const result = gitIntegration.createAutoSave(validSessionState);

      // Should still succeed but with 'unknown' hash
      expect(result.success).toBe(true);
      expect(result.commitHash).toBe('unknown');
    });
  });

  // ========================================================================
  // Helper Methods - Commit Message Building
  // ========================================================================

  describe('_buildCommitMessage()', () => {
    beforeEach(() => {
      gitIntegration = new GitIntegration();
    });

    test('should build message with all fields', () => {
      const sessionState = {
        sessionId: 'session-2025-11-05-abc123',
        startTime: new Date('2025-11-05T14:00:00.000Z'),
        endTime: new Date('2025-11-05T14:45:00.000Z'),
        currentLocationId: 'village-of-barovia',
        actionCount: 12
      };

      const message = gitIntegration._buildCommitMessage(sessionState);

      expect(message).toContain('[AUTO-SAVE] Session 2025-11-05');
      expect(message).toContain('Location: village-of-barovia');
      expect(message).toContain('Duration: 45 minutes');
      expect(message).toContain('Actions: 12');
    });

    test('should extract date from sessionId', () => {
      const sessionState = {
        sessionId: 'session-2025-12-25-xyz',
        startTime: new Date('2025-11-05T14:00:00.000Z'),
        endTime: new Date('2025-11-05T14:45:00.000Z'),
        currentLocationId: 'test-location',
        actionCount: 5
      };

      const message = gitIntegration._buildCommitMessage(sessionState);

      expect(message).toContain('[AUTO-SAVE] Session 2025-12-25');
    });

    test('should handle missing action count', () => {
      const sessionState = {
        sessionId: 'session-2025-11-05-abc',
        startTime: new Date('2025-11-05T14:00:00.000Z'),
        endTime: new Date('2025-11-05T14:30:00.000Z'),
        currentLocationId: 'test-location'
        // actionCount missing
      };

      const message = gitIntegration._buildCommitMessage(sessionState);

      expect(message).toContain('Actions: 0');
    });
  });

  // ========================================================================
  // Helper Methods - Date Extraction
  // ========================================================================

  describe('_extractSessionDate()', () => {
    beforeEach(() => {
      gitIntegration = new GitIntegration();
    });

    test('should extract date from sessionId', () => {
      const sessionState = {
        sessionId: 'session-2025-11-05-abc123'
      };

      const date = gitIntegration._extractSessionDate(sessionState);

      expect(date).toBe('2025-11-05');
    });

    test('should fallback to endTime if sessionId invalid', () => {
      const sessionState = {
        sessionId: 'invalid-id',
        endTime: new Date('2025-12-25T10:00:00.000Z')
      };

      const date = gitIntegration._extractSessionDate(sessionState);

      expect(date).toBe('2025-12-25');
    });

    test('should fallback to current date if both missing', () => {
      const sessionState = {};

      const date = gitIntegration._extractSessionDate(sessionState);

      // Should be today's date in YYYY-MM-DD format
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  // ========================================================================
  // Helper Methods - Location Display Name
  // ========================================================================

  describe('_getLocationDisplayName()', () => {
    beforeEach(() => {
      gitIntegration = new GitIntegration();
    });

    test('should return locationId as-is', () => {
      const name = gitIntegration._getLocationDisplayName('village-of-barovia');

      expect(name).toBe('village-of-barovia');
    });

    test('should handle missing locationId', () => {
      const name = gitIntegration._getLocationDisplayName(null);

      expect(name).toBe('Unknown Location');
    });
  });

  // ========================================================================
  // Helper Methods - Duration Calculation
  // ========================================================================

  describe('_calculateDuration()', () => {
    beforeEach(() => {
      gitIntegration = new GitIntegration();
    });

    test('should calculate duration in minutes', () => {
      const startTime = new Date('2025-11-05T14:00:00.000Z');
      const endTime = new Date('2025-11-05T14:45:00.000Z');

      const duration = gitIntegration._calculateDuration(startTime, endTime);

      expect(duration).toBe(45);
    });

    test('should round duration to nearest minute', () => {
      const startTime = new Date('2025-11-05T14:00:00.000Z');
      const endTime = new Date('2025-11-05T14:00:35.000Z'); // 35 seconds

      const duration = gitIntegration._calculateDuration(startTime, endTime);

      expect(duration).toBe(1); // Rounded up
    });

    test('should handle missing startTime', () => {
      const endTime = new Date('2025-11-05T14:45:00.000Z');

      const duration = gitIntegration._calculateDuration(null, endTime);

      expect(duration).toBe(0);
    });

    test('should handle missing endTime', () => {
      const startTime = new Date('2025-11-05T14:00:00.000Z');

      const duration = gitIntegration._calculateDuration(startTime, null);

      expect(duration).toBe(0);
    });
  });

  // ========================================================================
  // Helper Methods - Message Escaping
  // ========================================================================

  describe('_escapeCommitMessage()', () => {
    beforeEach(() => {
      gitIntegration = new GitIntegration();
    });

    test('should escape double quotes', () => {
      const message = 'Location: "Village"';

      const escaped = gitIntegration._escapeCommitMessage(message);

      expect(escaped).toBe('Location: \\"Village\\"');
    });

    test('should escape backslashes', () => {
      const message = 'Path: C:\\Users\\Kapi';

      const escaped = gitIntegration._escapeCommitMessage(message);

      expect(escaped).toBe('Path: C:\\\\Users\\\\Kapi');
    });

    test('should escape both quotes and backslashes', () => {
      const message = 'Path: "C:\\Users\\Kapi"';

      const escaped = gitIntegration._escapeCommitMessage(message);

      expect(escaped).toBe('Path: \\"C:\\\\Users\\\\Kapi\\"');
    });

    test('should handle message without special characters', () => {
      const message = 'Simple message';

      const escaped = gitIntegration._escapeCommitMessage(message);

      expect(escaped).toBe('Simple message');
    });
  });

  // ========================================================================
  // Helper Methods - Error Parsing
  // ========================================================================

  describe('_parseGitError()', () => {
    beforeEach(() => {
      gitIntegration = new GitIntegration();
    });

    test('should parse "not a git repository" error', () => {
      const error = new Error('fatal: not a git repository');

      const message = gitIntegration._parseGitError(error);

      expect(message).toBe('Not a Git repository (.git folder not found)');
    });

    test('should parse "nothing to commit" error', () => {
      const error = new Error('nothing to commit, working tree clean');

      const message = gitIntegration._parseGitError(error);

      expect(message).toBe('No changes to commit (everything already saved)');
    });

    test('should parse "no changes added" error', () => {
      const error = new Error('no changes added to commit');

      const message = gitIntegration._parseGitError(error);

      expect(message).toBe('No changes to commit (everything already saved)');
    });

    test('should parse permission errors', () => {
      const error = new Error('EACCES: permission denied');

      const message = gitIntegration._parseGitError(error);

      expect(message).toBe('Permission error (cannot write to .git folder)');
    });

    test('should parse detached HEAD error', () => {
      const error = new Error('You are in detached HEAD state');

      const message = gitIntegration._parseGitError(error);

      expect(message).toBe('Detached HEAD state detected');
    });

    test('should parse merge conflict error', () => {
      const error = new Error('error: Merge conflict in file.txt');

      const message = gitIntegration._parseGitError(error);

      expect(message).toBe('Merge conflict in progress');
    });

    test('should handle generic errors', () => {
      const error = new Error('Unknown error occurred');

      const message = gitIntegration._parseGitError(error);

      expect(message).toBe('Git commit failed (see console for details)');
    });
  });
});
