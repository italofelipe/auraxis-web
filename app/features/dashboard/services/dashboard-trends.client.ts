import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type { DashboardTrendsResponseDto } from "~/features/dashboard/contracts/dashboard-overview.dto";
import type { DashboardTrends } from "~/features/dashboard/model/dashboard-overview";

/**
 * Strips the v2 contract wrapper when it is present.
 *
 * The HTTP layer sends `X-API-Contract: v2` em toda requisição, então a API
 * responde `{ success, message, data: {...} }`. Ler `series` direto no envelope
 * dava sempre `undefined`, o gráfico de fluxo de caixa caía no ponto sintético
 * de fallback e desenhava três bolinhas soltas em vez de linhas.
 *
 * Mesma coerção que `dashboard-overview.mapper.ts` já fazia para o overview.
 *
 * @param payload Corpo bruto da resposta.
 * @returns O conteúdo sem o envelope, ou o próprio corpo quando ele já é plano.
 */
const unwrapContractEnvelope = (payload: unknown): Record<string, unknown> => {
  if (typeof payload !== "object" || payload === null) {
    return {};
  }

  const top = payload as Record<string, unknown>;
  const inner = top.data;

  if (typeof inner === "object" && inner !== null && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }

  return top;
};

/**
 * Maps the API trends DTO to the internal trends model.
 *
 * @param payload Raw API response, com ou sem envelope de contrato.
 * @returns Parsed trends model.
 */
const mapTrendsDto = (payload: unknown): DashboardTrends => {
  const dto = unwrapContractEnvelope(payload) as unknown as DashboardTrendsResponseDto;

  return {
    months: dto.months,
    series: (dto.series ?? []).map((entry) => ({
      month: entry.month,
      income: entry.income,
      expenses: entry.expenses,
      balance: entry.balance,
    })),
  };
};

export class DashboardTrendsApiClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Fetches multi-month income/expense trends from the API.
   *
   * @param months Number of months to include in the trends series.
   * @returns Parsed trends data ready for UI consumption.
   */
  async getTrends(months: number): Promise<DashboardTrends> {
    // Sem tipo aqui de propósito: a resposta pode vir plana (contrato legado) ou
    // dentro de `data` (contrato v2), e é o mapper que resolve os dois casos.
    const response = await this.#http.get("/dashboard/trends", { params: { months } });
    return mapTrendsDto(response.data);
  }
}

/**
 * Resolves the canonical dashboard trends API client using the shared HTTP layer.
 *
 * @returns Dashboard trends API client instance.
 */
export const useDashboardTrendsApiClient = (): DashboardTrendsApiClient => {
  return new DashboardTrendsApiClient(useHttp());
};
