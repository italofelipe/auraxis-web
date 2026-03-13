import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type { DashboardOverviewDto } from "~/features/dashboard/contracts/dashboard-overview.dto";
import {
  mapDashboardOverviewDto,
  type DashboardOverviewContractError,
} from "~/features/dashboard/api/dashboard-overview.mapper";
import { DashboardOverviewFiltersError } from "~/features/dashboard/api/dashboard-overview.errors";
import {
  isCustomDashboardPeriod,
  type DashboardOverview,
  type DashboardOverviewFilters,
} from "~/features/dashboard/model/dashboard-overview";

interface DashboardOverviewQueryParams {
  readonly period: DashboardOverviewFilters["period"];
  readonly start?: string;
  readonly end?: string;
}

/**
 * Builds the query string expected by the canonical dashboard endpoint.
 *
 * @param filters Dashboard period filters.
 * @returns Query string params for the dashboard endpoint.
 */
const buildDashboardOverviewParams = (
  filters: DashboardOverviewFilters,
): DashboardOverviewQueryParams => {
  if (isCustomDashboardPeriod(filters.period)) {
    if (!filters.start || !filters.end) {
      throw new DashboardOverviewFiltersError(
        "Custom dashboard period requires start and end dates.",
      );
    }

    return {
      period: filters.period,
      start: filters.start,
      end: filters.end,
    };
  }

  return {
    period: filters.period,
  };
};

export class DashboardOverviewApiClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Fetches the canonical dashboard overview payload for the selected period.
   *
   * @param filters Dashboard period filters.
   * @returns Parsed dashboard overview ready for UI consumption.
   */
  async getOverview(filters: DashboardOverviewFilters): Promise<DashboardOverview> {
    const response = await this.#http.get<DashboardOverviewDto>(
      "/dashboard/overview",
      {
        params: buildDashboardOverviewParams(filters),
      },
    );

    return mapDashboardOverviewDto(response.data);
  }
}

/**
 * Resolves the canonical dashboard API client using the shared HTTP layer.
 *
 * @returns Dashboard API client instance.
 */
export const useDashboardOverviewApiClient = (): DashboardOverviewApiClient => {
  return new DashboardOverviewApiClient(useHttp());
};

export type { DashboardOverviewContractError };
