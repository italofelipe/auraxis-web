import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App } from "vue";

import type { CreditCardDto } from "~/features/credit-cards/contracts/credit-card.dto";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

import CreditCardDetailPage from "./[id].vue";

const navigateToMock = vi.hoisted(() => vi.fn());
const queryClientHarness = vi.hoisted(() => ({ invalidateQueries: vi.fn() }));
const creditCardsHarness = vi.hoisted(() => ({
  data: { __v_isRef: true, value: [] as CreditCardDto[] },
  isLoading: { __v_isRef: true, value: false },
}));
const viewStateHarness = vi.hoisted(() => ({
  view: { __v_isRef: true, value: "faturas" as const },
  month: { __v_isRef: true, value: "2026-06" },
  monthLabel: { __v_isRef: true, value: "junho de 2026" },
  setView: vi.fn(),
  shiftMonth: vi.fn(),
}));
const createTransactionMutationHarness = vi.hoisted(() => ({
  isPending: { __v_isRef: true, value: false },
  mutate: vi.fn(),
}));
const deleteTransactionMutationHarness = vi.hoisted(() => ({
  isPending: { __v_isRef: true, value: false },
  mutate: vi.fn(),
}));
const toastHarness = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}));

vi.mock("#imports", () => ({
  definePageMeta: vi.fn(),
  navigateTo: navigateToMock,
  useHead: vi.fn(),
  useRoute: (): { params: { id: string } } => ({ params: { id: "cc-1" } }),
}));

vi.mock("#app", () => ({
  definePageMeta: vi.fn(),
  navigateTo: navigateToMock,
  useHead: vi.fn(),
  useRoute: (): { params: { id: string } } => ({ params: { id: "cc-1" } }),
}));

vi.mock("#app/composables/head", () => ({ useHead: vi.fn() }));
vi.mock("#app/composables/pages", () => ({ definePageMeta: vi.fn() }));
vi.mock("#app/composables/router", () => ({
  useRoute: (): { params: { id: string } } => ({ params: { id: "cc-1" } }),
  navigateTo: navigateToMock,
}));

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string) => string } => ({ t: (key: string): string => key }),
}));

vi.mock("@tanstack/vue-query", () => ({
  useQueryClient: (): typeof queryClientHarness => queryClientHarness,
}));

vi.mock("~/features/credit-cards/queries/use-credit-cards-query", () => ({
  useCreditCardsQuery: (): typeof creditCardsHarness => creditCardsHarness,
}));
vi.mock("~/features/credit-cards/composables/useCreditCardsViewState", () => ({
  useCreditCardsViewState: (): typeof viewStateHarness => viewStateHarness,
}));
vi.mock("~/features/credit-cards/composables/useCreditCardsStatement", () => ({
  useCreditCardsStatement: (): { statement: { value: unknown } } => ({
    statement: { value: { categories: [], monthlyTrend: [], railTotals: [], allCardsTotal: 0 } },
  }),
}));
vi.mock("~/features/credit-cards/composables/useCreditCardsAnalytics", () => ({
  useCreditCardsAnalytics: (): { analytics: { value: unknown } } => ({
    analytics: { value: { categories: [], cardTotals: [], topRows: [], monthlySeries: { months: [], series: [] }, kpis: {} } },
  }),
}));
vi.mock("~/features/transactions/queries/use-create-transaction-mutation", () => ({
  useCreateTransactionMutation: (): typeof createTransactionMutationHarness => createTransactionMutationHarness,
}));
vi.mock("~/features/transactions/queries/use-delete-transaction-mutation", () => ({
  useDeleteTransactionMutation: (): typeof deleteTransactionMutationHarness => deleteTransactionMutationHarness,
}));
vi.mock("~/composables/useToast", () => ({
  useToast: (): typeof toastHarness => toastHarness,
}));

