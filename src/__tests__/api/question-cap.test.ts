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

describe("grandfathered question saves (2.5 rule A)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__queue.length = 0;
    mockSupabase.__calls.length = 0;
  });

  function existingRows(count: number) {
    return Array.from({ length: count }, (_, i) => ({ id: `q-${i + 1}` }));
  }

  function pushGrandfatheredSave(existingCount: number, newCount: number) {
    // ownership lookup (free tier)
    mockSupabase.__queue.push({
      data: { id: "wl-1", founder_profiles: [{ tier: "free" }] },
      error: null,
    });
    // grandfather count query
    mockSupabase.__queue.push({
      data: null,
      error: null,
      count: existingCount,
    });
    // waitlist row update
    mockSupabase.__queue.push({ data: { id: "wl-1" }, error: null });
    // existing-question load (new questions carry no ids → all insert)
    mockSupabase.__queue.push({
      data: existingRows(existingCount),
      error: null,
    });
    // question insert
    mockSupabase.__queue.push({ data: [], error: null });
    // orphan delete (existing ids minus kept ids)
    if (existingCount > newCount) {
      mockSupabase.__queue.push({ data: [], error: null });
    }
  }

  it("free PATCH keeping 4 grandfathered questions succeeds", async () => {
    pushGrandfatheredSave(4, 4);

    const response = await PATCH(
      makeRequest("http://localhost/api/waitlist", {
        method: "PATCH",
        body: { waitlist_id: "wl-1", questions: freeTextQuestions(4) },
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it("free PATCH trimming 4 questions down to 2 succeeds", async () => {
    pushGrandfatheredSave(4, 2);

    const response = await PATCH(
      makeRequest("http://localhost/api/waitlist", {
        method: "PATCH",
        body: { waitlist_id: "wl-1", questions: freeTextQuestions(2) },
      })
    );

    expect(response.status).toBe(200);
  });

  it("free PATCH adding a 3rd question past the grandfathered size is rejected", async () => {
    // existing 2, new 3: past the free cap AND past the grandfathered size
    mockSupabase.__queue.push({
      data: { id: "wl-1", founder_profiles: [{ tier: "free" }] },
      error: null,
    });
    mockSupabase.__queue.push({ data: null, error: null, count: 2 });

    const response = await PATCH(
      makeRequest("http://localhost/api/waitlist", {
        method: "PATCH",
        body: { waitlist_id: "wl-1", questions: freeTextQuestions(3) },
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Too many questions");
  });
});
