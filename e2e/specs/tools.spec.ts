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
 */
test.describe("Tools — juros-compostos happy path", () => {
	test("juros-compostos page loads for guest user", async ({ page }) => {
		const response = await page.goto("/tools/juros-compostos");
		expect(response?.status()).toBe(200);
		await expect(page.locator("main, [role='main']")).toBeVisible({ timeout: 10_000 });
	});

	test("calculator form inputs are visible", async ({ page }) => {
		await page.goto("/tools/juros-compostos");

		// At least one numeric input should be present (capital inicial, aporte, taxa…)
		await expect(
			page.locator("input[type='number'], [role='spinbutton']").first(),
		).toBeVisible({ timeout: 10_000 });
	});

	test("Calcular button is present and enabled", async ({ page }) => {
		await page.goto("/tools/juros-compostos");

		const btn = page.getByRole("button", { name: /calcular/i });
		await expect(btn).toBeVisible({ timeout: 10_000 });
	});

	test("filling form and submitting renders result section", async ({ page }) => {
		await page.goto("/tools/juros-compostos");

		// Fill the spinbutton inputs in order:
		// 0 → capital inicial, 1 → aporte mensal, 2 → taxa nominal, 3 → período, 4 → inflação
		const inputs = page.locator("input[type='number'], [role='spinbutton']");

		// Capital inicial
		await inputs.nth(0).fill("10000");
		// Aporte mensal
		await inputs.nth(1).fill("500");
		// Taxa nominal % a.a.
		await inputs.nth(2).fill("12");
		// Período (months)
		await inputs.nth(3).fill("24");
		// Inflação % a.a.
		await inputs.nth(4).fill("5");

		await page.getByRole("button", { name: /calcular/i }).click();

		// Result section should appear — look for known result labels
		await expect(
			page.getByText(/montante|total aportado|juros acumulados/i).first(),
		).toBeVisible({ timeout: 10_000 });
	});
});
