# Epic 16 — Leaderboard & Founder Updates Engine Fix

**Status:** ready
**Source:** [Five-Engine Audit §3 Leaderboard](../scans/engine-audit-5-engines.md#3-leaderboard--%EF%B8%8F-partial-verified-rescan-confidence-95), [Five-Engine Audit §4 Founder Updates](../scans/engine-audit-5-engines.md#4-founder-updates--%EF%B8%8F-partial-verified-rescan-confidence-97), [PRD §6.15 Founder Updates](../PRD.md#615-founder-updates--email-first-delivery), [PRD REQ-6.8.3](../PRD.md) (skip-the-line), [PRD Sprint 2 screens L63/72](../PRD.md), [Story 7.5](../stories/completed/story-7.5-public-leaderboard-page.md), [Story 7.6](../stories/completed/story-7.6-email-first-updates-milestone-hybrid.md), [Story 7.7](../stories/completed/story-7.7-founder-updates-feed.md), [Story 12.1.4](../stories/completed/story-12.1.4-founder-updates-compose.md), [Story 12.1.10](../stories/completed/story-12.1.10-epic-tests.md), [Story 12.3.1](../stories/completed/story-12.3.1-dashboard-leaderboard.md), [Vision :111/:114](../product-vision-mvp-waitlist-tool.md), Resend Batch API docs, CAN-SPAM FTC guide, waitlist competitor research (audit §3.7 / §4.6)

## Design References

| Reference                                                   | File                                                             |
| ----------------------------------------------------------- | ---------------------------------------------------------------- |
| Public leaderboard (works — reference only)                 | `docs/design/High-fidelity-Sprit2/public_leaderboard_HF3.svg`    |
| Dashboard leaderboard (no HF SVG exists — ASCII guide only) | `docs/design/dashboard-design-guide.md`                          |
| Latest update card (no HF SVG — Story 7.7 typography ACs)   | Story 7.7 AC5                                                    |
| Updates compose page (no HF SVG — Story 12.1.4)             | `docs/stories/completed/story-12.1.4-founder-updates-compose.md` |

**Note:** `docs/design/High-fidelity-svgs/Leaderboard.svg` does **not** exist (audit §3 claim 14). Only the public Sprint 2 SVG is available; dashboard leaderboard and updates surfaces are markdown-spec driven. Colors use Design System v2.0 tokens from `src/app/globals.css`.

## Goal

Repair the Leaderboard and Founder Updates engines end-to-end so the founder dashboard leaderboard sorts correctly, paginates per Story 12.3.1 AC5/AC6, and no longer mislabels share-of-total as "Quality"; "skip the line" milestone rewards survive position recalculation via a durable `position_boost`; the Pro updates composer publishes safely for multi-waitlist founders; update emails chunk within Resend's 100-cap, suppress unsubscribed/bounced addresses, include a visible unsubscribe link, HTML-escape founder-authored body text, and report send outcome honestly instead of always claiming "Published!"; the Latest update card respects the dark template; and the orphaned public leaderboard API (which leaks `qual_answers` + `referral_code`) is deleted. Stale Story 7.5/7.6/7.7/12.1.4/12.1.10/12.3.1 statuses, AC debt, and PRD L63/72 milestone-display promises are amended so documentation matches reality.

## Definition of Done

Dashboard leaderboard first-click on Referrals/Share% sorts descending with ↓ (second click asc ↑), table paginates 10 rows/page with "Showing X–Y of Z subscribers", full emails remain visible for founders with Story 12.1.4-style AC2 amended, and the column reads "Share %". Skip-the-line milestones set a durable `position_boost` that `recalculate_positions` honors on every subsequent signup. Pro founders with 2+ waitlists can publish updates by sending `waitlist_id`; API enforces min 10 chars server-side; eligible recipients exclude `unsubscribed_at` and bounced addresses; each Resend `batch.send` call carries ≤100 emails; HTML body is escaped and footer mirrors broadcast's visible unsubscribe link; response includes `emailSent`/`emailError` and the client shows an honest outcome (failure copy **COPY GAP** pending founder approval). `LatestUpdateCard` renders with dark-template tokens when `template === "dark"`. `src/app/api/leaderboard/[subdomain]/route.ts` is deleted (or already removed by Epic 14.0 — no double work). API + compose flow tests cover the paths Story 12.1.10 AC5 promised. PRD L63/72 "milestone display" lines and Story 12.3.1 AC2/AC4/AC5/AC6/Out-of-scope/status are amended; audit §3/§4 findings fixed by this epic are annotated. `pnpm lint`, `pnpm test`, and `pnpm build` pass with no new failures beyond the documented baseline (`dashboard-archive` 4 + `dashboard-subscriber-table` 3 + flaky `billing.test.ts` in full runs).

## Standing Decisions (locked — from fix plan; do not relitigate)

| #   | Decision                                                                                                                                     | Rationale                                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1  | **Build** dashboard leaderboard pagination (PAGE_SIZE=10, prev/next, "Showing X–Y of Z")                                                     | Story 12.3.1 AC5/AC6 are explicit; public board already paginates the same way                                                                                    |
| L2  | **Keep full emails** on founder dashboard; **amend** Story 12.3.1 AC2                                                                        | Founder outreach tool; research (audit §3.7) says anonymity is a public-board concern — AC is wrong, code is right                                                |
| L3  | Rename column label "Quality" → **"Share %"** (COPY GAP: exact string requires founder sign-off)                                             | Share-of-total is a monotonic clone of referral count; "Quality" is a product lie (vision :114 engagement-weighted never built)                                   |
| L4  | Durable **`position_boost` boolean/column** on `subscribers`; rewrite `recalculate_positions` RPC to honor it                                | REQ-6.8.3 promises permanent skip-the-line; current `position:1` is clobbered 9 lines later                                                                       |
| L5  | **Defer** public leaderboard milestone badges; **amend** PRD L63/72                                                                          | Story 7.5 correctly out-scoped them; PRD still promises "milestone display" — fix the doc, not the product                                                        |
| L6  | Public leaderboard **opt-in default OFF** is **out of scope** for this epic                                                                  | Product decision deferred; current default-on + mask remains until a dedicated privacy story                                                                      |
| L7  | Delete orphan `src/app/api/leaderboard/[subdomain]/route.ts`                                                                                 | Zero production consumers; returns raw `qual_answers` + `referral_code`; Epic 14.0 AC7 also claims it — coordinate: whoever runs first wins, the other is a no-op |
| U1  | Visible unsubscribe link in update email body — **reuse `buildBroadcastEmailFooter`** pattern                                                | CAN-SPAM "clear and conspicuous"; Gmail/Yahoo 2024+ bulk rules require body link; header-only is compliance risk                                                  |
| U2  | Apply **same unsub + bounce suppression** as broadcast                                                                                       | Industry baseline (KickoffLabs/Viral Loops); broadcast route already correct                                                                                      |
| U3  | **Chunked `resend.batch.send` inside the loop** (BATCH_SIZE=100), not flatten-then-one-send                                                  | Resend max 100/request; whole request fails if exceeded — copy `broadcast/route.ts:111-147`                                                                       |
| U4  | Accept optional **`waitlist_id`** in POST body; resolve via `.eq("founder_id").eq("id")`; **400** if absent **and** founder has 2+ waitlists | Multi-waitlist Pro accounts currently hard-fail `.single()`; single-waitlist path stays backward-compatible                                                       |
| U5  | **Defer** Story 7.6 AC2 brand color + headline-in-email; **amend** AC2                                                                       | Not in this epic's critical path; hardcoded greys stay; AC must stop claiming unshipped branding                                                                  |
| U6  | Return **`emailSent: boolean` + optional `emailError`**; client shows failure honestly (**COPY GAP** for failure string)                     | "Published!" currently fires on insert-only success even when email failed — dishonest UX                                                                         |
| U7  | Keep subject **`Update from {productName}`** (no per-update subject control)                                                                 | Consistent, low spam risk; founder-editable subject is broadcast's concern, not updates                                                                           |

**Copy rule:** Agent never invents user-facing copy. Strings marked **COPY GAP** (L3 "Share %" label, U6 failure message, any new empty/success strings beyond existing Story 12.1.4 AC text) require founder approval before shipping.

## Story Index

| ID   | Title                                       | Depends on                   | Status |
| ---- | ------------------------------------------- | ---------------------------- | ------ |
| 16.0 | Updates API Send Path Hardening             | —                            | ready  |
| 16.1 | Updates Client Publish Flow + Honest Status | 16.0                         | ready  |
| 16.2 | LatestUpdateCard Dark Template              | —                            | ready  |
| 16.3 | Founder Updates Tests                       | 16.0, 16.1, 16.2             | ready  |
| 16.4 | Dashboard Leaderboard Sort Fix              | —                            | ready  |
| 16.5 | Dashboard Leaderboard Pagination            | 16.4                         | ready  |
| 16.6 | position_boost Schema Migration             | —                            | ready  |
| 16.7 | Skip-the-Line Durable Position Boost        | 16.6                         | ready  |
| 16.8 | Cleanup, Label & Doc Amendments             | 16.0, 16.3, 16.4, 16.5, 16.7 | ready  |

**Execution order:** 16.0 first (highest-risk send path). Then **16.1 + 16.2 + 16.4 + 16.6 in parallel** (independent surfaces; 16.6 is founder-run SQL only). Then 16.5 (same file as 16.4), 16.7 (needs 16.6 SQL live), 16.3 (tests after Updates code lands), 16.8 last (depends on 16.0/16.3/16.4/16.5/16.7 outcomes). Manual gates: founder runs `position_boost` SQL (16.6) before 16.7 deploy; founder approves **COPY GAP** strings (L3, U6) before those UI strings ship; coordinate L7 orphan-API delete with Epic 14.0 if that epic runs first.

Stories must be executed in dependency order where listed; status workflow: `ready` → `in-progress` → `done` (or `blocked`). Branch: `engine-fix-leaderboard-updates` from `dev`.

---

### Story 16.0 — Updates API Send Path Hardening

**Status:** ready
**Design Refs:** — (API only; no SVG)
**Story:** As a platform, I want founder update emails to send safely at any list size, only to eligible recipients, with escaped HTML and a visible unsubscribe mechanism, and to report send outcome truthfully — so multi-waitlist founders can publish and lists >100 no longer fail silently.

**Acceptance Criteria (EARS):**

- AC1: `POST /api/updates` shall accept optional `waitlist_id` in the JSON body; when present, the waitlist shall be resolved with `.eq("founder_id", user.id).eq("id", waitlistId)` (ownership enforced); when absent and the founder has exactly one waitlist, that waitlist shall be used; when absent and the founder has 2+ waitlists, the API shall return **400** with a JSON error (Standing Decision U4).
- AC2: Body validation shall reject `text.length < 10` with **400** (min length currently client-only — Story 12.1.4 AC2); empty-after-trim and `> 2000` chars shall remain **400**.
- AC3: Subscriber selection for email dispatch shall exclude rows where `unsubscribed_at` is non-null and shall exclude emails present in `bounced_emails` for the waitlist (mirror `broadcast/route.ts:84-92` — Standing Decision U2). The update **row** shall still insert even when zero eligible recipients remain (so history is not lost); only the email phase is skipped/special-cased as specified in AC7.
- AC4: Founder-authored `text` shall be HTML-escaped before interpolation into the email HTML body (no raw `${text}` — Standing Decision U1/U2 hygiene; add shared `escapeHtml` helper if none exists under `src/lib/`).
- AC5: The email footer shall include a **visible** unsubscribe link per recipient (reuse `buildBroadcastEmailFooter(subscriberId, businessAddress)` from `src/lib/email.ts` or equivalent that embeds `generateUnsubscribeUrl`), in addition to existing `List-Unsubscribe` headers — Standing Decision U1.
- AC6: Email dispatch shall call `resend.batch.send(...)` **once per chunk of ≤100** inside the loop (copy `broadcast/route.ts:111-147`); it shall **not** flatten all chunks into a single array before one send — Standing Decision U3.
- AC7: On full or partial send success, `sent_at` shall be set (existing behavior); on total failure, `sent_at` shall remain null (REQ-6.15.2). The API response on 201 shall include `{ id, emailSent: boolean, emailError?: string | null }` where `emailSent` is true only if ≥1 chunk succeeded — Standing Decision U6. `generateUnsubscribeUrl` failures (missing `UNSUBSCRIBE_SECRET`) shall not throw unhandled after insert — wrap send-phase errors so the insert is never orphaned by a footer/header generation throw (audit §4.4 issue 11).
- AC8: Subject shall remain `Update from {productName}` (Standing Decision U7). Pro gating (`requirePro` → 403) and auth (401) shall be preserved.
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) waitlist_id resolution · T2 (AC2) server min-10 · T3 (AC3–AC5) suppression + escapeHtml + visible unsubscribe footer · T4 (AC6–AC7) chunked send + emailSent response · T5 (AC8–AC9) preserve gates + lint/build

