import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { STALE_TIME } from "~/core/query/stale-time";
import {
  useNotificationPreferencesApiClient,
  type NotificationPreferencesApiClient,
} from "~/features/notifications/services/notification-preferences.client";
import type { NotificationPreference } from "~/features/notifications/model/notification-preferences";

/** Shared query key for the notification preferences resource. */
export const NOTIFICATION_PREFERENCES_QUERY_KEY = ["notifications", "preferences"] as const;

/**
 * Vue Query hook for the authenticated user's notification preferences.
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with the domain preferences list.
 */
export const useNotificationPreferencesQuery = (
  providedClient?: NotificationPreferencesApiClient,
): UseQueryReturnType<NotificationPreference[], Error> => {
  const client = providedClient ?? useNotificationPreferencesApiClient();

  return useQuery({
    queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY,
    queryFn: (): Promise<NotificationPreference[]> => client.getPreferences(),
    staleTime: STALE_TIME.STATIC,
  });
};
