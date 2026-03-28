import { describe, expect, it } from "vitest";

import SubscriptionBadge from "./SubscriptionBadge.vue";
import type { SubscriptionStatus } from "~/features/subscription/model/subscription";
import { renderWithProviders } from "~/test-utils";

describe("SubscriptionBadge", () => {
  it("renders 'Ativo' label for active status", () => {
    const wrapper = renderWithProviders(SubscriptionBadge, {
      props: { status: "active" as SubscriptionStatus },
    });

    const tag = wrapper.find(".n-tag");
    expect(tag.exists()).toBe(true);
    expect(tag.text()).toContain("Ativo");
  });

  it("renders 'Trial' label for trialing status", () => {
    const wrapper = renderWithProviders(SubscriptionBadge, {
      props: { status: "trialing" as SubscriptionStatus },
    });

    const tag = wrapper.find(".n-tag");
    expect(tag.exists()).toBe(true);
    expect(tag.text()).toContain("Trial");
  });

  it("renders 'Vencido' label for past_due status", () => {
    const wrapper = renderWithProviders(SubscriptionBadge, {
      props: { status: "past_due" as SubscriptionStatus },
    });

    const tag = wrapper.find(".n-tag");
    expect(tag.exists()).toBe(true);
    expect(tag.text()).toContain("Vencido");
  });

  it("renders 'Cancelado' label for canceled status", () => {
    const wrapper = renderWithProviders(SubscriptionBadge, {
      props: { status: "canceled" as SubscriptionStatus },
    });

    const tag = wrapper.find(".n-tag");
    expect(tag.exists()).toBe(true);
    expect(tag.text()).toContain("Cancelado");
  });
});
