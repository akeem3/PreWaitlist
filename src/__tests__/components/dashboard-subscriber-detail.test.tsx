import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const PAGE_PATH = path.join(
  process.cwd(),
  "src",
  "app",
  "dashboard",
  "subscribers",
  "[id]",
  "page.tsx"
);

describe("Subscriber Detail Page", () => {
  it("file exists at expected path", () => {
    expect(fs.existsSync(PAGE_PATH)).toBe(true);
  });

  it("exports a default async function", async () => {
    const content = fs.readFileSync(PAGE_PATH, "utf-8");
    expect(content).toContain("export default async function");
  });

  it("uses createClient from supabase server", () => {
    const content = fs.readFileSync(PAGE_PATH, "utf-8");
    expect(content).toContain("createClient");
  });

  it("queries subscribers table with join to waitlists", () => {
    const content = fs.readFileSync(PAGE_PATH, "utf-8");
    expect(content).toContain('.from("subscribers")');
    expect(content).toContain("waitlists!inner");
  });

  it("checks founder ownership via waitlists.founder_id", () => {
    const content = fs.readFileSync(PAGE_PATH, "utf-8");
    expect(content).toContain("founder_id");
  });

  it("queries referrals for the subscriber", () => {
    const content = fs.readFileSync(PAGE_PATH, "utf-8");
    expect(content).toContain('"referrer_id"');
  });

  it("redirects to /signin when no user", () => {
    const content = fs.readFileSync(PAGE_PATH, "utf-8");
    expect(content).toContain('redirect("/signin")');
  });

  it("calls notFound when subscriber not found or not owned", () => {
    const content = fs.readFileSync(PAGE_PATH, "utf-8");
    expect(content).toContain("notFound()");
  });

  it("renders back link to dashboard", () => {
    const content = fs.readFileSync(PAGE_PATH, "utf-8");
    expect(content).toContain('href="/dashboard"');
    expect(content).toContain("Back to dashboard");
  });

  it("displays position, referrals, and joined date", () => {
    const content = fs.readFileSync(PAGE_PATH, "utf-8");
    expect(content).toContain("Position");
    expect(content).toContain("Referrals");
    expect(content).toContain("Joined");
  });

  it("displays email and referral code sections", () => {
    const content = fs.readFileSync(PAGE_PATH, "utf-8");
    expect(content).toContain("Email");
    expect(content).toContain("Referral code");
  });

  it("conditionally renders referred subscribers list", () => {
    const content = fs.readFileSync(PAGE_PATH, "utf-8");
    expect(content).toContain("Referred subscribers");
    expect(content).toContain("referralCount > 0");
  });

  it("conditionally renders qualification answers", () => {
    const content = fs.readFileSync(PAGE_PATH, "utf-8");
    expect(content).toContain("Qualification answers");
    expect(content).toContain("qual_answers");
  });

  it("selects milestones_earned and conditionally renders rewards section", () => {
    const content = fs.readFileSync(PAGE_PATH, "utf-8");
    expect(content).toContain("milestones_earned");
    expect(content).toContain("Milestones earned");
    expect(content).toContain(
      "milestonesEarned && milestonesEarned.length > 0"
    );
  });

  it("resolves qualification answer labels from question ids", () => {
    const content = fs.readFileSync(PAGE_PATH, "utf-8");
    expect(content).toContain("questionLabels.get");
    expect(content).toContain("question_text");
  });

  it("formats created_at date as YYYY-MM-DD", () => {
    const content = fs.readFileSync(PAGE_PATH, "utf-8");
    expect(content).toContain('.split("T")[0]');
  });

  // --- Phone collection ---

  it("selects phone and waitlists.phone_mode", () => {
    const content = fs.readFileSync(PAGE_PATH, "utf-8");
    expect(content).toContain("milestones_earned, phone,");
    expect(content).toContain("headline, phone_mode");
  });

  it("gates the Phone card on phone_mode and renders it after Email", () => {
    const content = fs.readFileSync(PAGE_PATH, "utf-8");
    expect(content).toContain('(waitlistRow.phone_mode ?? "off") !== "off"');
    expect(content).toContain("phoneEnabled &&");
    // Phone card sits between the Email card and the Referral code card
    expect(content).toMatch(
      /Email\s*<\/h3>[\s\S]*?Phone\s*<\/h3>[\s\S]*?Referral code\s*<\/h3>/
    );
    // empty phone renders an em-dash, never a blank
    expect(content).toContain('subscriber.phone || "\\u2014"');
  });
});
