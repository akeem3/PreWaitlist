# Story 18.3 — Step 1 Headline field + product-name differentiation

**Status:** ready
**Epic:** 18 — Live Waitlist Page Redesign (Bare-Minimum Contract)
**Depends on:** —
**Design Refs:** `docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg` (Headline/Subheadline fields), `docs/design/design-analysis.md` L72-73 (labels "Headline"/"Subheadline"), L100-101 (input dimensions)
**Source:** [Epic 18 W5/W6/W8](../epics/epic-18-live-waitlist-page-redesign.md), [PRD REQ-6.6.1–6.6.5 Step 1](../PRD.md), [src/app/onboarding/1/page.tsx](../../src/app/onboarding/1/page.tsx), [src/app/onboarding/3/page.tsx](../../src/app/onboarding/3/page.tsx)

## Story

As a founder, I want to write a real Headline in Step 1 and clearly distinguish it from my internal product name — so my live page doesn't show my product name as its headline.

## Acceptance Criteria (EARS)

- AC1: Step 1 shall render a Headline text input (label "Headline") between Product Name and Subheadline, writing `form.updateField("headline", …)` through the existing context.
- AC2: Step 1 submit shall use the entered Headline. The backfill `headline = productName || slug` (`src/app/onboarding/1/page.tsx:221-223`) shall be replaced by the field value; an **empty** Headline field shall fall back to Product Name, then slug (preserving the non-empty invariant without new error copy). The "I'll name it later" skip path (`:194-206`) shall keep its existing defaults for skipped fields while honoring a typed Headline.
- AC3: The Product Name input shall sit in its own visually distinct grouped block (spacing/container treatment via tokens) separate from the Headline/Subheadline/Subdomain inputs. **No new user-facing copy** shall be added (W6).
- AC4: Step 3's Headline editing shall remain functional, editing the same context field (W5).
- AC5: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) Headline input wiring
- T2 (AC2) backfill replacement + fallback chain + skip-path honor
- T3 (AC3) Product Name visual grouping (tokens only)
- T4 (AC4) Step 3 regression check
- T5 (AC5) lint + build

## Out of Scope

- Step 1 copy changes (heading "What's your product called?", placeholders, helper text)
- Subdomain/slug logic (REQ-6.6.x availability checking unchanged)
- Step 3 UI changes (it keeps editing the same field)
- Data migration for existing waitlists whose headline was backfilled from product name (W5: none)
- `product_name` handling anywhere else (public page, sidebar, settings)

## Dev Notes

**Verified against current code (all line refs confirmed):**

| Location                | Lines                     | Current state                                                                                                                                                                   |
| ----------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onboarding/1/page.tsx` | 410 L                     | Primary file                                                                                                                                                                    |
| `:74`                   |                           | `const [subheadline, setSubheadline] = useState(form.subheadline)` — **the pattern Headline must mirror**                                                                       |
| `:296-299`              |                           | Page heading + "Don't worry — you can change all of this later." (frozen copy)                                                                                                  |
| `:301-318`              |                           | Field 1: Product Name — label `:303-308`, input classes `:316`                                                                                                                  |
| `:320-337`              |                           | Field 2: Subheadline — input classes `:335` (byte-identical to `:316`)                                                                                                          |
| `:339-381`              |                           | Field 3: Subdomain + URL preview + fallback hint                                                                                                                                |
| `:194-206`              |                           | `handleNameLater` — defaults: slug→`generateFallbackSlug()` `:195`, productName→"My Waitlist" `:202`, **headline→"My Waitlist" `:203`**, subheadline→"Join the waitlist" `:204` |
| `:221-223`              |                           | Submit backfill: **already conditional** — `if (!form.headline) { form.updateField("headline", form.productName                                                                 |     | slug); }` (see T2 — epic's "unconditional" wording corrected) |
| `:248`                  |                           | `handleStartFresh` reset: `form.updateField("headline", "")` — keep                                                                                                             |
| `onboarding/3/page.tsx` | `:46`, `:325-345`, `:340` | Step 3 Headline input — local state + `form.updateField("headline", …)` on change (same context field — AC4)                                                                    |

**Key insight:** `headline` already exists in `OnboardingFormContext` (Step 3 edits it) — no context changes. Today Step 1 never exposes it, so a restored draft's headline can be silently re-backed-filled or the skip path can clobber it. The fix is the field + fallback chain, not new state infrastructure.

### T1 — Headline input (AC1)

Insert **between Field 1 (`:318`) and Field 2 (`:320`)**; renumber comment labels (comments only):

```tsx
{
  /* Field 2: Headline */
}
<div className="mb-3">
  <label
    htmlFor="headline"
    className="mb-1 block text-xs text-muted-foreground"
  >
    Headline
  </label>
  <input
    id="headline"
    type="text"
    value={headline}
    onChange={(e) => setHeadline(e.target.value)}
    disabled={isSubmitting}
    className="flex w-full items-center rounded-(--radius-lg) border border-border bg-card px-3 py-3 text-sm h-10 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
  />
