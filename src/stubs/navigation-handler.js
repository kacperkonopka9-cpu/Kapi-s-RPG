/**
 * NavigationHandler Stub
 * Temporary implementation until Story 1.6 (Location Navigation)
 * Provides basic location connectivity validation
 */

const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

/**
 * @typedef {Object} NavigationResult
 * @property {boolean} success - Whether navigation was successful
 * @property {string|null} error - Error message if navigation failed
 * @property {string|null} targetLocationId - Target location ID if successful
 */

/**
 * NavigationHandler stub class
 * TODO: Replace with real implementation in Story 1.6
 */
class NavigationHandler {
  constructor(locationsBasePath = null) {
    this.basePath = locationsBasePath || path.join(process.cwd(), 'game-data', 'locations');
  }

  /**
   * Validate and execute travel between locations
   * @param {string} targetLocationId - Destination location
   * @param {string} currentLocationId - Current location
   * @returns {NavigationResult} Result of navigation attempt
   */
  travel(targetLocationId, currentLocationId) {
    // Validate target location exists
    const targetPath = path.join(this.basePath, targetLocationId);
    if (!fs.existsSync(targetPath)) {
      return {
        success: false,
        error: `Location "${targetLocationId}" does not exist`,
        targetLocationId: null
      };
    }

    // Load current location metadata to check connections
    const currentMetadataPath = path.join(this.basePath, currentLocationId, 'metadata.yaml');

    if (!fs.existsSync(currentMetadataPath)) {
      // If metadata doesn't exist, allow travel (permissive stub behavior)
      return {
        success: true,
        error: null,
        targetLocationId
      };
    }

    try {
      const metadataContent = fs.readFileSync(currentMetadataPath, 'utf8');
      const metadata = yaml.load(metadataContent);

      // Check if target is in connected locations
      const connectedLocations = metadata.connected_locations || [];

      if (connectedLocations.length === 0 || connectedLocations.includes(targetLocationId)) {
        return {
          success: true,
          error: null,
          targetLocationId
        };
      }

      return {
        success: false,
        error: `Cannot travel to "${targetLocationId}" from "${currentLocationId}". Not connected.`,
        targetLocationId: null
      };
    } catch (error) {
      // If error reading metadata, allow travel (permissive stub behavior)
      return {
        success: true,
        error: null,
        targetLocationId
      };
    }
  }
}

module.exports = { NavigationHandler };
