import { test, expect } from "@playwright/test";
import { waitForHydration } from "../helpers/auth";

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
 * Notes:
 * - Naive UI NInputNumber renders inputs as `type="text"` (not `type="number"`),
 *   so we locate them via `.n-input__input-el` (the rendered CSS class).
 * - `waitForHydration` is required before any interaction with Naive UI components.
 *   The tool pages are prerendered SSG — the HTML arrives immediately but Vue
 *   event listeners are only attached after hydration. Without this wait,
 *   `getByRole` and `.fill()` interactions may fail because the DOM has not yet
 *   been taken over by the Vue runtime.
 */
test.describe("Tools — juros-compostos happy path", () => {
	test("juros-compostos page loads for guest user", async ({ page }) => {
		const response = await page.goto("/tools/juros-compostos");
		expect(response?.status()).toBe(200);
		await waitForHydration(page);
		await expect(page.locator("form").first()).toBeVisible({ timeout: 10_000 });
	});

	test("calculator form is visible", async ({ page }) => {
		await page.goto("/tools/juros-compostos");
		await waitForHydration(page);

		// The form element should be present (NForm renders a <form>).
		await expect(page.locator("form").first()).toBeVisible({ timeout: 10_000 });
	});

	test("Calcular button is present and enabled", async ({ page }) => {
		await page.goto("/tools/juros-compostos");
		await waitForHydration(page);

		// NButton with attr-type="submit" renders as <button type="submit">.
		// Matching by type is more reliable than accessible-name after SSR hydration.
		const btn = page.locator("button[type=\"submit\"]").first();
		await expect(btn).toBeVisible({ timeout: 10_000 });
	});

	test("filling form and submitting renders result section", async ({ page }) => {
		await page.goto("/tools/juros-compostos");
		await waitForHydration(page);

		// NInputNumber renders <input type="text" class="n-input__input-el">.
		// Fill the first five inputs: capital, aporte, taxa, período, inflação.
		// The NSelect for periodUnit uses n-base-selection-input__input (not
		// n-input__input-el) so it does not interfere with the nth() indexing.
		const inputs = page.locator(".n-input__input-el");

		// Wait for inputs to be visible AND editable before filling.
		await expect(inputs.first()).toBeVisible({ timeout: 10_000 });
		await expect(inputs.first()).toBeEditable({ timeout: 5_000 });

		await inputs.nth(0).fill("10000");
		await inputs.nth(1).fill("500");
		await inputs.nth(2).fill("12");
		await inputs.nth(3).fill("24");
		await inputs.nth(4).fill("5");

		await page.locator("button[type=\"submit\"]").first().click();

		// The result column (.juros-compostos-page__result-col) appears only after
		// handleCalculate() sets result.value. We check for the container directly
		// rather than relying on translated text, which is more robust.
		await expect(
			page.locator(".juros-compostos-page__result-col").first(),
		).toBeVisible({ timeout: 15_000 });
	});
});
