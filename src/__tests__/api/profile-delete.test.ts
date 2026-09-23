import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCancel = vi.hoisted(() => vi.fn());

vi.hoisted(() => {
  process.env.PADDLE_API_KEY = "pdl_test_key";
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@paddle/paddle-node-sdk", () => ({
  Paddle: class {
    subscriptions = {
      cancel: mockCancel,
    };
  },
}));

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DELETE } from "@/app/api/profile/route";

const mockCreateClient = vi.mocked(createClient);
const mockCreateAdminClient = vi.mocked(createAdminClient);

function buildUserClient(user: { id: string; email?: string } | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user ? null : { message: "unauthorized" },
      }),
    },
  };
}

function buildAdminClient({
  profile = null,
  deleteUserError = null,
}: {
  profile?: { paddle_subscription_id: string | null } | null;
  deleteUserError?: { message: string } | null;
} = {}) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: profile, error: null });
  const from = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle,
  }));

  return {
    from,
    auth: {
      admin: {
        deleteUser: vi.fn().mockResolvedValue({
          data: null,
          error: deleteUserError,
        }),
      },
    },
  };
}

describe("DELETE /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PADDLE_API_KEY = "pdl_test_key";
    mockCancel.mockResolvedValue({} as never);
  });

  it("returns 401 when unauthenticated", async () => {
    mockCreateClient.mockResolvedValue(
      buildUserClient(null) as unknown as Awaited<
        ReturnType<typeof createClient>
      >
    );

    const res = await DELETE();
    expect(res.status).toBe(401);
  });

  it("deletes auth user only (relies on FK cascade) when no subscription", async () => {
    mockCreateClient.mockResolvedValue(
      buildUserClient({ id: "user-1", email: "a@b.com" }) as unknown as Awaited<
        ReturnType<typeof createClient>
      >
    );
    const admin = buildAdminClient({
      profile: { paddle_subscription_id: null },
    });
    mockCreateAdminClient.mockReturnValue(
      admin as unknown as ReturnType<typeof createAdminClient>
    );

    const res = await DELETE();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(admin.auth.admin.deleteUser).toHaveBeenCalledWith("user-1");
    expect(mockCancel).not.toHaveBeenCalled();
    expect(admin.from).toHaveBeenCalledTimes(1);
    expect(admin.from).toHaveBeenCalledWith("founder_profiles");
  });

  it("cancels Paddle subscription before deleting when subscription exists", async () => {
    mockCreateClient.mockResolvedValue(
      buildUserClient({ id: "user-1", email: "a@b.com" }) as unknown as Awaited<
        ReturnType<typeof createClient>
      >
    );
    const admin = buildAdminClient({
      profile: { paddle_subscription_id: "sub_123" },
    });
    mockCreateAdminClient.mockReturnValue(
      admin as unknown as ReturnType<typeof createAdminClient>
    );

    const res = await DELETE();
    expect(res.status).toBe(200);
    expect(mockCancel).toHaveBeenCalledWith("sub_123", {
      effectiveFrom: "immediately",
    });
    expect(admin.auth.admin.deleteUser).toHaveBeenCalledWith("user-1");
  });

  it("returns 409 and does not delete when Paddle cancel fails", async () => {
    mockCreateClient.mockResolvedValue(
      buildUserClient({ id: "user-1", email: "a@b.com" }) as unknown as Awaited<
        ReturnType<typeof createClient>
      >
    );
    const admin = buildAdminClient({
      profile: { paddle_subscription_id: "sub_123" },
    });
    mockCreateAdminClient.mockReturnValue(
      admin as unknown as ReturnType<typeof createAdminClient>
    );
    mockCancel.mockRejectedValue(new Error("network"));

    const res = await DELETE();
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/Could not cancel your subscription/);
    expect(admin.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("returns 500 when deleteUser fails", async () => {
    mockCreateClient.mockResolvedValue(
      buildUserClient({ id: "user-1", email: "a@b.com" }) as unknown as Awaited<
        ReturnType<typeof createClient>
      >
    );
    const admin = buildAdminClient({
      profile: null,
      deleteUserError: { message: "boom" },
    });
    mockCreateAdminClient.mockReturnValue(
      admin as unknown as ReturnType<typeof createAdminClient>
    );

    const res = await DELETE();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Failed to delete account");
  });
});
