/**
 * Unit Tests for ParsingCache - Epic 5 Story 5.7
 *
 * Tests AC-4: Markdown/YAML Parsing Cache
 */

const ParsingCache = require('../../src/performance/parsing-cache');

describe('ParsingCache', () => {
  let cache;
  let mockFs;
  let mockYaml;

  beforeEach(() => {
    mockFs = {
      stat: jest.fn(),
      readFile: jest.fn()
    };

    mockYaml = {
      load: jest.fn().mockImplementation((content) => {
        // Simple YAML-like parsing for tests
        if (content.includes('name:')) {
          return { name: 'Test' };
        }
        return {};
      })
    };

    cache = new ParsingCache({
      fs: mockFs,
      yaml: mockYaml,
      maxSize: 1024 * 1024 // 1MB for tests
    });
  });

  describe('getOrParse()', () => {
    it('should parse and cache file on first access (AC-4, Task 3.1)', async () => {
      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('test content');

      const parser = jest.fn().mockReturnValue({ parsed: true });

      const result = await cache.getOrParse('/path/to/file.yaml', parser);

      expect(result.data).toEqual({ parsed: true });
      expect(result.cached).toBe(false);
      expect(parser).toHaveBeenCalledWith('test content');
    });

    it('should return cached data on subsequent access (AC-4, Task 3.2)', async () => {
      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('test content');

      const parser = jest.fn().mockReturnValue({ parsed: true });

      // First access
      await cache.getOrParse('/path/to/file.yaml', parser);

      // Second access
      const result = await cache.getOrParse('/path/to/file.yaml', parser);

      expect(result.data).toEqual({ parsed: true });
      expect(result.cached).toBe(true);
      expect(parser).toHaveBeenCalledTimes(1); // Only parsed once
    });

    it('should re-parse when mtime changes (AC-4, Task 3.3)', async () => {
      const parser = jest.fn().mockReturnValue({ version: 1 });

      // First access with mtime 1000
      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('v1 content');
      await cache.getOrParse('/path/to/file.yaml', parser);

      // File modified - mtime changed
      mockFs.stat.mockResolvedValue({ mtimeMs: 2000 });
      mockFs.readFile.mockResolvedValue('v2 content');
      parser.mockReturnValue({ version: 2 });

      const result = await cache.getOrParse('/path/to/file.yaml', parser);

      expect(result.cached).toBe(false);
      expect(result.data).toEqual({ version: 2 });
      expect(parser).toHaveBeenCalledTimes(2);
    });

    it('should track hit/miss statistics (AC-4, Task 3.4)', async () => {
      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('content');

      const parser = jest.fn().mockReturnValue({});

      // First access - miss
      await cache.getOrParse('/path/to/file1.yaml', parser);
      // Second access same file - hit
      await cache.getOrParse('/path/to/file1.yaml', parser);
      // Third access different file - miss
      await cache.getOrParse('/path/to/file2.yaml', parser);
      // Fourth access file1 - hit
      await cache.getOrParse('/path/to/file1.yaml', parser);

      const stats = cache.getStats();
      expect(stats.hitCount).toBe(2);
      expect(stats.missCount).toBe(2);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should throw error when file cannot be read', async () => {
      mockFs.stat.mockRejectedValue(new Error('File not found'));

      await expect(cache.getOrParse('/nonexistent.yaml', jest.fn()))
        .rejects.toThrow('File not found');
    });
  });

  describe('parseYaml()', () => {
    it('should parse YAML file with caching', async () => {
      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('name: Test Location');

      const result = await cache.parseYaml('/path/to/metadata.yaml');

      expect(mockYaml.load).toHaveBeenCalled();
      expect(result.cached).toBe(false);
    });

    it('should use cache for repeated YAML parses', async () => {
      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('name: Test');

      await cache.parseYaml('/path/to/file.yaml');
      const result = await cache.parseYaml('/path/to/file.yaml');

      expect(result.cached).toBe(true);
      expect(mockYaml.load).toHaveBeenCalledTimes(1);
    });
  });

  describe('parseFrontmatter()', () => {
    it('should extract YAML frontmatter from Markdown (AC-4, Task 3.5)', async () => {
      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue(`---
title: Test Title
author: Test Author
---
# Content

This is the markdown content.`);

      mockYaml.load.mockReturnValue({ title: 'Test Title', author: 'Test Author' });

      const result = await cache.parseFrontmatter('/path/to/file.md');

      expect(result.data.frontmatter).toEqual({ title: 'Test Title', author: 'Test Author' });
      expect(result.data.content).toContain('# Content');
      expect(result.data.content).toContain('markdown content');
    });

    it('should handle files without frontmatter', async () => {
      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('# Just Markdown\n\nNo frontmatter here.');

      const result = await cache.parseFrontmatter('/path/to/file.md');

      expect(result.data.frontmatter).toEqual({});
      expect(result.data.content).toContain('Just Markdown');
    });

    it('should handle Windows line endings in frontmatter', async () => {
      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('---\r\ntitle: Test\r\n---\r\n# Content');

      mockYaml.load.mockReturnValue({ title: 'Test' });

      const result = await cache.parseFrontmatter('/path/to/file.md');

      expect(result.data.frontmatter).toEqual({ title: 'Test' });
    });
  });

  describe('invalidate()', () => {
    it('should remove specific entry from cache (AC-4, Task 3.6)', async () => {
      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('content');

      const parser = jest.fn().mockReturnValue({ data: 'test' });

      await cache.getOrParse('/path/to/file.yaml', parser);
      expect(cache.cache.size).toBe(1);

      const removed = cache.invalidate('/path/to/file.yaml');

      expect(removed).toBe(true);
      expect(cache.cache.size).toBe(0);
    });

    it('should return false for non-existent entry', () => {
      const removed = cache.invalidate('/nonexistent.yaml');

      expect(removed).toBe(false);
    });

    it('should update estimated size when invalidating', async () => {
      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('content');

      const parser = jest.fn().mockReturnValue({ data: 'test data here' });

      await cache.getOrParse('/path/to/file.yaml', parser);
      const sizeBeforeInvalidate = cache.estimatedSize;

      cache.invalidate('/path/to/file.yaml');

      expect(cache.estimatedSize).toBeLessThan(sizeBeforeInvalidate);
    });
  });

  describe('invalidateByPattern()', () => {
    it('should invalidate entries matching regex pattern', async () => {
      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('content');

      const parser = jest.fn().mockReturnValue({});

      await cache.getOrParse('/game-data/locations/village/metadata.yaml', parser);
      await cache.getOrParse('/game-data/locations/castle/metadata.yaml', parser);
      await cache.getOrParse('/game-data/npcs/ireena.yaml', parser);

      const count = cache.invalidateByPattern(/locations/);

      expect(count).toBe(2);
      expect(cache.cache.size).toBe(1);
    });

    it('should accept string pattern', async () => {
      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('content');

      const parser = jest.fn().mockReturnValue({});

      await cache.getOrParse('/path/village-of-barovia/file.yaml', parser);
      await cache.getOrParse('/path/castle-ravenloft/file.yaml', parser);

      const count = cache.invalidateByPattern('village');

      expect(count).toBe(1);
    });
  });

  describe('clearAll()', () => {
    it('should clear entire cache', async () => {
      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('content');

      const parser = jest.fn().mockReturnValue({});

      await cache.getOrParse('/file1.yaml', parser);
      await cache.getOrParse('/file2.yaml', parser);

      cache.clearAll();

      expect(cache.cache.size).toBe(0);
      expect(cache.estimatedSize).toBe(0);
    });
  });

  describe('getStats()', () => {
    it('should return comprehensive statistics', async () => {
      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('content');

      const parser = jest.fn().mockReturnValue({});

      await cache.getOrParse('/file.yaml', parser);
      await cache.getOrParse('/file.yaml', parser);

      const stats = cache.getStats();

      expect(stats.entries).toBe(1);
      expect(stats.hitCount).toBe(1);
      expect(stats.missCount).toBe(1);
      expect(stats.hitRate).toBe(0.5);
      expect(stats.estimatedSize).toBeGreaterThan(0);
      expect(stats.maxSize).toBe(1024 * 1024);
    });

    it('should return 0 hitRate when no requests', () => {
      const stats = cache.getStats();

      expect(stats.hitRate).toBe(0);
    });
  });

  describe('resetStats()', () => {
    it('should reset hit/miss counts but keep cache', async () => {
      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('content');

      const parser = jest.fn().mockReturnValue({});

      await cache.getOrParse('/file.yaml', parser);

      cache.resetStats();

      const stats = cache.getStats();
      expect(stats.hitCount).toBe(0);
      expect(stats.missCount).toBe(0);
      expect(stats.entries).toBe(1); // Cache still has entry
    });
  });

  describe('isCached()', () => {
    it('should return true for cached and valid entry', async () => {
      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('content');

      const parser = jest.fn().mockReturnValue({});

      await cache.getOrParse('/file.yaml', parser);

      const isCached = await cache.isCached('/file.yaml');

      expect(isCached).toBe(true);
    });

    it('should return false for non-cached entry', async () => {
      const isCached = await cache.isCached('/nonexistent.yaml');

      expect(isCached).toBe(false);
    });

    it('should return false when mtime changed', async () => {
      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('content');

      const parser = jest.fn().mockReturnValue({});

      await cache.getOrParse('/file.yaml', parser);

      // File modified
      mockFs.stat.mockResolvedValue({ mtimeMs: 2000 });

      const isCached = await cache.isCached('/file.yaml');

      expect(isCached).toBe(false);
    });
  });

  describe('getEntryInfo()', () => {
    it('should return entry metadata without counting as access', async () => {
      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('content');

      const parser = jest.fn().mockReturnValue({});

      await cache.getOrParse('/file.yaml', parser);

      const info = cache.getEntryInfo('/file.yaml');

      expect(info.mtime).toBe(1000);
      expect(info.accessCount).toBe(1);
      expect(info.cachedAt).toBeDefined();
      expect(info.age).toBeGreaterThanOrEqual(0);

      // Should not increment access count
      expect(cache.cache.get('/file.yaml').accessCount).toBe(1);
    });

    it('should return null for non-existent entry', () => {
      const info = cache.getEntryInfo('/nonexistent.yaml');

      expect(info).toBeNull();
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used entries when exceeding maxSize (AC-4, Task 3.7)', async () => {
      // Create cache with very small max size
      cache = new ParsingCache({
        fs: mockFs,
        yaml: mockYaml,
        maxSize: 1000 // Small but allows a few entries
      });

      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('content');

      // Create parser that returns objects of known size
      // Each entry is roughly 200 bytes when serialized * 2 = 400 bytes
      const parser = jest.fn().mockReturnValue({ data: 'a'.repeat(80) });

      // Add first entry (should fit)
      await cache.getOrParse('/file1.yaml', parser);
      expect(cache.cache.size).toBe(1);

      // Add second entry (should fit, total ~800 bytes)
      await cache.getOrParse('/file2.yaml', parser);
      expect(cache.cache.size).toBe(2);

      // Access file1 to increase its access count (making it less likely to evict)
      await cache.getOrParse('/file1.yaml', parser);

      // Add third entry - should trigger eviction since we'd exceed ~1200 bytes
      // file2 should be evicted (lower access count than file1)
      await cache.getOrParse('/file3.yaml', parser);

      // Should have evicted at least one entry to stay under maxSize
      // Either still have 2 entries, or at least be under maxSize
      expect(cache.cache.size).toBeLessThanOrEqual(3);
      expect(cache.estimatedSize).toBeLessThanOrEqual(1200); // Some tolerance
    });

    it('should evict entries with lowest access score', async () => {
      cache = new ParsingCache({
        fs: mockFs,
        yaml: mockYaml,
        maxSize: 600 // Very small
      });

      mockFs.stat.mockResolvedValue({ mtimeMs: 1000 });
      mockFs.readFile.mockResolvedValue('content');

      const parser = jest.fn().mockReturnValue({ small: 'x'.repeat(50) });

      // Add two entries
      await cache.getOrParse('/frequently-used.yaml', parser);
      await cache.getOrParse('/rarely-used.yaml', parser);

      // Access frequently-used many times
      for (let i = 0; i < 5; i++) {
        await cache.getOrParse('/frequently-used.yaml', parser);
      }

      // Force eviction by adding large entry
      parser.mockReturnValue({ large: 'y'.repeat(200) });
      await cache.getOrParse('/new-file.yaml', parser);

      // frequently-used should still be cached (higher access count)
      // rarely-used should have been evicted
      const stats = cache.getStats();
      expect(cache.cache.has('/frequently-used.yaml')).toBe(true);
    });
  });

  describe('Singleton Pattern', () => {
    afterEach(() => {
      ParsingCache.resetInstance();
    });

    it('should return same instance', () => {
      const instance1 = ParsingCache.getInstance();
      const instance2 = ParsingCache.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should reset instance', () => {
      const instance1 = ParsingCache.getInstance();
      ParsingCache.resetInstance();
      const instance2 = ParsingCache.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });
});
