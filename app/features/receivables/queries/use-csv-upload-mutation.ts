import { type UseMutationReturnType, useMutation } from "@tanstack/vue-query";

import {
  useReceivablesClient,
  type CsvUploadPayload,
  type ReceivablesClient,
} from "~/features/receivables/api/receivables.client";
import type { ParsedRow } from "~/features/receivables/model/receivables";

/**
 * Vue Query mutation hook for uploading CSV content and retrieving parsed row previews.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state with parsed preview rows on success.
 */
export const useCsvUploadMutation = (
  providedClient?: ReceivablesClient,
): UseMutationReturnType<ParsedRow[], Error, CsvUploadPayload, unknown> => {
  const client = providedClient ?? useReceivablesClient();

  return useMutation({
    mutationFn: (payload: CsvUploadPayload): Promise<ParsedRow[]> => {
      return client.uploadCsv(payload);
    },
  });
};
