/**
 * Context Builder Module
 * Builds optimized LLM prompts from location data with priority-based loading
 * Based on Epic 1 Technical Specification §AC-3 - Context Builder Token Budget
 *
 * @module ContextBuilder
 * @example
 * // Basic usage
 * const { ContextBuilder } = require('./context-builder');
 * const { LocationLoader } = require('../data/location-loader');
 *
 * const builder = new ContextBuilder();
 * const loader = new LocationLoader();
 *
 * // Load location and build prompt
 * const location = await loader.loadLocation('village-of-barovia');
 * const prompt = await builder.buildPrompt(location);
 *
 * console.log('Tokens used:', prompt.metadata.estimatedTokens);
 * console.log('System prompt:', prompt.systemPrompt);
 *
 * @example
 * // With character and recent actions
 * const characterData = {
 *   characterId: 'char-1',
 *   name: 'Elara',
 *   level: 5,
 *   class: 'Wizard',
 *   race: 'Elf',
 *   hp: { current: 28, max: 32 }
 * };
 *
 * const recentActions = [
 *   { description: 'Investigated the tavern', result: 'Found a clue' },
 *   { description: 'Spoke with the burgomaster', result: 'Learned about Ireena' }
 * ];
 *
 * const prompt = await builder.buildPrompt(location, characterData, recentActions);
 *
 * @example
 * // Custom token budget
 * const customBuilder = new ContextBuilder({ maxTokens: 2000 });
 * const prompt = await customBuilder.buildPrompt(location);
 */

/**
 * @typedef {import('../data/schemas.js').LocationData} LocationData
 * @typedef {import('../data/schemas.js').CharacterData} CharacterData
 * @typedef {import('../data/schemas.js').PlayerAction} PlayerAction
 * @typedef {import('../data/schemas.js').LLMPrompt} LLMPrompt
 */

/**
 * Token Budget Constants
 * Based on Claude API context limits and Epic 1 Technical Specification
 */
const TOKEN_BUDGET = {
  MAX_TOKENS: 3000,              // Hard limit for total prompt (Claude API constraint)
  SYSTEM_PROMPT_TARGET: 450,     // Target tokens for system prompt (~400-500)
  PRIORITY_1_TARGET: 1750,       // Target tokens for Priority 1 content (~1500-2000)
  PRIORITY_2_TARGET: 750,        // Target tokens for Priority 2 content (~500-1000)
  BUFFER: 50,                    // Safety margin for estimation errors
};

/**
 * Priority Tiers for Content Loading
 * Based on Epic 1 Technical Specification §4.3.2 - Priority-Based Loading Strategy
 */
const PRIORITY_TIERS = {
  PRIORITY_1: {
    name: 'Critical Context',
    includes: ['description', 'state', 'character', 'recentActions'],
    alwaysIncluded: true,
  },
  PRIORITY_2: {
    name: 'Conditional Context',
    includes: ['npcs', 'items'],
    conditionalOnBudget: true,
  },
  PRIORITY_3: {
    name: 'Deferred Context',
    includes: ['events'],
    deferredToEpic2: true,
  },
};

/**
 * Token Estimation Constants
 * Using 1 token ≈ 4 characters heuristic with API formatting overhead
 */
const TOKEN_ESTIMATION = {
  CHARS_PER_TOKEN: 4,           // Average characters per token
  OVERHEAD_MULTIPLIER: 1.05,    // 5% overhead for API formatting
};

/**
 * ContextBuilder Class
 * Builds token-budgeted LLM prompts with priority-based content loading
 */
class ContextBuilder {
  /**
   * Creates a new ContextBuilder instance
   * @param {Object} [config] - Optional configuration overrides
   * @param {number} [config.maxTokens] - Override default max tokens (default: 3000)
   * @param {number} [config.charsPerToken] - Override token estimation ratio (default: 4)
   */
  constructor(config = {}) {
    this.maxTokens = config.maxTokens || TOKEN_BUDGET.MAX_TOKENS;
    this.charsPerToken = config.charsPerToken || TOKEN_ESTIMATION.CHARS_PER_TOKEN;
    this.overheadMultiplier = TOKEN_ESTIMATION.OVERHEAD_MULTIPLIER;

    // Configuration
    this.config = {
      maxTokens: this.maxTokens,
      charsPerToken: this.charsPerToken,
      systemPromptTarget: TOKEN_BUDGET.SYSTEM_PROMPT_TARGET,
      priority1Target: TOKEN_BUDGET.PRIORITY_1_TARGET,
      priority2Target: TOKEN_BUDGET.PRIORITY_2_TARGET,
      buffer: TOKEN_BUDGET.BUFFER,
    };

    // Priority tier definitions
    this.priorityTiers = PRIORITY_TIERS;
  }

