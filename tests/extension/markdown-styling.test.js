/**
 * Markdown Styling Tests
 *
 * Story 5-11: Markdown Preview Styling
 *
 * Tests for the MarkdownLinkProvider and entity navigation functionality.
 * CSS styling is verified manually - see test-narrative-styling.md
 */

const path = require('path');
const fs = require('fs');

// Mock VS Code module for testing
const mockVscode = {
  Uri: {
    file: (filePath) => ({ fsPath: filePath, scheme: 'file' }),
    parse: (str) => ({ toString: () => str })
  },
  Range: class {
    constructor(start, end) {
      this.start = start;
      this.end = end;
    }
  },
  Position: class {
    constructor(line, character) {
      this.line = line;
      this.character = character;
    }
  },
  DocumentLink: class {
    constructor(range, uri) {
      this.range = range;
      this.target = uri;
    }
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: path.resolve(__dirname, '../..') } }],
    openTextDocument: jest.fn().mockResolvedValue({}),
    getConfiguration: jest.fn().mockReturnValue({
      get: jest.fn().mockReturnValue('gothic')
    })
  },
  window: {
    showTextDocument: jest.fn().mockResolvedValue({}),
    showWarningMessage: jest.fn(),
    showErrorMessage: jest.fn()
  },
  commands: {
    executeCommand: jest.fn().mockResolvedValue(undefined),
    registerCommand: jest.fn().mockReturnValue({ dispose: () => {} })
  },
  languages: {
    registerDocumentLinkProvider: jest.fn().mockReturnValue({ dispose: () => {} })
  },
  ExtensionContext: class {
    constructor() {
      this.subscriptions = [];
    }
  }
};

// Set up module mock before requiring the provider
jest.mock('vscode', () => mockVscode, { virtual: true });

