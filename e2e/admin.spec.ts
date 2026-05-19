import { expect, test, type Page } from "@playwright/test";
import { fillLoginForm, seedCookieConsent, waitForHydration } from "./helpers/auth";

const VALID_EMAIL = "test@auraxis.com";
const VALID_PASSWORD = "ValidPassword1!";

/**
 * Builds an unsigned JWT-like token so the frontend can read mocked claims.
 *
 * @param payload JWT payload claims.
 * @returns Token-shaped string.
 */
const tokenWithPayload = (payload: Record<string, unknown>): string => {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64url");
  return `header.${encodedPayload}.signature`;
};

/**
 * Registers MSW-style route mocks for admin and non-admin browser sessions.
 *
 * @param page Playwright page instance.
 * @param options Session role options.
 * @param options.isAdmin Whether the mocked session should include admin claims.
 */
const mockAdminSession = async (
  page: Page,
  options: { isAdmin: boolean },
): Promise<void> => {
  const token = tokenWithPayload({ roles: options.isAdmin ? ["admin"] : ["user"] });
  let sessionEstablished = false;

  await page.addInitScript(() => {
    const completedState = JSON.stringify({
      done: true,
      skipped: false,
      currentStep: 1,
      formData: {},
    });
    localStorage.setItem("auraxis:onboarding:test@auraxis.com", completedState);
    localStorage.setItem("auraxis:onboarding:user-1", completedState);
  });
  await seedCookieConsent(page);

  await page.route("**/auth/refresh", (route) => {
    if (!sessionEstablished) {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Unauthorized" }),
      });
      return;
    }

    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { token } }),
    });
  });

  await page.route("**/auth/login", (route) => {
    sessionEstablished = true;
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "Authenticated",
        data: {
          token,
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
        message: "OK",
        data: {
          user: {
            id: "user-1",
            name: "Test User",
            email: VALID_EMAIL,
            gender: "outro",
            birth_date: "1990-01-01",
            monthly_income: 8_000,
            monthly_income_net: 7_000,
            net_worth: 35_000,
            monthly_expenses: 3_000,
            initial_investment: 5_000,
            monthly_investment: 1_000,
            investment_goal_date: "2030-01-01",
            state_uf: "SP",
            occupation: "Analista financeiro",
            investor_profile: "explorador",
            financial_objectives: "Organizar a vida financeira e acompanhar indicadores.",
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
      body: JSON.stringify({
        period: { key: "current_month", start: "2026-05-01", end: "2026-05-31", label: "maio 2026" },
        summary: { income: 0, expense: 0, balance: 0, upcoming_due_total: 0, net_worth: 0 },
        comparison: null,
        timeseries: [],
        expenses_by_category: [],
        upcoming_dues: [],
        goals: [],
        portfolio: { current_value: 0, change_percent: null },
        alerts: [],
      }),
    });
  });

  await page.route("**/dashboard/trends**", (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ series: [] }) });
  });

  await page.route("**/dashboard/survival-index", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ n_months: 0, total_assets: 0, avg_monthly_expense: 0, classification: "unknown" }),
    });
  });

  await page.route("**/entitlements/check**", (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ has_access: true }) });
  });

  await page.route("**/wallet/entries**", (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });

  await page.route("**/transactions/due-range**", (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ transactions: [], total: 0 }) });
  });
};

/**
 * Performs the mocked UI login flow and waits for the authenticated app.
 *
 * @param page Playwright page instance.
 */
const login = async (page: Page): Promise<void> => {
  await page.goto("/login");
  await waitForHydration(page);
  await fillLoginForm(page, VALID_EMAIL, VALID_PASSWORD);
  await page.getByRole("button", { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
};

test.describe("Admin — shell and guard", () => {
  test("blocks authenticated non-admin users without exposing admin data", async ({ page }) => {
    await mockAdminSession(page, { isAdmin: false });
    await login(page);

    await page.goto("/admin");

    await expect(page).toHaveURL(/\/admin\/forbidden/, { timeout: 10_000 });
    await expect(
      page.locator(".admin-forbidden").getByRole("heading", { name: "Acesso restrito" }),
    ).toBeVisible();
    await expect(page.getByText(/não possui permissões administrativas/i)).toBeVisible();
    await expect(page.getByText("Console administrativo")).toBeHidden();
  });

  test("shows the admin route and shell for users with admin claims", async ({ page }) => {
    await mockAdminSession(page, { isAdmin: true });
    await login(page);

    await expect(page.getByRole("link", { name: /admin/i })).toBeVisible({ timeout: 10_000 });
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "Console administrativo" })).toBeVisible();
    const adminNavigation = page.getByRole("navigation", { name: "Navegação administrativa" });
    await expect(adminNavigation).toBeVisible();
    await expect(adminNavigation.getByRole("link", { name: /Insights IA/ })).toBeVisible();
  });
});
