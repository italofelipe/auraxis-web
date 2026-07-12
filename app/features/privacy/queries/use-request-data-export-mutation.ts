import type { UseMutationReturnType } from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";
import { createApiMutation } from "~/core/query/use-api-mutation";
import type { PrivacyDataExportPackageDto } from "~/features/privacy/contracts/privacy-center.dto";
import {
  type PrivacyCenterClient,
  usePrivacyCenterClient,
} from "~/features/privacy/services/privacy-center.client";

/**
 * Fetches the LGPD data portability package for the authenticated user
 * (`GET /user/me/export`). The caller is responsible for handing the package
 * to the user (e.g. via `downloadJsonFile`).
 *
 * @param providedClient Optional client used by unit tests.
 * @returns Vue Query mutation state.
 */
export const useRequestDataExportMutation = (
  providedClient?: PrivacyCenterClient,
): UseMutationReturnType<PrivacyDataExportPackageDto, ApiError, void, unknown> => {
  const client = providedClient ?? usePrivacyCenterClient();
  return createApiMutation<PrivacyDataExportPackageDto>(
    () => client.requestDataExport(),
    { successMessage: "Pacote de dados gerado." },
  );
};
