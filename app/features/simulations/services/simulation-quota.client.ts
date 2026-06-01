import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import {
  toSimulationQuota,
  type SimulationQuotaDto,
} from "~/features/simulations/contracts/simulation-quota.dto";
import type { SimulationQuota } from "~/features/simulations/model/simulation-quota";

type QuotaResponse =
  | SimulationQuotaDto
  | { readonly data?: SimulationQuotaDto | null };

/**
 * API client da quota freemium do simulador (#566 / backend #1409).
 *
 * Encapsula as chamadas HTTP aos endpoints `/simulations/quota`.
 */
export class SimulationQuotaClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Instância Axios já configurada para a API Auraxis.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Lê o snapshot da quota do usuário autenticado (não consome).
   *
   * @returns Quota de domínio tipada.
   */
  async getQuota(): Promise<SimulationQuota> {
    const response = await this.#http.get<QuotaResponse>("/simulations/quota");
    return toSimulationQuota(response.data);
  }

  /**
   * Consome 1 simulação. Não lança em esgotamento — o backend retorna
   * `allowed=false` e a UI decide exibir o paywall.
   *
   * @returns Quota atualizada após a tentativa de consumo.
   */
  async consume(): Promise<SimulationQuota> {
    const response = await this.#http.post<QuotaResponse>(
      "/simulations/quota/consume",
    );
    return toSimulationQuota(response.data);
  }
}

/**
 * Resolve o client canônico usando a camada HTTP compartilhada.
 *
 * @returns Instância de SimulationQuotaClient ligada ao adapter HTTP.
 */
export const useSimulationQuotaClient = (): SimulationQuotaClient => {
  return new SimulationQuotaClient(useHttp());
};
