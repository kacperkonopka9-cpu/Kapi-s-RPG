/**
 * LocationLoader - Load and parse location data from file system
 * Implements Epic 1 LocationLoader API specification
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Required file names for location folders
const REQUIRED_FILES = [
  'Description.md',
  'NPCs.md',
  'Items.md',
  'Events.md',
  'State.md',
  'metadata.yaml'
];

// Valid location hierarchy levels
const VALID_LOCATION_LEVELS = ['region', 'settlement', 'building', 'room'];

/**
 * Custom error for location not found
 */
class LocationNotFoundError extends Error {
  constructor(locationId, basePath) {
    super(`Location not found: ${locationId} (searched in ${basePath})`);
    this.name = 'LocationNotFoundError';
    this.locationId = locationId;
    this.basePath = basePath;
  }
}

/**
 * Custom error for location parsing failures
 */
class LocationParseError extends Error {
  constructor(message, filePath, lineNumber = null) {
    const fullMessage = lineNumber
      ? `${message} in ${filePath} at line ${lineNumber}`
      : `${message} in ${filePath}`;
    super(fullMessage);
    this.name = 'LocationParseError';
    this.filePath = filePath;
    this.lineNumber = lineNumber;
  }
}

/**
 * LocationLoader class
 * Loads and parses location data from disk into structured objects
 */
class LocationLoader {
  /**
   * Create a new LocationLoader
   * @param {string} basePath - Base path to locations directory (default: game-data/locations)
   */
  constructor(basePath = null) {
    this.basePath = basePath || path.join(process.cwd(), 'game-data', 'locations');
    this.cache = new Map(); // In-memory cache for loaded locations
  }

  /**
   * Load complete location data from disk
   * @param {string} locationId - Location identifier (folder name)
   * @returns {Promise<LocationData>} Parsed location data
   * @throws {LocationNotFoundError} If location doesn't exist
   * @throws {LocationParseError} If files are malformed
   */
  async loadLocation(locationId) {
    // Check cache first
    if (this.cache.has(locationId)) {
      return this.cache.get(locationId);
    }

    const locationPath = path.join(this.basePath, locationId);

    // Verify location folder exists
    if (!fs.existsSync(locationPath)) {
      throw new LocationNotFoundError(locationId, this.basePath);
    }

    if (!fs.statSync(locationPath).isDirectory()) {
      throw new LocationNotFoundError(locationId, this.basePath);
    }

    // Build file paths
    const filePaths = {
      description: path.join(locationPath, 'Description.md'),
      npcs: path.join(locationPath, 'NPCs.md'),
      items: path.join(locationPath, 'Items.md'),
      events: path.join(locationPath, 'Events.md'),
      state: path.join(locationPath, 'State.md'),
      metadata: path.join(locationPath, 'metadata.yaml')
    };

    // Check all required files exist
    for (const [key, filePath] of Object.entries(filePaths)) {
      if (!fs.existsSync(filePath)) {
        throw new LocationParseError(
          `Missing required file: ${path.basename(filePath)}`,
          locationPath
        );
      }
    }

    try {
      // Parse all files
      const description = this.parseDescriptionFile(filePaths.description);
      const npcs = this.parseNPCsFile(filePaths.npcs);
      const items = this.parseItemsFile(filePaths.items);
      const events = this.parseEventsFile(filePaths.events);
      const state = this.parseStateFile(filePaths.state);
      const metadata = this.parseMetadataFile(filePaths.metadata);

      // Assemble LocationData object
      const locationData = {
        locationId,
        locationName: metadata.location_name,
        description: description.full,
        descriptionVariants: description.variants,
        npcs,
        items,
        events,
        state,
        metadata,
        filePaths
      };

      // Cache the result
      this.cache.set(locationId, locationData);

      return locationData;
    } catch (error) {
      if (error instanceof LocationParseError) {
        throw error;
      }
      throw new LocationParseError(
        `Failed to parse location: ${error.message}`,
        locationPath
      );
    }
  }

