/**
 * View-model types for the subscription feature.
 *
 * These camelCase domain types are used by all UI components and composables.
 * They are derived from the raw API DTOs via `subscription.mapper.ts`.
 */

export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled";

export interface Subscription {
  readonly id: string;
  readonly planSlug: string;
  readonly status: SubscriptionStatus;
  readonly trialEndsAt: string | null;
  readonly currentPeriodEnd: string | null;
  readonly provider: string | null;
  readonly providerSubscriptionId: string | null;
}
