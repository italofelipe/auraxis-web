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

const DEFAULT_CONFIRM = {
  success: true,
  data: { imported_count: 2, skipped_count: 1, errors: [] },
};

/**
 * Empacota um corpo como resposta JSON para o Playwright.
 *
 * @param body Corpo da resposta.
 * @param status Status HTTP.
 * @returns Descritor aceito por `route.fulfill`.
 */
const json = (
  body: unknown,
  status = 200,
): { status: number; contentType: string; body: string } => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

// Um login por projeto, não por teste: `loginAndVisit` passa pelo formulário, e
// repetir isso oito vezes em dois projetos torna a suíte lenta e frágil sob a
// carga do CI. Os cenários mudam só o corpo das respostas, que vive em variável
// lida pela rota registrada uma única vez.
test.describe.configure({ mode: "serial" });

test.describe("Import de planilha", () => {
  let page: Page;
  let previewStatus = 200;
  let previewResponse: unknown = previewBody();
  let confirmResponse: unknown = DEFAULT_CONFIRM;
  let lastConfirmBody: Record<string, unknown> = {};

  /**
   * Devolve o wizard ao passo inicial usando os próprios controles da tela.
   *
   * Nada de navegar para outra rota entre os testes: `/transactions` consome a
   * query de tags, o mock devolve um envelope sem lista e a página estoura com
   * `(tags.value ?? []).map is not a function` — o app fica degradado e o
   * `change` do input nunca é processado.
   */
  const resetWizard = async (): Promise<void> => {
    for (const testId of ["import-import-another", "import-start-over"]) {
      const button = page.getByTestId(testId);
      if ((await button.count()) > 0 && (await button.isVisible())) {
        await button.click();
        break;
      }
    }
    await expect(page.getByTestId("import-pick-file")).toBeVisible();
    await expect(page.getByTestId("import-file-input")).toHaveCount(1);
  };

  /**
   * Sobe o arquivo e espera a prévia aparecer.
   *
   * Espera as duas respostas da API antes de olhar para a tela: o viewport
   * mobile do CI leva mais que o timeout padrão de 5s do `expect` para
   * encadear detect + preview, e a falha apareceria como "elemento não
   * encontrado" em vez de apontar a chamada que ainda estava em curso.
   */
  const uploadFixture = async (): Promise<void> => {
    const detected = page.waitForResponse("**/v2/import/detect");
    const previewed = page.waitForResponse("**/v2/import/preview");
    await page.getByTestId("import-file-input").setInputFiles(FIXTURE);
    await detected;
    await previewed;
    await expect(page.getByTestId("import-preview-table")).toBeVisible({
      timeout: 15_000,
    });
  };

  /**
   * Dispara a ação que confirma o import e espera a resposta da API.
   *
   * @param action Interação que chama o `confirm`.
   */
  const confirmAndWait = async (action: () => Promise<void>): Promise<void> => {
    const confirmed = page.waitForResponse("**/v2/import/confirm");
    await action();
    await confirmed;
  };

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    // Catch-all antes do helper de propósito: no Playwright a rota registrada
    // depois vence, e engolir `/auth/login` travaria o login.
    await page.route("**/localhost:5000/**", (route) =>
      route.fulfill(json({ success: true, data: null })),
    );
    await page.route("**/localhost:8001/**", (route) =>
      route.fulfill(json({ success: true, data: null })),
    );

    await mockAuthenticatedSession(page);

    await page.route("**/v2/import/detect", (route) => route.fulfill(json(DETECT_BODY)));
    await page.route("**/v2/import/preview", (route) =>
      route.fulfill(
        previewStatus === 200
          ? json(previewResponse)
          : json({ detail: "erro" }, previewStatus),
      ),
    );
    await page.route("**/v2/import/confirm", (route) => {
      lastConfirmBody = JSON.parse(route.request().postData() ?? "{}") as Record<
        string,
        unknown
      >;
      return route.fulfill(json(confirmResponse));
    });

    await loginAndVisit(page, "/transactions/import");
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.beforeEach(async () => {
    previewStatus = 200;
    previewResponse = previewBody();
    confirmResponse = DEFAULT_CONFIRM;
    lastConfirmBody = {};
    await resetWizard();
  });

  test("importa um arquivo limpo do upload ao sucesso", async () => {
    await uploadFixture();

    // Duplicata entra desmarcada: 2 de 3.
    await expect(page.getByTestId("import-preview-summary")).toContainText("2 de 3");
    await expect(page.getByTestId("import-rejected-rows")).toHaveCount(0);
    await expect(page.getByTestId("import-incomplete-tag")).toHaveCount(0);

    await confirmAndWait(() => page.getByTestId("import-confirm").click());
    await expect(page.getByTestId("import-result")).toBeVisible({ timeout: 15_000 });

    expect(lastConfirmBody.exclude_ids).toEqual(["d3"]);
    expect(lastConfirmBody.use_generic_placeholders).toBe(false);
  });

  test("mostra as linhas que o parser não conseguiu ler", async () => {
    previewResponse = previewBody({
      rejected_rows: [
        { line_number: 7, reason: "Data inválida: 31/02/2026" },
        { line_number: 14, reason: "Linha truncada" },
      ],
    });

    await uploadFixture();

    const panel = page.getByTestId("import-rejected-rows");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("2 linhas não foram importadas");

    await panel.getByText("Ver quais linhas").click();
    await expect(panel).toContainText("Linha 7");
    await expect(panel).toContainText("Data inválida: 31/02/2026");
  });

  test("conferência bloqueia a conclusão até o dado que falta ser preenchido", async () => {
    previewResponse = previewBody({
      duplicates_count: 0,
      incomplete_count: 2,
      transactions: [
        draft({ id: "d1", description: "", missing_fields: ["description"] }),
        draft({ id: "d2", description: "Farmácia", amount: "0", missing_fields: ["amount"] }),
      ],
    });

    await uploadFixture();
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

    await confirmAndWait(() => page.getByTestId("import-review-submit").click());
    await expect(page.getByTestId("import-result")).toBeVisible({ timeout: 15_000 });

    expect(lastConfirmBody.completions).toEqual({
      d1: { description: "Mercado do bairro" },
      d2: { amount: "149,90" },
    });
  });

  test("terminar depois grava genéricos e volta ao preenchimento quando o usuário recusa", async () => {
    previewResponse = previewBody({
      duplicates_count: 0,
      incomplete_count: 1,
      transactions: [draft({ id: "d1", description: "", missing_fields: ["description"] })],
    });

    await uploadFixture();
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
    await confirmAndWait(() => page.getByTestId("import-finish-later-confirm").click());
    await expect(page.getByTestId("import-result")).toBeVisible({ timeout: 15_000 });

    expect(lastConfirmBody.use_generic_placeholders).toBe(true);
  });

  test("desmarcar a linha incompleta dispensa a conferência", async () => {
    previewResponse = previewBody({
      duplicates_count: 0,
      incomplete_count: 1,
      transactions: [
        draft({ id: "d1", description: "", missing_fields: ["description"] }),
        draft({ id: "d2", description: "Salário", transaction_type: "income" }),
      ],
    });

    await uploadFixture();
    await page.getByTestId("import-row-toggle-d1").click();
    await confirmAndWait(() => page.getByTestId("import-confirm").click());

    // Desmarcar já é uma resposta válida para "não quero essa transação".
    await expect(page.getByTestId("import-result")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("import-review-modal")).toHaveCount(0);
  });

  test("erros por linha do confirm aparecem na tela de sucesso", async () => {
    confirmResponse = {
      success: true,
      data: {
        imported_count: 1,
        skipped_count: 1,
        errors: [{ draft_id: "d2", reason: "valor inválido" }],
      },
    };

    await uploadFixture();
    await confirmAndWait(() => page.getByTestId("import-confirm").click());

    await expect(page.getByTestId("import-result-errors")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("import-result-errors")).toContainText("valor inválido");
  });

  test("cota gratuita esgotada abre o convite ao Premium", async () => {
    previewStatus = 429;

    const previewed = page.waitForResponse("**/v2/import/preview");
    await page.getByTestId("import-file-input").setInputFiles(FIXTURE);
    await previewed;

    await expect(page.getByTestId("import-upsell")).toBeVisible({ timeout: 15_000 });
  });

  test("prévia expirada oferece reenviar o arquivo", async () => {
    previewStatus = 422;

    const previewed = page.waitForResponse("**/v2/import/preview");
    await page.getByTestId("import-file-input").setInputFiles(FIXTURE);
    await previewed;

    await expect(page.getByTestId("import-expired")).toBeVisible({ timeout: 15_000 });
  });
});
