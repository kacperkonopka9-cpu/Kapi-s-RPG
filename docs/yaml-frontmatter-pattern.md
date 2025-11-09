# YAML Frontmatter Pattern - Best Practices

**Date:** 2025-11-08
**Author:** Architect
**Purpose:** Document YAML frontmatter pattern for structured data in markdown files
**Status:** Best Practice Documented

---

## Overview

Epic 1 successfully used YAML frontmatter in State.md files to store structured state data while preserving human-readable narrative content. This pattern should be reused throughout the project for:
- **Epic 2:** Calendar events, NPC schedules, weather data
- **Epic 3:** Character sheets, spell lists, inventory
- **Epic 4:** Quest tracking, faction reputation, campaign progress
- **Epic 5:** LLM context caching, session summaries

**Key Insight from Epic 1 Retrospective:**
> "YAML frontmatter for structured data in markdown files works brilliantly. We should use this pattern for other features - maybe for character sheets in Epic 3, quest tracking, calendar events."

---

## Pattern Structure

### Basic Template

```markdown
---
# YAML frontmatter - structured data
field1: value1
field2: value2
nested_object:
  subfield1: value
  subfield2: value
array_field:
  - item1
  - item2
last_updated: 2025-11-08T14:30:00Z
---

# Markdown Content - Human-readable narrative

The narrative content continues below the frontmatter.
This section is for human readers and can contain:
- Prose descriptions
- Story text
- Documentation
- Notes and comments

Both sections coexist in the same file!
```

---

## Epic 1 Implementation: State.md

### Successful Pattern

```markdown
---
visited: true
discovered_items:
  - ancient-sword
  - healing-potion
completed_events:
  - first-visit
  - met-npc
npc_states:
  ismark_kolyanovich:
    mood: friendly
    knows_player: true
custom_state:
  door_unlocked: true
last_updated: 2025-11-08T14:30:00Z
---

# Location State

The player has visited this location before. Ismark remembers the player
and greets them warmly. The door to the basement remains unlocked from
the previous visit.
```

**Why It Works:**
- **Structured:** YAML is easily parsed by js-yaml library
- **Human-readable:** Both data and narrative are in same file
- **Git-friendly:** Text format enables version control and diffs
- **Flexible:** Add new fields without breaking existing code
- **Safe:** YAML.SAFE_SCHEMA prevents code injection

---

## Code Implementation

### Reading YAML Frontmatter

```javascript
const fs = require('fs').promises;
const yaml = require('js-yaml');

async function readFileWithFrontmatter(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');

  // Check for frontmatter delimiters
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) {
    return {
      data: {},  // No frontmatter
      content: content
    };
  }

  // Find end delimiter
  const lines = content.split('\n');
  let endIndex = -1;

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return {
      data: {},  // Malformed frontmatter
      content: content
    };
  }

  // Extract YAML and content
  const yamlContent = lines.slice(1, endIndex).join('\n');
  const markdownContent = lines.slice(endIndex + 1).join('\n');

  // Parse YAML safely
  const data = yaml.load(yamlContent, { schema: yaml.SAFE_SCHEMA });

  return {
    data: data || {},
    content: markdownContent
  };
}
```

### Writing YAML Frontmatter

```javascript
async function writeFileWithFrontmatter(filePath, data, content) {
  // Serialize YAML
  const yamlContent = yaml.dump(data, {
    schema: yaml.SAFE_SCHEMA,
    sortKeys: true,      // Consistent key order
    lineWidth: -1        // Don't wrap lines
  });

  // Construct complete file
  const fileContent = `---\n${yamlContent}---\n${content}`;

  // Write atomically (read → modify → write)
  await fs.writeFile(filePath, fileContent, 'utf-8');
}
```

### Helper Class (Reusable)

```javascript
/**
 * FrontmatterFile - Utility for YAML frontmatter files
 *
 * Handles reading/writing markdown files with YAML frontmatter.
 * Used by StateManager, CharacterManager, QuestTracker, etc.
 */
class FrontmatterFile {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = {};
    this.content = '';
  }

  /**
   * Load file from disk
   */
  async load() {
    const result = await readFileWithFrontmatter(this.filePath);
    this.data = result.data;
    this.content = result.content;
    return this;
  }

  /**
   * Save file to disk
   */
  async save() {
    await writeFileWithFrontmatter(this.filePath, this.data, this.content);
  }

  /**
   * Update data fields (merge)
   */
  updateData(changes) {
    this.data = {
      ...this.data,
      ...changes,
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Update content (replace)
   */
  updateContent(newContent) {
    this.content = newContent;
  }

  /**
   * Get data field
   */
  getData(key) {
    return this.data[key];
  }

  /**
   * Get all data
   */
  getAllData() {
    return { ...this.data };
  }

  /**
   * Get content
   */
  getContent() {
    return this.content;
  }
}

module.exports = { FrontmatterFile };
```

---

## Future Applications

### Epic 2: Calendar Events

