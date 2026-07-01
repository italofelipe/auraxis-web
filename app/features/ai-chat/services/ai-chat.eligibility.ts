/**
 * Pure eligibility rules for the AI financial chat.
 *
 * The chat is a Premium-only surface. Keeping the check pure (no Vue, no fetch)
 * makes it trivially testable and reusable across the composable and any future
 * entry point.
 */

import type { Subscription } from "~/features/subscription/model/subscription";

/** Subscription statuses that grant access to Premium-only surfaces. */
const PREMIUM_STATUSES: ReadonlySet<Subscription["status"]> = new Set<Subscription["status"]>([
  "active",
  "trialing",
]);

/**
 * Whether the given subscription grants Premium access to the chat.
 *
 * @param subscription The user's subscription, or null when unknown/unloaded.
 * @returns True when the subscription is in an access-granting status.
 */
export const isPremiumSubscription = (subscription: Subscription | null): boolean => {
  return subscription !== null && PREMIUM_STATUSES.has(subscription.status);
};
