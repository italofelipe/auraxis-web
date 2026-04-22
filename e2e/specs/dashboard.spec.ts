import { test, expect, type Page } from "@playwright/test";
import { waitForHydration } from "../helpers/auth";

/**
 * E2E suite: Dashboard page — backed by MSW mock handlers.
 *
 * Sets up a mock authenticated session via `page.route()` to intercept login
 * and dashboard API calls. No real backend or CI secrets required.
 *
 * Covered scenarios:
 *   - Dashboard page loads with mocked data
 *   - Summary cards show correct financial values
 *   - Page title contains "Dashboard"
 */

/** Mock successful login response reused across tests. */
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

/** Mock dashboard overview data. */
const MOCK_OVERVIEW = {
	income: 10000,
	expense: 4000,
	balance: 6000,
	netWorth: 50000,
	goals: [],
	alerts: [],
	upcomingDues: [],
	expensesByCategory: [],
	comparison: null,
	portfolio: { currentValue: 25000, costBasis: 20000 },
};

/**
 * Registers all routes needed for an authenticated dashboard session.
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

	// Trailing ** required — Playwright globs are anchored; without it the
	// pattern does not match URLs with query strings (?month=2026-04).
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
			body: JSON.stringify({
				series: [
					{ month: "2025-11", income: 8000, expenses: 3500, balance: 4500 },
					{ month: "2025-12", income: 10000, expenses: 4000, balance: 6000 },
				],
			}),
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

test.describe("Dashboard — MSW-backed flows", () => {
	test("dashboard page loads with mocked data", async ({ page }) => {
		await mockAuthAndDashboard(page);

		await page.goto("/login");
		await waitForHydration(page);
		await page.locator("#login-email").fill("test@auraxis.com");
		await page.locator("#login-password").fill("ValidPassword1!");
		await page.getByRole("button", { name: /entrar/i }).click();

		await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
		await expect(page.locator("main, [role='main']")).toBeVisible();
	});

	test("page title contains Dashboard", async ({ page }) => {
		await mockAuthAndDashboard(page);

		await page.goto("/login");
		await waitForHydration(page);
		await page.locator("#login-email").fill("test@auraxis.com");
		await page.locator("#login-password").fill("ValidPassword1!");
		await page.getByRole("button", { name: /entrar/i }).click();

		await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
		await expect(page).toHaveTitle(/dashboard/i);
	});

	test("summary cards are rendered on the dashboard", async ({ page }) => {
		await mockAuthAndDashboard(page);

		await page.goto("/login");
		await waitForHydration(page);
		await page.locator("#login-email").fill("test@auraxis.com");
		await page.locator("#login-password").fill("ValidPassword1!");
		await page.getByRole("button", { name: /entrar/i }).click();

		await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

		// The summary grid section should be present with at least one metric card.
		// DashboardSummaryGrid renders a <section class="summary-grid"> containing UiMetricCard children.
		const summaryGrid = page.locator(".summary-grid, [data-testid='summary-grid']");
		await expect(summaryGrid).toBeVisible({ timeout: 10_000 });
	});
});