```markdown
---
event_id: strahd-visit-ireena
trigger_type: datetime
trigger_date: "735-10-3"
trigger_time: "20:00"
location: village-of-barovia
priority: high
status: pending
---

# Event: Strahd Visits Ireena

Count Strahd von Zarovich arrives at the Burgomaster's mansion to check
on Ireena Kolyana. His presence causes fear and dread among the villagers.

**LLM Context:**
- Strahd appears at the door, charming and terrifying
- He inquires about Ireena's health
- Ismark bars the door, refusing entry
- Tension escalates...
```

### Epic 3: Character Sheet

```markdown
---
character_name: Aric Stormwind
class: Fighter
level: 5
hit_points: 42
max_hit_points: 52
armor_class: 18
abilities:
  strength: 16
  dexterity: 12
  constitution: 14
  intelligence: 10
  wisdom: 11
  charisma: 8
equipment:
  - longsword
  - shield
  - plate-armor
spell_slots: {}
conditions: []
last_updated: 2025-11-08T14:30:00Z
---

# Character: Aric Stormwind

**Background:** A battle-hardened warrior from the distant kingdom of Cormyr.
Aric was drawn to Barovia by rumors of a powerful vampire lord threatening
the land. His oath of valor compels him to face this evil, no matter the cost.

**Personality:** Stoic and disciplined, Aric rarely speaks unless necessary.
He values honor above all else and will never abandon a companion in need.

**Appearance:** Tall and broad-shouldered, with a scarred face and gray-streaked
beard. His armor bears the dents and scratches of countless battles.
```

### Epic 4: Quest Tracker

```markdown
---
quest_id: find-sunsword
title: "The Sunsword"
status: in_progress
giver: madam_eva
location_given: tser_pool_encampment
objectives:
  - id: learn-location
    description: "Discover where the Sunsword is hidden"
    status: completed
  - id: retrieve-sword
    description: "Retrieve the Sunsword from its resting place"
    status: in_progress
  - id: deliver-sword
    description: "Use the Sunsword against Strahd"
    status: pending
rewards:
  - Sunsword (legendary weapon)
  - Strahd's weakness revealed
deadline: null
failure_conditions:
  - strahd_finds_sword_first
related_npcs:
  - madam_eva
  - strahd
last_updated: 2025-11-08T14:30:00Z
---

# Quest: The Sunsword

Madam Eva revealed in her Tarokka reading that a powerful holy weapon - the
Sunsword - lies hidden somewhere in Barovia. This legendary blade is one of
the few weapons capable of truly harming Count Strahd.

**Current Status:**
You have discovered that the Sunsword rests in the crypt beneath Castle
Ravenloft, guarded by Strahd's undead servants. Retrieving it will be
extremely dangerous, but it may be the key to defeating the vampire lord.

**Next Steps:**
- Infiltrate Castle Ravenloft
- Navigate to the crypts
- Overcome the guardians
- Claim the Sunsword
```

---

## Best Practices

### DO: Use Consistent Field Names

```yaml
# GOOD: Consistent naming across files
visited: true
last_updated: 2025-11-08T14:30:00Z

# BAD: Inconsistent naming
hasVisited: true
lastUpdate: 2025-11-08
```

### DO: Always Include last_updated

```yaml
# GOOD: Timestamp every update
npc_states:
  ismark: { mood: friendly }
last_updated: 2025-11-08T14:30:00Z

# BAD: No audit trail
npc_states:
  ismark: { mood: friendly }
```

### DO: Use YAML.SAFE_SCHEMA

```javascript
// GOOD: Safe parsing (no code execution)
const data = yaml.load(content, { schema: yaml.SAFE_SCHEMA });

// BAD: Unsafe (allows code injection)
const data = yaml.load(content);
```

### DO: Sort Keys for Git Diffs

```javascript
// GOOD: Consistent key order = clean diffs
yaml.dump(data, { sortKeys: true });

// BAD: Random order = messy diffs
yaml.dump(data);
```

### DO: Preserve Content When Updating Data

```javascript
// GOOD: Read → Modify Data → Write (preserve content)
const { data, content } = await readFileWithFrontmatter(path);
data.visited = true;
await writeFileWithFrontmatter(path, data, content);

// BAD: Overwrites content
await fs.writeFile(path, yaml.dump({ visited: true }));
```

### DON'T: Store Binary Data

```yaml
# BAD: Binary data in YAML
image_data: [0x89, 0x50, 0x4E, 0x47, ...]

# GOOD: Reference external files
image_path: "assets/images/character-portrait.png"
```

### DON'T: Use Complex Nested Structures

```yaml
# BAD: Too deeply nested
player:
  inventory:
    weapons:
      melee:
        swords:
          longswords:
            - name: "Flame Tongue"

# GOOD: Flatter structure
inventory_weapons:
  - type: longsword
    name: "Flame Tongue"
    category: melee
```

---

## Error Handling

### Malformed YAML

```javascript
try {
  const data = yaml.load(yamlContent, { schema: yaml.SAFE_SCHEMA });
} catch (error) {
  console.warn(`Failed to parse YAML frontmatter: ${error.message}`);
  // Return default data structure
  return { data: getDefaultData(), content: rawContent };
}
```

### Missing Frontmatter

