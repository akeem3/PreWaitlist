# Epic 18 — Live Waitlist Page Redesign (Bare-Minimum Contract)

**Status:** ready
**Source:** [PRD L60/L70/L75 Sprint 2 public waitlist page](../PRD.md), [PRD REQ-6.6.1–6.6.5 Step 1](../PRD.md), [PRD REQ-6.8.4 logo upload](../PRD.md), [PRD REQ-6.15.3 updates card position](../PRD.md) (position amended by W2), [PRD L169-170 + L182 consent checkbox](../PRD.md) (amended by W3), [design-analysis.md Step 1](../design/design-analysis.md) (Headline/Subheadline fields, L72-73/L100-101), web research: waitlist page anatomy (LaunchList 2026 teardowns of Robinhood/Superhuman/Morning Brew, Waitframe, UseWait, Waitlister, Spynra, Woobox) + consent law (FTC proposed rule — checkbox not required; Litmus/DigiWell GDPR–CAN-SPAM–CASL stacking), founder decisions 2026-09-30 (Q&A, 8 answers locked)

## Design References

| Reference                                          | File                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------ |
| Public waitlist page layout (**no HF SVG exists**) | Research anatomy sources in `Source` + `src/app/globals.css` tokens (W7) |
| Step 1 — Headline/Subheadline field design         | `docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg` (outlined text) |
| Step 1 field specs (labels, input dimensions)      | `docs/design/design-analysis.md` L72-73, L100-101                        |
| Step 3 logo upload control                         | `docs/design/High-fidelity-svgs/HF 6 onboard step 3.svg`                 |
| Design tokens                                      | `src/app/globals.css`                                                    |

**Note:** No high-fidelity SVG exists for the public waitlist page — founder decision W7: layout derives from the research anatomy + Design System v2.0 tokens; the SVG gap is documented rather than blocking.

## Goal

Redesign the public waitlist page into a focused "bare-minimum waitlist" that follows the research-validated anatomy (centered brand → outcome headline → subhead → social proof → form + consent/trust → milestones → how-it-works → updates below fold → footer), and make the live page deliberately **richer** than the onboarding preview through a single shared renderer with a sanctioned `variant` scale — eliminating accidental drift (missing updates card and trust line in preview, left-aligned brand row, dead `mt-auto`, cramped `text-xs` how-it-works). Simultaneously remove the friction-heavy consent checkbox in favor of the founder-approved click-through sentence (server still stamps consent provenance), restore the design-specified Headline field to Step 1 while visually distinguishing the internal product name, and give settings the same logo upload/delete/replace experience as onboarding instead of a URL/blob text input.

## Definition of Done

A visitor on `/{subdomain}` sees a properly paced single-column page: centered logo/product name, hero headline, readable subhead, signup counter, email form with the approved consent sentence + trust line beneath it, milestone chips, a distinct how-it-works section, the founder's latest update below the fold, and the Free-tier PoweredBy footer — on mobile and desktop. The onboarding preview shows the same order with compact scale, now including a sample updates card and the trust line. Signup succeeds without any checkbox while `consent_given_at`/`consent_ip_address` still stamp. Step 1 captures a real Headline (no more headline=product-name backfill hack) with Product Name visually distinct and zero new copy. Settings shows a thumbnail + upload/remove/replace logo control with no base64 text input. Tests lock renderer order/variant, consent, preview parity, Step 1, and logo upload; `pnpm lint`, full suite (≥ baseline 807 pass / 7 fixed fails), and clean build pass; PRD (REQ-6.15.3 position, consent rows, REQ-6.8.4 deviation), Epic 12.2.6 consent ACs, and MEMORY are amended.

## Standing Decisions (locked 2026-09-30 — do not relitigate)

