# Story 20.3 — Feedback Surfaces (Tally Button + Founder Link)

**Status:** ready
**Epic:** 20 — Feedback, Onboarding & Growth Tooling
**Depends on:** —
**Design Refs:** - (no new UI; spec = feedback doc §7 categories + §8 founder contact, not SVG)
**Source:** [Epic 20 Story 20.3](../epics/epic-20-feedback-onboarding-growth-tooling.md)

## Story

As a user, I want an always-available feedback button and a direct way to reach the founder so that problems I hit are cheap to report.

## Acceptance Criteria (EARS)

- AC1: The dashboard shall include a feedback entry point (floating action button or fixed sidebar/footer control) that opens the founder's Tally feedback form.
- AC2: The form flow per feedback doc §7 shall be supported: category selection (🐛 Bug, 😕 Confusing, 💡 Idea, ❤️ Love this, ❌ Something is missing, 💬 Other) then free-text ("Tell me what happened."), optional follow-up consent ("Can I follow up with you?"). Implementation: categories are Tally form options (preferred, zero code) OR an in-app picker that passes category via Tally hidden field — choose one, document in Dev Notes.
- AC3: A "Talk to the founder" surface per §8 ("Something feels wrong? Tell me.") shall be present, linking to the founder-provided contact/social URL (constant, single location).
- AC4: Feedback surfaces shall be available on all founder-authenticated dashboard pages and NOT on public subscriber-facing pages (public users are subscribers, not founder users).
- AC5: Copy strings shall be verbatim from `docs/waitlist_feedback_system.md` §7/§8 — no paraphrasing (copy-gate).
- AC6: The Tally embed shall not block dashboard interactivity (lazy-load on open; popup/overlay rather than inline iframe occupying layout).
- AC7: An environment/config constant shall hold the Tally URL + founder contact URL so founder can swap them without code changes (env vars = ask-first rule: these two new `NEXT_PUBLIC_*` vars are covered by this story's approval).
- AC8: Lint, tests, and build shall pass.

## Tasks

- T1 (AC1, AC4) Feedback entry point placement + scoping
- T2 (AC2) Category flow (Tally options or picker)
- T3 (AC3) Founder link surface
- T4 (AC5) Copy verification
- T5 (AC6-AC7) Embed loading + env constants
- T6 (AC8) Gates

## Out of Scope

- In-house feedback database/table (doc §28 — process, not product); feedback classification tooling; subscriber-facing feedback (subscriber voice = qual answers + surveys).

## Dev Notes

- Verified (2026-10-04): Tally free = unlimited forms + responses + conditional logic; Tally branding remains on free tier (acceptable — form is hosted by Tally anyway).
- Founder must create ONE Tally form in his account: fields = category (multiple choice, the 6 §7 labels), "Tell me what happened." (long text), "Can I follow up with you?" (yes/no), email (optional — Tally's hidden-field email or visible optional field per founder's call at execution; flag as copy decision).
- If using hidden fields: `https://tally.so/r/XXXX?category=bug` — the in-app picker sets `category`.
- Preferred AC2 implementation (official Tally docs, researched 2026-10-04): `Tally.openPopup(formId, { layout: "modal", hiddenFields: { category: "bug" } })` — popup API takes hidden fields directly, so no in-app picker and no query-param URL needed; load `https://tally.so/widgets/embed.js` via `next/script` on first open and call `Tally.loadEmbeds()` if rendering inline instead (AC6 lazy-load satisfied by the official on-demand script pattern; zero new npm deps).
- Placement recommendation: fixed bottom-right FAB on dashboard (design tokens: `rounded-full`, `bg-accent` hover, `shadow-[var(--shadow-float)]`), z-index below UpgradeModal so checkout overlays still win.
- §8 copy candidates (founder picks at execution): "Talk to the founder" or "Something feels wrong? Tell me." — both pre-approved in the doc; choose one, don't write a third.
- `?src=` attribution convention already exists for footer links — keep feedback links plain unless founder wants UTM (20.4 covers campaign links).

## Files to Create/Modify

| File                                       | Change                                                          |
| ------------------------------------------ | --------------------------------------------------------------- |
| `components/dashboard/feedback-button.tsx` | New — FAB + Tally popup + founder link (T1, T2, T3)             |
| `src/app/dashboard/shell.tsx`              | Mount feedback surface on dashboard pages, not public (T1, AC4) |
| `.env.example`                             | Add Tally URL + founder contact URL `NEXT_PUBLIC_*` vars (AC7)  |
| `docs/waitlist_feedback_system.md`         | Read-only source for verbatim §7/§8 strings (T4)                |

## Risk

- Two new `NEXT_PUBLIC_*` env vars — explicitly covered by this story's approval (AC7), but the founder must create the Tally form first; empty URL = dead button (gracefully hide when unset).
- Copy gate (AC5): §7/§8 strings verbatim; the §8 headline choice is founder's pick at execution — flag, don't write a third option.
- Z-index/placement: FAB must sit below `UpgradeModal` (Dev Notes) or checkout overlays get blocked — check `shadow-float` stacking when placing.
- AC2 implementation choice (Tally options vs in-app picker) must be documented in Dev Notes after the pick — don't leave both paths half-built.
