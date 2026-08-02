import { test, expect, type Page } from "@playwright/test";
import { fillLoginForm, waitForHydration } from "../helpers/auth";

/**
 * E2E suite: Tools catalog (index) page.
 *
 * The /tools page requires authentication (middleware: ["authenticated"]).
 * Tool cards use ToolCatalogCard which renders NCard + NButton (not <a> links).
 */

/** Mirrors `MOBILE_BREAKPOINT` in `app/composables/useResponsiveShell`. */
const MOBILE_BREAKPOINT = 768;

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
 * Logs in via UI and reaches /tools the way a user does: by clicking the
 * sidebar link.
 *
 * The navigation has to stay client-side — the session token only lives in
 * Pinia memory, so a `page.goto` would boot a fresh app that renders the
 * public chrome instead of the app shell.
 *
 * What it must NOT do is drive the router from `page.evaluate`. Calling
 * `$router.push("/tools")` from outside the Nuxt app leaves the app wedged:
 * the URL and the `<title>` change (the page's setup runs) but `<NuxtPage>`
 * keeps the previous page mounted forever. `/tools` declares
 * `layout: false` and renders its own `<NuxtLayout>`, and NuxtPage holds the
 * old vnode while the mounted layout does not match the incoming route's
 * layout. Driven from `page.evaluate` that hand-off never completes — the
 * dashboard stays on screen with the URL already on `/tools`, which is
 * exactly the "element(s) not found with the right URL" signature of #1277.
 * A NuxtLink click goes through the same client-side navigation and renders
 * the catalog every time.
 *
 * @param page - Playwright page instance.
 */
const loginAndGoToTools = async (page: Page): Promise<void> => {
	await page.goto("/login");
	await waitForHydration(page);
	await fillLoginForm(page, "test@auraxis.com", "ValidPassword1!");
	await page.getByRole("button", { name: /entrar/i }).click();
	await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

	// Under 768px (`MOBILE_BREAKPOINT` in useResponsiveShell) the shell turns
	// the sidebar into a drawer parked off-canvas at `left: -width`: the link
	// is in the DOM and reported visible, but every click retries forever with
	// "element is outside of the viewport". Open the drawer first. Deciding by
	// viewport width instead of probing for the button keeps this deterministic
	// — `isMobile` is only computed on mount, so a probe races the shell.
	const viewportWidth = page.viewportSize()?.width ?? MOBILE_BREAKPOINT;
	if (viewportWidth < MOBILE_BREAKPOINT) {
		await page.getByRole("button", { name: /abrir menu/i }).click();
	}

	await page
		.locator("#ui-app-shell-nav")
		.getByRole("link", { name: /ferramentas/i })
		.click();
	await expect(page).toHaveURL(/\/tools/, { timeout: 15_000 });

	// Espera conteúdo, não navegação: a URL muda antes de a rota montar, e
	// `waitForHydration` não diz nada aqui — `#__nuxt` já tem `__vue_app__`
	// desde o /login. O heading é o marcador de que a rota /tools renderizou;
	// os cards ficam para os testes assertarem, para uma falha de renderização
	// do catálogo continuar aparecendo onde ela é.
	await expect(page.locator(".tools-page__h1")).toBeVisible({ timeout: 15_000 });
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
