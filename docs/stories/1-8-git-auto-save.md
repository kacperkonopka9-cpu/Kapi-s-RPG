# Story 1.8: Git Auto-Save

**Epic**: Epic 1 - Core Engine & Location System (MVP Foundation)
**Story ID**: 1-8-git-auto-save
**Status**: done
**Priority**: High
**Estimated Effort**: Small (1-2 hours)

## Story Statement

As a player, I want my session progress to be automatically committed to Git when I end a session, so that I have a version-controlled history of my gameplay and can recover from mistakes.

## Context

GitIntegration is a utility module that creates automatic Git commits at the end of each gameplay session. This provides:
- Version history of all gameplay (location states, session logs)
- Ability to revert to previous session states if needed
- Backup of progress without manual commits
- Descriptive commit messages showing session summary

The Git auto-save runs after SessionLogger finalizes the log file, ensuring all session data is committed together.

## Acceptance Criteria

**AC-1: Git Auto-Save on Session End**
- **Given** an active session with N actions taken
- **When** user executes `/end-session` command
- **Then** Git auto-save must run after session log is finalized
- **And** all changed files must be staged (`git add .`)
- **And** commit must be created with auto-save format
- **And** commit hash must be returned
- **And** entire operation must complete in < 5 seconds

**AC-2: Commit Message Format**
- **Given** Git auto-save is creating commit
- **When** building commit message
- **Then** message must follow format:
```
[AUTO-SAVE] Session YYYY-MM-DD
Location: [current location display name]
Duration: [X minutes]
Actions: [N]
```
- **And** message must be multi-line with proper formatting
- **And** date must be ISO format (YYYY-MM-DD)

