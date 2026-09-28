import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LeaderboardClient from "../../app/dashboard/leaderboard/client";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} data-testid="link">
      {children}
    </a>
  ),
}));

const makeRows = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `sub-${i}`,
    email: `user${i}@example.com`,
    referral_count: count - i,
    quality_score: i % 3 === 0 ? Math.round((i / count) * 100) : null,
    created_at: `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
    rank: i + 1,
    milestone_earned_count: 0,
    milestone_total: 3,
    milestone_next: { threshold: 5, label: "Early access" },
  }));

describe("Dashboard Leaderboard Client", () => {
  const defaultProps = {
    rows: makeRows(15),
    totalCount: 15,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders ranked subscribers with full emails", () => {
    render(<LeaderboardClient {...defaultProps} />);
    expect(screen.getByText("user0@example.com")).toBeDefined();
    expect(screen.getByText("user9@example.com")).toBeDefined();
  });

  it("displays referral counts", () => {
    render(<LeaderboardClient {...defaultProps} />);
    expect(screen.getAllByText("15").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("14").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state", () => {
    render(<LeaderboardClient {...defaultProps} rows={[]} totalCount={0} />);
    expect(screen.getByText(/No subscribers yet/)).toBeDefined();
  });

  it("displays quality scores with percentage", () => {
    render(
      <LeaderboardClient {...defaultProps} rows={makeRows(3)} totalCount={3} />
    );
    expect(screen.getByText("0%")).toBeDefined();
  });

  it("shows em-dash for null quality scores", () => {
    render(
      <LeaderboardClient {...defaultProps} rows={makeRows(3)} totalCount={3} />
    );
    const emDashes = screen.getAllByText("\u2014");
    expect(emDashes.length).toBeGreaterThan(0);
  });

  it("displays rank column header and data", () => {
    render(
      <LeaderboardClient {...defaultProps} rows={makeRows(3)} totalCount={3} />
    );
    expect(screen.getByRole("button", { name: /Rank/ })).toBeDefined();
    expect(screen.getByRole("button", { name: /Email/ })).toBeDefined();
    expect(screen.getByRole("button", { name: /Referrals/ })).toBeDefined();
  });

  it("email links to subscriber detail page", () => {
    render(
      <LeaderboardClient {...defaultProps} rows={makeRows(3)} totalCount={3} />
    );
    const links = screen.getAllByTestId("link");
    const emailLinks = links.filter((l) =>
      l.getAttribute("href")?.startsWith("/dashboard/subscribers/")
    );
    expect(emailLinks.length).toBe(3);
    expect(emailLinks[0].getAttribute("href")).toBe(
      "/dashboard/subscribers/sub-0"
    );
  });

  it("sorts by referrals when clicking Referrals header", async () => {
    const user = userEvent.setup();
    render(
      <LeaderboardClient {...defaultProps} rows={makeRows(3)} totalCount={3} />
    );
    // Default sort: rank asc — user0 first (rank 1)
    const firstEmail = screen.getAllByTestId("link")[0];
    expect(firstEmail.textContent).toBe("user0@example.com");

    // First click: referral_count DESCENDING (highest first), arrow ↓
    // makeRows(3): user0 referral_count=3, user1=2, user2=1
    await user.click(screen.getByText("Referrals"));
    expect(screen.getAllByTestId("link")[0].textContent).toBe(
      "user0@example.com"
    );
    expect(
      screen.getByRole("button", { name: /Referrals/ }).textContent
    ).toContain("↓");

    // Second click: ascending (lowest first), arrow ↑
    await user.click(screen.getByRole("button", { name: /Referrals/ }));
    expect(screen.getAllByTestId("link")[0].textContent).toBe(
      "user2@example.com"
    );
    expect(
      screen.getByRole("button", { name: /Referrals/ }).textContent
    ).toContain("↑");
  });

  const emails = () => screen.getAllByTestId("link").map((l) => l.textContent);
  const headerBtn = (label: string) =>
    screen.getByRole("button", { name: new RegExp(`^${label}`) });
  const arrowOf = (label: string) => {
    const text = headerBtn(label).textContent ?? "";
    if (text.includes("↑")) return "↑";
    if (text.includes("↓")) return "↓";
    return "";
  };

  const sortCases = [
    {
      // Rank is the default active column (asc) — first click toggles to desc
      label: "Rank",
      rows: makeRows(3),
      first: "user2@example.com",
      firstArrow: "↓",
      second: "user0@example.com",
      secondArrow: "↑",
    },
    {
      label: "Name",
      rows: makeRows(3),
      first: "user2@example.com",
      firstArrow: "↓",
      second: "user0@example.com",
      secondArrow: "↑",
    },
    {
      label: "Email",
      rows: makeRows(3),
      first: "user2@example.com",
      firstArrow: "↓",
      second: "user0@example.com",
      secondArrow: "↑",
    },
    {
      label: "Referrals",
      rows: makeRows(3),
      first: "user0@example.com",
      firstArrow: "↓",
      second: "user2@example.com",
      secondArrow: "↑",
    },
    {
      // makeRows(15): quality 80 at user12 (i=12), 0/null elsewhere
      label: "Quality",
      rows: makeRows(15),
      first: "user12@example.com",
      firstArrow: "↓",
      second: "user0@example.com",
      secondArrow: "↑",
    },
    {
      label: "Date",
      rows: makeRows(3),
      first: "user2@example.com",
      firstArrow: "↓",
      second: "user0@example.com",
      secondArrow: "↑",
    },
  ];

  for (const c of sortCases) {
    it(`arrow matches data order for ${c.label} on first and second click`, async () => {
      const user = userEvent.setup();
      render(<LeaderboardClient rows={c.rows} totalCount={c.rows.length} />);

      await user.click(headerBtn(c.label));
      expect(arrowOf(c.label)).toBe(c.firstArrow);
      expect(emails()[0]).toBe(c.first);

      await user.click(headerBtn(c.label));
      expect(arrowOf(c.label)).toBe(c.secondArrow);
      expect(emails()[0]).toBe(c.second);
    });
  }

  it("searches by email", async () => {
    const user = userEvent.setup();
    render(<LeaderboardClient {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search by email...");
    await user.type(searchInput, "user0@example.com");

    const links = screen.getAllByTestId("link");
    const emailLinks = links.filter((l) =>
      l.getAttribute("href")?.startsWith("/dashboard/subscribers/")
    );
    expect(emailLinks.length).toBe(1);
    expect(screen.getByText("1 result")).toBeDefined();
  });

  it("clears search with × button", async () => {
    const user = userEvent.setup();
    render(<LeaderboardClient {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search by email...");
    await user.type(searchInput, "user1@example.com");

    const clearBtn = screen.getByRole("button", { name: "" });
    await user.click(clearBtn);

    expect(searchInput).toHaveValue("");
    expect(screen.getByText("15 subscribers")).toBeDefined();
  });

  it("shows no results message when search has no matches", async () => {
    const user = userEvent.setup();
    render(<LeaderboardClient {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search by email...");
    await user.type(searchInput, "zzz_nonexistent");

    expect(screen.getByText("No subscribers match your search.")).toBeDefined();
    expect(screen.getByText("0 results")).toBeDefined();
  });

  it("displays milestone progress", () => {
    render(
      <LeaderboardClient
        {...defaultProps}
        rows={[
          {
            ...makeRows(1)[0],
            referral_count: 2,
            milestone_earned_count: 1,
            milestone_total: 3,
            milestone_next: { threshold: 5, label: "Early access" },
          },
        ]}
        totalCount={1}
      />
    );
    expect(screen.getByText("2/5")).toBeDefined();
  });

  it("displays milestone complete state", () => {
    render(
      <LeaderboardClient
        {...defaultProps}
        rows={[
          {
            ...makeRows(1)[0],
            referral_count: 10,
            milestone_earned_count: 3,
            milestone_total: 3,
            milestone_next: null,
          },
        ]}
        totalCount={1}
      />
    );
    expect(screen.getByText("✓ Complete")).toBeDefined();
  });

  it("displays em-dash when no milestone rewards configured", () => {
    render(
      <LeaderboardClient
        {...defaultProps}
        rows={[
          {
            ...makeRows(1)[0],
            milestone_earned_count: 0,
            milestone_total: 0,
            milestone_next: null,
          },
        ]}
        totalCount={1}
      />
    );
    const emDashes = screen.getAllByText("\u2014");
    expect(emDashes.length).toBeGreaterThan(0);
  });
});