  /**
   * Build a complete LLM prompt from location, character, and action data
   * Main entry point for context building
   *
   * @param {LocationData} locationData - Location to build context for
   * @param {CharacterData|null} characterData - Character data (optional, stub in Epic 1)
   * @param {PlayerAction[]} [recentActions=[]] - Recent player actions for continuity
   * @returns {LLMPrompt} Complete LLM prompt with token-budgeted content
   * @throws {Error} If locationData is invalid or token budget cannot be satisfied
   */
  buildPrompt(locationData, characterData = null, recentActions = []) {
    // Validate inputs
    if (!locationData) {
      throw new Error('locationData is required');
    }
    if (!locationData.locationId || !locationData.locationName) {
      throw new Error('Invalid locationData: missing locationId or locationName');
    }

    // 1. Generate system prompt (DM persona and instructions)
    const systemPrompt = this.getSystemPrompt();
    const systemPromptTokens = this.estimateTokens(systemPrompt);

    // 2. Build Priority 1 content (always included: description, state, character, actions)
    const limitedActions = recentActions.slice(-5); // Last 5 actions only
    const priority1Content = this.buildPriority1Content(
      locationData,
      characterData,
      limitedActions
    );
    const priority1Tokens = this.estimateTokens(priority1Content);

    // 3. Calculate remaining token budget for Priority 2
    const tokensUsedSoFar = systemPromptTokens + priority1Tokens;
    const remainingTokens = this.maxTokens - tokensUsedSoFar - this.config.buffer;

    // 4. Build Priority 2 content (conditional: NPCs, Items)
    const priority2Result = this.buildPriority2Content(locationData, remainingTokens);
    const priority2Tokens = this.estimateTokens(priority2Result.content);

    // 5. Calculate total token usage
    const totalTokens = systemPromptTokens + priority1Tokens + priority2Tokens;

    // 6. Validate token budget
    if (totalTokens > this.maxTokens) {
      throw new Error(
        `Token budget exceeded: ${totalTokens} > ${this.maxTokens}. ` +
        `System: ${systemPromptTokens}, Priority 1: ${priority1Tokens}, Priority 2: ${priority2Tokens}`
      );
    }

    // 7. Assemble LLMPrompt object
    const prompt = {
      systemPrompt,
      contextDescription: priority1Content.split('## Location Status')[0].trim(),
      contextCharacter: this.extractCharacterContext(priority1Content),
      contextRecentActions: this.extractRecentActions(priority1Content),
      contextNPCs: this.extractNPCsContext(priority2Result.content),
      contextItems: this.extractItemsContext(priority2Result.content),
      metadata: {
        estimatedTokens: totalTokens,
        systemPromptTokens,
        priority1Tokens,
        priority2Tokens,
        priority2Truncated: priority2Result.truncated,
        generatedAt: new Date().toISOString(),
      },
    };

    return prompt;
  }

  /**
   * Estimate token count for a text string
   * Uses 1 token ≈ 4 characters heuristic with overhead buffer
   *
   * @param {string} text - Text to estimate tokens for
   * @returns {number} Estimated token count (conservative estimate)
   */
  estimateTokens(text) {
    if (typeof text !== 'string') {
      return 0;
    }

    if (text.length === 0) {
      return 0;
    }

    // Calculate base token estimate: characters / charsPerToken
    const baseTokens = text.length / this.charsPerToken;

    // Apply overhead multiplier for API formatting (5% buffer)
    const estimatedTokens = baseTokens * this.overheadMultiplier;

    // Return conservative estimate (round up to nearest integer)
    return Math.ceil(estimatedTokens);
  }

