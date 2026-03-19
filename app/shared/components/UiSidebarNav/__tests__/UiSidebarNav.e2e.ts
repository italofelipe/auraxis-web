// TODO: requires Storybook server running
import { test, expect } from "@playwright/test";

test.describe("UiSidebarNav", () => {
  test("renders navigation landmark", async ({ page }) => {
    await page.goto(
      "/storybook/iframe.html?id=shared-uisidebarnav--default&viewMode=story",
    );
    await expect(page.locator("nav")).toBeVisible();
  });

  test("active item has aria-current=page", async ({ page }) => {
    await page.goto(
      "/storybook/iframe.html?id=shared-uisidebarnav--default&viewMode=story",
    );
    await expect(page.locator("[aria-current='page']")).toHaveCount(1);
  });

  test("inactive items do not have aria-current", async ({ page }) => {
    await page.goto(
      "/storybook/iframe.html?id=shared-uisidebarnav--default&viewMode=story",
    );
    const links = page.locator("nav a");
    const count = await links.count();
    // Only the active item should have aria-current
    let ariaCurrentCount = 0;
    for (let i = 0; i < count; i++) {
      const ariaCurrent = await links.nth(i).getAttribute("aria-current");
      if (ariaCurrent === "page") {
        ariaCurrentCount++;
      }
    }
    expect(ariaCurrentCount).toBe(1);
  });

  test("collapsed nav shows icon-only items", async ({ page }) => {
    await page.goto(
      "/storybook/iframe.html?id=shared-uisidebarnav--collapsed&viewMode=story",
    );
    const labels = page.locator(".ui-sidebar-nav-item__label");
    await expect(labels).toHaveCount(0);
  });
});