</div>;
```

- Local state mirroring `:74`: `const [headline, setHeadline] = useState(form.headline);` — lazy init reads the restored draft (LocalOnboardingProvider hydrates from localStorage before render).
- Label **"Headline"** is design-approved (design-analysis L72).
- **Placeholder:** do **not** add one — no Headline placeholder exists in W8's pre-approved list (W8 COPY GAP). Omitting a placeholder is not copy; inventing one is. (Subheadline keeps its existing placeholder `:331`.)
- Input classes: byte-identical to `:316`/`:335` (the established standard).
- This story owns local state only — no `form.updateField` on keystroke (matches subheadline: writes at submit `:220`).

### T2 — backfill replacement + fallback chain (AC2)

**Verified current behavior (corrects epic wording):** `:221-223` is already conditional on `!form.headline` — but `form.headline` can hold a stale/restored value while the user's _typed_ input lives nowhere until submit, and a **cleared** field can't force a refresh. Target in `handleSubmit` (replace `:221-223`):

```ts
form.updateField("slug", slug);
form.updateField("subheadline", subheadline);
// Field value wins; empty → Product Name → slug (non-empty invariant, no new copy)
form.updateField("headline", headline.trim() || form.productName || slug);
```

- Single unconditional write with a fallback chain — typed value never lost, empty field never produces `""` headline (renderer falls back to "Your Headline" only as last resort; the invariant here keeps it populated).
- **Skip path (`handleNameLater` `:194-206`)** — honor typed headline, keep all other defaults:

```ts
form.updateField("slug", fallback);
form.updateField("productName", "My Waitlist");
if (!headline.trim()) form.updateField("headline", "My Waitlist"); // existing default, conditional
form.updateField("subheadline", "Join the waitlist");
```

Existing strings ("My Waitlist", "Join the waitlist") are pre-existing — not new copy.

- **Reset path (`:248`)** — keep `form.updateField("headline", "")` and add `setHeadline("")` so local state can't resurrect cleared text on a start-fresh flow. (Pre-existing equivalent gap for `subheadline` local state exists — leave it; out of scope.)

### T3 — Product Name grouping (AC3)

Wrap Field 1 (`:301-318`) in a separating container — tokens only, no inline styles:

```tsx
{
  /* Field 1: Product Name — internal name, visually separated from page copy */
}
<div className="mb-6 border-b border-border pb-6">
  <div className="mb-0">…existing Product Name label + input…</div>
</div>;
```

- The `border-b` + extra bottom margin creates the "own block" separation between the internal Product Name and the public-facing Headline/Subheadline group (W6: **visual-only — zero new helper copy**).
- Remove the original `mb-3` from the Product Name wrapper so spacing doesn't double (`mb-6 pb-6` replaces it).
- Verify visual balance at execution; adjust spacing values within the 8px grid (multiples of 2/4/6/8/10/12/16…) if needed. Onboarding is light-only — no dark-template branch required here.
- Headline/Subheadline/Subdomain keep their existing `mb-3` wrappers as the copy group.

### T4 — Step 3 regression check (AC4)

- Open `onboarding/3` — Headline input still edits `form.headline`; both steps show the same value (shared context + localStorage draft sync).
- Submitting Step 1 then loading Step 3: typed headline appears; empty Step-1 headline shows the productName fallback value.
- No code changes expected in `onboarding/3/page.tsx`.

### T5 — lint + build (AC5)

```bash
pnpm lint
pnpm build   # delete .next first
```

Step-1 tests land in 18.5 (`onboarding-step-1-headline.test.tsx`).

## Files to Create/Modify

| File                            | Change                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/app/onboarding/1/page.tsx` | Headline input + local state (T1), submit/skip/reset logic (T2), Product Name group (T3) |
| `src/app/onboarding/3/page.tsx` | No change — regression check only (T4)                                                   |

## Risk

- **Stale local state:** local `headline` init reads `form.headline` once — resume/skip/reset flows must keep it coherent (T2's `setHeadline("")` on start-fresh; skip path writes defaults directly to context while input may still show text — acceptable because skip navigates away, but verify Step 2 back-nav doesn't resurrect mismatch).
- **Fallback edge:** `form.productName || slug` — both can be empty pre-fill? Product Name starts empty and slug gets a generated value only via skip path; typed-slug flow always has `slug`. Chain is safe (slug is required by submit guard `:212`).
- **Don't overreach:** no placeholder, no helper text, no validation error copy — every one of those is a W8 copy gap.
- Preview/live reflection: headline flows to `LivePreview` and the live page through existing wiring — no changes beyond the field.
