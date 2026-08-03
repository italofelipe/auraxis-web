import { describe, expect, it } from "vitest";

import {
  mapBankConfirmResponse,
  mapBankTransactionView,
  mapBankUploadResponse,
} from "~/features/import/api/bank-import.mapper";
import type {
  BankTransactionViewDto,
  BankUploadResponseDto,
} from "~/features/import/contracts/bank-import.dto";

/**
 * Monta uma linha crua do backend.
 *
 * @param overrides Campos a sobrescrever.
 * @returns DTO de transação bancária.
 */
const viewDto = (
  overrides: Partial<BankTransactionViewDto> = {},
): BankTransactionViewDto => ({
  id: "gen-abc123",
  date: "2026-07-01",
  description: "PIX ENVIADO",
  amount: "-149.90",
  is_duplicate: false,
  matched_existing_tx_id: null,
  confidence: "0.000",
  match_reason: "no_match",
  ...overrides,
});

/**
 * Monta a resposta crua do upload.
 *
 * @param overrides Campos a sobrescrever.
 * @returns DTO de upload.
 */
const uploadDto = (
  overrides: Partial<BankUploadResponseDto> = {},
): BankUploadResponseDto => ({
  preview_token: "tok-1",
  expires_at: "2026-07-01T12:10:00Z",
  file_type: "ofx",
  bank_id: null,
  detected_bank_id: null,
  detection_confidence: 1,
  requires_confirmation: false,
  total_count: 2,
  duplicates_count: 1,
  reconciled_count: 0,
  transactions: [viewDto(), viewDto({ id: "gen-def456", is_duplicate: true })],
  ...overrides,
});

describe("mapBankTransactionView", () => {
  it("turns a negative amount into an expense with the sign stripped", () => {
    expect(mapBankTransactionView(viewDto({ amount: "-149.90" }))).toEqual({
      id: "gen-abc123",
      date: "2026-07-01",
      description: "PIX ENVIADO",
      amount: "149.90",
      type: "expense",
      isDuplicate: false,
    });
  });

  it("turns a positive amount into income", () => {
    const mapped = mapBankTransactionView(viewDto({ amount: "3200.00" }));

    expect(mapped.type).toBe("income");
    expect(mapped.amount).toBe("3200.00");
  });

  it("treats zero as income so the row is never rendered as a phantom debit", () => {
    expect(mapBankTransactionView(viewDto({ amount: "0" })).type).toBe("income");
  });

  it("accepts a numeric amount from a mock that skipped the Decimal encoding", () => {
    const mapped = mapBankTransactionView(viewDto({ amount: -80.5 }));

    expect(mapped.type).toBe("expense");
    expect(mapped.amount).toBe("80.5");
  });

  it("falls back to zero when the amount is not a number at all", () => {
    const mapped = mapBankTransactionView(viewDto({ amount: "n/a" }));

    expect(mapped.amount).toBe("0");
    expect(mapped.type).toBe("income");
  });

  it("keeps the duplicate flag", () => {
    expect(mapBankTransactionView(viewDto({ is_duplicate: true })).isDuplicate).toBe(
      true,
    );
  });
});

describe("mapBankUploadResponse", () => {
  it("maps the preview envelope and its rows", () => {
    const mapped = mapBankUploadResponse(uploadDto());

    expect(mapped.previewToken).toBe("tok-1");
    expect(mapped.expiresAt).toBe("2026-07-01T12:10:00Z");
    expect(mapped.fileType).toBe("ofx");
    expect(mapped.bankId).toBeNull();
    expect(mapped.totalCount).toBe(2);
    expect(mapped.duplicatesCount).toBe(1);
    expect(mapped.transactions).toHaveLength(2);
  });

  it("prefers the bank the user chose over the one the backend detected", () => {
    const mapped = mapBankUploadResponse(
      uploadDto({ file_type: "csv", bank_id: "inter", detected_bank_id: "nubank" }),
    );

    expect(mapped.bankId).toBe("inter");
  });

  it("falls back to the detected bank when the user did not choose one", () => {
    const mapped = mapBankUploadResponse(
      uploadDto({ file_type: "csv", bank_id: null, detected_bank_id: "c6" }),
    );

    expect(mapped.bankId).toBe("c6");
  });

  it("drops a bank the UI does not know instead of leaking it into the domain", () => {
    const mapped = mapBankUploadResponse(
      uploadDto({ file_type: "csv", bank_id: "banco_novo" }),
    );

    expect(mapped.bankId).toBeNull();
  });

  it("derives the counts when the backend omits them", () => {
    const mapped = mapBankUploadResponse({
      preview_token: "tok-2",
      expires_at: "2026-07-01T12:10:00Z",
      file_type: "csv",
      total_count: 0,
      duplicates_count: 0,
      transactions: [viewDto({ is_duplicate: true }), viewDto({ id: "b" })],
    });

    expect(mapped.totalCount).toBe(2);
    expect(mapped.duplicatesCount).toBe(1);
  });
});

describe("mapBankConfirmResponse", () => {
  it("maps counts and per-row errors", () => {
    expect(
      mapBankConfirmResponse(
        {
          imported_count: 21,
          skipped_count: 2,
          reconciled_count: 0,
          errors: [{ draft_id: "gen-abc123", reason: "categoria inválida" }],
        },
        0,
      ),
    ).toEqual({
      importedCount: 21,
      skippedCount: 2,
      errors: [{ draftId: "gen-abc123", reason: "categoria inválida" }],
    });
  });

  it("uses the excluded count when the backend omits skipped_count", () => {
    expect(mapBankConfirmResponse({ imported_count: 5 }, 3)).toEqual({
      importedCount: 5,
      skippedCount: 3,
      errors: [],
    });
  });
});
