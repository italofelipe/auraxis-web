import type { SimulationDto } from "~/features/simulations/contracts/simulation.dto";
import type { Simulation } from "~/features/simulations/model/simulation";

/**
 * Maps a raw SimulationDto from the API into the domain Simulation model.
 *
 * @param dto Raw DTO from the API response.
 * @returns Typed domain model with camelCase fields.
 */
export const mapSimulationDto = (dto: SimulationDto): Simulation => {
  return {
    id: dto.id,
    name: dto.name,
    toolSlug: dto.tool_slug,
    inputs: dto.inputs,
    result: dto.result,
    goalId: dto.goal_id ?? null,
    createdAt: dto.created_at,
  };
};
