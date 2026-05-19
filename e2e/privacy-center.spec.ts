import { expect, test, type Page } from "@playwright/test";

import { fillLoginForm, waitForHydration } from "./helpers/auth";

const VALID_EMAIL = "test@auraxis.com";
const VALID_PASSWORD = "ValidPassword1!";
const COMPLETED_ONBOARDING_STATE = JSON.stringify({
  done: true,
  skipped: false,
  currentStep: 1,
  formData: {},
});
const DASHBOARD_OVERVIEW_FIXTURE = {
  period: {
    key: "current_month",
    start: "2026-05-01",
    end: "2026-05-31",
    label: "Maio de 2026",
  },
  summary: {
    income: 0,
    expense: 0,
    balance: 0,
    upcoming_due_total: 0,
    net_worth: 0,
  },
  comparison: {
    income_vs_previous_month_percent: null,
    expense_vs_previous_month_percent: null,
    balance_vs_previous_month_percent: null,
  },
  timeseries: [],
  expenses_by_category: [],
  upcoming_dues: [],
  goals: [],
  portfolio: {
    current_value: 0,
    change_percent: null,
  },
  alerts: [],
};
const DASHBOARD_TRENDS_FIXTURE = {
  months: 6,
  series: [],
};

/**
 * Registers route mocks required by the authenticated privacy center tests.
 *
 * @param page Playwright page.
 */
async function mockPrivacyCenterRoutes(page: Page): Promise<void> {
  let sessionEstablished = false;

  await page.route("**/auth/refresh", (route) => {
    route.fulfill({
      status: sessionEstablished ? 200 : 401,
      contentType: "application/json",
      body: JSON.stringify(
        sessionEstablished
          ? { success: true, data: { token: "mock-access-token-refreshed" } }
          : { message: "Unauthorized" },
      ),
    });
  });

  await page.route("**/auth/login", (route) => {
    sessionEstablished = true;
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          user: {
            id: "user-1",
            name: "Test User",
            email: VALID_EMAIL,
            email_confirmed: true,
          },
        },
      }),
    });
  });

  await page.route("**/user/me", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: "user-1",
            name: "Test User",
            email: VALID_EMAIL,
            investor_profile: "conservador",
            gender: "outro",
            birth_date: "1990-01-01",
            monthly_income: 8000,
            monthly_income_net: 7000,
            monthly_expenses: 3200,
            net_worth: 75000,
            initial_investment: 10000,
            monthly_investment: 1200,
            investment_goal_date: "2030-12-31",
            state_uf: "SP",
            occupation: "Analista financeiro",
            financial_objectives: "Organizar as finanças, acompanhar consentimentos e manter dados portáveis.",
            investor_profile_suggested: null,
            profile_quiz_score: null,
            taxonomy_version: null,
          },
        },
      }),
    });
  });

  await page.route("**/dashboard/overview**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(DASHBOARD_OVERVIEW_FIXTURE),
    });
  });

  await page.route("**/dashboard/trends**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(DASHBOARD_TRENDS_FIXTURE),
    });
  });

  await page.route("**/subscriptions/me", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          subscription: {
            id: "sub-e2e",
            user_id: "user-1",
            plan_code: "premium",
            offer_code: "premium_monthly",
            status: "active",
            billing_cycle: "monthly",
            provider: "manual_override",
            provider_subscription_id: null,
            current_period_start: "2026-05-01T00:00:00Z",
            current_period_end: "2026-06-01T00:00:00Z",
            trial_ends_at: null,
            canceled_at: null,
            created_at: "2026-05-01T00:00:00Z",
            updated_at: "2026-05-01T00:00:00Z",
          },
        },
      }),
    });
  });

  await page.route("**/entitlements/check**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ has_access: true }),
    });
  });

  await page.route("**/me/consents", (route) => {
    if (route.request().method() === "GET") {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                kind: "ai",
                action: "granted",
                version: "1.0",
                source: "web",
                created_at: "2026-05-17T12:00:00Z",
              },
            ],
            total: 1,
          },
        }),
      });
      return;
    }

    route.fallback();
  });

  await page.route("**/me/data-export", (route) => {
    route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          request_id: "export-e2e-1",
          status: "queued",
        },
      }),
    });
  });

  await page.route("**/me/deletion-requests", (route) => {
    route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          request_id: "delete-e2e-1",
          status: "scheduled",
        },
      }),
    });
  });
}

/**
 * Logs in through the UI and opens the authenticated privacy center.
 *
 * @param page Playwright page.
 */
async function loginAndGoToPrivacyCenter(page: Page): Promise<void> {
  await mockPrivacyCenterRoutes(page);
  await page.addInitScript(([email, onboardingState]) => {
    localStorage.setItem("auraxis:onboarding:user-1", onboardingState);
    localStorage.setItem(`auraxis:onboarding:${email}`, onboardingState);
  }, [VALID_EMAIL, COMPLETED_ONBOARDING_STATE]);
  await page.goto("/login");
  await waitForHydration(page);
  await fillLoginForm(page, VALID_EMAIL, VALID_PASSWORD);
  await page.getByRole("button", { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

  await page.locator("a[href=\"/settings/privacy\"]").first().evaluate((element) => {
    (element as HTMLAnchorElement).click();
  });
  await expect(page).toHaveURL(/\/settings\/privacy/, { timeout: 10_000 });
  await waitForHydration(page);
}

test.describe("Privacy center — LGPD", () => {
  test("shows consent overview for authenticated users", async ({ page }) => {
    await loginAndGoToPrivacyCenter(page);

    await expect(page.getByRole("heading", { name: /consentimentos/i })).toBeVisible();
    await expect(page.getByText("Insights com IA")).toBeVisible();
    await expect(page.getByText(/dados não treinam modelos/i)).toBeVisible();
  });

  test("requests a portable data package", async ({ page }) => {
    await loginAndGoToPrivacyCenter(page);

    await page.getByRole("button", { name: /solicitar pacote/i }).click();

    await expect(page.getByText(/exportação solicitada/i)).toBeVisible();
    await expect(page.getByText(/export-e2e-1/i)).toBeVisible();
  });

  test("requires password before deletion request", async ({ page }) => {
    await loginAndGoToPrivacyCenter(page);

    await page.getByRole("button", { name: /^solicitar exclusão$/i }).click();

    const submitButton = page.getByRole("button", { name: /enviar solicitação/i });
    await expect(submitButton).toBeDisabled();

    await page.locator("#privacy-delete-password").fill(VALID_PASSWORD);
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    await expect(page.getByText(/exclusão solicitada/i)).toBeVisible();
    await expect(page.getByText(/delete-e2e-1/i)).toBeVisible();
  });
});
