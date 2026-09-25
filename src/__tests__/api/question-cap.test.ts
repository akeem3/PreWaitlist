import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

import { POST, PATCH } from "../../app/api/waitlist/route";

function makeRequest(
  url: string,
  options?: { method?: string; body?: unknown }
) {
  return new Request(url, {
    method: options?.method || "GET",
    headers: { "Content-Type": "application/json" },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  }) as import("next/server").NextRequest;
}

function freeTextQuestions(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    text: `Question ${i + 1}`,
    type: "free_text" as const,
  }));
}

describe("server-side question cap (14.0 AC4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__queue.length = 0;
  });

  it("POST returns 400 when free tier exceeds 2 questions", async () => {
    mockSupabase.__queue.push({
      data: { id: "user-1", tier: "free" },
      error: null,
    });

    const response = await POST(
      makeRequest("http://localhost/api/waitlist", {
        method: "POST",
        body: {
          subdomain: "cap-test",
          questions: freeTextQuestions(3),
        },
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Too many questions");
  });

  it("POST returns 400 when pro tier exceeds 5 questions", async () => {
    mockSupabase.__queue.push({
      data: { id: "user-1", tier: "pro" },
      error: null,
    });

    const response = await POST(
      makeRequest("http://localhost/api/waitlist", {
        method: "POST",
        body: {
          subdomain: "cap-test",
          questions: freeTextQuestions(6),
        },
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Too many questions");
  });

  it("POST succeeds at exactly the free tier cap (2 questions)", async () => {
    mockSupabase.__queue.push({
      data: { id: "user-1", tier: "free" },
      error: null,
    });
    mockSupabase.__queue.push({ count: 0, data: null, error: null });
    mockSupabase.__queue.push({ data: { id: "wl-new" }, error: null });

    const response = await POST(
      makeRequest("http://localhost/api/waitlist", {
        method: "POST",
        body: {
          subdomain: "cap-test",
          questions: freeTextQuestions(2),
        },
      })
    );

    expect(response.status).toBe(201);
  });

  it("PATCH returns 400 when free tier owner exceeds 2 questions", async () => {
    mockSupabase.__queue.push({
      data: { id: "wl-1", founder_profiles: [{ tier: "free" }] },
      error: null,
    });

    const response = await PATCH(
      makeRequest("http://localhost/api/waitlist", {
        method: "PATCH",
        body: {
          waitlist_id: "wl-1",
          questions: freeTextQuestions(3),
        },
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Too many questions");
  });

  it("PATCH returns 400 when pro tier owner exceeds 5 questions", async () => {
    mockSupabase.__queue.push({
      data: { id: "wl-1", founder_profiles: [{ tier: "pro" }] },
      error: null,
    });

    const response = await PATCH(
      makeRequest("http://localhost/api/waitlist", {
        method: "PATCH",
        body: {
          waitlist_id: "wl-1",
          questions: freeTextQuestions(6),
        },
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Too many questions");
  });
});
