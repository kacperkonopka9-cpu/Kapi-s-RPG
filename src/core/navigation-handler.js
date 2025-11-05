/**
 * NavigationHandler - Handle location traversal and validation
 * Story 1.6: Location Navigation
 *
 * Validates travel between locations by checking metadata.yaml connectivity
 * Replaces stub implementation from Story 1.4
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * @typedef {Object} NavigationResult
 * @property {boolean} success - Whether navigation was successful
 * @property {string|null} error - Error message if navigation failed
 * @property {string|null} targetLocationId - Target location ID if successful
 * @property {number} [durationMs] - Time taken for validation (performance tracking)
 * @property {Array<ConnectedLocation>} [availableExits] - List of available exits (if travel failed)
 */

/**
 * @typedef {Object} ConnectedLocation
 * @property {string} locationId - Location folder name
 * @property {string} displayName - Human-readable location name
 * @property {string} description - Brief description of location
 * @property {string|null} [direction] - Optional compass direction
 * @property {string|null} [exitDescription] - Optional exit path description
 */

/**
 * NavigationHandler class
 * Handles location connectivity validation and travel
 */
class NavigationHandler {
  /**
   * Create a new NavigationHandler
   * @param {string} [basePath] - Base path to locations directory (default: game-data/locations)
   */
  constructor(basePath = null) {
    this.basePath = basePath || path.join(process.cwd(), 'game-data', 'locations');
  }

  /**
   * Validate and execute travel between locations
   * Performance target: < 100ms
   *
   * @param {string} targetLocationId - Destination location
   * @param {string} currentLocationId - Current location
   * @returns {NavigationResult} Result of navigation attempt
   *
   * @example
   * const result = navigationHandler.travel('tser-pool', 'village-of-barovia');
   * if (result.success) {
   *   console.log(`Traveling to ${result.targetLocationId}`);
   * } else {
   *   console.error(result.error);
   *   console.log('Available exits:', result.availableExits);
   * }
   */
  travel(targetLocationId, currentLocationId) {
    const startTime = performance.now();

    try {
      // Step 1: Validate target location exists
      const targetPath = path.join(this.basePath, targetLocationId);
      if (!fs.existsSync(targetPath)) {
        const durationMs = performance.now() - startTime;
        return {
          success: false,
          error: `Location "${targetLocationId}" does not exist`,
          targetLocationId: null,
          durationMs
        };
      }

      // Step 2: Load current location metadata
      const currentMetadataPath = path.join(this.basePath, currentLocationId, 'metadata.yaml');

      // AC-22: Graceful fallback if metadata missing
      if (!fs.existsSync(currentMetadataPath)) {
        const durationMs = performance.now() - startTime;
        console.warn(`[NavigationHandler] metadata.yaml missing for ${currentLocationId}. Allowing travel (graceful fallback).`);
        return {
          success: true,
          error: null,
          targetLocationId,
          durationMs
        };
      }

      // Step 3: Parse metadata and check connectivity
      let metadata;
      try {
        const metadataContent = fs.readFileSync(currentMetadataPath, 'utf8');
        metadata = yaml.load(metadataContent);
      } catch (error) {
        // AC-21: Handle corrupted metadata
        const durationMs = performance.now() - startTime;
        console.warn(`[NavigationHandler] Failed to parse metadata.yaml for ${currentLocationId}: ${error.message}. Allowing travel (graceful fallback).`);
        return {
          success: true,
          error: null,
          targetLocationId,
          durationMs
        };
      }

      // Extract connected_locations (handle both formats)
      const connectedLocations = this._parseConnectedLocations(metadata);

      // Step 4: Check if target is connected
      // AC-22: If no connected_locations specified, allow travel (empty array = no restrictions)
      if (connectedLocations.length === 0) {
        const durationMs = performance.now() - startTime;
        console.warn(`[NavigationHandler] No connected_locations specified for ${currentLocationId}. Allowing travel (permissive fallback).`);
        return {
          success: true,
          error: null,
          targetLocationId,
          durationMs
        };
      }

      const isConnected = connectedLocations.some(loc =>
        typeof loc === 'string' ? loc === targetLocationId : loc.name === targetLocationId
      );

      if (!isConnected) {
        // AC-16: Display error with available exits
        const durationMs = performance.now() - startTime;
        const availableExits = this._formatAvailableExits(connectedLocations);
        const exitsList = availableExits.map(exit => exit.displayName || exit.locationId).join(', ');

        return {
          success: false,
          error: `You cannot travel to "${targetLocationId}" from "${currentLocationId}". Available exits: ${exitsList}`,
          targetLocationId: null,
          durationMs,
          availableExits
        };
      }

      // Step 5: Success - travel allowed
      const durationMs = performance.now() - startTime;

      // AC-23: Performance monitoring
      if (durationMs > 100) {
        console.warn(`[Performance] travel() took ${durationMs.toFixed(2)}ms (>100ms target)`);
      }

      return {
        success: true,
        error: null,
        targetLocationId,
        durationMs
      };

    } catch (error) {
      const durationMs = performance.now() - startTime;
      console.error(`[NavigationHandler] Unexpected error in travel(): ${error.message}`);

      // Return error result
      return {
        success: false,
        error: `Navigation error: ${error.message}`,
        targetLocationId: null,
        durationMs
      };
    }
  }

