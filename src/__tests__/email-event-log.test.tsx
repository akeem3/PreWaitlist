import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  EmailEventLog,
  eventCache,
} from "../../components/dashboard/email-event-log";

describe("EmailEventLog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    eventCache.clear();
  });

  it("shows loading state initially", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    );

    render(<EmailEventLog subscriberId="sub-1" />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(3);
  });

  it("renders events after loading", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            events: [
              {
                id: "evt-1",
                event_type: "clicked",
                event_data: { url: "https://example.com" },
                created_at: "2026-09-10T10:00:00Z",
              },
              {
                id: "evt-2",
                event_type: "delivered",
                event_data: null,
                created_at: "2026-09-09T10:00:00Z",
              },
            ],
          }),
          { status: 200 }
        )
      )
    );

    render(<EmailEventLog subscriberId="sub-1" />);

    await waitFor(() => {
      expect(screen.getByText("clicked")).toBeInTheDocument();
    });

    expect(screen.getByText("delivered")).toBeInTheDocument();
  });

  it("shows empty state when no events", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ events: [] }), { status: 200 })
        )
    );

    render(<EmailEventLog subscriberId="sub-1" />);

    await waitFor(() => {
      expect(
        screen.getByText("No email events recorded yet.")
      ).toBeInTheDocument();
    });
  });

  it("expands event payload on click", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            events: [
              {
                id: "evt-1",
                event_type: "clicked",
                event_data: { url: "https://example.com" },
                created_at: "2026-09-10T10:00:00Z",
              },
            ],
          }),
          { status: 200 }
        )
      )
    );

    render(<EmailEventLog subscriberId="sub-1" />);

    await waitFor(() => {
      expect(screen.getByText("clicked")).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);

    expect(screen.getByText(/example\.com/)).toBeInTheDocument();
  });

  it("shows error state on fetch failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 500 }))
    );

    render(<EmailEventLog subscriberId="sub-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load events/)).toBeInTheDocument();
    });
  });

  it("displays event_data as JSON when expanded", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            events: [
              {
                id: "evt-1",
                event_type: "bounced",
                event_data: { bounce: { type: "hard", reason: "invalid" } },
                created_at: "2026-09-10T10:00:00Z",
              },
            ],
          }),
          { status: 200 }
        )
      )
    );

    render(<EmailEventLog subscriberId="sub-1" />);

    await waitFor(() => {
      expect(screen.getByText("bounced")).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);

    expect(screen.getByText(/"hard"/)).toBeInTheDocument();
  });

  it("shows 'No additional data' for null event_data", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            events: [
              {
                id: "evt-1",
                event_type: "delivered",
                event_data: null,
                created_at: "2026-09-10T10:00:00Z",
              },
            ],
          }),
          { status: 200 }
        )
      )
    );

    render(<EmailEventLog subscriberId="sub-1" />);

    await waitFor(() => {
      expect(screen.getByText("delivered")).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);

    expect(screen.getByText("No additional data")).toBeInTheDocument();
  });
});
