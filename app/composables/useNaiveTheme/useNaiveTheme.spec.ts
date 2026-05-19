import { describe, expect, it } from "vitest";
import { useNaiveTheme } from "./useNaiveTheme";
import { buildNaiveThemeOverrides } from "~/utils/naive-theme";

describe("useNaiveTheme", () => {
  it("returns reactive theme and themeOverrides refs", () => {
    const { theme, themeOverrides } = useNaiveTheme();

    expect(theme).toBeDefined();
    expect(themeOverrides.value).toBeDefined();
  });

  it("builds light overrides from semantic light tokens", () => {
    const themeOverrides = buildNaiveThemeOverrides("light");

    expect(themeOverrides.common?.primaryColor).toBe("#087FA7");
    expect(themeOverrides.common?.bodyColor).toBe("#F4F8FB");
    expect(themeOverrides.common?.cardColor).toBe("#FFFFFF");
    expect(themeOverrides.Button?.textColorPrimary).toBe("#FFFFFF");
    expect(themeOverrides.Input?.boxShadowFocus).toContain("rgba(8, 127, 167");
  });

  it("builds dark overrides from semantic dark tokens", () => {
    const themeOverrides = buildNaiveThemeOverrides("dark");

    expect(themeOverrides.common?.primaryColor).toBe("#44d4ff");
    expect(themeOverrides.common?.bodyColor).toBe("#05070d");
    expect(themeOverrides.common?.cardColor).toBe("#121a2a");
    expect(themeOverrides.Button?.textColorPrimary).toBe("#05070d");
    expect(themeOverrides.Input?.boxShadowFocus).toContain("rgba(68, 212, 255");
  });

  it("keeps overlay components mapped to the active palette", () => {
    const light = buildNaiveThemeOverrides("light");
    const dark = buildNaiveThemeOverrides("dark");

    expect(light.Select?.peers?.InternalSelectMenu?.color).toBe("#F8FBFF");
    expect(dark.Select?.peers?.InternalSelectMenu?.color).toBe("#0e1523");
    expect(light.DataTable?.thColor).toBe("#F8FBFF");
    expect(dark.DataTable?.thColor).toBe("#0e1523");
  });
});
