import { describe, expect, it } from "vitest";

import { clamp, formatDecimal, formatPercentage } from "./number";

// ---------------------------------------------------------------------------
// formatPercentage
// ---------------------------------------------------------------------------

describe("formatPercentage", () => {
  it("formata 0.125 como porcentagem com 2 decimais", () => {
    expect(formatPercentage(0.125)).toContain("12,50");
  });

  it("formata 1 como 100%", () => {
    expect(formatPercentage(1)).toContain("100");
  });

  it("formata 0 como 0%", () => {
    expect(formatPercentage(0)).toContain("0");
  });

  it("respeita o parâmetro decimals", () => {
    const result = formatPercentage(0.1255, 0);
    expect(result).toContain("13");
  });

  it("retorna string não vazia", () => {
    expect(formatPercentage(0.5)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// formatDecimal
// ---------------------------------------------------------------------------

describe("formatDecimal", () => {
  it("formata 1234.56 com separador de milhar pt-BR", () => {
    expect(formatDecimal(1234.56)).toContain("1.234,56");
  });

  it("usa 2 decimais por padrão", () => {
    expect(formatDecimal(1)).toContain("1,00");
  });

  it("respeita o parâmetro decimals = 0", () => {
    expect(formatDecimal(1234.56, 0)).toContain("1.235");
  });

  it("formata zero corretamente", () => {
    expect(formatDecimal(0)).toContain("0,00");
  });

  it("formata valores negativos", () => {
    expect(formatDecimal(-99.5)).toContain("99,50");
  });
});

// ---------------------------------------------------------------------------
// clamp
// ---------------------------------------------------------------------------

describe("clamp", () => {
  it("retorna o valor quando está dentro do intervalo", () => {
    expect(clamp(42, 0, 100)).toBe(42);
  });

  it("retorna min quando o valor é menor que min", () => {
    expect(clamp(-5, 0, 100)).toBe(0);
  });

  it("retorna max quando o valor é maior que max", () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });

  it("retorna min quando o valor é igual a min", () => {
    expect(clamp(0, 0, 100)).toBe(0);
  });

  it("retorna max quando o valor é igual a max", () => {
    expect(clamp(100, 0, 100)).toBe(100);
  });

  it("funciona com valores de ponto flutuante", () => {
    expect(clamp(1.5, 0, 1)).toBe(1);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });
});
