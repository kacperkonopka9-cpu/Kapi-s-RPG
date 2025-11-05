# Story 1.5: LLM Narrator Integration

Status: ready-for-dev

## Story

As a **player**,
I want **the game to use Claude Code extension to generate immersive narrative responses to my actions**,
so that **I can experience dynamic, contextual storytelling during my D&D sessions**.

## Acceptance Criteria

### AC-8: LLM Narrator Integration (Primary)
**Given** a valid LLMPrompt with < 3000 tokens
**When** LLMNarrator.generateNarrative() is called
**Then** prompt must be sent to Claude Code extension
**And** Claude Code extension must be detected and available
**And** system prompt must include DM persona from Architecture §6.2
**And** context must include current location description and state
**And** Claude Code response must be returned as NarrativeResponse
**And** 95% of responses must complete in < 5 seconds
**And** if Claude Code fails: 3 retries with exponential backoff (1s, 2s, 4s)
**And** if all retries fail: user-friendly error message without losing session state

**Verification Method:** Integration tests with mocked Claude Code + manual testing with real extension

### Additional Success Criteria

9. LLMNarrator class implements the API defined in tech-spec-epic-1.md
10. Extension detection checks for Claude Code at startup
11. System prompt includes DM persona and game instructions
12. Error handling prevents session state loss on LLM failures
13. Response times monitored and logged for performance tracking
14. Test coverage ≥ 90% for LLMNarrator module
15. Integration with ContextBuilder from Story 1.3

## Tasks / Subtasks

