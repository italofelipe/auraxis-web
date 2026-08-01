import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test, type Page } from "@playwright/test";

import { loginAndVisit, mockAuthenticatedSession } from "../helpers/mock-session";

const FIXTURE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures/extrato.csv",
);

const DETECT_BODY = {
  success: true,
  data: {
    file_type: "csv",
    sheet_names: [],
    active_sheet: null,
    headers: ["Data", "Descrição", "Valor", "Tipo"],
    sample_rows: [["01/07/2026", "Mercado do bairro", "149,90", "saida"]],
    suggested_mapping: {
      date_column: "Data",
      description_column: "Descrição",
      amount_column: "Valor",
      type_column: "Tipo",
    },
    confidence: {
      date_column: 0.98,
      description_column: 0.91,
      amount_column: 0.95,
      type_column: 0.88,
    },
  },
};

/**
 * Monta uma linha do preview no formato cru do backend.
 *
 * @param overrides Campos a sobrescrever.
 * @returns Linha do preview.
 */
const draft = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: "d1",
  date: "2026-07-01",
  description: "Mercado do bairro",
  amount: "149.90",
  transaction_type: "expense",
  category: "alimentacao",
  confidence: 0.93,
  is_duplicate: false,
  missing_fields: [],
  ...overrides,
});

/**
 * Monta o corpo do preview servido ao wizard.
 *
 * @param overrides Campos do `data` a sobrescrever.
 * @returns Envelope de preview.
 */
const previewBody = (overrides: Record<string, unknown> = {}): unknown => ({
  success: true,
  data: {
    preview_token: "tok-e2e",
    expires_at: "2026-07-31T23:59:00Z",
    file_type: "csv",
    total_count: 3,
    duplicates_count: 1,
    incomplete_count: 0,
    transactions: [
      draft(),
      draft({ id: "d2", description: "Salário", transaction_type: "income", amount: "5200.00" }),
      draft({ id: "d3", description: "Uber", amount: "31.40", is_duplicate: true }),
    ],
    rejected_rows: [],
    ...overrides,
  },
});

/**
 * Empacota um corpo como resposta JSON 200 para o Playwright.
 *
 * @param body Corpo da resposta.
 * @returns Descritor aceito por `route.fulfill`.
 */
const json = (body: unknown): { status: number; contentType: string; body: string } => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body),
});

/**
 * Deixa a página autenticada e com a API do import sob controle.
 *
 * O catch-all entra antes do helper de sessão de propósito: no Playwright a
 * rota registrada depois vence, e engolir `/auth/login` travaria o login.
 *
 * @param page Página do teste.
 * @param options Respostas de preview e confirm.
 * @param options.preview Corpo devolvido pelo preview.
 * @param options.confirm Corpo devolvido pelo confirm.
 * @param options.previewStatus Status HTTP do preview (para 429/422).
 */
const setupImportApi = async (
  page: Page,
  options: {
    preview?: unknown;
    confirm?: unknown;
    previewStatus?: number;
  } = {},
): Promise<void> => {
  await page.route("**/localhost:5000/**", (route) => route.fulfill(json({ success: true, data: null })));
  await page.route("**/localhost:8001/**", (route) => route.fulfill(json({ success: true, data: null })));

  await mockAuthenticatedSession(page);

  await page.route("**/v2/import/detect", (route) => route.fulfill(json(DETECT_BODY)));
  await page.route("**/v2/import/preview", (route) => {
    if (options.previewStatus && options.previewStatus !== 200) {
      return route.fulfill({
        status: options.previewStatus,
        contentType: "application/json",
        body: JSON.stringify({ detail: "erro" }),
      });
    }
    return route.fulfill(json(options.preview ?? previewBody()));
  });
  await page.route("**/v2/import/confirm", (route) =>
    route.fulfill(
      json(
        options.confirm ?? {
          success: true,
          data: { imported_count: 2, skipped_count: 1, errors: [] },
        },
      ),
    ),
  );
};

/**
 * Sobe o arquivo e espera a prévia aparecer.
 *
 * @param page Página do teste.
 */
const uploadFixture = async (page: Page): Promise<void> => {
  await page.setInputFiles("input[type=file]", FIXTURE);
  await expect(page.getByTestId("import-preview-table")).toBeVisible();
};

