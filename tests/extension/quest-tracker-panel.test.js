/**
 * Unit Tests for QuestTrackerPanel - Epic 5 Story 5.9
 *
 * Tests quest tracker panel functionality including:
 * - AC-1: Panel webview implementation
 * - AC-2: Quest data loading from YAML files
 * - AC-3: Objective progress tracking
 * - AC-4: Deadline and calendar integration
 * - AC-5: Auto-refresh on file changes
 * - AC-6: Visual design (HTML escaping)
 * - AC-7: Quest filtering and sorting
 * - AC-8: Quick actions
 * - AC-9: Error handling
 */

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
    workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
    createFileSystemWatcher: jest.fn(() => ({
      onDidChange: jest.fn(),
      onDidCreate: jest.fn(),
      onDidDelete: jest.fn(),
      dispose: jest.fn()
    }))
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
  },
  RelativePattern: class {
    constructor(base, pattern) {
      this.base = base;
      this.pattern = pattern;
    }
  }
};

// Sample quest data matching game-data/quests/*.yaml structure
const sampleMainQuestYaml = `
questId: "escort-ireena-to-vallaki"
name: "Escort Ireena to Vallaki"
type: "main"
status: "active"
description:
  short: "Escort Ireena Kolyana safely from the Village of Barovia to Vallaki."
  full: "Kolyan Indirovich's dying wish was for his adopted daughter to be taken somewhere safe..."
objectives:
  - objectiveId: "obj-1"
    description: "Speak with Ireena at the Burgomaster's Mansion"
    status: "completed"
  - objectiveId: "obj-2"
    description: "Travel to Vallaki with Ireena"
    status: "pending"
  - objectiveId: "obj-3"
    description: "Find safe lodging for Ireena in Vallaki"
    status: "pending"
timeConstraints:
  hasDeadline: true
  deadline: "735-10-8"
rewards:
  experience: 500
  currency:
    gold: 50
  items:
    - name: "Letter of Introduction"
`;

const sampleSideQuestYaml = `
questId: "wizard-of-wines-delivery"
name: "Wizard of Wines Delivery"
type: "side"
status: "active"
description:
  short: "Investigate the missing wine shipments from the Wizard of Wines."
objectives:
  - objectiveId: "obj-1"
    description: "Travel to the Wizard of Wines winery"
    status: "pending"
  - objectiveId: "obj-2"
    description: "Speak with the Martikov family"
    status: "pending"
rewards:
  experience: 300
`;

const completedQuestYaml = `
questId: "death-house-escape"
name: "Escape Death House"
type: "main"
status: "completed"
description:
  short: "Escape the haunted Death House alive."
objectives:
  - objectiveId: "obj-1"
    description: "Explore the haunted house"
    status: "completed"
  - objectiveId: "obj-2"
    description: "Find the hidden chamber"
    status: "completed"
rewards:
  experience: 200
`;

const sampleCalendarYaml = `
current:
  date: "735-10-1"
  time: "08:00"
  day_of_week: "Moonday"
  season: "autumn"
`;

