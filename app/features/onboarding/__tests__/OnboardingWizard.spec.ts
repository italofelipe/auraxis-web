import { describe, it, expect, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { computed, type ComputedRef } from "vue";
import OnboardingWizard from "../components/OnboardingWizard.vue";

vi.mock("vue-i18n");

// Shared mock functions so the component and the test hold the same reference
const mockSkip = vi.fn();
const mockComplete = vi.fn();

vi.mock("../composables/useOnboarding", () => ({
  useOnboarding: (): {
    shouldShow: ComputedRef<boolean>;
    complete: () => void;
    skip: () => void;
    reset: () => void;
  } => ({
    shouldShow: computed<boolean>(() => true),
    complete: mockComplete,
    skip: mockSkip,
    reset: vi.fn(),
  }),
}));

describe("OnboardingWizard", () => {
  /**
   * Mounts the OnboardingWizard with all child components stubbed out for
   * fast, isolated unit tests.  Step stubs expose a trigger button so
   * advancing and completing the wizard can be tested without real step logic.
   *
   * @returns A mounted VueWrapper instance for the OnboardingWizard component.
   */
  function mountWizard(): VueWrapper {
    return mount(OnboardingWizard, {
      global: {
        stubs: {
          Teleport: { template: "<div><slot /></div>" },
          Transition: { template: "<slot />" },
          UiWizardProgress: true,
          OnboardingStep1Profile: {
            name: "OnboardingStep1Profile",
            template: "<div data-testid='step1'><button class='stub-next' @click=\"$emit('next')\">next</button></div>",
            emits: ["next"],
          },
          OnboardingStep2Transaction: {
            name: "OnboardingStep2Transaction",
            template: "<div data-testid='step2'><button class='stub-next' @click=\"$emit('next')\">next</button></div>",
            emits: ["next"],
          },
          OnboardingStep3Goals: {
            name: "OnboardingStep3Goals",
            template: "<div data-testid='step3'><button class='stub-complete' @click=\"$emit('complete')\">done</button></div>",
            emits: ["complete"],
          },
        },
      },
    });
  }

  it("renders the wizard dialog when shouldShow is true", () => {
    const wrapper = mountWizard();
    expect(wrapper.find(".onboarding-dialog").exists()).toBe(true);
  });

  it("starts on step 1", () => {
    const wrapper = mountWizard();
    expect(wrapper.find("[data-testid='step1']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='step2']").exists()).toBe(false);
  });

  it("advances to step 2 when step 1 emits next", async () => {
    const wrapper = mountWizard();
    await wrapper.find("[data-testid='step1'] .stub-next").trigger("click");
    expect(wrapper.find("[data-testid='step2']").exists()).toBe(true);
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
