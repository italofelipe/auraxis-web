import { describe, expect, it } from "vitest";

import { formatCurrency } from "./currency";

describe("formatCurrency", () => {
  it("formata valor em BRL", () => {
    expect(formatCurrency(1234.56)).toContain("1.234,56");
  });

  it("does not render NaN for invalid monetary values", () => {
    expect(formatCurrency(Number.NaN)).not.toContain("NaN");
    expect(formatCurrency(Number.POSITIVE_INFINITY)).not.toContain("Infinity");
    expect(formatCurrency(undefined)).toContain("0,00");
  });
});
