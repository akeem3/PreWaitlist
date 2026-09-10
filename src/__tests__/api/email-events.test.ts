import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

import { GET } from "../../app/api/dashboard/email-events/route";

describe("GET /api/dashboard/email-events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const request = new NextRequest(
      "http://localhost/api/dashboard/email-events?subscriber_id=sub-1"
    );
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("returns 400 when subscriber_id is missing", async () => {
    const request = new NextRequest(
      "http://localhost/api/dashboard/email-events"
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("subscriber_id");
  });

  it("returns 404 when subscriber belongs to another founder", async () => {
    mockSupabase.__queue.push({
      data: {
        id: "sub-1",
        waitlists: { founder_id: "other-user" },
      },
      error: null,
    });

    const request = new NextRequest(
      "http://localhost/api/dashboard/email-events?subscriber_id=sub-1"
    );
    const response = await GET(request);

    expect(response.status).toBe(404);
  });

  it("returns events for authenticated founder's subscriber", async () => {
    mockSupabase.__queue.push(
      {
        data: {
          id: "sub-1",
          waitlists: { founder_id: "user-1" },
        },
        error: null,
      },
      {
        data: [
          {
            id: "evt-1",
            event_type: "clicked",
            event_data: { url: "https://example.com" },
            created_at: "2026-09-10T10:00:00Z",
          },
          {
            id: "evt-2",
            event_type: "delivered",
            event_data: null,
            created_at: "2026-09-09T10:00:00Z",
          },
        ],
        error: null,
      }
    );

    const request = new NextRequest(
      "http://localhost/api/dashboard/email-events?subscriber_id=sub-1"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.events).toHaveLength(2);
    expect(data.events[0].event_type).toBe("clicked");
    expect(data.events[1].event_type).toBe("delivered");
  });

  it("returns empty array when subscriber has no events", async () => {
    mockSupabase.__queue.push(
      {
        data: {
          id: "sub-1",
          waitlists: { founder_id: "user-1" },
        },
        error: null,
      },
      {
        data: [],
        error: null,
      }
    );

    const request = new NextRequest(
      "http://localhost/api/dashboard/email-events?subscriber_id=sub-1"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.events).toEqual([]);
  });
});
