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
 * Payload for creating a new wallet entry.
 */
export type CreateWalletEntryPayload = {
  /** Display name for the asset. */
  readonly name: string;
  /** Current monetary value — required when no ticker is provided. */
  readonly value?: number | null;
  /** Stock/crypto/fund ticker symbol — when provided, quantity is required. */
  readonly ticker?: string | null;
  /** Number of units held — required when ticker is provided. */
  readonly quantity?: number | null;
  /** Asset class classification. */
  readonly asset_class?: "stock" | "fii" | "etf" | "bdr" | "crypto" | "cdb" | "custom";
  /** ISO 8601 date (YYYY-MM-DD) of the registration. */
  readonly register_date: string;
  /** Whether this asset should count towards total patrimony. */
  readonly should_be_on_wallet: boolean;
};

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

  /**
   * Creates a new wallet entry for the authenticated user.
   *
   * The backend responds with `{ message, data: { investment: WalletEntryDto } }`.
   *
   * @param payload - Data for the new asset entry.
   * @returns The newly created WalletEntryDto.
   */
  async createEntry(payload: CreateWalletEntryPayload): Promise<WalletEntryDto> {
    const response = await this.#http.post<{ data: { investment: WalletEntryDto } }>(
      "/wallet",
      payload,
    );
    return response.data.data.investment;
  }

  /**
   * Deletes a wallet entry by its identifier.
   *
   * @param id - The unique identifier of the entry to delete.
   */
  async deleteEntry(id: string): Promise<void> {
    await this.#http.delete(`/wallet/${id}`);
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
