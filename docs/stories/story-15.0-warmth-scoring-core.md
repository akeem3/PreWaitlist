# Story 15.0 — Warmth Scoring Core (signals, decay, tier, batch)

**Status:** ready
**Epic:** 15 — Warmth Engine Fix & Hardening
**Depends on:** —
**Design Refs:** — (algorithm + batch; no SVG)
**Source:** [Audit §2](../scans/engine-audit-5-engines.md#2-warmth--%EF%B8%8F-partial-verified-rescan-confidence-96), [Epic 15 Standing Decisions](../epics/epic-15-warmth-engine-fix.md)

## Story

As a platform, I want warmth scores computed from only real engagement signals with correct decay and referral counts so that Hot/Warm/Cold in production reflect who actually engaged — and so that a subscriber who engaged once and then went silent for 90 days shows as **Cold**, not Unscored.

## Acceptance Criteria (EARS)

- AC1: The system shall score subscribers using only: `email_click` (+5), `referral_signup` (+15), `qualification_completed` (+8). The `email_reply` and `leaderboard_visit` weights and any `replied` event filtering shall be removed from `src/lib/warmth.ts`.
- AC2: Time decay shall consider **only** `email_events.event_type === "clicked"` for the "last engagement" timestamp; if the subscriber has zero clicked events, the decay clock shall start from `subscribers.created_at`.
- AC3: Decay windows shall be: days since last engagement 0–59 → no penalty; 60–89 → −25 points; 90+ → score forced to 0 (clamped). Day 59 shall **not** apply the −25 penalty (`daysSince >= 60`, not `>= 59`).
- AC4: `assignTier` (or a score+tier helper) shall return `hot` for score ≥ 70, `warm` for ≥ 40, `cold` for score > 0 **or** (score === 0 **and** the subscriber has lifetime engagement: clicks > 0, referrals > 0, or qual answers present), and `null` (Unscored) only when score is 0 **and** there is no lifetime engagement.
- AC5: `batchRecalculateWarmth` shall paginate subscribers with a stable `.order("id", { ascending: true })` before `.range(...)`.
- AC6: For each page of subscriber IDs, referral counts shall be computed as the number of rows whose `referrer_id` is **in that page’s subscriber IDs** (referrals _made by_ page members), not referrers _of_ page members — so cross-page referrals still credit the referrer on the page where the referrer is scored.
- AC7: The batch shall continue to write only the tier string (`hot`/`warm`/`cold`/`null`) to `subscribers.warmth_score` and return `{ processed, hot, warm, cold, unscored }`.
- AC8: Clamp shall remain 0–100; qualitative +8 and referral ×15 multi-signal paths shall remain covered by tests.
- AC9: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1) Remove dead signal weights and reply scoring
- T2 (AC2–AC3) Click-only decay + day-60 boundary fix
- T3 (AC4) Tier-at-zero / lifetime-engagement rules
- T4 (AC5–AC7) Batch stable pagination + cross-page referral count fix
- T5 (AC8–AC9) Update unit tests + lint/build

## Out of Scope

- Cron scheduling (Story 15.1)
- Webhook changes (Story 15.2)
- Segment API (Story 15.3)
- UI, settings copy, dashboard warmth API (Story 15.4)
- Negative bounce/unsub signals; lowering Hot threshold; building `page_views` or inbound reply; numeric score column

## Dev Notes

### T1 — Remove dead weights (`src/lib/warmth.ts`)

**Current (wrong) — lines 3–10, 32–42:**

```ts
const SIGNAL_WEIGHTS = {
  email_click: 5,
  email_reply: 10, // DELETE — Resend has no reply event
  referral_signup: 15,
  qualification_completed: 8,
  leaderboard_visit: 5, // DELETE — page_views never inserted
} as const;
```

Also delete:

```ts
const replyCount = events.filter((e) => e.event_type === "replied").length;
rawScore += replyCount * SIGNAL_WEIGHTS.email_reply;
```

**Target:**

