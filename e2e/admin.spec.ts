import { expect, test, type Page } from "@playwright/test";
import { fillLoginForm, seedCookieConsent, waitForHydration } from "./helpers/auth";

const VALID_EMAIL = "test@auraxis.com";
const VALID_PASSWORD = "ValidPassword1!";

interface MockAdminEntitlement {
  id: string;
  feature_key: string;
  label: string;
  active: boolean;
  granted_at: string;
  expires_at: string | null;
}

interface MockAdminAuditEvent {
  id: string;
  action: string;
  status?: string;
  actor?: string;
  reason: string;
  created_at: string;
}

interface MockAdminAIInsight {
  id: string;
  user_id: string;
  user_email: string;
  period_label: string;
  status: string;
  model: string;
  tokens_used: number;
  cost_usd: number;
  latency_ms: number;
  consent_status: string;
  evidence_count: number;
  risk_level: string;
  data_quality: string;
  created_at: string;
  summary?: string;
  prompt_template_version?: string;
  snapshot_hash?: string;
  redacted_evidence?: string[];
  audit_events?: Array<{
    id: string;
    action: string;
    actor_email: string;
    created_at: string;
  }>;
}

interface MockAdminFeatureFlag {
  key: string;
  owner: string;
  type: string;
  status: string;
  description: string;
  remove_by: string;
  repositories: string[];
  updated_at: string;
}

const initialAdminEntitlements: MockAdminEntitlement[] = [
  {
    id: "ent-ai",
    feature_key: "ai_insights",
    label: "Insights com IA",
    active: true,
    granted_at: "2026-05-16T17:08:02Z",
    expires_at: null,
  },
];

const initialAdminAuditEvents: MockAdminAuditEvent[] = [
  {
    id: "audit-seed",
    action: "entitlement.granted",
    reason: "Seed de usuário premium",
    created_at: "2026-05-16T17:09:00Z",
  },
];

const adminUsers = [
  {
    id: "admin-user-1",
    name: "Ana Premium",
    email: "ana@auraxis.com",
    status: "active",
    created_at: "2026-05-01T10:00:00Z",
    last_seen_at: "2026-05-19T12:00:00Z",
    subscription: {
      plan_code: "premium",
      status: "active",
      billing_cycle: "annual",
      current_period_end: "2036-05-16T17:08:02Z",
    },
    entitlements_count: 1,
  },
  {
    id: "admin-user-2",
    name: "Bruno Free",
    email: "bruno@auraxis.com",
    status: "active",
    created_at: "2026-04-20T10:00:00Z",
    last_seen_at: null,
    subscription: {
      plan_code: "free",
      status: "free",
      billing_cycle: null,
      current_period_end: null,
    },
    entitlements_count: 0,
  },
];

interface MockAdminUserState {
  blocked: boolean;
  premiumOverride: boolean;
}

/**
 * Maps a legacy test fixture into the FastAPI unified-user contract.
 *
 * @param user Legacy fixture.
 * @param state Mutable control-plane state.
 * @returns FastAPI user payload.
 */
const toUnifiedAdminUser = (
  user: (typeof adminUsers)[number],
  state: MockAdminUserState,
): Record<string, unknown> => ({
  source: "v1",
  user_id: user.id,
  email: user.email,
  blocked: user.id === "admin-user-1" ? state.blocked : false,
  premium:
    user.subscription.plan_code === "premium" ||
    (user.id === "admin-user-1" && state.premiumOverride),
  identities: [
    {
      source: "v1",
      user_id: user.id,
      email: user.email,
      email_verified: true,
      auth_methods: ["password"],
      created_at: user.created_at,
      last_login_at: user.last_seen_at,
      blocked_at: user.id === "admin-user-1" && state.blocked ? "2026-07-20T12:00:00Z" : null,
      blocked_reason:
        user.id === "admin-user-1" && state.blocked ? "Bloqueio operacional validado" : null,
      blocked_by: state.blocked ? "v1/operator-1" : null,
      subscription_status: user.subscription.status,
      premium_override_active: user.id === "admin-user-1" && state.premiumOverride,
      premium_override_expires_at: null,
    },
  ],
});

/**
 * Applies one mocked control-plane action and returns its audit type.
 *
 * @param action REST action suffix.
 * @param state Mutable test state.
 * @returns Persisted action type.
 */
