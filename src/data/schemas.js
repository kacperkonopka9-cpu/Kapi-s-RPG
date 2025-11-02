/**
 * Data schemas for location system
 * Defines the structure of all data objects used by LocationLoader
 * Based on Epic 1 Technical Specification §4.3.1 - Data Models and Contracts
 */

/**
 * @typedef {Object} LocationData
 * Main data structure for a complete location
 *
 * @property {string} locationId - Unique identifier (folder name, e.g., "village-of-barovia")
 * @property {string} locationName - Display name (e.g., "Village of Barovia")
 * @property {string} description - Full text content from Description.md
 * @property {DescriptionVariants} descriptionVariants - Variant descriptions for different contexts
 * @property {NPCData[]} npcs - Array of NPCs present in this location
 * @property {ItemData[]} items - Array of items available or hidden in this location
 * @property {EventData[]} events - Array of events that can occur in this location
 * @property {LocationState} state - Current mutable state of the location
 * @property {LocationMetadata} metadata - Location metadata and configuration
 * @property {FilePaths} filePaths - Paths to source files for debugging
 */

/**
 * @typedef {Object} DescriptionVariants
 * Different narrative descriptions based on context
 *
 * @property {string} initial - Description for first visit (from ## Initial Description)
 * @property {string} return - Description for subsequent visits (from ## Return Description)
 * @property {string} morning - Morning time variant (from ### Morning)
 * @property {string} night - Night time variant (from ### Night)
 */

/**
 * @typedef {Object} NPCData
 * Data structure for a Non-Player Character
 *
 * @property {string} npcId - Unique identifier (generated from name, e.g., "ireena_kolyana")
 * @property {string} name - Full name (e.g., "Ireena Kolyana")
 * @property {string} type - Race/class (e.g., "Human Noble")
 * @property {number} age - Age in years
 * @property {string} gender - Gender
 * @property {string} currentLocation - Location ID where NPC currently is
 * @property {string} status - Current status (e.g., "Alive", "Dead", "Missing")
 * @property {string} attitudeTowardPlayer - Relationship status (e.g., "Neutral", "Friendly", "Hostile")
 * @property {string} questConnection - Associated quest (e.g., "Main Quest - Strahd's Obsession")
 * @property {string} description - Physical and personality description
 * @property {NPCDialogue} dialogue - Dialogue options for this NPC
 * @property {NPCStats} stats - Basic stats for combat/display
 * @property {string} aiBehaviorNotes - Guidelines for LLM when roleplaying this NPC
 */

/**
 * @typedef {Object} NPCDialogue
 * Dialogue options for an NPC
 *
 * @property {string} initialGreeting - First time meeting the player
 * @property {string} questHook - Quest-related dialogue
 * @property {Object} [other] - Additional dialogue options (Epic 5)
 */

/**
 * @typedef {Object} NPCStats
 * Basic combat/display stats for an NPC
 *
 * @property {number} ac - Armor Class
 * @property {number} hp - Hit Points
 * @property {number} [cr] - Challenge Rating (optional)
 */

/**
 * @typedef {Object} ItemData
 * Data structure for an item (Epic 1 uses simple structure)
 *
 * @property {string} itemId - Unique identifier (generated from name)
 * @property {string} name - Item name
 * @property {string} description - Item description
 * @property {string} [price] - Price if available for purchase
 * @property {string} [value] - Value if not for sale
 * @property {boolean} hidden - Whether item is hidden (requires Investigation)
 * @property {number} [dc] - Investigation DC for hidden items
 * @property {string} category - "available" or "hidden"
 */

/**
 * @typedef {Object} EventData
 * Data structure for a location event (minimal for Epic 1)
 *
 * @property {string} eventId - Unique identifier (generated from name)
 * @property {string} name - Event name
 * @property {string} type - Event type ("scheduled", "conditional", "recurring")
 * @property {string} trigger - What triggers the event
 * @property {string} [effect] - What happens when event triggers
 * @property {string} [consequence] - Lasting effects of the event
 */

/**
 * @typedef {Object} LocationState
 * Current mutable state of a location (from State.md)
 *
 * @property {string} locationId - Location this state belongs to
 * @property {string} lastUpdated - ISO timestamp of last update
 * @property {string} currentDate - In-game date (Epic 2)
 * @property {string} currentTime - In-game time (Epic 2)
 * @property {string} weather - Current weather
 * @property {string} locationStatus - Status (e.g., "Normal", "Damaged", "Destroyed")
 * @property {string[]} changesSinceLastVisit - List of changes since player last visited
 * @property {Object.<string, string>} npcPositions - Map of NPC ID to current sub-location
 * @property {string[]} activeQuests - List of active quest IDs
 * @property {Object} [customFlags] - Epic-specific state flags
 */

