import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockBatch = vi.fn();
vi.mock("@/lib/warmth", () => ({
  batchRecalculateWarmth: () => mockBatch(),
}));

import { GET } from "../../app/api/cron/warmth/route";

const URL = "http://localhost/api/cron/warmth";
const originalSecret = process.env.CRON_SECRET;

describe("GET /api/cron/warmth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalSecret;
    }
  });

  it("returns 500 when CRON_SECRET is not configured", async () => {
    const response = await GET(new Request(URL));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("CRON_SECRET not configured");
    expect(mockBatch).not.toHaveBeenCalled();
  });

  it("returns 401 for a bad bearer token", async () => {
    process.env.CRON_SECRET = "s3cret";

    const response = await GET(
      new Request(URL, { headers: { authorization: "Bearer wrong" } })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
    expect(mockBatch).not.toHaveBeenCalled();
  });

  it("invokes batch with a valid bearer and returns counts JSON", async () => {
    process.env.CRON_SECRET = "s3cret";
    mockBatch.mockResolvedValue({
      processed: 1,
      hot: 0,
      warm: 1,
      cold: 0,
      unscored: 0,
    });

    const response = await GET(
      new Request(URL, { headers: { authorization: "Bearer s3cret" } })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      processed: 1,
      hot: 0,
      warm: 1,
      cold: 0,
      unscored: 0,
    });
    expect(mockBatch).toHaveBeenCalledTimes(1);
  });
});
