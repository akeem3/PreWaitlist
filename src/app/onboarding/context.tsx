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
  flushToAPI: () => Promise<string | null>;
  clearPersisted: () => void;
}

const STORAGE_KEY = "prewaitlist_onboarding";
const DONE_KEY = "prewaitlist_onboarding_done";
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

// Read + validate persisted data from localStorage. Returns null when absent
// or expired. Strips server-owned / signal fields. localStorage is the
// authoritative source across full-page loads (e.g. the OAuth redirect back
// to Step 4), because context state is empty on the first client render.
function readStoredData(): Partial<OnboardingFormState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed._ts && Date.now() - parsed._ts > TTL_MS) return null;
    const { waitlistId: _, completed: __, _ts: ___, ...data } = parsed;
    void _;
    void __;
    void ___;
    return data;
  } catch {
    return null;
  }
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
      const { waitlistId: _, completed: __, _ts: ___, ...data } = parsed;
      void _;
      void __;
      void ___;
      return { ...initialState, ...data, loading: false };
    } catch {
      return initialState;
    }
  }, [rawPersisted]);

  // On mount (a full page load): start fresh when the previous onboarding
  // finished (DONE_KEY or legacy `completed` flag), or when data is stale (TTL).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(DONE_KEY)) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(DONE_KEY);
        emitChange();
      } else {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (
            parsed.completed ||
            (parsed._ts && Date.now() - parsed._ts > TTL_MS)
          ) {
            localStorage.removeItem(STORAGE_KEY);
            emitChange();
          }
        }
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
    // Skip persisting during hydration: on the first client render
    // `persistedState` is still the empty initialState reference (getServerSnapshot
    // returns null), so writing it would clobber real localStorage data. Only
    // persist once the store has produced real data or the user has made edits.
    const hasEdits = Object.keys(overrides).length > 0;
    if (persistedState === initialState && !hasEdits) return;
    persist(state);
  }, [state, persist, persistedState, overrides]);

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

  // Flush persisted data to API. Returns waitlistId on success, null on failure.
  const flushToAPI = useCallback(async (): Promise<string | null> => {
    if (typeof window === "undefined") return null;

    // Server-owned — short-circuit once a waitlist exists
    if (overrides.waitlistId) return overrides.waitlistId;

    // Authoritative source is localStorage (survives full-page loads / OAuth
    // redirects, when context state is still empty on first client render).
    // Layer in-memory overrides on top for edits made since the last persist.
    const stored = readStoredData();
    if (!stored) return null;

    const { waitlistId: _, loading: __, ...edits } = overrides;
    void _;
    void __;
    const data = { ...stored, ...edits };

    // subdomain is NOT NULL on waitlists — a slug is required
    const slug = data.slug;
    if (!slug) return null;

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: slug,
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

      if (!res.ok) return null;

      const result = await res.json();
      setOverrides((prev) => ({ ...prev, waitlistId: result.id }));
      // Clear localStorage after successful flush — server now has the data
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
      return result.id as string;
    } catch {
      return null;
    }
  }, [overrides]);

  const clearPersisted = useCallback(() => {
    if (typeof window === "undefined") return;
    // Mark onboarding as finished in a SEPARATE key — `persist` only ever
    // writes STORAGE_KEY, so the flag survives until the next session's mount
    // effect clears both and starts fresh. STORAGE_KEY data is left in place
    // so the success page can still render the live preview from context.
    try {
      localStorage.setItem(DONE_KEY, "1");
    } catch {
      // Ignore
    }
    setOverrides({});
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