const applyMockAdminAction = (action: string, state: MockAdminUserState): string => {
  switch (action) {
    case "block":
      state.blocked = true;
      return "block";
    case "unblock":
      state.blocked = false;
      return "unblock";
    case "premium-override":
      state.premiumOverride = true;
      return "premium_override";
    case "premium-override/revoke":
      state.premiumOverride = false;
      return "premium_override_revoke";
    default:
      throw new Error(`Unsupported mock admin action: ${action}`);
  }
};

const adminInsights: MockAdminAIInsight[] = [
  {
    id: "insight-1",
    user_id: "admin-user-1",
    user_email: "ana@auraxis.com",
    period_label: "Maio de 2026",
    status: "generated",
    model: "gpt-5.4",
    tokens_used: 2480,
    cost_usd: 0.86,
    latency_ms: 910,
    consent_status: "granted",
    evidence_count: 2,
    risk_level: "medium",
    data_quality: "boa",
    created_at: "2026-05-19T12:00:00Z",
    summary: "Despesas fixas concentraram a maior parte do orçamento do período.",
    prompt_template_version: "ai-insights-v3",
    snapshot_hash: "sha256:admin-insight-1",
    redacted_evidence: [
      "Categoria [redigida] representou 41% das saídas.",
      "Saldo projetado ficou negativo em 2 cenários.",
    ],
    audit_events: [
      {
        id: "audit-insight-1",
        action: "ai.insight.generated",
        actor_email: "system@auraxis.com",
        created_at: "2026-05-19T12:01:00Z",
      },
    ],
  },
];

const adminFeatureFlags: MockAdminFeatureFlag[] = [
  {
    key: "web.pages.insights",
    owner: "growth",
    type: "release",
    status: "enabled-prod",
    description: "Página de histórico de insights financeiros gerados por IA.",
    remove_by: "2027-12-31",
    repositories: ["auraxis-web"],
    updated_at: "2026-05-19T12:00:00Z",
  },
  {
    key: "web.admin.feature-flag-mutations",
    owner: "platform",
    type: "release",
    status: "enabled-prod",
    description: "Mutação auditável de feature flags no admin.",
    remove_by: "2027-12-31",
    repositories: ["auraxis-web"],
    updated_at: "2026-05-19T12:00:00Z",
  },
];

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
 * Registers MSW-style route mocks for admin and non-admin browser sessions.
 *
 * @param page Playwright page instance.
 * @param options Session role options.
 * @param options.isAdmin Whether the mocked session should include admin claims.
 */
