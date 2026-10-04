# Phone Number Collection — Implementation Plan

**Status:** approved → executing
**Approved:** 2026-10-03 (founder)
**Scope:** founder-configurable phone field (Off / Optional / Required, default Off) on the public signup form → stored on `subscribers` → shown in the dashboard leaderboard table + subscriber detail page → included in CSV export.

**Out of scope:** WhatsApp/SMS/OTP/verification/messaging, public leaderboard changes, `/dashboard/warmth` table, referred-subscribers mini-list, tier gating, new dependencies, Subscribers redesign.

## Locked Decisions

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Conditional Phone column in `/dashboard/leaderboard` table, after Email. Public leaderboard untouched.                                                                                                                                                                                                                                                                                                                                                                            |
| 2   | Subscriber detail `/dashboard/subscribers/[id]` shows a Phone card when mode ≠ off.                                                                                                                                                                                                                                                                                                                                                                                               |
| 3   | Country selector = **native `<datalist>` input** — short `+1` closed state, dropdown searchable by country name and dial code, free-typed code allowed. Default `+1`.                                                                                                                                                                                                                                                                                                             |
| 4   | Config UI: onboarding Step 4a "Signup fields" section + settings Qualification tab. **[AMENDED 2026-10-03 — founder directive after execution: onboarding section moved to Step 3 "Make it yours"; settings Qualification tab unchanged. Persistence extended: `phone_mode` added to both client POST-create bodies (local `flushToAPI` + `FlushGate`) and the POST `/api/waitlist` insert path (validated, same copy) so the Step 3 choice survives the Phase A → B boundary.]** |
| 5   | Copy approved verbatim (see below).                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 6   | `/dashboard/warmth` table excluded (leaderboard + detail only).                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Copy (approved verbatim)

| Surface                                 | String                                                  |
| --------------------------------------- | ------------------------------------------------------- |
| Form error (required)                   | `Phone number is required`                              |
| Form error (invalid)                    | `Please enter a valid phone number`                     |
| Input placeholder + aria-label          | `Phone number`                                          |
| Country input aria-label                | `Country code`                                          |
| Config section heading (4a + settings)  | `Signup fields`                                         |
| Config helper text                      | `Show a phone number field on your public signup form.` |
| Config select label                     | `Phone number`                                          |
| Config options                          | `Off` / `Optional` / `Required`                         |
| Table header · detail card · CSV header | `Phone`                                                 |

## Data Model

- `waitlists.phone_mode text not null default 'off' check (phone_mode in ('off','optional','required'))`
- `subscribers.phone text null` — E.164 (`+15551234567`), no DB check (display_name precedent)
- Migration: `docs/stories/sql-writeups/phone-collection-schema.sql` — additive, founder-run in Supabase SQL Editor.
- **⚠ SQL MUST run before code deploy/manual test** (public `WAITLIST_SELECT` with missing column → PostgREST 400 → notFound). Defensive fallbacks soften order slips but SQL-first is the contract.

## Shared Validation (`src/lib/phone.ts`)

- `PHONE_MODES`, `PhoneMode`, `isPhoneMode()`
- `normalizePhoneInput(raw)` — strip spaces/dashes/parens → must match `^\+[1-9]\d{6,14}$` (E.164, 7–15 digits, no leading 0), else null
- `buildPhone(dial, national)` — national starting `+` normalized alone; else `dial + digits(national)` → normalize

## Phases

### Phase 0 — SQL migration

`docs/stories/sql-writeups/phone-collection-schema.sql` (ALTER … IF NOT EXISTS, constraint drop/re-add, no RLS changes — waitlists already publicly readable, subscribers writes service-role only).

### Phase 1 — Shared libs + unit tests

- `src/lib/countries.ts`: `COUNTRY_OPTIONS: {dial, name}[]` (~240 ITU country-level codes, alphabetical; duplicate dials allowed), `DEFAULT_COUNTRY_DIAL = "+1"`.
- `src/lib/phone.ts` + `src/__tests__/lib/phone.test.ts`.

### Phase 2 — API

- `src/app/api/waitlist/route.ts`: GET mapper += `phoneMode: waitlist.phone_mode || "off"`; PATCH validates `phone_mode` ∈ modes → else 400.
- `src/app/api/subscribers/route.ts`:
  - destructure `phone` from body
  - waitlist select += `phone_mode`; on error mentioning `phone_mode` retry with legacy columns (mode→"off")
  - validation block after waitlist fetch, before referral + cap claim: off→drop; required+empty→400 approved copy; non-empty→normalize or 400 approved copy
  - `baseInsert`: `...(phoneValue ? { phone: phoneValue } : {})` (key only when present → pre-SQL never touches column)
  - `attemptInsert` PGRST204 retry strips any column named in the error (`display_name` and/or `phone`)

### Phase 3 — Public form

- `components/public/email-capture-form.tsx`: optional `phoneMode` prop (default "off"); grouped control under email input — country `<input list="country-dial-codes">` (w-24/shrink-0, sanitizes `^\+?\d{0,4}$`, blur resets invalid→+1, `autoComplete="tel-country-code"`) + `<datalist>` of all options + tel input (flex-1, placeholder "Phone number", `autoComplete="tel-national"`); identical per-template h-11/border/bg/focus tokens (minimal/bold/dark); error `<p className="text-xs text-destructive" role="alert">`; client validation after email checks; `body.phone = buildPhone(...)`.
- `src/app/(public)/[subdomain]/page.tsx`: `WAITLIST_SELECT` += `phone_mode`; pass `phoneMode` to form. **SQL-first gate.**

