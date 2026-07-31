"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingForm } from "../context";
import { Toggle } from "../../../../components/ui/toggle";

const DEFAULT_REWARDS = [
  { name: "Refer 3 friends", value: "Refer 3 friends" },
  { name: "Refer 10 friends", value: "Refer 10 friends" },
  { name: "Refer 25 friends", value: "Refer 25 friends" },
];

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

export default function OnboardingStep3() {
  const router = useRouter();
  const form = useOnboardingForm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [headline, setHeadline] = useState(form.headline);
  const [subheadline, setSubheadline] = useState(form.subheadline);
  const [brandColor, setBrandColor] = useState(form.brandColor);
  const [brandColorInput, setBrandColorInput] = useState(form.brandColor);
  const [brandColorError, setBrandColorError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState(form.logoUrl);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [ctaText, setCtaText] = useState(form.ctaText);
  const [milestoneEnabled, setMilestoneEnabled] = useState(
    form.milestoneRewards.length > 0
  );
  const [rewards, setRewards] = useState(
    form.milestoneRewards.length > 0 ? form.milestoneRewards : DEFAULT_REWARDS
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBrandColorBlur = useCallback(() => {
    if (brandColorInput && !HEX_REGEX.test(brandColorInput)) {
      setBrandColorError("Enter a valid hex color (e.g. #0F7A5E)");
    } else {
      setBrandColorError(null);
      if (brandColorInput) {
        setBrandColor(brandColorInput);
        form.updateField("brandColor", brandColorInput);
      }
    }
  }, [brandColorInput, form]);

  const handleBrandColorChange = useCallback((value: string) => {
    setBrandColorInput(value);
    setBrandColorError(null);
  }, []);

  const handleLogoClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleLogoChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!["image/png", "image/svg+xml"].includes(file.type)) {
        alert("Only PNG and SVG files are allowed");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert("File must be under 2MB");
        return;
      }

      setLogoFile(file);
      setLogoUploading(true);

      try {
        const reader = new FileReader();
        reader.onload = () => {
          const url = reader.result as string;
          setLogoUrl(url);
          form.updateField("logoUrl", url);
          setLogoUploading(false);
        };
        reader.readAsDataURL(file);
      } catch {
        setLogoUploading(false);
      }
    },
    [form]
  );

  const handleRewardChange = useCallback((index: number, value: string) => {
    setRewards((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], value };
      return next;
    });
  }, []);

  const handleMilestoneToggle = useCallback(
    (checked: boolean) => {
      setMilestoneEnabled(checked);
      if (checked) {
        form.updateField("milestoneRewards", rewards);
      } else {
        form.updateField("milestoneRewards", []);
      }
    },
    [form, rewards]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      setIsSubmitting(true);
      form.setLoading(true);

      try {
        const res = await fetch("/api/waitlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: form.waitlistId,
            headline,
            subheadline,
            brand_color: brandColor,
            logo_url: logoUrl,
            cta_text: ctaText,
            milestone_rewards: milestoneEnabled ? rewards : [],
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to save branding");
        }

        form.updateField("headline", headline);
        form.updateField("subheadline", subheadline);
        form.updateField("brandColor", brandColor);
        form.updateField("logoUrl", logoUrl);
        form.updateField("ctaText", ctaText);
        form.updateField("milestoneRewards", milestoneEnabled ? rewards : []);
        router.push("/onboarding/4");
      } catch {
        setIsSubmitting(false);
        form.setLoading(false);
      }
    },
    [
      isSubmitting,
      form,
      headline,
      subheadline,
      brandColor,
      logoUrl,
      ctaText,
      milestoneEnabled,
      rewards,
      router,
    ]
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="mb-2">
        <p className="text-xs font-medium text-accent">Step 3 of 5</p>
        <p className="text-sm text-muted-foreground">Make it yours</p>
      </div>

      <h1 className="mb-1 text-h2">Customise your waitlist</h1>
      <p className="mb-8 text-body-lg text-muted-foreground">
        Add your brand identity. Everything can be changed later.
      </p>

      {/* Headline */}
      <div className="mb-3">
        <label className="mb-1 block text-xs text-muted-foreground">
          Headline
        </label>
        <input
          type="text"
          placeholder="e.g Buildly"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          disabled={isSubmitting}
          className="flex w-full items-center rounded-[var(--radius-lg)] border border-border bg-card px-3 py-3 text-sm h-[60px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Sub-headline */}
      <div className="mb-3">
        <label className="mb-1 block text-xs text-muted-foreground">
          Sub-headline
        </label>
        <textarea
          placeholder="The Smarter way to manage Projects"
          value={subheadline}
          onChange={(e) => setSubheadline(e.target.value)}
          disabled={isSubmitting}
          className="flex w-full resize-none items-center rounded-[var(--radius-lg)] border border-border bg-card px-3 py-3 text-sm h-[60px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Brand Color */}
      <div className="mb-3">
        <label className="mb-1 block text-xs text-muted-foreground">
          Brand Color
        </label>
        <div className="flex items-center gap-3">
          <div
            className="h-[60px] w-[60px] shrink-0 rounded-[var(--radius-lg)] border border-border"
            style={{ backgroundColor: brandColor }}
          />
          <input
            type="text"
            placeholder="#0F7A5E"
            value={brandColorInput}
            onChange={(e) => handleBrandColorChange(e.target.value)}
            onBlur={handleBrandColorBlur}
            disabled={isSubmitting}
            className="flex w-full items-center rounded-[var(--radius-lg)] border border-border bg-card px-3 py-3 text-sm h-[60px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        {brandColorError && (
          <p className="mt-1 text-xs text-destructive">{brandColorError}</p>
        )}
      </div>

      {/* Logo Upload */}
      <div className="mb-3">
        <label className="mb-1 block text-xs text-muted-foreground">Logo</label>
        <button
          type="button"
          onClick={handleLogoClick}
          disabled={isSubmitting || logoUploading}
          className="flex w-full items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-border bg-card px-3 py-3 text-sm h-[60px] text-muted-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {logoUploading
            ? "Uploading..."
            : logoFile
              ? logoFile.name
              : logoUrl
                ? "Logo uploaded — click to replace"
                : "Click to upload logo (PNG or SVG, max 2MB)"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/svg+xml"
          onChange={handleLogoChange}
          className="hidden"
        />
      </div>

      {/* CTA Text */}
      <div className="mb-3">
        <label className="mb-1 block text-xs text-muted-foreground">
          Button Text
        </label>
        <input
          type="text"
          placeholder="Join Waitlist"
          value={ctaText}
          onChange={(e) => setCtaText(e.target.value)}
          disabled={isSubmitting}
          className="flex w-full items-center rounded-[var(--radius-lg)] border border-border bg-card px-3 py-3 text-sm h-[60px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Meta Preview */}
      <div className="mb-3">
        <label className="mb-1 block text-xs text-muted-foreground">
          Preview
        </label>
        <div
          className="rounded-[var(--radius-lg)] border-2 border-dashed border-border bg-card p-4"
          style={{ borderRadius: 12.11 }}
        >
          <p className="text-sm font-semibold text-foreground">
            {headline || "Your Headline"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {subheadline || "Your subheadline goes here"}
          </p>
        </div>
      </div>

      {/* Milestone Rewards */}
      <div className="mb-3">
        <Toggle
          checked={milestoneEnabled}
          onCheckedChange={handleMilestoneToggle}
          label="Milestone rewards"
          disabled={isSubmitting}
        />
        {milestoneEnabled && (
          <div className="mt-3 flex flex-col gap-2">
            {rewards.map((reward, index) => (
              <input
                key={index}
                type="text"
                value={reward.value}
                onChange={(e) => handleRewardChange(index, e.target.value)}
                disabled={isSubmitting}
                className="flex w-full items-center rounded-[var(--radius-lg)] border border-border bg-card px-3 py-3 text-sm h-[60px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50"
              />
            ))}
          </div>
        )}
      </div>

      {/* Submit button */}
      <div className="sticky bottom-0 flex justify-center bg-background pb-14 pt-4 md:static md:px-0 md:pb-0 md:pt-0">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-[59px] w-[458px] items-center justify-center rounded-[var(--radius-md)] bg-accent text-sm font-medium text-white transition-colors disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <span>Next →</span>
          )}
        </button>
      </div>
    </form>
  );
}
