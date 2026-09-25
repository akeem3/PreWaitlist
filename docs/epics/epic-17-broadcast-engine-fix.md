# Epic 17 — Broadcasting Engine Fix

**Status:** ready
**Source:** [Five-Engine Audit §5 Broadcasting](../scans/engine-audit-5-engines.md#5-broadcasting--%EF%B8%8F-not-functional-verified-rescan-confidence-98), [PRD L123 Broadcast defaults](../PRD.md), [PRD L171 Unsubscribe mechanism](../PRD.md), [PRD REQ-7.1a.1–4 Never Audiences](../PRD.md), [MVP Vision Module 3 warmth-segmented broadcast](../product-vision-mvp-waitlist-tool.md), [Story 12.3](../stories/completed/story-12.3-broadcast-email.md), [Story 12.4](../stories/completed/story-12.4-warmth-segmented-broadcast.md), [Story 12.5](../stories/completed/story-12.5-email-customisation.md), [Story 12.6](../stories/completed/story-12.6-email-infrastructure-separation.md), [Story 12.1.8](../stories/completed/story-12.1.8-broadcast-duplicate-fixes.md), [Story 12.2.7 unsubscribe](../stories/completed/story-12.2.7-unsubscribe-mechanism.md), Resend Batch API + Idempotency docs, Klaviyo expected-recipient count UX, DOMPurify / HTML email sanitization research

## Design References

| Reference                                                  | File                                           |
| ---------------------------------------------------------- | ---------------------------------------------- |
| C3 — Broadcast Compose Shell (ASCII; optional history row) | `docs/design/sprint-3-design-specs.md` §C3     |
| S5 — Broadcast Compose Screen                              | `docs/design/sprint-3-design-specs.md` §S5     |
| Upgrade modal trigger #4 (Free → Broadcast)                | `docs/design/sprint-3-design-specs.md` §S9     |
| Sidebar Broadcast lock state                               | `components/dashboard/sidebar.tsx` (no HF SVG) |
| Segment pills / confirm / success (current implementation) | `src/app/dashboard/broadcast/client.tsx`       |

**Note:** No high-fidelity Sprint 3 SVG exists for broadcast; C3/S5 are markdown-spec driven. Colors use Design System v2.0 tokens from `src/app/globals.css`. Email HTML uses inline styles (existing convention — exempt from the no-inline-styles rule for recipient-facing email only).

## Goal

Repair the Broadcasting engine so a Pro founder can actually send warmth-segmented emails: the compose client must send `waitlist_id` (today every POST 400s — the engine is dead), segments must resolve the correct waitlist under multi-waitlist and report **deliverable** counts that match send-time eligibility (Klaviyo-style expected recipients), the API must fail honestly instead of returning `ok:true` with zero sent, preview must show the real `From` address via `resolveFromAddress` including `sending_domain`, Free founders hitting the URL directly must get the upgrade path Story 12.3 AC8 promised, HTML bodies must be sanitized (not wholesale-escaped — HTML is intentional), double-send risk must be closed with client guard + Resend idempotency keys, subject/body length caps must be enforced server-side, and the entire send path must gain the tests that let the `waitlist_id` bug ship. Documentation claims (`{{{RESEND_UNSUBSCRIBE_URL}}}`, default segment, story statuses) are amended to match reality — code's custom HMAC is correct under PRD “never Audiences.”

## Definition of Done

A Pro founder with one or many waitlists opens `/dashboard/broadcast?wid=…`, sees segment counts that equal send-time eligible recipients (unsub + bounce excluded), previews a From line that matches `resolveFromAddress(..., sending_domain)`, confirms with the true recipient count, and the POST includes `waitlist_id` so the send reaches `resend.batch.send` in ≤100 chunks with per-chunk idempotency keys. Total batch failure returns a non-success response (no silent `ok:true` / count 0). Free direct URL shows the upgrade prompt (sidebar path unchanged). Subject/body are length-capped; HTML is sanitized; unsubscribe URL generated once per recipient. Client tests lock the payload shape; API tests cover 401/403/400/segment/success/total-failure/chunking; segments tests cover `?wid=` + requirePro + eligible counts. Story 12.3 AC5/AC7/AC8, Story 12.4 AC6, Story 12.1.8 AC3 remainder, Story 12.6 AC4 wording, MEMORY:780/865, and story frontmatter statuses are amended. `pnpm lint`, `pnpm test`, and `pnpm build` pass with no new failures beyond the documented baseline (`dashboard-archive` 4 + `dashboard-subscriber-table` 3 + flaky `billing.test.ts` in full runs).

## Standing Decisions (locked 2026-09-24 — do not relitigate)

| #   | Decision                                                                                                                                                                              | Rationale                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| B1  | Client **must include `waitlist_id`** in POST body; page already passes the prop — destructure and use it                                                                             | API hard-requires it (`route.ts:37-42`); prop unused today → **every send 400s** (audit §5 claim 1)                       |
| B2  | Segments: accept **`?wid=`**, use `.maybeSingle()` / scoped fetch, add **`requirePro`**                                                                                               | Multi-waitlist + Free count leak (audit §5 claims 2, 7)                                                                   |
| B3  | Segment **counts = deliverable/eligible** (exclude `unsubscribed_at` + bounced for that waitlist) — show eligible number in pills + confirm                                           | Klaviyo “Estimated recipient count” subtracts unsub/suppressions before send (web research §5.6); UI ≠ send today         |
| B4  | Total send failure → **honest response**: non-2xx **or** 200 `{ ok:false, recipient_count:0, errors:[…] }` — never `ok:true` with 0 + history lie                                     | Audit §5 claim 4; Resend batch can fail entire request if any payload invalid (Resend docs)                               |
| B5  | **Keep custom HMAC unsubscribe** + RFC 8058 headers; **amend** Story 12.3 AC5 + MEMORY (remove `{{{RESEND_UNSUBSCRIBE_URL}}}` claims)                                                 | PRD L398/400 never use Audiences; merge tag requires Audiences; code is correct, docs are wrong                           |
| B6  | Preview From = **`resolveFromAddress(senderName, productName, headline, "broadcast", sending_domain)`**; page must select `sending_domain`                                            | Story 12.1.8 AC3 half-met; audit §5 claim 9                                                                               |
| B7  | Success copy must not claim “delivered” for Batch API accept/queue (**COPY GAP** for exact final string; interim: honest “sent/queued” semantics)                                     | Audit §5 claim 10; webhook `delivered` is the real delivery event (Epic 11)                                               |
| B8  | Broadcast HTML body: **sanitize** (strip `script`, `iframe`, `on*` handlers) — do **not** wholesale `escapeHtml`                                                                      | Placeholder says “HTML is supported”; wholesale escape destroys the feature (audit §5.6, DOMPurify research)              |
| B9  | Double-send: client `sending` guard **+** Resend **`idempotencyKey` per chunk** (`broadcast/{waitlistId}/{chunkIndex}` style, ≤256 chars, 24h)                                        | Resend batch idempotency keys supported (docs); prevents double-click / retry duplicates within 24h                       |
| B10 | **Defer** broadcast history UI (C3 “optional”); keep write-only `broadcasts` insert; check insert `.error` and surface in logs/response                                               | Scope control; schema comment promises activity feed but no design ships a table in this epic — optional C3 row stays out |
| B11 | Free **direct URL** `/dashboard/broadcast` → upgrade path (not silent `redirect("/dashboard")`) — align Story 12.3 AC8                                                                | Sidebar lock already opens modal; AC8 says “when clicking Broadcast”; direct URL must not dead-end                        |
| B12 | Bounce eligibility: **single batch query** on `bounced_emails` (`.in("email", emails)` or per-waitlist set), not sequential `isEmailBounced` N+1                                      | Perf (audit §5 claim 6/issue 7); same correctness as send-time filter                                                     |
| B13 | Enforce **subject max 200 chars**, **body max 10_000 chars** server + client (400 / inline)                                                                                           | 12.1.8 Out of Scope deferred this; needed before scale; no Resend hard limit but oversized payloads waste quota           |
| B14 | `generateUnsubscribeUrl` **once per recipient**; pass URL into footer helper (or reuse token) — never call twice; wrap throw so map cannot 500 mid-batch silently after partial sends | Audit §5 claim 17; missing `UNSUBSCRIBE_SECRET` must fail loudly before any send, not mid-chunk                           |
| B15 | Remove dead `subscriberCount` prop **or** use as fallback when segments fetch fails — prefer remove if unused after B3                                                                | Audit §5 claim 18; dead plumbing confuses future AC mapping                                                               |
| B16 | Story status frontmatter for 12.3/12.4/12.5/12.6 → **`done`** in this epic’s doc story; sprint-3-plan already says done                                                               | Audit §5 claim 20; metadata lie                                                                                           |
| B17 | Default segment remains **`"all"`** (PRD L123 + 12.1.8 AC1); **delete/amend Story 12.4 AC6** (default cold)                                                                           | Docs conflict resolved in favor of later fix + PRD                                                                        |
| B18 | Do **not** introduce Resend Audiences, Broadcasts product, or contact sync — Batch API only (REQ-7.1a.1)                                                                              | Standing product decision; reconfirmed in research                                                                        |

**Copy rule:** Agent never invents user-facing copy. Strings marked **COPY GAP** (B7 success/failure wording, any new empty/error strings beyond existing Story 12.1.8/12.3 AC text) require founder approval before shipping.

## Story Index

| ID   | Title                                         | Depends on                   | Status |
| ---- | --------------------------------------------- | ---------------------------- | ------ |
| 17.0 | Broadcast API Response Honesty & Send Hygiene | —                            | ready  |
| 17.1 | Segments API: wid, Pro gate, eligible counts  | —                            | ready  |
| 17.2 | Broadcast Client: waitlist_id + eligible UX   | 17.1                         | ready  |
| 17.3 | Preview From Address + sending_domain         | —                            | ready  |
| 17.4 | Free Direct-URL Upgrade + Honest Success Copy | 17.0, 17.2                   | ready  |
| 17.5 | Broadcast HTML Sanitization                   | —                            | ready  |
| 17.6 | Broadcast Tests                               | 17.0, 17.1, 17.2, 17.3, 17.5 | ready  |
| 17.7 | Doc Amendments & Status Sync                  | 17.0–17.6                    | ready  |

**Execution order:** **17.0 + 17.1 + 17.3 + 17.5 in parallel** (independent files/surfaces). Then **17.2** (client waits for eligible-count contract from 17.1; can ship waitlist_id payload earlier if needed). Then **17.4** (needs API honest status + client success path). Then **17.6** (tests after code). Then **17.7** (docs last). Manual gates: founder approves **COPY GAP** strings (B7) before 17.4 UI ships; no SQL migrations required for this epic (`broadcasts` table already exists).

Stories must be executed in dependency order where listed; status workflow: `ready` → `in-progress` → `done` (or `blocked`). Branch: `engine-fix-broadcast` from `dev`.

---

### Story 17.0 — Broadcast API Response Honesty & Send Hygiene

**Status:** ready
**Design Refs:** — (API only; no SVG)
**Story:** As a platform, I want broadcast sends to report truthfully, generate unsubscribe URLs once, batch-check bounces, enforce length caps, and use per-chunk idempotency keys — so partial/total failures never look like success and double-sends are prevented.

**Acceptance Criteria (EARS):**

- AC1: `POST /api/dashboard/broadcast` shall validate `subject` non-empty after trim and `≤ 200` characters and `body` non-empty after trim and `≤ 10_000` characters; violations shall return **400** with a JSON error (Standing Decision B13). Existing `waitlist_id` required and `requirePro` 403/401 gates shall be preserved.
- AC2: After a send attempt, if **zero** chunks succeeded (`totalSent === 0` and at least one batch was attempted), the API shall **not** return `ok: true`. It shall return HTTP **502** (or documented non-2xx) with `{ ok: false, recipient_count: 0, errors: string[] }` (Standing Decision B4). On full or partial success (≥1 chunk), HTTP **200** `{ ok: true, recipient_count, errors?: [] }` where `recipient_count` is the sum of successfully sent chunk lengths only.
- AC3: Every `resend.batch.send(...)` call shall pass an **idempotency key** unique per request/chunk (e.g. `broadcast/{waitlist_id}/{chunkIndex}` or a per-attempt UUID retained across retries of the same logical attempt), length ≤ 256 chars (Standing Decision B9; Resend Batch Idempotency docs). Keys shall not be regenerated per subscriber.
- AC4: Unsubscribe URL shall be generated **once per recipient** and reused for both `List-Unsubscribe` header and body footer (Standing Decision B14). `generateUnsubscribeUrl` / footer generation shall be wrapped so a missing `UNSUBSCRIBE_SECRET` fails the request **before** any `batch.send` (fail-fast, no partial silent send). The route shall not call `generateUnsubscribeUrl` twice for the same subscriber.
- AC5: Bounce suppression for eligibility shall use a **batched query** against `bounced_emails` for the waitlist (`.in("email", …)` or equivalent set membership), not a sequential `await isEmailBounced` per row (Standing Decision B12). Unsubscribed (`unsubscribed_at` non-null) exclusion shall remain (existing behavior).
- AC6: The `broadcasts` insert result shall be checked; on insert failure the response shall include an error field or log at `error` level — never silently drop history (Standing Decision B10 partial: history row still written on success path).
- AC7: Auth (401), `requirePro` (403), missing `waitlist_id` (400), missing waitlist / not owner (404), empty eligible set (400 existing) shall remain. No change to segment filter semantics (`all` | `hot_warm` | `cold`; ~~unscored only in `all`~~ **[AMENDED 2026-09-25 — warmth restructure:** no Unscored state exists; `all` = every subscriber**]**).
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) subject/body length caps · T2 (AC2) honest ok/failure response · T3 (AC3) per-chunk idempotency keys · T4 (AC4–AC5) single unsubscribe gen + batched bounces · T5 (AC6–AC8) insert check + preserve gates + lint/build

