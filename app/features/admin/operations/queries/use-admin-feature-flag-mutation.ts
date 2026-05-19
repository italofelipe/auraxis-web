import {
  type UseMutationReturnType,
  useMutation,
  useQueryClient,
} from "@tanstack/vue-query";

import type {
  AdminFeatureFlagUpdateInput,
  AdminFeatureFlagUpdateResult,
} from "~/features/admin/operations/model/admin-operations";
import {
  type AdminOperationsClient,
  useAdminOperationsClient,
} from "~/features/admin/operations/services/admin-operations.client";
import { ADMIN_FEATURE_FLAGS_QUERY_KEY } from "./use-admin-feature-flags-query";

/**
 * Creates the mutation used to update admin feature flags.
 *
 * @param providedClient Optional client override for tests.
 * @returns Vue Query mutation for feature flag status changes.
 */
export const useAdminFeatureFlagMutation = (
  providedClient?: AdminOperationsClient,
): UseMutationReturnType<
  AdminFeatureFlagUpdateResult,
  Error,
  AdminFeatureFlagUpdateInput,
  unknown
> => {
  const client = providedClient ?? useAdminOperationsClient();
  const queryClient = useQueryClient();

  return useMutation<
    AdminFeatureFlagUpdateResult,
    Error,
    AdminFeatureFlagUpdateInput
  >({
    mutationFn: (input) => client.updateFeatureFlag(input),
    onSuccess: async (): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_FEATURE_FLAGS_QUERY_KEY });
    },
  });
};