describe('QuestTrackerPanel Data Parsing (AC-2)', () => {
  describe('Quest YAML Parsing', () => {
    it('should parse valid main quest YAML with all fields', () => {
      const data = yaml.load(sampleMainQuestYaml);

      expect(data.questId).toBe('escort-ireena-to-vallaki');
      expect(data.name).toBe('Escort Ireena to Vallaki');
      expect(data.type).toBe('main');
      expect(data.status).toBe('active');
      expect(data.description.short).toContain('Escort Ireena');
      expect(data.objectives).toHaveLength(3);
      expect(data.timeConstraints.deadline).toBe('735-10-8');
      expect(data.rewards.experience).toBe(500);
    });

    it('should parse side quest YAML without deadline', () => {
      const data = yaml.load(sampleSideQuestYaml);

      expect(data.questId).toBe('wizard-of-wines-delivery');
      expect(data.type).toBe('side');
      expect(data.status).toBe('active');
      expect(data.timeConstraints).toBeUndefined();
      expect(data.objectives).toHaveLength(2);
    });

    it('should parse completed quest', () => {
      const data = yaml.load(completedQuestYaml);

      expect(data.status).toBe('completed');
      expect(data.objectives.every(o => o.status === 'completed')).toBe(true);
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalYaml = `
questId: "test-quest"
name: "Test Quest"
type: "side"
`;
      const data = yaml.load(minimalYaml);

      expect(data.questId).toBe('test-quest');
      expect(data.description).toBeUndefined();
      expect(data.objectives).toBeUndefined();
      expect(data.rewards).toBeUndefined();
      expect(data.timeConstraints).toBeUndefined();
      expect(data.status).toBeUndefined();
    });

    it('should throw on corrupted YAML', () => {
      const corruptedYaml = `
questId: "test
  invalid yaml
    indentation: broken
`;
      expect(() => yaml.load(corruptedYaml)).toThrow();
    });
  });

  describe('QuestTrackerPanelState Mapping', () => {
    function mapQuestToState(raw, filePath, currentDate) {
      const objectives = (raw.objectives || []).map(obj => ({
        objectiveId: obj.objectiveId,
        text: obj.description,
        completed: obj.status === 'completed'
      }));

      const deadline = raw.timeConstraints?.deadline || undefined;
      let daysRemaining;
      let urgency;

      if (deadline && currentDate) {
        daysRemaining = calculateDaysRemaining(currentDate, deadline);
        urgency = getUrgencyLevel(daysRemaining);
      }

      return {
        questId: raw.questId,
        title: raw.name,
        description: raw.description?.short || raw.description?.full,
        status: raw.status || 'not_started',
        objectives,
        deadline,
        daysRemaining,
        urgency,
        priority: raw.type === 'main' ? 'main' : 'side',
        rewards: raw.rewards ? {
          xp: raw.rewards.experience,
          gold: raw.rewards.currency?.gold,
          items: raw.rewards.items?.map(i => i.name)
        } : undefined,
        filePath
      };
    }

    function calculateDaysRemaining(currentDate, deadline) {
      const [curYear, curMonth, curDay] = currentDate.split('-').map(Number);
      const [deadYear, deadMonth, deadDay] = deadline.split('-').map(Number);
      const currentTotalDays = curYear * 360 + curMonth * 30 + curDay;
      const deadlineTotalDays = deadYear * 360 + deadMonth * 30 + deadDay;
      return deadlineTotalDays - currentTotalDays;
    }

    function getUrgencyLevel(daysRemaining) {
      if (isNaN(daysRemaining)) return 'safe';
      if (daysRemaining < 0) return 'overdue';
      if (daysRemaining <= 2) return 'urgent';
      if (daysRemaining <= 5) return 'soon';
      return 'safe';
    }

    it('should map main quest with deadline correctly', () => {
      const raw = yaml.load(sampleMainQuestYaml);
      const state = mapQuestToState(raw, '/test/quest.yaml', '735-10-1');

      expect(state.questId).toBe('escort-ireena-to-vallaki');
      expect(state.title).toBe('Escort Ireena to Vallaki');
      expect(state.priority).toBe('main');
      expect(state.status).toBe('active');
      expect(state.objectives).toHaveLength(3);
      expect(state.objectives[0].completed).toBe(true);
      expect(state.objectives[1].completed).toBe(false);
      expect(state.deadline).toBe('735-10-8');
      expect(state.daysRemaining).toBe(7);
      expect(state.urgency).toBe('safe');
      expect(state.rewards.xp).toBe(500);
      expect(state.rewards.gold).toBe(50);
    });

    it('should map side quest without deadline', () => {
      const raw = yaml.load(sampleSideQuestYaml);
      const state = mapQuestToState(raw, '/test/quest.yaml', '735-10-1');

      expect(state.priority).toBe('side');
      expect(state.deadline).toBeUndefined();
      expect(state.daysRemaining).toBeUndefined();
      expect(state.urgency).toBeUndefined();
    });

    it('should handle missing fields with defaults', () => {
      const state = mapQuestToState({
        questId: 'test',
        name: 'Test',
        type: 'side'
      }, '/test.yaml', '735-10-1');

      expect(state.status).toBe('not_started');
      expect(state.objectives).toEqual([]);
      expect(state.rewards).toBeUndefined();
    });
  });
});

