import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const { mockSubGet } = vi.hoisted(() => ({ mockSubGet: vi.fn() }));

vi.mock("@paddle/paddle-node-sdk", () => ({
  Paddle: class {
    subscriptions = { get: mockSubGet };
  },
}));

const mockAdminSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminSupabase,
}));

const mockArchive = vi.fn();
vi.mock("@/lib/archive-surplus", () => ({
  archiveSurplusWaitlists: (...args: unknown[]) => mockArchive(...args),
}));

import { GET } from "../../app/api/cron/billing-reconcile/route";

const URL = "http://localhost/api/cron/billing-reconcile";
const originalSecret = process.env.CRON_SECRET;

const PRO_ROW = {
  id: "user-1",
  tier: "pro",
  paddle_subscription_id: "sub-1",
  paddle_subscription_status: "active",
};

function updatePayloads(): Record<string, unknown>[] {
  return mockAdminSupabase.__calls
    .filter((c) => c.method === "update")
    .map((c) => c.args[0] as Record<string, unknown>);
}

function authedRequest() {
  return new Request(URL, { headers: { authorization: "Bearer s3cret" } });
}

describe("GET /api/cron/billing-reconcile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminSupabase.__queue.length = 0;
    mockAdminSupabase.__calls.length = 0;
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
    const res = await GET(new Request(URL));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("CRON_SECRET not configured");
    expect(mockAdminSupabase.__calls.length).toBe(0);
  });

  it("returns 401 for a bad bearer token", async () => {
    process.env.CRON_SECRET = "s3cret";
    const res = await GET(
      new Request(URL, { headers: { authorization: "Bearer wrong" } })
    );
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Unauthorized");
    expect(mockAdminSupabase.__calls.length).toBe(0);
  });

  it("downgrades and archives a Pro row whose subscription is canceled", async () => {
    process.env.CRON_SECRET = "s3cret";
    mockAdminSupabase.__queue.push(
      { data: [PRO_ROW], error: null }, // pro lookup
      { data: [], error: null }, // free lookup
      { data: null, error: null } // downgrade update
    );
    mockSubGet.mockResolvedValueOnce({ status: "canceled" });
    mockArchive.mockResolvedValueOnce(undefined);

    const res = await GET(authedRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toMatchObject({
      checked: 1,
      downgraded: 1,
      upgraded: 0,
      healed: 0,
      errors: 0,
    });
    expect(updatePayloads()).toEqual([
      {
        tier: "free",
        paddle_subscription_status: "canceled",
        scheduled_change: null,
        paddle_next_billed_at: null,
      },
    ]);
    expect(mockArchive).toHaveBeenCalledWith(mockAdminSupabase, "user-1");
  });

  it("heals status drift on an active Pro row (past_due missed webhook)", async () => {
    process.env.CRON_SECRET = "s3cret";
    mockAdminSupabase.__queue.push(
      {
        data: [{ ...PRO_ROW, paddle_subscription_status: "active" }],
        error: null,
      },
      { data: [], error: null },
      { data: null, error: null }
    );
    mockSubGet.mockResolvedValueOnce({ status: "past_due" });

    const res = await GET(authedRequest());
    expect(res.status).toBe(200);

    expect((await res.json()).healed).toBe(1);
    expect(updatePayloads()).toEqual([
      { paddle_subscription_status: "past_due" },
    ]);
    expect(mockArchive).not.toHaveBeenCalled();
  });

  it("upgrades a Free row whose subscription is live (missed upgrade event)", async () => {
    process.env.CRON_SECRET = "s3cret";
    mockAdminSupabase.__queue.push(
      { data: [], error: null }, // pro lookup empty
      {
        data: [
          {
            id: "user-2",
            tier: "free",
            paddle_subscription_id: "sub-2",
            paddle_subscription_status: "canceled",
          },
        ],
        error: null,
      }, // free lookup
      { data: null, error: null } // upgrade update
    );
    mockSubGet.mockResolvedValueOnce({ status: "active" });

    const res = await GET(authedRequest());
    expect(res.status).toBe(200);

    expect((await res.json()).upgraded).toBe(1);
    expect(updatePayloads()).toEqual([
      { tier: "pro", paddle_subscription_status: "active" },
    ]);
  });

  it("counts an error and writes NOTHING when the Paddle lookup throws", async () => {
    process.env.CRON_SECRET = "s3cret";
    mockAdminSupabase.__queue.push(
      { data: [PRO_ROW], error: null },
      { data: [], error: null }
    );
    mockSubGet.mockRejectedValueOnce(new Error("Paddle 404"));

    const res = await GET(authedRequest());
    expect(res.status).toBe(200);

    expect(await res.json()).toMatchObject({
      checked: 1,
      downgraded: 0,
      healed: 0,
      errors: 1,
    });
    expect(updatePayloads()).toHaveLength(0);
    expect(mockArchive).not.toHaveBeenCalled();
  });

  it("skips a Pro row whose stored status already matches Paddle", async () => {
    process.env.CRON_SECRET = "s3cret";
    mockAdminSupabase.__queue.push(
      { data: [PRO_ROW], error: null },
      { data: [], error: null }
    );
    mockSubGet.mockResolvedValueOnce({ status: "active" });

    const res = await GET(authedRequest());
    expect(res.status).toBe(200);

    expect(await res.json()).toMatchObject({
      checked: 1,
      skipped: 1,
      downgraded: 0,
      healed: 0,
    });
    expect(updatePayloads()).toHaveLength(0);
  });

  it("returns 500 when the profile lookup fails", async () => {
    process.env.CRON_SECRET = "s3cret";
    mockAdminSupabase.__queue.push({
      data: null,
      error: { message: "db down" },
    });

    const res = await GET(authedRequest());
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("db down");
  });
});
