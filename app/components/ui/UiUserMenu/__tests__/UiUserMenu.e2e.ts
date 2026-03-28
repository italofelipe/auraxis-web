// TODO: requires Storybook server running
import { test, expect } from "@playwright/test";

test.describe("UiUserMenu", () => {
  test("opens dropdown on trigger click", async ({ page }) => {
    await page.goto("/storybook/iframe.html?id=shared-uiusermenu--with-fallback-avatar&viewMode=story");
    await expect(page.locator("[role=\"menu\"]")).not.toBeVisible();
    await page.click(".ui-user-menu__trigger");
    await expect(page.locator("[role=\"menu\"]")).toBeVisible();
  });

  test("clicks settings menuitem and closes dropdown", async ({ page }) => {
    await page.goto("/storybook/iframe.html?id=shared-uiusermenu--with-fallback-avatar&viewMode=story");
    await page.click(".ui-user-menu__trigger");
    await expect(page.locator("[role=\"menu\"]")).toBeVisible();
    await page.click("[role=\"menuitem\"]:has-text(\"Configurações\")");
    await expect(page.locator("[role=\"menu\"]")).not.toBeVisible();
  });

  test("closes dropdown on click outside", async ({ page }) => {
    await page.goto("/storybook/iframe.html?id=shared-uiusermenu--with-fallback-avatar&viewMode=story");
    await page.click(".ui-user-menu__trigger");
    await expect(page.locator("[role=\"menu\"]")).toBeVisible();
    await page.mouse.click(10, 10);
    await expect(page.locator("[role=\"menu\"]")).not.toBeVisible();
  });
});
