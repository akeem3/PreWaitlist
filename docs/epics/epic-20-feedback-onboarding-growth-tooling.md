# Epic 20 — Feedback, Onboarding & Growth Tooling

**Status:** ready
**Source:** `docs/waitlist_feedback_system.md` (founder-provided), 6 👑 additions (2026-10-04), vision Sprint 4 `:437` (Product Hunt)

## Design References

| Reference                                                                                                               | File |
| ----------------------------------------------------------------------------------------------------------------------- | ---- |
| None - Epic 20 introduces no new UI (surveys/walkthrough/feedback are per feedback doc text spec, not designed screens) | -    |

## Goal

Stand up the post-launch learning loop and first-run guidance: PostHog instrumentation so founder behavior is observable, a one-time dashboard walkthrough so new founders aren't lost, in-app feedback surfaces wired to Tally (per the feedback system doc's §7/§8), founder-side per-channel link attribution for their own marketing, and Product Hunt launch prep.

## Definition of Done

PostHog is capturing the core funnel events and 2–3 behavior-triggered surveys are live. New founders with ≥1 subscriber see a dismissible dashboard walkthrough exactly once. The dashboard shows a feedback button (§7 categories → Tally) and a "Talk to the founder" link (§8). The founder has a documented UTM/Dub playbook for per-channel links. Product Hunt prep checklist exists (listing copy remains founder-owned).

## Story Index

| ID   | Title                                           | Depends on | Status |
| ---- | ----------------------------------------------- | ---------- | ------ |
| 20.1 | PostHog Instrumentation + Surveys               | —          | done   |
| 20.2 | First-Subscriber Dashboard Walkthrough          | —          | done   |
| 20.3 | Feedback Surfaces (Tally Button + Founder Link) | —          | done   |
| 20.4 | Founder Marketing Links (Dub + UTM Playbook)    | —          | done   |
| 20.5 | Product Hunt Prep                               | 19.*       | done   |

**Parallelism:** 20.1 first (events underpin everything). 20.2 and 20.3 are independent and can run in parallel. 20.4 is founder-setup + doc. 20.5 runs last within the epic (prep for launch after product is stable).

Every story moves `ready` -> `in-progress` -> `done` (or `blocked`), and is only marked `done` when its lint/test/build gates pass. See `docs/epics/sprint-4-plan.md` for sprint-level context.

---

### Story 20.1 — PostHog Instrumentation + Surveys

**Status:** done
**Design Refs:** - (no new UI; spec = feedback doc §6 surveys + §16 event list, not SVG)
**Story:** As the founder, I want product analytics and a few behavior-triggered feedback surveys so that I can see where founders drop off and ask the right question at the right moment.

**Acceptance Criteria (EARS):**

- AC1: PostHog shall be initialized client-side via the official Next.js App Router pattern — `instrumentation-client.ts` at app root (supported on Next.js 16) — using `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`, with no-op behavior when the key is absent (local dev must not error). [AMENDED 2026-10-04 from `next/script` per official PostHog Next.js docs research.]
- AC2: The following funnel events from the feedback doc §16 shall fire: `account_created`, `onboarding_started`, `onboarding_completed`, `waitlist_published`, `subscriber_received`, `dashboard_viewed`, `warmth_viewed`, `broadcast_started`, `broadcast_sent`, `upgrade_triggered`, `checkout_started`, `subscription_started`, `cancelled`.
- AC3: Events shall carry minimal context properties (e.g., `waitlist_id` or `tier` where relevant) but never subscriber PII (no email addresses in event payloads).
- AC4: Autocapture shall be evaluated and either enabled (default) or explicitly disabled with rationale recorded — decision documented in Dev Notes.
- AC5: 2–3 PostHog surveys shall be configured per feedback doc §6, at minimum: "After first subscriber" (`Did seeing the first signup give you the signal you expected?`) and "Before cancellation" (`What made you decide this wasn't worth continuing?`), shown only to signed-in founders and rate-limited (once per founder per trigger).
- AC6: `.env.example` (if present) or env documentation shall list the two new `NEXT_PUBLIC_POSTHOG_*` variables.
- AC7: Lint, tests, and build shall pass; test suite stays at baseline.

