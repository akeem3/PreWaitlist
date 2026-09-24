import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

import { GET } from "../../app/api/dashboard/qualification/route";

function makeRequest(url: string) {
  return new Request(url) as import("next/server").NextRequest;
}

describe("GET /api/dashboard/qualification (14.3 AC1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__queue.length = 0;
    mockSupabase.__calls.length = 0;
  });

  it("returns id-keyed shape with respondentCount, percent, and respondentTotal", async () => {
    // Ownership check, questions, subscribers
    mockSupabase.__queue.push({ data: { id: "wl-1" }, error: null });
    mockSupabase.__queue.push({
      data: [
        {
          id: "q1",
          question_text: "How did you hear about us?",
          question_type: "multiple_choice",
          options: ["Twitter", "Friend"],
        },
        {
          id: "q2",
          question_text: "What do you expect?",
          question_type: "free_text",
          options: null,
        },
      ],
      error: null,
    });
    mockSupabase.__queue.push({
      data: [
        { qual_answers: { q1: "Twitter", q2: "A great product" } },
        { qual_answers: { q1: "Friend", q2: "A great product" } },
        { qual_answers: { q1: "Twitter" } },
        // Orphan key from a deleted question must be ignored
        { qual_answers: { q1: "Twitter", deleted_q: "stale" } },
      ],
      error: null,
    });

    const response = await GET(
      makeRequest(
        "http://localhost/api/dashboard/qualification?waitlist_id=wl-1"
      )
    );
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.respondentTotal).toBe(4);
    expect(body.questions).toHaveLength(2);

    const mc = body.questions[0];
    expect(mc.id).toBe("q1");
    expect(mc.text).toBe("How did you hear about us?");
    expect(mc.type).toBe("multiple_choice");
    expect(mc.options).toEqual(["Twitter", "Friend"]);
    expect(mc.respondentCount).toBe(4);
    // Sorted by count desc: Twitter (3) before Friend (1)
    expect(mc.answers[0]).toEqual({ value: "Twitter", count: 3, percent: 75 });
    expect(mc.answers[1]).toEqual({ value: "Friend", count: 1, percent: 25 });

    const ft = body.questions[1];
    expect(ft.id).toBe("q2");
    expect(ft.type).toBe("free_text");
    expect(ft.options).toBeNull();
    expect(ft.respondentCount).toBe(2);
    expect(ft.answers[0]).toEqual({
      value: "A great product",
      count: 2,
      percent: 100,
    });

    expect(response.headers.get("Cache-Control")).toContain("s-maxage=30");
  });

  it("breaks count ties by value ascending", async () => {
    mockSupabase.__queue.push({ data: { id: "wl-1" }, error: null });
    mockSupabase.__queue.push({
      data: [
        {
          id: "q1",
          question_text: "Which?",
          question_type: "multiple_choice",
          options: null,
        },
      ],
      error: null,
    });
    mockSupabase.__queue.push({
      data: [
        { qual_answers: { q1: "beta" } },
        { qual_answers: { q1: "alpha" } },
        { qual_answers: { q1: "gamma" } },
      ],
      error: null,
    });

    const response = await GET(
      makeRequest(
        "http://localhost/api/dashboard/qualification?waitlist_id=wl-1"
      )
    );
    const body = await response.json();
    const values = body.questions[0].answers.map(
      (a: { value: string }) => a.value
    );
    expect(values).toEqual(["alpha", "beta", "gamma"]);
  });

  it("returns empty shape with respondentTotal 0 when no questions", async () => {
    mockSupabase.__queue.push({ data: { id: "wl-1" }, error: null });
    mockSupabase.__queue.push({ data: [], error: null });

    const response = await GET(
      makeRequest(
        "http://localhost/api/dashboard/qualification?waitlist_id=wl-1"
      )
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ questions: [], respondentTotal: 0 });
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=30");
  });

  it("requires auth", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const response = await GET(
      makeRequest(
        "http://localhost/api/dashboard/qualification?waitlist_id=wl-1"
      )
    );
    expect(response.status).toBe(401);
  });

  it("requires waitlist_id", async () => {
    const response = await GET(
      makeRequest("http://localhost/api/dashboard/qualification")
    );
    expect(response.status).toBe(400);
  });
});
