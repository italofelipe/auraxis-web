import { describe, it, expect } from "vitest";
import { useNaiveTheme } from "./useNaiveTheme";

describe("useNaiveTheme", () => {
  it("returns theme and themeOverrides", () => {
    const { theme, themeOverrides } = useNaiveTheme();
    expect(theme).toBeDefined();
    expect(themeOverrides).toBeDefined();
  });

  it("primaryColor maps to brand-600", () => {
    const { themeOverrides } = useNaiveTheme();
    expect(themeOverrides.common?.primaryColor).toBe("#ffab1a");
  });

  it("bodyColor maps to bg-base", () => {
    const { themeOverrides } = useNaiveTheme();
    expect(themeOverrides.common?.bodyColor).toBe("#0b0909");
  });

  it("cardColor maps to bg-surface", () => {
    const { themeOverrides } = useNaiveTheme();
    expect(themeOverrides.common?.cardColor).toBe("#272020");
  });

  it("errorColor maps to negative token", () => {
    const { themeOverrides } = useNaiveTheme();
    expect(themeOverrides.common?.errorColor).toBe("#ef4444");
  });

  it("successColor maps to positive token", () => {
    const { themeOverrides } = useNaiveTheme();
    expect(themeOverrides.common?.successColor).toBe("#10b981");
  });

  it("Button component overrides exist", () => {
    const { themeOverrides } = useNaiveTheme();
    expect(themeOverrides.Button?.colorPrimary).toBe("#ffab1a");
    expect(themeOverrides.Button?.textColorPrimary).toBe("#0b0909");
  });

  it("Input component overrides include focus glow", () => {
    const { themeOverrides } = useNaiveTheme();
    expect(themeOverrides.Input?.boxShadowFocus).toContain("rgba(255, 171, 26");
  });
});
