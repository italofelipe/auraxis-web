import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App } from "vue";

import type { CreditCardDto } from "~/features/credit-cards/contracts/credit-card.dto";

import CreditCardsPage from "./index.vue";

const navigateToMock = vi.hoisted(() => vi.fn());
const queryClientHarness = vi.hoisted(() => ({ invalidateQueries: vi.fn() }));
const creditCardsHarness = vi.hoisted(() => ({
  data: { __v_isRef: true, value: [] as CreditCardDto[] },
  isLoading: { __v_isRef: true, value: false },
}));
const deleteMutationHarness = vi.hoisted(() => ({
  isPending: { __v_isRef: true, value: false },
  mutateAsync: vi.fn(),
}));
const createMutationHarness = vi.hoisted(() => ({
  isPending: { __v_isRef: true, value: false },
  mutateAsync: vi.fn(),
}));
const updateMutationHarness = vi.hoisted(() => ({
  isPending: { __v_isRef: true, value: false },
  mutateAsync: vi.fn(),
}));

vi.mock("#imports", () => ({
  definePageMeta: vi.fn(),
  navigateTo: navigateToMock,
  useHead: vi.fn(),
}));

vi.mock("#app", () => ({
  definePageMeta: vi.fn(),
  navigateTo: navigateToMock,
  useHead: vi.fn(),
}));

vi.mock("#app/composables/head", () => ({ useHead: vi.fn() }));
vi.mock("#app/composables/pages", () => ({ definePageMeta: vi.fn() }));

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string) => string } => ({ t: (key: string): string => key }),
}));

vi.mock("@tanstack/vue-query", () => ({
  useQueryClient: (): typeof queryClientHarness => queryClientHarness,
}));

vi.mock("~/features/credit-cards/queries/use-credit-cards-query", () => ({
  useCreditCardsQuery: (): typeof creditCardsHarness => creditCardsHarness,
}));
vi.mock("~/features/credit-cards/queries/use-create-credit-card-mutation", () => ({
  useCreateCreditCardMutation: (): typeof createMutationHarness => createMutationHarness,
}));
vi.mock("~/features/credit-cards/queries/use-update-credit-card-mutation", () => ({
  useUpdateCreditCardMutation: (): typeof updateMutationHarness => updateMutationHarness,
}));
vi.mock("~/features/credit-cards/queries/use-delete-credit-card-mutation", () => ({
  useDeleteCreditCardMutation: (): typeof deleteMutationHarness => deleteMutationHarness,
}));

// Composables de dados — mockados (lógica testada nos models). Retornam objetos
// "ref-like" que a página apenas repassa às views mockadas.
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

vi.mock("~/features/credit-cards/components/FaturasView.vue", () => ({
  default: {
    props: ["statement", "cards", "selectedCardId"],
    emits: ["select-card", "shift-month", "add-expense", "add-card", "edit-card", "delete-card"],
    template: `
      <section data-testid="faturas-view">
        <button data-testid="fv-select-cc-2" @click="$emit('select-card', 'cc-2')">select</button>
        <button data-testid="fv-add-expense" @click="$emit('add-expense')">expense</button>
        <button data-testid="fv-add-card" @click="$emit('add-card')">add</button>
        <button data-testid="fv-edit" @click="$emit('edit-card', { id: 'cc-1', name: 'Cartao Inter' })">edit</button>
        <button data-testid="fv-delete" @click="$emit('delete-card', { id: 'cc-1', name: 'Cartao Inter' })">del</button>
      </section>
    `,
  },
}));

vi.mock("~/features/credit-cards/components/AnaliticoView.vue", () => ({
  default: {
    props: ["analytics", "cards", "selectedCardId", "monthLabel"],
    emits: ["select-card", "shift-month"],
    template: "<section data-testid='analitico-view' />",
  },
}));

vi.mock("~/features/credit-cards/components/CreditCardForm.vue", () => ({
  default: { template: "<form data-testid='credit-card-form' />" },
}));
vi.mock("~/features/ai-insights/components/AiInsightSurface.vue", () => ({
  default: { template: "<aside data-testid='ai-insight' />" },
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

vi.mock("naive-ui", () => ({
  NButton: {
    props: ["disabled", "loading", "type"],
    emits: ["click"],
    template: "<button :disabled='disabled || loading' @click='$emit(\"click\", $event)'><slot /></button>",
  },
  NButtonGroup: { template: "<div><slot /></div>" },
  NEmpty: { props: ["description"], template: "<div data-testid='empty'>{{ description }}<slot name='extra' /></div>" },
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
 * Builds a credit card fixture.
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
 * Installs the minimal Nuxt app context for page-level auto-imports.
 *
 * @param app Vue test app instance.
 */
function nuxtContextPlugin(app: App): void {
  Reflect.set(app, "$nuxt", {
    _route: { path: "/credit-cards", meta: {}, params: {}, query: {} },
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
 * Mounts the credit cards page with the mocked Nuxt context.
 *
 * @returns Mounted page wrapper.
 */
const mountPage = (): ReturnType<typeof mount> =>
  mount(CreditCardsPage, { global: { plugins: [{ install: nuxtContextPlugin }] } });

describe("CreditCardsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    creditCardsHarness.data.value = [cardFixture(), cardFixture({ id: "cc-2", name: "Cartao Azul", bank: "Itau" })];
    creditCardsHarness.isLoading.value = false;
    deleteMutationHarness.isPending.value = false;
    deleteMutationHarness.mutateAsync.mockResolvedValue(undefined);
  });

  it("renders the view selector and the Faturas view by default", () => {
    const wrapper = mountPage();
    expect(wrapper.find("[data-testid='view-seg']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='faturas-view']").exists()).toBe(true);
  });

  it("opens the delete confirmation from the Faturas view without mutating", async () => {
    const wrapper = mountPage();
    await wrapper.get("[data-testid='fv-delete']").trigger("click");

    expect(deleteMutationHarness.mutateAsync).not.toHaveBeenCalled();
    expect(wrapper.get("[data-testid='delete-modal']").text()).toContain("Remover cartão?");
    expect(wrapper.get("[data-testid='delete-modal']").text()).toContain("Cartao Inter");
  });

  it("confirms removal calling the mutation with the card id", async () => {
    const wrapper = mountPage();
    await wrapper.get("[data-testid='fv-delete']").trigger("click");
    await wrapper.get("[data-testid='cc-delete-confirm']").trigger("click");
    await flushPromises();

    expect(deleteMutationHarness.mutateAsync).toHaveBeenCalledWith("cc-1");
  });

  it("opens the expense drawer preset with the selected card and invalidates on success", async () => {
    const wrapper = mountPage();

    await wrapper.get("[data-testid='fv-select-cc-2']").trigger("click");
    await wrapper.get("[data-testid='cc-add-expense']").trigger("click");

    const drawer = wrapper.get("[data-testid='credit-card-expense-drawer']");
    expect(drawer.attributes("data-card-id")).toBe("cc-2");

    await wrapper.get("[data-testid='drawer-success']").trigger("click");
    expect(queryClientHarness.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["credit-cards"] });
    expect(queryClientHarness.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(queryClientHarness.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
  });
});
