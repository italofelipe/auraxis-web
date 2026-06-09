import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  BudgetDto,
  BudgetSummaryDto,
  CreateBudgetPayload,
  UpdateBudgetPayload,
} from "~/features/budgets/contracts/budget.contracts";

interface ApiEnvelope<T> {
  readonly success?: boolean;
  readonly message?: string;
  readonly data?: T;
}

interface BudgetListPayload {
  readonly items?: BudgetDto[];
}

interface BudgetPayload {
  readonly budget?: BudgetDto;
}

interface BudgetSummaryPayload {
  readonly summary?: BudgetSummaryDto;
}

type BudgetListResponse =
  | ApiEnvelope<BudgetListPayload | BudgetDto[]>
  | BudgetListPayload
  | BudgetDto[];

type BudgetResponse =
  | ApiEnvelope<BudgetPayload | BudgetDto>
  | BudgetPayload
  | BudgetDto;

type BudgetSummaryResponse =
  | ApiEnvelope<BudgetSummaryPayload | BudgetSummaryDto>
  | BudgetSummaryPayload
  | BudgetSummaryDto;

/**
 * Unwraps REST v2 response envelopes while preserving legacy direct payloads.
 *
 * @param payload Raw Axios response body.
 * @returns Payload nested under `data`, or the payload itself.
 */
const unwrapApiEnvelope = <T>(payload: ApiEnvelope<T> | T): T => {
  if (
    payload
    && typeof payload === "object"
    && "data" in payload
    && (payload as ApiEnvelope<T>).data !== undefined
  ) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
};

/**
 * Coerces all supported GET /budgets shapes into an array.
 *
 * @param payload Raw response body.
 * @returns Budget list.
 */
const coerceBudgetList = (
  payload: BudgetListResponse,
): BudgetDto[] => {
  const data = unwrapApiEnvelope<BudgetListPayload | BudgetDto[]>(payload);

  if (Array.isArray(data)) {
    return data;
  }

  return data.items ?? [];
};

/**
 * Coerces single-budget responses into a BudgetDto.
 *
 * @param payload Raw response body.
 * @returns Budget item.
 */
const coerceBudget = (
  payload: BudgetResponse,
): BudgetDto => {
  const data = unwrapApiEnvelope<BudgetPayload | BudgetDto>(payload);

  if (data && typeof data === "object" && "budget" in data && data.budget) {
    return data.budget;
  }

  return data as BudgetDto;
};

/**
 * Coerces summary responses into BudgetSummaryDto.
 *
 * @param payload Raw response body.
 * @returns Budget summary.
 */
const coerceBudgetSummary = (
  payload: BudgetSummaryResponse,
): BudgetSummaryDto => {
  const data = unwrapApiEnvelope<BudgetSummaryPayload | BudgetSummaryDto>(payload);

  if (data && typeof data === "object" && "summary" in data && data.summary) {
    return data.summary;
  }

  return data as BudgetSummaryDto;
};

/**
 * API client for the budgets feature.
 *
 * Encapsulates all HTTP calls to the `/budgets` endpoints.
 */
export class BudgetClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Fetches the list of active budgets with spent amount for the authenticated user.
   *
   * @returns Array of BudgetDto objects.
   */
  async listBudgets(): Promise<BudgetDto[]> {
    const response = await this.#http.get<BudgetListResponse>("/budgets");
    return coerceBudgetList(response.data);
  }

  /**
   * Fetches a single budget by ID with spent calculation.
   *
   * @param id - Budget identifier.
   * @returns BudgetDto.
   */
  async getBudget(id: string): Promise<BudgetDto> {
    const response = await this.#http.get<BudgetResponse>(`/budgets/${id}`);
    return coerceBudget(response.data);
  }

  /**
   * Creates a new budget for the authenticated user.
   *
   * @param payload - Budget creation payload.
   * @returns Created BudgetDto.
   */
  async createBudget(payload: CreateBudgetPayload): Promise<BudgetDto> {
    const response = await this.#http.post<BudgetResponse>("/budgets", payload);
    return coerceBudget(response.data);
  }

  /**
   * Updates an existing budget by ID.
   *
   * @param id - Budget identifier.
   * @param payload - Partial update payload.
   * @returns Updated BudgetDto.
   */
  async updateBudget(id: string, payload: UpdateBudgetPayload): Promise<BudgetDto> {
    const response = await this.#http.patch<BudgetResponse>(`/budgets/${id}`, payload);
    return coerceBudget(response.data);
  }

  /**
   * Deletes a budget by ID.
   *
   * @param id - Budget identifier.
   */
  async deleteBudget(id: string): Promise<void> {
    await this.#http.delete(`/budgets/${id}`);
  }

  /**
   * Fetches the budget summary (total budgeted vs total spent).
   *
   * @returns BudgetSummaryDto.
   */
  async getSummary(): Promise<BudgetSummaryDto> {
    const response = await this.#http.get<BudgetSummaryResponse>("/budgets/summary");
    return coerceBudgetSummary(response.data);
  }
}

/**
 * Resolves the canonical budgets API client using the shared HTTP layer.
 *
 * @returns BudgetClient instance bound to the application HTTP adapter.
 */
export const useBudgetClient = (): BudgetClient => {
  return new BudgetClient(useHttp());
};
