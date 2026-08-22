/**
 * DTO → domínio.
 *
 * O ponto sensível é o dinheiro: ele atravessa como string do backend até a
 * tela. Convertê-lo para `number` no caminho reintroduziria o ponto flutuante
 * que o backend usa `Decimal` justamente para evitar.
 */
import { describe, expect, it } from "vitest";

import {
  mapDecisionToDto,
  mapStatementConfirmResult,
  mapStatementEntry,
  mapStatementPreview,
} from "~/features/import/api/statement-import.mapper";
import type {
  StatementEntryDto,
  StatementPreviewDto,
} from "~/features/import/contracts/statement-import.dto";

/**
 * Monta um DTO de linha com valores plausíveis.
 *
 * @param overrides Campos a sobrescrever.
 * @returns O DTO.
 */
const entryDto = (overrides: Partial<StatementEntryDto> = {}): StatementEntryDto => ({
  line_index: 3,
  page_number: 1,
  kind: "transaction",
  posting_date: "2026-03-04",
  transaction_date: "2026-03-03",
  raw_description: "PIX QRS MERCADO CENTRAL04/03",
  normalized_description: "pix qrs mercado central",
  amount: "-45.90",
  balance: null,
  currency: "BRL",
  direction: "debit",
  movement_type: "pix",
  counterparty_name: "mercado central",
  financial_nature: "expense",
  suggested_category: "alimentacao",
  confidence: "0.820",
  rationale: "Compra em mercado.",
  needs_review: false,
  recurrence_hint: false,
  is_neutral_nature: false,
  match_status: "likely",
  matched_transaction_id: "tx-1",
  match_score: "0.750",
  match_evidence: {
    agreed: ["amount", "date"],
    diverged: ["description"],
    day_difference: 1,
    reason: "Valor e data próximos.",
    alternatives: 0,
    already_imported: false,
  },
  previous_decision: null,
  fingerprint: "fp-1",
  prefix_hash: "px-1",
  ...overrides,
});

describe("mapStatementEntry", () => {
  it("preserva o valor como string, com sinal", () => {
    const mapped = mapStatementEntry(entryDto());

    expect(mapped.amount).toBe("-45.90");
    expect(typeof mapped.amount).toBe("string");
  });

  it("preserva a descrição original e a normalizada", () => {
    const mapped = mapStatementEntry(entryDto());

    expect(mapped.rawDescription).toBe("PIX QRS MERCADO CENTRAL04/03");
    expect(mapped.normalizedDescription).toBe("pix qrs mercado central");
  });

  it("descarta uma natureza fora do vocabulário", () => {
    // A tela decide cor, rótulo e se conta como transferência a partir disso;
    // propagar um valor desconhecido erraria os três.
    const mapped = mapStatementEntry(entryDto({ financial_nature: "teleporte" }));

    expect(mapped.financialNature).toBeNull();
  });

  it("cai em 'unique' num status desconhecido", () => {
    // Mostrar como nova é o erro seguro: o usuário pode desmarcar. Assumir
    // duplicata esconderia um lançamento real.
    const mapped = mapStatementEntry(entryDto({ match_status: "quem-sabe" }));

    expect(mapped.matchStatus).toBe("unique");
  });

  it("traz a evidência que a tela mostra", () => {
    const mapped = mapStatementEntry(entryDto());

    expect(mapped.matchEvidence.agreed).toEqual(["amount", "date"]);
    expect(mapped.matchEvidence.dayDifference).toBe(1);
    expect(mapped.matchEvidence.reason).toBe("Valor e data próximos.");
  });

  it("lê a decisão anterior quando existe", () => {
    const mapped = mapStatementEntry(entryDto({ previous_decision: "ignore" }));

    expect(mapped.previousDecision).toBe("ignore");
  });

  it("ignora uma decisão anterior irreconhecível", () => {
    const mapped = mapStatementEntry(entryDto({ previous_decision: "talvez" }));

    expect(mapped.previousDecision).toBeNull();
  });
});

describe("mapStatementPreview", () => {
  /**
   * Monta um DTO de prévia mínimo.
   *
   * @returns O DTO.
   */
  const previewDto = (): StatementPreviewDto => ({
    preview_token: "tok",
    expires_at: "2026-03-04T12:00:00Z",
    file_type: "pdf",
    bank_id: "itau",
    account_id: "acc-1",
    holder_name: "MARIA FICTICIA",
    period_start: "2026-03-01",
    period_end: "2026-03-07",
    page_count: 2,
    file_sha256: "sha",
    already_imported_file: false,
    blocked_by_conflicts: false,
    summary: {
      total_extracted: 20,
      movements: 13,
      balance_markers: 7,
      new_count: 13,
      exact_duplicates: 0,
      likely_duplicates: 0,
      possible_duplicates: 0,
      conflicts: 0,
      needs_review: 4,
      credit_total: "4512.34",
      debit_total: "1256.35",
      transfer_total: "1300.00",
      rejected_lines: 0,
    },
    entries: [entryDto()],
    rejected: [],
  });

  it("mantém os totais como string", () => {
    const mapped = mapStatementPreview(previewDto());

    expect(mapped.summary.creditTotal).toBe("4512.34");
    expect(mapped.summary.transferTotal).toBe("1300.00");
  });

  it("traz os metadados do documento", () => {
    const mapped = mapStatementPreview(previewDto());

    expect(mapped.bankId).toBe("itau");
    expect(mapped.holderName).toBe("MARIA FICTICIA");
    expect(mapped.pageCount).toBe(2);
  });

  it("tolera listas ausentes", () => {
    const mapped = mapStatementPreview({
      ...previewDto(),
      entries: undefined as never,
      rejected: undefined as never,
    });

    expect(mapped.entries).toEqual([]);
    expect(mapped.rejected).toEqual([]);
  });
});

describe("mapDecisionToDto", () => {
  it("envia null onde o usuário não decidiu nada", () => {
    const dto = mapDecisionToDto({ lineIndex: 3, action: "import" });

    expect(dto).toEqual({
      line_index: 3,
      action: "import",
      matched_transaction_id: null,
      category: null,
      financial_nature: null,
      title: null,
      ignore_reason: null,
    });
  });

  it("leva os overrides que o usuário escolheu", () => {
    const dto = mapDecisionToDto({
      lineIndex: 3,
      action: "link_existing",
      matchedTransactionId: "tx-9",
      category: "alimentacao",
      financialNature: "expense",
      title: "Meu título",
    });

    expect(dto.matched_transaction_id).toBe("tx-9");
    expect(dto.category).toBe("alimentacao");
    expect(dto.financial_nature).toBe("expense");
    expect(dto.title).toBe("Meu título");
  });
});

describe("mapStatementConfirmResult", () => {
  it("renomeia o identificador da linha que falhou", () => {
    const mapped = mapStatementConfirmResult({
      imported_count: 2,
      linked_count: 1,
      ignored_count: 3,
      skipped_count: 0,
      errors: [{ draft_id: "7", reason: "v1 recusou" }],
    });

    expect(mapped.importedCount).toBe(2);
    expect(mapped.errors[0]).toEqual({ lineIndex: "7", reason: "v1 recusou" });
  });
});