/**
 * @typedef {Object} LocationMetadata
 * Metadata and configuration for a location (from metadata.yaml)
 *
 * @property {string} location_name - Full location name
 * @property {string} location_type - Type (Settlement/Dungeon/Wilderness/Building/Room/Region)
 * @property {string} region - Parent region name
 * @property {number} [population] - Population count
 * @property {number} danger_level - Danger level (1-5)
 * @property {string} recommended_level - Recommended player level range
 * @property {string|null} parent_location - Parent location ID (null for top-level)
 * @property {string[]} sub_locations - Array of child location IDs
 * @property {string} location_level - Hierarchy level (region/settlement/building/room)
 * @property {ConnectedLocation[]} connected_locations - Peer locations for travel
 * @property {boolean} [fast_travel_available] - Whether fast travel is enabled
 * @property {boolean} [discovered] - Whether player has discovered this location
 * @property {string} [first_visit_date] - Date of first visit
 */

/**
 * @typedef {Object} ConnectedLocation
 * A connection to another location
 *
 * @property {string} name - Connected location name
 * @property {string} direction - Direction (e.g., "North", "South", "East", "West")
 * @property {string} travel_time - Travel time description (e.g., "2 hours", "1 day")
 */

/**
 * @typedef {Object} FilePaths
 * Source file paths for debugging
 *
 * @property {string} description - Path to Description.md
 * @property {string} npcs - Path to NPCs.md
 * @property {string} items - Path to Items.md
 * @property {string} events - Path to Events.md
 * @property {string} state - Path to State.md
 * @property {string} metadata - Path to metadata.yaml
 */

/**
 * @typedef {Object} ValidationResult
 * Result of location validation
 *
 * @property {string[]} errors - List of error messages
 * @property {string[]} warnings - List of warning messages
 * @property {string[]} success - List of successful checks
 * @property {boolean} isValid - True if no errors found
 */

/**
 * @typedef {Object} LLMPrompt
 * Structured prompt for LLM narrator with token-budgeted content
 * Based on Epic 1 Technical Specification §AC-3 - Context Builder Token Budget
 *
 * @property {string} systemPrompt - DM persona instructions and setting context (~400-500 tokens)
 * @property {string} contextDescription - Location description and state (Priority 1, always included)
 * @property {string} contextCharacter - Character information for the session (Priority 1, stub in Epic 1)
 * @property {string} contextRecentActions - Recent player actions for continuity (Priority 1)
 * @property {string} contextNPCs - NPC information (Priority 2, conditional on token budget)
 * @property {string} contextItems - Item information (Priority 2, conditional on token budget)
 * @property {PromptMetadata} metadata - Token counts and generation metadata
 */

/**
 * @typedef {Object} PromptMetadata
 * Metadata about prompt generation
 *
 * @property {number} estimatedTokens - Estimated total token count for the prompt
 * @property {number} systemPromptTokens - Tokens used by system prompt
 * @property {number} priority1Tokens - Tokens used by Priority 1 content
 * @property {number} priority2Tokens - Tokens used by Priority 2 content
 * @property {boolean} priority2Truncated - Whether Priority 2 content was truncated
 * @property {string} generatedAt - ISO timestamp of prompt generation
 */

/**
 * @typedef {Object} CharacterData
 * Player character data (stub for Epic 1, will be expanded in Epic 3)
 *
 * @property {string} characterId - Unique character identifier
 * @property {string} name - Character name
 * @property {number} level - Character level (1-20)
 * @property {string} class - Character class (stub: will support multiclass in Epic 3)
 * @property {string} race - Character race
 * @property {CharacterHP} hp - Hit points
 * @property {Object.<string, number>} [abilityScores] - STR, DEX, CON, INT, WIS, CHA (Epic 3)
 * @property {string[]} [equipment] - List of equipped items (Epic 3)
 * @property {Object} [spells] - Spell slots and known spells (Epic 3)
 */

/**
 * @typedef {Object} CharacterHP
 * Character hit points
 *
 * @property {number} current - Current HP
 * @property {number} max - Maximum HP
 * @property {number} [temp] - Temporary HP (Epic 3)
 */

/**
 * @typedef {Object} PlayerAction
 * Records a recent player action for context continuity
 *
 * @property {string} actionId - Unique identifier for this action
 * @property {string} timestamp - ISO timestamp when action occurred
 * @property {string} locationId - Location where action occurred
 * @property {string} description - What the player did
 * @property {string} [result] - Outcome of the action (optional)
 * @property {string} [narration] - LLM-generated narration for this action (optional)
 */

// Export types (for IDEs and documentation)
// In a TypeScript project, these would be actual exports
// For JavaScript, they serve as JSDoc documentation

module.exports = {
  // Note: In JavaScript, we export an empty object since these are type definitions
  // The actual types are used via JSDoc comments in other files
  // For TypeScript conversion, these would become actual type exports
};
