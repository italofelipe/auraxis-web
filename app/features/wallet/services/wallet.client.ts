import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  PortfolioSummaryDto,
  WalletEntryDto,
} from "~/features/portfolio/contracts/portfolio.dto";
import { parseCurrencyAmount } from "~/utils/currencyInput";

type WalletEntryWireDto = Omit<
  WalletEntryDto,
  "quantity" | "current_value" | "cost_basis" | "change_percent" | "asset_type" | "register_date"
> & {
  readonly quantity?: number | string | null;
  readonly current_value?: number | string | null;
  readonly cost_basis?: number | string | null;
  readonly change_percent?: number | string | null;
  readonly asset_type?: WalletEntryDto["asset_type"] | string | null;
  readonly register_date?: string | null;
  readonly created_at?: string | null;
};

type WalletSummaryWireDto = {
  readonly total_current_value: number | string | null;
  readonly total_invested_amount: number | string | null;
  readonly total_profit_loss_percent: number | string | null;
  readonly total_investments: number | string | null;
};

/** Single point in the wallet entry's valuation history. */
export interface WalletHistoryPoint {
  /** ISO 8601 date string (YYYY-MM-DD). */
  readonly date: string;
  /** Total current market value at this date. */
  readonly total_value: number;
  /** Total amount invested (cost basis) at this date. */
  readonly invested_amount: number;
}

const WALLET_ASSET_TYPES = new Set<WalletEntryDto["asset_type"]>([
  "stock",
  "fii",
  "crypto",
  "fixed_income",
  "other",
]);

/**
 * Converts API money/number values to a finite number for chart-safe rendering.
 *
 * @param value Raw numeric value from the API.
 * @param fallback Value used when conversion fails.
 * @returns A finite number.
 */
const toFiniteNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = parseCurrencyAmount(value, fallback);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

/**
 * Converts optional API numeric values, preserving unknown values as null.
 *
 * @param value Raw numeric value from the API.
 * @returns A finite number or null when the value is absent/invalid.
 */
const toNullableFiniteNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = toFiniteNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Maps unknown asset classes to the safe fallback used by the UI.
 *
 * @param value Raw asset type from the API.
 * @returns A supported wallet asset type.
 */
const normalizeAssetType = (value: WalletEntryWireDto["asset_type"]): WalletEntryDto["asset_type"] => {
  return WALLET_ASSET_TYPES.has(value as WalletEntryDto["asset_type"])
    ? value as WalletEntryDto["asset_type"]
    : "other";
};

/**
 * Normalizes wallet entries so invalid numeric values never reach components.
 *
 * @param entry Raw wallet entry from the API.
 * @returns UI-safe wallet entry.
 */
const normalizeWalletEntry = (entry: WalletEntryWireDto): WalletEntryDto => {
  const normalized: WalletEntryDto = {
    id: entry.id,
    name: entry.name,
    ticker: entry.ticker ?? null,
    quantity: toNullableFiniteNumber(entry.quantity),
    current_value: toFiniteNumber(entry.current_value),
    cost_basis: toFiniteNumber(entry.cost_basis),
    register_date: entry.register_date ?? entry.created_at?.slice(0, 10) ?? "",
    change_percent: toNullableFiniteNumber(entry.change_percent),
    asset_type: normalizeAssetType(entry.asset_type),
  };

  return entry.stale_quote === undefined
    ? normalized
    : { ...normalized, stale_quote: entry.stale_quote };
};

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
        summary: WalletSummaryWireDto;
      };
    }>("/wallet/valuation");
    const { summary } = response.data.data;
    return {
      total_value: toFiniteNumber(summary.total_current_value),
      total_cost: toFiniteNumber(summary.total_invested_amount),
      day_change_percent: null,
      total_return_percent: toFiniteNumber(summary.total_profit_loss_percent),
      asset_count: Math.max(0, Math.round(toFiniteNumber(summary.total_investments))),
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
    const response = await this.#http.get<{ data: { items: WalletEntryWireDto[] } }>("/wallet");
    return response.data.data.items.map(normalizeWalletEntry);
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

  /**
   * Fetches the valuation history for a specific wallet entry.
   *
   * Normalises both v1 `{ history }` and v2 envelope `{ data: { history } }` responses.
   *
   * @param id - Wallet entry UUID.
   * @returns Array of WalletHistoryPoint records sorted by date ascending.
   */
  async getWalletHistory(id: string): Promise<WalletHistoryPoint[]> {
    const response = await this.#http.get<
      { data?: { history?: WalletHistoryPoint[] }; history?: WalletHistoryPoint[] }
    >(`/wallet/${id}/history`);
    const raw = response.data;
    return raw.data?.history ?? raw.history ?? [];
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
