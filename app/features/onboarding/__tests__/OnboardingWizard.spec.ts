import { describe, it, expect, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { computed, ref, type ComputedRef, type Ref } from "vue";
import OnboardingWizard from "../components/OnboardingWizard.vue";
import type { OnboardingStepNumber } from "../composables/useOnboarding";

vi.mock("vue-i18n");

const navigateToMock = vi.hoisted(() => vi.fn());
mockNuxtImport("navigateTo", () => navigateToMock);

const captureMock = vi.hoisted(() => vi.fn());
vi.mock("~/composables/useAnalytics/useAnalytics", () => ({
  useAnalytics: (): { capture: typeof captureMock; identify: ReturnType<typeof vi.fn>; reset: ReturnType<typeof vi.fn> } => ({
    capture: captureMock,
    identify: vi.fn(),
    reset: vi.fn(),
  }),
}));

const mockSkip = vi.fn();
const mockComplete = vi.fn();

const currentStepRef: Ref<OnboardingStepNumber> = ref<OnboardingStepNumber>(1);

vi.mock("../composables/useOnboarding", () => ({
  useOnboarding: (): {
    shouldShow: ComputedRef<boolean>;
    start: () => void;
    complete: () => void;
    skip: () => void;
    reset: () => void;
    currentStep: Ref<OnboardingStepNumber>;
    setCurrentStep: (step: OnboardingStepNumber) => void;
  } => ({
    shouldShow: computed<boolean>(() => true),
    start: vi.fn(),
    complete: mockComplete,
    skip: mockSkip,
    reset: vi.fn(),
    currentStep: currentStepRef,
    setCurrentStep: (step: OnboardingStepNumber): void => {
      currentStepRef.value = step;
    },
  }),
}));

/**
 * Mounts the wizard with all step children stubbed so tests can drive
 * transitions without relying on real template content. Also resets the
 * shared mocks so each test starts from step 1.
 *
 * @returns The mounted wizard wrapper ready for interaction assertions.
 */
function mountWizard(): VueWrapper {
  currentStepRef.value = 1;
  mockSkip.mockReset();
  mockComplete.mockReset();
  navigateToMock.mockReset();
  captureMock.mockReset();
  return mount(OnboardingWizard, {
    global: {
      stubs: {
        Teleport: { template: "<div><slot /></div>" },
        Transition: { template: "<slot />" },
        UiWizardProgress: true,
        OnboardingTourStep: {
          name: "OnboardingTourStep",
          template: "<div data-testid='tour-step'><button class='stub-next' @click=\"$emit('next')\">next</button></div>",
          emits: ["next"],
        },
        OnboardingStep1Welcome: {
          name: "OnboardingStep1Welcome",
          template: "<div data-testid='step1'><button class='stub-next' @click=\"$emit('next')\">next</button></div>",
          emits: ["next"],
        },
        OnboardingStep2Transactions: {
          name: "OnboardingStep2Transactions",
          template: "<div data-testid='step2'><button class='stub-next' @click=\"$emit('next')\">next</button><button class='stub-import' @click=\"$emit('import')\">import</button></div>",
          emits: ["next", "import"],
        },
        OnboardingStep3GoalsVsBudgets: {
          name: "OnboardingStep3GoalsVsBudgets",
          template: "<div data-testid='step3'><button class='stub-complete' @click=\"$emit('complete')\">done</button></div>",
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

  it("starts on the narrative tour step", () => {
    const wrapper = mountWizard();
    expect(wrapper.find("[data-testid='tour-step']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='step1']").exists()).toBe(false);
  });

  it("advances from the tour into the setup steps", async () => {
    const wrapper = mountWizard();
    await wrapper.find("[data-testid='tour-step'] .stub-next").trigger("click");
    expect(wrapper.find("[data-testid='tour-step']").exists()).toBe(true);

    await wrapper.find("[data-testid='tour-step'] .stub-next").trigger("click");
    await wrapper.find("[data-testid='tour-step'] .stub-next").trigger("click");
    expect(wrapper.find("[data-testid='step1']").exists()).toBe(true);
  });

  it("does not show back button on step 1", () => {
    const wrapper = mountWizard();
    expect(wrapper.find(".onboarding-dialog__btn-back").exists()).toBe(false);
  });

  it("shows back button on step 2", async () => {
    const wrapper = mountWizard();
    await wrapper.find("[data-testid='tour-step'] .stub-next").trigger("click");
    expect(wrapper.find(".onboarding-dialog__btn-back").exists()).toBe(true);
  });

  it("back button returns to previous step", async () => {
    const wrapper = mountWizard();
    await wrapper.find("[data-testid='tour-step'] .stub-next").trigger("click");
    await wrapper.find(".onboarding-dialog__btn-back").trigger("click");
    expect(wrapper.find("[data-testid='tour-step']").exists()).toBe(true);
  });

  it("calls complete() when the final setup step emits complete", async () => {
    const wrapper = mountWizard();
    await wrapper.find("[data-testid='tour-step'] .stub-next").trigger("click");
    await wrapper.find("[data-testid='tour-step'] .stub-next").trigger("click");
    await wrapper.find("[data-testid='tour-step'] .stub-next").trigger("click");
    await wrapper.find("[data-testid='step1'] .stub-next").trigger("click");
    await wrapper.find("[data-testid='step2'] .stub-next").trigger("click");
    await wrapper.find("[data-testid='step3'] .stub-complete").trigger("click");
    expect(mockComplete).toHaveBeenCalled();
  });

  it("shows skip button", () => {
    const wrapper = mountWizard();
    expect(wrapper.find(".onboarding-dialog__btn-skip").exists()).toBe(true);
  });

  it("calls skip() when close button is clicked", async () => {
    // reason: exercises the wizard close affordance, not a vitest test skip.
    const wrapper = mountWizard();
    await wrapper.find(".onboarding-dialog__close").trigger("click");
    expect(mockSkip).toHaveBeenCalled();
  });

  it("calls skip() when skip button is clicked", async () => {
    // reason: exercises the wizard skip affordance, not a vitest test skip.
    const wrapper = mountWizard();
    await wrapper.find(".onboarding-dialog__btn-skip").trigger("click");
    expect(mockSkip).toHaveBeenCalled();
  });

  describe("caminho de import no passo da primeira transação", () => {
    /**
     * Leva o wizard até o passo da primeira transação.
     *
     * @param wrapper Wizard já montado.
     */
    async function goToStep2(wrapper: VueWrapper): Promise<void> {
      for (let i = 0; i < 3; i += 1) {
        await wrapper.find("[data-testid='tour-step'] .stub-next").trigger("click");
      }
      await wrapper.find("[data-testid='step1'] .stub-next").trigger("click");
    }

    it("fecha o overlay e navega para o import marcando o passo como concluído", async () => {
      const wrapper = mountWizard();
      await goToStep2(wrapper);

      await wrapper.find("[data-testid='step2'] .stub-import").trigger("click");

      // O passo conta como concluído: a retomada cai na etapa de metas, não
      // de volta no formulário que o usuário decidiu não preencher.
      expect(currentStepRef.value).toBe(6);
      // Sem fechar, o diálogo cobriria a própria página de import.
      expect(mockSkip).toHaveBeenCalledTimes(1);
      expect(navigateToMock).toHaveBeenCalledWith("/transactions/import?from=onboarding");
    });

    it("registra a escolha do caminho na analytics", async () => {
      const wrapper = mountWizard();
      await goToStep2(wrapper);

      await wrapper.find("[data-testid='step2'] .stub-import").trigger("click");

      expect(captureMock).toHaveBeenCalledWith("onboarding_step_completed", {
        step: 5,
        total_steps: 6,
        direction: "import",
      });
    });

    it("não conclui o onboarding — o tour continua retomável", async () => {
      const wrapper = mountWizard();
      await goToStep2(wrapper);

      await wrapper.find("[data-testid='step2'] .stub-import").trigger("click");

      expect(mockComplete).not.toHaveBeenCalled();
    });
  });
});