**Out of scope:** Client UX (17.2), preview From (17.3), sanitization (17.5), Free URL upgrade (17.4), history read UI (B10 defer), segments route (17.1).

**Dev Notes:**

- **Primary file:** `src/app/api/dashboard/broadcast/route.ts`.
- **Current defects:** L44-49 empty-only validation; L88-92 N+1 `isEmailBounced`; L115 + `email.ts:135` double `generateUnsubscribeUrl`; L140-147 batch without idempotency; L142-159 always `ok:true` + unchecked insert.
- **Resend SDK:** `resend.batch.send(emails, { idempotencyKey })` or options object — verify against installed `resend` package version; fall back to `Idempotency-Key` header pattern from docs if SDK option name differs.
- **Bounce batch:** select `email` from `bounced_emails` where `waitlist_id = waitlist.id` then `Set.has(sub.email)`; reuse pattern if Epic 16 Updates story created a shared helper — otherwise local to this route first, extract only if both need it post-merge.
- **Length constants:** export `BROADCAST_SUBJECT_MAX = 200`, `BROADCAST_BODY_MAX = 10000` from route or `src/lib/email.ts` so client can import the same caps (client enforcement in 17.2).
- **Response shape:** keep `recipient_count` name for backward compatibility with client success path; add `ok`, `errors`.
- **Do not** change custom HMAC unsubscribe (B5) or introduce Audiences (B18).