test.describe("Import de planilha", () => {
  test("importa um arquivo limpo do upload ao sucesso", async ({ page }) => {
    await setupImportApi(page);
    await loginAndVisit(page, "/transactions/import");
    await uploadFixture(page);

    // Duplicata entra desmarcada: 2 de 3.
    await expect(page.getByTestId("import-preview-summary")).toContainText("2 de 3");
    await expect(page.getByTestId("import-rejected-rows")).toHaveCount(0);
    await expect(page.getByTestId("import-incomplete-tag")).toHaveCount(0);

    const confirmRequest = page.waitForRequest("**/v2/import/confirm");
    await page.getByTestId("import-confirm").click();
    const body = JSON.parse((await confirmRequest).postData() ?? "{}") as {
      exclude_ids: string[];
      use_generic_placeholders: boolean;
    };

    expect(body.exclude_ids).toEqual(["d3"]);
    expect(body.use_generic_placeholders).toBe(false);
    await expect(page.getByTestId("import-result")).toBeVisible();
  });

  test("mostra as linhas que o parser não conseguiu ler", async ({ page }) => {
    await setupImportApi(page, {
      preview: previewBody({
        rejected_rows: [
          { line_number: 7, reason: "Data inválida: 31/02/2026" },
          { line_number: 14, reason: "Linha truncada" },
        ],
      }),
    });
    await loginAndVisit(page, "/transactions/import");
    await uploadFixture(page);

    const panel = page.getByTestId("import-rejected-rows");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("2 linhas não foram importadas");

    await panel.getByText("Ver quais linhas").click();
    await expect(panel).toContainText("Linha 7");
    await expect(panel).toContainText("Data inválida: 31/02/2026");
  });

  test("conferência bloqueia a conclusão até o dado que falta ser preenchido", async ({ page }) => {
    await setupImportApi(page, {
      preview: previewBody({
        duplicates_count: 0,
        incomplete_count: 2,
        transactions: [
          draft({ id: "d1", description: "", missing_fields: ["description"] }),
          draft({ id: "d2", description: "Farmácia", amount: "0", missing_fields: ["amount"] }),
        ],
      }),
    });
    await loginAndVisit(page, "/transactions/import");
    await uploadFixture(page);

    await expect(page.getByTestId("import-incomplete-tag")).toContainText("2");

    await page.getByTestId("import-confirm").click();

    const modal = page.getByTestId("import-review-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(
      "Antes de prosseguir, precisamos conferir se as informações estão corretas",
    );
    await expect(page.getByTestId("import-review-progress")).toContainText("0 de 2");
    // Bloqueio precisa de explicação textual, não só `disabled`.
    await expect(page.getByTestId("import-review-blocked-hint")).toBeVisible();
    await expect(page.getByTestId("import-review-submit")).toBeDisabled();

    await page.getByTestId("import-review-description-d1").fill("Mercado do bairro");
    await expect(page.getByTestId("import-review-submit")).toBeDisabled();

    await page.getByTestId("import-review-amount-d2").fill("149,90");
    await expect(page.getByTestId("import-review-progress")).toContainText("2 de 2");
    await expect(page.getByTestId("import-review-submit")).toBeEnabled();

    const confirmRequest = page.waitForRequest("**/v2/import/confirm");
    await page.getByTestId("import-review-submit").click();
    const body = JSON.parse((await confirmRequest).postData() ?? "{}") as {
      completions: Record<string, Record<string, string>>;
    };

    expect(body.completions).toEqual({
      d1: { description: "Mercado do bairro" },
      d2: { amount: "149,90" },
    });
    await expect(page.getByTestId("import-result")).toBeVisible();
  });

  test("terminar depois grava genéricos e volta ao preenchimento quando o usuário recusa", async ({
    page,
  }) => {
    await setupImportApi(page, {
      preview: previewBody({
        duplicates_count: 0,
        incomplete_count: 1,
        transactions: [draft({ id: "d1", description: "", missing_fields: ["description"] })],
      }),
    });
    await loginAndVisit(page, "/transactions/import");
    await uploadFixture(page);
    await page.getByTestId("import-confirm").click();
    await page.getByTestId("import-review-finish-later").click();

    const finishLater = page.getByTestId("import-finish-later-modal");
    await expect(finishLater).toBeVisible();
    await expect(finishLater).toContainText(
      "Caso queira terminar de cadastrar suas transações posteriormente",
    );

    // Recusar devolve o usuário ao preenchimento.
    await page.getByTestId("import-finish-later-cancel").click();
    await expect(finishLater).toBeHidden();
    await expect(page.getByTestId("import-review-modal")).toBeVisible();

    await page.getByTestId("import-review-finish-later").click();
    const confirmRequest = page.waitForRequest("**/v2/import/confirm");
    await page.getByTestId("import-finish-later-confirm").click();
    const body = JSON.parse((await confirmRequest).postData() ?? "{}") as {
      use_generic_placeholders: boolean;
    };

    expect(body.use_generic_placeholders).toBe(true);
    await expect(page.getByTestId("import-result")).toBeVisible();
  });

  test("desmarcar a linha incompleta dispensa a conferência", async ({ page }) => {
    await setupImportApi(page, {
      preview: previewBody({
        duplicates_count: 0,
        incomplete_count: 1,
        transactions: [
          draft({ id: "d1", description: "", missing_fields: ["description"] }),
          draft({ id: "d2", description: "Salário", transaction_type: "income" }),
        ],
      }),
    });
    await loginAndVisit(page, "/transactions/import");
    await uploadFixture(page);

    await page.getByTestId("import-row-toggle-d1").click();
    await page.getByTestId("import-confirm").click();

    // Desmarcar já é uma resposta válida para "não quero essa transação".
    await expect(page.getByTestId("import-review-modal")).toHaveCount(0);
    await expect(page.getByTestId("import-result")).toBeVisible();
  });

  test("cota gratuita esgotada abre o convite ao Premium", async ({ page }) => {
    await setupImportApi(page, { previewStatus: 429 });
    await loginAndVisit(page, "/transactions/import");

    await page.setInputFiles("input[type=file]", FIXTURE);

    await expect(page.getByTestId("import-upsell")).toBeVisible();
  });

  test("prévia expirada oferece reenviar o arquivo", async ({ page }) => {
    await setupImportApi(page, { previewStatus: 422 });
    await loginAndVisit(page, "/transactions/import");

    await page.setInputFiles("input[type=file]", FIXTURE);

    await expect(page.getByTestId("import-expired")).toBeVisible();
  });

  test("erros por linha do confirm aparecem na tela de sucesso", async ({ page }) => {
    await setupImportApi(page, {
      confirm: {
        success: true,
        data: {
          imported_count: 1,
          skipped_count: 1,
          errors: [{ draft_id: "d2", reason: "valor inválido" }],
        },
      },
    });
    await loginAndVisit(page, "/transactions/import");
    await uploadFixture(page);
    await page.getByTestId("import-confirm").click();

    await expect(page.getByTestId("import-result-errors")).toBeVisible();
    await expect(page.getByTestId("import-result-errors")).toContainText("valor inválido");
  });
});