**AC-3: Git Detection and Error Handling**
- **Given** Git auto-save is triggered
- **When** Git is not installed or not available
- **Then** must detect Git unavailability gracefully
- **And** must log clear warning to console
- **And** must return error result with message
- **And** session must still end successfully (don't block gameplay)

**AC-4: Commit Hash Display**
- **Given** Git commit created successfully
- **When** returning from auto-save
- **Then** must return commit hash (short format, 7 chars)
- **And** commit hash must be displayed to user in session summary
- **And** user can verify commit in Git history

**AC-5: API Implementation**
- **Given** GitIntegration module exists at `src/utils/git-utils.js`
- **When** imported by end-session handler
- **Then** must expose public API:
  - `createAutoSave(sessionState)` - creates Git commit, returns result with hash or error
  - `isGitAvailable()` - checks if Git is installed
- **And** must use dependency injection for subprocess execution (testability)

**AC-6: Integration with End-Session Workflow**
- **Given** end-session command handler
- **When** session is ending
- **Then** must call GitIntegration.createAutoSave() after SessionLogger.finalize()
- **And** must handle both success and error cases
- **And** must display Git result in session summary
- **And** must log Git commit hash or error message

**AC-7: Test Coverage**
- **Given** GitIntegration implementation complete
- **When** test suite runs
- **Then** statement coverage must be ≥90%
- **And** all edge cases must be covered (Git not installed, commit failures, permission errors)

## Tasks

### Core Implementation

- [ ] **Task 1**: Create GitIntegration module (src/utils/git-utils.js)
  - Create GitIntegration class with constructor
  - Accept dependencies: childProcess, cwd (for testability)
  - Initialize internal state: repositoryPath, gitAvailable

- [ ] **Task 2**: Implement isGitAvailable() method
  - Run `git --version` command
  - Check if command succeeds (exit code 0)
  - Cache result for performance
  - Return boolean (true if Git available)

- [ ] **Task 3**: Implement createAutoSave(sessionState) method
  - Check if Git available using isGitAvailable()
  - Stage all changes with `git add .`
  - Build commit message from sessionState:
    - Extract: sessionId, currentLocationId, duration, actionCount
    - Format multi-line message per AC-2
  - Create commit with `git commit -m "message"`
  - Extract commit hash from output
  - Return result object: { success, commitHash?, error? }

- [ ] **Task 4**: Build commit message helper
  - Accept sessionState parameter
  - Extract session date from sessionId or current date
  - Get location display name (or fallback to locationId)
  - Calculate duration in minutes
  - Format message with proper line breaks
  - Return formatted string

- [ ] **Task 5**: Error handling and validation
  - Handle Git not installed (isGitAvailable = false)
  - Handle `git add` failures (nothing to commit, permission errors)
  - Handle `git commit` failures (repo not initialized, no changes)
  - Log clear warnings to console for each error type
  - Never throw exceptions (graceful fallback)
  - Return error messages user can understand

### Integration

- [ ] **Task 6**: Integrate with end-session command handler
  - Import GitIntegration at top of file
  - Call Git Integration.createAutoSave() after SessionLogger.finalize()
  - Pass current sessionState to createAutoSave()
  - Handle success case: display commit hash in summary
  - Handle error case: display warning but continue

- [ ] **Task 7**: Update end-session handler summary display
  - Add commit hash to session summary if available
  - Add warning message if Git auto-save failed
  - Format summary to include:
    - Duration, actions, locations (existing)
    - Git commit: [hash] (new)
    - Log file: [path] (existing)

### Testing

- [ ] **Task 8**: Write unit tests (tests/utils/git-utils.test.js)
  - Mock childProcess.exec for subprocess calls
  - Test isGitAvailable() - success and failure cases
  - Test createAutoSave() - commit creation, message formatting
  - Test error cases - Git not installed, commit failures, permission errors
  - Test message format - verify multi-line structure, date format
  - Achieve ≥90% coverage

- [ ] **Task 9**: Write integration tests (tests/integration/git-integration.test.js)
  - Use real Git commands with temp repository
  - Test complete auto-save workflow: stage → commit → verify hash
  - Test session summary includes commit hash
  - Test graceful fallback when Git unavailable
  - Verify commit message format in actual Git history

- [ ] **Task 10**: Update end-session integration tests
  - Modify existing end-session tests to expect Git Integration
  - Test success path with Git available
  - Test error path with Git unavailable
  - Verify session ends successfully even if Git fails

## Technical Notes

### Learnings from Story 1.7 (Session Logging System)

**From Story 1-7-session-logging-system (Status: review)**

- **New Service Created**: `SessionLogger` at `src/core/session-logger.js` - use `SessionLogger.finalize()` to get log path before Git commit
- **Pattern Established**: Dependency injection with constructor parameters (basePath, deps) for testability - follow same pattern for GitIntegration
- **Error Handling Pattern**: Graceful fallback - all file system errors return success:false and log warnings but never throw exceptions - apply to Git operations
- **Performance Targets**: Operations should complete quickly (< 50ms for most operations) - Git commit has < 5s target per AC-1
- **Test Coverage**: Achieved 98.97% in Story 1.7 - aim for ≥90% here
- **Testing Approach**: Unit tests with mocks, integration tests with real operations - use mocked child_process in unit tests, real Git in integration tests

[Source: stories/1-7-session-logging-system.md#Story-Completion-Notes]

### Commit Message Format Example

```
[AUTO-SAVE] Session 2025-11-05
Location: Village of Barovia
Duration: 45 minutes
Actions: 12
```

### Dependencies
- **child_process** (Node.js built-in) - Subprocess execution for Git commands
- **jest** - Test framework for unit and integration tests

### Performance Targets
- isGitAvailable() < 100ms (cached after first call)
- createAutoSave() < 5 seconds total (per AC-1)
- `git add .` < 2 seconds
- `git commit` < 2 seconds

### Security Considerations
- Sanitize commit messages to prevent command injection
- Don't commit sensitive data (already handled by .gitignore for logs/*.md)
- Handle Git credentials safely (don't expose in error messages)

### Edge Cases to Handle
- Git not installed on system
- Repository not initialized (.git folder missing)
- No changes to commit (everything already committed)
- Permission errors (can't write to .git folder)
- Detached HEAD state
- Merge conflicts in progress

## Definition of Done

- [ ] All tasks completed and marked complete
- [ ] All acceptance criteria validated and passing
- [ ] Test coverage ≥90% achieved
- [ ] All tests passing (unit + integration)
- [ ] Code reviewed and approved
- [ ] No console errors or warnings during test runs
- [ ] GitIntegration integrated with end-session handler
- [ ] Manual testing: Session end creates Git commit with correct message
- [ ] Git not available scenario handled gracefully

## Files Created/Modified

**Created**:
- `src/utils/git-utils.js` - GitIntegration module implementation
- `tests/utils/git-utils.test.js` - Unit tests
- `tests/integration/git-integration.test.js` - Integration tests

**Modified**:
- `src/commands/handlers/end-session.js` - Integrate GitIntegration.createAutoSave()
- `tests/integration/commands.test.js` - Update end-session tests to expect Git integration

## Dev Notes

### Architecture Patterns
- **Graceful degradation**: System works without Git, just logs warning
- **Synchronous operations acceptable**: Git commands run synchronously since session is ending (no concurrent actions)
- **Dependency injection**: Constructor accepts child_process dependency for testing

### Project Structure Alignment
- GitIntegration placed in `src/utils/` per tech spec line 96
- Filename: `git-utils.js` per tech spec specification
- Export: `{ GitIntegration }` class for consistency

### References
- [Source: docs/tech-spec-epic-1.md#AC-7] - End Session with Auto-Save requirements
- [Source: docs/tech-spec-epic-1.md:551-560] - Git auto-save workflow sequence
- [Source: docs/tech-spec-epic-1.md:96] - GitIntegration module definition

## Dev Agent Record

### Context Reference

- docs/stories/1-8-git-auto-save.context.xml

### Agent Model Used

<!-- Will be filled during implementation -->

### Debug Log References

<!-- Will be filled during implementation -->

### Completion Notes List

<!-- Will be filled during implementation -->

### File List

**Created**:
- `src/utils/git-utils.js` (308 lines) - GitIntegration module with isGitAvailable(), createAutoSave(), and helper methods
- `tests/utils/git-utils.test.js` (642 lines) - Unit tests with 43 test cases achieving 100% statement coverage
- `tests/integration/git-integration.test.js` (297 lines) - Integration tests with 11 test cases using real Git operations

**Modified**:
- `tests/integration/commands.test.js` (line 15) - Updated import to use real GitIntegration instead of stub

## Story Completion Notes

**Implementation Date**: 2025-11-05

**Actual Effort**: ~2 hours (Small as estimated)

**Key Decisions**:
- **Multi-line commit messages via multiple -m flags**: On Windows, `git commit -m` doesn't handle newlines properly. Solved by using multiple `-m` flags (one per line) to create properly formatted multi-line commits.
- **Dependency injection pattern**: Constructor accepts `childProcess` and `cwd` parameters for testability, matching SessionLogger pattern from Story 1.7.
- **Result caching for isGitAvailable()**: Git availability check is cached after first call to avoid repeated subprocess calls.
- **Graceful error handling**: All Git errors return `success:false` with user-friendly error messages. Session ends successfully even if Git operations fail.
- **Synchronous Git operations**: Used `execSync` since session is ending (no concurrent actions), meeting < 5 second performance target.

**Challenges Encountered**:
- **Multi-line commit message formatting**: Initial implementation used single `-m` flag with `\n` separators, but Windows Git only captures first line. Fixed by building array of message lines and using multiple `-m` flags.
- **Integration test temp repo setup**: Tests needed proper Git initialization with user config and initial commit for `git rev-parse` to work.
- **Error message parsing variations**: Git error messages vary by version and OS. Made error parsing more flexible to catch "nothing to commit", "working tree clean", etc.

**Test Coverage Achieved**:
- **Unit tests**: 100% statement coverage, 95.34% branch coverage, 100% function coverage (43 tests)
- **Integration tests**: 11 tests covering complete workflows with real Git operations
- **Commands integration**: 12 tests verifying end-session workflow with GitIntegration
- **Total**: 66 tests passing

**Performance Metrics**:
- isGitAvailable(): < 10ms average (cached after first call)
- createAutoSave(): 1.5-2.5 seconds average with real Git operations (target: < 5s) ✅
- Integration test suite: ~22 seconds total for 11 tests with temp repo setup/teardown
