# AGENTS.md

> **CRITICAL: When the user types a shortcut command, you MUST load `docs/PROMPTS.md` and execute the corresponding prompt in full — not a manual interpretation, not a partial version. No exceptions.**

Pre-launch waitlist SaaS. Solo founder project. Full spec: `docs/PRD.md`.

## Prompt Shortcuts

| Shortcut          | Action                                       |
| ----------------- | -------------------------------------------- |
| `scan [story]`    | Load `docs/PROMPTS.md` → Execute Prompt #1   |
| `execute [story]` | Load `docs/PROMPTS.md` → Execute Prompt #2   |
| `audit [story]`   | Load `docs/PROMPTS.md` → Execute Prompt #3   |
| `epic-check`      | Load `docs/PROMPTS.md` → Execute Prompt #4   |
| `create-epic [N]` | Load `docs/PROMPTS.md` → Execute Prompt #5   |
| `align-epic [N]`  | Load `docs/PROMPTS.md` → Execute Prompt #6   |
| `analyze [N.S]`   | Load `docs/PROMPTS.md` → Execute Prompt #7   |
| `commit-push`     | Stage, commit with auto-message, push        |
| `merge-clean`     | Merge epic→dev, resolve conflicts, lint+test |

## Commands

```
pnpm dev          # start local dev server (Turbopack)
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm build        # production build
```

Local subdomains: use `*.lvh.me:3000` (e.g. `acme.lvh.me:3000`).

## Boundaries

**Always do**

- Read `docs/stories/<current-story>.md` before starting work; follow its ACs exactly.
- Enforce RLS on every Supabase table — see `docs/PRD.md#74-data-model--implementation-grade`.
- Use the shared `components/share/share-copy-link.tsx` for sharing — never a one-off.
- Render "Powered by PreWaitlist" footer in onboarding preview when tier = Free.

**Ask first**

- Pricing, tier limits, or "Standing Product Decisions" in `docs/PRD.md#5-standing-product-decisions-do-not-relitigate`.
- Reopening resolved decisions in `docs/PRD.md#9-open-items--resolutions`.
- New environment variables, dependencies, or third-party accounts not in the current story.

**Never do**

- Never write or rephrase user-facing copy — a copy gap is a stop-and-ask.
- Never commit `.env*` files or any secret.
- Never use inline styles — use Tailwind utility classes and design system tokens from `src/app/globals.css`.
- Never introduce colors, shadows, or gradients outside Design System v2.0 tokens.

## Design System

**Source of truth:** `src/app/globals.css`

- Colors: CSS custom properties (`--color-*`) via Tailwind classes. No hardcoded hex.
- Typography: presets from `globals.css` (`.text-display`, `.text-h1`–`.text-h4`, `.text-body*`, `.text-caption`).
- Spacing: 8px grid (multiples of 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64).
- Run `pnpm lint` before committing UI changes.

## Project Structure

```
docs/
  PRD.md                           product spec
  epics/epic-0-...md               epic index
  stories/epicN.storyNN-*.md       one file per unit of work
  design/High-fidelity-svgs/       Sprint 1 SVGs
  design/High-fidelity-Sprint2/    Sprint 2 SVGs
.memory/
  MEMORY.md                        durable "why" — architecture decisions
  YYYY-MM-DD.md                    daily auto-logs
app/                               Next.js App Router
components/ui/                     design-system primitives
```

For anything not covered, check the current story's `Source` link before asking.
