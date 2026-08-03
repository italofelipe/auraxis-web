import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test, type Page } from "@playwright/test";

import { loginAndVisit, mockAuthenticatedSession } from "../helpers/mock-session";

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), "../fixtures");
const OFX_FIXTURE = path.join(FIXTURES, "extrato.ofx");
const CSV_FIXTURE = path.join(FIXTURES, "extrato.csv");

/**
 * Monta uma linha do extrato no formato cru do backend.
 *
 * O `amount` vem com sinal e sem campo de tipo: no extrato o sinal é a única
 * informação de entrada/saída que existe.
 *
 * @param overrides Campos a sobrescrever.
 * @returns Linha do preview.
 */
const row = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: "gen-aaa111",
  date: "2026-07-01",
  description: "PIX ENVIADO MERCADO DO BAIRRO",
  amount: "-149.90",
  is_duplicate: false,
  matched_existing_tx_id: null,
  confidence: "0.000",
  match_reason: "no_match",
  ...overrides,
});

/**
 * Monta o corpo do upload servido ao wizard.
 *
 * @param overrides Campos do `data` a sobrescrever.
 * @returns Envelope de upload.
 */
const uploadBody = (overrides: Record<string, unknown> = {}): unknown => ({
  success: true,
  data: {
    preview_token: "tok-bank-e2e",
    expires_at: "2026-07-31T23:59:00Z",
    file_type: "ofx",
    bank_id: null,
    detected_bank_id: null,
    detection_confidence: 1,
    requires_confirmation: false,
    total_count: 3,
    duplicates_count: 1,
    reconciled_count: 0,
    transactions: [
      row(),
      row({ id: "gen-bbb222", description: "SALARIO", amount: "5200.00" }),
      row({ id: "gen-ccc333", description: "UBER TRIP", amount: "-31.40", is_duplicate: true }),
    ],
    ...overrides,
  },
});

