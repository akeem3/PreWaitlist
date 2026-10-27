# SEO implementation and Google Search Console progress

Last updated: 2026-10-28

## Summary

The foundational SEO and crawler-control implementation is live on `main`. Google Search Console ownership was subsequently verified, the sitemap was submitted successfully, and URL Inspection confirmed that the homepage is indexed. Google accepted priority crawl requests for the other four public sitemap pages after their live tests showed they were available to Google.

An accepted indexing request means Google queued a crawl; it does not guarantee that the page will be indexed. Check Search Console again after Google has had time to crawl the pages.

## Shipped implementation

The work was committed and deployed to production:

- Commit: `929d5b61e7e43cdaa4d4a9f0d0a5af4802dde61a`
- Branch: `main`
- Canonical host: `https://www.prewaitlist.com` (the apex domain redirects to `www`)

Implemented:

- `src/app/robots.ts` serves `robots.txt`, allows crawlers including OAI-SearchBot and GPTBot, and advertises the sitemap.
- `src/app/sitemap.ts` publishes these five public URLs:
  - `https://www.prewaitlist.com/`
  - `https://www.prewaitlist.com/pricing`
  - `https://www.prewaitlist.com/legal/terms`
  - `https://www.prewaitlist.com/legal/privacy`
  - `https://www.prewaitlist.com/refund-policy`
- **Homepage (`/`):** existing page updated with server-rendered heading content, a self-referencing canonical URL, and `WebSite` JSON-LD.
- **Pricing (`/pricing`):** existing page updated with a page heading, self-referencing canonical URL, and a crawlable footer link. This route was not newly created for this SEO work.
- **Terms (`/legal/terms`) and Privacy (`/legal/privacy`):** existing legal pages given self-referencing canonicals and included in the sitemap; they were not newly created for this SEO work.
- **Refund Policy (`/refund-policy`):** new public page created and published, with its own canonical URL. It is linked in the marketing footer and included in the sitemap.
- Authenticated and operational routes, including tenant waitlist pages, have `noindex` directives. Tenant waitlists are intentionally excluded from the sitemap until owner opt-in is available. Thank-you and leaderboard pages are also not intended for indexing.
- Anonymous visitors can access the refund-policy page.

Metadata titles and descriptions were intentionally left generic per the product decision made during implementation. Do not add or rewrite public-facing SEO copy without confirming the desired wording.

## Google Search Console progress

The `prewaitlist.com` Domain property (`sc-domain:prewaitlist.com`) is now accessible in Google Search Console. Domain ownership verification initially failed because Google could not find the TXT record. The user added the Google-provided TXT record in Vercel DNS and subsequently reached the verified property.

| Check                                        | Result                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Public sitemap endpoint                      | Accessible; contains the five canonical public pages above                                       |
| `robots.txt`                                 | Accessible; allows crawlers and points to `https://www.prewaitlist.com/sitemap.xml`              |
| Search Console sitemap submission            | Submitted; Search Console reported **Success**                                                   |
| Homepage URL Inspection                      | **URL is on Google**; page is indexed and served over HTTPS                                      |
| Pricing live test                            | **URL is available to Google** and **Page can be indexed**; indexing request accepted and queued |
| Terms live test and indexing request         | User reported the same successful live-test and priority-queue outcome                           |
| Privacy live test and indexing request       | User reported the same successful live-test and priority-queue outcome                           |
| Refund Policy live test and indexing request | User reported the same successful live-test and priority-queue outcome                           |
| Search performance / indexing reports        | Newly initialized and still processing data at the time checked                                  |

When pricing was inspected before Google processed the sitemap, Search Console showed “URL is unknown to Google” and no referring sitemap. This is a discovery-state result, not evidence that the route is broken. Its subsequent live test confirmed availability, and the request was accepted. The other four URLs, except the already-indexed homepage, have been queued for crawling; their final indexing status remains to be checked.

## Paddle

Paddle was originally configured in sandbox mode. The production transition was then completed:

- The user obtained the live Paddle API key, client token, and production price ID, updated the corresponding local environment configuration and Vercel production environment, and deployed the app with those settings.
- The client environment was switched to Paddle production mode. No application code change was required for the sandbox-to-production switch.
- The production Paddle account had approved `prewaitlist.com`. The user reported that Paddle address/identity verification was still pending at the time, so that account-level review was a separate outstanding Paddle item; live environment configuration alone should not be treated as confirmation that every account restriction was cleared.
- The Paddle notification/webhook-set ID is a dashboard identifier, not an application environment variable. It is not a substitute for the webhook signing secret the app needs to verify incoming events. The production signing-secret status was not independently confirmed during this handoff. No credential values are recorded in this document.

The user also confirmed that the refund-policy URL was updated in the live Paddle dashboard to:

`https://www.prewaitlist.com/refund-policy`

This was a dashboard-side change and did not require another code deployment.

The app's production Paddle configuration and the Paddle account's review/approval status are distinct. If confirming that real transactions can complete, use Paddle's live dashboard and a controlled live checkout; do not infer payment readiness merely from a successful deployment.

## Validation completed

During implementation:

- Production builds passed.
- Lint passed with zero errors and five existing unrelated warnings.
- The focused Supabase middleware regression suite passed 15/15.
- Production smoke checks confirmed the robots file, sitemap, public policy route, canonicals, homepage H1, and JSON-LD.

For the final commit/push request, the user explicitly asked not to run a test suite. A production build passed; no test suite was run as part of that final deploy request.

## Follow-up

1. Allow Google time to crawl the queued pages; do not repeatedly submit the same indexing requests.
2. Revisit Search Console **Indexing → Pages** and the **Sitemaps** report after a few days. Reports and indexing status may take longer to update.
3. Use URL Inspection to confirm the final status of `/pricing`, `/legal/terms`, `/legal/privacy`, and `/refund-policy`.
4. Do not request indexing for tenant waitlists, thank-you pages, or leaderboard pages while the existing `noindex`/owner-opt-in decisions remain in effect.
5. Continue using Google Search Console; Bing Webmaster Tools was explicitly not selected.
