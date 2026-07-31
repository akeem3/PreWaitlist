"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboardingForm } from "../context";
import { Toggle } from "../../../../components/ui/toggle";

const DEFAULT_REWARDS = [
  { name: "Refer 3 friends", value: "" },
  { name: "Refer 10 friends", value: "" },
  { name: "Refer 25 friends", value: "" },
];

const MILESTONE_REWARD_PLACEHOLDERS = [
  "e.g. Early access",
  "e.g. Skip the line + free swag",
  "e.g. Lifetime 50% off",
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
  const [milestoneErrors, setMilestoneErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    form.setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!form.waitlistId) {
      router.replace("/onboarding/1");
    }
  }, [form.waitlistId, router]);

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

  const handleBrandColorChange = useCallback(
    (value: string) => {
      setBrandColorInput(value);
      setBrandColorError(null);
      if (HEX_REGEX.test(value)) {
        setBrandColor(value);
        form.updateField("brandColor", value);
      }
    },
    [form]
  );

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
    setMilestoneErrors([]);
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

      if (milestoneEnabled) {
        const emptyRewards = rewards
          .map((r, i) => (!r.value.trim() ? i : -1))
          .filter((i) => i >= 0);
        if (emptyRewards.length > 0) {
          const errors = emptyRewards.map(
            (i) => `Reward for "${rewards[i].name}" is required`
          );
          setMilestoneErrors(errors);
          return;
        }
      }

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
          onChange={(e) => {
            setHeadline(e.target.value);
            form.updateField("headline", e.target.value);
          }}
          disabled={isSubmitting}
          className="flex w-full items-center rounded-(--radius-lg) border border-border bg-card px-3 py-3 text-sm h-15 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50"
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
          onChange={(e) => {
            setSubheadline(e.target.value);
            form.updateField("subheadline", e.target.value);
          }}
          disabled={isSubmitting}
          className="flex w-full resize-none items-center rounded-(--radius-lg) border border-border bg-card px-3 py-3 text-sm h-15 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Brand Color */}
      <div className="mb-3">
        <label className="mb-1 block text-xs text-muted-foreground">
          Brand Color
        </label>
        <div className="flex items-center gap-3">
          <div
            className="h-15 w-15 shrink-0 rounded-(--radius-lg) border border-border"
            style={{ backgroundColor: brandColor }}
          />
          <input
            type="text"
            placeholder="#0F7A5E"
            value={brandColorInput}
            onChange={(e) => handleBrandColorChange(e.target.value)}
            onBlur={handleBrandColorBlur}
            disabled={isSubmitting}
            className="flex w-full items-center rounded-(--radius-lg) border border-border bg-card px-3 py-3 text-sm h-15 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50"
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
          className="flex w-full items-center justify-center rounded-(--radius-lg) border-2 border-dashed border-border bg-card px-3 py-3 text-sm h-15 text-muted-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
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
          onChange={(e) => {
            setCtaText(e.target.value);
            form.updateField("ctaText", e.target.value);
          }}
          disabled={isSubmitting}
          className="flex w-full items-center rounded-(--radius-lg) border border-border bg-card px-3 py-3 text-sm h-15 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Meta Preview */}
      <div className="mb-3">
        <label className="mb-1 block text-xs text-muted-foreground">
          Preview
        </label>
        <div className="rounded-(--radius-lg) border border-border bg-card overflow-hidden">
          <div className="flex h-8 items-center gap-1.5 border-b border-border px-3">
            <span className="block h-2 w-2 rounded-full bg-dot-inactive" />
            <span className="block h-2 w-2 rounded-full bg-dot-inactive" />
            <span className="block h-2 w-2 rounded-full bg-dot-inactive" />
          </div>
          <div className="flex flex-col items-center p-4 text-center">
            <p className="text-sm font-bold text-foreground leading-tight">
              {headline || "Your Headline"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
              {subheadline || "Your subheadline goes here"}
            </p>
            <div className="mt-3 flex w-full max-w-[260px] items-center gap-2">
              <div className="h-7 flex-1 shrink-0 rounded border border-border bg-background px-2">
                <span className="text-[10px] leading-7 text-muted-foreground">
                  Enter your email
                </span>
              </div>
              <div className="h-7 shrink-0 rounded bg-accent px-3">
                <span className="text-[10px] leading-7 font-medium text-white whitespace-nowrap">
                  {ctaText || "Join Waitlist"}
                </span>
              </div>
            </div>
          </div>
          <div className="border-t border-border px-4 py-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">
              {form.slug
                ? `${form.slug}.mywaitlist.com`
                : "your-slug.mywaitlist.com"}
            </p>
            <p className="mt-0.5 text-xs font-bold text-foreground leading-tight">
              {headline || "Your Headline"} — Join the waitlist
            </p>
            <p className="text-[10px] text-muted-foreground leading-snug">
              {subheadline || "Your subheadline goes here"}
            </p>
          </div>
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
          <div className="mt-3 flex flex-col gap-3">
            {rewards.map((reward, index) => (
              <div key={index}>
                <p className="mb-1 text-xs font-medium text-foreground">
                  {reward.name}
                </p>
                <input
                  type="text"
                  value={reward.value}
                  onChange={(e) => handleRewardChange(index, e.target.value)}
                  placeholder={MILESTONE_REWARD_PLACEHOLDERS[index]}
                  disabled={isSubmitting}
                  className="flex w-full items-center rounded-(--radius-lg) border border-border bg-card px-3 py-3 text-sm h-15 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            ))}
            {milestoneErrors.length > 0 && (
              <div className="flex flex-col gap-1">
                {milestoneErrors.map((error, i) => (
                  <p key={i} className="text-xs text-destructive">
                    {error}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit button */}
      <div className="sticky bottom-0 flex flex-col items-center bg-background pb-14 pt-4 md:static md:px-0 md:pb-0 md:pt-0">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-14.75 w-114.5 items-center justify-center rounded-(--radius-md) bg-accent text-sm font-medium text-white transition-colors disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <span>Next →</span>
          )}
        </button>
        <Link
          href="/onboarding/2"
          className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="inline-block"
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Back</span>
        </Link>
      </div>
    </form>
  );
}
