import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/pages/goals/[id]/index.vue"), "utf8");
const aiPanelSource = readFileSync(
  join(process.cwd(), "app/components/goal/GoalAiContextPanel/GoalAiContextPanel.vue"),
  "utf8",
);

describe("Goal detail page — AI projection integration", () => {
  it("renders the dedicated AI context panel with the selected goal", () => {
    expect(source).toContain("GoalAiContextPanel");
    expect(source).toContain(":goal=\"selectedGoal\"");
    expect(source).toContain(":monthly-contribution=\"monthlyContribution\"");
  });

  it("loads recent transactions from the last 90 days to enrich the AI prompt", () => {
    expect(source).toContain("useListTransactionsQuery");
    expect(source).toContain("start_date");
    expect(source).toContain("end_date");
  });

  it("allows the AI panel to shrink on mobile without horizontal overflow", () => {
    expect(source).toContain("grid-template-columns: minmax(0, 1fr);");
    expect(source).toContain("min-width: 0;");
    expect(aiPanelSource).toContain(".goal-ai-panel textarea");
    expect(aiPanelSource).toContain("min-width: 0;");
  });
});
