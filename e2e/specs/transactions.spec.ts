import { test, expect, type Page, type Route } from "@playwright/test";
import { waitForHydration } from "../helpers/auth";

/**
 * E2E suite: Transactions — MSW-backed CRUD + restore flow.
 *
 * Mirrors the auth/dashboard mock pattern from dashboard.spec.ts so the
 * app lands cleanly on /dashboard before navigating to /transactions.
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

interface MockTransaction {
	id: string;
	title: string;
	amount: string;
	type: "income" | "expense";
	due_date: string;
	status: string;
	is_recurring: boolean;
	is_installment: boolean;
	installment_count: number | null;
	currency: string;
	description: string | null;
	observation: string | null;
	start_date: string | null;
	end_date: string | null;
	tag_id: string | null;
	account_id: string | null;
	credit_card_id: string | null;
	installment_group_id: string | null;
	paid_at: string | null;
	created_at: string;
	updated_at: string;
}

/**
 * Builds a minimal transaction mock record.
 *
 * @param overrides Partial overrides applied to the default fixture.
 * @returns Mock transaction payload matching the backend envelope shape.
 */
const makeTx = (overrides: Partial<MockTransaction> = {}): MockTransaction => ({
	id: "tx-1",
	title: "Salário Mensal",
	amount: "10000.00",
	type: "income",
	due_date: "2025-12-01",
	status: "paid",
	is_recurring: false,
	is_installment: false,
	installment_count: null,
	currency: "BRL",
	description: null,
	observation: null,
	start_date: null,
	end_date: null,
	tag_id: null,
	account_id: null,
	credit_card_id: null,
	installment_group_id: null,
	paid_at: "2025-12-01",
	created_at: "2025-12-01T10:00:00Z",
	updated_at: "2025-12-01T10:00:00Z",
	...overrides,
});

/** In-memory transaction store mutated by route handlers to simulate CRUD. */
interface TxStore {
	active: MockTransaction[];
	deleted: MockTransaction[];
}

/**
 * Fulfils a JSON response on the given route with the envelope `{ data: payload }`.
 *
 * @param route - Playwright route to fulfil.
 * @param status - HTTP status code.
 * @param payload - Object placed under the `data` key.
 */
const fulfillJson = async (route: Route, status: number, payload: unknown): Promise<void> => {
	await route.fulfill({
		status,
		contentType: "application/json",
		body: JSON.stringify({ data: payload }),
	});
};

/**
 * Handles `PATCH /transactions/restore/:id` — moves a transaction from deleted back to active.
 *
 * @param route - Playwright route to fulfil.
 * @param store - Live CRUD store.
 * @param id - Target transaction id.
 */
const handleRestore = async (route: Route, store: TxStore, id: string): Promise<void> => {
	const target = store.deleted.find((t) => t.id === id);
	if (target) {
		store.deleted = store.deleted.filter((t) => t.id !== id);
		store.active.push(target);
	}
	await fulfillJson(route, 200, { transaction: target ?? null });
};

/**
 * Handles `DELETE /transactions/:id` — soft-deletes the transaction.
 *
 * @param route - Playwright route to fulfil.
 * @param store - Live CRUD store.
 * @param id - Target transaction id.
 */
const handleDelete = async (route: Route, store: TxStore, id: string): Promise<void> => {
	const target = store.active.find((t) => t.id === id);
	if (target) {
		store.active = store.active.filter((t) => t.id !== id);
		store.deleted.push(target);
	}
	await route.fulfill({ status: 204, body: "" });
};

/**
 * Handles `PATCH /transactions/:id` — applies a partial update to an active transaction.
 *
 * @param route - Playwright route to fulfil.
 * @param store - Live CRUD store.
 * @param id - Target transaction id.
 */
const handlePatch = async (route: Route, store: TxStore, id: string): Promise<void> => {
	const body = route.request().postDataJSON() as Partial<MockTransaction>;
	const idx = store.active.findIndex((t) => t.id === id);
	if (idx >= 0) {
		store.active[idx] = { ...store.active[idx], ...body, id };
	}
	await fulfillJson(route, 200, { transaction: idx >= 0 ? store.active[idx] : null });
};

