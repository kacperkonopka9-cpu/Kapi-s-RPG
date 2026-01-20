# Sprint Change Proposal
**Date:** 2025-11-09
**Project:** Kapi-s-RPG
**Prepared by:** Scrum Master Agent
**Change Scope:** Moderate (Backlog Reorganization)

---

## 1. Issue Summary

### Problem Statement
The bmm-workflow-status.md file contains **outdated and inconsistent information** that does not reflect the actual project state:

- **Workflow status** indicates: "NEXT_ACTION: Draft Story 2.7 (State Auto-Update)"
- **Actual sprint status** shows: Story 2.7 is already marked "done" in sprint-status.yaml
- **Epic 2 completion**: All 9 stories (2-1 through 2-9) are marked "done"
- **Result**: Workflow system attempting to create already-completed stories, blocking progression to Epic 3

### Discovery Context
- **Trigger**: User initiated `create-story` workflow
- **Detection Point**: Workflow analyzed sprint-status.yaml and found no "backlog" stories in Epic 2
- **First backlog story found**: 3-1-dice-rolling-module (Epic 3)
- **Epic 3 status**: "backlog" (not contexted - cannot draft stories yet)

### Evidence
1. **sprint-status.yaml (lines 56-66):**
   - All Epic 2 stories 2-1 through 2-9 marked "done"
   - Story 2-9 marked as duplicate: "Duplicate of 2-7 (WorldStatePropagator delivered in state-auto-update)"
   - epic-2-retrospective: "optional"

2. **bmm-workflow-status.md (lines 14-24):**
   - CURRENT_PHASE: 4
   - CURRENT_WORKFLOW: create-story
   - NEXT_ACTION: Draft Story 2.7 (State Auto-Update)
   - Last Updated: 2025-11-09

3. **Proof of Epic 2 completion:**
   - tech-spec-epic-2.md: All "In Scope" items marked ✅ (lines 17-31)
   - Story files exist: 2-7-state-auto-update.md, 2-8-moon-phase-weather.md
   - Epic 1 retrospective completed (epic-1-retrospective: completed)

---

## 2. Impact Analysis

### Epic Impact Assessment

#### Current Epic (Epic 2)
**Status:** All stories complete, workflow status outdated
**Required Changes:**
- Mark Epic 2 as complete in bmm-workflow-status.md
- Decide on retrospective (currently optional)
- Update CURRENT_WORKFLOW and NEXT_ACTION

**Can Epic be completed as planned?** YES - Epic 2 is actually already complete.

#### Next Epic (Epic 3)
**Status:** Marked "backlog" - not yet contexted
**Required Changes:**
- Epic 3 must be contexted before story drafting can begin
- Run tech-spec workflow for Epic 3
- Update epic-3 status from "backlog" to "contexted"

**Blockers:**
- Cannot draft Story 3-1 until Epic 3 is contexted
- Workflow rules: "Epics must be 'contexted' before stories can be drafted"

#### Future Epics (Epic 4, 5)
**Status:** Remain in backlog
**Impact:** None - no changes needed

**Priority/Sequencing Changes:** None required

---

### Artifact Conflicts and Alignment

#### PRD (GDD.md)
**Conflict:** None
**Alignment:** Epic 2 completion aligns with GDD expectations (Calendar & Dynamic World System implemented)
**Action:** No updates needed

#### Architecture (technical-architecture.md)
**Conflict:** None
**Alignment:** Architecture §5 (Calendar System) fully implemented per tech-spec-epic-2.md
**Action:** No updates needed

#### Sprint Status (sprint-status.yaml)
**Conflict:** **Accurate and up-to-date**
**Alignment:** Correctly reflects Epic 2 completion
**Action:** No changes to sprint-status.yaml needed - this is the source of truth

#### Workflow Status (bmm-workflow-status.md)
**Conflict:** **CRITICAL - Outdated**
**Misalignment:** Shows "Draft Story 2.7" as next action when 2.7 is complete
**Action:** **MUST UPDATE** to reflect Epic 2 completion and Epic 3 transition

