import { expect, type Page } from "@playwright/test";

/** Credentials for E2E test user. Must be set in CI via secrets. */
const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "";

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
