/**
 * Data Transfer Objects for the subscription feature.
 *
 * These types represent the raw API contract (snake_case) returned by
 * the Auraxis backend. They are mapped to the view model before reaching
 * UI components.
 */

export type SubscriptionStatusDto = "active" | "trialing" | "past_due" | "canceled";

export interface SubscriptionDto {
  readonly id: string;
  readonly plan_slug: string;
  readonly status: SubscriptionStatusDto;
  readonly trial_ends_at: string | null;
  readonly current_period_end: string | null;
  readonly provider: string | null;
  readonly provider_subscription_id: string | null;
}

export interface CheckoutResponseDto {
  readonly checkout_url: string;
}
