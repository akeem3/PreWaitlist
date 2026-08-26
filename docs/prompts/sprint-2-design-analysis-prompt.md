# Sprint 2 Design Analysis Prompt

Copy-paste this into a new Claude conversation to analyze remaining Sprint 2 screens.

---

## Context

You are analyzing a pre-launch waitlist SaaS product (Next.js 16 + Supabase) to determine what screens still need to be designed and built for Sprint 2.

## Files to Read (in this order)

1. `docs/epics/sprint-1-summary.md` — what was built in Sprint 1
2. `docs/product-vision-mvp-waitlist-tool.md` — full product vision, especially the **Sprint 2 section** (lines 331-363)
3. `docs/epics/epic-4-onboarding-wizard.md` — onboarding architecture and design patterns
4. `docs/epics/epic-5-dashboard-store-features.md` — current dashboard placeholder
5. `docs/epics/epic-6-post-sprint-1-issues.md` — post-Sprint-1 fixes including Hopkins' sampling
6. `.memory/MEMORY.md` — architecture decisions, component inventory, standing constraints
7. `src/app/(public)/[subdomain]/page.tsx` — current public page placeholder (if it exists)

## What Sprint 2 Must Deliver (from Product Vision MVP)

Sprint 2 screens that need wireframes + high-fidelity design:

| Screen                                    | Node     | Description                                               |
| ----------------------------------------- | -------- | --------------------------------------------------------- |
| Public waitlist page                      | S-B1     | Subscriber-facing page at `{slug}.prewaitlist.com`        |
| Qualification questions (subscriber view) | S-B2a    | Post-email-capture question display                       |
| Thank-you page — direct signup            | S-B4a    | Position, referral link, milestone rewards, share buttons |
| Thank-you page — referred signup          | S-B4b    | Acknowledges referrer, same milestone display             |
| Duplicate email message                   | S-B3-DUP | When subscriber tries to sign up twice                    |
| Dashboard — active state                  | F-G2     | Full panels with real subscriber data                     |

## Task

Analyze the codebase and product spec, then produce:

### 1. Screen-by-Screen Gap Analysis

For each Sprint 2 screen, identify:

- What already exists in code (routes, components, API endpoints)
- What needs to be built new
- What existing components can be reused
- Any design dependencies or blockers

### 2. Database Tables Needed

The `subscribers` table doesn't exist yet. Identify all new tables Sprint 2 needs:

- `subscribers` — what columns?
- `referrals` — referral link tracking
- `positions` — position tracking
- Any other tables needed

### 3. API Routes Needed

List all new API routes Sprint 2 requires:

- Subscriber signup endpoint
- Position calculation
- Referral link generation
- Leaderboard data
- etc.

### 4. Component Reuse Map

For each new screen, map which existing components (Button, Card, Input, ShareCopyLink, LivePreview, etc.) can be reused and what new components are needed.

### 5. Remaining Design Screens

List every screen that needs a new high-fidelity design (SVG or equivalent), noting which already have HF SVGs in `docs/design/High-fidelity-svgs/` and which need to be created from scratch.

### 6. Blocking Questions

Any open questions about Sprint 2 scope that need founder input before design begins.

## Output Format

Return a structured markdown document with the 6 sections above, ready to be saved as `docs/epics/sprint-2-design-analysis.md`.
