/**
 * Data Transfer Objects for the subscription feature.
 *
 * These types represent the raw API contract (snake_case) returned by
 * the Auraxis backend. They are mapped to the view model before reaching
 * UI components.
 *
 * The first section preserves the original API-bound DTOs used by the
 * existing subscription.client and subscription.mapper.
 * The second section adds the extended view-layer types used by the
 * PlanCard component and the subscription page.
 */

// ── Original API-bound DTOs (used by subscription.client + subscription.mapper) ──

export type SubscriptionStatusDto = "active" | "trialing" | "past_due" | "canceled";

/** @deprecated Use SubscriptionDto (view-layer) for page/component usage. */
export interface ApiSubscriptionDto {
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

// ── View-layer DTOs (used by PlanCard, subscription page, mocks) ──

export type PlanSlug = "free" | "starter" | "pro" | "premium";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "none";

export type PlanFeature = {
  readonly label: string;
  readonly included: boolean;
};

export type PlanDto = {
  readonly slug: PlanSlug;
  readonly name: string;
  readonly price_monthly: number;
  readonly features: PlanFeature[];
};

export type SubscriptionDto = {
  readonly status: SubscriptionStatus;
  readonly plan: PlanDto;
  readonly current_period_end: string | null;
  readonly cancel_at_period_end: boolean;
};
