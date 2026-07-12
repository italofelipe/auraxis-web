import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  PrivacyConsentListDto,
  PrivacyDataExportDto,
  PrivacyDeletionRequestDto,
  PrivacyDeletionRequestPayload,
  V2EnvelopeDto,
} from "~/features/privacy/contracts/privacy-center.dto";

/**
 * Extracts data from v2 API envelopes while tolerating flat legacy payloads.
 *
 * @param payload Response payload from Axios.
 * @returns Unwrapped data.
 */
const unwrap = <T>(payload: V2EnvelopeDto<T> | T): T => {
  if (
    payload !== null &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as V2EnvelopeDto<T>).data !== undefined
  ) {
    return (payload as V2EnvelopeDto<T>).data;
  }

  return payload as T;
};

/**
 * HTTP adapter for LGPD privacy-center operations.
 */
export class PrivacyCenterClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance configured with auth and API contract headers.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Loads the authenticated user's latest consent records.
   *
   * @returns Consent list payload.
   */
  async listConsents(): Promise<PrivacyConsentListDto> {
    const response = await this.#http.get<V2EnvelopeDto<PrivacyConsentListDto>>("/me/consents");
    return unwrap<PrivacyConsentListDto>(response.data);
  }

  /**
   * Records a versioned consent grant for the authenticated user (#1118).
   *
   * @param input Consent kind and the document version being accepted.
   * @param input.kind
   * @param input.version
   */
  async recordConsent(input: { kind: "terms" | "privacy"; version: string }): Promise<void> {
    await this.#http.post("/me/consents", {
      kind: input.kind,
      version: input.version,
      action: "granted",
      source: "web",
    });
  }

  /**
   * Requests a portable data package for the authenticated user.
   *
   * Endpoint is intentionally isolated behind the privacy-center feature flag
   * until the API task publishes the contract in production.
   *
   * @returns Data export request payload.
   */
  async requestDataExport(): Promise<PrivacyDataExportDto> {
    const response = await this.#http.post<V2EnvelopeDto<PrivacyDataExportDto>>(
      "/me/data-export",
      { format: "json" },
    );
    return unwrap<PrivacyDataExportDto>(response.data);
  }

  /**
   * Requests account deletion/anonymisation with password confirmation.
   *
   * @param payload Password confirmation and optional user reason.
   * @returns Deletion request payload.
   */
  async requestDeletion(
    payload: PrivacyDeletionRequestPayload,
  ): Promise<PrivacyDeletionRequestDto> {
    const response = await this.#http.post<V2EnvelopeDto<PrivacyDeletionRequestDto>>(
      "/me/deletion-requests",
      payload,
    );
    return unwrap<PrivacyDeletionRequestDto>(response.data);
  }
}

/**
 * Resolves the canonical privacy-center client.
 *
 * @returns Privacy center API client bound to the shared HTTP layer.
 */
export const usePrivacyCenterClient = (): PrivacyCenterClient =>
  new PrivacyCenterClient(useHttp());
