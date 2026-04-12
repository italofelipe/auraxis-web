import { ref } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import UiPaywallGate from "./UiPaywallGate.vue";

const useEntitlementQueryMock = vi.hoisted(() => vi.fn());

vi.mock("~/features/paywall/queries/use-entitlement-query", () => ({
  useEntitlementQuery: useEntitlementQueryMock,
}));

const stubs = {};

const defaultSlotContent = "<span class='default-slot'>Feature content</span>";
const lockedSlotContent = "<span class='locked-slot'>Upgrade required</span>";

describe("UiPaywallGate", () => {
  it("renders skeleton when isLoading is true", () => {
    useEntitlementQueryMock.mockReturnValue({
      isLoading: ref(true),
      data: ref(undefined),
    });

    const wrapper = mount(UiPaywallGate, {
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

    const wrapper = mount(UiPaywallGate, {
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

    const wrapper = mount(UiPaywallGate, {
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

    const wrapper = mount(UiPaywallGate, {
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

  it("renders the gate wrapper element", () => {
    useEntitlementQueryMock.mockReturnValue({
      isLoading: ref(false),
      data: ref(false),
    });

    const wrapper = mount(UiPaywallGate, {
      props: { feature: "shared_entries" },
      slots: {
        default: defaultSlotContent,
        locked: lockedSlotContent,
      },
      global: { stubs },
    });

    expect(wrapper.find(".ui-paywall-gate").exists()).toBe(true);
  });
});
