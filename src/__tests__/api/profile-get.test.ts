import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

const mockAdminSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminSupabase,
}));

import { GET } from "../../app/api/profile/route";

describe("GET /api/profile — Phase 2 billing fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__queue.length = 0;
    mockSupabase.__calls.length = 0;
  });

  it("returns 401 for unauthenticated user", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns scheduled change, subscription status, next bill date and waitlist count", async () => {
    mockSupabase.__queue.push({
      data: {
        display_name: "Ada",
        avatar_url: null,
        bio: null,
        tier: "pro",
        created_at: "2026-01-01T00:00:00Z",
        scheduled_change: {
          action: "cancel",
          effective_at: "2026-11-01T00:00:00Z",
        },
        paddle_subscription_status: "active",
        paddle_next_billed_at: "2026-11-01T00:00:00Z",
      },
      error: null,
    });
    mockSupabase.__queue.push({
      data: { business_address: null },
      error: null,
    });
    mockSupabase.__queue.push({ data: null, error: null, count: 3 });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      tier: "pro",
      scheduledChange: {
        action: "cancel",
        effective_at: "2026-11-01T00:00:00Z",
      },
      subscriptionStatus: "active",
      nextBilledAt: "2026-11-01T00:00:00Z",
      waitlistCount: 3,
    });
  });

  it("falls back to the core select when new columns are missing (PGRST204)", async () => {
    mockSupabase.__queue.push({
      data: null,
      error: { message: "column does not exist", code: "PGRST204" },
    });
    mockSupabase.__queue.push({
      data: { tier: "free", created_at: null },
      error: null,
    });
    mockSupabase.__queue.push({ data: null, error: null });
    mockSupabase.__queue.push({ data: null, error: null, count: 1 });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      tier: "free",
      scheduledChange: null,
      subscriptionStatus: null,
      nextBilledAt: null,
      waitlistCount: 1,
    });
  });

  it("excludes archived waitlists from the count", async () => {
    mockSupabase.__queue.push({
      data: { tier: "free", created_at: null },
      error: null,
    });
    mockSupabase.__queue.push({ data: null, error: null });
    mockSupabase.__queue.push({ data: null, error: null, count: 1 });

    const res = await GET();
    expect(res.status).toBe(200);
    // Active-only count: archived surplus must not inflate the banner
    expect(mockSupabase.__calls).toContainEqual({
      method: "eq",
      args: ["is_archived", false],
    });
  });
});
