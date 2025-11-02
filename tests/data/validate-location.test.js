/**
 * Unit tests for location validation script
 * Tests all validation scenarios including location hierarchy validation
 */

const fs = require('fs');
const path = require('path');
const { validateLocation, ValidationResult } = require('../../scripts/validate-location');

describe('Location Validation Script', () => {
  const testDataDir = path.join(__dirname, 'test-locations');
  const validLocationPath = path.join(process.cwd(), 'game-data', 'locations', 'village-of-barovia');

  // Clean up test locations before each test
  beforeEach(() => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDataDir, { recursive: true });
  });

  // Clean up after all tests
  afterAll(() => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('Valid Location Tests', () => {
    test('Village of Barovia should pass all validation checks', () => {
      const result = validateLocation(validLocationPath);

      expect(result.errors).toHaveLength(0);
      expect(result.success.length).toBeGreaterThan(15);
      expect(result.isValid()).toBe(true);
    });

    test('Valid location with all files present should pass', () => {
      const testLocation = createTestLocation(testDataDir, 'valid-location', {
        withAllFiles: true,
        withValidMetadata: true
      });

      const result = validateLocation(testLocation);

      expect(result.errors).toHaveLength(0);
      expect(result.isValid()).toBe(true);
    });
  });

  describe('Missing Files Tests', () => {
    test('Missing Description.md should fail validation', () => {
      const testLocation = createTestLocation(testDataDir, 'missing-description', {
        withAllFiles: true,
        skipFiles: ['Description.md']
      });

      const result = validateLocation(testLocation);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('Missing required file: Description.md'))).toBe(true);
      expect(result.isValid()).toBe(false);
    });

    test('Missing NPCs.md should fail validation', () => {
      const testLocation = createTestLocation(testDataDir, 'missing-npcs', {
        withAllFiles: true,
        skipFiles: ['NPCs.md']
      });

      const result = validateLocation(testLocation);

      expect(result.errors.some(e => e.includes('Missing required file: NPCs.md'))).toBe(true);
      expect(result.isValid()).toBe(false);
    });

    test('Missing metadata.yaml should fail validation', () => {
      const testLocation = createTestLocation(testDataDir, 'missing-metadata', {
        withAllFiles: true,
        skipFiles: ['metadata.yaml']
      });

      const result = validateLocation(testLocation);

      expect(result.errors.some(e => e.includes('Missing required file: metadata.yaml'))).toBe(true);
      expect(result.isValid()).toBe(false);
    });

    test('Missing multiple files should report all missing files', () => {
      const testLocation = createTestLocation(testDataDir, 'missing-multiple', {
        withAllFiles: true,
        skipFiles: ['Items.md', 'Events.md', 'State.md']
      });

      const result = validateLocation(testLocation);

      expect(result.errors.length).toBeGreaterThanOrEqual(3);
      expect(result.isValid()).toBe(false);
    });
  });

  describe('Empty Files Tests', () => {
    test('Empty Description.md should fail validation', () => {
      const testLocation = createTestLocation(testDataDir, 'empty-description', {
        withAllFiles: true,
        emptyFiles: ['Description.md']
      });

      const result = validateLocation(testLocation);

      expect(result.errors.some(e => e.includes('File is empty: Description.md'))).toBe(true);
      expect(result.isValid()).toBe(false);
    });

    test('Empty metadata.yaml should fail validation', () => {
      const testLocation = createTestLocation(testDataDir, 'empty-metadata', {
        withAllFiles: true,
        emptyFiles: ['metadata.yaml']
      });

      const result = validateLocation(testLocation);

      expect(result.errors.some(e => e.includes('File is empty: metadata.yaml'))).toBe(true);
      expect(result.isValid()).toBe(false);
    });
  });

  describe('Description.md Section Tests', () => {
    test('Missing required sections in Description.md should fail', () => {
      const testLocation = createTestLocation(testDataDir, 'incomplete-description', {
        withAllFiles: true,
        descriptionMissingSections: ['## Overview', '## Points of Interest']
      });

      const result = validateLocation(testLocation);

      expect(result.errors.some(e => e.includes('missing required section'))).toBe(true);
      expect(result.isValid()).toBe(false);
    });

    test('Description.md with all sections should pass', () => {
      const testLocation = createTestLocation(testDataDir, 'complete-description', {
        withAllFiles: true,
        withCompleteDescription: true
      });

      const result = validateLocation(testLocation);

      expect(result.success.some(s => s.includes('Description.md has all required sections'))).toBe(true);
    });
  });

  describe('Malformed YAML Tests', () => {
    test('Invalid YAML in metadata.yaml should fail', () => {
      const testLocation = createTestLocation(testDataDir, 'invalid-yaml', {
        withAllFiles: true,
        invalidYaml: true
      });

      const result = validateLocation(testLocation);

      expect(result.errors.some(e => e.includes('Failed to parse metadata.yaml'))).toBe(true);
      expect(result.isValid()).toBe(false);
    });
  });

  describe('Location Hierarchy Validation Tests', () => {
    test('Missing parent_location field should fail', () => {
      const testLocation = createTestLocation(testDataDir, 'missing-parent', {
        withAllFiles: true,
        metadataMissingFields: ['parent_location']
      });

      const result = validateLocation(testLocation);

      expect(result.errors.some(e => e.includes('missing required field: parent_location'))).toBe(true);
      expect(result.isValid()).toBe(false);
    });

    test('Missing sub_locations field should fail', () => {
      const testLocation = createTestLocation(testDataDir, 'missing-sublocations', {
        withAllFiles: true,
        metadataMissingFields: ['sub_locations']
      });

      const result = validateLocation(testLocation);

      expect(result.errors.some(e => e.includes('missing required field: sub_locations'))).toBe(true);
      expect(result.isValid()).toBe(false);
    });

    test('Missing location_level field should fail', () => {
      const testLocation = createTestLocation(testDataDir, 'missing-level', {
        withAllFiles: true,
        metadataMissingFields: ['location_level']
      });

      const result = validateLocation(testLocation);

      expect(result.errors.some(e => e.includes('missing required field: location_level'))).toBe(true);
      expect(result.isValid()).toBe(false);
    });

    test('Invalid location_level value should fail', () => {
      const testLocation = createTestLocation(testDataDir, 'invalid-level', {
        withAllFiles: true,
        invalidLocationLevel: 'dungeon'  // Not one of: region, settlement, building, room
      });

      const result = validateLocation(testLocation);

      expect(result.errors.some(e => e.includes('Invalid location_level'))).toBe(true);
      expect(result.isValid()).toBe(false);
    });

    test('Valid hierarchy with null parent (region level) should pass', () => {
      const testLocation = createTestLocation(testDataDir, 'region-level', {
        withAllFiles: true,
        hierarchyConfig: {
          location_level: 'region',
          parent_location: null,
          sub_locations: ['settlement-1', 'settlement-2']
        }
      });

      const result = validateLocation(testLocation);

      expect(result.success.some(s => s.includes('parent_location is null (valid for region level)'))).toBe(true);
      expect(result.isValid()).toBe(true);
    });

    test('Valid hierarchy with parent and children (settlement level) should pass', () => {
      const testLocation = createTestLocation(testDataDir, 'settlement-level', {
        withAllFiles: true,
        hierarchyConfig: {
          location_level: 'settlement',
          parent_location: 'barovia-region',
          sub_locations: ['tavern', 'mansion', 'church']
        }
      });

      const result = validateLocation(testLocation);

      expect(result.success.some(s => s.includes('parent_location is set'))).toBe(true);
      expect(result.success.some(s => s.includes('sub_locations is array with 3 entries'))).toBe(true);
      expect(result.isValid()).toBe(true);
    });

    test('Empty sub_locations for room level should pass with success', () => {
      const testLocation = createTestLocation(testDataDir, 'room-level', {
        withAllFiles: true,
        hierarchyConfig: {
          location_level: 'room',
          parent_location: 'tavern-building',
          sub_locations: []
        }
      });

      const result = validateLocation(testLocation);

      expect(result.success.some(s => s.includes('sub_locations is empty (valid for room level)'))).toBe(true);
      expect(result.isValid()).toBe(true);
    });

    test('Warning if parent_location references non-existent location', () => {
      const testLocation = createTestLocation(testDataDir, 'parent-warning', {
        withAllFiles: true,
        hierarchyConfig: {
          location_level: 'settlement',
          parent_location: 'nonexistent-region',
          sub_locations: []
        }
      });

      const result = validateLocation(testLocation);

      expect(result.warnings.some(w => w.includes('ensure this location exists'))).toBe(true);
      expect(result.isValid()).toBe(true);  // Warning, not error
    });
  });

  describe('Non-existent Location Tests', () => {
    test('Non-existent folder should fail validation', () => {
      const result = validateLocation('/nonexistent/path');

      expect(result.errors.some(e => e.includes('Location folder not found'))).toBe(true);
      expect(result.isValid()).toBe(false);
    });

    test('File instead of directory should fail validation', () => {
      const filePath = path.join(testDataDir, 'not-a-directory.txt');
      fs.writeFileSync(filePath, 'test');

      const result = validateLocation(filePath);

      expect(result.errors.some(e => e.includes('Path is not a directory'))).toBe(true);
      expect(result.isValid()).toBe(false);
    });
  });
});

