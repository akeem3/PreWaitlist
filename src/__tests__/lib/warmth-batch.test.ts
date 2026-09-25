import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockAdminSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminSupabase,
}));

import { batchRecalculateWarmth } from "@/lib/warmth";

function now(): string {
  return new Date().toISOString();
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function subscriber(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    waitlist_id: "wl-1",
    qual_answers: null,
    referrer_id: null,
    created_at: now(),
    ...overrides,
  };
}

const noData = { data: null, error: null };
const emptyData = { data: [], error: null };

describe("batchRecalculateWarmth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminSupabase.__queue.length = 0;
    mockAdminSupabase.__calls.length = 0;
  });

  it("orders by id before range and scopes events to page ids (AC5)", async () => {
    mockAdminSupabase.__queue.push(
      { data: [subscriber("sub-a"), subscriber("sub-b")], error: null },
      emptyData,
      emptyData
    );

    const result = await batchRecalculateWarmth();

    const calls = mockAdminSupabase.__calls;
    const orderIdx = calls.findIndex(
      (c) => c.method === "order" && c.args[0] === "id"
    );
    const rangeIdx = calls.findIndex((c) => c.method === "range");

    expect(orderIdx).toBeGreaterThanOrEqual(0);
    expect(rangeIdx).toBeGreaterThan(orderIdx);
    expect(calls[orderIdx].args[1]).toEqual({ ascending: true });
    expect(calls[rangeIdx].args).toEqual([0, 499]);

    const eventsIn = calls.find(
      (c) => c.method === "in" && c.args[0] === "subscriber_id"
    );
    expect(eventsIn).toBeDefined();
    expect(eventsIn?.args[1]).toEqual(["sub-a", "sub-b"]);

    // Warmth restructure: fresh signups land at baseline 70 → hot
    expect(result).toEqual({
      processed: 2,
      hot: 2,
      warm: 0,
      cold: 0,
    });
  });

  it("credits referrals made by page members via referrer_id direction (AC6)", async () => {
    mockAdminSupabase.__queue.push(
      { data: [subscriber("sub-a")], error: null },
      emptyData,
      {
        data: [
          { referrer_id: "sub-a", created_at: now() },
          { referrer_id: "sub-a", created_at: now() },
          { referrer_id: "sub-a", created_at: now() },
        ],
        error: null,
      }
    );

    const result = await batchRecalculateWarmth();

    const calls = mockAdminSupabase.__calls;
    const refIn = calls.find(
      (c) => c.method === "in" && c.args[0] === "referrer_id"
    );
    expect(refIn).toBeDefined();
    expect(refIn?.args[1]).toEqual(["sub-a"]);

    const hotWrite = calls.find(
      (c) =>
        c.method === "update" &&
        (c.args[0] as { warmth_score?: string }).warmth_score === "hot"
    );
    expect(hotWrite).toBeDefined();

    // 70 + 3 referrals * 15 → clamped to 100 → hot
    expect(result).toEqual({
      processed: 1,
      hot: 1,
      warm: 0,
      cold: 0,
    });
  });

  it("writes only the tier string on update (AC7)", async () => {
    mockAdminSupabase.__queue.push(
      {
        data: [subscriber("sub-c", { qual_answers: { q1: "x" } })],
        error: null,
      },
      emptyData,
      emptyData
    );

    await batchRecalculateWarmth();

    const calls = mockAdminSupabase.__calls;
    const update = calls.find((c) => c.method === "update");
    expect(update).toBeDefined();
    expect(update?.args[0]).toEqual({ warmth_score: "hot" });
    expect(Object.keys(update?.args[0] as object)).toEqual(["warmth_score"]);

    const eq = calls.find((c) => c.method === "eq");
    expect(eq?.args).toEqual(["id", "sub-c"]);
  });

  it("classifies everyone — hot/warm/cold, never null (restructure)", async () => {
    const clicks = Array.from({ length: 15 }, () => ({
      subscriber_id: "sub-hot",
      event_type: "clicked",
      created_at: now(),
    }));

    mockAdminSupabase.__queue.push(
      {
        data: [
          subscriber("sub-hot"),
          subscriber("sub-warm", { created_at: daysAgo(70) }),
          subscriber("sub-cold", { created_at: daysAgo(100) }),
        ],
        error: null,
      },
      { data: clicks, error: null },
      emptyData
    );

    const result = await batchRecalculateWarmth();

    expect(result).toEqual({
      processed: 3,
      hot: 1,
      warm: 1,
      cold: 1,
    });

    const writes = mockAdminSupabase.__calls
      .filter((c) => c.method === "update")
      .map((c) => (c.args[0] as { warmth_score?: string | null }).warmth_score);

    expect(writes.sort()).toEqual(["cold", "hot", "warm"]);
    expect(writes).not.toContain(null);
    expect(writes).not.toContain(undefined);
  });

  it("pages through all subscribers exactly once and terminates (AC5)", async () => {
    const page1 = Array.from({ length: 500 }, (_, i) => subscriber(`p${i}`));
    const page2 = [subscriber("sub-last", { qual_answers: { q1: "a" } })];

    mockAdminSupabase.__queue.push(
      { data: page1, error: null },
      emptyData,
      emptyData,
      ...Array.from({ length: 500 }, () => noData),
      { data: page2, error: null },
      emptyData,
      emptyData
    );

    const result = await batchRecalculateWarmth();

    expect(result).toEqual({
      processed: 501,
      hot: 501,
      warm: 0,
      cold: 0,
    });

    const calls = mockAdminSupabase.__calls;
    expect(calls.filter((c) => c.method === "order").length).toBe(2);
    expect(calls.filter((c) => c.method === "range").length).toBe(2);
    expect(calls.filter((c) => c.method === "update").length).toBe(501);
  });
});
