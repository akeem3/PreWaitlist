# Behavior-to-Source Matrix

**Story:** 21.3 — Document Cross-Reference Scan  
**Epic:** 21 — Full App Scan & Test Case Suite  
**Created:** 2026-10-12  
**Purpose:** Every test case in Stories 21.4–21.7 must cite a governing source from this file. A test case must never assert an invented expectation.

## How to use this document

1. When writing a test case (21.5+), find the behavior row and cite the **Governing source** column.
2. **Secondary refs** are optional context — do not cite them as primary authority.
3. If a behavior is missing from this matrix, the source docs may still cover it — search the cited source class first; if still missing, flag it rather than inventing a spec.
4. Conflict notes point to §Conflicts below. The **Governing** entry there wins.

## Source priority (when sources disagree)

1. `[AMENDED]` / `[SUPERSEDED]` / `[RESOLVED]` markers on story ACs and in `MEMORY.md` — the amendment trail is the authority.
2. Founder decisions in `MEMORY.md` (dated, with rationale).
3. Story ACs (`docs/stories/`, `docs/stories/completed/`) — the real functional spec.
4. PRD REQs (`docs/PRD.md` §6–§7) — higher-level; story ACs override where they diverge.
5. Design guides (`dashboard-design-guide.md`, `waitlist-page-design-guide.md`) — UI conformance only.
6. Audit findings (`docs/scans/`, `docs/completed/` plans) — historical; superseded by the stories that fixed them unless still-open.
7. Product vision (`docs/product-vision-mvp-waitlist-tool.md`) — lowest; often pre-amendment.

---

## 1. Marketing homepage

| Behavior                                                                                                            | Governing source                                                 | Secondary refs                                                                                                                         | Conflict note    |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Hero shows cold-visitor variant by default                                                                          | story-3.1 AC1                                                    | PRD REQ-6.1.1                                                                                                                          | —                |
| Hero switches to "Powered by" variant when `?src=powered-by`                                                        | story-3.1 AC3                                                    | story-20.4 (tightened trigger), MEMORY 2026-10-03                                                                                      | —                |
| Section order: Hero → Problem → Difference → Comparison → FeatureGrid → Confidence → Pricing                        | story-3.5 AC1                                                    | MEMORY "Marketing Homepage Section Order"                                                                                              | —                |
| Navbar border visible at top, hides on scroll                                                                       | story-3.x (navbar scroll)                                        | MEMORY marketing decisions                                                                                                             | —                |
| Pricing shows Free + Pro only, no Growth card                                                                       | PRD §5 Standing Decision 4                                       | MEMORY standing constraints, story-3.4                                                                                                 | —                |
| Pricing CTA: anonymous → `/signup`; signed-in → "Open Dashboard"                                                    | founder decision 2026-09-22 (user-decisions)                     | MEMORY note: 2026-09-22 "Open Dashboard" CTA unimplemented on pricing-section (functionally covered by session-redirect on auth pages) | —                |
| Comparison grid uses red ✗ and green circled ✓ SVG marks                                                            | story-3.3                                                        | PRD REQ-6.1.4                                                                                                                          | —                |
| Footer never shows "Powered by PreWaitlist"                                                                         | story-1.4 / bugfix 2026-07 (marketing-layout)                    | REQ-onboarding-preview.4                                                                                                               | —                |
| Homepage root `/opengraph-image` returns 200 PNG for anon visitors                                                  | story-20 batch (2026-10-03 middleware allowlist)                 | MEMORY "Execute batch… Phase C"                                                                                                        | —                |
| Root og:title has no "— Join the waitlist" suffix (plain "PreWaitlist")                                             | founder decision 2026-10-03 (D3)                                 | MEMORY Phase C                                                                                                                         | —                |
| Root og:image card is centered (no corner logo, no scattered layout)                                                | og redesign 2026-10-04                                           | MEMORY "og:image card redesign"                                                                                                        | —                |
| Subdomain og:image shows "Powered by" only when tier = free                                                         | og redesign AC (`showPoweredBy`)                                 | story-5.1 amended 2026-10-04                                                                                                           | —                |
| Subdomain og:title = `"{headline} — Join the waitlist"` on og/twitter only; document `<title>` stays plain headline | founder decision D3 2026-10-03                                   | PRD REQ-6.8.6 annotated [SHIPPED]                                                                                                      | —                |
| Subdomain og:image headline length tiers 76/56/40px by char count (≤40/≤90/else)                                    | og redesign 2026-10-04                                           | —                                                                                                                                      | —                |
| og:image `revalidate = 86400`                                                                                       | og redesign 2026-10-04                                           | story-5.1 AMENDED (was 300)                                                                                                            | —                |
| `og:image:alt` is static `"PreWaitlist"` for all subdomains                                                         | open founder question (og redesign notes)                        | —                                                                                                                                      | Known limitation |
| Subdomain pages set segment-level `metadataBase` to `https://{subdomain}.prewaitlist.com`                           | twitter-card fix 2026-10-04                                      | —                                                                                                                                      | —                |
| Anon root-host `/opengraph-image*` (root + nested) bypasses signin redirect                                         | 2026-10-04 middleware allowlist (`includes("/opengraph-image")`) | —                                                                                                                                      | —                |

---

## 2. Auth — signup, sign-in, verify, callback