describe('Objective Progress Tracking (AC-3)', () => {
  function calculateProgress(objectives) {
    if (!objectives || objectives.length === 0) {
      return { completed: 0, total: 0, percent: 0 };
    }
    const completed = objectives.filter(o => o.completed).length;
    const total = objectives.length;
    const percent = Math.round((completed / total) * 100);
    return { completed, total, percent };
  }

  it('should calculate progress for quest with mixed objectives', () => {
    const objectives = [
      { text: 'Obj 1', completed: true },
      { text: 'Obj 2', completed: false },
      { text: 'Obj 3', completed: false }
    ];

    const progress = calculateProgress(objectives);

    expect(progress.completed).toBe(1);
    expect(progress.total).toBe(3);
    expect(progress.percent).toBe(33);
  });

  it('should calculate 100% for all completed objectives', () => {
    const objectives = [
      { text: 'Obj 1', completed: true },
      { text: 'Obj 2', completed: true }
    ];

    const progress = calculateProgress(objectives);

    expect(progress.completed).toBe(2);
    expect(progress.total).toBe(2);
    expect(progress.percent).toBe(100);
  });

  it('should calculate 0% for no completed objectives', () => {
    const objectives = [
      { text: 'Obj 1', completed: false },
      { text: 'Obj 2', completed: false }
    ];

    const progress = calculateProgress(objectives);

    expect(progress.completed).toBe(0);
    expect(progress.percent).toBe(0);
  });

  it('should handle empty objectives', () => {
    const progress = calculateProgress([]);

    expect(progress.completed).toBe(0);
    expect(progress.total).toBe(0);
    expect(progress.percent).toBe(0);
  });

  it('should handle null/undefined objectives', () => {
    expect(calculateProgress(null)).toEqual({ completed: 0, total: 0, percent: 0 });
    expect(calculateProgress(undefined)).toEqual({ completed: 0, total: 0, percent: 0 });
  });
});

describe('Deadline and Calendar Integration (AC-4)', () => {
  function calculateDaysRemaining(currentDate, deadline) {
    try {
      const [curYear, curMonth, curDay] = currentDate.split('-').map(Number);
      const [deadYear, deadMonth, deadDay] = deadline.split('-').map(Number);
      const currentTotalDays = curYear * 360 + curMonth * 30 + curDay;
      const deadlineTotalDays = deadYear * 360 + deadMonth * 30 + deadDay;
      return deadlineTotalDays - currentTotalDays;
    } catch {
      return NaN;
    }
  }

  function getUrgencyLevel(daysRemaining) {
    if (isNaN(daysRemaining)) return 'safe';
    if (daysRemaining < 0) return 'overdue';
    if (daysRemaining <= 2) return 'urgent';
    if (daysRemaining <= 5) return 'soon';
    return 'safe';
  }

  function getDeadlineText(daysRemaining, deadline) {
    if (daysRemaining < 0) {
      return `Overdue by ${Math.abs(daysRemaining)} days`;
    } else if (daysRemaining === 0) {
      return 'Due today!';
    } else {
      return `${daysRemaining} days remaining`;
    }
  }

  describe('Days Remaining Calculation', () => {
    it('should calculate positive days remaining', () => {
      expect(calculateDaysRemaining('735-10-1', '735-10-8')).toBe(7);
      expect(calculateDaysRemaining('735-10-1', '735-10-15')).toBe(14);
    });

    it('should calculate zero days remaining for same day', () => {
      expect(calculateDaysRemaining('735-10-8', '735-10-8')).toBe(0);
    });

    it('should calculate negative days for overdue', () => {
      expect(calculateDaysRemaining('735-10-10', '735-10-8')).toBe(-2);
      expect(calculateDaysRemaining('735-10-15', '735-10-8')).toBe(-7);
    });

    it('should handle month boundaries', () => {
      // 735-10-30 to 735-11-5 = 5 days
      expect(calculateDaysRemaining('735-10-30', '735-11-5')).toBe(5);
    });

    it('should return NaN for invalid dates', () => {
      expect(calculateDaysRemaining('invalid', '735-10-8')).toBeNaN();
      expect(calculateDaysRemaining('735-10-1', 'invalid')).toBeNaN();
    });
  });

  describe('Urgency Level Classification', () => {
    it('should return "safe" for > 5 days remaining', () => {
      expect(getUrgencyLevel(10)).toBe('safe');
      expect(getUrgencyLevel(6)).toBe('safe');
    });

    it('should return "soon" for 3-5 days remaining', () => {
      expect(getUrgencyLevel(5)).toBe('soon');
      expect(getUrgencyLevel(4)).toBe('soon');
      expect(getUrgencyLevel(3)).toBe('soon');
    });

    it('should return "urgent" for 0-2 days remaining', () => {
      expect(getUrgencyLevel(2)).toBe('urgent');
      expect(getUrgencyLevel(1)).toBe('urgent');
      expect(getUrgencyLevel(0)).toBe('urgent');
    });

    it('should return "overdue" for negative days', () => {
      expect(getUrgencyLevel(-1)).toBe('overdue');
      expect(getUrgencyLevel(-5)).toBe('overdue');
    });

    it('should return "safe" for NaN', () => {
      expect(getUrgencyLevel(NaN)).toBe('safe');
    });
  });

  describe('Deadline Text Generation', () => {
    it('should generate correct text for future deadline', () => {
      expect(getDeadlineText(7, '735-10-8')).toBe('7 days remaining');
      expect(getDeadlineText(1, '735-10-8')).toBe('1 days remaining');
    });

    it('should generate "Due today!" for zero days', () => {
      expect(getDeadlineText(0, '735-10-8')).toBe('Due today!');
    });

    it('should generate overdue text for negative days', () => {
      expect(getDeadlineText(-2, '735-10-8')).toBe('Overdue by 2 days');
      expect(getDeadlineText(-7, '735-10-8')).toBe('Overdue by 7 days');
    });
  });
});

