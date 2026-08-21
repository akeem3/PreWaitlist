# Prompts

Reusable prompts for story and epic workflow.

---

## Global Execution Rules

**These rules apply to ALL prompts. They are not optional.**

1. **Complete every phase in order.** Do not skip phases. Do not jump ahead.
2. **Show proof of work.** Each phase has a required output. You MUST produce it before proceeding.
3. **Hard gate = stop.** If a phase says "STOP and do X", you stop. You do not continue until X is done.
4. **Web research = actual web searches.** When a phase says "search the web", you run web searches. You do not rely on training data or memory.
5. **Confidence below 100% = go back.** If you cannot honestly say 100%, return to the phase that's weak. Do not fake confidence.
6. **Phase output goes to the user.** Report your findings/completions to the user after each phase. Do not silently proceed.
7. **Do not narrate — execute.** Say what you're doing, do it, show the result. Do not explain what you're about to do.

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
| 7   | [Align Design](#7-align-design-screen-by-screen)         | Screen-by-screen design analysis before epic execution                 |
| 8   | [Investigate & Solve](#8-investigate--solve-problem)     | Deep investigation of bugs, mismatches, or unexpected behavior         |

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

---

## 7. Align Design (Screen-by-Screen)

**Use when:** Before executing an epic, to verify designs match PRD requirements and current implementation. Produces a detailed analysis recorded in `docs/design/design-analysis.md`.

**Shortcut:** Type `align-design [epic-number].[screen]` (e.g. `align-design 4.1`) to analyze a single screen, or `align-design [epic-number]` (e.g. `align-design 4`) to analyze all screens in an epic.

```
Align [epic-number].[screen] — [Screen Name]

You are a senior UI/UX engineer with deep production experience conducting a design-to-implementation analysis. You do not guess, you do not assume, and you do not skip details. You are the last line of defense before stories are written from these designs. Apply that standard to everything that follows.

## Phase 1: Load the Design

1. Read the design SVG file at its exact path in `docs/design/High-fidelity-svgs/`
2. Read the design system mapping at `docs/design/Desing System table Map.svg`
3. Read the PRD section referenced by this screen (use the epic document's `Source` links)

## Phase 2: Extract Design Elements (Screenshot-Level Detail)

From the SVG, extract and document every visible element. Be exhaustive — missing a detail here means a story will be written wrong.

For each element, record:

### Layout & Structure
- Overall page layout (columns, split-pane, centered, full-width)
- Left pane vs right pane content (if split layout)
- Content widths, max-widths, padding, gaps
- Mobile vs desktop rendering (if indicated)

### Typography
- Every text string EXACTLY as it appears — copy verbatim, never paraphrase
- Text hierarchy (heading, subheading, body, caption, label)
- Font sizes (estimate in px from the SVG scale)
- Font weights (regular, medium, semibold, bold)
- Text colors — map to design tokens where possible

### Colors & Backgrounds
- Every background color visible (page bg, card bg, input bg, etc.)
- Text foreground colors
- Border colors
- Icon colors
- Map all colors to design system tokens from `globals.css` where possible

### Form Elements
- Every input field: type (text, textarea, color picker, file upload, toggle), label, placeholder, default value, validation state
- Every button: label, variant (primary, secondary, ghost), size, state (enabled, disabled, loading)
- Every toggle/switch: label, default state
- Every dropdown/select: options listed

### Icons & Imagery
- Every icon visible — describe shape, size, color
- Every image/illustration — describe content and placement
- SVG icon paths if extractable

### Spacing & Dimensions
- Horizontal and vertical spacing between elements
- Card/border radius values
- Element heights (buttons, inputs, cards)
- Section spacing

### Interactive States
- Hover states visible in the design
- Selected/active states
- Disabled states
- Error states
- Loading states

### Conditional Content
- Elements that appear/disappear based on state (e.g., tier-dependent content)
- Toggle-revealed sections
- Progressive disclosure patterns

## Phase 3: Cross-Reference with PRD

Compare every extracted element against the PRD requirements for this screen:

1. List every REQ ID that applies to this screen (e.g., REQ-6.6.1, REQ-6.6.2)
2. For each REQ, verify the design implements it correctly
3. Flag any discrepancies:
   - Design shows something the PRD doesn't mention
   - PRD requires something the design doesn't show
   - Design and PRD contradict each other
4. Check standing decisions and open items in the PRD for conflicts

## Phase 4: Cross-Reference with Current Implementation

Check what currently exists in the codebase for this screen:

1. Read the current page file (e.g., `src/app/onboarding/1/page.tsx`)
2. Read any related components
3. Compare current implementation against the design
4. Identify:
   - Elements already built that match the design
   - Elements built but different from the design
   - Elements missing entirely
   - Elements built but not in the design (scope drift)

## Phase 5: Web Research

Search the web for:

1. Best practices for this specific UI pattern (e.g., multi-step onboarding forms, template selectors, color pickers)
2. WCAG accessibility requirements for the form elements present
3. Mobile UX patterns for the specific interactions shown
4. Common pitfalls in similar UIs

Factor findings into your analysis — if the design deviates from best practices, flag it.

## Phase 6: Confidence Check & Redo

Before recording results, ask yourself:

- Have I extracted every visible text string verbatim?
- Have I mapped every color to a design token?
- Have I identified every form element and its properties?
- Have I checked every PRD requirement that applies?
- Have I compared against the current implementation?
- Have I searched for relevant best practices?

If any answer is "no" or "not sure", redo that phase. Do not proceed until you are 100% confident.

## Phase 7: Record Results

Append your analysis to `docs/design/design-analysis.md` under the appropriate epic and screen heading. Use this format:

### [Screen Name] — Analysis

**Design file:** `[filename].svg`
**PRD sections:** [list REQ IDs]
**Analysis date:** [date]

#### Layout
[Detailed layout description]

#### Typography & Text (Verbatim)
| Element | Text (exact) | Size | Weight | Color |
| ------- | ------------ | ---- | ------ | ----- |
| ... | ... | ... | ... | ... |

#### Colors & Tokens
| Element | Color Value | Token |
| ------- | ----------- | ----- |
| ... | ... | ... |

#### Form Elements
| Element | Type | Label | Placeholder | Default | Validation |
| ------- | ---- | ----- | ----------- | ------- | ---------- |
| ... | ... | ... | ... | ... | ... |

#### Buttons
| Label | Variant | Size | State |
| ----- | ------- | ---- | ----- |
| ... | ... | ... | ... |

#### Icons & Images
| Element | Description | Size | Color |
| ------- | ----------- | ---- | ----- |
| ... | ... | ... | ... |

#### Spacing & Dimensions
[Detailed spacing notes]

#### PRD Cross-Reference
| REQ ID | Design Match | Notes |
| ------ | ------------ | ----- |
| ... | ✅/❌/⚠️ | ... |

#### Implementation Cross-Reference
| Element | Current State | Design Match | Notes |
| ------- | ------------- | ------------ | ----- |
| ... | built/missing/different | ✅/❌/⚠️ | ... |

#### Best Practice Notes
[Web research findings]

#### Discrepancies Found
- [List any conflicts between design, PRD, and implementation]

#### Confidence Level
[State your confidence — must be 100% to proceed. If not 100%, list what's blocking you.]

## Phase 8: Final Report

Report back with:
- Confirmation that the analysis is complete and recorded
- A summary of key findings (discrepancies, gaps, decisions needed)
- A clear statement that you are 100% confident in the analysis, or a list of what still needs resolution

Do not begin implementation or epic updates until instructed.
```

---

## 8. Investigate & Solve Problem

**Use when:** You encounter a bug, test failure, unexpected behavior, UI mismatch, or ambiguous issue that needs to be understood and resolved.

```
You have encountered a problem. Do not rush to fix it. Follow this process rigorously until you have 100% confidence in both the problem and the solution.

### Phase 1: Deep Investigation

Read every file directly involved — not just the file where the symptom appears. Trace the full call chain from symptom back to root cause.

For UI issues: compare the implementation against the design SVG or preview component that serves as source of truth. Read both files side by side. Document every visual/structural difference.
For data issues: trace the query from the component through the API route to Supabase. Check what the server component sees vs. what a direct REST call returns.
For routing issues: check middleware.ts rewrite logic, trailing slash behavior, and whether the dynamic segment receives the correct params.

Project-specific checks (apply as relevant):
- Supabase: PostgREST returns 400 for queries referencing non-existent columns. Verify the column exists in the actual DB schema, not just in code.
- Supabase: The SSR client reads cookies(). If no auth cookies exist, it acts as anon. Verify RLS policies allow the anon role.
- Tailwind v4: @theme inline does NOT create CSS custom properties. Use utility class names (bg-card), NOT var() arbitrary values (bg-[--color-card]).
- Design tokens: Never use hardcoded hex. All colors must reference CSS custom properties via Tailwind utility classes.
- Next.js 16: Server Components run on the server. Client Components ("use client") cannot access cookies/headers.
- Middleware: On Windows, use middleware.ts at src/middleware.ts for subdomain routing (not proxy.ts).
- Story ACs: The story's acceptance criteria are the source of truth. If the implementation deviates from the AC, that's a bug.

HARD GATE — Before proceeding to Phase 2, you MUST:
- List every file you read (file path + what you found)
- State the root cause in one sentence
- Show the evidence chain: symptom → file → line → cause

If you cannot do this, you have not investigated deeply enough. Go back.

### Phase 2: Research

Search the web to learn the best way to fix this specific problem. Do not rely on training data or memory.

- Search for the exact error message, symptom, or behavior — not generic solutions
- Read official documentation for the libraries/frameworks involved (Next.js, Supabase, Tailwind v4, Vitest, etc.)
- Look for known issues, GitHub discussions, and Stack Overflow threads with real solutions
- Prioritize recent, production-proven patterns over outdated or generic advice
- Understand WHY a recommended fix works, not just WHAT to change

HARD GATE — Before proceeding to Phase 3, you MUST:
- Show the web search queries you ran (at least 2)
- Summarize what you found (not "I already knew this" — show actual results)
- Name the specific approach you'll use and cite where you found it

If you skipped web search, STOP. Go back and search. Do not proceed on training data alone.

### Phase 3: Impact Analysis

Ensure the fix will not break existing functionality.

- Identify every part of the codebase that could be affected by the proposed change
- Read those areas and confirm the fix won't cause regressions
- Check existing tests — understand what they cover and what they don't
- Check the design system: will the fix introduce new colors, spacing, or patterns outside the tokens in globals.css?
- Think adversarially: what could break if this change is wrong?

HARD GATE — Before proceeding to Phase 4, you MUST:
- List every file that could be affected (file path + why)
- State whether existing tests exist for the affected area
- Name the worst-case regression scenario

If you are not 100% confident the fix is safe, return to Phase 1 or Phase 2 with deeper focus.

### Phase 4: Solution Planning

Draft a well-structured plan. The plan MUST include:

- Root cause: what exactly is causing the problem and why
- Affected files: every file that needs to change (exact file paths)
- Changes: specific, concrete changes for each file (not vague descriptions like "restructure the component")
- Verification: how to confirm the fix works (manual test steps, test commands)
- Rollback awareness: what to undo if the fix causes new issues

HARD GATE — Before proceeding to Phase 5, you MUST:
- Show the complete plan with exact file paths and specific changes
- Show verification steps the user can follow

If your plan has vague descriptions like "restructure" or "refactor", STOP. Be specific.

### Phase 5: Confidence Check

Before executing, verify you have 100% confidence. Answer each question with "yes" or "no" — do not skip any:

1. Do I fully understand the problem? Could I explain it to someone else?
2. Do I fully understand the root cause?
3. Is my fix based on research, not assumptions?
4. Have I considered all affected areas?
5. Am I confident this won't break existing tests or functionality?

HARD GATE — If ANY answer is "no", STOP. Return to the phase that's weak. Do not proceed until ALL answers are "yes".

If you cannot honestly say 100%, state what's holding you back. Do not fake confidence.

### Phase 6: Create Todos and Execute

Once 100% confidence is gained:

- Create todos from the plan
- Execute each step meticulously
- Verify after each change before moving to the next
- Run pnpm lint and pnpm build at the end to confirm nothing is broken
- If tests exist for the affected area, run them too

### Ambiguity and Manual Intervention

If there are ambiguities at any point — STOP. Do not guess or make assumptions. Ask the user for clarification before proceeding.

If manual intervention is required from the user (e.g., running a SQL migration, checking the dev server terminal, verifying UI behavior in the browser, providing Supabase credentials), STOP and write a clear, step-by-step guide of exactly what the user needs to do, what to expect, and what information to report back.
```