| Behavior                                                                                                      | Governing source                                               | Secondary refs                                                   | Conflict note                                         |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| Signup form is email-only (no name field on base form)                                                        | PRD §5 Standing Decision 1                                     | story-2.2                                                        | —                                                     |
| Signup validates email syntax before submit                                                                   | story-2.3                                                      | story revenue-phase-6 bonus fixes (`validateEmail` return value) | —                                                     |
| Signup links: `/terms` → `/legal/terms`, `/privacy` → `/legal/privacy`                                        | revenue-phase-6                                                | —                                                                | —                                                     |
| Sign-up success email-verification page at `/verify-email`                                                    | story-2.2, story-2.4                                           | PRD REQ-6.5.1                                                    | —                                                     |
| Resend verification email button on `/verify-email`                                                           | story-2.4 ACs                                                  | PRD REQ-6.5.2                                                    | —                                                     |
| Email-verified users land per `next` / `plan` redirect params                                                 | story-2.3 + 2026-09-29 Pro CTA fix (`auth/callback`)           | —                                                                | —                                                     |
| `?plan=pro` + 0 waitlists → `/onboarding/1?plan=pro` + auto-open upgrade modal (trigger `pro-cta-onboarding`) | Pro CTA fix 2026-09-29                                         | MEMORY "Pro CTA → Signup → Upgrade Modal Fix"                    | —                                                     |
| `?plan=pro` + ≥1 waitlist → `/dashboard/settings/billing?plan=pro` + auto-open (trigger `pro-cta-billing`)    | Pro CTA fix 2026-09-29                                         | —                                                                | —                                                     |
| Signed-in users hitting `/signup` or `/signin` redirect away (dest respects `plan=pro` branch)                | `resolvePostAuthPath` (audit fix 2026-09-29)                   | —                                                                | —                                                     |
| Auth callback persists acquisition cookie (utm/ref/src) via **upsert** (creates profile row if missing)       | story-20.4 audit fix 2026-10-07 (was silent `.update()` no-op) | MEMORY 20.4 audit F3                                             | —                                                     |
| OAuth (Google) sign-in supported                                                                              | story-2.3                                                      | PRD §7.3                                                         | —                                                     |
| `plan=pro` cooldown exemptions: `pro-cta-onboarding` + `pro-cta-billing` bypass 1-day dismiss cooldown        | upgrade-modal fix 2026-09-29                                   | MEMORY upgrade-click flicker fix                                 | Settings-page `billing` trigger still honors cooldown |
| Acquisition cookie `?ref=` wins over `?src=`; 30-day TTL; path `/` only                                       | proxy capture (story-3.0 + 20.4)                               | MEMORY 20.4                                                      | —                                                     |

---

## 3. Onboarding wizard

