/**
 * Integration Tests for Session Logging
 * Tests complete session workflow with real file system operations
 *
 * Tests AC-1 through AC-8 with actual file I/O
 */

const { SessionLogger } = require('../../src/core/session-logger');
const fs = require('fs');
const path = require('path');

describe('Session Logging Integration', () => {
  const testLogsDir = path.join(process.cwd(), 'test-logs');
  let logger;

  beforeAll(() => {
    // Create test logs directory
    if (!fs.existsSync(testLogsDir)) {
      fs.mkdirSync(testLogsDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Cleanup test logs directory
    if (fs.existsSync(testLogsDir)) {
      fs.rmSync(testLogsDir, { recursive: true });
    }
  });

  beforeEach(() => {
    // Clean up any log files from previous test
    if (fs.existsSync(testLogsDir)) {
      const files = fs.readdirSync(testLogsDir);
      files.forEach(file => {
        const filePath = path.join(testLogsDir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true });
        } else {
          fs.unlinkSync(filePath);
        }
      });
    }

    logger = new SessionLogger(testLogsDir);
  });

  // ========================================================================
  // Complete Session Workflow (AC-1, AC-2, AC-3, AC-5)
  // ========================================================================

  describe('Complete Session Workflow', () => {
    test('should create log file and write complete session', () => {
      // Initialize session
      const logPath = logger.initializeLog('integration-test-session');
      expect(logPath).toContain('session-2025-11-05.md');
      expect(fs.existsSync(logPath)).toBe(true);

      // Log multiple actions
      logger.log({
        type: 'start',
        locationId: 'village-of-barovia',
        narrative: 'You find yourself at the gates of a misty village...',
        tokensUsed: 245
      });

      logger.log({
        type: 'travel',
        locationId: 'blood-of-the-vine-tavern',
        narrative: 'You push open the creaking door of the tavern...',
        tokensUsed: 189
      });

      logger.log({
        type: 'look',
        locationId: 'blood-of-the-vine-tavern',
        narrative: 'The tavern is dimly lit with a few patrons hunched over their drinks...',
        tokensUsed: 156
      });

      // Finalize session
      const finalPath = logger.finalize();
      expect(finalPath).toBe(logPath);

      // Verify file contents
      const logContent = fs.readFileSync(logPath, 'utf8');

      // Check header
      expect(logContent).toContain('# Game Session Log');
      expect(logContent).toContain('Session: integration-test-session');
      expect(logContent).toContain('Start Time**:');

      // Check action entries
      expect(logContent).toContain('Action: start');
      expect(logContent).toContain('Location**: village-of-barovia');
      expect(logContent).toContain('Tokens**: 245');

      expect(logContent).toContain('Action: travel');
      expect(logContent).toContain('Location**: blood-of-the-vine-tavern');
      expect(logContent).toContain('Tokens**: 189');

      expect(logContent).toContain('Action: look');
      expect(logContent).toContain('Tokens**: 156');

      // Check summary
      expect(logContent).toContain('Session Summary');
      expect(logContent).toContain('Total Actions**: 3');
      expect(logContent).toContain('Total Tokens**: 590'); // 245 + 189 + 156
      expect(logContent).toContain('Duration**:');
      expect(logContent).toContain('End Time**:');
    });

    test('should append to existing file with session separator (multiple sessions same day)', () => {
      // First session
      logger.initializeLog('session-1');
      logger.log({ type: 'start', locationId: 'loc1', narrative: 'First session' });
      const logPath = logger.finalize();

      // Second session (same day)
      const logger2 = new SessionLogger(testLogsDir);
      logger2.initializeLog('session-2');
      logger2.log({ type: 'start', locationId: 'loc2', narrative: 'Second session' });
      logger2.finalize();

      // Verify both sessions in file
      const logContent = fs.readFileSync(logPath, 'utf8');

      expect(logContent).toContain('Session: session-1');
      expect(logContent).toContain('First session');

      expect(logContent).toContain('---'); // Separator
      expect(logContent).toContain('Session: session-2');
      expect(logContent).toContain('Second session');

      // Should have two summaries
      const summaryCount = (logContent.match(/Session Summary/g) || []).length;
      expect(summaryCount).toBe(2);
    });
  });

  // ========================================================================
  // Markdown Format Validation (AC-8)
  // ========================================================================

  describe('Markdown Format Validation', () => {
    test('should generate valid markdown that renders correctly', () => {
      logger.initializeLog('markdown-test');

      logger.log({
        type: 'start',
        locationId: 'test-location',
        narrative: 'This is a **bold** narrative with *italic* text and `code`.'
      });

      logger.log({
        type: 'travel',
        locationId: 'another-location',
        narrative: 'Narrative with [links](url) and special chars: <html> & more'
      });

      const logPath = logger.finalize();
      const logContent = fs.readFileSync(logPath, 'utf8');

      // Verify markdown structure
      expect(logContent).toMatch(/^# Game Session Log/m); // h1 header
      expect(logContent).toMatch(/^## \[\d{2}:\d{2}:\d{2}\] Action:/gm); // h2 actions
      expect(logContent).toMatch(/^\*\*Location\*\*:/gm); // Bold labels
      expect(logContent).toMatch(/^## Session Summary/m); // Summary header

      // Verify special characters are escaped
      expect(logContent).toContain('\\*italic\\*');
      expect(logContent).toContain('\\[links\\]');
      expect(logContent).toContain('&lt;html&gt;');
    });

    test('should use proper heading hierarchy', () => {
      logger.initializeLog('hierarchy-test');
      logger.log({ type: 'start', locationId: 'test', narrative: 'test' });
      const logPath = logger.finalize();

      const logContent = fs.readFileSync(logPath, 'utf8');
      const lines = logContent.split('\n');

      // Find headers
      const h1Count = lines.filter(line => line.startsWith('# ')).length;
      const h2Count = lines.filter(line => line.startsWith('## ')).length;
      const h3Count = lines.filter(line => line.startsWith('### ')).length;

      expect(h1Count).toBeGreaterThanOrEqual(1); // At least one h1 (log title)
      expect(h2Count).toBeGreaterThanOrEqual(2); // At least actions + summary
      expect(h3Count).toBeGreaterThanOrEqual(1); // Session header
    });

    test('should be human-readable', () => {
      logger.initializeLog('readable-test');

      logger.log({
        type: 'start',
        locationId: 'village-of-barovia',
        narrative: 'A narrative that should be easily readable by humans with proper formatting.',
        tokensUsed: 100
      });

      const logPath = logger.finalize();
      const logContent = fs.readFileSync(logPath, 'utf8');

      // Verify human-readable elements
      expect(logContent).toContain('Location**:'); // Labels are clear
      expect(logContent).toContain('Narrative**:');
      expect(logContent).toContain('Tokens**: 100'); // Numbers formatted clearly
      expect(logContent).toContain('Total Actions**: 1');
      expect(logContent).toContain('Duration**: '); // Duration with units
    });
  });

  // ========================================================================
  // Error Handling and Graceful Fallback (AC-6)
  // ========================================================================

  describe('Error Handling', () => {
    test('should continue gameplay even with log write failures', () => {
      // Mock a logger with broken fs for write testing
      const brokenFs = {
        existsSync: () => true,
        mkdirSync: () => {},
        appendFileSync: () => {
          throw new Error('ENOSPC: No space left on device');
        },
        writeFileSync: () => {}
      };

      const loggerWithBrokenFs = new SessionLogger(testLogsDir, {
        fs: brokenFs,
        path: path
      });

      // initializeLog should fail gracefully
      const logPath = loggerWithBrokenFs.initializeLog('error-test');

      // Should return null but not crash
      expect(logPath).toBeNull();

      // Logger should still allow log calls (they will fail gracefully)
      const result = loggerWithBrokenFs.log({
        type: 'start',
        locationId: 'test',
        narrative: 'test'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('should handle missing directory by creating it', () => {
      const newDir = path.join(testLogsDir, 'new-subdir');

      // Ensure directory doesn't exist
      if (fs.existsSync(newDir)) {
        fs.rmSync(newDir, { recursive: true });
      }

      const logger = new SessionLogger(newDir);
      const logPath = logger.initializeLog('create-dir-test');

      expect(fs.existsSync(newDir)).toBe(true);
      expect(fs.existsSync(logPath)).toBe(true);

      // Cleanup
      logger.finalize();
      fs.rmSync(newDir, { recursive: true });
    });
  });

  // ========================================================================
  // Performance Validation
  // ========================================================================

  describe('Performance', () => {
    test('should complete initializeLog() in < 50ms', () => {
      const start = Date.now();
      logger.initializeLog('perf-test');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });

    test('should complete log() in < 20ms', () => {
      logger.initializeLog('perf-test');

      const start = Date.now();
      logger.log({
        type: 'start',
        locationId: 'test',
        narrative: 'test narrative'
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(20);
    });

    test('should complete finalize() in < 50ms', () => {
      logger.initializeLog('perf-test');
      logger.log({ type: 'start', locationId: 'test', narrative: 'test' });

      const start = Date.now();
      logger.finalize();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
    });

    test('should handle multiple rapid log calls efficiently', () => {
      logger.initializeLog('rapid-test');

      const start = Date.now();
      for (let i = 0; i < 10; i++) {
        logger.log({
          type: 'travel',
          locationId: `location-${i}`,
          narrative: `Narrative ${i}`,
          tokensUsed: 100
        });
      }
      const duration = Date.now() - start;

      // All 10 calls should complete in < 200ms (20ms each)
      expect(duration).toBeLessThan(200);
      expect(logger.actionCount).toBe(10);
      expect(logger.tokenCount).toBe(1000);
    });
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================

  describe('Edge Cases', () => {
    test('should handle empty narrative', () => {
      logger.initializeLog('empty-narrative-test');

      const result = logger.log({
        type: 'start',
        locationId: 'test',
        narrative: ''
      });

      expect(result.success).toBe(true);

      const logPath = logger.finalize();
      const logContent = fs.readFileSync(logPath, 'utf8');
      expect(logContent).toContain('No narrative provided');
    });

    test('should handle very long narrative (10KB+)', () => {
      logger.initializeLog('long-narrative-test');

      const longNarrative = 'A'.repeat(10000);

      const result = logger.log({
        type: 'start',
        locationId: 'test',
        narrative: longNarrative
      });

      expect(result.success).toBe(true);

      const logPath = logger.finalize();
      const logContent = fs.readFileSync(logPath, 'utf8');
      expect(logContent).toContain(longNarrative);
    });

    test('should handle special characters in all fields', () => {
      logger.initializeLog('special-chars-test');

      logger.log({
        type: 'travel',
        locationId: 'location-with-!@#$%^&*()',
        narrative: 'Narrative with émojis 🎮 and unicode ✓',
        tokensUsed: 100
      });

      const logPath = logger.finalize();
      expect(fs.existsSync(logPath)).toBe(true);

      const logContent = fs.readFileSync(logPath, 'utf8');
      expect(logContent.length).toBeGreaterThan(0);
    });
  });
});
