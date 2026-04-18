import { describe, it, expect } from "vitest";
import { useNaiveTheme } from "./useNaiveTheme";

describe("useNaiveTheme", () => {
  it("returns theme and themeOverrides", () => {
    const { theme, themeOverrides } = useNaiveTheme();
    expect(theme).toBeDefined();
    expect(themeOverrides).toBeDefined();
  });

  it("primaryColor maps to cyan-500", () => {
    const { themeOverrides } = useNaiveTheme();
    expect(themeOverrides.common?.primaryColor).toBe("#44d4ff");
  });

  it("bodyColor maps to bg-canvas", () => {
    const { themeOverrides } = useNaiveTheme();
    expect(themeOverrides.common?.bodyColor).toBe("#05070d");
  });

  it("cardColor maps to bg-surface", () => {
    const { themeOverrides } = useNaiveTheme();
    expect(themeOverrides.common?.cardColor).toBe("#121a2a");
  });

  it("errorColor maps to negative token", () => {
    const { themeOverrides } = useNaiveTheme();
    expect(themeOverrides.common?.errorColor).toBe("#ff6f79");
  });

  it("successColor maps to positive token", () => {
    const { themeOverrides } = useNaiveTheme();
    expect(themeOverrides.common?.successColor).toBe("#42e8a9");
  });

  it("Button component overrides exist", () => {
    const { themeOverrides } = useNaiveTheme();
    expect(themeOverrides.Button?.colorPrimary).toBe("#44d4ff");
    expect(themeOverrides.Button?.textColorPrimary).toBe("#05070d");
  });

  it("Input component overrides include focus glow", () => {
    const { themeOverrides } = useNaiveTheme();
    expect(themeOverrides.Input?.boxShadowFocus).toContain("rgba(68, 212, 255");
  });
});
