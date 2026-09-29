import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QuotaWarningBanner } from "../../../components/dashboard/quota-warning-banner";

let fetchMock: ReturnType<typeof vi.fn>;

describe("QuotaWarningBanner", () => {
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the approved copy when quota failures exist", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ quotaHit: true, kind: "daily", failedCount24h: 3 }),
    });

    render(<QuotaWarningBanner />);

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(
      screen.getByText(
        /Some emails couldn't be sent because the email quota was exceeded\./
      )
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Daily-quota emails retry automatically after midnight UTC\./
      )
    ).toBeTruthy();
  });

  it("renders nothing when there is no quota hit", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ quotaHit: false }),
    });

    const { container } = render(<QuotaWarningBanner />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when the health check fails", async () => {
    fetchMock.mockRejectedValue(new Error("down"));

    const { container } = render(<QuotaWarningBanner />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });
});
