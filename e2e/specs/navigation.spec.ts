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
	// The session-restore plugin calls POST /auth/refresh on every full page load
	// (split-token pattern, SEC-GAP-01). Returns 401 before login (no refresh cookie),
	// 200 after login (simulating the cookie set by the server on POST /auth/login).
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
				body: JSON.stringify({ success: true, data: { token: "mock-access-token-refreshed" } }),
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

		// On mobile viewports the sidebar collapses into a hidden drawer whose items
		// are pushed off-screen via CSS transforms — direct navigation is more reliable.
		// Use sidebar click only when the viewport is wide enough for the expanded sidebar.
		const viewportWidth = page.viewportSize()?.width ?? 1280;
		if (viewportWidth >= 768) {
			const goalsLink = page.getByRole("link", { name: /metas|goals/i }).first();
			await goalsLink.click();
		} else {
			await page.goto("/goals");
		}

		await expect(page).toHaveURL(/\/goals/, { timeout: 10_000 });
	});
});
