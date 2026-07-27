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

### Wildcard subdomain routing via Vercel nameservers

- **Decision:** Use Vercel-managed nameservers (ns1/ns2.vercel-dns.com) instead of A-record + CNAME for wildcard routing.
- **Reason:** A records cannot route `*.mywaitlist.com` to Vercel. Only Vercel nameservers or a wildcard CNAME can. Since the domain was on GoDaddy, updated nameservers to point to Vercel's DNS.
- **Date:** 2026-07-26

## External Services — Setup Status

### Supabase (Story 0.3)

- **Project:** `ollaykzbhyniqxxlbkhn.supabase.co` — "waitlist-build"
- **Auth:** Google OAuth provider configured (client ID from GCP)
- **Keys:** Publishable + secret in .env.local
- **Redirect URLs:** Configured in Supabase Dashboard (localhost + vercel.app + mywaitlist.com)
- **Not done:** Supabase client modules, schema DDL, RLS policies — code not yet written

### Resend (Story 0.4)

- **Status:** Not started. No account created, no API key.

### Paddle (Story 0.5)

- **Sandbox account:** Created at sandbox-vendors.paddle.com
- **Keys:** API key, client token, webhook secret — all in .env.local
- **Not done:** Client module not yet written (setup-only story)

### Vercel (Story 0.6)

- **Project:** `waitlist-build` on Vercel
- **Domain:** `mywaitlist.com` + `www.mywaitlist.com` added
- **DNS:** Nameservers updated in GoDaddy to Vercel's
- **Wildcard:** `*.mywaitlist.com` not yet added via "Add Existing" in Vercel Domains

## Epic 0 Progress

| Story | Status  | Summary                                                                           |
| ----- | ------- | --------------------------------------------------------------------------------- |
| 0.1   | ✅ done | Toolchain verified, git init, .gitignore, first commit                            |
| 0.2   | ✅ done | Next.js 16 scaffolded, 15 route placeholders, all folders                         |
| 0.3   | ready   | Supabase project + Google OAuth done. Client/DDL/RLS not written                  |
| 0.4   | ready   | Resend account not created                                                        |
| 0.5   | ready   | Paddle sandbox keys in .env.local                                                 |
| 0.6   | ready   | Vercel project + domain added. Wildcard + proxy.ts not done                       |
| 0.7   | blocked | memsearch CLI + plugin done. Docker not installed (Milvus Lite no Windows wheels) |
| 0.8   | ✅ done | AGENTS.md, MEMORY.md, docs tree, design tokens                                    |
| 0.9   | ✅ done | ESLint, Prettier, simple-git-hooks + lint-staged                                  |
| 0.10  | ready   | Depends on 0.3 + 0.6 + 0.8                                                        |

## Standing Constraints

- Domain `waitlist-build.vercel.app` acceptable for Sprint 1; proper domain needed by Sprint 2.
- Pre-commit hook (`simple-git-hooks` + `lint-staged`) active — all commits run ESLint + Prettier.
- Use `proxy.ts`, never `middleware.ts`.
- Never write user-facing copy — all Sprint 1 copy is reviewed.
- Never build real SPF/DKIM in Sprint 1 — UI only, stub backend.