**Out of scope:** Client UX changes (16.1), brand color/headline injection (Standing Decision U5 — amend Story 7.6 AC2 instead), subject-line control (U7), rich text, scheduling, edit/delete.

**Dev Notes:**

- **Primary file:** `src/app/api/updates/route.ts` (currently: `.single()` L47-53, min-1 empty check L36-38, no waitlist_id, select `id, email` only L79-82, unescaped `${text}` L112, flatten L131-151, silent catch L157-159, always `{ id }` L162).
- **Copy patterns from:** `src/app/api/dashboard/broadcast/route.ts` — waitlist_id required there (L37-42), suppression L84-99, chunk loop L111-147 with per-chunk `batch.send`. Differences: updates keep optional waitlist_id (U4) and always insert the update row first.
- **escapeHtml:** no existing helper under `src/` (grep clean). Create `escapeHtml` in `src/lib/email.ts` (or `src/lib/sanitize.ts`) covering `& < > " '` — unit-test in 16.3.
- **Footer:** `buildBroadcastEmailFooter` already exists at `email.ts:130+` and embeds `generateUnsubscribeUrl`. Prefer reusing it over inventing a second footer. Keep `buildEmailFooter` for transactional non-broadcast mail.
- **Select columns for waitlists:** add nothing beyond existing `id, subdomain, name, product_name, headline, sender_name, sending_domain, business_address` — brand_color stays out (U5).
- **Multi-waitlist query:** replace `.single()` with array fetch (`.eq("founder_id", user.id)` without `.single()`), then pick `waitlists[0]` when length===1, 400 when length>1 && !waitlist_id, 404/400 when length===0. If `waitlist_id` present, add `.eq("id", waitlistId)` and still require length===1.
- **Eligibility:** if eligible.length===0 after filters, still return 201 with `emailSent: false` and a non-null `emailError` (or skip send and set emailSent false) — update row already inserted; do not 400 (that would mislead client into thinking publish failed). Document chosen error string as **COPY GAP** if user-visible.
- **No inline styles / no hex in new client code** — API HTML email is exempt (existing pattern uses inline styles for email clients; follow existing email HTML conventions).
- **RLS note:** do not touch `subscribers` RLS here — full close is Epic 14.0 scope.

