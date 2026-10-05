import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockGetUser } = vi.hoisted(() => ({ mockGetUser: vi.fn() }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

import { updateSession } from "@/lib/supabase/middleware";

function request(path: string) {
  return new NextRequest(`http://localhost${path}`);
}

describe("updateSession Phase-B guard (4.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    "/onboarding/4",
    "/onboarding/4a",
    "/onboarding/5",
    "/onboarding/success",
  ])("redirects unauth %s to /onboarding/signup", async (path) => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await updateSession(request(path));

    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("location")).toContain("/onboarding/signup");
  });

  it("lets unauth Phase-A routes through", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    for (const path of [
      "/onboarding/1",
      "/onboarding/2",
      "/onboarding/3",
      "/onboarding/signup",
    ]) {
      const res = await updateSession(request(path));
      const location = res.headers.get("location") ?? "";
      expect(location).not.toContain("/onboarding/signup");
      expect(location).not.toContain("/signin");
    }
  });

  it("lets authenticated users into Phase B", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const res = await updateSession(request("/onboarding/4"));

    expect(res.headers.get("location")).toBeNull();
  });

  it("keeps the generic /signin redirect for other private routes", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await updateSession(request("/dashboard"));

    expect(res.headers.get("location")).toContain("/signin");
  });

  it("serves the og:image route to anonymous crawlers (no signin redirect)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await updateSession(request("/opengraph-image"));

    expect(res.headers.get("location")).toBeNull();
    expect(res.status).toBe(200);
  });

  it("serves nested /{subdomain}/opengraph-image routes without a signin redirect", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await updateSession(
      request("/bat/opengraph-image-lc1qod?4869dfc4c98cc4ec")
    );

    expect(res.headers.get("location")).toBeNull();
    expect(res.status).toBe(200);
  });

  it.each(["/legal/terms", "/legal/privacy", "/unsubscribe?token=abc123"])(
    "serves public compliance route %s to anonymous visitors",
    async (path) => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const res = await updateSession(request(path));

      expect(res.headers.get("location")).toBeNull();
      expect(res.status).toBe(200);
    }
  );

  it("still redirects anonymous visitors away from private routes", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    for (const path of ["/dashboard", "/settings", "/updates"]) {
      const res = await updateSession(request(path));
      expect(res.headers.get("location")).toContain("/signin");
    }
  });
});
