import { test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Story 21.2 — Core Screenshot Set capture.
 *
 * Captures the ~21-shot core set to docs/qa/screenshots/ with NN-* names
 * (19.5-* prefix belongs to the mobile audit — do not collide). Writes PNGs
 * at scale:"css" with animations disabled; manifest is authored separately
 * at docs/qa/screenshots/manifest.md.
 *
 * Run: npx playwright test tests/e2e/capture-screenshots.spec.ts --reporter=list
 *
 * Prerequisites:
 * - tests/e2e/.auth/qa-credentials.json (or QA_EMAIL / QA_PASSWORD env)
 * - .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY (tier flips)
 * - Live public rows subdomains quality / p / pr (public-page shots)
 * - lvh.me resolves to 127.0.0.1 (standard local wildcard)
 */

const SHOTS_DIR = path.join(process.cwd(), "docs", "qa", "screenshots");
const CRED_PATH = path.join(
  process.cwd(),
  "tests",
  "e2e",
  ".auth",
  "qa-credentials.json"
);

const DESKTOP = { name: "desktop", width: 1280, height: 800 } as const;
const MOBILE = { name: "mobile", width: 375, height: 667 } as const;

const QA_SUBDOMAIN = "qa-mobile";
const EMPTY_SUBDOMAIN = "qa-empty";

interface ShotSpec {
  nn: string;
  id: string; // page-state slug used in the filename
  url: string; // may contain {waitlistId} / {subscriberId} / {referralCode}
  phase: "anon" | "auth" | "pro";
  viewport: "desktop" | "mobile";
  fullPage: boolean;
  inventoryId: string; // 21.1 inventory page ID
}

/**
 * Core set (AC2, founder decision 2026-10-04):
 * - each unique page once desktop in its most representative state
 * - mobile viewport for all public pages (waitlist, thank-you, leaderboard, gone)
 * - state-divergent shots: free vs pro dashboard, alternate template, empty dashboard
 */
const SHOTS: ShotSpec[] = [
  // --- Desktop public / marketing (anon) ---
  {
    nn: "01",
    id: "marketing-home",
    url: "/",
    phase: "anon",
    viewport: "desktop",
    fullPage: true,
    inventoryId: "28",
  },
  {
    nn: "02",
    id: "waitlist-populated",
    url: "http://quality.lvh.me:3000/",
    phase: "anon",
    viewport: "desktop",
    fullPage: true,
    inventoryId: "29",
  },
  {
    nn: "03",
    id: "leaderboard-public",
    url: "http://quality.lvh.me:3000/leaderboard",
    phase: "anon",
    viewport: "desktop",
    fullPage: true,
    inventoryId: "31",
  },
  {
    nn: "04",
    id: "gone-archived",
    url: "http://quality.lvh.me:3000/gone",
    phase: "anon",
    viewport: "desktop",
    fullPage: false,
    inventoryId: "guard",
  },
  {
    nn: "05",
    id: "waitlist-dark-template",
    url: "http://p.lvh.me:3000/",
    phase: "anon",
    viewport: "desktop",
    fullPage: true,
    inventoryId: "29",
  },

  // --- Desktop auth + onboarding Phase A (anon, localStorage draft) ---
  {
    nn: "06",
    id: "signup",
    url: "/signup",
    phase: "anon",
    viewport: "desktop",
    fullPage: false,
    inventoryId: "9",
  },
  {
    nn: "07",
    id: "onboarding-1",
    url: "/onboarding/1",
    phase: "anon",
    viewport: "desktop",
    fullPage: false,
    inventoryId: "1",
  },
  {
    nn: "08",
    id: "onboarding-3",
    url: "/onboarding/3",
    phase: "anon",
    viewport: "desktop",
    fullPage: false,
    inventoryId: "3",
  },

  // --- Mobile public pages ---
  {
    nn: "09",
    id: "waitlist-populated",
    url: "http://quality.lvh.me:3000/",
    phase: "anon",
    viewport: "mobile",
    fullPage: true,
    inventoryId: "29",
  },
  {
    nn: "10",
    id: "leaderboard-public",
    url: "http://quality.lvh.me:3000/leaderboard",
    phase: "anon",
    viewport: "mobile",
    fullPage: true,
    inventoryId: "31",
  },
  {
    nn: "11",
    id: "gone-archived",
    url: "http://quality.lvh.me:3000/gone",
    phase: "anon",
    viewport: "mobile",
    fullPage: false,
    inventoryId: "guard",
  },

  // --- Desktop authed: thank-you (needs seeded ids), dashboard free, settings ---
  {
    nn: "12",
    id: "thank-you",
    url: "http://{subdomain}.lvh.me:3000/thank-you?subscriber_id={subscriberId}&referral_code={referralCode}",
    phase: "auth",
    viewport: "desktop",
    fullPage: false,
    inventoryId: "30",
  },
  {
    nn: "13",
    id: "dashboard-home-free",
    url: "/dashboard?wid={waitlistId}",
    phase: "auth",
    viewport: "desktop",
    fullPage: false,
    inventoryId: "15",
  },
  {
    nn: "14",
    id: "dashboard-leaderboard",
    url: "/dashboard/leaderboard?wid={waitlistId}",
    phase: "auth",
    viewport: "desktop",
    fullPage: false,
    inventoryId: "16",
  },
  {
    nn: "15",
    id: "dashboard-warmth-free",
    url: "/dashboard/warmth?wid={waitlistId}",
    phase: "auth",
    viewport: "desktop",
    fullPage: false,
    inventoryId: "18",
  },
  {
    nn: "16",
    id: "settings-hub",
    url: "/dashboard/settings",
    phase: "auth",
    viewport: "desktop",
    fullPage: false,
    inventoryId: "22",
  },

  // --- Mobile thank-you (seeded ids) ---
  {
    nn: "17",
    id: "thank-you",
    url: "http://{subdomain}.lvh.me:3000/thank-you?subscriber_id={subscriberId}&referral_code={referralCode}",
    phase: "auth",
    viewport: "mobile",
    fullPage: false,
    inventoryId: "30",
  },

  // --- Pro phase: onboarding 5 + success, pro dashboard, empty dashboard ---
  {
    nn: "18",
    id: "onboarding-5",
    url: "/onboarding/5",
    phase: "pro",
    viewport: "desktop",
    fullPage: false,
    inventoryId: "6",
  },
  {
    nn: "19",
    id: "onboarding-success",
    url: "/onboarding/success",
    phase: "pro",
    viewport: "desktop",
    fullPage: false,
    inventoryId: "7",
  },
  {
    nn: "20",
    id: "dashboard-home-pro",
    url: "/dashboard?wid={waitlistId}",
    phase: "pro",
    viewport: "desktop",
    fullPage: false,
    inventoryId: "15",
  },
  {
    nn: "21",
    id: "dashboard-empty",
    url: "/dashboard?wid={emptyWaitlistId}",
    phase: "pro",
    viewport: "desktop",
    fullPage: false,
    inventoryId: "15",
  },
];

/** localStorage draft so Steps 1–3 render with realistic content. */
const DRAFT = {
  waitlistId: null,
  slug: QA_SUBDOMAIN,
  productName: "QA Capture",
  headline: "QA Capture Waitlist",
  subheadline: "Test waitlist for the core screenshot set.",
  template: "minimal",
  brandColor: "#0F7A5E",
  logoUrl: null,
  ctaText: "Join waitlist",
  milestoneRewards: [],
  qualificationEnabled: false,
  questions: [],
  signupCounterEnabled: false,
  signupCounterThreshold: 10,
  emailSubject: "",
  emailSenderName: "",
  emailBody: "",
  phoneMode: "off",
  tier: "free",
  loading: false,
};

function readCredentials(): { email: string; password: string; id?: string } {
  if (fs.existsSync(CRED_PATH)) {
    const raw = fs.readFileSync(CRED_PATH, "utf8").replace(/^\uFEFF/, "");
    return JSON.parse(raw);
  }
  if (process.env.QA_EMAIL && process.env.QA_PASSWORD) {
    return { email: process.env.QA_EMAIL, password: process.env.QA_PASSWORD };
  }
  throw new Error(
    `QA credentials missing — expected ${CRED_PATH} or QA_EMAIL/QA_PASSWORD env.`
  );
}

function loadEnvLocal(): Record<string, string> {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

async function setTier(tier: "free" | "pro", userId: string): Promise<void> {
  const envLocal = loadEnvLocal();
  const base =
    process.env.NEXT_PUBLIC_SUPABASE_URL || envLocal.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || envLocal.SUPABASE_SECRET_KEY;
  if (!base || !key) {
    throw new Error(
      "tier flip needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY"
    );
  }
  const res = await fetch(`${base}/rest/v1/founder_profiles?id=eq.${userId}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ tier }),
  });
  if (!res.ok) {
    throw new Error(
      `tier flip → ${tier} failed: ${res.status} ${await res.text()}`
    );
  }
}

test("capture core screenshot set", async ({ page }) => {
  test.setTimeout(240_000);
  fs.mkdirSync(SHOTS_DIR, { recursive: true });

  const captured: string[] = [];
  const failures: string[] = [];

  const setDraft = async (p: Page, t: "free" | "pro" = "free") => {
    await p.evaluate(
      ([d, tier]) => {
        const draft = { ...(d as Record<string, unknown>), tier };
        window.localStorage.setItem(
          "prewaitlist_onboarding",
          JSON.stringify(draft)
        );
      },
      [DRAFT, t] as const
    );
  };

  const shoot = async (spec: ShotSpec, ids: Record<string, string>) => {
    const url = spec.url.replace(
      /\{(\w+)\}/g,
      (_, key: string) => ids[key] ?? ""
    );
    const vp = spec.viewport === "mobile" ? MOBILE : DESKTOP;
    await page.setViewportSize({ width: vp.width, height: vp.height });
    try {
      await page.goto(url, { waitUntil: "load", timeout: 30_000 });
      await page
        .waitForLoadState("networkidle", { timeout: 5_000 })
        .catch(() => undefined);
      await page.evaluate(() => document.fonts.ready);
      await page.mouse.move(-1, -1);
      const file = `${spec.nn}-${spec.id}-${spec.viewport}.png`;
      await page.screenshot({
        path: path.join(SHOTS_DIR, file),
        fullPage: spec.fullPage,
        scale: "css",
        animations: "disabled",
        caret: "hide",
      });
      captured.push(file);
      console.log(`✓ ${file} ← ${page.url()}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failures.push(`${spec.nn}-${spec.id}: ${msg}`);
      console.error(`✗ ${spec.nn}-${spec.id} — ${msg}`);
      // Best-effort evidence shot even on failure
      try {
        const file = `${spec.nn}-${spec.id}-${spec.viewport}.png`;
        await page.screenshot({
          path: path.join(SHOTS_DIR, file),
          scale: "css",
        });
        captured.push(file);
      } catch {
        /* screenshot also failed — recorded in failures */
      }
    }
  };

  // ---------- Phase A: anon captures (no auth) ----------
  console.log("Phase A: anon captures");
  for (const spec of SHOTS.filter((s) => s.phase === "anon")) {
    if (spec.id.startsWith("onboarding-")) {
      await setDraft(page, "free");
    }
    await shoot(spec, { subdomain: QA_SUBDOMAIN });
  }

  // ---------- Login + seed ----------
  console.log("Login + seed");
  const creds = readCredentials();
  await page.setViewportSize({ width: DESKTOP.width, height: DESKTOP.height });
  await page.goto("/signin", { waitUntil: "load" });
  await page.fill('input[name="email"]', creds.email);
  await page.fill('input[name="password"]', creds.password);
  await Promise.all([
    page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30_000 }),
    page.click('button[type="submit"]'),
  ]);

  const api = page.context().request;
  const listRes = await api.get("/api/waitlist");
  const list = listRes.ok() ? await listRes.json() : [];
  const rows: {
    waitlistId?: string;
    id?: string;
    slug?: string;
    subdomain?: string;
  }[] = Array.isArray(list) ? list : [];

  const findRow = (slug: string) =>
    rows.find((w) => w.slug === slug || w.subdomain === slug);

  const qaRow = findRow(QA_SUBDOMAIN);
  let waitlistId = qaRow?.waitlistId ?? qaRow?.id ?? "";
  let freshWaitlist = false;
  if (!waitlistId) {
    const createRes = await api.post("/api/waitlist", {
      data: {
        subdomain: QA_SUBDOMAIN,
        headline: DRAFT.headline,
        subheadline: DRAFT.subheadline,
        product_name: DRAFT.productName,
        template: "minimal",
      },
    });
    if (!createRes.ok()) {
      throw new Error(
        `waitlist seed failed: ${createRes.status()} ${await createRes.text()}`
      );
    }
    waitlistId = (await createRes.json()).id as string;
    freshWaitlist = true;
  }
  console.log(`qa-mobile waitlist: ${waitlistId} (fresh=${freshWaitlist})`);

  let subscriberId = "";
  let referralCode = "";
  for (let i = 1; i <= 5; i++) {
    const res = await api.post("/api/subscribers", {
      data: {
        waitlist_id: waitlistId,
        email: `qa-capture-${i}@example.com`,
        ts: Date.now() - 5000,
      },
    });
    if (res.ok()) {
      const body = await res.json();
      if (!subscriberId) subscriberId = body.id as string;
      if (!referralCode && body.referral_code) {
        referralCode = body.referral_code as string;
      }
    }
  }
  // Fallback: pull a subscriber from the dashboard leaderboard anchors.
  if (!subscriberId || !referralCode) {
    await page.goto(`/dashboard/leaderboard?wid=${waitlistId}`, {
      waitUntil: "load",
    });
    const href = await page
      .locator('a[href^="/dashboard/subscribers/"]')
      .first()
      .getAttribute("href");
    if (href) subscriberId = subscriberId || (href.split("/").pop() ?? "");
    if (subscriberId) {
      const subRes = await api.get(`/api/subscribers/${subscriberId}`);
      if (subRes.ok()) {
        const j = await subRes.json();
        referralCode = referralCode || (j.referral_code as string) || "";
      }
    }
  }
  if (!subscriberId || !referralCode) {
    throw new Error(
      `seed incomplete — subscriberId=${subscriberId} referralCode=${referralCode}`
    );
  }

  const ids = {
    waitlistId,
    subscriberId,
    referralCode,
    subdomain: QA_SUBDOMAIN,
    emptyWaitlistId: "",
  };

  // ---------- Phase B: authed free-tier captures ----------
  console.log("Phase B: authed free captures");
  for (const spec of SHOTS.filter((s) => s.phase === "auth")) {
    await shoot(spec, ids);
  }

  // ---------- Phase C: pro flips ----------
  console.log("Phase C: pro captures");
  if (!creds.id) {
    // Derive user id from the profile endpoint if the creds file lacks it.
    const profRes = await api.get("/api/profile");
    if (!profRes.ok()) {
      throw new Error(`profile fetch failed: ${profRes.status()}`);
    }
    // profile response has no raw id — fall back to waitlist founder via REST
    const envLocal = loadEnvLocal();
    const base =
      process.env.NEXT_PUBLIC_SUPABASE_URL || envLocal.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY || envLocal.SUPABASE_SECRET_KEY;
    if (base && key) {
      const wRes = await fetch(
        `${base}/rest/v1/waitlists?id=eq.${waitlistId}&select=founder_id`,
        {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
        }
      );
      const wRows = await wRes.json();
      if (Array.isArray(wRows) && wRows[0]?.founder_id) {
        creds.id = wRows[0].founder_id as string;
      }
    }
  }
  if (!creds.id) {
    throw new Error("cannot resolve founder user id for tier flip");
  }

  await setTier("pro", creds.id);

  // Ensure an empty waitlist exists for the empty-dashboard shot (pro = unlimited).
  let emptyRow = findRow(EMPTY_SUBDOMAIN);
  let emptyWaitlistId = emptyRow?.waitlistId ?? emptyRow?.id ?? "";
  if (!emptyWaitlistId) {
    // Re-read the list — we may have created qa-mobile above.
    const freshList = await api.get("/api/waitlist");
    const freshRows: {
      waitlistId?: string;
      id?: string;
      slug?: string;
      subdomain?: string;
    }[] = freshList.ok() ? await freshList.json() : [];
    emptyRow = freshRows.find(
      (w) => w.slug === EMPTY_SUBDOMAIN || w.subdomain === EMPTY_SUBDOMAIN
    );
    emptyWaitlistId = emptyRow?.waitlistId ?? emptyRow?.id ?? "";
  }
  if (!emptyWaitlistId) {
    const createRes = await api.post("/api/waitlist", {
      data: {
        subdomain: EMPTY_SUBDOMAIN,
        headline: "Empty State Capture",
        subheadline: "Zero-subscriber dashboard state.",
        product_name: "QA Empty",
        template: "minimal",
      },
    });
    if (createRes.ok()) {
      emptyWaitlistId = (await createRes.json()).id as string;
    } else {
      console.warn(
        `qa-empty create failed (${createRes.status()}) — empty-dashboard shot will fall back to qa-mobile`
      );
    }
  }
  ids.emptyWaitlistId = emptyWaitlistId || waitlistId;
  console.log(`qa-empty waitlist: ${ids.emptyWaitlistId}`);

  for (const spec of SHOTS.filter((s) => s.phase === "pro")) {
    await setDraft(page, "pro");
    await shoot(spec, ids);
  }

  // ---------- Restore free tier (re-run determinism) ----------
  await setTier("free", creds.id);
  console.log("Tier restored to free");

  // ---------- Summary ----------
  console.log(`\nCaptured ${captured.length}/${SHOTS.length} shots`);
  if (failures.length > 0) {
    console.error(`Failures (${failures.length}):\n${failures.join("\n")}`);
    throw new Error(`${failures.length} captures failed`);
  }
});
