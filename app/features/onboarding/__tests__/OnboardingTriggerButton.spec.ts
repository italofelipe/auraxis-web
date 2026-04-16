import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { computed, ref, type ComputedRef } from "vue";
import OnboardingTriggerButton from "../components/OnboardingTriggerButton.vue";

vi.mock("vue-i18n");

const mockStart = vi.fn();
const _shouldShow = ref<boolean>(false);

vi.mock("../composables/useOnboarding", () => ({
  useOnboarding: (): {
    shouldShow: ComputedRef<boolean>;
    start: () => void;
    complete: () => void;
    skip: () => void;
    reset: () => void;
  } => ({
    shouldShow: computed<boolean>(() => _shouldShow.value),
    start: mockStart,
    complete: vi.fn(),
    skip: vi.fn(),
    reset: vi.fn(),
  }),
}));

describe("OnboardingTriggerButton", () => {
  it("renders when the tour is not currently showing", () => {
    _shouldShow.value = false;
    const wrapper = mount(OnboardingTriggerButton);
    expect(wrapper.find("[data-testid='onboarding-trigger']").exists()).toBe(true);
  });

  it("is hidden when the tour is already showing", () => {
    _shouldShow.value = true;
    const wrapper = mount(OnboardingTriggerButton);
    expect(wrapper.find("[data-testid='onboarding-trigger']").exists()).toBe(false);
  });

  it("calls start() when clicked", async () => {
    _shouldShow.value = false;
    mockStart.mockClear();
    const wrapper = mount(OnboardingTriggerButton);
    await wrapper.find("[data-testid='onboarding-trigger']").trigger("click");
    expect(mockStart).toHaveBeenCalled();
  });
});
