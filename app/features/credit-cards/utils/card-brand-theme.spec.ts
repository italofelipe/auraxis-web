import { describe, expect, it } from "vitest";

import {
  CARD_BRAND_THEME,
  CATEGORY_FALLBACK_PALETTE,
  categoryColor,
  resolveCardTheme,
} from "./card-brand-theme";

describe("resolveCardTheme", () => {
  it("prefers a known bank over the brand", () => {
    const theme = resolveCardTheme({ brand: "mastercard", bank: "Nubank" });
    expect(theme.color).toBe("#820AD1");
  });

  it("normalizes the bank name (case/spacing/accents-as-written)", () => {
    expect(resolveCardTheme({ brand: "visa", bank: "  MERCADO PAGO " }).color).toBe("#00A6E6");
    expect(resolveCardTheme({ brand: "visa", bank: "Itaú" }).color).toBe("#EC7000");
  });

  it("falls back to the brand theme when the bank is unknown", () => {
    expect(resolveCardTheme({ brand: "visa", bank: "Banco XPTO" })).toEqual(CARD_BRAND_THEME.visa);
  });

  it("falls back to 'other' when brand is null and bank is unknown", () => {
    expect(resolveCardTheme({ brand: null, bank: null })).toEqual(CARD_BRAND_THEME.other);
  });
});

describe("categoryColor", () => {
  it("returns the tag color when defined", () => {
    expect(categoryColor("#FF0000", 3)).toBe("#FF0000");
  });

  it("trims whitespace from the tag color", () => {
    expect(categoryColor("  #abc ", 0)).toBe("#abc");
  });

  it("uses a stable palette color when the tag color is null/empty", () => {
    expect(categoryColor(null, 0)).toBe(CATEGORY_FALLBACK_PALETTE[0]);
    expect(categoryColor("", 1)).toBe(CATEGORY_FALLBACK_PALETTE[1]);
    expect(categoryColor("   ", 2)).toBe(CATEGORY_FALLBACK_PALETTE[2]);
  });

  it("wraps the palette index deterministically", () => {
    const len = CATEGORY_FALLBACK_PALETTE.length;
    expect(categoryColor(null, len)).toBe(CATEGORY_FALLBACK_PALETTE[0]);
    expect(categoryColor(null, len + 2)).toBe(CATEGORY_FALLBACK_PALETTE[2]);
    expect(categoryColor(null, -1)).toBe(CATEGORY_FALLBACK_PALETTE[len - 1]);
  });
});