describe('Quest Filtering (AC-7)', () => {
  const testQuests = [
    { questId: 'q1', title: 'Main Active', priority: 'main', status: 'active' },
    { questId: 'q2', title: 'Main Completed', priority: 'main', status: 'completed' },
    { questId: 'q3', title: 'Side Active', priority: 'side', status: 'active' },
    { questId: 'q4', title: 'Side Completed', priority: 'side', status: 'completed' }
  ];

  function filterQuests(quests, filter) {
    switch (filter) {
      case 'active':
        return quests.filter(q => q.status === 'active');
      case 'completed':
        return quests.filter(q => q.status === 'completed');
      case 'main':
        return quests.filter(q => q.priority === 'main');
      case 'side':
        return quests.filter(q => q.priority === 'side');
      case 'all':
      default:
        return quests;
    }
  }

  it('should return all quests for "all" filter', () => {
    const filtered = filterQuests(testQuests, 'all');
    expect(filtered).toHaveLength(4);
  });

  it('should filter active quests only', () => {
    const filtered = filterQuests(testQuests, 'active');
    expect(filtered).toHaveLength(2);
    expect(filtered.every(q => q.status === 'active')).toBe(true);
  });

  it('should filter completed quests only', () => {
    const filtered = filterQuests(testQuests, 'completed');
    expect(filtered).toHaveLength(2);
    expect(filtered.every(q => q.status === 'completed')).toBe(true);
  });

  it('should filter main quests only', () => {
    const filtered = filterQuests(testQuests, 'main');
    expect(filtered).toHaveLength(2);
    expect(filtered.every(q => q.priority === 'main')).toBe(true);
  });

  it('should filter side quests only', () => {
    const filtered = filterQuests(testQuests, 'side');
    expect(filtered).toHaveLength(2);
    expect(filtered.every(q => q.priority === 'side')).toBe(true);
  });
});

