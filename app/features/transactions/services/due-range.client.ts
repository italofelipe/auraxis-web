/**
 * HTTP client for GET /transactions/due-range
 *
 * Issue: #545 (parent PROD-14), #580
 */

import { useHttp } from "~/composables/useHttp";
import type {
  DueRangeFilters,
  DueRangeResponseDto,
} from "~/features/transactions/contracts/due-range.dto";

export interface DueRangeClient {
  /**
   * Fetches transactions due within the given date range.
   *
   * @param filters Optional query filters (dates, ordering, pagination).
   * @returns Paginated due-range response.
   */
  getDueRange(filters?: DueRangeFilters): Promise<DueRangeResponseDto>;
}

/**
 * Creates a DueRangeClient backed by the real Auraxis HTTP layer.
 *
 * @returns DueRangeClient instance.
 */
export function useDueRangeClient(): DueRangeClient {
  const http = useHttp();

  return {
    async getDueRange(filters?: DueRangeFilters): Promise<DueRangeResponseDto> {
      const params: Record<string, string | number> = {};
      if (filters?.start_date) { params["start_date"] = filters.start_date; }
      if (filters?.end_date) { params["end_date"] = filters.end_date; }
      if (filters?.order_by) { params["order_by"] = filters.order_by; }
      if (filters?.page !== undefined) { params["page"] = filters.page; }
      if (filters?.per_page !== undefined) { params["per_page"] = filters.per_page; }

      const response = await http.get<DueRangeResponseDto>(
        "/transactions/due-range",
        { params },
      );
      return response.data;
    },
  };
}
