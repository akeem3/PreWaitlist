# Product Hunt Launch Prep — PreWaitlist

**Story:** 20.5 (Epic 20) · **Status:** ready for founder use · **Type:** prep document — checklist + asset inventory + launch-day runbook
**Scope:** preparation only. Actual PH submission, listing copy authorship, ads/spend, and HN/Reddit copy are founder-owned (out of scope per story).

> **COPY GATE (AC2):** The tagline, description, and first comment below are **founder-authored placeholder slots**. This document deliberately contains **no drafted public listing copy** — only field specs, platform constraints, and structural guidance. Slots are marked `[FOUNDER-AUTHORED — TO WRITE]`.

---

## 1. Pre-launch verification gates (AC3)

Run these checks **before** submitting. Each is a cross-link, not a completed prerequisite at write time — 21.8 runs after this story in calendar order and is the final go/no-go.

| #   | Verification                                           | Cross-link                                                                                                                                   | State at write time (2026-10-07)                                                                                        |
| --- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | Epic 19 audits closed                                  | [`docs/epics/epic-19-product-fixes-polish.md`](../epics/epic-19-product-fixes-polish.md)                                                     | ✅ 8/8 stories done, merged to `main`                                                                                   |
| 2   | Epic 21.8 launch verification passed                   | [`docs/epics/epic-21-full-app-scan-test-case-suite.md`](../epics/epic-21-full-app-scan-test-case-suite.md) (Story 21.8)                      | ⬜ Ready — **hard gate: must pass before submission** (Sprint 4 exit: vision `:442` walk + final gates + go/no-go)      |
| 3   | Pricing page current                                   | [`components/marketing/pricing-section.tsx`](../../components/marketing/pricing-section.tsx) → live at `prewaitlist.com` homepage `#pricing` | Verify live: Free + Pro cards render, prices correct (no Growth tier — see §5)                                          |
| 4   | Legal pages live                                       | [`/legal/privacy`](../../src/app/legal/privacy/page.tsx), [`/legal/terms`](../../src/app/legal/terms/page.tsx)                               | Verify live on production: `prewaitlist.com/legal/privacy`, `/legal/terms` (PH reviewers + launch assets require these) |
| 5   | Public waitlist + thank-you flow working on production | Vision exit condition (21.8 AC1)                                                                                                             | Covered by gate 2                                                                                                       |
| 6   | og:image card renders (link unfurl check)              | Root + per-subdomain `opengraph-image` routes                                                                                                | Paste `prewaitlist.com` into a fresh X/LinkedIn composer to confirm the card before launch                              |

---

## 2. Listing content checklist (AC1 + AC2)

Submission runs from a **personal** PH account (company accounts are prohibited). Field specs from PH's official prep guide + community launch kit (accessed 2026-10-07).

