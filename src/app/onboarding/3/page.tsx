"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboardingForm } from "../context";
import { Toggle } from "../../../../components/ui/toggle";
import MetaPreview from "../../../../components/onboarding/meta-preview";
import { createClient } from "../../../../src/lib/supabase/client";

const DEFAULT_REWARDS = [
  { threshold: 3, label: "" },
  { threshold: 10, label: "" },
  { threshold: 25, label: "" },
];

const MILESTONE_REWARD_PLACEHOLDERS = [
  "e.g. Early access",
  "e.g. Skip the line + free swag",
  "e.g. Lifetime 50% off",
];

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

const PRESET_COLORS = [
  { hex: "#0F7A5E", label: "Jade" },
  { hex: "#2563EB", label: "Blue" },
  { hex: "#7C3AED", label: "Purple" },
  { hex: "#DC2626", label: "Red" },
  { hex: "#EA580C", label: "Orange" },
  { hex: "#DB2777", label: "Pink" },
  { hex: "#92400E", label: "Brown" },
  { hex: "#1E293B", label: "Navy" },
];

export default function OnboardingStep3() {
  const router = useRouter();
  const form = useOnboardingForm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

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
  const [signupCounterEnabled, setSignupCounterEnabled] = useState(
    form.signupCounterEnabled
  );
  const [signupCounterThreshold, setSignupCounterThreshold] = useState(
    form.signupCounterThreshold
  );
  const [milestoneErrors, setMilestoneErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    form.setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleRewardChange = useCallback((index: number, label: string) => {
    setRewards((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], label };
      return next;
    });
    setMilestoneErrors([]);
  }, []);

  const handleThresholdChange = useCallback((index: number, value: string) => {
    const num = parseInt(value, 10);
    setRewards((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], threshold: isNaN(num) ? 0 : num };
      return next;
    });
    setMilestoneErrors([]);
  }, []);

  const handleAddTier = useCallback(() => {
    setRewards((prev) => {
      if (prev.length >= 5) return prev;
      const lastThreshold =
        prev.length > 0 ? prev[prev.length - 1].threshold : 0;
      return [...prev, { threshold: lastThreshold + 5, label: "" }];
    });
  }, []);

  const handleRemoveTier = useCallback((index: number) => {
    setRewards((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
    setMilestoneErrors([]);
  }, []);

  // Sync rewards to form context for live preview
  useEffect(() => {
    if (milestoneEnabled) {
      form.updateField("milestoneRewards", rewards);
    } else {
      form.updateField("milestoneRewards", []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rewards, milestoneEnabled]);

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

  const handleCounterToggle = useCallback(
    (checked: boolean) => {
      setSignupCounterEnabled(checked);
      form.updateField("signupCounterEnabled", checked);
      if (checked && signupCounterThreshold <= 0) {
        setSignupCounterThreshold(10);
        form.updateField("signupCounterThreshold", 10);
      }
    },
    [form, signupCounterThreshold]
  );

  const handleThresholdInput = useCallback(
    (value: string) => {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        setSignupCounterThreshold(num);
        form.updateField("signupCounterThreshold", num);
      }
    },
    [form]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      if (milestoneEnabled) {
        const emptyRewards = rewards
          .map((r, i) => (!r.label.trim() ? i : -1))
          .filter((i) => i >= 0);
        if (emptyRewards.length > 0) {
          const errors = emptyRewards.map(
            (i) =>
              `Reward for "Refer ${rewards[i].threshold} friends" is required`
          );
          setMilestoneErrors(errors);
          return;
        }
      }

      setIsSubmitting(true);
      form.setLoading(true);

      try {
        // Store in context/localStorage only — no API call yet
        form.updateField("headline", headline);
        form.updateField("subheadline", subheadline);
        form.updateField("brandColor", brandColor);
        form.updateField("logoUrl", logoUrl);
        form.updateField("ctaText", ctaText);
        form.updateField("milestoneRewards", milestoneEnabled ? rewards : []);
        form.updateField("signupCounterEnabled", signupCounterEnabled);
        form.updateField("signupCounterThreshold", signupCounterThreshold);

        // Check if user is already authenticated
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Already authenticated — flush directly to server, skip signup
          if ("flushToAPI" in form) {
            const waitlistId = await form.flushToAPI();
            if (waitlistId) {
              router.push("/onboarding/4");
              return;
            }
          }
          // Flush failed — try direct server check
          try {
            const res = await fetch("/api/waitlist");
            if (res.ok) {
              router.push("/onboarding/4");
              return;
            }
          } catch {
            // Fall through to signup
          }
        }

        // Not authenticated — go to signup page
        router.push("/onboarding/signup");
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
      signupCounterEnabled,
      signupCounterThreshold,
      router,
      supabase,
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
        {/* Preset swatches */}
        <div className="mb-2 flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color.hex}
              type="button"
              title={color.label}
              onClick={() => {
                setBrandColor(color.hex);
                setBrandColorInput(color.hex);
                setBrandColorError(null);
                form.updateField("brandColor", color.hex);
              }}
              className={`h-8 w-8 rounded-lg border-2 transition-all ${
                brandColor === color.hex
                  ? "border-white scale-110 ring-1 ring-black/20"
                  : "border-border hover:scale-105"
              }`}
              style={{ backgroundColor: color.hex }}
              disabled={isSubmitting}
            />
          ))}
        </div>
        {/* Hex input */}
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
        <MetaPreview
          headline={headline}
          subheadline={subheadline}
          ctaText={ctaText}
          slug={form.slug}
          brandColor={brandColor}
        />
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
              <div key={index} className="flex items-start gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-muted-foreground">
                    Refer
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={reward.threshold || ""}
                    onChange={(e) =>
                      handleThresholdChange(index, e.target.value)
                    }
                    placeholder="3"
                    disabled={isSubmitting}
                    className="w-16 rounded-(--radius-lg) border border-border bg-card px-3 py-3 text-sm text-center placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-muted-foreground">
                    friends → reward
                  </label>
                  <input
                    type="text"
                    value={reward.label}
                    onChange={(e) => handleRewardChange(index, e.target.value)}
                    placeholder={
                      MILESTONE_REWARD_PLACEHOLDERS[index] ||
                      "e.g. Special reward"
                    }
                    disabled={isSubmitting}
                    className="flex w-full items-center rounded-(--radius-lg) border border-border bg-card px-3 py-3 text-sm h-15 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                {rewards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTier(index)}
                    disabled={isSubmitting}
                    className="mt-6 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                    title="Remove tier"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            {rewards.length < 5 && (
              <button
                type="button"
                onClick={handleAddTier}
                disabled={isSubmitting}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 3V11M3 7H11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Add tier
              </button>
            )}
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

      {/* Signup Counter */}
      <div className="mb-3">
        <Toggle
          checked={signupCounterEnabled}
          onCheckedChange={handleCounterToggle}
          label="Signup counter"
          disabled={isSubmitting}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Show a real-time signup count on your public waitlist page for social
          proof.
        </p>
        {signupCounterEnabled && (
          <div className="mt-3 flex items-center gap-3">
            <label className="text-xs text-muted-foreground">
              Show when I have
            </label>
            <input
              type="number"
              min="1"
              value={signupCounterThreshold || ""}
              onChange={(e) => handleThresholdInput(e.target.value)}
              placeholder="10"
              disabled={isSubmitting}
              className="w-20 rounded-(--radius-lg) border border-border bg-card px-3 py-3 text-sm text-center placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50"
            />
            <label className="text-xs text-muted-foreground">
              or more signups
            </label>
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
