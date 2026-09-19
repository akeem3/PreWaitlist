# Story 12.2.18 — Multi-Waitlist Tests

**Epic:** 12.2 — Gap Fixes
**Status:** ready
**Depends on:** 12.2.14, 12.2.15, 12.2.16, 12.2.17
**Design Refs:** — (no UI)

## Story

As the founder, I want comprehensive tests covering multi-waitlist functionality so that the feature is regression-proof and production-ready.

## Acceptance Criteria (EARS)

- AC1: API tests for `POST /api/waitlist` shall cover: creates new waitlist when founder has none, creates second waitlist when founder has one + Pro tier, returns 402 when founder has one + free tier, returns 401 when unauthenticated.
- AC2: API tests for `GET /api/waitlist` shall cover: returns all waitlists for founder, returns empty array when founder has none, includes subscriber counts.
- AC3: API tests for `PATCH /api/waitlist` shall cover: requires waitlist_id (returns 400 if missing), returns 404 for wrong owner, updates correct waitlist, handles milestone_rewards upsert.
- AC4: Component tests for `WaitlistSwitcher` shall cover: renders dropdown trigger with active waitlist, opens dropdown on click, lists all waitlists, shows archived badge, highlights active waitlist, "Create new waitlist" button links to /onboarding/1, closes on click-outside, closes on Escape.
- AC5: Component tests for dashboard scoping shall cover: passes waitlist_id to API calls, refreshes data on waitlist switch.
- AC6: All tests shall pass with `pnpm test`.
- AC7: Lint and build shall pass with zero errors.
- AC8: Total test count across the project shall be ≥300.

## Tasks

T1 (AC1) POST /api/waitlist tests · T2 (AC2) GET /api/waitlist tests · T3 (AC3) PATCH /api/waitlist tests · T4 (AC4) WaitlistSwitcher component tests · T5 (AC5) Dashboard scoping tests · T6 (AC6-AC8) Full verification

## Out of Scope

Existing tests for single-waitlist flows (those should still pass, but not re-tested here).

## Implementation Details

### T1: POST /api/waitlist tests

Create new file: `src/__tests__/api/waitlist-multi.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock auth
const mockGetUser = vi.fn();
const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
  maybeSingle: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  in: vi.fn(() => mockSupabase),
};

describe("POST /api/waitlist — multi-waitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
  });

  it("creates new waitlist when founder has none", async () => {
    // Mock: no existing waitlists
    mockSupabase.select.mockResolvedValue({
      data: null,
      error: null,
      count: 0,
    });
    mockSupabase.insert.mockResolvedValue({
      data: { id: "wl-1" },
      error: null,
    });

    const { POST } = await import("@/app/api/waitlist/route");
    const request = new Request("http://localhost/api/waitlist", {
      method: "POST",
      body: JSON.stringify({ subdomain: "my-app", product_name: "My App" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe("wl-1");
  });

  it("returns 402 when free-tier founder already has 1 waitlist", async () => {
    // Mock: founder has 1 waitlist + free tier
    mockSupabase.select
      .mockResolvedValueOnce({ data: { tier: "free" }, error: null }) // profile query
      .mockResolvedValueOnce({ count: 1, error: null }); // count query

    const { POST } = await import("@/app/api/waitlist/route");
    const request = new Request("http://localhost/api/waitlist", {
      method: "POST",
      body: JSON.stringify({ subdomain: "my-app", product_name: "My App" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(402);
    expect(data.error).toContain("Upgrade to Pro");
  });

  it("creates second waitlist when Pro-tier founder already has 1", async () => {
    // Mock: founder has 1 waitlist + pro tier
    mockSupabase.select
      .mockResolvedValueOnce({ data: { tier: "pro" }, error: null })
      .mockResolvedValueOnce({ count: 1, error: null });
    mockSupabase.insert.mockResolvedValue({
      data: { id: "wl-2" },
      error: null,
    });

    const { POST } = await import("@/app/api/waitlist/route");
    const request = new Request("http://localhost/api/waitlist", {
      method: "POST",
      body: JSON.stringify({ subdomain: "my-app-2", product_name: "My App 2" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe("wl-2");
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error("unauthorized"),
    });

    const { POST } = await import("@/app/api/waitlist/route");
    const request = new Request("http://localhost/api/waitlist", {
      method: "POST",
      body: JSON.stringify({ subdomain: "my-app" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
```

### T2: GET /api/waitlist tests

Add to `src/__tests__/api/waitlist-multi.test.ts`:

```typescript
describe("GET /api/waitlist — multi-waitlist", () => {
  it("returns all waitlists for founder", async () => {
    mockSupabase.select
      .mockResolvedValueOnce({
        data: [
          { id: "wl-1", subdomain: "app-1", product_name: "App 1" },
          { id: "wl-2", subdomain: "app-2", product_name: "App 2" },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          { waitlist_id: "wl-1" },
          { waitlist_id: "wl-1" },
          { waitlist_id: "wl-2" },
        ],
        error: null,
      });

    const { GET } = await import("@/app/api/waitlist/route");
    const request = new Request("http://localhost/api/waitlist");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].subscriber_count).toBe(2);
    expect(data[1].subscriber_count).toBe(1);
  });

  it("returns empty array when founder has no waitlists", async () => {
    mockSupabase.select
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    const { GET } = await import("@/app/api/waitlist/route");
    const request = new Request("http://localhost/api/waitlist");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });
});
```

### T3: PATCH /api/waitlist tests

Add to `src/__tests__/api/waitlist-multi.test.ts`:

