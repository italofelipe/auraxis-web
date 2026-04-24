import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref, type ComputedRef } from "vue";
import OnboardingSkipNudge from "../components/OnboardingSkipNudge.vue";

vi.mock("vue-i18n");

const mockStart = vi.fn();
const mockReset = vi.fn();
const _isSkipped = ref<boolean>(false);
const _isDone = ref<boolean>(false);

vi.mock("../composables/useOnboarding", () => ({
  useOnboarding: (): {
    isSkipped: ComputedRef<boolean>;
    isDone: ComputedRef<boolean>;
    start: () => void;
    reset: () => void;
  } => ({
    isSkipped: computed<boolean>(() => _isSkipped.value),
    isDone: computed<boolean>(() => _isDone.value),
    start: mockStart,
    reset: mockReset,
  }),
}));

describe("OnboardingSkipNudge", () => {
  beforeEach(() => {
    mockStart.mockReset();
    mockReset.mockReset();
    _isSkipped.value = false;
    _isDone.value = false;
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

  it("hides the nudge when the dismiss button is clicked without mutating state", async () => {
    _isSkipped.value = true;
    const wrapper = mount(OnboardingSkipNudge);
    await wrapper.find("[data-testid='onboarding-nudge-dismiss']").trigger("click");
    expect(wrapper.find("[data-testid='onboarding-skip-nudge']").exists()).toBe(false);
    expect(mockStart).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
  });
});
