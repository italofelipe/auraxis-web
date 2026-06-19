import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Reads a repository source file for copy and positioning assertions.
 *
 * @param relativePath Relative source path.
 * @returns UTF-8 file contents.
 */
const readSource = (relativePath: string): string =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("budgets page envelope positioning", () => {
  it("positions budgets as automatic monthly envelopes with concrete examples", () => {
    const source = readSource("app/pages/budgets.vue");

    expect(source).toContain("envelopes automáticos");
    expect(source).toContain("Streaming");
    expect(source).toContain("Mercado");
    expect(source).toContain("Transporte");
    expect(source).toContain("Comprometido");
  });

  it("renders the C+A monthly review structure instead of loose budget cards", () => {
    const source = readSource("app/pages/budgets.vue");

    expect(source).toContain("Revisão mensal de envelopes");
    expect(source).toContain("budgets-page__review-grid");
    expect(source).toContain("budgets-page__envelope-list");
    expect(source).toContain("budgets-page__detail-panel");
    expect(source).toContain("selectedEnvelope");
  });

  it("connects the selected envelope to transaction review without adding budget_id", () => {
    const source = readSource("app/pages/budgets.vue");

    expect(source).toContain("useListTransactionsQuery");
    expect(source).toContain("buildBudgetTransactionFilters");
    expect(source).toContain("Revisar transações");
    expect(source).not.toContain("budget_id");
  });
});
