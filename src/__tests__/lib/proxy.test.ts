import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";

import { proxy } from "@/proxy";

function subdomainRequest(path: string) {
  const req = new NextRequest(`http://quality.lvh.me:3000${path}`);
  // happy-dom/undici drops the Host header from init (forbidden header name
  // in the fetch spec) — set it on the instance so getSubdomain() sees it.
  Object.defineProperty(req, "headers", {
    value: new Headers({ host: "quality.lvh.me:3000" }),
    configurable: true,
  });
  return req;
}

describe("proxy shared compliance routes on subdomain hosts", () => {
  it.each([
    ["/legal/terms", "/legal/terms"],
    ["/legal/privacy", "/legal/privacy"],
    ["/unsubscribe?token=abc", "/unsubscribe"],
  ])(
    "rewrites %s to the root route instead of /{subdomain}%s",
    async (path, expected) => {
      const res = await proxy(subdomainRequest(path));
      const rewrite = res.headers.get("x-middleware-rewrite") ?? "";

      expect(rewrite).toContain(expected);
      expect(rewrite).not.toContain("/quality/legal");
      expect(rewrite).not.toContain("/quality/unsubscribe");
    }
  );

  it("still prefixes regular public pages with the subdomain", async () => {
    const res = await proxy(subdomainRequest("/leaderboard"));
    const rewrite = res.headers.get("x-middleware-rewrite") ?? "";

    expect(rewrite).toContain("/quality/leaderboard");
  });

  it("does not prefix an already-prefixed subdomain path", async () => {
    const res = await proxy(subdomainRequest("/quality/thank-you"));
    const rewrite = res.headers.get("x-middleware-rewrite") ?? "";

    expect(rewrite).toContain("/quality/thank-you");
    expect(rewrite).not.toContain("/quality/quality");
  });
});