---

### Story 16.1 — Updates Client Publish Flow + Honest Status

**Status:** ready
**Design Refs:** Story 12.1.4 compose layout (textarea + Publish + recent list)
**Story:** As a founder, I want the compose form to target the correct waitlist and tell me whether emails actually sent — so I trust the Updates feature after publishing.

**Acceptance Criteria (EARS):**

- AC1: `/dashboard/updates/page.tsx` shall pass the resolved `waitlist.id` into `UpdatesClient` (new prop `waitlistId: string`); the client shall include `waitlist_id` in the POST body (Standing Decision U4 / audit §4 claim 2).
- AC2: On 201 with `emailSent: true`, the client shall show the existing success treatment (Story 12.1.4 AC4 — "Published!" or founder-approved replacement) and clear the textarea.
- AC3: On 201 with `emailSent: false` (or `emailError` present), the client shall **not** show the unqualified success string; it shall show a distinct failure/outcome message (**COPY GAP** — founder must approve the exact string; until approved, ship behind a clearly marked TODO/string constant and do not invent final copy in code review).
- AC4: On non-2xx or thrown network error, the client shall continue to display the API error (Story 12.1.4 AC5) — preserved behavior.
- AC5: Client min-10/max-2000 validation shall remain (Story 12.1.4 AC2); no change to placeholder/history/date rendering.
- AC6: Recent-updates list prepend behavior on successful insert shall remain (optimistic local state with returned `id`).
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) pass waitlistId + send waitlist_id · T2 (AC2–AC4) emailSent-aware messaging · T3 (AC5–AC6) preserve existing UX · T4 (AC7) Lint + build

