import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", async () => {
  const actual = await vi.importActual("next/server");
  return {
    ...actual,
    after: vi.fn((fn: () => void) => fn()),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/positions", () => ({
  recalculatePositions: vi.fn().mockResolvedValue([]),
  getPositionUpdate: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/milestones", () => ({
  checkAndFulfillMilestones: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
  buildEmailFooter: vi.fn().mockReturnValue(""),
  buildFreeEmailFooter: vi.fn().mockReturnValue(""),
  isUnsubscribed: vi.fn().mockResolvedValue(false),
  interpolateEmail: vi.fn((s: string) => s),
}));

vi.mock("@/lib/bounces", () => ({
  isEmailBounced: vi.fn().mockResolvedValue(false),
}));

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const mockCreateClient = vi.mocked(createClient);
const mockCreateAdminClient = vi.mocked(createAdminClient);

function makeChain(data: unknown, error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  };
  return chain;
}

describe("POST /api/subscribers — 500 cap check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when Free tier cap is hit (subscriber_count >= 500)", async () => {
    const capData = {
      subscriber_count: 500,
      founder_profiles: { tier: "free" },
    };

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue(makeChain(capData)),
    } as ReturnType<typeof createClient>);

    const { POST } = await import("@/app/api/subscribers/route");
    const req = new Request("http://localhost/api/subscribers", {
      method: "POST",
      body: JSON.stringify({
        waitlist_id: "w-1",
        email: "test@example.com",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("Subscriber limit reached");
  });

  it("returns 403 at exactly 500 subscribers", async () => {
    const capData = {
      subscriber_count: 500,
      founder_profiles: { tier: "free" },
    };

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue(makeChain(capData)),
    } as ReturnType<typeof createClient>);

    const { POST } = await import("@/app/api/subscribers/route");
    const req = new Request("http://localhost/api/subscribers", {
      method: "POST",
      body: JSON.stringify({
        waitlist_id: "w-1",
        email: "test@example.com",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("does not return 403 for Pro tier at 600 subscribers", async () => {
    const capData = {
      subscriber_count: 600,
      founder_profiles: { tier: "pro" },
    };

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue(makeChain(capData)),
    } as ReturnType<typeof createClient>);

    // Cap passes — insert path uses admin client
    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue(
        makeChain({
          id: "sub-1",
          email: "test@example.com",
          referral_code: "abc12345",
          position: 1,
        })
      ),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { email: "test@example.com" } },
            error: null,
          }),
        },
      },
    } as unknown as ReturnType<typeof createAdminClient>);

    const { POST } = await import("@/app/api/subscribers/route");
    const req = new Request("http://localhost/api/subscribers", {
      method: "POST",
      body: JSON.stringify({
        waitlist_id: "w-1",
        email: "test@example.com",
      }),
    });
    const res = await POST(req);
    // Pro bypasses cap — should not be 403
    expect(res.status).not.toBe(403);
  });
});
