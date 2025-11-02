# Story 1.4: Basic Slash Commands

Status: ready-for-dev

## Story

As a **player**,
I want **to interact with the game using simple VS Code slash commands (`/start-session`, `/look`, `/travel [location]`, `/end-session`)**,
so that **I can start sessions, navigate locations, and save my progress without leaving my code editor**.

## Acceptance Criteria

### AC-4: Start Session Command (Primary)
**Given** the game is not currently in a session
**When** user executes `/start-session`
**Then** a new SessionState must be created with unique UUID
**And** currentLocationId must be set to "village-of-barovia"
**And** location data must be loaded
**And** LLM must generate initial narrative description
**And** narrative must be displayed to user in VS Code
**And** entire operation must complete in < 3 seconds
**And** session log must be created at logs/session-YYYY-MM-DD.md

**Verification Method:** Integration tests + manual testing

### AC-5: Travel Between Locations
**Given** an active session at location A
**When** user executes `/travel location-b`
**Then** system must validate location-b exists
**And** system must validate location-b is connected to location A (check metadata.yaml)
**And** if valid: currentLocationId must update to location-b
**And** if valid: location-b data must be loaded
**And** if valid: LLM must generate arrival narrative
**And** if invalid: user-friendly error message must display
**And** travel action must be logged to session log
**And** entire operation must complete in < 1 second (excluding LLM call)

**Verification Method:** Manual testing with valid/invalid locations + unit tests

### AC-6: Look Command
**Given** an active session at any location
**When** user executes `/look`
**Then** current location data must be reloaded from disk
**And** LLM must generate refreshed location description
**And** narrative must be displayed to user
**And** action must be logged to session log
**And** operation must complete in < 5 seconds total

**Verification Method:** Manual testing + integration tests

### AC-7: End Session with Auto-Save
**Given** an active session with N actions taken
**When** user executes `/end-session`
**Then** session endTime must be recorded
**And** session summary must be written to log file
**And** Git auto-save must create commit with format:
```
[AUTO-SAVE] Session YYYY-MM-DD
Location: [current location]
Duration: [X minutes]
Actions: [N]
```
**And** commit hash must be displayed to user
**And** session state must be cleared from memory
**And** entire operation must complete in < 5 seconds

**Verification Method:** Manual testing + verify Git commit created with correct message

### Additional Success Criteria

8. CommandRouter class implements command parsing and routing
9. All 4 commands registered with VS Code extension API
10. Commands accessible via VS Code command palette
11. Commands provide user feedback (success/error messages)
12. Error handling for invalid command arguments
13. Command execution does not block VS Code UI
14. Test coverage ≥ 90% for command handlers
15. Integration with SessionManager, LocationLoader, ContextBuilder from previous stories

## Tasks / Subtasks

