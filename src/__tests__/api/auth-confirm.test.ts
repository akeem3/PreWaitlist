import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from "@supabase/ssr";

const mockCreateServerClient = vi.mocked(createServerClient);

type VerifyOtpResult = {
  data: { user: { id: string } | null; session?: unknown };
  error: { name: string; status?: number; message: string } | null;
};

interface ClientOptions {
  verifyOtp?: () => Promise<VerifyOtpResult>;
  verifyOtpResult?: VerifyOtpResult;
  upsertResult?: { data: null; error: null };
  upsertThrows?: boolean;
  waitlistCount?: number;
}

function buildClient({
  verifyOtp,
  verifyOtpResult = { data: { user: { id: "user-1" } }, error: null },
  upsertResult = { data: null, error: null },
  upsertThrows = false,
  waitlistCount = 3,
}: ClientOptions = {}) {
  const upsert = upsertThrows
    ? vi.fn().mockRejectedValue(new Error("network"))
    : vi.fn().mockResolvedValue(upsertResult);
  const select = vi.fn(() => ({
    eq: vi.fn().mockResolvedValue({ count: waitlistCount, error: null }),
  }));
  const from = vi.fn((table: string) => {
    if (table === "founder_profiles") return { upsert };
    if (table === "waitlists") return { select };
    throw new Error(`unexpected table in this test: ${table}`);
  });
  return {
    auth: {
      verifyOtp: verifyOtp
        ? vi.fn().mockImplementation(verifyOtp)
        : vi.fn().mockResolvedValue(verifyOtpResult),
    },
    from,
    upsert,
    select,
  };
}

/**
 * happy-dom (test env) strips the forbidden `cookie` request header, so a real
 * NextRequest can't carry it — the route only touches `request.url` and
 * `request.cookies.get()`/`getAll()`, so a Request with a cookies shim is
 * sufficient.
 */
function makeRequest(
  query: string,
  cookies: Record<string, string> = {}
): NextRequest {
  const base = new Request(`http://localhost/auth/confirm${query}`);
  const entries = Object.entries(cookies);
  return Object.assign(base, {
    cookies: {
      get: (name: string) =>
        cookies[name] !== undefined
          ? { name, value: cookies[name] }
          : undefined,
      getAll: () => entries.map(([name, value]) => ({ name, value })),
      set: (name: string, value: string) => {
        cookies[name] = value;
      },
    },
  }) as unknown as NextRequest;
}

async function run(
  query: string,
  client: ReturnType<typeof buildClient>,
  cookies: Record<string, string> = {}
) {
  mockCreateServerClient.mockReturnValue(
    client as unknown as ReturnType<typeof createServerClient>
  );
  const { GET } = await import("@/app/auth/confirm/route");
  return GET(makeRequest(query, cookies));
}

function errorDiag(res: Response): Record<string, string | number> {
  const location = new URL(res.headers.get("location")!);
  expect(location.pathname).toBe("/auth/auth-code-error");
  return JSON.parse(location.searchParams.get("d")!);
}

const ACQUISITION = JSON.stringify({
  ref: "tw",
  utm_source: "twitter",
  utm_medium: "social",
  utm_campaign: "launch-2026",
});

describe("GET /auth/confirm — token_hash verification (signup + recovery)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verifies a signup token and redirects to the dashboard", async () => {
    const client = buildClient();
    const res = await run("?token_hash=th_abc&type=signup", client);

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
    expect(client.auth.verifyOtp).toHaveBeenCalledWith({
      type: "signup",
      token_hash: "th_abc",
    });
  });

  it("verifies a recovery token and redirects to the reset-password page", async () => {
    const client = buildClient();
    const res = await run("?token_hash=th_rec&type=recovery", client);

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("http://localhost/reset-password");
    expect(client.auth.verifyOtp).toHaveBeenCalledWith({
      type: "recovery",
      token_hash: "th_rec",
    });
  });

  it("copies session cookies written by verifyOtp onto the redirect response", async () => {
    mockCreateServerClient.mockImplementation(((_url, _key, options) => {
      const opts = options as {
        cookies: {
          setAll(
            cookies: Array<{ name: string; value: string; options?: unknown }>
          ): void;
        };
      };
      const client = buildClient({
        verifyOtp: async () => {
          opts.cookies.setAll([
            { name: "sb-test-auth-token", value: "session", options: {} },
          ]);
          return { data: { user: { id: "user-1" } }, error: null };
        },
      });
      return client as unknown as ReturnType<typeof createServerClient>;
    }) as typeof createServerClient);

    const { GET } = await import("@/app/auth/confirm/route");
    const res = await GET(makeRequest("?token_hash=th_abc&type=signup"));

    expect(res.status).toBe(302);
    expect(res.cookies.get("sb-test-auth-token")?.value).toBe("session");
  });

  it("redirects to the error page when token_hash is missing (307, matching /auth/callback)", async () => {
    const client = buildClient();
    const res = await run("?type=signup", client);

    expect(res.status).toBe(307);
    expect(client.auth.verifyOtp).not.toHaveBeenCalled();
    const diag = errorDiag(res);
    expect(diag.c).toBe(0);
    expect(diag.t).toBe("signup");
  });

  it("rejects an unsupported type before calling verifyOtp", async () => {
    const client = buildClient();
    const res = await run("?token_hash=th_abc&type=email_change", client);

    expect(res.status).toBe(307);
    expect(client.auth.verifyOtp).not.toHaveBeenCalled();
    expect(errorDiag(res).c).toBe(0);
  });

  it("redirects to the error page when verifyOtp fails, carrying the error", async () => {
    const client = buildClient({
      verifyOtpResult: {
        data: { user: null },
        error: {
          name: "OTPExpired",
          status: 410,
          message: "Email link is invalid or has expired",
        },
      },
    });
    const res = await run("?token_hash=th_expired&type=signup", client);

    expect(res.status).toBe(307);
    const diag = errorDiag(res);
    expect(diag.c).toBe(1);
    expect(diag.t).toBe("signup");
    expect(diag.e).toBe("OTPExpired");
    expect(diag.s).toBe(410);
    expect(new URL(res.headers.get("location")!).pathname).not.toBe(
      "/dashboard"
    );
  });

  it("redirects to the error page when verifyOtp succeeds without a user", async () => {
    const client = buildClient({
      verifyOtpResult: { data: { user: null }, error: null },
    });
    const res = await run("?token_hash=th_abc&type=signup", client);

    expect(res.status).toBe(307);
    const diag = errorDiag(res);
    expect(diag.e).toBe("missing_user");
  });
});

