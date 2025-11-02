# Claude Code Integration Guide

**Purpose:** Technical guide for integrating Kapi's RPG with Claude Code extension
**Target Audience:** Developers implementing Story 1.5 (LLM Narrator Integration)
**Last Updated:** 2025-11-02

---

## Overview

This game leverages the **Claude Code VS Code extension** for LLM-powered Dungeon Master narration instead of using the Claude API directly. This eliminates the need for separate API key management and reduces costs for players.

### Benefits

- **No API Key Required:** Players use their existing Claude Code authentication
- **Zero Additional Cost:** Covered by user's Claude subscription
- **Simpler Setup:** One-click install from VS Code marketplace
- **Unified Experience:** Game runs in same environment as Claude Code

### Trade-offs

- **External Dependency:** Requires Claude Code to be installed and working
- **Less Control:** Cannot directly configure model parameters (temperature, max tokens, etc.)
- **Extension API Stability:** Depends on Claude Code's inter-extension communication features

---

## Architecture

### Component Interaction

```
┌─────────────────────┐
│  Kapi's RPG Game    │
│  Extension          │
└──────┬──────────────┘
       │ vscode.extensions.getExtension()
       │ executeCommand() or extension API
       ▼
┌─────────────────────┐
│  Claude Code        │
│  Extension          │
│  (anthropic.claude-code)
└──────┬──────────────┘
       │ Authenticated with Claude
       ▼
┌─────────────────────┐
│  Claude AI Service  │
│  (via Claude Code)  │
└─────────────────────┘
```

### LLMNarrator Implementation

The `LLMNarrator` class (Story 1.5) will:
1. Detect Claude Code extension at initialization
2. Verify extension is active and available
3. Send prompts to Claude Code via VS Code Extension API
4. Receive narrative responses
5. Handle errors gracefully (retry logic + helpful messages)

---

## Implementation Approaches

### Approach 1: VS Code Command Execution (Recommended)

**Method:** Use VS Code's `vscode.commands.executeCommand()` to invoke Claude Code commands.

**Pros:**
- Standard VS Code extension pattern
- Documented public API (if available)
- Easy to implement

**Cons:**
- Requires Claude Code to expose public commands
- May need to reverse-engineer command names if not documented

**Example Code:**

```javascript
const vscode = require('vscode');

class LLMNarrator {
  constructor() {
    this.validateClaudeCodeExtension();
  }

  validateClaudeCodeExtension() {
    const ext = vscode.extensions.getExtension('anthropic.claude-code');
    if (!ext) {
      throw new Error('Claude Code extension not found. Please install from VS Code marketplace.');
    }
    if (!ext.isActive) {
      // Try to activate it
      await ext.activate();
    }
    this.claudeCodeExtension = ext;
  }

  async generateNarrative(prompt) {
    try {
      // Attempt to call Claude Code command (command name TBD - needs investigation)
      const response = await vscode.commands.executeCommand(
        'claude-code.sendMessage',  // PLACEHOLDER - actual command TBD
        {
          prompt: prompt.contextDescription,
          systemPrompt: prompt.systemPrompt
        }
      );

      return {
        narrative: response.text,
        tokensUsed: response.usage?.total_tokens || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Claude Code error:', error);
      throw new Error(`LLM Narrator failed: ${error.message}`);
    }
  }

  async isClaudeCodeAvailable() {
    return this.claudeCodeExtension && this.claudeCodeExtension.isActive;
  }

  async testConnection() {
    // Send a simple test prompt
    try {
      const testPrompt = {
        systemPrompt: 'You are a test assistant.',
        contextDescription: 'Say "test successful" and nothing else.'
      };
      const response = await this.generateNarrative(testPrompt);
      return response.narrative.toLowerCase().includes('test successful');
    } catch (error) {
      return false;
    }
  }
}

module.exports = { LLMNarrator };
```

### Approach 2: Extension API Direct Call

**Method:** Access Claude Code's exported API directly via `extension.exports`.

**Pros:**
- More direct control
- Potentially faster (no command routing)

**Cons:**
- Requires Claude Code to explicitly export API
- May not be available if Claude Code doesn't design for inter-extension use

**Example Code:**

