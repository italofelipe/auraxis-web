import { ref } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PaywallGate from "./PaywallGate.vue";

const useEntitlementQueryMock = vi.hoisted(() => vi.fn());
const useFeatureFlagMock = vi.hoisted(() => vi.fn());

vi.mock("~/features/paywall/queries/use-entitlement-query", () => ({
  useEntitlementQuery: useEntitlementQueryMock,
}));

vi.mock("~/shared/feature-flags", () => ({
  useFeatureFlag: useFeatureFlagMock,
}));

const stubs = {};

const defaultSlotContent = "<span class='default-slot'>Feature content</span>";
const lockedSlotContent = "<span class='locked-slot'>Upgrade required</span>";

describe("PaywallGate", () => {
  beforeEach(() => {
    useFeatureFlagMock.mockReturnValue(ref(true));
  });

  it("renders default slot without gating when the paywall kill-switch is off", () => {
    useFeatureFlagMock.mockReturnValue(ref(false));
    useEntitlementQueryMock.mockReturnValue({
      isLoading: ref(false),
      data: ref(false),
    });

    const wrapper = mount(PaywallGate, {
      props: { feature: "advanced_simulations" },
      slots: {
        default: defaultSlotContent,
        locked: lockedSlotContent,
      },
      global: { stubs },
    });

    expect(wrapper.find(".default-slot").exists()).toBe(true);
    expect(wrapper.find(".locked-slot").exists()).toBe(false);
    expect(wrapper.find("[data-testid='base-skeleton']").exists()).toBe(false);
  });

  it("renders skeleton when isLoading is true", () => {
    useEntitlementQueryMock.mockReturnValue({
      isLoading: ref(true),
      data: ref(undefined),
    });

    const wrapper = mount(PaywallGate, {
      props: { feature: "advanced_simulations" },
      slots: {
        default: defaultSlotContent,
        locked: lockedSlotContent,
      },
      global: { stubs },
    });

    expect(wrapper.find("[data-testid='base-skeleton']").exists()).toBe(true);
    expect(wrapper.find(".default-slot").exists()).toBe(false);
    expect(wrapper.find(".locked-slot").exists()).toBe(false);
  });

  it("renders default slot when has_access is true", () => {
    useEntitlementQueryMock.mockReturnValue({
      isLoading: ref(false),
      data: ref(true),
    });

    const wrapper = mount(PaywallGate, {
      props: { feature: "advanced_simulations" },
      slots: {
        default: defaultSlotContent,
        locked: lockedSlotContent,
      },
      global: { stubs },
    });

    expect(wrapper.find(".default-slot").exists()).toBe(true);
    expect(wrapper.find(".locked-slot").exists()).toBe(false);
    expect(wrapper.find("[data-testid='base-skeleton']").exists()).toBe(false);
  });

  it("renders locked slot when has_access is false", () => {
    useEntitlementQueryMock.mockReturnValue({
      isLoading: ref(false),
      data: ref(false),
    });

    const wrapper = mount(PaywallGate, {
      props: { feature: "advanced_simulations" },
      slots: {
        default: defaultSlotContent,
        locked: lockedSlotContent,
      },
      global: { stubs },
    });

    expect(wrapper.find(".locked-slot").exists()).toBe(true);
    expect(wrapper.find(".default-slot").exists()).toBe(false);
    expect(wrapper.find("[data-testid='base-skeleton']").exists()).toBe(false);
  });

  it("renders locked slot when data is undefined (not yet resolved)", () => {
    useEntitlementQueryMock.mockReturnValue({
      isLoading: ref(false),
      data: ref(undefined),
    });

    const wrapper = mount(PaywallGate, {
      props: { feature: "export_pdf" },
      slots: {
        default: defaultSlotContent,
        locked: lockedSlotContent,
      },
      global: { stubs },
    });

    expect(wrapper.find(".locked-slot").exists()).toBe(true);
    expect(wrapper.find(".default-slot").exists()).toBe(false);
  });

  it("renders the default upgrade prompt when no locked slot is provided", () => {
    useEntitlementQueryMock.mockReturnValue({
      isLoading: ref(false),
      data: ref(false),
    });

    const wrapper = mount(PaywallGate, {
      props: { feature: "shared_entries" },
      slots: {
        default: defaultSlotContent,
      },
      global: {
        stubs: {
          UiUpgradePrompt: {
            template: "<div data-testid='upgrade-prompt' />",
          },
        },
      },
    });

    expect(wrapper.find("[data-testid='upgrade-prompt']").exists()).toBe(true);
    expect(wrapper.find(".default-slot").exists()).toBe(false);
  });
});
