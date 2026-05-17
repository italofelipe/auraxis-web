import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/pages/portfolio.vue"), "utf8");

describe("Portfolio page — Market Pulse anatomy", () => {
  it("renders the canonical KPI, performance, allocation and positions sections", () => {
    expect(source).toContain("portfolio-market-pulse");
    expect(source).toContain("summary-kpis");
    expect(source).toContain("NetWorthTimeline");
    expect(source).toContain("portfolio-performance");
    expect(source).toContain("portfolio-allocation");
    expect(source).toContain("portfolio-positions");
  });

  it("keeps the canonical Portuguese section labels from the HTML prototype", () => {
    expect(source).toContain("Visão Geral da Carteira");
    expect(source).toContain("Patrimônio Total");
    expect(source).toContain("Projeção Patrimonial");
    expect(source).toContain("Rentabilidade (Mês)");
    expect(source).toContain("Alocação por Classe");
    expect(source).toContain("Posição Detalhada de Ativos");
  });
});
