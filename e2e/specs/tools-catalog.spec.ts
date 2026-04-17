import { test, expect, type Page } from "@playwright/test";
import { waitForHydration } from "../helpers/auth";

/**
 * E2E suite: Tools catalog (index) page.
 *
 * The /tools page requires authentication (middleware: ["authenticated"]).
 * Tool cards use ToolCatalogCard which renders NCard + NButton (not <a> links).
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
 * Sets up auth routes for the tools catalog page.
 *
 * @param page - Playwright page instance.
 */
const mockAuthForTools = async (page: Page): Promise<void> => {
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
};

/**
 * Logs in via UI and navigates to /tools using client-side routing.
 *
 * Clicks the sidebar NuxtLink instead of page.goto (which causes a full SSR
 * reload, wiping Pinia state and causing the authenticated middleware to
 * redirect back to /login).
 *
 * @param page - Playwright page instance.
 */
const loginAndGoToTools = async (page: Page): Promise<void> => {
	await page.goto("/login");
	await waitForHydration(page);
	await page.locator("#login-email").fill("test@auraxis.com");
	await page.locator("#login-password").fill("ValidPassword1!");
	await page.getByRole("button", { name: /entrar/i }).click();
	await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

	// Client-side navigation preserves the in-memory Pinia session token.
	// A full page.goto would trigger SSR → server-side middleware → redirect,
	// because the token only lives in Pinia memory (client-side).
	// Access the Vue Router via the root Vue app instance and push client-side.
	await page.evaluate(() => {
		const root = document.getElementById("__nuxt");
		const router = root?.__vue_app__?.config?.globalProperties?.$router;
		router?.push("/tools");
	});
	await page.waitForURL("**/tools", { timeout: 10_000 });
	await waitForHydration(page);
};

test.describe("Tools — Catalog page", () => {
	test("tools index page loads for authenticated user", async ({ page }) => {
		await mockAuthForTools(page);
		await loginAndGoToTools(page);

		await expect(page).toHaveURL(/\/tools/);
	});

	test("catalog displays tool cards as NCard components", async ({ page }) => {
		await mockAuthForTools(page);
		await loginAndGoToTools(page);

		// ToolCatalogCard renders inside .tool-catalog-card (NCard with that class)
		const toolCards = page.locator(".tool-catalog-card");
		await expect(toolCards.first()).toBeVisible({ timeout: 10_000 });

		const count = await toolCards.count();
		expect(count).toBeGreaterThanOrEqual(10);
	});

	test("tool cards have an actionable CTA button", async ({ page }) => {
		await mockAuthForTools(page);
		await loginAndGoToTools(page);

		// Each ToolCatalogCard has a .tool-catalog-card__cta button
		const ctaButton = page.locator(".tool-catalog-card__cta").first();
		await expect(ctaButton).toBeVisible({ timeout: 10_000 });
	});
});