/**
 * Handles `POST /transactions` — creates a new active transaction from the request body.
 *
 * @param route - Playwright route to fulfil.
 * @param store - Live CRUD store.
 */
const handleCreate = async (route: Route, store: TxStore): Promise<void> => {
	const body = route.request().postDataJSON() as Partial<MockTransaction>;
	const newTx = makeTx({
		id: `tx-${Date.now()}`,
		title: body.title ?? "New",
		amount: body.amount ?? "0.00",
		type: body.type ?? "expense",
		due_date: body.due_date ?? "2025-12-15",
		status: "pending",
		paid_at: null,
	});
	store.active.push(newTx);
	await fulfillJson(route, 201, { transactions: [newTx] });
};

/**
 * Dispatches any `/transactions*` request to the matching CRUD handler.
 *
 * @param route - Playwright route to fulfil.
 * @param store - Live CRUD store.
 */
const handleTransactionsRoute = async (route: Route, store: TxStore): Promise<void> => {
	if (route.request().resourceType() === "document") {
		await route.continue();
		return;
	}

	const method = route.request().method();
	const path = new URL(route.request().url()).pathname;

	if (path.endsWith("/transactions/deleted") && method === "GET") {
		await fulfillJson(route, 200, { transactions: store.deleted });
		return;
	}

	const restoreMatch = path.match(/\/transactions\/restore\/([^/]+)$/);
	if (restoreMatch && method === "PATCH") {
		await handleRestore(route, store, restoreMatch[1] ?? "");
		return;
	}

	const idMatch = path.match(/\/transactions\/([^/]+)$/);
	if (idMatch && method === "DELETE") {
		await handleDelete(route, store, idMatch[1] ?? "");
		return;
	}
	if (idMatch && method === "PATCH") {
		await handlePatch(route, store, idMatch[1] ?? "");
		return;
	}

	if (path.endsWith("/transactions") && method === "POST") {
		await handleCreate(route, store);
		return;
	}

	if (method === "GET") {
		await fulfillJson(route, 200, { transactions: store.active });
		return;
	}

	await route.continue();
};

/**
 * Sets up all route mocks needed for an authenticated transactions session.
 * Returns a live store that tracks active and soft-deleted transactions so
 * tests can assert on state mutations (create/delete/restore).
 *
 * @param page - Playwright page instance.
 * @returns The mutable transaction store.
 */
const mockAuthAndTransactions = async (page: Page): Promise<TxStore> => {
	const store: TxStore = {
		active: [makeTx()],
		deleted: [],
	};

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

	await page.route("**/transactions**", (route: Route) =>
		handleTransactionsRoute(route, store),
	);

	await page.route("**/tags**", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ data: { tags: [] } }),
		});
	});

	await page.route("**/accounts**", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ data: { accounts: [] } }),
		});
	});

	await page.route("**/credit-cards**", (route) => {
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ data: { credit_cards: [] } }),
		});
	});

	return store;
};

/**
 * Logs in and navigates to the transactions page.
 *
 * @param page - Playwright page instance.
 */
const loginAndGoToTransactions = async (page: Page): Promise<void> => {
	await page.goto("/login");
	await waitForHydration(page);
	await page.locator("#login-email").fill("test@auraxis.com");
	await page.locator("#login-password").fill("ValidPassword1!");
	await page.getByRole("button", { name: /entrar/i }).click();

	await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
	await page.goto("/transactions");
	await expect(page).toHaveURL(/\/transactions/);
	await waitForHydration(page);
};

