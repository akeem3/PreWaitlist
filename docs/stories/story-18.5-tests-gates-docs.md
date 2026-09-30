# Story 18.5 — Tests, gates & doc amendments

**Status:** ready
**Epic:** 18 — Live Waitlist Page Redesign (Bare-Minimum Contract)
**Depends on:** 18.0, 18.1, 18.2, 18.3, 18.4
**Design Refs:** — (verification + docs)
**Source:** [Epic 18 Definition of Done + ACs](../epics/epic-18-live-waitlist-page-redesign.md), [PRD REQ-6.15.3](../PRD.md) / [PRD REQ-6.8.4](../PRD.md) / [PRD L170](../PRD.md) / [PRD L182](../PRD.md), [Epic 12.2 story 12.2.6 section](../epics/completed/epic-12.2-gap-fixes.md), `.memory/MEMORY.md`

## Story

As the founder, I want tests, gates, and documentation reflecting the new page contract — so regressions are locked and specs don't lie.

## Acceptance Criteria (EARS)

- AC1: Tests shall cover: (a) renderer section order + `variant` scale classes, centered brand row, updates-below-how-it-works, how-it-works divider; (b) consent removal — form renders approved sentence with both links and no checkbox, submits without consent flag; API accepts consent-less body and still stamps `consent_given_at`/`consent_ip_address`, no longer 400s; (c) preview parity — sample updates slot, trust line, shared consent string; (d) Step 1 — Headline field present, empty-headline fallback, no unconditional backfill; (e) settings logo — upload sets value, Remove clears it, thumbnail state.
- AC2: `pnpm lint` shall report zero errors (5 pre-existing warnings accepted), the full Vitest suite shall pass at ≥ baseline (**814 total = 807 pass / 7 fixed fails**: dashboard-archive 4 + dashboard-subscriber-table 3), and `pnpm build` (after deleting `.next`) shall succeed. Prettier clean.
- AC3: PRD shall be amended: REQ-6.15.3 "above the email capture form" → position below the form/how-it-works; L170 + L182 consent checkbox rows → click-through sentence with provenance stamping retained; REQ-6.8.4 annotated with the W4 base64 deviation.
- AC4: Epic 12.2.6 story/epic ACs shall be annotated (checkbox → approved click-through line, W3) and MEMORY shall gain the Epic 18 block plus the W1 amendment to the preview-parity standing rule.
- AC5: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) test suite additions/updates (targeted files in Dev Notes)
- T2 (AC2) full gates (lint → format → suite → clean build)
- T3 (AC3) PRD amendments (4 spots)
- T4 (AC4) Epic 12.2.6 + MEMORY sync + status flips
- T5 (AC5) lint + build

## Out of Scope

- New features or refactors beyond test/docs
- Playwright e2e expansion
- Story status flips for other epics
- Amending the engine audit scans (`docs/scans/engine-audit-5-engines.md:715,781` still say updates "ABOVE email capture form" — historical snapshots; flag only, not required by ACs)

## Dev Notes

### T1 — test suite (AC1)

**(a) Renderer — extend `src/__tests__/components/waitlist-template-content.test.tsx` (101 L, existing `defaultProps` + `cleanup` pattern):**

