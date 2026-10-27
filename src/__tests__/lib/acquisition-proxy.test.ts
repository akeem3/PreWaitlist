import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn().mockImplementation((req: NextRequest) => {
    return NextResponse.next({ request: req });
  }),
}));

import { proxy } from "@/proxy";

describe("TC-TOOL-03 & TC-TOOL-05: Proxy acquisition & UTM cookie capture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function apexRequest(search = "") {
    const req = new NextRequest(`http://localhost:3000/${search}`);
    Object.defineProperty(req, "headers", {
      value: new Headers({ host: "localhost:3000" }),
      configurable: true,
    });
    return req;
  }

  it("TC-TOOL-03: captures utm_* parameters into mw_acquisition cookie", async () => {
    const res = await proxy(
      apexRequest(
        "?utm_source=twitter&utm_medium=social&utm_campaign=launch-2026"
      )
    );
    const cookie = res.cookies.get("mw_acquisition");
    expect(cookie).toBeDefined();
    const parsed = JSON.parse(cookie!.value);
    expect(parsed.utm_source).toBe("twitter");
    expect(parsed.utm_medium).toBe("social");
    expect(parsed.utm_campaign).toBe("launch-2026");
  });

  it("TC-TOOL-05: ?ref= wins over ?src= in mw_acquisition cookie", async () => {
    const res = await proxy(
      apexRequest(
        "?ref=abc12345&src=powered-by&utm_source=t&utm_medium=m&utm_campaign=c"
      )
    );
    const cookie = res.cookies.get("mw_acquisition");
    expect(cookie).toBeDefined();
    const parsed = JSON.parse(cookie!.value);
    // Explicit ?ref= MUST win over ?src= for attribution in the ref column
    expect(parsed.ref).toBe("abc12345");
    expect(parsed.utm_source).toBe("t");
    expect(parsed.utm_medium).toBe("m");
    expect(parsed.utm_campaign).toBe("c");
  });

  it("captures ?src=powered-by into ref when ?ref= is absent", async () => {
    const res = await proxy(apexRequest("?src=powered-by"));
    const cookie = res.cookies.get("mw_acquisition");
    expect(cookie).toBeDefined();
    const parsed = JSON.parse(cookie!.value);
    expect(parsed.ref).toBe("powered-by");
  });

  it("does not set mw_acquisition cookie when no acquisition params are present", async () => {
    const res = await proxy(apexRequest());
    const cookie = res.cookies.get("mw_acquisition");
    expect(cookie).toBeUndefined();
  });
});
