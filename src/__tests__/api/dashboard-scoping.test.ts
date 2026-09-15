import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

import { GET as chartGET } from "../../app/api/dashboard/chart/route";
import { GET as qualGET } from "../../app/api/dashboard/qualification/route";
import { GET as warmthGET } from "../../app/api/dashboard/warmth/route";

function makeRequest(url: string) {
  return new Request(url) as import("next/server").NextRequest;
}

describe("Dashboard API waitlist_id scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chart returns 400 when waitlist_id is missing", async () => {
    const response = await chartGET(
      makeRequest("http://localhost/api/dashboard/chart")
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("waitlist_id is required");
  });

  it("qualification returns 400 when waitlist_id is missing", async () => {
    const response = await qualGET(
      makeRequest("http://localhost/api/dashboard/qualification")
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("waitlist_id is required");
  });

  it("warmth returns 400 when waitlist_id is missing", async () => {
    const response = await warmthGET(
      makeRequest("http://localhost/api/dashboard/warmth")
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("waitlist_id is required");
  });
});
