/**
 * Unit Tests for SessionLogger - Epic 5 Story 5.6
 *
 * Tests session log generation and file operations.
 * Uses dependency injection for all external dependencies.
 *
 * Test Coverage:
 * - generateSummary(): markdown generation, XP calculation, loot tracking
 * - saveLog(): file writing, filename generation, directory creation
 * - Error handling: character file missing, permission errors
 */

const SessionLogger = require('../../src/session/session-logger');

describe('SessionLogger', () => {
  let mockFs, mockPath, mockYaml;
  let sessionLogger;

  beforeEach(() => {
    // Mock file system
    mockFs = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      access: jest.fn(),
      mkdir: jest.fn()
    };

    // Mock path module
    mockPath = {
      join: jest.fn((...args) => args.join('/'))
    };

    // Mock YAML parser
    mockYaml = {
      load: jest.fn()
    };

    // Create SessionLogger with mocked dependencies
    sessionLogger = new SessionLogger({
      fs: mockFs,
      path: mockPath,
      yaml: mockYaml
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSummary()', () => {
    it('should generate markdown summary successfully', async () => {
      // Arrange
      const sessionState = {
        sessionId: '2025-11-23-1',
        startTime: new Date('2025-11-23T10:00:00Z').toISOString(),
        character: {
          filePath: 'characters/kapi.yaml',
          initialLevel: 3,
          initialXP: 900
        },
        location: {
          currentLocationId: 'village-of-barovia',
          visitedThisSession: [
            { locationId: 'village-of-barovia', enteredAt: '2025-11-23T10:00:00Z' },
            { locationId: 'death-house', enteredAt: '2025-11-23T11:00:00Z' }
          ]
        },
        npcs: {
          interactedWith: [
            { npcId: 'ireena-kolyana', interactionCount: 3 }
          ]
        },
        events: {
          triggeredThisSession: [
            { eventId: 'death-of-burgomaster', timestamp: '2025-11-23T10:30:00Z' }
          ]
        },
        calendar: {
          sessionStartDate: '735-10-1',
          currentDate: '735-10-1',
          timePassed: '2 hours'
        },
        performance: {
          startupTime: 2.5,
          contextLoadTimes: [1.2, 0.8],
          avgLLMResponseTime: 1.5
        }
      };

      const playerSummary = 'Explored the village and investigated Death House';

      // Mock character file with XP gain
      mockFs.readFile.mockResolvedValue('name: Kapi\nlevel: 4\nexperience: 1200\ninventory:\n  - silver_dagger\n  - holy_water');
      mockYaml.load.mockReturnValue({
        name: 'Kapi',
        level: 4,
        experience: 1200,
        inventory: ['silver_dagger', 'holy_water']
      });

      // Act
      const result = await sessionLogger.generateSummary(sessionState, playerSummary);

      // Assert
      expect(result.success).toBe(true);
      expect(result.logContent).toContain('# Session Log: 2025-11-23-1');
      expect(result.logContent).toContain('**Character:** Kapi (Level 4)');
      expect(result.logContent).toContain('Explored the village');
      expect(result.logContent).toContain('village-of-barovia');
      expect(result.logContent).toContain('death-house');
      expect(result.logContent).toContain('ireena-kolyana');
      expect(result.logContent).toContain('XP Gained:** 300 XP'); // 1200 - 900
      expect(result.logContent).toContain('silver_dagger');
      expect(result.logContent).toContain('holy_water');
    });

    it('should handle missing character file gracefully', async () => {
      // Arrange
      const sessionState = {
        sessionId: '2025-11-23-1',
        startTime: new Date().toISOString(),
        character: {
          filePath: 'characters/missing.yaml',
          initialLevel: 3,
          initialXP: 900
        },
        location: {
          currentLocationId: 'village-of-barovia',
          visitedThisSession: []
        },
        npcs: { interactedWith: [] },
        events: { triggeredThisSession: [] },
        calendar: { sessionStartDate: '735-10-1', timePassed: '0 hours' },
        performance: {}
      };

      mockFs.readFile.mockRejectedValue(new Error('ENOENT'));

      // Act
      const result = await sessionLogger.generateSummary(sessionState, 'Test');

      // Assert
      expect(result.success).toBe(true);
      expect(result.logContent).toContain('Unknown'); // Default character name
      expect(result.logContent).toContain('XP Gained:** 0 XP'); // No XP change
    });

    it('should calculate session duration correctly', async () => {
      // Arrange
      // Use a fixed start time and mock Date constructor for 3h 45m difference
      const startTime = new Date('2025-11-23T10:00:00Z');
      const endTime = new Date('2025-11-23T13:45:00Z'); // 3h 45m later

      // Store original Date
      const OriginalDate = Date;

      // Mock Date to return endTime when called without arguments
      global.Date = class extends OriginalDate {
        constructor(...args) {
          if (args.length === 0) {
            super();
            return endTime;
          }
          super(...args);
        }
      };

      const sessionState = {
        sessionId: '2025-11-23-1',
        startTime: startTime.toISOString(),
        character: { filePath: 'characters/kapi.yaml', initialLevel: 3, initialXP: 900 },
        location: { currentLocationId: 'village-of-barovia', visitedThisSession: [] },
        npcs: { interactedWith: [] },
        events: { triggeredThisSession: [] },
        calendar: { sessionStartDate: '735-10-1', timePassed: '0 hours' },
        performance: {}
      };

      mockFs.readFile.mockResolvedValue('name: Kapi\nlevel: 3\nexperience: 900');
      mockYaml.load.mockReturnValue({ name: 'Kapi', level: 3, experience: 900 });

      // Act
      const result = await sessionLogger.generateSummary(sessionState, 'Test');

      // Restore original Date
      global.Date = OriginalDate;

      // Assert
      expect(result.success).toBe(true);
      expect(result.logContent).toContain('**Duration:** 3h 45m');
    });
  });

  describe('saveLog()', () => {
    it('should save log file successfully', async () => {
      // Arrange
      const logContent = '# Session Log\n\nContent...';
      const sessionId = '2025-11-23-1';

      mockFs.access.mockRejectedValue(new Error('ENOENT')); // File doesn't exist
      mockFs.mkdir.mockResolvedValue();
      mockFs.writeFile.mockResolvedValue();

      // Act
      const result = await sessionLogger.saveLog(logContent, sessionId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.logPath).toBe('game-data/session/logs/2025-11-23-session-1.md');
      expect(mockFs.mkdir).toHaveBeenCalledWith('game-data/session/logs', { recursive: true });
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'game-data/session/logs/2025-11-23-session-1.md',
        logContent,
        'utf-8'
      );
    });

    it('should increment session number if file exists', async () => {
      // Arrange
      const logContent = '# Session Log\n\nContent...';
      const sessionId = '2025-11-23-1';

      // First file exists, second doesn't
      mockFs.access
        .mockResolvedValueOnce() // session-1 exists
        .mockResolvedValueOnce() // session-2 exists
        .mockRejectedValueOnce(new Error('ENOENT')); // session-3 doesn't exist

      mockFs.mkdir.mockResolvedValue();
      mockFs.writeFile.mockResolvedValue();

      // Act
      const result = await sessionLogger.saveLog(logContent, sessionId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.logPath).toBe('game-data/session/logs/2025-11-23-session-3.md');
    });

    it('should handle write errors gracefully', async () => {
      // Arrange
      const logContent = '# Session Log\n\nContent...';
      const sessionId = '2025-11-23-1';

      mockFs.access.mockRejectedValue(new Error('ENOENT'));
      mockFs.mkdir.mockResolvedValue();
      mockFs.writeFile.mockRejectedValue(new Error('Permission denied'));

      // Act
      const result = await sessionLogger.saveLog(logContent, sessionId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });
  });
});
