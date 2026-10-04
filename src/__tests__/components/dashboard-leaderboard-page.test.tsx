import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
    expect(screen.getByText("Showing 0\u20130 of 0 subscribers")).toBeDefined();
    expect(screen.queryByRole("button", { name: /Previous/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Next/ })).toBeNull();
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
    expect(
      screen.getByText("Showing 1\u201310 of 15 subscribers")
    ).toBeDefined();
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

  it("shows only the first 10 rows and range counter for 25 rows", () => {
    render(<LeaderboardClient rows={makeRows(25)} totalCount={25} />);
    expect(screen.getAllByTestId("link").length).toBe(10);
    expect(
      screen.getByText("Showing 1\u201310 of 25 subscribers")
    ).toBeDefined();
  });

  it("advances to the next page and updates the range counter", async () => {
    const user = userEvent.setup();
    render(<LeaderboardClient rows={makeRows(25)} totalCount={25} />);

    await user.click(screen.getByRole("button", { name: /Next/ }));

    expect(
      screen.getByText("Showing 11\u201320 of 25 subscribers")
    ).toBeDefined();
    expect(screen.queryByText("user0@example.com")).toBeNull();
    expect(screen.getByText("user10@example.com")).toBeDefined();
    expect(screen.getAllByTestId("link").length).toBe(10);
  });

  it("disables Previous on first page and Next on last page", async () => {
    const user = userEvent.setup();
    render(<LeaderboardClient rows={makeRows(25)} totalCount={25} />);

    expect(screen.getByRole("button", { name: /Previous/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Next/ })).not.toBeDisabled();

    await user.click(screen.getByRole("button", { name: /Next/ }));
    await user.click(screen.getByRole("button", { name: /Next/ }));

    expect(
      screen.getByText("Showing 21\u201325 of 25 subscribers")
    ).toBeDefined();
    expect(screen.getAllByTestId("link").length).toBe(5);
    expect(screen.getByRole("button", { name: /Next/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Previous/ })).not.toBeDisabled();
  });

  it("hides pagination controls when there is one page or fewer", () => {
    render(<LeaderboardClient rows={makeRows(3)} totalCount={3} />);
    expect(screen.queryByRole("button", { name: /Previous/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Next/ })).toBeNull();
    expect(screen.getByText("Showing 1\u20133 of 3 subscribers")).toBeDefined();
  });

  it("hides pagination controls when search narrows to one page", async () => {
    const user = userEvent.setup();
    render(<LeaderboardClient rows={makeRows(25)} totalCount={25} />);
    expect(screen.getByRole("button", { name: /Next/ })).toBeDefined();

    await user.type(screen.getByPlaceholderText("Search by email..."), "user0");

    expect(screen.queryByRole("button", { name: /Previous/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Next/ })).toBeNull();
    expect(screen.getByText("1 result")).toBeDefined();
  });

  it("resets to first page when sort changes", async () => {
    const user = userEvent.setup();
    render(<LeaderboardClient rows={makeRows(25)} totalCount={25} />);

    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(
      screen.getByText("Showing 11\u201320 of 25 subscribers")
    ).toBeDefined();

    await user.click(screen.getByRole("button", { name: /Referrals/ }));
    expect(
      screen.getByText("Showing 1\u201310 of 25 subscribers")
    ).toBeDefined();
  });

  it("resets to first page when search changes", async () => {
    const user = userEvent.setup();
    render(<LeaderboardClient rows={makeRows(25)} totalCount={25} />);

    // Page 2 of unfiltered list
    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(
      screen.getByText("Showing 11\u201320 of 25 subscribers")
    ).toBeDefined();

    // Type a search: page resets to 0 (filter shows count footer)
    await user.type(screen.getByPlaceholderText("Search by email..."), "user");
    expect(screen.getByText("25 results")).toBeDefined();

    // Move to page 2 within filtered results (count footer, no range shown)
    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByText("25 results")).toBeDefined();

    // Clear search via × → back to unfiltered first page
    await user.click(screen.getByRole("button", { name: "" }));
    expect(
      screen.getByText("Showing 1\u201310 of 25 subscribers")
    ).toBeDefined();
  });

  it("keeps canonical server rank across pages (not page-relative index)", async () => {
    const user = userEvent.setup();
    render(<LeaderboardClient rows={makeRows(25)} totalCount={25} />);

    await user.click(screen.getByRole("button", { name: /Next/ }));

    // First row of page 2 must show server rank 11, not page-relative 1
    const row = screen.getByText("user10@example.com").closest("div");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText("11")).toBeDefined();
    expect(within(row as HTMLElement).queryByText("1")).toBeNull();
  });

  it("moves immediately on Previous after rows shrink below the current page", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <LeaderboardClient rows={makeRows(25)} totalCount={25} />
    );

    // Page index 2 (rows 21–25) of 25
    await user.click(screen.getByRole("button", { name: /Next/ }));
    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(
      screen.getByText("Showing 21\u201325 of 25 subscribers")
    ).toBeDefined();

    // rows prop shrinks (e.g. auto-refresh) → page clamps to index 1 (11–15)
    rerender(<LeaderboardClient rows={makeRows(15)} totalCount={15} />);
    expect(
      screen.getByText("Showing 11\u201315 of 15 subscribers")
    ).toBeDefined();

    // First Previous click must land on page 1 (1–10), not stall on 11–15
    await user.click(screen.getByRole("button", { name: /Previous/ }));
    expect(
      screen.getByText("Showing 1\u201310 of 15 subscribers")
    ).toBeDefined();
    expect(screen.getByRole("button", { name: /Previous/ })).toBeDisabled();
  });

  // --- Phone column (phone collection — locked decision 1) ---

  const makePhoneRows = () => {
    const base = makeRows(3);
    return [
      {
        ...base[0],
        display_name: "Ann",
        phone: "+15551234567",
        referral_count: 3,
        quality_score: 10,
        milestone_next: { threshold: 5, label: "Early access" },
      },
      {
        ...base[1],
        display_name: "Bob",
        phone: null as string | null,
        referral_count: 2,
        quality_score: 10,
        milestone_next: { threshold: 5, label: "Early access" },
      },
      {
        ...base[2],
        display_name: "Cara",
        phone: "+447911123456",
        referral_count: 1,
        quality_score: 10,
        milestone_next: { threshold: 5, label: "Early access" },
      },
    ];
  };

  function headerOrder() {
    const email = screen.getByRole("button", { name: /^Email/ });
    const phone = screen.getByText("Phone");
    const referrals = screen.getByRole("button", { name: /^Referrals/ });
    const before = (a: Element, b: Element) =>
      !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    return { email, phone, referrals, before };
  }

  it("hides the Phone header and values when phoneEnabled is omitted (mode off)", () => {
    render(<LeaderboardClient rows={makePhoneRows()} totalCount={3} />);
    expect(screen.queryByText("Phone")).toBeNull();
    expect(screen.queryByText("+15551234567")).toBeNull();
    expect(screen.queryByText("+447911123456")).toBeNull();
    // off layout keeps the original 7-column grid
    const email = screen.getByRole("button", { name: /^Email/ });
    expect(email.parentElement?.className).toContain(
      "grid-cols-[48px_1fr_1fr_100px_100px_120px_120px]"
    );
    expect(email.parentElement?.className).not.toContain(
      "grid-cols-[48px_1fr_1fr_1fr_100px"
    );
  });

  it("renders Phone header after Email with phone values when phoneEnabled", () => {
    render(
      <LeaderboardClient rows={makePhoneRows()} totalCount={3} phoneEnabled />
    );

    const { email, phone, referrals, before } = headerOrder();
    // locked decision: Phone column sits directly after Email
    expect(before(email, phone)).toBe(true);
    expect(before(phone, referrals)).toBe(true);

    expect(screen.getByText("+15551234567")).toBeDefined();
    expect(screen.getByText("+447911123456")).toBeDefined();

    // 8-column grid while on
    expect(email.parentElement?.className).toContain(
      "grid-cols-[48px_1fr_1fr_1fr_100px_100px_120px_120px]"
    );
  });

  it("shows em-dash for a subscriber without a phone when enabled", () => {
    render(
      <LeaderboardClient rows={makePhoneRows()} totalCount={3} phoneEnabled />
    );
    const row = screen.getByText("user1@example.com").closest("div");
    expect(row).not.toBeNull();
    // only the Phone cell is empty in this row (quality + milestone present)
    expect(within(row as HTMLElement).getAllByText("\u2014")).toHaveLength(1);
  });

  it("Phone header is a plain label, not a sort button", () => {
    render(
      <LeaderboardClient rows={makePhoneRows()} totalCount={3} phoneEnabled />
    );
    const phone = screen.getByText("Phone");
    expect(phone.closest("button")).toBeNull();
  });
});
