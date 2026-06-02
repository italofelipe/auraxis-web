import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type { V2EnvelopeDTO } from "~/features/ai-insights/contracts/ai-insight";
import type { NotificationPreferencesResponseDto } from "~/features/notifications/contracts/notification-preferences.dto";
import {
  mapPreferencesResponse,
  toPreferencePayload,
  type NotificationPreference,
} from "~/features/notifications/model/notification-preferences";

/**
 * Unwraps the v2 envelope, tolerating legacy flat payloads.
 *
 * @param payload Backend response body.
 * @returns The inner payload.
 */
const unwrap = <T>(payload: V2EnvelopeDTO<T> | T): T => {
  if (
    payload !== null &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as V2EnvelopeDTO<T>).data !== undefined
  ) {
    return (payload as V2EnvelopeDTO<T>).data as T;
  }
  return payload as T;
};

const ENDPOINT = "/user/notification-preferences";

/**
 * HTTP adapter for user notification preferences.
 */
export class NotificationPreferencesApiClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance configured with auth and API contract headers.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Lists the authenticated user's notification preferences.
   *
   * @returns Domain preferences.
   */
  async getPreferences(): Promise<NotificationPreference[]> {
    const response = await this.#http.get<V2EnvelopeDTO<NotificationPreferencesResponseDto>>(
      ENDPOINT,
    );
    return mapPreferencesResponse(unwrap<NotificationPreferencesResponseDto>(response.data));
  }

  /**
   * Upserts a batch of notification preferences.
   *
   * @param preferences Domain preferences to persist.
   * @returns The persisted domain preferences.
   */
  async updatePreferences(
    preferences: readonly NotificationPreference[],
  ): Promise<NotificationPreference[]> {
    const response = await this.#http.patch<V2EnvelopeDTO<NotificationPreferencesResponseDto>>(
      ENDPOINT,
      { preferences: preferences.map(toPreferencePayload) },
    );
    return mapPreferencesResponse(unwrap<NotificationPreferencesResponseDto>(response.data));
  }
}

/**
 * Factory wiring the preferences client to the default HTTP composable.
 *
 * @returns Ready-to-use client instance.
 */
export const useNotificationPreferencesApiClient = (): NotificationPreferencesApiClient => {
  return new NotificationPreferencesApiClient(useHttp());
};