```javascript
// Gracefully handle files without frontmatter
if (!content.startsWith('---')) {
  return {
    data: getDefaultData(),  // Use defaults
    content: content          // Treat entire file as content
  };
}
```

### Partial Updates

```javascript
// Merge updates, don't replace entire object
async function updateFrontmatter(filePath, updates) {
  const { data, content } = await readFileWithFrontmatter(filePath);

  // Merge new data with existing
  const updatedData = {
    ...data,
    ...updates,
    last_updated: new Date().toISOString()
  };

  await writeFileWithFrontmatter(filePath, updatedData, content);
}
```

---

## Testing Strategy

### Unit Tests

```javascript
describe('FrontmatterFile', () => {
  test('reads YAML frontmatter correctly', async () => {
    const file = new FrontmatterFile('test.md');
    await file.load();

    expect(file.getData('visited')).toBe(true);
    expect(file.getContent()).toContain('Location State');
  });

  test('updates data without losing content', async () => {
    const file = new FrontmatterFile('test.md');
    await file.load();

    const originalContent = file.getContent();

    file.updateData({ visited: false });
    await file.save();

    // Reload and verify
    await file.load();
    expect(file.getData('visited')).toBe(false);
    expect(file.getContent()).toBe(originalContent);  // Content preserved
  });

  test('handles missing frontmatter gracefully', async () => {
    // File without frontmatter
    const file = new FrontmatterFile('no-frontmatter.md');
    await file.load();

    expect(file.getAllData()).toEqual({});
    expect(file.getContent()).toBeTruthy();
  });
});
```

---

## Performance Considerations

### Caching

```javascript
class FrontmatterFileCache {
  constructor() {
    this.cache = new Map();
  }

  async get(filePath) {
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath);
    }

    const file = new FrontmatterFile(filePath);
    await file.load();

    this.cache.set(filePath, file);
    return file;
  }

  invalidate(filePath) {
    this.cache.delete(filePath);
  }

  clear() {
    this.cache.clear();
  }
}
```

### File Watching

```javascript
const chokidar = require('chokidar');

// Invalidate cache when file changes
const watcher = chokidar.watch('**/*.md');

watcher.on('change', (filePath) => {
  frontmatterCache.invalidate(filePath);
  console.log(`Cache invalidated: ${filePath}`);
});
```

---

## Migration Strategy

### Converting Existing Files

```javascript
/**
 * Migrate plain markdown to frontmatter format
 */
async function migrateToFrontmatter(filePath, initialData) {
  const content = await fs.readFile(filePath, 'utf-8');

  // Add frontmatter
  const updatedContent = `---\n${yaml.dump(initialData)}---\n${content}`;

  await fs.writeFile(filePath, updatedContent, 'utf-8');
}

// Example: Migrate all State.md files
const stateFiles = glob.sync('game-data/locations/*/State.md');

for (const file of stateFiles) {
  await migrateToFrontmatter(file, {
    visited: false,
    discovered_items: [],
    completed_events: [],
    npc_states: {},
    custom_state: {},
    last_updated: new Date().toISOString()
  });
}
```

---

## Advantages Over Alternatives

### vs. Separate JSON/YAML Files

| Aspect | Frontmatter | Separate Files |
|--------|-------------|----------------|
| **Readability** | ✅ Data + narrative in one file | ❌ Must open multiple files |
| **Git Diffs** | ✅ See data and narrative changes together | ❌ Changes split across files |
| **Maintenance** | ✅ One file to manage | ❌ Keep files in sync |
| **LLM Context** | ✅ Easy to load both | ❌ Multiple file reads |
| **Performance** | ✅ Single file read | ❌ Multiple file reads |

### vs. Database

| Aspect | Frontmatter | Database |
|--------|-------------|----------|
| **Setup** | ✅ No setup required | ❌ Install and configure DB |
| **Version Control** | ✅ Git tracks everything | ❌ Separate backup strategy |
| **Human-readable** | ✅ Text files | ❌ Binary or SQL dumps |
| **Portability** | ✅ Works anywhere | ❌ DB engine required |
| **Complexity** | ✅ Simple file I/O | ❌ ORM, migrations, etc. |

---

## Summary

**YAML Frontmatter Pattern is ideal for:**
- Structured data with narrative content
- Git-versioned game state
- Human-readable configuration
- File-first architecture (no database)
- Rapid prototyping and iteration

**Use this pattern for:**
- ✅ Character sheets (Epic 3)
- ✅ Quest tracking (Epic 4)
- ✅ Calendar events (Epic 2)
- ✅ NPC profiles (Epic 4)
- ✅ Location state (Epic 1 - already implemented)
- ✅ Session summaries (Epic 5)
- ✅ Faction reputation (Epic 4)

**Key Takeaway:**
> This pattern emerged as a major success from Epic 1 and should be our standard approach for structured data throughout the project.

---

## Next Steps

1. **Create FrontmatterFile utility class** (reusable across epics)
2. **Add to architecture documentation** as standard pattern
3. **Use for Epic 2 calendar files**
4. **Use for Epic 3 character sheets**
5. **Use for Epic 4 quest tracking**

**Pattern Status:** ✅ Documented and Ready for Reuse
