import { test, expect } from "@playwright/test";
import { waitForHydration } from "../helpers/auth";

/**
 * E2E suite: New financial calculator tool pages.
 *
 * All tool pages are publicly accessible (no auth required).
 * Each test verifies the page loads, the form is rendered,
 * and the "Calcular" button is present.
 */

const CALCULATOR_PAGES = [
	{ slug: "salario-liquido", label: "Salário Líquido" },
	{ slug: "cet", label: "CET" },
	{ slug: "reserva-emergencia", label: "Reserva de Emergência" },
	{ slug: "orcamento-50-30-20", label: "Orçamento 50-30-20" },
	{ slug: "quitacao-dividas", label: "Quitação de Dívidas" },
	{ slug: "custo-estilo-vida", label: "Custo do Estilo de Vida" },
] as const;

for (const { slug, label } of CALCULATOR_PAGES) {
	test.describe(`Tools — ${label}`, () => {
		test(`${slug} page loads for guest user`, async ({ page }) => {
			const response = await page.goto(`/tools/${slug}`);
			expect(response?.status()).toBe(200);
			await waitForHydration(page);
			await expect(page.locator("form").first()).toBeVisible({ timeout: 10_000 });
		});

		test(`${slug} has a submit button`, async ({ page }) => {
			await page.goto(`/tools/${slug}`);
			await waitForHydration(page);

			const btn = page.locator("button[type=\"submit\"]").first();
			await expect(btn).toBeVisible({ timeout: 10_000 });
		});
	});
}

test.describe("Tools — Salário Líquido calculation", () => {
	test("filling gross salary and submitting renders result", async ({ page }) => {
		await page.goto("/tools/salario-liquido");
		await waitForHydration(page);

		const inputs = page.locator(".n-input__input-el");
		await expect(inputs.first()).toBeVisible({ timeout: 10_000 });
		await expect(inputs.first()).toBeEditable({ timeout: 5_000 });

		// Fill gross salary (first input)
		await inputs.first().fill("5000");

		await page.locator("button[type=\"submit\"]").first().click();

		// Result section should appear with deduction breakdown
		await expect(
			page.locator("[class*='result'], [data-testid*='result']").first(),
		).toBeVisible({ timeout: 15_000 });
	});
});

test.describe("Tools — Reserva de Emergência calculation", () => {
	test("filling expenses and submitting renders result", async ({ page }) => {
		await page.goto("/tools/reserva-emergencia");
		await waitForHydration(page);

		const inputs = page.locator(".n-input__input-el");
		await expect(inputs.first()).toBeVisible({ timeout: 10_000 });
		await expect(inputs.first()).toBeEditable({ timeout: 5_000 });

		// Fill monthly expenses (first input)
		await inputs.first().fill("3000");

		await page.locator("button[type=\"submit\"]").first().click();

		await expect(
			page.locator("[class*='result'], [data-testid*='result']").first(),
		).toBeVisible({ timeout: 15_000 });
	});
});
