/**
 * FileWatcher Integration Tests
 * Epic 5 Story 5.2: Context Caching Strategy
 *
 * Tests file system watching, debouncing, and cache invalidation integration
 */

const FileWatcher = require('../../../src/context/file-watcher');
const fs = require('fs').promises;
const path = require('path');

describe('FileWatcher', () => {
  let watcher;
  let testDir;

  beforeEach(async () => {
    // Create test directory
    testDir = path.join(process.cwd(), 'test-tmp-filewatcher');
    await fs.mkdir(testDir, { recursive: true });

    watcher = new FileWatcher({ debounceDelay: 100 }); // Short delay for testing
  });

  afterEach(async () => {
    // Stop watcher
    if (watcher) {
      await watcher.stop();
    }

    // Cleanup test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Basic File Watching (AC-2)', () => {
    test('should start watching and emit ready event', (done) => {
      watcher.start([testDir]);

      setTimeout(() => {
        expect(watcher.isWatching).toBe(true);
        done();
      }, 200);
    });

    test('should stop watching', async () => {
      watcher.start([testDir]);

      await new Promise(resolve => setTimeout(resolve, 200));

      await watcher.stop();
      expect(watcher.isWatching).toBe(false);
    });

    test('should emit change event on file creation', (done) => {
      const testFile = path.join(testDir, 'test-file.md');

      watcher.on('change', (filePath, changeType) => {
        expect(changeType).toBe('add');
        expect(filePath).toContain('test-file.md');
        done();
      });

      watcher.start([testDir]);

      setTimeout(async () => {
        await fs.writeFile(testFile, 'Test content');
      }, 200);
    });

    test('should emit change event on file modification', (done) => {
      const testFile = path.join(testDir, 'test-file.md');

      let eventCount = 0;

      watcher.on('change', (filePath, changeType) => {
        eventCount++;

        // Skip the 'add' event, wait for 'change' event
        if (changeType === 'change') {
          expect(filePath).toContain('test-file.md');
          expect(eventCount).toBeGreaterThanOrEqual(2);
          done();
        }
      });

      watcher.start([testDir]);

      setTimeout(async () => {
        await fs.writeFile(testFile, 'Initial content');
        setTimeout(async () => {
          await fs.writeFile(testFile, 'Modified content');
        }, 200);
      }, 200);
    });

    test('should emit change event on file deletion', (done) => {
      const testFile = path.join(testDir, 'test-file.md');

      let eventCount = 0;

      watcher.on('change', async (filePath, changeType) => {
        eventCount++;

        // Skip 'add' event, wait for 'unlink' event
        if (changeType === 'unlink') {
          expect(filePath).toContain('test-file.md');
          done();
        }
      });

      watcher.start([testDir]);

      setTimeout(async () => {
        await fs.writeFile(testFile, 'Temporary content');
        setTimeout(async () => {
          await fs.unlink(testFile);
        }, 200);
      }, 200);
    });
  });

  describe('Debouncing (AC-2)', () => {
    test('should debounce rapid file changes', (done) => {
      const testFile = path.join(testDir, 'debounce-test.md');
      let changeCount = 0;

      watcher.on('change', () => {
        changeCount++;
      });

      watcher.start([testDir]);

      setTimeout(async () => {
        // Write file 5 times rapidly
        await fs.writeFile(testFile, 'Write 1');
        await fs.writeFile(testFile, 'Write 2');
        await fs.writeFile(testFile, 'Write 3');
        await fs.writeFile(testFile, 'Write 4');
        await fs.writeFile(testFile, 'Write 5');

        // Wait for debounce delay + buffer
        setTimeout(() => {
          // Should emit only 1-2 events due to debouncing, not 5
          expect(changeCount).toBeLessThan(3);
          done();
        }, 300);
      }, 200);
    });
  });

  describe('Path to Cache Key Mapping (AC-2)', () => {
    test('should map location path to cache key pattern', () => {
      const path1 = 'game-data/locations/village-of-barovia/Description.md';
      const key1 = FileWatcher.mapPathToCacheKey(path1);
      expect(key1).toBe('location:village-of-barovia:*');

      const path2 = 'game-data/locations/castle-ravenloft/State.md';
      const key2 = FileWatcher.mapPathToCacheKey(path2);
      expect(key2).toBe('location:castle-ravenloft:*');
    });

    test('should map NPC path to cache key pattern', () => {
      const path1 = 'game-data/npcs/ireena_kolyana/profile.md';
      const key1 = FileWatcher.mapPathToCacheKey(path1);
      expect(key1).toBe('npc:ireena_kolyana:*');
    });

    test('should map quest path to cache key pattern', () => {
      const path1 = 'game-data/quests/st-andrals-feast/quest.yaml';
      const key1 = FileWatcher.mapPathToCacheKey(path1);
      expect(key1).toBe('quest:st-andrals-feast:*');
    });

    test('should map calendar path to cache key pattern', () => {
      const path1 = 'game-data/calendar.yaml';
      const key1 = FileWatcher.mapPathToCacheKey(path1);
      expect(key1).toBe('calendar:*');
    });

    test('should return null for non-game-data paths', () => {
      const path1 = 'src/core/state-manager.js';
      const key1 = FileWatcher.mapPathToCacheKey(path1);
      expect(key1).toBeNull();
    });

    test('should handle Windows path separators', () => {
      const path1 = 'game-data\\locations\\village-of-barovia\\Description.md';
      const key1 = FileWatcher.mapPathToCacheKey(path1);
      expect(key1).toBe('location:village-of-barovia:*');
    });
  });

  describe('Error Handling (AC-2)', () => {
    test('should handle watcher errors gracefully', () => {
      // Watcher should not crash when starting with non-existent path
      expect(() => {
        watcher.start(['/non/existent/path/that/does/not/exist']);
      }).not.toThrow();
    });

    test('should not throw when stopping already stopped watcher', async () => {
      await expect(watcher.stop()).resolves.not.toThrow();
    });

    test('should warn when starting already started watcher', () => {
      watcher.start([testDir]);

      // Try to start again
      expect(() => watcher.start([testDir])).not.toThrow();
    });
  });

  describe('Integration with ContextCache', () => {
    test('should provide cache key mapping for invalidation', () => {
      const ContextCache = require('../../../src/context/context-cache');
      const cache = new ContextCache();

      // Populate cache with location data
      cache.set('location:village-of-barovia:v1', { data: 'original' }, 100);

      // Simulate file change event: get cache key pattern
      const filePath = 'game-data/locations/village-of-barovia/Description.md';
      const cacheKey = FileWatcher.mapPathToCacheKey(filePath);

      expect(cacheKey).toBe('location:village-of-barovia:*');

      // Invalidate cache using the pattern
      const invalidated = cache.invalidatePattern(cacheKey);
      expect(invalidated).toBe(1);

      // Verify cache was invalidated
      const cached = cache.get('location:village-of-barovia:v1');
      expect(cached).toBeNull();
    });
  });
});