**Out of scope:** Server validation (16.0), confirmation dialog (not required by ACs; broadcast has one but updates story never promised it), dark card (16.2), tests (16.3).

**Dev Notes:**

- **Files:** `src/app/dashboard/updates/page.tsx` (currently returns `<UpdatesClient updates={...} />` without waitlist id — L51), `src/app/dashboard/updates/client.tsx` (L37 `body: JSON.stringify({ body })`, L81 hardcoded "Published!").
- **COPY GAP U6:** candidate failure phrasing must be approved before AC3 ships; align with broadcast's honest `emailSent`/`failed` response shape (`broadcast/route.ts:156-159`) for consistency.
- **Backward compat:** if API temporarily lacks `emailSent` (mid-deploy), treat missing field as `true` only when `res.ok` — or ship 16.0 before 16.1 in same release train (preferred; Story Index orders 16.0 first).
- **No Sidebar strip:** layout already handled by `dashboard/shell.tsx` (Epic 12.3.5) — do not reintroduce Sidebar into this client.

---

### Story 16.2 — LatestUpdateCard Dark Template

**Status:** ready
**Design Refs:** Story 7.7 AC5 typography (caption label, body text, caption timestamp); dark template tokens `bg-dark-template-bg`, `text-dark-template-text`, `text-dark-template-secondary`, `border-dark-template-border` from `globals.css`
**Story:** As a visitor on a dark-template waitlist, I want the Latest update card to match the page theme so it does not appear as a white box on a dark background.

**Acceptance Criteria (EARS):**

- AC1: `LatestUpdateCard` shall accept an optional `template?: "minimal" | "bold" | "dark"` prop (default `"minimal"` or current light behavior).
- AC2: When `template === "dark"`, the card shall use dark-template utility classes (e.g. `bg-dark-template-*` / `text-dark-template-*` / `border-dark-template-*`) — **never** hardcoded hex, never `bg-[--color-*]` arbitrary values (Tailwind v4 `@theme inline` gotcha).
- AC3: Light templates (`minimal`, `bold`) shall retain current styling (`bg-card text-foreground border-border`) — no visual regression.
- AC4: Public waitlist page shall pass `template` from the waitlist record into `LatestUpdateCard` (call site `src/app/(public)/[subdomain]/page.tsx` around the `latestUpdate ? <LatestUpdateCard .../>` slot).
- AC5: Typography ACs from Story 7.7 AC5 (label/body/timestamp classes) shall be preserved for both themes.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1–AC2) template prop + dark classes · T2 (AC3) light-path regression check · T3 (AC4) wire page call site · T4 (AC5–AC6) typography + lint/build

**Out of scope:** Onboarding preview parity for latest-update card (audit open question 6 — defer); full on-page feed; edits to `WaitlistTemplateContent` beyond the card slot.

**Dev Notes:**

