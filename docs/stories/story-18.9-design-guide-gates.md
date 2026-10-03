# Story 18.9 — Design guide, template pass & extension gates

**Status:** done
**Epic:** 18 — Live Waitlist Page Redesign (extension: visual redesign)
**Depends on:** 18.6, 18.7, 18.8
**Design Refs:** `docs/design/waitlist-page-design-guide.md` (binding spec) · `docs/epic-18-visual-redesign-plan.md` (phases/gates/D1–D6)
**Source:** [Epic 18 Story 18.9](../epics/epic-18-live-waitlist-page-redesign.md), [plan Phase 0/4/5](../epic-18-visual-redesign-plan.md)

## Story

As the founder, I want one binding design spec, an end-to-end template verification, and full quality gates — so the redesign is provably conformant and regressions stay locked.

## Acceptance Criteria (EARS)

- AC1: The design guide shall exist as the epic's binding design source covering: principles, page anatomy, top-left lockup, type ladder, hero, form spec, section designs, spacing rhythm, template character map, responsive rules, fit algorithm, copy gate, accessibility, and an acceptance checklist — amended for the round-2 directives (screen top-left brand, `text-5xl/6xl` headline, medium subheadline, in-field questions, trust/consent order swap, dark `bg-dark-template-input` qualifier surface, preview vs live padding splits).
- AC2: All three templates (minimal/bold/dark) shall be verified end-to-end against guide §6/§9 — borders, backgrounds, radius tokens, dark utility classes — with **zero hardcoded hex** and inline styles limited to the sanctioned runtime exceptions (dynamic brand color, fit metrics). Deviations found during the pass shall be fixed and locked by tests (preview frame `bg-background`, how-it-works `pt-8`/`pt-6`, CTA `font-semibold` on all templates, preview footer `standalone`, conditional brand wrapper, headline `max-w-xl`/`text-balance`).
- AC3: Regression tests shall cover renderer conformance (§4/§5/§7.1), form conformance (in-field, surfaces, order, weight), preview conformance (frame bg, footer, brand, textSize), and the fit algorithm — alongside the existing 18.5 suites, all green.
- AC4: Gates shall pass: `pnpm lint` 0 errors (5 pre-existing warnings), `pnpm format:check` clean, full `pnpm test:run` at exactly the sanctioned baseline (**7 failures = dashboard-archive 4 + dashboard-subscriber-table 3**) with all other tests passing, and a clean `pnpm build` after deleting `.next` (Proxy/Middleware present).
- AC5: Documentation shall be synchronized: this epic's Story Index + 18.0 amendment notes, story files 18.6–18.9, plan status, and the MEMORY Epic 18 block (round-2 directives + extension stories + gates).
- AC6: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) guide amendments for round-2
- T2 (AC2) template pass + deviation fixes
- T3 (AC3) conformance test additions
- T4 (AC4) full gates
- T5 (AC5) epic/story/plan/MEMORY sync
- T6 (AC6) lint + build

## Out of Scope

- New feature work, copy changes (W8), SQL, Playwright e2e expansion
- Committing — founder runs `commit-push` for the whole epic (plan D5)

## Dev Notes

### T1 — guide amendments (AC1)

Sections amended for round-2 (guide is source of truth; tests assert its class strings):

| Section | Amendment                                                                                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| §3      | Screen top-left lockup; `WaitlistBrand` sizes (36/28px, bold wordmark), conditional header rule                                                                    |
| §4      | Type ladder round-2 rows: headline `text-5xl/6xl extrabold`, subheadline `text-lg/600`, section label `font-semibold`, in-field question + `(optional)` badge rows |
| §5      | Hero: `max-w-xl text-balance`, live/preview scale split                                                                                                            |
| §6      | Form order swap (trust → button → consent), in-field question spec, dark `bg-dark-template-input` surface, CTA `font-semibold`                                     |
| §7.1/§8 | How-it-works `pt-8`/`pt-6` split; root rhythm rows (`space-y-8 pt-6 pb-8` live / `space-y-5 pt-4 pb-6` preview / `space-y-3` compact)                              |
| §10     | Responsive headline `sm:text-6xl`                                                                                                                                  |
| §13     | Real `<label for>` + `aria-label` model (no placeholder-as-label)                                                                                                  |
| §14     | Acceptance checklist rewritten for round-2; gate line = full suite at sanctioned baseline                                                                          |

