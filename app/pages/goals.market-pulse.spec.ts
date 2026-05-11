import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/pages/goals.vue"), "utf8");

describe("Goals page — Market Pulse anatomy", () => {
  it("renders the canonical action, status, projection and simulator sections", () => {
    expect(source).toContain("goals-market-pulse");
    expect(source).toContain("action-highlights");
    expect(source).toContain("goals-status");
    expect(source).toContain("goals-timeline");
    expect(source).toContain("contribution-simulator");
  });

  it("keeps the canonical Portuguese section labels from the HTML prototype", () => {
    expect(source).toContain("O que fazer agora");
    expect(source).toContain("Status das Metas");
    expect(source).toContain("Projeção de Evolução Patrimonial");
    expect(source).toContain("Simulador de Aporte");
  });
});
