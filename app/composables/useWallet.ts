import { useQuery } from "@tanstack/vue-query";

import type { WalletSummary } from "~/types/contracts";
import { useHttp } from "~/composables/useHttp";

const walletPlaceholder: WalletSummary = {
  total: 65300,
  assets: [
    { id: "reserve", name: "Reserva", amount: 31000, allocation: 47.47 },
    { id: "equities", name: "Acoes", amount: 22300, allocation: 34.15 },
    { id: "crypto", name: "Cripto", amount: 12000, allocation: 18.38 },
  ],
};

interface HttpAdapter {
  get<TResponse>(url: string): Promise<{ data: TResponse }>;
}

export const createWalletApi = (http: HttpAdapter) => {
  return {
    getSummary: async (): Promise<WalletSummary> => {
      const response = await http.get<WalletSummary>("/wallet/summary");
      return response.data;
    },
  };
};

export const useWalletSummaryQuery = () => {
  const walletApi = createWalletApi(useHttp());

  return useQuery({
    queryKey: ["wallet", "summary"],
    queryFn: async (): Promise<WalletSummary> => {
      try {
        return await walletApi.getSummary();
      } catch {
        return walletPlaceholder;
      }
    },
  });
};
