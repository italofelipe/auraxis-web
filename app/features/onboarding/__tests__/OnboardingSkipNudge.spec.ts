import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref, type ComputedRef } from "vue";
import OnboardingSkipNudge from "../components/OnboardingSkipNudge.vue";

vi.mock("vue-i18n");

const mockStart = vi.fn();
const mockReset = vi.fn();
const mockDismissNudge = vi.fn(() => { _isNudgeDismissed.value = true; });
const _isSkipped = ref<boolean>(false);
const _isDone = ref<boolean>(false);
const _isNudgeDismissed = ref<boolean>(false);

vi.mock("../composables/useOnboarding", () => ({
  useOnboarding: (): {
    isSkipped: ComputedRef<boolean>;
    isNudgeDismissed: ComputedRef<boolean>;
    isDone: ComputedRef<boolean>;
    start: () => void;
    reset: () => void;
    dismissNudge: () => void;
  } => ({
    isSkipped: computed<boolean>(() => _isSkipped.value),
    isNudgeDismissed: computed<boolean>(() => _isNudgeDismissed.value),
    isDone: computed<boolean>(() => _isDone.value),
    start: mockStart,
    reset: mockReset,
    dismissNudge: mockDismissNudge,
  }),
}));

describe("OnboardingSkipNudge", () => {
  beforeEach(() => {
    mockStart.mockReset();
    mockReset.mockReset();
    mockDismissNudge.mockClear();
    _isSkipped.value = false;
    _isDone.value = false;
    _isNudgeDismissed.value = false;
  });

  it("does not render when the wizard was not skipped", () => {
    const wrapper = mount(OnboardingSkipNudge);
    expect(wrapper.find("[data-testid='onboarding-skip-nudge']").exists()).toBe(false);
  });

  it("does not render when the wizard is already done", () => {
    _isSkipped.value = true;
    _isDone.value = true;
    const wrapper = mount(OnboardingSkipNudge);
    expect(wrapper.find("[data-testid='onboarding-skip-nudge']").exists()).toBe(false);
  });

  it("renders when the wizard was skipped and not yet done", () => {
    _isSkipped.value = true;
    const wrapper = mount(OnboardingSkipNudge);
    expect(wrapper.find("[data-testid='onboarding-skip-nudge']").exists()).toBe(true);
  });

  it("calls start() when the resume button is clicked", async () => {
    _isSkipped.value = true;
    const wrapper = mount(OnboardingSkipNudge);
    await wrapper.find("[data-testid='onboarding-nudge-resume']").trigger("click");
    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("calls reset() and start() when the restart button is clicked", async () => {
    _isSkipped.value = true;
    const wrapper = mount(OnboardingSkipNudge);
    await wrapper.find("[data-testid='onboarding-nudge-restart']").trigger("click");
    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it("persists the dismissal instead of hiding only for the current session", async () => {
    _isSkipped.value = true;
    const wrapper = mount(OnboardingSkipNudge);

    await wrapper.find("[data-testid='onboarding-nudge-dismiss']").trigger("click");

    expect(mockDismissNudge).toHaveBeenCalledTimes(1);
    expect(wrapper.find("[data-testid='onboarding-skip-nudge']").exists()).toBe(false);
    expect(mockStart).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("stays hidden on a fresh mount once dismissed", () => {
    _isSkipped.value = true;
    _isNudgeDismissed.value = true;

    const wrapper = mount(OnboardingSkipNudge);

    expect(wrapper.find("[data-testid='onboarding-skip-nudge']").exists()).toBe(false);
  });
});
