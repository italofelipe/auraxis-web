import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import { NTag, NButton, NSkeleton } from "naive-ui";

import PlanCard from "./PlanCard.vue";
import type { PlanDto } from "../../contracts/subscription.dto";

// ── Fixtures ─────────────────────────────────────────────────────────────────

/**
 * Creates a minimal valid PlanDto for testing.
 *
 * @param overrides - Partial properties to override defaults.
 * @returns A complete PlanDto fixture.
 */
const makePlan = (overrides: Partial<PlanDto> = {}): PlanDto => ({
  slug: "starter",
  name: "Starter",
  price_monthly: 29.9,
  features: [
    { label: "Até 200 transações/mês", included: true },
    { label: "Simulações financeiras", included: false },
  ],
  ...overrides,
});

/**
 * Mounts PlanCard with real Naive UI rendering.
 *
 * @param plan - Plan data to render.
 * @param isCurrent - Whether this is the user's current plan.
 * @param loading - Optional loading state.
 * @returns VueWrapper around the mounted component.
 */
function mountPlanCard(
  plan: PlanDto,
  isCurrent = false,
  loading = false,
): ReturnType<typeof mount> {
  return mount(PlanCard, {
    props: { plan, isCurrent, loading },
    global: {
      stubs: {
        CheckIcon: { template: "<span data-testid='check-icon' />" },
        XIcon: { template: "<span data-testid='x-icon' />" },
      },
    },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PlanCard", () => {
  it("renders the plan name", () => {
    const wrapper = mountPlanCard(makePlan({ name: "Pro" }));
    expect(wrapper.text()).toContain("Pro");
  });

  it("shows 'Plano atual' NTag when isCurrent is true", () => {
    const wrapper = mountPlanCard(makePlan(), true);
    const tag = wrapper.findComponent(NTag);
    expect(tag.exists()).toBe(true);
    expect(wrapper.text()).toContain("Plano atual");
  });

  it("does not show NTag when isCurrent is false", () => {
    const wrapper = mountPlanCard(makePlan(), false);
    expect(wrapper.findComponent(NTag).exists()).toBe(false);
  });

  it("disables the subscribe button when isCurrent is true", () => {
    const wrapper = mountPlanCard(makePlan(), true);
    const button = wrapper.findComponent(NButton);
    expect(button.props("disabled")).toBe(true);
  });

  it("enables the subscribe button when isCurrent is false", () => {
    const wrapper = mountPlanCard(makePlan(), false);
    const button = wrapper.findComponent(NButton);
    expect(button.props("disabled")).toBe(false);
  });

  it("renders included features in the list", () => {
    const wrapper = mountPlanCard(makePlan({
      features: [{ label: "Relatórios avançados", included: true }],
    }));
    expect(wrapper.text()).toContain("Relatórios avançados");
  });

  it("renders excluded features in the list", () => {
    const wrapper = mountPlanCard(makePlan({
      features: [{ label: "Suporte prioritário", included: false }],
    }));
    expect(wrapper.text()).toContain("Suporte prioritário");
  });

  it("emits 'select' with plan slug when subscribe button is clicked (not current)", async () => {
    const wrapper = mountPlanCard(makePlan({ slug: "pro" }), false);
    await wrapper.findComponent(NButton).trigger("click");
    expect(wrapper.emitted("select")).toBeTruthy();
    expect(wrapper.emitted("select")![0]).toEqual(["pro"]);
  });

  it("does not emit 'select' when button is clicked on current plan", async () => {
    const wrapper = mountPlanCard(makePlan(), true);
    await wrapper.findComponent(NButton).trigger("click");
    expect(wrapper.emitted("select")).toBeFalsy();
  });

  it("shows 'Grátis' when price_monthly is 0", () => {
    const wrapper = mountPlanCard(makePlan({ price_monthly: 0 }));
    expect(wrapper.text()).toContain("Grátis");
  });

  it("shows skeleton elements when loading is true", () => {
    const wrapper = mountPlanCard(makePlan(), false, true);
    expect(wrapper.findAllComponents(NSkeleton).length).toBeGreaterThan(0);
  });

  it("hides plan name when loading is true", () => {
    const wrapper = mountPlanCard(makePlan({ name: "HiddenPlan" }), false, true);
    expect(wrapper.text()).not.toContain("HiddenPlan");
  });
});
