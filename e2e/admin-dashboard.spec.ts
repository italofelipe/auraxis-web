import { expect, test, type Page } from "@playwright/test";
import { fillLoginForm, seedCookieConsent, waitForHydration } from "./helpers/auth";

/**
 * E2E — Admin product-metrics dashboard (/admin, issue #1158).
 *
 * The FastAPI metrics endpoints are mocked with the exact contract payloads
 * the backend will expose, so the suite validates rendering, the
 * active-users proxy badge and the explicit error states.
 */

const VALID_EMAIL = "test@auraxis.com";
const VALID_PASSWORD = "ValidPassword1!";

const metricsOverview = {
  generated_at: "2026-07-24T18:00:00Z",
  cache: { hit: false, ttl_seconds: 300 },
  users: {
    total: 42,
    verified: 30,
    blocked: 1,
    new_7d: 3,
    new_30d: 9,
    active_7d: 12,
    active_30d: 25,
    active_source: "refresh_tokens_proxy",
  },
  premium: {
    subscriptions_active: 4,
    trials_active: 11,
    overrides_active: 3,
    entitled_users: 18,
    new_subscriptions_30d: 2,
    conversion_pct: 13.3,
  },
  ai: {
    calls_7d: 120,
    tokens_7d: 45000,
    cost_usd_7d: 1.23,
    cost_usd_mtd: 3.87,
    avg_latency_ms_7d: 900,
    active_users_7d: 8,
  },
  activity: {
    transactions_7d: 87,
    goal_contributions_7d: 5,
    goals_created_7d: 2,
    budgets_active: 6,
    simulations_7d: 4,
    insight_runs_7d: 9,
  },
};

const timeseriesByBlock: Record<string, Record<string, unknown>> = {
  users: {
    block: "users",
    interval: "day",
    points: [
      { date: "2026-07-01", signups: 2, active_users: 4 },
      { date: "2026-07-02", signups: 1, active_users: 5 },
      { date: "2026-07-03", signups: 0, active_users: 6 },
    ],
  },
  premium: {
    block: "premium",
    interval: "day",
    points: [
      { date: "2026-07-01", new_subscriptions: 1, overrides_granted: 0 },
      { date: "2026-07-02", new_subscriptions: 0, overrides_granted: 1 },
    ],
  },
  ai: {
    block: "ai",
    interval: "day",
    points: [
      { date: "2026-07-01", calls: 30, tokens: 11000, cost_usd: 0.31 },
      { date: "2026-07-02", calls: 45, tokens: 15000, cost_usd: 0.44 },
    ],
  },
  activity: {
    block: "activity",
    interval: "day",
    points: [
      { date: "2026-07-01", transactions: 10, goal_contributions: 1 },
      { date: "2026-07-02", transactions: 14, goal_contributions: 0 },
    ],
  },
};

const aiBreakdown = {
  by: "model",
  rows: [
    { key: "gpt-4o", calls: 100, tokens: 40000, cost_usd: 1.1, avg_latency_ms: 850 },
    { key: "gpt-4o-mini", calls: 20, tokens: 5000, cost_usd: 0.13, avg_latency_ms: 400 },
  ],
};

/**
 * Builds an unsigned JWT-like token so the frontend can read mocked claims.
 *
 * @param payload JWT payload claims.
 * @returns Token-shaped string.
 */
const tokenWithPayload = (payload: Record<string, unknown>): string => {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `header.${encodedPayload}.signature`;
};

/**
 * Registers the minimal authenticated-admin route mocks shared by every test.
 *
 * @param page Playwright page instance.
 */
const mockAdminSession = async (page: Page): Promise<void> => {
  const token = tokenWithPayload({ roles: ["admin"] });
  let sessionEstablished = false;

  await page.addInitScript(() => {
    const completedState = JSON.stringify({
      done: true,
      skipped: false,
      currentStep: 1,
      formData: {},
    });
    localStorage.setItem("auraxis:onboarding:test@auraxis.com", completedState);
    localStorage.setItem("auraxis:onboarding:user-1", completedState);
  });
  await seedCookieConsent(page);

  await page.route("**/auth/refresh", (route) => {
    if (!sessionEstablished) {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Unauthorized" }),
      });
      return;
    }
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { token } }),
    });
  });

  await page.route("**/auth/login", (route) => {
    sessionEstablished = true;
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "Authenticated",
        data: {
          token,
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

  await page.route("**/user/me", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "OK",
        data: {
          user: {
            id: "user-1",
            name: "Test User",
            email: VALID_EMAIL,
            gender: "outro",
            birth_date: "1990-01-01",
            monthly_income: 8_000,
            monthly_income_net: 7_000,
            net_worth: 35_000,
            monthly_expenses: 3_000,
            initial_investment: 5_000,
            monthly_investment: 1_000,
            investment_goal_date: "2030-01-01",
            state_uf: "SP",
            occupation: "Analista financeiro",
            investor_profile: "explorador",
            financial_objectives: "Organizar a vida financeira.",
            investor_profile_suggested: null,
            profile_quiz_score: null,
            taxonomy_version: null,
          },
        },
      }),
    });
  });

  await page.route("**/dashboard/overview**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        period: { key: "current_month", start: "2026-07-01", end: "2026-07-31", label: "julho 2026" },
        summary: { income: 0, expense: 0, balance: 0, upcoming_due_total: 0, net_worth: 0 },
        comparison: null,
        timeseries: [],
        expenses_by_category: [],
        upcoming_dues: [],
        goals: [],
        portfolio: { current_value: 0, change_percent: null },
        alerts: [],
      }),
    });
  });

  await page.route("**/dashboard/trends**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ series: [] }),
    });
  });

  await page.route("**/dashboard/survival-index", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        n_months: 0,
        total_assets: 0,
        avg_monthly_expense: 0,
        classification: "unknown",
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

  await page.route("**/wallet/entries**", (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });

  await page.route("**/transactions/due-range**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ transactions: [], total: 0 }),
    });
  });

  await page.route("**/v2/admin/session", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        source: "v1",
        user_id: "operator-1",
        email: VALID_EMAIL,
        is_admin: true,
      }),
    });
  });
};