| #   | Decision                                                                                                                                                                                                                                                                                         | Rationale                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1  | **Live is richer than preview** via one shared renderer `variant: "live" \| "preview"` — preview is an approximation, **not pixel-parity**; content order + copy stay identical                                                                                                                  | Founder answer 2026-09-30; amends MEMORY standing rule "preview MUST be EXACTLY the live page" (reuse rule still holds — never a second implementation)          |
| W2  | **All modules retained**: signup counter, updates card, milestone chips, how-it-works, PoweredBy footer — updates card **moves below the form** (below fold)                                                                                                                                     | Founder answer 2026-09-30; amends PRD REQ-6.15.3 ("above the email capture form")                                                                                |
| W3  | **Consent:** remove checkbox; render verbatim **"By joining, you agree to receive emails and accept our Terms and Privacy Policy."** with `/legal/terms` + `/legal/privacy` links; API accepts without consent flag but **still stamps `consent_given_at` + `consent_ip_address`**               | Founder approved wording 2026-09-30; FTC rule = no checkbox required for CAN-SPAM; provenance kept for GDPR/CASL records; amends PRD L170/L182 + Epic 12.2.6 ACs |
| W4  | **Settings logo = base64 upload + delete/replace**, mirroring onboarding Step 3 (`FileReader` → `dataURL`) — no Supabase Storage migration this epic                                                                                                                                             | Founder answer 2026-09-30; deviates from PRD REQ-6.8.4 ("stored in Supabase Storage") — pre-existing onboarding pattern, annotated in 18.5                       |
| W5  | **Step 1 gains a Headline input** (label "Headline" per design spec); Step 3 keeps editing the same context field; **headline backfill removed** (empty field falls back to product name → slug); no retroactive data migration                                                                  | Founder answer 2026-09-30; design-analysis L72-73 shows Headline was always in the Step 1 design                                                                 |
| W6  | **Product Name differentiation is visual-only** — its own grouped block; **no new helper copy**                                                                                                                                                                                                  | Founder answer 2026-09-30 (copy gap avoided by choosing visual-only)                                                                                             |
| W7  | **Design source = research anatomy + Design System v2.0 tokens** (no public-page SVG exists)                                                                                                                                                                                                     | Founder answer 2026-09-30; layout spec lives in 18.0 Dev Notes                                                                                                   |
| W8  | **Copy rule:** only these strings are pre-approved — consent sentence (W3), existing "No spam. Unsubscribe anytime.", existing "How it works" + 3 step strings, existing Step 1 labels + "Headline", existing onboarding logo-upload control labels. Anything else = **COPY GAP → founder gate** | AGENTS.md never-write-copy standing rule                                                                                                                         |

**Epic out of scope:** Supabase Storage migration for logos (REQ-6.8.4 full compliance), retroactive fixing of existing waitlists whose headline was backfilled from product name, qualification-question form redesign, leaderboard-link module, FAQ/SEO sections (research mentions; not bare-minimum), thank-you/leaderboard/marketing pages, new env vars or dependencies (none required).

## Story Index

| ID   | Title                                                    | Depends on | Status |
| ---- | -------------------------------------------------------- | ---------- | ------ |
| 18.0 | Shared renderer restructure + live/preview variants      | —          | ready  |
| 18.1 | Consent swap: checkbox → approved click-through line     | —          | ready  |
| 18.2 | Preview parity: updates slot, trust line, shared strings | 18.0, 18.1 | ready  |
| 18.3 | Step 1 Headline field + product-name differentiation     | —          | ready  |
| 18.4 | Settings logo upload with delete/replace                 | —          | ready  |
| 18.5 | Tests, gates & doc amendments                            | 18.0–18.4  | ready  |

**Execution order:** **18.0 + 18.1 + 18.3 + 18.4 in parallel** (independent files/surfaces). Then **18.2** (needs renderer variant from 18.0 and consent line from 18.1). Then **18.5** (tests + docs last). No SQL migrations. No copy gates beyond W8's pre-approved list.

Stories must be executed in dependency order where listed; status workflow: `ready` → `in-progress` → `done` (or `blocked`). Branch: `epic-18-waitlist-redesign` from `dev`.

---

### Story 18.0 — Shared renderer restructure + live/preview variants

**Status:** ready
**Design Refs:** research anatomy (LaunchList/Waitframe/UseWait/Waitlister — see `Source`), `src/app/globals.css` tokens; no SVG exists (W7)
**Story:** As a founder, I want my live waitlist page to be a richer, properly paced bare-minimum page while the onboarding preview stays a compact approximation — so the preview communicates the design without pretending to be pixel-identical.