```ts
export const SIGNAL_WEIGHTS = {
  email_click: 5,
  referral_signup: 15,
  qualification_completed: 8,
} as const;
```

Export weights only if tests/docs import them; otherwise keep module-private. Research: Resend webhook event types — no `email.replied`.

### T2 — Decay: clicked only + boundary (`calculateDecay`)

**Current bug (lines 51–66):**

1. Reduces over **all** events → `sent`/`delivered`/`opened` reset the 60-day clock (audit claim 3/9).
2. `daysSince >= DECAY.no_penalty_max (59)` applies −25 at **day 59** (audit claim 2).
3. `DECAY.penalty_max: 89` never read.

**Target logic:**

```ts
const DECAY = {
  no_penalty_days: 60, // 0–59 free; penalty at >= 60
  penalty_amount: 25,
  reset_days: 90,
} as const;

function calculateDecay(
  events: EmailEvent[],
  fallbackDate: string // subscribers.created_at
): number {
  const clicks = events.filter((e) => e.event_type === "clicked");
  const reference =
    clicks.length > 0
      ? clicks.reduce((latest, e) =>
          new Date(e.created_at) > new Date(latest.created_at) ? e : latest
        ).created_at
      : fallbackDate;

  const daysSince = Math.floor(
    (Date.now() - new Date(reference).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSince >= DECAY.reset_days) return 999; // clamp → 0
  if (daysSince >= DECAY.no_penalty_days) return DECAY.penalty_amount;
  return 0;
}
```

**Signature change:** `calculateWarmthScore(events, referralCount, hasQual, createdAt)` — or accept `{ events, referralCount, hasQualAnswers, createdAt }`. Batch must pass `sub.created_at` (add to select at line 103: `"id, waitlist_id, qual_answers, referrer_id, created_at"`).

**AC2 mapping:** clicks filter + `created_at` fallback = last engagement set.

### T3 — Tier at zero (Standing Decision 3)

**Current (wrong) — lines 68–77:**

```ts
export function assignTier(score: number): "hot" | "warm" | "cold" | null {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  if (score > 0) return "cold";
  return null; // decayed-to-zero incorrectly Unscored
}
```

**Target:**

```ts
export function assignTier(
  score: number,
  hadEngagement?: boolean
): "hot" | "warm" | "cold" | null {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  if (score > 0) return "cold";
  // score === 0
  return hadEngagement ? "cold" : null;
}
```

**`hadEngagement` definition (batch + helper):**

```ts
const hadEngagement = clickCount > 0 || referralCount > 0 || hasQualAnswers;
```

| Subscriber state                                     | Score                     | Tier                                                 |
| ---------------------------------------------------- | ------------------------- | ---------------------------------------------------- |
| 5 clicks + qual, decayed 90d                         | 0                         | **cold**                                             |
| Referrals only, decayed 90d                          | 0                         | **cold**                                             |
| Qual only, decayed to 0 after −25                    | 0                         | **cold**                                             |
| Never clicked, never referred, no qual               | 0                         | **null** → Unscored                                  |
| Never clicked, but `created_at` 100d old, no signals | 0 (decay 999 on fallback) | **null** if hadEngagement false — **still Unscored** |
| Click 10d ago, 2 clicks                              | 10                        | cold (score 1–39)                                    |

**Product nuance:** A never-engaged subscriber who is 100 days old with zero signals stays Unscored (no lifetime engagement to prove they “went cold”). Decision 3 only forces Cold when engagement existed and decay zeroed it. Document this in MEMORY (15.6).

**Preferred return shape** (avoids double work in batch):

```ts
export function scoreSubscriber(input: {
  events: EmailEvent[];
  referralCount: number;
  hasQualAnswers: boolean;
  createdAt: string;
}): {
  score: number;
  hadEngagement: boolean;
  tier: "hot" | "warm" | "cold" | null;
};
```

Keep `calculateWarmthScore` + `assignTier` as thin wrappers for existing tests, **or** update all call sites/tests in T5 in the same PR.

### T4 — Batch fix (`batchRecalculateWarmth` lines 83–185)

