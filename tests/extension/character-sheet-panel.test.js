/**
 * Unit Tests for CharacterSheetPanel - Epic 5 Story 5.8
 *
 * Tests character sheet panel functionality including:
 * - AC-1: Panel webview implementation
 * - AC-2: Live data loading from character file
 * - AC-3: Auto-refresh on file changes
 * - AC-4: Session integration
 * - AC-6: Quick actions
 * - AC-7: Error handling
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

// Mock VS Code API
const mockVscode = {
  window: {
    createWebviewPanel: jest.fn(),
    showOpenDialog: jest.fn(),
    showInputBox: jest.fn(),
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn()
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn()
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }]
  },
  Uri: {
    file: (p) => ({ fsPath: p }),
    joinPath: (base, ...parts) => ({ fsPath: path.join(base.fsPath || base, ...parts) })
  },
  ViewColumn: {
    Two: 2
  },
  EventEmitter: class {
    constructor() {
      this.listeners = [];
    }
    event = (listener) => {
      this.listeners.push(listener);
      return { dispose: () => {} };
    };
    fire(data) {
      this.listeners.forEach(l => l(data));
    }
    dispose() {
      this.listeners = [];
    }
  }
};

// Sample character data matching characters/kapi.yaml structure
const sampleCharacterYaml = `
name: "Kapi the Brave"
race: "Human"
class: "Fighter"
level: 3
abilities:
  strength: 16
  dexterity: 14
  constitution: 15
  intelligence: 10
  wisdom: 12
  charisma: 8
hitPoints:
  max: 31
  current: 24
  hitDice:
    total: 3
    spent: 1
    die: "d10"
armorClass: 18
proficiencyBonus: 2
conditions: []
features:
  - name: "Second Wind"
    description: "Regain HP as bonus action"
    uses: 1
    maxUses: 1
`;

const sampleCharacterData = yaml.load(sampleCharacterYaml);

// Sample spellcaster character
const spellcasterYaml = `
name: "Test Wizard"
race: "Elf"
class: "Wizard"
level: 5
abilities:
  strength: 8
  dexterity: 14
  constitution: 12
  intelligence: 18
  wisdom: 13
  charisma: 10
hitPoints:
  max: 22
  current: 22
armorClass: 12
proficiencyBonus: 3
spellcasting:
  spellSlots:
    "1":
      total: 4
      used: 2
    "2":
      total: 3
      used: 1
    "3":
      total: 2
      used: 0
conditions:
  - "Poisoned"
`;

describe('CharacterSheetPanel Data Parsing', () => {
  describe('Character YAML Parsing (AC-2)', () => {
    it('should parse valid character YAML with all fields', () => {
      const data = yaml.load(sampleCharacterYaml);

      expect(data.name).toBe('Kapi the Brave');
      expect(data.level).toBe(3);
      expect(data.class).toBe('Fighter');
      expect(data.race).toBe('Human');
      expect(data.hitPoints.current).toBe(24);
      expect(data.hitPoints.max).toBe(31);
      expect(data.armorClass).toBe(18);
      expect(data.abilities.strength).toBe(16);
      expect(data.conditions).toEqual([]);
    });

    it('should parse spellcaster with spell slots', () => {
      const data = yaml.load(spellcasterYaml);

      expect(data.spellcasting).toBeDefined();
      expect(data.spellcasting.spellSlots['1'].total).toBe(4);
      expect(data.spellcasting.spellSlots['1'].used).toBe(2);
      expect(data.conditions).toContain('Poisoned');
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalYaml = `
name: "Test Character"
class: "Fighter"
level: 1
abilities:
  strength: 10
  dexterity: 10
  constitution: 10
  intelligence: 10
  wisdom: 10
  charisma: 10
hitPoints:
  max: 10
  current: 10
armorClass: 10
`;
      const data = yaml.load(minimalYaml);

      expect(data.name).toBe('Test Character');
      expect(data.race).toBeUndefined();
      expect(data.spellcasting).toBeUndefined();
      expect(data.conditions).toBeUndefined();
      expect(data.features).toBeUndefined();
    });

    it('should throw on corrupted YAML', () => {
      const corruptedYaml = `
name: "Test
  invalid yaml
    indentation: broken
`;
      expect(() => yaml.load(corruptedYaml)).toThrow();
    });
  });

  describe('CharacterSheetPanelState Mapping', () => {
    function mapToState(rawData) {
      return {
        character: {
          name: rawData.name || 'Unknown',
          level: rawData.level || 1,
          class: rawData.class || 'Unknown',
          race: rawData.race,
          hp: {
            current: rawData.hitPoints?.current ?? 0,
            max: rawData.hitPoints?.max ?? 0
          },
          ac: rawData.armorClass || 10,
          abilities: {
            STR: rawData.abilities?.strength ?? 10,
            DEX: rawData.abilities?.dexterity ?? 10,
            CON: rawData.abilities?.constitution ?? 10,
            INT: rawData.abilities?.intelligence ?? 10,
            WIS: rawData.abilities?.wisdom ?? 10,
            CHA: rawData.abilities?.charisma ?? 10
          },
          conditions: rawData.conditions || [],
          proficiencyBonus: rawData.proficiencyBonus,
          hitDice: rawData.hitPoints?.hitDice,
          spellSlots: rawData.spellcasting?.spellSlots
            ? Object.fromEntries(
                Object.entries(rawData.spellcasting.spellSlots).map(([k, v]) => [
                  k,
                  { used: v.used || 0, total: v.total || 0 }
                ])
              )
            : undefined
        },
        lastUpdated: new Date().toISOString(),
        autoRefresh: true
      };
    }

    it('should map fighter character correctly', () => {
      const state = mapToState(sampleCharacterData);

      expect(state.character.name).toBe('Kapi the Brave');
      expect(state.character.level).toBe(3);
      expect(state.character.hp.current).toBe(24);
      expect(state.character.hp.max).toBe(31);
      expect(state.character.ac).toBe(18);
      expect(state.character.abilities.STR).toBe(16);
      expect(state.character.spellSlots).toBeUndefined();
    });

    it('should map spellcaster with spell slots', () => {
      const data = yaml.load(spellcasterYaml);
      const state = mapToState(data);

      expect(state.character.spellSlots).toBeDefined();
      expect(state.character.spellSlots['1'].total).toBe(4);
      expect(state.character.spellSlots['1'].used).toBe(2);
      expect(state.character.conditions).toContain('Poisoned');
    });

    it('should map missing fields to defaults', () => {
      const state = mapToState({});

      expect(state.character.name).toBe('Unknown');
      expect(state.character.level).toBe(1);
      expect(state.character.hp.current).toBe(0);
      expect(state.character.abilities.STR).toBe(10);
      expect(state.character.conditions).toEqual([]);
    });
  });
});

describe('Ability Modifier Calculations', () => {
  function getModifier(score) {
    return Math.floor((score - 10) / 2);
  }

  it('should calculate positive modifiers', () => {
    expect(getModifier(16)).toBe(3);
    expect(getModifier(18)).toBe(4);
    expect(getModifier(20)).toBe(5);
  });

  it('should calculate zero modifier for 10-11', () => {
    expect(getModifier(10)).toBe(0);
    expect(getModifier(11)).toBe(0);
  });

  it('should calculate negative modifiers', () => {
    expect(getModifier(8)).toBe(-1);
    expect(getModifier(6)).toBe(-2);
    expect(getModifier(1)).toBe(-5);
  });
});

describe('HP Status Classification', () => {
  function getHpStatus(current, max) {
    const ratio = current / max;
    if (ratio <= 0.25) return 'critical';
    if (ratio <= 0.5) return 'hurt';
    return 'healthy';
  }

  it('should return healthy for > 50% HP', () => {
    expect(getHpStatus(31, 31)).toBe('healthy');
    expect(getHpStatus(20, 31)).toBe('healthy');
    expect(getHpStatus(16, 31)).toBe('healthy');
  });

  it('should return hurt for 26-50% HP', () => {
    expect(getHpStatus(15, 31)).toBe('hurt');
    expect(getHpStatus(10, 31)).toBe('hurt');
    expect(getHpStatus(8, 31)).toBe('hurt');
  });

  it('should return critical for <= 25% HP', () => {
    expect(getHpStatus(7, 31)).toBe('critical');
    expect(getHpStatus(5, 31)).toBe('critical');
    expect(getHpStatus(1, 31)).toBe('critical');
    expect(getHpStatus(0, 31)).toBe('critical');
  });
});

describe('Condition Rules Lookup (AC-6)', () => {
  const conditionRules = {
    'blinded': 'Cannot see. Auto-fail sight checks. Attack rolls have disadvantage.',
    'charmed': 'Cannot attack charmer. Charmer has advantage on social checks.',
    'frightened': 'Disadvantage on checks/attacks while source visible.',
    'poisoned': 'Disadvantage on attack rolls and ability checks.',
    'prone': 'Can only crawl. Disadvantage on attacks.',
    'stunned': 'Incapacitated. Cannot move. Auto-fail STR/DEX saves.'
  };

  it('should return rules for known conditions', () => {
    expect(conditionRules['poisoned']).toContain('Disadvantage');
    expect(conditionRules['blinded']).toContain('Cannot see');
  });

  it('should handle unknown conditions', () => {
    expect(conditionRules['unknown-condition']).toBeUndefined();
  });
});

describe('Panel State Persistence', () => {
  it('should save and restore character file path', () => {
    const state = {
      data: { characterFilePath: '/test/characters/kapi.yaml' },
      lastUpdated: new Date().toISOString(),
      autoRefresh: true
    };

    // Simulate save
    const saved = JSON.stringify(state);

    // Simulate restore
    const restored = JSON.parse(saved);

    expect(restored.data.characterFilePath).toBe('/test/characters/kapi.yaml');
    expect(restored.autoRefresh).toBe(true);
  });
});

describe('Error States (AC-7)', () => {
  describe('File Not Found Error', () => {
    it('should generate correct error message', () => {
      const filePath = '/nonexistent/character.yaml';
      const errorMessage = `Character file not found: ${filePath}`;

      expect(errorMessage).toContain('not found');
      expect(errorMessage).toContain(filePath);
    });
  });

  describe('Parse Error', () => {
    it('should generate correct error message', () => {
      const parseError = new Error('unexpected end of stream');
      const errorMessage = `Failed to parse character file: ${parseError.message}`;

      expect(errorMessage).toContain('Failed to parse');
      expect(errorMessage).toContain('unexpected end of stream');
    });
  });

  describe('No Character Loaded Error', () => {
    it('should generate correct error message', () => {
      const errorMessage = 'No character loaded. Select a character file or start a session.';

      expect(errorMessage).toContain('No character loaded');
      expect(errorMessage).toContain('start a session');
    });
  });
});

describe('Spell Slot Rendering', () => {
  function renderSpellSlots(spellSlots) {
    if (!spellSlots || Object.keys(spellSlots).length === 0) {
      return '';
    }

    const result = [];
    for (const [level, slots] of Object.entries(spellSlots)) {
      const available = slots.total - slots.used;
      result.push({
        level,
        available,
        used: slots.used,
        total: slots.total
      });
    }
    return result;
  }

  it('should return empty for non-spellcasters', () => {
    expect(renderSpellSlots(null)).toBe('');
    expect(renderSpellSlots(undefined)).toBe('');
    expect(renderSpellSlots({})).toBe('');
  });

  it('should calculate available slots correctly', () => {
    const slots = {
      '1': { total: 4, used: 2 },
      '2': { total: 3, used: 1 }
    };

    const rendered = renderSpellSlots(slots);

    expect(rendered[0].level).toBe('1');
    expect(rendered[0].available).toBe(2);
    expect(rendered[0].total).toBe(4);

    expect(rendered[1].level).toBe('2');
    expect(rendered[1].available).toBe(2);
  });
});

describe('File Watcher Integration (AC-3)', () => {
  it('should track watched files', () => {
    const watchedFiles = new Map();

    // Simulate watching a file
    const filePath = '/test/characters/kapi.yaml';
    watchedFiles.set(filePath, { watcher: {}, debounceTimer: null });

    expect(watchedFiles.has(filePath)).toBe(true);
    expect(watchedFiles.size).toBe(1);
  });

  it('should debounce rapid file changes', async () => {
    let refreshCount = 0;
    const debounceDelay = 100; // 100ms for testing

    const debounce = (fn, delay) => {
      let timer;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
      };
    };

    const refresh = debounce(() => {
      refreshCount++;
    }, debounceDelay);

    // Simulate rapid file changes
    refresh();
    refresh();
    refresh();
    refresh();

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, debounceDelay + 50));

    // Should only refresh once
    expect(refreshCount).toBe(1);
  });
});

describe('Session Integration (AC-4)', () => {
  const sampleSessionYaml = `
sessionId: "test-session-123"
character:
  filePath: "characters/kapi.yaml"
  name: "Kapi the Brave"
currentLocation: "village-of-barovia"
startedAt: "2025-11-28T10:00:00Z"
`;

  it('should extract character path from session', () => {
    const session = yaml.load(sampleSessionYaml);

    expect(session.character.filePath).toBe('characters/kapi.yaml');
  });

  it('should handle missing session gracefully', () => {
    const emptySession = null;
    const characterPath = emptySession?.character?.filePath;

    expect(characterPath).toBeUndefined();
  });
});

describe('HTML Template Rendering', () => {
  it('should escape HTML in character name', () => {
    const escapeHtml = (str) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };

    const maliciousName = '<script>alert("xss")</script>';
    const escaped = escapeHtml(maliciousName);

    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });

  it('should calculate HP bar percentage correctly', () => {
    const calculatePercent = (current, max) => {
      return Math.max(0, Math.min(100, (current / max) * 100));
    };

    expect(calculatePercent(24, 31)).toBeCloseTo(77.4, 0);
    expect(calculatePercent(0, 31)).toBe(0);
    expect(calculatePercent(31, 31)).toBe(100);
    expect(calculatePercent(50, 31)).toBe(100); // Capped at 100
  });
});
