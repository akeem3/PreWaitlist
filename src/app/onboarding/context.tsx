"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Tier = "free" | "pro" | "growth";

interface MilestoneReward {
  name: string;
  value: string;
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
}

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
  emailSubject: "",
  emailSenderName: "",
  emailBody: "",
  tier: "free",
  loading: false,
};

const OnboardingFormContext = createContext<
  OnboardingFormContextValue | undefined
>(undefined);

export function OnboardingFormProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<OnboardingFormState>(initialState);

  const updateField = useCallback(
    <K extends keyof OnboardingFormState>(
      key: K,
      value: OnboardingFormState[K]
    ) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const setWaitlistId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, waitlistId: id }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  return (
    <OnboardingFormContext.Provider
      value={{ ...state, updateField, setWaitlistId, setLoading }}
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
