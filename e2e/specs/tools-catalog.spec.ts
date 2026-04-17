import { test, expect } from "@playwright/test";
import { waitForHydration } from "../helpers/auth";

/**
 * E2E suite: Tools catalog (index) page.
 *
 * The /tools page lists all available calculators. It is publicly accessible.
 */

test.describe("Tools — Catalog page", () => {
	test("tools index page loads for guest user", async ({ page }) => {
		const response = await page.goto("/tools");
		expect(response?.status()).toBe(200);
		await waitForHydration(page);
	});

	test("catalog displays tool cards", async ({ page }) => {
		await page.goto("/tools");
		await waitForHydration(page);

		// Tool cards are rendered as links to individual tool pages
		const toolLinks = page.locator("a[href*='/tools/']");
		await expect(toolLinks.first()).toBeVisible({ timeout: 10_000 });

		// At least 10 tools should be listed
		const count = await toolLinks.count();
		expect(count).toBeGreaterThanOrEqual(10);
	});

	test("clicking a tool card navigates to the tool page", async ({ page }) => {
		await page.goto("/tools");
		await waitForHydration(page);

		const firstTool = page.locator("a[href*='/tools/']").first();
		await expect(firstTool).toBeVisible({ timeout: 10_000 });

		const href = await firstTool.getAttribute("href");
		await firstTool.click();

		await expect(page).toHaveURL(new RegExp(href!.replace(/\//g, "\\/")), {
			timeout: 10_000,
		});
	});

	test("catalog page has search or filter functionality", async ({ page }) => {
		await page.goto("/tools");
		await waitForHydration(page);

		// The catalog should have a search input or category filter
		const searchInput = page.locator(
			"input[type='search'], input[type='text'], .n-input__input-el",
		).first();
		await expect(searchInput).toBeVisible({ timeout: 10_000 });
	});
});
