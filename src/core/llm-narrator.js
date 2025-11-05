/**
 * LLMNarrator - Claude Code Extension Integration
 * Sends prompts to Claude Code extension and receives narrative responses
 *
 * Story 1.5: LLM Narrator Integration
 * Implements AC-8 (Primary) + AC #9-15
 */

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

/**
 * @typedef {import('../data/schemas').LLMPrompt} LLMPrompt
 * @typedef {import('../data/schemas').PromptMetadata} PromptMetadata
 */

/**
 * @typedef {Object} NarrativeResponse
 * @property {string} narrative - Generated narrative text
 * @property {number} tokensUsed - Number of tokens consumed
 * @property {string} timestamp - ISO timestamp of response
 * @property {number} responseTime - Response time in milliseconds
 * @property {string} requestId - Unique request identifier for tracing
 */

/**
 * LLMNarrator class for generating narrative via Claude Code extension
 *
 * Requirements:
 * - AC-8: Extension detection, retry logic, error handling
 * - AC-9: Implements API from tech-spec-epic-1.md
 * - AC-10: Extension detection at startup
 * - AC-11: DM persona system prompt
 * - AC-12: Preserve session state on failures
 * - AC-13: Performance monitoring
 * - AC-15: Integration with ContextBuilder
 */
class LLMNarrator {
  /**
   * Initialize LLMNarrator and detect Claude Code extension
   * @throws {Error} If Claude Code extension not found or not active
   */
  constructor() {
    this.claudeCodeExtension = null;
    this.retryConfig = {
      maxRetries: 3,
      backoffDelays: [1000, 2000, 4000] // 1s, 2s, 4s exponential backoff
    };
    this.performanceLog = [];
    this.performanceLogFile = path.join(process.cwd(), 'performance.log');

    // Detect extension at initialization (AC-10)
    this._detectClaudeCodeExtension();
  }

  /**
   * Detect and validate Claude Code extension
   * @private
   * @throws {Error} If extension not found or cannot be activated
   */
  _detectClaudeCodeExtension() {
    // Note: In a real VS Code extension context, we would use:
    // const vscode = require('vscode');
    // const ext = vscode.extensions.getExtension('anthropic.claude-code');

    // For now, we'll use a mock-friendly approach that can be tested
    // The actual extension detection will be implemented when this runs in VS Code

    if (typeof vscode !== 'undefined') {
      // Running in VS Code extension context
      this.claudeCodeExtension = vscode.extensions.getExtension('anthropic.claude-code');

      if (!this.claudeCodeExtension) {
        throw new Error(
          'Claude Code extension not found. ' +
          'Please install the Claude Code extension from the VS Code marketplace.\n' +
          'Extension ID: anthropic.claude-code'
        );
      }

      if (!this.claudeCodeExtension.isActive) {
        // Try to activate it
        this.claudeCodeExtension.activate().catch(err => {
          throw new Error(
            `Claude Code extension found but failed to activate: ${err.message}`
          );
        });
      }
    } else {
      // Running in test/development environment
      // Extension detection will be mocked in tests
      console.warn('LLMNarrator: Running outside VS Code context. Extension detection skipped.');
    }
  }

  /**
   * Generate DM system prompt for Curse of Strahd campaign
   * Based on narrative-design.md and Architecture §6.2
   *
   * @private
   * @returns {string} System prompt for Claude Code
   */
  _buildSystemPrompt() {
    return `You are the Dungeon Master for a Curse of Strahd D&D 5e solo campaign.

Your role:
- Generate immersive, atmospheric narrative descriptions in the gothic horror style
- Maintain consistency with Curse of Strahd lore and Eastern European folklore
- Respond to player actions contextually and naturally
- Use second-person perspective ("you see...", "you enter...", "you feel...")
- Keep responses concise (2-4 paragraphs, 150-300 words)
- Evoke dread and atmosphere without explicit gore
- Reflect the themes: Hope vs. Despair, Obsession and Corruption, Free Will vs. Fate

Tone: Dark, melancholic, yet occasionally allowing brief moments of warmth that make the darkness more poignant.

Current context (location, NPCs, state) is provided in the user message.`;
  }

  /**
   * Check if Claude Code extension is available and active
   * @returns {Promise<boolean>} True if extension is ready
   */
  async isClaudeCodeAvailable() {
    try {
      if (typeof vscode === 'undefined') {
        // Not in VS Code context - return based on mock/test status
        return this.claudeCodeExtension !== null;
      }

      if (!this.claudeCodeExtension) {
        return false;
      }

      // Check if extension is active
      return this.claudeCodeExtension.isActive;
    } catch (error) {
      console.error('Error checking Claude Code availability:', error);
      return false;
    }
  }

