# Prompts

Reusable prompts for story and epic workflow.

---

## Table of Contents

| #   | Prompt                                                   | Purpose                                                                |
| --- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | [Scan Story & Create Tasks](#1-scan-story--create-tasks) | Understand story context, research, generate phase-based task list     |
| 2   | [Story Execution](#2-story-execution)                    | Execute tasks systematically with quality gates                        |
| 3   | [Follow-Up Audit](#3-follow-up-audit)                    | Independent post-implementation audit of a story                       |
| 4   | [Epic-Level Verification](#4-epic-level-verification)    | Final release audit of entire epic                                     |
| 5   | [Epic Document Creation](#5-epic-document-creation)      | Create a structured epic document with stories and acceptance criteria |
| 6   | [Epic Alignment Check](#6-epic-alignment-check)          | Verify epic document matches current implementation                    |

---

## 1. Scan Story & Create Tasks

**Use when:** Starting work on a new story.

```
Scan [story]

Understand not just what is being built, but why, and how it fits into the broader epic.
Then scan all referenced and relevant files in the project to understand:

- Existing patterns, conventions, and architecture in use
- What's already built that this story connects to or depends on
- Any constraints or decisions already made that affect implementation

Search the web for the best approaches to implement this story — prioritize recent, production-proven patterns over generic solutions. Factor in what you've learned about the project's existing stack and conventions when evaluating what you find.

Then synthesize everything into a detailed phase-based task list that:

- Is specific to this project — not generic steps
- Is ordered by logical implementation sequence
- Is comprehensive enough that nothing is left ambiguous
- Strictly satisfies every requirement stated in the story — nothing more, nothing less
- Stays fully in scope — if something isn't explicitly required or directly necessary to meet the story's criteria, it does not belong in the plan

Before finalizing the task list, run a scope check — review each phase against the story requirements and remove or flag anything that exceeds the story's boundaries.

Populate your to-dos with the phases only.

Finally, report back with:

- A concise summary of what this story is about and its purpose within the epic
- Confirmation that the plan covers all story criteria and nothing outside them
- Any ambiguities, risks, or decision points flagged upfront — before implementation begins
- Your confidence level in the planned approach

Do not begin implementing until instructed.
```

---

## 2. Story Execution

**Use when:** Executing tasks from a story's task list.

```
Work through each task in order. For every task:

- Implement it fully and meticulously
- Do a thorough review before moving on — confirm it's correct, complete, in scope, and error-free
- Do not proceed to the next task until you're 100% confident the current one is done right
- You are to stop after the last instructed task
- If you need input from the user at any point, stop and explain clearly what's needed and why

When all tasks are complete, walk the user through verifying each one step by step.
```

---

## 3. Follow-Up Audit

**Use when:** Post-implementation audit of a single story.

```
You are a senior developer with 10+ years of production experience. You do not guess, you do not assume, and you do not move on until something is probably correct. Apply that standard now.

Conduct a full independent audit of everything just implemented against the story requirements. Treat this as a code review where your reputation is on the line.

For every implemented task, verify the following without exception:

- Every requirement stated in the story is met — read each one explicitly, then find the exact code that satisfies it
- No requirement has been partially implemented, loosely interpreted, or quietly skipped
- All edge cases are handled — think adversarially about what could break
- No logic errors, off-by-one conditions, or silent failure paths exist
- Every affected file is consistent with the changes — no orphaned logic, dangling references, or missed updates elsewhere in the codebase
- The implementation matches the story's intent, not just its surface wording

Strict hallucination check: if you cannot point to specific, visible code that satisfies a requirement — do not claim it's done. Flag it immediately.

If anything fails this audit — fix it, then re-audit that specific item from scratch before continuing. Do not carry forward unresolved issues.

Only when every item passes, close with:

- A per-task confirmation of what was verified and where — specific files and logic, not vague summaries
- An honest confidence assessment — if it's not 100%, state what's holding it back and why
- A clear statement that the implementation is complete, correct, and production-ready

If you cannot make that final statement with full confidence — say so, and list exactly what still needs attention.
```

---

## 4. Epic-Level Verification

**Use when:** Final release audit of an entire epic.

```
You are a lead engineer with 10+ years of production experience conducting a final release audit. You are the last line of defense before this epic ships. You do not approve what you cannot prove. Apply that standard to everything that follows.

Scan the full epic and every story within it. Then conduct a deep, independent audit of the entire implementation in the project folder — story by story, requirement by requirement.

For every story, verify without exception:

- Every requirement is fully implemented — locate the exact code that satisfies each one explicitly
- No requirement has been partially built, loosely interpreted, quietly skipped, or implemented in a way that misses the original intent
- The implementation reflects the story's purpose within the broader epic — not just its isolated wording
- All edge cases are accounted for — think adversarially about what could fail in production
- No logic errors, silent failure paths, or off-by-one conditions exist
- Every affected file is internally consistent — no orphaned logic, dangling references, stale code, or missed updates across the codebase
- No feature or behaviour exists in the code that isn't justified by a story requirement — no scope creep, no unsanctioned additions

Strict hallucination check: if you cannot point to specific, visible code that satisfies a requirement — do not claim it's done. Flag it immediately. Do not infer, assume, or fill gaps with confidence you haven't earned.

Cross-story consistency check: once individual stories pass, verify the epic as a whole:

- Stories that depend on each other are correctly integrated end-to-end
- Shared components, utilities, and data flows are consistent across all stories
- No story's implementation breaks or conflicts with another's
- The full implementation, taken together, delivers what the epic set out to build

Deliver a structured report as follows:

### Per-Story Verdict

- ✅ **Fully implemented** — specific files and logic confirmed, requirement by requirement
- ⚠️ **Partially implemented** — exactly what's missing, incomplete, or underbuilt, with file references
- ❌ **Incorrect or not implemented** — what was found vs. what's required, and what it would take to fix it

### Epic-Level Verdict

- Overall confidence assessment — if it's not 100%, state exactly what's holding it back
- A prioritized list of everything that must be resolved before this epic is marked complete
- A clear, honest final statement on whether this epic is production-ready

If you cannot make that final statement with full confidence — say so explicitly. Do not sign off on what you cannot prove.
```

---

## 5. Epic Document Creation

**Use when:** Creating a new epic document for a set of related stories.

```
Create Epic [N] — [Epic Title]

You are writing an epic document that will guide implementation of a major feature area. This document must be actionable, specific, and aligned with the project's PRD and existing architecture.

## Phase 1: Research & Context Gathering

Scan the following to understand what this epic needs to accomplish:

1. **PRD sections** referenced by this epic — read each section thoroughly, extract every requirement, constraint, and acceptance criterion
2. **Design SVGs** in `docs/design/High-fidelity-svgs/` — identify all screens, components, layouts, colors, and interactions relevant to this epic
3. **Existing codebase** — understand what's already built that this epic connects to or depends on
4. **Previous epics** — read `docs/epics/epic-*.md` to understand the established document structure, conventions, and status workflow
5. **MEMORY.md** — check for decisions, constraints, and gotchas that affect this epic
6. **Web research** — search for best practices, production-proven patterns, and common pitfalls for the features this epic covers

## Phase 2: Story Decomposition

Break the epic into stories following these rules:

- Each story must be **independently testable** — you can verify it works without requiring other stories to be complete
- Each story must have **clear acceptance criteria** using EARS format (AC1, AC2, AC3...)
- Stories must be **ordered by dependency** — earlier stories don't depend on later ones
- Each story must include **specific file paths** where implementation will happen
- Each story must reference **exact design elements** (SVG filenames, line numbers, pixel values, colors)
- Stories should be **scope-bounded** — nothing extra beyond what the ACs require
- Include a **Tasks** line mapping each task to specific ACs: `T1 (AC1-AC2) description · T2 (AC3) description`

## Phase 3: Document Structure

Create the epic document with this exact structure:

```

# Epic [N] — [Title]

**Status:** ready
**Source:** [PRD section links with anchors]

## Design References

| Reference | File                                        |
| --------- | ------------------------------------------- |
| [Name]    | `docs/design/High-fidelity-svgs/[file].svg` |

## Goal

[One paragraph: what this epic achieves and why it matters]

## Definition of Done

[One paragraph: the aggregate completion state across all stories]

## Story Index

| ID  | Title   | Depends on | Status |
| --- | ------- | ---------- | ------ |
| N.0 | [Title] | —          | ready  |
| N.1 | [Title] | N.0        | ready  |

[instructional paragraph about dependency order and status workflow]

---

### Story N.0 — [Title]

**Status:** ready
**Design Refs:** [specific SVG files and elements]
**Story:** As the [role], I want [goal] so that [benefit].

**Acceptance Criteria (EARS):**

- AC1: The system shall [specific, testable requirement]
- AC2: The system shall [specific, testable requirement]
- AC3: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) description · T2 (AC3) description

**Out of scope:** [what this story does NOT cover, with cross-references]

**Dev Notes:**

- T1: [implementation guidance, code patterns, token values, PRD REQ citations]
- T2: [implementation guidance]

```

## Phase 4: Validation

Before finalizing, verify:

- [ ] Every story has a unique ID (no duplicates)
- [ ] Every dependency reference points to an existing story ID
- [ ] Every AC is specific and testable (no vague language like "should be good")
- [ ] Every Design Ref includes exact file paths
- [ ] No story exceeds a reasonable scope (if ACs > 10, consider splitting)
- [ ] The Story Index table matches the actual story sections
- [ ] All PRD requirements for this epic area are covered by at least one story
- [ ] No requirements are duplicated across stories

## Phase 5: Report

Report back with:
- A summary of the epic's purpose and scope
- The complete story index with dependency chain
- Any ambiguities, risks, or decision points flagged
- Confirmation that all PRD requirements are covered
- Your confidence level in the decomposition

Do not begin implementing until instructed.
```

---

## 6. Epic Alignment Check

**Use when:** Verifying an epic document matches current implementation, or after significant code changes.

**Important:** This prompt aligns documentation only. Do NOT implement anything. Update the epic document's Dev Notes to reflect actual state.

```
Align [epic file] with current implementation

You are verifying that an epic document accurately reflects what has been built. This is a documentation-only task — you update the epic document, not the codebase.

## Phase 1: Document Analysis

Read the epic document thoroughly. Extract:
1. Every story ID and its status
2. Every acceptance criterion (AC) across all stories
3. Every file path referenced
4. Every design reference
5. Every dependency relationship

## Phase 2: Implementation Scan

For each story in the epic, scan the codebase to find:
1. **Actual files** — do the referenced files exist? Are they where the epic says they are?
2. **Component structure** — do the components match the epic's description?
3. **Test coverage** — do tests exist? Do they cover the ACs?
4. **Prop interfaces** — do component props match what the epic specifies?
5. **Route structure** — do routes match the epic's file paths?
6. **Design tokens** — are the referenced colors, tokens, and values used correctly?

## Phase 3: Cross-Reference Check

For every AC in the epic, verify:
- [ ] The AC has a corresponding implementation (code exists)
- [ ] The implementation matches the AC's intent (not just surface wording)
- [ ] The AC has test coverage (test file exists and includes this scenario)
- [ ] No AC has been partially implemented or quietly skipped

For every file path in the epic, verify:
- [ ] The file exists at the specified path
- [ ] The file contains what the epic says it contains
- [ ] No orphaned files exist (files created but not referenced)

## Phase 4: Discrepancy Report

Categorize findings:

### Status Mismatches
- Epic says "done" but implementation is missing/incomplete
- Epic says "ready" but implementation already exists
- Epic says "in-progress" but no work is evident

### Missing Implementation
- ACs with no corresponding code
- Files referenced but don't exist
- Components described but not built

### Scope Drift
- Code that exists but isn't justified by any AC
- Features built beyond what the epic specifies
- Components created but not referenced in the epic

## Phase 5: Documentation Updates

For each discrepancy found, update the epic document's Dev Notes to annotate actual state. Use this format:

**Before:**
- T1: [original instruction]

**After:**
- T1: [original instruction] **Status: [what actually exists — "implemented", "placeholder", "not started", "file exists but not wired"]**

Do NOT change ACs, story descriptions, or story statuses. Only annotate Dev Notes with implementation reality.

## Phase 6: Report

Deliver:

### Per-Story Alignment
| Story | Status Match | ACs Covered | Files Exist | Issues |
|-------|--------------|-------------|-------------|--------|
| N.0   | ✅/❌        | X/Y         | ✅/❌       | [list] |

### Documentation Updates Made
| Story | Dev Note | Update Applied |
|-------|----------|----------------|
| N.0   | T1       | Added status annotation |

### Remaining Gaps
- [What still needs to be built — for reference only, not to implement now]

If all Dev Notes are accurately annotated, confirm the epic document is aligned with current implementation.
```
