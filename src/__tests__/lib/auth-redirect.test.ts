import { describe, it, expect, vi } from "vitest";
import {
  getAuthIntent,
  AUTH_REDIRECT_COOKIE_MAX_AGE,
  resolvePostAuthPath,
  PRO_INTENT_DEST,
  PRO_ONBOARDING_ENTRY,
} from "@/lib/auth-redirect";

function params(query: string): URLSearchParams {
  return new URLSearchParams(query);
}

describe("getAuthIntent", () => {
  it("carries next + plan into a single destination", () => {
    const intent = getAuthIntent(
      params("next=/dashboard/settings/billing&plan=pro")
    );
    expect(intent.next).toBe("/dashboard/settings/billing");
    expect(intent.planPro).toBe(true);
    expect(intent.dest).toBe("/dashboard/settings/billing?plan=pro");
  });

  it("returns bare next when no plan is present", () => {
    const intent = getAuthIntent(params("next=/onboarding/4"));
    expect(intent.next).toBe("/onboarding/4");
    expect(intent.planPro).toBe(false);
    expect(intent.dest).toBe("/onboarding/4");
  });

  it("defaults to billing when only plan=pro is present", () => {
    const intent = getAuthIntent(params("plan=pro"));
    expect(intent.next).toBeNull();
    expect(intent.dest).toBe("/dashboard/settings/billing?plan=pro");
  });

  it("rejects absolute URLs", () => {
    const intent = getAuthIntent(params("next=https://evil.com/steal"));
    expect(intent.next).toBeNull();
    expect(intent.dest).toBeNull();
  });

  it("rejects protocol-relative URLs", () => {
    const intent = getAuthIntent(params("next=//evil.com/steal"));
    expect(intent.next).toBeNull();
    expect(intent.dest).toBeNull();
  });

  it("returns nulls when no intent params exist", () => {
    const intent = getAuthIntent(params(""));
    expect(intent.next).toBeNull();
    expect(intent.planPro).toBe(false);
    expect(intent.dest).toBeNull();
  });

  it("does not duplicate plan=pro already in next", () => {
    const intent = getAuthIntent(
      params(
        "next=" + encodeURIComponent("/dashboard/settings/billing?plan=pro")
      )
    );
    expect(intent.next).toBe("/dashboard/settings/billing?plan=pro");
    expect(intent.planPro).toBe(false);
    expect(intent.dest).toBe("/dashboard/settings/billing?plan=pro");
  });

  it("ignores non-pro plan values", () => {
    const intent = getAuthIntent(params("next=/dashboard&plan=free"));
    expect(intent.planPro).toBe(false);
    expect(intent.dest).toBe("/dashboard");
  });
});

describe("auth redirect cookie", () => {
  it("uses an hour-long window for slow verification round trips", () => {
    expect(AUTH_REDIRECT_COOKIE_MAX_AGE).toBe(3600);
  });
});

function fakeDeps(opts: {
  userId?: string | null;
  count?: number | null;
  error?: unknown;
  getUserThrows?: boolean;
  countThrows?: boolean;
}) {
  const getUser = vi.fn(async () => {
    if (opts.getUserThrows) throw new Error("network");
    return { data: { user: opts.userId ? { id: opts.userId } : null } };
  });
  const countOwnWaitlists = vi.fn(async () => {
    if (opts.countThrows) throw new Error("network");
    return { count: opts.count ?? null, error: opts.error ?? null };
  });
  return { deps: { getUser, countOwnWaitlists }, getUser, countOwnWaitlists };
}

describe("resolvePostAuthPath", () => {
  it("routes zero-waitlist Pro-intent founders to the modal entry point", async () => {
    const { deps } = fakeDeps({ userId: "u1", count: 0 });
    await expect(
      resolvePostAuthPath(deps, PRO_INTENT_DEST, "u1")
    ).resolves.toBe(PRO_ONBOARDING_ENTRY);
  });

  it("keeps the billing destination when the founder has a waitlist", async () => {
    const { deps } = fakeDeps({ userId: "u1", count: 2 });
    await expect(
      resolvePostAuthPath(deps, PRO_INTENT_DEST, "u1")
    ).resolves.toBe(PRO_INTENT_DEST);
  });

  it("keeps the original destination when the waitlist query errors", async () => {
    const { deps } = fakeDeps({
      userId: "u1",
      count: null,
      error: { message: "boom" },
    });
    await expect(
      resolvePostAuthPath(deps, PRO_INTENT_DEST, "u1")
    ).resolves.toBe(PRO_INTENT_DEST);
  });

  it("keeps the original destination when the count query throws", async () => {
    const { deps } = fakeDeps({ userId: "u1", countThrows: true });
    await expect(
      resolvePostAuthPath(deps, PRO_INTENT_DEST, "u1")
    ).resolves.toBe(PRO_INTENT_DEST);
  });

  it("resolves the session itself when no userId is passed", async () => {
    const { deps, countOwnWaitlists } = fakeDeps({ userId: "u1", count: 0 });
    await expect(resolvePostAuthPath(deps, PRO_INTENT_DEST)).resolves.toBe(
      PRO_ONBOARDING_ENTRY
    );
    expect(countOwnWaitlists).toHaveBeenCalledWith("u1");
  });

  it("falls back to the destination when no session exists", async () => {
    const { deps, countOwnWaitlists } = fakeDeps({ userId: null });
    await expect(resolvePostAuthPath(deps, PRO_INTENT_DEST)).resolves.toBe(
      PRO_INTENT_DEST
    );
    expect(countOwnWaitlists).not.toHaveBeenCalled();
  });

  it("never queries waitlists for non-billing destinations", async () => {
    const { deps, countOwnWaitlists } = fakeDeps({ userId: "u1", count: 0 });
    await expect(
      resolvePostAuthPath(deps, "/onboarding/4?plan=pro", "u1")
    ).resolves.toBe("/onboarding/4?plan=pro");
    expect(countOwnWaitlists).not.toHaveBeenCalled();
  });

  it("defaults a null destination to /dashboard", async () => {
    const { deps } = fakeDeps({ userId: "u1", count: 0 });
    await expect(resolvePostAuthPath(deps, null, "u1")).resolves.toBe(
      "/dashboard"
    );
  });
});
