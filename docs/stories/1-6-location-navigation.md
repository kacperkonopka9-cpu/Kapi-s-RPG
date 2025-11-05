# Story 1.6: Location Navigation

Status: ready-for-dev

## Story

As a **player**,
I want **to travel between connected locations using the `/travel` command with proper validation**,
so that **I can explore the game world safely with clear error messages when travel is not possible**.

## Acceptance Criteria

### AC-16: Location Connectivity Validation (Primary)
**Given** an active session at a specific location
**When** user executes `/travel [target-location]`
**Then** system must load current location's metadata.yaml
**And** system must check if target location exists in connected_locations list
**And** if connected: allow travel and return success
**And** if not connected: display error "You cannot travel to [target] from here. Available exits: [list]"
**And** if target doesn't exist: display error "Location [target] does not exist"
**And** entire validation must complete in < 100ms

**Verification Method:** Unit tests + integration tests with multiple test locations

### AC-17: Get Connected Locations
**Given** an active session at any location
**When** getConnectedLocations() is called
**Then** system must return array of ConnectedLocation objects
**And** each object must include: locationId, displayName, description (from metadata.yaml)
**And** results must be sorted alphabetically by displayName
**And** operation must complete in < 50ms

**Verification Method:** Unit tests with various location configurations

### AC-18: Travel Success Workflow
**Given** a valid travel request to a connected location
**When** travel() succeeds
**Then** NavigationResult must include success=true
**And** targetLocationId must be set to destination
**And** error must be null
**And** result must indicate travel direction if available in metadata

**Verification Method:** Integration tests with real location data

### Additional Success Criteria

19. NavigationHandler class implements the API defined in tech-spec-epic-1.md
20. Integration with LocationLoader for metadata validation
21. Error handling for missing/corrupted metadata files
22. Graceful fallback if metadata.yaml is missing (allow travel with warning)
23. Performance monitoring logs operations > 100ms
24. Test coverage ≥ 90% for NavigationHandler module
25. Travel command handler in Story 1.4 integrated with real NavigationHandler

## Tasks / Subtasks

