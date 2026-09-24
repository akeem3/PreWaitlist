"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

type Tier = "free" | "pro";

interface MilestoneReward {
  threshold: number;
  label: string;
  isDefault?: boolean;
}

interface Question {
  id?: string;
  text: string;
  type: "free_text" | "multiple_choice";
  options?: string[] | null;
}

export interface OnboardingFormState {
  waitlistId: string | null;
  slug: string;
  productName: string;
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

// Methods available on LocalOnboardingProvider (Phase A)
interface LocalOnboardingFormContextValue extends OnboardingFormState {
  updateField: <K extends keyof OnboardingFormState>(
    key: K,
    value: OnboardingFormState[K]
  ) => void;
  setWaitlistId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  flushToAPI: () => Promise<string | null>;
  clearPersisted: () => void;
  clearDraft: () => void;
}

// Methods available on AuthedOnboardingProvider (Phase B)
interface AuthedOnboardingFormContextValue extends OnboardingFormState {
  updateField: <K extends keyof OnboardingFormState>(
    key: K,
    value: OnboardingFormState[K]
  ) => void;
  setLoading: (loading: boolean) => void;
  patchWaitlist: (data: Record<string, unknown>) => Promise<void>;
}

type OnboardingFormContextValue =
  LocalOnboardingFormContextValue | AuthedOnboardingFormContextValue;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "prewaitlist_onboarding";
const SESSION_FLAG_KEY = "prewaitlist_onboarding_active";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// camelCase → snake_case mapping for API PATCH requests
const FIELD_MAP: Record<string, string> = {
  productName: "product_name",
  brandColor: "brand_color",
  ctaText: "cta_text",
  logoUrl: "logo_url",
  milestoneRewards: "milestone_rewards",
  signupCounterEnabled: "signup_counter_enabled",
  signupCounterThreshold: "signup_counter_threshold",
  emailSubject: "email_subject",
  emailSenderName: "email_sender_name",
  emailBody: "email_body",
  qualificationEnabled: "qualification_enabled",
};

const initialState: OnboardingFormState = {
  waitlistId: null,
  slug: "",
  productName: "",
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

// ---------------------------------------------------------------------------
// localStorage helpers (Phase A only)
// ---------------------------------------------------------------------------

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
    if (!data.headline && data.productName) {
      data.headline = data.productName;
    }
    return data;
  } catch {
    return null;
  }
}

function toPersisted(state: OnboardingFormState) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { loading, waitlistId, ...rest } = state;
  return { ...rest, _ts: Date.now() };
}

// Session flag: tracks whether user is actively in onboarding in this tab.
// If localStorage has data but no session flag → cold landing with stale draft.
function setSessionFlag() {
  try {
    sessionStorage.setItem(SESSION_FLAG_KEY, "1");
  } catch {
    // Ignore
  }
}

