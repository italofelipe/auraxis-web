/**
 * Vue Query hook for GET /transactions/due-range
 *
 * Issue: #545 (parent PROD-14), #580
 */

import { type MaybeRef, unref } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { STALE_TIME } from "~/core/query/stale-time";
import type { DueRangeFilters, DueRangeResponseDto } from "../contracts/due-range.dto";
import { type DueRangeClient, useDueRangeClient } from "../services/due-range.client";

/**
 * Fetches upcoming and overdue transactions from the due-range endpoint.
 *
 * Re-fetches reactively when `filters` changes.  Errors propagate as query
 * error state — no silent catch.
 *
 * @param filters Optional reactive filters (date range, ordering, pagination).
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed DueRangeResponseDto data.
 */
export function useDueRangeQuery(
  filters?: MaybeRef<DueRangeFilters | undefined>,
  providedClient?: DueRangeClient,
): UseQueryReturnType<DueRangeResponseDto, Error> {
  const client = providedClient ?? useDueRangeClient();

  return useQuery({
    queryKey: ["transactions", "due-range", filters] as const,
    queryFn: (): Promise<DueRangeResponseDto> => client.getDueRange(unref(filters)),
    staleTime: STALE_TIME.ACTIVE,
  });
}
