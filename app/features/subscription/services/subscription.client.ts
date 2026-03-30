import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  BillingCycle,
  CheckoutResponseDto,
  ApiSubscriptionDto,
} from "~/features/subscription/contracts/subscription.dto";
import { mapSubscriptionDto } from "~/features/subscription/services/subscription.mapper";
import type { Subscription } from "~/features/subscription/model/subscription";

/**
 * API client for the subscription feature.
 *
 * Encapsulates all HTTP calls to the `/subscriptions` endpoints and returns
 * mapped view-model types ready for UI consumption.
 */
export class SubscriptionClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Fetches the subscription details for the authenticated user.
   *
   * @returns Mapped subscription view model.
   */
  async getMySubscription(): Promise<Subscription> {
    const response = await this.#http.get<ApiSubscriptionDto>("/subscriptions/me");
    return mapSubscriptionDto(response.data);
  }

  /**
   * Initiates a checkout session for the given plan and billing cycle.
   *
   * @param planSlug - Identifier of the plan to subscribe to.
   * @param billingCycle - Whether the user is paying monthly or annually.
   * @returns Checkout URL to redirect the user to.
   */
  async createCheckout(planSlug: string, billingCycle: BillingCycle = "monthly"): Promise<string> {
    const response = await this.#http.post<CheckoutResponseDto>("/subscriptions/checkout", {
      plan_slug: planSlug,
      billing_cycle: billingCycle,
    });
    return response.data.checkout_url;
  }

  /**
   * Cancels the authenticated user's active subscription.
   *
   * @returns Void on success.
   */
  async cancelSubscription(): Promise<void> {
    await this.#http.post("/subscriptions/cancel");
  }
}

/**
 * Resolves the canonical subscription API client using the shared HTTP layer.
 *
 * @returns SubscriptionClient instance bound to the application HTTP adapter.
 */
export const useSubscriptionClient = (): SubscriptionClient => {
  return new SubscriptionClient(useHttp());
};
