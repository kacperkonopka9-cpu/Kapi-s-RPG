/**
 * ContextLoader - Assemble game context for LLM prompts with priority-based filtering
 * Epic 5 Story 5.1: Intelligent Context Loader
 *
 * Implements 3-priority context loading system:
 * - P1 (Always Load): Character, location Description+State, calendar (~1300 tokens)
 * - P2 (Conditional): Relevant NPCs, upcoming events, active quests (~1050 tokens)
 * - P3 (Deferred): Full events, distant NPCs, completed quests (~1150 tokens if budget allows)
 *
 * Token Budget: 3500 soft limit, 4000 hard limit (Claude Code API constraint)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { addDays, parseISO, isAfter, isBefore } = require('date-fns');
const ContextCache = require('./context-cache');
const PerformanceMonitor = require('../performance/performance-monitor');

/**
 * Context Loader class
 * Assembles context for LLM prompts based on priority system and token budget
 */
class ContextLoader {
  /**
   * Create a new ContextLoader
   * @param {Object} deps - Dependency injection
   * @param {Object} deps.fs - File system module (default: require('fs'))
   * @param {Object} deps.path - Path module (default: require('path'))
   * @param {Object} deps.yaml - YAML parser (default: require('js-yaml'))
   * @param {Object} deps.LocationLoader - Epic 1 LocationLoader instance
   * @param {Object} deps.CalendarManager - Epic 2 CalendarManager instance
   * @param {Object} deps.CharacterManager - Epic 3 CharacterManager instance (optional)
   * @param {Object} deps.PriorityResolver - PriorityResolver instance
   * @param {Object} deps.ContextCache - Story 5.2 ContextCache instance (optional)
   * @param {Object} deps.PerformanceMonitor - Story 5.7 PerformanceMonitor instance (optional)
   */
  constructor(deps = {}) {
    this.fs = deps.fs || fs;
    this.path = deps.path || path;
    this.yaml = deps.yaml || yaml;

    // Base directory for resolving relative paths (defaults to process.cwd())
    this.baseDir = deps.baseDir || process.cwd();

    // Epic 1-4 integrations
    this.locationLoader = deps.LocationLoader || null;
    this.calendarManager = deps.CalendarManager || null;
    this.characterManager = deps.CharacterManager || null;

    // Priority resolver for filtering
    this.priorityResolver = deps.PriorityResolver || null;

    // Epic 5 Story 5.2: Context caching for performance
    this.cache = deps.ContextCache || null;

    // Epic 5 Story 5.7: Performance monitoring (use singleton if not injected)
    this.performanceMonitor = deps.PerformanceMonitor || null;

    // Epic 5 Story 5.7: Background preloader for adjacent locations
    this.preloader = deps.Preloader || null;

    // Token estimation constants
    this.CHARS_PER_TOKEN = 4; // ~4 characters = 1 token (English text baseline)
    this.MARKDOWN_OVERHEAD = 1.05; // Markdown formatting adds ~5% overhead

    // Token budget constants
    this.SOFT_LIMIT = 3500;
    this.HARD_LIMIT = 4000;
    this.WARNING_THRESHOLD = 3800; // 95% of hard limit

    // Priority token allocations (targets)
    this.P1_TARGET = 1300;
    this.P2_TARGET = 1050;
    this.P3_TARGET = 1150;
  }

  /**
   * Estimate token count for markdown string
   * Uses ~4 characters = 1 token heuristic with markdown overhead
   * @param {string} markdown - Markdown content
   * @returns {number} Estimated token count
   */
  estimateTokens(markdown) {
    if (!markdown || typeof markdown !== 'string') {
      return 0;
    }

    const charCount = markdown.length;
    const baseTokens = charCount / this.CHARS_PER_TOKEN;
    const tokensWithOverhead = Math.ceil(baseTokens * this.MARKDOWN_OVERHEAD);

    return tokensWithOverhead;
  }

