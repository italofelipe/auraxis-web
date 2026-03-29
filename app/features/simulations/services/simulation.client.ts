import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type { SimulationDto, SaveSimulationPayloadDto } from "~/features/simulations/contracts/simulation.dto";
import { mapSimulationDto } from "~/features/simulations/services/simulation.mapper";
import type { Simulation, SaveSimulationPayload } from "~/features/simulations/model/simulation";

/**
 * API client for the simulations feature.
 *
 * Encapsulates all HTTP calls to the `/simulations` endpoints and returns
 * mapped domain types ready for UI consumption.
 */
export class SimulationClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Saves a new simulation for the authenticated user.
   *
   * @param payload The simulation data to persist.
   * @returns The saved simulation domain model.
   */
  async saveSimulation(payload: SaveSimulationPayload): Promise<Simulation> {
    const body: SaveSimulationPayloadDto = {
      name: payload.name,
      tool_slug: payload.toolSlug,
      inputs: payload.inputs,
      result: payload.result,
      goal_id: payload.goalId ?? null,
    };

    const response = await this.#http.post<SimulationDto>("/simulations", body);
    return mapSimulationDto(response.data);
  }

  /**
   * Fetches the list of simulations for the authenticated user.
   *
   * @returns Array of domain Simulation models.
   */
  async listSimulations(): Promise<Simulation[]> {
    const response = await this.#http.get<SimulationDto[]>("/simulations");
    return response.data.map(mapSimulationDto);
  }

  /**
   * Deletes a saved simulation by id.
   *
   * @param id Simulation identifier.
   */
  async deleteSimulation(id: string): Promise<void> {
    await this.#http.delete(`/simulations/${id}`);
  }
}

/**
 * Resolves the canonical simulation API client using the shared HTTP layer.
 *
 * @returns SimulationClient instance bound to the application HTTP adapter.
 */
export const useSimulationClient = (): SimulationClient => {
  return new SimulationClient(useHttp());
};
