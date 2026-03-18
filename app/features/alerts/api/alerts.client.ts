import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type { AlertDto, AlertPreferenceDto } from "~/features/alerts/contracts/alerts.dto";
import { mapAlertDto, mapAlertPreferenceDto } from "~/features/alerts/api/alerts.mapper";
import type {
  AlertPreference,
  AlertsPage,
  UpdateAlertPreferencePayload,
} from "~/features/alerts/model/alerts";

/**
 * API client for the alerts feature.
 *
 * Encapsulates all HTTP calls to the `/alerts` endpoints and returns
 * mapped view-model types ready for UI consumption.
 */
export class AlertsClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Fetches the list of alerts for the authenticated user.
   *
   * @returns Mapped alerts page view model.
   */
  async getAlerts(): Promise<AlertsPage> {
    const response = await this.#http.get<{ items: AlertDto[]; total: number }>("/alerts");
    return {
      items: response.data.items.map(mapAlertDto),
      total: response.data.total,
    };
  }

  /**
   * Marks a single alert as read.
   *
   * @param id Alert identifier.
   */
  async markRead(id: string): Promise<void> {
    await this.#http.post(`/alerts/${id}/read`);
  }

  /**
   * Deletes a single alert.
   *
   * @param id Alert identifier.
   */
  async deleteAlert(id: string): Promise<void> {
    await this.#http.delete(`/alerts/${id}`);
  }

  /**
   * Fetches alert preferences for the authenticated user.
   *
   * @returns Array of mapped AlertPreference view models.
   */
  async getPreferences(): Promise<AlertPreference[]> {
    const response = await this.#http.get<AlertPreferenceDto[]>("/alerts/preferences");
    return response.data.map(mapAlertPreferenceDto);
  }

  /**
   * Updates the preference for a given alert category.
   *
   * @param category Alert category identifier.
   * @param payload Updated enabled state and channels.
   * @returns Updated AlertPreference view model.
   */
  async updatePreference(
    category: string,
    payload: UpdateAlertPreferencePayload,
  ): Promise<AlertPreference> {
    const response = await this.#http.put<AlertPreferenceDto>(
      `/alerts/preferences/${category}`,
      payload,
    );
    return mapAlertPreferenceDto(response.data);
  }
}

/**
 * Resolves the canonical alerts API client using the shared HTTP layer.
 *
 * @returns AlertsClient instance bound to the application HTTP adapter.
 */
export const useAlertsClient = (): AlertsClient => {
  return new AlertsClient(useHttp());
};
