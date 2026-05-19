import type { UseMutationReturnType } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import { createApiMutation } from "~/core/query/use-api-mutation";
import type { PrivacyDataExportDto } from "~/features/privacy/contracts/privacy-center.dto";
import {
  type PrivacyCenterClient,
  usePrivacyCenterClient,
} from "~/features/privacy/services/privacy-center.client";

/**
 * Requests a data portability package for the authenticated user.
 *
 * @param providedClient Optional client used by unit tests.
 * @returns Vue Query mutation state.
 */
export const useRequestDataExportMutation = (
  providedClient?: PrivacyCenterClient,
): UseMutationReturnType<PrivacyDataExportDto, ApiError, void, unknown> => {
  const client = providedClient ?? usePrivacyCenterClient();
  return createApiMutation<PrivacyDataExportDto>(
    () => client.requestDataExport(),
    { successMessage: "Solicitação de exportação enviada." },
  );
};
