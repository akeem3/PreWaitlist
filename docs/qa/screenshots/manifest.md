# Screenshot Manifest — Story 21.2 Core Set

**Captured:** 2026-10-12 · **Script:** `tests/e2e/capture-screenshots.spec.ts` · **Total NN set:** 21 files / 0.90 MB

Naming: `NN-page-state-viewport.png`. Desktop = 1280×800, Mobile = 375×667. All shots `scale: "css"`, animations disabled, caret hidden. Inventory IDs reference `docs/qa/app-inventory.md` §1.

## Core set (NN-*)

| #   | Filename                                | Page                                          | State                                 | Viewport | Full page | Inventory ID |
| --- | --------------------------------------- | --------------------------------------------- | ------------------------------------- | -------- | --------- | ------------ |
| 01  | `01-marketing-home-desktop.png`         | Marketing homepage                            | Cold visitor                          | desktop  | yes       | 28           |
| 02  | `02-waitlist-populated-desktop.png`     | Public waitlist (`quality`, Minimal template) | Populated, free tier                  | desktop  | yes       | 29           |
| 03  | `03-leaderboard-public-desktop.png`     | Public leaderboard (`quality`)                | Populated                             | desktop  | yes       | 31           |
| 04  | `04-gone-archived-desktop.png`          | Gone / archived notice (`quality/gone`)       | Archived guard                        | desktop  | no        | guard        |
| 05  | `05-waitlist-dark-template-desktop.png` | Public waitlist (`p`, Dark template)          | Populated, alt template               | desktop  | yes       | 29           |
| 06  | `06-signup-desktop.png`                 | Signup                                        | Anonymous                             | desktop  | no        | 9            |
| 07  | `07-onboarding-1-desktop.png`           | Onboarding Step 1                             | Phase A draft (localStorage)          | desktop  | no        | 1            |
| 08  | `08-onboarding-3-desktop.png`           | Onboarding Step 3                             | Phase A draft (localStorage)          | desktop  | no        | 3            |
| 09  | `09-waitlist-populated-mobile.png`      | Public waitlist (`quality`)                   | Populated                             | mobile   | yes       | 29           |
| 10  | `10-leaderboard-public-mobile.png`      | Public leaderboard (`quality`)                | Populated                             | mobile   | yes       | 31           |
| 11  | `11-gone-archived-mobile.png`           | Gone / archived notice                        | Archived guard                        | mobile   | no        | guard        |
| 12  | `12-thank-you-desktop.png`              | Thank-you (`qa-mobile`, seeded ids)           | Referred variant                      | desktop  | no        | 30           |
| 13  | `13-dashboard-home-free-desktop.png`    | Dashboard overview                            | Populated, free tier                  | desktop  | no        | 15           |
| 14  | `14-dashboard-leaderboard-desktop.png`  | Dashboard leaderboard                         | Populated                             | desktop  | no        | 16           |
| 15  | `15-dashboard-warmth-free-desktop.png`  | Dashboard warmth                              | Free (locked state)                   | desktop  | no        | 18           |
| 16  | `16-settings-hub-desktop.png`           | Settings hub                                  | Free tier                             | desktop  | no        | 22           |
| 17  | `17-thank-you-mobile.png`               | Thank-you (`qa-mobile`)                       | Referred variant                      | mobile   | no        | 30           |
| 18  | `18-onboarding-5-desktop.png`           | Onboarding Step 5                             | Phase B, pro tier (guard bypass)      | desktop  | no        | 6            |
| 19  | `19-onboarding-success-desktop.png`     | Onboarding success                            | Phase B, pro tier                     | desktop  | no        | 7            |
| 20  | `20-dashboard-home-pro-desktop.png`     | Dashboard overview                            | Populated, pro tier (warmth unlocked) | desktop  | no        | 15           |
| 21  | `21-dashboard-empty-desktop.png`        | Dashboard overview (`qa-empty`)               | Zero subscribers, empty state         | desktop  | no        | 15           |

## Seed / data prerequisites

| Asset                | Source                                           | Notes                                               |
| -------------------- | ------------------------------------------------ | --------------------------------------------------- |
| `quality.lvh.me`     | Live DB row (Minimal template, populated)        | Public — no auth needed                             |
| `p.lvh.me`           | Live DB row (Dark template)                      | Public — alt-template shot                          |
| `qa-mobile` waitlist | Script creates/finds under QA account            | 5 seeded subscribers `qa-capture-{1-5}@example.com` |
| `qa-empty` waitlist  | Script creates under pro flip                    | 0 subscribers — empty-dashboard shot                |
| Thank-you ids        | First seeded subscriber's `id` + `referral_code` | From POST /api/subscribers response                 |
| Tier flips           | Supabase REST PATCH on `founder_profiles`        | pro mid-run; restored to free at end                |

## Not in the core set (see 19.5 evidence)

The 19.5 mobile-audit set (`19.5-*.png`, 62 files / 1.64 MB) covers 31 screens × 2 viewports (375 + 768) with full geometry findings. Screens deliberately left out of this ~21-shot core set (auth pages like signin/verify-email, onboarding 2/4/4a, subscriber detail, billing, waitlist-detail settings, dashboard updates/broadcast) are already captured there. 21.5 may cite either set.

## Capture environment

- Playwright chromium, `pnpm build && pnpm start` prod server
- `lvh.me` wildcard → 127.0.0.1
- QA credentials: `tests/e2e/.auth/qa-credentials.json`
- Re-run: `npx playwright test tests/e2e/capture-screenshots.spec.ts --reporter=list` (idempotent filenames; seed tolerant of dups; tier restored to free)
