#!/usr/bin/env node

/**
 * Location Validation Script
 * Validates that a location folder follows the required structure and specifications.
 *
 * Usage: node scripts/validate-location.js <path-to-location-folder>
 * Example: node scripts/validate-location.js game-data/locations/village-of-barovia
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Required files in every location folder
const REQUIRED_FILES = [
  'Description.md',
  'NPCs.md',
  'Items.md',
  'Events.md',
  'State.md',
  'metadata.yaml'
];

// Required sections in Description.md
const REQUIRED_DESCRIPTION_SECTIONS = [
  '## Overview',
  '## Initial Description',
  '## Return Description',
  '## Time-Based Variants',
  '### Morning',
  '### Night',
  '## Points of Interest'
];

// Required fields in metadata.yaml
const REQUIRED_METADATA_FIELDS = [
  'location_name',
  'location_type',
  'region',
  'parent_location',      // Hierarchy field
  'sub_locations',        // Hierarchy field
  'location_level',       // Hierarchy field
  'connected_locations'
];

// Valid location hierarchy levels
const VALID_LOCATION_LEVELS = ['region', 'settlement', 'building', 'room'];

class ValidationResult {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
  }

  addError(message) {
    this.errors.push(message);
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  addSuccess(message) {
    this.success.push(message);
  }

  isValid() {
    return this.errors.length === 0;
  }

  print() {
    console.log('\n' + colors.blue + '='.repeat(60) + colors.reset);
    console.log(colors.blue + 'LOCATION VALIDATION RESULTS' + colors.reset);
    console.log(colors.blue + '='.repeat(60) + colors.reset + '\n');

    if (this.success.length > 0) {
      console.log(colors.green + `✓ ${this.success.length} checks passed:` + colors.reset);
      this.success.forEach(msg => console.log(colors.green + `  ✓ ${msg}` + colors.reset));
      console.log();
    }

    if (this.warnings.length > 0) {
      console.log(colors.yellow + `⚠ ${this.warnings.length} warnings:` + colors.reset);
      this.warnings.forEach(msg => console.log(colors.yellow + `  ⚠ ${msg}` + colors.reset));
      console.log();
    }

    if (this.errors.length > 0) {
      console.log(colors.red + `✗ ${this.errors.length} errors:` + colors.reset);
      this.errors.forEach(msg => console.log(colors.red + `  ✗ ${msg}` + colors.reset));
      console.log();
    }

    console.log(colors.blue + '='.repeat(60) + colors.reset);
    if (this.isValid()) {
      console.log(colors.green + '✓ VALIDATION PASSED' + colors.reset);
    } else {
      console.log(colors.red + '✗ VALIDATION FAILED' + colors.reset);
    }
    console.log(colors.blue + '='.repeat(60) + colors.reset + '\n');
  }
}

function validateLocation(locationPath) {
  const result = new ValidationResult();

  // Check if location folder exists
  if (!fs.existsSync(locationPath)) {
    result.addError(`Location folder not found: ${locationPath}`);
    return result;
  }

  if (!fs.statSync(locationPath).isDirectory()) {
    result.addError(`Path is not a directory: ${locationPath}`);
    return result;
  }

  result.addSuccess(`Location folder exists: ${locationPath}`);

  // Check for all required files
  let allFilesPresent = true;
  REQUIRED_FILES.forEach(filename => {
    const filePath = path.join(locationPath, filename);
    if (!fs.existsSync(filePath)) {
      result.addError(`Missing required file: ${filename}`);
      allFilesPresent = false;
    } else {
      // Check if file is non-empty
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        result.addError(`File is empty: ${filename}`);
      } else {
        result.addSuccess(`File exists and is non-empty: ${filename}`);
      }
    }
  });

  if (!allFilesPresent) {
    return result; // Cannot continue validation without all files
  }

  // Validate Description.md structure
  validateDescriptionMd(locationPath, result);

  // Validate YAML files
  validateYamlFile(locationPath, 'NPCs.md', result);
  validateYamlFile(locationPath, 'Items.md', result);
  validateYamlFile(locationPath, 'Events.md', result);
  validateYamlFile(locationPath, 'State.md', result);

  // Validate metadata.yaml with hierarchy fields
  validateMetadataYaml(locationPath, result);

  return result;
}

function validateDescriptionMd(locationPath, result) {
  const filePath = path.join(locationPath, 'Description.md');
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    let allSectionsPresent = true;
    REQUIRED_DESCRIPTION_SECTIONS.forEach(section => {
      if (!content.includes(section)) {
        result.addError(`Description.md missing required section: ${section}`);
        allSectionsPresent = false;
      }
    });

    if (allSectionsPresent) {
      result.addSuccess('Description.md has all required sections');
    }
  } catch (error) {
    result.addError(`Failed to read Description.md: ${error.message}`);
  }
}

function validateYamlFile(locationPath, filename, result) {
  const filePath = path.join(locationPath, filename);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // For markdown files with YAML content, extract YAML portions
    // Skip the markdown header (lines starting with #)
    const yamlContent = content.split('\n')
      .filter(line => !line.trim().startsWith('#') || line.trim().startsWith('##'))
      .join('\n');

    // Try to parse as YAML (even if it's mostly markdown structure)
    // The key is that the structured data portions should be valid
    // For now, we just check if the file is readable and has content
    if (content.trim().length > 0) {
      result.addSuccess(`${filename} is readable and has content`);
    } else {
      result.addError(`${filename} is empty or contains only whitespace`);
    }
  } catch (error) {
    result.addError(`Failed to read ${filename}: ${error.message}`);
  }
}

function validateMetadataYaml(locationPath, result) {
  const filePath = path.join(locationPath, 'metadata.yaml');
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const metadata = yaml.load(content);

    if (!metadata || typeof metadata !== 'object') {
      result.addError('metadata.yaml does not contain valid YAML object');
      return;
    }

    result.addSuccess('metadata.yaml is valid YAML');

    // Check for all required fields
    let allFieldsPresent = true;
    REQUIRED_METADATA_FIELDS.forEach(field => {
      if (!(field in metadata)) {
        result.addError(`metadata.yaml missing required field: ${field}`);
        allFieldsPresent = false;
      }
    });

    if (allFieldsPresent) {
      result.addSuccess('metadata.yaml has all required fields');
    }

    // Validate location hierarchy fields
    validateLocationHierarchy(metadata, result);

  } catch (error) {
    result.addError(`Failed to parse metadata.yaml: ${error.message}`);
  }
}

function validateLocationHierarchy(metadata, result) {
  // Check location_level is valid
  if ('location_level' in metadata) {
    if (!VALID_LOCATION_LEVELS.includes(metadata.location_level)) {
      result.addError(
        `Invalid location_level "${metadata.location_level}". ` +
        `Must be one of: ${VALID_LOCATION_LEVELS.join(', ')}`
      );
    } else {
      result.addSuccess(`location_level "${metadata.location_level}" is valid`);
    }
  }

  // Check parent_location exists (can be null for top-level regions)
  if ('parent_location' in metadata) {
    if (metadata.parent_location === null && metadata.location_level === 'region') {
      result.addSuccess('parent_location is null (valid for region level)');
    } else if (metadata.parent_location === null && metadata.location_level !== 'region') {
      result.addWarning(
        `parent_location is null but location_level is "${metadata.location_level}" ` +
        `(expected only for region level)`
      );
    } else if (typeof metadata.parent_location === 'string') {
      result.addSuccess(`parent_location is set: "${metadata.parent_location}"`);
      // Could add check here to verify parent location exists, but that requires
      // scanning the entire locations directory
      result.addWarning(
        `parent_location references "${metadata.parent_location}" - ` +
        `ensure this location exists`
      );
    }
  }

  // Check sub_locations is an array
  if ('sub_locations' in metadata) {
    if (Array.isArray(metadata.sub_locations)) {
      result.addSuccess(
        `sub_locations is array with ${metadata.sub_locations.length} entries`
      );
      if (metadata.sub_locations.length === 0 && metadata.location_level === 'room') {
        result.addSuccess('sub_locations is empty (valid for room level)');
      } else if (metadata.sub_locations.length === 0 && metadata.location_level !== 'room') {
        result.addWarning(
          `sub_locations is empty but location_level is "${metadata.location_level}" ` +
          `(typically only rooms have no sub-locations)`
        );
      }
    } else {
      result.addError('sub_locations must be an array');
    }
  }

  // Check connected_locations is an array
  if ('connected_locations' in metadata) {
    if (Array.isArray(metadata.connected_locations)) {
      result.addSuccess(
        `connected_locations has ${metadata.connected_locations.length} connections`
      );
      // Validate structure of each connection
      metadata.connected_locations.forEach((conn, index) => {
        if (!conn.name || !conn.direction || !conn.travel_time) {
          result.addError(
            `connected_locations[${index}] missing required fields (name, direction, travel_time)`
          );
        }
      });
    } else {
      result.addError('connected_locations must be an array');
    }
  }
}

// Main execution
function main() {
  if (process.argv.length < 3) {
    console.log('Usage: node validate-location.js <path-to-location-folder>');
    console.log('Example: node validate-location.js game-data/locations/village-of-barovia');
    process.exit(1);
  }

  const locationPath = process.argv[2];
  const result = validateLocation(locationPath);
  result.print();

  // Exit with appropriate code
  process.exit(result.isValid() ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for testing
module.exports = { validateLocation, ValidationResult };
