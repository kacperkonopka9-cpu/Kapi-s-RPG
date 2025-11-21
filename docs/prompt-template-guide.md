# Prompt Template Guide

## Overview

The Prompt Template Engine provides a flexible, reusable system for generating LLM prompts with dynamic content from game state. It supports variable substitution, conditional logic, array iteration, and token budget management.

**Related Story:** Story 5-3: LLM Prompt Templates
**Module:** `src/prompts/template-engine.js`
**Created:** 2025-11-21

## Quick Start

```javascript
const { PromptTemplateEngine } = require('./src/prompts');

const engine = new PromptTemplateEngine();

const context = {
  location: { name: 'Village of Barovia', timeOfDay: 'evening' },
  calendar: { currentDate: '735-10-1', currentTime: '18:00', weather: 'foggy', moonPhase: 'new' },
  character: { name: 'Kapi', level: 4, class: 'Cleric', hp: { current: 28, max: 32 }, ac: 16 },
  npcs: [
    { name: 'Ismark', status: 'worried', relationship: 'ally' }
  ]
};

const result = await engine.renderTemplate('location-initial-visit', context);

if (result.success) {
  console.log(result.data.prompt);       // Full rendered prompt with DM persona
  console.log(result.data.tokenCount);    // Estimated token count
  console.log(result.data.tokenBudget);   // Template's token budget
} else {
  console.error(result.error);
}
```

## Template Format

Templates are Markdown files with YAML frontmatter located in `prompts/templates/`:

```markdown
---
templateId: location-initial-visit
priority: P1
tokenBudget: 800
description: First visit to a location - vivid atmospheric description
---

# Location: {{location.name}}

**Current Date/Time:** {{calendar.currentDate}}, {{calendar.currentTime}} ({{location.timeOfDay || "unknown time"}})
**Weather:** {{calendar.weather}}

## NPCs Present

{{#each npcs}}
- **{{this.name}}** ({{this.status || "present"}}){{#if this.relationship}} - Relationship: {{this.relationship}}{{/if}}
{{/each}}

---

## Instructions for Dungeon Master

**Task:** Narrate the player's arrival at {{location.name}} for the first time.
```

### YAML Frontmatter

All templates require these fields:

- **templateId** (string): Unique identifier matching filename without extension
- **priority** (string): P1 (always load), P2 (conditional), or P3 (deferred)
- **tokenBudget** (number): Soft limit for rendered prompt length (in tokens)
- **description** (string): Human-readable description of template purpose

## Variable Substitution

### Simple Variables

```markdown
{{variable}}              → Substitutes context.variable
{{object.property}}       → Substitutes context.object.property (nested paths)
```

**Example:**
```javascript
// Context
{ character: { name: 'Kapi', level: 4 } }

// Template
{{character.name}} is level {{character.level}}

// Result
Kapi is level 4
```

### Optional Defaults

```markdown
{{variable || "default value"}}
```

**Example:**
```javascript
// Context
{ location: { name: 'Tavern' } }  // No timeOfDay property

// Template
Location: {{location.name}} at {{location.timeOfDay || "unknown time"}}

// Result
Location: Tavern at unknown time
```

### Array Iteration

```markdown
{{#each items}}
  {{this.property}}
{{/each}}
```

**Example:**
```javascript
// Context
{ npcs: [
    { name: 'Ismark', status: 'worried' },
    { name: 'Ireena', status: 'frightened' }
]}

// Template
{{#each npcs}}
- {{this.name}} ({{this.status}})
{{/each}}

// Result
- Ismark (worried)
- Ireena (frightened)
```

### Conditional Blocks

```markdown
{{#if variable}}
  content when true
{{/if}}
```

**Example:**
```javascript
// Context
{ npc: { name: 'Strahd', relationship: 'enemy' } }

// Template
{{this.name}}{{#if this.relationship}} - {{this.relationship}}{{/if}}

// Result
Strahd - enemy
```

**Note:** Empty arrays, `null`, `undefined`, and `false` evaluate to false.

### Combined Patterns

