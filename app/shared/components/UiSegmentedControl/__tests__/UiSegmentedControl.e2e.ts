// TODO: requires Storybook server running
import { test, expect } from "@playwright/test";

test.describe("UiSegmentedControl", () => {
  test("selects option on click and updates aria-pressed", async ({ page }) => {
    await page.goto("/storybook/iframe.html?id=shared-uisegmentedcontrol--default&viewMode=story");
    await page.click("button:has-text(\"Semana\")");
    await expect(page.locator("button:has-text(\"Semana\")")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("button:has-text(\"Dia\")")).toHaveAttribute("aria-pressed", "false");
  });
});