  /**
   * Generate system prompt with DM persona and setting context
   *
   * @returns {string} System prompt for LLM (~400-500 tokens)
   */
  getSystemPrompt() {
    return `You are an expert Dungeon Master running the Curse of Strahd campaign in the gothic horror realm of Barovia. You are narrating the game using the D&D 5th Edition ruleset.

# Your Role
- Create immersive, atmospheric narration that captures the dread and mystery of Barovia
- Respond to player actions with vivid descriptions and consequences
- Roleplay NPCs authentically based on their personalities and motivations
- Enforce D&D 5e rules fairly while prioritizing narrative flow and player enjoyment
- Adjust challenge and pacing to maintain tension and engagement

# Setting Context: Curse of Strahd
Barovia is a dark, mist-shrouded demiplane ruled by the vampire Count Strahd von Zarovich. The realm is trapped in eternal twilight, surrounded by deadly fog that prevents escape. The people live in fear and despair, their hope fading with each generation under Strahd's tyranny.

# Key Themes
- Gothic horror and dread
- Moral ambiguity and difficult choices
- The struggle between hope and despair
- Strahd as a tragic, complex villain

# D&D 5e Guidelines (Brief)
- Use standard D&D 5e mechanics for ability checks, saving throws, and combat
- Difficulty Classes (DC): Easy 10, Medium 15, Hard 20, Very Hard 25
- Combat follows initiative order; describe enemy actions and ask for player responses
- Death saves and unconsciousness follow standard rules
- Spell slots, limited resources, and rests are tracked

# Narrative Style
- Use present tense for immediacy
- Include sensory details (sight, sound, smell, touch)
- Build tension gradually; reward player creativity and roleplay
- Let player choices matter; adapt the story to their decisions
- When danger is near, hint at it through atmosphere and clues

You will receive context about the current location, character status, and recent actions. Use this information to create responsive, contextual narration.`;
  }

  /**
   * Build Priority 1 content (always included)
   * Includes: description, state, character, recent actions
   *
   * @param {LocationData} locationData - Location data
   * @param {CharacterData|null} characterData - Character data (optional)
   * @param {PlayerAction[]} recentActions - Recent actions
   * @returns {string} Formatted Priority 1 content
   * @private
   */
  buildPriority1Content(locationData, characterData, recentActions) {
    const sections = [];

    // Validate locationData has required fields
    if (!locationData.locationName || !locationData.description) {
      throw new Error('Invalid locationData: missing required fields');
    }
    if (!locationData.state) {
      throw new Error('Invalid locationData: missing state');
    }
    if (!locationData.metadata) {
      throw new Error('Invalid locationData: missing metadata');
    }

    // 1. Location Description (select variant based on context)
    const isFirstVisit = !locationData.metadata.discovered ||
                         !locationData.metadata.first_visit_date;
    const description = this.selectDescriptionVariant(locationData, isFirstVisit);
    sections.push(`# Current Location: ${locationData.locationName}\n\n${description}`);

    // 2. Location State
    const state = locationData.state;
    sections.push(`\n## Location Status`);
    sections.push(`Weather: ${state.weather}`);
    sections.push(`Status: ${state.locationStatus}`);

    if (state.changesSinceLastVisit && state.changesSinceLastVisit.length > 0) {
      sections.push(`\nChanges Since Last Visit:`);
      state.changesSinceLastVisit.forEach(change => {
        sections.push(`- ${change}`);
      });
    }

    // 3. Character Context (stub for Epic 1)
    if (characterData) {
      sections.push(`\n## Character Status`);
      sections.push(`Name: ${characterData.name}`);
      sections.push(`Level ${characterData.level} ${characterData.race} ${characterData.class}`);
      sections.push(`HP: ${characterData.hp.current}/${characterData.hp.max}`);
    }

    // 4. Recent Actions (last 5 for context continuity)
    if (recentActions && recentActions.length > 0) {
      const formattedActions = this.formatRecentActions(recentActions);
      sections.push(`\n## Recent Actions\n${formattedActions}`);
    }

    return sections.join('\n');
  }

