"use client";

import { useDeferredValue, useState } from "react";

type Template = "minimal" | "bold" | "dark";
type ViewMode = "desktop" | "mobile";

interface MilestoneReward {
  name: string;
  value: string;
}

interface LivePreviewProps {
  template: Template;
  headline: string;
  subheadline: string;
  brandColor: string;
  logoUrl: string | null;
  ctaText: string;
  milestoneRewards: MilestoneReward[];
}

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-float)",
        border: "1px solid #CCC9C3",
        overflow: "hidden",
        width: "100%",
        background: "#fff",
      }}
    >
      <div
        style={{
          height: 36,
          background: "#fff",
          borderBottom: "1px solid #E5E5E5",
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
        <img
          src={logoUrl}
          alt="Logo"
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
      <button
        type="button"
        style={{
          background: brandColor || "#0C6350",
          color: "#fff",
          border: "none",
          borderRadius: "var(--radius-md, 0.5rem)",
          padding: "10px 24px",
          fontSize: "var(--text-sm, 0.875rem)",
          fontWeight: "var(--font-medium, 500)",
          cursor: "pointer",
        }}
      >
        {ctaText || "Join Waitlist"}
      </button>
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
        <img
          src={logoUrl}
          alt="Logo"
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
      <button
        type="button"
        style={{
          background: brandColor || "#0C6350",
          color: "#fff",
          border: "none",
          borderRadius: "var(--radius-md, 0.5rem)",
          padding: "12px 32px",
          fontSize: "var(--text-base, 1rem)",
          fontWeight: "var(--font-semibold, 600)",
          cursor: "pointer",
        }}
      >
        {ctaText || "Join Waitlist"}
      </button>
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
        background: "#1C1917",
        margin: "0 -32px",
        padding: "48px 32px",
      }}
    >
      {logoUrl && (
        <img
          src={logoUrl}
          alt="Logo"
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
      <button
        type="button"
        style={{
          background: brandColor || "#0C6350",
          color: "#fff",
          border: "none",
          borderRadius: "var(--radius-md, 0.5rem)",
          padding: "10px 24px",
          fontSize: "var(--text-sm, 0.875rem)",
          fontWeight: "var(--font-medium, 500)",
          cursor: "pointer",
        }}
      >
        {ctaText || "Join Waitlist"}
      </button>
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
}: LivePreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");

  const deferredTemplate = useDeferredValue(template);
  const deferredHeadline = useDeferredValue(headline);
  const deferredSubheadline = useDeferredValue(subheadline);
  const deferredBrandColor = useDeferredValue(brandColor);
  const deferredLogoUrl = useDeferredValue(logoUrl);
  const deferredCtaText = useDeferredValue(ctaText);
  const deferredRewards = useDeferredValue(milestoneRewards);

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
            border: "1px solid #E5E5E5",
            borderRadius: "var(--radius-md, 0.5rem)",
            background: !isMobile ? "#F5F5F5" : "#fff",
            color: "#333",
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
            border: "1px solid #E5E5E5",
            borderRadius: "var(--radius-md, 0.5rem)",
            background: isMobile ? "#F5F5F5" : "#fff",
            color: "#333",
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
          <BrowserFrame>
            <TemplateComponent
              template={deferredTemplate}
              headline={deferredHeadline}
              subheadline={deferredSubheadline}
              brandColor={deferredBrandColor}
              logoUrl={deferredLogoUrl}
              ctaText={deferredCtaText}
              milestoneRewards={deferredRewards}
            />
          </BrowserFrame>
        </div>
      </div>
    </div>
  );
}