  /**
   * Test connection to Claude Code extension with simple prompt
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      const testPrompt = {
        systemPrompt: 'You are a test assistant.',
        contextDescription: 'Respond with exactly: "Connection successful"',
        contextCharacter: '',
        contextRecentActions: '',
        contextNPCs: '',
        contextItems: '',
        metadata: {
          estimatedTokens: 50,
          systemPromptTokens: 10,
          priority1Tokens: 20,
          priority2Tokens: 20,
          priority2Truncated: false,
          generatedAt: new Date().toISOString()
        }
      };

      const response = await this.generateNarrative(testPrompt);
      return response.narrative.toLowerCase().includes('successful');
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Send prompt to Claude Code extension and return narrative response
   * Implements AC-8: Retry logic, timeout, error handling, performance tracking
   *
   * @param {LLMPrompt} prompt - Formatted prompt from ContextBuilder
   * @returns {Promise<NarrativeResponse>} Generated narrative response
   * @throws {Error} If all retries fail or extension unavailable
   */
  async generateNarrative(prompt) {
    const startTime = Date.now();
    const requestId = randomUUID(); // AC-13: Request ID for tracing
    let lastError = null;

    console.log(`🎲 LLM Request ${requestId.slice(0, 8)}...`);

    // Validate prompt token budget
    if (prompt.metadata.estimatedTokens > 3000) {
      console.warn(
        `⚠️ [${requestId.slice(0, 8)}] Prompt exceeds 3000 token budget: ${prompt.metadata.estimatedTokens} tokens. ` +
        'This should be prevented by ContextBuilder.'
      );
    }

    // Retry loop with exponential backoff (AC-8)
    for (let attempt = 0; attempt < this.retryConfig.maxRetries; attempt++) {
      try {
        // Wait for backoff delay if this is a retry
        if (attempt > 0) {
          const delay = this.retryConfig.backoffDelays[attempt - 1];
          console.log(`Retry attempt ${attempt + 1}/${this.retryConfig.maxRetries} after ${delay}ms delay...`);
          await this._sleep(delay);
        }

        // Call Claude Code extension
        const response = await this._callClaudeCode(prompt);

        // Track performance (AC-13)
        const responseTime = Date.now() - startTime;
        this._logPerformance(requestId, responseTime, prompt.metadata.estimatedTokens, response.tokensUsed);

        // Warn if response time exceeds target (AC-13)
        if (responseTime > 5000) {
          console.warn(
            `⚠️ [${requestId.slice(0, 8)}] LLM response time exceeded 5s target: ${responseTime}ms ` +
            `(Attempt ${attempt + 1}/${this.retryConfig.maxRetries})`
          );
        }

        console.log(`✅ [${requestId.slice(0, 8)}] LLM response: ${responseTime}ms, ${response.tokensUsed} tokens`);

        return {
          ...response,
          responseTime,
          timestamp: new Date().toISOString(),
          requestId
        };

      } catch (error) {
        lastError = error;
        console.error(
          `❌ [${requestId.slice(0, 8)}] LLM Narrator attempt ${attempt + 1}/${this.retryConfig.maxRetries} failed:`,
          error.message
        );

        // If this was the last retry, throw error
        if (attempt === this.retryConfig.maxRetries - 1) {
          const finalError = new Error(
            `Claude Code extension failed after ${this.retryConfig.maxRetries} attempts. ` +
            `Please ensure Claude Code is installed, authenticated, and responding. ` +
            `Request ID: ${requestId}. Last error: ${error.message}`
          );
          finalError.requestId = requestId;
          throw finalError;
        }
      }
    }

    // Should never reach here, but just in case
    const finalError = new Error(
      `LLM Narrator failed after ${this.retryConfig.maxRetries} retries. ` +
      `Request ID: ${requestId}. Last error: ${lastError?.message || 'Unknown error'}`
    );
    finalError.requestId = requestId;
    throw finalError;
  }