---

### Story 17.1 — Segments API: wid, Pro gate, eligible counts

**Status:** ready
**Design Refs:** — (API only; no SVG)
**Story:** As a Pro founder with one or more waitlists, I want segment counts for the waitlist I’m editing to match who will actually receive email — so the confirm dialog and pills are truthful.

**Acceptance Criteria (EARS):**

- AC1: `GET /api/dashboard/broadcast/segments` shall accept optional query param **`wid`** (waitlist id). When present, the waitlist shall be loaded with `.eq("id", wid).eq("founder_id", user.id)` and **`.maybeSingle()`**; when absent, resolve founder’s waitlist(s) without `.single()` throwing on 2+ rows — if 2+ and no `wid`, return **400** (or use first deterministic waitlist only if product prefers single-waitlist fallback — **choose 400** for explicitness, matching Updates multi-waitlist pattern). Missing/foreign waitlist → **404**.
- AC2: The endpoint shall enforce **`requirePro`** (or equivalent tier check) and return **403** for Free tier (Standing Decision B2 / audit §5 claim 7). Auth without session → **401**.
- AC3: Each of `all`, `hot_warm`, `cold` counts shall equal the number of subscribers in that warmth partition **who are eligible to receive email**: `unsubscribed_at IS NULL` **and** email not in `bounced_emails` for that waitlist (Standing Decision B3). Warmth partition rules unchanged: `hot_warm` = warmth_score in (hot, warm); `cold` = warmth_score = cold; `all` = all subscribers ~~(including unscored)~~ **[AMENDED 2026-09-25 — no Unscored state; every row is hot/warm/cold]** then eligibility-filtered.
- AC4: Response shape shall remain `{ all: number, hot_warm: number, cold: number }` (client dependency in 17.2).
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) wid + maybeSingle · T2 (AC2) requirePro · T3 (AC3–AC4) eligible counts + response shape · T4 (AC5) Lint + build

