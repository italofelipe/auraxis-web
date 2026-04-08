import { test, expect, type Page } from "@playwright/test";
import { waitForHydration } from "../helpers/auth";

/**
 * E2E suite: Transactions — MSW-backed flows.
 *
 * Covers the authenticated happy paths for the transactions page:
 *   - Page loads with mocked transaction list
 *   - "Nova Receita" / "Nova Despesa" buttons are visible
 *   - Opening the expense creation modal shows the form
 *   - Transaction row is rendered in the table
 *
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

const MOCK_TAGS = { data: { tags: [] } };
const MOCK_ACCOUNTS = { data: { accounts: [] } };

/**
 * Sets up all route mocks needed for an authenticated transactions session.
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
			body: JSON.stringify(MOCK_TAGS),
		});
	});

	await page.route("**/accounts**", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(MOCK_ACCOUNTS),
		});
	});

	await page.route("**/dashboard/**", (route) => {
		route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
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

	test("clicking Nova Despesa opens the expense creation form", async ({ page }) => {
		await mockAuthAndTransactions(page);
		await loginAndGoToTransactions(page);

		await page.getByRole("button", { name: /nova despesa/i }).click();

		// A modal/dialog or inline form should appear
		await expect(
			page.getByRole("dialog").or(page.locator("form")).first(),
		).toBeVisible({ timeout: 8_000 });
	});

	test("transaction table renders mocked row", async ({ page }) => {
		await mockAuthAndTransactions(page);
		await loginAndGoToTransactions(page);

		// The mocked transaction title should appear in the table
		await expect(page.getByText("Salário Mensal")).toBeVisible({ timeout: 10_000 });
	});
});
