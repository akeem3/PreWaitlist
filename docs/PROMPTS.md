# Prompts

Reusable prompts for story and epic workflow.

---

## Table of Contents

| #   | Prompt                                                           | Purpose                                                            |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | [Scan Story & Create Tasks](#1-scan-story--create-tasks)         | Understand story context, research, generate phase-based task list |
| 2   | [Verify Tests & Implementation](#2-verify-tests--implementation) | Review implementation against story, run tests, identify gaps      |
| 3   | [Story Execution](#3-story-execution)                            | Execute tasks systematically with quality gates                    |
| 4   | [Follow-Up Audit](#4-follow-up-audit)                            | Independent post-implementation audit of a story                   |
| 5   | [Epic-Level Verification](#5-epic-level-verification)            | Final release audit of entire epic                                 |

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

## 2. Verify Tests & Implementation

**Use when:** Story implementation is complete, before marking done.

```
Scan [story file] and the project folder.

As the dev, identify all test suites for the story, review the implementation, then run the tests.

Check for:

- Correct implementation per the story
- Missing code or tests
- Errors
- Mismatches between story and implementation

If everything passes → update the story status to Ready for Review and fill in the Dev Agent Record sections.

If not → write a report with recommended next steps.
```

---

## 3. Story Execution

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

## 4. Follow-Up Audit

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

## 5. Epic-Level Verification

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
