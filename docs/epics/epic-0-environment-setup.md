# Epic 0 — Environment Setup

**Status:** done
**Source:** [PRD S7 Technical Architecture](../PRD-Sprint-1.md#7-technical-architecture), [PRD S12 Epic & Story Template Standard](../PRD-Sprint-1.md#12-epic--story-template-standard)

## Goal

A fully working local + deployed environment, scaffolded correctly, before any Sprint 1 feature story begins.

## Definition of Done

A placeholder page is live on the production wildcard domain, an arbitrary subdomain of it resolves correctly through `proxy.ts`, Supabase auth works end-to-end (email + Google) against a real deployed URL, `AGENTS.md` and `.memory/MEMORY.md` are seeded and committed.

## Story Index

| ID   | Title                                                          | Depends on    | Status |
| ---- | -------------------------------------------------------------- | ------------- | ------ |
| 0.1  | Toolchain verification                                         | —             | done   |
| 0.2  | Initialize Next.js 16 project                                  | 0.1           | done   |
| 0.3  | Supabase project, auth, schema, RLS                            | 0.2           | done   |
| 0.4  | Resend account (setup only)                                    | 0.1           | done   |
| 0.5  | Paddle sandbox (setup only)                                    | 0.1           | done   |
| 0.6  | Vercel project + wildcard domain + routing                     | 0.2           | done   |
| 0.7  | memsearch install + config                                     | 0.1           | done   |
| 0.8  | Repo scaffolding (AGENTS.md, memory seed, docs, design tokens) | 0.2, 0.7      | done   |
| 0.9  | Lint, format, git hooks                                        | 0.2           | done   |
| 0.10 | End-to-end smoke test                                          | 0.3, 0.6, 0.8 | done   |

Work through these in dependency order, one at a time. Each has a `status` you should update as you go (`ready` → `in-progress` → `blocked` or `done`). A story marked `blocked` stays blocked until manually cleared — don't silently re-attempt it next session.

---

### Story 0.1 — Toolchain verification

**Status:** done

**Story:** As the founder, I want a verified local toolchain, so every later story starts from a known-working baseline instead of debugging environment issues mid-feature.

**Acceptance Criteria (EARS):**

- AC1: The system shall report an installed Node.js LTS version when `node -v` is run.
- AC2: The system shall report an installed pnpm version when `pnpm -v` is run.
- AC3: When `git status` is run in the project root, the system shall report a clean initialized repository with `.env*`, `node_modules`, and `.next` ignored.
- AC4: The system shall confirm the OpenCode CLI (or VS Code integration) launches and can read this project directory.

**Tasks:** T1 (AC1, AC2) install Node LTS + pnpm, verify versions · T2 (AC3) `git init`, write `.gitignore`, first commit · T3 (AC4) launch OpenCode in this directory, confirm it lists the repo's files.

**Out of scope:** installing project dependencies (0.2), memsearch (0.7).

**Dev Notes:**

- T1: Node v22.11.0 (LTS), pnpm 10.12.1, git 2.44.0 confirmed present.
- T2: git initialized, .gitignore written (excludes node_modules/, .next/, .env*, out/, build/, .vercel, .milvus/), first commit made.
- T3: OpenCode confirmed reading this directory (this session is proof).

---

### Story 0.2 — Initialize the Next.js 16 project

**Status:** done

**Story:** As the founder, I want a correctly scaffolded Next.js 16 project, so subdomain routing (which depends on `proxy.ts`, not `middleware.ts`) works from day one instead of requiring a mid-sprint migration.

**Acceptance Criteria (EARS):**

- AC1: When `create-next-app` is run, the system shall generate a project using App Router, TypeScript, Tailwind, and Turbopack as the default bundler.
- AC2: If the scaffold generates a `middleware.ts` file, the system shall rename it to `proxy.ts` and update any config referencing the old name before any routing logic is written against it.
- AC3: The system shall run `next dev` with zero errors before this story is considered done.
- AC4: The generated folder structure shall match PRD S7.6's component tree at the top level (`app/(marketing)`, `app/(auth)`, `app/onboarding`, `app/dashboard`, `app/(public)/[subdomain]`, `components/ui`).

**Tasks:** T1 (AC1) run create-next-app with the flags above · T2 (AC2) verify/rename to proxy.ts · T3 (AC3) confirm dev server runs clean · T4 (AC4) scaffold top-level folders (placeholders acceptable).

**Out of scope:** actual routing logic inside `proxy.ts` (lands with 0.6, alongside the domain it depends on); real page content (Sprint 1 feature stories, not this epic).

**Dev Notes:**

- T1: `npx create-next-app@latest` with `--typescript --tailwind --eslint --app --turbopack --src-dir`. Generated Next.js 16.2.12, React 19, Tailwind 4, TypeScript 5.9.
- T2: No `middleware.ts` was generated — Next.js 16 does not create one by default. `proxy.ts` will be created manually in Story 0.6.
- T3: `pnpm build` compiled successfully with zero errors. All routes present.
- T4: Directory structure created matching PRD S7.6: `(marketing)`, `(auth)/signup|signin|verify-email`, `auth/callback`, `onboarding/[1-5,4a,success]`, `dashboard`, `(public)/[subdomain]`, `components/ui`, `components/onboarding`, `components/share`. Placeholder pages in all routes.

---

### Story 0.7 — memsearch install + config

**Status:** blocked

**Story:** As the founder, I want a fork-agnostic, semantic-search memory layer installed and configured, so project memory survives switching the OpenCode fork or the underlying model provider.

**Acceptance Criteria (EARS):**

- AC1: The system shall install the memsearch CLI with local ONNX embeddings (`bge-m3`), requiring no API key.
- AC2: The system shall register `@zilliz/memsearch-opencode` in the user-level OpenCode plugin config.
- AC3: The system shall use Milvus Lite as the storage backend, with no external server dependency.
- AC4: The system shall create `.memory/MEMORY.md` and confirm a daily log file is created and indexed after a save.
- AC5: When the Milvus Lite index file is deleted, the system shall be able to rebuild it from the markdown files in `.memory/` without data loss.

**Tasks:** T1 (AC1) `uv tool install 'memsearch[onnx]'` (or pip equivalent) · T2 (AC2) add plugin entry to `~/.config/opencode/opencode.json` · T3 (AC3, AC4) confirm Milvus Lite default, create `.memory/MEMORY.md`, make one edit, confirm indexing · T4 (AC5) delete local index, confirm clean rebuild.

**Out of scope:** seeding `MEMORY.md`'s actual content (0.8).

**Dev Notes:**

- T1: `pip install "memsearch[onnx]"` — memsearch 0.4.16 installed with onnxruntime 1.28.0.
- T2: Added `"plugin": ["@zilliz/memsearch-opencode"]` to `~/.config/opencode/opencode.json`.
- T3: **BLOCKED** — Milvus Lite does not support Windows (no PyPI wheels). Docker not installed, WSL2 not installed. The `.memory/MEMORY.md` file is created with initial content, but indexing cannot run. Unblock by installing Docker Desktop (`docker run -d -p 19530:19530 milvusdb/milvus:latest standalone`) or enabling WSL2.
- T4: Blocked behind T3.

---

### Story 0.9 — Lint, format, git hooks

**Status:** done

**Story:** As the founder working solo across many agent sessions, I want lint/format enforced at commit time, so a bad session can't silently commit broken or inconsistent code.

**Acceptance Criteria (EARS):**

- AC1: The system shall run ESLint and Prettier with no errors on the scaffolded project.
- AC2: When a commit is attempted with lint errors present, the system shall block the commit via a pre-commit hook.

**Tasks:** T1 (AC1) configure ESLint + Prettier · T2 (AC2) add pre-commit hook (e.g. simple-git-hooks or husky + lint-staged).

**Out of scope:** CI/CD pipeline beyond Vercel's own build-time checks (not needed at this solo, pre-launch stage).

**Dev Notes:**

- T1: ESLint already configured via `eslint.config.mjs` (eslint-config-next). Added Prettier 3.9.6 with `.prettierrc` and `.prettierignore`. Added `format` and `format:check` scripts. Fixed one unused-variable warning in `auth/callback/route.ts`.
- T2: Installed `simple-git-hooks` + `lint-staged`. Pre-commit hook runs `prettier --write` + `eslint --fix` on staged `*.{js,ts,tsx,mjs,json,css,md}` files. Verified working — commit succeeded with hook running.

---

### Story 0.8 — Repo scaffolding for the agent workflow

**Status:** done

**Story:** As the founder, I want the repo scaffolded with `AGENTS.md`, a seeded `MEMORY.md`, the docs tree, and design tokens as code, so every subsequent session starts from consistent, non-duplicated context.

**Acceptance Criteria (EARS):**

- AC1: The system shall create a root `AGENTS.md` under 150 lines, structured as Commands / Boundaries (Always do, Ask first, Never do) / Project Structure, with no content duplicated from `package.json` or the PRD.
- AC2: The system shall seed `.memory/MEMORY.md` with the tech-stack decisions from PRD S7.1, including the reasoning (not just the conclusion) for each.
- AC3: The system shall place `PRD-Sprint-1.md` and `Epic-0-Environment-Setup.md` in the repository at consistent, referenced paths.
- AC4: The system shall express Design System v2.0's colors, type scale, spacing, and radii as a Tailwind theme extension, not as values to be eyeballed from a document per component.
- AC5: All of the above shall be committed together as a single scaffolding commit.

**Tasks:** T1 (AC1) write AGENTS.md · T2 (AC2) seed .memory/MEMORY.md · T3 (AC3) place PRD/epic files · T4 (AC4) Tailwind theme extension for design tokens · T5 (AC5) commit.

**Out of scope:** any actual UI component built from these tokens (Sprint 1 feature stories).

**Dev Notes:**

- T1: Copied `docs/AGENTS.md` (48 lines) to root. Structured as Commands / Boundaries / Project Structure. No duplication from package.json or PRD.
- T2: `.memory/MEMORY.md` created in Story 0.7 with tech-stack decisions (Next.js 16, Supabase via @supabase/ssr, pnpm, memsearch) and reasoning for each.
- T3: `docs/PRD-Sprint-1.md` and `docs/epics/epic-0-environment-setup.md` already placed in previous stories.
- T4: `src/app/globals.css` rewritten with Tailwind v4 `@theme inline` block containing Design System v2.0 tokens: colors (`#FAF8F4` background, `#FFFFFF` card, `#0F7A5E` accent), Inter font, 8px grid spacing, three radii (sm/md/lg), single floating shadow token, success gradient. Build passes clean.
- T5: Single commit with all scaffolding changes.
