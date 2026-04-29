/**
 * Domain models for simulations (DEC-196 / canonical generic endpoint).
 *
 * Shape mirrors the backend `SimulationSchema` in
 * `auraxis-api/app/schemas/simulation_schema.py`. The DTO field names use
 * snake_case, the domain types use camelCase.
 */

export interface SimulationMetadata {
  readonly label?: string | null;
  readonly notes?: string | null;
  readonly [key: string]: unknown;
}

export interface Simulation {
  readonly id: string;
  readonly userId: string;
  readonly toolId: string;
  readonly ruleVersion: string;
  readonly inputs: Record<string, unknown>;
  readonly result: Record<string, unknown>;
  readonly metadata: SimulationMetadata | null;
  readonly saved: boolean;
  readonly createdAt: string;
}

export interface SaveSimulationPayload {
  readonly toolId: string;
  readonly ruleVersion: string;
  readonly inputs: Record<string, unknown>;
  readonly result: Record<string, unknown>;
  readonly metadata?: SimulationMetadata | null;
}

export interface ListSimulationsParams {
  readonly page?: number;
  readonly perPage?: number;
  readonly toolId?: string;
}

export interface SimulationList {
  readonly items: readonly Simulation[];
  readonly page: number;
  readonly perPage: number;
  readonly total: number;
  readonly pages: number;
}
