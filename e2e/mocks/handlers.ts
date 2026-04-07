import { http, HttpResponse } from "msw";

/**
 * Mock data for a successful login response.
 * Mirrors the real API contract from auraxis-api /auth/login.
 */
const MOCK_AUTH_LOGIN_SUCCESS = {
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
 * Mock data for the current authenticated user.
 */
const MOCK_USER_ME = {
	id: "user-1",
	email: "test@auraxis.com",
	name: "Test User",
	subscription_plan: "free",
};

/**
 * Mock data for the dashboard overview endpoint.
 */
const MOCK_DASHBOARD_OVERVIEW = {
	income: 10000,
	expense: 4000,
	balance: 6000,
	netWorth: 50000,
	goals: [],
	alerts: [],
	upcomingDues: [],
	expensesByCategory: [],
	comparison: null,
	portfolio: {
		currentValue: 25000,
		costBasis: 20000,
	},
};

/**
 * Mock data for the dashboard trends endpoint.
 */
const MOCK_DASHBOARD_TRENDS = {
	series: [
		{ month: "2025-11", income: 8000, expenses: 3500, balance: 4500 },
		{ month: "2025-12", income: 10000, expenses: 4000, balance: 6000 },
	],
};

/**
 * Mock data for the wallet endpoint.
 */
const MOCK_WALLET = {
	data: {
		entries: [
			{
				id: "w-1",
				name: "PETR4",
				ticker: "PETR4",
				quantity: 100,
				current_value: 2800,
				cost_basis: 2500,
				register_date: "2024-01-15",
				change_percent: 12.0,
				asset_type: "stock",
			},
		],
	},
};

/**
 * Mock data for the goals endpoint.
 */
const MOCK_GOALS = {
	data: {
		goals: [
			{
				id: "g-1",
				name: "Reserva de emergência",
				progressPercent: 65,
				currentAmount: 13000,
				targetAmount: 20000,
				targetDate: "2026-12-31",
			},
		],
	},
};

/**
 * Mock data for the transactions endpoint.
 */
const MOCK_TRANSACTIONS = {
	data: {
		transactions: [
			{
				id: "tx-1",
				title: "Salário",
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
			},
		],
	},
};

/**
 * MSW request handlers for all mocked API endpoints used in E2E tests.
 *
 * Uses MSW v2 `http` + `HttpResponse` syntax. Handlers intercept requests
 * at the Node level (no service worker needed) via `setupServer` in
 * `e2e/mocks/server.ts`.
 *
 * To add a new mock: append a new `http.<method>()` entry here and re-export
 * it. The server picks up changes automatically since it spreads `handlers`.
 */
export const handlers = [
	/**
	 * POST /auth/login — returns tokens on valid credentials, 401 otherwise.
	 */
	http.post("*/auth/login", async ({ request }) => {
		const body = await request.json() as Record<string, unknown>;
		const email = body["email"] ?? body["username"];
		const password = body["password"];

		if (email === "test@auraxis.com" && password === "ValidPassword1!") {
			return HttpResponse.json(MOCK_AUTH_LOGIN_SUCCESS, { status: 200 });
		}

		return HttpResponse.json(
			{ message: "Credenciais inválidas. Verifique seu e-mail e senha." },
			{ status: 401 },
		);
	}),

	/**
	 * POST /auth/register — always returns 201 success.
	 */
	http.post("*/auth/register", () => {
		return HttpResponse.json(
			{ message: "User created successfully" },
			{ status: 201 },
		);
	}),

	/**
	 * POST /auth/refresh — returns a fresh token.
	 */
	http.post("*/auth/refresh", () => {
		return HttpResponse.json(
			{
				data: {
					token: "mock-access-token-refreshed",
					refresh_token: "mock-refresh-token-refreshed",
				},
			},
			{ status: 200 },
		);
	}),

	/**
	 * GET /user/me — returns the mock authenticated user profile.
	 */
	http.get("*/user/me", () => {
		return HttpResponse.json(MOCK_USER_ME, { status: 200 });
	}),

	/**
	 * GET /dashboard/overview — returns summary financials.
	 */
	http.get("*/dashboard/overview", () => {
		return HttpResponse.json(MOCK_DASHBOARD_OVERVIEW, { status: 200 });
	}),

	/**
	 * GET /dashboard/trends — returns monthly income/expense series.
	 */
	http.get("*/dashboard/trends", () => {
		return HttpResponse.json(MOCK_DASHBOARD_TRENDS, { status: 200 });
	}),

	/**
	 * GET /wallet — returns the mock investment portfolio.
	 */
	http.get("*/wallet", () => {
		return HttpResponse.json(MOCK_WALLET, { status: 200 });
	}),

	/**
	 * GET /goals — returns the mock financial goals list.
	 */
	http.get("*/goals", () => {
		return HttpResponse.json(MOCK_GOALS, { status: 200 });
	}),

	/**
	 * GET /transactions — returns the mock transaction list.
	 */
	http.get("*/transactions", () => {
		return HttpResponse.json(MOCK_TRANSACTIONS, { status: 200 });
	}),
];
