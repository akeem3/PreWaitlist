"use client";

import Image from "next/image";
import { useDeferredValue, useState } from "react";
import { PoweredByFooter } from "../share/powered-by-footer";

type Template = "minimal" | "bold" | "dark";
type ViewMode = "desktop" | "mobile";
type Tier = "free" | "pro" | "growth";

interface MilestoneReward {
  name: string;
  value: string;
}

interface Question {
  text: string;
  required: boolean;
}

interface LivePreviewProps {
  template: Template;
  headline: string;
  subheadline: string;
  brandColor: string;
  logoUrl: string | null;
  ctaText: string;
  milestoneRewards: MilestoneReward[];
  questions?: Question[];
  tier?: Tier;
  slug?: string;
}

function BrowserFrame({
  children,
  slug,
  template,
}: {
  children: React.ReactNode;
  slug?: string;
  template?: Template;
}) {
  const isDark = template === "dark";

  return (
    <div
      style={{
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-float)",
        border: "1px solid #CCC9C3",
        overflow: "hidden",
        width: "100%",
        background: isDark ? "#1C1917" : "#fff",
      }}
    >
      <div
        style={{
          height: 36,
          background: isDark ? "#1C1917" : "#fff",
          borderBottom: `1px solid ${isDark ? "#6B6459" : "#E5E5E5"}`,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 6,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#C3C2C2",
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#C3C2C2",
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#C3C2C2",
          }}
        />
        {slug && (
          <span
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: "var(--text-xs, 0.75rem)",
              color: "#6B6B6B",
            }}
          >
            {slug}.mywaitlist.com
          </span>
        )}
      </div>
      <div style={{ padding: "24px 32px", minHeight: 200 }}>{children}</div>
    </div>
  );
}

