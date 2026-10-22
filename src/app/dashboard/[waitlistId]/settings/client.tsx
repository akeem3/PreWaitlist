"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SettingsTabs } from "../../../../../components/dashboard/settings/tabs";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { LivePreview } from "../../../../../components/onboarding/live-preview";
import { Breadcrumb } from "../../../../../components/dashboard/breadcrumb";
import QuestionEditor, {
  sanitizeQuestions,
  validateQuestions,
  type Question,
} from "../../../../../components/onboarding/question-editor";
import { Select } from "../../../../../components/ui/select";
import { Toggle } from "../../../../../components/ui/toggle";
import { isPhoneMode, type PhoneMode } from "@/lib/phone";
import { useUpgradeModal } from "../../shell";

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
  product_name: string | null;
  phone_mode?: string | null;
}

type MilestoneReward = { threshold: number; label: string };

// Verbatim from onboarding/3/page.tsx (approved copy) — settings reuses the
// exact literals instead of inventing new ones.
const DEFAULT_REWARDS: MilestoneReward[] = [
  { threshold: 1, label: "Early access" },
  { threshold: 5, label: "Free Pro plan for 1 month" },
  { threshold: 10, label: "Lifetime 20% discount" },
  { threshold: 25, label: "Founding member status" },
];

const MILESTONE_REWARD_PLACEHOLDERS = [
  "e.g. Early access",
  "e.g. Free Pro plan for 1 month",
  "e.g. Lifetime 20% discount",
  "e.g. Founding member status",
];

interface WaitlistSettingsClientProps {
  waitlist: WaitlistData;
  initialTab?: string;
}

const TABS = [
  { id: "content", label: "Content" },
  { id: "qualification", label: "Qualification" },
  { id: "email", label: "Email" },
  { id: "warmth", label: "Warmth" },
  { id: "advanced", label: "Advanced" },
];

