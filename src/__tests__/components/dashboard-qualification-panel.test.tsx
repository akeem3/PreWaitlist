import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import QualificationPanel from "../../../components/dashboard/qualification-panel";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const question = {
  id: "q1",
  text: "How did you hear about us?",
  type: "multiple_choice" as const,
  options: ["Twitter", "Friend"],
  respondentCount: 2,
  answers: [
    { value: "Twitter", count: 1, percent: 50 },
    { value: "Friend", count: 1, percent: 50 },
  ],
};

function mockFetchWith(body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(body),
    })
  );
}

describe("QualificationPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows full empty state when no questions are configured", async () => {
    mockFetchWith({ questions: [], respondentTotal: 0 });
    render(<QualificationPanel subdomain="acme" waitlistId="wl-1" />);
    expect(
      await screen.findByText(
        "No qualification questions configured. Add questions during onboarding to collect subscriber data."
      )
    ).toBeDefined();
  });

  it("shows 'No responses yet' for a question with zero answers (AC6)", async () => {
    mockFetchWith({
      questions: [
        {
          ...question,
          respondentCount: 0,
          answers: [],
        },
      ],
      respondentTotal: 0,
    });
    render(<QualificationPanel subdomain="acme" waitlistId="wl-1" />);
    expect(await screen.findByText("No responses yet")).toBeDefined();
    // both displays (meta line + per-card) show the count
    expect(screen.getAllByText("0 respondents")).toHaveLength(2);
  });

  it("renders MC bars with percent widths and count/percent labels (AC3)", async () => {
    mockFetchWith({
      questions: [
        {
          ...question,
          respondentCount: 4,
          answers: [
            { value: "Twitter", count: 3, percent: 75 },
            { value: "Friend", count: 1, percent: 25 },
          ],
        },
      ],
      respondentTotal: 4,
    });
    render(<QualificationPanel subdomain="acme" waitlistId="wl-1" />);

    expect(await screen.findAllByText("4 respondents")).toHaveLength(2);
    expect(screen.getByText("Twitter (3, 75%)")).toBeDefined();
    expect(screen.getByText("Friend (1, 25%)")).toBeDefined();

    const bars = document.querySelectorAll("[style*='width']");
    expect(bars).toHaveLength(2);
    expect(bars[0].getAttribute("style")).toContain("width: 75%");
    expect(bars[1].getAttribute("style")).toContain("width: 25%");
    // Top answer bar uses accent, others muted
    expect(bars[0].className).toContain("bg-accent");
    expect(bars[1].className).toContain("bg-muted");
    expect(bars[1].className).not.toContain("bg-accent");
  });

  it("never renders bars for a single respondent (AC8)", async () => {
    mockFetchWith({
      questions: [
        {
          ...question,
          respondentCount: 1,
          answers: [{ value: "Twitter", count: 1, percent: 100 }],
        },
      ],
      respondentTotal: 1,
    });
    render(<QualificationPanel subdomain="acme" waitlistId="wl-1" />);

    expect(await screen.findAllByText("1 respondent")).toHaveLength(2);
    expect(screen.getByText("Twitter")).toBeDefined();
    expect(document.querySelectorAll("[style*='width']")).toHaveLength(0);
  });

  it("renders free-text answers as a response list with counts (AC4)", async () => {
    mockFetchWith({
      questions: [
        {
          id: "q2",
          text: "What do you expect?",
          type: "free_text",
          options: null,
          respondentCount: 3,
          answers: [
            { value: "A great product", count: 2, percent: 67 },
            { value: "Something else", count: 1, percent: 33 },
          ],
        },
      ],
      respondentTotal: 3,
    });
    render(<QualificationPanel subdomain="acme" waitlistId="wl-1" />);

    expect(await screen.findAllByText("3 respondents")).toHaveLength(2);
    expect(screen.getByText("A great product")).toBeDefined();
    expect(screen.getByText("(2)")).toBeDefined();
    expect(screen.getByText("Something else")).toBeDefined();
    expect(screen.queryByText("(1)")).toBeNull();
    expect(document.querySelectorAll("[style*='width']")).toHaveLength(0);
  });

  it("keeps full answer text accessible on truncated rows (AC4)", async () => {
    mockFetchWith({
      questions: [
        {
          id: "q2",
          text: "Why joined?",
          type: "free_text",
          options: null,
          respondentCount: 1,
          answers: [
            {
              value: "Because I have wanted this exact product for years",
              count: 1,
              percent: 100,
            },
          ],
        },
      ],
      respondentTotal: 1,
    });
    render(<QualificationPanel subdomain="acme" waitlistId="wl-1" />);
    const row = await screen.findByTitle(
      "Because I have wanted this exact product for years"
    );
    expect(row.textContent).toContain(
      "Because I have wanted this exact product for years"
    );
  });

  it("renders one card per question (AC2)", async () => {
    mockFetchWith({
      questions: [
        question,
        { ...question, id: "q2", text: "What is your role?" },
      ],
      respondentTotal: 2,
    });
    const { container } = render(
      <QualificationPanel subdomain="acme" waitlistId="wl-1" />
    );
    await screen.findByText("How did you hear about us?");
    expect(screen.getByText("What is your role?")).toBeDefined();
    const cards = container.querySelectorAll("[class*='bg-card']");
    expect(cards).toHaveLength(2);
  });

  it("renders the meta line with respondent total and question count", async () => {
    mockFetchWith({
      questions: [
        question,
        { ...question, id: "q2", text: "What is your role?" },
      ],
      respondentTotal: 7,
    });
    const { container } = render(
      <QualificationPanel subdomain="acme" waitlistId="wl-1" />
    );
    await screen.findByText("How did you hear about us?");
    const meta = container.querySelector("p.mb-4");
    expect(meta?.textContent).toBe("7 respondents · 2 questions");
  });

  it("singularizes the meta line for one respondent and one question", async () => {
    mockFetchWith({
      questions: [{ ...question, respondentCount: 1 }],
      respondentTotal: 1,
    });
    const { container } = render(
      <QualificationPanel subdomain="acme" waitlistId="wl-1" />
    );
    await screen.findByText("How did you hear about us?");
    const meta = container.querySelector("p.mb-4");
    expect(meta?.textContent).toBe("1 respondent · 1 question");
  });

  it("renders type badges for question types", async () => {
    mockFetchWith({
      questions: [
        question,
        {
          id: "q2",
          text: "Why joined?",
          type: "free_text",
          options: null,
          respondentCount: 1,
          answers: [{ value: "Because", count: 1, percent: 100 }],
        },
      ],
      respondentTotal: 3,
    });
    render(<QualificationPanel subdomain="acme" waitlistId="wl-1" />);
    expect(await screen.findByText("Multiple choice")).toBeDefined();
    expect(screen.getByText("Free text")).toBeDefined();
  });

  it("overview variant renders panel title and View all link", async () => {
    mockFetchWith({ questions: [question], respondentTotal: 2 });
    render(
      <QualificationPanel
        subdomain="acme"
        waitlistId="wl-9"
        variant="overview"
      />
    );
    expect(await screen.findByText("Qualification Breakdown")).toBeDefined();
    const link = screen.getByRole("link", { name: /View all/ });
    expect(link.getAttribute("href")).toBe("/dashboard/qualification?wid=wl-9");
  });

  it("overview variant shows every question (3rd+ no longer hidden)", async () => {
    mockFetchWith({
      questions: [
        question,
        { ...question, id: "q2", text: "Second question?" },
        { ...question, id: "q3", text: "Third question?" },
      ],
      respondentTotal: 6,
    });
    render(
      <QualificationPanel
        subdomain="acme"
        waitlistId="wl-1"
        variant="overview"
      />
    );
    await screen.findByText("How did you hear about us?");
    expect(screen.getByText("Second question?")).toBeDefined();
    expect(screen.getByText("Third question?")).toBeDefined();
  });

  it("overview with 3+ questions switches to a bounded container grid", async () => {
    mockFetchWith({
      questions: [
        question,
        { ...question, id: "q2", text: "Second question?" },
        { ...question, id: "q3", text: "Third question?" },
      ],
      respondentTotal: 6,
    });
    const { container } = render(
      <QualificationPanel
        subdomain="acme"
        waitlistId="wl-1"
        variant="overview"
      />
    );
    await screen.findByText("How did you hear about us?");

    const grid = container.querySelector("[class*='grid-cols-3']");
    expect(grid).not.toBeNull();
    expect(grid?.className).toContain("grid-cols-1");
    expect(grid?.className).toContain("@min-[300px]:grid-cols-2");
    // no stacked divider in grid mode
    expect(grid?.querySelector(".border-t")).toBeNull();
    // container query is scoped to the panel body
    expect(container.querySelector("[class~='@container']")).not.toBeNull();

    // grid cells clamp the question text with full text in a tooltip
    const q3 = screen.getByText("Third question?");
    expect(q3.className).toContain("line-clamp-1");
    expect(q3.getAttribute("title")).toBe("Third question?");
  });

  it("overview with 1-2 questions stays in the stacked layout (unchanged)", async () => {
    mockFetchWith({
      questions: [
        question,
        { ...question, id: "q2", text: "Second question?" },
      ],
      respondentTotal: 4,
    });
    const { container } = render(
      <QualificationPanel
        subdomain="acme"
        waitlistId="wl-1"
        variant="overview"
      />
    );
    await screen.findByText("How did you hear about us?");

    const stack = container.querySelector(".space-y-4");
    expect(stack).not.toBeNull();
    expect(container.querySelector("[class*='grid-cols-3']")).toBeNull();
    // divider between stacked questions preserved
    expect(stack?.querySelector(".border-t")).not.toBeNull();
    // no clamp/tooltip in stacked mode
    const q2 = screen.getByText("Second question?");
    expect(q2.className).not.toContain("line-clamp-1");
    expect(q2.getAttribute("title")).toBeNull();
  });

  it("overview caps answers at top 2 when 3-4 questions (silent, grid mode)", async () => {
    mockFetchWith({
      questions: [
        question,
        { ...question, id: "q2", text: "Second question?" },
        {
          id: "q3",
          text: "What do you expect?",
          type: "free_text" as const,
          options: null,
          respondentCount: 4,
          answers: [
            { value: "Alpha answer", count: 2, percent: 50 },
            { value: "Beta answer", count: 1, percent: 25 },
            { value: "Gamma answer", count: 1, percent: 25 },
          ],
        },
      ],
      respondentTotal: 8,
    });
    render(
      <QualificationPanel
        subdomain="acme"
        waitlistId="wl-1"
        variant="overview"
      />
    );
    await screen.findByText("What do you expect?");
    expect(screen.getByText("Alpha answer")).toBeDefined();
    expect(screen.getByText("Beta answer")).toBeDefined();
    expect(screen.queryByText("Gamma answer")).toBeNull();
  });

  it("overview caps answers at top 1 when 5 questions", async () => {
    mockFetchWith({
      questions: [
        {
          id: "q1",
          text: "What do you expect?",
          type: "free_text" as const,
          options: null,
          respondentCount: 3,
          answers: [
            { value: "Alpha answer", count: 2, percent: 67 },
            { value: "Beta answer", count: 1, percent: 33 },
          ],
        },
        { ...question, id: "q2", text: "Second question?" },
        { ...question, id: "q3", text: "Third question?" },
        { ...question, id: "q4", text: "Fourth question?" },
        { ...question, id: "q5", text: "Fifth question?" },
      ],
      respondentTotal: 9,
    });
    render(
      <QualificationPanel
        subdomain="acme"
        waitlistId="wl-1"
        variant="overview"
      />
    );
    await screen.findByText("What do you expect?");
    expect(screen.getByText("Alpha answer")).toBeDefined();
    expect(screen.queryByText("Beta answer")).toBeNull();
    // all five questions still visible
    expect(screen.getByText("Fifth question?")).toBeDefined();
  });

  it("renders ordinal badges with accent tint (brand color)", async () => {
    mockFetchWith({ questions: [question], respondentTotal: 2 });
    const { container } = render(
      <QualificationPanel subdomain="acme" waitlistId="wl-1" />
    );
    await screen.findByText("How did you hear about us?");
    const badges = container.querySelectorAll("[class*='bg-accent/10']");
    expect(badges).toHaveLength(1);
    expect(badges[0].className).toContain("text-accent");
  });

  it("styles the View all link with accent color (brand color)", async () => {
    mockFetchWith({ questions: [question], respondentTotal: 2 });
    render(
      <QualificationPanel
        subdomain="acme"
        waitlistId="wl-9"
        variant="overview"
      />
    );
    const link = await screen.findByRole("link", { name: /View all/ });
    expect(link.className).toContain("text-accent");
    expect(link.className).not.toContain("text-muted-foreground");
  });

  it("renders respondent counts in accent brand color", async () => {
    mockFetchWith({ questions: [question], respondentTotal: 2 });
    const { container } = render(
      <QualificationPanel subdomain="acme" waitlistId="wl-1" />
    );
    await screen.findByText("How did you hear about us?");

    // meta line respondent portion + per-card respondent count
    const counts = screen.getAllByText("2 respondents");
    expect(counts).toHaveLength(2);
    for (const el of counts) {
      expect(el.className).toContain("text-accent");
    }

    // meta line still reads as one string with muted question count
    const meta = container.querySelector("p.mb-4");
    expect(meta?.textContent).toBe("2 respondents · 1 question");
    expect(meta?.querySelector("span.text-accent")?.textContent).toBe(
      "2 respondents"
    );

    // all accent spans are token-based utilities (no hex / arbitrary values)
    for (const el of container.querySelectorAll("[class*='accent']")) {
      expect(el.className).not.toMatch(/#[0-9a-fA-F]{3,8}|\[var\(/);
    }
  });
});