**Out of scope:** Send path (17.0), client UI (17.2), warmth score correctness (Epic 15), history.

**Dev Notes:**

- **Primary file:** `src/app/api/dashboard/broadcast/segments/route.ts` (currently L4-47: auth only, `.single()` L15-19, raw counts L25-40).
- **Page already has `?wid=`** (`page.tsx:32-42`) and sidebar attaches it — **client must pass `wid` when fetching** (implemented in 17.2).
- **Eligible count implementation options:**
  1. Fetch subscriber emails for waitlist (or per-segment ids), batch-fetch bounced emails, filter in memory — mirrors send path.
  2. SQL-side: not available without RPC; prefer Supabase query + Set for MVP list sizes (≤500 free / pro scale ok).
- Prefer **shared eligibility helper** only if 17.0 and 17.1 land in same PR and a tiny `src/lib/broadcast-eligibility.ts` avoids drift; otherwise duplicate the two-line filter with a comment pointing at the sibling story (avoid over-abstracting mid-epic).
- **requirePro:** import from `src/lib/tier-gating.ts` as POST route does (`route.ts:29-32`).
- Counts are **display** truth for confirm — must match 17.0 eligibility rules (B3).

---

### Story 17.2 — Broadcast Client: waitlist_id + eligible UX

**Status:** ready
**Design Refs:** C3 compose form; segment pills already in `client.tsx` (keep pill UI, not C3’s `<select>` — pills are current implementation + 12.4 AC1)
**Story:** As a Pro founder, I want the compose form to target the correct waitlist and show deliverable counts — so my send actually goes out and the confirm number matches reality.

