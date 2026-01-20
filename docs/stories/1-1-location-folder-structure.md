# Story 1.1: Location Folder Structure

Status: done

## Story

As a **game developer**,
I want **to establish the standardized folder structure for game locations with required files**,
so that **all location data follows a consistent, parseable format that can be loaded by the game engine**.

## Acceptance Criteria

### AC-1: Location Folder Structure (Primary)
**Given** the game-data/locations directory exists
**When** I create a new location
**Then** the location folder must contain exactly 6 files: Description.md, NPCs.md, Items.md, Events.md, State.md, metadata.yaml
**And** each file must be parseable (valid markdown/YAML)
**And** files must follow the specifications in Architecture §4.2

**Verification Method:** Automated validation script checks all location folders

### Additional Success Criteria
1. Location folder follows naming convention: kebab-case (e.g., `village-of-barovia`)
2. Each of the 6 required files exists and is non-empty
3. Description.md contains sections: Overview, Initial Description, Return Description, Time-Based Variants, Points of Interest
4. NPCs.md follows YAML format with sections for each NPC
5. Items.md follows YAML format listing available and hidden items
6. Events.md follows YAML format defining scheduled, conditional, and recurring events
7. State.md follows YAML format tracking current location state
8. metadata.yaml contains all required fields: location_name, location_type, region, connected_locations, etc.
9. Files can be loaded and parsed without errors
10. Folder structure is documented for future location creation

## Tasks / Subtasks

