import { test, expect, type Page } from "@playwright/test";
import { waitForHydration } from "../helpers/auth";

/**
 * E2E suite: Dashboard period comparison — MSW-backed.
 *
 * Context: issue #636 refers to "weekly comparison" but the current
 * `DashboardComparison` schema exposes only month-over-previous-month deltas
 * (`incomeVsPreviousMonthPercent`, `expenseVsPreviousMonthPercent`,
 * `balanceVsPreviousMonthPercent`). This suite audits that when the overview
 * API returns a populated `comparison`, the dashboard summary grid renders a
 * `UiTrendBadge` for each metric that carries a delta, with the correct
 * direction modifier class.
 */

const MOCK_LOGIN_SUCCESS = {
  success: true,
  message: "Authenticated",
  data: {
    token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    user: {
      id: "user-1",
      name: "Test User",
      email: "test@auraxis.com",
      email_confirmed: true,
    },
  },
};

const MOCK_OVERVIEW_WITH_COMPARISON = {
  income: 10000,
  expense: 4000,
  balance: 6000,
  netWorth: 50000,
  goals: [],
  alerts: [],
  upcomingDues: [],
  expensesByCategory: [],
  comparison: {
    incomeVsPreviousMonthPercent: 20,
    expenseVsPreviousMonthPercent: 10,
    balanceVsPreviousMonthPercent: -5,
  },
  portfolio: { currentValue: 25000, costBasis: 20000 },
};

/**
 * Registers mock routes for an authenticated dashboard session with a
 * populated month-over-month comparison object.
 *
 * @param page - Playwright page instance.
 */
const mockAuthAndDashboard = async (page: Page): Promise<void> => {
  await page.route("**/auth/login", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_LOGIN_SUCCESS),
    });
  });

  await page.route("**/dashboard/overview", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_OVERVIEW_WITH_COMPARISON),
    });
  });

  await page.route("**/dashboard/trends", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ series: [] }),
    });
  });

  await page.route("**/user/me", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "user-1",
        email: "test@auraxis.com",
        name: "Test User",
        subscription_plan: "free",
      }),
    });
  });
};

/**
 * Performs the mocked login → dashboard navigation flow.
 *
 * @param page - Playwright page instance.
 */
const loginAndLandOnDashboard = async (page: Page): Promise<void> => {
  await page.goto("/login");
  await waitForHydration(page);
  await page.locator("#login-email").fill("test@auraxis.com");
  await page.locator("#login-password").fill("ValidPassword1!");
  await page.getByRole("button", { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
};

test.describe("Dashboard — period comparison (month-over-month)", () => {
  test("renders a trend badge inside summary-grid when comparison is present", async ({ page }) => {
    await mockAuthAndDashboard(page);
    await loginAndLandOnDashboard(page);

    const summaryGrid = page.locator(".summary-grid");
    await expect(summaryGrid).toBeVisible({ timeout: 10_000 });

    const trendBadges = summaryGrid.locator(".ui-trend-badge");
    await expect(trendBadges.first()).toBeVisible({ timeout: 10_000 });
    expect(await trendBadges.count()).toBeGreaterThanOrEqual(1);
  });

  test("uses --positive modifier class for positive income delta", async ({ page }) => {
    await mockAuthAndDashboard(page);
    await loginAndLandOnDashboard(page);

    const summaryGrid = page.locator(".summary-grid");
    await expect(summaryGrid).toBeVisible({ timeout: 10_000 });

    const positive = summaryGrid.locator(".ui-trend-badge--positive");
    await expect(positive.first()).toBeVisible({ timeout: 10_000 });
  });

  test("uses --negative modifier class for negative balance delta", async ({ page }) => {
    await mockAuthAndDashboard(page);
    await loginAndLandOnDashboard(page);

    const summaryGrid = page.locator(".summary-grid");
    await expect(summaryGrid).toBeVisible({ timeout: 10_000 });

    const negative = summaryGrid.locator(".ui-trend-badge--negative");
    await expect(negative.first()).toBeVisible({ timeout: 10_000 });
  });
});
