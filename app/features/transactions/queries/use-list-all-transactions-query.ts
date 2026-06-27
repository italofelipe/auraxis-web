import { type MaybeRef, unref } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { STALE_TIME } from "~/core/query/stale-time";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import {
  type ListTransactionsFilters,
  type TransactionsClient,
  useTransactionsClient,
} from "~/features/transactions/services/transactions.client";

/**
 * Vue Query hook for listing the COMPLETE set of transactions matching the
 * filters, following server-side pagination.
 *
 * Unlike `useListTransactionsQuery` (first page only), this hook returns every
 * record in the range. Use it where aggregations must see all transactions
 * (e.g. the credit-cards billing window). Cached under a distinct `list-all`
 * key so it never collides with the paginated list.
 *
 * @param filters Optional reactive filters (type, status, date range).
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with the full typed TransactionDto array.
 */
export const useListAllTransactionsQuery = (
  filters?: MaybeRef<ListTransactionsFilters | undefined>,
  providedClient?: TransactionsClient,
): UseQueryReturnType<TransactionDto[], Error> => {
  const client = providedClient ?? useTransactionsClient();

  return useQuery({
    queryKey: ["transactions", "list-all", filters] as const,
    queryFn: (): Promise<TransactionDto[]> => {
      return client.listAllTransactions(unref(filters));
    },
    staleTime: STALE_TIME.ACTIVE,
  });
};
