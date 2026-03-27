import type { Meta, StoryObj } from "@storybook/vue3";
import type { UiListPanelProps } from "./UiListPanel.types";
import UiListPanel from "./UiListPanel.vue";

const meta: Meta<typeof UiListPanel> = {
  title: "Design System/UiListPanel",
  component: UiListPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A reusable panel shell for dense lists and simple tables. Provides a header row (title + optional action), an optional filter area, and a scrollable content body. Delegates empty-state rendering to the consumer via the default slot.",
      },
    },
  },
  argTypes: {
    title: { control: "text" },
    loading: { control: "boolean" },
    loadingRows: { control: { type: "number", min: 1, max: 10 } },
  },
};

export default meta;

type Story = StoryObj<typeof UiListPanel>;

export const Default: Story = {
  args: { title: "Próximos vencimentos", loading: false },
  render: (args) => ({
    components: { UiListPanel },
    setup(): { args: UiListPanelProps } { return { args }; },
    template: `
      <UiListPanel v-bind="args">
        <div v-for="i in 4" :key="i" style="padding: 12px 16px; border: 1px solid var(--color-outline-soft); border-radius: var(--radius-md); background: var(--color-bg-elevated); display: flex; justify-content: space-between;">
          <div><strong>Conta {{ i }}</strong><p style="margin: 0; color: var(--color-text-muted); font-size: 13px;">Moradia</p></div>
          <strong>R$ {{ (i * 350).toLocaleString('pt-BR') }},00</strong>
        </div>
      </UiListPanel>
    `,
  }),
};

export const Loading: Story = {
  args: { title: "Próximos vencimentos", loading: true, loadingRows: 4 },
};

export const WithFilters: Story = {
  name: "With filter bar (UiSegmentedControl)",
  args: { title: "Transações", loading: false },
  render: (args) => ({
    components: { UiListPanel },
    setup(): { args: UiListPanelProps } { return { args }; },
    template: `
      <UiListPanel v-bind="args">
        <template #filters>
          <div style="display: inline-flex; gap: 4px;">
            <button v-for="opt in ['Todos', 'Receitas', 'Despesas']" :key="opt" style="padding: 4px 12px; border-radius: var(--radius-sm); border: 1px solid var(--color-outline-soft); background: var(--color-bg-elevated); cursor: pointer;">{{ opt }}</button>
          </div>
        </template>
        <div v-for="i in 3" :key="i" style="padding: 12px 16px; border: 1px solid var(--color-outline-soft); border-radius: var(--radius-md); background: var(--color-bg-elevated);">Transação {{ i }}</div>
      </UiListPanel>
    `,
  }),
};

export const WithHeaderAction: Story = {
  name: "With header action button",
  args: { title: "Despesas por categoria", loading: false },
  render: (args) => ({
    components: { UiListPanel },
    setup(): { args: UiListPanelProps } { return { args }; },
    template: `
      <UiListPanel v-bind="args">
        <template #header-action>
          <button style="font-size: 13px; padding: 4px 10px; border-radius: var(--radius-sm); border: 1px solid var(--color-outline-soft); background: transparent; cursor: pointer; color: var(--color-brand-500);">Ver tudo</button>
        </template>
        <div v-for="cat in ['Alimentação', 'Transporte', 'Moradia']" :key="cat" style="padding: 10px 12px; border: 1px solid var(--color-outline-soft); border-radius: var(--radius-md); background: var(--color-bg-elevated);">{{ cat }}</div>
      </UiListPanel>
    `,
  }),
};

export const EmptyState: Story = {
  name: "Empty state (no items)",
  args: { title: "Próximos vencimentos", loading: false },
  render: (args) => ({
    components: { UiListPanel },
    setup(): { args: UiListPanelProps } { return { args }; },
    template: `
      <UiListPanel v-bind="args">
        <div style="padding: 32px 16px; text-align: center; color: var(--color-text-muted);">Nenhum vencimento no período.</div>
      </UiListPanel>
    `,
  }),
};
