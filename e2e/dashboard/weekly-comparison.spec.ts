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

/**
 * Must use the "rich contract" shape to trigger the mapper path that reads
 * `comparison` — the mapper switches on the presence of `period`. Without it,
 * `mapDashboardOverviewDto` falls through to the simplified path, which always
 * sets comparison to null regardless of what the mock sends.
 *
 * Field names are snake_case to match the actual backend DTO.
 */
const MOCK_OVERVIEW_WITH_COMPARISON = {
  period: {
    key: "current_month",
    start: "2026-04-01",
    end: "2026-04-30",
    label: "abril 2026",
  },
  summary: {
    income: 10000,
    expense: 4000,
    balance: 6000,
    upcoming_due_total: 500,
    net_worth: 50000,
  },
  comparison: {
    income_vs_previous_month_percent: 20,
    expense_vs_previous_month_percent: 10,
    balance_vs_previous_month_percent: -5,
  },
  timeseries: [],
  expenses_by_category: [],
  upcoming_dues: [],
  goals: [],
  portfolio: { current_value: 25000, change_percent: null },
  alerts: [],
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

  // Trailing ** is required — Playwright globs anchor with ^ and $, so a
  // pattern without ** at the end will NOT match URLs with query strings
  // (e.g. /dashboard/overview?month=2026-04).
  await page.route("**/dashboard/overview**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_OVERVIEW_WITH_COMPARISON),
    });
  });

  await page.route("**/dashboard/trends**", (route) => {
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

  await page.route("**/dashboard/survival-index", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        n_months: 3,
        total_assets: 25000,
        avg_monthly_expense: 4000,
        classification: "ok",
      }),
    });
  });

  await page.route("**/wallet/entries**", (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });

  await page.route("**/transactions/due-range**", (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ transactions: [], total: 0 }) });
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
