import type { Page } from "@playwright/test";

/** Credentials for E2E test user. Must be set in CI via secrets. */
const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "";

/**
 * Performs a login via the UI and waits for the dashboard to load.
 * Uses the `E2E_TEST_EMAIL` and `E2E_TEST_PASSWORD` environment variables.
 *
 * @param page - Playwright page instance.
 * @throws If E2E test credentials are not configured.
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error(
      "E2E test credentials not configured. Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD.",
    );
  }

  await page.goto("/login");
  await page.getByLabel(/e-?mail/i).fill(TEST_EMAIL);
  await page.getByLabel(/senha/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /entrar|login/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}
