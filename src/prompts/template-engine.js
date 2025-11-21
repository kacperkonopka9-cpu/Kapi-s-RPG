/**
 * PromptTemplateEngine - Renders prompt templates with variable substitution
 * Epic 5 Story 5.3: LLM Prompt Templates
 *
 * Loads and populates reusable prompt templates with game context variables
 * ({{location}}, {{character}}, {{npcs}}) for consistent narrative generation.
 * Ensures Claude Code receives well-structured, contextually appropriate system
 * prompts that guide narrative quality, maintain gothic horror tone, and enforce
 * D&D 5e RAW adherence.
 *
 * @module prompts/template-engine
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * PromptTemplateEngine class
 *
 * Features:
 * - Variable substitution (simple, nested, arrays, optional defaults)
 * - Template loading with YAML frontmatter parsing
 * - DM persona prepending for consistent tone
 * - Token budget validation (soft limits with warnings)
 * - Template caching for performance
 * - Custom template registration
 *
 * @class
 */
class PromptTemplateEngine {
  /**
   * Create a PromptTemplateEngine instance
   *
   * @param {Object} deps - Dependencies (for dependency injection)
   * @param {Object} deps.fs - File system module (default: require('fs'))
   * @param {Object} deps.path - Path module (default: require('path'))
   * @param {Object} deps.yaml - YAML parser (default: require('js-yaml'))
   * @param {Function} deps.estimateTokens - Token estimation function from ContextLoader
   * @param {string} deps.templatesDir - Templates directory path (default: '{project-root}/prompts/templates')
   * @param {string} deps.dmPersonaPath - DM persona file path (default: '{project-root}/prompts/dm-persona.md')
   * @param {Object} deps.logger - Logger object with debug/error methods (default: console)
   */
  constructor(deps = {}) {
    // Dependency injection with defaults
    this.fs = deps.fs || fs;
    this.path = deps.path || path;
    this.yaml = deps.yaml || yaml;
    this.estimateTokens = deps.estimateTokens || this._defaultEstimateTokens.bind(this);

    // Paths
    const projectRoot = this.path.resolve(__dirname, '../..');
    this.templatesDir = deps.templatesDir || this.path.join(projectRoot, 'prompts', 'templates');
    this.dmPersonaPath = deps.dmPersonaPath || this.path.join(projectRoot, 'prompts', 'dm-persona.md');

    // Logger
    this.logger = deps.logger || console;

    // Template caching
    this.templateCache = new Map(); // Cache for loaded template files
    this.dmPersonaCache = null; // Cache for DM persona content
    this.registeredTemplates = new Map(); // Cache for custom registered templates
  }

  /**
   * Default token estimation function (fallback if not injected)
   * Uses Story 5-1 heuristic: ~4 chars/token + 5% markdown overhead
   *
   * @private
   * @param {string} markdown - Markdown content to estimate
   * @returns {number} Estimated token count
   */
  _defaultEstimateTokens(markdown) {
    if (!markdown || typeof markdown !== 'string') return 0;
    const baseTokens = markdown.length / 4;
    return Math.ceil(baseTokens * 1.05); // +5% markdown overhead
  }

