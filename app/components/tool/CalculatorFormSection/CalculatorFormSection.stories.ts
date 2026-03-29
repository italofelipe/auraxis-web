import type { Meta, StoryObj } from "@storybook/vue3";
import CalculatorFormSection from "./CalculatorFormSection.vue";

interface FormSectionArgs {
  title?: string
  description?: string
  collapsible: boolean
  defaultExpanded: boolean
}

const meta: Meta<typeof CalculatorFormSection> = {
  title: "Features/Tools/CalculatorFormSection",
  component: CalculatorFormSection,
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    collapsible: { control: "boolean" },
    defaultExpanded: { control: "boolean" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Groups related form fields in a calculator with consistent layout and an optional title. Supports collapsible accordion mode via Naive UI NCollapse.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof CalculatorFormSection>;

export const Basic: Story = {
  args: {
    collapsible: false,
    defaultExpanded: true,
  },
  render: (args) => ({
    components: { CalculatorFormSection },
    setup(): { args: FormSectionArgs } { return { args: args as FormSectionArgs }; },
    template: `<CalculatorFormSection v-bind="args">
      <div style="padding:8px;background:var(--color-bg-elevated,#eee);border-radius:4px">Form field placeholder</div>
    </CalculatorFormSection>`,
  }),
};

export const WithTitle: Story = {
  args: {
    title: "Valores do produto",
    description: "Informe o preço à vista e os detalhes do parcelamento.",
    collapsible: false,
    defaultExpanded: true,
  },
  render: (args) => ({
    components: { CalculatorFormSection },
    setup(): { args: FormSectionArgs } { return { args: args as FormSectionArgs }; },
    template: `<CalculatorFormSection v-bind="args">
      <div style="padding:8px;background:var(--color-bg-elevated,#eee);border-radius:4px">Form fields here</div>
    </CalculatorFormSection>`,
  }),
};

export const CollapsibleExpanded: Story = {
  args: {
    title: "Configurações avançadas",
    description: "Taxa de oportunidade e inflação.",
    collapsible: true,
    defaultExpanded: true,
  },
  render: (args) => ({
    components: { CalculatorFormSection },
    setup(): { args: FormSectionArgs } { return { args: args as FormSectionArgs }; },
    template: `<CalculatorFormSection v-bind="args">
      <div style="padding:8px;background:var(--color-bg-elevated,#eee);border-radius:4px">Advanced fields</div>
    </CalculatorFormSection>`,
  }),
};

export const CollapsibleCollapsed: Story = {
  args: {
    title: "Configurações avançadas",
    collapsible: true,
    defaultExpanded: false,
  },
  render: (args) => ({
    components: { CalculatorFormSection },
    setup(): { args: FormSectionArgs } { return { args: args as FormSectionArgs }; },
    template: `<CalculatorFormSection v-bind="args">
      <div style="padding:8px;background:var(--color-bg-elevated,#eee);border-radius:4px">Advanced fields (collapsed by default)</div>
    </CalculatorFormSection>`,
  }),
};
