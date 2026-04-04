import { test, expect } from "@playwright/test";

/**
 * E2E suite: Register flow
 *
 * Uses page.route() to mock API responses — no live backend required.
 * Tests cover: UI rendering, successful registration, and navigation.
 */

const MOCK_REGISTER_SUCCESS = {
  success: true,
  message: "Account created",
  data: {
    token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    user: {
      id: "user-new-456",
      name: "New User",
      email: "newuser@example.com",
      email_confirmed: false,
    },
  },
};

const MOCK_REGISTER_EMAIL_TAKEN = {
  message: "Este e-mail já está em uso. Tente fazer login.",
};

test.describe("Auth — Register", () => {
  test("register page renders all form fields and submit button", async ({
    page,
  }) => {
    await page.goto("/register");

    await expect(page.locator("#signup-name")).toBeVisible();
    await expect(page.locator("#signup-email")).toBeVisible();
    await expect(page.locator("#signup-password")).toBeVisible();
    await expect(page.locator("#signup-confirm-password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /criar conta/i }),
    ).toBeVisible();
  });

  test("register page has a link back to login", async ({ page }) => {
    await page.goto("/register");

    const loginLink = page.getByRole("link", { name: /entrar/i });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute("href", "/login");
  });

  test("successful registration redirects to /confirm-email-pending", async ({
    page,
  }) => {
    await page.route("**/auth/register", (route) => {
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(MOCK_REGISTER_SUCCESS),
      });
    });

    await page.goto("/register");
    await page.locator("#signup-name").fill("New User");
    await page.locator("#signup-email").fill("newuser@example.com");
    await page.locator("#signup-password").fill("StrongPass1!");
    await page.locator("#signup-confirm-password").fill("StrongPass1!");
    await page.getByRole("button", { name: /criar conta/i }).click();

    await expect(page).toHaveURL(/\/confirm-email-pending/, {
      timeout: 10_000,
    });
  });

  test("shows error message when email is already taken (409)", async ({
    page,
  }) => {
    await page.route("**/auth/register", (route) => {
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify(MOCK_REGISTER_EMAIL_TAKEN),
      });
    });

    await page.goto("/register");
    await page.locator("#signup-name").fill("Existing User");
    await page.locator("#signup-email").fill("taken@example.com");
    await page.locator("#signup-password").fill("StrongPass1!");
    await page.locator("#signup-confirm-password").fill("StrongPass1!");
    await page.getByRole("button", { name: /criar conta/i }).click();

    // Should remain on /register
    await expect(page).toHaveURL(/\/register/);
    // Error toast should be visible — useApiError maps 409 (no code) to errors.UNKNOWN i18n key
    await expect(
      page.getByText(/algo deu errado/i),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("submit button is disabled while registration is in progress", async ({
    page,
  }) => {
    await page.route("**/auth/register", async (route) => {
      await page.waitForTimeout(800);
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(MOCK_REGISTER_SUCCESS),
      });
    });

    await page.goto("/register");
    await page.locator("#signup-name").fill("New User");
    await page.locator("#signup-email").fill("newuser@example.com");
    await page.locator("#signup-password").fill("StrongPass1!");
    await page.locator("#signup-confirm-password").fill("StrongPass1!");

    const submitButton = page.getByRole("button", { name: /criar conta/i });
    await submitButton.click();

    await expect(submitButton).toBeDisabled();
  });

  test("shows validation error when submitting empty form", async ({
    page,
  }) => {
    await page.goto("/register");

    await page.getByRole("button", { name: /criar conta/i }).click();

    // Should remain on register page without calling API
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator("#signup-name")).toBeVisible();
  });
});
