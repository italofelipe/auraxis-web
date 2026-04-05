import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type { DashboardTrendsResponseDto } from "~/features/dashboard/contracts/dashboard-overview.dto";
import type { DashboardTrends } from "~/features/dashboard/model/dashboard-overview";

/**
 * Maps the API trends DTO to the internal trends model.
 *
 * @param dto Raw API response.
 * @returns Parsed trends model.
 */
const mapTrendsDto = (dto: DashboardTrendsResponseDto): DashboardTrends => {
  return {
    months: dto.months,
    series: (dto.series ?? []).map((entry) => ({
      month: entry.month,
      income: entry.income,
      expenses: entry.expenses,
      balance: entry.balance,
    })),
  };
};

export class DashboardTrendsApiClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Fetches multi-month income/expense trends from the API.
   *
   * @param months Number of months to include in the trends series.
   * @returns Parsed trends data ready for UI consumption.
   */
  async getTrends(months: number): Promise<DashboardTrends> {
    const response = await this.#http.get<DashboardTrendsResponseDto>(
      "/dashboard/trends",
      { params: { months } },
    );
    return mapTrendsDto(response.data);
  }
}

/**
 * Resolves the canonical dashboard trends API client using the shared HTTP layer.
 *
 * @returns Dashboard trends API client instance.
 */
export const useDashboardTrendsApiClient = (): DashboardTrendsApiClient => {
  return new DashboardTrendsApiClient(useHttp());
};