**Acceptance Criteria (EARS):**

- AC1: `BroadcastClient` shall **destructure and use** `waitlistId` (already a prop from `page.tsx:55`) and include **`waitlist_id`** in `POST /api/dashboard/broadcast` JSON body alongside `subject`, `body`, `segment` (Standing Decision B1; audit §5 claim 1). The send shall no longer 400 for missing `waitlist_id`.
- AC2: On mount (and when `waitlistId` changes), the client shall fetch `/api/dashboard/broadcast/segments?wid={waitlistId}` and store `{ all, hot_warm, cold }` (Standing Decision B3 / B2 consumer).
- AC3: Segment pill labels, the “Send to {N} subscribers” line, the `window.confirm` message, and the Send button label shall all use the **same eligible count** from segments (no separate raw `subscriberCount` path).
- AC4: Default segment state shall remain **`"all"`** (Standing Decision B17 / PRD L123).
- AC5: Client-side validation shall enforce subject `≤ 200` and body `≤ 10_000` (shared constants from 17.0) in addition to existing non-empty checks; invalid input disables Send (mirror server 400).
- AC6: On `200 { ok: true, recipient_count }`, client shall show success treatment using `recipient_count` (exact success string: existing “Sent to {n}…” refined in 17.4 if COPY GAP). On non-2xx or `{ ok: false }`, client shall show the API `errors` / `error` message (or network error string) and **shall not** show the success screen.
- AC7: Dead `subscriberCount` prop shall be removed from the client interface **or** documented as unused fallback — prefer **remove** from `BroadcastClientProps` if no UI reads it after AC3 (Standing Decision B15); page may stop passing it if unused.
- AC8: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) include waitlist_id · T2 (AC2–AC3) segments?wid= + eligible UX · T3 (AC4–AC5) default all + length caps · T4 (AC6–AC7) honest status + prop cleanup · T5 (AC8) Lint + build

**Out of scope:** API behavior (17.0, 17.1), preview address (17.3), Free upgrade URL (17.4), sanitization UX (17.5 — preview sanitizes in 17.5’s client hook if needed), history.

**Dev Notes:**

- **Primary file:** `src/app/dashboard/broadcast/client.tsx`.
- **Current defects:** destructure only `{ productName, senderName }` L24-26; body L77 no `waitlist_id`; counts fetch L45-54 no `wid`; confirm L66-68 uses `activeCount`.
- **Minimal critical fix:** L24-26 add `waitlistId`, L77 add `waitlist_id: waitlistId`, L47 `fetch(\`...segments?wid=${waitlistId}\`)`.
- Keep pill UI (not native select) — C3 ASCII is older; Story 12.4 AC1 shipped pills.
- `sending` flag remains (L31, L219) — idempotency key on API is the server half of B9.
- Do not invent success copy beyond B7/17.4 gate — if 17.2 ships before COPY GAP approval, keep current strings but stop using them when `ok: false`.

---

### Story 17.3 — Preview From Address + sending_domain

**Status:** ready
**Design Refs:** C3 compose preview / current preview block `client.tsx:227-248`
**Story:** As a founder, I want the preview From line to match what recipients will see — including my verified sending domain — so I trust the compose screen.

**Acceptance Criteria (EARS):**

