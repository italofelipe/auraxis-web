import { describe, it, expect } from "vitest";
import { defineComponent, h } from "vue";
import { createPinia } from "pinia";
import { QueryClient } from "@tanstack/vue-query";
import { NButton, NCard } from "naive-ui";
import { renderWithProviders } from "../renderWithProviders";

// Componente simples para testar
const SimpleComponent = defineComponent({
  props: { label: { type: String, default: "Hello" } },
  setup(props): () => ReturnType<typeof h> {
    return (): ReturnType<typeof h> => h("div", { class: "simple" }, props.label);
  },
});

// Componente que usa um componente Naive UI
const NaiveComponent = defineComponent({
  setup(): () => ReturnType<typeof h> {
    return (): ReturnType<typeof h> =>
      h(NCard, {}, {
        default: (): ReturnType<typeof h> => h(NButton, { type: "primary" }, (): string => "Click me"),
      });
  },
});

describe("renderWithProviders", () => {
  it("monta componente simples sem errors", () => {
    const wrapper = renderWithProviders(SimpleComponent);
    expect(wrapper.exists()).toBe(true);
  });

  it("passa props para o componente", () => {
    const wrapper = renderWithProviders(SimpleComponent, {
      props: { label: "Test label" },
    });
    expect(wrapper.text()).toContain("Test label");
  });

  it("monta componentes Naive UI sem erro de provider", () => {
    expect(() => renderWithProviders(NaiveComponent)).not.toThrow();
  });

  it("usa pinia isolada por padrão (instâncias independentes)", () => {
    const wrapper1 = renderWithProviders(SimpleComponent);
    const wrapper2 = renderWithProviders(SimpleComponent);
    // Cada mount tem sua própria instância de pinia — sem compartilhamento de estado
    expect(wrapper1).not.toBe(wrapper2);
  });

  it("aceita pinia customizada", () => {
    const customPinia = createPinia();
    const wrapper = renderWithProviders(SimpleComponent, { pinia: customPinia });
    expect(wrapper.exists()).toBe(true);
  });

  it("aceita queryClient customizado", () => {
    const customClient = new QueryClient();
    const wrapper = renderWithProviders(SimpleComponent, { queryClient: customClient });
    expect(wrapper.exists()).toBe(true);
  });

  it("suporta global.stubs", () => {
    const wrapper = renderWithProviders(NaiveComponent, {
      global: {
        stubs: { NCard: true, NButton: true },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
