import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

const triggerMock = vi.fn();
vi.mock("../../app/dashboard/shell", () => ({
  useUpgradeModal: () => triggerMock,
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

vi.mock("../../app/dashboard/updates/client", () => ({
  default: () => <div data-testid="updates-client" />,
}));

import UpdatesPage from "../../app/dashboard/updates/page";

function pageProps() {
  return { searchParams: Promise.resolve({}) };
}

describe("Updates page free gate (4.5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__queue.length = 0;
    mockSupabase.__calls.length = 0;
  });

  it("shows the upgrade gate (not a silent redirect) for free tier", async () => {
    mockSupabase.__queue.push({ data: { tier: "free" }, error: null });

    const element = await UpdatesPage(pageProps());
    render(element);

    expect(screen.getByRole("heading", { name: "Updates" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Upgrade to Pro" })).toBeTruthy();
    await waitFor(() => expect(triggerMock).toHaveBeenCalledWith("updates"));
  });

  it("renders the compose client for pro tier", async () => {
    mockSupabase.__queue.push({ data: { tier: "pro" }, error: null });
    mockSupabase.__queue.push({ data: { id: "wl-1" }, error: null });
    mockSupabase.__queue.push({ data: [], error: null });

    const element = await UpdatesPage(pageProps());
    render(element);

    expect(screen.getByTestId("updates-client")).toBeTruthy();
  });

  it("redirects pro founders with no waitlist to onboarding", async () => {
    mockSupabase.__queue.push({ data: { tier: "pro" }, error: null });
    mockSupabase.__queue.push({ data: null, error: null });

    await expect(UpdatesPage(pageProps())).rejects.toThrow(
      "NEXT_REDIRECT:/onboarding/1"
    );
  });
});
