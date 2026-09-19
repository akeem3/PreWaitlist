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

## Tasks

T1 (AC1-AC2) Pass waitlistId to client + verify API call scopes correctly
T2 (AC3) Default waitlist selection
T3 (AC4) Lint + build

## Dev Notes

- **Root cause:** `src/app/dashboard/qualification/page.tsx` line 27 renders `<QualificationClient subdomain={waitlist.subdomain} />` without passing `waitlistId`. The `QualificationPanel` component accepts `waitlistId` as optional and uses it in its API call. Without it, the API returns 400 "waitlist_id is required".
- Fix: Add `waitlistId={waitlist.id}` to the `<QualificationClient>` render.
- The page already resolves the correct waitlist via `wid` search param (lines 16-24).
- File: `src/app/dashboard/qualification/page.tsx` (28 lines — single-line fix)

## Implementation Status

**Status: NOT IMPLEMENTED**

| AC                                          | Status             | Evidence                                                                   |
| ------------------------------------------- | ------------------ | -------------------------------------------------------------------------- |
| AC1: Pass waitlistId to QualificationClient | ❌ Not done        | `page.tsx` line 27 only passes `subdomain`                                 |
| AC2: QualificationPanel uses waitlistId     | ✅ Component ready | `qualification-panel.tsx` accepts and uses `waitlistId` in fetch (line 31) |
| AC3: Default to most recent waitlist        | ✅ Done            | `page.tsx` uses `wid` search param, defaults to first                      |
| AC4: Lint + build                           | ⏳ Pending         | —                                                                          |

**Gap:** `QualificationClient` at `client.tsx` does not accept or forward `waitlistId` — two files need change: `page.tsx` (pass prop) and `client.tsx` (accept + forward prop).
