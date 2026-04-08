import { test, expect, type Page } from "@playwright/test";
import { waitForHydration } from "../helpers/auth";

/**
 * E2E suite: Goals — MSW-backed flows.
 *
 * Covers authenticated happy paths for the goals page:
 *   - Goals page loads with mocked goal list
 *   - GoalCard is rendered with goal data
 *   - "Nova Meta" button is visible
 *   - Opening the goal creation form shows required fields
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

const MOCK_GOALS = {
	data: {
		goals: [
			{
				id: "g-1",
				name: "Reserva de emergência",
				description: "6 meses de despesas",
				target_amount: 20000,
				current_amount: 13000,
				target_date: "2026-12-31",
				status: "active",
				progressPercent: 65,
				currentAmount: 13000,
				targetAmount: 20000,
				targetDate: "2026-12-31",
			},
		],
	},
};

/**
 * Sets up route mocks for auth and goals API.
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

	await page.route("**/goals**", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(MOCK_GOALS),
		});
	});

	await page.route("**/dashboard/**", (route) => {
		route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
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

		// A modal/dialog or inline form should appear
		await expect(
			page.getByRole("dialog").or(page.locator("form")).first(),
		).toBeVisible({ timeout: 8_000 });
	});
});