  /**
   * Build Priority 2 content (conditional on token budget)
   * Includes: NPCs, Items
   *
   * @param {LocationData} locationData - Location data
   * @param {number} remainingTokens - Available token budget after Priority 1
   * @returns {Object} Object with content and metadata
   * @returns {string} .content - Formatted Priority 2 content (may be truncated or empty)
   * @returns {boolean} .truncated - Whether content was truncated
   * @private
   */
  buildPriority2Content(locationData, remainingTokens) {
    if (remainingTokens <= 0) {
      return { content: '', truncated: true };
    }

    const sections = [];
    let tokensUsed = 0;
    let wasTruncated = false;

    // Priority 2a: NPCs (higher priority than Items)
    if (locationData.npcs && locationData.npcs.length > 0) {
      const npcBudget = Math.floor(remainingTokens * 0.6); // 60% of budget for NPCs
      const npcContent = this.formatNPCs(locationData.npcs, npcBudget);

      if (npcContent.truncated) {
        wasTruncated = true;
      }

      if (npcContent.content) {
        sections.push(`\n## NPCs Present\n${npcContent.content}`);
        tokensUsed += this.estimateTokens(npcContent.content);
      }
    }

    // Priority 2b: Items (lower priority than NPCs)
    const itemBudget = remainingTokens - tokensUsed;
    if (itemBudget > 0 && locationData.items && locationData.items.length > 0) {
      const itemContent = this.formatItems(locationData.items, itemBudget);

      if (itemContent.truncated) {
        wasTruncated = true;
      }

      if (itemContent.content) {
        sections.push(`\n## Items Available\n${itemContent.content}`);
        tokensUsed += this.estimateTokens(itemContent.content);
      }
    }

    // Log warning if content was truncated
    if (wasTruncated) {
      console.warn('[ContextBuilder] Priority 2 content truncated due to token budget constraints');
    }

    return {
      content: sections.join('\n'),
      truncated: wasTruncated,
    };
  }

  // ============================================================================
  // Helper Methods (Task 8)
  // ============================================================================

  /**
   * Format recent player actions for context continuity
   * @param {PlayerAction[]} actions - Recent player actions
   * @returns {string} Formatted actions (last 5 only)
   * @private
   */
  formatRecentActions(actions) {
    if (!actions || actions.length === 0) {
      return 'No recent actions.';
    }

    const last5 = actions.slice(-5);
    const formatted = last5.map((action, index) => {
      const actionNum = index + 1;
      let entry = `${actionNum}. ${action.description}`;
      if (action.result) {
        entry += ` → ${action.result}`;
      }
      return entry;
    });

    return formatted.join('\n');
  }

  /**
   * Select appropriate description variant based on visit context
   * @param {LocationData} locationData - Location data
   * @param {boolean} isFirstVisit - Whether this is the first visit
   * @returns {string} Selected description text
   * @private
   */
  selectDescriptionVariant(locationData, isFirstVisit) {
    // Handle missing descriptionVariants gracefully
    const variants = locationData.descriptionVariants || {};

    // Prefer initial/return variants if available
    if (isFirstVisit && variants.initial) {
      return variants.initial;
    }
    if (!isFirstVisit && variants.return) {
      return variants.return;
    }

    // Fallback to full description
    if (!locationData.description) {
      throw new Error('Location has no description available');
    }
    return locationData.description;
  }

  /**
   * Format NPC information with token budget constraint
   * @param {import('../data/schemas.js').NPCData[]} npcs - NPCs to format
   * @param {number} maxTokens - Maximum tokens allowed
   * @returns {Object} Object with formatted content and truncation flag
   * @private
   */
  formatNPCs(npcs, maxTokens) {
    if (!npcs || npcs.length === 0) {
      return { content: '', truncated: false };
    }

    const npcEntries = [];
    let totalTokens = 0;
    let truncated = false;

    for (const npc of npcs) {
      // Format NPC entry
      const entry = `**${npc.name}** (${npc.type})\n` +
                   `Status: ${npc.status} | Attitude: ${npc.attitudeTowardPlayer}\n` +
                   `${npc.description.substring(0, 200)}${npc.description.length > 200 ? '...' : ''}`;

      const entryTokens = this.estimateTokens(entry);

      // Check if adding this entry would exceed budget
      if (totalTokens + entryTokens > maxTokens) {
        truncated = true;
        break;
      }

      npcEntries.push(entry);
      totalTokens += entryTokens;
    }

    return {
      content: npcEntries.join('\n\n'),
      truncated,
    };
  }

