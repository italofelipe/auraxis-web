import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";

import OnboardingStep2Transactions from "../components/OnboardingStep2Transactions.vue";

vi.mock("vue-i18n");

const mockSetStepData = vi.fn();
const mockGetStepData = vi.fn(() => undefined);

vi.mock("../composables/useOnboarding", () => ({
  useOnboarding: (): {
    getStepData: typeof mockGetStepData;
    setStepData: typeof mockSetStepData;
  } => ({
    getStepData: mockGetStepData,
    setStepData: mockSetStepData,
  }),
}));

const mockMutateAsync = vi.fn(() => Promise.resolve());
const isPending = ref<boolean>(false);

vi.mock("~/features/transactions/queries/use-create-transaction-mutation", () => ({
  useCreateTransactionMutation: (): {
    mutateAsync: typeof mockMutateAsync;
    isPending: typeof isPending;
  } => ({
    mutateAsync: mockMutateAsync,
    isPending,
  }),
}));

describe("OnboardingStep2Transactions", () => {
  beforeEach(() => {
    mockMutateAsync.mockClear();
    mockSetStepData.mockClear();
    isPending.value = false;
  });

  it("advances without creating a transaction when the step is skipped", async () => {
    const wrapper = mount(OnboardingStep2Transactions);

    await wrapper.find("[data-testid='step2-skip']").trigger("click");

    expect(wrapper.emitted("next")).toHaveLength(1);
    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(mockSetStepData).not.toHaveBeenCalled();
  });

  it("keeps the skip button available while the form is incomplete", () => {
    const wrapper = mount(OnboardingStep2Transactions);

    const submit = wrapper.find("[data-testid='step2-next']");
    const skip = wrapper.find("[data-testid='step2-skip']");

    expect(submit.attributes("disabled")).toBeDefined();
    expect(skip.attributes("disabled")).toBeUndefined();
  });

  it("blocks skipping while a submission is in flight", async () => {
    isPending.value = true;
    const wrapper = mount(OnboardingStep2Transactions);

    expect(wrapper.find("[data-testid='step2-skip']").attributes("disabled")).toBeDefined();
  });

  it("still creates the transaction through the primary CTA", async () => {
    const wrapper = mount(OnboardingStep2Transactions);

    await wrapper.find("[data-testid='onboarding-step2-title']").setValue("Salário");
    await wrapper.find("[data-testid='onboarding-step2-amount']").setValue("1500,00");
    await wrapper.find("[data-testid='onboarding-step2-form']").trigger("submit");
    await Promise.resolve();

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted("next")).toHaveLength(1);
  });
});
