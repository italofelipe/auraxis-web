import { expect, test, type Page } from "@playwright/test";

import { seedCookieConsent, waitForHydration } from "../helpers/auth";

const CONFIRM_SUCCESS_WITH_SESSION = {
  success: true,
  message: "E-mail confirmado.",
  data: {
    token: "mock-confirm-access-token",
    user: {
      identity: {
        id: "user-confirm-1",
        name: "Confirm User",
        email: "confirm@auraxis.com.br",
      },
      email_verification: {
        verified: true,
        deadline_at: null,
        required_now: false,
        days_remaining: null,
      },
    },
  },
};

const DASHBOARD_OVERVIEW = {
  success: true,
  data: {
    summary: {
      balance: 0,
      income: 0,
      expenses: 0,
      due: 0,
      netWorth: 0,
    },
    comparison: null,
    cashflow: [],
    categories: [],
    alerts: [],
    pending: [],
  },
};

/**
 * Stubs dashboard bootstrap endpoints touched after magic-link sign-in.
 *
 * @param page Playwright page.
 */
async function mockDashboardBootstrap(page: Page): Promise<void> {
  await page.route("**/user/me", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          id: "user-confirm-1",
          name: "Confirm User",
          email: "confirm@auraxis.com.br",
          email_confirmed: true,
        },
      }),
    });
  });
  await page.route("**/dashboard/overview**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(DASHBOARD_OVERVIEW),
    });
  });
  await page.route("**/dashboard/trends**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: [] }),
    });
  });
  await page.route("**/entitlements/check**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { allowed: false } }),
    });
  });
  await page.route("**/subscriptions/me", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { subscription: { plan_code: "free", status: "free" } } }),
    });
  });
}

test.describe("Auth — Confirm Email", () => {
  test.beforeEach(async ({ page }) => {
    await seedCookieConsent(page);
  });

  test("valid magic link opens a session and redirects to dashboard", async ({ page }) => {
    await mockDashboardBootstrap(page);
    await page.route("**/auth/email/confirm", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(CONFIRM_SUCCESS_WITH_SESSION),
      });
    });

    await page.goto("/confirm-email?token=valid-token");
    await waitForHydration(page);

    await expect(page.getByText(/e-mail confirmado/i)).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });

  test("invalid or expired token shows a recovery CTA without spinning forever", async ({ page }) => {
    await page.route("**/auth/email/confirm", (route) => {
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Link inválido ou expirado.",
          code: "INVALID_EMAIL_CONFIRMATION_TOKEN",
        }),
      });
    });

    await page.goto("/confirm-email?token=expired-token");
    await waitForHydration(page);

    await expect(page.getByRole("heading", { name: /link inválido ou expirado/i })).toBeVisible({
      timeout: 5_000,
    });
    const resendLink = page.getByRole("link", { name: /reenviar e-mail/i });
    await expect(resendLink).toBeVisible();
    await expect(resendLink).toHaveAttribute("href", "/resend-confirmation");
    await expect(page.getByText(/confirmando seu e-mail/i)).toBeHidden();
  });
});