### Phase 4 — Preview parity

- `components/onboarding/live-preview.tsx`: `LivePreviewProps.phoneMode` (default off); `PreviewEmailForm` + `PreviewQuestionForm` render same grouped block (readOnly, no `list` attr → inert) under email input when enabled.
- Callers: `onboarding-client-layout.tsx` (`form.phoneMode`), settings `client.tsx` (`phoneMode` state).

### Phase 5 — Onboarding plumbing + Step 4a

- `src/app/onboarding/context.tsx`: state field `phoneMode` (default "off"), FIELD_MAP `phoneMode: "phone_mode"`; flushToAPI POST unchanged (create-whitelist has no phone_mode, DB default). **[AMENDED 2026-10-03: flushToAPI POST body now includes `phone_mode` — required after the config moved to Step 3, so the Phase A choice survives create.]**
- `src/components/auth/flush-gate.tsx`: `mapServerToState` += `phoneMode` (isPhoneMode-guarded). **[2026-10-03: `postBody` also includes `phone_mode` for the same create-path reason.]**
- `src/app/onboarding/4a/page.tsx`: "Signup fields" section (heading + approved helper + house `Select` label "Phone number" / Off-Optional-Required) above QuestionEditor; PATCH body += `phone_mode: form.phoneMode`. **[MOVED 2026-10-03 → `src/app/onboarding/3/page.tsx` (same approved copy, card style matching Milestone/Signup Counter); 4a's section, imports, and `phone_mode` PATCH field removed. POST `/api/waitlist` gained the matching create-side `phone_mode` validation + insert.]**
- Known caveat: founders skipping 4a ("No" at step 4) stay Off until settings. **[RESOLVED 2026-10-03: config now lives in Step 3, which every founder passes through.]**

### Phase 6 — Settings

- `settings/page.tsx` select += `phone_mode`; `client.tsx`: `WaitlistData.phone_mode`, root `phoneMode` state, Qualification tab block (heading + helper + Select → `saveField("phone_mode", v)` with existing Saving/Saved indicators), LivePreview pass.

### Phase 7 — Dashboard surfaces

- `leaderboard/page.tsx`: `resolveActiveWaitlistRow` columns `"id, phone_mode"`; `phoneEnabled = mode !== "off"`; subscriber select conditionally += `phone` (PGRST204 fallback drops `phone` too); pass `phoneEnabled` + phone in rows.
- `leaderboard/client.tsx`: `Row.phone`, optional `phoneEnabled` prop (default false); **single GRID const** — on: `grid-cols-[48px_1fr_1fr_1fr_100px_100px_120px_120px]`, off: current `grid-cols-[48px_1fr_1fr_100px_100px_120px_120px]` (pixel-identical); non-sortable Phone `<span>` after Email; cell `row.phone || "—"`; when on: `overflow-x-auto` + `min-w-[900px]` wrapper; search/sort/pagination unchanged (phone not sortable/searchable).
- `subscribers/[id]/page.tsx`: subscriber select += `phone`, `waitlists!inner` += `phone_mode`; Phone card after Email card when mode ≠ off (`rounded-[var(--card-radius)] border border-border bg-card p-5`).
- `api/subscribers/export/route.ts`: waitlist select += `phone_mode`, subscriber select += `phone`; header `Email,Name,Phone,Position,Referrals,Warmth,Signup Date` when on (BASE_HEADER unchanged when off); cell after display_name via `escapeCsvCell`.

## Test Matrix

| Case                                                                                                                                      | File                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| normalize/compose/isPhoneMode                                                                                                             | **new** `src/__tests__/lib/phone.test.ts`        |
| hidden at Off · renders when on · datalist present · required-empty 400-equivalent client error · invalid error · valid → POST body phone | `email-capture-form.test.tsx` (+)                |
| API required/invalid/valid/optional/off-drop                                                                                              | `api/subscribers.test.ts` (+)                    |
| PATCH phone_mode validation                                                                                                               | `api/waitlist-multi.test.ts` (+)                 |
| CSV conditional header + value; Off → BASE_HEADER unchanged                                                                               | `api/csv-export.test.ts` (+)                     |
| table Phone header/value on; absent off                                                                                                   | `dashboard-leaderboard-page.test.tsx` (+)        |
| detail Phone card on/off                                                                                                                  | `dashboard-subscriber-detail.test.tsx` (+)       |
| settings Select renders + PATCH carries phone_mode                                                                                        | **new** `dashboard-settings-phone-mode.test.tsx` |
| preview parity on/off                                                                                                                     | `live-preview-parity.test.tsx` (+)               |

## Gates

- `pnpm lint` → 0 errors / 5 baseline warnings
- prettier clean on touched files
- clean build (delete `.next` first)
- full suite vs baseline **894 total / 887 pass / 7 sanctioned fail** (dashboard-archive 4 + dashboard-subscriber-table 3)

## Execution Order

Phase 0 (SQL file) → 1 (libs+unit) → 2 (API) → 3 (form) → 4 (preview) → 5 (4a) → 6 (settings) → 7 (dashboard) → tests alongside each phase → gates → MEMORY entry.