| Field                             | Spec / constraint                                                                                                                                                                                                                                                                                                            | Owner       | Status                            |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------- |
| Product name                      | ≤ 40 chars — `PreWaitlist` (established brand name, factual)                                                                                                                                                                                                                                                                 | fixed       | ✅                                |
| Website URL                       | `https://www.prewaitlist.com/?utm_source=ph&utm_medium=launch&utm_campaign=<campaign>` — use the UTM convention in [`founder-marketing-links.md`](founder-marketing-links.md) §1 (`ph` is an approved source, `launch` an approved medium). Direct product links are allowed (no PH penalty).                                | founder     | ⬜                                |
| **Tagline**                       | **≤ 60 chars.** Plain language, says what the product does — no hype/emojis (PH guidance). Main driver of homepage clicks.                                                                                                                                                                                                   | **founder** | **[FOUNDER-AUTHORED — TO WRITE]** |
| **Description**                   | **≤ 500 chars.** Short, concise value proposition + features (PH guidance).                                                                                                                                                                                                                                                  | **founder** | **[FOUNDER-AUTHORED — TO WRITE]** |
| **First comment** (maker comment) | Posted the moment the launch goes live; first **800 chars** shown. 70% of Product-of-the-Day winners had a maker first comment. Tone: humble, helpful — bullet-point key features; marketing-speak doesn't resonate (PH guidance). Structure guidance only: why you built it → who it's for → what's next → invite feedback. | **founder** | **[FOUNDER-AUTHORED — TO WRITE]** |
| Thumbnail                         | 240×240 px, ≤ 2 MB (JPG/PNG/GIF). GIFs play on **hover** only — first frame must read standalone; no strobing/quick cuts (PH may edit).                                                                                                                                                                                      | founder     | ⬜ To produce (see §3)            |
| Gallery images                    | **2 required**, recommended **1270×760**; PH recommends 3+; first image = social preview when shared. Show the real product UI — no stock/marketing fluff.                                                                                                                                                                   | founder     | ⬜ From §3 inventory              |
| Demo video / GIF                  | Optional but strong: 30–90 s (YouTube/Loom embed or gallery GIF). Interactive demos (Arcade/Storylane/Supademo/Layerpath) are free for PH launches.                                                                                                                                                                          | founder     | ⬜ Optional                       |
| Topics / tags                     | Choose 1–2 best-fit topics at submission (PH tag picker).                                                                                                                                                                                                                                                                    | founder     | ⬜                                |
| Makers                            | Attach maker(s) — personal accounts.                                                                                                                                                                                                                                                                                         | founder     | ⬜                                |
| Shoutouts                         | Optional; ~3 tools you actually use (listed launches appear on those tools' pages).                                                                                                                                                                                                                                          | founder     | ⬜ Optional                       |
| X handle (product)                | Optional — product handle, not personal.                                                                                                                                                                                                                                                                                     | founder     | ⬜ Optional                       |
| Pricing field                     | Optional PH field — our pricing is public at the homepage §pricing (Free + Pro).                                                                                                                                                                                                                                             | founder     | ⬜                                |

**Platform rules that constrain the copy (do not violate):**

- **Never ask for upvotes.** The only promotion rule: ask people to _visit the launch and leave a comment/feedback_ — never the word "upvote", never incentivized/purchased votes, no upvote-swap groups (spam detection filters them and can delist the product).
- Comments must be genuine and human — PH bans AI-generated/mass "congrats!" comments (Commenting Guidelines, 2025). Reply substantively.

---

## 3. Asset inventory (AC1)

### Existing (in repo / generated by the app)

| Asset                                         | Source                                                                                                                    | PH use                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Logo (SVG)                                    | `public/PreWaitlist-logo.svg`, `public/main-logo.svg`, `public/just-logo.png`                                             | Thumbnail source (export 240×240 PNG)                             |
| Dynamic og:image cards                        | `src/app/opengraph-image.tsx` (root) + `(public)/[subdomain]/opengraph-image.tsx`                                         | Unfurl card check (§1 gate 6); gallery inspiration                |
| Product screenshots — 31 screens × 375/768 px | `docs/qa/screenshots/19.5-*` (dashboard, public waitlist minimal/bold/dark, leaderboard, thank-you, onboarding, settings) | Source set for gallery — re-export at **1270×760** desktop for PH |
| Design high-fidelity SVGs                     | `docs/design/High-fidelity-svgs/`, `docs/design/High-fidelity-Sprit2/`                                                    | Fallback gallery source if live captures lag                      |
| Core screenshot set (21.2)                    | `docs/epics/epic-21-full-app-scan-test-case-suite.md` Story 21.2 (status `ready`)                                         | **Future:** reuse these captures where suitable once 21.2 runs    |
| Legal + pricing pages                         | `/legal/privacy`, `/legal/terms`, homepage `#pricing`                                                                     | Linked from listing/site (completeness)                           |

### To create (founder — nothing in repo yet)

| Asset                            | Spec                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------- |
| Thumbnail export                 | 240×240 PNG, ≤ 2 MB, readable at small size                                      |
| Gallery set (3–5 images)         | 1270×760, first image = strongest single screen                                  |
| Demo GIF/video (optional)        | 30–90 s; if GIF: first frame is the thumbnail                                    |
| Founder photo + PH maker profile | Recommended; age/complete the profile before launch day (guide: 30+ days if new) |
| Warm supporter list              | 10–20 people who will genuinely visit + comment (ask wording: §4)                |

---

## 4. Launch-day runbook (AC1)

### Timing

- **Day of week:** Tuesday–Thursday preferred; avoid US holidays and major tech-keynote days (they drown the leaderboard).
- **Go-live:** launches appear from **12:01 AM Pacific** — the whole day runs on PT. Verify your timezone math for local-hour blocking (e.g., UTC+2 → 09:01 local).
- **Duration:** the ranking window is ~24 hours from 00:01 PT.

### T-minus schedule

| When      | Action                                                                                                          |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| T-14 days | Draft launch narrative (problem → solution → proof) for founder copy slots; start warm-supporter list           |
| T-7 days  | Confirm §1 gates 1–4; export launch kit (§3); complete maker profile                                            |
| T-3 days  | Finalize listing fields (§2) in PH draft; pre-write first comment; verify thumbnail/gallery render              |
| T-1 day   | Notify your own list/time zone **only if you have one**; schedule X + LinkedIn posts; double-check go-live time |
| 00:01 PT  | Launch goes live → **post the first comment immediately**                                                       |

### First 6 hours (reply cadence — engagement drives ranking)

- **Hour 0:** post maker/first comment; personally welcome + reply to **every** comment (target < 1 h response; comment depth counts since PH's 2024 algorithm change — specific multi-sentence replies beat one-liners).
- **Hour 0–2:** share direct launch link on X and LinkedIn with one concrete benefit; reply to those threads too.
- **Hours 1–6:** stay on the page; engage genuinely with the other launches that day (upvote/comment where honest — community norm); answer questions, thank feedback, no marketing-speak.
- **Hourly:** log signups + top referrers (PreWaitlist dashboard `/dashboard/leaderboard` + stats serve as the sheet); screenshot ranking/milestones for a follow-up post.

### Supporter ask ("badge ask" — compliant wording)

- **The ask:** "Check out our launch on Product Hunt and leave feedback" + direct link. Their vote is their choice once they're there.
- **Never:** the word "upvote", vote incentives, purchased/swapped votes, or messaging strangers. Explicit solicitation gets votes discounted or the launch delisted.
- Channels that work: your email list (best), communities where you have genuine history (1–2, not drive-by spam), warmed personal accounts.
- "Badge" context: a top-5 / featured finish is the recognition flag — quiet-weekend fields run ~50–100 genuinely activated people for a featured finish; busy midweek needs several hundred. Aim for real comments; comments now weigh alongside upvotes.

### Rules recap (launch-day red lines)

1. No direct upvote asks (visit + comment only).
2. No AI-generated or mass generic comments (yours and on other launches).
3. Personal account only; don't launch twice without a substantive new version.
4. Landing page must match the PH copy and its primary CTA must work — our conversion path is the **waitlist signup form**, so pre-flight it on production (§1 gate 2 covers this).

### After the launch

- The PH page is permanent — keep replying for several days; it becomes an ongoing channel.
- Optional: add the "Featured on Product Hunt" badge to the site after launch (founder decision; not required by any AC).
- Screenshot achievements → follow-up post next day; directory/backlink sweep is out of scope here.

---

## 5. Standing decisions (AC4)

- **Growth tier excluded from MVP** (Standing Decision, `docs/PRD.md` §5 — decision date 2026-09-05): only **Free** and **Pro** tiers exist. **No Growth-tier mentions** in any launch material — listing copy, gallery, screenshots, description, first comment, or follow-up posts. The pricing section currently renders Free + Pro only (verified: zero Growth references in `pricing-section.tsx`, 2026-10-07); re-verify at §1 gate 3.
- Copy gate: everything public-facing in §2 stays founder-authored (AC2) — this document never drafts it.

---

## Sources (researched 2026-10-07)

- PH official: [Preparing for your launch](https://www.producthunt.com/launch/preparing-for-launch) (field specs, first-comment stat, gallery sizes) · [Launch guide](https://www.producthunt.com/launch) (no-upvote-ask rule, personal accounts) · [Launch questions](https://www.producthunt.com/launch/launch-day-questions) (leaderboard mechanics) · [Commenting guidelines](https://help.producthunt.com/en/articles/10030102-commenting-guidelines)
- Community 2026 guides: awesome-product-hunt launch kit (field limits) · smollaunch 2026 (Tue–Thu, 12:01 PT, pre-launch QA) · makerhunt.io playbook (launch kit contents, T-minus schedule) · PH LaunchKit (compliant supporter-ask wording, comment-depth ranking)
