import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const calculatorSources = [
  "app/features/tools/thirteenth-salary/page.vue",
  "app/pages/tools/fgts.vue",
  "app/pages/tools/ferias.vue",
  "app/pages/tools/salario-liquido.vue",
  "app/features/tools/hora-extra/page.vue",
  "app/pages/tools/rescisao.vue",
].map((path) => ({
  path,
  source: readFileSync(join(process.cwd(), path), "utf8"),
}));

const sharedShellSource = readFileSync(
  join(process.cwd(), "app/components/tool/LaborCalculatorMarketPulse/LaborCalculatorMarketPulsePage.vue"),
  "utf8",
);

describe("Labor calculators — Market Pulse anatomy", () => {
  it("uses the canonical labor calculator shell on every MVP2 labor route", () => {
    for (const { path, source } of calculatorSources) {
      expect(source, path).toContain("LaborCalculatorMarketPulsePage");
      expect(source, path).toContain("labor-calculator-market-pulse");
    }
  });

  it("keeps the shared blue/cyan dashboard anatomy in the reusable shell", () => {
    expect(sharedShellSource).toContain("labor-calculator-market-pulse__hero");
    expect(sharedShellSource).toContain("labor-calculator-market-pulse__layout");
    expect(sharedShellSource).toContain("labor-calculator-market-pulse__form-panel");
    expect(sharedShellSource).toContain("labor-calculator-market-pulse__results-grid");
    expect(sharedShellSource).toContain("labor-calculator-market-pulse__breakdown");
    expect(sharedShellSource).toContain("labor-calculator-market-pulse__formula");
    expect(sharedShellSource).toContain("labor-calculator-market-pulse__scenario-rail");
  });
});