```markdown
{{#each npcs}}
- **{{this.name}}** ({{this.status || "present"}}){{#if this.relationship}} - Relationship: {{this.relationship}}{{/if}}
{{/each}}
```

**Context:**
```javascript
{ npcs: [
    { name: 'Ismark', status: 'worried', relationship: 'ally' },
    { name: 'Rahadin' } // No status or relationship
]}
```

**Result:**
```
- **Ismark** (worried) - Relationship: ally
- **Rahadin** (present)
```

## Core Templates

### location-initial-visit (P1, 800 tokens)
First-time visit to a location with rich atmospheric description.

**Required Context:**
- `location.name` (string)
- `calendar.currentDate`, `calendar.currentTime`, `calendar.weather` (strings)
- `character.name`, `character.level`, `character.class`, `character.hp.current`, `character.hp.max`, `character.ac` (various)

**Optional Context:**
- `location.timeOfDay`, `location.description` (string)
- `npcs` (array)
- `calendar.moonPhase` (string)

### location-return (P1, 600 tokens)
Returning to previously visited location, emphasizing changes.

**Required Context:**
- Same as location-initial-visit

**Optional Context:**
- `location.stateChanges` (string describing changes since last visit)

### npc-dialogue (P2, 400 tokens)
NPC conversation with personality-driven dialogue.

**Required Context:**
- `npc.name`, `npc.personality` (strings)
- `character.name` (string)

**Optional Context:**
- `npc.status`, `npc.relationship`, `npc.dialogueContext`, `npc.mood` (strings)

### combat-narration (P2, 500 tokens)
Dynamic combat round narration.

**Required Context:**
- `attacker.name`, `target.name`, `action.type` (strings)
- `diceResult.attack`, `diceResult.damage` (numbers)
- `damage.type`, `damage.amount` (various)

**Optional Context:**
- `environment.description` (string)

### consistency-validation (P3, 300 tokens)
Validate player actions against world state and D&D 5e rules.

**Required Context:**
- `playerAction` (string)
- `worldState.location.name` (string)
- `worldState.character.hp.current`, `worldState.character.hp.max` (numbers)

**Optional Context:**
- `worldState.location.state`, `worldState.npcs`, `worldState.calendar`, `worldState.character.spellSlots`, `worldState.character.conditions`, `rules` (various)

## DM Persona Integration

All rendered templates automatically prepend the DM persona from `prompts/dm-persona.md`:

```markdown
# DM Persona for Curse of Strahd

You are the Dungeon Master for a D&D 5e Curse of Strahd campaign. Your narration embodies gothic horror—dark, foreboding, immersive...
```

The DM persona is cached after first load for performance.

## Token Budget Management

Templates specify soft token limits via `tokenBudget` in frontmatter. The engine:

1. Estimates token count after rendering using ~4 chars/token heuristic
2. Compares to `tokenBudget`
3. Logs debug warning if >10% over budget
4. **Always returns success** (soft limit, not enforced)

**Example Warning:**
```
[PromptTemplateEngine] Warning: Template npc-dialogue exceeds token budget by 110.0% (840 tokens vs 400 budget)
```

**Access Token Metrics:**
```javascript
const result = await engine.renderTemplate('location-initial-visit', context);
console.log(`Token count: ${result.data.tokenCount} / ${result.data.tokenBudget}`);
```

## Template Validation

Templates are validated on load:

### Required Variables
Missing required variables return error:
```javascript
const result = await engine.renderTemplate('location-initial-visit', { /* missing character */ });
// result.success === false
// result.error === "Missing template variables: character"
```

### Optional Variables
Optional variables (with `||`) are allowed to be missing:
```markdown
{{location.timeOfDay || "unknown time"}}  // OK if location.timeOfDay missing
```

### Nested Paths
Validation supports nested paths:
```javascript
// Context: { worldState: { npcs: [...] } }
// Template: {{#each worldState.npcs}} ✓ Valid
```

## Custom Templates

### Registering Templates

```javascript
const customTemplate = `---
templateId: custom-greeting
priority: P2
tokenBudget: 200
description: Custom greeting template
---