#### Tech Specs
**Status:**
- tech-spec-epic-1.md: Exists ✅
- tech-spec-epic-2.md: Exists ✅
- tech-spec-epic-3.md: **MISSING** ❌

**Action:** Generate tech-spec-epic-3.md before story creation

---

## 3. Path Forward Analysis

### Option 1: Direct Adjustment (Update Status & Context Epic 3) ✅ RECOMMENDED
**Description:** Update bmm-workflow-status.md to reflect reality, then proceed to Epic 3 contexting

**Steps:**
1. Update bmm-workflow-status.md:
   - Set PHASE_4_COMPLETE: false (still in implementation)
   - Set CURRENT_WORKFLOW: retrospective (optional) OR tech-spec
   - Set NEXT_ACTION: "Run Epic 2 retrospective (optional)" OR "Context Epic 3"
   - Set NEXT_COMMAND: /bmad:bmm:workflows:retrospective OR /bmad:bmm:workflows:tech-spec
   - Set NEXT_AGENT: sm OR architect

2. **Decision Point:** Run Epic 2 retrospective?
   - **Option A:** Run retrospective now (recommended for continuity, even if optional)
   - **Option B:** Skip retrospective, proceed directly to Epic 3 contexting

3. Context Epic 3:
   - Run /bmad:bmm:workflows:tech-spec for Epic 3
   - Generate tech-spec-epic-3.md
   - Update sprint-status.yaml: epic-3: contexted

4. Resume story creation:
   - Run /bmad:bmm:workflows:create-story
   - Draft Story 3-1-dice-rolling-module

**Effort:** Low (1-2 hours)
**Risk:** Low (simple status update)
**Timeline Impact:** Minimal (half day)

**Viability:** ✅ **VIABLE - Recommended Approach**

---

### Option 2: Rollback (Not Applicable)
**Analysis:** No work needs to be rolled back - Epic 2 is correctly complete
**Viability:** ❌ **NOT VIABLE** - Nothing to rollback

---

### Option 3: MVP Review (Not Applicable)
**Analysis:** MVP scope unaffected - Epic 2 completion is on track
**Viability:** ❌ **NOT VIABLE** - No scope reduction needed

---

### Recommended Path: Option 1 (Direct Adjustment)

**Rationale:**
1. **Accuracy:** Workflow status should reflect actual progress (Epic 2 complete)
2. **Minimal Disruption:** Simple status file update, no code or artifact changes
3. **Clear Path Forward:** Well-defined next steps (retrospective optional, then Epic 3 contexting)
4. **Low Risk:** No technical complexity, just status synchronization
5. **Fast Resolution:** Can be completed in single session

**Selected Approach:** Option 1 - Direct Adjustment

---

## 4. Detailed Change Proposals

### Change 1: Update bmm-workflow-status.md

**File:** `docs/bmm-workflow-status.md`

**Section:** Current State

**OLD (lines 12-26):**
```yaml
## Current State

CURRENT_PHASE: 4
CURRENT_WORKFLOW: create-story
CURRENT_AGENT: sm
PHASE_1_COMPLETE: true
PHASE_2_COMPLETE: true
PHASE_3_COMPLETE: true
PHASE_4_COMPLETE: false

## Next Action

NEXT_ACTION: Draft Story 2.7 (State Auto-Update) - Continue Epic 2 implementation
NEXT_COMMAND: /bmad:bmm:workflows:create-story
NEXT_AGENT: sm

---

_Last Updated: 2025-11-09_
```

**NEW:**
```yaml
## Current State

CURRENT_PHASE: 4
CURRENT_WORKFLOW: retrospective
CURRENT_AGENT: sm
PHASE_1_COMPLETE: true
PHASE_2_COMPLETE: true
PHASE_3_COMPLETE: true
PHASE_4_COMPLETE: false

## Next Action

NEXT_ACTION: Run Epic 2 retrospective (optional), then context Epic 3 before story drafting
NEXT_COMMAND: /bmad:bmm:workflows:retrospective
NEXT_AGENT: sm

## Alternative Next Action (if skipping retrospective)

ALT_NEXT_ACTION: Context Epic 3 (D&D 5e Mechanics Integration) to enable story creation
ALT_NEXT_COMMAND: /bmad:bmm:workflows:tech-spec
ALT_NEXT_AGENT: architect

---

_Last Updated: 2025-11-09_
```

