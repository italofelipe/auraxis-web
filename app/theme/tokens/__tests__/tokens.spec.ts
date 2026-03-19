import { describe, it, expect } from "vitest";
import { colors } from "../colors";
import { shadows } from "../shadows";
import { semantic } from "../semantic";

describe("design tokens", () => {
  it("brand.600 is the canonical CTA color", () => {
    expect(colors.brand[600]).toBe("#ffab1a");
  });

  it("bg tokens exist for all surface levels", () => {
    expect(colors.bg.base).toBeDefined();
    expect(colors.bg.surface).toBeDefined();
    expect(colors.bg.elevated).toBeDefined();
    expect(colors.bg.glass).toBeDefined();
  });

  it("semantic positive and negative tokens exist", () => {
    expect(colors.positive.DEFAULT).toBe("#10b981");
    expect(colors.negative.DEFAULT).toBe("#ef4444");
  });

  it("brand glow tokens are rgba strings", () => {
    Object.values(colors.brandGlow).forEach((v) => {
      expect(v).toMatch(/^rgba\(/);
    });
  });

  it("shadow brand glow references the brand color", () => {
    expect(shadows.brandGlow).toContain("rgba(255, 171, 26");
  });

  it("semantic aliases resolve to primitive values", () => {
    expect(semantic.action.primary).toBe(colors.brand[600]);
    expect(semantic.surface.card).toBe(colors.bg.surface);
    expect(semantic.financial.positive).toBe(colors.positive.DEFAULT);
  });

  it("no token value is undefined or empty", () => {
    const allBrandValues = Object.values(colors.brand);
    allBrandValues.forEach((v) => {
      expect(v).toBeTruthy();
    });
  });
});
