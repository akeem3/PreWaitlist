# Story 20.5 — Product Hunt Prep

**Status:** ready (copy gated on founder)
**Epic:** 20 — Feedback, Onboarding & Growth Tooling
**Depends on:** 19.\*
**Design Refs:** - (no new UI; doc-only checklist — vision Sprint 4 `:437`, not SVG)
**Source:** [Epic 20 Story 20.5](../epics/epic-20-feedback-onboarding-growth-tooling.md)

## Story

As the founder preparing a Product Hunt launch, I want a prep checklist and asset inventory so that launch day isn't improvised.

## Acceptance Criteria (EARS)

- AC1: A prep document shall exist covering: launch checklist (tagline, description, first comment, gallery screenshots, maker comment, topics), asset inventory (og images, logo, demo GIF/video, screenshot set — reuse 21.2 captures where suitable), and launch-day runbook (reply cadence, badge ask, timing).
- AC2: The PH tagline/description/first-comment copy shall be explicitly marked as founder-authored (copy-gate: agent does not draft public listing copy).
- AC3: Pre-launch verification items shall be cross-linked: Epic 19 audits closed, Epic 21.8 launch verification passed, pricing page current, legal pages live.
- AC4: The document shall note the standing "Growth tier excluded" decision — no Growth-tier mentions in any launch material.
- AC5: Lint and build shall pass (doc-only).

## Tasks

- T1 (AC1) Checklist + inventory + runbook
- T2 (AC2) Copy-gate markers
- T3 (AC3-AC4) Cross-links + standing-decision check
- T4 (AC5) Gates

## Out of Scope

- Submitting to PH; drafting listing copy; PH ads/spend; HN/Reddit copy (founder-owned too).

## Dev Notes

- Vision `:437` "Product Hunt listing prepared" — "prepared" = checklist ready + assets identified; founder does the actual PH submission.
- Timeline note: this story runs near the end of Epic 20 but the _launch itself_ waits on 21.8.
- Assets exist: `public/PreWaitlist-logo.svg`, og-image route (Phase 5.1), design SVGs in `docs/design/`.

## Files to Create/Modify

| File                                                                                                         | Change                                     |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| Prep document (location to pick at execution — suggest `docs/playbooks/product-hunt-prep.md` alongside 20.4) | New — checklist + inventory + runbook (T1) |

## Risk

- Copy gate (AC2): agent must not draft PH listing copy — the document ships with explicit founder-authored markers/placeholder slots, not written copy.
- Depends on the whole of Epic 19 (`19.*`) per the index — prep verifies stable product; running it early means re-verifying after 19 fixes.
- AC3 cross-links point at 21.8 which runs after this story in calendar order (20.5 near epic end, 21.8 = sprint end) — the document records the verification as a pre-launch gate, not a completed prerequisite at write time.