- **File:** `components/public/updates-feed.tsx` (hardcoded `bg-card text-foreground border-border` L13-15; no template prop).
- **Call site:** `src/app/(public)/[subdomain]/page.tsx` already selects `template` (L18) and passes it to `WaitlistTemplateContent` (L90/L110) but not to `LatestUpdateCard` (L119).
- **Test:** extend `src/__tests__/components/latest-update-card.test.tsx` (3 tests) with a dark-template class assertion — full suite in 16.3 if preferred, but a single assertion can land here to keep CI honest.
- Import path gotcha: `components/` is at project root — pages under `src/app/...` use relative imports (existing pattern in page.tsx).

---

### Story 16.3 — Founder Updates Tests

**Status:** ready
**Design Refs:** —
**Source:** [Audit §4.5 Tests inventory](../scans/engine-audit-5-engines.md), [Story 12.1.10 AC5](../stories/completed/story-12.1.10-epic-tests.md)
**Story:** As a developer, I want API and compose-flow tests for founder updates so batch-cap, suppression, validation, multi-waitlist, and honest-status behavior cannot regress silently.

**Acceptance Criteria (EARS):**

- AC1: API tests for `POST /api/updates` shall cover: unauthenticated → **401**; Free tier → **403**; body `< 10` chars → **400**; empty body → **400**; body `> 2000` → **400**; missing `waitlist_id` + multi-waitlist founder → **400**; missing `waitlist_id` + single waitlist → success path.
- AC2: API tests shall assert chunking: given 250 eligible subscribers, `resend.batch.send` is called **3 times** with payload lengths ≤100 each (not once with 250) — Standing Decision U3 regression lock.
- AC3: API tests shall assert suppression: subscriber with `unsubscribed_at` set and subscriber email in `bounced_emails` are excluded from the send payload; unsubscribed/bounced addresses do not appear in any `batch.send` argument.
- AC4: API tests shall assert HTML escaping: body containing `<script>` or `&` is escaped in generated HTML (raw payload does not contain unescaped attacker tags).
- AC5: API tests shall assert success response includes `emailSent: true` and `sent_at` update attempted; total send failure path returns `emailSent: false` (mock batch.send throw) and `sent_at` not set.
- AC6: Compose component tests (Story 12.1.10 AC5 — currently missing) shall cover: publish click calls `fetch` with `waitlist_id`; success shows success treatment and clears textarea when `emailSent: true`; failure shows non-success outcome when `emailSent: false`; API error path shows `data.error`.
- AC7: Component tests shall cover `LatestUpdateCard` dark vs light template class assertions (16.2).
- AC8: Stale test fixtures (`waitlistName`, `logoUrl` in `dashboard-updates-compose.test.tsx` `baseProps`) shall be removed or aligned to the real component interface.
- AC9: Lint and build shall pass with zero errors; full suite has **no new failures** beyond baseline (`dashboard-archive` 4 + `dashboard-subscriber-table` 3 + flaky `billing.test.ts` in full runs).
- AC10: Net test count shall increase vs pre-epic baseline (zero API update tests exist today).

**Tasks:** T1 (AC1) API validation/auth/tier tests · T2 (AC2–AC5) chunk/suppress/escape/sent_at tests · T3 (AC6) compose flow tests · T4 (AC7–AC8) card tests + fixture cleanup · T5 (AC9–AC10) full suite + count

**Out of scope:** Playwright E2E for real Resend; load/stress; fixing unrelated baseline failures.

**Dev Notes:**

- **Existing:** `src/__tests__/components/dashboard-updates-compose.test.tsx` (6 render-only; no userEvent/fetch mock — AC6 unmet); `src/__tests__/components/latest-update-card.test.tsx` (3; no dark). **Missing:** any `src/__tests__/api/updates*.test.ts`.
- Mock patterns: mock `@/lib/resend` (`resend.batch.send`), `@/lib/supabase/server`, `@/lib/tier-gating` as needed; `generateUnsubscribeUrl` may need env or mock. Follow Epic 13/15 mock gotchas (`after: vi.fn((fn)=>fn())` if `next/server` mocked; avoid fake timers + RTL `waitFor` hangs).
- Prefer landing smoke tests with 16.0 if convenient; full AC suite is this story's gate.
- Do not "fix" pre-existing `dashboard-archive` / `dashboard-subscriber-table` failures here.

---

### Story 16.4 — Dashboard Leaderboard Sort Fix

**Status:** ready
**Design Refs:** Story 12.3.1 AC3 (server rank) + sortable headers already in client; no HF SVG
**Story:** As a founder, I want clicking Referrals or Share% to sort correctly the first time — so I can find top advocates without fighting inverted arrows.

**Acceptance Criteria (EARS):**

