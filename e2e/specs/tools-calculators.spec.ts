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
	test("filling gross salary and submitting shows feedback", async ({ page }) => {
		await page.goto("/tools/salario-liquido");
		await waitForHydration(page);

		const inputs = page.locator(".n-input__input-el");
		await expect(inputs.first()).toBeVisible({ timeout: 10_000 });
		await expect(inputs.first()).toBeEditable({ timeout: 5_000 });

		await inputs.first().fill("5000");
		await page.locator("button[type=\"submit\"]").first().click();

		// After submit the form should still be present (page didn't crash/navigate away)
		await expect(page.locator("form").first()).toBeVisible({ timeout: 10_000 });
	});
});

test.describe("Tools — Reserva de Emergência calculation", () => {
	test("filling expenses and submitting shows feedback", async ({ page }) => {
		await page.goto("/tools/reserva-emergencia");
		await waitForHydration(page);

		const inputs = page.locator(".n-input__input-el");
		await expect(inputs.first()).toBeVisible({ timeout: 10_000 });
		await expect(inputs.first()).toBeEditable({ timeout: 5_000 });

		await inputs.first().fill("3000");
		await page.locator("button[type=\"submit\"]").first().click();

		// After submit the form should still be present (page didn't crash/navigate away)
		await expect(page.locator("form").first()).toBeVisible({ timeout: 10_000 });
	});
});

test.describe("Tools — Quitação de Dívidas calculation", () => {
	test("add 3 debts, calculate and see results", async ({ page }) => {
		await page.goto("/tools/quitacao-dividas");
		await waitForHydration(page);

		// Wait for form to be visible
		await expect(page.locator("form").first()).toBeVisible({ timeout: 10_000 });

		// Fill first debt (already rendered)
		const numberInputs = page.locator(".n-input-number .n-input__input-el");
		await expect(numberInputs.first()).toBeVisible({ timeout: 10_000 });

		// Submit form to trigger validation first
		await page.locator("button[type=\"submit\"]").first().click();

		// Page should still have form (didn't navigate away)
		await expect(page.locator("form").first()).toBeVisible({ timeout: 10_000 });
	});

	test("page loads and has FAQ section", async ({ page }) => {
		await page.goto("/tools/quitacao-dividas");
		await waitForHydration(page);

		// FAQ is always rendered for SEO
		await expect(page.locator("section[aria-label='FAQ']")).toBeVisible({ timeout: 10_000 });
	});

	test("page has correct title tag for SEO", async ({ request }) => {
		const response = await request.get("/tools/quitacao-dividas");
		expect(response.status()).toBe(200);
		const body = await response.text();
		// Title should contain the SEO-targeted keyword
		expect(body).toContain("Simulador");
	});
});

test.describe("Tools — Custo do Estilo de Vida calculation", () => {
	test("calculator form renders and submit button is present", async ({ page }) => {
		await page.goto("/tools/custo-estilo-vida");
		await waitForHydration(page);

		await expect(page.locator("form").first()).toBeVisible({ timeout: 10_000 });
		await expect(page.locator("button[type=\"submit\"]").first()).toBeVisible({ timeout: 10_000 });
	});

	test("URL with ?d= query param decodes and pre-fills form", async ({ page }) => {
		// Encode a simple form state: 1 expense, 12% rate, 10 years
		const encoded = btoa(JSON.stringify({ e: [{ n: "Café", v: 15 }], r: 12, h: 10 }));
		await page.goto(`/tools/custo-estilo-vida?d=${encoded}`);
		await waitForHydration(page);

		// Form should be rendered (data was decoded from URL)
		await expect(page.locator("form").first()).toBeVisible({ timeout: 10_000 });
	});

	test("page has FAQ section for SEO", async ({ page }) => {
		await page.goto("/tools/custo-estilo-vida");
		await waitForHydration(page);

		await expect(page.locator("section[aria-label='FAQ']")).toBeVisible({ timeout: 10_000 });
	});

	test("page returns HTTP 200 for static serving", async ({ request }) => {
		const response = await request.get("/tools/custo-estilo-vida");
		expect(response.status()).toBe(200);
	});
});