export default function WaitlistSettingsClient({
  waitlist,
  initialTab,
}: WaitlistSettingsClientProps) {
  const [activeTab, setActiveTab] = useState(() =>
    TABS.some((tab) => tab.id === initialTab) ? initialTab! : "content"
  );
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
  const [phoneMode, setPhoneMode] = useState<PhoneMode>(() =>
    isPhoneMode(waitlist.phone_mode) ? waitlist.phone_mode : "off"
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsSaving, setQuestionsSaving] = useState(false);
  const [questionsSaved, setQuestionsSaved] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [questionsLoadError, setQuestionsLoadError] = useState<string | null>(
    null
  );
  const [milestoneEnabled, setMilestoneEnabled] = useState(false);
  const [persistedRewards, setPersistedRewards] = useState<MilestoneReward[]>(
    []
  );
  const [draftRewards, setDraftRewards] = useState<MilestoneReward[]>([]);
  const [milestoneSaving, setMilestoneSaving] = useState(false);
  const [milestoneSaved, setMilestoneSaved] = useState(false);
  const [milestoneErrors, setMilestoneErrors] = useState<string[]>([]);
  const [counterEnabled, setCounterEnabled] = useState(false);
  const [counterThreshold, setCounterThreshold] = useState(10);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const questionsSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const milestoneSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const triggerUpgrade = useUpgradeModal();

  const isFreeTier = waitlist.tier === "free";

  const saveField = useCallback(
    async (field: string, value: string | number | boolean | null) => {
      setSaving(true);
      setSaved(false);
      setSaveError(null);
      try {
        const res = await fetch("/api/waitlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ waitlist_id: waitlist.id, [field]: value }),
        });
        // Story 19.4 C1: never report Saved on a failed write — surface the
        // server's curated error (falls back to the approved generic).
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setSaveError(
            data?.error || "Something went wrong. Please try again."
          );
          return;
        }
        setSaved(true);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => setSaved(false), 2000);
      } catch {
        setSaveError("Something went wrong. Please try again.");
      } finally {
        setSaving(false);
      }
    },
    [waitlist.id]
  );

  const handlePhoneModeChange = useCallback(
    (value: string) => {
      const mode = isPhoneMode(value) ? value : "off";
      setPhoneMode(mode);
      void saveField("phone_mode", mode);
    },
    [saveField]
  );

  const handleMilestoneToggle = useCallback(
    (checked: boolean) => {
      // Persisted milestones are public promises — once saved they cannot be
      // disabled (turning off would remove every existing tier).
      if (persistedRewards.length > 0) return;
      setMilestoneEnabled(checked);
      setDraftRewards(checked ? DEFAULT_REWARDS.map((r) => ({ ...r })) : []);
      setMilestoneErrors([]);
    },
    [persistedRewards.length]
  );

  const handleAddTier = useCallback(() => {
    setDraftRewards((prev) => {
      if (persistedRewards.length + prev.length >= 5) return prev;
      const combined = [...persistedRewards, ...prev];
      const lastThreshold =
        combined.length > 0 ? combined[combined.length - 1].threshold : 0;
      return [...prev, { threshold: lastThreshold + 5, label: "" }];
    });
    setMilestoneErrors([]);
  }, [persistedRewards]);

  const handleDraftThresholdChange = useCallback(
    (index: number, value: string) => {
      const num = parseInt(value, 10);
      setDraftRewards((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          threshold: isNaN(num) ? 0 : num,
        };
        return next;
      });
      setMilestoneErrors([]);
    },
    []
  );

  const handleDraftLabelChange = useCallback((index: number, value: string) => {
    setDraftRewards((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], label: value };
      return next;
    });
    setMilestoneErrors([]);
  }, []);

  const handleRemoveDraft = useCallback(
    (index: number) => {
      if (persistedRewards.length + draftRewards.length <= 1) return;
      setDraftRewards((prev) => prev.filter((_, i) => i !== index));
      setMilestoneErrors([]);
    },
    [persistedRewards.length, draftRewards.length]
  );

  async function handleSaveMilestones() {
    setMilestoneSaving(true);
    setMilestoneSaved(false);
    setMilestoneErrors([]);
    try {
      const combined = [...persistedRewards, ...draftRewards];
      const errors: string[] = [];
      const seenThresholds = new Set<number>();
      for (const r of combined) {
        if (!Number.isInteger(r.threshold) || r.threshold < 1) {
          errors.push("Threshold must be a whole number greater than 0");
        } else if (seenThresholds.has(r.threshold)) {
          errors.push("Each tier needs a unique referral count");
        }
        seenThresholds.add(r.threshold);
        if (!r.label.trim()) {
          errors.push(`Reward for "Refer ${r.threshold} friends" is required`);
        }
      }
      if (errors.length > 0) {
        setMilestoneErrors(errors);
        return;
      }
      const res = await fetch("/api/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waitlist_id: waitlist.id,
          milestone_rewards: combined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error || "Something went wrong. Please try again."
        );
      }
      setPersistedRewards(combined);
      setDraftRewards([]);
      setMilestoneEnabled(combined.length > 0);
      setMilestoneSaved(true);
      if (milestoneSaveTimeoutRef.current)
        clearTimeout(milestoneSaveTimeoutRef.current);
      milestoneSaveTimeoutRef.current = setTimeout(
        () => setMilestoneSaved(false),
        2000
      );
    } catch (err) {
      setMilestoneErrors([
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      ]);
    } finally {
      setMilestoneSaving(false);
    }
  }

  const handleCounterToggle = useCallback(
    (checked: boolean) => {
      setCounterEnabled(checked);
      // Mirrors Step 3: enabling with an invalid threshold defaults to 10.
      if (
        checked &&
        (!Number.isInteger(counterThreshold) || counterThreshold < 1)
      ) {
        setCounterThreshold(10);
        void saveField("signup_counter_threshold", 10);
      }
      void saveField("signup_counter_enabled", checked);
    },
    [counterThreshold, saveField]
  );

  const handleCounterThresholdInput = useCallback((value: string) => {
    const num = parseInt(value, 10);
    // Mirrors Step 3: silently ignore non-positive input (no invented error copy).
    if (!isNaN(num) && num > 0) setCounterThreshold(num);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/waitlist");
        if (!res.ok) throw new Error("load failed");
        const lists = await res.json();
        // GET /api/waitlist keys each item `waitlistId` (see route.ts response
        // shape); `id` kept as fallback for older cached shapes.
        const mine = Array.isArray(lists)
          ? (
              lists as {
                waitlistId?: string;
                id?: string;
                questions?: Question[];
                milestoneRewards?: MilestoneReward[];
                signupCounterEnabled?: boolean;
                signupCounterThreshold?: number;
              }[]
            ).find((w) => (w.waitlistId ?? w.id) === waitlist.id)
          : null;
        if (!cancelled) {
          setQuestions(mine?.questions ?? []);
          const rewards = Array.isArray(mine?.milestoneRewards)
            ? mine.milestoneRewards
            : [];
          // Existing milestones are public promises: they hydrate as the
          // frozen, append-only base (see handleMilestoneToggle).
          setPersistedRewards(rewards);
          setMilestoneEnabled(rewards.length > 0);
          setDraftRewards([]);
          setCounterEnabled(mine?.signupCounterEnabled === true);
          const threshold = mine?.signupCounterThreshold;
          setCounterThreshold(
            typeof threshold === "number" &&
              Number.isInteger(threshold) &&
              threshold >= 1
              ? threshold
              : 10
          );
        }
      } catch {
        // Story 19.4 C13: a failed load must not masquerade as "No
        // qualification questions configured" — hide the list and alert.
        if (!cancelled) {
          setQuestionsLoadError("Something went wrong. Please try again.");
        }
      } finally {
        if (!cancelled) setQuestionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [waitlist.id]);

  async function handleSaveQuestions() {
    setQuestionsSaving(true);
    setQuestionsSaved(false);
    setQuestionsError(null);
    try {
      const validationError = validateQuestions(questions);
      if (validationError) {
        setQuestionsError(validationError);
        return;
      }
      const sanitized = sanitizeQuestions(questions);
      const res = await fetch("/api/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waitlist_id: waitlist.id,
          questions: sanitized,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to save questions");
      }
      setQuestions(sanitized);
      setQuestionsSaved(true);
      if (questionsSaveTimeoutRef.current)
        clearTimeout(questionsSaveTimeoutRef.current);
      questionsSaveTimeoutRef.current = setTimeout(
        () => setQuestionsSaved(false),
        2000
      );
    } catch (err) {
      setQuestionsError(
        err instanceof Error ? err.message : "Failed to save questions"
      );
    } finally {
      setQuestionsSaving(false);
    }
  }

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (questionsSaveTimeoutRef.current)
        clearTimeout(questionsSaveTimeoutRef.current);
      if (milestoneSaveTimeoutRef.current)
        clearTimeout(milestoneSaveTimeoutRef.current);
    };
  }, []);

  function handleLogoClick() {
    fileInputRef.current?.click();
  }

  // Mirrors onboarding Step 3 (onboarding/3/page.tsx:103-135): client-side
  // size check + FileReader to a data URL. Settings persists immediately via
  // saveField (no submit button here). accept attr covers type filtering.
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File must be under 2MB");
      return;
    }

    setLogoFile(file);
    setLogoUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setLogoUrl(dataUrl);
        saveField("logo_url", dataUrl);
        setLogoUploading(false);
      };
      reader.onerror = () => {
        setLogoUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setLogoUploading(false);
    }
  }

  function handleRemoveLogo() {
    setLogoUrl("");
    setLogoFile(null);
    saveField("logo_url", "");
  }

  async function handleArchive() {
    setArchiving(true);
    setArchiveError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waitlist_id: waitlist.id,
          is_archived: true,
          archived_at: new Date().toISOString(),
        }),
      });
      // Story 19.4 C8: a failed archive must not refresh as if it succeeded.
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setArchiveError(
          data?.error || "Something went wrong. Please try again."
        );
        return;
      }
      router.refresh();
    } catch {
      setArchiveError("Something went wrong. Please try again.");
    } finally {
      setArchiving(false);
    }
  }

  async function handleUnarchive() {
    setArchiving(true);
    setArchiveError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waitlist_id: waitlist.id,
          is_archived: false,
          archived_at: null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setArchiveError(
          data?.error || "Something went wrong. Please try again."
        );
        return;
      }
      router.refresh();
    } catch {
      setArchiveError("Something went wrong. Please try again.");
    } finally {
      setArchiving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waitlist_ids: [waitlist.id] }),
      });
      if (res.ok) {
        router.push("/dashboard/settings/waitlists");
      } else {
        const data = await res.json().catch(() => null);
        setDeleteError(
          data?.error || "Something went wrong. Please try again."
        );
      }
    } catch {
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-12">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings", href: "/dashboard/settings" },
          { label: "Waitlist Settings", href: "/dashboard/settings/waitlists" },
          {
            label: waitlist.headline || waitlist.product_name || "Untitled",
          },
        ]}
      />
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
                <div className="mb-3">
                  {/* matches Content tab field rhythm */}
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Logo
                  </label>
                  <div className="flex items-center gap-3">
                    {logoUrl && (
                      <Image
                        src={logoUrl}
                        alt="Logo"
                        width={40}
                        height={40}
                        unoptimized
                        className="h-10 w-10 rounded-md border border-border bg-card object-contain"
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleLogoClick}
                      disabled={saving || logoUploading}
                      className="flex flex-1 items-center justify-center rounded-(--radius-lg) border-2 border-dashed border-accent bg-card px-3 py-3 text-sm h-10 text-muted-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {logoUploading
                        ? "Uploading..."
                        : logoUrl || logoFile
                          ? "Logo uploaded — click to replace"
                          : "Click to upload logo (PNG or SVG, max 2MB)"}
                    </button>
                    {logoUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveLogo}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/svg+xml"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
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
              {saveError && !saving && (
                <p role="alert" className="mt-3 text-xs text-destructive">
                  {saveError}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-1 flex items-center justify-between gap-4">
                <h2 className="text-h4 font-medium text-foreground">
                  Milestone rewards
                </h2>
                <Toggle
                  checked={milestoneEnabled}
                  onCheckedChange={handleMilestoneToggle}
                  aria-label="Milestone rewards"
                  disabled={
                    persistedRewards.length > 0 ||
                    questionsLoading ||
                    !!questionsLoadError ||
                    milestoneSaving
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Subscribers get a congratulation email when they hit a milestone
                &mdash; and any reward with &quot;skip the line&quot; moves them
                straight to #1.
              </p>
              {questionsLoading ? (
                <div className="mt-4 space-y-3" aria-hidden="true">
                  <div className="h-10 animate-pulse rounded-xl bg-muted" />
                  <div className="h-10 animate-pulse rounded-xl bg-muted" />
                </div>
              ) : questionsLoadError ? (
                <p role="alert" className="mt-4 text-body-sm text-destructive">
                  {questionsLoadError}
                </p>
              ) : milestoneEnabled ? (
                <div className="mt-4 flex flex-col gap-3">
                  {persistedRewards.map((reward) => (
                    <div
                      key={`saved-${reward.threshold}`}
                      className="flex items-end gap-2 rounded-(--radius-lg) border border-accent/25 bg-accent/5 px-3 pb-3 pt-2.5"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          Refer
                        </span>
                        <span className="flex h-10 w-16 items-center justify-center rounded-(--radius-lg) border border-accent/30 bg-card px-3 text-center text-sm font-semibold text-accent">
                          {reward.threshold}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          friends → reward
                        </span>
                        <span className="flex h-10 items-center rounded-(--radius-lg) border border-accent/30 bg-card px-3 text-sm text-foreground">
                          {reward.label}
                        </span>
                      </div>
                    </div>
                  ))}
                  {draftRewards.map((reward, index) => (
                    <div
                      key={`draft-${index}`}
                      className="flex items-end gap-2 rounded-(--radius-lg) border border-border bg-card px-3 pb-3 pt-2.5"
                    >
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">
                          Refer
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={reward.threshold || ""}
                          onChange={(e) =>
                            handleDraftThresholdChange(index, e.target.value)
                          }
                          placeholder="3"
                          disabled={milestoneSaving}
                          className="h-10 w-16 rounded-(--radius-lg) border border-border bg-card px-3 text-sm text-center placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-1">
                        <label className="text-xs text-muted-foreground">
                          friends → reward
                        </label>
                        <input
                          type="text"
                          value={reward.label}
                          onChange={(e) =>
                            handleDraftLabelChange(index, e.target.value)
                          }
                          placeholder={
                            MILESTONE_REWARD_PLACEHOLDERS[
                              persistedRewards.length + index
                            ] || "e.g. Special reward"
                          }
                          disabled={milestoneSaving}
                          className="h-10 w-full rounded-(--radius-lg) border border-border bg-card px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      {persistedRewards.length + draftRewards.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDraft(index)}
                          disabled={milestoneSaving}
                          aria-label="Remove tier"
                          title="Remove tier"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                          >
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
                  {persistedRewards.length + draftRewards.length < 5 && (
                    <button
                      type="button"
                      onClick={handleAddTier}
                      disabled={milestoneSaving}
                      className="flex w-full items-center justify-center gap-2 rounded-(--radius-lg) border-2 border-dashed border-accent/40 bg-accent/5 py-2.5 text-sm font-semibold text-accent transition-colors hover:border-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
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
                  <p className="text-xs text-muted-foreground">
                    Add &quot;skip the line&quot; to a reward to move that
                    subscriber to #1 when they earn it
                  </p>
                  {milestoneErrors.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {milestoneErrors.map((error, i) => (
                        <p key={i} className="text-xs text-destructive">
                          {error}
                        </p>
                      ))}
                    </div>
                  )}
                  {(draftRewards.length > 0 || milestoneSaved) && (
                    <div className="mt-6">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveMilestones}
                        disabled={milestoneSaving}
                      >
                        {milestoneSaving
                          ? "Saving…"
                          : milestoneSaved
                            ? "Saved!"
                            : "Save changes"}
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-1 flex items-center justify-between gap-4">
                <h2 className="text-h4 font-medium text-foreground">
                  Signup counter
                </h2>
                <Toggle
                  checked={counterEnabled}
                  onCheckedChange={handleCounterToggle}
                  aria-label="Signup counter"
                  disabled={questionsLoading || !!questionsLoadError || saving}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Show a real-time signup count on your public waitlist page for
                social proof.
              </p>
              {questionsLoading ? (
                <div className="mt-4" aria-hidden="true">
                  <div className="h-10 w-64 animate-pulse rounded-xl bg-muted" />
                </div>
              ) : questionsLoadError ? (
                <p role="alert" className="mt-4 text-body-sm text-destructive">
                  {questionsLoadError}
                </p>
              ) : counterEnabled ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <label className="text-xs text-muted-foreground">
                    Show when I have
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={counterThreshold || ""}
                    onChange={(e) =>
                      handleCounterThresholdInput(e.target.value)
                    }
                    onBlur={() =>
                      void saveField(
                        "signup_counter_threshold",
                        counterThreshold
                      )
                    }
                    placeholder="10"
                    disabled={saving}
                    className="h-10 w-20 rounded-(--radius-lg) border border-border bg-card px-3 text-sm text-center placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <label className="text-xs text-muted-foreground">
                    or more signups
                  </label>
                  {saving && (
                    <p className="text-xs text-muted-foreground">Saving…</p>
                  )}
                  {saved && !saving && (
                    <p className="text-xs text-accent">Saved</p>
                  )}
                  {saveError && !saving && (
                    <p role="alert" className="text-xs text-destructive">
                      {saveError}
                    </p>
                  )}
                </div>
              ) : null}
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
                milestoneRewards={
                  milestoneEnabled ? [...persistedRewards, ...draftRewards] : []
                }
                signupCounterEnabled={counterEnabled}
                signupCounterThreshold={counterThreshold}
                tier={waitlist.tier as "free" | "pro"}
                phoneMode={phoneMode}
              />
            </div>
          </div>
        )}

        {activeTab === "qualification" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-h4 font-medium text-foreground">
              Qualification
            </h2>
            <div className="mb-6 flex max-w-md flex-col gap-4">
              <div>
                <p className="text-body-lg font-medium text-foreground">
                  Signup fields
                </p>
                <p className="mt-1 text-body-sm text-muted-foreground">
                  Show a phone number field on your public signup form.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Select
                  label="Phone number"
                  value={phoneMode}
                  onValueChange={handlePhoneModeChange}
                  options={[
                    { value: "off", label: "Off" },
                    { value: "optional", label: "Optional" },
                    { value: "required", label: "Required" },
                  ]}
                />
                {saving && (
                  <p className="text-xs text-muted-foreground">Saving…</p>
                )}
                {saved && !saving && (
                  <p className="text-xs text-accent">Saved</p>
                )}
                {saveError && !saving && (
                  <p role="alert" className="text-xs text-destructive">
                    {saveError}
                  </p>
                )}
              </div>
            </div>
            {questionsLoading ? (
              <div className="space-y-3" aria-hidden="true">
                <div className="h-6 w-32 animate-pulse rounded-full bg-muted" />
                <div className="h-24 rounded-xl bg-muted" />
                <div className="h-10 w-48 animate-pulse rounded-xl bg-muted" />
              </div>
            ) : questionsLoadError ? (
              <p role="alert" className="mb-4 text-body-sm text-destructive">
                {questionsLoadError}
              </p>
            ) : (
              <>
                {questions.length === 0 && (
                  <p className="mb-4 text-body-sm text-muted-foreground">
                    No qualification questions configured.
                  </p>
                )}
                <QuestionEditor
                  questions={questions}
                  onChange={(next) => {
                    setQuestions(next);
                    setQuestionsError(null);
                  }}
                  tier={waitlist.tier}
                  onUpgrade={() => triggerUpgrade("qual_question")}
                  disabled={questionsSaving}
                />
                {questionsError && (
                  <p
                    role="alert"
                    className="mb-3 text-body-sm text-destructive"
                  >
                    {questionsError}
                  </p>
                )}
                <div className="mt-6">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveQuestions}
                    disabled={questionsSaving}
                  >
                    {questionsSaving
                      ? "Saving…"
                      : questionsSaved
                        ? "Saved!"
                        : "Save changes"}
                  </Button>
                </div>
              </>
            )}
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
            {saveError && !saving && (
              <p role="alert" className="mt-3 text-xs text-destructive">
                {saveError}
              </p>
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
                  helperText="Warn me when this % or more of your list is Cold. Range: 20–80."
                />
              </div>
            )}
            {saving && (
              <p className="mt-3 text-xs text-muted-foreground">Saving…</p>
            )}
            {saved && !saving && (
              <p className="mt-3 text-xs text-accent">Saved</p>
            )}
            {saveError && !saving && (
              <p role="alert" className="mt-3 text-xs text-destructive">
                {saveError}
              </p>
            )}
          </div>
        )}

        {activeTab === "advanced" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect
                      x="3"
                      y="4"
                      width="14"
                      height="12"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path d="M3 8H17" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-body-lg font-medium text-foreground">
                    {waitlist.is_archived
                      ? "This waitlist is archived"
                      : "Archive this waitlist"}
                  </h2>
                  <p className="mt-1 text-body-sm text-muted-foreground">
                    {waitlist.is_archived
                      ? "Archived waitlists are hidden from your public page and stop accepting new signups."
                      : "Archiving hides your public page and stops new signups. You can unarchive at any time."}
                  </p>
                  <div className="mt-4">
                    {waitlist.is_archived ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleUnarchive}
                        disabled={archiving}
                      >
                        {archiving ? "Working…" : "Unarchive waitlist"}
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
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
                    {archiveError && (
                      <p
                        role="alert"
                        className="mt-3 text-body-sm text-destructive"
                      >
                        {archiveError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M6 4H14M8 4V3C8 2.44772 8.44772 2 9 2H11C11.5523 2 12 2.44772 12 3V4M4.5 4L5.2 16.5C5.25 17.0523 5.69772 17.5 6.25 17.5H13.75C14.3023 17.5 14.75 17.0523 14.8 16.5L15.5 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-body-lg font-medium text-destructive">
                    Delete this waitlist
                  </h2>
                  <p className="mt-1 text-body-sm text-muted-foreground">
                    Permanently delete this waitlist and all its data. This
                    action cannot be undone.
                  </p>
                  <div className="mt-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setConfirmDelete(true);
                        setConfirmText("");
                      }}
                    >
                      Delete waitlist
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="text-destructive"
              >
                <path
                  d="M6 4H14M8 4V3C8 2.44772 8.44772 2 9 2H11C11.5523 2 12 2.44772 12 3V4M4.5 4L5.2 16.5C5.25 17.0523 5.69772 17.5 6.25 17.5H13.75C14.3023 17.5 14.75 17.0523 14.8 16.5L15.5 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-h4 font-medium text-foreground">
              Delete waitlist?
            </h2>
            <p className="mb-2 text-body-sm text-muted-foreground">
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                &ldquo;
                {waitlist.headline ||
                  waitlist.product_name ||
                  "Untitled waitlist"}
                &rdquo;
              </span>{" "}
              and all of its data including subscribers, settings, and milestone
              rewards. This action cannot be undone.
            </p>
            <p className="mb-4 text-body-sm text-muted-foreground">
              Type <span className="font-medium text-foreground">delete</span>{" "}
              to confirm.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='Type "delete" to confirm'
              className="mb-4 w-full rounded-lg border border-border bg-card px-3 py-2 text-body-sm text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive"
            />
            {deleteError && (
              <p role="alert" className="mb-3 text-body-sm text-destructive">
                {deleteError}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  setConfirmText("");
                  setDeleteError(null);
                }}
                className="rounded-lg px-4 py-2 text-body-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || confirmText !== "delete"}
                className="rounded-lg bg-destructive px-4 py-2 text-body-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
