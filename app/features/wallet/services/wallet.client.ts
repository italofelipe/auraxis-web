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
   * @returns PortfolioSummaryDto with aggregate totals and return percentages.
   */
  async getPortfolioSummary(): Promise<PortfolioSummaryDto> {
    const response = await this.#http.get<PortfolioSummaryDto>("/wallet/portfolio-summary");
    return response.data;
  }

  /**
   * Fetches the list of wallet entries (individual asset positions) for the authenticated user.
   *
   * @returns Array of WalletEntryDto representing each held asset.
   */
  async getEntries(): Promise<WalletEntryDto[]> {
    const response = await this.#http.get<WalletEntryDto[]>("/wallet/entries");
    return response.data;
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
