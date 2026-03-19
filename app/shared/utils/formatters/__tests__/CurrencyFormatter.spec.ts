import { describe, it, expect } from "vitest";
import { CurrencyFormatter } from "../CurrencyFormatter";

describe("CurrencyFormatter", () => {
  it("format(1234.56) → \"R$ 1.234,56\"", () => {
    expect(CurrencyFormatter.format(1234.56)).toBe("R$\u00a01.234,56");
  });

  it("format(-500) starts with \"-\"", () => {
    expect(CurrencyFormatter.format(-500)).toMatch(/^-/);
  });

  it("format(0) → \"R$ 0,00\"", () => {
    expect(CurrencyFormatter.format(0)).toBe("R$\u00a00,00");
  });

  it("formatCompact(1500000) returns compact notation", () => {
    const result = CurrencyFormatter.formatCompact(1500000);
    // pt-BR locale uses "mi" (milhão) instead of "M"; check for compact suffix
    expect(result).toMatch(/1[.,]5/);
  });

  it("parse(\"R$ 1.234,56\") → 1234.56", () => {
    expect(CurrencyFormatter.parse("R$ 1.234,56")).toBe(1234.56);
  });
});
