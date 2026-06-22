import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { useChartTheme } from "./useChartTheme";

const resolvedTheme = ref<"light" | "dark">("light");

// useChartTheme depends on the global useTheme composable. Drive it with a local
// ref so we can assert the ECharts theme recomputes for both light and dark.
// vi.mock is hoisted above imports, so the mock applies despite the import order.
vi.mock("~/composables/useTheme", () => ({
  useTheme: (): { resolvedTheme: typeof resolvedTheme } => ({ resolvedTheme }),
}));

describe("useChartTheme", () => {
  it("builds the light ECharts theme by default", () => {
    resolvedTheme.value = "light";
    const { auraxisEChartsTheme } = useChartTheme();

    expect(auraxisEChartsTheme.value.backgroundColor).toBe("transparent");
    expect(auraxisEChartsTheme.value.tooltip).toMatchObject({
      backgroundColor: "#FFFFFF",
    });
  });

  it("recomputes the theme when the resolved theme flips to dark", () => {
    resolvedTheme.value = "light";
    const { auraxisEChartsTheme } = useChartTheme();
    const lightTooltip = (auraxisEChartsTheme.value.tooltip as { backgroundColor: string })
      .backgroundColor;

    resolvedTheme.value = "dark";
    const darkTooltip = (auraxisEChartsTheme.value.tooltip as { backgroundColor: string })
      .backgroundColor;

    expect(darkTooltip).not.toBe(lightTooltip);
    expect(darkTooltip).toContain("rgba");
  });
});
