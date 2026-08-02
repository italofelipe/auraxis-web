import { test, expect, type Page } from "@playwright/test";

import { fillInputAndVerify, waitForHydration } from "../helpers/auth";

/**
 * E2E suite: Reset password flow
 *
 * Uses page.route() to mock API responses — no live backend required.
 *
 * The anchor test is the wire-contract one: the API requires `new_password`,
 * and shipping `password` instead broke every password reset in production
 * (#1301). There was no E2E on this route at the time, which is why it went
 * unnoticed.
 */

// The backend enforces `validate.Length(min=24)` on the token.
const VALID_TOKEN = "3QXcbPV7pGg6NrT4EnEbZBZe227q0YskHGKdmmx";
const VALID_PASSWORD = "NovaSenha@1";

const RESET_URL = `/reset-password?token=${VALID_TOKEN}`;

/**
 * Fills both password fields with the same valid password.
 *
 * @param page Playwright page.
 */
async function fillPasswords(page: Page): Promise<void> {
  await fillInputAndVerify(page, "#reset-password", VALID_PASSWORD);
  await fillInputAndVerify(page, "#reset-confirm-password", VALID_PASSWORD);
}

test.describe("Auth — Reset Password", () => {
  test("sends new_password on the wire and never the form-level password", async ({
    page,
  }) => {
    let capturedBody: Record<string, unknown> | null = null;

    await page.route("**/auth/password/reset", async (route) => {
      capturedBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Password updated successfully",
          data: {},
        }),
      });
    });

    await page.goto(RESET_URL);
    await waitForHydration(page);
    await fillPasswords(page);
    await page.getByRole("button", { name: /redefinir senha|salvar nova senha/i }).click();

    await expect
      .poll(() => capturedBody, { timeout: 8_000 })
      .not.toBeNull();

    expect(capturedBody).toHaveProperty("new_password", VALID_PASSWORD);
    expect(capturedBody).toHaveProperty("token", VALID_TOKEN);
    expect(capturedBody).not.toHaveProperty("password");
  });

  test("shows the success state and lands on login", async ({ page }) => {
    await page.route("**/auth/password/reset", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Password updated successfully",
          data: {},
        }),
      });
    });

    await page.goto(RESET_URL);
    await waitForHydration(page);
    await fillPasswords(page);
    await page.getByRole("button", { name: /redefinir senha|salvar nova senha/i }).click();

    await expect(page.getByText(/senha (redefinida|alterada)/i)).toBeVisible({
      timeout: 8_000,
    });
    await page.waitForURL("**/login", { timeout: 8_000 });
  });

  test("renders the invalid-link state when the token is missing", async ({ page }) => {
    await page.goto("/reset-password");
    await waitForHydration(page);

    await expect(page.getByRole("link", { name: /novo link/i })).toBeVisible();
    await expect(page.locator("#reset-password")).toHaveCount(0);
  });

  test("surfaces a server error instead of pretending it worked", async ({ page }) => {
    await page.route("**/auth/password/reset", (route) => {
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Validation error",
          error: { code: "VALIDATION_ERROR", details: {} },
        }),
      });
    });

    await page.goto(RESET_URL);
    await waitForHydration(page);
    await fillPasswords(page);
    await page.getByRole("button", { name: /redefinir senha|salvar nova senha/i }).click();

    await expect(page.getByRole("alert")).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/senha (redefinida|alterada)/i)).toHaveCount(0);
  });

  test("blocks a password that breaks the backend rules before any request", async ({
    page,
  }) => {
    let requested = false;
    await page.route("**/auth/password/reset", (route) => {
      requested = true;
      route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto(RESET_URL);
    await waitForHydration(page);
    await fillInputAndVerify(page, "#reset-password", "curta1!");
    await fillInputAndVerify(page, "#reset-confirm-password", "curta1!");
    await page.getByRole("button", { name: /redefinir senha|salvar nova senha/i }).click();

    await page.waitForTimeout(1_000);
    expect(requested).toBe(false);
  });
});
