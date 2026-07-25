import { expect, test, type Page } from "@playwright/test";
import { fillLoginForm, seedCookieConsent, waitForHydration } from "./helpers/auth";

const VALID_EMAIL = "test@auraxis.com";
const VALID_PASSWORD = "ValidPassword1!";

/**
 * Builds a syntactically valid JWT with the given payload claims.
 * The signature is irrelevant — only the payload is decoded client-side.
 *
 * @param claims - Extra payload claims merged over the defaults.
 * @returns A base64url-encoded mock JWT string.
 */
const tokenWithPayload = (claims: Record<string, unknown>): string => {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ sub: "user-1", exp: Math.floor(Date.now() / 1000) + 3600, ...claims }),
  ).toString("base64url");
  return `${header}.${payload}.mock-signature`;
};

/**
 * Minimal auth + admin-session mocks dedicated to the ENTRY flow (#1171).
 *
 * Unlike the full admin harness in `admin.spec.ts`, this helper only mocks
 * what the entry journey touches: v1 auth (login/refresh/user), the v2 admin
 * session probe and permissive stubs for the admin data endpoints the target
 * pages fetch after entry. The refresh endpoint returns 401 until the UI login
 * happens — mirroring a logged-out visitor with no refresh cookie.
 *
 * @param page - Playwright page instance.
 * @param options - Whether the mocked principal has admin access.
 * @param options.isAdmin
 * @returns Resolves once every route mock is registered.
 */
const mockEntryFlow = async (
  page: Page,
  options: { isAdmin: boolean },
): Promise<void> => {
  const token = tokenWithPayload({ roles: options.isAdmin ? ["admin"] : ["user"] });
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
        data: {
          id: "user-1",
          name: "Test User",
          email: VALID_EMAIL,
          email_confirmed: true,
        },
      }),
    });
  });

  // The real /v2/admin/session responds with a FLAT principal (no envelope) —
  // mirror the shape used by the full admin harness in admin.spec.ts.
  await page.route("**/v2/admin/session", (route) => {
    route.fulfill({
      status: options.isAdmin ? 200 : 403,
      contentType: "application/json",
      body: JSON.stringify(
        options.isAdmin
          ? { source: "v1", user_id: "user-1", email: VALID_EMAIL, is_admin: true }
          : { error: "FORBIDDEN", message: "Access denied." },
      ),
    });
  });

  // Permissive stubs so the /admin index renders without data noise.
  await page.route("**/v2/admin/metrics/**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: {} }),
    });
  });
  await page.route("**/v2/admin/users**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { items: [], next_cursor: null } }),
    });
  });
};

/**
 * Fills the login form with the mocked credentials and submits it.
 *
 * @param page - Playwright page instance.
 * @returns Resolves after the submit button is clicked.
 */
const submitLogin = async (page: Page): Promise<void> => {
  await waitForHydration(page);
  await fillLoginForm(page, VALID_EMAIL, VALID_PASSWORD);
  await page.getByRole("button", { name: /entrar/i }).click();
};

test.describe("Admin — entry flow (#1171)", () => {
  // Every case here is a full journey (login → navigation → admin probe),
  // often twice in the same test — give them room beyond the default 30s,
  // especially on emulated mobile viewports.
  test.describe.configure({ timeout: 60_000 });

  test("deep link logged out: /admin → /login → login → returns to /admin", async ({ page }) => {
    await mockEntryFlow(page, { isAdmin: true });

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    await submitLogin(page);

    await expect(page).toHaveURL(/\/admin$/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
  });

  test("deep link logged out as non-admin: login lands on forbidden, never back on /login", async ({ page }) => {
    await mockEntryFlow(page, { isAdmin: false });

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    await submitLogin(page);

    await expect(page).toHaveURL(/\/admin\/forbidden/, { timeout: 10_000 });
    await expect(
      page.locator(".admin-forbidden").getByRole("heading", { name: "Acesso restrito" }),
    ).toBeVisible();
  });

  test("authenticated visitor hitting /login with a saved destination is sent to it, not /dashboard", async ({ page }) => {
    await mockEntryFlow(page, { isAdmin: true });

    // Establish the session through the real UI flow first.
    await page.goto("/login");
    await submitLogin(page);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    // Simulate the admin middleware having saved a destination right before a
    // bounce to /login (the prod symptom: authenticated operator stuck outside).
    await page.evaluate(() => {
      sessionStorage.setItem("auraxis:auth:redirect", "/admin");
    });

    await page.goto("/login");

    // guest-only must honor the saved destination instead of forcing /dashboard.
    await expect(page).toHaveURL(/\/admin$/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
  });

  test("admin reaches the panel through the sidebar menu link (soft navigation)", async ({ page }) => {
    await mockEntryFlow(page, { isAdmin: true });

    await page.goto("/login");
    await submitLogin(page);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    // On mobile projects the sidebar is an off-canvas drawer — open it via the
    // topbar hamburger before reaching for the nav link. Explicit click
    // timeouts keep an unactionable element (mid-animation overlay) from
    // silently consuming the whole test budget.
    if (test.info().project.name.startsWith("mobile")) {
      const menuToggle = page.getByRole("button", { name: "Abrir menu" });
      await expect(menuToggle).toBeVisible({ timeout: 10_000 });
      await menuToggle.click({ timeout: 10_000 });
    }

    // The menu item only renders after the /v2/admin/session probe confirms
    // admin access (#1163) — clicking it exercises the soft-nav middleware path.
    const adminLink = page.getByRole("link", { name: /admin/i });
    await expect(adminLink).toBeVisible({ timeout: 10_000 });
    await adminLink.click({ timeout: 10_000 });

    await expect(page).toHaveURL(/\/admin$/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
  });

  test("fresh load of /admin with a valid refresh cookie enters without bouncing", async ({ page }) => {
    await mockEntryFlow(page, { isAdmin: true });

    // Login once to flip the mock into "has refresh cookie" mode.
    await page.goto("/login");
    await submitLogin(page);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    // Hard navigation: in-memory session is gone, the session plugin must
    // restore it via /auth/refresh BEFORE the admin middleware decides.
    await page.goto("/admin");

    // The heading is the real gate here: on a hard load the URL reads /admin
    // from the very first frame, so a URL assertion alone would pass even when
    // the middleware later bounces to /login or /admin/forbidden.
    await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page).toHaveURL(/\/admin$/);
  });
});