  /**
   * Parse Description.md file
   * @param {string} filePath - Path to Description.md
   * @returns {Object} Parsed description with full text and variants
   */
  parseDescriptionFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract sections using markdown headers
    const sections = this.extractMarkdownSections(content);

    return {
      full: content,
      variants: {
        initial: sections['Initial Description'] || '',
        return: sections['Return Description'] || '',
        morning: sections['Morning'] || '',
        night: sections['Night'] || ''
      }
    };
  }

  /**
   * Parse NPCs.md file
   * @param {string} filePath - Path to NPCs.md
   * @returns {NPCData[]} Array of NPC data objects
   */
  parseNPCsFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const npcs = [];

    // Split by ## headers to get individual NPCs
    const npcSections = content.split(/^## /gm).filter(s => s.trim());

    for (const section of npcSections) {
      const lines = section.split('\n');
      const name = lines[0].trim();

      if (!name || name.startsWith('#')) continue;

      // Parse NPC fields from markdown
      const npc = {
        npcId: this.generateId(name),
        name,
        type: this.extractField(section, 'Type'),
        age: parseInt(this.extractField(section, 'Age')) || 0,
        gender: this.extractField(section, 'Gender') || '',
        currentLocation: this.extractField(section, 'Location') || '',
        status: this.extractField(section, 'Status') || 'Unknown',
        attitudeTowardPlayer: this.extractField(section, 'Relationship') || 'Neutral',
        questConnection: this.extractField(section, 'Quest Connection') || '',
        description: this.extractSubsection(section, 'Description') || '',
        dialogue: {
          initialGreeting: this.extractField(section, 'Initial Greeting') || '',
          questHook: this.extractField(section, 'Quest Hook') || ''
        },
        stats: {
          ac: parseInt(this.extractField(section, 'AC')) || 10,
          hp: parseInt(this.extractField(section, 'HP')) || 10,
          cr: parseFloat(this.extractField(section, 'CR')) || 0
        },
        aiBehaviorNotes: this.extractSubsection(section, 'AI Behavior Notes') || ''
      };

      npcs.push(npc);
    }

    return npcs;
  }

  /**
   * Parse Items.md file
   * @param {string} filePath - Path to Items.md
   * @returns {ItemData[]} Array of item data objects
   */
  parseItemsFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const items = [];

    const sections = this.extractMarkdownSections(content);

    // Parse Available Items
    const availableSection = sections['Available Items'] || '';
    const availableItems = this.parseItemList(availableSection, 'available');
    items.push(...availableItems);

    // Parse Hidden Items
    const hiddenSection = sections['Hidden Items (Requires Investigation)'] ||
                         sections['Hidden Items'] || '';
    const hiddenItems = this.parseItemList(hiddenSection, 'hidden');
    items.push(...hiddenItems);

    return items;
  }

  /**
   * Parse a list of items from markdown content
   * @param {string} content - Markdown content with item list
   * @param {string} category - "available" or "hidden"
   * @returns {ItemData[]} Array of parsed items
   */
  parseItemList(content, category) {
    const items = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Match bullet points with item names
      const match = line.match(/^[-*]\s+\*\*(.+?)\*\*:?\s*(.*)/);
      if (match) {
        let name = match[1];
        // Remove trailing colon if present
        name = name.replace(/:$/, '').trim();
        const details = match[2];

        const item = {
          itemId: this.generateId(name),
          name,
          description: details || '',
          category,
          hidden: category === 'hidden'
        };

        // Extract price/value
        const priceMatch = details.match(/(\d+\s*[gsp]p)/i);
        if (priceMatch) {
          if (category === 'available') {
            item.price = priceMatch[1];
          } else {
            item.value = priceMatch[1];
          }
        }

        // Extract DC for hidden items
        if (category === 'hidden') {
          const dcMatch = details.match(/DC\s*(\d+)/i);
          if (dcMatch) {
            item.dc = parseInt(dcMatch[1]);
          }
        }

        items.push(item);
      }
    }

    return items;
  }

  /**
   * Parse Events.md file
   * @param {string} filePath - Path to Events.md
   * @returns {EventData[]} Array of event data objects
   */
  parseEventsFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const events = [];

    // Parse directly from content, looking for event type sections
    // Use \n## to match ## only at start of line (not in ### headers)
    const scheduledMatch = content.match(/## Scheduled Events\s*\n([\s\S]*?)(?=\n## |$)/);
    const conditionalMatch = content.match(/## Conditional Events\s*\n([\s\S]*?)(?=\n## |$)/);
    const recurringMatch = content.match(/## Recurring Events\s*\n([\s\S]*?)(?=\n## |$)/);

    if (scheduledMatch) {
      const scheduled = this.parseEventSection(scheduledMatch[1], 'scheduled');
      events.push(...scheduled);
    }

    if (conditionalMatch) {
      const conditional = this.parseEventSection(conditionalMatch[1], 'conditional');
      events.push(...conditional);
    }

    if (recurringMatch) {
      const recurring = this.parseRecurringEvents(recurringMatch[1]);
      events.push(...recurring);
    }

    return events;
  }

  /**
   * Parse an event section (for scheduled/conditional events with ### headers)
   * @param {string} content - Event section content
   * @param {string} type - Event type (scheduled/conditional/recurring)
   * @returns {EventData[]} Array of parsed events
   */
  parseEventSection(content, type) {
    const events = [];

    // Split by ### headers to get individual events
    const eventSections = content.split(/^### /gm).filter(s => s.trim());

    for (const section of eventSections) {
      const lines = section.split('\n');
      const name = lines[0].trim();

      if (!name) continue;

      const event = {
        eventId: this.generateId(name),
        name,
        type,
        trigger: this.extractField(section, 'Trigger') || '',
        effect: this.extractField(section, 'Effect') || '',
        consequence: this.extractField(section, 'Consequence') || ''
      };

      events.push(event);
    }

    return events;
  }

  /**
   * Parse recurring events section (supports both ### header and bullet point formats)
   * @param {string} content - Recurring events section content
   * @returns {EventData[]} Array of parsed recurring events
   */
  parseRecurringEvents(content) {
    // First, try parsing as ### headers (for structured format)
    const headerEvents = this.parseEventSection(content, 'recurring');

    if (headerEvents.length > 0) {
      return headerEvents;
    }

    // If no ### headers found, try bullet point format
    const events = [];
    const bulletRegex = /^-\s+\*\*(.+?):\*\*\s+(.+)$/gm;
    let match;

    while ((match = bulletRegex.exec(content)) !== null) {
      const name = match[1].trim();
      const description = match[2].trim();

      const event = {
        eventId: this.generateId(name),
        name,
        type: 'recurring',
        trigger: description, // For recurring events, the description serves as the trigger
        effect: '',
        consequence: ''
      };

      events.push(event);
    }

    return events;
  }

  /**
   * Parse State.md file
   * Handles both YAML frontmatter (from StateManager - Story 1.10) and legacy markdown sections
   * @param {string} filePath - Path to State.md
   * @returns {LocationState} Location state object
   */
  parseStateFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');

    try {
      let yamlState = null;
      let narrativeContent = content;

      // Check for YAML frontmatter (Story 1.10 - StateManager format)
      if (content.startsWith('---\n') || content.startsWith('---\r\n')) {
        const lines = content.split('\n');
        let endIndex = -1;

        // Find the end of frontmatter
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim() === '---') {
            endIndex = i;
            break;
          }
        }

        if (endIndex !== -1) {
          // Extract YAML content
          const yamlContent = lines.slice(1, endIndex).join('\n');
          narrativeContent = lines.slice(endIndex + 1).join('\n');

          try {
            // Parse YAML frontmatter
            yamlState = yaml.load(yamlContent, { schema: yaml.SAFE_SCHEMA });
          } catch (yamlError) {
            console.warn(`Warning: Failed to parse YAML frontmatter in State.md: ${yamlError.message}`);
          }
        }
      }

      // Parse narrative sections (backward compatibility)
      const sections = this.extractMarkdownSections(narrativeContent);

      // Build state object, preferring YAML frontmatter if available
      const state = {
        locationId: '',
        lastUpdated: (yamlState?.last_updated) || sections['Last Updated']?.trim() || new Date().toISOString(),
        currentDate: sections['Current Date']?.trim() || '',
        currentTime: sections['Current Time']?.trim() || '',
        weather: sections['Weather']?.trim() || '',
        locationStatus: sections['Location Status']?.trim() || 'Normal',
        changesSinceLastVisit: this.extractList(sections['Changes Since Last Visit'] || ''),
        npcPositions: this.parseNPCPositions(sections['NPC Positions'] || ''),
        activeQuests: this.extractList(sections['Active Quests'] || ''),

        // Add YAML frontmatter fields if available (Story 1.10 - StateManager integration)
        visited: yamlState?.visited || false,
        discovered_items: yamlState?.discovered_items || [],
        completed_events: yamlState?.completed_events || [],
        npc_states: yamlState?.npc_states || {},
        custom_state: yamlState?.custom_state || {}
      };

      return state;
    } catch (error) {
      throw new LocationParseError(
        `Failed to parse State.md: ${error.message}`,
        filePath
      );
    }
  }

  /**
   * Parse metadata.yaml file
   * @param {string} filePath - Path to metadata.yaml
   * @returns {LocationMetadata} Location metadata object
   */
  parseMetadataFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');

    try {
      const metadata = yaml.load(content);

      if (!metadata || typeof metadata !== 'object') {
        throw new Error('Invalid YAML structure');
      }

      // Validate location_level
      if (metadata.location_level && !VALID_LOCATION_LEVELS.includes(metadata.location_level)) {
        throw new LocationParseError(
          `Invalid location_level "${metadata.location_level}". Must be one of: ${VALID_LOCATION_LEVELS.join(', ')}`,
          filePath
        );
      }

      return metadata;
    } catch (error) {
      throw new LocationParseError(
        `Failed to parse metadata.yaml: ${error.message}`,
        filePath
      );
    }
  }

  /**
   * Validate location folder structure
   * @param {string} locationId - Location to validate
   * @returns {Promise<ValidationResult>} Validation result
   */
  async validateLocation(locationId) {
    const locationPath = path.join(this.basePath, locationId);
    const result = {
      errors: [],
      warnings: [],
      success: [],
      isValid: function() { return this.errors.length === 0; }
    };

    // Check folder exists
    if (!fs.existsSync(locationPath)) {
      result.errors.push(`Location folder not found: ${locationId}`);
      return result;
    }

    if (!fs.statSync(locationPath).isDirectory()) {
      result.errors.push(`Path is not a directory: ${locationId}`);
      return result;
    }

    result.success.push(`Location folder exists: ${locationId}`);

    // Check all required files
    for (const filename of REQUIRED_FILES) {
      const filePath = path.join(locationPath, filename);

      if (!fs.existsSync(filePath)) {
        result.errors.push(`Missing required file: ${filename}`);
      } else {
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
          result.errors.push(`File is empty: ${filename}`);
        } else {
          result.success.push(`File exists and is non-empty: ${filename}`);
        }
      }
    }

    // Try to parse metadata
    try {
      const metadataPath = path.join(locationPath, 'metadata.yaml');
      if (fs.existsSync(metadataPath)) {
        const content = fs.readFileSync(metadataPath, 'utf-8');
        const metadata = yaml.load(content);

        result.success.push('metadata.yaml is valid YAML');

        // Check hierarchy fields
        if (metadata.location_level) {
          if (VALID_LOCATION_LEVELS.includes(metadata.location_level)) {
            result.success.push(`location_level "${metadata.location_level}" is valid`);
          } else {
            result.errors.push(`Invalid location_level: ${metadata.location_level}`);
          }
        }

        if ('parent_location' in metadata) {
          if (metadata.parent_location === null) {
            result.success.push('parent_location is null (valid for top-level)');
          } else {
            result.success.push(`parent_location is set: "${metadata.parent_location}"`);
          }
        }

        if ('sub_locations' in metadata && Array.isArray(metadata.sub_locations)) {
          result.success.push(`sub_locations is array with ${metadata.sub_locations.length} entries`);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to parse metadata.yaml: ${error.message}`);
    }

    return result;
  }

  /**
   * Get all available location IDs
   * @returns {Promise<Array<string>>} List of valid location IDs
   */
  async listLocations() {
    if (!fs.existsSync(this.basePath)) {
      return [];
    }

    const entries = fs.readdirSync(this.basePath, { withFileTypes: true });
    const locationIds = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Check if it has required files (basic validation)
        const locationPath = path.join(this.basePath, entry.name);
        const hasAllFiles = REQUIRED_FILES.every(filename =>
          fs.existsSync(path.join(locationPath, filename))
        );

        if (hasAllFiles) {
          locationIds.push(entry.name);
        }
      }
    }

    return locationIds;
  }

  /**
   * Reload location from disk (invalidate cache)
   * @param {string} locationId - Location to reload
   * @returns {Promise<LocationData>} Freshly loaded location data
   */
  async reloadLocation(locationId) {
    // Remove from cache
    this.cache.delete(locationId);

    // Load fresh from disk
    return this.loadLocation(locationId);
  }

  // === Helper methods ===

  /**
   * Extract markdown sections by headers
   * @param {string} content - Markdown content
   * @returns {Object} Map of section names to content
   */
  extractMarkdownSections(content) {
    const sections = {};
    const lines = content.split('\n');
    let currentSection = null;
    let currentContent = [];

    for (const line of lines) {
      // Check for ## or ### headers
      const h2Match = line.match(/^##\s+(.+)$/);
      const h3Match = line.match(/^###\s+(.+)$/);

      if (h2Match || h3Match) {
        // Save previous section
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }

        // Start new section
        currentSection = (h2Match || h3Match)[1];
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
  }

  /**
   * Extract a field value from content (e.g., "- **Type:** Human")
   * @param {string} content - Content to search
   * @param {string} fieldName - Field name to extract
   * @returns {string} Field value or empty string
   */
  extractField(content, fieldName) {
    const regex = new RegExp(`[-*]\\s*\\*\\*${fieldName}:?\\*\\*:?\\s*(.+)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * Extract a subsection content (after ### header)
   * @param {string} content - Content to search
   * @param {string} subsectionName - Subsection name
   * @returns {string} Subsection content
   */
  extractSubsection(content, subsectionName) {
    const regex = new RegExp(`###\\s+${subsectionName}\\s*\\n([\\s\\S]*?)(?=###|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * Extract a list of items from markdown content
   * @param {string} content - Content with bullet points
   * @returns {Array<string>} Array of list items
   */
  extractList(content) {
    const items = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const match = line.match(/^[-*]\s+(.+)/);
      if (match) {
        items.push(match[1].trim());
      }
    }

    return items;
  }

  /**
   * Parse NPC positions from content
   * @param {string} content - NPC positions content
   * @returns {Object} Map of NPC ID to location
   */
  parseNPCPositions(content) {
    const positions = {};
    const lines = content.split('\n');

    for (const line of lines) {
      // Try bold format first: "- **Full Name:** Location description"
      let match = line.match(/^[-*]\s+\*\*(.+?):\*\*\s*(.+)/);
      if (match) {
        const fullName = match[1].trim();
        const npcId = this.generateId(fullName);
        positions[npcId] = match[2].trim();
        continue;
      }

      // Fall back to simple format: "- npcId: location"
      match = line.match(/^[-*]\s+(\w+):\s*(.+)/);
      if (match) {
        positions[match[1]] = match[2].trim();
      }
    }

    return positions;
  }

  /**
   * Generate a lowercase-kebab-case ID from a name
   * @param {string} name - Name to convert
   * @returns {string} Generated ID
   */
  generateId(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}

// Export classes
module.exports = {
  LocationLoader,
  LocationNotFoundError,
  LocationParseError
};
