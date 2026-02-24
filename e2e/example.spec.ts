import { test, expect } from "@playwright/test";

/**
 * Teste E2E de sanidade — auraxis-web
 * Verifica que a aplicação carrega e responde corretamente.
 *
 * Remover / substituir por testes reais quando as páginas forem implementadas.
 */
test.describe("Sanity check", () => {
  test("homepage loads and has correct title", async ({ page }) => {
    await page.goto("/");
    // Ajustar conforme o <title> real da aplicação
    await expect(page).toHaveTitle(/Auraxis/);
  });

  test("returns HTTP 200 on root", async ({ request }) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);
  });
});