**Tasks:** T1 (AC1) PostHog provider script + graceful no-key path · T2 (AC2-AC3) Event capture wiring at the touchpoints listed in Dev Notes · T3 (AC4) Autocapture decision · T4 (AC5) Two/three surveys from §6 · T5 (AC6) Env docs · T6 (AC7) Gates

**Out of scope:** Full §16 event list (remaining events added post-launch as questions arise); data warehouse/dashboards building; funnel analysis interpretation.

**Dev Notes:**

- Verified free tier (2026-10-04): 1M events/mo, 1,500 survey responses/mo, 5K session replays, no credit card, 1 project, 1-year retention. Set a billing limit as belt-and-braces.
- Setup pattern (official PostHog Next.js docs, verified 2026-10-04): Next.js 15.3+ supports `instrumentation-client.ts` — prefer it over the older `'use client'` `providers.tsx` + `PostHogProvider` wrapper (both are documented; instrumentation-client is the lighter current recommendation). Env naming: PostHog's own tutorial uses `NEXT_PUBLIC_POSTHOG_KEY` — our two-var plan matches. Autocapture is ON by default in current SDK defaults (AC4: keep default + record decision). Surveys require the client SDK to be initialized (AC5 depends on AC1 pattern). Reverse-proxying `/ingest` to dodge ad-blockers is documented by PostHog but NOT in scope for MVP — note as v1.1 option. If a Content-Security Policy is ever added, allow `*.posthog.com`.
- Touchpoint mapping (event → code location):
  - `account_created` → `auth/callback/route.ts` (first login) or signup completion client
  - `onboarding_started` → `onboarding/1` mount; `onboarding_completed` → success page
  - `waitlist_published` → onboarding Step 5 launch success
  - `subscriber_received` → `POST /api/subscribers` success (server-side capture needs `posthog-node` — decision: fire from thank-you page client instead to avoid new server dep; record choice)
  - `dashboard_viewed` → `dashboard/page.tsx` client
  - `warmth_viewed` → `/dashboard/warmth` mount
  - `broadcast_started`/`broadcast_sent` → `broadcast/client.tsx` compose + post-send
  - `upgrade_triggered` → `triggerUpgrade(trigger)` from `useUpgradeModal()` in `src/app/dashboard/shell.tsx:52` (the shared hook is the choke point — 9 call sites: `email_customisation`, `qual_question` ×2, `pro-cta-onboarding`, `subscriber_cap`, `warmth` ×2, `billing`, `pro-cta-billing`)
  - `checkout_started` → `use-paddle-upgrade.ts` / modal checkout open
  - `subscription_started` → Paddle webhook success (server — see `posthog-node` note) or billing page "pro" poll success
  - `cancelled` → `cancellation-flow.tsx` completion
- Server-side events (`subscription_started`, `cancelled`) either use `posthog-node` (a second small dep — flag in story execution, default = capture client-side at the moment of confirmed state change to stay zero-dep) or are deferred with a note. Do not silently skip AC2.
- Surveys: PostHog surveys render as in-app popups — they collide visually with `UpgradeModal` and the planned 20.2 walkthrough. Suppress surveys while the upgrade modal or walkthrough is active (simple flag/ref check).
- Copy: survey question strings come **verbatim** from `docs/waitlist_feedback_system.md` §6 (founder-provided = pre-approved). Button/dismiss labels come from PostHog defaults or existing app copy — no new copy.
- `cancelled` vs `canceled` — our Paddle events use `subscription.canceled` (one L); keep the **event name** as `cancelled` per §16 doc, keep the **webhook** matching Paddle's spelling.