- AC1: `/dashboard/broadcast/page.tsx` shall select **`sending_domain`** from `waitlists` (add to existing select at L36) and pass it to `BroadcastClient` (new prop `sendingDomain: string | null`).
- AC2: The client preview From line shall be derived from **`resolveFromAddress(senderName, productName, headline, "broadcast", sendingDomain)`** (or equivalent shared helper) — not a hand-built `${senderName}@prewaitlist.com` string. When `sendingDomain` is null, preview domain shall be `prewaitlist.com`; when set, preview shall show `updates@{sendingDomain}` local-part domain (stream prefix rules from `email.ts:59-67`).
- AC3: Display format may remain human-readable (`Name <email>`) but the **email part shall match** `resolveFromAddress` output’s address (not a simplified wrong local-part). Story 12.1.8 AC3 shall be considered fully met after this story.
- AC4: Preview HTML body rendering path shall remain (sanitization applied in 17.5 if this story merges first — coordinate: 17.5 may edit the same `dangerouslySetInnerHTML` site; merge order 17.3 then 17.5 or combined review).
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) page selects sending_domain + prop · T2 (AC2–AC3) resolveFromAddress in preview · T3 (AC4–AC5) preserve preview + lint/build

**Out of scope:** Actual send `from` (already correct in 17.0 route via `resolveFromAddress` L101-107), domain auth UI (Epic 13.5), headline fallback beyond helper.

**Dev Notes:**

- **Files:** `src/app/dashboard/broadcast/page.tsx` (select L36, props L53-61), `src/app/dashboard/broadcast/client.tsx` (L41-43, L234).
- **Reuse:** `resolveFromAddress` already exported from `src/lib/email.ts:46-70` and already used on send path — preview must not diverge.
- Page currently omits `sending_domain` from select — add it; do not fetch again client-side.
- `headline` is already passed as prop (`page.tsx:57`) but unused by client — helper needs it for fallback chain; destructure it in 17.3.

---

### Story 17.4 — Free Direct-URL Upgrade + Honest Success Copy

**Status:** ready
**Design Refs:** Upgrade modal trigger #4 (`sprint-3-design-specs.md` §S9); success card `client.tsx:103-121`
**Story:** As a founder, I want a clear upgrade path if I land on Broadcast while Free, and success copy that doesn’t overclaim delivery — so gating and trust match Story 12.3 AC7/AC8.

**Acceptance Criteria (EARS):**

- AC1: When an unauthenticated user hits `/dashboard/broadcast`, behavior shall remain redirect to `/signin` (existing).
- AC2: When a **Free** authenticated user hits `/dashboard/broadcast` directly, the page shall **not** only `redirect("/dashboard")` with no explanation. It shall present the upgrade path consistent with Story 12.3 AC8 (upgrade modal open with trigger `broadcast`, or an interstitial that triggers the same modal) — Standing Decision B11. Sidebar lock path (`sidebar.tsx:314-325`) shall remain unchanged.
- AC3: Success screen shall not claim inbox **delivery** for Batch API accept/queue. Interim wording shall use honest “sent/queued/accepted” semantics pending founder **COPY GAP** approval of exact strings (Standing Decision B7). Until COPY GAP is approved, ship with a marked string constant and do not treat current “has been delivered” as final.
- AC4: Failure path (from 17.0/17.2 `ok: false` / non-2xx) shall display error text and remain on compose (no false success) — coordinated with 17.2 AC6.
- AC5: Story 12.3 AC7 wording debt (“Email sent to {N} subscribers.”) shall be resolved either by matching approved copy or by amending the AC in 17.7 — this story implements whatever founder-approved string is chosen.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1–AC2) Free direct URL upgrade · T2 (AC3–AC5) success/failure copy · T3 (AC6) Lint + build

**Out of scope:** Modal component build (exists from Epic 13.1), sidebar changes, API status shape (17.0), doc amendments (17.7).

**Dev Notes:**

- **Files:** `src/app/dashboard/broadcast/page.tsx` L28-30 (silent redirect), `client.tsx` success L103-121, possibly client mount effect to open modal if page chooses interstitial vs client-side redirect replacement.
- **Pattern:** page cannot open modal directly (server component). Options: (a) client-side gate — page renders a FreeGate client child that calls `setUpgradeModal` via Dashboard context / `onUpgradeClick`; (b) redirect to `/dashboard?upgrade=broadcast` and let shell open modal (pattern used for cap upgrade `?upgrade=cap`). Prefer **(b)** if context wiring from broadcast page is awkward — check `DashboardContext` / shell upgrade listeners before choosing; document choice in PR.
- COPY GAP strings live in 17.4 until founder signs off.

---

### Story 17.5 — Broadcast HTML Sanitization

