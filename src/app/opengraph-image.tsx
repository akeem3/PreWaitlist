import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Design tokens (satori needs concrete values — CSS custom properties are not supported here)
const BG = "#FAF8F4"; // --color-background
const FG = "#1A1A1A"; // --color-foreground
const MUTED = "#6B6459"; // --color-muted-foreground
const ACCENT = "#0F7A5E"; // --color-accent

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 300;
export const alt = "PreWaitlist";

const fontRegular = await readFile(
  join(process.cwd(), "public/fonts/inter-latin-400-normal.woff")
);
const fontSemiBold = await readFile(
  join(process.cwd(), "public/fonts/inter-latin-600-normal.woff")
);

/**
 * Branded fallback card for every route without a page-specific
 * opengraph-image (marketing, auth, dashboard, legal). Copy is the existing
 * root metadata title/description only.
 */
export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: BG,
        padding: "72px 80px",
        fontFamily: "Inter",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: ACCENT,
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 600,
            color: FG,
            lineHeight: 1.12,
            letterSpacing: -1.5,
          }}
        >
          PreWaitlist
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: MUTED,
            marginTop: 24,
          }}
        >
          Pre-launch waitlist builder
        </div>
      </div>
      <div
        style={{
          display: "flex",
          width: 160,
          height: 8,
          borderRadius: 4,
          backgroundColor: ACCENT,
        }}
      />
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
