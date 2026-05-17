import { describe, expect, it } from "vitest";

import {
  buildNetWorthProjection,
  NET_WORTH_SCENARIOS,
  type NetWorthProjectionInput,
} from "./useNetWorthProjection";
import type { GoalDto } from "~/features/goals/contracts/goal.dto";

/**
 * Creates a typed goal fixture with defaults.
 *
 * @param overrides Partial goal fields.
 * @returns Goal fixture.
 */
const makeGoal = (overrides: Partial<GoalDto> = {}): GoalDto => ({
  id: "goal-1",
  name: "Entrada do apartamento",
  description: null,
  target_amount: 90000,
  current_amount: 40000,
  target_date: "2027-05-31",
  status: "active",
  created_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

const baseInput: NetWorthProjectionInput = {
  anchorDate: "2026-05-01",
  currentNetWorth: 100000,
  investedAmount: 86000,
  horizonMonths: 24,
  monthlyContribution: 1800,
  goals: [
    makeGoal({ id: "goal-apt", name: "Entrada do apartamento", target_date: "2027-05-31" }),
    makeGoal({ id: "goal-far", name: "Casa de praia", target_date: "2032-01-31" }),
    makeGoal({ id: "goal-done", name: "Notebook", target_date: "2026-09-30", status: "completed" }),
  ],
};

describe("buildNetWorthProjection", () => {
  it("builds a solid historical series and dotted future projections", () => {
    const projection = buildNetWorthProjection(baseInput);

    expect(projection.actualSeries.length).toBe(13);
    expect(projection.projectedSeries.base.length).toBe(25);
    expect(projection.projectedSeries.optimistic.length).toBe(25);
    expect(projection.projectedSeries.pessimistic.length).toBe(25);
    expect(projection.scenarios).toEqual(NET_WORTH_SCENARIOS);
  });

  it("orders final projected value by optimistic, base and pessimistic scenarios", () => {
    const projection = buildNetWorthProjection(baseInput);

    expect(projection.finalValues.optimistic).toBeGreaterThan(projection.finalValues.base);
    expect(projection.finalValues.base).toBeGreaterThan(projection.finalValues.pessimistic);
  });

  it("keeps only active goal markers inside the selected horizon", () => {
    const projection = buildNetWorthProjection(baseInput);

    expect(projection.goalMarkers).toHaveLength(1);
    expect(projection.goalMarkers[0]).toMatchObject({
      goalId: "goal-apt",
      label: "Entrada do apartamento",
      monthOffset: 12,
    });
  });
});
