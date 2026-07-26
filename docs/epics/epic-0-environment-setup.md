# Epic 0 — Environment Setup

**Status:** in-progress
**Source:** [PRD S7 Technical Architecture](../PRD-Sprint-1.md#7-technical-architecture), [PRD S12 Epic & Story Template Standard](../PRD-Sprint-1.md#12-epic--story-template-standard)

## Goal
A fully working local + deployed environment, scaffolded correctly, before any Sprint 1 feature story begins.

## Definition of Done
A placeholder page is live on the production wildcard domain, an arbitrary subdomain of it resolves correctly through `proxy.ts`, Supabase auth works end-to-end (email + Google) against a real deployed URL, `AGENTS.md` and `.memory/MEMORY.md` are seeded and committed.

## Story Index

| ID | Title | Depends on | Status |
|---|---|---|---|
| 0.1 | Toolchain verification | — | done |
| 0.2 | Initialize Next.js 16 project | 0.1 | done |
| 0.3 | Supabase project, auth, schema, RLS | 0.2 | ready |
| 0.4 | Resend account (setup only) | 0.1 | ready |
| 0.5 | Paddle sandbox (setup only) | 0.1 | ready |
| 0.6 | Vercel project + wildcard domain + routing | 0.2 | ready |
| 0.7 | memsearch install + config | 0.1 | ready |
| 0.8 | Repo scaffolding (AGENTS.md, memory seed, docs, design tokens) | 0.2, 0.7 | ready |
| 0.9 | Lint, format, git hooks | 0.2 | ready |
| 0.10 | End-to-end smoke test | 0.3, 0.6, 0.8 | ready |

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
