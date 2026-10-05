# Story 20.4 — Founder Marketing Links (Dub + UTM Playbook)

**Status:** ready
**Epic:** 20 — Feedback, Onboarding & Growth Tooling
**Depends on:** —
**Design Refs:** - (no new UI; doc-only playbook — vision Sprint 4 + founder brief, not SVG)
**Source:** [Epic 20 Story 20.4](../epics/epic-20-feedback-onboarding-growth-tooling.md)

## Story

As the founder running my own marketing, I want distinct links per social channel so that I can trace which channel drives signups.

## Acceptance Criteria (EARS)

- AC1: A founder-facing playbook document shall exist (location per Dev Notes) defining the UTM convention: `utm_source` (twitter/linkedin/reddit/ph/...), `utm_medium=social|launch|email`, `utm_campaign` (campaign name), plus worked examples for the main channels.
- AC2: The playbook shall include Dub setup steps: account creation, creating one link per channel (free tier: 25 new links/mo, 1K tracked clicks/mo, 30-day analytics, 3 domains — verified 2026-10-04), and where to read per-link click results.
- AC3: The playbook shall state how to verify attribution end-to-end: Dub/UTM link → landing → PostHog (20.1) sees matching `utm_source` on `account_created`/`onboarding_started`.
- AC4: Zero product code changes — this story is setup + documentation only (unless a UTM-pass bug is found, which routes to a fix task here).
- AC5: Lint and build shall pass (doc-only change still gated).

## Tasks

- T1 (AC1) UTM convention section
- T2 (AC2) Dub setup section
- T3 (AC3) Attribution verification section
- T4 (AC4-AC5) Confirm no code changes + gates

## Out of Scope

- Building link shortening into the product; subscriber-facing share links (already `ShareButtons`/`ReferralLink`); GA/other analytics install.

## Dev Notes

- Where: `docs/playbooks/founder-marketing-links.md` (new folder) or `docs/` root — pick one, keep flat.
- Existing attribution that already works: `?src=powered-by` footer links, acquisition cookie capture in proxy.ts (Story 3.0), `?ref=` (subscriber referrals — different system, don't confuse: `ref` = subscriber's referral code, NOT channel attribution).
- PostHog free tier captures utm params on pageviews by default (autocapture/pageview properties) — AC3 verification is realistic without extra wiring.
- Founder account creation for Dub is his step (ask-first satisfied by prior approval).

## Files to Create/Modify

| File                                        | Change                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| `docs/playbooks/founder-marketing-links.md` | New — UTM convention + Dub setup + attribution verification (path pick per Dev Notes) |

## Risk

- AC4 = zero product code changes — if the UTM-pass bug hunt finds nothing, keep it docs-only; if a bug is found it becomes a fix task here (AC4 allows this explicitly).
- Don't confuse `?ref=` (subscriber referral) with channel attribution — the playbook must keep the two systems clearly separated (Dev Notes).
- Path decision (`docs/playbooks/` vs `docs/` root) must be made once and recorded — avoid duplicate files in both locations.
