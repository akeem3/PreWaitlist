# Story 17.5 — Broadcast HTML Sanitization

**Status:** ready
**Epic:** 17 — Broadcasting Engine Fix
**Depends on:** —
**Design Refs:** — (security/hygiene; preview + send body)
**Source:** [Audit §5 broadcasting findings](../scans/engine-audit-5-engines.md#5-broadcasting--%EF%B8%8F-not-functional-verified-rescan-confidence-98), [Epic 17 Standing Decision B8](../epics/epic-17-broadcast-engine-fix.md), DOMPurify / HTML email sanitization research, Story 12.3 HTML placeholder

## Story

As a platform, I want founder-authored HTML bodies sanitized of scripts and event handlers before preview and send — so HTML remains supported without XSS or broken markup injection.

## Acceptance Criteria (EARS)

- AC1: Before interpolating `emailBody` into the send HTML template (`route.ts:121-126`), the system shall **sanitize** the body: remove `script`, `iframe`, `object`, `embed`, `link` (non-mailto), and `on*` event handler attributes; do **not** HTML-escape the entire string (Standing Decision B8 — HTML is intentional per textarea placeholder).
- AC2: Sanitization shall be implemented in a shared helper (e.g. `sanitizeEmailHtml` in `src/lib/email.ts` or `src/lib/sanitize.ts`) and unit-tested with: strips `<script>`, strips `onclick=`, preserves `<strong>`, `<a href="https://…">`, `<p>` structure.
- AC3: Preview path (`dangerouslySetInnerHTML` at `client.tsx:240-242`) shall apply the **same** sanitizer (client-safe implementation or pre-sanitize on input blur — choose one approach and use it for both preview and send so preview ≠ send never diverges).
- AC4: Sanitizer choice shall be a maintained library (e.g. `dompurify` current major, server-compatible) **or** a tight allow-list regex/tag filter with tests — no naive `escapeHtml` of the full body (contrast with Epic 16 Updates plain-text escape decision U1 — different content model).
- AC5: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1–AC2) shared `sanitizeEmailHtml` helper
- T2 (AC3) wire preview + send through same helper
- T3 (AC4–AC5) library/allow-list choice + tests + lint/build

## Out of Scope

- Updates plain-text `escapeHtml` (Epic 16.0 / Standing Decision U1 — different content model)
- CSP headers
- Image proxy / link rewriting
- Rich-text editor
- Story 17.3 preview From line (same file, different concern — coordinate merge)

## Dev Notes

### Files

| File                                       | Line(s)  | Issue                                 |
| ------------------------------------------ | -------- | ------------------------------------- |
| `src/app/api/dashboard/broadcast/route.ts` | L121-126 | raw `${emailBody}` into HTML template |
| `src/app/dashboard/broadcast/client.tsx`   | L240-242 | `dangerouslySetInnerHTML` preview     |
| New `src/lib/sanitize.ts` (or email.ts)    | —        | shared helper                         |

### T1 — shared helper (AC1–AC2)

Placeholder textarea says HTML is supported — **sanitize, don’t wholesale escape** (B8). Research: DOMPurify standard for HTML email.

```ts
// src/lib/sanitize.ts (preferred name if also used client-side)
export function sanitizeEmailHtml(html: string): string {
  // dompurify or allow-list implementation
}
```

Unit tests (17.6 AC4): strip `<script>alert(1)</script>`, strip `<p onclick="x">`, keep `<strong>`, `<a href="https://example.com">`, `<p>` / `<br>` structure.

**Library choice (AC4):**

| Option                 | Pros/cons                                              |
| ---------------------- | ------------------------------------------------------ |
| `dompurify`            | Standard; needs DOM (happy-dom in tests; server check) |
| `isomorphic-dompurify` | Server + client safe dual env                          |
| Allow-list regex       | Zero deps; risk of bypass — only with solid tests      |

Prefer **one** helper imported by both route and client if bundler allows; else thin wrappers around same config. Allow-list must keep typical email tags: `p, br, a, strong, em, ul, ol, li, h1-h6, img, table` subset as needed.

### T2 — wire both paths (AC3)

```ts
// route send
const safeBody = sanitizeEmailHtml(body);
// interpolate ${safeBody} not ${body}

// client preview — same helper
<div dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(body) }} />
```

Same function for preview and send — preview ≠ send never diverges. Alternative: sanitize on blur once and store sanitized value — only if both sinks still guaranteed sanitized.

### T3 — tests + lint (AC4–AC5)

Unit tests in 17.6 (`src/__tests__/lib/sanitize-email.test.ts`); if helper tests written here, still satisfy 17.6 AC4. `pnpm lint && pnpm build`.

### Implementation order inside story

1. T1 helper + choice (DOMPurify vs allow-list)
2. T2 wire route + preview
3. Confirm not wholesale-escaping (B8)
4. `pnpm lint && pnpm build`
5. Full tests in 17.6

## Files to Create/Modify

| File                                              | Change                              |
| ------------------------------------------------- | ----------------------------------- |
| `src/lib/sanitize.ts` (new) or `src/lib/email.ts` | Add `sanitizeEmailHtml`             |
| `src/app/api/dashboard/broadcast/route.ts`        | Sanitize before HTML interpolate    |
| `src/app/dashboard/broadcast/client.tsx`          | Sanitize preview sink               |
| `package.json`                                    | Add sanitizer dep if library chosen |

## Risk

- **Do not** reuse Updates `escapeHtml` wholesale — that destroys intentional HTML (B8 vs U1).
- DOMPurify server import in Next route — verify SSR-safe package.
- Merge conflict with 17.3 on `client.tsx` preview region — sequence or stack.
- New dependency (`dompurify`) — confirm with founder if “new dependencies” rule requires ask-first (AGENTS.md boundaries: new dependencies = ask first — flag if not already approved in epic research).