describe("GET /auth/confirm — post-confirm redirect (shared logic)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures acquisition from the mw_acquisition cookie (shared helper)", async () => {
    const client = buildClient();
    const res = await run("?token_hash=th_abc&type=signup", client, {
      mw_acquisition: ACQUISITION,
    });

    expect(res.status).toBe(302);
    expect(client.from).toHaveBeenCalledWith("founder_profiles");
    expect(client.upsert).toHaveBeenCalledWith(
      {
        id: "user-1",
        ref_param: "tw",
        utm_source: "twitter",
        utm_medium: "social",
        utm_campaign: "launch-2026",
        acquisition_captured_at: expect.any(String),
      },
      { onConflict: "id" }
    );
    expect(res.cookies.get("mw_acquisition")?.value).toBe("");
  });

  it("never touches founder_profiles without an acquisition cookie", async () => {
    const client = buildClient();
    await run("?token_hash=th_abc&type=signup", client);

    expect(client.from).not.toHaveBeenCalled();
    expect(client.upsert).not.toHaveBeenCalled();
  });

  it("prefers the auth_redirect_to cookie over the type default", async () => {
    const client = buildClient();
    const res = await run("?token_hash=th_abc&type=signup", client, {
      auth_redirect_to: "/onboarding/4",
    });

    expect(res.headers.get("location")).toBe("http://localhost/onboarding/4");
    expect(res.cookies.get("auth_redirect_to")?.value).toBe("");
  });

  it("honours a valid ?next= param when no intent cookie exists", async () => {
    const client = buildClient();
    const res = await run(
      "?token_hash=th_abc&type=signup&next=%2Fdashboard%2Fsettings%2Fbilling",
      client
    );

    expect(res.headers.get("location")).toBe(
      "http://localhost/dashboard/settings/billing"
    );
  });

  it("falls back to the type default when next is not a same-origin path", async () => {
    const client = buildClient();
    const res = await run(
      "?token_hash=th_abc&type=recovery&next=https%3A%2F%2Fevil.example",
      client
    );

    expect(res.headers.get("location")).toBe("http://localhost/reset-password");
  });

  it("branches zero-waitlist ?plan=pro founders to the onboarding entry", async () => {
    const client = buildClient({ waitlistCount: 0 });
    const res = await run("?token_hash=th_abc&type=signup", client, {
      auth_redirect_to: "/dashboard/settings/billing?plan=pro",
    });

    expect(res.headers.get("location")).toBe(
      "http://localhost/onboarding/1?plan=pro"
    );
    expect(client.select).toHaveBeenCalledWith("id", {
      count: "exact",
      head: true,
    });
  });

  it("keeps existing waitlist founders on the billing destination", async () => {
    const client = buildClient({ waitlistCount: 2 });
    const res = await run("?token_hash=th_abc&type=signup", client, {
      auth_redirect_to: "/dashboard/settings/billing?plan=pro",
    });

    expect(res.headers.get("location")).toBe(
      "http://localhost/dashboard/settings/billing?plan=pro"
    );
  });

  it("redirects even when the acquisition write fails (best-effort)", async () => {
    const client = buildClient({ upsertThrows: true });
    const res = await run("?token_hash=th_abc&type=signup", client, {
      mw_acquisition: ACQUISITION,
    });

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
    expect(res.cookies.get("mw_acquisition")?.value).toBe("");
  });
});
