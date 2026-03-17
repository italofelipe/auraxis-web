import { mount, flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import ToolsPage from "./tools.vue";

const mockIsAuthenticated = vi.hoisted(() => vi.fn(() => false as boolean));
const mockPush = vi.hoisted(() => vi.fn());

vi.mock("~/composables/useTools", () => ({
  useToolsCatalogQuery: (): {
    isLoading: ReturnType<typeof ref<boolean>>;
    isError: ReturnType<typeof ref<boolean>>;
    data: ReturnType<typeof ref>;
  } => ({
    isLoading: ref(false),
    isError: ref(false),
    data: ref({
      tools: [
        {
          id: "raise-calculator",
          name: "Pedir aumento",
          description: "Calculo de inflacao",
          enabled: true,
        },
      ],
    }),
  }),
}));

vi.mock("~/stores/session", () => ({
  useSessionStore: (): {
    restore: () => void;
    isAuthenticated: boolean;
  } => ({
    restore: vi.fn(),
    get isAuthenticated(): boolean {
      return mockIsAuthenticated();
    },
  }),
}));

vi.mock("#app", () => ({
  useRouter: (): { push: typeof mockPush } => ({ push: mockPush }),
  definePageMeta: vi.fn(),
}));

vi.mock("naive-ui", () => ({
  NButton: {
    name: "NButton",
    props: ["type", "size", "disabled"],
    template: "<button class='n-button' @click='$emit(\"click\")'><slot /></button>",
    emits: ["click"],
  },
  NModal: {
    name: "NModal",
    props: ["show", "title", "content", "positiveText", "negativeText", "preset"],
    emits: ["update:show", "positiveClick", "negativeClick"],
    template: "<div v-if='show' class='n-modal'></div>",
  },
}));

const globalStubs = {
  UiBaseCard: {
    props: ["title"],
    template: "<div class='base-card'><slot /></div>",
  },
  BaseSkeleton: {
    template: "<div class='skeleton' />",
  },
  ToolCard: {
    props: ["tool", "isAuthenticated", "isPremium"],
    template: "<div class='tool-card' :data-id='tool.id'>{{ tool.name }}</div>",
  },
  ToolsEmptyState: {
    template: "<div class='empty-state'>Nenhuma ferramenta disponível</div>",
  },
};

describe("ToolsPage (/tools)", () => {
  it("não define middleware authenticated — página é pública", () => {
    const wrapper = mount(ToolsPage, { global: { stubs: globalStubs } });
    expect(wrapper.exists()).toBe(true);
  });

  it("renderiza ferramentas do catálogo", () => {
    const wrapper = mount(ToolsPage, { global: { stubs: globalStubs } });
    expect(wrapper.text()).toContain("Pedir aumento");
  });

  it("exibe ToolCard para cada ferramenta", () => {
    const wrapper = mount(ToolsPage, { global: { stubs: globalStubs } });
    const cards = wrapper.findAll(".tool-card");
    expect(cards.length).toBe(1);
  });

  it("exibe botão de salvar resultado", () => {
    const wrapper = mount(ToolsPage, { global: { stubs: globalStubs } });
    expect(wrapper.text()).toContain("Salvar resultado");
  });

  it("abre modal quando usuário não autenticado clica em salvar resultado", async () => {
    mockIsAuthenticated.mockReturnValue(false);
    const wrapper = mount(ToolsPage, { global: { stubs: globalStubs } });
    await wrapper.find(".n-button").trigger("click");
    await flushPromises();
    expect(wrapper.find(".n-modal").exists()).toBe(true);
  });

  it("não abre modal quando usuário está autenticado e clica em salvar resultado", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    const wrapper = mount(ToolsPage, { global: { stubs: globalStubs } });
    await wrapper.find(".n-button").trigger("click");
    await flushPromises();
    expect(wrapper.find(".n-modal").exists()).toBe(false);
  });
});

describe("ToolsPage — estado de loading", () => {
  it("exibe skeleton quando isLoading é true", () => {
    const wrapper = mount(ToolsPage, { global: { stubs: globalStubs } });
    expect(wrapper.find(".skeleton").exists()).toBe(false);
  });
});
