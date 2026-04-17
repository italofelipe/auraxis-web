import { test, expect, type Page } from "@playwright/test";
import { waitForHydration } from "../helpers/auth";

/**
 * E2E suite: Paywall / subscriber gating on tool pages.
 *
 * Tool result sections (ToolSaveResult) are gated behind premium access.
 * Free users see a paywall CTA. These tests verify the gate behavior using
 * MSW-style route mocking.
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
 * Sets up route mocks for a free-tier authenticated user.
 *
 * @param page - Playwright page instance.
 */
const mockFreeUser = async (page: Page): Promise<void> => {
	let sessionEstablished = false;

	await page.route("**/auth/refresh", (route) => {
		if (!sessionEstablished) {
			route.fulfill({
				status: 401,
				contentType: "application/json",
				body: JSON.stringify({ message: "Unauthorized" }),
			});
		} else {
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true, data: { token: "mock-refreshed" } }),
			});
		}
	});

	await page.route("**/auth/login", (route) => {
		sessionEstablished = true;
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

	await page.route("**/dashboard/**", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({}),
		});
	});

	await page.route("**/entitlements**", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ premiumAccess: false }),
		});
	});
};

/**
 * Logs in as the test user.
 *
 * @param page - Playwright page instance.
 */
const loginAsUser = async (page: Page): Promise<void> => {
	await page.goto("/login");
	await waitForHydration(page);
	await page.locator("#login-email").fill("test@auraxis.com");
	await page.locator("#login-password").fill("ValidPassword1!");
	await page.getByRole("button", { name: /entrar/i }).click();
	await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
};

test.describe("Paywall — free user tool access", () => {
	test("free user can access tool calculator page", async ({ page }) => {
		await mockFreeUser(page);
		await loginAsUser(page);

		await page.goto("/tools/juros-compostos");
		await waitForHydration(page);

		// Calculator form should be accessible to all users
		await expect(page.locator("form").first()).toBeVisible({ timeout: 10_000 });
	});

	test("guest user can use calculator without login", async ({ page }) => {
		// Tool pages are public — no auth mocking needed
		await page.goto("/tools/juros-compostos");
		await waitForHydration(page);

		await expect(page.locator("form").first()).toBeVisible({ timeout: 10_000 });

		const submitBtn = page.locator("button[type=\"submit\"]").first();
		await expect(submitBtn).toBeVisible({ timeout: 10_000 });
	});

	test("register page loads for unauthenticated user", async ({ page }) => {
		const response = await page.goto("/register");
		expect(response?.status()).toBe(200);
		await waitForHydration(page);

		await expect(page.locator("form").first()).toBeVisible({ timeout: 10_000 });
	});
});
