/**
 * Estado do wizard de extrato.
 *
 * O que está sob teste aqui é sobretudo o que o wizard *recusa* a fazer:
 * confirmar com conflito pendente, importar uma linha que ninguém marcou,
 * mandar arquivo que já dá para recusar daqui.
 */
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useStatementImportWizard } from "~/features/import/composables/useStatementImportWizard";
import type {
  StatementEntry,
  StatementPreview,
} from "~/features/import/model/statement-import";

/**
 * Monta uma linha de extrato.
 *
 * @param overrides Campos a sobrescrever.
 * @returns A linha.
 */
const entry = (overrides: Partial<StatementEntry> = {}): StatementEntry => ({
  lineIndex: 1,
  pageNumber: 1,
  kind: "transaction",
  postingDate: "2026-03-04",
  transactionDate: null,
  rawDescription: "PIX MERCADO",
  normalizedDescription: "pix mercado",
  amount: "-45.90",
  balance: null,
  currency: "BRL",
  direction: "debit",
  movementType: "pix",
  counterpartyName: "mercado",
  financialNature: "expense",
  suggestedCategory: null,
  confidence: "0.800",
  rationale: "Compra.",
  needsReview: false,
  recurrenceHint: false,
  isNeutralNature: false,
  matchStatus: "unique",
  matchedTransactionId: null,
  matchScore: "0.000",
  matchEvidence: {
    agreed: [],
    diverged: [],
    dayDifference: null,
    reason: "",
    alternatives: 0,
    alreadyImported: false,
  },
  previousDecision: null,
  fingerprint: "fp-1",
  ...overrides,
});

/**
 * Monta uma prévia com as linhas informadas.
 *
 * @param entries Linhas da prévia.
 * @returns A prévia.
 */
const preview = (entries: StatementEntry[]): StatementPreview => ({
  previewToken: "tok",
  expiresAt: "2026-03-04T12:00:00Z",
  bankId: "itau",
  accountId: "acc-1",
  holderName: "MARIA",
  periodStart: "2026-03-01",
  periodEnd: "2026-03-07",
  pageCount: 1,
  alreadyImportedFile: false,
  blockedByConflicts: entries.some((item) => item.matchStatus === "conflict"),
  summary: {
    totalExtracted: entries.length,
    movements: entries.length,
    balanceMarkers: 0,
    newCount: entries.length,
    exactDuplicates: 0,
    likelyDuplicates: 0,
    possibleDuplicates: 0,
    conflicts: entries.filter((item) => item.matchStatus === "conflict").length,
    needsReview: 0,
    creditTotal: "0.00",
    debitTotal: "45.90",
    transferTotal: "0.00",
    rejectedLines: 0,
  },
  entries,
  rejected: [],
});

/**
 * Monta um par de mutations dubladas.
 *
 * @param uploadResult O que o upload devolve.
 * @returns As mutations e os espiões.
 */
const mutations = (
  uploadResult: StatementPreview | Error,
): {
  upload: never;
  confirm: never;
  uploadFn: ReturnType<typeof vi.fn>;
  confirmFn: ReturnType<typeof vi.fn>;
} => {
  const uploadFn = vi.fn(() =>
    uploadResult instanceof Error
      ? Promise.reject(uploadResult)
      : Promise.resolve(uploadResult),
  );
  const confirmFn = vi.fn(() =>
    Promise.resolve({
      importedCount: 1,
      linkedCount: 0,
      ignoredCount: 0,
      skippedCount: 0,
      errors: [],
    }),
  );
  return {
    upload: { mutateAsync: uploadFn, isPending: ref(false) } as never,
    confirm: { mutateAsync: confirmFn, isPending: ref(false) } as never,
    uploadFn,
    confirmFn,
  };
};

/**
 * Cria um arquivo falso com o tamanho pedido.
 *
 * @param name Nome do arquivo.
 * @param size Tamanho em bytes.
 * @returns O arquivo.
 */
const fakeFile = (name: string, size = 1024): File => {
  const file = new File(["x"], name, { type: "application/pdf" });
  Object.defineProperty(file, "size", { value: size });
  return file;
};

