import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/pages/portfolio.vue"), "utf8");

describe("Portfolio page — Market Pulse anatomy", () => {
  it("renders the canonical KPI, allocation and positions sections", () => {
    expect(source).toContain("portfolio-market-pulse");
    expect(source).toContain("summary-kpis");
    expect(source).toContain("NetWorthTimeline");
    expect(source).toContain("portfolio-allocation");
    expect(source).toContain("portfolio-positions");
  });

  it("keeps the canonical Portuguese section labels backed by real data", () => {
    expect(source).toContain("Visão Geral da Carteira");
    expect(source).toContain("Patrimônio Total");
    expect(source).toContain("Projeção Patrimonial");
    expect(source).toContain("Total Investido");
    expect(source).toContain("Resultado Total");
    expect(source).toContain("Alocação por Classe");
    expect(source).toContain("Posição Detalhada de Ativos");
  });

  it("binds the real-data KPI cards to the portfolio summary query (#979)", () => {
    // Positive assertions: the cards read live query values, not hardcoded numbers.
    expect(source).toContain("computedSummary.total_value");
    expect(source).toContain("computedSummary.total_cost");
    expect(source).toContain("computedSummary.total_return_percent");
    expect(source).toContain("totalReturnAmount");
  });

  it("does not fall back to demo assets when the authenticated wallet is empty", () => {
    expect(source).not.toContain("MOCK_WALLET_ENTRIES");
    expect(source).not.toContain("MOCK_PORTFOLIO_SUMMARY");
    expect(source).not.toContain("Carteira demonstrativa");
    expect(source).toContain("Comece adicionando seu primeiro ativo");
  });

  it("contains no fabricated financial literals or benchmark placeholders (#979)", () => {
    // Removed: invented monthly/yearly return cards and benchmark pills.
    expect(source).not.toContain("Rentabilidade (Mês)");
    expect(source).not.toContain("Rentabilidade (Ano)");
    expect(source).not.toContain("vs. Ibovespa");
    expect(source).not.toContain("vs. CDI");
    expect(source).not.toContain("3,20%");
    expect(source).not.toContain("14,50%");
    // Removed: synthetic performance series + its multipliers.
    expect(source).not.toContain("0.0365");
    expect(source).not.toContain("0.145");
    expect(source).not.toContain("0.031");
    expect(source).not.toContain("day_change_percent: 0.84");
  });

  it("only wires CTAs that have a real action (#979)", () => {
    // The single real CTA opens the entry form.
    expect(source).toContain("@click=\"showEntryForm = true\"");
    // Removed dead controls.
    expect(source).not.toContain("Exportar");
    expect(source).not.toContain("Resgatar");
    expect(source).not.toContain("Buscar ativo...");
    expect(source).not.toContain("range-tabs");
    expect(source).not.toContain("position-filter");
  });
});