| Case                          | Assert                                                                                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Section order (both variants) | `brand row → headline → subheadline → counter → form slot → milestones → how-it-works → updates slot` — use `compareDocumentPosition` / index-of-in-DOM, render with a `latestUpdateSlot` testid |
| Updates below how-it-works    | updates node follows "How it works" text node                                                                                                                                                    |
| Updates absent → no render    | default props (no slot) renders nothing extra (existing guard)                                                                                                                                   |
| Live scale                    | `variant="live"` → h1 class contains `sm:text-5xl`; root contains `space-y-6` / `pt-8`; subheadline `text-base`                                                                                  |
| Preview scale (default)       | no `variant` → h1 `text-4xl` **without** `sm:text-5xl`; no `space-y-6` (keeps today's contract)                                                                                                  |
| Centered brand row            | brand row container class includes `justify-center` (both variants)                                                                                                                              |
| How-it-works divider          | container class includes `border-t` (+ `border-dark-template-border` when `template="dark"`); wrapper class **does not** include `mt-auto`; label `text-sm font-medium`; step spans `text-sm`    |
| Strings frozen                | "How it works", "1. Enter your email", "2. Get your position", "3. Refer friends to move up" present verbatim                                                                                    |

**(b) Consent removal:**

| File                                                   | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/__tests__/components/email-capture-form.test.tsx` | **`:47-49` helper clicks `getByRole("checkbox")` before every submit → checkbox gone, this throws in EVERY submit test — fix the helper first.** Then: `:183` drop `consent: true` from expected payload; `:340` "blocks submit … (12.2.6 AC6)" → replace with: renders approved sentence, both `href="/legal/terms"` + `href="/legal/privacy"` links present, **no** `getByRole("checkbox")`, submit succeeds without consent flag; `:359-370` "clears the consent error" → delete |
| `src/__tests__/api/subscribers.test.ts`                | `:452` "rejects signup without consent (12.2.6 AC3)" → invert: consent-less body (keep `ts: Date.now()-5000` timing helper) returns success; assert insert payload **includes** `consent_given_at` + `consent_ip_address` (provenance still stamps — AC3); `:82-88`/`:484` drop `consent: true` from bodies                                                                                                                                                                         |
| `src/__tests__/api/subscriber-cap.test.ts`             | `:66` drop `consent: true` (+ `:60` comment wording)                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `src/__tests__/api/subscribers-referral.test.ts`       | 7 × `consent: true` sites (`:107,:130,:153,:191,:278,:356` + comment `:65`) — drop for clarity (extra field would be ignored anyway)                                                                                                                                                                                                                                                                                                                                                |

**(c) Preview parity — new `src/__tests__/components/live-preview-parity.test.tsx`:**

- Render `LivePreview` (mock `next/image`/`next/link` per `dashboard-waitlist-settings-questions.test.tsx:7-34` pattern; it also mocks LivePreview itself — **do not** copy that line, we need the real one).
- Assert: `latestUpdateSlot` sample card renders **after** "How it works" in DOM order; `PreviewEmailForm` + `PreviewQuestionForm` each show "No spam. Unsubscribe anytime."; consent sentence appears with both legal links; zero checkbox roles in the preview.
- Shared-string lock: assert `ConsentLine`/`TrustLine` are rendered in both live form and preview (component-level), plus a source-level guard is acceptable: grep-style test reading `components/public/consent-line.tsx` as the only file containing the literals (optional; DOM assertions preferred).
- If full `LivePreview` render proves brittle (BrowserFrame/deps), fall back to: unit tests of `ConsentLine` + `TrustLine` + renderer slot-position test — but AC1(c) must still be met at some level.

**(d) Step 1 — new `src/__tests__/components/onboarding-step-1-headline.test.tsx`:**

- Harness: `vi.mock("next/navigation")` (`useRouter.push`), stub `fetch` (slug availability `onboarding/1/page.tsx:148`), wrap in `LocalOnboardingProvider` (exported `src/app/onboarding/context.tsx:198`), `beforeEach` → `localStorage.clear()` (resume prompt via `hasStaleDraft()` `:92`), `userEvent` flow.
- Cases:

| Case                       | Assert                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Headline field present     | label "Headline" between "Product Name" and "Subheadline" (`getAllByLabelText` order)                                  |
| Typed headline wins        | type headline + submit → localStorage draft `headline` equals typed value                                              |
| Empty → fallback chain     | empty headline + Product Name set → draft `headline === productName`; productName empty + typed slug → `=== slug`      |
| No unconditional overwrite | typed headline + submit → not replaced by productName                                                                  |
| Skip path honors typed     | type headline → click "I'll name it later" (`:405`) → draft headline = typed; empty → "My Waitlist" (existing default) |

- Keep assertions on the persisted draft (provider writes localStorage); avoid asserting internal context directly.

**(e) Settings logo — new `src/__tests__/components/dashboard-settings-logo.test.tsx`:**

- Fixture/harness copy `dashboard-waitlist-settings-questions.test.tsx` (mocks for `next/navigation`, `next/image`, `next/link`, `shell.useUpgradeModal`, `fetch`) with `logo_url: null` → render `WaitlistSettingsClient` (`initialTab="content"`).
- **FileReader:** prefer happy-dom's native `FileReader` + `fireEvent.change(fileInput, { target: { files: [file] } })`; if `readAsDataURL` is flaky in happy-dom, stub global `FileReader` with a controlled `onload` firing `data:image/png;base64,TEST`.
- Cases: upload sets thumbnail (`alt="Logo"`) + calls PATCH with `logo_url` data URL · **Remove** button clears thumbnail + PATCHes `logo_url: ""` · no logo → Remove hidden, upload button shows "Click to upload logo (PNG or SVG, max 2MB)" · logo set → "Logo uploaded — click to replace" visible · **no** `getByLabelText("Logo URL")` text input (AC3 lock).
- LivePreview mock may capture `logoUrl` prop (`(props) => <div data-logo={props.logoUrl} />`) to lock preview passthrough (`settings/client.tsx:347`).
- 2MB oversized file → `alert` called (mock `window.alert`) — optional but cheap.

**Test mechanics gotchas (MEMORY — apply throughout):**

- `vi.clearAllMocks()` does **not** clear once-queues (`__queue`/`__calls` on supabase/email mocks) — clear manually in `beforeEach`.
- Supabase `.select(stringVar)` widens to `GenericStringError[]` — primary selects in mock setups use `const` template-literal column strings.
- Timing gate: every POST body needs `ts: Date.now()-5000` (`FORM_TS`-style helper) — **`consent: true` no longer needed**.
- Do not combine Vitest fake timers with RTL `waitFor`; `react-hooks/set-state-in-effect` fires on setState-in-effect patterns.
- `after()` IIFEs dequeue from the admin mock queue at registration — keep queue fixtures ordered (confirmation → moved-up → cap-warning).
- Full suite is flaky under load — **re-run before concluding a regression**; the 7 fixed fails (dashboard-archive 4 + dashboard-subscriber-table 3) are the exact baseline; billing webhook test occasionally flakes in full runs (passes in isolation).

### T2 — gates (AC2/AC5)

```bash
pnpm lint            # 0 errors; 5 pre-existing warnings accepted
pnpm format          # then: pnpm format:check → clean
pnpm test:run        # full suite: ≥ 814 total, 807+ pass, exactly 7 fixed fails (re-run if noisy)
rm -r -fo .next; pnpm build   # clean build (stale .next masks broken imports)
```

### T3 — PRD amendments (AC3)

| Spot                          | Current text (verified)                                                                                               | Amendment                                                                                                                                                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/PRD.md:376` REQ-6.15.3  | "…as a single 'Latest update' card **above the email capture form**. If no updates exist, the card shall not render." | Position → **below the email capture form / how-it-works (below the fold)** per W2; keep latest-only + conditional-render remainder                                                                                       |
| `docs/PRD.md:170`             | "Consent checkbox on signup: separate from signup, logged with timestamp + IP"                                        | → click-through sentence (quote W3 verbatim: "By joining, you agree to receive emails and accept our Terms and Privacy Policy.") with links; **timestamp + IP provenance stamping retained**; checkbox no longer required |
| `docs/PRD.md:182` (table row) | "\| Consent checkbox \| GDPR: signing up ≠ marketing consent \| Separate checkbox, logged with timestamp + IP \|"     | Same treatment as L170 — reword row to click-through + provenance (record **why** stays: GDPR/CASL evidence)                                                                                                              |
| `docs/PRD.md:310` REQ-6.8.4   | "…PNG or SVG only, up to 2MB, **stored in Supabase Storage**."                                                        | Annotate W4 deviation: settings + onboarding store base64 data URLs in `waitlists.logo_url` (2MB/type limits kept); Supabase Storage migration deferred (out of scope, Epic 18)                                           |

- Read L165-175 context before editing L170 (adjacent consent rows may need one-line touch-ups).
- Use the established amendment convention (`**[AMENDED 2026-09-30 — Epic 18 W#]**` style notes; do not silently rewrite history).

### T4 — Epic 12.2.6 + MEMORY sync (AC4)

**Epic 12.2 annotations:**

| File                                                      | Spot                                                                                                                                                                        | Annotation                                                                                                                                                                                                                               |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/epics/completed/epic-12.2-gap-fixes.md`             | 12.2.6 AC1–AC7 (`:230-236`)                                                                                                                                                 | `[AMENDED 2026-09-30 — Epic 18 W3]` checkbox ACs (AC1, AC2, AC3, AC6, AC7) superseded by the approved click-through line; AC4/AC5 (server stamps `consent_given_at` + `consent_ip_address`) **still live** — stamped unconditionally now |
| same                                                      | T1 regression note (`:245`)                                                                                                                                                 | Append: checkbox + guard + 400 replaced by click-through line (Epic 18.1); provenance stamping retained                                                                                                                                  |
| `docs/stories/completed/story-12.2.6-consent-tracking.md` | header (after existing regression note `:8`)                                                                                                                                | Same W3 amendment block (checkbox copy/required/error ACs superseded; stamping ACs live)                                                                                                                                                 |
| Stragglers (one-liners)                                   | `story-12.2.0-schema-migration.md:14` AC1 ("when the consent checkbox is checked"), `story-12.2.10-epic-tests.md:20` AC3 ("checkbox renders…"), `epic-12.2-gap-fixes.md:49` | Cross-reference note → W3 (keeps docs honest without rewriting ACs)                                                                                                                                                                      |

**MEMORY (`.memory/MEMORY.md`) additions:**

1. New `## Epic 18 Progress (Live Waitlist Page Redesign)` block — story status table (18.0–18.5 → done), execution order, key decisions (W1 variant model, W2 updates below fold, W3 consent line + stamping, W4 base64 logo, W5 headline field, W7 no-SVG layout source), gotchas learned at execution.
2. **W1 amendment to the standing rule** — the existing constraint _"What is designed/previewed in onboarding MUST be EXACTLY what is shown on the public waitlist page"_ → amend: preview is a **compact approximation** of the live page (`variant="preview"` vs `variant="live"`); **content order + copy identical, scale differs**. The reuse half of the rule is untouched: still one shared `WaitlistTemplateContent` — never a second implementation.
3. Note the W3 consent model + W4 deviation where MEMORY references consent/logo (do not rewrite history — append amendment markers).

**Status flips (completion):** Story Index rows 18.0–18.5 → `done`, epic `Status:` → `done`; each story file's `**Status:** ready` → `done`.

### T5 — lint + build (AC5)

Final re-run after doc edits (markdown passes prettier; lint unaffected by docs but required by AC5).

## Files to Create/Modify

| File                                                                                                                      | Change                                                                  |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/__tests__/components/waitlist-template-content.test.tsx`                                                             | Extend — order/variant/centering/divider (T1a)                          |
| `src/__tests__/components/email-capture-form.test.tsx`                                                                    | Fix checkbox helper `:47-49`, payload `:183`, tests `:340`/`:359` (T1b) |
| `src/__tests__/api/subscribers.test.ts`                                                                                   | Invert `:452` + stamping asserts; body cleanup (T1b)                    |
| `src/__tests__/api/subscriber-cap.test.ts`, `subscribers-referral.test.ts`                                                | Body/comment cleanup (T1b)                                              |
| `src/__tests__/components/live-preview-parity.test.tsx`                                                                   | **New** (T1c)                                                           |
| `src/__tests__/components/onboarding-step-1-headline.test.tsx`                                                            | **New** (T1d)                                                           |
| `src/__tests__/components/dashboard-settings-logo.test.tsx`                                                               | **New** (T1e)                                                           |
| `docs/PRD.md`                                                                                                             | 4 amendment spots (T3)                                                  |
| `docs/epics/completed/epic-12.2-gap-fixes.md`, `docs/stories/completed/story-12.2.6-consent-tracking.md` (+ 3 stragglers) | Annotations (T4)                                                        |
| `.memory/MEMORY.md`                                                                                                       | Epic 18 block + W1 rule amendment (T4)                                  |
| `docs/epics/epic-18-live-waitlist-page-redesign.md` + 6 story files                                                       | Status flips (T4)                                                       |

## Risk

- **`email-capture-form.test.tsx` helper (`:47-49`) is a landmine** — the shared pre-submit checkbox click breaks every submit test in that file the moment 18.1 merges; fix it first or the suite looks catastrophically red for a known reason.
- **Baseline drift:** new tests raise the total; AC2's "≥ baseline" is on **pass count** with the **same 7 fixed fails** — never accept a new failure by rebaselining silently.
- **Do not weaken existing passing tests** to make gates green — invert consent expectations only where ACs mandate it (12.2.6 AC3 → success), keep everything else.
- **Doc edits are history amendments, not rewrites** — use `[AMENDED …]` markers; PRD/epic AC text keeps its original wording with the supersession note attached.
