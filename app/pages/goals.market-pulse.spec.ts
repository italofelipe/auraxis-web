import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/pages/goals/index.vue"), "utf8");

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

  it("links goal cards to the dedicated goal detail route", () => {
    expect(source).toContain("Ver detalhes");
    expect(source).toContain("navigateTo(`/goals/${goal.id}`)");
  });

  it("keeps registering progress as the primary goal card action", () => {
    expect(source).toContain("GoalContributionModal");
    expect(source).toContain("onRegisterContribution");
    expect(source).toContain("Registrar entrada");
  });

  it("suggests explicit completion when a goal reaches the target", () => {
    expect(source).toContain("isGoalReached");
    expect(source).toContain("Meta alcançada");
    expect(source).toContain("Concluir meta");
  });

  it("does not replace an empty authenticated goals list with sample goals", () => {
    expect(source).not.toContain("MARKET_PULSE_GOALS");
    expect(source).not.toContain("Dados demonstrativos");
    expect(source).toContain("Suas metas começam aqui");
    expect(source).toContain("v-if=\"goalCards.length === 0\"");
  });
});