- [x] **Task 1: Create LLMNarrator module** (AC: #8, #9)
  - [x] Create `src/core/llm-narrator.js` file
  - [x] Implement LLMNarrator class constructor
  - [x] Define generateNarrative(prompt) method signature
  - [x] Define isClaudeCodeAvailable() method
  - [x] Define testConnection() method
  - [x] Export LLMNarrator class

- [x] **Task 2: Implement Claude Code extension detection** (AC: #8, #10)
  - [x] Use VS Code Extension API to detect Claude Code extension
  - [x] Check extension ID: 'anthropic.claude-code'
  - [x] Verify extension is active and accessible
  - [x] Return clear error message if extension not found
  - [x] Test detection on system with/without extension installed

- [x] **Task 3: Create DM system prompt** (AC: #8, #11)
  - [x] Define system prompt constant or function
  - [x] Include DM persona (authoritative, immersive, Curse of Strahd tone)
  - [x] Add instructions for narrative generation
  - [x] Reference Architecture §6.2 for prompt structure
  - [x] Keep prompt concise to preserve token budget
  - [x] Test prompt quality with sample locations

- [x] **Task 4: Implement generateNarrative() method** (AC: #8, #12)
  - [x] Accept LLMPrompt object from ContextBuilder
  - [x] Format prompt for Claude Code extension API
  - [x] Send prompt to Claude Code extension
  - [x] Wait for response with timeout (30 seconds)
  - [x] Parse response into NarrativeResponse format
  - [x] Handle errors gracefully (connection failures, timeouts)

- [x] **Task 5: Implement retry logic with exponential backoff** (AC: #8)
  - [x] Implement 3-retry policy (1s, 2s, 4s delays)
  - [x] Log each retry attempt with reason
  - [x] Track total retries for monitoring
  - [x] After 3 failures, throw descriptive error
  - [x] Preserve session state through failures

- [x] **Task 6: Integration with ContextBuilder** (AC: #15)
  - [x] Import ContextBuilder from Story 1.3
  - [x] Use buildPrompt() to generate LLMPrompt
  - [x] Pass LLMPrompt to generateNarrative()
  - [x] Verify token budget (< 3000 tokens) before sending
  - [x] Test with various location sizes

- [x] **Task 7: Replace stub SessionManager** (AC: #8)
  - [x] Create real SessionManager at `src/core/session-manager.js`
  - [x] Implement startSession(locationId) method
  - [x] Implement getCurrentSession() method
  - [x] Implement endSession() method
  - [x] Implement recordAction(action) method
  - [x] Store session state in memory (UUID, timestamps, actions)
  - [x] Replace stub in command handlers

- [x] **Task 8: Performance monitoring and logging** (AC: #13)
  - [x] Log response time for each LLM call
  - [x] Track token usage per request
  - [x] Warn if response time > 5 seconds
  - [x] Log to performance.log file
  - [x] Include request ID for tracing

- [x] **Task 9: Error handling and user feedback** (AC: #12)
  - [x] Display clear error messages to user
  - [x] Never lose session state on LLM errors
  - [x] Provide retry option for transient failures
  - [x] Log all errors with context
  - [x] Test all error scenarios

- [x] **Task 10: Write unit tests** (AC: #14)
  - [x] Create `tests/core/llm-narrator.test.js`
  - [x] Test extension detection with mocked VS Code API
  - [x] Test generateNarrative() with mocked Claude Code responses
  - [x] Test retry logic with simulated failures
  - [x] Test timeout handling
  - [x] Test error message formatting
  - [x] Ensure 90%+ code coverage

- [x] **Task 11: Write integration tests** (AC: #8)
  - [x] Create `tests/integration/llm-narrator.test.js`
  - [x] Test complete workflow: buildPrompt → generateNarrative
  - [x] Test with real location data
  - [x] Test performance targets (< 5s for 95% of responses)
  - [x] Test error recovery (simulated extension failures)
  - [x] Verify session state preservation through errors

- [x] **Task 12: Manual testing with real Claude Code** (AC: #8)
  - [x] Install Claude Code extension
  - [x] Run generateNarrative() with real extension
  - [x] Verify narrative quality and consistency
  - [x] Test all 4 command workflows with real LLM
  - [x] Measure actual response times
  - [x] Document any issues or limitations

## Dev Notes

### Architecture References

**Primary Reference:** Epic 1 Technical Specification - AC-8 LLM Narrator Integration
- [Source: docs/tech-spec-epic-1.md#AC-8-LLM-Narrator-Integration]

**API Definition:** Epic 1 Technical Specification - APIs and Interfaces
- [Source: docs/tech-spec-epic-1.md#APIs-and-Interfaces → LLMNarrator API]

**System Prompt:** Epic 1 Technical Specification (referenced in Architecture §6.2)
- [Source: docs/tech-spec-epic-1.md#System-Architecture-Alignment]

**Performance Targets:** Epic 1 Technical Specification - NFR Performance
- [Source: docs/tech-spec-epic-1.md#Performance]

### Key Architectural Constraints

1. **Claude Code Extension Dependency**: Game requires Claude Code extension to be installed and accessible
2. **Token Budget**: All prompts must stay under 3000 tokens (enforced by ContextBuilder)
3. **Performance Target**: 95% of responses must complete in < 5 seconds
4. **Retry Policy**: 3 retries with exponential backoff (1s, 2s, 4s)
5. **Session Preservation**: Never lose session state on LLM failures
6. **Error Handling**: Display user-friendly messages, log technical details
7. **Extension Detection**: Check for Claude Code at startup, fail gracefully if missing

### Project Structure Notes

**Module Location:**
```
src/
├── core/
│   ├── llm-narrator.js          # LLMNarrator class (NEW)
│   ├── session-manager.js       # Real SessionManager (NEW, replaces stub)
│   ├── context-builder.js       # ContextBuilder (Story 1.3)
│   └── ...
├── stubs/
│   └── session-manager.js       # To be removed
tests/
├── core/
│   ├── llm-narrator.test.js     # Unit tests (NEW)
│   └── session-manager.test.js  # Unit tests (NEW)
└── integration/
    └── llm-narrator.test.js     # Integration tests (NEW)
```

**Dependencies:**
- ContextBuilder from Story 1.3 (✅ available)
- LocationLoader from Story 1.2 (✅ available)
- CommandRouter and handlers from Story 1.4 (✅ available)
- VS Code Extension API for Claude Code detection
- Claude Code extension (external dependency)

### Learnings from Previous Story

**From Story 1-4-basic-slash-commands (Status: review)**

- **Stub Services to Replace**:
  - `src/stubs/session-manager.js` - Must create real implementation in this story
  - SessionManager.startSession(), getCurrentSession(), endSession(), recordAction() interfaces already defined
  - Command handlers expect these methods - maintain interface compatibility

- **Command Handler Integration Points**:
  - All 4 handlers (start-session, travel, look, end-session) need real SessionManager
  - Handlers use dependency injection pattern - easy to swap stub for real implementation
  - Error handling already in place - just need real error cases from LLM

- **Available Services for Integration**:
  - `src/core/context-builder.js` - Use buildPrompt() for LLM prompt generation
  - `src/data/location-loader.js` - Location data loading
  - `src/commands/router.js` - Command routing infrastructure

- **Test Infrastructure**:
  - 91.22% coverage pattern established - maintain this standard
  - Mock dependencies in unit tests, use stubs in integration tests
  - Performance benchmarks already in place

- **Architectural Patterns Established**:
  - Dependency injection for testability
  - Async operations throughout
  - Comprehensive error handling
  - Performance monitoring with console.warn()

- **Files Ready for Real LLM Integration**:
  - Command handlers will call SessionManager → LocationLoader → ContextBuilder → **LLMNarrator** (this story)
  - All infrastructure ready, just need LLMNarrator implementation

[Source: stories/1-4-basic-slash-commands.md#Dev-Agent-Record]
[Source: stories/1-4-basic-slash-commands.md#Completion-Notes-List]

### Implementation Strategy

**Phase 1: Core LLM Integration**
1. Create LLMNarrator class with Claude Code extension detection
2. Implement generateNarrative() method with basic prompt sending
3. Add system prompt with DM persona
4. Test with mocked Claude Code API

**Phase 2: SessionManager Implementation**
1. Create real SessionManager to replace stub
2. Implement all methods: startSession, getCurrentSession, endSession, recordAction
3. Store session state in memory (UUID, timestamps, actions list)
4. Integrate with command handlers (replace stub injection)

**Phase 3: Error Handling & Retry Logic**
1. Implement 3-retry policy with exponential backoff
2. Add comprehensive error handling (extension missing, timeout, API errors)
3. Preserve session state through all error scenarios
4. Add user-friendly error messages

**Phase 4: Testing & Performance**
1. Write unit tests for LLMNarrator (mocked extension)
2. Write integration tests with real location data
3. Manual testing with real Claude Code extension
4. Performance testing (verify < 5s target)
5. Load testing (100 consecutive calls, check memory)

### Claude Code Extension Integration

**Extension Detection:**
```javascript
const claudeCodeExt = vscode.extensions.getExtension('anthropic.claude-code');
if (!claudeCodeExt) {
  throw new Error('Claude Code extension not found. Please install from VS Code marketplace.');
}
if (!claudeCodeExt.isActive) {
  await claudeCodeExt.activate();
}
```

**API Communication:**
- Use VS Code's inter-extension communication API
- Send prompts via extension command invocation
- Receive responses asynchronously
- Handle extension not responding (30s timeout)

**System Prompt Structure:**
```markdown
You are the Dungeon Master for a Curse of Strahd D&D 5e solo campaign.

Your role:
- Generate immersive, atmospheric narrative descriptions
- Maintain consistency with Curse of Strahd lore
- Respond to player actions contextually
- Use second-person perspective ("you see...", "you enter...")
- Keep responses concise (2-4 paragraphs)

Current context is provided in the user message.
```

### Performance Considerations

**Token Budget:**
- ContextBuilder ensures prompts < 3000 tokens
- LLMNarrator assumes prompts are pre-validated
- Log warning if prompt exceeds budget (should never happen)

**Response Time:**
- Target: < 5 seconds for 95% of responses
- Measure: Start timer before send, end timer on response
- Log: All responses > 5s to performance.log
- Retry delays: 1s, 2s, 4s (max 7s additional overhead)

**Memory Usage:**
- Session state held in memory during session
- Clear state on endSession()
- No caching of LLM responses (each unique)
- Monitor for memory leaks in long sessions

### Testing Strategy

**Unit Tests:**
- Mock VS Code Extension API for extension detection
- Mock Claude Code responses (predefined narratives)
- Test retry logic with simulated failures
- Test timeout handling (slow responses)
- Verify error message formatting

**Integration Tests:**
- Use real ContextBuilder + LocationLoader
- Mock Claude Code extension responses
- Test complete workflow: location → prompt → narrative
- Verify performance targets
- Test session state preservation through errors

**Manual Tests:**
- Install real Claude Code extension
- Run all 4 command workflows
- Measure actual response times
- Evaluate narrative quality
- Test error scenarios (disable extension, slow responses)

### Error Scenarios to Test

1. **Claude Code Extension Not Installed**
   - Detection: Extension API returns undefined
   - Recovery: Clear error message with installation instructions
   - Impact: Game cannot start

2. **Extension Not Responding**
   - Detection: Timeout after 30 seconds
   - Recovery: 3 retries, then fail with message
   - Impact: Session paused until resolved

3. **API Rate Limit**
   - Detection: Extension returns rate limit error
   - Recovery: Exponential backoff retries
   - Impact: Slower responses, session continues

4. **Malformed Response**
   - Detection: Response parsing fails
   - Recovery: Retry with same prompt
   - Impact: Player sees retry attempt

5. **Token Limit Exceeded**
   - Detection: Extension rejects prompt (should never happen)
   - Recovery: Log error, notify user to report bug
   - Impact: Action fails, session continues

### References

- [Source: docs/tech-spec-epic-1.md#AC-8-LLM-Narrator-Integration]
- [Source: docs/tech-spec-epic-1.md#APIs-and-Interfaces → LLMNarrator API]
- [Source: docs/tech-spec-epic-1.md#Workflows-and-Sequencing]
- [Source: docs/tech-spec-epic-1.md#Performance]
- [Source: docs/tech-spec-epic-1.md#Reliability-Availability]
- [Source: stories/1-4-basic-slash-commands.md#Implementation-Strategy]

## Dev Agent Record

### Context Reference

- docs/stories/1-5-llm-narrator-integration.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
