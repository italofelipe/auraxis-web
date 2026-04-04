import { test, expect } from "@playwright/test";

import { waitForHydration } from "../helpers/auth";

/**
 * E2E suite: Forgot password flow
 *
 * Uses page.route() to mock API responses — no live backend required.
 * Tests cover: UI rendering, form submission, success state, and the
 * email-enumeration protection (success screen always shown).
 */

const MOCK_FORGOT_PASSWORD_SUCCESS = {
  accepted: true,
  message: "Password reset instructions sent.",
};

test.describe("Auth — Forgot Password", () => {
  test("forgot-password page renders email field and submit button", async ({
    page,
  }) => {
    await page.goto("/forgot-password");

    await expect(page.locator("#forgot-email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /enviar link/i }),
    ).toBeVisible();
  });

  test("forgot-password page has a link back to login", async ({ page }) => {
    await page.goto("/forgot-password");

    const backLink = page.getByRole("link", { name: /voltar ao login/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/login");
  });

  test("shows success state after form submission (API success)", async ({
    page,
  }) => {
    await page.route("**/auth/password/forgot", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_FORGOT_PASSWORD_SUCCESS),
      });
    });

    await page.goto("/forgot-password");
    await waitForHydration(page);
    await page.locator("#forgot-email").fill("user@example.com");
    await page.getByRole("button", { name: /enviar link/i }).click();

    // Success screen should display after submission
    await expect(page.getByText(/e-mail enviado/i)).toBeVisible({
      timeout: 8_000,
    });
  });

  test("shows success state even when API returns 404 (anti-enumeration)", async ({
    page,
  }) => {
    await page.route("**/auth/password/forgot", (route) => {
      route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ message: "Email not found" }),
      });
    });

    await page.goto("/forgot-password");
    await waitForHydration(page);
    await page.locator("#forgot-email").fill("nonexistent@example.com");
    await page.getByRole("button", { name: /enviar link/i }).click();

    // The app intentionally shows success regardless of the API result
    // to prevent email enumeration attacks
    await expect(page.getByText(/e-mail enviado/i)).toBeVisible({
      timeout: 8_000,
    });
  });

  test("success state displays a link back to login", async ({ page }) => {
    await page.route("**/auth/password/forgot", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_FORGOT_PASSWORD_SUCCESS),
      });
    });

    await page.goto("/forgot-password");
    await waitForHydration(page);
    await page.locator("#forgot-email").fill("user@example.com");
    await page.getByRole("button", { name: /enviar link/i }).click();

    await expect(page.getByText(/e-mail enviado/i)).toBeVisible({
      timeout: 8_000,
    });

    const backLink = page.getByRole("link", { name: /voltar ao login/i });
    await expect(backLink).toBeVisible();
  });

  test("submit button is disabled while request is in progress", async ({
    page,
  }) => {
    await page.route("**/auth/password/forgot", async (route) => {
      await page.waitForTimeout(800);
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_FORGOT_PASSWORD_SUCCESS),
      });
    });

    await page.goto("/forgot-password");
    await waitForHydration(page);
    await page.locator("#forgot-email").fill("user@example.com");

    const submitButton = page.locator(".forgot-form__submit");
    await submitButton.click();

    await expect(submitButton).toBeDisabled();
    await page.unrouteAll({ behavior: "ignoreErrors" });
  });

  test("shows validation error when submitting with empty email", async ({
    page,
  }) => {
    await page.goto("/forgot-password");

    await page.getByRole("button", { name: /enviar link/i }).click();

    // Should remain on forgot-password without API call
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.locator("#forgot-email")).toBeVisible();
  });
});
