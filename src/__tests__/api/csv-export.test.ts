import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

import { GET } from "../../app/api/subscribers/export/route";

const BASE_HEADER = "Email,Name,Position,Referrals,Warmth,Signup Date";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function makeGet(url: string) {
  return new Request(url);
}

describe("GET /api/subscribers/export (14.4 AC1/AC2e)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__queue.length = 0;
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const response = await GET(
      makeGet("http://localhost/api/subscribers/export?wid=w-1")
    );
    expect(response.status).toBe(401);
  });

  it("exports one column per configured question with RFC 4180 escaping", async () => {
    const created1 = "2026-01-05T12:00:00.000Z";
    const created2 = "2026-02-10T12:00:00.000Z";

    mockSupabase.__queue.push({
      data: { id: "w-1", subdomain: "acme" },
      error: null,
    });
    mockSupabase.__queue.push({
      data: [
        { id: "q1", question_text: "Company, size", sort_order: 0 },
        { id: "q2", question_text: "Role", sort_order: 1 },
      ],
      error: null,
    });
    mockSupabase.__queue.push({
      data: [
        {
          id: "s1",
          email: "a@b.com",
          display_name: "Ann",
          created_at: created1,
          warmth_score: "hot",
          qual_answers: { q1: "Acme, Inc", q2: "Engineer" },
        },
        {
          id: "s2",
          email: "solo@b.com",
          display_name: null,
          created_at: created2,
          warmth_score: null,
          qual_answers: null,
        },
      ],
      error: null,
    });
    mockSupabase.__queue.push({ data: [], error: null });

    const response = await GET(
      makeGet("http://localhost/api/subscribers/export?wid=w-1")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="acme-subscribers.csv"'
    );

    const csv = await response.text();
    const expected = [
      `${BASE_HEADER},"Company, size",Role`,
      `a@b.com,Ann,1,0,hot,"${formatDate(created1)}","Acme, Inc",Engineer`,
      `solo@b.com,,2,0,,"${formatDate(created2)}",,`,
    ].join("\n");
    expect(csv).toBe(expected);
  });

  it("exports base columns only when no questions are configured", async () => {
    const created = "2026-03-01T12:00:00.000Z";

    mockSupabase.__queue.push({
      data: { id: "w-1", subdomain: "plain" },
      error: null,
    });
    mockSupabase.__queue.push({ data: [], error: null });
    mockSupabase.__queue.push({
      data: [
        {
          id: "s1",
          email: "solo@b.com",
          display_name: null,
          created_at: created,
          warmth_score: "cold",
          qual_answers: null,
        },
      ],
      error: null,
    });
    mockSupabase.__queue.push({ data: [], error: null });

    const response = await GET(
      makeGet("http://localhost/api/subscribers/export?wid=w-1")
    );

    expect(response.status).toBe(200);
    const csv = await response.text();
    const lines = csv.split("\n");
    expect(lines[0]).toBe(BASE_HEADER);
    expect(lines[1]).toBe(`solo@b.com,,1,0,cold,"${formatDate(created)}"`);
  });

  it("escapes double quotes inside free-text answers", async () => {
    const created = "2026-04-01T12:00:00.000Z";

    mockSupabase.__queue.push({
      data: { id: "w-1", subdomain: "quoted" },
      error: null,
    });
    mockSupabase.__queue.push({
      data: [{ id: "q1", question_text: "Role", sort_order: 0 }],
      error: null,
    });
    mockSupabase.__queue.push({
      data: [
        {
          id: "s1",
          email: "q@b.com",
          display_name: null,
          created_at: created,
          warmth_score: null,
          qual_answers: { q1: 'Said "yes" today' },
        },
      ],
      error: null,
    });
    mockSupabase.__queue.push({ data: [], error: null });

    const response = await GET(
      makeGet("http://localhost/api/subscribers/export?wid=w-1")
    );

    expect(response.status).toBe(200);
    const csv = await response.text();
    expect(csv).toContain(`,"Said ""yes"" today"`);
  });

  it("returns plain-text notice when there are no subscribers", async () => {
    mockSupabase.__queue.push({
      data: { id: "w-1", subdomain: "empty" },
      error: null,
    });
    mockSupabase.__queue.push({ data: [], error: null });
    mockSupabase.__queue.push({ data: [], error: null });

    const response = await GET(
      makeGet("http://localhost/api/subscribers/export?wid=w-1")
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("No subscribers to export");
  });
});
