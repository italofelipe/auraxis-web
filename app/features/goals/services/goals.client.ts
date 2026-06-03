import axios, { type AxiosInstance } from "axios";

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

type GoalWireDto = Omit<GoalDto, "name"> & {
  readonly name?: string;
  readonly title?: string;
};

type GoalWirePayload = Omit<UpdateGoalPayload, "name"> & {
  readonly title?: string;
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
 * Normalizes the goals API contract into the UI contract.
 *
 * The v2 API uses `title`; older mocks and UI components still use `name`.
 * Keeping that translation at the client boundary avoids leaking wire details
 * into the screen and form code.
 *
 * @param goal Raw goal returned by the API or tests.
 * @returns GoalDto consumed by the UI.
 */
const normalizeGoal = (goal: GoalWireDto | GoalDto): GoalDto => {
  const { title, name, ...rest } = goal as GoalWireDto;
  return {
    ...rest,
    name: name ?? title ?? "",
  };
};

/**
 * Coerces a single-goal payload to the bare goal object.
 *
 * The v2 create/update endpoints wrap the goal as `{goal:{...}}` inside the
 * envelope `data`; legacy/mocks return the goal fields directly. Unwrapping
 * `{goal}` here keeps `normalizeGoal` working for both shapes (mapping the
 * `{goal}` wrapper directly produced an empty `name`).
 *
 * @param unwrapped Envelope `data` already stripped of `{success,...}`.
 * @returns The bare goal wire object.
 */
const coerceGoalObject = (unwrapped: GoalWireDto | { goal?: GoalWireDto }): GoalWireDto => {
  if (unwrapped !== null && typeof unwrapped === "object" && "goal" in unwrapped) {
    return (unwrapped.goal ?? {}) as GoalWireDto;
  }
  return unwrapped as GoalWireDto;
};

/**
 * Converts UI goal payloads to the v2 API payload shape.
 *
 * @param payload Goal payload produced by forms/composables.
 * @returns Payload using `title` instead of the UI-only `name`.
 */
const toGoalWirePayload = (payload: CreateGoalPayload | UpdateGoalPayload): GoalWirePayload => {
  const { name, ...rest } = payload;
  return name === undefined ? rest : { ...rest, title: name };
};

/**
 * Detects the empty-collection response used by some API deployments for users
 * that have not created goals yet.
 *
 * @param error Unknown HTTP error thrown by Axios.
 * @returns True when the response safely maps to an empty goals list.
 */
const isEmptyGoalsNotFound = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const payload = error.response?.data as { error?: { code?: string } } | undefined;
  return error.response?.status === 404 && payload?.error?.code === "NOT_FOUND";
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
    try {
      const response = await this.#http.get<
        ApiEnvelope<GoalWireDto[] | { items?: GoalWireDto[] }> | GoalWireDto[]
      >("/goals");
      // The v2 list endpoint returns a paginated envelope `{data:{items:[...]}}`,
      // while legacy/mocks return a bare array under `data`. Coerce both to an
      // array before mapping — calling `.map` on the `{items}` object was the
      // cause of the "Não foi possível carregar as metas" error.
      const unwrapped = unwrapApiEnvelope<GoalWireDto[] | { items?: GoalWireDto[] }>(
        response.data,
      );
      const list = Array.isArray(unwrapped) ? unwrapped : (unwrapped?.items ?? []);
      return list.map(normalizeGoal);
    } catch (error) {
      if (isEmptyGoalsNotFound(error)) {
        return [];
      }

      throw error;
    }
  }

  /**
   * Creates a new financial goal for the authenticated user.
   *
   * @param payload - Goal creation payload.
   * @returns Created GoalDto.
   */
  async createGoal(payload: CreateGoalPayload): Promise<GoalDto> {
    const response = await this.#http.post<
      ApiEnvelope<GoalWireDto | { goal?: GoalWireDto }> | GoalWireDto
    >("/goals", toGoalWirePayload(payload));
    return normalizeGoal(coerceGoalObject(unwrapApiEnvelope(response.data)));
  }

  /**
   * Updates an existing financial goal by ID.
   *
   * @param id - Goal identifier.
   * @param payload - Partial update payload.
   * @returns Updated GoalDto.
   */
  async updateGoal(id: string, payload: UpdateGoalPayload): Promise<GoalDto> {
    const response = await this.#http.patch<
      ApiEnvelope<GoalWireDto | { goal?: GoalWireDto }> | GoalWireDto
    >(`/goals/${id}`, toGoalWirePayload(payload));
    return normalizeGoal(coerceGoalObject(unwrapApiEnvelope(response.data)));
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
