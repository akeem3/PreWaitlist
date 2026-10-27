import type { Metadata } from "next";
import { PricingSection } from "../../../../components/marketing/pricing-section";

export const metadata: Metadata = {
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return <PricingSection headingLevel="h1" />;
}