  /**
   * Get connected locations from current position
   * Performance target: < 50ms
   *
   * @param {string} locationId - Current location
   * @returns {Promise<Array<ConnectedLocation>>} Available destinations sorted by displayName
   *
   * @example
   * const exits = await navigationHandler.getConnectedLocations('village-of-barovia');
   * console.log('You can travel to:', exits.map(e => e.displayName).join(', '));
   */
  async getConnectedLocations(locationId) {
    const startTime = performance.now();

    try {
      // Load metadata
      const metadataPath = path.join(this.basePath, locationId, 'metadata.yaml');

      if (!fs.existsSync(metadataPath)) {
        // AC-17: Return empty array if metadata missing
        console.warn(`[NavigationHandler] metadata.yaml missing for ${locationId}. Returning empty exits.`);
        return [];
      }

      const metadataContent = fs.readFileSync(metadataPath, 'utf8');
      const metadata = yaml.load(metadataContent);

      const connectedLocations = this._parseConnectedLocations(metadata);

      if (connectedLocations.length === 0) {
        return [];
      }

      // Build ConnectedLocation objects with display info
      const results = [];

      for (const connection of connectedLocations) {
        let locationData;

        // Handle both formats
        if (typeof connection === 'string') {
          locationData = {
            locationId: connection,
            direction: null,
            exitDescription: null
          };
        } else {
          locationData = {
            locationId: connection.name,
            direction: connection.direction || null,
            exitDescription: connection.travel_time ? `Travel time: ${connection.travel_time}` : null
          };
        }

        // Load target location metadata to get displayName and description
        const targetMetadataPath = path.join(this.basePath, locationData.locationId, 'metadata.yaml');

        if (fs.existsSync(targetMetadataPath)) {
          try {
            const targetMetadata = yaml.load(fs.readFileSync(targetMetadataPath, 'utf8'));
            results.push({
              locationId: locationData.locationId,
              displayName: targetMetadata.location_name || locationData.locationId,
              description: targetMetadata.description || '',
              direction: locationData.direction,
              exitDescription: locationData.exitDescription
            });
          } catch (error) {
            // Skip if target metadata is corrupted
            console.warn(`[NavigationHandler] Failed to load metadata for ${locationData.locationId}: ${error.message}`);
          }
        } else {
          // Use location ID as display name if metadata missing
          results.push({
            locationId: locationData.locationId,
            displayName: locationData.locationId,
            description: '',
            direction: locationData.direction,
            exitDescription: locationData.exitDescription
          });
        }
      }

      // AC-17: Sort alphabetically by displayName
      results.sort((a, b) => a.displayName.localeCompare(b.displayName));

      const durationMs = performance.now() - startTime;

      // AC-23: Performance monitoring
      if (durationMs > 50) {
        console.warn(`[Performance] getConnectedLocations() took ${durationMs.toFixed(2)}ms (>50ms target)`);
      }

      return results;

    } catch (error) {
      console.error(`[NavigationHandler] Error in getConnectedLocations(): ${error.message}`);
      return [];
    }
  }

  /**
   * Validate if travel is possible between two locations
   * Helper method for checking connectivity
   *
   * @param {string} from - Current location
   * @param {string} to - Target location
   * @returns {Promise<boolean>} True if travel allowed
   *
   * @example
   * const allowed = await navigationHandler.canTravel('village-of-barovia', 'tser-pool');
   * if (allowed) {
   *   // Execute travel
   * }
   */
  async canTravel(from, to) {
    try {
      const result = this.travel(to, from);
      return result.success;
    } catch (error) {
      console.error(`[NavigationHandler] Error in canTravel(): ${error.message}`);
      return false;
    }
  }

  /**
   * Parse connected_locations from metadata
   * Handles both formats: string array OR object array
   *
   * @private
   * @param {Object} metadata - Parsed metadata.yaml
   * @returns {Array<string|Object>} Connected locations
   */
  _parseConnectedLocations(metadata) {
    if (!metadata || !metadata.connected_locations) {
      return [];
    }

    const connected = metadata.connected_locations;

    // Validate it's an array
    if (!Array.isArray(connected)) {
      console.warn('[NavigationHandler] connected_locations is not an array');
      return [];
    }

    return connected;
  }

  /**
   * Format available exits for error messages
   *
   * @private
   * @param {Array<string|Object>} connectedLocations - Connected locations
   * @returns {Array<ConnectedLocation>} Formatted exit info
   */
  _formatAvailableExits(connectedLocations) {
    return connectedLocations.map(connection => {
      if (typeof connection === 'string') {
        return {
          locationId: connection,
          displayName: connection,
          description: '',
          direction: null,
          exitDescription: null
        };
      } else {
        return {
          locationId: connection.name,
          displayName: connection.name,
          description: '',
          direction: connection.direction || null,
          exitDescription: connection.travel_time ? `Travel time: ${connection.travel_time}` : null
        };
      }
    });
  }
}

module.exports = { NavigationHandler };
