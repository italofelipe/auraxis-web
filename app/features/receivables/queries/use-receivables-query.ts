import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { isMockDataEnabled } from "~/core/config";
import {
  useReceivablesClient,
  type ReceivablesClient,
} from "~/features/receivables/api/receivables.client";
import type { ReceivableEntry, ReceivableStatus } from "~/features/receivables/model/receivables";

/** Mock payload used only when NUXT_PUBLIC_MOCK_DATA=true. */
const receivablesMock: ReceivableEntry[] = [
  {
    id: "mock-1",
    description: "Consultoria Janeiro",
    amount: 3500,
    expectedDate: "2026-01-31",
    receivedDate: "2026-01-31",
    status: "received",
    category: "Consultoria",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "mock-2",
    description: "Projeto Auraxis",
    amount: 8000,
    expectedDate: "2026-03-31",
    receivedDate: null,
    status: "pending",
    category: "Desenvolvimento",
    createdAt: "2026-03-01T00:00:00.000Z",
  },
];

/**
 * Vue Query hook for the authenticated user's receivable entries.
 *
 * Errors propagate as query error state — no silent catch.
 * Mock data is only used when NUXT_PUBLIC_MOCK_DATA=true (dev/test).
 *
 * @param status Optional status filter.
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed ReceivableEntry array data.
 */
export const useReceivablesQuery = (
  status?: ReceivableStatus,
  providedClient?: ReceivablesClient,
): UseQueryReturnType<ReceivableEntry[], Error> => {
  const client = providedClient ?? useReceivablesClient();

  return useQuery({
    queryKey: ["receivables", "list", status ?? "all"] as const,
    queryFn: (): Promise<ReceivableEntry[]> => {
      if (isMockDataEnabled()) {
        return Promise.resolve(receivablesMock);
      }

      return client.listReceivables(status);
    },
  });
};
