import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { STALE_TIME } from "~/core/query/stale-time";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import {
  type TransactionsClient,
  useTransactionsClient,
} from "~/features/transactions/services/transactions.client";

/**
 * Vue Query hook for listing the user's soft-deleted transactions.
 *
 * Powers the "Lixeira" (trash) view where users can review recently
 * deleted records and restore individual items.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed soft-deleted TransactionDto array.
 */
export const useListDeletedTransactionsQuery = (
  providedClient?: TransactionsClient,
): UseQueryReturnType<TransactionDto[], Error> => {
  const client = providedClient ?? useTransactionsClient();

  return useQuery({
    queryKey: ["transactions", "deleted"] as const,
    queryFn: (): Promise<TransactionDto[]> => client.listDeletedTransactions(),
    staleTime: STALE_TIME.ACTIVE,
  });
};