  /**
   * Parse template content to extract variables
   * Finds all {{variable}}, {{object.property}}, {{#each items}}, {{variable || "default"}} patterns
   *
   * @private
   * @param {string} templateContent - Template content with {{variables}}
   * @returns {Array<string>} Array of variable names found in template
   */
  _parseTemplate(templateContent) {
    if (!templateContent || typeof templateContent !== 'string') return [];

    const variables = new Set();

    // Match {{variable}}, {{object.property}}, {{variable || "default"}}
    const simpleVarRegex = /\{\{([^#/][^\}]*?)\}\}/g;
    let match;

    while ((match = simpleVarRegex.exec(templateContent)) !== null) {
      let varName = match[1].trim();

      // Handle optional variables with defaults: {{variable || "default"}}
      if (varName.includes('||')) {
        varName = varName.split('||')[0].trim();
      }

      // Extract root variable name (for nested: object.property → object)
      const rootVar = varName.split('.')[0].trim();
      if (rootVar && rootVar !== 'this') {
        variables.add(rootVar);
      }
    }

    // Match {{#each items}} blocks
    const eachRegex = /\{\{#each\s+([^\}]+?)\}\}/g;
    while ((match = eachRegex.exec(templateContent)) !== null) {
      const iterableVar = match[1].trim();
      variables.add(iterableVar);
    }

    return Array.from(variables);
  }

  /**
   * Substitute simple variables: {{variable}} → context.variable
   *
   * @private
   * @param {string} template - Template content
   * @param {Object} context - Context object with values
   * @returns {string} Template with simple variables substituted
   */
  _substituteSimpleVariables(template, context) {
    // Match {{variable || "default"}} with optional defaults
    const optionalVarRegex = /\{\{([^#/\}]+?)\s*\|\|\s*["']([^"']+)["']\}\}/g;
    template = template.replace(optionalVarRegex, (match, varPath, defaultValue) => {
      const value = this._resolveNestedPath(varPath.trim(), context);
      return value !== undefined && value !== null ? String(value) : defaultValue;
    });

    // Match {{variable}} or {{object.property}} without defaults
    const simpleVarRegex = /\{\{([^#/\}]+?)\}\}/g;
    template = template.replace(simpleVarRegex, (match, varPath) => {
      const value = this._resolveNestedPath(varPath.trim(), context);
      return value !== undefined && value !== null ? String(value) : match; // Keep {{var}} if not found
    });

    return template;
  }

  /**
   * Resolve nested object path: object.property.subproperty
   *
   * @private
   * @param {string} path - Dot-notation path (e.g., "character.hp.current")
   * @param {Object} context - Context object
   * @returns {*} Resolved value or undefined
   */
  _resolveNestedPath(path, context) {
    const parts = path.split('.');
    let current = context;

    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }

    return current;
  }

  /**
   * Substitute array iterations: {{#each items}}...{{this.field}}...{{/each}}
   *
   * @private
   * @param {string} template - Template content
   * @param {Object} context - Context object with arrays
   * @returns {string} Template with array iterations expanded
   */
  _substituteArrayIterations(template, context) {
    const eachRegex = /\{\{#each\s+([^\}]+?)\}\}([\s\S]*?)\{\{\/each\}\}/g;

    return template.replace(eachRegex, (match, iterableVar, blockContent) => {
      const items = this._resolveNestedPath(iterableVar.trim(), context);

      // If not an array or empty, return empty string
      if (!Array.isArray(items) || items.length === 0) return '';

      // Render block for each item
      return items.map(item => {
        let rendered = blockContent;

        // First, handle {{#if this.field}} conditionals within each block
        rendered = rendered.replace(/\{\{#if\s+this\.([^\}]+?)\}\}([\s\S]*?)\{\{\/if\}\}/g, (m, field, content) => {
          const value = this._resolveNestedPath(field.trim(), item);
          return value ? content : '';
        });

        // Then replace {{this.field || "default"}} with optional defaults
        rendered = rendered.replace(/\{\{this\.([^\|\}]+?)\s*\|\|\s*([^\}]+?)\}\}/g, (m, field, defaultValue) => {
          const value = this._resolveNestedPath(field.trim(), item);
          if (value !== undefined && value !== null) return String(value);
          // Remove quotes from default value if present
          const cleanDefault = defaultValue.trim().replace(/^["']|["']$/g, '');
          return cleanDefault;
        });

        // Then replace {{this.field}} without defaults
        rendered = rendered.replace(/\{\{this\.([^\}]+?)\}\}/g, (m, field) => {
          const value = this._resolveNestedPath(field.trim(), item);
          return value !== undefined && value !== null ? String(value) : '';
        });

        // Finally, replace plain {{this}} with the whole item (if needed)
        rendered = rendered.replace(/\{\{this\}\}/g, () => {
          return typeof item === 'object' ? JSON.stringify(item) : String(item);
        });

        return rendered;
      }).join('');
    });
  }

  /**
   * Validate all required variables are present in context
   *
   * @private
   * @param {Array<string>} requiredVars - Variables required by template
   * @param {Object} context - Context object
   * @returns {Object} Result object {success: boolean, missingVars?: Array<string>}
   */
  _validateVariables(requiredVars, context) {
    const missingVars = requiredVars.filter(varName => {
      // Skip 'this' (used in {{#each}} blocks)
      if (varName === 'this') return false;

      // Handle nested paths (e.g., "worldState.npcs")
      if (varName.includes('.')) {
        const value = this._resolveNestedPath(varName, context);
        return value === undefined;
      }

      // Check if variable exists in context (even if falsy value like 0 or empty string)
      return !(varName in context);
    });

    if (missingVars.length > 0) {
      return {
        success: false,
        missingVars
      };
    }

    return { success: true };
  }

  /**
   * Check for unused context fields (possible typos in template)
   *
   * @private
   * @param {Array<string>} usedVars - Variables used in template
   * @param {Object} context - Context object
   */
  _checkUnusedFields(usedVars, context) {
    const contextKeys = Object.keys(context);
    const unusedKeys = contextKeys.filter(key => !usedVars.includes(key));

    if (unusedKeys.length > 0) {
      this.logger.debug(`[PromptTemplateEngine] Warning: Context has unused fields (possible typos): ${unusedKeys.join(', ')}`);
    }
  }

  /**
   * Load DM persona content (cached after first load)
   *
   * @private
   * @returns {Object} Result object {success: boolean, data?: string, error?: string}
   */
  _loadDMPersona() {
    try {
      // Return cached content if available
      if (this.dmPersonaCache !== null) {
        return { success: true, data: this.dmPersonaCache };
      }

      // Check if file exists
      if (!this.fs.existsSync(this.dmPersonaPath)) {
        return {
          success: false,
          error: `DM persona file not found: ${this.dmPersonaPath}`
        };
      }

      // Load file
      const content = this.fs.readFileSync(this.dmPersonaPath, 'utf-8');

      // Cache for subsequent renders
      this.dmPersonaCache = content;

      return { success: true, data: content };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load DM persona: ${error.message}`
      };
    }
  }

  /**
   * Load template file from disk (with caching)
   *
   * @private
   * @param {string} templateId - Template identifier (e.g., "location-initial-visit")
   * @returns {Object} Result object {success: boolean, data?: {frontmatter, content}, error?: string}
   */
  _loadTemplateFile(templateId) {
    try {
      // Check registered templates first
      if (this.registeredTemplates.has(templateId)) {
        return {
          success: true,
          data: this.registeredTemplates.get(templateId)
        };
      }

      // Check cache
      if (this.templateCache.has(templateId)) {
        return {
          success: true,
          data: this.templateCache.get(templateId)
        };
      }

      // Build file path
      const templatePath = this.path.join(this.templatesDir, `${templateId}.md`);

      // Check if file exists
      if (!this.fs.existsSync(templatePath)) {
        return {
          success: false,
          error: `Template file not found: ${templateId}.md`
        };
      }

      // Load file
      const fileContent = this.fs.readFileSync(templatePath, 'utf-8');

      // Parse YAML frontmatter
      const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
      const match = fileContent.match(frontmatterRegex);

      if (!match) {
        return {
          success: false,
          error: `Template ${templateId} missing YAML frontmatter`
        };
      }

      const frontmatterYaml = match[1];
      const templateContent = match[2];

      // Parse YAML
      let frontmatter;
      try {
        frontmatter = this.yaml.load(frontmatterYaml);
      } catch (yamlError) {
        return {
          success: false,
          error: `Failed to parse YAML frontmatter in ${templateId}: ${yamlError.message}`
        };
      }

      // Validate frontmatter fields
      if (!frontmatter.templateId || !frontmatter.priority || !frontmatter.tokenBudget) {
        return {
          success: false,
          error: `Template ${templateId} frontmatter missing required fields (templateId, priority, tokenBudget)`
        };
      }

      const templateData = {
        frontmatter,
        content: templateContent
      };

      // Cache for subsequent renders
      this.templateCache.set(templateId, templateData);

      return {
        success: true,
        data: templateData
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load template ${templateId}: ${error.message}`
      };
    }
  }

  /**
   * Register a custom template programmatically
   * Allows runtime registration of templates without file system
   *
   * @param {string} templateId - Unique template identifier
   * @param {string} templateContent - Full template content (YAML frontmatter + markdown)
   * @throws {Error} If template content is invalid or templateId already exists
   */
  registerTemplate(templateId, templateContent) {
    if (!templateId || typeof templateId !== 'string') {
      throw new Error('Template ID must be a non-empty string');
    }

    if (!templateContent || typeof templateContent !== 'string') {
      throw new Error('Template content must be a non-empty string');
    }

    // Check if already registered
    if (this.registeredTemplates.has(templateId)) {
      throw new Error(`Template ${templateId} is already registered`);
    }

    // Parse YAML frontmatter
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = templateContent.match(frontmatterRegex);

    if (!match) {
      throw new Error(`Template ${templateId} missing YAML frontmatter`);
    }

    const frontmatterYaml = match[1];
    const content = match[2];

    // Parse YAML
    let frontmatter;
    try {
      frontmatter = this.yaml.load(frontmatterYaml);
    } catch (yamlError) {
      throw new Error(`Failed to parse YAML frontmatter: ${yamlError.message}`);
    }

    // Validate frontmatter
    if (!frontmatter.templateId || !frontmatter.priority || !frontmatter.tokenBudget) {
      throw new Error('Template frontmatter missing required fields (templateId, priority, tokenBudget)');
    }

    // Register template
    this.registeredTemplates.set(templateId, {
      frontmatter,
      content
    });

    this.logger.debug(`[PromptTemplateEngine] Registered custom template: ${templateId}`);
  }

  /**
   * List all available templates (file-based + registered)
   *
   * @returns {Array<Object>} Array of {id, description, tokenBudget, priority}
   */
  listTemplates() {
    const templates = [];

    try {
      // Add file-based templates
      if (this.fs.existsSync(this.templatesDir)) {
        const files = this.fs.readdirSync(this.templatesDir);

        for (const file of files) {
          if (file.endsWith('.md')) {
            const templateId = file.replace('.md', '');
            const loadResult = this._loadTemplateFile(templateId);

            if (loadResult.success) {
              const { frontmatter } = loadResult.data;
              templates.push({
                id: templateId,
                description: frontmatter.description || templateId,
                tokenBudget: frontmatter.tokenBudget,
                priority: frontmatter.priority
              });
            }
          }
        }
      }

      // Add registered templates
      for (const [templateId, templateData] of this.registeredTemplates.entries()) {
        const { frontmatter } = templateData;
        templates.push({
          id: templateId,
          description: frontmatter.description || templateId,
          tokenBudget: frontmatter.tokenBudget,
          priority: frontmatter.priority
        });
      }

      return templates;
    } catch (error) {
      this.logger.error(`[PromptTemplateEngine] Error listing templates: ${error.message}`);
      return [];
    }
  }

  /**
   * Render a template with context variables
   * Main entry point for template rendering
   *
   * Pipeline:
   * 1. Load template file (with caching)
   * 2. Parse template to find required variables
   * 3. Validate all variables present in context
   * 4. Substitute variables (simple, nested, arrays)
   * 5. Load and prepend DM persona
   * 6. Estimate token count
   * 7. Validate token budget (soft limit, warn if >10% over)
   * 8. Return Result Object with prompt and tokenCount
   *
   * @param {string} templateId - Template identifier (e.g., "location-initial-visit")
   * @param {Object} context - Context object with values for template variables
   * @returns {Promise<Object>} Result object {success: boolean, data?: {prompt: string, tokenCount: number}, error?: string}
   */
  async renderTemplate(templateId, context) {
    try {
      // Validate inputs
      if (!templateId || typeof templateId !== 'string') {
        return {
          success: false,
          error: 'Template ID must be a non-empty string'
        };
      }

      if (!context || typeof context !== 'object') {
        return {
          success: false,
          error: 'Context must be a non-null object'
        };
      }

      // Step 1: Load template file
      const loadResult = this._loadTemplateFile(templateId);
      if (!loadResult.success) {
        return {
          success: false,
          error: loadResult.error
        };
      }

      const { frontmatter, content } = loadResult.data;

      // Step 2: Parse template to find required variables
      const requiredVars = this._parseTemplate(content);

      // Step 3: Validate all variables present in context
      const validationResult = this._validateVariables(requiredVars, context);
      if (!validationResult.success) {
        return {
          success: false,
          error: `Missing template variables: ${validationResult.missingVars.join(', ')}`
        };
      }

      // Check for unused context fields (advisory)
      this._checkUnusedFields(requiredVars, context);

      // Step 4: Substitute variables
      let rendered = content;

      // 4a: Substitute array iterations first ({{#each}}...{{/each}})
      rendered = this._substituteArrayIterations(rendered, context);

      // 4b: Handle top-level {{#if}} conditionals
      rendered = rendered.replace(/\{\{#if\s+([^\}]+?)\}\}([\s\S]*?)\{\{\/if\}\}/g, (m, varPath, content) => {
        const value = this._resolveNestedPath(varPath.trim(), context);
        return value ? content : '';
      });

      // 4c: Substitute simple and nested variables
      rendered = this._substituteSimpleVariables(rendered, context);

      // Step 5: Load and prepend DM persona
      const dmPersonaResult = this._loadDMPersona();
      if (!dmPersonaResult.success) {
        return {
          success: false,
          error: dmPersonaResult.error
        };
      }

      const dmPersona = dmPersonaResult.data;
      const fullPrompt = `${dmPersona}\n\n---\n\n${rendered}`;

      // Step 6: Estimate token count
      const tokenCount = this.estimateTokens(fullPrompt);

      // Step 7: Validate token budget (soft limit)
      const tokenBudget = frontmatter.tokenBudget;
      const overageThreshold = tokenBudget * 1.1; // 10% over budget

      if (tokenCount > overageThreshold) {
        const percentOver = ((tokenCount - tokenBudget) / tokenBudget * 100).toFixed(1);
        this.logger.debug(`[PromptTemplateEngine] Warning: Template ${templateId} exceeds token budget by ${percentOver}% (${tokenCount} tokens vs ${tokenBudget} budget)`);
      }

      // Step 8: Return Result Object
      return {
        success: true,
        data: {
          prompt: fullPrompt,
          tokenCount,
          templateId: frontmatter.templateId,
          priority: frontmatter.priority,
          tokenBudget: frontmatter.tokenBudget
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Template rendering failed: ${error.message}`
      };
    }
  }
}

module.exports = PromptTemplateEngine;
