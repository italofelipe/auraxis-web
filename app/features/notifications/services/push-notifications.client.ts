import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type { PushSubscriptionPayloadDto } from "~/features/notifications/contracts/push-subscription.dto";

/**
 * HTTP client for the Web Push subscription endpoints.
 *
 * Encapsulates the `/notifications/subscribe` REST surface so feature code
 * never touches axios directly. Endpoints mirror the backend contract and
 * intentionally do not swallow errors — callers decide whether to surface
 * a toast or fall back silently.
 */
export class PushNotificationsClient {
  readonly #http: AxiosInstance;

  /**
   * @param http - Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Registers the browser's push subscription with the backend so the
   * backend can dispatch reminders via Web Push.
   *
   * @param payload - Serialised PushSubscription payload (endpoint + keys).
   */
  async subscribe(payload: PushSubscriptionPayloadDto): Promise<void> {
    await this.#http.post("/notifications/subscribe", payload);
  }

  /**
   * Removes the browser's push subscription on the backend. Typically
   * called after the user toggles push notifications off or revokes
   * the permission at the browser level.
   *
   * @param endpoint - Push endpoint previously registered with the backend.
   */
  async unsubscribe(endpoint: string): Promise<void> {
    await this.#http.post("/notifications/unsubscribe", { endpoint });
  }
}

/**
 * Resolves a PushNotificationsClient using the shared HTTP layer.
 *
 * @returns PushNotificationsClient bound to the application HTTP adapter.
 */
export const usePushNotificationsClient = (): PushNotificationsClient => {
  return new PushNotificationsClient(useHttp());
};
