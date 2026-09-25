# Story 15.1 — Daily Cron Schedule (`vercel.json`)

**Status:** in-progress
**Epic:** 15 — Warmth Engine Fix & Hardening
**Depends on:** — (ships cleanly with 15.0 in the same release train)
**Design Refs:** — (infrastructure)
**Source:** [Audit §2 claim 1](../scans/engine-audit-5-engines.md), [Vercel Cron docs](https://vercel.com/docs/cron-jobs), [Epic 15 Standing Decision 6](../epics/epic-15-warmth-engine-fix.md)

## Story

As a platform, I want the daily warmth recalculation cron scheduled in production so that `subscribers.warmth_score` refreshes every day without a human running SQL or curl.

## Acceptance Criteria (EARS)

- AC1: `vercel.json` shall include a `crons` array entry `{ "path": "/api/cron/warmth", "schedule": "0 5 * * *" }` (UTC daily 05:00) while preserving the existing `git.deploymentEnabled` config.
- AC2: `GET /api/cron/warmth` shall continue to require `Authorization: Bearer ${CRON_SECRET}` and return 401 without it / 500 if `CRON_SECRET` is unset.
- AC3: After deploy to `main`, the founder shall confirm the cron appears in the Vercel dashboard (or `vercel crons ls`) — **manual gate**, noted in Implementation Status when complete.
- AC4: A manual authenticated invoke of `/api/cron/warmth` on production shall return JSON with numeric `processed`, `hot`, `warm`, `cold`, `unscored`.
- AC5: Lint and build shall pass with zero errors.

> **Dev Notes (2026-09-25 — warmth restructure):** AC4 is superseded — the cron response is `{ processed, hot, warm, cold }` (no `unscored` field). Original AC text retained above for history. **[AMENDED 2026-09-25]** Body sections below (expected-response lines) still show the pre-restructure model (`unscored` field) — treat them as historical; the restructure supersedes them.

## Tasks

- T1 (AC1) Add `crons` to `vercel.json`
- T2 (AC2) Confirm `CRON_SECRET` exists in Vercel project environment variables
- T3 (AC3–AC4) Post-deploy verification checklist (founder/agent)
- T4 (AC5) Lint + build

## Out of Scope

- Changing path or moving to Supabase pg_cron / GitHub Actions
- Real-time recalculation on webhook
- Editing `src/app/api/cron/warmth/route.ts` except optional logging
- Local cron simulation

## Dev Notes

### T1 — `vercel.json`

**Current:**

```json
{
  "git": {
    "deploymentEnabled": {
      "dev": false
    }
  }
}
```

**Target:**

```json
{
  "git": {
    "deploymentEnabled": {
      "dev": false
    }
  },
  "crons": [
    {
      "path": "/api/cron/warmth",
      "schedule": "0 5 * * *"
    }
  ]
}
```

- Schedule locked: `0 5 * * *` UTC (Standing Decision 6). Vercel sends `Authorization: Bearer ${CRON_SECRET}` automatically when the env var is configured on the project.
- Valid JSON only — no comments.
- Cron jobs run only for **production** deployments; `dev` deploys disabled is consistent.

### T2 — Env parity

| Where                                | Status                           |
| ------------------------------------ | -------------------------------- |
| `.env.local`                         | MEMORY: `CRON_SECRET` present    |
| Vercel Project → Settings → Env vars | **Must verify** — may be missing |

If missing, create a long random secret, set in `.env.local` and Vercel (Production), redeploy. Endpoint behavior without secret: 500 `{ error: "CRON_SECRET not configured" }` (`route.ts:8-13`).

### T3 — Verification checklist (record under Implementation Status)

1. Merge + deploy `main`.
2. Vercel → Project → **Cron Jobs** (or `vercel crons ls`): entry `/api/cron/warmth` daily 05:00 UTC.
3. `curl -s -H "Authorization: Bearer $CRON_SECRET" https://www.prewaitlist.com/api/cron/warmth`
   - Expect: `{"processed":N,"hot":…,"warm":…,"cold":…,"unscored":…}`
   - 401 → secret mismatch; 500 → secret unset or batch error.
4. Spot-check: pick a subscriber with a known click 70 days ago → after run, tier reflects −25 / cold rules from 15.0.
5. Optional: wait for next 05:00 UTC run and confirm Vercel logs show invocation.

**Manual intervention:** steps 2–5 require founder Vercel access — agent cannot complete AC3/AC4 from repo alone.

### T4 — Commands

```bash
pnpm lint
pnpm build
```

No unit test required for a JSON config change; cron route tests are Story 15.5.

## Files to Create/Modify

| File                   | Change                             |
| ---------------------- | ---------------------------------- |
| `vercel.json`          | Add `crons` array                  |
| (env) Vercel dashboard | Confirm `CRON_SECRET` — not in git |

## Implementation Status

**Status: CODE DONE — manual gates pending deploy (AC3, AC4)**

| AC                       | Status            | Evidence                                                                                                                                                               |
| ------------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 vercel.json crons    | ✅ Done           | `vercel.json` — crons[0] = `/api/cron/warmth` @ `0 5 * * *`, `git.deploymentEnabled.dev` preserved, JSON-validated                                                     |
| AC2 CRON_SECRET auth     | ✅ Done           | `route.ts:8-17` (500 unset / 401 bad bearer) + live dev probe → **HTTP 401** + `.env.local` present (64 chars); Vercel prod env parity = founder check (AC3 checklist) |
| AC3 Vercel shows cron    | ⏳ Pending deploy | Requires deploy to `main` + founder Vercel dashboard access                                                                                                            |
| AC4 Manual invoke counts | ⏳ Pending deploy | Requires authenticated curl on production after deploy                                                                                                                 |
| AC5 Lint + build         | ✅ Done           | `pnpm lint` 0 errors (5 baseline warnings), `pnpm build` exit 0                                                                                                        |
