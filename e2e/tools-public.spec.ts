import { test, expect } from "@playwright/test";

/**
 * E2E suite: Public tool pages (guest access)
 *
 * Validates that calculator pages are prerendered, load correctly, and
 * render their interactive form without requiring authentication.
 *
 * These tests require NO credentials and must always run in CI.
 */
test.describe("Tools — Guest access", () => {
  test("tool index page loads and lists tools", async ({ page }) => {
    const response = await page.goto("/tools");
    expect(response?.status()).toBe(200);

    await expect(page).toHaveTitle(/Auraxis/);
    // Page should render tool cards/links
    await expect(page.locator("main, [role='main']")).toBeVisible();
  });

  test("juros-compostos calculator page loads (HTTP 200, not 404)", async ({ request }) => {
    const response = await request.get("/tools/juros-compostos");
    expect(response.status()).toBe(200);
  });

  test("juros-compostos renders calculator form in browser", async ({ page }) => {
    await page.goto("/tools/juros-compostos");

    // The calculator form should be visible without login
    await expect(page.locator("form, [data-testid='calculator'], input[type='number']").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("thirteenth-salary calculator page loads (HTTP 200, not 404)", async ({ request }) => {
    const response = await request.get("/tools/thirteenth-salary");
    expect(response.status()).toBe(200);
  });

  test("thirteenth-salary renders calculator form in browser", async ({ page }) => {
    await page.goto("/tools/thirteenth-salary");

    await expect(page.locator("form, [data-testid='calculator'], input[type='number']").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("fire calculator page loads (HTTP 200, not 404)", async ({ request }) => {
    const response = await request.get("/tools/fire");
    expect(response.status()).toBe(200);
  });
});
