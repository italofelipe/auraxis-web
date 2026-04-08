import { test, expect, type Page } from "@playwright/test";
import { waitForHydration } from "../helpers/auth";

/**
 * E2E suite: Transactions — MSW-backed flows.
 *
 * Mirrors the auth/dashboard mock pattern from dashboard.spec.ts so the
 * app lands cleanly on /dashboard before navigating to /transactions.
 * All API calls are intercepted via `page.route()` — no real backend required.
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

const MOCK_TRANSACTIONS = {
	data: {
		transactions: [
			{
				id: "tx-1",
				title: "Salário Mensal",
				amount: "10000.00",
				type: "income",
				due_date: "2025-12-01",
				status: "paid",
				is_recurring: false,
				is_installment: false,
				installment_count: null,
				currency: "BRL",
				description: null,
				observation: null,
				start_date: null,
				end_date: null,
				tag_id: null,
				account_id: null,
				credit_card_id: null,
				installment_group_id: null,
				paid_at: "2025-12-01",
				created_at: "2025-12-01T10:00:00Z",
				updated_at: "2025-12-01T10:00:00Z",
			},
		],
	},
};

/**
 * Sets up all route mocks needed for an authenticated transactions session.
 * Uses the same dashboard mock pattern as dashboard.spec.ts to ensure a
 * clean post-login state before navigating to /transactions.
 *
 * @param page - Playwright page instance.
 */
const mockAuthAndTransactions = async (page: Page): Promise<void> => {
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
			body: JSON.stringify({
				id: "user-1",
				email: "test@auraxis.com",
				name: "Test User",
				subscription_plan: "free",
			}),
		});
	});

	// Provide proper-shaped dashboard responses so the app lands cleanly.
	await page.route("**/dashboard/overview", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(MOCK_OVERVIEW),
		});
	});

	await page.route("**/dashboard/trends", (route) => {
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

	await page.route("**/transactions**", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(MOCK_TRANSACTIONS),
		});
	});

	await page.route("**/tags**", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ data: { tags: [] } }),
		});
	});

	await page.route("**/accounts**", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ data: { accounts: [] } }),
		});
	});
};

/**
 * Logs in and navigates to the transactions page.
 *
 * @param page - Playwright page instance.
 */
const loginAndGoToTransactions = async (page: Page): Promise<void> => {
	await page.goto("/login");
	await waitForHydration(page);
	await page.locator("#login-email").fill("test@auraxis.com");
	await page.locator("#login-password").fill("ValidPassword1!");
	await page.getByRole("button", { name: /entrar/i }).click();

	await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
	await page.goto("/transactions");
	await expect(page).toHaveURL(/\/transactions/);
};

test.describe("Transactions — MSW-backed flows", () => {
	test("transactions page loads after login", async ({ page }) => {
		await mockAuthAndTransactions(page);
		await loginAndGoToTransactions(page);

		await expect(page.locator("main, [role='main']")).toBeVisible({ timeout: 10_000 });
	});

	test("page has Nova Receita and Nova Despesa action buttons", async ({ page }) => {
		await mockAuthAndTransactions(page);
		await loginAndGoToTransactions(page);

		await expect(page.getByRole("button", { name: /nova receita/i })).toBeVisible({
			timeout: 10_000,
		});
		await expect(page.getByRole("button", { name: /nova despesa/i })).toBeVisible({
			timeout: 10_000,
		});
	});

	test("transaction table renders mocked row", async ({ page }) => {
		await mockAuthAndTransactions(page);
		await loginAndGoToTransactions(page);

		await expect(page.getByText("Salário Mensal")).toBeVisible({ timeout: 10_000 });
	});
});