**Rationale:**
- Reflects Epic 2 completion (all 9 stories done)
- Offers retrospective as optional step (maintains workflow continuity)
- Provides alternative path if user wants to skip retrospective
- Sets up Epic 3 contexting as critical next step before story creation
- Maintains phase 4 as incomplete (Epic 3, 4, 5 remain)

---

### Change 2: Update sprint-status.yaml Epic 2 Retrospective Status (Optional)

**File:** `docs/sprint-status.yaml`

**Section:** Epic 2 retrospective (line 66)

**CURRENT:**
```yaml
  epic-2-retrospective: optional
```

**IF RETROSPECTIVE COMPLETED:**
```yaml
  epic-2-retrospective: completed
```

**Rationale:**
- Mark retrospective as completed if user chooses to run it
- If skipped, leave as "optional" to indicate it was intentionally deferred
- Maintains audit trail of retrospective decision

**Decision Point:** User decides whether to run retrospective now or skip

---

### Change 3: Update sprint-status.yaml Epic 3 Status (After Contexting)

**File:** `docs/sprint-status.yaml`

**Section:** Epic 3 status (line 70)

**CURRENT:**
```yaml
  epic-3: backlog
```

**AFTER TECH-SPEC WORKFLOW:**
```yaml
  epic-3: contexted
```

**Rationale:**
- Mark Epic 3 as contexted after tech-spec-epic-3.md is generated
- Enables story drafting for Epic 3
- Follows workflow rules for epic progression

**Timing:** After /bmad:bmm:workflows:tech-spec completes

---

### Change 4: Create tech-spec-epic-3.md (New File)

**File:** `docs/tech-spec-epic-3.md` (NEW)

**Action:** Run /bmad:bmm:workflows:tech-spec workflow

**Content:** Generate comprehensive technical specification for Epic 3: D&D 5e Mechanics Integration

**Required Sections:**
- Overview (dice rolling, combat, character management, spells)
- Objectives and Scope (13 stories per sprint-status.yaml lines 71-83)
- System Architecture Alignment
- Detailed Design (modules, APIs, workflows)
- Data Models (DiceRoll, Character, Combat, Spell schemas)
- Acceptance Criteria (one per story)
- Traceability Mapping
- Dependencies (Epic 1/2 integrations)
- NFRs (performance, security, reliability)
- Risks and Assumptions
- Test Strategy

**Rationale:**
- Epic 3 cannot proceed without technical context
- Provides blueprint for 13 stories in Epic 3
- Ensures architectural consistency with Epics 1 & 2
- Defines acceptance criteria for story validation

**Timing:** Before drafting Story 3-1

---

## 5. Implementation Handoff Plan

### Change Scope Classification: **MODERATE**

**Reason:**
- Requires backlog reorganization (status file updates)
- Requires workflow execution (tech-spec for Epic 3)
- Does NOT require code changes or artifact rewrites
- Does NOT require fundamental replanning

### Handoff Recipients

**Primary:** Scrum Master (SM) Agent
**Role:** Execute workflow updates and coordinate Epic 3 contexting
**Responsibilities:**
1. Update bmm-workflow-status.md with new current/next actions
2. Coordinate with user on retrospective decision (run or skip)
3. If retrospective run: execute retrospective workflow
4. Update sprint-status.yaml if retrospective completed
5. Verify all Epic 2 stories marked done

**Secondary:** Solution Architect Agent
**Role:** Generate technical specification for Epic 3
**Responsibilities:**
1. Execute /bmad:bmm:workflows:tech-spec for Epic 3
2. Generate tech-spec-epic-3.md with all required sections
3. Update sprint-status.yaml: epic-3: contexted
4. Validate acceptance criteria map to 13 stories