vi.mock("~/features/credit-cards/components/FaturasView.vue", () => ({
  default: {
    props: ["statement", "cards", "selectedCardId", "singleCard"],
    emits: ["shift-month", "add-expense", "edit-expense", "duplicate-expense", "delete-expense"],
    data(): { invoiceItem: { creditCardId: string; transaction: Partial<TransactionDto> } } {
      return {
        invoiceItem: {
          creditCardId: "cc-1",
          transaction: {
            id: "tx-1",
            title: "Notebook Dell Inspiron",
            amount: "899.90",
            type: "expense",
            due_date: "2026-06-13",
            description: "Garantia estendida",
            currency: "BRL",
            status: "pending",
            tag_id: "tag-1",
            account_id: "acc-1",
            credit_card_id: "cc-1",
            is_recurring: false,
            is_installment: false,
          },
        },
      };
    },
    template: `
      <section data-testid="faturas-view">
        <button data-testid="fv-add-expense" @click="$emit('add-expense')">expense</button>
        <button data-testid="fv-edit-expense" @click="$emit('edit-expense', invoiceItem)">edit expense</button>
        <button data-testid="fv-duplicate-expense" @click="$emit('duplicate-expense', invoiceItem)">duplicate expense</button>
        <button data-testid="fv-delete-expense" @click="$emit('delete-expense', invoiceItem)">delete expense</button>
      </section>
    `,
  },
}));

vi.mock("~/features/credit-cards/components/AnaliticoView.vue", () => ({
  default: {
    props: ["analytics", "cards", "selectedCardId", "monthLabel", "singleCard"],
    emits: ["shift-month"],
    template: "<section data-testid='analitico-view' />",
  },
}));
vi.mock("~/features/credit-cards/components/CreditCardExpenseSheet.vue", () => ({
  default: {
    props: ["visible", "presetCreditCardId"],
    emits: ["update:visible", "success"],
    template: `
      <section v-if="visible" data-testid="credit-card-expense-drawer" :data-card-id="presetCreditCardId ?? ''">
        <button data-testid="drawer-success" @click="$emit('success')">success</button>
      </section>
    `,
  },
}));
vi.mock("~/features/credit-cards/components/CreditCardExpenseModal.vue", () => ({
  default: {
    props: ["visible", "transaction", "presetCreditCardId"],
    emits: ["update:visible", "saved", "duplicate", "remove"],
    template: `
      <section
        v-if="visible"
        data-testid="credit-card-expense-modal"
        :data-card-id="presetCreditCardId ?? ''"
        :data-transaction-id="transaction?.id ?? ''"
      >
        <button data-testid="expense-modal-saved-updated" @click="$emit('saved', 'updated')">updated</button>
        <button v-if="transaction" data-testid="expense-modal-duplicate" @click="$emit('duplicate', transaction)">duplicate</button>
        <button v-if="transaction" data-testid="expense-modal-remove" @click="$emit('remove', transaction)">remove</button>
      </section>
    `,
  },
}));
vi.mock("~/components/ui/UiIcon/UiIcon.vue", () => ({
  default: { props: ["name", "size"], template: "<i />" },
}));
vi.mock("~/components/ui/UiSegmentedControl/UiSegmentedControl.vue", () => ({
  default: {
    props: ["modelValue", "options", "ariaLabel"],
    emits: ["update:modelValue"],
    template: "<div data-testid='view-seg' />",
  },
}));

vi.mock("naive-ui", () => ({
  NButton: {
    props: ["disabled", "loading", "type", "text"],
    emits: ["click"],
    template: "<button :disabled='disabled || loading' @click='$emit(\"click\", $event)'><slot /></button>",
  },
  NEmpty: { props: ["description"], template: "<div data-testid='empty'>{{ description }}</div>" },
  NModal: {
    props: ["show", "title"],
    emits: ["update:show", "close"],
    template: `
      <section v-if="show" data-testid="delete-modal">
        <h2>{{ title }}</h2>
        <slot />
        <footer><slot name="action" /></footer>
      </section>
    `,
  },
  NSpin: { template: "<div data-testid='spinner' />" },
}));

/**
 * Builds a credit card fixture for the route card.
 *
 * @param overrides Fields to override.
 * @returns Credit card fixture.
 */
const cardFixture = (overrides: Partial<CreditCardDto> = {}): CreditCardDto => ({
  id: "cc-1",
  name: "Cartao Inter",
  brand: "mastercard",
  limit_amount: 23000,
  closing_day: 5,
  due_day: 12,
  bank: "Inter",
  description: null,
  benefits: ["Cashback"],
  created_at: null,
  updated_at: null,
  ...overrides,
});

