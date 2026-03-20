// TODO: requires Storybook server running
import { test, expect } from "@playwright/test";

test.describe("UiPasswordField", () => {
  test("toggles password visibility", async ({ page }) => {
    await page.goto("/storybook/iframe.html?id=shared-uipasswordfield--default&viewMode=story");
    const input = page.locator("input[id=\"password\"]");
    await expect(input).toHaveAttribute("type", "password");
    await page.click("button[aria-label=\"Mostrar senha\"]");
    await expect(input).toHaveAttribute("type", "text");
    await page.click("button[aria-label=\"Ocultar senha\"]");
    await expect(input).toHaveAttribute("type", "password");
  });

  test("toggle button aria-pressed updates correctly", async ({ page }) => {
    await page.goto("/storybook/iframe.html?id=shared-uipasswordfield--default&viewMode=story");
    const toggle = page.locator("button[aria-label=\"Mostrar senha\"]");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.click();
    const toggleVisible = page.locator("button[aria-label=\"Ocultar senha\"]");
    await expect(toggleVisible).toHaveAttribute("aria-pressed", "true");
  });
});