Hello {{character.name}}, welcome to {{location.name}}!
`;

engine.registerTemplate('custom-greeting', customTemplate);

const result = await engine.renderTemplate('custom-greeting', {
  character: { name: 'Kapi' },
  location: { name: 'Barovia' }
});
```

### Listing Templates

```javascript
const templates = engine.listTemplates();
// Returns:
// [
//   { id: 'location-initial-visit', description: '...', tokenBudget: 800, priority: 'P1' },
//   { id: 'location-return', description: '...', tokenBudget: 600, priority: 'P1' },
//   { id: 'custom-greeting', description: '...', tokenBudget: 200, priority: 'P2' }
// ]
```

## Dependency Injection

The engine supports constructor DI for testing:

```javascript
const engine = new PromptTemplateEngine({
  fs: mockFs,
  path: mockPath,
  yaml: mockYaml,
  estimateTokens: mockEstimateTokens,
  templatesDir: '/custom/templates',
  dmPersonaPath: '/custom/dm-persona.md',
  logger: mockLogger
});
```

**Default Values:**
- `fs`: Node.js `fs/promises`
- `path`: Node.js `path`
- `yaml`: `yaml` package
- `estimateTokens`: Built-in heuristic (~4 chars/token + 5% overhead)
- `templatesDir`: `prompts/templates/`
- `dmPersonaPath`: `prompts/dm-persona.md`
- `logger`: `console`

## Performance

### Template Caching
Templates are cached in-memory after first load:
- File-based templates: `templateCache` Map
- Custom templates: `registeredTemplates` Map
- DM persona: `dmPersonaCache` (single string)

**No cache invalidation** in current version (templates assumed static).

### Token Estimation
Token estimation uses fast string length heuristic:
```javascript
tokenCount = Math.ceil(text.length / 4 * 1.05);
```

For production, inject Claude's actual `estimateTokens` method from `ContextLoader`.

## Error Handling

All methods return Result Objects:

```javascript
{
  success: boolean,
  data?: {
    prompt: string,
    tokenCount: number,
    templateId: string,
    priority: string,
    tokenBudget: number
  },
  error?: string
}
```

**Common Errors:**
- `Template not found: {id}` - Template file doesn't exist
- `Missing template variables: {vars}` - Required variables missing from context
- `Failed to load template {id}: {reason}` - File read or YAML parse error
- `Template {id} missing YAML frontmatter` - Invalid template format

## Integration with Story 5-1 Context Loader

The PromptTemplateEngine works seamlessly with Story 5-1's ContextObject:

```javascript
const { ContextLoader } = require('./src/context');
const { PromptTemplateEngine } = require('./src/prompts');

const loader = new ContextLoader();
const engine = new PromptTemplateEngine({
  estimateTokens: loader.estimateTokens.bind(loader) // Use ContextLoader's token estimation
});

// Load context
const contextResult = await loader.loadLocationContext('village-of-barovia', 2000);
const context = contextResult.data;

// Render template with context
const templateResult = await engine.renderTemplate('location-initial-visit', context);
const prompt = templateResult.data.prompt;

// Send prompt to Claude API
// ...
```

## Best Practices

### 1. Use Optional Defaults for Unstable Fields
```markdown
{{location.timeOfDay || "unknown time"}}
{{npc.mood || "neutral"}}
```

### 2. Validate Context Before Rendering
```javascript
if (!context.character || !context.location) {
  throw new Error('Invalid context: missing required fields');
}
```

### 3. Monitor Token Budgets
```javascript
const result = await engine.renderTemplate('location-initial-visit', context);
if (result.data.tokenCount > result.data.tokenBudget * 1.1) {
  console.warn(`Template over budget: ${result.data.tokenCount} vs ${result.data.tokenBudget}`);
}
```

### 4. Keep Templates Focused
- P1 templates: Core narration (800 tokens max)
- P2 templates: Specific interactions (400-500 tokens)
- P3 templates: Validation/rules (300 tokens)

### 5. Test Templates with Edge Cases
```javascript
// Empty arrays
{ npcs: [] }

// Missing optional fields
{ location: { name: 'Test' } } // No timeOfDay

// Null values
{ npc: { name: 'Strahd', relationship: null } }
```

## File Structure