describe("useStatementImportWizard", () => {
  let stubs: ReturnType<typeof mutations>;

  beforeEach(() => {
    stubs = mutations(preview([entry()]));
  });

  it("começa pedindo a conta de destino", () => {
    const wizard = useStatementImportWizard(stubs.upload, stubs.confirm);

    expect(wizard.step.value).toBe("account");
  });

  it("recusa o upload sem conta escolhida", async () => {
    // Um extrato concilia contra uma conta; adivinhar qual tornaria toda a
    // detecção de duplicidade errada de um jeito invisível.
    const wizard = useStatementImportWizard(stubs.upload, stubs.confirm);

    await wizard.selectFile(fakeFile("extrato.pdf"));

    expect(wizard.error.value).toBe("no-account");
    expect(stubs.uploadFn).not.toHaveBeenCalled();
  });

  it("recusa localmente um arquivo que não é PDF", async () => {
    const wizard = useStatementImportWizard(stubs.upload, stubs.confirm);
    wizard.chooseAccount("acc-1");

    await wizard.selectFile(fakeFile("extrato.ofx"));

    expect(wizard.error.value).toBe("wrong-format");
    expect(stubs.uploadFn).not.toHaveBeenCalled();
  });

  it("recusa localmente um arquivo grande demais", async () => {
    const wizard = useStatementImportWizard(stubs.upload, stubs.confirm);
    wizard.chooseAccount("acc-1");

    await wizard.selectFile(fakeFile("extrato.pdf", 11 * 1024 * 1024));

    expect(wizard.error.value).toBe("file-too-large");
    expect(stubs.uploadFn).not.toHaveBeenCalled();
  });

  it("vai para a revisão quando o upload dá certo", async () => {
    const wizard = useStatementImportWizard(stubs.upload, stubs.confirm);
    wizard.chooseAccount("acc-1");

    await wizard.selectFile(fakeFile("extrato.pdf"));

    expect(wizard.step.value).toBe("review");
    expect(wizard.selectedCount.value).toBe(1);
  });

  it("explica um PDF escaneado em vez de dizer 'algo deu errado'", async () => {
    // Classificado pelo código, não pela frase: a prosa é traduzível e
    // reescrevível, e procurar "escaneada" dentro dela quebra na primeira
    // revisão de texto.
    const failing = mutations(
      Object.assign(new Error("422"), {
        response: { status: 422, data: { error: "STATEMENT_PDF_SCANNED" } },
      }),
    );
    const wizard = useStatementImportWizard(failing.upload, failing.confirm);
    wizard.chooseAccount("acc-1");

    await wizard.selectFile(fakeFile("extrato.pdf"));

    expect(wizard.error.value).toBe("scanned");
  });

  it("explica um layout de banco desconhecido", async () => {
    const failing = mutations(
      Object.assign(new Error("422"), {
        response: { status: 422, data: { error: "STATEMENT_UNKNOWN_LAYOUT" } },
      }),
    );
    const wizard = useStatementImportWizard(failing.upload, failing.confirm);
    wizard.chooseAccount("acc-1");

    await wizard.selectFile(fakeFile("extrato.pdf"));

    expect(wizard.error.value).toBe("unknown-bank");
  });

  it("não confirma enquanto houver conflito sem decisão", async () => {
    const conflicted = mutations(preview([entry({ matchStatus: "conflict" })]));
    const wizard = useStatementImportWizard(conflicted.upload, conflicted.confirm);
    wizard.chooseAccount("acc-1");
    await wizard.selectFile(fakeFile("extrato.pdf"));

    expect(wizard.unresolvedConflicts.value).toHaveLength(1);
    expect(wizard.canConfirm.value).toBe(false);

    await wizard.confirm();

    expect(conflicted.confirmFn).not.toHaveBeenCalled();
    expect(wizard.error.value).toBe("conflicts");
  });

  it("libera a confirmação depois que o conflito é decidido", async () => {
    const conflicted = mutations(preview([entry({ matchStatus: "conflict" })]));
    const wizard = useStatementImportWizard(conflicted.upload, conflicted.confirm);
    wizard.chooseAccount("acc-1");
    await wizard.selectFile(fakeFile("extrato.pdf"));

    wizard.decide({ lineIndex: 1, action: "ignore" });

    expect(wizard.canConfirm.value).toBe(true);
  });

  it("não manda linha que ninguém marcou", async () => {
    const neutral = mutations(preview([entry({ isNeutralNature: true })]));
    const wizard = useStatementImportWizard(neutral.upload, neutral.confirm);
    wizard.chooseAccount("acc-1");
    await wizard.selectFile(fakeFile("extrato.pdf"));

    expect(wizard.selectedCount.value).toBe(0);
    expect(wizard.canConfirm.value).toBe(false);
  });

  it("envia a decisão do usuário, não a proposta do sistema", async () => {
    const wizard = useStatementImportWizard(stubs.upload, stubs.confirm);
    wizard.chooseAccount("acc-1");
    await wizard.selectFile(fakeFile("extrato.pdf"));

    wizard.decide({ lineIndex: 1, action: "link_existing", matchedTransactionId: "tx-9" });
    await wizard.confirm();

    expect(stubs.confirmFn).toHaveBeenCalledWith(
      expect.objectContaining({
        decisions: [
          { lineIndex: 1, action: "link_existing", matchedTransactionId: "tx-9" },
        ],
      }),
    );
    expect(wizard.step.value).toBe("success");
  });

  it("devolve a linha à proposta do sistema ao limpar a decisão", async () => {
    const wizard = useStatementImportWizard(stubs.upload, stubs.confirm);
    wizard.chooseAccount("acc-1");
    await wizard.selectFile(fakeFile("extrato.pdf"));

    wizard.decide({ lineIndex: 1, action: "ignore" });
    expect(wizard.selectedCount.value).toBe(0);

    wizard.clearDecision(1);
    expect(wizard.selectedCount.value).toBe(1);
  });

  it("filtra as linhas visíveis", async () => {
    const mixed = mutations(
      preview([entry({ lineIndex: 1 }), entry({ lineIndex: 2, isNeutralNature: true })]),
    );
    const wizard = useStatementImportWizard(mixed.upload, mixed.confirm);
    wizard.chooseAccount("acc-1");
    await wizard.selectFile(fakeFile("extrato.pdf"));

    wizard.filter.value = "transfers";

    expect(wizard.visibleEntries.value).toHaveLength(1);
    expect(wizard.visibleEntries.value[0]?.lineIndex).toBe(2);
  });

  it("cai no status quando o backend não manda código", async () => {
    // Um proxy ou um erro de rede pode chegar sem envelope. Menos preciso,
    // mas ainda acionável.
    const failing = mutations(
      Object.assign(new Error("413"), { response: { status: 413, data: {} } }),
    );
    const wizard = useStatementImportWizard(failing.upload, failing.confirm);
    wizard.chooseAccount("acc-1");

    await wizard.selectFile(fakeFile("extrato.pdf"));

    expect(wizard.error.value).toBe("file-too-large");
  });

  it("avisa que a prévia expirou em vez de falhar em silêncio", async () => {
    const wizard = useStatementImportWizard(stubs.upload, stubs.confirm);
    wizard.chooseAccount("acc-1");
    await wizard.selectFile(fakeFile("extrato.pdf"));
    stubs.confirmFn.mockRejectedValueOnce(
      Object.assign(new Error("404"), { response: { status: 404 } }),
    );

    await wizard.confirm();

    expect(wizard.error.value).toBe("expired");
  });

  it("preserva a conta ao recomeçar", async () => {
    const wizard = useStatementImportWizard(stubs.upload, stubs.confirm);
    wizard.chooseAccount("acc-1");
    await wizard.selectFile(fakeFile("extrato.pdf"));

    wizard.reset();

    expect(wizard.accountId.value).toBe("acc-1");
    expect(wizard.step.value).toBe("select");
    expect(wizard.preview.value).toBeNull();
  });
});
