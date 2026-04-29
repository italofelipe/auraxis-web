import type { SimulationDto } from "~/features/simulations/contracts/simulation.dto";
import type { Simulation } from "~/features/simulations/model/simulation";

/**
 * Maps the canonical SimulationDto to the camelCase domain model used in UI.
 * @param dto
 * @returns The computed value.
   */
export const mapSimulationDto = (dto: SimulationDto): Simulation => ({
  id: dto.id,
  userId: dto.user_id,
  toolId: dto.tool_id,
  ruleVersion: dto.rule_version,
  inputs: dto.inputs,
  result: dto.result,
  metadata: dto.metadata ?? null,
  saved: dto.saved,
  createdAt: dto.created_at,
});
