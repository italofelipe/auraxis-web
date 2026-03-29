import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { isMockDataEnabled } from "~/core/config";
import { useWalletClient, type WalletClient } from "~/features/wallet/api/wallet.client";
import { MOCK_PORTFOLIO_SUMMARY } from "~/features/portfolio/mock/portfolio.mock";
import type { PortfolioSummaryDto } from "~/features/portfolio/contracts/portfolio.dto";

/**
 * Vue Query hook for the authenticated user's portfolio summary.
 *
 * Errors propagate as query error state — no silent catch.
 * Mock data is only used when NUXT_PUBLIC_MOCK_DATA=true (dev/test).
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed PortfolioSummaryDto data.
 */
export const usePortfolioSummaryQuery = (
  providedClient?: WalletClient,
): UseQueryReturnType<PortfolioSummaryDto, Error> => {
  const client = providedClient ?? useWalletClient();

  return useQuery({
    queryKey: ["wallet", "portfolio-summary"] as const,
    queryFn: (): Promise<PortfolioSummaryDto> => {
      if (isMockDataEnabled()) {
        return Promise.resolve(MOCK_PORTFOLIO_SUMMARY);
      }

      return client.getPortfolioSummary();
    },
  });
};
