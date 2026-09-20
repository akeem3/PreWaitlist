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

vi.mock("@/lib/tier-gating", () => ({
  isPro: vi.fn((tier: string) => tier === "pro"),
  requirePro: vi.fn((tier: string, feature: string) => {
    if (tier !== "pro")
      return { allowed: false, reason: `${feature} requires Pro` };
    return { allowed: true };
  }),
}));

import { createClient } from "@/lib/supabase/server";

const mockCreateClient = vi.mocked(createClient);

function buildMockClient(
  authUser: { id: string } | null,
  profileData: Record<string, unknown> | null
) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: profileData,
      error: profileData ? null : { message: "not found" },
    }),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: profileData,
      error: profileData ? null : { message: "not found" },
    }),
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authUser },
        error: authUser ? null : { message: "not authenticated" },
      }),
    },
    from: vi.fn().mockReturnValue(chain),
  };
}

describe("POST /api/billing/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PADDLE_PRO_PRICE_ID = "price_test_123";
  });

  it("returns 401 for unauthenticated user", async () => {
    mockCreateClient.mockResolvedValue(
      buildMockClient(null, null) as ReturnType<typeof createClient>
    );

    const { POST } = await import("@/app/api/billing/checkout/route");
    const req = new Request("http://localhost/api/billing/checkout", {
      method: "POST",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/webhooks/paddle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects requests without PADDLE_WEBHOOK_SECRET", async () => {
    const originalSecret = process.env.PADDLE_WEBHOOK_SECRET;
    delete process.env.PADDLE_WEBHOOK_SECRET;

    const { POST } = await import("@/app/api/webhooks/paddle/route");
    const req = new Request("http://localhost/api/webhooks/paddle", {
      method: "POST",
      body: "{}",
      headers: { "paddle-signature": "sig" },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);

    process.env.PADDLE_WEBHOOK_SECRET = originalSecret;
  });
});
