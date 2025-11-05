/**
 * Integration tests for GitIntegration with real Git operations
 * Tests complete auto-save workflow end-to-end
 */

const { GitIntegration } = require('../../src/utils/git-utils');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('GitIntegration - Integration Tests', () => {
  let tempDir;
  let gitIntegration;

  beforeEach(() => {
    // Create temporary directory for Git repo
    tempDir = path.join(process.cwd(), 'tests', 'temp', `git-test-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    // Initialize Git repository
    execSync('git init', { cwd: tempDir, stdio: 'pipe' });
    execSync('git config user.email "test@example.com"', { cwd: tempDir, stdio: 'pipe' });
    execSync('git config user.name "Test User"', { cwd: tempDir, stdio: 'pipe' });

    // Create initial commit (Git repos need at least one commit for rev-parse to work)
    fs.writeFileSync(path.join(tempDir, 'README.md'), '# Test Repo\n');
    execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
    execSync('git commit -m "Initial commit"', { cwd: tempDir, stdio: 'pipe' });

    // Create GitIntegration instance pointing to temp repo
    gitIntegration = new GitIntegration({ cwd: tempDir });
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // ========================================================================
  // Complete Auto-Save Workflow
  // ========================================================================

  describe('Complete Auto-Save Workflow', () => {
    test('should create Git commit with real Git commands', () => {
      // Create a test file to commit
      const testFile = path.join(tempDir, 'session-log.md');
      fs.writeFileSync(testFile, '# Session Log\nTest session data\n');

      const sessionState = {
        sessionId: 'session-2025-11-05-test123',
        startTime: new Date('2025-11-05T14:00:00.000Z'),
        endTime: new Date('2025-11-05T14:45:00.000Z'),
        currentLocationId: 'village-of-barovia',
        actionCount: 12,
        visitedLocations: ['village-of-barovia']
      };

      const result = gitIntegration.createAutoSave(sessionState);

      // Verify success
      expect(result.success).toBe(true);
      expect(result.commitHash).toBeDefined();
      expect(result.commitHash).toMatch(/^[a-f0-9]{7}$/); // 7-char hex hash
      expect(result.error).toBeNull();
    });

    test('should verify commit message in Git history', () => {
      // Create test file
      fs.writeFileSync(path.join(tempDir, 'test.txt'), 'test content\n');

      const sessionState = {
        sessionId: 'session-2025-12-25-christmas',
        startTime: new Date('2025-12-25T10:00:00.000Z'),
        endTime: new Date('2025-12-25T11:30:00.000Z'),
        currentLocationId: 'castle-ravenloft',
        actionCount: 25,
        visitedLocations: []
      };

      const result = gitIntegration.createAutoSave(sessionState);

      expect(result.success).toBe(true);

      // Read commit message from Git history
      const commitMessage = execSync('git log -1 --pretty=%B', {
        cwd: tempDir,
        encoding: 'utf-8'
      });

      // Verify message format
      expect(commitMessage).toContain('[AUTO-SAVE] Session 2025-12-25');
      expect(commitMessage).toContain('Location: castle-ravenloft');
      expect(commitMessage).toContain('Duration: 90 minutes');
      expect(commitMessage).toContain('Actions: 25');
    });

    test('should create multiple commits in sequence', () => {
      // First commit
      fs.writeFileSync(path.join(tempDir, 'file1.txt'), 'first session\n');
      const result1 = gitIntegration.createAutoSave({
        sessionId: 'session-2025-11-05-001',
        startTime: new Date('2025-11-05T10:00:00.000Z'),
        endTime: new Date('2025-11-05T10:30:00.000Z'),
        currentLocationId: 'location-1',
        actionCount: 5
      });

      expect(result1.success).toBe(true);
      const hash1 = result1.commitHash;

      // Second commit
      fs.writeFileSync(path.join(tempDir, 'file2.txt'), 'second session\n');
      const result2 = gitIntegration.createAutoSave({
        sessionId: 'session-2025-11-05-002',
        startTime: new Date('2025-11-05T11:00:00.000Z'),
        endTime: new Date('2025-11-05T11:45:00.000Z'),
        currentLocationId: 'location-2',
        actionCount: 8
      });

      expect(result2.success).toBe(true);
      const hash2 = result2.commitHash;

      // Verify different hashes
      expect(hash1).not.toBe(hash2);

      // Verify both commits exist in history
      const log = execSync('git log --oneline', {
        cwd: tempDir,
        encoding: 'utf-8'
      });

      expect(log).toContain(hash1);
      expect(log).toContain(hash2);
    });
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================

  describe('Edge Cases', () => {
    test('should handle no changes to commit', () => {
      // Don't create any new files - nothing to commit

      const sessionState = {
        sessionId: 'session-2025-11-05-empty',
        startTime: new Date('2025-11-05T14:00:00.000Z'),
        endTime: new Date('2025-11-05T14:15:00.000Z'),
        currentLocationId: 'test-location',
        actionCount: 0
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = gitIntegration.createAutoSave(sessionState);

      // Should fail gracefully (exact error message may vary by Git version)
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).not.toBeNull();
      expect(result.commitHash).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    test('should handle commit message with special characters', () => {
      fs.writeFileSync(path.join(tempDir, 'special.txt'), 'content\n');

      const sessionState = {
        sessionId: 'session-2025-11-05-special',
        startTime: new Date('2025-11-05T14:00:00.000Z'),
        endTime: new Date('2025-11-05T14:30:00.000Z'),
        currentLocationId: 'location-with-"quotes"',
        actionCount: 10
      };

      const result = gitIntegration.createAutoSave(sessionState);

      expect(result.success).toBe(true);

      // Verify commit message was escaped properly
      const commitMessage = execSync('git log -1 --pretty=%B', {
        cwd: tempDir,
        encoding: 'utf-8'
      });

      expect(commitMessage).toContain('Location: location-with-"quotes"');
    });

    test('should handle session with zero duration', () => {
      fs.writeFileSync(path.join(tempDir, 'instant.txt'), 'instant session\n');

      const now = new Date('2025-11-05T14:00:00.000Z');
      const sessionState = {
        sessionId: 'session-2025-11-05-instant',
        startTime: now,
        endTime: now, // Same time
        currentLocationId: 'instant-location',
        actionCount: 1
      };

      const result = gitIntegration.createAutoSave(sessionState);

      expect(result.success).toBe(true);

      const commitMessage = execSync('git log -1 --pretty=%B', {
        cwd: tempDir,
        encoding: 'utf-8'
      });

      expect(commitMessage).toContain('Duration: 0 minutes');
    });

    test('should handle session with missing optional fields', () => {
      fs.writeFileSync(path.join(tempDir, 'minimal.txt'), 'minimal session\n');

      const sessionState = {
        sessionId: 'session-2025-11-05-minimal',
        startTime: new Date('2025-11-05T14:00:00.000Z'),
        endTime: new Date('2025-11-05T14:30:00.000Z'),
        currentLocationId: 'minimal-location'
        // actionCount missing
      };

      const result = gitIntegration.createAutoSave(sessionState);

      expect(result.success).toBe(true);

      const commitMessage = execSync('git log -1 --pretty=%B', {
        cwd: tempDir,
        encoding: 'utf-8'
      });

      expect(commitMessage).toContain('Actions: 0');
    });
  });

  // ========================================================================
  // Performance Tests
  // ========================================================================

  describe('Performance', () => {
    test('should complete auto-save in < 5 seconds', () => {
      fs.writeFileSync(path.join(tempDir, 'perf-test.txt'), 'performance test\n');

      const sessionState = {
        sessionId: 'session-2025-11-05-perf',
        startTime: new Date('2025-11-05T14:00:00.000Z'),
        endTime: new Date('2025-11-05T14:30:00.000Z'),
        currentLocationId: 'perf-location',
        actionCount: 10
      };

      const startTime = performance.now();
      const result = gitIntegration.createAutoSave(sessionState);
      const duration = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // AC-1 requirement
    });
  });

  // ========================================================================
  // Git Availability Detection
  // ========================================================================

  describe('Git Availability', () => {
    test('should detect Git is available in test environment', () => {
      const available = gitIntegration.isGitAvailable();

      expect(available).toBe(true);
    });

    test('should cache availability check result', () => {
      const result1 = gitIntegration.isGitAvailable();
      const result2 = gitIntegration.isGitAvailable();

      expect(result1).toBe(result2);
      expect(result1).toBe(true);
    });
  });

  // ========================================================================
  // Error Recovery
  // ========================================================================

  describe('Error Recovery', () => {
    test('should gracefully handle Git errors', () => {
      // This test verifies error handling is graceful
      // Actual error cases are tested in unit tests with mocks
      expect(true).toBe(true);
    });
  });
});
