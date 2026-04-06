import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  BudgetDto,
  BudgetSummaryDto,
  CreateBudgetPayload,
  UpdateBudgetPayload,
} from "~/features/budgets/contracts/budget.contracts";

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
    const response = await this.#http.get<{ items: BudgetDto[] }>("/budgets");
    // Handle both direct array and wrapped response shapes
    const data = response.data as BudgetDto[] | { items: BudgetDto[] };
    if (Array.isArray(data)) {
      return data;
    }
    return data.items ?? [];
  }

  /**
   * Fetches a single budget by ID with spent calculation.
   *
   * @param id - Budget identifier.
   * @returns BudgetDto.
   */
  async getBudget(id: string): Promise<BudgetDto> {
    const response = await this.#http.get<BudgetDto>(`/budgets/${id}`);
    return response.data;
  }

  /**
   * Creates a new budget for the authenticated user.
   *
   * @param payload - Budget creation payload.
   * @returns Created BudgetDto.
   */
  async createBudget(payload: CreateBudgetPayload): Promise<BudgetDto> {
    const response = await this.#http.post<BudgetDto>("/budgets", payload);
    return response.data;
  }

  /**
   * Updates an existing budget by ID.
   *
   * @param id - Budget identifier.
   * @param payload - Partial update payload.
   * @returns Updated BudgetDto.
   */
  async updateBudget(id: string, payload: UpdateBudgetPayload): Promise<BudgetDto> {
    const response = await this.#http.patch<BudgetDto>(`/budgets/${id}`, payload);
    return response.data;
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
    const response = await this.#http.get<BudgetSummaryDto>("/budgets/summary");
    return response.data;
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
