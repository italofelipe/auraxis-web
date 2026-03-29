import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type { DashboardOverviewDto } from "~/features/dashboard/contracts/dashboard-overview.dto";
import {
  mapDashboardOverviewDto,
  type DashboardOverviewContractError,
} from "~/features/dashboard/services/dashboard-overview.mapper";
import { DashboardOverviewFiltersError } from "~/features/dashboard/services/dashboard-overview.errors";
import {
  isCustomDashboardPeriod,
  type DashboardOverview,
  type DashboardOverviewFilters,
} from "~/features/dashboard/model/dashboard-overview";

interface DashboardOverviewQueryParams {
  readonly month: string;
}

/**
 * Derives the target YYYY-MM string from a period preset or custom date range.
 *
 * @param filters Dashboard period filters.
 * @returns YYYY-MM string expected by the backend `/dashboard/overview` endpoint.
 */
const toMonthParam = (filters: DashboardOverviewFilters): string => {
  if (isCustomDashboardPeriod(filters.period)) {
    if (!filters.start) {
      throw new DashboardOverviewFiltersError(
        "Custom dashboard period requires a start date.",
      );
    }
    // Derive YYYY-MM from the ISO start date string.
    return filters.start.slice(0, 7);
  }

  const now = new Date();
  const presetOffsets: Record<string, number> = {
    current_month: 0,
    "1m": 1,
    "3m": 3,
    "6m": 6,
    "12m": 12,
  };

  const offset = presetOffsets[filters.period] ?? 0;
  const target = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

/**
 * Builds the query string expected by the canonical dashboard endpoint.
 *
 * @param filters Dashboard period filters.
 * @returns Query string params for the dashboard endpoint.
 */
const buildDashboardOverviewParams = (
  filters: DashboardOverviewFilters,
): DashboardOverviewQueryParams => {
  return { month: toMonthParam(filters) };
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
