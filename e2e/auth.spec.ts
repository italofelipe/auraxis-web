import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

/**
 * E2E suite: Authentication flows
 *
 * Covers the login happy path. Requires:
 *   E2E_TEST_EMAIL    — email of the test user
 *   E2E_TEST_PASSWORD — password of the test user
 */
test.describe("Auth — Login happy path", () => {
  test.skip(
    !process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD,
    "Skipped: E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set",
  );

  test("login page renders with email and password fields", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByLabel(/e-?mail/i)).toBeVisible();
    await expect(page.getByLabel(/senha/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /entrar|login/i })).toBeVisible();
  });

  test("successful login redirects to /dashboard", async ({ page }) => {
    await loginAsTestUser(page);

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("dashboard is visible after login", async ({ page }) => {
    await loginAsTestUser(page);

    // Verify the main navigation landmark is present (SSR shell rendered)
    await expect(page.getByRole("navigation")).toBeVisible();
  });
});
