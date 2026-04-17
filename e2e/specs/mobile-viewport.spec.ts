import { test, expect } from "@playwright/test";
import { waitForHydration } from "../helpers/auth";

/**
 * E2E suite: Mobile viewport — responsive layout checks.
 *
 * Verifies key public pages render correctly at mobile (375x667) and tablet
 * (768x1024) viewports. Only tests pages that do NOT require authentication.
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

	test("juros-compostos calculator works on mobile", async ({ page }) => {
		await page.goto("/tools/juros-compostos");
		await waitForHydration(page);

		const form = page.locator("form").first();
		await expect(form).toBeVisible({ timeout: 10_000 });

		const submitBtn = page.locator("button[type=\"submit\"]").first();
		await expect(submitBtn).toBeVisible({ timeout: 10_000 });
	});

	test("register page renders on mobile", async ({ page }) => {
		await page.goto("/register");
		await waitForHydration(page);

		await expect(page.locator("form").first()).toBeVisible({ timeout: 10_000 });
	});
});

test.describe("Tablet viewport — public pages", () => {
	test.use({ viewport: { width: 768, height: 1024 } });

	test("login page renders correctly on tablet", async ({ page }) => {
		await page.goto("/login");
		await waitForHydration(page);

		await expect(page.locator("form").first()).toBeVisible({ timeout: 10_000 });
	});

	test("juros-compostos page renders on tablet", async ({ page }) => {
		await page.goto("/tools/juros-compostos");
		await waitForHydration(page);

		await expect(page.locator("form").first()).toBeVisible({ timeout: 10_000 });
	});
});
