# Story 20.6 — Founder Contact Popup (Instagram + Email)

**Status:** done
**Epic:** 20 — Feedback, Onboarding & Growth Tooling
**Depends on:** 20.3
**Design Refs:** - (no SVG exists; spec = founder directives 2026-10-09 + feedback doc §8, not SVG)
**Source:** [Epic 20 Story 20.6](../epics/epic-20-feedback-onboarding-growth-tooling.md)

## Story

As a user, I want the "Talk to the founder" pill to open a small contact card with Instagram and Email options so that I can reach the founder without leaving the dashboard.

## Acceptance Criteria (EARS)

- AC1: Clicking the "Talk to the founder" pill shall open a contact modal (not navigate); the modal shall close via ✕ button, backdrop click, or Escape.
- AC2: The modal shall render one row per set env var: Instagram row linking to the founder's `ig.me` DM deep link (new tab), Email row linking to `mailto:` (same tab, no `target`). Each row hides when its var is unset; the pill hides when both are unset (graceful-hide parity with 20.3).
- AC3: Icons shall be hand-drawn monochrome `currentColor` SVGs (no icon dependency, no brand colors/gradients — the Instagram gradient would violate Design System v2.0 tokens); surfaces use `bg-card`/`border-border`/`text-foreground` tokens.
- AC4: The modal shall use `role="dialog"` + `aria-modal` with `aria-label` reusing "Talk to the founder"; focus moves into the modal on open; Escape/backdrop close (UpgradeModal overlay pattern).
- AC5: Copy gate — no new user-facing strings: title reuses §8 "Talk to the founder"; row labels are the founder-provided names (Instagram, Email); close control reuses UpgradeModal's `aria-label="Close"` verbatim.
- AC6: The single-URL `NEXT_PUBLIC_FOUNDER_CONTACT_URL` var shall be removed (code + `.env.example`); replaced by `NEXT_PUBLIC_FOUNDER_INSTAGRAM_URL` + `NEXT_PUBLIC_FOUNDER_EMAIL` (ask-first approval recorded in this story).
- AC7: Tests shall cover open/close (✕, backdrop, Escape), per-row render/hide on env, all-unset pill hide, `mailto:` without `target`, IG link with `target=_blank` + `rel`.
- AC8: Lint, tests, and build shall pass.

## Tasks

- T1 (AC1, AC4) Modal shell + open/close + a11y
- T2 (AC2, AC3) Channel rows + icons + env gating
- T3 (AC5) Copy verification (zero new strings)
- T4 (AC6) Env var swap + `.env.example`
- T5 (AC7) Tests
- T6 (AC8) Gates

## Out of Scope

- X row (dropped per founder 2026-10-09 — X Chat passcode friction is X-side; revivable later as one env var + one row).
- Reddit row (evaluated 2026-10-09 — invite link exists via Chat & Messaging settings, but request-accept-first is strictly more friction than compose links; rejected).
- Subtitle/helper text inside the modal (would be new copy — gate).
- Tally FAB changes; helpdesk/chatbot/knowledge base (explicitly deferred per best-practice review 2026-10-09).
- Fourth channel row (3-max rule; currently 2).

## Dev Notes

- IG deep link `https://ig.me/m/<username>` (Meta official docs, verified 2026-10-09) opens the DM thread directly; profile URLs (`instagram.com/<u>`) leave visitors hunting for the Message button — never use profile form. No `@`, drop trackers (`obrf`). Founder value: `https://ig.me/m/ak66m_` (`.env.local`; Vercel mirror pending + redeploy).
- X compose `https://x.com/messages/compose?recipient_id=<numeric-ID>` (official X docs, verified 2026-10-09) needs the NUMERIC ID, not the handle; X Chat passcode is mandatory one-time X-side setup (cannot be removed).
- Email: raw address in env, code builds the `mailto:`; no `target=_blank` (opens a blank tab in some browsers).
- Modal pattern: mirror `upgrade-modal.tsx` (`backdropRef` target check, Esc effect with cleanup, `z-50`, card `rounded-xl border border-border bg-card`, close `aria-label="Close"` verbatim, `max-h-[calc(100dvh-2rem)]` mobile clearance per 19.5 F4 fix).
- z-50 matches UpgradeModal; co-open is rare (contact modal is user-invoked; survey D7 suppression untouched).
- Separation verdict (best-practice review 2026-10-09, web research): DM channel and Tally form stay separate — distinct jobs (relationship/depth/urgency vs categorizable signal); YC "no one between founders and users", Zonka distinct-systems, Hubble direct-channel + feature-board. Operating rules: DMs daily glance/24h reply, form weekly batch per §10/§22, close the loop per §25. No helpdesk/chatbot/KB until revisit triggers fire (DMs >30min/day sustained; form exceeds one weekly sitting).
- `.env.example` already swapped (template); `.env.local` holds founder values; Vercel mirror + redeploy = founder step after code ships.

## Files to Create/Modify

| File                                                          | Change                                                               |
| ------------------------------------------------------------- | -------------------------------------------------------------------- |
| `components/dashboard/contact-modal.tsx`                      | New — modal + channel rows (T1, T2)                                  |
| `components/dashboard/feedback-button.tsx`                    | Pill opens modal; drop single-URL path; read 2 new vars (T1, T2, T4) |
| `src/__tests__/components/dashboard-feedback-button.test.tsx` | Modal tests (T5)                                                     |
| `.env.example`                                                | Swap contact vars (T4 — done)                                        |

## Risk

- Two new `NEXT_PUBLIC_*` env vars (old one removed) — ask-first approval recorded here (founder directive 2026-10-09); Vercel mirror + redeploy required before the rows go live in production.
- `mailto:` behavior varies by browser/OS handler — same-tab plain link is the safe default.
- Modal + UpgradeModal co-open: both z-50; acceptable (user-invoked, dismissible, rare).

## AS-BUILT (2026-10-09)

**Files:** `components/dashboard/contact-modal.tsx` (new — modal shell, Instagram/Email rows, monochrome icons, Esc/backdrop/✕ close, `role="dialog"`) · `components/dashboard/feedback-button.tsx` (pill `<button>` opens modal; single-URL path removed; reads 2 new vars; Tally path byte-identical) · `dashboard-feedback-button.test.tsx` (15 tests: 6 Tally tests untouched, 5 contact tests migrated, 4 new modal tests) · `.env.example` (var swap).

**Deviations:** header uses a flex row (title + close inline) instead of UpgradeModal's absolute close — small menu card; close `aria-label="Close"` verbatim reused, all other overlay patterns mirrored. `autoFocus` on close; Esc works via document listener regardless.

**Gates:** lint 0 errors / 5 pre-existing warnings · prettier clean · targeted 15/15 · full suite at baseline (dashboard-archive 4 + dashboard-subscriber-table 3, verified file-by-file) · clean build `ƒ Proxy (Middleware)` · zero `NEXT_PUBLIC_FOUNDER_CONTACT_URL` refs in code/tests.

**Founder steps remaining:** Vercel env set (founder 2026-10-09) → redeploy pending (production still serving pre-merge build per og-hash check 2026-10-09) → live verify pill → modal → rows.

**Icon restyle (2026-10-09, founder directive):** pill text → circular person-icon button (`title`/`aria-label` "Talk to the founder" hover); modal itself unchanged. Distinction vs feedback FAB (now pencil): same round shape, inverted tone (card-outline vs accent-solid) + person-vs-pencil glyphs.

**Hover tooltips (2026-10-09, founder directive):** DM person-button gains the same left-growing label pill (hover copy "Talk to the founder", `aria-hidden` span + matching `aria-label`); modal itself unchanged.