- [ ] **Task 1: Create directory structure and templates** (AC: #1)
  - [ ] Create `game-data/locations/` directory if not exists
  - [ ] Create example location folder: `game-data/locations/village-of-barovia/`
  - [ ] Document folder naming conventions

- [ ] **Task 2: Create Description.md template** (AC: #1, #3)
  - [ ] Define markdown structure with required sections
  - [ ] Add Overview section (50-100 words)
  - [ ] Add Initial Description section (150-300 words)
  - [ ] Add Return Description section (50-100 words)
  - [ ] Add Time-Based Variants sections (Morning, Night)
  - [ ] Add Points of Interest list
  - [ ] Create template file at `templates/location/Description.md`

- [ ] **Task 3: Create NPCs.md template** (AC: #1, #4)
  - [ ] Define YAML structure for NPC entries
  - [ ] Include required fields: Type, Age, Location, Status, Relationship, Quest Connection
  - [ ] Add Description subsection
  - [ ] Add Dialogue subsection (Initial Greeting, Quest Hook, variations)
  - [ ] Add Stats subsection (AC, HP, Abilities)
  - [ ] Add AI Behavior Notes subsection
  - [ ] Create template file at `templates/location/NPCs.md`

- [ ] **Task 4: Create Items.md template** (AC: #1, #5)
  - [ ] Define YAML structure for items
  - [ ] Create Available Items section
  - [ ] Create Hidden Items section (with DC requirements)
  - [ ] Include pricing and value information
  - [ ] Create template file at `templates/location/Items.md`

- [ ] **Task 5: Create Events.md template** (AC: #1, #6)
  - [ ] Define YAML structure for events
  - [ ] Create Scheduled Events section (with trigger dates/times)
  - [ ] Create Conditional Events section (with trigger conditions)
  - [ ] Create Recurring Events section
  - [ ] Include fields: Trigger, Type, Effect, Consequence
  - [ ] Create template file at `templates/location/Events.md`

- [ ] **Task 6: Create State.md template** (AC: #1, #7)
  - [ ] Define YAML structure for location state
  - [ ] Add Last Updated timestamp
  - [ ] Add Current Date and Current Time fields
  - [ ] Add Weather section
  - [ ] Add Location Status section
  - [ ] Add Changes Since Last Visit list
  - [ ] Add NPC Positions map
  - [ ] Add Active Quests list
  - [ ] Create template file at `templates/location/State.md`

- [ ] **Task 7: Create metadata.yaml template** (AC: #1, #8)
  - [ ] Define YAML structure for metadata
  - [ ] Add location_name, location_type, region fields
  - [ ] Add size, population, danger_level fields
  - [ ] Add recommended_level field
  - [ ] Add connected_locations array with name, direction, travel_time
  - [ ] Add fast_travel_available, discovered, first_visit_date fields
  - [ ] Create template file at `templates/location/metadata.yaml`

- [ ] **Task 8: Populate Village of Barovia example** (AC: #2, #9)
  - [ ] Create `game-data/locations/village-of-barovia/` folder
  - [ ] Populate Description.md with Curse of Strahd content
  - [ ] Populate NPCs.md with Ireena, Ismark, Mad Mary, Father Donavich
  - [ ] Populate Items.md with tavern items and hidden quest items
  - [ ] Populate Events.md with Death of Burgomaster, Zombie Siege, Strahd's Visit
  - [ ] Populate State.md with initial game state
  - [ ] Populate metadata.yaml with connections to Tser Pool, Castle Ravenloft, Svalich Wood

- [ ] **Task 9: Create validation script** (AC: #9)
  - [ ] Write Node.js script: `scripts/validate-location.js`
  - [ ] Check for presence of all 6 required files
  - [ ] Validate Description.md has required sections
  - [ ] Validate NPCs.md, Items.md, Events.md, State.md are valid YAML
  - [ ] Validate metadata.yaml has all required fields
  - [ ] Report missing or malformed files
  - [ ] Exit with error code if validation fails

- [ ] **Task 10: Create location creation documentation** (AC: #10)
  - [ ] Write `docs/creating-locations.md` guide
  - [ ] Document folder naming conventions
  - [ ] Document file structure requirements
  - [ ] Include examples from Village of Barovia
  - [ ] Provide checklist for new locations
  - [ ] Link to template files

- [ ] **Task 11: Write unit tests** (AC: #9)
  - [ ] Create test file: `tests/data/validate-location.test.js`
  - [ ] Test validation script with valid location (Village of Barovia)
  - [ ] Test validation script with missing files
  - [ ] Test validation script with malformed YAML
  - [ ] Test validation script with missing required sections
  - [ ] Ensure 95% code coverage for validation logic

## Dev Notes

### Architecture References

**Primary Reference:** Technical Architecture Document §4.2 - Location File Specifications
- [Source: docs/technical-architecture.md#4.2-Location-File-Specifications]

**Tech Spec Reference:** Epic 1 Technical Specification - AC-1
- [Source: docs/tech-spec-epic-1.md#AC-1-Location-Folder-Structure]

### Key Architectural Constraints

1. **File-First Design:** All game data stored in human-readable markdown/YAML files (no database)
2. **Git-Compatible:** File formats must work well with version control (plain text only)
3. **Human-Readable:** All data files must be editable in text editor
4. **Separation of Concerns:** Location data separate from game logic
5. **Standardization:** All locations follow identical structure for consistent parsing

### Project Structure Notes

**Location Storage:**
```
game-data/
└── locations/
    └── [location-name]/           # kebab-case folder name
        ├── Description.md         # Narrative content
        ├── NPCs.md               # NPC data
        ├── Items.md              # Item listings
        ├── Events.md             # Event triggers
        ├── State.md              # Current state
        └── metadata.yaml         # Metadata & connections
```

**Template Storage:**
```
templates/
└── location/
    ├── Description.md
    ├── NPCs.md
    ├── Items.md
    ├── Events.md
    ├── State.md
    └── metadata.yaml
```

**Validation Tools:**
```
scripts/
└── validate-location.js         # Node.js validation script
```

### Implementation Guidelines

1. **Start with Templates:** Create template files first, then populate example
2. **Validate Early:** Run validation script after each file is created
3. **Follow Specifications:** Adhere strictly to Architecture §4.2 format
4. **Use YAML Libraries:** Use `js-yaml` package for YAML parsing/validation
5. **Document Examples:** Village of Barovia serves as reference implementation

### Testing Standards

**Test Coverage:** 95% for validation logic
**Test Framework:** Jest
**Test Location:** `tests/data/validate-location.test.js`

**Test Scenarios:**
- Valid location passes all checks
- Missing files detected
- Malformed YAML rejected
- Missing required sections detected
- Empty files rejected

### Dependencies

- `js-yaml` (^4.1.0) - YAML parsing and validation
- Node.js fs module - File system operations

### Success Criteria for Story Completion

✅ All 6 template files created in `templates/location/`
✅ Village of Barovia example location fully populated
✅ Validation script functional and passing for Village of Barovia
✅ Documentation guide created at `docs/creating-locations.md`
✅ Unit tests passing with 95% coverage
✅ No validation errors when running `node scripts/validate-location.js game-data/locations/village-of-barovia`

### Learnings from Previous Story

**First story in epic - no predecessor context**

This is the foundational story for Epic 1. Future stories will build upon the folder structure established here.

### References

- [Source: docs/technical-architecture.md#4.2-Location-File-Specifications]
- [Source: docs/tech-spec-epic-1.md#AC-1-Location-Folder-Structure]
- [Source: docs/tech-spec-epic-1.md#Detailed-Design]
- [Source: docs/GDD.md#Epic-1]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent during implementation_

### Completion Notes List

_To be filled by dev agent on story completion_

### File List

_To be filled by dev agent with NEW, MODIFIED, DELETED file markers_