**Status:** ready
**Design Refs:** — (security/hygiene; preview + send body)
**Story:** As a platform, I want founder-authored HTML bodies sanitized of scripts and event handlers before preview and send — so HTML remains supported without XSS or broken markup injection.

**Acceptance Criteria (EARS):**

- AC1: Before interpolating `emailBody` into the send HTML template (`route.ts:121-126`), the system shall **sanitize** the body: remove `script`, `iframe`, `object`, `embed`, `link` (non-mailto), and `on*` event handler attributes; do **not** HTML-escape the entire string (Standing Decision B8 — HTML is intentional per textarea placeholder).
- AC2: Sanitization shall be implemented in a shared helper (e.g. `sanitizeEmailHtml` in `src/lib/email.ts` or `src/lib/sanitize.ts`) and unit-tested with: strips `<script>`, strips `onclick=`, preserves `<strong>`, `<a href="https://…">`, `<p>` structure.
- AC3: Preview path (`dangerouslySetInnerHTML` at `client.tsx:240-242`) shall apply the **same** sanitizer (client-safe implementation or pre-sanitize on input blur — choose one approach and use it for both preview and send so preview ≠ send never diverges).
- AC4: Sanitizer choice shall be a maintained library (e.g. `dompurify` current major, server-compatible) **or** a tight allow-list regex/tag filter with tests — no naive `escapeHtml` of the full body (contrast with Epic 16 Updates plain-text escape decision U1 — different content model).
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1–AC2) shared sanitize helper · T2 (AC3) wire preview + send · T3 (AC4–AC5) library choice + tests + lint/build

**Out of scope:** Updates plain-text escape (Epic 16.0), CSP headers, image proxy, rich-text editor.

**Dev Notes:**

- **Files:** `src/app/api/dashboard/broadcast/route.ts` L123; `src/app/dashboard/broadcast/client.tsx` L240-242; new helper under `src/lib/`.
- **Research:** DOMPurify is the standard; ensure server-side import works in Next route (happy-dom for client tests; isomorphic-dompurify if dual env). Prefer **one** helper imported by both if bundler allows; else duplicate thin wrappers around same config.
- Do not forbid all HTML — allow-list approach must keep typical email tags (`p, br, a, strong, em, ul, ol, li, h1-h6, img, table` subset as needed).
- Coordinate merge with 17.3 (same preview region).

---

### Story 17.6 — Broadcast Tests

**Status:** ready
**Design Refs:** — (tests)
**Story:** As a platform, I want automated coverage of the broadcast send path so the `waitlist_id` class of bug cannot ship again.

**Acceptance Criteria (EARS):**

- AC1: API tests for `POST /api/dashboard/broadcast` shall cover: **401** unauthenticated; **403** free tier; **400** missing `waitlist_id`; **400** subject/body empty or over length caps; **404** waitlist not found/not owner; happy path with mocked Resend success asserting **`waitlist_id` accepted**, chunking call count for >100 eligible, idempotency key present on batch calls; **total failure** (all batches error) asserting non-`ok:true` / non-2xx per B4; unsubscribed/bounced excluded from `to` recipients.
- AC2: API tests for `GET .../segments` shall cover: 401; 403 free; `?wid=` scoped success; missing wid + multi-waitlist → 400 (or documented fallback); counts exclude unsubscribed (and bounced if fixture present); response shape `{ all, hot_warm, cold }`.
- AC3: Client tests for `BroadcastClient` shall cover: POST body **includes `waitlist_id`**; segments fetched with `?wid=`; confirm/send labels use eligible count; success vs failure rendering (ok true vs false/non-2xx); default segment `"all"`; subject/body length disable.
- AC4: Unit tests for `sanitizeEmailHtml` (AC set in 17.5) and, if extracted, eligibility/count helpers.
- AC5: Fake `unsubscribe-page.test.tsx` (literal markup, no component import) shall be **replaced or deleted** in favor of a test that imports the real page/component behavior — or explicitly skipped with a comment linking to a follow-up; no false-confidence suite remains attributed to broadcast compliance.
- AC6: `pnpm test` shall pass with **no new failures** beyond baseline (`dashboard-archive` 4 + `dashboard-subscriber-table` 3; flaky `billing.test.ts` ignored in full-suite noise). Lint and build zero errors.

**Tasks:** T1 (AC1) POST route tests · T2 (AC2) segments tests · T3 (AC3) client tests · T4 (AC4–AC5) sanitize + unsubscribe page test hygiene · T5 (AC6) full test/lint/build gate

**Out of scope:** E2E Playwright (optional later), Resend real API, Epic 15 warmth math tests.