---

### Story 20.2 — First-Subscriber Dashboard Walkthrough

**Status:** done
**Design Refs:** - (no new UI; spec = founder brief "first visit to active dashboard after first subscriber", not SVG)
**Story:** As a founder seeing my dashboard with a real subscriber for the first time, I want a short guided walkthrough so that I know what to do next.

**Acceptance Criteria (EARS):**

- AC1: The walkthrough shall start only when ALL hold: user is on `/dashboard`, the active waitlist has `subscriber_count >= 1`, and the tour has not been completed/dismissed before (localStorage flag).
- AC2: The tour shall use `driver.js` (MIT) with a modal overlay, highlighting real dashboard elements (stat cards, subscriber table, warm panel / sidebar sections as designed) in sequence.
- AC3: Tour step count shall be ≤ 6 steps, each with a title + description, plus Next/Skip controls; Skip or completion sets the localStorage flag.
- AC4: A "Replay tour" affordance shall be available (small link/button in the dashboard header or settings) so the founder can rerun it on demand.
- AC5: Tour step content strings shall be reviewed against the copy gate: strings sourced from the feedback doc or existing app copy; any new user-facing copy requires founder approval before merge.
- AC6: The tour shall not render during the initial page-load skeleton (only after data resolves).
- AC7: Mobile (375px): tour renders without breaking layout — elements must be highlightable or the tour degrades to sequential cards (document choice).
- AC8: Lint, tests, and build shall pass (add component test: trigger conditions + completion flag).

**Tasks:** T1 (AC1, AC6) Trigger gate (subscriber count + dismissal flag + post-load) · T2 (AC2-AC3) driver.js install + step definitions · T3 (AC4) Replay affordance · T4 (AC5) Copy review · T5 (AC7) Mobile behavior · T6 (AC8) Tests + gates

**Out of scope:** Tours for onboarding (onboarding has its own flow/progress UX); multi-page tours; tours on public pages.

**Dev Notes:**

- New dependency: `driver.js` — MIT, ~5kb, no deps, commercial use free (verified 2026-10-04). Import `driver` from `driver.js` + `driver.js/dist/driver.css` (official docs pattern).
- driver.js official-doc patterns for AC6/AC7 (researched 2026-10-04): start the tour only after the target elements exist using `waitForElement` (AC6 — data-resolved gate); set `skipMissingElement: true` so a missing/highlight-blocked element falls back to a centered popover instead of dead-ending (AC7 mobile degradation, document the choice); set the localStorage completion flag from `onDestroyed` (fires on both Skip and completion, covers AC3 in one hook).
- Data for the gate: dashboard already has subscriber count + server tier via layout → shell. Persist dismissal key: `founder-dashboard-tour-complete` (v1-friendly; add version prefix if steps change: `tour-v1-done`).
- Wiring location: `src/app/dashboard/shell.tsx` (client shell owns client state) — start tour after skeletons resolve (respect `react-hooks/set-state-in-effect` lint rule: initialize refs lazily, start from an effect that reads `localStorage` via lazy init pattern used elsewhere).
- The 20.1 surveys must not fire while the tour is active (coordinate flags).
- Interaction with empty state: tour requires ≥1 subscriber so it never tours the Epic 12.1.1 empty state — that's deliberate (founder brief: "on first visit to active dashboard after first subscriber").

---

### Story 20.3 — Feedback Surfaces (Tally Button + Founder Link)

**Status:** done
**Design Refs:** - (no new UI; spec = feedback doc §7 categories + §8 founder contact, not SVG)
**Story:** As a user, I want an always-available feedback button and a direct way to reach the founder so that problems I hit are cheap to report.

**Acceptance Criteria (EARS):**

