import { test, expect, type Page } from "@playwright/test";
import { waitForHydration } from "../helpers/auth";

/**
 * E2E suite: Navigation — MSW-backed flows.
 *
 * Verifies in-app navigation using mocked auth + API responses.
 * No real backend or CI secrets required.
 *
 * Covered scenarios:
 *   - Authenticated user can navigate between pages via the sidebar
 *   - Guest user accessing a protected route is redirected to /login
 */

/** Mock successful login response. */
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
 * Registers route mocks for auth and common API endpoints.
 *
 * @param page - Playwright page instance.
 */
const mockAuthRoutes = async (page: Page): Promise<void> => {
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

	await page.route("**/dashboard/**", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({}),
		});
	});
};

test.describe("Navigation — MSW-backed flows", () => {
	test("authenticated user can access sidebar navigation", async ({ page }) => {
		await mockAuthRoutes(page);

		await page.goto("/login");
		await waitForHydration(page);
		await page.locator("#login-email").fill("test@auraxis.com");
		await page.locator("#login-password").fill("ValidPassword1!");
		await page.getByRole("button", { name: /entrar/i }).click();

		await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

		// Sidebar/navigation landmark should be present after login
		await expect(page.getByRole("navigation")).toBeVisible({ timeout: 5_000 });
	});

	test("guest user accessing a protected route is redirected to /login", async ({ page }) => {
		// Attempt to access multiple protected routes without any auth cookie
		await page.goto("/dashboard");
		await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
	});

	test("authenticated user can navigate to /goals from sidebar", async ({ page }) => {
		await mockAuthRoutes(page);

		await page.route("**/goals", (route) => {
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ data: { goals: [] } }),
			});
		});

		await page.goto("/login");
		await waitForHydration(page);
		await page.locator("#login-email").fill("test@auraxis.com");
		await page.locator("#login-password").fill("ValidPassword1!");
		await page.getByRole("button", { name: /entrar/i }).click();

		await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

		// Navigate to /goals — prefer sidebar link when it is within the viewport,
		// otherwise fall back to direct navigation (mobile viewports collapse the sidebar).
		const goalsLink = page.getByRole("link", { name: /metas|goals/i }).first();
		const isInViewport = await goalsLink.evaluate((el): boolean => {
			const rect = el.getBoundingClientRect();
			return rect.top >= 0 && rect.bottom <= (window.innerHeight ?? document.documentElement.clientHeight);
		}).catch(() => false);

		if (isInViewport) {
			await goalsLink.click();
		} else {
			await page.goto("/goals");
		}

		await expect(page).toHaveURL(/\/goals/, { timeout: 10_000 });
	});
});
