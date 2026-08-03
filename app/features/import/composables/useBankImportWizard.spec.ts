import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBankImportWizard } from "~/features/import/composables/useBankImportWizard";
import type {
  BankImportPreview,
  BankTransactionDraft,
} from "~/features/import/model/bank-import";

const uploadMock = vi.hoisted(() => vi.fn());
const confirmMock = vi.hoisted(() => vi.fn());

vi.mock("~/features/import/queries/use-bank-import-mutations", () => ({
  useUploadBankStatementMutation: (): unknown => ({
    mutateAsync: uploadMock,
    isPending: ref(false),
    reset: vi.fn(),
  }),
  useConfirmBankStatementMutation: (): unknown => ({
    mutateAsync: confirmMock,
    isPending: ref(false),
    reset: vi.fn(),
  }),
}));

const ofxFile = new File(["OFXHEADER"], "extrato.ofx", { type: "application/x-ofx" });
const csvFile = new File(["a,b"], "nubank.csv", { type: "text/csv" });

/**
 * Monta uma linha do extrato já no domínio.
 *
 * @param overrides Campos a sobrescrever.
 * @returns Draft do extrato.
 */
const draft = (overrides: Partial<BankTransactionDraft> = {}): BankTransactionDraft => ({
  id: "gen-1",
  date: "2026-07-01",
  description: "PIX ENVIADO",
  amount: "149.90",
  type: "expense",
  isDuplicate: false,
  ...overrides,
});

/**
 * Monta uma prévia de domínio com uma duplicata.
 *
 * @param overrides Campos a sobrescrever.
 * @returns Prévia do extrato.
 */
const preview = (overrides: Partial<BankImportPreview> = {}): BankImportPreview => ({
  previewToken: "tok",
  expiresAt: "2026-07-01T12:10:00Z",
  fileType: "ofx",
  bankId: null,
  totalCount: 2,
  duplicatesCount: 1,
  transactions: [draft(), draft({ id: "gen-2", isDuplicate: true })],
  ...overrides,
});

/**
 * Erro HTTP no formato que o Axios entrega.
 *
 * @param status Status da resposta.
 * @returns Erro com `response.status`.
 */
const httpError = (status: number): unknown => ({ response: { status } });