/**
 * Helper function to create test locations with various configurations
 */
function createTestLocation(baseDir, name, options = {}) {
  const locationDir = path.join(baseDir, name);
  fs.mkdirSync(locationDir, { recursive: true });

  const skipFiles = options.skipFiles || [];
  const emptyFiles = options.emptyFiles || [];

  const files = {
    'Description.md': createDescriptionContent(options),
    'NPCs.md': '# NPCs\n\n## Test NPC\n- **Type:** Human\n',
    'Items.md': '# Items\n\n## Available Items\n- **Test Item:** 1 gp\n',
    'Events.md': '# Events\n\n## Scheduled Events\n### Test Event\n',
    'State.md': '# State\n\n## Last Updated\n2024-03-10\n',
    'metadata.yaml': createMetadataContent(options)
  };

  Object.entries(files).forEach(([filename, content]) => {
    if (!skipFiles.includes(filename)) {
      const filePath = path.join(locationDir, filename);
      const fileContent = emptyFiles.includes(filename) ? '' : content;
      fs.writeFileSync(filePath, fileContent);
    }
  });

  return locationDir;
}

function createDescriptionContent(options) {
  if (options.withCompleteDescription || !options.descriptionMissingSections) {
    return `# Test Location

## Overview
Test overview

## Initial Description
Test initial description

## Return Description
Test return description

## Time-Based Variants

### Morning
Morning description

### Night
Night description

## Points of Interest
- Point 1
- Point 2
`;
  }

  let content = '# Test Location\n\n';
  const missingSections = options.descriptionMissingSections || [];
  const sections = [
    ['## Overview', 'Test overview'],
    ['## Initial Description', 'Test initial'],
    ['## Return Description', 'Test return'],
    ['## Time-Based Variants', ''],
    ['### Morning', 'Morning desc'],
    ['### Night', 'Night desc'],
    ['## Points of Interest', '- Point 1']
  ];

  sections.forEach(([header, body]) => {
    if (!missingSections.includes(header)) {
      content += `${header}\n${body}\n\n`;
    }
  });

  return content;
}

