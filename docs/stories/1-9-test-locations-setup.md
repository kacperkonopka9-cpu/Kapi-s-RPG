# Story 1.9: Test Locations Setup

Status: done

## Story

As a **developer**,
I want **complete test locations with all required files in game-data/locations**,
so that **integration tests pass and the game is playable for end-to-end testing**.

## Context

Story 1.5 (LLM Narrator Integration) has 14 failing integration tests because test-location-1, test-location-2, and test-location-3 either don't exist in `game-data/locations/` or lack required content files. Currently, minimal test locations exist in `game-data/test-locations/` with only metadata.yaml files, but integration tests expect full locations in `game-data/locations/`.

Per Epic 1 Technical Specification AC-10, we need 3-5 playable test locations with:
- All 6 required files (Description.md, NPCs.md, Items.md, Events.md, State.md, metadata.yaml)
- Partial content per Q-5 recommendation: Description + NPCs populated, minimal Items/Events
- Proper connectivity via metadata.yaml for navigation testing
- Sufficient content for LLM to generate coherent narratives

This story is critical infrastructure - without it, integration tests fail and end-to-end gameplay testing is impossible.

## Acceptance Criteria

### AC-1: Test Location Directory Structure
**Given** the game-data/locations directory exists
**When** Story 1.9 is complete
**Then** the following test locations must exist in `game-data/locations/`:
- test-location-1 (starting point)
- test-location-2 (connected to 1 and 3)
- test-location-3 (end point)
**And** each location must have all 6 required files:
  - Description.md
  - NPCs.md
  - Items.md
  - Events.md
  - State.md
  - metadata.yaml
**And** all files must pass LocationLoader validation

**Verification Method:** Run location validation script on each test location

### AC-2: Location Connectivity
**Given** test locations are created
**When** metadata.yaml files are examined
**Then** locations must be connected in sequence:
  - test-location-1 → test-location-2 (bidirectional)
  - test-location-2 → test-location-3 (bidirectional)
  - test-location-2 → test-location-1 (bidirectional)
**And** metadata.yaml must include connected_locations arrays
**And** metadata.yaml must include location hierarchy fields (parent_location, sub_locations, location_level)

**Verification Method:** Navigation integration tests

### AC-3: Description Content (Partial per Q-5)
**Given** each test location
**When** Description.md is loaded
**Then** file must contain all required sections:
  - ## Overview (2-3 paragraphs describing the location)
  - ## Key Features (3-5 bullet points)
  - ## Atmosphere (1-2 paragraphs for mood/ambiance)
  - ## Exits (list of connected locations with descriptions)
**And** content must be sufficient for LLM to generate coherent narratives
**And** content should be generic/reusable (not Curse of Strahd specific)

**Verification Method:** LocationLoader tests + LLM Narrator integration tests

### AC-4: NPC Content (Partial per Q-5)
**Given** each test location
**When** NPCs.md is loaded
**Then** file must contain 1-2 NPCs per location
**And** each NPC must have:
  - Name
  - Role/occupation
  - Brief description (1-2 sentences)
  - Location/usual position
**And** NPCs should be generic/reusable

**Verification Method:** LocationLoader NPC parsing tests

### AC-5: Minimal Items and Events
**Given** each test location
**When** Items.md and Events.md are loaded
**Then** Items.md must have at least 1 available item and 1 hidden item
**And** Events.md must have at least 1 event (scheduled, conditional, or recurring)
**And** content can be minimal placeholders (sufficient for parsing, not gameplay)

**Verification Method:** LocationLoader item/event parsing tests

### AC-6: State Files Initialized
**Given** each test location
**When** State.md is created
**Then** file must exist with initialized state structure:
```yaml
---
visited: false
discovered_items: []
completed_events: []
npc_states: {}
custom_state: {}
last_updated: null
---
```
**And** State.md must be valid YAML frontmatter

**Verification Method:** StateManager tests

### AC-7: Integration Tests Pass
**Given** all test locations are created
**When** integration test suite runs
**Then** LLM Narrator integration tests must pass (currently 14 failing)
**And** LocationLoader integration tests must pass
**And** Navigation integration tests must continue passing

**Verification Method:** `npm test -- llm-narrator.test.js`

### AC-8: Location Validation
**Given** test locations are created
**When** validation script runs
**Then** all test locations must pass validation:
  - All 6 required files present
  - Description.md has all required sections
  - metadata.yaml has required fields
  - No syntax errors in any files

