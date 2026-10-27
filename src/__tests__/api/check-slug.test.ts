import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

import { GET } from "../../app/api/waitlist/check-slug/route";

describe("GET /api/waitlist/check-slug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__queue.length = 0;
    mockSupabase.__calls.length = 0;
  });

  it("rejects malformed subdomains before querying", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/waitlist/check-slug?slug=ABC%20DEF!!"
      )
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid subdomain format",
    });
    expect(mockSupabase.__calls).toHaveLength(0);
  });

  it("reports reserved subdomains distinctly", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/waitlist/check-slug?slug=admin")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      available: false,
      reason: "reserved",
    });
    expect(mockSupabase.__calls).toHaveLength(0);
  });

  it("queries availability for a valid subdomain", async () => {
    mockSupabase.__queue.push({ data: null, error: null });
    const response = await GET(
      new NextRequest("http://localhost/api/waitlist/check-slug?slug=acme")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ available: true });
  });
});
