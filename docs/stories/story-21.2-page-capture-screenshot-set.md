# Story 21.2 — Page Capture (Core Screenshot Set)

**Status:** ready
**Epic:** 21 — Full App Scan & Test Case Suite
**Depends on:** 21.1
**Design Refs:** - (no new UI; captures = live-app screenshots of existing screens, not SVG)
**Source:** [Epic 21 Story 21.2](../epics/epic-21-full-app-scan-test-case-suite.md)

## Story

As the QA author, I want ~20 representative screenshots so that test cases can reference expected visual states and the founder can eyeball pages without booting the app.

## Acceptance Criteria (EARS)

- AC1: A Playwright capture script shall exist (`tests/e2e/capture-screenshots.spec.ts` or `scripts/capture.ts`) that seeds/uses known data and captures the core set to `docs/qa/screenshots/`.
- AC2: Core set scope (~20 shots, founder decision 2026-10-04): each unique page once in its most representative state (populated waitlist, signed-in dashboard), plus mobile-viewport captures for all public pages (waitlist page, thank-you, leaderboard, gone), plus state-differentiated shots where behavior diverges (free vs pro dashboard, one alternate template, empty dashboard).
- AC3: A manifest `docs/qa/screenshots/manifest.md` shall map filename → page → state → viewport → inventory ID (from 21.1).
- AC4: Screenshots shall be committed as PNGs at a reasonable size (target: whole set < 5 MB total; compress if needed).
- AC5: The capture script shall be re-runnable (idempotent filenames, deterministic seed).
- AC6: Lint and build shall pass.

## Tasks

- T1 (AC1, AC5) Capture script with seed data
- T2 (AC2) Execute core-set captures (desktop + mobile public pages)
- T3 (AC3) Manifest
- T4 (AC4) Size check
- T5 (AC6) Gates

## Out of Scope

- Visual regression testing (pixel diffs, Percy/Chromatic); capturing every state variant (core set only — founder decision); screenshots of emails (use rendered HTML preview if needed, noted in manifest).

## Dev Notes

- Playwright is configured (`playwright.config.ts`, `webServer: pnpm build && pnpm start`) but the three existing e2e specs (homepage, public-waitlist, thank-you-flow) need seed data — the capture script must document its data prerequisites (live DB rows: subdomains `quality`, `p`, `th`, `pr` exist per MEMORY; or seed script).
- Prior art: og:image verification used prod-mode probes; happy-dom can't screenshot — must use Playwright's real browser.
- Coordinate with 19.5 (mobile audit evidence) — capture doubles as audit evidence; 19.5 references these files rather than re-capturing.
- Naming: `NN-page-state-viewport.png` (e.g., `01-waitlist-populated-desktop.png`).
- Official Playwright screenshots-doc findings for the script (researched 2026-10-04): `page.screenshot({ path, fullPage: true })` for full-scroll pages (or viewport-only for dashboard shots — record the choice per row in the manifest); `scale: "css"` (not device DPR) keeps PNGs small and aids the AC4 <5 MB target; `page.mouse.move(-1, -1)` before capture so hover states don't vary between runs; note that `expect(page).toHaveScreenshot()` visual-regression diffing is a separate Playwright capability = deliberately out of scope per Out of scope.
- If Playwright webServer + seed proves too flaky for CI-style capture, fallback: manual capture via browser during founder QA session — record choice in manifest. Do not silently skip AC1.

## Files to Create/Modify

| File                                    | Change                                                 |
| --------------------------------------- | ------------------------------------------------------ |
| `tests/e2e/capture-screenshots.spec.ts` | New — capture script (or `scripts/capture.ts`) (T1)    |
| `docs/qa/screenshots/*.png`             | ~20 core-set PNGs (T2)                                 |
| `docs/qa/screenshots/manifest.md`       | New — filename → page → state → viewport → inv ID (T3) |

## Risk

- Seed-data dependence: Playwright `webServer` + live DB rows is the flakiest part — Dev Notes allow a manual-capture fallback, but AC1 must never be silently skipped; record whichever path is taken in the manifest.
- AC4 <5 MB budget for ~20 PNGs — use `scale: "css"` and fullPage selectively; a few bloated full-scroll dashboard shots can blow the budget alone.
- Manifest must key rows to 21.1 inventory IDs — capture without the inventory produces orphaned references that break 21.5's citation format.
- Coordinate with 19.5 or mobile shots get captured twice.
