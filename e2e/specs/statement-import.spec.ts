/**
 * Import de extrato em PDF, ponta a ponta.
 *
 * O que estes cenários protegem é o comportamento que não pode regredir sem
 * alguém perder dinheiro de vista: confirmar com conflito pendente, importar
 * uma transferência por engano, e receber "algo deu errado" onde havia uma
 * explicação possível.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

import { loginAndVisit, mockAuthenticatedSession } from "../helpers/mock-session";

test.describe.configure({ mode: "serial" });

const UPLOAD_URL = "**/v2/bank-import/statements/upload";
const CONFIRM_URL = "**/v2/bank-import/statements/*/confirm";

/**
 * Monta uma linha da prévia.
 *
 * @param overrides Campos a sobrescrever.
 * @returns A linha, no formato do backend.
 */
const entry = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  line_index: 1,
  page_number: 1,
  kind: "transaction",
  posting_date: "2026-03-04",
  transaction_date: null,
  raw_description: "PIX QRS MERCADO CENTRAL",
  normalized_description: "pix qrs mercado central",
  amount: "-45.90",
  balance: null,
  currency: "BRL",
  direction: "debit",
  movement_type: "pix",
  counterparty_name: "mercado central",
  financial_nature: "expense",
  suggested_category: "alimentacao",
  confidence: "0.850",
  rationale: "Compra em mercado.",
  needs_review: false,
  recurrence_hint: false,
  is_neutral_nature: false,
  match_status: "unique",
  matched_transaction_id: null,
  match_score: "0.000",
  match_evidence: {
    agreed: [],
    diverged: [],
    day_difference: null,
    reason: "",
    alternatives: 0,
    already_imported: false,
  },
  previous_decision: null,
  fingerprint: "fp-1",
  prefix_hash: "px-1",
  ...overrides,
});

/**
 * Monta a resposta do upload.
 *
 * @param entries Linhas da prévia.
 * @returns O corpo da resposta.
 */
const previewBody = (entries: Record<string, unknown>[]): Record<string, unknown> => ({
  preview_token: "tok-1",
  expires_at: "2030-01-01T00:00:00Z",
  file_type: "pdf",
  bank_id: "itau",
  account_id: "acc-1",
  holder_name: "MARIA FICTICIA",
  period_start: "2026-03-01",
  period_end: "2026-03-07",
  page_count: 2,
  file_sha256: "sha",
  already_imported_file: false,
  blocked_by_conflicts: entries.some((item) => item.match_status === "conflict"),
  summary: {
    total_extracted: entries.length,
    movements: entries.length,
    balance_markers: 0,
    new_count: entries.length,
    exact_duplicates: 0,
    likely_duplicates: 0,
    possible_duplicates: 0,
    conflicts: entries.filter((item) => item.match_status === "conflict").length,
    needs_review: 0,
    credit_total: "0.00",
    debit_total: "45.90",
    transfer_total: "1300.00",
    rejected_lines: 0,
  },
  entries,
  rejected: [],
});

let uploadStatus = 200;
let uploadResponse: unknown = previewBody([entry()]);

/**
 * Instala os mocks de rede desta suíte.
 *
 * Registrado por teste, e não uma vez num contexto compartilhado: as rotas
 * vivem no contexto do browser, e um contexto fechado leva os mocks junto.
 *
 * @param page Página do Playwright.
 */
const installRoutes = async (page: Page): Promise<void> => {
  await page.route("**/accounts**", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { accounts: [{ id: "acc-1", name: "Itau CC", institution: "Itau" }] },
      }),
    }),
  );
  await page.route(UPLOAD_URL, (route: Route) =>
    route.fulfill({
      status: uploadStatus,
      contentType: "application/json",
      body: JSON.stringify(uploadResponse),
    }),
  );
  await page.route(CONFIRM_URL, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        imported_count: 1,
        linked_count: 0,
        ignored_count: 0,
        skipped_count: 0,
        errors: [],
      }),
    }),
  );
};

/**
 * Abre a página de import já na aba de PDF.
 *
 * A aba usa `display-directive="if"`, então nada dentro dela existe no DOM
 * antes do clique — o que é deliberado, para uma prévia esquecida na aba
 * escondida não consumir cota.
 *
 * @param page Página do Playwright.
 */
