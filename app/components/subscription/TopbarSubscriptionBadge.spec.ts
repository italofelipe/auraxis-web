import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";

import TopbarSubscriptionBadge from "./TopbarSubscriptionBadge.vue";
import PremiumBadge from "~/components/paywall/PremiumBadge.vue";
import type { Subscription } from "~/features/subscription/model/subscription";

const subscriptionRef = ref<Subscription | undefined>(undefined);

vi.mock("~/features/subscription/queries/use-subscription-query", () => ({
  /**
   * Mock implementation returning the shared reactive subscription ref.
   *
   * @returns Object shaped like Vue Query result with only the `data` field.
   */
  useSubscriptionQuery: (): { data: typeof subscriptionRef } => ({ data: subscriptionRef }),
}));

/**
 * Builds a Subscription fixture with sensible defaults.
 *
 * @param overrides - Fields to override on the default subscription.
 * @returns A Subscription view model.
 */
const makeSub = (overrides: Partial<Subscription>): Subscription => ({
  id: "sub-1",
  planSlug: "premium",
  status: "active",
  trialEndsAt: null,
  currentPeriodEnd: null,
  provider: null,
  providerSubscriptionId: null,
  ...overrides,
});

describe("TopbarSubscriptionBadge", () => {
  it("renders PremiumBadge for active premium subscription", () => {
    subscriptionRef.value = makeSub({ planSlug: "premium", status: "active" });
    const wrapper = mount(TopbarSubscriptionBadge, {
      global: { stubs: { PremiumBadge: true } },
    });
    expect(wrapper.findComponent(PremiumBadge).exists()).toBe(true);
  });

  it("renders PremiumBadge for trialing premium subscription", () => {
    subscriptionRef.value = makeSub({ planSlug: "premium", status: "trialing" });
    const wrapper = mount(TopbarSubscriptionBadge, {
      global: { stubs: { PremiumBadge: true } },
    });
    expect(wrapper.findComponent(PremiumBadge).exists()).toBe(true);
  });

  it("also accepts legacy 'pro' plan slug", () => {
    subscriptionRef.value = makeSub({ planSlug: "pro", status: "active" });
    const wrapper = mount(TopbarSubscriptionBadge, {
      global: { stubs: { PremiumBadge: true } },
    });
    expect(wrapper.findComponent(PremiumBadge).exists()).toBe(true);
  });

  it("hides badge for canceled premium subscription", () => {
    subscriptionRef.value = makeSub({ planSlug: "premium", status: "canceled" });
    const wrapper = mount(TopbarSubscriptionBadge, {
      global: { stubs: { PremiumBadge: true } },
    });
    expect(wrapper.findComponent(PremiumBadge).exists()).toBe(false);
  });

  it("hides badge for past_due subscription", () => {
    subscriptionRef.value = makeSub({ planSlug: "premium", status: "past_due" });
    const wrapper = mount(TopbarSubscriptionBadge, {
      global: { stubs: { PremiumBadge: true } },
    });
    expect(wrapper.findComponent(PremiumBadge).exists()).toBe(false);
  });

  it("hides badge for free plan", () => {
    subscriptionRef.value = makeSub({ planSlug: "free", status: "active" });
    const wrapper = mount(TopbarSubscriptionBadge, {
      global: { stubs: { PremiumBadge: true } },
    });
    expect(wrapper.findComponent(PremiumBadge).exists()).toBe(false);
  });

  it("hides badge when subscription data is not yet available", () => {
    subscriptionRef.value = undefined;
    const wrapper = mount(TopbarSubscriptionBadge, {
      global: { stubs: { PremiumBadge: true } },
    });
    expect(wrapper.findComponent(PremiumBadge).exists()).toBe(false);
  });
});
