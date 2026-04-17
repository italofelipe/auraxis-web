import { test, expect } from "@playwright/test";
import { waitForHydration } from "../helpers/auth";

/**
 * E2E suite: Mobile viewport — responsive layout checks.
 *
 * Verifies key pages render correctly at mobile (375x667) and tablet (768x1024)
 * viewports. No auth required for public pages.
 */

test.describe("Mobile viewport — public pages", () => {
	test.use({ viewport: { width: 375, height: 667 } });

	test("login page renders correctly on mobile", async ({ page }) => {
		await page.goto("/login");
		await waitForHydration(page);

		// Login form should be visible and not overflow
		const form = page.locator("form").first();
		await expect(form).toBeVisible({ timeout: 10_000 });

		// Form should fit within viewport width
		const formBox = await form.boundingBox();
		expect(formBox).not.toBeNull();
		expect(formBox!.width).toBeLessThanOrEqual(375);
	});

	test("tools catalog page renders on mobile", async ({ page }) => {
		await page.goto("/tools");
		await waitForHydration(page);

		// Tool cards should be visible
		const toolLinks = page.locator("a[href*='/tools/']");
		await expect(toolLinks.first()).toBeVisible({ timeout: 10_000 });
	});

	test("juros-compostos calculator works on mobile", async ({ page }) => {
		await page.goto("/tools/juros-compostos");
		await waitForHydration(page);

		const form = page.locator("form").first();
		await expect(form).toBeVisible({ timeout: 10_000 });

		const submitBtn = page.locator("button[type=\"submit\"]").first();
		await expect(submitBtn).toBeVisible({ timeout: 10_000 });
	});
});

test.describe("Tablet viewport — public pages", () => {
	test.use({ viewport: { width: 768, height: 1024 } });

	test("tools page renders correctly on tablet", async ({ page }) => {
		await page.goto("/tools");
		await waitForHydration(page);

		const toolLinks = page.locator("a[href*='/tools/']");
		await expect(toolLinks.first()).toBeVisible({ timeout: 10_000 });
	});

	test("login page renders correctly on tablet", async ({ page }) => {
		await page.goto("/login");
		await waitForHydration(page);

		await expect(page.locator("form").first()).toBeVisible({ timeout: 10_000 });
	});
});