- AC1: First click on a non-rank column that uses a descending-by-nature comparator (`referral_count`, `quality_score`/share) shall show **↓** and sort data **descending** (highest first); second click shall show **↑** and sort **ascending**. Rank/Name/Email/Date first-click behavior shall remain correct (ascending ↑ or project-consistent — do not regress).
- AC2: The double-inversion at `client.tsx:107-111` comparators + `:121` flip + `:130` first-click `desc` shall be resolved by a single source of truth for direction (recommended: normalize comparators to always ascending and let `sortDir` alone invert, **or** keep desc comparators and stop pre-setting `sortDir`/double-applying flip — pick one, document in PR).
- AC3: The test at `dashboard-leaderboard-page.test.tsx:99-112` that **certifies the bug** (expects inverted order; comment `// referral_count=3` mismatches fixture) shall be rewritten to assert correct descending order on first Referrals click with accurate fixture comments.
- AC4: Arrow indicators (`↑`/`↓`) shall match the actual data order for every sortable column after first and second click.
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1–AC2) Normalize sort direction logic · T2 (AC3–AC4) Fix enshrining test + arrow assertions · T3 (AC5) Lint + build

**Out of scope:** Pagination (16.5), Share % label rename (16.8), column count changes, mobile grid (known 🟠 — not in Standing Decisions; do not expand scope), full emails (L2 keep).

**Dev Notes:**

- **File:** `src/app/dashboard/leaderboard/client.tsx` — comparators `referral_count`/`quality_score` already `b - a` (L107-111); final `sortDir === "asc" ? cmp : -cmp` (L121); `handleSort` sets `desc` for non-rank on first click (L130).
- **Minimal fix sketch:** change `handleSort` first-click for desc-native keys to set `"asc"` **if** keeping `b-a` comparators, **or** flip comparators to `a-b` and keep `desc` first-click. Prefer: all comparators ascending + `sortDir` sole inverter (easiest to reason about).
- Server-side canonical rank in `page.tsx:120-127` is correct — do not change ranking algorithm.
- Search filter (`:81-93`) runs before sort — preserve order of operations.
- Public leaderboard sort (`leaderboard/page.tsx` / client) is already correct — no changes there.

---

### Story 16.5 — Dashboard Leaderboard Pagination

**Status:** ready
**Design Refs:** Story 12.3.1 AC5/AC6; public pattern `leaderboard-client.tsx` PAGE_SIZE=10 + prev/next + "Showing X–Y of Z"
**Story:** As a founder with hundreds of subscribers, I want the dashboard leaderboard paginated with a clear range counter so the table stays scannable and meets Story 12.3.1.

**Acceptance Criteria (EARS):**

- AC1: The dashboard leaderboard client shall paginate with `PAGE_SIZE = 10` rows per page (constant), `page` state (0-indexed), prev/next controls — mirror `src/app/(public)/[subdomain]/leaderboard/leaderboard-client.tsx` L15/L29-53.
- AC2: Footer shall show **"Showing X–Y of Z subscribers"** when unfiltered (Story 12.3.1 AC6); search-active footer may show result count (existing search footer behavior) but must not regress AC1/AC2 for the default view.
- AC3: Prev shall be disabled on first page; next disabled on last page; pagination shall operate on the **sorted+filtered** array so sort/search and page interact correctly (reset `page` to 0 when search or sortKey changes — avoid empty pages after re-sort).
- AC4: Empty state (no subscribers / no search matches) shall remain (Story 12.3.1 AC7) and hide or neutralize pagination controls when total pages ≤ 1.
- AC5: Rank display shall remain canonical server rank (`row.rank`), not page-relative index.
- AC6: Story 12.3.1 AC5/AC6 shall be satisfiable by this implementation (they are currently unmet — audit §3.4 #3).
- AC7: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) page state + slice · T2 (AC2) footer counter · T3 (AC3–AC5) controls + reset + rank · T4 (AC6–AC7) verify ACs + lint/build

**Out of scope:** Neighborhood "your position" view (public-only), server-side pagination API, changing PAGE_SIZE, mobile grid breakpoints (out of Standing Decisions).

**Dev Notes:**

- **File:** `src/app/dashboard/leaderboard/client.tsx` — no `page` state today; footer L317-321 is `"${totalCount} subscribers"` / `"${sorted.length} results"`.
- **Copy:** "Showing X–Y of Z subscribers" is Story 12.3.1 AC6 **verbatim required** — not a new COPY GAP (already approved in shipped story text). Use en dash `–` consistent with public board.
- **Tests:** add pagination cases to `dashboard-leaderboard-page.test.tsx` (Story 12.3.4 claimed pagination tests but none exist — audit §3.8); at minimum: first page shows 10 of 25, next advances range, prev disabled at start.
- Reset page when `search` or `sortKey` changes via `useEffect` or by resetting inside setters — watch ESLint `react-hooks/set-state-in-effect` (prefer setState inside event handlers when toggling sort/search).

---

### Story 16.6 — position_boost Schema Migration

**Status:** ready
**Design Refs:** — (SQL only)
**Story:** As a platform, I want a durable skip-the-line flag on subscribers and an RPC that honors it so milestone perks survive every position recalculation.

**Acceptance Criteria (EARS):**

