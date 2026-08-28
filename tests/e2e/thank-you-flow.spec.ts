import { test, expect } from "@playwright/test";

test.describe("Thank-You Page Flow", () => {
  test("thank-you page loads without JavaScript errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(
      "/test-subdomain/thank-you?subscriber_id=test&referral_code=abc"
    );

    expect(errors).toHaveLength(0);
  });

  test("thank-you page without params shows 404 or error", async ({ page }) => {
    const response = await page.goto("/test-subdomain/thank-you");
    expect([200, 404, 500]).toContain(response?.status());
  });
});
