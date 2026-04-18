import { describe, it, expect } from "vitest";
import { colors } from "../colors";
import { shadows } from "../shadows";
import { semantic } from "../semantic";

describe("design tokens", () => {
  it("cyan.500 is the canonical CTA color", () => {
    expect(colors.cyan[500]).toBe("#44d4ff");
  });

  it("bg tokens exist for all surface levels", () => {
    expect(colors.bg.canvas).toBeDefined();
    expect(colors.bg.surface).toBeDefined();
    expect(colors.bg.elevated).toBeDefined();
    expect(colors.bg.glass).toBeDefined();
  });

  it("semantic positive and negative tokens exist", () => {
    expect(colors.positive.DEFAULT).toBe("#42e8a9");
    expect(colors.negative.DEFAULT).toBe("#ff6f79");
  });

  it("shadow brand glow references the cyan color", () => {
    expect(shadows.brandGlow).toContain("rgba(68, 212, 255");
  });

  it("semantic aliases resolve to primitive values", () => {
    expect(semantic.action.primary).toBe(colors.cyan[500]);
    expect(semantic.surface.card).toBe(colors.bg.surface);
    expect(semantic.financial.positive).toBe(colors.positive.DEFAULT);
  });

  it("no cyan value is undefined or empty", () => {
    const allCyanValues = Object.values(colors.cyan);
    allCyanValues.forEach((v) => {
      expect(v).toBeTruthy();
    });
  });
});
