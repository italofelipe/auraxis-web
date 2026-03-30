import { type MaybeRef, unref } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import {
  type ListTransactionsFilters,
  type TransactionsClient,
  useTransactionsClient,
} from "~/features/transactions/services/transactions.client";

/**
 * Vue Query hook for listing the authenticated user's transactions.
 *
 * Re-fetches automatically when `filters` changes (reactive ref support).
 * Errors propagate as query error state — no silent catch.
 *
 * @param filters Optional reactive filters (type, status, date range).
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed TransactionDto array data.
 */
export const useListTransactionsQuery = (
  filters?: MaybeRef<ListTransactionsFilters | undefined>,
  providedClient?: TransactionsClient,
): UseQueryReturnType<TransactionDto[], Error> => {
  const client = providedClient ?? useTransactionsClient();

  return useQuery({
    queryKey: ["transactions", "list", filters] as const,
    queryFn: (): Promise<TransactionDto[]> => {
      return client.listTransactions(unref(filters));
    },
  });
};
