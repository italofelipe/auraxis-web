import { type MaybeRef, unref } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";
import {
  type WalletClient,
  type WalletHistoryPoint,
  useWalletClient,
} from "~/features/wallet/services/wallet.client";

/**
 * Vue Query hook for fetching the valuation history of a wallet entry.
 *
 * The query is disabled when `entryId` resolves to null, so it is safe to
 * use before a selection is made.
 *
 * @param entryId - Reactive ref to the entry UUID (null to skip).
 * @param providedClient - Optional injected client for tests.
 * @returns Vue Query state with WalletHistoryPoint array.
 */
export const useWalletHistoryQuery = (
  entryId: MaybeRef<string | null>,
  providedClient?: WalletClient,
): UseQueryReturnType<WalletHistoryPoint[], Error> => {
  const client = providedClient ?? useWalletClient();

  return useQuery({
    queryKey: ["wallet", "history", entryId] as const,
    queryFn: (): Promise<WalletHistoryPoint[]> => {
      const id = unref(entryId);
      if (!id) {
        return Promise.resolve([]);
      }
      return client.getWalletHistory(id);
    },
    enabled: () => !!unref(entryId),
  });
};
