import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
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
   * Updates an existing wallet entry using a partial PATCH payload.
   *
   * Calls `PATCH /wallet/<id>` and returns the updated WalletEntryDto.
   * The operation is atomic — if the request fails, the original entry remains unchanged.
   *
   * @param id - The unique identifier of the entry to update.
   * @param payload - Partial update data for the entry.
   * @returns The updated WalletEntryDto as returned by the API.
   */
  async updateEntry(id: string, payload: Partial<CreateWalletEntryPayload>): Promise<WalletEntryDto> {
    const response = await this.#http.patch<{ data: { investment: WalletEntryDto } }>(
      `/wallet/${id}`,
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
