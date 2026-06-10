import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const componentSource = readFileSync(
  join(process.cwd(), "app/components/goal/GoalContributionModal/GoalContributionModal.vue"),
  "utf8",
);
const typeSource = readFileSync(
  join(process.cwd(), "app/components/goal/GoalContributionModal/GoalContributionModal.types.ts"),
  "utf8",
);

describe("GoalContributionModal initial direction", () => {
  it("allows callers to open directly in deposit or withdrawal mode", () => {
    expect(typeSource).toContain("initialDirection?: ContributionDirection");
    expect(componentSource).toContain("props.initialDirection ?? \"deposit\"");
  });
});
