import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import { NTag, NButton, NSkeleton } from "naive-ui";

import PlanCard from "./PlanCard.vue";
import type { BillingCycle, PlanDto } from "~/features/subscription/contracts/subscription.dto";

// ── Fixtures ─────────────────────────────────────────────────────────────────

/**
 * Creates a minimal valid PlanDto for testing.
 *
 * @param overrides - Partial properties to override defaults.
 * @returns A complete PlanDto fixture.
 */
const makePlan = (overrides: Partial<PlanDto> = {}): PlanDto => ({
  slug: "pro",
  name: "Pro",
  price_monthly: 29.9,
  price_annual: 24.9,
  features: [
    { label: "Transações ilimitadas", included: true },
    { label: "Simulações financeiras", included: false },
  ],
  ...overrides,
});

type MountOptions = {
  plan?: PlanDto;
  isCurrent?: boolean;
  loading?: boolean;
  billingCycle?: BillingCycle;
};

/**
 * Mounts PlanCard with real Naive UI rendering.
 *
 * @param opts - Mount options bag.
 * @returns VueWrapper around the mounted component.
 */
function mountPlanCard(opts: MountOptions = {}): ReturnType<typeof mount> {
  const {
    plan = makePlan(),
    isCurrent = false,
    loading = false,
    billingCycle = "monthly",
  } = opts;

  return mount(PlanCard, {
    props: { plan, isCurrent, loading, billingCycle },
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
    const wrapper = mountPlanCard({ plan: makePlan({ name: "Pro" }) });
    expect(wrapper.text()).toContain("Pro");
  });

  it("shows 'Plano atual' NTag when isCurrent is true", () => {
    const wrapper = mountPlanCard({ isCurrent: true });
    const tag = wrapper.findComponent(NTag);
    expect(tag.exists()).toBe(true);
    expect(wrapper.text()).toContain("Plano atual");
  });

  it("does not show NTag when isCurrent is false", () => {
    const wrapper = mountPlanCard({ isCurrent: false });
    expect(wrapper.findComponent(NTag).exists()).toBe(false);
  });

  it("disables the subscribe button when isCurrent is true", () => {
    const wrapper = mountPlanCard({ isCurrent: true });
    const button = wrapper.findComponent(NButton);
    expect(button.props("disabled")).toBe(true);
  });

  it("enables the subscribe button when isCurrent is false", () => {
    const wrapper = mountPlanCard({ isCurrent: false });
    const button = wrapper.findComponent(NButton);
    expect(button.props("disabled")).toBe(false);
  });

  it("renders included features in the list", () => {
    const wrapper = mountPlanCard({
      plan: makePlan({ features: [{ label: "Relatórios avançados", included: true }] }),
    });
    expect(wrapper.text()).toContain("Relatórios avançados");
  });

  it("renders excluded features in the list", () => {
    const wrapper = mountPlanCard({
      plan: makePlan({ features: [{ label: "Suporte prioritário", included: false }] }),
    });
    expect(wrapper.text()).toContain("Suporte prioritário");
  });

  it("emits 'select' with plan slug when subscribe button is clicked (not current)", async () => {
    const wrapper = mountPlanCard({ plan: makePlan({ slug: "pro" }), isCurrent: false });
    await wrapper.findComponent(NButton).trigger("click");
    expect(wrapper.emitted("select")).toBeTruthy();
    expect(wrapper.emitted("select")![0]).toEqual(["pro"]);
  });

  it("does not emit 'select' when button is clicked on current plan", async () => {
    const wrapper = mountPlanCard({ isCurrent: true });
    await wrapper.findComponent(NButton).trigger("click");
    expect(wrapper.emitted("select")).toBeFalsy();
  });

  it("shows 'Grátis' when price_monthly is 0", () => {
    const wrapper = mountPlanCard({
      plan: makePlan({ slug: "free", price_monthly: 0, price_annual: 0 }),
    });
    expect(wrapper.text()).toContain("Grátis");
  });

  it("shows monthly price when billingCycle is monthly", () => {
    const wrapper = mountPlanCard({
      plan: makePlan({ price_monthly: 29.9, price_annual: 24.9 }),
      billingCycle: "monthly",
    });
    expect(wrapper.text()).toContain("29");
  });

  it("shows annual price when billingCycle is annual", () => {
    const wrapper = mountPlanCard({
      plan: makePlan({ price_monthly: 29.9, price_annual: 24.9 }),
      billingCycle: "annual",
    });
    expect(wrapper.text()).toContain("24");
  });

  it("shows billedAnnually note when billingCycle is annual and plan is paid", () => {
    const wrapper = mountPlanCard({
      plan: makePlan({ price_monthly: 29.9, price_annual: 24.9 }),
      billingCycle: "annual",
    });
    // Annual total: 24.9 * 12 = 298.80 — the formatted value contains "298"
    expect(wrapper.text()).toContain("298");
  });

  it("does not show annual note for free plan even with annual cycle", () => {
    const wrapper = mountPlanCard({
      plan: makePlan({ slug: "free", price_monthly: 0, price_annual: 0 }),
      billingCycle: "annual",
    });
    expect(wrapper.text()).not.toContain("ano");
  });

  it("shows skeleton elements when loading is true", () => {
    const wrapper = mountPlanCard({ loading: true });
    expect(wrapper.findAllComponents(NSkeleton).length).toBeGreaterThan(0);
  });

  it("hides plan name when loading is true", () => {
    const wrapper = mountPlanCard({ plan: makePlan({ name: "HiddenPlan" }), loading: true });
    expect(wrapper.text()).not.toContain("HiddenPlan");
  });
});
