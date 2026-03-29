import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type { GoalDto } from "~/features/goals/contracts/goal.dto";

/**
 * API client for the goals feature.
 *
 * Encapsulates all HTTP calls to the `/goals` endpoints.
 * GoalDto is used directly by UI components — no view model mapping needed.
 */
export class GoalsClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Fetches the list of goals for the authenticated user.
   *
   * @returns Array of GoalDto objects.
   */
  async listGoals(): Promise<GoalDto[]> {
    const response = await this.#http.get<GoalDto[]>("/goals");
    return response.data;
  }
}

/**
 * Resolves the canonical goals API client using the shared HTTP layer.
 *
 * @returns GoalsClient instance bound to the application HTTP adapter.
 */
export const useGoalsClient = (): GoalsClient => {
  return new GoalsClient(useHttp());
};