const DEFAULT_CONFIRM = {
  success: true,
  data: { imported_count: 2, skipped_count: 1, reconciled_count: 0, errors: [] },
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

// Mesmo motivo do wizard de planilha: login pela UI é caro e frágil sob a
// carga do CI, então a suíte compartilha uma página e varia só o corpo das
// respostas.
test.describe.configure({ mode: "serial" });

test.describe("Import de extrato bancário", () => {
  let page: Page;
  let uploadStatus = 200;
  let uploadResponse: unknown = uploadBody();
  let confirmStatus = 200;
  let lastUploadUrl = "";
  let lastConfirmBody: Record<string, unknown> = {};

  /**
   * Devolve o wizard ao passo inicial usando os controles da própria tela.
   */
  const resetWizard = async (): Promise<void> => {
    // `import-import-another` vem do ImportResult compartilhado — o extrato
    // reusa o mesmo componente, só trocando a copy por prop.
    for (const testId of ["bank-import-start-over", "import-import-another"]) {
      const button = page.getByTestId(testId);
      if ((await button.count()) > 0 && (await button.isVisible())) {
        await button.click();
        break;
      }
    }

    const pickAnother = page.getByTestId("bank-import-unreadable");
    if ((await pickAnother.count()) > 0 && (await pickAnother.isVisible())) {
      await pickAnother.getByRole("button").click();
    }

    await expect(page.getByTestId("import-file-input")).toHaveCount(1);
  };

  /**
   * Sobe o arquivo e espera a resposta do upload.
   *
   * @param fixture Caminho do arquivo a enviar.
   */
  const upload = async (fixture: string): Promise<void> => {
    const uploaded = page.waitForResponse("**/v2/bank-import/upload**");
    await page.getByTestId("import-file-input").setInputFiles(fixture);
    await uploaded;
  };

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000);
    page = await browser.newPage();

    await page.route("**/localhost:5000/**", (route) =>
      route.fulfill(json({ success: true, data: null })),
    );
    await page.route("**/localhost:8001/**", (route) =>
      route.fulfill(json({ success: true, data: null })),
    );

    await mockAuthenticatedSession(page);

    await page.route("**/v2/bank-import/upload**", (route) => {
      lastUploadUrl = route.request().url();
      return route.fulfill(
        uploadStatus === 200
          ? json(uploadResponse)
          : json({ detail: "erro" }, uploadStatus),
      );
    });
    await page.route("**/v2/bank-import/*/confirm", (route) => {
      lastConfirmBody = JSON.parse(route.request().postData() ?? "{}") as Record<
        string,
        unknown
      >;
      return route.fulfill(
        confirmStatus === 200
          ? json(DEFAULT_CONFIRM)
          : json({ detail: "erro" }, confirmStatus),
      );
    });

    // Retentativa pelo mesmo motivo do wizard de planilha: o setup de login é
    // o passo mais frágil da suíte e não é o que está sob teste.
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await loginAndVisit(page, "/transactions/import");
        break;
      } catch (error) {
        if (attempt === 3) {
          throw error;
        }
      }
    }

    await page.getByTestId("import-tab-bank").click();
    await expect(page.getByTestId("import-file-input")).toHaveCount(1);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.beforeEach(async () => {
    uploadStatus = 200;
    confirmStatus = 200;
    uploadResponse = uploadBody();
    lastUploadUrl = "";
    lastConfirmBody = {};
    await resetWizard();
  });

  test("importa um OFX do upload ao sucesso, sem perguntar o banco", async () => {
    await upload(OFX_FIXTURE);

    // OFX traz o layout no próprio arquivo: nada de passo de banco.
    await expect(page.getByTestId("bank-import-bank-picker")).toHaveCount(0);
    expect(lastUploadUrl).not.toContain("bank_id=");

    await expect(page.getByTestId("bank-import-preview-table")).toBeVisible({
      timeout: 15_000,
    });
    // A duplicata entra desmarcada: 2 de 3.
    await expect(page.getByTestId("bank-import-preview-summary")).toContainText(
      "2 de 3",
    );

    const confirmed = page.waitForResponse("**/v2/bank-import/*/confirm");
    await page.getByTestId("bank-import-confirm").click();
    await confirmed;

    await expect(page.getByTestId("import-result")).toBeVisible({ timeout: 15_000 });
    expect(lastConfirmBody.exclude_ids).toEqual(["gen-ccc333"]);
  });

  test("pergunta o banco antes de subir um CSV e manda a escolha na query", async () => {
    await page.getByTestId("import-file-input").setInputFiles(CSV_FIXTURE);

    // O upload não pode sair antes da escolha: subir cego e reagir ao
    // `requires_confirmation` gastaria duas das três importações do mês.
    await expect(page.getByTestId("bank-import-bank-picker")).toBeVisible();
    expect(lastUploadUrl).toBe("");
    await expect(page.getByTestId("bank-import-bank-confirm")).toBeDisabled();

    uploadResponse = uploadBody({ file_type: "csv", bank_id: "inter" });
    await page.getByTestId("bank-import-bank-inter").click();
    await expect(page.getByTestId("bank-import-bank-confirm")).toBeEnabled();

    const uploaded = page.waitForResponse("**/v2/bank-import/upload**");
    await page.getByTestId("bank-import-bank-confirm").click();
    await uploaded;

    expect(lastUploadUrl).toContain("bank_id=inter");
    await expect(page.getByTestId("bank-import-preview-table")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("arquivo ilegível (422) não oferece reenviar o mesmo arquivo", async () => {
    uploadStatus = 422;

    await upload(OFX_FIXTURE);

    // No wizard de planilha 422 é "prévia expirou"; aqui é arquivo corrompido.
    // Copiar aquele mapeamento mandaria o usuário reenviar em loop.
    const alert = page.getByTestId("bank-import-unreadable");
    await expect(alert).toBeVisible({ timeout: 15_000 });
    await expect(alert).toContainText("Não conseguimos ler este arquivo");
    await expect(page.getByTestId("bank-import-expired")).toHaveCount(0);
  });

  test("cota gratuita esgotada abre o convite ao Premium", async () => {
    uploadStatus = 429;

    await upload(OFX_FIXTURE);

    await expect(page.getByTestId("import-upsell")).toBeVisible({ timeout: 15_000 });
  });

  test("prévia expirada (404) no confirm oferece reenviar o extrato", async () => {
    await upload(OFX_FIXTURE);
    await expect(page.getByTestId("bank-import-preview-table")).toBeVisible({
      timeout: 15_000,
    });

    confirmStatus = 404;
    const confirmed = page.waitForResponse("**/v2/bank-import/*/confirm");
    await page.getByTestId("bank-import-confirm").click();
    await confirmed;

    await expect(page.getByTestId("bank-import-expired")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("confirm concorrente (409) avisa que o extrato já foi importado", async () => {
    await upload(OFX_FIXTURE);
    await expect(page.getByTestId("bank-import-preview-table")).toBeVisible({
      timeout: 15_000,
    });

    confirmStatus = 409;
    const confirmed = page.waitForResponse("**/v2/bank-import/*/confirm");
    await page.getByTestId("bank-import-confirm").click();
    await confirmed;

    await expect(page.getByTestId("bank-import-already-confirmed")).toBeVisible({
      timeout: 15_000,
    });
  });
});
