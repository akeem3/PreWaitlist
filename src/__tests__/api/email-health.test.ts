import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

import { GET } from "../../app/api/dashboard/email-health/route";

describe("GET /api/dashboard/email-health", () => {
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

  it("reports no hit when the founder has no waitlists", async () => {
    mockSupabase.__queue.push({ data: [], error: null });

    const res = await GET();
    expect(await res.json()).toMatchObject({ quotaHit: false });
  });

  it("reports a monthly hit when monthly-quota rows exist", async () => {
    mockSupabase.__queue.push({ data: [{ id: "wl-1" }], error: null });
    mockSupabase.__queue.push({
      data: [
        {
          event_data: { error_name: "monthly_quota_exceeded" },
          created_at: "2026-09-29T10:00:00Z",
        },
        {
          event_data: { error_name: "daily_quota_exceeded" },
          created_at: "2026-09-29T09:00:00Z",
        },
      ],
      error: null,
    });

    const res = await GET();
    expect(await res.json()).toMatchObject({
      quotaHit: true,
      kind: "monthly",
      failedCount24h: 2,
      lastFailureAt: "2026-09-29T10:00:00Z",
    });
  });

  it("ignores non-quota failures", async () => {
    mockSupabase.__queue.push({ data: [{ id: "wl-1" }], error: null });
    mockSupabase.__queue.push({
      data: [
        {
          event_data: { error: "invalid address" },
          created_at: "2026-09-29T10:00:00Z",
        },
      ],
      error: null,
    });

    const res = await GET();
    expect(await res.json()).toMatchObject({ quotaHit: false });
  });
});