| Behavior                                                                                                | Governing source                                                  | Secondary refs                            | Conflict note                                     |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| Steps 1–3 run pre-auth in localStorage (Phase A); Steps 4–5 require auth (Phase B); FlushGate bridges   | story-6.0 + onboarding overhaul 2026-08-11                        | MEMORY "Onboarding architecture overhaul" | —                                                 |
| Progress dots: 5 dots; completed + current = accent; incomplete = muted; touch-target sized             | story-4.0                                                         | design-analysis Epic 4                    | —                                                 |
| Steps 1–3 two-pane layout; Steps 4/4a/5/Success centered                                                | story-4.0                                                         | design-analysis                           | —                                                 |
| Submit buttons on Steps 1–4 are arrow-only (→); Step 5 is text+arrow                                    | design-analysis (superseded only where later stories changed it)  | story-4.1–4.6                             | —                                                 |
| Step 1: Headline, Product Name, Subdomain (debounced availability), "I'll name it later"                | story-4.1 + Epic 10 (10.5, 10.6) + story-18.3 (Headline field)    | PRD REQ-6.6.*                             | Headline label/behavior AMENDED 2026-09-30 (18.3) |
| Step 1 slug derivation strips non-`[a-z0-9-]` (spaces removed, not hyphenated)                          | story-18.3 gotcha                                                 | —                                         | —                                                 |
| Step 1 "I'll name it later" has helper caption and deferred-naming flow                                 | story-10.6                                                        | —                                         | —                                                 |
| Step 2: Template selector Minimal/Bold/Dark with MiniPreviews; selected = accent border                 | story-4.2                                                         | PRD REQ-6.7.*                             | —                                                 |
| Dark template tokens are the 5 `--color-dark-template-*` utilities (never `var()` arbitrary)            | story-4.2 + MEMORY Tailwind v4 gotcha                             | —                                         | —                                                 |
| Step 3: headline / subheadline / brand color (8 swatches + hex) / logo upload / CTA text                | story-4.3 + Epic 6 (#2 color picker) + story-18.4 (settings logo) | PRD REQ-6.8.*                             | —                                                 |
| Step 3 logo upload stores base64 data URL in `waitlists.logo_url`                                       | story-18.4 / W4                                                   | PRD REQ-6.8.4 AMENDED                     | —                                                 |
| Step 3 milestone rewards: toggle OFF default; tiers editable thresholds; add/remove 1–5; label required | story-4.3 + milestone hardening 2026-08-08 + F3/F4 2026-09-28     | PRD REQ-6.8.3 AMENDED                     | —                                                 |
| Step 3 milestone validation: threshold whole number > 0; unique thresholds; non-empty labels            | milestone hardening F3 + F4                                       | —                                         | —                                                 |
| Step 3 skip-the-line helper caption (verbatim approved copy)                                            | milestone hardening F6                                            | —                                         | —                                                 |
| Step 3 phone field config: Select "Phone number" → Off / Optional / Required; default Off               | phone collection 2026-10-03                                       | plan `docs/phone-collection-plan.md`      | Moved from 4a → Step 3 (founder 2026-10-03)       |
| Step 3 signup-counter toggle present, OFF default, hides when <10 signups                               | issue #16 / story-6.0                                             | —                                         | —                                                 |
| Step 4: two-card qualification decision (Yes/No); routes to 4a or 5                                     | story-4.4                                                         | PRD REQ-6.9.*                             | —                                                 |
| Step 4a: qualification question builder; Free cap 2 / Pro cap 5; types Free text + Multiple choice      | story-4.5 + Epic 14 (14.1)                                        | PRD REQ-6.10.*                            | MC type = dropdown (18.7 amended 2026-10-03)      |
| Step 4a MC options editor: placeholders `Option 1`/`Option 2…`; copy approved verbatim                  | Epic 14.1 COPY GAP resolved 2026-09-24                            | —                                         | —                                                 |
| Step 5: email setup — Free shows locked sender fields + Pro badge; Pro unlocks sender name / domain     | story-6.3 (from 4.6)                                              | PRD REQ-6.11.*                            | —                                                 |
| Step 5 Free bullets include "Moved-up email" + "Milestone emails" (approved copy)                       | moving-up investigation 2026-09-28 (founder C)                    | —                                         | —                                                 |
| Step 5 launch button text "Launch my waitlist" + →                                                      | design-analysis                                                   | story-6.3                                 | —                                                 |
| Success screen: position, referral link, share buttons, powered-by (Free); no progress dots             | story-6.4 (from 4.7) + Epic 8                                     | PRD REQ-6.12.*                            | —                                                 |
| Success CTA uses `<a>` not `<Link>` (Fix A)                                                             | warmth redesign switcher fix 2026-09-25                           | —                                         | —                                                 |
| Onboarding success links `/dashboard?wid=<new id>`                                                      | switcher preference fix 2026-10-08                                | —                                         | —                                                 |
| FlushGate fresh-founder (no waitlist, no draft) → redirect `/onboarding/1` on 200 `[]`                  | revenue-phase-4 F1                                                | —                                         | was keyed on 404 (dead)                           |
| Onboarding preview is a **compact approximation** of the live page (`variant="preview"`)                | W1 amendment 2026-09-30 (Epic 18)                                 | standing rule "EXACTLY" AMENDED           | see Conflicts                                     |
| Preview renders ConsentLine + TrustLine; sample updates slot; how-it-works                              | stories 18.1/18.2                                                 | —                                         | —                                                 |
| Preview adaptive fit: grow-first, scale clamp 0.6, density step, ResizeObserver                         | story-18.8                                                        | plan D-phase                              | —                                                 |
| LivePreview dark mode uses `data-theme="dark"` + utility class names                                    | story-4.2 dark fixes                                              | —                                         | —                                                 |
| `usePaddleUpgrade` on Step 4a/5 opens Pro checkout and resumes in place                                 | seamless upgrade 2026-09-22                                       | story-13.x                                | —                                                 |

---

## 4. Public waitlist page

| Behavior                                                                                                                                            | Governing source                              | Secondary refs                                 | Conflict note            |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------- | ------------------------ |
| Shared renderer `WaitlistTemplateContent` is the single implementation for preview + live (`variant="live"\|"preview"`)                             | story-7.6 + W1                                | standing rule AMENDED                          | —                        |
| Section order (live): brand → headline → subheadline → counter → form → milestones → how-it-works → updates (below fold)                            | story-18.0                                    | REQ-6.15.3 AMENDED (position moved below fold) | —                        |
| Brand lockup is screen top-left (not centered)                                                                                                      | story-18.6 / D2                               | 18.0 AC3 AMENDED                               | —                        |
| Headline live: `text-5xl sm:text-6xl` extrabold; subheadline `text-lg font-medium`                                                                  | story-18.6 round-2                            | 18.0 AC AMENDED                                | —                        |
| Form always stacked full-width (D4)                                                                                                                 | story-18.7 / D4                               | —                                              | —                        |
| Field order: button → consent → trust (round-3)                                                                                                     | story-18.7 AMENDED 2026-09-30 round 3         | round-2 had trust above button — superseded    | —                        |
| Free-text qual question: text inside field, `(optional)` badge right, warning amber                                                                 | story-18.7                                    | —                                              | —                        |
| MC qual question: visible label above, collapsed native `<select>`, placeholder "Select an option", brand-color border when answered                | MC dropdown 2026-10-03                        | story-18.7 AC4 AMENDED                         | radio rows superseded    |
| Consent = click-through sentence (no checkbox); Terms + Privacy links; provenance stamped unconditionally                                           | story-18.1 / W3                               | story-12.2.6 (checkbox) SUPERSEDED             | see Conflicts            |
| Trust line verbatim: "No spam. Unsubscribe anytime."                                                                                                | story-18.2                                    | W8                                             | —                        |
| Email capture: email (+ optional display name); honeypot; ≥2s timestamp; 5/hour per-IP                                                              | story-7.2 + phase-6 hardening                 | —                                              | consent 400 removed (W3) |
| Phone field: grouped country datalist + tel; E.164 normalize; modes off/optional/required                                                           | phone collection                              | plan                                           | —                        |
| Duplicate email → 409, "already on waitlist" + position shown                                                                                       | story-7.4                                     | —                                              | —                        |
| Social-proof counter visible when enabled and ≥10 signups                                                                                           | story-6.0 / issue #16                         | —                                              | —                        |
| Milestone chips show locked/unlocked states from `milestone_rewards`                                                                                | story-4.3 + 7.6                               | —                                              | —                        |
| Latest update card: newest `founder_updates` only; dark-template aware                                                                              | story-7.7 + 16.2 + restyle 2026-10-03         | guide §7.4                                     | —                        |
| How-it-works: 3 designed step cards                                                                                                                 | story-18.6                                    | —                                              | —                        |
| Free tier shows PoweredByFooter (`standalone`)                                                                                                      | story-12.2.11 tier gate                       | —                                              | —                        |
| Pro tier does NOT show PoweredByFooter on public page                                                                                               | 12.2.11 + og fix (page was already correct)   | —                                              | —                        |
| Archived waitlist → `/{subdomain}/gone` on public page                                                                                              | 12.2.1                                        | phase-4 4.3                                    | —                        |
| Signup POST body: `email`, optional `display_name`, optional `phone`, `ts`, referral_code; **no consent flag**                                      | phase-6 + W3                                  | —                                              | —                        |
| Server validation order: required → honeypot → ≥2s → email format → display_name ≤100 → rate limit → tier → referral → qual → atomic claim → insert | phase-6 AC (amended W3: consent step removed) | —                                              | —                        |
| 500-signup cap: free blocked at cap; Pro exempt; cached `subscriber_count`                                                                          | story-13.4 + increment RPC                    | —                                              | —                        |
| Subdomain routing via `proxy.ts` (never `middleware.ts`)                                                                                            | MEMORY standing + proxy migration             | AGENTS.md                                      | —                        |

---

## 5. Thank-you + referral loop

| Behavior                                                                  | Governing source              | Secondary refs                             | Conflict note                   |
| ------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------ | ------------------------------- |
| Thank-you page: position, referral link, share buttons at equal weight    | story-8.0/8.1                 | design-analysis Epic 8                     | —                               |
| Share = Web Share API + Copy Link equal weight (no primary)               | PRD §5 SD3                    | story-5.2 (success uses ShareButtons only) | —                               |
| Referred variant: "Referred by" pill + referrer first name                | story-8.3                     | —                                          | —                               |
| Referral link format `/{subdomain}?ref={8-char-code}`                     | story-8.1                     | —                                          | —                               |
| `?ref=` client-side filters to `/^[0-9a-f]{8}$/i`                         | phase-6 / 5.3 namespace split | —                                          | —                               |
| Self-referral silently nullified (not 400)                                | story-8.2 gotcha              | story AC5 wording AMENDED to match impl    | —                               |
| Progress line hides when all milestone tiers passed                       | milestone hardening F2        | —                                          | —                               |
| Thank-you generateMetadata reuses on-page heading; incomplete link → `{}` | social-meta batch 2026-10-03  | —                                          | —                               |
| Archived → gone on thank-you                                              | 12.2.1 phase-4                | —                                          | —                               |
| Dashboard subscriber PATCH display_name ≤100                              | audit F1 2026-09-30           | —                                          | POST had cap; PATCH was missing |

---

## 6. Public leaderboard

| Behavior                                                                | Governing source                    | Secondary refs                       | Conflict note                        |
| ----------------------------------------------------------------------- | ----------------------------------- | ------------------------------------ | ------------------------------------ |
| Rank sort: `position_boost DESC → referral_count DESC → created_at ASC` | 16.7 + boost-first sort (founder b) | engine audit §3 (pre-fix) superseded | PGRST204 fallback drops missing cols |
| Anonymized emails (`a•••@domain`)                                       | story-7.5 + `src/lib/format.ts`     | —                                    | —                                    |
| Page-based pagination; "Showing X–Y of Z"                               | story-7.5 + investigate fix         | —                                    | —                                    |
| Milestone badges on public leaderboard = docs-only (no code)            | founder decision 2026-09-28 (a)     | Standing Decision L5                 | —                                    |
| generateMetadata reuses on-page heading                                 | social-meta                         | —                                    | —                                    |
| Archived → gone                                                         | 12.2.1                              | —                                    | —                                    |

---

## 7. Dashboard — overview & shell

| Behavior                                                                                                           | Governing source                             | Secondary refs                 | Conflict note |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ------------------------------ | ------------- |
| Sidebar: grouped sections, active pill `rounded-[10px]`, tier prop gates Broadcast/Warmth locks                    | story-12.1.0 + 12.3.5                        | —                              | —             |
| Shared layout: `layout.tsx` fetches auth+waitlist+tier → `shell.tsx`                                               | story-12.3.5                                 | —                              | —             |
| Waitlist preference precedence: `?wid > cookie/localStorage > newest`                                              | switcher fix 2026-10-08                      | —                              | —             |
| Active-wid sync writes both cookie + localStorage; one-shot `router.refresh()` on stale cookie                     | switcher fix                                 | —                              | —             |
| Stat cards with comparison deltas + em-dash empty                                                                  | story-12.1.2                                 | story-9.1 superseded partially | —             |
| Empty state: welcome + guidance + ghost cards (no checklist)                                                       | story-12.1.1                                 | —                              | —             |
| Signup chart: Recharts bar, 30d/All toggle                                                                         | story-9.6                                    | —                              | —             |
| Warmth panel: 3 bars (hot/warm/cold), title is whole-card Link, free shows upgrade                                 | 12.1.3 + 15.4 redesign                       | 11.3 superseded                | —             |
| Top referrers: top 5, quality score, hidden for free tier                                                          | story-9.6 + free decision 2026-09-22         | —                              | —             |
| Qualification overview panel: all questions; bounded `@container` grid for 3+                                      | Epic 14.3 AMENDED 2026-09-27                 | teaser max-2 superseded        | —             |
| Tier refresh: poll `/api/profile` after upgrade events; `router.refresh()` on change                               | dashboard-tier-refresh 2026-09-23            | —                              | —             |
| Auto-refresh on focus + 60s interval                                                                               | 12.2.12                                      | —                              | —             |
| First-subscriber tour: 6 steps desktop / 5 below lg (sidebar omitted); flag written only on destroy; replay button | story-20.2 + audit F1 (interruptOpen)        | —                              | —             |
| Tour defers when upgrade modal open                                                                                | 20.2 audit fix                               | —                              | —             |
| Feedback FAB + founder-contact pill (bottom-right, z-30); Tally lazy-load on click                                 | stories 20.3 + 20.6 + icon revert 2026-10-09 | —                              | —             |
| Contact modal: Instagram (`https://ig.me/m/ak66m_`) + Email rows                                                   | story-20.6                                   | —                              | —             |
| `/dashboard` anon → 307 `/signin`                                                                                  | middleware allowlist                         | —                              | —             |
| Legal + unsubscribe paths anon-accessible on all hosts                                                             | 19.5 F8 fix                                  | —                              | —             |

---

## 8. Dashboard — section pages

| Behavior                                                                                                                              | Governing source                      | Secondary refs            | Conflict note                           |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------- | --------------------------------------- |
| Subscriber table: columns Name, Email, [Phone], Position, Warmth*, Referrals, Date; Phone after Email when mode on                    | story-9.2 + 12.1.5 + phone collection | 8.4 superseded on columns | Warmth column removed from table (15.6) |
| CSV export: Pro only; headers incl. Quality % after Warmth; RFC4180 escaping; filename from subdomain                                 | story-9.3 + 14.4 + 19.2               | —                         | —                                       |
| CSV OWASP hardening: prefix `'` for `=+-@` cells unless pure number                                                                   | 19.2 AC8                              | —                         | —                                       |
| Subscriber detail: position/email/grid, phone card (if mode), referral code, referred list, milestones, qual answers, email event log | story-9.4 + 11.6 + 12.2.13 + F7       | —                         | —                                       |
| Dashboard leaderboard: PAGE_SIZE=10, boost-first sort, pagination                                                                     | 16.4 + 16.5                           | —                         | —                                       |
| Dashboard warmth page: distribution + per-subscriber table; Pro gate                                                                  | 12.3.3 + 15.x                         | —                         | —                                       |
| Dashboard qualification page: id-keyed aggregation, type chips, ordinal badges                                                        | 14.3                                  | —                         | —                                       |
| Updates compose: textarea, min length 10, publish; honest failure copy U6 = "Update saved, but emails could not be sent."             | 12.1.4 + 16.1 + phase-B D4            | —                         | —                                       |
| Broadcast compose: subject ≤200, body ≤10_000, segment selector, include `waitlist_id` in POST                                        | 17.0–17.2                             | 17.2 B1 production-killer | —                                       |
| Broadcast free: direct-URL shows upgrade path; honest success copy (B7 interim)                                                       | 17.4                                  | COPY GAP B7 open          | —                                       |
| Archive waitlist + confirm dialog + banner                                                                                            | 12.2.1                                | —                         | —                                       |
| Settings hub → waitlist list → waitlist detail; profile at `/dashboard/settings/profile`                                              | 12.2.3 restructure                    | —                         | —                                       |
| Waitlist settings: edit 6 fields, logo upload, phone mode, qualification tab                                                          | 12.2.2 + 12.2.3 + phone + 14.2        | —                         | —                                       |
| Billing page: tier from context; poll after `paddle-checkout-opened`; cancel via portal                                               | 13.3 + post-deploy fixes              | —                         | —                                       |
| Warning banner on settings for cold-% threshold                                                                                       | 11.4 + 15.4 props-only                | —                         | —                                       |

---

## 9. Emails

| Behavior                                                                                                  | Governing source                                      | Secondary refs                       | Conflict note                               |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------ | ------------------------------------------- |
| Transactional from `notifications@prewaitlist.com`; broadcast/updates from `updates@mail.prewaitlist.com` | story-12.6 AMENDED 2026-10-10 (subdomain segregation) | 12.6 AC2 local-part-only superseded  | founder verified Resend domain 2026-10-10   |
| Pro custom sender via `sender_name` + `sending_domain`                                                    | 12.5 + 12.6 + from-address resolver                   | —                                    | —                                           |
| All sends resolve through `src/lib/from-address.ts`                                                       | 19.7 audit                                            | —                                    | —                                           |
| Confirmation email on signup (fire-and-forget; unsub/bounce suppressed)                                   | 12.0 + 19.1 tier fix                                  | —                                    | —                                           |
| Tier embed read: object OR array PostgREST shapes                                                         | 19.1 (P0 fix)                                         | —                                    | array-shaped fixtures were masking prod bug |
| Moved-up email: fires when referrer spots_moved ≥1 after new signup                                       | 12.2 AMENDED 2026-09-28 (referrerUpdate variable)     | spec bug fixed                       | —                                           |
| Moved-up template: sprint-3 S4 wording (founder 2026-09-28)                                               | moving-up fix                                         | code default superseded              | —                                           |
| Moved-up never uses founder custom subject/body                                                           | 12.2 fix                                              | —                                    | —                                           |
| Milestone congratulatory email + skip-the-line → position 1                                               | 7.6 + milestone hardening F1                          | —                                    | —                                           |
| Milestone idempotency key `milestone/{subscriberId}/{threshold}`                                          | hardening F1                                          | —                                    | —                                           |
| Milestone email has "Share & Move Up" CTA                                                                 | hardening F1                                          | —                                    | —                                           |
| Broadcast: Resend Batch API, chunk ≤100, custom HMAC unsubscribe, CAN-SPAM footer                         | 12.3 + 17.0                                           | never `{{{RESEND_UNSUBSCRIBE_URL}}}` | —                                           |
| Updates send path: min 10, unsub/bounce skip, `escapeHtml`, per-recipient footer, chunked                 | 16.0                                                  | —                                    | —                                           |
| Unsubscribe page GET validates without mutating; resubscribe POST                                         | 12.2.7 + phase-4 4.6                                  | —                                    | —                                           |
| Bounce webhook → `bounced_emails`; complaints = hard                                                      | 12.2.8 + 15.2                                         | —                                    | —                                           |
| Physical address footer from `business_address`                                                           | 12.2.9                                                | —                                    | —                                           |
| 90% cap warning email with link `/dashboard?upgrade=cap`                                                  | founder decision 2026-09-22                           | —                                    | —                                           |

---

## 10. Warmth engine

| Behavior                                                                              | Governing source              | Secondary refs                      | Conflict note    |
| ------------------------------------------------------------------------------------- | ----------------------------- | ----------------------------------- | ---------------- |
| Score = clamp(70 + clicks×5 + referrals×15 + qual×8 − decay, 0, 100)                  | warmth restructure 2026-09-25 | Epic 15 / 11.1 AMENDED              | Unscored removed |
| Everyone starts Hot (baseline 70); tiers hot/warm/cold, never null                    | restructure                   | 11.1 AC6/7 AMENDED                  | —                |
| Thresholds: ≥70 Hot, ≥40 Warm, else Cold                                              | restructure                   | —                                   | —                |
| Decay: 0–59 free, 60–89 −25, 90+ → 0; clock = max(click, referred signup, own signup) | 15.0 + restructure            | day ≥60 boundary                    | —                |
| Cron `/api/cron/warmth` daily 05:00 UTC, Bearer `CRON_SECRET`                         | 15.1 (Vercel-verified)        | Standing Decision 6                 | —                |
| Webhook: Svix verify, `req.text()`, idempotent via svix uid, 401/401/200              | 15.2                          | —                                   | —                |
| Opens never enter score (Apple MPP)                                                   | 15.6 / vision amended         | vision pre-amendment superseded     | —                |
| Badges: hot green `--color-status-hot` (value `#0f7a5e` since 2026-09-27)             | founder flip 2026-09-27       | coral 2026-09-25 superseded (2-day) | —                |
| Cold badge blue `#3b6fa6` (not red)                                                   | Epic 11 decision              | —                                   | —                |
| Segments API: `?wid=` + `requirePro` before lookup                                    | 17.1 / 15.3                   | —                                   | —                |

---

## 11. Qualification engine

| Behavior                                                                | Governing source        | Secondary refs        | Conflict note |
| ----------------------------------------------------------------------- | ----------------------- | --------------------- | ------------- |
| Questions stored with `options jsonb`; answers keyed by question id     | 14.0                    | PRD §7.4 AMENDED      | —             |
| Anon has no public SELECT on subscribers; public paths use admin client | 14.0                    | —                     | —             |
| Cap checks server-side (Free 2 / Pro 5)                                 | 14.0 + 14.5 tests       | —                     | —             |
| Public form MC renders dropdown (not radio)                             | 18.7 AMENDED 2026-10-03 | 14.1 radio superseded | —             |
| Settings question editor preserves ids on PATCH                         | 14.2                    | —                     | —             |
| CSV export includes qual columns + RFC4180                              | 14.4                    | —                     | —             |

---

## 12. Billing & upgrade

| Behavior                                                                                          | Governing source             | Secondary refs                 | Conflict note |
| ------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------ | ------------- |
| Pro price = $15/mo via Paddle sandbox                                                             | 13.0 + PRD pricing           | Growth tier OUT                | —             |
| Checkout API returns priceId + customData `user_id`                                               | 13.0                         | —                              | —             |
| Webhook: subscription.created/activated/canceled/past_due + transaction.completed                 | 13.0 + 2026-09-22 fix        | —                              | —             |
| `transaction.completed` guard: skip upgrade if same canceled sub id                               | phase-A 2026-10-03           | —                              | —             |
| Daily reconcile cron `/api/cron/billing-reconcile` 04:30 UTC                                      | phase-A 2026-10-03           | —                              | —             |
| Checkout auto-creates missing founder_profiles row                                                | upgrade-click fix 2026-09-29 | —                              | —             |
| `PADDLE_PRO_PRICE_ID` is server-only (not `NEXT_PUBLIC_`)                                         | phase-6 doc correction       | docs pre-correction superseded | —             |
| Upgrade modal: 7 triggers; 1-day cooldown; cooldown-exempt `pro-cta-onboarding`/`pro-cta-billing` | 13.1 + flicker fix           | —                              | —             |
| Feature gating: `isPro`/`requirePro` server+client; Warmth/Broadcast/CSV locked for Free          | 13.2                         | —                              | —             |
| 500 cap: atomic increment RPC; Pro exempt; warnings at cap                                        | 13.4 + phase-6               | —                              | —             |
| Paddle production webhook URL uses `www.` host                                                    | founder 2026-10-09           | apex 308 issue resolved        | —             |

---

## 13. Analytics (PostHog)

| Behavior                                                                                   | Governing source                       | Secondary refs     | Conflict note                     |
| ------------------------------------------------------------------------------------------ | -------------------------------------- | ------------------ | --------------------------------- |
| 13 AC2 events wired at defined touchpoints                                                 | story-20.1                             | —                  | —                                 |
| `account_created` = email signup form submit only (method:"email")                         | 20.1 D1                                | —                  | OAuth not captured                |
| `subscription_started`/`cancelled` = client tier-flips (onboarding poll + dashboard shell) | 20.1 D2                                | —                  | portal-cancel blind spot accepted |
| `subscriber_received` = EmailCaptureForm success (subscriber's browser)                    | 20.1 D3                                | —                  | —                                 |
| Autocapture ON, pinned `defaults: "2026-05-30"`                                            | 20.1 D4                                | —                  | —                                 |
| Identify in shell with person props tier/waitlist_id/subscriber_count                      | 20.1 D6                                | —                  | —                                 |
| Survey suppression flag drops only `surveyTrigger`-flagged captures                        | 20.1 D7                                | —                  | —                                 |
| UTM capture on `/` only; persisted via profile upsert at callback                          | 20.4 + audit fix                       | —                  | —                                 |
| Survey 1 / Survey 2: founder configures in PostHog (Just once)                             | 20.1 AC5 setup                         | founder gates open | —                                 |
| Vision v1.1 "Full analytics dashboard" deferred to v1.1                                    | sprint-4-plan L64 (founder 2026-10-04) | vision :431        | see Conflicts                     |

---

## 14. Legal & compliance

| Behavior                                                                              | Governing source        | Secondary refs                   | Conflict note |
| ------------------------------------------------------------------------------------- | ----------------------- | -------------------------------- | ------------- |
| `/legal/privacy` + `/legal/terms` anon-accessible all hosts                           | 12.2.4/12.2.5 + 19.5 F8 | —                                | —             |
| Consent provenance (`consent_given_at`, `consent_ip_address`) stamped unconditionally | W3 / 18.1               | 12.2.6 checkbox model superseded | —             |
| Unsubscribe mechanism = custom HMAC (not Resend Audiences)                            | 12.2.7 + REQ-7.1a       | —                                | —             |
| CAN-SPAM: unsubscribe + physical address in broadcast footers                         | 12.2.9 + 16.0           | —                                | —             |
| Bounce suppression before every send                                                  | 12.2.8 + hardening      | —                                | —             |

---

## Conflicts (AC3)

Each entry: sources that disagree → **Governing** → resolution status.

| #   | Conflict                                                                                      | Sources                                                      | Governing                                                        | Status                                             |
| --- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------- |
| C1  | Analytics scope: vision "Full analytics dashboard" vs Sprint-4 ledger                         | vision `:431` vs sprint-4-plan L64                           | **Sprint-4 ledger** (defer to v1.1)                              | Resolved — founder 2026-10-04                      |
| C2  | Consent: checkbox + 400 vs click-through line + unconditional stamp                           | story-12.2.6 (checkbox, restored phase-6) vs story-18.1 / W3 | **18.1 / W3 click-through**                                      | Resolved — 2026-09-30 Epic 18                      |
| C3  | Hot badge color: green vs coral                                                               | Epic 11 green → coral 2026-09-25 → green 2026-09-27          | **Green `--color-status-hot: #0f7a5e`**                          | Resolved — founder 2026-09-27                      |
| C4  | Preview fidelity: "EXACTLY what is shown" vs compact approximation                            | standing rule (original) vs W1 (Epic 18)                     | **W1 compact approximation**                                     | Resolved — 2026-09-30                              |
| C5  | Paddle price env name: `NEXT_PUBLIC_PADDLE_PRO_PRICE_ID` vs `PADDLE_PRO_PRICE_ID`             | epic-13 / story-13.0 (original) vs phase-6 correction        | **Server-only `PADDLE_PRO_PRICE_ID`**                            | Resolved — 2026-09-30                              |
| C6  | Leaderboard rank: referral-only vs boost-first                                                | 8.4/7.5 original sort vs 16.7 boost-first                    | **`position_boost DESC → referral_count DESC → created_at ASC`** | Resolved — 2026-09-28                              |
| C7  | Moved-up trigger variable: `getPositionUpdate(updates, data.id)` (new subscriber) vs referrer | story-12.2 spec vs 2026-09-28 fix                            | **`resolvedReferrerId` referrer update**                         | Resolved — spec AMENDED                            |
| C8  | MC question input: radio rows vs Tally-style dropdown                                         | story-18.7 original vs 2026-10-03 MC directive               | **Native `<select>` dropdown**                                   | Resolved — 2026-10-03                              |
| C9  | Warmth model: Unscored tier vs everyone-Hot baseline 70                                       | Epic 11/15 original ACs vs restructure                       | **Baseline 70, no null tier**                                    | Resolved — 2026-09-25                              |
| C10 | Unsubscribe: `{{{RESEND_UNSUBSCRIBE_URL}}}` merge tag vs custom HMAC                          | some Epic-12 docs vs REQ-7.1a + Epic 17                      | **Custom HMAC**                                                  | Resolved — docs amended 17.7                       |
| C11 | Font-weight tokens: `--font-medium` etc. (family namespace, dead) vs `--font-weight-*`        | globals.css pre-2026-09-30 vs fix                            | **`--font-weight-*`**                                            | Resolved — 2026-09-30                              |
| C12 | Email stream separation: local-part only vs dedicated subdomain                               | story-12.6 AC2 original vs 2026-10-10 amendment              | **`updates@mail.prewaitlist.com`**                               | Resolved — domain verified 2026-10-10              |
| C13 | Signup consent required (400) vs removed                                                      | phase-6 hardening vs W3                                      | **Removed (W3)**                                                 | Resolved — 2026-09-30                              |
| C14 | Onboarding field order: trust above button vs below consent                                   | 18.7 round-2 vs round-3                                      | **button → consent → trust**                                     | Resolved — round-3                                 |
| C15 | Self-referral: AC says 400 vs impl nullifies                                                  | story-8.2 AC5 wording vs implementation                      | **Silent nullification**                                         | Resolved — tests match impl; AC wording superseded |
| C16 | og:image revalidate 300s vs 86400s                                                            | story-5.1 original vs 2026-10-04 amendment                   | **86400**                                                        | Resolved                                           |
| C17 | Page-visit warmth signals (`page_views`, email_reply) vs scored-only (click/referral/qual)    | Epic 11 original vs 15.0                                     | **click+5 / referral+15 / qual+8 only**                          | Resolved — 2026-09-25                              |

---

## Governing-decisions index (AC4)

Standalone decisions that constrain testing. Cite these when a test's expected behavior derives from a standing rule rather than a single story AC.

### Standing product constraints

| Decision                                                                        | Source                                   | Testing impact                                               |
| ------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| Growth tier excluded from MVP — Free + Pro only                                 | MEMORY standing constraints (2026-09-05) | Never assert Growth-only UI or API paths                     |
| `proxy.ts` not `middleware.ts`                                                  | AGENTS.md + MEMORY                       | Guard tests target proxy routing + `updateSession` allowlist |
| Never inline styles; design tokens only                                         | AGENTS.md                                | No test should require `style={{}}` to be correct            |
| Copy-gate: never invent user-facing copy                                        | AGENTS.md + W8                           | Assert only pre-approved verbatim strings                    |
| Platform = tracker + notifier for milestones, not fulfiller                     | MEMORY standing                          | No fulfillment/webhook assertions                            |
| Email is primary engagement channel                                             | MEMORY standing                          | —                                                            |
| Preview is compact approximation (W1)                                           | Conflicts C4                             | Preview tests assert content order/copy, not pixel parity    |
| Baseline test failures = 7 (dashboard-archive 4 + dashboard-subscriber-table 3) | MEMORY suite baselines                   | Full-suite comparison: 7 fails = green                       |

### Founder decisions (2026-09 / 2026-10)

| Date       | Decision                                                                 | Source                        |
| ---------- | ------------------------------------------------------------------------ | ----------------------------- |
| 2026-09-22 | Pricing CTA session-redirect behavior                                    | MEMORY user-decisions         |
| 2026-09-22 | Free dashboard: warmth numbers visible without lock; TopReferrers hidden | MEMORY user-decisions         |
| 2026-09-22 | Upgrade modal cooldown 1 day                                             | MEMORY user-decisions         |
| 2026-09-22 | CSV export on leaderboard page                                           | MEMORY user-decisions         |
| 2026-09-22 | 90% cap email single CTA → `/dashboard?upgrade=cap`                      | MEMORY user-decisions         |
| 2026-09-22 | Paddle sandbox on production for testing                                 | MEMORY user-decisions         |
| 2026-09-25 | Warmth Unscored removed; baseline 70                                     | Conflicts C9                  |
| 2026-09-27 | Hot color = green                                                        | Conflicts C3                  |
| 2026-09-28 | Moved-up spec wording (S4)                                               | Conflicts C7                  |
| 2026-09-28 | Leaderboard milestone badges docs-only                                   | story milestone decisions (a) |
| 2026-09-28 | Skip-the-line helper copy approved                                       | hardening F6                  |
| 2026-09-29 | `pro-cta-*` cooldown exemptions                                          | flicker fix                   |
| 2026-09-30 | Consent click-through (W3)                                               | Conflicts C2                  |
| 2026-09-30 | Step 1 gains Headline field (W5)                                         | story-18.3                    |
| 2026-09-30 | Settings logo = base64 data URL (W4)                                     | story-18.4                    |
| 2026-10-03 | Phone modes off/optional/required; config on Step 3                      | phone plan                    |
| 2026-10-03 | MC questions = dropdown                                                  | Conflicts C8                  |
| 2026-10-03 | U6 copy = "Update saved, but emails could not be sent."                  | phase-B                       |
| 2026-10-03 | og:title suffix on og/twitter only                                       | Phase C D3                    |
| 2026-10-04 | Analytics dashboard deferred to v1.1                                     | Conflicts C1                  |
| 2026-10-04 | og card tier gate + centered layout + 86400 revalidate                   | og redesign                   |
| 2026-10-04 | Sub-page titles reuse on-page headings                                   | Phase C D4                    |
| 2026-10-05 | Epic 19 closed; P2 follow-ups accepted                                   | MEMORY Epic 19 Complete       |
| 2026-10-07 | Auth callback acquisition upsert                                         | 20.4 audit F3                 |
| 2026-10-09 | Contact = Instagram + Email only (no X/Reddit)                           | story-20.6                    |
| 2026-10-09 | Paddle prod webhook uses `www.` host                                     | founder                       |
| 2026-10-10 | Bulk mail → `updates@mail.prewaitlist.com`                               | Conflicts C12                 |

### Open founder gates (not yet closed — do not treat as implemented)

- PostHog surveys 1/2 live verification + event-flow sweep (deferred post-Epic 21).
- Epic 21.8 hard gate must pass before Product Hunt submission.
- `og:image:alt` static string — founder may accept or replace.
- COPY GAP B7 (broadcast success copy — interim string ships).
- Story 16.8 Share % COPY GAP L3.
- Grammar flag: Tally/contact "Submit A Feedback" title (founder wording; swap pending).

### Data-model constraints worth asserting (PRD §7.4 + migrations)

| Constraint                                                                                                         | Source                      |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| `email_normalized` generated column + dedupe unique index                                                          | phase-6 SQL                 |
| `increment_subscriber_count(p_waitlist_id, p_cap)` 2-arg + `releaseClaim()`                                        | phase-6 SQL                 |
| `waitlists.phone_mode` + `subscribers.phone`                                                                       | phone SQL                   |
| `subscribers.position_boost`                                                                                       | epic16-story6 SQL           |
| `waitlists.product_name`                                                                                           | epic-10.0                   |
| `milestones_earned` / `milestones_notified` jsonb on subscribers                                                   | story-7.6                   |
| `consent_given_at` / `consent_ip_address` / `unsubscribed_at`                                                      | epic-12.2.0                 |
| `bounced_emails` table + CHECK widen                                                                               | 12.2.8 / 15.2               |
| `email_events.event_data` jsonb                                                                                    | 11.7                        |
| `founder_profiles.paddle_subscription_id` + `paddle_customer_id`                                                   | epic-13 SQL                 |
| `waitlists.resend_domain_id`, `sending_domain`, `sender_name`, `cold_threshold`, `subscriber_count`, `is_archived` | 11.7 / 12.6 / 13.5 / 12.2.0 |
| Qualification answers keyed by question id; `options jsonb`                                                        | 14.0                        |
| Anon revoked SELECT on subscribers; public reads via admin client                                                  | 14.0                        |

---

## Source inventory (AC2 mining log)

| Source class      | Location                                                                                                                                    | Mined how                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Completed stories | `docs/stories/completed/` (133 files)                                                                                                       | Amendment markers + MEMORY trail; governing story per behavior |
| Active stories    | `docs/stories/` (19.x–21.x)                                                                                                                 | 19 findings, 20 features                                       |
| Epics             | `docs/epics/` + `docs/epics/completed/` (24)                                                                                                | Story index + standing decisions                               |
| PRD               | `docs/PRD.md` (§5–§7.4, 64 REQs)                                                                                                            | REQ inventory + standing decisions                             |
| Engine audit      | `docs/scans/engine-audit-5-engines.md`                                                                                                      | Pre-fix baseline; fixed by Epics 14–17                         |
| Public-page audit | `docs/scans/public-page-audit.md`                                                                                                           | Pre-Epic-10; fixed by 10.x/18.x                                |
| Epic-2 scan       | `docs/scans/epic-2-scan.md`                                                                                                                 | Historical auth scan                                           |
| Completed plans   | `docs/completed/revenue-lifecycle-fix-plan.md`, `dashboard-warmth-redesign-plan.md`, `dashboard-overhaul-plan.md`, `sprint-gap-analysis.md` | Amendment sources                                              |
| MEMORY            | `.memory/MEMORY.md`                                                                                                                         | Amendment trail + founder decisions                            |
| Design guides     | `docs/design/dashboard-design-guide.md`, `docs/design/waitlist-page-design-guide.md`                                                        | UI conformance rows                                            |
| Vision            | `docs/product-vision-mvp-waitlist-tool.md`                                                                                                  | Conflict participant only                                      |
