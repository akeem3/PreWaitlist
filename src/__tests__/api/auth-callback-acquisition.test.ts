import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from "@supabase/ssr";

const mockCreateServerClient = vi.mocked(createServerClient);

interface ClientOptions {
  upsertResult?: { data: null; error: null };
  upsertThrows?: boolean;
}

function buildClient({
  upsertResult = { data: null, error: null },
  upsertThrows = false,
}: ClientOptions = {}) {
  const upsert = upsertThrows
    ? vi.fn().mockRejectedValue(new Error("network"))
    : vi.fn().mockResolvedValue(upsertResult);
  const from = vi.fn((table: string) => {
    if (table === "founder_profiles") return { upsert };
    throw new Error(`unexpected table in this test: ${table}`);
  });
  return {
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
    from,
    upsert,
  };
}

/**
 * happy-dom (test env) strips the forbidden `cookie` request header, so a real
 * NextRequest can't carry it — the route only touches `request.url` and
 * `request.cookies.get()`, so a Request with a cookies shim is sufficient.
 */
function makeRequest(acquisition?: string, dest?: string): NextRequest {
  const base = new Request("http://localhost/auth/callback?code=test-code");
  return Object.assign(base, {
    cookies: {
      get: (name: string) => {
        if (name === "mw_acquisition" && acquisition !== undefined) {
          return { name, value: acquisition };
        }
        if (name === "auth_redirect_to" && dest) {
          return { name, value: dest };
        }
        return undefined;
      },
    },
  }) as unknown as NextRequest;
}

const ACQUISITION = JSON.stringify({
  ref: "tw",
  utm_source: "twitter",
  utm_medium: "social",
  utm_campaign: "launch-2026",
});

async function run(
  acquisition: string | undefined,
  client: ReturnType<typeof buildClient>
) {
  mockCreateServerClient.mockReturnValue(
    client as unknown as ReturnType<typeof createServerClient>
  );
  const { GET } = await import("@/app/auth/callback/route");
  const res = await GET(makeRequest(acquisition, "/dashboard"));
  return res;
}

describe("GET /auth/callback — acquisition capture (mw_acquisition)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates the profile row when none exists (fresh signup) and persists UTM fields", async () => {
    const client = buildClient();
    const res = await run(ACQUISITION, client);

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
    expect(client.from).toHaveBeenCalledWith("founder_profiles");
    expect(client.upsert).toHaveBeenCalledTimes(1);
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
  });

  it("still captures UTM fields when the cookie has no ref param", async () => {
    const client = buildClient();
    await run(
      JSON.stringify({ utm_source: "linkedin", utm_medium: "social" }),
      client
    );

    expect(client.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user-1",
        ref_param: null,
        utm_source: "linkedin",
        utm_medium: "social",
        utm_campaign: null,
      }),
      { onConflict: "id" }
    );
  });

  it("redirects and deletes the acquisition cookie even when the profile write fails", async () => {
    const client = buildClient({ upsertThrows: true });
    const res = await run(ACQUISITION, client);

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
    expect(res.cookies.get("mw_acquisition")?.value).toBe("");
  });

  it("deletes the acquisition cookie after a successful write", async () => {
    const client = buildClient();
    const res = await run(ACQUISITION, client);

    expect(res.cookies.get("mw_acquisition")?.value).toBe("");
  });

  it("never touches founder_profiles when no acquisition cookie is present", async () => {
    const client = buildClient();
    const res = await run(undefined, client);

    expect(res.status).toBe(302);
    expect(client.from).not.toHaveBeenCalled();
    expect(client.upsert).not.toHaveBeenCalled();
  });

  it("tolerates a malformed acquisition cookie without breaking the redirect", async () => {
    const client = buildClient();
    const res = await run("not-json{", client);

    expect(res.status).toBe(302);
    expect(client.upsert).not.toHaveBeenCalled();
  });
});
