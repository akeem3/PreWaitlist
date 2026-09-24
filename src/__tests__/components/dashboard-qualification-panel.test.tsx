import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import QualificationPanel from "../../../components/dashboard/qualification-panel";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
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
    expect(screen.getByText("0 respondents")).toBeDefined();
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

    expect(await screen.findByText("4 respondents")).toBeDefined();
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

    expect(await screen.findByText("1 respondent")).toBeDefined();
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

    expect(await screen.findByText("3 respondents")).toBeDefined();
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
    render(<QualificationPanel subdomain="acme" waitlistId="wl-1" />);
    expect(
      await screen.findByText("7 respondents · 2 questions")
    ).toBeDefined();
  });

  it("singularizes the meta line for one respondent and one question", async () => {
    mockFetchWith({
      questions: [{ ...question, respondentCount: 1 }],
      respondentTotal: 1,
    });
    render(<QualificationPanel subdomain="acme" waitlistId="wl-1" />);
    expect(await screen.findByText("1 respondent · 1 question")).toBeDefined();
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

  it("overview variant shows at most two questions", async () => {
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
    expect(screen.queryByText("Third question?")).toBeNull();
  });
});
