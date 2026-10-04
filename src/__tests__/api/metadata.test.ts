import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Metadata } from "next";

// next/font loaders only work inside the Next compiler — stub for layout import.
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
  Inter: () => ({ variable: "--font-inter" }),
}));

const mockServer = vi.hoisted(() => ({
  __queue: [] as Array<{ data: unknown; error: unknown }>,
  __calls: [] as Array<{ method: string; args: unknown[] }>,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => {
    const pop = () => mockServer.__queue.shift() ?? { data: null, error: null };
    const client = {
      from: (table: string) => {
        mockServer.__calls.push({ method: "from", args: [table] });
        const builder = {
          select: () => builder,
          eq: () => builder,
          order: () => builder,
          single: async () => pop(),
          maybeSingle: async () => pop(),
        };
        return builder;
      },
    };
    return Promise.resolve(client);
  },
}));

const mockAdmin = vi.hoisted(() => ({
  __queue: [] as Array<{ data: unknown; error: unknown }>,
  __calls: [] as Array<{ method: string; args: unknown[] }>,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    const pop = () => mockAdmin.__queue.shift() ?? { data: null, error: null };
    const client = {
      from: (table: string) => {
        mockAdmin.__calls.push({ method: "from", args: [table] });
        const builder = {
          select: () => builder,
          eq: () => builder,
          order: () => builder,
          limit: () => builder,
          single: async () => pop(),
          maybeSingle: async () => pop(),
        };
        return builder;
      },
    };
    return client;
  },
}));

import { generateMetadata as publicGenerateMetadata } from "@/app/(public)/[subdomain]/page";
import { generateMetadata as subdomainLayoutGenerateMetadata } from "@/app/(public)/[subdomain]/layout";
import { generateMetadata as thankYouGenerateMetadata } from "@/app/(public)/[subdomain]/thank-you/page";
import { generateMetadata as leaderboardGenerateMetadata } from "@/app/(public)/[subdomain]/leaderboard/page";
import { alt as publicOgAlt } from "@/app/(public)/[subdomain]/opengraph-image";
import { alt as rootOgAlt } from "@/app/opengraph-image";
import { metadata as rootMetadata } from "@/app/layout";

function props(subdomain = "acme") {
  return { params: Promise.resolve({ subdomain }) };
}

describe("social metadata", () => {
  beforeEach(() => {
    mockServer.__queue.length = 0;
    mockServer.__calls.length = 0;
    mockAdmin.__queue.length = 0;
    mockAdmin.__calls.length = 0;
  });

  describe("public waitlist page — REQ-6.8.6 og:title suffix", () => {
    it("keeps the document title plain and suffixes og + twitter titles", async () => {
      mockServer.__queue.push({
        data: {
          id: "wl-1",
          subdomain: "acme",
          headline: "The Best Product",
          subheadline: "Get early access",
          product_name: "Best",
          is_archived: false,
        },
        error: null,
      });

      const metadata = (await publicGenerateMetadata(props())) as Metadata;

      expect(metadata.title).toBe("The Best Product");
      expect(metadata.openGraph?.title).toBe(
        "The Best Product — Join the waitlist"
      );
      expect(metadata.twitter?.title).toBe(
        "The Best Product — Join the waitlist"
      );
      expect(metadata.openGraph?.siteName).toBe("PreWaitlist");
      expect(metadata.twitter?.card).toBe("summary_large_image");
      expect(metadata.openGraph?.url).toBe("https://acme.prewaitlist.com");
      expect(metadata.description).toBe("Get early access");
    });

    it("falls back to product_name when headline is empty", async () => {
      mockServer.__queue.push({
        data: {
          id: "wl-1",
          subdomain: "acme",
          headline: "  ",
          subheadline: null,
          product_name: "Best",
          is_archived: false,
        },
        error: null,
      });

      const metadata = (await publicGenerateMetadata(props())) as Metadata;

      expect(metadata.title).toBe("Best");
      expect(metadata.openGraph?.title).toBe("Best — Join the waitlist");
    });

    it("returns {} for an archived waitlist", async () => {
      mockServer.__queue.push({
        data: {
          id: "wl-1",
          subdomain: "acme",
          headline: "The Best Product",
          subheadline: "x",
          product_name: "x",
          is_archived: true,
        },
        error: null,
      });

      const metadata = await publicGenerateMetadata(props());

      expect(metadata).toEqual({});
    });
  });

  describe("subdomain layout — metadataBase (og:image origin)", () => {
    it("resolves file-convention og:image against the subdomain host", async () => {
      const metadata = await subdomainLayoutGenerateMetadata(props());

      expect(metadata.metadataBase).toBeInstanceOf(URL);
      expect(metadata.metadataBase?.origin).toBe(
        "https://acme.prewaitlist.com"
      );
    });
  });

  describe("thank-you page — title reuses on-page heading", () => {
    it("titles the page with the waitlist headline", async () => {
      mockAdmin.__queue.push({
        data: { waitlists: { headline: "The Best Product" } },
        error: null,
      });

      const metadata = (await thankYouGenerateMetadata({
        params: Promise.resolve({ subdomain: "acme" }),
        searchParams: Promise.resolve({
          subscriber_id: "s1",
          referral_code: "REF12345",
        }),
      })) as Metadata;

      expect(metadata.title).toBe("The Best Product — You're in.");
    });

    it("keeps the root title when the link is incomplete", async () => {
      const metadata = await thankYouGenerateMetadata({
        params: Promise.resolve({ subdomain: "acme" }),
        searchParams: Promise.resolve({}),
      });

      expect(metadata).toEqual({});
    });

    it("keeps the root title when the subscriber is not found", async () => {
      mockAdmin.__queue.push({ data: null, error: { message: "not found" } });

      const metadata = await thankYouGenerateMetadata({
        params: Promise.resolve({ subdomain: "acme" }),
        searchParams: Promise.resolve({
          subscriber_id: "missing",
          referral_code: "REF12345",
        }),
      });

      expect(metadata).toEqual({});
    });
  });

  describe("leaderboard page — title reuses on-page heading", () => {
    it("titles the page with the waitlist headline", async () => {
      mockServer.__queue.push({
        data: { headline: "The Best Product" },
        error: null,
      });

      const metadata = (await leaderboardGenerateMetadata(props())) as Metadata;

      expect(metadata.title).toBe("The Best Product — Leaderboard");
    });

    it("keeps the root title for an unknown subdomain", async () => {
      mockServer.__queue.push({ data: null, error: { message: "nf" } });

      const metadata = await leaderboardGenerateMetadata(props("nope"));

      expect(metadata).toEqual({});
    });
  });

  describe("opengraph-image alt text", () => {
    it("exports alt on both og image routes", () => {
      expect(publicOgAlt).toBe("PreWaitlist");
      expect(rootOgAlt).toBe("PreWaitlist");
    });
  });

  describe("root layout social defaults", () => {
    it("declares site-wide openGraph + twitter defaults", () => {
      expect(rootMetadata.openGraph?.siteName).toBe("PreWaitlist");
      expect(rootMetadata.openGraph?.type).toBe("website");
      expect(rootMetadata.openGraph?.locale).toBe("en_US");
      expect(rootMetadata.twitter?.card).toBe("summary_large_image");
      expect(rootMetadata.metadataBase).toBeInstanceOf(URL);
    });
  });
});
