/**
 * Regras de domínio da revisão de extrato.
 *
 * A que mais importa: o que uma linha faz quando o usuário não decidiu nada.
 * Um padrão errado aqui vira uma transferência contada como despesa, ou uma
 * duplicata criada, sem que ninguém tenha escolhido nada.
 */
import { describe, expect, it } from "vitest";

import {
  effectiveAction,
  matchesStatementFilter,
  type MatchStatus,
  type StatementEntry,
} from "~/features/import/model/statement-import";

/**
 * Monta uma linha de extrato com valores plausíveis.
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
  rawDescription: "PIX QRS MERCADO CENTRAL",
  normalizedDescription: "pix qrs mercado central",
  amount: "-45.90",
  balance: null,
  currency: "BRL",
  direction: "debit",
  movementType: "pix",
  counterpartyName: "mercado central",
  financialNature: "unclassified_out",
  suggestedCategory: null,
  confidence: "0.300",
  rationale: "PIX para terceiro.",
  needsReview: true,
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
  fingerprint: "abc",
  ...overrides,
});

describe("effectiveAction", () => {
  it("propõe importar uma linha nova", () => {
    expect(effectiveAction(entry(), undefined)).toBe("import");
  });

  it("deixa transferências e pagamentos de fatura de fora por padrão", () => {
    // Contá-los como despesa é justamente a dupla contagem que a feature
    // existe para evitar — quem quiser importar marca explicitamente.
    expect(effectiveAction(entry({ isNeutralNature: true }), undefined)).toBeNull();
  });

  it("não reoferece o que já foi importado", () => {
    expect(effectiveAction(entry({ matchStatus: "exact" }), undefined)).toBeNull();
  });

  it("não escolhe por conta própria num conflito", () => {
    // Dois candidatos e nenhum critério para decidir: qualquer padrão aqui
    // duplicaria uma transação ou esconderia outra.
    expect(effectiveAction(entry({ matchStatus: "conflict" }), undefined)).toBeNull();
  });

  it("nunca importa um marcador de saldo", () => {
    expect(effectiveAction(entry({ kind: "balance_marker" }), undefined)).toBeNull();
  });

  it("obedece à decisão explícita do usuário acima de tudo", () => {
    const decided = effectiveAction(entry({ matchStatus: "exact" }), {
      lineIndex: 1,
      action: "import",
    });

    expect(decided).toBe("import");
  });
});

describe("matchesStatementFilter", () => {
  it("mostra tudo em 'all'", () => {
    expect(matchesStatementFilter(entry({ kind: "balance_marker" }), "all")).toBe(true);
  });

  it.each<[MatchStatus, string]>([
    ["unique", "new"],
    ["exact", "exact"],
    ["likely", "likely"],
  ])("casa %s com o filtro %s", (status, filter) => {
    expect(
      matchesStatementFilter(entry({ matchStatus: status }), filter as never),
    ).toBe(true);
  });

  it("trata conflito e possível duplicata como ambíguos", () => {
    expect(matchesStatementFilter(entry({ matchStatus: "conflict" }), "ambiguous")).toBe(
      true,
    );
    expect(matchesStatementFilter(entry({ matchStatus: "possible" }), "ambiguous")).toBe(
      true,
    );
  });

  it("mantém transferências fora de receitas e despesas", () => {
    // Uma transferência tem direção, mas não é receita nem despesa. Listá-la
    // sob esses rótulos é a confusão que a feature existe para desfazer.
    const transfer = entry({ isNeutralNature: true, direction: "debit" });

    expect(matchesStatementFilter(transfer, "expense")).toBe(false);
    expect(matchesStatementFilter(transfer, "transfers")).toBe(true);
  });

  it("separa entradas de saídas", () => {
    expect(matchesStatementFilter(entry({ direction: "credit" }), "income")).toBe(true);
    expect(matchesStatementFilter(entry({ direction: "credit" }), "expense")).toBe(false);
  });

  it("agrupa as duas naturezas não classificadas", () => {
    expect(
      matchesStatementFilter(entry({ financialNature: "unclassified_in" }), "unclassified"),
    ).toBe(true);
    expect(
      matchesStatementFilter(entry({ financialNature: "income" }), "unclassified"),
    ).toBe(false);
  });
});
