import type { Meta, StoryObj } from "@storybook/vue3";
import DetailedBreakdownPanel, { type BreakdownSection } from "./DetailedBreakdownPanel.vue";

interface BreakdownArgs {
  sections: BreakdownSection[]
  defaultExpanded: string[]
}

const meta: Meta<typeof DetailedBreakdownPanel> = {
  title: "Features/Tools/DetailedBreakdownPanel",
  component: DetailedBreakdownPanel,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Generic accordion panel for showing analytical breakdown sections. Each section key maps to a named slot `section-{key}` or an optional inline component.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof DetailedBreakdownPanel>;

const singleSection: BreakdownSection[] = [
  { key: "formula", title: "Entenda o cálculo" },
];

const multiSections: BreakdownSection[] = [
  { key: "formula", title: "Entenda o cálculo" },
  { key: "break-even", title: "Break-even e comparação detalhada" },
  { key: "schedule", title: "Cronograma mês a mês" },
];

export const SingleSection: Story = {
  args: {
    sections: singleSection,
    defaultExpanded: [],
  },
  render: (args) => ({
    components: { DetailedBreakdownPanel },
    setup(): { args: BreakdownArgs } { return { args: args as BreakdownArgs }; },
    template: `<DetailedBreakdownPanel v-bind="args">
      <template #section-formula>
        <p>Fórmula: VP = PMT / (1 + i)^n — valor presente descontado pela taxa de oportunidade.</p>
      </template>
    </DetailedBreakdownPanel>`,
  }),
};

export const MultiSection: Story = {
  args: {
    sections: multiSections,
    defaultExpanded: [],
  },
  render: (args) => ({
    components: { DetailedBreakdownPanel },
    setup(): { args: BreakdownArgs } { return { args: args as BreakdownArgs }; },
    template: `<DetailedBreakdownPanel v-bind="args">
      <template #section-formula>
        <p>Fórmula do cálculo de valor presente.</p>
      </template>
      <template #section-break-even>
        <p>Break-even: desconto mínimo para empatar com o parcelamento.</p>
      </template>
      <template #section-schedule>
        <p>Tabela com o cronograma mês a mês das parcelas.</p>
      </template>
    </DetailedBreakdownPanel>`,
  }),
};

export const AllExpanded: Story = {
  args: {
    sections: multiSections,
    defaultExpanded: ["formula", "break-even", "schedule"],
  },
  render: (args) => ({
    components: { DetailedBreakdownPanel },
    setup(): { args: BreakdownArgs } { return { args: args as BreakdownArgs }; },
    template: `<DetailedBreakdownPanel v-bind="args">
      <template #section-formula>
        <p>Fórmula do cálculo de valor presente.</p>
      </template>
      <template #section-break-even>
        <p>Break-even: desconto mínimo para empatar com o parcelamento.</p>
      </template>
      <template #section-schedule>
        <p>Tabela com o cronograma mês a mês das parcelas.</p>
      </template>
    </DetailedBreakdownPanel>`,
  }),
};
