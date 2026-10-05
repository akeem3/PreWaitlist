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
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const questionsSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const triggerUpgrade = useUpgradeModal();

  const isFreeTier = waitlist.tier === "free";

  const saveField = useCallback(
    async (field: string, value: string | number | null) => {
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
              }[]
            ).find((w) => (w.waitlistId ?? w.id) === waitlist.id)
          : null;
        if (!cancelled) setQuestions(mine?.questions ?? []);
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
                      className="flex flex-1 items-center justify-center rounded-(--radius-lg) border-2 border-dashed border-border bg-card px-3 py-3 text-sm h-10 text-muted-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
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