```javascript
const vscode = require('vscode');

class LLMNarrator {
  constructor() {
    this.initializeClaudeCodeAPI();
  }

  async initializeClaudeCodeAPI() {
    const ext = vscode.extensions.getExtension('anthropic.claude-code');
    if (!ext) {
      throw new Error('Claude Code extension not found.');
    }

    if (!ext.isActive) {
      await ext.activate();
    }

    // Check if Claude Code exports an API
    this.claudeAPI = ext.exports;

    if (!this.claudeAPI || !this.claudeAPI.sendMessage) {
      throw new Error('Claude Code extension does not expose expected API.');
    }
  }

  async generateNarrative(prompt) {
    if (!this.claudeAPI) {
      throw new Error('Claude Code API not initialized.');
    }

    const response = await this.claudeAPI.sendMessage({
      system: prompt.systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt.contextDescription
        }
      ]
    });

    return {
      narrative: response.content,
      tokensUsed: response.usage.total_tokens,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { LLMNarrator };
```

### Approach 3: Webview Communication (Fallback)

**Method:** Use VS Code webviews to communicate with Claude Code UI.

**Pros:**
- Works even if Claude Code has no programmatic API

**Cons:**
- Hacky and fragile
- Performance overhead
- Not recommended unless other approaches fail

---

## Implementation Steps for Story 1.5

### Step 1: Research Claude Code Extension

**Action Required:** Investigate Claude Code's extension capabilities.

**Questions to Answer:**
1. Does Claude Code expose public commands? (`package.json` → `contributes.commands`)
2. Does Claude Code export an API? (Check `extension.exports` after activation)
3. What is the command signature for sending messages?
4. What response format does it return?

**How to Investigate:**
```bash
# Method 1: Check Claude Code's package.json
code --list-extensions --show-versions | grep claude
# Then find extension directory and read package.json

# Method 2: Runtime inspection
# Create a test VS Code extension that logs:
const ext = vscode.extensions.getExtension('anthropic.claude-code');
console.log('Commands:', ext.packageJSON.contributes?.commands);
console.log('Exports:', ext.exports);
```

### Step 2: Implement LLMNarrator Class

**File:** `src/core/llm-narrator.js`

**Requirements:**
- Detect Claude Code at initialization
- Validate extension is active
- Send formatted prompts
- Receive and parse responses
- Handle errors with 3 retries + exponential backoff
- Provide helpful error messages if Claude Code not available

**API Signature (from Epic 1 Tech Spec):**

```javascript
class LLMNarrator {
  /**
   * Send prompt to Claude Code extension and get narrative response
   * @param {LLMPrompt} prompt - Formatted prompt
   * @returns {Promise<NarrativeResponse>} LLM-generated narrative
   * @throws {ExtensionError} If Claude Code extension is not available
   * @throws {TokenLimitError} If prompt exceeds limits
   */
  async generateNarrative(prompt: LLMPrompt): Promise<NarrativeResponse>

  /**
   * Check if Claude Code extension is available
   * @returns {Promise<boolean>} True if Claude Code is installed and accessible
   */
  async isClaudeCodeAvailable(): Promise<boolean>

  /**
   * Test Claude Code connection
   * @returns {Promise<boolean>} True if Claude Code can respond to prompts
   */
  async testConnection(): Promise<boolean>
}
```

### Step 3: Create Unit Tests with Mocks

**File:** `tests/core/llm-narrator.test.js`

```javascript
const { LLMNarrator } = require('../../src/core/llm-narrator');

// Mock VS Code extension API
jest.mock('vscode', () => ({
  extensions: {
    getExtension: jest.fn()
  },
  commands: {
    executeCommand: jest.fn()
  }
}));

describe('LLMNarrator', () => {
  test('should detect Claude Code extension', async () => {
    const vscode = require('vscode');
    vscode.extensions.getExtension.mockReturnValue({
      isActive: true,
      exports: { sendMessage: jest.fn() }
    });

    const narrator = new LLMNarrator();
    const available = await narrator.isClaudeCodeAvailable();

    expect(available).toBe(true);
  });

  test('should throw error if Claude Code not found', () => {
    const vscode = require('vscode');
    vscode.extensions.getExtension.mockReturnValue(undefined);

    expect(() => new LLMNarrator()).toThrow('Claude Code extension not found');
  });

  test('should generate narrative successfully', async () => {
    const vscode = require('vscode');
    const mockSendMessage = jest.fn().mockResolvedValue({
      text: 'You enter the village...',
      usage: { total_tokens: 150 }
    });

    vscode.extensions.getExtension.mockReturnValue({
      isActive: true,
      exports: { sendMessage: mockSendMessage }
    });

    const narrator = new LLMNarrator();
    const response = await narrator.generateNarrative({
      systemPrompt: 'You are a DM',
      contextDescription: 'Village of Barovia'
    });

    expect(response.narrative).toContain('village');
    expect(mockSendMessage).toHaveBeenCalled();
  });
});
```

### Step 4: Integration Testing

**File:** `tests/integration/llm-narrator.test.js`

