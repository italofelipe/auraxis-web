import { describe, expect, it } from "vitest";

import { mapSimulationDto } from "./simulation.mapper";
import type { SimulationDto } from "~/features/simulations/contracts/simulation.dto";

/**
 * Builds a SimulationDto fixture for tests.
 * @param overrides Partial overrides merged on top of the canonical fixture.
 * @returns A canonical DTO fixture.
 */
const baseDto = (overrides: Partial<SimulationDto> = {}): SimulationDto => ({
  id: "sim-1",
  user_id: "user-1",
  tool_id: "compound-interest",
  rule_version: "2026.04",
  inputs: { initial: 1000 },
  result: { final: 1500 },
  metadata: { label: "Cenário 1" },
  saved: true,
  created_at: "2026-04-29T00:00:00.000Z",
  ...overrides,
});

describe("mapSimulationDto", () => {
  it("converts snake_case fields to camelCase domain shape", () => {
    const result = mapSimulationDto(baseDto());
    expect(result).toEqual({
      id: "sim-1",
      userId: "user-1",
      toolId: "compound-interest",
      ruleVersion: "2026.04",
      inputs: { initial: 1000 },
      result: { final: 1500 },
      metadata: { label: "Cenário 1" },
      saved: true,
      createdAt: "2026-04-29T00:00:00.000Z",
    });
  });

  it("normalizes undefined metadata to null", () => {
    const dto = baseDto({ metadata: null });
    expect(mapSimulationDto(dto).metadata).toBeNull();
  });
});
