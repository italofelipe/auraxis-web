/**
 * DTOs for the canonical `/simulations` endpoint (DEC-196 / auraxis-api#1128).
 *
 * The backend persists simulations through a single generic endpoint that
 * accepts any `tool_id` from the canonical registry, with `inputs` and
 * `result` opaque JSON payloads owned by the client.
 */

export interface SimulationMetadataDto {
  readonly label?: string | null;
  readonly notes?: string | null;
  readonly [key: string]: unknown;
}

export interface SimulationDto {
  readonly id: string;
  readonly user_id: string;
  readonly tool_id: string;
  readonly rule_version: string;
  readonly inputs: Record<string, unknown>;
  readonly result: Record<string, unknown>;
  readonly metadata: SimulationMetadataDto | null;
  readonly saved: boolean;
  readonly created_at: string;
}

export interface SaveSimulationRequestDto {
  readonly tool_id: string;
  readonly rule_version: string;
  readonly inputs: Record<string, unknown>;
  readonly result: Record<string, unknown>;
  readonly metadata?: SimulationMetadataDto | null;
}

export interface SimulationListResponseDto {
  readonly items: readonly SimulationDto[];
  readonly page: number;
  readonly per_page: number;
  readonly total: number;
  readonly pages: number;
}
