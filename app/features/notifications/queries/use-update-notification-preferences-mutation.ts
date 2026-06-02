import { type UseMutationReturnType, useMutation, useQueryClient } from "@tanstack/vue-query";

import {
  useNotificationPreferencesApiClient,
  type NotificationPreferencesApiClient,
} from "~/features/notifications/services/notification-preferences.client";
import type { NotificationPreference } from "~/features/notifications/model/notification-preferences";
import { NOTIFICATION_PREFERENCES_QUERY_KEY } from "~/features/notifications/queries/use-notification-preferences-query";

/**
 * Vue Query mutation to upsert notification preferences.
 *
 * Invalidates the preferences query on success so server state is refetched
 * rather than synced by hand.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query mutation for batch preference updates.
 */
export const useUpdateNotificationPreferencesMutation = (
  providedClient?: NotificationPreferencesApiClient,
): UseMutationReturnType<NotificationPreference[], Error, NotificationPreference[], unknown> => {
  const client = providedClient ?? useNotificationPreferencesApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: NotificationPreference[]): Promise<NotificationPreference[]> =>
      client.updatePreferences(preferences),
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY });
    },
  });
};