function MinimalTemplate({
  headline,
  subheadline,
  brandColor,
  logoUrl,
  ctaText,
  milestoneRewards,
}: LivePreviewProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 16,
        padding: "32px 0",
      }}
    >
      {logoUrl && (
        <Image
          src={logoUrl}
          alt="Logo"
          width={120}
          height={40}
          unoptimized
          style={{ height: 40, objectFit: "contain" }}
        />
      )}
      <h2
        style={{
          fontSize: "var(--text-2xl, 1.5rem)",
          fontWeight: "var(--font-semibold, 600)",
          color: "#1A1A1A",
          margin: 0,
        }}
      >
        {headline || "Your Headline"}
      </h2>
      <p
        style={{
          fontSize: "var(--text-sm, 0.875rem)",
          color: "#666",
          margin: 0,
          maxWidth: 400,
        }}
      >
        {subheadline || "Your subheadline goes here"}
      </p>
      <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 360 }}>
        <input
          type="email"
          placeholder="Email address"
          readOnly
          style={{
            flex: 1,
            minWidth: 0,
            borderRadius: "var(--radius-md, 0.5rem)",
            border: "1px solid #E5E5E5",
            padding: "10px 12px",
            fontSize: "var(--text-sm, 0.875rem)",
            color: "#1A1A1A",
            outline: "none",
          }}
        />
        <button
          type="button"
          style={{
            background: brandColor || "#0C6350",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-md, 0.5rem)",
            padding: "10px 20px",
            fontSize: "var(--text-sm, 0.875rem)",
            fontWeight: "var(--font-medium, 500)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {ctaText || "Join Waitlist"}
        </button>
      </div>
      {milestoneRewards.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            marginTop: 12,
            width: "100%",
            maxWidth: 300,
          }}
        >
          {milestoneRewards.map((r) => (
            <div
              key={r.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "var(--text-xs, 0.75rem)",
                color: "#888",
                padding: "4px 0",
                borderBottom: "1px solid #F0F0F0",
              }}
            >
              <span>{r.name}</span>
              <span style={{ color: brandColor || "#0C6350" }}>{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BoldTemplate({
  headline,
  subheadline,
  brandColor,
  logoUrl,
  ctaText,
  milestoneRewards,
}: LivePreviewProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 20,
        padding: "40px 0",
      }}
    >
      {logoUrl && (
        <Image
          src={logoUrl}
          alt="Logo"
          width={144}
          height={48}
          unoptimized
          style={{ height: 48, objectFit: "contain" }}
        />
      )}
      <h2
        style={{
          fontSize: "var(--text-3xl, 1.875rem)",
          fontWeight: "var(--font-bold, 700)",
          color: "#1A1A1A",
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        {headline || "Your Headline"}
      </h2>
      <p
        style={{
          fontSize: "var(--text-base, 1rem)",
          color: "#555",
          margin: 0,
          maxWidth: 420,
          lineHeight: 1.5,
        }}
      >
        {subheadline || "Your subheadline goes here"}
      </p>
      <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 400 }}>
        <input
          type="email"
          placeholder="Email address"
          readOnly
          style={{
            flex: 1,
            minWidth: 0,
            borderRadius: "var(--radius-md, 0.5rem)",
            border: "1px solid #1A1A1A",
            padding: "12px 14px",
            fontSize: "var(--text-base, 1rem)",
            color: "#1A1A1A",
            outline: "none",
          }}
        />
        <button
          type="button"
          style={{
            background: brandColor || "#0C6350",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-md, 0.5rem)",
            padding: "12px 28px",
            fontSize: "var(--text-base, 1rem)",
            fontWeight: "var(--font-semibold, 600)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {ctaText || "Join Waitlist"}
        </button>
      </div>
      {milestoneRewards.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 16,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {milestoneRewards.map((r) => (
            <div
              key={r.name}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: "8px 16px",
                borderRadius: "var(--radius-md, 0.5rem)",
                background: "#F9F9F9",
              }}
            >
              <span
                style={{
                  fontSize: "var(--text-lg, 1.125rem)",
                  fontWeight: "var(--font-bold, 700)",
                  color: brandColor || "#0C6350",
                }}
              >
                {r.value}
              </span>
              <span
                style={{
                  fontSize: "var(--text-xs, 0.75rem)",
                  color: "#888",
                }}
              >
                {r.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DarkTemplate({
  headline,
  subheadline,
  brandColor,
  logoUrl,
  ctaText,
  milestoneRewards,
}: LivePreviewProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 16,
        padding: "32px 0",
      }}
    >
      {logoUrl && (
        <Image
          src={logoUrl}
          alt="Logo"
          width={120}
          height={40}
          unoptimized
          style={{ height: 40, objectFit: "contain" }}
        />
      )}
      <h2
        style={{
          fontSize: "var(--text-2xl, 1.5rem)",
          fontWeight: "var(--font-semibold, 600)",
          color: "#FAFAFA",
          margin: 0,
        }}
      >
        {headline || "Your Headline"}
      </h2>
      <p
        style={{
          fontSize: "var(--text-sm, 0.875rem)",
          color: "#A8A29E",
          margin: 0,
          maxWidth: 400,
        }}
      >
        {subheadline || "Your subheadline goes here"}
      </p>
      <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 360 }}>
        <input
          type="email"
          placeholder="Email address"
          readOnly
          style={{
            flex: 1,
            minWidth: 0,
            borderRadius: "var(--radius-md, 0.5rem)",
            border: "1px solid #44403C",
            padding: "10px 12px",
            fontSize: "var(--text-sm, 0.875rem)",
            color: "#FAFAFA",
            background: "#292524",
            outline: "none",
          }}
        />
        <button
          type="button"
          style={{
            background: brandColor || "#0C6350",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-md, 0.5rem)",
            padding: "10px 20px",
            fontSize: "var(--text-sm, 0.875rem)",
            fontWeight: "var(--font-medium, 500)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {ctaText || "Join Waitlist"}
        </button>
      </div>
      {milestoneRewards.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            marginTop: 12,
            width: "100%",
            maxWidth: 300,
          }}
        >
          {milestoneRewards.map((r) => (
            <div
              key={r.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "var(--text-xs, 0.75rem)",
                color: "#78716C",
                padding: "4px 0",
                borderBottom: "1px solid #292524",
              }}
            >
              <span>{r.name}</span>
              <span style={{ color: brandColor || "#0C6350" }}>{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const templateMap = {
  minimal: MinimalTemplate,
  bold: BoldTemplate,
  dark: DarkTemplate,
} as const;

export function LivePreview({
  template,
  headline,
  subheadline,
  brandColor,
  logoUrl,
  ctaText,
  milestoneRewards,
  tier = "free",
  slug,
}: LivePreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");

  const deferredTemplate = useDeferredValue(template);
  const deferredHeadline = useDeferredValue(headline);
  const deferredSubheadline = useDeferredValue(subheadline);
  const deferredBrandColor = useDeferredValue(brandColor);
  const deferredLogoUrl = useDeferredValue(logoUrl);
  const deferredCtaText = useDeferredValue(ctaText);
  const deferredRewards = useDeferredValue(milestoneRewards);
  const deferredSlug = useDeferredValue(slug);

  const TemplateComponent = templateMap[deferredTemplate];

  const isMobile = viewMode === "mobile";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 4,
        }}
      >
        <button
          type="button"
          onClick={() => setViewMode("desktop")}
          style={{
            padding: "6px 12px",
            fontSize: "var(--text-xs, 0.75rem)",
            fontWeight: "var(--font-medium, 500)",
            border: !isMobile ? "none" : "1px solid #E5E5E5",
            borderRadius: "var(--radius-md, 0.5rem)",
            background: !isMobile ? deferredBrandColor || "#0C6350" : "#fff",
            color: !isMobile ? "#fff" : "#333",
            cursor: "pointer",
          }}
        >
          Desktop
        </button>
        <button
          type="button"
          onClick={() => setViewMode("mobile")}
          style={{
            padding: "6px 12px",
            fontSize: "var(--text-xs, 0.75rem)",
            fontWeight: "var(--font-medium, 500)",
            border: isMobile ? "none" : "1px solid #E5E5E5",
            borderRadius: "var(--radius-md, 0.5rem)",
            background: isMobile ? deferredBrandColor || "#0C6350" : "#fff",
            color: isMobile ? "#fff" : "#333",
            cursor: "pointer",
          }}
        >
          Mobile
        </button>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: isMobile ? "center" : "stretch",
        }}
      >
        <div
          style={{
            width: isMobile ? 375 : "100%",
            maxWidth: isMobile ? 375 : 787,
          }}
        >
          <BrowserFrame slug={deferredSlug} template={deferredTemplate}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100%",
              }}
            >
              <div style={{ flex: 1 }}>
                <TemplateComponent
                  template={deferredTemplate}
                  headline={deferredHeadline}
                  subheadline={deferredSubheadline}
                  brandColor={deferredBrandColor}
                  logoUrl={deferredLogoUrl}
                  ctaText={deferredCtaText}
                  milestoneRewards={deferredRewards}
                />
              </div>
              {tier === "free" && (
                <PoweredByFooter template={deferredTemplate} />
              )}
            </div>
          </BrowserFrame>
        </div>
      </div>
    </div>
  );
}
