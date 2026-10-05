# Story 21.7 — Full QA Execution

**Status:** ready
**Epic:** 21 — Full App Scan & Test Case Suite
**Depends on:** 21.5, 21.6, 19.\*
**Design Refs:** - (no new UI; spec = docs/qa/manual-test-cases.md, not SVG)
**Source:** [Epic 21 Story 21.7](../epics/epic-21-full-app-scan-test-case-suite.md)

## Story

As the founder, I want the complete test document executed end-to-end with results recorded so that launch blockers are visible.

## Acceptance Criteria (EARS)

- AC1: Every case in `docs/qa/manual-test-cases.md` shall be executed against the build under test (specify local or prod per case's exec header) and its pass/fail column filled with result + date.
- AC2: Failures found during execution shall be triaged: in-scope bug → fix immediately if small, else log with severity; environmental/data issue → noted; already-known → linked.
- AC3: A results summary shall head the document: total cases, passed, failed, deferred, and a launch-blocker list (any fail = blocker unless waived).
- AC4: The full automated suite + lint + build shall be run alongside and recorded (baseline 7 failures expected).
- AC5: Zero unresolved launch blockers at story completion (or explicit founder waiver recorded per blocker).

## Tasks

- T1 (AC1) Execute all cases
- T2 (AC2) Triage failures
- T3 (AC3) Results summary
- T4 (AC4) Automated gates record
- T5 (AC5) Blocker burn-down

## Out of Scope

- Writing new cases during execution (small addendums allowed if a gap is found — add with citation, execute, note); performance/load testing.

## Dev Notes

- Execution order suggestion: follow doc section order (auth → onboarding → dashboard → public → …) so environment setup (tier flips, seed data) happens once per section.
- Founder may execute personally (that's the point of the manual doc) with the agent standing by for triage/fixes — coordinate in session.
- Two-tier reality: some cases are prod-only (emails, webhooks, cron, og:image) — execute those against `www.prewaitlist.com`/subdomains and note environment per case.

## Files to Create/Modify

| File                                   | Change                                                            |
| -------------------------------------- | ----------------------------------------------------------------- |
| `docs/qa/manual-test-cases.md`         | Pass/fail columns filled + results summary + blocker list (T1–T3) |
| Code fixes for small in-scope failures | Only immediate small fixes per AC2 triage                         |
| `docs/qa/` gates record                | Automated suite + lint + build results (T4)                       |

## Risk

- Founder-executed story — sequencing with the agent (standing by for triage/fixes) must be coordinated in session; don't fix or write cases unilaterally mid-execution.
- Prod-only cases (emails/webhooks/cron/og:image) can't run locally (Dev Notes) — mislabeling environment produces false failures; the exec header convention exists for this.
- Per AC5, any fail = blocker unless explicitly waived by founder — the waiver must be recorded per blocker, not assumed.
