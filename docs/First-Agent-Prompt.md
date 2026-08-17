# First Prompt — Paste This Into OpenCode

Before sending this, make sure the following are present in the project directory:

- `AGENTS.md` (root)
- `.memory/MEMORY.md`
- `docs/epics/epic-4-onboarding-wizard.md`
- `docs/PRD.md`
- `docs/PROMPTS.md`

---

```
You are resuming work on an in-progress project. Do NOT start from scratch — read
the current state first, then continue from where we left off.

Read, in this exact order:

1. AGENTS.md — your standing rules for this repo. This is the only file you should
   expect to hold in full context every session. Everything else, load just the
   piece you need.

2. .memory/MEMORY.md — the durable memory file. This contains:
   - Tech stack decisions and gotchas (Tailwind v4 @theme inline rules, etc.)
   - Current progress across all epics (stories marked done/in-progress/placeholder)
   - Component inventory, layout structure, external service status
   - Bug fixes and their root causes (especially the dark template @theme inline gotcha)
   - Open gaps (dark template secondary text color placeholder)
   Read this THOROUGHLY — it is your single source of truth for project state.

3. docs/epics/epic-4-onboarding-wizard.md — the current epic. Stories 4.0–4.3 are
   done. Story 4.4 (Step 4 — Qualification Decision) is NEXT. Read the Story 4.4
   section specifically — its Acceptance Criteria, Tasks, and Dev Notes.

4. docs/PROMPTS.md — the prompt shortcuts available:
   - `scan [story]` — understand story context and generate task list
   - `execute` — execute tasks with quality gates
   - `audit [story]` — post-implementation audit
   - `analyze [N.S]` — screen-by-screen design analysis

Once you've read the files above, before touching anything else:

- Summarize back to me, in your own words:
  (a) What has been built so far (Stories 4.0–4.3, including extra work like dark
      template fixes, Meta Preview OG-card, milestone rewards, live sync)
  (b) What the next story is (4.4 — Qualification Decision) and what it requires
  (c) Any open gaps or constraints that affect the next story

- Identify anything in Story 4.4's Dev Notes that depends on work I need to do
  (e.g., new credentials, design decisions). Do not fabricate or guess anything.

Then, starting with Story 4.4:
- Restate that story's Acceptance Criteria back to me before doing any work, so we
  can catch a misreading before it becomes a diff.
- Use `scan 4.4` or read the story section to generate a task list.
- Execute its Tasks.
- Show me the diff.
- Update that story's Status line in epic-4-onboarding-wizard.md to `done` (or
  `blocked`, with a clear reason, if you hit something you can't resolve).
- Wait for my confirmation before moving to the next story.

CRITICAL RULES (from AGENTS.md Boundaries):
- Never write or rephrase user-facing copy — all Sprint 1 copy is reviewed.
- Never build real SPF/DKIM verification — UI only, stub backend.
- Never introduce new accent colors, shadows, or gradients outside Design System v2.0.
- Never use inline styles (style={{ ... }}) — use Tailwind utility classes.
- All colors must reference CSS custom properties (--color-*), never hardcoded hex.
- @theme inline colors: use utility class names (bg-card, text-foreground), NOT
  arbitrary value syntax (bg-[--color-card]) — @theme inline does NOT create CSS
  custom properties. This is critical — see MEMORY.md for the full explanation.
- Ask first before touching pricing, tier limits, or "Standing Product Decisions".
- Check MEMORY.md before inventing anything — decisions are already recorded there.

START: Read the four files, summarize state, then proceed with Story 4.4.
```
