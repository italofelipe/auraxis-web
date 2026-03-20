import { describe, it, expect } from "vitest";
import { PercentFormatter } from "../PercentFormatter";

describe("PercentFormatter", () => {
  it("format(12.5) → \"+12,50%\"", () => {
    expect(PercentFormatter.format(12.5)).toBe("+12,50%");
  });

  it("format(-3.2) → \"-3,20%\"", () => {
    expect(PercentFormatter.format(-3.2)).toBe("-3,20%");
  });

  it("format(0) → \"0,00%\"", () => {
    expect(PercentFormatter.format(0)).toBe("0,00%");
  });

  it("fromDecimal(0.125) → \"+12,50%\"", () => {
    expect(PercentFormatter.fromDecimal(0.125)).toBe("+12,50%");
  });

  it("formatAbs(-12.5) → \"12,50%\"", () => {
    expect(PercentFormatter.formatAbs(-12.5)).toBe("12,50%");
  });
});
