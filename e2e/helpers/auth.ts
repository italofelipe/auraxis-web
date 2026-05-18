import { expect, type Page } from "@playwright/test";

/** Credentials for E2E test user. Must be set in CI via secrets. */
const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "";
const COOKIE_CONSENT_VALUE = encodeURIComponent(JSON.stringify({
  version: 1,
  necessary: true,
  analytics: false,
  marketing: false,
  updatedAt: "2026-05-17T00:00:00.000Z",
}));

/**
 * Waits for the Nuxt/Vue app to finish hydrating on the current page.
 *
 * Pre-rendered (SSR) pages are served as static HTML. The Vue application
 * hydrates asynchronously after the JS bundles load. Playwright's `page.goto()`
 * resolves as soon as the browser `load` event fires — which may happen before
 * Vue has attached its event listeners. Filling an input or clicking a button
 * before hydration completes loses those interactions (events are dispatched but
 * no Vue handler is attached yet to capture them).
 *
 * This helper blocks until Vue has mounted on the `#__nuxt` root element,
 * guaranteeing that `v-model` bindings and `@submit` handlers are in place.
 *
 * @param page - Playwright page instance.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const el = document.getElementById("__nuxt");
    // Vue 3 sets __vue_app__ on the root element after mounting.
    // Once it's present, all reactive bindings and event listeners are attached.
    return el !== null && (el as Element & { __vue_app__?: unknown }).__vue_app__ !== undefined;
  });
}

/**
 * Dismisses the public cookie banner when it is present.
 *
 * Mobile auth flows can place the fixed banner over the login CTA. Clicking the
 * explicit reject action keeps the test behavior aligned with a real visitor
 * choice without enabling optional tracking categories.
 *
 * @param page Playwright page instance.
 */
export async function dismissCookieConsentBanner(page: Page): Promise<void> {
  const banner = page.getByRole("region", { name: /preferências de cookies/i });
  const isVisible = await banner.isVisible({ timeout: 500 }).catch(() => false);

  if (!isVisible) {
    return;
  }

  await page.getByRole("button", { name: /rejeitar opcionais/i }).click();
  await expect(banner).toBeHidden({ timeout: 2_000 });
}

/**
 * Seeds a necessary-only cookie preference before visiting auth pages.
 *
 * This keeps E2E login flows focused on authentication while preserving the
 * dedicated cookie-consent spec as the place that verifies the banner itself.
 *
 * @param page Playwright page instance.
 */
export async function seedCookieConsent(page: Page): Promise<void> {
  await page.context().addCookies([{
    name: "auraxis_cookie_consent",
    value: COOKIE_CONSENT_VALUE,
    url: process.env.BASE_URL ?? "http://localhost:3000",
    sameSite: "Lax",
  }]);
}

/**
 * Fills the login form and verifies the values stuck before submitting.
 *
 * First page loads can still run session/bootstrap work after Vue hydration,
 * which may remount the auth form and clear a field while tests are filling it.
 * Retrying the two field values here keeps the UI login flow deterministic.
 *
 * @param page Playwright page instance.
 * @param email E-mail credential.
 * @param password Password credential.
 */
export async function fillLoginForm(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await dismissCookieConsentBanner(page);

  const emailInput = page.locator("#login-email");
  const passwordInput = page.locator("#login-password");

  await expect(emailInput).toBeEditable({ timeout: 5_000 });
  await expect(passwordInput).toBeEditable({ timeout: 5_000 });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await page.waitForTimeout(75);

    const emailValue = await emailInput.inputValue();
    const passwordValue = await passwordInput.inputValue();
    if (emailValue === email && passwordValue === password) {
      return;
    }
  }

  await expect(emailInput).toHaveValue(email);
  await expect(passwordInput).toHaveValue(password);
}

/**
 * Performs a login via the UI and waits for the dashboard to load.
 * Uses the `E2E_TEST_EMAIL` and `E2E_TEST_PASSWORD` environment variables.
 *
 * @param page - Playwright page instance.
 * @throws If E2E test credentials are not configured.
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error(
      "E2E test credentials not configured. Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD.",
    );
  }

  await page.goto("/login");
  await waitForHydration(page);
  await fillLoginForm(page, TEST_EMAIL, TEST_PASSWORD);
  await page.getByRole("button", { name: /entrar|login/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}
