import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDrain } = vi.hoisted(() => ({ mockDrain: vi.fn() }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/retry-queue", () => ({
  drainEmailRetryQueue: mockDrain,
}));

import { GET } from "../../app/api/cron/email-retry/route";

function cronRequest(secret: string | null) {
  return new Request("http://localhost/api/cron/email-retry", {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

describe("GET /api/cron/email-retry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    mockDrain.mockResolvedValue({
      processed: 2,
      sent: 1,
      reparked: 1,
      deadLettered: 0,
    });
  });

  it("rejects requests with a wrong cron secret", async () => {
    const res = await GET(cronRequest("wrong"));
    expect(res.status).toBe(401);
    expect(mockDrain).not.toHaveBeenCalled();
  });

  it("rejects requests with no authorization header", async () => {
    const res = await GET(cronRequest(null));
    expect(res.status).toBe(401);
    expect(mockDrain).not.toHaveBeenCalled();
  });

  it("returns 500 when CRON_SECRET is not configured", async () => {
    const original = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "";
    try {
      const res = await GET(cronRequest("test-cron-secret"));
      expect(res.status).toBe(500);
      expect(mockDrain).not.toHaveBeenCalled();
    } finally {
      process.env.CRON_SECRET = original;
    }
  });

  it("drains the queue and returns counts", async () => {
    const res = await GET(cronRequest("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      processed: 2,
      sent: 1,
      reparked: 1,
      deadLettered: 0,
    });
  });
});
