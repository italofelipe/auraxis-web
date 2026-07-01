import { describe, expect, it } from "vitest";

import type { Subscription } from "~/features/subscription/model/subscription";

import { isPremiumSubscription } from "./ai-chat.eligibility";

/**
 * Builds a Subscription fixture overriding only the status under test.
 *
 * @param status Subscription status to set.
 * @returns A complete Subscription fixture.
 */
const buildSubscription = (status: Subscription["status"]): Subscription => ({
  id: "sub-1",
  planSlug: "premium",
  status,
  trialEndsAt: null,
  currentPeriodEnd: null,
  provider: null,
  providerSubscriptionId: null,
});

describe("isPremiumSubscription", () => {
  it("grants access for an active subscription", () => {
    expect(isPremiumSubscription(buildSubscription("active"))).toBe(true);
  });

  it("grants access for a trialing subscription", () => {
    expect(isPremiumSubscription(buildSubscription("trialing"))).toBe(true);
  });

  it("denies access for past_due and canceled subscriptions", () => {
    expect(isPremiumSubscription(buildSubscription("past_due"))).toBe(false);
    expect(isPremiumSubscription(buildSubscription("canceled"))).toBe(false);
  });

  it("denies access when the subscription is unknown", () => {
    expect(isPremiumSubscription(null)).toBe(false);
  });
});
