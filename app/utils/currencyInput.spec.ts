import { describe, expect, it } from "vitest";

import {
  formatCurrencyCentsInput,
  parseCurrencyCentsInput,
  serializeCurrencyAmount,
} from "./currencyInput";

describe("currency input helpers", () => {
  it("interprets typed digits as cents", () => {
    expect(parseCurrencyCentsInput("1")).toBe(0.01);
    expect(parseCurrencyCentsInput("12")).toBe(0.12);
    expect(parseCurrencyCentsInput("123")).toBe(1.23);
    expect(parseCurrencyCentsInput("123456")).toBe(1234.56);
  });

  it("accepts already formatted pt-BR currency strings", () => {
    expect(parseCurrencyCentsInput("R$ 1.234,56")).toBe(1234.56);
  });

  it("formats numeric values as BRL currency", () => {
    expect(formatCurrencyCentsInput(1234.56)).toBe("R$ 1.234,56");
    expect(formatCurrencyCentsInput(null)).toBe("");
  });

  it("serializes payload amounts with two decimal places", () => {
    expect(serializeCurrencyAmount(1234.5)).toBe("1234.50");
    expect(serializeCurrencyAmount(null)).toBe("0.00");
  });
});
