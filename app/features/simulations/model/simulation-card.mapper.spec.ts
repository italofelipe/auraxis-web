import { describe, expect, it } from "vitest";

import { mapToSimulationCardDto } from "./simulation-card.mapper";
import type { Simulation } from "~/features/simulations/model/simulation";

/**
 * Builds a Simulation fixture for tests.
 * @param overrides Partial overrides merged on top of the canonical fixture.
 * @returns A canonical Simulation domain fixture.
 */
const baseSimulation = (overrides: Partial<Simulation> = {}): Simulation => ({
  id: "sim-1",
  userId: "user-1",
  toolId: "installment-vs-cash",
  ruleVersion: "2026.04",
  inputs: { current: 5000 },
  result: { summary: "À vista economiza R$ 480", result_value: 480 },
  metadata: null,
  saved: true,
  createdAt: "2026-04-29T00:00:00.000Z",
  ...overrides,
});

describe("mapToSimulationCardDto", () => {
  it("derives the legacy installment_vs_cash type from the canonical kebab id", () => {
    const card = mapToSimulationCardDto(baseSimulation());
    expect(card.type).toBe("installment_vs_cash");
  });

  it("accepts the legacy snake_case installment_vs_cash id for back-compat", () => {
    const card = mapToSimulationCardDto(baseSimulation({ toolId: "installment_vs_cash" }));
    expect(card.type).toBe("installment_vs_cash");
  });

  it("uses metadata.label for the card title when present", () => {
    const card = mapToSimulationCardDto(
      baseSimulation({ metadata: { label: "Minha simulação" } }),
    );
    expect(card.name).toBe("Minha simulação");
  });

  it("falls back to result.summary when metadata.label is missing", () => {
    const card = mapToSimulationCardDto(baseSimulation());
    expect(card.name).toBe("À vista economiza R$ 480");
  });

  it("falls back to toolId when neither label nor summary are available", () => {
    const card = mapToSimulationCardDto(
      baseSimulation({ metadata: null, result: { value: 42 } }),
    );
    expect(card.name).toBe("installment-vs-cash");
  });

  it("extracts result_value when present", () => {
    const card = mapToSimulationCardDto(baseSimulation());
    expect(card.result_value).toBe(480);
  });

  it("extracts the legacy 'value' field when result_value is absent", () => {
    const card = mapToSimulationCardDto(
      baseSimulation({ result: { value: 99 } }),
    );
    expect(card.result_value).toBe(99);
  });

  it("returns null result_value when neither field is numeric", () => {
    const card = mapToSimulationCardDto(
      baseSimulation({ result: { summary: "no value here" } }),
    );
    expect(card.result_value).toBeNull();
  });

  it("maps unknown tool ids to the safe default 'installment_vs_cash' bucket", () => {
    const card = mapToSimulationCardDto(baseSimulation({ toolId: "unknown-tool" }));
    expect(card.type).toBe("installment_vs_cash");
  });

  it("maps compound-interest to investment_return", () => {
    const card = mapToSimulationCardDto(baseSimulation({ toolId: "compound-interest" }));
    expect(card.type).toBe("investment_return");
  });

  it("maps goal-simulator to goal_projection", () => {
    const card = mapToSimulationCardDto(baseSimulation({ toolId: "goal-simulator" }));
    expect(card.type).toBe("goal_projection");
  });
});
