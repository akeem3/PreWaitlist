# Story 16.0 — Updates API Send Path Hardening

**Status:** ready
**Epic:** 16 — Leaderboard & Founder Updates Engine Fix
**Depends on:** —
**Design Refs:** — (API only; no SVG)
**Source:** [Audit §4](../scans/engine-audit-5-engines.md#4-founder-updates--%EF%B8%8F-partial-verified-rescan-confidence-97), [Epic 16 Standing Decisions](../epics/epic-16-leaderboard-updates-engine-fix.md), [PRD REQ-6.15.1–2](../PRD.md#615-founder-updates--email-first-delivery), Resend Batch API docs, CAN-SPAM FTC guide

## Story

As a platform, I want founder update emails to send safely at any list size, only to eligible recipients, with escaped HTML and a visible unsubscribe mechanism, and to report send outcome truthfully — so multi-waitlist founders can publish and lists >100 no longer fail silently.

## Acceptance Criteria (EARS)

- AC1: `POST /api/updates` shall accept optional `waitlist_id` in the JSON body; when present, the waitlist shall be resolved with `.eq("founder_id", user.id).eq("id", waitlistId)` (ownership enforced); when absent and the founder has exactly one waitlist, that waitlist shall be used; when absent and the founder has 2+ waitlists, the API shall return **400** with a JSON error (Standing Decision U4).
- AC2: Body validation shall reject `text.length < 10` with **400** (min length currently client-only — Story 12.1.4 AC2); empty-after-trim and `> 2000` chars shall remain **400**.
- AC3: Subscriber selection for email dispatch shall exclude rows where `unsubscribed_at` is non-null and shall exclude emails present in `bounced_emails` for the waitlist (mirror `broadcast/route.ts:84-92` — Standing Decision U2). The update **row** shall still insert even when zero eligible recipients remain (so history is not lost); only the email phase is skipped/special-cased as specified in AC7.
- AC4: Founder-authored `text` shall be HTML-escaped before interpolation into the email HTML body (no raw `${text}` — Standing Decision U1/U2 hygiene; add shared `escapeHtml` helper if none exists under `src/lib/`).
- AC5: The email footer shall include a **visible** unsubscribe link per recipient (reuse `buildBroadcastEmailFooter(subscriberId, businessAddress)` from `src/lib/email.ts` or equivalent that embeds `generateUnsubscribeUrl`), in addition to existing `List-Unsubscribe` headers — Standing Decision U1.
- AC6: Email dispatch shall call `resend.batch.send(...)` **once per chunk of ≤100** inside the loop (copy `broadcast/route.ts:111-147`); it shall **not** flatten all chunks into a single array before one send — Standing Decision U3.
- AC7: On full or partial send success, `sent_at` shall be set (existing behavior); on total failure, `sent_at` shall remain null (REQ-6.15.2). The API response on 201 shall include `{ id, emailSent: boolean, emailError?: string | null }` where `emailSent` is true only if ≥1 chunk succeeded — Standing Decision U6. `generateUnsubscribeUrl` failures (missing `UNSUBSCRIBE_SECRET`) shall not throw unhandled after insert — wrap send-phase errors so the insert is never orphaned by a footer/header generation throw (audit §4.4 issue 11).
- AC8: Subject shall remain `Update from {productName}` (Standing Decision U7). Pro gating (`requirePro` → 403) and auth (401) shall be preserved.
- AC9: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) waitlist_id resolution
- T2 (AC2) server min-10
- T3 (AC3–AC5) suppression + escapeHtml + visible unsubscribe footer
- T4 (AC6–AC7) chunked send + emailSent response
- T5 (AC8–AC9) preserve gates + lint/build

## Out of Scope

- Client UX changes (Story 16.1)
- Brand color / headline injection (Standing Decision U5 — amend Story 7.6 AC2 instead)
- Subject-line control (U7)
- Rich text, scheduling, edit/delete
- RLS changes (Epic 14.0 owns full subscribers RLS close)

## Dev Notes

### Primary file — `src/app/api/updates/route.ts`

Current defects (audit §4):

| Line(s) | Defect                                                               |
| ------- | -------------------------------------------------------------------- |
| 47–53   | `.single()` on waitlists by `founder_id` → 400 when 2+ rows          |
| 36–38   | empty-only validation (min 1); client enforces min 10                |
| 79–82   | select `id, email` only — no `unsubscribed_at` / bounce filter       |
| 112     | unescaped `${text}` into HTML                                        |
| 131–151 | chunks sliced then **flattened** into one array; single `batch.send` |
| 143–144 | `List-Unsubscribe` header only; footer = address only                |
| 157–159 | `catch { console.error }` only; still 201 `{ id }`                   |
| —       | client never sends `waitlist_id` (fixed in 16.1)                     |

### T1 — waitlist_id resolution (AC1)

Replace `.single()` with array fetch:

```ts
let wlQuery = supabase
  .from("waitlists")
  .select(
    "id, subdomain, name, product_name, headline, sender_name, sending_domain, business_address"
  )
  .eq("founder_id", user.id);

if (typeof body?.waitlist_id === "string" && body.waitlist_id) {
  wlQuery = wlQuery.eq("id", body.waitlist_id);
}

const { data: waitlists, error: waitlistError } = await wlQuery;

if (waitlistError || !waitlists || waitlists.length === 0) {
  return NextResponse.json({ error: "No waitlist found" }, { status: 400 });
}

if (waitlists.length > 1 && !body?.waitlist_id) {
  return NextResponse.json(
    { error: "waitlist_id is required when multiple waitlists exist" },
    { status: 400 }
  );
}

const waitlist = waitlists[0];
```