  /**
   * Format item information with token budget constraint
   * @param {import('../data/schemas.js').ItemData[]} items - Items to format
   * @param {number} maxTokens - Maximum tokens allowed
   * @returns {Object} Object with formatted content and truncation flag
   * @private
   */
  formatItems(items, maxTokens) {
    if (!items || items.length === 0) {
      return { content: '', truncated: false };
    }

    // Separate visible and hidden items
    const visibleItems = items.filter(item => !item.hidden);
    const hiddenItems = items.filter(item => item.hidden);

    const itemEntries = [];
    let totalTokens = 0;
    let truncated = false;

    // Add visible items first
    if (visibleItems.length > 0) {
      itemEntries.push('### Available Items');
      for (const item of visibleItems) {
        const entry = `- **${item.name}**: ${item.description}`;
        const entryTokens = this.estimateTokens(entry);

        if (totalTokens + entryTokens > maxTokens) {
          truncated = true;
          break;
        }

        itemEntries.push(entry);
        totalTokens += entryTokens;
      }
    }

    // Add hidden items if budget allows
    if (!truncated && hiddenItems.length > 0) {
      const headerTokens = this.estimateTokens('\n### Hidden Items (Investigation DC required)');
      if (totalTokens + headerTokens < maxTokens) {
        itemEntries.push('\n### Hidden Items (Investigation DC required)');
        totalTokens += headerTokens;

        for (const item of hiddenItems) {
          const entry = `- **${item.name}** (DC ${item.dc}): ${item.description}`;
          const entryTokens = this.estimateTokens(entry);

          if (totalTokens + entryTokens > maxTokens) {
            truncated = true;
            break;
          }

          itemEntries.push(entry);
          totalTokens += entryTokens;
        }
      } else {
        truncated = true;
      }
    }

    return {
      content: itemEntries.join('\n'),
      truncated,
    };
  }

  /**
   * Truncate text to fit within token limit
   * @param {string} text - Text to truncate
   * @param {number} maxTokens - Maximum tokens allowed
   * @returns {string} Truncated text
   * @private
   */
  truncateToTokenLimit(text, maxTokens) {
    const currentTokens = this.estimateTokens(text);

    if (currentTokens <= maxTokens) {
      return text;
    }

    // Calculate target character count
    const targetChars = Math.floor(maxTokens * this.charsPerToken / this.overheadMultiplier);
    const truncated = text.substring(0, targetChars);

    return truncated + '...';
  }

  /**
   * Extract character context section from Priority 1 content
   * @param {string} priority1Content - Full Priority 1 content
   * @returns {string} Character context section
   * @private
   */
  extractCharacterContext(priority1Content) {
    const match = priority1Content.match(/## Character Status\n([\s\S]*?)(?=\n## |\n$|$)/);
    return match ? match[0] : '';
  }

  /**
   * Extract recent actions section from Priority 1 content
   * @param {string} priority1Content - Full Priority 1 content
   * @returns {string} Recent actions section
   * @private
   */
  extractRecentActions(priority1Content) {
    const match = priority1Content.match(/## Recent Actions\n([\s\S]*?)$/);
    return match ? match[0] : '';
  }

  /**
   * Extract NPCs section from Priority 2 content
   * @param {string} priority2Content - Full Priority 2 content
   * @returns {string} NPCs section
   * @private
   */
  extractNPCsContext(priority2Content) {
    const match = priority2Content.match(/## NPCs Present\n([\s\S]*?)(?=\n## |\n$|$)/);
    return match ? match[0] : '';
  }

  /**
   * Extract items section from Priority 2 content
   * @param {string} priority2Content - Full Priority 2 content
   * @returns {string} Items section
   * @private
   */
  extractItemsContext(priority2Content) {
    const match = priority2Content.match(/## Items Available\n([\s\S]*?)$/);
    return match ? match[0] : '';
  }
}

module.exports = { ContextBuilder };