- AC1: The system shall ship SQL (file under `docs/stories/sql-writeups/`) that: (a) adds `position_boost boolean not null default false` to `public.subscribers`; (b) optionally backfills `position_boost = true` where current `position = 1` **and** `milestones_earned` contains an entry whose label matches skip-the-line semantics **or** documents why backfill is skipped (recommend: **no backfill** of arbitrary rank-1 rows — only future milestone awards set the flag; note choice in SQL comments); (c) creates an index only if query plans require it (likely unnecessary for ≤500 subs — default: no index).
- AC2: The migration shall replace `public.recalculate_positions(p_waitlist_id uuid)` (existing: `docs/stories/sql-writeups/epic12-position-recalculation.sql`) so ordering is: **`position_boost DESC`**, then `referral_count DESC`, then `created_at ASC` — boosted subscribers always rank above non-boosted peers with equal-or-fewer referrals, and ties among boosted follow referral/date rules.
- AC3: The RPC shall remain `SECURITY DEFINER`, accept the same `p_waitlist_id uuid` argument, and return the same shape `{ subscriber_id, old_position, new_position, spots_moved }[]` (or document any shape change and update `src/lib/positions.ts` in 16.7).
- AC4: The SQL file shall be runnable as a single idempotent script in Supabase SQL Editor (`CREATE OR REPLACE FUNCTION`, `ADD COLUMN IF NOT EXISTS`).
- AC5: The founder shall be instructed (story verification / PR) to run the SQL **before** deploying 16.7 code that sets `position_boost`.
- AC6: Lint and build shall pass with zero errors (docs/SQL only still run lint for safety).

**Tasks:** T1 (AC1) Column migration · T2 (AC2–AC3) RPC rewrite · T3 (AC4–AC5) Idempotency + run instructions · T4 (AC6) Lint + build

**Out of scope:** Application code that sets the flag (16.7), public leaderboard badge display (L5 deferred), changing referral_count semantics.

**Dev Notes:**

- **Existing RPC:** `docs/stories/sql-writeups/epic12-position-recalculation.sql` — `ROW_NUMBER() OVER (ORDER BY referral_count DESC, created_at ASC)` (verify exact clause when writing migration).
- **Caller:** `src/lib/positions.ts` `recalculatePositions` via `supabase.rpc("recalculate_positions", { p_waitlist_id })` — keep signature stable so 16.7 need only set the flag, not rewire calls.
- **Clobber root cause:** `milestones.ts:133-134` sets `position: 1` on subscriber update; `subscribers/route.ts:597` then runs RPC which overwrites `position` for every row — 16.7 stops writing `position: 1` and writes `position_boost: true` instead; RPC must read the column (AC2).
- Manual gate: founder runs SQL in Supabase before 16.7 ships to production.

---

### Story 16.7 — Skip-the-Line Durable Position Boost

**Status:** ready
**Design Refs:** REQ-6.8.3 (milestone reward label containing "skip the line" boosts position to front)
**Story:** As a subscriber who earned a "skip the line" reward, I want my front-of-queue position to persist after future signups — so the perk is real, not momentarily true.

**Acceptance Criteria (EARS):**

- AC1: When `checkAndFulfillMilestones` awards a tier whose `reward_label` contains `"skip the line"` (case-insensitive — preserve existing match), it shall set **`position_boost: true`** on the subscriber (and may still record `milestones_earned` / `milestones_notified` as today) instead of (or in addition to, for display until RPC runs) writing `position: 1` as the durable mechanism.
- AC2: After 16.6 SQL is applied, `recalculate_positions` shall place boosted subscribers ahead of non-boosted subscribers regardless of subsequent referral-count growth by others (until boost cleared — no clear API in this epic).
- AC3: A later `POST /api/subscribers` that triggers `recalculatePositions()` shall **not** remove an existing subscriber's boost (regression test for audit §3.4 #5 order-of-ops clobber at `route.ts:588→597`).
- AC4: `getPositionUpdate` / moved-up email behavior for the new signup shall remain correct (boosted rows shifting others is expected).
- AC5: Unit tests for `milestones.ts` (currently **zero** — audit §3.5) shall cover: skip-the-line label sets `position_boost`; non-skip label does not; accumulator still appends `milestones_earned` once; notify-once via `milestones_notified`.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) milestones.ts flag write · T2 (AC2–AC4) verify RPC honors boost + no clobber · T3 (AC5) milestones unit tests · T4 (AC6) Lint + build

**Out of scope:** Boost clear/unassign UI, fraud (Waitlister fingerprint — Sprint 4), public milestone badges (L5), changing label match rules, RLS.

**Dev Notes:**

- **File:** `src/lib/milestones.ts` L133-134 (`positionUpdate = { position: 1 }` spread into update L141-148).
- **Depends on 16.6** column + RPC existing in the target database before this code runs in production; local/dev: run SQL first.
- Select list for subscriber in milestones.ts (L81) must include `position_boost` if read; write path needs it in the update object.
- Tests: new `src/__tests__/lib/milestones.test.ts` with mocked Supabase (follow warmth batch mock patterns). `generateUnsubscribe`/email send failures already caught internally — mock `sendEmail`.
- Do not change `referral_count` computation or RPC argument names.

