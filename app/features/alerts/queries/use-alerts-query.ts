import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { isMockDataEnabled } from "~/core/config";
import { useAlertsClient, type AlertsClient } from "~/features/alerts/api/alerts.client";
import type { AlertsPage } from "~/features/alerts/model/alerts";

/** Mock payload used only when NUXT_PUBLIC_MOCK_DATA=true. */
const alertsMock: AlertsPage = {
  items: [
    {
      id: "a-1",
      type: "system",
      title: "Nova atualização disponível",
      body: "Uma nova versão do Auraxis está disponível.",
      severity: "info",
      readAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: "a-2",
      type: "account",
      title: "Limite de crédito próximo",
      body: "Você está utilizando 85% do seu limite de crédito.",
      severity: "warning",
      readAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: "a-3",
      type: "security",
      title: "Acesso suspeito detectado",
      body: "Detectamos um acesso de um dispositivo não reconhecido.",
      severity: "critical",
      readAt: null,
      createdAt: new Date().toISOString(),
    },
  ],
  total: 3,
};

/**
 * Vue Query hook for the authenticated user's alerts list.
 *
 * Errors propagate as query error state — no silent catch.
 * Mock data is only used when NUXT_PUBLIC_MOCK_DATA=true (dev/test).
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed AlertsPage data.
 */
export const useAlertsQuery = (
  providedClient?: AlertsClient,
): UseQueryReturnType<AlertsPage, Error> => {
  const client = providedClient ?? useAlertsClient();

  return useQuery({
    queryKey: ["alerts", "list"] as const,
    queryFn: (): Promise<AlertsPage> => {
      if (isMockDataEnabled()) {
        return Promise.resolve(alertsMock);
      }

      return client.getAlerts();
    },
  });
};
