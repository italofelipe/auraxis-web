import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type { WalletSummaryDto } from "~/features/wallet/contracts/wallet.dto";
import { mapWalletSummaryDto } from "~/features/wallet/services/wallet.mapper";
import type { WalletSummary } from "~/features/wallet/model/wallet";
import type {
  PortfolioSummaryDto,
  WalletEntryDto,
} from "~/features/portfolio/contracts/portfolio.dto";

/**
 * API client for the wallet feature.
 *
 * Encapsulates all HTTP calls to the `/wallet` endpoints and returns
 * mapped view-model types ready for UI consumption.
 */
export class WalletClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Fetches the wallet summary for the authenticated user.
   *
   * @returns Mapped wallet summary view model.
   */
  async getSummary(): Promise<WalletSummary> {
    const response = await this.#http.get<WalletSummaryDto>("/wallet/summary");
    return mapWalletSummaryDto(response.data);
  }

  /**
   * Fetches the portfolio summary (aggregate totals + return metrics) for the authenticated user.
   *
   * Calls `GET /wallet/valuation` and maps the v2 envelope summary fields to PortfolioSummaryDto.
   *
   * @returns PortfolioSummaryDto with aggregate totals and return percentages.
   */
  async getPortfolioSummary(): Promise<PortfolioSummaryDto> {
    const response = await this.#http.get<{
      data: {
        summary: {
          total_current_value: string;
          total_invested_amount: string;
          total_profit_loss_percent: string;
          total_investments: number;
        };
      };
    }>("/wallet/valuation");
    const { summary } = response.data.data;
    return {
      total_value: parseFloat(summary.total_current_value),
      total_cost: parseFloat(summary.total_invested_amount),
      day_change_percent: null,
      total_return_percent: parseFloat(summary.total_profit_loss_percent),
      asset_count: summary.total_investments,
    };
  }

  /**
   * Fetches the list of wallet entries (individual asset positions) for the authenticated user.
   *
   * Calls `GET /wallet` and returns the items array from the v2 envelope.
   *
   * @returns Array of WalletEntryDto representing each held asset.
   */
  async getEntries(): Promise<WalletEntryDto[]> {
    const response = await this.#http.get<{ data: { items: WalletEntryDto[] } }>("/wallet");
    return response.data.data.items;
  }
}

/**
 * Resolves the canonical wallet API client using the shared HTTP layer.
 *
 * @returns WalletClient instance bound to the application HTTP adapter.
 */
export const useWalletClient = (): WalletClient => {
  return new WalletClient(useHttp());
};
