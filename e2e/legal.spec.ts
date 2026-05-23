import { expect, test } from "@playwright/test";

const LEGAL_PAGES = [
  {
    path: "/privacy",
    heading: "Política de Privacidade",
    expectedText: "não usa dados do usuário para treinar modelos próprios",
    relatedHref: "/cookies",
  },
  {
    path: "/terms",
    heading: "Termos de Uso",
    expectedText: "não autoriza provedores de IA a treinarem modelos",
    relatedHref: "/cookies",
  },
  {
    path: "/cookies",
    heading: "Política de Cookies",
    expectedText: "não devem ser carregados antes do consentimento",
    relatedHref: "/privacy",
  },
];

test.describe("Legal public pages", () => {
  for (const legalPage of LEGAL_PAGES) {
    test(`${legalPage.path} renders legal v2 content and related links`, async ({ page }) => {
      const response = await page.goto(legalPage.path);

      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { name: legalPage.heading, level: 1 })).toBeVisible();
      await expect(page.getByText(legalPage.expectedText)).toBeVisible();
      await expect(page.locator(`a[href="${legalPage.relatedHref}"]`).first()).toBeVisible();
    });
  }
});
