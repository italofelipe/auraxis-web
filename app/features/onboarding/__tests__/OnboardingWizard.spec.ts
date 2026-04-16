import { describe, it, expect, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { computed, type ComputedRef } from "vue";
import OnboardingWizard from "../components/OnboardingWizard.vue";

vi.mock("vue-i18n");

const mockSkip = vi.fn();
const mockComplete = vi.fn();

vi.mock("../composables/useOnboarding", () => ({
  useOnboarding: (): {
    shouldShow: ComputedRef<boolean>;
    start: () => void;
    complete: () => void;
    skip: () => void;
    reset: () => void;
  } => ({
    shouldShow: computed<boolean>(() => true),
    start: vi.fn(),
    complete: mockComplete,
    skip: mockSkip,
    reset: vi.fn(),
  }),
}));

/**
 * Mounts the wizard with its four step children stubbed so tests can drive
 * the step transitions without relying on real template content.
 *
 * @returns The mounted wizard wrapper ready for interaction assertions.
 */
function mountWizard(): VueWrapper {
  return mount(OnboardingWizard, {
    global: {
      stubs: {
        Teleport: { template: "<div><slot /></div>" },
        Transition: { template: "<slot />" },
        UiWizardProgress: true,
        OnboardingStep1Welcome: {
          name: "OnboardingStep1Welcome",
          template: "<div data-testid='step1'><button class='stub-next' @click=\"$emit('next')\">next</button></div>",
          emits: ["next"],
        },
        OnboardingStep2Transactions: {
          name: "OnboardingStep2Transactions",
          template: "<div data-testid='step2'><button class='stub-next' @click=\"$emit('next')\">next</button></div>",
          emits: ["next"],
        },
        OnboardingStep3GoalsVsBudgets: {
          name: "OnboardingStep3GoalsVsBudgets",
          template: "<div data-testid='step3'><button class='stub-next' @click=\"$emit('next')\">next</button></div>",
          emits: ["next"],
        },
        OnboardingStep4ToolsPortfolio: {
          name: "OnboardingStep4ToolsPortfolio",
          template: "<div data-testid='step4'><button class='stub-complete' @click=\"$emit('complete')\">done</button></div>",
          emits: ["complete"],
        },
      },
    },
  });
}

describe("OnboardingWizard", () => {
  it("renders the wizard dialog when shouldShow is true", () => {
    const wrapper = mountWizard();
    expect(wrapper.find(".onboarding-dialog").exists()).toBe(true);
  });

  it("starts on step 1", () => {
    const wrapper = mountWizard();
    expect(wrapper.find("[data-testid='step1']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='step2']").exists()).toBe(false);
  });

  it("advances through all four steps", async () => {
    const wrapper = mountWizard();
    await wrapper.find("[data-testid='step1'] .stub-next").trigger("click");
    expect(wrapper.find("[data-testid='step2']").exists()).toBe(true);

    await wrapper.find("[data-testid='step2'] .stub-next").trigger("click");
    expect(wrapper.find("[data-testid='step3']").exists()).toBe(true);

    await wrapper.find("[data-testid='step3'] .stub-next").trigger("click");
    expect(wrapper.find("[data-testid='step4']").exists()).toBe(true);
  });

  it("does not show back button on step 1", () => {
    const wrapper = mountWizard();
    expect(wrapper.find(".onboarding-dialog__btn-back").exists()).toBe(false);
  });

  it("shows back button on step 2", async () => {
    const wrapper = mountWizard();
    await wrapper.find("[data-testid='step1'] .stub-next").trigger("click");
    expect(wrapper.find(".onboarding-dialog__btn-back").exists()).toBe(true);
  });

  it("back button returns to previous step", async () => {
    const wrapper = mountWizard();
    await wrapper.find("[data-testid='step1'] .stub-next").trigger("click");
    await wrapper.find(".onboarding-dialog__btn-back").trigger("click");
    expect(wrapper.find("[data-testid='step1']").exists()).toBe(true);
  });

  it("calls complete() when step 4 emits complete", async () => {
    const wrapper = mountWizard();
    await wrapper.find("[data-testid='step1'] .stub-next").trigger("click");
    await wrapper.find("[data-testid='step2'] .stub-next").trigger("click");
    await wrapper.find("[data-testid='step3'] .stub-next").trigger("click");
    await wrapper.find("[data-testid='step4'] .stub-complete").trigger("click");
    expect(mockComplete).toHaveBeenCalled();
  });

  it("shows skip button", () => {
    const wrapper = mountWizard();
    expect(wrapper.find(".onboarding-dialog__btn-skip").exists()).toBe(true);
  });

  it("calls skip() when close button is clicked", async () => {
    const wrapper = mountWizard();
    await wrapper.find(".onboarding-dialog__close").trigger("click");
    expect(mockSkip).toHaveBeenCalled();
  });

  it("calls skip() when skip button is clicked", async () => {
    const wrapper = mountWizard();
    await wrapper.find(".onboarding-dialog__btn-skip").trigger("click");
    expect(mockSkip).toHaveBeenCalled();
  });
});
