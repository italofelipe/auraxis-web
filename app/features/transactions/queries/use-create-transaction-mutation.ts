import type { UseMutationReturnType } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import { createApiMutation } from "~/core/query/use-api-mutation";
import type {
  CreateTransactionPayload,
  TransactionDto,
} from "~/features/transactions/contracts/transaction.dto";
import {
  type TransactionsClient,
  useTransactionsClient,
} from "~/features/transactions/services/transactions.client";

/**
 * Vue Query mutation hook for creating a new financial transaction
 * (income or expense).
 *
 * Automatically:
 * - Shows a success toast after the mutation resolves.
 * - Invalidates the dashboard overview cache so the summary metrics refresh.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state: `mutate`, `isPending`, `isError`, etc.
 */
export const useCreateTransactionMutation = (
  providedClient?: TransactionsClient,
): UseMutationReturnType<TransactionDto[], ApiError, CreateTransactionPayload, unknown> => {
  const client = providedClient ?? useTransactionsClient();
  return createApiMutation<TransactionDto[], CreateTransactionPayload>(
    (payload) => client.createTransaction(payload),
    {
      invalidates: [["dashboard", "overview"]],
    },
  );
};
