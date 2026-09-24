# Story 16.4 — Dashboard Leaderboard Sort Fix

**Status:** ready
**Epic:** 16 — Leaderboard & Founder Updates Engine Fix
**Depends on:** —
**Design Refs:** Story 12.3.1 AC3 (server rank) + sortable headers in client; dashboard leaderboard has **no** HF SVG (`High-fidelity-svgs/Leaderboard.svg` does not exist — audit claim 14)
**Source:** [Audit §3 claims 1–2 / issues 1–2](../scans/engine-audit-5-engines.md), [Story 12.3.1](../stories/completed/story-12.3.1-dashboard-leaderboard.md), [Epic 16 Standing Decision on sort](../epics/epic-16-leaderboard-updates-engine-fix.md)

## Story

As a founder, I want clicking Referrals or Share% to sort correctly the first time — so I can find top advocates without fighting inverted arrows.

## Acceptance Criteria (EARS)

- AC1: First click on a non-rank column that uses a descending-by-nature comparator (`referral_count`, `quality_score`/share) shall show **↓** and sort data **descending** (highest first); second click shall show **↑** and sort **ascending**. Rank/Name/Email/Date first-click behavior shall remain correct (project-consistent — do not regress).
- AC2: The double-inversion at `client.tsx:107-111` comparators + `:121` flip + `:130` first-click `desc` shall be resolved by a single source of truth for direction (normalize comparators to always ascending and let `sortDir` alone invert, **or** keep desc comparators and stop pre-setting `sortDir`/double-applying flip — pick one, document in PR).
- AC3: The test at `dashboard-leaderboard-page.test.tsx:99-112` that **certifies the bug** (expects inverted order; comment `// referral_count=3` mismatches fixture) shall be rewritten to assert correct descending order on first Referrals click with accurate fixture comments.
- AC4: Arrow indicators (`↑`/`↓`) shall match the actual data order for every sortable column after first and second click.
- AC5: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1–AC2) Normalize sort direction logic
- T2 (AC3–AC4) Fix enshrining test + arrow assertions
- T3 (AC5) Lint + build

## Out of Scope

- Pagination (Story 16.5)
- "Quality" → "Share %" label rename (Story 16.8 AC2)
- Column count / mobile grid changes (audit 🟠 — not in Standing Decisions)
- Removing full emails (Standing Decision L2 — keep)
- Public leaderboard sort (already correct)
- Server-side rank algorithm in `page.tsx` (correct — `referral_count DESC, created_at ASC`)

## Dev Notes

### Root cause

`src/app/dashboard/leaderboard/client.tsx`:

```ts
// L107-111 — already descending comparators
case "referral_count":
  cmp = b.referral_count - a.referral_count;
  break;
case "quality_score":
  cmp = (b.quality_score ?? 0) - (a.quality_score ?? 0);
  break;

// L121 — applies sortDir on top of cmp
return sortDir === "asc" ? cmp : -cmp;

// L125-131 — first click on non-rank forces desc
function handleSort(key: SortKey) {
  if (sortKey === key) {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  } else {
    setSortKey(key);
    setSortDir(key === "rank" ? "asc" : "desc"); // desc + desc-comparator = double
  }
}
```

First Referrals click: comparator already `b-a` (desc) **and** `sortDir === "desc"` applies `-cmp` → **ascending data with ↓ arrow**.

### Recommended fix (AC2) — single source of truth

**Option A (preferred):** all comparators ascending; `sortDir` sole inverter:

```ts
case "referral_count":
  cmp = a.referral_count - b.referral_count;
  break;
case "quality_score":
  cmp = (a.quality_score ?? 0) - (b.quality_score ?? 0);
  break;
// rank/name/email/date already ascending
return sortDir === "asc" ? cmp : -cmp;
```

Keep `handleSort` first-click `desc` for non-rank (numeric cols) → first click highest-first with ↓. Rank stays first-click `asc`.

**Option B:** keep `b-a` comparators; on first click set `sortDir` to `"asc"` for desc-native keys so `-cmp` yields desc — harder to explain; not preferred.

Document choice in PR.

### AC3 — broken test

`src/__tests__/components/dashboard-leaderboard-page.test.tsx:99-112`:

- Comment claims `user2 // referral_count=3` but `makeRows` gives `user2` referral_count **1** (audit claim 2).
- After fix, first Referrals click must show the **highest** referral_count row first with **↓**.
- Fix fixture comments to match `makeRows` data; optionally add second-click assertion (↑ + ascending) and a Share/Quality column case for AC4.

### AC4 — arrow

`SortHeader` (L38): `sortDir === "asc" ? "↑" : "↓"` when active — after logic fix, arrow tracks `sortDir` correctly if data order tracks `sortDir`. Assert in test via header text content.

### Implementation order

1. Normalize comparators (T1)
2. Confirm `handleSort` first-click defaults
3. Rewrite/extend test (T2)
4. `pnpm lint && pnpm test -- dashboard-leaderboard && pnpm build`

## Files to Create/Modify

| File                                                           | Change                         |
| -------------------------------------------------------------- | ------------------------------ |
| `src/app/dashboard/leaderboard/client.tsx`                     | Sort comparators / direction   |
| `src/__tests__/components/dashboard-leaderboard-page.test.tsx` | Fix enshrined bug; arrow cases |

## Risk

- Search + sort + (later) pagination interact — reset page state when sortKey changes lands in 16.5; sort fix alone must not assume `page` exists yet.
- Do not "fix" by changing server `rank` — client re-sort is independent display concern.
