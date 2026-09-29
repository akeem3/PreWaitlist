import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

process.env.UNSUBSCRIBE_SECRET = "test-secret-key-for-unit-tests";

const mockAdminSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminSupabase,
}));

import { POST } from "../../app/api/unsubscribe/resubscribe/route";
import { generateUnsubscribeToken } from "@/lib/unsubscribe";

function postToken(token: unknown) {
  return new NextRequest("http://localhost/api/unsubscribe/resubscribe", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

describe("POST /api/unsubscribe/resubscribe (4.6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminSupabase.__queue.length = 0;
    mockAdminSupabase.__calls.length = 0;
  });

  it("rejects missing and invalid tokens with 400", async () => {
    const missing = await POST(postToken(undefined));
    expect(missing.status).toBe(400);

    const bad = await POST(postToken("bogus"));
    expect(bad.status).toBe(400);
  });

  it("resubscribes on a valid token with a matched row", async () => {
    const token = generateUnsubscribeToken("sub-1");
    mockAdminSupabase.__queue.push({ data: { id: "sub-1" }, error: null });

    const res = await POST(postToken(token));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const updates = mockAdminSupabase.__calls.filter(
      (c) => c.method === "update"
    );
    expect(updates).toHaveLength(1);
    expect(updates[0].args[0]).toMatchObject({ unsubscribed_at: null });
  });

  it("returns 404 when the token verifies but no row matches (no silent success)", async () => {
    const token = generateUnsubscribeToken("sub-gone");
    mockAdminSupabase.__queue.push({ data: null, error: null });

    const res = await POST(postToken(token));

    expect(res.status).toBe(404);
  });
});
