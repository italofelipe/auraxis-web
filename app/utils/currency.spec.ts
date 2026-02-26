import { describe, expect, it } from "vitest";

import { formatCurrency } from "./currency";

describe("formatCurrency", () => {
  it("formata valor em BRL", () => {
    expect(formatCurrency(1234.56)).toContain("1.234,56");
  });
});
