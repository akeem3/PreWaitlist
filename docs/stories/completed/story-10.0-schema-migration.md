# Story 10.0 — Schema Migration

**Epic:** 10 — Public Waitlist Page & Onboarding Redesign
**Status:** ready
**Depends on:** —
**Design Refs:** None (database-only change)

## Story

As a developer, I want a `product_name` column on the `waitlists` table so that the product's internal display name is separate from the public page headline.

## Acceptance Criteria (EARS)

- AC1: The system shall apply a SQL migration that adds a `product_name` column (text, nullable) to the `waitlists` table.
- AC2: The `POST /api/waitlist` endpoint shall accept an optional `product_name` field and persist it to the `product_name` column.
- AC3: The `PATCH /api/waitlist` endpoint shall accept an optional `product_name` field and update the `product_name` column.
- AC4: The `GET /api/waitlist` endpoint shall return `productName` in the response body. When `product_name` is NULL, the system shall fall back to the `headline` value.
- AC5: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1) Add `product_name` column via migration SQL · T2 (AC2) Update POST endpoint to accept `product_name` · T3 (AC3) Update PATCH endpoint to accept `product_name` · T4 (AC4) Update GET endpoint to return `productName` with fallback · T5 (AC5) Lint + build

## Out of Scope

Changing the `headline` column behavior, renaming existing columns, modifying the `founder_profiles` table.

## Implementation Details

### T1: Add `product_name` column

- File: `docs/stories/epic0.story03-supabase-schema.sql`
- Add migration: `ALTER TABLE waitlists ADD COLUMN product_name text;`
- Column type: `text nullable`
- No default value — NULL means "not yet set, fall back to headline"
- RLS: same policies as other waitlist columns (founder manages own)

### T2: Update POST endpoint

- File: `src/app/api/waitlist/route.ts` POST handler (line 120–137)
- Add `product_name: body.product_name ?? null` to `insertPayload`

### T3: Update PATCH endpoint

- File: `src/app/api/waitlist/route.ts` PATCH handler (line 199–219)
- The `updates` object already spreads unknown keys
- Add explicit handling: `if (body.product_name !== undefined) updates.product_name = body.product_name;`

### T4: Update GET endpoint

- File: `src/app/api/waitlist/route.ts` GET handler (line 324–351)
- Add `productName: waitlist.product_name || waitlist.headline || ""` to the response

### T5: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any errors

## Verification

1. Apply migration to database
2. Test POST /api/waitlist with `product_name` field — verify it persists
3. Test PATCH /api/waitlist with `product_name` field — verify it updates
4. Test GET /api/waitlist — verify `productName` is returned
5. Test GET /api/waitlist when `product_name` is NULL — verify fallback to `headline`
6. Run `pnpm lint` and `pnpm build` — verify zero errors
