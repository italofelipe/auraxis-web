import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type { FeatureKey } from "~/features/paywall/model/entitlement";

interface EntitlementCheckDto {
  readonly active?: boolean;
  readonly has_access?: boolean;
}

interface EntitlementCheckEnvelopeDto {
  readonly success?: boolean;
  readonly message?: string;
  readonly data?: EntitlementCheckDto | null;
}

type EntitlementCheckResponseDto = EntitlementCheckDto | EntitlementCheckEnvelopeDto;

/**
 * Detects the standard v2 response envelope used by the backend.
 *
 * @param payload Entitlement check response body.
 * @returns True when the payload wraps data inside `data`.
 */
const isEntitlementEnvelope = (
  payload: EntitlementCheckResponseDto,
): payload is EntitlementCheckEnvelopeDto => {
  return (
    payload !== null &&
    typeof payload === "object" &&
    "data" in payload
  );
};

/**
 * Extracts the entitlement payload while preserving legacy flat responses.
 *
 * @param payload Entitlement check response body.
 * @returns Flat entitlement payload.
 */
const unwrapEntitlementCheck = (
  payload: EntitlementCheckResponseDto,
): EntitlementCheckDto => {
  if (isEntitlementEnvelope(payload)) {
    return payload.data ?? {};
  }

  return payload;
};

/**
 * Converts backend entitlement fields into the boolean consumed by UI gates.
 *
 * @param payload Flat entitlement payload.
 * @returns True when the feature is available to the current user.
 */
const toAccessBoolean = (payload: EntitlementCheckDto): boolean => {
  if (typeof payload.active === "boolean") {
    return payload.active;
  }

  return payload.has_access === true;
};

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
    const response = await this.#http.get<EntitlementCheckResponseDto>(
      "/entitlements/check",
      { params: { feature_key: featureKey } },
    );

    return toAccessBoolean(unwrapEntitlementCheck(response.data));
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
