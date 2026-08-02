import { describe, expect, it } from "vitest";

import {
  mapConfirmResponse,
  mapDetectResponse,
  mapPreviewResponse,
  mapRejectedRow,
  mapTransactionDraft,
} from "~/features/import/api/import.mapper";
import type {
  DetectResponseDto,
  PreviewResponseDto,
  TransactionDraftDto,
} from "~/features/import/contracts/import.dto";

/**
 * Monta um draft cru como o backend devolve.
 *
 * @param overrides Campos a sobrescrever.
 * @returns DTO de uma linha do preview.
 */
const draftDto = (overrides: Partial<TransactionDraftDto> = {}): TransactionDraftDto => ({
  id: "d1",
  date: "2026-07-01",
  description: "Mercado",
  amount: "149.90",
  transaction_type: "expense",
  category: "alimentacao",
  confidence: 0.9,
  is_duplicate: false,
  ...overrides,
});

/**
 * Monta uma resposta de preview crua.
 *
 * @param overrides Campos a sobrescrever.
 * @returns DTO da resposta de preview.
 */
const previewDto = (overrides: Partial<PreviewResponseDto> = {}): PreviewResponseDto => ({
  preview_token: "tok",
  expires_at: "2026-07-31T23:00:00Z",
  file_type: "csv",
  total_count: 1,
  duplicates_count: 0,
  transactions: [draftDto()],
  ...overrides,
});

describe("mapDetectResponse", () => {
  it("assume coluna vazia e confiança zero quando o backend omite", () => {
    const dto: DetectResponseDto = {
      file_type: "xlsx",
      headers: ["A", "B"],
      sample_rows: [["1", "2"]],
      suggested_mapping: { date_column: "A" },
      confidence: { date_column: 0.9 },
      active_sheet: "Plan1",
    };

    const result = mapDetectResponse(dto);

    expect(result.suggestedMapping).toEqual({
      dateColumn: "A",
      descriptionColumn: "",
      amountColumn: "",
      typeColumn: "",
      sheetName: "Plan1",
    });
    expect(result.confidence).toEqual({
      dateColumn: 0.9,
      descriptionColumn: 0,
      amountColumn: 0,
      typeColumn: 0,
    });
    expect(result.sheetNames).toEqual([]);
  });

  it("prefere o sheet do mapeamento sugerido ao sheet ativo", () => {
    const result = mapDetectResponse({
      file_type: "xlsx",
      headers: [],
      sample_rows: [],
      suggested_mapping: { sheet_name: "Julho" },
      confidence: {},
      active_sheet: "Plan1",
    });

    expect(result.suggestedMapping.sheetName).toBe("Julho");
  });
});

describe("mapTransactionDraft", () => {
  it("normaliza o valor numérico para string", () => {
    const result = mapTransactionDraft(draftDto({ amount: 149.9 }));

    expect(result.amount).toBe("149.9");
  });

  it("mantém apenas os campos faltantes que o wizard sabe perguntar", () => {
    // Um campo novo no backend viraria pendência sem formulário — bloqueio
    // sem saída para o usuário.
    const result = mapTransactionDraft(
      draftDto({ missing_fields: ["description", "installments", "amount"] }),
    );

    expect(result.missingFields).toEqual(["description", "amount"]);
  });

  it("trata missing_fields ausente como linha completa", () => {
    expect(mapTransactionDraft(draftDto()).missingFields).toEqual([]);
    expect(mapTransactionDraft(draftDto({ missing_fields: null })).missingFields).toEqual([]);
  });
});

describe("mapPreviewResponse", () => {
  it("usa o incomplete_count do backend quando ele vem", () => {
    const result = mapPreviewResponse(previewDto({ incomplete_count: 3 }));

    expect(result.incompleteCount).toBe(3);
  });

  it("deriva incomplete_count dos drafts quando o backend omite", () => {
    const result = mapPreviewResponse(
      previewDto({
        transactions: [
          draftDto({ id: "d1", missing_fields: ["description"] }),
          draftDto({ id: "d2" }),
          draftDto({ id: "d3", missing_fields: ["amount"] }),
        ],
      }),
    );

    expect(result.incompleteCount).toBe(2);
  });

  it("converte as linhas rejeitadas e trata ausência como lista vazia", () => {
    expect(mapPreviewResponse(previewDto()).rejectedRows).toEqual([]);

    const result = mapPreviewResponse(
      previewDto({ rejected_rows: [{ line_number: 7, reason: "Data inválida" }] }),
    );

    expect(result.rejectedRows).toEqual([{ lineNumber: 7, reason: "Data inválida" }]);
  });
});

describe("mapRejectedRow", () => {
  it("converte a linha rejeitada para o domínio", () => {
    expect(mapRejectedRow({ line_number: 12, reason: "Truncada" })).toEqual({
      lineNumber: 12,
      reason: "Truncada",
    });
  });
});

describe("mapConfirmResponse", () => {
  it("usa o fallback de ignorados quando o backend omite skipped_count", () => {
    const result = mapConfirmResponse({ imported_count: 4 }, 2);

    expect(result).toEqual({ importedCount: 4, skippedCount: 2, errors: [] });
  });

  it("converte os erros por linha", () => {
    const result = mapConfirmResponse(
      {
        imported_count: 1,
        skipped_count: 0,
        errors: [{ draft_id: "d9", reason: "valor inválido" }],
      },
      0,
    );

    expect(result.errors).toEqual([{ draftId: "d9", reason: "valor inválido" }]);
  });
});