- AC1: The dashboard shall include a feedback entry point (floating action button or fixed sidebar/footer control) that opens the founder's Tally feedback form.
- AC2: The form flow per feedback doc §7 shall be supported: category selection (🐛 Bug, 😕 Confusing, 💡 Idea, ❤️ Love this, ❌ Something is missing, 💬 Other) then free-text ("Tell me what happened."), optional follow-up consent ("Can I follow up with you?"). Implementation: categories are Tally form options (preferred, zero code) OR an in-app picker that passes category via Tally hidden field — choose one, document in Dev Notes.
- AC3: A "Talk to the founder" surface per §8 ("Something feels wrong? Tell me.") shall be present, linking to the founder-provided contact/social URL (constant, single location).
- AC4: Feedback surfaces shall be available on all founder-authenticated dashboard pages and NOT on public subscriber-facing pages (public users are subscribers, not founder users).
- AC5: Copy strings shall be verbatim from `docs/waitlist_feedback_system.md` §7/§8 — no paraphrasing (copy-gate).
- AC6: The Tally embed shall not block dashboard interactivity (lazy-load on open; popup/overlay rather than inline iframe occupying layout).
- AC7: An environment/config constant shall hold the Tally URL + founder contact URL so founder can swap them without code changes (env vars = ask-first rule: these two new `NEXT_PUBLIC_*` vars are covered by this story's approval).
- AC8: Lint, tests, and build shall pass.

**Tasks:** T1 (AC1, AC4) Feedback entry point placement + scoping · T2 (AC2) Category flow (Tally options or picker) · T3 (AC3) Founder link surface · T4 (AC5) Copy verification · T5 (AC6-AC7) Embed loading + env constants · T6 (AC8) Gates

**Out of scope:** In-house feedback database/table (doc §28 — process, not product); feedback classification tooling; subscriber-facing feedback (subscriber voice = qual answers + surveys).

**Dev Notes:**

- Verified (2026-10-04): Tally free = unlimited forms + responses + conditional logic; Tally branding remains on free tier (acceptable — form is hosted by Tally anyway).
- Founder must create ONE Tally form in his account: fields = category (multiple choice, the 6 §7 labels), "Tell me what happened." (long text), "Can I follow up with you?" (yes/no), email (optional — Tally's hidden-field email or visible optional field per founder's call at execution; flag as copy decision).
- If using hidden fields: `https://tally.so/r/XXXX?category=bug` — the in-app picker sets `category`.
- Preferred AC2 implementation (official Tally docs, researched 2026-10-04): `Tally.openPopup(formId, { layout: "modal", hiddenFields: { category: "bug" } })` — popup API takes hidden fields directly, so no in-app picker and no query-param URL needed; load `https://tally.so/widgets/embed.js` via `next/script` on first open and call `Tally.loadEmbeds()` if rendering inline instead (AC6 lazy-load satisfied by the official on-demand script pattern; zero new npm deps).
- Placement recommendation: fixed bottom-right FAB on dashboard (design tokens: `rounded-full`, `bg-accent` hover, `shadow-[var(--shadow-float)]`), z-index below UpgradeModal so checkout overlays still win.
- §8 copy candidates (founder picks at execution): "Talk to the founder" or "Something feels wrong? Tell me." — both pre-approved in the doc; choose one, don't write a third.
- `?src=` attribution convention already exists for footer links — keep feedback links plain unless founder wants UTM (20.4 covers campaign links).

---

### Story 20.4 — Founder Marketing Links (Dub + UTM Playbook)

**Status:** done
**Design Refs:** - (no new UI; doc-only playbook — vision Sprint 4 + founder brief, not SVG)
**Story:** As the founder running my own marketing, I want distinct links per social channel so that I can trace which channel drives signups.

**Acceptance Criteria (EARS):**

- AC1: A founder-facing playbook document shall exist (location per Dev Notes) defining the UTM convention: `utm_source` (twitter/linkedin/reddit/ph/...), `utm_medium=social|launch|email`, `utm_campaign` (campaign name), plus worked examples for the main channels.
- AC2: The playbook shall include Dub setup steps: account creation, creating one link per channel (free tier: 25 new links/mo, 1K tracked clicks/mo, 30-day analytics, 3 domains — verified 2026-10-04), and where to read per-link click results.
- AC3: The playbook shall state how to verify attribution end-to-end: Dub/UTM link → landing → PostHog (20.1) sees matching `utm_source` on `account_created`/`onboarding_started`.
- AC4: Zero product code changes — this story is setup + documentation only (unless a UTM-pass bug is found, which routes to a fix task here).
- AC5: Lint and build shall pass (doc-only change still gated).

**Tasks:** T1 (AC1) UTM convention section · T2 (AC2) Dub setup section · T3 (AC3) Attribution verification section · T4 (AC4-AC5) Confirm no code changes + gates

**Out of scope:** Building link shortening into the product; subscriber-facing share links (already `ShareButtons`/`ReferralLink`); GA/other analytics install.

**Dev Notes:**

- Where: `docs/playbooks/founder-marketing-links.md` (new folder) or `docs/` root — pick one, keep flat.
- Existing attribution that already works: `?src=powered-by` footer links, acquisition cookie capture in proxy.ts (Story 3.0), `?ref=` (subscriber referrals — different system, don't confuse: `ref` = subscriber's referral code, NOT channel attribution).
- PostHog free tier captures utm params on pageviews by default (autocapture/pageview properties) — AC3 verification is realistic without extra wiring.
- Founder account creation for Dub is his step (ask-first satisfied by prior approval).
- **[AUDIT 2026-10-07]** Prompt #3 audit found a UTM-pass bug (AC4's sanctioned fix task): fresh signups have no `founder_profiles` row at callback → acquisition `.update()` no-opped + cookie discarded → UTM lost. Fixed with atomic `upsert(onConflict:"id")` in `src/app/auth/callback/route.ts` + 6 tests (`auth-callback-acquisition.test.ts`, mutation-verified). Playbook §3 gotcha #2 + verification steps corrected in the same audit. Full record: story file "Prompt #3 audit" section + MEMORY 20.4 block.

---

### Story 20.5 — Product Hunt Prep

**Status:** done
**Design Refs:** - (no new UI; doc-only checklist — vision Sprint 4 `:437`, not SVG)
**Story:** As the founder preparing a Product Hunt launch, I want a prep checklist and asset inventory so that launch day isn't improvised.

**Acceptance Criteria (EARS):**

- AC1: A prep document shall exist covering: launch checklist (tagline, description, first comment, gallery screenshots, maker comment, topics), asset inventory (og images, logo, demo GIF/video, screenshot set — reuse 21.2 captures where suitable), and launch-day runbook (reply cadence, badge ask, timing).
- AC2: The PH tagline/description/first-comment copy shall be explicitly marked as founder-authored (copy-gate: agent does not draft public listing copy).
- AC3: Pre-launch verification items shall be cross-linked: Epic 19 audits closed, Epic 21.8 launch verification passed, pricing page current, legal pages live.
- AC4: The document shall note the standing "Growth tier excluded" decision — no Growth-tier mentions in any launch material.
- AC5: Lint and build shall pass (doc-only).

**Tasks:** T1 (AC1) Checklist + inventory + runbook · T2 (AC2) Copy-gate markers · T3 (AC3-AC4) Cross-links + standing-decision check · T4 (AC5) Gates

**Out of scope:** Submitting to PH; drafting listing copy; PH ads/spend; HN/Reddit copy (founder-owned too).

**Dev Notes:**

- Vision `:437` "Product Hunt listing prepared" — "prepared" = checklist ready + assets identified; founder does the actual PH submission.
- Timeline note: this story runs near the end of Epic 20 but the _launch itself_ waits on 21.8.
- Assets exist: `public/PreWaitlist-logo.svg`, og-image route (Phase 5.1), design SVGs in `docs/design/`.