test.describe("Transactions — MSW-backed flows", () => {
	test("transactions page loads after login", async ({ page }) => {
		await mockAuthAndTransactions(page);
		await loginAndGoToTransactions(page);

		await expect(page.locator("main, [role='main']")).toBeVisible({ timeout: 10_000 });
	});

	test("page has Nova Receita and Nova Despesa action buttons", async ({ page }) => {
		await mockAuthAndTransactions(page);
		await loginAndGoToTransactions(page);

		await expect(page.getByRole("button", { name: /nova receita/i })).toBeVisible({
			timeout: 10_000,
		});
		await expect(page.getByRole("button", { name: /nova despesa/i })).toBeVisible({
			timeout: 10_000,
		});
	});

	test("transaction table renders mocked row", async ({ page }) => {
		await mockAuthAndTransactions(page);
		await loginAndGoToTransactions(page);

		await expect(page.getByText("Salário Mensal")).toBeVisible({ timeout: 10_000 });
	});

	test("clicking Nova Receita opens the income form modal", async ({ page }) => {
		await mockAuthAndTransactions(page);
		await loginAndGoToTransactions(page);

		await page.getByRole("button", { name: /nova receita/i }).click();

		await expect(
			page.getByRole("dialog").getByText(/nova receita/i).first(),
		).toBeVisible({ timeout: 5_000 });
	});

	test("clicking Nova Despesa opens the expense form modal", async ({ page }) => {
		await mockAuthAndTransactions(page);
		await loginAndGoToTransactions(page);

		await page.getByRole("button", { name: /nova despesa/i }).click();

		await expect(
			page.getByRole("dialog").getByText(/nova despesa/i).first(),
		).toBeVisible({ timeout: 5_000 });
	});

	test("clicking edit on a row opens the edit modal", async ({ page }) => {
		await mockAuthAndTransactions(page);
		await loginAndGoToTransactions(page);

		await expect(page.getByText("Salário Mensal")).toBeVisible({ timeout: 10_000 });
		await page.getByRole("button", { name: /^editar$/i }).first().click();

		await expect(page.getByRole("dialog").first()).toBeVisible({ timeout: 5_000 });
	});

	test("duplicating a row triggers POST /transactions and shows the copy", async ({ page }) => {
		const store = await mockAuthAndTransactions(page);
		await loginAndGoToTransactions(page);

		await expect(page.getByText("Salário Mensal")).toBeVisible({ timeout: 10_000 });

		const postRequest = page.waitForRequest(
			(req) => req.url().includes("/transactions") && req.method() === "POST",
			{ timeout: 10_000 },
		);
		await page.getByRole("button", { name: /^duplicar$/i }).first().click();
		await postRequest;

		await expect.poll(() => store.active.length, { timeout: 5_000 }).toBeGreaterThan(1);
	});

	test("deleting a row asks for confirmation then calls DELETE", async ({ page }) => {
		const store = await mockAuthAndTransactions(page);
		await loginAndGoToTransactions(page);

		await expect(page.getByText("Salário Mensal")).toBeVisible({ timeout: 10_000 });

		await page.getByRole("button", { name: /^excluir$/i }).first().click();

		const deleteRequest = page.waitForRequest(
			(req) => req.url().includes("/transactions/tx-1") && req.method() === "DELETE",
			{ timeout: 10_000 },
		);
		await page
			.getByRole("dialog")
			.getByRole("button", { name: /^excluir$/i })
			.click();
		await deleteRequest;

		await expect.poll(() => store.active.length, { timeout: 5_000 }).toBe(0);
		await expect.poll(() => store.deleted.length, { timeout: 5_000 }).toBe(1);
	});

	test("trash page lists soft-deleted transactions and restores them", async ({ page }) => {
		const store = await mockAuthAndTransactions(page);
		// Pre-populate the trash so we can focus the scenario on the restore flow.
		store.deleted.push(makeTx({ id: "tx-trashed", title: "Mercado", amount: "120.00", type: "expense" }));
		store.active = [];

		await loginAndGoToTransactions(page);
		await page.getByRole("button", { name: /lixeira/i }).click();
		await expect(page).toHaveURL(/\/transactions\/trash/, { timeout: 10_000 });

		await expect(page.getByText("Mercado")).toBeVisible({ timeout: 10_000 });

		const restoreRequest = page.waitForRequest(
			(req) => req.url().includes("/transactions/restore/tx-trashed") && req.method() === "PATCH",
			{ timeout: 10_000 },
		);
		await page.getByRole("button", { name: /^restaurar$/i }).first().click();
		await page
			.getByRole("dialog")
			.getByRole("button", { name: /^restaurar$/i })
			.click();
		await restoreRequest;

		await expect.poll(() => store.deleted.length, { timeout: 5_000 }).toBe(0);
		await expect.poll(() => store.active.length, { timeout: 5_000 }).toBe(1);
	});
});
