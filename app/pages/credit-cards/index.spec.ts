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

vi.mock("#app/composables/head", () => ({
  useHead: vi.fn(),
}));

vi.mock("#app/composables/pages", () => ({
  definePageMeta: vi.fn(),
}));

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
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

vi.mock("~/features/credit-cards/components/CreditCardsTable.vue", () => ({
  default: {
    props: ["cards", "selectedCardId"],
    emits: ["select", "delete", "add-expense", "edit", "view-dashboard"],
    template: `
      <section data-testid="credit-cards-table" :data-selected-card-id="selectedCardId">
        <article v-for="card in cards" :key="card.id" :data-testid="'row-' + card.id">
          <button :data-testid="'select-' + card.id" @click="$emit('select', card)">{{ card.name }}</button>
          <button :data-testid="'delete-' + card.id" @click="$emit('delete', card)">Remover</button>
          <button :data-testid="'expense-' + card.id" @click="$emit('add-expense', card)">Lançar</button>
          <button :data-testid="'bill-' + card.id" @click="$emit('view-dashboard', card)">Abrir dashboard</button>
        </article>
      </section>
    `,
  },
}));

vi.mock("~/features/credit-cards/components/CreditCardCard.vue", () => ({
  default: {
    props: ["card", "selected"],
    emits: ["delete", "edit", "select", "view-bill"],
    template: `
      <article :data-testid="'card-' + card.id" :data-selected="selected ? 'true' : 'false'">
        <button :data-testid="'select-detail-' + card.id" @click="$emit('select', card)">{{ card.name }}</button>
        <button :data-testid="'delete-detail-' + card.id" @click="$emit('delete', card)">Remover</button>
        <button :data-testid="'bill-detail-' + card.id" @click="$emit('view-bill', card)">Ver fatura</button>
      </article>
    `,
  },
}));

vi.mock("~/features/credit-cards/components/CreditCardForm.vue", () => ({
  default: { template: "<form data-testid='credit-card-form' />" },
}));

vi.mock("~/features/ai-insights/components/AiInsightSurface.vue", () => ({
  default: { template: "<aside data-testid='ai-insight' />" },
}));

vi.mock("~/features/credit-cards/components/CreditCardExpenseDrawer.vue", () => ({
  default: {
    props: ["visible", "presetCreditCardId"],
    emits: ["update:visible", "success"],
    template: `
      <section
        v-if="visible"
        data-testid="credit-card-expense-drawer"
        :data-card-id="presetCreditCardId ?? ''"
      >
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
  NEmpty: { props: ["description"], template: "<div data-testid='empty'>{{ description }}</div>" },
  NModal: {
    props: ["show", "title", "content", "loading"],
    emits: ["update:show", "close"],
    template: `
      <section v-if="show" data-testid="delete-modal">
        <h2>{{ title }}</h2>
        <p v-if="content">{{ content }}</p>
        <slot />
        <footer><slot name="action" /></footer>
      </section>
    `,
  },
  NRadioButton: { props: ["value"], template: "<button><slot /></button>" },
  NRadioGroup: { props: ["value"], template: "<div><slot /></div>" },
  NSpin: { template: "<div data-testid='spinner' />" },
  NStatistic: { props: ["label"], template: "<div><span>{{ label }}</span><slot /></div>" },
  NTag: { template: "<span><slot /></span>" },
}));

/**
 * Builds a complete card fixture for the credit cards page tests.
 *
 * @param overrides Fields to override in the default card.
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
 * Installs the minimal Nuxt app context required by page-level auto-imports.
 *
 * @param app Vue test app instance.
 */
function nuxtContextPlugin(app: App): void {
  Reflect.set(app, "$nuxt", {
    _route: { path: "/credit-cards", meta: {}, params: {}, query: {} },
    $config: { public: {} },
    payload: { serverRendered: false },
    ssrContext: {
      head: {
        push: vi.fn(() => ({
          patch: vi.fn(),
          dispose: vi.fn(),
        })),
      },
    },
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
 * @returns Mounted credit cards page wrapper.
 */
const mountPage = (): ReturnType<typeof mount> =>
  mount(CreditCardsPage, {
    global: {
      plugins: [{ install: nuxtContextPlugin }],
    },
  });

describe("CreditCardsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    creditCardsHarness.data.value = [
      cardFixture(),
      cardFixture({
        id: "cc-2",
        name: "Cartao Azul",
        bank: "Itau",
      }),
    ];
    creditCardsHarness.isLoading.value = false;
    deleteMutationHarness.isPending.value = false;
    deleteMutationHarness.mutateAsync.mockResolvedValue(undefined);
  });

  it("não duplica o título da página nem exibe o eyebrow legado", () => {
    const wrapper = mountPage();

    expect(wrapper.find(".cc-hero__title").exists()).toBe(false);
    expect(wrapper.text()).not.toContain("Market Pulse Cards");
    expect(wrapper.text()).not.toContain("Hub premium para limites");
  });

  it("abre confirmacao de remocao sem chamar delete imediatamente", async () => {
    const wrapper = mountPage();

    await wrapper.get("[data-testid='delete-cc-1']").trigger("click");

    expect(deleteMutationHarness.mutateAsync).not.toHaveBeenCalled();
    expect(wrapper.get("[data-testid='delete-modal']").text()).toContain("Remover cartão?");
    expect(wrapper.get("[data-testid='delete-modal']").text()).toContain("Cartao Inter");
    expect(wrapper.get("[data-testid='delete-modal']").text()).not.toContain("1234");
  });

  it("cancelar fecha a confirmacao sem mutation", async () => {
    const wrapper = mountPage();

    await wrapper.get("[data-testid='delete-cc-1']").trigger("click");
    await wrapper.get("[data-testid='cc-delete-cancel']").trigger("click");

    expect(deleteMutationHarness.mutateAsync).not.toHaveBeenCalled();
    expect(wrapper.find("[data-testid='delete-modal']").exists()).toBe(false);
  });

  it("confirmar remocao chama a mutation com o id do cartao", async () => {
    const wrapper = mountPage();

    await wrapper.get("[data-testid='delete-cc-1']").trigger("click");
    await wrapper.get("[data-testid='cc-delete-confirm']").trigger("click");
    await flushPromises();

    expect(deleteMutationHarness.mutateAsync).toHaveBeenCalledWith("cc-1");
  });

  it("mantem a confirmacao estavel e botoes desabilitados durante loading", async () => {
    deleteMutationHarness.isPending.value = true;
    const wrapper = mountPage();

    await wrapper.get("[data-testid='delete-cc-1']").trigger("click");

    expect(wrapper.find("[data-testid='delete-modal']").exists()).toBe(true);
    expect(wrapper.get("[data-testid='cc-delete-cancel']").attributes("disabled")).toBeDefined();
    expect(wrapper.get("[data-testid='cc-delete-confirm']").attributes("disabled")).toBeDefined();
  });

  it("abre o drawer de despesa com o cartao selecionado", async () => {
    const wrapper = mountPage();

    await wrapper.get("[data-testid='select-cc-2']").trigger("click");
    await wrapper.get("[data-testid='cc-add-expense']").trigger("click");

    const drawer = wrapper.get("[data-testid='credit-card-expense-drawer']");
    expect(drawer.attributes("data-card-id")).toBe("cc-2");

    await wrapper.get("[data-testid='drawer-success']").trigger("click");
    expect(queryClientHarness.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["credit-cards"] });
    expect(queryClientHarness.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(queryClientHarness.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
  });
});
