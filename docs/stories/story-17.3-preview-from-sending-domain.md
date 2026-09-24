# Story 17.3 — Preview From Address + sending_domain

**Status:** ready
**Epic:** 17 — Broadcasting Engine Fix
**Depends on:** —
**Design Refs:** C3 compose preview / current preview block `client.tsx:227-248`; `docs/design/sprint-3-design-specs.md` §C3
**Source:** [Audit §5 claim 9](../scans/engine-audit-5-engines.md#5-broadcasting--%EF%B8%8F-not-functional-verified-rescan-confidence-98), [Epic 17 Standing Decisions B6](../epics/epic-17-broadcast-engine-fix.md), [Story 12.1.8 AC3](../stories/completed/story-12.1.8-broadcast-duplicate-fixes.md), [Story 12.6 sending domain](../stories/completed/story-12.6-email-infrastructure-separation.md)

## Story

As a founder, I want the preview From line to match what recipients will see — including my verified sending domain — so I trust the compose screen.

## Acceptance Criteria (EARS)

- AC1: `/dashboard/broadcast/page.tsx` shall select **`sending_domain`** from `waitlists` (add to existing select at L36) and pass it to `BroadcastClient` (new prop `sendingDomain: string | null`).
- AC2: The client preview From line shall be derived from **`resolveFromAddress(senderName, productName, headline, "broadcast", sendingDomain)`** (or equivalent shared helper) — not a hand-built `${senderName}@prewaitlist.com` string. When `sendingDomain` is null, preview domain shall be `prewaitlist.com`; when set, preview shall show `updates@{sendingDomain}` local-part domain (stream prefix rules from `email.ts:59-67`).
- AC3: Display format may remain human-readable (`Name <email>`) but the **email part shall match** `resolveFromAddress` output’s address (not a simplified wrong local-part). Story 12.1.8 AC3 shall be considered fully met after this story.
- AC4: Preview HTML body rendering path shall remain (sanitization applied in Story 17.5 if this story merges first — coordinate: 17.5 may edit the same `dangerouslySetInnerHTML` site; merge order 17.3 then 17.5 or combined review).
- AC5: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) page selects sending_domain + prop
- T2 (AC2–AC3) resolveFromAddress in preview
- T3 (AC4–AC5) preserve preview + lint/build

## Out of Scope

- Actual send `from` (already correct in Story 17.0 route via `resolveFromAddress` L101-107)
- Domain auth UI (Epic 13.5)
- Headline fallback beyond helper
- HTML sanitization (Story 17.5)

## Dev Notes

### Files

| File                                     | Line(s) | Issue                                             |
| ---------------------------------------- | ------- | ------------------------------------------------- |
| `src/app/dashboard/broadcast/page.tsx`   | L36     | select omits `sending_domain`                     |
| `src/app/dashboard/broadcast/page.tsx`   | L53-61  | props — add `sendingDomain`                       |
| `src/app/dashboard/broadcast/client.tsx` | L41-43  | hand-built `${senderName}@prewaitlist.com`        |
| `src/app/dashboard/broadcast/client.tsx` | L234    | preview From display                              |
| `src/lib/email.ts`                       | L46-70  | `resolveFromAddress` already exported (send uses) |

### T1 — page select + prop (AC1)

```ts
// page.tsx select
.select("id, …, sending_domain, …")

// pass through
<BroadcastClient
  …
  sendingDomain={waitlist.sending_domain ?? null}
/>
```

Do not fetch `sending_domain` client-side again.

### T2 — resolveFromAddress in preview (AC2–AC3)

Current (wrong):

```ts
const previewFrom = `${senderName || productName}@prewaitlist.com`;
```

Required:

```ts
import { resolveFromAddress } from "@/lib/email";

const previewFrom = resolveFromAddress(
  senderName,
  productName,
  headline, // already a prop — destructure it (unused today)
  "broadcast",
  sendingDomain
);
```

Send path already calls `resolveFromAddress(..., "broadcast", sending_domain)` at `route.ts:101-107` — preview must not diverge (audit §5 claim 9). Display may remain `Name <email>` for readability; email part must match helper output (stream local-part `updates@` vs display name rules in `email.ts:59-67`).

Story 12.1.8 AC3 is only half-met today (dynamic local-part but hardcodes `@prewaitlist.com`, ignores `sending_domain`). This story completes it.

### T3 — preserve preview + lint (AC4–AC5)

Leave `dangerouslySetInnerHTML` as-is for 17.3; 17.5 sanitizes same sink — sequence merges (17.3 then 17.5 or combined review). `pnpm lint && pnpm build`.

### Implementation order inside story

1. T1 page select + prop
2. T2 helper in preview + destructure headline
3. Confirm no second fetch of sending_domain
4. `pnpm lint && pnpm build`

## Files to Create/Modify

| File                                     | Change                                                             |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `src/app/dashboard/broadcast/page.tsx`   | select `sending_domain`, pass `sendingDomain`                      |
| `src/app/dashboard/broadcast/client.tsx` | destructure `sendingDomain` + `headline`; use `resolveFromAddress` |

## Risk

- `resolveFromAddress` signature must match 5-arg call with stream `"broadcast"` — verify `email.ts` types.
- Merge conflict with 17.5 on preview block — coordinate.
- No HF SVG for this screen — match C3 text layout only; colors via design tokens if any From row styling changes.