export function hasActiveSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SESSION_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function hasStaleDraft(): boolean {
  if (typeof window === "undefined") return false;
  const stored = readStoredData();
  if (!stored) return false;
  const hasData =
    stored.slug || stored.headline || stored.template !== "minimal";
  return Boolean(hasData) && !hasActiveSession();
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const OnboardingFormContext = createContext<
  OnboardingFormContextValue | undefined
>(undefined);

// ---------------------------------------------------------------------------
// Phase A: LocalOnboardingProvider (Steps 1–3, unauthenticated)
//
// useState + localStorage. No network calls. Authoritative source is
// localStorage — React state is a local mirror.
// ---------------------------------------------------------------------------

export function LocalOnboardingProvider({
  children,
  initialTier,
}: {
  children: React.ReactNode;
  initialTier?: "free" | "pro";
}) {
  const [state, setState] = useState<OnboardingFormState>(() => {
    const stored = readStoredData();
    if (stored) {
      // Mark this tab as actively in onboarding
      setSessionFlag();
      return {
        ...initialState,
        ...stored,
        tier: initialTier ?? (stored.tier as "free" | "pro") ?? "free",
        loading: false,
      };
    }
    return { ...initialState, tier: initialTier ?? "free" };
  });

  // Ref always holds the latest state — fixes stale closures in async callbacks
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Persist to localStorage on every change (skip if server owns the data)
  useEffect(() => {
    if (state.waitlistId) return; // flushToAPI set the ID — server is authoritative
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersisted(state)));
    } catch {
      // Silent fail
    }
  }, [state]);

  // Cross-tab sync: re-hydrate when another tab writes to the same key
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      if (e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const { waitlistId: _, loading: __, _ts: ___, ...data } = parsed;
          void _;
          void __;
          void ___;
          setState((s) => ({ ...s, ...data }));
        } catch {
          // Ignore malformed data from other tab
        }
      } else {
        // Key was removed in another tab
        setState(initialState);
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const updateField = useCallback(
    <K extends keyof OnboardingFormState>(
      key: K,
      value: OnboardingFormState[K]
    ) => {
      setState((s) => {
        const next = { ...s, [key]: value };
        stateRef.current = next; // sync ref immediately so flushToAPI reads fresh values
        return next;
      });
    },
    []
  );

  const setWaitlistId = useCallback((id: string) => {
    setState((s) => {
      const next = { ...s, waitlistId: id };
      stateRef.current = next;
      return next;
    });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((s) => {
      const next = { ...s, loading };
      stateRef.current = next;
      return next;
    });
  }, []);

  // Flush localStorage to API. Returns waitlistId on success.
  const flushToAPI = useCallback(async (): Promise<string | null> => {
    if (typeof window === "undefined") return null;

    const stored = readStoredData();
    if (!stored) return null;

    // Merge current in-memory state on top of localStorage
    // Read from ref to avoid stale closure — updateField calls before this
    // won't have committed to state yet
    const { waitlistId: _, loading: __, ...edits } = stateRef.current;
    void _;
    void __;
    const data = { ...stored, ...edits };

    const slug = data.slug;
    if (!slug) return null;

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: slug,
          product_name: data.productName || undefined,
          headline: data.headline || undefined,
          subheadline: data.subheadline || undefined,
          template: data.template || undefined,
          brand_color: data.brandColor || undefined,
          logo_url: data.logoUrl || undefined,
          cta_text: data.ctaText || undefined,
          milestone_rewards: data.milestoneRewards || undefined,
          qualification_enabled: data.qualificationEnabled ?? undefined,
          signup_counter_enabled: data.signupCounterEnabled ?? undefined,
          signup_counter_threshold: data.signupCounterThreshold || undefined,
          questions: data.questions || undefined,
          email_subject: data.emailSubject || undefined,
          email_sender_name: data.emailSenderName || undefined,
          email_body: data.emailBody || undefined,
        }),
      });

      if (!res.ok) return null;

      const result = await res.json();
      const id = result.id as string;

      // Update local state with server-owned ID
      setState((s) => ({ ...s, waitlistId: id }));

      // Clear localStorage — server now has the data
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }

      return id;
    } catch {
      return null;
    }
  }, []);

  const clearPersisted = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setState(initialState);
  }, []);

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(SESSION_FLAG_KEY);
    } catch {
      // Ignore
    }
    setState(initialState);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      updateField,
      setWaitlistId,
      setLoading,
      flushToAPI,
      clearPersisted,
      clearDraft,
    }),
    [
      state,
      updateField,
      setWaitlistId,
      setLoading,
      flushToAPI,
      clearPersisted,
      clearDraft,
    ]
  );

  return (
    <OnboardingFormContext.Provider value={value}>
      {children}
    </OnboardingFormContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Phase B: AuthedOnboardingProvider (Steps 4–5, authenticated)
//
// useState seeded from server state. Updates via debounced PATCH.
// No localStorage code — structurally impossible to read or write.
// ---------------------------------------------------------------------------

export function AuthedOnboardingProvider({
  initial,
  children,
}: {
  initial: OnboardingFormState;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<OnboardingFormState>(initial);
  const pendingRef = useRef<Record<string, unknown>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (Object.keys(pendingRef.current).length === 0) return;
    const payload = { ...pendingRef.current, waitlist_id: state.waitlistId };
    pendingRef.current = {};
    try {
      await fetch("/api/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Silent fail — will retry on next update
    }
  }, [state.waitlistId]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const updateField = useCallback(
    <K extends keyof OnboardingFormState>(
      key: K,
      value: OnboardingFormState[K]
    ) => {
      setState((s) => ({ ...s, [key]: value }));

      // Debounce PATCH to server
      const apiKey = FIELD_MAP[key] || key;
      pendingRef.current[apiKey] = value;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        flush();
      }, 500);
    },
    [flush]
  );

  const setLoading = useCallback((loading: boolean) => {
    setState((s) => ({ ...s, loading }));
  }, []);

  // Explicit PATCH for launch handler (Step 5)
  const patchWaitlist = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        await fetch("/api/waitlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, waitlist_id: state.waitlistId }),
        });
      } catch {
        // Silent fail
      }
    },
    [state.waitlistId]
  );

  const value = useMemo(
    () => ({
      ...state,
      updateField,
      setLoading,
      patchWaitlist,
    }),
    [state, updateField, setLoading, patchWaitlist]
  );

  return (
    <OnboardingFormContext.Provider value={value}>
      {children}
    </OnboardingFormContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOnboardingForm() {
  const context = useContext(OnboardingFormContext);
  if (!context) {
    throw new Error(
      "useOnboardingForm must be used within an OnboardingFormProvider"
    );
  }
  return context;
}
