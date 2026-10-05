import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../helpers/supabase-mock";

const mockSupabase = createMockSupabaseClient();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

import { GET } from "../../app/api/subscribers/export/route";

// 19.2 AC4: column order documented here — Quality sits adjacent to Warmth.
const BASE_HEADER = "Email,Name,Position,Referrals,Warmth,Quality,Signup Date";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function makeGet(url: string) {
  return new Request(url);
}

describe("GET /api/subscribers/export (14.4 AC1/AC2e)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.__queue.length = 0;
  });

  it("returns 401 when not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const response = await GET(
      makeGet("http://localhost/api/subscribers/export?wid=w-1")
    );
    expect(response.status).toBe(401);
  });

  it("exports one column per configured question with RFC 4180 escaping", async () => {
    const created1 = "2026-01-05T12:00:00.000Z";
    const created2 = "2026-02-10T12:00:00.000Z";

    mockSupabase.__queue.push({
      data: { id: "w-1", subdomain: "acme" },
      error: null,
    });
    mockSupabase.__queue.push({
      data: [
        { id: "q1", question_text: "Company, size", sort_order: 0 },
        { id: "q2", question_text: "Role", sort_order: 1 },
      ],
      error: null,
    });
    mockSupabase.__queue.push({
      data: [
        {
          id: "s1",
          email: "a@b.com",
          display_name: "Ann",
          created_at: created1,
          warmth_score: "hot",
          qual_answers: { q1: "Acme, Inc", q2: "Engineer" },
        },
        {
          id: "s2",
          email: "solo@b.com",
          display_name: null,
          created_at: created2,
          warmth_score: null,
          qual_answers: null,
        },
      ],
      error: null,
    });
    mockSupabase.__queue.push({ data: [], error: null });

    const response = await GET(
      makeGet("http://localhost/api/subscribers/export?wid=w-1")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="acme-subscribers.csv"'
    );

    const csv = await response.text();
    const expected = [
      `${BASE_HEADER},"Company, size",Role`,
      `a@b.com,Ann,1,0,hot,,"${formatDate(created1)}","Acme, Inc",Engineer`,
      `solo@b.com,,2,0,,,"${formatDate(created2)}",,`,
    ].join("\n");
    expect(csv).toBe(expected);
  });

  it("exports base columns only when no questions are configured", async () => {
    const created = "2026-03-01T12:00:00.000Z";

    mockSupabase.__queue.push({
      data: { id: "w-1", subdomain: "plain" },
      error: null,
    });
    mockSupabase.__queue.push({ data: [], error: null });
    mockSupabase.__queue.push({
      data: [
        {
          id: "s1",
          email: "solo@b.com",
          display_name: null,
          created_at: created,
          warmth_score: "cold",
          qual_answers: null,
        },
      ],
      error: null,
    });
    mockSupabase.__queue.push({ data: [], error: null });

    const response = await GET(
      makeGet("http://localhost/api/subscribers/export?wid=w-1")
    );

    expect(response.status).toBe(200);
    const csv = await response.text();
    const lines = csv.split("\n");
    expect(lines[0]).toBe(BASE_HEADER);
    expect(lines[1]).toBe(`solo@b.com,,1,0,cold,,"${formatDate(created)}"`);
  });

  it("escapes double quotes inside free-text answers", async () => {
    const created = "2026-04-01T12:00:00.000Z";

    mockSupabase.__queue.push({
      data: { id: "w-1", subdomain: "quoted" },
      error: null,
    });
    mockSupabase.__queue.push({
      data: [{ id: "q1", question_text: "Role", sort_order: 0 }],
      error: null,
    });
    mockSupabase.__queue.push({
      data: [
        {
          id: "s1",
          email: "q@b.com",
          display_name: null,
          created_at: created,
          warmth_score: null,
          qual_answers: { q1: 'Said "yes" today' },
        },
      ],
      error: null,
    });
    mockSupabase.__queue.push({ data: [], error: null });

    const response = await GET(
      makeGet("http://localhost/api/subscribers/export?wid=w-1")
    );

    expect(response.status).toBe(200);
    const csv = await response.text();
    expect(csv).toContain(`,"Said ""yes"" today"`);
  });

  it("returns plain-text notice when there are no subscribers", async () => {
    mockSupabase.__queue.push({
      data: { id: "w-1", subdomain: "empty" },
      error: null,
    });
    mockSupabase.__queue.push({ data: [], error: null });
    mockSupabase.__queue.push({ data: [], error: null });

    const response = await GET(
      makeGet("http://localhost/api/subscribers/export?wid=w-1")
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("No subscribers to export");
  });

  // --- Phone column (phone collection) ---

  const PHONE_HEADER =
    "Email,Name,Phone,Position,Referrals,Warmth,Quality,Signup Date";

  it("inserts a Phone column after Name when phone_mode is enabled", async () => {
    const created = "2026-05-01T12:00:00.000Z";

    mockSupabase.__queue.push({
      data: { id: "w-1", subdomain: "phonewl", phone_mode: "required" },
      error: null,
    });
    mockSupabase.__queue.push({ data: [], error: null });
    mockSupabase.__queue.push({
      data: [
        {
          id: "s1",
          email: "p@b.com",
          display_name: "Pat",
          created_at: created,
          warmth_score: "hot",
          qual_answers: null,
          phone: "+15551234567",
        },
        {
          id: "s2",
          email: "none@b.com",
          display_name: null,
          created_at: created,
          warmth_score: null,
          qual_answers: null,
          phone: null,
        },
      ],
      error: null,
    });
    mockSupabase.__queue.push({ data: [], error: null });

    const response = await GET(
      makeGet("http://localhost/api/subscribers/export?wid=w-1")
    );

    expect(response.status).toBe(200);
    const csv = await response.text();
    const lines = csv.split("\n");
    expect(lines[0]).toBe(PHONE_HEADER);
    const quotedDate = `"${formatDate(created)}"`;
    expect(lines[1]).toBe(`p@b.com,Pat,+15551234567,1,0,hot,,` + quotedDate);
    expect(lines[2]).toBe(`none@b.com,,,2,0,,,` + quotedDate);
  });

  it("keeps the base header and cells when phone_mode is off", async () => {
    const created = "2026-06-01T12:00:00.000Z";

    mockSupabase.__queue.push({
      data: { id: "w-1", subdomain: "offwl", phone_mode: "off" },
      error: null,
    });
    mockSupabase.__queue.push({ data: [], error: null });
    mockSupabase.__queue.push({
      data: [
        {
          id: "s1",
          email: "solo@b.com",
          display_name: null,
          created_at: created,
          warmth_score: "warm",
          qual_answers: null,
          phone: "+15559999999",
        },
      ],
      error: null,
    });
    mockSupabase.__queue.push({ data: [], error: null });

    const response = await GET(
      makeGet("http://localhost/api/subscribers/export?wid=w-1")
    );

    expect(response.status).toBe(200);
    const csv = await response.text();
    const lines = csv.split("\n");
    // mode off → phone value never reaches the file, even if a row has one
    expect(lines[0]).toBe(BASE_HEADER);
    expect(lines[1]).toBe(
      `solo@b.com,,1,0,warm,,` + `"${formatDate(created)}"`
    );
    expect(csv).not.toContain("+15559999999");
  });

  // --- 19.2: Quality column (AC1-AC4) + formula-injection hardening (AC8) ---

  it("19.2 AC1/AC2/AC4: Quality column sits after Warmth and renders the dashboard's referral-quality %", async () => {
    const created = "2026-07-04T12:00:00.000Z";
    const quotedDate = `"${formatDate(created)}"`;

    mockSupabase.__queue.push({
      data: { id: "w-1", subdomain: "qual", phone_mode: "off" },
      error: null,
    });
    mockSupabase.__queue.push({ data: [], error: null });
    mockSupabase.__queue.push({
      data: [
        {
          id: "s1",
          email: "a@b.com",
          display_name: "Ann",
          created_at: created,
          warmth_score: "hot",
          qual_answers: null,
        },
        {
          id: "s2",
          email: "solo@b.com",
          display_name: null,
          created_at: created,
          warmth_score: "warm",
          qual_answers: null,
        },
      ],
      error: null,
    });
    // batch referral counts: s1 made 2, s2 made 1 → total 3
    mockSupabase.__queue.push({
      data: [
        { referrer_id: "s1" },
        { referrer_id: "s1" },
        { referrer_id: "s2" },
      ],
      error: null,
    });

    const response = await GET(
      makeGet("http://localhost/api/subscribers/export?wid=w-1")
    );

    expect(response.status).toBe(200);
    const csv = await response.text();
    const lines = csv.split("\n");
    // AC4: order locked — Quality between Warmth and Signup Date
    expect(lines[0]).toBe(
      "Email,Name,Position,Referrals,Warmth,Quality,Signup Date"
    );
    // AC2: dashboard formula — round(referrals / totalReferrals * 100)
    expect(lines[1]).toBe(`a@b.com,Ann,1,2,hot,67%,` + quotedDate);
    expect(lines[2]).toBe(`solo@b.com,,2,1,warm,33%,` + quotedDate);
  });

  it("19.2 AC2: Quality is empty when no referrals exist (dashboard null → blank cell)", async () => {
    const created = "2026-07-05T12:00:00.000Z";

    mockSupabase.__queue.push({
      data: { id: "w-1", subdomain: "noref", phone_mode: "off" },
      error: null,
    });
    mockSupabase.__queue.push({ data: [], error: null });
    mockSupabase.__queue.push({
      data: [
        {
          id: "s1",
          email: "solo@b.com",
          display_name: null,
          created_at: created,
          warmth_score: "cold",
          qual_answers: null,
        },
      ],
      error: null,
    });
    mockSupabase.__queue.push({ data: [], error: null });

    const response = await GET(
      makeGet("http://localhost/api/subscribers/export?wid=w-1")
    );

    expect(response.status).toBe(200);
    const lines = (await response.text()).split("\n");
    expect(lines[1]).toBe(
      `solo@b.com,,1,0,cold,,` + `"${formatDate(created)}"`
    );
  });

  it("19.2 AC8: formula-leading subscriber text is prefixed with an apostrophe (OWASP WSTG-INPV-21)", async () => {
    const created = "2026-07-06T12:00:00.000Z";

    mockSupabase.__queue.push({
      data: { id: "w-1", subdomain: "hardened", phone_mode: "off" },
      error: null,
    });
    mockSupabase.__queue.push({
      data: [
        { id: "q1", question_text: "Role", sort_order: 0 },
        { id: "q2", question_text: "Note", sort_order: 1 },
        { id: "q3", question_text: "Pick", sort_order: 2 },
      ],
      error: null,
    });
    mockSupabase.__queue.push({
      data: [
        {
          id: "s1",
          email: "x@b.com",
          display_name: null,
          created_at: created,
          warmth_score: null,
          qual_answers: {
            q1: "=1+1",
            q2: "@SUM(1)",
            q3: "=IF(1,2,3)",
          },
        },
      ],
      error: null,
    });
    mockSupabase.__queue.push({ data: [], error: null });

    const response = await GET(
      makeGet("http://localhost/api/subscribers/export?wid=w-1")
    );

    expect(response.status).toBe(200);
    const csv = await response.text();
    // plain formula lead → apostrophe prefix, no quoting needed
    expect(csv).toContain("'=1+1");
    expect(csv).toContain("'@SUM(1)");
    // harden happens BEFORE RFC4180 quoting (comma-bearing payload still quoted)
    expect(csv).toContain(`"'=IF(1,2,3)"`);
    // never emits a raw formula-leading cell
    expect(csv.split("\n")[1]).not.toMatch(/(^|,)[=+@]/);
  });
});