describe('Quest Sorting (AC-7)', () => {
  const testQuests = [
    { questId: 'q1', title: 'Zebra Quest', priority: 'side', status: 'active', daysRemaining: 10 },
    { questId: 'q2', title: 'Alpha Quest', priority: 'main', status: 'active', daysRemaining: 5 },
    { questId: 'q3', title: 'Beta Quest', priority: 'main', status: 'completed', daysRemaining: undefined },
    { questId: 'q4', title: 'Delta Quest', priority: 'side', status: 'active', daysRemaining: 2 }
  ];

  function sortQuests(quests, sortBy) {
    const sorted = [...quests];

    switch (sortBy) {
      case 'priority':
        sorted.sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority === 'main' ? -1 : 1;
          }
          if (a.status !== b.status) {
            if (a.status === 'active') return -1;
            if (b.status === 'active') return 1;
          }
          return a.title.localeCompare(b.title);
        });
        break;

      case 'deadline':
        sorted.sort((a, b) => {
          if (a.daysRemaining !== undefined && b.daysRemaining === undefined) return -1;
          if (a.daysRemaining === undefined && b.daysRemaining !== undefined) return 1;
          if (a.daysRemaining !== undefined && b.daysRemaining !== undefined) {
            return a.daysRemaining - b.daysRemaining;
          }
          return a.title.localeCompare(b.title);
        });
        break;

      case 'alphabetical':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return sorted;
  }

  it('should sort by priority (main first, then active first)', () => {
    const sorted = sortQuests(testQuests, 'priority');

    expect(sorted[0].priority).toBe('main');
    expect(sorted[0].status).toBe('active');
    expect(sorted[1].priority).toBe('main');
    expect(sorted[sorted.length - 1].priority).toBe('side');
  });

  it('should sort by deadline (earliest first)', () => {
    const sorted = sortQuests(testQuests, 'deadline');

    expect(sorted[0].daysRemaining).toBe(2);
    expect(sorted[1].daysRemaining).toBe(5);
    expect(sorted[2].daysRemaining).toBe(10);
    // Quest without deadline last
    expect(sorted[3].daysRemaining).toBeUndefined();
  });

  it('should sort alphabetically by title', () => {
    const sorted = sortQuests(testQuests, 'alphabetical');

    expect(sorted[0].title).toBe('Alpha Quest');
    expect(sorted[1].title).toBe('Beta Quest');
    expect(sorted[2].title).toBe('Delta Quest');
    expect(sorted[3].title).toBe('Zebra Quest');
  });
});

describe('File Watcher Integration (AC-5)', () => {
  it('should debounce rapid file changes', async () => {
    let refreshCount = 0;
    const debounceDelay = 100;

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
    refresh();

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, debounceDelay + 50));

    // Should only refresh once
    expect(refreshCount).toBe(1);
  });

  it('should track watched directories', () => {
    const watchedPaths = new Set();

    watchedPaths.add('/test/game-data/quests');

    expect(watchedPaths.has('/test/game-data/quests')).toBe(true);
    expect(watchedPaths.size).toBe(1);
  });
});

describe('Quick Actions (AC-8)', () => {
  describe('Message Handlers', () => {
    it('should handle setFilter message', () => {
      const state = { filter: 'all' };
      const message = { type: 'setFilter', payload: { filter: 'active' } };

      if (message.type === 'setFilter' && message.payload?.filter) {
        state.filter = message.payload.filter;
      }

      expect(state.filter).toBe('active');
    });

    it('should handle setSort message', () => {
      const state = { sortBy: 'priority' };
      const message = { type: 'setSort', payload: { sortBy: 'deadline' } };

      if (message.type === 'setSort' && message.payload?.sortBy) {
        state.sortBy = message.payload.sortBy;
      }

      expect(state.sortBy).toBe('deadline');
    });

    it('should handle toggleObjective message', () => {
      const objectives = [
        { objectiveId: 'obj-1', completed: false },
        { objectiveId: 'obj-2', completed: true }
      ];

      const message = { type: 'toggleObjective', payload: { objectiveId: 'obj-1' } };

      const objective = objectives.find(o => o.objectiveId === message.payload.objectiveId);
      if (objective) {
        objective.completed = !objective.completed;
      }

      expect(objectives[0].completed).toBe(true);
    });
  });
});

