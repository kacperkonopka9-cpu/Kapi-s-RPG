/**
 * Unit Tests for GitIntegration - Epic 5 Story 5.6
 *
 * Tests Git operations for session management: commits, save points, rollbacks.
 * Uses dependency injection to mock execSync.
 *
 * Test Coverage:
 * - checkGitAvailable(): Git version check, repository check
 * - commitSession(): file staging, commit message format, error handling
 * - createSavePoint(): tag creation, tag validation
 * - listSavePoints(): tag parsing, date formatting
 * - rollbackToSave(): checkout operation, validation
 * - Error handling: Git not installed, not a repository, commit failures
 */

const GitIntegration = require('../../src/session/git-integration');

describe('GitIntegration', () => {
  let mockExecSync;
  let gitIntegration;

  beforeEach(() => {
    // Mock child_process.execSync
    mockExecSync = jest.fn();

    // Create GitIntegration with mocked execSync
    gitIntegration = new GitIntegration({
      execSync: mockExecSync,
      projectRoot: '/test/project'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkGitAvailable()', () => {
    it('should return success if Git is available and repo initialized', async () => {
      // Arrange
      mockExecSync
        .mockReturnValueOnce('git version 2.40.0\n') // git --version
        .mockReturnValueOnce('true\n'); // git rev-parse --is-inside-work-tree

      // Act
      const result = await gitIntegration.checkGitAvailable();

      // Assert
      expect(result.success).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith('git --version', expect.any(Object));
      expect(mockExecSync).toHaveBeenCalledWith('git rev-parse --is-inside-work-tree', expect.any(Object));
    });

    it('should return error if Git is not installed', async () => {
      // Arrange
      mockExecSync.mockImplementation(() => {
        throw new Error('command not found: git');
      });

      // Act
      const result = await gitIntegration.checkGitAvailable();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Git not installed');
    });

    it('should return error if not a Git repository', async () => {
      // Arrange
      mockExecSync
        .mockReturnValueOnce('git version 2.40.0\n') // git --version OK
        .mockImplementation(() => {
          throw new Error('fatal: not a git repository');
        });

      // Act
      const result = await gitIntegration.checkGitAvailable();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not a Git repository');
    });
  });

  describe('commitSession()', () => {
    it('should commit session successfully', async () => {
      // Arrange
      const sessionState = {
        sessionId: '2025-11-23-1',
        character: {
          filePath: 'characters/kapi.yaml'
        },
        location: {
          currentLocationId: 'village-of-barovia',
          visitedThisSession: [
            { locationId: 'village-of-barovia', enteredAt: '2025-11-23T10:00:00Z' }
          ]
        },
        logFile: 'game-data/session/logs/2025-11-23-session-1.md'
      };

      const summary = 'Explored the village';

      mockExecSync.mockImplementation((cmd) => {
        if (cmd.includes('git --version')) {
          return 'git version 2.40.0\n';
        } else if (cmd.includes('git rev-parse')) {
          return 'true\n';
        } else if (cmd.includes('git commit')) {
          return '[main abc123] [SESSION] 2025-11-23 | village-of-barovia | Explored the village\n';
        } else if (cmd.includes('git add')) {
          return ''; // git add returns empty on success
        }
        return '';
      });

      // Act
      const result = await gitIntegration.commitSession(sessionState, summary);

      // Assert
      expect(result.success).toBe(true);
      expect(result.commitHash).toBe('abc123');
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('git add'),
        expect.any(Object)
      );
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('git commit'),
        expect.any(Object)
      );
    });

    it('should handle commit failure gracefully', async () => {
      // Arrange
      const sessionState = {
        sessionId: '2025-11-23-1',
        character: { filePath: 'characters/kapi.yaml' },
        location: {
          currentLocationId: 'village-of-barovia',
          visitedThisSession: []
        }
      };

      mockExecSync
        .mockReturnValueOnce('git version 2.40.0\n')
        .mockReturnValueOnce('true\n')
        .mockReturnValue('') // git add OK
        .mockImplementation((cmd) => {
          if (cmd.includes('git commit')) {
            throw new Error('nothing to commit');
          }
          return '';
        });

      // Act
      const result = await gitIntegration.commitSession(sessionState, 'Test');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Git commit failed');
    });

    it('should format commit message correctly', async () => {
      // Arrange
      const sessionState = {
        sessionId: '2025-11-23-1',
        character: { filePath: 'characters/kapi.yaml' },
        location: {
          currentLocationId: 'castle-ravenloft',
          visitedThisSession: []
        }
      };

      const summary = 'Entered Castle Ravenloft and confronted Strahd';

      mockExecSync.mockImplementation((cmd) => {
        if (cmd.includes('git --version')) {
          return 'git version 2.40.0\n';
        } else if (cmd.includes('git rev-parse')) {
          return 'true\n';
        } else if (cmd.includes('git commit')) {
          return '[main abc123] commit message\n';
        } else if (cmd.includes('git add')) {
          return '';
        }
        return '';
      });

      // Act
      await gitIntegration.commitSession(sessionState, summary);

      // Assert
      const commitCall = mockExecSync.mock.calls.find(call =>
        call[0].includes('git commit')
      );
      expect(commitCall[0]).toContain('[SESSION] 2025-11-23');
      expect(commitCall[0]).toContain('castle-ravenloft');
      expect(commitCall[0]).toContain('Entered Castle Ravenloft and confronted Strahd');
      expect(commitCall[0]).toContain('Co-Authored-By: Claude');
    });

    it('should truncate long summaries to 72 characters', async () => {
      // Arrange
      const sessionState = {
        sessionId: '2025-11-23-1',
        character: { filePath: 'characters/kapi.yaml' },
        location: { currentLocationId: 'village', visitedThisSession: [] }
      };

      const longSummary = 'This is a very long summary that exceeds the standard Git commit message length of 72 characters';

      mockExecSync.mockImplementation((cmd) => {
        if (cmd.includes('git --version')) {
          return 'git version 2.40.0\n';
        } else if (cmd.includes('git rev-parse')) {
          return 'true\n';
        } else if (cmd.includes('git commit')) {
          return '[main abc123] commit\n';
        } else if (cmd.includes('git add')) {
          return '';
        }
        return '';
      });

      // Act
      await gitIntegration.commitSession(sessionState, longSummary);

      // Assert
      const commitCall = mockExecSync.mock.calls.find(call =>
        call[0].includes('git commit')
      );
      const commitMessage = commitCall[0];
      expect(commitMessage).toContain('...');
      // First line should be truncated: [SESSION] + date + location + truncated summary
      // Max should be around 110 chars ([SESSION] YYYY-MM-DD | location | 72char summary...)
      const firstLine = commitMessage.split('\n')[0];
      expect(firstLine.length).toBeLessThanOrEqual(120); // Allow for prefix + 72 char truncated summary
    });
  });

  describe('createSavePoint()', () => {
    it('should create Git tag successfully', async () => {
      // Arrange
      const saveName = 'pre-castle-assault';
      const description = 'Level 5, before entering Castle Ravenloft';

      mockExecSync
        .mockReturnValueOnce('git version 2.40.0\n')
        .mockReturnValueOnce('true\n')
        .mockReturnValueOnce('') // git tag -l (check if exists, returns empty = doesn't exist)
        .mockReturnValueOnce(''); // git tag -a (create tag)

      // Act
      const result = await gitIntegration.createSavePoint(saveName, description);

      // Assert
      expect(result.success).toBe(true);
      expect(result.tag).toBe('save/pre-castle-assault');
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('git tag -a "save/pre-castle-assault"'),
        expect.any(Object)
      );
    });

    it('should sanitize save names', async () => {
      // Arrange
      const unsafeName = 'before @#$ dangerous "location"';
      const description = 'Test save';

      mockExecSync
        .mockReturnValueOnce('git version 2.40.0\n')
        .mockReturnValueOnce('true\n')
        .mockReturnValueOnce('') // git tag -l (check if exists)
        .mockReturnValueOnce(''); // git tag -a (create tag)

      // Act
      const result = await gitIntegration.createSavePoint(unsafeName, description);

      // Assert
      expect(result.success).toBe(true);
      expect(result.tag).toMatch(/^save\/[a-z0-9-_]+$/);
    });

    it('should handle tag already exists error', async () => {
      // Arrange
      mockExecSync
        .mockReturnValueOnce('git version 2.40.0\n')
        .mockReturnValueOnce('true\n')
        .mockImplementation(() => {
          throw new Error('tag already exists');
        });

      // Act
      const result = await gitIntegration.createSavePoint('existing-save', 'Test');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('listSavePoints()', () => {
    it('should list all save point tags', async () => {
      // Arrange
      // Git tag output format: "tag|description|date" (one per line)
      const gitTagOutput = `save/pre-castle-assault|Level 5, before Castle Ravenloft|2025-11-23
save/vallaki-festival|Level 4, during festival|2025-11-20
save/amber-temple-entrance|Level 6, entering Amber Temple|2025-11-25`;

      mockExecSync
        .mockReturnValueOnce('git version 2.40.0\n')
        .mockReturnValueOnce('true\n')
        .mockReturnValueOnce(gitTagOutput);

      // Act
      const result = await gitIntegration.listSavePoints();

      // Assert
      expect(result.success).toBe(true);
      expect(result.savePoints).toHaveLength(3);
      expect(result.savePoints[0].tag).toBe('save/pre-castle-assault');
      expect(result.savePoints[1].tag).toBe('save/vallaki-festival');
      expect(result.savePoints[2].tag).toBe('save/amber-temple-entrance');
    });

    it('should return empty array if no save points', async () => {
      // Arrange
      mockExecSync
        .mockReturnValueOnce('git version 2.40.0\n')
        .mockReturnValueOnce('true\n')
        .mockReturnValueOnce(''); // No tags

      // Act
      const result = await gitIntegration.listSavePoints();

      // Assert
      expect(result.success).toBe(true);
      expect(result.savePoints).toEqual([]);
    });
  });

  describe('rollbackToSave()', () => {
    it('should checkout save point tag successfully', async () => {
      // Arrange
      const tag = 'save/pre-castle-assault';

      mockExecSync
        .mockReturnValueOnce('git version 2.40.0\n')
        .mockReturnValueOnce('true\n')
        .mockReturnValueOnce('save/pre-castle-assault\n') // git tag -l (verify exists)
        .mockReturnValueOnce('Switched to tag "save/pre-castle-assault"\n'); // git checkout

      // Act
      const result = await gitIntegration.rollbackToSave(tag);

      // Assert
      expect(result.success).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining(`git checkout "${tag}"`),
        expect.any(Object)
      );
    });

    it('should handle checkout failure', async () => {
      // Arrange
      mockExecSync
        .mockReturnValueOnce('git version 2.40.0\n')
        .mockReturnValueOnce('true\n')
        .mockImplementation(() => {
          throw new Error('pathspec did not match');
        });

      // Act
      const result = await gitIntegration.rollbackToSave('save/nonexistent');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('pathspec did not match');
    });
  });
});