// eslint-disable-next-line max-lines-per-function -- Keeping admin route mocks together avoids cross-test shared state.
const mockAdminSession = async (page: Page, options: { isAdmin: boolean }): Promise<void> => {
  const token = tokenWithPayload({ roles: options.isAdmin ? ["admin"] : ["user"] });
  let sessionEstablished = false;
  const adminUserState: MockAdminUserState = {
    blocked: false,
    premiumOverride: false,
  };
  const adminEntitlements = initialAdminEntitlements.map((entitlement) => ({ ...entitlement }));
  const adminAuditEvents = initialAdminAuditEvents.map((event) => ({ ...event }));

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
            financial_objectives: "Organizar a vida financeira e acompanhar indicadores.",
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
        period: {
          key: "current_month",
          start: "2026-05-01",
          end: "2026-05-31",
          label: "maio 2026",
        },
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
      status: options.isAdmin ? 200 : 403,
      contentType: "application/json",
      body: JSON.stringify(
        options.isAdmin
          ? { source: "v1", user_id: "operator-1", email: VALID_EMAIL, is_admin: true }
          : { error: "FORBIDDEN", message: "Access denied." },
      ),
    });
  });

  // Legacy read-only impersonation still uses the v1 admin search contract.
  // Register it before the more specific v2 route so Playwright's LIFO routing
  // keeps the unified user backoffice on FastAPI.
  await page.route("**/admin/users**", (route) => {
    if (route.request().resourceType() === "document") {
      route.fallback();
      return;
    }

    const url = new URL(route.request().url());
    if (url.pathname.startsWith("/v2/admin/users")) {
      route.fallback();
      return;
    }
    const query = url.searchParams.get("q")?.toLowerCase() ?? "";
    const users = adminUsers.filter((user) =>
      [user.id, user.name, user.email].some((value) => value.toLowerCase().includes(query)),
    );
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { users } }),
    });
  });

  await page.route("**/v2/admin/users**", async (route) => {
    if (route.request().resourceType() === "document") {
      await route.fallback();
      return;
    }

    const url = new URL(route.request().url());
    const pathParts = url.pathname.split("/").filter(Boolean);
    const usersIndex = pathParts.indexOf("users");
    const source = pathParts[usersIndex + 1];
    const userId = pathParts[usersIndex + 2];
    const action = pathParts.slice(usersIndex + 3).join("/");

    if (route.request().method() === "POST" && userId && action) {
      const body = JSON.parse(route.request().postData() ?? "{}") as {
        reason?: string;
      };
      if (!body.reason || body.reason.length < 8) {
        await route.fulfill({ status: 422, body: "{}" });
        return;
      }
      const actionType = applyMockAdminAction(action, adminUserState);
      const actionId = `action-${actionType}`;
      adminAuditEvents.unshift({
        id: actionId,
        action: actionType,
        status: "applied",
        actor: "v1/operator-1",
        reason: body.reason,
        created_at: "2026-07-20T12:01:00Z",
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: actionId,
          action_type: actionType,
          status: "applied",
          actor: "v1/operator-1",
          target: `${source}/${userId}`,
          reason: body.reason,
          created_at: "2026-07-20T12:01:00Z",
        }),
      });
      return;
    }

    if (source && userId) {
      const user = adminUsers.find((item) => item.id === userId);
      route.fulfill({
        status: user ? 200 : 404,
        contentType: "application/json",
        body: JSON.stringify(
          user
            ? {
                ...toUnifiedAdminUser(user, adminUserState),
                recent_actions: adminAuditEvents.map((event) => ({
                  id: event.id,
                  action_type: event.action,
                  status: event.status ?? "applied",
                  actor: event.actor ?? "v1/operator-1",
                  reason: event.reason,
                  created_at: event.created_at,
                })),
              }
            : { error: "NOT_FOUND" },
        ),
      });
      return;
    }

    const query = url.searchParams.get("q")?.toLowerCase() ?? "";
    const filteredUsers = adminUsers
      .filter((user) => {
        if (!query) {
          return true;
        }

        return [user.id, user.name, user.email].some((value) =>
          value.toLowerCase().includes(query),
        );
      })
      .map((user) => toUnifiedAdminUser(user, adminUserState));

    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: filteredUsers, next_cursor: null }),
    });
  });

  await page.route("**/entitlements/admin", async (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}") as Record<string, string>;

    if (!body.reason || body.reason.length < 8 || !body.user_id || !body.feature_key) {
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Invalid entitlement grant" }),
      });
      return;
    }

    adminEntitlements.push({
      id: "ent-market",
      feature_key: body.feature_key,
      label: "Market Pulse",
      active: true,
      granted_at: "2026-05-19T12:30:00Z",
      expires_at: null,
    });
    adminAuditEvents.unshift({
      id: "audit-grant-1",
      action: "entitlement.granted",
      reason: body.reason,
      created_at: "2026-05-19T12:31:00Z",
    });

    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          audit_id: "audit-grant-1",
          entitlement: adminEntitlements.at(-1),
        },
      }),
    });
  });

  await page.route("**/entitlements/admin/*", async (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}") as Record<string, string>;
    const entitlementId = route.request().url().split("/").at(-1);
    const entitlement = adminEntitlements.find((item) => item.id === entitlementId);

    if (!entitlement || !body.reason || body.reason.length < 8) {
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Invalid entitlement revoke" }),
      });
      return;
    }

    entitlement.active = false;
    adminAuditEvents.unshift({
      id: "audit-revoke-1",
      action: "entitlement.revoked",
      reason: body.reason,
      created_at: "2026-05-19T12:40:00Z",
    });

    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { audit_id: "audit-revoke-1" },
      }),
    });
  });

  await page.route("**/admin/ai/insights**", async (route) => {
    if (route.request().resourceType() === "document") {
      await route.fallback();
      return;
    }

    const url = new URL(route.request().url());
    const insightId = url.pathname.split("/").filter(Boolean).at(-1);

    if (insightId && insightId !== "insights") {
      const insight = adminInsights.find((item) => item.id === insightId);
      route.fulfill({
        status: insight ? 200 : 404,
        contentType: "application/json",
        body: JSON.stringify({
          success: Boolean(insight),
          data: insight ?? null,
        }),
      });
      return;
    }

    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: adminInsights,
          page: 1,
          per_page: 20,
          total: adminInsights.length,
          kpis: {
            total_cost_usd: 0.86,
            total_tokens: 2480,
            failed_count: 0,
            missing_consent_count: 0,
          },
        },
      }),
    });
  });

  await page.route("**/admin/feature-flags**", async (route) => {
    if (route.request().resourceType() === "document") {
      await route.fallback();
      return;
    }

    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { flags: adminFeatureFlags },
      }),
    });
  });

  await page.route("**/admin/feature-flags/*", async (route) => {
    const key = decodeURIComponent(route.request().url().split("/").at(-1) ?? "");
    const body = JSON.parse(route.request().postData() ?? "{}") as Record<string, string>;
    const flag = adminFeatureFlags.find((item) => item.key === key);

    if (!flag || !body.status || !body.reason || body.reason.length < 10) {
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Invalid flag update" }),
      });
      return;
    }

    flag.status = body.status;
    flag.updated_at = "2026-05-19T12:45:00Z";

    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          audit_id: "audit-flag-1",
          flag,
        },
      }),
    });
  });

  await page.route("**/admin/operations/summary", async (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          api_status: "healthy",
          ai_circuit_breaker: "closed",
          monthly_ai_cost_usd: 0.86,
          monthly_ai_budget_usd: 120,
          pending_incidents: 0,
          grafana_url: "https://grafana.auraxis.com.br/d/admin",
          last_sync_at: "2026-05-19T12:40:00Z",
          queues: [
            {
              name: "ai-insights",
              pending: 1,
              oldest_age_seconds: 42,
            },
          ],
        },
      }),
    });
  });

  await page.route("**/admin/impersonation/sessions", async (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}") as Record<string, string>;
    const user = adminUsers.find((item) => item.id === body.user_id);

    if (!user || !body.reason || body.reason.length < 10) {
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Invalid impersonation request" }),
      });
      return;
    }

    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          session_id: "impersonation-1",
          audit_id: "audit-impersonation-1",
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          started_at: "2026-05-19T12:50:00Z",
          expires_at: "2036-05-19T13:05:00Z",
          read_only: true,
        },
      }),
    });
  });

  await page.route("**/admin/impersonation/sessions/*", async (route) => {
    route.fulfill({
      status: 204,
      contentType: "application/json",
      body: "",
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

test.describe("Admin — shell and guard", () => {
  test("blocks authenticated non-admin users without exposing admin data", async ({ page }) => {
    await mockAdminSession(page, { isAdmin: false });
    await login(page);

    await page.goto("/admin");

    await expect(page).toHaveURL(/\/admin\/forbidden/, { timeout: 10_000 });
    await expect(
      page.locator(".admin-forbidden").getByRole("heading", { name: "Acesso restrito" }),
    ).toBeVisible();
    await expect(page.getByText(/não possui permissões administrativas/i)).toBeVisible();
    await expect(page.getByText("Console administrativo")).toBeHidden();
  });

  test("shows the admin route and shell for users with admin claims", async ({ page }) => {
    await mockAdminSession(page, { isAdmin: true });
    await login(page);

    await expect(page.getByRole("link", { name: /admin/i })).toBeVisible({ timeout: 10_000 });
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "Console administrativo" })).toBeVisible();
    const adminNavigation = page.getByRole("navigation", { name: "Navegação administrativa" });
    await expect(adminNavigation).toBeVisible();
    await expect(adminNavigation.getByRole("link", { name: /Insights IA/ })).toBeVisible();
  });

  test("shows unified identities, subscription and premium state", async ({ page }, testInfo) => {
    await mockAdminSession(page, { isAdmin: true });
    await login(page);

    await page.goto("/admin/users");

    await expect(
      page.getByRole("heading", { name: "Usuários, bloqueios e premium" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /ana@auraxis.com/ })).toBeVisible();
    await expect(
      page.locator(".admin-users__detail").getByRole("heading", { name: "ana@auraxis.com" }),
    ).toBeVisible();
    await expect(page.getByText("Identidades vinculadas")).toBeVisible();
    await expect(page.getByText("Assinatura").locator("..").getByText("active")).toBeVisible();

    if (process.env.E2E_CAPTURE_ADMIN_SCREENSHOTS === "true") {
      const viewport = testInfo.project.name === "mobile-chrome" ? "mobile" : "desktop";
      for (const theme of ["light", "dark"] as const) {
        await page.evaluate((selectedTheme) => {
          localStorage.setItem("auraxis-theme", selectedTheme);
        }, theme);
        await page.reload();
        await expect(
          page.getByRole("heading", { name: "Usuários, bloqueios e premium" }),
        ).toBeVisible();
        await page.screenshot({
          path: `docs/screenshots/backoffice-users-${viewport}-${theme}.png`,
          fullPage: true,
        });
      }
    }
  });

  test("blocks and unblocks every linked identity with an audit reason", async ({ page }) => {
    await mockAdminSession(page, { isAdmin: true });
    await login(page);
    await page.goto("/admin/users");

    await page.getByRole("button", { name: "Bloquear", exact: true }).click();
    await page
      .getByPlaceholder(/justificativa operacional/i)
      .fill("Bloqueio operacional validado pelo suporte");
    await page.getByTestId("admin-user-action-confirm").click();
    await expect(page.getByText(/Ação enviada:/)).toContainText("action-block");
    await expect(page.getByRole("button", { name: "Desbloquear", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Desbloquear", exact: true }).click();
    await page
      .getByPlaceholder(/justificativa operacional/i)
      .fill("Conta revisada e liberada pelo suporte");
    await page.getByTestId("admin-user-action-confirm").click();
    await expect(page.getByText(/Ação enviada:/)).toContainText("action-unblock");
    await expect(page.getByRole("button", { name: "Bloquear", exact: true })).toBeVisible();
  });

  test("grants and revokes premium override without changing billing", async ({ page }) => {
    await mockAdminSession(page, { isAdmin: true });
    await login(page);
    await page.goto("/admin/users");

    await page.getByRole("button", { name: "Conceder premium", exact: true }).click();
    await page
      .getByPlaceholder(/justificativa operacional/i)
      .fill("Liberar premium temporário solicitado pelo suporte");
    await page.getByTestId("admin-user-action-confirm").click();
    await expect(page.getByText(/Ação enviada:/)).toContainText("action-premium_override");
    await expect(page.getByRole("button", { name: "Revogar override", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Revogar override", exact: true }).click();
    await page
      .getByPlaceholder(/justificativa operacional/i)
      .fill("Período promocional concluído conforme combinado");
    await page.getByTestId("admin-user-action-confirm").click();
    await expect(page.getByText(/Ação enviada:/)).toContainText("action-premium_override_revoke");
    await expect(page.getByText("Assinatura").locator("..").getByText("active")).toBeVisible();
  });

  test("shows AI insights audit metadata and redacted evidence", async ({ page }) => {
    await mockAdminSession(page, { isAdmin: true });
    await login(page);
    await page.goto("/admin/insights");

    await expect(
      page.getByRole("heading", {
        name: "Investigue custo, qualidade e consentimento dos insights",
      }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /ana@auraxis.com/ })).toBeVisible();
    await expect(page.getByText("Categoria [redigida] representou 41% das saídas.")).toBeVisible();
    await expect(page.getByText(/ai\.insight\.generated/)).toBeVisible();
  });

  test("updates a feature flag with an audit reason", async ({ page }) => {
    await mockAdminSession(page, { isAdmin: true });
    await login(page);
    await page.goto("/admin/flags");

    await expect(
      page.getByRole("heading", { name: "Flags, orçamento de IA e saúde operacional" }),
    ).toBeVisible();
    await expect(page.getByText("web.pages.insights")).toBeVisible();
    await expect(page.getByRole("link", { name: /Abrir Grafana Cloud/ })).toHaveAttribute(
      "href",
      "https://grafana.auraxis.com.br/d/admin",
    );

    await page
      .locator(".admin-flags__row", { hasText: "web.pages.insights" })
      .locator(".n-base-selection")
      .click();
    await page.getByText("Staging", { exact: true }).click();
    await page
      .getByPlaceholder(/motivo operacional/i)
      .fill("Reduzir rollout durante validação de suporte");
    await page.getByRole("button", { name: /Confirmar com auditoria/ }).click();

    await expect(page.getByText(/Último audit id:/)).toContainText("audit-flag-1");
  });

  test("starts read-only impersonation and shows the persistent banner", async ({ page }) => {
    await mockAdminSession(page, { isAdmin: true });
    await login(page);
    await page.goto("/admin/impersonation");

    await expect(
      page.getByRole("heading", { name: "Visualizar como usuário, sem alterar dados" }),
    ).toBeVisible();
    await page.getByPlaceholder(/Digite ao menos 2 caracteres/).fill("ana");
    await expect(page.getByRole("button", { name: /Ana Premium/ })).toBeVisible();
    await page
      .getByPlaceholder(/Reproduzir bug reportado/)
      .fill("Reproduzir bug reportado no dashboard");
    await page.getByRole("button", { name: /Iniciar somente leitura/ }).click();

    await expect(page.getByText(/Visualizando Ana Premium/)).toBeVisible();
    await page.getByRole("button", { name: /Abrir dashboard/ }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page.getByText(/modo somente leitura/)).toBeVisible();
  });
});
