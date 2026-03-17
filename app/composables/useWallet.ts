import { useRuntimeConfig } from "#app";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import type { WalletSummary } from "~/types/contracts";
import { useHttp } from "~/composables/useHttp";

/**
 * Mock data for local development / controlled test environments.
 * Only active when NUXT_PUBLIC_MOCK_DATA=true — never in the nominal
 * production path (WEB-CONTRACT-01).
 */
const walletMock: WalletSummary = {
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

interface WalletApi {
  getSummary(): Promise<WalletSummary>;
}

/**
 * Returns true when explicit mock mode is enabled via env var.
 * Must never be true in production.
 * @returns True when NUXT_PUBLIC_MOCK_DATA=true.
 */
const isMockDataEnabled = (): boolean => {
  const config = useRuntimeConfig();
  return (config.public as Record<string, unknown>).mockData === "true";
};

/**
 * Cria adapter da API de carteira.
 * @param http Cliente HTTP com método GET.
 * @returns API de carteira.
 */
export const createWalletApi = (http: HttpAdapter): WalletApi => {
  return {
    getSummary: async (): Promise<WalletSummary> => {
      const response = await http.get<WalletSummary>("/wallet/summary");
      return response.data;
    },
  };
};

/**
 * Query de resumo da carteira.
 *
 * Falhas de contrato são propagadas como estado de erro do Vue Query para
 * que a UI possa exibir feedback rastreável.  Mock data só é usado quando
 * NUXT_PUBLIC_MOCK_DATA=true (dev/teste explícito) — jamais no fluxo nominal.
 *
 * @returns Query com estado de loading, error e data tipados.
 */
export const useWalletSummaryQuery = (): UseQueryReturnType<WalletSummary, Error> => {
  const walletApi = createWalletApi(useHttp());

  return useQuery({
    queryKey: ["wallet", "summary"],
    queryFn: async (): Promise<WalletSummary> => {
      if (isMockDataEnabled()) {
        return walletMock;
      }
      return await walletApi.getSummary();
    },
  });
};
