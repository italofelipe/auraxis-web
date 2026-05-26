import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/pages/insights.vue"), "utf8");

describe("Insights page — deep link and source surface", () => {
  it("opens the requested report from the open query param", () => {
    expect(source).toContain("useRoute()");
    expect(source).toContain("route.query.open");
    expect(source).toContain("selectedInsightId");
    expect(source).toContain("Relatório global");
    expect(source).toContain("Histórico de insights gerados");
  });

  it("generates global insights from the hub surface", () => {
    expect(source).toContain("source-surface=\"insights\"");
  });
});
