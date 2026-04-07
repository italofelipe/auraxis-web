import { test, expect } from "@playwright/test";
import { waitForHydration } from "../helpers/auth";

/**
 * E2E suite: Auth flows — backed by MSW mock handlers.
 *
 * These tests run against the MSW Node interceptor started in
 * `e2e/setup/global-setup.ts`. No real backend or environment secrets are
 * required, making the suite safe for CI without external dependencies.
 *
 * Covered scenarios:
 *   - Successful login redirects to /dashboard
 *   - Invalid credentials show an error message
 *   - Unauthenticated access to /dashboard redirects to /login
 */

/**
 * Mock payload returned by the MSW handler for a successful login.
 * Kept here for reference — actual interception is in `e2e/mocks/handlers.ts`.
 */
const VALID_EMAIL = "test@auraxis.com";
const VALID_PASSWORD = "ValidPassword1!";

test.describe("Auth — MSW-backed flows", () => {
	test("successful login redirects to /dashboard", async ({ page }) => {
		await page.route("**/auth/login", (route) => {
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					success: true,
					message: "Authenticated",
					data: {
						token: "mock-access-token",
						refresh_token: "mock-refresh-token",
						user: {
							id: "user-1",
							name: "Test User",
							email: VALID_EMAIL,
							email_confirmed: true,
						},
					},
				}),
			});
		});

		await page.goto("/login");
		await waitForHydration(page);

		await page.locator("#login-email").fill(VALID_EMAIL);
		await page.locator("#login-password").fill(VALID_PASSWORD);
		await page.getByRole("button", { name: /entrar/i }).click();

		await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
	});

	test("invalid credentials show an error message and stay on /login", async ({ page }) => {
		await page.route("**/auth/login", (route) => {
			route.fulfill({
				status: 401,
				contentType: "application/json",
				body: JSON.stringify({
					message: "Credenciais inválidas. Verifique seu e-mail e senha.",
				}),
			});
		});

		await page.route("**/auth/refresh", (route) => {
			route.fulfill({
				status: 401,
				contentType: "application/json",
				body: JSON.stringify({ message: "Refresh token invalid" }),
			});
		});

		await page.goto("/login");
		await waitForHydration(page);

		await page.locator("#login-email").fill("wrong@auraxis.com");
		await page.locator("#login-password").fill("WrongPassword1!");
		await page.getByRole("button", { name: /entrar/i }).click();

		await expect(page).toHaveURL(/\/login/);
		await expect(
			page.getByText(/você não tem permissão para realizar esta ação/i),
		).toBeVisible({ timeout: 5_000 });
	});

	test("unauthenticated access to /dashboard redirects to /login", async ({ page }) => {
		// Do not set any auth cookie — navigate directly to protected route
		await page.goto("/dashboard");

		await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
	});
});
