import type { Meta, StoryObj } from "@storybook/vue3";
import type { UiChartPanelProps } from "./UiChartPanel.types";
import UiChartPanel from "./UiChartPanel.vue";

const meta: Meta<typeof UiChartPanel> = {
  title: "Design System/UiChartPanel",
  component: UiChartPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A reusable panel shell for ECharts visualizations. Provides a header row (title + optional subtitle + optional helper tooltip + optional actions slot), an animated loading skeleton, a chart body slot, and an optional legend slot. Delegates chart rendering to the consumer via the default slot.",
      },
    },
  },
  argTypes: {
    title:       { control: "text" },
    subtitle:    { control: "text" },
    helper:      { control: "text" },
    chartHeight: { control: "text" },
    loading:     { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof UiChartPanel>;

/** Canonical usage: panel with title and a placeholder chart area. */
export const Default: Story = {
  args: { title: "Evolução do saldo", subtitle: "Últimos 6 meses", loading: false, chartHeight: "260px" },
  render: (args) => ({
    components: { UiChartPanel },
    setup(): { args: UiChartPanelProps } { return { args }; },
    template: `
      <UiChartPanel v-bind="args">
        <div style="height: 260px; background: var(--color-bg-elevated); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-size: 14px;">
          ← UiChart would render here →
        </div>
      </UiChartPanel>
    `,
  }),
};

/** Loading state: skeleton replaces the chart body. */
export const Loading: Story = {
  args: { title: "Evolução do saldo", subtitle: "Últimos 6 meses", loading: true, chartHeight: "260px" },
};

/** Panel with a period-selector action in the header. */
export const WithActions: Story = {
  name: "With header actions",
  args: { title: "Receitas vs Despesas", loading: false, chartHeight: "260px" },
  render: (args) => ({
    components: { UiChartPanel },
    setup(): { args: UiChartPanelProps } { return { args }; },
    template: `
      <UiChartPanel v-bind="args">
        <template #actions>
          <select style="font-size: 12px; padding: 3px 8px; border-radius: var(--radius-sm); border: 1px solid var(--color-outline-soft); background: var(--color-bg-elevated); color: var(--color-text-primary); cursor: pointer;">
            <option>Este mês</option>
            <option>Último trimestre</option>
            <option>Este ano</option>
          </select>
        </template>
        <div style="height: 260px; background: var(--color-bg-elevated); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-size: 14px;">
          ← UiChart would render here →
        </div>
      </UiChartPanel>
    `,
  }),
};

/** Panel with helper tooltip and a custom legend row. */
export const WithHelperAndLegend: Story = {
  name: "With helper tooltip and legend",
  args: {
    title: "Alocação da carteira",
    helper: "Distribuição percentual dos ativos no período selecionado.",
    loading: false,
    chartHeight: "240px",
  },
  render: (args) => ({
    components: { UiChartPanel },
    setup(): { args: UiChartPanelProps } { return { args }; },
    template: `
      <UiChartPanel v-bind="args">
        <div style="height: 240px; background: var(--color-bg-elevated); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-size: 14px;">
          ← UiChart (pie) would render here →
        </div>
        <template #legend>
          <div v-for="item in [{ label: 'Renda Fixa', color: '#238554' }, { label: 'Ações', color: '#E67C35' }, { label: 'FIIs', color: '#4A90D9' }]" :key="item.label"
            style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--color-text-muted);">
            <span :style="{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, display: 'inline-block' }" />
            {{ item.label }}
          </div>
        </template>
      </UiChartPanel>
    `,
  }),
};

/** No header — panel without title or actions, chart body only. */
export const NoHeader: Story = {
  name: "No header (chart only)",
  args: { loading: false, chartHeight: "200px" },
  render: (args) => ({
    components: { UiChartPanel },
    setup(): { args: UiChartPanelProps } { return { args }; },
    template: `
      <UiChartPanel v-bind="args">
        <div style="height: 200px; background: var(--color-bg-elevated); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-size: 14px;">
          ← UiChart would render here →
        </div>
      </UiChartPanel>
    `,
  }),
};
