import { type UseMutationReturnType, useMutation } from "@tanstack/vue-query";

import {
  useReceivablesClient,
  type CsvConfirmResult,
  type ReceivablesClient,
} from "~/features/receivables/services/receivables.client";
import type { ParsedRowDto } from "~/features/receivables/contracts/receivables.dto";

/**
 * Vue Query mutation hook for confirming a CSV import and persisting parsed rows.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation state with created count on success.
 */
export const useConfirmImportMutation = (
  providedClient?: ReceivablesClient,
): UseMutationReturnType<CsvConfirmResult, Error, ParsedRowDto[], unknown> => {
  const client = providedClient ?? useReceivablesClient();

  return useMutation({
    mutationFn: (rows: ParsedRowDto[]): Promise<CsvConfirmResult> => {
      return client.confirmImport(rows);
    },
  });
};
