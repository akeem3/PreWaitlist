import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from "@supabase/ssr";

const mockCreateServerClient = vi.mocked(createServerClient);

interface ClientOptions {
  waitlists: Array<{ id: string }> | null;
  waitlistError?: { message: string } | null;
}

function buildClient({ waitlists, waitlistError = null }: ClientOptions) {
  // resolvePostAuthPath uses count-based existence check:
  // from("waitlists").select("id", { count: "exact", head: true }).eq(...)
  const waitlistChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({
      count: waitlistError ? null : (waitlists?.length ?? 0),
      error: waitlistError,
    }),
  };
  return {
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue(waitlistChain),
  };
}

/**
 * happy-dom (test env) strips the forbidden `cookie` request header, so a real
 * NextRequest can't carry it — the route only touches `request.url` and
 * `request.cookies.get()`, so a Request with a cookies shim is sufficient.
 */
function makeRequest(dest?: string): NextRequest {
  const base = new Request("http://localhost/auth/callback?code=test-code");
  return Object.assign(base, {
    cookies: {
      get: (name: string) =>
        name === "auth_redirect_to" && dest ? { name, value: dest } : undefined,
    },
  }) as unknown as NextRequest;
}

async function getLocation(
  dest: string | undefined,
  client: ReturnType<typeof buildClient>
) {
  mockCreateServerClient.mockReturnValue(
    client as unknown as ReturnType<typeof createServerClient>
  );
  const { GET } = await import("@/app/auth/callback/route");
  const res = await GET(makeRequest(dest));
  return { status: res.status, location: res.headers.get("location") };
}

describe("GET /auth/callback — ?plan=pro branch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes zero-waitlist founders to /onboarding/1?plan=pro", async () => {
    const client = buildClient({ waitlists: [] });
    const { status, location } = await getLocation(
      "/dashboard/settings/billing?plan=pro",
      client
    );
    expect(status).toBe(302);
    expect(location).toBe("http://localhost/onboarding/1?plan=pro");
    expect(client.from).toHaveBeenCalledWith("waitlists");
  });

  it("routes founders with a waitlist to billing (auto-open intact)", async () => {
    const client = buildClient({ waitlists: [{ id: "w1" }] });
    const { status, location } = await getLocation(
      "/dashboard/settings/billing?plan=pro",
      client
    );
    expect(status).toBe(302);
    expect(location).toBe(
      "http://localhost/dashboard/settings/billing?plan=pro"
    );
  });

  it("keeps billing destination when the waitlist query errors", async () => {
    const client = buildClient({
      waitlists: null,
      waitlistError: { message: "boom" },
    });
    const { location } = await getLocation(
      "/dashboard/settings/billing?plan=pro",
      client
    );
    expect(location).toBe(
      "http://localhost/dashboard/settings/billing?plan=pro"
    );
  });

  it("does not query waitlists when plan=pro is absent", async () => {
    const client = buildClient({ waitlists: [] });
    const { location } = await getLocation("/dashboard", client);
    expect(location).toBe("http://localhost/dashboard");
    expect(client.from).not.toHaveBeenCalled();
  });

  it("defaults to /dashboard when no cookie and no next param", async () => {
    const client = buildClient({ waitlists: [] });
    const { location } = await getLocation(undefined, client);
    expect(location).toBe("http://localhost/dashboard");
    expect(client.from).not.toHaveBeenCalled();
  });

  it("preserves a non-billing plan=pro destination verbatim (resume flow)", async () => {
    const client = buildClient({ waitlists: [{ id: "w1" }] });
    const { location } = await getLocation("/onboarding/4?plan=pro", client);
    expect(location).toBe("http://localhost/onboarding/4?plan=pro");
    expect(client.from).not.toHaveBeenCalled();
  });
});
