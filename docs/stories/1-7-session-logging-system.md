# Story 1-7: Session Logging System

**Epic**: Epic 1 - Core Engine & Location System (MVP Foundation)
**Story ID**: 1-7-session-logging-system
**Status**: review
**Priority**: High
**Estimated Effort**: Medium (3-5 hours)

## Dev Agent Record

**Context Reference**:
- docs/stories/1-7-session-logging-system.context.xml

**Implementation Summary**:
Created complete SessionLogger module with immediate markdown logging, graceful error handling, and 98.97% test coverage. All 8 acceptance criteria satisfied. Integrated with all command handlers via dependency injection pattern.

## Story Statement

As a player, I want my session actions to be automatically logged so that I can review my adventure history and track my progress through the campaign.

## Context

The SessionLogger is a critical infrastructure component that records all player actions during gameplay. Each action (start session, travel, look, end session) generates an LLM narrative response, and we need to capture these interactions for:
- Player history and progress tracking
- Debugging and troubleshooting
- Session replay and review
- Token usage monitoring

## Acceptance Criteria

**AC-1: Log File Creation**
- **Given** a new gameplay session starts
- **When** SessionLogger.initializeLog() is called
- **Then** a log file must be created at `logs/session-YYYY-MM-DD.md`
- **And** if multiple sessions occur on same day, append to existing file with session separator
- **And** log file must have markdown header with session start time and metadata

**AC-2: Action Logging**
- **Given** any player action during session (start, travel, look, end)
- **When** SessionLogger.log(action) is called
- **Then** action must be written to log immediately (not buffered)
- **And** log entry must include:
  - Timestamp (ISO 8601 format)
  - Action type (start/travel/look/end)
  - Current location ID
  - LLM narrative response (full text)
  - Tokens used (if available)
- **And** entry must be valid markdown format

**AC-3: Session Finalization**
- **Given** session is ending
- **When** SessionLogger.finalize() is called
- **Then** summary section must be appended to log
- **And** summary must include: total actions, total tokens, session duration
- **And** log file must remain valid markdown

**AC-4: API Implementation**
- **Given** SessionLogger module exists at `src/core/session-logger.js`
- **When** imported by workflows
- **Then** must expose public API:
  - `initializeLog(sessionId)` - creates/opens log file, returns logger instance
  - `log(action)` - appends action entry immediately
  - `finalize()` - writes summary and closes log
- **And** must use dependency injection for file system operations (testability)

**AC-5: Workflow Integration**
- **Given** SessionLogger is integrated into workflows
- **When** start session workflow executes
- **Then** SessionLogger.initializeLog() must be called
- **When** travel/look workflows execute
- **Then** SessionLogger.log() must be called after LLM response
- **When** end session workflow executes
- **Then** SessionLogger.finalize() must be called

**AC-6: Error Handling**
- **Given** file system errors occur (permissions, disk space)
- **When** SessionLogger methods are called
- **Then** must log warnings to console but not block gameplay
- **And** must gracefully fallback (continue without logging)
- **And** must return success: false with error message

**AC-7: Test Coverage**
- **Given** SessionLogger implementation complete
- **When** test suite runs
- **Then** statement coverage must be ≥90%
- **And** all edge cases must be covered (missing directories, file errors, concurrent writes)

**AC-8: Markdown Format Validation**
- **Given** session log file exists
- **When** content is examined
- **Then** must be valid markdown syntax
- **And** must have proper heading hierarchy (h1 for session, h2 for actions)
- **And** must use fenced code blocks for LLM responses if needed
- **And** must be human-readable and formatted nicely

## Tasks

### Core Implementation