  /**
   * Call Claude Code extension with formatted prompt
   * @private
   * @param {LLMPrompt} prompt - Prompt object
   * @returns {Promise<{narrative: string, tokensUsed: number}>} Response
   */
  async _callClaudeCode(prompt) {
    // Build system prompt (AC-11)
    const systemPrompt = this._buildSystemPrompt();

    // Combine context sections into user message
    const userMessage = this._formatPromptForClaude(prompt);

    // In actual VS Code extension context, we would call:
    // const response = await vscode.commands.executeCommand(
    //   'claude-code.sendMessage',
    //   { system: systemPrompt, messages: [{ role: 'user', content: userMessage }] }
    // );

    // For now, we'll use a mock-friendly approach
    if (typeof vscode !== 'undefined' && this.claudeCodeExtension) {
      // Attempt real Claude Code call
      try {
        const response = await vscode.commands.executeCommand(
          'claude-code.sendMessage',
          {
            system: systemPrompt,
            messages: [
              {
                role: 'user',
                content: userMessage
              }
            ],
            max_tokens: 4096,
            temperature: 0.7
          }
        );

        return {
          narrative: response.content || response.text || response.narrative,
          tokensUsed: response.usage?.total_tokens || response.tokensUsed || 0
        };
      } catch (error) {
        throw new Error(`Claude Code API call failed: ${error.message}`);
      }
    } else {
      // Mock/test environment - throw error unless mocked
      throw new Error('Claude Code extension not available. Must be mocked in tests.');
    }
  }

  /**
   * Format LLMPrompt object into Claude-compatible message
   * @private
   * @param {LLMPrompt} prompt - Prompt from ContextBuilder
   * @returns {string} Formatted user message
   */
  _formatPromptForClaude(prompt) {
    const sections = [];

    // Priority 1 content (always included)
    if (prompt.contextDescription) {
      sections.push(`**Current Location:**\n${prompt.contextDescription}`);
    }

    if (prompt.contextCharacter) {
      sections.push(`**Character:**\n${prompt.contextCharacter}`);
    }

    if (prompt.contextRecentActions) {
      sections.push(`**Recent Actions:**\n${prompt.contextRecentActions}`);
    }

    // Priority 2 content (conditional on budget)
    if (prompt.contextNPCs && !prompt.metadata.priority2Truncated) {
      sections.push(`**NPCs Present:**\n${prompt.contextNPCs}`);
    }

    if (prompt.contextItems && !prompt.metadata.priority2Truncated) {
      sections.push(`**Notable Items:**\n${prompt.contextItems}`);
    }

    return sections.join('\n\n');
  }

  /**
   * Sleep for specified milliseconds (for retry backoff)
   * @private
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log performance metrics (AC-13)
   * Logs to both memory and performance.log file
   *
   * @private
   * @param {string} requestId - Request identifier
   * @param {number} responseTime - Response time in ms
   * @param {number} estimatedTokens - Estimated prompt tokens
   * @param {number} actualTokens - Actual tokens used
   */
  _logPerformance(requestId, responseTime, estimatedTokens, actualTokens) {
    const logEntry = {
      requestId: requestId.slice(0, 8), // Short ID for logs
      timestamp: new Date().toISOString(),
      responseTime,
      estimatedTokens,
      actualTokens,
      exceededTarget: responseTime > 5000
    };

    this.performanceLog.push(logEntry);

    // Keep last 100 entries only
    if (this.performanceLog.length > 100) {
      this.performanceLog.shift();
    }

    // Log to file (AC-13: Log to performance.log)
    if (responseTime > 1000) {
      const logLine = `${logEntry.timestamp} [${logEntry.requestId}] ${responseTime}ms, ${actualTokens} tokens${logEntry.exceededTarget ? ' [SLOW]' : ''}\n`;

      try {
        fs.appendFileSync(this.performanceLogFile, logLine, 'utf8');
      } catch (error) {
        console.error('Failed to write to performance.log:', error.message);
      }
    }
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance stats
   */
  getPerformanceStats() {
    if (this.performanceLog.length === 0) {
      return { requestCount: 0 };
    }

    const times = this.performanceLog.map(log => log.responseTime);
    times.sort((a, b) => a - b);

    const percentile95 = times[Math.floor(times.length * 0.95)];
    const average = times.reduce((a, b) => a + b, 0) / times.length;
    const exceedingTarget = this.performanceLog.filter(log => log.exceededTarget).length;

    return {
      requestCount: this.performanceLog.length,
      averageResponseTime: Math.round(average),
      percentile95: percentile95,
      exceedingTarget,
      exceedingTargetPercent: Math.round((exceedingTarget / this.performanceLog.length) * 100)
    };
  }
}

module.exports = { LLMNarrator };