/**
 * Installs the minimal Nuxt app context used by page tests.
 *
 * @param app Vue test app instance.
 */
function nuxtContextPlugin(app: App): void {
  Reflect.set(app, "$nuxt", {
    _route: { path: "/credit-cards/cc-1", meta: {}, params: { id: "cc-1" }, query: {} },
    $config: { public: {} },
    payload: { serverRendered: false },
    ssrContext: { head: { push: vi.fn(() => ({ patch: vi.fn(), dispose: vi.fn() })) } },
    static: { data: {} },
    isHydrating: false,
    deferHydration: (): void => {},
    runWithContext: <T>(callback: () => T): T => callback(),
    hooks: { callHook: vi.fn(), hook: vi.fn() },
    _asyncDataPromises: {},
    _asyncData: {},
  });
}

/**
 * Mounts the credit card detail page with the mocked Nuxt context.
 *
 * @returns Mounted page wrapper.
 */
const mountPage = (): ReturnType<typeof mount> =>
  mount(CreditCardDetailPage, { global: { plugins: [{ install: nuxtContextPlugin }] } });

describe("CreditCardDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    creditCardsHarness.data.value = [cardFixture()];
    creditCardsHarness.isLoading.value = false;
    viewStateHarness.view.value = "faturas";
    createTransactionMutationHarness.mutate.mockImplementation(
      (_payload: unknown, options?: { onSuccess?: () => void }) => options?.onSuccess?.(),
    );
    deleteTransactionMutationHarness.isPending.value = false;
    deleteTransactionMutationHarness.mutate.mockImplementation(
      (_payload: unknown, options?: { onSuccess?: () => void }) => options?.onSuccess?.(),
    );
  });

  it("opens the expense modal in new mode with the route card preselected", async () => {
    const wrapper = mountPage();

    await wrapper.get("[data-testid='cc-detail-add-expense']").trigger("click");

    const modal = wrapper.get("[data-testid='credit-card-expense-modal']");
    expect(modal.attributes("data-card-id")).toBe("cc-1");
    expect(modal.attributes("data-transaction-id")).toBe("");
  });

  it("opens the expense modal from an invoice row using the source transaction", async () => {
    const wrapper = mountPage();

    await wrapper.get("[data-testid='fv-edit-expense']").trigger("click");

    const modal = wrapper.get("[data-testid='credit-card-expense-modal']");
    expect(modal.attributes("data-card-id")).toBe("cc-1");
    expect(modal.attributes("data-transaction-id")).toBe("tx-1");
  });

  it("duplicates an invoice row through the transactions resource", async () => {
    const wrapper = mountPage();

    await wrapper.get("[data-testid='fv-duplicate-expense']").trigger("click");

    expect(createTransactionMutationHarness.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Notebook Dell Inspiron (cópia)",
        amount: "899.90",
        type: "expense",
        due_date: "2026-06-13",
        credit_card_id: "cc-1",
      }),
      expect.any(Object),
    );
    expect(queryClientHarness.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["credit-cards"] });
    expect(queryClientHarness.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(queryClientHarness.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
    expect(toastHarness.success).toHaveBeenCalledWith("Despesa duplicada");
  });

  it("confirms invoice row removal before deleting the source transaction", async () => {
    const wrapper = mountPage();

    await wrapper.get("[data-testid='fv-delete-expense']").trigger("click");

    expect(deleteTransactionMutationHarness.mutate).not.toHaveBeenCalled();
    expect(wrapper.get("[data-testid='delete-modal']").text()).toContain("Remover despesa?");
    expect(wrapper.get("[data-testid='delete-modal']").text()).toContain("desta fatura e das Transações");

    await wrapper.get("[data-testid='cc-expense-delete-confirm']").trigger("click");
    await flushPromises();

    expect(deleteTransactionMutationHarness.mutate).toHaveBeenCalledWith(
      { id: "tx-1", scope: "occurrence" },
      expect.any(Object),
    );
    expect(toastHarness.success).toHaveBeenCalledWith("Despesa removida de Cartões e Transações");
  });
});
