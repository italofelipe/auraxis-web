import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./helpers/auth";

/**
 * E2E suite: Goals — Create goal (authenticated)
 *
 * Validates the goal creation flow for an authenticated user.
 * Requires:
 *   E2E_TEST_EMAIL    — email of the test user
 *   E2E_TEST_PASSWORD — password of the test user
 */
test.describe("Goals — Authenticated flow", () => {
  test.skip(
    !process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD,
    "Skipped: E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set",
  );

  test("goals page loads after login", async ({ page }) => {
    await loginAsTestUser(page);

    await page.goto("/goals");
    await expect(page).toHaveURL(/\/goals/);
    await expect(page.locator("main, [role='main']")).toBeVisible();
  });

  test("can open create goal modal", async ({ page }) => {
    await loginAsTestUser(page);

    await page.goto("/goals");

    // Look for a "New goal" / "Nova meta" button
    const createBtn = page.getByRole("button", { name: /nova meta|new goal|criar meta|add goal/i });
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
    await createBtn.click();

    // Modal or form should appear
    await expect(page.getByRole("dialog").or(page.locator("form"))).toBeVisible({
      timeout: 5_000,
    });
  });
});