**Dev Notes:**

- **Follow existing patterns:** `src/__tests__/api/*`, `src/__tests__/components/*`; mock `next/server` `NextRequest`; mock `@/lib/resend` `batch.send`; mock supabase like other API tests; `after: vi.fn((fn) => fn())` if needed (Epic 13 gotcha).
- **Critical assertion:** client test must fail if `waitlist_id` is removed from body — that is the regression lock for audit §5 claim 1.
- Glob target: `src/__tests__/api/broadcast*.test.ts`, `src/__tests__/api/broadcast-segments.test.ts`, `src/__tests__/components/broadcast-client.test.tsx`, `src/__tests__/lib/sanitize-email.test.ts`.

---

### Story 17.7 — Doc Amendments & Status Sync

**Status:** ready
**Design Refs:** — (documentation only)
**Story:** As a founder/maintainer, I want story docs and MEMORY to match the broadcast architecture we actually ship — so future agents don’t “fix” code back onto Resend Audiences merge tags.

**Acceptance Criteria (EARS):**

- AC1: Story 12.3 **AC5** shall be amended: unsubscribe mechanism is **custom HMAC URL + `List-Unsubscribe` / `List-Unsubscribe-Post` headers**, not `{{{RESEND_UNSUBSCRIBE_URL}}}` (Standing Decision B5). AC7 and AC8 shall be annotated or amended to match 17.4 approved behavior.
- AC2: Story 12.4 **AC6** (default cold) shall be **deleted or rewritten** to default `"all"` per Standing Decision B17 / PRD L123 / 12.1.8 AC1.
- AC3: MEMORY.md broadcast-related claims (`{{{RESEND_UNSUBSCRIBE_URL}}}` merge tag lines ~780/865 and any “Broadcast works” implications) shall be corrected to custom HMAC + never Audiences; note Epic 17 fix of `waitlist_id`.
- AC4: Story frontmatter `status: done` for completed 12.3, 12.4, 12.5, 12.6 files in `completed/` (Standing Decision B16); confirm sprint-3-plan table already ✅.
- AC5: Story 12.1.8 AC3 shall be marked complete in 17.3 notes or the story text annotated (preview now uses `resolveFromAddress`).
- AC6: Story 12.6 AC4 local-part wording shall be reconciled with stream-prefix reality (`notifications@` / `updates@`) — amend AC to describe display-name + stream local-part, not `{sender_name}@{domain}` as local-part (Standing Decision: stream separation remains).
- AC7: Audit `engine-audit-5-engines.md` §5 Executive Summary row and “Minimum to green” may be annotated “addressed by Epic 17” (optional, non-blocking).
- AC8: Lint (markdown not linted) — **no code**; verification is human/agent read-through checklist.

**Tasks:** T1 (AC1–AC2) story 12.3/12.4 AC amendments · T2 (AC3) MEMORY fix · T3 (AC4–AC6) statuses + 12.1.8/12.6 notes · T4 (AC7–AC8) optional audit annotate + checklist

**Out of scope:** PRD REQ-7.1a (already correct), design C3 optional history (deferred B10), new product copy.

**Dev Notes:**

- **Files:** `docs/stories/completed/story-12.3-broadcast-email.md`, `story-12.4-...`, `story-12.5-...`, `story-12.6-...`, `story-12.1.8-...`, `.memory/MEMORY.md`, optionally `docs/scans/engine-audit-5-engines.md`.
- Edit **forward** only: do not rewrite history sections of audit; add “Fixed by Epic 17” notes if touching audit.
- MEMORY: correct the two merge-tag bullets; add a short Epic 17 gotcha: “Client must send `waitlist_id`; segments need `?wid=` + eligible counts.”

---

## Cross-story integration notes

- **17.1 eligibility ↔ 17.0 send eligibility:** identical rules (unsub + bounce) — tests in 17.6 should use the same fixtures where practical.
- **17.2 depends on 17.1 contract** (`?wid=` + eligible counts) but the **B1 waitlist_id one-liner can ship immediately** even before 17.1 if split across PRs.
- **17.3 and 17.5** touch the same preview block — sequence or stack PRs.
- **17.4** needs 17.0 response shape for honest failure and 17.2 success path.
- **No SQL migrations** in this epic.
- **Do not** regress Epic 15 segment/count work if 15.3 overlaps segments — coordinate if both epics touch `segments/route.ts` (Epic 15.3 may already add wid/requirePro — **check before implementing 17.1**; if 15.3 lands first, 17.1 focuses on eligible-count math only).