**Tertiary:** User (Kapi)
**Role:** Approve changes and make retrospective decision
**Responsibilities:**
1. Approve Sprint Change Proposal
2. Decide: Run Epic 2 retrospective or skip to Epic 3 contexting
3. Review tech-spec-epic-3.md for completeness
4. Approve transition to Epic 3 story creation

### Success Criteria

**Immediate (Status Update):**
- ✅ bmm-workflow-status.md reflects Epic 2 completion
- ✅ NEXT_ACTION clearly directs to retrospective or Epic 3 contexting
- ✅ No conflicting "draft Story 2.7" message

**Short-term (Epic 3 Contexting):**
- ✅ tech-spec-epic-3.md generated and reviewed
- ✅ sprint-status.yaml: epic-3: contexted
- ✅ Story 3-1 ready for drafting

**Long-term (Workflow Continuity):**
- ✅ create-story workflow successfully drafts Story 3-1
- ✅ No further workflow inconsistencies
- ✅ Clear audit trail of Epic 2 → Epic 3 transition

---

## 6. Summary and Next Steps

### Issue Addressed
Workflow status file (bmm-workflow-status.md) was outdated and did not reflect Epic 2 completion, causing workflow to attempt creating already-completed stories.

### Change Scope
**Moderate** - Requires status file updates and Epic 3 contexting before story creation can proceed.

### Artifacts Modified
1. **bmm-workflow-status.md** - Updated to reflect Epic 2 completion ✅
2. **sprint-status.yaml** - Optional update if retrospective run ✅
3. **tech-spec-epic-3.md** - New file to be generated 📝

### Routed To
**Scrum Master (SM)** for backlog reorganization and workflow coordination.

---

## Implementation Plan

### Step 1: Update Workflow Status (Immediate)
**Owner:** SM Agent
**Action:** Edit bmm-workflow-status.md per Change Proposal 1
**Duration:** 5 minutes
**Deliverable:** Updated bmm-workflow-status.md

### Step 2: Retrospective Decision (User Input Required)
**Owner:** User (Kapi)
**Action:** Decide whether to run Epic 2 retrospective or skip
**Options:**
- **A) Run Retrospective:** Execute /bmad:bmm:workflows:retrospective (30-45 min)
- **B) Skip Retrospective:** Proceed directly to Epic 3 contexting

**Recommendation:** Run retrospective to capture learnings from Epic 2 (9 stories completed, valuable insights on calendar system implementation)

### Step 3: Context Epic 3 (Required)
**Owner:** Solution Architect Agent
**Action:** Execute /bmad:bmm:workflows:tech-spec for Epic 3
**Duration:** 1-2 hours (comprehensive technical spec)
**Deliverable:** tech-spec-epic-3.md (similar to tech-spec-epic-2.md)
**Output:** Detailed specifications for 13 stories in Epic 3

### Step 4: Update Sprint Status (After Contexting)
**Owner:** SM Agent
**Action:** Update sprint-status.yaml: epic-3: contexted
**Duration:** 2 minutes
**Trigger:** After tech-spec-epic-3.md approved

### Step 5: Resume Story Creation (Final)
**Owner:** SM Agent
**Action:** Execute /bmad:bmm:workflows:create-story
**Expected Result:** Draft Story 3-1-dice-rolling-module
**Duration:** 30-45 minutes
**Success Indicator:** Story file created at docs/stories/3-1-dice-rolling-module.md

---

## Approval Request

**Proposal Status:** Ready for Review
**Approver:** Kapi (User)

### Questions for User:

1. **Do you approve this Sprint Change Proposal?** (yes/no/revise)

2. **Retrospective Decision:** Would you like to:
   - **A)** Run Epic 2 retrospective now (recommended, 30-45 min)
   - **B)** Skip retrospective and proceed directly to Epic 3 contexting

3. **Epic 3 Scope Confirmation:** Epic 3 has 13 stories (3-1 through 3-13). Confirm scope is acceptable before generating tech spec?

---

**✅ Correct Course Workflow Complete**

This proposal provides a clear path forward to resolve the workflow status inconsistency and enable progression to Epic 3.

---

**Report Generated:** 2025-11-09
**Prepared by:** Scrum Master Agent
**Next Action:** Await user approval and retrospective decision