function createMetadataContent(options) {
  if (options.invalidYaml) {
    return 'invalid: yaml: content:\n  - this is broken';
  }

  const hierarchyConfig = options.hierarchyConfig || {
    location_level: 'settlement',
    parent_location: 'test-region',
    sub_locations: ['test-building']
  };

  const missingFields = options.metadataMissingFields || [];

  let yaml = `location_name: "Test Location"\n`;
  yaml += `location_type: "Settlement"\n`;
  yaml += `region: "Test Region"\n`;

  if (!missingFields.includes('parent_location')) {
    yaml += `parent_location: ${hierarchyConfig.parent_location === null ? 'null' : `"${hierarchyConfig.parent_location}"`}\n`;
  }

  if (!missingFields.includes('sub_locations')) {
    yaml += `sub_locations: [${hierarchyConfig.sub_locations.map(s => `"${s}"`).join(', ')}]\n`;
  }

  if (!missingFields.includes('location_level')) {
    const level = options.invalidLocationLevel || hierarchyConfig.location_level;
    yaml += `location_level: "${level}"\n`;
  }

  yaml += `connected_locations:\n`;
  yaml += `  - name: "Connected Location"\n`;
  yaml += `    direction: "North"\n`;
  yaml += `    travel_time: "1 hour"\n`;

  return yaml;
}
