import { describe, it, expect } from "vitest";
import { TrendFormatter } from "../TrendFormatter";

describe("TrendFormatter", () => {
  it("format(12.5).direction === \"positive\"", () => {
    expect(TrendFormatter.format(12.5).direction).toBe("positive");
  });

  it("format(-3.2).direction === \"negative\"", () => {
    expect(TrendFormatter.format(-3.2).direction).toBe("negative");
  });

  it("format(0).direction === \"neutral\"", () => {
    expect(TrendFormatter.format(0).direction).toBe("neutral");
  });

  it("format(12.5).colorVar === \"var(--color-positive)\"", () => {
    expect(TrendFormatter.format(12.5).colorVar).toBe("var(--color-positive)");
  });

  it("format(-3.2).colorVar === \"var(--color-negative)\"", () => {
    expect(TrendFormatter.format(-3.2).colorVar).toBe("var(--color-negative)");
  });

  it("format(12.5).label === \"+12,50%\"", () => {
    expect(TrendFormatter.format(12.5).label).toBe("+12,50%");
  });
});
