import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type { FeatureKey } from "~/features/paywall/model/entitlement";

interface EntitlementCheckDto {
  has_access: boolean;
}

/**
 * API client for the entitlements feature.
 *
 * Encapsulates all HTTP calls to the `/entitlements` endpoints.
 */
export class EntitlementClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Checks whether the authenticated user has access to the given feature.
   *
   * @param featureKey The feature key to check.
   * @returns True when the user has access to the feature.
   */
  async checkEntitlement(featureKey: FeatureKey): Promise<boolean> {
    const response = await this.#http.get<EntitlementCheckDto>(
      "/entitlements/check",
      { params: { feature_key: featureKey } },
    );
    return response.data.has_access;
  }
}

/**
 * Resolves the canonical entitlement API client using the shared HTTP layer.
 *
 * @returns EntitlementClient instance bound to the application HTTP adapter.
 */
export const useEntitlementClient = (): EntitlementClient => {
  return new EntitlementClient(useHttp());
};
