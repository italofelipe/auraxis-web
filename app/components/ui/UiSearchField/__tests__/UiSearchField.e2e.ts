// TODO: requires Storybook server running
import { test, expect } from "@playwright/test";

test.describe("UiSearchField", () => {
  test("shows clear button and clears value", async ({ page }) => {
    await page.goto("/storybook/iframe.html?id=shared-uisearchfield--default&viewMode=story");
    const input = page.locator("input[type=\"search\"]");
    await input.fill("teste");
    const clearBtn = page.locator("button[aria-label=\"Limpar busca\"]");
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await expect(input).toHaveValue("");
    await expect(clearBtn).not.toBeVisible();
  });

  test("clear button not visible when input is empty", async ({ page }) => {
    await page.goto("/storybook/iframe.html?id=shared-uisearchfield--default&viewMode=story");
    await expect(page.locator("button[aria-label=\"Limpar busca\"]")).not.toBeVisible();
  });
});
