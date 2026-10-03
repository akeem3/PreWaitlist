"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "../ui/spinner";
import { ConsentLine, TrustLine } from "./consent-line";
import { getTierLimits, type Tier } from "../../src/lib/tier-gating";
import { buildPhone, type PhoneMode } from "../../src/lib/phone";
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY_DIAL } from "../../src/lib/countries";

interface Question {
  id: string;
  text: string;
  type: "free_text" | "multiple_choice";
  options: string[] | null;
}

interface EmailCaptureFormProps {
  waitlistId: string;
  subdomain: string;
  ctaText: string;
  brandColor: string;
  template: "minimal" | "bold" | "dark";
  tier: "free" | "pro";
  questions: Question[];
  qualificationEnabled: boolean;
  subscriberCount?: number;
  phoneMode?: PhoneMode;
}

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function withQuestionMark(text: string) {
  const trimmed = text.trim();
  return trimmed.endsWith("?") ? trimmed : `${trimmed}?`;
}

export function EmailCaptureForm({
  waitlistId,
  subdomain,
  ctaText,
  brandColor,
  template,
  tier,
  questions,
  qualificationEnabled,
  subscriberCount = 0,
  phoneMode = "off",
}: EmailCaptureFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only send 8-char hex codes (what generateReferralCode produces) —
  // attribution params like ?ref=powered-by would 400 and block signup.
  const refParam = searchParams.get("ref");
  const referralCode =
    refParam && /^[0-9a-f]{8}$/i.test(refParam) ? refParam : null;

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [dial, setDial] = useState(DEFAULT_COUNTRY_DIAL);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Honeypot: hidden "website" field humans never see; bots fill it
  const [honeypot, setHoneypot] = useState("");
  // 6.4: form-load timestamp for the >=2s server timing check.
  // Captured in a mount effect — Date.now() during render violates
  // react-hooks/purity (impure call in render).
  const loadedAtRef = useRef<number | null>(null);
  useEffect(() => {
    loadedAtRef.current = Date.now();
  }, []);
  const isDark = template === "dark";

  // 500 cap logic — Free tier only
  const CAP_LIMIT = 500;
  const isFree = tier === "free";
  const capReached = isFree && subscriberCount >= CAP_LIMIT;
  const capWarningHigh = isFree && subscriberCount >= CAP_LIMIT * 0.96; // 480+
  const capWarningMedium = isFree && subscriberCount >= CAP_LIMIT * 0.8; // 400+

  const visibleQuestions = qualificationEnabled
    ? questions
        .filter((q) => q.text.trim().length > 0)
        .slice(0, getTierLimits(tier as Tier).maxQuestions)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setEmailError(null);
    setPhoneError(null);
    setApiError(null);

    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    // Honeypot filled by a bot — bail before hitting the API
    if (honeypot.trim().length > 0) {
      setApiError("Something went wrong. Please try again.");
      return;
    }

    let composedPhone: string | null = null;
    if (phoneMode !== "off") {
      const rawPhone = phone.trim();
      if (phoneMode === "required" && !rawPhone) {
        setPhoneError("Phone number is required");
        return;
      }
      if (rawPhone) {
        composedPhone = buildPhone(dial, rawPhone);
        if (!composedPhone) {
          setPhoneError("Please enter a valid phone number");
          return;
        }
      }
    }

    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        waitlist_id: waitlistId,
        email: email.trim().toLowerCase(),
        website: honeypot,
        ts: loadedAtRef.current ?? Date.now(),
      };

      if (composedPhone) {
        body.phone = composedPhone;
      }

      if (referralCode) {
        body.referral_code = referralCode;
      }

      const filledAnswers = Object.fromEntries(
        Object.entries(answers).filter(([, v]) => v.trim().length > 0)
      );
      if (Object.keys(filledAnswers).length > 0) {
        body.qual_answers = filledAnswers;
      }

      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.status === 409) {
        setApiError("This email is already on the waitlist");
        return;
      }

      if (!res.ok) {
        setApiError("Something went wrong. Please try again.");
        return;
      }

      router.push(
        `/${subdomain}/thank-you?subscriber_id=${data.id}&referral_code=${data.referral_code}`
      );
    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Template-specific styling to match onboarding preview exactly
  const inputHeight = "h-11";
  const inputBorder = isDark
    ? "border border-dark-template-border"
    : template === "bold"
      ? "border-2 border-foreground"
      : "border border-border";
  const inputBg = isDark ? "bg-dark-template-input" : "bg-card";
  const inputText = isDark ? "text-dark-template-text" : "text-foreground";
  const inputPlaceholder = isDark
    ? "placeholder:text-dark-template-muted"
    : "placeholder:text-muted-foreground";
  const textSize = template === "bold" ? "text-base" : "text-sm";
  // Qualification fields are muted on every template — the email field is
  // the primary input and must keep the visual shine (founder, 2026-09-30).
  // Muted still needs to be *visible*: on dark, sunk into the page with no
  // contrast was invisible — use the input surface token instead (founder,
  // 2026-09-30).
  const qualBorder = isDark
    ? "border border-dark-template-border"
    : "border border-border";
  const qualBg = isDark ? "bg-dark-template-input" : "bg-muted";
  const qualLabel = isDark
    ? "text-dark-template-muted"
    : "text-muted-foreground";
  // Overlay question color (label sits inside the input like a placeholder)
  const qualOverlay = isDark
    ? "text-dark-template-muted/70"
    : "text-muted-foreground/70";
  // In-field annotation: question sits in the field (left), "(optional)" pins
  // to the right end.
  const optionalBadge = (
    <span
      className="shrink-0 text-xs font-normal text-warning"
      aria-hidden="true"
    >
      (optional)
    </span>
  );
  const focusClasses =
    "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent";
  const focusWithinClasses =
    "focus-within:border-accent focus-within:ring-1 focus-within:ring-accent";
  const btnHeight = "h-11";
  const btnPadding = template === "bold" ? "px-7" : "px-4";
  const btnText =
    template === "bold" ? "text-base font-semibold" : "text-sm font-semibold";

  // W3: approved click-through consent sentence (shared ConsentLine, W8)
  const consentBlock = <ConsentLine isDark={isDark} />;

  return (
    <div className="w-full">
      {capReached ? (
        <div
          className={`rounded-[var(--input-radius)] border px-4 py-6 text-center ${
            isDark
              ? "border-dark-template-border bg-dark-template-input"
              : "border-border bg-card"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              isDark ? "text-dark-template-text" : "text-foreground"
            }`}
          >
            This waitlist has reached its subscriber limit.
          </p>
          <p
            className={`mt-1 text-xs ${
              isDark ? "text-dark-template-muted" : "text-muted-foreground"
            }`}
          >
            Please check back later.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
          {/* Honeypot — off-screen, humans never fill it */}
          <div
            aria-hidden="true"
            className="absolute -left-[9999px] h-px w-px overflow-hidden"
          >
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-label="Leave this field empty"
            />
          </div>
          {capWarningHigh && (
            <div
              className={`rounded-[var(--input-radius)] border px-3 py-2 text-xs ${
                isDark
                  ? "border-dark-template-border bg-dark-template-input text-dark-template-muted"
                  : "border-destructive/30 bg-destructive/5 text-destructive"
              }`}
            >
              Almost full — {subscriberCount} of {CAP_LIMIT} spots claimed.
              Upgrade to Pro for unlimited signups.
            </div>
          )}
          {!capWarningHigh && capWarningMedium && (
            <div
              className={`rounded-[var(--input-radius)] border px-3 py-2 text-xs ${
                isDark
                  ? "border-dark-template-border bg-dark-template-input text-dark-template-muted"
                  : "border-accent/30 bg-accent/5 text-accent"
              }`}
            >
              Filling up — {subscriberCount} of {CAP_LIMIT} spots claimed.
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (apiError) setApiError(null);
                if (emailError) setEmailError(null);
              }}
              disabled={loading}
              autoComplete="email"
              aria-label="Email address"
              aria-invalid={!!emailError}
              className={`${inputHeight} w-full rounded-[var(--input-radius)] ${inputBorder} ${inputBg} ${inputText} px-[var(--input-padding-x)] py-[var(--input-padding-y)] ${textSize} ${inputPlaceholder} ${focusClasses} disabled:cursor-not-allowed disabled:opacity-50`}
            />
            {emailError && (
              <p className="text-xs text-destructive" role="alert">
                {emailError}
              </p>
            )}
          </div>

          {phoneMode !== "off" && (
            <div className="flex flex-col gap-1.5">
              <div className="flex w-full gap-2">
                <input
                  list="country-dial-codes"
                  value={dial}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\+?\d{0,4}$/.test(value)) setDial(value);
                    if (phoneError) setPhoneError(null);
                  }}
                  onBlur={() => {
                    if (!dial.trim()) {
                      setDial(DEFAULT_COUNTRY_DIAL);
                    } else if (/^\d{1,3}$/.test(dial)) {
                      setDial(`+${dial}`);
                    } else if (!/^\+\d{1,3}$/.test(dial)) {
                      setDial(DEFAULT_COUNTRY_DIAL);
                    }
                  }}
                  disabled={loading}
                  autoComplete="tel-country-code"
                  inputMode="numeric"
                  maxLength={4}
                  aria-label="Country code"
                  className={`${inputHeight} w-[4.75rem] shrink-0 rounded-[var(--input-radius)] ${inputBorder} ${inputBg} ${inputText} px-3 ${textSize} ${inputPlaceholder} ${focusClasses} disabled:cursor-not-allowed disabled:opacity-50`}
                />
                <datalist id="country-dial-codes">
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.name} value={c.dial}>
                      {c.name}
                    </option>
                  ))}
                </datalist>
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  disabled={loading}
                  autoComplete="tel-national"
                  aria-label="Phone number"
                  aria-invalid={!!phoneError}
                  className={`${inputHeight} min-w-0 flex-1 rounded-[var(--input-radius)] ${inputBorder} ${inputBg} ${inputText} px-[var(--input-padding-x)] py-[var(--input-padding-y)] ${textSize} ${inputPlaceholder} ${focusClasses} disabled:cursor-not-allowed disabled:opacity-50`}
                />
              </div>
              {phoneError && (
                <p className="text-xs text-destructive" role="alert">
                  {phoneError}
                </p>
              )}
            </div>
          )}

          {visibleQuestions.map((q) =>
            q.type === "multiple_choice" && q.options?.length ? (
              <div key={q.id} className="flex flex-col gap-1.5">
                <label
                  htmlFor={`qual-${q.id}`}
                  className={`flex w-full items-center justify-between gap-2 text-sm font-medium ${qualLabel}`}
                >
                  <span className="min-w-0 truncate">
                    {withQuestionMark(q.text)}
                  </span>
                  <span className="shrink-0 text-xs font-normal text-warning">
                    (optional)
                  </span>
                </label>
                <div className="relative">
                  <select
                    id={`qual-${q.id}`}
                    value={answers[q.id] || ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [q.id]: e.target.value,
                      }))
                    }
                    disabled={loading}
                    style={
                      answers[q.id] ? { borderColor: brandColor } : undefined
                    }
                    className={`block w-full ${inputHeight} appearance-none rounded-[var(--input-radius)] border pl-[var(--input-padding-x)] pr-10 ${textSize} disabled:cursor-not-allowed disabled:opacity-50 ${qualBorder} ${qualBg} ${focusClasses} ${
                      answers[q.id] ? inputText : qualOverlay
                    }`}
                  >
                    <option value="">Select an option</option>
                    {q.options.map((opt, optionIndex) => (
                      <option key={optionIndex} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                    className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${qualLabel}`}
                  >
                    <path
                      d="M3.5 5.25L7 8.75L10.5 5.25"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            ) : (
              <div
                key={q.id}
                className={`${inputHeight} relative w-full rounded-[var(--input-radius)] ${qualBorder} ${qualBg} ${focusWithinClasses}`}
              >
                <input
                  id={`qual-${q.id}`}
                  type="text"
                  placeholder=" "
                  aria-label={withQuestionMark(q.text)}
                  value={answers[q.id] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [q.id]: e.target.value,
                    }))
                  }
                  disabled={loading}
                  className={`peer relative ${inputHeight} w-full rounded-[var(--input-radius)] bg-transparent px-[var(--input-padding-x)] ${inputText} ${textSize} outline-none disabled:cursor-not-allowed disabled:opacity-50`}
                />
                <label
                  htmlFor={`qual-${q.id}`}
                  className={`pointer-events-none absolute inset-y-0 left-0 flex w-full items-center gap-2 px-[var(--input-padding-x)] invisible ${qualOverlay} ${textSize} font-normal peer-placeholder-shown:visible`}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {withQuestionMark(q.text)}
                  </span>
                  {optionalBadge}
                </label>
              </div>
            )
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: brandColor }}
            className={`inline-flex items-center justify-center ${btnHeight} w-full ${btnPadding} rounded-[var(--button-radius)] ${btnText} text-white transition-colors disabled:pointer-events-none disabled:opacity-50`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4" />
                Joining...
              </span>
            ) : (
              ctaText || "Join Waitlist"
            )}
          </button>
          {/* Swap (founder, 2026-09-30, amended): consent reads like part of
              the button ("by clicking"); trust line closes the form below it. */}
          {consentBlock}
          <TrustLine isDark={isDark} className="mt-0" />

          {apiError && (
            <p className="text-xs text-destructive" role="alert">
              {apiError}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
