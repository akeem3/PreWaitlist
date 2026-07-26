# Working Guidelines — OpenCode + Fork-Agnostic Memory

**Purpose:** how this project uses OpenCode alongside VS Code, in a way that survives switching the underlying fork (MiMoCode, vanilla OpenCode, or any other) and the underlying model provider (DeepSeek, or any other free/paid provider available through OpenCode).
**Supersedes:** the earlier MiMoCode-specific guidelines document. That document tied memory and workflow to MiMoCode's native features specifically; this one deliberately does not, per the decision to keep the fork and the model swappable.

---

## 1. The layering principle

OpenCode (the CLI/TUI/plugin host) is the stable layer. The fork sitting on top of it (MiMoCode today, possibly something else tomorrow) and the model provider behind that (DeepSeek, or any other) are both swappable. Anything this project depends on long-term should live at the OpenCode layer or below — in plain files, or in an OpenCode-level plugin — never in a fork-specific feature.

This is why memory now runs on **memsearch**, not on MiMoCode's native `MEMORY.md` mechanism: memsearch ships an official OpenCode plugin, independent of any fork, and stores its actual data as plain markdown files that remain readable and portable even if the tool itself is abandoned later.

## 2. Memory: memsearch

**What it is:** a hybrid semantic + keyword search layer (dense vector search fused with BM25 via reciprocal rank fusion) over a folder of markdown files. The files are the source of truth; the search index is a disposable cache that rebuilds from them.

**Install (free, local, no API key):**

```bash
uv tool install 'memsearch[onnx]'
# or: pip install 'memsearch[onnx]'
```

Uses `bge-m3` via ONNX, CPU-only. First run downloads the embedding model once (~558MB). Zero marginal cost, zero dependency on whichever paid model API is active that week — this matters specifically because the model provider is expected to change over time.

**Register with OpenCode** (user-level config, not project- or fork-specific):

```json
// ~/.config/opencode/opencode.json
{
  "plugin": ["@zilliz/memsearch-opencode"]
}
```

**Storage backend:** Milvus Lite by default — a local `.db` file, zero server, zero cost. Reconsider only if collaborators are ever added.

**File layout this produces:**

```
.memory/
├── MEMORY.md            ← hand-written, durable: architecture decisions and their reasoning,
│                            standing rules, anything expensive to re-derive
└── 2026-07-25.md         ← auto-generated daily log, one file per day, watched and re-indexed on save
```

Per-project isolation is automatic (collection keyed off project path) — this repo's memory never bleeds into a future project's.

**What goes in `MEMORY.md` vs. the daily logs:**

- `MEMORY.md`: the _why_ behind decisions (e.g., "chose Next.js 16 over 14 because subdomain routing needs `proxy.ts`"), schema decisions once tables actually exist, anything corrected mid-build that a spec got slightly wrong.
- Daily logs: everything else, written as it happens — these get search-recall automatically, so they don't need to be curated the way `MEMORY.md` does.
- Neither should duplicate what's already in `docs/PRD-Sprint1.md` or a story file — duplication is exactly what caused this project's earlier user-flow-document drift, and it's just as possible to recreate that problem inside memory files as inside spec files.

## 3. `AGENTS.md`: what it is and isn't

`AGENTS.md` lives at the project root, is read every session by essentially every current coding agent (OpenCode, Claude Code, Cursor, Codex CLI, and others all read it natively), and is the single highest-leverage file in the repo _if kept lean_. Research directly on this (not just convention) found that bloated or auto-generated `AGENTS.md` files measurably hurt: they reduce agent task success and increase inference cost, mostly by duplicating information the agent could already infer from the codebase or from `package.json`.

**Practical rules adopted here, and enforced in the companion `AGENTS.md` file itself:**

- Under 150 lines. If it's tempted to grow past that, the fix is almost always to delete, not to add a section.
- Structure: **Commands** (exact, copy-pasteable), **Boundaries** in three tiers (Always do / Ask first / Never do), **Project Structure** (a flat map, not prose), and a pointer into `docs/PRD-Sprint1.md` and `docs/stories/` for anything requiring depth.
- Hand-written, not agent-generated. An agent-generated `AGENTS.md` tends to restate what's already obvious from the repo, which is exactly the pattern shown to hurt performance.
- Fork-agnostic by construction — nothing in it should reference MiMoCode-specific features, since the whole point of this rewrite is that the fork can change without the project's operating rules changing.

## 4. Workflow: how to actually run a session

1. **Start every session by having the agent read `AGENTS.md` and the relevant story file** (not the whole PRD, not the whole epic — see PRD Section 12 for why). memsearch's recall means it doesn't need to be told to re-read `.memory/` explicitly; it's available as a search tool it can call when it needs something.
2. **Work one story at a time**, from its own file in `docs/stories/`. This keeps diffs reviewable and keeps you, not the agent, deciding when a unit of work is genuinely done.
3. **Use plan-first for anything touching architecture** (subdomain routing, auth, RLS) — have the agent lay out its approach in text, confirm it matches the PRD's `Source` link for that story, then let it write code. Pure UI-from-Figma stories can go straight to implementation since the spec is already unambiguous.
4. **Review every diff in VS Code before accepting.** Side-by-side is the setup specifically so you read the actual file changes, not a chat summary of them.
5. **After finishing a story, have the agent append to that story's `Dev Notes` section** (per PRD 12.3) and update its `status` frontmatter field — not free-form prose scattered elsewhere.
6. **Use subagents deliberately if the fork supports them, not by default.** A specialist review pass (checking a diff against the design system, or against RLS correctness) is a reasonable use. Don't let orchestration sprawl across trivial tasks.

## 5. Guardrails specific to this project

- **Never let the agent touch pricing, tier limits, or the standing decisions in PRD Section 5 without an explicit instruction to do so.**
- **Never let the agent write or "improve" marketing/onboarding copy.** All of it has already been through Hopkins/Caples review in Figma. A gap in copy is a flag-and-ask situation, not a fill-in-the-blank one.
- **Treat the F-C5 Sprint 1/Sprint 3 boundary (PRD REQ-6.11.3) as a hard line** — easy for an eager agent to "helpfully" build real SPF/DKIM verification while already in that file. Stub it, don't build it.
- **A story marked `blocked` stays blocked** until manually cleared — don't let a new session silently re-attempt it.
- **Confirm model/plugin identifiers before relying on them.** Provider model strings, and the exact current memsearch/OpenCode config schema, are the kind of thing that shifts between releases — verify against current docs at setup time rather than trusting a remembered string.

## 6. When to revisit this document

At the start of each new sprint (2, 3, 4), and any time the fork or model provider actually changes — confirm nothing here has silently drifted back toward a fork-specific assumption.
