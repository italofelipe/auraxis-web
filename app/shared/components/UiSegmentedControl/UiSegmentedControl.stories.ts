import { ref, type Ref, type Component } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";
import type { UiSegmentedControlOption, UiSegmentedControlProps } from "./UiSegmentedControl.types";
import UiSegmentedControl from "./UiSegmentedControl.vue";

// Generic Vue components require a cast when used in Storybook Meta
const meta: Meta<UiSegmentedControlProps<string>> = {
  title: "Shared/UiSegmentedControl",
  component: UiSegmentedControl as unknown as Component,
  tags: ["autodocs"],
  argTypes: {
    ariaLabel: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<UiSegmentedControlProps<string>>;

const periodOptions: UiSegmentedControlOption<string>[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "year", label: "Ano" },
];

export const Default: Story = {
  args: {
    modelValue: "month",
    options: periodOptions,
    ariaLabel: "Selecionar período",
  },
  render: (args) => ({
    components: { UiSegmentedControl },
    setup(): { args: UiSegmentedControlProps<string>; value: Ref<string> } {
      const value = ref(args.modelValue);
      return { args, value };
    },
    template: "<UiSegmentedControl v-bind=\"args\" v-model=\"value\" />",
  }),
};

export const WithDisabledOption: Story = {
  args: {
    modelValue: "day",
    options: [
      { value: "day", label: "Dia" },
      { value: "week", label: "Semana" },
      { value: "month", label: "Mês", disabled: true },
      { value: "year", label: "Ano" },
    ],
    ariaLabel: "Selecionar período",
  },
  render: (args) => ({
    components: { UiSegmentedControl },
    setup(): { args: UiSegmentedControlProps<string>; value: Ref<string> } {
      const value = ref(args.modelValue);
      return { args, value };
    },
    template: "<UiSegmentedControl v-bind=\"args\" v-model=\"value\" />",
  }),
};
