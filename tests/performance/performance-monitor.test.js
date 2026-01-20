/**
 * Unit Tests for PerformanceMonitor - Epic 5 Story 5.7
 *
 * Tests AC-1: PerformanceMonitor Module Implemented
 * Tests AC-2: Performance Alerting System
 */

const PerformanceMonitor = require('../../src/performance/performance-monitor');

describe('PerformanceMonitor', () => {
  let monitor;
  let mockFs;
  let mockVscodeNotify;
  let appendedLogs;

  beforeEach(() => {
    appendedLogs = [];
    mockFs = {
      appendFile: jest.fn().mockImplementation((path, content) => {
        appendedLogs.push({ path, content });
        return Promise.resolve();
      })
    };
    mockVscodeNotify = jest.fn();

    monitor = new PerformanceMonitor({
      fs: mockFs,
      logPath: 'test-performance.log',
      maxEntries: 100,
      vscodeNotify: mockVscodeNotify
    });
  });

  describe('record()', () => {
    it('should add metric to in-memory buffer (AC-1, Task 1.2.1)', async () => {
      await monitor.record('contextLoad', 500, { locationId: 'village-of-barovia' });

      const metrics = monitor.getAllMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].operationType).toBe('contextLoad');
      expect(metrics[0].durationMs).toBe(500);
      expect(metrics[0].context.locationId).toBe('village-of-barovia');
    });

    it('should write to performance.log in structured format (AC-1, Task 1.2.2)', async () => {
      await monitor.record('fileRead', 25.5, { file: 'Description.md' });

      expect(mockFs.appendFile).toHaveBeenCalled();
      const logLine = appendedLogs[0].content;
      expect(logLine).toContain('[fileRead]');
      expect(logLine).toContain('25.5ms');
      expect(logLine).toContain('Description.md');
    });

    it('should evict oldest entries when exceeding maxEntries', async () => {
      // Fill to max
      for (let i = 0; i < 100; i++) {
        await monitor.record('test', i, {});
      }

      expect(monitor.getAllMetrics().length).toBe(100);
      expect(monitor.getAllMetrics()[0].durationMs).toBe(0);

      // Add one more - should evict oldest
      await monitor.record('test', 100, {});

      expect(monitor.getAllMetrics().length).toBe(100);
      expect(monitor.getAllMetrics()[0].durationMs).toBe(1); // Old 0ms was evicted
    });

    it('should round duration to 2 decimal places', async () => {
      await monitor.record('test', 123.456789, {});

      const metrics = monitor.getAllMetrics();
      expect(metrics[0].durationMs).toBe(123.46);
    });
  });

  describe('startTimer()', () => {
    it('should return closure that stops timer and records metric (AC-1, Task 1.3)', async () => {
      const stopTimer = monitor.startTimer('contextLoad');

      // Wait a small amount of time
      await new Promise(resolve => setTimeout(resolve, 10));

      const duration = await stopTimer({ locationId: 'test' });

      expect(duration).toBeGreaterThan(0);
      expect(monitor.getAllMetrics().length).toBe(1);
      expect(monitor.getAllMetrics()[0].operationType).toBe('contextLoad');
    });

    it('should use high-precision timing (process.hrtime.bigint)', async () => {
      const stopTimer = monitor.startTimer('test');

      // Even with no delay, should capture sub-millisecond timing
      const duration = await stopTimer({});

      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getLastN()', () => {
    beforeEach(async () => {
      await monitor.record('contextLoad', 100, {});
      await monitor.record('fileRead', 10, {});
      await monitor.record('contextLoad', 200, {});
      await monitor.record('cacheHit', 1, {});
      await monitor.record('contextLoad', 150, {});
    });

    it('should filter and return last N entries of a type (AC-1, Task 1.4.1)', () => {
      const result = monitor.getLastN('contextLoad', 2);

      expect(result.length).toBe(2);
      expect(result[0].durationMs).toBe(200);
      expect(result[1].durationMs).toBe(150);
    });

    it('should return all matching if count exceeds available', () => {
      const result = monitor.getLastN('contextLoad', 10);

      expect(result.length).toBe(3);
    });

    it('should return all types when operationType is null', () => {
      const result = monitor.getLastN(null, 3);

      expect(result.length).toBe(3);
    });

    it('should default to 10 entries', () => {
      const result = monitor.getLastN('contextLoad');

      expect(result.length).toBe(3); // Only 3 contextLoad entries
    });
  });

  describe('getAverageTime()', () => {
    it('should calculate mean duration (AC-1, Task 1.4.2)', async () => {
      await monitor.record('contextLoad', 100, {});
      await monitor.record('contextLoad', 200, {});
      await monitor.record('contextLoad', 300, {});

      const avg = monitor.getAverageTime('contextLoad');

      expect(avg).toBe(200);
    });

    it('should return 0 for unknown operation type', () => {
      const avg = monitor.getAverageTime('unknown');

      expect(avg).toBe(0);
    });

    it('should round average to 2 decimal places', async () => {
      await monitor.record('test', 100, {});
      await monitor.record('test', 101, {});
      await monitor.record('test', 102, {});

      const avg = monitor.getAverageTime('test');

      expect(avg).toBe(101); // (100+101+102)/3 = 101
    });
  });

  describe('getP95Time()', () => {
    it('should calculate 95th percentile (AC-1, Task 1.4.3)', async () => {
      // Add 20 entries: 1-20ms
      for (let i = 1; i <= 20; i++) {
        await monitor.record('test', i, {});
      }

      const p95 = monitor.getP95Time('test');

      // 95th percentile of 1-20 = 19th value when sorted = 19
      expect(p95).toBe(19);
    });

    it('should return 0 for unknown operation type', () => {
      const p95 = monitor.getP95Time('unknown');

      expect(p95).toBe(0);
    });

    it('should handle single entry', async () => {
      await monitor.record('test', 100, {});

      const p95 = monitor.getP95Time('test');

      expect(p95).toBe(100);
    });
  });

  describe('checkThresholds() - AC-2', () => {
    it('should detect threshold violations (Task 1.5.1)', async () => {
      // contextLoad threshold is 5000ms, alert at 7500ms (50% over)
      await monitor.record('contextLoad', 8000, { locationId: 'test' });

      const violations = monitor.checkThresholds();

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].operation).toBe('contextLoad');
      expect(violations[0].actual).toBe(8000);
      expect(violations[0].target).toBe(5000);
      expect(violations[0].threshold).toBe(7500);
    });

    it('should return empty array when no violations', async () => {
      await monitor.record('contextLoad', 1000, {});

      const violations = monitor.checkThresholds();

      expect(violations).toEqual([]);
    });

    it('should calculate percentage over target', async () => {
      // 10000ms is 100% over 5000ms target
      await monitor.record('contextLoad', 10000, {});

      const violations = monitor.checkThresholds();

      expect(violations[0].percentOver).toBe(100);
    });
  });

  describe('Performance Alerting - AC-2', () => {
    it('should log warning when threshold exceeded (Task 1.2.3)', async () => {
      await monitor.record('contextLoad', 8000, {});

      // Find warning log entry
      const warningLog = appendedLogs.find(l => l.content.includes('[PERF WARNING]'));
      expect(warningLog).toBeDefined();
      expect(warningLog.content).toContain('contextLoad exceeded target');
      expect(warningLog.content).toContain('8.0s');
      expect(warningLog.content).toContain('target: 5.0s');
    });

    it('should call VS Code notification when available (Task 1.6)', async () => {
      await monitor.record('contextLoad', 8000, { locationId: 'castle-ravenloft' });

      expect(mockVscodeNotify).toHaveBeenCalled();
      const message = mockVscodeNotify.mock.calls[0][0];
      expect(message).toContain('Performance Warning');
      expect(message).toContain('contextLoad');
      expect(message).toContain('castle-ravenloft');
    });

    it('should not warn when within threshold', async () => {
      await monitor.record('contextLoad', 4000, {});

      const warningLog = appendedLogs.find(l => l.content.includes('[PERF WARNING]'));
      expect(warningLog).toBeUndefined();
      expect(mockVscodeNotify).not.toHaveBeenCalled();
    });
  });

  describe('getSummary()', () => {
    it('should return summary statistics for all operation types', async () => {
      await monitor.record('contextLoad', 100, {});
      await monitor.record('contextLoad', 200, {});
      await monitor.record('fileRead', 10, {});

      const summary = monitor.getSummary();

      expect(summary.contextLoad.count).toBe(2);
      expect(summary.contextLoad.average).toBe(150);
      expect(summary.fileRead.count).toBe(1);
      expect(summary.fileRead.average).toBe(10);
    });
  });

  describe('clearMetrics()', () => {
    it('should clear all metrics', async () => {
      await monitor.record('test', 100, {});
      await monitor.record('test', 200, {});

      monitor.clearMetrics();

      expect(monitor.getAllMetrics().length).toBe(0);
    });
  });

  describe('setThreshold()', () => {
    it('should update threshold for operation type', () => {
      monitor.setThreshold('contextLoad', 10000);

      const thresholds = monitor.getThresholds();
      expect(thresholds.contextLoad).toBe(10000);
    });
  });

  describe('setVSCodeNotify()', () => {
    it('should set VS Code notification callback', async () => {
      const newNotify = jest.fn();
      monitor.setVSCodeNotify(newNotify);

      await monitor.record('contextLoad', 8000, {});

      expect(newNotify).toHaveBeenCalled();
    });
  });
});

describe('PerformanceMonitor Singleton', () => {
  afterEach(() => {
    PerformanceMonitor.resetInstance();
  });

  it('should return same instance', () => {
    const instance1 = PerformanceMonitor.getInstance();
    const instance2 = PerformanceMonitor.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should reset instance', () => {
    const instance1 = PerformanceMonitor.getInstance();
    PerformanceMonitor.resetInstance();
    const instance2 = PerformanceMonitor.getInstance();

    expect(instance1).not.toBe(instance2);
  });
});
