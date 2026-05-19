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
  reason: string;
  created_at: string;
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

/**
 * Builds an unsigned JWT-like token so the frontend can read mocked claims.
 *
 * @param payload JWT payload claims.
 * @returns Token-shaped string.
 */
const tokenWithPayload = (payload: Record<string, unknown>): string => {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64url");
  return `header.${encodedPayload}.signature`;
};

/**
 * Registers MSW-style route mocks for admin and non-admin browser sessions.
 *
 * @param page Playwright page instance.
 * @param options Session role options.
 * @param options.isAdmin Whether the mocked session should include admin claims.
 */
const mockAdminSession = async (
  page: Page,
  options: { isAdmin: boolean },
): Promise<void> => {
  const token = tokenWithPayload({ roles: options.isAdmin ? ["admin"] : ["user"] });
  let sessionEstablished = false;
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
        period: { key: "current_month", start: "2026-05-01", end: "2026-05-31", label: "maio 2026" },
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
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ series: [] }) });
  });

  await page.route("**/dashboard/survival-index", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ n_months: 0, total_assets: 0, avg_monthly_expense: 0, classification: "unknown" }),
    });
  });

  await page.route("**/entitlements/check**", (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ has_access: true }) });
  });

  await page.route("**/wallet/entries**", (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });

  await page.route("**/transactions/due-range**", (route) => {
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ transactions: [], total: 0 }) });
  });

  await page.route("**/admin/users**", async (route) => {
    if (route.request().resourceType() === "document") {
      await route.fallback();
      return;
    }

    const url = new URL(route.request().url());
    const pathParts = url.pathname.split("/").filter(Boolean);
    const userId = pathParts.length > 2 ? pathParts.at(-1) : null;

    if (userId && userId !== "users") {
      const user = adminUsers.find((item) => item.id === userId);
      route.fulfill({
        status: user ? 200 : 404,
        contentType: "application/json",
        body: JSON.stringify({
          success: Boolean(user),
          data: user
            ? {
              user: {
                ...user,
                entitlements: adminEntitlements,
                audit_events: adminAuditEvents,
              },
            }
            : null,
        }),
      });
      return;
    }

    const query = url.searchParams.get("q")?.toLowerCase() ?? "";
    const filteredUsers = adminUsers
      .map((user) => ({
        ...user,
        entitlements_count: user.id === "admin-user-1"
          ? adminEntitlements.filter((entitlement) => entitlement.active).length
          : user.entitlements_count,
      }))
      .filter((user) => {
        if (!query) {
          return true;
        }

        return [user.id, user.name, user.email]
          .some((value) => value.toLowerCase().includes(query));
      });

    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          users: filteredUsers,
          page: 1,
          per_page: 20,
          total: filteredUsers.length,
        },
      }),
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

  test("shows users, subscription detail and active entitlements", async ({ page }) => {
    await mockAdminSession(page, { isAdmin: true });
    await login(page);

    await page.goto("/admin/users");

    await expect(
      page.getByRole("heading", { name: "Usuários, assinaturas e acessos premium" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Ana Premium/ })).toBeVisible();
    await expect(page.locator(".admin-users__detail").getByRole("heading", { name: "Ana Premium" })).toBeVisible();
    await expect(
      page.locator(".admin-users__detail-grid article")
        .filter({ hasText: "Plano" })
        .getByText("premium", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".admin-users__entitlements").getByText("Insights com IA")).toBeVisible();
  });

  test("grants an entitlement with a required audit reason", async ({ page }) => {
    await mockAdminSession(page, { isAdmin: true });
    await login(page);
    await page.goto("/admin/users");

    await page.locator(".admin-users__grant .n-base-selection").click();
    await page.getByText("Market Pulse", { exact: true }).click();
    await page.getByRole("button", { name: /Conceder/ }).click();
    await page.getByPlaceholder(/ajuste solicitado/i).fill("Liberar teste premium solicitado pelo suporte");
    await page.getByTestId("admin-entitlement-confirm").click();

    await expect(page.getByText(/Último audit id:/)).toContainText("audit-grant-1");
    await expect(page.locator(".admin-users__entitlements").getByText("Market Pulse")).toBeVisible();
  });

  test("revokes an entitlement with a required audit reason", async ({ page }) => {
    await mockAdminSession(page, { isAdmin: true });
    await login(page);
    await page.goto("/admin/users");

    await page.getByRole("button", { name: /Revogar Insights com IA/ }).click();
    await page.getByPlaceholder(/ajuste solicitado/i).fill("Encerrar acesso temporário depois da validação");
    await page.getByTestId("admin-entitlement-confirm").click();

    await expect(page.getByText(/Último audit id:/)).toContainText("audit-revoke-1");
    await expect(page.locator(".admin-users__entitlements").getByText("Insights com IA")).toHaveCount(0);
  });
});
