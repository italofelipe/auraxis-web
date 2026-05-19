import { describe, expect, it } from "vitest";
import {
  buildAuraxisEChartsTheme,
  buildChartThemeTokens,
  withAlpha,
} from "./chart-theme";

describe("chart-theme", () => {
  it("converts hex colours to rgba", () => {
    expect(withAlpha("#087FA7", 0.5)).toBe("rgba(8, 127, 167, 0.5)");
    expect(withAlpha("#fff", 0.25)).toBe("rgba(255, 255, 255, 0.25)");
  });

  it("replaces alpha in rgb and rgba colours", () => {
    expect(withAlpha("rgb(8, 127, 167)", 0.5)).toBe("rgba(8, 127, 167, 0.5)");
    expect(withAlpha("rgba(255, 255, 255, 0.1)", 0.24)).toBe("rgba(255, 255, 255, 0.24)");
  });

  it("builds distinct light and dark chart tokens", () => {
    const light = buildChartThemeTokens("light");
    const dark = buildChartThemeTokens("dark");

    expect(light.tooltipBackground).toBe("#FFFFFF");
    expect(light.primaryText).toBe("#0A1628");
    expect(dark.tooltipBackground).toBe("rgba(14, 21, 35, 0.96)");
    expect(dark.primaryText).toBe("#f1f5ff");
    expect(light.series).not.toEqual(dark.series);
  });

  it("maps tokens into an ECharts theme object", () => {
    const theme = buildAuraxisEChartsTheme("light");

    expect(theme.backgroundColor).toBe("transparent");
    expect(theme.tooltip).toMatchObject({
      backgroundColor: "#FFFFFF",
      borderColor:     "#087FA7",
    });
    expect(theme.legend).toMatchObject({
      textStyle: { color: "#5D6F89" },
    });
  });
});
