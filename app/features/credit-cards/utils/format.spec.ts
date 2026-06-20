import { describe, expect, it } from "vitest";

import { formatCurrencyShort, formatDayMonth } from "./format";

describe("formatCurrencyShort", () => {
  it("renders sub-thousand values as whole reais", () => {
    expect(formatCurrencyShort(980)).toBe("R$ 980");
    expect(formatCurrencyShort(0)).toBe("R$ 0");
  });

  it("renders thousands with one decimal up to 10k", () => {
    expect(formatCurrencyShort(12340)).toBe("R$ 12k");
    expect(formatCurrencyShort(1234)).toBe("R$ 1,2k");
  });
});

describe("formatDayMonth", () => {
  it("extracts DD/MM from an ISO date", () => {
    expect(formatDayMonth("2026-06-10")).toBe("10/06");
  });

  it("returns a dash for null/invalid input", () => {
    expect(formatDayMonth(null)).toBe("—");
    expect(formatDayMonth("")).toBe("—");
  });
});
