import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  GoalDto,
  GoalAIProjectionPayload,
  GoalAIProjectionResponseDto,
  GoalPlanDto,
  GoalProjectionResponseDto,
  CreateGoalPayload,
  UpdateGoalPayload,
} from "~/features/goals/contracts/goal.dto";

type ApiEnvelope<T> = {
  readonly data?: T;
  readonly success?: boolean;
};

/**
 * Extracts the payload from the v2 API envelope while accepting legacy flat mocks.
 *
 * @param payload Raw response body.
 * @returns Unwrapped response payload.
 */
const unwrapApiEnvelope = <T>(payload: ApiEnvelope<T> | T): T => {
  if (
    payload !== null &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as ApiEnvelope<T>).data !== undefined
  ) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
};

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

  /**
   * Creates a new financial goal for the authenticated user.
   *
   * @param payload - Goal creation payload.
   * @returns Created GoalDto.
   */
  async createGoal(payload: CreateGoalPayload): Promise<GoalDto> {
    const response = await this.#http.post<GoalDto>("/goals", payload);
    return response.data;
  }

  /**
   * Updates an existing financial goal by ID.
   *
   * @param id - Goal identifier.
   * @param payload - Partial update payload.
   * @returns Updated GoalDto.
   */
  async updateGoal(id: string, payload: UpdateGoalPayload): Promise<GoalDto> {
    const response = await this.#http.patch<GoalDto>(`/goals/${id}`, payload);
    return response.data;
  }

  /**
   * Deletes a financial goal by ID.
   *
   * @param id - Goal identifier.
   */
  async deleteGoal(id: string): Promise<void> {
    await this.#http.delete(`/goals/${id}`);
  }

  /**
   * Fetches the planning projection for a given goal.
   *
   * @param id - Goal identifier.
   * @returns GoalPlanDto with monthly contribution and projection data.
   */
  async getGoalPlan(id: string): Promise<GoalPlanDto> {
    const response = await this.#http.get<GoalPlanDto>(`/goals/${id}/plan`);
    return response.data;
  }

  /**
   * Fetches the compound-interest portfolio-aware projection for a goal.
   *
   * Uses the authenticated user's wallet blended return rate and monthly
   * investment to compute projected completion date, on-track status, and
   * suggested contribution when off-track.
   *
   * @param id - Goal identifier.
   * @returns GoalProjectionResponseDto containing goal + projection data.
   */
  async getGoalProjection(id: string): Promise<GoalProjectionResponseDto> {
    const response = await this.#http.get<GoalProjectionResponseDto>(
      `/goals/${id}/projection`,
    );
    return response.data;
  }

  /**
   * Generates a premium AI narrative for a goal projection.
   *
   * The backend endpoint is scoped by goal id and receives the free-form user
   * context plus the monthly contribution used in the projection.
   *
   * @param id Goal identifier.
   * @param payload Context and contribution sent to the AI projection endpoint.
   * @returns Unwrapped AI projection response.
   */
  async generateGoalAIProjection(
    id: string,
    payload: GoalAIProjectionPayload,
  ): Promise<GoalAIProjectionResponseDto> {
    const response = await this.#http.post<
      ApiEnvelope<GoalAIProjectionResponseDto> | GoalAIProjectionResponseDto
    >(`/ai/goals/${id}/projection`, payload);
    return unwrapApiEnvelope<GoalAIProjectionResponseDto>(response.data);
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