```javascript
// Integration test that uses REAL Claude Code extension (run manually only)
describe('LLMNarrator Integration (manual)', () => {
  test.skip('should generate narrative with real Claude Code', async () => {
    // This test requires Claude Code to be installed and authenticated
    // Skip in CI/CD, run manually during development

    const narrator = new LLMNarrator();

    const prompt = {
      systemPrompt: 'You are a Dungeon Master running Curse of Strahd.',
      contextDescription: 'The player enters the Village of Barovia. Describe what they see.'
    };

    const response = await narrator.generateNarrative(prompt);

    expect(response.narrative).toBeTruthy();
    expect(response.narrative.length).toBeGreaterThan(50);
    console.log('Generated narrative:', response.narrative);
  });
});
```

### Step 5: Error Handling

**Requirements:**
- Detect Claude Code not installed
- Detect Claude Code not authenticated
- Handle extension timeout (30s)
- Retry 3 times with exponential backoff (1s, 2s, 4s)
- Display helpful error messages to user

**Error Handling Code:**

```javascript
async generateNarrative(prompt) {
  const maxRetries = 3;
  const backoffMs = [1000, 2000, 4000];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Attempt to generate narrative
      const response = await this._callClaudeCode(prompt);
      return response;

    } catch (error) {
      console.warn(`LLM Narrator attempt ${attempt + 1} failed:`, error.message);

      if (attempt < maxRetries - 1) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, backoffMs[attempt]));
      } else {
        // All retries exhausted
        throw new Error(
          `Claude Code extension failed after ${maxRetries} attempts. ` +
          `Please ensure Claude Code is installed and authenticated. ` +
          `Error: ${error.message}`
        );
      }
    }
  }
}
```

---

## Testing Strategy

### Unit Tests (Fast, Always Run)
- Mock Claude Code extension
- Test error handling
- Test retry logic
- Test prompt formatting
- **Coverage Target:** 90%+

### Integration Tests (Manual, Weekly)
- Require Claude Code installed
- Test with real extension
- Verify narrative quality
- Test authentication errors
- **Frequency:** Manual testing during development

### Manual Validation Checklist

- [ ] Claude Code extension detection works
- [ ] Error message displayed if extension not found
- [ ] Error message displayed if extension not authenticated
- [ ] Retry logic works (simulate timeout)
- [ ] Narrative response properly formatted
- [ ] Token usage tracking works
- [ ] Performance meets <5s target (95th percentile)

---

## Troubleshooting

### Issue: Extension Not Found

**Symptoms:** `Error: Claude Code extension not found`

**Solutions:**
1. Install Claude Code from VS Code marketplace
2. Restart VS Code after installation
3. Verify extension ID is `anthropic.claude-code`

### Issue: Extension Not Active

**Symptoms:** `Error: Claude Code extension is not active`

**Solutions:**
1. Check VS Code extension panel - ensure Claude Code is enabled
2. Try manually activating: `ext.activate()`
3. Check for conflicting extensions

### Issue: No Response from Extension

**Symptoms:** Timeout after 30 seconds

**Solutions:**
1. Verify Claude Code is authenticated (check Claude Code UI)
2. Check Claude Code extension logs for errors
3. Try sending a test message directly in Claude Code
4. Restart VS Code

### Issue: Unclear Error Messages

**Solution:** Check console logs for detailed error:
```javascript
console.error('Claude Code error details:', {
  hasExtension: !!this.claudeCodeExtension,
  isActive: this.claudeCodeExtension?.isActive,
  hasExports: !!this.claudeCodeExtension?.exports,
  error: error.message,
  stack: error.stack
});
```

---

## Next Steps

1. **Research Phase** (Story 1.5 - Task 1):
   - Investigate Claude Code extension capabilities
   - Determine which implementation approach is viable
   - Document findings in Story 1.5 context

2. **Implementation Phase** (Story 1.5 - Tasks 2-6):
   - Implement LLMNarrator class using chosen approach
   - Write comprehensive unit tests
   - Manual integration testing

3. **Documentation Phase** (Story 1.5 - Task 7):
   - Update this guide with actual implementation details
   - Document command names and API signatures discovered
   - Add troubleshooting entries for issues encountered

---

## References

- **Epic 1 Tech Spec:** `docs/tech-spec-epic-1.md` (updated with Claude Code integration)
- **Technical Architecture:** `docs/technical-architecture.md` (Section 15.1)
- **Story 1.5:** `docs/stories/1-5-llm-narrator-integration.md` (to be created)
- **VS Code Extension API:** https://code.visualstudio.com/api/references/vscode-api#extensions
- **Claude Code Extension:** https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code

---

**Status:** Ready for Story 1.5 implementation
**Last Updated:** 2025-11-02
