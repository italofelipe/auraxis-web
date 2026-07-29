import { test, expect, type Page } from "@playwright/test";
import { fillLoginForm, waitForHydration } from "../helpers/auth";

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
	// Tracks whether POST /auth/login has succeeded. The session-restore plugin
	// calls POST /auth/refresh on every full page load (split-token pattern, SEC-GAP-01):
	// before login the refresh cookie doesn't exist → 401; after login the cookie
	// is set by the server → 200 (simulated here so page.goto("/goals") re-authenticates).
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

	await page.route("**/entitlements/check**", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ has_access: true }),
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
	await fillLoginForm(page, "test@auraxis.com", "ValidPassword1!");
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

		const goalsList = page.getByLabel("Lista de metas");
		const selectedGoalPanel = page.getByLabel("Detalhe da meta selecionada");

		await expect(
			goalsList.getByRole("button", { name: /Reserva de emergência/ }),
		).toBeVisible({ timeout: 10_000 });
		await expect(
			selectedGoalPanel.getByRole("heading", {
				name: "Reserva de emergência",
				exact: true,
			}),
		).toBeVisible({ timeout: 10_000 });
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

/**
 * Widths that used to break the hub, plus the usual device sizes.
 *
 * The old layout had a single breakpoint at 1180px of *viewport*, but the
 * sidebar eats ~290px, so between roughly 800px and 1520px the detail panel
 * overlapped the goal list instead of stacking below it.
 */
const RESPONSIVE_WIDTHS = [360, 768, 1024, 1280, 1400, 1520, 1920];

test.describe("Goals — layout responsivo", () => {
	test("não transborda nem sobrepõe em nenhuma largura", async ({ page }) => {
		// Login, navegação e uma medição por largura não cabem no timeout padrão.
		test.slow();
		await mockAuthAndGoals(page);
		await loginAndGoToGoals(page);
		await expect(page.getByLabel("Lista de metas")).toBeVisible({ timeout: 10_000 });

		for (const width of RESPONSIVE_WIDTHS) {
			await page.setViewportSize({ width, height: 900 });
			// Dá tempo de o container query reavaliar antes de medir.
			await page.waitForTimeout(200);

			const issues = await page.evaluate(() => {
				const found: string[] = [];
				const TOLERANCE = 1; // arredondamento de subpixel

				// Conteúdo mais largo que a própria caixa. É o sintoma real: a
				// linha da meta cabe em si mesma, mas a LISTA não a comporta, e o
				// excedente termina debaixo do painel.
				const containers: Array<[string, string]> = [
					[".goals-hub__goal-list", "lista de metas"],
					[".goals-hub__detail-panel", "painel de detalhe"],
					[".goals-hub__review-grid", "grade lista+painel"],
					[".goals-hub__metrics", "faixa de KPIs"],
					[".detail-panel__facts", "grade de fatos"],
					[".detail-panel__actions", "barra de ações"],
					[".goal-row", "linha da meta"],
				];

				for (const [selector, label] of containers) {
					document.querySelectorAll(selector).forEach((element) => {
						if (element.scrollWidth > element.clientWidth + TOLERANCE) {
							found.push(`${label} transborda ${element.scrollWidth - element.clientWidth}px`);
						}
					});
				}

				/**
				 * Registra filhos que ultrapassam a borda do pai.
				 *
				 * @param parentSel - Seletor do contêiner.
				 * @param childSel - Seletor dos filhos avaliados.
				 * @param label - Nome legível usado na mensagem de falha.
				 */
				const escapes = (parentSel: string, childSel: string, label: string): void => {
					document.querySelectorAll(parentSel).forEach((parent) => {
						const parentBox = parent.getBoundingClientRect();
						parent.querySelectorAll(childSel).forEach((child) => {
							const childBox = child.getBoundingClientRect();
							if (childBox.width === 0) { return; }
							if (
								childBox.right > parentBox.right + TOLERANCE
								|| childBox.left < parentBox.left - TOLERANCE
							) {
								found.push(`${label} vaza da caixa do pai`);
							}
						});
					});
				};

				escapes(".goals-hub__goal-list", ".goal-row", "linha da meta");
				escapes(".goals-hub__detail-panel", ".detail-panel__actions .n-button", "botão do painel");
				escapes(".goals-hub__detail-panel", ".detail-panel__facts > article", "card de fato");
				escapes(".goals-hub__metrics", ".goals-hub__metric", "card de KPI");

				if (document.documentElement.scrollWidth > window.innerWidth + TOLERANCE) {
					found.push("a página rola horizontalmente");
				}

				return [...new Set(found)];
			});

			expect(issues, `quebras em ${width}px`).toEqual([]);
		}
	});
});
