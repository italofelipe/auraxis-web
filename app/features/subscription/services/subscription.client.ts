import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  BillingCycle,
  CheckoutResponseDto,
  ApiSubscriptionDto,
} from "~/features/subscription/contracts/subscription.dto";
import { mapSubscriptionDto } from "~/features/subscription/services/subscription.mapper";
import type { Subscription } from "~/features/subscription/model/subscription";

interface SubscriptionDataEnvelopeDto {
  readonly subscription?: ApiSubscriptionDto | null;
}

interface V2EnvelopeDto<T> {
  readonly success?: boolean;
  readonly message?: string;
  readonly data?: T | null;
}

type SubscriptionResponseDto =
  | ApiSubscriptionDto
  | V2EnvelopeDto<ApiSubscriptionDto | SubscriptionDataEnvelopeDto>;

type CheckoutResponseBodyDto =
  | CheckoutResponseDto
  | V2EnvelopeDto<CheckoutResponseDto>;

/**
 * Narrows unknown payloads to plain object-like records.
 *
 * @param value Candidate value.
 * @returns True when the value can be inspected as a record.
 */
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object";
};

/**
 * Extracts the subscription DTO from the v2 envelope while keeping legacy
 * flat payload compatibility.
 *
 * @param payload Subscription endpoint response body.
 * @returns Raw subscription DTO.
 */
const unwrapSubscription = (
  payload: SubscriptionResponseDto,
): ApiSubscriptionDto => {
  if (isRecord(payload) && "data" in payload) {
    const data = payload.data;

    if (isRecord(data) && "subscription" in data && isRecord(data.subscription)) {
      return data.subscription as unknown as ApiSubscriptionDto;
    }

    if (isRecord(data)) {
      return data as unknown as ApiSubscriptionDto;
    }
  }

  return payload as ApiSubscriptionDto;
};

/**
 * Extracts the checkout DTO from the v2 envelope while keeping legacy payloads.
 *
 * @param payload Checkout endpoint response body.
 * @returns Raw checkout DTO.
 */
const unwrapCheckout = (payload: CheckoutResponseBodyDto): CheckoutResponseDto => {
  if (isRecord(payload) && "data" in payload && isRecord(payload.data)) {
    return payload.data as unknown as CheckoutResponseDto;
  }

  return payload as CheckoutResponseDto;
};

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
    const response = await this.#http.get<SubscriptionResponseDto>("/subscriptions/me");
    return mapSubscriptionDto(unwrapSubscription(response.data));
  }

  /**
   * Initiates a checkout session for the given plan and billing cycle.
   *
   * @param planSlug - Identifier of the plan to subscribe to.
   * @param billingCycle - Whether the user is paying monthly or annually.
   * @returns Checkout URL to redirect the user to.
   */
  async createCheckout(planSlug: string, billingCycle: BillingCycle = "monthly"): Promise<string> {
    const response = await this.#http.post<CheckoutResponseBodyDto>("/subscriptions/checkout", {
      plan_slug: planSlug,
      billing_cycle: billingCycle,
    });
    return unwrapCheckout(response.data).checkout_url;
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
