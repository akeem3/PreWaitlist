# AGENTS.md

Pre-launch waitlist SaaS. Solo founder project. Full spec lives in `docs/PRD-Sprint1.md` — read the specific section you need via the current story's `Source` link, don't re-read the whole PRD by default.

## Prompt Shortcuts

Type these in chat to run prompts instantly:

| Shortcut          | Runs      | Description                                       |
| ----------------- | --------- | ------------------------------------------------- |
| `scan [story]`    | Prompt #1 | Scan story, research, generate task list          |
| `execute [story]` | Prompt #2 | Execute tasks systematically with quality gates   |
| `audit [story]`   | Prompt #3 | Independent post-implementation audit             |
| `epic-check`      | Prompt #4 | Final release audit of entire epic                |
| `create-epic [N]` | Prompt #5 | Create structured epic document                   |
| `align-epic [N]`  | Prompt #6 | Verify epic matches implementation                |
| `commit-push`     | —         | Stage, commit with auto-message, push             |
| `merge-clean`     | —         | Merge epic→dev→main, resolve conflicts, lint+test |

**Examples:**

- `scan 2.1` → I run Prompt #1 on Story 2.1
- `execute` → I run Prompt #2 on the current story
- `audit 2.3` → I run Prompt #3 on Story 2.3
- `create-epic 3` → I run Prompt #5 to create Epic 3
- `align-epic 2` → I run Prompt #6 on Epic 2

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
- Enforce Row-Level Security on every Supabase table — see `docs/PRD-Sprint1.md#74-data-model--implementation-grade`.
- Use `proxy.ts`, never recreate `middleware.ts`.
- Use the shared `components/share/share-copy-link.tsx` component anywhere sharing appears — never a one-off implementation.

**Ask first**

- Anything touching pricing, tier limits, or a "Standing Product Decision" in `docs/PRD-Sprint1.md#5-standing-product-decisions-do-not-relitigate`.
- Anything that would require reopening a decision already marked resolved in `docs/PRD-Sprint1.md#9-open-items--resolutions`.
- Adding any new environment variable, dependency, or third-party account not already named in the current story.

**Never do**

- Never write or rephrase user-facing copy. All Sprint 1 copy has already been through review. A copy gap is a stop-and-ask, not a fill-in-the-blank.
- Never build real SPF/DKIM domain-verification logic in Sprint 1 — `docs/PRD-Sprint1.md#611-onboarding-step-5--email-setup-f-c5` (REQ-6.11.3) — UI only, stub the backend.
- Never introduce a new accent color, drop shadow, or gradient outside what's defined in Design System v2.0's Tailwind tokens.
- Never commit `.env*` files or any secret.
- Never silently retry a story whose frontmatter `status` is `blocked`.

## Project Structure

```
docs/
  PRD-Sprint1.md          product spec, cite by section, don't restate
  epics/epic-0-...md      index only — goal + story table + links
  stories/epicN.storyNN-*.md   one file per unit of work, load one at a time
.memory/
  MEMORY.md               durable "why" — architecture decisions, corrected assumptions
  YYYY-MM-DD.md           daily auto-logs, searchable via memsearch
app/                      Next.js App Router — see PRD S7.6 for the full tree
components/ui/            design-system primitives
Agent-Workflow-Memory-Guidelines.md   how sessions, memory, and review are meant to work
```

For anything not covered above, check the current story's `Source` link before asking or guessing.
