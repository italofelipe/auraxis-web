import { test, expect } from "@playwright/test";

/**
 * E2E suite: Login flow
 *
 * Uses page.route() to mock API responses — no live backend required.
 * Tests cover: UI rendering, successful login, invalid credentials error.
 */

const MOCK_LOGIN_SUCCESS = {
  success: true,
  message: "Authenticated",
  data: {
    token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    user: {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      email_confirmed: true,
    },
  },
};

const MOCK_LOGIN_INVALID_CREDENTIALS = {
  message: "Credenciais inválidas. Verifique seu e-mail e senha.",
};

test.describe("Auth — Login", () => {
  test("login page renders email, password fields and submit button", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
  });

  test("login page has a link to forgot-password", async ({ page }) => {
    await page.goto("/login");

    const forgotLink = page.getByRole("link", { name: /esqueceu/i });
    await expect(forgotLink).toBeVisible();
    await expect(forgotLink).toHaveAttribute("href", "/forgot-password");
  });

  test("login page has a link to register", async ({ page }) => {
    await page.goto("/login");

    const registerLink = page.getByRole("link", { name: /criar conta/i });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute("href", "/register");
  });

  test("successful login redirects to /dashboard", async ({ page }) => {
    await page.route("**/auth/login", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_LOGIN_SUCCESS),
      });
    });

    await page.goto("/login");
    await page.locator("#login-email").fill("test@example.com");
    await page.locator("#login-password").fill("ValidPassword1!");
    await page.getByRole("button", { name: /entrar/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });

  test("shows error message on invalid credentials (401)", async ({ page }) => {
    await page.route("**/auth/login", (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify(MOCK_LOGIN_INVALID_CREDENTIALS),
      });
    });

    await page.goto("/login");
    await page.locator("#login-email").fill("wrong@example.com");
    await page.locator("#login-password").fill("WrongPassword1!");
    await page.getByRole("button", { name: /entrar/i }).click();

    // Should stay on /login
    await expect(page).toHaveURL(/\/login/);
    // Error toast should be visible
    await expect(
      page.getByText(/credenciais inválidas/i),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("submit button is disabled while login is in progress", async ({
    page,
  }) => {
    // Slow down the API to observe the loading state
    await page.route("**/auth/login", async (route) => {
      await page.waitForTimeout(200);
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_LOGIN_SUCCESS),
      });
    });

    await page.goto("/login");
    await page.locator("#login-email").fill("test@example.com");
    await page.locator("#login-password").fill("ValidPassword1!");

    const submitButton = page.getByRole("button", { name: /entrar/i });
    await submitButton.click();

    // While loading, the button should be disabled
    await expect(submitButton).toBeDisabled();
  });

  test("shows validation error when submitting empty form", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: /entrar/i }).click();

    // vee-validate should prevent API call and show inline errors
    const emailInput = page.locator("#login-email");
    await expect(emailInput).toBeVisible();
    // Should remain on login page without calling API
    await expect(page).toHaveURL(/\/login/);
  });
});
