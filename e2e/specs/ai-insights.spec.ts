import { expect, test, type Page, type Route } from "@playwright/test";

import { fillLoginForm, seedCookieConsent, waitForHydration } from "../helpers/auth";

const loginSuccess = {
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

const overview = {
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

const insightItems = [
	{
		type: "orcamento_ultrapassado",
		dimension: "budgets",
		title: "Orçamento em atenção",
		message: "A categoria Mercado passou do limite planejado.",
	},
	{
		type: "savings_rate_gap",
		dimension: "general",
		title: "Taxa de poupança abaixo do plano",
		message: "Você precisa poupar mais 8% da renda para atingir o objetivo.",
	},
	{
		type: "gasto_elevado",
		dimension: "transactions",
		title: "Transações fora do padrão",
		message: "Há despesas acima do esperado neste período.",
	},
];

const generatedInsight = {
	success: true,
	message: "Insight financeiro gerado com sucesso",
	data: {
		summary: "Resumo do período.",
		items: insightItems,
		tokens_used: 320,
		cost_usd: 0.000048,
		period_type: "daily",
		period_label: "2026-05-18",
		period_start: "2026-05-18",
		period_end: "2026-05-18",
		model: "gpt-4o-mini",
		cached: false,
	},
};

const insightHistory = {
	success: true,
	message: "Histórico de insights carregado",
	data: {
		items: [{
			id: "ai-1",
			content: JSON.stringify({
				summary: "Resumo do período.",
				items: insightItems,
			}),
			items: insightItems,
			insight_type: "monthly",
			period_type: "monthly",
			period_label: "2026-05",
			period_start: "2026-05-01",
			period_end: "2026-05-31",
			model: "gpt-4o-mini",
			tokens_used: 320,
			cost_usd: 0.000048,
			created_at: "2026-05-12T08:15:00Z",
		}],
		page: 1,
		per_page: 20,
		total: 1,
	},
};

/**
 * Fulfils a route with JSON.
 *
 * @param route Playwright route.
 * @param payload JSON payload.
 */
const json = async (route: Route, payload: unknown): Promise<void> => {
	await route.fulfill({
		status: 200,
		contentType: "application/json",
		body: JSON.stringify(payload),
	});
};

/**
 * Registers deterministic auth and AI mocks for the insights scenarios.
 *
 * @param page Playwright page.
 */
const mockAuthenticatedInsights = async (page: Page): Promise<void> => {
	let sessionEstablished = false;
	await seedCookieConsent(page);

	await page.route("**/auth/refresh", async (route) => {
		if (!sessionEstablished) {
			await route.fulfill({
				status: 401,
				contentType: "application/json",
				body: JSON.stringify({ message: "Unauthorized" }),
			});
			return;
		}

		await json(route, { success: true, data: { token: "mock-access-token-refreshed" } });
	});

	await page.route("**/auth/login", async (route) => {
		sessionEstablished = true;
		await json(route, loginSuccess);
	});

	await page.route("**/user/me", async (route) => json(route, {
		id: "user-1",
		email: "test@auraxis.com",
		name: "Test User",
		subscription_plan: "premium",
	}));
	await page.route("**/dashboard/overview", async (route) => json(route, overview));
	await page.route("**/dashboard/trends", async (route) => json(route, { series: [] }));
	await page.route("**/entitlements/check**", async (route) => json(route, { has_access: true }));
	await page.route("**/me/consents", async (route) => json(route, {
		success: true,
		data: { items: [{ kind: "ai", action: "granted" }], total: 1 },
	}));
	await page.route("**/transactions**", async (route) => {
		if (route.request().resourceType() === "document") {
			await route.continue();
			return;
		}

		await json(route, { data: { transactions: [] } });
	});
	await page.route("**/tags**", async (route) => json(route, { data: { tags: [] } }));
	await page.route("**/accounts**", async (route) => json(route, { data: { accounts: [] } }));
	await page.route("**/credit-cards**", async (route) => json(route, { data: { credit_cards: [] } }));
	await page.route("**/goals", async (route) => json(route, { data: [] }));
	await page.route("**/ai/insights/generate", async (route) => json(route, generatedInsight));
	await page.route("**/ai/insights/history**", async (route) => json(route, insightHistory));
};

/**
 * Builds the local current date as YYYY-MM-DD (matches the panel's todayIso).
 *
 * @returns Today's date in ISO date form.
 */
const localTodayIso = (): string => {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

/**
 * Logs in with the MSW-backed premium test user.
 *
 * @param page Playwright page.
 */
const login = async (page: Page): Promise<void> => {
	await mockAuthenticatedInsights(page);
	await page.goto("/login");
	await waitForHydration(page);
	await fillLoginForm(page, "test@auraxis.com", "ValidPassword1!");
	await page.getByRole("button", { name: /entrar/i }).click();
	await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
};

/**
 * Opens the insights hub through the registered app link.
 *
 * Mobile keeps sidebar links outside the viewport until the menu is expanded, so
 * the test activates the route through the anchor element without depending on
 * the sidebar's visual state.
 *
 * @param page Playwright page.
 */
const openInsightsHub = async (page: Page): Promise<void> => {
	await page.locator("a[href=\"/insights\"]").first().evaluate((element) => {
		if (element instanceof HTMLElement) {
			element.click();
		}
	});
};

test.describe("AI Insights — surface slices", () => {
	test("transactions generates a global insight request and shows only transaction slice", async ({ page }) => {
		await login(page);

		// The transactions surface hides the inline result (PROD-13/#980) and shows
		// the insight via TransactionsInsightPanel, which renders today's insight
		// from /ai/insights/history. Seed a today-dated insight so the panel
		// surfaces the transaction slice (past insights live in a collapsed list).
		const todayIso = localTodayIso();
		await page.route("**/ai/insights/history**", async (route) => json(route, {
			success: true,
			message: "Histórico de insights carregado",
			data: {
				items: [{
					id: "ai-today",
					content: JSON.stringify({ summary: "Resumo do período.", items: insightItems }),
					items: insightItems,
					insight_type: "daily",
					period_type: "daily",
					period_label: todayIso,
					period_start: todayIso,
					period_end: todayIso,
					model: "gpt-4o-mini",
					tokens_used: 320,
					cost_usd: 0.000048,
					created_at: `${todayIso}T08:15:00Z`,
				}],
				page: 1,
				per_page: 20,
				total: 1,
			},
		}));

		await page.goto("/transactions");
		await waitForHydration(page);

		const generateRequest = page.waitForRequest(
			(req) => req.url().includes("/ai/insights/generate") && req.method() === "POST",
			{ timeout: 10_000 },
		);

		await page.getByRole("button", { name: /gerar insight com ia/i }).click();
		const request = await generateRequest;
		const payload = request.postDataJSON() as { source_surface?: string; timezone?: string; transactions?: unknown };

		expect(payload.source_surface).toBe("transactions");
		expect(typeof payload.timezone).toBe("string");
		expect(payload.transactions).toBeUndefined();
		await expect(page.getByText("Transações fora do padrão")).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText("Orçamento em atenção")).not.toBeVisible();
	});

	test("insights hub opens a monthly report from the deep link", async ({ page }) => {
		await login(page);
		await openInsightsHub(page);
		await expect(page).toHaveURL(/\/insights/, { timeout: 10_000 });
		await page.evaluate(() => {
			window.history.replaceState({}, "", "/insights?open=ai-1");
			window.dispatchEvent(new PopStateEvent("popstate"));
		});
		await waitForHydration(page);

		await expect(page.getByRole("heading", { name: "Insight de maio de 2026" })).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText("Resumo executivo")).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText("Resumo do período.")).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText("Orçamento em atenção")).toBeVisible({ timeout: 10_000 });
	});
});
