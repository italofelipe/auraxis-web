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

const enabledFlags = vi.hoisted(() => new Set<string>());
vi.mock("~/shared/feature-flags/use-feature-flag", () => ({
  useFeatureFlag: (key: string): { value: boolean } => ({ value: enabledFlags.has(key) }),
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
    enabledFlags.clear();
    enabledFlags.add("web.import.csv-xlsx");
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

  it("emits the import path without creating a transaction", async () => {
    const wrapper = mount(OnboardingStep2Transactions);

    await wrapper.find("[data-testid='step2-import']").trigger("click");

    expect(wrapper.emitted("import")).toHaveLength(1);
    // Quem sai daqui não digitou nada: nada de mutation nem de step data.
    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(mockSetStepData).not.toHaveBeenCalled();
    expect(wrapper.emitted("next")).toBeUndefined();
  });

  it("blocks the import path while a submission is in flight", async () => {
    isPending.value = true;
    const wrapper = mount(OnboardingStep2Transactions);

    const button = wrapper.find("[data-testid='step2-import']");
    expect(button.attributes("disabled")).toBeDefined();

    await button.trigger("click");
    expect(wrapper.emitted("import")).toBeUndefined();
  });

  it("shows the import path when only the bank statement flag is on", () => {
    enabledFlags.clear();
    enabledFlags.add("web.import.bank-statement");
    const wrapper = mount(OnboardingStep2Transactions);

    expect(wrapper.find("[data-testid='step2-import']").exists()).toBe(true);
  });

  it("hides the import path when no import flag is on", () => {
    // Com as duas desligadas o caminho levaria a uma página que só sabe dizer
    // "indisponível" — pior que não oferecer.
    enabledFlags.clear();
    const wrapper = mount(OnboardingStep2Transactions);

    expect(wrapper.find("[data-testid='step2-import']").exists()).toBe(false);
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