- [ ] **Task 1: Create VS Code extension structure** (AC: #8, #9)
  - [ ] Create `.vscode/extension.js` file
  - [ ] Set up extension manifest (package.json extension fields)
  - [ ] Register extension activation event
  - [ ] Define 4 command contributions (`kapi-rpg.startSession`, etc.)
  - [ ] Export activate() and deactivate() functions

- [ ] **Task 2: Implement CommandRouter class** (AC: #8)
  - [ ] Create `src/commands/router.js` file
  - [ ] Implement CommandRouter class constructor
  - [ ] Create parseCommand(commandString) method
  - [ ] Create routeCommand(command, args) method
  - [ ] Set up dependency injection for handlers
  - [ ] Export CommandRouter class

- [ ] **Task 3: Implement start-session command handler** (AC: #4, #11)
  - [ ] Create `src/commands/handlers/start-session.js` file
  - [ ] Implement startSessionHandler(context) function
  - [ ] Call SessionManager.startSession("village-of-barovia")
  - [ ] Call LocationLoader.loadLocation() for initial location
  - [ ] Call ContextBuilder.buildPrompt() to generate initial prompt
  - [ ] Display narrative to user in VS Code output channel
  - [ ] Handle errors gracefully with user-friendly messages
  - [ ] Return session state

- [ ] **Task 4: Implement travel command handler** (AC: #5, #11, #12)
  - [ ] Create `src/commands/handlers/travel.js` file
  - [ ] Implement travelHandler(context, targetLocationId) function
  - [ ] Validate targetLocationId argument exists
  - [ ] Call NavigationHandler.travel() to validate and execute travel
  - [ ] Update SessionManager currentLocation on success
  - [ ] Call ContextBuilder.buildPrompt() for new location
  - [ ] Display arrival narrative or error message
  - [ ] Log action to session log

- [ ] **Task 5: Implement look command handler** (AC: #6, #11)
  - [ ] Create `src/commands/handlers/look.js` file
  - [ ] Implement lookHandler(context) function
  - [ ] Get currentLocationId from SessionManager
  - [ ] Call LocationLoader.loadLocation() (triggers file reload)
  - [ ] Call ContextBuilder.buildPrompt() with refreshed data
  - [ ] Display refreshed narrative to user
  - [ ] Log action to session log

- [ ] **Task 6: Implement end-session command handler** (AC: #7, #11)
  - [ ] Create `src/commands/handlers/end-session.js` file
  - [ ] Implement endSessionHandler(context) function
  - [ ] Call SessionManager.endSession() to record end time
  - [ ] Call SessionLogger.finalize() to write session summary
  - [ ] Call GitIntegration.createAutoSave() to commit changes
  - [ ] Display session summary (duration, actions, locations, commit hash)
  - [ ] Clear session state
  - [ ] Handle Git errors gracefully (warn but don't block)

- [ ] **Task 7: Implement VS Code UI integration** (AC: #10, #13)
  - [ ] Create VS Code output channel for game narratives
  - [ ] Register commands with VS Code context (extension.js)
  - [ ] Implement async command execution (non-blocking)
  - [ ] Add command status bar item showing current session/location
  - [ ] Display progress indicators for long operations
  - [ ] Handle command execution errors with VS Code error notifications

- [ ] **Task 8: Integration with previous stories** (AC: #15)
  - [ ] Import SessionManager (will be created in Story 1.5 or stub for now)
  - [ ] Import LocationLoader from Story 1.2
  - [ ] Import ContextBuilder from Story 1.3
  - [ ] Import NavigationHandler (will be created in Story 1.6 or stub for now)
  - [ ] Import SessionLogger (will be created in Story 1.7 or stub for now)
  - [ ] Import GitIntegration (will be created in Story 1.8 or stub for now)
  - [ ] Create stub/mock implementations for services not yet implemented

- [ ] **Task 9: Error handling and validation** (AC: #12)
  - [ ] Validate session state before executing commands
  - [ ] Check for active session before /travel, /look, /end-session
  - [ ] Display clear error if no session active
  - [ ] Validate /travel argument (locationId) is provided
  - [ ] Handle command execution failures gracefully
  - [ ] Never crash VS Code extension on error

- [ ] **Task 10: Write unit tests** (AC: #14)
  - [ ] Create `tests/commands/router.test.js` file
  - [ ] Test CommandRouter.parseCommand() with various inputs
  - [ ] Test CommandRouter.routeCommand() dispatches correctly
  - [ ] Create `tests/commands/handlers/start-session.test.js`
  - [ ] Create `tests/commands/handlers/travel.test.js`
  - [ ] Create `tests/commands/handlers/look.test.js`
  - [ ] Create `tests/commands/handlers/end-session.test.js`
  - [ ] Mock all dependencies (SessionManager, LocationLoader, etc.)
  - [ ] Test error handling for each command
  - [ ] Ensure 90% code coverage

- [ ] **Task 11: Integration tests** (AC: #4, #5, #6, #7)
  - [ ] Create `tests/integration/commands.test.js` file
  - [ ] Test complete /start-session workflow (with stubs)
  - [ ] Test /travel workflow with valid locations
  - [ ] Test /travel with invalid locations (error case)
  - [ ] Test /look workflow
  - [ ] Test /end-session workflow
  - [ ] Test command sequence: start → travel → look → end
  - [ ] Verify session state changes correctly
  - [ ] Verify timing requirements (<3s start, <1s travel, <5s look, <5s end)

- [ ] **Task 12: Documentation and exports** (AC: #8)
  - [ ] Export CommandRouter from router.js
  - [ ] Export all command handlers
  - [ ] Add JSDoc comments for all public methods
  - [ ] Document command signatures and arguments
  - [ ] Add usage examples in comments
  - [ ] Update README with slash command documentation

## Dev Notes

### Architecture References

**Primary Reference:** Epic 1 Technical Specification - AC-4, AC-5, AC-6, AC-7
- [Source: docs/tech-spec-epic-1.md#Acceptance-Criteria]

**Command Signatures:** Epic 1 Technical Specification - APIs and Interfaces
- [Source: docs/tech-spec-epic-1.md#APIs-and-Interfaces → Command Signatures]

**Workflows:** Epic 1 Technical Specification - Workflows and Sequencing
- [Source: docs/tech-spec-epic-1.md#Workflows-and-Sequencing]

### Key Architectural Constraints

1. **VS Code Extension API**: Commands must be registered with VS Code extension API (contribution points)
2. **Non-Blocking Execution**: Command handlers must be async to prevent blocking VS Code UI
3. **Error Handling**: Commands must never crash VS Code extension - all errors caught and displayed to user
4. **Session State Management**: Commands must check for active session before execution (except /start-session)
5. **Performance**: Start < 3s, Travel < 1s (excluding LLM), Look < 5s, End < 5s
6. **User Feedback**: All commands must provide clear feedback (success messages, error messages, progress indicators)
7. **Dependency Injection**: Command handlers receive dependencies via constructor (testable)

### Project Structure Notes

**Module Location:**
```
.vscode/
└── extension.js                # VS Code extension entry point
src/
├── commands/
│   ├── router.js               # CommandRouter class
│   └── handlers/
│       ├── start-session.js    # Start session handler
│       ├── travel.js           # Travel handler
│       ├── look.js             # Look handler
│       └── end-session.js      # End session handler
tests/
├── commands/
│   ├── router.test.js          # Router unit tests
│   └── handlers/
│       ├── start-session.test.js
│       ├── travel.test.js
│       ├── look.test.js
│       └── end-session.test.js
└── integration/
    └── commands.test.js        # End-to-end command tests
```

**Dependencies:**
- SessionManager (Story 1.5 - LLM Narrator Integration or separate session story)
- LocationLoader from Story 1.2 (✅ available)
- ContextBuilder from Story 1.3 (✅ available)
- NavigationHandler (Story 1.6 - Location Navigation)
- SessionLogger (Story 1.7 - Session Logging System)
- GitIntegration (Story 1.8 - Git Auto-Save)

**Note:** Since many dependencies are not yet implemented, this story will need to create stub/mock implementations or defer full integration to later stories.

### Learnings from Previous Story

**From Story 1-3-context-loader-module (Status: done)**

- **New Services Available for Reuse**:
  - `ContextBuilder.buildPrompt()` at `src/core/context-builder.js` - Generates optimized LLM prompts with token budget (use for /start-session, /travel, /look)
  - `ContextBuilder.estimateTokens()` - Estimates token count from text
  - `ContextBuilder.getSystemPrompt()` - Returns DM persona system prompt
  - LLMPrompt, CharacterData, PlayerAction schemas available in `src/data/schemas.js`

- **Architectural Patterns Established**:
  - JSDoc type definitions for IDE support and documentation (follow this pattern)
  - Comprehensive test coverage with integration tests (90%+ target)
  - Error handling with descriptive messages (apply to command validation)
  - Performance optimization (0.11ms execution - commands should also be fast)

- **Integration Notes**:
  - buildPrompt() is now synchronous (async removed in review fixes)
  - Use buildPrompt(location, characterData, recentActions) for all narrative generation
  - Token budget automatically enforced (< 3000 tokens)
  - Priority-based loading ensures critical data always fits

- **Files Available**:
  - `src/core/context-builder.js` (609 lines) - Use for LLM prompt generation
  - `src/data/location-loader.js` (700 lines) - Use for loading location data
  - `src/data/schemas.js` - Import LocationData, LLMPrompt, CharacterData types

- **Review Findings**:
  - Story 1.3 was APPROVED with all criteria met
  - No blocking issues - safe to integrate
  - Truncation warning logs added for debugging

[Source: stories/1-3-context-loader-module.md#Dev-Agent-Record]
[Source: stories/1-3-context-loader-module.md#Senior-Developer-Review]

### Implementation Strategy

**Phase 1: Core Infrastructure**
1. Create VS Code extension structure (.vscode/extension.js)
2. Create CommandRouter class (basic parsing and routing)
3. Set up VS Code output channel for narratives
4. Register 4 commands with VS Code API

**Phase 2: Command Handlers (with Stubs)**
1. Implement /start-session handler with stub SessionManager
2. Implement /travel handler with stub NavigationHandler
3. Implement /look handler (can use real LocationLoader + ContextBuilder)
4. Implement /end-session handler with stub SessionLogger + GitIntegration

**Phase 3: Integration & Testing**
1. Write unit tests for each handler (mocked dependencies)
2. Write integration tests for command workflows
3. Manual testing via VS Code command palette
4. Performance testing (verify timing requirements)

**Stubbing Strategy:**
Since SessionManager, NavigationHandler, SessionLogger, and GitIntegration are not yet implemented:
- Create simple stub classes in `src/stubs/` directory
- Stubs return hardcoded success responses
- Replace stubs with real implementations in later stories
- Tests use mocks, not stubs (full control over behavior)

### VS Code Extension Configuration

**package.json contribution:**
```json
{
  "contributes": {
    "commands": [
      {
        "command": "kapi-rpg.startSession",
        "title": "Kapi's RPG: Start New Session"
      },
      {
        "command": "kapi-rpg.travel",
        "title": "Kapi's RPG: Travel to Location"
      },
      {
        "command": "kapi-rpg.look",
        "title": "Kapi's RPG: Look Around"
      },
      {
        "command": "kapi-rpg.endSession",
        "title": "Kapi's RPG: End Session"
      }
    ]
  },
  "activationEvents": [
    "onCommand:kapi-rpg.startSession"
  ]
}
```

**Output Channel:**
```javascript
const outputChannel = vscode.window.createOutputChannel('Kapi\'s RPG');
outputChannel.show();
outputChannel.appendLine('[Narrative] You stand before...');
```

### Testing Strategy

**Unit Tests:**
- CommandRouter parsing and routing logic
- Each handler with mocked dependencies
- Error handling for invalid inputs
- Command argument validation

**Integration Tests:**
- Full command workflows with stub services
- Session state transitions
- Error scenarios (no session, invalid location)
- Performance benchmarks

**Manual Testing:**
- Open VS Code command palette (Ctrl+Shift+P)
- Execute each command and verify output
- Test error cases manually
- Verify Git commits created (for /end-session)

### References

- [Source: docs/tech-spec-epic-1.md#AC-4-Start-Session-Command]
- [Source: docs/tech-spec-epic-1.md#AC-5-Travel-Between-Locations]
- [Source: docs/tech-spec-epic-1.md#AC-6-Look-Command]
- [Source: docs/tech-spec-epic-1.md#AC-7-End-Session-with-Auto-Save]
- [Source: docs/tech-spec-epic-1.md#APIs-and-Interfaces → Command Signatures]
- [Source: docs/tech-spec-epic-1.md#Workflows-and-Sequencing]
- [Source: stories/1-3-context-loader-module.md#Completion-Notes-List]

## Dev Agent Record

### Context Reference

- docs/stories/1-4-basic-slash-commands.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