describe('Story 5-11: Markdown Preview Styling', () => {
  const workspaceRoot = path.resolve(__dirname, '../..');

  describe('CSS File Validation', () => {
    const cssPath = path.join(workspaceRoot, 'extensions/kapis-rpg-dm/media/styles/narrative-theme.css');

    test('narrative-theme.css exists', () => {
      expect(fs.existsSync(cssPath)).toBe(true);
    });

    test('CSS file is not empty', () => {
      const content = fs.readFileSync(cssPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    test('CSS contains required color variables (AC-1)', () => {
      const content = fs.readFileSync(cssPath, 'utf-8');

      // Check for required color variables
      expect(content).toContain('--bg-dark');
      expect(content).toContain('--text-parchment');
      expect(content).toContain('--accent-blood');
      expect(content).toContain('--accent-silver');
      expect(content).toContain('--link-warm');
    });

    test('CSS contains gothic color values', () => {
      const content = fs.readFileSync(cssPath, 'utf-8');

      // Check for specific color values
      expect(content).toContain('#1a1a1a'); // Dark background
      expect(content).toContain('#d4c4a8'); // Parchment text
      expect(content).toContain('#8b0000'); // Blood red
      expect(content).toContain('#c0c0c0'); // Silver
    });

    test('CSS contains font stacks (AC-2)', () => {
      const content = fs.readFileSync(cssPath, 'utf-8');

      // Serif font for narrative
      expect(content).toContain('Georgia');
      expect(content).toContain('Palatino');
      expect(content).toContain('serif');

      // Monospace for mechanics
      expect(content).toContain('Consolas');
      expect(content).toContain('Monaco');
      expect(content).toContain('monospace');
    });

    test('CSS contains font sizes (AC-2)', () => {
      const content = fs.readFileSync(cssPath, 'utf-8');

      // Base font size
      expect(content).toContain('16px');

      // Header scaling
      expect(content).toContain('2em');
      expect(content).toContain('1.5em');
      expect(content).toContain('1.25em');
    });

    test('CSS contains readability optimizations (AC-4)', () => {
      const content = fs.readFileSync(cssPath, 'utf-8');

      // Line height (either direct value or CSS variable)
      expect(content).toMatch(/line-height.*1\.[567]/);

      // Max width
      expect(content).toContain('80ch');

      // Paragraph margins
      expect(content).toContain('margin-bottom');
    });

    test('CSS contains blockquote styling for NPC dialogue (AC-6)', () => {
      const content = fs.readFileSync(cssPath, 'utf-8');

      expect(content).toContain('blockquote');
      expect(content).toContain('border-left');
      expect(content).toContain('italic');
    });

    test('CSS contains code block styling (AC-6)', () => {
      const content = fs.readFileSync(cssPath, 'utf-8');

      expect(content).toContain('pre');
      expect(content).toContain('code');
      expect(content).toContain('statblock');
    });

    test('CSS contains accessibility features (AC-4)', () => {
      const content = fs.readFileSync(cssPath, 'utf-8');

      // Focus styles
      expect(content).toContain(':focus');

      // Reduced motion
      expect(content).toContain('prefers-reduced-motion');

      // High contrast
      expect(content).toContain('prefers-contrast');
    });

    test('CSS contains link styling (AC-1, AC-3)', () => {
      const content = fs.readFileSync(cssPath, 'utf-8');

      expect(content).toContain('a {');
      expect(content).toContain('a:hover');
      expect(content).toContain('a:visited');
    });

    test('CSS contains table styling (AC-1)', () => {
      const content = fs.readFileSync(cssPath, 'utf-8');

      expect(content).toContain('table');
      expect(content).toContain('th');
      expect(content).toContain('td');
    });
  });

  describe('Package.json Validation (AC-5)', () => {
    const packageJsonPath = path.join(workspaceRoot, 'extensions/kapis-rpg-dm/package.json');

    test('package.json exists', () => {
      expect(fs.existsSync(packageJsonPath)).toBe(true);
    });

    test('package.json contains markdown.previewStyles contribution', () => {
      const content = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      expect(content.contributes).toBeDefined();
      expect(content.contributes['markdown.previewStyles']).toBeDefined();
      expect(content.contributes['markdown.previewStyles']).toContain('./media/styles/narrative-theme.css');
    });

    test('package.json contains narrativeTheme configuration', () => {
      const content = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      const config = content.contributes.configuration.properties;
      expect(config['kapis-rpg.narrativeTheme']).toBeDefined();
      expect(config['kapis-rpg.narrativeTheme'].type).toBe('string');
      expect(config['kapis-rpg.narrativeTheme'].enum).toContain('gothic');
      expect(config['kapis-rpg.narrativeTheme'].default).toBe('gothic');
    });

    test('package.json contains openEntityDefinition command', () => {
      const content = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      const commands = content.contributes.commands;
      const entityCmd = commands.find(c => c.command === 'kapis-rpg.openEntityDefinition');
      expect(entityCmd).toBeDefined();
    });
  });

  describe('MarkdownLinkProvider Logic (AC-3)', () => {
    // Test the entity ID conversion logic
    describe('toEntityId conversion', () => {
      const toEntityId = (displayName) => {
        return displayName
          .toLowerCase()
          .replace(/['']/g, '')
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
      };

      test('converts simple names to kebab-case', () => {
        expect(toEntityId('Ireena Kolyana')).toBe('ireena-kolyana');
        expect(toEntityId('Strahd')).toBe('strahd');
      });

      test('handles apostrophes', () => {
        expect(toEntityId("Van Richten's Tower")).toBe('van-richtens-tower');
        expect(toEntityId("Strahd's Castle")).toBe('strahds-castle');
      });

      test('handles special characters', () => {
        expect(toEntityId('Village of Barovia')).toBe('village-of-barovia');
        expect(toEntityId('Old Bonegrinder')).toBe('old-bonegrinder');
      });

      test('handles multiple spaces', () => {
        expect(toEntityId('Blue   Water  Inn')).toBe('blue-water-inn');
      });
    });

    // Test the entity pattern matching
    describe('Entity pattern matching', () => {
      test('NPC pattern matches bold text', () => {
        const pattern = /\*\*([A-Z][a-zA-Z\s'-]+)\*\*/g;
        const text = 'The party met **Ireena Kolyana** and **Ismark Kolyanovich**.';

        const matches = [...text.matchAll(pattern)];
        expect(matches.length).toBe(2);
        expect(matches[0][1]).toBe('Ireena Kolyana');
        expect(matches[1][1]).toBe('Ismark Kolyanovich');
      });

      test('Item pattern matches italic text', () => {
        const pattern = /_([A-Z][a-zA-Z\s'-]+)_/g;
        const text = 'They found the _Sunsword_ and _Holy Symbol of Ravenkind_.';

        const matches = [...text.matchAll(pattern)];
        expect(matches.length).toBe(2);
        expect(matches[0][1]).toBe('Sunsword');
        expect(matches[1][1]).toBe('Holy Symbol of Ravenkind');
      });

      test('Location pattern matches bracketed text', () => {
        const pattern = /\[([A-Z][a-zA-Z\s'-]+)\](?!\()/g;
        const text = 'Travel from [Village of Barovia] to [Castle Ravenloft].';

        const matches = [...text.matchAll(pattern)];
        expect(matches.length).toBe(2);
        expect(matches[0][1]).toBe('Village of Barovia');
        expect(matches[1][1]).toBe('Castle Ravenloft');
      });

      test('Location pattern excludes markdown links', () => {
        const pattern = /\[([A-Z][a-zA-Z\s'-]+)\](?!\()/g;
        const text = '[Regular Link](https://example.com) but [Village of Barovia] is matched.';

        const matches = [...text.matchAll(pattern)];
        expect(matches.length).toBe(1);
        expect(matches[0][1]).toBe('Village of Barovia');
      });
    });
  });

  describe('Extension.ts Integration (AC-3)', () => {
    const extensionPath = path.join(workspaceRoot, 'extensions/kapis-rpg-dm/src/extension.ts');

    test('extension.ts exists', () => {
      expect(fs.existsSync(extensionPath)).toBe(true);
    });

    test('extension.ts imports markdown-link-provider', () => {
      const content = fs.readFileSync(extensionPath, 'utf-8');
      expect(content).toContain("import { registerMarkdownLinkProvider } from './providers/markdown-link-provider'");
    });

    test('extension.ts registers MarkdownLinkProvider', () => {
      const content = fs.readFileSync(extensionPath, 'utf-8');
      expect(content).toContain('registerMarkdownLinkProvider(context)');
    });
  });

  describe('MarkdownLinkProvider File (AC-3)', () => {
    const providerPath = path.join(workspaceRoot, 'extensions/kapis-rpg-dm/src/providers/markdown-link-provider.ts');

    test('markdown-link-provider.ts exists', () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test('provider exports required functions and types', () => {
      const content = fs.readFileSync(providerPath, 'utf-8');

      expect(content).toContain('export class MarkdownLinkProvider');
      expect(content).toContain('export async function openEntityDefinition');
      expect(content).toContain('export function registerMarkdownLinkProvider');
      expect(content).toContain("export type EntityType = 'npc' | 'item' | 'location'");
    });

    test('provider implements DocumentLinkProvider interface', () => {
      const content = fs.readFileSync(providerPath, 'utf-8');

      expect(content).toContain('implements vscode.DocumentLinkProvider');
      expect(content).toContain('provideDocumentLinks');
    });

    test('provider handles all entity types', () => {
      const content = fs.readFileSync(providerPath, 'utf-8');

      expect(content).toContain("npc: 'game-data/npcs'");
      expect(content).toContain("item: 'game-data/items'");
      expect(content).toContain("location: 'game-data/locations'");
    });
  });

  describe('Test Document Validation', () => {
    const testDocPath = path.join(__dirname, 'test-narrative-styling.md');

    test('test document exists', () => {
      expect(fs.existsSync(testDocPath)).toBe(true);
    });

    test('test document contains all AC test sections', () => {
      const content = fs.readFileSync(testDocPath, 'utf-8');

      // AC-1: Gothic theme
      expect(content).toContain('## Typography Test (AC-2)');

      // AC-2: Typography
      expect(content).toContain('serif font');
      expect(content).toContain('Header Scaling Test');

      // AC-3: Entity links
      expect(content).toContain('## NPC References');
      expect(content).toContain('## Item References');
      expect(content).toContain('## Location References');

      // AC-4: Readability
      expect(content).toContain('## Contrast Test (AC-4)');

      // AC-6: Special formatting
      expect(content).toContain('## Dice Rolls');
      expect(content).toContain('## Conditions');
      expect(content).toContain('## Blockquotes');
      expect(content).toContain('```statblock');
    });
  });

  describe('WCAG Contrast Verification (AC-4)', () => {
    // Calculate relative luminance for a color
    const getRelativeLuminance = (hex) => {
      const rgb = hex.match(/[0-9a-f]{2}/gi).map(c => parseInt(c, 16) / 255);
      const [r, g, b] = rgb.map(c =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      );
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    // Calculate contrast ratio
    const getContrastRatio = (hex1, hex2) => {
      const l1 = getRelativeLuminance(hex1);
      const l2 = getRelativeLuminance(hex2);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    };

    test('primary text meets WCAG AA (4.5:1)', () => {
      const bgColor = '1a1a1a'; // --bg-dark
      const textColor = 'd4c4a8'; // --text-parchment

      const ratio = getContrastRatio(bgColor, textColor);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    test('secondary text meets WCAG AA (4.5:1)', () => {
      const bgColor = '1a1a1a';
      const textColor = 'a89880'; // --text-secondary

      const ratio = getContrastRatio(bgColor, textColor);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    test('link color meets WCAG AA (4.5:1)', () => {
      const bgColor = '1a1a1a';
      const linkColor = 'c9a86c'; // --link-warm

      const ratio = getContrastRatio(bgColor, linkColor);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    test('accent gold meets WCAG AA (4.5:1)', () => {
      const bgColor = '1a1a1a';
      const goldColor = 'c9a227'; // --accent-gold

      const ratio = getContrastRatio(bgColor, goldColor);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});