describe("useBankImportWizard", () => {
  beforeEach(() => {
    uploadMock.mockReset();
    confirmMock.mockReset();
  });

  it("starts on the select step", () => {
    const wizard = useBankImportWizard();

    expect(wizard.step.value).toBe("select");
    expect(wizard.needsBankChoice.value).toBe(false);
  });

  it("uploads an OFX straight away, without asking for the bank", async () => {
    uploadMock.mockResolvedValue(preview());
    const wizard = useBankImportWizard();

    await wizard.selectFile(ofxFile);

    expect(uploadMock).toHaveBeenCalledWith({ file: ofxFile, bankId: null });
    expect(wizard.step.value).toBe("preview");
  });

  it("asks for the bank before uploading a CSV", async () => {
    const wizard = useBankImportWizard();

    await wizard.selectFile(csvFile);

    expect(uploadMock).not.toHaveBeenCalled();
    expect(wizard.step.value).toBe("bank");
    expect(wizard.needsBankChoice.value).toBe(true);
  });

  it("blocks the CSV upload until a bank is chosen", async () => {
    const wizard = useBankImportWizard();
    await wizard.selectFile(csvFile);

    expect(wizard.canConfirmBank.value).toBe(false);
    await wizard.confirmBank();
    expect(uploadMock).not.toHaveBeenCalled();

    wizard.setBank("inter");
    expect(wizard.canConfirmBank.value).toBe(true);
    uploadMock.mockResolvedValue(preview({ fileType: "csv", bankId: "inter" }));
    await wizard.confirmBank();

    expect(uploadMock).toHaveBeenCalledWith({ file: csvFile, bankId: "inter" });
    expect(wizard.step.value).toBe("preview");
  });

  it("goes back to select when the bank step is cancelled", async () => {
    const wizard = useBankImportWizard();
    await wizard.selectFile(csvFile);

    wizard.cancelBank();

    expect(wizard.step.value).toBe("select");
    expect(wizard.file.value).toBeNull();
  });

  it("preselects everything that is not a duplicate", async () => {
    uploadMock.mockResolvedValue(preview());
    const wizard = useBankImportWizard();

    await wizard.selectFile(ofxFile);

    expect(wizard.selectedCount.value).toBe(1);
    expect(wizard.totalCount.value).toBe(2);
    expect(wizard.duplicateCount.value).toBe(1);
  });

  it("toggles a row in and out of the selection", async () => {
    uploadMock.mockResolvedValue(preview());
    const wizard = useBankImportWizard();
    await wizard.selectFile(ofxFile);

    wizard.toggleTransaction("gen-2");
    expect(wizard.selectedCount.value).toBe(2);

    wizard.toggleTransaction("gen-2");
    expect(wizard.selectedCount.value).toBe(1);
  });

  it("confirms with the unselected rows as exclusions", async () => {
    uploadMock.mockResolvedValue(preview());
    confirmMock.mockResolvedValue({ importedCount: 1, skippedCount: 1, errors: [] });
    const wizard = useBankImportWizard();
    await wizard.selectFile(ofxFile);

    await wizard.confirmImport();

    expect(confirmMock).toHaveBeenCalledWith({
      previewToken: "tok",
      excludeIds: ["gen-2"],
    });
    expect(wizard.step.value).toBe("success");
    expect(wizard.result.value?.importedCount).toBe(1);
  });

  it("does nothing on confirm when there is no preview", async () => {
    const wizard = useBankImportWizard();

    await wizard.confirmImport();

    expect(confirmMock).not.toHaveBeenCalled();
  });

  it("flags 429 as the freemium upsell", async () => {
    uploadMock.mockRejectedValue(httpError(429));
    const wizard = useBankImportWizard();

    await wizard.selectFile(ofxFile);

    expect(wizard.isUpsell.value).toBe(true);
    expect(wizard.step.value).toBe("select");
  });

  it("flags 422 as an unreadable file, not as an expired preview", async () => {
    uploadMock.mockRejectedValue(httpError(422));
    const wizard = useBankImportWizard();

    await wizard.selectFile(ofxFile);

    expect(wizard.isFileUnreadable.value).toBe(true);
    expect(wizard.isPreviewExpired.value).toBe(false);
  });

  it("flags 415 as an unreadable file too", async () => {
    uploadMock.mockRejectedValue(httpError(415));
    const wizard = useBankImportWizard();

    await wizard.selectFile(ofxFile);

    expect(wizard.isFileUnreadable.value).toBe(true);
  });

  it("flags 404 on confirm as an expired preview", async () => {
    uploadMock.mockResolvedValue(preview());
    confirmMock.mockRejectedValue(httpError(404));
    const wizard = useBankImportWizard();
    await wizard.selectFile(ofxFile);

    await wizard.confirmImport();

    expect(wizard.isPreviewExpired.value).toBe(true);
    expect(wizard.step.value).toBe("preview");
  });

  it("flags 409 as a concurrent confirm", async () => {
    uploadMock.mockResolvedValue(preview());
    confirmMock.mockRejectedValue(httpError(409));
    const wizard = useBankImportWizard();
    await wizard.selectFile(ofxFile);

    await wizard.confirmImport();

    expect(wizard.isAlreadyConfirmed.value).toBe(true);
  });

  it("reads a bare status on the error, not only the Axios envelope", async () => {
    uploadMock.mockRejectedValue({ status: 429 });
    const wizard = useBankImportWizard();

    await wizard.selectFile(ofxFile);

    expect(wizard.isUpsell.value).toBe(true);
  });

  it("keeps every flag off for an error with no status at all", async () => {
    uploadMock.mockRejectedValue(new Error("network down"));
    const wizard = useBankImportWizard();

    await wizard.selectFile(ofxFile);

    expect(wizard.isUpsell.value).toBe(false);
    expect(wizard.isFileUnreadable.value).toBe(false);
    expect(wizard.isPreviewExpired.value).toBe(false);
    expect(wizard.isAlreadyConfirmed.value).toBe(false);
    expect(wizard.error.value).toBeInstanceOf(Error);
  });

  it("clears the error on dismiss", async () => {
    uploadMock.mockRejectedValue(httpError(422));
    const wizard = useBankImportWizard();
    await wizard.selectFile(ofxFile);

    wizard.dismissError();

    expect(wizard.error.value).toBeNull();
    expect(wizard.isFileUnreadable.value).toBe(false);
  });

  it("resets back to a clean select step", async () => {
    uploadMock.mockResolvedValue(preview());
    const wizard = useBankImportWizard();
    await wizard.selectFile(ofxFile);

    wizard.reset();

    expect(wizard.step.value).toBe("select");
    expect(wizard.file.value).toBeNull();
    expect(wizard.preview.value).toBeNull();
    expect(wizard.bankId.value).toBeNull();
    expect(wizard.selectedCount.value).toBe(0);
    expect(wizard.totalCount.value).toBe(0);
    expect(wizard.duplicateCount.value).toBe(0);
  });
});
