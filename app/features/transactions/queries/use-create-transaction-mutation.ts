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
import { useAnalytics } from "~/composables/useAnalytics/useAnalytics";

/**
 * localStorage key the mutation uses to dedupe the
 * `first_transaction_created` event. Once the user creates their first
 * transaction successfully, we set this flag so subsequent creates do
 * not re-emit the funnel event. Scoped by client (not user) —
 * server-side dedupe lives in PostHog (`identify` + event ordering)
 * when needed.
 */
const FIRST_TRANSACTION_FLAG_KEY = "auraxis.analytics.firstTransactionCreated";

/**
 * Reads the first-transaction flag from localStorage.
 * SSR-safe (returns true on the server so the event isn't emitted twice).
 *
 * @returns Whether the user already had their first-transaction event captured.
 */
const hasEmittedFirstTransaction = (): boolean => {
  if (typeof window === "undefined") {
    return true; // SSR: treat as already emitted to avoid false positives
  }
  try {
    return window.localStorage.getItem(FIRST_TRANSACTION_FLAG_KEY) === "1";
  } catch {
    // Storage disabled (private mode, etc.) — degrade gracefully and let
    // PostHog server-side dedupe handle the duplicate.
    return false;
  }
};

/** Persists the flag so subsequent creates skip the event. */
const markFirstTransactionEmitted = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(FIRST_TRANSACTION_FLAG_KEY, "1");
  } catch {
    // Same gracefully-fail-shut path as the read above.
  }
};

/**
 * Vue Query mutation hook for creating a new financial transaction
 * (income or expense).
 *
 * Automatically:
 * - Shows a success toast after the mutation resolves.
 * - Invalidates the dashboard overview cache so the summary metrics refresh.
 * - Captures the PostHog event `first_transaction_created` exactly once
 *   per browser (deduped via localStorage). #524 conversion funnel.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state: `mutate`, `isPending`, `isError`, etc.
 */
export const useCreateTransactionMutation = (
  providedClient?: TransactionsClient,
): UseMutationReturnType<TransactionDto[], ApiError, CreateTransactionPayload, unknown> => {
  const client = providedClient ?? useTransactionsClient();
  const analytics = useAnalytics();
  return createApiMutation<TransactionDto[], CreateTransactionPayload>(
    (payload) => client.createTransaction(payload),
    {
      invalidates: [["dashboard", "overview"]],
      onSuccess: (created: TransactionDto[]): void => {
        if (hasEmittedFirstTransaction()) {
          return;
        }
        const sample = created[0];
        analytics.capture("first_transaction_created", {
          transaction_type: sample?.type ?? "unknown",
          batch_size: created.length,
        });
        markFirstTransactionEmitted();
      },
    },
  );
};