---

### Story 16.8 — Cleanup, Label & Doc Amendments

**Status:** ready
**Design Refs:** — (code cleanup + documentation)
**Story:** As a team, I want dead leaking code removed, the misleading "Quality" label renamed, and stories/PRD/audit/MEMORY amended — so docs stop promising unbuilt behavior and security debt is closed.

**Acceptance Criteria (EARS):**

- AC1: `src/app/api/leaderboard/[subdomain]/route.ts` shall be deleted; `src/__tests__/api/leaderboard.test.ts` shall be deleted or rewritten against a remaining real consumer (if none, delete — Standing Decision L7). Coordinate with **Epic 14.0 AC7**: if Epic 14 already removed it, this AC is a verified no-op (confirm file absent).
- AC2: Dashboard leaderboard column header currently labeled **"Quality"** (`client.tsx` SortHeader) shall be renamed to the founder-approved share label (Standing Decision L3 — **COPY GAP**: default proposal "Share %"; do not ship a different string without approval). Sort key may remain `quality_score` internally or be renamed `share_percent` — if renamed, update `page.tsx` computation field and tests coherently (prefer minimal: rename **display label only** first).
- AC3: Story 12.3.1 shall be amended: AC2 → full email on founder dashboard (Standing Decision L2); AC4 → document computed share-of-total (not a stored `quality_score` column); AC5/AC6 → annotated as **implemented in Epic 16 Story 16.5**; Out-of-scope line about CSV/search → note they shipped in 12.3.x intentionally (scope acceptance, not creep-to-remove); `Status` → `done` once 16.4+16.5 land; Design Ref path corrected (missing SVG → dashboard-design-guide / public SVG note).
- AC4: Story 7.5 AC10 shall note implementation is Prev/Next (or equivalent) with "Showing X–Y of Z" counter rather than "View More" **or** the AC text updated to match shipped UX (choose one, consistent with public client). Story 7.5 Out-of-scope already defers milestone badges — PRD must match (AC5).
- AC5: PRD Sprint 2 lines **L63** and **L72** ("milestone display" / "milestone threshold display" on **public leaderboard**) shall be amended to remove unbuilt public milestone badge promises (Standing Decision L5) or explicitly mark deferred — without weakening thank-you page milestone threshold display which **is** built.
- AC6: Story 7.6 AC2 shall be amended to match Standing Decision U5 (brand color + headline-in-email deferred/not shipped); status frontmatter/`Status` fields for Story 7.6, 7.7, 12.1.4 corrected to `done` where work shipped; Story 12.1.4 Out-of-scope "email sending (deferred to Epic 12)" corrected (email shipped in 7.6); Story 12.1.10 AC5 annotated with the test file(s) that finally satisfy it (16.3) or AC text pointed at real coverage.
- AC7: `docs/scans/engine-audit-5-engines.md` §3 and §4 table rows fixed by 16.0–16.7 shall be marked resolved/annotated with story ids (flip severity or add ✅ Epic 16 pointer) without erasing residual known debt (public opt-in L6, engagement-weighted vision formula still unbuilt, mobile grid 🟠 if untouched, brand color U5 residual).
- AC8: `.memory/MEMORY.md` shall record Epic 16 standing decisions (pagination built, full email kept + AC amended, Share % label, position_boost durable, updates chunk/suppress/escape/honest status, orphan API delete).
- AC9: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Orphan API delete · T2 (AC2) Share % label (COPY GAP gate) · T3 (AC3–AC4) Story 12.3.1 + 7.5 amendments · T4 (AC5) PRD L63/72 · T5 (AC6–AC8) Updates story statuses + audit + MEMORY · T6 (AC9) Lint + build

**Out of scope:** Implementing engagement-weighted quality score (vision :114 — product decision beyond this epic), public leaderboard opt-in (L6), building milestone badges (L5 — deferred), mobile grid redesign, removing CSV/search from dashboard, editing Epic 14/15 docs except cross-references.

**Dev Notes:**

- **Orphan API:** only tests import it today (audit §3.4 #7/#21). Delete route + `leaderboard.test.ts` together in one commit so suite stays green.
- **AC2 COPY GAP:** "Share %" is the fix-plan proposal — founder may prefer "Referral share", "% of referrals", etc. Block merge of the label change until approved; other 16.8 doc work can proceed.
- **Doc-only story touches:** files under `docs/stories/completed/` (7.5, 7.6, 7.7, 12.1.4, 12.1.10, 12.3.1), `docs/PRD.md` L63/L72, audit file, MEMORY.md. Do not delete historical story files.
- **Cross-epic:** if Epic 14.0 ships first, re-read AC1 and skip duplicate delete; still update audit annotation with whichever story id closed it.
- No production runtime change except AC1 (route removal) and AC2 (label string).
