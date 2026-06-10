import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/pages/goals/index.vue"), "utf8");

describe("Goals page — Market Pulse anatomy", () => {
  it("renders the hub command, metrics, list and selected-goal detail sections", () => {
    expect(source).toContain("goals-hub");
    expect(source).toContain("goals-hub__command");
    expect(source).toContain("goals-hub__metrics");
    expect(source).toContain("goals-hub__review-grid");
    expect(source).toContain("goals-hub__goal-list");
    expect(source).toContain("goals-hub__detail-panel");
  });

  it("positions goals as a progress decision hub without duplicating the shell title", () => {
    expect(source).toContain("Central de progresso");
    expect(source).toContain("Próximo real disponível");
    expect(source).toContain("Meta selecionada");
    expect(source).not.toContain("<h1>Metas Financeiras</h1>");
  });

  it("links the selected goal workflow to contribution, completion and detail actions", () => {
    expect(source).toContain("Ver detalhes");
    expect(source).toContain("navigateTo(`/goals/${goal.id}`)");
    expect(source).toContain("GoalContributionModal");
    expect(source).toContain("onRegisterContribution");
    expect(source).toContain("Registrar entrada");
    expect(source).toContain("isGoalReached");
    expect(source).toContain("Meta alcançada");
    expect(source).toContain("Concluir meta");
  });

  it("does not replace an empty authenticated goals list with sample goals", () => {
    expect(source).not.toContain("MARKET_PULSE_GOALS");
    expect(source).not.toContain("Dados demonstrativos");
    expect(source).toContain("Suas metas começam aqui");
    expect(source).toContain("goalCards.length === 0");
  });

  it("uses real hub model helpers instead of page-local fake monthly deltas", () => {
    expect(source).toContain("normalizeGoalHubItem");
    expect(source).toContain("buildGoalHubSummary");
    expect(source).toContain("pickDefaultGoalHubItem");
    expect(source).not.toContain("-R$ 350 defasagem");
    expect(source).not.toContain("monthlyContribution = [1500, 2000, 500, 1200]");
  });

  it("places AI recommendations and latest contribution context near the selected goal", () => {
    expect(source).toContain("useGoalContributionsQuery");
    expect(source).toContain("Último movimento");
    expect(source).toContain("AiInsightSurface");
    expect(source).toContain("IA para próximos aportes");
  });
});
