import { describe, expect, it } from "vitest";

import type { GoalDto } from "~/features/goals/contracts/goal.dto";
import {
  buildGoalHubSummary,
  normalizeGoalHubItem,
  pickDefaultGoalHubItem,
  sortGoalHubItems,
} from "./goal-hub";

const TODAY = new Date("2026-06-09T12:00:00Z");

/**
 * Builds a goal fixture for hub model tests.
 *
 * @param overrides Field overrides.
 * @returns Goal DTO fixture.
 */
const makeGoal = (overrides: Partial<GoalDto> = {}): GoalDto => ({
  id: "goal-1",
  name: "Reserva",
  description: null,
  target_amount: 10000,
  current_amount: 2500,
  target_date: "2026-12-31",
  status: "active",
  created_at: "2026-01-01T12:00:00Z",
  ...overrides,
});

describe("normalizeGoalHubItem", () => {
  it("normalizes progress, remaining value and required monthly contribution", () => {
    const item = normalizeGoalHubItem(makeGoal(), TODAY);

    expect(item.progress).toBe(25);
    expect(item.progressPercentage).toBe(25);
    expect(item.remainingAmount).toBe(7500);
    expect(item.requiredMonthlyContribution).toBe(1250);
    expect(item.statusLabel).toBe("Em dia");
    expect(item.tone).toBe("healthy");
  });

  it("keeps reached active goals actionable instead of auto-completing them", () => {
    const item = normalizeGoalHubItem(
      makeGoal({
        id: "reached",
        current_amount: 11000,
        status: "active",
      }),
      TODAY,
    );

    expect(item.isReached).toBe(true);
    expect(item.statusLabel).toBe("Meta alcançada");
    expect(item.tone).toBe("achieved");
    expect(item.remainingAmount).toBe(0);
  });

  it("marks overdue active goals as danger", () => {
    const item = normalizeGoalHubItem(
      makeGoal({
        target_date: "2026-05-31",
        current_amount: 7000,
      }),
      TODAY,
    );

    expect(item.statusLabel).toBe("Atrasada");
    expect(item.tone).toBe("danger");
    expect(item.daysUntilTarget).toBeLessThan(0);
  });
});

describe("buildGoalHubSummary", () => {
  it("aggregates active progress and attention counters", () => {
    const summary = buildGoalHubSummary([
      normalizeGoalHubItem(makeGoal({ id: "active", current_amount: 2500 }), TODAY),
      normalizeGoalHubItem(makeGoal({ id: "reached", current_amount: 10000 }), TODAY),
      normalizeGoalHubItem(makeGoal({ id: "paused", status: "paused", current_amount: 500 }), TODAY),
    ]);

    expect(summary.activeCount).toBe(2);
    expect(summary.reachedCount).toBe(1);
    expect(summary.attentionCount).toBe(0);
    expect(summary.totalCurrent).toBe(12500);
    expect(summary.totalTarget).toBe(20000);
    expect(summary.totalRemaining).toBe(7500);
    expect(summary.overallProgress).toBe(63);
  });
});

describe("pickDefaultGoalHubItem", () => {
  it("selects reached goals before overdue, risky and steady goals", () => {
    const steady = normalizeGoalHubItem(
      makeGoal({ id: "steady", current_amount: 7000, target_date: "2026-12-31" }),
      TODAY,
    );
    const overdue = normalizeGoalHubItem(
      makeGoal({ id: "overdue", current_amount: 9000, target_date: "2026-05-31" }),
      TODAY,
    );
    const reached = normalizeGoalHubItem(
      makeGoal({ id: "reached", current_amount: 12000, target_date: "2026-12-31" }),
      TODAY,
    );

    expect(pickDefaultGoalHubItem([steady, overdue, reached])?.id).toBe("reached");
  });

  it("orders active goals by action priority and keeps inactive goals last", () => {
    const paused = normalizeGoalHubItem(makeGoal({ id: "paused", status: "paused" }), TODAY);
    const steady = normalizeGoalHubItem(makeGoal({ id: "steady", target_date: "2026-12-31" }), TODAY);
    const overdue = normalizeGoalHubItem(makeGoal({ id: "overdue", target_date: "2026-05-31" }), TODAY);

    expect(sortGoalHubItems([paused, steady, overdue]).map((goal) => goal.id)).toEqual([
      "overdue",
      "steady",
      "paused",
    ]);
  });
});
