/**
 * PriorityResolver - Classify and filter context elements by priority and relevance
 * Epic 5 Story 5.1: Intelligent Context Loader
 *
 * Implements 3-priority classification system:
 * - P1 (Always Load): Character, location Description+State, calendar
 * - P2 (Conditional): NPCs in current+adjacent locations, events next 7 days, active quests
 * - P3 (Deferred): Full events, distant NPCs, completed quests
 */

const { addDays, parseISO, isAfter, isBefore, isEqual } = require('date-fns');

/**
 * Priority Resolver class
 * Filters and classifies context elements by priority and relevance
 */
class PriorityResolver {
  /**
   * Create a new PriorityResolver
   * @param {Object} deps - Dependency injection
   * @param {Object} deps.dateFns - date-fns module (for testing)
   */
  constructor(deps = {}) {
    this.dateFns = deps.dateFns || { addDays, parseISO, isAfter, isBefore, isEqual };
  }

  /**
   * Filter NPCs by proximity to current location
   * Includes NPCs in current location + adjacent locations (1 connection distance)
   * @param {Array<object>} npcs - All NPCs
   * @param {string} currentLocationId - Current location ID
   * @param {Array<string>} adjacentLocations - Array of adjacent location IDs
   * @returns {Array<object>} Filtered NPCs with relevance scores
   */
  filterRelevantNPCs(npcs, currentLocationId, adjacentLocations = []) {
    if (!npcs || !Array.isArray(npcs)) {
      return [];
    }

    const relevantNPCs = npcs.filter(npc => {
      // Include NPCs in current location
      if (npc.locationId === currentLocationId) {
        npc.relevanceScore = 10; // Highest priority
        return true;
      }

      // Include NPCs in adjacent locations
      if (adjacentLocations.includes(npc.locationId)) {
        npc.relevanceScore = 5; // Medium priority
        return true;
      }

      // Exclude distant NPCs
      return false;
    });

    // Sort by relevance score (highest first)
    relevantNPCs.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    return relevantNPCs;
  }

  /**
   * Filter events by time window (next 7 days from current date)
   * @param {Array<object>} events - All events
   * @param {string} currentDate - Current in-game date (format: YYYY-MM-DD or 'YYY-MM-DD')
   * @returns {Array<object>} Filtered events within next 7 days
   */
  filterRelevantEvents(events, currentDate) {
    if (!events || !Array.isArray(events)) {
      return [];
    }

    if (!currentDate) {
      console.warn('No current date provided for event filtering');
      return [];
    }

    try {
      // Parse current date (handle both standard YYYY-MM-DD and game format YYY-MM-DD)
      let parsedCurrentDate;
      if (currentDate.match(/^\d{3}-\d{2}-\d{1,2}$/)) {
        // Game format (e.g., '735-10-1')
        const [year, month, day] = currentDate.split('-');
        parsedCurrentDate = new Date(parseInt(year) + 1000, parseInt(month) - 1, parseInt(day));
      } else {
        // Standard format (e.g., '2024-10-01')
        parsedCurrentDate = this.dateFns.parseISO(currentDate);
      }

      // Calculate 7 days from now
      const sevenDaysLater = this.dateFns.addDays(parsedCurrentDate, 7);

      const relevantEvents = events.filter(event => {
        // Skip events without trigger dates
        if (!event.trigger_date && !event.trigger_time) {
          return false;
        }

        // Parse event trigger date
        const triggerDateStr = event.trigger_date || event.trigger_time;
        let eventDate;

        if (triggerDateStr.match(/^\d{3}-\d{2}-\d{1,2}$/)) {
          // Game format
          const [year, month, day] = triggerDateStr.split('-');
          eventDate = new Date(parseInt(year) + 1000, parseInt(month) - 1, parseInt(day));
        } else {
          // Standard format
          eventDate = this.dateFns.parseISO(triggerDateStr);
        }

        // Include events in the next 7 days (including today)
        const isInFuture = this.dateFns.isAfter(eventDate, parsedCurrentDate) ||
                          this.dateFns.isEqual(eventDate, parsedCurrentDate);
        const isWithinWindow = this.dateFns.isBefore(eventDate, sevenDaysLater) ||
                              this.dateFns.isEqual(eventDate, sevenDaysLater);

        if (isInFuture && isWithinWindow) {
          // Calculate days until event
          const daysUntil = Math.floor((eventDate - parsedCurrentDate) / (1000 * 60 * 60 * 24));
          event.daysUntil = daysUntil;
          event.relevanceScore = 10 - daysUntil; // Sooner events = higher score
          return true;
        }

        return false;
      });

      // Sort by relevance (soonest first)
      relevantEvents.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

      return relevantEvents;

    } catch (error) {
      console.error(`Event filtering error: ${error.message}`);
      return [];
    }
  }

  /**
   * Classify entity priority (P1, P2, or P3)
   * @param {object} entity - Entity to classify
   * @param {string} entityType - Type of entity ('character', 'location', 'npc', 'event', 'quest')
   * @param {object} context - Context for classification (current location, date, etc.)
   * @returns {string} Priority level ('P1', 'P2', or 'P3')
   */
  classifyPriority(entity, entityType, context = {}) {
    switch (entityType) {
      case 'character':
      case 'location':
      case 'calendar':
        return 'P1'; // Always load

      case 'npc':
        // P2 if in current or adjacent location, P3 otherwise
        if (entity.locationId === context.currentLocationId) {
          return 'P2';
        }
        if (context.adjacentLocations && context.adjacentLocations.includes(entity.locationId)) {
          return 'P2';
        }
        return 'P3';

      case 'event':
        // P2 if within next 7 days, P3 otherwise
        if (entity.daysUntil !== undefined && entity.daysUntil >= 0 && entity.daysUntil <= 7) {
          return 'P2';
        }
        return 'P3';

      case 'quest':
        // P2 if active, P3 if completed
        if (entity.status === 'active' || entity.status === 'in-progress') {
          return 'P2';
        }
        return 'P3';

      default:
        return 'P3'; // Unknown entity types default to lowest priority
    }
  }
}

module.exports = PriorityResolver;
