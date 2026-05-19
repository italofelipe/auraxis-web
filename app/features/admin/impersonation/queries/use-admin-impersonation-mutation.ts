import { type UseMutationReturnType, useMutation } from "@tanstack/vue-query";

import type {
  AdminImpersonationSession,
  StartAdminImpersonationInput,
} from "~/features/admin/impersonation/model/admin-impersonation";
import {
  type AdminImpersonationClient,
  useAdminImpersonationClient,
} from "~/features/admin/impersonation/services/admin-impersonation.client";

/**
 * Creates the mutation used to start read-only impersonation.
 *
 * @param providedClient Optional client override for tests.
 * @returns Vue Query mutation for creating an impersonation session.
 */
export const useStartAdminImpersonationMutation = (
  providedClient?: AdminImpersonationClient,
): UseMutationReturnType<
  AdminImpersonationSession,
  Error,
  StartAdminImpersonationInput,
  unknown
> => {
  const client = providedClient ?? useAdminImpersonationClient();

  return useMutation<
    AdminImpersonationSession,
    Error,
    StartAdminImpersonationInput
  >({
    mutationFn: (input) => client.startSession(input),
  });
};

/**
 * Creates the mutation used to end read-only impersonation.
 *
 * @param providedClient Optional client override for tests.
 * @returns Vue Query mutation for ending an impersonation session.
 */
export const useEndAdminImpersonationMutation = (
  providedClient?: AdminImpersonationClient,
): UseMutationReturnType<undefined, Error, string, unknown> => {
  const client = providedClient ?? useAdminImpersonationClient();

  return useMutation<undefined, Error, string>({
    mutationFn: async (sessionId) => {
      await client.endSession(sessionId);
      return undefined;
    },
  });
};
