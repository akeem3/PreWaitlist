# Story 12.4.0 — Fix Qualification Page Waitlist Scoping

**Status:** ready
**Epic:** 12.4 — Pre-Epic 13 Gaps

## Story

As a founder with multiple waitlists, I want the qualification dashboard page to show data for the active waitlist so that I don't see stale or empty data.

## Acceptance Criteria (EARS)

- AC1: The qualification page (`src/app/dashboard/qualification/page.tsx`) shall pass `waitlistId` to `QualificationClient` as a prop.
- AC2: The `QualificationPanel` component shall use the `waitlistId` prop to scope its API call to `GET /api/dashboard/qualification?waitlist_id={id}`.
- AC3: When no `wid` URL param is present, the qualification page shall default to the founder's most recently created waitlist.
- AC4: Lint and build shall pass with zero errors.
- AC5: Clicking "Archive Waitlist" in settings shall show a confirmation dialog before executing.
- AC6: When `is_archived === true`, the public waitlist page (`/:subdomain`) shall return a 410 Gone status with a message: "This waitlist is no longer active."

## Tasks

T1 (AC1-AC2) Pass waitlistId to client + verify API call scopes correctly
T2 (AC3) Default waitlist selection
T3 (AC5) Add confirmation dialog to archive button
T4 (AC6) Fix public page to return 410 instead of 404 for archived waitlists
T5 (AC4) Lint + build

## Dev Notes

- **Qualification scoping root cause:** `src/app/dashboard/qualification/page.tsx` line 27 renders `<QualificationClient subdomain={waitlist.subdomain} />` without passing `waitlistId`. The `QualificationPanel` component accepts `waitlistId` as optional and uses it in its API call. Without it, the API returns 400 "waitlist_id is required".
- Fix: Add `waitlistId={waitlist.id}` to the `<QualificationClient>` render.
- The page already resolves the correct waitlist via `wid` search param (lines 16-24).
- File: `src/app/dashboard/qualification/page.tsx` (28 lines — single-line fix)

- **Archive confirmation gap:** `src/app/dashboard/[waitlistId]/settings/client.tsx` line 348 calls `handleArchive()` directly on click with no `window.confirm()`. Add a confirmation dialog: "Archiving your waitlist will stop new signups and hide your public page. This can be undone. Continue?"
- File: `src/app/dashboard/[waitlistId]/settings/client.tsx`

- **Archive 410 gap:** `src/app/(public)/[subdomain]/page.tsx` line 25 uses `.eq("is_archived", false)` which returns no rows → triggers `notFound()` (404). Need to: (1) query without the archive filter, (2) check `is_archived` after fetch, (3) return 410 with custom message if archived.
- File: `src/app/(public)/[subdomain]/page.tsx`

## Implementation Status

**Status: NOT IMPLEMENTED**

| AC                                          | Status             | Evidence                                                                    |
| ------------------------------------------- | ------------------ | --------------------------------------------------------------------------- |
| AC1: Pass waitlistId to QualificationClient | ❌ Not done        | `page.tsx` line 27 only passes `subdomain`                                  |
| AC2: QualificationPanel uses waitlistId     | ✅ Component ready | `qualification-panel.tsx` accepts and uses `waitlistId` in fetch (line 31)  |
| AC3: Default to most recent waitlist        | ✅ Done            | `page.tsx` uses `wid` search param, defaults to first                       |
| AC4: Lint + build                           | ⏳ Pending         | —                                                                           |
| AC5: Archive confirmation dialog            | ❌ Not done        | `settings/client.tsx` line 348 calls `handleArchive()` directly, no confirm |
| AC6: 410 for archived waitlists             | ❌ Not done        | `[subdomain]/page.tsx` returns 404 via `notFound()`, not 410                |

**Gaps:** Two files need change for qualification (page.tsx + client.tsx). Two files need change for archive fixes (settings/client.tsx + subdomain/page.tsx).