**Pagination (AC5):**

```ts
const { data: subscribers, error } = await supabase
  .from("subscribers")
  .select("id, waitlist_id, qual_answers, referrer_id, created_at")
  .order("id", { ascending: true }) // ADD — stable pages
  .range(offset, offset + PAGE_SIZE - 1);
```

**Referral counts (AC6) — replace lines 123–146:**

```ts
// WRONG: referrerIds = referrers OF people on this page
// RIGHT: count rows referred BY people on this page
const pageIds = subscribers.map((s) => s.id);
const referralCounts = new Map<string, number>();

if (pageIds.length > 0) {
  const { data: referralRows } = await supabase
    .from("subscribers")
    .select("referrer_id")
    .in("referrer_id", pageIds);

  for (const row of referralRows || []) {
    if (row.referrer_id) {
      referralCounts.set(
        row.referrer_id,
        (referralCounts.get(row.referrer_id) || 0) + 1
      );
    }
  }
}
```

Then `const refCount = referralScores.get(sub.id) || 0` per page member — correct even when referral lives on another page.

**Events load:** still `.in("subscriber_id", pageIds)`; scoring filters to clicks inside `calculateWarmthScore` / decay (AC1–AC2). No need to filter in SQL.

**Score + tier per row:**

```ts
const clickCount = subEvents.filter((e) => e.event_type === "clicked").length;
const hadEngagement = clickCount > 0 || refCount > 0 || hasQual;
const score = calculateWarmthScore(
  subEvents,
  refCount,
  hasQual,
  sub.created_at
);
const tier = assignTier(score, hadEngagement);
updates.push({ id: sub.id, warmth_score: tier });
```

**Writes (AC7):** keep tier-only to `warmth_score`. Optional perf: one `.in("id", ids)` update per page instead of sequential `:169-175`.

**Return:** unchanged `{ processed, hot, warm, cold, unscored }`.

### T5 — Tests (must land with this story)

File: `src/__tests__/lib/warmth.test.ts`

| Existing test          | Action                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `assignTier(0) → null` | Split: with `hadEngagement: true` → `"cold"`; without → `null`                                                                       |
| Decay 30/70/95d        | Keep; add **day 59** and **day 60** boundary                                                                                         |
| `counts only clicked`  | Keep for **score** signals                                                                                                           |
| New                    | `sent` + `delivered` only, last “engagement” via old created_at → still decays using `createdAt` fallback or shows decay from signup |
| New                    | All events `sent`/`delivered`, `createdAt` 100d → score 0; `hadEngagement` false → tier null                                         |
| New                    | `clicked` 10d ago + `sent` 0d ago → **no** decay (sent ignored)                                                                      |
| New                    | 1 click 70d ago → −25 applied                                                                                                        |
| New                    | Multi-signal: 2 clicks + 2 referrals + qual = 48 (existing) still passes                                                             |

Batch tests: new `src/__tests__/lib/warmth-batch.test.ts` (or co-located) — mock Supabase chain; assert `.order("id")` called; assert `.in("referrer_id", pageIds)` uses page ids; cross-page referrer credited (covered fully in 15.5 if deferred — **prefer at least order + referrer query shape here**).

### Implementation order inside story

1. Update `warmth.ts` (T1–T4)
2. Fix/extend unit tests (T5)
3. `pnpm lint` && `pnpm test -- src/__tests__/lib` && `pnpm build`

## Files to Create/Modify

| File                                     | Change                                |
| ---------------------------------------- | ------------------------------------- |
| `src/lib/warmth.ts`                      | Primary scoring/batch fix             |
| `src/__tests__/lib/warmth.test.ts`       | Align with new tier/decay rules       |
| `src/__tests__/lib/warmth-batch.test.ts` | New (optional here, required by 15.5) |

## Risk

- First production cron after 15.0+15.1 reclassifies many rows — expected; watch false Cold on tiny lists (warning banner still requires ≥10 subscribers).
- Changing `calculateWarmthScore` arity breaks call sites — grep all imports before merging.
