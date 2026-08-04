# Epic 5 — Dashboard + Store Features

**Status:** done
**Note:** This epic's dashboard UI is a **functional placeholder** — built to satisfy Sprint 1's exit condition (founder lands on a working dashboard after onboarding). The stat cards, checklist, nav tabs, and layout will be **torn down and replaced** with properly designed implementations in Sprint 2+ when real subscriber data, analytics, and settings pages ship. Do not treat these screens as final design.
**Source:** [PRD S6.13 Empty Dashboard](../PRD-Sprint-1.md#613-empty-dashboard-f-g1), [PRD S6.14 Founder Acquisition Source Capture](../PRD-Sprint-1.md#614-founder-acquisition-source-capture), [PRD S6.15 Founder Updates Feed](../PRD-Sprint-1.md#615-founder-updates-feed--posting-only)

## Design References

| Reference       | File                                                          |
| --------------- | ------------------------------------------------------------- |
| Empty Dashboard | `docs/design/High-fidelity-svgs/Empty Dashboard skeleton.svg` |

## Goal

Build the empty dashboard landing page, the founder updates compose action, and the acquisition source capture — completing Sprint 1's exit condition. After this epic, a founder who has completed onboarding lands on a functional (but empty) dashboard with skeleton stat panels, a getting-started checklist, and visually present but non-functional nav tabs.

## Definition of Done

The dashboard displays stat cards (Total Signups, Recent Signups, Conversion Rate) with em-dash/skeleton states — never literal 0. A getting-started checklist guides the founder through next steps, with the "Share your waitlist" item auto-checking when Share/Copy is used. The nav shows Subscribers, Broadcasts, and Settings tabs (visually present, not functional). The waitlist's live URL and "View live page" link are displayed. The founder updates compose action writes to the `founder_updates` table. Acquisition source values (`ref`/`utm_*`) are persisted on signup. Lint and build pass.

## Story Index

| ID  | Title                                                   | Depends on | Status |
| --- | ------------------------------------------------------- | ---------- | ------ |
| 5.1 | Empty Dashboard (stat cards, checklist, nav, live URL)  | 4.7        | done   |
| 5.2 | Founder Acquisition Source Capture (signup attribution) | 3.0        | done   |
| 5.3 | Founder Updates Feed — Compose Only                     | 5.1        | done   |

Work through these in dependency order, one at a time. Each has a `status` you should update as you go (`ready` → `in-progress` → `blocked` or `done`). A story marked `blocked` stays blocked until manually cleared — don't silently re-attempt it next session.

---

### Story 5.1 — Empty Dashboard

**Status:** done
**Design Refs:** `docs/design/High-fidelity-svgs/Empty Dashboard skeleton.svg`
**Story:** As the founder, I want a dashboard that shows my waitlist stats (even if empty) and a getting-started checklist so I know what to do next.

**Acceptance Criteria (EARS):**

- AC1: The dashboard shall display stat cards for: Total Signups, Recent Signups (last 7 days), and Conversion Rate.
- AC2: All not-yet-populated stat values shall render as em-dashes or skeleton bars; the system shall never render a literal 0 in this state (REQ-6.13.1).
- AC3: The dashboard shall include a getting-started checklist with items: "Share your waitlist" (auto-checks when Share/Copy is used), "Set up email notifications" (links to Settings), "Customize your page" (links to onboarding edit).
- AC4: When Share or Copy Link is used from this screen at least once, the getting-started checklist's first item shall auto-check (REQ-6.13.2).
- AC5: The dashboard nav shall include Subscribers, Broadcasts, and Settings tabs — visually present but not functionally built in Sprint 1 (REQ-6.13.3).
- AC6: The dashboard shall display the waitlist's live URL and a "View live page" link.
- AC7: The dashboard shall load the founder's waitlist data from Supabase (name, slug, template, status).
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Build stat cards with skeleton state · T2 (AC3-AC4) Build getting-started checklist with auto-check · T3 (AC5-AC6) Build dashboard nav + live URL display · T4 (AC7) Load waitlist data from Supabase · T5 (AC8) Run lint + build

**Out of scope:** Real stat computation (Sprint 2), subscriber list (Sprint 2), broadcast sending (Sprint 3), settings page (Sprint 2), CSV export (Sprint 2).

**Dev Notes:**

- T1: ✅ Done — `src/app/dashboard/page.tsx` (server component) + `src/app/dashboard/client.tsx` (client component). Stat cards use `Card` component with em-dash (`—`) for empty state. Never renders "0". Three cards in a responsive grid (1 col mobile, 3 col desktop).
- T2: ✅ Done — Getting-started checklist with 3 items: "Share your waitlist" (auto-checks via `ShareCopyLink` `onShare`/`onCopy` callbacks), "Set up email notifications" (links to `/onboarding/5`), "Customize your page" (links to `/onboarding/3`). Uses `useState` for check state.
- T3: ✅ Done — Nav header with 4 tabs: Overview (active), Subscribers, Broadcasts, Settings. Visual only, all link to `/dashboard`. Live URL bar shows `{slug}.prewaitlist.com` with "View live page →" link (opens in new tab). `ShareCopyLink` component rendered for share/copy functionality.
- T4: ✅ Done — Server component fetches waitlist data via `supabase.from("waitlists").select("id, name, subdomain, template, status").eq("founder_id", user.id)`. Redirects to `/signin` if no user, `/onboarding/1` if no waitlist.
- T5: ✅ Done — Lint + build pass. Files: `src/app/dashboard/page.tsx`, `src/app/dashboard/client.tsx`. Available components: `Card` ✓, `ShareCopyLink` ✓, `Link` (Next.js) ✓.

---

### Story 5.2 — Founder Acquisition Source Capture

**Status:** done
**Design Refs:** — (no UI)
**Story:** As the founder, I want my signup's acquisition source (`ref`/`utm_*`) attached to my founder profile so I can later see where my signups came from.

**Acceptance Criteria (EARS):**

- AC1: When a founder signs up (via email/password or Google OAuth), the system shall read the `mw_acquisition` cookie (set by Story 3.0) and attach `ref`, `utm_source`, `utm_medium`, `utm_campaign` values to the `founder_profiles` record (REQ-6.14.1).
- AC2: The acquisition values shall be stored in the `founder_profiles` table columns: `ref_param`, `utm_source`, `utm_medium`, `utm_campaign`, `acquisition_captured_at`.
- AC3: If no acquisition cookie exists (direct visit), the fields shall remain NULL — no default values.
- AC4: The `acquisition_captured_at` timestamp shall be set to `now()` when values are captured.
- AC5: Acquisition capture shall happen server-side during the signup/callback flow, not client-side.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC5) Implement acquisition capture in signup/callback flow · T2 (AC6) Run lint + build

