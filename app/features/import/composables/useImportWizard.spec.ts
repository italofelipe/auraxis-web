import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useImportWizard } from "~/features/import/composables/useImportWizard";
import type {
  ImportDetectResult,
  ImportPreview,
  ImportTransactionDraft,
} from "~/features/import/model/import";

const detectMock = vi.hoisted(() => vi.fn());
const previewMock = vi.hoisted(() => vi.fn());
const confirmMock = vi.hoisted(() => vi.fn());

vi.mock("~/features/import/queries/use-import-mutations", () => ({
  useDetectImportMutation: (): unknown => ({
    mutateAsync: detectMock,
    isPending: ref(false),
    reset: vi.fn(),
  }),
  usePreviewImportMutation: (): unknown => ({
    mutateAsync: previewMock,
    isPending: ref(false),
    reset: vi.fn(),
  }),
  useConfirmImportMutation: (): unknown => ({
    mutateAsync: confirmMock,
    isPending: ref(false),
    reset: vi.fn(),
  }),
}));

const file = new File(["a"], "extrato.csv", { type: "text/csv" });

const confidentDetect: ImportDetectResult = {
  fileType: "csv",
  sheetNames: [],
  activeSheet: null,
  headers: ["Data", "Descrição", "Valor", "Tipo"],
  sampleRows: [["01/07/2026", "Mercado", "149,90", "saida"]],
  suggestedMapping: {
    dateColumn: "Data",
    descriptionColumn: "Descrição",
    amountColumn: "Valor",
    typeColumn: "Tipo",
    sheetName: null,
  },
  confidence: {
    dateColumn: 0.95,
    descriptionColumn: 0.92,
    amountColumn: 0.94,
    typeColumn: 0.9,
  },
};

/**
 * Monta uma linha do preview já no domínio.
 *
 * @param overrides Campos a sobrescrever.
 * @returns Draft de transação.
 */
const draft = (
  overrides: Partial<ImportTransactionDraft> = {},
): ImportTransactionDraft => ({
  id: "d1",
  date: "2026-07-01",
  description: "Mercado",
  amount: "149.90",
  type: "expense",
  category: "alimentacao",
  confidence: 0.9,
  isDuplicate: false,
  missingFields: [],
  ...overrides,
});

/**
 * Monta um preview de domínio com duplicata por padrão.
 *
 * @param overrides Campos a sobrescrever.
 * @returns Preview do import.
 */
const preview = (overrides: Partial<ImportPreview> = {}): ImportPreview => ({
  previewToken: "tok",
  expiresAt: "2026-07-31T23:00:00Z",
  fileType: "csv",
  totalCount: 2,
  duplicatesCount: 1,
  incompleteCount: 0,
  transactions: [draft(), draft({ id: "d2", isDuplicate: true })],
  rejectedRows: [],
  ...overrides,
});

const confirmResult = { importedCount: 1, skippedCount: 1, errors: [] };