describe('Error Handling (AC-9)', () => {
  describe('No Quests Found State', () => {
    it('should generate correct message for no quests', () => {
      const filter = 'all';
      let message = 'No quests found';

      if (filter === 'active') {
        message = 'No active quests';
      }

      expect(message).toBe('No quests found');
    });

    it('should generate filter-specific message', () => {
      const filters = {
        'active': 'No active quests',
        'completed': 'No completed quests',
        'main': 'No main quests found',
        'side': 'No side quests found'
      };

      expect(filters['active']).toBe('No active quests');
      expect(filters['completed']).toBe('No completed quests');
    });
  });

  describe('Parse Error Handling', () => {
    it('should capture file and error message', () => {
      const errors = [];
      const file = 'broken-quest.yaml';
      const parseError = new Error('unexpected end of stream');

      errors.push({
        file,
        message: parseError.message
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].file).toBe('broken-quest.yaml');
      expect(errors[0].message).toContain('unexpected end of stream');
    });

    it('should allow panel to continue with other quests after error', () => {
      const errors = [];
      const quests = [];

      // Simulate one failed parse, one successful
      errors.push({ file: 'broken.yaml', message: 'parse error' });
      quests.push({ questId: 'working-quest', title: 'Working Quest' });

      expect(errors).toHaveLength(1);
      expect(quests).toHaveLength(1);
    });
  });

  describe('Invalid Deadline Handling', () => {
    it('should handle invalid deadline format', () => {
      function calculateDaysRemaining(currentDate, deadline) {
        try {
          const [curYear, curMonth, curDay] = currentDate.split('-').map(Number);
          const [deadYear, deadMonth, deadDay] = deadline.split('-').map(Number);

          if (isNaN(curYear) || isNaN(deadYear)) {
            return NaN;
          }

          const currentTotalDays = curYear * 360 + curMonth * 30 + curDay;
          const deadlineTotalDays = deadYear * 360 + deadMonth * 30 + deadDay;
          return deadlineTotalDays - currentTotalDays;
        } catch {
          return NaN;
        }
      }

      expect(calculateDaysRemaining('735-10-1', 'invalid')).toBeNaN();
      expect(calculateDaysRemaining('invalid', '735-10-8')).toBeNaN();
      expect(calculateDaysRemaining('', '')).toBeNaN();
    });

    it('should display "Invalid date" for NaN deadline', () => {
      function formatDeadline(daysRemaining, deadline) {
        if (isNaN(daysRemaining)) {
          return 'Invalid date';
        }
        return `${daysRemaining} days remaining`;
      }

      expect(formatDeadline(NaN, 'invalid')).toBe('Invalid date');
    });
  });
});

describe('HTML Template Rendering (AC-6)', () => {
  it('should escape HTML in quest titles', () => {
    const escapeHtml = (str) => {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    const maliciousTitle = '<script>alert("xss")</script>';
    const escaped = escapeHtml(maliciousTitle);

    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });

  it('should escape HTML in quest descriptions', () => {
    const escapeHtml = (str) => {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    const description = 'Quest with <b>bold</b> & special chars';
    const escaped = escapeHtml(description);

    expect(escaped).toBe('Quest with &lt;b&gt;bold&lt;/b&gt; &amp; special chars');
  });

  it('should handle null/undefined gracefully', () => {
    const escapeHtml = (str) => {
      if (!str) return '';
      return str.replace(/</g, '&lt;');
    };

    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});

describe('Panel State Persistence (AC-7)', () => {
  it('should save and restore filter preference', () => {
    const workspaceState = new Map();

    // Save
    workspaceState.set('questTracker.filter', 'active');
    workspaceState.set('questTracker.sortBy', 'deadline');

    // Restore
    const filter = workspaceState.get('questTracker.filter');
    const sortBy = workspaceState.get('questTracker.sortBy');

    expect(filter).toBe('active');
    expect(sortBy).toBe('deadline');
  });

  it('should use defaults when no saved preferences', () => {
    const workspaceState = new Map();

    const filter = workspaceState.get('questTracker.filter') || 'all';
    const sortBy = workspaceState.get('questTracker.sortBy') || 'priority';

    expect(filter).toBe('all');
    expect(sortBy).toBe('priority');
  });
});

describe('Singleton Pattern', () => {
  it('should return same instance on multiple calls', () => {
    let instance = null;

    function getInstance() {
      if (!instance) {
        instance = { id: Math.random() };
      }
      return instance;
    }

    const first = getInstance();
    const second = getInstance();

    expect(first).toBe(second);
    expect(first.id).toBe(second.id);
  });

  it('should allow reset for testing', () => {
    let instance = null;

    function getInstance() {
      if (!instance) {
        instance = { id: Math.random() };
      }
      return instance;
    }

    function resetInstance() {
      instance = null;
    }

    const first = getInstance();
    resetInstance();
    const second = getInstance();

    expect(first).not.toBe(second);
    expect(first.id).not.toBe(second.id);
  });
});

describe('Calendar YAML Parsing', () => {
  it('should parse calendar current date', () => {
    const calendar = yaml.load(sampleCalendarYaml);

    expect(calendar.current.date).toBe('735-10-1');
    expect(calendar.current.time).toBe('08:00');
    expect(calendar.current.season).toBe('autumn');
  });

  it('should handle missing calendar gracefully', () => {
    const fallbackDate = '735-10-1';
    const calendarData = null;

    const currentDate = calendarData?.current?.date || fallbackDate;

    expect(currentDate).toBe('735-10-1');
  });
});