**Acceptance Criteria (EARS):**

- AC1: The shared renderer shall present sections in this order on both variants: brand row (logo + product name) → headline → subheadline → signup counter → email capture form slot → milestone chips → how-it-works → founder updates slot. The PoweredBy footer remains rendered by the page wrappers outside the renderer.
- AC2: The renderer shall accept `variant: "live" | "preview"` (default `"preview"`). The `"live"` treatment shall apply the richer scale per Dev Notes (larger hero headline, `text-base`+ subhead, increased section rhythm); the `"preview"` treatment shall retain today's compact scale. Section order and copy shall be identical across variants.
- AC3: The brand row shall be horizontally centered on both variants (currently left-aligned at `waitlist-template-content.tsx:51-73`).
- AC4: The founder updates slot shall render **after** how-it-works (below fold), no longer above the form (`:105-107` today). When no update exists, the slot shall not render (existing behavior, PRD REQ-6.15.3 remainder).
- AC5: How-it-works shall render as a distinct section on both variants: top divider (`border-t border-border`; dark template `border-dark-template-border`), label `text-sm font-medium`, steps `text-sm`, explicit top padding — and the dead `mt-auto` (`:154`) shall be removed. Existing strings ("How it works", "1. Enter your email", "2. Get your position", "3. Refer friends to move up") shall be unchanged.
- AC6: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1, AC3) section order + centered brand row · T2 (AC2) variant prop + live scale spec wired from `waitlist-page-content.tsx` · T3 (AC4) updates slot relocation · T4 (AC5) how-it-works section rebuild · T5 (AC6) lint + build

**Out of scope:** Preview-slot content (18.2), consent/trust line (18.1), form internals, page-wrapper background/padding changes beyond what AC2 requires, footer rendering changes.

**Dev Notes:**

- **Primary files:** `components/share/waitlist-template-content.tsx` (177 L, full rewrite of section layout), `components/public/waitlist-page-content.tsx` (pass `variant="live"`; `:38` wrapper may bump `py-12` → `py-16 md:py-24` for live rhythm — utility classes only, no inline styles), `components/onboarding/live-preview.tsx` (pass `variant="preview"` explicitly at `:422`).
- **Live scale spec (W1/W7):** headline `text-4xl sm:text-5xl font-semibold` (preview keeps `text-4xl`); subheadline `text-base` for all templates on live (preview keeps template-based `text-sm`/`text-base` at `:43`); live root padding `pt-8 pb-6` + `space-y-6` between sections (preview keeps `pt-2 pb-4` at `:47` + current `mt-1`/`mt-2` gaps); counter/milestones/form slots keep `max-w-md` centered containers.
- **Brand row:** add `justify-center w-full` to the `:52` flex row; keep logo `h-7 w-7` + product name styling (`:54-71`).
- **Updates slot:** move the `latestUpdateSlot` block from `:105-107` to after the how-it-works block; keep `w-full max-w-md` (or widen to `max-w-xl` if the card reads cramped — visual check at execution, tokens only).
- **How-it-works:** replace `:153-174` wrapper — no `mt-auto`; divider style varies by template (bold: consider `border-foreground` to match `border-2` bold language; verify visually).
- **Dark template:** every new class must use dark utility tokens (`text-dark-template-text`, `border-dark-template-border`, etc.) — never `bg-[--color-*]` arbitrary values (MEMORY gotcha).
- Do NOT restructure the form component (18.1 owns consent/trust) or preview slots (18.2 owns parity).

---

### Story 18.1 — Consent swap: checkbox → approved click-through line

**Status:** ready
**Design Refs:** — (form + API; no SVG)
**Story:** As a subscriber, I want to join with a single approved click-through consent line instead of a checkbox — so signup stays frictionless while consent provenance is still recorded.

**Acceptance Criteria (EARS):**

