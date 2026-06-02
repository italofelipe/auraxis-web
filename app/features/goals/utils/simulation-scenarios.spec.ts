import { describe, expect, it } from "vitest";

import {
  MAX_PINNED_SCENARIOS,
  addPinnedScenario,
  canPinScenario,
  removePinnedScenario,
  type PinnedScenario,
} from "./simulation-scenarios";

/**
 * Constrói um cenário fixado de teste.
 *
 * @param id Id do cenário.
 * @returns Cenário fixado.
 */
const scenario = (id: string): PinnedScenario => ({
  id,
  label: `Cenário ${id}`,
  monthlyContribution: 200,
  annualRatePct: 8,
  horizonMonths: 24,
  points: [1, 2, 3],
});

describe("simulation-scenarios", () => {
  it("adiciona cenários até o teto", () => {
    let list: PinnedScenario[] = [];
    for (let i = 0; i < MAX_PINNED_SCENARIOS; i += 1) {
      list = addPinnedScenario(list, scenario(String(i)));
    }
    expect(list).toHaveLength(MAX_PINNED_SCENARIOS);
  });

  it("não ultrapassa o teto de cenários", () => {
    let list: PinnedScenario[] = [];
    for (let i = 0; i < MAX_PINNED_SCENARIOS + 2; i += 1) {
      list = addPinnedScenario(list, scenario(String(i)));
    }
    expect(list).toHaveLength(MAX_PINNED_SCENARIOS);
  });

  it("remove por id", () => {
    const list = [scenario("a"), scenario("b")];
    expect(removePinnedScenario(list, "a")).toEqual([scenario("b")]);
  });

  it("canPinScenario reflete o teto", () => {
    expect(canPinScenario([])).toBe(true);
    expect(canPinScenario([scenario("a"), scenario("b"), scenario("c")])).toBe(false);
  });
});
