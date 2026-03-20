import { test, expect } from "@playwright/test";

// Requer servidor Nuxt rodando
test.describe("UiAppShell", () => {
  test("sidebar is visible on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard");
    await expect(
      page.locator("[aria-label=\"Navegação principal\"]"),
    ).toBeVisible();
  });

  test("menu button opens sidebar drawer on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");
    const menuBtn = page.locator("button[aria-label=\"Abrir menu\"]");
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    await expect(
      page.locator(".ui-app-shell__sidebar--drawer-open"),
    ).toBeVisible();
  });

  test("overlay closes drawer on click", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");
    await page.click("button[aria-label=\"Abrir menu\"]");
    await page.click(".ui-app-shell__overlay");
    await expect(
      page.locator(".ui-app-shell__sidebar--drawer-open"),
    ).not.toBeVisible();
  });
});