```typescript
describe("PATCH /api/waitlist — multi-waitlist", () => {
  it("returns 400 when waitlist_id is missing", async () => {
    const { PATCH } = await import("@/app/api/waitlist/route");
    const request = new Request("http://localhost/api/waitlist", {
      method: "PATCH",
      body: JSON.stringify({ headline: "New headline" }), // no waitlist_id
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("waitlist_id");
  });

  it("returns 404 when waitlist belongs to different founder", async () => {
    mockSupabase.select.mockResolvedValue({
      data: null,
      error: new Error("not found"),
    });

    const { PATCH } = await import("@/app/api/waitlist/route");
    const request = new Request("http://localhost/api/waitlist", {
      method: "PATCH",
      body: JSON.stringify({
        waitlist_id: "wl-other",
        headline: "New headline",
      }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(404);
  });

  it("updates correct waitlist when waitlist_id provided", async () => {
    mockSupabase.select.mockResolvedValue({
      data: { id: "wl-1" },
      error: null,
    });
    mockSupabase.update.mockResolvedValue({ error: null });

    const { PATCH } = await import("@/app/api/waitlist/route");
    const request = new Request("http://localhost/api/waitlist", {
      method: "PATCH",
      body: JSON.stringify({ waitlist_id: "wl-1", headline: "New headline" }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
  });
});
```

### T4: WaitlistSwitcher component tests

Create new file: `src/__tests__/waitlist-switcher.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WaitlistSwitcher from "@/../../components/dashboard/waitlist-switcher";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockWaitlists = [
  { id: "wl-1", product_name: "App 1", subdomain: "app-1", logo_url: null, is_archived: false, subscriber_count: 10 },
  { id: "wl-2", product_name: "App 2", subdomain: "app-2", logo_url: null, is_archived: true, subscriber_count: 5 },
];

describe("WaitlistSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders active waitlist name and subdomain", () => {
    render(<WaitlistSwitcher waitlists={mockWaitlists} activeWaitlistId="wl-1" />);
    expect(screen.getByText("App 1")).toBeDefined();
    expect(screen.getByText("app-1.prewaitlist.com")).toBeDefined();
  });

  it("opens dropdown on click", () => {
    render(<WaitlistSwitcher waitlists={mockWaitlists} activeWaitlistId="wl-1" />);
    fireEvent.click(screen.getByText("App 1"));
    expect(screen.getByText("App 2")).toBeDefined(); // other waitlist visible
  });

  it("shows archived badge for archived waitlists", () => {
    render(<WaitlistSwitcher waitlists={mockWaitlists} activeWaitlistId="wl-1" />);
    fireEvent.click(screen.getByText("App 1"));
    expect(screen.getByText("Archived")).toBeDefined();
  });

  it("highlights active waitlist", () => {
    render(<WaitlistSwitcher waitlists={mockWaitlists} activeWaitlistId="wl-1" />);
    fireEvent.click(screen.getByText("App 1"));
    const activeItem = screen.getByText("App 1").closest("button");
    expect(activeItem?.className).toContain("bg-accent/10");
  });

  it("shows Create new waitlist button", () => {
    render(<WaitlistSwitcher waitlists={mockWaitlists} activeWaitlistId="wl-1" />);
    fireEvent.click(screen.getByText("App 1"));
    expect(screen.getByText("Create new waitlist")).toBeDefined();
  });

  it("closes on Escape key", () => {
    render(<WaitlistSwitcher waitlists={mockWaitlists} activeWaitlistId="wl-1" />);
    fireEvent.click(screen.getByText("App 1"));
    expect(screen.getByText("App 2")).toBeDefined(); // open
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("App 2")).toBeNull(); // closed
  });

  it("closes on click outside", () => {
    render(
      <div>
        <span data-testid="outside">Outside</span>
        <WaitlistSwitcher waitlists={mockWaitlists} activeWaitlistId="wl-1" />
      </div>
    );
    fireEvent.click(screen.getByText("App 1"));
    expect(screen.getByText("App 2")).toBeDefined(); // open
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByText("App 2")).toBeNull(); // closed
  });

  it("saves to localStorage on select", () => {
    render(<WaitlistSwitcher waitlists={mockWaitlists} activeWaitlistId="wl-1" />);
    fireEvent.click(screen.getByText("App 1"));
    fireEvent.click(screen.getByText("App 2"));
    expect(localStorage.getItem("active_waitlist_id")).toBe("wl-2");
  });
});
```

### T5: Dashboard scoping tests

Create new file: `src/__tests__/dashboard-scoping.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";

describe("Dashboard API scoping", () => {
  it("returns 400 when waitlist_id is missing from chart endpoint", async () => {
    const { GET } = await import("@/app/api/dashboard/chart/route");
    const request = new Request("http://localhost/api/dashboard/chart"); // no waitlist_id
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when waitlist_id is missing from stats endpoint", async () => {
    const { GET } = await import("@/app/api/dashboard/stats/route");
    const request = new Request("http://localhost/api/dashboard/stats");
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when waitlist_id is missing from qualification endpoint", async () => {
    const { GET } = await import("@/app/api/dashboard/qualification/route");
    const request = new Request("http://localhost/api/dashboard/qualification");
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when waitlist_id is missing from warmth endpoint", async () => {
    const { GET } = await import("@/app/api/dashboard/warmth/route");
    const request = new Request("http://localhost/api/dashboard/warmth");
    const response = await GET(request);
    expect(response.status).toBe(400);
  });
});
```

### T6: Full verification

Run `pnpm test` to confirm all tests pass. Run `pnpm lint` and `pnpm build`.

## Verification

1. All new tests pass with `pnpm test`
2. Existing tests are not broken (no regressions)
3. Total test count ≥ 300
4. `pnpm lint` and `pnpm build` pass with zero errors
