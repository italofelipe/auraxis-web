import type { Page } from "@playwright/test";

/** Payload returned by the mocked login endpoint. */
const LOGIN_RESPONSE = {
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

const CONSENT_COOKIE = encodeURIComponent(JSON.stringify({
  version: 1,
  necessary: true,
  analytics: false,
  marketing: false,
  updatedAt: "2026-05-17T00:00:00.000Z",
}));

/**
 * Puts the page in an authenticated state without a real backend.
 *
 * Every product screen sits behind `middleware: ["authenticated"]`, so any
 * suite that wants to look at one needs this. Auth, profile and entitlements
 * answer success; everything else under the API origin answers an empty v2
 * envelope, which renders the empty state instead of an error toast.
 *
 * The `_nuxt` guard matters: a route pattern like `**\/simulations**` also
 * matches `/_nuxt/simulations.<hash>.css`, and swallowing that file renders
 * the page without its own stylesheet.
 *
 * @param page Playwright page.
 * @param options Session options.
 * @param options.premium Whether entitlement checks should grant access.
 */
export async function mockAuthenticatedSession(
  page: Page,
  options: { premium?: boolean } = {},
): Promise<void> {
  const premium = options.premium !== false;
  let sessionEstablished = false;

  await page.route("**/auth/refresh", (route) => route.fulfill({
    status: sessionEstablished ? 200 : 401,
    contentType: "application/json",
    body: JSON.stringify(
      sessionEstablished
        ? { success: true, data: { token: "mock-refreshed" } }
        : { message: "Unauthorized" },
    ),
  }));

  await page.route("**/auth/login", (route) => {
    sessionEstablished = true;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(LOGIN_RESPONSE),
    });
  });

  await page.route("**/user/me", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      id: "user-1",
      email: "test@auraxis.com",
      name: "Test User",
      subscription_plan: premium ? "premium" : "free",
      onboarding_completed_at: "2026-01-01T00:00:00Z",
    }),
  }));

  await page.route("**/entitlements/check**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, data: { active: premium, has_access: premium } }),
  }));

  // Coleções vazias em vez de erro: a tela renderiza o empty state, que é o
  // estado mais rico em armadilha de a11y (ícone sem alt, CTA sem rótulo).
  const EMPTY_COLLECTIONS = [
    "dashboard",
    "transactions",
    "credit-cards",
    "wallet",
    "portfolio",
    "goals",
    "budgets",
    "simulations",
    "insights",
    "alerts",
    "tags",
    "accounts",
  ];

  for (const collection of EMPTY_COLLECTIONS) {
    await page.route(`**/${collection}**`, (route) => {
      // Um padrão como `**/simulations**` também casa com
      // `/_nuxt/simulations.<hash>.css`; engolir esse arquivo renderiza a
      // página sem o próprio CSS e o audit vira ficção.
      if (route.request().url().includes("/_nuxt/")) {
        return route.continue();
      }

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "ok",
          data: { items: [] },
          meta: { pagination: { page: 1, per_page: 20, total: 0 } },
        }),
      });
    });
  }

  await page.context().addCookies([{
    name: "auraxis_cookie_consent",
    value: CONSENT_COOKIE,
    url: process.env.BASE_URL ?? "http://localhost:3000",
    sameSite: "Lax",
  }]);
}

/**
 * Logs in through the UI and lands on an authenticated route.
 *
 * Navigation is client-side on purpose: the session token lives in Pinia
 * memory, so a full `page.goto` would hit the server-side middleware and
 * bounce back to `/login`.
 *
 * @param page Playwright page.
 * @param path Route to open after login.
 */
export async function loginAndVisit(page: Page, path: string): Promise<void> {
  await page.goto("/login");
  await page.waitForFunction(() => {
    const el = document.getElementById("__nuxt");
    return el !== null && (el as Element & { __vue_app__?: unknown }).__vue_app__ !== undefined;
  });

  await page.fill("input[type='email']", "test@auraxis.com");
  await page.fill("input[type='password']", "ValidPassword1!");
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });

  if (path !== "/dashboard") {
    await page.evaluate((target) => {
      const root = document.getElementById("__nuxt") as (Element & {
        __vue_app__?: { config?: { globalProperties?: { $router?: { push: (to: string) => void } } } };
      }) | null;
      root?.__vue_app__?.config?.globalProperties?.$router?.push(target);
    }, path);
    await page.waitForURL(`**${path}`, { timeout: 20_000 });
  }

  await page.waitForLoadState("networkidle");
}
