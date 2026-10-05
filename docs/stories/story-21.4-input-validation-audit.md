# Story 21.4 — Input Validation Audit

**Status:** ready
**Epic:** 21 — Full App Scan & Test Case Suite
**Depends on:** 21.1
**Design Refs:** - (no new UI; spec = validation code in forms/API routes + 21.3 sources, not SVG)
**Source:** [Epic 21 Story 21.4](../epics/epic-21-full-app-scan-test-case-suite.md)

## Story

As the founder, I want every form and API input probed for validation failures so that the "already failing" hunches are confirmed with evidence before test cases are written.

## Acceptance Criteria (EARS)

- AC1: Every form shall be probed (boundary, malformed, empty, over-length, injection-shaped inputs): signup, signin, forgot/reset password, onboarding 1 (slug/headline), 2 (template), 3 (brand color, logo URL, CTA, milestone thresholds), 4 (decision), 4a (question builder: types, options, caps), 5 (email customisation), public email capture (email format, honeypot, timing, rate limit, consent line, phone E.164, qual answers), subscriber detail PATCH (display_name ≤100), settings (profile, waitlist fields, phone mode), broadcast (subject ≤200, body ≤10k), updates (min-10, body type), waitlist POST/PATCH (slug, milestone rewards validation).
- AC2: Every API route's validation branch shall be checked: 400s with honest error strings, ordering of guards (honeypot → timing → consent → email → rate limit → tier → referral → qual → cap — Phase 6 contract), no raw-error echo to clients.
- AC3: Each probe result shall be recorded: pass / fail-with-evidence (request + actual response vs expected from 21.3 sources) / not-applicable.
- AC4: Failures shall be grouped by severity (broken = accepts invalid or crashes; weak = accepts invalid but harmless; strict = rejects valid input) — the founder-approval list for 21.5.
- AC5: Lint and build shall pass.

## Tasks

- T1 (AC1) Form probes (manual + curl/httpie against local API)
- T2 (AC2) API validation-branch walkthrough
- T3 (AC3-AC4) Results + severity grouping
- T4 (AC5) Gates

## Out of Scope

- Fixing anything; security penetration testing beyond input validation; load testing.

## Dev Notes

- Methods: read the validation code in each route (cheap first pass), then verify the top-risk ones live (local dev server + curl). Highest-risk: slug validation + race, milestone reward thresholds (client `validateMilestoneRewards` + server), question builder caps (Free=2/Pro=5), broadcast/update length caps, phone E.164, unsubscribe HMAC tokens.
- Existing validation inventory is good: Phase 6.4/6.8 established strict ordering; Story 14.4 RFC4180; 12.2.13 display_name cap (audit F1); step-3 milestone client validation (milestone hardening F3/F4). Expect PASS on most — this audit is evidence-collection, not re-design.
- Output feeds 21.5's "Input validation" section directly: failures become pre-flagged test cases (AC4 grouping = case priority).
- Do NOT fix failures here — 21.6 owns fixes after founder approves the list (21.5 gate).

## Files to Create/Modify

| File                                                | Change                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| `docs/stories/story-21.4-input-validation-audit.md` | Probe results + severity-grouped failure list in results (T1–T3) |
| Validation code in forms + API routes               | Read-only first pass (T1, T2) — **no fixes in this story**       |

## Risk

- Hard rule: no fixes here (Dev Notes) — 21.6 owns fixes after the founder-approval gate; fixing early invalidates the 21.4 evidence baseline and the 21.5 gate flow.
- AC2 references the consent guard in its ordering ("honeypot → timing → consent → …") — but Epic 18 (W3) removed the consent 400; treat the Phase 6 contract's current code as reality and flag any doc/code ordering mismatch in the results rather than asserting a guard that no longer exists.
- Probes against live rate limits can skew results (5/hour per IP) — record environment (local vs prod) per probe so a rate-limited 429 isn't misread as a validation failure.