  /**
   * Load and parse character YAML file
   * @param {string} characterPath - Path to character YAML file
   * @returns {Promise<{success: boolean, data?: object, error?: string}>} Result object with character data
   * @private
   */
  async _loadCharacter(characterPath) {
    try {
      // Check cache first if available
      if (this.cache) {
        const cacheKey = ContextCache.generateKey('character', this.path.basename(characterPath, '.yaml'), 'v1');
        const cached = this.cache.get(cacheKey);
        if (cached) {
          return { success: true, data: cached };
        }
      }

      // Cache miss or no cache - load from file
      const characterYaml = await this.fs.promises.readFile(characterPath, 'utf-8');
      const character = this.yaml.load(characterYaml);

      // Extract essential character data (compact format, ~400 tokens max)
      // Support both 'hp' (number or object) and 'hitPoints' (object) field names
      let hpCurrent = 0;
      let hpMax = 0;

      if (character.hitPoints && typeof character.hitPoints === 'object') {
        hpCurrent = character.hitPoints.current || 0;
        hpMax = character.hitPoints.max || 0;
      } else if (typeof character.hp === 'number') {
        // hp is just a number - use as both current and max
        hpCurrent = character.hp;
        hpMax = character.hp;
      } else if (character.hp && typeof character.hp === 'object') {
        hpCurrent = character.hp.current || 0;
        hpMax = character.hp.max || 0;
      }

      const ac = character.ac || character.armorClass || 10;

      const characterSnapshot = {
        name: character.name || 'Unknown',
        level: character.level || 1,
        class: character.class || 'Unknown',
        hp: {
          current: hpCurrent,
          max: hpMax
        },
        ac: ac,
        spellSlots: character.spellSlots || {},
        conditions: character.conditions || [],
        abilities: {
          STR: character.abilities?.strength || character.abilities?.STR || 10,
          DEX: character.abilities?.dexterity || character.abilities?.DEX || 10,
          CON: character.abilities?.constitution || character.abilities?.CON || 10,
          INT: character.abilities?.intelligence || character.abilities?.INT || 10,
          WIS: character.abilities?.wisdom || character.abilities?.WIS || 10,
          CHA: character.abilities?.charisma || character.abilities?.CHA || 10
        }
      };

      // Populate cache if available
      if (this.cache) {
        const cacheKey = ContextCache.generateKey('character', this.path.basename(characterPath, '.yaml'), 'v1');
        this.cache.set(cacheKey, characterSnapshot);
      }

      return { success: true, data: characterSnapshot };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load character file: ${error.message}`
      };
    }
  }

  /**
   * Load P1 context (always load): Character, location Description+State, calendar
   * @param {string} characterPath - Path to character file
   * @param {string} locationId - Current location ID
   * @returns {Promise<{success: boolean, data?: object, error?: string}>} Result object with P1 context
   * @private
   */
  async _loadP1Context(characterPath, locationId) {
    try {
      const context = {
        character: null,
        location: null,
        calendar: null,
        markdown: ''
      };

      // Load character
      const characterResult = await this._loadCharacter(characterPath);
      if (!characterResult.success) {
        return characterResult;
      }
      context.character = characterResult.data;

      // Load location (Epic 1 integration)
      if (this.locationLoader) {
        try {
          let locationData = null;

          // Check cache first if available
          if (this.cache) {
            const cacheKey = ContextCache.generateKey('location', locationId, 'v1');
            locationData = this.cache.get(cacheKey);
          }

          // Cache miss or no cache - load from LocationLoader
          if (!locationData) {
            // LocationLoader.loadLocation() returns LocationData directly (not Result Object) and throws on error
            locationData = await this.locationLoader.loadLocation(locationId);

            // Populate cache if available
            if (this.cache) {
              const cacheKey = ContextCache.generateKey('location', locationId, 'v1');
              this.cache.set(cacheKey, locationData);
            }
          }

          context.location = {
            locationId: locationData.locationId,
            name: locationData.locationName,
            description: locationData.description,
            state: locationData.state,
            connections: locationData.metadata?.connections || locationData.metadata?.connected_locations || []
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to load location: ${error.message}`
          };
        }
      } else {
        return {
          success: false,
          error: 'LocationLoader not initialized'
        };
      }

      // Load calendar (Epic 2 integration)
      // CalendarManager doesn't have getCalendarState() - load calendar.yaml directly
      try {
        let calendarData = null;

        // Check cache first if available
        if (this.cache) {
          const cacheKey = ContextCache.generateKey('calendar', 'current', 'v1');
          calendarData = this.cache.get(cacheKey);
        }

        // Cache miss or no cache - load from file
        if (!calendarData) {
          const calendarPath = this.path.join(this.baseDir, 'game-data', 'calendar.yaml');
          const calendarYaml = await this.fs.promises.readFile(calendarPath, 'utf-8');
          calendarData = this.yaml.load(calendarYaml);

          // Populate cache if available
          if (this.cache) {
            const cacheKey = ContextCache.generateKey('calendar', 'current', 'v1');
            this.cache.set(cacheKey, calendarData);
          }
        }

        context.calendar = calendarData;
      } catch (error) {
        return {
          success: false,
          error: `Failed to load calendar: ${error.message}`
        };
      }

      // Format P1 markdown
      context.markdown = this._formatP1Markdown(context);

      return { success: true, data: context };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load P1 context: ${error.message}`
      };
    }
  }

  /**
   * Format P1 context as markdown
   * @param {object} context - P1 context data
   * @returns {string} Formatted markdown
   * @private
   */
  _formatP1Markdown(context) {
    const { character, location, calendar } = context;

    let markdown = '# Current Context\n\n';

    // Character section
    markdown += '## Character\n\n';
    markdown += `**${character.name}** (Level ${character.level} ${character.class})\n`;
    markdown += `- **HP:** ${character.hp.current}/${character.hp.max}\n`;
    markdown += `- **AC:** ${character.ac}\n`;
    markdown += `- **Conditions:** ${character.conditions.length > 0 ? character.conditions.join(', ') : 'None'}\n\n`;

    // Spell slots (if any)
    const spellSlots = Object.keys(character.spellSlots);
    if (spellSlots.length > 0) {
      markdown += `**Spell Slots:**\n`;
      spellSlots.forEach(level => {
        const slots = character.spellSlots[level];
        markdown += `- Level ${level}: ${slots.used || 0}/${slots.total || 0}\n`;
      });
      markdown += '\n';
    }

    // Location section
    markdown += '## Location\n\n';
    markdown += `**${location.name}**\n\n`;
    markdown += `${location.description}\n\n`;

    // Calendar section
    markdown += '## Calendar\n\n';
    markdown += `**Date:** ${calendar.current?.date || 'Unknown'}, ${calendar.current?.time || 'Unknown'}\n`;
    markdown += `**Day:** ${calendar.current?.day_of_week || 'Unknown'}\n`;
    markdown += `**Season:** ${calendar.current?.season || 'Unknown'}\n`;
    markdown += `**Weather:** ${calendar.weather?.current || 'Unknown'}\n`;
    markdown += `**Moon Phase:** ${calendar.moon?.current_phase || 'Unknown'}\n\n`;

    return markdown;
  }

  /**
   * Load P2 context (conditional): Relevant NPCs, upcoming events, active quests
   * @param {object} locationData - Full location data from LocationLoader
   * @param {string} currentDate - Current in-game date
   * @param {Array<string>} adjacentLocations - Array of adjacent location IDs
   * @returns {Promise<{success: boolean, data?: object, error?: string}>} Result object with P2 context
   * @private
   */
  async _loadP2Context(locationData, currentDate, adjacentLocations) {
    try {
      const context = {
        npcs: [],
        events: [],
        quests: [],
        markdown: ''
      };

      // Filter NPCs by relevance (current + adjacent locations)
      if (locationData.npcs) {
        if (this.priorityResolver) {
          context.npcs = this.priorityResolver.filterRelevantNPCs(
            locationData.npcs,
            locationData.locationId,
            adjacentLocations
          );
        } else {
          // No PriorityResolver - include all NPCs from current location
          context.npcs = locationData.npcs;
        }
      }

      // Filter events by time window (next 7 days)
      if (locationData.events) {
        if (this.priorityResolver) {
          context.events = this.priorityResolver.filterRelevantEvents(
            locationData.events,
            currentDate
          );
        } else {
          // No PriorityResolver - include all events
          context.events = locationData.events;
        }
      }

      // TODO: Load active quests (Epic 4 integration)
      // For now, quests = []

      // Format P2 markdown
      context.markdown = this._formatP2Markdown(context);

      return { success: true, data: context };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load P2 context: ${error.message}`
      };
    }
  }

  /**
   * Format P2 context as markdown
   * @param {object} context - P2 context data
   * @returns {string} Formatted markdown
   * @private
   */
  _formatP2Markdown(context) {
    let markdown = '';

    // NPCs section
    if (context.npcs && context.npcs.length > 0) {
      markdown += '## NPCs Present\n\n';
      context.npcs.forEach(npc => {
        markdown += `**${npc.name}** (${npc.type || 'NPC'})\n`;
        if (npc.description) {
          markdown += `${npc.description.substring(0, 150)}...\n`;
        }
        markdown += '\n';
      });
    }

    // Upcoming events section
    if (context.events && context.events.length > 0) {
      markdown += '## Upcoming Events\n\n';
      context.events.forEach(event => {
        markdown += `**${event.name}**\n`;
        markdown += `- Trigger: ${event.trigger_date || event.trigger_time || 'Conditional'}\n`;
        if (event.description) {
          markdown += `- ${event.description.substring(0, 100)}...\n`;
        }
        markdown += '\n';
      });
    }

    // Active quests section
    if (context.quests && context.quests.length > 0) {
      markdown += '## Active Quests\n\n';
      context.quests.forEach(quest => {
        markdown += `**${quest.title}**\n`;
        markdown += `- Status: ${quest.status}\n`;
        markdown += `- Objectives: ${quest.objectives?.length || 0} total\n\n`;
      });
    }

    return markdown;
  }

  /**
   * Load P3 context (deferred): Full events, distant NPCs, completed quests
   * @param {object} locationData - Full location data
   * @param {number} remainingBudget - Remaining token budget for P3
   * @returns {Promise<{success: boolean, data?: object, error?: string}>} Result object with P3 context
   * @private
   */
  async _loadP3Context(locationData, remainingBudget) {
    try {
      const context = {
        allEvents: [],
        distantNPCs: [],
        completedQuests: [],
        markdown: ''
      };

      // Only load P3 if budget allows
      if (remainingBudget < 100) {
        return { success: true, data: context }; // Return empty P3
      }

      // Load full events (all events, not just next 7 days)
      if (locationData.events) {
        context.allEvents = locationData.events;
      }

      // TODO: Load distant NPCs and completed quests

      // Format P3 markdown (truncate if over budget)
      context.markdown = this._formatP3Markdown(context, remainingBudget);

      return { success: true, data: context };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load P3 context: ${error.message}`
      };
    }
  }

  /**
   * Format P3 context as markdown (with budget limit)
   * @param {object} context - P3 context data
   * @param {number} budgetLimit - Max tokens for P3
   * @returns {string} Formatted markdown (truncated to budget)
   * @private
   */
  _formatP3Markdown(context, budgetLimit) {
    let markdown = '';

    if (context.allEvents && context.allEvents.length > 0) {
      markdown += '## All Events\n\n';
      markdown += `Total events: ${context.allEvents.length}\n\n`;
    }

    // Truncate if over budget
    if (this.estimateTokens(markdown) > budgetLimit) {
      markdown = markdown.substring(0, budgetLimit * this.CHARS_PER_TOKEN);
      markdown += '\n\n[Additional context truncated due to token budget]\n';
    }

    return markdown;
  }

  /**
   * Assemble complete game context for LLM prompt
   * @param {string} characterPath - Path to character YAML file
   * @param {string} locationId - Current location ID
   * @param {object} sessionState - Current session state
   * @param {number} tokenBudget - Max tokens for context (default: 3500 soft limit)
   * @returns {Promise<{success: boolean, data?: object, error?: string}>} Result object with ContextObject
   */
  async loadContext(characterPath, locationId, sessionState = {}, tokenBudget = 3500) {
    const startTime = Date.now();

    // Story 5.7: Start performance timer if monitor available
    const monitor = this.performanceMonitor || PerformanceMonitor.getInstance();
    const stopTimer = monitor ? monitor.startTimer('contextLoad') : null;

    try {
      // Validate token budget
      if (tokenBudget > this.HARD_LIMIT) {
        return {
          success: false,
          error: `Token budget (${tokenBudget}) exceeds hard limit (${this.HARD_LIMIT})`
        };
      }

      const contextObject = {
        metadata: {
          assembledAt: new Date().toISOString(),
          tokenCount: 0,
          prioritiesLoaded: [],
          cacheHitRate: 0
        },
        character: null,
        location: null,
        npcs: [],
        events: [],
        calendar: null,
        quests: [],
        contextMarkdown: ''
      };

      // Load P1 context (always load)
      const p1Result = await this._loadP1Context(characterPath, locationId);
      if (!p1Result.success) {
        return p1Result;
      }

      const p1Context = p1Result.data;
      contextObject.character = p1Context.character;
      contextObject.location = p1Context.location;
      contextObject.calendar = p1Context.calendar;

      const p1Markdown = p1Context.markdown;
      const p1Tokens = this.estimateTokens(p1Markdown);

      // Check if P1 alone exceeds soft limit (location too large)
      if (p1Tokens > this.SOFT_LIMIT) {
        return {
          success: false,
          error: `P1 context alone (${p1Tokens} tokens) exceeds soft limit (${this.SOFT_LIMIT}). Location too large.`
        };
      }

      contextObject.metadata.prioritiesLoaded.push('P1');
      let totalMarkdown = p1Markdown;
      let totalTokens = p1Tokens;

      // Load P2 context if budget allows
      if (totalTokens + this.P2_TARGET <= tokenBudget) {
        const adjacentLocations = p1Context.location.connections || [];
        const currentDate = p1Context.calendar?.current?.date || '';

        // Load full location data for P2 filtering
        try {
          let locationData = null;

          // Check cache first if available
          if (this.cache) {
            const cacheKey = ContextCache.generateKey('location', locationId, 'v1');
            locationData = this.cache.get(cacheKey);
          }

          // Cache miss or no cache - load from LocationLoader
          if (!locationData) {
            // LocationLoader.loadLocation() returns LocationData directly (not Result Object) and throws on error
            locationData = await this.locationLoader.loadLocation(locationId);

            // Populate cache if available
            if (this.cache) {
              const cacheKey = ContextCache.generateKey('location', locationId, 'v1');
              this.cache.set(cacheKey, locationData);
            }
          }

          const p2Result = await this._loadP2Context(
            locationData,
            currentDate,
            adjacentLocations
          );

          if (p2Result.success) {
            const p2Context = p2Result.data;
            contextObject.npcs = p2Context.npcs;
            contextObject.events = p2Context.events;
            contextObject.quests = p2Context.quests;

            const p2Markdown = p2Context.markdown;
            const p2Tokens = this.estimateTokens(p2Markdown);

            // Add P2 if it doesn't exceed budget
            if (totalTokens + p2Tokens <= tokenBudget) {
              totalMarkdown += p2Markdown;
              totalTokens += p2Tokens;
              contextObject.metadata.prioritiesLoaded.push('P2');
            }
          }
        } catch (error) {
          // P2 loading failed, continue without P2 context (non-fatal)
          console.warn(`P2 context loading failed: ${error.message}`);
        }
      }

      // Load P3 context if budget allows
      const remainingBudget = tokenBudget - totalTokens;
      if (remainingBudget >= 100) {
        try {
          let locationData = null;

          // Check cache first if available
          if (this.cache) {
            const cacheKey = ContextCache.generateKey('location', locationId, 'v1');
            locationData = this.cache.get(cacheKey);
          }

          // Cache miss or no cache - load from LocationLoader
          if (!locationData) {
            // LocationLoader.loadLocation() returns LocationData directly (not Result Object) and throws on error
            locationData = await this.locationLoader.loadLocation(locationId);

            // Populate cache if available
            if (this.cache) {
              const cacheKey = ContextCache.generateKey('location', locationId, 'v1');
              this.cache.set(cacheKey, locationData);
            }
          }

          const p3Result = await this._loadP3Context(locationData, remainingBudget);

          if (p3Result.success && p3Result.data.markdown) {
            const p3Markdown = p3Result.data.markdown;
            const p3Tokens = this.estimateTokens(p3Markdown);

            if (totalTokens + p3Tokens <= tokenBudget) {
              totalMarkdown += p3Markdown;
              totalTokens += p3Tokens;
              contextObject.metadata.prioritiesLoaded.push('P3');
            }
          }
        } catch (error) {
          // P3 loading failed, continue without P3 context (non-fatal)
          console.warn(`P3 context loading failed: ${error.message}`);
        }
      }

      // Finalize context object
      contextObject.contextMarkdown = totalMarkdown;
      contextObject.metadata.tokenCount = totalTokens;

      // Update cache hit rate from cache statistics
      if (this.cache) {
        const cacheStats = this.cache.getStats();
        contextObject.metadata.cacheHitRate = cacheStats.hitRate;
      }

      // Warn if approaching hard limit
      if (totalTokens >= this.WARNING_THRESHOLD) {
        console.warn(`⚠️ Token count (${totalTokens}) approaching hard limit (${this.HARD_LIMIT})`);
      }

      const loadTime = Date.now() - startTime;
      const cacheInfo = this.cache ? ` cache hit: ${contextObject.metadata.cacheHitRate.toFixed(1)}%` : '';
      console.log(`✓ Context loaded in ${loadTime}ms (${totalTokens} tokens, priorities: ${contextObject.metadata.prioritiesLoaded.join(', ')}${cacheInfo})`);

      // Story 5.7: Record performance metric
      if (stopTimer) {
        await stopTimer({
          locationId,
          tokenCount: totalTokens,
          priorities: contextObject.metadata.prioritiesLoaded.join(','),
          cacheHitRate: contextObject.metadata.cacheHitRate
        });
      }

      // Story 5.7: Start preloading adjacent locations in background
      if (this.preloader) {
        this.preloader.startIdleMonitor(locationId);
      }

      return { success: true, data: contextObject };

    } catch (error) {
      // Story 5.7: Record failed operation
      if (stopTimer) {
        await stopTimer({
          locationId,
          error: error.message
        });
      }

      return {
        success: false,
        error: `Context loading failed: ${error.message}`
      };
    }
  }
}

module.exports = ContextLoader;
