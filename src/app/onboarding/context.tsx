"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

type Tier = "free" | "pro" | "growth";

interface MilestoneReward {
  threshold: number;
  label: string;
}

interface Question {
  text: string;
  required: boolean;
}

interface OnboardingFormState {
  waitlistId: string | null;
  slug: string;
  headline: string;
  subheadline: string;
  template: "minimal" | "bold" | "dark";
  brandColor: string;
  logoUrl: string | null;
  ctaText: string;
  milestoneRewards: MilestoneReward[];
  qualificationEnabled: boolean;
  questions: Question[];
  signupCounterEnabled: boolean;
  signupCounterThreshold: number;
  emailSubject: string;
  emailSenderName: string;
  emailBody: string;
  tier: Tier;
  loading: boolean;
}

interface OnboardingFormContextValue extends OnboardingFormState {
  updateField: <K extends keyof OnboardingFormState>(
    key: K,
    value: OnboardingFormState[K]
  ) => void;
  setWaitlistId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  flushToAPI: () => Promise<boolean>;
  clearPersisted: () => void;
}

const STORAGE_KEY = "prewaitlist_onboarding";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const initialState: OnboardingFormState = {
  waitlistId: null,
  slug: "",
  headline: "",
  subheadline: "",
  template: "minimal",
  brandColor: "#0F7A5E",
  logoUrl: null,
  ctaText: "Join Waitlist",
  milestoneRewards: [],
  qualificationEnabled: false,
  questions: [],
  signupCounterEnabled: false,
  signupCounterThreshold: 10,
  emailSubject: "",
  emailSenderName: "",
  emailBody: "",
  tier: "free",
  loading: false,
};

// Persist data fields only — excludes loading, waitlistId (server-owned)
function toPersisted(state: OnboardingFormState) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { loading, waitlistId, ...rest } = state;
  return { ...rest, _ts: Date.now() };
}

// External store for useSyncExternalStore
let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(callback: () => void) {
  listeners = [...listeners, callback];
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function getSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot(): string | null {
  return null;
}

const OnboardingFormContext = createContext<
  OnboardingFormContextValue | undefined
>(undefined);

export function OnboardingFormProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const rawPersisted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  // Parse localStorage — TTL check happens in useEffect below
  const persistedState = useMemo(() => {
    if (!rawPersisted) return initialState;
    try {
      const parsed = JSON.parse(rawPersisted);
      // Never restore waitlistId from localStorage — it's server-owned
      // Never restore completed flag — it's a signal only
      const { waitlistId: _, completed: __, ...data } = parsed;
      void _;
      void __;
      return { ...initialState, ...data, loading: false };
    } catch {
      return initialState;
    }
  }, [rawPersisted]);

  // TTL: clear stale localStorage on mount. Also clear if `completed` flag is set
  // (means a previous onboarding finished — start fresh).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.completed) {
        localStorage.removeItem(STORAGE_KEY);
        emitChange();
        return;
      }
      if (parsed._ts && Date.now() - parsed._ts > TTL_MS) {
        localStorage.removeItem(STORAGE_KEY);
        emitChange();
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const [overrides, setOverrides] = useState<Partial<OnboardingFormState>>({});

  const state = useMemo(
    () => ({
      ...initialState,
      ...persistedState,
      ...overrides,
    }),
    [persistedState, overrides]
  );

  const persist = useCallback((next: OnboardingFormState) => {
    if (typeof window === "undefined") return;
    try {
      const toSave = toPersisted(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      setTimeout(() => {
        emitChange();
      }, 0);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) emitChange();
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    persist(state);
  }, [state, persist]);

  const updateField = useCallback(
    <K extends keyof OnboardingFormState>(
      key: K,
      value: OnboardingFormState[K]
    ) => {
      setOverrides((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const setWaitlistId = useCallback((id: string) => {
    setOverrides((prev) => ({ ...prev, waitlistId: id }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setOverrides((prev) => ({ ...prev, loading }));
  }, []);

  // Flush localStorage data to API
  const flushToAPI = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;

    // If waitlistId already set (from OAuthFlush or previous flush), nothing to do
    if (overrides.waitlistId) return true;

    // Read from context state (latest data, survives OAuth redirect)
    const data = {
      slug: state.slug,
      headline: state.headline,
      subheadline: state.subheadline,
      template: state.template,
      brandColor: state.brandColor,
      logoUrl: state.logoUrl,
      ctaText: state.ctaText,
      milestoneRewards: state.milestoneRewards,
      qualificationEnabled: state.qualificationEnabled,
      signupCounterEnabled: state.signupCounterEnabled,
      signupCounterThreshold: state.signupCounterThreshold,
      questions: state.questions,
      emailSubject: state.emailSubject,
      emailSenderName: state.emailSenderName,
      emailBody: state.emailBody,
    };

    if (!data.slug && !data.headline && !data.template) return true;

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: data.slug || undefined,
          headline: data.headline || undefined,
          subheadline: data.subheadline || undefined,
          template: data.template || undefined,
          brand_color: data.brandColor || undefined,
          logo_url: data.logoUrl || undefined,
          cta_text: data.ctaText || undefined,
          milestone_rewards: data.milestoneRewards || undefined,
          qualification_enabled: data.qualificationEnabled || undefined,
          signup_counter_enabled: data.signupCounterEnabled || undefined,
          signup_counter_threshold: data.signupCounterThreshold || undefined,
          questions: data.questions || undefined,
          email_subject: data.emailSubject || undefined,
          email_sender_name: data.emailSenderName || undefined,
          email_body: data.emailBody || undefined,
        }),
      });

      if (!res.ok) return false;

      const result = await res.json();
      setOverrides((prev) => ({ ...prev, waitlistId: result.id }));
      // Clear localStorage after successful flush — server now has the data
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
      return true;
    } catch {
      return false;
    }
  }, [overrides.waitlistId, state]);

  const clearPersisted = useCallback(() => {
    if (typeof window === "undefined") return;
    // Mark onboarding as completed — mount effect will clear on next visit
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...parsed, completed: true })
        );
      }
    } catch {
      // Ignore
    }
    setOverrides({});
    emitChange();
  }, []);

  return (
    <OnboardingFormContext.Provider
      value={{
        ...state,
        updateField,
        setWaitlistId,
        setLoading,
        flushToAPI,
        clearPersisted,
      }}
    >
      {children}
    </OnboardingFormContext.Provider>
  );
}

export function useOnboardingForm() {
  const context = useContext(OnboardingFormContext);
  if (!context) {
    throw new Error(
      "useOnboardingForm must be used within an OnboardingFormProvider"
    );
  }
  return context;
}