const openStatementTab = async (page: Page): Promise<void> => {
  await mockAuthenticatedSession(page);
  // Depois do helper de sessão, nunca antes: no Playwright a rota registrada
  // por último vence, e o catch-all de `localhost:5000` do helper engoliria
  // estes mocks.
  await installRoutes(page);
  await loginAndVisit(page, "/transactions/import");
  const tab = page.getByTestId("import-tab-statement");
  if (await tab.isVisible().catch(() => false)) {
    await tab.click();
  }
};

/**
 * Escolhe a conta e sobe o arquivo.
 *
 * @param page Página do Playwright.
 */
const uploadStatement = async (page: Page): Promise<void> => {
  await page.getByTestId("statement-account-select").click();
  // A opção do NSelect é uma div com classe própria, não um `role="option"`.
  await page.locator(".n-base-select-option").first().click();
  await page.getByTestId("statement-account-confirm").click();
  await page.getByTestId("import-file-input").setInputFiles({
    name: "extrato.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 fake"),
  });
  await page.waitForResponse((response) => response.url().includes("/statements/upload"));
};

test.describe("Import de extrato em PDF", () => {
  test("pede a conta antes do arquivo", async ({ page }) => {
    await openStatementTab(page);

    await expect(page.getByTestId("statement-account-picker")).toBeVisible();
  });

  test("mostra os totais com transferências separadas", async ({ page }) => {
    // Quem moveu dinheiro entre as próprias contas e vê isso somado aos gastos
    // para de confiar nos números.
    uploadStatus = 200;
    uploadResponse = previewBody([entry()]);
    await openStatementTab(page);
    await uploadStatement(page);

    await expect(page.getByTestId("statement-summary-transfers")).toBeVisible();
    await expect(page.getByTestId("statement-summary-transfer-notice")).toBeVisible();
  });

  test("bloqueia a confirmação com conflito pendente", async ({ page }) => {
    uploadResponse = previewBody([entry({ match_status: "conflict" })]);
    await openStatementTab(page);
    await uploadStatement(page);

    await expect(page.getByTestId("statement-confirm")).toBeDisabled();
    await expect(page.getByTestId("statement-summary-conflicts")).toBeVisible();
  });

  test("abre a comparação e permite usar a transação existente", async ({ page }) => {
    uploadResponse = previewBody([
      entry({
        match_status: "likely",
        matched_transaction_id: "tx-9",
        match_score: "0.820",
        match_evidence: {
          agreed: ["amount", "date", "description"],
          diverged: ["counterparty"],
          day_difference: 1,
          reason: "Valor, direção e data próximos.",
          alternatives: 0,
          already_imported: false,
        },
      }),
    ]);
    await openStatementTab(page);
    await uploadStatement(page);

    await page.getByTestId("statement-inspect-1").click();
    await expect(page.getByTestId("statement-duplicate-modal")).toBeVisible();
    await expect(page.getByTestId("statement-duplicate-agreed")).toBeVisible();
    await expect(page.getByTestId("statement-duplicate-days")).toBeVisible();

    await page.getByTestId("statement-duplicate-link").click();

    await expect(page.getByTestId("statement-summary-linked")).toContainText("1");
  });

  test("explica um PDF escaneado", async ({ page }) => {
    uploadStatus = 422;
    // Espelha o envelope real do api-v2: `code` é o que o interceptor lê para
    // normalizar o erro, `error` fica para os clientes que já liam a string.
    uploadResponse = {
      error: "STATEMENT_PDF_SCANNED",
      code: "STATEMENT_PDF_SCANNED",
      message: "Este PDF é uma imagem escaneada, sem texto selecionável.",
    };
    await openStatementTab(page);

    await page.getByTestId("statement-account-select").click();
    await page.locator(".n-base-select-option").first().click();
    await page.getByTestId("statement-account-confirm").click();
    await page.getByTestId("import-file-input").setInputFiles({
      name: "extrato.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 fake"),
    });

    const shown = await page
      .locator("[data-testid^='statement-error-']")
      .first()
      .getAttribute("data-testid");
    expect(shown).toBe("statement-error-scanned");
    uploadStatus = 200;
  });

  test("permite navegar pelos filtros com o teclado", async ({ page }) => {
    uploadResponse = previewBody([entry()]);
    await openStatementTab(page);
    await uploadStatement(page);

    await page.getByTestId("statement-filter-transfers").focus();
    await expect(page.getByTestId("statement-filter-transfers")).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page.getByTestId("statement-filter-transfers")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
