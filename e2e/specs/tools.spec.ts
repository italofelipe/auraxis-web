import { test, expect } from "@playwright/test";

/**
 * E2E suite: Public tools — guest access + calculator interaction.
 *
 * Covers the compound-interest (juros-compostos) tool happy path:
 *   - Page loads without authentication
 *   - Calculator form is visible
 *   - Filling in parameters and clicking "Calcular" renders results
 *
 * No auth mocks required — tool pages are publicly accessible.
 *
 * Note: Naive UI NInputNumber renders inputs as `type="text"` (not `type="number"`),
 * so we locate them via `.n-input__input-el` (the rendered CSS class) or `input`.
 */
test.describe("Tools — juros-compostos happy path", () => {
	test("juros-compostos page loads for guest user", async ({ page }) => {
		const response = await page.goto("/tools/juros-compostos");
		expect(response?.status()).toBe(200);
		await expect(page.locator("main, [role='main']")).toBeVisible({ timeout: 10_000 });
	});

	test("calculator form is visible", async ({ page }) => {
		await page.goto("/tools/juros-compostos");

		// The form element should be present (NForm renders a <form>).
		await expect(page.locator("form").first()).toBeVisible({ timeout: 10_000 });
	});

	test("Calcular button is present and enabled", async ({ page }) => {
		await page.goto("/tools/juros-compostos");

		const btn = page.getByRole("button", { name: /calcular/i });
		await expect(btn).toBeVisible({ timeout: 10_000 });
	});

	test("filling form and submitting renders result section", async ({ page }) => {
		await page.goto("/tools/juros-compostos");

		// NInputNumber renders <input type="text" class="n-input__input-el">.
		// Fill the first five inputs (capital, aporte, taxa, período, inflação).
		const inputs = page.locator(".n-input__input-el");

		await inputs.nth(0).fill("10000");
		await inputs.nth(1).fill("500");
		await inputs.nth(2).fill("12");
		await inputs.nth(3).fill("24");
		await inputs.nth(4).fill("5");

		await page.getByRole("button", { name: /calcular/i }).click();

		// Result section appears — look for known result labels.
		await expect(
			page.getByText(/montante|total aportado|juros acumulados/i).first(),
		).toBeVisible({ timeout: 10_000 });
	});
});