Ownership: `.eq("founder_id", user.id)` always applied — cannot fetch another founder's waitlist by id.

### T2 — server min-10 (AC2)

```ts
const text = (body?.body ?? "").trim();

if (text.length < 10) {
  return NextResponse.json(
    { error: "Body must be at least 10 characters" },
    { status: 400 }
  );
}

if (text.length > MAX_BODY_LENGTH) {
  return NextResponse.json(
    { error: `Body must be under ${MAX_BODY_LENGTH} characters` },
    { status: 400 }
  );
}
```

Empty-after-trim is subsumed by `< 10`. Keep explicit empty check only if preferred for message clarity — both return 400.

### T3 — suppression + escapeHtml + footer (AC3–AC5)

**Suppression** (copy broadcast):

```ts
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailBounced } from "@/lib/bounces";

const { data: subscribers } = await supabase
  .from("subscribers")
  .select("id, email, unsubscribed_at")
  .eq("waitlist_id", waitlist.id);

const adminSupabase = createAdminClient();
const eligible: { id: string; email: string }[] = [];

for (const sub of subscribers ?? []) {
  if (sub.unsubscribed_at) continue;
  if (await isEmailBounced(adminSupabase, waitlist.id, sub.email)) continue;
  eligible.push({ id: sub.id, email: sub.email });
}
```

Insert happens **before** eligibility fetch (already ordered that way) so zero-eligible still stores the update.

**escapeHtml** — no helper exists under `src/` (grep clean). Add to `src/lib/email.ts`:

```ts
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

Use `escapeHtml(text)` in the HTML template; keep raw `text` as the plain-text `text` field of the Resend payload.

**Visible unsubscribe footer (AC5):** reuse `buildBroadcastEmailFooter(sub.id, waitlist.business_address)` from `email.ts:130+` (embeds `generateUnsubscribeUrl`). Replace the address-only `buildEmailFooter` call in this route's HTML footer cell. Keep `List-Unsubscribe` headers as-is.

### T4 — chunked send + emailSent (AC6–AC7)

**Wrong (current):**

```ts
for (...) { batchEmails.push(...emails); }
await resend.batch.send(batchEmails); // one call, can exceed 100
```

**Right (copy broadcast L111-147):**

```ts
const BATCH_SIZE = 100;
let totalSent = 0;
let sendError: string | null = null;

try {
  for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
    const batch = eligible.slice(i, i + BATCH_SIZE);
    const emails = batch.map((sub) => ({
      from,
      to: sub.email,
      subject: `Update from ${productName}`,
      html, // shared HTML is fine if footer is address-only in body of table;
      // if footer is per-subscriber, build html per sub inside map (broadcast does this)
      text,
      headers: {
        "List-Unsubscribe": `<${generateUnsubscribeUrl(sub.id)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }));

    try {
      const result = await resend.batch.send(emails);
      if (result.error) {
        sendError = result.error.message ?? "Batch send failed";
        console.error("Batch send error:", result.error);
      } else {
        totalSent += batch.length;
      }
    } catch (err) {
      sendError = err instanceof Error ? err.message : "Batch send failed";
      console.error("Batch send threw:", err);
    }
  }

  if (totalSent > 0) {
    await supabase
      .from("founder_updates")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", update.id);
  }
} catch (err) {
  // footer/header generation or unexpected — never unhandled after insert
  sendError = err instanceof Error ? err.message : "Email dispatch failed";
  console.error("Update email phase failed:", err);
}

return NextResponse.json(
  {
    id: update.id,
    emailSent: totalSent > 0,
    emailError: totalSent > 0 ? null : (sendError ?? "Email dispatch failed"),
  },
  { status: 201 }
);
```

**Per-subscriber footer:** because `buildBroadcastEmailFooter(sub.id, ...)` varies by subscriber, build HTML inside the map (broadcast pattern) rather than one shared `html` const — or keep shared body HTML and only vary footer. Match broadcast: build per batch item.

Wrap `generateUnsubscribeUrl` / footer build inside the same try/catch as send (AC7).

Zero eligible: skip loop; `emailSent: false`, `emailError` non-null (optional COPY GAP if surfaced — 16.1 owns UX); still 201 `{ id }` so insert success is not reported as publish failure.

### T5 — preserve gates (AC8)

Keep auth 401, `requirePro` 403, subject `` `Update from ${productName}` ``, `resolveFromAddress(..., "broadcast", ...)` stream choice unchanged.

### Implementation order inside story

1. T1 waitlist resolution
2. T2 validation
3. T3 suppression + escape + footer
4. T4 chunked send + response shape
5. Smoke test optional; full tests in 16.3
6. `pnpm lint && pnpm build`

## Files to Create/Modify

| File                           | Change                      |
| ------------------------------ | --------------------------- |
| `src/lib/email.ts`             | Add `escapeHtml` (+ export) |
| `src/app/api/updates/route.ts` | Primary hardening (all ACs) |

## Risk

- Response shape gains `emailSent`/`emailError` — 16.1 must land soon after or treat missing field as `emailSent: true` when `res.ok` (preferred: same release train, 16.0 → 16.1).
- Per-subscriber HTML rebuild increases CPU slightly — negligible at ≤500 subs (product cap).
- Do not touch `subscribers` RLS (Epic 14 owns) — suppression here is application-level select filters only.