- AC1: The email capture form shall not render a consent checkbox or consent validation state. In its place it shall render, in both layout variants, the verbatim string **"By joining, you agree to receive emails and accept our Terms and Privacy Policy."** where "Terms" links to `/legal/terms` and "Privacy Policy" links to `/legal/privacy`. Styling shall use existing text/link tokens and be dark-template aware.
- AC2: The client shall no longer block submission when consent is absent and shall no longer require a `consent: true` field in the POST body.
- AC3: `POST /api/subscribers` shall accept signups without a consent flag (the current 400 on missing consent shall be removed) and shall continue to stamp `consent_given_at` and `consent_ip_address` exactly as today.
- AC4: The onboarding preview's consent mock (`PreviewConsent`) shall render the same approved sentence (shared string source), with no checkbox.
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) approved sentence + links replacing checkbox in both form variants · T2 (AC2) client validation/state removal · T3 (AC3) API consent-400 removal, stamping preserved · T4 (AC4) preview consent mock swap · T5 (AC5) lint + build

**Out of scope:** Renderer layout (18.0), trust-line parity (18.2), PRD/Epic-12.2.6 doc amendments (18.5), `consent_records` table from PRD L169 (never built; not in this epic), unsubscribe/bounce send-time checks.

**Dev Notes:**

- **Primary file:** `components/public/email-capture-form.tsx` — consent state `:53-54`, hard block `:96-97`, `consent: true` payload `:113`, `consentBlock` definition `:176-199`, render sites `:374` (variant 1) and `:432` (variant 2). Keep the existing "No spam. Unsubscribe anytime." trust line at `:394`/`:437` untouched (18.2 adds it to preview).
- **Shared string:** export the approved sentence (+ link elements or URL constants) from a single module — propose `components/public/consent-line.tsx` (component) so `email-capture-form.tsx` and `live-preview.tsx` both import it; never duplicate the literal (W8).
- **API:** `src/app/api/subscribers/route.ts` — locate the consent 400 (Phase 6.4 addition) and remove it; keep `consent_given_at`/`consent_ip_address` stamping on insert unchanged. If the route also reads `consent` from the body, stop requiring it (ignore or treat absent as accepted).
- **Preview:** `components/onboarding/live-preview.tsx` `PreviewConsent` (renders at `:186` inside `PreviewEmailForm`; also used by `PreviewQuestionForm`) — swap to the shared consent line.
- **Placement:** sentence goes where the checkbox block sits today (above submit); do not merge it with the trust line — both remain visible.
- **Tests to update in 18.5 (expect breakage here):** `email-capture-form` tests asserting checkbox/validation; `subscribers` API tests asserting consent 400.

---

### Story 18.2 — Preview parity: updates slot, trust line, shared strings

**Status:** ready
**Design Refs:** — (no SVG); parity contract per W1
**Story:** As a founder previewing onboarding, I want the preview to show the updates card and trust line like the live page — so what I configure matches what visitors see.

**Acceptance Criteria (EARS):**

- AC1: The onboarding preview shall render the founder-updates slot in the same position as the live page (after how-it-works), using a static sample/mock update — the preview shall not fetch live data.
- AC2: Both preview form mocks (`PreviewEmailForm`, `PreviewQuestionForm`) shall render the trust line "No spam. Unsubscribe anytime." below the form controls, matching live placement.
- AC3: The consent sentence (18.1) and trust line shall each be sourced from a single shared module consumed by the live form and both preview mocks — no duplicated literals in `live-preview.tsx` (the current duplicate consent text at `live-preview.tsx:106` vs `email-capture-form.tsx:195` shall be gone).
- AC4: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) sample updates slot in preview · T2 (AC2) trust line in both preview mocks · T3 (AC3) shared-string extraction · T4 (AC4) lint + build

**Out of scope:** Renderer order/scale (18.0), consent removal itself (18.1 — 18.2 only consumes its shared component), LivePreview desktop/mobile toggle behavior, BrowserFrame.

**Dev Notes:**

- **Primary file:** `components/onboarding/live-preview.tsx` — `emailCaptureForm` construction `:362-376`, `WaitlistTemplateContent` call `:422-435` (add `latestUpdateSlot`), `PreviewEmailForm` `:114-189`, `PreviewQuestionForm` `:191+`.
- **Sample update:** check `LatestUpdateCard`/`updates-feed.tsx` props — if presentational (update passed in), render it with a mock update object kept inside `live-preview.tsx`; if it fetches, build a minimal static mock matching its markup instead. Preview must stay `ssr:false`-compatible.
- **Trust line:** copy exact markup/classes from `email-capture-form.tsx:394` (template-aware variants) into the shared module or import it — dark template aware.
- Depends on 18.0 (slot position) + 18.1 (consent component) — integrate after both merge.

