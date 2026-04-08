import { test, expect, type Page } from "@playwright/test";
import { waitForHydration } from "../helpers/auth";

/**
 * E2E suite: Goals — MSW-backed flows.
 *
 * Mirrors the auth/dashboard mock pattern from dashboard.spec.ts so the
 * app lands cleanly on /dashboard before navigating to /goals.
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

// GoalsClient.listGoals() does `return response.data` on an Axios GET /goals
// response, so the mock must return the bare GoalDto[] array — NOT wrapped in
// { data: { goals: [...] } }. Returning the envelope shape causes the component
// to receive an object instead of an array and renders no goal cards.
const MOCK_GOALS: Record<string, unknown>[] = [
	{
		id: "g-1",
		name: "Reserva de emergência",
		description: "6 meses de despesas",
		target_amount: 20000,
		current_amount: 13000,
		target_date: "2026-12-31",
		status: "active",
	},
];

/**
 * Sets up route mocks for auth, dashboard and goals API.
 * Uses the same dashboard mock pattern as dashboard.spec.ts to ensure a
 * clean post-login state before navigating to /goals.
 *
 * @param page - Playwright page instance.
 */
const mockAuthAndGoals = async (page: Page): Promise<void> => {
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

	await page.route("**/goals**", async (route) => {
		// Skip page navigation requests — only intercept API (fetch/xhr) calls.
		// Without this check, the pattern also matches the /goals page URL,
		// returning JSON where the browser expects HTML and breaking the render.
		if (route.request().resourceType() === "document") {
			await route.continue();
			return;
		}
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(MOCK_GOALS),
		});
	});
};

/**
 * Logs in and navigates to the goals page.
 *
 * @param page - Playwright page instance.
 */
const loginAndGoToGoals = async (page: Page): Promise<void> => {
	await page.goto("/login");
	await waitForHydration(page);
	await page.locator("#login-email").fill("test@auraxis.com");
	await page.locator("#login-password").fill("ValidPassword1!");
	await page.getByRole("button", { name: /entrar/i }).click();

	await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
	await page.goto("/goals");
	await expect(page).toHaveURL(/\/goals/);
	// Wait for Vue to hydrate the goals page before asserting on UI elements.
	await waitForHydration(page);
};

test.describe("Goals — MSW-backed flows", () => {
	test("goals page loads after login", async ({ page }) => {
		await mockAuthAndGoals(page);
		await loginAndGoToGoals(page);

		await expect(page.locator("main, [role='main']")).toBeVisible({ timeout: 10_000 });
	});

	test("goals page renders mocked goal card", async ({ page }) => {
		await mockAuthAndGoals(page);
		await loginAndGoToGoals(page);

		await expect(page.getByText("Reserva de emergência")).toBeVisible({ timeout: 10_000 });
	});

	test("Nova Meta button is visible on the goals page", async ({ page }) => {
		await mockAuthAndGoals(page);
		await loginAndGoToGoals(page);

		await expect(page.getByRole("button", { name: /nova meta/i })).toBeVisible({
			timeout: 10_000,
		});
	});

	test("clicking Nova Meta opens the goal creation form", async ({ page }) => {
		await mockAuthAndGoals(page);
		await loginAndGoToGoals(page);

		await page.getByRole("button", { name: /nova meta/i }).click();

		await expect(
			page.getByRole("dialog").or(page.locator("form")).first(),
		).toBeVisible({ timeout: 8_000 });
	});
});