```
prompts/
├── dm-persona.md                          # DM personality (300 tokens)
└── templates/
    ├── location-initial-visit.md          # P1, 800 tokens
    ├── location-return.md                 # P1, 600 tokens
    ├── npc-dialogue.md                    # P2, 400 tokens
    ├── combat-narration.md                # P2, 500 tokens
    └── consistency-validation.md          # P3, 300 tokens

src/
└── prompts/
    ├── template-engine.js                 # PromptTemplateEngine class (700+ lines)
    └── index.js                           # Module exports

tests/
└── integration/
    └── prompts/
        └── template-engine.test.js        # 31 tests, 8 suites
```

## API Reference

### PromptTemplateEngine

#### Constructor
```javascript
new PromptTemplateEngine(deps?: Object)
```

**Parameters:**
- `deps.fs` (Object): File system module
- `deps.path` (Object): Path module
- `deps.yaml` (Object): YAML parser
- `deps.estimateTokens` (Function): Token estimation function
- `deps.templatesDir` (string): Templates directory path
- `deps.dmPersonaPath` (string): DM persona file path
- `deps.logger` (Object): Logger with `debug()` method

#### renderTemplate(templateId, context)
```javascript
async renderTemplate(templateId: string, context: Object): Promise<Result>
```

Renders a template with provided context.

**Returns:** `{ success, data?: { prompt, tokenCount, templateId, priority, tokenBudget }, error? }`

#### registerTemplate(templateId, templateContent)
```javascript
registerTemplate(templateId: string, templateContent: string): void
```

Registers a custom template programmatically.

**Throws:** Error if template invalid or already registered.

#### listTemplates()
```javascript
listTemplates(): Array<Object>
```

Lists all available templates (file-based + registered).

**Returns:** `[{ id, description, tokenBudget, priority }, ...]`

## Troubleshooting

### Template Not Rendering Variables
**Issue:** Variables appear as `{{variable}}` in output
**Cause:** Variable name mismatch or context structure incorrect
**Fix:** Check context structure matches template expectations, use `console.log(context)` to verify

### Missing Variable Errors
**Issue:** `Missing template variables: character`
**Cause:** Required variable not in context
**Fix:** Ensure all non-optional variables present, or add `|| "default"` to make optional

### Token Budget Warnings
**Issue:** `Template exceeds token budget by 110%`
**Cause:** Rendered content too long
**Fix:** Reduce template content, increase `tokenBudget` in frontmatter, or use higher-priority template

### Array Not Iterating
**Issue:** `{{#each npcs}}` not rendering items
**Cause:** Context field not an array or empty
**Fix:** Verify `context.npcs` is an array with items, handle empty arrays with defaults

## Future Enhancements

Potential improvements for future stories:

- [ ] **Partial Templates:** `{{> npc-summary}}` for reusable snippets
- [ ] **Template Inheritance:** Base templates with `{{block content}}` overrides
- [ ] **Expression Evaluation:** `{{character.level > 5}}` boolean logic
- [ ] **Filters:** `{{location.name | uppercase}}` text transformations
- [ ] **Cache Invalidation:** Reload templates when files change
- [ ] **Template Hot-Reloading:** Watch templates directory for changes
- [ ] **Template Linting:** Validate templates on load (undefined variables, syntax errors)
- [ ] **Template Composition:** Combine multiple templates into single prompt
- [ ] **Priority-Based Loading:** Automatically select templates based on context and token budget

## Related Documentation

- **Story 5-1:** Intelligent Context Loader (`docs/stories/5-1-intelligent-context-loader.md`)
- **Story 5-2:** Context Caching Strategy (`docs/stories/5-2-context-caching-strategy.md`)
- **Technical Architecture:** `docs/technical-architecture.md`
- **CLAUDE.md:** Project overview and patterns

## Change Log

### 2025-11-21 - Initial Release
- PromptTemplateEngine class with variable substitution
- 5 core templates (location-initial-visit, location-return, npc-dialogue, combat-narration, consistency-validation)
- DM persona integration
- Token budget validation
- Template caching
- Custom template registration
- 31 integration tests (100% pass rate)
