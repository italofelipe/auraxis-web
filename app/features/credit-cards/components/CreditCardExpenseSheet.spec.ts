import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CreditCardExpenseSheet from "./CreditCardExpenseSheet.vue";

const mutationHarness = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock("~/features/credit-cards/queries/use-credit-cards-query", () => ({
  useCreditCardsQuery: (): { data: { value: unknown[] } } => ({ data: { value: [] } }),
}));
vi.mock("~/features/credit-cards/queries/use-credit-card-utilization-query", () => ({
  useCreditCardUtilizationQuery: (): { data: { value: undefined } } => ({ data: { value: undefined } }),
}));
vi.mock("~/features/tags/queries/use-tags-query", () => ({
  useTagsQuery: (): { data: { value: unknown[] } } => ({ data: { value: [] } }),
}));
vi.mock("~/features/accounts/queries/use-accounts-query", () => ({
  useAccountsQuery: (): { data: { value: unknown[] } } => ({ data: { value: [] } }),
}));
vi.mock("~/features/transactions/queries/use-create-transaction-mutation", () => ({
  useCreateTransactionMutation: (): typeof mutationHarness => mutationHarness,
}));

vi.mock("~/components/ui/UiBottomSheet/UiBottomSheet.vue", () => ({
  default: {
    props: ["modelValue"],
    emits: ["update:modelValue"],
    template: "<div v-if='modelValue'><slot name='header' /><slot /><slot name='footer' /></div>",
  },
}));
vi.mock("~/components/ui/UiMoneyInput/UiMoneyInput.vue", () => ({
  default: {
    props: ["value"],
    emits: ["update:value"],
    template: "<button class='mock-money' @click=\"$emit('update:value', 1200)\">money</button>",
  },
}));
vi.mock("~/components/ui/UiSegmentedControl/UiSegmentedControl.vue", () => ({
  default: {
    props: ["modelValue", "options"],
    emits: ["update:modelValue"],
    template: "<div class='mock-seg' />",
  },
}));
vi.mock("~/components/ui/UiIcon/UiIcon.vue", () => ({
  default: { props: ["name", "size"], template: "<i />" },
}));

vi.mock("naive-ui", () => ({
  NButton: {
    props: ["disabled", "loading", "type"],
    emits: ["click"],
    template: "<button :disabled='disabled || loading' @click='$emit(\"click\")'><slot /></button>",
  },
  NSelect: { props: ["value", "options"], template: "<select />" },
  NDatePicker: { props: ["value"], template: "<input class='date' />" },
  NInputNumber: { props: ["value"], template: "<input class='num' />" },
  NCheckbox: { props: ["checked"], template: "<label><slot /></label>" },
  NAlert: { props: ["title", "type"], template: "<div class='alert'>{{ title }}</div>" },
}));

describe("CreditCardExpenseSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutationHarness.mutateAsync.mockResolvedValue([{}]);
  });

  /**
   * Mounts the sheet visible with a null preset card.
   *
   * @returns Mounted wrapper.
   */
  const mountSheet = (): ReturnType<typeof mount> =>
    mount(CreditCardExpenseSheet, { props: { visible: true, presetCreditCardId: null } });

  it("renders the title and submit button", () => {
    const wrapper = mountSheet();
    expect(wrapper.text()).toContain("Lançar despesa no cartão");
    expect(wrapper.find("[data-testid='ces-submit']").exists()).toBe(true);
  });

  it("disables submit until an amount is entered (card never required)", async () => {
    const wrapper = mountSheet();
    expect(wrapper.get("[data-testid='ces-submit']").attributes("disabled")).toBeDefined();

    await wrapper.get(".mock-money").trigger("click");
    expect(wrapper.get("[data-testid='ces-submit']").attributes("disabled")).toBeUndefined();
  });

  it("creates a single expense with a null card when none is selected", async () => {
    const wrapper = mountSheet();
    await wrapper.get(".mock-money").trigger("click");
    await wrapper.get("[data-testid='ces-submit']").trigger("click");

    expect(mutationHarness.mutateAsync).toHaveBeenCalledTimes(1);
    const payload = mutationHarness.mutateAsync.mock.calls[0]?.[0];
    expect(payload).toMatchObject({ credit_card_id: null, is_installment: false, amount: "1200.00" });
    expect(wrapper.emitted("success")).toBeTruthy();
    expect(wrapper.emitted("update:visible")?.at(-1)).toEqual([false]);
  });
});
