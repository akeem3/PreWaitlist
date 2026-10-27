import type { Metadata } from "next";
import { Hero } from "../../../components/marketing/hero";
import { ProblemSection } from "../../../components/marketing/problem-section";
import { DifferenceSection } from "../../../components/marketing/difference-section";
import { ComparisonSection } from "../../../components/marketing/comparison-section";
import { FeatureGrid } from "../../../components/marketing/feature-grid";
import { ConfidenceSection } from "../../../components/marketing/confidence-section";
import { PricingSection } from "../../../components/marketing/pricing-section";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

type HomeProps = {
  searchParams: Promise<{ src?: string | string[] }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { src } = await searchParams;
  const siteUrl = new URL(
    "/",
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.prewaitlist.com"
  ).toString();
  const websiteJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    url: siteUrl,
    name: "PreWaitlist",
  }).replace(/</g, "\\u003c");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: websiteJsonLd }}
      />
      <Hero isPoweredBy={src === "powered-by"} />
      <ProblemSection />
      <DifferenceSection />
      <ComparisonSection />
      <FeatureGrid />
      <ConfidenceSection />
      <PricingSection />
    </>
  );
}
