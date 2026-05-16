import { describe, expect, it } from "vitest";

import { mapSubscriptionDto } from "./subscription.mapper";

describe("mapSubscriptionDto", () => {
  it("maps the current backend plan_code field into planSlug", () => {
    expect(
      mapSubscriptionDto({
        id: "sub-1",
        plan_code: "premium",
        status: "active",
        trial_ends_at: null,
        current_period_end: "2036-05-16T17:08:02.072692",
        provider: "manual_override",
        provider_subscription_id: null,
      }),
    ).toMatchObject({
      id: "sub-1",
      planSlug: "premium",
      status: "active",
      provider: "manual_override",
    });
  });

  it("normalizes free backend status for existing UI badges", () => {
    expect(
      mapSubscriptionDto({
        id: "sub-free",
        plan_code: "free",
        status: "free",
        trial_ends_at: null,
        current_period_end: null,
        provider: null,
        provider_subscription_id: null,
      }),
    ).toMatchObject({
      planSlug: "free",
      status: "active",
    });
  });
});