/**
 * Registers happy-path mocks for the three metrics endpoints.
 *
 * @param page Playwright page instance.
 */
const mockMetricsEndpoints = async (page: Page): Promise<void> => {
  await page.route("**/v2/admin/metrics/overview", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(metricsOverview),
    });
  });

  await page.route("**/v2/admin/metrics/*/timeseries**", (route) => {
    const url = new URL(route.request().url());
    const block = url.pathname.split("/").at(-2) ?? "";
    const payload = timeseriesByBlock[block];

    route.fulfill({
      status: payload ? 200 : 404,
      contentType: "application/json",
      body: JSON.stringify(payload ?? { error: "NOT_FOUND" }),
    });
  });

  await page.route("**/v2/admin/metrics/ai/breakdown**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(aiBreakdown),
    });
  });
};

/**
 * Performs the mocked UI login flow and waits for the authenticated app.
 *
 * @param page Playwright page instance.
 */
const login = async (page: Page): Promise<void> => {
  await page.goto("/login");
  await waitForHydration(page);
  await fillLoginForm(page, VALID_EMAIL, VALID_PASSWORD);
  await page.getByRole("button", { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
};

test.describe("Admin — dashboard de métricas de produto", () => {
  test("renders the four blocks with the mocked contract numbers", async ({ page }) => {
    await mockAdminSession(page);
    await mockMetricsEndpoints(page);
    await login(page);

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible({
      timeout: 10_000,
    });

    const usersBlock = page.getByTestId("admin-metrics-users");
    await expect(usersBlock).toBeVisible();
    await expect(
      usersBlock.getByRole("heading", { name: "Usuários & crescimento" }),
    ).toBeVisible();
    await expect(usersBlock.getByText("Total de usuários")).toBeVisible();
    await expect(usersBlock.getByText("42", { exact: true })).toBeVisible();
    await expect(usersBlock.getByText("25", { exact: true })).toBeVisible();
    await expect(page.getByTestId("admin-metrics-active-proxy")).toContainText(
      "ativos ≈ por sessões (proxy)",
    );

    const premiumBlock = page.getByTestId("admin-metrics-premium");
    await expect(premiumBlock.getByRole("heading", { name: "Premium & conversão" })).toBeVisible();
    await expect(premiumBlock.getByText("Assinaturas ativas")).toBeVisible();
    await expect(premiumBlock.getByText("4", { exact: true })).toBeVisible();
    await expect(premiumBlock.getByText("13,3%")).toBeVisible();

    const aiBlock = page.getByTestId("admin-metrics-ai");
    await expect(aiBlock.getByRole("heading", { name: "Uso de IA & custo" })).toBeVisible();
    // Intl renders a non-breaking space between "US$" and the amount.
    await expect(aiBlock.getByText(/US\$\s3,87/)).toBeVisible();
    await expect(aiBlock.getByText(/US\$\s1,23/)).toBeVisible();
    await expect(aiBlock.getByText("120", { exact: true })).toBeVisible();
    await expect(page.getByTestId("admin-metrics-ai-breakdown")).toContainText("gpt-4o");

    const activityBlock = page.getByTestId("admin-metrics-activity");
    await expect(activityBlock.getByRole("heading", { name: "Atividade do produto" })).toBeVisible();
    await expect(activityBlock.getByText("Transações 7d")).toBeVisible();
    await expect(activityBlock.getByText("87", { exact: true })).toBeVisible();

    // ECharts renders lazily on the client — one canvas per block chart.
    await expect(usersBlock.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
    await expect(activityBlock.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
  });

  test("surfaces explicit error states when the metrics API fails", async ({ page }) => {
    await mockAdminSession(page);

    await page.route("**/v2/admin/metrics/overview", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "INTERNAL", message: "boom" }),
      });
    });
    await page.route("**/v2/admin/metrics/*/timeseries**", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "INTERNAL", message: "boom" }),
      });
    });
    await page.route("**/v2/admin/metrics/ai/breakdown**", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "INTERNAL", message: "boom" }),
      });
    });

    await login(page);
    await page.goto("/admin");

    // 5xx responses are retried twice with backoff before surfacing.
    await expect(page.getByTestId("admin-metrics-overview-error")).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page
        .getByTestId("admin-metrics-users")
        .getByText("Não foi possível carregar a série"),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByTestId("admin-metrics-overview-error").getByRole("button", {
        name: "Tentar novamente",
      }),
    ).toBeVisible();
  });
});
