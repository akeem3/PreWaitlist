# AGENTS.md

> **Before doing any work: check the shortcuts table below and use the appropriate shortcut command.**
> **Never skip this step. Never improvise a workflow when a shortcut exists.**

Pre-launch waitlist SaaS. Solo founder project. Full spec lives in `docs/PRD.md` — read the specific section you need via the current story's `Source` link, don't re-read the whole PRD by default.

## Prompt Shortcuts

Type these in chat to run prompts instantly:

| Shortcut          | Runs      | Description                                     |
| ----------------- | --------- | ----------------------------------------------- |
| `scan [story]`    | Prompt #1 | Scan story, research, generate task list        |
| `execute [story]` | Prompt #2 | Execute tasks systematically with quality gates |
| `audit [story]`   | Prompt #3 | Independent post-implementation audit           |
| `epic-check`      | Prompt #4 | Final release audit of entire epic              |
| `create-epic [N]` | Prompt #5 | Create structured epic document                 |
| `align-epic [N]`  | Prompt #6 | Verify epic matches implementation              |
| `analyze [N.S]`   | Prompt #7 | Screen-by-screen design analysis                |
| `commit-push`     | —         | Stage, commit with auto-message, push           |
| `merge-clean`     | —         | Merge epic→dev, resolve conflicts, lint+test    |

**Examples:**

- `scan 2.1` → I run Prompt #1 on Story 2.1
- `execute` → I run Prompt #2 on the current story
- `audit 2.3` → I run Prompt #3 on Story 2.3
- `create-epic 3` → I run Prompt #5 to create Epic 3
- `align-epic 2` → I run Prompt #6 on Epic 2
- `analyze 4.1` → I run Prompt #7 on Onboarding Step 1
- `analyze 4` → I run Prompt #7 on all Epic 4 screens

Full prompt text: `docs/PROMPTS.md`

## Commands

```
pnpm dev          # start local dev server (Turbopack)
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm build        # production build
```

Local subdomains: use `*.lvh.me:3000` (e.g. `acme.lvh.me:3000`) — resolves to localhost automatically, no `/etc/hosts` edits.

## Boundaries

**Always do**

- Read `docs/stories/<current-story>.md` before starting work on it; follow its Acceptance Criteria exactly.
- Enforce Row-Level Security on every Supabase table — see `docs/PRD.md#74-data-model--implementation-grade`.
- Use `proxy.ts`, never recreate `middleware.ts`.
- Use the shared `components/share/share-copy-link.tsx` component anywhere sharing appears — never a one-off implementation.
- Render the "Powered by PreWaitlist" footer (spec in PRD REQ-onboarding-preview.5) in the onboarding live-preview whenever tier = Free, and build it as a shared component reusable by Sprint 2's real public page — not duplicated per screen.

**Ask first**

- Anything touching pricing, tier limits, or a "Standing Product Decision" in `docs/PRD.md#5-standing-product-decisions-do-not-relitigate`.
- Anything that would require reopening a decision already marked resolved in `docs/PRD.md#9-open-items--resolutions`.
- Adding any new environment variable, dependency, or third-party account not already named in the current story.

**Never do**

- Never write or rephrase user-facing copy. All Sprint 1 copy has already been through review. A copy gap is a stop-and-ask, not a fill-in-the-blank.
- Never build real SPF/DKIM domain-verification logic in Sprint 1 — `docs/PRD.md#611-onboarding-step-5--email-setup-f-c5` (REQ-6.11.3) — UI only, stub the backend.
- Never introduce a new accent color, drop shadow, or gradient outside what's defined in Design System v2.0's Tailwind tokens.
- Never commit `.env*` files or any secret.
- Never silently retry a story whose frontmatter `status` is `blocked`.
- Never add a "Powered by PreWaitlist" badge to PreWaitlist's own marketing site or app pages — it is exclusive to founders' public waitlist pages, gated to Free tier.
- Never use inline styles (`style={{ ... }}`). Use Tailwind utility classes and design system tokens from `src/app/globals.css` exclusively. All colors must reference CSS custom properties (`--color-*`), never hardcoded hex values.
- Never introduce a new accent color, drop shadow, or gradient outside what's defined in Design System v2.0's Tailwind tokens.

## Design System Token Enforcement

**Source of truth:** `src/app/globals.css` — all colors, typography, spacing, and component tokens.

**Colors:**

- All colors must reference CSS custom properties (`--color-*`) via Tailwind utility classes (e.g., `bg-background`, `text-foreground`, `border-border`).
- Never use hardcoded hex values (`#FAF8F4`, `#0F7A5E`, etc.) in component code.
- Map design spec hex values to the closest available token — see `docs/PRD.md` color mapping table.

**Typography:**

- Use typography presets from `globals.css` (`.text-display`, `.text-h1` through `.text-h4`, `.text-body*`, `.text-caption`, etc.).
- Never use arbitrary font-size values like `text-[14px]` or `text-[var(--text-sm)]`.
- Font sizes are defined as `--text-*` tokens but must be applied via Tailwind's built-in `text-xs`, `text-sm`, etc. classes.

**Spacing & Layout:**

- Use the 8px grid system (multiples of 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64).
- Component tokens (button, input, card, badge, toggle, select) are defined in `globals.css` — reference via `var()`.

**Enforcement:**

- Run `pnpm lint` before committing any UI changes.
- Review all new components for token compliance during code review.
- If a design spec value doesn't map to an existing token, flag it — don't invent a new one.

## Project Structure

```
docs/
  PRD.md                  product spec, cite by section, don't restate
  epics/epic-0-...md      index only — goal + story table + links
  stories/epicN.storyNN-*.md   one file per unit of work, load one at a time
  design/High-fidelity-svgs/   Sprint 1 SVGs
  design/High-fidelity-Sprint2/ Sprint 2 SVGs
  planning-docs/          user flow, JTBD, user profile
.memory/
  MEMORY.md               durable "why" — architecture decisions, corrected assumptions
  YYYY-MM-DD.md           daily auto-logs, searchable via memsearch
app/                      Next.js App Router — see PRD S7.6 for the full tree
components/ui/            design-system primitives
Agent-Workflow-Memory-Guidelines.md   how sessions, memory, and review are meant to work
```

For anything not covered above, check the current story's `Source` link before asking or guessing.