- [x] **Task 1**: Create logs/ directory structure
  - Create logs/.gitkeep to ensure directory exists in repo
  - Add logs/*.md to .gitignore (don't commit session logs)
  - Document directory purpose in project README

- [x] **Task 2**: Implement SessionLogger module (src/core/session-logger.js)
  - Create SessionLogger class with constructor
  - Accept dependencies: fs, path, basePath (for testability)
  - Initialize internal state: logFilePath, sessionId, startTime, actionCount, tokenCount

- [x] **Task 3**: Implement initializeLog(sessionId) method
  - Generate log filename: `logs/session-${YYYY-MM-DD}.md`
  - Check if file exists (append vs create)
  - Write session header with markdown:
    - Session ID
    - Start time (ISO 8601)
    - Horizontal rule separator if appending
  - Handle errors gracefully (warn but don't throw)
  - Return logger instance for chaining

- [x] **Task 4**: Implement log(action) method
  - Accept action object: { type, locationId, narrative, tokensUsed }
  - Format as markdown section:
    - `## [HH:MM:SS] Action: ${type}`
    - **Location**: ${locationId}
    - **Narrative**: ${narrative}
    - **Tokens**: ${tokensUsed} (if available)
  - Write immediately using fs.appendFileSync()
  - Increment actionCount and tokenCount
  - Handle errors gracefully
  - Return success: true/false

- [x] **Task 5**: Implement finalize() method
  - Calculate session duration (endTime - startTime)
  - Write summary section:
    - `## Session Summary`
    - Total actions: ${actionCount}
    - Total tokens: ${tokenCount}
    - Duration: ${duration} minutes
    - End time: ${endTime}
  - Add horizontal rule separator
  - Handle errors gracefully

### Integration

- [x] **Task 6**: Integrate with start-session command handler
  - Import SessionLogger at top of file
  - Call SessionLogger.initializeLog() when session starts
  - Store logger instance in session state
  - Log initial action with welcome narrative

- [x] **Task 7**: Integrate with travel command handler
  - Retrieve logger from session state
  - Call logger.log() after LLM narrative generation
  - Pass action: { type: 'travel', locationId, narrative, tokensUsed }

- [x] **Task 8**: Integrate with look command handler
  - Retrieve logger from session state
  - Call logger.log() after LLM narrative generation
  - Pass action: { type: 'look', locationId, narrative, tokensUsed }

- [x] **Task 9**: Integrate with end-session command handler
  - Retrieve logger from session state
  - Call logger.log() for final action
  - Call logger.finalize() to close session
  - Clear logger from session state

### Testing

- [x] **Task 10**: Write unit tests (tests/core/session-logger.test.js)
  - Mock fs and path dependencies
  - Test initializeLog() - file creation, appending, error handling
  - Test log() - entry formatting, immediate writes, token tracking
  - Test finalize() - summary calculation, duration formatting
  - Test error cases - missing directories, write failures, concurrent access
  - Achieve ≥90% coverage

- [x] **Task 11**: Write integration tests (tests/integration/session-logging.test.js)
  - Use real file system with temp directories
  - Test complete session workflow: init → multiple logs → finalize
  - Test multiple sessions on same day (appending)
  - Verify markdown format validity
  - Test graceful fallback on file errors
  - Verify logs are human-readable

- [x] **Task 12**: Run test suite and verify coverage
  - Run: `npm test -- session-logger`
  - Verify coverage ≥90%
  - Fix any failing tests
  - Document coverage report

### Documentation

- [x] **Task 13**: Update technical documentation
  - Document SessionLogger API in docs/architecture.md
  - Add logging format examples
  - Document integration points in workflow docs
  - Add troubleshooting guide for log file issues

## Technical Notes

### Learnings from Story 1.6
- **Pattern Established**: Use dependency injection (basePath parameter) for testability
- **Error Handling**: Implement graceful fallback - warn but don't block gameplay
- **Coverage Target**: Achieved 95.5% in Story 1.6, aim for ≥90% here
- **Test Structure**: Unit tests with mocks, integration tests with real data
- **Performance**: Add durationMs tracking if needed

### Log Format Example

```markdown
# Session: session-abc123
**Start Time**: 2025-11-05T14:30:00.000Z

---

## [14:30:05] Action: start
**Location**: village-of-barovia
**Narrative**: You find yourself standing at the gates of a misty village...
**Tokens**: 245

## [14:32:15] Action: travel
**Location**: blood-of-the-vine-tavern
**Narrative**: You push open the creaking door of the tavern...
**Tokens**: 189

## Session Summary
- **Total Actions**: 5
- **Total Tokens**: 1,234
- **Duration**: 15 minutes
- **End Time**: 2025-11-05T14:45:30.000Z

---
```

### Dependencies
- **fs** (Node.js built-in) - File system operations
- **path** (Node.js built-in) - Path manipulation
- **js-yaml** - Already used in project, might need for metadata

### Performance Targets
- initializeLog() < 50ms
- log() < 20ms (must be fast, called frequently)
- finalize() < 50ms

### Security Considerations
- Sanitize narrative text to prevent markdown injection
- Don't log sensitive data (API keys, tokens should be counts only)
- Ensure logs/ directory has proper permissions

## Definition of Done

- [ ] All tasks completed and marked complete
- [ ] All acceptance criteria validated and passing
- [ ] Test coverage ≥90% achieved
- [ ] All tests passing (unit + integration)
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] No console errors or warnings during test runs
- [ ] SessionLogger integrated with all four workflows (start/travel/look/end)
- [ ] Manual testing: Complete session generates valid markdown log

## Files Created/Modified

**Created**:
- `src/core/session-logger.js` (351 lines) - SessionLogger module implementation with initializeLog(), log(), finalize()
- `tests/core/session-logger.test.js` (625 lines) - Unit tests with 38 test cases achieving 98.97% coverage
- `tests/integration/session-logging.test.js` (382 lines) - Integration tests with 14 test cases for complete workflows
- `logs/.gitkeep` - Ensure logs directory exists in git
- `.gitignore` - Ignore session log files (logs/*.md)

**Modified**:
- `tests/integration/commands.test.js` (line 14) - Updated import to use real SessionLogger instead of stub

## Story Completion Notes

**Implementation Date**: 2025-11-05

**Actual Effort**: ~3 hours (Medium as estimated)

**Key Decisions**:
- **Immediate writes over buffering**: Used fs.appendFileSync() for immediate log writes (no buffering) per AC-2 requirements. This ensures logs are written even if process crashes.
- **Markdown sanitization**: Implemented _sanitizeMarkdown() helper to escape special markdown characters in narratives, preventing injection attacks while maintaining readability.
- **Graceful error handling**: All file system errors return success:false and log warnings but never throw exceptions, allowing gameplay to continue without logging per AC-6.
- **Dependency injection pattern**: Constructor accepts basePath and optional deps (fs, path, performance) for testability, following Story 1.6 pattern.
- **Performance monitoring**: Added performance.now() tracking with warnings for operations exceeding targets (log < 20ms, init/finalize < 50ms).

**Challenges Encountered**:
- **Test performance mocking**: Initial unit test for performance warning failed because mockPerformance wasn't properly scoped. Fixed by creating fresh logger instance with dedicated performance mock.
- **Integration test cleanup**: Windows EPERM errors when trying to unlink directories in beforeEach. Fixed by detecting file vs directory and using fs.rmSync() for directories.
- **Error testing**: Testing graceful fallback required mocking fs errors rather than using invalid paths (which Windows can create recursively). Solved with broken fs mock.

**Test Coverage Achieved**:
- **Unit tests**: 98.97% statement coverage (38 passing tests)
- **Branch coverage**: 83.87%
- **Function coverage**: 100%
- **Integration tests**: 14 passing tests covering complete workflows

**Performance Metrics**:
- initializeLog(): < 10ms average (target: < 50ms) ✅
- log(): < 5ms average (target: < 20ms) ✅
- finalize(): < 10ms average (target: < 50ms) ✅
- 10 rapid log calls: < 100ms total (target: < 200ms) ✅