**Out of scope:** Dashboard reporting on acquisition sources (deferred to post-Sprint 1), display of acquisition data in any UI.

**Dev Notes:**

- T1: In the auth callback (`src/app/auth/callback/route.ts`), after `exchangeCodeForSession()`, read the `mw_acquisition` cookie from the request. Parse the JSON value. Update the `founder_profiles` row with the acquisition values. Use `supabase.from('founder_profiles').update({ ref_param, utm_source, utm_medium, utm_campaign, acquisition_captured_at: new Date().toISOString() }).eq('id', userId)`. Cookie is deleted after capture. **Status: done — implemented in auth callback.**
- T2: The `founder_profiles` table schema already has these columns (Epic 2.1, PRD S7.4). **Status: schema exists.**
- T3: Files: `src/app/auth/callback/route.ts`. **Available:** `src/lib/supabase/server.ts` ✓, `src/lib/supabase/client.ts` ✓.

---

### Story 5.3 — Founder Updates Feed — Compose Only

**Status:** done
**Design Refs:** — (no UI in Sprint 1)
**Story:** As the founder, I want a compose/create action for founder updates so I can start building content for my waitlist subscribers, even though the public read surface won't exist until Sprint 2.

**Acceptance Criteria (EARS):**

- AC1: The system shall provide a `POST /api/updates` route handler that creates a founder update record with the founder's waitlist ID and body text (REQ-6.15.1).
- AC2: The route handler shall validate that the `body` field is non-empty and under 2000 characters.
- AC3: The route handler shall enforce RLS — only the founder who owns the waitlist can create updates.
- AC4: There shall be no public read/display surface for founder updates in Sprint 1 — the compose action writes to the database only (REQ-6.15.1).
- AC5: A basic compose UI may exist on the dashboard (a text area + submit button) or the route may be called from a future Sprint 2 UI — either approach is acceptable.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC4) Create POST /api/updates route handler · T2 (AC5) Optionally build compose UI on dashboard · T3 (AC6) Run lint + build

**Out of scope:** Public read/display of founder updates (Sprint 2), subscriber-facing update feed, email notification of updates.

**Dev Notes:**

- T1: ✅ Done — `src/app/api/updates/route.ts` created. POST handler with auth check (401), body validation (non-empty, ≤2000 chars), waitlist lookup, and insert into `founder_updates`. Returns `{ id }` with 201. RLS handles ownership enforcement at DB level.
- T2: ✅ Done — Compose UI deferred to Sprint 2 (AC5 says "may exist" — route handler is the required part).
- T3: ✅ Done — Lint + build pass. Files: `src/app/api/updates/route.ts`. Available components: `Textarea` ✓, `Button` ✓, `Card` ✓.
