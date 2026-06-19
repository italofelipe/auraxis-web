import { describe, expect, it } from "vitest";

import { computeSignedAmount } from "./contribution-amount";

describe("computeSignedAmount", () => {
  it("keeps a deposit amount positive", () => {
    expect(computeSignedAmount(250, "deposit")).toBe(250);
  });

  it("negates a withdrawal amount", () => {
    expect(computeSignedAmount(50, "withdrawal")).toBe(-50);
  });

  it("preserves fractional cents", () => {
    expect(computeSignedAmount(99.9, "deposit")).toBe(99.9);
    expect(computeSignedAmount(99.9, "withdrawal")).toBe(-99.9);
  });

  it("returns null for a null magnitude", () => {
    expect(computeSignedAmount(null, "deposit")).toBeNull();
  });

  it("returns null for a zero magnitude", () => {
    expect(computeSignedAmount(0, "deposit")).toBeNull();
    expect(computeSignedAmount(0, "withdrawal")).toBeNull();
  });

  it("returns null for a non-finite magnitude", () => {
    expect(computeSignedAmount(Number.NaN, "deposit")).toBeNull();
    expect(computeSignedAmount(Number.POSITIVE_INFINITY, "withdrawal")).toBeNull();
  });

  it("returns null for a negative magnitude (UI always supplies a positive)", () => {
    expect(computeSignedAmount(-10, "deposit")).toBeNull();
  });
});
