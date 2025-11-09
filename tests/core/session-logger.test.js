/**
 * Unit Tests for SessionLogger
 * Tests AC-1 through AC-8 with mocked dependencies
 *
 * Target: ≥90% statement coverage
 */

const { SessionLogger } = require('../../src/core/session-logger');

describe('SessionLogger', () => {
  let mockFs;
  let mockPath;
  let mockPerformance;
  let logger;

  // Helper: Generate expected log filename for today
  const getExpectedLogFilename = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `session-${year}-${month}-${day}.md`;
  };

  beforeEach(() => {
    // Mock fs module
    mockFs = {
      existsSync: jest.fn(),
      mkdirSync: jest.fn(),
      appendFileSync: jest.fn(),
      writeFileSync: jest.fn()
    };

    // Mock path module
    mockPath = {
      join: jest.fn((...args) => args.join('/'))
    };

    // Mock performance for timing
    mockPerformance = {
      now: jest.fn()
    };

    // Reset console.warn spy
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ========================================================================
  // Constructor Tests
  // ========================================================================

  describe('Constructor', () => {
    test('should create instance with default basePath', () => {
      logger = new SessionLogger();

      expect(logger.basePath).toContain('logs');
      expect(logger.currentLogFile).toBeNull();
      expect(logger.sessionId).toBeNull();
      expect(logger.actionCount).toBe(0);
      expect(logger.tokenCount).toBe(0);
    });

    test('should create instance with custom basePath (dependency injection)', () => {
      const customPath = '/custom/logs/path';
      logger = new SessionLogger(customPath);

      expect(logger.basePath).toBe(customPath);
    });

    test('should accept dependency injection for testing', () => {
      logger = new SessionLogger('/test/logs', {
        fs: mockFs,
        path: mockPath,
        performance: mockPerformance
      });

      expect(logger.fs).toBe(mockFs);
      expect(logger.path).toBe(mockPath);
      expect(logger.performance).toBe(mockPerformance);
    });
  });

  // ========================================================================
  // initializeLog() Tests (AC-1)
  // ========================================================================

  describe('initializeLog()', () => {
    beforeEach(() => {
      mockPerformance.now.mockReturnValueOnce(0).mockReturnValueOnce(10); // Start and end times
      logger = new SessionLogger('/test/logs', {
        fs: mockFs,
        path: mockPath,
        performance: mockPerformance
      });
    });

    test('should create log file with correct header (first session of day)', () => {
      mockFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false); // Dir exists, file doesn't

      const logPath = logger.initializeLog('session-abc123');

      const expectedFilename = getExpectedLogFilename();
      expect(logPath).toBe(`/test/logs/${expectedFilename}`);
      expect(mockFs.appendFileSync).toHaveBeenCalled();
      expect(logger.sessionId).toBe('session-abc123');
      expect(logger.startTime).toBeInstanceOf(Date);
      expect(logger.actionCount).toBe(0);
      expect(logger.tokenCount).toBe(0);
    });

    test('should create logs directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false); // Dir and file don't exist

      logger.initializeLog('session-123');

      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/test/logs', { recursive: true });
    });

    test('should append to existing file with horizontal rule separator', () => {
      mockFs.existsSync.mockReturnValue(true); // Dir and file exist

      logger.initializeLog('session-xyz789');

      // Check that separator was written
      const calls = mockFs.appendFileSync.mock.calls;
      expect(calls[0][1]).toContain('---');
    });

    test('should handle invalid sessionId gracefully', () => {
      mockFs.existsSync.mockReturnValue(true);

      const logPath = logger.initializeLog(null);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid sessionId')
      );
      expect(logger.sessionId).toContain('session-');
      expect(logPath).toBeTruthy();
    });

    test('should complete in < 50ms (performance target)', () => {
      mockPerformance.now.mockReturnValueOnce(0).mockReturnValueOnce(30); // 30ms duration
      mockFs.existsSync.mockReturnValue(true);

      logger.initializeLog('session-fast');

      // Should not warn if under 50ms
      expect(console.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('initializeLog() took')
      );
    });

    test('should warn if performance target exceeded', () => {
      // Create fresh logger with new performance mock
      const slowPerf = { now: jest.fn() };
      slowPerf.now.mockReturnValueOnce(0).mockReturnValueOnce(60); // 60ms duration
      mockFs.existsSync.mockReturnValue(true);

      const slowLogger = new SessionLogger('/test/logs', {
        fs: mockFs,
        path: mockPath,
        performance: slowPerf
      });

      slowLogger.initializeLog('session-slow');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('initializeLog() took 60')
      );
    });

    test('should handle file system errors gracefully (graceful fallback)', () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('EACCES: Permission denied');
      });

      const logPath = logger.initializeLog('session-error');

      expect(logPath).toBeNull();
      expect(logger.currentLogFile).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize log file')
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('graceful fallback')
      );
    });
  });

  // ========================================================================
  // log() Tests (AC-2)
  // ========================================================================

  describe('log()', () => {
    beforeEach(() => {
      mockPerformance.now.mockReturnValue(0);
      mockFs.existsSync.mockReturnValue(true);
      logger = new SessionLogger('/test/logs', {
        fs: mockFs,
        path: mockPath,
        performance: mockPerformance
      });
      logger.initializeLog('session-test');
      mockFs.appendFileSync.mockClear(); // Clear init calls
    });

    test('should append entry with timestamp, type, location, narrative, tokens', () => {
      mockPerformance.now.mockReturnValueOnce(0).mockReturnValueOnce(15); // 15ms

      const result = logger.log({
        type: 'travel',
        locationId: 'village-of-barovia',
        narrative: 'You arrive at the misty village...',
        tokensUsed: 189
      });

      expect(result.success).toBe(true);
      expect(mockFs.appendFileSync).toHaveBeenCalled();

      const logEntry = mockFs.appendFileSync.mock.calls[0][1];
      expect(logEntry).toContain('Action: travel');
      expect(logEntry).toContain('Location**: village-of-barovia');
      expect(logEntry).toContain('Narrative**: You arrive at the misty village...');
      expect(logEntry).toContain('Tokens**: 189');
    });

    test('should format as valid markdown with h2 heading', () => {
      logger.log({
        type: 'look',
        locationId: 'test-location',
        narrative: 'Test narrative'
      });

      const logEntry = mockFs.appendFileSync.mock.calls[0][1];
      expect(logEntry).toMatch(/^## \[\d{2}:\d{2}:\d{2}\] Action:/);
    });

    test('should complete in < 20ms (performance target)', () => {
      mockPerformance.now.mockReturnValueOnce(0).mockReturnValueOnce(15); // 15ms

      logger.log({ type: 'start', locationId: 'test', narrative: 'test' });

      expect(console.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('log() took')
      );
    });

    test('should warn if performance target exceeded', () => {
      mockPerformance.now.mockReturnValueOnce(0).mockReturnValueOnce(25); // 25ms

      logger.log({ type: 'start', locationId: 'test', narrative: 'test' });

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('log() took 25')
      );
    });

    test('should increment actionCount', () => {
      expect(logger.actionCount).toBe(0);

      logger.log({ type: 'start', locationId: 'test', narrative: 'test' });
      expect(logger.actionCount).toBe(1);

      logger.log({ type: 'travel', locationId: 'test', narrative: 'test' });
      expect(logger.actionCount).toBe(2);
    });

    test('should increment tokenCount when tokensUsed provided', () => {
      expect(logger.tokenCount).toBe(0);

      logger.log({ type: 'start', locationId: 'test', narrative: 'test', tokensUsed: 100 });
      expect(logger.tokenCount).toBe(100);

      logger.log({ type: 'travel', locationId: 'test', narrative: 'test', tokensUsed: 150 });
      expect(logger.tokenCount).toBe(250);
    });

    test('should handle missing tokensUsed (optional field)', () => {
      const result = logger.log({
        type: 'look',
        locationId: 'test',
        narrative: 'test'
        // No tokensUsed
      });

      expect(result.success).toBe(true);
      expect(logger.tokenCount).toBe(0);

      const logEntry = mockFs.appendFileSync.mock.calls[0][1];
      expect(logEntry).not.toContain('Tokens**:');
    });

    test('should sanitize narrative to prevent markdown injection', () => {
      logger.log({
        type: 'start',
        locationId: 'test',
        narrative: 'Test with *asterisks* and [brackets] and <html>'
      });

      const logEntry = mockFs.appendFileSync.mock.calls[0][1];
      expect(logEntry).toContain('\\*asterisks\\*');
      expect(logEntry).toContain('\\[brackets\\]');
      expect(logEntry).toContain('&lt;html&gt;');
    });

    test('should return success=true on successful write', () => {
      const result = logger.log({
        type: 'start',
        locationId: 'test',
        narrative: 'test'
      });

      expect(result).toEqual({ success: true });
    });

    test('should return success=false when no active log file', () => {
      const uninitLogger = new SessionLogger('/test', { fs: mockFs, path: mockPath, performance: mockPerformance });

      const result = uninitLogger.log({
        type: 'start',
        locationId: 'test',
        narrative: 'test'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active log file');
      expect(console.warn).toHaveBeenCalled();
    });

    test('should handle invalid action object gracefully', () => {
      const result = logger.log(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid action object');
    });

    test('should handle write errors gracefully', () => {
      mockFs.appendFileSync.mockImplementation(() => {
        throw new Error('ENOSPC: No space left on device');
      });

      const result = logger.log({
        type: 'start',
        locationId: 'test',
        narrative: 'test'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('ENOSPC');
      expect(console.warn).toHaveBeenCalled();
    });

    test('should handle empty narrative', () => {
      const result = logger.log({
        type: 'start',
        locationId: 'test',
        narrative: ''
      });

      expect(result.success).toBe(true);
      const logEntry = mockFs.appendFileSync.mock.calls[0][1];
      expect(logEntry).toContain('Narrative**: No narrative provided');
    });

    test('should handle very long narrative', () => {
      const longNarrative = 'A'.repeat(10000);

      const result = logger.log({
        type: 'start',
        locationId: 'test',
        narrative: longNarrative
      });

      expect(result.success).toBe(true);
      const logEntry = mockFs.appendFileSync.mock.calls[0][1];
      expect(logEntry).toContain(longNarrative);
    });
  });

  // ========================================================================
  // finalize() Tests (AC-3)
  // ========================================================================

  describe('finalize()', () => {
    beforeEach(() => {
      mockPerformance.now.mockReturnValue(0);
      mockFs.existsSync.mockReturnValue(true);
      logger = new SessionLogger('/test/logs', {
        fs: mockFs,
        path: mockPath,
        performance: mockPerformance
      });
      logger.initializeLog('session-test');
      mockFs.appendFileSync.mockClear();
    });

    test('should write summary section with correct stats', () => {
      // Simulate some actions
      logger.actionCount = 5;
      logger.tokenCount = 1234;

      mockPerformance.now.mockReturnValueOnce(0).mockReturnValueOnce(30); // 30ms

      const logPath = logger.finalize();

      const expectedFilename = getExpectedLogFilename();
      expect(logPath).toBe(`/test/logs/${expectedFilename}`);
      expect(mockFs.appendFileSync).toHaveBeenCalled();

      const summary = mockFs.appendFileSync.mock.calls[0][1];
      expect(summary).toContain('Session Summary');
      expect(summary).toContain('Total Actions**: 5');
      expect(summary).toContain('Total Tokens**: 1234');
      expect(summary).toContain('Duration**:');
      expect(summary).toContain('End Time**:');
    });

    test('should calculate session duration correctly', () => {
      // Set start time to 15 minutes ago
      logger.startTime = new Date(Date.now() - 15 * 60 * 1000);

      logger.finalize();

      const summary = mockFs.appendFileSync.mock.calls[0][1];
      expect(summary).toContain('Duration**: 15 minutes');
    });

    test('should complete in < 50ms (performance target)', () => {
      mockPerformance.now.mockReturnValueOnce(0).mockReturnValueOnce(30); // 30ms

      logger.finalize();

      expect(console.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('finalize() took')
      );
    });

    test('should warn if performance target exceeded', () => {
      mockPerformance.now.mockReturnValueOnce(0).mockReturnValueOnce(60); // 60ms

      logger.finalize();

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('finalize() took 60')
      );
    });

    test('should clear internal state after write', () => {
      logger.finalize();

      expect(logger.currentLogFile).toBeNull();
      expect(logger.sessionId).toBeNull();
      expect(logger.startTime).toBeNull();
      expect(logger.actionCount).toBe(0);
      expect(logger.tokenCount).toBe(0);
    });

    test('should return null when no active log file', () => {
      const uninitLogger = new SessionLogger('/test', { fs: mockFs, path: mockPath, performance: mockPerformance });

      const logPath = uninitLogger.finalize();

      expect(logPath).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('No active log file to finalize')
      );
    });

    test('should handle write errors gracefully', () => {
      mockFs.appendFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      const logPath = logger.finalize();

      expect(logPath).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to finalize log')
      );
    });
  });

  // ========================================================================
  // Edge Cases and Error Handling (AC-6)
  // ========================================================================

  describe('Edge Cases and Error Handling', () => {
    test('should handle concurrent log calls safely', () => {
      mockFs.existsSync.mockReturnValue(true);
      logger = new SessionLogger('/test/logs', { fs: mockFs, path: mockPath, performance: mockPerformance });
      logger.initializeLog('session-concurrent');
      mockFs.appendFileSync.mockClear();

      // Simulate multiple rapid log calls
      logger.log({ type: 'start', locationId: 'test1', narrative: 'test1' });
      logger.log({ type: 'travel', locationId: 'test2', narrative: 'test2' });
      logger.log({ type: 'look', locationId: 'test3', narrative: 'test3' });

      expect(mockFs.appendFileSync).toHaveBeenCalledTimes(3);
      expect(logger.actionCount).toBe(3);
    });

    test('should handle special characters in locationId', () => {
      mockFs.existsSync.mockReturnValue(true);
      logger = new SessionLogger('/test/logs', { fs: mockFs, path: mockPath, performance: mockPerformance });
      logger.initializeLog('session-test');
      mockFs.appendFileSync.mockClear();

      const result = logger.log({
        type: 'travel',
        locationId: 'location-with-dashes_and_underscores',
        narrative: 'test'
      });

      expect(result.success).toBe(true);
    });

    test('should handle undefined/null narrative', () => {
      mockFs.existsSync.mockReturnValue(true);
      logger = new SessionLogger('/test/logs', { fs: mockFs, path: mockPath, performance: mockPerformance });
      logger.initializeLog('session-test');
      mockFs.appendFileSync.mockClear();

      const result = logger.log({
        type: 'start',
        locationId: 'test',
        narrative: null
      });

      expect(result.success).toBe(true);
      const logEntry = mockFs.appendFileSync.mock.calls[0][1];
      expect(logEntry).toContain('No narrative provided');
    });

    test('should handle non-numeric tokensUsed', () => {
      mockFs.existsSync.mockReturnValue(true);
      logger = new SessionLogger('/test/logs', { fs: mockFs, path: mockPath, performance: mockPerformance });
      logger.initializeLog('session-test');
      mockFs.appendFileSync.mockClear();

      logger.log({
        type: 'start',
        locationId: 'test',
        narrative: 'test',
        tokensUsed: 'not-a-number'
      });

      expect(logger.tokenCount).toBe(0); // Should not increment
    });
  });

  // ========================================================================
  // Markdown Format Validation (AC-8)
  // ========================================================================

  describe('Markdown Format Validation', () => {
    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(true);
      logger = new SessionLogger('/test/logs', { fs: mockFs, path: mockPath, performance: mockPerformance });
      logger.initializeLog('session-markdown');
      mockFs.appendFileSync.mockClear();
    });

    test('should use correct heading hierarchy (h1 session, h2 actions)', () => {
      logger.log({ type: 'start', locationId: 'test', narrative: 'test' });

      const logEntry = mockFs.appendFileSync.mock.calls[0][1];
      expect(logEntry).toMatch(/^## \[/); // h2 for actions
    });

    test('should use ISO 8601 timestamp format', () => {
      logger.log({ type: 'start', locationId: 'test', narrative: 'test' });

      const logEntry = mockFs.appendFileSync.mock.calls[0][1];
      expect(logEntry).toMatch(/\[\d{2}:\d{2}:\d{2}\]/); // HH:MM:SS format
    });

    test('should escape special characters properly', () => {
      logger.log({
        type: 'start',
        locationId: 'test',
        narrative: 'Narrative with *bold* and _italic_ and `code`'
      });

      const logEntry = mockFs.appendFileSync.mock.calls[0][1];
      expect(logEntry).toContain('\\*bold\\*');
      expect(logEntry).toContain('\\_italic\\_');
      expect(logEntry).toContain('\\`code\\`');
    });
  });
});
