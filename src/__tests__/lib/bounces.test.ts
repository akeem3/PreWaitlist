import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isEmailBounced } from "@/lib/bounces";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

describe("isEmailBounced", () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-14T12:00:00Z"));
    mockSupabase = createMockSupabaseClient();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false when no bounce record exists", async () => {
    mockSupabase.__queue.push({ data: null, error: null });
    const result = await isEmailBounced(
      mockSupabase as never,
      "wl-1",
      "test@example.com"
    );
    expect(result).toBe(false);
  });

  it("returns true for hard bounce", async () => {
    mockSupabase.__queue.push({
      data: {
        id: "b-1",
        bounce_type: "hard",
        created_at: "2026-09-14T10:00:00Z",
      },
      error: null,
    });
    const result = await isEmailBounced(
      mockSupabase as never,
      "wl-1",
      "test@example.com"
    );
    expect(result).toBe(true);
  });

  it("returns true for soft bounce within 24 hours", async () => {
    mockSupabase.__queue.push({
      data: {
        id: "b-1",
        bounce_type: "soft",
        created_at: "2026-09-14T11:00:00Z",
      },
      error: null,
    });
    const result = await isEmailBounced(
      mockSupabase as never,
      "wl-1",
      "test@example.com"
    );
    expect(result).toBe(true);
  });
});
