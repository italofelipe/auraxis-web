/**
 * Data Transfer Object for a simulation returned by the API.
 */
export interface SimulationDto {
  id: string;
  name: string;
  tool_slug: string;
  inputs: unknown;
  result: unknown;
  goal_id?: string | null;
  created_at: string;
}

/**
 * Data Transfer Object for the simulation save request body.
 */
export interface SaveSimulationPayloadDto {
  name: string;
  tool_slug: string;
  inputs: unknown;
  result: unknown;
  goal_id?: string | null;
}
