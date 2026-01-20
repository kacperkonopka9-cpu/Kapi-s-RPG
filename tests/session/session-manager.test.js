/**
 * Unit Tests for SessionManager - Epic 5 Story 5.6
 *
 * Tests session lifecycle management: initialization, state tracking, termination.
 * Uses dependency injection for all external dependencies.
 *
 * Test Coverage:
 * - startSession(): validation, file creation, auto-save setup, session already active
 * - endSession(): log generation, Git commit, history update, cleanup
 * - updateSession(): deep merge, atomic updates, validation
 * - getCurrentSession(): file reading, YAML parsing, corrupted file handling
 * - Error handling: permission errors, corrupted YAML, missing fields
 */

const SessionManager = require('../../src/session/session-manager');

describe('SessionManager', () => {
  let mockFs, mockPath, mockYaml, mockCalendarManager, mockSessionLogger, mockGitIntegration;
  let sessionManager;

  beforeEach(() => {
    // Mock file system
    mockFs = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      access: jest.fn(),
      mkdir: jest.fn(),
      unlink: jest.fn()
    };

    // Mock path module
    mockPath = {
      join: jest.fn((...args) => args.join('/')),
      relative: jest.fn((from, to) => to)
    };

    // Mock YAML parser
    mockYaml = {
      load: jest.fn(),
      dump: jest.fn()
    };

    // Mock CalendarManager
    mockCalendarManager = {
      getCalendarState: jest.fn()
    };

    // Mock SessionLogger
    mockSessionLogger = {
      generateSummary: jest.fn(),
      saveLog: jest.fn()
    };

    // Mock GitIntegration
    mockGitIntegration = {
      commitSession: jest.fn()
    };

    // Create SessionManager with mocked dependencies
    sessionManager = new SessionManager({
      fs: mockFs,
      path: mockPath,
      yaml: mockYaml,
      sessionDir: 'game-data/session',
      calendarManager: mockCalendarManager,
      sessionLogger: mockSessionLogger,
      gitIntegration: mockGitIntegration
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startSession()', () => {
    it('should create a new session successfully', async () => {
      // Arrange
      const characterPath = 'characters/kapi.yaml';
      const locationId = 'village-of-barovia';

      // Mock no existing session (getCurrentSession checks access)
      mockFs.access.mockRejectedValueOnce(new Error('ENOENT'));

      // Mock character file read (read twice: once for parsing, once for hash)
      const characterContent = 'name: Kapi\nlevel: 3\nclass: Cleric\nexperience: 900';
      mockFs.readFile
        .mockResolvedValueOnce(characterContent) // First read for parsing
        .mockResolvedValueOnce(characterContent); // Second read for hash
      mockYaml.load.mockReturnValueOnce({
        name: 'Kapi',
        level: 3,
        class: 'Cleric',
        experience: 900
      });

      // Mock location exists
      mockFs.access.mockResolvedValueOnce();

      // Mock calendar state
      mockCalendarManager.getCalendarState.mockResolvedValue({
        success: true,
        data: {
          current: {
            date: '735-10-1',
            time: '08:00'
          }
        }
      });

      // Mock successful file write
      mockYaml.dump.mockReturnValue('sessionId: 2025-11-23-1\n...');
      mockFs.writeFile.mockResolvedValue();

      // Act
      const result = await sessionManager.startSession(characterPath, locationId, 300);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sessionId).toMatch(/^\d{4}-\d{2}-\d{2}-\d+$/);
      expect(result.data).toBeDefined();
      expect(result.data.character.filePath).toBe(characterPath);
      expect(result.data.character.initialLevel).toBe(3);
      expect(result.data.character.initialXP).toBe(900);
      expect(result.data.location.currentLocationId).toBe(locationId);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'game-data/session/current-session.yaml',
        expect.any(String),
        'utf-8'
      );
    });

    it('should reject if session is already active', async () => {
      // Arrange
      mockFs.access.mockResolvedValueOnce(); // current-session.yaml exists
      mockFs.readFile.mockResolvedValue('sessionId: existing\n...');
      mockYaml.load.mockReturnValue({
        sessionId: 'existing',
        character: { filePath: 'characters/kapi.yaml' },
        location: { currentLocationId: 'vallaki' }
      });

      // Act
      const result = await sessionManager.startSession('characters/kapi.yaml', 'village-of-barovia', 300);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('already active');
    });

    it('should validate character file exists', async () => {
      // Arrange
      mockFs.access.mockRejectedValueOnce(new Error('ENOENT')); // No existing session
      mockFs.readFile.mockRejectedValueOnce(new Error('ENOENT')); // Character not found

      // Act
      const result = await sessionManager.startSession('characters/missing.yaml', 'village-of-barovia', 300);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to load character file');
    });

    it('should validate location exists', async () => {
      // Arrange
      mockFs.access.mockRejectedValueOnce(new Error('ENOENT')); // No existing session
      mockFs.readFile.mockResolvedValueOnce('name: Kapi'); // Character file OK
      mockYaml.load.mockReturnValueOnce({ name: 'Kapi', level: 3 });
      mockFs.access.mockRejectedValueOnce(new Error('ENOENT')); // Location not found

      // Act
      const result = await sessionManager.startSession('characters/kapi.yaml', 'missing-location', 300);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Location not found');
    });

    it('should handle permission errors gracefully', async () => {
      // Arrange
      mockFs.access.mockRejectedValueOnce(new Error('ENOENT')); // No existing session

      const characterContent = 'name: Kapi\nlevel: 3';
      mockFs.readFile
        .mockResolvedValueOnce(characterContent) // First read for parsing
        .mockResolvedValueOnce(characterContent); // Second read for hash
      mockYaml.load.mockReturnValueOnce({ name: 'Kapi', level: 3, experience: 0 });
      mockFs.access.mockResolvedValueOnce(); // Location exists
      mockCalendarManager.getCalendarState.mockResolvedValue({
        success: true,
        data: { current: { date: '735-10-1', time: '08:00' } }
      });
      mockYaml.dump.mockReturnValue('session yaml');

      const permError = new Error('Permission denied');
      permError.code = 'EACCES';
      mockFs.writeFile.mockRejectedValueOnce(permError);

      // Act
      const result = await sessionManager.startSession('characters/kapi.yaml', 'village-of-barovia', 300);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });
  });

  describe('endSession()', () => {
    beforeEach(() => {
      // Setup current session
      const mockSession = {
        sessionId: '2025-11-23-1',
        startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        character: {
          filePath: 'characters/kapi.yaml',
          initialLevel: 3,
          initialXP: 900
        },
        location: {
          currentLocationId: 'village-of-barovia',
          visitedThisSession: [
            { locationId: 'village-of-barovia', enteredAt: new Date().toISOString() }
          ]
        },
        calendar: {
          sessionStartDate: '735-10-1',
          currentDate: '735-10-1',
          timePassed: '2 hours'
        }
      };

      mockFs.access.mockResolvedValue(); // Session file exists
      mockFs.readFile.mockResolvedValue('session yaml');
      mockYaml.load.mockReturnValue(mockSession);
    });

    it('should end session successfully', async () => {
      // Arrange
      const playerSummary = 'Explored the village';

      mockSessionLogger.generateSummary.mockResolvedValue({
        success: true,
        logContent: '# Session Log\n\nExplored the village'
      });

      mockSessionLogger.saveLog.mockResolvedValue({
        success: true,
        logPath: 'game-data/session/logs/2025-11-23-session-1.md'
      });

      mockGitIntegration.commitSession.mockResolvedValue({
        success: true,
        commitHash: 'abc123'
      });

      // Note: beforeEach already sets up mockFs.readFile for session yaml
      // _appendSessionHistory will call readFile again for session-history.yaml
      // Chain the mocks properly
      mockFs.readFile
        .mockResolvedValueOnce('session yaml') // getCurrentSession reads current-session.yaml
        .mockResolvedValueOnce('sessions: []'); // _appendSessionHistory reads session-history.yaml

      mockYaml.load
        .mockReturnValueOnce({ // getCurrentSession parses session state
          sessionId: '2025-11-23-1',
          startTime: new Date(Date.now() - 3600000).toISOString(),
          character: {
            filePath: 'characters/kapi.yaml',
            initialLevel: 3,
            initialXP: 900
          },
          location: {
            currentLocationId: 'village-of-barovia',
            visitedThisSession: [
              { locationId: 'village-of-barovia', enteredAt: new Date().toISOString() }
            ]
          },
          npcs: { interactedWith: [] },
          calendar: {
            sessionStartDate: '735-10-1',
            currentDate: '735-10-1',
            timePassed: '2 hours'
          }
        })
        .mockReturnValueOnce({ sessions: [] }); // _appendSessionHistory parses history

      mockYaml.dump.mockReturnValue('sessions:\n  - sessionId: 2025-11-23-1');
      mockFs.writeFile.mockResolvedValue();
      mockFs.unlink.mockResolvedValue();

      // Act
      const result = await sessionManager.endSession(playerSummary);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sessionSummary).toContain('Explored the village');
      expect(result.logPath).toContain('2025-11-23-session-1.md');
      expect(result.gitCommit).toBe('abc123');
      expect(mockSessionLogger.generateSummary).toHaveBeenCalled();
      expect(mockGitIntegration.commitSession).toHaveBeenCalled();
      expect(mockFs.unlink).toHaveBeenCalledWith('game-data/session/current-session.yaml');
    });

    it('should handle missing session gracefully', async () => {
      // Arrange
      mockFs.access.mockRejectedValueOnce(new Error('ENOENT')); // No session file

      // Act
      const result = await sessionManager.endSession('Test summary');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('No active session');
    });

    it('should continue even if Git commit fails', async () => {
      // Arrange
      mockSessionLogger.generateSummary.mockResolvedValue({
        success: true,
        logContent: '# Session Log\n\nTest summary'
      });

      mockSessionLogger.saveLog.mockResolvedValue({
        success: true,
        logPath: 'game-data/session/logs/2025-11-23-session-1.md'
      });

      // Git commit fails
      mockGitIntegration.commitSession.mockResolvedValue({
        success: false,
        error: 'Git not available'
      });

      // Chain the mocks properly for the full flow
      mockFs.readFile
        .mockResolvedValueOnce('session yaml') // getCurrentSession reads current-session.yaml
        .mockResolvedValueOnce('sessions: []'); // _appendSessionHistory reads session-history.yaml

      mockYaml.load
        .mockReturnValueOnce({ // getCurrentSession parses session state
          sessionId: '2025-11-23-1',
          startTime: new Date(Date.now() - 3600000).toISOString(),
          character: {
            filePath: 'characters/kapi.yaml',
            initialLevel: 3,
            initialXP: 900
          },
          location: {
            currentLocationId: 'village-of-barovia',
            visitedThisSession: [
              { locationId: 'village-of-barovia', enteredAt: new Date().toISOString() }
            ]
          },
          npcs: { interactedWith: [] },
          calendar: {
            sessionStartDate: '735-10-1',
            currentDate: '735-10-1',
            timePassed: '2 hours'
          }
        })
        .mockReturnValueOnce({ sessions: [] }); // _appendSessionHistory parses history

      mockYaml.dump.mockReturnValue('sessions yaml');
      mockFs.writeFile.mockResolvedValue();
      mockFs.unlink.mockResolvedValue();

      // Act
      const result = await sessionManager.endSession('Test');

      // Assert - session should still succeed even if Git commit fails
      expect(result.success).toBe(true);
      // gitCommit should be null when Git fails (not a string containing "Failed")
      expect(result.gitCommit).toBeNull();
    });
  });

  describe('updateSession()', () => {
    it('should update session with deep merge', async () => {
      // Arrange - setup complete mock chain
      const mockSession = {
        sessionId: '2025-11-23-1',
        character: { filePath: 'characters/kapi.yaml' },
        location: {
          currentLocationId: 'village-of-barovia',
          visitedThisSession: []
        },
        calendar: {
          timePassed: '0 hours'
        },
        lastActivity: '2025-11-23T10:00:00Z'
      };

      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue('session yaml');
      mockYaml.load.mockReturnValue(mockSession);

      const updates = {
        location: {
          currentLocationId: 'vallaki',
          visitedThisSession: [
            { locationId: 'vallaki', enteredAt: '2025-11-23T11:00:00Z' }
          ]
        },
        calendar: {
          timePassed: '2 hours'
        }
      };

      mockYaml.dump.mockReturnValue('updated session yaml');
      mockFs.writeFile.mockResolvedValue();

      // Act
      const result = await sessionManager.updateSession(updates);

      // Assert
      expect(result.success).toBe(true);
      expect(mockYaml.dump).toHaveBeenCalledWith(
        expect.objectContaining({
          location: expect.objectContaining({
            currentLocationId: 'vallaki'
          }),
          calendar: expect.objectContaining({
            timePassed: '2 hours'
          })
        }),
        expect.any(Object)
      );
    });

    it('should reject if no active session', async () => {
      // Arrange
      mockFs.access.mockRejectedValueOnce(new Error('ENOENT'));

      // Act
      const result = await sessionManager.updateSession({ test: 'value' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('No active session');
    });
  });

  describe('getCurrentSession()', () => {
    it('should return session if exists', async () => {
      // Arrange
      const mockSession = {
        sessionId: '2025-11-23-1',
        character: { filePath: 'characters/kapi.yaml' },
        location: { currentLocationId: 'village-of-barovia' }
      };

      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue('session yaml');
      mockYaml.load.mockReturnValue(mockSession);

      // Act
      const result = await sessionManager.getCurrentSession();

      // Assert
      expect(result).toEqual(mockSession);
    });

    it('should return null if session file does not exist', async () => {
      // Arrange
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      // Act
      const result = await sessionManager.getCurrentSession();

      // Assert
      expect(result).toBeNull();
    });

    it('should handle corrupted YAML gracefully', async () => {
      // Arrange
      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue('invalid: yaml: content: [');
      mockYaml.load.mockImplementation(() => {
        throw new Error('YAML parse error');
      });

      // Act
      const result = await sessionManager.getCurrentSession();

      // Assert
      expect(result).toBeNull();
    });

    it('should validate session state schema', async () => {
      // Arrange
      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue('invalid session');
      mockYaml.load.mockReturnValue({
        sessionId: '2025-11-23-1'
        // Missing character and location
      });

      // Act
      const result = await sessionManager.getCurrentSession();

      // Assert
      expect(result).toBeNull();
    });

    it('should handle permission errors', async () => {
      // Arrange
      mockFs.access.mockResolvedValue();
      const permError = new Error('Permission denied');
      permError.code = 'EACCES';
      mockFs.readFile.mockRejectedValue(permError);

      // Act
      const result = await sessionManager.getCurrentSession();

      // Assert
      expect(result).toBeNull();
    });
  });
});
