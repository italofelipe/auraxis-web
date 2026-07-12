import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  PrivacyConsentListDto,
  PrivacyDataExportPackageDto,
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
   * Fetches the full LGPD portability package for the authenticated user.
   *
   * Aligned with the published API contract `GET /user/me/export` (#1119) —
   * the previous `POST /me/data-export` endpoint never existed in the API.
   *
   * @returns Complete LGPD export package (entities + retentions).
   */
  async requestDataExport(): Promise<PrivacyDataExportPackageDto> {
    const response = await this.#http.get<V2EnvelopeDto<PrivacyDataExportPackageDto>>(
      "/user/me/export",
    );
    return unwrap<PrivacyDataExportPackageDto>(response.data);
  }
}

/**
 * Resolves the canonical privacy-center client.
 *
 * @returns Privacy center API client bound to the shared HTTP layer.
 */
export const usePrivacyCenterClient = (): PrivacyCenterClient =>
  new PrivacyCenterClient(useHttp());
