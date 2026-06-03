import { test, expect, type Page } from "@playwright/test";

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
	period: {
		key: "current_month",
		start: "2026-05-01",
		end: "2026-05-31",
		label: "maio de 2026",
	},
	summary: {
		income: 124500,
		expense: 82340.5,
		balance: 42159.5,
		upcoming_due_total: 15000,
		net_worth: 220000,
	},
	comparison: {
		income_vs_previous_month_percent: 12.5,
		expense_vs_previous_month_percent: -4.2,
		balance_vs_previous_month_percent: 28.4,
	},
	timeseries: [],
	expenses_by_category: [
		{ category: "Tecnologia & SaaS", amount: 12450, percentage: 15 },
		{ category: "Infraestrutura", amount: 8230, percentage: 10 },
	],
	upcoming_dues: [
		{
			id: "due-1",
			description: "Aluguel Escritório SP",
			amount: 15000,
			due_date: "2026-05-12",
			category: "Infraestrutura",
		},
	],
	goals: [],
	portfolio: { current_value: 220000, change_percent: 8.6 },
	alerts: [
		{
			type: "warning",
			title: "Gasto atípico: Marketing",
			description: "Facebook Ads excedeu a média mensal nos últimos 3 dias.",
			action_label: "Revisar Despesa",
		},
	],
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

	await page.route("**/auth/refresh", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, data: { token: "mock-access-token-refreshed" } }),
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

	await page.route("**/subscriptions/me", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				id: "sub-free",
				plan_slug: "free",
				status: "active",
				trial_ends_at: null,
				current_period_end: null,
				provider: null,
				provider_subscription_id: null,
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

	await page.route("**/tags", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ data: { tags: [] } }),
		});
	});

	await page.route("**/accounts", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ data: { accounts: [] } }),
		});
	});

	await page.route("**/credit-cards", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ data: { credit_cards: [] } }),
		});
	});

	// Insight carousel data sources (PROD dashboard revamp).
	await page.route("**/goals", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ data: [] }),
		});
	});

	await page.route("**/transactions/due-range**", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				transactions: [],
				total: 0,
				page: 1,
				per_page: 20,
				counts: { total: 0, overdue: 0, pending: 0 },
			}),
		});
	});
};

test.describe("Dashboard — MSW-backed flows", () => {
	test("dashboard page loads with mocked data", async ({ page }) => {
		await mockAuthAndDashboard(page);

		await page.goto("/dashboard");

		await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
		await expect(page.locator("main, [role='main']")).toBeVisible();
	});

	test("page title contains Dashboard", async ({ page }) => {
		await mockAuthAndDashboard(page);

		await page.goto("/dashboard");

		await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
		await expect(page).toHaveTitle(/dashboard/i);
	});

	test("market pulse dashboard renders prototype sections", async ({ page }) => {
		await mockAuthAndDashboard(page);

		await page.goto("/dashboard");

		await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

		await expect(page.locator(".market-pulse")).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText("Receitas (Mês)")).toBeVisible();
		await expect(page.getByText("Fluxo de Caixa (mensal)")).toBeVisible();
		await expect(page.getByText("Gastos por Categoria")).toBeVisible();
		// The empty month-over-month strip was replaced by the insight carousel.
		await expect(page.locator("[data-testid='dashboard-insight-carousel']")).toBeVisible();
		await expect(page.getByText("Comparativo com o mês anterior")).toHaveCount(0);
		await expect(page.getByText("Transações Recentes")).toHaveCount(0);
		await expect(page.getByText("Anomalias Detectadas")).toHaveCount(0);
		await expect(page.locator(".n-message")).toHaveCount(0);
	});
});
