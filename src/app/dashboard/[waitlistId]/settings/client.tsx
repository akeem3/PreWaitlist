"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SettingsTabs } from "../../../../../components/dashboard/settings/tabs";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { LivePreview } from "../../../../../components/onboarding/live-preview";

interface WaitlistData {
  id: string;
  headline: string | null;
  subheadline: string | null;
  cta_text: string | null;
  logo_url: string | null;
  brand_color: string | null;
  template: string | null;
  sender_name: string | null;
  cold_threshold: number | null;
  is_archived: boolean | null;
  tier: string;
  business_address: string | null;
}

interface WaitlistSettingsClientProps {
  waitlist: WaitlistData;
}

const TABS = [
  { id: "content", label: "Content" },
  { id: "email", label: "Email" },
  { id: "warmth", label: "Warmth" },
  { id: "advanced", label: "Advanced" },
];

export default function WaitlistSettingsClient({
  waitlist,
}: WaitlistSettingsClientProps) {
  const [activeTab, setActiveTab] = useState("content");
  const [headline, setHeadline] = useState(waitlist.headline ?? "");
  const [subheadline, setSubheadline] = useState(waitlist.subheadline ?? "");
  const [ctaText, setCtaText] = useState(waitlist.cta_text ?? "");
  const [logoUrl, setLogoUrl] = useState(waitlist.logo_url ?? "");
  const [brandColor, setBrandColor] = useState(
    waitlist.brand_color ?? "#0F7A5E"
  );
  const [senderName, setSenderName] = useState(waitlist.sender_name ?? "");
  const [businessAddress, setBusinessAddress] = useState(
    waitlist.business_address ?? ""
  );
  const [coldThreshold, setColdThreshold] = useState(
    waitlist.cold_threshold ?? 40
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const isFreeTier = waitlist.tier === "free";

  const saveField = useCallback(
    async (field: string, value: string | number | null) => {
      setSaving(true);
      setSaved(false);
      try {
        await fetch("/api/waitlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ waitlist_id: waitlist.id, [field]: value }),
        });
        setSaved(true);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => setSaved(false), 2000);
      } catch {
        // silent
      } finally {
        setSaving(false);
      }
    },
    [waitlist.id]
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  async function handleArchive() {
    setArchiving(true);
    try {
      await fetch("/api/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waitlist_id: waitlist.id,
          is_archived: true,
          archived_at: new Date().toISOString(),
        }),
      });
      router.refresh();
    } catch {
      // silent
    } finally {
      setArchiving(false);
    }
  }

  async function handleUnarchive() {
    setArchiving(true);
    try {
      await fetch("/api/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waitlist_id: waitlist.id,
          is_archived: false,
          archived_at: null,
        }),
      });
      router.refresh();
    } catch {
      // silent
    } finally {
      setArchiving(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-h3 font-semibold text-foreground">
          Waitlist Settings
        </h1>
        <p className="mt-1 text-body text-muted-foreground">
          Configure your waitlist content, email, and advanced options.
        </p>
      </div>

      <SettingsTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="mt-6">
        {activeTab === "content" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-h4 font-medium text-foreground">
                Content
              </h2>
              <div className="space-y-4">
                <Input
                  label="Headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  onBlur={() => saveField("headline", headline)}
                  placeholder="Join the waitlist"
                />
                <Input
                  label="Sub-headline"
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  onBlur={() => saveField("subheadline", subheadline)}
                  placeholder="Be the first to know when we launch"
                />
                <Input
                  label="Button text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  onBlur={() => saveField("cta_text", ctaText)}
                  placeholder="Join waitlist"
                />
                <Input
                  label="Logo URL"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  onBlur={() => saveField("logo_url", logoUrl)}
                  placeholder="https://example.com/logo.png"
                />
                <div>
                  <label className="mb-1.5 block text-body-sm font-medium text-foreground">
                    Brand color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      onBlur={() => saveField("brand_color", brandColor)}
                      className="h-10 w-10 cursor-pointer rounded-lg border border-border"
                    />
                    <Input
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      onBlur={() => saveField("brand_color", brandColor)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              {saving && (
                <p className="mt-3 text-xs text-muted-foreground">Saving…</p>
              )}
              {saved && !saving && (
                <p className="mt-3 text-xs text-accent">Saved</p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="mb-3 text-overline text-muted-foreground">
                Preview
              </p>
              <LivePreview
                template={
                  (waitlist.template as "minimal" | "bold" | "dark") ??
                  "minimal"
                }
                headline={headline}
                subheadline={subheadline}
                ctaText={ctaText}
                brandColor={brandColor}
                logoUrl={logoUrl}
                milestoneRewards={[]}
              />
            </div>
          </div>
        )}

        {activeTab === "email" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-h4 font-medium text-foreground">Email</h2>
            <div className="max-w-md space-y-4">
              <Input
                label="Sender name"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                onBlur={() => saveField("sender_name", senderName)}
                placeholder="Acme"
                helperText="Name subscribers see in their inbox. Falls back to your waitlist headline."
              />
              <Input
                label="Business address"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                onBlur={() => saveField("business_address", businessAddress)}
                placeholder="Acme Inc., 123 Main St, City, State 12345"
                helperText="Physical address required in marketing emails (CAN-SPAM)."
              />
            </div>
            {saving && (
              <p className="mt-3 text-xs text-muted-foreground">Saving…</p>
            )}
            {saved && !saving && (
              <p className="mt-3 text-xs text-accent">Saved</p>
            )}
          </div>
        )}

        {activeTab === "warmth" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-h4 font-medium text-foreground">Warmth</h2>
            {isFreeTier ? (
              <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-4 py-6">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="shrink-0 text-muted-foreground"
                >
                  <rect
                    x="2.5"
                    y="5"
                    width="7"
                    height="5.5"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M4 5V3.5C4 2.4 4.9 1.5 6 1.5C7.1 1.5 8 2.4 8 3.5V5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
                <p className="text-body-sm text-muted-foreground">
                  Upgrade to Pro to configure warmth thresholds.
                </p>
              </div>
            ) : (
              <div className="max-w-md space-y-4">
                <Input
                  label="Cold threshold (%)"
                  type="number"
                  min={20}
                  max={80}
                  value={String(coldThreshold)}
                  onChange={(e) => setColdThreshold(Number(e.target.value))}
                  onBlur={() => saveField("cold_threshold", coldThreshold)}
                  helperText="Subscribers below this score are marked cold. Range: 20–80."
                />
              </div>
            )}
            {saving && (
              <p className="mt-3 text-xs text-muted-foreground">Saving…</p>
            )}
            {saved && !saving && (
              <p className="mt-3 text-xs text-accent">Saved</p>
            )}
          </div>
        )}

        {activeTab === "advanced" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-h4 font-medium text-foreground">
              Advanced
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-body-sm font-medium text-foreground">
                  Archive waitlist
                </h3>
                <p className="mb-3 text-body-sm text-muted-foreground">
                  Archiving hides your public page and stops new signups. You
                  can unarchive at any time.
                </p>
                {waitlist.is_archived ? (
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      Archived
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUnarchive}
                      disabled={archiving}
                    >
                      {archiving ? "Working…" : "Unarchive"}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Archiving your waitlist will stop new signups and hide your public page. This can be undone. Continue?"
                        )
                      ) {
                        handleArchive();
                      }
                    }}
                    disabled={archiving}
                  >
                    {archiving ? "Archiving…" : "Archive waitlist"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
