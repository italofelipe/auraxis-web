import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { isMockDataEnabled } from "~/core/config";
import { useWalletClient, type WalletClient } from "~/features/wallet/services/wallet.client";
import type { WalletSummary } from "~/features/wallet/model/wallet";

/** Mock payload used only when NUXT_PUBLIC_MOCK_DATA=true. */
const walletSummaryMock: WalletSummary = {
  totalPatrimony: 87500,
  investedValue: 72000,
  currentValue: 87500,
  periodVariation: 15500,
  periodVariationPct: 21.53,
  lastUpdated: new Date().toISOString(),
  positions: [
    {
      id: "reserve",
      name: "Reserva de Emergência",
      category: "Renda Fixa",
      invested: 30000,
      currentValue: 31200,
      variationPct: 4.0,
    },
    {
      id: "equities",
      name: "Ações Brasil",
      ticker: "BOVA11",
      category: "Renda Variável",
      invested: 25000,
      currentValue: 28500,
      variationPct: 14.0,
    },
    {
      id: "crypto",
      name: "Bitcoin",
      ticker: "BTC",
      category: "Criptomoedas",
      invested: 17000,
      currentValue: 27800,
      variationPct: 63.53,
    },
  ],
};

/**
 * Vue Query hook for the authenticated user's wallet summary.
 *
 * Errors propagate as query error state — no silent catch.
 * Mock data is only used when NUXT_PUBLIC_MOCK_DATA=true (dev/test).
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed WalletSummary data.
 */
export const useWalletSummaryQuery = (
  providedClient?: WalletClient,
): UseQueryReturnType<WalletSummary, Error> => {
  const client = providedClient ?? useWalletClient();

  return useQuery({
    queryKey: ["wallet", "summary"] as const,
    queryFn: (): Promise<WalletSummary> => {
      if (isMockDataEnabled()) {
        return Promise.resolve(walletSummaryMock);
      }

      return client.getSummary();
    },
  });
};