- [ ] **Task 1: Create NavigationHandler module** (AC: #16, #19)
  - [ ] Create `src/core/navigation-handler.js` file
  - [ ] Implement NavigationHandler class constructor (basePath injection)
  - [ ] Define travel(targetLocationId, currentLocationId) method signature
  - [ ] Define getConnectedLocations(locationId) method signature
  - [ ] Define canTravel(from, to) method signature
  - [ ] Export NavigationHandler class

- [ ] **Task 2: Implement travel() method** (AC: #16, #18)
  - [ ] Accept targetLocationId and currentLocationId parameters
  - [ ] Validate targetLocationId is not empty
  - [ ] Load current location's metadata.yaml file
  - [ ] Parse metadata to extract connected_locations array
  - [ ] Validate target exists in game-data/locations directory
  - [ ] Check if target is in connected_locations list
  - [ ] Return NavigationResult with success/error/targetLocationId

- [ ] **Task 3: Implement getConnectedLocations() method** (AC: #17)
  - [ ] Accept locationId parameter
  - [ ] Load location's metadata.yaml file
  - [ ] Parse connected_locations array
  - [ ] For each connected location, load its metadata to get displayName
  - [ ] Build array of ConnectedLocation objects
  - [ ] Sort results alphabetically by displayName
  - [ ] Return array of ConnectedLocation objects

- [ ] **Task 4: Implement canTravel() helper method** (AC: #16)
  - [ ] Accept from and to location IDs
  - [ ] Load from location's metadata
  - [ ] Check if to is in connected_locations
  - [ ] Return boolean (true if travel allowed)
  - [ ] Handle missing metadata gracefully

- [ ] **Task 5: Error handling and validation** (AC: #21, #22)
  - [ ] Handle missing metadata.yaml files (graceful fallback)
  - [ ] Handle corrupted YAML files (parse errors)
  - [ ] Validate location directories exist
  - [ ] Handle missing connected_locations field in metadata
  - [ ] Provide clear, user-friendly error messages
  - [ ] Log technical errors to console for debugging

- [ ] **Task 6: Performance monitoring** (AC: #23)
  - [ ] Add timing measurements for travel() method
  - [ ] Log operations > 100ms to console.warn
  - [ ] Track metadata file read times
  - [ ] Add performance metrics to NavigationResult

- [ ] **Task 7: Integration with LocationLoader** (AC: #20)
  - [ ] Import LocationLoader (or access via dependency injection)
  - [ ] Use LocationLoader.loadLocation() to validate target exists
  - [ ] Coordinate with LocationLoader's caching strategy
  - [ ] Share basePath configuration

- [ ] **Task 8: Replace stub in command handlers** (AC: #25)
  - [ ] Update `src/commands/handlers/travel.js` to use real NavigationHandler
  - [ ] Remove src/stubs/navigation-handler.js (or mark deprecated)
  - [ ] Update dependency injection in command handler tests
  - [ ] Verify travel command works end-to-end

- [ ] **Task 9: Write unit tests** (AC: #24)
  - [ ] Create `tests/core/navigation-handler.test.js` file
  - [ ] Test travel() with valid connected locations
  - [ ] Test travel() with invalid/disconnected locations
  - [ ] Test travel() with non-existent target
  - [ ] Test getConnectedLocations() with various metadata
  - [ ] Test canTravel() helper method
  - [ ] Test error handling (missing metadata, corrupt YAML)
  - [ ] Test performance targets (<100ms for travel, <50ms for getConnectedLocations)
  - [ ] Ensure 90%+ code coverage

- [ ] **Task 10: Write integration tests** (AC: #16, #17, #18)
  - [ ] Create `tests/integration/navigation.test.js` file
  - [ ] Test complete travel workflow with real test locations
  - [ ] Test navigation between 3+ connected locations
  - [ ] Test error scenarios with real location data
  - [ ] Verify integration with LocationLoader
  - [ ] Test travel command handler end-to-end

- [ ] **Task 11: Create/update test location data** (AC: #16)
  - [ ] Ensure test-location-1 and test-location-2 have metadata.yaml
  - [ ] Add connected_locations field to test location metadata
  - [ ] Create at least 3 connected test locations for integration tests
  - [ ] Add displayName and description to each location's metadata
  - [ ] Validate all test locations have required fields

- [ ] **Task 12: Documentation and exports** (AC: #19)
  - [ ] Export NavigationHandler from navigation-handler.js
  - [ ] Add JSDoc comments for all public methods
  - [ ] Document NavigationResult and ConnectedLocation types
  - [ ] Add usage examples in comments
  - [ ] Update integration notes in story file

## Dev Notes

### Architecture References

**Primary Reference:** Epic 1 Technical Specification - NavigationHandler API
- [Source: docs/tech-spec-epic-1.md#APIs-and-Interfaces → NavigationHandler API]

**Workflow Reference:** Epic 1 Technical Specification - Travel Workflow
- [Source: docs/tech-spec-epic-1.md#Workflows-and-Sequencing → Workflow 2: Travel Between Locations]

**Performance Targets:** Epic 1 Technical Specification - Performance
- [Source: docs/tech-spec-epic-1.md#Performance → Location Navigation < 1 second]

**Acceptance Criteria:** Epic 1 Technical Specification - AC-5
- [Source: docs/tech-spec-epic-1.md#Acceptance-Criteria → AC-5: Travel Between Locations]

### Key Architectural Constraints

1. **Performance Target**: Travel validation must complete in < 100ms (< 1s total including LLM)
2. **Graceful Fallback**: If metadata.yaml missing, allow travel with warning (don't block gameplay)
3. **Error Messages**: User-friendly messages with actionable information (list available exits)
4. **File System**: Synchronous file reads acceptable for metadata (small files, < 5KB)
5. **Validation Order**: Check target exists first, then check connectivity
6. **Integration**: Must work with existing LocationLoader and command handlers from Stories 1.2 and 1.4
7. **Stub Replacement**: Replace src/stubs/navigation-handler.js with full implementation

### Project Structure Notes

**Module Location:**
```
src/
├── core/
│   ├── navigation-handler.js      # NavigationHandler class (NEW)
│   ├── context-builder.js         # ContextBuilder (Story 1.3)
│   ├── llm-narrator.js            # LLMNarrator (Story 1.5)
│   └── session-manager.js         # SessionManager (Story 1.5)
├── data/
│   └── location-loader.js         # LocationLoader (Story 1.2)
├── commands/
│   └── handlers/
│       └── travel.js              # Travel command handler (Story 1.4, UPDATE)
├── stubs/
│   └── navigation-handler.js      # To be deprecated
tests/
├── core/
│   └── navigation-handler.test.js # Unit tests (NEW)
└── integration/
    └── navigation.test.js         # Integration tests (NEW)
```

**Dependencies:**
- LocationLoader from Story 1.2 (✅ available)
- CommandRouter and travel handler from Story 1.4 (✅ available)
- SessionManager from Story 1.5 (✅ available)
- js-yaml for parsing metadata.yaml (✅ available)
- fs, path for file operations (built-in)

### Learnings from Previous Stories

**From Story 1-4-basic-slash-commands (Status: done)**

- **Stub NavigationHandler Interface**:
  - `travel(targetLocationId, currentLocationId)` returns NavigationResult { success, error, targetLocationId }
  - Current stub only does basic existence + connectivity check
  - Travel command handler at src/commands/handlers/travel.js uses this interface
  - Must maintain interface compatibility when replacing stub

- **Command Handler Integration**:
  - Travel handler at src/commands/handlers/travel.js:62-75 calls navigationHandler.travel()
  - Handler expects NavigationResult format
  - Error messages displayed to user via outputChannel
  - Performance check already in place (<1s target)

- **Test Patterns Established**:
  - Dependency injection pattern: constructor(options) with basePath
  - Mock dependencies in unit tests
  - Integration tests with real test data
  - Performance assertions in tests

**From Story 1-5-llm-narrator-integration (Status: done)**

- **Module Structure Pattern**:
  - Class-based modules with constructor dependency injection
  - Private helper methods prefixed with underscore
  - Comprehensive JSDoc types and comments
  - Error handling with detailed error objects

- **Test Coverage Standards**:
  - 90%+ coverage requirement
  - Comprehensive error scenario testing
  - Performance benchmarks in tests
  - Integration tests verify complete workflows

**From Story 1-2-location-data-parser (Status: done)**

- **LocationLoader Integration**:
  - LocationLoader at src/data/location-loader.js loads location data
  - Can use LocationLoader to validate location exists (loadLocation throws if missing)
  - LocationLoader has 5-minute cache (coordinate with this)
  - Metadata loading may need separate method or direct file read

**Available Test Data:**
- test-location-1 and test-location-2 already exist (Stories 1.2, 1.3)
- Need to verify/add metadata.yaml with connected_locations field
- May need to create test-location-3 for multi-hop navigation tests

### Implementation Strategy

**Phase 1: Core Navigation Logic**
1. Create NavigationHandler class with constructor
2. Implement travel() method with metadata loading
3. Implement connectivity validation
4. Add error handling for missing/corrupt metadata

**Phase 2: Helper Methods**
1. Implement getConnectedLocations() to list available exits
2. Implement canTravel() helper for validation
3. Add performance monitoring

**Phase 3: Integration**
1. Update travel command handler to use real NavigationHandler
2. Remove stub or mark deprecated
3. Verify command handler tests still pass

**Phase 4: Testing**
1. Write comprehensive unit tests (travel, getConnectedLocations, canTravel)
2. Write integration tests with real location data
3. Create/update test location metadata files
4. Performance testing (verify < 100ms target)

### Metadata File Format

**metadata.yaml structure:**
```yaml
location_id: village-of-barovia
display_name: Village of Barovia
description: A dreary village shrouded in mist

connected_locations:
  - death-house
  - tser-pool-encampment
  - ravenloft-road-east

# Optional fields for navigation
exits:
  - direction: east
    location_id: ravenloft-road-east
    description: A muddy road leading east toward the castle
  - direction: west
    location_id: tser-pool-encampment
    description: A path through the woods to the Vistani camp
  - direction: south
    location_id: death-house
    description: A dilapidated mansion at the edge of town
```

**Required Fields:**
- `location_id`: String, must match folder name
- `display_name`: String, human-readable name
- `connected_locations`: Array of location IDs (strings)

**Optional Fields:**
- `description`: String, brief location summary (for list display)
- `exits`: Array of objects with direction, location_id, description

### ConnectedLocation Type Definition

```javascript
/**
 * @typedef {Object} ConnectedLocation
 * @property {string} locationId - Location folder name
 * @property {string} displayName - Human-readable location name
 * @property {string} description - Brief description of location
 * @property {string|null} direction - Optional direction (north, south, etc.)
 * @property {string|null} exitDescription - Optional description of exit/path
 */
```

### NavigationResult Type Definition

```javascript
/**
 * @typedef {Object} NavigationResult
 * @property {boolean} success - Whether travel was successful
 * @property {string|null} error - Error message if travel failed
 * @property {string|null} targetLocationId - Target location ID if successful
 * @property {number} durationMs - Time taken for validation (performance tracking)
 * @property {Array<ConnectedLocation>} availableExits - List of available exits (if travel failed)
 */
```

### Error Scenarios and Messages

1. **Target Location Does Not Exist**
   ```
   Error: Location "invalid-location" does not exist in the game world.
   ```

2. **Target Not Connected**
   ```
   Error: You cannot travel to "castle-ravenloft" from "village-of-barovia".
   Available exits: Death House, Tser Pool Encampment, Ravenloft Road (East)
   ```

3. **Missing Metadata (Graceful Fallback)**
   ```
   Warning: Location metadata missing. Allowing travel but connectivity not validated.
   ```

4. **Corrupted Metadata**
   ```
   Error: Unable to read location metadata. Please check metadata.yaml file format.
   ```

### Performance Considerations

**Target Metrics:**
- travel(): < 100ms (synchronous metadata read + validation)
- getConnectedLocations(): < 50ms (read 1 metadata + N target metadata files)
- canTravel(): < 50ms (single metadata read + array check)

**Optimization Strategies:**
- Use synchronous fs.readFileSync() for metadata (small files, acceptable latency)
- Cache metadata in memory if needed (coordinate with LocationLoader cache)
- Parallel metadata reads for getConnectedLocations() using Promise.all()
- Lazy load exit descriptions only when displaying to user

### Testing Strategy

**Unit Tests:**
- Mock file system (fs.readFileSync)
- Test all error scenarios
- Test connectivity validation logic
- Test performance targets
- Test edge cases (empty connected_locations, missing fields)

**Integration Tests:**
- Use real test location folders
- Test multi-location navigation sequences
- Test with actual metadata.yaml files
- Verify integration with travel command handler
- End-to-end workflow: /travel → validate → load → navigate

**Test Location Setup:**
- Create test-location-1, test-location-2, test-location-3 with full metadata
- Set up connectivity: 1 ↔ 2 ↔ 3 (bidirectional)
- One unconnected location (test-location-isolated) for error testing

### References

- [Source: docs/tech-spec-epic-1.md#APIs-and-Interfaces → NavigationHandler]
- [Source: docs/tech-spec-epic-1.md#Workflows-and-Sequencing → Travel Workflow]
- [Source: docs/tech-spec-epic-1.md#Acceptance-Criteria → AC-5]
- [Source: docs/tech-spec-epic-1.md#Performance → Location Navigation]
- [Source: stories/1-4-basic-slash-commands.md#Task-4-Implement-travel-command-handler]
- [Source: src/stubs/navigation-handler.js → Stub interface to replace]

## Dev Agent Record

### Context Reference

- docs/stories/1-6-location-navigation.context.xml

### Agent Model Used

- (To be recorded during dev-story workflow)

### Debug Log References

### Completion Notes List

(To be filled during implementation)

### File List

(To be filled during implementation)

---

## Senior Developer Review (AI)

**Reviewer:**
**Date:**
**Outcome:**

(To be completed during code-review workflow)
