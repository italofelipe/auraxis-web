import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import SubscriptionBadge from "./SubscriptionBadge.vue";
import type { SubscriptionStatus } from "~/features/subscription/model/subscription";

describe("SubscriptionBadge", () => {
  it("renders 'Ativo' label for active status", () => {
    const wrapper = mount(SubscriptionBadge, {
      props: { status: "active" as SubscriptionStatus },
    });

    const tag = wrapper.find(".n-tag");
    expect(tag.exists()).toBe(true);
    expect(tag.text()).toContain("Ativo");
  });

  it("renders 'Trial' label for trialing status", () => {
    const wrapper = mount(SubscriptionBadge, {
      props: { status: "trialing" as SubscriptionStatus },
    });

    const tag = wrapper.find(".n-tag");
    expect(tag.exists()).toBe(true);
    expect(tag.text()).toContain("Trial");
  });

  it("renders 'Vencido' label for past_due status", () => {
    const wrapper = mount(SubscriptionBadge, {
      props: { status: "past_due" as SubscriptionStatus },
    });

    const tag = wrapper.find(".n-tag");
    expect(tag.exists()).toBe(true);
    expect(tag.text()).toContain("Vencido");
  });

  it("renders 'Cancelado' label for canceled status", () => {
    const wrapper = mount(SubscriptionBadge, {
      props: { status: "canceled" as SubscriptionStatus },
    });

    const tag = wrapper.find(".n-tag");
    expect(tag.exists()).toBe(true);
    expect(tag.text()).toContain("Cancelado");
  });
});
