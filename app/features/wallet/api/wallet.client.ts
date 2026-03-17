import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type { WalletSummaryDto } from "~/features/wallet/contracts/wallet.dto";
import { mapWalletSummaryDto } from "~/features/wallet/api/wallet.mapper";
import type { WalletSummary } from "~/features/wallet/model/wallet";

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
}

/**
 * Resolves the canonical wallet API client using the shared HTTP layer.
 *
 * @returns WalletClient instance bound to the application HTTP adapter.
 */
export const useWalletClient = (): WalletClient => {
  return new WalletClient(useHttp());
};
