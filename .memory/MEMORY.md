# Project Memory — Durable Decisions

## Tech Stack Decisions

### Next.js 16 (not 14)

- **Decision:** Use Next.js 16 with App Router, Turbopack as default bundler.
- **Reason:** Next.js 14 is two majors behind. Next.js 16 renamed middleware.ts to proxy.ts — the exact file subdomain routing depends on. Building on 14 conventions means an immediate breaking migration before Sprint 2.
- **Date:** 2026-07-26

### Supabase via @supabase/ssr

- **Decision:** Use `@supabase/ssr` for all session handling, not `@supabase/auth-helpers-nextjs`.
- **Reason:** `@supabase/auth-helpers-nextjs` is legacy. `@supabase/ssr` is current for cookie/session handling across Server Components, Server Actions, Route Handlers.
- **Date:** 2026-07-26

### pnpm as package manager

- **Decision:** Use pnpm over npm or yarn.
- **Reason:** Faster installs, disk-efficient — reasonable default for a solo dev iterating quickly.
- **Date:** 2026-07-26

### memsearch for project memory

- **Decision:** Use memsearch with ONNX embeddings (bge-m3) for fork-agnostic semantic search over markdown memory files.
- **Reason:** Stores data as plain markdown files readable even without the tool. Uses local ONNX embeddings — zero API key, zero cost, zero dependency on whichever model provider is active.
- **Date:** 2026-07-26