### T2 — template pass (AC2)

- Verified character map §9 against renderer/shell/form/preview for minimal, bold, dark: borders (`border-border` / `border-2 border-foreground` / `border-dark-template-border`), surfaces (`bg-card` / `bg-muted` / `bg-dark-template-input`), radius tokens, text colors.
- **Hex/inline-style scan:** grep for `#` hex literals and `style={{` in the touched files — only sanctioned hits remain (`backgroundColor: brandColor` cast to `--brand-color`, fit `scale`/`height`).
- Deviations found and fixed (7, locked by tests): frame `bg-background`; how-it-works `pt-8`/`pt-6`; CTA `font-semibold` ×3; preview in-field `textSize`; preview brand `pt-6` wrapper; headline `max-w-xl`/`text-balance`; preview footer `standalone`.

### T3 — conformance tests (AC3)

- Renderer: +3 (`waitlist-template-content.test.tsx`).
- Form: +6–7 (`email-capture-form.test.tsx`).
- Preview parity: +7 (`live-preview-parity.test.tsx`).
- Fit: existing 4 green + updates.
- Targeted run before full suite: those 5 files (recorded: 80/80 at Phase-4 close).

### T4 — gates (AC4)

```bash
pnpm lint                     # 0 errors; 5 pre-existing warnings accepted
pnpm format; pnpm format:check
pnpm test:run                 # exactly 7 fixed fails (dashboard-archive 4 + dashboard-subscriber-table 3); re-run if noisy
rm -r -fo .next; pnpm build   # clean build; confirm Proxy (Middleware) line
```

- Baseline discipline (MEMORY): full-suite runs are flaky under load — re-run before concluding a regression; never rebaseline silently.

### T5 — docs sync (AC5)

- Epic: Story Index rows 18.6–18.9 → `done` (done as authored), 18.0 AC3/AC5/Dev-Notes amendment notes, design-source rows, execution-order paragraph.
- Story files 18.6–18.9 (this file + 3).
- Plan `docs/epic-18-visual-redesign-plan.md`: Status `active` → phase completion note.
- MEMORY: Epic 18 block extended — round-2 directives, 18.6–18.9 rows, Phase-4 deviation list, gate numbers, test gotchas (exact `pt-6` selector, peer-order, happy-dom ResizeObserver).

## Files to Create/Modify

| File                                                | Change                                    |
| --------------------------------------------------- | ----------------------------------------- |
| `docs/design/waitlist-page-design-guide.md`         | Round-2 amendments (T1)                   |
| `docs/epics/epic-18-live-waitlist-page-redesign.md` | Index + 18.0 annotations + 18.6–18.9 (T5) |
| `docs/stories/story-18.6-*.md` … `story-18.9-*.md`  | New story files (T5)                      |
| `docs/epic-18-visual-redesign-plan.md`              | Status note (T5)                          |
| `.memory/MEMORY.md`                                 | Epic 18 block extension (T5)              |

## Risk

- **Gate numbers drift as tests land** — AC4 pins the _failures_ (7, exact files) as the invariant; pass counts are recorded at gate time, not hard-coded into ACs.
- **Prettier reformats markdown** — run `pnpm format` after writing docs, then `format:check`, so the pre-commit hook won't surprise the founder at `commit-push`.
- **Do not touch code in T5** — docs-only; any code change here invalidates the gate run and forces a re-run.
