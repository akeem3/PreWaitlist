import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";

// Design tokens (satori needs concrete values — CSS custom properties are not supported here)
const BG = "#FAF8F4"; // --color-background
const FG = "#1A1A1A"; // --color-foreground
const MUTED = "#6B6459"; // --color-muted-foreground
const ACCENT = "#0F7A5E"; // --color-accent

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 86400;
export const alt = "PreWaitlist";

const fontRegular = await readFile(
  join(process.cwd(), "public/fonts/inter-latin-400-normal.woff")
);
const fontSemiBold = await readFile(
  join(process.cwd(), "public/fonts/inter-latin-600-normal.woff")
);

function isValidHex(color: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color);
}

export function showPoweredBy(tier: unknown): boolean {
  return tier === "free";
}

function headlineFontSize(text: string): number {
  if (text.length <= 40) return 76;
  if (text.length <= 90) return 56;
  return 40;
}

export default async function Image({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  let title = `${subdomain}.prewaitlist.com`;
  let subtitle: string | null = null;
  let brand = ACCENT;
  let tier: unknown = null;

  try {
    const admin = createAdminClient();
    const { data: waitlist } = await admin
      .from("waitlists")
      .select(
        "headline, subheadline, product_name, brand_color, is_archived, founder_profiles!inner(tier)"
      )
      .eq("subdomain", subdomain)
      .single();

    if (waitlist) {
      const profiles = waitlist.founder_profiles as
        { tier?: string } | { tier?: string }[] | null;
      tier = (Array.isArray(profiles) ? profiles[0] : profiles)?.tier ?? null;

      if (!waitlist.is_archived) {
        const headline = waitlist.headline?.trim();
        const productName = waitlist.product_name?.trim();
        const subheadline = waitlist.subheadline?.trim();
        title =
          headline?.slice(0, 140) ||
          productName?.slice(0, 140) ||
          `${subdomain}.prewaitlist.com`;
        const sub = subheadline?.slice(0, 140) || productName || null;
        subtitle = sub && sub !== title ? sub : null;
        if (waitlist.brand_color && isValidHex(waitlist.brand_color)) {
          brand = waitlist.brand_color;
        }
      }
    }
  } catch {
    // Fall through to the generic card below
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: BG,
        padding: "72px 96px",
        fontFamily: "Inter",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 8,
            borderRadius: 9999,
            backgroundColor: brand,
          }}
        />
        <div
          style={{
            fontSize: headlineFontSize(title),
            fontWeight: 600,
            color: FG,
            lineHeight: 1.12,
            letterSpacing: -1.5,
            marginTop: 32,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              display: "flex",
              fontSize: 34,
              color: MUTED,
              marginTop: 24,
              maxWidth: 1000,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      {showPoweredBy(tier) ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 26,
            color: MUTED,
          }}
        >
          Powered by
          <span style={{ color: ACCENT, fontWeight: 600, marginLeft: 12 }}>
            PreWaitlist
          </span>
        </div>
      ) : null}
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: fontRegular,
          weight: 400,
          style: "normal",
        },
        {
          name: "Inter",
          data: fontSemiBold,
          weight: 600,
          style: "normal",
        },
      ],
    }
  );
}