describe("useImportWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    detectMock.mockResolvedValue(confidentDetect);
    previewMock.mockResolvedValue(preview());
    confirmMock.mockResolvedValue(confirmResult);
  });

  it("começa na seleção de arquivo", () => {
    const wizard = useImportWizard();

    expect(wizard.step.value).toBe("select");
    expect(wizard.file.value).toBeNull();
  });

  it("pula o mapeamento quando a detecção veio confiante", async () => {
    const wizard = useImportWizard();

    await wizard.selectFile(file);

    expect(previewMock).toHaveBeenCalledWith({
      file,
      mapping: confidentDetect.suggestedMapping,
    });
    expect(wizard.step.value).toBe("preview");
  });

  it("pergunta apenas as colunas que a detecção não resolveu", async () => {
    detectMock.mockResolvedValue({
      ...confidentDetect,
      confidence: { ...confidentDetect.confidence, descriptionColumn: 0.4, typeColumn: 0.2 },
    });
    const wizard = useImportWizard();

    await wizard.selectFile(file);

    expect(wizard.step.value).toBe("mapping");
    expect(wizard.mappingFields.value.map((field) => field.key)).toEqual([
      "descriptionColumn",
      "typeColumn",
    ]);
    expect(wizard.mappingFields.value[0]?.sampleValues).toEqual(["Mercado"]);
  });

  it("entra no mapeamento quando o backend não sugeriu a coluna", async () => {
    detectMock.mockResolvedValue({
      ...confidentDetect,
      suggestedMapping: { ...confidentDetect.suggestedMapping, amountColumn: "" },
    });
    const wizard = useImportWizard();

    await wizard.selectFile(file);

    expect(wizard.mappingFields.value.map((field) => field.key)).toEqual(["amountColumn"]);
  });

  it("deixa as duplicatas desmarcadas e exclui só o que foi desmarcado", async () => {
    const wizard = useImportWizard();

    await wizard.selectFile(file);
    expect(wizard.selectedCount.value).toBe(1);

    await wizard.confirmImport();

    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({ previewToken: "tok", excludeIds: ["d2"] }),
    );
    expect(wizard.step.value).toBe("success");
    expect(wizard.result.value).toEqual(confirmResult);
  });

  it("desvia para a conferência quando há linha incompleta selecionada", async () => {
    previewMock.mockResolvedValue(
      preview({
        duplicatesCount: 0,
        incompleteCount: 1,
        transactions: [draft({ description: "", missingFields: ["description"] })],
      }),
    );
    const wizard = useImportWizard();

    await wizard.selectFile(file);
    await wizard.confirmImport();

    // Nada entra pela metade sem o usuário saber (#1299).
    expect(wizard.step.value).toBe("review");
    expect(confirmMock).not.toHaveBeenCalled();
    expect(wizard.review.pendingCount.value).toBe(1);
  });

  it("não envia a conferência enquanto sobrar pendência", async () => {
    previewMock.mockResolvedValue(
      preview({
        duplicatesCount: 0,
        transactions: [draft({ description: "", missingFields: ["description"] })],
      }),
    );
    const wizard = useImportWizard();

    await wizard.selectFile(file);
    await wizard.confirmImport();
    await wizard.submitReview();

    expect(confirmMock).not.toHaveBeenCalled();
    expect(wizard.step.value).toBe("review");
  });

  it("confirma com as respostas quando a conferência termina", async () => {
    previewMock.mockResolvedValue(
      preview({
        duplicatesCount: 0,
        transactions: [draft({ description: "", missingFields: ["description"] })],
      }),
    );
    const wizard = useImportWizard();

    await wizard.selectFile(file);
    await wizard.confirmImport();
    wizard.review.answer("d1", "description", "Mercado do bairro");
    await wizard.submitReview();

    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        completions: { d1: { description: "Mercado do bairro" } },
      }),
    );
    expect(wizard.step.value).toBe("success");
  });

  it("terminar depois manda placeholders sem descartar o que já foi respondido", async () => {
    previewMock.mockResolvedValue(
      preview({
        duplicatesCount: 0,
        transactions: [
          draft({ description: "", missingFields: ["description"] }),
          draft({ id: "d2", amount: "0", missingFields: ["amount"] }),
        ],
      }),
    );
    const wizard = useImportWizard();

    await wizard.selectFile(file);
    await wizard.confirmImport();
    wizard.review.answer("d1", "description", "Mercado");
    wizard.openFinishLater();

    expect(wizard.isFinishLaterOpen.value).toBe(true);

    await wizard.confirmWithPlaceholders();

    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        useGenericPlaceholders: true,
        completions: { d1: { description: "Mercado" } },
      }),
    );
    expect(wizard.isFinishLaterOpen.value).toBe(false);
    expect(wizard.step.value).toBe("success");
  });

  it("desmarcar a linha a tira da fila de conferência", async () => {
    previewMock.mockResolvedValue(
      preview({
        duplicatesCount: 0,
        transactions: [draft({ description: "", missingFields: ["description"] })],
      }),
    );
    const wizard = useImportWizard();

    await wizard.selectFile(file);
    wizard.toggleTransaction("d1");

    // Desmarcar já é uma resposta válida para "não quero essa transação".
    expect(wizard.review.totalCount.value).toBe(0);
  });

  it("expõe as linhas que o parser não conseguiu ler", async () => {
    previewMock.mockResolvedValue(
      preview({ rejectedRows: [{ lineNumber: 7, reason: "Data inválida" }] }),
    );
    const wizard = useImportWizard();

    await wizard.selectFile(file);

    expect(wizard.rejectedRows.value).toEqual([
      { lineNumber: 7, reason: "Data inválida" },
    ]);
  });

  it("reconhece 429 como upsell e 422 como prévia expirada", async () => {
    previewMock.mockRejectedValue({ status: 429 });
    const wizard = useImportWizard();

    await wizard.selectFile(file);
    expect(wizard.isUpsell.value).toBe(true);
    expect(wizard.isPreviewExpired.value).toBe(false);

    previewMock.mockRejectedValue({ response: { status: 422 } });
    await wizard.selectFile(file);
    expect(wizard.isPreviewExpired.value).toBe(true);
  });

  it("erro sem status não vira upsell nem prévia expirada", async () => {
    previewMock.mockRejectedValue(new Error("network"));
    const wizard = useImportWizard();

    await wizard.selectFile(file);

    expect(wizard.isUpsell.value).toBe(false);
    expect(wizard.isPreviewExpired.value).toBe(false);
    expect(wizard.error.value).toBeInstanceOf(Error);
  });

  it("volta da conferência para a prévia sem perder a seleção", async () => {
    previewMock.mockResolvedValue(
      preview({
        duplicatesCount: 0,
        transactions: [draft({ description: "", missingFields: ["description"] })],
      }),
    );
    const wizard = useImportWizard();

    await wizard.selectFile(file);
    await wizard.confirmImport();
    wizard.cancelReview();

    expect(wizard.step.value).toBe("preview");
    expect(wizard.selectedCount.value).toBe(1);
  });

  it("reset devolve o wizard ao estado inicial", async () => {
    const wizard = useImportWizard();

    await wizard.selectFile(file);
    wizard.reset();

    expect(wizard.step.value).toBe("select");
    expect(wizard.file.value).toBeNull();
    expect(wizard.preview.value).toBeNull();
    expect(wizard.selectedCount.value).toBe(0);
  });

  it("aplica o mapeamento revisado ao gerar a prévia", async () => {
    detectMock.mockResolvedValue({
      ...confidentDetect,
      confidence: { ...confidentDetect.confidence, descriptionColumn: 0.3 },
    });
    const wizard = useImportWizard();

    await wizard.selectFile(file);
    wizard.setMappingField("descriptionColumn", "Histórico");
    await wizard.confirmMapping();

    expect(previewMock).toHaveBeenCalledWith({
      file,
      mapping: expect.objectContaining({ descriptionColumn: "Histórico" }),
    });
    expect(wizard.step.value).toBe("preview");
  });
});
