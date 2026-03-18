import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { isMockDataEnabled } from "~/core/config";
import { useAlertsClient, type AlertsClient } from "~/features/alerts/api/alerts.client";
import type { AlertPreference } from "~/features/alerts/model/alerts";

/** Mock payload used only when NUXT_PUBLIC_MOCK_DATA=true. */
const alertPreferencesMock: AlertPreference[] = [
  {
    id: "pref-1",
    category: "system",
    enabled: true,
    channels: ["email", "push"],
  },
  {
    id: "pref-2",
    category: "account",
    enabled: true,
    channels: ["email"],
  },
  {
    id: "pref-3",
    category: "security",
    enabled: true,
    channels: ["email", "push", "sms"],
  },
  {
    id: "pref-4",
    category: "marketing",
    enabled: false,
    channels: [],
  },
];

/**
 * Vue Query hook for the authenticated user's alert preferences.
 *
 * Errors propagate as query error state — no silent catch.
 * Mock data is only used when NUXT_PUBLIC_MOCK_DATA=true (dev/test).
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed AlertPreference array.
 */
export const useAlertPreferencesQuery = (
  providedClient?: AlertsClient,
): UseQueryReturnType<AlertPreference[], Error> => {
  const client = providedClient ?? useAlertsClient();

  return useQuery({
    queryKey: ["alerts", "preferences"] as const,
    queryFn: (): Promise<AlertPreference[]> => {
      if (isMockDataEnabled()) {
        return Promise.resolve(alertPreferencesMock);
      }

      return client.getPreferences();
    },
  });
};
