import type { Meta, StoryObj } from "@storybook/vue3";
import { defineComponent, h } from "vue";

import FeatureErrorBoundary from "./FeatureErrorBoundary.vue";

const meta: Meta<typeof FeatureErrorBoundary> = {
  title: "Design System/FeatureErrorBoundary",
  component: FeatureErrorBoundary,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Isola falhas de render de uma feature para que o restante do app continue funcional. Expõe `fallback` como slot nomeado com bindings `retry` e `errorMessage` para que cada feature renderize seu próprio estado de erro quando fizer sentido. Se nenhum fallback é passado, a boundary mostra um NAlert com botão de retry.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FeatureErrorBoundary>;

const BrokenChild = defineComponent({
  name: "BrokenChild",
  setup() {
    throw new Error("Falha simulada no render da feature.");
  },
  render: () => h("div"),
});

const HealthyChild = defineComponent({
  name: "HealthyChild",
  render: () =>
    h(
      "div",
      {
        style: {
          padding: "16px",
          border: "1px solid var(--color-outline-soft)",
          borderRadius: "var(--radius-md)",
          background: "var(--color-bg-elevated)",
        },
      },
      "Conteúdo da feature renderizado normalmente.",
    ),
});

export const Default: Story = {
  name: "Default (sem erro)",
  render: () => ({
    components: { FeatureErrorBoundary, HealthyChild },
    template: `
      <FeatureErrorBoundary>
        <HealthyChild />
      </FeatureErrorBoundary>
    `,
  }),
};

export const WithError: Story = {
  name: "Fallback padrão (erro capturado)",
  render: () => ({
    components: { FeatureErrorBoundary, BrokenChild },
    template: `
      <FeatureErrorBoundary>
        <BrokenChild />
      </FeatureErrorBoundary>
    `,
  }),
};

export const CustomFallback: Story = {
  name: "Fallback customizado (via slot)",
  render: () => ({
    components: { FeatureErrorBoundary, BrokenChild },
    template: `
      <FeatureErrorBoundary>
        <BrokenChild />
        <template #fallback="{ retry, errorMessage }">
          <div style="padding: 16px; border: 1px dashed var(--color-danger-400); border-radius: var(--radius-md); background: var(--color-bg-elevated); max-width: 480px;">
            <strong style="color: var(--color-danger-500);">Portfolio indisponível</strong>
            <p style="margin: 8px 0; color: var(--color-text-muted); font-size: 13px;">{{ errorMessage ?? 'Erro desconhecido' }}</p>
            <button @click="retry" style="padding: 6px 12px; border-radius: var(--radius-sm); border: 1px solid var(--color-brand-500); background: transparent; color: var(--color-brand-500); cursor: pointer;">Tentar novamente</button>
          </div>
        </template>
      </FeatureErrorBoundary>
    `,
  }),
};
