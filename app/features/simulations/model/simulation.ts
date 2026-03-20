/**
 * Domain model for a saved simulation.
 */
export interface Simulation {
  id: string;
  name: string;
  toolSlug: string;
  inputs: unknown;
  result: unknown;
  goalId?: string | null;
  createdAt: string;
}

/**
 * Payload required to save a new simulation.
 */
export interface SaveSimulationPayload {
  name: string;
  toolSlug: string;
  inputs: unknown;
  result: unknown;
  goalId?: string | null;
}
