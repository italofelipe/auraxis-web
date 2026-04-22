import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type { DashboardSurvivalIndexResponseDto } from "~/features/dashboard/contracts/dashboard-overview.dto";
import type { DashboardSurvivalIndex } from "~/features/dashboard/model/dashboard-survival-index";

/**
 * Maps the REST DTO for the survival index to the domain model.
 *
 * @param dto - Raw response payload from `/dashboard/survival-index`.
 * @returns The survival index expressed in frontend domain types.
 */
const mapSurvivalIndexDto = (
  dto: DashboardSurvivalIndexResponseDto,
): DashboardSurvivalIndex => {
  return {
    months: dto.n_months,
    totalAssets: dto.total_assets,
    avgMonthlyExpense: dto.avg_monthly_expense,
    classification: dto.classification,
  };
};

export class DashboardSurvivalIndexApiClient {
  readonly #http: AxiosInstance;

  /**
   *
   * @param http
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Fetches the survival index for the authenticated user.
   *
   * @returns Survival index domain model.
   */
  async getSurvivalIndex(): Promise<DashboardSurvivalIndex> {
    const response = await this.#http.get<DashboardSurvivalIndexResponseDto>(
      "/dashboard/survival-index",
    );
    return mapSurvivalIndexDto(response.data);
  }
}

/**
 * Factory that wires the survival-index client to the default HTTP composable.
 *
 * @returns Ready-to-use client instance.
 */
export const useDashboardSurvivalIndexApiClient = (): DashboardSurvivalIndexApiClient => {
  return new DashboardSurvivalIndexApiClient(useHttp());
};
