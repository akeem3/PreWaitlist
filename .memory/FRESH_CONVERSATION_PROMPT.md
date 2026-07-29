# Fresh Conversation Prompt

Copy-paste this into a new opencode conversation to resume work:

---

Read `.memory/MEMORY.md` and `docs/AGENTS.md` for full project context. This is a pre-launch waitlist SaaS (Next.js 16 + Supabase). The project path is `C:\Users\User\Work Projects\Product US\wait-app`.

## Current State

- **Epic 0:** All 12 stories done
- **Epic 1:** Stories 1.0, 1.1, 1.3, 1.4, 1.5, 1.6 done. Story 1.2 (Toggle, Select, Textarea) is scanned with tasks populated but NOT implemented.
- **Tests:** 49 passing across 5 test files (Vitest + happy-dom + RTL)
- **Lint/Build:** Both clean

## What To Do Next

1. **Implement Story 1.2** (Toggle, Select, Textarea) — check `docs/epics/epic-1-design-system-layout-shell.md` for the story spec and tasks
2. **Run Prompt #4 (Follow-Up Audit)** from `docs/PROMPTS.md` on completed Stories 1.3–1.6
3. Then proceed to Epic 2+

## Key Conventions

- Components live at `components/` (not `src/components/`)
- Use `components/lib/cn.ts` for className merging
- Component tokens use `var()` arbitrary values: `rounded-[var(--button-radius)]`
- Font-size uses `text-[length:var(...)]` type hint
- Never introduce colors/shadows outside Design System v2.0 tokens in `src/app/globals.css`
- Run `pnpm lint` and `pnpm build` after every change
- Run `pnpm test:run` after test changes
- All Sprint 1 copy is reviewed — never write/rephrase user-facing text
- Logo file: `public/MyWaitlist Offical logo.png` (typo is in the original filename)
- Brand color: `#0f7a5e` (accent), `#0d6b52` (accent-hover)

---
