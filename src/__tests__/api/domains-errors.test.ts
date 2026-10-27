import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const { createDomain, verifyDomain, getDomain } = vi.hoisted(() => ({
  createDomain: vi.fn(),
  verifyDomain: vi.fn(),
  getDomain: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    domains = {
      create: createDomain,
      verify: verifyDomain,
      get: getDomain,
    };
  },
}));

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

import { POST as createDomainPost } from "../../app/api/waitlist/domains/route";
import { POST as verifyDomainPost } from "../../app/api/waitlist/domains/verify/route";

describe("domain API error responses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__queue.length = 0;
    mockSupabase.__calls.length = 0;
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "founder@example.com" } },
      error: null,
    });
  });

  it("does not echo Resend domain-creation errors", async () => {
    mockSupabase.__queue.push(
      { data: { tier: "pro" }, error: null },
      { data: { id: "wl-1", resend_domain_id: null }, error: null }
    );
    createDomain.mockResolvedValueOnce({
      data: null,
      error: { message: "private Resend detail" },
    });
    const request = new Request("http://localhost/api/waitlist/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: "example.com" }),
    });

    const response = await createDomainPost(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Something went wrong. Please try again.",
    });
  });

  it("does not echo Resend verification errors", async () => {
    mockSupabase.__queue.push({
      data: { id: "wl-1", resend_domain_id: "domain-1" },
      error: null,
    });
    verifyDomain.mockResolvedValueOnce({
      data: null,
      error: { message: "private verification detail" },
    });

    const response = await verifyDomainPost();

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Something went wrong. Please try again.",
    });
    expect(getDomain).not.toHaveBeenCalled();
  });

  it("does not echo Resend status-lookup errors", async () => {
    mockSupabase.__queue.push({
      data: { id: "wl-1", resend_domain_id: "domain-1" },
      error: null,
    });
    verifyDomain.mockResolvedValueOnce({ data: {}, error: null });
    getDomain.mockResolvedValueOnce({
      data: null,
      error: { message: "private status detail" },
    });

    const response = await verifyDomainPost();

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Something went wrong. Please try again.",
    });
  });
});
