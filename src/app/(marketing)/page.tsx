import { Hero } from "../../../components/marketing/hero";
import { ProblemSection } from "../../../components/marketing/problem-section";
import { DifferenceSection } from "../../../components/marketing/difference-section";
import { ComparisonSection } from "../../../components/marketing/comparison-section";
import { FeatureGrid } from "../../../components/marketing/feature-grid";
import { ConfidenceSection } from "../../../components/marketing/confidence-section";
import { PricingSection } from "../../../components/marketing/pricing-section";

export default function Home() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <DifferenceSection />
      <ComparisonSection />
      <FeatureGrid />
      <ConfidenceSection />
      <PricingSection />
    </>
  );
}
