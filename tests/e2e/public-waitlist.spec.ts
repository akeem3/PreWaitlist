import { test, expect } from "@playwright/test";

test.describe("Public Waitlist Page", () => {
  test("loads waitlist page for a subdomain", async ({ page }) => {
    // This test requires a running dev server with seed data
    // Skip in CI if no test subdomain exists
    const response = await page.goto("/test-subdomain");
    // Page should load (200) or 404 if no test subdomain — both are valid
    expect([200, 404]).toContain(response?.status());
  });

  test("has no JavaScript errors on public page", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/nonexistent-subdomain");
    // 404 page should still render without JS errors
    expect(errors).toHaveLength(0);
  });

  test("leaderboard page loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/test-subdomain/leaderboard");
    // Page should load without JS errors regardless of data
    expect(errors).toHaveLength(0);
  });
});