---

### Story 18.3 — Step 1 Headline field + product-name differentiation

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-svgs/HF 4 onboard step 1.svg`; `docs/design/design-analysis.md` L72-73 (labels "Headline"/"Subheadline"), L100-101 (input dimensions)
**Story:** As a founder, I want to write a real Headline in Step 1 and clearly distinguish it from my internal product name — so my live page doesn't show my product name as its headline.

**Acceptance Criteria (EARS):**

- AC1: Step 1 shall render a Headline text input (label "Headline") between Product Name and Subheadline, writing `form.updateField("headline", …)` through the existing context.
- AC2: Step 1 submit shall use the entered Headline. The unconditional backfill `headline = productName || slug` (`src/app/onboarding/1/page.tsx:222`) shall be removed; an **empty** Headline field shall fall back to Product Name, then slug (preserving the non-empty invariant without new error copy). The "I'll name it later" skip path (`:202-204`) shall keep its existing defaults for skipped fields while honoring a typed Headline.
- AC3: The Product Name input shall sit in its own visually distinct grouped block (spacing/container treatment via tokens) separate from the Headline/Subheadline/Subdomain inputs. **No new user-facing copy** shall be added (W6).
- AC4: Step 3's Headline editing shall remain functional, editing the same context field (W5).
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) Headline input wiring · T2 (AC2) backfill removal + fallback chain · T3 (AC3) visual grouping (tokens only) · T4 (AC4) Step 3 regression check · T5 (AC5) lint + build

**Out of scope:** Step 1 copy changes (headings, placeholders), subdomain/slug logic (REQ-6.6.x unchanged), Step 3 UI changes, data migration for existing waitlists, `product_name` handling elsewhere.

**Dev Notes:**

- **Primary file:** `src/app/onboarding/1/page.tsx` — fields today: Product Name `:301-318`, Subheadline `:320-337`, Subdomain `:339-381`; all three inputs share byte-identical classes (`:316`/`:335`/`:354`) — Headline gets those same standard classes; Product Name gets the grouped treatment (e.g., wrapper div with `mb-6 pb-6 border-b border-border` separating it from the copy-fields group — verify visual balance; tokens only, no inline styles).
- **Context:** `headline` already exists in `OnboardingFormContext` (Step 3 edits it) — no context changes expected.
- **Backfill call sites:** `:222` (submit path, replace with field value + fallback chain), `:203` (skip path sets `headline` default — preserve semantics: typed headline wins, empty → existing default), `:248` (reset — keep).
- **Preview/live reflection:** headline flows to `LivePreview` and the live page through existing wiring — no changes beyond the field itself.
- Placeholder: reuse an existing approved pattern; if a placeholder string for Headline is needed, it must come from the design spec or be a **COPY GAP** (W8). The label "Headline" is design-approved (design-analysis L72).

---

### Story 18.4 — Settings logo upload with delete/replace

**Status:** ready
**Design Refs:** `docs/design/High-fidelity-svgs/HF 6 onboard step 3.svg` (upload control); onboarding implementation is the functional reference
**Story:** As a founder editing settings, I want to upload, remove, and replace my logo like I did in onboarding — instead of pasting a URL or base64 blob.

**Acceptance Criteria (EARS):**

- AC1: The waitlist-settings Logo URL text input (`src/app/dashboard/[waitlistId]/settings/client.tsx:300-303`) shall be replaced by an upload control accepting `image/png,image/svg+xml` files and converting to base64 via `FileReader` — the same pattern as `src/app/onboarding/3/page.tsx:129,437-438`.
- AC2: When a logo is set, the control shall show a thumbnail preview plus a Remove action (clears `logo_url` through the existing `saveField` path) and a replace action (choosing a new file overwrites the value). When no logo is set, only the upload action shows.
- AC3: The settings preview panel (`:347`) shall continue reflecting `logoUrl`; no base64/URL blob shall be editable in a text input anywhere in settings.
- AC4: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) upload control replacing URL input · T2 (AC2) thumbnail + remove + replace states · T3 (AC3) preview wiring check · T4 (AC4) lint + build

**Out of scope:** Supabase Storage / REQ-6.8.4 full compliance (W4), file-size/type enforcement beyond `accept` (mirror onboarding exactly), onboarding Step 3 changes, logo rendering on public page (unchanged), other settings fields.

**Dev Notes:**

- **Primary file:** `src/app/dashboard/[waitlistId]/settings/client.tsx` — state `logoUrl :56`, URL input `:300-303`, preview passthrough `:347`. Keep `saveField("logo_url", …)` + existing debounce/onBlur semantics; a Remove click saves `""` (or `null` if the column/PATCH prefers — check `api/waitlist/route.ts` PATCH handling of empty string).
- **Copy gate (W8):** button/label strings must reuse the onboarding Step 3 upload control's existing labels verbatim — read them at execution from `onboarding/3/page.tsx` and mirror. No new strings.
- **PRD deviation:** REQ-6.8.4 says Supabase Storage; W4 locks base64 reuse this epic — 18.5 annotates the PRD.
- Large base64 payloads already work via onboarding (same `saveField` PATCH path); no new infra.

---

### Story 18.5 — Tests, gates & doc amendments

**Status:** ready
**Design Refs:** — (verification + docs)
**Story:** As the founder, I want tests, gates, and documentation reflecting the new page contract — so regressions are locked and specs don't lie.

**Acceptance Criteria (EARS):**

- AC1: Tests shall cover: (a) renderer section order + `variant` scale classes, centered brand row, updates-below-how-it-works, how-it-works divider; (b) consent removal — form renders approved sentence with both links and no checkbox, submits without consent flag; API accepts consent-less body and still stamps `consent_given_at`/`consent_ip_address`, no longer 400s; (c) preview parity — sample updates slot, trust line, shared consent string; (d) Step 1 — Headline field present, empty-headline fallback, no unconditional backfill; (e) settings logo — upload sets value, Remove clears it, thumbnail state.
- AC2: `pnpm lint` shall report zero errors (5 pre-existing warnings accepted), the full Vitest suite shall pass at ≥ baseline (**814 total = 807 pass / 7 fixed fails**: dashboard-archive 4 + dashboard-subscriber-table 3), and `pnpm build` (after deleting `.next`) shall succeed. Prettier clean.
- AC3: PRD shall be amended: REQ-6.15.3 "above the email capture form" → position below the form/how-it-works; L170 + L182 consent checkbox rows → click-through sentence with provenance stamping retained; REQ-6.8.4 annotated with the W4 base64 deviation.
- AC4: Epic 12.2.6 story/epic ACs shall be annotated (checkbox → approved click-through line, W3) and MEMORY shall gain the Epic 18 block plus the W1 amendment to the preview-parity standing rule.
- AC5: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1) test suite additions/updates (targeted files in Dev Notes) · T2 (AC2) full gates · T3 (AC3) PRD amendments · T4 (AC4) Epic 12.2.6 + MEMORY sync · T5 (AC5) lint + build

**Out of scope:** New features, refactors beyond test/docs, Playwright e2e expansion, story status flips for other epics.

**Dev Notes:**

- **Likely test files:** `src/__tests__/components/` (renderer/preview/consent/step-1/settings — follow existing naming, e.g. `waitlist-template-content`, `email-capture-form`, `onboarding-plan-pro` patterns), `src/__tests__/api/subscribers*.test.ts` (consent 400 assertions inverted to success + stamping asserts).
- **Mock gotchas (MEMORY):** `vi.clearAllMocks()` doesn't clear once-queues; Supabase `.select(stringVar)` widens to `GenericStringError[]` — use const template-literal column strings; test bodies need `ts: Date.now()-5000` (timing gate) and now **no** `consent: true`.
- **Baseline discipline:** re-run full suite before concluding regression (flaky under load; 7 fixed fails are the exact baseline).
- Doc files: `docs/PRD.md`, `docs/epics/epic-12.2-gap-fixes.md` (+ `docs/stories/completed/story-12.2.6-*` if present), `.memory/MEMORY.md`, this epic's status flip to `done` on completion.
