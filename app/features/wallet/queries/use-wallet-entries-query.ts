import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import { isMockDataEnabled } from "~/core/config";
import { useWalletClient, type WalletClient } from "~/features/wallet/api/wallet.client";
import { MOCK_WALLET_ENTRIES } from "~/features/portfolio/mock/portfolio.mock";
import type { WalletEntryDto } from "~/features/portfolio/contracts/portfolio.dto";

/**
 * Vue Query hook for the authenticated user's wallet entries (individual asset positions).
 *
 * Errors propagate as query error state — no silent catch.
 * Mock data is only used when NUXT_PUBLIC_MOCK_DATA=true (dev/test).
 *
 * @param providedClient Optional injected client for unit tests.
 * @returns Vue Query state with typed WalletEntryDto array.
 */
export const useWalletEntriesQuery = (
  providedClient?: WalletClient,
): UseQueryReturnType<WalletEntryDto[], Error> => {
  const client = providedClient ?? useWalletClient();

  return useQuery({
    queryKey: ["wallet", "entries"] as const,
    queryFn: (): Promise<WalletEntryDto[]> => {
      if (isMockDataEnabled()) {
        return Promise.resolve(MOCK_WALLET_ENTRIES);
      }

      return client.getEntries();
    },
  });
};
