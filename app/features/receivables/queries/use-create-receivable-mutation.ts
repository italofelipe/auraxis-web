import type { UseMutationReturnType } from "@tanstack/vue-query";

import { createApiMutation } from "~/core/query/use-api-mutation";
import type { ApiError } from "~/core/errors";
import {
  useReceivablesClient,
  type CreateReceivablePayload,
  type ReceivablesClient,
} from "~/features/receivables/services/receivables.client";
import type { ReceivableEntry } from "~/features/receivables/model/receivables";

/**
 * Vue Query mutation hook for creating a new receivable entry.
 *
 * Invalidates the receivables list cache on success so the UI reflects the change.
 * Errors propagate as mutation error state — no silent catch.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state with typed ReceivableEntry result.
 */
export const useCreateReceivableMutation = (
  providedClient?: ReceivablesClient,
): UseMutationReturnType<ReceivableEntry, ApiError, CreateReceivablePayload, unknown> => {
  const client = providedClient ?? useReceivablesClient();
  return createApiMutation<ReceivableEntry, CreateReceivablePayload>(
    (payload) => client.createReceivable(payload),
    { invalidates: [["receivables", "list"]] },
  );
};
