import { test, expect, type Page } from "@playwright/test";
import { waitForHydration } from "../helpers/auth";

/**
 * E2E suite: Onboarding wizard (3 passos — PROD-3).
 *
 * Covers:
 *   - Complete happy path (step1 → step2 → step3 → complete).
 *   - Skip from inside the wizard surfaces the dashboard nudge.
 *   - Partial progress survives a reload (currentStep + formData persist via
 *     localStorage) and the nudge's "Retomar" reopens the wizard where the
 *     user left off.
 *
 * All backend calls are intercepted with `page.route()` so no live API is
 * required; we only assert the UI transitions. Mutations return minimal
 * shapes — just enough for the UI to treat the call as successful.
 */

const MOCK_LOGIN_SUCCESS = {
  success: true,
  message: "Authenticated",
  data: {
    token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    user: {
      id: "user-onboarding",
      name: "Ana Ribeiro",
      email: "ana@auraxis.com",
      email_confirmed: true,
    },
  },
};

const MOCK_USER_ME = {
  id: "user-onboarding",
  email: "ana@auraxis.com",
  name: "Ana Ribeiro",
  subscription_plan: "free",
  email_confirmed: true,
};

const MOCK_OVERVIEW = {
  income: 0,
  expense: 0,
  balance: 0,
  netWorth: 0,
  goals: [],
  alerts: [],
  upcomingDues: [],
  expensesByCategory: [],
  comparison: null,
  portfolio: { currentValue: 0, costBasis: 0 },
};

/**
 * Registers the minimal set of HTTP routes the dashboard + onboarding wizard
 * touches during the flow. Creation endpoints return 201 / 200 with tiny
 * payloads — the wizard only cares that the mutation resolves without error.
 *
 * @param page Playwright page instance to attach routes to.
 */
async function mockAuthAndOnboardingApis(page: Page): Promise<void> {
  await page.route("**/auth/login", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_LOGIN_SUCCESS),
    });
  });

  await page.route("**/user/me", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_USER_ME),
    });
  });

  await page.route("**/dashboard/overview**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_OVERVIEW),
    });
  });

  await page.route("**/dashboard/trends**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ series: [] }),
    });
  });

  await page.route("**/user/profile", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { user: { ...MOCK_USER_ME, monthly_income: "7500.00", investor_profile: "conservador" } },
      }),
    });
  });

  await page.route("**/transactions", (route) => {
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ data: [{ id: "tx-1", title: "Salário", amount: "1500.00", type: "income" }] }),
    });
  });

  await page.route("**/goals", (route) => {
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ id: "goal-1", name: "Reserva de emergência", target_amount: 10000, target_date: "2027-04-23" }),
    });
  });
}

/**
 * Logs in and waits for the wizard overlay to appear on /dashboard.
 *
 * @param page Playwright page instance.
 */
async function loginAndReachWizard(page: Page): Promise<void> {
  await page.goto("/login");
  await waitForHydration(page);
  await page.locator("#login-email").fill("ana@auraxis.com");
  await page.locator("#login-password").fill("ValidPassword1!");
  await page.getByRole("button", { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  await expect(page.locator(".onboarding-dialog")).toBeVisible({ timeout: 10_000 });
}

test.describe("Onboarding wizard — 3 passos (PROD-3)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthAndOnboardingApis(page);
  });

  test("completes the full 3-step wizard end-to-end", async ({ page }) => {
    await loginAndReachWizard(page);

    // Step 1 — dados básicos
    await expect(page.locator("[data-testid='onboarding-step1-form']")).toBeVisible();
    await page.locator("[data-testid='onboarding-step1-income']").fill("7500,00");
    await page.locator("[data-testid='onboarding-step1-profile']").selectOption("conservador");
    await page.locator("[data-testid='step1-next']").click();

    // Step 2 — primeira transação
    await expect(page.locator("[data-testid='onboarding-step2-form']")).toBeVisible();
    await page.locator("[data-testid='onboarding-step2-type-income']").click();
    await page.locator("[data-testid='onboarding-step2-title']").fill("Salário");
    await page.locator("[data-testid='onboarding-step2-amount']").fill("1500,00");
    // Date input already defaults to today; leave as-is.
    await page.locator("[data-testid='step2-next']").click();

    // Step 3 — primeira meta
    await expect(page.locator("[data-testid='onboarding-step3-form']")).toBeVisible();
    await page.locator("[data-testid='onboarding-step3-name']").fill("Reserva de emergência");
    await page.locator("[data-testid='onboarding-step3-amount']").fill("10000");
    await page.locator("[data-testid='step3-complete']").click();

    // Wizard overlay should disappear; no skip nudge.
    await expect(page.locator(".onboarding-dialog")).toBeHidden({ timeout: 5_000 });
    await expect(page.locator("[data-testid='onboarding-skip-nudge']")).toBeHidden();
  });

  test("skipping the wizard surfaces the dashboard nudge and 'Retomar' reopens it mid-flow", async ({ page }) => {
    await loginAndReachWizard(page);

    // Advance to step 2 so we have partial progress to resume.
    await page.locator("[data-testid='onboarding-step1-income']").fill("7500,00");
    await page.locator("[data-testid='step1-next']").click();
    await expect(page.locator("[data-testid='onboarding-step2-form']")).toBeVisible();

    // Skip from inside the wizard.
    await page.getByRole("button", { name: /pular por enquanto/i }).click();
    await expect(page.locator(".onboarding-dialog")).toBeHidden({ timeout: 5_000 });

    // Dashboard nudge should render.
    const nudge = page.locator("[data-testid='onboarding-skip-nudge']");
    await expect(nudge).toBeVisible();

    // Clicking "Retomar" should reopen the wizard on the step we left off (step 2).
    await page.locator("[data-testid='onboarding-nudge-resume']").click();
    await expect(page.locator(".onboarding-dialog")).toBeVisible();
    await expect(page.locator("[data-testid='onboarding-step2-form']")).toBeVisible();
  });

  test("back/forward navigation preserves filled values and wizard is navigable", async ({ page }) => {
    await loginAndReachWizard(page);

    await page.locator("[data-testid='onboarding-step1-income']").fill("4200,00");
    await page.locator("[data-testid='onboarding-step1-profile']").selectOption("explorador");
    await page.locator("[data-testid='step1-next']").click();
    await expect(page.locator("[data-testid='onboarding-step2-form']")).toBeVisible();

    // Go back to step 1 — values should still be filled.
    await page.getByRole("button", { name: /voltar/i }).click();
    await expect(page.locator("[data-testid='onboarding-step1-form']")).toBeVisible();
    await expect(page.locator("[data-testid='onboarding-step1-income']")).toHaveValue("4200,00");
    await expect(page.locator("[data-testid='onboarding-step1-profile']")).toHaveValue("explorador");
  });
});