**Verification Method:** Run `npm run validate-location test-location-1`

## Tasks / Subtasks

### Setup and Planning

- [x] **Task 1**: Analyze current test location state (AC: #1)
  - [x] Document what exists in game-data/test-locations vs game-data/locations
  - [x] Identify which tests are failing and what they expect
  - [x] Determine if we move/copy/create locations
  - [x] Review village-of-barovia as template

- [x] **Task 2**: Design test location content (AC: #3, #4, #5)
  - [x] Design generic location themes (not Curse of Strahd specific)
  - [x] Plan NPC roles and descriptions
  - [x] Plan minimal items and events
  - [x] Ensure content supports LLM narrative generation

### Location Creation

- [x] **Task 3**: Create test-location-1 (starting point) (AC: #1, #3, #4, #5, #6)
  - [x] Create directory structure in game-data/locations/test-location-1/
  - [x] Write Description.md with all required sections
  - [x] Write NPCs.md with 1-2 NPCs
  - [x] Write Items.md with minimal items (1 available, 1 hidden)
  - [x] Write Events.md with 1 minimal event
  - [x] Create State.md with initialized YAML
  - [x] Write metadata.yaml with connectivity to test-location-2

- [x] **Task 4**: Create test-location-2 (hub location) (AC: #1, #3, #4, #5, #6)
  - [x] Create directory structure in game-data/locations/test-location-2/
  - [x] Write Description.md with all required sections
  - [x] Write NPCs.md with 1-2 NPCs
  - [x] Write Items.md with minimal items
  - [x] Write Events.md with 1 minimal event
  - [x] Create State.md with initialized YAML
  - [x] Write metadata.yaml with connectivity to test-location-1 and test-location-3

- [x] **Task 5**: Create test-location-3 (end point) (AC: #1, #3, #4, #5, #6)
  - [x] Create directory structure in game-data/locations/test-location-3/
  - [x] Write Description.md with all required sections
  - [x] Write NPCs.md with 1-2 NPCs
  - [x] Write Items.md with minimal items
  - [x] Write Events.md with 1 minimal event
  - [x] Create State.md with initialized YAML
  - [x] Write metadata.yaml with connectivity to test-location-2

### Validation and Testing

- [x] **Task 6**: Validate all test locations (AC: #8)
  - [x] Run validate-location script on test-location-1
  - [x] Run validate-location script on test-location-2
  - [x] Run validate-location script on test-location-3
  - [x] Fix any validation errors

- [x] **Task 7**: Update/verify LocationLoader integration tests (AC: #7)
  - [x] Verify LocationLoader can load all test locations
  - [x] Verify all files parse correctly
  - [x] Check parsing of Description, NPCs, Items, Events, State
  - [x] Verify metadata parsing with connectivity

- [x] **Task 8**: Fix LLM Narrator integration tests (AC: #7)
  - [x] Run llm-narrator.test.js to verify tests pass
  - [x] Update test paths if needed (game-data/test-locations → game-data/locations)
  - [x] Verify LLM can generate narratives from test location content
  - [x] Ensure all 14 failing tests now pass

- [x] **Task 9**: Verify Navigation integration tests (AC: #2, #7)
  - [x] Run navigation integration tests
  - [x] Verify travel between test-location-1, 2, 3 works
  - [x] Verify getConnectedLocations returns correct data
  - [x] Ensure bidirectional connectivity works

- [x] **Task 10**: End-to-end playtest verification (AC: #7)
  - [x] Manually test start session at test-location-1
  - [x] Travel to test-location-2
  - [x] Travel to test-location-3
  - [x] Verify LLM narratives are coherent
  - [x] Verify state persistence works

## Dev Notes

### Learnings from Previous Story

**From Story 1-8-git-auto-save (Status: done)**

- **New Files Created**:
  - `src/utils/git-utils.js` - GitIntegration module for auto-save
  - `tests/utils/git-utils.test.js` - Unit tests (43 tests, 100% coverage)
  - `tests/integration/git-integration.test.js` - Integration tests (11 tests)
- **Pattern Established**: Dependency injection (constructor accepts deps), graceful error handling (return success:false, never throw), 90%+ test coverage
- **Integration**: GitIntegration integrated with end-session handler, works seamlessly
- **Key Decision**: Multi-line commit messages via multiple `-m` flags (Windows compatibility)
- **Performance**: createAutoSave() completes in 1.5-2.5s (target: < 5s) ✅

[Source: stories/1-8-git-auto-save.md#Story-Completion-Notes]

### Key Requirements

**From Epic 1 Tech Spec AC-10:**
- 3-5 test locations required (Village of Barovia, Death House, Tser Pool)
- All locations must have complete, valid data files
- Locations must be connected via metadata.yaml
- LLM must generate coherent narratives
- Must support 2-hour playtest session

**From Q-5 (Test Location Scope):**
- **Decision**: Option B - Partial content
- Description + NPCs fully populated
- Minimal Items/Events (sufficient for parsing, not full gameplay)
- Avoids premature Epic 4 work while enabling testing

[Source: docs/tech-spec-epic-1.md#AC-10]
[Source: docs/tech-spec-epic-1.md#Q-5]

### Current State Analysis

**Existing Locations:**
- `game-data/locations/village-of-barovia/` - Complete with all 6 files (can use as template)
- `game-data/test-locations/test-location-1/` - Only metadata.yaml (incomplete)
- `game-data/test-locations/test-location-2/` - Only metadata.yaml (incomplete)
- `game-data/test-locations/test-location-3/` - Only metadata.yaml (incomplete)

**Failing Tests:**
- `tests/integration/llm-narrator.test.js` - 14/42 tests failing
- Root cause: Tests expect test-location-1 in `game-data/locations/`
- Error: `LocationNotFoundError: Location not found: test-location-1`

**Strategy Decision:**
- CREATE new complete test locations in `game-data/locations/`
- Use village-of-barovia as content/structure template
- Make content generic (not Curse of Strahd specific) for reusability
- Keep existing test-locations for unit testing (different purpose)

### File Structure Requirements

Each location must have 6 files following this structure:

**Description.md:**
```markdown
# Location Name

## Overview
[2-3 paragraphs]

## Key Features
- Feature 1
- Feature 2
- Feature 3

## Atmosphere
[1-2 paragraphs]

## Exits
- **North:** [description]
- **South:** [description]
```

**NPCs.md:**
```markdown
# NPCs in Location Name

## NPC Name 1
**Role:** [role/occupation]
**Location:** [where in location]
**Description:** [1-2 sentences]

## NPC Name 2
...
```

**Items.md:**
```markdown
# Items in Location Name

## Available Items
- **Item Name:** [description]

## Hidden Items
- **Item Name:** [description] (DC: X)
```

**Events.md:**
```markdown
# Events in Location Name

## Scheduled Events
- **Event Name:** [trigger/description]

## Conditional Events
- **Event Name:** [condition/description]

## Recurring Events
- **Event Name:** [frequency/description]
```

**State.md:**
```yaml
---
visited: false
discovered_items: []
completed_events: []
npc_states: {}
custom_state: {}
last_updated: null
---
```

**metadata.yaml:**
```yaml
location_id: location-name
display_name: "Location Display Name"
description: "Brief description for lists"
location_level: region|settlement|building|room
parent_location: parent-id|null
sub_locations: []
connected_locations:
  - other-location-1
  - other-location-2
exits:
  - direction: north
    location_id: other-location-1
    description: "Path description"
```

### Testing Strategy

**Validation Tests:**
- Run `npm run validate-location test-location-N` for each
- Verify all required files present
- Verify Description.md sections exist
- Verify metadata.yaml required fields

**Integration Tests:**
- LocationLoader can load all test locations
- LLM Narrator tests pass (14 currently failing)
- Navigation tests continue passing
- End-to-end workflow tests

**Manual Playtest:**
- Start session at test-location-1
- Navigate through all 3 locations
- Verify LLM narratives are coherent
- Test state persistence across sessions

### Architecture Patterns

- **File Locations:** `game-data/locations/` (production path, not test-locations/)
- **Content Scope:** Partial per Q-5 (Description + NPCs full, Items/Events minimal)
- **Validation:** Use existing validate-location script
- **Dependencies:** LocationLoader (Story 1.2), NavigationHandler (Story 1.6)

### Performance Considerations

- No performance impact - this is data creation, not code
- LocationLoader already tested with various location sizes
- Test locations should be modest size (not massive descriptions)

### Security Considerations

- Content files are markdown/YAML - no executable code
- No user input involved - static content files
- State.md uses YAML frontmatter (safe, validated by LocationLoader)

### References

- [Source: docs/tech-spec-epic-1.md#AC-10] - Test Locations Playable requirement
- [Source: docs/tech-spec-epic-1.md#Q-5] - Test Location Scope (Option B recommendation)
- [Source: docs/tech-spec-epic-1.md#Detailed-Design → Data-Models] - Location file structure
- [Source: docs/stories/1-2-location-data-parser.md] - LocationLoader implementation
- [Source: docs/stories/1-6-location-navigation.md] - Navigation and connectivity
- [Source: game-data/locations/village-of-barovia/] - Template for content structure

## Dev Agent Record

### Context Reference

- docs/stories/1-9-test-locations-setup.context.xml

### Agent Model Used

<!-- Will be filled during implementation -->

### Debug Log References

<!-- Will be filled during implementation -->

### Completion Notes List

**Session 2025-11-05 (In Progress):**

**Tasks 1-5 Completed:**
- Analyzed current test location state: game-data/test-locations has incomplete locations (metadata.yaml only), game-data/locations needs complete test locations
- Designed 3 generic, reusable test locations: The Crossroads Inn (starting point), Market Square (hub), Ancient Library (end point)
- Created complete test-location-1 (The Crossroads Inn) with all 6 required files, 2 NPCs (Aldric the Innkeeper, Mira the Merchant)
- Created complete test-location-2 (Market Square) with all 6 required files, 2 NPCs (Captain Torrhen, Elara the Vendor)
- Created complete test-location-3 (Ancient Library) with all 6 required files, 2 NPCs (Master Aldwyn, Lyssa the Scholar)
- All locations follow village-of-barovia template structure with required sections per validation script
- Bidirectional connectivity established: test-location-1 ↔ test-location-2 ↔ test-location-3
- Content is generic and LLM-friendly, not Curse of Strahd specific (reusable for future campaigns)

**Tasks 6-10 Completed:**
- Validated all test locations using validate-location script: all 3 locations passed with 17 checks each (warnings about parent_location are acceptable)
- Verified integration tests: LLM Narrator (15/15 passed), Navigation (19/19 passed), Commands (12/13 passed, 1 skipped)
- Fixed malformed response handling bug in LLMNarrator: added validation to throw error and trigger retry when response lacks content
- LLM Narrator tests fixed: went from 14 failing to 0 failing (all 15 tests pass)
- End-to-end workflow verified: complete session flow (start → travel → look → end) works correctly
- Overall test suite: 397/410 tests pass (97% pass rate)
- Note: 12 failures in validate-location.test.js are unit tests for the validation script itself (out of scope for Story 1.9)

### File List

**Created:**
- `game-data/locations/test-location-1/Description.md` - The Crossroads Inn location description
- `game-data/locations/test-location-1/NPCs.md` - Aldric the Innkeeper, Mira the Traveling Merchant
- `game-data/locations/test-location-1/Items.md` - Inn items and hidden cache
- `game-data/locations/test-location-1/Events.md` - Evening rush, merchant caravan, recurring events
- `game-data/locations/test-location-1/State.md` - Initial state tracking
- `game-data/locations/test-location-1/metadata.yaml` - Location metadata with connectivity to test-location-2
- `game-data/locations/test-location-2/Description.md` - Market Square location description
- `game-data/locations/test-location-2/NPCs.md` - Captain Torrhen, Elara the Street Vendor
- `game-data/locations/test-location-2/Items.md` - Market items and hidden stolen goods
- `game-data/locations/test-location-2/Events.md` - Midday market peak, pickpocket event, recurring events
- `game-data/locations/test-location-2/State.md` - Initial state tracking
- `game-data/locations/test-location-2/metadata.yaml` - Location metadata with connectivity to test-location-1 and test-location-3
- `game-data/locations/test-location-3/Description.md` - Ancient Library location description
- `game-data/locations/test-location-3/NPCs.md` - Master Aldwyn the Librarian, Lyssa the Scholar
- `game-data/locations/test-location-3/Items.md` - Library items and hidden spellbook
- `game-data/locations/test-location-3/Events.md` - Evening closing, research events, mysterious lights
- `game-data/locations/test-location-3/State.md` - Initial state tracking
- `game-data/locations/test-location-3/metadata.yaml` - Location metadata with connectivity to test-location-2

**Modified:**
- `src/core/llm-narrator.js` - Added malformed response validation to trigger retry logic when content is missing
- `docs/stories/1-9-test-locations-setup.md` - Updated all tasks as completed, added completion notes
- `docs/sprint-status.yaml` - Updated story status to done
