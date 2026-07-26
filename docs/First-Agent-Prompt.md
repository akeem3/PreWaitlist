# First Prompt — Paste This Into OpenCode

Before sending this, make sure the following are present in the project directory:
- `AGENTS.md` (root)
- `PRD-Sprint-1.md`
- `Epic-0-Environment-Setup.md`
- `Agent-Workflow-Memory-Guidelines.md`

---

```
You are setting up a new project from scratch. Do NOT write any application code yet.

Read, in this exact order:
1. AGENTS.md — your standing rules for this repo. This is the only file you should
   expect to hold in full context every session. Everything else, load just the
   piece you need.
2. Epic-0-Environment-Setup.md — the epic you're about to execute: a goal, a
   definition of done, and 10 stories (0.1 through 0.10), each with its own
   Acceptance Criteria, Tasks, and Out of Scope. Where a story links to a specific
   section of PRD-Sprint-1.md, treat that link as the actual source and only read
   the section it points to, not the whole PRD.
3. Agent-Workflow-Memory-Guidelines.md — how we work together: memory (memsearch),
   review workflow, and the guardrails in its Section 5.

Once you've read the three files above, before touching anything else:

- Summarize back to me, in your own words, what the 10 stories in Epic 0 are and
  the order you intend to run them in, based on each story's "Depends on" line.
- Identify every point where a story needs something only I can provide — a Supabase
  project, a Google Cloud OAuth client, a Resend account, a Paddle sandbox account,
  a Vercel project/domain, or any other credential. List these against the specific
  story that needs them. Do not ask me for all of them up front — ask at the point
  each story actually needs it, and never fabricate or guess a placeholder credential
  in its place.

Then, starting with Story 0.1:
- Restate that story's Acceptance Criteria back to me before doing any work, so we
  can catch a misreading before it becomes a diff.
- Execute its Tasks.
- Show me the diff.
- Update that story's Status line in Epic-0-Environment-Setup.md to `done` (or
  `blocked`, with a clear reason, if you hit something you can't resolve — a
  blocked story stays blocked until I clear it myself).
- Wait for my confirmation before moving to the next story.

Follow every guardrail in AGENTS.md's Boundaries section and in the guidelines
document's Section 5 throughout — in particular: no copy invention, no touching
pricing/tier logic without being asked, and no building real SPF/DKIM verification
logic even though it sits in the same onboarding-Step-5 area you'll be building
later this sprint (that's explicitly Sprint 3 scope, not Epic 0, and not this
sprint's onboarding-Step-5 story either).

Start now with the read-and-summarize step. Do not write code yet.
```
